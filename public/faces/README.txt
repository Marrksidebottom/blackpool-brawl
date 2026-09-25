Drop face photos in this folder (or in the repo root) to replace the cartoon heads - no code change needed.

Any filename containing the first name works, any case:
  Aaron Clark.png  aaron.png  AARON.JPG  Aaron-Clark.jpeg
Names: jonathan  phil  spencer  jordan  aaron  marcus  mark
Formats: PNG, JPG/JPEG, WEBP. HEIC (iPhone default) only works in Safari - export as JPG instead.

The build (scripts/copy-faces.mjs) shrinks them into built/ (generated, not committed) with a faces.json list.
The game trims black screenshot bars and crops the upper-middle, but a square crop of just the face works best.
Push to main after adding photos and Vercel redeploys.
