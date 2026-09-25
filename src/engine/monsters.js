import { resolveMatches } from './board.js';
import { TYPES, MODS, VARIANTS } from '../data/monsters.js';
import { BURN_EVERY, RAINBOW } from '../data/pumpkins.js';
import { SFX } from './audio.js';
import { chunk, damage, spark, ring, addFloat } from './combat.js';
import { COLS, CS, FENCE_Y, FIELD_BOT, FIELD_TOP, G, LANE, grid, ROWS, GY } from './state.js';
import { clamp, rnd } from './util.js';
import { damageWall } from './walls.js';

// ---------- Monsters ----------

export function mY(m){ return FIELD_TOP + clamp(m.p, -0.1, 1.05) * (FIELD_BOT - FIELD_TOP); }

export function mS(m){ return 0.85 + 0.2 * clamp(m.p, 0, 1); }

export const TILE_P = () => CS / (FIELD_BOT - FIELD_TOP);

export function spMulNow(){ return G.mode === 'story' ? G.def.spMul : 0.85 + (G.diff - 1) * 0.015; }

export function hpExtra(){ return G.mode === 'story' ? 0 : Math.min(2, Math.floor((G.diff - 1) / 10)); }

export function lanesOf(m){ return [m.lane]; }

export function pickLane(){
  const busy = new Set(G.monsters.filter(m => m.p < 0.15).map(m => m.lane));
  const all = [...Array(COLS).keys()], free = all.filter(l => !busy.has(l));
  const arr = free.length ? free : all;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Resolve a pool key (type, variant or 'boss') into { type, kind, T, variant }. */
export function resolveMonster(key){
  if (key === 'boss'){
    const kind = G.mode === 'story' && G.def.boss ? G.def.boss : 'gravekeeper';
    return { type:'boss', kind, T:TYPES[kind], variant:null };
  }
  const v = VARIANTS[key];
  if (v) return { type:v.base, kind:v.base, T:TYPES[v.base], variant:v };
  return { type:key, kind:key, T:TYPES[key], variant:null };
}
export function spawnMonster(key, lane, minion, p){
  const { type, kind, T, variant } = resolveMonster(key);
  const mod = variant ? MODS[variant.mod] : null;
  let hp = T.hp + (type === 'imp' || type === 'brute' || type === 'wisp' ? hpExtra() : 0) + (mod && mod.hp ? mod.hp : 0);
  const form = type === 'boss' ? (G.mode === 'story' ? (G.def.bossForm || 1) : (G.world >= 1 ? 2 : 1)) : 1;
  if (type === 'boss') hp = form === 2 ? T.form2.hp : T.hp + (G.mode === 'endless' ? 4 * G.world : 0);
  if (lane == null) lane = pickLane();
  const x = LANE(lane);
  const m = { type, kind, lane, x, tx:x, p:p != null ? p : -0.02, hp, maxHp:hp, r:T.r, hw:CS * 0.42, form,
    variant:variant ? variant.name : null, tint:variant ? variant.tint : null, noKnockback:!!(mod && mod.noKnockback),
    sp:T.sp * spMulNow() * rnd(0.92, 1.08) * (mod && mod.speed ? mod.speed : 1), coins:T.coins, eat:T.eat * (mod && mod.eat ? mod.eat : 1), pts:T.pts, drop:T.drop, ph:Math.random() * 10, age:0, flash:0,
    slowT:0, frozenT:0, burnLeft:0, burnAmt:0, burnTick:0, kb:0, eating:false, dead:false, minion:!!minion, summon:4, hop:0, drift:rnd(2.5, 4.5), rise:0, lastHit:null,
    hold:T.hold || 1, teleport:T.teleportEvery || 0, shove:form === 2 && T.form2 && T.form2.shoveEvery ? T.form2.shoveEvery : 0,
    hidden:false, vanish:T.show || 0, carrier:type === 'rider', healT:T.healEvery || 0,
    driftT:T.driftEvery || 0, swapT:T.swapEvery || 0, recolourT:form === 2 && T.form2 && T.form2.recolourEvery ? T.form2.recolourEvery : 0,
    phase:'move', phaseT:T.move || 0, shield:type === 'knight', gargs:null, freed:false, shootT:T.shootEvery || 0, calmT:0, regenT:0,
    laneT:T.laneEvery || 0, batsT:T.batsEvery || 0, wallT:T.wallEvery || 0, healT:T.healEvery || 0, healing:false, healHits:0, stunT:0 };
  if (type === 'hauler'){   // its gargoyles walk ahead of it in the same lane
    m.gargs = [];
    for (let i = 0; i < T.push; i++) m.gargs.push(spawnMonster('gargoyle', lane, true, m.p + 0.07 * (i + 1)));
  }
  if (type === 'vampire'){   // arrives with a couple of bats in neighbouring lanes
    for (let i = 0; i < T.bats; i++){ const l = Math.max(0, Math.min(COLS - 1, lane + (i ? 1 : -1))); spawnMonster('bat', l, true, Math.max(-0.02, m.p)); }
  }
  G.monsters.push(m);
  return m;
}

export function aheadLimit(m){
  let limit = 1;
  const myLanes = lanesOf(m);
  for (const o of G.monsters){
    if (o === m || o.dead || o.p <= m.p) continue;
    if (!lanesOf(o).some(l => myLanes.includes(l))) continue;
    limit = Math.min(limit, o.p - (m.r + o.r) * 0.75 / (FIELD_BOT - FIELD_TOP));
  }
  return limit;
}

/** Short puff of dust/particles where the Gravekeeper vanishes or appears. */
function puff(x, y){ for (let i = 0; i < 14; i++) spark(x, y, i % 2 ? '#c9b6ff' : '#5a3a7a', 150); ring(x, y, 30, 'rgba(200,170,255,.8)'); }
export function updateMonster(m, dt){
  m.age += dt; m.ph += dt;
  if (m.flash > 0) m.flash -= dt;
  if (m.rise > 0){   // collapsed mummy: lies still, untargetable, then stands back up at full health
    m.rise -= dt;
    if (m.rise <= 0){ m.rise = 0; m.hp = m.maxHp; m.flash = 0.2; addFloat('Rises again', m.x, mY(m) - m.r - 30, '#d8cfb0', 16, 0.9); }
    return;
  }
  let sp = m.sp;
  if (m.frozenT > 0){ m.frozenT -= dt; sp = 0; }
  else if (m.slowT > 0){ m.slowT -= dt; sp *= 0.5; }
  if ((m.frozenT > 0 || m.slowT > 0) && Math.random() < dt * 5) G.parts.push({ x:m.x + rnd(-m.r, m.r), y:mY(m) + rnd(-m.r, m.r), vx:0, vy:20, t:0, life:0.8, size:2.5, color:'#bfefff', kind:'dot', grav:0 });
  if (m.burnLeft > 0){
    m.burnTick -= dt;
    if (Math.random() < dt * 16) G.parts.push({ x:m.x + rnd(-m.r * 0.6, m.r * 0.6), y:mY(m) + rnd(-4, 10), vx:rnd(-10, 10), vy:-rnd(50, 90), t:0, life:0.5, size:rnd(3, 6), color:'#ff8a3a', kind:'flame', grav:0 });
    if (m.burnTick <= 0){ m.burnLeft--; m.burnTick = BURN_EVERY; m.lastHit = 3; damage(m, m.burnAmt, '#ff9a4a', true); if (m.dead) return; }
  }
  if (m.kb > 0){
    const st = Math.min(m.kb, dt * 2.2);
    m.p = Math.max(-0.05, m.p - st); m.kb -= st;
    return;
  }
  if (m.eating){
    m.shield = false;   // a shield knight lowers its shield to chew
    const mul = m.frozenT > 0 ? 0 : m.slowT > 0 ? 0.5 : 1;
    for (const c of lanesOf(m)) damageWall(c, m.eat * mul * dt);
    if (mul > 0){ SFX.chomp(); if (Math.random() < dt * 5) chunk(m.x + rnd(-10, 10), FENCE_Y - 18, '#8a6440', 90); }
    return;
  }
  if (m.frozenT <= 0){
    switch (m.type){
      case 'bat': m.x = m.tx + Math.sin(m.ph * 3) * 6; break;
      case 'imp': { const h = Math.max(0, Math.sin(m.ph * 4.5)); sp *= 0.25 + 2.2 * h; m.hop = h; m.x = m.tx; break; }
      case 'wisp':
        m.drift -= dt;
        if (m.drift <= 0 && m.p > 0.05 && m.p < 0.85){
          m.drift = rnd(3.2, 5);
          const opts = [m.lane - 1, m.lane + 1].filter(l => l >= 0 && l < COLS);
          m.lane = opts[Math.floor(Math.random() * opts.length)]; m.tx = LANE(m.lane);
        }
        m.x += (m.tx - m.x) * Math.min(1, dt * 3.5);
        break;
      case 'wraith': {   // fades out for T.hide seconds every T.show seconds; keeps walking, cannot be seen or hit
        m.vanish -= dt;
        if (m.vanish <= 0 && m.p > 0.05 && m.p < 0.9){
          m.hidden = !m.hidden; m.vanish = m.hidden ? TYPES.wraith.hide : TYPES.wraith.show;
          for (let i = 0; i < 10; i++) spark(m.x, mY(m), '#cfe8f2', 90);
        }
        if (m.hidden && m.p >= 0.9){ m.hidden = false; m.vanish = TYPES.wraith.show; }
        m.x = m.tx + Math.sin(m.ph * 1.2) * 3;
        break;
      }
      case 'rider': m.x = m.tx + (m.carrier ? Math.sin(m.ph * 4) * 5 : 0); break;
      case 'knight': {   // march / rest cycle; shield up while marching
        m.phaseT -= dt;
        if (m.phaseT <= 0){ m.phase = m.phase === 'move' ? 'stop' : 'move'; m.phaseT = m.phase === 'move' ? TYPES.knight.move : TYPES.knight.stop; }
        m.shield = m.phase === 'move' && !m.eating;
        if (m.phase === 'stop') sp = 0;
        break;
      }
      case 'hauler': {
        if (!m.freed && m.gargs && m.gargs.every(g => g.dead)){ m.freed = true; m.sp = TYPES.hauler.freeSp * spMulNow(); addFloat('Unburdened!', m.x, mY(m) - m.r - 26, '#ffd35a', 16, 1); }
        m.x = m.tx + Math.sin(m.ph * 1.6) * 2;
        break;
      }
      case 'archer': {   // holds near the top and shoots arrows down its lane
        if (m.p >= TYPES.archer.hold){
          sp = 0; m.shootT -= dt;
          if (m.shootT <= 0){ m.shootT = TYPES.archer.shootEvery; G.arrows.push({ lane:m.lane, p:m.p + 0.03, sp:0.4, dmg:TYPES.archer.arrow, dead:false }); SFX.knock(); }
        }
        break;
      }
      case 'vampire': {   // heals when left alone
        m.calmT += dt;
        if (m.calmT >= TYPES.vampire.calm && m.hp < m.maxHp){
          m.regenT -= dt;
          if (m.regenT <= 0){ m.regenT = TYPES.vampire.regenEvery; m.hp = Math.min(m.maxHp, m.hp + TYPES.vampire.regen); addFloat('+' + TYPES.vampire.regen, m.x, mY(m) - m.r - 20, '#ff6a6a', 14, 0.7); }
        }
        m.x = m.tx + Math.sin(m.ph * 1.2) * 3;
        break;
      }
      case 'doctor': {   // heals every other monster in its column
        m.healT -= dt;
        if (m.healT <= 0 && m.p > 0.05){
          m.healT = TYPES.doctor.healEvery;
          for (const o of G.monsters) if (o !== m && !o.dead && o.lane === m.lane && o.rise <= 0 && o.hp < o.maxHp){
            o.hp = Math.min(o.maxHp, o.hp + TYPES.doctor.heal); addFloat('+' + TYPES.doctor.heal, o.x, mY(o) - o.r - 20, '#9fe07a', 14, 0.7);
          }
          ring(m.x, mY(m), 40, 'rgba(160,230,120,.8)');
        }
        break;
      }
      case 'boss': {
        if (m.kind === 'poltergeist'){ updatePoltergeist(m, dt); if (m.p >= m.hold) sp = 0; break; }
        if (m.kind === 'vampirecount'){ if (updateVampireCount(m, dt) || m.p >= m.hold) sp = 0; break; }
        // Gravekeeper (docs/WORLDS.md §7): holds position, teleports between lanes, raises ghouls; form 2 shoves monsters forward
        const T = TYPES.gravekeeper;
        if (m.p >= m.hold) sp = 0;
        if (m.p > 0.05){
          m.summon -= dt;
          if (m.summon <= 0){
            m.summon = m.form === 2 ? T.form2.summonEvery : T.summonEvery;
            const g = spawnMonster('ghoul', pickLane(), true, Math.max(0, m.p - 0.02));
            puff(g.x, mY(g)); SFX.boss();
          }
          m.teleport -= dt;
          if (m.teleport <= 0){
            m.teleport = T.teleportEvery;
            const opts = [...Array(COLS).keys()].filter(l => l !== m.lane);
            puff(m.x, mY(m));
            m.lane = opts[Math.floor(Math.random() * opts.length)]; m.x = m.tx = LANE(m.lane); m.age = 0;
            puff(m.x, mY(m));
          }
          if (m.form === 2){
            m.shove -= dt;
            if (m.shove <= 0){
              m.shove = T.form2.shoveEvery;
              const pick = G.monsters.filter(o => o !== m && !o.dead && o.rise <= 0 && !o.eating && o.p > 0 && o.p < 0.6);
              if (pick.length){ const o = pick[Math.floor(Math.random() * pick.length)]; ring(o.x, mY(o), 36, 'rgba(200,170,255,.9)'); o.p = Math.min(0.95, o.p + T.form2.shove); ring(o.x, mY(o), 36, 'rgba(200,170,255,.9)'); }
            }
          }
        }
        break;
      }
      default: m.x = m.tx + Math.sin(m.ph * 1.6) * 2;
    }
  }
  const np = Math.min(m.p + sp * dt, aheadLimit(m));
  if (np > m.p) m.p = np;
  if (m.p >= 1){ m.p = 1; m.eating = true; }
}

/** The Poltergeist (world 2 boss): drifts between neighbouring lanes, swaps two pumpkins every few seconds; form 2 also recolours one. */
function updatePoltergeist(m, dt){
  const T = TYPES.poltergeist;
  m.x += (m.tx - m.x) * Math.min(1, dt * 2.5);
  if (m.p < 0.05) return;
  m.driftT -= dt;
  if (m.driftT <= 0){
    m.driftT = T.driftEvery;
    const opts = [m.lane - 1, m.lane + 1].filter(l => l >= 0 && l < COLS);
    m.lane = opts[Math.floor(Math.random() * opts.length)]; m.tx = LANE(m.lane);
  }
  m.swapT -= dt;
  if (m.swapT <= 0){
    m.swapT = m.form === 2 ? T.form2.swapEvery : T.swapEvery;
    const cells = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && !grid[r][c].fly) cells.push([r, c]);
    if (cells.length >= 2){
      const i = Math.floor(Math.random() * cells.length); let j = Math.floor(Math.random() * (cells.length - 1)); if (j >= i) j++;
      const [r1, c1] = cells[i], [r2, c2] = cells[j], a = grid[r1][c1], b = grid[r2][c2];
      grid[r1][c1] = b; grid[r2][c2] = a;
      a.fly = 0.55; a.ox = LANE(c1) - LANE(c2); a.oy = (r1 - r2) * CS;   // animate from old spot
      b.fly = 0.55; b.ox = LANE(c2) - LANE(c1); b.oy = (r2 - r1) * CS;
      ring(LANE(c1), GY + r1 * CS + CS / 2, 30, 'rgba(200,220,255,.9)'); ring(LANE(c2), GY + r2 * CS + CS / 2, 30, 'rgba(200,220,255,.9)');
      addFloat('Swapped!', m.x, mY(m) - m.r - 30, '#cfe8f2', 16, 0.9);
      SFX.knock();
      setTimeout(resolveMatches, 600);
    }
  }
  if (m.recolourT > 0 || (m.form === 2 && m.recolourT === 0)){
    if (m.form === 2){
      m.recolourT -= dt;
      if (m.recolourT <= 0){
        m.recolourT = T.form2.recolourEvery;
        const cells = [];
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ const x = grid[r][c]; if (x && !x.fly && x.c !== RAINBOW) cells.push(x); }
        if (cells.length && G.loadout.length > 1){
          const cell = cells[Math.floor(Math.random() * cells.length)];
          const others = G.loadout.filter(t => t !== cell.c);
          cell.c = others[Math.floor(Math.random() * others.length)]; cell.pop = 1;
          addFloat('Repainted!', m.x, mY(m) - m.r - 30, '#cfe8f2', 16, 0.9);
          resolveMatches();
        }
      }
    }
  }
}

