// Nightmare Crumbling Keep's monsters (Release 8; spec Part 3, docs/GAME_DESIGN.md §9 "Nightmare Crumbling Keep"). Their numbers are in data/monsters.js.
// Every caller gates on `__RELEASE__ >= 8`, so lower builds drop this module. One section per monster; each new monster adds a case to
// initKeepMonster / updateKeepMonster and, when it stops or acts outside the walk, a line in monsters.js beside the Release 7 ones.
//  - The Lobber Cart (`lobbercart`): rolls in to `park` of the field and stops there for good (keepStop, read where monsters.js moves a monster); it
//    never chews, so the generic chew-at-fence path never reaches it (it never gets to p = 1). Parked, a clock of `lobEvery` seconds (a fresh random
//    pick each time) runs; it plays `lob` half a second before zero and at zero throws a net onto a random pumpkin (engine/nets.js: throwNet, which fizzles
//    when the patch is full). The clock lives on the monster, so a cart that comes back in a continued night starts a fresh one. A dead cart leaves
//    its nets (spec: "Killing it does not free its nets").
//  - The Storm Lancer (`lancer`): charges at `charge` times its walk from the moment it spawns (keepSpeed, read where monsters.js reads `sp`, so Ice slow
//    and freeze still scale from the boosted speed). Reaching the fence it takes `fenceHit` of the fence's full health, never the last 1 (the Hayrick's
//    fork rule; a fence at 1 or less takes nothing) and is gone with no kill reward (lancerHit). A broken fence: it walks through like any monster.
//    It never queues: it rides through the monsters ahead in its lane (monsters.js aheadLimit), while others still queue behind it. A Lancer that is at a
//    fence which was down and is back up strikes at once (monsters.js, the eating branch). Castle walls never stop a monster, and it passes them. Gatehouses (Task 6) do not stop a walker either: keep it that way when they land.
//  - The Storm Marshal (`marshal`): a clock of `rallyEvery` s; at zero he raises his sword for `rallyLast` s. At the start of the rally every monster in
//    his square (his lane and one either side, 1.5 tiles up and down) that was never rallied gets `rallyHp` times its health, current and max, once ever
//    (`m.rallied`); while the sword is up (and he is walking) monsters in the square move `rallySp` times faster (keepSpeed). Bosses, mini bosses (also
//    type `boss`), other Marshals and the standing jukebox / sack are never rallied. The clock lives on the Marshal. A continued night respawns ordinary
//    monsters fresh, so a returning Marshal starts a new clock and nothing is carried over (`rallied` lives on the monster that came back).

import { TYPES } from '../data/monsters.js';
import { SFX } from './audio.js';
import { addFloat, ring, spark, chunk } from './combat.js';
import { mY } from './monsters.js';
import { throwNet } from './nets.js';
import { CS, G, FENCE_Y, walls } from './state.js';
import { rnd } from './util.js';
import { damageWall } from './walls.js';

const COMMAND_DUR = 8 / 9;     // the Marshal's `command` clip: 8 frames at 9 fps
const LOB_DUR = 10 / 12;      // the `lob` clip: 10 frames at 12 fps
const LOB_LEAD = LOB_DUR * 0.5;   // the net leaves the cup at half the clip (render/chars/keep.js lobArm): the swing starts this long before the throw

/** A new monster's Release 8 set-up (spawnMonster, before it joins the field). */
export function initKeepMonster(m){
  if (m.type === 'lobbercart'){ const T = TYPES.lobbercart; m.lobT = rnd(T.lobEvery[0], T.lobEvery[1]); m.lobbing = false; m.parked = false; }
  if (m.type === 'marshal'){ m.rallyT = TYPES.marshal.rallyEvery; m.rallying = false; m.rallyLeft = 0; }
}

/** Can the Marshal's rally reach this monster at all (speed and health)? */
const rallyable = o => !o.dead && o.type !== 'boss' && o.type !== 'marshal' && o.type !== 'jukebox' && o.type !== 'sack';
/** Is o inside Marshal q's square: his lane or one either side, within 1.5 tiles up or down? */
const inSquare = (q, o) => Math.abs(o.lane - q.lane) <= 1 && Math.abs(mY(o) - mY(q)) <= CS * 1.5;

