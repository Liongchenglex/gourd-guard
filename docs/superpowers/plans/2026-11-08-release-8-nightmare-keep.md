# Release 8: Nightmare Crumbling Keep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nightmare 4-1 to 4-16 on the playtest build: nets and red nets, the Storm Lancer, Storm Marshal, Blood Glutton, Bat Bride, Lobber Cart, Gatehouse and Archer Tower, the Crookneck Gourd, the Siege Tower mini boss and the Fallen Count.

**Architecture:** Releases 4, 5 and 7's nightmare track, gourd list, picker, boss patterns and checks are reused, never re-tuned. Release 8 adds `src/engine/nets.js` (nets on cells, throwing, the cap, the shield link), `src/engine/keep.js` (the new monsters, castle pieces, the Siege Tower and the Fallen Count), art in `src/engine/render/nets.js`, `src/engine/render/chars/keep.js` and `fallencount.js`, and level data in `src/data/worlds/nightmare4.js`. Every new piece is gated by an inline `__RELEASE__ >= 8`.

**Tech Stack:** Plain JavaScript ES modules, Vite, Canvas 2D; Python + Playwright checks against the built bundle (`tools/serve_dist.py`).

**Spec:** `docs/superpowers/specs/2026-11-08-release-8-nightmare-keep-design.md` (read it whole).

## Global Constraints

