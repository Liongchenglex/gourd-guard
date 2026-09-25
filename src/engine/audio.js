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

// Rate limiters for sounds that can fire many times a frame.
const last = {};
function gate(key, ms){ const n = performance.now(); if (n - (last[key] || 0) < ms) return false; last[key] = n; return true; }

// ---- small building blocks (docs/AUDIO.md) ----
const thump = (v = 0.06, f = 210) => { tone(f, 0.12, 'square', v, f * 0.38); noise(0.08, v * 3, 900, 1.5); };          // neutral pumpkin thump
const tap = (v = 0.05) => tone(900, 0.06, 'triangle', v, 600);                                                        // light tap (Turquoise)
const heavy = (v = 0.14) => { tone(110, 0.32, 'sine', v, 50); noise(0.22, 0.28, 200, 0.8, 0, 90); };                   // big Brown / heavy body
const coinChime = (d = 0) => { tone(1320, 0.07, 'sine', 0.05, null, d); tone(1760, 0.12, 'sine', 0.05, null, d + 0.05); };
const sparkle = (d = 0, v = 0.035) => [1568, 2093, 2637].forEach((f, i) => tone(f, 0.09, 'sine', v, null, d + i * 0.04));
const groan = (f = 120, v = 0.09, d = 0.22) => { tone(f, d, 'sawtooth', v, f * 0.75); noise(d, 0.1, 500, 0.6, 0, 250); };
const cloth = (v = 0.14) => noise(0.12, v, 900, 0.9, 0, 300);
const clang = (v = 0.06) => { tone(2200, 0.15, 'triangle', v, 1500); noise(0.05, 0.12, 3000, 2); };
const splash = (v = 0.2, d = 0.25) => { noise(d, v, 600, 0.8, 0, 200); noise(d * 0.6, v * 0.5, 1800, 1, 0.03, 700); };
const squelch = (v = 0.16, f = 300) => { noise(0.15, v, f, 3); tone(f * 0.7, 0.12, 'sine', 0.06, f * 0.4); };
const cackle = (n = 3, f0 = 640, d = 0, v = 0.06) => { for (let i = 0; i < n; i++){ tone(f0 * Math.pow(0.94, i), 0.07, 'square', v, f0 * Math.pow(0.94, i) * 0.85, d + i * 0.1); noise(0.05, 0.08, 1500, 1.5, d + i * 0.1); } };
const shimmer = (d = 0, v = 0.04) => [1200, 1600, 2000, 2400, 3000, 2400, 3200].forEach((f, i) => tone(f, 0.1, 'sine', v, null, d + i * 0.035));
const bell = (f = 220, d = 0) => { tone(f, 1.2, 'sine', 0.12, null, d); tone(f * 1.5, 0.9, 'sine', 0.05, null, d); tone(f * 2.76, 0.5, 'sine', 0.03, null, d); };
const woosh = (up = false, v = 0.25) => noise(0.3, v, up ? 300 : 2000, 1.2, 0, up ? 2000 : 300);

