import { perkOn, clearRentals } from '../data/perks.js';
import { MINTRO, TYPES, BOSS_NAMES, VARIANTS } from '../data/monsters.js';
import { GEAR } from '../data/shop.js';
import { PATTERNS } from '../data/patterns.js';
import { NTYPES, PTYPES, POWER } from '../data/pumpkins.js';
import { WORLDS, levelFor, typesForNight, highestOpen } from '../data/worlds/index.js';
import { SFX, ensureAudio, musicStart, musicStop } from './audio.js';
import { MUSIC } from '../data/music.js';
import { bestLitGroup, bestMove, emptyCells, findCell, initBoard, resolveMatches, smash, spawnSprouts, landingCell, landingNear, flyInto, DIRV } from './board.js';
import { addFloat, damage, hitMonster, spark, chunk, ring, castleY, damageCastle } from './combat.js';
import { mS, mY, updateMonster, TILE_P, applyBulwarks } from './monsters.js';
import { bgWorld, buildBg } from './render/sprites.js';
import { poolKey, prebake } from './render/anim.js';
import { atlasKey } from './render/chars.js';
import { endlessSpawn, storySpawn } from './spawner.js';
import { COLS, CS, FENCE_Y, FIELD_TOP, G, GY, HOLD_TIME, LANE, ROWS, W, gest, graves, grid, setG, setGest, state, walls, GX, FIELD_BOT, HOLD_TIME_QUICK } from './state.js';
import { rnd, shuffle, clamp, TAU } from './util.js';
import { initWalls, damageWall } from './walls.js';
import { persist, save } from '../save.js';
import { banner, updateHud } from '../ui/hud.js';
import { openLoadout, setState, showResult } from '../ui/screens.js';

// ---------- Flow ----------

export function makeDemo(){
  setG({ mode:'demo', world:0, loadout:[0, 1, 2, 3], monsters:[], projs:[], parts:[], floats:[], coinFx:[], drops:[], vfx:[], coins:0, shake:0, t:0, flash:0, groups:{}, mines:[], fogClear:0, castles:[], arrows:[], puddles:[], scarecrows:[], hexZones:[], tails:[], gustT:0, gustDir:null });
  initBoard(1, 2);
  [[4,0],[4,1],[4,2],[3,1]].forEach(([r, c]) => { if (grid[r][c]) grid[r][c].c = 0; });
  resolveMatches();
  initWalls();
  [['bat', 6, 0.1], ['imp', 0, 0.3], ['ghoul', 0, 1], ['brute', 6, 1]].forEach(([t, l, p]) => {
    const T = TYPES[t], x = LANE(l);
    G.monsters.push({ type:t, lane:l, x, tx:x, p, hp:T.hp, maxHp:T.hp, r:T.r, hw:CS * 0.42, sp:0, ph:Math.random() * 10, age:5, flash:0, slowT:0, frozenT:0, burnLeft:0, hop:0, eating:p >= 1, demo:true });
  });
}

/** The night's own map behind the level preview (owner): the field, walls, graves, castles, puddles, shore and fog of level n, no monsters. */
export function makePreview(n){
  const def = levelFor(n);
  setG({ mode:'demo', n, def, world:def.world, loadout:[0, 1, 2, 3], monsters:[], projs:[], parts:[], floats:[], coinFx:[], drops:[], vfx:[], coins:0, shake:0, t:0, flash:0, groups:{}, mines:[], fogClear:0, castles:[], arrows:[], puddles:[], scarecrows:[], hexZones:[], tails:[], gustT:0, gustDir:null, sproutT:0, aim:null, over:false, spawned:0, bossSpawned:false, hint:null, hintT:0 });
  if (def.castlesLayout) for (const [lane, p] of def.castlesLayout) G.castles.push({ lane, p, hp:def.castles ? def.castles.hp : 12, maxHp:def.castles ? def.castles.hp : 12, flash:0, dead:false });
  else if (def.castles) raiseCastles(def.castles.n, def.castles.hp);
  if (def.puddles) placePuddles(def.puddles);
  if (G.world !== bgWorld) buildBg(G.world);
  initBoard(def.pattern, def.graves);
  if (def.gravesLayout) applyGravesLayout(def.gravesLayout);
  initWalls();
  resolveMatches();
  setGest(null);
}

