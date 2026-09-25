// All sound effects and music are synthesised here with the Web Audio API.
// Nothing is sampled or downloaded - the tunes are original, written for this game.

let ac = null;
let master, sfxBus, musicBus, noiseBuf;
let muted = false;
let wantedSong = null;
let seq = null;

export function unlockAudio() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ac.destination);
    sfxBus = ac.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(master);
    musicBus = ac.createGain();
    musicBus.gain.value = 0.55;
    musicBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // iOS needs a sound started inside the gesture to wake the context up
    const s = ac.createBufferSource();
    s.buffer = ac.createBuffer(1, 1, 22050);
    s.connect(master);
    s.start(0);
    if (wantedSong) startMusic(wantedSong);
  }
  if (ac.state === 'suspended') ac.resume();
}

export function suspendAudio(on) {
  if (!ac) return;
  if (on) ac.suspend();
  else ac.resume();
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.8;
  return muted;
}
export const isMuted = () => muted;

function tone({ type = 'square', f = 440, f2 = null, dur = 0.1, vol = 0.3, attack = 0.004, when = 0, bus = sfxBus, lp = null, vib = 0, at = null }) {
  if (!ac) return;
  const t = at ?? ac.currentTime + when;
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
  if (vib) {
    const l = ac.createOscillator();
    const lg = ac.createGain();
    l.frequency.value = 7;
    lg.gain.value = vib;
    l.connect(lg).connect(o.frequency);
    l.start(t);
    l.stop(t + dur + 0.05);
  }
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (lp) {
    const fl = ac.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.value = lp;
    node.connect(fl);
    node = fl;
  }
  node.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise({ dur = 0.1, vol = 0.3, type = 'lowpass', freq = 1000, f2 = null, q = 1, when = 0, attack = 0.003, bus = sfxBus, at = null }) {
  if (!ac) return;
  const t = at ?? ac.currentTime + when;
  const s = ac.createBufferSource();
  s.buffer = noiseBuf;
  const fl = ac.createBiquadFilter();
  fl.type = type;
  fl.frequency.setValueAtTime(freq, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  fl.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl).connect(g).connect(bus);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.05);
}

export const sfx = {
  punch() {
    noise({ dur: 0.08, vol: 0.5, freq: 1800 });
    tone({ type: 'sine', f: 170, f2: 60, dur: 0.1, vol: 0.5 });
  },
  kick() {
    noise({ dur: 0.12, vol: 0.55, freq: 1100 });
    tone({ type: 'sine', f: 130, f2: 40, dur: 0.15, vol: 0.6 });
  },
  whoosh() {
    noise({ dur: 0.13, vol: 0.12, type: 'bandpass', freq: 600, f2: 2600, q: 2 });
  },
  hurt() {
    tone({ type: 'square', f: 240, f2: 90, dur: 0.14, vol: 0.18 });
    noise({ dur: 0.08, vol: 0.3, freq: 2400 });
  },
  jump() {
    tone({ type: 'square', f: 280, f2: 720, dur: 0.12, vol: 0.1 });
  },
  land() {
    noise({ dur: 0.07, vol: 0.2, freq: 450 });
  },
  thud() {
    noise({ dur: 0.2, vol: 0.5, freq: 380 });
    tone({ type: 'sine', f: 90, f2: 35, dur: 0.22, vol: 0.5 });
  },
  gulp() {
    for (let i = 0; i < 3; i++) tone({ type: 'sine', f: 340, f2: 140, dur: 0.08, vol: 0.35, when: i * 0.13 });
  },
  burp() {
    tone({ type: 'sawtooth', f: 95, f2: 68, dur: 0.55, vol: 0.3, lp: 700, vib: 12, attack: 0.03 });
  },
  hic() {
    tone({ type: 'square', f: 520, f2: 950, dur: 0.07, vol: 0.14 });
  },
  squawk() {
    tone({ type: 'sawtooth', f: 1500, f2: 900, dur: 0.14, vol: 0.1, lp: 3000 });
    tone({ type: 'sawtooth', f: 1400, f2: 800, dur: 0.18, vol: 0.1, lp: 3000, when: 0.17 });
  },
  steal() {
    tone({ type: 'square', f: 900, f2: 250, dur: 0.22, vol: 0.14 });
  },
  ko() {
    tone({ type: 'sine', f: 420, f2: 55, dur: 0.45, vol: 0.3 });
  },
  pickup() {
    [660, 880, 1320].forEach((f, i) => tone({ type: 'square', f, dur: 0.06, vol: 0.12, when: i * 0.05 }));
  },
  select() {
    tone({ type: 'square', f: 880, dur: 0.05, vol: 0.12 });
  },
  start() {
    [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'square', f, dur: 0.1, vol: 0.14, when: i * 0.08 }));
  },
  special() {
    tone({ type: 'square', f: 180, f2: 1300, dur: 0.28, vol: 0.18 });
    noise({ dur: 0.3, vol: 0.15, type: 'bandpass', freq: 500, f2: 4000, q: 1 });
  },
  tramBell() {
    [0, 0.35].forEach((w) => {
      tone({ type: 'sine', f: 1320, dur: 0.6, vol: 0.2, when: w });
      tone({ type: 'triangle', f: 2640, dur: 0.35, vol: 0.06, when: w });
    });
  },
  shopBell() {
    tone({ type: 'sine', f: 2100, dur: 0.3, vol: 0.12 });
    tone({ type: 'sine', f: 2800, dur: 0.25, vol: 0.08, when: 0.08 });
  },
  cheer() {
    noise({ dur: 1.6, vol: 0.25, type: 'bandpass', freq: 1300, q: 0.6, attack: 0.25 });
    [0.1, 0.5, 0.9].forEach((w) => tone({ type: 'sine', f: 1900, f2: 2700, dur: 0.25, vol: 0.08, when: w }));
  },
  bossRoar() {
    tone({ type: 'sawtooth', f: 85, f2: 50, dur: 0.7, vol: 0.4, lp: 500, vib: 8 });
  },
  go() {
    tone({ type: 'square', f: 660, dur: 0.08, vol: 0.12 });
    tone({ type: 'square', f: 990, dur: 0.12, vol: 0.12, when: 0.1 });
  },
  snore() {
    tone({ type: 'sawtooth', f: 70, f2: 110, dur: 0.6, vol: 0.12, lp: 400, attack: 0.2 });
  },
};

