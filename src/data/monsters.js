// ---------- Monsters ----------
// coins: paid only when the kill-reward roll lands on coins (bosses always pay). drop: pumpkins dropped on a pumpkin roll (rounded, min 1).
// Behaviour lives in src/engine/monsters.js; this file is numbers and text only.

export const TYPES = {
  ghoul:  { hp:1,  r:21, sp:0.055, coins:3,  eat:0.5, pts:10, drop:1 },
  sack:   { hp:10, r:40, sp:0.05, coins:0, eat:0, pts:100, drop:0, noKnockback:true },   // Loot Sack (economy.js SACK sets its real health, stay and drops)
  // Frenzy jukebox (World 6, owner 2026-10-31): drops at the top of the field near the end of a `frenzy` night, two lanes wide like the
  // Loot Sack with the sack's health rule (spawnJukebox), never moves or eats; monsters keep coming while it stands; only pumpkins hurt it.
  jukebox:{ hp:30, r:40, sp:0, coins:20, eat:0, pts:120, drop:3, noKnockback:true },
  bat:    { hp:1,  r:16, sp:0.085, coins:3,  eat:0.4, pts:12, drop:1 },
  imp:    { hp:2,  r:17, sp:0.074, coins:5,  eat:0.6, pts:14, drop:2 },
  brute:  { hp:4,  r:28, sp:0.028, coins:10, eat:1.1, pts:30, drop:3 },
  // Wisp (world 2): today's lane drifter, renamed. Drifts to a neighbouring column every few seconds, mid-field only.
  wisp:   { hp:2,  r:21, sp:0.05,  coins:7,  eat:0.5, pts:20, drop:2 },
  // Mummy: only Fire kills it for good; any other kill makes it collapse for `rise` seconds, then it stands back up at full health.
  mummy:  { hp:2,  r:22, sp:0.045, coins:5,  eat:0.6, pts:18, drop:2, rise:4 },
  // Wraith (world 2): fades out for `hide` seconds every `show` seconds; invisible and untargetable while hidden, keeps walking.
  wraith: { hp:2,  r:21, sp:0.05,  coins:7,  eat:0.5, pts:22, drop:2, show:4, hide:2.5 },
  // Wisp Rider (world 2): fast while its carrier lives; the first hit breaks the carrier (no damage), then it walks at `walkSp`.
  rider:  { hp:2,  r:18, sp:0.11,  coins:7,  eat:0.5, pts:24, drop:2, walkSp:0.05 },
  // Plague Doctor (world 2): slow; every `healEvery` seconds heals every other monster in the 3×3 zone around it (3 lanes × 3 tile heights) by `heal`.
  doctor: { hp:3,  r:22, sp:0.035, coins:9,  eat:0.5, pts:26, drop:2, healEvery:2, heal:0.5 },
  // Shield Knight (world 3): walks in bursts; shield up (no damage taken) while moving, down while stopped.
  knight: { hp:3,  r:22, sp:0.06,  coins:9,  eat:0.6, pts:26, drop:2, move:1.6, stop:1.3 },
  // Gargoyle Hauler (world 3): pushes `push` gargoyles ahead of it; crawls while any survive, then sprints.
  hauler: { hp:3,  r:22, sp:0.02,  coins:10, eat:0.6, pts:28, drop:2, push:2, freeSp:0.075 },
  gargoyle: { hp:5, r:24, sp:0.02, coins:4,  eat:0.35, pts:12, drop:1 },
  // Skeleton Archer (world 3): stops near the top and fires an arrow down its lane every `shootEvery` s for `arrow` wall damage.
  archer: { hp:2,  r:20, sp:0.04,  coins:9,  eat:0.4, pts:24, drop:2, hold:0.14, shootEvery:5, arrow:3 },
  // Vampire (world 3 elite): arrives with `bats` bats; regenerates `regen` HP every `regenEvery` s when not hit for `calm` s.
  vampire:{ hp:5,  r:24, sp:0.045, coins:14, eat:0.7, pts:40, drop:3, bats:4, regen:1, regenEvery:2, calm:2 },   // four bats: left, right, ahead, behind; heals 1 every 2 s after 2 s calm (owner, 2026-09-26)
  // Puddle Crawler (world 4): climbs out of a random puddle instead of walking in from the top.
  crawler: { hp:2,  r:20, sp:0.05,  coins:6,  eat:0.5, pts:18, drop:2 },
  // Drunk Sailor (world 4): staggers between lanes every `stagger` seconds and lurches at uneven speed.
  sailor:  { hp:3,  r:21, sp:0.05,  coins:8,  eat:0.6, pts:24, drop:2, stagger:[1.4, 2.8] },
  // Puddle Diver (world 4): lives in a puddle; surfaces for `up` seconds to hurl a water bolt at its wall, then hides `down` seconds (untargetable).
  diver:   { hp:3,  r:20, sp:0,     coins:9,  eat:0,   pts:26, drop:2, up:2.5, down:3, bolt:2, boltSp:0.35 },
  // Splitter Slime (world 4): splits into two blobs when killed.
  slime:   { hp:3,  r:22, sp:0.045, coins:7,  eat:0.5, pts:22, drop:2, splits:2 },
  blob:    { hp:1,  r:13, sp:0.065, coins:2,  eat:0.3, pts:6,  drop:1 },
  // Chameleon (world 5): takes damage only from pumpkins of its colour (picked from the player's loadout). Tools still hurt it.
  chameleon:  { hp:2, r:21, sp:0.05,  coins:8,  eat:0.6, pts:24, drop:2 },   // 2 HP (owner, 2026-09-26); reverse chameleons keep 3
  // Reverse Chameleon (world 5): immune to pumpkins of its colour, hurt by every other colour.
  rchameleon: { hp:3, r:21, sp:0.05,  coins:8,  eat:0.6, pts:24, drop:2 },
  // Mirror Sprite (world 5): alternates reflecting (`reflect` s) and open (`open` s). While reflecting, a pumpkin bounces back down its lane into the player's wall.
  mirror:     { hp:2, r:19, sp:0.045, coins:9,  eat:0.5, pts:26, drop:2, reflect:2, open:2.5, boltSp:0.55 },
  // Level-16 monsters (owner, 2026-09-25): one per world.
  // Flaming Mummy (1-16): only Ice kills it; anything else knocks it down and it rises again. Sets ordinary mummies it passes alight, turning them into flaming mummies.
  firemummy: { hp:2, r:22, sp:0.045, coins:7, eat:0.6, pts:24, drop:2, rise:4 },
  // Fogwalker (2-16): carries a bank of fog across the whole row it walks in, hiding everything at its height, itself included. One hit.
  fogwalker: { hp:1, r:20, sp:0.05, coins:6, eat:0.4, pts:20, drop:2, band:0.06 },
  // Witch (3-16): every `hexEvery` seconds turns one monster into a chameleon or a reverse chameleon.
  witch:     { hp:3, r:22, sp:0.04, coins:9, eat:0.5, pts:26, drop:2, hexEvery:6, chameleonChance:0.25 },   // 25% chameleon, 75% reverse chameleon (owner)
  // Bulwark Knight (4-16): armoured giant; every monster inside its 3×3 aura has double health while it stays there.
  bulwark:   { hp:5, r:26, sp:0.04, coins:12, eat:0.7, pts:32, drop:3 },
  // Shell Turtle (5-16): rises from a puddle and walks backwards, shell first: a slow, tough, moving wall that shields what is behind it. Cannot be knocked back.
  turtle:    { hp:10, r:26, sp:0.03, coins:12, eat:0.3, pts:30, drop:3, noKnockback:true },
  // Bosses (docs/WORLDS.md §7). `boss:true`; spawned as type 'boss' with `kind` = the key. Never reach the wall.
  gravekeeper: { boss:true, hp:15, r:34, sp:0.03, coins:40, eat:0, pts:250, drop:6, hold:0.28, teleportEvery:6, summonEvery:8,
                 form2:{ hp:30, summonEvery:5.5, shoveEvery:12, shove:0.3 } },
  poltergeist: { boss:true, hp:20, r:32, sp:0.03, coins:45, eat:0, pts:280, drop:6, hold:0.25, driftEvery:5, swapEvery:8,
                 form2:{ hp:36, swapEvery:6.5, recolourEvery:12 } },
  // Vampire Count: holds, turns into bats to change lane, summons bats, raises castle walls, and enters a healing mode the player breaks with N hits.
  vampirecount: { boss:true, hp:24, r:34, sp:0.03, coins:50, eat:0, pts:320, drop:6, hold:0.3, laneEvery:9, batsEvery:10, bats:2, wallEvery:15, maxWalls:3, wallHp:15,
                  healEvery:20, healRate:0.5, healHits:[2, 3, 4], stun:2, form2:{ hp:42, batsEvery:8, healEvery:16, healHits:[4, 5, 6], calm:4, regen:1, regenEvery:2 } },   // trance nerf (owner): ×2–4 hits in form 1, ×4–6 in form 2, heals 1 HP per 2 s (was 2 HP/s)
  // Twin Tides: two sea serpents on the sea row lobbing water bolts at walls. Both must die within `window` seconds or the dead one rises again after `revive` seconds.
  twintides: { boss:true, hp:14, r:32, sp:0.03, coins:30, eat:0, pts:200, drop:3, hold:0.12, boltEvery:6, bolt:3, boltSp:0.3, window:8, revive:8,
               form2:{ hp:24, boltEvery:4.5, boltSp:0.45, window:5, hold:0.5 } },   // form 2 comes halfway down the field (owner)
  // The Hexwitch: drifts between lanes, conjures chameleons; form 2 also hexes monsters already on the field into chameleons.
  hexwitch: { boss:true, hp:22, r:32, sp:0.03, coins:50, eat:0, pts:320, drop:6, hold:0.25, driftEvery:6, hexEvery:9, hexCount:[2, 3], chameleonChance:0.25,   // form 2: 25% chameleon / 75% reverse (owner); form 1 is reverse only
              zoneEvery:14, zoneLast:10, zoneRise:4, zones:1, shapes:['box'], form2:{ hp:40, zones:2, shapes:['box', 'col', 'row'], hexEvery:7 } },
  // The Hollow King (6-20, Release 3; owner 2026-11-02, src/engine/hollowking.js): five phases; each splits off a world boss form (him in
  // that boss's colour, with its level-10 kit and health) and he takes no damage until it falls. Every `powerEvery` s, in turn: wipe a
  // patch column (after `wipeTell` s), smash his lane's fence by half (never below 1), summon `summonN` of the night's monsters.
  ...(__RELEASE__ >= 3 ? { hollowking: { boss:true, hp:60, r:36, sp:0.03, coins:80, eat:0, pts:500, drop:8, hold:0.3, powerEvery:12, wipeTell:1, summonN:[4, 6], driftEvery:6,
    forms:['gravekeeper', 'poltergeist', 'hexwitch', 'vampirecount', 'twintides'], formHp:{ twintides:28 }, noItems:true, form2:{ hp:60 } } } : {}),   // formHp: the Twin Tides form fights alone, so it has both serpents' health (owner, 2026-11-03)
  // Release 4, Nightmare Pumpkin Patch (spec Part 4). The Cinder Rooster crows every `crowEvery` s (not while frozen): every monster in its lane and the
  // two beside it walks `rushMul` times as fast for `rushT` s. Where it dies, however it dies, a fire tile is left (engine/nightmare.js, combat.js kill()).
  ...(__RELEASE__ >= 4 ? { rooster: { hp:3, sp:0.05, r:20, coins:6, eat:0.5, pts:20, drop:1, crowEvery:8, rushT:2, rushMul:1.6 } } : {}),
  // The Hayrick: a tank. Once, when it has walked past p 0.3, it throws its pitchfork down its column and pins the first non-gourd pumpkin it meets there (row 0, beside the fence, first) for `pinT` s
  // (engine/nightmare.js; engine/board.js treats a pinned cell like a grave). Its burning version (walks onto fire) keeps the throw and is Ice-only; `rise` is how long it lies down.
  ...(__RELEASE__ >= 4 ? { hayrick: { hp:8, sp:0.03, r:26, coins:10, eat:0.8, pts:30, drop:2, pinT:4, fenceChance:0.34, fenceHit:1 / 3, forkSp:0.9 }, hayrickBurning: { hp:8, sp:0.03, r:26, coins:10, eat:0.8, pts:30, drop:2, pinT:4, fenceChance:0.34, fenceHit:1 / 3, forkSp:0.9, rise:4 } } : {}),
  // The Corn Husker: its first hit only strips the husk (no damage); the bare cob then walks `bareMul` times as fast (combat.js hitMonsterNow, stripHusk in monsters.js).
  // Walking onto fire: husker -> huskerBurning, huskerBare -> huskerCharred (BURNS_TO). A burning husker is stripped by any pumpkin, leaving the charred cob, which is the Ice-only one
  // (`rise` s down). huskerBare / huskerCharred hold the bare cob's speed (sp x bareMul) for a night that spawns them directly.
  ...(__RELEASE__ >= 4 ? { husker: { hp:3, sp:0.04, r:22, coins:8, eat:0.6, pts:24, drop:1, bareMul:1.3 }, huskerBurning: { hp:3, sp:0.04, r:22, coins:8, eat:0.6, pts:24, drop:1, bareMul:1.3 },
    huskerBare: { hp:3, sp:0.052, r:22, coins:8, eat:0.6, pts:24, drop:1 }, huskerCharred: { hp:3, sp:0.052, r:22, coins:8, eat:0.6, pts:24, drop:1, rise:4 } } : {}),
  // The Grave Riser (spec Part 4): a slow, gaunt grave-digger. Every `digEvery` s while it is on the field (p > 0; not frozen, chewing, knocked back or down) it raises a
  // grave on a random cell anywhere on the patch with no pumpkin, gourd or grave (owner 2026-11-05: not only its own column); with no such cell it does nothing that time (engine/nightmare.js). Graves stay
  // after it dies. `barLift` raises its health pips above its tall hat (render/monsters.js). Used on N1-6, N1-12 and N1-15 (Task 12 puts it in their pools); its art (render/chars/graveriser.js) waits for the owner's look.
  ...(__RELEASE__ >= 4 ? { graveriser: { hp:3, sp:0.03, r:22, coins:8, eat:0.6, pts:24, drop:1, digEvery:7, barLift:16 } } : {}),
  // The Strawlord (N1-4, N1-13), a mini boss (engine/nightmare.js updateStrawlord): nailed to its post at the back of a lane (`hold`), it moves to another lane every
  // `moveEvery` s and casts flock every flockEvery[0] s (phase 1) / flockEvery[1] s (phase 2): `crows` (min, max) crows dive down random lanes. Phase 2 comes at half health
  // (or from the start with bossForm 2): it tears off the post but stays at the back. Fire comes only from its moves (owner 2026-11-05): each move leaves a trail of fire
  // tiles on its row across the lanes it passed over (`trailMax` at most). No boss items or costume (noItems).
  // The crow: fast and frail, flying like a bat down its lane. At the fence it flies over into the patch and takes one pumpkin anywhere outside the Grave Gourd's 3×3
  // (engine/nightmare.js crowStrike); with no such pumpkin it pecks the fence. Out of the Strawlord's coat it is a minion; from N1-5 it is also an ordinary pool monster.
  ...(__RELEASE__ >= 4 ? { strawlord: { boss:true, hp:20, r:30, sp:0.03, coins:30, eat:0, pts:200, drop:4, hold:0.12, moveEvery:8, flockEvery:[6, 4], crows:[3, 5], trailMax:4, noItems:true, form2:{ hp:30 } },
    crow: { hp:1, sp:0.11, r:14, flying:true, coins:2, eat:0.4, pts:8, drop:0, diveT:0.4 } } : {}),
  // Casket Jack (owner 2026-11-05, from docs/archive/nightmare-monsters/coffin): a slow walking coffin. Where it falls it becomes the Fallen Casket (`coffin`): a one-hit,
  // still minion that opens after `openIn` s and lets out one mummy (a minion: it does not count toward the night) unless a pumpkin smashes it first. It lets out no mummy
  // while it walks (owner, same day: that was too strong). The casket gives no loot (noReward).
  ...(__RELEASE__ >= 4 ? { casketjack: { hp:6, sp:0.025, r:24, coins:12, eat:0.7, pts:30, drop:2 },
    coffin: { hp:1, sp:0, r:22, coins:0, eat:0, pts:6, drop:0, openIn:3, openDur:0.6, noKnockback:true, noReward:true } } : {}),
  // The Fallen Gravekeeper (N1-16, the nightmare patch's boss; owner 2026-11-05; engine/nightmare.js updateFallenGK). Holds at `hold` like the Gravekeeper. Every
  // `teleportEvery` s it jumps to another lane and leaves a fire trail on its row across the lanes it passed (`trailMax` at most). Every `summonEvery` s it raises
  // `summonN` monsters from `summonPool` in or beside its lane (minions). Every `smashEvery` s it slams its spade: a wave of eclipse fire runs down its lane and the
  // two beside it and each of those fences loses `smashHit` of its full health, never its last 1. At each fraction of its health in `infernoAt` (three times a
  // fight) it sets one whole field column or row on fire. Every `crowEvery` s crows[0]..crows[1] crows swoop in on random lanes (minions). No boss items (noItems).
  ...(__RELEASE__ >= 4 ? { fallengravekeeper: { boss:true, hp:40, r:34, sp:0.03, coins:50, eat:0, pts:400, drop:6, hold:0.28, teleportEvery:6, trailMax:4,
    summonEvery:8, summonN:2, summonPool:['rooster', 'casketjack', 'graveriser'], smashEvery:12, smashHit:1 / 3, smashWave:0.45, infernoAt:[0.75, 0.5, 0.25], infernoStep:0.06,
    crowEvery:6, crows:[1, 3], noItems:true } } : {}),
};

