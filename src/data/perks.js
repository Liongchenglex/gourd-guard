// Level-20 perks (docs/WORLDS.md "Level-20 perks"): beating a world's last level grants a permanent bonus.
// Each can be switched off in the pause menu (save.perksOff[key] = true).
import { save } from '../save.js';

export const PERKS = [
  { key:'smash',   world:1, name:'Quick smash',     desc:'Hold a pumpkin for 0.35 s instead of 0.6 s to smash it.' },
  { key:'sprout',  world:2, name:'Eager sprouts',   desc:'Pumpkins sprout 1 second sooner.' },
  { key:'triple',  world:3, name:'Bumper crop',     desc:'Half of all sprouts bring 3 pumpkins instead of 2.' },
  { key:'rainbow', world:4, name:'Rainbow harvest', desc:'Rainbow pumpkins appear 10% of the time instead of 3%.' },
  { key:'pick4',   world:5, name:'Focused patch',   desc:'You may bring 4 colours instead of 5.' },
];

/** Night index of the level that grants a perk (level 20 of its world). */
export const perkNight = p => p.world * 20;

/** Earned = that world's level 20 has stars. */
export function perkEarned(key){
  const p = PERKS.find(x => x.key === key);
  return !!(p && (save.stars[perkNight(p)] || (save.testUnlock && false)));
}

/** Powers rented for the next night only (owner, 2026-09-27): coins buy one night of a power you have not won yet. Cleared when a night ends. */
export const RENT_COST = 60;
export const rented = new Set();
export const clearRentals = () => rented.clear();

/** Active = earned and not switched off, or rented for this night. */
export function perkOn(key){
  return rented.has(key) || (perkEarned(key) && !(save.perksOff && save.perksOff[key]));
}
