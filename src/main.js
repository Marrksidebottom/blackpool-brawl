import './style.css';
import { CREW } from './crew.js';
import { buildLevel, drawBackground, drawIlluminations, VIEW_W, VIEW_H } from './level.js';
import { drawHuman, loadFaces } from './sprites.js';
import { drawText } from './font.js';
import { initInput, wasPressed, consume, onAnyInput } from './input.js';
import { unlockAudio, sfx, startMusic, toggleMute, suspendAudio } from './audio.js';
import { Game } from './game.js';

const screen = document.getElementById('screen');
const sctx = screen.getContext('2d');
const world = document.createElement('canvas');
world.width = VIEW_W;
world.height = VIEW_H;
const wctx = world.getContext('2d');
sctx.imageSmoothingEnabled = false;
wctx.imageSmoothingEnabled = false;

const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouch) document.body.classList.add('touch');

function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const portrait = vh > vw;
  document.body.classList.toggle('portrait', portrait);
  const scale = portrait ? vw / VIEW_W : Math.min(vw / VIEW_W, vh / VIEW_H);
  screen.style.width = `${Math.floor(VIEW_W * scale)}px`;
  screen.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

initInput();
loadFaces(CREW);
const lvl = buildLevel();

let mode = 'title';
let sel = Math.max(0, CREW.findIndex((c) => c.id === localStorage.getItem('bb-lad')));
let game = null;
let paused = false;
let titleT = 0;
let end = null;

onAnyInput(() => unlockAudio());
screen.addEventListener('pointerdown', (e) => {
  unlockAudio();
  const r = screen.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * VIEW_W;
  const y = ((e.clientY - r.top) / r.height) * VIEW_H;
  onTap(x, y);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (mode === 'play') paused = true;
    suspendAudio(true);
  } else suspendAudio(false);
});

const muteBtn = document.getElementById('mute');
function doMute() {
  const m = toggleMute();
  muteBtn.style.opacity = m ? 0.4 : 1;
}

function startGame() {
  localStorage.setItem('bb-lad', CREW[sel].id);
  sfx.start();
  game = new Game(lvl, sel, (result, stats) => {
    mode = 'end';
    end = { result, stats, t: 0 };
  });
  mode = 'play';
  paused = false;
}

// ------------------------------------------------------------------ title screen
const PICK_X = (i) => 44 + i * 52;
const PICK_Y = 152;

function onTap(x, y) {
  if (mode === 'title') {
    for (let i = 0; i < CREW.length; i++) {
      if (Math.abs(x - PICK_X(i)) < 24 && y > 100 && y < PICK_Y + 6) {
        if (sel === i) startGame();
        else {
          sel = i;
          sfx.select();
        }
        return;
      }
    }
    if (y > 196) startGame();
  } else if (mode === 'end' && end.t > 1.2) {
    mode = 'title';
    startMusic('prom');
  } else if (mode === 'play' && paused) paused = false;
}

function updateTitle(dt) {
  titleT += dt;
  if (wasPressed('left')) {
    sel = (sel + CREW.length - 1) % CREW.length;
    sfx.select();
  }
  if (wasPressed('right')) {
    sel = (sel + 1) % CREW.length;
    sfx.select();
  }
  if (wasPressed('start') || wasPressed('punch') || wasPressed('jump')) startGame();
}

