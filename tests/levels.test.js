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
