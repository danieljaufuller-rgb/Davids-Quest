// Game orchestration: state machine, level lifecycle, interactions, rendering.
import {
  TILE, ROWS, VIEW_W, VIEW_H, MAX_HEARTS, START_LIVES, INVULN_FRAMES,
  KNOCKBACK_X, KNOCKBACK_Y, MANNA_PER_LIFE, STONE_COOLDOWN, STOMP_BOUNCE,
  HAZARD_TILES,
} from './constants.js';
import { input, updateInput } from './input.js';
import { aabbOverlap, touchesHazard } from './physics.js';
import { parseLevel, assignVerses, LEVELS } from './levels.js';
import { createCamera, updateCamera } from './camera.js';
import { drawSprite, THEMES } from './sprites.js';
import {
  createPlayer, updatePlayer, createEnemy, updateEnemy,
  createStone, updateStone,
} from './entities.js';
import { createBoss, updateBoss, damageBoss, updateProjectile } from './boss.js';
import * as hud from './hud.js';
import { sfx, toggleMute } from './audio.js';

const TILE_SPRITES = {
  '#': 'tile_grass', '=': 'tile_stone', 'B': 'tile_brick',
  '?': 'tile_blessing', 'M': 'tile_blessing', 'S': 'tile_blessing',
  'U': 'tile_used', '-': 'tile_platform', '^': 'tile_thorns',
};
const ITEM_SPRITES = { manna: 'manna', scroll: 'scroll', bread: 'bread', sling: 'sling' };

const mod = (v, m) => ((v % m) + m) % m;

