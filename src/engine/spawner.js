import { BOSS_NAME, BOSS_NAMES, BOSS_INTRO } from '../data/monsters.js';
import { WORLDS, levelFor, ALL_LEVELS } from '../data/worlds/index.js';
import * as E from '../data/endless.js';
import { PTYPES } from '../data/pumpkins.js';
import { SFX } from './audio.js';
import { spawnMonster, spawnSack } from './monsters.js';
import { buildBg } from './render/sprites.js';
import { G, COLS } from './state.js';
import { rnd, shuffle } from './util.js';
import { banner } from '../ui/hud.js';
import { SPAWN_GAP, SPAWN_BURST, SPAWN_BURST_EARLY, SPAWN_LATE_FROM } from '../data/rules.js';
import { musicStart } from './audio.js';

export function pickFrom(pool){
  let tot = 0; for (const [, w] of pool) tot += w;
  let r = Math.random() * tot;
  for (const [t, w] of pool){ r -= w; if (r <= 0) return t; }
  return pool[0][0];
}

export function storySpawn(dt){
  const d = G.def;
  G.spawnTimer -= dt;
  const keepComing = d.boss && G.bossSpawned && !G.bossDead;   // boss levels: monsters keep coming until the boss dies
  if ((G.spawned < d.total || keepComing) && G.spawnTimer <= 0){
    if (!G.introQueue) G.introQueue = d.intro.filter(k => d.pool.some(([t]) => t === k));   // every monster this level introduces shows up at least once, early
    const counts = G.spawnCounts = G.spawnCounts || {};
    const pool = d.caps ? d.pool.filter(([t]) => (counts[t] || 0) < (d.caps[t] == null ? Infinity : d.caps[t])) : d.pool;   // per-type caps (owner: "only 2 haulers")
    const t = G.spawned >= 1 && G.introQueue.length ? G.introQueue.shift() : pickFrom(pool.length ? pool : d.pool);
    counts[t] = (counts[t] || 0) + 1; spawnMonster(t);
    G.spawned++;
    const late = d.levelNo >= SPAWN_LATE_FROM;   // the harder half of each world is spaced out (owner)
    const gap = d.spawnGap != null ? d.spawnGap : late ? SPAWN_GAP : 1, burst = d.spawnBurst != null ? d.spawnBurst : late ? SPAWN_BURST : SPAWN_BURST_EARLY;   // per-level overrides win
    G.spawnTimer = d.interval * gap * rnd(0.6, 1.4);
    if (Math.random() < burst) G.spawnTimer *= 0.3;
  }
  if (d.boss && !G.bossSpawned && (G.spawned >= Math.floor(d.total * 0.4) || (G.bossHp && G.bossHp.length))){   // a continued night brings its hurt boss straight back
    const b = spawnMonster('boss'); G.bossSpawned = true;
    if (G.bossHp && G.bossHp.length){ const bs = b.twin ? [b, b.twin] : [b]; bs.forEach((m, i) => { const hp = G.bossHp[Math.min(i, G.bossHp.length - 1)]; m.hp = Math.min(m.maxHp, hp); }); G.bossHp = null; }   // a continued night: the boss keeps the health it had left
    banner(BOSS_NAMES[d.boss] || 'Boss', (BOSS_INTRO[d.boss] || {})[d.bossForm] || 'Monsters keep coming until it falls.', 3); SFX.bossAlert(); setTimeout(() => SFX.bossSfx(d.boss, 'arrive'), 900); setTimeout(() => { if (G && !G.over && G.mode === 'story') musicStart('boss'); }, 1600);   // stakes rise: the boss track takes over (owner)
  }
}

/** Endless Night (owner, 2026-09-27): hours as milestones, monsters from every world, bosses and Loot Sacks on the hour,
 *  a frenzy from FRENZY_HOUR. All numbers live in src/data/endless.js. */
