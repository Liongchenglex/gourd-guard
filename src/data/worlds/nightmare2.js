// Nightmare 2: Foggy Hollow: Nightmare (Release 5; spec docs/superpowers/specs/2026-11-05-release-5-nightmare-hollow-design.md, Part 7).
// Reached from the demon bookmark on the world 2 book once 2-20 and N1-4 are beaten. Night numbers: nmNight(2, k) = 1100 + k (src/data/worlds/index.js).
// Release 5 is a beta: the numbers are first guesses, tuned by the owner from playtests, not by the bot.
// N2-1 to N2-3 and N2-6 to N2-12 are plain placeholder nights (the track needs levels 1 to k in order; nmData indexes the table by level), N2-4 and
// N2-13 are the Lamplighter's nights and N2-5 is the Protector Gourd's tutorial night; the Release 5 level table (Task 10) revises their numbers and
// fills the rest, keeping the boss, bossForm, bossChest, unlockGourds, gourd and coach fields.
// `gourds` (Release 5) lists the gourds a night offers, in slot order; a `gourd:true` night without it offers the Grave Gourd alone.
// Wrapped in the release gate so lower builds carry none of these names. Schema: ../levels.js.
const L = d => ({ world:2, theme:7, nightmare:true, graves:0, boss:null, bossForm:1, unlockPumpkins:[], unlockGear:[], intro:[], ...d });   // theme 7 = "Foggy Hollow: Nightmare" in WORLDS
const Gd = d => L({ ...d, gourd:true });   // the Grave Gourd stands on the patch from N2-1 on

export default __RELEASE__ >= 5 ? [
  // N2-1 Rot Mist: placeholder (world 2 monsters, the Grave Gourd, no fog or rot yet).
  Gd({ level: 1, name:'Rot Mist', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['bogGhoul', 10], ['wisp', 6], ['wraith', 5], ['swiftBat', 4]],
    quests:[['noTools'], ['wallMin', 55], ['bunch5', 2]] }),
  // N2-2 to N2-4: placeholders (world 2 monsters and the Grave Gourd) until Task 10; N2-4 already unlocks the Protector Gourd (spec Part 5).
  Gd({ level: 2, name:'The Reaper', pattern:1, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['bogGhoul', 10], ['wisp', 6], ['wraith', 6]],
    quests:[['noTools'], ['wallMin', 55]] }),
  Gd({ level: 3, name:'Night Doctors', pattern:2, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['bogGhoul', 10], ['wisp', 5], ['swiftBat', 5]],
    quests:[['noTools'], ['bunch5', 2]] }),
  // N2-4 The Lamplighter: the mini boss (Task 8: its two moods, its lane drift, its fog calls); a gentle poison cycle besides its own calls. One normal chest; beating it unlocks the Protector Gourd.
  Gd({ level: 4, name:'The Lamplighter', pattern:3, total:18, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'lamplighter', bossChest:'normal', unlockGourds:['protector'],
    pool:[['bogGhoul', 10], ['wraith', 5], ['swiftBat', 4]], poison:{ every:20, lines:[1, 1], dirs:['row', 'col'], dur:3 },
    quests:[['wallMin', 50], ['bunch5', 2]] }),
  // N2-5 The Protector Gourd: its tutorial (coach:'protector'): both gourds stand on the patch (the Grave at (2, 1), the Protector at (2, 5)),
  // a fog row through the Protector's square shows the shield, then the night carries on with gentle fog. Story monsters only.
  Gd({ level: 5, name:'The Protector Gourd', pattern:4, total:18, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, coach:'protector', gourds:['grave', 'protector'],
    pool:[['bogGhoul', 10], ['wisp', 5], ['wraith', 4]], poison:{ every:16, lines:[1, 1], dirs:['row', 'col'], dur:3 },
    quests:[['noTools'], ['wallMin', 55], ['bunch5', 2]] }),
  // N2-6 to N2-12: placeholders (world 2 story monsters, both gourds) so N2-13 sits at position 13; Task 10 gives each its theme, pool and numbers.
  ...[[6, 'Fog Giants'], [7, 'Comet Trail'], [8, 'Restless Spirits'], [9, 'Thick Fog'], [10, 'Plague Ward'], [11, 'Wisp Storm'], [12, 'Haunted Patch']].map(([level, name]) =>
    Gd({ level, name, pattern:level % 5, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:['grave', 'protector'],
      pool:[['bogGhoul', 10], ['wisp', 5], ['wraith', 5], ['swiftBat', 4]], poison:{ every:16, lines:[1, 1], dirs:['row', 'col'], dur:3 },
      quests:[['noTools'], ['wallMin', 55]] })),
  // N2-13 Lamplighter Returns: the Lamplighter in form 2 (more health, a faster mood clock). One normal chest. Placeholder pool until Task 10.
  Gd({ level:13, name:'Lamplighter Returns', pattern:3, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'lamplighter', bossForm:2, bossChest:'normal', gourds:['grave', 'protector'],
    pool:[['bogGhoul', 10], ['wisp', 5], ['wraith', 5], ['swiftBat', 4]], poison:{ every:16, lines:[1, 1], dirs:['row', 'col'], dur:3 },
    quests:[['wallMin', 50], ['bunch5', 2]] }),
] : [];
