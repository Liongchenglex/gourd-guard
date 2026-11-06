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
//  - The Lamplighter (`boss` kind `lamplighter`, the N2-4 and N2-13 mini boss) holds at the back like the Strawlord (monsters.js stops it at hold) and
//    switches moods every `moodEvery` s (form2.moodEvery on a form 2 night), starting clean: clean = only normal pumpkins hurt it (`cleanOnly`), rot = only
//    rotten ones do (`rotOnly`). markMoods sets the flags in the same frame-start pre-pass as markRotZones (after clearHitFlags, before any monster
//    updates or flight resolves), and a switch sets them at once too, so a flight, a burn tick and a mine always see the mood it is in. Its own mood
//    wins over a Plague Doctor 2's square. Every `driftEvery` s it drifts to another lane; every `fogEvery` s it calls poisonNow on one random row or
//    column (the level's poison.dur; tagged src 'lamp', so the level's own fog cycle runs on under it, engine/poison.js), and when a fog is
//    already up it calls as soon as that one lifts. lampSnapshot / restoreLamp carry its mood and
//    clocks over a continue (game.js continueState `bossMood`, spawner.js).
//  - The Fallen Poltergeist (`boss` kind `fallenpoltergeist`, N2-16's boss): see its section at the end (initFallenPolt / updateFallenPolt / markFallenPolt).

import { TYPES } from '../data/monsters.js';
import { SFX } from './audio.js';
import { resolveMatches } from './board.js';
import { addFloat, ring, spark } from './combat.js';
import { isProtected } from './gourd.js';
import { mS, mY, spMulNow, spawnMonster, TILE_P } from './monsters.js';
import { ROTTEN, rotCell } from './rot.js';
import { poisonNow } from './poison.js';
import { COLS, G, GY, CS, LANE, ROWS, W, gest, graves, grid } from './state.js';
import { rnd, shuffle } from './util.js';
import { banner } from '../ui/hud.js';

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

// ---------- The Lamplighter (mini boss, N2-4 and N2-13; spec Part 5) ----------
const LAMP_FX = { clean:{ spark:'#ffc04a', ring:'rgba(255,190,80,.9)', text:'#ffd27a', say:'Only fresh pumpkins hurt it!' },
  rot:{ spark:'#a6e04a', ring:'rgba(166,224,74,.9)', text:'#b6f06a', say:'Only rotten pumpkins hurt it!' } };
const moodEvery = m => { const T = TYPES.lamplighter; return m.form === 2 && T.form2.moodEvery ? T.form2.moodEvery : T.moodEvery; };
const isLamp = m => m.type === 'boss' && m.kind === 'lamplighter';
/** Its hit flags from its mood: rot = only rotten pumpkins hurt it, clean = only normal ones (and every other kind of damage). */
function lampFlags(m){ m.rotOnly = m.mood === 'rot'; m.cleanOnly = m.mood !== 'rot'; }
/** Frame start (game.js update, right after markRotZones): every standing Lamplighter's flags from its mood. */
export function markMoods(){
  const ms = G.monsters;
  for (let i = 0; i < ms.length; i++){ const m = ms[i]; if (!m.dead && isLamp(m)) lampFlags(m); }
}
/** Set up a freshly spawned Lamplighter: clean mood, every clock full (a continued night restores them after this, restoreLamp). */
export function initLamplighter(m){
  const T = TYPES.lamplighter;
  m.mood = 'clean'; m.moodT = moodEvery(m); m.driftT = T.driftEvery; m.fogT = T.fogEvery; m.seenHp = m.hp;
  lampFlags(m);
}
/** What a continued night keeps of it: its mood and the time left on each clock. */
export const lampSnapshot = m => isLamp(m) ? { mood:m.mood, moodT:m.moodT, driftT:m.driftT, fogT:m.fogT } : null;
export function restoreLamp(m, s){
  if (!s || !isLamp(m)) return;
  m.mood = s.mood === 'rot' ? 'rot' : 'clean'; m.moodT = s.moodT; m.driftT = s.driftT; m.fogT = s.fogT; lampFlags(m);
}
const lampPuff = (m, col) => { const y = mY(m) - 30; for (let i = 0; i < 14; i++) spark(m.x, y, i % 3 ? col : '#2f4a42', 140); ring(m.x, y, 36, 'rgba(200,220,210,.7)'); };
function switchMood(m){
  m.mood = m.mood === 'rot' ? 'clean' : 'rot'; lampFlags(m);
  const F = LAMP_FX[m.mood], y = mY(m) - 40;
  m.flash = 0.18;   // the flash, then the lantern burns in its new colour (render/chars/lamplighter.js bakes both looks)
  for (let i = 0; i < 18; i++) spark(m.x + 20, y - 20, F.spark, 170);
  ring(m.x + 20, y - 20, 44, F.ring); ring(m.x, y, 64, F.ring);
  addFloat(F.say, m.x, mY(m) - m.r - 70, F.text, 17, 1.6);
  SFX.bossSfx('lamplighter', m.mood);
}
/** One frame of the Lamplighter. Its clocks run once it is on the field (p > 0.05), as the Strawlord's do. */
export function updateLamplighter(m, dt){
  const T = TYPES.lamplighter;
  m.x = m.tx + Math.sin(m.ph * 1.1) * 3;
  if (m.hp < m.seenHp && !m.anim) m.anim = { clip:'hit', t:0, dur:5 / 14 };   // a pumpkin landed: it recoils (render/chars/lamplighter.js picks the mood's hit)
  m.seenHp = m.hp;
  if (m.p <= 0.05) return;
  if ((m.moodT -= dt) <= 0){ m.moodT += moodEvery(m); switchMood(m); }
  if ((m.driftT -= dt) <= 0){   // to another lane: it dissolves into fog where it stood and gathers again where it lands
    m.driftT += T.driftEvery;
    const opts = [...Array(COLS).keys()].filter(l => l !== m.lane);
    lampPuff(m, LAMP_FX[m.mood].spark); m.lane = opts[Math.floor(Math.random() * opts.length)]; m.x = m.tx = LANE(m.lane); lampPuff(m, LAMP_FX[m.mood].spark);
    SFX.bossSfx('lamplighter', 'move');
  }
  if ((m.fogT -= dt) <= 0){   // one poison fog line on the patch, so there is always rot to answer its rot mood; a fog already up: call when it lifts
    const dir = Math.random() < 0.5 ? 'row' : 'col', idx = [Math.floor(Math.random() * (dir === 'row' ? ROWS : COLS))];
    if (poisonNow({ dir, idx }, 'lamp')){ m.fogT += T.fogEvery; ring(m.x + 20, mY(m) - 60, 40, 'rgba(166,224,74,.85)'); SFX.bossSfx('lamplighter', 'fog'); }
    else m.fogT = 0;
  }
}

