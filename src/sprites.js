// Procedural blocky pixel sprites. Everything is drawn with rectangles - no image assets.
import { findFaceCrop } from './facecrop.js';

let FLASH = null; // when set, every rect is drawn in this colour (hit flash)
let C = null; // current context

function r(x, y, w, h, col) {
  C.fillStyle = FLASH || col;
  C.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

const shadeCache = new Map();
export function shade(hex, amt) {
  const key = hex + amt;
  let v = shadeCache.get(key);
  if (v) return v;
  const n = parseInt(hex.slice(1), 16);
  let R = (n >> 16) & 255, G = (n >> 8) & 255, B = n & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  v = '#' + ((1 << 24) | (f(R) << 16) | (f(G) << 8) | f(B)).toString(16).slice(1);
  shadeCache.set(key, v);
  return v;
}

// ------------------------------------------------------------------ faces
export const HEAD_W = 12;
export const HEAD_H = 12;
const PHOTO_W = 14;
const PHOTO_H = 16;

const FACES = `${import.meta.env.BASE_URL}faces/`;
const FACE_EXTS = ['png', 'jpg', 'jpeg', 'webp'];
const WORK_MAX = 400; // big photos are shrunk to this before any pixel work

/**
 * Load each lad's photo; a hit replaces the cartoon head, a miss (or a broken file) keeps the cartoon.
 * The build lists photos in faces/built/faces.json (see scripts/copy-faces.mjs). Without that list
 * (e.g. a bare static server) fall back to trying faces/<id>.png/.jpg/.jpeg/.webp.
 */
export function loadFaces(crew) {
  fetch(`${FACES}built/faces.json`, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((manifest) => {
      for (const c of crew) {
        const urls = manifest
          ? (manifest[c.id] ? [`${FACES}built/${manifest[c.id]}`] : [])
          : FACE_EXTS.map((ext) => `${FACES}${c.id}.${ext}`);
        tryFace(c, urls, 0);
      }
    });
}

function tryFace(c, urls, i) {
  if (i >= urls.length) return; // no photo - cartoon head it is
  const img = new Image();
  img.onload = () => {
    try {
      c.photo = pixelateFace(img);
    } catch (e) {
      console.warn('Could not use face photo for', c.id, e);
    }
  };
  img.onerror = () => tryFace(c, urls, i + 1);
  img.src = urls[i];
}

function pixelateFace(img) {
  const w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) throw new Error('empty image');
  // shrink to a small working copy, then find the face (trims screenshot bars)
  const k = Math.min(1, WORK_MAX / Math.max(w, h));
  const work = document.createElement('canvas');
  work.width = Math.max(1, Math.round(w * k));
  work.height = Math.max(1, Math.round(h * k));
  const wk = work.getContext('2d', { willReadFrequently: true });
  wk.imageSmoothingEnabled = true;
  wk.imageSmoothingQuality = 'high';
  wk.drawImage(img, 0, 0, work.width, work.height);
  const px = wk.getImageData(0, 0, work.width, work.height).data;
  const box = findFaceCrop(px, work.width, work.height, PHOTO_W / PHOTO_H);
  // two-step downscale so the average colours survive
  const mid = document.createElement('canvas');
  mid.width = PHOTO_W * 4;
  mid.height = PHOTO_H * 4;
  const m = mid.getContext('2d');
  m.imageSmoothingEnabled = true;
  m.imageSmoothingQuality = 'high';
  m.drawImage(work, box.x, box.y, box.w, box.h, 0, 0, mid.width, mid.height);
  const out = document.createElement('canvas');
  out.width = PHOTO_W;
  out.height = PHOTO_H;
  const o = out.getContext('2d');
  o.imageSmoothingEnabled = true;
  o.imageSmoothingQuality = 'high';
  o.drawImage(mid, 0, 0, PHOTO_W, PHOTO_H);
  const data = o.getImageData(0, 0, PHOTO_W, PHOTO_H);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    // posterise a touch so it sits with the chunky palette
    d[i] = Math.round(d[i] / 24) * 24;
    d[i + 1] = Math.round(d[i + 1] / 24) * 24;
    d[i + 2] = Math.round(d[i + 2] / 24) * 24;
    d[i + 3] = d[i + 3] < 128 ? 0 : 255;
  }
  // round the corners so it reads as a head rather than a stamp
  const clear = [[0, 0], [1, 0], [0, 1], [PHOTO_W - 1, 0], [PHOTO_W - 2, 0], [PHOTO_W - 1, 1], [0, PHOTO_H - 1], [PHOTO_W - 1, PHOTO_H - 1]];
  for (const [x, y] of clear) d[(y * PHOTO_W + x) * 4 + 3] = 0;
  o.putImageData(data, 0, 0);
  return out;
}

