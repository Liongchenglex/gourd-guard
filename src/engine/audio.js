import { save } from '../save.js';
import { BANK } from '../data/sfxbank.js';
import { MUSIC } from '../data/music.js';
import { MUSIC_W6 } from '../data/music_w6.js';
import { BEIGE } from '../data/pumpkins.js';
const W6_MUSIC = __RELEASE__ >= 2 ? MUSIC_W6 : {};   // World 6 beta tracks (the Frenzy jukebox); dropped from store builds

// ---------- Audio ----------
// Two layers: recorded CC0 samples (src/data/sfxbank.js, built by tools/sfx_build.py from assets/sfx) for the organic,
// cartoon-foley feel the owner asked for, and a small synthesiser for musical accents (bunch chords, alarms) and as a
// fallback while the bank is still decoding. Design tables live in docs/AUDIO.md.

export let sfxBus = null, musicBus = null;   // volume buses under the limiter (settings: save.sfxVol / save.musicVol)
export let AC = null, master = null, noiseBuf = null, lastCoin = 0, lastHit = 0, lastThrow = 0, lastChomp = 0;

const buffers = {};        // bank key -> decoded AudioBuffers (sparse while decoding)
let bankStarted = false, bankReady = 0;

export function ensureAudio(){
  try {
    if (!AC){
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      AC = new A(); master = AC.createGain(); master.gain.value = 1.0;
      // Limiter: every sound is mixed hot so it carries on a phone speaker; the compressor keeps stacked layers from clipping.
      const comp = AC.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 10; comp.attack.value = 0.002; comp.release.value = 0.12;
      master.connect(comp); comp.connect(AC.destination);
      sfxBus = AC.createGain(); musicBus = AC.createGain(); sfxBus.connect(master); musicBus.connect(master); applyVolumes();
      noiseBuf = AC.createBuffer(1, Math.floor(AC.sampleRate * 1), AC.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (AC.state !== 'running' && AC.state !== 'closed'){ const p = AC.resume(); if (p && p.catch) p.catch(() => {}); }
    decodeBank();
  } catch (e) {}
}

// Decode every clip once (about 1 MB of base64 MP3, a few hundred milliseconds spread across async decodes).
function decodeBank(){
  if (bankStarted || !AC) return; bankStarted = true;
  for (const key in BANK){
    buffers[key] = [];
    BANK[key].forEach((uri, i) => {
      try {
        const bin = atob(uri.slice(uri.indexOf(',') + 1)), arr = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
        AC.decodeAudioData(arr.buffer, buf => { buffers[key][i] = buf; bankReady++; }, () => {});
      } catch (e) {}
    });
  }
}
export const sfxReady = () => bankReady > 0;

// ---- music: one looping track per key (src/data/music.js), decoded on first use, faded in and out ----
const MUSIC_GAIN = 0.32;   // owner: current balance is fine for now (2026-09-26)
const musicBufs = {}; let musicSrc = null, musicGain = null, musicKey = null, musicWant = null, musicT0 = 0;
const musicPos = () => musicSrc && musicSrc.buffer && AC ? Math.max(0, AC.currentTime - musicT0) % musicSrc.buffer.duration : 0;   // where the loop is now
/** Start a track from its beginning (owner: tracks always play from 0:00); `offset` only continues the same track after the audio was rebuilt. */
export function musicStart(key = 'play', offset = 0){
  ensureAudio(); if (!AC) return;
  if (musicSrc && musicKey === key) return;
  musicStop(0.4); musicWant = key;   // set after the stop, which clears the wish
  const play = buf => {
    if (musicWant !== key || musicSrc) return;
    musicGain = AC.createGain(); musicGain.gain.setValueAtTime(0.0001, AC.currentTime); musicGain.gain.exponentialRampToValueAtTime(save.muted ? 0.0001 : MUSIC_GAIN, AC.currentTime + 1.2);
    const at = offset % buf.duration;
    musicSrc = AC.createBufferSource(); musicSrc.buffer = buf; musicSrc.loop = true; musicSrc.connect(musicGain); musicGain.connect(musicBus); musicSrc.start(0, at); musicT0 = AC.currentTime - at; musicKey = key;
  };
  if (musicBufs[key]) return play(musicBufs[key]);
  const uri = MUSIC[key] || W6_MUSIC[key]; if (!uri) return;
  try {
    const bin = atob(uri.slice(uri.indexOf(',') + 1)), arr = new Uint8Array(bin.length);
    for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
    AC.decodeAudioData(arr.buffer, buf => { musicBufs[key] = buf; play(buf); }, () => {});
  } catch (e) {}
}
export function musicStop(fade = 0.8){
  musicWant = null;
  if (!musicSrc || !AC) return;
  const src = musicSrc, g = musicGain; musicSrc = null; musicGain = null; musicKey = null;
  try { g.gain.cancelScheduledValues(AC.currentTime); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), AC.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + fade); src.stop(AC.currentTime + fade + 0.05); } catch (e) {}
}