export const SFX = {
  // ---- legacy names still used around the code ----
  slide(){ noise(0.14, 0.14, 700, 1, 0, 260); },
  push(){ noise(0.16, 0.16, 500, 1, 0, 200); tone(150, 0.12, 'triangle', 0.06, 110); },
  bad(){ tone(190, 0.1, 'square', 0.05, 150); },
  launch(n){ if (!gate('launch', 60)) return; noise(0.3, 0.3 + Math.min(0.2, n * 0.04), 500, 1.4, 0, 2800 + n * 200); if (n >= 5) tone(120, 0.2, 'sine', 0.12, 60); },
  collect(){ tone(880, 0.08, 'triangle', 0.07, 1320); tone(1320, 0.1, 'sine', 0.04, null, 0.06); },
  smash(){ noise(0.18, 0.3, 500, 0.8); tone(160, 0.12, 'square', 0.05, 90); },
  hit(){ if (!gate('hit', 45)) return; thump(); },
  freeze(){ tone(1400, 0.2, 'sine', 0.05, 2200); tone(1800, 0.25, 'triangle', 0.03, 2600, 0.05); },
  knock(){ tone(120, 0.14, 'triangle', 0.1, 70); },
  chomp(){ if (!gate('chomp', 260)) return; noise(0.07, 0.12, 380, 2); },
  kill(){ tone(330, 0.18, 'triangle', 0.1, 700); },
  coin(){ if (!gate('coin', 70)) return; coinChime(); },
  wallBreak(){ tone(140, 0.5, 'sawtooth', 0.14, 45); noise(0.5, 0.35, 300, 0.7); },
  repair(){ [0,4,7].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.16, 'square', 0.05, null, i * 0.07)); },
  boom(){ noise(0.9, 0.45, 300, 0.6, 0, 120); tone(90, 0.6, 'sine', 0.22, 40); },
  win(){ [0,4,7,12].forEach((s, i) => tone(523 * Math.pow(2, s / 12), 0.32, 'triangle', 0.12, null, i * 0.12)); },
  lose(){ [0,-3,-7,-12].forEach((s, i) => tone(330 * Math.pow(2, s / 12), 0.42, 'sawtooth', 0.07, null, i * 0.18)); },
  boss(){ tone(70, 1.3, 'sawtooth', 0.11, 48); tone(104, 1.3, 'sawtooth', 0.07, 70); },

  // ---- patch ----
  sprout(n){ tone(520, 0.14, 'sine', 0.045, 780); if (n > 1) tone(620, 0.14, 'sine', 0.04, 900, 0.09); if (n > 2) tone(720, 0.14, 'sine', 0.035, 1000, 0.18); },   // soft: one pop per pumpkin
  match(size, groups){   // 3–4: three-note sparkle; 5+: five notes with a low punch, unmistakably bigger; combos climb in pitch
    const base = 440 * Math.pow(2, (Math.min(groups, 4) - 1) * 3 / 12);
    if (size >= 5){ [0,4,7,12,16].forEach((s, i) => tone(base * Math.pow(2, s / 12), 0.22, 'triangle', 0.11, null, i * 0.045)); tone(110, 0.25, 'sine', 0.14, 55); noise(0.12, 0.2, 2500, 1, 0.1); }
    else [0,4,7].forEach((s, i) => tone(base * Math.pow(2, s / 12), 0.16, 'triangle', 0.08, null, i * 0.05));
  },

  // ---- pumpkins hitting monsters (type = pumpkin index; size for Brown; rainbow adds a sparkle) ----
  pumpkinHit(type, size, rainbow){
    if (!gate('phit', 40)) return;
    switch (type){
      case 1: thump(); coinChime(0.02); break;                                                         // Yellow
      case 2: tone(1800, 0.14, 'sine', 0.05, 2600); noise(0.12, 0.16, 4000, 2, 0.02, 2000); break;    // Ice
      case 3: noise(0.25, 0.22, 800, 0.9, 0, 200); [0, 0.07, 0.13].forEach(d => noise(0.03, 0.12, 2500, 3, d)); break;   // Fire
      case 4: thump(); tone(2400, 0.1, 'sine', 0.035, 1200, 0.03); break;                              // Grey
      case 7: noise(0.5, 0.4, 300, 0.6, 0, 90); tone(70, 0.45, 'sine', 0.2, 35); break;                // Black
      case 8: noise(0.14, 0.3, 3000, 1.2, 0, 600); tone(900, 0.1, 'sawtooth', 0.06, 100); break;      // Deep Blue
      case 10: tap(); break;                                                                          // Turquoise
      case 11: if (size === 2) heavy(); else if (size === 1) thump(); else tap(); break;               // Brown by size
      default: thump();                                                                               // Green, Purple, White, Pink
    }
    if (rainbow) sparkle(0.02);
  },
  // extra moments: heal, chain, splash, pierce, spawn, return, miss, burn
  extra(kind){
    switch (kind){
      case 'heal': noise(0.06, 0.18, 1200, 1.5); tone(500, 0.08, 'triangle', 0.06, 400); [660, 880, 1100].forEach((f, i) => tone(f, 0.16, 'sine', 0.05, null, 0.08 + i * 0.07)); break;
      case 'chain': if (gate('chain', 30)) noise(0.08, 0.14, 2600, 1.2, 0, 900); break;
      case 'splash': if (gate('splash', 30)) tone(60, 0.2, 'sine', 0.1, 35); break;
      case 'pierce': if (gate('pierce', 30)) tone(2000, 0.08, 'sine', 0.025, 1100); break;
      case 'spawn': tone(700, 0.08, 'sine', 0.07, 1100); sparkle(0.08); break;
      case 'return': woosh(true, 0.18); tone(400, 0.12, 'sine', 0.05, 300, 0.3); break;
      case 'miss': if (gate('miss', 80)) noise(0.35, 0.08, 1400, 1, 0, 400); break;
      case 'burn': if (gate('burn', 120)) noise(0.03, 0.09, 2800, 3); break;
      case 'freeze': SFX.freeze(); break;
    }
  },

  // ---- monsters: hit (blocked = clang/tock), death, own actions ----
  monsterHit(type, blocked){
    if (!gate('mhit', 40)) return;
    if (blocked){ if (type === 'knight') clang(); else { tone(300, 0.06, 'square', 0.05, 200); } return; }
    switch (type){
      case 'ghoul': groan(120, 0.09); break;
      case 'bat': tone(1800, 0.06, 'square', 0.035, 2400); noise(0.05, 0.08, 2500, 1.5); break;
      case 'imp': tone(700, 0.12, 'sawtooth', 0.05, 1100); break;
      case 'brute': tone(80, 0.25, 'sawtooth', 0.09, 60); noise(0.15, 0.2, 150, 1); break;
      case 'mummy': noise(0.15, 0.16, 600, 0.5, 0, 300); tone(140, 0.1, 'triangle', 0.06, 100); break;
      case 'firemummy': noise(0.15, 0.16, 600, 0.5, 0, 300); noise(0.06, 0.14, 2500, 3, 0.05); break;
      case 'wisp': case 'wraith': case 'fogwalker': cloth(); break;
      case 'rider': cloth(0.12); tone(700, 0.08, 'sawtooth', 0.03, 900, 0.04); break;
      case 'doctor': noise(0.06, 0.16, 400, 2); noise(0.07, 0.12, 380, 2, 0.1); break;
      case 'knight': groan(150, 0.06, 0.15); tone(1200, 0.08, 'triangle', 0.03, 900); break;
      case 'gargoyle': noise(0.1, 0.22, 1200, 1); tone(300, 0.1, 'square', 0.05, 150); break;
      case 'hauler': groan(130, 0.07, 0.18); noise(0.12, 0.08, 700, 3, 0.05, 500); break;
      case 'archer': [0, 0.04, 0.09].forEach(d => noise(0.025, 0.16, 2500, 2, d)); break;
      case 'vampire': noise(0.2, 0.16, 5000, 1.2, 0, 3000); break;
      case 'bulwark': tone(900, 0.14, 'square', 0.05, 400); noise(0.08, 0.16, 2200, 1.5); break;
      case 'crawler': case 'diver': noise(0.1, 0.18, 500, 0.8, 0, 250); break;
      case 'sailor': tone(500, 0.08, 'sine', 0.06, 800); tone(520, 0.06, 'sine', 0.05, 760, 0.1); break;
      case 'slime': squelch(); break;
      case 'blob': squelch(0.1, 500); break;
      case 'chameleon': case 'rchameleon': tone(1500, 0.05, 'sine', 0.05, 2200); tone(1500, 0.05, 'sine', 0.04, 2200, 0.07); break;
      case 'mirror': tone(3000, 0.08, 'sine', 0.05, 2400); break;
      case 'witch': cackle(2, 640); break;
      case 'turtle': tone(260, 0.1, 'triangle', 0.08, 180); noise(0.05, 0.12, 400, 2); break;
      default: thump(0.05, 180);
    }
  },
  monsterDie(type){
    switch (type){
      case 'ghoul': groan(110, 0.1, 0.45); break;
      case 'bat': tone(2000, 0.05, 'square', 0.04, 2600); break;
      case 'imp': tone(900, 0.2, 'sawtooth', 0.06, 1500); break;
      case 'brute': tone(70, 0.4, 'sawtooth', 0.1, 40); noise(0.3, 0.25, 120, 1); break;
      case 'mummy': case 'firemummy': noise(0.25, 0.2, 500, 0.6, 0, 150); break;
      case 'wisp': case 'wraith': case 'fogwalker': case 'rider': noise(0.35, 0.12, 1200, 0.8, 0, 300); break;
      case 'doctor': noise(0.07, 0.14, 400, 2); noise(0.2, 0.25, 3000, 1, 0.12, 1200); break;
      case 'knight': case 'bulwark': [0, 0.08, 0.18].forEach(d => { tone(600, 0.12, 'square', 0.05, 200, d); noise(0.1, 0.18, 1800, 1.2, d); }); break;
      case 'gargoyle': noise(0.3, 0.3, 1000, 0.8, 0, 300); break;
      case 'hauler': groan(120, 0.09, 0.35); break;
      case 'archer': [0, 0.05, 0.1, 0.16, 0.23].forEach(d => noise(0.03, 0.14, 2200 + Math.random() * 800, 2, d)); break;
      case 'vampire': tone(800, 0.5, 'sawtooth', 0.07, 300); noise(0.5, 0.15, 800, 0.7, 0.2, 200); break;
      case 'crawler': case 'diver': splash(0.18); break;
      case 'sailor': tone(200, 0.2, 'square', 0.06, 120); noise(0.12, 0.18, 200, 1, 0.15); break;
      case 'slime': tone(500, 0.06, 'sine', 0.08, 800); tone(560, 0.06, 'sine', 0.08, 900, 0.09); break;
      case 'blob': tone(700, 0.05, 'sine', 0.07, 1000); break;
      case 'chameleon': case 'rchameleon': tone(1500, 0.04, 'sine', 0.05, 900); break;
      case 'mirror': noise(0.3, 0.25, 4000, 1, 0, 1500); [3000, 2500, 2000].forEach((f, i) => tone(f, 0.08, 'sine', 0.04, null, i * 0.05)); break;
      case 'witch': cackle(1, 700); noise(0.1, 0.16, 500, 1, 0.14); break;
      case 'turtle': noise(0.25, 0.3, 900, 0.8, 0, 300); tone(200, 0.2, 'triangle', 0.08, 120); break;
      default: tone(330, 0.18, 'triangle', 0.1, 700);
    }
  },
  monsterAct(type, what){
    switch (type + ':' + what){
      case 'archer:shoot': tone(300, 0.08, 'triangle', 0.06, 900); noise(0.05, 0.1, 2000, 1); break;
      case 'arrow:land': noise(0.08, 0.2, 800, 1); tone(180, 0.08, 'square', 0.05, 120); break;
      case 'diver:surface': case 'crawler:rise': case 'turtle:rise': splash(0.16); break;
      case 'diver:submerge': tone(300, 0.1, 'sine', 0.06, 150); noise(0.1, 0.12, 400, 1); break;
      case 'diver:bolt': case 'water:bolt': noise(0.15, 0.2, 1200, 1, 0, 300); break;
      case 'wraith:vanish': noise(0.3, 0.12, 400, 0.8, 0, 1600); break;
      case 'wraith:return': noise(0.3, 0.12, 1600, 0.8, 0, 400); break;
      case 'hauler:freed': noise(0.06, 0.2, 1800, 2); [0.08, 0.16, 0.24].forEach(d => noise(0.04, 0.1, 300, 1, d)); break;
      case 'doctor:heal': if (gate('dheal', 300)) [880, 740, 620].forEach((f, i) => tone(f, 0.12, 'sine', 0.04, null, i * 0.06)); break;
      case 'vampire:heal': if (gate('vheal', 500)){ tone(60, 0.1, 'sine', 0.08, 45); tone(60, 0.1, 'sine', 0.07, 45, 0.18); } break;
      case 'rider:break': noise(0.12, 0.2, 1200, 1, 0, 400); tone(700, 0.08, 'sawtooth', 0.04, 1100, 0.05); break;
      case 'mirror:up': tone(2400, 0.12, 'sine', 0.04, 3600); break;
      case 'mirror:reflect': tone(3200, 0.12, 'sine', 0.06, 2000); noise(0.06, 0.1, 5000, 2); break;
      case 'witch:hex': shimmer(); cackle(2, 620, 0.05, 0.04); break;
      case 'slime:split': tone(500, 0.06, 'sine', 0.08, 800); tone(560, 0.06, 'sine', 0.08, 900, 0.09); break;
      case 'firemummy:ignite': noise(0.2, 0.2, 700, 0.8, 0, 300); noise(0.05, 0.14, 2600, 3, 0.05); break;
      case 'mummy:rise': noise(0.25, 0.14, 600, 0.6, 0, 250); break;
      case 'knight:block': clang(); break;
    }
  },

  // ---- bosses: arrive / casts / hit / die (docs/AUDIO.md §3) ----
  bossSfx(kind, ev){
    const k = kind + ':' + ev;
    switch (k){
      case 'gravekeeper:arrive': noise(0.4, 0.22, 1500, 0.8, 0, 400); bell(220, 0.3); break;
      case 'gravekeeper:teleport': woosh(false, 0.2); noise(0.25, 0.14, 250, 1, 0.1); break;
      case 'gravekeeper:summon': noise(0.3, 0.3, 200, 0.8, 0, 90); tone(60, 0.25, 'sine', 0.14, 40); break;
      case 'gravekeeper:shove': [0, 0.08, 0.16].forEach(d => noise(0.06, 0.16, 1400, 2, d)); tone(90, 0.3, 'sawtooth', 0.06, 60); break;
      case 'gravekeeper:hit': tone(150, 0.15, 'square', 0.07, 60); groan(100, 0.05, 0.15); break;
      case 'gravekeeper:die': bell(196); noise(0.3, 0.25, 1200, 1, 0.5, 300); tone(80, 0.6, 'sawtooth', 0.1, 30, 0.7); noise(0.5, 0.3, 200, 0.7, 0.7); break;
      case 'poltergeist:arrive': tone(400, 0.6, 'sine', 0.09, 900); tone(900, 0.7, 'sine', 0.08, 300, 0.6); break;
      case 'poltergeist:swap': woosh(true, 0.16); [1046, 1318].forEach((f, i) => tone(f, 0.15, 'sine', 0.05, null, 0.15 + i * 0.08)); break;
      case 'poltergeist:repaint': noise(0.2, 0.2, 800, 0.7, 0, 300); tone(600, 0.1, 'sine', 0.04, 900, 0.05); break;
      case 'poltergeist:drift': noise(0.25, 0.06, 600, 0.6); break;
      case 'poltergeist:hit': tone(300, 0.2, 'triangle', 0.07, 200); tone(300, 0.15, 'triangle', 0.035, 200, 0.15); tone(300, 0.12, 'triangle', 0.02, 200, 0.28); break;
      case 'poltergeist:die': tone(700, 1.4, 'sine', 0.1, 150); tone(1050, 1.2, 'sine', 0.05, 220, 0.1); break;
      case 'hexwitch:arrive': cackle(5, 720, 0, 0.08); break;                                        // witch laugh (owner)
      case 'hexwitch:hex': shimmer(); cackle(2, 660, 0.02, 0.05); break;                             // magic shimmer + brief "haha" together (owner)
      case 'hexwitch:zone': cackle(2, 560, 0, 0.05); tone(50, 0.6, 'sine', 0.14, 40); break;          // brief "hehe" + rumble (owner)
      case 'hexwitch:drift': noise(0.2, 0.1, 1200, 1, 0, 500); break;
      case 'hexwitch:hit': tone(900, 0.1, 'sawtooth', 0.05, 1300); break;
      case 'hexwitch:die': cackle(2, 700, 0, 0.07); noise(0.4, 0.3, 700, 0.8, 0.25, 200); tone(100, 0.4, 'square', 0.06, 50, 0.3); break;
      case 'vampirecount:arrive': [110, 138, 165, 220].forEach(f => tone(f, 1.2, 'sawtooth', 0.045)); [0.1, 0.18, 0.26, 0.34].forEach(d => noise(0.05, 0.1, 2500, 1.5, d)); break;
      case 'vampirecount:burst': [0, 0.06, 0.12, 0.18, 0.24].forEach(d => noise(0.05, 0.12, 2500, 1.5, d)); break;
      case 'vampirecount:bats': [0, 0.07, 0.14].forEach(d => noise(0.05, 0.1, 2500, 1.5, d)); break;
      case 'vampirecount:wall': noise(0.6, 0.22, 250, 2, 0, 120); break;
      case 'vampirecount:trance': tone(60, 0.12, 'sine', 0.1, 45); tone(60, 0.12, 'sine', 0.08, 45, 0.2); break;
      case 'vampirecount:tick': tone(2000, 0.05, 'sine', 0.06, 2400); break;
      case 'vampirecount:break': noise(0.3, 0.3, 4000, 1, 0, 1500); tone(1500, 0.3, 'sine', 0.06, 600); break;
      case 'vampirecount:hit': noise(0.2, 0.16, 5000, 1.2, 0, 3000); break;
      case 'vampirecount:die': tone(800, 0.6, 'sawtooth', 0.09, 300); noise(0.8, 0.2, 800, 0.7, 0.4, 150); break;
      case 'twintides:arrive': splash(0.3, 0.5); tone(90, 0.5, 'sawtooth', 0.1, 60, 0.2); tone(120, 0.5, 'sawtooth', 0.08, 80, 0.3); break;
      case 'twintides:bolt': splash(0.16, 0.2); noise(0.15, 0.2, 1200, 1, 0.1, 300); break;
      case 'twintides:down': splash(0.25, 0.4); tone(200, 0.4, 'sine', 0.06, 120, 0.2); noise(0.3, 0.12, 300, 3, 0.3); break;
      case 'twintides:revive': noise(0.6, 0.2, 300, 0.8, 0, 900); break;
      case 'twintides:hit': noise(0.1, 0.18, 500, 0.8, 0, 250); tone(110, 0.15, 'sawtooth', 0.05, 80); break;
      case 'twintides:die': tone(90, 0.7, 'sawtooth', 0.1, 50); tone(120, 0.7, 'sawtooth', 0.08, 70, 0.15); noise(1.2, 0.25, 500, 0.6, 0.3, 150); break;
      default: SFX.boss();
    }
  },

  // ---- tools ----
  tool(key){
    switch (key){
      case 'repair': [0, 0.12, 0.24].forEach(d => { noise(0.05, 0.2, 1200, 1.5, d); tone(500, 0.08, 'square', 0.05, 350, d); }); [0,4,7].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.16, 'square', 0.04, null, 0.36 + i * 0.07)); break;
      case 'fw': noise(0.25, 0.2, 400, 1, 0, 2500); SFX.boom(); break;
      case 'buster': noise(0.15, 0.25, 500, 1, 0, 200); noise(0.1, 0.3, 1500, 1, 0.15, 500); tone(200, 0.15, 'square', 0.06, 100, 0.15); break;
      case 'lantern': noise(0.08, 0.2, 2500, 1.5); tone(600, 0.4, 'sine', 0.04, 900, 0.08); break;
      case 'mine': tone(1500, 0.03, 'square', 0.05, 1200); break;
      case 'mineBoom': SFX.boom(); break;
      case 'bomb': noise(0.4, 0.08, 3000, 3, 0, 4000); noise(0.9, 0.45, 300, 0.6, 0.4, 120); tone(90, 0.6, 'sine', 0.22, 40, 0.4); break;
      case 'scarecrow': [0, 0.15].forEach(d => { tone(120, 0.12, 'sine', 0.1, 80, d); noise(0.06, 0.18, 800, 1, d); }); break;
      case 'aim': tone(1200, 0.05, 'sine', 0.04, 1500); break;
    }
  },

  // ---- walls, wind, fog, level ----
  wallHit(){ if (!gate('wall', 120)) return; noise(0.1, 0.22, 800, 1); tone(200, 0.1, 'square', 0.05, 150); },
  wallDown(){ SFX.wallBreak(); },
  alarm(){ if (!gate('alarm', 500)) return; tone(220, 0.1, 'square', 0.08, 220); tone(220, 0.1, 'square', 0.06, 220, 0.15); },
  wind(phase){ if (phase === 'warn') noise(0.9, 0.09, 2000, 0.5, 0, 1200); else { noise(0.5, 0.28, 600, 0.9, 0, 200); tone(180, 0.2, 'sine', 0.05, 120); } },
  lanternLit(){ noise(0.08, 0.2, 2500, 1.5); },
  levelStart(){ tone(500, 0.25, 'sine', 0.06, 420); tone(500, 0.3, 'sine', 0.05, 400, 0.3); [0,4,7].forEach((s, i) => tone(262 * Math.pow(2, s / 12), 0.5, 'triangle', 0.05, null, 0.5 + i * 0.05)); },
  perk(){ [0,4,7,12,16].forEach((s, i) => tone(523 * Math.pow(2, s / 12), 0.25, 'sine', 0.08, null, i * 0.08)); sparkle(0.4, 0.05); },
  star(){ tone(1568, 0.2, 'sine', 0.07, 1760); },
};
