# CLAUDE.md: Gourd Guard

## What this project is
A Halloween lane-defense puzzle game for mobile (working title "Gourd Guard"). The player slides pumpkins on a 7×5 patch to form same-color bunches, then flicks them so each pumpkin flies straight up its column at monsters that are chewing per-column walls. Goal: a polished **120-level** mobile game: 6 worlds × 20 levels.

The owner designs the rules; your job is to implement them faithfully, keep the design doc in sync, and validate balance with the automated bot.

## Read first, every session
1. `docs/GAME_DESIGN.md`: the source of truth for every rule, number and past decision **as currently built** (see "Decisions log" before proposing changes that were already tried and reverted).
2. `docs/WORLDS.md`: the locked Release 1 target: 6 worlds, gimmicks, pumpkins, monsters, bosses, weapons, and the R2 backlog. Where it disagrees with the design doc, it is the target and the design doc catches up when the code does.
3. `src/`: the game. `engine/` (board, combat, monsters, walls, spawner, input, audio, render/), `data/` (pumpkins, monsters, patterns, shop, `worlds/world1..6.js` level tables), `ui/` (screens, hud), `save.js`, `main.js` (boot only). Plain JavaScript ES modules built with Vite; no runtime dependencies.

## Current state
- Restructured (2026-09-25) into `src/` modules, behaviour verified by the bot. Levels are data.
- Release 1 ground rules in: sprouts in twos, kill-reward roll (weapon 10% / pumpkin 30% / coins 60%), bosses never reach the wall, boss levels spawn until the boss dies.
- World 1 (Pumpkin Patch): 20 data levels in `src/data/worlds/world1.js` with Ice 1-3, Firework 1-5, Grave buster 1-6, Fire 1-8, Mummy 1-9, the Gravekeeper at 1-10 and 1-20.
- World 2 (Foggy Hollow): 20 data levels in `world2.js` with fog banks, Lantern 2-2, White 2-3, Landmine 2-5, Bog Ghoul/Wisp 2-1, Wraith 2-4, Swift Bat 2-6, Wisp Rider 2-7, Marsh Imp 2-8, Plague Doctor 2-9, the Poltergeist at 2-10 and 2-20. Monsters may carry modifiers (`MODS`) via variants (`VARIANTS`).
- World 3 (Crumbling Keep): 20 data levels in `world3.js` with castle walls (`castles`), Bomb 3-4, Grey 3-6 (loadout choice starts here), Black 3-9, Crypt Ghoul/Keep Imp 3-1, Shield Knight 3-2, Gargoyle Hauler 3-3, Skeleton Archer 3-5, Siege Brute 3-7, Vampire 3-8, the Vampire Count at 3-10 and 3-20.
- World 4 (Drowned Marsh): 20 data levels in `world4.js` with puddles and sea-row levels, Pink 4-4, Drowned Ghoul/Tide Imp 4-1, Puddle Crawler 4-2, Drunk Sailor 4-3, Bog Turtle 4-5, Splitter Slime 4-6, Puddle Diver 4-7, Sodden Mummy 4-9, the Twin Tides at 4-10 and 4-20.
- World 5 (Witchwood): 20 data levels in `world5.js` with wind gusts (`gust`), Scarecrow 5-2, Purple 5-3, Gold 5-10, Wood Ghoul/Broom Imp 5-1, Owl-bat 5-2, Wisp 5-4, Chameleon 5-5, Reverse Chameleon 5-7, Mirror Sprite 5-8, the Hexwitch at 5-10 and 5-20. World 6 is an empty stub.
- **Testing toggle to remove before release**: the level select has a "Testing: unlock all levels" link (`save.testUnlock`, checked in `isOpen()`), added 2026-09-25 so the owner can play any level.
- Known cosmetic issue: six tool buttons crowd the top bar on phones; fix in the UI/art pass (a tool tray), keeping 44 px targets.
- Every level tap opens a preview card (monsters, boss, pumpkins, graves, tools); first appearances show intro cards. Tools appear in the HUD/shop/drops only once introduced.
- Neither world is tuned yet: the owner asked to build worlds first and tune later. Level 10 of world 1 felt too hard to the owner.
- All art is drawn in code on a canvas; all sound is Web Audio. No external assets.
- Save data lives in localStorage key `gourdguard.v1` (keep migrations backward-compatible; the game already refunds removed upgrades).
- Shared mutable state (`G`, `grid`, `graves`, `walls`, `state`, `gest`) lives in `src/engine/state.js`; other modules read it through imports and write it only through its `setX()` functions.
- Balance rule from the owner: levels are tuned to be winnable at the **expected upgrade profile** for that level (`profile()` in `tools/balance_bot.py`) and hard below it, so upgrading pumpkins matters. Check both with `--offset 0` and `--offset -1`.

