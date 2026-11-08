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
//  - The Ash Crone (`ashcrone`): every `zoneEvery` s, while she walks the field (as the witch casts), she raises an undead zone: a Hexwitch box
//    (G.hexZones, 3 lanes × 3 tiles, `zoneLast` s) centred on a random living non-boss monster other than herself within 2 lanes of her
//    (none near: no zone that time, our call). combat.js's hex-zone rule makes anything non-boss killed inside rise after 4 s. She arrives ringed
//    by `crows` crows (spawnMonster, beside the Vampire's bats; not when she is a minion).
//  - The Blood Coven Witch (`covenwitch`): every `brewEvery` s, while she walks the field, her cauldron boils over: brewN[0]..brewN[1] different
//    random monsters (not herself) each get one random-kind potion on the tile just ahead of them (one row nearer the fence), skipped when
//    that tile holds a potion already or is past the last row.
//  - The Triptych Sprite (`triptych`): the Mirror Sprite's up/down cycle (barrier up `reflect` s, down `open` s; monsters.js drops it while it
//    chews), playing its summon clip as it goes up. Its barrier stands across its own lane and `lanes` lanes either side, at the front of the
//    sprite (where a pumpkin would hit it). game.js asks triptychAhead for every pumpkin in flight: a pumpkin that reaches a raised barrier in
//    its lane is reflected back down that lane (combat.js reflectPumpkin) and stops there, unless a monster standing in front of the barrier in
//    that lane is met first (things are met in the order they stand).
//  - The Treant (`boss` kind `treant`, the N3-4 and N3-13 mini boss) holds at the back like the Lamplighter (monsters.js stops it exactly at hold)
//    and never moves from there. Every `rootEvery` s (its clock runs once it is on the field, p > 0.05) it plays its summon clip and raises
//    rootN[0]..rootN[1] roots in as many other lanes (never its own). G.roots holds them: { lane, p, hp, t, atFence }. A lane holds at most one
//    root of each kind; each pick is 50/50 between the kinds the lane can still take (a fence root only over a standing fence; our calls).
//      * a mid-field root stands on a tile row whose centre lies in FIRE_P_RANGE and blocks its lane: game.js asks rootAhead for every pumpkin
//        in flight, so the first pumpkin up that lane that reaches it hits it and stops (Grey too), unless a monster stands in front of it.
//        `rootHp` hits destroy it (one a pumpkin, whatever its power; rot splats on it as on stone). It never sinks by itself.
//      * a fence root stands at the fence (ROOT_FENCE_P, in front of the chewers) and squeezes it at `rootSqueeze` a second until it is
//        destroyed the same way or sinks after `rootLast` s.
//    When the Treant falls every root sinks. A continued night keeps the roots (rootSnapshot / restoreRoots, game.js) and the Treant's clock
//    (treantSnapshot / restoreTreant, beside the Lamplighter's bossSnapshot in game.js and spawner.js).

import { TYPES } from '../data/monsters.js';
import { SFX } from './audio.js';
import { addFloat, chunk, spark } from './combat.js';
import { TILE_P, mS, mY } from './monsters.js';
import { POTION_FX, POTION_KINDS, placePotion, potionAt } from './potion.js';
import { COLS, FENCE_Y, FIELD_BOT, FIELD_TOP, G, LANE, walls } from './state.js';
import { shuffle } from './util.js';
import { damageWall } from './walls.js';
import { FIRE_P_RANGE } from '../data/rules.js';

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
  if (m.type === 'covenwitch') m.brewT = TYPES.covenwitch.brewEvery;   // the Ash Crone's zoneT is spawnMonster's (T.zoneEvery)
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
    case 'ashcrone':   // a slow hunched shuffle
      m.x = m.tx + Math.sin(m.ph * 1.2) * 2;
      ashZone(m, dt);
      return true;
    case 'covenwitch':
      m.x = m.tx + Math.sin(m.ph * 1.6) * 2;
      covenBrew(m, dt);
      return true;
    case 'triptych':   // barrier up / barrier down, as the Mirror Sprite's mirror
      triptychCycle(m, dt);
      m.x = m.tx + Math.sin(m.ph * 2) * 3;
      return true;
  }
  return false;
}

