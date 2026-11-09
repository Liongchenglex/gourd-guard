import { expandLevel } from '../levels.js';
import { GOURDS } from '../gourds.js';
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
import nightmare2 from './nightmare2.js';
import nightmare3 from './nightmare3.js';
import nightmare4 from './nightmare4.js';

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
  // Foggy Hollow: Nightmare (Release 5): the nightmare book's sickly green moon and poison fog (scene 'fogN' in render/nightmare/scenes.js); palette = that THEMES row.
  ...(__RELEASE__ >= 5 ? [{ name:'Foggy Hollow: Nightmare', sky:['#020604','#0b1f12','#2f6a3a'], ground:['#16261a','#08110a'], grass:'#132418',
    moon:'#d8ffb0', halo:'#5aff7a', sil:['#0d2014','#040a06'], rim:'#9aff9a', soil:['#3e4a2c','#232c18','#10150a'], mist:'#5ac07a', custom:'nightmare', scene:'fogN', base:1 }] : []),
  // Witchwood: Nightmare (Release 7): the nightmare book's drained, grey wood and the witch's burning window (scene 'woodN'); palette = that THEMES row.
  // `base` is the story theme whose field texture it borrows (Witchwood is theme 4 in this list; the THEMES row's base:4 says the same).
  ...(__RELEASE__ >= 7 ? [{ name:'Witchwood: Nightmare', sky:['#0c0c0e','#2a2a2e','#6a6a70'], ground:['#34343a','#141418'], grass:'#3a3a40',
    moon:'#f0f0f0', halo:'#b8b8c0', sil:['#26262c','#0c0c10'], rim:'#e0e0e8', soil:['#5a5a60','#38383e','#1a1a1e'], mist:null, custom:'nightmare', scene:'woodN', base:4 }] : []),
  // Crumbling Keep: Nightmare (Release 8): the nightmare book's thunderstorm over the keep (scene 'keepN'; rain and lightning in render/weather.js); palette = that THEMES row.
  // `base` is the story theme whose field texture it borrows (Crumbling Keep is theme 2 in this list; the THEMES row's base:2 says the same).
  ...(__RELEASE__ >= 8 ? [{ name:'Crumbling Keep: Nightmare', sky:['#03050c','#141c33','#3a4a6a'], ground:['#2a2c36','#12131a'], grass:'#2a2c36',
    moon:'#c8d4ff', halo:'#6a80c8', sil:['#10131e','#05060b'], rim:'#b8c8ff', soil:['#4a4c58','#2c2e38','#15161c'], mist:null, custom:'nightmare', scene:'keepN', base:2 }] : []),
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
export const NIGHTMARE_LEVELS = __RELEASE__ >= 8 ? [nightmare1, nightmare2, nightmare3, nightmare4] : __RELEASE__ >= 7 ? [nightmare1, nightmare2, nightmare3] : __RELEASE__ >= 5 ? [nightmare1, nightmare2] : __RELEASE__ >= 4 ? [nightmare1] : [];
export const nmNight = (w, k) => NM_BASE + 100 * (w - 1) + k;
export const isNightmare = n => n > NM_BASE;
const nmWorld = n => Math.floor((n - NM_BASE - 1) / 100) + 1, nmLevel = n => (n - NM_BASE - 1) % 100 + 1;
const nmData = n => (NIGHTMARE_LEVELS[nmWorld(n) - 1] || [])[nmLevel(n) - 1];

/** Runtime level definition for night n: a story night (1-based global index) or a nightmare night (nmNight). */
export function levelFor(n){
  const d = expandLevel(isNightmare(n) ? nmData(n) : ALL_LEVELS[n - 1], n);
  if (__RELEASE__ >= 5 && d.nightmare && !d.gourd && ownedGourds().length){ d.gourd = true; d.gourdAny = true; }   // gourdAny: made a gourd night by this rule, not by its data   // every nightmare night is a gourd night once a gourd is won (owner 2026-11-09)
  return d;
}

/** Has the player won gourd k? save.gourds, or for the Grave Gourd also N1-4 beaten (its unlock night; a save from before save.gourds counted it). */
export const gourdOwned = k => !!(save.gourds && save.gourds[k]) || (k === 'grave' && !!save.stars[nmNight(1, 4)]);
/** Every gourd this build has that the player has won, in unlock order (Release 5: any of them may go to any nightmare night, owner 2026-11-09). */
export const ownedGourds = () => __RELEASE__ >= 4 && GOURDS ? Object.keys(GOURDS).filter(gourdOwned) : [];

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

/** What world w's nightmare track still needs, or '' (Release 5: the hollow needs the Grave Gourd, which N1-4 unlocks; Release 7: the wood needs the Protector Gourd, N2-4). */
export function nmGateText(w){
  if (__RELEASE__ >= 5 && w === 2){
    if (!save.stars[firstNightOf(2) + WORLD_LEVELS[1].length - 1]) return 'Beat 2-20';
    if (!save.stars[nmNight(1, 4)]) return 'Beat Nightmare 1-4';
  }
  if (__RELEASE__ >= 7 && w === 3){   // Release 7: the wood needs the Protector Gourd, which N2-4 unlocks
    if (!save.stars[firstNightOf(3) + WORLD_LEVELS[2].length - 1]) return 'Beat 3-20';
    if (!save.stars[nmNight(2, 4)]) return 'Beat Nightmare 2-4';
  }
  if (__RELEASE__ >= 8 && w === 4){   // Release 8: the keep needs the Wartling Gourd, which N3-4 unlocks
    if (!save.stars[firstNightOf(4) + WORLD_LEVELS[3].length - 1]) return 'Beat 4-20';
    if (!save.stars[nmNight(3, 4)]) return 'Beat Nightmare 3-4';
  }
  return '';
}

/** Is story night n open to play? Level 1 of a world opens when the previous world's level 10 has been beaten
 *  (or the level its `opensAfter` names: Hallow's End opens after 5-20, owner 2026-10-31);
 *  every other level opens when the level before it has been beaten. */
export function isOpen(n){
  if (isNightmare(n)){   // nightmare level 1 opens when that world's level 20 is beaten (owner: no 5-20 gate); each win opens the next
    if (!nmData(n)) return false;
    if (save.testUnlock) return true;
    const w = nmWorld(n), f = firstNightOf(w);
    return nmLevel(n) === 1 ? f != null && !!save.stars[f + WORLD_LEVELS[w - 1].length - 1] && !nmGateText(w) : !!save.stars[n - 1];
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
