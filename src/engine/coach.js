// ---------- First-night coach (owner, 2026-10-06) ----------
// The first time 1-1 is played, a hand shows the two moves on the board instead of a card:
//   1. slide: the patch is set up so one slide makes a bunch of 3; monsters and sprouts wait while a hand drags it
//   2. flick: once the bunch lights up, one ghoul walks down its column and the hand swipes the bunch upward
//   3. smash: the hand presses and holds a spare pumpkin until it crushes, to free up space (owner, 2026-10-07)
//   4. praise: a short "Nice!" tip, then the night carries on as normal
// Release 4 adds a second script on Nightmare 1-5 (`coach:'gourd'`, GOURD_STEPS below): slide the Grave Gourd, watch a sprout fill the space
// around it, hold it until it breaks (the graves around it clear), and watch it grow back on the next sprout.
// Release 5 adds a third on Nightmare 2-5 (`coach:'protector'`, PTIPS below): the Protector Gourd shields its square from a fog row, the
// fog rots the rest, the hand slides a rotten one into the square and holds the Protector until it breaks (that rot turns Rainbow), and it
// grows back on the next sprout.
// Release 7 adds a fourth on Nightmare 3-5 (`coach:'wartling'`, WTIPS below): slide the Wartling Gourd, launch a bunch from its square at a
// tough ghoul (doubled numbers), slide it to the top row, hold it until it breaks and the fences above it mend.
// Release 8 adds a fifth on Nightmare 4-3 (`coach:'crookneck'`, CTIPS below): slide the Crookneck Gourd, launch a mixed group from its square,
// watch a net land next to it (one aimed inside falls apart), hold it until it breaks and every net comes off.
// Release 9 adds a sixth on Nightmare 5-5 (`coach:'swan'`, STIPS below): slide the Swan Gourd, launch a bunch from its square at two ghouls side
// by side and watch the black-hole ring hurt the one beside the hit, hold it until it breaks and its square sprouts Rainbows.
// The hand is one baked sprite blitted with transforms (no painter calls or shadowBlur per frame).
import { G, grid, graves, setGrid, walls, ROWS, COLS, CS, GX, GY, LANE, FIELD_TOP, FENCE_Y } from './state.js';
import { newCell, spawnSprouts, planMove, applyMove, revertMove, sameColorSize, findCell, bestLitGroup, resolveMatches } from './board.js';
import { spawnMonster } from './monsters.js';
import { scale } from './render/canvas.js';
import { save, persist } from '../save.js';
import { $ } from './util.js';
import { gourdPos, gourdsOn, squareAround } from './gourd.js';
import { isRotten } from './rot.js';
import { poisonNow } from './poison.js';
import { PTYPES } from '../data/pumpkins.js';
import { NET_FLY } from '../data/rules.js';

const TIPS = {
  slide: 'Drag a pumpkin to slide it. Line up <b>3 of the same colour</b> to make a bunch.',
  flick: 'The bunch is lit! <b>Swipe it up</b> to launch it at the ghoul.',
  smash: 'Got a pumpkin in the way? <b>Press and hold</b> it to crush it and make room.',
  praise: '<b>Nice!</b> Keep bunching and launching to guard your walls.',
};

// The gourd script (Release 4). Steps: gslide (the hand slides the gourd) -> gfill (a sprout fills its 3x3) -> ghold (the hand holds it
// until it breaks) -> gback (it grows back on the next sprout) -> praise. Monsters and sprouts wait through all of it (coachHolds); the
// script runs its own two sprout ticks, the fill and the respawn, through the real spawnSprouts().
const GTIPS = __RELEASE__ >= 4 ? {
  gslide: 'This is the <b>Grave Gourd</b>. Drag it to slide it, like a pumpkin.',
  gfill: 'Every sprout <b>fills the space around your gourd</b>.',
  ghold: '<b>Press and hold</b> the gourd to break it. The graves around it clear away.',
  gback: 'It <b>grows back</b> on the next sprout.',
} : {};

// The Protector script (Release 5). Steps: pshield (the fog warning lies on a row through the Protector's square; it waits until the fog
// has settled) -> prot (the rest of the row has rotted) -> pslide (the hand slides a rotten one into the square; skipped when none can get
// there) -> phold (the hand holds the Protector until it breaks: the rot in its square turns Rainbow) -> pback (it grows back on the next
// sprout) -> praise. Monsters and sprouts wait (coachHolds), and the level's own fog clock is held while it runs; the script lights its own
// fog (poisonNow) and runs its own sprout tick. It looks the Protector up by kind (gourdPos('protector')), never the Grave's default.
const PTIPS = __RELEASE__ >= 5 ? {
  pshield: 'This is the <b>Protector Gourd</b>. Pumpkins in the <b>3×3 around it never rot</b>. Poison fog is coming!',
  prot: 'The fog <b>rotted the pumpkins outside</b> its square. Rotten pumpkins heal the monsters they hit.',
  pslide: 'Rot stays rotten, even in its square. <b>Slide this one in.</b>',
  phold: '<b>Press and hold</b> the Protector to break it: the rotten pumpkins around it turn <b>Rainbow</b>.',
  pback: '<b>Rainbow!</b> It grows back on the next sprout.',
  praise: '<b>Nice!</b> Keep your best pumpkins in its square when the fog comes.',
} : {};

