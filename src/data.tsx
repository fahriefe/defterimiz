import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signOut, User } from 'firebase/auth';
import {
  addDoc, arrayUnion, collection, deleteField, doc, getDoc, increment, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { pingPush } from './push';
import { DAILY_REWARDED_ENTRIES, GiftKind, giftOf, POINTS_PER_ENTRY } from './theme';

export type Stroke = { d: string; color: string; w: number };
export type Entry = { id: string; from: string; day: string; type: 'note' | 'drawing'; text?: string; strokes?: Stroke[]; createdAt: number };
export type Gift = { id: string; from: string; to: string; kind: GiftKind; day: string; saved: boolean; createdAt: number };
export type Couple = { id: string; code: string; members: string[]; names: Record<string, string>; points: Record<string, number>; photos?: Record<string, string>; push?: Record<string, string> };

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** İkimizin de en az bir şey gönderdiği ardışık gün sayısı. Bugün henüz tamamlanmadıysa dünden saymaya başlar. */
export function completedDays(entries: Entry[], members: string[]) {
  const byDay = new Map<string, Set<string>>();
  entries.forEach((e) => byDay.set(e.day, (byDay.get(e.day) ?? new Set()).add(e.from)));
  const out = new Set<string>();
  if (members.length < 2) return out;
  byDay.forEach((who, k) => { if (members.every((m) => who.has(m))) out.add(k); });
  return out;
}

export function computeStreak(entries: Entry[], members: string[]) {
  if (members.length < 2) return 0;
  const days = completedDays(entries, members);
  const done = (k: string) => days.has(k);
  const d = new Date();
  if (!done(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (done(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

type Ctx = {
  ready: boolean; error: string | null; uid: string; couple: Couple | null; entries: Entry[]; gifts: Gift[];
  partnerId: string | null; streak: number; myPoints: number;
  createCouple(name: string): Promise<void>;
  joinCouple(name: string, code: string): Promise<void>;
  sendEntry(e: { type: 'note' | 'drawing'; text?: string; strokes?: Stroke[] }): Promise<number>;
  sendGift(kind: GiftKind): Promise<void>;
  saveGift(id: string): Promise<void>;
  setPhoto(dataUrl: string): Promise<void>;
  savePush(subscription: string): Promise<void>;
  logout(): Promise<void>;
};
const DataCtx = createContext<Ctx>(null as any);
export const useData = () => useContext(DataCtx);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [coupleId, setCoupleId] = useState<string | null | undefined>(undefined);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fail = (where: string) => (e: any) => setError(`${where}: ${e?.code ?? e?.message ?? e}`);

  useEffect(() => onAuthStateChanged(auth, (u) => (u ? setUser(u) : void signInAnonymously(auth).catch(fail('Giriş')))), []);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (s) => setCoupleId(s.exists() ? s.data().coupleId : null), fail('Veritabanı'));
  }, [user]);
  useEffect(() => {
    if (!coupleId) { setCouple(null); setEntries([]); setGifts([]); return; }
    const base = doc(db, 'couples', coupleId);
    const subs = [
      onSnapshot(base, (s) => { if (s.exists()) setCouple({ id: s.id, ...(s.data() as any) }); }),
      onSnapshot(query(collection(base, 'entries'), orderBy('createdAt', 'desc'), limit(300)),
        (s) => setEntries(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))),
      onSnapshot(query(collection(base, 'gifts'), orderBy('createdAt', 'desc'), limit(300)),
        (s) => setGifts(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))),
    ];
    return () => subs.forEach((u) => u());
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId || !couple?.code || !user || couple.members.length !== 1 || couple.members[0] !== user.uid) return;
    setDoc(doc(db, 'codes', couple.code), { coupleId, owner: user.uid }).catch(() => {});
  }, [coupleId, couple?.code, couple?.members.length]);

  const uid = user?.uid ?? '';
  const value = useMemo<Ctx>(() => {
    const partnerId = couple?.members.find((m) => m !== uid) ?? null;
    return {
      ready: coupleId !== undefined, error, uid, couple, entries, gifts, partnerId,
      streak: couple ? computeStreak(entries, couple.members) : 0,
      myPoints: couple?.points?.[uid] ?? 0,

      async createCouple(name) {
        // 6 harfli kodu "codes" koleksiyonuna da yaz; katılırken sorgu yerine doğrudan bu kayıt okunur
        const ref = await addDoc(collection(db, 'couples'), {
          code: '', members: [uid], names: { [uid]: name }, points: { [uid]: 0 }, createdAt: Date.now(),
        });
        let code = '';
        for (let i = 0; i < 8 && !code; i++) {
          const c = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'X');
          try { await setDoc(doc(db, 'codes', c), { coupleId: ref.id, owner: uid }); code = c; } catch {}
        }
        if (!code) throw new Error('Kod üretilemedi, tekrar dene.');
        await updateDoc(ref, { code });
        await setDoc(doc(db, 'users', uid), { coupleId: ref.id });
      },
      async joinCouple(name, rawCode) {
        const code = rawCode.trim().toUpperCase();
        const c = await getDoc(doc(db, 'codes', code));
        if (!c.exists()) throw new Error('Bu kodla eşleşen bir çift bulunamadı.');
        const ref = doc(db, 'couples', c.data().coupleId);
        let snap;
        try { snap = await getDoc(ref); } catch { throw new Error('Bu çift zaten dolu.'); }
        if (!snap.exists()) throw new Error('Bu kodla eşleşen bir çift bulunamadı.');
        const members: string[] = snap.data().members ?? [];
        if (members.includes(uid)) { await setDoc(doc(db, 'users', uid), { coupleId: ref.id }); return; }
        if (members.length >= 2) throw new Error('Bu çift zaten dolu.');
        await updateDoc(ref, { members: arrayUnion(uid), [`names.${uid}`]: name, [`points.${uid}`]: 0 });
        await setDoc(doc(db, 'users', uid), { coupleId: ref.id });
      },
      async sendEntry(e) {
        const today = dayKey();
        const sentToday = entries.filter((x) => x.from === uid && x.day === today).length;
        const reward = sentToday < DAILY_REWARDED_ENTRIES ? POINTS_PER_ENTRY : 0;
        const base = doc(db, 'couples', coupleId!);
        await addDoc(collection(base, 'entries'), { ...e, from: uid, day: today, createdAt: Date.now() });
        if (reward) await updateDoc(base, { [`points.${uid}`]: increment(reward) });
        if (partnerId && couple?.push?.[partnerId]) pingPush(couple.push[partnerId]);
        return reward;
      },
      async sendGift(kind) {
        const g = giftOf(kind);
        if (!couple || !partnerId) throw new Error('Önce eşinin katılması lazım.');
        if ((couple.points[uid] ?? 0) < g.cost) throw new Error('Yeterli puanın yok.');
        const base = doc(db, 'couples', coupleId!);
        await updateDoc(base, { [`points.${uid}`]: increment(-g.cost) });
        await addDoc(collection(base, 'gifts'), { from: uid, to: partnerId, kind, day: dayKey(), saved: false, createdAt: Date.now() });
        if (couple.push?.[partnerId]) pingPush(couple.push[partnerId]);
      },
      async logout() {
        // eşin bu cihaza boşuna bildirim göndermesin
        if (coupleId) { try { await updateDoc(doc(db, 'couples', coupleId), { [`push.${uid}`]: deleteField() }); } catch {} }
        await signOut(auth);
        setCoupleId(undefined); setCouple(null); setEntries([]); setGifts([]); setUser(null);
      },
      async savePush(sub) { await updateDoc(doc(db, 'couples', coupleId!), { [`push.${uid}`]: sub }); },
      async setPhoto(dataUrl) { await updateDoc(doc(db, 'couples', coupleId!), { [`photos.${uid}`]: dataUrl }); },
      async saveGift(id) { await updateDoc(doc(db, 'couples', coupleId!, 'gifts', id), { saved: true }); },
    };
  }, [coupleId, uid, couple, entries, gifts, error]);

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}
