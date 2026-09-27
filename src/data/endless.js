// Endless Night (owner, 2026-09-27): one night that never ends. It is split into "hours" (milestones); each hour
// brings in the next world's monsters, speeds things up, and marks the hour with a Loot Sack or a boss. From
// FRENZY_HOUR the spawn rate goes crazy. Every number here is a first guess for the owner to try and tune.

export const HOUR_SECONDS = 45;   // one milestone

/** What joins at each hour. `theme` is the world whose scenery the field switches to (story order 1-5). */
export const TIERS = [
  { name:'Pumpkin Patch',   join:'Hold the walls as long as you can.', world:1, monsters:[['ghoul', 10], ['bat', 5], ['imp', 5]] },
  { name:'Pumpkin Patch',   join:'Mossbacks and mummies join the night.', world:1, monsters:[['brute', 4], ['mummy', 4]] },
  { name:'Foggy Hollow',    join:'The Foggy Hollow crowd creeps in.', world:2, monsters:[['bogGhoul', 6], ['wisp', 4], ['wraith', 4], ['swiftBat', 4], ['rider', 3], ['marshImp', 4], ['doctor', 2]] },
  { name:'Witchwood',       join:'Witchwood monsters join the night.', world:3, monsters:[['woodGhoul', 6], ['broomImp', 4], ['owlBat', 4], ['chameleon', 3], ['rchameleon', 3], ['mirror', 2], ['witch', 2]] },
  { name:'Crumbling Keep',  join:'The Crumbling Keep marches out.', world:4, monsters:[['cryptGhoul', 6], ['keepImp', 4], ['knight', 4], ['hauler', 2], ['archer', 3], ['siegeBrute', 3], ['vampire', 2]] },
  { name:'Drowned Marsh',   join:'The marsh floods: puddles open.', world:5, monsters:[['drownedGhoul', 6], ['tideImp', 4], ['crawler', 4], ['sailor', 3], ['bogTurtle', 3], ['slime', 3], ['diver', 2], ['soddenMummy', 3]], puddles:3 },
  { name:'The deep night',  join:'The fiercest monsters of every world arrive.', world:null, monsters:[['firemummy', 2], ['fogwalker', 2], ['bulwark', 2], ['turtle', 2]] },
];
/** Said on hours that bring nothing new. */
export const QUIET_HOUR = 'Faster and fiercer.';
/** Older tiers fade as new ones arrive, so the newest world's monsters dominate: weight × OLD_FADE per tier back (never below OLD_MIN). */
export const OLD_FADE = 0.65, OLD_MIN = 0.3;

/** Hour events: a Loot Sack on odd hours, a boss on even ones (cycling all five; second time round in form 2).
 *  A boss only rises if the last one has fallen; otherwise that hour brings a Loot Sack instead. */
export const SACK_HOURS = h => h % 2 === 1;
export const BOSS_ORDER = ['gravekeeper', 'poltergeist', 'hexwitch', 'vampirecount', 'twintides'];
export const BOSS_EVERY = 2, BOSS_FROM = 2;   // hours 2, 4, 6, ...
export const bossForHour = h => (h < BOSS_FROM || (h - BOSS_FROM) % BOSS_EVERY) ? null : BOSS_ORDER[((h - BOSS_FROM) / BOSS_EVERY) % BOSS_ORDER.length];
export const bossFormForHour = h => Math.floor((h - BOSS_FROM) / BOSS_EVERY / BOSS_ORDER.length) >= 1 ? 2 : 1;

/** Pacing. Gap between spawns: GAP_START × GAP_DECAY^hour, never below GAP_MIN; then × FRENZY_GAP from FRENZY_HOUR. */
export const GAP_START = 3.0, GAP_DECAY = 0.9, GAP_MIN = 1.2;
export const BURST = 0.15;                       // chance the next spawn comes almost at once
export const FRENZY_HOUR = 8, FRENZY_GAP = 0.45, FRENZY_BURST = 0.35;
/** Walking speed multiplier: SPEED_START + SPEED_STEP per hour, capped; the frenzy adds FRENZY_SPEED. */
export const SPEED_START = 0.8, SPEED_STEP = 0.025, SPEED_MAX = 1.1, FRENZY_SPEED = 0.06;
/** Extra health on imps, mossbacks and wisps: +1 from hour 6, +2 from hour 10. */
export const hpExtraForHour = h => h >= 10 ? 2 : h >= 6 ? 1 : 0;
/** Score bonus for reaching each hour. */
export const HOUR_BONUS = 100;
/** Puddles added every 2 hours once the Drowned Marsh has joined, up to this many. */
export const PUDDLES_MAX = 5;
