// Nightmare Drowned Marsh's monsters (Release 9; spec Part 3, docs/GAME_DESIGN.md §9 "Nightmare Drowned Marsh (Release 9)"). Their numbers are in data/monsters.js.
// Every caller gates on `__RELEASE__ >= 9`, so lower builds drop this module. One section per monster; each new monster adds a case to initMarshMonster /
// updateMarshMonster and, when it stops or acts outside the walk, a line in monsters.js beside the Release 8 ones.
//  - The Blood Slime (`bloodslime`): killed, it splits into `splits` Bloodlets (`bloodblob`) in the lanes round it (splitBlood, from combat.js kill). At most
//    SLIME_CAP Blood Slimes and Bloodlets live at once, so a split makes min(splits, SLIME_CAP - alive) of them. A Bloodlet's clock `growT` runs only while it
//    walks (updateMarshMonster is skipped while it is frozen, chewing, knocked back or down), so ice holds it small; at `regrow` s it is replaced by a full Blood
//    Slime at its lane and place (no reward for the Bloodlet: it was not killed). `swell` (1..SWELL_MAX) is how big it is drawn, so the player sees it coming.
//    Blobs are minions, so they never count in the night's arrivals, and a night whose total is reached is not won while any monster stands (game.js).
//  - The Drowned Pirate (`pirate`): at spawn he picks 1..2 shots (`shots`) and that many stop points, one in each equal slice of `stopAt` (so they are apart).
//    marshStop holds him at the next one (monsters.js clamps his step there). There he aims `aim` s (a baked aim line and reticle on the target,
//    render/fx.js) and then destroys the pumpkin of his column nearest the top of the patch (pirateTarget): never a gourd (a gourd's square does not protect),
//    never one flying in or held, never a netted one. Nothing to shoot: he walks on at once. The clock stands still while he is frozen; a dead Pirate shoots no one.

import { TYPES, SLIME_CAP } from '../data/monsters.js';
import { PTYPES } from '../data/pumpkins.js';
import { SFX } from './audio.js';
import { addFloat, chunk, ring, spark } from './combat.js';
import { resolveMatches } from './board.js';
import { mS, mY, spawnMonster } from './monsters.js';
import { COLS, CS, G, GY, LANE, ROWS, gest, grid } from './state.js';

export const SWELL_MAX = 1.7;   // a Bloodlet about to regrow is drawn this much bigger (r 13 -> a Blood Slime's r 23 is 1.77)

const isSlimeKind = m => m.type === 'bloodslime' || m.type === 'bloodblob';
/** Living Blood Slimes and Bloodlets on the field. */
export const slimesAlive = () => G.monsters.reduce((n, m) => n + (!m.dead && isSlimeKind(m) ? 1 : 0), 0);

/** A new monster's Release 9 set-up (spawnMonster, before it joins the field). */
export function initMarshMonster(m){
  if (m.type === 'bloodblob'){ m.growT = 0; m.swell = 1; }
  if (m.type === 'pirate'){
    const T = TYPES.pirate, n = T.shots[0] + Math.floor(Math.random() * (T.shots[1] - T.shots[0] + 1)), [a, b] = T.stopAt, w = (b - a) / n;
    m.stops = [];
    for (let i = 0; i < n; i++) m.stops.push(a + w * i + Math.random() * w);   // one in each slice, in walking order
    m.aiming = false; m.aimT = 0; m.aimRow = -1;
  }
}

/** combat.js kill(): a Blood Slime falls into Bloodlets, as many as the cap leaves room for. */
export function splitBlood(m, y){
  const room = SLIME_CAP - slimesAlive(), n = Math.max(0, Math.min(TYPES.bloodslime.splits, room));
  for (let i = 0; i < n; i++){
    const l = Math.max(0, Math.min(COLS - 1, m.lane + i - 1));   // left, the same lane, right
    const bl = spawnMonster('bloodblob', l, true, Math.max(0, m.p - 0.02)); bl.age = 0.2;
  }
  addFloat(n ? 'Split!' : 'No room to split', m.x, y - 30, '#ff6a78', 16, 0.9); SFX.monsterAct('bloodslime', 'split');
}

/** The pumpkin a Pirate in `lane` would shoot: the one nearest the top of the patch, as {r, cell}, or null. */
export function pirateTarget(lane){
  for (let r = 0; r < ROWS; r++){
    const cell = grid[r][lane];
    if (!cell || cell.gourd || cell.fly > 0 || cell.net || (gest && gest.ref === cell)) continue;
    return { r, cell };
  }
  return null;
}

function shoot(m){
  m.aiming = false; m.aimT = 0;
  const t = pirateTarget(m.lane); if (!t) return;
  const x = LANE(m.lane), y = GY + t.r * CS + CS / 2, cell = t.cell;
  grid[t.r][m.lane] = null;
  if (G.vfx) G.vfx.push({ kind:'pirateshot', x, y0:mY(m) + m.r * mS(m) * 0.4, y1:y, t:0, dur:0.16 });
  for (let i = 0; i < 12; i++) chunk(x, y, cell.c >= 0 && PTYPES[cell.c] ? PTYPES[cell.c].base : '#f0a020', 200);
  ring(x, y, 34, 'rgba(255,90,90,.8)'); spark(x, y, '#ffd25a', 120);
  SFX.monsterAct('pirate', 'shoot'); SFX.smash();
  resolveMatches();
}

/** monsters.js: where a Pirate may walk to. His next stop point while shots are left (never back from where he is), his own place while he aims. */
export function marshStop(m){
  if (m.type !== 'pirate') return Infinity;
  if (m.aiming) return m.p;
  return m.stops && m.stops.length ? Math.max(m.p, m.stops[0]) : Infinity;
}

/** The type switch of updateMonster's default branch (a monster that is walking: not frozen, chewing, knocked back or down). True when handled. */
export function updateMarshMonster(m, dt){
  switch (m.type){
    case 'bloodslime': m.x = m.tx; return true;
    case 'bloodblob': {
      const T = TYPES.bloodblob;
      m.x = m.tx;
      m.growT += dt;
      m.swell = 1 + (SWELL_MAX - 1) * Math.min(1, m.growT / T.regrow);
      if (m.growT >= T.regrow){
        m.dead = true;   // it did not die: no reward, no split
        const s = spawnMonster('bloodslime', m.lane, true, m.p); s.age = 0.2; s.flash = 0.25;
        for (let i = 0; i < 8; i++) spark(m.x, mY(m), '#ff6a78', 110);
        SFX.monsterAct('bloodslime', 'regrow');
      }
      return true;
    }
    case 'pirate': {
      m.x = m.tx;
      if (m.aiming){
        m.aimT -= dt;
        const tg = pirateTarget(m.lane); m.aimRow = tg ? tg.r : -1;   // the line follows the pumpkin he would shoot now (it may have flown or slid)
        if (m.aimT <= 0.267 && !m.anim) m.anim = { clip:'shoot', t:0, dur:0.667 };   // the gun comes up so it fires as the aim runs out (render/chars/marsh.js, 8 frames at 12 fps)
        if (m.aimT <= 0) shoot(m);
        return true;
      }
      if (m.stops && m.stops.length && m.p >= m.stops[0] - 0.002){
        m.stops.shift();
        const t = pirateTarget(m.lane);
        if (t){ m.aiming = true; m.aimT = TYPES.pirate.aim; m.aimRow = t.r; SFX.monsterAct('pirate', 'aim'); }
      }
      return true;
    }
  }
  return false;
}