/** Modifiers (docs/WORLDS.md §6): data-only stat tweaks any monster can carry. */
export const MODS = {
  swift:    { name:'Swift',    desc:'40% faster',           speed:1.4 },
  stubborn: { name:'Stubborn', desc:'immune to knockback',  noKnockback:true },
  armoured: { name:'Armoured', desc:'2 more health',        hp:2 },
  plain:    { name:'',         desc:'',                     hp:0 },   // a themed skin with no rule change
  padded:   { name:'Padded',   desc:'1 more health',        hp:1 },
  hungry:   { name:'Hungry',   desc:'eats walls twice as fast', eat:2 },
};

/** Returning monsters: a base type with one modifier and a world skin. Pool entries may name a variant instead of a type. */
export const VARIANTS = {
  bogGhoul: { base:'ghoul', mod:'stubborn', name:'Bog Ghoul', tint:'#4f8a6a', intro:'Bog Ghouls: one hit still does it, but the marsh mud holds them: no knockback.' },   // 1 HP (owner, 2026-09-26)
  marshImp: { base:'imp',   mod:'stubborn', name:'Marsh Imp', tint:'#6a8a4a', intro:'Marsh Imps dig their heels in: knockback does nothing to them.' },
  swiftBat: { base:'bat',   mod:'swift',    name:'Swift Bat', tint:'#8a5aa8', intro:'Swift Bats: faster than the ones you knew. One hit still does it.' },
  cryptGhoul: { base:'ghoul', mod:'stubborn', name:'Crypt Ghoul', tint:'#8a8a96', intro:'Crypt Ghouls shrug off knockback.' },
  keepImp:    { base:'imp',   mod:'padded',   name:'Keep Imp',    tint:'#9a7a6a', intro:'Keep Imps wear scraps of armour: three hits.' },   // owner: 3 HP (2026-09-26)
  siegeBrute: { base:'brute', mod:'hungry',   name:'Siege Brute', tint:'#a0453a', intro:'Siege Brutes chew walls twice as fast.' },
  drownedGhoul: { base:'ghoul', mod:'hungry',   name:'Drowned Ghoul', tint:'#3a7a8a', intro:'Drowned Ghouls are ravenous: they chew walls twice as fast.' },
  tideImp:      { base:'imp',   mod:'swift',    name:'Tide Imp',      tint:'#3aa0a8', intro:'Tide Imps ride the surf: 40% faster.' },
  bogTurtle:    { base:'brute', mod:'armoured', name:'Bog Turtle',    tint:'#3a6a5a', intro:'Bog Turtles carry a shell: six hits.' },
  soddenMummy:  { base:'mummy', mod:'stubborn', name:'Sodden Mummy',  tint:'#5a7a7a', intro:'Sodden Mummies cannot be knocked back, and still only Fire finishes them.' },
  woodGhoul:    { base:'ghoul', mod:'swift',    name:'Wood Ghoul',    tint:'#7a6a2a', intro:'Wood Ghouls run 40% faster.' },
  broomImp:     { base:'imp',   mod:'hungry',   name:'Broom Imp',     tint:'#8a4a8a', intro:'Broom Imps chew walls twice as fast.' },
  owlBat:       { base:'bat',   mod:'stubborn', name:'Owl-bat',       tint:'#a07a4a', intro:'Owl-bats shrug off knockback.' },
};

