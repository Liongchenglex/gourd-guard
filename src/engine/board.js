import { perkOn } from '../data/perks.js';
import { PATTERNS } from '../data/patterns.js';
import { SPROUT_COUNT, CROOK_MIN } from '../data/rules.js';
import { GEAR } from '../data/shop.js';
import { PTYPES, RAINBOW, WILD_CHANCE, WILD_CHANCE_PERK, TURQUOISE, BROWN, BROWN_GROW, PAINT, PAINT_PULL } from '../data/pumpkins.js';
import { SFX } from './audio.js';
import { addFloat, chunk, dropHop, spark } from './combat.js';
import { COLS, CS, G, GX, GY, LANE, ROWS, gest, graves, grid, nextGid, setGraves, setGrid } from './state.js';
import { clamp, shuffle } from './util.js';
import { persist, save, lvOf } from '../save.js';
import { addChest } from './loot.js';
import { banner, updateHud } from '../ui/hud.js';
import { destroyGourd, gourdSlot, gourdsBack } from './gourd.js';
import { ROTTEN, ROT_FX } from './rot.js';

export function newCell(c){ return { c, lit:false, gids:[], bsize:0, ox:0, oy:0, pop:0, grow:1, fly:0, wig:0, t:Math.random() * 10, age:0 }; }
/** Smallest bunch that lights up for a colour: Turquoise launches at 2, everything else at 3. */
export const minBunch = colour => colour === TURQUOISE ? 2 : 3;
/** Brown pumpkin growth stage from time on the patch: 0 small, 1 medium, 2 big (timings by Brown's level). */
export function brownSize(cell){
  const [full, step] = BROWN_GROW[lvOf(BROWN) - 1];
  return cell.age >= full ? 2 : cell.age >= step ? 1 : 0;
}

export function randColor(){ const L = G && G.loadout ? G.loadout : [0, 1]; return L[Math.floor(Math.random() * L.length)]; }

export function randSprout(){ if (G.mode === 'story' && G.n < 9) return randColor();   // rainbows first appear at 1-9, with their intro card (owner)
  return Math.random() < (perkOn('rainbow') ? WILD_CHANCE_PERK : WILD_CHANCE) ? RAINBOW : randColor(); }

export const inside = (a, b) => a >= 0 && a < ROWS && b >= 0 && b < COLS;

export const blocked = (a, b) => !inside(a, b) || !!grid[a][b] || !!graves[a][b];   // a pinned pumpkin (a Hayrick's pitchfork, Release 4) is a cell too, so it blocks like a grave; planMove refuses to move it or push it

export function sameColorSize(gr, r0, c0){
  const col = gr[r0][c0].c, seen = new Set([r0 * COLS + c0]), q = [[r0, c0]];
  while (q.length){
    const [r, c] = q.pop();
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const a = r + dr, b = c + dc, k = a * COLS + b;
      if (!inside(a, b) || seen.has(k)) continue;
      const cell = gr[a][b];
      if (cell && !cell.fly && cell.c === col){ seen.add(k); q.push([a, b]); }
    }
  }
  return seen.size;
}

export function initBoard(pi, nGraves){
  const pat = PATTERNS[pi];
  setGrid(Array.from({ length:ROWS }, () => Array(COLS).fill(null)));
  setGraves(Array.from({ length:ROWS }, () => Array(COLS).fill(false)));
  const L = G.loadout;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    if (pat[r][c] !== 'X') continue;
    for (const col of shuffle(L.slice())){
      grid[r][c] = newCell(col);
      if (sameColorSize(grid, r, c) < minBunch(col)) break;
    }
  }
  const spots = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (pat[r][c] !== 'X') spots.push([r, c]);
  for (const [r, c] of shuffle(spots).slice(0, nGraves)) graves[r][c] = true;
}

// Bunches: 3+ touching pumpkins of one color. Rainbows count as any color, except rotten (Release 5): rotten bunches with rotten only.
// Release 8 (spec Part 5): the pumpkins in a Crookneck Gourd's 3×3 also make one group of any colour, CROOK, when there are CROOK_MIN or more;
// a pumpkin may be in that group and a bunch at once (launchGids below sends them together).

