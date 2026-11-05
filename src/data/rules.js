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