// ---------- the Ash Crone ----------
/** A monster a witch's spell may land on: alive, on the field, standing (not risen-pending, not hidden), not herself; not the jukebox or the sack. */
const onField = (o, m) => o !== m && !o.dead && !o.hidden && o.rise <= 0 && o.p > 0 && o.type !== 'jukebox' && o.type !== 'sack';

function ashZone(m, dt){
  const T = TYPES.ashcrone;
  m.zoneT -= dt;
  if (m.zoneT > 0 || m.p <= 0.05) return;
  m.zoneT = T.zoneEvery;
  const near = G.monsters.filter(o => onField(o, m) && o.type !== 'boss' && Math.abs(o.lane - m.lane) <= 2);
  if (!near.length) return;
  const o = near[Math.floor(Math.random() * near.length)];
  G.hexZones.push({ shape:'box', lane:o.lane, p:o.p, t:T.zoneLast });
  const y = mY(o);
  for (let i = 0; i < 12; i++) spark(o.x, y, i % 2 ? '#8a8a92' : '#ff2a3a', 140);   // ash and a red glint where it opens
  addFloat('Undead zone!', m.x, mY(m) - m.r - 30, '#d8d4cc', 16, 1.1);
  SFX.monsterAct('ashcrone', 'zone'); m.anim = { clip:'hex', t:0, dur:0.5 };
}

// ---------- the Blood Coven Witch ----------
function covenBrew(m, dt){
  const T = TYPES.covenwitch;
  m.brewT -= dt;
  if (m.brewT > 0 || m.p <= 0.05) return;
  m.brewT = T.brewEvery;
  const pick = shuffle(G.monsters.filter(o => onField(o, m)));
  if (!pick.length) return;
  const n = T.brewN[0] + Math.floor(Math.random() * (T.brewN[1] - T.brewN[0] + 1)), tp = TILE_P(), last = rows() - 1;
  for (const o of pick.slice(0, n)){
    const r = Math.floor(o.p / tp) + 1;   // the tile just ahead of it
    if (r <= last) placePotion(o.lane, (r + 0.5) * tp, POTION_KINDS[Math.floor(Math.random() * POTION_KINDS.length)]);
  }
  const y = mY(m);
  for (let i = 0; i < 10; i++) spark(m.x - 10, y - 4, i % 2 ? '#c8101e' : '#ff5a5a', 120);   // the cauldron boils over
  SFX.monsterAct('covenwitch', 'brew'); m.anim = { clip:'hex', t:0, dur:0.5 };
}

// ---------- the Triptych Sprite ----------
export const SUMMON_DUR = 10 / 12;   // its summon clip (render/chars/witchwood.js: 10 frames at 12 fps) as the barrier goes up
function triptychCycle(m, dt){
  const T = TYPES.triptych;
  m.mirrorT -= dt;
  if (m.mirrorT > 0) return;
  m.reflecting = !m.reflecting; m.mirrorT = m.reflecting ? T.reflect : T.open;
  if (m.reflecting){ SFX.monsterAct('mirror', 'up'); m.anim = { clip:'summon', t:0, dur:SUMMON_DUR }; }
}
/** How far in front of a Triptych its barrier stands (game pixels below its centre): where a pumpkin in its own lane would hit it. */
export const barrierFront = m => m.r * mS(m) * 0.8;
/** The raised Triptych barrier pumpkin pr (flying up its lane) has reached this frame, or null: the nearest the fence of those whose lanes
 *  cover pr's lane (own lane ± TYPES.triptych.lanes) and whose barrier line (mY + barrierFront) it has passed. No allocation (per pumpkin, per frame). */
