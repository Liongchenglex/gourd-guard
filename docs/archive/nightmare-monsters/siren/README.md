# The Siren (Nightmare Drowned Marsh), design archive

Not in the game. Drawing: `siren.js` (game painter, relative imports, read only). Preview: `preview.html` (rebuild with `zsh docs/archive/nightmare-monsters/siren/build.sh` from the repo root). Still: `idle.png` (idle, sing, charm).

## Look
A pale, pretty-but-creepy mermaid on a barnacled, kelp-draped rock (part of her sprite) standing in her own little pool. She has blue-green skin with teal scales on the shoulders and cheeks, fin ears, big glowing sea-green eyes, and long dripping kelp-green hair with a fish-skeleton comb, a pearl and a little shell. She wears a scallop-shell top and a pearl necklace with a conch. Her teal tail coils over the front of the rock, and its fluke flicks. When she sings her mouth opens far too wide on two rows of needle teeth and her eyes burn white under a slanted lid. The palette follows `w5.js` (kelp, barnacles, drips, starfish, pool water) and the kraken-pirate sea monsters.

## Entries (registry-style, `CLIPS` in `siren.js`)
| Entry | Box (x, y, w, h) | Scale | Clips |
|---|---|---|---|
| `siren` | -92, -112, 176, 180 | .5 (dy about -3 for r 24) | `surface` 8 once, `idle` 8 loop, `sing` 8 loop, `charm` 10 once (sweeps to her right), `charmL` 10 once (mirrored), `hit` 5 once, `dive` 9 once |
| `note` | -26, -54, 52, 72 | .5 | `drift` 8 loop: a glowing teal note with a wavy trail streaming up behind it (it drifts down the lane) |
| `bend` | -58, -34, 116, 66 | .5 | `swirl` 8 loop (pushes to +x), `swirlL` 8 loop (mirrored): spinning arcs, streaks, an arrow and two orbiting notes, centred on a pumpkin |

She arrives by **`surface`**: the rock and the siren rise out of the pool together, with splashes, once. `dive` slides her off the rock into the pool, and then the rock sinks too. When hurt she can come back with `surface`; at death the last frame is just the pool.

## Proposed gameplay (proposal, not a rule)
- She never walks. She surfaces at the back of one lane and stays there on her rock.
- Every few seconds she sings (`sing`, about 2–3 s). While she sings, notes drift down her lane (`note`, engine-drawn).
- While she sings, the **next pumpkin flicked up her lane is bent** into a neighbouring lane at about mid-field. That pumpkin carries the `bend` swirl and flies on up the new lane. Her `charm` (or `charmL`) plays at that moment and sweeps toward the side the pumpkin goes. One bend per song, so a second pumpkin right behind the first gets through.
- She can be hit from her own lane between songs, or at any time by splash (Black), row lightning (Deep Blue) or pierce (Grey). After a hit she may `dive` and resurface a moment later in the same lane.
- Other ideas: (a) bend toward the lane holding the most monsters, so the bent pumpkin is not wasted but feels "stolen"; (b) Nightmare variant: the bent pumpkin turns rotten (heals what it hits) — pairs with Release 5 rot; (c) Ice freezes her song (silences her for a few seconds); (d) an elite version sings to the two lanes beside her as well.

## Engine hints (if brought in)
- New registry key `siren` in a world module (e.g. `chars/nm5.js`), an entry in `src/data/monsters.js` (static: speed 0, `r` about 24, `back:true`), and `frame(m, clips)`: `surface` while `m.age < 0.8`, `sing` while `m.singT > 0`, `charm`/`charmL` via `m.anim = { clip, t, dur }` when a pumpkin is bent (`m.bendDir` picks which), `hit` on `m.hitT`, `dive` while `m.hidden` (then the plain pool) and at death.
- Pumpkin path: when a flicked pumpkin in the siren's column crosses `bendY` while `m.singT > 0` and `!m.bentThisSong`, it gets a sideways lerp to the next column over about 0.25 s and the engine draws `bend` on it (pre-baked like other effects, never live paint).
- `note` sprites are spawned every 0.4 s while singing, move down the lane at about 110 px/s and fade before the walls. They are cosmetic only.
