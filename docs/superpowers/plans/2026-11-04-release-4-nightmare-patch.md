# Release 4: Nightmare Pumpkin Patch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the world 1 nightmare book with 15 playable nightmare levels plus a "coming soon" N1-16. They bring fire tiles, burning monsters, the Cinder Rooster, the Hayrick, the Corn Husker, the Grave Riser, the Strawlord mini boss and the Grave Gourd. Everything is tagged Release 4.

**Architecture:**
- **Separate numbering.** Nightmare levels get their own global night numbers: `NM_BASE = 1000`, so N1-k is night `1000 + k`, and later nightmare worlds use `1000 + 100·(w−1) + k`. Story numbering (`ALL_LEVELS`, `LEVELS`, `highestOpen`, `save.unlocked`) is untouched, and the existing save maps `save.stars[n]` and `save.quests[n]` simply gain new keys, so no migration is needed.
- **Level data** lives in `src/data/worlds/nightmare1.js`. The level helpers (`levelFor`, `isOpen`, the label) learn the new range.
- **New engine modules:** fire tiles in `src/engine/fire.js`, the gourd in `src/engine/gourd.js`, and the new monsters' behaviour in a new `src/engine/nightmare.js` called from `updateMonster`, so `monsters.js` doesn't grow further.
- **Gating:** every entry point is gated with an inline `__RELEASE__ >= 4`.

**Tech Stack:** Plain JS ES modules, Vite 5, Canvas 2D. Python Playwright checks: a new `tools/nm_check.py`, plus `tools/w6_check.py`, `tools/smoke_test.py` and `tools/balance_bot.py`.

**Spec:** `docs/superpowers/specs/2026-11-04-release-4-nightmare-patch-design.md`

## Global Constraints

- **Release 4 only.** Everything new is gated with `__RELEASE__ >= 4` written inline. The store build (1), `VITE_RELEASE=2` and `VITE_RELEASE=3` contain none of these names: Embers, Grave Gourd, Strawlord, Cinder Rooster, Hayrick, Corn Husker, Grave Riser. Below Release 4 the nightmare page still says "Coming soon".
- **Levels are data.** No level numbers in the engine. New level fields go in the `src/data/levels.js` schema and in `expandLevel`.
- **Shared state.** New shared state lives on `G` (`G.fires`, `G.fmNext`, `G.gourdDue`). The board stays in `grid` and `graves`, written only through the existing setters.
- **Performance.** Bake every flame, glow and gourd sprite. Never call `S.part` or materials, or set `shadowBlur`, per frame. Measure with `check_draw_budget`.
- **Docs.** A rule change updates `docs/GAME_DESIGN.md` in the same commit: a new "Nightmare Pumpkin Patch" section under §9, and monster rows in §7.
- **Commits.** Stage files by name. Never commit `dump.md`, `monetization.md`, `questdump.md` or `assets/music/drafts/*`. Trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Platform rules.** No network requests. The test hook is exposed only with `?test`. Original IP only. Sounds come from the existing bank or are new CC0 sounds listed in `assets/sfx/SOURCES.md`. Touch targets ≥44 px.
- **Deploy** to the playtest link only when the owner says "deploy".
- **Pinned values from the spec:**
  - Fire mark burst = `FRENZY_BURST` (4–6, one every `FRENZY_BURST_GAP` 0.2 s). Burst monsters don't count toward the night.
  - Burning monsters: only Ice kills them; any other kill knocks one down for 4 s and it rises with 1 health.
  - Rooster: crows every 8 s, a 2 s speed burst in its lane ±1; frozen roosters don't crow; leaves fire where it dies.
  - Hayrick: pins the first pumpkin in its column for 4 s, once a night.
  - Corn Husker: the first hit only strips the husk; the bare cob is 30% faster.
  - Grave Riser: 3 health, slow, a grave every 7 s on an empty cell of its own column.
  - Strawlord: flocks 3–5 crows every 6 s. Phase 2 at half health: flocks every 4 s and lights 2 fire tiles per cast. Never walks down. A normal chest on each win.
  - Grave Gourd: Calabash `#e3a43c`, starts in cell (2,3). Hold to destroy, which clears the graves in its 3×3. It comes back on the next sprout tick. Each sprout tick, one slot fills every empty cell in its 3×3.

## Review Focus

1. **Story-only rules firing on nightmare nights.** A nightmare N1-k still has `levelNo` k, so anything keyed on night numbers or level numbers can misfire. Pinned by `check_nm_story_rules` (Task 1). The cases:
   - `levelFor(n − 1)` for N1-1 is `levelFor(1000)`, which doesn't exist: the preview and intro cards crash.
   - The level-10 "next world unlocked" card, the level-10/20 boss chests and the level-20 perk all key on `levelNo`.
   - `g.n === LEVELS` and "Next level" use story numbers.
