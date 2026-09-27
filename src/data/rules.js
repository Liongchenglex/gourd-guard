// Release 1 ground rules (docs/WORLDS.md §2). Numbers here are the only place these rules live.

/** Seconds between sprouts. Fixed (owner, 2026-09-27): no longer adjustable in the pause menu; the Eager sprouts power shortens it. */
export const SPROUT_EVERY = 5;

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
