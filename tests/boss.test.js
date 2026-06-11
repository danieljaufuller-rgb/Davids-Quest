import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoss, updateBoss, damageBoss, createProjectile, updateProjectile, BOSS_INFO } from '../src/boss.js';

const GRID = [
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '####################',
  '####################',
];

test('bosses spawn with their feet on the bottom of their tile', () => {
  for (const type of ['lion', 'bear', 'goliath']) {
    const b = createBoss(type, 160, 176); // spawn tile row 11 (y=176)
    assert.equal(b.y + b.h, 192, type);   // feet at tile bottom (y=176+16)
    assert.equal(b.hp, BOSS_INFO[type].hp, type);
  }
});

test('damageBoss decrements hp, grants i-frames, and kills at 0', () => {
  const b = createBoss('lion', 160, 176);
  const out = { projectiles: [], sounds: [], shockwave: false };
  assert.equal(damageBoss(b, out), true);
  assert.equal(b.hp, 2);
  assert.equal(damageBoss(b, out), false); // i-frames: no double hits
  b.hitFlash = 0;
  damageBoss(b, out);
  b.hitFlash = 0;
  damageBoss(b, out);
  assert.equal(b.dead, true);
  assert.ok(out.sounds.includes('bossDown'));
});

test('lion eventually lunges at the player', () => {
  const b = createBoss('lion', 160, 176);
  const player = { x: 40, y: 176, w: 12, h: 14, onGround: true };
  let lunged = false;
  for (let i = 0; i < 600; i++) {
    updateBoss(b, GRID, player, { projectiles: [], sounds: [], shockwave: false });
    if (b.state === 'lunge') lunged = true;
  }
  assert.equal(lunged, true);
});

test('bear emits rock projectiles', () => {
  const b = createBoss('bear', 160, 176);
  const player = { x: 40, y: 176, w: 12, h: 14, onGround: true };
  const collected = [];
  for (let i = 0; i < 600; i++) {
    const out = { projectiles: [], sounds: [], shockwave: false };
    updateBoss(b, GRID, player, out);
    collected.push(...out.projectiles);
  }
  assert.ok(collected.length >= 1);
  assert.equal(collected[0].kind, 'rock');
});

test('projectiles die on solid ground', () => {
  const pr = createProjectile('rock', 100, 100, 1);
  for (let i = 0; i < 300 && !pr.dead; i++) updateProjectile(pr, GRID);
  assert.equal(pr.dead, true);
});
