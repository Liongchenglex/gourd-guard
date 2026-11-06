// Nightmare Foggy Hollow's monsters (Release 5; spec Part 4): Plague Doctor 2 (`rotdoctor`) and the Reaper (`reaper`).
// Every caller gates on `__RELEASE__ >= 5`, so lower builds drop this module. Their numbers are in data/monsters.js.
//  - Plague Doctor 2 heals nobody. While it stands, every other monster in its 3x3 (the Plague Doctor's heal-zone geometry: lanes +-1, 1.5 tiles
//    either way) can only be hurt by rotten pumpkins (`rotOnly`, engine/rot.js; combat.js refuses everything else). markRotZones marks them
//    once per frame, right after clearHitFlags and before any monster updates, so a burning or poisoned monster is protected the same frame
//    whatever order the monsters sit in. The doctor itself is never marked.
//  - Fogwalker 2 (`fogwalker2`) is a Fogwalker with 3 health and a fog band two rows high (render/draw.js reads TYPES.fogwalker2.band). Unless it is itself a
//    minion it arrives with two Mossbacks (minions) in the lanes either side (initHollowMonster); a Lantern shows it (game.js useLantern).
//  - Wisp Rider 2 (`comet`) cruises `cruise` s on the field, then dashes at `dashSp` without stopping (`dashing`: aheadLimit ignores it) until it chews the fence.
//    Its first hit breaks the wisp (cometBreaks): a plain Wisp (minion) is left behind and the rider walks on as an Imp (health kept).
//  - Poltergeist 2 (`minipolt`) drifts a lane every `driftEvery` s, vanishes (hidden, like the Wraith) for `vanishFor` s every `vanishEvery` s, and every `rotEvery` s
//    casts: a tell on 1-2 random pumpkins that rotCell would accept (never in a Protector square), then `castFor` s later they turn rotten. Killed or flicked away
//    in between, nothing rots.
//  - The Reaper is the Wraith's fade cycle with its own times. Its scythe swing is its chew (owner): reapLanes gives the three fences it wears
//    down at the fence, monsters.js's chewing step does the rest at its `eat` rate. When it dies a crow bursts out where it fell (reaperFalls).

import { TYPES } from '../data/monsters.js';
import { SFX } from './audio.js';
import { resolveMatches } from './board.js';
import { addFloat, ring, spark } from './combat.js';
import { isProtected } from './gourd.js';
import { mY, spMulNow, spawnMonster, TILE_P } from './monsters.js';
import { ROTTEN, rotCell } from './rot.js';
import { COLS, G, GY, CS, LANE, ROWS, grid } from './state.js';
import { rnd } from './util.js';

/** Frame start: mark everything inside a standing Plague Doctor 2's square rot-only for this frame. The Frenzy jukebox and the Loot Sack are never
 *  marked: they are reward and event monsters the player must always be able to hit with an ordinary pumpkin. */
export function markRotZones(){
  const ms = G.monsters, reach = 1.5 * TILE_P();
  for (let i = 0; i < ms.length; i++){
    const d = ms[i];
    if (d.type !== 'rotdoctor' || d.dead || d.p <= 0) continue;
    for (let j = 0; j < ms.length; j++){
      const o = ms[j];
      if (o !== d && !o.dead && o.type !== 'jukebox' && o.type !== 'sack' && Math.abs(o.lane - d.lane) <= 1 && Math.abs(o.p - d.p) <= reach) o.rotOnly = true;
    }
  }
}

/** The fences a Reaper at the fence wears down: its own and both neighbours (the field's edge has only one). */
export function reapLanes(m){
  const out = [];
  for (let l = m.lane - 1; l <= m.lane + 1; l++) if (l >= 0 && l < COLS) out.push(l);
  return out;
}

/** The Reaper falls: a crow (a minion) bursts out where it fell, in its lane. */
export function reaperFalls(m){
  spawnMonster('crow', m.lane, true, Math.min(1, m.p));
  for (let i = 0; i < 10; i++) spark(m.x, mY(m), i % 2 ? '#2a2236' : '#b8a8d8', 150);
}

/** A new monster's Release 5 set-up (spawnMonster, before it joins the field): Fogwalker 2's Mossbacks, the comet's carrier flag and cruise clock, the Mini Poltergeist's timers. */
export function initHollowMonster(m){
  const T = TYPES[m.type];
  if (m.type === 'fogwalker2'){
    if (!m.minion) for (const dl of [-1, 1]){   // two Mossbacks either side, at its height (a spot off the field edge goes behind it instead)
      const l = Math.max(0, Math.min(COLS - 1, m.lane + dl));
      spawnMonster('brute', l, true, l === m.lane ? m.p - 0.07 : m.p);
    }
    m.anim = { clip:'exhale', t:0, dur:10 / 12 };   // it breathes out its fog as it arrives
  } else if (m.type === 'comet'){ m.carrier = true; m.dashing = false; m.cruiseT = T.cruise; }
  else if (m.type === 'minipolt'){ m.vanish = T.vanishEvery; m.rotT = T.rotEvery; m.castT = 0; m.castCells = null; }
}

