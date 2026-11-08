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
//    fence which was down and is back up strikes at once (monsters.js, the eating branch). Castle walls never stop a monster, and it passes them. A Gatehouse does not stop a walker either (check_lancer_edges).
//  - The Storm Marshal (`marshal`): a clock of `rallyEvery` s; at zero he raises his sword for `rallyLast` s. At the start of the rally every monster in
//    his square (his lane and one either side, 1.5 tiles up and down) that was never rallied gets `rallyHp` times its health, current and max, once ever
//    (`m.rallied`); while the sword is up (and he is walking) monsters in the square move `rallySp` times faster (keepSpeed). Bosses, mini bosses (also
//    type `boss`), other Marshals and the standing jukebox / sack are never rallied. The clock lives on the Marshal. A continued night respawns ordinary
//    monsters fresh, so a returning Marshal starts a new clock and nothing is carried over (`rallied` lives on the monster that came back).
//  - The Blood Glutton (`glutton`): at spawn it throws `netsAtSpawn` red nets (`throwNet(…, 'red', m.id)`); a clock of `netEvery` s runs all the time
//    (glutTick, not while frozen) and at each zero it throws one more if it has fewer than `netMax` of its own on the patch or in flight. While any of
//    its red nets lies on the patch or is still in flight it is shielded (shieldedNow), so from the moment it spawns. When it dies (keepFalls) its red nets on the patch and in flight become ordinary
//    nets with no thrower, so they no longer shield anything.
//  - The Bat Bride (`bride`): while she has no veil a clock of `veilAgain` s (0 at spawn) runs down; at zero she veils the nearest living other monster
//    whose lane is within `veilReach` of hers (`o.veilBy = bride.id`, `bride.veil = o`): never herself, never another Bride (two could shield each other
//    for ever), never one already veiled, the jukebox or the sack; a boss may be veiled. One veil at a time: it stays until the veiled monster or
//    she is gone, wherever it walks. When the veiled one is gone her clock restarts at `veilAgain`; when she dies every `veilBy` pointing at her clears.
//  - The Siege Tower (`boss` kind `siegetower`, the N4-4 and N4-13 mini boss): rolls very slowly down one lane and holds at `hold` (monsters.js stops it
//    exactly there; a boss never chews, freezes or is knocked back). It carries `archers` Skeleton Archers. ARCHERS FIRST (our call: a pumpkin's direct hit
//    only): combat.js hitMonsterNow asks knockArcher(m) before dealing damage, and a pumpkin hit while `m.archers > 0` takes one archer off (the `knock` clip)
//    and costs it no health; splash, chain lightning, burn ticks, tools, rot and every other damage source are refused while archers stand
//    (archersGuard, in damage() right after the shield door), so nothing but a pumpkin's own hit gets past them. Three clocks (`volleyT`, `netT`, `rampT`,
//    running once it is on the field, p > 0.05): every `volleyEvery` s one arrow per archer left goes down its lane (G.arrows, `volleyDmg` wall damage;
//    held while its fence is down, as the Skeleton Archer's); every `netEvery` s it throws a net (`throwNet(…, 'net', m.id)`; a fizzle when the patch is
//    full); every `rampEvery` s the ramp drops and a Storm Lancer or a Storm Marshal (50/50; a Marshal only if none of its own lives) walks out of it at
//    p + 0.04 as a minion (so an extra, not part of the night). A Lancer charges at once as it always does. On death the tower breaks and its own nets, on the
//    patch and in flight, are cleared (siegeFalls); other nets stay. A continued night keeps its archers, health and clocks (siegeSnapshot / restoreSiege, through
//    game.js continueState → spawner.js); the Marshal tracking restarts (ordinary monsters come back fresh).
//  - The shield door: combat.js damage() asks shieldedNow(m) before anything else, so every damage source (pumpkin hits, burn ticks, glue, Black
//    splash, Deep Blue lightning, mines, fireworks, the bomb) is refused alike, with the Hollow King's "No damage" float and dull clink (shieldPuff).
//    A Corn Husker's husk-strip (a hit that strips instead of hurting) asks the door too. Ice, knockback and glue's slow still work: only damage is refused.
//    shieldedNow = red nets of its own on the patch or in flight, or a veil from a living Bride (veiledNow, also what the renderer draws by), or the Fallen Count's clamp (countClamped, Task 9).
//  - A continued night (game.js continueState / continueNight) respawns ordinary monsters fresh, with new ids. shieldSnapshot keeps, in field order,
//    the type of every living monster that owns red nets and the type each living Bride's veil is on; restoreShields (after restoreNets) re-tags each
//    owner's red nets with a placeholder id (-1, -2, …: no monster has one) and orphan red nets (no living owner at the loss) become ordinary. As
//    monsters come back (spawnMonster → initKeepMonster → adopt), the first one of an owner's type takes that owner's red nets (a Glutton then throws
//    only what it lacks of `netsAtSpawn`); the first Bride back takes the first carried veil and puts it at once on the nearest monster of that type on
//    the field that is not veiled (a boss is 'boss:kind'), in reach or not; if none stands there she veils by her own rule. Once every unbeaten
//    monster is back (G.spawned >= G.def.total, carryCheck each frame) the red nets nobody came back for become ordinary.

