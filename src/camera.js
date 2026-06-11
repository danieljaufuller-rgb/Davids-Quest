// Pure logic — must work in Node (no DOM).
import { VIEW_W } from './constants.js';

export function createCamera() {
  return { x: 0, y: 0 };
}

// Horizontal-only follow camera (levels are exactly one screen tall).
export function updateCamera(cam, target, levelWidthPx) {
  const desired = Math.round(target.x + target.w / 2 - VIEW_W / 2);
  cam.x = Math.max(0, Math.min(desired, Math.max(0, levelWidthPx - VIEW_W)));
  cam.y = 0;
}