export function beginNight(n){
  const av = typesForNight(Math.max(n, highestOpen()));   // unlocks are global progress: anything unlocked is usable on any level (owner)
  const def = levelFor(n);
  const must = def.unlockPumpkins.map(k => ({ t:PTYPES.findIndex(p => p.key === k), why:'New this level' })).filter(m => m.t >= 0);   // this level's new pumpkin(s) are locked into the loadout
  const hasMummies = def.pool.some(([k]) => k === 'mummy' || (VARIANTS[k] && VARIANTS[k].base === 'mummy'));
  if (hasMummies && !must.some(m => m.t === 3)) must.push({ t:3, why:'Mummies only die to Fire' });   // owner: Fire is auto-selected and locked on mummy levels
  if (def.pool.some(([k]) => k === 'firemummy') && !must.some(m => m.t === 2)) must.push({ t:2, why:'Flaming mummies only die to Ice' });
  if (av.length > 5) openLoadout(av, lo => startGame('story', n, lo), must);
  else startGame('story', n, av);
}

export function beginEndless(){
  const av = typesForNight(highestOpen());
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
    monsters:[], projs:[], parts:[], floats:[], coinFx:[], drops:[], vfx:[], groups:{},
    t:0, shake:0, flash:0, idle:0, hint:null, hintT:0, over:false, bossDead:false, aim:null, fogClear:0, mines:[], castles:[], arrows:[], puddles:[], scarecrows:[], hexZones:[], tails:[],
    gustT:def && def.gust ? def.gust.every : 0, gustDir:null,
  });
  if (def) prebake([...def.pool.map(([k]) => poolKey(k, VARIANTS)), ...(def.boss ? [atlasKey(def.boss, def.bossForm === 2 ? 'form2' : null)] : []), 'ghoul']);   // bake this level's sprite strips now, not on first sight
  if (def && def.castlesLayout) for (const [lane, p] of def.castlesLayout) G.castles.push({ lane, p, hp:def.castles ? def.castles.hp : 12, maxHp:def.castles ? def.castles.hp : 12, flash:0, dead:false });
  else if (def && def.castles) raiseCastles(def.castles.n, def.castles.hp);
  if (def && def.puddles) placePuddles(def.puddles);
  if (G.world !== bgWorld) buildBg(G.world);
  initBoard(def ? def.pattern : Math.floor(Math.random() * PATTERNS.length), def ? def.graves : 2);
  if (def && def.gravesLayout) applyGravesLayout(def.gravesLayout);   // after the board exists: explicit graves replace pumpkins
  initWalls();
  resolveMatches();
  setGest(null);
  setState('play'); musicStart(def && MUSIC['w' + def.world] ? 'w' + def.world : 'play');   // one draft track per world for the owner to compare; endless uses the first draft

  if (mode === 'story'){
    const parts = [];
    for (const key of def.unlockPumpkins){ const P = PTYPES.find(p => p.key === key); if (P) parts.push(`New pumpkin: ${P.name}! It ${P.role}.`); }
    for (const key of def.unlockGear){
      const g = GEAR.find(x => x.key === key);
      if (!g) continue;
      if ((save[key] || 0) < 1){ save[key] = 1; persist(); }   // one free unit the night a tool is introduced
      parts.push(`New tool: ${g.name}. ${g.desc}`);
    }
    for (const t of def.intro){ const v = VARIANTS[t]; if (v) parts.push(v.intro); else if (MINTRO[t]) parts.push(MINTRO[t]); }
    if (def.fog.length && !(n > 1 && levelFor(n - 1).fog.length)) parts.push('Fog hides part of the field. A Lantern clears it.');
    if (def.boss) parts.push(def.boss === 'twintides' ? `${BOSS_NAMES[def.boss]} wait in this night. Monsters keep coming until both fall.` : `${BOSS_NAMES[def.boss]} waits in this night. Monsters keep coming until it falls.`);
    if (def.graves && def.graves > (n > 1 ? levelFor(n - 1).graves : 0)) parts.push(n === 3 ? 'Graves now appear in your patch. They block slides.' : 'One more grave in the patch.');
    if (n === 1) parts.push('Swipe a pumpkin to slide it. Bunch 3 of a color.');
    banner(`Night ${def.label}`, parts.length ? parts.join(' ') : WORLDS[G.world].name, parts.length > 1 ? 4.2 : 3); SFX.levelStart();
  } else banner('Endless night', 'How long can the walls hold?', 2.4);
}

