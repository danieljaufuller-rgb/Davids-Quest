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
