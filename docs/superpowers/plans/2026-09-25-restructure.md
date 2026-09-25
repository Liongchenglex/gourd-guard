# Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `index.html` (1949 lines, one IIFE) into a Vite project of ES modules with levels as data, with behaviour identical to commit `a7845a2`.

**Architecture:** Mechanical extraction. Every top-level `function`/`const` in the IIFE moves to exactly one module and is exported by its current name. Shared mutable state (`G`, `grid`, `graves`, `walls`, `state`, `gest`) lives in `src/engine/state.js`, read through live bindings and written only through setter functions, so call sites keep their names. Level formulas become a literal table in `src/data/worlds/world1.js`.

**Tech Stack:** Vite 5, plain JavaScript ES modules, Python 3 + Playwright for tests. No runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-09-25-restructure-design.md`

## Global Constraints

- Behaviour identical to `index.html` at `a7845a2`; verified by the bot (3 runs × nights 1, 5, 10, 15, old vs new; win counts and mean wall % overlap).
- Plain JS ES modules; Vite for dev/build; no TypeScript; no game engine; no runtime dependencies.
- Save key `gourdguard.v1` and migration code unchanged.
- `window.__gg` keeps the same field names, only behind `?test`.
- Mobile-first, offline, Google Fonts are the only external request.
- Never rename a function during extraction. Never "improve" logic. Diffs inside a moved block should be imports/exports and `setX()` for state writes only.
- After every task: `npm run build` succeeds and `.venv/bin/python tools/smoke_test.py --url http://127.0.0.1:4173` prints `errors: none`.

## Source map of `index.html` (line numbers at `a7845a2`)

