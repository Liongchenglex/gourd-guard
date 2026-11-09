// Nightmare 5: Drowned Marsh: Nightmare (Release 9; spec docs/superpowers/specs/2026-11-09-release-9-nightmare-marsh-design.md).
// Reached from the demon bookmark on the world 5 book once 5-20 and N4-4 are beaten. Night numbers: nmNight(5, k) = 1400 + k (src/data/worlds/index.js).
// Release 9 is a beta: the numbers are first guesses, tuned by the owner from playtests, not by the bot.
// Task 1 holds only N5-1, a plain placeholder night on the blood Marsh map (the story Marsh's ghouls and imps, a few puddles, the sea);
// the finished track (N5-1 to N5-16) replaces it in Task 10.
// Wrapped in the release gate so lower builds carry none of these names. Schema: ../levels.js.
const L = d => ({ world:5, theme:10, nightmare:true, graves:0, boss:null, bossForm:1, unlockPumpkins:[], unlockGear:[], intro:[], ...d, gourd:true });   // theme 10 = "Drowned Marsh: Nightmare" in WORLDS; every night is a gourd night
const ALL4 = () => ['grave', 'protector', 'wartling', 'crookneck'];   // the gourds the first four books gave: pick two of four
const ALL5 = () => [...ALL4(), 'swan'];   // ... and the Swan, won on N5-4

export default __RELEASE__ >= 9 ? [
  L({ level: 1, name:'The Red Tide', pattern:0, total:16, interval:3.3, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL4(), puddles:2, shoreFrac:0.2, tideMarks:[{ at:0.5, to:0.3 }],
    pool:[['drownedGhoul', 10], ['tideImp', 5]], quests:[['noTools'], ['wallMin', 55]] }),
  // PLACEHOLDERS (Task 7): N5-2 to N5-4 stand in so the Swan's night numbers exist; Task 10 replaces them with the real nights. N5-4 gives the Swan and (Task 8) is the Kraken night, one normal chest; N5-13, its form 2, is not built yet (Task 10).
  L({ level: 2, name:'The Red Tide II', pattern:0, total:16, interval:3.3, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL4(), puddles:2, shoreFrac:0.2, tideMarks:[{ at:0.5, to:0.3 }],
    pool:[['drownedGhoul', 10], ['tideImp', 5]], quests:[['noTools'], ['wallMin', 55]] }),
  L({ level: 3, name:'The Red Tide III', pattern:0, total:16, interval:3.3, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL4(), puddles:2, shoreFrac:0.2, tideMarks:[{ at:0.5, to:0.3 }],
    pool:[['drownedGhoul', 10], ['tideImp', 5]], quests:[['noTools'], ['wallMin', 55]] }),
  L({ level: 4, name:'The Kraken', pattern:0, total:16, interval:3.3, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL4(), puddles:2, shoreFrac:0.2, tideMarks:[{ at:0.5, to:0.3 }], unlockGourds:['swan'], boss:'kraken', bossChest:'normal', intro:['tentacle'],
    pool:[['drownedGhoul', 10], ['tideImp', 5]], quests:[['noTools'], ['wallMin', 55]] }),
  // N5-5: the Swan Gourd's night (owner: given and taught here; locked in slot 1 as the Crookneck is on N4-3). Its monsters and pacing are a stand-in too.
  L({ level: 5, name:'The Black Swan', pattern:0, total:16, interval:3.3, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL5(), gourdLock:'swan', coach:'swan', puddles:2, shoreFrac:0.2, tideMarks:[{ at:0.5, to:0.3 }],
    pool:[['drownedGhoul', 10], ['tideImp', 5]], quests:[['noTools'], ['wallMin', 55]] }),
] : [];
