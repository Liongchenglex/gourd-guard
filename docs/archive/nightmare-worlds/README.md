# Hallow's End and nightmare worlds (archive, 2026-09-28)

Background scenes for later: the map for **Hallow's End** (world 6, deferred) and a **nightmare version** of each of the five worlds. Open `preview.html` to see each at full phone size with the field and patch, a large sky crop, and today's world beside it. Nothing here is in the game.

| Scene | Look | Palette (sky top, middle, horizon; moon) |
|---|---|---|
| Hallow's End | A giant jack-o'-lantern moon, a crooked town of spires with lit windows and a clock tower, an orange, violet and green aurora, drifting lanterns, a twisted tree hung with jack-o'-lanterns, a candle path | `#07030f` `#2a0d3c` `#d4602a`; pumpkin moon |
| Pumpkin Patch: Nightmare | An eclipse with a burning corona, the barn ablaze with smoke and embers, crows | `#050204` `#2a0806` `#c2410f`; black moon, orange corona |
| Foggy Hollow: Nightmare | Sickly green moon, poison-green fog, ghostfire lanterns, red eyes watching from the mist | `#020604` `#0b1f12` `#2f6a3a`; `#d8ffb0` |
| Crumbling Keep: Nightmare (owner: thunderstorm) | Black storm clouds, forked lightning over the towers, rain across the whole screen | `#03050c` `#141c33` `#3a4a6a`; `#c8d4ff` |
| Drowned Marsh: Nightmare (owner: red sea, blood moon) | A huge blood moon low over a crimson sea, its reflection a red trail, the wreck black against it | `#0c0206` `#3e0610` `#a8141c`; `#ff3a26` |
| Witchwood: Nightmare (owner: grey, dead trees) | All colour drained, bare skeletal trees, a pale moon, ash falling, crows | greys; `#f0f0f0`, whole scene desaturated |

**Files.** `painter.js` is a copy of the scene painter in `src/engine/render/sprites.js` (sky, props, field, patch), so the themes could be tried without touching the game. `entry.js` holds the six themes: palettes in `THEMES`, Hallow's End in `hallowSky()` / `hallowProps()`, and the nightmare overlays in `pre()`, `post()`, `after()` and `greyExtras()` (with `deadTree()`, `bolt()`, `rain()`, `flame()`, `eyes()`).

**To bring one into the game:** add its palette to `WORLDS` in `src/data/worlds/index.js`, add its props to `PROPS` in `sprites.js` (Hallow's End needs its own sky; the nightmares reuse a world's props plus their overlays), and bake it once like the others. Everything is static, so it costs nothing per frame. The grey Witchwood uses a canvas `grayscale` filter at bake time. Rebuild the preview with:

```
npx esbuild docs/archive/nightmare-worlds/entry.js --bundle --format=iife --minify --outfile=/tmp/bundle.js
{ cat docs/archive/nightmare-worlds/head.html; cat /tmp/bundle.js; echo '</script>'; } > /tmp/nightmare.html
```

Imports use absolute paths from the owner's machine; point them at `src/engine/render/` if the repo moves. Published preview: https://claude.ai/artifact/Q29K8auKuMLsF7GQSUuTG9
