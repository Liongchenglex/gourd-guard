# Gourds (archive, 2026-11-02)

Five gourds for the nightmare worlds. Open `preview.html` to see them animated: a lineup, a card per gourd, the gourd on a real frame of night 1-4, and its 3×3 square on the patch. Nothing here is in the game.

> **The rules changed (Release 4, 2026-11-04).** The first gourd is built: the Calabash is **the Grave Gourd** of the nightmare track. It is not the gourd described below: it **moves** (slides and is pushed like a pumpkin), it is **broken by holding it** (which clears the graves in its 3×3), it comes back on the next sprout, and its power is **sprouting around it**, not powering up flicked pumpkins. The rules in force are in `docs/GAME_DESIGN.md` §5 and §6 and the Release 4 spec (`docs/superpowers/specs/2026-11-04-release-4-nightmare-patch-design.md`, Part 3); the game's art is `src/engine/render/gourd.js`. The other four gourds and their powers are still open.

## The rules (owner, 2026-11-02; superseded for the Grave Gourd, see above)
- Gourds arrive with the nightmare worlds.
- A gourd sits on the patch and **powers up every pumpkin flicked from the 3×3 square around it**.
- Each of the five gourds has a **different power**. The powers are not decided yet.
- Each gourd has its **own colour**.
- Gourds are on the pumpkins' side, so they look **cute like the pumpkins**: the same toy eyes, blush and little smile.
- **One design per gourd** in every world. No nightmare skins.

## Design calls (mine, for the owner to confirm)
- **Shape tells them apart, colour helps.** Pumpkins already use colour to mean "which bunch", so each gourd also has its own silhouette and never reads as a pumpkin of the same colour.
- **The gourd keeps its face in the patch.** Pumpkins show no face until they bunch, so the face marks the gourd at a glance. It is as wide as a pumpkin, stands on the same soil line and is taller than its cell.
- **The gourd stays put.** It is never slid, bunched or flicked.
- **Edges cut the square.** A gourd on an edge covers five cells and in a corner three, instead of eight.
- This replaces the older gourd note in `docs/WORLDS.md` §10 (taller pumpkins you break to clear obstacles). That note should be updated when gourds are planned for a release.

## The five gourds

| Gourd | Colour | Look |
|---|---|---|
| Calabash | Amber `#e3a43c` | Tall bottle gourd with a pinched waist: a big bulb below, a small one on top, a curly stem. |
| Crookneck | Lime `#b9cf3c` | A fat bumpy base whose neck curls over like a shepherd's crook; the stem hangs from the tip. |
| Turban | Red `#d6472e`, cream cap `#ece0b4` | Squat and wide, with a green-striped cream cap on a scalloped collar. |
| Wartling | Violet `#8a5cc6` | A round pear gourd covered in little bumps, with a curly stem. |
| Swan | Cream `#e4d9bd` with green stripes | A round striped body with a long thin neck that arcs over into a little head. |

## Still open (owner)
- The five powers.
- How gourds reach the patch: placed by the level, picked on the loadout screen's Gourds section, or both.
- How many gourds a level may have, and whether monsters can harm them.

## Files and bringing it into the game
`entry.js` draws the gourds with the game's painter (`src/engine/render/paint.js`, imported by relative path, read only). `SHAPES` holds the five gourds and `gourdSprite(i)` bakes one into a canvas once; the preview only blits baked sprites with a sway and a glow pulse, which follows the perf rule (never paint per frame). In the game, bake each gourd at patch size with the other sprites and draw the 3×3 aura as one baked glow tile. `night_1-4.jpg` is a frame of the built game (430×860 at 2×) with the middle cell cleared; the preview places the gourd with the cell maths from `src/engine/state.js`. `head.html` is the page shell; rebuild `preview.html` with `zsh docs/archive/gourds/build.sh`.
