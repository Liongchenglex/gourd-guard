// Nightmare 2: Foggy Hollow: Nightmare (Release 5; spec docs/superpowers/specs/2026-11-05-release-5-nightmare-hollow-design.md, Part 7).
// Reached from the demon bookmark on the world 2 book once 2-20 and N1-4 are beaten. Night numbers: nmNight(2, k) = 1100 + k (src/data/worlds/index.js).
// Release 5 is a beta: the numbers are first guesses, tuned by the owner from playtests, not by the bot.
// This file holds N2-1 only (a plain placeholder night that starts and plays); the Release 5 level table replaces it.
// Wrapped in the release gate so lower builds carry none of these names. Schema: ../levels.js.
const L = d => ({ world:2, theme:7, nightmare:true, graves:0, boss:null, bossForm:1, unlockPumpkins:[], unlockGear:[], intro:[], ...d });   // theme 7 = "Foggy Hollow: Nightmare" in WORLDS
const Gd = d => L({ ...d, gourd:true });   // the Grave Gourd stands on the patch from N2-1 on

export default __RELEASE__ >= 5 ? [
  // N2-1 Rot Mist: placeholder (world 2 monsters, the Grave Gourd, no fog or rot yet).
  Gd({ level: 1, name:'Rot Mist', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['bogGhoul', 10], ['wisp', 6], ['wraith', 5], ['swiftBat', 4]],
    quests:[['noTools'], ['wallMin', 55], ['bunch5', 2]] }),
] : [];
