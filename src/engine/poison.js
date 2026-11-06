// Poison fog on the patch (Release 5, Nightmare Foggy Hollow; spec Part 3, docs/GAME_DESIGN.md §9 "Poison fog").
// Like Witchwood's narrow winds: at the level's `poison.every` s, green arrows warn for POISON_WARN s over 1-2 whole rows or columns of the patch,
// then the fog settles there for `dur` s and drifts off. Everything under it turns rotten (rot.js rotCell: Protector squares and gourds never
// rot). While the fog lasts every pumpkin that has finished moving in a fogged cell is rotted too, so a slide, a sprout or a drop that lands
// there rots on landing, not mid-slide (`settled`). One sweep per frame is the whole landing rule; nothing hooks the board.
// G.poison = { t, warn, on }: t counts down to the next scheduled fog (frozen while one is warning or lying); warn { dir, idx, flow, t, dur };
// on { dir, idx, flow, t, dur, age, spared? } (spared: cells a Protector broke over while it lay, left clean until it lifts). `poisonNow` lights a chosen (or random) line set at once with the same warning (the Lamplighter, Task 8).
// One fog at a time: a fog that comes due while another is warning or lying waits for it to lift (so two can come back to back). A fog the
// Lamplighter calls carries `src:'lamp'` on its warn / on state: it is extra to the level's cycle, so the level clock `t` keeps running under it
// and is not restarted when it lifts; only a level fog (or the coach's) holds the clock while it lasts and restarts it at `every` when it lifts.
// Art: render/poison.js (baked). Every caller gates on `__RELEASE__ >= 5`, so lower builds drop this module.

import { POISON_DUR, POISON_WARN } from '../data/rules.js';
import { SFX } from './audio.js';
import { resolveMatches } from './board.js';
import { addFloat } from './combat.js';
import { rotCell } from './rot.js';
import { prebakePoison } from './render/poison.js';
import { COLS, G, GY, ROWS, W, grid } from './state.js';

/** Is the cell (r, c) under the fog that is lying now? */
export function fogged(r, c){
  const o = G && G.poison && G.poison.on; if (!o) return false;
  return o.dir === 'row' ? o.idx.includes(r) : o.idx.includes(c);
}

/** A pumpkin counts as landed when nothing is flying and it has all but slid into place (a slide, push or gust keeps its offset a moment). */
const settled = cell => !(cell.fly > 0) && Math.abs(cell.ox) + Math.abs(cell.oy) < 6;

/** Rot every settled pumpkin under the fog. True when any turned. A cell in `o.spared` (a Protector broke over it while this fog lay, gourd.js
 *  onProtectorBreak) is skipped until the fog lifts. */
function sweep(){
  const o = G.poison.on, sp = o.spared; let n = 0;
  const row = o.dir === 'row', len = row ? COLS : ROWS;
  for (let i = 0; i < o.idx.length; i++) for (let k = 0; k < len; k++){
    const r = row ? o.idx[i] : k, c = row ? k : o.idx[i], cell = grid[r][c];
    if (cell && !(sp && sp[r * COLS + c]) && settled(cell) && rotCell(r, c, false)) n++;
  }
  if (n) resolveMatches();
  return n > 0;
}

/** The lines of one fog from a level's `poison` field: 1-2 (lines: [min, max]) distinct rows or columns, in a random allowed direction. */
function pickLines(d){
  const dirs = d && d.dirs && d.dirs.length ? d.dirs : ['row', 'col'], dir = dirs[Math.floor(Math.random() * dirs.length)];
  const [lo, hi] = (d && d.lines) || [1, 1], max = dir === 'row' ? ROWS : COLS, n = Math.max(1, Math.min(max, lo + Math.floor(Math.random() * (hi - lo + 1))));
  const pool = [...Array(max).keys()];
  for (let i = 0; i < n; i++){ const j = i + Math.floor(Math.random() * (max - i)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return { dir, idx:pool.slice(0, n).sort((a, b) => a - b) };
}

/** Light a fog at once: the warning, then the fog. `lines` is { dir:'row'|'col', idx:[…] }; omitted, the level's own pick (or one random row or column).
 *  False (nothing changes) when a fog is already warning or lying, or the build has no Release 5. */
export function poisonNow(lines, src){
  if (!(__RELEASE__ >= 5)) return false;
  const p = G.poison; if (!p || p.warn || p.on) return false;
  const d = G.def && G.def.poison, l = lines || pickLines(d);
  p.warn = { dir:l.dir, idx:l.idx.slice(), flow:Math.random() < 0.5 ? 1 : -1, t:POISON_WARN, dur:d && d.dur ? d.dur : POISON_DUR, ...(src ? { src } : {}) };   // src 'lamp': the Lamplighter's (see the header)
  prebakePoison();   // cached after the first call: a night whose level has no `poison` (the Lamplighter's call) bakes it here, before the arrows are first drawn
  addFloat('Poison fog', W / 2, GY - 30, '#b6f06a', 22, 1.8); SFX.wind('warn');
  return true;
}

export function updatePoison(dt){
  if (!(__RELEASE__ >= 5)) return;
  const p = G.poison; if (!p || G.over) return;
  const d = G.def && G.def.poison;
  let held = false;   // a level fog warning or lying this frame: the level clock waits (as before Release 5's Lamplighter: no tick that frame)
  if (p.on){
    p.on.t -= dt; p.on.age += dt;
    sweep();
    held = p.on.src !== 'lamp';
    if (p.on.t <= 0){ p.on = null; if (held) p.t = d ? d.every : 0; }   // only a level fog restarts the level clock
  } else if (p.warn){
    p.warn.t -= dt; held = p.warn.src !== 'lamp';
    if (p.warn.t <= 0){ const w = p.warn; p.warn = null; p.on = { dir:w.dir, idx:w.idx, flow:w.flow, t:w.dur, dur:w.dur, age:0, ...(w.src ? { src:w.src } : {}) }; sweep(); SFX.extra('rot'); G.shake = Math.max(G.shake, 0.15); }
  }
  if (d && !held){   // the level clock runs under a Lamplighter fog; a level fog that comes due while one is up waits for it to lift
    p.t -= dt;
    if (p.t <= POISON_WARN && !p.warn && !p.on) poisonNow(pickLines(d));
  }
}
/** The level clock to save for a continued night: `every` if a level fog was warning or lying at the loss (it is gone and the clock restarts), else the clock. */
export function poisonClock(){
  const p = G.poison; if (!p) return 0;
  const lvl = (p.warn && p.warn.src !== 'lamp') || (p.on && p.on.src !== 'lamp'), d = G.def && G.def.poison;
  return lvl ? (d ? d.every : 0) : p.t;
}