// ------------------------------------------------------------------ humans
function drawHair(look, hx, hy) {
  const hc = look.hair;
  const dk = shade(hc, -0.25);
  switch (look.hairStyle) {
    case 'short':
      r(hx, hy - 1, HEAD_W, 3, hc);
      r(hx, hy + 2, 3, 4, hc);
      r(hx + HEAD_W - 3, hy + 2, 2, 1, hc);
      break;
    case 'side':
      r(hx, hy - 1, HEAD_W, 3, hc);
      r(hx + 5, hy - 2, HEAD_W - 5, 1, hc);
      r(hx, hy + 2, 3, 4, hc);
      r(hx + 7, hy + 2, 4, 1, dk);
      break;
    case 'spiky':
      r(hx, hy - 1, HEAD_W, 3, hc);
      for (let i = 0; i < HEAD_W; i += 3) r(hx + i, hy - 3, 2, 2, hc);
      r(hx, hy + 2, 2, 3, hc);
      break;
    case 'quiff':
      r(hx, hy - 1, HEAD_W, 3, hc);
      r(hx + 5, hy - 4, 7, 3, hc);
      r(hx + 9, hy - 5, 4, 2, hc);
      r(hx, hy + 2, 2, 4, dk);
      break;
    case 'curly':
      r(hx - 1, hy - 2, HEAD_W + 2, 4, hc);
      for (let i = -1; i < HEAD_W + 1; i += 2) r(hx + i, hy - 3, 1, 1, dk);
      r(hx - 1, hy + 2, 4, 5, hc);
      r(hx + 1, hy + 3, 1, 1, dk);
      break;
    case 'receding':
      r(hx, hy + 1, 4, 5, hc);
      r(hx + 3, hy - 1, 3, 2, hc);
      break;
    case 'buzz':
      r(hx, hy - 1, HEAD_W, 2, dk);
      r(hx, hy + 1, 2, 4, dk);
      break;
    case 'long':
      r(hx - 1, hy - 2, HEAD_W + 2, 4, hc);
      r(hx - 2, hy, 5, 13, hc);
      r(hx + HEAD_W - 2, hy + 1, 2, 3, hc);
      break;
    case 'bun':
      r(hx, hy - 1, HEAD_W, 3, hc);
      r(hx + 1, hy - 5, 5, 4, hc);
      r(hx, hy + 2, 3, 4, hc);
      break;
    case 'bald':
    default:
      r(hx + 3, hy, 4, 1, shade(look.skin, 0.25)); // shine
      break;
  }
}

