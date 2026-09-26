import { SPAWN_STEPS } from './data/patterns.js';
import { NTYPES, PTYPES } from './data/pumpkins.js';
import { clamp } from './engine/util.js';

export const lvOf = t => clamp(save.lv[PTYPES[t].key] || 1, 1, 5);

// ---------- Save ----------

export const SAVE_KEY = 'gourdguard.v1';

export const save = { unlocked:1, seeds:0, stars:{}, coins:0, fence:0, fw:0, repair:0, buster:0, lantern:0, mine:0, bomb:0, scarecrow:0, seenIntro:{}, perksOff:{}, best:0, muted:false, seenHelp:false, seenFlick:false, spawnEvery:5,
  lv:{ green:1, yellow:1, ice:1, fire:1, grey:1, purple:1, white:1, black:1, blue:1, pink:1, turquoise:1, brown:1 }, loadout:[0,1,2,3,4] };

try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && typeof s === 'object') Object.assign(save, s); } catch (e) {}

if (!save.lv || typeof save.lv !== 'object') save.lv = {};

for (const t of PTYPES.slice(0, NTYPES)) if (!save.lv[t.key]) save.lv[t.key] = 1;

if (!SPAWN_STEPS.includes(save.spawnEvery)) save.spawnEvery = 5;

if (typeof save.repair !== 'number') save.repair = 0;

if (!save.seenIntro || typeof save.seenIntro !== 'object') save.seenIntro = {};

if (!save.perksOff || typeof save.perksOff !== 'object') save.perksOff = {};

if (typeof save.buster !== 'number') save.buster = 0;

for (const k of ['lantern', 'mine', 'bomb', 'scarecrow']) if (typeof save[k] !== 'number') save[k] = 0;

// Old upgrades were replaced by pumpkin levels: refund what was spent on them.

if (save.knife || save.oil){
  const k = [25,50,90,140,200].slice(0, save.knife || 0), o = [35,70,120].slice(0, save.oil || 0);
  save.coins += [...k, ...o].reduce((a, b) => a + b, 0); save.knife = 0; save.oil = 0; save.refunded = true;
}

if (save.seenHelp && !save.seenPowers){ save.seenHelp = false; }

save.seenPowers = true;

export function persist(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
