// The Golden Mile, drawn in code. A static strip is pre-rendered once; lights, sea,
// donkeys and the tram are animated on top each frame.
import { drawText } from './font.js';
import { shade } from './sprites.js';

export const VIEW_W = 400;
export const VIEW_H = 225;
export const LEVEL_W = 4000;
export const Y_MIN = 150;
export const Y_MAX = 214;
export const PAVE_Y = 140;

export const SEGMENTS = [
  { x0: 0, x1: 760, type: 'prom', welcome: true },
  { x0: 760, x1: 1040, type: 'arcade', sign: 'AMUSEMENTS', sub: '2P PUSHERS', wall: '#6a2c91' },
  { x0: 1040, x1: 1290, type: 'rock' },
  { x0: 1290, x1: 1430, type: 'arcade', sign: 'PENNY FALLS', sub: 'WIN WIN WIN', wall: '#1f5f8b' },
  { x0: 1430, x1: 1720, type: 'chippy' },
  { x0: 1720, x1: 2000, type: 'bingo' },
  { x0: 2000, x1: 2800, type: 'prom', tramStop: true },
  { x0: 2800, x1: 3100, type: 'pub' },
  { x0: 3100, x1: 3380, type: 'tower' },
  { x0: 3380, x1: 3600, type: 'arcade', sign: 'SLOTS', sub: 'OPEN TIL LATE', wall: '#9c2c4d' },
  { x0: 3600, x1: 4000, type: 'club' },
];

export const CHIPPY_DOOR_X = 1600;
export const CLUB_DOOR_X = 3810;
export const BENCH_X = 2330;
export const DONKEYS = [{ x: 260 }, { x: 330 }, { x: 560 }, { x: 2140 }, { x: 2480 }, { x: 2620 }];

const BULB_COLS = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#f783ac', '#ffffff'];

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// ------------------------------------------------------------------ prerender pieces
function makeSky() {
  const c = canvas(VIEW_W, VIEW_H);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 140);
  grad.addColorStop(0, '#0b0620');
  grad.addColorStop(0.6, '#2a1a5e');
  grad.addColorStop(1, '#6b2f7a');
  g.fillStyle = grad;
  g.fillRect(0, 0, VIEW_W, VIEW_H);
  const R = rng(7);
  g.fillStyle = '#fff';
  for (let i = 0; i < 90; i++) g.fillRect(Math.floor(R() * VIEW_W), Math.floor(R() * 90), 1, 1);
  // moon
  g.fillStyle = '#fff4c4';
  g.fillRect(345, 14, 14, 14);
  g.fillRect(343, 16, 18, 10);
  g.fillRect(347, 12, 10, 18);
  g.fillStyle = '#e8dca8';
  g.fillRect(349, 17, 3, 3);
  g.fillRect(354, 23, 2, 2);
  return c;
}

function makeTower() {
  const W = 64, H = 150;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const cx = W / 2;
  const edge = '#d9452f', lat = '#8e2a20';
  // spire + flag
  g.fillStyle = '#ffd43b';
  g.fillRect(cx - 1, 0, 2, 14);
  g.fillStyle = '#e03131';
  g.fillRect(cx + 1, 1, 6, 4);
  g.fillStyle = '#ffd43b';
  g.fillRect(cx - 4, 12, 8, 4);
  // lantern top
  g.fillStyle = edge;
  g.fillRect(cx - 5, 16, 10, 8);
  g.fillStyle = '#ffe066';
  g.fillRect(cx - 3, 18, 6, 3);
  // lattice body
  const top = 24, bottom = 128;
  for (let y = top; y < bottom; y++) {
    const k = (y - top) / (bottom - top);
    const hw = Math.round(5 + 17 * Math.pow(k, 1.7));
    for (let x = -hw; x <= hw; x++) {
      const edgePx = x === -hw || x === hw || x === -hw + 1 || x === hw - 1;
      const cross = ((x + y) % 5 === 0) || (((x - y) % 5) + 5) % 5 === 0;
      if (edgePx) {
        g.fillStyle = edge;
        g.fillRect(cx + x, y, 1, 1);
      } else if (cross) {
        g.fillStyle = lat;
        g.fillRect(cx + x, y, 1, 1);
      }
    }
  }
  // observation deck
  g.fillStyle = '#f1e3c6';
  g.fillRect(cx - 9, 38, 18, 5);
  g.fillStyle = '#ffd43b';
  for (let x = -8; x < 9; x += 3) g.fillRect(cx + x, 40, 1, 1);
  // base building
  g.fillStyle = '#a8432c';
  g.fillRect(cx - 30, bottom, 60, H - bottom);
  g.fillStyle = '#f1e3c6';
  g.fillRect(cx - 30, bottom, 60, 2);
  drawText(g, 'TOWER', cx, bottom + 5, { color: '#ffd43b', align: 'center', outline: '#5a1a10' });
  g.fillStyle = '#ffe066';
  for (let x = -26; x < 27; x += 8) g.fillRect(cx + x, bottom + 14, 3, 4);
  return c;
}