function drawHead(look, hx, hy, mood) {
  if (look.photo && !FLASH) {
    C.drawImage(look.photo, Math.round(hx - 1), Math.round(hy + HEAD_H - PHOTO_H), PHOTO_W, PHOTO_H);
    return;
  }
  const sk = look.skin;
  r(hx, hy + 1, HEAD_W, HEAD_H - 2, sk);
  r(hx + 1, hy, HEAD_W - 2, HEAD_H, sk);
  r(hx + HEAD_W, hy + 6, 1, 2, sk); // nose
  r(hx + 2, hy + 5, 1, 2, shade(sk, -0.2)); // ear
  const ey = hy + 5;
  const eye = '#1a1a1a';
  if (mood === 'ko') {
    r(hx + 6, ey, 1, 1, eye); r(hx + 8, ey + 2, 1, 1, eye); r(hx + 8, ey, 1, 1, eye); r(hx + 6, ey + 2, 1, 1, eye);
  } else if (mood === 'sleep' || mood === 'squint') {
    r(hx + 6, ey + 1, 2, 1, eye);
    r(hx + 9, ey + 1, 2, 1, eye);
  } else {
    r(hx + 7, ey, 1, 2, eye);
    r(hx + 10, ey, 1, 2, eye);
  }
  if (look.beard) {
    const bc = look.beardColour || look.hair;
    if (look.beard === 'full') {
      r(hx + 2, hy + 8, HEAD_W - 2, 4, bc);
      r(hx + 3, hy + 6, 2, 2, bc);
    } else if (look.beard === 'goatee') {
      r(hx + 8, hy + 9, 3, 3, bc);
    } else {
      const st = shade(sk, -0.28);
      for (let i = 3; i < HEAD_W; i += 2) r(hx + i, hy + 9 + (i % 4 === 1 ? 1 : 0), 1, 1, st);
      r(hx + 4, hy + 11, 7, 1, st);
    }
  }
  // mouth
  if (mood === 'shout' || mood === 'hurt') r(hx + 8, hy + 9, 2, 2, '#5a1010');
  else if (mood === 'drink') r(hx + 9, hy + 9, 2, 1, '#5a1010');
  else r(hx + 8, hy + 9, 3, 1, look.beard === 'full' ? '#3a2014' : '#8a3a2a');
  if (look.glasses) {
    const g = '#111';
    r(hx + 6, ey - 1, 3, 1, g); r(hx + 6, ey + 2, 3, 1, g); r(hx + 5, ey - 1, 1, 4, g); r(hx + 8, ey - 1, 1, 4, g);
    r(hx + 9, ey, 1, 1, g);
    r(hx + 10, ey - 1, 2, 1, g); r(hx + 10, ey + 2, 2, 1, g); r(hx + 11, ey - 1, 1, 4, g);
    r(hx + 3, ey, 2, 1, g);
  }
  if (look.shades) r(hx + 5, ey - 1, 7, 3, '#050505');
  drawHair(look, hx, hy);
  if (look.veil) r(hx - 3, hy - 2, 4, 16, '#f8f8ff');
  if (look.hat) {
    r(hx - 1, hy - 3, HEAD_W + 2, 3, look.hat);
    r(hx + 2, hy - 6, 8, 3, look.hat);
  }
}

function held(item, x, y) {
  if (item === 'pint') drawPint(C, x - 2, y + 3);
  else if (item === 'chips') drawChips(C, x - 3, y + 4);
  else if (item === 'bag') {
    r(x - 1, y, 1, 3, '#222');
    r(x - 3, y + 3, 6, 5, '#e64980');
    r(x - 3, y + 3, 6, 1, '#f783ac');
  } else if (item === 'clipboard') {
    r(x - 2, y - 2, 6, 8, '#a67c52');
    r(x - 1, y - 1, 4, 6, '#fff');
  }
}

/**
 * Draw a person. (sx, sy) is the feet position on screen. pose is one of:
 * idle walk punch upper kick jump jumpkick hurt down grab drink cheer spin slam sit bag
 * p = pose progress 0..1, walk = walk cycle phase.
 */
