# Release 7: Nightmare Witchwood Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nightmare 3-1 to 3-16 on the playtest build: potions and brew marks, the Ash Crone, Blood Coven Witch, Triptych Sprite, Flask Bearer and Cauldron Toad, the Treant mini boss, the Wartling Gourd, and the Fallen Hexwitch.

**Architecture:** Release 4 and 5's nightmare track, gourd list, picker, spawn-bar marks and boss patterns are reused (generalised where needed, never re-tuned). Release 7 adds `src/engine/potion.js` (potions on field tiles, drinking, buffs, brew marks), `src/engine/witchwood.js` (the new monsters, the Treant and the Fallen Hexwitch), their art in `src/engine/render/potion.js` and `src/engine/render/chars/witchwood.js` / `fallenhex.js`, and level data in `src/data/worlds/nightmare3.js`. Every new piece is gated by an inline `__RELEASE__ >= 7`.

**Tech Stack:** Plain JavaScript ES modules, Vite, Canvas 2D; Python + Playwright checks against the built bundle (`tools/serve_dist.py`).

**Spec:** `docs/superpowers/specs/2026-11-08-release-7-nightmare-witchwood-design.md` (read it whole).

## Global Constraints

- Work only in the worktree `/Users/liongchenglex/AI_Projects/gourd-guard-r7` on branch `r7`; never touch the main folder (the Release 6 session works there). Serve this worktree's `dist/` on port **4174** (`tools/serve_dist.py --port 4174`, add the flag if missing), never 4173.
- Gate every Release 7 piece with `__RELEASE__ >= 7` written directly in the expression (`docs/RELEASES.md`); level data wrapped in an inline gate as `nightmare2.js` is. Store, R2–R6 builds carry none of its names or art.
- Releases 4 and 5 must play exactly as now: `tools/nm_check.py --expect on` and `tools/nm2_check.py --expect on` pass after every task.
- A beta (owner): numbers are first guesses from the spec, no bot balance runs.
- Perf rule (CLAUDE.md): never call the Toy Plastic painter or set `shadowBlur` in per-frame code; potions, bottle icons, zones, roots, the altar and the triptych barrier are baked sprites blitted per frame.
- Original IP; no network requests; art drawn in code, ported from `docs/archive/` where it exists.
- Always test the build: `npm run build:playtest`, then the checks with `--url http://127.0.0.1:4174/`. Lower builds: `VITE_RELEASE=6 npx vite build` (and 5, 4, 3, 2), `npm run build` (store).
- Rules change → `docs/GAME_DESIGN.md` changes in the same task (a new §9 section "Nightmare Witchwood (Release 7)").
- Shared state is written only through `src/engine/state.js` setters; test hooks only under `?test`, in a Release 7 spread in `src/main.js`.
- Commit per task, staging files by name; never commit `dump.md`, `monetization.md`, `questdump.md` or `assets/music/drafts/`.

## Review Focus

