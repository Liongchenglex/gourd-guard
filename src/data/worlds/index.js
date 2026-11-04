import { expandLevel } from '../levels.js';
import { PTYPES, NTYPES } from '../pumpkins.js';
import { save } from '../../save.js';
import { GEAR } from '../shop.js';
import { BUY_PUMPKIN } from '../economy.js';
import world1 from './world1.js';
import world2 from './world2.js';
import world3 from './world3.js';
import world4 from './world4.js';
import world5 from './world5.js';
import world6, { releaseOf as w6Release } from './world6.js';
import nightmare1 from './nightmare1.js';

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
  // Hallow's End (World 6 beta): the owner's archived map (docs/archive/nightmare-worlds/), painted by hallowSky/hallowProps in
  // render/nightmare/scenes.js; `base` is the theme whose field texture it borrows.
  { name:"Hallow's End", sky:['#07030f','#2a0d3c','#d4602a'], ground:['#3a2233','#170b14'], grass:'#331d32',
    moon:'#ff9a2a', halo:'#ff7a1a', sil:['#24102f','#0b0510'], rim:'#ffb060', soil:['#7c4a2a','#4a2a18','#26140a'], mist:null, custom:'hallow', base:0 },
  // Pumpkin Patch: Nightmare (Release 4): the nightmare book's eclipse and burning barn (docs/archive/nightmare-worlds/), painted by
  // nightmareSky/nightmareAfter in render/nightmare/scenes.js; the palette matches that file's 'patchN' theme.
  ...(__RELEASE__ >= 4 ? [{ name:'Pumpkin Patch: Nightmare', sky:['#050204','#2a0806','#c2410f'], ground:['#2e1a16','#120a08'], grass:'#281512',
    moon:'#1a0808', halo:'#ff7a1a', sil:['#1a0808','#080303'], rim:'#ff8a3a', soil:['#5e3620','#3a1e10','#1a0c06'], mist:null, custom:'nightmare', scene:'patchN', base:0 }] : []),
];

/** Display names for the six worlds (docs/WORLDS.md §3). Worlds without levels yet show as "coming soon". */
export const WORLD_NAMES = ['Pumpkin Patch', 'Foggy Hollow', 'Witchwood', 'Crumbling Keep', 'Drowned Marsh', "Hallow's End"];   // order changed by the owner 2026-09-25

/** Releases (docs/RELEASES.md): __RELEASE__ is set at build time by vite.config.js (store = STORE_RELEASE, playtest = all = 999).
 *  A level ships in its `release` (default 1). Hallow's End starts in Release 2; below that the expression is constant and world6.js is dropped. */
export const RELEASE = __RELEASE__;
const inRelease = d => (d.release || 1) <= __RELEASE__;
export const W6 = __RELEASE__ >= 2;

export const WORLD_LEVELS = __RELEASE__ >= 2 ? [world1, world2, world3, world4, world5, world6.map(d => ({ release:w6Release(d), ...d })).filter(inRelease)] : [world1, world2, world3, world4, world5];

// Flat list of every level in play order. Story night n (1-based) is ALL_LEVELS[n - 1].
export const ALL_LEVELS = WORLD_LEVELS.flat();

export const LEVELS = ALL_LEVELS.length;

/** Nightmare tracks (Release 4, docs/superpowers/specs/2026-11-04-release-4-nightmare-patch-design.md): a separate set of nights,
 *  numbered from NM_BASE so they never collide with story nights. Nightmare world w, level k is night nmNight(w, k); its stars and
 *  quests live in save.stars / save.quests under that number. NIGHTMARE_LEVELS[w - 1] is world w's nightmare table. */
export const NM_BASE = 1000;
export const NM_BOOK_LEVELS = 16;   // stamps on a nightmare book page; levels not built yet show as "Coming soon"
export const NIGHTMARE_LEVELS = __RELEASE__ >= 4 ? [nightmare1] : [];
export const nmNight = (w, k) => NM_BASE + 100 * (w - 1) + k;
export const isNightmare = n => n > NM_BASE;
const nmWorld = n => Math.floor((n - NM_BASE - 1) / 100) + 1, nmLevel = n => (n - NM_BASE - 1) % 100 + 1;
const nmData = n => (NIGHTMARE_LEVELS[nmWorld(n) - 1] || [])[nmLevel(n) - 1];

/** Runtime level definition for night n: a story night (1-based global index) or a nightmare night (nmNight). */
export function levelFor(n){ return expandLevel(isNightmare(n) ? nmData(n) : ALL_LEVELS[n - 1], n); }

/** The level before night n on its own track (for "new this level" cards), or null on story night 1 and on each nightmare world's level 1. */
export function prevLevelFor(n){ return isNightmare(n) ? (nmLevel(n) > 1 ? levelFor(n - 1) : null) : n > 1 ? levelFor(n - 1) : null; }

/** The night whose unlocks (pumpkins, tools) apply on night n: story progress, never a nightmare night's number. */
export const progressNight = n => isNightmare(n) ? highestOpen() : Math.max(n, highestOpen());

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
  return [...Array(NTYPES).keys()].filter(t => t < 1 || unlockNightOf(PTYPES[t].key) <= n || (BUY_PUMPKIN[PTYPES[t].key] && save[BUY_PUMPKIN[PTYPES[t].key].flag]));   // Paint: once bought, in every level (owner)   // only Green from the start; Yellow unlocks at 1-2 (owner)
}

/** Is story night n open to play? Level 1 of a world opens when the previous world's level 10 has been beaten
 *  (or the level its `opensAfter` names: Hallow's End opens after 5-20, owner 2026-10-31);
 *  every other level opens when the level before it has been beaten. */
export function isOpen(n){
  if (isNightmare(n)){   // nightmare level 1 opens when that world's level 20 is beaten (owner: no 5-20 gate); each win opens the next
    if (!nmData(n)) return false;
    if (save.testUnlock) return true;
    const w = nmWorld(n), f = firstNightOf(w);
    return nmLevel(n) === 1 ? f != null && !!save.stars[f + WORLD_LEVELS[w - 1].length - 1] : !!save.stars[n - 1];
  }
  const d = ALL_LEVELS[n - 1];
  if (!d) return false;
  if (save.testUnlock) return true;   // TESTING ONLY: remove before release
  if (d.level === 1){
    if (d.world === 1) return true;
    const prev = firstNightOf(d.world - 1);
    return prev != null && !!save.stars[prev + (d.opensAfter || 10) - 1];
  }
  return !!save.stars[n - 1];
}

/** Highest open night (kept in save.unlocked for older code and the endless-mode loadout). */
export function highestOpen(){
  let best = 1;
  for (let n = 1; n <= LEVELS; n++) if (isOpen(n)) best = n;
  return best;
}
