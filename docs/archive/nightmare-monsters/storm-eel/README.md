# The Storm Eel (Nightmare Drowned Marsh), design archive

Owner: "leaps from puddle to puddle and shoots electric bolt like puddle diver. or if its in the tide, anywhere in the tide/water."
Not in the game. Open `preview.html` (rebuild: `zsh docs/archive/nightmare-monsters/storm-eel/build.sh` from the repo root). `idle.png` shows the key poses: surfaced, charging, shooting, leaping, and the bolt.

## Look
A long, slick dark-teal eel with a pale belly. Glowing yellow-white lightning chevrons run down its body and a small lightning blaze sits on its brow. A frilled fin crest fans out behind its head, and the crest's spine tips spark, with arcs jumping between them. It has big angry glowing eyes with slit pupils and a heavy slanted brow, and a toothy underbite: the jaw juts out and four fangs stand up over the upper lip. It has finned gills at the neck. The nightmare touches are a broken harpoon in its back (snapped shaft, rusted collar, frayed rope), a rusty fish hook through the jaw corner trailing a snapped line, and barnacles. It is drawn in Toy Plastic with the Drowned Marsh teal, and its water ring is the Puddle Diver's.

## Entries (`storm_eel.js`, `export const CLIPS`)
| Entry | Clips | Box | Scale |
|---|---|---|---|
| `eel` | `hidden` (4, loop), `surface` (6, once), `idle` (6, loop), `charge` (6, once), `shoot` (8, once; the bolt leaves the mouth at t = .3), `down` (4, once), `leap` (12, once; `flip:true` mirrors it for leftward leaps) | x -88, y -108, w 176, h 174 | .6, dy -11 (as the Diver) |
| `bolt` | `fly` (6, loop: a crackling ball with a zig-zag tail streaming up the lane), `zap` (7, once: flash, forks over the wall, falling sparks, scorch) | x -50, y -62, w 100, h 112 | .6 |

The waterline is at y = 38, the same as the Puddle Diver. While surfaced, the neck stands 18 units higher than the Diver's head, so a good length of body shows (the figure is about 120 units tall above the water, against the Diver's 96). Every frame clears its box (`window.__edges()`).

## Proposed gameplay (proposal, not a rule)
- It spends most of its time hidden under the water. While hidden it can't be hit, and a faint glow plus sparks on the surface give it away.
- It surfaces, sways (`idle`), crackles up (`charge`, about 0.5 s, a readable warning), then spits a lightning bolt straight down its lane (`shoot`). The bolt flies as its own sprite and does wall damage on `zap`, like the Diver's throw.
- Then it dives (`down`) and `leap`s in an arc to another puddle in the level. On sea levels it goes to any spot in the tide rows instead. It can only be hit while surfaced (surface → down).
- Idea to keep: a bolt passing over a puddle electrifies that puddle briefly. For example, pumpkins can't be flicked through it, or a monster surfacing there is stunned. That is the owner's call.

## Engine hints (if it is brought in)
- It reuses the Diver's puddle cycle (`m.puddle`, `m.hidden`, `m.upT`) with the timeline surface → idle → charge → shoot → idle → down. The bolt spawns when `shoot` passes t = .3, at the mouth, which is about 20 game units above the sprite's centre.
- `leap` is drawn in place, and the engine moves the sprite from the old puddle to the new one with an ease-in-out while the clip plays (about 0.86 s at 14 fps). The clip draws the water ring and splash only at the start and the end. Pass `flip` when the target is to the left. The monster should be untargetable during the leap, or targetable, as the owner prefers.
- On sea levels, choose a random point in the tide rows instead of a puddle (the tide is `shoreP()` of the field).
- It needs a registry key, an entry in `src/data/monsters.js` (with the Diver's footprint), and a projectile type for the bolt (fly / zap, like the Turtle Rider's rotten pumpkin).
