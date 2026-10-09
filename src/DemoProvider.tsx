import React, { useMemo, useState } from 'react';
import { Entry, Gift, Couple, Stroke, computeStreak, dayKey, DataCtx } from './data';
import { DAILY_REWARDED_ENTRIES, giftOf, POINTS_PER_ENTRY } from './theme';

// Örnek veri: Firebase'e dokunmaz, hepsi bellekte durur; sayfa yenilenince sıfırlanır.
const ME = 'me';
const HER = 'her';

// Emoji içeren SVG, resim olarak yüklenince her tarayıcıda çizilmeyebiliyor; bu yüzden küçük bir canvas'ta JPEG'e çeviriyoruz.
const avatar = (emoji: string, a: string, b: string) => {
  const c = document.createElement('canvas');
  c.width = c.height = 192;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 192, 192);
  grad.addColorStop(0, a); grad.addColorStop(1, b);
  g.fillStyle = grad; g.fillRect(0, 0, 192, 192);
  g.font = '104px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji, 96, 104);
  return c.toDataURL('image/jpeg', 0.85);
};

const day = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return dayKey(d); };
const at = (offset: number, hour: number) => { const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(hour, 0, 0, 0); return d.getTime(); };

const DRAWING: Stroke[] = [
  { d: 'M150 232 C60 165 62 92 112 92 C134 92 150 108 150 124 C150 108 166 92 188 92 C238 92 240 165 150 232', color: '#FF5C8A', w: 9 },
  { d: 'M236 52 m-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0', color: '#FFB400', w: 6 },
  { d: 'M236 14 L236 2 M236 90 L236 102 M198 52 L186 52 M274 52 L286 52 M209 25 L201 17 M263 79 L271 87', color: '#FFB400', w: 5 },
  { d: 'M60 270 L60 236 M60 236 C46 232 44 214 60 212 C60 196 84 198 82 214 C98 214 98 236 82 236 Z', color: '#6BCB77', w: 5 },
  { d: 'M20 282 L282 282', color: '#6BCB77', w: 6 },
];

const NOTES_ME = ['Günaydın bebeğim ☀️', 'Bugün seni çok düşündüm 💭', 'Akşam film mi izleyelim? 🍿', 'Kahveni içtin mi? ☕', 'Seninle her gün daha güzel 🌷', 'İyi geceler, tatlı rüyalar 🌙'];
const NOTES_HER = ['Sabah mesajın günümü kurtardı 🥹', 'Ben de seni! Çok özledim 💗', 'Olur! Ben patlamış mısır alırım 😋', 'İçtim, teşekkür ederim canım ☕', 'Sen benim en sevdiğim insansın 🌸', 'Sana sarılmak istiyorum 🧸'];

function seed() {
  const entries: Entry[] = [];
  let id = 0;
  for (let i = 6; i >= 1; i--) {
    entries.push({ id: 'e' + id++, from: ME, day: day(-i), type: 'note', text: NOTES_ME[6 - i], createdAt: at(-i, 9) });
    entries.push({ id: 'e' + id++, from: HER, day: day(-i), type: 'note', text: NOTES_HER[6 - i], createdAt: at(-i, 10) });
  }
  entries.push({ id: 'e' + id++, from: HER, day: day(-2), type: 'drawing', strokes: DRAWING, createdAt: at(-2, 15) });
  entries.push({ id: 'e' + id++, from: HER, day: day(0), type: 'note', text: 'Bugün sana küçük bir sürpriz bıraktım 💝', createdAt: at(0, 8) });
  entries.push({ id: 'e' + id++, from: HER, day: day(0), type: 'drawing', strokes: DRAWING, createdAt: at(0, 9) });

  const gifts: Gift[] = [
    { id: 'g1', from: HER, to: ME, kind: 'bear', day: day(0), saved: false, createdAt: at(0, 9) },
    { id: 'g2', from: HER, to: ME, kind: 'rose', day: day(0), saved: false, createdAt: at(0, 9) },
    { id: 'g3', from: ME, to: HER, kind: 'flower', day: day(0), saved: false, createdAt: at(0, 7) },
    { id: 'g4', from: HER, to: ME, kind: 'cake', day: day(-1), saved: true, createdAt: at(-1, 12) },
    { id: 'g5', from: ME, to: HER, kind: 'crown', day: day(-3), saved: true, createdAt: at(-3, 12) },
    { id: 'g6', from: HER, to: ME, kind: 'cat', day: day(-4), saved: true, createdAt: at(-4, 12) },
  ];
  return { entries, gifts };
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const init = useMemo(seed, []);
  const [entries, setEntries] = useState<Entry[]>(init.entries);
  const [gifts, setGifts] = useState<Gift[]>(init.gifts);
  const [points, setPoints] = useState(135);

  const couple: Couple = {
    id: 'demo', code: 'DEMO12', members: [ME, HER], names: { [ME]: 'Efe', [HER]: 'Ece' }, points: { [ME]: points, [HER]: 80 },
    photos: { [ME]: avatar('🦊', '#FFD6A5', '#FF9F6B'), [HER]: avatar('🐰', '#FFC6DD', '#FF7AA8') },
  };

  const value = {
    ready: true, error: null, uid: ME, couple, entries, gifts, partnerId: HER,
    streak: computeStreak(entries, couple.members), myPoints: points,
    async createCouple() {}, async joinCouple() {}, async savePush() {}, async logout() {},
    async setPhoto() {},
    async sendEntry(e: { type: 'note' | 'drawing'; text?: string; strokes?: Stroke[] }) {
      const sent = entries.filter((x) => x.from === ME && x.day === day(0)).length;
      const reward = sent < DAILY_REWARDED_ENTRIES ? POINTS_PER_ENTRY : 0;
      setEntries((p) => [{ id: 'e' + Date.now(), from: ME, day: day(0), createdAt: Date.now(), ...e }, ...p]);
      setPoints((p) => p + reward);
      return reward;
    },
    async sendGift(kind: string) {
      const g = giftOf(kind);
      if (points < g.cost) throw new Error('Yeterli puanın yok.');
      setPoints((p) => p - g.cost);
      setGifts((p) => [{ id: 'g' + Date.now(), from: ME, to: HER, kind, day: day(0), saved: false, createdAt: Date.now() }, ...p]);
    },
    async saveGift(id: string) { setGifts((p) => p.map((g) => (g.id === id ? { ...g, saved: true } : g))); },
  };

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}
