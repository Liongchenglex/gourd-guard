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
  // `summonN` monsters from `summonPool` in or beside its lane (minions; owner 2026-11-11: Grave Risers and Flaming Mummies only). Every `smashEvery` s it slams its spade: a wave of eclipse fire runs down its lane and the
  // two beside it and each of those fences loses `smashHit` (owner 2026-11-11: a fifth) of its full health, never its last 1. At each fraction of its health in `infernoAt` (three times a
  // fight) it sets one whole field column or row on fire. Every `crowEvery` s crows[0]..crows[1] crows swoop in on random lanes (minions). No boss items (noItems).
  ...(__RELEASE__ >= 4 ? { fallengravekeeper: { boss:true, hp:40, r:34, sp:0.03, coins:50, eat:0, pts:400, drop:6, hold:0.28, teleportEvery:6, trailMax:4,
    summonEvery:8, summonN:2, summonPool:['graveriser', 'firemummy'], smashEvery:12, smashHit:1 / 5, smashWave:0.45, infernoAt:[0.75, 0.5, 0.25], infernoStep:0.06,
    crowEvery:6, crows:[1, 3], noItems:true } } : {}),
  // Release 5, Nightmare Foggy Hollow (spec Part 4; engine/hollow.js). Plague Doctor 2 does not heal: every other monster inside its 3x3 (the doctor's heal-zone geometry)
  // can only be hurt by rotten pumpkins while it stands. The Reaper is an upgraded Wraith (the Wraith's fade cycle: shown `show` s, hidden `hide` s). When it dies a crow bursts
  // out where it fell. At the fence its scythe swing is its chewing (owner): no interval, it wears down its own fence and both neighbours at `eat` a second each.
  ...(__RELEASE__ >= 5 ? { rotdoctor: { hp:4, sp:0.035, r:22, coins:9, eat:0.5, pts:30, drop:2 },
    reaper: { hp:3, sp:0.07, r:21, coins:9, eat:0.5, pts:28, drop:2, show:3, hide:4, reap:true },
    // Fogwalker 2: a Fogwalker with 3 health whose fog band covers two rows (`band` is the half-height of the band as a fraction of the field, twice the Fogwalker's);
    // unless it is itself a minion it brings two Mossbacks (minions) in the lanes either side when it arrives. A Lantern shows it, as the Fogwalker.
    fogwalker2: { hp:3, sp:0.045, r:24, coins:9, eat:0.5, pts:28, drop:2, band:0.12, questAs:'fogwalker' },   // questAs: counts as a fogwalker for "do not let a fogwalker reach the fence" (N2-9)
    // Wisp Rider 2 (the Comet Rider): cruises `cruise` s on the field at `sp`, then dashes at `dashSp` without stopping until it reaches the fence and chews.
    // The first hit breaks the wisp: it splits into a plain Wisp (a minion) and a walking Imp (the rider, health kept).
    comet: { hp:2, sp:0.06, dashSp:0.4, cruise:2, r:20, coins:8, eat:0.5, pts:26, drop:2 },
    // Poltergeist 2 (the Mini Poltergeist): drifts a lane every `driftEvery` s, vanishes for `vanishFor` s every `vanishEvery` s (untargetable, like a hidden Wraith),
    // and every `rotEvery` s rots `rotN` random pumpkins outside any Protector square (a cast tell of `castFor` s, then a puff on each).
    minipolt: { hp:3, sp:0.04, r:22, coins:9, eat:0.5, pts:28, drop:2, driftEvery:5, vanishEvery:7, vanishFor:2, rotEvery:6, rotN:[1, 2], castFor:0.45 },
    // The Lamplighter (N2-4, N2-13), a mini boss (engine/hollow.js updateLamplighter): holds at the back of a lane (`hold`) like the Strawlord. It has two moods and
    // switches every `moodEvery` s (starting clean): in its clean mood (amber lantern) only normal pumpkins hurt it, in its rot mood (sickly green) only rotten
    // ones do; the wrong kind does nothing (no heal either). Every `driftEvery` s it drifts to another lane; every `fogEvery` s it calls one poison fog row or
    // column on the patch (the level's poison.dur). form2 (N2-13): more health, a faster mood clock. No boss items or costume (noItems).
    lamplighter: { boss:true, hp:24, r:32, sp:0.03, coins:40, eat:0, pts:300, drop:6, hold:0.14, moodEvery:8, driftEvery:8, fogEvery:12, noItems:true, form2:{ hp:34, moodEvery:6 } },
    // The Fallen Poltergeist (N2-16, the hollow nightmare's boss; spec Part 8; engine/hollow.js updateFallenPolt): holds at `hold` like the Poltergeist. Every
    // `vanishEvery` s it vanishes and reappears in another lane, and `swapN` pumpkins outside any Protector square trade places as it does (owner 2026-11-11);
    // every `zoneEvery` s it lays a black fog 3x3 (Plague Doctor 2's square) for `zoneFor` s around a random monster: inside, only rotten pumpkins hurt. At each
    // fraction in `reaperAt` it enters a reaper phase (a hit never carries it past the next one): only rotten pumpkins hurt it until `reaperHits` of them have,
    // and entering one reshuffles the whole patch. Every `lanternEvery` s `lanternN` cursed lanterns (`lanternHp` health, `lanternFor` s) light at fences; one
    // unbroken in time takes `lanternHit` of its fence's full health (never its last 1). No boss items or costume (noItems).
    fallenpoltergeist: { boss:true, hp:45, r:34, sp:0.03, coins:50, eat:0, pts:400, drop:6, hold:0.25, vanishEvery:6, swapN:3, zoneEvery:12, zoneFor:8,
      reaperAt:[0.75, 0.5, 0.25], reaperHits:3, lanternEvery:20, lanternN:3, lanternHp:3, lanternFor:10, lanternHit:0.5, noItems:true } } : {}),
  // Release 7, Nightmare Witchwood (spec Part 3; engine/witchwood.js). The Flask Bearer, a quick little imp, leaves one potion of a random kind on its tile when it
  // dies (the nearest free tile when that one holds a potion). The Cauldron Toad walks to `tongueHold` of the field and stops there: from then on it lashes its own
  // fence with its tongue at `eat` a second (its chew from range; a speed potion makes it 1.5x). It drinks potions like any monster; when it dies it bursts and every
  // potion it drank lands back on the field, one per tile, on the free tiles nearest where it died (ring by ring outwards).
  ...(__RELEASE__ >= 7 ? { flaskbearer: { hp:2, sp:0.055, r:18, coins:8, eat:0.5, pts:24, drop:2 },
    toad: { hp:5, sp:0.03, r:24, coins:10, eat:0.5, pts:30, drop:2, tongueHold:0.45 },   // owner 2026-11-09: lashes from farther away (was 0.67)
    // The Ash Crone raises an undead zone (G.hexZones, the Hexwitch's 3×3 box) every `zoneEvery` s for `zoneLast` s, centred on a monster within 2 lanes
    // of her; she arrives ringed by `crows` crows. The Blood Coven Witch brews every `brewEvery` s: brewN[0]..brewN[1] potions, each on the tile just
    // ahead of a monster on the field (engine/witchwood.js).
    ashcrone: { hp:4, sp:0.035, r:22, coins:9, eat:0.5, pts:30, drop:2, zoneEvery:6, zoneFirst:1.5, zoneLast:8, crows:4 },   // owner 2026-11-09: more often (was 10 s) and soon after she spawns
    covenwitch: { hp:3, sp:0.04, r:22, coins:9, eat:0.5, pts:28, drop:2, brewEvery:5, brewFirst:1.5, brewN:[1, 2] },   // owner 2026-11-09: more often (was 7 s) and soon after she spawns
    // The Triptych Sprite: the Mirror Sprite's cycle (barrier up `reflect` s, down `open` s, down while it chews) with a barrier `lanes` lanes either side of
    // its own: a pumpkin meeting it in any of them flies back down that lane into its fence for the pumpkin's power (combat.js reflectPumpkin, game.js).
    triptych: { hp:3, sp:0.04, r:26, coins:10, eat:0.5, pts:32, drop:2, reflect:2, open:2.5, lanes:1 },
    // The Treant (N3-4, N3-13), a mini boss (engine/witchwood.js updateTreant): holds at `hold` like the Lamplighter and never moves from there. Every
    // `rootEvery` s it summons rootN[0]..rootN[1] roots in other lanes: a mid-field root blocks its lane until `rootHp` pumpkins hit it; a fence root
    // squeezes its fence at `rootSqueeze` a second until destroyed the same way or it sinks after `rootLast` s. form2 (N3-13): more health, more
    // roots more often. No boss items or costume (noItems).
    treant: { boss:true, hp:24, r:34, sp:0.03, coins:40, eat:0, pts:300, drop:6, hold:0.12, rootEvery:7, rootN:[2, 3], rootHp:3, rootSqueeze:0.5, rootLast:8, noItems:true, form2:{ hp:34, rootEvery:5, rootN:[3, 4] } },
    // The Fallen Hexwitch (N3-16, the witchwood nightmare's boss; spec Part 6; engine/witchwood.js updateFallenHex): holds at `hold` like the Fallen Gravekeeper.
    // Every `zoneEvery` s she lays a 5x4 undead zone (G.hexZones shape 'box54', owner 2026-11-11) for `zoneLast` s; every `potionEvery` s potionN[0]..potionN[1] potions land on
    // random field tiles; every `crowEvery` s crows[0]..crows[1] crows swoop in at the top of random lanes (minions); every `smashEvery` s she strikes her
    // own lane's fence for `smashHit` of its full health (never its last 1; a black crow carries it), then glides glide[0]..glide[1] lanes. Every
    // `summonEvery` s (owner 2026-11-11) 2 Treant roots and an Ash Crone, a Blood Coven Witch and a Witch (extras). At each fraction of her health in
    // `altarAt` an altar (`altarHp` health, only pumpkins hurt it) rises in another lane at the back: while it stands she takes no damage. She does not
    // hex. No boss items or costume (noItems).
    fallenhexwitch: { boss:true, hp:45, r:34, sp:0.03, coins:50, eat:0, pts:400, drop:6, hold:0.28, zoneEvery:12, zoneLast:10, potionEvery:8, potionN:[2, 3],
      crowEvery:6, crows:[1, 3], smashEvery:10, smashHit:0.5, glide:[1, 2], altarAt:[0.75, 0.5, 0.25], altarHp:8, summonEvery:16, noItems:true } } : {}),
  // Release 8, Nightmare Crumbling Keep (spec Part 3; engine/keep.js). The Lobber Cart rolls in to `park` of the field and stops there for good: it never
  // chews (`eat` 0) and never comes down to the wall. From then on, every `lobEvery` seconds (random in the range) it lobs a net onto a random pumpkin
  // (engine/nets.js); its first lob comes `lobFirst` s after it parks. Its nets stay when it dies. It is never knocked back and a Magnet never pulls it
  // (owner 2026-11-09: it stays put and lobs; was hp 6, lobEvery [6, 8], first lob 6-8 s).
  // The Storm Lancer charges from the moment it spawns at `charge` times its walk (Ice slows the charge); at the fence it takes `fenceHit` of the fence's
  // full health, never the last 1, and is gone without a reward. The Storm Marshal raises his sword for `rallyLast` s every `rallyEvery` s: monsters in
  // his 3x3 move `rallySp` times faster while it is up, and at the start of each rally each gets `rallyHp` times its health, once ever (engine/keep.js).
  ...(__RELEASE__ >= 8 ? { lancer: { hp:5, sp:0.03, charge:5, r:26, coins:10, eat:0, pts:30, drop:2, fenceHit:0.5, chew:0.6 },
    marshal: { hp:10, sp:0.03, r:28, coins:12, eat:0.5, pts:36, drop:3, rallyEvery:8, rallyLast:4, rallySp:2, rallyHp:2 } } : {}),
  // Release 9, Nightmare Drowned Marsh (spec Part 3; engine/marsh.js). The Blood Slime splits into `splits` Bloodlets when killed; each blob swells over `regrow` s
  // (not while frozen) and becomes a full Blood Slime again where it stands, for ever if the player is slow. SLIME_CAP is the most slimes and blobs alive at once.
  // The Pirate picks a number of shots from `shots` and that many stop points in `stopAt` (fractions of the field); at each he aims for `aim` s, then destroys the
  // pumpkin nearest the top of the patch in his column (never a gourd; a gourd's square does not protect). No pumpkin in the column: he walks on.
  ...(__RELEASE__ >= 9 ? { bloodslime: { hp:4, r:23, sp:0.045, coins:8, eat:0.5, pts:24, drop:2, splits:3 },
    bloodblob: { hp:1, r:13, sp:0.065, coins:2, eat:0.3, pts:6, drop:1, regrow:6 },
    pirate: { hp:4, r:22, sp:0.04, coins:10, eat:0.6, pts:28, drop:2, shots:[1, 2], stopAt:[0.3, 0.6], aim:1 },
    // The Turtle Rider walks backward, shell first, as the Shell Turtle (Grey pierces it); every `rotEvery` s it throws a rotten pumpkin that flies `rotFly` s and rots
    // a pumpkin of its column or a neighbouring one; killed, it lets its Imp loose. The Storm Eel is a Puddle Diver that charges `charge` s before its bolt and, each
    // time it dives, comes up in another pool or another spot of the tide (engine/marsh.js).
    turtlerider: { hp:10, r:26, sp:0.03, coins:14, eat:0.3, pts:34, drop:3, noKnockback:true, rotEvery:7, rotFly:0.7 },
    eel: { hp:3, r:20, sp:0, coins:10, eat:0, pts:28, drop:2, up:2.5, down:3, charge:0.5, bolt:2, boltSp:0.35 },
    // The Siren surfaces at the live shore - 0.03 in her lane and never walks. `firstSong` s after she surfaces, then every `singEvery` s, she sings (owner 2026-11-11):
    // a note drifts down her lane, a random row or column not already hidden is warned for 1.5 s and then drawn as red spheres for 6 s (engine/marsh.js songLine),
    // and a Blood Slime rises in her lane at the shore as an extra (none while SLIME_CAP stand). Never taken by whirlpools (tide.js WHIRL_NEVER).
    siren: { hp:6, r:24, sp:0, coins:12, eat:0, pts:32, drop:2, back:true, singEvery:7, firstSong:2 },
    // The Kraken (N5-4, N5-13), a mini boss (engine/marsh.js updateKraken): its head starts down; `tentacles` tentacles rise at distinct random spots in the tide (minions, not
    // counted in the night's total). A downed tentacle rises again `regrow` s after it fell while the head is down; when every one is down at once the head rises at a random
    // spot in the tide for `upFor` s and can be hit, then dives and a fresh full set rises (its health carries over). It never walks (sp 0), is never frozen or knocked back,
    // and whirlpools never take it. Each tentacle throws an anchor down its lane every `anchorEvery` s for `anchorDmg` wall damage (set below: 1.5 x a Diver bolt), held while
    // its fence is down. form2 (N5-13): more health, five tentacles. No boss items or costume (noItems).
    kraken: { boss:true, hp:20, r:34, sp:0, coins:40, eat:0, pts:300, drop:6, upFor:8, tentacles:3, regrow:6, noItems:true, noKnockback:true, form2:{ hp:32, tentacles:5 } },
    tentacle: { hp:3, r:20, sp:0, coins:3, eat:0, pts:8, drop:0, anchorEvery:6, anchorSp:0.35, noKnockback:true },
    // The Fallen Twin Tides (N5-16, engine/marsh.js updateFallenTides): two bosses, `twin` 'blood' and 'blue', in distinct lanes, each holding in the tide at
    // min(hold, the live shore) and never reaching the wall. At each `diveAt` mark of its own health a twin dives and rises at a random spot in the water in another lane.
    // Killed together: when one falls it is down and untargetable for `window` s; the other falling inside that window ends the fight, else the first rises at full
    // health and the rule starts over. Both throw a bolt down their own lane every `boltEvery` s for `boltDmg` (blood: a blood bolt; blue: a water bolt), and each dive
    // fires a spear down the lane it dives from that takes `diveHit` of that fence's full health (owner 2026-11-11). Blood: sings every `songEvery` s (eyes red, hides a
    // row or column as the Siren) and summons one of `summonPool` every `summonEvery` s as an extra; at each `sphereAt` health (once per life) it shuts itself in a blood
    // sphere and raises `sphereTentacles` Tentacles in the water: immune and healing `sphereHeal`/s until the last of them falls. Down, it hides `downCols` patch columns.
    // Blue: every `spearEvery` s a water spear takes a whole patch column (gourds spared) after `spearWarn` s of warning; every `pumpEvery` s (eyes blue) a hydro pump
    // warns its lane and the two beside it `pumpWarn` s and then takes `pumpHit` of each of those fences' full health. Down, it drives the tide to TIDE_STOP until it
    // rises. noItems: no boss items or costume.
    fallentides: { boss:true, hp:30, r:34, sp:0.03, coins:50, eat:0, pts:400, drop:6, hold:0.12, window:12, diveAt:[0.75, 0.5, 0.25], boltEvery:6, boltDmg:3, boltSp:0.3, songEvery:14,
      diveHit:1 / 3, sphereAt:[15, 5], sphereTentacles:4, sphereHeal:1, downCols:3,
      spearEvery:12, spearWarn:1.5, pumpEvery:16, pumpWarn:1, pumpHit:0.25, summonEvery:15, summonPool:['bloodslime', 'pirate', 'eel'], noItems:true } } : {}),
  ...(__RELEASE__ >= 8 ? { lobbercart: { hp:12, sp:0.02, r:26, coins:10, eat:0, pts:30, drop:2, park:0.15, lobEvery:[3.5, 4.5], lobFirst:1, noKnockback:true } } : {}),
  // The Blood Glutton throws `netsAtSpawn` red nets when it spawns and, every `netEvery` s, one more while it has fewer than `netMax` of its own (on the
  // patch or in flight). While any of its red nets lies on the patch it takes no damage (engine/keep.js shieldedNow). When it dies its red nets turn
  // ordinary. The Bat Bride veils the nearest other monster within `veilReach` lanes (never another Bride): it takes no damage until she dies. One veil
  // at a time; `veilAgain` s after the veiled one is gone she veils the next.
  ...(__RELEASE__ >= 8 ? { glutton: { hp:8, sp:0.03, r:24, coins:12, eat:0.5, pts:34, drop:3, netsAtSpawn:2, netEvery:10, netMax:2 },
    bride: { hp:6, sp:0.035, r:22, coins:10, eat:0.5, pts:30, drop:2, veilReach:1, veilAgain:3 } } : {}),
  // The Siege Tower (N4-4, N4-13), a mini boss (engine/keep.js updateSiege): rolls very slowly down one lane and holds at `hold`, never reaching the wall. It carries
  // `archers` Skeleton Archers; a pumpkin's hit knocks one off and costs it no health until both are gone. Every `volleyEvery` s each archer left looses an arrow down its
  // lane (`volleyDmg` wall damage); every `netEvery` s it lobs a net (thrown by it, cleared when it falls); every `rampEvery` s the ramp drops and a Storm Lancer or
  // a Storm Marshal (never a second Marshal of its own) walks out just ahead of it. form2 (N4-13): more health. No boss items or costume (noItems).
  ...(__RELEASE__ >= 8 ? { siegetower: { boss:true, hp:24, r:34, sp:0.012, coins:40, eat:0, pts:300, drop:6, hold:0.35, archers:2, volleyEvery:6, volleyDmg:3, arrowSp:0.4, netEvery:9, rampEvery:12, noItems:true, form2:{ hp:34 } } } : {}),
  // The Fallen Count (N4-16), the Keep nightmare's boss (engine/keep.js updateFallenCount): walks like the Vampire Count to `hold` and holds (no bat scatter, no storm surge:
  // owner); from 2026-11-11 he teleports between lanes there (`tpEvery`). Blood nets: at each `netAt` mark of his health (the start included) `netN` red nets of his; while any stands he takes no
  // damage, and a hit never carries him past the next mark. Blood trance every `tranceEvery` s: heals `tranceHeal` per netted pumpkin on the patch every `tranceTick`
  // s, `tranceHits` hits break it and stun him `tranceStun` s. Blood spear every `spearEvery` s: each fence it hits loses `spearHit` of its full health, never its last 1.
  // Every `tpEvery` s (owner 2026-11-11) he teleports to another lane at his hold and brings the lightning: his new lane's patch column is warned `boltWarn` s,
  // then every un-netted pumpkin in it goes. The spear is three at once, his lane and `spearLanes` either side. Every `summonEvery` s one Storm Lancer and one
  // Bat Bride; every `raiseEvery` s an Archer Tower and a Gatehouse (sending out `gatePool`), each only if none of his stands. No boss items (noItems).
  ...(__RELEASE__ >= 8 ? { fallencount: { boss:true, hp:48, r:34, sp:0.03, coins:50, eat:0, pts:400, drop:6, hold:0.3, netAt:[1, 0.75, 0.5, 0.25], netN:3, tranceEvery:18, tranceHeal:1, tranceTick:2, tranceHits:3, tranceStun:2,
    spearEvery:10, spearHit:1 / 3, spearLanes:1, tpEvery:10, boltWarn:1.5, summonEvery:14, raiseEvery:20, gatePool:['knight', 'bulwark', 'vampire'], noItems:true } } : {}),
};
if (__RELEASE__ >= 9) TYPES.tentacle.anchorDmg = 1.5 * TYPES.diver.bolt;   // a Kraken tentacle's anchor hits the fence for a Diver bolt and a half (computed from the Diver's number, not copied)

