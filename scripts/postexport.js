// expo export sonrası index.html'e PWA / "Ana Ekrana Ekle" etiketlerini ekler.
const fs = require('fs');
const f = 'dist/index.html';
let h = fs.readFileSync(f, 'utf8');
h = h.replace(/<meta name="viewport"[^>]*>/, '');
h = h.replace('<html lang="en">', '<html lang="tr">');
h = h.replace(/(<meta charset="utf-8" ?\/>)/, `$1
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#FF7A9C">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Defterimiz">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>html,body{background:#FFF1F5;overscroll-behavior:none;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}textarea,input{-webkit-user-select:text;user-select:text}</style>`);
h = h.replace(/<title>[^<]*<\/title>/, '<title>Defterimiz</title>');
fs.writeFileSync(f, h);

// Firebase Hosting "node_modules" yollarını yüklemeyebiliyor; yazı tiplerini başka bir klasöre taşı ve bundle'daki yolları düzelt.
const path = require('path');
const from = path.join('dist', 'assets', 'node_modules');
if (fs.existsSync(from)) {
  fs.renameSync(from, path.join('dist', 'assets', 'vendor'));
  const jsDir = path.join('dist', '_expo', 'static', 'js', 'web');
  for (const name of fs.readdirSync(jsDir)) {
    const p = path.join(jsDir, name);
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split('assets/node_modules/').join('assets/vendor/'));
  }
  console.log('yazı tipleri assets/vendor altına taşındı');
}
console.log('index.html güncellendi');
