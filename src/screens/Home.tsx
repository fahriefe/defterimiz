import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { completedDays, dayKey, Gift, useData } from '../data';
import { Avatar, pickAvatar, Btn, Burst, Card, CoinPill, Note, Polaroid, Screen, SectionTitle, Txt, notify, shareText } from '../ui';
import { BUILD, C, giftOf, shadow } from '../theme';
import { play } from '../sounds';
import { isIOS, isInstalled, diagnose, permission, pushConfigured, pushSupported, subscribePush } from '../push';

const DAY = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];

function useLoop(from: number, to: number, ms: number) {
  const v = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: to, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: from, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return v;
}

function GiftItem({ gift, mine, big }: { gift: Gift; mine: boolean; big: boolean }) {
  const { saveGift } = useData();
  const scale = useRef(new Animated.Value(1)).current;
  const bob = useLoop(0, -8, 1300);
  const [burst, setBurst] = useState(0);
  const g = giftOf(gift.kind);

  const tap = () => {
    play(g.sound);
    setBurst((b) => b + 1);
    scale.setValue(0.55);
    Animated.spring(scale, { toValue: 1, friction: 3, tension: 130, useNativeDriver: true }).start();
  };

  return (
    <View style={{ alignItems: 'center', margin: 10, minWidth: 110 }}>
      <Pressable onPress={tap} style={{ width: big ? 130 : 80, height: big ? 130 : 80, alignItems: 'center', justifyContent: 'center' }}>
        <Burst emoji={g.emoji} trigger={burst} />
        <Animated.Text style={{ fontSize: big ? (g.tier === 'efsane' ? 100 : 78) : 50, transform: [{ translateY: bob }, { scale }] }}>{g.emoji}</Animated.Text>
      </Pressable>
      {mine ? (
        <Txt size={12} color={C.soft}>sen yolladın</Txt>
      ) : gift.saved ? (
        <View style={{ backgroundColor: C.mint, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Txt v="bold" size={12} color={C.mintDeep}>💾 anı oldu</Txt>
        </View>
      ) : (
        <Pressable onPress={() => saveGift(gift.id)} style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, ...shadow }}>
          <Txt v="black" size={12} color={C.pinkDeep}>💾 Anı olarak sakla</Txt>
        </Pressable>
      )}
    </View>
  );
}

