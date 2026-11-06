// Gourds (Release 4, Nightmare Pumpkin Patch; spec Part 3; a list since Release 5, spec Part 6). Gourds stand on the patch on every level
// with `gourd:true`: the kinds the night was started with (G.gourdKinds, slot order; Release 4 is always ['grave']), each a grid cell like a
// pumpkin (`c = GOURD`, `gourd:kind`), so it slides and is pushed like one, but it never joins a bunch, never lights up and is never flicked.
// Holding one destroys it; it comes back on the next sprout tick. Each gourd keeps its own due-back state (dueOf / setDue below), keyed by
// its id: a kind's first gourd of the night is the kind itself ('grave', 'protector'); a second of the same kind (ALLOW_SAME_GOURD in
// data/gourds.js) is 'grave#2' (gourdIds). Cells carry their id (`gid`); a cell without one is its kind's first.
// - The Grave Gourd ('grave'): breaking it clears every grave in its 3×3; every sprout tick its slot (the tick's first) fills the empty cells
//   of its 3×3 (board.js spawnSprouts).
// - The Protector Gourd ('protector', Release 5): pumpkins in its 3×3 (its own cell included) are protected (isProtected): no rot, no monster
//   can destroy them; a pumpkin launched from there carries `ward` (combat.js). Breaking it turns the rotten pumpkins in its 3×3 into Rainbows.
//   It does not sprout; when due it comes back on a random empty cell at the start of the next sprout tick (gourdsBack).
// Every caller gates on `__RELEASE__ >= 4` (the Protector's branches on `>= 5`), so lower builds drop this module. Art: render/gourd.js.

import { SFX } from './audio.js';
import { applyMove, emptyCells, inside, newCell, planMove, randSprout, resolveMatches, revertMove } from './board.js';
import { chunk, ring, spark } from './combat.js';
import { bustGrave } from './game.js';
import { COLS, CS, G, GY, LANE, ROWS, graves, grid } from './state.js';
import { RAINBOW } from '../data/pumpkins.js';
import { isRotten } from './rot.js';

/** The gourd's colour index: not a pumpkin colour, so no PTYPES row, bunch or sprite belongs to it. */
export const GOURD = -1;
export const isGourd = cell => !!(cell && cell.gourd);
/** A gourd cell's kind ('grave' / 'protector'), or null for a pumpkin or an empty cell. A bare `gourd:true` (Release 4's shape) is the Grave. */
export const gourdKind = cell => cell && cell.gourd ? (cell.gourd === true ? 'grave' : cell.gourd) : null;
/** A new gourd cell of a kind, with the same shape as newCell; `gid` its id when it is not its kind's first (a second of one kind). */
export function newGourd(kind = 'grave', gid){ const cell = newCell(GOURD); cell.gourd = kind; if (gid && gid !== kind) cell.gid = gid; return cell; }
/** A gourd cell's id (its kind for a kind's first gourd), or null for anything else. */
export const gourdId = cell => cell && cell.gourd ? (cell.gid || gourdKind(cell)) : null;
/** The ids of a night's gourds, in slot order: each kind's first is the kind, a second 'kind#2' (['grave', 'grave'] -> ['grave', 'grave#2']). */
export function gourdIds(kinds){ const seen = {}; return kinds.map(k => { seen[k] = (seen[k] || 0) + 1; return seen[k] > 1 ? `${k}#${seen[k]}` : k; }); }
const idKind = id => id.split('#')[0];

/** Whether a gourd (by id; a kind names its first) is destroyed and due back. The first Grave's flag is Release 4's `G.gourdDue` (a boolean,
 *  unchanged); every other gourd's lives in `G.gourdDueOf[id]`. */
export const dueOf = id => id === 'grave' ? !!G.gourdDue : !!(G.gourdDueOf && G.gourdDueOf[id]);
function setDue(id, v){ if (id === 'grave') G.gourdDue = v; else (G.gourdDueOf || (G.gourdDueOf = {}))[id] = v; }