/** Blood Slimes and blobs alive at once, at most (Release 9, spec Part 3: a split that would go over makes only as many blobs as fit). */
export const SLIME_CAP = __RELEASE__ >= 9 ? 12 : 0;

/** Release 8's castle pieces (spec Part 3; engine/keep.js): health as a multiple of the level's castle wall health, and the clocks. */
export const PIECES = __RELEASE__ >= 8 ? { gateHp:2.5, towerHp:3, gateEvery:8, towerShot:5 } : null;

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
export const ALSO_BAKE = __RELEASE__ >= 4 ? { husker:['huskerBare'], huskerBurning:['huskerCharred'], strawlord:['crow'], casketjack:['coffin', 'mummy'], fallengravekeeper:['graveriser', 'firemummy', 'crow'], ...(__RELEASE__ >= 5 ? { reaper:['crow'], fogwalker2:['brute'], comet:['wisp', 'imp'] } : {}), ...(__RELEASE__ >= 7 ? { treant:['root'], fallenhexwitch:['crow', 'root', 'ashcrone', 'covenwitch', 'witch'], ashcrone:['crow'] } : {}), ...(__RELEASE__ >= 9 ? { bloodslime:['bloodblob'], eel:['stormbolt'], turtlerider:['rotshot', 'imp'], siren:['sirennote', 'bloodslime', 'bloodblob'], kraken:['tentacle', 'anchor'], fallentides:['bloodslime', 'bloodblob', 'pirate', 'eel', 'stormbolt', 'tentacle', 'anchor'] } : {}), ...(__RELEASE__ >= 8 ? { siegetower:['siegetower|a2', 'siegetower|a1', 'siegetower|a0', 'lancer', 'marshal'], fallencount:['lancer', 'bride', 'knight', 'bulwark', 'vampire', 'bat', 'archer'] } : {}) } : {};   // a boss's minions too (the Strawlord's crows)
/** burning type -> the ordinary type it ignites */
export const BURNING_FROM = Object.fromEntries(Object.entries(BURNS_TO).map(([a, b]) => [b, a]));