function renderTitle() {
  const g = wctx;
  const cam = 30 + Math.sin(titleT * 0.15) * 30;
  drawBackground(g, lvl, cam, titleT);
  drawIlluminations(g, cam, titleT);
  g.fillStyle = 'rgba(10,5,25,0.55)';
  g.fillRect(0, 0, VIEW_W, VIEW_H);

  const wob = Math.round(Math.sin(titleT * 3) * 2);
  drawText(g, 'BLACKPOOL', VIEW_W / 2, 10 + wob, { color: '#ffd43b', scale: 5, align: 'center', outline: '#c92a2a' });
  drawText(g, 'BRAWL!', VIEW_W / 2, 40 - wob, { color: '#f783ac', scale: 5, align: 'center', outline: '#5f0f40' });
  drawText(g, 'A WORLD HEAT NIGHT OUT', VIEW_W / 2, 70, { color: '#fff', align: 'center' });
  drawText(g, 'PICK YOUR LAD - THE OTHER SIX COME WITH YOU', VIEW_W / 2, 84, { color: '#69db7c', align: 'center' });

  for (let i = 0; i < CREW.length; i++) {
    const c = CREW[i];
    const x = PICK_X(i);
    const on = i === sel;
    if (on) {
      g.fillStyle = 'rgba(255,212,59,0.18)';
      g.fillRect(x - 24, 96, 48, 60);
      g.fillStyle = '#ffd43b';
      g.fillRect(x - 24, 96, 48, 1);
      g.fillRect(x - 24, 155, 48, 1);
      g.fillRect(x - 24, 96, 1, 60);
      g.fillRect(x + 23, 96, 1, 60);
    }
    const bounce = on ? Math.abs(Math.sin(titleT * 6)) * 4 : 0;
    drawHuman(g, x, PICK_Y - bounce, 1, c, on ? 'cheer' : 'idle', 0, 0, { mood: on ? 'shout' : null });
    drawText(g, c.name, x, 100, { color: on ? '#ffd43b' : '#ced4da', align: 'center' });
  }
  const c = CREW[sel];
  drawText(g, c.full, VIEW_W / 2, 161, { color: c.shirt, align: 'center', scale: 1 });
  drawText(g, `SIGNATURE MOVE: ${c.move.name}`, VIEW_W / 2, 169, { color: '#fff', align: 'center' });

  drawText(g, 'MOVE: ARROWS/WASD  PUNCH: J  KICK: K  JUMP: SPACE', VIEW_W / 2, 182, { color: '#ced4da', align: 'center' });
  drawText(g, 'SPECIAL: L (OR J+K)  GRAB: WALK INTO A BADDIE  PINTS = HEALTH', VIEW_W / 2, 190, { color: '#ced4da', align: 'center' });
  if (Math.floor(titleT * 2.5) % 2) {
    const msg = isTouch ? 'TAP A LAD, THEN TAP HERE TO START' : 'LEFT/RIGHT TO PICK - PRESS J OR ENTER TO START';
    drawText(g, msg, VIEW_W / 2, 204, { color: '#ffd43b', align: 'center', scale: 1 });
  }
  drawText(g, 'M: MUSIC ON/OFF   P: PAUSE', VIEW_W / 2, 215, { color: '#868e96', align: 'center', outline: null });
}

// ------------------------------------------------------------------ end screen
function renderEnd() {
  const g = sctx;
  end.t += 1 / 60;
  const win = end.result === 'win';
  g.fillStyle = win ? 'rgba(20,10,40,0.78)' : 'rgba(40,0,0,0.78)';
  g.fillRect(0, 0, VIEW_W, VIEW_H);
  if (win) {
    drawText(g, 'YOU GOT IN', VIEW_W / 2, 30, { color: '#ffd43b', scale: 4, align: 'center', outline: '#c92a2a' });
    drawText(g, 'THE CLUB!', VIEW_W / 2, 56, { color: '#f783ac', scale: 4, align: 'center', outline: '#5f0f40' });
    drawText(g, 'BIG DEZ IS HAVING A LIE DOWN. THE VELVET WALRUS IS YOURS.', VIEW_W / 2, 84, { color: '#fff', align: 'center' });
  } else {
    drawText(g, 'NIGHT OVER', VIEW_W / 2, 36, { color: '#ff6b6b', scale: 5, align: 'center', outline: '#000' });
    drawText(g, 'ESCORTED OFF THE PROM. KEBAB AND A TAXI HOME.', VIEW_W / 2, 72, { color: '#fff', align: 'center' });
  }
  const s = end.stats;
  const mm = Math.floor(s.time / 60), ss = String(Math.floor(s.time % 60)).padStart(2, '0');
  const rows = [
    ['PLAYED AS', s.lad],
    ['SCORE', String(s.score)],
    ['KNOCKOUTS', String(s.kos)],
    ['PINTS SUNK', String(s.pints)],
    ['TIME', `${mm}:${ss}`],
  ];
  rows.forEach(([k, v], i) => {
    drawText(g, k, VIEW_W / 2 - 8, 104 + i * 12, { color: '#adb5bd', align: 'right', scale: 1 });
    drawText(g, v, VIEW_W / 2 + 8, 104 + i * 12, { color: '#ffd43b', scale: 1 });
  });
  if (end.t > 1.2 && Math.floor(end.t * 2.5) % 2) {
    drawText(g, isTouch ? 'TAP TO GO AGAIN' : 'PRESS J OR ENTER TO GO AGAIN', VIEW_W / 2, 176, { color: '#fff', scale: 2, align: 'center' });
  }
}

