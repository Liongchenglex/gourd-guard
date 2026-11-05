// Nightmare 1: Pumpkin Patch: Nightmare (Release 4; spec docs/superpowers/specs/2026-11-04-release-4-nightmare-patch-design.md, Part 5).
// Reached from the demon bookmark on the world 1 book once 1-20 is beaten. Night numbers: nmNight(1, k) = 1000 + k (src/data/worlds/index.js).
// Endgame content for a player who has beaten 5-20: every level has one idea from the spec's table; the numbers are an untuned
// first draft, to be tuned with the bot later at the top profile (see docs/GAME_DESIGN.md §11). Each level sets spawnGap and spawnBurst itself, so the story rule SPAWN_LATE_FROM never decides nightmare pacing.
// Fire: `fireLayout` [lane, p] tiles and `fireStart` random tiles at night start, `fireMarks` [{at, n}] on the spawn bar (a horde arrives with each).
// After the first mark the fire keeps spreading by itself, one tile every few seconds up to 4 on the field (FIRE_TRICKLE_* in ../rules.js).
// N1-16 is the Fallen Gravekeeper, the book's boss (owner 2026-11-05).
// Wrapped in the release gate so lower builds carry none of these names. Schema: ../levels.js.
const L = d => ({ world:1, theme:6, nightmare:true, graves:0, boss:null, bossForm:1, unlockPumpkins:[], unlockGear:[], intro:[], ...d });
const Gd = d => L({ ...d, gourd:true });   // the Grave Gourd stands on the patch from N1-5 on
const LANE_ROWS = [0.3, 0.42, 0.54, 0.66, 0.78];   // one tile per field row from 30% to 78% down (p snaps to its row): a lane on fire end to end