/** The Crookneck group's pseudo-colour (Release 8): no pumpkin has it; each cell of the group flies as itself (combat.js launchGroup). */
export const CROOK = -3;

export function computeGroups(gr){
  const groups = [], present = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ const x = gr[r][c]; if (x && !x.fly && x.c !== RAINBOW && !(__RELEASE__ >= 4 && x.gourd)) present.add(x.c); }   // the Grave Gourd (Release 4) has no colour: it never starts or joins a bunch
  const used = new Set();
  for (const k of present){
    const seen = new Set();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
      const s = gr[r][c];
      if (!s || s.fly || s.c !== k || seen.has(r * COLS + c)) continue;
      const cells = [], q = [[r, c]]; seen.add(r * COLS + c);
      while (q.length){
        const [a, b] = q.pop(); cells.push([a, b]);
        for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const na = a + dr, nb = b + dc, key = na * COLS + nb;
          if (!inside(na, nb) || seen.has(key)) continue;
          const n = gr[na][nb];
          if (n && !n.fly && !(__RELEASE__ >= 4 && n.gourd) && (n.c === k || (n.c === RAINBOW && !(__RELEASE__ >= 5 && k === ROTTEN)))){ seen.add(key); q.push([na, nb]); }   // a Rainbow never joins a rotten bunch (Release 5)
        }
      }
      if (cells.length >= minBunch(k)){ groups.push({ color:k, cells }); cells.forEach(([a, b]) => used.add(a * COLS + b)); }
    }
  }
  const seenR = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const s = gr[r][c];
    if (!s || s.fly || s.c !== RAINBOW || seenR.has(r * COLS + c)) continue;
    const cells = [], q = [[r, c]]; seenR.add(r * COLS + c);
    while (q.length){
      const [a, b] = q.pop(); cells.push([a, b]);
      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const na = a + dr, nb = b + dc, key = na * COLS + nb;
        if (!inside(na, nb) || seenR.has(key)) continue;
        const n = gr[na][nb];
        if (n && !n.fly && n.c === RAINBOW && !(__RELEASE__ >= 4 && n.gourd)){ seenR.add(key); q.push([na, nb]); }
      }
    }
    if (cells.length >= 3 && !cells.some(([a, b]) => used.has(a * COLS + b))) groups.push({ color:0, cells });
  }
  if (__RELEASE__ >= 8) crookGroups(gr, groups);
  return groups;
}

/** Release 8: for each Crookneck Gourd standing on `gr`, the pumpkins in its 3×3 that are not flying (gourds left out, and rotten ones: rot
 *  bunches with rot only, our call), as one group when there are at least CROOK_MIN. */
function crookGroups(gr, groups){
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const g = gr[r][c]; if (!g || g.gourd !== 'crookneck' || g.fly > 0) continue;
    const cells = [];
    for (let a = Math.max(0, r - 1); a <= Math.min(ROWS - 1, r + 1); a++) for (let b = Math.max(0, c - 1); b <= Math.min(COLS - 1, c + 1); b++){
      const n = gr[a][b]; if (n && !n.fly && !n.gourd && !(__RELEASE__ >= 5 && n.c === ROTTEN)) cells.push([a, b]);
    }
    if (cells.length >= CROOK_MIN) groups.push({ color:CROOK, cells, crook:true });
  }
}

