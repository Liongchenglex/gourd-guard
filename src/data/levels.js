/**
 * Level definition schema (v1: exactly what the prototype needs; Release 1 fields are added later,
 * see docs/WORLDS.md §9).
 *
 * @typedef {Object} LevelDef
 * @property {number} world     1-based world number (address is `${world}-${level}`)
 * @property {number} level     1-based level inside the world
 * @property {number} theme     background/world theme index into WORLDS (0..2 today)
 * @property {number} pattern   index into PATTERNS (starting pumpkin layout)
 * @property {number} graves    number of grave cells placed on empty pattern cells
 * @property {number} total     monsters to spawn (excluding the boss)
 * @property {number} interval  base seconds between spawns (jittered at runtime)
 * @property {number} spMul     monster speed multiplier
 * @property {boolean} boss     whether the boss spawns this level
 * @property {Array<[string, number]>} pool  weighted monster pool [type, weight]
 */

/** Expand a LevelDef into the runtime shape the engine reads (identical to the old levelDef(n) result). */
export function expandLevel(def, n){
  return { n, world:def.theme, total:def.total, interval:def.interval, spMul:def.spMul,
    boss:def.boss, pool:def.pool.map(([t, w]) => [t, w]), pattern:def.pattern, graves:def.graves };
}
