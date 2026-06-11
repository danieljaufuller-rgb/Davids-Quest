# "David's Quest" — Biblical 2D Platformer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, web-based, Mario-style 2D pixel-art platformer for children 7–14, themed on the story of David (1 Samuel 16–17), with 6 platforming levels, 3 boss battles (Lion, Bear, Goliath), collectible Bible verses, and zero external dependencies.

**Architecture:** Vanilla ES-module JavaScript + HTML5 Canvas 2D. Internal resolution 320×240 scaled up with crisp pixels. All art is programmatic pixel data (string grids → offscreen canvases), all audio is WebAudio oscillators — **no asset files, no network requests, no npm packages**. Pure-logic modules (physics, level parsing, camera) are tested with Node's built-in test runner (`node --test`). The game is a static site deployable to Cloudflare Pages as-is.

**Tech Stack:** HTML5, CSS, vanilla JavaScript (ES modules), Canvas 2D, WebAudio API, `node:test` for unit tests. No build step. No dependencies.

---

## EXECUTION RULES (read before Task 1, re-read if unsure)

1. **Do not deviate from this plan.** Every file's full contents or exact edits are given. Do not "improve", rename, reorder, or add features. If a step seems wrong, follow it anyway — it has been verified.
2. **Copy code blocks exactly**, including comments. Type signatures, function names, and constants in later tasks depend on earlier tasks matching exactly.
3. **Legal constraint:** All art is original pixel data defined in this plan. Do NOT copy, trace, or reference Nintendo/Mario sprites, names, sounds, or assets in any way. "Mario-style" means genre conventions only (run, jump, stomp, blocks, flag-equivalent goal).
4. **Content constraint:** This is a children's game on Protestant Christian themes. No blood, no death animations (enemies vanish in a star puff), no occult imagery. Bible quotes use the King James Version (public domain).
5. **After every task:** run `node --test tests/` (must pass), then the manual browser check if the task has one, then commit with the exact message given.
6. **To run the game locally:** from the repo root run `python -m http.server 8080` (or `npx http-server -p 8080`) and open `http://localhost:8080`. ES modules do not work from `file://`.
7. **Node version:** anything ≥ 18 works (`node --test` is built in).
8. If a test fails, fix your transcription against this plan — the plan's code passes its own tests. Do not rewrite the test to pass.

---

## File Structure (final state)

```
bible-game/
├── index.html              # Single page, canvas, loads src/main.js
├── styles.css              # Centered canvas, pixelated scaling
├── README.md               # How to play / run / deploy
├── docs/superpowers/plans/ # This plan
├── src/
│   ├── constants.js        # All tuning numbers, tile sets (no DOM)
│   ├── input.js            # Keyboard state with justPressed edges (DOM)
│   ├── physics.js          # AABB + tile collision, pure logic (no DOM)
│   ├── levels.js           # ASCII maps, parser, verse data (no DOM)
│   ├── camera.js           # Camera follow + clamp, pure logic (no DOM)
│   ├── sprites.js          # Palette, pixel data, sprite cache (DOM/canvas)
│   ├── entities.js         # Player/enemy/item factories + update logic
│   ├── boss.js             # Lion, Bear, Goliath behaviors
│   ├── hud.js              # Hearts, counters, overlays, screens
│   ├── audio.js            # WebAudio sfx + jingles
│   ├── game.js             # State machine, level lifecycle, update/draw
│   └── main.js             # Bootstrap: canvas, loop, wiring
└── tests/
    ├── physics.test.js
    ├── levels.test.js
    └── camera.test.js
```

**Module dependency rule:** `constants.js`, `physics.js`, `levels.js`, `camera.js` must never import anything that touches `document`/`window` — they run in Node tests.

---

## Game Design Reference (the executor consults this; the code below already implements it)

- **Hero:** David, a young shepherd. 3 hearts. 3 lives. Checkpoint altars mid-level.
- **Controls:** ←/→ or A/D move · Z / Space / ↑ / W jump (hold = higher) · X / K throw sling stone (after Sling power-up) · P pause · M mute · Enter confirm.
- **Verbs:** run, jump, stomp enemies, bump blessing blocks from below, throw stones.
- **Collectibles:** *Manna* (coin equivalent; 50 manna = +1 life), *Scrolls* (show a KJV verse overlay; 2 per level, 12 total), *Bread* (+1 heart), *Sling* (enables stone throwing).
- **Enemies:** Scorpion (walks, turns at edges/walls), Serpent (hops toward player), Raven (flies in sine wave). All defeated by stomp or stone → star-puff.
- **Hazards:** Thorn spikes (damage), pits (lose a life).
- **Worlds:** W1 Shepherd's Fields (boss: **Lion**) · W2 Wilderness of Judah (boss: **Bear**) · W3 Valley of Elah (boss: **Goliath**). Per 1 Samuel 17:34–37 — David protected his flock from the lion and the bear before facing Goliath.
- **Bosses:** Lion = lunge dasher, stomp ×3. Bear = rock-thrower + charger, stomp or stone, 5 HP. Goliath = spear-thrower + shockwave jumps, immune to stomp, sling-stones to the head ×6 (echoes the story — the sling defeats him).
- **Level order (9 scenes):** w1-1, w1-2, w1-boss, w2-1, w2-2, w2-boss, w3-1, w3-2, w3-boss → Victory screen (1 Samuel 17:45).
- **Tone:** encouraging. Game over screen says "Be strong and courageous! — Joshua 1:9" with retry.

---

### Task 1: Project scaffold

**Files:**
- Create: `.gitignore`, `index.html`, `styles.css`, `README.md`, `src/main.js`

- [ ] **Step 1: Initialize git**

```bash
git init
git branch -m main
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.DS_Store
Thumbs.db
```

- [ ] **Step 3: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>David's Quest — A Bible Adventure</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main id="stage">
    <canvas id="game" width="320" height="240"></canvas>
    <p id="controls-hint">Move: ←→ / AD &nbsp;·&nbsp; Jump: Z / Space &nbsp;·&nbsp; Sling: X / K &nbsp;·&nbsp; Pause: P &nbsp;·&nbsp; Mute: M</p>
  </main>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create `styles.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; background: #1a1a24; }
#stage {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
#game {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  width: min(96vw, calc(96vh * 4 / 3));
  height: auto;
  aspect-ratio: 4 / 3;
  background: #000;
}
#controls-hint {
  color: #8890a0;
  font-family: monospace;
  font-size: 13px;
  text-align: center;
  padding: 0 8px;
}
```

- [ ] **Step 5: Create placeholder `src/main.js`** (replaced fully in Task 7)

```js
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#5c94fc';
ctx.fillRect(0, 0, 320, 240);
ctx.fillStyle = '#fff';
ctx.font = '10px monospace';
ctx.fillText('David\'s Quest — scaffold OK', 70, 120);
```

- [ ] **Step 6: Create `README.md`**

```markdown
# David's Quest — A Bible Adventure

A free, kid-friendly (ages 7–14) 2D pixel platformer telling the story of
David the shepherd (1 Samuel 16–17). Run, jump, collect manna and scripture
scrolls, and face the lion, the bear, and Goliath.

## Run locally
    python -m http.server 8080
    # then open http://localhost:8080

## Tests
    node --test tests/

## Deploy
Static site — deploy the repo root to Cloudflare Pages (no build command,
output directory `/`).
```

- [ ] **Step 7: Manual check**

Run: `python -m http.server 8080`, open `http://localhost:8080`.
Expected: sky-blue canvas with text "David's Quest — scaffold OK", centered on a dark page, hint text below.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: project scaffold with canvas page"
```

---

### Task 2: Constants and input

**Files:**
- Create: `src/constants.js`
- Create: `src/input.js`

- [ ] **Step 1: Create `src/constants.js`** — every tuning number in the game. **Never hardcode these values elsewhere; always import.**

```js
// Pure data module — must work in Node (no DOM).
export const TILE = 16;             // tile size in px
export const VIEW_W = 320;          // internal canvas width
export const VIEW_H = 240;          // internal canvas height
export const ROWS = 14;             // every level map is 14 rows tall

// Player physics (units: px per frame at 60fps)
export const GRAVITY = 0.35;
export const MAX_FALL = 7;
export const MOVE_ACCEL = 0.25;
export const MOVE_MAX = 2.2;
export const FRICTION = 0.8;        // vx multiplier when no input
export const JUMP_VEL = -7.2;
export const JUMP_CUT = 0.45;       // vy multiplier when jump released early
export const COYOTE_FRAMES = 6;     // jump grace after leaving a ledge
export const JUMP_BUFFER_FRAMES = 6;// jump grace before landing
export const STOMP_BOUNCE = -4.5;

