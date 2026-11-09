// Nightmare 3: Witchwood: Nightmare (Release 7; spec docs/superpowers/specs/2026-11-08-release-7-nightmare-witchwood-design.md, Part 7).
// Reached from the demon bookmark on the world 3 book once 3-20 and N2-4 are beaten. Night numbers: nmNight(3, k) = 1200 + k (src/data/worlds/index.js).
// Release 7 is a beta: the numbers are first guesses, tuned by the owner from playtests, not by the bot.
// Pumpkin Patch's nightmare was fire, Foggy Hollow's rot; this one is potions. Every level has one idea from the spec's table and potions on
// the field (`potions: { every, count:[min, max], kinds?, cap? }`, rules in engine/potion.js). From N3-6 on (after the Wartling tutorial) two
// brew marks on the spawn bar bring a swoop of crows and faster potions (`brewMarks`), except on the Treant's and the boss's nights.
// Each level sets spawnGap and spawnBurst itself, so the story rule SPAWN_LATE_FROM never decides nightmare pacing.
// The Grave and Protector Gourds stand ready from N3-1 (both are unlocked by N1-4 and N2-4, which this book needs); the Wartling joins
// from N3-5, its tutorial night (pick two of three). No graves anywhere: N3-5's coach needs the Wartling's side columns clear.
// New monsters, each introduced where it first walks in: the Ash Crone (N3-2), the Blood Coven Witch (N3-3), the Flask Bearer (N3-6), the
// Cauldron Toad (N3-7), the Triptych Sprite (N3-8). The Treant holds N3-4 and N3-13, the Fallen Hexwitch N3-16.
// Wrapped in the release gate so lower builds carry none of these names. Schema: ../levels.js.
const L = d => ({ world:3, theme:8, nightmare:true, graves:0, boss:null, bossForm:1, unlockPumpkins:[], unlockGear:[], intro:[], ...d });   // theme 8 = "Witchwood: Nightmare" in WORLDS
const Gd = d => L({ gourds:['grave', 'protector'], ...d, gourd:true });   // both gourds stand ready from N3-1
const ALL3 = () => ['grave', 'protector', 'wartling'];   // N3-5 on: all three gourds on offer (pick two); a fresh list per level
const POT = (every, hi = 2, kinds, cap) => ({ every, count:[1, hi], ...(kinds ? { kinds } : {}), ...(cap ? { cap } : {}) });   // a level's potion clock
const BREW = () => [0.33, 0.66];   // two brew marks a night (N3-6 on, not on boss nights)

