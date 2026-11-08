// Nightmare 4: Crumbling Keep: Nightmare (Release 8; spec docs/superpowers/specs/2026-11-08-release-8-nightmare-keep-design.md).
// Reached from the demon bookmark on the world 4 book once 4-20 and N3-4 are beaten. Night numbers: nmNight(4, k) = 1300 + k (src/data/worlds/index.js).
// Release 8 is a beta: the numbers are first guesses, tuned by the owner from playtests, not by the bot.
// Task 1 holds N4-1 only, a plain night (world 4 story monsters, the two gourds) that a later task replaces; the rest follow with their mechanics.
// Wrapped in the release gate so lower builds carry none of these names. Schema: ../levels.js.
const L = d => ({ world:4, theme:9, nightmare:true, graves:0, boss:null, bossForm:1, unlockPumpkins:[], unlockGear:[], intro:[], ...d });   // theme 9 = "Crumbling Keep: Nightmare" in WORLDS
const Gd = d => L({ ...d, gourd:true, gourds:['grave', 'protector'] });   // the gourds unlocked so far (N1-4 and N2-4); the Wartling joins with Release 7's N3-4

export default __RELEASE__ >= 8 ? [
  // N4-1 placeholder: a plain night with the world 4 story pool, replaced by the real first level.
  Gd({ level: 1, name:'Storm Gate', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['cryptGhoul', 10], ['keepImp', 5], ['knight', 3]],
    quests:[['noTools'], ['wallMin', 55]] }),
] : [];
