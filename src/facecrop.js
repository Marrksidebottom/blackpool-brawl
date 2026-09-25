// Best-effort auto-crop for face photos. Pure maths on RGBA pixels (no DOM), so the build script can test it too.
// Phone screenshots of the Photos app have black bars with a clock, "1 of 3", names and icons on them.
// We trim those bars, then take a head-shaped box from the upper-middle of what is left.

const NEAR_BLACK = 18; // luminance at or below this counts as screenshot-bar black
const ROW_BAR = 0.8; // a row this black is a bar (leaves room for the clock/caption text on it)
const COL_BAR = 0.97; // side bars never carry text, so be strict and leave dark photos alone
const FILL = 0.8; // share of the shorter side the head box takes
const FACE_Y = 0.4; // where the head box centre sits down a portrait photo (0 top, 1 bottom)

function barMask(d, w, h, horizontal, x0, x1, y0, y1, limit) {
  const n = horizontal ? h : w;
  const out = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    let dark = 0, total = 0;
    if (horizontal) {
      for (let x = x0; x < x1; x++, total++) if (lum(d, (i * w + x) * 4) <= NEAR_BLACK) dark++;
    } else {
      for (let y = y0; y < y1; y++, total++) if (lum(d, (y * w + i) * 4) <= NEAR_BLACK) dark++;
    }
    out[i] = total > 0 && dark / total >= limit;
  }
  return out;
}

function lum(d, i) {
  if (d[i + 3] < 128) return 0; // transparent counts as border
  return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
}

/** Longest run of non-bar lines, bridging little gaps (a thin dark stripe inside the photo). */
function longestRun(bars, gap) {
  let best = [0, 0], start = -1, last = -1;
  const close = () => {
    if (start >= 0 && last + 1 - start > best[1] - best[0]) best = [start, last + 1];
  };
  bars.forEach((bar, i) => {
    if (bar) return;
    if (start < 0 || i - last > gap + 1) {
      close();
      start = i;
    }
    last = i;
  });
  close();
  return best;
}

/**
 * Pick the part of an image to use as a pixel head.
 * @param {Uint8ClampedArray|Uint8Array} d RGBA pixels
 * @param {number} w width
 * @param {number} h height
 * @param {number} aspect wanted width / height of the result
 * @returns {{x:number,y:number,w:number,h:number}}
 */
export function findFaceCrop(d, w, h, aspect = 1) {
  // 1. trim black bars: top/bottom first (they carry the clock and captions), then the sides
  let [top, bottom] = longestRun(barMask(d, w, h, true, 0, w, 0, h, ROW_BAR), Math.max(1, Math.round(h * 0.01)));
  let [left, right] = longestRun(barMask(d, w, h, false, 0, w, top, bottom, COL_BAR), Math.max(1, Math.round(w * 0.01)));
  // nothing sensible left (an all-black picture): use the whole thing
  if (bottom - top < h * 0.15 || right - left < w * 0.15) [top, bottom, left, right] = [0, h, 0, w];
  const rw = right - left, rh = bottom - top;

  // 2. a head-shaped box from the middle, biased upward in portrait pictures where faces usually sit
  let cw = Math.min(rw, rh * aspect) * FILL;
  let ch = cw / aspect;
  const cx = left + rw / 2;
  const faceY = rh > rw * 1.15 ? FACE_Y : 0.47;
  const cy = top + rh * faceY;
  const x = Math.min(Math.max(left, cx - cw / 2), right - cw);
  const y = Math.min(Math.max(top, cy - ch / 2), bottom - ch);
  return { x: Math.round(x), y: Math.round(y), w: Math.round(cw), h: Math.round(ch) };
}
