// Nightmare monsters' own behaviour (Release 4, Nightmare Pumpkin Patch; spec Part 4). monsters.js calls updateNightmareMonster from the
// type switch of updateMonster, which only runs while a monster is not frozen, not chewing and not down; it returns true when it handled
// the type (and set m.x). Every caller gates on `__RELEASE__ >= 4`, so lower builds drop this module.

import { TYPES } from '../data/monsters.js';
import { SFX } from './audio.js';
import { addFloat, chunk, ring, spark } from './combat.js';
import { lightFire } from './fire.js';
import { gourdPos, isProtected } from './gourd.js';
import { findCell, resolveMatches } from './board.js';
import { igniteNear, mS, mY, spawnMonster, TILE_P } from './monsters.js';
import { COLS, CS, FENCE_Y, G, GY, LANE, ROWS, gest, graves, grid, walls } from './state.js';
import { PTYPES } from '../data/pumpkins.js';
import { FIRE_P_RANGE } from '../data/rules.js';
import { damageWall } from './walls.js';
import { banner } from '../ui/hud.js';

/** Monsters a crow cannot speed up: those that stand still on purpose. */
const noRush = o => o.type === 'boss' || o.type === 'sack' || o.type === 'jukebox';

/** The Cinder Rooster crows: every monster in its lane and the lane either side runs faster for rushT seconds. */
function crow(m){
  const T = TYPES.rooster;
  m.anim = { clip:'crow', t:0, dur:10 / 12 };
  for (const o of G.monsters) if (!o.dead && o.rise <= 0 && !noRush(o) && Math.abs(o.lane - m.lane) <= 1) o.rush = T.rushT;
  ring(m.x, mY(m), 70, 'rgba(255,150,60,.8)');
  for (let i = 0; i < 8; i++) spark(m.x, mY(m) - 10, i % 2 ? '#ffd35a' : '#ff6a1a', 120);
  SFX.monsterAct('rooster', 'crow');
}

/** The Hayrick throws its pitchfork, once. About one in three (fenceChance, rolled once per Hayrick) hurl it at their own fence instead
 *  (owner 2026-11-05): it flies down the lane and takes fenceHit of the fence's full health, never the last 1 (like the Hollow King's smash,
 *  game.js lands it). Otherwise, and whenever that fence is already down to 1 or less, it goes down its column: the first pumpkin it meets
 *  there, coming down from the field (row 0 is beside the fence; a gourd is skipped, and so is one already pinned or in flight) is pinned
 *  for pinT seconds. With nothing to pin it keeps the fork and tries again next frame. */
function throwFork(m){
  const T = TYPES[m.type];
  if (m.atFence == null) m.atFence = Math.random() < T.fenceChance;
  if (m.atFence && walls[m.lane] && walls[m.lane].hp > 1){
    G.arrows.push({ lane:m.lane, p:m.p + 0.03, sp:T.forkSp, dmg:0, fork:true, hit:T.fenceHit, spin:Math.random() * 6, dead:false });
    m.thrown = true; m.anim = { clip:'toss', t:0, dur:10 / 14 };
    ring(m.x, mY(m), 50, 'rgba(255,214,120,.7)');
    SFX.monsterAct('hayrick', 'toss');
    return;
  }
  for (let r = 0; r < ROWS; r++){
    const cell = grid[r][m.lane];
    if (!cell || cell.gourd || cell.fly > 0 || cell.pinned > 0) continue;
    cell.pinned = cell.pinMax = TYPES[m.type].pinT; m.thrown = true;
    m.anim = { clip:'toss', t:0, dur:10 / 14 };
    ring(m.x, mY(m), 50, 'rgba(255,214,120,.7)');
    SFX.monsterAct('hayrick', 'toss');
    return;
  }
}

