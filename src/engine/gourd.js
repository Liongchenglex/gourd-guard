// The Grave Gourd (Release 4, Nightmare Pumpkin Patch; spec Part 3). One gourd stands on the patch on every level with `gourd:true`.
// It is a grid cell like a pumpkin (`c = GOURD`, `gourd:true`), so it slides and is pushed like one, but it never joins a bunch, never
// lights up and is never flicked. Holding it destroys it, which clears every grave in the 3×3 around it; it comes back on the next sprout
// tick. Every sprout tick one of the tick's slots fills the empty cells of its 3×3 (board.js spawnSprouts). Every caller gates on
// `__RELEASE__ >= 4`, so lower builds drop this module. Art: render/gourd.js.

import { SFX } from './audio.js';
import { emptyCells, inside, newCell, randSprout, resolveMatches } from './board.js';
import { chunk, ring, spark } from './combat.js';
import { bustGrave } from './game.js';
import { COLS, CS, G, GY, LANE, ROWS, graves, grid } from './state.js';

/** The gourd's colour index: not a pumpkin colour, so no PTYPES row, bunch or sprite belongs to it. */
export const GOURD = -1;
export const isGourd = cell => !!(cell && cell.gourd);
/** A new gourd cell, with the same shape as newCell. */
export function newGourd(){ const cell = newCell(GOURD); cell.gourd = true; return cell; }

/** Where the gourd stands, or null when it is destroyed (and due back). */
export function gourdPos(){
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && grid[r][c].gourd) return { r, c };
  return null;
}

/** The cells of the 3×3 around (r, c) that are on the patch, the centre left out: 8, 5 on an edge, 3 in a corner. */
export function squareAround(r, c){
  const out = [];
  for (let a = r - 1; a <= r + 1; a++) for (let b = c - 1; b <= c + 1; b++) if ((a !== r || b !== c) && inside(a, b)) out.push([a, b]);
  return out;
}

/** Put the gourd on (r, c), replacing whatever pumpkin stands there. */
function putGourd(r, c){ const cell = newGourd(); grid[r][c] = cell; return cell; }

/** The cell nearest (r0, c0) without a grave (the cell itself first; ties go to the first in reading order). */
function nearestFree(r0, c0){
  let best = null, bd = Infinity;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    if (graves[r][c]) continue;
    const d = Math.hypot(r - r0, c - c0); if (d < bd){ bd = d; best = [r, c]; }
  }
  return best;
}

/** Night start: the gourd goes in the patch's centre cell (row 2, column 3), replacing what the pattern put there; if a grave covers
 *  the centre, the nearest cell without one. Any other gourd is removed first, so there is only ever one. */
export function placeGourdAtStart(at = [2, 3]){
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && grid[r][c].gourd) grid[r][c] = null;
  G.gourdDue = false;
  const spot = nearestFree(at[0], at[1]); if (!spot) return null;
  putGourd(spot[0], spot[1]);
  return { r:spot[0], c:spot[1] };
}

/** Destroyed by the player's hold (board.js smash routes here): every grave in its 3×3 is cleared (free, through bustGrave), pumpkins
 *  in the square are untouched, and the gourd is due back on the next sprout tick. */
export function destroyGourd(cell){
  if (!cell || !cell.gourd) return false;   // only ever the gourd itself (a null ref would match an empty cell)
  let pos = null;
  for (let r = 0; r < ROWS && !pos; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === cell){ pos = { r, c }; break; }
  if (!pos) return false;
  grid[pos.r][pos.c] = null; G.gourdDue = true; G.gourdsBroken = (G.gourdsBroken || 0) + 1;
  const x = LANE(pos.c), y = GY + pos.r * CS + CS / 2;
  for (let i = 0; i < 16; i++) chunk(x, y - 10, i % 3 ? '#e3a43c' : '#8a5a1e', 230);   // crack and pop: amber shell chunks
  ring(x, y, CS * 1.4, 'rgba(255,214,140,.9)');
  for (const [a, b] of squareAround(pos.r, pos.c)) if (graves[a][b]) bustGrave(a, b, true);
  SFX.smash(); G.shake = Math.max(G.shake || 0, 0.35);
  resolveMatches();
  return true;
}

/** The gourd's power: every empty cell of its 3×3 sprouts a pumpkin in the team's colours (as randSprout). Returns how many. */
export function gourdFill(){
  const pos = gourdPos(); if (!pos) return 0;
  let n = 0;
  for (const [a, b] of squareAround(pos.r, pos.c)){
    if (grid[a][b] || graves[a][b]) continue;
    const cell = newCell(randSprout()); cell.grow = 0; grid[a][b] = cell; n++;
    for (let i = 0; i < 4; i++) spark(LANE(b), GY + a * CS + CS / 2, '#a6f06a', 90);
  }
  if (n){ ring(LANE(pos.c), GY + pos.r * CS + CS / 2, CS * 1.2, 'rgba(230,200,120,.75)'); resolveMatches(); }   // a sprout puff around it
  return n;
}

/** The gourd slot of a sprout tick on a gourd night: a destroyed gourd comes back first (on a random empty cell), else the fill, else one
 *  normal sprout when its square is full. Returns the cells filled (for the sprout sound and the timer). */
export function gourdSlot(spawnPumpkin){
  if (G.gourdDue){
    const empties = emptyCells();
    if (empties.length){
      const [r, c] = empties[Math.floor(Math.random() * empties.length)];
      const cell = putGourd(r, c); cell.grow = 0; G.gourdDue = false;
      for (let i = 0; i < 8; i++) spark(LANE(c), GY + r * CS + CS / 2, '#ffd98a', 110);
      resolveMatches();
      return 1;
    }
  }
  if (gourdPos()){ const n = gourdFill(); if (n) return n; }
  return spawnPumpkin() ? 1 : 0;
}

/** What a continued night needs: the gourd's cell, or that it is due back. */
export const gourdSnapshot = () => { const p = gourdPos(); return { at:p ? [p.r, p.c] : null, due:!!G.gourdDue }; };
/** Continue a night: the gourd goes back to its cell (or the nearest free one), or stays destroyed and due back. */
export function restoreGourd(s){
  if (!s) return;
  if (s.at && !s.due) placeGourdAtStart(s.at);
  else { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && grid[r][c].gourd) grid[r][c] = null; G.gourdDue = true; }
  resolveMatches();
}
