# Blackpool Brawl

A daft 90s-arcade-style side-scrolling beat 'em up: the World Heat lads' night out down the Golden Mile.
Pick one of the seven lads. The other six come along as AI mates who fight, drink and wander about.
Walk right past the Tower, the arcades, the rock shop and the chippy, drink pints, deal with stag dos,
hen parties, bouncers and chip-thieving seagulls, then get past Big Dez, the head bouncer, to get into the club.

## Face photos (no code change needed)

Put a photo at `public/faces/<firstname>.png` and it becomes that lad's pixelated head:
`jonathan.png`, `phil.png`, `spencer.png`, `jordan.png`, `aaron.png`, `marcus.png`, `mark.png` (lower case, PNG, head-and-shoulders crop), then push to redeploy.

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

For testing from the browser console: `BB.start(6)` starts as Mark, `BB.warp(3700)` jumps to the boss.

## Originality

All art is drawn in code as blocky pixel rectangles (`src/sprites.js`, `src/level.js`). The pixel font, the music
("Golden Mile Stomp" and the boss theme) and every sound effect are generated in code with the Web Audio API
(`src/font.js`, `src/audio.js`). No sprites, sounds, music, logos or level art from any existing game are used,
downloaded or referenced. The enemy names, moves and venue names are made up.