// The Wartling script (Release 7). Steps: wslide (the hand slides the Wartling, never into the top row) -> wlaunch (a bunch of three lights
// up in its square and one tough ghoul walks down that column; the hand swipes it up and the doubled numbers show) -> wtop (the fences above
// it are worn; the hand slides it up into the top row) -> whold (the hand holds it until it breaks: the fences above mend by half) -> praise.
// Broken before whold it goes to wback (it grows back on the next sprout) and on to wtop. Monsters and sprouts wait (coachHolds); the script
// sends its own ghoul (an extra, not counted toward the night's total) and runs its own sprout tick. It looks the Wartling up by kind.
const WTIPS = __RELEASE__ >= 7 ? {
  wslide: 'This is the <b>Wartling Gourd</b>. Drag it to slide it, like a pumpkin.',
  wlaunch: 'Pumpkins flicked from the <b>3×3 around it</b> do <b>double damage</b>. <b>Swipe the bunch up!</b>',
  wtop: 'Now slide it to the <b>top row</b>, right under the fence.',
  whold: '<b>Press and hold</b> it to break it: each <b>fence above it</b> mends by half.',
  wback: 'It <b>grows back</b> on the next sprout.',
  praise: '<b>Nice!</b> Break it under a worn fence to mend it. It grows back on the next sprout.',
} : {};

// The Crookneck script (Release 8). Steps: cslide (the hand slides the Crookneck) -> claunch (two pumpkins of different colours, not touching,
// light up in its square; the hand swipes them up) -> cnet (two nets fly in: one at a pumpkin just outside its square lands, one aimed inside
// falls apart) -> chold (the hand holds it until it breaks: every net comes off) -> praise. Broken before chold it goes to cback (it grows back
// on the next sprout) and on to cnet. Monsters and sprouts wait (coachHolds); the script throws its own nets and runs its own sprout tick.
const CTIPS = __RELEASE__ >= 8 ? {
  cslide: 'This is the <b>Crookneck Gourd</b>. Drag it to slide it, like a pumpkin.',
  claunch: 'Every pumpkin in the <b>3×3 around it</b> lights up together, <b>any colour</b>. <b>Swipe them up!</b>',
  cnet: 'Nets are coming! <b>No net can land in its square</b>, but one lands right next to it.',
  chold: '<b>Press and hold</b> it to break it: <b>every net</b> on the patch comes off, red ones too.',
  cback: 'It <b>grows back</b> on the next sprout.',
  praise: '<b>Nice!</b> Keep your pumpkins in its square when the nets fly. It grows back on the next sprout.',
} : {};

// The Swan script (Release 9). Steps: sslide (the hand slides the Swan) -> slaunch (a bunch beside it, inside its square, and two tough ghouls in
// neighbouring lanes; the hand swipes the bunch up, and the ring hurts the ghoul the bunch did not hit) -> shold (the hand holds it until it
// breaks: a Rainbow in every empty cell around it) -> praise. Broken before shold it goes to sback (it grows back on the next sprout) and on to
// slaunch. Monsters and sprouts wait (coachHolds); the script sends its own two ghouls (extras, not counted toward the night's total).
const STIPS = __RELEASE__ >= 9 ? {
  sslide: 'This is the <b>Swan Gourd</b>. Drag it to slide it, like a pumpkin.',
  slaunch: 'Pumpkins flicked from the <b>3×3 around it</b> burst a <b>black-hole splash</b> that hurts the monsters beside the hit. <b>Swipe the bunch up!</b>',
  shold: '<b>Press and hold</b> it to break it: every empty cell around it sprouts a <b>Rainbow</b>.',
  sback: 'It <b>grows back</b> on the next sprout.',
  praise: '<b>Nice!</b> Fly your bunches from its square to hit a crowd. It grows back on the next sprout.',
} : {};

/** Starts the coach on a fresh 1-1 (call after the board is built), or the gourd script on a Nightmare 1-5 that has not been seen, or the
 *  Protector script on a Nightmare 2-5 that has not been seen and was started with the Protector. */
export function startCoach(){
  if (__RELEASE__ >= 9 && G.mode === 'story' && G.def && G.def.coach === 'swan'){ if (!save.seenSwanCoach && gourdPos('swan')) startSwanCoach(); return; }
  if (__RELEASE__ >= 8 && G.mode === 'story' && G.def && G.def.coach === 'crookneck'){ if (!save.seenCrookneckCoach && gourdPos('crookneck')) startCrookCoach(); return; }
  if (__RELEASE__ >= 7 && G.mode === 'story' && G.def && G.def.coach === 'wartling'){ if (!save.seenWartlingCoach && gourdPos('wartling')) startWartlingCoach(); return; }
  if (__RELEASE__ >= 5 && G.mode === 'story' && G.def && G.def.coach === 'protector'){ if (!save.seenProtectorCoach && gourdPos('protector')) startProtectorCoach(); return; }
  if (__RELEASE__ >= 4 && G.mode === 'story' && G.def && G.def.coach === 'gourd' && !save.seenGourdCoach && gourdPos()) return startGourdCoach();
  if (!(G.mode === 'story' && G.n === 1 && !save.seenCoach)) return;
  // a clear patch: greens that touch nothing, plus two in the corner and one that slides in to make three
  setGrid(Array.from({ length:ROWS }, () => Array(COLS).fill(null)));
  const col = G.loadout[0];
  for (const [r, c] of [[4, 0], [4, 1], [4, 3], [2, 0], [1, 3], [2, 5], [4, 6], [0, 6]]) if (!graves[r][c]) grid[r][c] = newCell(col);
  save.seenFlick = true;   // the coach teaches the flick; skip the one-off banner
  G.coach = { step:'slide', t:0, move:null, stepT:0 };
  findMove(); tip('slide');
}