/** Burning monsters (one rule for the Flaming Mummy and, from Release 4, fire tiles): an ordinary type that walks onto a fire tile (or stands by a burning one of its
 *  family) turns into its burning version, keeping its health. A burning type is Ice-only: any other kill knocks it down for its `rise` seconds and it rises with 1 health.
 *  The Hayrick and the Corn Husker (husker, huskerBare) are in here from Release 4. */
export const BURNS_TO = { mummy:'firemummy', ...(__RELEASE__ >= 4 ? { hayrick:'hayrickBurning', husker:'huskerBurning', huskerBare:'huskerCharred' } : {}) };
export const ICE_ONLY = new Set(['firemummy', ...(__RELEASE__ >= 4 ? ['hayrickBurning', 'huskerCharred'] : [])]);
/** The Corn Husker's first hit strips its husk (no damage): husker -> huskerBare, huskerBurning -> huskerCharred. Any pumpkin strips it. */
export const HUSK_STRIP = __RELEASE__ >= 4 ? { husker:'huskerBare', huskerBurning:'huskerCharred' } : {};
/** Looks a type is always seen in during a night, baked with it so the first hit never hitches. */
export const ALSO_BAKE = __RELEASE__ >= 4 ? { husker:['huskerBare'], huskerBurning:['huskerCharred'], strawlord:['crow'], casketjack:['coffin', 'mummy'], fallengravekeeper:['rooster', 'casketjack', 'coffin', 'mummy', 'graveriser', 'crow'] } : {};   // a boss's minions too (the Strawlord's crows)
/** burning type -> the ordinary type it ignites */
export const BURNING_FROM = Object.fromEntries(Object.entries(BURNS_TO).map(([a, b]) => [b, a]));

