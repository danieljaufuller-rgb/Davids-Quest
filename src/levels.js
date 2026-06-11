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
      '..........?...........................',
      '......................................',
      '.....................s................',
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