/** Gourd script start: a clear patch with only the gourd on it (the level's graves stay), so the fill and the hold read on their own. */
function startGourdCoach(){
  const gp = gourdPos(), gourd = grid[gp.r][gp.c], all = gourdsOn();   // every gourd stays (Release 5 may stand a second one)
  setGrid(Array.from({ length:ROWS }, () => Array(COLS).fill(null)));
  for (const o of all) grid[o.r][o.c] = o.cell;
  G.coach = { kind:'gourd', step:'gslide', t:0, stepT:0, move:null, ref:gourd, from:gp };
  findGourdMove(); tip('gslide');
}

/** The slide the hand shows: the gourd one cell right, else left. */
function findGourdMove(){
  const c = G.coach, gp = gourdPos(); c.move = null; if (!gp) return;
  const ref = grid[gp.r][gp.c];
  for (const dir of ['right', 'left', 'up', 'down']){
    const moves = planMove(gp.r, gp.c, dir);
    if (moves){ c.move = { ref, dir, tr:moves[0][2], tc:moves[0][3] }; return; }
  }
}

function gourdCoachUpdate(c){
  const gp = gourdPos(), go = step => { c.step = step; c.stepT = 0; tip(step); };
  if (c.step === 'gslide'){
    if (!gp) go('gback');   // broken before it was slid: carry on from the respawn
    else if (c.move && gp.r === c.move.tr && gp.c === c.move.tc) go('gfill');   // it reached the cell the hand showed
    else if (!c.move || !findCell(c.move.ref) || gp.r !== c.from.r || gp.c !== c.from.c){ c.from = { r:gp.r, c:gp.c }; findGourdMove(); }   // slid somewhere else: the hand shows the way again from here
  } else if (c.step === 'gfill'){
    if (!gp) go('gback');
    else if (!c.filled && c.stepT > 0.6){ c.filled = true; spawnSprouts(); }   // one real sprout tick: its first slot fills the gourd's square
    else if (c.filled && c.stepT > 3.2){ c.ref = grid[gp.r][gp.c]; go('ghold'); }
  } else if (c.step === 'ghold'){
    if (!gp) go('gback'); else c.ref = grid[gp.r][gp.c];   // any way of breaking it counts (a real hold)
  } else if (c.step === 'gback'){
    if (gp) go('praise');
    else if (c.stepT > 1.2){ c.stepT = 0.01; spawnSprouts(); }   // the next sprout tick brings it back (retried if the patch had no room)
  } else if (c.step === 'praise' && c.stepT > 3.5){
    tip(null); G.coach = null; save.seenGourdCoach = true; persist(); resolveMatches();
  }
}

/** Protector script start: a clear patch with both gourds where they stand (the level's graves stay). On the Protector's row, outside its
 *  square: a pumpkin two cells left of it with the cell between left empty (the one the hand slides in once it rots) and one more at the far
 *  edge; inside its square a ring of pumpkins in three colours (none of them bunch); two more off the row show that the fog keeps to it. */
function startProtectorCoach(){
  const pp = gourdPos('protector'), all = gourdsOn();
  setGrid(Array.from({ length:ROWS }, () => Array(COLS).fill(null)));
  for (const o of all) grid[o.r][o.c] = o.cell;
  const cols = G.loadout.filter(t => PTYPES[t] && !PTYPES[t].rainbow && PTYPES[t].key !== 'paint'), col = i => (cols.length ? cols : [0, 1, 2])[i % (cols.length || 3)];
  const put = (r, c, t) => { if (inGrid(r, c) && !grid[r][c] && !graves[r][c]) grid[r][c] = newCell(t); };
  const r = pp.r, side = pp.c - 2 >= 0 ? -1 : 1;   // which way the rest of the row lies (left from its start cell (2, 5); a Protector near the left edge mirrors it)
  put(r, pp.c + 2 * side, col(1));   // slides into the square once it rots (the cell between stays empty)
  put(r, side < 0 ? 0 : COLS - 1, col(0));
  for (const [a, b] of squareAround(pp.r, pp.c)) if (!(a === r && b === pp.c + side)) put(a, b, col((a + b) % 2 ? 1 : a === r ? 2 : 0));
  put(Math.max(0, r - 2), pp.c + 2 * side, col(2)); put(Math.min(ROWS - 1, r + 2), pp.c + 2 * side, col(0));
  G.poison.t = 1e9;   // the level's own fog waits for the script
  G.coach = { kind:'protector', step:'pshield', t:0, stepT:0, move:null, ref:null };
  poisonNow({ dir:'row', idx:[r] }); tip('pshield');
}
const inGrid = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

/** The slide the hand shows in step pslide: a rotten pumpkin outside the Protector's square that one slide puts inside it. */
function findRotMove(){
  const c = G.coach, pp = gourdPos('protector'); c.move = null; if (!pp) return;
  const inSq = (a, b) => Math.abs(a - pp.r) <= 1 && Math.abs(b - pp.c) <= 1;
  for (let r = 0; r < ROWS && !c.move; r++) for (let k = 0; k < COLS && !c.move; k++){
    const cell = grid[r][k]; if (!isRotten(cell) || cell.lit || inSq(r, k)) continue;
    for (const dir of ['right', 'left', 'up', 'down']){
      const moves = planMove(r, k, dir); if (!moves) continue;
      if (inSq(moves[0][2], moves[0][3])){ c.move = { ref:cell, dir, tr:moves[0][2], tc:moves[0][3] }; break; }
    }
  }
}
const rotInSquare = pp => squareAround(pp.r, pp.c).some(([a, b]) => isRotten(grid[a][b]));

