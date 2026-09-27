// ---------- Loot: treasure chests, seeds and boss items (owner's monetization.md, 2026-09-27) ----------
// Chests found in a night are saved at once (save.chests) so quitting never loses them; they are opened from the
// result screen or the shop. Seeds found in a night are banked at once too.
import { CHESTS, TOOL_SET, TOOL_OVERFLOW_COINS, BOSS_ITEMS_FOR_COSTUME } from '../data/economy.js';
import { GEAR } from '../data/shop.js';
import { toolsForNight, highestOpen } from '../data/worlds/index.js';
import { persist, save } from '../save.js';
import { G } from './state.js';

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const night = () => (G && G.loot ? G.loot : null);
function tally(key, n){ if (G){ if (!G.loot) G.loot = { chests:0, seeds:0 }; G.loot[key] += n; } }

/** A chest found now: kind 'normal' or 'boss'; boss = the boss kind whose item it may hold. */
export function addChest(kind, boss = null){ save.chests.push({ kind, boss }); persist(); tally('chests', 1); }
export function addSeeds(n){ save.seeds = (save.seeds || 0) + n; persist(); tally('seeds', n); }
export const foundThisNight = () => night() || { chests:0, seeds:0 };

/** Tools the player may receive: every tool introduced so far. */
const openTools = () => { const open = toolsForNight(highestOpen()); return GEAR.filter(g => g.consumable && open.includes(g.key)); };

/** Roll a chest's rewards (not yet granted). */
export function rollChest(chest){
  const C = CHESTS[chest.kind] || CHESTS.normal, out = [];
  for (let i = 0; i < C.slots; i++){
    const r = Math.random();
    if (chest.boss && r < C.bossItem) out.push({ type:'bossItem', boss:chest.boss, n:1 });
    else if (r < C.bossItem + C.seed) out.push({ type:'seeds', n:1 });
    else if (r < C.bossItem + C.seed + C.tools && openTools().length) out.push(toolSet());
    else out.push({ type:'coins', n:ri(C.coins[0], C.coins[1]) });
  }
  return out;
}
export function toolSet(){
  const pool = openTools(), items = {};
  for (let i = 0; i < TOOL_SET; i++){ const g = pool[Math.floor(Math.random() * pool.length)]; items[g.key] = (items[g.key] || 0) + 1; }
  return { type:'tools', items };
}
/** Grant rolled rewards; returns the coins paid for tools past their carry limit. */
export function grant(rewards){
  let overflow = 0;
  for (const r of rewards){
    if (r.type === 'coins') save.coins += r.n;
    else if (r.type === 'seeds') save.seeds = (save.seeds || 0) + r.n;
    else if (r.type === 'bossItem') save.bossItems[r.boss] = (save.bossItems[r.boss] || 0) + r.n;
    else if (r.type === 'tools') for (const [k, n] of Object.entries(r.items)){
      const g = GEAR.find(x => x.key === k), room = Math.max(0, g.max - (save[k] || 0)), got = Math.min(room, n);
      save[k] = (save[k] || 0) + got; overflow += (n - got) * TOOL_OVERFLOW_COINS;
    }
  }
  save.coins += overflow; persist(); return overflow;
}
export const bossItemsFor = boss => save.bossItems[boss] || 0;
export const costumeReady = boss => bossItemsFor(boss) >= BOSS_ITEMS_FOR_COSTUME;

/** The Loot Sack queued by an ad on the level card, taken by the next night that starts. */
let sackQueued = false;
export const queueSack = () => { sackQueued = true; };
export const sackIsQueued = () => sackQueued;
export function takeSack(){ const q = sackQueued; sackQueued = false; return q; }