export function resolveMatches(){
  const groups = computeGroups(grid);
  const was = new Map();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const cell = grid[r][c]; if (!cell) continue;
    was.set(cell, cell.lit ? cell.bsize : 0);
    cell.lit = false; cell.gids = []; cell.bsize = 0;
  }
  G.groups = {};
  let sx = 0, sy = 0, n = 0, biggest = 0, fresh = 0;
  for (const g of groups){
    const gid = nextGid(), size = g.cells.length;
    G.groups[gid] = { color:g.color, size, ...(__RELEASE__ >= 8 && g.crook ? { crook:true } : {}) };
    let changed = false;
    for (const [r, c] of g.cells){
      const cell = grid[r][c], before = was.get(cell) || 0;
      cell.lit = true; cell.gids.push(gid); cell.bsize = Math.max(cell.bsize, size);
      if (before < size){
        changed = true; cell.pop = 1;
        const x = LANE(c), y = GY + r * CS + CS / 2;
        sx += x; sy += y; n++;
        for (let i = 0; i < 5; i++) spark(x, y, __RELEASE__ >= 5 && cell.c === ROTTEN ? ROT_FX.spark : PTYPES[cell.c].spark, 150);
      }
    }
    if (changed){ fresh++; biggest = Math.max(biggest, size); }
  }
  if (fresh){
    SFX.match(biggest, fresh);
    const txt = fresh > 1 ? `Combo ×${fresh}` : biggest >= 5 ? 'Knockback bunch!' : '';
    if (txt) addFloat(txt, sx / n, sy / n - 20, '#ffd35a', 24, 1.1);
    if (G.mode === 'story' && !save.seenFlick){
      save.seenFlick = true; persist();
      banner('Flick it!', 'Flick a lit pumpkin upward, or tap it, to launch the whole bunch.', 3.2);
    }
  }
  return fresh;
}

export const DIRV = { left:[0,-1], right:[0,1], up:[-1,0], down:[1,0] };

export function slideDest(r, c, dir){
  const [dr, dc] = DIRV[dir];
  while (!blocked(r + dr, c + dc)){ r += dr; c += dc; }
  return [r, c];
}

// A move is a list of [fromRow, fromCol, toRow, toCol]. Returns null if nothing can move.

export function planMove(r, c, dir){
  const [dr, dc] = DIRV[dir];
  if (!inside(r + dr, c + dc) || graves[r + dr][c + dc]) return null;
  if (__RELEASE__ >= 4 && grid[r][c] && grid[r][c].pinned > 0) return null;   // pinned by a Hayrick's pitchfork: it cannot slide
  if (__RELEASE__ >= 8 && grid[r][c] && grid[r][c].net) return null;   // netted (Release 8, engine/nets.js): it cannot slide
  if (!grid[r + dr][c + dc]){ const [tr, tc] = slideDest(r, c, dir); return [[r, c, tr, tc]]; }
  const line = [[r, c]];
  let a = r + dr, b = c + dc;
  while (inside(a, b) && grid[a][b]){
    if (__RELEASE__ >= 4 && grid[a][b].pinned > 0) return null;   // a pinned pumpkin in the line cannot be pushed, so nothing in the line moves (as with a grave at its end)
    if (__RELEASE__ >= 8 && grid[a][b].net) return null;   // nor can a netted one (Release 8)
    line.push([a, b]); a += dr; b += dc;
  }
  let k = 0;
  while (!blocked(a, b)){ k++; a += dr; b += dc; }
  if (!k) return null;
  return line.map(([x, y]) => [x, y, x + dr * k, y + dc * k]);
}

export function applyMove(moves, animate){
  const cells = moves.map(([a, b]) => grid[a][b]);
  for (const [a, b] of moves) grid[a][b] = null;
  moves.forEach(([a, b, x, y], i) => {
    grid[x][y] = cells[i];
    if (animate){ cells[i].ox += (b - y) * CS; cells[i].oy += (a - x) * CS; }
  });
  return cells;
}

export function revertMove(moves, cells){
  for (const [, , x, y] of moves) grid[x][y] = null;
  moves.forEach(([a, b], i) => { grid[a][b] = cells[i]; });
}

export function slideOne(ref, dir){
  if (!G || G.over) return false;
  const pos = findCell(ref); if (!pos) return false;
  G.idle = 0; G.hint = null;
  const moves = planMove(pos.r, pos.c, dir);
  if (!moves){ const [dr, dc] = DIRV[dir]; ref.ox += dc * 7; ref.oy += dr * 7; SFX.bad(); return false; }
  applyMove(moves, true);
  if (moves.length > 1) SFX.push(); else SFX.slide();
  resolveMatches();
  return true;
}