export const BOSS_NAMES = { gravekeeper:'The Gravekeeper', poltergeist:'The Poltergeist', vampirecount:'The Vampire Count', twintides:'The Twin Tides', hexwitch:'The Hexwitch', ...(__RELEASE__ >= 3 ? { hollowking:'The Hollow King' } : {}), ...(__RELEASE__ >= 4 ? { strawlord:'The Strawlord', fallengravekeeper:'The Fallen Gravekeeper' } : {}) };
export const BOSS_NAME = BOSS_NAMES.gravekeeper;   // legacy alias used by endless mode

export const MNAME = { sack:'Loot Sack', jukebox:'Jukebox', ghoul:'Ghoul', bat:'Bat', imp:'Imp', brute:'Mossback', wisp:'Wisp', mummy:'Mummy', wraith:'Wraith', rider:'Wisp Rider', doctor:'Plague Doctor', knight:'Shield Knight', hauler:'Gargoyle Hauler', gargoyle:'Gargoyle', archer:'Skeleton Archer', vampire:'Vampire', crawler:'Puddle Crawler', sailor:'Drunk Sailor', diver:'Puddle Diver', slime:'Splitter Slime', blob:'Blob', chameleon:'Chameleon', rchameleon:'Reverse Chameleon', mirror:'Mirror Sprite', firemummy:'Flaming Mummy', fogwalker:'Fogwalker', witch:'Witch', bulwark:'Bulwark Knight', turtle:'Shell Turtle', boss:'Boss', ...(__RELEASE__ >= 4 ? { rooster:'Cinder Rooster', hayrick:'Hayrick', hayrickBurning:'Burning Hayrick', husker:'Corn Husker', huskerBare:'Bare Cob', huskerBurning:'Burning Husker', huskerCharred:'Charred Cob', crow:'Crow', graveriser:'Grave Riser', casketjack:'Casket Jack', coffin:'Fallen Casket' } : {}) };

