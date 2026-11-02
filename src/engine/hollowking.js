// ---------- The Hollow King (6-20, Release 3; owner 2026-11-02; spec docs/superpowers/specs/2026-11-02-release-3-design.md) ----------
// His own powers, in turn every `powerEvery` s whatever the phase: wipe one column of the patch (after a `wipeTell` s glow), smash
// the fence of his own lane by half its full health (never below 1), and summon a burst of the night's monsters.
// Phases and world boss forms: see the second half of this file.

import { TYPES, BOSS_NAMES } from '../data/monsters.js';
import { G, grid, walls, ROWS, COLS, LANE, GY, CS, FENCE_Y } from './state.js';
import { resolveMatches } from './board.js';
import { spawnMonster, mY } from './monsters.js';
import { chunk, ring, addFloat } from './combat.js';
import { damageWall } from './walls.js';
import { pickFrom } from './spawner.js';
import { SFX } from './audio.js';
import { PTYPES, RAINBOW } from '../data/pumpkins.js';
import { rnd } from './util.js';
import { banner } from '../ui/hud.js';
import { prebakeAsync, dropAtlas } from './render/anim.js';

const POWERS = ['wipe', 'smash', 'summon'];

export function initHollowKing(m){
  const T = TYPES.hollowking;
  m.powerT = T.powerEvery; m.powerI = 0;
  m.hkPhase = 0; m.hkForm = null;
}

/** The column with the most pumpkins sitting in the patch (ties: any of them). */
function fullestColumn(){
  let best = [], most = -1;
  for (let c = 0; c < COLS; c++){
    let n = 0; for (let r = 0; r < ROWS; r++) if (grid[r][c] && !grid[r][c].fly) n++;
    if (n > most){ most = n; best = [c]; } else if (n === most) best.push(c);
  }
  return best[Math.floor(Math.random() * best.length)];
}

function wipeColumn(c){
  let n = 0;
  for (let r = 0; r < ROWS; r++){
    const cell = grid[r][c]; if (!cell || cell.fly) continue;
    grid[r][c] = null; n++;
    const x = LANE(c), y = GY + r * CS + CS / 2;
    for (let i = 0; i < 10; i++) chunk(x, y, cell.c === RAINBOW ? '#f0a020' : PTYPES[cell.c].base, 220);
  }
  G.shake = Math.max(G.shake, 0.6);
  if (n) resolveMatches();
  SFX.bossSfx('hollowking', 'wipe');
}

function smashFence(m){
  const w = walls[m.lane]; if (!w) return;
  const amt = Math.min(w.max / 2, w.hp - 1);   // half the fence's full health, but never below 1 (owner, 2026-11-02)
  ring(LANE(m.lane), FENCE_Y - 20, 46, 'rgba(255,140,42,.9)'); G.shake = Math.max(G.shake, 0.8);
  if (amt > 0) damageWall(m.lane, amt);
  addFloat('Smash!', LANE(m.lane), FENCE_Y - 50, '#ff8c2a', 20, 1);
  SFX.bossSfx('hollowking', 'smash');
}

function summon(m){
  const [a, b] = TYPES.hollowking.summonN, n = a + Math.floor(Math.random() * (b - a + 1));
  for (let i = 0; i < n; i++){
    const lane = Math.floor(Math.random() * COLS), p = Math.max(0, Math.min(0.6, m.p + rnd(-0.08, 0.08)));
    const o = spawnMonster(pickFrom(G.def.pool), lane, true, p);   // extras: they do not count toward the night
    ring(o.x, mY(o), 26, 'rgba(255,140,42,.8)');
  }
  SFX.bossSfx('hollowking', 'summon');
}

export function updateHollowKing(m, dt){
  if (!m.hkStarted && m.p > 0.05){   // arrival: the first split (or a continued night's phase)
    m.hkStarted = true;
    const r = G.hkRestore; G.hkRestore = null;
    if (r && r.formHp == null) m.hkPhase = r.phase;
    else { if (r) m.hkPhase = r.phase - 1; const f = hkSplit(m); if (r && f) f.hp = Math.min(f.maxHp, r.formHp); }
  }
  if (G.hkDrop && G.hkDrop.length) for (let i = G.hkDrop.length - 1; i >= 0; i--) if ((G.hkDrop[i].t -= dt) <= 0){ dropAtlas(G.hkDrop[i].key); G.hkDrop.splice(i, 1); }
  if (G.hkTell){ G.hkTell.t -= dt; if (G.hkTell.t <= 0){ const c = G.hkTell.col; G.hkTell = null; wipeColumn(c); } }
  if (m.p <= 0.05) return;
  m.powerT -= dt;
  if (m.powerT > 0) return;
  const T = TYPES.hollowking;
  m.powerT = T.powerEvery;
  const pw = POWERS[m.powerI % POWERS.length]; m.powerI++;
  if (pw === 'wipe'){ G.hkTell = { col:fullestColumn(), t:T.wipeTell, dur:T.wipeTell }; m.anim = { clip:'cast', t:0, dur:0.7 }; SFX.bossSfx('hollowking', 'tell'); }
  else if (pw === 'smash'){ smashFence(m); m.anim = { clip:'cast', t:0, dur:0.7 }; }
  else { summon(m); m.anim = { clip:'summon', t:0, dur:0.7 }; }
}

