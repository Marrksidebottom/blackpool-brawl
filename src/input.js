// Keyboard + on-screen touch controls, merged into one set of actions.
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  KeyJ: 'punch', KeyZ: 'punch',
  KeyK: 'kick', KeyX: 'kick',
  Space: 'jump', KeyC: 'jump',
  KeyL: 'special',
  Enter: 'start',
  KeyP: 'pause', Escape: 'pause',
  KeyM: 'mute',
};

const held = new Set(); // actions held by keyboard
const touchHeld = new Set(); // actions held by touch buttons
const stickHeld = new Set(); // directions from the touch stick
const fresh = new Set(); // pressed since last consume
const listeners = [];

function press(action) {
  if (!isDown(action)) fresh.add(action);
}

export function isDown(a) {
  return held.has(a) || touchHeld.has(a) || stickHeld.has(a);
}
export function wasPressed(a) {
  return fresh.has(a);
}
export function consume() {
  fresh.clear();
}
export function onAnyInput(fn) {
  listeners.push(fn);
}
const notify = (e) => listeners.forEach((fn) => fn(e));

export function initInput() {
  window.addEventListener('keydown', (e) => {
    notify(e);
    const a = KEYMAP[e.code];
    if (!a) return;
    e.preventDefault();
    if (e.repeat) return;
    press(a);
    held.add(a);
  });
  window.addEventListener('keyup', (e) => {
    const a = KEYMAP[e.code];
    if (a) held.delete(a);
  });
  window.addEventListener('blur', () => {
    held.clear();
    touchHeld.clear();
    stickHeld.clear();
  });

  // --- touch buttons
  document.querySelectorAll('#touch [data-action]').forEach((btn) => {
    const a = btn.dataset.action;
    const down = (e) => {
      e.preventDefault();
      notify(e);
      btn.setPointerCapture?.(e.pointerId);
      press(a);
      touchHeld.add(a);
      btn.classList.add('pressed');
    };
    const up = (e) => {
      e.preventDefault();
      touchHeld.delete(a);
      btn.classList.remove('pressed');
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  // --- touch stick (8-way)
  const pad = document.getElementById('dpad');
  const stick = document.getElementById('stick');
  let padPointer = null;
  const setStick = (e) => {
    const r = pad.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const max = r.width / 2 - 20;
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx *= max / len;
      dy *= max / len;
    }
    stick.style.transform = `translate(${dx}px, ${dy}px)`;
    const dead = 14;
    const want = new Set();
    if (len > dead) {
      const ang = Math.atan2(dy, dx);
      const oct = Math.round(ang / (Math.PI / 4)); // -4..4
      const dirs = {
        0: ['right'], 1: ['right', 'down'], 2: ['down'], 3: ['left', 'down'],
        4: ['left'], '-4': ['left'], '-3': ['left', 'up'], '-2': ['up'], '-1': ['right', 'up'],
      }[oct];
      dirs.forEach((d) => want.add(d));
    }
    for (const d of ['left', 'right', 'up', 'down']) {
      if (want.has(d) && !stickHeld.has(d)) {
        press(d);
        stickHeld.add(d);
      } else if (!want.has(d)) stickHeld.delete(d);
    }
  };
  const release = () => {
    padPointer = null;
    stickHeld.clear();
    stick.style.transform = '';
  };
  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    notify(e);
    padPointer = e.pointerId;
    pad.setPointerCapture?.(e.pointerId);
    setStick(e);
  });
  pad.addEventListener('pointermove', (e) => {
    if (e.pointerId === padPointer) setStick(e);
  });
  pad.addEventListener('pointerup', release);
  pad.addEventListener('pointercancel', release);
  pad.addEventListener('lostpointercapture', release);

  // block pinch zoom / double-tap zoom on iOS
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());
}
