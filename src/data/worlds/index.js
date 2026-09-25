import { expandLevel } from '../levels.js';
import { PTYPES, NTYPES } from '../pumpkins.js';
import { save } from '../../save.js';
import world1 from './world1.js';
import world2 from './world2.js';
import world3 from './world3.js';
import world4 from './world4.js';
import world5 from './world5.js';
import world6 from './world6.js';

// Background themes (index = LevelDef.theme).
export const WORLDS = [
  { name:'Pumpkin Patch', sky:['#170d2a','#46213f','#a9523a'], ground:['#2b1b2a','#1a1219'], moon:'#ffe6ad', grass:'#3a2436' },
  { name:'Crooked Graveyard', sky:['#0a1322','#1b3145','#4d6b67'], ground:['#1a2427','#10171a'], moon:'#e2f4ff', grass:'#233236' },
  { name:'Hollow Manor',      sky:['#12060c','#3a0f1c','#86291d'], ground:['#271417','#170b0e'], moon:'#ffb893', grass:'#3a1c20' },
];

/** Display names for the six worlds (docs/WORLDS.md §3). Worlds without levels yet show as "coming soon". */
export const WORLD_NAMES = ['Pumpkin Patch', 'Foggy Hollow', 'Crumbling Keep', 'Drowned Marsh', 'Witchwood', "Hallow's End"];

export const WORLD_LEVELS = [world1, world2, world3, world4, world5, world6];

// Flat list of every level in play order. Story night n (1-based) is ALL_LEVELS[n - 1].
export const ALL_LEVELS = WORLD_LEVELS.flat();

export const LEVELS = ALL_LEVELS.length;

/** Runtime level definition for story night n (1-based global index). */
export function levelFor(n){ return expandLevel(ALL_LEVELS[n - 1], n); }

/** Global index of the first level of world w (1-based), or null if that world has no levels yet. */
export function firstNightOf(w){
  let n = 1;
  for (let i = 0; i < w - 1; i++) n += WORLD_LEVELS[i].length;
  return WORLD_LEVELS[w - 1] && WORLD_LEVELS[w - 1].length ? n : null;
}

/** Night on which a pumpkin key unlocks (global index), or Infinity if no level unlocks it yet. */
export function unlockNightOf(key){
  const i = ALL_LEVELS.findIndex(d => (d.unlockPumpkins || []).includes(key));
  return i < 0 ? Infinity : i + 1;
}

/** Pumpkin type indices available on night n: the starting pair plus every type unlocked by a level ≤ n. */
export function typesForNight(n){
  return [...Array(NTYPES).keys()].filter(t => t < 2 || unlockNightOf(PTYPES[t].key) <= n);
}

/** Is story night n open to play? Level 1 of a world opens when the previous world's level 10 has been beaten;
 *  every other level opens when the level before it has been beaten. */
export function isOpen(n){
  const d = ALL_LEVELS[n - 1];
  if (!d) return false;
  if (d.level === 1){
    if (d.world === 1) return true;
    const prev = firstNightOf(d.world - 1);
    return prev != null && !!save.stars[prev + 9];
  }
  return !!save.stars[n - 1];
}

/** Highest open night (kept in save.unlocked for older code and the endless-mode loadout). */
export function highestOpen(){
  let best = 1;
  for (let n = 1; n <= LEVELS; n++) if (isOpen(n)) best = n;
  return best;
}
