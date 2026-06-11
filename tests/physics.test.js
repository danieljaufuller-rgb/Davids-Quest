import test from 'node:test';
import assert from 'node:assert/strict';
import { aabbOverlap, tileAt, isSolid, moveAndCollide } from '../src/physics.js';

// 4-row, 8-col grid. '#'=solid ground, '-'=one-way platform, '.'=air
const GRID = [
  '........',
  '..-.....',
  '....#...',
  '########',
];

test('aabbOverlap detects overlap and separation', () => {
  assert.equal(aabbOverlap({x:0,y:0,w:10,h:10}, {x:5,y:5,w:10,h:10}), true);
  assert.equal(aabbOverlap({x:0,y:0,w:10,h:10}, {x:10,y:0,w:10,h:10}), false); // touching edges = no overlap
  assert.equal(aabbOverlap({x:0,y:0,w:10,h:10}, {x:30,y:30,w:5,h:5}), false);
});

test('tileAt reads grid; out-of-bounds sides are solid, top/bottom are air', () => {
  assert.equal(tileAt(GRID, 4, 2), '#');
  assert.equal(tileAt(GRID, 0, 0), '.');
  assert.equal(tileAt(GRID, -1, 2), '#');  // left wall
  assert.equal(tileAt(GRID, 8, 2), '#');   // right wall
  assert.equal(tileAt(GRID, 4, -1), '.');  // above map = air
  assert.equal(tileAt(GRID, 4, 4), '.');   // below map = air (fall = pit)
});

test('isSolid', () => {
  assert.equal(isSolid('#'), true);
  assert.equal(isSolid('?'), true);
  assert.equal(isSolid('U'), true);
  assert.equal(isSolid('.'), false);
  assert.equal(isSolid('-'), false);
});

test('falling body lands on solid ground and sets onGround', () => {
  const b = { x: 16, y: 34, w: 12, h: 14, vx: 0, vy: 6, onGround: false };
  moveAndCollide(GRID, b);
  // ground row is y=48 (row 3 * 16). body bottom must rest exactly on it.
  assert.equal(b.y + b.h, 48);
  assert.equal(b.vy, 0);
  assert.equal(b.onGround, true);
});

test('walking into a wall stops horizontal motion', () => {
  // solid tile at col 4, row 2 spans x:[64,80) y:[32,48)
  const b = { x: 50, y: 34, w: 12, h: 12, vx: 5, vy: 0, onGround: false };
  moveAndCollide(GRID, b);
  assert.equal(b.x + b.w, 64); // flush against the wall
  assert.equal(b.vx, 0);
});

test('bumping head returns the bumped tile coordinates', () => {
  // place body under the solid tile at col 4, row 2; moving up
  const b = { x: 66, y: 50, w: 12, h: 12, vx: 0, vy: -6, onGround: false };
  const result = moveAndCollide(GRID, b);
  assert.equal(b.vy, 0);
  assert.equal(result.bumped.length, 1);
  assert.deepEqual(result.bumped[0], { tx: 4, ty: 2, ch: '#' });
});

test('one-way platform: passes through from below, lands from above', () => {
  // platform '-' at col 2, row 1 → top edge y = 16
  const up = { x: 33, y: 30, w: 12, h: 12, vx: 0, vy: -5, onGround: false };
  moveAndCollide(GRID, up);
  assert.equal(up.vy, -5); // unobstructed
  const down = { x: 33, y: 0, w: 12, h: 12, vx: 0, vy: 5, onGround: false };
  moveAndCollide(GRID, down); // bottom moves from 12 → 17, crossing y=16
  assert.equal(down.y + down.h, 16);
  assert.equal(down.onGround, true);
});