import { TYPES, PIECES } from '../data/monsters.js';
import { SFX } from './audio.js';
import { addFloat, ring, spark, chunk, castleY } from './combat.js';
import { mS, mY, spawnMonster } from './monsters.js';
import { throwNet, redNetsOf, clearNets, netCount } from './nets.js';
import { resolveMatches } from './board.js';
import { CS, COLS, G, FENCE_Y, GY, ROWS, grid, walls, LANE } from './state.js';
import { rnd } from './util.js';
import { damageWall } from './walls.js';

const COMMAND_DUR = 8 / 9;     // the Marshal's `command` clip: 8 frames at 9 fps
const LOB_DUR = 10 / 12;      // the `lob` clip: 10 frames at 12 fps
const LOB_LEAD = LOB_DUR * 0.5;   // the net leaves the cup at half the clip (render/chars/keep.js lobArm): the swing starts this long before the throw

/** A new monster's Release 8 set-up (spawnMonster, before it joins the field). */
export function initKeepMonster(m){
  if (m.type === 'lobbercart'){ const T = TYPES.lobbercart; m.lobT = rnd(T.lobEvery[0], T.lobEvery[1]); m.lobbing = false; m.parked = false; }
  if (m.type === 'marshal'){ m.rallyT = TYPES.marshal.rallyEvery; m.rallying = false; m.rallyLeft = 0; }
  if (m.type === 'boss' && m.kind === 'siegetower') initSiege(m);
  if (isCount(m)) initFallenCount(m);
  if (G.shieldCarry) adopt(m);   // a continued night: the first of a carried owner's type takes its red nets, the first Bride its veil
  if (m.type === 'glutton'){ const T = TYPES.glutton; m.netT = T.netEvery; for (let i = ownNets(m); i < T.netsAtSpawn; i++) throwNet(m.x, mY(m), 'red', m.id); }
  if (m.type === 'bride'){ m.veilT = m.veilT || 0; m.veil = m.veil || null; }
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

// ---------- castle pieces: the Gatehouse and the Archer Tower ----------
// A piece is a castle wall (G.castles entry) with a `kind` ('wall' by default) and a clock `t`; `castlesLayout` entries are [lane, p, kind?].
// Monsters walk through every piece as through a wall; pumpkins stop at all of them (game.js: only a tower also stops Grey).
//  - 'gate': hp 2.5x the level's castle hp. Its clock `t` counts down GATE_EVERY s; GATE_OPEN s before zero the `open` clip plays, at zero one monster
//    from `def.gatePool` (a random entry) walks out in front of it (spawnMonster, a minion: an extra that does not count toward the night) and `shut`
//    plays. One at a time: a new clock starts at once, nothing queues. Broken: no more. A level with no pool summons nothing.
//  - 'tower': hp 1.5x. Every TOWER_SHOT s an arrow goes down its lane (G.arrows, the Skeleton Archer's, 3 wall damage; held while the fence is down, as
//    the archer does); `shoot` plays TOWER_LEAD s before it leaves. Dead: the `crumble` sprite plays (G.crumbles) and a real Skeleton Archer stands on
//    the rubble at its p, holding and shooting at once on the tower's own clock, not stunned.
//  - A continued night rebuilds castles from the level as it does walls: pieces come back with their kind, full health and a fresh clock.
const GATE_OPEN = 1, TOWER_LEAD = 0.25, GATE_SHUT = 9 / 16, TOWER_DRAW = 6 / 14;
export const CRUMBLE_DUR = { gate:14 / 12, tower:16 / 12 }, CRUMBLE_LINGER = 1.5;

/** A castle entry (game.js, monsters.js): kind 'wall' | 'gate' | 'tower'; `hp` is the level's castle wall health. */
export function newCastle(lane, p, kind, hp){
  const mul = kind === 'gate' ? PIECES.gateHp : kind === 'tower' ? PIECES.towerHp : 1, h = hp * mul;
  return { lane, p, hp:h, maxHp:h, flash:0, dead:false, kind:kind || 'wall', t:kind === 'gate' ? PIECES.gateEvery : kind === 'tower' ? PIECES.towerShot : 0, anim:null };
}

/** Every frame of a night (game.js update): each piece's clock and clips, and the crumbling heaps. */
export function updateCastlePieces(dt){
  for (const w of G.castles){
    if (w.dead || w.kind === 'wall' || !w.kind) continue;
    if (w.anim){ w.anim.t += dt; if (w.anim.t >= w.anim.dur) w.anim = null; }
    if (G.over) continue;
    w.t -= dt;
    if (w.kind === 'gate'){
      const pool = w.pool || (G.def && G.def.gatePool);   // the Fallen Count's own Gatehouse carries his pool
      if (w.t <= GATE_OPEN && !w.opening && pool && pool.length){ w.opening = true; w.anim = { clip:'open', t:0, dur:GATE_OPEN }; SFX.monsterAct('gate', 'open'); }
      if (w.t <= 0){
        w.t = PIECES.gateEvery; w.opening = false;
        if (pool && pool.length){
          const m = spawnMonster(pool[Math.floor(Math.random() * pool.length)], w.lane, true, Math.min(0.97, w.p + 0.03));
          m.fromGate = true; w.anim = { clip:'shut', t:0, dur:GATE_SHUT }; SFX.monsterAct('gate', 'shut');
          ring(LANE(w.lane), castleY(w), 40, 'rgba(255,170,90,.8)'); for (let i = 0; i < 6; i++) spark(LANE(w.lane), castleY(w) + 6, '#d8c8b0', 80);
        }
      }
    } else if (w.kind === 'tower'){
      if (w.t <= TOWER_LEAD && !w.drawing && walls[w.lane].hp > 0){ w.drawing = true; w.anim = { clip:'shoot', t:0, dur:TOWER_DRAW }; }
      if (w.t <= 0){
        w.t = PIECES.towerShot; w.drawing = false;
        if (walls[w.lane].hp > 0){ G.arrows.push({ lane:w.lane, p:w.p + 0.03, sp:0.4, dmg:TYPES.archer.arrow, dead:false }); SFX.monsterAct('archer', 'shoot'); }
      }
    }
  }
  const cr = G.crumbles; if (cr){ for (const c of cr) c.t += dt; for (let i = cr.length - 1; i >= 0; i--) if (cr[i].t > CRUMBLE_DUR[cr[i].kind] + CRUMBLE_LINGER) cr.splice(i, 1); }
}

/** damageCastle (combat.js), once a gate or a tower is broken: its crumble plays, and a tower's archer fights on from the rubble at once. */
export function pieceFalls(w){
  if (G.crumbles) G.crumbles.push({ kind:w.kind, lane:w.lane, p:w.p, t:0 });
  if (w.kind !== 'tower') return;
  const a = spawnMonster('archer', w.lane, true, w.p);
  a.shootT = Math.max(0.5, w.t);   // the tower's own reload carries on; stunT stays 0
  a.fromTower = true;
}

// ---------- the Siege Tower (mini boss) ----------
const VOLLEY_DUR = 8 / 12, VOLLEY_LEAD = VOLLEY_DUR * 0.45, RAMP_DUR = 10 / 10, RAMP_LEAD = 0.6, RAISE_DUR = 6 / 8, KNOCK_DUR = 6 / 12, HIT_DUR = 4 / 14;
export const isSiege = m => m.type === 'boss' && m.kind === 'siegetower';

/** A freshly spawned Siege Tower: both archers up, every clock full (a continued night restores them after this, restoreSiege). */
export function initSiege(m){
  const T = TYPES.siegetower;
  m.archers = T.archers; m.volleyT = T.volleyEvery; m.netT = T.netEvery; m.rampT = T.rampEvery; m.volleying = false; m.ramping = false; m.raiseT = 0; m.seenHp = m.hp; m.marshals = [];
}
/** What a continued night keeps of it: the archers left and the time on each clock. */
export const siegeSnapshot = m => isSiege(m) ? { archers:m.archers, volleyT:m.volleyT, netT:m.netT, rampT:m.rampT } : null;
export function restoreSiege(m, s){
  if (!s || !isSiege(m)) return;
  m.archers = Math.max(0, Math.min(TYPES.siegetower.archers, s.archers | 0)); m.volleyT = s.volleyT; m.netT = s.netT; m.rampT = s.rampT; m.seenHp = m.hp;   // seenHp: its restored health is no hit
}

/** combat.js hitMonsterNow: a pumpkin's direct hit on a tower with archers up takes one off instead of hurting it. True when it did. */
export function knockArcher(m){
  if (!isSiege(m) || !(m.archers > 0)) return false;
  m.archers--; m.flash = 0.1; if (!m.archers) m.volleying = false; m.anim = { clip:'knock', t:0, dur:KNOCK_DUR };
  addFloat(m.archers ? 'Archer down!' : 'Both archers down!', m.x, mY(m) - m.r * mS(m) - 22, '#ffe8b0', 17, 0.9);
  const y = mY(m) - 70; for (let i = 0; i < 8; i++){ chunk(m.x + (m.archers ? 10 : -10), y, i % 2 ? '#8a5f38' : '#d8d0c0', 200); }
  ring(m.x, mY(m) - 60, 34, 'rgba(255,230,170,.85)'); SFX.bossSfx('siegetower', 'knock');
  return true;
}
/** damage() (combat.js), after the shield door: any damage that is not a pumpkin's direct hit is refused while archers stand. True when refused. */
export function archersGuard(m){
  if (!isSiege(m) || !(m.archers > 0)) return false;
  m.flash = 0.06;
  if (G.t - (m.immuneT == null ? -9 : m.immuneT) >= 0.35){ m.immuneT = G.t; addFloat('Archers first', m.x, mY(m) - m.r * mS(m) - 24, '#c8c2b8', 15, 0.7); SFX.extra('blocked'); }
  return true;
}

/** One frame of the Siege Tower (monsters.js, the walking branch). Its clocks run once it is on the field (p > 0.05). */
export function updateSiege(m, dt){
  const T = TYPES.siegetower;
  m.x = m.tx + Math.sin(m.ph * 0.9) * 1.5;
  if (m.hp < m.seenHp && !m.anim) m.anim = { clip:'hit', t:0, dur:HIT_DUR };
  m.seenHp = m.hp;
  if (m.raiseT > 0 && (m.raiseT -= dt) <= 0) m.anim = { clip:'raise', t:0, dur:RAISE_DUR };   // the ramp has dropped and the walker is out: it swings back up
  if (m.p <= 0.05) return;
  // the volley: one arrow per archer left, down the tower's lane (held while its fence is down, as the Skeleton Archer's)
  if (m.archers > 0){
    m.volleyT -= dt;
    if (m.volleyT <= VOLLEY_LEAD && !m.volleying && walls[m.lane] && walls[m.lane].hp > 0){ m.volleying = true; m.anim = { clip:'volley', t:0, dur:VOLLEY_DUR }; }
    if (m.volleyT <= 0){
      if (walls[m.lane] && walls[m.lane].hp > 0){
        for (let i = 0; i < m.archers; i++) G.arrows.push({ lane:m.lane, p:m.p + 0.03 + i * 0.02, sp:T.arrowSp, dmg:T.volleyDmg, dead:false });
        SFX.monsterAct('archer', 'shoot'); m.volleyT = T.volleyEvery; m.volleying = false;
      } else m.volleyT = 0;
    }
  } else m.volleyT = T.volleyEvery;
  if ((m.netT -= dt) <= 0){ m.netT = T.netEvery; throwNet(m.x, mY(m) - 40, 'net', m.id); SFX.bossSfx('siegetower', 'net'); }
  if (m.rampT <= RAMP_LEAD && !m.ramping){ m.ramping = true; m.anim = { clip:'ramp', t:0, dur:RAMP_DUR }; SFX.bossSfx('siegetower', 'ramp'); }
  if ((m.rampT -= dt) <= 0){
    m.rampT = T.rampEvery; m.ramping = false;
    const live = (m.marshals || []).filter(o => !o.dead && G.monsters.includes(o)); m.marshals = live;
    const kind = live.length || Math.random() < 0.5 ? 'lancer' : 'marshal';
    const o = spawnMonster(kind, m.lane, true, Math.min(0.97, m.p + 0.04)); o.fromSiege = true; if (kind === 'marshal') m.marshals.push(o);
    ring(m.x, mY(m) + 4, 44, 'rgba(255,170,90,.8)'); for (let i = 0; i < 6; i++) spark(m.x, mY(m) + 18, '#d8c8b0', 90);
    m.raiseT = RAMP_DUR - RAMP_LEAD;   // the ramp has been down for RAMP_LEAD s of its clip
  }
}
/** kill() (combat.js): the tower is down, so the nets it threw (on the patch and in flight) are gone. */
export function siegeFalls(m){
  if (!isSiege(m)) return;
  const n = clearNets(cell => cell.netBy === m.id);
  if (G.netsFlying) G.netsFlying = G.netsFlying.filter(f => f.by !== m.id);
  if (n) addFloat('Nets fall away!', m.x, mY(m) - m.r - 60, '#e8d8b0', 17, 1.3);
}

// ---------- the Fallen Count (N4-16's boss) ----------
// Numbers in data/monsters.js (`fallencount`). He walks like the Vampire Count to `hold` (monsters.js stops him exactly there) and never changes lane.
//  - Blood nets: at each `netAt` mark of his health (1 = the start) he throws `netN` red nets of his own (`throwNet(…, 'red', m.id)`; over the cap or with
//    nowhere to land they fizzle). While any lies on the patch or is in flight the shield door holds him (countClamped). A hit never carries him past the next
//    mark: countGate (damage(), combat.js) caps it there, and the hit that reaches it throws the nets at once (fcCross), so the next hit is refused. `fcDone`
//    is the marks passed; lazily on his first frame (or first hit) it is the marks strictly above his health, so a fresh Count throws his start nets then.
//    A continued night carries `fcDone` (countSnapshot), so passed marks never replay; his red nets come back as his through the shield carry.
//  - Blood trance (`tranceT`): he stands still in `m.healing` (the story Count's flag: damage() counts the hits, render picks the clip) and every
//    `tranceTick` s heals `tranceHeal` per netted pumpkin on the patch (either kind), up to his full health. `tranceHits` hits break it and stun him `tranceStun` s.
//    A hit the shield door refuses does not count (the door's rule). While he is stunned or in a trance his other clocks stand still.
//  - Blood spear (`spearT`): flies down his lane (G.fcSpears, SPEAR_FLY s) and his fence loses `spearHit` of its full health, never its last 1.
//  - Lightning (`boltT`): a random patch column is warned `boltWarn` s (G.fcBolt), then every pumpkin in it goes except netted ones and gourds; matches re-resolve.
//  - Summons (`summonT`): one Storm Lancer in his lane (it charges at once) and one Bat Bride a lane beside, both just ahead of him, as extras (minions).
//  - Castle pieces (`raiseT`, 0 at the start, so he raises them as he arrives): one Archer Tower and one Gatehouse (newCastle, the level's castle wall health
//    or the story Count's `wallHp`), each only if none of his stands, in a lane that is not his and holds no other castle, at 0.45-0.7 of the field (the story
//    Count's walls). His Gatehouse sends out `gatePool` (w.pool). When he falls his pieces crumble, his nets and bolt go (countFalls).
export const SPEAR_FLY = 0.45, BOLT_FLASH = 0.35; const WALL_DUR = 6 / 8, BATS_DUR = 6 / 9;
export const isCount = m => m.type === 'boss' && m.kind === 'fallencount';

/** A freshly spawned Fallen Count: every clock full but the raise, marks not yet known (a continued night restores them after this, restoreCount). */
export function initFallenCount(m){
  const T = TYPES.fallencount;
  m.fcDone = null; m.tranceT = T.tranceEvery; m.spearT = T.spearEvery; m.boltT = T.boltEvery; m.summonT = T.summonEvery; m.raiseT = 0; m.healTickT = 0;
}
/** What a continued night keeps of him: the marks passed and every clock. */
export const countSnapshot = m => isCount(m) ? { fcDone:fcMarks(m), tranceT:m.tranceT, spearT:m.spearT, boltT:m.boltT, summonT:m.summonT, raiseT:m.raiseT } : null;
export function restoreCount(m, s){
  if (!s || !isCount(m) || s.fcDone == null) return;
  m.fcDone = s.fcDone; m.tranceT = s.tranceT; m.spearT = s.spearT; m.boltT = s.boltT; m.summonT = s.summonT; m.raiseT = s.raiseT;
}

function fcMarks(m){
  if (m.fcDone == null) m.fcDone = TYPES.fallencount.netAt.filter(a => m.hp < m.maxHp * a - 1e-6).length;
  return m.fcDone;
}
/** The health a hit may not take him below: the next mark, or 0 past the last. */
const fcFloor = m => { const A = TYPES.fallencount.netAt, d = fcMarks(m); return d < A.length ? A[d] * m.maxHp : 0; };
/** A mark reached: pass it and throw that mark's blood nets. */
export function fcCross(m){
  if (!isCount(m)) return;
  const T = TYPES.fallencount;
  while (fcMarks(m) < T.netAt.length && m.hp <= fcFloor(m) + 1e-6){
    m.hp = Math.min(m.hp, fcFloor(m)); m.fcDone++;
    for (let i = 0; i < T.netN; i++) throwNet(m.x, mY(m) - 40, 'red', m.id);
    m.anim = { clip:'wall', t:0, dur:WALL_DUR };
    addFloat('Blood nets!', m.x, mY(m) - m.r * mS(m) - 40, '#ff4a5a', 18, 1.1); ring(m.x, mY(m) - 30, 54, 'rgba(220,20,50,.85)');
    SFX.bossSfx('fallencount', 'nets');
  }
}
/** damage() (combat.js), after the shield door: the most of `amt` that leaves him at his next mark or above. */
export function countGate(m, amt){
  if (!isCount(m)) return amt;
  fcCross(m);   // a mark already reached (a hit before his first frame): its nets go now
  if (countClamped(m)){ shieldPuff(m); return 0; }
  return Math.min(amt, Math.max(0, m.hp - fcFloor(m)));
}

/** One frame of the Fallen Count (monsters.js, the walking branch). True while he stands still (stunned or in a trance). */
export function updateFallenCount(m, dt){
  const T = TYPES.fallencount;
  m.x = m.tx;
  fcCross(m);   // his first frame: the start nets
  countFx(m, dt);
  if (m.stunT > 0){ m.stunT -= dt; return true; }
  if (m.healing){
    if ((m.healTickT -= dt) <= 0){
      m.healTickT += T.tranceTick;
      const h = Math.min(T.tranceHeal * netCount(), m.maxHp - m.hp);
      if (h > 0){ m.hp += h; addFloat('+' + Math.round(h), m.x, mY(m) - m.r * mS(m) - 30, '#ff6a6a', 15, 0.8); }
      SFX.bossSfx('fallencount', 'pulse');
    }
    return true;
  }
  if (m.p < 0.05) return false;
  if ((m.spearT -= dt) <= 0){
    m.spearT = T.spearEvery;
    (G.fcSpears || (G.fcSpears = [])).push({ lane:m.lane, p0:m.p, t:0 });
    m.anim = { clip:'bats', t:0, dur:BATS_DUR }; SFX.bossSfx('fallencount', 'spear');
  }
  if ((m.boltT -= dt) <= 0){
    m.boltT = T.boltEvery;
    if (!G.fcBolt){ G.fcBolt = { c:Math.floor(Math.random() * COLS), warn:T.boltWarn, strike:0 }; m.anim = { clip:'wall', t:0, dur:WALL_DUR }; SFX.bossSfx('fallencount', 'warn'); }
  }
  if ((m.summonT -= dt) <= 0){
    m.summonT = T.summonEvery;
    const p = Math.min(0.97, m.p + 0.04), side = m.lane === 0 ? 1 : m.lane === COLS - 1 ? -1 : Math.random() < 0.5 ? -1 : 1;
    const a = spawnMonster('lancer', m.lane, true, p), b = spawnMonster('bride', m.lane + side, true, p); a.fromCount = b.fromCount = true;
    ring(m.x, mY(m), 50, 'rgba(200,30,60,.8)'); for (let i = 0; i < 10; i++) spark(m.x, mY(m) - 10, i % 2 ? '#c8d4ff' : '#b8202e', 120);
    m.anim = { clip:'bats', t:0, dur:BATS_DUR }; SFX.bossSfx('fallencount', 'summon');
  }
  if ((m.raiseT -= dt) <= 0){ m.raiseT = T.raiseEvery; raisePieces(m); }
  if ((m.tranceT -= dt) <= 0){   // the blood trance: he stands and heals until the player lands the hits
    m.tranceT = T.tranceEvery; m.healing = true; m.healHits = T.tranceHits; m.healTickT = T.tranceTick;
    addFloat(`Blood trance: hit it ×${m.healHits}`, m.x, mY(m) - m.r * mS(m) - 34, '#ff6a6a', 18, 1.4); SFX.bossSfx('fallencount', 'trance');
    return true;
  }
  return false;
}

/** Raise an Archer Tower and a Gatehouse of his, each only if none of his stands. */
function raisePieces(m){
  const hp = G.def && G.def.castles ? G.def.castles.hp : TYPES.vampirecount.wallHp;
  let raised = false;
  for (const kind of ['tower', 'gate']){
    if (G.castles.some(w => !w.dead && w.by === m.id && w.kind === kind)) continue;
    const used = new Set(G.castles.filter(w => !w.dead).map(w => w.lane)), free = [...Array(COLS).keys()].filter(l => l !== m.lane && !used.has(l));
    if (!free.length) continue;
    const w = newCastle(free[Math.floor(Math.random() * free.length)], rnd(0.45, 0.7), kind, hp); w.by = m.id;
    if (kind === 'gate') w.pool = TYPES.fallencount.gatePool;
    G.castles.push(w); raised = true;
    ring(LANE(w.lane), castleY(w), 44, 'rgba(200,180,220,.9)'); for (let i = 0; i < 8; i++) chunk(LANE(w.lane), castleY(w) + 10, '#8a8d96', 140);
  }
  if (raised){ m.anim = { clip:'wall', t:0, dur:WALL_DUR }; addFloat('The keep rises', m.x, mY(m) - m.r * mS(m) - 30, '#d8cfe0', 16, 1); SFX.bossSfx('fallencount', 'raise'); }
}

/** His spears in flight and the lightning on the patch (one frame; run from his update, so they freeze with the night). */
function countFx(m, dt){
  const sp = G.fcSpears;
  if (sp && sp.length){
    for (const s of sp){
      s.t += dt; if (s.t < SPEAR_FLY) continue;
      s.done = true;
      const w = walls[s.lane]; if (!w || w.hp <= 0) continue;
      const amt = Math.min(w.max * TYPES.fallencount.spearHit, w.hp - 1);   // never the last 1; a fence at 1 or less takes nothing
      if (amt > 0) damageWall(s.lane, amt);
      for (let i = 0; i < 10; i++){ chunk(LANE(s.lane) + rnd(-12, 12), FENCE_Y - 14, '#8a6440', 200); spark(LANE(s.lane), FENCE_Y - 12, i % 2 ? '#ff3040' : '#ffd0d0', 130); }
      G.shake = Math.max(G.shake || 0, 0.4);
    }
    G.fcSpears = sp.filter(s => !s.done);
  }
  const b = G.fcBolt; if (!b) return;
  if (b.warn > 0){
    if ((b.warn -= dt) > 0) return;
    b.warn = 0; b.strike = BOLT_FLASH; boltColumn(b.c);
  } else if ((b.strike -= dt) <= 0) G.fcBolt = null;
}
/** The bolt lands on column c: every pumpkin in it goes but netted ones (either kind) and gourds; the board re-resolves its bunches. */
function boltColumn(c){
  const x = LANE(c);
  for (let r = 0; r < ROWS; r++){
    const cell = grid[r][c]; if (!cell || cell.gourd || cell.net) continue;
    grid[r][c] = null;
    const y = GY + r * CS + CS / 2;
    for (let i = 0; i < 8; i++) chunk(x, y, '#f0a020', 200);
    spark(x, y, '#e8f0ff', 140);
  }
  resolveMatches();
  G.shake = Math.max(G.shake || 0, 0.7); SFX.bossSfx('fallencount', 'bolt');
}

/** kill() (combat.js): the Count is down, so his red nets, his bolt and spears, and his castle pieces go with him (our call, as the Siege Tower's nets). */
export function countFalls(m){
  if (!isCount(m)) return;
  clearNets(cell => cell.netBy === m.id);
  if (G.netsFlying) G.netsFlying = G.netsFlying.filter(f => f.by !== m.id);
  G.fcBolt = null; G.fcSpears = [];
  for (const w of G.castles) if (!w.dead && w.by === m.id){ w.dead = true; if (G.crumbles) G.crumbles.push({ kind:w.kind, lane:w.lane, p:w.p, t:0 }); }
}

// ---------- the Blood Glutton, the Bat Bride and the shield door ----------

/** The Fallen Count's clamp: true while any red net of his own lies on the patch or is in flight (his blood nets; the hit that reached a mark stopped there). */
export const countClamped = m => isCount(m) && ownNets(m) > 0;

/** The living Bride (on the field, not dead) whose veil is on m, or null. A `veilBy` whose Bride is gone, however she went, is cleared here. */
function brideOf(m){
  if (m.veilBy == null) return null;
  for (const o of G.monsters) if (o.id === m.veilBy && !o.dead && o.type === 'bride') return o;
  m.veilBy = null; return null;
}
/** Does a Bride's veil hold on m right now? The shield door and the renderer (render/monsters.js) both ask this, so the veil is drawn exactly when it shields. */
export const veiledNow = m => brideOf(m) != null;

/** Is m shielded from every damage right now? Red nets of its own on the patch or still in flight, a veil from a living Bride, or the Fallen Count's clamp. */
export function shieldedNow(m){
  return (m.id != null && ownNets(m) > 0) || brideOf(m) != null || countClamped(m);
}

/** A refused hit: a quick flash, and at most every 0.35 s the "No damage" float and the dull clink (the Hollow King's pattern). */
export function shieldPuff(m){
  m.flash = 0.06;
  if (G.t - (m.immuneT == null ? -9 : m.immuneT) < 0.35) return;
  m.immuneT = G.t;
  addFloat('No damage', m.x, mY(m) - m.r * mS(m) - 24, '#c8c2b8', 16, 0.7); SFX.monsterAct('shield', 'immune');
}

/** Red nets of m's on the patch and in flight. */
function ownNets(m){
  let n = redNetsOf(m);
  for (const f of G.netsFlying || []) if (f.kind === 'red' && f.by === m.id) n++;
  return n;
}

const CAST_DUR = 6 / 8;   // the `cast` clip (render/chars/keep.js): 6 frames at 8 fps

/** The Glutton's and the Bride's clocks (monsters.js, every frame they are up: walking or chewing, not frozen, knocked back or down). */
export function keepTick(m, dt){
  if (m.frozenT > 0) return;
  if (m.type === 'glutton'){
    const T = TYPES.glutton;
    if ((m.netT -= dt) > 0) return;
    m.netT = T.netEvery;
    if (ownNets(m) < T.netMax && throwNet(m.x, mY(m), 'red', m.id)){ m.anim = { clip:'cast', t:0, dur:CAST_DUR }; SFX.monsterAct('glutton', 'cast'); }
    return;
  }
  if (m.type === 'bride'){
    if (m.veil){
      if (!m.veil.dead && m.veil.veilBy === m.id && G.monsters.includes(m.veil)) return;
      m.veil = null; m.veilT = TYPES.bride.veilAgain;
    }
    if ((m.veilT -= dt) > 0) return;
    const o = veilTarget(m);
    if (o) putVeil(m, o); else m.veilT = 0.25;   // nobody in reach: look again in a moment
  }
}

/** May a Bride veil o at all? */
const veilable = (b, o) => o !== b && !o.dead && o.type !== 'bride' && o.type !== 'jukebox' && o.type !== 'sack' && brideOf(o) == null && o.rise <= 0 && !o.hidden;
/** The nearest veilable monster within the Bride's reach, or null. */
function veilTarget(b){
  const reach = TYPES.bride.veilReach, by = mY(b);
  let best = null, bd = Infinity;
  for (const o of G.monsters){
    if (!veilable(b, o) || Math.abs(o.lane - b.lane) > reach || o.p < -0.05) continue;
    const d = Math.hypot(o.x - b.x, mY(o) - by); if (d < bd){ bd = d; best = o; }
  }
  return best;
}
function putVeil(b, o){
  o.veilBy = b.id; b.veil = o;
  b.anim = { clip:'cast', t:0, dur:CAST_DUR };
  ring(o.x, mY(o), 36, 'rgba(200,30,60,.85)'); for (let i = 0; i < 8; i++) spark(o.x, mY(o) - 10, '#d0203c', 90);
  SFX.monsterAct('bride', 'veil');
}

/** kill() (combat.js), once a Release 8 monster is truly dead: a Glutton's red nets turn ordinary, a Bride's veil comes off. */
export function keepFalls(m){
  if (m.id != null) releaseNets(m.id);
  if (m.type === 'bride'){
    for (const o of G.monsters) if (o.veilBy === m.id){ o.veilBy = null; o.flash = 0.15; }
    m.veil = null;
  }
}

/** Red nets thrown by `id` (on the patch and in flight) become ordinary nets with no thrower. */
function releaseNets(id){
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ const cell = grid[r][c]; if (cell && cell.net === 'red' && cell.netBy === id){ cell.net = 'net'; cell.netBy = null; } }
  for (const f of G.netsFlying || []) if (f.kind === 'red' && f.by === id){ f.kind = 'net'; f.by = null; }
}

