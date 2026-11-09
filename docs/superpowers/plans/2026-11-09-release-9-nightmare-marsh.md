# Release 9: Nightmare Drowned Marsh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nightmare 5-1 to 5-16 on the playtest build. It brings:
- the rising blood tide and whirlpools;
- the Blood Slime, Pirate, Turtle Rider, Storm Eel and Siren;
- the Kraken mini boss;
- the Swan Gourd;
- the Fallen Twin Tides.

**Architecture:** reuse Releases 4, 5, 7 and 8's nightmare track, gourd list, picker, boss patterns, spawn-bar marks and checks; never re-tune them. Release 9 adds:
- `src/engine/tide.js`: the live shore, tide marks, surges, pools swallowed, whirlpools.
- `src/engine/marsh.js`: the new monsters, the Kraken and the Fallen Twin Tides.
- Art: `src/engine/render/tide.js`, `src/engine/render/chars/marsh.js` and `fallentides.js`.
- Level data: `src/data/worlds/nightmare5.js`.

Every new piece is gated by an inline `__RELEASE__ >= 9`.

**Tech Stack:** Plain JavaScript ES modules, Vite, Canvas 2D; Python + Playwright checks against the built bundle (`tools/serve_dist.py`).

**Spec:** `docs/superpowers/specs/2026-11-09-release-9-nightmare-marsh-design.md` (read it whole).

## Global Constraints

- **Where to work:**
  - Only in the worktree `/Users/liongchenglex/AI_Projects/gourd-guard-r9` on branch `r9`. Never touch the main folder (Release 6), `../gourd-guard-r7` or `../gourd-guard-r8`.
  - Serve this worktree's `dist/` on port **4176** (`python3 tools/serve_dist.py 4176`), never 4173, 4174 or 4175.
- **Gating:**
  - Gate every Release 9 piece with `__RELEASE__ >= 9`, written directly in the expression (`docs/RELEASES.md`).
  - Wrap `nightmare5.js` in an inline gate, as `nightmare4.js` is.
  - R2–R8 and store builds carry none of its names or art.
- **Older releases unchanged:** Releases 4, 5, 7 and 8 must play exactly as now. `tools/nm_check.py`, `nm2_check.py`, `nm3_check.py` and `nm4_check.py --expect on` pass after every task.
- **`r9` follows `r8`:** before Tasks 1, 7 and 11, run `git merge r8`, so the owner's Release 8 playtest fixes (nets, Lancer) come in. Resolve shared tables in favour of every release.
- **A beta** (owner): numbers are first guesses from the spec, with no bot balance runs.
- **Perf rule** (CLAUDE.md): never call the Toy Plastic painter or set `shadowBlur` in per-frame code. These are all baked sprites blitted per frame:
  - the tide band and the surge wave;
  - whirlpools, the Swan's black ring, hidden-row spheres and the Pirate's aim line;
  - every bolt, anchor and spear.
- Original IP; no network requests; art ported from `docs/archive/` where it exists.
- **Always test the build:** `npm run build:playtest`, then the checks with `--url http://127.0.0.1:4176/`. Lower builds: `VITE_RELEASE=8 npx vite build` (and 7 … 2), and `npm run build` (store).
- **Rules change → `docs/GAME_DESIGN.md` changes in the same task.** It gets a new §9 section, "Nightmare Drowned Marsh (Release 9)".
- **Shared state and hooks:**
  - Shared state is written only through `src/engine/state.js` setters.
  - Test hooks go only under `?test`, in a Release 9 spread in `src/main.js`.
- Commit per task, staging files by name. Never commit `dump.md`, `monetization.md`, `questdump.md` or `assets/music/drafts/`.

## Review Focus

1. **A continued night** brings everything back with nothing replayed (Tasks 2, 3, 6, 8 and 9 each add a `*_continue` check):
   - how far the tide has risen (marks passed);
   - every whirlpool pair, the blue twin's included;
   - every hidden row and its time left;
   - the Kraken's head health and phase;
   - each Fallen twin's health, quarter marks passed and the twins' down window.
2. **The live shore has one source:**
   - After a surge, every reader of `shoreP()` sees the new line: spawn edge, Diver/Eel/Siren/Kraken/twin surfacing, puddle placement and the level preview.
   - The tide never passes one tile row before the fence and never covers the patch.
   - A pool the tide swallows while a Diver is under it moves that Diver into the tide (Task 2: `check_tide_live_shore`, `check_tide_limits`, `check_tide_swallow_diver`).