function protectorCoachUpdate(c){
  const pp = gourdPos('protector'), p = G.poison, go = step => { c.step = step; c.stepT = 0; tip(step); };
  if (c.step !== 'praise' && p && !p.warn && !p.on) p.t = 1e9;   // the level's fog clock (restarted by a fog lifting) waits until the script ends
  if (c.step === 'pshield'){
    if (!pp) go('pback');   // broken before the lesson: carry on from the respawn
    else if (p && p.on && p.on.age > 1.0) go('prot');   // the fog has settled and the square stayed clean
    else if (p && !p.warn && !p.on && c.stepT > 0.5) poisonNow({ dir:'row', idx:[pp.r] });   // the warning was refused (a fog already running): try again
  } else if (c.step === 'prot'){
    if (!pp) go('pback');
    else if (c.stepT > 3.0){ findRotMove(); if (c.move) go('pslide'); else { c.ref = grid[pp.r][pp.c]; go('phold'); } }
  } else if (c.step === 'pslide'){
    if (!pp) go('pback');
    else if (rotInSquare(pp)){ c.move = null; c.ref = grid[pp.r][pp.c]; go('phold'); }   // a rotten one sits in its square
    else if (!c.move || !findCell(c.move.ref) || !isRotten(c.move.ref)){ findRotMove(); if (!c.move){ c.ref = grid[pp.r][pp.c]; go('phold'); } }   // slid elsewhere or crushed: show another, or move on
  } else if (c.step === 'phold'){
    if (!pp) go('pback'); else c.ref = grid[pp.r][pp.c];   // any way of breaking it counts (a real hold)
  } else if (c.step === 'pback'){
    if (pp && c.stepT > 1.5) go('praise');   // the Rainbows get a moment before the praise
    else if (!pp && c.stepT > 1.2 && !c.sprouted){ c.sprouted = true; spawnSprouts(); }   // the next sprout tick brings it back
    else if (!pp && c.sprouted && c.stepT > 2.4){ c.sprouted = false; c.stepT = 1.21; }   // no room on the patch: try the tick again
  } else if (c.step === 'praise' && c.stepT > 3.5){
    tip(null); G.coach = null; save.seenProtectorCoach = true; persist(); resolveMatches();
    if (p) p.t = G.def && G.def.poison ? G.def.poison.every : 0;   // the level's fog clock starts now
  }
}

/** Wartling script start: a clear patch with the gourds where they stand (the level's graves stay). */
function startWartlingCoach(){
  const wp = gourdPos('wartling'), all = gourdsOn();
  setGrid(Array.from({ length:ROWS }, () => Array(COLS).fill(null)));
  for (const o of all) grid[o.r][o.c] = o.cell;
  G.coach = { kind:'wartling', step:'wslide', t:0, stepT:0, move:null, ref:null, from:wp };
  findWartMove(false); tip('wslide');
}
/** The slide the hand shows: `top` the one up into the top row, else one that keeps it out of the top row (right first, as the gourd script). */
function findWartMove(top){
  const c = G.coach, wp = gourdPos('wartling'); c.move = null; if (!wp) return;
  const ref = grid[wp.r][wp.c];
  for (const dir of top ? ['up'] : ['right', 'left', 'down', 'up']){
    const moves = planMove(wp.r, wp.c, dir), mine = moves && moves.find(m => m[0] === wp.r && m[1] === wp.c);
    if (mine && (top ? mine[2] === 0 : mine[2] !== 0)){ c.move = { ref, dir, tr:mine[2], tc:mine[3] }; return; }
  }
}
/** Step wlaunch: a vertical bunch of three in a column beside the Wartling, inside its square (rows clamped to the patch), and one tough
 *  ghoul walking down that column. Its colour is the team's first plain one. */
