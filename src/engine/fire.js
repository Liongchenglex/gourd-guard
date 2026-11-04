// Fire tiles (Release 4, Nightmare Pumpkin Patch; spec Part 2, docs/GAME_DESIGN.md §9 "Fire tiles").
// A fire burns on one field tile: a lane and a tile row (its p is the row's centre, TILE_P() rows from the top of the field).
// A pumpkin flying up its column that reaches a fire burns up there (no on-hit power); an Ice pumpkin puts it out and stops.
// Fire never burns out on its own. Every caller gates on `__RELEASE__ >= 4`, so lower builds drop this module.

import { FIRE_P_RANGE, FRENZY_BURST } from '../data/rules.js';
import { SFX, sample } from './audio.js';
import { spark } from './combat.js';
import { mY, TILE_P, lanesOf, burnMonster } from './monsters.js';
import { BURNS_TO } from '../data/monsters.js';
import { COLS, FIELD_BOT, FIELD_TOP, G, LANE } from './state.js';
import { shuffle } from './util.js';
import { banner } from '../ui/hud.js';

/** Field tile rows: as many whole tiles as fit between the top of the field and the fence. */
const rows = () => Math.max(1, Math.floor(1 / TILE_P()));
const rowOf = p => Math.min(rows() - 1, Math.max(0, Math.floor(p / TILE_P())));
const centre = row => (row + 0.5) * TILE_P();
/** Screen y of a fire's tile centre. */
export const fireY = f => FIELD_TOP + f.p * (FIELD_BOT - FIELD_TOP);

const soundAt = {};
const once = (key, ms) => { const n = performance.now(); if (n - (soundAt[key] || 0) < ms) return false; soundAt[key] = n; return true; };

/** The fire burning on the tile that holds field position p in this lane, or null. */
export function fireAt(lane, p){
  if (!G || !G.fires) return null;
  const tp = TILE_P();
  for (const f of G.fires) if (f.lane === lane && Math.abs(f.p - p) < tp / 2) return f;
  return null;
}

/** Light the tile at (lane, p), p snapped to its tile-row centre. False when that tile already burns. */
export function lightFire(lane, p, quiet){
  if (!G || !G.fires || lane < 0 || lane >= COLS) return false;
  const q = centre(rowOf(p));
  if (fireAt(lane, q)) return false;
  const f = { lane, p:q, t:0 }; G.fires.push(f);
  for (const pr of G.projs || []) if (pr.lane === lane && !pr.dead && pr.y <= fireY(f) + 20) (pr.passed || (pr.passed = new Set())).add(f);   // a pumpkin already past this tile flies on: things are met in the order they stand
  if (!quiet){
    const x = LANE(lane), y = FIELD_TOP + q * (FIELD_BOT - FIELD_TOP);
    for (let i = 0; i < 10; i++) spark(x, y, i % 2 ? '#ffd35a' : '#ff6a1a', 140);
    if (once('light', 90)) sample('fire', 0.5) || SFX.extra('burn');
  }
  return true;
}

/** Light up to n random field tiles that are not burning yet, spread across lanes: every lane gets one new tile before any lane gets a second.
 *  Only rows whose centre lies in FIRE_P_RANGE; a tile under a castle wall or a boss is skipped. Returns how many were lit. */
export function lightRandomFires(n, quiet){
  if (!G || !G.fires || !(n > 0)) return 0;
  const tp = TILE_P(), [lo, hi] = FIRE_P_RANGE;
  let band = [...Array(rows()).keys()].filter(r => centre(r) >= lo && centre(r) <= hi);
  if (!band.length) band = [rowOf(0.5)];   // a very short field: the middle row
  const blocked = (lane, p) => (G.castles || []).some(w => !w.dead && w.lane === lane && Math.abs(w.p - p) < tp)
    || G.monsters.some(m => !m.dead && m.type === 'boss' && lanesOf(m).includes(lane) && Math.abs(m.p - p) < tp);
  const free = lane => band.map(centre).filter(p => !fireAt(lane, p) && !blocked(lane, p));
  let lit = 0;
  while (lit < n){
    const lanes = shuffle([...Array(COLS).keys()]).filter(l => free(l).length);   // one round: each lane with room gets at most one tile
    if (!lanes.length) break;
    for (const l of lanes){
      if (lit >= n) break;
      const ps = free(l); if (!ps.length) continue;
      if (lightFire(l, ps[Math.floor(Math.random() * ps.length)], true)) lit++;
    }
  }
  if (lit && !quiet){
    for (const f of G.fires.slice(-lit)){ const x = LANE(f.lane), y = fireY(f); for (let i = 0; i < 8; i++) spark(x, y, i % 2 ? '#ffd35a' : '#ff6a1a', 140); }
    sample('fire', 0.6) || SFX.extra('burn');
  }
  return lit;
}

