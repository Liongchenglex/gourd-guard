// Gourds (Release 4, Nightmare Pumpkin Patch; spec Part 3; a list since Release 5, spec Part 6). Gourds stand on the patch on every level
// with `gourd:true`: the kinds the night was started with (G.gourdKinds, slot order; Release 4 is always ['grave']), each a grid cell like a
// pumpkin (`c = GOURD`, `gourd:kind`), so it slides and is pushed like one, but it never joins a bunch, never lights up and is never flicked.
// Holding one destroys it; it comes back on the next sprout tick. Each kind keeps its own due-back state (dueOf / setDue below).
// - The Grave Gourd ('grave'): breaking it clears every grave in its 3×3; every sprout tick its slot (the tick's first) fills the empty cells
//   of its 3×3 (board.js spawnSprouts).
// - The Protector Gourd ('protector', Release 5): pumpkins in its 3×3 (its own cell included) are protected (isProtected): no rot, no monster
//   can destroy them; a pumpkin launched from there carries `ward` (combat.js). Breaking it runs onProtectorBreak (Task 3: rot to Rainbow).
//   It does not sprout; when due it comes back on a random empty cell at the start of the next sprout tick (gourdsBack).
// Every caller gates on `__RELEASE__ >= 4` (the Protector's branches on `>= 5`), so lower builds drop this module. Art: render/gourd.js.

import { SFX } from './audio.js';
import { applyMove, emptyCells, inside, newCell, planMove, randSprout, resolveMatches, revertMove } from './board.js';
import { chunk, ring, spark } from './combat.js';
import { bustGrave } from './game.js';
import { COLS, CS, G, GY, LANE, ROWS, graves, grid } from './state.js';

/** The gourd's colour index: not a pumpkin colour, so no PTYPES row, bunch or sprite belongs to it. */
export const GOURD = -1;
export const isGourd = cell => !!(cell && cell.gourd);
/** A gourd cell's kind ('grave' / 'protector'), or null for a pumpkin or an empty cell. A bare `gourd:true` (Release 4's shape) is the Grave. */
export const gourdKind = cell => cell && cell.gourd ? (cell.gourd === true ? 'grave' : cell.gourd) : null;
/** A new gourd cell of a kind, with the same shape as newCell. */
export function newGourd(kind = 'grave'){ const cell = newCell(GOURD); cell.gourd = kind; return cell; }

/** Whether a kind is destroyed and due back. The Grave's flag is Release 4's `G.gourdDue` (a boolean, unchanged); other kinds live in
 *  `G.gourdDueOf[kind]`. */
export const dueOf = kind => kind === 'grave' ? !!G.gourdDue : !!(G.gourdDueOf && G.gourdDueOf[kind]);
function setDue(kind, v){ if (kind === 'grave') G.gourdDue = v; else (G.gourdDueOf || (G.gourdDueOf = {}))[kind] = v; }

/** Every gourd standing on the patch, in reading order. */
export function gourdsOn(){
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ const cell = grid[r][c]; if (cell && cell.gourd) out.push({ kind:gourdKind(cell), r, c, cell }); }
  return out;
}
/** Where a kind of gourd stands (the Grave by default, so Release 4 callers keep working), or null when none stands (destroyed or not picked). */
export function gourdPos(kind = 'grave'){
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && grid[r][c].gourd && gourdKind(grid[r][c]) === kind) return { r, c };
  return null;
}
/** Release 5: (r, c) is inside the 3×3 (its centre included) of a Protector Gourd standing on the patch (not one due back). No allocation:
 *  rot and the Poltergeists ask this per cell. */
export function isProtected(r, c){
  if (!(__RELEASE__ >= 5)) return false;
  for (let a = Math.max(0, r - 1); a <= Math.min(ROWS - 1, r + 1); a++) for (let b = Math.max(0, c - 1); b <= Math.min(COLS - 1, c + 1); b++){
    const cell = grid[a][b]; if (cell && cell.gourd === 'protector') return true;
  }
  return false;
}