function makeWheel() {
  const c = canvas(70, 100);
  const g = c.getContext('2d');
  const cx = 35, cy = 32, R = 28;
  g.fillStyle = '#495057';
  for (let a = 0; a < Math.PI * 2; a += 0.04) g.fillRect(Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), 1, 1);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    for (let d = 0; d < R; d += 1) g.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), 1, 1);
  }
  g.fillStyle = '#6c757d';
  g.fillRect(cx - 1, cy, 2, 45);
  g.fillRect(cx - 14, cy + 20, 2, 25);
  g.fillRect(cx + 12, cy + 20, 2, 25);
  // pier deck + legs
  g.fillStyle = '#3b3345';
  g.fillRect(0, 76, 70, 4);
  for (let x = 2; x < 70; x += 7) g.fillRect(x, 80, 2, 20);
  return c;
}

function sign(g, x, y, w, h, text, { bg = '#c92a2a', fg = '#ffd43b', scale = 2, border = '#ffd43b', outline = '#000' } = {}) {
  g.fillStyle = border;
  g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle = bg;
  g.fillRect(x, y, w, h);
  drawText(g, text, x + w / 2, y + Math.round((h - 5 * scale) / 2), { color: fg, scale, align: 'center', outline });
}

function building(g, R, x0, x1, top, wall, windows = true) {
  const w = x1 - x0;
  g.fillStyle = wall;
  g.fillRect(x0, top, w, PAVE_Y - top);
  g.fillStyle = shade(wall, -0.35);
  g.fillRect(x0, top, w, 3);
  g.fillRect(x0, top, 3, PAVE_Y - top);
  g.fillRect(x1 - 3, top, 3, PAVE_Y - top);
  g.fillStyle = shade(wall, 0.2);
  g.fillRect(x0, top + 3, w, 1);
  if (windows) {
    for (let x = x0 + 10; x < x1 - 16; x += 24) {
      g.fillStyle = shade(wall, -0.5);
      g.fillRect(x - 1, top + 7, 14, 19);
      g.fillStyle = R() < 0.55 ? '#ffe39a' : '#1d1b33';
      g.fillRect(x, top + 8, 12, 17);
      g.fillStyle = shade(wall, -0.5);
      g.fillRect(x + 5, top + 8, 2, 17);
      g.fillRect(x, top + 15, 12, 1);
    }
  }
}

function border(bulbs, x, y, w, h, step = 4, set = 0) {
  let i = 0;
  for (let xx = x; xx <= x + w; xx += step) {
    bulbs.push({ x: xx, y, i: i++, set });
    bulbs.push({ x: xx, y: y + h, i: i++, set });
  }
  for (let yy = y + step; yy < y + h; yy += step) {
    bulbs.push({ x, y: yy, i: i++, set });
    bulbs.push({ x: x + w, y: yy, i: i++, set });
  }
}

