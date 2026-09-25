import { save } from '../save.js';

// ---------- Audio ----------

export let AC = null, master = null, noiseBuf = null, lastCoin = 0, lastHit = 0, lastThrow = 0, lastChomp = 0;

export function ensureAudio(){
  try {
    if (!AC){
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      AC = new A(); master = AC.createGain(); master.gain.value = 0.45; master.connect(AC.destination);
      noiseBuf = AC.createBuffer(1, Math.floor(AC.sampleRate * 1), AC.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) {}
}

export function tone(f, d, type, v, f2, delay){
  if (!AC || save.muted) return;
  const t0 = AC.currentTime + (delay || 0);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v || 0.15, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + d + 0.05);
}

export function noise(d, v, f, q, delay, f2){
  if (!AC || save.muted) return;
  const t0 = AC.currentTime + (delay || 0);
  const s = AC.createBufferSource(); s.buffer = noiseBuf;
  const bq = AC.createBiquadFilter(); bq.type = 'bandpass'; bq.frequency.setValueAtTime(f, t0); bq.Q.value = q || 1;
  if (f2) bq.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  const g = AC.createGain(); g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  s.connect(bq); bq.connect(g); g.connect(master); s.start(t0); s.stop(t0 + d + 0.05);
}

export const SFX = {
  slide(){ noise(0.14, 0.14, 700, 1, 0, 260); },
  push(){ noise(0.16, 0.16, 500, 1, 0, 200); tone(150, 0.12, 'triangle', 0.06, 110); },
  bad(){ tone(190, 0.1, 'square', 0.05, 150); },
  match(n, groups){ const base = 440 * Math.pow(2, (groups - 1) * 3 / 12); [0,4,7,12,16].slice(0, Math.min(5, n)).forEach((s, i) => tone(base * Math.pow(2, s / 12), 0.18, 'triangle', 0.1, null, i * 0.05)); },
  launch(n){ const t = performance.now(); if (t - lastThrow < 60) return; lastThrow = t; noise(0.3, 0.3 + Math.min(0.2, n * 0.04), 500, 1.4, 0, 2800); },
  sprout(){ tone(480, 0.12, 'sine', 0.06, 880); },
  collect(){ tone(880, 0.08, 'triangle', 0.07, 1320); tone(1320, 0.1, 'sine', 0.04, null, 0.06); },
  smash(){ noise(0.18, 0.3, 500, 0.8); tone(160, 0.12, 'square', 0.05, 90); },
  hit(){ const n = performance.now(); if (n - lastHit < 45) return; lastHit = n; tone(210, 0.12, 'square', 0.06, 80); noise(0.08, 0.18, 900, 1.5); },
  freeze(){ tone(1400, 0.2, 'sine', 0.05, 2200); tone(1800, 0.25, 'triangle', 0.03, 2600, 0.05); },
  knock(){ tone(120, 0.14, 'triangle', 0.1, 70); },
  chomp(){ const n = performance.now(); if (n - lastChomp < 260) return; lastChomp = n; noise(0.07, 0.12, 380, 2); },
  kill(){ tone(330, 0.18, 'triangle', 0.1, 700); },
  coin(){ const n = performance.now(); if (n - lastCoin < 70) return; lastCoin = n; tone(1320, 0.07, 'sine', 0.05); tone(1760, 0.12, 'sine', 0.05, null, 0.05); },
  wallBreak(){ tone(140, 0.5, 'sawtooth', 0.14, 45); noise(0.5, 0.35, 300, 0.7); },
  repair(){ [0,4,7].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.16, 'square', 0.05, null, i * 0.07)); },
  boom(){ noise(0.9, 0.45, 300, 0.6, 0, 120); tone(90, 0.6, 'sine', 0.22, 40); },
  win(){ [0,4,7,12].forEach((s, i) => tone(523 * Math.pow(2, s / 12), 0.32, 'triangle', 0.12, null, i * 0.12)); },
  lose(){ [0,-3,-7,-12].forEach((s, i) => tone(330 * Math.pow(2, s / 12), 0.42, 'sawtooth', 0.07, null, i * 0.18)); },
  boss(){ tone(70, 1.3, 'sawtooth', 0.11, 48); tone(104, 1.3, 'sawtooth', 0.07, 70); },
};