/** The Grave Riser digs: a grave on a random cell anywhere on the patch (owner 2026-11-05: not only its own column) with no pumpkin (the gourd
 *  is a cell too) and no grave. With no such cell it does nothing this time (no clip, no sound). The grave is an ordinary one: it stays after the riser dies. */
function dig(m){
  const free = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!grid[r][c] && !graves[r][c]) free.push([r, c]);
  if (!free.length) return;
  const [r, c] = free[Math.floor(Math.random() * free.length)], x = LANE(c), y = GY + r * CS + CS / 2;
  graves[r][c] = true;
  m.anim = { clip:'dig', t:0, dur:10 / 12 };   // the dig clip: 10 frames at 12 fps (render/chars/graveriser.js)
  for (let i = 0; i < 14; i++) chunk(x, y, i % 2 ? '#5a4030' : '#8a8d96', 180);   // earth and stone burst up as the headstone rises
  ring(x, y, 36, 'rgba(190,160,120,.8)');
  SFX.monsterAct('graveriser', 'dig');
}

// ---------- The Strawlord (mini boss, N1-4 and N1-13; spec Part 4) ----------
// Bosses never reach the wall: it stands at the back of a lane at `hold`, immune to knockback and freeze like every boss (combat.js), and
// monsters.js keeps it from walking past hold. Every number is in TYPES.strawlord.

/** Set up a freshly spawned Strawlord: bossForm 2 (N1-13) starts it already off its post, in phase 2 (a continued night sets phase2 after this). */
export function initStrawlord(m){
  const T = TYPES.strawlord;
  m.phase2 = m.form === 2; m.flockT = T.flockEvery[m.phase2 ? 1 : 0]; m.moveT = T.moveEvery; m.seenHp = m.hp;
}
const strawPuff = m => { const y = mY(m) - 30; for (let i = 0; i < 14; i++) spark(m.x, y, i % 3 ? '#d9b455' : '#4e4272', 150); ring(m.x, y, 34, 'rgba(232,200,110,.8)'); };
/** Half health: it rips its hands off the nails and drops off the post (the tear clip, once), but stays at the back. */
function tearFree(m){
  m.phase2 = true; m.anim = { clip:'tear', t:0, dur:12 / 10 }; m.flockT = TYPES.strawlord.flockEvery[1];
  for (let i = 0; i < 18; i++) spark(m.x, mY(m) - 20, i % 2 ? '#d9b455' : '#a8843a', 190);
  addFloat('It tears free!', m.x, mY(m) - m.r - 40, '#ff8a3a', 20, 1.4); SFX.bossSfx('strawlord', 'tear'); G.shake = Math.max(G.shake || 0, 0.5);
}
/** flock: crows[0]..crows[1] crows burst out of its coat and dive down random lanes. No fire (owner 2026-11-05: fire comes only from its moves). */
function flock(m){
  const T = TYPES.strawlord, n = T.crows[0] + Math.floor(Math.random() * (T.crows[1] - T.crows[0] + 1));
  for (let i = 0; i < n; i++){ const c = spawnMonster('crow', Math.floor(Math.random() * COLS), true, m.p + 0.02); c.x = m.x + (Math.random() - 0.5) * 40; }   // they fly out of the coat, then fan out to their lanes
  if (!m.phase2) m.anim = { clip:'flock', t:0, dur:12 / 12 };   // the coat flaps open on the post (in phase 2 it is off the post: the crows just burst out)
  SFX.bossSfx('strawlord', 'flock');
}
/** The fire trail of a move (owner 2026-11-05): the tiles on its row in the lanes it passed over, from the lane it left towards the one it
 *  landed on (that one stays clear, it stands there), trailMax at most, the ones nearest the lane it left first. A tile already burning stays as it is. */
function fireTrail(m, from, max = TYPES.strawlord.trailMax){
  const step = m.lane > from ? 1 : -1;
  let n = 0;
  for (let l = from; l !== m.lane && n < max; l += step, n++) lightFire(l, m.p, n > 0);
}

