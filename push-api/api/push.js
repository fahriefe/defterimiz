// Defterimiz bildirim aracısı (Vercel Edge Function).
// Uygulama, eşinin bildirim adresini (subscription) buraya yollar; bu fonksiyon imzalı bir "web push" isteği gönderir.
// Mesaj içeriği yok: bildirimin metnini uygulamadaki sw.js gösterir.
import { PRIVATE_JWK, PUBLIC_KEY, SUBJECT } from '../lib/keys.js';

export const config = { runtime: 'edge' };

const ALLOWED_ORIGINS = ['https://ciftapp-e6cf9.web.app', 'https://ciftapp-e6cf9.firebaseapp.com', 'http://localhost:4173', 'http://localhost:8081'];
// Sadece bilinen push servislerine istek atılır (kötüye kullanımı önlemek için).
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^web\.push\.apple\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/];

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function vapidAuth(endpoint) {
  const header = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u(enc.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: SUBJECT,
  })));
  const key = await crypto.subtle.importKey('jwk', JSON.parse(PRIVATE_JWK), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${header}.${claims}`));
  return `vapid t=${header}.${claims}.${b64u(sig)}, k=${PUBLIC_KEY}`;
}

export default async function handler(req) {
  const origin = req.headers.get('Origin') || '';
  const cors = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    Vary: 'Origin',
  };
  const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return reply({ error: 'POST gerekli' }, 405);
  if (!ALLOWED_ORIGINS.includes(origin)) return reply({ error: 'izin yok' }, 403);

  let endpoint;
  try {
    const { subscription } = await req.json();
    endpoint = new URL(subscription.endpoint);
  } catch {
    return reply({ error: 'geçersiz istek' }, 400);
  }
  if (endpoint.protocol !== 'https:' || !PUSH_HOSTS.some((re) => re.test(endpoint.hostname))) return reply({ error: 'geçersiz adres' }, 400);

  const res = await fetch(endpoint.href, {
    method: 'POST',
    headers: { Authorization: await vapidAuth(endpoint.href), TTL: '86400', Urgency: 'high', 'Content-Length': '0' },
  });
  // 404/410: bildirim adresi artık geçersiz (uygulama silinmiş vs.)
  return reply({ status: res.status }, res.ok ? 200 : 502);
}