/** Ice reached the fire: it goes out with a hiss and a puff of steam. */
export function putOut(f){
  if (!G || !G.fires) return;
  const i = G.fires.indexOf(f); if (i < 0) return;
  G.fires.splice(i, 1);
  const x = LANE(f.lane), y = fireY(f);
  for (let k = 0; k < 10; k++) spark(x, y, k % 2 ? '#bfe8ff' : '#ffffff', 120);
  if (G.vfx) G.vfx.push({ kind:'firehiss', x, y, t:0, dur:0.9 });
  if (once('hiss', 60)) sample('hiss', 0.55) || sample('splash', 0.5) || SFX.extra('splash');
}

/** The fire a flying pumpkin meets now, or null: the first fire in its lane it has reached (pr.y within 20 px of the tile centre),
 *  unless a monster it can still hit stands in front of that fire (nearer the fence): that monster is hit first. */
export function fireAhead(pr, targets){
  let best = null;
  for (const f of G.fires) if (f.lane === pr.lane && pr.y <= fireY(f) + 20 && !(pr.passed && pr.passed.has(f)) && (!best || f.p > best.p)) best = f;   // skips a fire lit behind it (lightFire)
  if (!best) return null;
  const fy = fireY(best);
  for (const m of targets) if (mY(m) > fy) return null;
  return best;
}

/** A pumpkin reaches a fire: Ice puts it out, every other pumpkin burns up in it with a small flare. Either way it stops there and its on-hit power does not fire. */
export function burnPumpkin(pr, f){
  pr.dead = true; pr.burned = true;
  if (pr.type === 2){ putOut(f); G.q.fireOut = (G.q.fireOut || 0) + 1; return; }   // Ice
  const x = LANE(f.lane), y = fireY(f);
  for (let k = 0; k < 8; k++) spark(x, y - 8, k % 2 ? '#ffd35a' : '#ff6a1a', 160);
  if (G.vfx) G.vfx.push({ kind:'fireflare', x, y, t:0, dur:0.45 });
  if (once('burn', 80)) sample('reverse', 0.35, { rate:0.7 }) || SFX.extra('miss');   // the miss sound, pitched down
}

/** Fire marks (level field `fireMarks`): the spawn counts at which they fire, as fractions of the night's total (like jukeboxPoints). */
export const fireMarkPoints = d => d && d.fireMarks ? d.fireMarks.map(m => m.at) : [];

/** A fire mark fires: its tiles light up and a horde arrives (FRENZY_BURST monsters, one every FRENZY_BURST_GAP; extras that do not count). */
export function dropFireMark(mark){
  G.fmNext = (G.fmNext || 0) + 1; G.fmT = G.t;
  lightRandomFires(mark.n);
  G.fireBurst = FRENZY_BURST[0] + Math.floor(Math.random() * (FRENZY_BURST[1] - FRENZY_BURST[0] + 1)); G.fireBurstT = 0;
  banner('Wildfire!', 'The field catches fire and a horde rushes in.', 2.2); SFX.bossAlert();
}

/** Per-frame: the flames' clocks (drawing reads f.t for its loop phase), and monsters that have walked onto a fire tile: a type in BURNS_TO (Mummy, later Hayrick and Corn Husker)
 *  turns into its burning version, keeping its health. Fire does not hurt or stop any monster; one that is down (rising) is not lit. */
export function updateFires(dt){
  for (const f of G.fires) f.t += dt;
  if (!G.fires.length) return;
  for (const m of G.monsters) if (!m.dead && !m.hidden && m.rise <= 0 && BURNS_TO[m.type] && fireAt(m.lane, m.p)) burnMonster(m);
}
