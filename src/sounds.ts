import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const files = {
  flower: require('../assets/sounds/flower.wav'),
  bear: require('../assets/sounds/bear.wav'),
  heart: require('../assets/sounds/heart.wav'),
  choco: require('../assets/sounds/choco.wav'),
  star: require('../assets/sounds/star.wav'),
  send: require('../assets/sounds/send.wav'),
  sparkle: require('../assets/sounds/sparkle.wav'),
  pop: require('../assets/sounds/pop.wav'),
  meow: require('../assets/sounds/meow.wav'),
  woof: require('../assets/sounds/woof.wav'),
  fizz: require('../assets/sounds/fizz.wav'),
  engine: require('../assets/sounds/engine.wav'),
  whoosh: require('../assets/sounds/whoosh.wav'),
  fanfare: require('../assets/sounds/fanfare.wav'),
  magic: require('../assets/sounds/magic.wav'),
  bell: require('../assets/sounds/bell.wav'),
  kiss: require('../assets/sounds/kiss.wav'),
  crunch: require('../assets/sounds/crunch.wav'),
  coin: require('../assets/sounds/coin.wav'),
};
const players: Partial<Record<keyof typeof files, AudioPlayer>> = {};

export async function play(name: string) {
  if (!(name in files)) name = 'send';
  const key = name as keyof typeof files;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    const p = (players[key] ??= createAudioPlayer(files[key]));
    await p.seekTo(0);
    p.play();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {}
}
