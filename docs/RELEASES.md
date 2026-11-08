# Releases, branches and the playtest link

For any Claude Code session. Read this together with `CLAUDE.md`. It replaces the World 6 beta briefing (2026-10-21) and keeps its rules, widened from "World 6 on or off" to numbered releases (owner, 2026-11-02).

## The idea

The owner builds many ideas ahead of the stores and wants to see all of them on the private playtest link, while shipping them to the App Store and Google Play one release at a time.

- **One development branch, `dev`, holds everything.** Every feature is built there once.
- **Every feature is tagged with the release it ships in.**
- **A build includes the releases up to one number:**
  - **Store builds** ship the current store release (`STORE_RELEASE` in `vite.config.js`).
  - **The playtest build** ships everything ("all").

## The release plan (owner)

| Release | Content | Status |
|---|---|---|
| 1 | Worlds 1–5 | In the stores (branch `r1-ground-rules`) |
| 2 | Hallow's End 6-1 to 6-16 | Content complete on `dev` (owner: "a wrap", 2026-11-02); not yet shipped (cut `release/2` when the owner says) |
| 3 | Hallow's End 6-17 to 6-20 (the Hollow King) **and** the Beige pumpkin | Built on `dev` (2026-11-02; spec `docs/superpowers/specs/2026-11-02-release-3-design.md`), awaiting the owner's play; not shipped. (The owner merged the old R3 and R4 on 2026-11-02.) |
| 4 | Nightmare Pumpkin Patch: Nightmare 1-1 to 1-16 (fire tiles, the Cinder Rooster, Hayrick, Corn Husker, Grave Riser, Casket Jack and Crow, the Strawlord mini boss, the Grave Gourd, and the Fallen Gravekeeper on N1-16) | Built on `dev` (2026-11-04; numbers untuned (first draft), see `GAME_DESIGN.md` §11; spec `docs/superpowers/specs/2026-11-04-release-4-nightmare-patch-design.md`), awaiting the owner's play; not shipped. Check with `tools/nm_check.py --expect on\|r4\|r3\|r2\|off` |
| 5 | Nightmare Foggy Hollow: Nightmare 2-1 to 2-16 (poison fog, rotten pumpkins, the Lamplighter mini boss, the Protector Gourd, the Fallen Poltergeist) | Built on `dev` (2026-11-06), a **beta**: first-guess numbers, no bot balance runs, awaiting the owner's play; not shipped (spec `docs/superpowers/specs/2026-11-05-release-5-nightmare-hollow-design.md`; levels in `nightmare2.js`, rules in `GAME_DESIGN.md` §9 "Nightmare Foggy Hollow"). Check with `tools/nm2_check.py --expect on\|r4\|r3\|r2\|off` (and `tools/nm_check.py --expect on\|r4`) |
| 6 | The Magnet pumpkin (bought with 50 seeds after 5-20; pulls monsters onto one tile and off walls). Standalone: depends only on Release 1, so it can ship before 4 and 5 by renumbering | Built on `dev` (2026-11-08; spec `docs/superpowers/specs/2026-11-08-release-6-magnet-design.md`), awaiting the owner's play; not shipped. Check with `tools/mag_check.py --expect on\|r5\|off\|solo` |
| 7 | Nightmare Witchwood (owner, 2026-11-08) | Not started |
| … | further nightmare worlds, one per release | Owner to order |

The owner may reorder or regroup releases at any time. When they do, update this table and the tags in the code together.

## Branches

- **`dev`:** all development. The playtest link is always built from here. (Renamed from `w6-hallows-end` on 2026-11-02.)
- **`r1-ground-rules`:** the frozen Release 1 branch. The current store builds come from here. Store-only fixes (crashes, typos) for Release 1 go here first, then `git merge r1-ground-rules` into `dev`.
- **Shipping release N:** cut `release/N` from `dev` and set `STORE_RELEASE = N` there (and on `dev`). Build the iPhone and Android apps from `release/N`. From then on, store fixes for N go on `release/N` and are merged into `dev`.
- **Never merge `dev` into a release branch.** Never build a store app from `dev`.