function drawSeg(g, R, s, bulbs) {
  const { x0, x1 } = s;
  const w = x1 - x0;
  switch (s.type) {
    case 'prom': {
      // sea, sand, sea wall + railings, tram tracks
      g.fillStyle = '#16305e';
      g.fillRect(x0, 96, w, 16);
      g.fillStyle = '#1e3f75';
      g.fillRect(x0, 104, w, 8);
      g.fillStyle = '#8c7650';
      g.fillRect(x0, 112, w, 16);
      g.fillStyle = '#7a6645';
      for (let i = 0; i < w / 6; i++) g.fillRect(x0 + Math.floor(R() * w), 113 + Math.floor(R() * 14), 2, 1);
      g.fillStyle = '#5b5670';
      g.fillRect(x0, 126, w, 10);
      g.fillStyle = '#6f6a86';
      g.fillRect(x0, 126, w, 1);
      // railings (prom teal)
      g.fillStyle = '#2f9e8f';
      g.fillRect(x0, 117, w, 2);
      g.fillRect(x0, 122, w, 1);
      for (let x = x0; x < x1; x += 8) g.fillRect(x, 117, 1, 9);
      // tram tracks
      g.fillStyle = '#2b2838';
      g.fillRect(x0, 136, w, 4);
      g.fillStyle = '#9a96ab';
      g.fillRect(x0, 137, w, 1);
      g.fillRect(x0, 139, w, 1);
      if (s.welcome) {
        const sx = x0 + 70;
        g.fillStyle = '#2f9e8f';
        g.fillRect(sx, 62, 3, 56);
        g.fillRect(sx + 147, 62, 3, 56);
        sign(g, sx - 6, 50, 162, 30, '', { bg: '#1c3d8f', border: '#ffd43b' });
        drawText(g, 'WELCOME TO', sx + 75, 54, { color: '#fff', align: 'center' });
        drawText(g, 'BLACKPOOL', sx + 75, 62, { color: '#ffd43b', align: 'center', scale: 3, outline: '#7a1010' });
        border(bulbs, sx - 8, 48, 166, 34, 5, 0);
      }
      if (s.tramStop) {
        const sx = x0 + 150;
        g.fillStyle = '#adb5bd';
        g.fillRect(sx, 96, 2, 44);
        sign(g, sx - 18, 88, 38, 10, 'TRAM STOP', { bg: '#7048e8', fg: '#fff', scale: 1, border: '#fff' });
        drawText(g, 'NO DONKEYS ON THE PROM', x0 + 470, 104, { color: '#ffd43b', align: 'center' });
      }
      break;
    }
    case 'arcade': {
      building(g, R, x0, x1, 46, s.wall);
      g.fillStyle = '#12091f';
      g.fillRect(x0 + 8, 100, w - 16, 40);
      // machines inside
      for (let x = x0 + 14; x < x1 - 22; x += 16) {
        const col = BULB_COLS[Math.floor(R() * 5)];
        g.fillStyle = shade(col, -0.4);
        g.fillRect(x, 112, 11, 28);
        g.fillStyle = col;
        g.fillRect(x + 2, 115, 7, 6);
        g.fillStyle = '#ffd43b';
        g.fillRect(x + 3, 126, 5, 3);
      }
      const sw = Math.min(w - 20, 200);
      const sx = x0 + (w - sw) / 2;
      sign(g, sx, 78, sw, 18, s.sign, { bg: '#c92a2a', fg: '#ffd43b' });
      border(bulbs, sx - 3, 75, sw + 6, 24, 4, 1);
      drawText(g, s.sub, x0 + w / 2, 102, { color: '#69db7c', align: 'center' });
      break;
    }
    case 'rock': {
      building(g, R, x0, x1, 52, '#e64980');
      // candy stripes on the upper wall
      g.fillStyle = '#f8f0f3';
      for (let x = x0 + 4; x < x1 - 4; x += 10) g.fillRect(x, 55, 3, 3);
      sign(g, x0 + 12, 80, w - 24, 18, 'BLACKPOOL ROCK', { bg: '#fff0f6', fg: '#d6336c', outline: '#fff' });
      g.fillStyle = '#2b1a2a';
      g.fillRect(x0 + 10, 104, 150, 36);
      // sticks of rock in the window
      for (let x = x0 + 16; x < x0 + 154; x += 7) {
        const hgt = 16 + Math.floor(R() * 12);
        g.fillStyle = '#f783ac';
        g.fillRect(x, 140 - hgt, 4, hgt);
        g.fillStyle = '#fff';
        for (let y = 140 - hgt + 2; y < 140; y += 4) g.fillRect(x, y, 4, 1);
        g.fillStyle = '#fff';
        g.fillRect(x, 140 - hgt, 4, 2);
      }
      drawText(g, 'KISS ME QUICK', x0 + 205, 106, { color: '#ffd43b', align: 'center' });
      drawText(g, 'HATS £2', x0 + 205, 114, { color: '#fff', align: 'center' });
      g.fillStyle = '#5c1a33';
      g.fillRect(x0 + 186, 120, 18, 20);
      g.fillStyle = '#ffe39a';
      g.fillRect(x0 + 188, 122, 14, 8);
      break;
    }
    case 'chippy': {
      building(g, R, x0, x1, 48, '#e9ecef');
      // blue and white tiles
      g.fillStyle = '#1971c2';
      for (let x = x0 + 3; x < x1 - 3; x += 8) for (let y = 100; y < 140; y += 8) if (((x - x0) / 8 + (y - 100) / 8) % 2 < 1) g.fillRect(x, y, 8, 8);
      sign(g, x0 + 20, 72, w - 40, 24, 'CHIPS', { bg: '#c92a2a', fg: '#ffd43b', scale: 3 });
      border(bulbs, x0 + 17, 69, w - 34, 30, 5, 2);
      drawText(g, 'OH MY COD! - FISH & CHIPS', x0 + w / 2, 62, { color: '#1971c2', align: 'center', outline: '#fff' });
      // window with counter + menu
      g.fillStyle = '#ffe8a3';
      g.fillRect(x0 + 16, 104, 120, 30);
      g.fillStyle = '#adb5bd';
      g.fillRect(x0 + 16, 122, 120, 12);
      g.fillStyle = '#868e96';
      g.fillRect(x0 + 30, 114, 30, 8);
      g.fillStyle = '#212529';
      g.fillRect(x0 + 80, 106, 48, 15);
      drawText(g, 'CHIPS £3', x0 + 104, 107, { color: '#fff', align: 'center', outline: null });
      drawText(g, 'SCRAPS FREE', x0 + 104, 114, { color: '#ffd43b', align: 'center', outline: null });
      // door
      const dx = CHIPPY_DOOR_X - 8;
      g.fillStyle = '#343a40';
      g.fillRect(dx - 1, 105, 18, 35);
      g.fillStyle = '#1864ab';
      g.fillRect(dx, 106, 16, 34);
      g.fillStyle = '#ffe8a3';
      g.fillRect(dx + 3, 109, 10, 12);
      g.fillStyle = '#ffd43b';
      g.fillRect(dx + 12, 124, 2, 2);
      drawText(g, 'OPEN', dx + 8, 99, { color: '#69db7c', align: 'center' });
      g.fillStyle = '#ffe8a3';
      g.fillRect(x0 + 190, 104, 80, 30);
      g.fillStyle = '#adb5bd';
      g.fillRect(x0 + 190, 122, 80, 12);
      break;
    }
    case 'bingo': {
      building(g, R, x0, x1, 40, '#2b8a3e');
      sign(g, x0 + 60, 70, 160, 26, 'BINGO', { bg: '#1b1b1b', fg: '#fff', scale: 3, border: '#ffd43b' });
      border(bulbs, x0 + 57, 67, 166, 32, 5, 3);
      drawText(g, 'EYES DOWN 8PM', x0 + w / 2, 102, { color: '#ffd43b', align: 'center' });
      const balls = ['#e03131', '#1971c2', '#fab005', '#2f9e44', '#ae3ec9'];
      for (let i = 0; i < 5; i++) {
        const bx = x0 + 40 + i * 50;
        g.fillStyle = balls[i];
        g.fillRect(bx, 112, 12, 12);
        g.fillRect(bx + 1, 111, 10, 14);
        g.fillStyle = '#fff';
        g.fillRect(bx + 3, 115, 6, 6);
        drawText(g, String([7, 11, 22, 69, 88][i]), bx + 6, 116, { color: '#000', align: 'center', outline: null });
      }
      g.fillStyle = '#1e5a2a';
      g.fillRect(x0 + 125, 126, 30, 14);
      break;
    }
    case 'pub': {
      building(g, R, x0, x1, 54, '#5c3d2e');
      g.fillStyle = '#3b2519';
      g.fillRect(x0, 96, w, 4);
      sign(g, x0 + 40, 76, 220, 18, 'THE SALTY GULL', { bg: '#1b3a2b', fg: '#ffe8a3', border: '#c9a227' });
      for (let x = x0 + 16; x < x1 - 40; x += 70) {
        g.fillStyle = '#2b1a10';
        g.fillRect(x - 1, 103, 44, 30);
        g.fillStyle = '#ffc861';
        g.fillRect(x, 104, 42, 28);
        g.fillStyle = '#2b1a10';
        g.fillRect(x + 20, 104, 2, 28);
        g.fillRect(x, 117, 42, 1);
      }
      drawText(g, 'KARAOKE TONITE', x0 + w / 2, 104, { color: '#e64980', align: 'center' });
      g.fillStyle = '#2b1a10';
      g.fillRect(x1 - 36, 108, 18, 32);
      break;
    }
    case 'tower': {
      building(g, R, x0, x1, 36, '#a8432c', false);
      g.fillStyle = '#f1e3c6';
      g.fillRect(x0, 60, w, 3);
      g.fillRect(x0, 36, w, 3);
      for (let x = x0 + 12; x < x1 - 12; x += 26) {
        g.fillStyle = '#f1e3c6';
        g.fillRect(x - 1, 41, 14, 16);
        g.fillStyle = '#ffe39a';
        g.fillRect(x, 43, 12, 14);
        g.fillRect(x + 2, 42, 8, 1);
      }
      sign(g, x0 + 20, 68, w - 40, 18, 'BLACKPOOL TOWER', { bg: '#7a1d10', fg: '#ffd43b', border: '#f1e3c6' });
      drawText(g, 'BALLROOM - CIRCUS - VIEWS', x0 + w / 2, 92, { color: '#f1e3c6', align: 'center' });
      // arched doorways
      for (let x = x0 + 30; x < x1 - 40; x += 80) {
        g.fillStyle = '#f1e3c6';
        g.fillRect(x - 2, 104, 36, 36);
        g.fillStyle = '#3d0f08';
        g.fillRect(x, 108, 32, 32);
        g.fillRect(x + 3, 106, 26, 2);
        g.fillStyle = '#ffd43b';
        g.fillRect(x + 15, 110, 2, 30);
      }
      break;
    }
    case 'club': {
      building(g, R, x0, x1, 30, '#16111f', false);
      g.fillStyle = '#231a33';
      for (let x = x0 + 6; x < x1; x += 12) g.fillRect(x, 32, 1, 108);
      // door
      const dx = CLUB_DOOR_X;
      g.fillStyle = '#b08d57';
      g.fillRect(dx - 22, 92, 44, 48);
      g.fillStyle = '#050308';
      g.fillRect(dx - 19, 95, 38, 45);
      drawText(g, 'NO TRAINERS', dx + 70, 108, { color: '#fff' });
      drawText(g, 'NO STAG DOS', dx + 70, 116, { color: '#fff' });
      drawText(g, '(OR HENS)', dx + 70, 124, { color: '#adb5bd' });
      drawText(g, 'NIGHTCLUB', dx, 82, { color: '#f783ac', align: 'center', scale: 1 });
      break;
    }
  }
}

