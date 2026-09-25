# CLAUDE.md: Gourd Guard

## What this project is
A Halloween lane-defense puzzle game for mobile (working title "Gourd Guard"). The player slides pumpkins on a 7×5 patch to form same-color bunches, then flicks them so each pumpkin flies straight up its column at monsters that are chewing per-column walls. Goal: a polished **120-level** mobile game: 6 worlds × 20 levels.

The owner designs the rules; your job is to implement them faithfully, keep the design doc in sync, and validate balance with the automated bot.

## Read first, every session
1. `docs/GAME_DESIGN.md`: the source of truth for every rule, number and past decision **as currently built** (see "Decisions log" before proposing changes that were already tried and reverted).
2. `docs/WORLDS.md`: the locked Release 1 target: 6 worlds, gimmicks, pumpkins, monsters, bosses, weapons, and the R2 backlog. Where it disagrees with the design doc, it is the target and the design doc catches up when the code does.
3. `index.html`: the current playable prototype (single file, ~1950 lines, no dependencies).

## Current state
- Prototype is feature-complete for 15 nights: sliding + push controls, bunches with rainbow wildcard, 6 pumpkin types with 5 levels each, gradual unlocks, loadout of 5 from night 8, graves, per-column walls, sprouts/drops, shop, endless mode, synthesized sound.
- All art is drawn in code on a canvas; all sound is Web Audio. No external assets.
- Save data lives in localStorage key `gourdguard.v1` (keep migrations backward-compatible; the prototype already refunds removed upgrades).

## Next milestone: restructure (before adding content)
Split `index.html` into a small project with data separated from engine code, for example:
```
src/
  engine/      board.js (slide/push/bunches), combat.js (projectiles, hits, effects), monsters.js, walls.js, input.js, render/*.js, audio.js
  data/        pumpkins.js (types + level tables), monsters.js, levels.js (per-level definitions/generators), patterns.js, shop.js
  ui/          screens (title, levels, loadout, shop, help, pause, result), hud.js
  main.js
index.html
```
- Prefer a lightweight setup (Vite + plain JavaScript or TypeScript). No heavy game engine unless the owner asks.
- Keep behavior identical during the restructure; verify with the balance bot before and after (results should match within noise).
- Levels must be data: every level's monsters, pacing, pattern, graves and unlocks should come from `data/levels.js` so 120 levels (6 worlds × 20) can be generated and hand-tuned. The data shape is described in `docs/WORLDS.md` §9.

## How to run
- Prototype: open `index.html` in a browser, or serve the folder (`npx serve .`) and open it.
- Test hook: opening the page with `?test` exposes `window.__gg` (game state and actions) for automated tests. Never expose it without the flag.

## How to test
- `python3 tools/smoke_test.py`: plays with real mouse input on phone and desktop sizes; fails on any page error.
- `python3 tools/balance_bot.py --nights 1,5,10 --interval 850`: human-paced bot plays full nights and reports wall health, kills and misses. Run it after any rule or number change and record results in the design doc's balance section.
- Requires Python 3 + Playwright (`pip install playwright && playwright install chromium`).

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