export const BOSS_INTRO = {
  ...(__RELEASE__ >= 4 ? { fallengravekeeper: { 1:'The Gravekeeper, charred under the eclipse. He leaves fire wherever he teleports, raises roosters, Casket Jacks and Grave Risers, and slams his spade so fire tears down three fences at once. Three times he sets a whole row or column of the field ablaze, and crows swoop in all night. Monsters keep coming until he falls.' },
    strawlord: { 1:'A giant scarecrow nailed to its post at the back of the field. It flaps its coat open to loose a flock of crows down the field, and every time it hops to another lane it leaves a trail of fire behind it. At half health it tears free and the crows come faster. Monsters keep coming until it falls.',
    2:'It is already off its post: crows every few seconds, and a trail of fire every time it hops to another lane. Monsters keep coming until it falls.' } } : {}),
  ...(__RELEASE__ >= 3 ? { hollowking: { 1:'Five times he splits off a world boss in his own colours. While it stands, nothing hurts him: beat it first. He wipes a column of your patch, smashes a fence and calls monsters. They keep coming until he falls.' } } : {}),
  gravekeeper: { 1:'It stops a third of the way down and never reaches the wall, but it teleports between lanes and raises ghouls. Monsters keep coming until it falls.',
                 2:'Its full form: more health, faster summons, and every few seconds it drags a monster forward. Monsters keep coming until it falls.' },
  poltergeist: { 1:'A ghost that drifts between lanes a quarter of the way down. Every few seconds it swaps two of your pumpkins. Monsters keep coming until it falls.',
                 2:'Its full form swaps faster and repaints a pumpkin to another of your colours every few seconds. Monsters keep coming until it falls.' },
  vampirecount: { 1:'It turns into bats to change lane, calls bats and raises castle walls. Now and then it stops to heal: land the number of hits it shows to break the trance. Monsters keep coming until it falls.',
                  2:'Its full form heals whenever you leave it alone for a few seconds, on top of its healing trances. Keep hitting it. Monsters keep coming until it falls.' },
  twintides: { 1:'Two serpents on the sea row, each hurling water at your walls. Kill both within 8 seconds of each other, or the fallen one rises again. Monsters keep coming until both fall.',
               2:'Their full form throws faster and gives you only 5 seconds between the two kills. Monsters keep coming until both fall.' },
  hexwitch: { 1:'She drifts between lanes a quarter of the way down, hexes monsters into reverse chameleons two or three at a time, and lays a hex zone: anything killed inside it rises again while the zone lasts. Monsters keep coming until she falls.',
              2:'Her full form hexes into chameleons as well as reverse chameleons, and lays two hex zones at a time: a 3×3 box, a whole column, or a one-tile row across the field. Monsters keep coming until she falls.' },
};

