import { MFIRST, MINTRO, TYPES } from '../data/monsters.js';
import { PATTERNS } from '../data/patterns.js';
import { NTYPES, PTYPES, typesForNight } from '../data/pumpkins.js';
import { WORLDS, levelFor } from '../data/worlds/index.js';
import { SFX, ensureAudio } from './audio.js';
import { bestLitGroup, bestMove, emptyCells, findCell, initBoard, resolveMatches, smash, spawnPumpkin } from './board.js';
import { addFloat, damage, hitMonster, spark } from './combat.js';
import { mS, mY, updateMonster } from './monsters.js';
import { bgWorld, buildBg } from './render/sprites.js';
import { endlessSpawn, storySpawn } from './spawner.js';
import { COLS, CS, FENCE_Y, FIELD_TOP, G, HOLD_TIME, LANE, ROWS, W, gest, grid, setG, setGest, state, walls } from './state.js';
import { rnd } from './util.js';
import { initWalls } from './walls.js';
import { persist, save } from '../save.js';
import { banner, updateHud } from '../ui/hud.js';
import { openLoadout, setState, showResult } from '../ui/screens.js';

// ---------- Flow ----------

export function makeDemo(){
  setG({ mode:'demo', world:0, loadout:[0, 1, 2, 3], monsters:[], projs:[], parts:[], floats:[], coinFx:[], drops:[], coins:0, shake:0, t:0, flash:0, groups:{} });
  initBoard(1, 2);
  [[4,0],[4,1],[4,2],[3,1]].forEach(([r, c]) => { if (grid[r][c]) grid[r][c].c = 0; });
  resolveMatches();
  initWalls();
  [['bat', 6, 0.1], ['imp', 0, 0.3], ['ghoul', 0, 1], ['brute', 6, 1]].forEach(([t, l, p]) => {
    const T = TYPES[t], x = LANE(l);
    G.monsters.push({ type:t, lane:l, x, tx:x, p, hp:T.hp, maxHp:T.hp, r:T.r, hw:CS * 0.42, sp:0, ph:Math.random() * 10, age:5, flash:0, slowT:0, frozenT:0, burnLeft:0, hop:0, eating:p >= 1, demo:true });
  });
}

export function beginNight(n){
  const av = typesForNight(n);
  if (av.length > 5) openLoadout(av, lo => startGame('story', n, lo));
  else startGame('story', n, av);
}

export function beginEndless(){
  const av = typesForNight(Math.max(1, save.unlocked));
  if (av.length > 5) openLoadout(av, lo => startGame('endless', 1, lo));
  else startGame('endless', 1, av.length >= 3 ? av : typesForNight(2));
}

export function startGame(mode, n, loadout){
  ensureAudio();
  const def = mode === 'story' ? levelFor(n) : null;
  setG({
    mode, n:n || 1, def, world:def ? def.world : 0, loadout:loadout.slice(),
    coins:0, score:0, kills:0, resolved:0, throws:0, missed:0,
    total:def ? def.total + (def.boss ? 1 : 0) : 0,
    spawned:0, spawnTimer:2.6, bossSpawned:false, bossTimer:100, diff:1, sproutT:0,
    monsters:[], projs:[], parts:[], floats:[], coinFx:[], drops:[], groups:{},
    t:0, shake:0, flash:0, idle:0, hint:null, hintT:0, over:false,
  });
  if (G.world !== bgWorld) buildBg(G.world);
  initBoard(def ? def.pattern : Math.floor(Math.random() * PATTERNS.length), def ? def.graves : 2);
  initWalls();
  resolveMatches();
  setGest(null);
  setState('play');
  if (mode === 'story'){
    const parts = [];
    const newP = PTYPES.findIndex((p, i) => i < NTYPES && p.unlock === n && n > 1);
    if (newP >= 0) parts.push(`New pumpkin: ${PTYPES[newP].name}! It ${PTYPES[newP].role}.`);
    for (const [t, lv] of Object.entries(MFIRST)) if (lv === n) parts.push(MINTRO[t]);
    if (def.boss) parts.push('A boss waits at the end of this night.');
    if (def.graves && def.graves > (n > 1 ? levelFor(n - 1).graves : 0)) parts.push(n === 3 ? 'Graves now appear in your patch. They block slides.' : 'One more grave in the patch.');
    if (n === 1) parts.push('Swipe a pumpkin to slide it. Bunch 3 of a color.');
    banner(`Night ${n}`, parts.length ? parts.join(' ') : WORLDS[G.world].name, parts.length > 1 ? 4.2 : 3);
  } else banner('Endless night', 'How long can the walls hold?', 2.4);
}

export function endGame(win){
  if (G.over) return;
  G.over = true; setGest(null);
  if (win) SFX.win(); else SFX.lose();
  setTimeout(() => showResult(win), win ? 1100 : 1000);
}

export function useFirework(){
  if (state !== 'play' || G.over || save.fw <= 0) return;
  save.fw--; persist();
  SFX.boom(); G.shake = 1; G.flash = 1;
  for (let i = 0; i < 5; i++){ const x = rnd(60, W - 60), y = rnd(FIELD_TOP, FIELD_TOP + 160); const col = ['#ffd35a', '#ff6a3a', '#d09bff', '#aee8ff', '#a6f06a'][i]; for (let k = 0; k < 24; k++) spark(x, y, col, 260); }
  for (const m of G.monsters.slice()) if (!m.dead) damage(m, 3, '#ffd35a');
  updateHud(true);
}

