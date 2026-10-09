import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useData } from '../data';
import { CoinPill, Screen, Txt, notify } from '../ui';
import { C, GIFTS, Gift_, Tier, shadow } from '../theme';
import { play } from '../sounds';

const SECTIONS: { tier: Tier; title: string; sub: string }[] = [
  { tier: 'mini', title: 'Minik sürprizler 🍬', sub: 'Her gün alınır' },
  { tier: 'ozel', title: 'Özel hediyeler 💝', sub: 'Biraz biriktirmek gerekir' },
  { tier: 'efsane', title: 'Efsane hediyeler 👑', sub: 'Haftalarca biriktirilir, ama değer!' },
];

export default function Shop() {
  const { myPoints, sendGift, couple, partnerId } = useData();
  const [busy, setBusy] = useState(false);
  const partnerName = partnerId ? couple?.names[partnerId] : null;

  const send = async (g: Gift_) => {
    setBusy(true);
    try {
      await sendGift(g.kind);
      play(g.sound);
      notify(`${g.emoji} Yolladın!`, `${g.name}, ${partnerName}'in ekranında bugün boyunca duracak.`);
    } catch (e: any) { notify('Olmadı 🥺', e.message); }
    setBusy(false);
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt v="black" size={28}>Hediye dükkânı</Txt>
        <CoinPill n={myPoints} />
      </View>
      <Txt size={14} color={C.soft} style={{ marginTop: 4, marginBottom: 12 }}>
        {partnerId ? `${partnerName}'i mutlu et! Hediye bugün boyunca ekranında durur, isterse anı olarak saklar.` : 'Hediye yollayabilmek için eşinin katılması lazım.'}
      </Txt>

      {SECTIONS.map(({ tier, title, sub }) => (
        <View key={tier} style={{ marginTop: 14 }}>
          <Txt v="black" size={20}>{title}</Txt>
          <Txt size={12} color={C.soft} style={{ marginBottom: 12 }}>{sub}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
            {GIFTS.filter((g) => g.tier === tier).map((g) => {
              const ok = myPoints >= g.cost && !!partnerId;
              const inner = (
                <>
                  <Txt size={tier === 'efsane' ? 64 : 54}>{g.emoji}</Txt>
                  <Txt v="black" size={16} style={{ marginTop: 6 }}>{g.name}</Txt>
                  <View style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 }}>
                    <Txt v="black" size={14} color={C.butterDeep}>⭐ {g.cost}</Txt>
                  </View>
                  {!ok && !!partnerId && <Txt v="bold" size={11} color={C.soft} style={{ marginTop: 6 }}>{g.cost - myPoints} puan eksik</Txt>}
                </>
              );
              const box = { borderRadius: 30, alignItems: 'center' as const, paddingVertical: 20 };
              return (
                <Pressable key={g.kind} disabled={busy || !ok} onPress={() => send(g)}
                  style={({ pressed }) => ({ width: '48%', opacity: ok ? 1 : 0.55, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
                  {tier === 'efsane' ? (
                    <LinearGradient colors={[g.bg, '#FFC9A8']} style={[box, shadow, { borderWidth: 2, borderColor: '#FFD36B' }]}>{inner}</LinearGradient>
                  ) : (
                    <View style={[box, shadow, { backgroundColor: g.bg }]}>{inner}</View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <Txt size={12} color={C.soft} style={{ textAlign: 'center', marginTop: 26 }}>Her not ya da çizim +10 puan (günde 3 tane) 💗</Txt>
    </Screen>
  );
}