export const BOSS_NAMES = { gravekeeper:'The Gravekeeper', poltergeist:'The Poltergeist', vampirecount:'The Vampire Count', twintides:'The Twin Tides', hexwitch:'The Hexwitch', ...(__RELEASE__ >= 3 ? { hollowking:'The Hollow King' } : {}), ...(__RELEASE__ >= 4 ? { strawlord:'The Strawlord', fallengravekeeper:'The Fallen Gravekeeper' } : {}), ...(__RELEASE__ >= 5 ? { lamplighter:'The Lamplighter', fallenpoltergeist:'The Fallen Poltergeist' } : {}), ...(__RELEASE__ >= 7 ? { treant:'The Treant', fallenhexwitch:'The Fallen Hexwitch' } : {}), ...(__RELEASE__ >= 8 ? { siegetower:'The Siege Tower', fallencount:'The Fallen Count' } : {}), ...(__RELEASE__ >= 9 ? { kraken:'The Kraken', fallentides:'The Fallen Twin Tides' } : {}) };
export const BOSS_NAME = BOSS_NAMES.gravekeeper;   // legacy alias used by endless mode

export const MNAME = { sack:'Loot Sack', jukebox:'Jukebox', ghoul:'Ghoul', bat:'Bat', imp:'Imp', brute:'Mossback', wisp:'Wisp', mummy:'Mummy', wraith:'Wraith', rider:'Wisp Rider', doctor:'Plague Doctor', knight:'Shield Knight', hauler:'Gargoyle Hauler', gargoyle:'Gargoyle', archer:'Skeleton Archer', vampire:'Vampire', crawler:'Puddle Crawler', sailor:'Drunk Sailor', diver:'Puddle Diver', slime:'Splitter Slime', blob:'Blob', chameleon:'Chameleon', rchameleon:'Reverse Chameleon', mirror:'Mirror Sprite', firemummy:'Flaming Mummy', fogwalker:'Fogwalker', witch:'Witch', bulwark:'Bulwark Knight', turtle:'Shell Turtle', boss:'Boss', ...(__RELEASE__ >= 4 ? { rooster:'Cinder Rooster', hayrick:'Hayrick', hayrickBurning:'Burning Hayrick', husker:'Corn Husker', huskerBare:'Bare Cob', huskerBurning:'Burning Husker', huskerCharred:'Charred Cob', crow:'Crow', graveriser:'Grave Riser', casketjack:'Casket Jack', coffin:'Fallen Casket' } : {}), ...(__RELEASE__ >= 5 ? { rotdoctor:'Plague Doctor 2', reaper:'Reaper', fogwalker2:'Fogwalker 2', comet:'Wisp Rider 2', minipolt:'Poltergeist 2' } : {}), ...(__RELEASE__ >= 7 ? { flaskbearer:'Flask Bearer', toad:'Cauldron Toad', ashcrone:'Ash Crone', covenwitch:'Blood Coven Witch', triptych:'Triptych Sprite' } : {}), ...(__RELEASE__ >= 8 ? { lobbercart:'Lobber Cart', lancer:'Storm Lancer', marshal:'Storm Marshal', glutton:'Blood Glutton', bride:'Bat Bride' } : {}), ...(__RELEASE__ >= 9 ? { bloodslime:'Blood Slime', bloodblob:'Bloodlet', pirate:'Drowned Pirate', turtlerider:'Turtle Rider', eel:'Storm Eel', siren:'Siren', tentacle:'Tentacle' } : {}) };