// ---------- The Fallen Poltergeist (N2-16, the hollow nightmare's boss; spec Part 8) ----------
// Holds at the back like the Poltergeist (monsters.js stops it exactly at hold), never reaches the wall, immune to knockback and freeze like every boss.
// Every number is in TYPES.fallenpoltergeist. Its clocks run once it is on the field (p > 0.05).
//  - Vanish: every `vanishEvery` s it fades out (the teleport clip, left behind as a vfx) and gathers again in another lane (the clip in reverse on arrival).
//  - Swap: every `swapEvery` s `swapN` pumpkins trade places in a ring, colours kept: never a gourd, never one in a Protector square (isProtected),
//    never one in flight or in the player's hand.
//  - Black fog: every `zoneEvery` s a 3x3 zone (Plague Doctor 2's geometry: lanes +-1, 1.5 tiles) is laid on the field around a random monster on the
//    field (not itself, the jukebox or the Loot Sack) and lies there `zoneFor` s; every monster inside but itself is `rotOnly` (markFallenPolt). With no
//    monster on the field it lays the fog as soon as one comes.
//  - Shuffle: at each fraction of its health in `shuffleAt` every pumpkin outside a Protector square moves to a new cell outside one (a random cycle
//    through those cells, so none stays put), colours kept; gourds, graves and the square stay as they are.
//  - Reaper phase: at each fraction in `reaperAt` (entered on the hit that crosses it) it is `rotOnly` until `reaperHits` rotten pumpkins have hurt
//    it (each pumpkin counts; combat.js rotHitNow calls fpReaperHit), then back to normal (rotten pumpkins heal it again).
//  - Marks spent (`shufDone`, `reapDone`) are counted from its health on its first frame, as the Fallen Gravekeeper's infernos, so a continued night
//    (spawner.js restores its health right after spawning it) does not replay them. A reaper phase or a black fog in progress at the loss is gone.
const FP_FOG = '#132a18', FP_BLIGHT = '#8cff5c';
const sayX = x => Math.max(150, Math.min(W - 150, x));   // a long float over a boss at the field's edge stays on screen
export const isFallenPolt = m => m.type === 'boss' && m.kind === 'fallenpoltergeist';
/** Set up a freshly spawned Fallen Poltergeist: every clock full, no fog, not in a reaper phase; its spent marks are counted on its first frame. */
export function initFallenPolt(m){
  const T = TYPES.fallenpoltergeist;
  m.tpT = T.vanishEvery; m.swapT = T.swapEvery; m.zoneT = T.zoneEvery; m.fogs = []; m.reaper = 0; m.shufDone = null; m.reapDone = null;
}
/** Frame start (game.js update, after markMoods): its reaper phase, and every monster inside one of its black fogs, rot-only for this frame. */
export function markFallenPolt(){
  const ms = G.monsters;
  for (let i = 0; i < ms.length; i++){
    const b = ms[i]; if (b.dead || !isFallenPolt(b)) continue;
    if (b.reaper > 0) b.rotOnly = true;
    if (!b.fogs.length) continue;
    const reach = 1.5 * TILE_P();
    for (const f of b.fogs) for (let j = 0; j < ms.length; j++){
      const o = ms[j];
      if (o !== b && !o.dead && o.type !== 'jukebox' && o.type !== 'sack' && Math.abs(o.lane - f.lane) <= 1 && Math.abs(o.p - f.p) <= reach) o.rotOnly = true;
    }
  }
}
const fpMarks = m => {   // lazily, on its first frame: the shuffles and reaper phases its health is already past
  if (m.shufDone != null) return;
  const T = TYPES.fallenpoltergeist;
  m.shufDone = T.shuffleAt.filter(a => m.hp <= m.maxHp * a).length; m.reapDone = T.reaperAt.filter(a => m.hp <= m.maxHp * a).length;
};
const fogPuff = (x, y, n = 14) => { for (let i = 0; i < n; i++) spark(x, y, i % 3 ? FP_FOG : FP_BLIGHT, 150); ring(x, y, 40, 'rgba(140,255,92,.55)'); };
function enterReaper(m){
  m.reapDone++; m.reaper = TYPES.fallenpoltergeist.reaperHits; m.rotOnly = true;   // at once: the rest of this frame's hits meet the phase
  m.anim = { clip:'recolour', t:0, dur:6 / 9 }; m.flash = 0.18;
  const y = mY(m) - 40;
  for (let i = 0; i < 18; i++) spark(m.x, y, i % 2 ? FP_BLIGHT : '#1b3620', 180);
  ring(m.x, y, 50, 'rgba(140,255,92,.9)'); ring(m.x, mY(m), 72, 'rgba(140,255,92,.7)');
  addFloat('Reaper! Only rotten pumpkins hurt it', sayX(m.x), mY(m) - m.r - 70, '#b6f06a', 17, 1.8);
  G.shake = Math.max(G.shake || 0, 0.4);
  SFX.bossSfx('fallenpoltergeist', 'reaper');
}
/** After any hit that hurt it (combat.js damage): a reaper mark crossed starts its phase there and then. */
export function fpAfterHit(m){
  const T = TYPES.fallenpoltergeist; fpMarks(m);
  if (!m.reaper && m.reapDone < T.reaperAt.length && m.hp <= m.maxHp * T.reaperAt[m.reapDone]) enterReaper(m);
}
/** A rotten pumpkin hurt it (combat.js rotHitNow): one fewer to go in a reaper phase; the last one ends it. */
export function fpReaperHit(m){
  if (!(m.reaper > 0) || m.dead) return;
  m.reaper--;
  if (m.reaper > 0){ addFloat(`×${m.reaper} more`, m.x, mY(m) - m.r - 34, '#b6f06a', 16, 0.8); return; }
  m.rotOnly = false;   // back to normal now (a Plague Doctor 2's square or a black fog would mark it again next frame)
  for (let i = 0; i < 14; i++) spark(m.x, mY(m) - 30, i % 2 ? '#d8ffb0' : FP_FOG, 160);
  addFloat('The reaper fades', sayX(m.x), mY(m) - m.r - 40, '#d8ffb0', 18, 1.3);
  SFX.bossSfx('fallenpoltergeist', 'reaperend');
}
/** The pumpkins it may move: settled, not a gourd, not in the player's hand, not in a Protector square. */
function fpMovable(r, c){
  const cell = grid[r][c];
  return !!cell && !cell.gourd && !(cell.fly > 0) && !(gest && gest.ref === cell) && !isProtected(r, c);
}
const flyFrom = (cell, r0, c0, r1, c1) => { cell.fly = 0.55; cell.ox = LANE(c0) - LANE(c1); cell.oy = (r0 - r1) * CS; };   // it glides from its old cell; landing resolves the bunches (game.js)
/** Its swap: swapN (fewer when fewer can move, none below two) pumpkins outside any Protector square trade places in a ring, colours kept. */
export function fpSwap(m){
  const cells = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (fpMovable(r, c)) cells.push([r, c]);
  const k = Math.min(TYPES.fallenpoltergeist.swapN, cells.length);
  if (k < 2) return false;
  const picks = shuffle(cells).slice(0, k), moved = picks.map(([r, c]) => grid[r][c]);
  for (let q = 0; q < k; q++){   // each pumpkin moves to the next picked cell
    const [r0, c0] = picks[q], [r1, c1] = picks[(q + 1) % k], cell = moved[q];
    grid[r1][c1] = cell; flyFrom(cell, r0, c0, r1, c1);
    fogPuff(LANE(c1), GY + r1 * CS + CS / 2, 6);
  }
  m.anim = { clip:'swap', t:0, dur:6 / 10 };
  addFloat('Swapped!', m.x, mY(m) - m.r - 30, '#b6f06a', 16, 0.9);
  SFX.bossSfx('fallenpoltergeist', 'swap');
  return true;
}
/** The shuffle: every cell outside a Protector square that holds no gourd, no grave and nothing in flight or in hand takes part; their contents move
 *  round one random cycle (Sattolo), so every pumpkin among them lands on a new cell. Colours kept. */
