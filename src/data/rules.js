// Release 1 ground rules (docs/WORLDS.md §2). Numbers here are the only place these rules live.

/** Seconds between sprouts. Fixed (owner, 2026-09-27): no longer adjustable in the pause menu; the Eager sprouts power shortens it. */
export const SPROUT_EVERY = 4;   // owner, 2026-10-07: was 5 s (Eager sprouts: 3 s, was 4)

/** Pumpkins placed per sprout tick, each in its own random empty cell. */
export const SPROUT_COUNT = 2;

/** Every non-boss kill rolls exactly one reward. Must sum to 1. */
export const KILL_REWARD = { weapon:0.10, pumpkin:0.30, coins:0.60 };

/** Story spawn pacing for the later half of each world (owner, 2026-09-27: "the amount is fine, they come too quickly";
 *  then "adjust only for later levels"). Levels from SPAWN_LATE_FROM on: gap ×SPAWN_GAP and bursts at SPAWN_BURST.
 *  Every gap is randomised ×0.6–1.4, and with the burst chance the next monster follows almost at once (gap ×0.3).
 *  Levels before that keep ×1 and an 18% burst chance. A level may override both with `spawnGap` / `spawnBurst`. */
export const SPAWN_LATE_FROM = 11;
export const SPAWN_GAP = 1.15;     // middle ground (owner, 2026-09-27: ×1.3 made most late levels too easy)
export const SPAWN_BURST = 0.14;
export const SPAWN_BURST_EARLY = 0.18;

/** Firework (owner, 2026-10-07): hits only the FIREWORK_TARGETS monsters nearest the walls, for FIREWORK_DAMAGE each; bosses are immune. */
export const FIREWORK_TARGETS = 6, FIREWORK_DAMAGE = 3;   // owner, 2026-10-08: 6 targets (was 8)

// Frenzy jukebox (World 6, owner 2026-10-31): a burst of monsters arrives the moment it drops, one every FRENZY_BURST_GAP
// seconds, then every spawn brings FRENZY_PAIR monsters while it stands.
export const FRENZY_BURST = [4, 6], FRENZY_BURST_GAP = 0.2, FRENZY_PAIR = 2;

// Emergency Pumpkins (World 6 tool, owner 2026-10-31): pumpkins dropped into empty patch cells per use.
export const EMERGENCY_N = 9;

// Fire tiles (Release 4, Nightmare Pumpkin Patch): random fires (night start, fire marks) light field tiles whose tile-row centre
// lies in this band of the field (0 = top, 1 = the fence), so a fire is never right at the spawn line or on the wall.
export const FIRE_P_RANGE = [0.25, 0.8];
// After a level's first fire mark, fire keeps spreading (owner 2026-11-05): one new random tile every FIRE_TRICKLE_EVERY s while fewer than
// FIRE_TRICKLE_MAX tiles burn on the field. A fire mark itself may light past that; the trickle then waits until Ice brings it back under.
export const FIRE_TRICKLE_EVERY = 6, FIRE_TRICKLE_MAX = 4;

// The Protector Gourd (Release 5, Nightmare Foggy Hollow; spec Part 6): every pumpkin launched from its 3×3 mends the fence of its column by
// this much as it is launched, never above full (our number, a first guess).
export const PROTECT_HEAL = 1;

// The Wartling Gourd (Release 7, Nightmare Witchwood; spec Part 5): a pumpkin launched from its 3×3 hits for WART_DMG × its damage (owner:
// double; its on-hit powers as usual). Broken in the top row of the patch, each fence above its 3×3 mends by WART_HEAL × its full health,
// never above full (owner: half). Plain numbers, so a lower build that never reads them carries nothing named.
export const WART_DMG = 2, WART_HEAL = 0.5;

// Rotten pumpkins (Release 5; spec Part 2): a rotten pumpkin heals what it hits by ROT_HEAL (owner: half a hit point, never above full health)
// and hurts by ROT_DMG only a monster that only rot can hurt (`rotOnly`: a Plague Doctor 2's square, the Lamplighter's rot mood, the Fallen
// Poltergeist's reaper phase). Per pumpkin, flat: no level or bunch-size multiplier (ROT_DMG is our number, a first guess).
export const ROT_DMG = 1.5, ROT_HEAL = 0.5;

// Poison fog on the patch (Release 5; spec Part 3): green arrows warn POISON_WARN s before it settles on 1-2 whole rows or columns, where it
// lies for the level's `poison.dur` s (POISON_DUR when a caller gives none, our number) and rots everything under it.
export const POISON_WARN = 1.5, POISON_DUR = 3;

// Potions on the field (Release 7, Nightmare Witchwood; spec Part 2; src/engine/potion.js). A monster that walks onto a potion's tile drinks
// it if it may: bulky doubles its health and full health, speed makes it walk and chew POTION_SPEED times as fast (our number), colour hexes
// it as a witch does: a Chameleon with chance POTION_COLOUR_CHAMELEON, else a Reverse Chameleon (owner: 10% / 90%). A bulky drinker is drawn
// POTION_BULKY_SCALE times as big (our call). A level's `potions.cap` defaults to POTION_CAP (our number).
// Brew marks (Release 7; spec Part 2, built like Release 4's fire marks): at each mark a swoop of BREW_CROWS [min, max] crows (minions) comes down
// random lanes and the level's potion clock is cut to BREW_CUT of itself per mark passed (our numbers).
export const BREW_CROWS = [4, 6], BREW_CUT = 0.75;
export const POTION_SPEED = 1.5, POTION_COLOUR_CHAMELEON = 0.1, POTION_BULKY_SCALE = 1.15, POTION_CAP = 6;

// Nets on the patch (Release 8, Nightmare Crumbling Keep; spec Part 2; src/engine/nets.js). At most NET_CAP nets lie on the patch at once, both
// kinds together and counting those in flight (owner); a thrown net takes NET_FLY seconds to land (our number).
export const NET_CAP = 15, NET_FLY = 0.7;
// The Crookneck Gourd (Release 8, spec Part 5; src/engine/board.js): the pumpkins in its 3×3 light and launch together, any colour, when there
// are at least CROOK_MIN of them (our call).
export const CROOK_MIN = 2;
