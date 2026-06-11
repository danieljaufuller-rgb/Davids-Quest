// Pure logic — must work in Node (no DOM).
import { TILE, SOLID_TILES, PLATFORM_TILES } from './constants.js';

export function aabbOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// grid: array of row strings. Sides clamp solid so entities can't walk
// off the world edges; above/below are air (below = fall into a pit).
export function tileAt(grid, tx, ty) {
  if (ty < 0 || ty >= grid.length) return '.';
  if (tx < 0 || tx >= grid[0].length) return '#';
  return grid[ty][tx];
}

export function isSolid(ch) {
  return SOLID_TILES.has(ch);
}

// Move body by (vx, vy) with tile collision. Axis-separated sweep:
// X first, then Y. Mutates body. Returns { bumped: [{tx,ty,ch}] } —
// the solid tiles hit with the head this frame (for blessing blocks).
export function moveAndCollide(grid, body) {
  const bumped = [];

  // --- X axis ---
  body.x += body.vx;
  {
    const top = Math.floor(body.y / TILE);
    const bottom = Math.floor((body.y + body.h - 1) / TILE);
    if (body.vx > 0) {
      const tx = Math.floor((body.x + body.w - 1) / TILE);
      for (let ty = top; ty <= bottom; ty++) {
        if (isSolid(tileAt(grid, tx, ty))) {
          body.x = tx * TILE - body.w;
          body.vx = 0;
          break;
        }
      }
    } else if (body.vx < 0) {
      const tx = Math.floor(body.x / TILE);
      for (let ty = top; ty <= bottom; ty++) {
        if (isSolid(tileAt(grid, tx, ty))) {
          body.x = (tx + 1) * TILE;
          body.vx = 0;
          break;
        }
      }
    }
  }

  // --- Y axis ---
  const prevBottom = body.y + body.h;
  body.y += body.vy;
  body.onGround = false;
  {
    const left = Math.floor(body.x / TILE);
    const right = Math.floor((body.x + body.w - 1) / TILE);
    if (body.vy > 0) {
      const ty = Math.floor((body.y + body.h - 1) / TILE);
      for (let tx = left; tx <= right; tx++) {
        const ch = tileAt(grid, tx, ty);
        const tileTop = ty * TILE;
        const landSolid = isSolid(ch);
        // one-way platform: only if we crossed its top edge this frame
        const landPlatform = PLATFORM_TILES.has(ch) && prevBottom <= tileTop;
        if (landSolid || landPlatform) {
          body.y = tileTop - body.h;
          body.vy = 0;
          body.onGround = true;
          break;
        }
      }
    } else if (body.vy < 0) {
      const ty = Math.floor(body.y / TILE);
      for (let tx = left; tx <= right; tx++) {
        const ch = tileAt(grid, tx, ty);
        if (isSolid(ch)) {
          body.y = (ty + 1) * TILE;
          body.vy = 0;
          bumped.push({ tx, ty, ch });
        }
      }
    }
  }

  return { bumped };
}

// True if any tile the body overlaps is a hazard (thorns).
export function touchesHazard(grid, body, hazardSet) {
  const left = Math.floor(body.x / TILE);
  const right = Math.floor((body.x + body.w - 1) / TILE);
  const top = Math.floor(body.y / TILE);
  const bottom = Math.floor((body.y + body.h - 1) / TILE);
  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (hazardSet.has(tileAt(grid, tx, ty))) return true;
    }
  }
  return false;
}
