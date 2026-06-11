import { initInput } from './input.js';
import { initSprites } from './sprites.js';
import { initAudio } from './audio.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

initSprites();
initInput();
initAudio();

const game = new Game(ctx);
const STEP = 1000 / 60;
let last = performance.now();
let acc = 0;

function loop(now) {
  acc += Math.min(now - last, 100); // clamp so a hidden tab doesn't fast-forward
  last = now;
  while (acc >= STEP) {
    game.tick();
    acc -= STEP;
  }
  game.draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