/** The factor on a walking monster's speed (monsters.js, after Ice): a Lancer's charge, and a rally from any Marshal whose sword is up. */
export function keepSpeed(m){
  let f = m.type === 'lancer' ? TYPES.lancer.charge : 1;
  if (anyRally() && m.p > -0.05 && rallyable(m)) for (const q of G.monsters){
    if (q.type === 'marshal' && q.rallying && !q.dead && !q.eating && q.frozenT <= 0 && inSquare(q, m)){ f *= TYPES.marshal.rallySp; break; }
  }
  return f;
}
let rallyG = null, rallyT = -1, rallyAny = false;
/** Is any Marshal's sword up? Looked at once per frame (G.t), so the per-monster scan is skipped on every night without one. */
function anyRally(){
  if (rallyG !== G || rallyT !== G.t){
    rallyG = G; rallyT = G.t; rallyAny = false;
    for (let i = 0; i < G.monsters.length; i++){ const q = G.monsters[i]; if (q.type === 'marshal' && q.rallying && !q.dead){ rallyAny = true; break; } }
  }
  return rallyAny;
}

/** A Lancer that has reached the fence (monsters.js): true when it struck and is gone. A fallen fence: false, and it walks through like any monster. */
export function lancerHit(m){
  const w = walls[m.lane]; if (!w || w.hp <= 0) return false;
  const amt = Math.min(w.max * TYPES.lancer.fenceHit, w.hp - 1);   // never the last 1; a fence at 1 or less takes nothing
  if (amt > 0) damageWall(m.lane, amt);
  G.shake = Math.max(G.shake || 0, 0.6);
  for (let i = 0; i < 12; i++){ chunk(m.x + rnd(-14, 14), FENCE_Y - 14, '#8a6440', 220); spark(m.x, FENCE_Y - 12, i % 2 ? '#cfe0ff' : '#ffffff', 140); }
  ring(m.x, FENCE_Y - 10, 56, 'rgba(180,200,255,.9)');
  m.dead = true; m.eating = false; if (!m.minion) G.resolved++;   // off the field without a kill: it counts as dealt with, like a diving crow
  if (G.q) G.q.touched.lancer = true;
  return true;
}

/** The sword goes up: everyone in the square who was never rallied doubles. */
function rally(m){
  const T = TYPES.marshal;
  m.rallying = true; m.rallyLeft = T.rallyLast;
  m.anim = { clip:'command', t:0, dur:COMMAND_DUR };
  ring(m.x, mY(m), CS * 1.5, 'rgba(255,90,100,.8)');
  SFX.monsterAct('marshal', 'rally');
  for (const o of G.monsters){
    if (o === m || !rallyable(o) || o.rallied || !inSquare(m, o)) continue;
    o.rallied = true; o.hp *= T.rallyHp; o.maxHp *= T.rallyHp; o.flash = 0.2;
    addFloat('Rallied!', o.x, mY(o) - o.r - 22, '#ff7a86', 15, 0.8);
  }
}

/** How far down its lane a monster that parks may walk (monsters.js caps its step there), or 1 for any other. */
export function keepStop(m){
  return m.type === 'lobbercart' ? TYPES.lobbercart.park : 1;
}
/** Is a parked monster standing at its spot for good (so the column behind it walks past instead of queueing)? */
export function keepParked(m){
  return m.type === 'lobbercart' && m.p >= TYPES.lobbercart.park - 0.001;
}

/** The type switch of updateMonster's default branch (a monster that is walking: not frozen, chewing, knocked back or down). True when handled. */
export function updateKeepMonster(m, dt){
  switch (m.type){
    case 'lancer': m.x = m.tx; return true;
    case 'marshal': {
      const T = TYPES.marshal;
      m.x = m.tx;
      if (m.rallying){ m.rallyLeft -= dt; if (m.rallyLeft <= 0){ m.rallying = false; m.rallyT = T.rallyEvery; } }
      else if ((m.rallyT -= dt) <= 0) rally(m);
      return true;
    }
    case 'lobbercart': {
      const T = TYPES.lobbercart;
      m.x = m.tx;
      m.parked = m.p >= T.park - 0.001;
      if (!m.parked) return true;
      m.lobT -= dt;
      if (m.lobT <= LOB_LEAD && !m.lobbing){ m.lobbing = true; m.anim = { clip:'lob', t:0, dur:LOB_DUR }; SFX.monsterAct('lobbercart', 'lob'); }   // the swing starts a moment before the net leaves
      if (m.lobT <= 0){ m.lobbing = false; m.lobT = rnd(T.lobEvery[0], T.lobEvery[1]); throwNet(m.x, mY(m), 'net', m.id); }
      return true;
    }
  }
  return false;
}