// ---------- a continued night ----------
const keyOf = o => o.type === 'boss' ? 'boss:' + o.kind : o.type;
/** What a continued night carries (game.js continueState): the type of each living owner of red nets with its id, and each living Bride's veiled type. */
export function shieldSnapshot(){
  const owners = [], veils = [];
  for (const m of G.monsters){
    if (m.dead || m.id == null) continue;
    if (ownNets(m) > 0) owners.push([keyOf(m), m.id]);
    if (m.type === 'bride' && m.veil && !m.veil.dead) veils.push(keyOf(m.veil));
  }
  return { owners, veils };
}
/** Put the carry in place on a continued night (game.js continueNight, after restoreNets). */
export function restoreShields(s){
  const owners = (s && s.owners) || [], ids = new Map(owners.map(([, id], k) => [id, -(k + 1)]));
  const tag = by => ids.has(by) ? ids.get(by) : undefined;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const cell = grid[r][c]; if (!cell || cell.net !== 'red') continue;
    const t = tag(cell.netBy); if (t === undefined){ cell.net = 'net'; cell.netBy = null; } else cell.netBy = t;   // orphan red nets (no living owner at the loss) are ordinary
  }
  for (const f of G.netsFlying || []){ if (f.kind !== 'red') continue; const t = tag(f.by); if (t === undefined){ f.kind = 'net'; f.by = null; } else f.by = t; }
  G.shieldCarry = { owners:owners.map(([key], k) => ({ key, id:-(k + 1) })), veils:((s && s.veils) || []).slice() };
}
/** A monster coming back on a continued night (initKeepMonster): the first of a carried owner's type takes its red nets; the first Bride, a veil. */
function adopt(m){
  const C = G.shieldCarry, key = keyOf(m);
  const i = C.owners.findIndex(o => o.key === key);
  if (i >= 0){
    const id = C.owners.splice(i, 1)[0].id;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ const cell = grid[r][c]; if (cell && cell.net === 'red' && cell.netBy === id) cell.netBy = m.id; }
    for (const f of G.netsFlying || []) if (f.kind === 'red' && f.by === id) f.by = m.id;
  }
  if (m.type === 'bride' && C.veils.length){
    const want = C.veils.shift(); let best = null, bd = Infinity;
    for (const o of G.monsters) if (keyOf(o) === want && veilable(m, o)){ const d = Math.hypot(o.x - m.x, mY(o) - mY(m)); if (d < bd){ bd = d; best = o; } }
    if (best){ best.veilBy = m.id; m.veil = best; m.veilT = 0; }
  }
  if (!C.owners.length && !C.veils.length) G.shieldCarry = null;
}
/** Every frame on a continued night with red nets still waiting (game.js): once every unbeaten monster is back, nobody is coming for them. */
export function carryCheck(){
  const C = G.shieldCarry; if (!C || !G.def || G.spawned < G.def.total) return;
  for (const o of C.owners) if (!o.key.startsWith('boss:')) releaseNets(o.id);   // a boss comes back on its own (spawner.js), whenever it does
  C.owners = C.owners.filter(o => o.key.startsWith('boss:')); C.veils = [];
  if (!C.owners.length) G.shieldCarry = null;
}
