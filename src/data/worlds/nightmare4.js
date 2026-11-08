// Nightmare 4: Crumbling Keep: Nightmare (Release 8; spec docs/superpowers/specs/2026-11-08-release-8-nightmare-keep-design.md).
// Reached from the demon bookmark on the world 4 book once 4-20 and N3-4 are beaten. Night numbers: nmNight(4, k) = 1300 + k (src/data/worlds/index.js).
// Release 8 is a beta: the numbers are first guesses, tuned by the owner from playtests, not by the bot.
// Task 1 holds N4-1 only, a plain night (world 4 story monsters, the gourds) that a later task replaces; Task 7 adds placeholders for N4-2 and
// N4-3 (the Crookneck's night); the rest follow with their mechanics.
// Wrapped in the release gate so lower builds carry none of these names. Schema: ../levels.js.
const L = d => ({ world:4, theme:9, nightmare:true, graves:0, boss:null, bossForm:1, unlockPumpkins:[], unlockGear:[], intro:[], ...d });   // theme 9 = "Crumbling Keep: Nightmare" in WORLDS
const Gd = d => L({ gourd:true, gourds:['grave', 'protector', 'wartling'], ...d });   // the gourds unlocked so far (N1-4, N2-4, N3-4): pick two of three (spec Part 6); a level may offer more (N4-3 on: the Crookneck)
const ALL4 = ['grave', 'protector', 'wartling', 'crookneck'];

export default __RELEASE__ >= 8 ? [
  // N4-1 placeholder: a plain night with the world 4 story pool, replaced by the real first level.
  Gd({ level: 1, name:'Storm Gate', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['cryptGhoul', 10], ['keepImp', 5], ['knight', 3]],
    quests:[['noTools'], ['wallMin', 55]] }),
  // N4-2 and N4-3 placeholders (Task 7: the Crookneck Gourd needs N4-3's gift and tutorial). Task 10 writes the real levels.
  Gd({ level: 2, name:'Keep Night 2', pattern:1, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['cryptGhoul', 10], ['keepImp', 5], ['knight', 3], ['lobbercart', 2]],
    quests:[['noTools'], ['wallMin', 55]] }),
  // N4-3: the Crookneck Gourd (spec Part 5): given as the night opens and locked in slot 1 (gourdLock), its tutorial (coach:'crookneck'); all
  // four gourds on offer from here (pick two); two carts so the gourd matters.
  Gd({ level: 3, name:'The Crookneck Gourd', pattern:2, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, coach:'crookneck', gourds:ALL4, gourdLock:'crookneck',
    pool:[['cryptGhoul', 10], ['keepImp', 5], ['knight', 3], ['lobbercart', 4]], caps:{ lobbercart:2 },
    quests:[['noTools'], ['wallMin', 55]] }),
] : [];
