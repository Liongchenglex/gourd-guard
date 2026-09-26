import { expandLevel } from '../levels.js';
import { PTYPES, NTYPES } from '../pumpkins.js';
import { save } from '../../save.js';
import { GEAR } from '../shop.js';
import world1 from './world1.js';
import world2 from './world2.js';
import world3 from './world3.js';
import world4 from './world4.js';
import world5 from './world5.js';
import world6 from './world6.js';

// Background themes (index = LevelDef.theme). Drawn by buildBg() in src/engine/render/sprites.js.
//   sky: [top, middle, horizon] gradient    ground: [field top, field bottom]    grass: tuft / reed colour
//   moon: disc colour   halo: moon glow colour   sil: [far ridge, near prop] silhouette tones   rim: rim light on props
//   soil: [cell top, cell bottom, patch base] for the pumpkin patch cells   mist: ground-mist colour (null for none)
export const WORLDS = [
  { name:'Pumpkin Patch', sky:['#110a20','#3d1a3e','#b0552f'], ground:['#3d2630','#1c1216'], grass:'#4e3340',
    moon:'#ffcf72', halo:'#ff9a3a', sil:['#2d1637','#0f0716'], rim:'#ffb070', soil:['#7a4a2c','#4b2a17','#2a160a'], mist:null },
  { name:'Foggy Hollow', sky:['#08111c','#193038','#5d7d75'], ground:['#1e3030','#0f1a1a'], grass:'#2f5a48',
    moon:'#e9fbff', halo:'#9fd8d0', sil:['#1d3235','#0b1517'], rim:'#bfe8dc', soil:['#4b5a3c','#2b3522','#151d15'], mist:'#b9d8cf' },
  { name:'Crumbling Keep', sky:['#0f0509','#3c0c16','#8e2a1a'], ground:['#3a2c33','#1a1317'], grass:'#3f2d33',
    moon:'#ff6a48', halo:'#c02a20', sil:['#2c1119','#120609'], rim:'#ff9a78', soil:['#5a4a52','#372b31','#1c1418'], mist:null },
  { name:'Drowned Marsh', sky:['#05161e','#0f3a44','#2f8a80'], ground:['#4a4a3a','#1d2420'], grass:'#3a6a58',
    moon:'#dcfff5', halo:'#5fd0bc', sil:['#0f2c30','#071619'], rim:'#a8f0e0', soil:['#77704f','#48432d','#211f16'], mist:'#a8d8d0' },
  { name:'Witchwood', sky:['#150818','#3f1630','#a8522c'], ground:['#3a2418','#1a1009'], grass:'#5a3a22',
    moon:'#dcc0ff', halo:'#8a48d0', sil:['#331226','#12060e'], rim:'#e0a8ff', soil:['#6c4028','#43261a','#24130a'], mist:null },
];

/** Display names for the six worlds (docs/WORLDS.md §3). Worlds without levels yet show as "coming soon". */
export const WORLD_NAMES = ['Pumpkin Patch', 'Foggy Hollow', 'Witchwood', 'Crumbling Keep', 'Drowned Marsh', "Hallow's End"];   // order changed by the owner 2026-09-25

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

/** Night on which a consumable tool (GEAR key) is introduced, or Infinity if no level introduces it yet. */
export function gearUnlockNightOf(key){
  const i = ALL_LEVELS.findIndex(d => (d.unlockGear || []).includes(key));
  return i < 0 ? Infinity : i + 1;
}

/** Consumable tool keys introduced by night n (shown in the HUD and shop, and droppable from kills). */
export function toolsForNight(n){
  return GEAR.filter(g => g.consumable && gearUnlockNightOf(g.key) <= n).map(g => g.key);
}

/** Pumpkin type indices available on night n: the starting pair plus every type unlocked by a level ≤ n. */
export function typesForNight(n){
  return [...Array(NTYPES).keys()].filter(t => t < 1 || unlockNightOf(PTYPES[t].key) <= n);   // only Green from the start; Yellow unlocks at 1-2 (owner)
}

/** Is story night n open to play? Level 1 of a world opens when the previous world's level 10 has been beaten;
 *  every other level opens when the level before it has been beaten. */
export function isOpen(n){
  const d = ALL_LEVELS[n - 1];
  if (!d) return false;
  if (save.testUnlock) return true;   // TESTING ONLY: remove before release
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
