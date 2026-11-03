// World 6: Hallow's End (Releases 2 and 3; until then only in the playtest build; spec docs/superpowers/specs/2026-10-31-hallows-end-first-levels-design.md).
// Every level is hand-designed by the owner around a cross-world monster mix; no shared pool, no pumpkin unlocks (full choice).
// Rows are fractions of the field (0 = top, 1 = fence) so every phone sees the same map. Numbers are bot-tuned (GAME_DESIGN.md).
// Schema: ../levels.js.
const ROW = p => [0, 1, 2, 3, 4, 5, 6].map(lane => [lane, p]);   // a castle wall in every lane at height p
const PILLARS = [[1, 1], [2, 1], [3, 1], [1, 5], [2, 5], [3, 5]];
// Release 3 grave shapes (owner: "get creative with the grave arrangements"); [row, col] on the 5×7 patch
const CRESCENT = [[0, 3], [0, 4], [1, 2], [2, 2], [3, 2], [4, 3], [4, 4]];   // a crescent moon
const DIAMOND = [[0, 3], [1, 2], [1, 4], [2, 1], [2, 5], [3, 2], [3, 4], [4, 3]];   // a diamond ring
export const FACE = [[1, 1], [1, 5], [2, 3], [3, 1], [3, 5], [4, 2], [4, 3], [4, 4]];   // a jack-o'-lantern grin
export const CROWN = [[0, 1], [0, 3], [0, 5], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5]];   // the Hollow King's crown
const FLANKS = [[0, 0.3], [0, 0.5], [0, 0.7], [6, 0.3], [6, 0.5], [6, 0.7]];   // castle walls down both outer lanes