export function emptyCells(){ const out = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!grid[r][c] && !graves[r][c]) out.push([r, c]); return out; }

export function flyInto(r, c, color, fromX, fromY){
  const cell = newCell(color);
  cell.fly = 0.55; cell.ox = fromX - LANE(c); cell.oy = fromY - (GY + r * CS + CS / 2);
  grid[r][c] = cell;
  return cell;
}

export function spawnPumpkin(){
  const empties = emptyCells();
  if (!empties.length) return false;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const cell = newCell(randSprout()); cell.grow = 0;
  grid[r][c] = cell;
  for (let i = 0; i < 6; i++) spark(LANE(c), GY + r * CS + CS / 2, '#a6f06a', 90);
  resolveMatches();
  return true;
}

/** One sprout tick: SPROUT_COUNT pumpkins in separate random empty cells; fewer if the patch runs out. */
export function spawnSprouts(){
  let placed = 0;
  const n = SPROUT_COUNT + (perkOn('triple') && Math.random() < 0.5 ? 1 : 0);   // 3-20 perk: half the sprouts bring three
  if (__RELEASE__ >= 5 && G.def && G.def.gourd) placed += gourdsBack();   // a broken Protector Gourd comes back first, in no slot (Release 5)
  for (let i = 0; i < n; i++){
    if (__RELEASE__ >= 4 && i === 0 && G.def && G.def.gourd && (G.gourdKinds || ['grave']).includes('grave')){ placed += gourdSlot(spawnPumpkin); continue; }   // the Grave Gourd's slot: it comes back if destroyed, else fills its 3×3, else one normal sprout
    if (spawnPumpkin()) placed++;
  }
  if (placed) SFX.sprout(placed);   // one soft pop per pumpkin that came in
  return placed > 0;
}
export function landingCell(x){
  const c0 = clamp(Math.floor((x - GX) / CS), 0, COLS - 1);
  for (let d = 0; d < COLS; d++){
    for (const c of d ? [c0 - d, c0 + d] : [c0]){
      if (c < 0 || c >= COLS) continue;
      for (let r = 0; r < ROWS; r++) if (!grid[r][c] && !graves[r][c]) return [r, c];
    }
  }
  return null;
}

/** Empty cell orthogonally next to a pumpkin of `colour` (or a rainbow), closest to x; falls back to landingCell. */
export function landingNear(x, colour){
  const c0 = clamp(Math.floor((x - GX) / CS), 0, COLS - 1);
  let best = null, bd = Infinity;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    if (grid[r][c] || graves[r][c]) continue;
    const near = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(([a, b]) => inside(a, b) && grid[a][b] && !grid[a][b].fly && !(__RELEASE__ >= 4 && grid[a][b].gourd) && (grid[a][b].c === colour || ((grid[a][b].c === RAINBOW || colour === RAINBOW) && !(__RELEASE__ >= 5 && grid[a][b].c === ROTTEN))));   // a Rainbow is no match for a rotten one (Release 5)
    if (!near) continue;
    const d = Math.abs(c - c0) * 10 + (ROWS - r);
    if (d < bd){ bd = d; best = [r, c]; }
  }
  return best || landingCell(x);
}
export function collectDrop(d){
  if (!d || d.dead) return false;
  if (d.kind === 'chest'){   // a treasure chest tapped on the field (owner, 2026-09-27)
    addChest('normal'); d.dead = true;
    addFloat('Treasure chest!', d.x, d.y - 40, '#ffd35a', 19, 1.2); if (G.vfx) G.vfx.push({ kind:'loot', item:'chest', x:d.x, y:d.y - 10, t:0, dur:1.4 });
    SFX.collect(); return true;
  }
  if (d.kind === 'weapon'){
    const gear = GEAR.find(g => g.key === d.item);
    save[d.item] = Math.min(gear.max, (save[d.item] || 0) + 1); persist();
    d.dead = true;
    addFloat(`+1 ${gear.name}`, d.x, d.y - 34, '#ffd35a', 18, 1);
    SFX.collect(); updateHud(true);
    return true;
  }
  const spot = landingCell(d.x);
  if (!spot){ addFloat('Patch is full', d.x, d.y - 34, '#ffd35a', 18, 1); SFX.bad(); return false; }
  flyInto(spot[0], spot[1], d.c, d.x, d.y - dropHop(d));
  d.dead = true;
  SFX.collect();
  return true;
}

