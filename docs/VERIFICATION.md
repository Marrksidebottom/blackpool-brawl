# Browser verification

Run on 25 Sept 2026 against the production build (`npm run build`, then `vite preview`) in headless Chrome, driven by
[`proof/verify.mjs`](proof/verify.mjs) (Puppeteer). It sends real keyboard and touch events. To skip ahead it uses the
`BB.warp()` test hook and sets up a few states directly (e.g. drops a round of pints, softens up the boss).

To re-run: `npm run build && npx vite preview`, then in another shell
`npm i --no-save puppeteer && node docs/proof/verify.mjs http://localhost:4173/`.
If you pass it the deployed URL instead, it runs the same checks against the live site.

## Result log

```
selected on title: Blackpool Brawl - A World Heat Night Out
mode after start: play player: MARK
crew positions: JONATHAN@159 PHIL@193 SPENCER@145 JORDAN@240 AARON@241 MARCUS@132 MARK@235 cam 85.2
hit landed on STAG LAD GAZ
after first fight: KOs 3 score 390 event none
after the round: {"hp":100,"drunk":0.675,"pints":3}
chippy event: {"ev":"chippy","guy":"SPENCER","inside":true}
chippy dragged out: true
bench event: {"ev":"bench","sleeper":"JONATHAN","state":"sleep"}
sleeper woken: true
boss event: {"ev":"boss","boss":"BIG DEZ - HEAD BOUNCER","hp":300}
victory: true cheering: 7
mode: end
restart -> mode: title
lose mode: end
mobile mode after tapping PUNCH: play
mobile player x after stick right (start 120): 229
ERRORS: none
```

## Screenshots

| Step | Screenshot |
|------|------------|
| Title screen with keys shown, all seven lads to pick from. Mark's head here is a test PNG served at `/faces/mark.png`, which shows a dropped-in photo replaces the cartoon head with no code change | [01-title](proof/01-title.png) |
| Character pick (Mark selected) | [02-pick-mark](proof/02-pick-mark.png) |
| Walking down the prom with the six AI mates keeping up | [03-walking](proof/03-walking.png) |
| Hitting a stag-do lad (enemy health bar in the HUD) | [04-hitting-enemy](proof/04-hitting-enemy.png) |
| After a round of pints: BEVVY meter at TIPSY, screen tilted and doubled (drunk wobble) | [05-drunk-wobble](proof/05-drunk-wobble.png) |
| Gag: Spencer wanders into the chippy | [06-chippy-gag](proof/06-chippy-gag.png) |
| ...and gets dragged out | [07-chippy-out](proof/07-chippy-out.png) |
| Gag: Jonathan asleep on the bench | [08-bench-kip](proof/08-bench-kip.png) |
| Boss: Big Dez, head bouncer, outside the club | [09-boss](proof/09-boss.png) |
| Boss down, all seven lads cheering | [10-boss-down-cheer](proof/10-boss-down-cheer.png) |
| End screen: "You got in the club!" | [11-end-win](proof/11-end-win.png) |
| End screen: "Night Over" | [12-end-night-over](proof/12-end-night-over.png) |
| iPhone portrait (390x844, touch): title screen | [13-iphone-title](proof/13-iphone-title.png) |
| iPhone: playing with the on-screen stick and buttons | [14-iphone-play](proof/14-iphone-play.png) |

## Originality check

Nothing is loaded from outside the repo. The only runtime fetches are the built JS/CSS, `favicon.svg` (hand-written
SVG rects) and the optional `faces/<name>.png`. All art is `fillRect` calls in `src/sprites.js` and `src/level.js`, the
font is the 3x5 glyph table in `src/font.js`, and every sound and both tunes are Web Audio oscillators and noise in
`src/audio.js`. `public/` only holds `favicon.svg` and `faces/README.txt`.