## How tagging works

- **The build number:** `vite.config.js` sets `__RELEASE__`:
  - `npm run build` uses `STORE_RELEASE` (today 1).
  - `npm run build:playtest` (`VITE_RELEASE=all`) uses 999.
  - `VITE_RELEASE=N npm run build` previews any single release.
  - `VITE_W6=1` still means "all".
- **Levels:** a level ships in its `release` field (default 1). Hallow's End tags its levels with `releaseOf()` in `src/data/worlds/world6.js` (6-1 to 6-16 = 2, 6-17 to 6-20 = 3). `WORLD_LEVELS` in `src/data/worlds/index.js` drops anything above `__RELEASE__`.
- **Features:** gate with a constant comparison, `__RELEASE__ >= N`. The bundler then drops gated data and modules from builds below N.
  - Use the comparison directly in the expression: wrapping it in a function call stops the bundler from dropping the code.
  - Keep gated data out of top-level calls such as `.map()` in modules that might be dropped.
  - Examples today (Release 2): the World 6 book blurb (`lore.js`), the Frenzy song (`audio.js` / `src/data/music_w6.js`), Emergency Pumpkins (`shop.js`, `hud.js` tray), and the fog-free preview map (`render/draw.js`).
  - Release 3: the 6-17 to 6-20 entries themselves (an inline `...(__RELEASE__ >= 3 ? [...] : [])` in `world6.js`, because the runtime release filter alone leaves their names in a Release 2 bundle), the Beige pumpkin (`PTYPES`, `BEIGE`/`RAINBOW` indices, `BUY_PUMPKIN`, `UPGRADE_COST`, lore, face), glue (`src/engine/glue.js`), the Hollow King (`TYPES`, `BOSS_NAMES`, `BOSS_INTRO`, `CHARS`, `src/engine/hollowking.js`, bestiary, book page), the jukebox marks and the extra boss chests.
  - Release 4: the nightmare levels (`nightmare1.js`, `NIGHTMARE_LEVELS`), fire (`src/engine/fire.js`, `render/fire.js`), the new monsters and the Strawlord (`TYPES`, `MNAME`, `MINTRO`, `BOSS_NAMES`, bestiary, `src/engine/nightmare.js`, their `render/chars/` modules), the Grave Gourd (`src/data/gourds.js`, `src/engine/gourd.js`, `render/gourd.js`, the coach script), the fire and gourd intro cards and the nightmare bestiary page. `check_r4_absent` in `tools/nm_check.py` greps the lower bundles for their names.
  - Release 5: the nightmare hollow table (`nightmare2.js`, `NIGHTMARE_LEVELS`), its `WORLDS` entry and its book-page gate text (`nmGateText`). `check_r5_absent` in `tools/nm2_check.py` (and `tools/nm_check.py`) greps the lower bundles for the Release 5 names listed there (`R5_NAMES`).
- **Per-feature switch (Release 6, owner 2026-11-08):** the Magnet pumpkin is gated by `__MAGNET__`, not `__RELEASE__ >= 6`. `vite.config.js` sets it true when the build's release is at least `MAGNET_AT` (6). To ship Magnet ahead of Releases 4 and 5, set `MAGNET_AT` to the release it ships in; nothing else changes, because Magnet reads nothing from Releases 2–5. `VITE_MAGNET_AT` overrides it for the standalone check only (`VITE_RELEASE=2 VITE_MAGNET_AT=2 npx vite build`, then `tools/mag_check.py --expect solo`). Gated places: `PTYPES`, `MAGNET`/`RAINBOW` indices, `MAG_N`/`MAG_ROWS`/`MAG_SLIDE`, `lvStats`/`lvDesc`, `BUY_PUMPKIN`, `UPGRADE_COST`, lore, `LIT_HALO`, the lit face, the horseshoe band, the spark-line effect, the sounds, the pull hook in `combat.js` and the slide in `monsters.js` (`src/engine/magnet.js`).
- **Changes to things already in the stores** (not just new content) need a release tag too. Anything untagged ships with the next store build.