function setupWartLaunch(wp){
  const c = G.coach, cols = G.loadout.filter(t => PTYPES[t] && !PTYPES[t].rainbow && PTYPES[t].key !== 'paint'), col = cols.length ? cols[0] : 0;
  const r0 = Math.min(ROWS - 2, Math.max(1, wp.r));
  const free = cc => cc >= 0 && cc < COLS && [r0 - 1, r0, r0 + 1].every(r => !grid[r][cc] && !graves[r][cc]);
  const cc = [wp.c - 1, wp.c + 1].find(free);
  c.bunch = [];
  if (cc != null) for (const r of [r0 - 1, r0, r0 + 1]){ const cell = newCell(col); grid[r][cc] = cell; c.bunch.push(cell); }
  resolveMatches();
  if (cc != null){ const m = spawnMonster('ghoul', cc, true, 0.08); if (m){ m.hp = m.maxHp = 20; m.sp *= 0.6; } }   // an extra, tough enough to show three doubled hits
  c.ref = c.bunch[0] || null;
}
/** Step wtop: the fences above the Wartling's square are worn, so the mend shows; the hand slides it up into the top row. */
function setupWartTop(wp){
  const c = G.coach;
  if (__RELEASE__ >= 7 && c && !c.worn) c.worn = walls.map(w => w ? w.hp : null);   // remembered, so a break outside the top row (no mend) can put the fences back
  for (let k = Math.max(0, wp.c - 1); k <= Math.min(COLS - 1, wp.c + 1); k++){ const w = walls[k]; if (w) w.hp = Math.min(w.hp, Math.round(w.max * 0.3)); }
  findWartMove(true);
}
/** Release 7: the lesson wore the fences for a mend that never came (the Wartling broke outside the top row): put them back. */
function restoreWorn(c){
  if (!c.worn) return;
  c.worn.forEach((hp, k) => { const w = walls[k]; if (w && hp != null && w.hp < hp) w.hp = hp; });
  c.worn = null;
}
function wartlingCoachUpdate(c){
  const wp = gourdPos('wartling'), go = step => { c.step = step; c.stepT = 0; tip(step); };
  const toTop = () => { if (wp.r === 0){ c.move = null; c.ref = grid[wp.r][wp.c]; setupWartTop(wp); go('whold'); } else { setupWartTop(wp); go('wtop'); } };
  if (c.step === 'wslide'){
    if (!wp) go('wback');   // broken before the lesson: carry on from the respawn
    else if (wp.r !== c.from.r || wp.c !== c.from.c){ c.move = null; setupWartLaunch(wp); go('wlaunch'); }   // any slide of it counts
    else if (!c.move || !findCell(c.move.ref)) findWartMove(false);
  } else if (c.step === 'wlaunch'){
    const lit = (c.bunch || []).find(x => x.lit && findCell(x));
    if (!wp) go('wback');
    else if (lit) c.ref = lit;   // the hand swipes the bunch up
    else if (!G.projs.length){ c.ref = null; toTop(); }   // launched (or broken up) and every pumpkin has landed
  } else if (c.step === 'wtop'){
    if (!wp){ if (__RELEASE__ >= 7) restoreWorn(c); go('wback'); }
    else if (wp.r === 0){ c.move = null; c.ref = grid[wp.r][wp.c]; go('whold'); }
    else if (!c.move || !findCell(c.move.ref) || c.move.ref !== grid[wp.r][wp.c] || !planMove(wp.r, wp.c, 'up')) findWartMove(true);   // slid somewhere else: show the way up from here
  } else if (c.step === 'whold'){
    if (!wp){ if (__RELEASE__ >= 7){ if (c.wr !== 0) restoreWorn(c); c.worn = null; } go('praise'); } else { c.wr = wp.r; c.ref = grid[wp.r][wp.c]; }   // any way of breaking it counts (a real hold)
  } else if (c.step === 'wback'){
    if (wp) toTop();
    else if (c.stepT > 1.2 && !c.sprouted){ c.sprouted = true; spawnSprouts(); }   // the next sprout tick brings it back
    else if (c.sprouted && c.stepT > 2.4){ c.sprouted = false; c.stepT = 1.21; }   // no room on the patch: try the tick again
  } else if (c.step === 'praise' && c.stepT > 3.5){
    tip(null); G.coach = null; save.seenWartlingCoach = true; persist(); resolveMatches();
  }
}

