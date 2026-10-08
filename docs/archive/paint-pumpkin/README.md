# Paint pumpkin (archive, 2026-09-27; **in the game since 2026-10-08**)

A design for a possible future pumpkin, kept for later use. Nothing here is in the game. It comes from the "echo and paint pumpkin" idea in `monetization.md`.

**Owner's verdict (2026-09-27):** C, Brushstrokes, is the favourite, but it reads as a **skin** rather than a new pumpkin. Keep it for a future skin, most naturally for the White pumpkin (a white body with painted strokes and the paint-drop trail), and design any future Paint pumpkin with a different look.

A white pumpkin spattered with the other pumpkins' colours. Paint stays off the eyes and mouth so its lit face (the White face plus a pink paint dab on the cheek) always reads. It has no face in the patch, like every pumpkin.

| Look | Description |
|---|---|
| A. Splatter (playful) | Round splotches of every pumpkin colour with small flicked drops |
| B. Paint pour (messy) | Paint poured over the top, running down the ribs in drips and pooling at the base |
| C. Brushstrokes (artsy) | Sweeping brushstrokes across the white, with a painted star as a signature |

**Flight trail:** a stream of paint drops in cycling colours. **Hit:** a paint splat stain, five coloured splotches and flying droplets. Both use plain fills only, so they are safe to run per frame.

**Ability ideas (not decided):**
- **Wet paint:** a hit coats the monster in a colour, and the next pumpkin of that colour to hit it does double damage.
- **Repaint:** when a Paint bunch launches, the pumpkins next to its columns are repainted to match the biggest neighbouring bunch.
- **Colour thief:** counts as any colour like Rainbow, but only in bunches of 4 or more.

`entry.js` holds the drawing code (`LOOKS[].paint`, `painted()`, `trail()`, `hit()`); `head.html` is the page shell. Rebuild the preview with:

```
npx esbuild docs/archive/paint-pumpkin/entry.js --bundle --format=iife --minify --outfile=/tmp/bundle.js
{ cat docs/archive/paint-pumpkin/head.html; cat /tmp/bundle.js; echo '</script>'; } > /tmp/paint.html
```

The imports use absolute paths from the owner's machine; point them at `src/engine/render/` if the repo moves. To use Brushstrokes as a skin, add an entry to `SKINS` in `src/engine/render/wardrobe.js` (its `paint` is `LOOKS[2].paint` clipped with `faceHoles`, its wake the paint-drop `trail`) and to `SKINS` in `src/data/wardrobe.js` with `t:6` (White). To bring a Paint pumpkin into the game instead, bake the look into the pumpkin sprite through `paintPumpkin()` in `src/engine/render/sprites.js` (as the skins do) and add a lit face key in `src/engine/render/faces.js`. Published preview: https://claude.ai/artifact/44HYFdkCD7HV2fyYkJnKaK

## The owner's sketch (2026-09-27): the Paint pumpkin proper

In `sketch/`. The owner sketched the pumpkin they have in mind: a few **big, smooth paint patches** (a large blob right of centre, one wrapping the lower-left edge, a band along the top-left, a small one top-right) and a **paintbrush for a stem**, its bristle tip dipped in paint. Built in four palettes and tested in a mixed patch beside the real pumpkins:

| Palette | Base + paints | Verdict |
|---|---|---|
| **Classic orange (recommended)** | `#ee8a26` + blue `#2f6fe0`, white, magenta `#e8418c`, green `#7ad04a` | No other pumpkin is orange, so it never reads as another type; a jack-o'-lantern that met a paint bucket |
| Artist canvas | `#efe3c8` + red, blue, yellow, green | Most "painter", but close to White in a busy patch |
| Glow paint | `#2d2638` + neon pink, lime, cyan, yellow | Striking lit, but reads as Black when unlit |
| Pastel | `#c9b6f0` + mint, peach, butter, sky | Cute, but drifts toward Purple and Pink |

Patches are smooth closed curves (`PATCHES` in R units) clipped to the rind, each with a wet gloss along its upper edge and a darker paint rim, plus one drip off the big blob. Its hit throws the patch shapes out as splats; its trail is paint drops in its own colours. Rebuild with the same esbuild command using `sketch/entry.js` and `sketch/head.html`. Published preview: https://claude.ai/artifact/Kae9RoqGsjCETqwg54bonB

### Decision (owner, 2026-09-27)
- **The Paint pumpkin uses the Pastel palette** (lilac `#c9b6f0` rind; mint `#7fe0c3`, peach `#ffb59a`, butter `#fff0a0`, sky `#8ec5ff` patches) with a **normal pumpkin stem**. `sketch/entry.js` now shows only this version plus the skin idea below.
- **The paintbrush stem becomes a future skin** for this pumpkin (`brushStem()` in `sketch/entry.js`, drawn when a palette has `brush:true`).
- Watch-out for the build: the butter and sky-blue patches are faint on the lilac rind. If they get lost at game size, deepen those two a step (for example butter `#ffe27a`, sky `#6aaeff`) rather than changing the base. The lilac base also sits nearest Purple and Pink, so give the unlit sprite its patches at full strength.