export default __RELEASE__ >= 4 ? [
  // N1-1 Embers: fire tiles, taught with world 1 monsters. Three tiles burn from the start; one fire mark at 50% (four more and a horde).
  L({ level: 1, name:'Embers', pattern:0, total:20, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.15,
    pool:[['ghoul', 10], ['bat', 6], ['imp', 6], ['brute', 4]], fireLayout:[[1, 0.45], [3, 0.6], [5, 0.45]], fireMarks:[{ at:0.5, n:4 }],
    quests:[['noTools'], ['wallMin', 60]] }),
  // N1-2 Cockcrow: the Cinder Rooster. Its crow speeds its lane and the two beside it; where it falls it leaves a fire. Two random tiles, a mark at 60%.
  L({ level: 2, name:'Cockcrow', pattern:1, total:21, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.15,
    pool:[['ghoul', 8], ['bat', 5], ['imp', 5], ['rooster', 6]], intro:['rooster'], fireStart:2, fireMarks:[{ at:0.6, n:4 }],
    quests:[['noTouch', 'ghoul'], ['wallMin', 55]] }),
  // N1-3 Wrapped in Embers: mummies walk into the fire in the middle lanes and come out Flaming (Fire and Ice both locked in). Casket Jack is new here:
  // where it falls it becomes a Fallen Casket that lets a mummy out unless it is smashed in time. Marks at 40% and 80%.
  L({ level: 3, name:'Wrapped in Embers', pattern:2, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['mummy', 6], ['casketjack', 3], ['firemummy', 3], ['ghoul', 5], ['bat', 4]], intro:['casketjack'], fireLayout:[[2, 0.4], [3, 0.55], [4, 0.4]], fireMarks:[{ at:0.4, n:4 }, { at:0.8, n:4 }],
    quests:[['burn', 8], ['chill', 10]] }),
  // N1-4 The Strawlord: the mini boss (crows, which are introduced here; a fire trail every time it hops lanes; at half health it tears free) with Roosters and Mummies.
  // One normal chest (bossChest); beating it unlocks the Grave Gourd.
  L({ level: 4, name:'The Strawlord', pattern:3, total:16, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'strawlord', bossChest:'normal', unlockGourds:['grave'],
    pool:[['ghoul', 8], ['rooster', 5], ['mummy', 5]], intro:['crow'], fireStart:2,
    quests:[['noTools'], ['wallMin', 50]] }),
  // N1-5 The Grave Gourd: the gourd tutorial (coach). The graves ring the gourd's start cell (2, 3) and the cell it slides to (2, 4; the grave
  // at (2, 5) stops the slide), so breaking it shows them all clear. Ghouls only so the lesson is clear, then the night carries on. No fire.
  Gd({ level: 5, name:'The Grave Gourd', pattern:4, total:18, interval:3.0, spMul:1.0, spawnGap:1, spawnBurst:0.15, coach:'gourd',
    gravesLayout:[[1, 3], [3, 3], [2, 5], [1, 5], [3, 5]], pool:[['ghoul', 10]],
    quests:[['noTouch', 'ghoul'], ['bunch5', 2]] }),
  // N1-6 The Grave Riser: it digs graves anywhere in the patch; break the gourd beside them. A few graves to start, light fire.
  Gd({ level: 6, name:'The Grave Riser', pattern:0, total:20, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['ghoul', 7], ['imp', 5], ['bat', 4], ['graveriser', 5]], intro:['graveriser'], gravesLayout:[[0, 1], [0, 5], [4, 3]], fireStart:1, fireMarks:[{ at:0.5, n:4 }],
    quests:[['noTools'], ['oneLaunch', 3]] }),
  // N1-7 Haystack: the Hayrick (pitchfork pin, now and then a fork at the fence). One fire mark: walking Hayricks become Burning Hayricks. Crows from here on.
  Gd({ level: 7, name:'Haystack', pattern:1, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['hayrick', 5], ['ghoul', 7], ['imp', 5], ['crow', 4]], intro:['hayrick'], fireMarks:[{ at:0.5, n:5 }],
    quests:[['chill', 12], ['wallMin', 50]] }),
  // N1-8 Corn Maze: the Corn Husker (husk, then a fast cob). Fire in a zigzag across the middle lanes from the start.
  Gd({ level: 8, name:'Corn Maze', pattern:2, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['husker', 6], ['ghoul', 6], ['bat', 5], ['imp', 4]], intro:['husker'], fireLayout:[[1, 0.35], [2, 0.6], [3, 0.35], [4, 0.6], [5, 0.35]], fireMarks:[{ at:0.6, n:4 }],
    quests:[['bunch5', 2], ['noTouch', 'ghoul']] }),
  // N1-9 Harvest Fire: Hayricks, Huskers, Casket Jacks and Mummies together with two fire marks: keep the fire off their path.
  Gd({ level: 9, name:'Harvest Fire', pattern:3, total:21, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['hayrick', 4], ['husker', 5], ['casketjack', 3], ['mummy', 3], ['ghoul', 5]], fireStart:2, fireMarks:[{ at:0.35, n:4 }, { at:0.7, n:5 }],
    quests:[['burn', 10], ['chill', 12]] }),
  // N1-10 Dawn Chorus: a Rooster swarm with crows: constant speed bursts, and a field filling with fire from their deaths. One random tile, one small mark.
  Gd({ level:10, name:'Dawn Chorus', pattern:4, total:22, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['rooster', 12], ['crow', 5], ['ghoul', 4], ['imp', 3]], fireStart:1, fireMarks:[{ at:0.6, n:3 }],
    quests:[['wallAvg', 60], ['oneLaunch', 3]] }),
  // N1-11 The Burning Barn: three whole lanes ablaze from the start: burn through with Ice while hordes come at each of three marks.
  Gd({ level:11, name:'The Burning Barn', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12,
    pool:[['ghoul', 7], ['imp', 5], ['bat', 4], ['brute', 3], ['hayrick', 2], ['casketjack', 2]], fireLayout:[1, 3, 5].flatMap(l => LANE_ROWS.map(p => [l, p])),
    fireMarks:[{ at:0.3, n:3 }, { at:0.6, n:4 }, { at:0.9, n:4 }],
    quests:[['chill', 15], ['noTools']] }),
  // N1-12 Risen Rows: Grave Risers and two rows of graves, crows hunting the pumpkins outside the gourd's square: moving and breaking the gourd is the whole game.
  Gd({ level:12, name:'Risen Rows', pattern:1, total:21, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['graveriser', 6], ['ghoul', 6], ['crow', 4], ['brute', 3]], gravesLayout:[[1, 0], [1, 1], [1, 5], [1, 6], [3, 0], [3, 2], [3, 4], [3, 6]], fireMarks:[{ at:0.5, n:4 }],
    quests:[['bunch5', 3], ['wallMin', 45]] }),
  // N1-13 Strawlord Returns: the Strawlord in phase 2 from the start (full form health; faster flocks; a fire trail every hop), with Hayricks and Roosters.
  Gd({ level:13, name:'Strawlord Returns', pattern:2, total:18, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'strawlord', bossForm:2, bossChest:'normal',
    pool:[['ghoul', 6], ['rooster', 6], ['hayrick', 4]], fireStart:2,
    quests:[['noTools'], ['wallMin', 45]] }),
  // N1-14 Burnt Offerings: burning monsters (Flaming Mummies, Burning Hayricks and Huskers spawn burning) and a few Casket Jacks whose mummies catch on the fire: an Ice night, like 1-17.
  Gd({ level:14, name:'Burnt Offerings', pattern:3, total:16, interval:3.4, spMul:0.9, spawnGap:1, spawnBurst:0.12,
    pool:[['firemummy', 6], ['hayrickBurning', 3], ['huskerBurning', 4], ['casketjack', 2]], fireLayout:[[0, 0.5], [6, 0.5]], fireMarks:[{ at:0.5, n:4 }],
    quests:[['chill', 15], ['wallAvg', 55]] }),
  // N1-15 Eclipse: the gauntlet before the boss: every new monster, Grave Risers, three fire marks (33%, 66%, 100%).
  Gd({ level:15, name:'Eclipse', pattern:4, total:24, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['rooster', 4], ['hayrick', 3], ['husker', 4], ['graveriser', 3], ['crow', 3], ['casketjack', 2], ['ghoul', 4], ['mummy', 2]], fireMarks:[{ at:0.33, n:4 }, { at:0.66, n:4 }, { at:1, n:5 }],
    quests:[['noTools'], ['wallMin', 40]] }),
  // N1-16 The Fallen Gravekeeper (owner 2026-11-05): the nightmare patch's boss. It teleports leaving fire trails, raises Roosters, Casket Jacks and Grave
  // Risers, smashes three fences at once with a wave of fire, sets a whole row or column ablaze at 75%, 50% and 25% health, and crows swoop in all night
  // (engine/nightmare.js). Ghouls, Mummies and Hayricks walk in meanwhile. No fire marks: the boss brings its own fire. One normal chest for now (owner: reward later).
  Gd({ level:16, name:'The Fallen Gravekeeper', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'fallengravekeeper', bossChest:'normal',
    pool:[['ghoul', 7], ['mummy', 5], ['hayrick', 4]], fireStart:2,
    quests:[['noTools'], ['wallMin', 40]] }),
] : [];
