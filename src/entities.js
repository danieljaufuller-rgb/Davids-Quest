// Entity factories + per-frame movement/AI. DOM-free (testable in Node).
// Interactions between entities (stomp, damage, pickup) live in game.js.
import {
  GRAVITY, MAX_FALL, MOVE_ACCEL, MOVE_MAX, FRICTION, JUMP_VEL, JUMP_CUT,
  COYOTE_FRAMES, JUMP_BUFFER_FRAMES, MAX_HEARTS, STONE_SPEED, STONE_GRAVITY,
  SCORPION_SPEED, SERPENT_HOP_VX, SERPENT_HOP_VY, SERPENT_HOP_PAUSE,
  RAVEN_SPEED, RAVEN_AMPLITUDE, RAVEN_WAVELENGTH, TILE,
} from './constants.js';
import { moveAndCollide, tileAt, isSolid } from './physics.js';

// Player body is 12x14 inside the 16x16 sprite (draw at x-2, y-2).
export function createPlayer(x, y) {
  return {
    type: 'player', x, y, w: 12, h: 14, vx: 0, vy: 0, onGround: false,
    facing: 1, hearts: MAX_HEARTS, invuln: 0, coyote: 0, jumpBuffer: 0,
    hasSling: false, slingCooldown: 0, animTime: 0, jumped: false,
  };
}

// Returns the list of head-bumped tiles (for blessing blocks in game.js).
export function updatePlayer(p, input, grid) {
  p.jumped = false;
  if (input.left && !input.right) { p.vx -= MOVE_ACCEL; p.facing = -1; }
  else if (input.right && !input.left) { p.vx += MOVE_ACCEL; p.facing = 1; }
  else { p.vx *= FRICTION; if (Math.abs(p.vx) < 0.05) p.vx = 0; }
  p.vx = Math.max(-MOVE_MAX, Math.min(MOVE_MAX, p.vx));

  p.coyote = p.onGround ? COYOTE_FRAMES : Math.max(0, p.coyote - 1);
  p.jumpBuffer = input.jumpPressed ? JUMP_BUFFER_FRAMES : Math.max(0, p.jumpBuffer - 1);
  if (p.jumpBuffer > 0 && p.coyote > 0) {
    p.vy = JUMP_VEL;
    p.coyote = 0;
    p.jumpBuffer = 0;
    p.jumped = true; // game.js plays the jump sfx when this is set
  }
  if (!input.jump && p.vy < 0) p.vy *= JUMP_CUT; // variable jump height

  p.vy = Math.min(p.vy + GRAVITY, MAX_FALL);
  const { bumped } = moveAndCollide(grid, p);

  if (p.invuln > 0) p.invuln--;
  if (p.slingCooldown > 0) p.slingCooldown--;
  p.animTime++;
  return bumped;
}

// Enemy spawn (x,y) is the top-left of the map tile it was placed on.
export function createEnemy(type, x, y) {
  if (type === 'scorpion') {
    return { type, x: x + 2, y: y + 8, w: 12, h: 8, vx: 0, vy: 0,
             dir: -1, onGround: false, anim: 0, dead: false };
  }
  if (type === 'serpent') {
    return { type, x: x + 2, y: y + 6, w: 12, h: 10, vx: 0, vy: 0,
             dir: -1, onGround: false, hopTimer: SERPENT_HOP_PAUSE,
             anim: 0, dead: false };
  }
  if (type === 'raven') {
    return { type, x, y, w: 12, h: 10, vx: 0, vy: 0, dir: -1,
             baseX: x, baseY: y, t: 0, anim: 0, dead: false };
  }
  throw new Error('unknown enemy type: ' + type);
}

export function updateEnemy(e, grid, player) {
  e.anim++;
  if (e.type === 'scorpion') {
    e.vx = e.dir * SCORPION_SPEED;
    e.vy = Math.min(e.vy + GRAVITY, MAX_FALL);
    moveAndCollide(grid, e);
    if (e.vx === 0) {
      e.dir *= -1; // hit a wall
    } else if (e.onGround) {
      // turn at ledges: is there ground under the leading edge?
      const aheadX = e.dir > 0 ? e.x + e.w + 1 : e.x - 1;
      const tx = Math.floor(aheadX / TILE);
      const ty = Math.floor((e.y + e.h + 1) / TILE);
      if (!isSolid(tileAt(grid, tx, ty))) e.dir *= -1;
    }
  } else if (e.type === 'serpent') {
    if (e.onGround) {
      e.vx = 0;
      e.hopTimer--;
      if (e.hopTimer <= 0) {
        e.dir = player.x < e.x ? -1 : 1; // hop toward the player
        e.vx = e.dir * SERPENT_HOP_VX;
        e.vy = SERPENT_HOP_VY;
        e.hopTimer = SERPENT_HOP_PAUSE;
      }
    }
    e.vy = Math.min(e.vy + GRAVITY, MAX_FALL);
    moveAndCollide(grid, e);
  } else if (e.type === 'raven') {
    // no gravity: patrols ±48px around spawn on a sine wave
    e.t++;
    e.x += e.dir * RAVEN_SPEED;
    if (e.x > e.baseX + 48) e.dir = -1;
    if (e.x < e.baseX - 48) e.dir = 1;
    e.y = e.baseY + Math.sin((e.t * 2 * Math.PI) / RAVEN_WAVELENGTH) * RAVEN_AMPLITUDE;
  }
}

export function createStone(x, y, dir) {
  return { type: 'stone', x, y, w: 6, h: 6,
           vx: dir * STONE_SPEED, vy: -1.2, dead: false, t: 0 };
}

export function updateStone(st, grid) {
  st.t++;
  st.vy += STONE_GRAVITY;
  st.x += st.vx;
  st.y += st.vy;
  const tx = Math.floor((st.x + 3) / TILE);
  const ty = Math.floor((st.y + 3) / TILE);
  if (isSolid(tileAt(grid, tx, ty))) st.dead = true;
  if (st.t > 240) st.dead = true; // safety: never live forever
}
