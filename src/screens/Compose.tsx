import React, { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Stroke, useData } from '../data';
import { Btn, COLORS, DrawingCanvas, Field, Screen, Txt, notify } from '../ui';
import { C, shadow } from '../theme';
import { play } from '../sounds';

export default function Compose({ done }: { done: () => void }) {
  const { sendEntry, partnerId, couple } = useData();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<'note' | 'drawing'>('note');
  const [text, setText] = useState('');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(COLORS[1]);
  const [w, setW] = useState(5);
  const [busy, setBusy] = useState(false);
  const size = Math.min(width, 520) - 40;
  const empty = mode === 'note' ? !text.trim() : strokes.length === 0;
  const partnerName = partnerId ? couple?.names[partnerId] : null;

  const send = async () => {
    setBusy(true);
    try {
      const reward = await sendEntry(mode === 'note' ? { type: 'note', text: text.trim() } : { type: 'drawing', strokes });
      play('send');
      setText(''); setStrokes([]);
      notify('Gönderildi 💌', reward ? `+${reward} puan kazandın!` : 'Bugünlük puan limitin doldu ama çok tatlı 💗');
      done();
    } catch (e: any) { notify('Olmadı 🥺', e.message); }
    setBusy(false);
  };

  return (
    <Screen scrollEnabled={mode === 'note'}>
      <Txt v="black" size={28}>{partnerName ? `${partnerName}'e bir şey bırak` : 'Bir şey bırak'} 💌</Txt>
      <Txt size={14} color={C.soft} style={{ marginBottom: 16 }}>Küçücük bir not da olur, minik bir çizim de.</Txt>

      <View style={[{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 999, padding: 5, marginBottom: 18 }, shadow]}>
        {(['note', 'drawing'] as const).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={{ flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: 'center', backgroundColor: mode === m ? C.pink : 'transparent' }}>
            <Txt v="black" size={15} color={mode === m ? '#fff' : C.soft}>{m === 'note' ? '✏️ Not' : '🎨 Çizim'}</Txt>
          </Pressable>
        ))}
      </View>

      {mode === 'note' ? (
        <View style={[{ backgroundColor: '#FFFBEF', borderRadius: 10, padding: 8, transform: [{ rotate: '-0.8deg' }] }, shadow]}>
          <Field multiline maxLength={600} value={text} onChangeText={setText} placeholder="Bugün ona ne söylemek istersin?"
            style={{ minHeight: 200, textAlignVertical: 'top', backgroundColor: 'transparent', borderWidth: 0, fontFamily: 'Caveat_700Bold', fontSize: 26, lineHeight: 32 }} />
          <Txt size={12} color={C.soft} style={{ textAlign: 'right', margin: 6 }}>{text.length}/600</Txt>
        </View>
      ) : (
        <>
          <View style={{ alignItems: 'center' }}><DrawingCanvas size={size} strokes={strokes} onChange={setStrokes} color={color} width={w} /></View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} style={{
                width: 36, height: 36, borderRadius: 18, backgroundColor: c, borderWidth: 4, borderColor: color === c ? '#fff' : 'transparent',
                ...(color === c ? shadow : {}), transform: [{ scale: color === c ? 1.15 : 1 }],
              }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 }}>
            {[3, 6, 12].map((s) => (
              <Pressable key={s} onPress={() => setW(s)} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: w === s ? C.pinkSoft : '#fff' }}>
                <View style={{ width: s + 4, height: s + 4, borderRadius: 99, backgroundColor: color }} />
              </Pressable>
            ))}
            <Btn title="↩︎ Geri" kind="soft" onPress={() => setStrokes(strokes.slice(0, -1))} style={{ marginLeft: 6 }} />
            <Btn title="🗑" kind="soft" onPress={() => setStrokes([])} />
          </View>
        </>
      )}
      <Btn title="Gönder 💌" onPress={send} disabled={empty || busy} style={{ marginTop: 20 }} />
    </Screen>
  );
}