export function drawHuman(ctx, sx, sy, face, look, pose = 'idle', p = 0, walk = 0, opts = {}) {
  C = ctx;
  FLASH = opts.flash ? '#ffffff' : null;
  ctx.save();
  ctx.translate(Math.round(sx), Math.round(sy));
  ctx.scale(face, 1);
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  const H = look.h, W = look.w;
  const legH = Math.round(13 * H);
  const torsoH = Math.round(12 * H);
  const tw = Math.max(9, Math.round(11 * W));
  const lw = Math.max(3, Math.round(4 * W));
  const armL = Math.round(10 * H);
  const aw = W > 1.15 ? 4 : 3;
  if (pose === 'down') {
    ctx.translate(0, -Math.round(tw / 2) - 1);
    ctx.rotate(-Math.PI / 2);
  }
  let hipY = -legH;
  let lean = 0;
  if (pose === 'hurt') lean = -2;
  else if (pose === 'punch' || pose === 'grab' || pose === 'bag') lean = 1;
  else if (pose === 'kick') lean = -1;
  if (pose === 'sit') hipY = -9;
  if (pose === 'jump' || pose === 'jumpkick') hipY = -legH + 3;

  const shirt = look.shirt;
  const shirtDk = shade(shirt, -0.3);
  const trou = look.trousers || '#2b2b2b';
  const trouDk = shade(trou, -0.3);
  const shoe = look.shoes || '#141414';
  const skin = look.skin;
  const topY = hipY - torsoH;
  const fsx = Math.round(tw / 2) - 3 + lean; // front shoulder x
  const bsx = -Math.round(tw / 2) + lean; // back shoulder x
  const shY = topY + 2;
  const s = Math.sin(walk);

  // ---- back arm
  const armDown = (x, swing, col, handCol) => {
    r(x + swing, shY, aw, armL, col);
    r(x + swing, shY + armL, aw, 2, handCol);
  };
  const armFwd = (x, ext, col) => {
    const len = 2 + Math.round((armL - 1) * ext);
    r(x, shY + 1, len, aw, col);
    r(x + len, shY, 3, aw + 1, skin);
  };
  const armUp = (x, col) => {
    r(x, shY - armL + 1, aw, armL + 1, col);
    r(x, shY - armL - 2, aw, 3, skin);
  };
  const backCol = shirtDk;
  switch (pose) {
    case 'cheer': armUp(bsx + 1, backCol); break;
    case 'spin': armFwd(bsx - armL, 1, backCol); break;
    case 'grab': armFwd(bsx + 2, 0.8, backCol); break;
    case 'hurt': r(bsx - 2, shY - 6, aw, 8, backCol); break;
    case 'down': case 'sit': break;
    default: armDown(bsx + 1, pose === 'walk' ? -s * 2 : 0, backCol, shade(skin, -0.15));
  }

  // ---- legs
  const leg = (x, col, h = legH, y0 = hipY) => {
    r(x, y0, lw, h - 2, col);
    r(x, y0 + h - 2, lw + 2, 2, shoe);
  };
  if (pose === 'kick' || pose === 'jumpkick') {
    const ext = pose === 'jumpkick' ? 1 : p;
    if (pose === 'jumpkick') leg(-lw, trouDk, legH - 5);
    else leg(-lw + 1, trouDk);
    const len = 3 + Math.round(12 * ext * H);
    r(0, hipY, len, lw, trou);
    r(len, hipY - 1, 2, lw + 2, shoe);
  } else if (pose === 'jump') {
    leg(-lw, trouDk, legH - 4);
    leg(1, trou, legH - 5, hipY - 1);
  } else if (pose === 'sit') {
    r(-2, hipY, 12, lw, trou);
    r(8, hipY, lw, 9, trou);
    r(8, -2, lw + 2, 2, shoe);
  } else if (look.dress) {
    const sp = pose === 'walk' ? s * 2 : 0;
    r(-3 - sp, hipY, 2, legH - 2, skin);
    r(1 + sp, hipY, 2, legH - 2, skin);
    r(-3 - sp, -2, 3, 2, look.shoes || '#c2255c');
    r(1 + sp, -2, 3, 2, look.shoes || '#c2255c');
  } else {
    const sp = pose === 'walk' ? s * 3 : 0;
    leg(Math.round(-lw / 2 - 1 - sp), trouDk);
    leg(Math.round(-lw / 2 + 1 + sp), trou);
  }

  // ---- torso
  const tx = -Math.round(tw / 2) + lean;
  r(tx, topY, tw, torsoH, shirt);
  r(tx, topY, 1, torsoH, shirtDk);
  if (look.dress) {
    r(tx - 1, hipY - 2, tw + 2, Math.round(legH * 0.55), shirt);
    r(tx - 1, hipY - 2, 1, Math.round(legH * 0.55), shirtDk);
  }
  if (look.collar) {
    r(tx + tw - 5, topY, 3, 3, look.collar);
    r(tx + tw - 4, topY + 3, 1, 6, '#000');
  }
  if (look.print) {
    r(tx + tw - 7, topY + 3, 5, 5, look.print);
    r(tx + tw - 6, topY + 4, 1, 1, '#000');
    r(tx + tw - 4, topY + 4, 1, 1, '#000');
    r(tx + tw - 6, topY + 6, 3, 1, '#000');
  }
  if (look.sash) for (let i = 0; i < torsoH - 1; i++) r(tx + Math.round((i / torsoH) * (tw - 2)), topY + i, 2, 1, look.sash);
  if (look.chain) r(tx + 3, topY + 2, tw - 4, 1, '#ffd43b');
  r(tx, hipY - 1, tw, 1, look.dress ? shirtDk : shade(trou, -0.5)); // belt/waist line

  // ---- head
  const hx = -6 + lean + (pose === 'drink' ? -1 : 0);
  const hy = topY - HEAD_H + 2 + (pose === 'sit' && opts.mood === 'sleep' ? 2 : 0);
  drawHead(look, hx, hy, opts.mood);

  // ---- front arm
  const item = opts.item;
  switch (pose) {
    case 'punch': case 'bag': armFwd(fsx, p, shirt); if (pose === 'bag') held('bag', fsx + 2 + Math.round((armL - 1) * p) + 1, shY + 2); break;
    case 'grab': armFwd(fsx, 0.8, shirt); break;
    case 'upper': case 'cheer': case 'slam': armUp(fsx, shirt); break;
    case 'spin': armFwd(fsx, 1, shirt); break;
    case 'hurt': r(fsx - 1, shY - 7, aw, 8, shirt); break;
    case 'drink':
      r(fsx, shY, aw, 5, shirt);
      r(fsx + 1, shY - 4, aw, 5, shirt);
      held(item || 'pint', fsx + 4, hy + 2);
      break;
    case 'sit': armDown(fsx - 2, 0, shirt, skin); break;
    case 'down': break;
    default:
      armDown(fsx, pose === 'walk' ? s * 2 : 0, shirt, skin);
      if (item) held(item, fsx + 2 + (pose === 'walk' ? s * 2 : 0), shY + armL - 2);
  }
  ctx.restore();
  FLASH = null;
}