3. **The Swan's splash and the kill gates:**
   - It kills a Mummy, Flaming Mummy, Burning Hayrick, Charred Cob, Chameleon and Reverse Chameleon beside the hit, and never hurts the hit monster.
   - A shielded monster refuses it: red net, veil, archers, `rotOnly`.
   - A Black pumpkin from the square gives both splashes (Task 7: `check_swan_gates`, `check_swan_shields`).
4. **Endless slimes:**
   - The cap holds at 12 slimes and blobs, even with many splits at once.
   - A frozen blob does not regrow while frozen *(plan's call: regrow pauses like other clocks)*.
   - The night is not won while any blob stands (Task 4: `check_slime_cap`, `check_slime_win`).
5. **Whirlpool edge cases:**
   - A monster knocked back over an end, a frozen monster on an end and a chewing monster are not taken.
   - The 2 s cooldown stops ping-pong.
   - A same-lane pair works.
   - An end inside a pool the tide swallows keeps working (Task 3: `check_whirl_edges`).

---

### Task 1: The Release 9 track, the blood Marsh map and the check scaffold

**Files:**
- Create: `src/data/worlds/nightmare5.js`: a gated array holding only N5-1, as a plain placeholder night that Task 10 replaces.
- Modify: `src/data/worlds/index.js`:
  - A WORLDS entry "Drowned Marsh: Nightmare" with `custom:'nightmare', scene:'marshN', base:3`. The palette comes from the archive's `marshN` row: blood moon `#ff1a1a` glow, mist `#c04040`.
  - `NIGHTMARE_LEVELS` gains `nightmare5` under `__RELEASE__ >= 9`.
  - `isOpen` for N5-1 needs 5-20 beaten and `save.stars[nmNight(4, 4)]`.
- Modify: `render/nightmare/scenes.js`, adding the `marshN` scene from `docs/archive/nightmare-worlds/entry.js`: blood moon, crimson sea, wreck, tentacles, shark fins, ghost ship, red lighthouse. It is baked once.
- Modify: `src/engine/render/draw.js`, so the sea and shore band on N5 nights are drawn in the blood palette (sea `#5a0a0c` → `#a01818`, foam `#ff8a80`). The blood sea is a baked sprite variant beside the story sea sprite.
- Modify: `src/ui/screens.js`, adding the world 5 bookmark page: 16 N5 stamps. The locked page says "Beat 5-20" / "Beat Nightmare 4-4".
- Modify: `src/main.js`, adding the Release 9 test-hook spread.
- Create: `tools/nm5_check.py`, taking `--expect on|r8|r7|r6|r5|r4|r3|r2|off` and importing `nm4_check.py`'s helpers.
- Modify: `tools/nm4_check.py`, `nm3_check.py`, `nm2_check.py` and `nm_check.py`. Each gains `--expect r8`, which runs its checks as `on` plus `check_r9_absent`.
- Modify: `docs/GAME_DESIGN.md`, adding the new §9 section with the track.

**Interfaces:**
- Produces: `NIGHTMARE_LEVELS[4]` and `nmNight(5, k) = 1400 + k`.
- Produces in `tools/nm5_check.py`:
  - `CHECKS` and `R9_NAMES`;
  - `nm5_start(page, k, coach=False)`;
  - `marsh_page(browser, url)`: a quiet N5 night with test hooks, paused (`setState('pause')`), with sea and puddles.

- [ ] **Step 1:** `git merge r8`; resolve; commit.
- [ ] **Step 2: Write the failing checks** in `tools/nm5_check.py`:
  - `check_r9_absent`: below `on`, the bundle holds none of `R9_NAMES = ['Blood Slime', 'Turtle Rider', 'Storm Eel', 'Siren', 'Kraken', 'Swan Gourd', 'Fallen Twin Tides', 'Whirlpool', 'e4d9bd']`.
  - `check_n5_track`:
    - with only 5-20 beaten, `isOpen(1401)` is false;
    - with 5-20 and N4-4, it is true;
    - with only N4-4, it is false;
    - `levelFor(1401).label == 'N5-1'`, `.nightmare` is set and `.worldNo == 5`;
    - starting N5-1 gives no page error and the `marshN` scene;
    - the sea draws with the blood sprite.
  - `check_n5_book`: the world 5 book's bookmark page shows 16 stamps once both gates are met, and the gate text otherwise.
- [ ] **Step 3:** `npm run build:playtest`, then `nm5_check --expect on`. Expected: FAIL (no track).
- [ ] **Step 4:** Implement the files above.
- [ ] **Step 5:** On the playtest build, `nm5_check`, `nm4_check`, `nm3_check`, `nm2_check` and `nm_check --expect on` all pass. On `VITE_RELEASE=8 npx vite build`, all five pass with `--expect r8`.
- [ ] **Step 6: Commit** "Release 9 track: Nightmare Drowned Marsh book page, blood sea and checks".

### Task 2: The rising blood tide

**Files:**
- Create: `src/engine/tide.js`.
- Create: `src/engine/render/tide.js`: the baked surge wave (a crimson crest strip, 6 frames) and the wave mark icon.
- Modify: `src/engine/game.js`:
  - `shoreP()` returns `G.tide.shore` when `G.tide` is set.
  - Call `updateTide(dt)` in update.
  - Snapshot and continue.
- Modify: `src/ui/hud.js`: `tideMarks()`, following the `brewMarks()` pattern, with class `.tdMark`.
- Modify: `src/data/levels.js`: the field `tideMarks: [{ at, to }]`.
- Modify: `src/engine/monsters.js`: the puddle-swallow move for Divers, Crawlers and Turtles hidden in a swallowed pool.

**Interfaces:**
- Level fields:
  - `tideMarks: [{ at: spawn-bar fraction, to: field fraction }]`, sorted by `at`.
  - The start line is the level's `shore` / `shoreFrac`, as today.
- Rules:
  - `TIDE_STOP = 1 - 1.0 * TILE_P()`: the tide never passes one tile row before the fence.
  - `SURGE_TIME = 0.8` s for the wave to sweep.
- Produces (`tide.js`):
  - `initTide(def)`: sets `G.tide = { shore, marksDone:0 }`, or `null` when the level has no `tideMarks`, so story nights are unchanged.
  - `updateTide(dt)`: when the spawn-bar progress reaches the next mark's `at`, the shore eases to `min(to, TIDE_STOP)` over `SURGE_TIME` and plays the surge.
  - `liveShore() -> number`.
  - `inWater(lane, p) -> boolean`: true for `p <= liveShore()`, or within a pool's radius.
  - `swallowPools()`: removes pools whose `p <= liveShore()` and moves any monster hidden in one into the tide at its lane.
  - `tideSnapshot()` / `restoreTide(s)`.

- [ ] **Step 1: Write the failing checks:**
  - `check_tide_marks`: a night with `tideMarks:[{at:0.3,to:0.4},{at:0.6,to:0.6}]` starts at its shore; at 30% progress the shore moves to 0.4 within 0.8 s; at 60% it moves to 0.6; two marks appear on the spawn bar.
  - `check_tide_live_shore`:
    - after a surge, a newly spawned walker appears at `liveShore() - 0.02`;
    - a Diver set to lurk in the sea surfaces at or above the new shore;
    - `placePuddles` puts pools below it;
    - the level preview draws the start shore.
  - `check_tide_limits`: with `to:0.99` the shore stops at `TIDE_STOP`; the patch is never covered; a monster in the newly covered band keeps walking.
  - `check_tide_swallow_diver`: a pool at p 0.45 with a hidden Diver is swallowed by a surge to 0.5, and the Diver then surfaces from the tide in its lane.
  - `check_tide_continue`: marks passed and the shore survive a continue, and no surge replays.
  - `check_tide_budget`: the surge adds at most 3 `drawImage` and no `fill`/`stroke` per frame.
  - `check_story_shore_unchanged`: on 5-12 (a story shoreline night), `shoreP()` equals today's value throughout.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement. Audit every `shoreP()` caller (`grep -n shoreP src`) and list them in the commit message.
- [ ] **Step 4:** The checks pass, and `nm_check` to `nm4_check --expect on` pass.
- [ ] **Step 5: Commit** "The rising blood tide (Release 9)".

### Task 3: Whirlpools

**Files:**
- Modify: `src/engine/tide.js`, adding whirlpools.
- Modify: `src/engine/render/fx.js`: `whirlSprite(colour)`, baked once per canvas scale per colour and spun by rotating the blit, with a pulsing alpha (the `zoneSprite` pattern).
- Modify: `src/engine/render/draw.js`: draw the pairs under the monsters.
- Modify: `src/engine/monsters.js`: the walk step calls `whirlStep(m, pPrev)` after moving.
- Modify: `src/data/levels.js`: the field `whirlpools: [[{lane, p}, {lane, p}], …]`.

**Interfaces:**
- Rules:
  - `WHIRL_MAX = 4` pairs.
  - `WHIRL_COOL = 2` s.
  - `WHIRL_COLOURS = ['#ff4a4a', '#ffb04a', '#c04aff', '#4affd0']`, one per pair.
- Produces (`tide.js`):
  - `addWhirlPair(a, b) -> boolean`: false when 4 pairs already stand or when either end is not `inWater` now.
  - `whirlStep(m, pPrev)`: if `m` crossed an end's `p` in that end's lane this step, it moves to the other end (`lane`, `x`, `tx`, `p`) and sets `m.whirlCool = WHIRL_COOL`.
  - `whirlSnapshot()` / `restoreWhirls(s)`.
- **Never taken:**
  - `m.boss` (mini bosses included), the Kraken's tentacles, Divers, Storm Eels and the Siren;
  - any monster with `m.whirlCool > 0`, frozen, chewing, rising, hidden or knocked back this step.

- [ ] **Step 1: Write the failing checks:**
  - `check_whirl_move`: a ghoul walking into end A comes out at end B with its health, burn and slow unchanged; a pair in the same lane works.
  - `check_whirl_never`: a boss, a Diver and a frozen ghoul on an end are not taken.
  - `check_whirl_edges`:
    - a monster knocked back over an end is not taken;
    - a monster just out cannot go back for 2 s;
    - an end in a pool the tide swallows still works.
  - `check_whirl_place`: `addWhirlPair` refuses a dry end and refuses a 5th pair.
  - `check_whirl_continue`: the pairs survive a continue.
  - `check_whirl_budget`: 4 pairs add at most 8 `drawImage` and no `fill`/`stroke`.
- [ ] **Step 2–4:** FAIL, implement, pass. Save a frame of 4 pairs to the scratchpad.
- [ ] **Step 5: Commit** "Whirlpools (Release 9)".

### Task 4: The Blood Slime and the Pirate

**Files:**
- Create: `src/engine/marsh.js`, with `initMarshMonster(m)` and `updateMarshMonster(m, dt) -> boolean`. They are called in `monsters.js`' default branch after the Release 8 hook.
- Create: `src/engine/render/chars/marsh.js`. It ports the archive's Blood Splitter Slime and its blob from `docs/archive/nightmare-monsters/slime-patch/slime_patch.js`, and `pirate` from `kraken-pirate/kraken_pirate.js`. Each gets its own key, spread into `CHARS` under `__RELEASE__ >= 9`.
- Modify: `src/engine/combat.js`: the Blood Slime split beside the `slime` split at line 260.
- Modify: `src/engine/render/fx.js`: the Pirate's baked aim line and shot.
- Modify: `src/data/monsters.js`: types, `MNAME` and `MINTRO`.

**Values:**
- `bloodslime: { hp:4, r:23, sp:0.045, coins:8, eat:0.5, pts:24, drop:2, splits:3 }`.
- `bloodblob: { hp:1, r:13, sp:0.065, coins:2, eat:0.3, pts:6, drop:1, regrow:6 }`. A blob swells over `regrow` s, while not frozen, then becomes a full `bloodslime` at its lane and p.
- `SLIME_CAP = 12`: living `bloodslime` plus `bloodblob` together. A split makes `min(3, SLIME_CAP - alive)` blobs.
- `pirate: { hp:4, r:22, sp:0.04, coins:10, eat:0.6, pts:28, drop:2, shots:[1, 2], stopAt:[0.3, 0.6], aim:1 }`:
  - At spawn he picks his number of shots and that many stop points in `stopAt`.
  - At each stop he aims for 1 s, then destroys the pumpkin in his column nearest the top of the patch (row 0 side). A gourd is never shot, and a gourd's square does not protect.
  - If there is no pumpkin, he walks on.
  - The destroyed cell is refilled by sprouts as usual.

- [ ] **Step 1: Write the failing checks:**
  - `check_bloodslime`: a kill makes 3 blobs; after 6 s each is a 4-hp Blood Slime; a blob killed at 3 s is gone.
  - `check_slime_cap`: with 11 alive, a split makes 1 blob; with 12, none; ten simultaneous splits never exceed 12.
  - `check_slime_win`: a night whose spawn total is reached does not end while a blob stands; it ends once it dies.
  - `check_slime_frozen`: a frozen blob's regrow clock stands still.
  - `check_pirate`:
    - he stops at a point in [0.3, 0.6] and shows the aim for 1 s;
    - the top pumpkin in his column is removed;
    - a gourd at the top is skipped for the next pumpkin;
    - an empty column means no shot.
  - `check_slime_budget`: 12 slimes and blobs add no `fill`/`stroke`.
- [ ] **Step 2–4:** FAIL, implement, pass. Save strips via `tools/char_sheet.py` to the scratchpad.
- [ ] **Step 5: Commit** "The Blood Slime and the Pirate (Release 9)".

### Task 5: The Turtle Rider and the Storm Eel

**Files:**
- Modify: `src/engine/marsh.js`.
- Modify: `src/engine/render/chars/marsh.js`. It ports `turtlerider` and its rotten-pumpkin throw sprite from `docs/archive/nightmare-monsters/riders/riders.js`, and `eel` and `bolt` from `storm-eel/storm_eel.js`. **The `leap` clip is not ported** (owner).
- Modify: `src/engine/monsters.js`: the Eel reuses the Diver's surface cycle, with `inWater` targets from Task 2.
- Modify: `src/data/monsters.js`.

**Values:**
- `turtlerider: { hp:10, r:26, sp:0.03, coins:14, eat:0.3, pts:34, drop:3, noKnockback:true, rotEvery:7 }`:
  - It walks backward, shell first, exactly as `turtle` (Grey pierces).
  - Every 7 s it throws a rotten pumpkin. The throw flies 0.7 s, then calls `rotCell(r, c)` on a random pumpkin in its column or a neighbouring one that `rotCell` accepts.
  - On death it spawns an `imp` at its lane and p.
- `eel: { hp:3, r:20, sp:0, coins:10, eat:0, pts:28, drop:2, up:2.5, down:3, charge:0.5, bolt:2, boltSp:0.35 }`:
  - The Diver's cycle, plus a 0.5 s `charge` clip before the shot.
  - The bolt does the Diver's wall damage.
  - After `down` it sinks and rises at a different spot: another pool, or a random lane and p with `inWater(lane, p)`. It never picks the same spot twice in a row.
  - It can be hit only while up.

- [ ] **Step 1: Write the failing checks:**
  - `check_turtlerider`:
    - a rotten pumpkin lands within 7.8 s and the cell is rotten;
    - a Grey pierces it as a Shell Turtle;
    - an Imp appears where it dies.
  - `check_eel`:
    - it charges 0.5 s, then a bolt takes the Diver's damage off its fence;
    - it resurfaces at a new spot in water, never on dry land;
    - after a surge it may surface in the new tide;
    - hits while hidden do nothing.
  - `check_eel_no_leap`: no `leap` clip in the bake.
- [ ] **Step 2–4:** FAIL, implement, pass; strips to the scratchpad.
- [ ] **Step 5: Commit** "The Turtle Rider and the Storm Eel (Release 9)".

### Task 6: The Siren and hidden rows

**Files:**
- Modify: `src/engine/marsh.js`, adding the Siren and `hideRow`.
- Modify: `src/engine/render/chars/marsh.js`. It ports `siren` and `note` from `docs/archive/nightmare-monsters/siren/siren.js` (not `bend`: her song hides rows, it does not bend pumpkins).
- Modify: `src/engine/render/draw.js`:
  - A hidden cell draws a baked red sphere instead of its pumpkin.
  - The warning uses the Witchwood narrow-wind row warning sprite, tinted red.
- Modify: `src/engine/board.js`: the hint arrow never points into a hidden row.
- Modify: `src/data/monsters.js`.

**Interfaces:**
- Produces (`marsh.js`):
  - `hideRow(r, warn = 1.5, dur = 6)`: warns the row, then sets `G.hidden[r] = dur`. A hide on a row already hidden resets it to `dur`.
  - `rowHidden(r) -> boolean`.
  - `hiddenSnapshot()` / `restoreHidden(s)`.
  - The Fallen blood twin (Task 9) calls `hideRow` too.
- `siren: { hp:6, r:24, sp:0, coins:12, eat:0, pts:32, drop:2, back:true, singEvery:12 }`:
  - She surfaces at `liveShore() - 0.03` in her lane and never walks.
  - Every 12 s she sings (`sing` clip, notes drifting down her lane) and calls `hideRow` on a random row not hidden.
  - Never taken by whirlpools.
- Hidden cells bunch, light and launch by their true colour; only the drawing changes.

- [ ] **Step 1: Write the failing checks:**
  - `check_siren`:
    - she sings at 12 s;
    - after 1.5 s of warning a row draws as red spheres for 6 s;
    - she stays at her spot.
  - `check_hidden_play`: three Greens in a hidden row still light and launch as Green; the hint never targets a hidden row.
  - `check_hidden_refresh`: a second hide at 4 s leaves 6 s, not 2.
  - `check_hidden_continue`: hidden rows and their time left survive a continue.
  - `check_hidden_budget`: a hidden row adds at most 7 `drawImage` and no `fill`/`stroke`.
- [ ] **Step 2–4:** FAIL, implement, pass; strip to the scratchpad.
- [ ] **Step 5: Commit** "The Siren (Release 9)".

### Task 7: The Swan Gourd, the five-gourd picker and the N5-5 tutorial

**Files:**
- `git merge r8` first.
- Modify: `src/data/gourds.js`: `swan` under `__RELEASE__ >= 9`, name "Swan Gourd", role "Black-hole splash".
- Modify: `src/engine/gourd.js`:
  - `inSwanSquare(r, c)`.
  - `onSwanBreak(pos)`: fills every empty cell in its 3×3 with a Rainbow, through the sprout path so groups re-resolve.
- Modify: `src/engine/combat.js`:
  - The launched projectile carries `pr.swan = true` when its cell was in a Swan square at launch.
  - On hit, `swanSplash(pr, m, y)` is called beside the Black block (line ~345).
- Modify: `src/engine/render/gourd.js`: the archive's Swan from `docs/archive/gourds/` (cream `#e4d9bd` with green stripes, neck arcing into a little head, toy face) and a cream square glow tile.
- Modify: `src/engine/render/fx.js`: the black-hole ring, `blackRingSprite()`. It is a dark ring with a faint violet rim, baked once, then scaled 0.3 → 1.6 × CS and faded over 0.5 s.
- Modify: `src/engine/coach.js`: `coach:'swan'`.
- Modify: `src/save.js`: `seenSwanCoach`.
- Modify: `src/ui/screens.js`: the picker with five gourds and two slots. It must lay out at 360 px wide with no overflow.

**Interfaces:**
- `SWAN_HIT = -5`: the `lastHit` a black-hole splash sets.
- Kill gates take `|| m.lastHit === SWAN_HIT` in `combat.js`:
  - the colour lock (line ~97);
  - the Reverse Chameleon immune colour;
  - `ICE_ONLY` (line ~209);
  - the Mummy's fire rule (line ~215).
- The shield door, `archersGuard`, `rotOnly` and `m.shield` still refuse it, because they come first in `damage()`.
- `swanSplash(pr, m, y)`:
  - It hurts the monsters Black's splash reach would catch at that level (`SPLASH_ROWS` / reach), excluding `m`.
  - Each takes 1 damage, with `lastHit = SWAN_HIT`.
  - A burning form dies for good; it does not burn into another form.
  - It is pushed as a `G.vfx` `{ kind:'blackring' }`.
- `onSwanBreak(pos)` gives Rainbows only in empty cells. Graves stay.
- Level fields `gourds` / `gourdLock:'swan'` on N5-5, locking slot 2.

- [ ] **Step 1: Write the failing checks:**
  - `check_swan_splash`:
    - a Green from the square hits ghoul A: ghoul B beside it takes 1, A takes only Green's power;
    - a Green from outside the square gives no ring.
  - `check_swan_gates`: from the square, beside the hit, each of these dies to the ring at 1 hp and stays dead: a Mummy, a Flaming Mummy, a Burning Hayrick, a Charred Cob, a Chameleon and a Reverse Chameleon (locked to a colour not launched).
  - `check_swan_shields`: a red-netted Glutton, a veiled monster, a Siege Tower with archers and a `rotOnly` monster beside the hit take nothing.
  - `check_swan_black`: a Black from the square: the neighbour takes Black's splash and 1 more.
  - `check_swan_break`: 4 empty cells in the square become 4 Rainbows, and a grave in the square stays.
  - `check_picker_five_gourds`: five tiles, two slots, no horizontal overflow at 360 px; N5-5 has the Swan locked in slot 2; the N4 picker is unchanged.
  - `check_swan_coach` and `check_swan_unlock` (beating N5-4 gives `save.gourds.swan`).
  - `check_ring_budget`: 10 rings at once add at most 10 `drawImage` and no `fill`/`stroke`.
- [ ] **Step 2–4:** FAIL, implement, pass. Screenshot the picker at phone size and save a Swan strip to the scratchpad.
- [ ] **Step 5: Commit** "The Swan Gourd (Release 9)".

### Task 8: The Kraken (mini boss)

**Files:**
- Modify: `src/engine/marsh.js`: `initKraken`, `updateKraken`, `krakenSnapshot` and `restoreKraken`, called through `bossMood` like `siegeSnapshot`.
- Modify: `src/engine/render/chars/marsh.js`: ports `kraken`, `tentacle` and `anchor` from `docs/archive/nightmare-monsters/kraken-pirate/kraken_pirate.js`, with `maxK` capped to keep the bake ≤ 12 MB.
- Modify: `src/engine/monsters.js`: the boss dispatch beside the Siege Tower's.
- Modify: `src/data/monsters.js`.
- Modify: `src/engine/audio.js`.

**Values:**
- `kraken: { boss:true, hp:20, r:34, sp:0, coins:40, eat:0, pts:300, drop:6, upFor:8, tentacles:3, regrow:6, noItems:true, form2:{ hp:32, tentacles:5 } }`.
- `tentacle: { hp:3, r:20, sp:0, coins:3, eat:0, pts:8, drop:0, anchorEvery:6, anchorDmg: 1.5 × TYPES.diver.bolt }`.
- **The cycle:**
  - The head starts down. It spawns `tentacles` tentacles at distinct random `inWater` spots, as minions not counted in the night's total.
  - Each downed tentacle respawns on its own 6 s clock while the head is down.
  - When every tentacle is down at once, the head rises at a random spot in the tide and can be hit for `upFor` s.
  - Then the head dives and a fresh full set rises.
  - The head's health carries over. It never moves toward the wall, it is immune to knockback and freeze, and whirlpools never take it.
- A tentacle throws an anchor down its lane every 6 s, for `anchorDmg` wall damage. The anchor is held while its fence is down, as the Diver's bolt is.
- Beating N5-4 unlocks the Swan. `bossChest:'normal'`.

- [ ] **Step 1: Write the failing checks:**
  - `check_kraken`:
    - 3 tentacles rise;
    - hits on the down head do nothing;
    - killing 2 of 3 and waiting 6 s brings one back;
    - killing all 3 within 6 s raises the head;
    - the head takes damage for 8 s, then dives and 3 new tentacles rise with its health kept;
    - an anchor takes 1.5× a Diver bolt;
    - one normal chest.
  - `check_kraken_form2`: 32 hp, 5 tentacles.
  - `check_kraken_continue`: head health and phase survive; tentacles come back fresh.
  - `check_kraken_baked`: under 12 MB at bake scale 2.5.
- [ ] **Step 2–4:** FAIL, implement, pass; strip to the scratchpad.
- [ ] **Step 5: Commit** "The Kraken (Release 9)".

### Task 9: The Fallen Twin Tides (N5-16)

**Files:**
- Modify: `src/engine/marsh.js`: `initFallenTides`, `updateFallenTides`, `tidesSnapshot` and `restoreTides`.
- Create: `src/engine/render/chars/fallentides.js`: a port of `docs/archive/fallen-bosses/twintides/fallen_twintides.js`, with its own keys `fallentides-blood` and `fallentides-blue` (the `twin` carried in the atlas key, per the archive caveat) and `maxK` capped under 12 MB.
- Modify: `src/engine/render/fx.js`: the baked water spear and its column warning (pattern: the Fallen Count's `countWarnSprite` / `countBoltSprite`), plus the blood bolt and the water bolt.
- Modify: `src/engine/combat.js`: the twins' down window beside the story `twintides` block at line ~189.
- Modify: `src/data/monsters.js`.
- Modify: `src/engine/audio.js`.

**Values:**
- `fallentides: { boss:true, hp:30, r:34, sp:0.03, coins:50, eat:0, pts:400, drop:6, hold:0.12, window:12, diveAt:[0.75, 0.5, 0.25], boltEvery:6, boltDmg:3, songEvery:14, auraHeal:1, spearEvery:12, spearWarn:1.5, whirlEvery:16, summonEvery:15, summonPool:['bloodslime', 'pirate', 'eel'], noItems:true }`.
- **Both twins:**
  - Two monsters in distinct lanes, `twin` `'blood'` and `'blue'`.
  - Each holds in the tide at `min(hold, liveShore())`.
  - At each `diveAt` mark of its own health it dives and rises at a random `inWater` spot in another lane.
- **Killed together:**
  - When one falls, it is down and untargetable for `window` s.
  - If the other falls inside that window, both die. Otherwise the first rises at full health, and the rule starts over the next time one falls.
- **Blood twin:**
  - A blood bolt at its fence every 6 s.
  - Every 14 s it sings: eyes red, `skill` clip, `hideRow(...)`.
  - A 3×3 aura (its lane ±1, ±1.5 tiles): +1 hp, up to max, for each monster that spawns in it or enters it, whirlpool arrivals and its own summons included.
- **Blue twin:**
  - A water bolt every 6 s.
  - Every 12 s a random patch column flashes for 1.5 s, then every pumpkin in it except gourds is removed (the Fallen Count's bolt, without the net exception); sprouts refill it.
  - Every 16 s, eyes blue: `addWhirlPair` with two random `inWater` ends.
- **Summons:** every 15 s, one from `summonPool`, as an extra.
- `bossChest:'normal'`.

- [ ] **Step 1: Write the failing checks:**
  - `check_fallen_tides`: each ability on a forced timer; both twins hold in the tide.
  - `check_ft_window`:
    - killing blood, then blue at 11 s, ends the fight;
    - killing blood, then waiting 12.5 s, brings blood back at 30 hp;
    - the rule repeats.
  - `check_ft_dive`: at 75% a twin dives and rises in another lane, in water.
  - `check_ft_aura`: three ghouls entering the aura heal the blood twin 3; a whirlpool arrival in it counts.
  - `check_ft_spear`: a column is cleared after a 1.5 s warning and its gourd survives.
  - `check_ft_whirl`: a pair opens at 16 s, never a 5th.
  - `check_fallen_tides_continue`: health, marks, window and whirlpools survive.
  - `check_fallen_tides_baked`.
- [ ] **Step 2–4:** FAIL, implement, pass; strip to the scratchpad.
- [ ] **Step 5: Commit** "The Fallen Twin Tides (Release 9)".

### Task 10: Levels N5-1 to N5-16, intro cards, bestiary, previews and docs

**Files:**
- `src/data/worlds/nightmare5.js`.
- `src/data/bestiary.js`: entries and `FALLEN[4] = { key:'fallentides' }`.
- `src/data/monsters.js`: `ALSO_BAKE` for the Kraken's tentacles and anchor and the twins' summons.
- `src/ui/screens.js`: intro cards "The blood tide" and "Whirlpools" on N5-1, and "The Swan Gourd" on N5-5.
- `docs/GAME_DESIGN.md`, `docs/WORLDS.md`, `docs/LOOT.md`, `docs/RELEASES.md` (row 9 "Built"; add the missing rows 6–8 if still absent) and `CLAUDE.md`.

**Values:**
- Names and themes from spec Part 6.
- Every N5 night has `sea:true`, `shore`, `puddles` and `tideMarks`:
  - N5-1 to N5-10 reach at most 0.5;
  - N5-11, N5-12, N5-14 and N5-15 reach 0.6–0.7;
  - N5-14 has 4 whirlpool pairs and N5-12 has 3.
- Gourds:
  - `gourd:true` with `gourds:['grave', 'protector', 'wartling', 'crookneck']` on N5-1 to N5-4;
  - from N5-5, `'swan'` is added (`gourdLock:'swan'` and `coach:'swan'` on N5-5).
- Bosses: N5-4 and N5-13 have `boss:'kraken'` (N5-13 with `bossForm:2`); N5-16 has `boss:'fallentides'`; all have `bossChest:'normal'`.
- Mummies and Flaming Mummies are in N5-5's pool; Chameleons and Reverse Chameleons in N5-10's.
- Story Marsh monsters (`crawler`, `sailor`, `diver`, `slime`, `turtle`) are mixed in.
- Pumpkins are named by key. Every level sets `spawnGap` and `spawnBurst`, and has three quests from existing quest types.
- Music: the regular nightmare track.

- [ ] **Step 1: Write the failing checks:**
  - `check_n5_levels`:
    - 16 levels with the spec's names;
    - every pool type is in `TYPES`;
    - intros sit where each new monster first walks in;
    - every preview opens without a page error;
    - bosses and chests are as above;
    - every `tideMarks.to` is at most `TIDE_STOP`, and every whirlpool end is in water at level start.
  - `check_n5_intros`, `check_n5_bestiary` (the Fallen Twin Tides last) and `check_n5_prebake`.
- [ ] **Step 2–4:** FAIL, implement, pass.
- [ ] **Step 5: Commit** "Nightmare Drowned Marsh levels N5-1 to N5-16 (Release 9)".

### Task 11: The release matrix and the merge readiness check

- [ ] **Step 1:** `git merge r8`. On the playtest build, run `nm5_check`, `nm4_check`, `nm3_check`, `nm2_check`, `nm_check`, `w6_check --expect on` and `smoke_test`.
- [ ] **Step 2:** Build `VITE_RELEASE=8`, `7`, `6`, `5`, `4`, `3`, `2` and the store build, and run each check with its matching `--expect`. `w6_check` gains `r8` (run as `on`, expecting release 8).
- [ ] **Step 3:** Fix anything that fails in the task that owns it; commit.
- [ ] **Step 4:** Build a single-file playtest (`tools/bundle_single.py`) and publish it as a **separate** private artifact for R9, titled "Gourd Guard R9 Marsh". Use neither the shared playtest URL nor R8's, until the releases are merged into `dev` with the owner's agreement.
