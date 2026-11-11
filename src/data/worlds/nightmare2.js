// Nightmare 2: Foggy Hollow: Nightmare (Release 5; spec docs/superpowers/specs/2026-11-05-release-5-nightmare-hollow-design.md, Part 7).
// Reached from the demon bookmark on the world 2 book once 2-20 and N1-4 are beaten. Night numbers: nmNight(2, k) = 1100 + k (src/data/worlds/index.js).
// Release 5 is a beta: the numbers are first guesses, tuned by the owner from playtests, not by the bot.
// Pumpkin Patch's nightmare was fire; this one is rot. Every level has one idea from the spec's table and poison fog on the patch
// (`poison: { every, lines:[min, max], dirs, dur }`: its cycle is every + dur, the clock restarts when a level fog lifts; rules in engine/poison.js).
// Each level sets spawnGap and spawnBurst itself, so the story rule SPAWN_LATE_FROM never decides nightmare pacing.
// The Grave Gourd stands on the patch from N2-1 (it opens only after N1-4); `gourds` (Release 5) lists the gourds a night offers, in slot order:
// both from N2-5, the Protector Gourd's tutorial night. A `gourd:true` night without it offers the Grave Gourd alone.
// New monsters, each introduced where it first walks in: the Reaper (N2-2), Plague Doctor 2 (N2-3), Fogwalker 2 (N2-6), Wisp Rider 2 (N2-7),
// Poltergeist 2 (N2-8). The Lamplighter holds N2-4 and N2-13, the Fallen Poltergeist N2-16.
// Wrapped in the release gate so lower builds carry none of these names. Schema: ../levels.js.
const L = d => ({ world:2, theme:7, nightmare:true, graves:0, boss:null, bossForm:1, unlockPumpkins:[], unlockGear:[], intro:[], ...d });   // theme 7 = "Foggy Hollow: Nightmare" in WORLDS
const Gd = d => L({ ...d, gourd:true });   // the Grave Gourd stands on the patch from N2-1 on
const BOTH = () => ['grave', 'protector'];   // the two gourds, offered from N2-5 (a fresh list per level)
const FOG = (every, hi = 1, dur = 3, dirs = ['row', 'col']) => ({ every, lines:[1, hi], dirs, dur });   // a level's poison fog cycle