// ---------------------------------------------------------------- music

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freq(name) {
  const m = /^([A-G]#?)(\d)$/.exec(name);
  const midi = 12 * (Number(m[2]) + 1) + NOTE[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// "E5 - - G5 . ..." -> events keyed by step. '-' holds, '.' rests.
function parseLine(str) {
  const toks = str.trim().split(/\s+/);
  const events = [];
  let cur = null;
  toks.forEach((tk, i) => {
    if (tk === '-') {
      if (cur) cur.len++;
    } else if (tk === '.') {
      cur = null;
    } else {
      cur = { step: i, f: freq(tk), len: 1 };
      events.push(cur);
    }
  });
  return events;
}

const TRIADS = {
  C: ['C', 'E', 'G'], Am: ['A', 'C', 'E'], F: ['F', 'A', 'C'], G: ['G', 'B', 'D'],
  Dm: ['D', 'F', 'A'], E: ['E', 'G#', 'B'],
};

function buildSong({ bpm, chords, lead, kick, snare, hat, leadType = 'square', leadVol = 0.07 }) {
  const steps = chords.length * 16;
  const at = Array.from({ length: steps }, () => []);
  parseLine(lead.join(' ')).forEach((e) => at[e.step].push({ v: 'lead', f: e.f, len: e.len }));
  chords.forEach((c, bar) => {
    const tri = TRIADS[c];
    for (let s = 0; s < 16; s++) {
      const step = bar * 16 + s;
      if (s % 2 === 0) at[step].push({ v: 'bass', f: freq(tri[0] + (s % 4 === 0 ? '2' : '3')), len: 2 });
      at[step].push({ v: 'arp', f: freq(tri[[0, 1, 2, 1][s % 4]] + '4'), len: 1 });
      if (kick.includes(s)) at[step].push({ v: 'kick' });
      if (snare.includes(s)) at[step].push({ v: 'snare' });
      if (hat.includes(s)) at[step].push({ v: 'hat' });
    }
  });
  return { bpm, steps, at, leadType, leadVol };
}

const SONGS = {
  // "Golden Mile Stomp" - bouncy seaside tune
  prom: buildSong({
    bpm: 132,
    chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'C'],
    lead: [
      'E5 - - G5 - - C6 - B5 - G5 - E5 - - -',
      'A5 - - C6 - - E6 - D6 - C6 - A5 - - -',
      'F5 - A5 - C6 - A5 - F5 - A5 - C6 - D6 -',
      'B5 - - - G5 - - - D5 - G5 - B5 - D6 -',
      'E6 - - D6 - - C6 - G5 - - - E5 - G5 -',
      'A5 - - G5 - - E5 - A5 - C6 - E6 - - -',
      'F5 - A5 - C6 - F6 - D6 - B5 - G5 - D6 -',
      'C6 - - - G5 - E5 - C5 - - - . . . .',
    ],
    kick: [0, 8, 10],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
  }),
  // "Not Tonight, Lads" - the head bouncer's theme
  boss: buildSong({
    bpm: 150,
    chords: ['Am', 'Am', 'F', 'F', 'Dm', 'Dm', 'E', 'Am'],
    lead: [
      'A4 - - A4 - - C5 - B4 - A4 - E4 - - -',
      'A4 - - A4 - - C5 - D5 - E5 - - - - -',
      'F5 - - E5 - - D5 - C5 - D5 - E5 - - -',
      'F5 - E5 - D5 - C5 - B4 - C5 - D5 - - -',
      'D5 - - F5 - - A5 - G5 - F5 - E5 - D5 -',
      'D5 - - F5 - - A5 - C6 - B5 - A5 - - -',
      'E5 - - G#5 - - B5 - E6 - D6 - B5 - G#5 -',
      'A5 - - - E5 - - - A4 - - - . . . .',
    ],
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    leadType: 'sawtooth',
    leadVol: 0.05,
  }),
};

function playStep(song, step, t, spb) {
  for (const ev of song.at[step]) {
    switch (ev.v) {
      case 'lead':
        tone({ type: song.leadType, f: ev.f, dur: ev.len * spb * 0.95, vol: song.leadVol, bus: musicBus, at: t, lp: 3500 });
        break;
      case 'bass':
        tone({ type: 'square', f: ev.f, dur: ev.len * spb * 0.8, vol: 0.09, bus: musicBus, at: t, lp: 600 });
        break;
      case 'arp':
        tone({ type: 'triangle', f: ev.f, dur: spb * 0.9, vol: 0.035, bus: musicBus, at: t });
        break;
      case 'kick':
        tone({ type: 'sine', f: 150, f2: 40, dur: 0.13, vol: 0.4, bus: musicBus, at: t });
        break;
      case 'snare':
        noise({ dur: 0.11, vol: 0.14, type: 'highpass', freq: 1400, bus: musicBus, at: t });
        break;
      case 'hat':
        noise({ dur: 0.03, vol: 0.045, type: 'highpass', freq: 7000, bus: musicBus, at: t });
        break;
    }
  }
}

export function startMusic(name) {
  wantedSong = name;
  if (!ac) return;
  if (seq && seq.name === name) return;
  stopMusic(false);
  const song = SONGS[name];
  if (!song) return;
  const s = { name, song, step: 0, next: ac.currentTime + 0.08 };
  const spb = 60 / song.bpm / 4;
  s.timer = setInterval(() => {
    if (ac.state !== 'running') return;
    if (s.next < ac.currentTime - 0.5) s.next = ac.currentTime + 0.05; // after a stall, don't machine-gun catch up
    while (s.next < ac.currentTime + 0.15) {
      playStep(song, s.step, s.next, spb);
      s.next += spb;
      s.step = (s.step + 1) % song.steps;
    }
  }, 25);
  seq = s;
}

export function stopMusic(forget = true) {
  if (seq) clearInterval(seq.timer);
  seq = null;
  if (forget) wantedSong = null;
}

export function jingle(kind) {
  stopMusic();
  if (!ac) return;
  if (kind === 'win') {
    const notes = ['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6'];
    const lens = [0.12, 0.12, 0.12, 0.24, 0.12, 0.24, 0.8];
    let w = 0;
    notes.forEach((n, i) => {
      tone({ type: 'square', f: freq(n), dur: lens[i] * 0.95, vol: 0.12, when: w, bus: musicBus });
      tone({ type: 'triangle', f: freq(n) / 2, dur: lens[i] * 0.95, vol: 0.1, when: w, bus: musicBus });
      w += lens[i];
    });
  } else {
    // sad trombone, wah wah wah waaah
    ['G4', 'F#4', 'F4', 'E4'].forEach((n, i) => {
      tone({ type: 'sawtooth', f: freq(n), f2: i === 3 ? freq(n) * 0.97 : null, dur: i === 3 ? 1.3 : 0.42, vol: 0.16, when: i * 0.48, bus: musicBus, lp: 900, vib: i === 3 ? 6 : 0, attack: 0.05 });
    });
  }
}
