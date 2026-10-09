import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, Image, PanResponder, Platform, Pressable, ScrollView, Share, StyleProp, Text, TextInput, TextInputProps,
  TextProps, View, ViewStyle, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { C, shadow } from './theme';
import { Stroke } from './data';

/* ---------- yazı ---------- */
const FONT = { reg: 'Nunito_600SemiBold', bold: 'Nunito_800ExtraBold', black: 'Nunito_900Black', hand: 'Caveat_700Bold' };
export function Txt({ v = 'reg', size = 15, color = C.ink, style, ...p }: TextProps & { v?: keyof typeof FONT; size?: number; color?: string }) {
  return <Text {...p} style={[{ fontFamily: FONT[v], fontSize: size, color }, style]} />;
}

/* ---------- uçuşan kalpler ---------- */
const HEARTS = [
  { x: '6%', s: 18, d: 0, t: 9000, e: '💗' }, { x: '24%', s: 26, d: 2500, t: 11000, e: '🌸' }, { x: '44%', s: 16, d: 5000, t: 8500, e: '💕' },
  { x: '63%', s: 30, d: 1200, t: 12000, e: '💗' }, { x: '80%', s: 20, d: 3800, t: 9500, e: '✨' }, { x: '91%', s: 15, d: 6500, t: 10000, e: '💖' },
];
function FloatHeart({ x, s, d, t, e }: (typeof HEARTS)[number]) {
  const { height } = useWindowDimensions();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(d),
      Animated.timing(v, { toValue: 1, duration: t, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.Text style={{
      position: 'absolute', left: x as any, top: 0, fontSize: s,
      opacity: v.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.45, 0.45, 0] }),
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [height, -60] }) }],
    }}>{e}</Animated.Text>
  );
}
export const FloatingHearts = () => (
  <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
    {HEARTS.map((h, i) => <FloatHeart key={i} {...h} />)}
  </View>
);

/* ---------- sayfa iskeleti ---------- */
export function Screen({ children, scroll = true, scrollEnabled = true }: { children: React.ReactNode; scroll?: boolean; scrollEnabled?: boolean }) {
  return (
    <LinearGradient colors={['#FFF1F5', '#FFE6EE', '#FFF6EA']} style={{ flex: 1 }}>
      <FloatingHearts />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {scroll ? (
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" scrollEnabled={scrollEnabled}>
            {children}
          </ScrollView>
        ) : <View style={{ flex: 1, padding: 20 }}>{children}</View>}
      </SafeAreaView>
    </LinearGradient>
  );
}

export const Card = ({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) => (
  <View style={[{ backgroundColor: '#fff', borderRadius: 28, padding: 18, marginBottom: 16 }, shadow, style]}>{children}</View>
);

export function Btn({ title, onPress, kind = 'primary', disabled, style }: {
  title: string; onPress: () => void; kind?: 'primary' | 'soft'; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const base = { paddingVertical: 15, paddingHorizontal: 22, borderRadius: 999, alignItems: 'center' as const };
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }, style]}>
      {kind === 'primary' ? (
        <LinearGradient colors={['#FF8FAB', C.pinkDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[base, shadow]}>
          <Txt v="black" size={16} color="#fff">{title}</Txt>
        </LinearGradient>
      ) : (
        <View style={[base, { backgroundColor: C.pinkSoft }]}><Txt v="black" size={16} color={C.pinkDeep}>{title}</Txt></View>
      )}
    </Pressable>
  );
}

export function Field(p: TextInputProps) {
  return (
    <TextInput placeholderTextColor={C.soft} {...p}
      style={[{
        backgroundColor: '#fff', borderRadius: 22, paddingVertical: 15, paddingHorizontal: 18, fontSize: 17, color: C.ink,
        fontFamily: FONT.bold, borderWidth: 2, borderColor: C.line,
      }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null, p.style]} />
  );
}

