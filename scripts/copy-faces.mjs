// Copies face photos committed at the repo root (e.g. mark.png, Phil.JPG) into public/faces/<name>.<ext>
// so the game picks them up with no code change. Runs automatically before `npm run dev` and `npm run build`.
import { readdirSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'faces');
const NAMES = ['jonathan', 'phil', 'spencer', 'jordan', 'aaron', 'marcus', 'mark'];
const EXTS = ['png', 'jpg', 'jpeg', 'webp'];

mkdirSync(out, { recursive: true });
for (const file of readdirSync(root)) {
  const m = /^([a-z]+)\.([a-z]+)$/i.exec(file);
  if (!m) continue;
  const name = m[1].toLowerCase();
  const ext = m[2].toLowerCase();
  if (!NAMES.includes(name) || !EXTS.includes(ext)) continue;
  copyFileSync(join(root, file), join(out, `${name}.${ext}`));
  console.log(`faces: ${file} -> public/faces/${name}.${ext}`);
}
