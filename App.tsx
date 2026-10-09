import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataProvider, useData } from './src/data';
import Onboarding from './src/screens/Onboarding';
import Home from './src/screens/Home';
import Compose from './src/screens/Compose';
import Shop from './src/screens/Shop';
import Memories from './src/screens/Memories';
import { ToastHost, Txt } from './src/ui';
import InstallBanner from './src/InstallBanner';
import { registerSW } from './src/push';
import { BUILD, C, shadow } from './src/theme';

type Tab = 'home' | 'compose' | 'shop' | 'memories';
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'Bugün' },
  { id: 'compose', icon: '✏️', label: 'Yaz/Çiz' },
  { id: 'shop', icon: '🎁', label: 'Hediye' },
  { id: 'memories', icon: '📖', label: 'Anılar' },
];

function Loading({ error }: { error: string | null }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 10000); return () => clearTimeout(t); }, []);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, padding: 32 }}>
      <Txt size={48}>💌</Txt>
      <ActivityIndicator color={C.pink} style={{ marginTop: 16 }} />
      <Txt size={11} color={C.soft} style={{ marginTop: 12 }}>{BUILD}</Txt>
      {(slow || error) && (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Txt v="bold" size={15} style={{ textAlign: 'center' }}>{error ? 'Bağlanamadık 🥺' : 'Biraz uzun sürdü…'}</Txt>
          <Txt size={12} color={C.soft} style={{ textAlign: 'center', marginTop: 6 }}>{error ?? 'İnternetini kontrol edip yenile.'}</Txt>
          {Platform.OS === 'web' && (
            <Pressable onPress={() => (window as any).location.reload()} style={{ marginTop: 14, backgroundColor: C.pink, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 24 }}>
              <Txt v="black" size={15} color="#fff">Yenile</Txt>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function Root() {
  const { ready, error, couple } = useData();
  const [tab, setTab] = useState<Tab>('home');
  const insets = useSafeAreaInsets();
  if (!ready) return <Loading error={error} />;
  if (!couple) return <Onboarding />;

  return (
    <View style={{ flex: 1 }}>
      {tab === 'home' && <Home go={setTab} />}
      {tab === 'compose' && <Compose done={() => setTab('home')} />}
      {tab === 'shop' && <Shop />}
      {tab === 'memories' && <Memories />}
      <View style={[{
        position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12), flexDirection: 'row',
        backgroundColor: '#fff', borderRadius: 999, padding: 6,
      }, shadow]}>
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 999, backgroundColor: on ? C.pinkSoft : 'transparent' }}>
              <Txt size={20}>{t.icon}</Txt>
              <Txt v="black" size={11} color={on ? C.pinkDeep : C.soft}>{t.label}</Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  useEffect(() => { registerSW(); }, []);
  const [fontWait, setFontWait] = useState(true);
  useEffect(() => { const t = setTimeout(() => setFontWait(false), 2500); return () => clearTimeout(t); }, []);
  const [loaded, fontError] = useFonts({ Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black, Caveat_700Bold });
  if (!loaded && !fontError && fontWait) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: C.bg }}><ActivityIndicator color={C.pink} /></View>;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 520 }}>
          <DataProvider><Root /></DataProvider>
          <ToastHost />
          <InstallBanner />
        </View>
      </View>
    </SafeAreaProvider>
  );
}
