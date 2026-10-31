# Hallow's End 6-1 to 6-4 and the Frenzy Jukebox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four playable World 6 levels and the Frenzy jukebox, present only in `VITE_W6=1` builds.

**Architecture:** World 6 data and its song are imported behind `import.meta.env.VITE_W6`, so Rollup drops them from store builds. Engine additions are generic level fields (`opensAfter`, `puddlesLayout`, `shoreFrac`, `frenzy`) plus a new two-lane `jukebox` monster modelled on the Loot Sack. Checks are a Playwright script (`tools/w6_check.py`) driven through the `?test` hook, plus the existing smoke test and balance bot.

**Tech Stack:** Plain JS ES modules, Vite 5, Canvas 2D, Python Playwright tools in `.venv`.

**Spec:** `docs/superpowers/specs/2026-10-31-hallows-end-first-levels-design.md`

## Global Constraints

- Branch `w6-hallows-end` only. Never merge into `r1-ground-rules`. Never build a store build (`npx cap sync`) from this branch.
- Flag: `import.meta.env.VITE_W6` (set with `VITE_W6=1 npm run build`). Flag off: five worlds, the 5-20 "coming soon" sneak peek, no World 6 book, no World 6 level names or song in `dist/`.
- Levels are data in `src/data/worlds/world6.js`; no level-specific numbers in the engine.
- Never call the Toy Plastic painter or set `shadowBlur` per frame: the jukebox is baked through the character registry (`render/anim.js`).
- Rules change → `docs/GAME_DESIGN.md` in the same commit.
- Never commit `monetization.md`, `dump.md`, `questdump.md`, `assets/music/drafts/*` (except moving `frenzy.mp3` out of drafts, owner OK). Stage files by name; never `git commit -a`.
- Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Publish to the playtest artifact only when the owner says "deploy".
- Test against builds: `npm run build` / `VITE_W6=1 npm run build`, then `python3 tools/serve_dist.py` (http://127.0.0.1:4173/).

## Review Focus

1. **A continued night (revive ad) on 6-4 after the jukebox fell:** it must not drop a second jukebox; if it was still standing, it comes back with the health it had. Test in Task 3.
2. **Fog over the jukebox:** it must stay drawn above fog like the Loot Sack (6-4 has fog bands; later levels may fog the top). Test in Task 3 (draw-order check by type list).
3. **Witches and the Hexwitch must never hex the jukebox**, and `hexAll` must skip it. Test in Task 3.
4. **Flag-off build regressions:** 5-20 win still shows the sneak peek; `isOpen` for worlds 2–5 unchanged; Endless tome still opens after 5-10. Test in Task 1.
5. **Taller phones:** fog bands, `shoreFrac` and castle rows are fractions, so 6-2's sea is half the field on 390×844 and 390×664. Test in Task 2 at both sizes.

---

### Task 1: Safety switch, World 6 wiring and background

**Files:**
- Modify: `src/data/worlds/index.js` (gated import, `WORLDS[5]`, `isOpen`)
- Modify: `src/data/worlds/world6.js` (one placeholder level so the book appears; replaced in Task 2)
- Modify: `src/data/lore.js:20-23` (book 6 blurb when the flag is on)
- Modify: `src/engine/render/sprites.js:437-450` (`buildBg` custom theme)
- Modify: `src/engine/render/nightmare/scenes.js` (export `hallowSky`, `hallowProps`)
- Modify: `src/main.js:66` (expose `LEVELS`, `isOpen`, `WORLD_LEVELS` on `__gg`)
- Modify: `tools/balance_bot.py:66-79` (`profile` for world 6)
- Create: `tools/w6_check.py`

**Interfaces:**
- Produces: `export const W6 = !!import.meta.env.VITE_W6` in `src/data/worlds/index.js`; `WORLD_LEVELS` has 6 entries only when `W6`; level field `opensAfter:number` (level-1 defs only, default 10); `WORLDS[5]` with `custom:'hallow'` and `base:0`; `tools/w6_check.py --url URL --expect on|off [--only NAME]`, one function per check, exit 1 on any failure.

- [ ] **Step 1: Write the check script with Task 1 checks**

`tools/w6_check.py` opens `URL?test` at 390×844, sets `__gg.save.stars` as needed, and runs:
- `check_flag(expect)`: `__gg.WORLD_LEVELS.length == (6 if on else 5)` and `__gg.LEVELS == (100 + len(world6) if on else 100)`.
- `check_bundle(expect)`: reads every `dist/assets/*.js`; the string `Attack and Defend` is present iff `on`.
- `check_open(expect)` (on only): with stars `{90:3}` only, `isOpen(101)` is false; with `{100:3}`, `isOpen(101)` is true. Both: with `{10:3}`, `isOpen(21)` is true (world 2 rule unchanged).
- `check_peek(expect)` (off only): `screens.js` still calls `openSoon` after the last level; assert `__gg.LEVELS == 100`.

The placeholder 6-1 in Step 3 carries `name:'Attack and Defend'` so `check_bundle` has a marker from the start.

- [ ] **Step 2: Run it against today's build and see it fail**

Run: `npm run build && .venv/bin/python tools/w6_check.py --url http://127.0.0.1:4173/ --expect off`
Expected: FAIL (`__gg.WORLD_LEVELS` undefined).

- [ ] **Step 3: Implement**

- `index.js`: `import world6 from './world6.js'` stays; `WORLD_LEVELS = W6 ? [w1..w5, world6] : [w1..w5]` so the expression is statically false in store builds and Rollup drops `world6`. `isOpen` level-1 branch: `return prev != null && !!save.stars[prev + (d.opensAfter || 10) - 1]`.
- `WORLDS` gets a sixth entry (theme index 5): the `hallow` palette from `scenes.js` THEMES (`sky`, `ground`, `moon`, `halo`, `sil`, `rim`, `soil`), `grass` as `scenes.js build()` derives it, `mist:null`, `custom:'hallow'`, `base:0`.
- `buildBg`: when `w.custom === 'hallow'`, call the exported `hallowSky(g, w, R, hz)` and `hallowProps(g, w, R, hz)` in place of `sky` + `PROPS[t]`; pass `w.base ?? t` wherever `t` indexes per-theme arrays (`field`, the moon arrays, the ground wave).
- `world6.js`: one level `{ world:6, level:1, theme:5, opensAfter:20, name:'Attack and Defend', pattern:0, graves:0, total:10, interval:3, spMul:1, boss:null, bossForm:1, pool:[['knight',1]], unlockPumpkins:[], unlockGear:[], intro:[] }`.
- `lore.js` book 6: blurb `W6 ? 'Every monster returns, and the jukebox starts the Frenzy.' : 'Coming in a future release.'` (import `W6`; avoid a cycle by reading `import.meta.env.VITE_W6` directly if `index.js` imports `lore.js`).
- `balance_bot.py profile`: `if w >= 5: lv, fence = 5, 3` before the offset clamp.

- [ ] **Step 4: Run both builds**

Run: `npm run build && .venv/bin/python tools/w6_check.py --url http://127.0.0.1:4173/ --expect off`, then `VITE_W6=1 npm run build && .venv/bin/python tools/w6_check.py --url http://127.0.0.1:4173/ --expect on`
Expected: PASS both. Then with the W6 build, screenshot `__gg.openBook(5)` and a `startGame('story', 101, [0,1,2,3,4])` frame and look at them: Hallow's End sky behind the field.

- [ ] **Step 5: Commit**

```bash
git add src/data/worlds/index.js src/data/worlds/world6.js src/data/lore.js src/engine/render/sprites.js src/engine/render/nightmare/scenes.js src/main.js tools/balance_bot.py tools/w6_check.py
git commit -m "World 6 behind VITE_W6: Hallow's End book and background, opens after 5-20"
```

---

### Task 2: Levels 6-1 to 6-3 with fixed puddles and a half-field sea

**Files:**
- Modify: `src/data/levels.js` (schema + `expandLevel`)
- Modify: `src/engine/game.js:47-52, 88-95, 193-199` (`puddlesLayout`, `shoreFrac`)
- Modify: `src/ui/screens.js:292` (puddle intro also for `puddlesLayout`)
- Modify: `src/data/worlds/world6.js`
- Modify: `tools/w6_check.py`

**Interfaces:**
- Consumes: Task 1's `W6`, `opensAfter`, theme 5.
- Produces: level fields `puddlesLayout: Array<[lane:number, p:number]>` (replaces random puddles) and `shoreFrac: number` (sea edge as a fraction of the field; wins over `shore`). `expandLevel` passes both through (`puddlesLayout:def.puddlesLayout || null`, `shoreFrac:def.shoreFrac || 0`, and `sea` true when `shoreFrac`).

- [ ] **Step 1: Add checks**

`check_levels` (on only), at 390×844 and 390×664:
- `startGame('story', 101, lo)`: `G.puddles` equals `[[1,.45],[3,.6],[5,.4]]` as `{lane,p}`; `G.castles.length == 7` and every `p == 0.9`; `graves` has exactly the arch cells `[[1,2],[1,3],[1,4],[2,2],[2,4],[3,2],[3,4]]`; `G.def.fog` is `[[0.2,0.8]]`.
- After `__gg.spawnMonster('crawler')` and `('turtle')`: each monster's `(lane, p)` matches one puddle.
- `startGame('story', 102, lo)`: `shoreP()`-equivalent read of a spawned knight's start `p` is within 0.03 of 0.5 at both sizes.
- `startGame('story', 103, lo)`: `G.castles.length == 7`, all `p == 0.35`; `G.def.gust.every == 22`; graves equal 6-2's; loadout contains both Fire (3) and Ice (2) after the auto-lock.

- [ ] **Step 2: Run, expect FAIL** (`G.puddles` random, levels missing).

Run: `VITE_W6=1 npm run build && .venv/bin/python tools/w6_check.py --url http://127.0.0.1:4173/ --expect on --only check_levels`

- [ ] **Step 3: Implement fields and level data**

- `game.js`: where `placePuddles(def.puddles)` runs (both places), `if (def.puddlesLayout) for (const [lane, p] of def.puddlesLayout) G.puddles.push({ lane, p }); else if (def.puddles) placePuddles(def.puddles);`. `shoreP()`: `d.shoreFrac ? Math.min(0.8, d.shoreFrac) : ` before the `shore` branch.
- `screens.js:292`: `(def.puddles || def.puddlesLayout)` in both halves of the test.
- `world6.js` (replace the placeholder; numbers are bot starting points for Task 5):

| | 6-1 Attack and Defend | 6-2 Timing! | 6-3 Fire and Ice, Round 2 |
|---|---|---|---|
| theme / opensAfter | 5 / 20 | 5 | 5 |
| total, interval, spMul | 24, 2.9, 1.0 | 22, 3.0, 1.0 | 16, 3.4, 0.95 |
| pool | knight 5, archer 4, crawler 5, turtle 2 | fogwalker 3, witch 3, mirror 4, knight 5 | mummy 6, firemummy 5 |
| fog | `[[0.2,0.8]]` | none | `[[0,0.6]]` |
| puddlesLayout | `[[1,.45],[3,.6],[5,.4]]` | none | none |
| sea / shoreFrac | none | `sea:true, shoreFrac:0.5` | none |
| castles / castlesLayout | `{n:7,hp:12}`, all lanes at 0.9 | none | `{n:7,hp:12}`, all lanes at 0.35 |
| gust | none | none | `{every:22, dirs:['left','right']}` |
| gravesLayout | arch (above) | pillars `[[1,1],[2,1],[3,1],[1,5],[2,5],[3,5]]` | same as 6-2 |
| quests | `[['noTools'],['wallMin',50]]` | `[['noTools'],['bunch5',2]]` | `[['bunch5',2],['wallMin',50]]` |

All three: `boss:null, bossForm:1, pattern:0/1/2, graves:0, unlockPumpkins:[], unlockGear:[], intro:[]`.

- [ ] **Step 4: Run, expect PASS**, plus `.venv/bin/python tools/smoke_test.py --url http://127.0.0.1:4173/`.

- [ ] **Step 5: Commit**

```bash
git add src/data/levels.js src/engine/game.js src/ui/screens.js src/data/worlds/world6.js tools/w6_check.py
git commit -m "Hallow's End 6-1 to 6-3: fixed puddles under fog, half-field sea, castle rows"
```

---

### Task 3: The Frenzy jukebox and level 6-4

**Files:**
- Modify: `src/data/monsters.js` (`TYPES.jukebox`, `MNAME.jukebox`, `FRENZY_INTRO`)
- Modify: `src/data/economy.js` (no change; read `SACK.hpBase`, `SACK.hpPerWorld`)
- Modify: `src/engine/monsters.js` (`lanesOf`, `standsStill`, hex exclusions at :85 and :270, `spawnJukebox`, update branch)
- Modify: `src/engine/spawner.js:22-38` (drop trigger, keep-coming)
- Modify: `src/engine/combat.js:45` (`damage`: tools don't hurt it), `:172-174` (reward roll, colour)
- Modify: `src/engine/game.js:84, 426, 455-468` (state, continued night)
- Modify: `src/engine/render/draw.js:58,70` (draw over fog like the sack)
- Modify: `src/engine/render/chars/extra.js` (jukebox drawing + registry entry)
- Modify: `src/engine/audio.js:65` (look up `MUSIC_W6`)
- Create: `src/data/music_w6.js` (generated)
- Modify: `tools/music_build.py` (second output for World 6 tracks)
- Move: `assets/music/drafts/frenzy.mp3` → `assets/music/frenzy.mp3`
- Modify: `src/ui/screens.js:291-292` (Frenzy intro card)
- Modify: `src/data/worlds/world6.js` (6-4)
- Modify: `tools/w6_check.py`

**Interfaces:**
- Consumes: Task 2's `puddles`, `castlesLayout`, fog bands.
- Produces: `TYPES.jukebox = { hp:30, r:40, sp:0, coins:20, eat:0, pts:120, drop:3, noKnockback:true }` (hp is overwritten at spawn); `spawnJukebox(): Monster` (two lanes `lane, lane+1`, random `lane ∈ [0, COLS-2]`, `p = 0.02`, `m.hw = CS*0.95`, `hp = SACK.hpBase + SACK.hpPerWorld*(worldNo-1)` unless `def.frenzyHp`); `G.jukebox` (the live monster or null) and `G.jukeboxDone` (true once smashed); level fields `frenzy:boolean`, `frenzyAt:number` (default 0.8), `frenzyHp:number`; music key `'frenzy'`; continued-night snapshot gains `jukebox:{ done:boolean, hp:number|null }`.

- [ ] **Step 1: Add checks**

`check_jukebox` (on only), `startGame('story', 104, lo)`:
- Before 80%: no `jukebox` in `G.monsters`. Set `G.spawned = Math.ceil(G.def.total*0.8)`, tick ~1 s: exactly one `jukebox`, `p <= 0.05`, `hp == 30`, `lanesOf` spans two lanes.
- Tool hit: `m.lastHit = -1; damage(m, 4)` → hp still 30. Pumpkin hit: `m.lastHit = 0; damage(m, 4)` → hp 26.
- Hex: `G.monsters.filter(o => o.colourLock != null || o.colourImmune != null)` never includes it after 20 s with witches in play.
- Keep coming: with the jukebox alive and `G.spawned = G.def.total`, after 10 s `G.spawned > G.def.total`; `G.over` false even with every other monster removed.
- Smash: `damage` it to 0 → `G.jukeboxDone == true`, `G.jukebox == null`; spawning stops at the next tick; removing the rest ends the night with a win.
- Continued night: take `continueState()` after the jukebox fell, restore it with `continueNight(c)`, advance to 80%: no new jukebox. Snapshot with the jukebox at 12 hp: it comes back at 12.
- Draw order: `draw.js` sack-over-fog lines include `'jukebox'` (string check on the bundle is acceptable).
- Bundle check (off build, extend `check_bundle`): `frenzy` music data URI absent; jukebox code may be present (inert).

- [ ] **Step 2: Run, expect FAIL** (no jukebox type).

- [ ] **Step 3: Implement the jukebox rules**

- `spawner.js storySpawn`: `if (d.frenzy && !G.jukebox && !G.jukeboxDone && G.spawned >= Math.floor(d.total * (d.frenzyAt || 0.8))) G.jukebox = spawnJukebox();` and `keepComing = (boss rule) || (d.frenzy && G.jukebox && !G.jukebox.dead)`. On drop: `banner('Frenzy!', 'Smash the jukebox to stop the monsters.', 2.4)` and `musicStart('frenzy')`.
- `combat.js kill()`: when `m.type === 'jukebox'`: `G.jukebox = null; G.jukeboxDone = true;` and `musicStart('w' + worldNo` with the same fallback as `game.js:100`). The reward uses the normal `rollReward()` path.
- `damage()`: first line after `if (m.dead) return;`: `if (m.type === 'jukebox' && m.lastHit === -1){ m.flash = 0.1; addFloat('Pumpkins only', …); return; }`.
- `lanesOf`/`standsStill`: treat `jukebox` like `sack`. Hex filters (`monsters.js:85`, `:270`): exclude `jukebox`. `updateMonster`: a jukebox only ages and pulses; it never moves or eats.
- `game.js` state init: `jukebox:null, jukeboxDone:false`. Snapshot: `jukebox:{ done:g.jukeboxDone, hp:g.jukebox && !g.jukebox.dead ? g.jukebox.hp : null }`, and `alive` excludes `jukebox`. Restore: `G.jukeboxDone = c.jukebox.done`; if `hp != null`, spawn it at once with that hp.
- `draw.js:58,70`: `(m.type === 'sack' || m.type === 'jukebox')`.
- `screens.js`: `if (def.frenzy && !(n > 1 && levelFor(n - 1).frenzy)) cards.push({ key:'frenzy', icon:'🎵', title:'Frenzy', text:FRENZY_INTRO })` with `FRENZY_INTRO = 'Near the end of the night a jukebox drops at the top of the field. Monsters keep coming while it plays. Only pumpkins can smash it.'`
- `MNAME.jukebox = 'Jukebox'`, colour `'#c0392b'` in `combat.js:174`.

- [ ] **Step 4: Art and music**

- Drawing `jukebox(g, P)` in `extra.js`, Toy Plastic per `docs/ART_BRIEF.md`: an arched wooden cabinet, glowing pumpkin-orange tube lights, a grille with a carved jack-o'-lantern face, a record visible behind glass; about the sack's footprint (box `{ x:-128, y:-150, w:256, h:210 }`, `scale:.7`). Clips: `play` (n:8, fps:8; lights cycle, record turns, small note sprites puff out) and `hurt` (n:4). Registry `frame()` returns `play` always. Check with `.venv/bin/python tools/char_sheet.py --keys jukebox --out <scratchpad>/jukebox.png --url http://localhost:5199/` (dev server `npx vite --port 5199`) and look at the strip.
- Music: `git mv` is not possible (untracked), so `mv assets/music/drafts/frenzy.mp3 assets/music/frenzy.mp3`. In `music_build.py` add `TRACKS_W6 = { 'frenzy': 'frenzy.mp3' }`, written the same way to `src/data/music_w6.js` as `export const MUSIC_W6 = { frenzy: t0 };`. `audio.js`: `import { MUSIC_W6 } from '../data/music_w6.js'; const W6M = import.meta.env.VITE_W6 ? MUSIC_W6 : {};` and `const uri = MUSIC[key] || W6M[key];`. Rerun the tool; `src/data/music.js` must be unchanged (`git diff --stat src/data/music.js` empty).

- [ ] **Step 5: Level 6-4 data**

`{ world:6, level:4, theme:5, name:'A Revisit', pattern:3, graves:0, total:26, interval:2.9, spMul:1.0, boss:null, bossForm:1, frenzy:true, pool:[['firemummy',3],['doctor',3],['witch',3],['vampire',2],['bulwark',2],['turtle',3]], puddles:3, castles:{ n:7, hp:12 }, castlesLayout:[0..6 at 0.5], fog:[[0.3,0.46],[0.54,0.7]], gust:{ every:22, dirs:['left','right'] }, gravesLayout:[[1,3],[2,2],[2,3],[2,4],[3,3]], quests:[['noTools'],['wallMin',40]], unlockPumpkins:[], unlockGear:[], intro:[] }`

- [ ] **Step 6: Run checks (on and off builds) and the smoke test; expect PASS.** Then play 6-4 in a browser at phone size to the jukebox drop and look at it: drawn above fog, lights animate, music switches and switches back.

- [ ] **Step 7: Commit**

```bash
git add src/data/monsters.js src/engine/monsters.js src/engine/spawner.js src/engine/combat.js src/engine/game.js src/engine/render/draw.js src/engine/render/chars/extra.js src/engine/audio.js src/data/music_w6.js tools/music_build.py assets/music/frenzy.mp3 src/ui/screens.js src/data/worlds/world6.js tools/w6_check.py
git commit -m "Frenzy jukebox: drops at 80% of the night, monsters keep coming until pumpkins smash it; 6-4 A Revisit"
```

---

### Task 4: Docs in sync

**Files:**
- Modify: `docs/GAME_DESIGN.md` (World 6 beta section: flag, opens after 5-20, the four levels' maps; the jukebox rule; new level fields `opensAfter`, `puddlesLayout`, `shoreFrac`, `frenzy`, `frenzyAt`, `frenzyHp`; decisions log entry 2026-10-31)
- Modify: `docs/WORLDS.md` §3 row 6, §4, §6, §10 (owner's new direction: hand-designed levels, cross-world mixes, Frenzy from 6-4, boss plan 8/12/16/20 marked "owner still thinking"; backlog: a faster-pace jukebox, maybe for nightmare)
- Modify: `CLAUDE.md` current state (branch `w6-hallows-end`, `VITE_W6`, never a store build from it) and the "World 6 deferred" line
- Modify: `docs/superpowers/specs/2026-10-31-hallows-end-first-levels-design.md` Goals: "byte-for-byte" → "plays the same; no World 6 levels, book or song in the bundle"

- [ ] **Step 1: Edit the four files.**
- [ ] **Step 2: Verify:** `grep -n "jukebox\|opensAfter\|puddlesLayout\|shoreFrac" docs/GAME_DESIGN.md` shows each field.
- [ ] **Step 3: Commit** (`git add` the four paths by name).

---

### Task 5: Balance with the bot and record

**Files:**
- Modify: `src/data/worlds/world6.js` (numbers only)
- Modify: `docs/GAME_DESIGN.md` (balance section)

- [ ] **Step 1: Baseline.** `VITE_W6=1 npm run build`, serve, then `.venv/bin/python tools/balance_bot.py --nights 101,102,103,104 --repeats 3 --offset 0 --url http://127.0.0.1:4173/` and the same with `--offset -1`. Check the bot can damage the jukebox (it aims at monsters by `m.hw`, so it should; if the bot never wins 6-4 because of the jukebox, fix the bot's targeting, not the rule).
- [ ] **Step 2: Tune `total`, `interval`, `spMul` and castle `hp`** until each night wins at least 2 of 3 at offset 0 and at most 1 of 3 at offset -1. Change one level at a time and rerun that night with 3 repeats.
- [ ] **Step 3: Record** the before/after table in `GAME_DESIGN.md`'s balance section, as earlier worlds do.
- [ ] **Step 4: Final checks:** `w6_check.py` on both builds, `smoke_test.py` on both builds.
- [ ] **Step 5: Commit** (`world6.js`, `GAME_DESIGN.md`). Do not publish; tell the owner it is ready and wait for "deploy".