const teamHas = key => G.loadout.some(t => PTYPES[t] && PTYPES[t].key === key);   // e.g. no Fire in the team: no mummies
function endlessPool(h){
  const top = Math.min(h, E.TIERS.length - 1), pool = [];
  for (let k = 0; k <= top; k++){
    const f = Math.max(E.OLD_MIN, Math.pow(E.OLD_FADE, top - k));
    for (const [key, w] of E.TIERS[k].monsters) if (!E.NEEDS[key] || teamHas(E.NEEDS[key])) pool.push([key, w * f]);
  }
  return pool;
}
const themeOf = w => { const d = ALL_LEVELS.find(x => x.world === w); return d ? d.theme : 0; };   // raw level data: world = story order, theme = scenery
function endlessPuddles(n){
  const free = shuffle([...Array(COLS).keys()].filter(l => !G.puddles.some(p => p.lane === l)));
  for (const lane of free.slice(0, n)) G.puddles.push({ lane, p:rnd(0.3, 0.62) });
}
function startHour(h){
  G.hour = h; G.frenzy = h >= E.FRENZY_HOUR;
  const tier = E.TIERS[h], notes = [];
  if (tier){
    if (tier.world){ const th = themeOf(tier.world); if (th !== G.world){ G.world = th; buildBg(th); } }
    notes.push(tier.join);
    if (tier.puddles) endlessPuddles(tier.puddles);
  }
  const pudTier = E.TIERS.findIndex(t => t.puddles);
  if (!tier && pudTier >= 0 && h > pudTier && (h - pudTier) % 2 === 0 && G.puddles.length < E.PUDDLES_MAX) endlessPuddles(1);
  if (h){ G.score += E.HOUR_BONUS * h; }
  const boss = E.bossForHour(h), bossUp = G.monsters.some(m => m.type === 'boss' && !m.dead);
  if (boss && !bossUp){
    G.endBoss = boss; G.endForm = E.bossFormForHour(h);
    if (boss === 'twintides') G.sea = true;   // the twins need their sea row
    spawnMonster('boss'); G.bossAlive = true;
    notes.push(`${G.endForm === 2 ? 'A stronger ' + BOSS_NAMES[boss].replace(/^The /, '') : BOSS_NAMES[boss]} ${boss === 'twintides' ? 'rise' : 'rises'}!`);
    SFX.bossAlert(); setTimeout(() => SFX.bossSfx(boss, 'arrive'), 900); setTimeout(() => { if (G && !G.over && G.mode === 'endless') musicStart('boss'); }, 1600);
  } else if (h && (E.SACK_HOURS(h) || boss)){ spawnSack(); }   // a boss hour with the last boss still up brings a sack instead
  if (h === E.FRENZY_HOUR){ notes.unshift('The frenzy begins!'); musicStart('boss'); }
  if (!notes.length) notes.push(E.QUIET_HOUR);
  banner(h === E.FRENZY_HOUR ? 'Frenzy!' : `Hour ${h + 1}`, notes.join(' '), 3);
}
export function endlessSpawn(dt){
  if (G.hour == null) startHour(0);
  const h = Math.floor(G.t / E.HOUR_SECONDS);
  if (h > G.hour) startHour(h);
  if (G.bossAlive && !G.monsters.some(m => m.type === 'boss' && !m.dead)){ G.bossAlive = false; if (!G.frenzy) musicStart('play'); }   // back to the night music once the boss falls
  G.spawnTimer -= dt;
  if (G.spawnTimer <= 0){
    spawnMonster(pickFrom(endlessPool(G.hour)));
    let gap = Math.max(E.GAP_MIN, E.GAP_START * Math.pow(E.GAP_DECAY, G.hour));
    if (G.frenzy) gap *= E.FRENZY_GAP;
    G.spawnTimer = gap * rnd(0.6, 1.4);
    if (Math.random() < (G.frenzy ? E.FRENZY_BURST : E.BURST)) G.spawnTimer *= 0.3;
  }
}