| Lines | Content | Destination |
|---|---|---|
| 1–141 | head, CSS | new `index.html` (CSS moved to `src/style.css`) |
| 143–252 | DOM shell | new `index.html` unchanged |
| 257–275 | `TAU, W, COLS, ROWS, CS, GX, LANE, H, GY, FENCE_Y, FIELD_TOP, FIELD_BOT, layout, rnd, clamp, fmt, mulberry, shuffle` | `engine/state.js` (layout vars) and `engine/util.js` (rnd, clamp, fmt, mulberry, shuffle, TAU) |
| 277–311 | `PTYPES, RAINBOW, NTYPES, POWER…LV_COST, WILD_CHANCE, pct, lvDesc, lvOf, typesForNight` | `data/pumpkins.js` (`lvOf` needs `save`: goes to `save.js`) |
| 314–322 | `PATTERNS, SPAWN_STEPS, gravesFor` | `data/patterns.js`; `gravesFor` folds into `data/worlds/world1.js` |
| 325–364 | `TYPES, MINTRO, MFIRST, WORLDS, LEVELS, poolFor, pickFrom, levelDef` | `data/monsters.js` (TYPES, MINTRO, MFIRST), `data/worlds/index.js` (WORLDS, LEVELS, levelDef), `engine/spawner.js` (pickFrom) |
| 365–370 | `GEAR, wallMax` | `data/shop.js`, `engine/walls.js` |
| 373–388 | save | `save.js` |
| 391–445 | audio | `engine/audio.js` |
| 446–478 | canvas refs, `resize, measureCoin, ell, tri, rrect, hexToRgb, mix, shade` | `engine/render/canvas.js` (wrap, cv, ctx, scale, dpr, K, resize, measureCoin), `engine/render/util.js` (ell…shade) |
| 479–622 | `RAINBOW_RIBS, paintPumpkin, pumpkinIcon, buildSprites, buildBg` + sprite vars | `engine/render/sprites.js` |
| 623–635 | `G, state, grid, graves, walls, gest, bannerTimer, gidSeq, HOLD_TIME, newCell, randColor, randSprout, inside, blocked` | `engine/state.js` (G…gidSeq, HOLD_TIME), `engine/board.js` (newCell…blocked) |
| 636–910 | board: `sameColorSize, initBoard, initWalls, computeGroups, resolveMatches, DIRV, slideDest, planMove, slideOne, emptyCells, sprout/drop helpers, collectDrop, smash, findCell, laneThreat, boardScore, bestMove, primaryGid, groupCells, launchGroup, bestLitGroup` | `engine/board.js` (all except `initWalls` → `walls.js`, `launchGroup` → `combat.js`) |
| 911–1069 | `mY, mS, TILE_P, spMulNow, hpExtra, lanesOf, pickLane, spawnMonster, damage, dropHop, dropPumpkins, kill, knockback, damageWall, aheadLimit, updateMonster, hitMonster, spark, chunk, ring, addFloat` | `engine/monsters.js` (mY…spawnMonster, aheadLimit, updateMonster), `engine/combat.js` (damage, dropHop, dropPumpkins, kill, knockback, hitMonster, spark, chunk, ring, addFloat), `engine/walls.js` (damageWall) |
| 1070–1076 | `banner` | `ui/hud.js` |
| 1077–1158 | `makeDemo, beginNight, beginEndless, startGame, storySpawn, endlessSpawn, wallFrac, endGame` | `engine/game.js` (makeDemo, beginNight, beginEndless, startGame, endGame), `engine/spawner.js` (storySpawn, endlessSpawn), `engine/walls.js` (wallFrac) |
| 1159–1225 | `showResult, fmtTime, addBtn, useFirework, useRepair` | `ui/screens.js` (showResult, fmtTime, addBtn), `engine/game.js` (useFirework, useRepair) |
| 1226–1354 | `OVS, shopReturn…, setState, withHelp, openLevels, openLoadout, syncLoadout, openShop, renderShop, buildLegend, syncSound, toggleSound, syncSpawn, stepSpawn` | `ui/screens.js` |
| 1355–1378 | `hudSig, updateHud` | `ui/hud.js` |
| 1379–1454 | `toLogical, cellAt, dropAt`, pointer listeners, `endGesture`, button wiring, visibilitychange, keydown | `engine/input.js` (pointer, keyboard, gesture), `ui/screens.js` (button wiring, in a `wireButtons()` function) |
| 1455–1536 | `update, commonFx, demoUpdate` | `engine/game.js` |
| 1537–1918 | `STARS, render, draw*` | `engine/render/draw.js` (STARS, render, drawWalls…drawStar), `engine/render/monsters.js` (drawMonster…drawBoss, wing) |
| 1919–1930 | `last, frame` | `main.js` |
| 1931–1946 | boot + test hook | `main.js` |

## State module contract (used by every task)

```js
// src/engine/state.js
export const TAU = Math.PI * 2;
export const W = 540, COLS = 7, ROWS = 5, CS = 74, GX = (W - COLS * CS) / 2;
export const LANE = c => GX + c * CS + CS / 2;
export let H = 960, GY = 0, FENCE_Y = 0, FIELD_TOP = 150, FIELD_BOT = 0;
export function layout(){ /* lines 261–269 verbatim, assigns the lets above */ }
export const HOLD_TIME = 0.6;
export let G = null, state = 'title', grid = [], graves = [], walls = [], gest = null, bannerTimer = 0, gidSeq = 0;
export const setG = v => { G = v; };
export const setState_ = v => { state = v; };      // raw write; ui/screens.js setState() wraps it
export const setGrid = v => { grid = v; };
export const setGraves = v => { graves = v; };
export const setWalls = v => { walls = v; };
export const setGest = v => { gest = v; };
export const setBannerTimer = v => { bannerTimer = v; };
export const nextGid = () => ++gidSeq;
export function setH(v){ H = v; }
```
Rule: any `X = …` assignment to one of these lets inside a moved block becomes `setX(…)`. `gidSeq++`/`++gidSeq` becomes `nextGid()`. Reads stay as-is (live bindings).

---

### Task 1: Branch, Vite scaffold, legacy copy, static server for tests

**Files:**
- Create: `package.json`, `vite.config.js`, `src/main.js` (temporary), `src/style.css`, `legacy/index.html`, `tools/serve_dist.py`
- Modify: `index.html` (becomes the Vite entry), `.gitignore`, `tools/smoke_test.py`, `tools/balance_bot.py`

