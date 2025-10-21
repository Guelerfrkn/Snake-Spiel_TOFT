import { Howl } from 'howler';

// Benutze import.meta.url für Vite/ESM
const food = new Howl({
  src: [new URL('./assets/sound/food.mp3', import.meta.url).href],
  html5: true,
  preload: true,
});
const gameover = new Howl({
  src: [new URL('./assets/sound/gameover.mp3', import.meta.url).href],
  html5: true,
  preload: true,
});
const badge = new Howl({
  src: [new URL('./assets/sound/badge.mp3', import.meta.url).href],
  html5: true,
  preload: true,
});

export default {
  food,
  gameover,
  badge,
};