export function fpShuffle(m){
  const P = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const cell = grid[r][c];
    if (graves[r][c] || isProtected(r, c) || (cell && !fpMovable(r, c))) continue;
    P.push([r, c]);
  }
  if (P.length >= 2){
    const to = P.map((_, i) => i);
    for (let i = to.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * i); [to[i], to[j]] = [to[j], to[i]]; }   // Sattolo: one cycle, no cell maps to itself
    const was = P.map(([r, c]) => grid[r][c]);
    for (const [r, c] of P) grid[r][c] = null;
    P.forEach(([r0, c0], i) => { const cell = was[i]; if (!cell) return; const [r1, c1] = P[to[i]]; grid[r1][c1] = cell; flyFrom(cell, r0, c0, r1, c1); });
  }
  m.anim = { clip:'swap', t:0, dur:6 / 10 }; G.shake = Math.max(G.shake || 0, 0.6);
  for (const [r, c] of P) if (grid[r][c]) fogPuff(LANE(c), GY + r * CS + CS / 2, 4);
  banner('The patch shifts!', 'Every pumpkin outside a Protector square moved.', 2);
  SFX.bossSfx('fallenpoltergeist', 'shuffle');
}
/** The black fog: a 3x3 around a random monster on the field (not itself, the jukebox or the Loot Sack). False when there is none yet. */
function fpZone(m){
  const T = TYPES.fallenpoltergeist, opts = G.monsters.filter(o => o !== m && !o.dead && o.type !== 'jukebox' && o.type !== 'sack' && o.p > 0 && o.p < 1);
  if (!opts.length) return false;
  const o = opts[Math.floor(Math.random() * opts.length)];
  m.fogs.push({ lane:o.lane, p:o.p, t:T.zoneFor, dur:T.zoneFor });
  fogPuff(LANE(o.lane), mY(o), 16); ring(m.x, mY(m) - 40, 40, 'rgba(140,255,92,.8)');
  m.anim = m.anim || { clip:'recolour', t:0, dur:6 / 9 };
  SFX.bossSfx('fallenpoltergeist', 'fog');
  return true;
}
/** It vanishes and gathers again in another lane. */
function fpVanish(m){
  fogPuff(m.x, mY(m) - 20); if (G.vfx) G.vfx.push({ kind:'clip', key:'fallenpoltergeist', clip:'teleport', x:m.x, y:mY(m), s:mS(m), t:0, dur:0.5 });
  const opts = [...Array(COLS).keys()].filter(l => l !== m.lane);
  m.lane = opts[Math.floor(Math.random() * opts.length)]; m.x = m.tx = LANE(m.lane); m.age = 0;   // age 0: the arrival plays the teleport clip in reverse (anim.js)
  fogPuff(m.x, mY(m) - 20);
  SFX.bossSfx('fallenpoltergeist', 'vanish');
}
/** One frame of the Fallen Poltergeist. */
export function updateFallenPolt(m, dt){
  const T = TYPES.fallenpoltergeist;
  m.x = m.tx + Math.sin(m.ph * 1.2) * 4;
  fpMarks(m);
  if (m.fogs.length){ for (const f of m.fogs) f.t -= dt; m.fogs = m.fogs.filter(f => f.t > 0); }
  if (m.shufDone < T.shuffleAt.length && m.hp <= m.maxHp * T.shuffleAt[m.shufDone]){ m.shufDone++; fpShuffle(m); }
  fpAfterHit(m);   // a phase due that no hit started (one hit past both marks: the second waits for the first to end)
  if (m.reaper > 0 && (m.reapPulse = (m.reapPulse || 0) - dt) <= 0){ m.reapPulse = 0.7; ring(m.x, mY(m) - 30, 46, 'rgba(140,255,92,.6)'); }   // a poison pulse while it is reaper
  if (m.p <= 0.05) return;
  if ((m.tpT -= dt) <= 0){ m.tpT = T.vanishEvery; fpVanish(m); }
  if ((m.swapT -= dt) <= 0){ m.swapT = T.swapEvery; fpSwap(m); }
  if ((m.zoneT -= dt) <= 0){ if (fpZone(m)) m.zoneT = T.zoneEvery; else m.zoneT = 0; }
}