// Combat / health
export const MAX_HEARTS = 3;
export const START_LIVES = 3;
export const INVULN_FRAMES = 90;    // after taking damage
export const KNOCKBACK_X = 2.5;
export const KNOCKBACK_Y = -3.5;
export const MANNA_PER_LIFE = 50;

// Sling stones
export const STONE_SPEED = 4.5;
export const STONE_GRAVITY = 0.12;
export const STONE_COOLDOWN = 20;   // frames between throws

// Enemies
export const SCORPION_SPEED = 0.6;
export const SERPENT_HOP_VX = 1.2;
export const SERPENT_HOP_VY = -4.5;
export const SERPENT_HOP_PAUSE = 45; // frames between hops
export const RAVEN_SPEED = 1.0;
export const RAVEN_AMPLITUDE = 24;  // sine wave height px
export const RAVEN_WAVELENGTH = 90; // frames per sine cycle

// Tile classification (map characters)
export const SOLID_TILES = new Set(['#', '=', 'B', '?', 'M', 'S', 'U']);
export const PLATFORM_TILES = new Set(['-']); // one-way, land from above only
export const HAZARD_TILES = new Set(['^']);

// Entity-spawn map characters → entity type names
export const ENTITY_CHARS = {
  P: 'playerStart',
  G: 'gate',
  C: 'checkpoint',
  o: 'manna',
  s: 'scroll',
  w: 'scorpion',
  j: 'serpent',
  f: 'raven',
  '1': 'lion',
  '2': 'bear',
  '3': 'goliath',
};
```

- [ ] **Step 2: Create `src/input.js`**

```js
// Keyboard state with per-frame "justPressed" edge detection.
// game code reads input.left/right etc. and input.jumpPressed (edge).
const held = {
  left: false, right: false, jump: false, fire: false,
  pause: false, mute: false, confirm: false,
};
const prev = { ...held };
// snapshot of edges, refreshed once per frame by update()
export const input = {
  left: false, right: false, jump: false, fire: false,
  jumpPressed: false, firePressed: false,
  pausePressed: false, mutePressed: false, confirmPressed: false,
};

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump', Space: 'jump',
  KeyX: 'fire', KeyK: 'fire',
  KeyP: 'pause', KeyM: 'mute', Enter: 'confirm',
};

export function initInput() {
  window.addEventListener('keydown', (e) => {
    const name = KEYMAP[e.code];
    if (!name) return;
    e.preventDefault();
    held[name] = true;
  });
  window.addEventListener('keyup', (e) => {
    const name = KEYMAP[e.code];
    if (!name) return;
    e.preventDefault();
    held[name] = false;
  });
}