/** Every gourd standing on the patch, in reading order. */
export function gourdsOn(){
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ const cell = grid[r][c]; if (cell && cell.gourd) out.push({ kind:gourdKind(cell), id:gourdId(cell), r, c, cell }); }
  return out;
}
/** Where the gourd with this id stands, or null. */
function posOfId(id){
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && grid[r][c].gourd && gourdId(grid[r][c]) === id) return { r, c };
  return null;
}
/** (r, c) is inside the 3×3 (its centre included) of a Grave Gourd standing on the patch: a crow takes nothing there (Release 4). Any number
 *  of Graves; no allocation. */
export function inGraveSquare(r, c){
  for (let a = Math.max(0, r - 1); a <= Math.min(ROWS - 1, r + 1); a++) for (let b = Math.max(0, c - 1); b <= Math.min(COLS - 1, c + 1); b++){
    const cell = grid[a][b]; if (cell && cell.gourd && gourdKind(cell) === 'grave') return true;
  }
  return false;
}
/** Where a kind of gourd stands (the Grave by default, so Release 4 callers keep working): its first of the night if it stands, else any
 *  other of that kind (two of a kind, ALLOW_SAME_GOURD), or null when none stands (destroyed or not picked). */
export function gourdPos(kind = 'grave'){
  const first = posOfId(kind); if (first) return first;
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

/** Put a gourd of a kind (and id) on (r, c), replacing whatever pumpkin stands there. */
function putGourd(r, c, kind = 'grave', gid){ const cell = newGourd(kind, gid); grid[r][c] = cell; return cell; }
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

/** Night start: the night's gourds, replacing what the pattern put there. One goes in the patch's centre (2, 3), as in Release 4; two
 *  go to (2, 1) and (2, 5), a Grave on the left whatever the slot order (two of one kind: slot order), so their squares do not overlap. A
 *  grave on a start cell moves that gourd to the nearest cell without a grave or another gourd. Any gourd already on the patch is removed
 *  first. Returns the cells placed. */
export function placeGourdsAtStart(kinds = ['grave']){
  removeGourds(); G.gourdDue = false; G.gourdDueOf = {};
  const ids = gourdIds(kinds), list = kinds.map((kind, i) => ({ kind, id:ids[i] }));
  const order = list.length > 1 ? list.sort((a, b) => (b.kind === 'grave') - (a.kind === 'grave')) : list;   // a stable sort: slot order within a kind
  const starts = order.length > 1 ? [[2, 1], [2, 5]] : [[2, 3]], out = [];
  order.forEach(({ kind, id }, i) => {
    const at = starts[i] || [2, 3], spot = nearestFree(at[0], at[1]); if (!spot) return;
    putGourd(spot[0], spot[1], kind, id); out.push({ kind, r:spot[0], c:spot[1] });
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

/** Release 5: the Protector Gourd has just broken at pos (it is already off the patch): every rotten pumpkin in its 3×3 becomes a Rainbow
 *  (owner). destroyGourd resolves the bunches after. Broken under a lying poison fog, its square (centre included) is spared until that fog
 *  lifts (`G.poison.on.spared`, cell r * COLS + c; poison.js sweep skips them); a fog that starts after the break rots them as usual. */
export function onProtectorBreak(pos){
  const fog = G.poison && G.poison.on;
  if (fog){ const sp = fog.spared || (fog.spared = []); for (let a = pos.r - 1; a <= pos.r + 1; a++) for (let b = pos.c - 1; b <= pos.c + 1; b++) if (inside(a, b)) sp[a * COLS + b] = true; }
  for (const [a, b] of squareAround(pos.r, pos.c)){
    const cell = grid[a][b]; if (!isRotten(cell)) continue;
    cell.c = RAINBOW; cell.lit = false; cell.pop = 1;
    const x = LANE(b), y = GY + a * CS + CS / 2;
    for (let i = 0; i < 8; i++) spark(x, y, ['#ff8a70', '#ffd98a', '#a8d4ff', '#a6e07a', '#c79cf2'][i % 5], 120);
  }
}

/** Destroyed by the player's hold (board.js smash routes here), by kind. The Grave: every grave in its 3×3 is cleared (free, through
 *  bustGrave), pumpkins in the square are untouched. The Protector (Release 5): onProtectorBreak. Either way it is due back on the next
 *  sprout tick. */
export function destroyGourd(cell){
  if (!cell || !cell.gourd) return false;   // only ever a gourd itself (a null ref would match an empty cell)
  let pos = null;
  for (let r = 0; r < ROWS && !pos; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === cell){ pos = { r, c }; break; }
  if (!pos) return false;
  const kind = gourdKind(cell), fx = gourdFx(kind);
  grid[pos.r][pos.c] = null; setDue(gourdId(cell), true); G.gourdsBroken = (G.gourdsBroken || 0) + 1;
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
/** Put a due gourd (by id) back on a random empty cell. True when it came back. */
function bringBack(id){
  const empties = emptyCells(); if (!empties.length) return false;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)], kind = idKind(id);
  const cell = putGourd(r, c, kind, id); cell.grow = 0; setDue(id, false);
  for (let i = 0; i < 8; i++) spark(LANE(c), GY + r * CS + CS / 2, gourdFx(kind).spark, 110);
  resolveMatches();
  return true;
}
/** Release 5: at the start of a sprout tick every due gourd of the night but the first Grave (which comes back in its own slot) comes back
 *  on a random empty cell; it takes no sprout slot. Returns how many came back. */
export function gourdsBack(){
  if (!(__RELEASE__ >= 5)) return 0;
  let n = 0;
  for (const id of gourdIds(G.gourdKinds || [])) if (id !== 'grave' && dueOf(id) && !posOfId(id) && bringBack(id)) n++;
  return n;
}

/** The Grave's power: every empty cell of its 3×3 sprouts a pumpkin in the team's colours (as randSprout), for every Grave standing (one in
 *  Release 4; two when ALLOW_SAME_GOURD lets a night take two). Returns how many. */
export function gourdFill(){
  let n = 0;
  for (const g of gourdsOn()){
    if (g.kind !== 'grave') continue;
    let k = 0;
    for (const [a, b] of squareAround(g.r, g.c)){
      if (grid[a][b] || graves[a][b]) continue;
      const cell = newCell(randSprout()); cell.grow = 0; grid[a][b] = cell; k++;
      for (let i = 0; i < 4; i++) spark(LANE(b), GY + a * CS + CS / 2, '#a6f06a', 90);
    }
    if (k) ring(LANE(g.c), GY + g.r * CS + CS / 2, CS * 1.2, 'rgba(230,200,120,.75)');   // a sprout puff around it
    n += k;
  }
  if (n) resolveMatches();
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

/** What a continued night needs: each of the night's gourds, in slot order, with its cell or that it is due back (a second of one kind is
 *  told apart by its place in the list, gourdIds). */
export const gourdSnapshot = () => { const kinds = G.gourdKinds || ['grave'], ids = gourdIds(kinds); return kinds.map((kind, i) => { const p = posOfId(ids[i]); return { kind, at:p ? [p.r, p.c] : null, due:dueOf(ids[i]) || !p }; }); };
/** Continue a night: each gourd goes back to its cell (or the nearest free one), or stays destroyed and due back. Takes the list from
 *  gourdSnapshot, or a Release 4 snapshot (one object { at, due }: the Grave). */
export function restoreGourd(list){
  if (!list) return;
  if (!Array.isArray(list)) list = [{ kind:'grave', at:list.at, due:list.due }];
  removeGourds(); G.gourdDue = false; G.gourdDueOf = {};
  const ids = gourdIds(list.map(s => s.kind));
  list.forEach((s, i) => {
    const spot = s.at && !s.due ? nearestFree(s.at[0], s.at[1]) : null;
    if (spot) putGourd(spot[0], spot[1], s.kind, ids[i]); else setDue(ids[i], true);
  });
  resolveMatches();
}