// ------------------------------------------------------------------ compositing
function present() {
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.globalAlpha = 1;
  sctx.fillStyle = '#000';
  sctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const d = game && mode !== 'title' ? Math.min(game.player.drunk, 1.6) : 0;
  const sh = game && mode !== 'title' ? game.shake : 0;
  if (d < 0.03 && sh < 0.5) {
    sctx.drawImage(world, 0, 0);
    return;
  }
  // beer goggles: sway, drift and a spot of double vision
  const t = game.t;
  const ang = Math.sin(t * 1.1) * 0.024 * d;
  const ox = Math.sin(t * 0.7) * 5 * d + (sh ? (Math.random() - 0.5) * sh * 2 : 0);
  const oy = Math.sin(t * 1.3) * 2.5 * d + (sh ? (Math.random() - 0.5) * sh : 0);
  const sc = 1 + 0.05 * d;
  sctx.save();
  sctx.translate(VIEW_W / 2 + ox, VIEW_H / 2 + oy);
  sctx.rotate(ang);
  sctx.scale(sc, sc);
  sctx.drawImage(world, -VIEW_W / 2, -VIEW_H / 2);
  if (d > 0.45) {
    sctx.globalAlpha = Math.min(0.38, (d - 0.45) * 0.5);
    sctx.drawImage(world, -VIEW_W / 2 + Math.sin(t * 1.7) * 7 * d, -VIEW_H / 2 + 1);
    sctx.globalAlpha = 1;
  }
  sctx.restore();
}

// ------------------------------------------------------------------ main loop
const STEP = 1 / 60;
let last = performance.now();
let acc = 0;

function step() {
  if (wasPressed('mute')) doMute();
  if (mode === 'title') updateTitle(STEP);
  else if (mode === 'play') {
    if (wasPressed('pause')) paused = !paused;
    if (!paused) game.update(STEP);
  } else if (mode === 'end') {
    if (end.t > 1.2 && (wasPressed('start') || wasPressed('punch') || wasPressed('jump'))) {
      mode = 'title';
      startMusic('prom');
    }
  }
  if (!(mode === 'play' && game.frozen)) consume();
}

function frame(now) {
  requestAnimationFrame(frame); // queued first so one bad frame can never freeze the game
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;
  while (acc >= STEP) {
    step();
    acc -= STEP;
  }
  if (mode === 'title') {
    renderTitle();
    present();
  } else {
    game.render(wctx);
    present();
    game.renderHud(sctx);
    if (mode === 'end') renderEnd();
    else if (paused) {
      sctx.fillStyle = 'rgba(0,0,0,0.6)';
      sctx.fillRect(0, 0, VIEW_W, VIEW_H);
      drawText(sctx, 'PAUSED', VIEW_W / 2, 80, { color: '#ffd43b', scale: 4, align: 'center' });
      drawText(sctx, isTouch ? 'TAP TO CARRY ON' : 'PRESS P TO CARRY ON', VIEW_W / 2, 110, { color: '#fff', align: 'center' });
    }
  }
}
startMusic('prom');
requestAnimationFrame(frame);

// Handy for testing from the console: BB.start(6); BB.warp(3500); BB.game.player.drunk = 1.2
window.BB = {
  get game() {
    return game;
  },
  get mode() {
    return mode;
  },
  start(i = sel) {
    sel = i;
    startGame();
  },
  warp(x) {
    game?.debugWarp(x);
  },
};