## Checks for every release

Run these after any change:

1. **Playtest build:** `npm run build:playtest`, then `.venv/bin/python tools/w6_check.py --url http://127.0.0.1:4173/ --expect on` and `tools/smoke_test.py`.
2. **Store build:** `npm run build`, then `w6_check.py --expect off` and the smoke test. It must contain nothing from a later release: no World 6 level names, book, song or tool.
3. **Release 2 build:** `VITE_RELEASE=2 npx vite build`, then `w6_check.py --expect r2`: World 6 to 6-16 and nothing from Release 3 (no "Beige", "Hollow King" or "Knights in the Mist" in the bundle).
4. **Before shipping release N:** also build `VITE_RELEASE=N` and check that it contains exactly that release's content. `check_release` verifies that every level in a build has `release` ≤ the build's number. Extend `w6_check.py` with each release's own presence/absence checks.

## The playtest link

- **URL:** https://claude.ai/artifact/U21nQb1ZhnchsmzopWVtYA (the owner's existing playtest artifact). Always update this same URL, so the owner's save carries over (localStorage key `gourdguard.v1`).
- **Build and publish:**
  1. `npm run build:playtest`
  2. `.venv/bin/python tools/bundle_single.py`
  3. Publish `dist/gourd-guard.html` with the Artifact tool, `url` set to the link.
- **If a bot is using `dist/` at the time:** build into another folder (`VITE_RELEASE=all npx vite build --outDir <scratchpad>/dist2`), then `bundle_single.py <out.html> <dist2>`.
- **Publish only when the owner says "deploy".** The owner often asks to deploy while bot runs are still going.
- The playtest page has no ads or purchases (browser placeholders are used). Its save is separate from the app's save.

## Owner's standing rules (unchanged)

- Publish or deploy only when the owner says "deploy".
- Ask before changing a rule the owner set. When something is unclear, propose a default and note it in the doc.
- Commit only your own files. Never commit `monetization.md`, `dump.md`, `questdump.md`, `assets/music/drafts/*` or the deleted `assets/music/menu_upright_calm.mp3`. Stage files by name; never `git commit -a`.
- Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (or whichever model is running).
- Original IP only. Sounds must be CC0 or owner-licensed. The game makes no network requests.
- Write to the owner in plain words. They're not a programmer.

## How World 6 is built (patterns to follow for new content)

- **Levels are data:** `src/data/worlds/world6.js`, schema in `src/data/levels.js`. Every level is hand-designed by the owner.
  - Level fields added for World 6: `opensAfter`, `puddlesLayout`, `shoreFrac`, `frenzy` / `frenzyAt` / `frenzyHp`, `boss2`, `release`.
  - The engine holds no level-specific numbers.
- **Specs and plans** are in `docs/superpowers/specs/` and `docs/superpowers/plans/`. Rules are in `docs/GAME_DESIGN.md` §9 ("Hallow's End").
- **Balance:** `tools/balance_bot.py`, 3 repeats, `--offset 0` and `-1`. The owner tunes from their own play. They use the Paint pumpkin, which the bot doesn't, and the bot can't read chameleon colours or tell the two mummy types apart. Record runs in `GAME_DESIGN.md`.
- **Art:** Toy Plastic, drawn in code and baked. Never paint or use `shadowBlur` per frame.
- **Beige pumpkin** (Release 3): tag it `__RELEASE__ >= 3`, like the Hallow's End levels 6-17 to 6-20.
- **Hollow King** (boss of 6-20, Release 3): design and art in `docs/archive/hollow-king/`.
