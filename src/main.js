import { initSprites, drawSprite } from './sprites.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
initSprites(); // throws loudly if any sprite is ragged or has a bad char

ctx.fillStyle = '#5c94fc';
ctx.fillRect(0, 0, 320, 240);
const names = [
  'tile_grass','tile_stone','tile_brick','tile_blessing','tile_used',
  'tile_platform','tile_thorns','david_idle','david_run1','david_run2',
  'david_jump','manna','scroll','bread','sling','stone','heart','heart_empty',
  'altar_off','altar_on','puff','scorpion_1','scorpion_2','serpent_1',
  'serpent_2','raven_1','raven_2','lion_1','lion_2','bear_1','bear_2',
  'goliath_1','goliath_2','spear','gate',
];
names.forEach((n, i) => {
  drawSprite(ctx, n, 8 + (i % 16) * 19, 8 + Math.floor(i / 16) * 40);
});
```