**Interfaces:**
- Produces: `npm run build` → `dist/`; `tools/serve_dist.py [port] [dir]` serves a directory; both Python tools accept `--url`.

- [ ] **Step 1: Branch and copy the reference file**

```bash
git checkout -b restructure
mkdir -p legacy && cp index.html legacy/index.html
```

- [ ] **Step 2: Scaffold Vite**

`package.json`:
```json
{ "name": "gourd-guard", "private": true, "version": "0.1.0", "type": "module",
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview --port 4173 --strictPort" },
  "devDependencies": { "vite": "^5.4.0" } }
```
`vite.config.js`:
```js
import { defineConfig } from 'vite';
export default defineConfig({ base: './', build: { target: 'es2019', assetsInlineLimit: 0 } });
```
Run `npm install`. Add `node_modules/` and `dist/` to `.gitignore` (already present).

- [ ] **Step 3: Split index.html into entry + CSS + temporary main.js**

- Move lines 11–140 (inside `<style>`) to `src/style.css`. Replace the `<style>` block with nothing; `src/main.js` will `import './style.css'`.
- Replace `<script>…</script>` (lines 254–1947) with `<script type="module" src="/src/main.js"></script>`.
- `src/main.js` temporarily contains `import './style.css';` followed by the whole IIFE body (lines 255–1946) unchanged. This is the "big move" baseline: same code, now a module.
- Check `document.fonts` and `localStorage` code still runs (module scripts are deferred; the DOM is ready, so `$()` lookups work).

- [ ] **Step 4: Static server for tests**

`tools/serve_dist.py`:
```python
#!/usr/bin/env python3
"""Serve a directory (default dist/) on 127.0.0.1:PORT for the test tools. Usage: serve_dist.py [port] [dir]"""
import functools, http.server, pathlib, sys
port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
root = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else pathlib.Path(__file__).resolve().parent.parent / 'dist'
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
H.log_message = lambda *a, **k: None
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
```

- [ ] **Step 5: `--url` on both tools**

In `tools/smoke_test.py` and `tools/balance_bot.py` add:
```python
ap.add_argument('--url', default=None, help='page URL; default is legacy/index.html via file://')
...
PAGE = args.url or (ROOT / 'legacy' / 'index.html').as_uri()
```
(`smoke_test.py` has no argparse yet: add one with just `--url`.) In the bot, append `?test` to whatever URL is used: `PAGE = (args.url or file_uri) + ('&test' if '?' in (args.url or '') else '?test')`.

- [ ] **Step 6: Verify both targets**