export function smash(ref){
  if (__RELEASE__ >= 4 && ref && ref.gourd){ destroyGourd(ref); return; }   // holding a gourd breaks it (the Grave clears the graves around it)
  if (__RELEASE__ >= 8 && ref && ref.net){ const p = findCell(ref); if (p) addFloat('Netted', LANE(p.c), GY + p.r * CS + CS / 2 - 30, '#ffd35a', 16, 0.8); SFX.bad(); return; }   // a net holds it: it cannot be crushed (Release 8)
  const pos = findCell(ref); if (!pos) return;
  grid[pos.r][pos.c] = null; G.smashes = (G.smashes || 0) + 1;   // counted for the 1-1 coach
  const x = LANE(pos.c), y = GY + pos.r * CS + CS / 2;
  for (let i = 0; i < 14; i++) chunk(x, y, ref.c === RAINBOW ? '#f0a020' : __RELEASE__ >= 5 && ref.c === ROTTEN ? ROT_FX.base : PTYPES[ref.c].base, 200);
  SFX.smash();
  resolveMatches();
}

export function findCell(ref){
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === ref) return { r, c };
  return null;
}

export function laneThreat(){
  const t = Array(COLS).fill(0);
  if (!G) return t;
  for (const m of G.monsters) if (!m.dead) for (let c = 0; c < COLS; c++) if (Math.abs(m.x - LANE(c)) < m.hw) t[c] = Math.max(t[c], 1 + m.p);
  return t;
}

export function boardScore(gr, threat){
  let sc = 0;
  for (const g of computeGroups(gr)) for (const [, c] of g.cells) sc += 1 + threat[c] * 2;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const a = gr[r][c]; if (!a || (__RELEASE__ >= 4 && a.gourd)) continue;
    const same = b => b && !(__RELEASE__ >= 4 && b.gourd) && (b.c === a.c || ((b.c === RAINBOW || a.c === RAINBOW) && !(__RELEASE__ >= 5 && (a.c === ROTTEN || b.c === ROTTEN))));   // rotten pairs only with rotten (Release 5)
    if (c + 1 < COLS && same(gr[r][c + 1])) sc += 0.2;
    if (r + 1 < ROWS && same(gr[r + 1][c])) sc += 0.2;
  }
  return sc;
}

export function bestMove(){
  const threat = laneThreat(), base = boardScore(grid, threat);
  let best = null, bs = base + 0.05;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const cell = grid[r][c]; if (!cell || cell.fly) continue;
    if (__RELEASE__ >= 4 && cell.pinned > 0) continue;   // pinned: it cannot be slid
    if (__RELEASE__ >= 8 && cell.net) continue;   // netted: it cannot be slid (Release 8)
    if (__RELEASE__ >= 4 && cell.gourd) continue;   // the Grave Gourd never makes a bunch, so the hint never slides it
    for (const dir of ['up', 'left', 'right', 'down']){
      if (cell.lit && dir === 'up') continue;
      const moves = planMove(r, c, dir); if (!moves) continue;
      const cells = applyMove(moves, false);
      const sc = boardScore(grid, threat) - (moves.length > 1 ? 0.1 : 0);
      revertMove(moves, cells);
      if (sc > bs){ bs = sc; best = { ref:cell, dir }; }
    }
  }
  return best;
}

