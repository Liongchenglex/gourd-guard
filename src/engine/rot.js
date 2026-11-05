// Rotten pumpkins (Release 5, Nightmare Foggy Hollow; spec Part 2 and "Calls settled after the builder check").
// A rotten pumpkin is its own colour on the patch (ROTTEN, outside PTYPES like the gourd's GOURD): never sprouted, never in the team; a
// pumpkin turns rotten only through rot (poison fog, the Poltergeists: later tasks call rotCell). Rotten ones bunch with rotten only (three,
// as any colour); a Rainbow never joins them and Paint never pulls them (board.js). A rotten pumpkin can still be slid, pushed and crushed.
// On hit (combat.js) the monster's hit rule decides: an ordinary monster is healed by ROT_HEAL; one that only rot can hurt (`rotOnly`) takes
// ROT_DMG; one that only clean pumpkins can hurt (`cleanOnly`, the Lamplighter's clean mood) shrugs it off. No on-hit power, no knockback.
// `rotOnly` / `cleanOnly` are set each frame by the monsters that grant them (a Plague Doctor 2's square, the Lamplighter's moods, the
// Fallen Poltergeist's reaper phase and black fog) during their updates; clearHitFlags resets them at the start of every frame.
// The Protector Gourd shields its 3×3 from rot; breaking it turns the rotten pumpkins in its square into Rainbows (gourd.js).
// Every caller gates on `__RELEASE__ >= 5`, so lower builds drop this module. Art: render/rot.js.

import { SFX } from './audio.js';
import { newCell, resolveMatches } from './board.js';
import { ring, spark } from './combat.js';
import { isProtected } from './gourd.js';
import { COLS, CS, G, GY, LANE, ROWS, graves, grid } from './state.js';

/** The rotten pumpkin's colour index: not a pumpkin colour, so no PTYPES row, level or sprite belongs to it (render/rot.js draws it). */
export const ROTTEN = -2;
export const isRotten = cell => !!(cell && cell.c === ROTTEN);
/** The rot's colours for puffs, trails and the lit bunch's halo (the archive's STINK green, rot brown, white mould). */
export const ROT_FX = { spark:'#9ac25a', base:'#8a6a2a', mould:'#d6e6b8', halo:[150, 205, 70] };

/** Rot the pumpkin on (r, c). False (nothing changes) for an empty cell, a gourd, a moving cell (`fly > 0`), a cell already rotten, or a
 *  cell a Protector Gourd shields. Otherwise it turns ROTTEN, goes dark, and a green puff rises. `resolve` false lets a caller that rots many
 *  cells at once resolve the bunches once. */
export function rotCell(r, c, resolve = true){
  if (!(__RELEASE__ >= 5)) return false;
  const cell = grid[r] && grid[r][c];
  if (!cell || cell.gourd || cell.fly > 0 || cell.c === ROTTEN || isProtected(r, c)) return false;
  cell.c = ROTTEN; cell.lit = false; cell.gids = []; cell.bsize = 0; cell.borrowed = false; cell.pop = 1;
  const x = LANE(c), y = GY + r * CS + CS / 2;
  for (let i = 0; i < 7; i++) spark(x, y, i % 2 ? ROT_FX.spark : ROT_FX.mould, 110);
  ring(x, y, CS * 0.6, 'rgba(154,194,90,.8)');
  SFX.extra('rot');
  if (resolve) resolveMatches();
  return true;
}

/** How a hit lands on monster m: 'hurt', 'heal' (rotten on an ordinary monster) or 'blocked' (the wrong kind: used up, nothing else). */
export function hitRule(m, rotten){
  if (m.rotOnly) return rotten ? 'hurt' : 'blocked';
  if (m.cleanOnly) return rotten ? 'blocked' : 'hurt';
  return rotten ? 'heal' : 'hurt';
}

/** Start of every frame (game.js update, before monsters update): no monster is rot-only or clean-only until its source says so again. */
export function clearHitFlags(){
  const ms = G.monsters;
  for (let i = 0; i < ms.length; i++){ const m = ms[i]; m.rotOnly = false; m.cleanOnly = false; }
}

/** What a continued night needs: every rotten cell, [r, c] in reading order. */
export function rotSnapshot(){
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (isRotten(grid[r][c])) out.push([r, c]);
  return out;
}
/** Continue a night: a rotten pumpkin on each saved cell (replacing the fresh patch's pumpkin there, as it lay before, Protector square or
 *  not), or on the nearest cell without a grave, a gourd or another rotten one when its own is taken. */
export function restoreRot(list){
  if (!list || !list.length) return;
  const free = (r, c) => !graves[r][c] && !(grid[r][c] && grid[r][c].gourd) && !isRotten(grid[r][c]);
  for (const [r0, c0] of list){
    let best = null, bd = Infinity;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ if (!free(r, c)) continue; const d = Math.hypot(r - r0, c - c0); if (d < bd){ bd = d; best = [r, c]; } }
    if (best) grid[best[0]][best[1]] = newCell(ROTTEN);
  }
  resolveMatches();
}