- Work only in the worktree `/Users/liongchenglex/AI_Projects/gourd-guard-r8` on branch `r8`; never touch the main folder (Release 6) or `../gourd-guard-r7` (Release 7). Serve this worktree's `dist/` on port **4175** (`python3 tools/serve_dist.py 4175`), never 4173 or 4174.
- Gate every Release 8 piece with `__RELEASE__ >= 8` written directly in the expression (`docs/RELEASES.md`); `nightmare4.js` wrapped in an inline gate as `nightmare3.js` is. R2–R7 and store builds carry none of its names or art.
- Releases 4, 5 and 7 must play exactly as now: `tools/nm_check.py`, `tools/nm2_check.py` and `tools/nm3_check.py --expect on` pass after every task.
- `r8` follows `r7`: before Tasks 1 and 7, `git merge r7` (Task 7 needs Release 7's three-gourd picker). Resolve shared tables in favour of both releases.
- A beta (owner): numbers are first guesses from the spec, no bot balance runs.
- Perf rule (CLAUDE.md): never call the Toy Plastic painter or set `shadowBlur` in per-frame code; nets, veils, the Marshal's square, castle pieces, the lightning column, the Count's spear, the rain sheets and the map's bolts are baked sprites blitted per frame.
- Original IP; no network requests; art ported from `docs/archive/` where it exists.
- Always test the build: `npm run build:playtest`, then the checks with `--url http://127.0.0.1:4175/`. Lower builds: `VITE_RELEASE=7 npx vite build` (and 6 … 2), `npm run build` (store).
- Rules change → `docs/GAME_DESIGN.md` changes in the same task (a new §9 section "Nightmare Crumbling Keep (Release 8)").
- Shared state is written only through `src/engine/state.js` setters; test hooks only under `?test`, in a Release 8 spread in `src/main.js`.
- Commit per task, staging files by name; never commit `dump.md`, `monetization.md`, `questdump.md` or `assets/music/drafts/`.

## Review Focus

1. **A continued night** brings back every net (kind, and which monster a red net shields), each veil's link, which monsters already got the Marshal's ×2 HP, each castle piece's kind, health and gate/shot clock, the Siege Tower's archers left, and the Fallen Count's marks passed, with nothing replayed (Tasks 2, 4, 5, 6, 8, 9 each add a `*_continue` check).
2. **Immunity has one door:** red-net shields, veils and the Count's mark clamp are all asked through `shieldedNow(m)` inside `damage()`, so pumpkins, burn, glue, splash, lightning, mines, magnet and tools are all refused alike (Task 5 check `check_shield_all_sources`).
3. **Nets never deadlock the patch:** with 15 nets the next throw fizzles; a throw never picks a pumpkin left with no free neighbour; `bestMove`, the hint arrow and wind never move a netted pumpkin (Task 2 checks `check_net_cap`, `check_net_free_neighbour`, `check_net_hint_wind`).
4. **The Crookneck's group launch with odd pumpkins:** Rainbow, Paint, Brown, Turquoise, Magnet and a netted pumpkin in the square each launch once, as themselves; a cell in both the square's group and a normal bunch never launches twice (Task 7 check `check_crook_launch_mix`).
5. **A Lancer meeting the fence edge cases:** a fence already at 1 or broken, a Lancer frozen mid-charge, a Lancer walking through a castle wall or Gatehouse (monsters pass castle walls freely), and a Lancer from the Siege Tower's ramp all behave per spec (Task 4 check `check_lancer_edges`).

---

### Task 1: The Release 8 track, the book page and the check scaffold

**Files:**
- Create: `src/data/worlds/nightmare4.js` (gated array; N4-1 only, a plain placeholder night Task 10 replaces)
- Modify: `src/data/worlds/index.js` (WORLDS entry "Crumbling Keep: Nightmare" with `custom:'nightmare', scene:'keepN', base:3`, palette from the archive's thunderstorm row (`#03050c` `#141c33` `#3a4a6a`; `#c8d4ff`); `NIGHTMARE_LEVELS` gains `nightmare4` under `__RELEASE__ >= 8`; `isOpen` for N4-1 needs `save.stars[60 + 20]`-style 4-20 and `save.stars[nmNight(3, 4)]`)
- Modify: `src/engine/render/sprites.js` / `render/nightmare/scenes.js` (the `keepN` scene from `docs/archive/nightmare-worlds/entry.js`: storm clouds, forked lightning, rain, `countFigure()`, `gargoyle()`, crows, broken portcullis; baked once), `src/engine/render/weather.js` (new: `bakeRain()` two tileable rain sheets, near and far; `bakeBolts()` three forked bolts; `drawWeather(ctx, dt)` scrolls the sheets and runs the flash; called behind the monsters and patch on the `keepN` scene only), `src/engine/audio.js` (`SFX.thunder()`: a synth low rumble, quiet)
- Modify: `src/ui/screens.js` (world 4 bookmark page: N4 stamps; locked page says "Beat 4-20" / "Beat Nightmare 3-4"), `src/main.js` (Release 8 test-hook spread)
- Create: `tools/nm4_check.py` (`--expect on|r7|r6|r5|r4|r3|r2|off`, importing `nm3_check.py`'s helpers)
- Modify: `tools/nm3_check.py`, `nm2_check.py`, `nm_check.py` (`--expect r7` runs their checks as `on` plus `check_r8_absent`)
- Modify: `docs/GAME_DESIGN.md` (new §9 section with the track)

**Interfaces:**
- Produces: `NIGHTMARE_LEVELS[3]`, `nmNight(4, k) = 1300 + k`; `tools/nm4_check.py` with `CHECKS`, `R8_NAMES`, `nm4_start(page, k, coach=False)`, `keep_page(browser, url)` (a quiet N4 night with test hooks).

- [ ] **Step 1:** `git merge r7`; resolve; commit.
- [ ] **Step 2: Write the failing checks** in `tools/nm4_check.py`:
  - `check_r8_absent`: below `on`, the bundle holds none of `R8_NAMES = ['Storm Lancer', 'Storm Marshal', 'Blood Glutton', 'Bat Bride', 'Lobber Cart', 'Gatehouse', 'Archer Tower', 'Crookneck Gourd', 'Siege Tower', 'Fallen Count', 'b9cf3c']`.
  - `check_n4_track`: 4-20 only → `isOpen(1301)` false; 4-20 and N3-4 → true; N3-4 only → false; `levelFor(1301).label == 'N4-1'`, `.nightmare`, `.world == 4`; starting N4-1 gives no page error and the `keepN` scene.
  - `check_n4_weather`: on N4-1 the rain sheets' offsets change between two frames; with `Math.random` forced, a flash fires within 15 s and fades to 0 in under 0.5 s with a bolt drawn; `drawWeather` adds at most 6 `drawImage` and no `fill`/`stroke`/`shadowBlur` per frame; no weather on N3 or story 4-x nights; with reduced motion no flash.
  - `check_n4_book`: the world 4 book's bookmark page shows 16 stamps once both gates are met, the gate text otherwise.
- [ ] **Step 3:** `npm run build:playtest`; `nm4_check --expect on`. Expected: FAIL (no track).
- [ ] **Step 4:** Implement the files above.
- [ ] **Step 5:** Playtest: `nm4_check`, `nm3_check`, `nm2_check`, `nm_check --expect on` pass. `VITE_RELEASE=7 npx vite build`: all four with `--expect r7` pass.
- [ ] **Step 6: Commit** "Release 8 track: Nightmare Crumbling Keep book page and checks".

### Task 2: Nets on the patch

**Files:**
- Create: `src/engine/nets.js`, `src/engine/render/nets.js` (the archive's net and netted pumpkin from `docs/archive/nightmare-monsters/crows-cart/crows-cart.js`, baked once per canvas scale; a crimson version with a red tint over the pumpkin for `'red'`; the net in flight)
- Modify: `src/engine/board.js` (`planMove`, the push line and `bestMove` beside the `pinned` lines: a netted cell behaves as pinned; `smash` refuses a netted cell with a "Netted" float and `SFX.bad()`), `src/engine/game.js` (wind skip beside line 292; update; snapshot and continue), `src/engine/render/draw.js` (net over the cell beside `drawPin`; nets in flight), `src/data/rules.js`

**Interfaces:**
- Cell field `cell.net: null | 'net' | 'red'`, `cell.netBy: monster id | null` (the monster that threw it, any kind; only red nets shield it).
- Rules: `NET_CAP = 15`, `NET_FLY = 0.7` (seconds in flight).
- Produces (nets.js): `netCount() -> number`, `canNet(r, c) -> boolean` (a pumpkin, not a gourd, not flying, not already netted, not in a Crookneck square (`inCrookSquare`, Task 7; until then false), and after netting it at least one orthogonal neighbour that is on the patch, not a grave and not netted), `pickNetCell() -> [r, c] | null` (random among `canNet` cells), `throwNet(fromX, fromY, kind='net', by=null) -> boolean` (false and a fizzle puff when `netCount() + flying >= NET_CAP` or no cell; else pushes `G.netsFlying` entry that lands after `NET_FLY` and re-checks `canNet` on landing), `isNetted(cell) -> boolean`, `clearNets(pred?)` (removes nets matching `pred(cell)`, all by default), `redNetsOf(m) -> number` (red nets with `netBy === m.id`), `updateNets(dt)`, `netSnapshot()`, `restoreNets(s)`.
- A launched netted pumpkin flies as normal; `launchGroup` needs no change because the net lives on the cell, which leaves the grid.

- [ ] **Step 1: Write the failing checks** in `nm4_check.py`:
  - `check_net_rules`: a netted pumpkin refuses a slide, blocks a push line through it, cannot be crushed (hold), stays after 30 s, and flies with its lit bunch (net gone, the projectile launched).
  - `check_net_cap`: 15 nets on the patch → `throwNet` returns false and nothing lands; 14 plus two in flight → the second fizzles.
  - `check_net_free_neighbour`: a pumpkin whose only free neighbour is netted is never picked; a corner pumpkin beside a grave and a netted pumpkin is never picked.
  - `check_net_hint_wind`: `bestMove` and the hint never move a netted pumpkin; a gust leaves it in place.
  - `check_net_continue`: nets (kind and `netBy`) and nets in flight survive a continue.
  - `check_net_budget`: 15 nets add at most 15 `drawImage` and no `fill`/`stroke` (pattern: `check_fire_budget`).
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement. Render the net, red net and flying net as a strip to the scratchpad.
- [ ] **Step 4:** Checks pass; `nm_check`, `nm2_check`, `nm3_check --expect on` pass.
- [ ] **Step 5: Commit** "Nets on the patch (Release 8)".

### Task 3: The Lobber Cart

**Files:** create `src/engine/keep.js` (`initKeepMonster(m)`, `updateKeepMonster(m, dt) -> boolean`, called in `monsters.js`' default branch after the Release 7 hook), `src/engine/render/chars/keep.js` (port of `cart` from `crows-cart.js`, own key; spread into `CHARS` under `__RELEASE__ >= 8`); modify `src/data/monsters.js` (type, `MNAME`, `MINTRO`), `src/engine/audio.js` (lob sound from the existing bank)

**Values:** `lobbercart: { hp:6, sp:0.02, r:26, coins:10, eat:0, pts:30, drop:2, park:0.15, lobEvery:[6, 8] }`. Rolls to `park` of the field and stops (never chews); every 6–8 s plays `lob` and calls `throwNet(m.x, mY(m))`. Its nets stay when it dies.

- [ ] **Step 1: Write the failing checks**: `check_lobber` (parks at 0.15 and never passes it; a net within 8 s, another within 16 s; dying leaves its nets), `check_lobber_continue` (lob clock survives).
- [ ] **Step 2–4:** FAIL, implement, pass; strip via `tools/char_sheet.py` to the scratchpad.
- [ ] **Step 5: Commit** "The Lobber Cart (Release 8)".

### Task 4: The Storm Lancer and the Storm Marshal

**Files:** `src/engine/keep.js`, `src/engine/render/chars/keep.js` (ports of `jouster` and `commander` from `docs/archive/nightmare-monsters/knights/knights.js`, own keys `lancer` / `marshal`), `src/engine/render/fx.js` (a baked 3×3 rally square for the Marshal, pulsing alpha, `zoneSprite` pattern), `src/data/monsters.js`, `src/engine/monsters.js` (speed multiplier read where `sp` is read)

**Values:**
- `lancer: { hp:5, sp:0.03, charge:4, r:26, coins:10, eat:0, pts:30, drop:2, fenceHit:0.5 }`: from spawn moves at `sp × charge` (Ice slow and freeze apply to that); on reaching the fence its lane's fence loses `fenceHit × full`, never below 1 (a fence at 1 or less takes nothing), then the Lancer is removed without a kill reward. A broken fence: it walks through like any monster (the night is lost as usual).
- `marshal: { hp:10, sp:0.03, r:28, coins:12, eat:0.5, pts:36, drop:3, rallyEvery:8, rallyLast:4, rallySp:2, rallyHp:2 }`: while rallying, other non-boss monsters within ±1 lane and ±1.5 tiles of him move ×2; at the start of each rally each such monster without `m.rallied` gets `hp *= 2; maxHp *= 2` and `m.rallied = true`. Never another Marshal, never a boss or mini boss.

- [ ] **Step 1: Write the failing checks**: `check_lancer` (charges at 4× from spawn; fence 20/20 → 10/20; fence 1/20 → 1/20; no coins on impact; 5 hits kill it), `check_lancer_edges` (frozen mid-charge it stops; it passes a castle wall and a Gatehouse; a broken fence lets it through), `check_marshal` (raise at 8 s for 4 s; a ghoul beside him moves ×2 then ×1; 3/3 → 6/6 once, stays 6/6 at the next raise; a ghoul two lanes away untouched; another Marshal and a boss untouched), `check_marshal_continue` (`rallied` and the rally clock survive), the square ≤ 1 `drawImage`.
- [ ] **Step 2–4:** FAIL, implement, pass; strips to the scratchpad.
- [ ] **Step 5: Commit** "The Storm Lancer and the Storm Marshal (Release 8)".

### Task 5: The Blood Glutton, the Bat Bride and the one shield door

**Files:** `src/engine/keep.js`, `src/engine/nets.js` (red nets), `src/engine/combat.js` (`damage()` asks `shieldedNow(m)` first, the Hollow King's "No damage" float and clink at line 128 of `hollowking.js` as the pattern), `src/engine/render/chars/keep.js` (ports of `glutton` and `bride` variants from `docs/archive/nightmare-monsters/vampires-doctor/nm_vampires.js`, own keys), `src/engine/render/fx.js` (a baked red veil over a monster), `src/data/monsters.js`

**Interfaces:**
- Produces (keep.js): `shieldedNow(m) -> boolean` = `redNetsOf(m) > 0 || (m.veilBy && the Bride lives) || countClamped(m)` (Task 9 adds the clamp; return false for it until then).
- `glutton: { hp:8, sp:0.03, r:24, coins:12, eat:0.5, pts:34, drop:3, netsAtSpawn:2, netEvery:10, netMax:2 }`: at spawn `throwNet(…, 'red', m.id)` twice; every 10 s one more while it has fewer than 2. When it dies, its red nets become `'net'` with `netBy = null`.
- `bride: { hp:6, sp:0.035, r:22, coins:10, eat:0.5, pts:30, drop:2, veilReach:1, veilAgain:3 }`: veils the nearest living other monster within ±1 lane (`m2.veilBy = bride.id`), one at a time; 3 s after it dies, the next. A boss may be veiled (the Fallen Count, Task 9). When the Bride dies every `veilBy` pointing at her is cleared.

- [ ] **Step 1: Write the failing checks**: `check_glutton` (two red nets at spawn; no damage while either stands; after both fly it takes damage; a third net at 10 s only below 2; on death its red nets turn normal), `check_bride` (veils the nearest neighbour; it takes no damage until the Bride dies; re-veils 3 s after the veiled one dies), `check_glutton_bride` (a veiled Glutton with its nets gone is still shielded until the Bride dies), `check_shield_all_sources` (while shielded: pumpkin, burn, glue, splash, lightning, mine, firework, Magnet pull hit and every tool leave its health unchanged), `check_shield_continue` (red nets' `netBy` and `veilBy` survive a continue, mapped to the restored monsters).
- [ ] **Step 2–4:** FAIL, implement, pass; strips to the scratchpad.
- [ ] **Step 5: Commit** "The Blood Glutton and the Bat Bride (Release 8)".

### Task 6: The Gatehouse and the Archer Tower

**Files:** `src/engine/keep.js` (`updateCastlePieces(dt)`, called from `game.js`' update), `src/engine/game.js` (castle entries gain `kind`: `castlesLayout` entries `[lane, p, kind?]`; `damageCastle` on a tower's fall spawns its archer; snapshot), `src/engine/render/fx.js` (ports of `gate` and `tower` from `docs/archive/nightmare-monsters/castle-walls/walls.js`, baked per state beside `bakeCastle`), `src/engine/render/draw.js`, `src/data/levels.js` (field `gatePool: string[]`)

**Values:** castle entry `{ lane, p, hp, maxHp, flash, dead, kind:'wall'|'gate'|'tower', t }`.
- Gate: `hp = 2.5 × level castle hp`, every `GATE_EVERY = 8` s plays `open`, spawns one monster from `def.gatePool` at its lane and p, plays `shut`. Dead → no more.
- Tower: `hp = 1.5 × level castle hp`; every `TOWER_SHOT = 5` s pushes an arrow down its lane (`G.arrows`, 3 wall damage, the Skeleton Archer's); pumpkins of every colour stop at it (Grey too: a tower is not passed by Grey's pierce). On death plays `crumble` and spawns an `archer` at its p that holds and shoots at once, not stunned.

- [ ] **Step 1: Write the failing checks**: `check_gatehouse` (a monster from the pool walks out every 8 s, one at a time; a Green hits the gate, not what is behind it; destroyed → no more), `check_archer_tower` (an arrow every 5 s takes 3; a Grey stops at the tower and does not reach the archer; on its fall an archer stands at its p and shoots within its normal reload, no daze), `check_castle_pieces_continue`, `check_castle_pieces_budget`.
- [ ] **Step 2–4:** FAIL, implement, pass; a frame of a night with both to the scratchpad.
- [ ] **Step 5: Commit** "The Gatehouse and the Archer Tower (Release 8)".

### Task 7: The Crookneck Gourd, the picker and the N4-3 tutorial

**Files:**
- `git merge r7` first (Release 7's Wartling and three-gourd picker).
- Modify: `src/data/gourds.js` (`crookneck` under `__RELEASE__ >= 8`: name "Crookneck Gourd", role "Breaks nets"), `src/engine/gourd.js` (`inCrookSquare(r, c)`; break clears all nets via `clearNets()`), `src/engine/board.js` (the square's group in `computeGroups`/`resolveMatches`), `src/engine/combat.js` (`launchGroup` merges groups), `src/engine/render/gourd.js` (the archive's Crookneck from `docs/archive/gourds/`: lime `#b9cf3c`, bumpy base, crook neck, stem at the tip, toy face; lime square glow tile), `src/engine/coach.js` (`coach:'crookneck'`), `src/save.js` (`seenCrookneckCoach`), `src/ui/screens.js` (picker with four gourds: two slots; a level's `gourdLock` keeps one slot)

**Interfaces:**
- `inCrookSquare(r, c) -> boolean`: inside the 3×3 of a standing Crookneck (no allocation).
- Square group: after the colour groups, for each standing Crookneck the non-flying pumpkins in its 3×3 (gourds excluded), if at least `CROOK_MIN = 2`, form one group `{ color: CROOK, cells, crook:true }` (`CROOK = -3`, a pseudo-colour no pumpkin has). Its cells light up.
- `launchGroup(ref)`: the cells launched are the union of the primary group and every group sharing a cell with it (one step: a crook group pulls in each normal bunch touching it, and a normal bunch pulls in the crook group it touches); each cell launches once, as itself (`type: cell.c`, its own level; a Rainbow in a crook group flies as Green; Paint pulls as usual).
- Level fields `gourds` (offered kinds) and `gourdLock: 'crookneck'` (N4-3 only: that kind fills slot 1, locked).
- Coach `'crookneck'` on N4-3: slide the Crookneck; launch a mixed group from its square; a net lands next to it, not inside; hold to break it, every net goes; "Nice!"; the night carries on.

- [ ] **Step 1: Write the failing checks**: `check_crook_no_net` (`canNet` false for every cell in the square, true just outside), `check_crook_group` (a Green and an Ice in the square light and launch together; one pumpkin alone does not light), `check_crook_launch_mix` (Rainbow, Paint, Brown, Turquoise, Magnet and a netted pumpkin in the square each launch once as themselves; a square cell also in a 3-bunch outside launches once and the whole bunch goes too), `check_crook_break` (eight nets, two red, on the patch → none after the break; a Glutton then takes damage), `check_picker_four_gourds` (four tiles, two slots; N4-3 has Crookneck locked; N3 and N2 pickers unchanged), `check_crook_coach`, `check_crook_unlock` (opening N4-3 gives `save.gourds.crookneck`).
- [ ] **Step 2–4:** FAIL, implement, pass; screenshot the picker at phone size and a Crookneck strip to the scratchpad.
- [ ] **Step 5: Commit** "The Crookneck Gourd (Release 8)".

### Task 8: The Siege Tower (mini boss)

**Files:** `src/engine/keep.js` (`initSiege`, `updateSiege`, `siegeSnapshot`, `restoreSiege`), `src/engine/render/chars/keep.js` (port of `siegetower` from `docs/archive/nightmare-monsters/minibosses-hollow-keep/minibosses.js`, variants `a2`/`a1`/`a0` via `vkeyOf`), `src/engine/monsters.js` (boss dispatch beside the Treant's), `src/engine/combat.js` (hits go to archers first), `src/engine/audio.js`, `src/data/monsters.js`

**Values:** `siegetower: { boss:true, hp:24, r:34, sp:0.012, coins:40, eat:0, pts:300, drop:6, hold:0.35, archers:2, volleyEvery:6, volleyDmg:3, netEvery:9, rampEvery:12, noItems:true, form2:{ hp:34 } }`. Never past `hold`; immune to knockback and freeze. A pumpkin hit while `m.archers > 0` removes one archer (`knock`, no health lost); at 0 it takes damage. Volley: one arrow per archer down its lane. Ramp: spawns `lancer` or `marshal` (50/50; `marshal` only if no Marshal it released lives) at its p + 0.04, `ramp` then `raise`. On death `break` and `clearNets(cell => cell.netBy === m.id)` (it throws with `by = m.id`). `bossChest:'normal'`.

- [ ] **Step 1: Write the failing checks**: `check_siege` (two hits knock the archers off with no health lost, the third hurts; a volley at 6 s; a net at 9 s; a Lancer or Marshal at 12 s, never two Marshals of its own; never past hold; its nets go on death, other nets stay; one normal chest), `check_siege_form2` (34 hp), `check_siege_continue` (archers left and clocks), `check_siege_baked` (< 10 MB at bake scale 2.5).
- [ ] **Step 2–4:** FAIL, implement, pass.
- [ ] **Step 5: Commit** "The Siege Tower (Release 8)".

### Task 9: The Fallen Count (N4-16)

**Files:** `src/engine/keep.js` (`initFallenCount`, `updateFallenCount`, `countClamped(m)`), `src/engine/render/chars/fallencount.js` (port of `docs/archive/fallen-bosses/` Count, own key `fallencount`, fallen look only, `maxK` capped under 12 MB), `src/engine/render/fx.js` (baked lightning column warning and bolt; the blood spear), `src/engine/monsters.js` (boss dispatch beside `vampirecount`), `src/engine/audio.js`, `src/data/monsters.js`

**Values:** `fallencount: { boss:true, hp:48, r:34, sp:0.03, coins:50, eat:0, pts:400, drop:6, hold:0.3, netAt:[1, 0.75, 0.5, 0.25], netN:3, tranceEvery:18, tranceHeal:1, tranceTick:2, tranceHits:3, spearEvery:10, spearHit:1/3, boltEvery:12, boltWarn:1.5, summonEvery:14, raiseEvery:20, gatePool:['knight', 'bulwark', 'vampire'], noItems:true }`.
- Walks like the Vampire Count to `hold` and stays in his lane (no bat scatter, no storm surge).
- Blood nets: at each `netAt` mark, 3 red nets with `netBy = m.id`; `countClamped(m)` is true while any stand, and his health cannot drop below the current mark while clamped (Fallen Hexwitch altar pattern; lazy `done` from health on the first frame).
- Trance: heals `tranceHeal × netCount()` every `tranceTick` s; 3 hits break it, 2 s stun.
- Spear: his fence loses `spearHit × full`, never below 1.
- Bolt: a random column flashes `boltWarn` s, then every pumpkin in it without a net is removed (gourds untouched).
- Summon: one `lancer` and one `bride`. Raise: one `tower` and one `gate` castle piece (Task 6), each only if none of his stands.
- `bossChest:'normal'`.

- [ ] **Step 1: Write the failing checks**: `check_fallen_count` (each ability on a forced timer; walks to 0.3 and stays in his lane), `check_fc_nets` (three red nets at start; no damage while they stand; a 20-damage hit at 80% stops at 75% and raises three more), `check_fc_trance` (with 4 nets he heals 4 per tick; 3 hits break it), `check_fc_bolt` (netted pumpkins and gourds survive the bolt), `check_fc_veiled` (a Bride's veil on him blocks damage until she dies), `check_fallen_count_continue`, `check_fallen_count_baked`.
- [ ] **Step 2–4:** FAIL, implement, pass; strip to the scratchpad.
- [ ] **Step 5: Commit** "The Fallen Count (Release 8)".

### Task 10: Levels N4-1 to N4-16, intro cards, bestiary, previews and docs

**Files:** `src/data/worlds/nightmare4.js`, `src/data/bestiary.js` (entries, `FALLEN[3] = { key:'fallencount' }`), `src/data/monsters.js` (`ALSO_BAKE` for the net and castle pieces), `src/ui/screens.js` (intro cards "Nets" on N4-1, "The Crookneck Gourd" on N4-3), `docs/GAME_DESIGN.md`, `docs/WORLDS.md`, `docs/LOOT.md`, `docs/RELEASES.md` (row 8 "Built"), `CLAUDE.md`

**Values:** names and themes from spec Part 6; `gourd:true` with `gourds:['grave', 'protector', 'wartling']` on N4-1 and N4-2, plus `'crookneck'` from N4-3 (`gourdLock:'crookneck'`, `coach:'crookneck'`); N4-4 and N4-13 `boss:'siegetower'` (N4-13 `bossForm:2`); N4-16 `boss:'fallencount'`; all `bossChest:'normal'`; castle layouts with `kind` per the table; `gatePool` on Gatehouse levels; pumpkins named by key; every level sets `spawnGap` and `spawnBurst`; three quests from existing quest types per level. Music: the regular nightmare track.

- [ ] **Step 1: Write the failing checks**: `check_n4_levels` (16 levels with the spec's names, every pool type in `TYPES`, intros where each new monster first walks in, every preview opens without a page error, bosses and chests as above), `check_n4_intros`, `check_n4_bestiary` (nightmare edition lists the new monsters and the Fallen Count last), `check_n4_prebake`.
- [ ] **Step 2–4:** FAIL, implement, pass.
- [ ] **Step 5: Commit** "Nightmare Crumbling Keep levels N4-1 to N4-16 (Release 8)".

### Task 11: The release matrix and the merge readiness check

- [ ] **Step 1:** Playtest build: `nm4_check`, `nm3_check`, `nm2_check`, `nm_check`, `w6_check --expect on`, `smoke_test`.
- [ ] **Step 2:** `VITE_RELEASE=7`, `6`, `5`, `4`, `3`, `2` and the store build: each check with its matching `--expect`.
- [ ] **Step 3:** Fix anything that fails in the task that owns it; commit.
- [ ] **Step 4:** Build a single-file playtest (`tools/bundle_single.py`) and publish it as a **separate** private artifact for R8, not the shared playtest URL, until `r7` and `r8` are merged into `dev` with the owner's agreement.
