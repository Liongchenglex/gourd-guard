# Release 5: Nightmare Foggy Hollow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nightmare 2-1 to 2-16 on the playtest build: poison fog and rotten pumpkins, five new monsters, the Lamplighter, the Protector Gourd with a two-gourd picker, and the Fallen Poltergeist.

**Architecture:** Release 4's nightmare track, gourd, picker and boss patterns are generalised (never re-tuned), then Release 5 adds new modules: `src/engine/rot.js` (rotten pumpkins and hit rules), `src/engine/poison.js` (patch fog), `src/engine/hollow.js` (the new monsters and both bosses), with level data in `src/data/worlds/nightmare2.js`. Every new piece is gated by an inline `__RELEASE__ >= 5` so lower bundles drop it.

**Tech Stack:** Plain JavaScript ES modules, Vite, Canvas 2D; Python + Playwright checks against the built bundle (`tools/serve_dist.py` on http://127.0.0.1:4173/).

**Spec:** `docs/superpowers/specs/2026-11-05-release-5-nightmare-hollow-design.md` (read it whole; "Calls settled after the builder check" overrides anything vaguer above it).

## Global Constraints

- Gate every Release 5 piece with `__RELEASE__ >= 5` written directly in the expression (`docs/RELEASES.md`); level data wrapped in an inline gate as `nightmare1.js` is. The store build (1), R2, R3 and R4 builds carry none of its names or art.
- Release 4 must play exactly as it does now: `tools/nm_check.py --expect on` passes after every task.
- Release 5 is a beta (owner): numbers are first guesses; no bot balance runs.
- Perf rule (CLAUDE.md): never call the Toy Plastic painter or set `shadowBlur` in per-frame code; fog lines, zones, mood glows, the rotten pumpkin and the worm are baked sprites blitted per frame.
- Original IP; no network requests; art drawn in code, ported from `docs/archive/` where it exists.
- Always test the build: `npm run build:playtest`, `tools/serve_dist.py`, then the checks. Lower builds: `VITE_RELEASE=4 npx vite build` (and 3, 2), `npm run build` (store).
- Rules change → `docs/GAME_DESIGN.md` changes in the same task (a new §9 section "Nightmare Foggy Hollow (Release 5)").
- Shared state is written only through `src/engine/state.js` setters; test hooks only under `?test`, added to the Release 5 spread in `src/main.js`.
- Commit per task with the attribution lines from the session; never commit the owner's `dump.md`, `monetization.md`, `questdump.md` or `assets/music/drafts/`.

## Review Focus

1. **A continued night** must bring back rotten cells, both gourds (and which is due back), the poison clock, the Lamplighter's mood and the Fallen Poltergeist's spent phases, with nothing replayed (owned by Tasks 3, 4, 8, 9: each adds a `*_continue` check).
2. **A gourd that is due back has no square**: its cells are unprotected until it returns, and a returning gourd replaces whatever stands on its cell, rotten or not (Task 2 check `check_protector_due`).
3. **Rotten next to Rainbow and Paint**: a Rainbow never joins a rotten bunch and Paint never pulls a rotten pumpkin (Task 3 check `check_rot_bunch`).
4. **Both start cells covered by graves or the patch full**: two gourds still go on the nearest free cells and never on the same cell (Task 2 check `check_two_gourds_start`).
5. **Rot reaching a moving cell**: a pumpkin sliding or flying in (`cell.fly > 0`) is not rotted mid-move; it rots when it lands in a fogged cell (Task 4 check `check_poison_landing`).

---

### Task 1: The Release 5 track, the book page and the check scaffold

**Files:**
- Create: `src/data/worlds/nightmare2.js` (gated array; this task holds N2-1 only, a plain placeholder night that Task 10 replaces)
- Modify: `src/data/worlds/index.js` (WORLDS entry "Foggy Hollow: Nightmare" with `custom:'nightmare', scene:` the hollow key of `render/nightmare/scenes.js` THEMES, `base:1`; `NIGHTMARE_LEVELS` gains `nightmare2` under `__RELEASE__ >= 5`; `isOpen` for N2-1 also needs `save.stars[nmNight(1, 4)]`)
- Modify: `src/ui/screens.js` (the world 2 bookmark page shows N2 stamps; a locked page says what is missing: "Beat 2-20" / "Beat Nightmare 1-4")
- Modify: `src/main.js` (Release 5 test-hook spread, empty for now)
- Create: `tools/nm2_check.py` (`--expect on|r4|r3|r2|off`, built like `tools/nm_check.py`, importing its helpers from `w6_check.py`)
- Modify: `tools/nm_check.py` (`--expect r4`: Release 4 checks run as `on`, and `check_r5_absent` greps the bundle)
- Modify: `docs/RELEASES.md` (row 5), `docs/GAME_DESIGN.md` (new §9 section with the track)

**Interfaces:**
- Produces: `NIGHTMARE_LEVELS[1]`, `nmNight(2, k) = 1100 + k`, the WORLDS index of the hollow nightmare theme (used by `nightmare2.js` as `theme`); `tools/nm2_check.py` with `CHECKS` dict, `R5` global, `nm2_start(page, k, coach=False)`.

- [ ] **Step 1: Write the failing checks** in `tools/nm2_check.py`:
  - `check_r5_absent`: below `on`, the bundle (`bundle_js()`) holds none of `'Rot Mist'`, `'Protector Gourd'`, `'Lamplighter'`, `'Fallen Poltergeist'`, `'Poltergeist 2'`, `'Plague Doctor 2'`, `'Wisp Rider 2'`, `'Fogwalker 2'`, `'Reaper'`, `'Poison fog'`.
  - `check_n2_track`: with `{40: 3}` only, `isOpen(1101)` is false; with `{40: 3, 1004: 3}` it is true; with `{1004: 3}` only it is false; `levelFor(1101).label == 'N2-1'`, `.nightmare` true, `.world == 2`; starting N2-1 gives no page error.
  - `check_n2_book`: the world 2 book's bookmark page shows 16 stamps once both gates are met.
- [ ] **Step 2:** `npm run build:playtest`, run `.venv/bin/python tools/nm2_check.py --url http://127.0.0.1:4173/ --expect on`. Expected: FAIL (no track).
- [ ] **Step 3:** Implement the files above.
- [ ] **Step 4:** Playtest build: `nm2_check --expect on` and `nm_check --expect on` pass. `VITE_RELEASE=4 npx vite build`: `nm2_check --expect r4` and `nm_check --expect r4` pass.
- [ ] **Step 5: Commit** "Release 5 track: Nightmare Foggy Hollow book page and checks".

### Task 2: Gourds as a list, and the Protector Gourd

**Files:**
- Modify: `src/engine/gourd.js` (from one gourd to a list), `src/data/gourds.js` (`protector` entry under `__RELEASE__ >= 5`), `src/engine/board.js`, `src/engine/game.js` (start, snapshot, continue), `src/engine/coach.js` (Grave script keeps working), `src/engine/nightmare.js` (`crowTarget` uses `isProtected`), `src/engine/combat.js` (launch powers)
- Create: `src/engine/render/gourd.js` additions: the Protector's baked art (pale-gold ribbed gourd, ward glow), shown to the owner as a strip in the scratchpad before Task 10
- Test: `tools/nm2_check.py`

**Interfaces:**
- Produces (gourd.js):
  - a gourd cell: `{ c:GOURD, gourd:kind }` with `kind` `'grave'` or `'protector'` (`isGourd(cell)` unchanged; `gourdKind(cell) -> string|null`)
  - `G.gourdKinds: string[]` (the night's picked kinds, in slot order), `G.gourdDue: { [kind]: boolean }`
  - `gourdsOn() -> {kind, r, c, cell}[]`, `gourdPos(kind = 'grave') -> {r,c}|null` (Release 4 callers keep working)
  - `isProtected(r, c) -> boolean`: inside the 3×3 (centre included) of a standing Protector Gourd
  - `placeGourdsAtStart(kinds)`: one kind → centre (2, 3); two → Grave at (2, 1), Protector at (2, 5); nearest cell without a grave, never the same cell
  - `destroyGourd(cell)` dispatches by kind (Grave: clear graves, as now; Protector: `onProtectorBreak(pos)`, a hook Task 3 fills, then due back)
  - `gourdSnapshot() -> {kind, at, due}[]`, `restoreGourd(list)`; Release 4 single-gourd snapshots (object, not array) still restore
- Produces (game.js): `startGame(mode, n, loadout, gourds)`: `gourds` (kinds, slot order) becomes `G.gourdKinds`; omitted on a `gourd:true` night it is `['grave']` (Release 4 unchanged). `placeGourdsAtStart(G.gourdKinds)` runs where `placeGourdAtStart()` ran.
- Produces (combat.js): a projectile launched from a cell with `isProtected(r, c)` carries `pr.ward = true`: its first monster hit forces the knockback roll (bosses and `noKnockback` stay immune); at launch it heals its column's fence by `PROTECT_HEAL` 1 (`src/data/rules.js`), never above full.
- `GOURDS.protector = { key:'protector', name:'Protector Gourd', role:'Shields its square', power:…, lore:… }` (copy written by the implementer from spec Part 6).

- [ ] **Step 1: Write the failing checks**:
  - `check_gourd_list_r4`: on N1-5, `gourdsOn()` returns exactly one `grave` at (2, 3) and every Release 4 gourd check still passes (`nm_check --expect on`).
  - `check_two_gourds_start`: start N2-1 with `G.gourdKinds = ['grave', 'protector']` (via `startGame('story', 1101, lo, ['grave','protector'])`): Grave at (2, 1), Protector at (2, 5). With graves on (2, 1) and (2, 5): both on the nearest free cells, different cells. On a full patch: both placed (they replace pumpkins).
  - `check_protector_protects`: a crow at the fence never takes a pumpkin in the Protector's 3×3; `isProtected(2, 5)` and `(1, 4)` true, `(2, 3)` false.
  - `check_protector_launch`: a pumpkin launched from (1, 5) heals fence 5 by 1 (from 10 to 11 of 23) and its hit on a 5000-hp ghoul always knocks back (20 of 20 at level 1, where `KB_CHANCE` is 0); a boss hit by it is not knocked back.
  - `check_protector_due`: break the Protector by `destroyGourd`: `isProtected` false for its old square until the next sprout tick, then true again around its new cell.
  - `check_gourd_continue2`: continue a night with both gourds (one due back): both kinds come back the same way.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement. Every `__RELEASE__ >= 4` gourd caller that assumed one gourd moves to the list; the Grave Gourd's sprout slot stays the first slot of each tick.
- [ ] **Step 4:** `nm2_check --expect on` and `nm_check --expect on` pass. Render the Protector strip with `VITE_RELEASE=all .venv/bin/python tools/char_sheet.py` or a one-off scratch page, save to the scratchpad.
- [ ] **Step 5: Commit** "Gourds as a list; the Protector Gourd (Release 5)".

### Task 3: Rotten pumpkins

**Files:**
- Create: `src/engine/rot.js`, `src/engine/render/rot.js` (the archive's `rotten()` from `docs/archive/nightmare-monsters/riders/riders.js`, plus a worm curling out of a hole in its side, baked per canvas scale; the lit-bunch version with a sickly green glow)
- Modify: `src/engine/board.js` (bunching), `src/engine/combat.js` (hits), `src/engine/render/draw.js` (patch and flight drawing), `src/engine/game.js` (snapshot), `src/data/rules.js`, `src/engine/gourd.js` (`onProtectorBreak` turns rotten cells in the square into `RAINBOW`)

**Interfaces:**
- Produces (rot.js): `ROTTEN = -2` (a colour index outside `PTYPES`, like `GOURD`); `isRotten(cell)`; `rotCell(r, c) -> boolean` (false for an empty cell, a gourd, a moving cell (`fly > 0`), an already rotten cell, or `isProtected(r, c)`; otherwise sets `c = ROTTEN`, clears `lit`, a green puff); `hitRule(m, rotten) -> 'hurt'|'heal'|'blocked'`.
- `hitRule`: a monster flagged `m.rotOnly` (set each frame by Task 6's doctor zone, Task 8's rot mood, Task 9's reaper phase or black-fog zone) → rotten `'hurt'`, normal `'blocked'`; a monster flagged `m.cleanOnly` (the Lamplighter's clean mood) → rotten `'blocked'`, normal `'hurt'`; otherwise rotten `'heal'`, normal `'hurt'`.
- Rules (`rules.js`): `ROT_DMG = 1.5`, `ROT_HEAL = 0.5`. A rotten hit: `'hurt'` → damage `ROT_DMG`, no on-hit power, no knockback; `'heal'` → `m.hp = min(m.maxHp, m.hp + ROT_HEAL)`, a green "+" float; `'blocked'` → a grey puff, nothing else. A normal pumpkin on `'blocked'` is used up there, does nothing, and area powers (splash, lightning, burn, mines, tools) skip `rotOnly` monsters.
- Bunching: rotten bunches with rotten only; Rainbow never joins it; Paint never pulls it; `bestMove` and the hint treat it as a colour.

- [ ] **Step 1: Write the failing checks**:
  - `check_rot_cell`: `rotCell` on a pumpkin → `c == -2`; on a gourd, an empty cell, a `fly` cell and a protected cell → false and unchanged.
  - `check_rot_bunch`: three rotten in a row light up as one bunch; a Rainbow touching them stays out; a Paint bunch beside them does not pull them.
  - `check_rot_hit`: a launched rotten pumpkin on a ghoul at 2/3 health → 2.5/3, no knockback; at full health stays at full; on a monster with `rotOnly` → −1.5; a normal pumpkin on a `rotOnly` monster → no damage, used up; on a `cleanOnly` monster rotten → no change.
  - `check_rot_area`: a level-5 Black splash and a Deep Blue chain leave a `rotOnly` monster untouched while hurting a control ghoul beside it.
  - `check_protector_break_rainbow`: two rotten cells in the Protector's square and one outside; breaking it turns the two into Rainbows and leaves the third rotten.
  - `check_rot_continue`: rotten cells survive `continueState` / `continueNight`.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement. Every `PTYPES[cell.c]` / `PTYPES[pr.type]` read on a path a rotten cell or flight can reach is guarded (grep them; the gourd's `GOURD` guards are the pattern).
- [ ] **Step 4:** Checks pass; `nm_check --expect on` passes.
- [ ] **Step 5: Commit** "Rotten pumpkins (Release 5)".

### Task 4: Poison fog on the patch

**Files:**
- Create: `src/engine/poison.js`, `src/engine/render/poison.js` (baked fog line sprite, row and column; green warning arrows like the wind's)
- Modify: `src/data/levels.js` (schema field `poison`), `src/engine/game.js` (update, snapshot), `src/engine/render/draw.js`

**Interfaces:**
- Level field `poison: { every:number, lines:[min, max], dirs:('row'|'col')[], dur:number }`.
- Produces: `updatePoison(dt)`; state `G.poison = { t, warn:null|{dir, idx[]}, on:null|{dir, idx[], t} }`; `poisonNow(lines?)` (used by the Lamplighter in Task 8: lights a line set at once, with the 1.5 s warning); `fogged(r, c) -> boolean`.
- Timing: warning `POISON_WARN = 1.5` s (rules.js), then `dur` s of fog; at settle every cell under it goes through `rotCell`; while it lasts a pumpkin that lands (slide end, sprout, drop) in a fogged cell is rotted.

- [ ] **Step 1: Write the failing checks**:
  - `check_poison_cycle`: `poison:{every:4, lines:[1,1], dirs:['row'], dur:3}` on a quiet night: arrows show at 2.5 s, fog at 4 s covering one row, gone by 7 s; every pumpkin in that row is rotten, others not.
  - `check_poison_protect`: a row through the Protector's square rots everything but the cells inside it and the gourds.
  - `check_poison_landing`: a pumpkin sliding into a fogged cell is not rotten mid-slide and is rotten once it lands; one sprouting into a fogged cell is rotten.
  - `check_poison_continue`: `G.poison.t` survives a continue; a fog that was on at the loss is not on after it.
  - `check_poison_budget`: with a fog line and its arrows on screen, the frame adds at most 4 canvas `drawImage` calls and no `fill`/`stroke` (pattern: `check_fire_budget` in `nm_check.py`).
- [ ] **Step 2–4:** FAIL, implement, pass (and `nm_check --expect on`).
- [ ] **Step 5: Commit** "Poison fog on the patch (Release 5)".

### Task 5: The picker's second gourd slot and the N2-5 tutorial

**Files:**
- Modify: `src/ui/screens.js` (`renderGourds`, `renderGourdSlot`, `syncLoadout`, `#bLoGo`), `src/style.css`, `index.html` if the header needs it, `src/engine/game.js` (the story start path passes the picked kinds to Task 2's `startGame(mode, n, loadout, gourds)`), `src/engine/coach.js` (a `'protector'` script), `src/save.js` (`save.seenProtectorCoach`)

**Interfaces:**
- Picker state `loadoutGourdSel: string[]` (max `GOURD_SLOTS = 2`; `ALLOW_SAME_GOURD = false` in `src/data/gourds.js`, the one-line rule the owner may flip). Header: "Your gourds" with two slots; the Gourds section heading "Gourds · pick up to 2". Tapping a tile toggles it; a tapped slot empties it; with both unlocked both start picked. Start is never blocked by an empty gourd slot. Release 4 nights (one gourd unlocked) look and behave as now.
- `#bLoGo` calls `next(lo, loadoutGourdSel.slice())`; `startGame` places `G.gourdKinds` (Task 2's `placeGourdsAtStart`).
- Coach `'protector'` on N2-5 (`coach:'protector'`): modelled on the Grave script: a clear patch with both gourds; the fog warning shows on a row through the Protector's square; the tip explains it shields the square; the fog rots the rest; the hand shows holding the Protector; breaking it turns the rotten pumpkins in its square into Rainbows; then the night carries on. Waits for each shown step (the Release 4 fix pattern).

- [ ] **Step 1: Write the failing checks**: `check_picker_two_gourds` (both tiles, two slots, toggling, Start with 0, 1 or 2 gourds, the right kinds reach `G.gourdKinds`), `check_picker_r4_same` (N1-5 picker unchanged: one slot, "Your gourd", locked), `check_protector_coach` (the script runs its steps in order and ends with the night running; `seenProtectorCoach` set).
- [ ] **Step 2–4:** FAIL, implement, pass; screenshot the picker at phone size to the scratchpad for the owner.
- [ ] **Step 5: Commit** "Picker: two gourd slots; Protector Gourd tutorial (Release 5)".

### Task 6: Plague Doctor 2 and the Reaper

**Files:**
- Create: `src/engine/hollow.js` (Release 5 monster behaviour; `updateHollowMonster(m, dt) -> boolean`, called from `monsters.js`' default branch after `updateNightmareMonster`), `src/engine/render/chars/hollow.js` (ports from `docs/archive/nightmare-monsters/vampires-doctor/` Rot Doctor and `spirits/` Reaper; spread into `CHARS` under `__RELEASE__ >= 5`)
- Modify: `src/data/monsters.js` (types, names, intro text), `src/engine/render/fx.js` (a poison-green baked zone via `zoneSprite`), `src/engine/combat.js` (the Reaper's crow)

**Interfaces / values:**
- `rotdoctor: { hp:4, sp:0.035, r:22, coins:9, eat:0.5, pts:30, drop:2 }`; each frame every other living monster within its 3×3 (1.5 tiles, lanes ±1, the doctor's heal-zone geometry) gets `m.rotOnly = true` for that frame (cleared at the start of each frame for all monsters, before doctors and bosses set it). The doctor itself never gets it.
- `reaper: { hp:3, sp:0.07, r:21, coins:9, eat:0.5, pts:28, drop:2, show:3, hide:4, reap:true }`: the Wraith's fade cycle with these times; on death spawns `crow` (minion) at its lane and p. At the fence (owner): its scythe swing IS its chew: the chewing step applies `eat` per second to its own fence and both neighbours (continuously, like any chew; frozen or slowed scales it as for any chewer), and its registry `chew` clip is the archive's reap swing looping. A fence at 0 in its own lane lets it walk through, as for any monster.

- [ ] **Step 1: Write the failing checks**: `check_rotdoctor` (a ghoul beside it takes nothing from a normal pumpkin and 1.5 from a rotten one; the doctor takes normal damage; a ghoul two lanes away takes normal damage; zone drawn with ≤1 drawImage), `check_reaper` (data; hidden 4 s / shown 3 s; dies to 3 normal hits; a crow appears where it fell; chewing at fence 3 for 4 s takes about 2 off each of fences 2, 3 and 4 and nothing off fences 1 and 5; its chew frames are the reap swing).
- [ ] **Step 2–4:** FAIL, implement, pass; `char_sheet.py` strips to the scratchpad.
- [ ] **Step 5: Commit** "Plague Doctor 2 and the Reaper (Release 5)".

### Task 7: Fogwalker 2, Wisp Rider 2 and Poltergeist 2

**Files:** `src/engine/hollow.js`, `src/engine/render/chars/hollow.js` (ports from `spirits/` Fogwalker 2 and Mini Poltergeist, `riders/` Comet Rider), `src/data/monsters.js`, `src/engine/monsters.js` (fog band height per type)

**Interfaces / values:**
- `fogwalker2: { hp:3, sp:0.045, r:24, coins:9, eat:0.5, pts:28, drop:2, band:0.12 }` (two rows of fog); on spawn (not as a minion) it brings 2 `brute` minions in the lanes either side at its p (clamped to the field). A Lantern shows it, as the Fogwalker.
- `comet: { hp:2, sp:0.06, dashSp:0.4, cruise:2, r:20, coins:8, eat:0.5, pts:26, drop:2 }`: cruises `cruise` s on the field, then dashes at `dashSp` without stopping until it reaches the fence and chews; its first hit splits it into a `wisp` and a walking `imp` (as the Wisp Rider's carrier rule).
- `minipolt: { hp:3, sp:0.04, r:22, coins:9, eat:0.5, pts:28, drop:2, driftEvery:5, vanishEvery:7, vanishFor:2, rotEvery:6, rotN:[1, 2] }`: drifts a lane, vanishes (untargetable, like a hidden Wraith), and every `rotEvery` s rots 1–2 random unprotected pumpkins with a cast clip and a puff.

- [ ] **Step 1: Write the failing checks**: `check_fogwalker2` (2-row band hides monsters in both rows; two Mossback minions beside it), `check_comet` (reaches p 1 without stopping after the cruise; a hit splits it), `check_minipolt` (rots 1–2 pumpkins at 6 s, never in the Protector square; vanishes and comes back; drifts lanes).
- [ ] **Step 2–4:** FAIL, implement, pass; strips to the scratchpad.
- [ ] **Step 5: Commit** "Fogwalker 2, Wisp Rider 2 and Poltergeist 2 (Release 5)".

### Task 8: The Lamplighter (mini boss)

**Files:** `src/engine/hollow.js` (`initLamplighter`, `updateLamplighter`), `src/engine/render/chars/hollow.js` (port from `minibosses-hollow-keep/`; mood tint baked as variants: `lit` amber = clean, `dark` green = rot), `src/data/monsters.js`, `src/engine/monsters.js` (boss dispatch, as the Strawlord's), `src/engine/audio.js`

**Interfaces / values:** `lamplighter: { boss:true, hp:24, r:32, sp:0.03, coins:40, eat:0, pts:300, drop:6, hold:0.14, moodEvery:8, driftEvery:8, fogEvery:12, noItems:true, form2:{ hp:34, moodEvery:6 } }`. Mood `m.mood = 'rot'|'clean'` sets `m.rotOnly` / `m.cleanOnly` each frame; switching plays a flash. Every `fogEvery` s it calls `poisonNow` with one random row or column (the level's `poison.dur`). A continued night keeps its health, mood and timers' phase. `bossChest:'normal'` on its levels; N2-4 has `unlockGourds:['protector']`.

- [ ] **Step 1: Write the failing checks**: `check_lamplighter` (data; mood flips at 8 s; rot mood: normal blocked, rotten −1.5; clean mood: rotten blocked, normal hurts; calls a fog at 12 s; never past hold; one normal chest; N2-4 win unlocks `save.gourds.protector`), `check_lamplighter_form2` (N2-13: 34 hp, flips every 6 s), `check_lamplighter_continue`, `check_lamplighter_baked` (< 10 MB at bake scale 2.5).
- [ ] **Step 2–4:** FAIL, implement, pass.
- [ ] **Step 5: Commit** "The Lamplighter (Release 5)".

### Task 9: The Fallen Poltergeist (N2-16)

**Files:** `src/engine/hollow.js` (`initFallenPolt`, `updateFallenPolt`), `src/engine/render/chars/fallenpolt.js` (port of `docs/archive/fallen-bosses/poltergeist/fallen_poltergeist.js`, own key `fallenpoltergeist`, fallen look only, `maxK` capped so it bakes under 12 MB), `src/data/monsters.js`, `src/engine/monsters.js`, `src/engine/audio.js`, `src/engine/render/fx.js` (the black-fog field zone)

**Interfaces / values:** `fallenpoltergeist: { boss:true, hp:45, r:34, sp:0.03, coins:50, eat:0, pts:400, drop:6, hold:0.25, vanishEvery:6, swapEvery:8, swapN:3, zoneEvery:12, zoneFor:8, shuffleAt:[0.66, 0.33], reaperAt:[0.5, 0.2], reaperHits:3, noItems:true }`.
- Vanish: fades out and reappears in another lane (teleport, as the Gravekeeper's).
- Swap: 3 unprotected pumpkins trade places, colours unchanged (the Poltergeist's swap, protection-aware).
- Black fog: a 3×3 field zone (lanes ±1, 1.5 tiles) around a random living monster for `zoneFor` s; monsters inside get `rotOnly` each frame.
- Shuffle at 66% and 33% health: every unprotected pumpkin moves to a random unprotected cell, colours kept.
- Reaper phase at 50% and 20%: `rotOnly` until it has taken `reaperHits` rotten hits (per pumpkin), then back to normal. Lazy `done` counts from health on its first frame (the Fallen Gravekeeper pattern), so a continue does not replay them.

- [ ] **Step 1: Write the failing checks**: `check_fallen_polt` (each ability on a forced timer; shuffle once at 66% and once at 33%; reaper phase blocks normal hits until 3 rotten hits; protection respected by swap and shuffle; one normal chest), `check_fallen_polt_continue`, `check_fallen_polt_baked`.
- [ ] **Step 2–4:** FAIL, implement, pass; strip to the scratchpad.
- [ ] **Step 5: Commit** "The Fallen Poltergeist (Release 5)".

### Task 10: Levels N2-1 to N2-16, intro cards, bestiary and previews

**Files:** `src/data/worlds/nightmare2.js`, `src/data/bestiary.js` (entries, `COMPANIONS` for the Reaper's crow and Fogwalker 2's Mossbacks, `FALLEN[1] = { key:'fallenpoltergeist' }`), `src/data/monsters.js` (`ALSO_BAKE` for the summons), `src/ui/screens.js` (intro cards "Poison fog" and "Rotten pumpkins" on the first level with `poison`; "The Protector Gourd" on N2-5), `src/engine/game.js` (Fire / Ice locks unchanged; no new lock), `docs/GAME_DESIGN.md`, `docs/WORLDS.md`, `docs/LOOT.md`, `docs/RELEASES.md`, `CLAUDE.md`

**Values:** names and ideas from spec Part 7, one theme each; `gourd:true` from N2-1 (Grave Gourd); `gourds:['grave', 'protector']` offered from N2-5; N2-4 and N2-13 `boss:'lamplighter'` (N2-13 `bossForm:2`), `bossChest:'normal'`; N2-16 `boss:'fallenpoltergeist'`, `bossChest:'normal'`; every level sets `spawnGap` and `spawnBurst`; `poison` on every level from N2-1 except where the level's idea says otherwise; quests from existing quest types (three per level).

- [ ] **Step 1: Write the failing checks**: `check_n2_levels` (16 levels with the spec's names, every pool type in `TYPES`, intros on the levels that first bring each new monster, every preview opens without a page error, N2-4/13/16 bosses and chests as above), `check_n2_intros`, `check_n2_bestiary` (nightmare edition lists the new monsters and the Fallen Poltergeist last), `check_n2_prebake` (each level bakes what it can spawn).
- [ ] **Step 2–4:** FAIL, implement, pass.
- [ ] **Step 5: Commit** "Nightmare Foggy Hollow levels N2-1 to N2-16 (Release 5)".

### Task 11: The release matrix

- [ ] **Step 1:** Playtest build: `nm2_check --expect on`, `nm_check --expect on`, `w6_check --expect on`, `smoke_test`.
- [ ] **Step 2:** `VITE_RELEASE=4`: `nm2_check --expect r4`, `nm_check --expect r4`. `VITE_RELEASE=3`: `nm2_check --expect r3`, `nm_check --expect r3`, `w6_check --expect r3`. `VITE_RELEASE=2`: the same with `r2`. Store: the same with `off`.
- [ ] **Step 3:** Fix anything that fails in the task that owns it; commit.
