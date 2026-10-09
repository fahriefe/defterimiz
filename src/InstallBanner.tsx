import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, View } from 'react-native';
import { C, shadow } from './theme';
import { Txt } from './ui';
import { isDemo } from './demo';

const KEY = 'defterimiz.installDismissedAt';
const WEEK = 7 * 24 * 3600 * 1000;

// Chrome/Android "yükle" olayını sayfa açılır açılmaz yakala
let deferred: any = null;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });
}

const ua = () => (typeof navigator !== 'undefined' ? navigator.userAgent : '');
const isIOS = () => /iphone|ipad|ipod/i.test(ua()) || (/Macintosh/.test(ua()) && (navigator as any).maxTouchPoints > 1);
const isStandalone = () =>
  (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches) || (navigator as any).standalone === true;
// Instagram / WhatsApp / Facebook içi tarayıcılarda ana ekrana eklenemez
const inAppBrowser = () => /FBAN|FBAV|Instagram|Line\/|WhatsApp|Snapchat/i.test(ua());

const read = () => { try { return Number(localStorage.getItem(KEY) || 0); } catch { return 0; } };
const write = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch {} };

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web' || isDemo || isStandalone() || inAppBrowser() || Date.now() - read() < WEEK) return;
    const t = setTimeout(() => {
      const ios = isIOS();
      if (!ios && !deferred) return; // Android'de tarayıcı kurulumu desteklemiyorsa gösterme
      setCanPrompt(!!deferred);
      setShow(true);
      Animated.spring(a, { toValue: 1, friction: 7, useNativeDriver: true }).start();
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    write();
    Animated.timing(a, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => setShow(false));
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch {}
    deferred = null;
    close();
  };

  if (!show) return null;
  const ios = isIOS();
  return (
    <Animated.View style={{
      position: 'absolute', left: 14, right: 14, bottom: ios ? 24 : 104, opacity: a,
      transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
    }}>
      <View style={[{ backgroundColor: '#fff', borderRadius: 26, padding: 14, borderWidth: 2, borderColor: C.pinkSoft }, shadow]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={{ uri: '/icon-192.png' }} style={{ width: 52, height: 52, borderRadius: 14 }} />
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Txt v="black" size={16}>Defterimiz'i indir 💌</Txt>
            <Txt size={13} color={C.soft}>
              {ios ? 'Ana ekrana ekle, uygulama gibi aç.' : 'Ana ekrana ekle, uygulama gibi kullan.'}
            </Txt>
          </View>
          <Pressable onPress={close} hitSlop={12} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.pinkSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Txt v="black" size={14} color={C.pinkDeep}>✕</Txt>
          </Pressable>
        </View>

        {canPrompt ? (
          <Pressable onPress={install} style={({ pressed }) => ({ marginTop: 12, backgroundColor: C.pink, borderRadius: 999, paddingVertical: 12, alignItems: 'center', transform: [{ scale: pressed ? 0.97 : 1 }] })}>
            <Txt v="black" size={15} color="#fff">⬇️ İndir</Txt>
          </Pressable>
        ) : (
          <View style={{ marginTop: 12, backgroundColor: C.pinkSoft, borderRadius: 18, padding: 12 }}>
            <Txt v="bold" size={13} color={C.pinkDeep}>
              1) Alttaki Paylaş simgesine dokun (⬆️ kutu){'\n'}2) "Ana Ekrana Ekle"yi seç{'\n'}3) Sağ üstten "Ekle"ye bas
            </Txt>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
