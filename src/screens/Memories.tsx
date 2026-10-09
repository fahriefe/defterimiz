import React from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { useData } from '../data';
import { Note, Polaroid, Screen, Txt } from '../ui';
import { C, giftOf, prettyDay, shadow } from '../theme';
import { play } from '../sounds';

export default function Memories() {
  const { entries, gifts, couple, uid } = useData();
  const { width } = useWindowDimensions();
  if (!couple) return null;
  const size = Math.min(width, 520) - 40 - 56;

  const days = Array.from(new Set([...entries.map((e) => e.day), ...gifts.filter((g) => g.saved).map((g) => g.day)])).sort().reverse();

  return (
    <Screen>
      <Txt v="black" size={28}>Anılarımız 📖</Txt>
      <Txt size={14} color={C.soft} style={{ marginBottom: 18 }}>Yazdığımız, çizdiğimiz, sakladığımız her şey.</Txt>
      {days.length === 0 && (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Txt size={56}>🌱</Txt>
          <Txt v="bold" size={15} color={C.soft} style={{ marginTop: 8 }}>Henüz anı yok, ilkini sen bırak!</Txt>
        </View>
      )}
      {days.map((day) => {
        const es = entries.filter((e) => e.day === day);
        const gs = gifts.filter((g) => g.saved && g.day === day);
        return (
          <View key={day} style={{ marginBottom: 8 }}>
            <View style={{ alignSelf: 'flex-start', backgroundColor: C.pinkSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16 }}>
              <Txt v="black" size={13} color={C.pinkDeep}>{prettyDay(day)}</Txt>
            </View>
            {gs.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                {gs.map((g) => (
                  <Pressable key={g.id} onPress={() => play(giftOf(g.kind).sound)} style={({ pressed }) => [{ backgroundColor: giftOf(g.kind).bg, borderRadius: 24, padding: 14, alignItems: 'center', transform: [{ scale: pressed ? 0.92 : 1 }] }, shadow]}>
                    <Txt size={40}>{giftOf(g.kind).emoji}</Txt>
                    <Txt v="bold" size={12} color={C.soft}>{couple.names[g.from]}'den</Txt>
                  </Pressable>
                ))}
              </View>
            )}
            {es.map((e, i) => {
              const who = `${couple.names[e.from]}${e.from === uid ? ' (sen)' : ''}`;
              return e.type === 'note'
                ? <Note key={e.id} text={e.text ?? ''} caption={who} i={i} />
                : <Polaroid key={e.id} strokes={e.strokes ?? []} size={size} caption={who} tilt={i % 2 ? 1.5 : -1.5} />;
            })}
          </View>
        );
      })}
    </Screen>
  );
}
