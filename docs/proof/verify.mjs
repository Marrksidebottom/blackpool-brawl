import puppeteer from 'puppeteer';
import fs from 'node:fs';

const URL = process.argv[2] || 'http://localhost:4173/';
const OUT = new globalThis.URL('./shots/', import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1');
fs.mkdirSync(OUT, { recursive: true });
const shot = (page, name) => page.screenshot({ path: OUT + name + '.png' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
const log = (...a) => console.log(...a);

const browser = await puppeteer.launch({ headless: 'shell', args: ['--autoplay-policy=no-user-gesture-required'] });

// make a fake "photo" (served via a fake faces/built/faces.json) so we can prove a photo is picked up with no code change
const maker = await browser.newPage();
const pngB64 = await maker.evaluate(() => {
  const c = document.createElement('canvas');
  c.width = 120; c.height = 140;
  const g = c.getContext('2d');
  g.fillStyle = '#88c'; g.fillRect(0, 0, 120, 140);
  g.fillStyle = '#e8b890'; g.beginPath(); g.ellipse(60, 70, 40, 52, 0, 0, 7); g.fill();
  g.fillStyle = '#222'; g.fillRect(30, 18, 60, 22);
  g.fillStyle = '#000'; g.fillRect(40, 62, 12, 8); g.fillRect(68, 62, 12, 8);
  g.fillStyle = '#a33'; g.fillRect(48, 96, 24, 6);
  return c.toDataURL('image/png').split(',')[1];
});
await maker.close();

async function open(opts = {}) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && !/faces\/|404/.test(m.text()) && errors.push('console: ' + m.text()));
  if (opts.mobile) {
    await page.emulate({
      viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
  } else await page.setViewport({ width: 1200, height: 675 });
  if (opts.fakeFace) {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.url().endsWith('/faces/built/faces.json')) req.respond({ status: 200, contentType: 'application/json', body: '{"mark":"mark-test.png"}' });
      else if (req.url().endsWith('/faces/built/mark-test.png')) req.respond({ status: 200, contentType: 'image/png', body: Buffer.from(pngB64, 'base64') });
      else req.continue();
    });
  }
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(600);
  return page;
}
const hold = async (page, key, ms) => {
  await page.keyboard.down(key);
  await sleep(ms);
  await page.keyboard.up(key);
};
const tap = async (page, key, n = 1, gap = 90) => {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press(key);
    await sleep(gap);
  }
};
const G = (page, fn, arg) => page.evaluate(fn, arg);

// ---------------------------------------------------------------- main run
const page = await open({ fakeFace: true });
await shot(page, '01-title');
await tap(page, 'ArrowRight', 3); // pick someone else first...
await tap(page, 'ArrowLeft', 3); // ...then back to Jonathan
await tap(page, 'ArrowLeft', 1); // wraps to Mark
await sleep(300);
await shot(page, '02-pick-mark');
log('selected on title:', await G(page, () => document.title));
await tap(page, 'Enter');
await sleep(500);
log('mode after start:', await G(page, () => BB.mode), 'player:', await G(page, () => BB.game.player.name));
await hold(page, 'ArrowRight', 1600);
await shot(page, '03-walking');
const lads = await G(page, () => BB.game.lads.map((l) => `${l.name}@${Math.round(l.x)}`).join(' '));
log('crew positions:', lads, 'cam', await G(page, () => BB.game.camX));

// walk into the first wave and fight
await hold(page, 'ArrowRight', 1500);
let hitShot = false;
for (let i = 0; i < 60; i++) {
  const s = await G(page, () => {
    const g = BB.game, p = g.player;
    const foes = g.enemies.filter((e) => e.hp > 0);
    if (!foes.length) return { n: 0 };
    foes.sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
    const f = foes[0];
    return { n: foes.length, dx: f.x - p.x, dy: f.y - p.y, ev: g.ev?.type };
  });
  if (!s.n) {
    if (i > 5) break;
    await hold(page, 'ArrowRight', 300);
    continue;
  }
  // line up with the nearest baddie then swing
  if (Math.abs(s.dy) > 4) await hold(page, s.dy > 0 ? 'ArrowDown' : 'ArrowUp', Math.min(400, Math.abs(s.dy) * 20));
  if (Math.abs(s.dx) > 26) await hold(page, s.dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.min(400, (Math.abs(s.dx) - 18) * 13));
  else {
    if (s.dx < 0) await tap(page, 'ArrowLeft', 1, 20);
    else await tap(page, 'ArrowRight', 1, 20);
    await tap(page, 'KeyJ', 1, 60);
    if (!hitShot) {
      const foeHud = await G(page, () => BB.game.foe?.e?.name);
      if (foeHud) {
        await shot(page, '04-hitting-enemy');
        hitShot = true;
        log('hit landed on', foeHud);
      }
    }
    await tap(page, 'KeyJ', 2, 150);
    await tap(page, 'KeyK', 1, 300);
  }
}
log('after first fight: KOs', await G(page, () => BB.game.kos), 'score', await G(page, () => BB.game.score), 'event', await G(page, () => BB.game.ev?.type || 'none'));

