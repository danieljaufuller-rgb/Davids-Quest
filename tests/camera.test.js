import test from 'node:test';
import assert from 'node:assert/strict';
import { createCamera, updateCamera } from '../src/camera.js';
import { VIEW_W } from '../src/constants.js';

test('camera centers on target', () => {
  const cam = createCamera();
  updateCamera(cam, { x: 500, y: 0, w: 12 }, 2000);
  // target center 506 → cam.x = 506 - 160 = 346
  assert.equal(cam.x, 346);
});

test('camera clamps to level edges', () => {
  const cam = createCamera();
  updateCamera(cam, { x: 5, y: 0, w: 12 }, 2000);
  assert.equal(cam.x, 0);
  updateCamera(cam, { x: 1990, y: 0, w: 12 }, 2000);
  assert.equal(cam.x, 2000 - VIEW_W);
});

test('camera never negative on narrow levels', () => {
  const cam = createCamera();
  updateCamera(cam, { x: 100, y: 0, w: 12 }, 300); // narrower than view
  assert.equal(cam.x, 0);
});
