import { BOSS_NAME, BOSS_NAMES, BOSS_INTRO } from '../data/monsters.js';
import { WORLDS, levelFor } from '../data/worlds/index.js';
import { SFX } from './audio.js';
import { spawnMonster } from './monsters.js';
import { buildBg } from './render/sprites.js';
import { G } from './state.js';
import { rnd } from './util.js';
import { banner } from '../ui/hud.js';

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
    spawnMonster(G.spawned >= 1 && G.introQueue.length ? G.introQueue.shift() : pickFrom(d.pool));
    G.spawned++;
    G.spawnTimer = d.interval * rnd(0.6, 1.4);
    if (Math.random() < 0.18) G.spawnTimer *= 0.3;
  }
  if (d.boss && !G.bossSpawned && G.spawned >= Math.floor(d.total * 0.4)){
    spawnMonster('boss'); G.bossSpawned = true;
    banner(BOSS_NAMES[d.boss] || 'Boss', (BOSS_INTRO[d.boss] || {})[d.bossForm] || 'Monsters keep coming until it falls.', 3); SFX.bossAlert(); setTimeout(() => SFX.bossSfx(d.boss, 'arrive'), 900);
  }
}

export function endlessSpawn(dt){
  G.diff = 1 + G.t / 25;
  G.spawnTimer -= dt;
  if (G.spawnTimer <= 0){
    spawnMonster(pickFrom(levelFor(Math.min(12, Math.floor(G.diff) + 2)).pool));
    G.spawnTimer = Math.max(0.9, 3.2 - G.diff * 0.15) * rnd(0.6, 1.4);
  }
  G.bossTimer -= dt;
  if (G.bossTimer <= 0){ spawnMonster('boss'); G.bossTimer = 100; banner(BOSS_NAME, 'It rises from the graves.', 2.4); SFX.bossSfx('gravekeeper', 'arrive'); }
  const w = G.t > 240 ? 2 : G.t > 120 ? 1 : 0;
  if (w !== G.world){ G.world = w; buildBg(w); banner(WORLDS[w].name, 'The night gets darker.', 2.2); }
}