export function primaryGid(ref){
  if (!ref || !ref.lit || !ref.gids.length || !G.groups) return null;
  let gid = ref.gids[0];
  for (const g of ref.gids) if (G.groups[g] && G.groups[gid] && G.groups[g].size > G.groups[gid].size) gid = g;
  return gid;
}

/** The groups one flick sends (Release 8, spec Part 5): the primary group and, one step out, every Crookneck group sharing a cell with it (a
 *  bunch pulls in the square it reaches into) or, for a Crookneck group, every bunch sharing a cell with it. Just [gid] otherwise. */
export function launchGids(gid){
  const out = [gid], grp = G.groups && G.groups[gid]; if (!(__RELEASE__ >= 8) || !grp) return out;
  for (const { cell } of groupCells(gid)) for (const g of cell.gids) if (!out.includes(g) && G.groups[g] && (grp.crook || G.groups[g].crook)) out.push(g);
  return out;
}

export function groupCells(gid){
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ const cell = grid[r][c]; if (cell && cell.lit && cell.gids.includes(gid)) out.push({ r, c, cell }); }
  return out;
}

/** Paint (owner, 2026-10-08/09): the touching pumpkins a lit Paint bunch borrows when it launches. Any colour, even one that
 *  is lit in its own bunch (only the touching ones come; owner 2026-10-09); most threatened columns first, up to PAINT_PULL[level]. */
export function paintPull(gid){
  const grp = G.groups && G.groups[gid]; if (!grp || grp.color !== PAINT) return [];
  const own = groupCells(gid), mine = new Set(own.map(o => o.cell)), seen = new Set(), out = [];
  for (const { r, c } of own) for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const a = r + dr, b = c + dc; if (a < 0 || a >= ROWS || b < 0 || b >= COLS) continue;
    const n = grid[a][b]; if (!n || n.fly || mine.has(n) || seen.has(n) || (__RELEASE__ >= 4 && n.gourd) || (__RELEASE__ >= 5 && n.c === ROTTEN)) continue;   // Paint never pulls a gourd, nor a rotten pumpkin (Release 5)
    seen.add(n); out.push({ r:a, c:b, cell:n });
  }
  const threat = laneThreat(), cap = PAINT_PULL[lvOf(PAINT) - 1];
  return out.sort((x, y) => threat[y.c] - threat[x.c] || y.r - x.r).slice(0, cap);
}

/** Paint (owner, 2026-10-09): the colour a Paint bunch inherits from the pumpkins it borrows: the most common one; on a tie,
 *  the colour sitting in the most threatened column. Rainbows and other Paint do not count. Null = it stays plain Paint. */
export function paintInherit(pulled){
  const threat = laneThreat(), tally = new Map();
  for (const { c, cell } of pulled){ if (cell.c === RAINBOW || cell.c === PAINT) continue; const t = tally.get(cell.c) || { n:0, th:-1 }; t.n++; t.th = Math.max(t.th, threat[c]); tally.set(cell.c, t); }
  let best = null, bn = 0, bt = -1;
  for (const [col, t] of tally) if (t.n > bn || (t.n === bn && t.th > bt)){ best = col; bn = t.n; bt = t.th; }
  return best;
}

/** The lit bunch with the most threatened cells. `avoid(lane) -> boolean` (the balance bot, Release 4): bunches with a cell in an avoided lane are skipped. */
export function bestLitGroup(avoid){
  if (!G.groups) return null;
  const threat = laneThreat();
  let best = null, bs = -1;
  for (const gid of Object.keys(G.groups)){
    const cells = groupCells(+gid); if (!cells.length) continue;
    if (avoid && cells.some(o => avoid(o.c))) continue;
    const s = cells.reduce((a, o) => a + threat[o.c], 0);
    if (s > bs){ bs = s; best = (cells.find(o => o.cell.c !== RAINBOW) || cells[0]).cell; }
  }
  return best;
}

export function heldGid(){ return gest && !gest.done && gest.ref && gest.ref.lit ? primaryGid(gest.ref) : null; }