```bash
npm run build
.venv/bin/python tools/serve_dist.py 4173 &   # leave running
.venv/bin/python tools/smoke_test.py                                   # legacy file
.venv/bin/python tools/smoke_test.py --url http://127.0.0.1:4173/     # built app
```
Expected: both print `errors: none`. Open http://127.0.0.1:4173/?test in a browser (or Playwright) and confirm `window.__gg` exists.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "Scaffold Vite; move prototype script into src/main.js unchanged; test tools accept --url"
```

---

### Task 2: Bot repeats and summary

**Files:**
- Modify: `tools/balance_bot.py`

**Interfaces:**
- Produces: `--repeats N` (default 1). Per-run JSON lines unchanged. Final summary line per night: `{"night": n, "runs": N, "wins": k, "win_rate": k/N, "mean_walls_pct": x, "mean_missed_frac": y}`.

- [ ] **Step 1: Implement**

Wrap the per-night body in `for rep in range(args.repeats):`, collect `r` into `per_night[n]`, and after the loop print one summary JSON per night computed from the collected runs (`wins` = count of `title == 'Night saved'`).

- [ ] **Step 2: Verify**

```bash
.venv/bin/python tools/balance_bot.py --nights 1 --repeats 2
```
Expected: 2 run lines then 1 summary line with `"runs": 2`.

- [ ] **Step 3: Commit** `git commit -am "Balance bot: --repeats and per-night summary"`

---

### Task 3: Extract util, data, save, audio (leaf modules)

**Files:**
- Create: `src/engine/util.js`, `src/engine/state.js`, `src/data/pumpkins.js`, `src/data/patterns.js`, `src/data/monsters.js`, `src/data/shop.js`, `src/save.js`, `src/engine/audio.js`
- Modify: `src/main.js` (delete the moved lines, add imports)

**Interfaces:**
- `util.js` exports `rnd, clamp, fmt, mulberry, shuffle, $` (`$` = `s => document.querySelector(s)` as in line ~446).
- `state.js` as in the contract above.
- `pumpkins.js` exports `PTYPES, RAINBOW, NTYPES, POWER, KB_CHANCE, SLOW_T, FREEZE_P, BURN_N, BURN_AMT, BURN_EVERY, SPAWN_P, RAINBOW_P, LV_COST, WILD_CHANCE, pct, lvDesc, typesForNight`.
- `patterns.js` exports `PATTERNS, SPAWN_STEPS`.
- `data/monsters.js` exports `TYPES, MINTRO, MFIRST`.
- `shop.js` exports `GEAR`.
- `save.js` exports `SAVE_KEY, save, persist, lvOf`.
- `audio.js` exports `ensureAudio, SFX` (and `tone, noise` if referenced elsewhere; check with grep).

- [ ] **Step 1: Move blocks** per the source map. For each moved block, grep `src/main.js` for every identifier it defines and add the import line at the top of `main.js`.
- [ ] **Step 2: Build + smoke** (`npm run build && .venv/bin/python tools/smoke_test.py --url http://127.0.0.1:4173/`). Expected `errors: none`.
- [ ] **Step 3: Commit** `git commit -am "Extract util, state, data, save, audio modules"`

---

### Task 4: Extract render modules

**Files:**
- Create: `src/engine/render/canvas.js`, `src/engine/render/util.js`, `src/engine/render/sprites.js`, `src/engine/render/monsters.js`, `src/engine/render/draw.js`
- Modify: `src/main.js`

**Interfaces:**
- `canvas.js` exports `wrap, cv, ctx, scale, dpr, K, coinTarget, resize, measureCoin` plus setters for the lets it owns (`scale, dpr, K`) if any other module writes them (grep; if only `resize` writes them, no setters needed).
- `render/util.js` exports `ell, tri, rrect, hexToRgb, mix, shade`.
- `sprites.js` exports `sprites, fogSprite, bg, bgWorld, RAINBOW_RIBS, paintPumpkin, pumpkinIcon, buildSprites, buildBg` (the lets need setters if written outside; `buildBg` writes `bg, bgWorld`; `buildSprites` writes `sprites, fogSprite`; all inside the module, so export getters via live bindings only).
- `render/monsters.js` exports `drawMonster`.
- `draw.js` exports `render`.

- [ ] **Step 1: Move blocks** (lines 446–478 → canvas/util; 479–622 → sprites; 1537–1771 → draw; 1772–1918 → render/monsters). `resize()` calls `layout()` and `buildSprites()`, and writes `H` via `setH`.
- [ ] **Step 2: Build + smoke.** Expected `errors: none` and the screenshots in `tools/out/` look the same as before.
- [ ] **Step 3: Commit** `git commit -am "Extract render modules"`

---

### Task 5: Extract board, walls, combat, monsters, spawner

**Files:**
- Create: `src/engine/board.js`, `src/engine/walls.js`, `src/engine/combat.js`, `src/engine/monsters.js`, `src/engine/spawner.js`
- Modify: `src/main.js`

