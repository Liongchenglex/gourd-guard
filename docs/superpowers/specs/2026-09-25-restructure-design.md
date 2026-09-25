# Restructure design: index.html → Vite project with data-driven levels

Approved by the owner on 2026-09-25 (chat). Goal: split the single-file prototype into engine, data and UI modules **without changing behaviour**, so that Release 1 content (`docs/WORLDS.md`) can be built as data.

## Constraints
- Behaviour identical to `index.html` at commit `a7845a2`. Verified by the balance bot: 3 runs each of nights 1, 5, 10, 15 on old and new; win counts and mean wall health must overlap.
- Plain JavaScript ES modules, Vite for dev server and build. No TypeScript, no game engine, no runtime dependencies.
- Save key `gourdguard.v1` and its migration logic unchanged.
- `?test` hook keeps the same shape (`window.__gg` with the same fields and functions) so `tools/balance_bot.py` keeps working.
- Mobile-first, offline, Google Fonts only external request (unchanged).

## Layout
```
index.html            Vite entry: DOM shell (screens, HUD) + <script type="module" src="/src/main.js">
src/
  main.js             boot: resize, save load, state machine, frame loop
  engine/
    state.js          shared mutable game state (G, grid, graves, walls, state string) + constants (W, COLS, ROWS, CS, layout)
    board.js          newCell, computeGroups, resolveMatches, slideDest/planMove/slideOne/push, smash, sprouts, drops collection, hints (bestMove/bestLitGroup)
    combat.js         launchGroup, projectiles, hitMonster, damage, kill, knockback, drops, effects (burn/slow/freeze), spark/chunk/ring/floats
    monsters.js       spawnMonster, updateMonster, aheadLimit, boss behaviour
    walls.js          initWalls, damageWall, wallFrac, wallMax
    spawner.js        storySpawn, endlessSpawn, poolFor/pickFrom
    input.js          pointer handling, gestures, hold-to-smash, keyboard
    audio.js          ensureAudio, tone, noise, SFX
    render/
      sprites.js      paintPumpkin, pumpkinIcon, buildSprites, fog sprite, buildBg
      draw.js         render(), drawWalls/Graves/Grid/Cell/Drops/Preview/HoldRing/HintArrow/SproutBar
      monsters.js     drawMonster and per-type drawers
      util.js         ell, tri, rrect, hexToRgb, mix, shade
  data/
    pumpkins.js       PTYPES, level tables (POWER, KB_CHANCE, …), LV_COST, WILD_CHANCE, lvDesc
    monsters.js       TYPES, MINTRO, MFIRST
    patterns.js       PATTERNS, SPAWN_STEPS
    shop.js           GEAR, sturdy wall costs, consumable prices
    worlds/
      index.js        WORLDS list, levelFor(worldIndex, level) → level def
      world1.js       15 level defs generated to match today's levelDef(n)/gravesFor(n)/typesForNight(n)
      world2..6.js    empty schema stubs
    levels.js         schema doc (JSDoc) + helper to expand a level def into spawner parameters
  ui/
    screens.js        title, levels, loadout, shop, help, pause, result (setState, openLevels, openLoadout, renderShop, showResult)
    hud.js            updateHud, coin fly, banner, legend, sound/spawn toggles
  save.js             SAVE_KEY, save object, load/migrate, persist
tools/
  balance_bot.py      + --repeats N, + --url (defaults to a built dist served by a bundled static server), win-rate summary line
  smoke_test.py       + --url
  serve_dist.py       tiny http.server for dist/ (used by both tools)
package.json, vite.config.js, .gitignore (node_modules, dist)
```

## Level data schema (v1, only what the prototype needs; R1 fields are added later)
```js
{ world: 1, level: 3,            // address 1-3
  pattern: 2,                    // PATTERNS index
  graves: 1,
  loadout: 'all' | [typeIds],    // 'all' = every unlocked type; owner picks when >5
  unlockPumpkins: [typeId],      // banner + unlock on start
  monsters: { count, gap, gapJitter, speedMul, pool: [[type, weight]...] },
  boss: null | { type, at: 0.4 }, // fraction of spawns after which the boss appears
  worldTheme: 0..2 }
```
`world1.js` produces these from the current formulas so numbers are identical; it is written out as a literal table (not a function) so it can be hand-tuned.

## Test hook
`window.__gg` exposes: state, G, grid, walls, save, LANE, emptyCells, collectDrop, groupCells, launchGroup, bestMove, bestLitGroup, slideOne, startGame. Same names as today.

## Steps
1. Branch `restructure`. Scaffold Vite; move CSS and DOM into new `index.html`; the old file becomes `legacy/index.html` (kept until merge, then deleted).
2. Extract modules in dependency order: util → data → save → audio → state → walls → board → combat → monsters → spawner → sprites → draw → input → ui → main. After each extraction, `npm run build` + smoke test.
3. Bot tooling: repeats, url, static server. Run 3× nights 1,5,10,15 against `legacy/index.html` and against `dist/`.
4. Compare, fix any divergence, record both tables in `docs/GAME_DESIGN.md` §11.
5. Update CLAUDE.md "How to run / How to test", README. Merge to master, delete `legacy/`.

## Out of scope
Any rule from `docs/WORLDS.md`. New art. Fonts self-hosting. Capacitor.