// ------------------------------------------------------------------ props
export function drawPint(ctx, x, y) {
  C = ctx;
  x = Math.round(x);
  y = Math.round(y);
  r(x, y, 5, 8, '#fff6d5');
  r(x, y + 2, 5, 6, '#d98e04');
  r(x + 1, y + 3, 1, 4, '#f5b83d');
  r(x, y, 5, 2, '#fffbe8');
  r(x + 5, y + 3, 1, 3, 'rgba(255,255,255,0.6)');
}

export function drawChips(ctx, x, y) {
  C = ctx;
  x = Math.round(x);
  y = Math.round(y);
  r(x + 1, y - 3, 1, 4, '#ffd43b');
  r(x + 3, y - 4, 1, 5, '#fab005');
  r(x + 5, y - 2, 1, 3, '#ffd43b');
  r(x, y, 7, 6, '#f1f3f5');
  r(x, y + 2, 7, 1, '#ced4da');
  r(x + 1, y + 6, 5, 1, '#dee2e6');
}

export function drawGull(ctx, sx, sy, face, flap, carrying, opts = {}) {
  C = ctx;
  FLASH = opts.flash ? '#fff' : null;
  ctx.save();
  ctx.translate(Math.round(sx), Math.round(sy));
  ctx.scale(face, 1);
  if (opts.down) ctx.rotate(Math.PI);
  const up = Math.sin(flap) > 0;
  r(-6, -4, 12, 5, '#f8f9fa'); // body
  r(-8, -3, 3, 2, '#adb5bd'); // tail
  r(-9, -4, 2, 1, '#212529');
  r(5, -7, 4, 4, '#f8f9fa'); // head
  r(7, -6, 1, 1, '#000'); // beady eye
  r(9, -5, 3, 1, '#fab005'); // beak
  r(10, -4, 1, 1, '#e8590c');
  if (up) {
    r(-4, -10, 7, 6, '#ced4da');
    r(-4, -11, 4, 2, '#495057');
  } else {
    r(-4, -1, 7, 4, '#ced4da');
    r(-4, 3, 4, 1, '#495057');
  }
  if (opts.legs) {
    r(-1, 1, 1, 3, '#f08c00');
    r(2, 1, 1, 3, '#f08c00');
  }
  if (carrying) drawChips(ctx, 8, 0);
  ctx.restore();
  FLASH = null;
}

export function drawShadow(ctx, sx, sy, w) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  const hw = Math.round(w / 2);
  ctx.fillRect(Math.round(sx - hw), Math.round(sy - 1), hw * 2, 3);
  ctx.fillRect(Math.round(sx - hw + 2), Math.round(sy - 2), hw * 2 - 4, 5);
}