**Interfaces:**
- `board.js` exports `newCell, randColor, randSprout, inside, blocked, sameColorSize, initBoard, computeGroups, resolveMatches, DIRV, slideDest, planMove, slideOne, emptyCells, collectDrop, smash, findCell, laneThreat, boardScore, bestMove, primaryGid, groupCells, bestLitGroup` plus whatever sprout/drop helpers sit in 788–835 (list them with `grep -n "^function" | sed -n` on that range).
- `walls.js` exports `wallMax, initWalls, damageWall, wallFrac`.
- `combat.js` exports `launchGroup, damage, dropHop, dropPumpkins, kill, knockback, hitMonster, spark, chunk, ring, addFloat`.
- `monsters.js` exports `mY, mS, TILE_P, spMulNow, hpExtra, lanesOf, pickLane, spawnMonster, aheadLimit, updateMonster`.
- `spawner.js` exports `pickFrom, storySpawn, endlessSpawn`.

Circular imports are fine between these (ES modules handle function hoisting); only top-level *evaluation* order matters, and none of these run code at load.

- [ ] **Step 1: Move blocks.** Writes to `grid/graves/walls` (in `initBoard`, `initWalls`) become `setGrid/setGraves/setWalls`. `++gidSeq` in `resolveMatches` becomes `nextGid()`.
- [ ] **Step 2: Build + smoke.**
- [ ] **Step 3: Run the bot once on the build** to catch runtime errors the smoke test can't reach: `.venv/bin/python tools/balance_bot.py --nights 5 --url http://127.0.0.1:4173/`. Expected: a result line with `"errors": []`.
- [ ] **Step 4: Commit** `git commit -am "Extract board, walls, combat, monsters, spawner"`

---

### Task 6: Extract game loop, input, ui; finish main.js

**Files:**
- Create: `src/engine/game.js`, `src/engine/input.js`, `src/ui/screens.js`, `src/ui/hud.js`
- Modify: `src/main.js` (ends up ~40 lines)

**Interfaces:**
- `game.js` exports `makeDemo, beginNight, beginEndless, startGame, endGame, useFirework, useRepair, update, commonFx, demoUpdate`.
- `input.js` exports `attachInput()` which registers the pointer/keyboard/visibility listeners (lines 1389–1454 minus the button wiring), plus `toLogical, cellAt, dropAt, endGesture, heldGid` (`heldGid` is used by draw.js; move it here or to board.js, one place).
- `screens.js` exports `setState, withHelp, openLevels, openLoadout, syncLoadout, openShop, renderShop, buildLegend, syncSound, toggleSound, syncSpawn, stepSpawn, showResult, fmtTime, addBtn, wireButtons`.
- `hud.js` exports `banner, updateHud`.
- `main.js`: imports, `attachInput(); wireButtons(); makeDemo(); resize(); buildLegend(); syncSound(); setState('title'); persist(); fonts.ready→measureCoin; requestAnimationFrame(frame);` and the `?test` hook with the same object literal as lines 1942–1945.

- [ ] **Step 1: Move blocks.** `state = …` in `setState` → `setState_`; `gest = …` in input → `setGest`; `G = …` in `startGame/makeDemo` → `setG`; `bannerTimer = …` → `setBannerTimer`.
- [ ] **Step 2: Build + smoke.**
- [ ] **Step 3: Confirm `main.js` contains no game logic** (only imports, boot calls, `frame`, test hook).
- [ ] **Step 4: Commit** `git commit -am "Extract game loop, input and UI modules; main.js is boot only"`

---

### Task 7: Levels as data

**Files:**
- Create: `src/data/worlds/index.js`, `src/data/worlds/world1.js`, `src/data/worlds/world2.js` … `world6.js`, `src/data/levels.js`
- Modify: `src/engine/game.js` (`beginNight` reads `levelFor(n)` instead of `levelDef(n)`), `src/data/worlds/index.js` replaces `levelDef/poolFor/gravesFor/LEVELS/WORLDS`.

**Interfaces:**
- `levels.js`: JSDoc typedef `LevelDef` = `{ world, level, n, pattern, graves, total, interval, spMul, boss, pool, worldTheme }` and `export function expandLevel(def)` returning the exact object shape `levelDef(n)` returns today (`{ n, world, total, interval, spMul, boss, pool, pattern, graves }`).
- `worlds/index.js`: `export const WORLDS` (the 3 theme entries, unchanged), `export const LEVELS = 15`, `export function levelFor(n)` → `expandLevel(WORLD_LEVELS[n-1])`.
- `world1.js`: `export default [ …15 literal objects… ]`.