### Masterpiece skin (2026-09-27)
The paintbrush stem alone did not feel like a skin, because a stem is too small a change. The existing skins change **body, lit face and flight trail**, so **Masterpiece** does all three plus the stem:
- **Body:** thick, swirling oil-paint dabs following each rib in mint, peach, butter, sky and lavender, each dab with a highlight and a shadow (`impasto()`).
- **Lit face:** its own, painted on in glowing cream brushstrokes: happy crescent eyes, a wide painted grin and a peach smear (`paintedFace()`); no face when unlit, like every pumpkin.
- **Stem:** the paintbrush with black bristles, a pale rim and gloss so it shows against the night, and a drip (`brushStem()` with `tip`).
- **Trail:** a wide painted ribbon swaying behind it, with bristle marks, instead of drops (`ribbon()`).
A matching launch accent would be a wet brush swish.

## Ability, levels and unlock (owner, 2026-10-08)

The Paint pumpkin is a **post-game pumpkin bought with seeds**, meant to give seed purchases and grinding a goal after the story. It is not needed for the story.

**Ability: Palette pull.** When 3 or more Paint pumpkins light up as a bunch, pumpkins of **any colour** touching the bunch are pulled in and launch with it in one flick. Each pulled pumpkin keeps its own colour, level and ability, so a bunch of 3 Paint plus a Deep Blue and a Black hits with lilac, chains lightning and explodes. (The owner chose this over repainting neighbours, which would destroy pumpkins the player wanted to keep.)

| Level | Pumpkins pulled | Paint pumpkin's hit power |
|---|---|---|
| 1 | up to 2 | 1 |
| 2 | up to 3 | 1 |
| 3 | up to 4 | 1.5 |
| 4 | up to 5 | 1.5 |
| 5 | every touching pumpkin | 2 |

Rules:
- **Pulled pumpkins count toward the bunch size**, so a mixed bunch of 5 or more gets the usual guaranteed knockback (owner: it is a seed unlock, so it can be strong).
- **Which neighbours, when there are more than the cap:** the ones in the columns under the most threat first, the same scoring the game's hint uses (proposed default).
- **Preview:** while the bunch is lit, the pumpkins it will pull get a lilac outline, so the player can slide one away first (proposed default).
- **No stealing:** a pumpkin that is part of its own lit bunch is never pulled; it launches with its own bunch (proposed default).
- Pulled pumpkins fly up their own columns like any launched pumpkin.

**Unlock and prices (confirmed by the owner, 2026-10-08):** available after beating 5-20; unlock 100 seeds; level 1→2 30 seeds, 2→3 50, 3→4 80, 4→5 120 (380 seeds in all).

**Decided 2026-10-08:** usable in every level once unlocked; its lit face is a cheeky wink with a sideways glance and a lopsided grin, glowing warm cream so it reads on the lilac rind (`paint` in `src/engine/render/faces.js`). Built in `src/data/pumpkins.js` (`PAINT`, `PAINT_PULL`), `paintPull()` in `src/engine/board.js`, the launch in `launchGroup()` (`src/engine/combat.js`), the outline in `drawPaintPull()` (`src/engine/render/draw.js`), the art in `src/engine/render/paintpumpkin.js`, prices and `PAINT_UNLOCK` in `src/data/economy.js`. The Masterpiece skin is still to build.

### Changes after the first build (owner, 2026-10-09)
- **Borrowing from bunches:** Paint may borrow a pumpkin that is lit in its own bunch; only the touching ones come. (Replaced the "no stealing" default.)
- **Borrowed pumpkins light up** with their carved faces; the dashed lilac rim stays (owner liked it).
- **Inherited power:** the Paint pumpkins fly with the ability of the colour they borrow most, at Paint's own level; a tie goes to the colour in the most threatened column (so the preview can show it); nothing borrowed, or only Rainbows, means plain Paint. A small lit pumpkin of the inherited colour sits on each Paint pumpkin while the bunch is lit. Code: `paintInherit()` in `src/engine/board.js`.
- **Counts as both colours** (owner, 2026-10-09): an inheriting Paint pumpkin is still Paint, so chameleons locked to Paint take its hits (they used to say "Wrong colour"), and it also counts as the inherited colour; reversed chameleons immune to either colour are immune to it. Chosen over making chameleons unable to resist Paint, which would have made Paint a universal chameleon-killer.
