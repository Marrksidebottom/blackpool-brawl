// Finds face photos in the repo root or public/faces/ and puts small copies in public/faces/built/ with a
// faces.json manifest the game reads. Runs automatically before `npm run dev` and `npm run build` (Vercel runs it too).
//
// Any filename containing a lad's first name works, any case: "Aaron Clark.png", "aaron.png", "AARON.JPG",
// "Aaron-Clark.jpeg". Photos are shrunk (max 480px) with sharp so a 5MB phone screenshot costs a phone ~40KB.
// If sharp isn't available the original is copied as-is. Broken or empty files are skipped with a warning.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const facesDir = join(root, 'public', 'faces');
const out = join(facesDir, 'built');
const NAMES = ['jonathan', 'phil', 'spencer', 'jordan', 'aaron', 'marcus', 'mark'];
const EXTS = ['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'];
const MAX = 480;

/** Real image data? (catches the 2-byte files GitHub's web "rename" can leave behind) */
function sniff(buf) {
  if (buf.length < 64) return null;
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buf.toString('ascii', 4, 8) === 'ftyp') return 'heic';
  return null;
}

/** Which lad a filename belongs to: first name anywhere before the extension, any case, e.g. "Phil Clayton", "picAaron2". */
function whoIs(file) {
  const base = file.slice(0, -extname(file).length).toLowerCase();
  let best = null, at = Infinity;
  for (const n of NAMES) {
    const i = base.indexOf(n);
    // earliest name wins; on a tie the longer name (never happens with today's names, but keeps it predictable)
    if (i >= 0 && (i < at || (i === at && n.length > best.length))) [best, at] = [n, i];
  }
  return best;
}

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('faces: sharp not available, copying photos full size');
}

const found = new Map(); // name -> { path, buf, kind }
for (const dir of [root, facesDir]) {
  let files = [];
  try {
    files = readdirSync(dir);
  } catch {
    continue;
  }
  for (const file of files) {
    const ext = extname(file).slice(1).toLowerCase();
    if (!EXTS.includes(ext)) continue;
    const path = join(dir, file);
    if (!statSync(path).isFile()) continue;
    const name = whoIs(file);
    if (!name) continue;
    const buf = readFileSync(path);
    const kind = sniff(buf);
    if (!kind) {
      console.warn(`faces: skipping ${file} - it is ${buf.length} bytes and not a real image (re-upload it)`);
      continue;
    }
    // more than one photo of someone: the biggest wins (least likely to be a stub)
    const prev = found.get(name);
    if (!prev || buf.length > prev.buf.length) found.set(name, { file, buf, kind });
  }
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const manifest = {};
for (const [name, { file, buf, kind }] of found) {
  const tag = createHash('sha1').update(buf).digest('hex').slice(0, 8);
  let outName = `${name}-${tag}.${kind}`;
  let data = buf;
  if (sharp && kind !== 'heic') {
    try {
      data = await sharp(buf)
        .rotate() // respect phone orientation
        .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
        .flatten({ background: '#000000' })
        .jpeg({ quality: 85 })
        .toBuffer();
      outName = `${name}-${tag}.jpg`;
    } catch (e) {
      console.warn(`faces: could not shrink ${file} (${e.message}), copying it as-is`);
      data = buf;
    }
  }
  if (kind === 'heic') {
    console.warn(`faces: ${file} is HEIC - only Safari can show it. Export it as JPG for everyone else.`);
  }
  writeFileSync(join(out, outName), data);
  manifest[name] = outName;
  console.log(`faces: ${file} -> public/faces/built/${outName} (${Math.round(data.length / 1024)}KB)`);
}
writeFileSync(join(out, 'faces.json'), JSON.stringify(manifest, null, 2) + '\n');
const missing = NAMES.filter((n) => !manifest[n]);
if (missing.length) console.log(`faces: no photo yet for ${missing.join(', ')} - cartoon heads for them`);