function makeStrip(bulbs) {
  const c = canvas(LEVEL_W, VIEW_H);
  const g = c.getContext('2d');
  const R = rng(1234);
  for (const s of SEGMENTS) drawSeg(g, R, s, bulbs);
  // pavement
  g.fillStyle = '#3f3a52';
  g.fillRect(0, PAVE_Y, LEVEL_W, VIEW_H - PAVE_Y);
  g.fillStyle = '#2c283b';
  g.fillRect(0, PAVE_Y, LEVEL_W, 3);
  g.fillStyle = '#36324a';
  for (const y of [158, 177, 198]) g.fillRect(0, y, LEVEL_W, 1);
  for (let x = -60; x < LEVEL_W; x += 36) {
    for (let y = PAVE_Y + 3; y < 216; y++) g.fillRect(Math.round(x + (y - PAVE_Y) * 0.45), y, 1, 1);
  }
  // kerb + road
  g.fillStyle = '#77718c';
  g.fillRect(0, 216, LEVEL_W, 2);
  g.fillStyle = '#23202e';
  g.fillRect(0, 218, LEVEL_W, 7);
  // lamp glow pools
  for (let x = 100; x < LEVEL_W; x += 200) {
    const grd = g.createRadialGradient(x, 170, 4, x, 170, 70);
    grd.addColorStop(0, 'rgba(255,220,140,0.18)');
    grd.addColorStop(1, 'rgba(255,220,140,0)');
    g.fillStyle = grd;
    g.fillRect(x - 70, PAVE_Y, 140, 78);
  }
  // lamp posts (Blackpool teal)
  for (let x = 100; x < LEVEL_W; x += 200) {
    g.fillStyle = '#1f7a6e';
    g.fillRect(x - 2, 142, 5, 4);
    g.fillStyle = '#2f9e8f';
    g.fillRect(x - 1, 30, 3, 114);
    g.fillRect(x - 5, 30, 11, 2);
    g.fillStyle = '#ffe8a3';
    g.fillRect(x - 6, 32, 3, 3);
    g.fillRect(x + 4, 32, 3, 3);
  }
  // the bench
  g.fillStyle = '#6b4a2b';
  g.fillRect(BENCH_X - 16, 138, 32, 3);
  g.fillRect(BENCH_X - 16, 143, 32, 3);
  g.fillStyle = '#2f9e8f';
  g.fillRect(BENCH_X - 14, 138, 2, 12);
  g.fillRect(BENCH_X + 12, 138, 2, 12);
  return c;
}