export default function Home({ go }: { go: (t: 'compose' | 'shop') => void }) {
  const { couple, uid, partnerId, entries, gifts, streak, myPoints, setPhoto, savePush, logout } = useData();
  const [confirmOut, setConfirmOut] = useState(false);
  const [diag, setDiag] = useState<string[] | null>(null);
  const [perm, setPerm] = useState(permission());
  const { width } = useWindowDimensions();
  const beat = useLoop(1, 1.25, 700);
  // izin zaten verilmişse bu cihazın bildirim adresini sessizce güncel tut
  useEffect(() => {
    if (!couple || !pushConfigured() || permission() !== 'granted') return;
    subscribePush(false).then((s) => { if (s && couple.push?.[uid] !== s) savePush(s); }).catch(() => {});
  }, [couple?.id]);

  const enablePush = async () => {
    try {
      const s = await subscribePush(true);
      setPerm(permission());
      if (s) { await savePush(s); notify('Bildirimler açıldı 🔔', 'Eşin bir şey bırakınca haber vereceğiz.'); }
    } catch { notify('Olmadı 🥺', 'Bildirim açılamadı, tekrar dene.'); }
  };

  if (!couple) return null;

  const photos = couple.photos ?? {};
  const changePhoto = async () => {
    try {
      const p = await pickAvatar();
      if (p) { await setPhoto(p); notify('Fotoğrafın güncellendi 📸'); }
    } catch { notify('Olmadı 🥺', 'Fotoğraf seçilemedi, izin verdiğinden emin ol.'); }
  };

  const today = dayKey();
  const myName = couple.names[uid] ?? '';
  const partnerName = partnerId ? couple.names[partnerId] : null;
  const todayGifts = gifts.filter((g) => g.day === today && (g.to === uid || g.from === uid));
  const myDone = entries.some((e) => e.from === uid && e.day === today);
  const partnerDone = !!partnerId && entries.some((e) => e.from === partnerId && e.day === today);
  const fromPartnerToday = entries.filter((e) => e.from === partnerId && e.day === today);
  const done = completedDays(entries, couple.members);
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { k: dayKey(d), l: DAY[d.getDay()] }; });
  const size = Math.min(width, 520) - 40 - 56;

  const nudge = !partnerId ? 'Eşini davet et, serimiz başlasın!'
    : streak === 0 && !myDone ? 'Bugün ilk adımı sen at 💌'
    : myDone && !partnerDone ? `Sıra ${partnerName}'de, seriyi kaybetmeyin!`
    : !myDone && partnerDone ? `${partnerName} yazdı, sıra sende 🥺`
    : 'Bugün ikiniz de tamamladınız 🎉';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={myName} i={0} photo={photos[uid]} onPress={changePhoto} badge />
          <Animated.Text style={{ fontSize: 22, marginHorizontal: -6, zIndex: 2, transform: [{ scale: beat }] }}>💗</Animated.Text>
          <Avatar name={partnerName ?? '?'} i={1} photo={partnerId ? photos[partnerId] : undefined} />
        </View>
        <CoinPill n={myPoints} />
      </View>

      <Txt v="black" size={26}>Merhaba {myName} 🌷</Txt>
      <Txt size={14} color={C.soft} style={{ marginBottom: 16 }}>{nudge}</Txt>

      <LinearGradient colors={['#FFB38A', '#FF7A9C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ borderRadius: 32, padding: 20, marginBottom: 16 }, shadow]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Txt v="black" size={64} color="#fff" style={{ lineHeight: 70 }}>{streak}</Txt>
          <Txt v="black" size={20} color="#fff" style={{ marginBottom: 12, marginLeft: 8 }}>gün üst üste 🔥</Txt>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
          {week.map((d, i) => {
            const ok = done.has(d.k);
            return (
              <View key={d.k} style={{ alignItems: 'center' }}>
                <Txt v="bold" size={11} color="rgba(255,255,255,0.85)" style={{ marginBottom: 5 }}>{d.l}</Txt>
                <View style={{
                  width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: ok ? '#fff' : 'rgba(255,255,255,0.28)', borderWidth: i === 6 ? 2.5 : 0, borderColor: '#fff',
                }}>
                  {ok && <Txt size={16}>❤️</Txt>}
                </View>
              </View>
            );
          })}
        </View>
      </LinearGradient>

      {pushConfigured() && (
        pushSupported() && perm === 'default' ? (
          <Card style={{ alignItems: 'center' }}>
            <Txt v="black" size={17}>🔔 Bildirimleri aç</Txt>
            <Txt size={13} color={C.soft} style={{ textAlign: 'center', marginVertical: 6 }}>Eşin bir not, çizim ya da hediye bırakınca telefonuna haber verelim.</Txt>
            <Btn title="Bildirimleri aç" onPress={enablePush} />
          </Card>
        ) : !pushSupported() && isIOS() && !isInstalled() ? (
          <Card><Txt size={13} color={C.soft} style={{ textAlign: 'center' }}>🔔 Bildirim almak için uygulamayı önce ana ekrana ekle (Paylaş → Ana Ekrana Ekle), sonra ana ekrandaki simgeden aç.</Txt></Card>
        ) : perm === 'denied' ? (
          <Card><Txt size={13} color={C.soft} style={{ textAlign: 'center' }}>🔕 Bildirimler kapalı. Telefon ayarlarından Defterimiz için bildirimlere izin ver.</Txt></Card>
        ) : null
      )}

      {pushConfigured() && (pushSupported() || isIOS()) && (
        <View style={{ marginBottom: 14, alignItems: 'center' }}>
          <Pressable onPress={async () => { setDiag(['⏳ Kontrol ediliyor…']); setDiag(await diagnose(!!(partnerId && couple.push?.[partnerId]))); }} hitSlop={8}>
            <Txt v="bold" size={13} color={C.pinkDeep}>🔧 Bildirimi test et</Txt>
          </Pressable>
          {diag && (
            <Card style={{ width: '100%', marginTop: 10, marginBottom: 0 }}>
              {diag.map((l, i) => <Txt key={i} size={13} style={{ marginBottom: 4 }}>{l}</Txt>)}
            </Card>
          )}
        </View>
      )}

      {!partnerId ? (
        <Card style={{ alignItems: 'center' }}>
          <Txt v="black" size={18}>Eşini davet et 💞</Txt>
          <Txt size={13} color={C.soft} style={{ marginTop: 2 }}>Bu kodu ona gönder</Txt>
          <View style={{ backgroundColor: C.pinkSoft, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 24, marginVertical: 14 }}>
            <Txt v="black" size={36} color={C.pinkDeep} style={{ letterSpacing: 8 }}>{couple.code}</Txt>
          </View>
          <Btn title="Kodu paylaş" onPress={() => shareText(`Defterimiz'e katıl 💌 Kodumuz: ${couple.code}`)} />
        </Card>
      ) : (
        <Card>
          <SectionTitle>Bugün</SectionTitle>
          {[{ n: 'Sen', who: myName, ok: myDone, i: 0 }, { n: partnerName!, who: partnerName!, ok: partnerDone, i: 1 }].map((r) => (
            <View key={r.i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Avatar name={r.who} i={r.i} size={40} photo={r.i === 0 ? photos[uid] : partnerId ? photos[partnerId] : undefined} />
              <Txt v="bold" size={16} style={{ flex: 1, marginLeft: 12 }}>{r.n}</Txt>
              <View style={{ backgroundColor: r.ok ? C.mint : C.butter, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Txt v="black" size={13} color={r.ok ? C.mintDeep : C.butterDeep}>{r.ok ? 'Gönderdi ✓' : 'Bekliyor…'}</Txt>
              </View>
            </View>
          ))}
          {!myDone && <Btn title="✏️ Bir şeyler yaz ya da çiz" onPress={() => go('compose')} style={{ marginTop: 6 }} />}
        </Card>
      )}

      {todayGifts.length > 0 && (
        <LinearGradient colors={['#F3EBFF', '#FFE9F1']} style={[{ borderRadius: 32, padding: 18, marginBottom: 16, alignItems: 'center' }, shadow]}>
          <Txt v="black" size={18}>Bugünün hediyeleri 🎁</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 6 }}>
            {todayGifts.map((g) => <GiftItem key={g.id} gift={g} mine={g.from === uid} big={g.to === uid} />)}
          </View>
          <Txt size={12} color={C.soft} style={{ textAlign: 'center' }}>Dokununca ses çıkarır · sadece bugün geçerli, saklarsan anı olur</Txt>
        </LinearGradient>
      )}

      {fromPartnerToday.length > 0 && <SectionTitle>{partnerName} sana bıraktı 💌</SectionTitle>}
      {fromPartnerToday.map((e, i) => e.type === 'note'
        ? <Note key={e.id} text={e.text ?? ''} caption={partnerName ?? ''} i={i} />
        : <Polaroid key={e.id} strokes={e.strokes ?? []} size={size} caption={partnerName ?? ''} tilt={i % 2 ? 1.5 : -1.5} />)}

      {partnerId && <Btn title="🎁 Hediye gönder" kind="soft" onPress={() => go('shop')} />}

      <View style={{ alignItems: 'center', marginTop: 28 }}>
        {!confirmOut ? (
          <Pressable onPress={() => setConfirmOut(true)} hitSlop={10}>
            <Txt v="bold" size={14} color={C.soft}>Çıkış yap</Txt>
          </Pressable>
        ) : (
          <Card style={{ alignItems: 'center', width: '100%' }}>
            <Txt v="black" size={16}>Çıkış yapmak istediğine emin misin?</Txt>
            <Txt size={13} color={C.soft} style={{ textAlign: 'center', marginVertical: 8 }}>
              Bu cihazdan çıkınca bu çifte geri dönemezsin. Notlar ve anılar kaybolmaz ama sana bağlı kalmaz. Eşinle yeniden eşleşmen gerekir.
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn title="Vazgeç" kind="soft" onPress={() => setConfirmOut(false)} />
              <Btn title="Çıkış yap" onPress={() => logout()} />
            </View>
          </Card>
        )}
        <Txt size={11} color={C.soft} style={{ marginTop: 14, opacity: 0.7 }}>Defterimiz {BUILD}</Txt>
      </View>
    </Screen>
  );
}
