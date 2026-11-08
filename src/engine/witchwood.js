// Nightmare Witchwood's monsters (Release 7; spec Part 3, docs/GAME_DESIGN.md §9 "Nightmare Witchwood"). Their numbers are in data/monsters.js.
// Every caller gates on `__RELEASE__ >= 7`, so lower builds drop this module. One section per monster; each new monster adds a case to
// initWitchwoodMonster / updateWitchwoodMonster and, when it has one, a line to witchwoodFalls.
//  - The Flask Bearer (`flaskbearer`): a quick little imp. When it dies it leaves one potion of a random kind on its tile, or on the nearest
//    free tile when its own holds a potion already (dropPotionsNear).
//  - The Cauldron Toad (`toad`): walks to `tongueHold` of the field and stops there (toadStop, read where monsters.js moves a monster), then
//    lashes its own fence from range: it is `eating` with `tongue` set, so monsters.js's chewing step wears its fence down at `eat` a second
//    with the same multipliers as any chew (frozen 0, slowed half, a speed potion POTION_SPEED). A tongue chewer keeps its own spot (it does
//    not line up with the chewers at the fence, and they walk past it). With its fence down it has nothing to lash and walks on to the gap,
//    as any monster would (our call). When it dies it bursts: one potion per kind it drank, on the free tiles nearest where it died.

import { TYPES } from '../data/monsters.js';
import { SFX } from './audio.js';
import { addFloat, spark } from './combat.js';
import { TILE_P, mY } from './monsters.js';
import { POTION_FX, POTION_KINDS, placePotion, potionAt } from './potion.js';
import { COLS, G, walls } from './state.js';

// ---------- shared ----------
/** Field tile rows (as engine/potion.js): whole tiles between the top of the field and the fence. */
const rows = () => Math.max(1, Math.floor(1 / TILE_P()));

/** Put one potion of each kind in `kinds` on the free tiles nearest (lane, p): its own tile first, then ring by ring outwards (the tiles
 *  that many tiles away, lanes and rows), nearest first within a ring, never off the field. One potion per tile. Returns how many landed. */
export function dropPotionsNear(lane, p, kinds){
  if (!G || !G.potions || !kinds || !kinds.length) return 0;
  const tp = TILE_P(), n = rows(), R = Math.min(n - 1, Math.max(0, Math.floor(p / tp))), L = Math.min(COLS - 1, Math.max(0, lane));
  const left = kinds.slice();
  let put = 0;
  for (let k = 0; left.length && k < Math.max(COLS, n); k++){
    const ring = [];
    for (let l = L - k; l <= L + k; l++) for (let r = R - k; r <= R + k; r++){
      if (Math.max(Math.abs(l - L), Math.abs(r - R)) !== k || l < 0 || l >= COLS || r < 0 || r >= n) continue;
      if (!potionAt(l, (r + 0.5) * tp)) ring.push([l, r, (l - L) * (l - L) + (r - R) * (r - R) + Math.random() * 0.5]);
    }
    ring.sort((a, b) => a[2] - b[2]);
    for (const [l, r] of ring){
      if (!left.length) break;
      if (placePotion(l, (r + 0.5) * tp, left[0], put > 0)) { left.shift(); put++; }   // the first one rings and sparks; the rest spark quietly
    }
  }
  return put;
}

/** A new monster's Release 7 set-up (spawnMonster, before it joins the field). */
export function initWitchwoodMonster(m){
  if (m.type === 'toad') m.tongue = false;
}

/** The type switch of updateMonster's default branch (a monster that is walking: not frozen, chewing, knocked back or down). True when handled. */
export function updateWitchwoodMonster(m, dt){
  switch (m.type){
    case 'flaskbearer':   // a quick scurry, bottles swinging
      m.x = m.tx + Math.sin(m.ph * 5) * 2.5;
      return true;
    case 'toad':   // a heavy waddle; at its hold, with its fence up, it starts lashing (monsters.js stops it there: toadStop)
      m.x = m.tx + Math.sin(m.ph * 2.2) * 2;
      if (walls[m.lane] && walls[m.lane].hp > 0 && m.p >= TYPES.toad.tongueHold - 1e-9){ m.eating = true; m.tongue = true; }
      return true;
  }
  return false;
}

// ---------- the Cauldron Toad ----------
/** The furthest the toad may walk this frame: its tongue hold while its fence stands (never back: a toad past it stays put), else the fence. */
export function toadStop(m){
  return walls[m.lane] && walls[m.lane].hp > 0 ? Math.max(m.p, TYPES.toad.tongueHold) : Infinity;
}

/** monsters.js's chewing step, for a tongue chewer whose fence has fallen: it stops lashing and walks on. True when that happened. */
export function tongueFree(m){
  if (!m.tongue || (walls[m.lane] && walls[m.lane].hp > 0)) return false;
  m.tongue = false; m.eating = false;
  return true;
}

// ---------- deaths ----------
/** kill() (combat.js), once a Release 7 monster is truly dead: the Flask Bearer's potion, the toad's burst. */
export function witchwoodFalls(m){
  if (m.type === 'flaskbearer'){
    dropPotionsNear(m.lane, m.p, [POTION_KINDS[Math.floor(Math.random() * POTION_KINDS.length)]]);
    return;
  }
  if (m.type === 'toad'){
    const kinds = POTION_KINDS.filter(k => m.drank && m.drank[k]);
    const y = mY(m);
    for (let i = 0; i < 14; i++) spark(m.x, y - 6, i % 2 ? '#3a3a40' : '#c8c8cc', 170);   // the burst: grey hide and a splash
    for (const k of kinds){ const [a, b] = POTION_FX[k]; for (let i = 0; i < 6; i++) spark(m.x, y - 10, i % 2 ? a : b, 160); }
    if (dropPotionsNear(m.lane, m.p, kinds)) addFloat('Potions spill!', m.x, y - m.r - 30, '#e0d0d8', 16, 0.9);
    SFX.extra('splash');
  }
}