export const BOSS_INTRO = {
  ...(__RELEASE__ >= 7 ? { treant: { 1:'A great hollow tree at the back of the field. It never moves, but every few seconds it summons roots in other lanes. A root on the field stops every pumpkin flicked up its lane until three have hit it; a root at your fence squeezes it until three hits break it or it sinks. Monsters keep coming until it falls.',
    2:'Its roots come faster now, three or four at a time. Break the ones in your way, and the ones squeezing your fences. Monsters keep coming until it falls.' },
    fallenhexwitch: { 1:'The Hexwitch, drained of every colour but red. She lays great undead zones where the dead rise again, scatters potions across the field, sends crows swooping in and sends a black crow to smash your fence before gliding away, more crows following her glide. Every 16 seconds she calls her coven: two Treant roots, an Ash Crone, a Blood Coven Witch and a Witch. Three times she raises an altar in another lane, and a black crow drops that lane\u2019s fence to its last bit: while the altar stands nothing hurts her, so break it with pumpkins. Monsters keep coming until she falls.' } } : {}),
  ...(__RELEASE__ >= 5 ? { lamplighter: { 1:'A hooded figure with a ghost lantern, drifting at the back of the field. It switches moods: while its lantern burns amber only normal pumpkins hurt it, while it burns sickly green only rotten ones do. It drifts between lanes and calls poison fog onto your patch. Monsters keep coming until it falls.',
    2:'Its lantern switches colour faster now: amber, only normal pumpkins hurt it; green, only rotten ones. It still calls poison fog onto your patch. Monsters keep coming until it falls.' },
    fallenpoltergeist: { 1:'The Poltergeist, rotted through. It vanishes from lane to lane, swapping your pumpkins each time, and lays black fog where only rotten pumpkins hurt. At three quarters, half and a quarter of its health it turns reaper and shuffles your whole patch: then only rotten pumpkins hurt it, three of them (the badge counts them). Every 20 seconds it lights three cursed lanterns at your fences: break each with pumpkins before its 10 seconds run out, or it bursts and takes half that fence. Rotten pumpkins heal it otherwise. Pumpkins in a Protector square stay put. Monsters keep coming until it falls.' } } : {}),
  ...(__RELEASE__ >= 8 ? { siegetower: { 1:'A wooden tower on wheels, rolling very slowly down one lane. Two Skeleton Archers on top loose a volley at your wall every few seconds, and pumpkins hit the archers first: knock both off before the tower itself takes damage. It lobs nets onto your patch, and every so often its ramp drops and a Storm Lancer or a Storm Marshal charges out. Monsters keep coming until it falls.',
    2:'A sturdier tower, with the same two archers, the same nets and the same ramp. Knock the archers off first. Monsters keep coming until it falls.' } } : {}),
  ...(__RELEASE__ >= 8 ? { fallencount: { 1:'The Vampire Count, fallen to the storm. He walks a third of the way down the field and holds there. At the start and at three quarters, half and a quarter of his health he throws three red nets onto your pumpkins, and while any of them is on the patch nothing hurts him: launch them with their bunch or break a Crookneck Gourd. He falls into blood trances that heal him for every netted pumpkin (hit him 3 times to break one), hurls three blood spears at once (his lane and the two beside it), and every 10 seconds he teleports to another lane and calls lightning down that column of your patch (netted pumpkins survive it); he summons Storm Lancers and Bat Brides, and raises an Archer Tower and a Gatehouse. Monsters keep coming until he falls.' } } : {}),
  ...(__RELEASE__ >= 9 ? { kraken: { 1:'The Kraken keeps its head under the red tide and sends up three tentacles, and each one throws an anchor down its lane at your fence every few seconds. Kill all three tentacles before any of them can rise again and the head surfaces for a few seconds: hit it then, before it dives. Monsters keep coming until it falls.',
    2:'A bigger Kraken: more health, and five tentacles to bring down at once before its head will rise. Monsters keep coming until it falls.' },
    fallentides: { 1:'Two night serpents hold in the red tide, a blood twin and a blue one, and neither reaches your wall. Each dives and surfaces elsewhere in the water as it is hurt, and every dive throws a spear at the fence it leaves. Fell one and the other has 12 seconds to fall too, or it rises at full health. The blood twin throws blood bolts, sings rows and columns into red spheres and summons help; at 15 and 5 health it shuts itself in a blood sphere and raises four tentacles: it heals until you cut them all. The blue twin throws water bolts, spears a whole column of your patch after a warning (gourds are spared) and blasts three fences with its hydro pump. While the blood twin is down three columns hide; while the blue twin is down the tide surges to your fence. Monsters keep coming until both fall.' } } : {}),
  ...(__RELEASE__ >= 4 ? { fallengravekeeper: { 1:'The Gravekeeper, charred under the eclipse. He leaves fire wherever he teleports, raises Grave Risers and Flaming Mummies, and slams his spade so fire tears down three fences at once. Three times he sets a whole row or column of the field ablaze, and crows swoop in all night. Monsters keep coming until he falls.' },
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
// Release 5 (the hollow nightmare): the poison fog and rotten pumpkin cards, on the first level with `poison` (N2-1).
export const POISON_INTRO = __RELEASE__ >= 5 ? 'Poison fog rolls over your patch. Green arrows warn you first, then the fog lies over one or two whole rows or columns for a few seconds. Every pumpkin under it turns rotten, and so does any pumpkin slid or sprouted into it while it lasts. Gourds never rot.' : '';
export const ROT_INTRO = __RELEASE__ >= 5 ? 'A rotten pumpkin bunches with other rotten ones and flies like any pumpkin, but it heals the monster it hits instead of hurting it. Some foes are hurt only by rot: every monster in a Plague Doctor 2\'s square, and the Lamplighter when its lantern burns green. Aim your rot, or crush it by holding it.' : '';
export const NET_INTRO = __RELEASE__ >= 8 ? 'Monsters throw nets onto your patch tonight. A netted pumpkin is stuck: it cannot slide, be pushed or be crushed, and it cannot be flicked on its own. It still bunches with its colour, lights up and flies with its bunch, taking the net with it. A red net also keeps the monster that threw it from harm until it is gone.' : '';   // Release 8, the first netting night (N4-1)
export const TOWER_INTRO = __RELEASE__ >= 8 ? 'A castle wall with a Skeleton Archer on top, shooting down its lane at your fence. It stops your pumpkins like any castle wall, Grey too. Break it and the archer drops to the rubble and fights on from there.' : '';   // Release 8 (N4-5)
export const GATE_INTRO = __RELEASE__ >= 8 ? 'A castle wall with a gate. Every few seconds the gate opens and a monster walks out of it, one at a time, for as long as it stands. Break it to stop them.' : '';   // Release 8 (N4-7)
export const CROOK_INTRO = __RELEASE__ >= 8 ? 'The Crookneck Gourd joins your patch tonight, in your first gourd slot. No net can land in the 3×3 around it, and every pumpkin in its square lights up and flies together, any colour (two or more). Press and hold it to break it: every net on the patch comes off, red nets too.' : '';   // Release 8, given on its first night (N4-3)
// Release 9 (the marsh nightmare): the blood tide card (N5-1, the first night with tide marks) and the Whirlpools card (the first night with a pair).
export const TIDE_INTRO = __RELEASE__ >= 9 ? 'The red tide is rising. Marks on the spawn bar show when the shore surges down the field: the monsters keep coming from the new shoreline, pools it reaches are swallowed, and whatever hid in them is in the tide now. It never reaches your fence, but each surge shortens the walk.' : '';
export const WHIRL_INTRO = __RELEASE__ >= 9 ? 'Whirlpools come in linked pairs, both set in the water. A monster that walks over one end comes out of the other, in that end\u2019s lane, and cannot be taken again for a moment. Divers, eels, sirens, tentacles and bosses ignore them. When the tide swallows an end, it moves to the water\u2019s edge and keeps working.' : '';
export const REDLINE_INTRO = __RELEASE__ >= 9 ? 'Cursed lines: some rows and columns stay red all night. Their pumpkins show as question marks, but still play as their true colour.' : '';   // Release 9, the first night with `redLines` (N5-9; owner 2026-11-11)
export const SWAN_INTRO = __RELEASE__ >= 9 ? 'The Swan Gourd joins your patch, in your first gourd slot, and from now on any nightmare night may take it. A pumpkin flicked from the 3×3 around it bursts a black-hole ring where it hits: every monster beside the hit takes 1, whatever its colour, Ice or Fire rule. The pumpkins around it are never hidden as red spheres. Press and hold it to break it: every empty cell around it sprouts a Rainbow.' : '';   // Release 9, given on its first night (N5-5)
export const WARTLING_INTRO = __RELEASE__ >= 7 ? 'The Wartling Gourd joins your patch: pick two of your three gourds. A pumpkin flicked from the 3×3 around it does double damage. Slide it to the top row and press and hold it to break it: each fence above it mends by half.' : '';   // Release 7, its first night (N3-5)
export const POTION_INTRO = __RELEASE__ >= 7 ? 'Witches\u2019 brews appear on the field. A monster that walks onto one drinks it: red makes it twice as tough, green makes it walk and chew faster, violet hexes it as a witch would, so only one colour hurts it or every colour but one. A monster can drink up to three red and three green, getting tougher or faster with each, but violet only once. You cannot clear potions, so kill monsters before they reach them. Bosses and mummies never drink.' : '';   // Release 7, its first night (N3-1)
export const BREW_INTRO = __RELEASE__ >= 7 ? 'Two bottle marks on the spawn bar. When the monsters reach one, the brew boils: a swoop of crows dives at your patch and potions come faster for the rest of the night.' : '';   // Release 7, its first night (N3-6)
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
  ...(__RELEASE__ >= 5 ? { rotdoctor:'New foe: Plague Doctor 2. It heals nobody. Every monster in the poison square around it can only be hurt by a rotten pumpkin: save your rot for its square, or go for the doctor first.', reaper:'New foe: reapers. Faster than a wraith and gone for longer when they fade out. Each takes 3 hits, and a crow bursts out where one falls. At your fence its scythe wears down three fences at once: its own and both beside it.',
    fogwalker2:'New foe: Fogwalker 2. It drags a fog bank over two rows, hiding everything in them, and it arrives with a Mossback on each side. It takes 3 hits. A Lantern shows it.',
    comet:'New foe: Wisp Rider 2. It cruises for a moment, then streaks straight down its lane and never stops until it chews your fence. The first hit breaks the wisp into a plain Wisp and an Imp on foot.',
    minipolt:'New foe: Poltergeist 2. It drifts between columns and vanishes for a moment, and every few seconds it turns one or two of your pumpkins rotten. Pumpkins in a Protector square are safe.' } : {}),
  ...(__RELEASE__ >= 7 ? { flaskbearer:'New foe: flask bearers. Quick little imps with bottles on their belts. Where one falls it leaves a potion behind: kill it before it reaches the monsters behind it, or near nobody.',
    toad:'New foe: cauldron toads. A toad stops halfway down the field and lashes your fence with its long tongue from there. It drinks potions like any monster, and when it dies it bursts: every potion it drank lands back on the field around it.',
    ashcrone:'New foe: the Ash Crone. She comes with four crows around her that fly for your patch. Every so often she raises an undead zone around a monster near her: anything killed inside it gets back up a few seconds later. Kill her first, or wait for the zone to fade.',
    covenwitch:'New foe: the Blood Coven Witch. Every few seconds her cauldron boils over and one or two potions land just in front of monsters on the field, so they walk straight into them. Kill her early.',
    triptych:'New foe: the Triptych Sprite. Its mirror wall covers its own column and the one on each side: while it is up, a pumpkin in any of the three bounces straight back into that column\'s fence. Flick when the wall drops, or hit what stands in front of it.' } : {}),
  ...(__RELEASE__ >= 8 ? { lobbercart:'New foe: the Lobber Cart. It rolls in and parks at the back of its lane, and it never comes down to your fence. Nothing knocks it back. Every few seconds it lobs a net onto one of your pumpkins: a netted pumpkin cannot be slid, pushed or crushed, but it still bunches, lights up and flies with its bunch. Break the cart and the nets it threw stay where they landed.' } : {}),
  ...(__RELEASE__ >= 8 ? { lancer:'New foe: the Storm Lancer. It gallops down its lane the moment it appears, five times as fast as a walk. At your fence or a scarecrow it takes half the fence in one blow (a fence never loses its last bit), then stays and chews like a Shield Knight. Ice slows the charge, so stop it before it arrives.',
    marshal:'New foe: the Storm Marshal. Every few seconds he raises his sword: for a moment the monsters around him run twice as fast, and each of them grows twice as tough (once only). Bring him down first.' } : {}),
  ...(__RELEASE__ >= 8 ? { glutton:'New foe: the Blood Glutton. It throws two red nets onto your pumpkins, and while any of its red nets is on the patch nothing hurts it. Launch the netted pumpkins (they fly with their bunch) or break a Crookneck Gourd to strip them, then strike. Every few seconds it throws another, never more than two of its own.',
    bride:'New foe: the Bat Bride. She drapes a red veil over the nearest monster in her lane or one beside it, and nothing hurts that monster until she falls. Kill the Bride first. When the veiled one is gone she veils the next a few seconds later.' } : {}),
  ...(__RELEASE__ >= 9 ? { bloodslime:'New foe: the Blood Slime. Kill one and three Bloodlets crawl out, and each swells back into a full Blood Slime after a few seconds: kill them fast, or the field fills. Frozen ones do not swell.',
    pirate:'New foe: the Drowned Pirate. He stops once or twice on the way down, aims for a second, and shoots the highest pumpkin in his column: it is destroyed. Kill him before he stops.',
    turtlerider:'New foe: the Turtle Rider. An imp on a shell turtle: Grey pierces the shell, everything else has to chew it. Every few seconds the imp throws a rotten pumpkin that rots one of your pumpkins near its lane, and when the rider falls the imp is loose.',
    eel:'New foe: the Storm Eel. It rises in a pool or the tide, crackles, and shoots a bolt at your fence, then dives and comes up somewhere else in the water. Hit it while it is up.',
    siren:'New foe: the Siren. She sits in the water and never walks, but every few seconds she sings: a row or a column of your patch glows red for a moment, and then every pumpkin in it turns into a red sphere for six seconds. Bunches still light and launch by their true colour, so remember what was there. Each song also calls a Blood Slime up out of the tide in her lane.',
    tentacle:'New foe: the Kraken\u2019s tentacles. They rise out of the tide and never move, and each throws an anchor down its lane at your fence every few seconds. Kill them quickly: a tentacle you leave comes back six seconds after it falls.' } : {}),
};
