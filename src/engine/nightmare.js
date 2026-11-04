// Nightmare monsters' own behaviour (Release 4, Nightmare Pumpkin Patch; spec Part 4). monsters.js calls updateNightmareMonster from the
// type switch of updateMonster, which only runs while a monster is not frozen, not chewing and not down; it returns true when it handled
// the type (and set m.x). Every caller gates on `__RELEASE__ >= 4`, so lower builds drop this module.

import { TYPES } from '../data/monsters.js';
import { SFX } from './audio.js';
import { ring, spark } from './combat.js';
import { mY } from './monsters.js';
import { G } from './state.js';

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
  }
  return false;
}
