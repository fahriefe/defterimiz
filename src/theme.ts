export const C = {
  bg: '#FFF1F5', ink: '#5B3A46', soft: '#A68A95', pink: '#FF7A9C', pinkDeep: '#E8547D', pinkSoft: '#FFE3EB',
  peach: '#FFB38A', lav: '#EFE6FF', lavDeep: '#B79BFF', mint: '#D5F3E3', mintDeep: '#4DB583', butter: '#FFF0B8', butterDeep: '#C99A00',
  line: '#FBDDE6', gold: '#FFB400',
};

export const shadow = {
  shadowColor: '#E8547D', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4,
} as const;

export type GiftKind = string;
export type Tier = 'mini' | 'ozel' | 'efsane';
export type Gift_ = { kind: GiftKind; emoji: string; name: string; cost: number; sound: string; tier: Tier; bg: string };

// [kind, emoji, ad, puan, ses]
const RAW: [string, string, string, number, string][] = [
  ['kiss', '💋', 'Öpücük', 10, 'kiss'], ['flower', '🌸', 'Çiçek', 10, 'flower'], ['cookie', '🍪', 'Kurabiye', 12, 'crunch'],
  ['lollipop', '🍭', 'Lolipop', 12, 'pop'], ['heart', '❤️', 'Kalp', 15, 'heart'], ['choco', '🍫', 'Çikolata', 15, 'choco'],
  ['icecream', '🍦', 'Dondurma', 18, 'bell'], ['bear', '🧸', 'Ayıcık', 20, 'bear'], ['coffee', '☕', 'Kahve', 20, 'choco'],
  ['star', '⭐', 'Yıldız', 25, 'star'],
  ['balloon', '🎈', 'Balon', 35, 'pop'], ['rose', '🌹', 'Gül', 40, 'flower'], ['cake', '🍰', 'Pasta', 50, 'bell'],
  ['cat', '🐱', 'Kedicik', 60, 'meow'], ['dog', '🐶', 'Köpecik', 60, 'woof'], ['bouquet', '💐', 'Buket', 80, 'sparkle'],
  ['champagne', '🍾', 'Şampanya', 90, 'fizz'], ['butterfly', '🦋', 'Kelebek', 100, 'magic'], ['perfume', '🧴', 'Parfüm', 120, 'sparkle'],
  ['rainbow', '🌈', 'Gökkuşağı', 150, 'magic'], ['unicorn', '🦄', 'Unicorn', 200, 'sparkle'],
  ['gem', '💎', 'Elmas', 300, 'coin'], ['crown', '👑', 'Taç', 400, 'fanfare'], ['moon', '🌙', 'Ay', 450, 'magic'],
  ['ring', '💍', 'Yüzük', 500, 'fanfare'], ['rocket', '🚀', 'Roket', 600, 'whoosh'], ['castle', '🏰', 'Şato', 700, 'fanfare'],
  ['plane', '✈️', 'Uçak', 750, 'whoosh'], ['yacht', '🛥️', 'Yat', 800, 'engine'], ['car', '🏎️', 'Spor araba', 900, 'engine'],
  ['island', '🏝️', 'Özel ada', 1000, 'magic'], ['earth', '🌍', 'Dünya', 2000, 'fanfare'],
];
const BGS: Record<Tier, string[]> = {
  mini: ['#FFE3EB', '#FFEBD6', '#FFF3C4', '#E3F5EA'],
  ozel: ['#EFE6FF', '#E1F0FF', '#FFE1F3', '#DFF6F0'],
  efsane: ['#FFE9A8', '#FFD9A0', '#FFEFC2'],
};
export const GIFTS: Gift_[] = RAW.map(([kind, emoji, name, cost, sound], i) => {
  const tier: Tier = cost < 50 ? 'mini' : cost <= 200 ? 'ozel' : 'efsane';
  return { kind, emoji, name, cost, sound, tier, bg: BGS[tier][i % BGS[tier].length] };
});
export const giftOf = (k: string) => GIFTS.find((g) => g.kind === k) ?? GIFTS[1];
export const BUILD = 'v19';
export const POINTS_PER_ENTRY = 10;
export const DAILY_REWARDED_ENTRIES = 3;

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const prettyDay = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