/** The cells of the 3×3 around (r, c) that are on the patch, the centre left out: 8, 5 on an edge, 3 in a corner. */
export function squareAround(r, c){
  const out = [];
  for (let a = r - 1; a <= r + 1; a++) for (let b = c - 1; b <= c + 1; b++) if ((a !== r || b !== c) && inside(a, b)) out.push([a, b]);
  return out;
}

/** Put a gourd of a kind on (r, c), replacing whatever pumpkin stands there. */
function putGourd(r, c, kind = 'grave'){ const cell = newGourd(kind); grid[r][c] = cell; return cell; }
function removeGourds(){ for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && grid[r][c].gourd) grid[r][c] = null; }

/** The cell nearest (r0, c0) without a grave or a gourd (the cell itself first; ties go to the first in reading order). */
function nearestFree(r0, c0){
  let best = null, bd = Infinity;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    if (graves[r][c] || (grid[r][c] && grid[r][c].gourd)) continue;
    const d = Math.hypot(r - r0, c - c0); if (d < bd){ bd = d; best = [r, c]; }
  }
  return best;
}

/** Night start: the night's gourds, replacing what the pattern put there. One kind goes in the patch's centre (2, 3), as in Release 4; two
 *  go to (2, 1) and (2, 5), the Grave on the left whatever the slot order, so their squares do not overlap. A grave on a start cell moves that
 *  gourd to the nearest cell without a grave or another gourd. Any gourd already on the patch is removed first. Returns the cells placed. */
export function placeGourdsAtStart(kinds = ['grave']){
  removeGourds(); G.gourdDue = false; G.gourdDueOf = {};
  const order = kinds.length > 1 ? [...kinds].sort((a, b) => (b === 'grave') - (a === 'grave')) : kinds;
  const starts = order.length > 1 ? [[2, 1], [2, 5]] : [[2, 3]], out = [];
  order.forEach((kind, i) => {
    const at = starts[i] || [2, 3], spot = nearestFree(at[0], at[1]); if (!spot) return;
    putGourd(spot[0], spot[1], kind); out.push({ kind, r:spot[0], c:spot[1] });
  });
  return out;
}
/** Release 4's single-gourd start (kept for its callers and test hook): one Grave Gourd at `at` (default the centre), or the nearest free cell. */
export function placeGourdAtStart(at = [2, 3]){
  removeGourds(); G.gourdDue = false;
  const spot = nearestFree(at[0], at[1]); if (!spot) return null;
  putGourd(spot[0], spot[1]);
  return { r:spot[0], c:spot[1] };
}

/** Release 5 hook: the Protector Gourd has just broken at pos (it is already off the patch). Task 3 fills it (rotten pumpkins in its 3×3 turn
 *  into Rainbows); a no-op until then. */
export function onProtectorBreak(pos){}   // filled by Task 3

/** Destroyed by the player's hold (board.js smash routes here), by kind. The Grave: every grave in its 3×3 is cleared (free, through
 *  bustGrave), pumpkins in the square are untouched. The Protector (Release 5): onProtectorBreak. Either way it is due back on the next
 *  sprout tick. */
export function destroyGourd(cell){
  if (!cell || !cell.gourd) return false;   // only ever a gourd itself (a null ref would match an empty cell)
  let pos = null;
  for (let r = 0; r < ROWS && !pos; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === cell){ pos = { r, c }; break; }
  if (!pos) return false;
  const kind = gourdKind(cell), fx = gourdFx(kind);
  grid[pos.r][pos.c] = null; setDue(kind, true); G.gourdsBroken = (G.gourdsBroken || 0) + 1;
  const x = LANE(pos.c), y = GY + pos.r * CS + CS / 2;
  for (let i = 0; i < 16; i++) chunk(x, y - 10, i % 3 ? fx.shell : fx.dark, 230);   // crack and pop: shell chunks in its colours
  ring(x, y, CS * 1.4, fx.ring);
  if (kind === 'grave') for (const [a, b] of squareAround(pos.r, pos.c)) if (graves[a][b]) bustGrave(a, b, true);
  if (__RELEASE__ >= 5 && kind === 'protector') onProtectorBreak(pos);
  SFX.smash(); G.shake = Math.max(G.shake || 0, 0.35);
  resolveMatches();
  return true;
}

