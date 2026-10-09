# 💌 Defterimiz

İki kişilik, tatlı bir günlük defteri. Sevgilinizle her gün birbirinize bir şeyler yazın, çizin; seriyi bozmayın, puan biriktirin, minik (ya da dev) hediyeler yollayın.

Tek bir kod tabanı: **telefona ana ekran uygulaması olarak kurulur** (iPhone ve Android), tarayıcıda da çalışır.

## ✨ Neler var

| | |
|---|---|
| **💞 Eşleşme** | Biriniz çift oluşturur, 6 harfli kodu eşine yollar, o kodla katılır. Hesap, e-posta, şifre yok. |
| **✏️ Not & 🎨 Çizim** | Her gün birbirinize not bırakın ya da parmakla çizin (7 renk, 3 kalınlık, geri al). Notlar bantlı kâğıt, çizimler polaroid olarak görünür. |
| **🔥 Seri** | İkiniz de o gün en az bir şey gönderirseniz gün sayılır. Ana ekranda son 7 günün kalpli takvimi var. |
| **⭐ Puan** | Her not ya da çizim +10 puan (günde 3 tanesi puan getirir). |
| **🎁 Hediyeler** | 30 hediye, 3 grupta: *minik sürprizler* (10–25 puan), *özel hediyeler* (35–200), *efsane hediyeler* (300–2000: 💎 👑 💍 🚀 🏰 🏎️ 🏝️ 🌍). Her birinin kendi sesi var. |
| **🔊 Hediye ekranı** | Hediye yollandığı gün ana ekranda süzülür; dokununca ses çıkar, titreşir, emojiler saçılır. |
| **📖 Anılar** | Hediyeyi "anı olarak sakla" diyebilirsiniz; saklanmayan hediye ertesi gün kaybolur. Tüm not ve çizimler gün gün anılarda durur. |
| **📸 Profil fotoğrafı** | Avatara dokunup galeriden fotoğraf seçin; ortadan kırpılıp küçültülür. |
| **🔔 Bildirim** | Eşiniz bir not, çizim ya da hediye bırakınca telefonunuza bildirim düşer (art arda gelenler "3 şey bıraktı" diye birleşir). |
| **📲 Kolay kurulum** | Siteye girince alttan çıkan "indir" penceresi: Android'de tek dokunuş, iPhone'da adım adım yönerge. |

## 🛠️ Nasıl yapıldı