/** Galeriden fotoğraf seçer, ortadan kare kırpıp 192px'e küçültür; Firestore'a sığacak küçük bir data URL döner. */
export async function pickAvatar(): Promise<string | null> {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
  if (r.canceled || !r.assets?.[0]) return null;
  const a = r.assets[0];
  const side = Math.min(a.width, a.height);
  const m = await ImageManipulator.manipulateAsync(
    a.uri,
    [{ crop: { originX: Math.floor((a.width - side) / 2), originY: Math.floor((a.height - side) / 2), width: side, height: side } }, { resize: { width: 192, height: 192 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  return `data:image/jpeg;base64,${m.base64}`;
}

export function Avatar({ name, i = 0, size = 52, photo, onPress, badge }: { name: string; i?: number; size?: number; photo?: string; onPress?: () => void; badge?: boolean }) {
  const cols = [['#FFB3C7', '#FF7A9C'], ['#CDBBFF', '#9B7BFF']][i % 2];
  const body = photo ? (
    <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff' }} />
  ) : (
    <LinearGradient colors={cols as [string, string]} style={{
      width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', ...shadow,
    }}>
      <Txt v="black" size={size * 0.42} color="#fff">{(name || '?').charAt(0).toUpperCase()}</Txt>
    </LinearGradient>
  );
  // gölge, yuvarlak fotoğrafla aynı şekilde olsun diye dış kutu da daire (aksi halde etrafında kare gölge çıkar)
  const wrapped = <View style={photo ? [{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#fff' }, shadow] : undefined}>{body}</View>;
  if (!onPress) return wrapped;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}>
      {wrapped}
      {badge && (
        <View style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow }}>
          <Txt size={12}>📷</Txt>
        </View>
      )}
    </Pressable>
  );
}

export const CoinPill = ({ n }: { n: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, ...shadow }}>
    <Txt size={16}>⭐</Txt><Txt v="black" size={17} color={C.butterDeep}>{n}</Txt>
  </View>
);

/* ---------- bildirim baloncuğu (web'de Alert çalışmaz) ---------- */
let push: (t: { title: string; msg?: string }) => void = () => {};
export const notify = (title: string, msg?: string) => push({ title, msg });
export function ToastHost() {
  const [t, setT] = useState<{ title: string; msg?: string } | null>(null);
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    push = (x) => {
      a.stopAnimation(); a.setValue(0); setT(x);
      Animated.sequence([
        Animated.spring(a, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.delay(2800),
        Animated.timing(a, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(({ finished }) => finished && setT(null));
    };
  }, []);
  if (!t) return null;
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', top: 54, left: 20, right: 20, alignItems: 'center', opacity: a,
      transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }, { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
    }}>
      <View style={[{ backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 20, borderWidth: 2, borderColor: C.pinkSoft, maxWidth: 420 }, shadow]}>
        <Txt v="black" size={16} style={{ textAlign: 'center' }}>{t.title}</Txt>
        {!!t.msg && <Txt size={14} color={C.soft} style={{ textAlign: 'center', marginTop: 2 }}>{t.msg}</Txt>}
      </View>
    </Animated.View>
  );
}

export async function shareText(message: string) {
  try {
    if (Platform.OS === 'web') {
      const n: any = navigator;
      if (n.share) { await n.share({ text: message }); return; }
      await n.clipboard.writeText(message);
      notify('Kopyalandı 📋', 'Şimdi ona yapıştırıp gönderebilirsin');
      return;
    }
    await Share.share({ message });
  } catch {}
}

/* ---------- dokununca saçılan emojiler ---------- */
export function Burst({ emoji, trigger }: { emoji: string; trigger: number }) {
  const N = 10;
  const vals = useRef(Array.from({ length: N }, () => new Animated.Value(0))).current;
  useEffect(() => {
    if (!trigger) return;
    vals.forEach((v) => v.setValue(0));
    Animated.parallel(vals.map((v, i) => Animated.timing(v, { toValue: 1, duration: 800 + (i % 3) * 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }))).start();
  }, [trigger]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 }}>
      {vals.map((v, i) => {
        const ang = (i / N) * Math.PI * 2;
        return (
          <Animated.Text key={i} style={{
            position: 'absolute', fontSize: 22, opacity: v.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(ang) * 95] }) },
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(ang) * 95 - 30] }) },
              { scale: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.3, 1.2, 0.8] }) },
            ],
          }}>{i % 3 === 0 ? emoji : i % 3 === 1 ? '✨' : '💖'}</Animated.Text>
        );
      })}
    </View>
  );
}