export function buildLevel() {
  const bulbs = [];
  const lvl = {
    sky: makeSky(),
    tower: makeTower(),
    wheel: makeWheel(),
    strip: makeStrip(bulbs),
    bulbs,
    tram: null,
    tramTimer: 2,
  };
  return lvl;
}

// ------------------------------------------------------------------ per-frame
function drawDonkey(g, x, y, t, i) {
  const bob = Math.floor(t * 4 + i) % 2;
  const face = Math.sin(t * 0.2 + i * 2) > 0 ? 1 : -1;
  g.save();
  g.translate(Math.round(x), y);
  g.scale(face, 1);
  g.fillStyle = '#7a5c43';
  g.fillRect(-7, -9 + bob, 14, 6);
  g.fillRect(6, -13 + bob, 3, 6);
  g.fillRect(7, -14 + bob, 5, 4);
  g.fillStyle = '#5c4331';
  g.fillRect(7, -17 + bob, 1, 3); // ears
  g.fillRect(9, -17 + bob, 1, 3);
  g.fillRect(-8, -9 + bob, 1, 4); // tail
  g.fillStyle = ['#e03131', '#1971c2', '#fab005'][i % 3];
  g.fillRect(-3, -10 + bob, 6, 4); // saddle blanket
  g.fillStyle = '#4a3627';
  const k = Math.floor(t * 6 + i) % 2;
  g.fillRect(-6 + k, -3, 2, 3);
  g.fillRect(-2 - k, -3, 2, 3);
  g.fillRect(3 + k, -3, 2, 3);
  g.fillRect(6 - k, -3, 2, 3);
  g.restore();
}