export default __RELEASE__ >= 5 ? [
  // N2-1 Rot Mist: poison fog and rotten pumpkins (intro cards for both), taught with world 2 story monsters only. One line at a time, every 14 s.
  Gd({ level: 1, name:'Rot Mist', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['bogGhoul', 10], ['wisp', 6], ['wraith', 5], ['marshImp', 4]], poison:FOG(14),
    quests:[['noTools'], ['wallMin', 55]] }),
  // N2-2 The Reaper: the upgraded wraith (gone for longer, faster), with its crow bursting out where it falls and its scythe wearing down three fences.
  Gd({ level: 2, name:'The Reaper', pattern:1, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['bogGhoul', 8], ['reaper', 7], ['wraith', 4], ['swiftBat', 4]], intro:['reaper'], poison:FOG(15),
    quests:[['wallAvg', 60], ['oneLaunch', 3]] }),
  // N2-3 Night Doctors: Plague Doctor 2. Monsters in its square only take rot: the fog comes a little more often (up to two lines), so save the rot for its square.
  Gd({ level: 3, name:'Night Doctors', pattern:2, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14,
    pool:[['bogGhoul', 9], ['rotdoctor', 5], ['marshImp', 5], ['wisp', 4]], intro:['rotdoctor'], poison:FOG(12, 2),
    quests:[['bunch5', 2], ['wallMin', 50]] }),
  // N2-4 The Lamplighter: the mini boss (two moods, lane drift, its own fog calls) with Reapers and Plague Doctor 2s. A gentle level cycle besides its calls
  // (every 20 s, dur 3: tools/nm2_check.py times the two clocks against each other). One normal chest; beating it unlocks the Protector Gourd.
  Gd({ level: 4, name:'The Lamplighter', pattern:3, total:18, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'lamplighter', bossChest:'normal', unlockGourds:['protector'],
    pool:[['bogGhoul', 9], ['wraith', 4], ['reaper', 4], ['rotdoctor', 3]], poison:FOG(20),
    quests:[['noTools'], ['wallMin', 50]] }),
  // N2-5 The Protector Gourd: its tutorial (coach:'protector'): both gourds stand on the patch (the Grave at (2, 1), the Protector at (2, 5)),
  // a fog row through the Protector's square shows the shield, then the night carries on with steady fog every 12 s. Story monsters and a few Reapers.
  Gd({ level: 5, name:'The Protector Gourd', pattern:4, total:18, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, coach:'protector', gourds:BOTH(),
    pool:[['bogGhoul', 10], ['wisp', 5], ['wraith', 4], ['reaper', 3]], poison:FOG(12),
    quests:[['wallMin', 55], ['bunch5', 2]] }),
  // N2-6 Fog Giants: Fogwalker 2 (a two-row fog bank, 3 health) and the two Mossbacks it brings. Fewer, slower arrivals: each one is three monsters.
  Gd({ level: 6, name:'Fog Giants', pattern:0, total:18, interval:3.4, spMul:0.95, spawnGap:1, spawnBurst:0.1, gourds:BOTH(),
    pool:[['fogwalker2', 5], ['bogGhoul', 7], ['marshImp', 4], ['wisp', 4]], intro:['fogwalker2'], poison:FOG(15),
    quests:[['oneLaunch', 3], ['wallMin', 50]] }),
  // N2-7 Comet Trail: Wisp Rider 2 streaks down its lane to the fence. The poison falls in columns only, like comet trails down the patch.
  Gd({ level: 7, name:'Comet Trail', pattern:1, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:BOTH(),
    pool:[['comet', 7], ['bogGhoul', 6], ['swiftBat', 5], ['wisp', 3]], intro:['comet'], poison:FOG(13, 1, 3, ['col']),
    quests:[['noTools'], ['wallMin', 50]] }),
  // N2-8 Restless Spirits: Poltergeist 2 drifts, vanishes and rots pumpkins itself, so the level's own fog is rarer. Wraiths fade alongside.
  Gd({ level: 8, name:'Restless Spirits', pattern:2, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:BOTH(),
    pool:[['minipolt', 5], ['bogGhoul', 7], ['wraith', 5], ['wisp', 4]], intro:['minipolt'], poison:FOG(18),
    quests:[['bunch5', 2], ['wallAvg', 60]] }),
  // N2-9 Thick Fog: the story's field fog banks come back (two bands), with Fogwalker 2s, old Fogwalkers and Reapers hiding in them. A Lantern helps.
  Gd({ level: 9, name:'Thick Fog', pattern:3, total:21, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:BOTH(), fog:[[0.2, 0.4], [0.55, 0.75]],
    pool:[['bogGhoul', 6], ['reaper', 5], ['fogwalker2', 4], ['fogwalker', 3], ['wraith', 3]], poison:FOG(15),
    quests:[['noTouch', 'fogwalker'], ['wallMin', 45]] }),
  // N2-10 Plague Ward: many Plague Doctor 2s, their squares overlapping, and frequent poison fog (every 9 s, up to two lines) so there is rot to answer them.
  Gd({ level:10, name:'Plague Ward', pattern:4, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:BOTH(),
    pool:[['rotdoctor', 8], ['bogGhoul', 7], ['marshImp', 5], ['brute', 2]], poison:FOG(9, 2),
    quests:[['bunch5', 2], ['wallMin', 45]] }),
  // N2-11 Wisp Storm: Wisp Riders 2, a cloud of Wisps and crows raiding the patch. Quick arrivals, bursts more likely.
  Gd({ level:11, name:'Wisp Storm', pattern:0, total:22, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.16, gourds:BOTH(),
    pool:[['comet', 7], ['wisp', 7], ['crow', 5], ['swiftBat', 4]], poison:FOG(14),
    quests:[['oneLaunch', 3], ['wallMin', 45]] }),
  // N2-12 Haunted Patch: a Poltergeist 2 swarm: the rot comes from them more than from the fog. Keep pumpkins in the Protector's square.
  Gd({ level:12, name:'Haunted Patch', pattern:1, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:BOTH(),
    pool:[['minipolt', 9], ['bogGhoul', 6], ['wraith', 4], ['reaper', 3]], poison:FOG(20),
    quests:[['wallAvg', 55], ['noTools']] }),
  // N2-13 Lamplighter Returns: the Lamplighter in form 2 (34 health, a mood every 6 s) with every new monster met so far but Fogwalker 2. One normal chest.
  Gd({ level:13, name:'Lamplighter Returns', pattern:2, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'lamplighter', bossForm:2, bossChest:'normal', gourds:BOTH(),
    pool:[['bogGhoul', 7], ['reaper', 4], ['rotdoctor', 3], ['comet', 3], ['minipolt', 2]], poison:FOG(16),
    quests:[['wallMin', 45], ['bunch5', 2]] }),
  // N2-14 The Rot: near-constant poison fog (4 s on, 4 s off, up to two lines) with Reapers and Plague Doctor 2s: rot is everywhere, and wanted.
  Gd({ level:14, name:'The Rot', pattern:3, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:BOTH(),
    pool:[['reaper', 6], ['rotdoctor', 6], ['bogGhoul', 6], ['marshImp', 4]], poison:FOG(4, 2, 4),
    quests:[['wallMin', 40], ['bunch5', 2]] }),
  // N2-15 The Long Night: the gauntlet before the boss: every new monster, crows and story monsters, a longer night, fog of up to two lines.
  Gd({ level:15, name:'The Long Night', pattern:4, total:26, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:BOTH(),
    pool:[['bogGhoul', 5], ['reaper', 4], ['comet', 4], ['rotdoctor', 3], ['fogwalker2', 3], ['minipolt', 3], ['crow', 3], ['wraith', 2]], poison:FOG(12, 2),
    quests:[['noTools'], ['wallMin', 40]] }),
  // N2-16 The Fallen Poltergeist: the book's boss (spec Part 8; owner 2026-11-11): it vanishes and swaps, lays black fog, turns reaper three times (each one
  // reshuffles the patch) and lights cursed lanterns at the fences. Steady poison fog (every 10 s) so there is always rot for its reaper phases and its black
  // fog. Fogwalkers 2, Reapers, Poltergeists 2, Wisp Riders 2 and both Plague Doctors walk in meanwhile (owner: exactly these). One normal chest.
  Gd({ level:16, name:'The Fallen Poltergeist', pattern:0, total:22, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'fallenpoltergeist', bossChest:'normal', gourds:BOTH(),
    pool:[['fogwalker2', 3], ['reaper', 4], ['minipolt', 3], ['comet', 4], ['doctor', 3], ['rotdoctor', 3]], poison:FOG(10),
    quests:[['wallMin', 40], ['noTools']] }),
] : [];