export default [
  // 6-1: fog over the middle three rows hides puddles; Puddle Divers attack from them unseen and Shell Turtles climb out (owner: divers, the "attack"). Knights and archers from the top,
  // a castle row in front of the fence (it blocks your pumpkins until broken; monsters and arrows pass through). Graves: an "n".
  { world:6, level: 1, theme:5, opensAfter:20, name:'Attack and Defend', pattern:0, graves:0, total:26, interval:2.75, spMul:1.0, boss:null, bossForm:1,
    pool:[['knight', 5], ['archer', 4], ['diver', 5], ['turtle', 2]], fog:[[0.2, 0.8]], puddlesLayout:[[1, 0.45], [3, 0.6], [5, 0.4]],
    castles:{ n:7, hp:12 }, castlesLayout:ROW(0.9), gravesLayout:[[1, 2], [1, 3], [1, 4], [2, 2], [2, 4], [3, 2], [3, 4]],
    quests:[['noTools'], ['wallMin', 50]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-2: the sea covers the top half; fogwalkers, mirror sprites and knights surface at the shoreline, puddle divers lurk in the sea (owner: divers, not witches).
  { world:6, level: 2, theme:5, name:'Timing!', pattern:1, graves:0, total:24, interval:2.85, spMul:1.0, boss:null, bossForm:1,
    pool:[['fogwalker', 3], ['diver', 3], ['mirror', 4], ['knight', 5]], sea:true, shoreFrac:0.5, gravesLayout:PILLARS,
    quests:[['noTools'], ['bunch5', 2]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-3: mummies and flaming mummies (Fire and Ice both locked in); fog over all but the two rows by the fence, a castle row
  // hidden in it, and witch wind. Same graves as 6-2.
  { world:6, level: 3, theme:5, name:'Fire and Ice, Round 2', pattern:2, graves:0, total:14, interval:4.2, spMul:0.9, boss:null, bossForm:1,
    pool:[['mummy', 6], ['firemummy', 5]], fog:[[0, 0.6]], castles:{ n:7, hp:8 }, castlesLayout:ROW(0.35), gust:{ every:22, dirs:['left', 'right'] },
    gravesLayout:PILLARS, quests:[['bunch5', 2], ['wallMin', 50]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-4: a revisit of the level-16 monsters (Flaming Mummy, Fogwalker, Witch, Bulwark Knight, Shell Turtle). No fog banks (the
  // Fogwalkers bring their own); a castle row across the middle, puddles scattered for the turtles, witch wind, the first Frenzy jukebox.
  { world:6, level: 4, theme:5, name:'A Revisit', pattern:3, graves:0, total:24, interval:3.0, spMul:0.95, boss:null, bossForm:1, frenzy:true,
    pool:[['firemummy', 3], ['fogwalker', 3], ['witch', 3], ['bulwark', 2], ['turtle', 3]], puddles:3,
    castles:{ n:7, hp:8 }, castlesLayout:ROW(0.5), gust:{ every:22, dirs:['left', 'right'] },
    gravesLayout:[[0, 0], [0, 6], [2, 3], [4, 0], [4, 6]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-5: Plague Doctors, Bulwark Knights and Shell Turtles (owner: no brutes): the Doctors heal, the Bulwarks double health in their auras,
  // so each protects the other; turtles rise from three puddles. Castle walls down both outer lanes, graves in a ring, Frenzy.
  { world:6, level: 5, theme:5, name:'Field Hospital', pattern:4, graves:0, total:22, interval:3.0, spMul:0.95, boss:null, bossForm:1, frenzy:true,
    pool:[['doctor', 5], ['bulwark', 4], ['turtle', 2]], puddles:3, castles:{ n:6, hp:8 }, castlesLayout:FLANKS,
    gravesLayout:[[1, 2], [1, 3], [1, 4], [2, 2], [2, 4], [3, 2], [3, 3], [3, 4]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-6: 6-5 with Witches in place of the Doctors (owner), turtles and puddles too; a zig-zag of graves, the same walls and Frenzy.
  { world:6, level: 6, theme:5, name:'Field Spell', pattern:0, graves:0, total:22, interval:3.0, spMul:0.95, boss:null, bossForm:1, frenzy:true,
    pool:[['witch', 5], ['bulwark', 4], ['turtle', 2]], puddles:3, castles:{ n:6, hp:8 }, castlesLayout:FLANKS,
    gravesLayout:[[1, 1], [2, 2], [1, 3], [2, 4], [1, 5]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-7: the fast ones (Vampires, Wisp Riders, Drunk Sailors), strengthened by Bulwark Knights (owner). Fog down both outer lanes,
  // a castle row across the middle with the sea right behind it (owner: they surface near the walls), Frenzy.
  { world:6, level: 7, theme:5, name:'Iron Rush', pattern:1, graves:0, total:24, interval:2.9, spMul:1.0, boss:null, bossForm:1, gust:{ every:22, dirs:['left', 'right'], partial:true }, frenzy:true,
    pool:[['vampire', 3], ['rider', 4], ['sailor', 4], ['bulwark', 3]], fogCols:[0, 6], sea:true, shoreFrac:0.44, castles:{ n:7, hp:8 }, castlesLayout:ROW(0.5),
    gravesLayout:[[0, 1], [0, 5], [4, 1], [4, 5]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-8: the Poltergeist and the Gravekeeper at once, first form, full health (owner: "not that challenging"), with their minions:
  // Flaming Mummies, Mummies, Fogwalkers, Plague Doctors and Wisp Riders. Monsters keep coming until both fall. Introduces Emergency Pumpkins.
  { world:6, level: 8, theme:5, name:'Double Trouble', pattern:2, graves:0, total:18, interval:3.2, spMul:0.95, boss:'gravekeeper', boss2:'poltergeist', bossForm:1, gust:{ every:22, dirs:['left', 'right'], partial:true }, bossGap:2.0,
    pool:[['firemummy', 3], ['mummy', 3], ['fogwalker', 2], ['doctor', 2], ['rider', 3]],
    gravesLayout:[[0, 3], [2, 0], [2, 6], [4, 3]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:['emergency'], intro:[] },
  // 6-9: be specific (owner): chameleons (only their colour hurts), reverse chameleons (their colour cannot), flaming mummies (only Ice)
  // and fogwalkers hiding them all: kill the fogwalker to see what you need. Frenzy.
  { world:6, level: 9, theme:5, name:'Show Your Colours', pattern:3, graves:0, total:22, interval:3.0, spMul:0.95, boss:null, bossForm:1, gust:{ every:22, dirs:['left', 'right'] }, frenzy:true,
    pool:[['chameleon', 4], ['rchameleon', 4], ['firemummy', 3], ['fogwalker', 3]],
    gravesLayout:[[1, 1], [1, 5], [3, 1], [3, 5]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-10: reverse chameleons and puddle divers on 6-7's map: the sea right behind a castle row, fog down the outer lanes. Frenzy.
  { world:6, level:10, theme:5, name:'Turncoat Tide', pattern:4, graves:0, total:22, interval:3.0, spMul:0.95, boss:null, bossForm:1, gust:{ every:22, dirs:['left', 'right'] }, frenzy:true,
    pool:[['rchameleon', 6], ['diver', 4]], fogCols:[0, 6], sea:true, shoreFrac:0.44, castles:{ n:7, hp:8 }, castlesLayout:ROW(0.5),
    gravesLayout:[[0, 2], [0, 4], [4, 2], [4, 4]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-11: everything arrives with company (owner): gargoyle haulers push gargoyles, slimes split, vampires bring bats. The tide of 5-19. Frenzy.
  { world:6, level:11, theme:5, name:'Many Guests at the Door', pattern:0, graves:0, total:18, interval:3.4, spMul:0.95, boss:null, bossForm:1, gust:{ every:22, dirs:['left', 'right'] }, frenzy:true,
    pool:[['hauler', 3], ['slime', 4], ['vampire', 3]], caps:{ hauler:4 }, sea:true, shore:4,
    gravesLayout:[[2, 0], [2, 6]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-12: the Hexwitch and the Vampire Count at once, first form, full health, with their minions. The Count raises his own walls.
  { world:6, level:12, theme:5, name:'Court of Hexes', pattern:1, graves:0, total:20, interval:3.2, spMul:0.95, boss:'hexwitch', boss2:'vampirecount', bossForm:1, gust:{ every:22, dirs:['left', 'right'] }, bossGap:2.0,
    pool:[['witch', 2], ['rchameleon', 3], ['mirror', 2], ['vampire', 2], ['knight', 3], ['archer', 2], ['bulwark', 1]],
    gravesLayout:[[0, 0], [0, 6], [4, 0], [4, 6]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-13: Blind Night: fog over the whole field (owner), and everything in it is hard to aim at: wraiths fade, wisps drift, sailors
  // stagger, divers lurk in the tide at the top. Witch wind, Frenzy. A Lantern clears the fog for a while.
  { world:6, level:13, theme:5, name:'Blind Night', pattern:2, graves:0, total:22, interval:3.0, spMul:0.95, boss:null, bossForm:1, gust:{ every:22, dirs:['left', 'right'] }, frenzy:true,
    pool:[['wraith', 4], ['wisp', 4], ['sailor', 4], ['diver', 4]], fog:[[0, 1]], sea:true, shoreFrac:0.2, castles:{ n:7, hp:8 }, castlesLayout:ROW(0.5),   // a castle row hidden in the fog (owner); puddle divers in a tide over the top 20%, so it is truly blind (owner, 2026-11-03)
    gravesLayout:[[0, 3], [2, 1], [2, 5], [4, 3]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-14: Turncoat Tide 2: 6-10 with true chameleons (only their colour hurts) in place of the reverse ones, and puddle divers. Frenzy.
  { world:6, level:14, theme:5, name:'Turncoat Tide 2', pattern:3, graves:0, total:22, interval:3.0, spMul:0.95, boss:null, bossForm:1, gust:{ every:22, dirs:['left', 'right'] }, frenzy:true,
    pool:[['chameleon', 6], ['diver', 4]], fogCols:[0, 6], sea:true, shoreFrac:0.44, castles:{ n:7, hp:8 }, castlesLayout:ROW(0.5),
    gravesLayout:[[0, 2], [0, 4], [4, 2], [4, 4]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-15: Heavy Guests at the Door: 6-11's tide with the heavy ones: bulwark knights, shell turtles and puddle divers. Frenzy.
  { world:6, level:15, theme:5, name:'Heavy Guests at the Door', pattern:4, graves:0, total:18, interval:3.4, spMul:0.95, boss:null, bossForm:1, gust:{ every:22, dirs:['left', 'right'] }, frenzy:true,
    pool:[['bulwark', 3], ['turtle', 3], ['diver', 4]], sea:true, shore:4,
    gravesLayout:[[2, 0], [2, 6]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // 6-16: two pairs of Twin Tides at once (owner): each pair revives on its own; when the first pair goes down the jukebox drops.
  // First form, full health; minions from the Drowned Marsh. The finale of Release 2.
  { world:6, level:16, theme:5, name:'Four Serpents', pattern:0, graves:0, total:20, interval:3.2, spMul:0.95, boss:'twintides', boss2:'twintides', bossForm:1, bossGap:2.0, gust:{ every:22, dirs:['left', 'right'] },
    frenzy:true, frenzyAfterBoss:true, sea:true, shore:2,
    pool:[['sailor', 4], ['slime', 3], ['diver', 3], ['turtle', 2]],   // turtles rise from the sea (no puddles)
    gravesLayout:[[1, 0], [1, 6], [3, 0], [3, 6]], quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  // ---------- Release 3 (spec docs/superpowers/specs/2026-11-02-release-3-design.md): gated so a Release 2 build drops the data ----------
  ...(__RELEASE__ >= 3 ? [
    // 6-17: Knights in the Mist: fog over the top 80% and the sea over the top half; Puddle Divers lurk unseen in the water and the
    // puddles, Shield Knights and Mirror Sprites (the owner's "fairies") march out of the fog. Frenzy, witch wind.
    { world:6, level:17, theme:5, name:'Knights in the Mist', pattern:1, graves:0, total:24, interval:3.0, spMul:0.95, boss:null, bossForm:1, gust:{ every:22, dirs:['left', 'right'] }, frenzy:true,
      pool:[['knight', 5], ['mirror', 4], ['diver', 5]], fog:[[0, 0.8]], sea:true, shoreFrac:0.5, puddles:2,
      gravesLayout:CRESCENT, quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
    // 6-18: Bad Medicine: both monsters heal (owner): Plague Doctors mend their column, Vampires regenerate. Fog over the top 80%
    // and a full map of castle walls (three rows). Frenzy, witch wind.
    { world:6, level:18, theme:5, name:'Bad Medicine', pattern:2, graves:0, total:22, interval:3.0, spMul:0.95, boss:null, bossForm:1, gust:{ every:22, dirs:['left', 'right'] }, frenzy:true,
      pool:[['doctor', 5], ['vampire', 4]], fog:[[0, 0.8]], castles:{ n:21, hp:8 }, castlesLayout:[...ROW(0.3), ...ROW(0.5), ...ROW(0.7)],
      gravesLayout:DIAMOND, quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
    // 6-19: A Revisit 2 (owner): 6-4's level-16 monsters, castle row, puddles and wind, with two Frenzy rounds: a jukebox halfway
    // (its monsters are extra; the spawn bar waits at the mark until it is smashed) and another at the end. Graves: a jack-o'-lantern grin.
    { world:6, level:19, theme:5, name:'A Revisit 2', pattern:3, graves:0, total:24, interval:3.0, spMul:0.95, boss:null, bossForm:1, frenzy:true, frenzyAt:[0.5, 1],
      pool:[['firemummy', 3], ['fogwalker', 3], ['witch', 3], ['bulwark', 2], ['turtle', 3]], puddles:3,
      castles:{ n:7, hp:8 }, castlesLayout:ROW(0.5), gust:{ every:22, dirs:['left', 'right'] },
      gravesLayout:FACE, quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
    // 6-20: The Hollow King (owner): his first form (the full form is saved for later, owner 2026-11-02); five phases, each splitting off a world boss form in his colours; he takes no damage while it
    // stands. His minions are the revisit monsters. No fog, no jukebox; witch wind; graves in a crown. A 50% chance of a second boss chest.
    { world:6, level:20, theme:5, name:'The Hollow King', pattern:0, graves:0, total:24, interval:3.0, spMul:0.95, boss:'hollowking', bossForm:1, bossGap:1.4, gust:{ every:22, dirs:['left', 'right'] },
      pool:[['firemummy', 3], ['fogwalker', 3], ['witch', 3], ['bulwark', 2], ['turtle', 3]], puddles:2, bossChests:2, extraChestP:0.5,   // 2-3 boss chests: he is hard (owner, 2026-11-03)
     
      gravesLayout:CROWN, quests:[['noTools'], ['wallMin', 40]], unlockPumpkins:[], unlockGear:[], intro:[] },
  ] : []),
];

/** Releases (docs/RELEASES.md, owner 2026-11-02): 6-1 to 6-16 ship in Release 2, 6-17 to 6-20 in Release 3. */
export const releaseOf = d => d.level <= 16 ? 2 : 3;
