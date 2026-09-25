# Blackpool Brawl

A daft 90s-arcade-style side-scrolling beat 'em up: the World Heat lads' night out down the Golden Mile.
Pick one of the seven lads. The other six come along as AI mates who fight, drink and wander about.
Walk right past the Tower, the arcades, the rock shop and the chippy, drink pints, deal with stag dos,
hen parties, bouncers and chip-thieving seagulls, then get past Big Dez, the head bouncer, to get into the club.

## Face photos (no code change needed)

Upload a photo named `<firstname>.png` (or `.jpg`) to the repo root or to `public/faces/`, and it becomes that lad's pixelated head:
`jonathan`, `phil`, `spencer`, `jordan`, `aaron`, `marcus`, `mark` (head-and-shoulders crop). The build copies root photos into `public/faces/` for you; push to `main` and it redeploys.

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

Deployment status (25 Sept 2026, morning): not live yet. The build agent's Vercel role in the World Heat team can create
a new project once, but can't see or manage it afterwards. So it can't redeploy, deploy from GitHub (403) or turn off
Vercel Authentication, and anything it publishes sits behind a Vercel login. The CLI on the build machine isn't logged in.
Two throwaway projects from these attempts, `world-heat-blackpool-brawl` and `wh-blackpool-brawl`
(which has a placeholder page), can be reused or deleted. A team Owner needs about two minutes:

1. Merge this branch to `main`.
2. In Vercel: Add New > Project > import `Marrksidebottom/blackpool-brawl`, then Deploy (the settings come from `vercel.json`).
3. Go to Project > Settings > Deployment Protection, set Vercel Authentication to Disabled and save. Without this,
   colleagues get a Vercel login page instead of the game.
4. Share `https://<project>.vercel.app` and put it here.

Browser proof (title, pick, walking, hitting, drunk wobble, both gags, boss, both end screens, iPhone touch controls):
see [docs/VERIFICATION.md](docs/VERIFICATION.md).

For testing from the browser console: `BB.start(6)` starts as Mark, `BB.warp(3700)` jumps to the boss.

## Originality

All art is drawn in code as blocky pixel rectangles (`src/sprites.js`, `src/level.js`). The pixel font, the music
("Golden Mile Stomp" and the boss theme) and every sound effect are generated in code with the Web Audio API
(`src/font.js`, `src/audio.js`). No sprites, sounds, music, logos or level art from any existing game are used,
downloaded or referenced. The enemy names, moves and venue names are made up.
