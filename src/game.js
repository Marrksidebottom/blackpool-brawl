// The night out itself: fighters, AI mates, baddies, pints, scripted gags and the HUD.
import { CREW } from './crew.js';
import { drawHuman, drawGull, drawPint, drawChips, drawShadow, HEAD_H } from './sprites.js';
import { drawText, textWidth } from './font.js';
import { sfx, startMusic, jingle } from './audio.js';
import {
  VIEW_W, VIEW_H, LEVEL_W, Y_MIN, Y_MAX, CHIPPY_DOOR_X, CLUB_DOOR_X, BENCH_X,
  drawBackground, drawIlluminations, updateLevel,
} from './level.js';
import { isDown, wasPressed } from './input.js';

const GRAV = 700;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ----------------------------------------------------------------- moves
const ATTACKS = {
  jab1: { dur: 0.22, a0: 0.05, a1: 0.12, range: 20, dmg: 6, kb: 30, pose: 'punch' },
  jab2: { dur: 0.22, a0: 0.05, a1: 0.12, range: 20, dmg: 7, kb: 30, pose: 'punch' },
  upper: { dur: 0.38, a0: 0.08, a1: 0.18, range: 20, dmg: 12, kb: 110, kd: true, pose: 'upper', heavy: true },
  kick: { dur: 0.4, a0: 0.12, a1: 0.24, range: 27, dmg: 11, kb: 90, pose: 'kick', heavy: true },
  jumpkick: { range: 24, dmg: 13, kb: 110, kd: true, depth: 10, zr: 44, heavy: true },
  knee: { dmg: 7, kb: 0 },
  // specials
  spin: { range: 28, dmg: 16, kb: 130, kd: true, around: true, depth: 12, zr: 40, heavy: true },
  dash: { range: 22, dmg: 16, kb: 150, kd: true, depth: 11, heavy: true },
  slam: { range: 42, dmg: 16, kb: 120, kd: true, around: true, depth: 16, zr: 24, heavy: true },
  // the opposition
  e_punch: { dur: 0.5, a0: 0.28, a1: 0.35, range: 20, dmg: 5, kb: 40, pose: 'punch' },
  e_bag: { dur: 0.6, a0: 0.32, a1: 0.42, range: 26, dmg: 6, kb: 60, pose: 'bag' },
  e_heavy: { dur: 0.75, a0: 0.42, a1: 0.52, range: 24, dmg: 11, kb: 120, kd: true, pose: 'punch', heavy: true },
  boss_punch: { dur: 0.65, a0: 0.34, a1: 0.44, range: 30, dmg: 12, kb: 150, kd: true, pose: 'punch', heavy: true },
  charge: { range: 16, dmg: 14, kb: 170, kd: true, around: true, depth: 10, zr: 30, heavy: true },
  thrown: { range: 10, dmg: 10, kb: 120, kd: true, around: true, depth: 10, zr: 40, heavy: true },
};
const SPECIAL_DUR = { spin: 0.6, dash: 0.45, slam: 0.7 };

const KINDS = {
  stag: { hp: 32, speed: 42, range: 20, atk: 'e_punch', cd: 1.5, score: 100 },
  hen: { hp: 26, speed: 48, range: 26, atk: 'e_bag', cd: 1.4, score: 120 },
  bride: { hp: 45, speed: 44, range: 26, atk: 'e_bag', cd: 1.1, score: 300 },
  bouncer: { hp: 70, speed: 30, range: 24, atk: 'e_heavy', cd: 2.1, score: 250 },
  gull: { hp: 6, speed: 80, score: 150 },
  boss: { hp: 300, speed: 40, range: 30, atk: 'boss_punch', cd: 1.3, score: 5000 },
};

const SKINS = ['#f2c79a', '#e0ac7e', '#c68642', '#8d5524', '#f5d0b0'];
const HAIRS = ['#2b1d14', '#4a2f1b', '#e0b64a', '#1c1c1c', '#a0522d'];
const STAG_NAMES = ['DAZ', 'KEV', 'GAZ', 'BAZ', 'WAYNO', 'STU', 'DEANO', 'MACCA', 'TEL'];
const HEN_NAMES = ['SHAZ', 'TRACE', 'KAZ', 'BEV', 'CHANTELLE', 'JAN', 'DEBS'];

const DRINK_QUIPS = ['CHEERS!', 'GET IT DOWN YA!', 'LOVELY STUFF!', 'ONE MORE!', 'BOTTOMS UP!', "THAT'S THE STUFF!"];
const HURT_QUIPS = ['OW!', 'OI!', 'ME PINT!', 'WATCH IT!', 'NOT THE FACE!'];
const CHEERS = ['GET IN!!', 'YESSSS!', 'OGGY OGGY OGGY!', 'CHAMPIONS!', "WE'RE IN!", 'HAVE THAT!', 'SCENES!'];
const HIT_WORDS = ['BIFF!', 'WALLOP!', 'THWACK!', 'CLONK!', 'KERPOW!', 'OOF!', 'SPLAT!'];
const SLOTS = [
  { dx: -34, dy: -16 }, { dx: -52, dy: 14 }, { dx: -20, dy: 24 }, { dx: -74, dy: -4 },
  { dx: 26, dy: -20 }, { dx: 34, dy: 18 }, { dx: -92, dy: 20 },
];

function lookFor(kind) {
  switch (kind) {
    case 'stag':
      return {
        shirt: '#f8f9fa', print: '#f06595', trousers: '#3b5b8c', skin: pick(SKINS), hair: pick(HAIRS),
        hairStyle: pick(['short', 'buzz', 'spiky', 'bald']), beard: pick([null, null, 'stubble']),
        h: rand(0.95, 1.08), w: rand(0.95, 1.12),
      };
    case 'hen':
      return {
        shirt: pick(['#e64980', '#d6336c', '#ae3ec9', '#f06595']), dress: true, sash: '#ffffff', skin: pick(SKINS),
        hair: pick(['#f8e08e', '#e0b64a', '#2b1d14', '#a0522d']), hairStyle: 'long', h: rand(0.88, 0.98), w: 0.9,
      };
    case 'bride':
      return { shirt: '#f8f9fa', dress: true, sash: '#f06595', veil: true, skin: '#f2c79a', hair: '#f8e08e', hairStyle: 'bun', h: 0.95, w: 0.95 };
    case 'bouncer':
      return { shirt: '#1b1b1b', collar: '#ffffff', trousers: '#111', skin: pick(SKINS), hair: '#111', hairStyle: 'bald', shades: true, h: 1.12, w: 1.35 };
    case 'boss':
      return { shirt: '#101010', collar: '#ffffff', chain: true, trousers: '#0b0b0b', skin: '#e0ac7e', hair: '#222', hairStyle: 'bald', shades: true, beard: 'goatee', h: 1.38, w: 1.7 };
  }
  return null;
}

function stageName(d) {
  if (d < 0.15) return 'SOBER';
  if (d < 0.4) return 'MERRY';
  if (d < 0.7) return 'TIPSY';
  if (d < 1.0) return 'WAVY';
  if (d < 1.3) return "STEAMIN'";
  return 'MORTAL';
}

let nextId = 1;
function fighter(o) {
  return Object.assign(
    {
      id: nextId++, x: 0, y: 180, z: 0, vx: 0, vy: 0, vz: 0, face: 1, hp: 100, maxHp: 100,
      state: 'idle', st: 0, atk: null, combo: 0, lastAtk: -9, walk: 0, inv: 0, drunk: 0, flash: 0,
      say: null, item: null, itemT: 0, hw: 7, dmgMul: 1, atkCd: 0,
    },
    o,
  );
}

