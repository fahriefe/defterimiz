import React, { useState } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useData } from '../data';
import { Btn, Field, Screen, Txt, notify } from '../ui';
import { BUILD, C, shadow } from '../theme';

export default function Onboarding() {
  const { createCouple, joinCouple } = useData();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    if (!name.trim()) return notify('Önce adını yaz 💗');
    setBusy(true);
    try { await fn(); } catch (e: any) { notify('Olmadı 🥺', e.message); }
    setBusy(false);
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 28 }}>
        <LinearGradient colors={['#FFB3C7', '#FF7A9C']} style={[{ width: 120, height: 120, borderRadius: 40, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }, shadow]}>
          <Txt size={60}>💌</Txt>
        </LinearGradient>
        <Txt v="black" size={34} style={{ marginTop: 20 }}>Defterimiz</Txt>
        <Txt size={16} color={C.soft} style={{ textAlign: 'center', marginTop: 4 }}>Her gün birbirimize bir şeyler yazalım, çizelim 🌸</Txt>
      </View>

      <View style={[{ backgroundColor: '#fff', borderRadius: 32, padding: 20 }, shadow]}>
        <Txt v="bold" size={14} color={C.soft} style={{ marginBottom: 6, marginLeft: 6 }}>Adın ne?</Txt>
        <Field placeholder="Adını yaz" value={name} onChangeText={setName} />
        <Btn title="✨ Yeni çift oluştur" onPress={() => run(() => createCouple(name.trim()))} disabled={busy} style={{ marginTop: 14 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
          <View style={{ flex: 1, height: 2, backgroundColor: C.line, borderRadius: 2 }} />
          <Txt v="bold" size={13} color={C.soft} style={{ marginHorizontal: 12 }}>ya da eşinin kodu var mı?</Txt>
          <View style={{ flex: 1, height: 2, backgroundColor: C.line, borderRadius: 2 }} />
        </View>

        <Field placeholder="• • • • • •" autoCapitalize="characters" maxLength={6} value={code} onChangeText={(t) => setCode(t.toUpperCase())}
          style={{ textAlign: 'center', letterSpacing: 8, fontSize: 24 }} />
        <Btn title="💞 Katıl" kind="soft" onPress={() => run(() => joinCouple(name.trim(), code))} disabled={busy || code.length < 6} style={{ marginTop: 14 }} />
      </View>
      <Txt size={11} color={C.soft} style={{ textAlign: 'center', marginTop: 18, opacity: 0.7 }}>Defterimiz {BUILD}</Txt>
    </Screen>
  );
}
