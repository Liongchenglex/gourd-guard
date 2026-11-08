// Nightmare 3: Witchwood: Nightmare (Release 7; spec docs/superpowers/specs/2026-11-08-release-7-nightmare-witchwood-design.md).
// Reached from the demon bookmark on the world 3 book once 3-20 and N2-4 are beaten. Night numbers: nmNight(3, k) = 1200 + k (src/data/worlds/index.js).
// Release 7 is a beta: the numbers are first guesses, tuned by the owner from playtests, not by the bot.
// Task 1 holds N3-1 only, a plain night (world 3 story monsters, both gourds) that the level task replaces; the rest follow with their mechanics.
// Wrapped in the release gate so lower builds carry none of these names. Schema: ../levels.js.
const L = d => ({ world:3, theme:8, nightmare:true, graves:0, boss:null, bossForm:1, unlockPumpkins:[], unlockGear:[], intro:[], ...d });   // theme 8 = "Witchwood: Nightmare" in WORLDS
const Gd = d => L({ gourds:['grave', 'protector'], ...d, gourd:true });
const ALL3 = ['grave', 'protector', 'wartling'];   // N3-5 on: all three gourds on offer (pick two)   // both gourds stand ready from N3-1 on (both are unlocked by N1-4 and N2-4); a level may offer more (N3-5 on: the Wartling)

export default __RELEASE__ >= 7 ? [
  // N3-1 placeholder: a plain night with the world 3 story pool, replaced by the real first level.
  Gd({ level: 1, name:'Dead Wood', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]],
    quests:[['noTools'], ['wallMin', 55]] }),
  // N3-2 to N3-5 placeholders (Task 4: the Wartling Gourd needs N3-4's unlock and N3-5's tutorial): plain nights with the N3-1 pool, replaced
  // by the real levels (N3-4 the Treant, N3-5 "The Wartling Gourd").
  Gd({ level: 2, name:'Dead Wood 2', pattern:1, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 55]] }),
  Gd({ level: 3, name:'Dead Wood 3', pattern:2, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 55]] }),
  // N3-4 placeholder with its mini boss (Task 8): the Treant, one normal chest; it unlocks the Wartling Gourd (Task 10 writes the real level)
  Gd({ level: 4, name:'The Treant', pattern:3, total:18, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'treant', bossChest:'normal', unlockGourds:['wartling'],
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 50]] }),
  // N3-5: the Wartling tutorial (coach:'wartling'); all three gourds on offer from here (pick two)
  Gd({ level: 5, name:'The Wartling Gourd', pattern:4, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, coach:'wartling', gourds:['grave', 'protector', 'wartling'],
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 55]] }),
  // N3-6 to N3-12 placeholders (plain nights, Task 10 replaces them), so N3-13 exists for the Treant's form 2 (Task 8)
  Gd({ level:6, name:'Dead Wood 6', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 55]] }),
  Gd({ level:7, name:'Dead Wood 7', pattern:1, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 55]] }),
  Gd({ level:8, name:'Dead Wood 8', pattern:2, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 55]] }),
  Gd({ level:9, name:'Dead Wood 9', pattern:3, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 55]] }),
  Gd({ level:10, name:'Dead Wood 10', pattern:4, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 55]] }),
  Gd({ level:11, name:'Dead Wood 11', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 55]] }),
  Gd({ level:12, name:'Dead Wood 12', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 55]] }),
  // N3-13 placeholder: the Treant in form 2 (34 health, roots every 5 s, 3-4 at a time), one normal chest (Task 10 writes the real level)
  Gd({ level:13, name:'Treant Returns', pattern:1, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'treant', bossForm:2, bossChest:'normal', gourds:ALL3,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 45]] }),
  // N3-14 and N3-15 placeholders (plain nights, Task 10 replaces them), so N3-16 exists for the Fallen Hexwitch (Task 9)
  Gd({ level:14, name:'Dead Wood 14', pattern:2, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 55]] }),
  Gd({ level:15, name:'Dead Wood 15', pattern:3, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 55]] }),
  // N3-16 placeholder: the Fallen Hexwitch, one normal chest (Task 10 writes the real level)
  Gd({ level:16, name:'The Fallen Hexwitch', pattern:0, total:22, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'fallenhexwitch', bossChest:'normal', gourds:ALL3,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4]], quests:[['noTools'], ['wallMin', 45]] }),
] : [];