// ---------- Phases (owner, 2026-11-02) ----------
// Five health bands. Each band opens with a split: a world boss form (him, in that boss's colour, with the boss's level-10 kit and
// health) appears in another lane, and the king takes no damage at all until it falls. Then he can be hurt down to the next band's
// floor, where he splits again; a hit cannot carry past the floor. After the fifth form he is open until he dies.

const floorOf = k => k.hkPhase < 5 ? k.maxHp * (5 - k.hkPhase) / 5 : 0;

/** Split off the next world boss form; returns it. */
export function hkSplit(k){
  const forms = TYPES.hollowking.forms, kind = forms[k.hkPhase]; if (!kind) return null;
  const taken = G.monsters.filter(o => o.type === 'boss' && !o.dead).map(o => o.lane);
  const free = [...Array(COLS).keys()].filter(l => !taken.includes(l)), lane = free.length ? free[Math.floor(Math.random() * free.length)] : (k.lane + 3) % COLS;
  const f = spawnMonster('boss:' + kind, lane, true, k.p, 1);   // minion while spawning keeps a Twin Tides form a single body
  f.minion = false; f.look = 'hollowking'; f.hkClone = true; f.king = k;
  k.hkForm = f; k.hkPhase++;
  if (forms[k.hkPhase]) prebakeAsync(['hollowking|' + forms[k.hkPhase]]);
  ring(f.x, mY(f), 60, 'rgba(255,140,42,.9)'); ring(k.x, mY(k), 60, 'rgba(255,140,42,.9)');
  for (let i = 0; i < 18; i++) chunk(f.x, mY(f), '#ff8c2a', 260);
  banner(`${BOSS_NAMES[kind].replace(/^The /, '')} form!`, 'Beat it to hurt the Hollow King again.', 2.4);
  SFX.bossSfx('hollowking', 'split'); k.anim = { clip:'cast', t:0, dur:0.7 };
  return f;
}

/** How much of a hit the king takes: none while his form stands, and never past the current band's floor. */
export function hkGate(k, amt){
  if (k.hkForm && !k.hkForm.dead){
    k.flash = 0.06;
    if (!(G.t - (k.immuneT || -9) < 0.35)){ k.immuneT = G.t; addFloat('No damage', k.x, mY(k) - k.r - 24, '#c8c2b8', 16, 0.7); SFX.bossSfx('hollowking', 'immune'); }
    return 0;
  }
  if (k.hkPhase < 5 && k.hkStarted) return Math.min(amt, Math.max(0, k.hp - floorOf(k)));
  return amt;
}

/** After a hit: reaching the band's floor splits off the next form. */
export function hkAfterHit(k){
  if (k.dead || !k.hkStarted || k.hkPhase >= 5 || (k.hkForm && !k.hkForm.dead)) return;
  if (k.hp <= floorOf(k) + 1e-6){ k.hp = floorOf(k); hkSplit(k); }
}

/** A world boss form fell: the king can be hurt again. */
export function onHkFormDown(f){
  (G.hkDrop = G.hkDrop || []).push({ key:'hollowking|' + f.kind, t:0.45 });   // its frames are large: forget them once its death pop has played
  if (!f.king || f.king.dead) return;
  banner('The Hollow King can be hurt!', f.king.hkPhase >= 5 ? 'His last form is gone. Bring him down!' : 'Hit him before he splits again.', 2.2);
}

/** Continue-night snapshot: the phase, his health and the standing form's health. */
export function hkState(){
  const k = G.monsters.find(m => m.kind === 'hollowking' && !m.dead && !m.hkClone); if (!k) return null;
  const f = k.hkForm && !k.hkForm.dead ? k.hkForm : null;
  return { phase:k.hkPhase, hp:Math.max(1, Math.ceil(k.hp)), formHp:f ? Math.max(1, Math.ceil(f.hp)) : null };
}
