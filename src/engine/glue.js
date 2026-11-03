// ---------- Beige glue (Release 3, owner 2026-11-02; spec docs/superpowers/specs/2026-11-02-release-3-design.md) ----------
// A Beige pumpkin's kill lays glue on field tiles (one lane wide, one tile height tall). A monster in glue walks at half speed
// and loses GLUE_DMG every GLUE_EVERY seconds. Tiles never stack: a glued tile gets nothing from a new kill, not even a refresh.

import { GLUE_T, GLUE_SHAPE, GLUE_DMG, GLUE_EVERY } from '../data/pumpkins.js';
import { G, COLS } from './state.js';
import { TILE_P } from './monsters.js';
import { damage } from './combat.js';
import { SFX } from './audio.js';

const maxRow = () => Math.max(0, Math.ceil(1 / TILE_P()) - 1);
const rowOf = p => Math.min(maxRow(), Math.max(0, Math.floor(p / TILE_P())));

/** The glue tile under a field position, or null. */
export function glueAt(lane, p){
  if (!G.glue || !G.glue.length) return null;
  const row = rowOf(p);
  for (const t of G.glue) if (t.lane === lane && t.row === row) return t;
  return null;
}

/** Lay glue for a Beige kill at level lv around (lane, p); returns the number of new tiles. */
export function layGlue(lane, p, lv){
  if (!G.glue) G.glue = [];
  const i = Math.max(0, Math.min(4, lv - 1)), row = rowOf(p), shape = GLUE_SHAPE[i], dur = GLUE_T[i];
  const cells = [[lane, row]];
  if (shape === 'row' || shape === 'plus') cells.push([lane - 1, row], [lane + 1, row]);
  if (shape === 'plus') cells.push([lane, row - 1], [lane, row + 1]);
  let n = 0;
  for (const [l, r] of cells){
    if (l < 0 || l >= COLS || r < 0 || r > maxRow()) continue;   // off the field: dropped
    if (G.glue.some(t => t.lane === l && t.row === r)) continue;   // no stacking, no refresh (owner)
    G.glue.push({ lane:l, row:r, t:0, dur }); n++;
  }
  if (n) SFX.extra('glue');
  return n;
}

/** Ages the tiles and removes the ones that ran out. */
export function updateGlue(dt){
  const gl = G.glue; if (!gl || !gl.length) return;
  for (const t of gl) t.t += dt;
  for (let k = gl.length - 1; k >= 0; k--) if (gl[k].t >= gl[k].dur) gl.splice(k, 1);
}

/** One monster's glue for this frame: 0 not in glue, 1 in glue (the caller halves its speed), -1 the glue killed it. */
export function glueStep(m, dt){
  if (m.type === 'sack' || m.type === 'jukebox' || m.hidden || !glueAt(m.lane, m.p)){ m.glueTick = 0; return 0; }
  if (!m.glueTick) m.glueTick = GLUE_EVERY;   // the first bite comes a second after stepping in, like Fire's burn
  m.glueTick -= dt;
  if (m.glueTick <= 0){
    m.glueTick += GLUE_EVERY;
    m.lastHit = -1; damage(m, GLUE_DMG, '#f8d3ca', true);   // neither Fire nor Ice: mummies only go down
    if (m.dead) return -1;
  }
  return 1;
}