/** Wisp Rider 2's first hit: the wisp breaks. A plain Wisp (a minion) drifts on at the same height and the rider walks on as an Imp, its health kept. */
export function cometBreaks(m){
  spawnMonster('wisp', m.lane, true, Math.max(-0.02, m.p));
  const I = TYPES.imp;
  m.carrier = false; m.dashing = false; m.type = m.kind = 'imp'; m.r = I.r; m.sp = I.sp * spMulNow() * rnd(0.92, 1.08); m.tx = LANE(m.lane); m.flash = 0.15;
  for (let i = 0; i < 12; i++) spark(m.x, mY(m) - 10, '#cfe8f2', 120);
  SFX.monsterAct('rider', 'break'); addFloat('Wisp broken', m.x, mY(m) - m.r - 24, '#cfe8f2', 16, 0.9);
}

/** The pumpkins the Mini Poltergeist may rot: settled, not a gourd, not rotten already, not inside a Protector square (what rotCell accepts). */
function rotCandidates(){
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const cell = grid[r][c];
    if (cell && !cell.gourd && !(cell.fly > 0) && cell.c !== ROTTEN && !isProtected(r, c)) out.push([r, c]);
  }
  return out;
}
/** Its cast: pick 1-2 pumpkins, mark them (a ring each) and play the toss; castFor s later finishCast rots whatever is still there. */
function startCast(m){
  const T = TYPES.minipolt, cells = rotCandidates();
  m.rotT = T.rotEvery;
  if (!cells.length) return;
  const n = Math.min(cells.length, T.rotN[0] + Math.floor(Math.random() * (T.rotN[1] - T.rotN[0] + 1)));
  for (let i = 0; i < n; i++){ const j = i + Math.floor(Math.random() * (cells.length - i)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  m.castCells = cells.slice(0, n); m.castT = T.castFor;
  m.anim = { clip:'toss', t:0, dur:9 / 14 };
  for (const [r, c] of m.castCells) ring(LANE(c), GY + r * CS + CS / 2, CS * 0.5, 'rgba(158,244,226,.85)');
  SFX.monsterAct('witch', 'hex');
}
function finishCast(m){
  let n = 0;
  for (const [r, c] of m.castCells) if (rotCell(r, c, false)) n++;
  m.castCells = null;
  if (n){ addFloat('Rotten!', m.x, mY(m) - m.r - 30, '#9ac25a', 16, 0.9); resolveMatches(); }
}

/** The type switch of updateMonster's default branch (a monster that is walking: not frozen, chewing, knocked back or down). True when handled. */
export function updateHollowMonster(m, dt){
  switch (m.type){
    case 'comet': {   // cruises, then streaks down the lane and never slows (m.sp is read next frame; aheadLimit lets a dashing comet through)
      const T = TYPES.comet;
      if (!m.dashing){
        if (m.p >= 0 && (m.cruiseT -= dt) <= 0){
          m.dashing = true; m.sp = T.dashSp * spMulNow(); SFX.monsterAct('wraith', 'return');
          for (let i = 0; i < 10; i++) spark(m.x, mY(m), '#cfe8f2', 140);
        }
        m.x = m.tx + Math.sin(m.ph * 4) * 5;
      } else m.x = m.tx + Math.sin(m.ph * 12) * 1.5;
      return true;
    }
    case 'minipolt': {   // drifts a lane, vanishes like a Wraith, and rots 1-2 pumpkins every few seconds
      const T = TYPES.minipolt;
      m.vanish -= dt;
      if (m.vanish <= 0 && m.p > 0.05 && m.p < 0.9){
        m.hidden = !m.hidden; m.vanish = m.hidden ? T.vanishFor : T.vanishEvery; SFX.monsterAct('wraith', m.hidden ? 'vanish' : 'return');
        for (let i = 0; i < 10; i++) spark(m.x, mY(m), '#9ef4e2', 90);
      }
      if (m.hidden && m.p >= 0.9){ m.hidden = false; m.vanish = T.vanishEvery; }
      if (m.p > 0.05){
        m.driftT -= dt;
        if (m.driftT <= 0){
          m.driftT = T.driftEvery;
          const opts = [m.lane - 1, m.lane + 1].filter(l => l >= 0 && l < COLS);
          m.lane = opts[Math.floor(Math.random() * opts.length)]; m.tx = LANE(m.lane);
        }
      }
      m.x += (m.tx - m.x) * Math.min(1, dt * 3.5);
      if (m.castT > 0){ m.castT -= dt; if (m.castT <= 0) finishCast(m); }
      else if ((m.rotT -= dt) <= 0 && !m.hidden && m.p > 0) startCast(m);   // a hidden ghost waits to reappear before it casts
      return true;
    }
    case 'rotdoctor':   // slow; nothing to do but walk (its zone is markRotZones')
      m.x = m.tx + Math.sin(m.ph * 1.2) * 2;
      return true;
    case 'reaper': {   // the Wraith's fade cycle: shown `show` s, hidden `hide` s; keeps walking while hidden, cannot be seen or hit
      const T = TYPES.reaper;
      m.vanish -= dt;
      if (m.vanish <= 0 && m.p > 0.05 && m.p < 0.9){
        m.hidden = !m.hidden; m.vanish = m.hidden ? T.hide : T.show; SFX.monsterAct('wraith', m.hidden ? 'vanish' : 'return');
        for (let i = 0; i < 10; i++) spark(m.x, mY(m), '#b8a8d8', 90);
      }
      if (m.hidden && m.p >= 0.9){ m.hidden = false; m.vanish = T.show; }
      m.x = m.tx + Math.sin(m.ph * 1.2) * 3;
      return true;
    }
  }
  return false;
}