- [ ] **Step 1: Write a generator script** `tools/gen_world1.py`? No: do it in JS once. Add a temporary `console.log(JSON.stringify([...Array(15)].map((_, i) => levelDef(i + 1))))` to the dev build, copy the output into `world1.js` as a formatted literal, remove the log. Pool weights must be literal numbers (e.g. Mossback `3 + 0.2n` becomes `3.2, 3.4 …`).
- [ ] **Step 2: Equivalence test** in `tools/check_levels.mjs` (Node, no browser):
```js
import world1 from '../src/data/worlds/world1.js';
import { expandLevel } from '../src/data/levels.js';
import { legacyLevelDef } from './legacy_leveldef.mjs'; // copy of lines 322, 346–364 + PATTERNS length
for (let n = 1; n <= 15; n++){
  const a = JSON.stringify(expandLevel(world1[n - 1])), b = JSON.stringify(legacyLevelDef(n));
  if (a !== b){ console.error('MISMATCH night', n, '\n', a, '\n', b); process.exit(1); }
}
console.log('levels identical');
```
Run: `node tools/check_levels.mjs`. Expected `levels identical`.
- [ ] **Step 3: Switch `beginNight`** to `levelFor(n)`; delete `levelDef`, `poolFor`, `gravesFor`. Build + smoke.
- [ ] **Step 4: Stubs** `world2.js`…`world6.js`: `export default [];` with a header comment pointing at `docs/WORLDS.md` §9.
- [ ] **Step 5: Commit** `git commit -am "Levels are data: world1.js literal table, equivalence-checked against the old generator"`

---

### Task 8: Behaviour verification, docs, merge

**Files:**
- Modify: `docs/GAME_DESIGN.md` §11, `CLAUDE.md` (Current state, How to run, How to test), `README.md`
- Delete: `legacy/index.html`

- [ ] **Step 1: Old vs new bot runs**
```bash
.venv/bin/python tools/balance_bot.py --nights 1,5,10,15 --repeats 3 > /tmp/old.jsonl
.venv/bin/python tools/balance_bot.py --nights 1,5,10,15 --repeats 3 --url http://127.0.0.1:4173/ > /tmp/new.jsonl
grep '"runs"' /tmp/old.jsonl /tmp/new.jsonl
```
Pass criterion: for each night, `wins` differs by at most 1 and `mean_walls_pct` by at most 10 points. If a night fails, run 3 more of each before concluding; if still apart, diff behaviour (most likely a missed `setX` write or a load-order issue) and fix before continuing.
- [ ] **Step 2: Record both summary tables** in `docs/GAME_DESIGN.md` §11 under "Restructure verification (date)".
- [ ] **Step 3: Update docs.** CLAUDE.md: read-first item 3 becomes `src/` layout; How to run: `npm install`, `npm run dev`, `npm run build`; How to test: start `tools/serve_dist.py`, both tools with `--url`, bot `--repeats 3` as the minimum for balance claims. README: same. Design doc §12: "Vite project" instead of "single HTML file".
- [ ] **Step 4: Delete `legacy/`**, make the bot's default URL an error message telling the user to pass `--url` or start the server, build, smoke, commit.
- [ ] **Step 5: Merge** `git checkout master && git merge --no-ff restructure -m "Merge restructure: Vite modules, levels as data"`.

## Self-review

- Spec coverage: layout (T3–T7), level schema (T7), test hook (T6), bot tooling (T1–T2), verification (T8), docs (T8), out-of-scope respected.
- Placeholders: T7 step 1 has a concrete method (log + paste); no TBDs.
- Names: `setState_` (raw) vs `setState` (ui) distinguished; `heldGid` assigned to one module in T6; `lvOf` lives in `save.js` because it reads `save`.