/** One frame of the Strawlord. Its timers run once it is on the field, as the Gravekeeper's do. */
export function updateStrawlord(m, dt){
  const T = TYPES.strawlord;
  m.x = m.tx;
  if (!m.phase2 && m.hp <= m.maxHp / 2) tearFree(m);
  if (m.hp < m.seenHp && !m.phase2 && !m.anim) m.anim = { clip:'hit', t:0, dur:5 / 14 };   // a pumpkin landed: it flinches on the post
  m.seenHp = m.hp;
  if (m.p <= 0.05) return;
  m.flockT -= dt;
  if (m.flockT <= 0){ m.flockT = T.flockEvery[m.phase2 ? 1 : 0]; flock(m); }
  m.moveT -= dt;
  if (m.moveT <= 0){   // to another lane, like the Gravekeeper's teleport: a burst of straw where it stood and where it lands, and a trail of fire between
    m.moveT = T.moveEvery;
    const opts = [...Array(COLS).keys()].filter(l => l !== m.lane), from = m.lane;
    strawPuff(m); m.lane = opts[Math.floor(Math.random() * opts.length)]; m.x = m.tx = LANE(m.lane); strawPuff(m);
    fireTrail(m, from);
    SFX.bossSfx('strawlord', 'move');
  }
}

// ---------- The Fallen Gravekeeper (N1-16, the nightmare patch's boss; owner 2026-11-05) ----------
// Holds at the back like the Gravekeeper (monsters.js keeps it from walking past hold), immune to knockback and freeze like every boss. Every number
// is in TYPES.fallengravekeeper. Its timers run once it is on the field (p > 0.05).
const pick = a => a[Math.floor(Math.random() * a.length)];
/** Set up a freshly spawned Fallen Gravekeeper. infDone (infernos already used) is set on its first frame, from its health then, so a continued
 *  night (spawner.js restores the boss's health right after spawning it) does not replay the infernos it already passed. */
export function initFallenGK(m){
  const T = TYPES.fallengravekeeper;
  m.teleport = T.teleportEvery; m.summon = T.summonEvery; m.smashT = T.smashEvery; m.crowT = T.crowEvery; m.sweep = []; m.smashHit = null; m.infDone = null;
}
const ash = m => { const y = mY(m) - 20; for (let i = 0; i < 14; i++) spark(m.x, y, i % 2 ? '#ff7a1a' : '#3a2620', 170); ring(m.x, mY(m), 40, 'rgba(255,122,26,.8)'); };
/** It teleports to another lane (dissolving in ash and eclipse fire) and leaves a fire trail across the lanes it passed. */
function fgkTeleport(m){
  const T = TYPES.fallengravekeeper, from = m.lane;
  ash(m); if (G.vfx) G.vfx.push({ kind:'clip', key:'fallengravekeeper', clip:'teleport', x:m.x, y:mY(m), s:mS(m), t:0, dur:0.5 });
  m.lane = pick([...Array(COLS).keys()].filter(l => l !== from)); m.x = m.tx = LANE(m.lane); m.age = 0;   // age 0: the arrival plays the teleport clip in reverse (anim.js)
  ash(m); fireTrail(m, from, T.trailMax);
  SFX.bossSfx('fallengravekeeper', 'teleport');
}
/** It raises summonN monsters from summonPool in its lane or the one either side (minions: they do not count toward the night). */
function fgkSummon(m){
  const T = TYPES.fallengravekeeper;
  for (let i = 0; i < T.summonN; i++){
    const lane = Math.max(0, Math.min(COLS - 1, m.lane + Math.floor(Math.random() * 3) - 1)), o = spawnMonster(pick(T.summonPool), lane, true, Math.max(0, m.p - 0.02));
    for (let k = 0; k < 10; k++) chunk(o.x, mY(o), k % 2 ? '#5a4030' : '#ff7a1a', 150);
  }
  m.anim = { clip:'cast', t:0, dur:6 / 12 };
  SFX.bossSfx('fallengravekeeper', 'summon');
}
/** The smash: it drives its spade into the ground and a wave of eclipse fire races down its lane and the two beside it; when the wave lands
 *  (smashWave s later) each of those fences loses smashHit of its full health, never its last 1 (like the Hollow King's smash). */