export function endGame(win){
  if (G.over) return;
  G.over = true; setGest(null); clearRentals();   // a rented power lasts one night
  musicStop(win ? 0.3 : 1.2);
  if (win) SFX.win(); else SFX.lose();
  setTimeout(() => showResult(win), win ? 1100 : 1000);
}

export function useFirework(){
  if (state !== 'play' || G.over || save.fw <= 0) return;
  save.fw--; persist();
  SFX.tool('fw'); G.shake = 1; G.flash = 1;
  for (let i = 0; i < 5; i++){ const x = rnd(60, W - 60), y = rnd(FIELD_TOP, FIELD_TOP + 160); const col = ['#ffd35a', '#ff6a3a', '#d09bff', '#aee8ff', '#a6f06a'][i]; for (let k = 0; k < 12; k++) spark(x, y, col, 260); if (G.vfx) G.vfx.push({ kind:'firework', x, y, i, col, t:-i * 0.12, dur:1.1 }); }   // rockets climb from the fence and burst (render/tools.js)
  for (const m of G.monsters.slice()) if (!m.dead && !(m.rise > 0)){ m.lastHit = -1; damage(m, 3, '#ffd35a'); }
  updateHud(true);
}

/** Grave buster: first press arms it (tap a grave next), second press or a tap elsewhere cancels. */
export function useBuster(){
  if (state !== 'play' || G.over || save.buster <= 0) return;
  if (!graves.some(row => row.some(Boolean))){ addFloat('No graves to dig', W / 2, GY - 30, '#ffd35a', 18, 1); SFX.bad(); return; }
  G.aim = G.aim === 'buster' ? null : 'buster';
  if (G.aim) addFloat('Tap a grave', W / 2, GY - 30, '#ffd35a', 18, 1.2);
  if (G.aim) SFX.tool('aim');
  updateHud(true);
}
export function bustGrave(r, c){
  if (!graves[r][c] || save.buster <= 0) return false;
  graves[r][c] = false; save.buster--; persist();
  const x = LANE(c), y = GY + r * CS + CS / 2;
  for (let i = 0; i < 18; i++) chunk(x, y, i % 2 ? '#8a8d96' : '#3b2a1c', 220);
  ring(x, y, 40, 'rgba(255,220,150,.9)');
  if (G.vfx) G.vfx.push({ kind:'dynamite', x, y, t:0, dur:1.0 });
  SFX.tool('buster'); G.shake = 0.4; G.aim = null;
  updateHud(true);
  return true;
}
export function useLantern(){
  if (state !== 'play' || G.over || save.lantern <= 0) return;
  if (!G.def || !G.def.fog.length){ addFloat('No fog here', W / 2, GY - 30, '#ffd35a', 18, 1); SFX.bad(); return; }
  save.lantern--; persist();
  G.fogClear = 10; G.flash = 0.4;
  for (let i = 0; i < 20; i++) spark(rnd(40, W - 40), rnd(FIELD_TOP, FENCE_Y), '#ffe27a', 120);
  if (G.vfx) G.vfx.push({ kind:'lantern', x:W / 2, y:FENCE_Y - 30, t:0, dur:1.3 });
  SFX.tool('lantern'); updateHud(true);
}
/** Landmine: first press arms it (tap a column next), second press or a tap elsewhere cancels. */
export function useMine(){
  if (state !== 'play' || G.over || save.mine <= 0) return;
  G.aim = G.aim === 'mine' ? null : 'mine';
  if (G.aim) addFloat('Tap a tile of the field', W / 2, GY - 30, '#ffd35a', 18, 1.2);
  if (G.aim) SFX.tool('aim');
  updateHud(true);
}
export const MINE_ARM = 6;   // seconds a landmine stays buried before it surfaces, armed (owner)
/** Field y of anything at fraction p of the field. */
export const fieldY = p => FIELD_TOP + p * (FIELD_BOT - FIELD_TOP);
export function placeMine(lane, p = 0.93){   // owner: a mine goes on any tile of the field and blasts the 3×3 around it
  const tile = CS / (FIELD_BOT - FIELD_TOP);
  if (save.mine <= 0 || G.mines.some(m => m.lane === lane && Math.abs(m.p - p) < tile)){ addFloat('Mine already there', LANE(lane), fieldY(p) - 20, '#ffd35a', 16, 1); SFX.bad(); G.aim = null; updateHud(true); return false; }
  save.mine--; persist();
  G.mines.push({ lane, p, t:0, dead:false });
  for (let i = 0; i < 10; i++) spark(LANE(lane), fieldY(p), '#ffd35a', 100);
  SFX.tool('mine'); G.aim = null; updateHud(true);
  return true;
}
/** Castle walls at level start: n distinct random lanes, mid-field. */
/** Puddles (world 4): n distinct random lanes, mid-field. Crawlers and divers use them. */
export function placePuddles(n){
  const lanes = shuffle([...Array(COLS).keys()]).slice(0, n);
  const top = Math.max(0.3, shoreP() + 0.06);   // puddles sit below the shoreline
  for (const lane of lanes) G.puddles.push({ lane, p:rnd(top, Math.max(top + 0.05, 0.7)) });
}
/** Where the sea ends (fraction of the field): `shore` tile rows down, or the thin 10% band on plain sea levels. */
export function shoreP(){ const d = G.def; if (!d) return 0; return d.shore ? Math.min(0.8, d.shore * TILE_P()) : d.sea ? 0.1 : 0; }
/** Explicit grave cells: clears any pumpkin there and plants the grave. */
export function applyGravesLayout(cells){
  for (const [r, c] of cells) if (r >= 0 && r < ROWS && c >= 0 && c < COLS){ grid[r][c] = null; graves[r][c] = true; }
  resolveMatches();
}
/** Wind gust: every pumpkin slides in `dir` until the edge, a grave or another pumpkin stops it (the push rule on every
 *  row or column at once). Leading edge first, so lines compress against the far side. */
