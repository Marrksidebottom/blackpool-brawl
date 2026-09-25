# Blackpool Brawl

A daft 90s-arcade-style side-scrolling beat 'em up: the World Heat lads' night out down the Golden Mile.
Pick one of the seven lads. The other six come along as AI mates who fight, drink and wander about.
Walk right past the Tower, the arcades, the rock shop and the chippy, drink pints, deal with stag dos,
hen parties, bouncers and chip-thieving seagulls, then get past Big Dez, the head bouncer, to get into the club.

## Face photos (no code change needed)

Upload a photo to the repo root (or to `public/faces/`) with the lad's first name anywhere in the filename, any case:
`Aaron Clark.png`, `aaron.png`, `AARON.JPG`, `Aaron-Clark.jpeg` and `picAaron2.png` all work. The names are `jonathan`, `phil`, `spencer`, `jordan`,
`aaron`, `marcus` and `mark`. PNG, JPG/JPEG and WEBP work everywhere. **HEIC (the iPhone default) only works in Safari**, so export
iPhone photos as JPG (or screenshot them). Anyone without a photo keeps the cartoon head.

Every push to `main` redeploys on Vercel, and the build (`scripts/copy-faces.mjs`) finds the photos, shrinks them to about 20-40KB each
and lists them in `faces/built/faces.json` for the game. The game trims the black bars off phone screenshots and takes the
upper-middle of the photo, but **a square crop of just the face gives the best result**.

Upload with **Add file > Upload files**, already named how you want. Don't rename an uploaded photo in GitHub's web editor: on
25 Sept 2026 that turned five photos into empty 2-byte files. The build log warns if a photo is broken like that
("skipping aaron.png - it is 2 bytes and not a real image").

Heights, builds, hair, beards, glasses and shirt colours are in `src/crew.js` if anyone needs tweaking.

## Controls

| Action  | Keyboard            | Phone               |
|---------|---------------------|---------------------|
| Move    | Arrows / WASD       | Left stick          |
| Punch   | J (tap for combo)   | PUNCH               |
| Kick    | K                   | KICK                |
| Jump    | Space               | JUMP (then punch/kick for a flying kick) |
| Special | L (or J+K)          | SPECIAL (costs a bit of health) |
| Grab    | Walk into a baddie, then J to knee, K to throw | same |
| Pause / music | P / M         | II / music button   |

Pints are health, but every pint makes you (and the screen) wobblier. You sober up over time.

## Development

```
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

Plain Vite + canvas, no framework, no backend. Deployed on Vercel (`vercel.json`).

To deploy: in Vercel, go to Add New > Project, import `Marrksidebottom/blackpool-brawl` and keep the settings from
`vercel.json`. Every push to `main` then goes live. Or, from a logged-in shell, run `npx vercel --prod`. The phone link to
share is the project's `https://<project>.vercel.app` production URL. Check that Deployment Protection is off for
production so colleagues can open it without a Vercel login.

Live at **https://blackpool-brawl.vercel.app** (Vercel project `blackpool-brawl`, World Heat team). It auto-deploys from
`main` and runs `npm run build` there (set in `vercel.json`: `buildCommand` `npm run build`, `outputDirectory` `dist`), so
the photos are picked up on Vercel even when they're only ever uploaded through the GitHub website. To check what the live
site serves: `node docs/proof/check-live.mjs` (plain Node), or `node docs/proof/verify.mjs https://blackpool-brawl.vercel.app/`
for the title screen in a real browser (needs `npm i -D puppeteer`). The throwaway projects `world-heat-blackpool-brawl` and `wh-blackpool-brawl` from
earlier attempts can be deleted.

Browser proof (title, pick, walking, hitting, drunk wobble, both gags, boss, both end screens, iPhone touch controls):
see [docs/VERIFICATION.md](docs/VERIFICATION.md).

For testing from the browser console: `BB.start(6)` starts as Mark, `BB.warp(3700)` jumps to the boss.

## Originality

All art is drawn in code as blocky pixel rectangles (`src/sprites.js`, `src/level.js`). The pixel font, the music
("Golden Mile Stomp" and the boss theme) and every sound effect are generated in code with the Web Audio API
(`src/font.js`, `src/audio.js`). No sprites, sounds, music, logos or level art from any existing game are used,
downloaded or referenced. The enemy names, moves and venue names are made up.
