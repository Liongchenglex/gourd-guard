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
import { throwNet, redNetsOf } from './nets.js';
import { CS, COLS, G, FENCE_Y, ROWS, grid, walls, LANE } from './state.js';
import { rnd } from './util.js';
import { damageWall } from './walls.js';

const COMMAND_DUR = 8 / 9;     // the Marshal's `command` clip: 8 frames at 9 fps
const LOB_DUR = 10 / 12;      // the `lob` clip: 10 frames at 12 fps
const LOB_LEAD = LOB_DUR * 0.5;   // the net leaves the cup at half the clip (render/chars/keep.js lobArm): the swing starts this long before the throw

/** A new monster's Release 8 set-up (spawnMonster, before it joins the field). */
export function initKeepMonster(m){
  if (m.type === 'lobbercart'){ const T = TYPES.lobbercart; m.lobT = rnd(T.lobEvery[0], T.lobEvery[1]); m.lobbing = false; m.parked = false; }
  if (m.type === 'marshal'){ m.rallyT = TYPES.marshal.rallyEvery; m.rallying = false; m.rallyLeft = 0; }
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
      if (w.t <= GATE_OPEN && !w.opening && G.def && G.def.gatePool && G.def.gatePool.length){ w.opening = true; w.anim = { clip:'open', t:0, dur:GATE_OPEN }; SFX.monsterAct('gate', 'open'); }
      if (w.t <= 0){
        w.t = PIECES.gateEvery; w.opening = false;
        const pool = G.def && G.def.gatePool;
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

// ---------- the Blood Glutton, the Bat Bride and the shield door ----------

/** The Fallen Count's clamp (Task 9): a hit may not carry him past his next mark while shielded. Not built yet. */
export const countClamped = m => false;

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