// ================================================================= the game
export class Game {
  constructor(lvl, playerIdx, onEnd) {
    this.lvl = lvl;
    this.onEnd = onEnd;
    lvl.tram = null;
    lvl.tramTimer = 2;
    this.t = 0;
    this.camX = 0;
    this.lockX = null;
    this.shake = 0;
    this.hitstop = 0;
    this.timeScale = 1;
    this.slowmo = 0;
    this.score = 0;
    this.kos = 0;
    this.pintsSunk = 0;
    this.lives = 3;
    this.enemies = [];
    this.items = [];
    this.fx = [];
    this.popups = [];
    this.banner = null;
    this.announce = null;
    this.foe = null;
    this.goT = 0;
    this.over = null;
    this.overT = 0;
    this.quipT = 6;
    this.evIdx = 0;
    this.ev = null;
    this.victory = null;

    this.lads = CREW.map((c, i) => {
      const isPlayer = i === playerIdx;
      const slot = SLOTS[(i - playerIdx + CREW.length) % CREW.length];
      return fighter({
        type: 'lad', crew: c, look: c, name: c.name.toUpperCase(), isPlayer,
        x: 120 + (isPlayer ? 0 : slot.dx), y: clamp(182 + (isPlayer ? 0 : slot.dy), Y_MIN, Y_MAX),
        slot, seed: rand(0, 10), think: 0, specialCd: rand(6, 14), dmgMul: isPlayer ? 1 : 0.55,
        hw: Math.round(6 * c.w),
      });
    });
    this.player = this.lads[playerIdx];

    // pints dotted along the Golden Mile (a few "rounds" so everyone gets one)
    const pints = [
      [250, 170], [262, 186], [700, 196], [1150, 165], [1165, 180], [1700, 190], [2050, 170], [2064, 190],
      [2460, 200], [2890, 160], [2905, 172], [2920, 184], [3300, 196], [3560, 168], [3575, 184],
    ];
    pints.forEach(([x, y]) => this.addItem('pint', x, y, 99));
    this.addItem('chips', 3000, 200, 99);

    this.events = [
      { type: 'wave', lock: 200, spawns: ['stag', 'stag', 'stag'], max: 3, intro: 'STAG DO INCOMING!' },
      { type: 'wave', lock: 760, spawns: ['stag', 'gull', 'stag', 'stag', 'gull', 'stag'], max: 4, intro: 'MIND THE SEAGULLS!' },
      { type: 'chippy', lock: 1430 },
      { type: 'wave', lock: 1760, spawns: ['hen', 'hen', 'bride', 'hen', 'stag'], max: 4, intro: 'HEN PARTY!' },
      { type: 'bench', lock: 2150 },
      { type: 'wave', lock: 2560, spawns: ['bouncer', 'stag', 'gull', 'stag', 'gull', 'bouncer'], max: 4, intro: 'BOUNCERS ON THE PROWL' },
      { type: 'wave', lock: 3120, spawns: ['hen', 'stag', 'bouncer', 'hen', 'gull', 'stag', 'bride'], max: 4 },
      { type: 'boss', lock: 3600 },
    ];
    startMusic('prom');
    this.setBanner('THE GOLDEN MILE, 9PM', 'WALK RIGHT. DRINK PINTS. GET IN THE CLUB.', 3.5);
  }

  // ------------------------------------------------------------- helpers
  addItem(kind, x, y, age = 0) {
    this.items.push({ kind, x, y: clamp(y, Y_MIN + 2, Y_MAX), age, bob: rand(0, 6) });
  }
  setBanner(text, sub = '', t = 3, color = '#ffd43b') {
    this.banner = { text, sub, t, color };
  }
  say(e, text, t = 2.2) {
    e.say = { text, t };
  }
  popup(x, y, text, color = '#fff', scale = 1) {
    this.popups.push({ x, y, text, color, scale, t: 0.9 });
  }
  addFx(kind, x, y, z, n = 1, opts = {}) {
    for (let i = 0; i < n; i++) {
      this.fx.push({
        kind, x, y, z, vx: rand(-40, 40) * (opts.spread ?? 1), vz: rand(20, 90) * (opts.up ?? 1), t: 0,
        life: opts.life ?? rand(0.3, 0.6), color: opts.color ?? '#fff',
      });
    }
  }
  targetable(e) {
    return e && !e.gone && e.hp > 0 && !['hidden', 'sleep', 'dead', 'ko'].includes(e.state);
  }
  canBeHit(e) {
    if (!e || e.gone || e.inv > 0) return false;
    if (['down', 'dead', 'hidden', 'sleep', 'getup', 'cheer', 'ko', 'special', 'flee'].includes(e.state)) return false;
    return true;
  }
  aliveEnemies() {
    return this.enemies.filter((e) => !e.gone && e.hp > 0 && e.state !== 'flee');
  }
  setState(e, s) {
    e.state = s;
    e.st = 0;
  }

  // ------------------------------------------------------------- combat
  startAttack(e, key) {
    this.setState(e, 'attack');
    e.atk = { def: ATTACKS[key], key, hit: new Set() };
    e.vx = 0;
    e.vy = 0;
    e.queued = null;
    if (e.type === 'lad') sfx.whoosh();
  }

  onPunch(e) {
    if (this.t - e.lastAtk < 0.4 && e.combo < 2) e.combo++;
    else e.combo = 0;
    this.startAttack(e, ['jab1', 'jab2', 'upper'][e.combo]);
  }

  startSpecial(e) {
    if (e.isPlayer) {
      if (e.hp > 14) e.hp -= 6;
    }
    this.setState(e, 'special');
    e.special = e.crew.move.type;
    e.atk = { def: ATTACKS[e.special], hit: new Set() };
    e.slammed = false;
    e.vy = 0;
    if (e.special === 'slam') e.vz = 190;
    e.inv = 0.1;
    sfx.special();
    this.announce = { text: `${e.name}: ${e.crew.move.name}!`, color: e.crew.shirt, t: 1.8 };
  }

  resolveAttack(att, def) {
    const targets = att.type === 'lad' ? this.enemies : this.lads;
    for (const tgt of targets) {
      if (att.atk.hit.has(tgt.id) || !this.canBeHit(tgt)) continue;
      const reach = def.range + tgt.hw;
      const dxRaw = tgt.x - att.x;
      let ok = def.around ? Math.abs(dxRaw) < reach : dxRaw * att.face > -4 && dxRaw * att.face < reach;
      ok = ok && Math.abs(tgt.y - att.y) < (def.depth || 9);
      const zd = tgt.z - att.z;
      ok = ok && zd > -12 && zd < (def.zr || 30);
      if (!ok) continue;
      att.atk.hit.add(tgt.id);
      this.hit(att, tgt, def);
    }
    // the bench sleeper wakes up for a thump
    if (att.isPlayer && this.ev && this.ev.type === 'bench' && this.ev.sleeper?.state === 'sleep') {
      const s = this.ev.sleeper;
      if (Math.abs(s.x - (att.x + att.face * 10)) < 22 && Math.abs(s.y - att.y) < 14) this.wakeSleeper();
    }
  }

  hit(att, tgt, def, dirOverride) {
    const dir = dirOverride || Math.sign(tgt.x - att.x) || att.face;
    let dmg = def.dmg * (att.dmgMul || 1) * (1 + (att.drunk || 0) * 0.25);
    tgt.hp -= dmg;
    tgt.flash = 0.1;
    this.addFx('spark', tgt.x - dir * 3, tgt.y, tgt.z + (tgt.kind === 'gull' ? 2 : 22), 1, { life: 0.14 });
    this.hitstop = def.heavy ? 0.07 : 0.035;
    if (def.heavy) {
      sfx.kick();
      this.shake = Math.max(this.shake, 3);
      if (Math.random() < 0.5) this.popup(tgt.x, tgt.y - 40 - tgt.z, pick(HIT_WORDS), pick(['#ffd43b', '#ff6b6b', '#69db7c', '#4dabf7']));
    } else sfx.punch();

    if (att.type === 'lad') {
      this.score += att.isPlayer ? 10 : 5;
      if (att.isPlayer || !this.foe || this.foe.t < 1) this.foe = { e: tgt, t: 3 };
      if (tgt.hp <= 0 && !tgt.koCounted) this.enemyKO(tgt);
    } else {
      if (tgt.isPlayer) sfx.hurt();
      else if (Math.random() < 0.3) this.say(tgt, pick(HURT_QUIPS), 1.2);
      if (tgt.isPlayer && tgt.drunk > 0.2) tgt.drunk = Math.max(0, tgt.drunk - 0.04);
    }

    if (tgt.grabbing) this.release(tgt);
    if (tgt.state === 'grabbed' && tgt.hp > 0 && !def.kd) return; // knees keep them held

    if (tgt.kind === 'boss' && tgt.hp <= 0 && !this.slowmo) {
      this.slowmo = 1.2;
      this.shake = 8;
    }
    if (tgt.kind === 'boss' && tgt.hp > 0) {
      if (tgt.state === 'charge') return; // unstoppable
      if (def.kd && --tgt.poise <= 0) {
        tgt.poise = 4;
        this.knockDown(tgt, dir, def.kb);
      } else if (def.kd || Math.random() < 0.25) {
        this.setState(tgt, 'hurt');
        tgt.hurtT = 0.15;
        tgt.atk = null;
      }
      return;
    }
    if (tgt.hp <= 0 || def.kd || tgt.kind === 'gull') {
      this.knockDown(tgt, dir, def.kb || 100);
    } else {
      this.setState(tgt, 'hurt');
      tgt.hurtT = 0.28;
      tgt.vx = dir * (def.kb || 40);
      tgt.atk = null;
      tgt.combo = 0;
    }
  }

  enemyKO(e) {
    e.koCounted = true;
    this.kos++;
    this.score += KINDS[e.kind].score;
    sfx.ko();
    this.popup(e.x, e.y - 50, `+${KINDS[e.kind].score}`, '#69db7c');
    if (e.kind !== 'boss' && e.kind !== 'gull') {
      const r = Math.random();
      if (r < 0.22) this.addItem('pint', e.x, e.y);
      else if (r < 0.3) this.addItem('chips', e.x, e.y);
    }
    if (e.kind === 'gull') this.addFx('feather', e.x, e.y, e.z, 8, { color: '#f8f9fa', life: 1, up: 0.5 });
  }

  knockDown(e, dir, kb) {
    if (e.grabbing) this.release(e);
    if (e.grabbedBy) {
      e.grabbedBy.grabbing = null;
      this.setState(e.grabbedBy, 'idle');
      e.grabbedBy = null;
    }
    this.setState(e, 'down');
    e.downPhase = 'air';
    e.vx = dir * Math.max(60, kb);
    e.vy = 0;
    e.vz = e.kind === 'gull' ? 0 : 150;
    e.z = Math.max(e.z, 1);
    e.atk = null;
    e.combo = 0;
  }