export function gust(dir, only){
  const [dr, dc] = DIRV[dir];
  let rows = [...Array(ROWS).keys()], cols = [...Array(COLS).keys()];
  if (only){ if (dr !== 0) cols = only.slice(); else rows = only.slice(); }   // partial gusts touch only these columns or rows
  if (dr > 0) rows.reverse();
  if (dc > 0) cols.reverse();
  let moved = 0;
  for (const r of rows) for (const c of cols){
    const cell = grid[r][c]; if (!cell || cell.fly) continue;
    let nr = r, nc = c;
    while (true){
      const tr = nr + dr, tc = nc + dc;
      if (tr < 0 || tr >= ROWS || tc < 0 || tc >= COLS || graves[tr][tc] || grid[tr][tc]) break;
      nr = tr; nc = tc;
    }
    if (nr === r && nc === c) continue;
    grid[nr][nc] = cell; grid[r][c] = null;
    cell.ox = (c - nc) * CS; cell.oy = (r - nr) * CS; moved++;
  }
  if (gest) setGest(null);
  SFX.wind('gust'); G.shake = Math.max(G.shake, 0.2);
  resolveMatches();
  return moved;
}
/** Scarecrow: first press arms it (tap a column next), second press or a tap elsewhere cancels. */
export function useScarecrow(){
  if (state !== 'play' || G.over || save.scarecrow <= 0) return;
  G.aim = G.aim === 'scarecrow' ? null : 'scarecrow';
  if (G.aim) addFloat('Tap a column', W / 2, GY - 30, '#ffd35a', 18, 1.2);
  if (G.aim) SFX.tool('aim');
  updateHud(true);
}
export function placeScarecrow(lane){
  if (save.scarecrow <= 0 || G.scarecrows.some(s => s.lane === lane)){ addFloat('Scarecrow already there', LANE(lane), FENCE_Y - 60, '#ffd35a', 16, 1); SFX.bad(); G.aim = null; updateHud(true); return false; }
  save.scarecrow--; persist();
  const p = 0.84;
  G.scarecrows.push({ lane, p, x:LANE(lane), y:FIELD_TOP + p * (FIELD_BOT - FIELD_TOP), hp:12, maxHp:12, dead:false, age:0 });
  for (let i = 0; i < 12; i++) spark(LANE(lane), FIELD_TOP + p * (FIELD_BOT - FIELD_TOP), '#c8b060', 120);
  SFX.tool('scarecrow'); G.aim = null; updateHud(true);
  return true;
}
/** Seconds between sprouts: the player's setting, one less with the 2-20 perk. */
export function sproutEvery(){ return Math.max(1, save.spawnEvery - (perkOn('sprout') ? 1 : 0)); }
export function raiseCastles(n, hp){
  const lanes = shuffle([...Array(COLS).keys()]).slice(0, n);
  for (const lane of lanes) G.castles.push({ lane, p:rnd(0.4, 0.72), hp, maxHp:hp, flash:0, dead:false });
}
/** Bomb: first press arms it (tap the field next), second press or a tap elsewhere cancels. */
export function useBomb(){
  if (state !== 'play' || G.over || save.bomb <= 0) return;
  G.aim = G.aim === 'bomb' ? null : 'bomb';
  if (G.aim) addFloat('Tap the field', W / 2, GY - 30, '#ffd35a', 18, 1.2);
  if (G.aim) SFX.tool('aim');
  updateHud(true);
}
export function dropBomb(x, y){
  if (save.bomb <= 0) return false;
  save.bomb--; persist();
  const lane0 = clamp(Math.floor((x - GX) / CS), 0, COLS - 1), p0 = (y - FIELD_TOP) / (FIELD_BOT - FIELD_TOP), reach = 1.5 * TILE_P();
  G.flash = 0.6; G.shake = 1; SFX.tool('bomb');
  for (let k = 0; k < 20; k++) spark(x, y, k % 3 ? '#ffd35a' : '#ff6a3a', 320);
  if (G.vfx){ G.vfx.push({ kind:'bombdrop', x, y, t:0, dur:0.35 }); G.vfx.push({ kind:'blast', x, y, t:-0.35, dur:0.7, r:CS * 1.5, seed:4 }); }   // the bomb falls in, then the fireball (render/tools.js, render/fx.js)
  for (const m of G.monsters.slice()) if (!m.dead && !m.hidden && m.rise <= 0 && Math.abs(m.lane - lane0) <= 1 && Math.abs(m.p - p0) <= reach){ m.lastHit = -1; damage(m, 4, '#ffd35a'); }
  for (const w of G.castles) if (!w.dead && Math.abs(w.lane - lane0) <= 1 && Math.abs(w.p - p0) <= reach) damageCastle(w, 4);
  G.aim = null; updateHud(true);
  return true;
}
/** Wall repair: first press arms it (tap the wall to fix next), second press or a tap elsewhere cancels (owner: one wall, like the grave buster). */
export function useRepair(){
  if (state !== 'play' || G.over || save.repair <= 0) return;
  if (walls.every(w => w.hp >= w.max)){ addFloat('Walls are already full', W / 2, FENCE_Y - 40, '#ffd35a', 18, 1); SFX.bad(); return; }
  G.aim = G.aim === 'repair' ? null : 'repair';
  if (G.aim) addFloat('Tap the wall to fix', W / 2, FENCE_Y - 40, '#ffd35a', 18, 1.2);
  if (G.aim) SFX.tool('aim');
  updateHud(true);
}
export function repairWall(lane){
  if (save.repair <= 0) return false;
  if (walls[lane].hp >= walls[lane].max){ addFloat('That wall is fine', LANE(lane), FENCE_Y - 40, '#ffd35a', 16, 1); SFX.bad(); G.aim = null; updateHud(true); return false; }
  save.repair--; persist();
  walls[lane].hp = walls[lane].max; for (let i = 0; i < 10; i++) spark(LANE(lane), FENCE_Y - 10, '#ffe27a', 140);
  if (G.vfx) G.vfx.push({ kind:'hammer', x:LANE(lane), y:FENCE_Y - 4, t:0, dur:0.7 });
  SFX.tool('repair'); G.aim = null; updateHud(true);
  return true;
}

