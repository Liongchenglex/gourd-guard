// Release 1 ground rules (docs/WORLDS.md §2). Numbers here are the only place these rules live.

/** Pumpkins placed per sprout tick, each in its own random empty cell. */
export const SPROUT_COUNT = 2;

/** Every non-boss kill rolls exactly one reward. Must sum to 1. */
export const KILL_REWARD = { weapon:0.10, pumpkin:0.30, coins:0.60 };