// pints: take a knock, then drink a round
await G(page, () => {
  const g = BB.game, p = g.player;
  p.hp = 40;
  for (let i = 0; i < 5; i++) g.addItem('pint', p.x + 14 + i * 16, p.y);
});
await hold(page, 'ArrowRight', 2600);
const drink = await G(page, () => ({ hp: BB.game.player.hp, drunk: BB.game.player.drunk, pints: BB.game.pintsSunk }));
log('after the round:', JSON.stringify(drink));
await hold(page, 'ArrowRight', 400);
await shot(page, '05-drunk-wobble');

// comedy gag: chippy
await G(page, () => BB.warp(1560));
await sleep(200);
await hold(page, 'ArrowRight', 400);
await sleep(3500);
log('chippy event:', await G(page, () => ({ ev: BB.game.ev?.type, guy: BB.game.ev?.guy?.name, inside: BB.game.ev?.inside })).then(JSON.stringify));
await shot(page, '06-chippy-gag');
// walk to the door and punch
await G(page, () => { const p = BB.game.player; p.x = 1600; p.y = 152; p.face = 1; });
await tap(page, 'KeyJ');
await sleep(400);
log('chippy dragged out:', await G(page, () => BB.game.events[2].out));
await shot(page, '07-chippy-out');

// comedy gag: bench
await G(page, () => BB.warp(2270));
await sleep(200);
await hold(page, 'ArrowRight', 800);
await sleep(4500);
const bench = await G(page, () => ({ ev: BB.game.ev?.type, sleeper: BB.game.ev?.sleeper?.name, state: BB.game.ev?.sleeper?.state }));
log('bench event:', JSON.stringify(bench));
await shot(page, '08-bench-kip');
await G(page, () => { const p = BB.game.player; const s = BB.game.ev.sleeper; p.x = s.x - 14; p.y = s.y + 3; p.face = 1; p.state = 'idle'; });
await tap(page, 'KeyJ');
await sleep(300);
log('sleeper woken:', await G(page, () => BB.game.events[4].awake));

// boss
await G(page, () => BB.warp(3720));
await sleep(200);
await hold(page, 'ArrowRight', 900);
await sleep(2500);
log('boss event:', await G(page, () => ({ ev: BB.game.ev?.type, boss: BB.game.ev?.boss?.name, hp: BB.game.ev?.boss?.hp })).then(JSON.stringify));
await shot(page, '09-boss');
// soften him up, then finish him with a special
await G(page, () => { const b = BB.game.ev.boss; b.hp = 5; const p = BB.game.player; p.hp = 100; p.x = b.x - 22; p.y = b.y; p.face = 1; b.inv = 0; b.state = 'idle'; b.st = 0; });
await tap(page, 'KeyL');
await sleep(1500);
for (let i = 0; i < 20 && !(await G(page, () => !!BB.game.victory)); i++) {
  await G(page, () => { const b = BB.game.ev?.boss; const p = BB.game.player; if (b && b.hp > 0) { p.x = b.x - 20; p.y = b.y; p.face = 1; } });
  await tap(page, 'KeyJ', 3, 150);
  await sleep(300);
}
await sleep(1500);
log('victory:', await G(page, () => !!BB.game.victory), 'cheering:', await G(page, () => BB.game.lads.filter((l) => l.state === 'cheer').length));
await shot(page, '10-boss-down-cheer');
await sleep(9000);
log('mode:', await G(page, () => BB.mode));
await shot(page, '11-end-win');
await sleep(1500);
await tap(page, 'Enter');
await sleep(400);
log('restart -> mode:', await G(page, () => BB.mode));
await page.close();

// ---------------------------------------------------------------- night over path
const p2 = await open();
await tap(p2, 'Enter');
await sleep(300);
await G(p2, () => { const g = BB.game; g.lives = 1; g.player.hp = 0; g.knockDown(g.player, -1, 80); });
await sleep(6000);
log('lose mode:', await G(p2, () => BB.mode));
await shot(p2, '12-end-night-over');
await p2.close();

// ---------------------------------------------------------------- iPhone portrait with touch controls
const m = await open({ mobile: true });
await shot(m, '13-iphone-title');
const tapAt = async (sel) => {
  const b = await m.$(sel);
  const box = await b.boundingBox();
  await m.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
};
await tapAt('[data-action="punch"]');
await sleep(500);
log('mobile mode after tapping PUNCH:', await G(m, () => BB.mode));
// drive the touch stick right
const pad = await (await m.$('#dpad')).boundingBox();
const cx = pad.x + pad.width / 2, cy = pad.y + pad.height / 2;
const cdp = await m.createCDPSession();
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + 50, y: cy }] });
await sleep(1500);
const mx = await G(m, () => BB.game.player.x);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
log('mobile player x after stick right (start 120):', Math.round(mx));
await shot(m, '14-iphone-play');
await m.close();

await browser.close();
log('ERRORS:', errors.length ? errors.join('\n') : 'none');