  startGrab(e, v) {
    this.setState(e, 'grab');
    e.grabbing = v;
    e.knees = 0;
    e.kneeT = 0;
    e.grabT = 0;
    this.setState(v, 'grabbed');
    v.grabbedBy = e;
    v.vx = v.vy = 0;
    v.atk = null;
  }
  release(e) {
    const v = e.grabbing;
    e.grabbing = null;
    if (v && v.state === 'grabbed') {
      this.setState(v, 'idle');
      v.grabbedBy = null;
    }
    if (e.state === 'grab') this.setState(e, 'idle');
  }
  throwVictim(e) {
    const v = e.grabbing;
    e.grabbing = null;
    if (!v) return;
    v.grabbedBy = null;
    v.hp -= 14 * (1 + e.drunk * 0.25);
    v.x = e.x - e.face * 6;
    this.knockDown(v, -e.face, 170);
    v.vz = 210;
    v.thrown = true;
    v.thrownBy = e;
    v.atk = { hit: new Set([v.id]) };
    this.setState(e, 'throwing');
    sfx.whoosh();
    this.score += 30;
    this.foe = { e: v, t: 3 };
    if (v.hp <= 0 && !v.koCounted) this.enemyKO(v);
  }

  // ------------------------------------------------------------- update
  update(dt) {
    if (this.slowmo > 0) {
      this.slowmo -= dt;
      dt *= 0.3;
    }
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.updateFx(dt * 0.2);
      this.frozen = true; // tells the loop to keep button presses for the next real step
      return;
    }
    this.frozen = false;
    this.t += dt;
    updateLevel(this.lvl, dt, this.camX, () => sfx.tramBell());

