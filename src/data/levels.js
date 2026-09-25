/**
 * Level definition schema (Release 1). Target shape: docs/WORLDS.md §9.
 *
 * @typedef {Object} LevelDef
 * @property {number} world           1-based world number (address is `${world}-${level}`)
 * @property {number} level           1-based level inside the world
 * @property {number} theme           background theme index into WORLDS
 * @property {number} pattern         index into PATTERNS (starting pumpkin layout)
 * @property {number} graves          grave cells placed on empty pattern cells
 * @property {number} total           monsters in the wave. On a boss level, spawning continues past this until the boss dies.
 * @property {number} interval        base seconds between spawns (jittered at runtime)
 * @property {number} spMul           monster speed multiplier
 * @property {?string} boss           boss type key (TYPES) or null
 * @property {number} bossForm        1 = first form (level 10), 2 = full form (level 20)
 * @property {Array<[string, number]>} pool  weighted monster pool [type, weight]
 * @property {string[]} unlockPumpkins  pumpkin keys that unlock when this level is first played
 * @property {string[]} unlockGear      GEAR keys (consumables) introduced on this level
 * @property {string[]} intro           monster or variant keys announced on this level
 * @property {Array<[number, number]>} [fog]  fog bands as [top, bottom] fractions of the field (world 2)
 * @property {{n:number, hp:number}} [castles]  castle walls at level start: count and health each (world 3)
 */

/** Runtime shape the engine reads. `n` is the global story index (1-based across all worlds). */
export function expandLevel(def, n){
  return { n, world:def.theme, total:def.total, interval:def.interval, spMul:def.spMul,
    boss:def.boss ? def.boss : false, bossForm:def.bossForm || 1, pool:def.pool.map(([t, w]) => [t, w]),
    pattern:def.pattern, graves:def.graves, unlockPumpkins:def.unlockPumpkins || [], unlockGear:def.unlockGear || [],
    intro:def.intro || [], fog:def.fog || [], castles:def.castles || null, worldNo:def.world, levelNo:def.level, label:`${def.world}-${def.level}` };
}