/** Crookneck script start (Release 8): a clear patch with the gourds where they stand (the level's graves stay), no nets. */
function startCrookCoach(){
  const cp = gourdPos('crookneck'), all = gourdsOn();
  setGrid(Array.from({ length:ROWS }, () => Array(COLS).fill(null)));
  for (const o of all) grid[o.r][o.c] = o.cell;
  G.netsFlying = [];
  G.coach = { kind:'crookneck', step:'cslide', t:0, stepT:0, move:null, ref:null, from:cp };
  findCrookMove(); tip('cslide');
}
/** The slide the hand shows: any way the Crookneck can go (right first, as the gourd script). */
function findCrookMove(){
  const c = G.coach, cp = gourdPos('crookneck'); c.move = null; if (!cp) return;
  for (const dir of ['right', 'left', 'down', 'up']){
    const moves = planMove(cp.r, cp.c, dir), mine = moves && moves.find(m => m[0] === cp.r && m[1] === cp.c);
    if (mine){ c.move = { ref:grid[cp.r][cp.c], dir, tr:mine[2], tc:mine[3] }; return; }
  }
}
const plainColours = () => { const cols = G.loadout.filter(t => PTYPES[t] && !PTYPES[t].rainbow && PTYPES[t].key !== 'paint'); return cols.length ? cols : [0]; };
/** Free cells (on the patch, no pumpkin, gourd or grave) at Chebyshev distance d from (r, c), two of them that do not touch. */
function twoApart(r, c, d){
  const out = [];
  for (let a = r - d; a <= r + d; a++) for (let b = c - d; b <= c + d; b++){
    if (Math.max(Math.abs(a - r), Math.abs(b - c)) !== d || a < 0 || a >= ROWS || b < 0 || b >= COLS || grid[a][b] || graves[a][b]) continue;
    if (out.length === 1 && Math.abs(out[0][0] - a) + Math.abs(out[0][1] - b) === 1) continue;   // orthogonal neighbours would bunch or box in
    out.push([a, b]); if (out.length === 2) break;
  }
  return out;
}
/** Step claunch: two pumpkins of the team's first two plain colours in the Crookneck's square, not touching: they light as one group. */
function setupCrookLaunch(cp){
  const c = G.coach, cols = plainColours();
  c.bunch = twoApart(cp.r, cp.c, 1).map(([a, b], i) => { const cell = newCell(cols[i % cols.length]); grid[a][b] = cell; return cell; });
  resolveMatches();
  c.ref = c.bunch[0] || null;
}
/** Step cnet: a pumpkin just outside the square and a net flying at it, and a net aimed inside the square that falls apart on landing. */
function setupCrookNets(cp){
  const c = G.coach, cols = plainColours(), out = twoApart(cp.r, cp.c, 2).slice(0, 1), top = (cc) => ({ x:LANE(cc), y:FIELD_TOP + 20, kind:'net', by:null, t:NET_FLY });
  for (const [a, b] of out){ grid[a][b] = newCell(cols[0]); G.netsFlying.push({ ...top(b), r:a, c:b }); }
  const inside = squareAround(cp.r, cp.c).find(([a, b]) => !grid[a][b] && !graves[a][b]);
  if (inside){ grid[inside[0]][inside[1]] = newCell(cols[cols.length > 1 ? 1 : 0]); G.netsFlying.push({ ...top(inside[1]), r:inside[0], c:inside[1] }); }
  resolveMatches();
  c.ref = null; c.netsUp = true;
}
function crookCoachUpdate(c){
  const cp = gourdPos('crookneck'), go = step => { c.step = step; c.stepT = 0; tip(step); };
  const toNets = () => { setupCrookNets(cp); go('cnet'); };
  if (c.step === 'cslide'){
    if (!cp) go('cback');   // broken before the lesson: carry on from the respawn
    else if (cp.r !== c.from.r || cp.c !== c.from.c){ c.move = null; setupCrookLaunch(cp); go('claunch'); }   // any slide of it counts
    else if (!c.move || !findCell(c.move.ref)) findCrookMove();
  } else if (c.step === 'claunch'){
    const lit = (c.bunch || []).find(x => x.lit && findCell(x));
    if (!cp) go('cback');
    else if (lit) c.ref = lit;   // the hand swipes the group up
    else if (!G.projs.length){ c.ref = null; toNets(); }   // launched (or broken up) and every pumpkin has landed
  } else if (c.step === 'cnet'){
    if (!cp) go('cback');
    else if (!(G.netsFlying || []).length){ c.ref = grid[cp.r][cp.c]; go('chold'); }   // the nets have landed (or fallen apart)
  } else if (c.step === 'chold'){
    if (!cp) go('praise'); else c.ref = grid[cp.r][cp.c];   // any way of breaking it counts (a real hold)
  } else if (c.step === 'cback'){
    if (cp) toNets();
    else if (c.stepT > 1.2 && !c.sprouted){ c.sprouted = true; spawnSprouts(); }   // the next sprout tick brings it back
    else if (c.sprouted && c.stepT > 2.4){ c.sprouted = false; c.stepT = 1.21; }   // no room on the patch: try the tick again
  } else if (c.step === 'praise' && c.stepT > 3.5){
    tip(null); G.coach = null; save.seenCrookneckCoach = true; persist(); resolveMatches();
  }
}

/** Swan script start (Release 9): a clear patch with the gourds where they stand (the level's graves stay). */
function startSwanCoach(){
  const sp = gourdPos('swan'), all = gourdsOn();
  setGrid(Array.from({ length:ROWS }, () => Array(COLS).fill(null)));
  for (const o of all) grid[o.r][o.c] = o.cell;
  G.coach = { kind:'swan', step:'sslide', t:0, stepT:0, move:null, ref:null, from:sp };
  findSwanMove(); tip('sslide');
}
/** The slide the hand shows: any way the Swan can go (right first, as the gourd script). */
function findSwanMove(){
  const c = G.coach, sp = gourdPos('swan'); c.move = null; if (!sp) return;
  for (const dir of ['right', 'left', 'down', 'up']){
    const moves = planMove(sp.r, sp.c, dir), mine = moves && moves.find(m => m[0] === sp.r && m[1] === sp.c);
    if (mine){ c.move = { ref:grid[sp.r][sp.c], dir, tr:mine[2], tc:mine[3] }; return; }
  }
}
/** Step slaunch: a vertical bunch of three in a column beside the Swan, inside its square, and two tough ghouls walking down that column and the
 *  next one in (so one is hit by the pumpkins and the other is beside the hit). The bunch's colour is the team's first plain one. */
