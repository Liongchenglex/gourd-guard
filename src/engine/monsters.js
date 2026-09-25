import { TYPES } from '../data/monsters.js';
import { BURN_EVERY } from '../data/pumpkins.js';
import { SFX } from './audio.js';
import { chunk, damage } from './combat.js';
import { COLS, CS, FENCE_Y, FIELD_BOT, FIELD_TOP, G, LANE } from './state.js';
import { clamp, rnd } from './util.js';
import { damageWall } from './walls.js';

// ---------- Monsters ----------

export function mY(m){ return FIELD_TOP + clamp(m.p, -0.1, 1.05) * (FIELD_BOT - FIELD_TOP); }

export function mS(m){ return 0.85 + 0.2 * clamp(m.p, 0, 1); }

export const TILE_P = () => CS / (FIELD_BOT - FIELD_TOP);

export function spMulNow(){ return G.mode === 'story' ? G.def.spMul : 0.85 + (G.diff - 1) * 0.015; }

export function hpExtra(){ return G.mode === 'story' ? 0 : Math.min(2, Math.floor((G.diff - 1) / 10)); }

export function lanesOf(m){ return m.type === 'boss' ? [2, 3, 4] : [m.lane]; }

export function pickLane(){
  const busy = new Set(G.monsters.filter(m => m.p < 0.15).map(m => m.lane));
  const all = [...Array(COLS).keys()], free = all.filter(l => !busy.has(l));
  const arr = free.length ? free : all;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function spawnMonster(type, lane, minion, p){
  const T = TYPES[type];
  let hp = T.hp + (type === 'imp' || type === 'brute' || type === 'wraith' ? hpExtra() : 0);
  if (type === 'boss') hp = T.hp + 4 * G.world;
  if (lane == null) lane = type === 'boss' ? 3 : pickLane();
  const x = LANE(lane);
  const m = { type, lane, x, tx:x, p:p != null ? p : -0.02, hp, maxHp:hp, r:T.r, hw:type === 'boss' ? 84 : CS * 0.42,
    sp:T.sp * spMulNow() * rnd(0.92, 1.08), coins:T.coins, eat:T.eat, pts:T.pts, drop:T.drop, ph:Math.random() * 10, age:0, flash:0,
    slowT:0, frozenT:0, burnLeft:0, burnAmt:0, burnTick:0, kb:0, eating:false, dead:false, minion:!!minion, summon:4, hop:0, drift:rnd(2.5, 4.5) };
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

export function updateMonster(m, dt){
  m.age += dt; m.ph += dt;
  if (m.flash > 0) m.flash -= dt;
  let sp = m.sp;
  if (m.frozenT > 0){ m.frozenT -= dt; sp = 0; }
  else if (m.slowT > 0){ m.slowT -= dt; sp *= 0.5; }
  if ((m.frozenT > 0 || m.slowT > 0) && Math.random() < dt * 5) G.parts.push({ x:m.x + rnd(-m.r, m.r), y:mY(m) + rnd(-m.r, m.r), vx:0, vy:20, t:0, life:0.8, size:2.5, color:'#bfefff', kind:'dot', grav:0 });
  if (m.burnLeft > 0){
    m.burnTick -= dt;
    if (Math.random() < dt * 16) G.parts.push({ x:m.x + rnd(-m.r * 0.6, m.r * 0.6), y:mY(m) + rnd(-4, 10), vx:rnd(-10, 10), vy:-rnd(50, 90), t:0, life:0.5, size:rnd(3, 6), color:'#ff8a3a', kind:'flame', grav:0 });
    if (m.burnTick <= 0){ m.burnLeft--; m.burnTick = BURN_EVERY; damage(m, m.burnAmt, '#ff9a4a', true); if (m.dead) return; }
  }
  if (m.kb > 0){
    const st = Math.min(m.kb, dt * 2.2);
    m.p = Math.max(-0.05, m.p - st); m.kb -= st;
    return;
  }
  if (m.eating){
    const mul = m.frozenT > 0 ? 0 : m.slowT > 0 ? 0.5 : 1;
    for (const c of lanesOf(m)) damageWall(c, m.eat * mul * dt);
    if (mul > 0){ SFX.chomp(); if (Math.random() < dt * 5) chunk(m.x + rnd(-10, 10), FENCE_Y - 18, '#8a6440', 90); }
    return;
  }
  if (m.frozenT <= 0){
    switch (m.type){
      case 'bat': m.x = m.tx + Math.sin(m.ph * 3) * 6; break;
      case 'imp': { const h = Math.max(0, Math.sin(m.ph * 4.5)); sp *= 0.25 + 2.2 * h; m.hop = h; m.x = m.tx; break; }
      case 'wraith':
        m.drift -= dt;
        if (m.drift <= 0 && m.p > 0.05 && m.p < 0.85){
          m.drift = rnd(3.2, 5);
          const opts = [m.lane - 1, m.lane + 1].filter(l => l >= 0 && l < COLS);
          m.lane = opts[Math.floor(Math.random() * opts.length)]; m.tx = LANE(m.lane);
        }
        m.x += (m.tx - m.x) * Math.min(1, dt * 3.5);
        break;
      case 'boss':
        m.summon -= dt;
        if (m.summon <= 0 && m.p > 0.05 && G.world > 0){ m.summon = 14; spawnMonster('bat', [1, 5][Math.floor(Math.random() * 2)], true, m.p + 0.03); }
        break;
      default: m.x = m.tx + Math.sin(m.ph * 1.6) * 2;
    }
  }
  const np = Math.min(m.p + sp * dt, aheadLimit(m));
  if (np > m.p) m.p = np;
  if (m.p >= 1){ m.p = 1; m.eating = true; }
}
