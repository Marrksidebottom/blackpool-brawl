# Face photos on Vercel - what was checked (25 Sept 2026)

## Does Vercel run the build? Yes.

`vercel.json` (on main since the first release) already sets `"buildCommand": "npm run build"` and
`"outputDirectory": "dist"`, and the live site shows the build runs:

- `https://blackpool-brawl.vercel.app/` serves `/assets/index-D9NzLNiT.js`. Hashed files like this only
  exist after `vite build`. `dist/` is not in the repo.
- `https://blackpool-brawl.vercel.app/faces/spencer.png` returns `200 image/png 1850551 bytes`. That file
  exists only because the `prebuild` step (`scripts/copy-faces.mjs`) copied it from the repo root during
  the Vercel build.

The Vercel API could not confirm the dashboard build settings. `get_project` returned 404 and
`list_deployments` returned 403 for the World Heat team. The evidence above comes from the live HTTP responses.

## So why no photos? The uploads on main are mostly empty.

On `main`, five of the six photos are 2-byte files. The GitHub web rename left stubs behind:

```
git ls-tree -l origin/main
  2        aaron.png / jonathan.png / jordan.png / marcus.png / phil.png
  1850551  spencer.png
```

The live site serves them exactly like that: `/faces/aaron.png -> 200, 2 bytes` (same for jonathan,
jordan, marcus, phil). The old loader also never showed Spencer's real screenshot. This branch has the
real images, skips broken or stub files with a warning, and the build writes small cropped JPGs plus
`faces/built/faces.json`.

## Results before merge (live site still on the old code)

`node docs/proof/check-live.mjs https://blackpool-brawl.vercel.app/`
```
bundle /assets/index-D9NzLNiT.js: OLD face loader
/faces/built/faces.json: 404
LIVE CHECK FAILED (2)
```
`node docs/proof/verify.mjs https://blackpool-brawl.vercel.app/` -> `faces.json: MISSING`, `title screen photos: undefined`

## Same checks against this branch's production build (`npm run build && npx vite preview`)

```
bundle /assets/index-C7GPjIZi.js: reads faces/built/faces.json (new face loader)
/faces/built/faces.json: 200
  aaron: /faces/built/aaron-53e82474.jpg 200 image/jpeg 16253 bytes
  jonathan: /faces/built/jonathan-dcb9fc82.jpg 200 image/jpeg 34016 bytes
  jordan: /faces/built/jordan-6ffdafbb.jpg 200 image/jpeg 19200 bytes
  marcus: /faces/built/marcus-b47d58c4.jpg 200 image/jpeg 27769 bytes
  phil: /faces/built/phil-36963f98.jpg 200 image/jpeg 16161 bytes
  spencer: /faces/built/spencer-fdc38c1a.jpg 200 image/jpeg 14223 bytes
no photo (cartoon head): mark
LIVE CHECK OK
```
Browser run (`verify.mjs`, headless Edge): `title screen photos: ["jonathan","phil","spencer","jordan","aaron","marcus"]`.
Screenshot: `15-title-with-photos.png`.

## After merge

I could not check the live site after the merge. The agent finishes before the merge and Vercel deploy
happen. Once main has deployed, run:

```
node docs/proof/check-live.mjs https://blackpool-brawl.vercel.app/     # expect: LIVE CHECK OK
node docs/proof/verify.mjs https://blackpool-brawl.vercel.app/         # expect: title screen photos: [six names]
```
(`verify.mjs` uses `puppeteer` if installed, otherwise `npm i --no-save puppeteer-core` plus a local Chrome or Edge.)
