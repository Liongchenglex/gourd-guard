# Paint pumpkin (archive, 2026-09-27)

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
