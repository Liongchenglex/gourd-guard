// ---------- The Hollow King (6-20, Release 3; owner 2026-11-02; spec docs/superpowers/specs/2026-11-02-release-3-design.md) ----------
// His own powers, in turn every `powerEvery` s whatever the phase: wipe one column of the patch (after a `wipeTell` s glow), smash
// the fence of his own lane by half its full health (never below 1), and summon a burst of the night's monsters.
// Phases and world boss forms: see the second half of this file.

import { TYPES } from '../data/monsters.js';
import { G, grid, walls, ROWS, COLS, LANE, GY, CS, FENCE_Y } from './state.js';
import { resolveMatches } from './board.js';
import { spawnMonster, mY } from './monsters.js';
import { chunk, ring, addFloat } from './combat.js';
import { damageWall } from './walls.js';
import { pickFrom } from './spawner.js';
import { SFX } from './audio.js';
import { PTYPES, RAINBOW } from '../data/pumpkins.js';
import { rnd } from './util.js';

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
