# Güvenlik

## Bir açık buldunuz mu?

Lütfen herkese açık bir issue **açmayın**. Bunun yerine GitHub'ın özel bildirim özelliğini kullanın: deponun **Security** sekmesi → **Report a vulnerability**. Bildirim yalnızca depo sahibine görünür.

## Bu projede alınan önlemler

- **Veri erişimi:** Firestore kuralları ([`firestore.rules`](firestore.rules)) bir çiftin verisini yalnızca o çiftin iki üyesine açar. Eşleşme kodları tek tek okunabilir, listelenemez.
- **Gizli anahtarlar depoda yok:** Bildirim imza anahtarları (`worker/private.jwk.json`, `push-api/lib/keys.js`) `.gitignore` ile dışarıda tutulur; sunucuya ayrıca yüklenir. `.env` dosyaları da dışarıdadır.
- **Bildirim aracısı:** Yalnızca uygulamanın kendi alan adından gelen isteklere yanıt verir ve yalnızca bilinen push servislerine (Google, Apple, Mozilla, Microsoft) istek atar.
- **Firebase web ayarları gizli değildir.** Tarayıcıya zaten gönderilirler; güvenlik bu ayarların saklanmasına değil, yukarıdaki Firestore kurallarına dayanır.
- **Otomatik denetim:** GitHub secret scanning ve push protection (yanlışlıkla anahtar yüklemeyi engeller), Dependabot uyarıları ve özel açık bildirimi bu depoda açıktır.

## Bilinen sınırlar

- Giriş anonimdir ve cihaza bağlıdır; hesap kurtarma yoktur.
- Puanlar istemci tarafında hesaplanır; yalnızca iki kişilik bir uygulama için tasarlanmıştır.