function setupSwanLaunch(sp){
  const c = G.coach, col = plainColours()[0];
  const r0 = Math.min(ROWS - 2, Math.max(1, sp.r));
  const free = cc => cc >= 0 && cc < COLS && [r0 - 1, r0, r0 + 1].every(r => !grid[r][cc] && !graves[r][cc]);
  const cc = [sp.c - 1, sp.c + 1].find(free);
  c.bunch = [];
  if (cc != null) for (const r of [r0 - 1, r0, r0 + 1]){ const cell = newCell(col); grid[r][cc] = cell; c.bunch.push(cell); }
  resolveMatches();
  if (cc != null) for (const lane of [cc, cc > 0 ? cc - 1 : cc + 1]){ const m = spawnMonster('ghoul', lane, true, 0.08); if (m){ m.hp = m.maxHp = 20; m.sp *= 0.6; } }   // tough enough to show three hits and three ring hits
  c.ref = c.bunch[0] || null;
}
function swanCoachUpdate(c){
  const sp = gourdPos('swan'), go = step => { c.step = step; c.stepT = 0; tip(step); };
  const toLaunch = () => { setupSwanLaunch(sp); go('slaunch'); };
  if (c.step === 'sslide'){
    if (!sp) go('sback');   // broken before the lesson: carry on from the respawn
    else if (sp.r !== c.from.r || sp.c !== c.from.c){ c.move = null; toLaunch(); }   // any slide of it counts
    else if (!c.move || !findCell(c.move.ref)) findSwanMove();
  } else if (c.step === 'slaunch'){
    const lit = (c.bunch || []).find(x => x.lit && findCell(x));
    if (!sp) go('sback');
    else if (lit) c.ref = lit;   // the hand swipes the bunch up
    else if (!G.projs.length){ c.ref = grid[sp.r][sp.c]; go('shold'); }   // launched (or broken up) and every pumpkin has landed
  } else if (c.step === 'shold'){
    if (!sp) go('praise'); else c.ref = grid[sp.r][sp.c];   // any way of breaking it counts (a real hold)
  } else if (c.step === 'sback'){
    if (sp) toLaunch();
    else if (c.stepT > 1.2 && !c.sprouted){ c.sprouted = true; spawnSprouts(); }   // the next sprout tick brings it back
    else if (c.sprouted && c.stepT > 2.4){ c.sprouted = false; c.stepT = 1.21; }   // no room on the patch: try the tick again
  } else if (c.step === 'praise' && c.stepT > 3.5){
    tip(null); G.coach = null; save.seenSwanCoach = true; persist(); resolveMatches();
  }
}

/** A slide that makes a bunch right now: the hand demonstrates this one. */
function findMove(){
  const c = G.coach; c.move = null;
  for (let r = 0; r < ROWS && !c.move; r++) for (let k = 0; k < COLS && !c.move; k++){
    const cell = grid[r][k]; if (!cell || cell.lit || cell.fly) continue;
    for (const dir of ['left', 'right', 'up', 'down']){
      const moves = planMove(r, k, dir); if (!moves) continue;
      const [, , tr, tc] = moves[0], cells = applyMove(moves, false);
      const ok = sameColorSize(grid, tr, tc) >= 3;
      revertMove(moves, cells);
      if (ok){ c.move = { ref:cell, dir, tr, tc }; break; }
    }
  }
}

/** The pumpkin the hand crushes: an unlit one, as low and central as possible. */
function spare(){
  let best = null, bs = -1e9;
  for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++){ const x = grid[r][k]; if (!x || x.lit || x.fly) continue; const s = r * 10 - Math.abs(k - 3); if (s > bs){ bs = s; best = x; } }
  return best;
}

function tip(step){
  const el = $('#coachTip'); if (!el) return;
  if (!step){ el.hidden = true; return; }
  el.innerHTML = (__RELEASE__ >= 9 && G.coach && G.coach.kind === 'swan' && STIPS[step]) || (__RELEASE__ >= 8 && G.coach && G.coach.kind === 'crookneck' && CTIPS[step]) || (__RELEASE__ >= 7 && G.coach && G.coach.kind === 'wartling' && WTIPS[step]) || (__RELEASE__ >= 5 && G.coach && G.coach.kind === 'protector' && PTIPS[step]) || TIPS[step] || GTIPS[step]; el.hidden = false;
  el.style.top = Math.round((FENCE_Y - CS * 1.25) * scale) + 'px';
}

export const coachHolds = () => !!(G && G.coach && G.coach.step !== 'praise');   // monsters and sprouts wait while the coach is teaching

/** Called every frame from the game update. */
export function coachUpdate(dt){
  const c = G && G.coach; if (!c || G.over) return;
  c.t += dt; c.stepT += dt;
  if (__RELEASE__ >= 4 && c.kind === 'gourd'){ gourdCoachUpdate(c); return; }
  if (__RELEASE__ >= 5 && c.kind === 'protector'){ protectorCoachUpdate(c); return; }
  if (__RELEASE__ >= 7 && c.kind === 'wartling'){ wartlingCoachUpdate(c); return; }
  if (__RELEASE__ >= 8 && c.kind === 'crookneck'){ crookCoachUpdate(c); return; }
  if (__RELEASE__ >= 9 && c.kind === 'swan'){ swanCoachUpdate(c); return; }
  const lit = bestLitGroup();
  if (c.step === 'slide'){
    if (lit){   // a bunch formed: send one ghoul down its column
      const pos = findCell(lit), lane = pos ? pos.c : 3;
      spawnMonster('ghoul', lane, false, 0.08); G.spawned++;
      c.step = 'flick'; c.stepT = 0; c.ref = lit; tip('flick');
    } else if (!c.move || !findCell(c.move.ref)) findMove();
  } else if (c.step === 'flick'){
    if (!lit && G.projs.length === 0 && c.stepT > 0.2){ c.ref = spare(); c.smash0 = G.smashes || 0; c.stepT = 0; if (c.ref){ c.step = 'smash'; tip('smash'); } else { c.step = 'praise'; tip('praise'); } }
    else if (lit) c.ref = lit;
  } else if (c.step === 'smash'){
    if ((G.smashes || 0) > c.smash0){ c.step = 'praise'; c.stepT = 0; tip('praise'); }
    else if (!c.ref || !findCell(c.ref) || c.ref.lit){ c.ref = spare(); if (!c.ref){ c.step = 'praise'; c.stepT = 0; tip('praise'); } }
  } else if (c.step === 'praise' && c.stepT > 3.5){
    tip(null); G.coach = null; save.seenCoach = true; persist(); resolveMatches();
  }
}
export function coachEnd(){ tip(null); }   // leaving the night hides the tip

