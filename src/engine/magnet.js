// ---------- The Magnet pumpkin's pull (Release 6, owner 2026-11-08; spec docs/superpowers/specs/2026-11-08-release-6-magnet-design.md) ----------
// A Magnet hit drags up to MAG_N monsters onto the hit monster's tile (its lane and height): from its own row and, at higher levels, the
// rows below it (closer to the wall), any lane, nearest first, whether or not the hit kills. Monsters chewing a wall or a scarecrow are
// pulled off it (owner: "I want it to rescue walls"). Standalone: this reads nothing from Releases 2-5, so the Magnet can ship ahead of them.

import { MAG_N, MAG_ROWS, MAG_SLIDE } from '../data/pumpkins.js';
import { G, LANE, FIELD_TOP, FIELD_BOT, walls } from './state.js';
import { TILE_P, mY } from './monsters.js';
import { SFX } from './audio.js';

const NEVER = new Set(['boss', 'sack', 'jukebox', 'diver', ...(__RELEASE__ >= 8 ? ['lobbercart'] : []), ...(__RELEASE__ >= 9 ? ['eel', 'tentacle', 'siren'] : [])]);   // Release 9: the water dwellers that never walk (Storm Eel, Kraken tentacle, Siren) stay in the tide   // ... and from Release 8 the Lobber Cart, which stays put (owner 2026-11-09)   // bosses (mini bosses and forms are bosses too), the Loot Sack, the Frenzy jukebox, and Puddle Divers (owner, 2026-11-08: one pulled out of its puddle kept diving on dry ground)

/** Can a Magnet hit move this monster? Never a boss, the Loot Sack, the jukebox, a Puddle Diver or (Release 9) a Storm Eel, Kraken tentacle or Siren, anything hidden, a mummy lying down, or one off the field. */
export function magnetPullable(m){
  return !m.dead && !NEVER.has(m.type) && !m.hidden && !(m.rise > 0) && m.p >= 0 && m.p <= 1;
}

/** Pull for a Magnet hit of level lv on `anchor`; returns how many monsters were pulled. */
export function magnetPull(anchor, lv){
  if (anchor.p > 1 || (anchor.p >= 1 && walls[anchor.lane] && walls[anchor.lane].hp <= 0)) return 0;   // walking through a fallen wall: never drag others into the gap (final review: that lost the night)
  const i = Math.max(0, Math.min(4, lv - 1)), tp = TILE_P(), maxRow = Math.max(0, Math.ceil(1 / tp) - 1);
  const rowOf = p => Math.min(maxRow, Math.max(0, Math.floor(p / tp)));   // capped like glue's: on a field a whole number of tiles tall, the fence is still the bottom row
  const row = rowOf(anchor.p), last = row + MAG_ROWS[i] - 1;
  const h = FIELD_BOT - FIELD_TOP, ax = LANE(anchor.lane);
  const near = G.monsters.filter(o => o !== anchor && magnetPullable(o) && rowOf(o.p) >= row && rowOf(o.p) <= last)
    .map(o => ({ o, d:Math.hypot(LANE(o.lane) - ax, (o.p - anchor.p) * h) })).sort((a, b) => a.d - b.d).slice(0, MAG_N[i]);
  for (const { o } of near){
    const x0 = o.x, y0 = mY(o);
    o.lane = anchor.lane; o.tx = ax;
    o.pullDx = x0 - ax; o.pullDp = o.p - anchor.p; o.p = anchor.p; o.pullT = MAG_SLIDE;
    o.eating = false; o.chewing = null; o.kb = 0;   // off the wall or scarecrow it was chewing (owner: it rescues walls)
    if (G.vfx) G.vfx.push({ kind:'magpull', x1:x0, y1:y0, x2:ax, y2:mY(anchor), t:0, dur:MAG_SLIDE + 0.15 });
  }
  if (near.length) SFX.extra('magnet');
  return near.length;
}

/** Per frame for a monster being pulled: the remaining offset shrinks to nothing over MAG_SLIDE. Returns true while it is still sliding. */
export function magnetSlide(m, dt){
  if (!(m.pullT > 0)) return false;
  m.pullT = Math.max(0, m.pullT - dt);
  const f = m.pullT / MAG_SLIDE, e = f * f;   // eases in to the tile
  m.x = m.tx + m.pullDx * e; m.slideDp = m.pullDp * e;
  if (m.pullT <= 0){ m.pullDx = m.pullDp = m.slideDp = 0; }
  return m.pullT > 0;
}