// Call exactly once per simulated frame, before game update.
export function updateInput() {
  input.left = held.left;
  input.right = held.right;
  input.jump = held.jump;
  input.fire = held.fire;
  input.jumpPressed = held.jump && !prev.jump;
  input.firePressed = held.fire && !prev.fire;
  input.pausePressed = held.pause && !prev.pause;
  input.mutePressed = held.mute && !prev.mute;
  input.confirmPressed = held.confirm && !prev.confirm;
  Object.assign(prev, held);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/constants.js src/input.js
git commit -m "feat: game constants and keyboard input module"
```

---

### Task 3: Physics module (TDD)

**Files:**
- Create: `tests/physics.test.js`
- Create: `src/physics.js`

The physics module is pure logic. A "body" is `{ x, y, w, h, vx, vy, onGround }` where `x,y` is the **top-left corner** in pixels. A "grid" is an array of row-strings of map characters (same format levels use).

- [ ] **Step 1: Write the failing tests** — create `tests/physics.test.js`:

```js
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
  const b = { x: 16, y: 20, w: 12, h: 14, vx: 0, vy: 6, onGround: false };
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/`
Expected: FAIL — cannot find module `../src/physics.js`.

- [ ] **Step 3: Create `src/physics.js`**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/`
Expected: all physics tests PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/physics.js tests/physics.test.js
git commit -m "feat: AABB tile physics with one-way platforms and head bumps"
```

---

### Task 4: Level format and parser (TDD)

**Files:**
- Create: `tests/levels.test.js`
- Create: `src/levels.js` (parser + verse data + ONE test map; the 9 real maps are added in Tasks 13–15)

Map format: an array of equal-length strings, exactly 14 rows (`ROWS`). Characters: `.` air · `#` grass block · `=` stone block · `B` brick · `?` blessing block (manna) · `M` blessing block (bread) · `S` blessing block (sling) · `U` used block · `-` one-way platform · `^` thorns · plus entity chars from `ENTITY_CHARS` (`P G C o s w j f 1 2 3`). Entity chars are extracted by the parser and replaced with `.` in the collision grid.

- [ ] **Step 1: Write the failing tests** — create `tests/levels.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLevel, assignVerses, LEVELS, VERSES } from '../src/levels.js';
import { ROWS, SOLID_TILES } from '../src/constants.js';

const MAP = [
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '.....?M.............',
  '....................',
  '..........s.........',
  '........----........',
  '...o.o..............',
  '.P.........w......G.',
  '....................',
  '######....##########',
  '######....##########',
];

test('parseLevel extracts entities and cleans the grid', () => {
  const lvl = parseLevel(MAP);
  assert.equal(lvl.grid.length, ROWS);
  assert.equal(lvl.widthTiles, 20);
  assert.equal(lvl.widthPx, 320);
  // entity chars removed from grid
  assert.equal(lvl.grid[10][1], '.');
  assert.equal(lvl.grid[10][18], '.');
  // block chars kept in grid (they are solid tiles, not entities)
  assert.equal(lvl.grid[5][5], '?');
  assert.equal(lvl.grid[5][6], 'M');
  // player start in px (top-left of tile)
  assert.deepEqual(lvl.playerStart, { x: 16, y: 160 });
  // entities list
  const types = lvl.entities.map(e => e.type).sort();
  assert.deepEqual(types, ['gate', 'manna', 'manna', 'scorpion', 'scroll']);
  const gate = lvl.entities.find(e => e.type === 'gate');
  assert.deepEqual({ x: gate.x, y: gate.y }, { x: 288, y: 160 });
});

test('parseLevel throws on ragged or wrong-height maps', () => {
  assert.throws(() => parseLevel(['..', '...']));
  assert.throws(() => parseLevel(['....']));
});

test('all shipped levels parse and have required structure', () => {
  assert.ok(LEVELS.length >= 1);
  for (const def of LEVELS) {
    const lvl = parseLevel(def.map);
    assert.ok(lvl.playerStart, `${def.id} needs a P`);
    const hasGoal = lvl.entities.some(e =>
      e.type === 'gate' || e.type === 'lion' || e.type === 'bear' || e.type === 'goliath');
    assert.ok(hasGoal, `${def.id} needs a G or a boss`);
    // every scroll gets a valid verse after assignment
    assignVerses(lvl, def.verseIds);
    for (const e of lvl.entities.filter(e => e.type === 'scroll')) {
      assert.ok(VERSES[e.verseId], `${def.id} scroll missing verse ${e.verseId}`);
    }
  }
});

test('grid contains only known characters', () => {
  const known = new Set(['.', '-', '^', ...SOLID_TILES]);
  for (const def of LEVELS) {
    const lvl = parseLevel(def.map);
    for (const row of lvl.grid) {
      for (const ch of row) {
        assert.ok(known.has(ch), `${def.id}: unknown grid char "${ch}"`);
      }
    }
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/`
Expected: FAIL — cannot find module `../src/levels.js`.

- [ ] **Step 3: Create `src/levels.js`**

```js
// Pure data + parsing — must work in Node (no DOM).
import { TILE, ROWS, ENTITY_CHARS } from './constants.js';

// King James Version (public domain). Keyed by verseId.
export const VERSES = {
  ps23:   { ref: 'Psalm 23:1',        text: 'The LORD is my shepherd; I shall not want.' },
  ps119:  { ref: 'Psalm 119:105',     text: 'Thy word is a lamp unto my feet, and a light unto my path.' },
  josh1:  { ref: 'Joshua 1:9',        text: 'Be strong and of a good courage; be not afraid... for the LORD thy God is with thee whithersoever thou goest.' },
  prov3:  { ref: 'Proverbs 3:5',      text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
  phil4:  { ref: 'Philippians 4:13',  text: 'I can do all things through Christ which strengtheneth me.' },
  ps28:   { ref: 'Psalm 28:7',        text: 'The LORD is my strength and my shield; my heart trusted in him, and I am helped.' },
  sam16:  { ref: '1 Samuel 16:7',     text: 'Man looketh on the outward appearance, but the LORD looketh on the heart.' },
  matt19: { ref: 'Matthew 19:14',     text: 'Suffer little children... to come unto me: for of such is the kingdom of heaven.' },
  ps56:   { ref: 'Psalm 56:3',        text: 'What time I am afraid, I will trust in thee.' },
  sam17a: { ref: '1 Samuel 17:37',    text: 'The LORD that delivered me out of the paw of the lion, and out of the paw of the bear, he will deliver me.' },
  eph6:   { ref: 'Ephesians 6:11',    text: 'Put on the whole armour of God, that ye may be able to stand.' },
  sam17b: { ref: '1 Samuel 17:45',    text: 'Thou comest to me with a sword... but I come to thee in the name of the LORD of hosts.' },
};

// Scroll verse assignment: scrolls are assigned verses in reading order
// (left-to-right, top-to-bottom) from the level's verseIds list.
export function parseLevel(map) {
  if (map.length !== ROWS) throw new Error(`map must be ${ROWS} rows, got ${map.length}`);
  const width = map[0].length;
  for (const row of map) {
    if (row.length !== width) throw new Error('ragged map: all rows must be equal length');
  }
  const grid = [];
  const entities = [];
  let playerStart = null;
  for (let ty = 0; ty < ROWS; ty++) {
    let row = '';
    for (let tx = 0; tx < width; tx++) {
      const ch = map[ty][tx];
      const type = ENTITY_CHARS[ch];
      if (type === 'playerStart') {
        playerStart = { x: tx * TILE, y: ty * TILE };
        row += '.';
      } else if (type) {
        entities.push({ type, x: tx * TILE, y: ty * TILE });
        row += '.';
      } else {
        row += ch;
      }
    }
    grid.push(row);
  }
  return { grid, entities, playerStart, widthTiles: width, widthPx: width * TILE };
}

// Assign verseIds to scroll entities in reading order. Mutates entities.
export function assignVerses(level, verseIds) {
  const scrolls = level.entities
    .filter(e => e.type === 'scroll')
    .sort((a, b) => (a.y - b.y) || (a.x - b.x));
  scrolls.forEach((s, i) => { s.verseId = verseIds[i % verseIds.length]; });
}

// ---------------------------------------------------------------------------
// LEVELS: filled with one test map now; Tasks 13–15 replace this array
// with the 9 real levels. Each def: { id, name, world, theme, verseIds, map }.
// theme drives background colors (see sprites.js THEMES): 'fields' |
// 'wilderness' | 'valley'.
// ---------------------------------------------------------------------------
export const LEVELS = [
  {
    id: 'test-1',
    name: 'Test Meadow',
    world: 1,
    theme: 'fields',
    verseIds: ['ps23', 'ps119'],
    map: [
      '......................................',
      '......................................',
      '......................................',
      '......................................',
      '..........?..........................',
      '......................................',
      '.....................s...............',
      '..................----................',
      '....o.o.o.............................',
      '......................................',
      '.P...........w..................G.....',
      '......................................',
      '#########....#########################',
      '#########....#########################',
    ],
  },
];

// note: parseLevel(def.map) then assignVerses(level, def.verseIds) is done
// by game.js when a level loads.
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/`
Expected: all tests PASS (physics 7 + levels 4).

- [ ] **Step 5: Commit**

```bash
git add src/levels.js tests/levels.test.js
git commit -m "feat: level parser, KJV verse data, and test map"
```

---

### Task 5: Camera (TDD)

**Files:**
- Create: `tests/camera.test.js`
- Create: `src/camera.js`

- [ ] **Step 1: Write the failing tests** — create `tests/camera.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/`
Expected: FAIL — cannot find module `../src/camera.js`.

- [ ] **Step 3: Create `src/camera.js`**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/camera.js tests/camera.test.js
git commit -m "feat: clamped follow camera"
```

---

### Task 6: Sprite engine and all pixel art

**Files:**
- Create: `src/sprites.js`

This is the largest data file. Sprites are string grids: each character indexes `PALETTE`; `.` is transparent. All art is original. Rows within one sprite must be equal length. The engine pre-renders each sprite (and its horizontal mirror) to offscreen canvases at load.

**Step check while transcribing:** every sprite below has exactly the row count and row width stated in its comment. Count if unsure — a ragged sprite throws at load (by design, see `buildSprite`).

- [ ] **Step 1: Create `src/sprites.js`** — part 1 of 3: palette, engine, themes. Create the file with this content (parts 2 and 3 append to the `SPRITES` object — they go inside the same `const SPRITES = { ... }` literal as noted below):

```js
// Sprite rendering: string-grid pixel art → cached offscreen canvases.
// DOM module (uses document.createElement) — never import from tests.

export const PALETTE = {
  K: '#1a1a24', // outline black
  W: '#ffffff',
  L: '#c8d0d8', // light grey
  E: '#9098a0', // grey
  e: '#5a6068', // dark grey
  R: '#d83838', // red
  r: '#982020', // dark red
  O: '#e88028', // orange
  Y: '#f8d020', // yellow
  y: '#fff8a8', // pale yellow
  G: '#38a048', // green
  g: '#1f7030', // dark green
  C: '#58b8e8', // sky blue
  B: '#3858d8', // blue
  b: '#243898', // dark blue
  T: '#d8a868', // tan
  t: '#a87840', // dark tan
  N: '#7a4a22', // brown
  n: '#4e2d12', // dark brown
  S: '#f8c890', // skin
  s: '#d89860', // skin shadow
  P: '#9858c8', // purple
  F: '#c89030', // lion/bear gold
  f: '#8a5e1a', // dark gold
};

// Background themes per world. Drawn procedurally in game.js.
export const THEMES = {
  fields:     { sky: '#5c94fc', hillFar: '#8cc850', hillNear: '#58a838', cloud: '#ffffff' },
  wilderness: { sky: '#d8a050', hillFar: '#b07838', hillNear: '#8a5828', cloud: '#f0e0c0' },
  valley:     { sky: '#6878a8', hillFar: '#586890', hillNear: '#404e70', cloud: '#c0c8d8' },
};

const cache = new Map(); // name -> {canvas, flipped, w, h}

function buildSprite(name, rows) {
  const h = rows.length;
  const w = rows[0].length;
  for (const r of rows) {
    if (r.length !== w) throw new Error(`ragged sprite: ${name}`);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      const color = PALETTE[ch];
      if (!color) throw new Error(`sprite ${name}: unknown palette char "${ch}"`);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const flipped = document.createElement('canvas');
  flipped.width = w; flipped.height = h;
  const fctx = flipped.getContext('2d');
  fctx.translate(w, 0); fctx.scale(-1, 1);
  fctx.drawImage(canvas, 0, 0);
  return { canvas, flipped, w, h };
}

// Call once at startup (from main.js) before any drawSprite call.
export function initSprites() {
  for (const [name, rows] of Object.entries(SPRITES)) {
    cache.set(name, buildSprite(name, rows));
  }
}

// Draw sprite by name at integer pixel position. flip mirrors horizontally.
export function drawSprite(ctx, name, x, y, { flip = false, scale = 1 } = {}) {
  const s = cache.get(name);
  if (!s) throw new Error(`unknown sprite: ${name}`);
  ctx.drawImage(flip ? s.flipped : s.canvas,
    Math.round(x), Math.round(y), s.w * scale, s.h * scale);
}

export function spriteSize(name) {
  const s = cache.get(name);
  return { w: s.w, h: s.h };
}

const SPRITES = {
  // ---- TILES (16x16) ------------------------------------------------
  tile_grass: [
    'GGGGGGGGGGGGGGGG',
    'GgGGGgGGGGgGGGgG',
    'gggggggggggggggg',
    'NNtNNNNtNNNNtNNN',
    'NtNNNtNNNtNNNNtN',
    'NNNNtNNNNNtNNNNN',
    'NnNNNNtNNNNNtNnN',
    'NNNtNNNNtNNNNNNN',
    'NtNNNNNNNNtNNNtN',
    'NNNNtNNtNNNNNNNN',
    'NnNNNNNNNNtNNnNN',
    'NNNtNNNtNNNNNNNN',
    'NNNNNNNNNNNtNNNN',
    'NnNNtNNNNNNNNNnN',
    'NNNNNNNtNNNNNNNN',
    'nnnnnnnnnnnnnnnn',
  ],
  tile_stone: [
    'LLLLLLLLELLLLLLL',
    'LEEEEEEEKEEEEEEL',
    'LELLLLLEKELLLLEL',
    'LELLLLLEKELLLLEL',
    'LELLLLLEKELLLLEL',
    'LEEEEEEEKEEEEEEL',
    'KKKKKKKKKKKKKKKK',
    'LEEEKEEEEEEKEEEL',
    'LELLEKLLLLEKLLEL',
    'LELLEKLLLLEKLLEL',
    'LELLEKLLLLEKLLEL',
    'LEEEKEEEEEEKEEEL',
    'KKKKKKKKKKKKKKKK',
    'LEEEEEEEKEEEEEEL',
    'LELLLLLEKELLLLEL',
    'eeeeeeeeeeeeeeee',
  ],
  tile_brick: [
    'TTTTTTTKTTTTTTTK',
    'TttttttKtttttttK',
    'TttttttKtttttttK',
    'KKKKKKKKKKKKKKKK',
    'TTTKTTTTTTTKTTTT',
    'TttKtttttttKtttt',
    'TttKtttttttKtttt',
    'KKKKKKKKKKKKKKKK',
    'TTTTTTTKTTTTTTTK',
    'TttttttKtttttttK',
    'TttttttKtttttttK',
    'KKKKKKKKKKKKKKKK',
    'TTTKTTTTTTTKTTTT',
    'TttKtttttttKtttt',
    'TttKtttttttKtttt',
    'KKKKKKKKKKKKKKKK',
  ],
  tile_blessing: [ // '?' block: gold with white dove mark
    'YYYYYYYYYYYYYYYY',
    'YyyyyyyyyyyyyyOY',
    'YyOOyyyyyyyyOyOY',
    'YyOyyyyWyyyyyyOY',
    'YyyyyyWWWyyyyyOY',
    'YyyyWWWWWWWyyyOY',
    'YyyyyWWWWWyyyyOY',
    'YyyyyyWWWWWyyyOY',
    'YyyyyyyWWyyyyyOY',
    'YyyyyyyWWyyyyyOY',
    'YyyyyyyyyyyyyyOY',
    'YyyyyyyWWyyyyyOY',
    'YyyyyyyWWyyyyyOY',
    'YyOyyyyyyyyyOyOY',
    'YyOOOOOOOOOOOOOY',
    'OOOOOOOOOOOOOOOO',
  ],
  tile_used: [
    'EEEEEEEEEEEEEEEE',
    'ELLLLLLLLLLLLLeE',
    'ELeeLLLLLLLLeLeE',
    'ELeLLLLLLLLLLLeE',
    'ELLLLLLLLLLLLLeE',
    'ELLLLLLLLLLLLLeE',
    'ELLLLLLLLLLLLLeE',
    'ELLLLLLLLLLLLLeE',
    'ELLLLLLLLLLLLLeE',
    'ELLLLLLLLLLLLLeE',
    'ELLLLLLLLLLLLLeE',
    'ELLLLLLLLLLLLLeE',
    'ELLLLLLLLLLLLLeE',
    'ELeLLLLLLLLLeLeE',
    'ELeeeeeeeeeeeeeE',
    'eeeeeeeeeeeeeeee',
  ],
  tile_platform: [ // one-way wooden platform (only top 6 rows visible)
    'TTTTTTTTTTTTTTTT',
    'tNtNtNtNtNtNtNtN',
    'NNNNNNNNNNNNNNNN',
    'nKnnKnnnKnnKnnKn',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  tile_thorns: [
    '................',
    '....K......K....',
    '...KgK....KgK...',
    '...KgK.K..KgK...',
    '..KgGgKgK.KgGgK.',
    '..KgGgKgKKgGgK..',
    '.KgGGgKgKgGGgK..',
    '.KgGGgGgGgGGgK..',
    'KgGGGgGgGgGGGgK.',
    'KgGGGGgGgGGGGgK.',
    'KgGGGGGgGGGGGgKK',
    'KgGGGGGGGGGGGggK',
    'KggGGGGGGGGGgggK',
    'KgggggggggggggK.',
    '.KKKKKKKKKKKKK..',
    '................',
  ],
```

- [ ] **Step 2: Append part 2 of `SPRITES`** — these entries go inside the same `SPRITES = { ... }` object literal, immediately after `tile_thorns`:

```js
  // ---- PLAYER: David (16x16, drawn facing RIGHT) ---------------------
  david_idle: [
    '................',
    '.....NNNNN......',
    '....NNNNNNN.....',
    '....NSSSSSN.....',
    '....NSKSSKS.....',
    '....NSSSSSS.....',
    '.....SSSSS......',
    '.....TTTTT......',
    '....TTTBTTT.....',
    '....TTTBTTT.....',
    '....STTBTTS.....',
    '....STTTTTS.....',
    '.....TTTTT......',
    '.....ss.ss......',
    '.....nn.nn......',
    '................',
  ],
  david_run1: [
    '................',
    '.....NNNNN......',
    '....NNNNNNN.....',
    '....NSSSSSN.....',
    '....NSKSSKS.....',
    '....NSSSSSS.....',
    '.....SSSSS......',
    '.....TTTTT......',
    '....TTTBTTT.....',
    '....TTTBTTT.....',
    '....STTBTTS.....',
    '....STTTTTS.....',
    '.....TTTTT......',
    '....ss...ss.....',
    '....nn...nn.....',
    '................',
  ],
  david_run2: [
    '................',
    '.....NNNNN......',
    '....NNNNNNN.....',
    '....NSSSSSN.....',
    '....NSKSSKS.....',
    '....NSSSSSS.....',
    '.....SSSSS......',
    '.....TTTTT......',
    '....TTTBTTT.....',
    '....TTTBTTT.....',
    '....STTBTTS.....',
    '....STTTTTS.....',
    '.....TTTTT......',
    '......sss.......',
    '......nnn.......',
    '................',
  ],
  david_jump: [
    '................',
    '.....NNNNN......',
    '....NNNNNNN.....',
    '....NSSSSSN.....',
    '....NSKSSKS.....',
    '....NSSSSSS.....',
    '.....SSSSS......',
    '....STTTTTS.....',
    '...STTTBTTTS....',
    '....TTTBTTT.....',
    '....TTTBTTT.....',
    '.....TTTTT......',
    '.....TTTTT......',
    '.....ssss.......',
    '.....nn.........',
    '................',
  ],
  // ---- ITEMS ----------------------------------------------------------
  manna: [ // golden wafer (16x16)
    '................',
    '................',
    '................',
    '................',
    '.....KKKKKK.....',
    '....KyyyyyyK....',
    '...KyyWWyyyyK...',
    '...KyYYYYYyyK...',
    '...KyYYYYYYyK...',
    '...KyyYYYYyyK...',
    '....KyyyyyyK....',
    '.....KKKKKK.....',
    '................',
    '................',
    '................',
    '................',
  ],
  scroll: [ // parchment scroll (16x16)
    '................',
    '................',
    '................',
    '...KKKKKKKKKK...',
    '..KWWWWWWWWWWK..',
    '..KWnnnnnnnnWK..',
    '..KWWWWWWWWWWK..',
    '..KWnnnnnnnnWK..',
    '..KWWWWWWWWWWK..',
    '..KWnnnnnnnnWK..',
    '..KWWWWWWWWWWK..',
    '...KKKKKKKKKK...',
    '................',
    '................',
    '................',
    '................',
  ],
  bread: [ // health loaf (16x16)
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....KKKKKK.....',
    '....KTTTTTTK....',
    '...KTTtTTtTTK...',
    '...KTTTTTTTTK...',
    '...KtTTtTTtTK...',
    '....KttttttK....',
    '.....KKKKKK.....',
    '................',
    '................',
    '................',
    '................',
  ],
  sling: [ // sling power-up (16x16)
    '................',
    '................',
    '................',
    '....K......K....',
    '....NK....KN....',
    '.....NK..KN.....',
    '......NKKN......',
    '......KNNK......',
    '......KNNK......',
    '.....KNNNNK.....',
    '.....KNNNNK.....',
    '......KNNK......',
    '.......KK.......',
    '................',
    '................',
    '................',
  ],
  stone: [ // thrown sling stone (6x6)
    '.KKKK.',
    'KLLLEK',
    'KLLEEK',
    'KLEEEK',
    'KEEEeK',
    '.KKKK.',
  ],
  heart: [ // HUD heart (8x8)
    '.KK..KK.',
    'KRRKKRRK',
    'KRRRRRRK',
    'KRRRRRRK',
    '.KRRRRK.',
    '..KRRK..',
    '...KK...',
    '........',
  ],
  heart_empty: [ // HUD empty heart (8x8)
    '.KK..KK.',
    'KLLKKLLK',
    'KLLLLLLK',
    'KLLLLLLK',
    '.KLLLLK.',
    '..KLLK..',
    '...KK...',
    '........',
  ],
  // ---- LEVEL FURNITURE -------------------------------------------------
  gate: [ // goal: stone archway with golden light (16x32)
    '....KKKKKKKK....',
    '..KKLLLLLLLLKK..',
    '.KLLLEELLEELLLK.',
    'KLLEKKKKKKKKELLK',
    'KLEK........KELK',
    'KLEK...yy...KELK',
    'KLEK..yYYy..KELK',
    'KLEK..yYYy..KELK',
    'KLEK...yy...KELK',
    'KLEK........KELK',
    'KLEK...yy...KELK',
    'KLEK..yYYy..KELK',
    'KLEK..yYYy..KELK',
    'KLEK...yy...KELK',
    'KLEK........KELK',
    'KLEK...yy...KELK',
    'KLEK..yYYy..KELK',
    'KLEK..yYYy..KELK',
    'KLEK...yy...KELK',
    'KLEK........KELK',
    'KLEK...yy...KELK',
    'KLEK..yYYy..KELK',
    'KLEK..yYYy..KELK',
    'KLEK...yy...KELK',
    'KLEK........KELK',
    'KLEK........KELK',
    'KLEK........KELK',
    'KLEK........KELK',
    'KLEK........KELK',
    'KLEK........KELK',
    'KLEK........KELK',
    'eeee........eeee',
  ],
  altar_off: [ // checkpoint altar, inactive (16x16)
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '....KKKKKKKK....',
    '...KLLELLELLK...',
    '...KLELLELLLK...',
    '....KKKKKKKK....',
    '.....KLLEK......',
    '.....KLELK......',
    '....KKKKKKKK....',
    '...KLLLELLLLK...',
    '..KKKKKKKKKKKK..',
  ],
  altar_on: [ // checkpoint altar, lit (16x16)
    '................',
    '................',
    '.......Y........',
    '......YOY.......',
    '......YOY.......',
    '.....YOROY......',
    '......YRY.......',
    '....KKKKKKKK....',
    '...KLLELLELLK...',
    '...KLELLELLLK...',
    '....KKKKKKKK....',
    '.....KLLEK......',
    '.....KLELK......',
    '....KKKKKKKK....',
    '...KLLLELLLLK...',
    '..KKKKKKKKKKKK..',
  ],
  // ---- EFFECTS ---------------------------------------------------------
  puff: [ // defeat/collect star puff (16x16)
    '................',
    '.......W........',
    '.......W........',
    '...W.......W....',
    '....W..W..W.....',
    '................',
    '.W....WWW....W..',
    '......WWW.......',
    '.W....WWW....W..',
    '................',
    '....W..W..W.....',
    '...W.......W....',
    '.......W........',
    '.......W........',
    '................',
    '................',
  ],
```

- [ ] **Step 3: Append part 3 of `SPRITES` and close the object** — these entries follow `puff`, then the object closes with `};` (end of file):

```js
  // ---- ENEMIES (16x16, drawn facing RIGHT) -----------------------------
  scorpion_1: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '..KK............',
    '.KrrK...........',
    '.KrrK..........K',
    '..KrK.........K.',
    '...K..KKKKKK.K..',
    '..K.KrRRRRRrKK..',
    '..KKrRRRRRRRrK..',
    '..KrRRKRRKRRrK..',
    '...KKKKKKKKKK...',
    '...K..K..K..K...',
    '................',
  ],
  scorpion_2: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '..KK............',
    '.KrrK...........',
    '.KrrK..........K',
    '..KrK.........K.',
    '...K..KKKKKK.K..',
    '..K.KrRRRRRrKK..',
    '..KKrRRRRRRRrK..',
    '..KrRRKRRKRRrK..',
    '...KKKKKKKKKK...',
    '..K..K..K..K....',
    '................',
  ],
  serpent_1: [
    '................',
    '................',
    '................',
    '....KKK.........',
    '...KGGGK........',
    '...KGKGKK.......',
    '...KGGGGGK......',
    '....KKKGGK......',
    '......KGGK......',
    '..KKKKGGGK......',
    '.KGGGGGGGK......',
    '.KGgGgGgGGKKK...',
    '..KGGGGGGGGGgK..',
    '...KKKKKKKKKK...',
    '................',
    '................',
  ],
  serpent_2: [
    '................',
    '................',
    '................',
    '....KKK.........',
    '...KGGGK........',
    '...KGKGKK.RR....',
    '...KGGGGGK......',
    '....KKKGGK......',
    '......KGGK......',
    '..KKKKGGGK......',
    '.KGGGGGGGK......',
    '.KGgGgGgGGKKK...',
    '..KGGGGGGGGGgK..',
    '...KKKKKKKKKK...',
    '................',
    '................',
  ],
  raven_1: [
    '................',
    '................',
    '....K.....K.....',
    '...KKK...KKK....',
    '...KKKK.KKKK....',
    '....KKKKKKK.....',
    '.....KKKKKKKO...',
    '....KKKKWKKK....',
    '....KKKKKKKK....',
    '.....KKKKKK.....',
    '......KKKK......',
    '.......KK.......',
    '................',
    '................',
    '................',
    '................',
  ],
  raven_2: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....KKKKKK.....',
    '....KKKKKKKKO...',
    '...KKKKKWKKK....',
    '..KKKK.KKKK.....',
    '..KKK...KKK.....',
    '..K.......K.....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // ---- BOSSES (16x16, render-scaled: lion/bear x2, goliath x3) ---------
  lion_1: [
    '................',
    '...KKKKKKK......',
    '..KNNNNNNNK.....',
    '.KNNFFFFFNNK....',
    '.KNFFKFFKFFNK...',
    '.KNFFFFFFFFNK...',
    '.KNNFFKKFFNNK...',
    '..KNNFFFFNNK....',
    '...KKNNNNKKKKK..',
    '..KFFFFFFFFFFK..',
    '.KFFfFFFFfFFFK..',
    '.KFFFFFFFFFFFKK.',
    '.KFfFFFfFFFfFK..',
    '..KKFKKFKKFKK...',
    '..KF..KF..KF....',
    '................',
  ],
  lion_2: [
    '................',
    '...KKKKKKK......',
    '..KNNNNNNNK.....',
    '.KNNFFFFFNNK....',
    '.KNFFKFFKFFNK...',
    '.KNFFFFFFFFNK...',
    '.KNNFFKKFFNNK...',
    '..KNNFFFFNNK....',
    '...KKNNNNKKKKK..',
    '..KFFFFFFFFFFK..',
    '.KFFfFFFFfFFFK..',
    '.KFFFFFFFFFFFKK.',
    '.KFfFFFfFFFfFK..',
    '...KFKKFKKFKK...',
    '....FK..FK..F...',
    '................',
  ],
  bear_1: [
    '................',
    '................',
    '..KK......KK....',
    '.KNNK....KNNK...',
    '.KNNNKKKKNNNK...',
    '.KNNNNNNNNNNK...',
    '.KNKNNNNNKNNK...',
    '.KNNNnKKnNNNK...',
    '..KNNNnnNNNK....',
    '.KNNNNNNNNNNKK..',
    'KNNnNNNNNNnNNNK.',
    'KNNNNNNNNNNNNNK.',
    'KNnNNNNNNNNNnNK.',
    '.KKNNKKKKKNNKK..',
    '..KNK....KNK....',
    '................',
  ],
  bear_2: [
    '................',
    '................',
    '..KK......KK....',
    '.KNNK....KNNK...',
    '.KNNNKKKKNNNK...',
    '.KNNNNNNNNNNK...',
    '.KNKNNNNNKNNK...',
    '.KNNNnKKnNNNK...',
    '..KNNNnnNNNK....',
    '.KNNNNNNNNNNKK..',
    'KNNnNNNNNNnNNNK.',
    'KNNNNNNNNNNNNNK.',
    'KNnNNNNNNNNNnNK.',
    '.KKNNKKKKKNNKK..',
    '...KNK..KNK.....',
    '................',
  ],
  goliath_1: [
    '....KKKKKK......',
    '...KEEEEEEK.....',
    '...KEEEEEEKK....',
    '...KSSSSSSK.....',
    '...KSKSSKSK.....',
    '...KSSSSSSK.....',
    '....KSnnSK......',
    '...KEEEEEEK.....',
    '..KEeEEEEeEK....',
    '..KEEEEEEEEK....',
    '..KEeEEEEeEK....',
    '..KEEEEEEEEK....',
    '...KeeK.KeeK....',
    '...KeeK.KeeK....',
    '...KKKK.KKKK....',
    '................',
  ],
  goliath_2: [
    '....KKKKKK......',
    '...KEEEEEEK.....',
    '...KEEEEEEKK....',
    '...KSSSSSSK.....',
    '...KSKSSKSK.....',
    '...KSSSSSSK.....',
    '....KSnnSK......',
    '...KEEEEEEKS....',
    '..KEeEEEEeEKS...',
    '..KEEEEEEEEK....',
    '..KEeEEEEeEK....',
    '..KEEEEEEEEK....',
    '...KeeK.KeeK....',
    '...KeeK.KeeK....',
    '...KKKK.KKKK....',
    '................',
  ],
  spear: [ // Goliath's projectile (16x16, points RIGHT)
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.............K..',
    '.NNNNNNNNNNNNKK.',
    '.............K..',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};
```

- [ ] **Step 4: Sprite gallery check** — replace the entire contents of `src/main.js` with this temporary gallery (Task 7 replaces it again):

```js
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

- [ ] **Step 5: Manual check**

Run: `python -m http.server 8080`, open `http://localhost:8080`, open the browser dev console (F12).
Expected: a grid of all 35 sprites on sky blue; **zero console errors**. If you see `ragged sprite: <name>`, fix that sprite's row lengths to match its first row (you mistyped a row).

- [ ] **Step 6: Run tests** (sprites.js must not break Node tests — it is never imported by them)

Run: `node --test tests/`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/sprites.js src/main.js
git commit -m "feat: sprite engine with full original pixel art set"
```

---

### Task 7: Entities — player, enemies, stones (TDD)

**Files:**
- Create: `tests/entities.test.js`
- Create: `src/entities.js`

`entities.js` is DOM-free (imports only constants + physics) so it is unit-testable. It owns movement/AI logic; *interactions* (stomps, damage, pickups) live in `game.js`.

- [ ] **Step 1: Write the failing tests** — create `tests/entities.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/`
Expected: FAIL — cannot find module `../src/entities.js`.

- [ ] **Step 3: Create `src/entities.js`**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/`
Expected: all tests PASS (physics 7, levels 4, camera 3, entities 5).

- [ ] **Step 5: Commit**

```bash
git add src/entities.js tests/entities.test.js
git commit -m "feat: player movement, enemy AI, and sling stones"
```

---

### Task 8: Audio (WebAudio chiptune sfx)

**Files:**
- Create: `src/audio.js`

- [ ] **Step 1: Create `src/audio.js`**

```js
// WebAudio chiptune sfx — oscillators only, no asset files. DOM module.
let actx = null;
let muted = false;

function ctx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  return actx;
}

// Browsers block audio until a user gesture: resume on first keydown.
export function initAudio() {
  const resume = () => {
    ctx().resume();
    window.removeEventListener('keydown', resume);
  };
  window.addEventListener('keydown', resume);
}

export function toggleMute() { muted = !muted; return muted; }
export function isMuted() { return muted; }

// One note. when/dur in seconds; slide = optional end frequency (pitch ramp).
function tone(freq, when, dur, type = 'square', vol = 0.06, slide = 0) {
  const a = ctx();
  const t = a.currentTime + when;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.linearRampToValueAtTime(slide, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const SFX = {
  jump:       () => tone(240, 0, 0.15, 'square', 0.05, 520),
  manna:      () => { tone(988, 0, 0.07); tone(1319, 0.07, 0.12); },
  scroll:     () => { tone(523, 0, 0.09); tone(659, 0.09, 0.09); tone(784, 0.18, 0.18); },
  stomp:      () => tone(220, 0, 0.12, 'square', 0.07, 70),
  hurt:       () => tone(180, 0, 0.25, 'sawtooth', 0.06, 60),
  throwStone: () => tone(700, 0, 0.06, 'square', 0.04, 400),
  bump:       () => tone(110, 0, 0.08, 'triangle', 0.08),
  powerup:    () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.1)); },
  checkpoint: () => { tone(660, 0, 0.1); tone(880, 0.1, 0.2); },
  clear:      () => { [523, 587, 659, 784, 880, 1047].forEach((f, i) => tone(f, i * 0.1, 0.12)); },
  bossHit:    () => tone(140, 0, 0.15, 'square', 0.08, 80),
  clank:      () => tone(900, 0, 0.05, 'triangle', 0.05, 700),
  bossDown:   () => { [880, 784, 659, 587, 523, 392].forEach((f, i) => tone(f, i * 0.09, 0.12)); },
  gameOver:   () => { [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.25, 0.3, 'triangle')); },
  victory:    () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.13, 0.15)); },
};

export function sfx(name) {
  if (muted) return;
  const fn = SFX[name];
  if (fn) {
    try { fn(); } catch (_) { /* audio unavailable — never crash the game */ }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/audio.js
git commit -m "feat: WebAudio chiptune sound effects"
```

---

### Task 9: HUD and screens

**Files:**
- Create: `src/hud.js`

- [ ] **Step 1: Create `src/hud.js`**

```js
// HUD, overlays, and full-screen states. DOM module (canvas text + sprites).
import { VIEW_W, VIEW_H, MAX_HEARTS } from './constants.js';
import { drawSprite } from './sprites.js';
import { VERSES } from './levels.js';

export function drawText(ctx, text, x, y,
    { size = 8, color = '#ffffff', align = 'left', outline = true } = {}) {
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  if (outline) {
    ctx.fillStyle = '#1a1a24';
    ctx.fillText(text, x + 1, y + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// Monospace word-wrap by character count.
export function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      lines.push(line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = '#1a1a24';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = '#f4e8c8'; // parchment
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#a87840';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function drawHud(ctx, game) {
  for (let i = 0; i < MAX_HEARTS; i++) {
    drawSprite(ctx, i < game.player.hearts ? 'heart' : 'heart_empty', 6 + i * 10, 6);
  }
  drawSprite(ctx, 'manna', 2, 14, { scale: 0.75 });
  drawText(ctx, `x${game.manna}`, 16, 18);
  drawSprite(ctx, 'scroll', 40, 14, { scale: 0.75 });
  drawText(ctx, `x${game.scrolls.length}/12`, 54, 18);
  drawText(ctx, `DAVID x${game.lives}`, VIEW_W - 6, 6, { align: 'right' });
  drawText(ctx, game.levelDef.name, VIEW_W - 6, 16, { align: 'right', color: '#fff8a8' });
}

export function drawBossHealth(ctx, boss) {
  const w = 60, x = VIEW_W / 2 - w / 2, y = 8;
  ctx.fillStyle = '#1a1a24';
  ctx.fillRect(x - 1, y - 1, w + 2, 8);
  ctx.fillStyle = '#982020';
  ctx.fillRect(x, y, w, 6);
  ctx.fillStyle = '#d83838';
  ctx.fillRect(x, y, Math.max(0, w * boss.hp / boss.maxHp), 6);
  drawText(ctx, boss.name, VIEW_W / 2, y + 9, { align: 'center', size: 7 });
}

export function drawTitle(ctx, frame) {
  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#58a838';
  ctx.fillRect(0, 200, VIEW_W, 40);
  drawSprite(ctx, 'david_idle', 144, 152, { scale: 3 });
  drawText(ctx, "DAVID'S QUEST", VIEW_W / 2, 40, { size: 24, color: '#f8d020', align: 'center' });
  drawText(ctx, 'A Bible Adventure', VIEW_W / 2, 70, { size: 10, align: 'center' });
  if (frame % 60 < 40) {
    drawText(ctx, 'Press ENTER to begin', VIEW_W / 2, 110, { size: 9, align: 'center', color: '#fff8a8' });
  }
  drawText(ctx, 'Arrows/AD move · Z/Space jump · X/K sling', VIEW_W / 2, 130, { size: 7, align: 'center', color: '#c8d0d8' });
}

export function drawIntro(ctx, levelDef, lives) {
  ctx.fillStyle = '#1a1a24';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawText(ctx, `WORLD ${levelDef.world}`, VIEW_W / 2, 80, { size: 10, align: 'center', color: '#c8d0d8' });
  drawText(ctx, levelDef.name, VIEW_W / 2, 96, { size: 12, align: 'center', color: '#f8d020' });
  drawSprite(ctx, 'david_idle', 140, 120);
  drawText(ctx, `x ${lives}`, 162, 124, { size: 10 });
}

export function drawVerseOverlay(ctx, verseId, frame) {
  const verse = VERSES[verseId];
  dim(ctx);
  panel(ctx, 20, 50, 280, 130);
  drawSprite(ctx, 'scroll', 152, 56);
  const lines = wrapText(verse.text, 40);
  lines.forEach((line, i) => {
    drawText(ctx, line, VIEW_W / 2, 80 + i * 12,
      { size: 8, align: 'center', color: '#4e2d12', outline: false });
  });
  drawText(ctx, '— ' + verse.ref, VIEW_W / 2, 80 + lines.length * 12 + 6,
    { size: 8, align: 'center', color: '#982020', outline: false });
  if (frame % 60 < 40) {
    drawText(ctx, 'Press ENTER', VIEW_W / 2, 164, { size: 8, align: 'center', color: '#4e2d12', outline: false });
  }
}

export function drawPause(ctx) {
  dim(ctx);
  drawText(ctx, 'PAUSED', VIEW_W / 2, 100, { size: 16, align: 'center', color: '#f8d020' });
  drawText(ctx, 'P resume · M mute', VIEW_W / 2, 124, { size: 8, align: 'center' });
}

export function drawGameOver(ctx, frame) {
  ctx.fillStyle = '#1a1a24';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawText(ctx, 'GAME OVER', VIEW_W / 2, 70, { size: 18, align: 'center', color: '#d83838' });
  const lines = wrapText(VERSES.josh1.text, 42);
  lines.forEach((line, i) => {
    drawText(ctx, line, VIEW_W / 2, 104 + i * 11, { size: 8, align: 'center', color: '#c8d0d8' });
  });
  if (frame % 60 < 40) {
    drawText(ctx, 'Press ENTER to try again', VIEW_W / 2, 160, { size: 9, align: 'center', color: '#fff8a8' });
  }
}

export function drawVictory(ctx, game, frame) {
  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawSprite(ctx, 'gate', 152, 120);
  drawText(ctx, 'VICTORY!', VIEW_W / 2, 30, { size: 20, align: 'center', color: '#f8d020' });
  const lines = wrapText(VERSES.sam17b.text, 42);
  lines.forEach((line, i) => {
    drawText(ctx, line, VIEW_W / 2, 60 + i * 11, { size: 8, align: 'center' });
  });
  drawText(ctx, `Manna: ${game.manna}   Scrolls: ${game.scrolls.length}/12`,
    VIEW_W / 2, 100, { size: 8, align: 'center', color: '#fff8a8' });
  if (frame % 60 < 40) {
    drawText(ctx, 'Press ENTER for title', VIEW_W / 2, 200, { size: 8, align: 'center' });
  }
}
```

- [ ] **Step 2: Run tests** (hud.js is DOM-only, never imported by tests)

Run: `node --test tests/`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/hud.js
git commit -m "feat: HUD, verse overlay, and game screens"
```

---

### Task 10: Bosses — Lion, Bear, Goliath (TDD for the contract)

**Files:**
- Create: `tests/boss.test.js`
- Create: `src/boss.js`

DOM-free. `game.js` (Task 11) draws bosses, applies projectile/contact damage, and plays the sounds bosses emit through the `out` parameter (`{ projectiles: [], sounds: [], shockwave: false }`).

- [ ] **Step 1: Write the failing tests** — create `tests/boss.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/`
Expected: FAIL — cannot find module `../src/boss.js`.

- [ ] **Step 3: Create `src/boss.js`**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/`
Expected: all tests PASS (physics 7, levels 4, camera 3, entities 5, boss 5).

- [ ] **Step 5: Commit**

```bash
git add src/boss.js tests/boss.test.js
git commit -m "feat: lion, bear, and goliath boss AI with projectiles"
```

---

### Task 11: Game state machine and main loop

**Files:**
- Create: `src/game.js`
- Replace: `src/main.js` (final version — never edited again)

- [ ] **Step 1: Create `src/game.js`**

```js
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
```

- [ ] **Step 2: Replace the entire contents of `src/main.js`** (final version):

```js
import { initInput } from './input.js';
import { initSprites } from './sprites.js';
import { initAudio } from './audio.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

initSprites();
initInput();
initAudio();

const game = new Game(ctx);
const STEP = 1000 / 60;
let last = performance.now();
let acc = 0;

function loop(now) {
  acc += Math.min(now - last, 100); // clamp so a hidden tab doesn't fast-forward
  last = now;
  while (acc >= STEP) {
    game.tick();
    acc -= STEP;
  }
  game.draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

- [ ] **Step 3: Run tests**

Run: `node --test tests/`
Expected: PASS (game.js/main.js are not imported by tests).

- [ ] **Step 4: Manual playthrough of the test level**

Run: `python -m http.server 8080`, open `http://localhost:8080`. Verify ALL of the following on the "Test Meadow" level (dev console open — **zero errors allowed**):

1. Title screen shows; ENTER starts; intro card shows "WORLD 1 / Test Meadow".
2. David runs (←→/AD), jumps (Z/Space), higher when held; camera follows and stops at level edges.
3. Walking off the pit (the gap in the floor) loses a life; after a short freeze David respawns at the level start; HUD lives decrease.
4. Collecting a manna wafer plays a chime and increments the counter.
5. Bumping the `?` block from below turns it grey and awards manna.
6. The scorpion paces, turns at the pit edge; stomping it makes a star puff; touching it sideways costs a heart and David blinks/knocks back.
7. Collecting the scroll pauses the game with a parchment verse overlay; ENTER dismisses.
8. Touching the golden gate plays a jingle, shows "LEVEL CLEAR!", then (since it is the only level) the VICTORY screen; ENTER returns to title.
9. P pauses, M mutes, sounds play otherwise.

- [ ] **Step 5: Commit**

```bash
git add src/game.js src/main.js
git commit -m "feat: complete game loop, state machine, and rendering"
```

---

### Task 12: The nine real levels

**Files:**
- Modify: `src/levels.js` — replace the entire `export const LEVELS = [ ... ];` array (delete the `test-1` entry) with the nine level definitions below.

**CRITICAL: copy-paste these maps — do not retype them.** Every platform-level row is exactly 80 characters; boss arenas are 22 or 24. `node --test tests/` validates row lengths, player starts, goals, and verse counts after you paste. The maps were designed against the physics constants: max jump height ≈ 4.5 tiles, max gap ≈ 5 tiles; all gaps here are ≤ 4 tiles and all climbs ≤ 3 tiles.

- [ ] **Step 1: Replace the entire `export const LEVELS = [ ... ];` block in `src/levels.js`** with exactly this (the trailing comment in the file stays):

```js
export const LEVELS = [
  {
    id: 'w1-1',
    name: "Shepherd's Fields",
    world: 1,
    theme: 'fields',
    verseIds: ['ps23', 'ps119'],
    map: [
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '...............................s................................................',
      '............?.M...............----..?...........................................',
      '.................................................................s..............',
      '..P.............................................................===.............',
      '........ooo.......w.....................C...............w.......===.........G...',
      '######################...#######################...#############################',
      '######################...#######################...#############################',
    ],
  },
  {
    id: 'w1-2',
    name: 'Hills of Bethlehem',
    world: 1,
    theme: 'fields',
    verseIds: ['josh1', 'prov3'],
    map: [
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '............................................................f...................',
      '..............................f.................................................',
      '.........................o.o....................................................',
      '..........S.............BB?BB..........................s............s...........',
      '......................................................----..........==..........',
      '..P.................................................................==..........',
      '....................oo......................j...C..........w........==.......G..',
      '##################################....########################...###############',
      '##################################....########################...###############',
    ],
  },
  {
    id: 'w1-boss',
    name: "The Lion's Den",
    world: 1,
    theme: 'fields',
    verseIds: ['sam17a'],
    map: [
      '......................',
      '......................',
      '......................',
      '......................',
      '......................',
      '......................',
      '......................',
      '..........oo..........',
      '...M.....----.........',
      '......................',
      '...P..................',
      '................1.....',
      '######################',
      '######################',
    ],
  },
  {
    id: 'w2-1',
    name: 'Jordan Riverbanks',
    world: 2,
    theme: 'wilderness',
    verseIds: ['phil4', 'ps28'],
    map: [
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '..................................f.............................................',
      '................................................................................',
      '..................BB?BM..........s..............................S...............',
      '................................----.......................s....................',
      '..P.......................................................===...................',
      '..............^^..........................C...j.....^^....===.......w........G..',
      '##########################....########################################...#######',
      '##########################....########################################...#######',
    ],
  },
  {
    id: 'w2-2',
    name: 'Wilderness Caves',
    world: 2,
    theme: 'wilderness',
    verseIds: ['sam16', 'matt19'],
    map: [
      '================================================================================',
      '================================================================================',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '.....................?....................................f.....................',
      '.............................................s..................................',
      '............................................---................M................',
      '....................===.........................................................',
      '............===.....===.................---...........................s.........',
      '..P.........===.....===.......................................===....---........',
      '............===.....===.........j...j.............C...^^......===............G..',
      '##########################...############################################..#####',
      '##########################...############################################..#####',
    ],
  },
  {
    id: 'w2-boss',
    name: "The Bear's Hollow",
    world: 2,
    theme: 'wilderness',
    verseIds: ['sam17a'],
    map: [
      '======================',
      '======================',
      '......................',
      '......................',
      '......................',
      '......................',
      '......o........o......',
      '......................',
      '.....----.M..----.....',
      '......................',
      '...P..................',
      '................2.....',
      '######################',
      '######################',
    ],
  },
  {
    id: 'w3-1',
    name: 'Valley of Elah',
    world: 3,
    theme: 'valley',
    verseIds: ['ps56', 'sam17a'],
    map: [
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '....................f...........................................................',
      '................................................................................',
      '........S.....................B?B?B...............s..............s..............',
      '..................----..........................----............===.............',
      '..P.............................................................===.............',
      '..........................^^..........j.....C...........w...w...===...^^.....G..',
      '############....################################....############################',
      '############....################################....############################',
    ],
  },
  {
    id: 'w3-2',
    name: 'The Philistine Camp',
    world: 3,
    theme: 'valley',
    verseIds: ['eph6', 'sam17b'],
    map: [
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '................................................................................',
      '...........................................................s..........f.........',
      '............................f.............................---...................',
      '................................................................................',
      '..............B?BMB...................................==................s.......',
      '......................----............................==...............---......',
      '..P...............................................==..==........................',
      '..........j.....................^^^...w..w....C...==..==............j........G..',
      '######################....####################################...###############',
      '######################....####################################...###############',
    ],
  },
  {
    id: 'w3-boss',
    name: 'Facing Goliath',
    world: 3,
    theme: 'valley',
    verseIds: ['sam17b'],
    map: [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '....M...................',
      '........................',
      '.....S..................',
      '.......---..---.........',
      '...P....................',
      '..................3.....',
      '########################',
      '########################',
    ],
  },
];
```

- [ ] **Step 2: Run tests to verify all 9 levels parse**

Run: `node --test tests/`
Expected: PASS. The "all shipped levels parse" test now covers 9 levels. If a row-length error appears, you mistyped a map — re-paste it.

- [ ] **Step 3: Manual playthrough — full game**

Run: `python -m http.server 8080`, open `http://localhost:8080`, console open (zero errors allowed). Play start to finish and verify:

1. **w1-1:** both scrolls collectible; `?` gives manna; `M` block spawns bread on top; two 3-tile pits crossable; both scorpions stompable; gate ends level.
2. **w1-2:** `S` block above the start spawns the **sling** — collect it, X/K then throws stones that defeat enemies; raven sine-flies; serpent hops toward you; 4-tile pit crossable; the 3-high stone tower right of the second pit is climbable to the scroll.
3. **w1-boss:** boss health bar reads "THE LION"; lion paces, freezes, then lunges; stomping it 3× (use the platform) defeats it; "BOSS DEFEATED!" then World 2 intro.
4. **w2-1:** thorns hurt but don't kill; checkpoint altar lights; dying afterwards respawns at the altar with the sling still owned.
5. **w2-2:** cave has a stone ceiling; the climb (two shelves) reaches the `?` block; both scrolls reachable; serpent pair fights work.
6. **w2-boss:** bear walks, throws arcing rocks, charges every 3rd attack; 5 hits (stomps and/or stones) defeat it.
7. **w3-1 / w3-2:** harder mixes are passable without damage boosts; all 4 scrolls collectible; total scroll counter can reach 12.
8. **w3-boss:** Goliath marches and throws spears at your height; every 3rd action he leaps — **jump when he lands** or the shockwave hurts you; stones to his **head** (throw from the platforms) flash him, 6 head-hits defeat him; body hits "clank" harmlessly; stomping clanks. The `S` block in the arena provides a sling if you somehow missed all earlier ones. Victory screen shows 1 Samuel 17:45 and your totals; ENTER returns to title.
9. **Game over path:** lose all lives — encouraging Joshua 1:9 screen, ENTER restarts cleanly at the title with reset counters.

- [ ] **Step 4: Commit**

```bash
git add src/levels.js
git commit -m "content: nine levels across three worlds with boss arenas"
```

---

### Task 13: Final QA gate, README, and ship-readiness

**Files:**
- Modify: `README.md` (replace entirely)

- [ ] **Step 1: Replace `README.md` with the final version**

```markdown
# David's Quest — A Bible Adventure

A free, kid-friendly (ages 7–14) 2D pixel platformer telling the story of
David the shepherd (1 Samuel 16–17). Run, jump, collect manna and scripture
scrolls (KJV), and face the lion, the bear, and Goliath across three worlds
and nine levels.

## Controls
| Action | Keys |
|---|---|
| Move | ← → or A D |
| Jump (hold = higher) | Z, Space, ↑, or W |
| Sling stone (after power-up) | X or K |
| Pause | P |
| Mute | M |
| Confirm | Enter |

## Run locally
    python -m http.server 8080
    # then open http://localhost:8080
(Any static server works; ES modules do not load from file://.)

## Tests
    node --test tests/

## Deploy
Static site, no build step. On Cloudflare Pages: connect the repo,
leave the build command empty, set output directory to `/`.

## Tech
Vanilla JavaScript (ES modules) + Canvas 2D. All art is original
programmatic pixel data; all audio is WebAudio oscillators. Zero
dependencies, zero asset files. Scripture quotations: King James Version
(public domain).
```

- [ ] **Step 2: Full test suite**

Run: `node --test tests/`
Expected: all 24 tests pass (physics 7, levels 4, camera 3, entities 5, boss 5).

- [ ] **Step 3: Definition-of-Done checklist** — verify every line; any failure means a transcription error in the named task:

- [ ] Console shows **zero errors/warnings** across a full playthrough (Tasks 6, 11, 12).
- [ ] All 9 levels completable start → finish without dev tools (Task 12).
- [ ] All 3 bosses defeatable; Goliath only via head-shots with the sling (Tasks 10–12).
- [ ] All 12 scrolls collectible; each shows a different KJV verse overlay (Tasks 4, 12).
- [ ] 50 manna grants an extra life (Task 11, `checkMannaLife`).
- [ ] Checkpoint respawn keeps sling/manna/scrolls; new level clears checkpoint (Task 11).
- [ ] Game over → ENTER → title → new run starts with fresh counters (Task 11).
- [ ] Pause freezes everything; mute silences everything; both toggle back (Tasks 8, 11).
- [ ] Window resize keeps the canvas crisp and 4:3 (Task 1 CSS).
- [ ] Page works after a hard refresh with cache disabled (no hidden state).

- [ ] **Step 4: Final commit**

```bash
git add README.md
git commit -m "docs: final README with controls, run, and deploy notes"
```

The repository is now ready to hand to Daniel for deployment (Cloudflare Pages, no build command, output `/`). Do not push or deploy yourself — that is a separate, human-approved step.

---

## Self-check summary for the executor

After Task 13 the repo must contain exactly: `index.html`, `styles.css`, `README.md`, `.gitignore`, 12 files in `src/`, 5 files in `tests/`, and this plan under `docs/`. `node --test tests/` green. A child can play the whole game with arrow keys + Space + X.

*End of plan.*









