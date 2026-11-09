// Nightmare 4: Crumbling Keep: Nightmare (Release 8; spec docs/superpowers/specs/2026-11-08-release-8-nightmare-keep-design.md, Parts 6 and 7).
// Reached from the demon bookmark on the world 4 book once 4-20 and N3-4 are beaten. Night numbers: nmNight(4, k) = 1300 + k (src/data/worlds/index.js).
// Release 8 is a beta: the numbers are first guesses, tuned by the owner from playtests, not by the bot.
// Pumpkin Patch's nightmare was fire, Foggy Hollow's rot, Witchwood's potions; the Keep's is nets. Nets come only from monsters (the Lobber Cart,
// the Blood Glutton, the Siege Tower, the Fallen Count; rules in engine/nets.js), so no level field sets them.
// Castle pieces (engine/keep.js): `castlesLayout` entries [lane, p, kind?] with kind 'gate' (a Gatehouse, summoning from the level's `gatePool`) or
// 'tower' (an Archer Tower); their health is a multiple of `castles.hp`. Every gatePool monster is also in the level pool, so the preview, the
// bestiary and the night-start bake all know it.
// Each level sets spawnGap and spawnBurst itself, so the story rule SPAWN_LATE_FROM never decides nightmare pacing.
// Every night has a net source: a cart (most nights), a Glutton or a netting boss.
// Gourds: the Grave, Protector and Wartling Gourds are on offer from N4-1 (pick two); N4-3 gives the Crookneck (locked into slot 1, its tutorial),
// and from N4-4 it is a free pick of the four.
// New monsters, each introduced where it first walks in: the Lobber Cart (N4-1), the Storm Lancer (N4-2), the Storm Marshal (N4-4, out of the
// Siege Tower's ramp), the Blood Glutton (N4-6), the Bat Bride (N4-8); the Archer Tower (N4-5) and the Gatehouse (N4-7) have their own cards.
// The Siege Tower holds N4-4 and N4-13 (form 2), the Fallen Count N4-16. Music: the regular nightmare track.
// Wrapped in the release gate so lower builds carry none of these names. Schema: ../levels.js.
const L = d => ({ world:4, theme:9, nightmare:true, graves:0, boss:null, bossForm:1, unlockPumpkins:[], unlockGear:[], intro:[], ...d, gourd:true });   // theme 9 = "Crumbling Keep: Nightmare" in WORLDS; every night is a gourd night
const THREE = () => ['grave', 'protector', 'wartling'];   // the gourds unlocked by the first three books (N1-4, N2-4, N3-4): pick two of three
const ALL4 = () => ['grave', 'protector', 'wartling', 'crookneck'];   // N4-3 on: the Crookneck too (pick two of four)
const W = (lane, p, kind) => kind ? [lane, p, kind] : [lane, p];   // a castle entry: a plain wall, or a 'gate' / 'tower' piece
const ROW = (p, kinds) => kinds.map((k, lane) => W(lane, p, k === 'wall' ? null : k));   // a full row of castle entries, lane 0 to 6

