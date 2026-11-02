# Mini bosses: the Lamplighter and the Siege Tower (archive, 2026-11-02)

Every world gets a mini boss: smaller than the world boss, bigger than its monsters, the same size class as the Kraken (Drowned Marsh, `../kraken-pirate/`). These are the Foggy Hollow and Crumbling Keep ones. Nothing here is in the game. Open `preview.html` (every clip animated beside the game's originals, strips of every clip, a game-size row); `idle.png` is a still of both.

Files: `minibosses.js` (drawing code and registry-style `CLIPS`), `preview_entry.js`, `build.sh` (run from the repo root: `zsh docs/archive/nightmare-monsters/minibosses-hollow-keep/build.sh`). Imports are relative into `src/` (the painter, and `archer` / `knight` from `src/engine/render/chars/w4.js`), read only.

## The Lamplighter (Foggy Hollow)
**Look.** The tall hooded figure standing in the fog on the nightmare Foggy Hollow map (`shadeFigure()` in `docs/archive/nightmare-worlds/entry.js`: peaked hood, a long arm hanging down, two pale green eyes `#caffc0`), now a creature in Toy Plastic: a very tall peaked hood with a void inside and two glinting eyes, a scalloped mantle, a long ragged cloak whose hem dissolves into poison-green fog, a long bony left hand hanging at its side, and a crooked wooden pole with a big iron ghost lantern on a chain. Inside the lantern a little wisp with a face is trapped; when lit it throws green light on the cloak's right side.

| Clip | Frames | What it shows |
|---|---|---|
| `drift` | 8, loop | Floating, lantern lit (the walk / idle). |
| `dark` | 8, loop | Lantern snuffed (smoke curl, an ember), the figure half-faded. |
| `snuff` / `relight` | 6, once | Lit to dark / dark to lit (the wisp flares as it relights). |
| `blink` | 10, once | Dissolves into a column of fog (eyes go last), reappears; move it at t = .5. |
| `shroud` | 12, once | Winds up, tips the dark lantern forward down the lane and pours fog from it. |
| `hit` | 5, once | Recoils, eyes flare, a gust of fog bursts off the cloak. |

Registry: `scale .46`, `box { x:-79, y:-197, w:219, h:267 }` (the lantern hangs out to the right). The hem fade uses `destination-out` on the frame's own canvas, which is fine for baked frames.

**Proposed fight (proposal).** Drifts at the back of the field and never walks to the wall. Every few seconds it blinks to another fog bank or lane. Only hittable while the lantern is lit; a hit makes it snuff the lantern, and while dark (half-faded, pumpkins pass through) it swings the lantern and pours a fog bank down one lane (the fog itself is the engine's fog bank). Then it relights and the window opens again. Killing it clears its fog.

## The Siege Tower (Crumbling Keep)
**Look.** A tall, rickety three-storey wooden siege tower on four iron-shod wheels, seen from the front with a sliver of its side: planks, iron bands and rivets, two stitched wet hides on the middle storey with lit arrow slits between them that read as scowling eyes, an iron nose spike, a crimson bat banner, crossed braces, a tattered pennant, and a spiked drawbridge ramp over the doorway for a mouth. Two of the game's Skeleton Archers (`archer`, scaled .5) stand behind the top parapet.

| Clip | Frames | What it shows |
|---|---|---|
| `roll` | 8, loop | Wheels turn, the tower rocks and creaks, dust at the wheels (the walk). |
| `volley` | 8, once | The archers step up and loose (the archer's own `draw` clip, staggered); the eyes flare. |
| `ramp` | 12, once | The ramp drops toward us, a Shield Knight (`knight`) steps out of the dark doorway and down the ramp. |
| `raise` | 6, once | The empty ramp is hauled back up. |
| `knock` | 8, once | The next archer is knocked off and tumbles over the parapet, bones scattering. |
| `hit` | 5, once | Shudder, eyes flare, splinters fly. |
| `break` | 12, once | Creaks, leans, comes apart storey by storey into a heap of timber with a dust cloud. |

Variants (like the Poltergeist's `form2`): `a2`, `a1`, `a0` = archers left; the viewer's-left archer goes first. Every clip is drawn for each variant; `knock` in `a1` shows the first archer falling, in `a0` the second. Registry: `scale .46`, `box { x:-83, y:-207, w:174, h:288 }`.

**Proposed fight (proposal).** Rolls very slowly down one lane. The archers loose a volley at a wall every few seconds (arrows are the engine's, as for the archer). Pumpkins hit the archers first: each hit to the top knocks one off (`knock`, variant a2 → a1 → a0); only with both gone does the tower itself take damage. Every so often the ramp drops and a Shield Knight marches out (`ramp`; at its end the engine spawns a real knight at the ramp's foot, about 0.4 cell ahead, then plays `raise`). On death it collapses (`break`).

## Engine hints a port would need
Lamplighter: `blink`, `shroud`, `snuff` / `relight` through `m.anim`, and a `lit` flag on the monster to pick `drift` or `dark`. Siege Tower: `volley`, `ramp` (+ a knight spawn at its end, then `raise`), `knock`, `break` through `m.anim`, and `vkeyOf(m)` returning `'a' + archersLeft`.
