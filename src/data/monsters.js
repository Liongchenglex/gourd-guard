// ---------- Monsters ----------
// coins: paid only when the kill-reward roll lands on coins (bosses always pay). drop: pumpkins dropped on a pumpkin roll (rounded, min 1).
// Behaviour lives in src/engine/monsters.js; this file is numbers and text only.

export const TYPES = {
  ghoul:  { hp:1,  r:21, sp:0.055, coins:3,  eat:0.5, pts:10, drop:1 },
  bat:    { hp:1,  r:16, sp:0.085, coins:3,  eat:0.4, pts:12, drop:1 },
  imp:    { hp:2,  r:17, sp:0.074, coins:5,  eat:0.6, pts:14, drop:2 },
  brute:  { hp:4,  r:28, sp:0.028, coins:10, eat:1.1, pts:30, drop:3 },
  // Wisp (world 2): today's lane drifter, renamed. Drifts to a neighbouring column every few seconds, mid-field only.
  wisp:   { hp:2,  r:21, sp:0.05,  coins:7,  eat:0.5, pts:20, drop:2 },
  // Mummy: only Fire kills it for good; any other kill makes it collapse for `rise` seconds, then it stands back up at full health.
  mummy:  { hp:2,  r:22, sp:0.045, coins:5,  eat:0.6, pts:18, drop:2, rise:4 },
  // Wraith (world 2): fades out for `hide` seconds every `show` seconds; invisible and untargetable while hidden, keeps walking.
  wraith: { hp:2,  r:21, sp:0.05,  coins:7,  eat:0.5, pts:22, drop:2, show:4, hide:2.5 },
  // Wisp Rider (world 2): fast while its carrier lives; the first hit breaks the carrier (no damage), then it walks at `walkSp`.
  rider:  { hp:2,  r:18, sp:0.11,  coins:7,  eat:0.5, pts:24, drop:2, walkSp:0.05 },
  // Plague Doctor (world 2): slow; every `healEvery` seconds heals every other monster in its column by `heal`.
  doctor: { hp:3,  r:22, sp:0.035, coins:9,  eat:0.5, pts:26, drop:2, healEvery:2, heal:0.5 },
  // Bosses (docs/WORLDS.md §7). `boss:true`; spawned as type 'boss' with `kind` = the key. Never reach the wall.
  gravekeeper: { boss:true, hp:20, r:34, sp:0.03, coins:40, eat:0, pts:250, drop:6, hold:0.28, teleportEvery:6, summonEvery:8,
                 form2:{ hp:36, summonEvery:5.5, shoveEvery:12, shove:0.3 } },
  poltergeist: { boss:true, hp:26, r:32, sp:0.03, coins:45, eat:0, pts:280, drop:6, hold:0.25, driftEvery:5, swapEvery:8,
                 form2:{ hp:44, swapEvery:6.5, recolourEvery:12 } },
};

/** Modifiers (docs/WORLDS.md §6): data-only stat tweaks any monster can carry. */
export const MODS = {
  swift:    { name:'Swift',    desc:'40% faster',           speed:1.4 },
  stubborn: { name:'Stubborn', desc:'immune to knockback',  noKnockback:true },
  armoured: { name:'Armoured', desc:'2 more health',        hp:2 },
  hungry:   { name:'Hungry',   desc:'eats walls twice as fast', eat:2 },
};

/** Returning monsters: a base type with one modifier and a world skin. Pool entries may name a variant instead of a type. */
export const VARIANTS = {
  bogGhoul: { base:'ghoul', mod:'armoured', name:'Bog Ghoul', tint:'#4f8a6a', intro:'Bog Ghouls: the marsh made them tougher. Three hits now.' },
  marshImp: { base:'imp',   mod:'stubborn', name:'Marsh Imp', tint:'#6a8a4a', intro:'Marsh Imps dig their heels in: knockback does nothing to them.' },
  swiftBat: { base:'bat',   mod:'swift',    name:'Swift Bat', tint:'#8a5aa8', intro:'Swift Bats: faster than the ones you knew. One hit still does it.' },
};

export const BOSS_NAMES = { gravekeeper:'The Gravekeeper', poltergeist:'The Poltergeist' };
export const BOSS_NAME = BOSS_NAMES.gravekeeper;   // legacy alias used by endless mode

export const MNAME = { ghoul:'Ghoul', bat:'Bat', imp:'Imp', brute:'Mossback', wisp:'Wisp', mummy:'Mummy', wraith:'Wraith', rider:'Wisp Rider', doctor:'Plague Doctor', boss:'Boss' };

export const BOSS_INTRO = {
  gravekeeper: { 1:'It stops a third of the way down and never reaches the wall, but it teleports between lanes and raises ghouls. Monsters keep coming until it falls.',
                 2:'Its full form: more health, faster summons, and every few seconds it drags a monster forward. Monsters keep coming until it falls.' },
  poltergeist: { 1:'A ghost that drifts between lanes a quarter of the way down. Every few seconds it swaps two of your pumpkins. Monsters keep coming until it falls.',
                 2:'Its full form swaps faster and repaints a pumpkin to another of your colours every few seconds. Monsters keep coming until it falls.' },
};

export const GRAVES_INTRO = 'Graves now appear in your patch. They never move and block slides and pushes. Plan bunches around them.';
export const FOG_INTRO = 'Fog covers part of the field. Monsters inside it are invisible but still walking. Pumpkins fly through it and hit as normal. A Lantern clears it for a while.';

export const MINTRO = {
  bat:'New foe: bats. Quick, but one hit does it.',
  imp:'New foe: imps. They take 2 hits and hop in sudden bursts.',
  brute:'New foe: mossbacks. They take 4 hits and chew walls fast, but drop 3 pumpkins.',
  wisp:'New foe: wisps. They drift into the next column now and then.',
  mummy:'New foe: mummies. Only Fire finishes them. Anything else just knocks them down for a while.',
  wraith:'New foe: wraiths. They fade out for a few seconds at a time. You cannot hit what you cannot see; throw where they will be.',
  rider:'New foe: wisp riders. Fast while the wisp carries them. One hit breaks the wisp and they drop to a walk.',
  doctor:'New foe: plague doctors. Slow, but they keep healing every monster in their column. Kill them first.',
};
