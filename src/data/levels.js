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
 * @property {number} [spawnGap]        overrides the spawn-gap multiplier from rules.js for this level
 * @property {number} [spawnBurst]      overrides the burst chance from rules.js for this level
 * @property {number} [bossHpMul]       boss levels: this level's boss health × this (the boss type's own health is unchanged elsewhere)
 * @property {number} [bossGap]         boss levels: spawn gaps are this many times longer (and bursts half as likely) while the boss is up
 * @property {Object<string,number>} [caps] at most this many of a monster type spawn in the level (e.g. { hauler:2 })
 * @property {Object<string,string>} [unlockCopy] intro-card text per unlocked pumpkin key, replacing the generic line
 * @property {number} [shore]           sea reaches this many tile rows down the field; monsters spawn at the shoreline
 * @property {Array} [quests]          quests 2 and 3 as [type, param] pairs (src/data/quests.js); quest 1 is always finishing the night
 * @property {string} [hexAll]          'reverse' or 'chameleon': every non-boss monster spawns hexed that way
 * @property {string} [name]            optional title shown on the preview card
 * @property {string[]} [introPumpkins]  pumpkins to explain with a card on this level without unlocking them (e.g. rainbow)
 * @property {number} [opensAfter]      level 1 only: which level of the previous world opens this world (default 10; Hallow's End: 20)
 * @property {Array<[number, number]>} [puddlesLayout]  explicit puddles [lane, p] (replaces the random `puddles`)
 * @property {number} [shoreFrac]       sea edge as a fraction of the field (same on every phone); wins over `shore`
 * @property {string} [boss2]          a second boss on the same night (World 6, 6-8): both arrive together; monsters keep coming until both fall
 * @property {boolean} [frenzy]         a Frenzy jukebox drops near the end; monsters keep coming until pumpkins smash it (World 6)
 * @property {boolean} [frenzyAfterBoss]  boss levels with `frenzy`: the jukebox drops when the first boss (or Twin Tides pair) falls, not at `frenzyAt`
 * @property {number} [bossChests]     boss levels: chests the boss always drops (default 1; 6-20: 2, owner 2026-11-03)
 * @property {number} [extraChestP]    boss levels: chance of one more chest on top (6-20: 0.5; Release 3)
 * @property {number|number[]} [frenzyAt]  fraction of `total` spawned when the jukebox drops (default 0.8); from Release 3 a list of drop points
 *   (6-19: [0.5, 1]): every jukebox but the last brings extra monsters that do not count toward `total`, the spawn bar shows a mark per point
 *   and counts monsters that arrived (not kills), so each jukebox drops on its mark
 * @property {number} [frenzyHp]        jukebox health (default: the Loot Sack's rule for the world)
 */

/** Runtime shape the engine reads. `n` is the global story index (1-based across all worlds). */
export function expandLevel(def, n){
  return { n, world:def.theme, total:def.total, interval:def.interval, spMul:def.spMul,
    boss:def.boss ? def.boss : false, bossForm:def.bossForm || 1, pool:def.pool.map(([t, w]) => [t, w]),
    pattern:def.pattern, graves:def.graves, unlockPumpkins:def.unlockPumpkins || [], unlockGear:def.unlockGear || [],
    intro:def.intro || [], fog:def.fog || [], castles:def.castles || null, puddles:def.puddles || 0, sea:!!def.sea || !!def.shore || !!def.shoreFrac, gust:def.gust || null, gravesLayout:def.gravesLayout || null, laneWeights:def.laneWeights || null,
    fogRows:def.fogRows || [], fogCols:def.fogCols || [], caps:def.caps || null, spawnGap:def.spawnGap == null ? null : def.spawnGap, spawnBurst:def.spawnBurst == null ? null : def.spawnBurst, bossGap:def.bossGap || null, bossHpMul:def.bossHpMul || null, unlockCopy:def.unlockCopy || null, castlesLayout:def.castlesLayout || null, shore:def.shore || 0, hexAll:def.hexAll || null, quests:def.quests || null, name:def.name || null, introPumpkins:def.introPumpkins || [], puddlesLayout:def.puddlesLayout || null, shoreFrac:def.shoreFrac || 0, boss2:def.boss2 || null, frenzy:!!def.frenzy, frenzyAfterBoss:!!def.frenzyAfterBoss, frenzyAt:def.frenzyAt || 0, frenzyHp:def.frenzyHp || 0, extraChestP:def.extraChestP || 0, bossChests:def.bossChests || 1, worldNo:def.world, levelNo:def.level, label:`${def.world}-${def.level}` };
}