/* ---------- çizim ---------- */
const BOX = 300; // çizimler 300x300'lük sanal tuvalde saklanır
const StrokePaths = ({ strokes }: { strokes: Stroke[] }) => (
  <>{strokes.map((s, i) => <Path key={i} d={s.d} stroke={s.color} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}</>
);

export function DrawingView({ strokes, size }: { strokes: Stroke[]; size: number }) {
  return <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`} style={{ backgroundColor: '#FFFDF8', borderRadius: 10 }}><StrokePaths strokes={strokes} /></Svg>;
}

export const COLORS = ['#5B3A46', '#FF5C8A', '#FF9F43', '#FFD93D', '#6BCB77', '#4D96FF', '#9B5DE5'];

export function DrawingCanvas({ size, strokes, onChange, color, width }: {
  size: number; strokes: Stroke[]; onChange: (s: Stroke[]) => void; color: string; width: number;
}) {
  const [live, setLive] = useState<string | null>(null);
  const pts = useRef<string[]>([]);
  const latest = useRef({ strokes, color, width, onChange });
  latest.current = { strokes, color, width, onChange };
  const k = BOX / size;
  const pt = (x: number, y: number) => `${(x * k).toFixed(1)} ${(y * k).toFixed(1)}`;

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      pts.current = ['M' + pt(e.nativeEvent.locationX, e.nativeEvent.locationY)];
      setLive(pts.current.join(' '));
    },
    onPanResponderMove: (e) => {
      pts.current.push('L' + pt(e.nativeEvent.locationX, e.nativeEvent.locationY));
      setLive(pts.current.join(' '));
    },
    onPanResponderRelease: () => {
      const { strokes: st, color: c, width: w, onChange: cb } = latest.current;
      if (pts.current.length === 1) pts.current.push(pts.current[0].replace('M', 'L')); // tek dokunuş = nokta
      cb([...st, { d: pts.current.join(' '), color: c, w }]);
      pts.current = [];
      setLive(null);
    },
  }), [size]);

  return (
    <View {...pan.panHandlers} style={[{ width: size, height: size, borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFFDF8', borderWidth: 3, borderColor: C.pinkSoft }, Platform.OS === 'web' ? ({ touchAction: 'none', cursor: 'crosshair' } as any) : null]}>
      <Svg pointerEvents="none" width={size - 6} height={size - 6} viewBox={`0 0 ${BOX} ${BOX}`}>
        <StrokePaths strokes={strokes} />
        {live && <Path d={live} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      </Svg>
    </View>
  );
}

/* ---------- süslü kartlar ---------- */
export function Polaroid({ strokes, size, caption, tilt = -1.5 }: { strokes: Stroke[]; size: number; caption: string; tilt?: number }) {
  return (
    <View style={[{ backgroundColor: '#fff', padding: 10, paddingBottom: 14, borderRadius: 8, marginBottom: 18, alignSelf: 'center', transform: [{ rotate: `${tilt}deg` }] }, shadow]}>
      <DrawingView strokes={strokes} size={size} />
      <Txt v="hand" size={22} style={{ textAlign: 'center', marginTop: 6 }}>{caption}</Txt>
    </View>
  );
}

const TAPES = ['rgba(255,179,138,0.75)', 'rgba(183,155,255,0.6)', 'rgba(255,122,156,0.6)', 'rgba(109,203,160,0.6)'];
export function Note({ text, caption, i = 0 }: { text: string; caption: string; i?: number }) {
  return (
    <View style={[{ backgroundColor: '#FFFBEF', borderRadius: 6, padding: 20, paddingTop: 26, marginBottom: 20, transform: [{ rotate: `${i % 2 ? 1.2 : -1.2}deg` }] }, shadow]}>
      <View style={{ position: 'absolute', top: -10, alignSelf: 'center', width: 76, height: 22, backgroundColor: TAPES[i % TAPES.length], transform: [{ rotate: `${i % 2 ? -3 : 3}deg` }] }} />
      <Txt v="hand" size={26} style={{ lineHeight: 32 }}>{text}</Txt>
      <Txt size={12} color={C.soft} style={{ marginTop: 10, textAlign: 'right' }}>— {caption}</Txt>
    </View>
  );
}

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Txt v="black" size={20} style={{ marginBottom: 10, marginTop: 4 }}>{children}</Txt>
);