function fgkSmash(m){
  const T = TYPES.fallengravekeeper, lanes = [m.lane - 1, m.lane, m.lane + 1].filter(l => l >= 0 && l < COLS);
  m.anim = { clip:'stab', t:0, dur:8 / 12 };
  if (G.vfx) G.vfx.push({ kind:'firewave', lanes, y0:mY(m) + 14, y1:FENCE_Y - 12, t:0, dur:T.smashWave });
  m.smashHit = { lanes, t:T.smashWave };
  G.shake = Math.max(G.shake || 0, 0.4);
  SFX.bossSfx('fallengravekeeper', 'smash');
}
function landSmash(m){
  const T = TYPES.fallengravekeeper;
  for (const l of m.smashHit.lanes){
    const w = walls[l]; if (!w) continue;
    const amt = Math.min(w.max * T.smashHit, w.hp - 1); if (amt > 0) damageWall(l, amt);
    for (let i = 0; i < 10; i++) spark(LANE(l), FENCE_Y - 14, i % 2 ? '#ffb040' : '#ff5a1a', 200);
  }
  m.smashHit = null; G.shake = Math.max(G.shake || 0, 0.9);
}
/** An inferno: one whole field column (a random lane, back to fence) or one whole field row (a random row in the fire band, from its lane outward)
 *  bursts into flame, a tile every infernoStep s. The tile it stands on stays clear. */
function fgkInferno(m){
  const T = TYPES.fallengravekeeper, tp = TILE_P(), rows = Math.max(1, Math.floor(1 / tp)), rowP = r => (r + 0.5) * tp, tiles = [];
  const isRow = Math.random() < 0.5;
  if (isRow){
    const band = [...Array(rows).keys()].filter(r => rowP(r) >= FIRE_P_RANGE[0] && rowP(r) <= FIRE_P_RANGE[1]), r = band.length ? pick(band) : Math.floor(rows / 2);
    for (const l of [...Array(COLS).keys()].sort((a, b) => Math.abs(a - m.lane) - Math.abs(b - m.lane))) tiles.push([l, rowP(r)]);
  } else { const lane = Math.floor(Math.random() * COLS); for (let r = 0; r < rows; r++) tiles.push([lane, rowP(r)]); }
  m.sweep = tiles.filter(([l, p]) => !(l === m.lane && Math.abs(p - m.p) < tp / 2)).map(([l, p], i) => ({ l, p, t:i * T.infernoStep }));
  m.anim = { clip:'cast', t:0, dur:6 / 12 }; G.shake = Math.max(G.shake || 0, 0.6);
  banner('Inferno!', isRow ? 'A whole row of the field bursts into flame.' : 'A whole column of the field bursts into flame.', 2);
  SFX.bossSfx('fallengravekeeper', 'inferno');
}
/** Crows swoop in: crows[0]..crows[1] of them at the top of random lanes (minions). */
function fgkCrows(){
  const [a, b] = TYPES.fallengravekeeper.crows, n = a + Math.floor(Math.random() * (b - a + 1));
  for (let i = 0; i < n; i++) spawnMonster('crow', Math.floor(Math.random() * COLS), true, -0.02);
  SFX.bossSfx('fallengravekeeper', 'crows');
}
/** One frame of the Fallen Gravekeeper. */
export function updateFallenGK(m, dt){
  const T = TYPES.fallengravekeeper;
  m.x = m.tx + Math.sin(m.ph * 1.4) * 4;
  if (m.infDone == null) m.infDone = T.infernoAt.filter(a => m.hp <= m.maxHp * a).length;
  if (m.sweep.length){
    for (const s of m.sweep){ s.t -= dt; if (s.t <= 0){ s.done = true; if (lightFire(s.l, s.p) && G.vfx) G.vfx.push({ kind:'fireflare', x:LANE(s.l), y:FIELD_Y(s.p), t:0, dur:0.45 }); } }
    m.sweep = m.sweep.filter(s => !s.done);
  } else if (m.infDone < T.infernoAt.length && m.hp <= m.maxHp * T.infernoAt[m.infDone]){ m.infDone++; fgkInferno(m); }   // one at a time: a hit past two marks sets off the second when the first is done
  if (m.smashHit && (m.smashHit.t -= dt) <= 0) landSmash(m);
  if (m.p <= 0.05) return;
  if ((m.teleport -= dt) <= 0){ m.teleport = T.teleportEvery; fgkTeleport(m); }
  if ((m.summon -= dt) <= 0){ m.summon = T.summonEvery; fgkSummon(m); }
  if ((m.smashT -= dt) <= 0){ m.smashT = T.smashEvery; fgkSmash(m); }
  if ((m.crowT -= dt) <= 0){ m.crowT = T.crowEvery; fgkCrows(); }
}
const FIELD_Y = p => mY({ p });

