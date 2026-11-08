// ---------- Nets on the patch (Release 8, Nightmare Crumbling Keep; spec Part 2) ----------
// A netted pumpkin (`cell.net` = 'net' | 'red', `cell.netBy` = the id of the monster that threw it) cannot slide, cannot be pushed, cannot be
// moved by the hint or the wind and cannot be crushed (board.js, game.js); it still bunches, lights up and flies with its bunch, and the
// net goes with the cell that leaves the grid. A net has no timer. Only a red net shields its monster (`redNetsOf`). At most NET_CAP nets lie
// on the patch at once; a throw over the cap fizzles. Only called from code gated on `__RELEASE__ >= 8`.

import { COLS, G, GY, CS, LANE, ROWS, grid, graves } from './state.js';
import { NET_CAP, NET_FLY } from '../data/rules.js';
import { SFX } from './audio.js';
import { addFloat, spark, ring } from './combat.js';

/** Nets lying on the patch. */
export function netCount(){
  let n = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && grid[r][c].net) n++;
  return n;
}
export const isNetted = cell => !!(cell && cell.net);

// The Crookneck Gourd's square (Task 7, Release 8) is not built yet: nothing is "in a Crookneck square" until `inCrookSquare` lands.
const inCrookSquare = (r, c) => false;

const free = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS && !graves[r][c] && !(grid[r][c] && grid[r][c].net);   // on the patch, not a grave, not netted

/** May a net land on (r, c)? A pumpkin (not a gourd, not in flight, not already netted, not in a Crookneck square) that keeps at least one free
 *  orthogonal neighbour once netted, so nets can never lock the patch. */
export function canNet(r, c){
  const cell = r >= 0 && r < ROWS && c >= 0 && c < COLS ? grid[r][c] : null;
  if (!cell || cell.gourd || cell.fly > 0 || cell.net || inCrookSquare(r, c)) return false;
  return free(r - 1, c) || free(r + 1, c) || free(r, c - 1) || free(r, c + 1);
}

/** A random cell a net may land on, or null. Cells another net in flight is already headed for are left alone. */
export function pickNetCell(){
  const aimed = new Set((G.netsFlying || []).map(f => f.r * COLS + f.c)), ok = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (canNet(r, c) && !aimed.has(r * COLS + c)) ok.push([r, c]);
  return ok.length ? ok[Math.floor(Math.random() * ok.length)] : null;
}

/** Throw a net from (fromX, fromY): it flies NET_FLY seconds and lands on a cell picked now (and checked again on landing). False, with a
 *  puff, when the patch holds the cap already (counting nets in flight) or there is no cell. `kind` is 'net' or 'red'; `by` the thrower's id. */
export function throwNet(fromX, fromY, kind = 'net', by = null){
  if (!G.netsFlying) G.netsFlying = [];
  const spot = netCount() + G.netsFlying.length >= NET_CAP ? null : pickNetCell();
  if (!spot){ fizzle(fromX, fromY, kind); return false; }
  G.netsFlying.push({ x:fromX, y:fromY, kind, by, r:spot[0], c:spot[1], t:NET_FLY });
  return true;
}

function fizzle(x, y, kind){ for (let i = 0; i < 6; i++) spark(x, y, kind === 'red' ? '#b8202e' : '#c8a86a', 90); }

/** Remove the nets whose cell matches `pred(cell)` (all of them by default). */
export function clearNets(pred){
  let n = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const cell = grid[r][c]; if (!cell || !cell.net || (pred && !pred(cell))) continue;
    cell.net = null; cell.netBy = null; n++;
    const x = LANE(c), y = GY + r * CS + CS / 2;
    for (let i = 0; i < 6; i++) spark(x, y, '#c8a86a', 120);
  }
  return n;
}

/** How many red nets thrown by monster `m` lie on the patch (they shield it). */
export function redNetsOf(m){
  let n = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ const cell = grid[r][c]; if (cell && cell.net === 'red' && cell.netBy === m.id) n++; }
  return n;
}

/** Nets in flight: count down and land (re-checking the cell). */
export function updateNets(dt){
  const fl = G.netsFlying; if (!fl || !fl.length) return;
  for (const f of fl){
    f.t -= dt; if (f.t > 0) continue;
    if (canNet(f.r, f.c) && netCount() < NET_CAP){
      const cell = grid[f.r][f.c]; cell.net = f.kind; cell.netBy = f.by; cell.netAt = cell.t;
      const x = LANE(f.c), y = GY + f.r * CS + CS / 2;
      ring(x, y, 34, f.kind === 'red' ? 'rgba(200,30,50,.8)' : 'rgba(220,200,150,.8)');
      for (let i = 0; i < 8; i++) spark(x, y + 12, f.kind === 'red' ? '#b8202e' : '#d8c8a0', 110);
      SFX.extra('blocked');
    } else fizzle(LANE(f.c), GY + f.r * CS + CS / 2, f.kind);
  }
  G.netsFlying = fl.filter(f => f.t > 0);
}

/** The nets for a continued night: those lying on cells and those in flight. */
export function netSnapshot(){
  const cells = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && grid[r][c].net) cells.push([r, c, grid[r][c].net, grid[r][c].netBy]);
  return { cells, flying:(G.netsFlying || []).map(f => [f.x, f.y, f.kind, f.by, f.r, f.c, f.t]) };
}

/** Put the saved nets back: on the same cell when it holds a pumpkin, else on the nearest netable pumpkin (the continued patch is fresh). */
export function restoreNets(s){
  if (!s) return;
  for (const [r0, c0, kind, by] of s.cells || []){
    let best = null, bd = Infinity;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ if (!canNet(r, c)) continue; const d = Math.hypot(r - r0, c - c0); if (d < bd){ bd = d; best = [r, c]; } }
    if (best){ const cell = grid[best[0]][best[1]]; cell.net = kind; cell.netBy = by; cell.netAt = cell.t - 1; }
  }
  G.netsFlying = (s.flying || []).map(([x, y, kind, by, r, c, t]) => ({ x, y, kind, by, r, c, t }));
}
