# Toy Plastic sprites: baked animation for world 1

Owner approved the sheet-4 art direction on 2026-09-26 (style sheet: https://claude.ai/artifact/KvCFtEpbEbQBMKkWKyWSAd) and asked for sprite-sheet animation: walk cycles, the mummy collapsing into wrappers and rising again, and boss skill animations. "ok go!" = build it for world 1 first.

## Goal
Replace the live vector drawing of world 1 monsters and all pumpkins with the Toy Plastic textured style, animated from frames that are baked once from the drawing code. No image assets; the art stays code. Worlds 2–5 keep their old drawings until they are redrawn in the same language.

## Pieces
- `src/engine/render/paint.js`: style library. Blob paths (`SM`, `SO`), palettes (`pal`), texture patterns and materials (`MATS`), and the `S` painter: `part` (volume shading + material + edge), `tube` (limbs), `wrap` (bandage strips), `eye`, `glow`, `contact`, `crease`, `rivet`, `thread`, `hand`, `claw`, `shadow`, `blush`, `dot`, `stroke`, `ln`.
- `src/engine/render/chars.js`: pose-driven character drawings for world 1: `pumpkin`, `bat`, `imp`, `ghoul`, `brute` (Mossback), `mummy`, `firemummy`, `gravekeeper`. Each entry in `CHARS` gives `scale` and `dy` (fit to the in-game footprint), a frame `box` in drawing units, and `clips` (name → frame count, fps, draw(g, t)).
- `src/engine/render/anim.js`: bakes a character's clips into strip canvases at the current canvas scale `K` (cached per character, invalidated on resize), picks the frame for a monster from its state (`ph`, `eating`, `hop`, `rise`, `age`, `anim`), and blits it with optional tint (flash white, frozen blue, world-variant tint) through a scratch canvas.
- Integration: `render/monsters.js` uses the baked path for any type in `CHARS` and falls back to the old vector drawing otherwise; `monsterIcon` draws the static pose. `render/sprites.js` paints pumpkins with the new style. `render/draw.js` draws `G.vfx` (death pops, the Gravekeeper's teleport-out ghost). The engine only sets visual hints: `m.anim = {clip, t, dur}` on boss skills, and pushes `G.vfx` entries on kill and teleport. No rule changes.

## Animation states
| State | Source | Clip |
|---|---|---|
| walking | `m.ph` | walk (8 frames, looped) |
| chewing the wall | `m.eating` | chew (4 frames, looped) |
| imp hop | `m.hop` phase | walk frames keyed to the hop, plus the existing vertical lift |
| bat | `m.ph` | flap (walk clip) |
| mummy down | `m.rise` counting down from `TYPES.mummy.rise` | collapse (8 frames) over the first 0.45 s, pile, then collapse reversed over the last 0.45 s |
| hit | `m.flash` | current frame tinted white |
| frozen / slowed | `m.frozenT`, `m.slowT` | current frame tinted blue |
| Gravekeeper idle | `m.ph` | idle (lantern sway) |
| Gravekeeper summon | engine sets `m.anim` | stab (8 frames, once) |
| Gravekeeper teleport | engine pushes a vfx at the old spot; `m.age` restarts | teleport (8 frames) out as vfx, reversed on arrival |
| Gravekeeper shove (form 2) | engine sets `m.anim` | cast (lantern raise, 6 frames, once) |
| death | vfx pushed on kill | last frame squashed and faded over 0.35 s plus the existing chunks |

## Baking
Frames are rendered at `K` (canvas scale × device pixel ratio, capped at 2) so they are crisp. Baking happens on first use of a character (title demo included) and is cached until the canvas is resized. Expected cost: about 120 frames for all of world 1, well under a second on a laptop and a couple of seconds on a mid phone, spread across levels because each level bakes only its pool.

## Out of scope
Worlds 2–5 characters, backgrounds and UI chrome, engine timing changes for skills (skills still resolve instantly; the animation plays over the top).
