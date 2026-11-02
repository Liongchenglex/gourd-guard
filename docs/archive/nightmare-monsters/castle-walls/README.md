# Castle walls (archive, 2026-11-02)

Two new castle wall types for the Crumbling Keep, drawn in the same Toy Plastic stone as the old wall (`bakeCastle` in `src/engine/render/fx.js`). Open `preview.html` to see them. The page starts with a real frame of the game with both walls placed in its lanes. Below that, each wall is shown large with every clip, then strips of every frame, then a row at game size next to the old wall. Nothing here is in the game.

## The map
`night_4-15.jpg` is a frame of the built game: **night 4-15, The Flanks** (story night 75), 430×860 at 2×, monsters cleared. Its six old castle walls stand in lanes 1 and 7. The preview places these at the game's cell size, using the grid maths from `src/engine/state.js` (W 540, H 1080 at this aspect, CS 74, GX 11, FIELD_TOP 162, FIELD_BOT 628):
- the **Gatehouse** in lane 3 at 55% of the field, with a crypt ghoul, a knight, a keep imp and another ghoul queued behind it. Every 9 s the gate opens, the front ghoul walks through, and the gate shuts again;
- the **Archer Tower** in lane 5 at 50%. It shoots every 3.2 s and the game's own arrow flies down the lane to the fence;
- a ground Skeleton Archer in lane 6 for size, a knight marching down lane 4 and an imp in lane 2.
Buttons under the map switch the damage state (whole, cracked, broken), switch between one and two archers, and knock both walls down.

## Gatehouse (`gate`)
- **Look:** one lane wide like the old wall, but heavier and about 1.6× as tall. It has two squat flanking towers with crimson bat banners and torches, a sloped stone plinth, and a crest on the middle merlon. The arch is wide, with iron-bound oak doors behind a portcullis. Moss and cobwebs like the old wall.
- **Clips:** `closed` (banners sway, torches flicker), `open` (once: the portcullis rises, then the doors swing in to show a lit passage), `opened`, `shut` (once: the doors slam, the portcullis drops, dust puffs out), `cracked` and `broken` (the damage states: cracks, missing blocks, chipped then fallen merlons, torn banners, a split door, rubble), `crumble` (once: it shakes, sinks into its own rubble in a cloud of dust, and stones fly out).
- **Proposed gameplay (proposal, for the owner):** about 2.5× the HP of the level's castle walls. Pumpkins hit it like any castle wall. Monsters in its lane **stop at the gate and bunch up**. About every 8 s the gate opens for about 2 s and lets the queue through, then slams shut. Breaking the wall releases the whole queue at once, so a player may choose to leave it standing and hit the crowd with a Black or a Deep Blue.

## Archer Tower (`tower`, `tower2`)
- **Look:** a tall, narrow, tapered round tower, about twice the old wall's height. It has two cross-shaped arrow loops with a glow, corbels, a crenellated top, a crimson pennant, a torch and an ivy strand. A Skeleton Archer stands in the embrasure. It is the game's own `archer` from `chars/w4.js` at 0.52 scale, using its `hold` and `draw` poses. `tower2` has two smaller archers with a merlon between them.
- **Clips:** `idle` (the archer's hold), `shoot` (once: draws and looses; with two archers the second is a beat behind), `cracked`, `broken` (the tower leans, a corner has broken off the top, and cracks run its full height), `crumble` (once: it shakes and sinks into rubble while the archer falls, grows to ground-archer size, lands on the rubble with a squash and stands dazed with stars).
- **Proposed gameplay (proposal, for the owner):** about 1.5× the HP of the level's castle walls. Each archer shoots down the lane every 5 s (3 wall damage, like the Skeleton Archer). While the tower stands, pumpkins hit the tower, not the archer. A Grey (pierce) is the exception: it passes through the tower and hits the archer. When the tower falls the archer drops onto the rubble, is dazed for 2 s, then fights on as an ordinary Skeleton Archer holding at that spot.

## Open questions (owner)
- Should the Gatehouse span two lanes instead? It is drawn one lane wide (1.06 × the old wall's width).
- Gate timing, and whether a monster caught under the closing portcullis takes damage.
- Whether the tower archer can be hit at all while the tower stands (the Grey exception above is a guess).

## Files
- `walls.js`: the drawings, using the game's painter (`src/engine/render/paint.js`) and the game's `archer` (read-only imports). `CLIPS` uses the registry shape (box, clips with n, fps, once and pose). Units are game units around the wall's lane point, with the ground at y = 22 like the old wall.
- `preview_entry.js`: the page. Every frame is baked once into a canvas and only blitted after that, as the perf rule requires. Test hooks: `__map(t, {dmg, n})` freezes the map at time t, `__edges()` reports frame margins, `__idle()` shows the map alone.
- `build.sh`: rebuilds `preview.html` from the repo root (esbuild, with the jpg inlined).
- `idle.png`: the map scene with the gate open.
