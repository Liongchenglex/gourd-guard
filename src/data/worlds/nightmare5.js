// Nightmare 5: Drowned Marsh: Nightmare (Release 9; spec docs/superpowers/specs/2026-11-09-release-9-nightmare-marsh-design.md, Parts 6 and 7).
// Reached from the demon bookmark on the world 5 book once 5-20 and N4-4 are beaten. Night numbers: nmNight(5, k) = 1400 + k (src/data/worlds/index.js).
// Release 9 is a beta: the numbers are first guesses, tuned by the owner from playtests, not by the bot.
// The Marsh's nightmare is the blood tide: every night has the crimson sea, a shore (`shoreFrac`, so walkers spawn at the live shore) and `tideMarks`
// (engine/tide.js: at each mark, a fraction of the arrivals, the shore surges to `to`, held one tile row before the fence). Nights 1-10, 13 and 16 reach
// at most 0.5, nights 11, 12, 14 and 15 reach 0.6 to 0.7. Pools (drawn blood red on these nights) are explicit cells, so a whirlpool end always stands
// in water at the start: `whirls` [[lane, p], [lane, p]] pairs become `whirlpools` and their ends below the start shore get a pool of their own; `pools`
// are the others. Every night has the sea, so a Storm Eel always has water.
// Gourds: the four earlier gourds are on offer from N5-1 (pick two of any won, owner 2026-11-09); N5-4 unlocks the Swan, N5-5 locks it in slot 1 with
// its tutorial, and its card comes on N5-5 from the `gourds` list.
// New monsters, each introduced where it first walks in: Blood Slime (N5-2), Drowned Pirate (N5-3), the Kraken's tentacles (N5-4), Turtle Rider (N5-6),
// Storm Eel (N5-7), Siren (N5-8); the blood tide and whirlpools have their own cards on N5-1. The Kraken holds N5-4 and N5-13 (form 2), the Fallen Twin
// Tides N5-16. Each level sets spawnGap and spawnBurst itself. Music: the regular nightmare track.
// Cursed lines (`redLines`, owner 2026-11-11: the marsh's signature, engine/marsh.js initHidden): a row or column hidden all night; one on N5-9 to N5-12, a row and a
// column on N5-14 and N5-15, none on the boss nights, never the bottom row beside the sprouts.
// Wrapped in the release gate so lower builds carry none of these names. Schema: ../levels.js.
const base = d => ({ world:5, theme:10, nightmare:true, graves:0, boss:null, bossForm:1, unlockPumpkins:[], unlockGear:[], intro:[], sea:true, ...d, gourd:true });   // theme 10 = "Drowned Marsh: Nightmare" in WORLDS; every night is a gourd night
const ALL4 = () => ['grave', 'protector', 'wartling', 'crookneck'];   // the gourds the first four books gave: pick two
const ALL5 = () => [...ALL4(), 'swan'];   // ... and the Swan, won on N5-4
/** One night: `whirls` and `pools` become `whirlpools` and `puddlesLayout` (a pair's ends below the start shore each get a pool; ends in the sea need none). */
const L = ({ whirls = [], pools = [], ...d }) => {
  const shore = d.shoreFrac, ends = whirls.flat().filter(([, p]) => p > shore), cells = [...pools, ...ends];
  return base({ ...d, puddles:cells.length, puddlesLayout:cells, ...(whirls.length ? { whirlpools:whirls.map(([a, b]) => [{ lane:a[0], p:a[1] }, { lane:b[0], p:b[1] }]) } : {}) });
};