1. **A continued night** must bring back every potion on the field, what each living monster drank (and so its health and speed), brew marks passed, potion clock, the Treant's roots, and the Fallen Hexwitch's altars passed and a standing altar's health, with nothing replayed (Tasks 2, 3, 8, 9 each add a `*_continue` check).
2. **Buffs that combine with existing rules:** a bulky drinker inside a Bulwark aura, then leaving it, must keep exactly double its own health (the Bulwark's `bulk` toggling must not undo the potion); a speed drinker that is frozen or slowed scales from its boosted speed (Task 2 check `check_potion_bulwark`).
3. **Who must not drink:** bosses and mini bosses, the Loot Sack, the jukebox, mummies and the burning/`ICE_ONLY` types, crows in flight, a monster still rising from a hex zone; the colour potion also skips true Chameleons and Reverse Chameleons. Each walks past and leaves the potion (Task 2 check `check_potion_refuse`).
4. **The toad's burst on a crowded field:** with every nearby tile already holding a potion, it drops on the nearest free tiles further out, never two on one tile and never off the field (Task 7 check `check_toad_burst_full`).
5. **The altar's immunity is total:** while one stands the Fallen Hexwitch takes nothing from pumpkins, burn, glue, splash, lightning, mines or tools, and one big hit cannot carry her past the next mark (Task 9 check `check_fh_altar_immune`).

---

### Task 1: The Release 7 track, the book page and the check scaffold

**Files:**
- Create: `src/data/worlds/nightmare3.js` (gated array; N3-1 only, a plain placeholder night Task 10 replaces)
- Modify: `src/data/worlds/index.js` (WORLDS entry "Witchwood: Nightmare" with `custom:'nightmare', scene:'woodN', base:2` (base is the story world's index, as `patchN` 0 and `fogN` 1; the THEMES row's own `base:4` is the archive's order), palette from the `woodN` THEMES row in `render/nightmare/scenes.js` (greys, `#f0f0f0`); `NIGHTMARE_LEVELS` gains `nightmare3` under `__RELEASE__ >= 7`; the gate text and `isOpen` for N3-1 also need `save.stars[nmNight(2, 4)]`)
- Modify: `src/ui/screens.js` (world 3 bookmark page: N3 stamps; locked page says "Beat 3-20" / "Beat Nightmare 2-4")
- Modify: `src/main.js` (Release 7 test-hook spread, empty for now), `tools/serve_dist.py` (`--port`, default 4173)
- Create: `tools/nm3_check.py` (`--expect on|r6|r5|r4|r3|r2|off`, built like `nm2_check.py`, importing its helpers)
- Modify: `tools/nm2_check.py` and `tools/nm_check.py` (`--expect r6` runs their checks as `on` plus `check_r7_absent`)
- Modify: `docs/GAME_DESIGN.md` (new §9 section with the track)

**Interfaces:**
- Produces: `NIGHTMARE_LEVELS[2]`, `nmNight(3, k) = 1200 + k`, the WORLDS index of the Witchwood nightmare theme (`theme` in `nightmare3.js`); `tools/nm3_check.py` with `CHECKS`, `R7_NAMES`, `nm3_start(page, k, coach=False)`.

- [ ] **Step 1: Write the failing checks** in `tools/nm3_check.py`:
  - `check_r7_absent`: below `on`, the bundle holds none of `R7_NAMES = ['Witch\'s Brew', 'Wartling Gourd', 'Treant', 'Fallen Hexwitch', 'Ash Crone', 'Blood Coven Witch', 'Triptych Sprite', 'Flask Bearer', 'Cauldron Toad', 'The brew boils']`.
  - `check_n3_track`: `{60: 3}` only → `isOpen(1201)` false; `{60: 3, 1104: 3}` → true; `{1104: 3}` only → false; `levelFor(1201).label == 'N3-1'`, `.nightmare`, `.world == 3`; starting N3-1 gives no page error.
  - `check_n3_book`: the world 3 book's bookmark page shows 16 stamps once both gates are met, and the gate text otherwise.
- [ ] **Step 2:** `npm run build:playtest`; `nm3_check --expect on`. Expected: FAIL (no track).
- [ ] **Step 3:** Implement the files above.
- [ ] **Step 4:** Playtest: `nm3_check`, `nm2_check`, `nm_check --expect on` pass. `VITE_RELEASE=6 npx vite build`: all three with `--expect r6` pass.
- [ ] **Step 5: Commit** "Release 7 track: Nightmare Witchwood book page and checks".

### Task 2: Potions

**Files:**
- Create: `src/engine/potion.js`, `src/engine/render/potion.js` (three baked bottles: bulky a round red flask, speed a thin green vial with a bolt, colour a violet swirl bottle; a small icon of each; a "drink" puff)
- Modify: `src/data/rules.js`, `src/data/levels.js` (field `potions`), `src/engine/game.js` (state, update, snapshot, continue), `src/engine/monsters.js` (walk-over check, speed and chew multipliers, Bulwark interplay), `src/engine/render/draw.js` (potions above fog; icons beside health pips; bulky drinker drawn ×1.15)

**Interfaces:**
- `POTION_KINDS = ['bulky', 'speed', 'colour']`; rules: `POTION_SPEED = 1.5` (walk and chew), `POTION_COLOUR_CHAMELEON = 0.1`, `POTION_BULKY_SCALE = 1.15`.
- Level field `potions: { every:number, count:[min, max], kinds?:string[], cap:number }` (defaults: all kinds, cap 6).
- State `G.potions: { lane, p, kind }[]` (p snapped to a tile-row centre, the fire tile grid: `TILE_P()`), `G.potionT`.
- Produces (potion.js): `potionAt(lane, p)`, `placePotion(lane, p, kind) -> boolean` (false if the tile holds one or is off the field), `placeRandomPotions(n, kinds?) -> number` (random free tiles in the fire band `FIRE_P_RANGE`, spread across lanes), `canDrink(m, kind) -> boolean`, `drink(m, kind)`, `updatePotions(dt)` (the clock; walk-over drinking), `potionEveryNow() -> number` (the level's `every` with brew-mark cuts, Task 3), `potionSnapshot()`, `restorePotions(s)`.
- Monster fields: `m.drank: { bulky?:true, speed?:true, colour?:true }`. Bulky: `hp *= 2; maxHp *= 2` once (independent of the Bulwark's `bulk`: Bulwark code halves and doubles around it, so the potion's doubling is kept). Speed: walk and chew rates ×1.5 where the type's `sp` and `eat` are read. Colour: `hexMonster(m, Math.random() >= 0.1)`.
- `canDrink`: false for type `boss`, `sack`, `jukebox`, `mummy`, `ICE_ONLY` types, `crow`, a dead or rising (`rise > 0`) monster, or one with `drank[kind]`; the colour potion additionally needs `hexable(m)` (so never a true Chameleon / Reverse Chameleon).

- [ ] **Step 1: Write the failing checks** in `nm3_check.py`:
  - `check_potion_place`: `placePotion(3, 0.5, 'bulky')` true, a second on that tile false; `placeRandomPotions(5)` puts 5 on 5 different tiles in 5 different lanes.
  - `check_potion_clock`: `potions:{every:4, count:[2,2], cap:3}` on a quiet night: 2 at 4 s, 3 (cap) at 8 s.
  - `check_potion_drink`: a ghoul (3 hp) walks onto bulky → 6/6 hp, potion gone; onto a second bulky → unchanged, potion stays; onto speed → it covers ×1.5 the distance in 2 s and chews its fence ×1.5 as fast; colour with `Math.random` stubbed to 0.05 → Chameleon, 0.5 → Reverse Chameleon.
  - `check_potion_refuse`: a boss, a mummy, a Flaming Mummy, a crow, a rising monster all leave a bulky potion in place; a Chameleon leaves a colour potion but drinks bulky.
  - `check_potion_bulwark`: a bulky ghoul (6/6) steps into a Bulwark aura (12/12) and out again (6/6).
  - `check_potion_continue`: potions on the field and a monster's `drank` survive a continue.
  - `check_potion_budget`: six potions and three buffed monsters add at most 12 `drawImage` calls and no `fill`/`stroke` (pattern: `check_fire_budget`).
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement. Render the three bottles and the icons as a strip to the scratchpad for the owner (shown before Task 10).
- [ ] **Step 4:** Checks pass; `nm_check`, `nm2_check --expect on` pass.
- [ ] **Step 5: Commit** "Potions on the field (Release 7)".

### Task 3: Brew marks

**Files:** `src/engine/potion.js`, `src/engine/spawner.js` (beside the fire-mark trigger), `src/ui/hud.js` (a `brewMarks()` like `fireMarks()`, class `.bmMark`, a tick when passed), `src/style.css`, `src/engine/game.js` (snapshot), `src/engine/render/draw.js` if a banner needs art

**Interfaces:**
- Level field `brewMarks: number[]` (fractions of `total`). On a level with marks the spawn bar counts arrivals, not kills (extend the `fireMarks` condition in `updateHud`).
- State `G.bmNext`, `G.bmT`. `dropBrewMark()`: banner "The brew boils!" ("Crows swoop in and the potions come faster."), spawns `BREW_CROWS = [4, 6]` crows (minions, top of random lanes, as `fgkCrows`), `G.bmNext += 1`.
- `potionEveryNow() = every × 0.75 ^ G.bmNext` (`BREW_CUT = 0.75`).

- [ ] **Step 1: Write the failing checks**: `check_brew_marks` (`brewMarks:[0.33, 0.66], total:12`: at the 4th spawn the banner shows, 4–6 crows appear, `potionEveryNow()` = 0.75 × every; at the 8th, 0.5625 × every; two `.bmMark` on the bar, ticked once passed), `check_brew_continue` (`bmNext` survives; a passed mark does not fire again).
- [ ] **Step 2–4:** FAIL, implement, pass.
- [ ] **Step 5: Commit** "Brew marks (Release 7)".

### Task 4: The Wartling Gourd, the picker and the N3-5 tutorial

**Files:**
- Modify: `src/data/gourds.js` (`wartling` under `__RELEASE__ >= 7`: name "Wartling Gourd", role "Doubles launch damage"), `src/engine/gourd.js` (`inWartSquare(r, c)`, break heal in `destroyGourd`, fx colours), `src/engine/combat.js` (launch flag and damage), `src/engine/render/gourd.js` (the archive's Wartling from `docs/archive/gourds/entry.js`: violet `#8a5cc6`, bumps, curly stem, toy face; violet square glow tile), `src/engine/coach.js` (`coach:'wartling'` script), `src/save.js` (`seenWartlingCoach`), `src/ui/screens.js` (picker with three gourds: two slots, pick two of three)

**Interfaces:**
- `inWartSquare(r, c) -> boolean`: inside the 3×3 of a standing Wartling.
- Launch: a projectile launched from a cell with `inWartSquare` carries `pr.wart = true`; in `hitMonsterNow` its hit damage is ×2 (`WART_DMG = 2`), on-hit powers unchanged; the Fallen Hexwitch's and Hollow King's immunity still wins.
- Break: if the Wartling stood in row 0, fences `c-1..c+1` (clamped) each heal by `0.5 × full`, never above full (`WART_HEAL = 0.5`); in any other row nothing extra. Due back as the other gourds.
- Picker: with three unlocked, `GOURD_SLOTS = 2` slots; with more unlocked than slots, the first two in unlock order start picked; tapping a third tile when both are full replaces the last picked.
- Start cells with two gourds including the Wartling: the first at (2, 1), the second at (2, 5) (Release 5's rule, by slot order).
- Coach `'wartling'` on N3-5 (modelled on `startProtectorCoach`): slide the Wartling; launch a bunch from its square (big numbers on a tough ghoul); slide it to the top row; hold to break it, the fences above mend; "Nice!"; the night carries on. Each step waits for the shown action.

- [ ] **Step 1: Write the failing checks**: `check_wart_damage` (a level-1 Green from the square takes 2 off a 50-hp ghoul, 1 from outside; an Ice from the square still slows), `check_wart_break_heal` (Wartling at (0, 3), fences 2–4 at 4/20 → 14/20, fence 1 and 5 unchanged; at (2, 3) nothing heals; never above full), `check_picker_three_gourds` (three tiles, two slots, the right kinds reach `G.gourdKinds`; the N2-5 and N1-5 pickers unchanged), `check_wart_coach` (steps in order, ends with the night running, `seenWartlingCoach` set), `check_wart_unlock` (beating N3-4 sets `save.gourds.wartling`).
- [ ] **Step 2–4:** FAIL, implement, pass; screenshot the picker at phone size and a Wartling strip to the scratchpad.
- [ ] **Step 5: Commit** "The Wartling Gourd (Release 7)".

### Task 5: The Ash Crone and the Blood Coven Witch

**Files:**
- Create: `src/engine/witchwood.js` (`updateWitchwoodMonster(m, dt) -> boolean`, called in `monsters.js`' default branch after `updateHollowMonster`; `initWitchwoodMonster(m)`), `src/engine/render/chars/witchwood.js` (ports of `ash` and `coven` from `docs/archive/nightmare-monsters/witches-mirror/nightmare_witches.js`, each with its own registry key; spread into `CHARS` under `__RELEASE__ >= 7`)
- Modify: `src/data/monsters.js` (types, `MNAME`, `MINTRO`), `src/engine/monsters.js` (Ash Crone's crow ring at spawn, beside the Vampire's bats), `src/engine/game.js` / `combat.js` (zones use `G.hexZones` and the existing `inHexZone` rise rule)

**Values:**
- `ashcrone: { hp:4, sp:0.035, r:22, coins:9, eat:0.5, pts:30, drop:2, zoneEvery:10, zoneLast:8, crows:4 }`: every `zoneEvery` s pushes a `box` zone (`G.hexZones`, the Hexwitch's 3×3) centred on a random living non-boss monster within 2 lanes of her, hex clip; at spawn (not as a minion) four `crow` minions left, right, ahead and behind (the Vampire's spots).
- `covenwitch: { hp:3, sp:0.04, r:22, coins:9, eat:0.5, pts:28, drop:2, brewEvery:7, brewN:[1, 2] }`: every `brewEvery` s, hex clip, places 1–2 random-kind potions each on the tile just ahead (larger p) of a random living monster on the field (`placePotion`; skipped if that tile is taken).

- [ ] **Step 1: Write the failing checks**: `check_ashcrone` (four crows at spawn, none when spawned as a minion; a zone at 10 s around a nearby monster lasting 8 s; a ghoul killed inside rises after 4 s), `check_covenwitch` (at 7 s 1–2 potions appear one tile ahead of monsters), strips via `tools/char_sheet.py` to the scratchpad.
- [ ] **Step 2–4:** FAIL, implement, pass.
- [ ] **Step 5: Commit** "The Ash Crone and the Blood Coven Witch (Release 7)".

### Task 6: The Triptych Sprite

**Files:** `src/engine/witchwood.js`, `src/engine/render/chars/witchwood.js` (port of `grand` from `witches-mirror/grand_mirror.js`, own key), `src/engine/render/fx.js` (the baked three-lane barrier from `bakeBarrier()`), `src/engine/combat.js` (beside the Mirror Sprite's reflect at the `m.type === 'mirror' && m.reflecting` branch), `src/data/monsters.js`

**Values:** `triptych: { hp:3, sp:0.04, r:26, coins:10, eat:0.5, pts:32, drop:2, reflect:2, open:2.5, lanes:1 }` (lanes either side). While reflecting, a pumpkin in lanes `lane-1..lane+1` that reaches the barrier's y (the sprite's p) is reflected back down its own lane and damages that lane's fence for its power (the Mirror Sprite's rule); barrier down while it chews.

- [ ] **Step 1: Write the failing checks**: `check_triptych` (up 2 s / down 2.5 s; a pumpkin in each of the three lanes reflects and damages that lane's fence; a pumpkin two lanes away passes; down while chewing; barrier ≤ 1 `drawImage`).
- [ ] **Step 2–4:** FAIL, implement, pass; strip to the scratchpad.
- [ ] **Step 5: Commit** "The Triptych Sprite (Release 7)".

### Task 7: The Flask Bearer and the Cauldron Toad (new art)

**Files:** `src/engine/witchwood.js`, `src/engine/render/chars/witchwood.js` (new Toy Plastic drawings following `docs/ART_BRIEF.md`: the Flask Bearer a little grey imp with bottles clinking on its belt; the Cauldron Toad a fat warty toad with a cauldron-black belly and a long tongue clip; walk, chew (the toad's chew is its tongue lash), death), `src/engine/combat.js` (death hooks), `src/data/monsters.js`, `src/engine/monsters.js` (the toad's hold)

**Values:**
- `flaskbearer: { hp:2, sp:0.055, r:18, coins:8, eat:0.5, pts:24, drop:2 }`: on death, one random-kind potion on its tile (`placePotion`, nearest free tile if taken).
- `toad: { hp:5, sp:0.03, r:24, coins:10, eat:0.5, pts:30, drop:2, tongueHold:0.67 }`: walks to `tongueHold` of the field and stops there; from then on its chew applies `eat` per second (×1.5 with speed) to its own lane's fence from range (tongue clip). Drinks like any monster. On death, one potion per kind in `m.drank` on the nearest free tiles around where it died (ring by ring outwards, inside the field).

- [ ] **Step 1: Write the failing checks**: `check_flaskbearer` (dies → one potion on its tile), `check_toad_tongue` (stops at 0.67, fence loses about 2 in 4 s, never moves closer), `check_toad_burst` (drank bulky + speed → two potions of those kinds near its death tile; drank none → none), `check_toad_burst_full` (every tile around full → potions further out, one per tile, all on the field).
- [ ] **Step 2–4:** FAIL, implement, pass. **Stop and show the owner** the two strips and Task 2's bottles (scratchpad PNGs) before Task 10.
- [ ] **Step 5: Commit** "The Flask Bearer and the Cauldron Toad (Release 7)".

### Task 8: The Treant (mini boss)

**Files:** `src/engine/witchwood.js` (`initTreant`, `updateTreant`, roots), `src/engine/render/chars/witchwood.js` (ports of `treant` and `root` from `minibosses-patch-wood/patch_wood.js`; `idle` registered as `walk`), `src/engine/combat.js` (a projectile meets a root before monsters behind it), `src/engine/monsters.js` (boss dispatch beside the Lamplighter's), `src/engine/audio.js`, `src/data/monsters.js`

**Values:** `treant: { boss:true, hp:24, r:34, sp:0.03, coins:40, eat:0, pts:300, drop:6, hold:0.12, rootEvery:7, rootN:[2, 3], rootHp:3, rootSqueeze:0.5, rootLast:8, noItems:true, form2:{ hp:34, rootEvery:5, rootN:[3, 4] } }`. Never walks past `hold`; immune to knockback and freeze; never drinks. Each summon picks lanes (never its own); per lane 50/50 *(our call)* a mid-field root (p in `FIRE_P_RANGE`, blocks: the first pumpkin up that lane hits it, `rootHp` hits destroy it) or a fence root (at the fence: squeezes `rootSqueeze` per second until destroyed or after `rootLast` s). State `G.roots: { lane, p, hp, t, atFence }[]`. `bossChest:'normal'`; N3-4 has `unlockGourds:['wartling']`.

- [ ] **Step 1: Write the failing checks**: `check_treant` (data; summons 2–3 roots at 7 s; a pumpkin up a mid-field root's lane hits it and stops, three destroy it; a fence root takes about 4 off in 8 s then sinks; never past hold; one normal chest; N3-4 win unlocks the Wartling), `check_treant_form2` (34 hp, every 5 s, 3–4 roots), `check_treant_continue` (roots and timers survive), `check_treant_baked` (< 10 MB at bake scale 2.5).
- [ ] **Step 2–4:** FAIL, implement, pass.
- [ ] **Step 5: Commit** "The Treant (Release 7)".

### Task 9: The Fallen Hexwitch (N3-16)

**Files:** `src/engine/witchwood.js` (`initFallenHex`, `updateFallenHex`, the altar), `src/engine/render/chars/fallenhex.js` (port of `docs/archive/fallen-bosses/hexwitch/fallen_hexwitch.js`, own key `fallenhexwitch`, fallen look only, `maxK` capped under 12 MB), `src/engine/render/fx.js` (a baked altar sprite with crack states; a 5×5 zone size for `zoneSprite`), `src/engine/combat.js` (immunity while an altar stands, the Hollow King's "No damage" pattern in `hollowking.js`), `src/engine/monsters.js` (boss dispatch; `inHexZone` gains a `box5` shape: lanes ±2, ±2.5 tiles), `src/engine/audio.js`, `src/data/monsters.js`

**Values:** `fallenhexwitch: { boss:true, hp:45, r:34, sp:0.03, coins:50, eat:0, pts:400, drop:6, hold:0.28, zoneEvery:12, zoneLast:10, potionEvery:8, potionN:[2, 3], crowEvery:6, crows:[1, 3], smashEvery:10, smashHit:0.5, glide:[1, 2], altarAt:[0.75, 0.5, 0.25], altarHp:8, noItems:true }`.
- Smash: her lane's fence loses `smashHit × full`, never its last 1; 0.45 s later she glides 1–2 lanes (clamped).
- Altar: when health reaches a mark, `G.altar = { lane, p:0.15, hp:8 }` in a random lane other than hers (a monster-like target: pumpkins hit it, monsters in front shield it, tools and area damage skip it); while it stands every damage to her is 0 with "No damage", and her health is clamped at the mark. A hit past two marks raises the second when the first falls. Lazy `done` from health on the first frame (Fallen Gravekeeper pattern), so a continue does not replay passed marks; a standing altar is saved with its health.
- No hexing (spec Part 6).

- [ ] **Step 1: Write the failing checks**: `check_fallen_hex` (each ability on a forced timer: a 5×5 zone, 2–3 potions, 1–3 crows, smash half then glide; altar at 75/50/25%), `check_fh_altar_immune` (pumpkin, burn, glue, splash, lightning, mine and firework all leave her health unchanged while the altar stands; a 20-damage hit at 80% stops at 75%; tools do not hurt the altar; a pumpkin does), `check_fallen_hex_continue`, `check_fallen_hex_baked`.
- [ ] **Step 2–4:** FAIL, implement, pass; strip to the scratchpad.
- [ ] **Step 5: Commit** "The Fallen Hexwitch (Release 7)".

### Task 10: Levels N3-1 to N3-16, intro cards, bestiary, previews and docs

**Files:** `src/data/worlds/nightmare3.js`, `src/data/bestiary.js` (entries, `COMPANIONS` for the Ash Crone's crows, `FALLEN[2] = { key:'fallenhexwitch' }`), `src/data/monsters.js` (`ALSO_BAKE` for crows and roots), `src/ui/screens.js` (intro cards "Potions" on N3-1, "Brew marks" on N3-6, "The Wartling Gourd" on N3-5), `docs/GAME_DESIGN.md`, `docs/WORLDS.md`, `docs/LOOT.md`, `docs/RELEASES.md` (row 7 "Built"), `CLAUDE.md`

**Values:** names and ideas from spec Part 7, one theme each; `gourd:true` and `gourds:['grave', 'protector']` from N3-1, `['grave', 'protector', 'wartling']` from N3-5 (`coach:'wartling'`); N3-4 and N3-13 `boss:'treant'` (N3-13 `bossForm:2`), N3-16 `boss:'fallenhexwitch'`, all `bossChest:'normal'`; `potions` on every level; `brewMarks:[0.33, 0.66]` on N3-6 to N3-15 except N3-13; N3-9 `potions.kinds:['colour']`; N3-11 the world 3 patch `gust` with `partial`; every level sets `spawnGap` and `spawnBurst`; three quests from existing quest types per level.

- [ ] **Step 1: Write the failing checks**: `check_n3_levels` (16 levels with the spec's names, every pool type in `TYPES`, intros where each new monster first walks in, every preview opens without a page error, bosses and chests as above), `check_n3_intros`, `check_n3_bestiary` (nightmare edition lists the new monsters and the Fallen Hexwitch last), `check_n3_prebake`.
- [ ] **Step 2–4:** FAIL, implement, pass.
- [ ] **Step 5: Commit** "Nightmare Witchwood levels N3-1 to N3-16 (Release 7)".

### Task 11: The release matrix and the merge readiness check

- [ ] **Step 1:** Playtest build: `nm3_check`, `nm2_check`, `nm_check`, `w6_check --expect on`, `smoke_test`.
- [ ] **Step 2:** `VITE_RELEASE=6`, `5`, `4`, `3`, `2` and the store build: each check with its matching `--expect` (`r6`, `r5`/`on` as that tool names it, …, `off`).
- [ ] **Step 3:** Fix anything that fails in the task that owns it; commit.
- [ ] **Step 4:** Report to the owner. The `dev` merge happens only after Release 6 is merged and the owner agrees (spec "Merging with Release 6").
