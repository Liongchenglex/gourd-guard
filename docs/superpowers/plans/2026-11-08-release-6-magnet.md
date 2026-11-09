# Magnet Pumpkin (Release 6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Magnet pumpkin: a hit pulls up to N nearby monsters (same row and rows below, any lane, walls included) onto the hit monster's tile; bought for 50 seeds after 5-20; Release 6, standalone.

**Architecture:** A per-feature build constant `__MAGNET__` (true when the build's release ≥ `MAGNET_AT`, default 6) gates everything, so moving Magnet ahead of Releases 4–5 later is a one-number change in `vite.config.js`. Pumpkin data follows the Beige precedent (`PTYPES` entry before Rainbow, computed indices, `BUY_PUMPKIN`, `UPGRADE_COST`). The pull lives in a new `src/engine/magnet.js` called from `hitMonsterNow` in `combat.js`; the visible slide is a small per-monster offset in `updateMonster`.

**Tech Stack:** Plain JS ES modules, Vite 5, Canvas 2D; Playwright checks in Python (`.venv`).

**Spec:** `docs/superpowers/specs/2026-11-08-release-6-magnet-design.md`

## Global Constraints

- Release 6 (Nightmare Witchwood is Release 7). Store build (`STORE_RELEASE = 1`) and builds `VITE_RELEASE` ≤ 5 contain no Magnet: no `'Magnet'` / `'magnet'` text in the bundle.
- Standalone: Magnet code imports and reads nothing from Releases 2–5 (no `BEIGE`, glue, World 6, nightmare modules, jukebox constants). Skips Release 2–5 things by generic properties only.
- Pull counts by level: N = 3, 3, 4, 5, 6. Rows: anchor row only (lv 1–2), anchor row + 1 below (lv 3–4), anchor row + 2 below (lv 5). Row = `TILE_P()`; below = larger `p`. Any lane. Nearest first. Pulls whether or not the anchor dies. Slide ≈ 0.3 s, visible.
- Never pulled: `type === 'boss'` (incl. mini bosses, Hollow King forms), `'sack'`, `'jukebox'`, a hidden diver (`m.hidden`), a fallen mummy (`m.rise > 0`), dead, off the field (`m.p > 1` or `m.p < 0`), any monster flagged `offField` (a generic flag; Release 4 Crows in the patch must set or already imply it; if they have their own state, the implementer adds `offField` there in a `__RELEASE__ >= 4` line, which is allowed because it is the Crow's code, not Magnet's).
- Wall rescue: a monster chewing a wall (`m.eating`) or a scarecrow (`m.chewing`) is pulled; pulling sets `eating = false`, `chewing = null`.
- Price 50 seeds, unlock night 100 (5-20), flag `magnetOwned`; upgrades `[{coins:3000},{coins:5000},{coins:10000},{seeds:50}]`; power 1/1/1.5/1.5/2 (the global `POWER`); **no knockback ever** (not even the 5+ bunch guarantee).
- Look: copper (suggested `base:'#c46a35', light:'#f0a070', dark:'#6e3414', spark:'#ffc890'`), red-and-silver horseshoe band at the stem, smug-grin lit face; copper spark lines during the slide; metallic clunk on landing (CC0 sample, listed in `assets/sfx/SOURCES.md`, or synthesised).
- Perf rule (`CLAUDE.md`): nothing painted per frame; bake sprites.
- Never commit `monetization.md`, `dump.md`, `questdump.md`, `assets/music/drafts/*`. Stage by name. Trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Deploy only when the owner says "deploy".

## Review Focus

1. Save compatibility: Rainbow's index shifts again (14 → 15 with Beige, 13 → 14 without). An existing save with a loadout, levels and worn skins must still load, and Rainbow sprouts must still be Rainbow.
2. A pulled wall-chewer must actually leave the wall: no further wall damage that frame, `eating` false, and it walks back down afterwards.
3. Pulled monsters with special movement (Witch, Hexwitch drift, Wisp, Rider carrying a wisp, Knight resting, a turtle in a puddle) must not snap back to their old lane.
4. A Paint or Rainbow pumpkin flying as Magnet (`pr.type === MAGNET`) pulls; a Magnet pumpkin pulled into a Paint bunch keeps its own type (Paint precedent).
5. Lower builds must not break: `MAGNET = -1` must never index `PTYPES`, and `typesForNight` must not list it.

---

### Task 1: The Magnet flag, data, shop and save

**Files:**
- Modify: `vite.config.js` (define `__MAGNET__`), `src/data/pumpkins.js`, `src/data/economy.js`, `src/data/lore.js`, `src/main.js` (test hook), `src/engine/combat.js` (knockback exclusion only), `docs/RELEASES.md` (how `__MAGNET__` works)
- Create: `tools/mag_check.py`

**Interfaces:**
- Produces: `__MAGNET__` (build-time boolean); `MAGNET` (index or -1), `RAINBOW`, `NTYPES` (recomputed); `MAG_N = [3, 3, 4, 5, 6]`, `MAG_ROWS = [1, 1, 2, 2, 3]` (rows including the anchor's), `MAG_SLIDE = 0.3` in `pumpkins.js`; `BUY_PUMPKIN.magnet = { seeds:50, night:100, flag:'magnetOwned', blurb, how:'Beat 5-20, the Twin Tides’ last stand, to unlock it with seeds.' }`; `UPGRADE_COST.magnet`; `window.__gg.MAGNET`.
- `vite.config.js`: `const MAGNET_AT = Number(e.VITE_MAGNET_AT || 6);` and `define: { __RELEASE__: ..., __MAGNET__: JSON.stringify(RELEASE >= MAGNET_AT) }`. `VITE_MAGNET_AT` is for the standalone check only.
- Indices: `BEIGE = __RELEASE__ >= 3 ? 13 : -1`; `MAGNET = __MAGNET__ ? (__RELEASE__ >= 3 ? 14 : 13) : -1`; `RAINBOW = 13 + (__RELEASE__ >= 3 ? 1 : 0) + (__MAGNET__ ? 1 : 0)`. Write them as inline constant expressions so Rollup folds them.

- [ ] **Step 1: Write `tools/mag_check.py`** modelled on `tools/nm2_check.py` (same `open_page`, `ok`, `set_stars`, `bundle_js` helpers; copy them). `--expect on|r5|off|solo`; global `MAG = MODE in ('on', 'solo')`. Checks:
  - `check_absent`: `'Magnet' in bundle_js()` equals `MAG`.
  - `check_data` (MAG only): `__gg.MAGNET === __gg.RAINBOW - 1`, `PTYPES[RAINBOW].rainbow`, `PTYPES[MAGNET].key === 'magnet'`; `upgradeCost('magnet', 1..4)` == the four costs; `lvStats(MAGNET, 5).special` mentions 6 monsters and 3 rows; `lvStats(MAGNET, 1).knock === 'none'`. In `solo`: `PTYPES.some(p => p.key === 'beige') === false`.
  - `check_shop` (MAG only; mirror `check_beige_shop` in `tools/w6_check.py`): locked with "5-20" text before night 100 is beaten; 50 seeds buys it after; `save.magnetOwned`, `save.lv.magnet === 1`; `typesForNight(5)` includes `MAGNET`.
  - `check_save` (all modes): an existing save with `loadout [0,1,2,3,4]`, `lv` for several pumpkins and `wardrobe.skins = {1:'candycorn'}` starts a night with no page errors; `randSprout()` with `Math.random = () => 0` (as `check_beige_save` does) returns `RAINBOW` and that type is `.rainbow`.
- [ ] **Step 2: Run on the current playtest build** (`npm run build:playtest`, serve, `--expect on`). Expected: FAIL (`'Magnet'` not in bundle, `MAGNET` undefined).
- [ ] **Step 3: Implement** the flag, `PTYPES` entry (inline `...(__MAGNET__ ? [{ key:'magnet', name:'Magnet', role:'pulls nearby monsters onto the one it hits, even off your walls', base, light, dark, spark, magnet:true }] : [])` after Beige, before Rainbow), constants, `BUY_PUMPKIN`, `UPGRADE_COST`, lore (`PUMPKIN_LORE.magnet`, original text), `lvStats` special line (`pulls up to N monsters from <rows> onto the one it hits`) and knockback `none`; in `combat.js` make the knockback roll false when `pr.type === MAGNET` (including `guar`). Test hook exports `MAGNET`. Document `__MAGNET__` / `VITE_MAGNET_AT` in `docs/RELEASES.md` "How tagging works".
- [ ] **Step 4: Run** `mag_check.py --expect on` (playtest), `--expect r5` (`VITE_RELEASE=5 npx vite build`), `--expect off` (`npm run build`), `--expect solo` (`VITE_RELEASE=2 VITE_MAGNET_AT=2 npx vite build`). Expected: all pass. Also `w6_check.py --expect on|r2|off` and `nm_check.py`/`nm2_check.py --expect on`: all pass (Rainbow index shift).
- [ ] **Step 5: Commit** `vite.config.js src/data/pumpkins.js src/data/economy.js src/data/lore.js src/main.js src/engine/combat.js tools/mag_check.py docs/RELEASES.md` — "Magnet pumpkin data, shop and Release 6 flag".

### Task 2: The pull

**Files:**
- Create: `src/engine/magnet.js`
- Modify: `src/engine/combat.js` (`hitMonsterNow`), `src/engine/monsters.js` (slide in `updateMonster`), `src/main.js` (hook), `tools/mag_check.py`

**Interfaces:**
- Consumes: `MAGNET`, `MAG_N`, `MAG_ROWS`, `MAG_SLIDE` (Task 1).
- Produces: `magnetPull(anchor, lv) -> number` (monsters pulled) in `magnet.js`; `magnetPullable(m) -> boolean`; per-monster `m.pullT` (seconds left), `m.pullDx`, `m.pullDp` (offset still to cover; decays to 0 over `MAG_SLIDE`); `G.vfx` kind `'magpull'` entries `{ x1, y1, x2, y2, t, dur }` for Task 3 to draw.

- [ ] **Step 1: Write the failing checks** in `mag_check.py` (MAG only; helper `mag_hit(lv, m)` like `BEIGE_HIT` in `w6_check.py`, using `__gg.hitMonster`; start a clean level 2 with graves cleared, castles emptied, spawning stopped):
  - `check_pull_row`: anchor at lane 3, p 0.4 (hp 50); monsters in the anchor's row in lanes 0, 1, 5, 6 at distances 3, 2, 2, 3 lanes; one in the row above. Level 1 hit → exactly 3 pulled (the two at distance 2 and one at distance 3), all with `lane === 3` and `|p - anchor.p| < 0.01` after 0.5 s; the one above and the fourth untouched.
  - `check_pull_rows`: level 3 pulls from anchor row + 1 below, not 2 below; level 5 pulls from 2 below; counts 4 / 5 / 6 respected.
  - `check_pull_excluded`: a boss, a Loot Sack (`spawnSack`), a diver with `hidden`, a mummy with `rise > 0`, a monster at p 1.05 are never pulled.
  - `check_wall_rescue`: a ghoul eating the wall in lane 5 (`p = 1`, `eating = true`) with an anchor in lane 2 one row above at level 3 → after the hit `eating === false`, it is in lane 2 at the anchor's height, and the wall in lane 5 takes no damage over the next 0.5 s.
  - `check_dead_anchor`: a level-1 hit that kills the anchor still pulls 3 onto its tile.
  - `check_slide`: 0.12 s after the hit a pulled monster's `x` is strictly between its start and the anchor's lane x; after 0.5 s it equals the lane x within the monster's usual wiggle (±6 px).
  - `check_no_kb`: 20 Magnet hits with `guar:true` never set `kb > 0`.
- [ ] **Step 2: Run** `--expect on`. Expected: FAIL (`magnetPull` not called; nothing moves).
- [ ] **Step 3: Implement** `magnet.js`: candidates = live monsters except the anchor that pass `magnetPullable` and whose row (`Math.floor(p / TILE_P())`) is in `[anchorRow, anchorRow + MAG_ROWS[i] - 1]`; sort by `Math.hypot(lane distance in px, p distance in px)`; take `MAG_N[i]`. For each: record old x/p, set `lane = anchor.lane`, `tx = LANE(lane)`, `p = anchor.p`, `eating = false`, `chewing = null`, `kb = 0`, `pullDx = oldX - tx`, `pullDp = oldP - anchor.p`, `pullT = MAG_SLIDE`; push a `'magpull'` vfx; one SFX call (Task 3 supplies the sound; call `SFX.extra('magnet')`). Hook in `hitMonsterNow` right after the mirror early-return and before knockback: `if (__MAGNET__ && pr.type === MAGNET) magnetPull(m, pr.lv);`. In `updateMonster`, first thing after the `rise` block: while `pullT > 0`, decay it and skip walking (`return` after applying `m.x = m.tx + m.pullDx * f` and drawing height from `m.p + m.pullDp * f`, where `f = pullT / MAG_SLIDE`) — keep the drawn height offset in a field the renderer reads, or apply it to `p` directly and restore; implementer's choice, the check is the contract. Make sure monster-specific movement (Review Focus 3) reads the new `lane`/`tx`.
- [ ] **Step 4: Run** all `mag_check.py` modes, `w6_check.py --expect on`, `nm_check.py --expect on`, `nm2_check.py --expect on`, `smoke_test.py`. Expected: all pass.
- [ ] **Step 5: Commit** `src/engine/magnet.js src/engine/combat.js src/engine/monsters.js src/main.js tools/mag_check.py` — "Magnet pull: nearest monsters in its rows slide onto the hit tile, off walls too".

### Task 3: Art and sound

**Files:**
- Modify: `src/engine/render/sprites.js` (Magnet branch in `paintPumpkin`, like Beige's `drips`), `src/engine/render/paintpumpkin.js` (`magnetBand(g, R)`), `src/engine/render/faces.js` (smug grin, gated), `src/engine/render/draw.js` or `render/fx.js` (draw `'magpull'` vfx from a baked spark sprite), `src/engine/audio.js` (`extra('magnet')` clunk and the Magnet hit layer), `assets/sfx/SOURCES.md` if a sample is added, `src/engine/render/draw.js` `LIT_HALO` entry for Magnet (Beige precedent).
- Test: `tools/mag_check.py`

- [ ] **Step 1: Write the failing check** `check_art`: `CHARS`/sprites build for a patch containing Magnet pumpkins with no page errors; `LIT_HALO.length === RAINBOW + 1` and `LIT_HALO[MAGNET]` is defined; after a Magnet pull a `'magpull'` vfx exists and the frame's canvas-call count with 6 pulls in flight stays within the budget used by `check_draw_budget` in `w6_check.py` (copy its counting approach).
- [ ] **Step 2: Run.** Expected: FAIL (`LIT_HALO[MAGNET]` undefined).
- [ ] **Step 3: Implement** the band (red horseshoe with silver tips over the stem), face, halo, baked spark-line sprite drawn stretched between the two points with fading alpha, and the clunk. Take a screenshot of a patch with Magnet next to Brown, Yellow and Beige; confirm copper reads distinct.
- [ ] **Step 4: Run** all checks as in Task 2 Step 4. Expected: all pass.
- [ ] **Step 5: Commit** — "Magnet look and sound: copper, horseshoe band, smug grin, spark lines, clunk".

### Task 4: Docs

**Files:** `docs/GAME_DESIGN.md` (pumpkin table row, cost table row, how-to-get row, decisions log line), `docs/WORLDS.md` §5 pumpkin list if it lists post-game pumpkins, `CLAUDE.md` (pumpkin set line, a Release 6 line under Current state), `docs/RELEASES.md` (status "Built on `dev`"; Release 6 tagging bullet listing every gated place).

- [ ] **Step 1:** Update the docs to match the code exactly (numbers from `pumpkins.js`/`economy.js`).
- [ ] **Step 2: Run** the full suite once more on every build mode. Expected: all pass.
- [ ] **Step 3: Commit** the docs — "Docs: the Magnet pumpkin (Release 6)".