export default __RELEASE__ >= 9 ? [
  // N5-1 The Red Tide: the blood tide and one whirlpool pair (their two cards), one gentle tide mark; plain ghouls, imps and crawlers.
  L({ level: 1, name:'The Red Tide', pattern:0, total:16, interval:3.3, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL4(), shoreFrac:0.2, tideMarks:[{ at:0.5, to:0.3 }],
    whirls:[[[1, 0.42], [5, 0.55]]], pools:[[3, 0.6]],
    pool:[['drownedGhoul', 10], ['tideImp', 5], ['crawler', 3]], quests:[['noTools'], ['wallMin', 55]] }),
  // N5-2 Blood Slime: slimes near a whirlpool, so a kill that splits can end up in another lane.
  L({ level: 2, name:'Blood Slime', pattern:1, total:18, interval:3.3, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL4(), shoreFrac:0.2, tideMarks:[{ at:0.35, to:0.3 }, { at:0.7, to:0.4 }],
    whirls:[[[2, 0.4], [4, 0.58]]], pools:[[0, 0.5]], intro:['bloodslime'],
    pool:[['drownedGhoul', 8], ['tideImp', 4], ['bloodslime', 5], ['crawler', 2]], quests:[['bunch5', 2], ['wallMin', 55]] }),
  // N5-3 Drowned Pirate: Pirates shooting down their columns with crawlers coming out of the pools.
  L({ level: 3, name:'Drowned Pirate', pattern:2, total:18, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL4(), shoreFrac:0.2, tideMarks:[{ at:0.4, to:0.3 }, { at:0.75, to:0.4 }],
    pools:[[1, 0.45], [5, 0.5], [3, 0.62]], intro:['pirate'],
    pool:[['drownedGhoul', 8], ['tideImp', 4], ['crawler', 4], ['pirate', 4]], quests:[['oneLaunch', 3], ['wallMin', 50]] }),
  // N5-4 The Kraken: the mini boss (three tentacles rise in the tide, anchors at the fence). One normal chest. Beating it unlocks the Swan Gourd.
  L({ level: 4, name:'The Kraken', pattern:3, total:16, interval:3.3, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL4(), shoreFrac:0.2, tideMarks:[{ at:0.5, to:0.35 }],
    pools:[[2, 0.5], [4, 0.55]], boss:'kraken', bossChest:'normal', unlockGourds:['swan'], intro:['tentacle'],
    pool:[['drownedGhoul', 9], ['tideImp', 5], ['sailor', 3], ['bloodslime', 3]], quests:[['noTools'], ['wallMin', 50]] }),
  // N5-5 The Swan Gourd: given and taught here (locked in slot 1, coach:'swan'). Mummies and Flaming Mummies, which only Fire or Ice finish off, so the splash matters.
  L({ level: 5, name:'The Swan Gourd', pattern:4, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL5(), gourdLock:'swan', coach:'swan', shoreFrac:0.2, tideMarks:[{ at:0.5, to:0.4 }],
    pools:[[1, 0.5], [5, 0.5]],
    pool:[['drownedGhoul', 6], ['mummy', 4], ['firemummy', 3], ['tideImp', 4], ['crawler', 3]], quests:[['bunch5', 2], ['wallMin', 50]] }),
  // N5-6 Turtle Rider: rot from afar; Grey pierces the shell.
  L({ level: 6, name:'Turtle Rider', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL5(), shoreFrac:0.25, tideMarks:[{ at:0.4, to:0.35 }, { at:0.8, to:0.45 }],
    pools:[[1, 0.5], [3, 0.6], [5, 0.5]], intro:['turtlerider'],
    pool:[['drownedGhoul', 6], ['turtlerider', 4], ['bogTurtle', 3], ['tideImp', 4], ['sailor', 3]], quests:[['pierce', 3], ['wallMin', 50]] }),
  // N5-7 Storm Eel: four pools and a tide for the eels to rise in.
  L({ level: 7, name:'Storm Eel', pattern:1, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL5(), shoreFrac:0.25, tideMarks:[{ at:0.35, to:0.35 }, { at:0.7, to:0.45 }],
    pools:[[0, 0.5], [2, 0.6], [4, 0.5], [6, 0.6]], intro:['eel'],
    pool:[['drownedGhoul', 7], ['eel', 4], ['crawler', 4], ['diver', 3], ['tideImp', 3]], quests:[['wallAvg', 55], ['bunch5', 2]] }),
  // N5-8 Siren: her song hides a row or a column (red spheres) and calls up a Blood Slime; a whirlpool pair to confuse the lanes too.
  L({ level: 8, name:'Siren', pattern:2, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL5(), shoreFrac:0.25, tideMarks:[{ at:0.5, to:0.4 }],
    whirls:[[[2, 0.45], [4, 0.65]]], pools:[[1, 0.55], [5, 0.55]], intro:['siren'],
    pool:[['drownedGhoul', 7], ['siren', 3], ['bogTurtle', 3], ['sailor', 3], ['tideImp', 4]], quests:[['noTools'], ['wallMin', 50]] }),
  // N5-9 Siren and Pirates: shots and hidden lines together; the first cursed line (row 1 stays red all night) and its card.
  L({ level: 9, name:'Siren and Pirates', pattern:3, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL5(), shoreFrac:0.25, tideMarks:[{ at:0.4, to:0.4 }, { at:0.8, to:0.5 }],
    pools:[[0, 0.5], [3, 0.6], [6, 0.5]], redLines:[{ kind:'row', i:1 }],
    pool:[['drownedGhoul', 6], ['siren', 3], ['pirate', 5], ['tideImp', 4], ['crawler', 3]], quests:[['bunch5', 2], ['wallMin', 45]] }),
  // N5-10 Chameleon tide: Chameleons and Reverse Chameleons; the Swan's splash ignores their colour.
  L({ level:10, name:'Chameleon tide', pattern:4, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL5(), shoreFrac:0.25, tideMarks:[{ at:0.4, to:0.4 }, { at:0.75, to:0.5 }],
    pools:[[2, 0.5], [4, 0.5]], redLines:[{ kind:'col', i:3 }],
    pool:[['drownedGhoul', 6], ['chameleon', 5], ['rchameleon', 4], ['tideImp', 3], ['crawler', 2]], quests:[['oneLaunch', 4], ['wallMin', 45]] }),
  // N5-11 Slime flood: many Blood Slimes while the tide goes past halfway.
  L({ level:11, name:'Slime flood', pattern:0, total:24, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL5(), shoreFrac:0.3, tideMarks:[{ at:0.25, to:0.4 }, { at:0.5, to:0.55 }, { at:0.75, to:0.65 }],
    pools:[[1, 0.62], [3, 0.68], [5, 0.62]], redLines:[{ kind:'row', i:2 }],
    pool:[['bloodslime', 12], ['drownedGhoul', 6], ['tideImp', 4], ['slime', 3]], quests:[['oneLaunch', 5], ['wallMin', 45]] }),
  // N5-12 Eel storm: Eels with a high tide and three whirlpool pairs.
  L({ level:12, name:'Eel storm', pattern:1, total:22, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL5(), shoreFrac:0.3, tideMarks:[{ at:0.3, to:0.45 }, { at:0.6, to:0.6 }, { at:0.8, to:0.7 }],
    whirls:[[[0, 0.5], [6, 0.62]], [[2, 0.55], [4, 0.68]], [[1, 0.66], [5, 0.5]]], redLines:[{ kind:'col', i:5 }],
    pool:[['eel', 7], ['drownedGhoul', 6], ['diver', 3], ['crawler', 3], ['pirate', 2], ['tideImp', 3]], quests:[['noTools'], ['wallAvg', 50]] }),
  // N5-13 The Kraken 2: the Kraken in form 2 (more health, five tentacles) with a mixed crowd. One normal chest.
  L({ level:13, name:'The Kraken 2', pattern:2, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL5(), shoreFrac:0.25, tideMarks:[{ at:0.5, to:0.4 }, { at:0.8, to:0.5 }],
    pools:[[1, 0.55], [3, 0.6], [5, 0.55]], boss:'kraken', bossForm:2, bossChest:'normal',
    pool:[['drownedGhoul', 7], ['bloodslime', 3], ['pirate', 3], ['siren', 2], ['turtlerider', 2], ['tideImp', 3]], quests:[['wallMin', 40], ['bunch5', 2]] }),
  // N5-14 Maelstrom: all four whirlpool pairs and a high tide; the surges carry each end it passes to the water\u2019s edge, where the pair keeps working.
  L({ level:14, name:'Maelstrom', pattern:3, total:24, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL5(), shoreFrac:0.3, tideMarks:[{ at:0.2, to:0.45 }, { at:0.45, to:0.55 }, { at:0.7, to:0.65 }, { at:0.9, to:0.7 }],
    whirls:[[[0, 0.4], [6, 0.55]], [[1, 0.62], [5, 0.45]], [[2, 0.5], [4, 0.7]], [[3, 0.42], [0, 0.7]]], redLines:[{ kind:'row', i:0 }, { kind:'col', i:1 }],
    pool:[['drownedGhoul', 6], ['tideImp', 5], ['crawler', 3], ['bloodslime', 3], ['turtlerider', 3], ['pirate', 2], ['sailor', 2], ['turtle', 2]], quests:[['oneLaunch', 4], ['wallMin', 40]] }),
  // N5-15 The gauntlet: every new monster, two whirlpool pairs, a longer night.
  L({ level:15, name:'The gauntlet', pattern:4, total:26, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL5(), shoreFrac:0.3, tideMarks:[{ at:0.3, to:0.45 }, { at:0.6, to:0.6 }, { at:0.85, to:0.65 }],
    whirls:[[[1, 0.45], [5, 0.6]], [[2, 0.55], [4, 0.45]]], pools:[[0, 0.62], [6, 0.62]], redLines:[{ kind:'row', i:3 }, { kind:'col', i:4 }],
    pool:[['drownedGhoul', 5], ['tideImp', 4], ['bloodslime', 3], ['pirate', 3], ['turtlerider', 3], ['eel', 3], ['siren', 2], ['crawler', 3], ['turtle', 2]], quests:[['noTools'], ['wallMin', 40]] }),
  // N5-16 The Fallen Twin Tides (spec Part 7; engine/marsh.js): both twins hold in the tide; two fixed whirlpool pairs (the blue twin no longer opens any, owner 2026-11-11). Ghouls, imps and crawlers walk in meanwhile; the twins call Blood Slimes, Pirates and Eels. One normal chest.
  L({ level:16, name:'The Fallen Twin Tides', pattern:0, total:22, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL5(), shoreFrac:0.25, tideMarks:[{ at:0.5, to:0.4 }],
    whirls:[[[0, 0.45], [4, 0.6]], [[2, 0.62], [6, 0.45]]], pools:[[1, 0.5], [3, 0.55], [5, 0.5]], boss:'fallentides', bossChest:'normal',
    pool:[['drownedGhoul', 6], ['tideImp', 4], ['crawler', 4], ['sailor', 3], ['bogTurtle', 2]], quests:[['wallMin', 40], ['noTools']] }),
] : [];
