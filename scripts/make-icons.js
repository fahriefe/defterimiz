const sharp = require('sharp');
const svg = (r) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB3C7"/><stop offset="1" stop-color="#FF5C8A"/></linearGradient></defs>
<rect width="1024" height="1024" rx="${r}" fill="url(#g)"/>
<path d="M512 760 C300 620 250 500 250 410 C250 330 310 280 380 280 C440 280 490 315 512 365 C534 315 584 280 644 280 C714 280 774 330 774 410 C774 500 724 620 512 760Z" fill="#fff"/>
<circle cx="760" cy="270" r="26" fill="#fff" opacity=".7"/><circle cx="250" cy="720" r="18" fill="#fff" opacity=".6"/>
</svg>`);
(async () => {
  await sharp(svg(0)).png().toFile('assets/icon.png');
  await sharp(svg(0)).resize(180).png().toFile('public/apple-touch-icon.png');
  await sharp(svg(230)).resize(192).png().toFile('public/icon-192.png');
  await sharp(svg(230)).resize(512).png().toFile('public/icon-512.png');
  await sharp(svg(230)).resize(48).png().toFile('assets/favicon.png');
  await sharp(svg(0)).resize(1024).png().toFile('assets/android-icon-foreground.png');
})();
