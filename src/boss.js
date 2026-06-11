// Boss AI for Lion, Bear, Goliath. DOM-free (testable in Node).
// updateBoss communicates outward via the `out` parameter:
//   out.projectiles — spawned rocks/spears for game.js to track
//   out.sounds      — sfx names for game.js to play
//   out.shockwave   — true on the frame Goliath lands (grounded player is hit)
import { GRAVITY, MAX_FALL, TILE } from './constants.js';
import { moveAndCollide, tileAt, isSolid } from './physics.js';

export const BOSS_INFO = {
  lion:    { name: 'THE LION',  hp: 3, scale: 2 },
  bear:    { name: 'THE BEAR',  hp: 5, scale: 2 },
  goliath: { name: 'GOLIATH',   hp: 6, scale: 3 },
};

// (x, y) is the top-left of the spawn tile; feet end up at the tile bottom.
export function createBoss(type, x, y) {
  const info = BOSS_INFO[type];
  const scale = info.scale;
  const w = 12 * scale;
  const h = (type === 'goliath' ? 15 : 13) * scale;
  return {
    type, name: info.name, x, y: y + TILE - h, w, h, vx: 0, vy: 0,
    onGround: false, dir: -1, hp: info.hp, maxHp: info.hp, scale,
    state: 'idle', timer: 60, anim: 0, hitFlash: 0, dead: false,
    deathTimer: 0, actions: 0,
  };
}

export function damageBoss(boss, out) {
  if (boss.hitFlash > 0 || boss.dead) return false;
  boss.hp--;
  boss.hitFlash = 45;
  out.sounds.push('bossHit');
  if (boss.hp <= 0) {
    boss.dead = true;
    boss.vx = 0;
    out.sounds.push('bossDown');
  }
  return true;
}

export function updateBoss(boss, grid, player, out) {
  boss.anim++;
  if (boss.hitFlash > 0) boss.hitFlash--;
  if (boss.dead) { boss.deathTimer++; return; }
  const facePlayer = () => { boss.dir = player.x < boss.x ? -1 : 1; };

  if (boss.type === 'lion') {
    // pace toward player → freeze (windup) → fast lunge → repeat, faster as hurt
    if (boss.state === 'idle') { boss.state = 'pace'; boss.timer = 90; }
    if (boss.state === 'pace') {
      facePlayer();
      boss.vx = boss.dir * (0.6 + 0.25 * (boss.maxHp - boss.hp));
      boss.timer--;
      if (boss.timer <= 0) { boss.state = 'windup'; boss.timer = 40; boss.vx = 0; out.sounds.push('bossHit'); }
    } else if (boss.state === 'windup') {
      boss.vx = 0;
      facePlayer();
      boss.timer--;
      if (boss.timer <= 0) {
        boss.state = 'lunge';
        boss.vx = boss.dir * 3.2;
        boss.vy = -2.5;
        boss.timer = 50;
      }
    } else if (boss.state === 'lunge') {
      boss.timer--;
      if (boss.timer <= 0 && boss.onGround) { boss.state = 'pace'; boss.timer = 90; }
    }
    boss.vy = Math.min(boss.vy + GRAVITY, MAX_FALL);
    moveAndCollide(grid, boss);

  } else if (boss.type === 'bear') {
    // walk → throw a rock (every 3rd action: charge instead), faster as hurt
    if (boss.state === 'idle') { boss.state = 'walk'; boss.timer = 100; }
    if (boss.state === 'walk') {
      facePlayer();
      boss.vx = boss.dir * (0.5 + 0.15 * (boss.maxHp - boss.hp));
      boss.timer--;
      if (boss.timer <= 0) {
        boss.actions++;
        if (boss.actions % 3 === 0) { boss.state = 'charge'; boss.timer = 55; boss.vx = boss.dir * 2.8; }
        else { boss.state = 'throw'; boss.timer = 30; boss.vx = 0; }
      }
    } else if (boss.state === 'throw') {
      boss.vx = 0;
      boss.timer--;
      if (boss.timer === 15) {
        out.projectiles.push(createProjectile('rock', boss.x + boss.w / 2, boss.y, boss.dir));
        out.sounds.push('throwStone');
      }
      if (boss.timer <= 0) { boss.state = 'walk'; boss.timer = 100; }
    } else if (boss.state === 'charge') {
      boss.timer--;
      if (boss.timer <= 0 || boss.vx === 0) { boss.state = 'walk'; boss.timer = 100; } // vx 0 = hit wall
    }
    boss.vy = Math.min(boss.vy + GRAVITY, MAX_FALL);
    moveAndCollide(grid, boss);

  } else if (boss.type === 'goliath') {
    // slow march → spear throw; every 3rd action a leap whose landing
    // shockwaves any grounded player. Spears come faster as he is hurt.
    if (boss.state === 'idle') { boss.state = 'march'; boss.timer = 140; }
    if (boss.state === 'march') {
      facePlayer();
      boss.vx = boss.dir * 0.35;
      boss.timer--;
      if (boss.timer <= 0) {
        boss.actions++;
        if (boss.actions % 3 === 0) { boss.state = 'leapWind'; boss.timer = 30; boss.vx = 0; }
        else { boss.state = 'spear'; boss.timer = 35; boss.vx = 0; }
      }
    } else if (boss.state === 'spear') {
      boss.timer--;
      if (boss.timer === 18) {
        const sx = boss.dir > 0 ? boss.x + boss.w : boss.x - 16;
        // aim at the player's height, clamped to Goliath's own body span —
        // grounded players get low spears; players on platforms are safe to sling
        const sy = Math.max(boss.y + 6, Math.min(player.y + 4, boss.y + boss.h - 10));
        out.projectiles.push(createProjectile('spear', sx, sy, boss.dir));
        out.sounds.push('throwStone');
      }
      if (boss.timer <= 0) {
        boss.state = 'march';
        boss.timer = Math.max(70, 140 - 15 * (boss.maxHp - boss.hp));
      }
    } else if (boss.state === 'leapWind') {
      boss.timer--;
      if (boss.timer <= 0) {
        boss.state = 'leap';
        boss.vy = -6.5;
        boss.vx = boss.dir * 1.2;
      }
    }
    boss.vy = Math.min(boss.vy + GRAVITY, MAX_FALL);
    moveAndCollide(grid, boss);
    if (boss.state === 'leap' && boss.onGround) {
      boss.state = 'march';
      boss.timer = 140;
      boss.vx = 0;
      out.shockwave = true;
      out.sounds.push('bump');
    }
  }
}

export function createProjectile(kind, x, y, dir) {
  if (kind === 'rock') {
    return { kind, x, y, w: 10, h: 10, vx: dir * 2.0, vy: -4.5,
             gravity: true, dead: false, t: 0, dir };
  }
  return { kind: 'spear', x, y, w: 16, h: 4, vx: dir * 3.0, vy: 0,
           gravity: false, dead: false, t: 0, dir };
}

export function updateProjectile(pr, grid) {
  pr.t++;
  if (pr.gravity) pr.vy = Math.min(pr.vy + GRAVITY * 0.6, MAX_FALL);
  pr.x += pr.vx;
  pr.y += pr.vy;
  const tx = Math.floor((pr.x + pr.w / 2) / TILE);
  const ty = Math.floor((pr.y + pr.h / 2) / TILE);
  // t > 8 lets a projectile clear the boss's own tile area before arming
  if (pr.t > 8 && isSolid(tileAt(grid, tx, ty))) pr.dead = true;
  if (pr.t > 360) pr.dead = true;
}
