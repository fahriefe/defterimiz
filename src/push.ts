import { Platform } from 'react-native';
import { PUSH_URL, VAPID_PUBLIC_KEY } from './pushConfig';

const w: any = Platform.OS === 'web' && typeof window !== 'undefined' ? window : null;

export const pushConfigured = () => !!w && PUSH_URL !== 'BURAYA';
export const pushSupported = () => !!w && 'serviceWorker' in navigator && 'PushManager' in w && 'Notification' in w;
export const isIOS = () => !!w && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && (navigator as any).maxTouchPoints > 1));
export const isInstalled = () => !!w && (w.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);
export const permission = (): NotificationPermission | 'unsupported' => (pushSupported() ? Notification.permission : 'unsupported');

export async function registerSW() {
  if (!w || !('serviceWorker' in navigator)) return;
  try { await navigator.serviceWorker.register('/sw.js'); } catch {}
}

const toKey = (b64: string) => {
  const s = (b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
};

/** İzin ister (kullanıcı dokunuşuyla çağrılmalı) ve bu cihazın bildirim adresini JSON olarak döner. */
export async function subscribePush(askPermission: boolean): Promise<string | null> {
  if (!pushSupported()) return null;
  if (Notification.permission !== 'granted') {
    if (!askPermission) return null;
    if ((await Notification.requestPermission()) !== 'granted') return null;
  }
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID_PUBLIC_KEY) }));
  return JSON.stringify(sub);
}

/** Eşin telefonuna bildirim gönderir; hata olursa sessizce geçer. */
export function pingPush(subscriptionJson: string) {
  if (!pushConfigured()) return;
  try {
    fetch(PUSH_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subscription: JSON.parse(subscriptionJson) }) }).catch(() => {});
  } catch {}
}

/** Bildirim zincirini adım adım kontrol eder ve sonucu satırlar halinde döner. Kendi cihazına gerçek bir test bildirimi de yollar. */
export async function diagnose(partnerHasPush: boolean): Promise<string[]> {
  const out: string[] = [];
  const ok = (b: boolean) => (b ? '✅' : '❌');
  out.push(`${ok(pushSupported())} Bu tarayıcı bildirimi destekliyor`);
  if (!pushSupported()) {
    out.push(isIOS() && !isInstalled() ? '👉 iPhone: uygulamayı Safari yerine ana ekrandaki simgeden aç' : '👉 Başka bir tarayıcı dene (Chrome / Safari)');
    return out;
  }
  out.push(`${ok(Notification.permission === 'granted')} İzin: ${Notification.permission}`);
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    out.push(`${ok(!!reg?.active)} Bildirim servisi: ${reg ? (reg.active ? 'aktif' : 'kuruluyor') : 'yok'}`);
    const sub = await reg?.pushManager.getSubscription();
    out.push(`${ok(!!sub)} Bu cihazın bildirim adresi${sub ? '' : ' yok (önce "Bildirimleri aç")'}`);
    out.push(`${ok(partnerHasPush)} Eşinin bildirim adresi kayıtlı${partnerHasPush ? '' : ' değil (o da bildirimleri açmalı)'}`);
    if (sub) {
      const r = await fetch(PUSH_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON() }) });
      const t = await r.text();
      out.push(`${ok(r.ok)} Cloudflare yanıtı: ${r.status} ${t.slice(0, 90)}`);
      if (r.ok) out.push('📬 Test bildirimi yollandı, birkaç saniye içinde gelmeli');
    }
  } catch (e: any) {
    out.push(`❌ Cloudflare'e ulaşılamadı: ${e?.message ?? e}`);
  }
  return out;
}
