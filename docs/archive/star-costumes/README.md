# Star costume designs (archive)

Three designs drawn on 2026-09-27 for the reward for collecting every star. The owner liked all three and chose **A, Crown of Stars (Regal)**, which is now in the game (`src/engine/render/wardrobe.js`, key `starcrown`). **B, Celestial Mantle** and **C, Moon Queen's Diadem** are kept here for future rewards.

| Design | Look | Hit effect |
|---|---|---|
| A. Crown of Stars (in game) | Gold crown with five star-tipped spires, velvet, ermine, three gems, a sunburst behind | Supernova: flash, shockwave ring, eight shooting stars, falling star shower |
| B. Celestial Mantle | Floating gold halo set with stars over a tall night-sky cape with a gold hem | Comet strike: a comet falls onto the target and bursts into a spinning star-shaped shockwave |
| C. Moon Queen's Diadem | Silver crescent moon on a gold circlet, three star charms on chains, a violet gem | Constellation: six stars flare, gold lines join them, a crescent slash sweeps through |

`entry.js` holds the drawing code for all three (each has `draw(g, R)`, an `idle` twinkle and `hit(g, t)`); `head.html` is the page shell. To rebuild the preview page:

```
npx esbuild docs/archive/star-costumes/entry.js --bundle --format=iife --minify --outfile=/tmp/bundle.js
{ cat docs/archive/star-costumes/head.html; cat /tmp/bundle.js; echo '</script>'; } > /tmp/starcrown.html
```

The imports in `entry.js` use absolute paths from the owner's machine; point them at `src/engine/render/` if the repo moves. To bring B or C into the game, copy its `draw` into `COSTUME_ART` and its `hit` into `HITS` in `src/engine/render/wardrobe.js`; any shadow blur must stay in the baked costume sprite, never in the per-frame hit. The published preview: https://claude.ai/artifact/NQNtzAvRnPwndUuiHhKJHx