- **Uygulama:** [Expo](https://expo.dev) (React Native) + TypeScript, web için `react-native-web`. Tek kod, her yerde aynı görünüm.
- **Veritabanı & giriş:** Firebase Authentication (anonim giriş) ve Cloud Firestore. Veriler iki telefonda anında eşitlenir.
- **Yayın:** Firebase Hosting (ücretsiz). Uygulama bir PWA: `manifest`, ikonlar ve `service worker` ile ana ekrana eklenir.
- **Çizim:** `react-native-svg` ile parmak hareketleri SVG yollarına çevrilir, küçük bir sanal tuvalde saklanır.
- **Ses:** `expo-audio`. Tüm sesler ([`assets/sounds`](assets/sounds)) kodla üretilmiş küçük `.wav` dosyaları, dış dosya yok.
- **Bildirim:** Standart Web Push (VAPID). Küçük bir sunucusuz fonksiyon ([`worker/`](worker) Cloudflare ya da [`push-api/`](push-api) Vercel) imzalı isteği push servisine iletir. Bildirim metni cihazdaki [`public/sw.js`](public/sw.js) içinde olduğu için notlarınızın içeriği hiçbir dış servisten geçmez.
- **Tasarım:** Pastel degrade, uçuşan kalpler, Nunito ve el yazısı (Caveat) yazı tipleri.

## 📁 Klasörler

```
App.tsx                  Giriş noktası, alt menü
src/
  data.tsx               Firebase verisi: çift, notlar, hediyeler, puan, seri
  theme.ts               Renkler ve 30 hediyelik katalog
  ui.tsx                 Ortak parçalar: kartlar, düğmeler, çizim tuvali, polaroid...
  sounds.ts              Ses çalma
  push.ts / pushConfig.ts  Bildirim izni, abonelik, test
  InstallBanner.tsx      "Uygulamayı indir" penceresi
  screens/               Onboarding, Home, Compose, Shop, Memories
public/                  PWA dosyaları: manifest, ikonlar, sw.js
worker/                  Bildirim aracısı (Cloudflare Worker)
push-api/                Aynı aracının Vercel sürümü
firestore.rules          Güvenlik kuralları
scripts/                 İkon üretimi ve derleme sonrası PWA ayarları
```

## 🚀 Kurulum

Gerekenler: Node.js 20+ ve ücretsiz bir Firebase hesabı.

1. **Firebase projesi** açın ([console.firebase.google.com](https://console.firebase.google.com)):
   - **Authentication → Sign-in method → Anonymous**'ı etkinleştirin.
   - **Firestore Database** oluşturun (Realtime Database değil).
   - Proje ayarlarından bir **Web uygulaması** ekleyin ve ayarları [`src/firebaseConfig.ts`](src/firebaseConfig.ts) dosyasına yapıştırın. [`.firebaserc`](.firebaserc) içindeki proje adını da değiştirin.
2. Paketleri kurun:
   ```bash
   npm install
   ```
3. Telefonda denemek için (Expo Go ile, aynı Wi-Fi):
   ```bash
   npx expo start
   ```
4. Yayınlamak için (web sitesi + Firestore kuralları):
   ```bash
   npx firebase-tools login
   npm run deploy
   ```
   Çıkan `https://PROJE.web.app` adresini telefondan açıp **Ana Ekrana Ekle** deyin.

### Bildirimleri açmak (isteğe bağlı)

1. Bir VAPID anahtar çifti üretin ve açık anahtarı [`src/pushConfig.ts`](src/pushConfig.ts) ile `worker/wrangler.toml` içine yazın:
   ```bash
   node -e "const c=require('crypto'),{privateKey:k,publicKey:p}=c.generateKeyPairSync('ec',{namedCurve:'prime256v1'});const j=p.export({format:'jwk'}),b=s=>Buffer.from(s,'base64url');console.log('açık:',Buffer.concat([Buffer.from([4]),b(j.x),b(j.y)]).toString('base64url'));require('fs').writeFileSync('worker/private.jwk.json',JSON.stringify(k.export({format:'jwk'})))"
   ```
2. Aracıyı yayınlayın (`worker/private.jwk.json` gizli kalır, depoya girmez):
   ```bash
   cd worker
   npx wrangler login
   npx wrangler deploy
   Get-Content private.jwk.json | npx wrangler secret put VAPID_PRIVATE_JWK
   ```
3. Çıkan adresi `src/pushConfig.ts` içindeki `PUSH_URL`'ye yazıp yeniden `npm run deploy` yapın.

> Bazı ülkelerde `workers.dev` alan adı engelli olabilir. O durumda aynı işi yapan [`push-api/`](push-api) klasörünü Vercel'e yükleyin (`npx vercel --prod`) ve adresini `PUSH_URL`'ye `/api/push` ekleyerek yazın.

## 🔒 Güvenlik ve sınırlar

- Firestore kuralları ([`firestore.rules`](firestore.rules)) çiftin verisini sadece o çiftin iki üyesine açar.
- Giriş **cihaza bağlı (anonim)**. Uygulamayı silerseniz ya da çıkış yaparsanız aynı çifte geri dönemezsiniz.
- Puanlar telefonda hesaplanır; iki kişilik bir uygulama için yeterli, ama hile yapılamaz demek değil.
- Gizli anahtarlar (`worker/private.jwk.json`, `push-api/lib/keys.js`) `.gitignore` ile dışarıda tutulur. Firebase web ayarları gizli değildir, güvenliği kurallar sağlar.
- **iPhone'da bildirim** için iOS 16.4+ ve uygulamanın ana ekrana eklenmiş olması gerekir.

## 🗺️ Yapılabilecekler

- E-posta ile giriş (çıkış yapınca çifte geri dönebilmek için)
- Seri bonusu, özel gün çift puanı
- Bildirimde gönderenin adı

## 📄 Lisans

**Tüm hakları saklıdır.** Kod, portfolyo amacıyla herkese açıktır: **okuyabilir ve inceleyebilirsiniz**, ama izinsiz kopyalayamaz, değiştirip yayımlayamaz ya da kendi ürününüzde kullanamazsınız. Ayrıntılar için [LICENSE](LICENSE), kullanılan açık kaynak bileşenler için [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md). Güvenlik açığı bildirimi için [SECURITY.md](SECURITY.md).

---

Sevgiyle yapıldı 💗