/** Each kind's break and comeback colours (the Protector's only in a Release 5 build). */
const gourdFx = kind => __RELEASE__ >= 5 && kind === 'protector' ? { shell:'#e4d9bd', dark:'#5c8c48', ring:'rgba(244,238,214,.9)', spark:'#f4eedc' }
  : { shell:'#e3a43c', dark:'#8a5a1e', ring:'rgba(255,214,140,.9)', spark:'#ffd98a' };
/** Put a due gourd back on a random empty cell. True when it came back. */
function bringBack(kind){
  const empties = emptyCells(); if (!empties.length) return false;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const cell = putGourd(r, c, kind); cell.grow = 0; setDue(kind, false);
  for (let i = 0; i < 8; i++) spark(LANE(c), GY + r * CS + CS / 2, gourdFx(kind).spark, 110);
  resolveMatches();
  return true;
}
/** Release 5: at the start of a sprout tick every due gourd of the night but the Grave (which comes back in its own slot) comes back on a
 *  random empty cell; it takes no sprout slot. Returns how many came back. */
export function gourdsBack(){
  if (!(__RELEASE__ >= 5)) return 0;
  let n = 0;
  for (const kind of G.gourdKinds || []) if (kind !== 'grave' && dueOf(kind) && !gourdPos(kind) && bringBack(kind)) n++;
  return n;
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
  if (G.gourdDue && bringBack('grave')) return 1;
  if (gourdPos()){ const n = gourdFill(); if (n) return n; }
  return spawnPumpkin() ? 1 : 0;
}

/** For the balance bot (test hook): the slide of the gourd itself that leaves the most empty cells (no pumpkin, no grave) in its 3×3, as
 *  { dir, gain } (gain = empty cells after minus before), or null when no slide gains any. Nothing on the board changes. */
export function bestGourdMove(){
  const pos = gourdPos(); if (!pos) return null;
  const empties = (r, c) => squareAround(r, c).filter(([a, b]) => !grid[a][b] && !graves[a][b]).length;
  const now = empties(pos.r, pos.c);
  let best = null;
  for (const dir of ['left', 'right', 'up', 'down']){
    const moves = planMove(pos.r, pos.c, dir); if (!moves) continue;
    const mine = moves.find(m => m[0] === pos.r && m[1] === pos.c);
    const cells = applyMove(moves, false);
    const gain = empties(mine[2], mine[3]) - now;
    revertMove(moves, cells);
    if (gain > 0 && (!best || gain > best.gain)) best = { dir, gain };
  }
  return best;
}

/** What a continued night needs: each of the night's gourds, in slot order, with its cell or that it is due back. */
export const gourdSnapshot = () => (G.gourdKinds || ['grave']).map(kind => { const p = gourdPos(kind); return { kind, at:p ? [p.r, p.c] : null, due:dueOf(kind) || !p }; });
/** Continue a night: each gourd goes back to its cell (or the nearest free one), or stays destroyed and due back. Takes the list from
 *  gourdSnapshot, or a Release 4 snapshot (one object { at, due }: the Grave). */
export function restoreGourd(list){
  if (!list) return;
  if (!Array.isArray(list)) list = [{ kind:'grave', at:list.at, due:list.due }];
  removeGourds(); G.gourdDue = false; G.gourdDueOf = {};
  for (const s of list){
    const spot = s.at && !s.due ? nearestFree(s.at[0], s.at[1]) : null;
    if (spot) putGourd(spot[0], spot[1], s.kind); else setDue(s.kind, true);
  }
  resolveMatches();
}