// ---------- drawing ----------
let handSprite = null;
function hand(){
  if (handSprite) return handSprite;
  const c = document.createElement('canvas'), S = 64; c.width = c.height = S * 2; const g = c.getContext('2d'); g.scale(2, 2);
  g.translate(18, 6);   // the fingertip sits at (18, 6) in the sprite
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(14, 40, 16, 20, -.3, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff4e6'; g.strokeStyle = '#3a2418'; g.lineWidth = 2.2; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(-4, 4); g.quadraticCurveTo(-4, -4, 2, -4); g.quadraticCurveTo(8, -4, 8, 4); g.lineTo(8, 20);   // pointing finger
  g.quadraticCurveTo(10, 15, 15, 16); g.quadraticCurveTo(20, 17, 20, 23);   // knuckles
  g.quadraticCurveTo(24, 20, 28, 23); g.quadraticCurveTo(31, 26, 30, 32);
  g.quadraticCurveTo(33, 31, 35, 35); g.quadraticCurveTo(36, 46, 30, 54); g.quadraticCurveTo(22, 62, 8, 58);
  g.quadraticCurveTo(-6, 52, -10, 38); g.quadraticCurveTo(-13, 30, -6, 30); g.quadraticCurveTo(-3, 31, -4, 36);
  g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(58,36,24,.5)'; g.lineWidth = 1.4;
  for (const [x1, y1, x2, y2] of [[20, 23, 20, 30], [30, 32, 29, 38]]){ g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  handSprite = c; return c;
}
const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const cellXY = (r, c) => [GX + c * CS + CS / 2, GY + r * CS + CS / 2];

export function drawCoach(ctx){
  const c = G && G.coach; if (!c || G.over) return;
  const h = hand();
  const blit = (x, y, s, a) => { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.drawImage(h, -18, -6, 64, 64); ctx.restore(); };
  if ((c.step === 'slide' || c.step === 'gslide' || c.step === 'pslide' || c.step === 'wslide' || c.step === 'wtop' || c.step === 'cslide' || c.step === 'sslide') && c.move){
    const pos = findCell(c.move.ref); if (!pos) return;
    const [x0, y0] = cellXY(pos.r, pos.c), [x1, y1] = cellXY(c.move.tr, c.move.tc);
    const P = 2.0, u = (c.t % P) / P;   // press 0-.2, drag .2-.65, hold .65-.85, fade .85-1
    const d = u < .2 ? 0 : u < .65 ? ease((u - .2) / .45) : 1;
    const x = x0 + (x1 - x0) * d, y = y0 + (y1 - y0) * d, press = u < .2 ? 1 - u * .6 : u < .65 ? .88 : 1;
    ctx.save(); ctx.globalAlpha = .55 + .35 * Math.sin(c.t * 6); ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = 3;
    ctx.strokeRect(GX + pos.c * CS + 5, GY + pos.r * CS + 5, CS - 10, CS - 10);
    ctx.setLineDash([6, 6]); ctx.strokeRect(GX + c.move.tc * CS + 5, GY + c.move.tr * CS + 5, CS - 10, CS - 10); ctx.restore();
    blit(x + 6, y + 4, press, u > .85 ? (1 - u) / .15 : 1);
  } else if (c.step === 'smash' || c.step === 'ghold' || c.step === 'phold' || c.step === 'whold' || c.step === 'chold' || c.step === 'shold'){
    const pos = c.ref && findCell(c.ref); if (!pos) return;
    const [x0, y0] = cellXY(pos.r, pos.c), P = 2.2, u = (c.t % P) / P;   // press .0-.1, hold and fill .1-.7, crush flash .7-.85, rest
    const f = u < .1 ? 0 : u < .7 ? (u - .1) / .6 : 1;
    ctx.save(); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(x0, y0, CS * .44, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = f > .85 ? '#ff5a4d' : '#ffb04a'; ctx.beginPath(); ctx.arc(x0, y0, CS * .44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); ctx.stroke();
    if (u >= .7 && u < .85){ const k = (u - .7) / .15; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x0, y0, CS * (.45 + k * .35), 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    blit(x0 + 6, y0 + 4, u < .7 ? .88 : 1, u > .85 ? Math.max(0, (1 - u) / .15) : 1);
  } else if (c.step === 'flick' || c.step === 'wlaunch' || c.step === 'claunch' || c.step === 'slaunch'){
    const pos = c.ref && findCell(c.ref); if (!pos) return;
    const [x0, y0] = cellXY(pos.r, pos.c), P = 1.4, u = (c.t % P) / P;
    const d = u < .25 ? 0 : u < .6 ? ease((u - .25) / .35) : 1, y = y0 - d * CS * 1.6;
    ctx.save();   // a dashed arrow up the column to the ghoul
    ctx.globalAlpha = .5 + .3 * Math.sin(c.t * 5); ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = 4; ctx.setLineDash([10, 10]); ctx.lineDashOffset = -c.t * 40;
    ctx.beginPath(); ctx.moveTo(x0, y0 - CS * .6); ctx.lineTo(x0, FIELD_TOP + 40); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.moveTo(x0, FIELD_TOP + 18); ctx.lineTo(x0 - 14, FIELD_TOP + 42); ctx.lineTo(x0 + 14, FIELD_TOP + 42); ctx.closePath(); ctx.fill();
    ctx.restore();
    blit(x0 + 6, y + 4, u < .25 ? .9 : 1, u > .8 ? (1 - u) / .2 : 1);
  }
}