/** The Vampire Count (world 3 boss). Returns true while it must stand still (healing trance or stun). */
function updateVampireCount(m, dt){
  const T = TYPES.vampirecount;
  if (m.stunT > 0){ m.stunT -= dt; return true; }
  if (m.healing){ m.hp = Math.min(m.maxHp, m.hp + T.healRate * dt); return true; }
  if (m.p < 0.05) return false;
  if (m.form === 2){   // full form also heals when left alone
    m.calmT += dt;
    if (m.calmT >= T.form2.calm && m.hp < m.maxHp){
      m.regenT -= dt;
      if (m.regenT <= 0){ m.regenT = T.form2.regenEvery; m.hp = Math.min(m.maxHp, m.hp + T.form2.regen); addFloat('+' + T.form2.regen, m.x, mY(m) - m.r - 30, '#ff6a6a', 14, 0.7); }
    }
  }
  m.laneT -= dt;
  if (m.laneT <= 0){   // bursts into bats and reforms in another lane
    m.laneT = T.laneEvery;
    const opts = [...Array(COLS).keys()].filter(l => l !== m.lane);
    for (let i = 0; i < 16; i++) spark(m.x, mY(m), i % 2 ? '#3a1a2a' : '#8a5aa8', 160);
    m.lane = opts[Math.floor(Math.random() * opts.length)]; m.x = m.tx = LANE(m.lane); m.age = 0.2;
    for (let i = 0; i < 16; i++) spark(m.x, mY(m), i % 2 ? '#3a1a2a' : '#8a5aa8', 160);
  }
  m.batsT -= dt;
  if (m.batsT <= 0){
    m.batsT = m.form === 2 ? T.form2.batsEvery : T.batsEvery;
    for (let i = 0; i < T.bats; i++) spawnMonster('bat', pickLane(), true, Math.max(0, m.p - 0.02));
    SFX.boss();
  }
  m.wallT -= dt;
  if (m.wallT <= 0){
    m.wallT = T.wallEvery;
    if (G.castles.filter(w => !w.dead).length < T.maxWalls){
      const used = new Set(G.castles.filter(w => !w.dead).map(w => w.lane));
      const free = [...Array(COLS).keys()].filter(l => !used.has(l));
      if (free.length){ const lane = free[Math.floor(Math.random() * free.length)]; G.castles.push({ lane, p:rnd(0.45, 0.7), hp:T.wallHp, maxHp:T.wallHp, flash:0, dead:false }); ring(LANE(lane), FIELD_TOP + 0.55 * (FIELD_BOT - FIELD_TOP), 40, 'rgba(200,180,220,.9)'); addFloat('A wall rises', m.x, mY(m) - m.r - 30, '#d8cfe0', 16, 1); }
    }
  }
  m.healT -= dt;
  if (m.healT <= 0){   // healing trance: the player must land N hits to break it
    m.healT = m.form === 2 ? T.form2.healEvery : T.healEvery;
    m.healing = true; m.healHits = T.healHits[Math.floor(Math.random() * T.healHits.length)];
    addFloat(`Healing: hit it ×${m.healHits}`, m.x, mY(m) - m.r - 34, '#ff6a6a', 18, 1.4); SFX.boss();
    return true;
  }
  return false;
}
