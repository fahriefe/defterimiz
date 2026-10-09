# Defterimiz

Expo (React Native) + Firebase. Tek kod, iOS ve Android.

## Kurulum
1. https://console.firebase.google.com → yeni proje → **Authentication > Sign-in method > Anonymous** aç.
2. **Firestore Database** oluştur, **Rules** sekmesine `firestore.rules` içeriğini yapıştır, yayınla.
3. Proje ayarları → Web uygulaması ekle → config değerlerini `src/firebaseConfig.ts` içine yapıştır.
4. `npm install` → `npx expo start` → telefonda **Expo Go** ile QR'ı tara. İkiniz de aynı projeye bağlanırsınız.

## Mağazaya çıkarmak
`npm i -g eas-cli` → `eas build -p android` / `eas build -p ios` → `eas submit`.
(Apple Developer hesabı 99$/yıl, Google Play 25$ bir kerelik.)
