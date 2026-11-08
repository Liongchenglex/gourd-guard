// Nightmare 3: Witchwood: Nightmare (Release 7; spec docs/superpowers/specs/2026-11-08-release-7-nightmare-witchwood-design.md).
// Reached from the demon bookmark on the world 3 book once 3-20 and N2-4 are beaten. Night numbers: nmNight(3, k) = 1200 + k (src/data/worlds/index.js).
// Release 7 is a beta: the numbers are first guesses, tuned by the owner from playtests, not by the bot.
// Task 1 holds N3-1 only, a plain night (world 3 story monsters, both gourds) that the level task replaces; the rest follow with their mechanics.
// Wrapped in the release gate so lower builds carry none of these names. Schema: ../levels.js.
const L = d => ({ world:3, theme:8, nightmare:true, graves:0, boss:null, bossForm:1, unlockPumpkins:[], unlockGear:[], intro:[], ...d });   // theme 8 = "Witchwood: Nightmare" in WORLDS
const Gd = d => L({ ...d, gourd:true, gourds:['grave', 'protector'] });   // both gourds stand ready from N3-1 on (both are unlocked by N1-4 and N2-4)

export default __RELEASE__ >= 7 ? [
  // N3-1 placeholder: a plain night with the world 3 story pool, replaced by the real first level.
  Gd({ level: 1, name:'Dead Wood', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]],
    quests:[['noTools'], ['wallMin', 55]] }),
] : [];