export function triptychAhead(pr){
  const reach = TYPES.triptych.lanes;
  let best = null;
  for (const m of G.monsters){
    if (m.type !== 'triptych' || !m.reflecting || m.eating || m.dead || m.hidden || m.rise > 0 || pr.hit.has(m) || Math.abs(m.lane - pr.lane) > reach) continue;
    if (pr.y >= mY(m) + pr.r + barrierFront(m)) continue;   // not there yet
    if (!best || m.p > best.p) best = m;
  }
  return best;
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

// ---------- the Treant (mini boss, N3-4 and N3-13; spec Part 4) ----------
export const ROOT_FENCE_P = 1.02;   // where a fence root stands: just in front of the chewers at the fence (p 1), so it is met first
export const ROOT_RISE = 8 / 12, ROOT_SINK = 8 / 13;   // its rise and sink clips (render/chars/witchwood.js: 8 frames at 12 and 13 fps)
const ROOT_R = 16;   // a pumpkin meets a root this far below the root's centre (as a monster's radius × 0.8)
const isTreant = m => m.type === 'boss' && m.kind === 'treant';
const tv = (m, k) => { const T = TYPES.treant; return m.form === 2 && T.form2[k] != null ? T.form2[k] : T[k]; };
/** A root's centre on screen (game pixels): a fence root's p is past 1, so it sits between the field's bottom and the fence. */
export const rootY = r => FIELD_TOP + r.p * (FIELD_BOT - FIELD_TOP);
const rootSparks = (r, n) => { const x = LANE(r.lane), y = rootY(r); for (let i = 0; i < n; i++) spark(x, y, i % 3 ? '#5c3b3c' : '#c87aff', 140); };

/** Set up a freshly spawned Treant: its root clock full (a continued night restores it after this, restoreTreant). */
export function initTreant(m){ m.rootT = tv(m, 'rootEvery'); m.seenHp = m.hp; }
/** What a continued night keeps of it: the time left on its root clock. */
export const treantSnapshot = m => isTreant(m) ? { rootT:m.rootT } : null;
export function restoreTreant(m, s){
  if (!s || !isTreant(m) || s.rootT == null) return;
  m.rootT = s.rootT; m.seenHp = m.hp;   // seenHp: its restored health is no hit
}
/** One frame of the Treant: it creaks in place, recoils when hit and summons roots on its clock. */
export function updateTreant(m, dt){
  m.x = m.tx + Math.sin(m.ph * 0.9) * 1.5;
  if (m.hp < m.seenHp && !m.anim) m.anim = { clip:'hit', t:0, dur:5 / 14 };
  m.seenHp = m.hp;
  if (m.p <= 0.05) return;
  if ((m.rootT -= dt) <= 0){ m.rootT += tv(m, 'rootEvery'); summonRoots(m); }
}
function summonRoots(m){
  const [a, b] = tv(m, 'rootN'), n = a + Math.floor(Math.random() * (b - a + 1));
  const kindsFor = l => { const has = k => G.roots.some(r => r.lane === l && !!r.atFence === k); return [...(has(false) ? [] : [false]), ...(has(true) || !(walls[l] && walls[l].hp > 0) ? [] : [true])]; };
  const lanes = shuffle([...Array(COLS).keys()].filter(l => l !== m.lane && kindsFor(l).length)).slice(0, n);
  for (const l of lanes){ const ks = kindsFor(l); raiseRoot(l, ks[Math.floor(Math.random() * ks.length)]); }
  m.anim = { clip:'summon', t:0, dur:1 };   // 10 frames at 10 fps
  const y = mY(m);
  for (let i = 0; i < 14; i++) spark(m.x + (i % 2 ? -36 : 36), y + 16, i % 3 ? '#c87aff' : '#5a3a26', 150);   // its hands slam the ground
  if (lanes.length) addFloat('Roots!', m.x, y - m.r - 40, '#d8b8ff', 17, 1.1);
  SFX.bossSfx('treant', 'summon');
}
/** Raise a root in `lane`: at the fence (atFence) or mid-field at p (a random tile row centre in FIRE_P_RANGE when left out). A root of the
 *  same kind already in that lane is replaced. Pumpkins already past it in that lane fly on (fire.js's rule for a fire lit behind one). */
export function raiseRoot(lane, atFence, p){
  if (!G.roots) G.roots = [];
  const T = TYPES.treant, fence = !!atFence;
  if (!fence && p == null){
    const tp = TILE_P(), rs = [...Array(rows()).keys()].map(r => (r + 0.5) * tp).filter(c => c >= FIRE_P_RANGE[0] && c <= FIRE_P_RANGE[1]);
    p = rs.length ? rs[Math.floor(Math.random() * rs.length)] : 0.5;
  }
  const i = G.roots.findIndex(r => r.lane === lane && !!r.atFence === fence);
  if (i >= 0) G.roots.splice(i, 1);
  const r = { lane, p:fence ? ROOT_FENCE_P : p, hp:T.rootHp, t:0, atFence:fence };
  G.roots.push(r);
  for (const pr of G.projs || []) if (pr.lane === lane && !pr.dead && pr.y < rootY(r)) (pr.passed || (pr.passed = new Set())).add(r);
  rootSparks(r, 10);
  return r;
}
/** The root pumpkin pr (flying up its lane) has reached this frame, or null: the nearest the fence of those in its lane. No allocation. */
export function rootAhead(pr){
  let best = null;
  for (const r of G.roots) if (r.lane === pr.lane && !(pr.passed && pr.passed.has(r)) && pr.y <= rootY(r) + pr.r + ROOT_R && (!best || r.p > best.p)) best = r;
  return best;
}
/** A pumpkin meets a root: one hit off it (a rotten one splats there and does nothing, as on a castle wall); the pumpkin stops either way. */
export function hitRoot(pr, r, rotten){
  pr.dead = true; pr.hit.add(r);
  if (rotten){ rootSparks(r, 6); return; }
  r.hp -= 1; rootSparks(r, 8);
  if (r.hp <= 0){ sinkRoot(r); SFX.bossSfx('treant', 'rootbreak'); }
  else SFX.bossSfx('treant', 'root');
}
/** A root goes: off the field, its sink clip played where it stood. */
function sinkRoot(r){
  const i = G.roots.indexOf(r); if (i < 0) return;
  G.roots.splice(i, 1);
  if (G.vfx) G.vfx.push({ kind:'clip', key:'root', clip:'sink', x:LANE(r.lane), y:rootGround(r), s:rootScale(r), t:0, dur:ROOT_SINK });
}
/** Where a root's ground line is drawn and how big (render/witchwood.js drawRoots): a fence root rises from the fence's foot. */
export const rootGround = r => r.atFence ? FENCE_Y + 6 : rootY(r) + 14;
export const rootScale = r => r.atFence ? 1.05 : 0.85 + 0.2 * Math.min(1, Math.max(0, r.p));
/** Per frame: each root's age; a fence root squeezes its fence and sinks after rootLast. */
export function updateRoots(dt){
  const T = TYPES.treant;
  for (let i = G.roots.length - 1; i >= 0; i--){
    const r = G.roots[i];
    r.t += dt;
    if (!r.atFence) continue;
    if (walls[r.lane] && walls[r.lane].hp > 0){ damageWall(r.lane, T.rootSqueeze * dt); if (Math.random() < dt * 3) chunk(LANE(r.lane) + (Math.random() - 0.5) * 20, FENCE_Y - 16, '#8a6440', 80); }
    if (r.t >= T.rootLast) sinkRoot(r);
  }
}
/** What a continued night keeps of the roots: every one as it stands. */
export const rootSnapshot = () => (G.roots || []).map(r => ({ lane:r.lane, p:r.p, hp:r.hp, t:r.t, atFence:!!r.atFence }));
export function restoreRoots(list){ G.roots = (list || []).map(r => ({ lane:r.lane, p:r.p, hp:r.hp, t:r.t, atFence:!!r.atFence })); }

// ---------- deaths ----------
/** kill() (combat.js), once a Release 7 monster is truly dead: the Flask Bearer's potion, the toad's burst, the Treant's roots sinking. */
export function witchwoodFalls(m){
  if (isTreant(m)){ for (const r of (G.roots || []).slice()) sinkRoot(r); return; }
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
