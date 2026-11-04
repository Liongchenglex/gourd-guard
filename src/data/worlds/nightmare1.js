// Nightmare 1: Pumpkin Patch: Nightmare (Release 4; spec docs/superpowers/specs/2026-11-04-release-4-nightmare-patch-design.md).
// Reached from the demon bookmark on the world 1 book once 1-20 is beaten. Night numbers: nmNight(1, k) = 1000 + k (src/data/worlds/index.js).
// PLACEHOLDER (Task 1 of the Release 4 plan): world 1 monsters only and modest numbers, so the track, the book page and the release checks
// can be built first. Task 12 replaces every entry with the designed levels (fire, the new monsters, the Strawlord, the Grave Gourd).
// N1-16 (the Fallen Gravekeeper) is the owner's to design; until then the book shows it as "Coming soon" (NM_BOOK_LEVELS).
// Wrapped in the release gate so lower builds carry none of these names.
const L = (level, name, pattern, graves, total, interval, spMul, pool) => ({ world:1, level, theme:6, nightmare:true, name, pattern, graves, total, interval, spMul, boss:null, bossForm:1, pool, unlockPumpkins:[], unlockGear:[], intro:[] });
const Gd = d => ({ ...d, gourd:true });   // the Grave Gourd stands on the patch from N1-5 on (Task 8)
const POOL = [['ghoul', 10], ['bat', 6], ['imp', 6], ['brute', 5]];

export default __RELEASE__ >= 4 ? [
  L( 1, 'Embers',                 0, 0, 16, 3.4,  0.86, POOL),
  L( 2, 'Cockcrow',               1, 1, 17, 3.35, 0.87, POOL),
  L( 3, 'Wrapped in Embers',      2, 1, 18, 3.3,  0.88, POOL),
  { ...L( 4, 'The Strawlord',      3, 1, 18, 3.3,  0.88, POOL), boss:'strawlord', bossChest:'normal', unlockGourds:['grave'] },   // Task 7: the mini boss (one normal chest, no boss items); beating it unlocks the Grave Gourd (Task 8)
  Gd(L( 5, 'The Grave Gourd',        4, 2, 18, 3.25, 0.89, [['ghoul', 10]])),
  Gd(L( 6, 'The Grave Riser',        0, 2, 19, 3.25, 0.89, POOL)),
  Gd(L( 7, 'Haystack',               1, 2, 19, 3.2,  0.9,  POOL)),
  Gd(L( 8, 'Corn Maze',              2, 2, 20, 3.2,  0.9,  POOL)),
  Gd(L( 9, 'Harvest Fire',           3, 2, 20, 3.15, 0.91, POOL)),
  Gd(L(10, 'Dawn Chorus',            4, 2, 21, 3.1,  0.91, [['bat', 10], ['imp', 6]])),
  Gd(L(11, 'The Burning Barn',       0, 3, 21, 3.1,  0.92, POOL)),
  Gd(L(12, 'Risen Rows',             1, 3, 22, 3.05, 0.92, POOL)),
  Gd({ ...L(13, 'Strawlord Returns',  2, 3, 22, 3.0,  0.93, POOL), boss:'strawlord', bossForm:2, bossChest:'normal' }),   // Task 7: in phase 2 from the start
  Gd(L(14, 'Burnt Offerings',        3, 3, 23, 3.0,  0.94, [['brute', 10], ['imp', 6]])),
  Gd(L(15, 'Eclipse',                4, 3, 24, 2.95, 0.95, POOL)),
] : [];
