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
 * @property {number} [puddles]      puddle cells placed on the field at level start (world 4)
 * @property {boolean} [sea]         sea row: the top of the field is water and every spawn surfaces from it (world 4)
 * @property {{every:number, dirs:string[], partial?:boolean}} [gust]  wind: seconds between gusts and the directions it may blow; `partial` limits each gust to 2–3 columns or rows
 * @property {Array<[number, number]>} [gravesLayout]  explicit grave cells [row, col] on the 5×7 patch (overrides `graves`)
 * @property {number[]} [laneWeights]   relative spawn weight per lane (7 numbers); lanes at 0 never spawn
 * @property {number[]} [fogRows]       fogged field rows (tile rows, 0 = top); combined with `fog` bands
 * @property {number[]} [fogCols]       fogged lanes (whole column)
 * @property {Array<[number, number]>} [castlesLayout]  explicit castle walls [lane, p] (overrides `castles.n`; uses `castles.hp`)
 * @property {number} [shore]           sea reaches this many tile rows down the field; monsters spawn at the shoreline
 * @property {string} [hexAll]          'reverse' or 'chameleon': every non-boss monster spawns hexed that way
 * @property {string} [name]            optional title shown on the preview card
 */

/** Runtime shape the engine reads. `n` is the global story index (1-based across all worlds). */
export function expandLevel(def, n){
  return { n, world:def.theme, total:def.total, interval:def.interval, spMul:def.spMul,
    boss:def.boss ? def.boss : false, bossForm:def.bossForm || 1, pool:def.pool.map(([t, w]) => [t, w]),
    pattern:def.pattern, graves:def.graves, unlockPumpkins:def.unlockPumpkins || [], unlockGear:def.unlockGear || [],
    intro:def.intro || [], fog:def.fog || [], castles:def.castles || null, puddles:def.puddles || 0, sea:!!def.sea || !!def.shore, gust:def.gust || null, gravesLayout:def.gravesLayout || null, laneWeights:def.laneWeights || null,
    fogRows:def.fogRows || [], fogCols:def.fogCols || [], castlesLayout:def.castlesLayout || null, shore:def.shore || 0, hexAll:def.hexAll || null, name:def.name || null, worldNo:def.world, levelNo:def.level, label:`${def.world}-${def.level}` };
}
