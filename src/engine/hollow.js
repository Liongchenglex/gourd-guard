// Nightmare Foggy Hollow's monsters (Release 5; spec Part 4): Plague Doctor 2 (`rotdoctor`) and the Reaper (`reaper`).
// Every caller gates on `__RELEASE__ >= 5`, so lower builds drop this module. Their numbers are in data/monsters.js.
//  - Plague Doctor 2 heals nobody. While it stands, every other monster in its 3x3 (the Plague Doctor's heal-zone geometry: lanes +-1, 1.5 tiles
//    either way) can only be hurt by rotten pumpkins (`rotOnly`, engine/rot.js; combat.js refuses everything else). markRotZones marks them
//    once per frame, right after clearHitFlags and before any monster updates, so a burning or poisoned monster is protected the same frame
//    whatever order the monsters sit in. The doctor itself is never marked.
//  - The Reaper is the Wraith's fade cycle with its own times. Its scythe swing is its chew (owner): reapLanes gives the three fences it wears
//    down at the fence, monsters.js's chewing step does the rest at its `eat` rate. When it dies a crow bursts out where it fell (reaperFalls).

import { TYPES } from '../data/monsters.js';
import { SFX } from './audio.js';
import { spark } from './combat.js';
import { mY, spawnMonster, TILE_P } from './monsters.js';
import { COLS, G } from './state.js';

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

/** The type switch of updateMonster's default branch (a monster that is walking: not frozen, chewing, knocked back or down). True when handled. */
export function updateHollowMonster(m, dt){
  switch (m.type){
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