    const p = this.player;
    if (!this.victory && !this.over) this.controlPlayer(p, dt);
    for (const m of this.lads) if (!m.isPlayer) this.mateThink(m, dt);
    for (const e of this.enemies) this.enemyThink(e, dt);
    for (const f of [...this.lads, ...this.enemies]) this.updateFighter(f, dt);
    this.enemies = this.enemies.filter((e) => !e.gone);
    this.updateItems(dt);
    this.updateEvents(dt);
    this.updateCamera(dt);
    this.updateFx(dt);
    if (this.victory) this.updateVictory(dt);
    if (this.over) {
      this.overT += dt;
      if (this.overT > 3 && !this.overSent) {
        this.overSent = true;
        this.onEnd(this.over, this.stats());
      }
    }
  }

  stats() {
    return { score: this.score, kos: this.kos, pints: this.pintsSunk, time: this.t, lad: this.player.name };
  }

  controlPlayer(p, dt) {
    const L = isDown('left'), R = isDown('right'), U = isDown('up'), D = isDown('down');
    const mx = (R ? 1 : 0) - (L ? 1 : 0);
    const my = (D ? 1 : 0) - (U ? 1 : 0);
    const punchP = wasPressed('punch'), kickP = wasPressed('kick');
    const special = wasPressed('special') || (punchP && isDown('kick')) || (kickP && isDown('punch'));

    if (p.state === 'idle' || p.state === 'walk') {
      if (special) return this.startSpecial(p);
      if (wasPressed('jump')) {
        this.setState(p, 'jump');
        p.vz = 225;
        p.vx = mx * 75;
        p.vy = my * 30;
        p.airAtk = false;
        sfx.jump();
        return;
      }
      if (punchP) return this.onPunch(p);
      if (kickP) return this.startAttack(p, 'kick');
      // drunken steering
      const d = p.drunk;
      let vx = mx * 72 * (1 - d * 0.12);
      let vy = my * 46;
      if (d > 0.05) {
        vy += Math.sin(this.t * 2.2) * d * 26;
        vx += Math.sin(this.t * 1.3 + 1) * d * (mx ? 16 : 9);
      }
      p.vx = vx;
      p.vy = vy;
      if (mx) p.face = mx;
      const moving = mx || my;
      if (moving) {
        if (p.state !== 'walk') this.setState(p, 'walk');
      } else if (p.state !== 'idle') this.setState(p, 'idle');
      // walk into a baddie to grab them
      let grabbed = false;
      if (mx) {
        for (const e of this.enemies) {
          if (!['stag', 'hen', 'bride', 'bouncer'].includes(e.kind)) continue;
          if (!['idle', 'walk', 'hurt'].includes(e.state) || e.z > 0 || e.hp <= 0) continue;
          const dx = e.x - p.x;
          if (Math.abs(dx) < 15 && Math.sign(dx) === mx && Math.abs(e.y - p.y) < 5) {
            p.grabT = (p.grabT || 0) + dt;
            grabbed = true;
            if (p.grabT > 0.15) {
              p.grabT = 0;
              this.startGrab(p, e);
            }
            break;
          }
        }
      }
      if (!grabbed) p.grabT = 0;
      // the odd drunken stumble
      if (d > 1.1 && Math.random() < dt * 0.05) this.stumble(p);
    } else if (p.state === 'attack') {
      if (punchP && p.st > p.atk.def.a0) p.queued = 'punch';
      if (kickP && p.st > p.atk.def.a0) p.queued = 'kick';
    } else if (p.state === 'jump') {
      if ((punchP || kickP) && !p.airAtk) {
        p.airAtk = true;
        p.atk = { def: ATTACKS.jumpkick, hit: new Set() };
        sfx.whoosh();
      }
    } else if (p.state === 'grab') {
      if (kickP || (punchP && ((mx && mx !== p.face) || p.knees >= 2))) this.throwVictim(p);
      else if (punchP && p.kneeT <= 0) {
        p.kneeT = 0.22;
        p.knees++;
        const v = p.grabbing;
        if (v) {
          p.atk = { def: ATTACKS.knee, hit: new Set() };
          this.hit(p, v, ATTACKS.knee);
          if (v.hp <= 0) p.grabbing = null;
        }
      }
    }
  }

  stumble(e) {
    this.setState(e, 'stumble');
    e.vx = e.face * 55;
    e.vy = rand(-20, 20);
    this.say(e, pick(['WHOA!', 'WOAH-OH!', 'STEADY...']), 1.2);
  }

  // ------------------------------------------------------------- mates
  mateThink(m, dt) {
    if (m.say) {
      m.say.t -= dt;
      if (m.say.t <= 0) m.say = null;
    }
    if (m.script) return this.runScript(m, dt);
    if (!['idle', 'walk'].includes(m.state) || this.victory) return;
    const P = this.player;
    m.think -= dt;
    m.atkCd -= dt;
    m.specialCd -= dt;
    if (m.think <= 0) {
      m.think = rand(0.25, 0.6);
      let best = null, bd = 120;
      for (const e of this.enemies) {
        if (!this.canBeHit(e) || e.hp <= 0) continue;
        if (e.kind === 'gull' && e.z > 30) continue;
        if (e.x < this.camX - 5 || e.x > this.camX + VIEW_W + 5) continue;
        const d = Math.abs(e.x - m.x) + Math.abs(e.y - m.y) * 1.5;
        if (d < bd) {
          bd = d;
          best = e;
        }
      }
      m.foe = best;
      // wander to a pint nobody else is drinking
      m.pint = null;
      if (!best && m.drunk < 1.2 && P.hp >= P.maxHp * 0.7) {
        for (const it of this.items) {
          if (it.kind === 'pint' && it.age > 2.5 && Math.abs(it.x - m.x) < 70 && it.x > this.camX + 10 && it.x < this.camX + VIEW_W - 10) {
            m.pint = it;
            break;
          }
        }
      }
    }
    let gx, gy, speed = 60;
    const foe = m.foe && this.canBeHit(m.foe) && m.foe.hp > 0 ? m.foe : null;
    if (foe) {
      const side = m.x < foe.x ? -1 : 1;
      gx = foe.x + side * (16 + foe.hw);
      gy = foe.y;
      m.face = foe.x > m.x ? 1 : -1;
      const inRange = Math.abs(foe.x - m.x) < 20 + foe.hw && Math.abs(foe.y - m.y) < 6 && Math.abs(foe.z - m.z) < 28;
      if (inRange && m.atkCd <= 0) {
        const near = this.enemies.filter((e) => this.canBeHit(e) && Math.abs(e.x - m.x) < 45 && Math.abs(e.y - m.y) < 16).length;
        if (near >= 2 && m.specialCd <= 0) {
          m.specialCd = rand(14, 24);
          return this.startSpecial(m);
        }
        if (m.drunk > 0.8 && Math.random() < 0.15) {
          this.say(m, pick(['MISSED!', 'WHICH ONE IS REAL?', 'HOLD STILL!']), 1.3);
          m.atkCd = 0.8;
          return this.stumble(m);
        }
        if (Math.random() < 0.25) {
          this.startAttack(m, 'kick');
          m.atkCd = rand(0.8, 1.5);
        } else {
          this.onPunch(m);
          m.atkCd = m.combo < 2 ? 0.28 : rand(0.8, 1.6);
        }
        return;
      }
      speed = 70;
    } else if (m.pint) {
      gx = m.pint.x;
      gy = m.pint.y;
    } else {
      gx = P.x + m.slot.dx + Math.sin(this.t * 0.5 + m.seed) * 10;
      gy = clamp(P.y + m.slot.dy + Math.sin(this.t * 0.37 + m.seed) * 6, Y_MIN, Y_MAX);
    }
    gx = clamp(gx, this.camX + 14, this.camX + VIEW_W - 14);
    // catch-up: never get left behind, never get lost off screen
    if (m.x < this.camX - 40) m.x = this.camX - 18;
    if (m.x > this.camX + VIEW_W + 40) m.x = this.camX + VIEW_W + 18;
    const dx = gx - m.x, dy = gy - m.y;
    if (Math.abs(dx) > 60 || m.x < this.camX + 4) speed = 115;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 3) {
      const len = Math.hypot(dx, dy * 1.4) || 1;
      m.vx = (dx / len) * speed;
      m.vy = ((dy * 1.4) / len) * speed * 0.65;
      if (m.drunk > 0.05) m.vy += Math.sin(this.t * 2 + m.seed) * m.drunk * 22;
      if (!foe && Math.abs(dx) > 2) m.face = Math.sign(dx);
      if (m.state !== 'walk') this.setState(m, 'walk');
    } else {
      m.vx = m.vy = 0;
      if (!foe) m.face = P.face;
      if (m.state !== 'idle') this.setState(m, 'idle');
    }
    if (m.drunk > 1.0 && Math.random() < dt * 0.06) this.stumble(m);
  }

  runScript(m, dt) {
    const s = m.script;
    if (s.kind === 'goto') {
      if (m.state === 'down' || m.state === 'hurt' || m.state === 'getup') return;
      const dx = s.x - m.x, dy = s.y - m.y;
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
        m.vx = m.vy = 0;
        m.script = null;
        s.then?.(m);
        return;
      }
      const len = Math.hypot(dx, dy) || 1;
      m.vx = (dx / len) * (s.speed || 80);
      m.vy = (dy / len) * (s.speed || 80);
      m.face = Math.abs(dx) > 1 ? Math.sign(dx) : m.face;
      if (m.state !== 'walk') this.setState(m, 'walk');
    }
  }

  // ------------------------------------------------------------- enemies
  pickTarget(e) {
    const opts = this.lads.filter((l) => this.targetable(l) && l.state !== 'cheer');
    if (!opts.length) return null;
    if (this.targetable(this.player) && Math.random() < (e.kind === 'boss' ? 0.75 : 0.5)) return this.player;
    opts.sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x));
    return opts[Math.floor(Math.random() * Math.min(3, opts.length))];
  }

  spawnEnemy(kind, side) {
    const K = KINDS[kind];
    const fromRight = side ? side > 0 : Math.random() < 0.72;
    const x = fromRight ? this.camX + VIEW_W + rand(12, 30) : this.camX - rand(12, 30);
    const e = fighter({
      type: 'enemy', kind, look: lookFor(kind), x, y: rand(Y_MIN + 4, Y_MAX - 4),
      hp: K.hp, maxHp: K.hp, speed: K.speed * rand(0.9, 1.1), range: K.range, face: fromRight ? -1 : 1,
      atkCd: rand(0.6, 1.4), retarget: 0, yOff: rand(-3, 3), poise: 4, pattern: 0, hw: kind === 'boss' ? 12 : kind === 'bouncer' ? 9 : 7,
    });
    if (kind === 'stag') e.name = 'STAG LAD ' + pick(STAG_NAMES);
    else if (kind === 'hen') e.name = 'HEN ' + pick(HEN_NAMES);
    else if (kind === 'bride') e.name = 'THE BRIDE-TO-BE';
    else if (kind === 'bouncer') e.name = 'BOUNCER';
    else if (kind === 'gull') {
      e.name = 'SEAGULL';
      e.z = 70;
      e.gstate = 'fly';
      e.gT = rand(1.2, 2.5);
      e.hw = 6;
      sfx.squawk();
    } else if (kind === 'boss') e.name = 'BIG DEZ - HEAD BOUNCER';
    if (kind === 'stag' && Math.random() < 0.35) this.say(e, pick(['OI OI!', 'YOU WHAT?', 'SAVE THE GROOM!', "DAZ'S STAG!"]), 1.8);
    if ((kind === 'hen' || kind === 'bride') && Math.random() < 0.5) this.say(e, pick(['HANDS OFF!', "IT'S HER DO!", 'GIRLS! GET HIM!', 'WHO WANTS SOME?']), 1.8);
    this.enemies.push(e);
    return e;
  }

  enemyThink(e, dt) {
    if (e.say) {
      e.say.t -= dt;
      if (e.say.t <= 0) e.say = null;
    }
    if (e.kind === 'gull') return this.gullThink(e, dt);
    if (e.state === 'flee') {
      e.vx = -110;
      e.face = -1;
      e.walk += dt * 12;
      if (e.x < this.camX - 40) e.gone = true;
      return;
    }
    if (!['idle', 'walk'].includes(e.state)) return;
    e.atkCd -= dt;
    e.retarget -= dt;
    if (!this.targetable(e.target) || e.retarget <= 0) {
      e.target = this.pickTarget(e);
      e.retarget = rand(2, 4);
    }
    const T = e.target;
    if (!T) {
      e.vx = e.vy = 0;
      if (e.state !== 'idle') this.setState(e, 'idle');
      return;
    }
    if (e.kind === 'boss') {
      if (e.hp < e.maxHp * 0.5 && !e.calledBackup) {
        e.calledBackup = true;
        this.say(e, 'LADS! A HAND HERE!', 2);
        this.spawnEnemy('bouncer', 1);
        this.spawnEnemy('bouncer', -1);
      }
      if (e.state === 'walk') e.chaseT = (e.chaseT || 0) + dt;
      if (e.atkCd <= 0 && (e.nextCharge || e.chaseT > 3.5)) {
        e.nextCharge = false;
        e.chaseT = 0;
        this.setState(e, 'charge');
        e.phase = 'wind';
        e.face = T.x > e.x ? 1 : -1;
        e.chargeY = T.y;
        this.say(e, pick(['OI!', 'RIGHT, THAT IS IT!', 'OUT!']), 1.2);
        sfx.bossRoar();
        return;
      }
    }
    const side = e.x < T.x ? -1 : 1;
    const want = e.range * 0.75 + T.hw;
    const gx = T.x + side * want, gy = T.y + e.yOff;
    const dx = gx - e.x, dy = gy - e.y;
    e.face = T.x > e.x ? 1 : -1;
    const inRange = Math.abs(T.x - e.x) < e.range + T.hw + 2 && Math.abs(T.y - e.y) < 6;
    if (inRange && e.atkCd <= 0 && T.z < 20) {
      this.startAttack(e, KINDS[e.kind].atk);
      e.atkCd = KINDS[e.kind].cd * rand(0.7, 1.4);
      if (e.kind === 'boss') {
        e.chaseT = 0;
        if (++e.pattern % 3 === 2) e.nextCharge = true;
      }
      return;
    }
    if (Math.abs(dx) > 3 || Math.abs(dy) > 2) {
      const sp = e.speed;
      e.vx = clamp(dx * 4, -sp, sp);
      e.vy = clamp(dy * 4, -sp * 0.7, sp * 0.7);
      if (e.state !== 'walk') this.setState(e, 'walk');
    } else {
      e.vx = e.vy = 0;
      if (e.state !== 'idle') this.setState(e, 'idle');
    }
  }

  gullThink(e, dt) {
    e.flap = (e.flap || 0) + dt * 18;
    if (e.state === 'down' || e.state === 'dead') return;
    if (e.state === 'hurt') this.setState(e, 'idle');
    if (!this.targetable(e.target)) e.target = this.pickTarget(e);
    const T = e.target;
    e.gT -= dt;
    switch (e.gstate) {
      case 'fly': {
        if (!T) break;
        const gx = T.x + Math.sin(this.t * 1.5 + e.id) * 40;
        e.vx = clamp((gx - e.x) * 2, -85, 85);
        e.vy = clamp((T.y - e.y) * 2, -40, 40);
        e.z += (60 - e.z) * Math.min(1, dt * 3);
        e.face = e.vx >= 0 ? 1 : -1;
        if (e.gT <= 0 && e.x > this.camX + 10 && e.x < this.camX + VIEW_W - 10) {
          e.gstate = 'dive';
          e.gT = 0.65;
          e.vx = (T.x - e.x) / 0.65;
          e.vy = (T.y - e.y) / 0.65;
          e.diveVz = -(e.z - 10) / 0.65;
          e.face = e.vx >= 0 ? 1 : -1;
          sfx.squawk();
        }
        break;
      }
      case 'dive':
        e.z = Math.max(8, e.z + e.diveVz * dt);
        if (e.gT <= 0) {
          if (T && this.canBeHit(T) && Math.abs(T.x - e.x) < 14 && Math.abs(T.y - e.y) < 9 && T.z < 20) {
            T.hp -= 5;
            T.flash = 0.1;
            if (T.hp <= 0) this.knockDown(T, e.face, 60);
            else {
              this.setState(T, 'hurt');
              T.hurtT = 0.3;
              T.atk = null;
            }
            T.item = null;
            this.say(T, pick(['ME CHIPS!', 'OI! THAT WAS MINE!', 'FLAMIN\' GULLS!']), 1.6);
            this.popup(e.x, e.y - 60, 'NICKED YER CHIPS!', '#ffd43b');
            sfx.steal();
            if (T.isPlayer) this.score = Math.max(0, this.score - 50);
            e.carrying = true;
            e.gstate = 'escape';
          } else {
            e.gstate = 'rise';
          }
        }
        break;
      case 'rise':
        e.vx *= 0.95;
        e.z += 70 * dt;
        if (e.z >= 55) {
          e.gstate = 'fly';
          e.gT = rand(1.5, 3);
        }
        break;
      case 'escape':
        e.vx = e.face * 130;
        e.vy = 0;
        e.z += 60 * dt;
        if (e.x < this.camX - 30 || e.x > this.camX + VIEW_W + 30) e.gone = true;
        break;
    }
  }

  // ------------------------------------------------------------- per-fighter physics & states
  updateFighter(e, dt) {
    e.st += dt;
    if (e.inv > 0) e.inv -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.itemT > 0 && (e.itemT -= dt) <= 0) e.item = null;
    if (e.type === 'lad') {
      e.drunk = Math.max(0, e.drunk - dt * 0.018);
      if (e.isPlayer && e.say) {
        e.say.t -= dt;
        if (e.say.t <= 0) e.say = null;
      }
      if (e.drunk > 0.35 && Math.random() < dt * 0.15 && !e.say && ['idle', 'walk'].includes(e.state)) {
        this.say(e, 'HIC!', 0.7);
        if (e.isPlayer) sfx.hic();
      }
    }
    if (e.kind === 'gull') return this.gullPhysics(e, dt);

    switch (e.state) {
      case 'idle':
      case 'walk':
        if (e.state === 'walk') e.walk += dt * 11;
        break;
      case 'flee':
        break;
      case 'attack': {
        const d = e.atk.def;
        if (e.st >= d.a0 && e.st <= d.a1) this.resolveAttack(e, d);
        if (e.st >= d.dur) {
          e.lastAtk = this.t;
          this.setState(e, 'idle');
          const q = e.queued;
          e.queued = null;
          if (q === 'punch') this.onPunch(e);
          else if (q === 'kick') this.startAttack(e, 'kick');
        }
        break;
      }
      case 'jump':
        if (e.airAtk) this.resolveAttack(e, ATTACKS.jumpkick);
        break;
      case 'special': {
        e.inv = 0.1;
        const def = ATTACKS[e.special];
        if (e.special === 'spin') {
          this.resolveAttack(e, def);
          e.vx = e.face * 20;
        } else if (e.special === 'dash') {
          e.vx = e.st < 0.35 ? e.face * 250 : 0;
          if (e.st < 0.38) this.resolveAttack(e, def);
        } else if (e.special === 'slam' && !e.slammed && e.st > 0.15 && e.z <= 0) {
          e.slammed = true;
          this.shake = 7;
          sfx.thud();
          this.addFx('dust', e.x, e.y, 0, 10, { spread: 3, life: 0.5, color: '#ced4da', up: 0.3 });
          this.resolveAttack(e, def);
        }
        if (e.st >= SPECIAL_DUR[e.special]) {
          e.vx = 0;
          this.setState(e, 'idle');
        }
        break;
      }
      case 'hurt':
        e.vx *= Math.max(0, 1 - 10 * dt);
        e.vy = 0;
        if (e.st > (e.hurtT || 0.28)) this.setState(e, 'idle');
        break;
      case 'stumble':
        e.vx *= Math.max(0, 1 - 3 * dt);
        if (e.st > 0.55) this.setState(e, 'idle');
        break;
      case 'down':
        if (e.downPhase === 'air') {
          if (e.thrown) this.thrownCollide(e);
          if (e.z <= 0 && e.vz <= 0 && e.st > 0.05) {
            e.downPhase = 'lie';
            e.st = 0;
            e.vx = 0;
            e.thrown = false;
            sfx.thud();
            this.addFx('dust', e.x, e.y, 0, 5, { spread: 2, life: 0.4, color: '#adb5bd', up: 0.3 });
          }
        } else {
          e.vx = 0;
          const lie = e.type === 'enemy' ? 0.8 : e.isPlayer ? 1.0 : 2.4;
          if (e.st > lie) this.afterLie(e);
        }
        break;
      case 'getup':
        e.vx = 0;
        if (e.st > 0.35) {
          this.setState(e, 'idle');
          e.inv = Math.max(e.inv, 0.6);
        }
        break;
      case 'dead':
        e.vx = 0;
        if (e.st > 1.0) e.gone = true;
        break;
      case 'grab':
        e.vx = e.vy = 0;
        if (e.kneeT > 0) e.kneeT -= dt;
        if (!e.grabbing || e.grabbing.state !== 'grabbed') {
          e.grabbing = null;
          this.setState(e, 'idle');
        } else {
          const v = e.grabbing;
          v.x = e.x + e.face * (11 + v.hw);
          v.y = e.y;
          v.face = -e.face;
          if (e.st > 2.2) this.release(e);
        }
        break;
      case 'grabbed':
        e.vx = e.vy = 0;
        if (!e.grabbedBy) this.setState(e, 'idle');
        break;
      case 'throwing':
        if (e.st > 0.3) this.setState(e, 'idle');
        break;
      case 'drink':
        e.vx = e.vy = 0;
        if (e.st > 0.8) {
          this.setState(e, 'idle');
          if (Math.random() < 0.35) {
            this.say(e, 'BUUURP!', 1.2);
            sfx.burp();
          }
        }
        break;
      case 'charge':
        this.updateCharge(e, dt);
        break;
      case 'cheer':
        if (e.z <= 0 && Math.random() < dt * 3) e.vz = rand(110, 170);
        e.vx = e.vy = 0;
        break;
      case 'sleep':
      case 'hidden':
      case 'ko':
        e.vx = e.vy = 0;
        break;
    }
    // physics
    if (!['grabbed'].includes(e.state)) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
    if (e.z > 0 || e.vz > 0) {
      e.vz -= GRAV * dt;
      e.z += e.vz * dt;
      if (e.z <= 0) {
        e.z = 0;
        e.vz = 0;
        if (e.state === 'jump') {
          this.setState(e, 'idle');
          e.airAtk = false;
          e.vx = e.vy = 0;
          sfx.land();
        }
      }
    }
    if (e.state !== 'sleep' && e.state !== 'hidden') e.y = clamp(e.y, Y_MIN, Y_MAX);
    e.x = clamp(e.x, -60, LEVEL_W + 60);
    if (e.isPlayer) e.x = clamp(e.x, this.camX + 10, this.camX + VIEW_W - 10);
    else if (e.type === 'enemy' && e.state !== 'flee' && this.lockX != null) {
      if (e.x > this.camX + 12 && e.x < this.camX + VIEW_W - 12) e.entered = true;
      if (e.entered) e.x = clamp(e.x, this.camX + 8, this.camX + VIEW_W - 8);
    }
  }

  gullPhysics(e, dt) {
    if (e.state === 'down') {
      e.vz -= GRAV * dt;
      e.z += e.vz * dt;
      e.x += e.vx * dt * 0.4;
      if (e.z <= 0) {
        e.z = 0;
        this.setState(e, 'dead');
      }
      return;
    }
    if (e.state === 'dead') {
      if (e.st > 1) e.gone = true;
      return;
    }
    e.x += e.vx * dt;
    e.y = clamp(e.y + e.vy * dt, Y_MIN, Y_MAX);
  }

  thrownCollide(v) {
    for (const o of this.enemies) {
      if (o === v || v.atk.hit.has(o.id) || !this.canBeHit(o) || o.kind === 'gull') continue;
      if (Math.abs(o.x - v.x) < 14 && Math.abs(o.y - v.y) < 10) {
        v.atk.hit.add(o.id);
        this.hit(v.thrownBy || this.player, o, ATTACKS.thrown, Math.sign(v.vx) || 1);
      }
    }
  }

  updateCharge(e, dt) {
    if (e.phase === 'wind') {
      e.vx = 0;
      e.vy = clamp((e.chargeY - e.y) * 3, -50, 50);
      e.flash = Math.floor(e.st * 10) % 2 ? 0.05 : 0;
      if (e.st > 0.75) {
        e.phase = 'run';
        e.st = 0;
        e.atk = { def: ATTACKS.charge, hit: new Set() };
        sfx.whoosh();
      }
    } else if (e.phase === 'run') {
      e.vx = e.face * 235;
      e.vy = 0;
      e.walk += dt * 20;
      this.resolveAttack(e, ATTACKS.charge);
      const edge = e.face > 0 ? e.x > this.camX + VIEW_W - 24 : e.x < this.camX + 24;
      if (edge || e.st > 1.8) {
        e.phase = 'recover';
        e.st = 0;
        e.vx = 0;
        this.shake = 4;
        this.say(e, pick(['PHEW...', 'ME KNEES...', '*PANT*']), 1);
      }
    } else {
      e.vx = 0;
      if (e.st > 1.0) {
        this.setState(e, 'idle');
        e.atkCd = 0.6;
      }
    }
  }

  afterLie(e) {
    if (e.type === 'enemy') {
      if (e.hp <= 0) {
        if (e.kind === 'boss') {
          this.setState(e, 'ko');
          this.startVictory(e);
        } else this.setState(e, 'dead');
      } else this.setState(e, 'getup');
      return;
    }
    if (e.hp > 0) return this.setState(e, 'getup');
    if (!e.isPlayer) {
      e.hp = 60;
      this.say(e, pick(["I'M ALRIGHT!", 'JUST A FLESH WOUND', 'WHO TURNED THE FLOOR OVER?']), 2);
      return this.setState(e, 'getup');
    }
    // the player is down and out
    this.lives--;
    if (this.lives > 0) {
      e.hp = e.maxHp;
      e.drunk *= 0.5;
      e.inv = 2.5;
      this.setState(e, 'getup');
      this.setBanner('GET UP, YOU LIGHTWEIGHT!', `${this.lives} ${this.lives === 1 ? 'LIFE' : 'LIVES'} LEFT`, 2.2, '#ff6b6b');
      for (const o of this.enemies) {
        if (o.kind !== 'boss' && o.kind !== 'gull' && this.canBeHit(o) && Math.abs(o.x - e.x) < 70) this.knockDown(o, Math.sign(o.x - e.x) || 1, 120);
      }
    } else {
      this.setState(e, 'ko');
      this.over = 'lose';
      this.overT = 0;
      jingle('lose');
      this.setBanner('NIGHT OVER!', 'SOMEONE CALL YOU A TAXI', 5, '#ff6b6b');
    }
  }

  // ------------------------------------------------------------- pints & chips
  updateItems(dt) {
    for (const it of this.items) it.age += dt;
    // the lads leave the pints alone when their mate (the player) is the one who needs one
    const matesMayDrink = this.player.hp >= this.player.maxHp * 0.7;
    for (const l of this.lads) {
      if (!['idle', 'walk'].includes(l.state) || l.z > 2) continue;
      if (!l.isPlayer && !matesMayDrink) continue;
      for (let i = 0; i < this.items.length; i++) {
        const it = this.items[i];
        if (!l.isPlayer && it.age < 2.5) continue;
        if (Math.abs(it.x - l.x) < 10 && Math.abs(it.y - l.y) < 7) {
          this.items.splice(i, 1);
          this.consume(l, it);
          break;
        }
      }
    }
  }

  consume(l, it) {
    this.setState(l, 'drink');
    l.vx = l.vy = 0;
    if (it.kind === 'pint') {
      l.hp = Math.min(l.maxHp, l.hp + 25);
      l.drunk = Math.min(1.6, l.drunk + 0.24);
      l.item = 'pint';
      l.itemT = 0.8;
      sfx.gulp();
      this.say(l, pick(DRINK_QUIPS), 1.4);
      this.addFx('beer', l.x + l.face * 6, l.y, 34, 4, { color: '#f5b83d', life: 0.4 });
      if (l.isPlayer) {
        this.pintsSunk++;
        this.score += 50;
        this.popup(l.x, l.y - 55, '+50 PINT!', '#ffd43b');
      }
    } else {
      l.hp = Math.min(l.maxHp, l.hp + 15);
      l.item = 'chips';
      l.itemT = 0.8;
      sfx.pickup();
      this.say(l, pick(['SCRAN!', 'SALT AND VINEGAR!', 'PROPER CHIPS!']), 1.4);
      if (l.isPlayer) this.score += 30;
    }
  }

  // ------------------------------------------------------------- level script
  updateEvents(dt) {
    if (this.goT > 0) this.goT -= dt;
    if (this.banner && (this.banner.t -= dt) <= 0) this.banner = null;
    if (this.announce && (this.announce.t -= dt) <= 0) this.announce = null;
    if (this.foe && (this.foe.t -= dt) <= 0) this.foe = null;
    // random mate banter
    this.quipT -= dt;
    if (this.quipT <= 0) {
      this.quipT = rand(8, 15);
      const m = pick(this.lads.filter((l) => !l.isPlayer && !l.say && ['idle', 'walk'].includes(l.state) && !l.script));
      if (m) this.say(m, pick(m.crew.quips), 2.4);
    }
    if (!this.ev && this.evIdx < this.events.length) {
      const next = this.events[this.evIdx];
      if (this.player.x - 150 >= next.lock) this.startEvent(next);
    }
    if (this.ev) {
      const ev = this.ev;
      ev.t += dt;
      if (ev.queue && ev.queue.length) {
        ev.spawnT -= dt;
        if (ev.spawnT <= 0 && this.aliveEnemies().length < (ev.max || 4)) {
          this.spawnEnemy(ev.queue.shift());
          ev.spawnT = rand(0.5, 1.1);
        }
      }
      const cleared = (!ev.queue || !ev.queue.length) && this.aliveEnemies().length === 0 && ev.t > 1;
      let done = false;
      if (ev.type === 'wave') done = cleared;
      else if (ev.type === 'chippy') done = cleared && ev.out;
      else if (ev.type === 'bench') done = cleared && ev.awake;
      if (ev.type === 'chippy') this.updateChippy(ev, dt);
      if (ev.type === 'bench') this.updateBench(ev, dt);
      if (done) {
        this.ev = null;
        this.evIdx++;
        this.lockX = null;
        this.goT = 3;
        sfx.go();
      }
    }
  }

  startEvent(ev) {
    this.ev = ev;
    ev.t = 0;
    ev.spawnT = 0.3;
    this.lockX = ev.lock;
    this.camX = Math.min(this.camX, ev.lock);
    const mates = this.lads.filter((l) => !l.isPlayer);
    const byPref = (order) => order.map((id) => mates.find((m) => m.crew.id === id)).find((m) => m && !m.script && m.state !== 'hidden');
    if (ev.type === 'wave') {
      ev.queue = [...ev.spawns];
      if (ev.intro) this.setBanner(ev.intro, '', 2);
    } else if (ev.type === 'chippy') {
      const m = byPref(['spencer', 'marcus', 'phil', 'aaron', 'jordan', 'jonathan', 'mark']);
      ev.guy = m;
      ev.queue = ['gull', 'gull', 'stag'];
      ev.max = 3;
      this.say(m, "HANG ON... I'M STARVIN'!", 2.5);
      m.script = {
        kind: 'goto', x: CHIPPY_DOOR_X, y: Y_MIN, speed: 85,
        then: (g) => {
          this.setState(g, 'hidden');
          sfx.shopBell();
          ev.inside = true;
          this.setBanner(`${g.name}'S IN THE CHIPPY!`, 'DRAG HIM OUT - PUNCH AT THE DOOR', 4);
        },
      };
    } else if (ev.type === 'bench') {
      const m = byPref(['jonathan', 'aaron', 'phil', 'jordan', 'marcus', 'spencer', 'mark'].filter((id) => id !== this.events[2].guy?.crew.id));
      ev.sleeper = m;
      ev.queue = ['stag', 'stag', 'gull'];
      ev.max = 3;
      ev.snoreT = 1;
      this.say(m, 'JUST RESTING ME EYES...', 2.5);
      m.script = {
        kind: 'goto', x: BENCH_X, y: Y_MIN, speed: 70,
        then: (g) => {
          this.setState(g, 'sleep');
          g.y = Y_MIN - 3;
          g.face = 1;
          this.setBanner(`${g.name}'S HAVING A KIP!`, 'WAKE HIM UP - GIVE HIM A PUNCH', 4);
        },
      };
    } else if (ev.type === 'boss') {
      ev.queue = ['stag', 'stag'];
      ev.max = 4;
      const b = this.spawnEnemy('boss', 1);
      b.x = this.camX + VIEW_W + 30;
      b.y = 180;
      ev.boss = b;
      this.say(b, 'NOT TONIGHT, LADS.', 3);
      this.setBanner('BIG DEZ - HEAD BOUNCER', "'NOT TONIGHT, LADS.'", 3.5, '#ff6b6b');
      startMusic('boss');
      sfx.bossRoar();
    }
  }

  updateChippy(ev) {
    const g = ev.guy;
    if (!ev.inside || ev.out) return;
    const p = this.player;
    const swinging = (p.state === 'attack' && p.st < 0.1) || (p.state === 'jump' && p.airAtk);
    if (swinging && Math.abs(p.x - CHIPPY_DOOR_X) < 24 && p.y < Y_MIN + 16) {
      ev.out = true;
      g.x = CHIPPY_DOOR_X;
      g.y = Y_MIN + 2;
      this.setState(g, 'idle');
      g.item = 'chips';
      g.itemT = 12;
      g.hp = g.maxHp;
      sfx.shopBell();
      this.say(g, "ALRIGHT! I'M COMIN'! WANT A CHIP?", 3);
      this.popup(CHIPPY_DOOR_X, Y_MIN - 60, 'DRAGGED OUT!', '#69db7c');
      this.score += 200;
      this.addItem('chips', CHIPPY_DOOR_X + 20, Y_MIN + 12, 99);
      this.addItem('chips', CHIPPY_DOOR_X + 36, Y_MIN + 26, 99);
    }
  }

  updateBench(ev, dt) {
    const s = ev.sleeper;
    if (s.state === 'sleep' && !ev.awake) {
      ev.snoreT -= dt;
      if (ev.snoreT <= 0) {
        ev.snoreT = 1.6;
        sfx.snore();
        this.fx.push({ kind: 'z', x: s.x + 4, y: s.y, z: 34, vx: 8, vz: 14, t: 0, life: 1.5, color: '#fff' });
      }
      // if the baddies wander into him he gets a clip round the ear, but stays asleep
    }
  }

  wakeSleeper() {
    const ev = this.ev;
    const s = ev.sleeper;
    ev.awake = true;
    this.setState(s, 'idle');
    s.vz = 200;
    s.z = 1;
    s.y = Y_MIN + 2;
    this.say(s, "I'M UP! I'M UP! WHOSE ROUND?", 3);
    this.popup(s.x, s.y - 60, 'RISE AND SHINE!', '#69db7c');
    this.score += 200;
    sfx.hic();
  }

  // ------------------------------------------------------------- the big finish
  startVictory(boss) {
    if (this.victory) return;
    this.victory = { t: 0, boss };
    this.score += 1000 * this.lives;
    for (const e of this.enemies) {
      if (e === boss || e.hp <= 0) continue;
      if (e.kind === 'gull') {
        e.gstate = 'escape';
        e.face = 1;
      } else {
        this.setState(e, 'flee');
        this.say(e, 'LEGGIT!', 1.5);
      }
    }
    for (const l of this.lads) {
      if (l.state === 'hidden' || l.state === 'sleep') {
        l.x = this.camX + rand(40, 120);
        l.y = rand(Y_MIN + 5, Y_MAX - 5);
      }
      l.script = null;
      l.grabbing = null;
      l.hp = Math.max(l.hp, 1);
      this.setState(l, 'cheer');
      l.say = { text: pick(CHEERS), t: rand(2, 3.5) };
    }
    this.setBanner('BIG DEZ IS DOWN!', "THE LADS ARE GOING IN!", 4, '#69db7c');
    sfx.cheer();
    jingle('win');
  }

  updateVictory(dt) {
    const v = this.victory;
    v.t += dt;
    if (v.t > 1.5 && v.t < 1.6) sfx.cheer();
    if (v.t > 3.6 && !v.walking) {
      v.walking = true;
      this.lads.forEach((l, i) => (l.delay = i * 0.25));
    }
    if (v.walking) {
      for (const l of this.lads) {
        if (l.state === 'hidden' || l.script) continue;
        l.delay -= dt;
        if (l.delay > 0) continue;
        l.script = {
          kind: 'goto', x: CLUB_DOOR_X + rand(-8, 8), y: Y_MIN, speed: 90,
          then: (g) => {
            this.setState(g, 'hidden');
            sfx.select();
          },
        };
      }
      for (const l of this.lads) if (l.script) this.runScript(l, dt);
      if (this.lads.every((l) => l.state === 'hidden') || v.t > 12) {
        if (!this.overSent) {
          this.overSent = true;
          this.onEnd('win', this.stats());
        }
      }
    }
  }

  updateCamera(dt) {
    const p = this.player;
    let maxCam = LEVEL_W - VIEW_W;
    if (this.lockX != null) maxCam = Math.min(maxCam, this.lockX);
    const target = p.x - 150;
    if (target > this.camX) this.camX = Math.min(target, maxCam);
    this.camX = clamp(this.camX, 0, LEVEL_W - VIEW_W);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 25);
  }

  updateFx(dt) {
    for (const f of this.fx) {
      f.t += dt;
      f.x += f.vx * dt;
      f.z += f.vz * dt;
      if (f.kind !== 'z' && f.kind !== 'spark') f.vz -= 300 * dt;
      if (f.kind === 'feather') f.vz = Math.max(f.vz, -20);
      if (f.z < 0) {
        f.z = 0;
        f.vz = 0;
        f.vx *= 0.8;
      }
    }
    this.fx = this.fx.filter((f) => f.t < f.life);
    for (const p of this.popups) {
      p.t -= dt;
      p.y -= 18 * dt;
    }
    this.popups = this.popups.filter((p) => p.t > 0);
  }

  // ================================================================= render
  render(g) {
    const cam = Math.round(this.camX);
    drawBackground(g, this.lvl, this.camX, this.t);
    drawIlluminations(g, this.camX, this.t);

    // chippy / bench hints behind the crowd
    const ev = this.ev;
    const blink = Math.floor(this.t * 4) % 2;
    if (ev && ev.type === 'chippy' && ev.inside && !ev.out) {
      const sx = CHIPPY_DOOR_X - cam;
      g.fillStyle = '#ffe8a3';
      g.fillRect(sx - 6, 108, 12, 12);
      drawHuman(g, sx, 122, 1, ev.guy.look, 'drink', 0, 0, { item: 'chips', mood: 'drink' });
      if (blink) drawText(g, 'PUNCH!', sx, 86, { color: '#ffd43b', align: 'center' });
      if (blink) {
        g.fillStyle = '#ffd43b';
        g.fillRect(sx - 2, 93, 5, 2);
        g.fillRect(sx - 1, 95, 3, 2);
      }
    }

    const list = [];
    for (const it of this.items) list.push({ y: it.y, it });
    for (const f of [...this.lads, ...this.enemies]) if (f.state !== 'hidden') list.push({ y: f.y, f });
    list.sort((a, b) => a.y - b.y);
    for (const o of list) {
      if (o.f) drawShadow(g, o.f.x - cam, o.f.y, o.f.kind === 'gull' ? 10 : 12 * (o.f.look?.w || 1) + (o.f.kind === 'boss' ? 6 : 0));
      else drawShadow(g, o.it.x - cam, o.it.y, 7);
    }
    for (const o of list) {
      if (o.it) {
        const sx = o.it.x - cam;
        if (sx < -10 || sx > VIEW_W + 10) continue;
        const bob = Math.round(Math.sin(this.t * 3 + o.it.bob));
        if (o.it.kind === 'pint') drawPint(g, sx - 2, o.it.y - 9 + bob);
        else drawChips(g, sx - 3, o.it.y - 7 + bob);
        if (Math.floor(this.t * 2 + o.it.bob) % 4 === 0) {
          g.fillStyle = '#fff';
          g.fillRect(sx + 3, o.it.y - 12 + bob, 1, 1);
        }
      } else this.drawFighter(g, o.f, cam);
    }

    // particles
    for (const f of this.fx) {
      const sx = Math.round(f.x - cam), sy = Math.round(f.y - f.z);
      const k = 1 - f.t / f.life;
      if (f.kind === 'spark') {
        const s = 3 + Math.round(k * 4);
        g.fillStyle = '#fff';
        g.fillRect(sx - s, sy, s * 2 + 1, 1);
        g.fillRect(sx, sy - s, 1, s * 2 + 1);
        g.fillStyle = '#ffd43b';
        g.fillRect(sx - 2, sy - 2, 5, 5);
        g.fillStyle = '#fff';
        g.fillRect(sx - 1, sy - 1, 3, 3);
      } else if (f.kind === 'z') {
        drawText(g, 'Z', sx, sy, { color: '#fff' });
      } else {
        g.fillStyle = f.color;
        g.fillRect(sx, sy, 2, f.kind === 'feather' ? 1 : 2);
      }
    }

    // name tags (stacked so a bunched-up crowd stays readable) + speech bubbles
    const tags = [];
    for (const f of [...this.lads, ...this.enemies]) {
      if (f.state === 'hidden') continue;
      const sx = Math.round(f.x - cam);
      if (sx < -30 || sx > VIEW_W + 30) continue;
      const top = this.headTop(f);
      tags.push({ f, sx, top, y: top - 8, w: f.type === 'lad' ? textWidth(f.name) + 3 : 0 });
    }
    tags.sort((a, b) => (b.f.isPlayer ? 1 : 0) - (a.f.isPlayer ? 1 : 0) || b.f.y - a.f.y);
    const placed = [];
    for (const t of tags) {
      if (!t.w) continue;
      for (let k = 0; k < 4; k++) {
        const clash = placed.some((p) => Math.abs(p.sx - t.sx) < (p.w + t.w) / 2 && Math.abs(p.y - t.y) < 7);
        if (!clash) break;
        t.y -= 7;
      }
      placed.push(t);
    }
    for (const t of tags) {
      const { f, sx } = t;
      if (f.type === 'lad') {
        const col = f.isPlayer ? '#ffd43b' : '#e9ecef';
        drawText(g, f.name, sx, t.y, { color: col, align: 'center' });
        if (f.isPlayer) {
          g.fillStyle = '#ffd43b';
          g.fillRect(sx - 2, t.top - 2, 5, 1);
          g.fillRect(sx - 1, t.top - 1, 3, 1);
        }
      }
    }
    for (const t of tags) if (t.f.say) this.drawBubble(g, t.sx, t.f.type === 'lad' ? t.y - 3 : t.top - 3, t.f.say.text);
    if (ev && ev.type === 'bench' && ev.sleeper?.state === 'sleep' && blink) {
      drawText(g, 'PUNCH TO WAKE!', ev.sleeper.x - cam, 108, { color: '#ffd43b', align: 'center' });
    }

    for (const p of this.popups) drawText(g, p.text, p.x - cam, p.y, { color: p.color, align: 'center', scale: p.scale });
  }

  headTop(f) {
    if (f.kind === 'gull') return f.y - f.z - 14;
    const L = f.look;
    let h = Math.round(13 * L.h) + Math.round(12 * L.h) + HEAD_H - 2;
    if (L.photo) h += 3;
    if (f.state === 'down' || f.state === 'dead' || f.state === 'ko') h = 14;
    if (f.state === 'sleep') h -= 5;
    return Math.round(f.y - f.z - h);
  }

  drawBubble(g, sx, y, text) {
    const w = textWidth(text) + 6;
    let x = Math.round(sx - w / 2);
    x = clamp(x, 2, VIEW_W - w - 2);
    y = Math.max(28, y - 9);
    g.fillStyle = '#000';
    g.fillRect(x - 1, y - 1, w + 2, 11);
    g.fillStyle = '#fff';
    g.fillRect(x, y, w, 9);
    g.fillRect(clamp(sx, x + 2, x + w - 3), y + 9, 2, 2);
    drawText(g, text, x + 3, y + 2, { color: '#111', outline: null });
  }

  drawFighter(g, f, cam) {
    const sx = f.x - cam;
    if (sx < -40 || sx > VIEW_W + 40) return;
    const sy = f.y - f.z;
    if (f.state === 'dead' && Math.floor(f.st * 14) % 2) return;
    const alpha = f.inv > 0 && f.isPlayer && f.state !== 'special' && Math.floor(this.t * 20) % 2 ? 0.45 : null;
    if (f.kind === 'gull') {
      const down = f.state === 'down' || f.state === 'dead';
      drawGull(g, sx, sy - 6, f.face, f.flap || 0, f.carrying, { flash: f.flash > 0, down, legs: down });
      return;
    }
    let pose = 'idle', p = 0, mood = null;
    let face = f.face;
    switch (f.state) {
      case 'walk': case 'flee': pose = 'walk'; break;
      case 'attack': {
        const d = f.atk.def;
        pose = d.pose;
        p = f.st < d.a0 ? (f.type === 'enemy' ? 0.15 : f.st / d.a0) : f.st < d.a1 ? 1 : Math.max(0, 1 - (f.st - d.a1) / (d.dur - d.a1));
        if (f.type === 'enemy' && f.st < d.a0) pose = d.pose === 'bag' ? 'bag' : 'grab';
        mood = 'shout';
        break;
      }
      case 'jump': pose = f.airAtk ? 'jumpkick' : 'jump'; break;
      case 'hurt': case 'grabbed': case 'stumble': pose = 'hurt'; mood = 'hurt'; break;
      case 'down': pose = f.downPhase === 'air' && f.vz > 0 ? 'hurt' : 'down'; mood = 'ko'; break;
      case 'dead': case 'ko': pose = 'down'; mood = 'ko'; break;
      case 'getup': pose = 'hurt'; break;
      case 'grab': pose = f.kneeT > 0 ? 'kick' : 'grab'; p = 0.4; break;
      case 'throwing': pose = 'upper'; break;
      case 'drink': pose = 'drink'; mood = 'drink'; break;
      case 'cheer': pose = 'cheer'; mood = 'shout'; break;
      case 'sleep': pose = 'sit'; mood = 'sleep'; break;
      case 'charge':
        pose = f.phase === 'run' ? 'grab' : f.phase === 'wind' ? 'upper' : 'idle';
        if (f.phase === 'run') pose = 'walk';
        mood = 'shout';
        break;
      case 'special':
        if (f.special === 'spin') {
          pose = 'spin';
          face = Math.floor(f.st / 0.07) % 2 ? 1 : -1;
        } else if (f.special === 'dash') {
          pose = 'punch';
          p = 1;
        } else pose = f.slammed ? 'upper' : 'cheer';
        mood = 'shout';
        break;
    }
    if (!mood && f.type === 'lad' && f.drunk > 0.9) mood = 'squint';
    drawHuman(g, sx, sy, face, f.look, pose, p, f.walk, { flash: f.flash > 0, mood, item: f.item, alpha });
    if (f.state === 'ko' && f.kind === 'boss') {
      for (let i = 0; i < 3; i++) {
        const a = this.t * 4 + (i * Math.PI * 2) / 3;
        g.fillStyle = '#ffd43b';
        g.fillRect(Math.round(sx - 20 + Math.cos(a) * 8), Math.round(f.y - 20 + Math.sin(a) * 3), 2, 2);
      }
    }
    if (f.state === 'special' && f.special === 'dash') {
      g.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 1; i < 4; i++) g.fillRect(Math.round(sx - f.face * i * 7), Math.round(sy - 20 + i * 3), 6, 1);
    }
  }

  renderHud(g) {
    const p = this.player;
    g.fillStyle = 'rgba(8,4,20,0.72)';
    g.fillRect(0, 0, VIEW_W, 25);
    drawText(g, p.name, 5, 3, { color: '#ffd43b' });
    drawText(g, `LIVES x${this.lives}`, 102, 3, { color: '#fff', align: 'right' });
    // health
    g.fillStyle = '#000';
    g.fillRect(4, 10, 100, 6);
    g.fillStyle = '#6b0f0f';
    g.fillRect(5, 11, 98, 4);
    const hp = Math.max(0, p.hp / p.maxHp);
    g.fillStyle = hp > 0.5 ? '#ffd43b' : hp > 0.25 ? '#ff922b' : '#fa5252';
    g.fillRect(5, 11, Math.round(98 * hp), 4);
    // beer-o-meter
    drawText(g, 'BEVVY', 5, 18, { color: '#f5b83d', outline: null });
    g.fillStyle = '#000';
    g.fillRect(26, 18, 52, 5);
    g.fillStyle = '#3b2a10';
    g.fillRect(27, 19, 50, 3);
    g.fillStyle = '#f5b83d';
    g.fillRect(27, 19, Math.round(50 * Math.min(1, p.drunk / 1.6)), 3);
    drawText(g, stageName(p.drunk), 81, 18, { color: p.drunk > 1 ? '#ff6b6b' : '#fff', outline: null });

    drawText(g, `SCORE ${String(this.score).padStart(6, '0')}`, VIEW_W - 5, 3, { color: '#fff', align: 'right' });
    drawText(g, `KO ${this.kos}`, VIEW_W - 5, 10, { color: '#69db7c', align: 'right' });
    drawText(g, `PINTS ${this.pintsSunk}`, VIEW_W - 5, 17, { color: '#f5b83d', align: 'right' });

    const boss = this.ev?.boss;
    const foe = boss && boss.hp > 0 ? boss : this.foe?.e;
    if (foe && (foe.hp > 0 || this.foe)) {
      const w = foe.kind === 'boss' ? 150 : 100;
      const x = 196 - w / 2 + 20;
      drawText(g, foe.name, x, 3, { color: foe.kind === 'boss' ? '#ff6b6b' : '#fff' });
      g.fillStyle = '#000';
      g.fillRect(x - 1, 10, w + 2, 6);
      g.fillStyle = '#3a0a0a';
      g.fillRect(x, 11, w, 4);
      g.fillStyle = '#e03131';
      g.fillRect(x, 11, Math.round(w * Math.max(0, foe.hp / foe.maxHp)), 4);
    }

    if (this.banner) {
      const b = this.banner;
      const tw = textWidth(b.text, 2);
      const sw = b.sub ? textWidth(b.sub) : 0;
      const w = Math.max(tw, sw) + 16;
      g.fillStyle = 'rgba(0,0,0,0.78)';
      g.fillRect(VIEW_W / 2 - w / 2, 54, w, b.sub ? 26 : 18);
      drawText(g, b.text, VIEW_W / 2, 58, { color: b.color, scale: 2, align: 'center' });
      if (b.sub) drawText(g, b.sub, VIEW_W / 2, 71, { color: '#fff', align: 'center' });
    }
    if (this.announce) {
      drawText(g, this.announce.text, VIEW_W / 2, 30, { color: '#fff', align: 'center', outline: this.announce.color });
    }
    if (this.goT > 0 && Math.floor(this.t * 4) % 2) {
      drawText(g, 'GO!', VIEW_W - 34, 92, { color: '#ffd43b', scale: 3, align: 'center' });
      g.fillStyle = '#ffd43b';
      for (let i = 0; i < 6; i++) g.fillRect(VIEW_W - 20 + i, 93 + i, 1, 12 - i * 2);
    }
  }

  /** Debug helper used for testing: jump to a spot in the level, skipping earlier events. */
  debugWarp(x) {
    while (this.evIdx < this.events.length && this.events[this.evIdx].lock + 150 < x) this.evIdx++;
    this.ev = null;
    this.lockX = null;
    this.enemies = [];
    this.camX = clamp(x - 150, 0, LEVEL_W - VIEW_W);
    for (const l of this.lads) {
      l.x = x + (l.isPlayer ? 0 : l.slot.dx);
      l.script = null;
      l.grabbing = null;
      l.z = l.vz = l.vx = l.vy = 0;
      this.setState(l, 'idle');
    }
  }
}
