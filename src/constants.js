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
