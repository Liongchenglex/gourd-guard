// Nightmare monsters' own behaviour (Release 4, Nightmare Pumpkin Patch; spec Part 4). monsters.js calls updateNightmareMonster from the
// type switch of updateMonster, which only runs while a monster is not frozen, not chewing and not down; it returns true when it handled
// the type (and set m.x). Every caller gates on `__RELEASE__ >= 4`, so lower builds drop this module.

import { TYPES } from '../data/monsters.js';
import { SFX } from './audio.js';
import { ring, spark } from './combat.js';
import { igniteNear, mY } from './monsters.js';
import { G, ROWS, grid } from './state.js';

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

/** The Hayrick throws its pitchfork down its column: the lowest pumpkin there (a gourd is skipped, and so is one already pinned or in flight) is pinned for pinT seconds.
 *  Once per monster: with nothing to pin it keeps the fork and tries again next frame. */
function throwFork(m){
  for (let r = ROWS - 1; r >= 0; r--){
    const cell = grid[r][m.lane];
    if (!cell || cell.gourd || cell.fly > 0 || cell.pinned > 0) continue;
    cell.pinned = cell.pinMax = TYPES[m.type].pinT; m.thrown = true;
    m.anim = { clip:'toss', t:0, dur:10 / 14 };
    ring(m.x, mY(m), 50, 'rgba(255,214,120,.7)');
    SFX.monsterAct('hayrick', 'toss');
    return;
  }
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
  }
  return false;
}