function drawTram(g, sx) {
  const x = Math.round(sx), y = 140;
  g.fillStyle = '#f1e3c6';
  g.fillRect(x, y - 30, 120, 26);
  g.fillStyle = '#2b8a3e';
  g.fillRect(x, y - 12, 120, 8);
  g.fillRect(x, y - 32, 120, 3);
  g.fillStyle = '#ffe39a';
  for (let wx = x + 6; wx < x + 114; wx += 14) g.fillRect(wx, y - 26, 10, 9);
  g.fillStyle = '#1d1b33';
  g.fillRect(x - 2, y - 4, 124, 4);
  g.fillStyle = '#343a40';
  g.fillRect(x + 12, y - 4, 8, 4);
  g.fillRect(x + 100, y - 4, 8, 4);
  g.fillRect(x + 58, y - 44, 2, 12); // pole to the wires
  drawText(g, 'FLEETWOOD', x + 60, y - 11, { color: '#fff', align: 'center', outline: '#14532d' });
}

export function updateLevel(lvl, dt, camX, sfxBell) {
  lvl.tramTimer -= dt;
  if (!lvl.tram && lvl.tramTimer <= 0 && camX > 1850 && camX < 2600) {
    lvl.tram = { x: 2800 };
    sfxBell();
  }
  if (lvl.tram) {
    lvl.tram.x -= 70 * dt;
    if (lvl.tram.x < 1880) {
      lvl.tram = null;
      lvl.tramTimer = 16;
    }
  }
}