## Next milestone: Release 1 content
Build `docs/WORLDS.md` one world at a time, each with its own bot runs. Next: world 6 (Hallow's End: graves only, every monster with modifiers, the Hollow King in 5 stages), then tuning of worlds 1–5 when the owner revisits.
- Levels must be data: every level's monsters, pacing, pattern, graves and unlocks come from `src/data/worlds/*.js` (schema in `src/data/levels.js`, target shape in `docs/WORLDS.md` §9).
- Keep the engine free of level-specific numbers.

## How to run
- `npm install` once, then `npm run dev` for a live-reload dev server, or `npm run build` to produce `dist/`.
- To play a build: `python3 tools/serve_dist.py` serves `dist/` on http://127.0.0.1:4173/ (no cache headers, safe for tests).
- Test hook: opening the page with `?test` exposes `window.__gg` (game state and actions) for automated tests. Never expose it without the flag.

## How to test
- Python tools live in a venv: `.venv/bin/python` (create with `python3 -m venv .venv && .venv/bin/pip install playwright && .venv/bin/playwright install chromium`).
- Always test the **build**: `npm run build`, start `tools/serve_dist.py`, then pass `--url http://127.0.0.1:4173/` to the tools below.
- `.venv/bin/python tools/smoke_test.py --url …`: plays with real mouse input on phone and desktop sizes; fails on any page error.
- `.venv/bin/python tools/balance_bot.py --nights 1,5,10,15 --repeats 3 --url …`: human-paced bot plays full nights and prints one JSON line per run plus a per-night summary (win rate, mean wall %). Single runs are noise; **3 repeats per night is the minimum** for any balance claim. Run it after any rule or number change and record results in the design doc's balance section.
- `node tools/check_levels.mjs`: proves `world1.js` still reproduces the prototype's level formulas. Delete it once world 1 is redesigned for Release 1.

## Phone playtests
After each milestone the owner plays it on their phone. `npm run build`, then `.venv/bin/python tools/bundle_single.py` writes `dist/gourd-guard.html` (CSS and JS inlined, no document wrapper). Publish that file as a private artifact, **updating the existing artifact URL** (see memory) so the owner's save data carries over.

## Working rules
- **Rules change → design doc changes in the same edit.** Never let code and `GAME_DESIGN.md` disagree.
- Ask the owner before changing a rule they set. When a rule is ambiguous, propose a default, state it, and note it in the doc.
- Balance changes must be justified with bot runs (before/after), not guesses.
- Mobile first: touch targets ≥44 px, works one-handed, respects safe areas, no hover-only UI.
- Performance: keep 60 fps on mid-range phones; pre-render sprites; avoid per-frame allocations in hot loops.
- Original IP only: don't use the names, art or text of "Pumpkins vs. Monsters" or Plants vs. Zombies; don't describe the game as a remake. Art stays original (drawn in code unless the owner provides assets).
- Keep the game fully playable offline with no network requests other than Google Fonts (and plan to self-host fonts for the mobile build).

## Longer-term plan (see design doc §15)
New ground rules → more pumpkin types and a 120-level power-scaling model → monster variety and bosses → map variety → 120 levels in 6 worlds → art/music polish → installable web app → Capacitor builds for App Store and Google Play.