// ---------- Crows in the patch (owner 2026-11-05) ----------
/** A crow at the fence picks a pumpkin to take: any on the patch but a gourd, the cells of the Grave Gourd's 3×3 (Release 4) or of a Protector
 *  Gourd's (Release 5, isProtected), one sliding or flying in, the one the player is holding, or one another crow is already diving at. Null when there is none (then it pecks the fence like any monster). */
function crowTarget(){
  const gp = gourdPos(), out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const cell = grid[r][c];
    if (!cell || cell.gourd || cell.fly > 0 || (gest && gest.ref === cell) || (G.crowDives && G.crowDives.some(d => d.cell === cell))) continue;   // nor one another crow is already diving at
    if (gp && Math.abs(r - gp.r) <= 1 && Math.abs(c - gp.c) <= 1) continue;   // the Grave Gourd's protection (Release 4)
    if (__RELEASE__ >= 5 && isProtected(r, c)) continue;   // a Protector Gourd's square
    out.push(cell);
  }
  return out.length ? out[Math.floor(Math.random() * out.length)] : null;
}
/** A crow that has reached the fence flies over it and dives onto a pumpkin anywhere on the patch (not only its own column). True when it did:
 *  the crow is gone (no reward: it was not killed), and the pumpkin breaks when the dive lands, diveT seconds later (updateCrowDives). */
export function crowStrike(m){
  const cell = crowTarget(); if (!cell) return false;
  const pos = findCell(cell); if (!pos) return false;
  m.dead = true; m.eating = false; if (!m.minion) G.resolved++;   // it counts as dealt with: it is off the field
  const T = TYPES.crow, x1 = LANE(pos.c), y1 = GY + pos.r * CS + CS / 2;
  (G.crowDives || (G.crowDives = [])).push({ cell, t:T.diveT });
  if (G.vfx) G.vfx.push({ kind:'crowdive', x0:m.x, y0:Math.min(mY(m), FENCE_Y - 12), x1, y1, s:mS(m), t:0, dur:T.diveT });
  SFX.monsterAct('crow', 'dive');
  return true;
}
/** Per frame: crows' dives land. The pumpkin breaks if it is still on the patch and not now inside a gourd's protection (it may have slid). */
export function updateCrowDives(dt){
  for (const d of G.crowDives){
    d.t -= dt; if (d.t > 0) continue;
    d.done = true;
    const pos = findCell(d.cell), gp = gourdPos();
    if (!pos || (gp && Math.abs(pos.r - gp.r) <= 1 && Math.abs(pos.c - gp.c) <= 1) || (__RELEASE__ >= 5 && isProtected(pos.r, pos.c))) continue;
    grid[pos.r][pos.c] = null;
    const x = LANE(pos.c), y = GY + pos.r * CS + CS / 2, cell = d.cell;
    for (let i = 0; i < 12; i++) chunk(x, y, cell.c >= 0 && PTYPES[cell.c] ? PTYPES[cell.c].base : '#f0a020', 200);
    for (let i = 0; i < 6; i++) chunk(x, y - 6, '#2a2440', 160);   // black feathers
    ring(x, y, 34, 'rgba(120,90,160,.8)');
    SFX.smash();
    resolveMatches();
  }
  G.crowDives = G.crowDives.filter(d => !d.done);
}