// ---------- Update ----------

export function update(dt){
  const g = G;
  g.t += dt; g.idle += dt;
  if (!g.over){ if (g.mode === 'story') storySpawn(dt); else endlessSpawn(dt); }
  if (!g.over){
    const low = ROWS * COLS - emptyCells().length < 10;
    g.sproutT += dt * (low ? 2 : 1);
    if (g.sproutT >= sproutEvery()){ if (spawnSprouts()) g.sproutT = 0; else g.sproutT = sproutEvery(); }
  }
  for (const m of g.monsters) if (!m.dead && !g.over) updateMonster(m, dt);
  for (const pr of g.projs){
    pr.y += pr.vy * dt; pr.rot += dt * pr.spin;
    pr.trail.push(pr.x, pr.y); if (pr.trail.length > 14) pr.trail.splice(0, 2);
    if (pr.y < FENCE_Y + 10){
      for (const w of g.castles){   // castle walls intercept pumpkins (Grey pierces, Black blasts)
        if (w.dead || pr.hitWalls.has(w) || w.lane !== pr.lane || pr.y > castleY(w) + 20) continue;
        pr.hitWalls.add(w);
        const i = pr.lv - 1;
        damageCastle(w, pr.type === 7 ? POWER[i] * 1.5 : POWER[i]);
        if (pr.type === 7){
          ring(pr.x, castleY(w), 70, 'rgba(255,154,58,.9)'); for (let k = 0; k < 20; k++) spark(pr.x, castleY(w), '#ff9a3a', 240);
          for (const o of g.monsters.slice()) if (!o.dead && !o.hidden && o.rise <= 0 && Math.abs(o.lane - w.lane) <= 1 && Math.abs(mY(o) - castleY(w)) < CS * 1.2){ o.lastHit = 7; damage(o, POWER[i] / 2, '#ff9a3a', true); }
          for (const w2 of g.castles) if (w2 !== w && !w2.dead && Math.abs(w2.lane - w.lane) === 1 && Math.abs(castleY(w2) - castleY(w)) < CS * 1.2) damageCastle(w2, POWER[i] / 2);
        }
        if (pr.type !== 4){ pr.dead = true; pr.hit.add(w); }
      }
      if (pr.dead) continue;
      const targets = g.monsters.filter(m => !m.dead && !(m.rise > 0) && !m.hidden && !pr.hit.has(m) && Math.abs(pr.x - m.x) < m.hw).sort((a, b) => b.p - a.p);
      for (const m of targets){
        if (Math.abs(pr.y - mY(m)) < pr.r + m.r * mS(m) * 0.8 || pr.y < mY(m)){
          hitMonster(pr, m);
          if (pr.type !== 4){ pr.dead = true; break; }
        }
      }
    }
    if (!pr.dead && pr.y < FIELD_TOP - 14){
      pr.dead = true;
      if (!pr.hit.size){
        const spot = pr.type === 6 ? (pr.lv >= 3 ? landingNear(pr.x, pr.vis) : landingCell(pr.x)) : null;   // White: boomerang back into the patch (level 3+: beside its colour)
        if (spot){ flyInto(spot[0], spot[1], pr.vis, pr.x, FIELD_TOP); addFloat('Back!', pr.x, FIELD_TOP + 30, '#ffffff', 16, 0.8); SFX.extra('return'); resolveMatches(); }
        else { g.missed++; SFX.extra('miss'); }
      }
      for (let i = 0; i < 8; i++) spark(pr.x, pr.y, PTYPES[pr.vis].spark, 110);
    }
  }
  g.projs = g.projs.filter(p => !p.dead);
  if (g.fogClear > 0) g.fogClear -= dt;
  for (const mine of g.mines){   // landmines hide on a tile; the first monster to step on one sets off a 3×3 blast (owner)
    const tile = CS / (FIELD_BOT - FIELD_TOP);
    mine.t += dt;
    if (mine.t < MINE_ARM) continue;   // buried and harmless until it surfaces (owner: 6 s), then the first monster on it sets it off
    const v = g.monsters.find(m => !m.dead && !m.hidden && m.rise <= 0 && m.lane === mine.lane && m.p >= mine.p - tile * 0.3 && m.p < mine.p + tile * 0.6 && m.type !== 'boss');
    if (v){
      mine.dead = true; const y = fieldY(mine.p);
      for (let i = 0; i < 16; i++) spark(LANE(mine.lane), y, i % 2 ? '#ffd35a' : '#ff6a3a', 300); g.shake = 0.8; SFX.tool('mineBoom');
      if (g.vfx) g.vfx.push({ kind:'blast', x:LANE(mine.lane), y, t:0, dur:0.7, r:CS * 1.5, seed:6 });
      for (const o of g.monsters) if (!o.dead && !o.hidden && o.rise <= 0 && Math.abs(o.lane - mine.lane) <= 1 && Math.abs(o.p - mine.p) <= tile){ o.lastHit = -1; damage(o, 6, '#ffd35a'); }
    }
  }
  g.mines = g.mines.filter(m => !m.dead);
  for (const a of g.arrows){   // skeleton archers' arrows fly down their lane into the wall
    a.p += a.sp * dt;
    if (a.p >= 1){ a.dead = true; damageWall(a.lane, a.dmg); for (let i = 0; i < 8; i++) spark(LANE(a.lane), FENCE_Y - 10, a.water ? '#9fe0f0' : '#d8d0c0', 120); SFX.monsterAct(a.water ? 'water' : 'arrow', 'land'); }
  }
  g.arrows = g.arrows.filter(a => !a.dead);
  for (const w of g.castles) if (w.flash > 0) w.flash -= dt;
  g.castles = g.castles.filter(w => !w.dead);
  if (g.def && g.def.gust){   // wind: 2 s of leaves, then the whole patch shifts one cell
    g.gustT -= dt;
    if (g.gustDir == null && g.gustT <= 2){
      g.gustDir = g.def.gust.dirs[Math.floor(Math.random() * g.def.gust.dirs.length)];
      g.gustSet = null;
      if (g.def.gust.partial){   // only 2–3 columns (for up/down) or rows (for left/right)
        const vertical = g.gustDir === 'up' || g.gustDir === 'down', count = 2 + Math.floor(Math.random() * 2), max = vertical ? COLS : ROWS;
        const start = Math.floor(Math.random() * (max - count + 1)); g.gustSet = [...Array(count).keys()].map(i => start + i);
      }
      addFloat(`Wind ${ {left:'←', right:'→', up:'↑', down:'↓'}[g.gustDir] }`, W / 2, GY - 30, '#ffd9a0', 22, 1.8); SFX.wind('warn');
    }
    if (g.gustDir != null && Math.random() < dt * 40){
      const [dr, dc] = DIRV[g.gustDir];
      const vertical = dr !== 0, set = g.gustSet;
      const col = set && vertical ? set[Math.floor(Math.random() * set.length)] : Math.floor(Math.random() * COLS), row = set && !vertical ? set[Math.floor(Math.random() * set.length)] : Math.floor(Math.random() * ROWS);
      g.parts.push({ x:GX + col * CS + rnd(0, CS), y:GY + row * CS + rnd(0, CS), vx:dc * rnd(160, 260) + rnd(-30, 30), vy:dr * rnd(160, 260) + rnd(-30, 30), t:0, life:0.7, size:rnd(3, 5), color:['#d9a520', '#c9582a', '#8a4a1a'][Math.floor(Math.random() * 3)], kind:'chunk', grav:0, rot:Math.random() * TAU });
    }
    if (g.gustT <= 0){ gust(g.gustDir, g.gustSet); g.gustDir = null; g.gustSet = null; g.gustT = g.def.gust.every; }
  }
  for (const sc of g.scarecrows){   // monsters in the lane stop to chew the scarecrow
    for (const m of g.monsters) if (!m.dead && m.lane === sc.lane && m.type !== 'boss' && m.rise <= 0 && m.p >= sc.p - 0.01 && m.p < 0.99){
      m.p = Math.min(m.p, sc.p); m.chewing = sc; sc.hp -= m.eat * (m.frozenT > 0 ? 0 : m.slowT > 0 ? 0.5 : 1) * dt;
      if (Math.random() < dt * 4) chunk(sc.x + rnd(-8, 8), sc.y, '#c8b060', 80);
    }
    if (sc.age != null) sc.age += dt;
    if (sc.hp <= 0){ sc.dead = true; for (let i = 0; i < 8; i++) chunk(sc.x, sc.y, i % 2 ? '#c8b060' : '#5a3a1a', 220); if (g.vfx) g.vfx.push({ kind:'scbreak', x:sc.x, y:sc.y, t:0, dur:0.7 }); SFX.smash(); for (const m of g.monsters) if (m.chewing === sc) m.chewing = null; }
  }
  g.scarecrows = g.scarecrows.filter(s => !s.dead);
  for (const tl of g.tails) tl.t -= dt;
  g.tails = g.tails.filter(tl => tl.t > 0);
  for (const z of g.hexZones) z.t -= dt;
  g.hexZones = g.hexZones.filter(z => z.t > 0);
  applyBulwarks();
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
    cell.t += dt; cell.age = (cell.age || 0) + dt;
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
    if (gest.held >= (perkOn('smash') ? HOLD_TIME_QUICK : HOLD_TIME)){ gest.done = true; smash(gest.ref); if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {} }
  }
  if (g.idle > 6 && !g.over){
    g.hintT -= dt;
    if (g.hintT <= 0){ g.hintT = 1.5; g.hint = bestLitGroup() ? null : bestMove(); }
  }
  if (!g.over && g.mode === 'story' && (g.def.boss ? g.bossDead : g.spawned >= g.def.total) && g.monsters.length === 0) endGame(true);
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
  if (g.vfx){ for (const v of g.vfx) v.t += dt; g.vfx = g.vfx.filter(v => v.t < v.dur); }
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
