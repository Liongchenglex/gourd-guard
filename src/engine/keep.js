// Nightmare Crumbling Keep's monsters (Release 8; spec Part 3, docs/GAME_DESIGN.md §9 "Nightmare Crumbling Keep"). Their numbers are in data/monsters.js.
// Every caller gates on `__RELEASE__ >= 8`, so lower builds drop this module. One section per monster; each new monster adds a case to
// initKeepMonster / updateKeepMonster and, when it stops or acts outside the walk, a line in monsters.js beside the Release 7 ones.
//  - The Lobber Cart (`lobbercart`): rolls in to `park` of the field and stops there for good (keepStop, read where monsters.js moves a monster); it
//    never chews, so the generic chew-at-fence path never reaches it (it never gets to p = 1). Parked, a clock of `lobEvery` seconds (a fresh random
//    pick each time) runs; it plays `lob` half a second before zero and at zero throws a net onto a random pumpkin (engine/nets.js: throwNet, which fizzles
//    when the patch is full). The clock lives on the monster, so a cart that comes back in a continued night starts a fresh one. A dead cart leaves
//    its nets (spec: "Killing it does not free its nets").

import { TYPES } from '../data/monsters.js';
import { SFX } from './audio.js';
import { mY } from './monsters.js';
import { throwNet } from './nets.js';
import { rnd } from './util.js';

const LOB_DUR = 10 / 12;      // the `lob` clip: 10 frames at 12 fps
const LOB_LEAD = LOB_DUR * 0.5;   // the net leaves the cup at half the clip (render/chars/keep.js lobArm): the swing starts this long before the throw

/** A new monster's Release 8 set-up (spawnMonster, before it joins the field). */
export function initKeepMonster(m){
  if (m.type === 'lobbercart'){ const T = TYPES.lobbercart; m.lobT = rnd(T.lobEvery[0], T.lobEvery[1]); m.lobbing = false; m.parked = false; }
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