/** The Fallen Casket opens: a mummy steps out and the casket is gone (no reward). */
function openCoffin(m){
  const mu = spawnMonster('mummy', m.lane, true, m.p + 0.01);
  mu.flash = 0.2;
  for (let i = 0; i < 12; i++) chunk(m.x, mY(m), i % 2 ? '#c9b08a' : '#7c3f1c', 160);
  m.dead = true;
  SFX.monsterAct('mummy', 'rise');
}
/** Where Casket Jack falls (combat.js kill): it becomes the Fallen Casket on the spot. */
export function dropCoffin(m){
  const c = spawnMonster('coffin', m.lane, true, Math.max(0, m.p));
  c.openT = TYPES.coffin.openIn;
  return c;
}

/** One frame of a nightmare monster's own behaviour. True when this type is one of them. */
export function updateNightmareMonster(m, dt){
  switch (m.type){
    case 'rooster': {
      if (m.crowT == null) m.crowT = TYPES.rooster.crowEvery;
      m.crowT -= dt;
      if (m.crowT <= 0){ m.crowT = TYPES.rooster.crowEvery; crow(m); }
      m.x = m.tx + Math.sin(m.ph * 1.6) * 2;
      return true;
    }
    case 'hayrick': case 'hayrickBurning': {   // a tank; throws once; the burning one also sets ordinary hayricks alight as it passes
      if (m.type === 'hayrickBurning') igniteNear(m);
      if (!m.thrown && m.p > 0.3) throwFork(m);
      m.x = m.tx + Math.sin(m.ph * 1.6) * 2;
      return true;
    }
    case 'graveriser': {   // its dig timer runs only while it is on the field (this switch already skips a frozen, chewing, knocked-back or fallen monster)
      if (m.p > 0){
        if (m.digT == null) m.digT = TYPES.graveriser.digEvery;
        m.digT -= dt;
        if (m.digT <= 0){ m.digT = TYPES.graveriser.digEvery; dig(m); }
      }
      m.x = m.tx + Math.sin(m.ph * 1.2) * 1.5;
      return true;
    }
    case 'casketjack':   // just walks; its mummy waits in the Fallen Casket it becomes (combat.js kill, dropCoffin)
      m.x = m.tx + Math.sin(m.ph * 1.4) * 1.5;
      return true;
    case 'coffin': {   // the Fallen Casket lies still; opens after openIn seconds (Ice holds it shut while frozen: this switch skips a frozen monster)
      m.openT -= dt;
      if (m.openT <= TYPES.coffin.openDur && !m.anim) m.anim = { clip:'open', t:0, dur:TYPES.coffin.openDur };
      if (m.openT <= 0) openCoffin(m);
      m.x = m.tx;
      return true;
    }
    case 'crow':   // flies like a bat down its lane; one fresh out of the Strawlord's coat glides over to its lane first
      m.x += (m.tx + Math.sin(m.ph * 3) * 6 - m.x) * Math.min(1, dt * 4);
      return true;
    case 'huskerBurning': case 'huskerCharred': {   // a burning husker lights ordinary huskers nearby, a charred cob lights bare ones; it keeps its normal walk
      igniteNear(m);
      m.x = m.tx + Math.sin(m.ph * 1.6) * 2;
      return true;
    }
  }
  return false;
}