export function drawBackground(g, lvl, camX, t) {
  const cx = Math.round(camX);
  g.drawImage(lvl.sky, 0, 0);
  // twinkling stars
  g.fillStyle = '#fff';
  for (let i = 0; i < 6; i++) {
    const k = Math.floor(t * 2 + i * 13);
    g.fillRect((k * 97) % VIEW_W, (k * 31) % 80, 1, 1);
  }
  // skyline: the big wheel on the pier and the Tower
  g.drawImage(lvl.wheel, Math.round(820 - camX * 0.25), 20);
  const tx = Math.round(250 - camX * 0.1);
  if (tx > -70 && tx < VIEW_W) {
    g.drawImage(lvl.tower, tx, -4);
    // tower lights
    for (let i = 0; i < 10; i++) {
      if ((Math.floor(t * 3) + i) % 3 === 0) continue;
      const y = 26 + i * 10;
      const hw = Math.round(5 + 17 * Math.pow((y - 20) / 104, 1.7));
      g.fillStyle = i % 2 ? '#ffd43b' : '#fff';
      g.fillRect(tx + 32 - hw, y - 4, 1, 1);
      g.fillRect(tx + 32 + hw, y - 4, 1, 1);
    }
  }
  g.drawImage(lvl.strip, cx, 0, VIEW_W, VIEW_H, 0, 0, VIEW_W, VIEW_H);

  // animated prom details
  for (const s of SEGMENTS) {
    if (s.type !== 'prom' || s.x1 < camX || s.x0 > camX + VIEW_W) continue;
    g.fillStyle = '#9ec5fe';
    for (let i = 0; i < 24; i++) {
      const wx = s.x0 + ((i * 73 + Math.floor(t * 12) * 3) % (s.x1 - s.x0));
      const sx = wx - cx;
      if (sx >= 0 && sx < VIEW_W) g.fillRect(sx, 98 + ((i * 7) % 12), 3, 1);
    }
    // moon reflection
    g.fillStyle = '#fff4c4';
    for (let i = 0; i < 5; i++) g.fillRect(348 + Math.round(Math.sin(t * 2 + i) * 3), 98 + i * 2, 8 - i, 1);
  }
  DONKEYS.forEach((d, i) => {
    const x = d.x + Math.sin(t * 0.2 + i * 2) * 25 - cx;
    if (x > -20 && x < VIEW_W + 20) drawDonkey(g, x, 124, t, i);
  });

  // flashing bulbs on signs
  const phase = Math.floor(t * 5);
  for (const b of lvl.bulbs) {
    const sx = b.x - cx;
    if (sx < -2 || sx > VIEW_W + 2) continue;
    const on = (b.i + phase) % 3 !== 0;
    g.fillStyle = on ? (b.set === 1 || b.set === 2 ? BULB_COLS[(b.i + phase) % 5] : '#ffd43b') : '#5c4a2a';
    g.fillRect(sx - 1, b.y - 1, 2, 2);
  }

  // club neon
  const clubX = CLUB_DOOR_X - cx;
  if (clubX > -200 && clubX < VIEW_W + 200) {
    const flick = Math.sin(t * 23) > -0.85;
    drawText(g, 'THE VELVET', clubX, 42, { color: flick ? '#f783ac' : '#5c1a33', align: 'center', scale: 2, outline: flick ? '#a61e4d' : '#000' });
    drawText(g, 'WALRUS', clubX, 58, { color: '#66d9e8', align: 'center', scale: 3, outline: '#0b7285' });
    // velvet rope
    g.fillStyle = '#ffd43b';
    g.fillRect(clubX - 50, 132, 2, 14);
    g.fillRect(clubX + 48, 132, 2, 14);
    g.fillStyle = '#c92a2a';
    for (let x = -48; x < 48; x++) g.fillRect(clubX + x, 134 + Math.round(Math.sin(((x + 48) / 96) * Math.PI) * 5), 1, 2);
  }

  if (lvl.tram) {
    const sx = lvl.tram.x - cx;
    g.save();
    const seg = SEGMENTS[6];
    g.beginPath();
    g.rect(seg.x0 - cx, 0, seg.x1 - seg.x0, VIEW_H);
    g.clip();
    drawTram(g, sx);
    g.restore();
  }
}

