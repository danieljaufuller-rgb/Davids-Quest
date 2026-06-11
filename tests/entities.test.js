import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, updatePlayer, createEnemy, updateEnemy, createStone, updateStone } from '../src/entities.js';
import { JUMP_VEL } from '../src/constants.js';

const GRID = [
  '............',
  '............',
  '............',
  '............',
  '............',
  '............',
  '............',
  '............',
  '............',
  '............',
  '............',
  '....#.......',
  '############',
  '############',
];
const NO_INPUT = { left:false, right:false, jump:false, jumpPressed:false };

test('player falls under gravity and lands on the floor', () => {
  const p = createPlayer(16, 160);
  for (let i = 0; i < 120; i++) updatePlayer(p, NO_INPUT, GRID);
  assert.equal(p.y + p.h, 192); // floor top = row 12 * 16
  assert.equal(p.onGround, true);
});

test('jumpPressed on the ground launches the player', () => {
  const p = createPlayer(16, 160);
  for (let i = 0; i < 120; i++) updatePlayer(p, NO_INPUT, GRID);
  updatePlayer(p, { ...NO_INPUT, jump:true, jumpPressed:true }, GRID);
  assert.ok(p.vy < 0);
  assert.equal(p.jumped, true);
});

test('player accelerates right and respects max speed', () => {
  const p = createPlayer(16, 160);
  for (let i = 0; i < 120; i++) updatePlayer(p, NO_INPUT, GRID);
  for (let i = 0; i < 60; i++) updatePlayer(p, { ...NO_INPUT, right:true }, GRID);
  assert.ok(p.x > 16);
  assert.ok(p.vx <= 2.2 + 1e-9);
  assert.equal(p.facing, 1);
});

test('scorpion turns around at a wall', () => {
  // wall tile '#' at col 4, row 12 — scorpion walks right into it
  const e = createEnemy('scorpion', 16, 176);
  e.dir = 1;
  for (let i = 0; i < 120; i++) updateEnemy(e, GRID, { x: 999 });
  assert.equal(e.dir, -1); // bounced off the wall
});

test('stone flies in an arc and dies on solid ground', () => {
  const st = createStone(20, 170, 1);
  for (let i = 0; i < 120 && !st.dead; i++) updateStone(st, GRID);
  assert.equal(st.dead, true);
});