export default __RELEASE__ >= 7 ? [
  // N3-1 Witch's Brew: potions on the field (intro card), taught with world 3 story monsters only. 1-2 potions every 9 s.
  Gd({ level: 1, name:"Witch's Brew", pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4], ['wisp', 4]], potions:POT(9),
    quests:[['noTools'], ['wallMin', 55]] }),
  // N3-2 Ash and Crows: the Ash Crone, ringed by four crows that raid the patch, raising undead zones. Potions a little rarer.
  Gd({ level: 2, name:'Ash and Crows', pattern:1, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['woodGhoul', 9], ['ashcrone', 5], ['broomImp', 5], ['owlBat', 4]], intro:['ashcrone'], potions:POT(10),
    quests:[['wallAvg', 60], ['oneLaunch', 3]] }),
  // N3-3 Blood Coven: the Blood Coven Witch puts potions in front of monsters, so the level's own clock is slower and one at a time.
  Gd({ level: 3, name:'Blood Coven', pattern:2, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['woodGhoul', 9], ['covenwitch', 5], ['broomImp', 4], ['wisp', 4]], intro:['covenwitch'], potions:POT(11, 1),
    quests:[['bunch5', 2], ['wallMin', 50]] }),
  // N3-4 The Treant: the mini boss at the back summoning roots, with Ash Crones and Coven Witches. One normal chest; beating it unlocks the Wartling Gourd.
  Gd({ level: 4, name:'The Treant', pattern:3, total:18, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'treant', bossChest:'normal', unlockGourds:['wartling'],
    pool:[['woodGhoul', 9], ['broomImp', 5], ['ashcrone', 3], ['covenwitch', 3]], potions:POT(10),
    quests:[['noTools'], ['wallMin', 50]] }),
  // N3-5 The Wartling Gourd: its tutorial (coach:'wartling'; the potion clock holds while the coach runs), then the night carries on. All three gourds on offer.
  Gd({ level: 5, name:'The Wartling Gourd', pattern:4, total:18, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, coach:'wartling', gourds:ALL3(),
    pool:[['woodGhoul', 10], ['broomImp', 5], ['owlBat', 4], ['ashcrone', 3]], potions:POT(10),
    quests:[['wallMin', 55], ['bunch5', 2]] }),
  // N3-6 Bottle Imps: the Flask Bearer leaves a potion where it falls, so the level's clock is gentle. Brew marks from here on (intro card).
  Gd({ level: 6, name:'Bottle Imps', pattern:0, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3(),
    pool:[['flaskbearer', 7], ['woodGhoul', 8], ['broomImp', 4], ['owlBat', 4]], intro:['flaskbearer'], potions:POT(11, 1), brewMarks:BREW(),
    quests:[['oneLaunch', 3], ['wallMin', 50]] }),
  // N3-7 Toad Song: Cauldron Toads lash the fence from halfway down the field and burst into the potions they drank. Flask Bearers feed them.
  Gd({ level: 7, name:'Toad Song', pattern:1, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL3(),
    pool:[['toad', 5], ['woodGhoul', 8], ['flaskbearer', 4], ['wisp', 4]], intro:['toad'], potions:POT(9), brewMarks:BREW(),
    quests:[['noTools'], ['wallMin', 50]] }),
  // N3-8 Hall of Mirrors: the Triptych Sprite's barrier covers three lanes, with Mirror Sprites beside it. Few reflections allowed.
  Gd({ level: 8, name:'Hall of Mirrors', pattern:2, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3(),
    pool:[['triptych', 5], ['mirror', 6], ['woodGhoul', 7], ['owlBat', 3]], intro:['triptych'], potions:POT(10), brewMarks:BREW(),
    quests:[['reflectMax', 6], ['wallMin', 50]] }),
  // N3-9 Turncoat Brew: colour potions only, among Chameleons, Reverse Chameleons, Witches and Coven Witches: everything turns colour-locked.
  Gd({ level: 9, name:'Turncoat Brew', pattern:3, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3(),
    pool:[['rchameleon', 6], ['chameleon', 5], ['woodGhoul', 6], ['witch', 4], ['covenwitch', 3]], potions:POT(8, 2, ['colour']), brewMarks:BREW(),
    quests:[['wrongMax', 8], ['wallMin', 45]] }),
  // N3-10 Graveless Dead: many Ash Crones and their undead zones, so much of what falls gets back up. Flask Bearers rise with their potions again.
  Gd({ level:10, name:'Graveless Dead', pattern:4, total:22, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL3(),
    pool:[['ashcrone', 7], ['woodGhoul', 9], ['broomImp', 5], ['flaskbearer', 3]], potions:POT(10), brewMarks:BREW(),
    quests:[['bunch5', 2], ['wallMin', 45]] }),
  // N3-11 Ill Wind: Witchwood's patch wind returns (partial gusts of 2-3 columns or rows) with Flask Bearers. Quick arrivals.
  Gd({ level:11, name:'Ill Wind', pattern:0, total:22, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.16, gourds:ALL3(), gust:{ every:12, dirs:['left', 'right', 'up', 'down'], partial:true },
    pool:[['flaskbearer', 7], ['woodGhoul', 8], ['owlBat', 4], ['broomImp', 4]], potions:POT(9), brewMarks:BREW(),
    quests:[['oneLaunch', 3], ['wallMin', 45]] }),
  // N3-12 The Cauldron: Toads and Blood Coven Witches: potions everywhere (every 8 s, up to 8 on the field). Kill the witches before the toads drink.
  Gd({ level:12, name:'The Cauldron', pattern:1, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL3(),
    pool:[['toad', 6], ['covenwitch', 6], ['woodGhoul', 6], ['broomImp', 4]], potions:POT(8, 2, null, 8), brewMarks:BREW(),
    quests:[['wallAvg', 55], ['noTools']] }),
  // N3-13 Treant Returns: the Treant in form 2 (34 health, roots every 5 s in 3-4 lanes) with every new monster met so far. No brew marks. One normal chest.
  Gd({ level:13, name:'Treant Returns', pattern:2, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'treant', bossForm:2, bossChest:'normal', gourds:ALL3(),
    pool:[['woodGhoul', 7], ['ashcrone', 3], ['flaskbearer', 3], ['toad', 3], ['covenwitch', 2], ['triptych', 2]], potions:POT(9),
    quests:[['wallMin', 45], ['bunch5', 2]] }),
  // N3-14 Glass Coven: Triptych Sprites shield the Blood Coven Witches behind their barriers while the potions pile up. Mirror Sprites too.
  Gd({ level:14, name:'Glass Coven', pattern:3, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL3(),
    pool:[['triptych', 6], ['covenwitch', 6], ['woodGhoul', 6], ['mirror', 4]], potions:POT(9), brewMarks:BREW(),
    quests:[['reflectMax', 8], ['wallMin', 40]] }),
  // N3-15 The Long Night: the gauntlet before the boss: every new monster with story monsters, a longer night.
  Gd({ level:15, name:'The Long Night', pattern:4, total:26, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL3(),
    pool:[['woodGhoul', 5], ['flaskbearer', 4], ['ashcrone', 3], ['covenwitch', 3], ['triptych', 3], ['toad', 3], ['broomImp', 3], ['owlBat', 2]], potions:POT(9), brewMarks:BREW(),
    quests:[['noTools'], ['wallMin', 40]] }),
  // N3-16 The Fallen Hexwitch: the book's boss (spec Part 6): 5x5 undead zones, three altars, potions of her own, crows and fence smashes. The level's
  // own potions are rare (she summons hers); Flask Bearers and story monsters walk in meanwhile. No brew marks. One normal chest.
  Gd({ level:16, name:'The Fallen Hexwitch', pattern:0, total:22, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'fallenhexwitch', bossChest:'normal', gourds:ALL3(),
    pool:[['woodGhoul', 7], ['broomImp', 4], ['flaskbearer', 3], ['owlBat', 3]], potions:POT(12, 1),
    quests:[['wallMin', 40], ['noTools']] }),
] : [];