// The illuminations: strings of bulbs slung between the lamp posts, drawn over everything behind the players.
export function drawIlluminations(g, camX, t) {
  const cx = Math.round(camX);
  const phase = Math.floor(t * 6);
  for (let x0 = 100; x0 < LEVEL_W - 200; x0 += 200) {
    if (x0 + 200 < camX || x0 > camX + VIEW_W) continue;
    for (let k = 0; k <= 40; k++) {
      const u = k / 40;
      const x = x0 + u * 200 - cx;
      const y = 30 + Math.sin(u * Math.PI) * 16;
      g.fillStyle = '#1d1b2b';
      g.fillRect(Math.round(x), Math.round(y) - 1, 5, 1);
      if ((k + phase) % 4 === 0) continue;
      g.fillStyle = BULB_COLS[(k + Math.floor(x0 / 200)) % 5];
      g.fillRect(Math.round(x), Math.round(y), 2, 2);
    }
  }
  // illuminated shapes on top of the posts
  for (let x0 = 100; x0 < LEVEL_W; x0 += 200) {
    const sx = x0 - cx;
    if (sx < -20 || sx > VIEW_W + 20) continue;
    const idx = Math.floor(x0 / 200);
    const on = (phase + idx) % 2 === 0;
    const kind = idx % 3;
    g.fillStyle = on ? ['#ffd43b', '#f783ac', '#4dabf7'][kind] : '#fff';
    if (kind < 1) {
      // star
      g.fillRect(sx - 1, 14, 3, 13);
      g.fillRect(sx - 6, 19, 13, 3);
      g.fillRect(sx - 3, 17, 7, 7);
    } else if (kind < 2) {
      // heart
      g.fillRect(sx - 5, 17, 4, 4);
      g.fillRect(sx + 2, 17, 4, 4);
      g.fillRect(sx - 5, 19, 11, 3);
      g.fillRect(sx - 3, 22, 7, 2);
      g.fillRect(sx - 1, 24, 3, 2);
    } else {
      // anchor
      g.fillRect(sx, 14, 2, 13);
      g.fillRect(sx - 3, 16, 8, 2);
      g.fillRect(sx - 5, 24, 12, 2);
      g.fillRect(sx - 5, 22, 2, 2);
      g.fillRect(sx + 5, 22, 2, 2);
    }
  }
}