export function useRepair(){
  if (state !== 'play' || G.over || save.repair <= 0) return;
  if (walls.every(w => w.hp >= w.max)){ addFloat('Walls are already full', W / 2, FENCE_Y - 40, '#ffd35a', 18, 1); SFX.bad(); return; }
  save.repair--; persist();
  for (let c = 0; c < COLS; c++){ walls[c].hp = walls[c].max; for (let i = 0; i < 5; i++) spark(LANE(c), FENCE_Y - 10, '#ffe27a', 140); }
  SFX.repair();
  updateHud(true);
}

// ---------- Update ----------

export function update(dt){
  const g = G;
  g.t += dt; g.idle += dt;
  if (!g.over){ if (g.mode === 'story') storySpawn(dt); else endlessSpawn(dt); }
  if (!g.over){
    const low = ROWS * COLS - emptyCells().length < 10;
    g.sproutT += dt * (low ? 2 : 1);
    if (g.sproutT >= save.spawnEvery){ if (spawnPumpkin()) g.sproutT = 0; else g.sproutT = save.spawnEvery; }
  }
  for (const m of g.monsters) if (!m.dead && !g.over) updateMonster(m, dt);
  for (const pr of g.projs){
    pr.y += pr.vy * dt; pr.rot += dt * pr.spin;
    pr.trail.push(pr.x, pr.y); if (pr.trail.length > 14) pr.trail.splice(0, 2);
    if (pr.y < FENCE_Y + 10){
      const targets = g.monsters.filter(m => !m.dead && !pr.hit.has(m) && Math.abs(pr.x - m.x) < m.hw).sort((a, b) => b.p - a.p);
      for (const m of targets){
        if (Math.abs(pr.y - mY(m)) < pr.r + m.r * mS(m) * 0.8 || pr.y < mY(m)){
          hitMonster(pr, m);
          if (pr.type !== 4){ pr.dead = true; break; }
        }
      }
    }
    if (!pr.dead && pr.y < FIELD_TOP - 14){
      pr.dead = true;
      if (!pr.hit.size) g.missed++;
      for (let i = 0; i < 8; i++) spark(pr.x, pr.y, PTYPES[pr.vis].spark, 110);
    }
  }
  g.projs = g.projs.filter(p => !p.dead);
  g.monsters = g.monsters.filter(m => !m.dead);
  for (const d of g.drops){
    d.t += dt;
    if (d.t > d.life && !d.dead){ d.dead = true; for (let i = 0; i < 6; i++) spark(d.x, d.y, '#8a7a90', 60); }
  }
  g.drops = g.drops.filter(d => !d.dead);
  for (const w of walls) if (w.flash > 0) w.flash = Math.max(0, w.flash - dt * 3);
  commonFx(dt);
  let landed = false;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const cell = grid[r][c]; if (!cell) continue;
    cell.t += dt;
    const k = Math.min(1, dt * (cell.fly > 0 ? 9 : 16));
    cell.ox -= cell.ox * k; cell.oy -= cell.oy * k;
    if (cell.fly > 0){ cell.fly -= dt; if (cell.fly <= 0){ cell.fly = 0; cell.ox = 0; cell.oy = 0; cell.pop = 1; landed = true; } }
    if (cell.grow < 1) cell.grow = Math.min(1, cell.grow + dt * 4);
    if (cell.pop > 0) cell.pop = Math.max(0, cell.pop - dt * 3);
    if (cell.wig > 0) cell.wig = Math.max(0, cell.wig - dt * 4);
  }
  if (landed) resolveMatches();
  if (gest && !gest.done && gest.ref && Math.hypot(gest.x - gest.sx, gest.y - gest.sy) < 16 && findCell(gest.ref)){
    gest.held += dt;
    if (gest.held >= HOLD_TIME){ gest.done = true; smash(gest.ref); if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {} }
  }
  if (g.idle > 6 && !g.over){
    g.hintT -= dt;
    if (g.hintT <= 0){ g.hintT = 1.5; g.hint = bestLitGroup() ? null : bestMove(); }
  }
  if (!g.over && g.mode === 'story' && g.spawned >= g.def.total && (!g.def.boss || g.bossSpawned) && g.monsters.length === 0) endGame(true);
  updateHud(false);
}

export function commonFx(dt){
  const g = G;
  if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 2.5);
  if (g.flash > 0) g.flash = Math.max(0, g.flash - dt * 2.5);
  for (const p of g.parts){
    p.t += dt;
    if (p.kind !== 'ring'){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt; p.vx *= 1 - dt * 1.5; if (p.rot != null) p.rot += dt * 8; }
  }
  g.parts = g.parts.filter(p => p.t < p.life);
  for (const f of g.floats){ f.t += dt; f.y -= 38 * dt; }
  g.floats = g.floats.filter(f => f.t < f.life);
  for (const c of g.coinFx){ c.t += dt; if (c.t >= c.dur && !c.done){ c.done = true; SFX.coin(); } }
  g.coinFx = g.coinFx.filter(c => !c.done);
}

export function demoUpdate(dt){
  G.t += dt;
  for (const m of G.monsters){ m.ph += dt; if (m.type === 'imp') m.hop = Math.max(0, Math.sin(m.ph * 4.5)); if (m.type === 'bat') m.x = m.tx + Math.sin(m.ph * 3) * 6; }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]) grid[r][c].t += dt;
  commonFx(dt);
}
