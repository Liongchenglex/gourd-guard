# Spirits (design archive, 2026-11-02)

Three spirit monsters for the nightmare levels. Open `preview.html` for every clip animated beside the game's originals, the strips and a game-size row; `idle.png` is a still. Rebuild from the repo root with `zsh docs/archive/nightmare-monsters/spirits/build.sh`. Drawing code: `spirits.js` (the game's painter, read only). Nothing here is in the game, and every gameplay line below is a **proposal**.

| Key | Monster | World | Clips | Box (drawing units) | Scale |
|---|---|---|---|---|---|
| `reaper` | The Reaper | Pumpkin Patch / Hallow's End | walk (glide, 8), chew (4), reap (10, once) | x -96, y -114, w 190, h 178 | 0.56 |
| `minipolt` | Mini Poltergeist | Foggy Hollow | walk (12), chew (4), toss (9, once) | x -52, y -86, w 104, h 144 | 0.5 |
| `junk` | Flung teacup (the toss projectile) | | fly (6) | x -22, y -36, w 44, h 56 | 0.5 |
| `fogwalker2` | Fogwalker 2 | Foggy Hollow | walk (8), chew (4), exhale (10, once) | x -84, y -80, w 168, h 142 | 0.66 |

## The Reaper
A hooded skeleton in a tattered plum-black robe: a big bone skull with ember-orange eyes deep in the hood, a rope belt with a little jack-o'-lantern tied on, and a long scythe on its right shoulder. It has no feet: it glides, with the hem fraying into smoky tails and drifting smoke under it, and beckons with its free bony hand. **Chew** hacks the scythe down at the wall in front of it. **Reap** winds the glowing blade up over its shoulder, then makes one wide sweep across the front with a pale crescent trail, follows through and settles.
*Proposal:* it glides, so landmines and puddles do not catch it. At the wall, every few seconds it reaps instead of chewing once, hitting the wall in its own lane and both neighbouring walls for a chew's damage each. The engine would set `m.anim = { clip:'reap' }` when the sweep fires. The reap's box is wide (190 units) so the sweep fits.

## Mini Poltergeist
A small, cheeky Poltergeist: the boss's shroud, palette, void face and soul-cyan glow, with a curled nightcap tip, lopsided blazing eyes (one squinting), a wide jagged grin with a ghost-tongue, little clawed hands and torn strips trailing below. Five pieces of floating junk orbit it: a teacup, a fork, a book, a candle stub and a picture frame. The ones behind it pass behind the body. **Toss** grabs the teacup out of the orbit, winds up over its head and flings it down the lane. The `junk` sprite is that teacup in flight.
*Proposal:* each piece of junk blocks one pumpkin (the pumpkin breaks the junk, not the ghost), so it takes 1 + junk hits. Every few seconds it tosses a piece down its lane that chips its wall, leaving it one piece lighter. It is small and quick, like a Wisp. The engine would need a `toss` anim hint and a projectile that uses `junk/fly`.

## Fogwalker 2
A bigger, hunched Fogwalker: the same grey robe, hood and void face with pale cyan eyes, but its back humps up above its head, long heavy arms hang to its knees, and wrapped feet plod under the hem. Its chest is a bronze lantern-cage (the original's lantern moved inside) full of glowing fog and a soul flame, which leaks out between the bars and curls up past its shoulders. **Chew** claws at the wall with alternating hands while the cage pulses. **Exhale** draws a breath in (the cage brightens, wisps are sucked back, arms rise), then blows a huge billow of fog out of the cage across the ground.
*Proposal:* it carries a Fogwalker's fog band across its row but takes 3 hits. Every few seconds it exhales, and its band swells to about twice its height for 3 s. A Lantern shows it as usual. The engine would need an `exhale` anim hint; the swelling band itself is engine fog, not part of the sprite.

## Notes
- The Mini Poltergeist's walk has 12 frames instead of the usual 8, so the junk orbits smoothly (one full turn per loop).
- The Reaper's chew foreshortens the scythe toward the viewer, which fakes a forward hack. The reap sweep is a horizontal swing seen from the front (a flattened circle), with the blade hanging toward the ground.