// ---- leaving and coming back (the phone app, 2026-09-28; rewritten 2026-10-31 after the owner's iPhone kept losing its sound) ----
// Leaving: iOS interrupts the context by itself. A page-side suspend() on top of that left it stuck (resume() during an
// interruption flips a suspended context back to "interrupted", which WebKit then never resumes), so the game now only
// mutes the master bus while hidden and never suspends on its own.
// Coming back: resume() whatever state it is in; iOS only honours that inside a tap, so it is retried on every tap. A
// WKWebView context can also come back "running" but dead (its clock stops), so the clock is checked and a dead context
// is rebuilt inside the tap: a fresh graph, the decoded clips reused, the music continued from where it was.
let wantWake = false, wakeT = 0, wakeAt = 0, wakeTimer = 0;
const clockDead = () => AC && AC.state === 'running' && wakeAt && performance.now() - wakeAt > 300 && AC.currentTime === wakeT;
function sampleClock(){ wakeT = AC ? AC.currentTime : 0; wakeAt = performance.now(); }
function rebuild(){
  const key = musicKey, pos = musicPos(), old = AC;
  try { if (musicSrc) musicSrc.stop(); } catch (e) {}
  musicSrc = null; musicGain = null; musicKey = null; musicWant = null;
  AC = null; master = null; sfxBus = null; musicBus = null; noiseBuf = null;
  try { const p = old.close(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  ensureAudio();   // a new graph; the clips already decoded are kept (an AudioBuffer is not tied to its context)
  if (key && AC) musicStart(key, pos);
}
function wake(gesture){
  if (!AC || document.hidden) return;
  if (gesture && clockDead()) rebuild();   // only a fresh context made inside a tap will play again
  else if (AC.state !== 'running' && AC.state !== 'closed'){ try { const p = AC.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
  if (master) master.gain.value = 1;
  if (gesture || !wakeAt) sampleClock();
  clearTimeout(wakeTimer);
  wakeTimer = setTimeout(() => { if (wantWake && AC && !document.hidden && AC.state === 'running' && AC.currentTime > wakeT) wantWake = false; }, 500);   // awake once the clock runs
}
export function audioSleep(hidden){
  try {
    if (!AC) return;
    if (hidden){ wantWake = false; wakeAt = 0; clearTimeout(wakeTimer); if (master) master.gain.value = 0; }
    else { wantWake = true; wakeAt = 0; wake(false); }
  } catch (e) {}
}
['touchend', 'pointerdown', 'keydown'].forEach(t => document.addEventListener(t, () => { if (wantWake) wake(true); }, true));
export function musicSync(){ if (musicGain && AC) musicGain.gain.setTargetAtTime(save.muted ? 0.0001 : MUSIC_GAIN, AC.currentTime, 0.1); }
/** Duck the music to `level` of its gain for `seconds`, then ease back (boss warnings). */
export function musicDuck(level = 0.35, seconds = 3){
  if (!musicGain || !AC || save.muted) return;
  const g = musicGain.gain, t = AC.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.0001, g.value), t);
  g.linearRampToValueAtTime(MUSIC_GAIN * level, t + 0.25); g.setValueAtTime(MUSIC_GAIN * level, t + seconds); g.linearRampToValueAtTime(MUSIC_GAIN, t + seconds + 1.5);
}

// Mix levels. BOOST lifts the synth primitives out of the -30 dBFS range the first draft sat in; SAMPLE_GAIN scales the
// peak-normalised clips into the same range. layerGain/jitter are set briefly by the hit layers: monster reactions play
// a touch louder than the pumpkin impact so both read, and random detune keeps repeated hits from sounding like a loop.
const BOOST = 5, SAMPLE_GAIN = 0.75;
let layerGain = 1, jitter = 0;
function layer(gain, detune, fn){ layerGain = gain; jitter = detune; try { fn(); } finally { layerGain = 1; jitter = 0; } }
const jit = f => jitter ? f * (1 + (Math.random() - 0.5) * 2 * jitter) : f;

export function tone(f, d, type, v, f2, delay){
  if (!AC || save.muted) return;
  const t0 = AC.currentTime + (delay || 0); const k = jit(1); f *= k; if (f2) f2 *= k; v = (v || 0.15) * BOOST * layerGain;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g); g.connect(sfxBus); o.start(t0); o.stop(t0 + d + 0.05);
}

export function noise(d, v, f, q, delay, f2){
  if (!AC || save.muted) return;
  const t0 = AC.currentTime + (delay || 0); const k = jit(1); f *= k; if (f2) f2 *= k; v = v * BOOST * layerGain;
  const s = AC.createBufferSource(); s.buffer = noiseBuf;
  const bq = AC.createBiquadFilter(); bq.type = 'bandpass'; bq.frequency.setValueAtTime(f, t0); bq.Q.value = q || 1;
  if (f2) bq.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  const g = AC.createGain(); g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  s.connect(bq); bq.connect(g); g.connect(sfxBus); s.start(t0); s.stop(t0 + d + 0.05);
}

// Play one clip of a bank key. v: gain (1 = a full-scale hit), opts: rate (pitch/speed), delay (s), jit (extra detune),
// i (force a variant). Picks a random variant that differs from the last one. Returns false when the clip is not
// available yet so callers can fall back to the synthesiser.
const lastPick = {};
export function sample(key, v = 1, opts = {}){
  if (!AC || save.muted) return false;
  const list = buffers[key]; if (!list) return false;
  const avail = list.map((b, i) => b ? i : -1).filter(i => i >= 0); if (!avail.length) return false;
  let i = opts.i != null ? opts.i : avail[Math.floor(Math.random() * avail.length)];
  if (opts.i == null && avail.length > 1 && i === lastPick[key]) i = avail[(avail.indexOf(i) + 1) % avail.length];
  lastPick[key] = i;
  const s = AC.createBufferSource(); s.buffer = list[i];
  const spread = (opts.jit != null ? opts.jit : 0.05) + jitter;
  s.playbackRate.value = (opts.rate || 1) * (1 + (Math.random() - 0.5) * 2 * spread);
  const g = AC.createGain(); g.gain.value = v * SAMPLE_GAIN * layerGain;
  s.connect(g); g.connect(sfxBus); s.start(AC.currentTime + (opts.delay || 0));
  return true;
}
const S = sample;

// Rate limiters for sounds that can fire many times a frame.
const last = {};
function gate(key, ms){ const n = performance.now(); if (n - (last[key] || 0) < ms) return false; last[key] = n; return true; }

// ---- synth building blocks: musical accents, and fallbacks while the bank decodes ----
const thump = (v = 0.06, f = 210) => { tone(f, 0.12, 'square', v, f * 0.38); noise(0.08, v * 3, 900, 1.5); };
const tap = (v = 0.05) => tone(900, 0.06, 'triangle', v, 600);
const heavy = (v = 0.14) => { tone(110, 0.32, 'sine', v, 50); noise(0.22, 0.28, 200, 0.8, 0, 90); };
const coinChime = (d = 0) => { tone(1320, 0.07, 'sine', 0.05, null, d); tone(1760, 0.12, 'sine', 0.05, null, d + 0.05); };
const sparkle = (d = 0, v = 0.035) => [1568, 2093, 2637].forEach((f, i) => tone(f, 0.09, 'sine', v, null, d + i * 0.04));
const groan = (f = 120, v = 0.09, d = 0.22) => { tone(f, d, 'sawtooth', v, f * 0.75); noise(d, 0.1, 500, 0.6, 0, 250); };
const cloth = (v = 0.14) => noise(0.12, v, 900, 0.9, 0, 300);
const clang = (v = 0.06) => { tone(2200, 0.15, 'triangle', v, 1500); noise(0.05, 0.12, 3000, 2); };
const splash = (v = 0.2, d = 0.25) => { noise(d, v, 600, 0.8, 0, 200); noise(d * 0.6, v * 0.5, 1800, 1, 0.03, 700); };
const squelch = (v = 0.16, f = 300) => { noise(0.15, v, f, 3); tone(f * 0.7, 0.12, 'sine', 0.06, f * 0.4); };
const cackle = (n = 3, f0 = 640, d = 0, v = 0.06) => { for (let i = 0; i < n; i++){ tone(f0 * Math.pow(0.94, i), 0.07, 'square', v, f0 * Math.pow(0.94, i) * 0.85, d + i * 0.1); noise(0.05, 0.08, 1500, 1.5, d + i * 0.1); } };
const shimmer = (d = 0, v = 0.04) => [1200, 1600, 2000, 2400, 3000, 2400, 3200].forEach((f, i) => tone(f, 0.1, 'sine', v, null, d + i * 0.035));
const bell = (f = 220, d = 0, v = 0.06) => { tone(f, 1.2, 'sine', v, null, d); tone(f * 1.5, 0.9, 'sine', v * 0.4, null, d); tone(f * 2.76, 0.5, 'sine', v * 0.25, null, d); };
const woosh = (up = false, v = 0.25) => noise(0.3, v, up ? 300 : 2000, 1.2, 0, up ? 2000 : 300);
const boomSynth = () => { noise(0.9, 0.45, 300, 0.6, 0, 120); tone(90, 0.6, 'sine', 0.22, 40); };

export const SFX = {
  // ---- board and legacy names still used around the code ----
  slide(){ S('swish', 0.55, { rate: 1.25, jit: 0.12 }) || noise(0.14, 0.14, 700, 1, 0, 260); S('pop', 0.3, { rate: 1.35, delay: 0.09 }); },   // a quick swish and a landing pop (owner: exciting, not dull)
  push(){ S('whistle', 0.45, { rate: 1.1 }) || S('swish', 0.55, { rate: 0.95 }) || noise(0.16, 0.16, 500, 1, 0, 200); S('thud', 0.35, { rate: 1.1, delay: 0.12 }); },   // a cartoon slide whistle as the row shoves over
  bad(){ S('uibad', 0.5, { rate: 0.6 }) || tone(190, 0.1, 'square', 0.05, 150); },
  launch(n){
    if (!gate('launch', 60)) return;
    if (!S('whoosh', 0.5 + Math.min(0.3, n * 0.05), { rate: 1.05 - n * 0.03 })) noise(0.3, 0.3 + Math.min(0.2, n * 0.04), 500, 1.4, 0, 2800 + n * 200);
    if (n >= 5){ S('whooshlong', 0.5, { delay: 0.04, rate: 0.9 }); tone(120, 0.2, 'sine', 0.12, 60); }
  },
  // a worn skin's accent under the launch whoosh, once per bunch and quiet (owner, 2026-09-27)
  skinLaunch(key){
    if (!gate('skinlaunch', 120)) return;
    switch (key){
      case 'frost': S('glassping', 0.3, { rate: 1.25, jit: 0.06 }) || tone(2200, 0.18, 'sine', 0.04, 2800); S('ice', 0.22, { rate: 1.3, delay: 0.03 }); break;   // crystalline chime
      case 'magma': S('fire', 0.35, { rate: 0.8 }) || noise(0.3, 0.16, 700, 0.9, 0, 200); tone(70, 0.25, 'sine', 0.08, 45); break;                             // low rumble and sizzle
      case 'candycorn': S('pop', 0.3, { rate: 1.35 }) || tap(); S('sparkle', 0.22, { rate: 1.4, delay: 0.04 }) || sparkle(0.04, 0.03); break;                  // sugary sparkle pop
      case 'galaxy': S('magic', 0.26, { rate: 1.15 }) || [0, 7, 12].forEach((k, i) => tone(880 * Math.pow(2, k / 12), 0.2, 'sine', 0.03, null, i * 0.05)); break;   // soft shimmer
    }
  },
  collect(){ S('pop', 0.5, { rate: 1.2 }) || (tone(880, 0.08, 'triangle', 0.07, 1320), tone(1320, 0.1, 'sine', 0.04, null, 0.06)); },
  smash(){ S('woodbreak', 0.6) || (noise(0.18, 0.3, 500, 0.8), tone(160, 0.12, 'square', 0.05, 90)); },
  hit(){ if (!gate('hit', 45)) return; S('thud', 0.6) || thump(); },
  freeze(){ S('ice', 0.5) || (tone(1400, 0.2, 'sine', 0.05, 2200), tone(1800, 0.25, 'triangle', 0.03, 2600, 0.05)); },
  knock(){ S('thud', 0.5, { rate: 0.7 }) || tone(120, 0.14, 'triangle', 0.1, 70); },
  chomp(){ if (!gate('chomp', 260)) return; S('crunch', 0.5) || noise(0.07, 0.12, 380, 2); },
  kill(){ S('pop', 0.5, { rate: 0.8 }) || tone(330, 0.18, 'triangle', 0.1, 700); },
  coin(){ if (!gate('coin', 70)) return; S('coin', 0.5) || coinChime(); },
  wallBreak(kind){ if (kind === 'castle'){ S('stonecrash', 0.9) || boomSynth(); S('boom', 0.35, { rate: 0.7, delay: 0.05 }); return; } S('woodbreak', 0.9) || (tone(140, 0.5, 'sawtooth', 0.14, 45), noise(0.5, 0.35, 300, 0.7)); },
  repair(){ [0, 0.14, 0.28].forEach(d => S('hammer', 0.55, { delay: d })); [0,4,7].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.16, 'square', 0.04, null, 0.36 + i * 0.07)); },
  boom(){ S('boom', 0.9) || boomSynth(); },
  win(){ S('win', 0.7); [523, 659, 784, 1046].forEach((f, i) => bell(f, 0.12 + i * 0.11)); S('sparkle', 0.4, { delay: 0.35 }); },   // a bright bell chime with a rising bell arpeggio, Mario Kart-like (owner)
  lose(){ S('lose', 0.8) || [0,-3,-7,-12].forEach((s, i) => tone(330 * Math.pow(2, s / 12), 0.42, 'sawtooth', 0.07, null, i * 0.18)); },
  boss(){ S('roarbig', 0.8) || (tone(70, 1.3, 'sawtooth', 0.11, 48), tone(104, 1.3, 'sawtooth', 0.07, 70)); },

  // ---- patch ----
  sprout(n){   // one soft pop per pumpkin, each a little higher
    if (!S('pop', 0.4, { rate: 1.05 })) tone(520, 0.14, 'sine', 0.045, 780);
    if (n > 1) S('pop', 0.35, { rate: 1.2, delay: 0.09 }) || tone(620, 0.14, 'sine', 0.04, 900, 0.09);
    if (n > 2) S('pop', 0.3, { rate: 1.35, delay: 0.18 }) || tone(720, 0.14, 'sine', 0.035, 1000, 0.18);
  },
  match(size, groups){   // one sparkly sound for any bunch (owner: no 3-vs-5 distinction); combos climb in pitch
    const g = Math.min(groups, 4), rate = 0.72 + (g - 1) * 0.05, base = 784 * Math.pow(2, (g - 1) * 3 / 12);   // deeper sparkle (owner): clip played slow, twinkle an octave lower
    S('sparkle', 0.7, { rate }) || sparkle(0, 0.05);
    [0, 4, 7, 12].forEach((s, i) => tone(base * Math.pow(2, s / 12), 0.2, 'sine', 0.04, null, 0.02 + i * 0.05));   // warm twinkle underneath
  },

  // ---- pumpkins hitting monsters (type = pumpkin index; size for Brown; rainbow adds a sparkle) ----
  pumpkinHit(type, size, rainbow){
    if (!gate('phit', 40)) return;
    layer(1, 0.05, () => this._phit(type, size, rainbow));
  },
  _phit(type, size, rainbow){
    if (__RELEASE__ >= 3 && type === BEIGE){ S('slime', 0.5, { rate: 0.9 }) || thump(); return; }   // Beige: a sticky splat
    if (__RELEASE__ >= 5 && type === -2){ S('slime', 0.5, { rate: 0.65 }) || thump(); return; }   // a rotten pumpkin (ROTTEN, engine/rot.js): a soft wet splat
    switch (type){
      case 1: S('thud', 0.6) || thump(); S('coin', 0.45, { delay: 0.02 }) || coinChime(0.02); break;                       // Yellow
      case 2: S('ice', 0.55) || (tone(1800, 0.14, 'sine', 0.05, 2600), noise(0.12, 0.16, 4000, 2, 0.02, 2000)); break;    // Ice
      case 3: S('fire', 0.6) || (noise(0.25, 0.22, 800, 0.9, 0, 200), [0, 0.07, 0.13].forEach(d => noise(0.03, 0.12, 2500, 3, d))); break;   // Fire
      case 4: S('thud', 0.6) || thump(); break;                                                                             // Grey: plain pumpkin thud on every monster it pierces (owner)
      case 7: S('boom', 0.9) || (noise(0.5, 0.4, 300, 0.6, 0, 90), tone(70, 0.45, 'sine', 0.2, 35)); break;                // Black
      case 8: S('zap', 0.6) || (noise(0.14, 0.3, 3000, 1.2, 0, 600), tone(900, 0.1, 'sawtooth', 0.06, 100)); break;       // Deep Blue
      case 10: S('pop', 0.5) || tap(); break;                                                                             // Turquoise
      case 11: if (size === 2) S('heavy', 0.8, { rate: 0.85 }) || heavy(); else if (size === 1) S('thud', 0.6) || thump(); else S('tap', 0.5) || tap(); break;   // Brown by size
      default: S('thud', 0.6) || thump();                                                                                 // Green, Purple, White, Pink
    }
    if (rainbow) S('sparkle', 0.45, { delay: 0.02 }) || sparkle(0.02);
  },
  // extra moments: heal, chain, splash, pierce, spawn, return, miss, burn
  extra(kind){
    switch (kind){
      case 'heal': S('heal', 0.5) || (noise(0.06, 0.18, 1200, 1.5), [660, 880, 1100].forEach((f, i) => tone(f, 0.16, 'sine', 0.05, null, 0.08 + i * 0.07))); break;
      case 'chain': if (gate('chain', 30)) S('zap', 0.4, { rate: 1.3 }) || noise(0.08, 0.14, 2600, 1.2, 0, 900); break;
      case 'splash': if (gate('splash', 30)) S('splash', 0.5) || tone(60, 0.2, 'sine', 0.1, 35); break;
      case 'pierce': break;   // no extra sound: each pierced monster just gets the normal pumpkin hit (owner)
      case 'glue': if (gate('glue', 60)) S('slime', 0.35, { rate: 0.8 }); break;   // Beige glue lands (Release 3)
      case 'rot': if (__RELEASE__ >= 5 && gate('rot', 80)) S('slime', 0.3, { rate: 0.55 }); break;   // a pumpkin goes rotten (Release 5)
      case 'blocked': if (__RELEASE__ >= 5 && gate('blocked', 60)) S('tap', 0.35, { rate: 0.7 }) || tap(); break;   // the wrong kind of pumpkin: a dull tap (Release 5)
      case 'spawn': S('warp', 0.4) || (tone(700, 0.08, 'sine', 0.07, 1100), sparkle(0.08)); break;
      case 'return': S('whooshlong', 0.5, { rate: 1.1 }) || (woosh(true, 0.18), tone(400, 0.12, 'sine', 0.05, 300, 0.3)); break;
      case 'miss': if (gate('miss', 80)) S('reverse', 0.35) || noise(0.35, 0.08, 1400, 1, 0, 400); break;
      case 'burn': if (gate('burn', 120)) noise(0.03, 0.09, 2800, 3); break;
      case 'freeze': SFX.freeze(); break;
    }
  },

  // ---- monsters: hit (blocked = clang/tock), death, own actions ----
  monsterHit(type, blocked){
    if (!gate('mhit', 40)) return;
    setTimeout(() => layer(1.6, 0.07, () => this._mhit(type, blocked)), 45);   // the flinch lands just after the thump so both are heard
  },
  _mhit(type, blocked){
    if (blocked){ if (type === 'knight') S('clank', 0.6) || clang(); else S('knock', 0.4) || tone(300, 0.06, 'square', 0.05, 200); return; }
    switch (type){
      case 'ghoul': S('ghoul', 0.5, { rate: 1.1 }) || groan(120, 0.09); break;
      case 'bat': S('bat', 0.45, { rate: 1.1 }) || (tone(1800, 0.06, 'square', 0.035, 2400), noise(0.05, 0.08, 2500, 1.5)); break;
      case (__RELEASE__ >= 4 ? 'crow' : ''): S('bat', 0.4, { rate: 0.8 }) || noise(0.05, 0.08, 2000, 1.5); break;   // the Strawlord's crows (Release 4)
      case 'imp': S('imp', 0.4) || tone(700, 0.12, 'sawtooth', 0.05, 1100); break;
      case (__RELEASE__ >= 7 ? 'flaskbearer' : ''): S('imp', 0.4, { rate: 1.1 }) || tone(760, 0.1, 'sawtooth', 0.05, 1150); S('glassping', 0.25, { delay: 0.03 }); break;   // the Flask Bearer squeaks and its bottles ring (Release 7)
      case (__RELEASE__ >= 7 ? 'toad' : ''): S('slime', 0.5, { rate: 0.7 }) || squelch(0.1, 300); break;   // the Cauldron Toad: a wet croak
      case 'rider': case (__RELEASE__ >= 5 ? 'comet' : ''): S('imp', 0.35) || tone(700, 0.08, 'sawtooth', 0.03, 900, 0.04); S('cloth', 0.35); break;
      case (__RELEASE__ >= 4 ? 'husker' : ''): case (__RELEASE__ >= 4 ? 'huskerBare' : ''): case (__RELEASE__ >= 4 ? 'huskerBurning' : ''): case (__RELEASE__ >= 4 ? 'huskerCharred' : ''): S('cloth', 0.4, { rate: 1.25 }) || cloth(); S('wood', 0.2); break;   // dry husk and a hollow cob (Release 4)
      case (__RELEASE__ >= 4 ? 'hayrick' : ''): case (__RELEASE__ >= 4 ? 'hayrickBurning' : ''): S('cloth', 0.45) || cloth(); S('heavy', 0.25, { rate: 0.9 }); break;
      case 'brute': S('giant', 0.55, { rate: 0.85, jit: 0.06 }) || (tone(80, 0.25, 'sawtooth', 0.09, 60), noise(0.15, 0.2, 150, 1)); S('heavy', 0.3, { rate: 0.9 }); break;   // Mossback: a low grunt over a heavy thud, tough not squeaky (owner)
      case 'hauler': case 'bulwark': S('giant', 0.6) || (tone(80, 0.25, 'sawtooth', 0.09, 60), noise(0.15, 0.2, 150, 1)); break;
      case 'mummy': S('cloth', 0.5) || cloth(); S('groan', 0.35, { rate: 1.1, delay: 0.03 }); break;
      case 'firemummy': S('cloth', 0.5) || cloth(); S('groan', 0.35, { rate: 1.1, delay: 0.03 }); noise(0.06, 0.14, 2500, 3, 0.05); break;
      case 'wisp': case 'wraith': case 'fogwalker': case (__RELEASE__ >= 5 ? 'reaper' : ''): case (__RELEASE__ >= 5 ? 'fogwalker2' : ''): case (__RELEASE__ >= 5 ? 'minipolt' : ''): S('ghost', 0.4) || cloth(); break;
      case 'doctor': case 'sailor': case 'archer': case (__RELEASE__ >= 5 ? 'rotdoctor' : ''): S('human', 0.55) || (noise(0.06, 0.16, 400, 2), noise(0.07, 0.12, 380, 2, 0.1)); break;
      case (__RELEASE__ >= 4 ? 'graveriser' : ''): S('human', 0.45, { rate: 0.85 }) || noise(0.06, 0.16, 400, 2); S('metallight', 0.2, { delay: 0.03 }); break;   // the Grave Riser grunts and its spade rings (Release 4)
      case 'knight': S('clank', 0.5) || clang(); S('human', 0.3, { delay: 0.04 }); break;
      case 'gargoyle': S('metal', 0.55) || (noise(0.1, 0.22, 1200, 1), tone(300, 0.1, 'square', 0.05, 150)); break;
      case 'vampire': S('chuckle', 0.5, { rate: 1.1 }) || noise(0.2, 0.16, 5000, 1.2, 0, 3000); break;
      case 'crawler': case 'diver': S('splash', 0.45) || noise(0.1, 0.18, 500, 0.8, 0, 250); break;
      case 'turtle': S('metal', 0.6, { rate: 0.7 }) || (tone(260, 0.1, 'triangle', 0.08, 180), noise(0.05, 0.12, 400, 2)); break;
      case 'slime': S('slime', 0.55) || squelch(); break;
      case 'blob': S('slime', 0.55, { rate: 0.8 }) || squelch(0.1, 500); break;
      case 'chameleon': case 'rchameleon': S('chameleon', 0.45) || (tone(1500, 0.05, 'sine', 0.05, 2200), tone(1500, 0.05, 'sine', 0.04, 2200, 0.07)); break;
      case 'mirror': S('glassping', 0.5) || tone(3000, 0.08, 'sine', 0.05, 2400); break;
      case 'witch': S('witch', 0.5) || cackle(2, 640); break;
      case (__RELEASE__ >= 7 ? 'ashcrone' : ''): S('witch', 0.45, { rate: 0.8 }) || cackle(2, 520); break;   // the Ash Crone: an older, lower cackle (Release 7)
      case (__RELEASE__ >= 7 ? 'covenwitch' : ''): S('witch', 0.5, { rate: 1.05 }) || cackle(2, 680); break;   // the Blood Coven Witch (Release 7)
      default: S('thud', 0.4, { rate: 0.9 }) || thump(0.05, 180);
    }
  },
  monsterDie(type){
    setTimeout(() => layer(1.5, 0.06, () => this._mdie(type)), 60);
  },
  _mdie(type){
    switch (type){
      case 'ghoul': S('ghouldie', 0.5) || groan(110, 0.1, 0.45); break;
      case 'bat': S('batdie', 0.45, { rate: 1.3 }) || S('pop', 0.4) || tone(2000, 0.05, 'square', 0.04, 2600); break;
      case (__RELEASE__ >= 4 ? 'crow' : ''): S('batdie', 0.45, { rate: 0.9 }) || S('pop', 0.4) || tone(1400, 0.05, 'square', 0.04, 1800); break;
      case 'imp': case 'rider': case (__RELEASE__ >= 5 ? 'comet' : ''): S('impdie', 0.45) || tone(900, 0.2, 'sawtooth', 0.06, 1500); break;
      case (__RELEASE__ >= 7 ? 'flaskbearer' : ''): S('impdie', 0.45, { rate: 1.1 }) || tone(900, 0.2, 'sawtooth', 0.06, 1500); S('glass', 0.45, { delay: 0.12 }); break;   // and the bottles shatter (Release 7)
      case (__RELEASE__ >= 7 ? 'toad' : ''): S('slimedie', 0.65, { rate: 0.75 }) || squelch(0.14, 260); S('splash', 0.45, { delay: 0.18 }); break;   // the Cauldron Toad swells and bursts
      case 'brute': S('giantdie', 0.6, { rate: 0.85 }) || (tone(70, 0.4, 'sawtooth', 0.1, 40), noise(0.3, 0.25, 120, 1)); S('heavy', 0.4, { rate: 0.8, delay: 0.1 }); break;
      case 'hauler': S('giantdie', 0.65) || (tone(70, 0.4, 'sawtooth', 0.1, 40), noise(0.3, 0.25, 120, 1)); break;
      case 'bulwark': S('giantdie', 0.6); S('armorbreak', 0.5, { delay: 0.05 }) || noise(0.3, 0.25, 120, 1); break;
      case 'mummy': case 'firemummy': S('ghouldie', 0.55, { rate: 0.85 }) || noise(0.25, 0.2, 500, 0.6, 0, 150); S('dig', 0.35, { delay: 0.1 }); break;
      case 'wisp': case 'wraith': case 'fogwalker': case (__RELEASE__ >= 5 ? 'reaper' : ''): case (__RELEASE__ >= 5 ? 'fogwalker2' : ''): case (__RELEASE__ >= 5 ? 'minipolt' : ''): S('ghostdie', 0.35, { rate: 1.05 }) || noise(0.35, 0.12, 1200, 0.8, 0, 300); break;
      case (__RELEASE__ >= 4 ? 'graveriser' : ''): S('humandie', 0.5, { rate: 0.85 }) || noise(0.2, 0.25, 3000, 1, 0.12, 1200); S('dig', 0.35, { delay: 0.15 }); break;   // it falls onto its spade (Release 4)
      case 'doctor': case 'sailor': case 'archer': case (__RELEASE__ >= 5 ? 'rotdoctor' : ''): S('humandie', 0.55) || (noise(0.07, 0.14, 400, 2), noise(0.2, 0.25, 3000, 1, 0.12, 1200)); break;
      case 'knight': S('armorbreak', 0.6) || [0, 0.08, 0.18].forEach(d => { tone(600, 0.12, 'square', 0.05, 200, d); noise(0.1, 0.18, 1800, 1.2, d); }); break;
      case 'gargoyle': S('stonebreak', 0.7) || noise(0.3, 0.3, 1000, 0.8, 0, 300); break;
      case 'vampire': S('chuckle', 0.5, { rate: 0.8 }) || (tone(800, 0.5, 'sawtooth', 0.07, 300), noise(0.5, 0.15, 800, 0.7, 0.2, 200)); S('bat', 0.4, { delay: 0.15 }); break;
      case 'crawler': case 'diver': S('splash', 0.7) || splash(0.18); break;
      case 'turtle': S('metal', 0.65, { rate: 0.6 }); S('splash', 0.5, { delay: 0.1 }) || (noise(0.25, 0.3, 900, 0.8, 0, 300), tone(200, 0.2, 'triangle', 0.08, 120)); break;
      case 'slime': case 'blob': S('slimedie', 0.6) || (tone(500, 0.06, 'sine', 0.08, 800), tone(560, 0.06, 'sine', 0.08, 900, 0.09)); break;
      case 'chameleon': case 'rchameleon': S('chameleon', 0.4, { rate: 1.3 }) || tone(1500, 0.04, 'sine', 0.05, 900); break;
      case 'mirror': S('glass', 0.6) || (noise(0.3, 0.25, 4000, 1, 0, 1500), [3000, 2500, 2000].forEach((f, i) => tone(f, 0.08, 'sine', 0.04, null, i * 0.05))); break;
      case 'witch': S('witchdie', 0.55) || (cackle(1, 700), noise(0.1, 0.16, 500, 1, 0.14)); break;
      case (__RELEASE__ >= 7 ? 'ashcrone' : ''): S('witchdie', 0.55, { rate: 0.8 }) || (cackle(1, 560), noise(0.1, 0.16, 400, 1, 0.14)); S('cloth', 0.3, { delay: 0.15 }); break;   // her rags crumple into ash (Release 7)
      case (__RELEASE__ >= 7 ? 'covenwitch' : ''): S('witchdie', 0.55, { rate: 1.05 }) || (cackle(1, 720), noise(0.1, 0.16, 500, 1, 0.14)); S('splash', 0.3, { delay: 0.12 }); break;   // and her cauldron spills (Release 7)
      default: S('pop', 0.5, { rate: 0.7 }) || tone(330, 0.18, 'triangle', 0.1, 700);
    }
  },
  monsterAct(type, what){
    switch (type + ':' + what){
      case 'archer:shoot': S('arrow', 0.5) || (tone(300, 0.08, 'triangle', 0.06, 900), noise(0.05, 0.1, 2000, 1)); break;
      case 'arrow:land': S('wood', 0.4) || (noise(0.08, 0.2, 800, 1), tone(180, 0.08, 'square', 0.05, 120)); break;
      case 'diver:surface': case 'turtle:rise': S('splash', 0.5) || splash(0.16); break;
      case 'crawler:rise': S('dig', 0.45) || splash(0.16); break;
      case 'diver:submerge': S('bubbles', 0.45) || (tone(300, 0.1, 'sine', 0.06, 150), noise(0.1, 0.12, 400, 1)); break;
      case 'diver:bolt': case 'water:bolt': S('bubbles', 0.5, { rate: 1.3 }) || noise(0.15, 0.2, 1200, 1, 0, 300); S('splash', 0.55, { rate: 1.15, delay: 0.03 }); break;   // liquid (owner)
      case 'water:land': S('splash', 0.6) || splash(0.2); S('bubbles', 0.3, { rate: 1.2, delay: 0.05 }); break;
      case 'wraith:vanish': S('reverse', 0.45) || noise(0.3, 0.12, 400, 0.8, 0, 1600); break;
      case 'wraith:return': S('ghost', 0.45) || noise(0.3, 0.12, 1600, 0.8, 0, 400); break;
      case 'hauler:freed': S('armorbreak', 0.4, { rate: 1.2 }) || (noise(0.06, 0.2, 1800, 2), [0.08, 0.16, 0.24].forEach(d => noise(0.04, 0.1, 300, 1, d))); break;
      case 'doctor:heal': if (gate('dheal', 300)) S('heal', 0.35, { rate: 0.9 }) || [880, 740, 620].forEach((f, i) => tone(f, 0.12, 'sine', 0.04, null, i * 0.06)); break;
      case 'vampire:heal': if (gate('vheal', 500)) S('chuckle', 0.4) || (tone(60, 0.1, 'sine', 0.08, 45), tone(60, 0.1, 'sine', 0.07, 45, 0.18)); break;
      case 'rider:break': S('cloth', 0.45) || noise(0.12, 0.2, 1200, 1, 0, 400); S('imp', 0.3, { delay: 0.05 }); break;
      case 'mirror:up': S('glassping', 0.4, { rate: 1.2 }) || tone(2400, 0.12, 'sine', 0.04, 3600); break;
      case 'mirror:reflect': S('glassping', 0.5, { rate: 0.8 }) || (tone(3200, 0.12, 'sine', 0.06, 2000), noise(0.06, 0.1, 5000, 2)); S('metallight', 0.3); break;
      case 'witch:hex': S('zap', 0.55, { rate: 0.9 }) || shimmer(); S('witch', 0.3, { delay: 0.12 }) || cackle(2, 620, 0.05, 0.04); break;
      case (__RELEASE__ >= 7 ? 'ashcrone:zone' : ''): S('zap', 0.5, { rate: 0.7 }) || shimmer(); S('ghost', 0.3, { delay: 0.1 }); break;   // the Ash Crone raises an undead zone (Release 7)
      case (__RELEASE__ >= 7 ? 'covenwitch:brew' : ''): S('bubbles', 0.5, { rate: 0.8 }) || noise(0.15, 0.2, 1200, 1, 0, 300); S('witch', 0.25, { delay: 0.12 }) || cackle(2, 660, 0.05, 0.04); break;   // the cauldron boils over (Release 7)
      case 'slime:split': S('slime', 0.5, { rate: 1.15 }) || (tone(500, 0.06, 'sine', 0.08, 800), tone(560, 0.06, 'sine', 0.08, 900, 0.09)); break;
      case (__RELEASE__ >= 4 ? 'husker:shed' : ''): S('cloth', 0.5, { rate: 1.4 }) || cloth(); S('whoosh', 0.3, { rate: 1.3, delay: 0.04 }) || noise(0.18, 0.16, 1500, 1, 0.04, 3000); break;   // the husk rips off and flies away (Release 4)
      case (__RELEASE__ >= 4 ? 'hayrick:toss' : ''): S('whoosh', 0.5, { rate: 0.85 }) || noise(0.25, 0.22, 900, 1.2, 0, 2400); S('metallight', 0.3, { delay: 0.35 }); break;   // the pitchfork flies, then bites into the pumpkin (Release 4)
      case 'firemummy:ignite': S('fire', 0.5) || (noise(0.2, 0.2, 700, 0.8, 0, 300), noise(0.05, 0.14, 2600, 3, 0.05)); break;
      case 'mummy:rise': S('dig', 0.45) || noise(0.25, 0.14, 600, 0.6, 0, 250); break;
      case (__RELEASE__ >= 4 ? 'graveriser:dig' : ''): S('dig', 0.55) || noise(0.25, 0.14, 600, 0.6, 0, 250); S('stonebreak', 0.25, { rate: 1.3, delay: 0.25 }); break;   // the spade bites, a headstone grinds up (Release 4)
      case (__RELEASE__ >= 4 ? 'crow:dive' : ''): S('bat', 0.45, { rate: 0.7 }) || noise(0.08, 0.1, 1800, 1.5); S('whoosh', 0.35, { rate: 1.4 }); break;   // a crow swoops into the patch (Release 4)
      case 'rooster:crow': S('scream', 0.3, { rate: 1.7 }) || (tone(700, 0.1, 'sawtooth', 0.06, 1100), tone(1100, 0.28, 'sawtooth', 0.06, 600, 0.1)); S('fire', 0.25, { delay: 0.05 }); break;   // Cinder Rooster (Release 4); no crow in the bank, so a pitched-up scream
      case 'knight:block': S('clank', 0.55) || clang(); break;
    }
  },

  // ---- bosses: arrive / casts / hit / die (docs/AUDIO.md §3) ----
  bossSfx(kind, ev){
    const k = kind + ':' + ev;
    switch (k){
      case 'gravekeeper:arrive': S('roarbig', 0.8) || (noise(0.4, 0.22, 1500, 0.8, 0, 400), bell(220, 0.3)); break;
      case 'gravekeeper:teleport': S('roar', 0.45, { rate: 1.1 }); S('warp', 0.65) || (woosh(false, 0.2), noise(0.25, 0.14, 250, 1, 0.1)); break;
      case 'gravekeeper:summon': S('dig', 0.6) || noise(0.3, 0.3, 200, 0.8, 0, 90); S('roar', 0.65, { delay: 0.05 }); break;
      case 'gravekeeper:shove': S('whoosh', 0.5, { rate: 0.8 }); S('roar', 0.65, { rate: 0.8 }) || ([0, 0.08, 0.16].forEach(d => noise(0.06, 0.16, 1400, 2, d)), tone(90, 0.3, 'sawtooth', 0.06, 60)); break;
      case 'gravekeeper:hit': S('roar', 0.6) || (tone(150, 0.15, 'square', 0.07, 60), groan(100, 0.05, 0.15)); break;
      case 'gravekeeper:die': S('roarbig', 0.9) || bell(196); S('stonebreak', 0.7, { delay: 0.5 }) || noise(0.5, 0.3, 200, 0.7, 0.7); break;
      case 'poltergeist:arrive': S('teleport', 0.6) || tone(400, 0.6, 'sine', 0.09, 900); S('ghost', 0.5, { delay: 0.3 }); break;
      case 'poltergeist:swap': S('ghost', 0.5, { rate: 1.1 }); S('teleport', 0.65, { rate: 1.2 }) || (woosh(true, 0.16), [1046, 1318].forEach((f, i) => tone(f, 0.15, 'sine', 0.05, null, 0.15 + i * 0.08))); break;
      case 'poltergeist:repaint': S('reverse', 0.5) || noise(0.2, 0.2, 800, 0.7, 0, 300); S('ghost', 0.4, { rate: 1.2, delay: 0.05 }); S('sparkle', 0.5, { delay: 0.1 }); break;
      case 'poltergeist:drift': S('ghost', 0.25) || noise(0.25, 0.06, 600, 0.6); break;
      case 'poltergeist:hit': S('ghost', 0.6) || tone(300, 0.2, 'triangle', 0.07, 200); S('glassping', 0.3, { delay: 0.03 }); break;
      case 'poltergeist:die': S('scream', 0.6) || tone(700, 1.4, 'sine', 0.1, 150); S('ghostdie', 0.5, { delay: 0.4 }); break;
      case 'hexwitch:arrive': S('witchlong', 0.7) || cackle(5, 720, 0, 0.08); break;                                              // witch laugh (owner)
      case 'hexwitch:hex': S('zap', 0.6, { rate: 0.85 }) || shimmer(); S('zap', 0.4, { rate: 1.1, delay: 0.12 }); S('witch', 0.45, { delay: 0.2 }) || cackle(2, 660, 0.02, 0.05); break;   // magic + brief "haha" together (owner)
      case 'hexwitch:zone': S('magic', 0.65) || shimmer(); S('sparkle', 0.4, { rate: 0.8, delay: 0.15 }); S('darkcast', 0.3, { rate: 0.8, delay: 0.1 }) || tone(50, 0.6, 'sine', 0.14, 40); S('witch', 0.35, { rate: 0.9, delay: 0.3 }) || cackle(2, 560, 0, 0.05); break;   // "hehe" + rumble (owner)
      case 'hexwitch:drift': noise(0.2, 0.1, 1200, 1, 0, 500); break;
      case 'hexwitch:hit': S('witch', 0.6) || tone(900, 0.1, 'sawtooth', 0.05, 1300); break;
      case 'hexwitch:die': S('witchdie', 0.7) || cackle(2, 700, 0, 0.07); S('boom', 0.5, { delay: 0.35 }) || noise(0.4, 0.3, 700, 0.8, 0.25, 200); break;
      case 'vampirecount:arrive': S('chuckle', 0.6, { rate: 0.8 }); S('chuckle', 0.45, { rate: 1.1, delay: 0.7 }) || [110, 138, 165, 220].forEach(f => tone(f, 1.2, 'sawtooth', 0.045)); [0.1, 0.25, 0.4].forEach(d => S('bat', 0.35, { delay: d }) || noise(0.05, 0.1, 2500, 1.5, d)); break;
      case 'vampirecount:burst': [0, 0.08, 0.16, 0.24].forEach(d => S('bat', 0.4, { delay: d, rate: 1.1 }) || noise(0.05, 0.12, 2500, 1.5, d)); break;
      case 'vampirecount:bats': [0, 0.09, 0.18].forEach(d => S('bat', 0.35, { delay: d }) || noise(0.05, 0.1, 2500, 1.5, d)); break;
      case 'vampirecount:wall': S('woodbreak', 0.5, { rate: 0.7 }) || noise(0.6, 0.22, 250, 2, 0, 120); break;
      case 'vampirecount:trance': S('chuckle', 0.55, { rate: 0.9 }) || cackle(3, 300); S('chuckle', 0.4, { rate: 1.15, delay: 0.6 }); break;   // a snicker; then only the quiet heartbeat (owner)
      case 'vampirecount:pulse': S('heartbeat', 0.5, { rate: 0.9 }) || (tone(62, 0.16, 'sine', 0.06, 48), tone(58, 0.14, 'sine', 0.05, 45, 0.16)); break;   // a clear heartbeat while the trance holds (owner could not hear the first one)
      case 'vampirecount:tick': tone(2000, 0.05, 'sine', 0.06, 2400); break;
      case 'vampirecount:break': S('glass', 0.5) || (noise(0.3, 0.3, 4000, 1, 0, 1500), tone(1500, 0.3, 'sine', 0.06, 600)); S('hiss', 0.4, { delay: 0.1 }); break;
      case 'vampirecount:hit': S('chuckle', 0.55, { rate: 1.05 }) || noise(0.2, 0.16, 5000, 1.2, 0, 3000); break;
      case 'vampirecount:die': S('chuckle', 0.55, { rate: 0.7 }) || (tone(800, 0.6, 'sawtooth', 0.09, 300), noise(0.8, 0.2, 800, 0.7, 0.4, 150)); S('bat', 0.4, { delay: 0.3 }); S('boom', 0.4, { delay: 0.6 }); break;
      case 'twintides:arrive': S('seabig', 0.7) || (tone(90, 0.5, 'sawtooth', 0.1, 60, 0.2), tone(120, 0.5, 'sawtooth', 0.08, 80, 0.3)); S('splash', 0.6) || splash(0.3, 0.5); break;
      case 'twintides:bolt': S('bubbles', 0.55, { rate: 1.2 }); S('splash', 0.6, { rate: 1.1, delay: 0.03 }) || noise(0.15, 0.2, 1200, 1, 0.1, 300); S('splash', 0.4, { delay: 0.05 }) || splash(0.16, 0.2); break;
      case 'twintides:down': S('splash', 0.8) || splash(0.25, 0.4); S('seabark', 0.5, { rate: 0.8, delay: 0.1 }) || tone(200, 0.4, 'sine', 0.06, 120, 0.2); break;
      case 'twintides:revive': S('bubbles', 0.65) || noise(0.6, 0.2, 300, 0.8, 0, 900); S('seabark', 0.6, { delay: 0.4 }); break;
      case 'twintides:hit': S('seabark', 0.6) || (noise(0.1, 0.18, 500, 0.8, 0, 250), tone(110, 0.15, 'sawtooth', 0.05, 80)); S('splash', 0.3, { delay: 0.03 }); break;
      case 'twintides:die': S('seabig', 0.8, { rate: 0.8 }) || (tone(90, 0.7, 'sawtooth', 0.1, 50), tone(120, 0.7, 'sawtooth', 0.08, 70, 0.15)); S('splash', 0.7, { delay: 0.3 }); S('bubbles', 0.5, { delay: 0.8 }) || noise(1.2, 0.25, 500, 0.6, 0.3, 150); break;
      // The Hollow King (Release 3; owner 2026-11-03: scary): slowed growls, a deep bell toll and a low drone under every big moment
      case 'hollowking:arrive': bell(55, 0, 0.12); bell(55, 1.1, 0.1); tone(41, 2.4, 'sawtooth', 0.05, 30); S('roarbig', 1, { rate: 0.6, delay: 0.2 }); S('reverse', 0.6, { rate: 0.7 }); S('darkcast', 0.6, { rate: 0.8, delay: 0.9 }); S('scream', 0.35, { rate: 0.55, delay: 1.3 }); break;
      case 'hollowking:hit': S('roar', 0.55, { rate: 0.7 }); break;
      // The Strawlord (Release 4): creaking wood and cloth, a flurry of wings for its crows (the bat samples), fire when it tears free
      case (__RELEASE__ >= 4 ? 'fallengravekeeper:arrive' : ''): S('roarbig', 0.85, { rate: 0.85 }) || bell(196); S('fire', 0.55, { delay: 0.2 }); S('bat', 0.35, { delay: 0.5, rate: 0.8 }); break;   // the Fallen Gravekeeper (Release 4): the Gravekeeper's voice, lower, with fire
      case (__RELEASE__ >= 4 ? 'fallengravekeeper:teleport' : ''): S('warp', 0.6, { rate: 0.85 }) || woosh(false, 0.2); S('fire', 0.4, { delay: 0.1 }); break;
      case (__RELEASE__ >= 4 ? 'fallengravekeeper:summon' : ''): S('dig', 0.6) || noise(0.3, 0.3, 200, 0.8, 0, 90); S('roar', 0.55, { rate: 0.85, delay: 0.05 }); break;
      case (__RELEASE__ >= 4 ? 'fallengravekeeper:smash' : ''): S('stonebreak', 0.7, { rate: 0.8 }) || noise(0.4, 0.3, 300, 0.8); S('fire', 0.6, { delay: 0.1 }); S('roarbig', 0.5, { rate: 0.9, delay: 0.05 }); break;
      case (__RELEASE__ >= 4 ? 'fallengravekeeper:inferno' : ''): S('fire', 0.8) || noise(0.6, 0.3, 700, 0.7); S('whoosh', 0.5, { rate: 0.7, delay: 0.1 }); S('roarbig', 0.6, { rate: 0.8, delay: 0.2 }); break;
      case (__RELEASE__ >= 4 ? 'fallengravekeeper:crows' : ''): [0, 0.08, 0.16].forEach(d => S('bat', 0.35, { delay: d, rate: 0.75 + d }) || noise(0.05, 0.1, 2500, 1.5, d)); break;
      case (__RELEASE__ >= 4 ? 'fallengravekeeper:hit' : ''): S('roar', 0.55, { rate: 0.85 }) || (tone(150, 0.15, 'square', 0.07, 60), groan(100, 0.05, 0.15)); break;
      case (__RELEASE__ >= 4 ? 'fallengravekeeper:die' : ''): S('roarbig', 0.9, { rate: 0.85 }) || bell(196); S('fire', 0.6, { delay: 0.2 }); S('stonebreak', 0.7, { delay: 0.5 }) || noise(0.5, 0.3, 200, 0.7, 0.7); break;
      case (__RELEASE__ >= 4 ? 'strawlord:arrive' : ''): S('creak', 0.6) || noise(0.4, 0.2, 500, 1); S('cloth', 0.45, { delay: 0.2 }); [0.35, 0.45, 0.55].forEach(d => S('bat', 0.35, { delay: d, rate: 0.8 })); S('roar', 0.45, { rate: 1.2, delay: 0.5 }); break;
      case (__RELEASE__ >= 4 ? 'strawlord:flock' : ''): S('cloth', 0.5, { rate: 0.8 }) || cloth(); [0, 0.07, 0.14, 0.21, 0.28].forEach(d => S('bat', 0.35, { delay: d, rate: 0.75 + d }) || noise(0.05, 0.1, 2500, 1.5, d)); break;
      case (__RELEASE__ >= 4 ? 'strawlord:tear' : ''): S('woodbreak', 0.7) || noise(0.4, 0.3, 300, 0.8); S('metallight', 0.4, { delay: 0.15 }); S('fire', 0.5, { delay: 0.3 }); S('roarbig', 0.55, { rate: 1.15, delay: 0.4 }); break;
      case (__RELEASE__ >= 4 ? 'strawlord:move' : ''): S('whoosh', 0.45, { rate: 0.85 }) || woosh(false, 0.16); S('cloth', 0.3, { delay: 0.05 }); break;
      case (__RELEASE__ >= 4 ? 'strawlord:hit' : ''): S('cloth', 0.5) || cloth(); S('wood', 0.3, { delay: 0.03 }); break;
      case (__RELEASE__ >= 4 ? 'strawlord:die' : ''): S('fire', 0.6) || noise(0.5, 0.3, 600, 0.7); S('woodbreak', 0.6, { delay: 0.1 }); S('roarbig', 0.6, { rate: 1.1, delay: 0.2 }); [0.4, 0.5, 0.6].forEach(d => S('bat', 0.3, { delay: d })); break;
      // The Lamplighter (Release 5): a ghost's moan and a sputtering lantern; the glass rings when the flame changes colour (higher for clean, lower for rot)
      case (__RELEASE__ >= 5 ? 'lamplighter:arrive' : ''): S('ghost', 0.6, { rate: 0.7 }) || cloth(); S('torch', 0.5, { delay: 0.3 }); S('darkcast', 0.4, { rate: 0.8, delay: 0.5 }); break;
      case (__RELEASE__ >= 5 ? 'lamplighter:clean' : ''): S('torch', 0.55) || noise(0.08, 0.2, 2500, 1.5); S('glassping', 0.4, { rate: 1.2, delay: 0.05 }) || bell(660, 0.05, 0.04); break;
      case (__RELEASE__ >= 5 ? 'lamplighter:rot' : ''): S('torch', 0.55, { rate: 0.8 }) || noise(0.08, 0.2, 1500, 1.5); S('glassping', 0.4, { rate: 0.7, delay: 0.05 }) || bell(330, 0.05, 0.04); S('slime', 0.3, { rate: 0.6, delay: 0.1 }); break;
      case (__RELEASE__ >= 5 ? 'lamplighter:move' : ''): S('warp', 0.45, { rate: 0.8 }) || woosh(false, 0.16); S('cloth', 0.3, { delay: 0.05 }); break;
      case (__RELEASE__ >= 5 ? 'lamplighter:fog' : ''): S('hiss', 0.45, { rate: 0.8 }) || noise(0.5, 0.15, 900, 0.8); S('wind', 0.35, { delay: 0.1 }); break;
      case (__RELEASE__ >= 5 ? 'lamplighter:hit' : ''): S('ghost', 0.45, { rate: 0.9 }) || cloth(); S('metallight', 0.25, { delay: 0.03 }); break;
      case (__RELEASE__ >= 5 ? 'lamplighter:die' : ''): S('ghostdie', 0.7, { rate: 0.8 }) || noise(0.5, 0.2, 1200, 0.8); S('glass', 0.5, { delay: 0.15 }); S('torch', 0.4, { rate: 0.7, delay: 0.3 }); break;
      // The Fallen Poltergeist (Release 5): the Poltergeist's voice, lower and wetter; black fog hisses, the reaper's scythe whooshes in
      case (__RELEASE__ >= 5 ? 'fallenpoltergeist:arrive' : ''): S('teleport', 0.6, { rate: 0.75 }) || tone(300, 0.6, 'sine', 0.09, 700); S('ghost', 0.6, { rate: 0.7, delay: 0.3 }); S('darkcast', 0.45, { rate: 0.7, delay: 0.55 }); break;
      case (__RELEASE__ >= 5 ? 'fallenpoltergeist:vanish' : ''): S('teleport', 0.55, { rate: 0.85 }) || woosh(false, 0.16); S('hiss', 0.3, { rate: 0.7, delay: 0.05 }); break;
      case (__RELEASE__ >= 5 ? 'fallenpoltergeist:swap' : ''): S('ghost', 0.5, { rate: 0.85 }); S('teleport', 0.6, { rate: 1 }) || woosh(true, 0.16); break;
      case (__RELEASE__ >= 5 ? 'fallenpoltergeist:shuffle' : ''): S('reverse', 0.6, { rate: 0.7 }) || noise(0.4, 0.2, 700, 0.7, 0, 250); S('whoosh', 0.55, { rate: 0.7, delay: 0.05 }); S('ghost', 0.5, { rate: 0.75, delay: 0.15 }); break;
      case (__RELEASE__ >= 5 ? 'fallenpoltergeist:fog' : ''): S('hiss', 0.5, { rate: 0.7 }) || noise(0.5, 0.15, 700, 0.8); S('slime', 0.35, { rate: 0.6, delay: 0.1 }); break;
      case (__RELEASE__ >= 5 ? 'fallenpoltergeist:reaper' : ''): S('whoosh', 0.6, { rate: 0.6 }) || woosh(false, 0.2); S('darkcast', 0.6, { rate: 0.75, delay: 0.05 }); S('scream', 0.35, { rate: 0.7, delay: 0.2 }); break;
      case (__RELEASE__ >= 5 ? 'fallenpoltergeist:reaperend' : ''): S('reverse', 0.45, { rate: 0.9 }) || noise(0.2, 0.15, 900, 0.7); S('glassping', 0.3, { rate: 0.8, delay: 0.05 }); break;
      case (__RELEASE__ >= 5 ? 'fallenpoltergeist:hit' : ''): S('ghost', 0.55, { rate: 0.8 }) || tone(260, 0.2, 'triangle', 0.07, 180); S('slime', 0.25, { delay: 0.03 }); break;
      case (__RELEASE__ >= 5 ? 'fallenpoltergeist:die' : ''): S('scream', 0.6, { rate: 0.75 }) || tone(600, 1.4, 'sine', 0.1, 120); S('ghostdie', 0.6, { rate: 0.8, delay: 0.4 }); S('hiss', 0.4, { delay: 0.6 }); break;
      case 'hollowking:immune': S('clank', 0.5, { rate: 0.8 }) || tone(300, 0.08, 'square', 0.05); break;
      case 'hollowking:tell': S('darkcast', 0.8, { rate: 0.7 }); S('witchlong', 0.45, { rate: 0.6 }); tone(55, 0.9, 'sawtooth', 0.05, 110); break;
      case 'hollowking:wipe': S('stonecrash', 0.9, { rate: 0.8 }) || noise(0.4, 0.3, 300, 0.7); S('roar', 0.5, { rate: 0.6 }); break;
      case 'hollowking:smash': S('hammer', 0.9, { rate: 0.7 }); S('boom', 0.6, { delay: 0.05 }); S('roarbig', 0.6, { rate: 0.65, delay: 0.1 }); break;
      case 'hollowking:summon': S('darkcast', 0.7, { rate: 0.75 }); S('dig', 0.6); S('roar', 0.6, { rate: 0.65, delay: 0.1 }); tone(48, 1, 'sawtooth', 0.05, 36); break;
      case 'hollowking:split': bell(65, 0, 0.12); S('reverse', 0.6, { rate: 0.6 }); S('teleport', 0.7, { rate: 0.6, delay: 0.15 }); S('roarfar', 0.7, { rate: 0.7, delay: 0.35 }); break;
      case 'hollowking:die': S('scream', 0.6, { rate: 0.6 }); S('roarbig', 1, { rate: 0.5, delay: 0.1 }); bell(49, 0.4, 0.13); bell(49, 1.6, 0.1); S('stonebreak', 0.9, { delay: 0.8 }); tone(60, 2.5, 'sawtooth', 0.06, 25, 0.3); break;
      default: SFX.boss();
    }
  },

  // ---- tools ----
  tool(key){
    switch (key){
      case 'repair': SFX.repair(); break;
      case 'fw': S('rocket', 0.6) || noise(0.25, 0.2, 400, 1, 0, 2500); S('boom', 0.8, { delay: 0.55 }) || boomSynth(); break;
      case 'buster': S('dig', 0.5) || noise(0.15, 0.25, 500, 1, 0, 200); S('stonebreak', 0.6, { delay: 0.1 }) || (noise(0.1, 0.3, 1500, 1, 0.15, 500), tone(200, 0.15, 'square', 0.06, 100, 0.15)); break;
      case 'lantern': S('torch', 0.55) || (noise(0.08, 0.2, 2500, 1.5), tone(600, 0.4, 'sine', 0.04, 900, 0.08)); break;
      case 'mine': S('woodtap', 0.5, { rate: 0.8 }) || S('uitap', 0.5, { rate: 0.8 }) || tone(1500, 0.03, 'square', 0.05, 1200); break;
      case 'mineBoom': S('explode', 0.8) || boomSynth(); S('boom', 0.5, { delay: 0.03 }); break;
      case 'bomb': S('boom', 1, { rate: 0.85 }) || boomSynth(); S('explode', 0.6, { delay: 0.05 }); break;
      case 'scarecrow': S('creak', 0.5) || [0, 0.15].forEach(d => { tone(120, 0.12, 'sine', 0.1, 80, d); noise(0.06, 0.18, 800, 1, d); }); S('cloth', 0.4, { delay: 0.1 }); break;
      case 'aim': tone(1200, 0.05, 'sine', 0.04, 1500); break;
    }
  },

  // ---- menus and buttons (docs/AUDIO.md §4) ----
  ui(kind){
    switch (kind){
      case 'tap': S('uitap', 0.5, { jit: 0.1 }) || tone(900, 0.05, 'sine', 0.05, 700); break;                                             // any menu button
      case 'go': S('uigo', 0.55, { rate: 1.1 }) || S('whoosh', 0.3, { rate: 1.3 }) || (tone(660, 0.08, 'triangle', 0.06, null), tone(880, 0.12, 'triangle', 0.06, null, 0.07)); break;   // start / next / got it
      case 'back': S('uiback', 0.5) || S('reverse', 0.3) || (tone(660, 0.08, 'triangle', 0.05, null), tone(520, 0.12, 'triangle', 0.05, null, 0.07)); break; // back / quit
      case 'level': S('uilevel', 0.55, { rate: 1.05, jit: 0.08 }) || (tone(1046, 0.1, 'triangle', 0.07, 1300), noise(0.04, 0.08, 3000, 2)); break;          // level tile
      case 'pick': S('uipick', 0.5, { rate: 1.2 }) || tone(700, 0.08, 'sine', 0.06, 1000); break;                                            // pumpkin picked
      case 'unpick': S('uiunpick', 0.45, { rate: 0.85 }) || tone(1000, 0.08, 'sine', 0.05, 700); break;                                       // pumpkin dropped from the loadout
      case 'locked': S('uibad', 0.5, { rate: 0.6 }) || tone(190, 0.1, 'square', 0.05, 150); break;                                          // tapping a locked pick
    }
  },
  // ---- chewing the wall: one clearly audible bite every third of a second, flavoured by who is chewing ----
  chew(type){
    if (!gate('chew', 330)) return;
    layer(1.2, 0.08, () => this._chew(type));
  },
  _chew(type){
    switch (type){
      case 'knight': case 'bulwark': case 'gargoyle': S('metallight', 0.45) || (noise(0.08, 0.22, 2200, 1.5), tone(400, 0.08, 'square', 0.05, 250)); break;   // metal or stone scraping wood
      case 'slime': case 'blob': case 'crawler': case 'diver': case (__RELEASE__ >= 7 ? 'toad' : ''): S('slime', 0.4, { rate: 0.9 }) || (noise(0.1, 0.22, 350, 2.5), tone(180, 0.08, 'sine', 0.06, 120)); break;   // wet
      case 'turtle': S('metallight', 0.45, { rate: 0.7 }) || (tone(240, 0.1, 'triangle', 0.09, 160), noise(0.06, 0.16, 600, 1.5)); break;                                       // hollow knock
      case 'bat': S('crunch', 0.3, { rate: 1.4 }) || (noise(0.05, 0.18, 2500, 2), noise(0.05, 0.14, 2200, 2, 0.08)); break;                                 // quick nibbles
      default: S('crunch', 0.5) || (noise(0.09, 0.28, 700, 1.2, 0, 300), tone(150, 0.09, 'square', 0.07, 90));                                              // wood being gnawed
    }
  },

  // ---- worn costume hit accents (owner, 2026-09-27): quiet, gated so a busy fight never stacks them ----
  costumeHit(key){
    if (!gate('costume', 160)) return;
    switch (key){
      case 'poltergeist': S('ghost', 0.32, { rate: 0.8, jit: 0.1 }) || noise(0.3, 0.1, 700, 0.7, 0, 250); S('whoosh', 0.22, { rate: 0.75 }); break;   // a hollow whoosh
      case 'vampirecount': S('cloth', 0.25, { rate: 1.4 }); break;
      case 'twintides': S('slime', 0.25, { rate: 1.3 }) || noise(0.12, 0.12, 1800, 1.5); break;
      case 'hexwitch': S('glassping', 0.18, { rate: 1.3 }); break;
      case 'pirate': S('coin', 0.2, { rate: 1.1 }); break;
      case 'starcrown': S('sparkle', 0.3, { rate: 1.15 }) || sparkle(0, 0.03); [0, 4, 7].forEach((k, i) => tone(1046 * Math.pow(2, k / 12), 0.18, 'sine', 0.025, null, 0.03 + i * 0.04)); break;   // a bright chime
    }
  },

  // ---- boss warning: two alarm blasts while the music ducks (owner) ----
  bossAlert(){ S('siren', 0.7) || [0, 0.5, 1.0, 1.5].forEach(d => tone(600, 0.45, 'sawtooth', 0.06, 900, d)); musicDuck(0.25, 3.5); },   // a blaring siren while the music ducks (owner)

  // ---- walls, wind, fog, level ----
  wallHit(kind){ if (!gate('wall', 120)) return; if (kind === 'castle'){ S('stone', 0.7) || (noise(0.1, 0.25, 500, 1), tone(120, 0.12, 'square', 0.06, 80)); return; } S('wood', 0.55) || (noise(0.1, 0.22, 800, 1), tone(200, 0.1, 'square', 0.05, 150)); },
  wallDown(kind){ SFX.wallBreak(kind); },
  alarm(){ if (!gate('alarm', 500)) return; tone(220, 0.1, 'square', 0.08, 220); tone(220, 0.1, 'square', 0.06, 220, 0.15); },
  wind(phase){
    if (phase === 'warn') S('wind', 0.35, { rate: 1.2 }) || noise(0.9, 0.09, 2000, 0.5, 0, 1200);
    else { S('wind', 0.7) || (noise(0.5, 0.28, 600, 0.9, 0, 200), tone(180, 0.2, 'sine', 0.05, 120)); S('cloth', 0.4, { delay: 0.1 }); }
  },
  lanternLit(){ S('torch', 0.4) || noise(0.08, 0.2, 2500, 1.5); },
  levelStart(){ S('uigo', 0.4); tone(500, 0.25, 'sine', 0.06, 420); tone(500, 0.3, 'sine', 0.05, 400, 0.3); [0,4,7].forEach((s, i) => tone(262 * Math.pow(2, s / 12), 0.5, 'triangle', 0.05, null, 0.5 + i * 0.05)); },
  perk(){ S('magic', 0.6); [0,4,7,12,16].forEach((s, i) => tone(523 * Math.pow(2, s / 12), 0.25, 'sine', 0.08, null, i * 0.08)); },
  star(){ S('uistar', 0.5) || tone(1568, 0.2, 'sine', 0.07, 1760); },
};

/** Apply the saved music and sound-effects volumes (0–1) to their buses. */
export function applyVolumes(){
  if (!AC || !sfxBus) return;
  const t = AC.currentTime, vol = x => (x == null ? 1 : Math.max(0, Math.min(1, x)));
  sfxBus.gain.setTargetAtTime(vol(save.sfxVol), t, 0.03); musicBus.gain.setTargetAtTime(vol(save.musicVol), t, 0.03);
}