2. **Bundle leaks into Release 3, Release 2 and store builds.** Pinned by `check_r4_absent` (Task 1, with each task adding its own names).
3. **The gourd treated as a pumpkin colour.** It has `c = GOURD` (−1). Pinned by `check_gourd_edges` (Task 8). The cases:
   - A Rainbow beside it would form a "gourd bunch" in `computeGroups`.
   - Paint would pull it.
   - `boardScore` would pair it with neighbours.
   - Draw and smash code would index `PTYPES[-1]`.
   - On a full patch its respawn would be lost.
4. **Continuing a night.** A continued night must bring back the burning tiles, the fire marks already passed, the gourd's cell (or a pending respawn) and the Strawlord's phase. Pinned by `check_nm_continue` (Tasks 2, 7, 8).
5. **Which comes first along a column.** A monster standing in front of a fire is hit first. Grey does not pierce fire. A White pumpkin that burns doesn't fly back and doesn't count as a miss. Ice puts out the first fire and stops there. Pinned by `check_fire_order` (Task 2).

---

### Task 1: The nightmare track, the book page and the release checks

**Files:**
- Create: `src/data/worlds/nightmare1.js` (15 placeholder levels, ghouls, bats, imps and Mossbacks, `theme:6`, `nightmare:true`; Task 12 replaces the contents)
- Modify:
  - `src/data/worlds/index.js`: `NM_BASE`, `NIGHTMARE_LEVELS`, `nmNight`, `isNightmare`, `prevLevelFor`, `levelFor`, `isOpen`, and a `WORLDS[6]` theme
  - `src/data/levels.js`: `nightmare` flag, `label`
  - `src/ui/screens.js`: `applyNightmare` stamp grid; win and result flow
  - `src/engine/game.js`: nightmare music, `prevLevelFor` everywhere it used `levelFor(n − 1)`
  - `src/engine/combat.js`: level-10/20 boss chests only when `!G.def.nightmare`
  - `src/engine/render/sprites.js`: `custom:'nightmare'` background
  - `src/main.js` test hook: `NM_BASE`, `nmNight`, `NIGHTMARE_LEVELS`
  - `tools/w6_check.py`: add `--expect r3`
- Create: `tools/nm_check.py` (imports `open_page`, `ok`, `FAILS`, `start`, `bundle_js`, `set_stars` from `w6_check`; `--expect on|r3|off`)

**Interfaces:**
- Produces (used by every later task):
  - `NM_BASE = 1000`.
  - `nmNight(w, k) -> number`: `1000 + 100·(w−1) + k`.
  - `isNightmare(n) -> boolean`.
  - `prevLevelFor(n) -> def | null`: `null` for story night 1 and for each nightmare world's level 1.
  - `NIGHTMARE_LEVELS: Array<LevelDef[]>`: `[nightmare1]` when R ≥ 4, else `[]`.
  - `NM_BOOK_LEVELS = 16`.
  - The expanded def has `nightmare: true` and `label: 'N1-k'`.
- Produces: in `nm_check.py`, `R4 = expect == 'on'` and `nm_start(page, k)` (calls `start(page, 1000 + k)`).

- [ ] **Step 1: Write the failing checks.**
  - `check_r4_absent`: `'Embers'` is in the bundle iff R4.
  - `check_nm_track`, R4 only:
    - With `save.stars[20] = 0`, `isOpen(1001)` is false.
    - With `save.stars[20] = 3`, `isOpen(1001)` is true and `isOpen(1002)` is false.
    - `nm_start(page, 1)` gives `G.def.label == 'N1-1'`, `G.def.nightmare`, and `G.world == 6`.
    - `openBook(0)` then a bookmark tap shows 16 `#bkLevels .pg` buttons and hides `#bkSoon`. The 16th button is disabled and its text includes "Coming soon".
  - `check_nm_story_rules`, R4 only:
    - `openPreview(1001)` raises no page error.
    - Winning N1-10 (`endGame(true)` after start) shows no "unlocked!" card, `save.stars[1011]` is unset, the result offers "Next level", and it opens 1011.
    - When not R4: `NIGHTMARE_LEVELS.length == 0`, and the bookmark page still shows `#bkSoon`.
  - `w6_check.py`: `--expect r3` sets `R3 = True`, `on = True`, and `check_release` expects 3.
