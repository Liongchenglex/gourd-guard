# Paint pumpkin (archive, 2026-09-27)

A design for a possible future pumpkin, kept for later use. Nothing here is in the game. It comes from the "echo and paint pumpkin" idea in `monetization.md`.

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

The imports use absolute paths from the owner's machine; point them at `src/engine/render/` if the repo moves. To bring it into the game, bake the look into the pumpkin sprite through `paintPumpkin()` in `src/engine/render/sprites.js` (as the skins do) and add a lit face key in `src/engine/render/faces.js`. Published preview: https://claude.ai/artifact/44HYFdkCD7HV2fyYkJnKaK
