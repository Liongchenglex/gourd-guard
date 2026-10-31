// World 6: Hallow's End (beta, VITE_W6 builds only; spec docs/superpowers/specs/2026-10-31-hallows-end-first-levels-design.md).
// Every level is hand-designed by the owner around a cross-world monster mix; no shared pool, no pumpkin unlocks (full choice).
// Rows are fractions of the field (0 = top, 1 = fence) so every phone sees the same map. Numbers are bot-tuned (GAME_DESIGN.md).
// Schema: ../levels.js.
const ROW = p => [0, 1, 2, 3, 4, 5, 6].map(lane => [lane, p]);   // a castle wall in every lane at height p
const PILLARS = [[1, 1], [2, 1], [3, 1], [1, 5], [2, 5], [3, 5]];

export default [
  // 6-1: fog over the middle three rows hides puddles; crawlers and turtles climb out unseen. Knights and archers from the top,
  // a castle row in front of the fence (it blocks your pumpkins until broken; monsters and arrows pass through). Graves: an "n".
  { world:6, level: 1, theme:5, opensAfter:20, name:'Attack and Defend', pattern:0, graves:0, total:24, interval:2.9, spMul:1.0, boss:null, bossForm:1,
    pool:[['knight', 5], ['archer', 4], ['crawler', 5], ['turtle', 2]], fog:[[0.2, 0.8]], puddlesLayout:[[1, 0.45], [3, 0.6], [5, 0.4]],
    castles:{ n:7, hp:12 }, castlesLayout:ROW(0.9), gravesLayout:[[1, 2], [1, 3], [1, 4], [2, 2], [2, 4], [3, 2], [3, 4]],
    quests:[['noTools'], ['wallMin', 50]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-2: the sea covers the top half; fogwalkers, witches, mirror sprites and knights surface at the shoreline.
  { world:6, level: 2, theme:5, name:'Timing!', pattern:1, graves:0, total:22, interval:3.0, spMul:1.0, boss:null, bossForm:1,
    pool:[['fogwalker', 3], ['witch', 3], ['mirror', 4], ['knight', 5]], sea:true, shoreFrac:0.5, gravesLayout:PILLARS,
    quests:[['noTools'], ['bunch5', 2]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-3: mummies and flaming mummies (Fire and Ice both locked in); fog over all but the two rows by the fence, a castle row
  // hidden in it, and witch wind. Same graves as 6-2.
  { world:6, level: 3, theme:5, name:'Fire and Ice, Round 2', pattern:2, graves:0, total:16, interval:3.4, spMul:0.95, boss:null, bossForm:1,
    pool:[['mummy', 6], ['firemummy', 5]], fog:[[0, 0.6]], castles:{ n:7, hp:12 }, castlesLayout:ROW(0.35), gust:{ every:22, dirs:['left', 'right'] },
    gravesLayout:PILLARS, quests:[['bunch5', 2], ['wallMin', 50]], unlockPumpkins:[], unlockGear:[], intro:[] },
];