export const GRAVES_INTRO = 'Graves now appear in your patch. They never move and block slides and pushes. Plan bunches around them.';
export const CASTLE_INTRO = 'Castle walls stand in some lanes. A pumpkin that hits one damages the wall and stops, so monsters behind it are safe until it breaks. Grey pumpkins pierce straight through; Black ones blast it and the lanes beside it.';
export const PUDDLE_INTRO = 'Puddles dot the field. Some monsters climb out of them instead of walking in from the top, and Puddle Divers hide inside them between attacks.';
export const SEA_INTRO = 'The sea has reached the top of the field. Anything can surface anywhere along it.';
export const WIND_INTRO = 'Wind blows through Witchwood. Leaves show the direction for two seconds, then every pumpkin in your patch shifts one cell that way, as if pushed. Bunches can form or break.';
export const FRENZY_INTRO = 'Near the end of the night a jukebox drops at the top of the field. Monsters keep coming while it plays. Only pumpkins can smash it.';
export const FOG_INTRO = 'Fog covers part of the field. Monsters inside it are invisible but still walking. Pumpkins fly through it and hit as normal. A Lantern clears it for a while.';
// Release 4 (nightmare track): the fire tiles card (first level with fire) and the Grave Gourd card (first level with a gourd), from level fields compared with prevLevelFor.
export const FIRE_INTRO = __RELEASE__ >= 4 ? 'Fire burns on some tiles of the field. A pumpkin that flies into a fire burns up, and the fire stays. Only Ice puts a fire out, and it stops there. Monsters walk through fire unharmed, but a mummy that does catches fire: only Ice finishes it. Marks on the spawn bar light more fire and bring a horde.' : '';
export const GOURD_INTRO = __RELEASE__ >= 4 ? 'The Grave Gourd stands on your patch. Slide it like a pumpkin; it never bunches or flies. Every sprout fills the empty cells around it. Press and hold it to break it: every grave around it is cleared, and a new gourd sprouts on the next tick.' : '';
export const PROTECTOR_INTRO = __RELEASE__ >= 5 ? 'The Protector Gourd joins your patch: pick it beside the Grave Gourd. Pumpkins in the 3×3 around it never rot, and no monster can destroy them. A pumpkin flicked from its square always knocks back and mends its fence. Press and hold it to break it: every rotten pumpkin around it turns Rainbow.' : '';

