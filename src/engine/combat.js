import { BURN_AMT, BURN_EVERY, BURN_N, FREEZE_P, KB_CHANCE, POWER, PTYPES, RAINBOW, RAINBOW_P, SLOW_T, SPAWN_P } from '../data/pumpkins.js';
import { SFX } from './audio.js';
import { emptyCells, flyInto, groupCells, primaryGid, randColor, randSprout, resolveMatches } from './board.js';
import { TILE_P, mS, mY } from './monsters.js';
import { CS, FIELD_BOT, FIELD_TOP, G, GY, LANE, W, grid } from './state.js';
import { TAU, clamp, fmt, rnd } from './util.js';
import { lvOf } from '../save.js';
import { banner } from '../ui/hud.js';

export function launchGroup(ref){
  if (!ref || !ref.lit || !G || G.over) return;
  const gid = primaryGid(ref), grp = G.groups[gid];
  if (!grp) return;
  const cells = groupCells(gid);
  if (!cells.length) return;
  const type = grp.color, lv = lvOf(type), guar = grp.size >= 5;
  for (const { r, c, cell } of cells){
    const x = LANE(c), y = GY + r * CS + CS / 2 + cell.oy;
    G.projs.push({ x, y, vy:-900, type, vis:cell.c, lv, guar, rot:Math.random() * TAU, spin:rnd(8, 12) * (Math.random() < 0.5 ? -1 : 1), hit:new Set(), trail:[], r:16, dead:false });
    grid[r][c] = null;
  }
  SFX.launch(cells.length);
  G.throws += cells.length;
  G.idle = 0; G.hint = null;
  resolveMatches();
}

export function damage(m, amt, color, small){
  if (m.dead) return;
  m.hp -= amt; m.flash = 0.1;
  addFloat(fmt(amt), m.x + rnd(-8, 8), mY(m) - m.r * mS(m) - 14, color || '#fff', small ? 16 : 23, 0.8);
  if (m.hp <= 0.001) kill(m);
}

export function dropHop(d){ return d.t < 0.45 ? Math.sin(d.t / 0.45 * Math.PI) * 26 : Math.sin(G.t * 3 + d.ph) * 2; }

export function dropPumpkins(m){
  const n = Math.floor(m.drop) + (Math.random() < m.drop % 1 ? 1 : 0);
  const y = clamp(mY(m), FIELD_TOP + 20, FIELD_BOT - 30);
  for (let i = 0; i < n; i++){
    const x = clamp(m.x + (n > 1 ? (i - (n - 1) / 2) * 34 : 0), 26, W - 26);
    const c = (m.type === 'boss' && i === 0) ? RAINBOW : randSprout();
    G.drops.push({ x, y:y + (i % 2) * 16, c, t:-i * 0.08, life:7, ph:Math.random() * TAU, dead:false });
  }
}

export function kill(m){
  if (m.dead) return;
  m.dead = true;
  G.kills++; if (!m.minion) G.resolved++;
  G.coins += m.coins; G.score += m.pts;
  const y = mY(m), s = mS(m);
  const col = { ghoul:'#8fae78', bat:'#5b3a7a', imp:'#e0503a', brute:'#6f8a45', wraith:'#cfe8f2', boss:'#6a3a7a' }[m.type];
  for (let i = 0; i < (m.type === 'boss' ? 60 : 16); i++) chunk(m.x, y, col, m.type === 'boss' ? 420 : 220);
  ring(m.x, y, m.r * s * 2.2, 'rgba(255,220,150,.8)');
  const nc = Math.min(m.coins, m.type === 'boss' ? 12 : 5);
  for (let i = 0; i < nc; i++) G.coinFx.push({ sx:m.x + rnd(-12, 12), sy:y + rnd(-10, 10), t:-i * 0.05, dur:0.65 + Math.random() * 0.2 });
  dropPumpkins(m);
  SFX.kill();
  if (m.type === 'boss'){ G.shake = 1.2; banner('Bramble King falls!', 'Quick, grab the pumpkins it dropped!', 2.4); SFX.win(); }
}

export function knockback(m){
  if (m.dead || m.type === 'boss') return;
  m.kb = Math.max(m.kb, TILE_P()); m.eating = false;
  ring(m.x, mY(m), 34, 'rgba(255,240,200,.9)');
  SFX.knock();
}

export function hitMonster(pr, m){
  pr.hit.add(m);
  const i = pr.lv - 1, y = mY(m);
  for (let k = 0; k < 10; k++) chunk(pr.x, pr.y, pr.vis === RAINBOW ? '#f0a020' : PTYPES[pr.vis].base, 200);
  let kb = pr.guar || ((pr.type <= 1 || pr.type >= 4) && Math.random() < KB_CHANCE[i]);
  if (pr.type === 2){
    if (m.type !== 'boss' && Math.random() < FREEZE_P[i]){ m.frozenT = Math.max(m.frozenT, SLOW_T[i]); addFloat('Frozen!', m.x, y - m.r - 34, '#bfefff', 18, 0.9); SFX.freeze(); }
    else m.slowT = Math.max(m.slowT, SLOW_T[i]);
    ring(m.x, y, 42, 'rgba(180,240,255,.9)');
  }
  if (pr.type === 3){ m.burnLeft = Math.max(m.burnLeft, BURN_N[i]); m.burnAmt = Math.max(m.burnAmt, BURN_AMT[i]); m.burnTick = BURN_EVERY; }
  damage(m, POWER[i], PTYPES[pr.type].spark);
  if (kb && !m.dead) knockback(m);
  if (m.dead && pr.type === 5 && Math.random() < SPAWN_P[i]){
    const empties = emptyCells();
    if (empties.length){
      const [r, c] = empties[Math.floor(Math.random() * empties.length)];
      flyInto(r, c, Math.random() < RAINBOW_P[i] ? RAINBOW : randColor(), m.x, y);
      addFloat('+1 pumpkin', m.x, y - 40, '#d09bff', 18, 1);
    }
  }
  SFX.hit();
}

// ---------- Effects ----------

export function spark(x, y, color, spd){ if (!G) return; const a = Math.random() * TAU, s = rnd(0.3, 1) * spd; G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, t:0, life:rnd(0.3, 0.6), size:rnd(2, 3.5), color, kind:'spark', grav:0 }); }

export function chunk(x, y, color, spd){ const a = Math.random() * TAU, s = rnd(0.3, 1) * spd; G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s - 60, t:0, life:rnd(0.4, 0.8), size:rnd(3, 6), color, kind:'chunk', grav:600, rot:Math.random() * TAU }); }

export function ring(x, y, r, color){ G.parts.push({ x, y, r, t:0, life:0.4, color, kind:'ring' }); }

export function addFloat(text, x, y, color, size, life){ if (!G) return; G.floats.push({ text, x, y, color, size, t:0, life:life || 0.8 }); }