export class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.frame = 0;
    this.reset();
  }

  reset() {
    this.state = 'title';
    this.levelIndex = 0;
    this.lives = START_LIVES;
    this.manna = 0;
    this.scrolls = [];      // collected verseIds, persists across levels
    this.checkpoint = null; // respawn point within the current level
    this.hasSling = false;  // persists across deaths within a run
  }

  startRun() {
    this.lives = START_LIVES;
    this.manna = 0;
    this.scrolls = [];
    this.hasSling = false;
    this.checkpoint = null;
    this.levelIndex = 0;
    this.loadLevel(0, false);
    this.state = 'intro';
    this.introTimer = 120;
  }

  loadLevel(index, fromCheckpoint) {
    const def = LEVELS[index];
    this.levelDef = def;
    const lvl = parseLevel(def.map);
    assignVerses(lvl, def.verseIds);
    this.grid = lvl.grid.map(r => r.split('')); // mutable: '?' -> 'U' on bump
    this.widthPx = lvl.widthPx;
    this.theme = THEMES[def.theme];
    this.enemies = [];
    this.items = [];
    this.gate = null;
    this.checkpointEnt = null;
    this.boss = null;
    this.stones = [];
    this.projectiles = [];
    this.puffs = [];
    for (const e of lvl.entities) {
      if (e.type === 'gate') {
        this.gate = { x: e.x, y: e.y - 16 }; // G marks the BOTTOM tile of the 16x32 arch
      } else if (e.type === 'checkpoint') {
        this.checkpointEnt = { x: e.x, y: e.y, active: false };
      } else if (e.type === 'manna' || e.type === 'scroll') {
        this.items.push({ ...e });
      } else if (e.type === 'lion' || e.type === 'bear' || e.type === 'goliath') {
        this.boss = createBoss(e.type, e.x, e.y);
      } else {
        this.enemies.push(createEnemy(e.type, e.x, e.y));
      }
    }
    const start = (fromCheckpoint && this.checkpoint) ? this.checkpoint : lvl.playerStart;
    this.player = createPlayer(start.x, start.y);
    this.player.hasSling = this.hasSling;
    if (fromCheckpoint && this.checkpoint && this.checkpointEnt) {
      this.checkpointEnt.active = true;
    }
    this.cam = createCamera();
    updateCamera(this.cam, this.player, this.widthPx);
  }

  // ---- per-frame update -------------------------------------------------
  tick() {
    this.frame++;
    updateInput();
    if (input.mutePressed) toggleMute();
    switch (this.state) {
      case 'title':
        if (input.confirmPressed) this.startRun();
        break;
      case 'intro':
        this.introTimer--;
        if (this.introTimer <= 0 || input.confirmPressed) this.state = 'playing';
        break;
      case 'playing':
        if (input.pausePressed) { this.state = 'pause'; break; }
        this.simulate();
        break;
      case 'pause':
        if (input.pausePressed) this.state = 'playing';
        break;
      case 'verse':
        if (input.confirmPressed) this.state = 'playing';
        break;
      case 'dead':
        this.deadTimer--;
        if (this.deadTimer <= 0) {
          if (this.lives < 0) this.state = 'gameover';
          else { this.loadLevel(this.levelIndex, true); this.state = 'playing'; }
        }
        break;
      case 'clear':
        this.clearTimer--;
        if (this.clearTimer <= 0) this.advanceLevel();
        break;
      case 'gameover':
      case 'victory':
        if (input.confirmPressed) this.reset();
        break;
    }
  }

  advanceLevel() {
    this.checkpoint = null;
    this.levelIndex++;
    if (this.levelIndex >= LEVELS.length) {
      this.state = 'victory';
      sfx('victory');
    } else {
      this.loadLevel(this.levelIndex, false);
      this.state = 'intro';
      this.introTimer = 120;
    }
  }

  levelClear() {
    if (this.state !== 'playing') return;
    this.state = 'clear';
    this.clearTimer = 150;
    sfx('clear');
  }

  checkMannaLife() {
    if (this.manna > 0 && this.manna % MANNA_PER_LIFE === 0) {
      this.lives++;
      sfx('powerup');
    }
  }

  damagePlayer(fromX) {
    const p = this.player;
    if (p.invuln > 0) return;
    p.hearts--;
    p.invuln = INVULN_FRAMES;
    p.vx = p.x + p.w / 2 < fromX ? -KNOCKBACK_X : KNOCKBACK_X;
    p.vy = KNOCKBACK_Y;
    sfx('hurt');
    if (p.hearts <= 0) this.loseLife();
  }

  loseLife() {
    this.lives--;
    sfx(this.lives < 0 ? 'gameOver' : 'hurt');
    this.state = 'dead';
    this.deadTimer = 60;
  }

  simulate() {
    const p = this.player;
    const bumped = updatePlayer(p, input, this.grid);
    if (p.jumped) sfx('jump');

    // sling
    if (input.firePressed && p.hasSling && p.slingCooldown === 0) {
      this.stones.push(createStone(p.x + (p.facing > 0 ? p.w : -6), p.y + 4, p.facing));
      p.slingCooldown = STONE_COOLDOWN;
      sfx('throwStone');
    }

    // blessing blocks (head bumps)
    for (const b of bumped) {
      if (b.ch === '?') {
        this.grid[b.ty][b.tx] = 'U';
        this.manna++;
        this.checkMannaLife();
        this.puffs.push({ x: b.tx * TILE, y: (b.ty - 1) * TILE, t: 0 });
        sfx('manna');
      } else if (b.ch === 'M') {
        this.grid[b.ty][b.tx] = 'U';
        this.items.push({ type: 'bread', x: b.tx * TILE, y: (b.ty - 1) * TILE });
        sfx('bump');
      } else if (b.ch === 'S') {
        this.grid[b.ty][b.tx] = 'U';
        this.items.push({ type: 'sling', x: b.tx * TILE, y: (b.ty - 1) * TILE });
        sfx('bump');
      } else {
        sfx('bump');
      }
    }

    // items
    for (const it of this.items) {
      const box = { x: it.x + 2, y: it.y + 2, w: 12, h: 12 };
      if (!it.taken && aabbOverlap(p, box)) {
        it.taken = true;
        if (it.type === 'manna') { this.manna++; this.checkMannaLife(); sfx('manna'); }
        else if (it.type === 'scroll') {
          this.scrolls.push(it.verseId);
          this.activeVerse = it.verseId;
          this.state = 'verse';
          sfx('scroll');
        }
        else if (it.type === 'bread') { p.hearts = Math.min(MAX_HEARTS, p.hearts + 1); sfx('powerup'); }
        else if (it.type === 'sling') { p.hasSling = true; this.hasSling = true; sfx('powerup'); }
      }
    }
    this.items = this.items.filter(i => !i.taken);

    // checkpoint altar
    const cp = this.checkpointEnt;
    if (cp && !cp.active && aabbOverlap(p, { x: cp.x, y: cp.y, w: 16, h: 16 })) {
      cp.active = true;
      this.checkpoint = { x: cp.x + 2, y: cp.y };
      sfx('checkpoint');
    }

    // enemies
    for (const e of this.enemies) {
      if (e.dead) continue;
      updateEnemy(e, this.grid, p);
      if (e.y > ROWS * TILE + 48) { e.dead = true; continue; }
      if (aabbOverlap(p, e)) {
        if (p.vy > 0 && p.y + p.h - e.y < 10) {
          e.dead = true;
          this.puffs.push({ x: e.x, y: e.y, t: 0 });
          p.vy = STOMP_BOUNCE;
          sfx('stomp');
        } else {
          this.damagePlayer(e.x + e.w / 2);
        }
      }
    }

    // sling stones
    for (const st of this.stones) {
      updateStone(st, this.grid);
      if (st.dead) continue;
      for (const e of this.enemies) {
        if (!e.dead && aabbOverlap(st, e)) {
          e.dead = true;
          st.dead = true;
          this.puffs.push({ x: e.x, y: e.y, t: 0 });
          sfx('stomp');
        }
      }
      if (this.boss && !this.boss.dead && !st.dead && aabbOverlap(st, this.boss)) {
        st.dead = true;
        if (this.boss.type === 'goliath' && st.y > this.boss.y + this.boss.h / 3) {
          sfx('clank'); // armor — only Goliath's head is vulnerable
        } else {
          const out = { projectiles: [], sounds: [], shockwave: false };
          damageBoss(this.boss, out);
          for (const s of out.sounds) sfx(s);
        }
      }
    }
    this.stones = this.stones.filter(s => !s.dead);

    // boss
    if (this.boss) {
      const b = this.boss;
      const out = { projectiles: [], sounds: [], shockwave: false };
      updateBoss(b, this.grid, p, out);
      if (!b.dead) {
        if (out.shockwave && p.onGround) this.damagePlayer(b.x + b.w / 2);
        if (aabbOverlap(p, b)) {
          if (p.vy > 0 && p.y + p.h - b.y < 12) {
            p.vy = STOMP_BOUNCE;
            if (b.type === 'goliath') sfx('clank'); // can't stomp a giant
            else damageBoss(b, out);
          } else {
            this.damagePlayer(b.x + b.w / 2);
          }
        }
      } else {
        if (b.deathTimer === 1) this.puffs.push({ x: b.x + b.w / 2 - 8, y: b.y, t: 0 });
        if (b.deathTimer > 90) this.levelClear();
      }
      for (const s of out.sounds) sfx(s);
      this.projectiles.push(...out.projectiles);
    }

    // boss projectiles
    for (const pr of this.projectiles) {
      updateProjectile(pr, this.grid);
      if (!pr.dead && aabbOverlap(p, pr)) {
        pr.dead = true;
        this.damagePlayer(pr.x + pr.w / 2);
      }
    }
    this.projectiles = this.projectiles.filter(pr => !pr.dead);

    // hazards and pits
    if (touchesHazard(this.grid, p, HAZARD_TILES)) {
      this.damagePlayer(p.x + p.facing * 8);
    }
    if (p.y > ROWS * TILE + 32) this.loseLife();

    // goal gate
    if (this.gate && aabbOverlap(p, { x: this.gate.x, y: this.gate.y, w: 16, h: 32 })) {
      this.levelClear();
    }

    // cleanup
    for (const f of this.puffs) f.t++;
    this.puffs = this.puffs.filter(f => f.t < 24);
    this.enemies = this.enemies.filter(e => !e.dead);

    updateCamera(this.cam, p, this.widthPx);
  }

  // ---- rendering ----------------------------------------------------------
  draw() {
    const ctx = this.ctx;
    if (this.state === 'title')    { hud.drawTitle(ctx, this.frame); return; }
    if (this.state === 'intro')    { hud.drawIntro(ctx, this.levelDef, this.lives); return; }
    if (this.state === 'gameover') { hud.drawGameOver(ctx, this.frame); return; }
    if (this.state === 'victory')  { hud.drawVictory(ctx, this, this.frame); return; }

    this.drawWorld();
    hud.drawHud(ctx, this);
    if (this.boss && !this.boss.dead) hud.drawBossHealth(ctx, this.boss);
    if (this.state === 'verse') hud.drawVerseOverlay(ctx, this.activeVerse, this.frame);
    if (this.state === 'pause') hud.drawPause(ctx);
    if (this.state === 'clear') {
      hud.drawText(ctx, this.boss ? 'BOSS DEFEATED!' : 'LEVEL CLEAR!',
        VIEW_W / 2, 100, { size: 16, align: 'center', color: '#f8d020' });
    }
  }

  drawWorld() {
    const ctx = this.ctx;
    const cam = this.cam;
    const th = this.theme;

    // sky + parallax background
    ctx.fillStyle = th.sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = th.cloud;
    for (let i = 0; i < 4; i++) {
      const cx = mod(i * 110 + 30 - cam.x * 0.25, VIEW_W + 60) - 30;
      const cy = 28 + (i % 2) * 22;
      ctx.fillRect(cx, cy, 34, 8);
      ctx.fillRect(cx + 6, cy - 5, 20, 6);
    }
    ctx.fillStyle = th.hillFar;
    for (let i = 0; i < 6; i++) {
      const hx = mod(i * 100 - cam.x * 0.5, VIEW_W + 100) - 50;
      ctx.beginPath();
      ctx.arc(hx, VIEW_H, 60, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = th.hillNear;
    for (let i = 0; i < 5; i++) {
      const hx = mod(i * 140 + 40 - cam.x * 0.75, VIEW_W + 140) - 70;
      ctx.beginPath();
      ctx.arc(hx, VIEW_H + 20, 80, Math.PI, 0);
      ctx.fill();
    }

    // tiles (only the visible column range)
    const first = Math.max(0, Math.floor(cam.x / TILE));
    const last = Math.min(first + Math.ceil(VIEW_W / TILE) + 1, this.grid[0].length);
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = first; tx < last; tx++) {
        const name = TILE_SPRITES[this.grid[ty][tx]];
        if (name) drawSprite(ctx, name, tx * TILE - cam.x, ty * TILE);
      }
    }

    // gate + altar
    if (this.gate) drawSprite(ctx, 'gate', this.gate.x - cam.x, this.gate.y);
    if (this.checkpointEnt) {
      drawSprite(ctx, this.checkpointEnt.active ? 'altar_on' : 'altar_off',
        this.checkpointEnt.x - cam.x, this.checkpointEnt.y);
    }

    // items (manna/scrolls bob gently)
    for (const it of this.items) {
      const bob = (it.type === 'manna' || it.type === 'scroll')
        ? Math.sin((this.frame + it.x) / 15) * 2 : 0;
      drawSprite(ctx, ITEM_SPRITES[it.type], it.x - cam.x, it.y + bob);
    }

    // enemies (sprites drawn facing right; flip when moving left)
    for (const e of this.enemies) {
      const name = `${e.type}_${1 + (Math.floor(e.anim / 10) % 2)}`;
      this.drawActor(name, e, e.dir < 0, 1);
    }

    // boss
    if (this.boss) {
      const b = this.boss;
      const flashing = b.hitFlash > 0 && b.hitFlash % 6 < 3;
      const dying = b.dead && (b.deathTimer > 60 || b.deathTimer % 4 < 2);
      if (!flashing && !dying) {
        const name = `${b.type}_${1 + (Math.floor(b.anim / 12) % 2)}`;
        this.drawActor(name, b, b.dir < 0, b.scale);
      }
    }

    // projectiles + stones
    for (const pr of this.projectiles) {
      if (pr.kind === 'rock') drawSprite(ctx, 'stone', pr.x - cam.x, pr.y, { scale: 1.5 });
      else drawSprite(ctx, 'spear', pr.x - cam.x, pr.y - 6, { flip: pr.dir < 0 });
    }
    for (const st of this.stones) drawSprite(ctx, 'stone', st.x - cam.x, st.y);

    // player (blinks while invulnerable)
    const p = this.player;
    if (p.invuln === 0 || p.invuln % 6 < 3) {
      let name = 'david_idle';
      if (!p.onGround) name = 'david_jump';
      else if (Math.abs(p.vx) > 0.3) {
        name = (Math.floor(p.animTime / 8) % 2) ? 'david_run1' : 'david_run2';
      }
      this.drawActor(name, p, p.facing < 0, 1);
    }

    // effects
    for (const f of this.puffs) drawSprite(ctx, 'puff', f.x - cam.x, f.y);
  }

  // Draw a 16x16(-scaled) sprite centered on a body's hitbox, feet-aligned.
  drawActor(name, body, flip, scale) {
    const size = 16 * scale;
    drawSprite(this.ctx, name,
      body.x - (size - body.w) / 2 - this.cam.x,
      body.y + body.h - size,
      { flip, scale });
  }
}