export default __RELEASE__ >= 8 ? [
  // N4-1 Nets and the Lobber Cart: one cart parks at the back and lobs nets (the Nets card); a light mix of Shield Knights and Vampires.
  L({ level: 1, name:'Nets and the Lobber Cart', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:THREE(),
    pool:[['cryptGhoul', 8], ['knight', 5], ['vampire', 3], ['lobbercart', 3]], caps:{ lobbercart:1 }, intro:['lobbercart'],
    quests:[['noTools'], ['wallMin', 55]] }),
  // N4-2 Storm Lancer: Lancers charge in short bursts (a higher burst chance); one cart keeps the nets coming. Ice slows the charge.
  L({ level: 2, name:'Storm Lancer', pattern:1, total:20, interval:3.3, spMul:0.95, spawnGap:1, spawnBurst:0.24, gourds:THREE(),
    pool:[['cryptGhoul', 8], ['lancer', 6], ['knight', 4], ['lobbercart', 2]], caps:{ lobbercart:1 }, intro:['lancer'],
    quests:[['chill', 4], ['wallMin', 50]] }),
  // N4-3 The Crookneck Gourd (spec Part 5): given as the night opens and locked in slot 1 (gourdLock), its tutorial (coach:'crookneck'); all
  // four gourds on offer from here (pick two). Two carts so the gourd matters. No castle pieces (the tutorial's nets land on an open patch).
  L({ level: 3, name:'The Crookneck Gourd', pattern:2, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, coach:'crookneck', gourds:ALL4(), gourdLock:'crookneck',
    pool:[['cryptGhoul', 10], ['keepImp', 5], ['knight', 3], ['lobbercart', 4]], caps:{ lobbercart:2 },
    quests:[['bunch5', 2], ['wallMin', 55]] }),
  // N4-4 The Siege Tower: the mini boss (archers on its deck, nets, a ramp that lets out a Lancer or the first Storm Marshal). One normal chest.
  // Beating it unlocks nothing (the Crookneck came on N4-3); from here the Crookneck is a free pick.
  L({ level: 4, name:'The Siege Tower', pattern:3, total:18, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'siegetower', bossChest:'normal', gourds:ALL4(),
    pool:[['cryptGhoul', 9], ['knight', 5], ['vampire', 3], ['lancer', 3]], intro:['marshal'],
    quests:[['noTools'], ['wallMin', 50]] }),
  // N4-5 Archer Tower: two Archer Towers mid-field (they shoot down their lanes; pumpkins hit them, Grey too) plus Skeleton Archers walking in.
  L({ level: 5, name:'Archer Tower', pattern:4, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL4(),
    castles:{ n:2, hp:12 }, castlesLayout:[W(1, 0.45, 'tower'), W(5, 0.45, 'tower')],
    pool:[['cryptGhoul', 8], ['archer', 5], ['keepImp', 5], ['knight', 4], ['lancer', 2], ['lobbercart', 2]], caps:{ lobbercart:1 },
    quests:[['castlesAll'], ['wallMin', 50]] }),
  // N4-6 Blood Glutton: red nets shield it until they fly or a Crookneck breaks (the gourd as the shortcut).
  L({ level: 6, name:'Blood Glutton', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL4(),
    pool:[['cryptGhoul', 8], ['glutton', 5], ['knight', 4], ['vampire', 3], ['lobbercart', 2]], caps:{ lobbercart:1 }, intro:['glutton'],
    quests:[['oneLaunch', 3], ['wallMin', 50]] }),
  // N4-7 Gatehouse: one Gatehouse mid-lane sending out Shield Knights and Vampires, one at a time, until it is broken.
  L({ level: 7, name:'Gatehouse', pattern:1, total:18, interval:3.3, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL4(),
    castles:{ n:1, hp:12 }, castlesLayout:[W(3, 0.3, 'gate')], gatePool:['knight', 'vampire'],
    pool:[['cryptGhoul', 8], ['knight', 5], ['keepImp', 4], ['vampire', 3], ['lancer', 2], ['lobbercart', 2]], caps:{ lobbercart:1 },
    quests:[['castlesAll'], ['wallAvg', 55]] }),
  // N4-8 Bat Bride: her veil goes over Bulwarks and Marshals; kill the Bride first.
  L({ level: 8, name:'Bat Bride', pattern:2, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL4(),
    pool:[['cryptGhoul', 7], ['bride', 5], ['bulwark', 4], ['marshal', 3], ['knight', 3], ['lobbercart', 2]], caps:{ lobbercart:1 }, intro:['bride'],
    quests:[['bunch5', 2], ['wallMin', 50]] }),
  // N4-9 Glutton and Bride: a veiled Glutton needs its red nets gone and the Bride dead.
  L({ level: 9, name:'Glutton and Bride', pattern:3, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL4(),
    pool:[['cryptGhoul', 7], ['glutton', 4], ['bride', 4], ['vampire', 3], ['lancer', 3], ['lobbercart', 2]], caps:{ lobbercart:1 },
    quests:[['noTools'], ['wallMin', 45]] }),
  // N4-10 Marshal rush: Marshals boosting the crowds two Gatehouses send out.
  L({ level:10, name:'Marshal rush', pattern:4, total:18, interval:3.3, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL4(),
    castles:{ n:2, hp:12 }, castlesLayout:[W(1, 0.3, 'gate'), W(5, 0.3, 'gate')], gatePool:['cryptGhoul', 'keepImp', 'knight'],
    pool:[['marshal', 9], ['cryptGhoul', 8], ['keepImp', 5], ['knight', 4], ['lobbercart', 2]], caps:{ lobbercart:1 },
    quests:[['oneLaunch', 4], ['wallMin', 45]] }),
  // N4-11 The tower line: a full row of Archer Towers across the field (a lower castle health: seven of them shoot), carts parked behind it.
  L({ level:11, name:'The tower line', pattern:0, total:20, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL4(),
    castles:{ n:7, hp:8 }, castlesLayout:ROW(0.45, ['tower', 'tower', 'tower', 'tower', 'tower', 'tower', 'tower']),
    pool:[['cryptGhoul', 8], ['keepImp', 5], ['lobbercart', 4], ['knight', 3]], caps:{ lobbercart:3 },
    quests:[['castlesAll'], ['wallMin', 45]] }),
  // N4-12 Lancer storm: Lancers and carts only, in quick bursts. Ice slows the charge.
  L({ level:12, name:'Lancer storm', pattern:1, total:22, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.22, gourds:ALL4(),
    pool:[['lancer', 10], ['lobbercart', 4]], caps:{ lobbercart:2 },
    quests:[['chill', 6], ['wallAvg', 50]] }),
  // N4-13 Siege Tower 2: the tower in form 2 (34 health) with Gluttons and Brides. One normal chest.
  L({ level:13, name:'Siege Tower 2', pattern:2, total:20, interval:3.1, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'siegetower', bossForm:2, bossChest:'normal', gourds:ALL4(),
    pool:[['cryptGhoul', 7], ['knight', 4], ['glutton', 3], ['bride', 3], ['vampire', 2]],
    quests:[['wallMin', 40], ['bunch5', 2]] }),
  // N4-14 Fortress: two rows of castle walls (p counts down the field, so 0.58 is the front row, nearer the fence): the back row (0.32) holds a
  // Gatehouse with Archer Towers on the flanks, the front row (0.58) a second Gatehouse between two towers.
  L({ level:14, name:'Fortress', pattern:3, total:22, interval:3.2, spMul:0.95, spawnGap:1, spawnBurst:0.12, gourds:ALL4(),
    castles:{ n:14, hp:10 }, gatePool:['knight', 'bulwark', 'vampire'],
    castlesLayout:[...ROW(0.32, ['tower', 'wall', 'wall', 'gate', 'wall', 'wall', 'tower']), ...ROW(0.58, ['wall', 'wall', 'tower', 'gate', 'tower', 'wall', 'wall'])],
    pool:[['cryptGhoul', 6], ['knight', 5], ['bulwark', 3], ['vampire', 3], ['archer', 3], ['marshal', 2], ['lobbercart', 2]], caps:{ lobbercart:1 },
    quests:[['oneLaunch', 3], ['wallMin', 40]] }),
  // N4-15 The gauntlet: every new monster, an Archer Tower and a Gatehouse, a longer night.
  L({ level:15, name:'The gauntlet', pattern:4, total:26, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.14, gourds:ALL4(),
    castles:{ n:2, hp:12 }, castlesLayout:[W(2, 0.35, 'tower'), W(4, 0.3, 'gate')], gatePool:['knight', 'vampire'],
    pool:[['cryptGhoul', 5], ['lancer', 4], ['lobbercart', 3], ['marshal', 3], ['glutton', 3], ['bride', 3], ['knight', 3], ['vampire', 2], ['archer', 2]], caps:{ lobbercart:2 },
    quests:[['noTools'], ['wallMin', 40]] }),
  // N4-16 The Fallen Count (spec Part 7): blood nets, trances, the spear, lightning, summons, his own Archer Tower and Gatehouse. Shield Knights and
  // Vampires walk in meanwhile. One normal chest (his reward is still open). No castle layout: he raises his own pieces.
  L({ level:16, name:'The Fallen Count', pattern:0, total:22, interval:3.0, spMul:0.95, spawnGap:1, spawnBurst:0.12, boss:'fallencount', bossChest:'normal', gourds:ALL4(),
    pool:[['cryptGhoul', 6], ['knight', 6], ['vampire', 5]],
    quests:[['wallMin', 40], ['noTools']] }),
] : [];