- [ ] **Step 2: Run, expect FAIL.** `npm run build:playtest && .venv/bin/python tools/nm_check.py --url http://127.0.0.1:4173/ --expect on`: FAIL (no nightmare levels).
- [ ] **Step 3: Implement.**
  - **`isOpen(n)` for nightmare nights:** level 1 needs `save.stars[firstNightOf(w) + WORLD_LEVELS[w−1].length − 1]` (that world's level 20). Any other level needs `save.stars[n − 1]`. An index past the data returns false.
  - **`applyNightmare`:** when `__RELEASE__ >= 4 && NIGHTMARE_LEVELS[wi]`, render the stamps through a helper `renderStamps(levels, startN, padTo)` factored out of `openBook`. Pad to `NM_BOOK_LEVELS` with disabled "Coming soon" stamps.
  - **Result flow:** Continue returns to the book with nightmare mode kept on. "Next level" offers `n + 1` when it exists and is open. Guard the level-10 unlock and the level-20 perk paths with `!def.nightmare`.
  - **Music:** `musicStart('nightmare')` on nightmare nights.
  - **`WORLDS[6]`:** `{ name:'Pumpkin Patch: Nightmare', …palette from docs/archive/nightmare-worlds 'Pumpkin Patch: Nightmare' row, custom:'nightmare', base:0 }`, painted once with the existing nightmare scene code.
- [ ] **Step 4: Run, expect PASS.** The Step 2 command, then `w6_check.py --expect on` to confirm nothing old broke.
- [ ] **Step 5: Run the absent checks on the other builds.**
  - `VITE_RELEASE=3 npx vite build`, then `nm_check.py --expect r3` and `w6_check.py --expect r3`.
  - `VITE_RELEASE=2 npx vite build`, then `w6_check.py --expect r2`.
  - `npm run build`, then both checks `--expect off` and `smoke_test.py`.
  - All pass.
- [ ] **Step 6: Commit.** `nightmare1.js`, `index.js`, `levels.js`, `screens.js`, `game.js`, `combat.js`, `sprites.js`, `main.js`, `nm_check.py`, `w6_check.py`, `GAME_DESIGN.md` (nightmare track paragraph). Message: "Nightmare 1 track: book page, numbering, release checks (Release 4)".

### Task 2: Fire tiles and fire marks

**Files:**
- Create: `src/engine/fire.js`
- Create: `src/engine/render/fire.js` (baked flame loop, hiss puff, flare)
- Modify:
  - `src/data/levels.js`: `fireStart`, `fireLayout`, `fireMarks`
  - `src/data/rules.js`: `FIRE_P_RANGE = [0.25, 0.8]`
  - `src/engine/game.js`: projectile loop, start of night, preview map, `continueState` and `continueNight`
  - `src/engine/spawner.js`: marks, burst, minion flag
  - `src/ui/hud.js`: fire marks on the bar; the bar counts arrivals when `fireMarks` is set
  - `src/engine/render/draw.js`
  - `src/main.js` hook: `lightFire`, `fires`

**Interfaces:**
- Produces:
  - `G.fires: Array<{lane, p, t}>`, with `p` snapped to tile-row centres (`TILE_P()`).
  - `lightFire(lane, p) -> boolean`: false if that tile already burns.
  - `lightRandomFires(n) -> number`: spread across lanes as the spec says; skips tiles under a castle or a boss.
  - `fireAt(lane, p) -> fire | null`.
  - `putOut(f)`.
  - `G.fmNext`: the index of the next mark.
  - `fireMarkPoints(def) -> number[]`.
  - The level field `fireMarks: Array<{at:number, n:number}>`.
  - The spawn flag `G.burstMinion`: monsters spawned during a fire burst get `m.minion = true` and don't count.
  - `G.q.fireOut++` for each fire Ice puts out.

- [ ] **Step 1: Write the failing checks** (R4 only).
  - `check_fire_basic`: on N1-1 with `fireLayout:[[3,0.5]]` (pass a test def through `startGame` overrides, or set `G.fires` directly), launch:
    - a Green in lane 3 with no monsters: the projectile dies before `p < 0.45`, the fire stays, and `G.missed` is unchanged;
    - an Ice: the fire is gone and the projectile is dead, never reaching `p < 0.45`.
  - `check_fire_order`:
    - A ghoul at p 0.7 in front of a fire at 0.5 is hit by a Green, and the fire stays.
    - A Grey burns at the fire, so a ghoul at 0.3 behind it takes no damage.
    - A White that burns doesn't come back (`grid` count unchanged) and doesn't change `G.missed`.
    - A Black that burns does no splash.
  - `check_fire_marks`: a def with `total:20, fireMarks:[{at:0.5,n:3}]`. Spawn up to `G.spawned == 10`, then step the game: `G.fires.length == 3`, between 4 and 6 monsters with `minion == true` appear within 1.5 s, and `G.spawned` stays at 10 until the burst ends.
  - `check_nm_continue` (fire part): with 2 fires and `G.fmNext = 1`, `continueState()` then `continueNight(c)` keeps both fires and `fmNext == 1`.
  - Extend `check_draw_budget` with 20 fires lit: canvas calls per frame are within the existing budget + 20.
- [ ] **Step 2: Run, expect FAIL.** `nm_check.py --expect on --only check_fire_basic`.
- [ ] **Step 3: Implement.**
  - **Interception:** in the projectile loop, after the castle check and before the monster targets, take the first fire `f` in `pr.lane` with `pr.y <= fireY(f) + 20`. Skip it while any hittable monster in that lane has `mY(m) > fireY(f)`. Otherwise, if `pr.type === 2` (Ice) call `putOut(f)`; in every case `pr.dead = true`, `pr.burned = true`, and no on-hit power fires.
  - **Bottom-of-field check:** treat `pr.burned` like a hit, so a White doesn't come back and it isn't counted as a miss.
  - **Fire marks:** `storySpawn` drops each mark when `G.spawned >= floor(total × at)`: light `n` tiles and start a burst of `FRENZY_BURST` monsters at `FRENZY_BURST_GAP`, spawned with `G.burstMinion` set.
  - **Art:** the flame sprite is a looping strip baked once by `render/anim.js` and blitted per tile.
  - **Sounds:** bank sounds `fire` (light), `hiss` or `splash` (put out), and `extra('miss')` pitched down (burn).
- [ ] **Step 4: Run, expect PASS.** Same command, then all of `nm_check.py --expect on` and `w6_check.py --expect on`.
- [ ] **Step 5: Commit.** "Fire tiles and fire marks (Release 4)". Include the `GAME_DESIGN.md` §9 "Fire tiles" rules.

### Task 3: Burning conversion, generalised from the Flaming Mummy

**Files:**
- Modify:
  - `src/data/monsters.js`: `BURNS_TO`, `ICE_ONLY`
  - `src/engine/combat.js:162`: the Ice-only kill rule
  - `src/engine/monsters.js:277`: igniting neighbours; `NO_HEX`
  - `src/engine/fire.js`: walking onto fire
  - `src/engine/game.js:66`: the Ice lock

**Interfaces:**
- Produces:
  - `BURNS_TO = { mummy:'firemummy' }`. Tasks 5 and 6 add `hayrick`, `husker` and `huskerBare`.
  - `ICE_ONLY = new Set(['firemummy'])`. Each Ice-only type's data has `rise: 4`.
  - `burnMonster(m)`: changes `m.type` to `BURNS_TO[m.type]` and keeps its health. It shows "Alight!", plays the `firemummy:ignite` sound and sparks.
  - A burning type ignites ordinary monsters of its own family within one lane and one tile.
- [ ] **Step 1: Write the failing checks.**
  - `check_burn_walk`: a mummy spawned in lane 2 at p 0.4 with a fire at (2, 0.5) is a `firemummy` within 3 s of stepping.
  - `check_ice_only`: a Green hit for 999 on a `firemummy` leaves it down (`rise > 0`) and it rises with 1 health. An Ice hit kills it.
  - `check_ice_lock`: on a level with `fireStart > 0`, the loadout locks Ice.
  - Re-run world 1 checks: the 1-16 Flaming Mummy still behaves exactly as before (`w6_check.py --expect on` and `smoke_test.py`).
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.** Replace the `firemummy` special cases with `ICE_ONLY.has(m.type)` and `BURNS_TO` lookups. Lock Ice when the pool holds any `ICE_ONLY` type, any `BURNS_TO` key, or the level has fire.
- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit.** "Burning monsters: one rule for fire tiles and Flaming Mummies (Release 4)".

### Task 4: The Cinder Rooster

**Files:**
- Create: `src/engine/nightmare.js` (`updateNightmareMonster(m, dt) -> boolean`, true if it handled the type)
- Create: `src/engine/render/chars/nm1.js`. Port the `rooster` entry from `docs/archive/nightmare-monsters/slime-patch/slime_patch.js`; imports become `../paint.js`.
- Modify:
  - `src/data/monsters.js`: `rooster: { hp:2, sp:0.05, r:20, coins:6, eat:0.5, pts:20, drop:1, crowEvery:8, rushT:2, rushMul:1.6 }`, plus `MNAME` and the intro line
  - `src/engine/monsters.js`: call `updateNightmareMonster`; `m.rush` speed
  - `src/engine/combat.js` `kill()`: fire where it dies
  - `src/engine/render/chars/index.js`
  - `src/engine/audio.js`: crow sound from the bank (`'rooster:crow'`, falling back to a synth chirp)

**Interfaces:**
- Consumes: `lightFire` (Task 2).
- Produces:
  - `m.rush` (seconds left). While `m.rush > 0` a monster's speed is ×`rushMul`.
  - Rooster death: `lightFire(m.lane, m.p)`, whatever killed it.
- [ ] **Step 1: Write the failing checks.**
  - `check_rooster`:
    - After 8.5 s, ghouls in lanes 2, 3 and 4 have `rush > 0`; one in lane 6 doesn't.
    - A rooster frozen for its crow time sets no rush.
    - A `damage(r, 99)` kill leaves `fireAt(lane, p)`.
    - `isBaked('rooster')` is true after a night starts.
  - Add `'Cinder Rooster'` to `check_r4_absent`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.** Gate the TYPES, CHARS and MNAME entries with `...(__RELEASE__ >= 4 ? {…} : {})`.
- [ ] **Step 4: Run, expect PASS.** Also look at the strip from `tools/char_sheet.py rooster`.
- [ ] **Step 5: Commit.** "Cinder Rooster (Release 4)". Include the `GAME_DESIGN.md` §7 row.

### Task 5: The Hayrick and the Burning Hayrick

**Files:**
- Modify:
  - `src/engine/render/chars/nm1.js`: `hayrick`, plus `hayrickBurning` drawn with `variant:'burning'`
  - `src/data/monsters.js`: `hayrick: { hp:8, sp:0.03, r:26, coins:10, eat:0.8, pts:30, drop:2, pinT:4 }` and `hayrickBurning` (same, `rise:4`)
  - `src/engine/nightmare.js`: the throw
  - `src/engine/board.js`: `blocked()` and `planMove` treat a pinned cell as a grave; `bestMove` skips it
  - `src/engine/render/draw.js`: the pitchfork over a pinned cell
  - `BURNS_TO.hayrick = 'hayrickBurning'`, and add `hayrickBurning` to `ICE_ONLY`

**Interfaces:**
- Produces:
  - `cell.pinned` (seconds left), counted down in `update`.
  - A pinned pumpkin can still launch with its bunch; it just can't slide or be pushed.
  - The throw picks the lowest-row non-gourd pumpkin in column `m.lane`, once per monster (`m.thrown`), when `m.p > 0.3`.
- [ ] **Step 1: Write the failing checks.**
  - `check_hayrick_pin`: with a pumpkin at (4, 2) and a hayrick in lane 2 at p 0.35, within 3 s `grid[4][2].pinned > 0`. `slideOne` on it returns false. After 4.2 s it slides.
  - With the gourd (Task 8) at (4, 2), the pin goes to the next pumpkin up. Write this assertion now, guarded by `if hasGourd`.
  - Walking onto fire makes `hayrickBurning`, which is Ice-only (reuse the `check_ice_only` helper).
  - Add `'Hayrick'` to `check_r4_absent`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit.** "Hayrick and Burning Hayrick (Release 4)".

### Task 6: The Corn Husker (husk, bare, burning, charred)

**Files:**
- Modify:
  - `src/engine/render/chars/nm1.js`: `husker` with its variants `bare`, `burning` and `burnt`
  - `src/data/monsters.js`:
    - `husker: { hp:3, sp:0.04, r:22, coins:8, eat:0.6, pts:24, drop:1, bareMul:1.3 }`
    - `huskerBare`, `huskerBurning`, `huskerCharred` (`rise:4`)
  - `src/engine/combat.js` `hitMonsterNow`: the husk
  - `BURNS_TO`: `husker → huskerBurning`, `huskerBare → huskerCharred`. `ICE_ONLY` gets `huskerCharred`.

**Interfaces:**
- Produces:
  - The first hit on a `husker` or `huskerBurning` does no damage. It turns `husker` into `huskerBare` and `huskerBurning` into `huskerCharred`, plays the `shed` clip, and multiplies speed by `bareMul`.
  - `huskerBurning` itself is not Ice-only (spec: any pumpkin strips its husk).
- [ ] **Step 1: Write the failing checks.**
  - `check_husker`:
    - One Green hit: the type is `huskerBare`, the health is unchanged, and the speed is ×1.3.
    - A `huskerBurning` hit by a Green becomes `huskerCharred`. A Green kill on the charred cob knocks it down; Ice kills it.
    - A bare cob walking onto fire becomes `huskerCharred`.
  - Add `'Corn Husker'` to `check_r4_absent`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit.** "Corn Husker (Release 4)".

### Task 7: The Strawlord mini boss and its crows

**Files:**
- Modify:
  - `src/engine/render/chars/nm1.js`: port `strawlord` and `crow` from `docs/archive/nightmare-monsters/minibosses-patch-wood/patch_wood.js`. Only the clips in use are baked: `idle`, `flock`, `hit`, `tear`. Scale is capped like the Hollow King's.
  - `src/data/monsters.js`:
    - `strawlord` boss entry: `hp:20`, `form2.hp:30`, `hold:0.12`, `moveEvery:8`, `flockEvery:[6,4]`, `crows:[3,5]`, `fires2:2`, `noItems:true`
    - `crow: { hp:1, sp:0.11, r:14, flying:true, coins:2, eat:0.4, pts:8, drop:0 }`
    - `BOSS_NAMES` and `BOSS_INTRO`
  - `src/engine/nightmare.js`: `updateStrawlord(m, dt)`
  - `src/data/levels.js` and `combat.js`: a new level field `bossChest: 'normal'`, so a boss of that level drops one normal chest whatever its `levelNo`
  - `src/engine/game.js`: `continueState` and `continueNight` keep `m.phase2`

**Interfaces:**
- Consumes: `lightRandomFires` (Task 2).
- Produces:
  - `m.phase2` is set once health ≤ half. Then the `tear` clip plays once, and it never walks past `hold`.
  - The level field `bossForm: 2` starts it already in phase 2 (used by N1-13).
  - It never reaches the wall and is immune to knockback and freeze.
- [ ] **Step 1: Write the failing checks.**
  - `check_strawlord`:
    - On N1-4, the boss arrives. After 6.5 s there are 3–5 `crow`s.
    - Damage it to half: `phase2` is set. After 4.5 s more there are new crows and 2 more `G.fires`.
    - Its `p` never exceeds `hold`.
    - Killing it adds exactly one normal chest.
  - `check_nm_continue` (boss part): a phase 2 Strawlord comes back in phase 2 with its health.
  - Add `'Strawlord'` to `check_r4_absent`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.** Follow the way the Gravekeeper's lane moves work.
- [ ] **Step 4: Run, expect PASS.** Also look at the strip in `char_sheet.py`, and check memory with a check like `check_hk_memory` (the Strawlord's frames under 10 MB).
- [ ] **Step 5: Commit.** "The Strawlord mini boss (Release 4)". Include the `docs/LOOT.md` line for its normal chest.

### Task 8: The Grave Gourd on the patch

**Files:**
- Create: `src/engine/gourd.js`
- Create: `src/engine/render/gourd.js`. Port the Calabash from `docs/archive/gourds/entry.js` `SHAPES` / `gourdSprite(0)`, baked at patch size, with a baked 3×3 glow tile.
- Modify:
  - `src/engine/board.js`:
    - `computeGroups`, `boardScore`, `paintPull`, `bestMove`
    - `smash`: routes to `destroyGourd`
    - `spawnSprouts`: the gourd slot
  - `src/engine/game.js`: start of night, `continueState` and `continueNight`
  - `src/engine/render/draw.js`
  - `src/engine/input.js`: the hold
  - `src/data/levels.js`: `gourd: boolean`, `unlockGourds: string[]`
  - `src/save.js`: `save.gourds = {}`
  - `src/ui/screens.js`: the result screen sets `save.gourds.grave` after a win on a level with `unlockGourds`
  - `src/main.js` hook: `GOURD`, `gourdPos`, `destroyGourd`

**Interfaces:**
- Produces:
  - `GOURD = -1`, `isGourd(cell)`.
  - `newGourd() -> cell`: `{ c:GOURD, gourd:true, … }`, with the same shape as `newCell`.
  - `gourdPos() -> {r,c} | null`.
  - `placeGourdAtStart()`: cell (2,3), or the nearest cell without a grave. It replaces whatever the pattern put there.
  - `destroyGourd(cell)`: clears every grave in its 3×3 through `bustGrave`. Pumpkins are untouched. Sets `G.gourdDue = true`.
  - `gourdFill() -> number`: fills the empty cells of its 3×3 with `randSprout()` and returns how many.
  - Sprout tick when `G.def.gourd`:
    - Slot 1: if `G.gourdDue` and an empty cell exists, place a gourd on a random empty cell and clear `G.gourdDue`. Otherwise, if a gourd is on the patch, `gourdFill()`; if that fills 0, `spawnPumpkin()`.
    - Every other slot: `spawnPumpkin()` as before.
- [ ] **Step 1: Write the failing checks.**
  - `check_gourd_basic`:
    - On a `gourd:true` night, `gourdPos() == {r:2,c:3}`.
    - `slideOne` moves it like a pumpkin.
    - A push line that includes it moves together.
    - It is never in `G.groups`.
  - `check_gourd_edges`:
    - A Rainbow and two Greens next to it: the bunch is only the Greens and the Rainbow.
    - A Paint touching it doesn't pull it.
    - A full patch, then destroy: the next tick puts the gourd in the freed cell.
    - A gourd in a corner fills at most 3 cells.
    - The 3-sprout power gives 1 fill plus 2 elsewhere (count them).
    - A tick whose square is full gives 1 normal pumpkin.
    - Destroying it clears the graves in its square and leaves the pumpkins.
    - The quick-smash power shortens the hold.
  - `check_gourd_unlock`: winning N1-4 sets `save.gourds.grave`.
  - `check_nm_continue` (gourd part): the gourd's cell is kept, and a pending respawn is kept.
  - Add `'Grave Gourd'` to `check_r4_absent`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
  - Guard every `PTYPES[cell.c]` read in `board.js`, `input.js`, `render/draw.js` and `hollowking.js` that a gourd can reach. The draw path blits the gourd sprite instead.
  - **Loadout:** add a `section.loSec` "Gourds" block in `#loScroll` showing the Grave Gourd, picked and locked on `gourd:true` levels. It does not count toward the 5 (or 4) pumpkins.
- [ ] **Step 4: Run, expect PASS.** Also run `smoke_test.py` on phone size.
- [ ] **Step 5: Commit.** "The Grave Gourd (Release 4)". Include `GAME_DESIGN.md` §5/§6 gourd rules, and update `docs/WORLDS.md` §10 and `docs/archive/gourds/README.md` to say the rules changed.

### Task 9: The gourd tutorial on N1-5

**Files:**
- Modify:
  - `src/engine/coach.js`: a second script, `GOURD_STEPS`, run when `G.def.coach === 'gourd'` and `!save.seenGourdCoach`
  - `src/data/levels.js`: `coach`
  - `src/save.js`: `seenGourdCoach`

**Interfaces:**
- Produces the steps, each waiting for the player like the first-night coach:
  1. A hand slides the gourd.
  2. The tip "Every sprout fills the space around your gourd" plays a fill.
  3. The hand holds the gourd until it breaks. The graves around it clear.
  4. The tip "It grows back on the next sprout" waits for the respawn.
  5. "Nice!", then the night carries on.

  Monsters and sprouts wait during steps 1 and 3, as `coachHolds()` does today.
- [ ] **Step 1: Write the failing check.** `check_gourd_coach`: starting N1-5 with `seenGourdCoach` unset gives `coachHolds() == true`. Run the steps through `slideOne` on the gourd and `destroyGourd`, step 2's fill and step 4's respawn by stepping time. After that, `save.seenGourdCoach` is set and monsters spawn.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.** Copy the shape of the existing steps (`tip`, hand drawing, `findMove`).
- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit.** "Gourd tutorial on Nightmare 1-5 (Release 4)".

### Task 10: The Grave Riser (owner checkpoint on the art)

**Files:**
- Modify:
  - `src/engine/render/chars/nm1.js`: a new `graveriser` drawing. A gaunt grave-digger with a lantern and a spade, Toy Plastic, clips `walk`, `dig`, `die`.
  - `src/data/monsters.js`: `graveriser: { hp:3, sp:0.03, r:22, coins:8, eat:0.6, pts:24, drop:1, digEvery:7 }`
  - `src/engine/nightmare.js`: the dig

**Interfaces:**
- Produces: every `digEvery` s while `m.p > 0` it puts a grave on a random cell of column `m.lane` that has no pumpkin, gourd or grave, using `setGraves` or the existing `graves[r][c] = true` path. It plays the `dig` clip. With no free cell it does nothing.
- [ ] **Step 1: Write the failing check.** `check_grave_riser`:
  - An empty column 4 and a riser in lane 4: after 7.5 s exactly one grave in column 4. After it dies the grave stays.
  - With column 4 full, there are no new graves.
  - Add `'Grave Riser'` to `check_r4_absent`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement the behaviour with a stand-in drawing** (the `ghoul` drawing with a spade pose). Mark N1-6, N1-12 and N1-15 `unfinished:true` in the data comment.
- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Draw the real strip.** Run `tools/char_sheet.py graveriser`, publish it as a private artifact, and **ask the owner to approve it**. Swap it in only after approval.
- [ ] **Step 6: Commit.** "Grave Riser (Release 4)". Commit the art separately after approval.

### Task 11: The bot learns fire and the gourd

**Files:**
- Modify:
  - `tools/balance_bot.py`:
    - `BOT_JS`
    - `profile(n)`: for `n > 1000`, the top profile, level 5 and fence 3
    - `--nights` accepts `N1-5` style labels, mapped to `1000 + k`
  - `src/engine/board.js`: `bestLitGroup` gets an optional `avoid(lane) -> boolean`
  - `src/main.js` hook: `fireFirst(lane)`, `bestGourdMove()`

**Interfaces:**
- Produces:
  - `fireFirst(lane) -> boolean`: the next thing a pumpkin would reach in that lane is a fire.
  - `bestGourdMove() -> {dir} | null`: the slide that gives the gourd's square the most empty cells.
  - Bot rules:
    - Never launch a non-Ice bunch with a cell in a `fireFirst` lane.
    - Launch Ice bunches into `fireFirst` lanes first.
    - Destroy the gourd when its square holds 2 or more graves.
    - Once every 5 moves, take `bestGourdMove()` if it gains 2 or more cells.
- [ ] **Step 1: Write the failing check.** In `nm_check.py`, `check_bot_hooks`: with one fire, `fireFirst(3)` is true and `fireFirst(2)` false, and `bestGourdMove()` on a crafted board returns the expected direction.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, expect PASS.** Then `.venv/bin/python tools/balance_bot.py --nights N1-1 --repeats 1 --url …` finishes a night with no errors.
- [ ] **Step 5: Commit.** "Bot: fire and gourd play (Release 4)".

### Task 12: The 15 levels, intro cards, bestiary, quests, balance and docs

**Files:**
- Modify:
  - `src/data/worlds/nightmare1.js`: the real N1-1 to N1-15
  - `src/data/bestiary.js`: the nightmare edition list for world 1
  - `src/ui/screens.js`: the bestiary page in nightmare mode; intro cards for fire, gourd and each new monster through `prevLevelFor`
  - `src/data/lore.js`: unchanged
  - `src/data/quests.js` / `questTable.js`: quests for nightmare nights
  - `docs/GAME_DESIGN.md`: §9 Nightmare Pumpkin Patch, §11 balance
  - `docs/WORLDS.md` §10–§11, `docs/RELEASES.md`, `docs/LOOT.md`, `CLAUDE.md` "Current state"

**Interfaces:**
- Consumes: every earlier task.
- Level table, from spec Part 5. Each level has `name`, a `pool`, fire fields, `gourd` (N1-5 on), and `quests` built from existing quest types.

  | Level | Name | Data notes |
  |---|---|---|
  | N1-1 | Embers | `fireLayout` 3 tiles, `fireMarks:[{at:0.5,n:2}]`, pool ghoul, bat, imp, brute, `intro:['fire']` |
  | N1-2 | Cockcrow | `intro:['rooster']`, `fireMarks:[{at:0.6,n:2}]` |
  | N1-3 | Wrapped in Embers | mummy, firemummy, middle-lane `fireLayout`, `fireMarks` at 0.4 and 0.8 |
  | N1-4 | The Strawlord | `boss:'strawlord'`, `bossChest:'normal'`, `unlockGourds:['grave']`, pool rooster, mummy, ghoul |
  | N1-5 | The Grave Gourd | `gourd:true`, `coach:'gourd'`, heavy `gravesLayout`, pool ghoul |
  | N1-6 | The Grave Riser | `intro:['graveriser']` |
  | N1-7 | Haystack | `intro:['hayrick']`, one mark |
  | N1-8 | Corn Maze | `intro:['husker']`, zigzag `fireLayout` |
  | N1-9 | Harvest Fire | hayrick, husker, mummy, two marks |
  | N1-10 | Dawn Chorus | rooster weight high |
  | N1-11 | The Burning Barn | `fireLayout` covering three whole lanes, three marks |
  | N1-12 | Risen Rows | graveriser plus row `gravesLayout` |
  | N1-13 | Strawlord Returns | `boss:'strawlord'`, `bossForm:2`, `bossChest:'normal'` |
  | N1-14 | Burnt Offerings | pool only `firemummy`, `hayrickBurning`, `huskerBurning` |
  | N1-15 | Eclipse | every new monster, `fireMarks` at 0.33, 0.66 and 1 |

  `spawnGap` and `spawnBurst` are set explicitly on every level, so the story rule `SPAWN_LATE_FROM` doesn't decide nightmare pacing.

- [ ] **Step 1: Write the failing check.** `check_nm_levels`:
  - 15 levels; each has a unique `name` and a non-empty `pool`.
  - Every pool type exists in `TYPES`.
  - N1-4 has `unlockGourds`; N1-5 and later have `gourd`.
  - Every level with fire or Ice-only types locks Ice.
  - `openPreview` on each level raises no page error.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Write the level data and the bestiary and intro wiring.**
- [ ] **Step 4: Run, expect PASS.** Run every check in all four builds (on, r3, r2, off), plus `smoke_test.py` and `check_draw_budget`.
- [ ] **Step 5: Balance.** Run `balance_bot.py --nights N1-1,…,N1-15 --repeats 3` at `--offset 0` and `-1`. Tune each level's `total`, `interval`, `spMul` and fire counts toward the spec targets:
  - N1-1 to N1-3 ≈ 70%
  - N1-4 ≈ 60%
  - N1-5 to N1-12 ≈ 50%
  - N1-13 to N1-15 ≈ 35%
  - Clearly lower at −1.

  Record before and after tables in `GAME_DESIGN.md` §11.
- [ ] **Step 6: Commit.** "Nightmare Pumpkin Patch levels N1-1 to N1-15, bestiary, balance (Release 4)". Include the docs. Don't deploy until the owner says "deploy".

### Task 13: The gourd as its own pick on the picking screen (owner, 2026-11-05)

**Files:**
- Modify: `src/ui/screens.js` (`openLoadout`, `renderGourds`, `renderTeam`, `renderDetail`, `syncLoadout`, `teamSize`), `index.html` (`#ovLoadout` header: a `#loGourdSlot` beside `#loTeam`), `src/style.css` (`#ovLoadout` gourd slot and section), `docs/GAME_DESIGN.md` §5 picker
- Test: `tools/nm_check.py` (`check_gourd_loadout` extended; new `check_gourd_pick_ui`)

**Interfaces:**
- Consumes: `GOURDS` (`src/data/gourds.js`), `gourdIcon(size)`, `openLoadout(avail, next, required, gourds)` (Task 8).
- Produces: `loadoutGourd: string | null` (the picked gourd key), passed to `startGame` the way the Task 8 path passes `['grave']` today; `#loGourdSlot` element.

Design (spec Part 3 "A separate pick in the picker"): title "Pick N pumpkins and 1 gourd" on gourd nights (unchanged otherwise); header shows the Your team row and, apart from it with its own label "Your gourd", one gourd slot with an amber rounded frame; the Gourds section heading reads "Gourd · pick 1"; tapping a gourd tile selects it into the slot and shows its card; with one gourd it starts selected and can't be emptied; Start needs N pumpkins and the gourd. Story nights look exactly as before. Phone width 390 px: the header must fit without scrolling; touch targets ≥44 px.

- [ ] **Step 1: Write the failing checks.** `check_gourd_pick_ui` (R4): on N1-5 the picker title contains "pumpkins and 1 gourd"; `#loGourdSlot` exists, is outside `#loTeam`, holds the Grave Gourd; `#loTeam` has exactly N slots (no gourd inside); the Gourds heading text contains "pick 1"; tapping the gourd tile fills the detail card with the Grave Gourd; tapping the gourd slot does not empty it; Start is enabled with N pumpkins and disabled with N−1. On a story night (night 15) there is no `#loGourdSlot` visible and the title is unchanged. Screenshot the picker at 390×844 into the plan workspace for the owner.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, expect PASS**, then full `nm_check --expect on`, `w6_check --expect on`, `smoke_test`; `check_r4_absent` on r3/off builds.
- [ ] **Step 5: Commit** "Picker: the gourd is its own pick (Release 4)" with the GAME_DESIGN.md picker lines.
