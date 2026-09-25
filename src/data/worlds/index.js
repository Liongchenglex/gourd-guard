import { expandLevel } from '../levels.js';
import world1 from './world1.js';
import world2 from './world2.js';
import world3 from './world3.js';
import world4 from './world4.js';
import world5 from './world5.js';
import world6 from './world6.js';

// Background themes (index = LevelDef.theme).
export const WORLDS = [
  { name:'The Pumpkin Patch', sky:['#170d2a','#46213f','#a9523a'], ground:['#2b1b2a','#1a1219'], moon:'#ffe6ad', grass:'#3a2436' },
  { name:'Crooked Graveyard', sky:['#0a1322','#1b3145','#4d6b67'], ground:['#1a2427','#10171a'], moon:'#e2f4ff', grass:'#233236' },
  { name:'Hollow Manor',      sky:['#12060c','#3a0f1c','#86291d'], ground:['#271417','#170b0e'], moon:'#ffb893', grass:'#3a1c20' },
];

export const WORLD_LEVELS = [world1, world2, world3, world4, world5, world6];

// Flat list of every level in play order. Story night n (1-based) is ALL_LEVELS[n - 1].
export const ALL_LEVELS = WORLD_LEVELS.flat();

export const LEVELS = ALL_LEVELS.length;

/** Runtime level definition for story night n (1-based). */
export function levelFor(n){ return expandLevel(ALL_LEVELS[n - 1], n); }