export const MINTRO = {
  bat:'New foe: bats. Quick, but one hit does it.',
  imp:'New foe: imps. They take 2 hits and hop in sudden bursts.',
  brute:'New foe: mossbacks. They take 4 hits and chew walls fast, but drop 3 pumpkins.',
  wisp:'New foe: wisps. They drift into the next column now and then.',
  mummy:'New foe: mummies. Only Fire finishes them. Anything else just knocks them down for a while.',
  wraith:'New foe: wraiths. They fade out for a few seconds at a time. You cannot hit what you cannot see; throw where they will be.',
  rider:'New foe: wisp riders. Fast while the wisp carries them. One hit breaks the wisp and they drop to a walk.',
  doctor:'New foe: plague doctors. Slow, but they keep healing every monster inside their green zone. Kill them first.',
  knight:'New foe: shield knights. The shield is up while they march and down while they rest. Hit them when they stop.',
  hauler:'New foe: gargoyle haulers. They push a line of stone gargoyles ahead of them, slowly. Break every gargoyle and the hauler sprints.',
  archer:'New foe: skeleton archers. They stop near the top and shoot arrows at your wall. Reach them behind the castle walls.',
  vampire:'New foe: vampires. They arrive ringed by four bats and heal if you leave them alone. Finish them fast.',
  crawler:'New foe: puddle crawlers. They climb out of puddles halfway down the field. Watch the water.',
  sailor:'New foe: drunk sailors. They stagger across lanes and lurch at odd speeds. Hard to line up.',
  diver:'New foe: puddle divers. They hide in a puddle, surface to hurl water at your wall, and duck under again. Hit them while they are up.',
  slime:'New foe: splitter slimes. Kill one and two blobs crawl out. Black and Grey clean them up.',
  chameleon:'New foe: chameleons. Each takes on one of your colours and only that colour hurts it. Tools still work.',
  rchameleon:'New foe: reverse chameleons. The X over their pumpkin says it all: immune to that colour, hurt by every other.',
  mirror:'New foe: mirror sprites. While the mirror is up, a pumpkin bounces straight back into your wall. Hit them when the mirror drops.',
  firemummy:'New foe: flaming mummies. Only Ice finishes them; anything else just knocks them down. They set ordinary mummies alight as they pass.',
  fogwalker:'New foe: fogwalkers. Each drags a bank of fog across its whole row, so you cannot tell which column it is in. One hit kills it. A Lantern shows it.',
  witch:'New foe: witches. Every few seconds one turns a monster into a reverse chameleon, or now and then a true chameleon.',
  bulwark:'New foe: bulwark knights. Everything inside their steel aura has double health. Kill the knight first, or pull the others out of the aura.',
  turtle:'New foe: shell turtles. They rise from puddles and walk backwards, shell towards you, like a slow wall. Grey pierces through; everything else has to chew the shell.',
  ...(__RELEASE__ >= 4 ? { rooster:'New foe: cinder roosters. Every few seconds one crows, and every monster in its lane and the lanes beside it sprints for a moment. Where it falls it leaves a fire burning.', hayrick:'New foe: hayricks. Tough haystacks. Once, each throws its pitchfork: usually down its column, pinning the first pumpkin it meets there for a few seconds so it cannot slide or be pushed (it can still fly with its bunch), but now and then straight at your fence, taking a third of it in one blow. Walking onto fire makes one a burning hayrick: only Ice finishes it.', husker:'New foe: corn huskers. The first hit only strips the husk and does no damage; the bare cob underneath walks faster. Walking onto fire makes one a burning husker, and its bare cob a charred cob: only Ice finishes that.', graveriser:'New foe: grave risers. Every few seconds one digs a grave on an empty cell anywhere in your patch. The graves stay after it falls: break your gourd beside them, or use a Grave buster.', crow:'New foe: crows. Fast and frail. One that reaches the fence flies over it and destroys a pumpkin anywhere in your patch, except the Grave Gourd and the pumpkins around it. With nothing else to take, it pecks the fence.', casketjack:'New foe: Casket Jack. A walking coffin. When it falls it becomes a Fallen Casket: smash it quickly, or it bursts open and a mummy steps out.' } : {}),
};
