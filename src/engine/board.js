import { PATTERNS } from '../data/patterns.js';
import { SPROUT_COUNT } from '../data/rules.js';
import { GEAR } from '../data/shop.js';
import { PTYPES, RAINBOW, WILD_CHANCE } from '../data/pumpkins.js';
import { SFX } from './audio.js';
import { addFloat, chunk, dropHop, spark } from './combat.js';
import { COLS, CS, G, GX, GY, LANE, ROWS, gest, graves, grid, nextGid, setGraves, setGrid } from './state.js';
import { clamp, shuffle } from './util.js';
import { persist, save } from '../save.js';
import { banner, updateHud } from '../ui/hud.js';

export function newCell(c){ return { c, lit:false, gids:[], bsize:0, ox:0, oy:0, pop:0, grow:1, fly:0, wig:0, t:Math.random() * 10 }; }

export function randColor(){ const L = G && G.loadout ? G.loadout : [0, 1]; return L[Math.floor(Math.random() * L.length)]; }

export function randSprout(){ return Math.random() < WILD_CHANCE ? RAINBOW : randColor(); }

export const inside = (a, b) => a >= 0 && a < ROWS && b >= 0 && b < COLS;

export const blocked = (a, b) => !inside(a, b) || !!grid[a][b] || !!graves[a][b];

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
      if (sameColorSize(grid, r, c) < 3) break;
    }
  }
  const spots = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (pat[r][c] !== 'X') spots.push([r, c]);
  for (const [r, c] of shuffle(spots).slice(0, nGraves)) graves[r][c] = true;
}

// Bunches: 3+ touching pumpkins of one color. Rainbows count as any color.

export function computeGroups(gr){
  const groups = [], present = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ const x = gr[r][c]; if (x && !x.fly && x.c !== RAINBOW) present.add(x.c); }
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
          if (n && !n.fly && (n.c === k || n.c === RAINBOW)){ seen.add(key); q.push([na, nb]); }
        }
      }
      if (cells.length >= 3){ groups.push({ color:k, cells }); cells.forEach(([a, b]) => used.add(a * COLS + b)); }
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
        if (n && !n.fly && n.c === RAINBOW){ seenR.add(key); q.push([na, nb]); }
      }
    }
    if (cells.length >= 3 && !cells.some(([a, b]) => used.has(a * COLS + b))) groups.push({ color:0, cells });
  }
  return groups;
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
    G.groups[gid] = { color:g.color, size };
    let changed = false;
    for (const [r, c] of g.cells){
      const cell = grid[r][c], before = was.get(cell) || 0;
      cell.lit = true; cell.gids.push(gid); cell.bsize = Math.max(cell.bsize, size);
      if (before < size){
        changed = true; cell.pop = 1;
        const x = LANE(c), y = GY + r * CS + CS / 2;
        sx += x; sy += y; n++;
        for (let i = 0; i < 5; i++) spark(x, y, PTYPES[cell.c].spark, 150);
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
  if (!grid[r + dr][c + dc]){ const [tr, tc] = slideDest(r, c, dir); return [[r, c, tr, tc]]; }
  const line = [[r, c]];
  let a = r + dr, b = c + dc;
  while (inside(a, b) && grid[a][b]){ line.push([a, b]); a += dr; b += dc; }
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
  SFX.sprout();
  resolveMatches();
  return true;
}

/** One sprout tick: SPROUT_COUNT pumpkins in separate random empty cells; fewer if the patch runs out. */
export function spawnSprouts(){
  let placed = 0;
  for (let i = 0; i < SPROUT_COUNT; i++) if (spawnPumpkin()) placed++;
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
    const near = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(([a, b]) => inside(a, b) && grid[a][b] && !grid[a][b].fly && (grid[a][b].c === colour || grid[a][b].c === RAINBOW || colour === RAINBOW));
    if (!near) continue;
    const d = Math.abs(c - c0) * 10 + (ROWS - r);
    if (d < bd){ bd = d; best = [r, c]; }
  }
  return best || landingCell(x);
}
export function collectDrop(d){
  if (!d || d.dead) return false;
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
  const pos = findCell(ref); if (!pos) return;
  grid[pos.r][pos.c] = null;
  const x = LANE(pos.c), y = GY + pos.r * CS + CS / 2;
  for (let i = 0; i < 14; i++) chunk(x, y, ref.c === RAINBOW ? '#f0a020' : PTYPES[ref.c].base, 200);
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
    const a = gr[r][c]; if (!a) continue;
    const same = b => b && (b.c === a.c || b.c === RAINBOW || a.c === RAINBOW);
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

export function groupCells(gid){
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ const cell = grid[r][c]; if (cell && cell.lit && cell.gids.includes(gid)) out.push({ r, c, cell }); }
  return out;
}

export function bestLitGroup(){
  if (!G.groups) return null;
  const threat = laneThreat();
  let best = null, bs = -1;
  for (const gid of Object.keys(G.groups)){
    const cells = groupCells(+gid); if (!cells.length) continue;
    const s = cells.reduce((a, o) => a + threat[o.c], 0);
    if (s > bs){ bs = s; best = (cells.find(o => o.cell.c !== RAINBOW) || cells[0]).cell; }
  }
  return best;
}

export function heldGid(){ return gest && !gest.done && gest.ref && gest.ref.lit ? primaryGid(gest.ref) : null; }
