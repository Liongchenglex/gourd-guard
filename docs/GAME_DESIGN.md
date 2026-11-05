# Gourd Guard: Game Design Document

Working title: **Gourd Guard** (placeholder; see "Name and IP" below).
Status: playable prototype, Vite project (`src/`, built to `dist/`). Target: a 120-level mobile game (6 worlds × 20 levels). The Release 1 target design is locked in `docs/WORLDS.md`; this document describes the game as currently built.

This document is the source of truth for the rules. When a rule changes in code, update it here in the same change.

---

## 1. Pitch

A Halloween lane-defense puzzle game. Monsters walk down seven columns toward your pumpkin patch. You slide pumpkins around the patch to bunch 3+ of the same color, then flick the bunch so each pumpkin flies straight up its own column at the monsters. Every column has its own wall; monsters that reach it start eating it, and if any wall falls the night is lost.

Design pillars:
- **Positioning puzzle under pressure.** Pumpkins only fly straight up, so building bunches *under the right columns* is the core skill.
- **Readable, tactile controls.** One finger: swipe, flick, tap, hold.
- **Scarcity.** Pumpkins are limited (sprouts, drops, spawns), so every throw matters.

---

## 2. Screen and board

- Logical canvas width 540. Height adapts between 900 and 1200 to fill phone screens; everything scales.
- **Field** (top): 7 lanes aligned exactly with the 7 board columns. Monsters walk down their lane.
- **Walls**: one wall segment per column at the bottom of the field, each with its own health bar.
- **Patch / board** (bottom): 7 columns × 5 rows, cell size 74 logical px.
- A thin green bar under the patch shows the time until the next sprout (red when the patch is full).

### Starting patterns
Each night starts from a set pattern (`X` = pumpkin, `.` = empty), chosen by `(night − 1) mod 5`. Colors are assigned randomly from the night's loadout, avoiding pre-made bunches of 3.

```
P0            P1            P2            P3            P4
X.X.X.X       .......       X..X..X       ...X...       X...X.X
.X.X.X.       ..X.X..       X..X..X       ..XXX..       .X.X...
X.X.X.X       .XX.XX.       XX.X.XX       .XX.XX.       X.X..XX
.X.X.X.       XXX.XXX       XX...XX       XXX.XXX       .X.XX..
X.X.X.X       XXXXXXX       XXX.XXX       .XXXXX.       XX..X.X
```

### Graves
Immovable obstacles placed on empty pattern cells at night start. They block slides and pushes, are never filled by sprouts or drops, and can only be removed with the Grave buster tool (§10). Counts come from level data (`src/data/worlds/world1.js`): world 1 uses 0 (levels 1–2), 1 (3–5), 2 (6–9), 3 (10–14), 4 (15–20).

---

## 3. Controls

| Input | Effect |
|---|---|
| Swipe a pumpkin | It slides in that direction until it hits the edge, a grave, or another pumpkin. |
| Swipe a pumpkin that is already touching another in that direction | **Push**: it and the whole touching line in front of it move together until the front one hits the edge, a grave, or a pumpkin. (Swipe the back of a row to move the row.) |
| Swipe a **lit** pumpkin upward | Launch its whole bunch. |
| Tap a lit pumpkin | Launch its whole bunch. |
| Swipe a lit pumpkin sideways or down | Slides/pushes it like any pumpkin (can break its bunch). |
| Press and hold a pumpkin 0.6 s | Smash it (a ring fills while holding; move or release early to cancel). |
| Tap a dropped pumpkin in the field | It flies over the wall into the top-most empty cell of its column (or the nearest column with space). |
| Drag a finger across the field | Every dropped pumpkin or tool the finger passes over is collected (owner, 2026-09-25). |
| Space / F / R / P or Esc | Launch best bunch / firework / wall repair / pause (desktop). |
| Restart (pause menu) | Goes back through the pumpkin picker before the level restarts (owner, 2026-09-26). |
| Pause menu | Resume, Restart, Settings (the same volume panel; Done returns to the pause menu), Quit to level select (opens the book of the night being played; owner, 2026-09-27) and Sound on/off only. Sprout timing and powers are settled before the night starts (owner, 2026-09-27). |
| Settings | A gear button beside Shop on the storybook shelf opens Music and Sound effects volume sliders (0–100%, saved as `save.musicVol` / `save.sfxVol`); each drives its own gain bus under the limiter. |

Hints: after ~6 s idle with no lit bunch, the game outlines one pumpkin with an arrow showing a slide/push that builds a bunch (weighted toward columns with monsters).

---

## 4. Bunches and launching

- A **bunch** is 3+ orthogonally touching pumpkins of the same color (2+ for Turquoise). Any shape counts (lines, L-shapes, clumps).
- "Lit" is a live state: pumpkins glow only while they are in a bunch. Moving one out unlights it.
- **Rainbow** pumpkins count as any color. A rainbow can belong to two different-colored bunches at once. Three or more rainbows touching with no colored pumpkin form a bunch that acts as Green.
- **Launching**: every pumpkin in the bunch flies straight up its own column at 900 px/s and hits the first monster in that column. If the column is empty it flies to the end and is wasted.
- A rainbow launched in a bunch acts as that bunch's color and level.
- **General rule: a bunch of 5 or more guarantees knockback** (1 tile) on every hit, regardless of color. Bosses are immune to knockback.
- Launched pumpkins leave empty cells; there is no gravity or refill.

---

## 5. Pumpkin types

| Type | Color | Role | Unlocks |
|---|---|---|---|
| Green | green | Normal | Level 1-1 |
| Yellow | yellow | Normal, plus coins: a Yellow kill skips the reward roll and pays coins ×2, ×2, ×3, ×3, ×4 by level | Level 1-2 |
| Ice | ice blue | Freeze | Level 1-3 |
| Fire | red | Flame | Level 1-8 |
| Grey | grey | Piercing (also passes castle walls, damaging them) | Level 4-4 |
| Purple | purple | Spawn: every launched Purple bunch spawns one pumpkin on its first hit; each kill may spawn another (25/40/50/60/70% by level); spawns are rainbow 10/20/30/40/50% | Level 3-3 |
| Deep Blue | deep navy | Chain: lightning runs along the row of the monster hit and strikes the nearest 3/3/4/5/5 monsters (including it) at 25/50/50/75/75% power. Knockback like Green. | Level 5-4 |
| Pink | pink | Heal: every Pink repairs the wall of its column by 1/1/2/2/3 as it flies over the fence, whether or not it hits a monster (owner, 2026-09-27; was on each hit). Knockback 50/50/50/75/75%. | Level 2-8 |
| Black | black | Blast: explodes on its first hit for full power; the splash covers 3 lanes × 1 tile height (levels 1–3) or 3 × 3 (levels 4–5) at 50/50/75/75/100% power; level 5 splash also knocks back. Against a castle wall ×1.5. Knockback like Green. | Level 4-9 |
| Turquoise | turquoise | Bunches of 2 light up and launch (everything else needs 3); power is half of Green's: 0.5, 0.5, 0.75, 0.75, 1; knockback like Green. | Level 3-6 |
| Brown | brown | Grows on the patch by time since it appeared: small until 4 s, medium until 8 s, then big (level 3–4: 3 s and 6 s; level 5: 2 s and 4 s). Power = Green's × 0.5 / 1 / 2 by size; sizes mix in one bunch and each projectile hits for its own size. Knockback 0, 50, 50, 100, 100% by level. | Level 5-7 |
| White | white | Boomerang: a throw that hits nothing flies back into the patch and does not count as a miss. Levels 1–2: top-most empty cell of its column (else the nearest column with space); levels 3+: an empty cell beside a same-colour pumpkin when one exists. Knockback like Green. | Level 2-3 |
| Paint | lilac with mint, peach, butter and sky-blue patches | **Palette pull** (owner, 2026-10-08): when 3+ Paint light up, the pumpkins of any colour touching the bunch launch with it in one flick, each with its own colour, level and ability: up to 2 / 3 / 4 / 5 / every touching pumpkin by level. It may borrow a pumpkin that is lit in its own bunch: only the touching ones come, and the rest of that bunch is left unlit (owner, 2026-10-09). When there are more than the cap, the most threatened columns go first. Borrowed pumpkins light up with their carved faces under a pulsing lilac dashed rim. Pulled pumpkins count toward the 5+ guaranteed knockback. **Inherits a power** (owner, 2026-10-09): the Paint pumpkins launch with the ability of the colour they borrow most (a tie goes to the colour in the most threatened column), at Paint's own level, keeping their lilac look; a small lit pumpkin of that colour sits on each Paint pumpkin while the bunch is lit. A Paint pumpkin that inherited a colour **counts as both** for colour rules (owner, 2026-10-09): a chameleon locked to Paint or to the inherited colour takes the hit, and a reversed chameleon immune to either shrugs it off; borrowed pumpkins count only as themselves. With nothing to inherit they stay plain Paint: power 1 / 1 / 1.5 / 1.5 / 2, knockback like Green. A pulled Rainbow flies as Paint. Lit face: a cheeky wink. Art: `render/paintpumpkin.js`. | **Post-game**: bought for 100 seeds once 5-20 is beaten, then usable in every level |
| Beige (Release 3) | pinkish skin beige, a soft nude pink (owner, 2026-11-03: #e9ada0; the first tan and then the peach #dca883 still read as brown-tan) with glossy glue drips from the stem | **Glue** (owner, 2026-11-02; on every hit since 2026-11-03, was kills only, which felt too weak): every Beige pumpkin hit leaves glue on the field where the monster was hit, whether or not it dies: 1 tile at levels 1–2, 3 tiles across at levels 3–4, a plus of 5 tiles at level 5 (tiles off the field are dropped), lasting 2 / 4 / 6 / 8 / 10 s (owner, 2026-11-03; was 1–5 s). A tile that already has glue gets nothing (no stacking, no refresh). A monster in glue walks at half speed (not on top of Ice's slow) and loses 0.3 every 1 s; glue counts as neither Fire nor Ice, so it cannot finish a Mummy or a Flaming Mummy; glue's own bites lay no glue; the glue on the field is the pumpkin's pinkish skin beige (owner, 2026-11-03: it was tan); the Loot Sack and the jukebox ignore it. Power 1 / 1 / 1.5 / 1.5 / 2, knockback like Green. Lit face: a sticky satisfied grin. No skin yet. | **Post-game**: bought for 50 seeds once 6-16 is beaten, then usable in every level |
| Rainbow | multicolor | Wildcard, no level | Rare (see below) |

### Level tables (levels 1–5, bought in the shop per type)

All types share the power curve: **1, 1, 1.5, 1.5, 2** (power = damage per hit).

| Level | Knockback chance (Green, Yellow, Grey, Purple) | Ice | Fire (burns × power) | Purple extra spawn on kill |
|---|---|---|---|---|
| 1 | none | slow 1.5 s | 2 × 0.1 | 25% |
| 2 | 25% | slow 2 s | 2 × 0.2 | 40% |
| 3 | 25% | slow 3 s, 25% freeze | 3 × 0.2 | 50% |
| 4 | 50% | slow 4 s, 50% freeze | 4 × 0.3 | 60% |
| 5 | 50% | slow 5 s, 50% freeze | 5 × 0.3 | 70% |

Details:
- **Knockback**: pushes the monster back up its column by one tile (one cell height). A monster eating a wall is pulled off it.
- **Ice**: slowed monsters move at 50% speed, eat walls at 50%, and turn blue. Frozen monsters stop completely (drawn inside an ice block) for the same duration and don't eat. New hits refresh timers; they don't stack. Bosses can be slowed but not frozen. Ice and Fire only knock back via the 5+ bunch rule.
- **Fire**: burns tick every **1 second**, first tick 1 s after the hit. A new fire hit refreshes to the larger count/amount.
- **Grey**: pierces every monster in its column; each hit rolls knockback separately.
- **Purple**: on a kill, may spawn an extra random pumpkin (from the loadout, never rainbow unless the level allows) that flies directly into a random empty cell of the patch. Nothing spawns if the patch is full.
- **Rainbow sources**: Purple level 4–5 spawns; 3% of sprouts and drops; every boss drop includes one rainbow.

### Upgrade costs per pumpkin type (owner's `monetization.md`, 2026-09-27; data in `src/data/economy.js`)
| Group | 1→2 | 2→3 | 3→4 | 4→5 |
|---|---|---|---|---|
| Green, Yellow | 100 coins | 300 coins | 600 coins | 1,500 coins |
| Fire, Ice, White, Pink, Purple, Turquoise | 100 coins | 500 coins | 3,000 coins | 5,000 coins (owner, 2026-10-08; was 50 seeds) |
| Grey, Black, Deep Blue, Brown | 1,000 coins | 2,500 coins | 5,000 coins (was 50 seeds) | 50 seeds (was 100; owner, 2026-10-08) |
| Paint (unlock 100 seeds after 5-20) | 30 seeds | 50 seeds | 80 seeds | 120 seeds |
| Beige (unlock 50 seeds after 6-16; Release 3; owner, 2026-11-03: was 5,000 / 10,000 coins, 50 / 75 seeds) | 3,000 coins | 5,000 coins | 10,000 coins | 50 seeds |

The balance bot's expected upgrade profile has not been re-checked against these prices yet.

### The Grave Gourd (Release 4, nightmare levels with `gourd:true`)
Not a pumpkin: a taller piece on the patch (`src/engine/gourd.js`, art `src/engine/render/gourd.js`, name and text `src/data/gourds.js`). Spec: `docs/superpowers/specs/2026-11-04-release-4-nightmare-patch-design.md` Part 3.
- **Look**: the Calabash from `docs/archive/gourds/` (amber `#e3a43c`, tall bottle gourd, pinched waist, curly stem), with the pumpkins' toy face always on. About as wide as a pumpkin, on the same soil line, taller than its cell (drawn outside the patch clip, so in the top row it reaches over the fence's foot). Baked once per canvas scale; its 3×3 square is one baked amber glow tile, cut to the patch at edges and corners, pulsing in alpha only.
- **Where**: one gourd on the patch on every level with `gourd:true` (N1-5 on; unlocked by beating N1-4, `unlockGourds:['grave']` → `save.gourds.grave`). At night start it takes the centre cell (row 2, column 3), replacing what the pattern put there; if a grave covers the centre, the nearest cell without one.
- **It moves**: slides and is part of a push line like a pumpkin (wind moves it too). It **never joins a bunch, never lights up and is never flicked**: it has colour index `GOURD` (−1), never enters `computeGroups`, a Rainbow does not match it, Paint does not pull it, the hint arrow and `boardScore` ignore it, the Poltergeist cannot repaint it and the Hollow King's wipe skips it. A White landing "beside its colour" ignores it.
- **Breaking it**: press and hold it, the same hold as crushing a pumpkin (0.6 s, 0.35 s with Quick smash); a swipe that moves becomes a slide. It cracks (amber chunks, the smash sound) and **every grave in the 3×3 around it is cleared** (free: no Grave buster is used); pumpkins in the square are untouched. Nothing else destroys it (the Hayrick's pitchfork skips it, monsters never reach it).
- **It comes back** on the very next sprout tick, in a random empty cell, using that tick's gourd slot (`G.gourdDue`). If the patch is full it waits for the first tick with a free cell.
- **Its power**: see §6 (one slot of every sprout tick fills its square).
- **Edges**: its square is 8 cells, 5 on an edge, 3 in a corner.
- **A continued night** keeps the gourd in its cell (the nearest free cell if a grave now covers it), or keeps it due back if it was broken.
- **Picker** (the gourd is its own pick, owner 2026-11-05): on a `gourd:true` level the title reads "Pick N pumpkins and 1 gourd", and the pinned header labels the **Your team** row and, set apart by a gap and a dashed amber rule, a single **Your gourd** slot (`#loGourdSlot`, an amber oval a little taller than a team slot) holding the Grave Gourd, so the two never read as one row of six. A **Gourd · pick 1** section under Pumpkins holds one tile per gourd (amber when picked); tapping it puts that gourd in the slot and shows its card. With one gourd it starts picked and locked: the slot shows a lock and tapping it only shows the card (it can't be emptied; a gourd night needs a gourd). Start night needs the N pumpkins and the gourd; the pumpkin count and the gourd count never mix (the gourd is passed on as `loadoutGourd`; the engine places the level's one gourd). Built so later gourds are a choice of one from several with the same slot. On story nights none of this shows and the picker looks as before. A gourd night **always opens the picker** (controller ruling, 2026-11-04), even with 5 or fewer pumpkin types unlocked, so the Gourds section is seen; the pick count is then capped at the types on offer (a player who has beaten only world 1 picks all 4). Story levels still skip the picker at 5 or fewer types.
- **Tutorial** (Task 9, `coach:'gourd'` on N1-5, `save.seenGourdCoach`): a second script of the first-night coach (`src/engine/coach.js`), played the first time N1-5 is played. The patch is cleared to just the gourd (the level's graves stay: N1-5 rings the gourd's start cell with five graves, one of them stopping its slide at (2, 4)). Monsters and sprouts wait (`coachHolds`) through every step; the script runs its own two sprout ticks through the real `spawnSprouts()`. (1) A hand slides the gourd, "This is the Grave Gourd. Drag it to slide it, like a pumpkin." The step ends only when the gourd reaches the cell the hand showed; a slide anywhere else keeps the hand, which then shows the way again from the gourd's new cell (the player can try again). (2) Once it is there, "Every sprout fills the space around your gourd" and a tick fills its 3×3. (3) The hand presses and holds the gourd under "Press and hold the gourd to break it. The graves around it clear away."; the step ends when the gourd breaks by any means. (4) "It grows back on the next sprout.": a tick brings it back. (5) "Nice!" for a few seconds, then the night carries on. Breaking the gourd early skips to step 4.
- No levels or upgrades for the gourd in this release. Checks: `check_gourd_basic`, `check_gourd_edges`, `check_gourd_hold`, `check_gourd_unlock`, `check_gourd_loadout`, `check_gourd_pick_ui`, `check_gourd_continue`, `check_gourd_coach` in `tools/nm_check.py`.

### Loadout
- While 5 or fewer types are unlocked, every unlocked type is in play (world 1: 2, 3, then 4 colours); on a Grave Gourd night the picker still opens, asking for all of them (§5).
- From the 6th unlocked type (Pink at 2-8), the player picks **exactly 5** before each level. "Up to 5" was rejected because fewer colors make bunching trivially easy.
- Only loadout colors sprout and drop.
- Level-by-level tables for every type, including the ones with their own effects, live in `docs/WORLDS.md` §5.

---

## 6. Pumpkin supply

- **Sprouts**: **two pumpkins** every *N* seconds, each in its own random empty cell with an independent colour (one if only one cell is free, none if the patch is full). *N* is fixed at 4 s (owner, 2026-10-07; was 5 s) (`SPROUT_EVERY` in `src/data/rules.js`), 3 s with the Eager sprouts power; it is no longer adjustable in the pause menu (owner, 2026-09-27). When fewer than 10 pumpkins are on the patch, sprouting runs **2× faster** (catch-up rule, added because 5 s alone starved later nights).
- **Kill rewards**: every non-boss kill rolls exactly **one** reward: **weapon 10%**, **pumpkin 30%**, **coins 60%** (`src/data/rules.js`). A pumpkin roll drops `max(1, round(drop))` pumpkins in the field; a weapon roll drops one consumable (Wall repair or Firework, chosen among those below their carry limit; if all are full the roll pays coins instead); a coin roll pays the monster's coins. Bosses skip the roll and always pay coins plus their pumpkin drop. Drops fade after 7 s (blinking in the last 2 s). Tap to collect.
- **Purple spawns**: see above.
- **Smashing** (hold) removes a pumpkin to make space.
- **The Grave Gourd's slot** (Release 4, `gourd:true` levels): the first slot of every sprout tick belongs to the gourd. If it was broken, that slot brings it back on a random empty cell; otherwise the slot **fills every empty cell of its 3×3** with pumpkins in the team's colours (as sprouts, rainbows included; up to 8); if its square has no empty cell, the slot sprouts one normal pumpkin elsewhere. The tick's other slots sprout as usual (so with Bumper crop's third sprout: one fill plus two elsewhere). The sprout timer and the catch-up rule are unchanged.

---

## 7. Monsters

Speed is in "field lengths per second" before level multipliers (so 0.055 ≈ 18 s to cross). *Eat* is wall damage per second while chewing. *Coins* are paid only on a coin roll (60% of kills; values were raised ×~1.7 on 2026-09-25 to keep income level); *Drops* is the pumpkin count on a pumpkin roll (30%).

| Monster | HP | Speed | Eat | Coins | Drops | Behavior | First night |
|---|---|---|---|---|---|---|---|
| Ghoul | 1 | 0.055 | 0.5 | 3 | 1 | Walks straight | 1 |
| Bat | 1 | 0.085 | 0.4 | 3 | 1 | Fast, flutters in lane | 3 |
| Imp | 2 | 0.074 (avg) | 0.6 | 5 | 2 | Hops in bursts | 5 |
| Mossback | 4 | 0.028 | 1.1 | 10 | 3 | Slow tank | 7 |
| Wraith | 2 | 0.05 | 0.5 | 7 | 2 | Drifts to a neighboring column every 3.2–5 s (only mid-field). Not in world 1 any more; returns in world 2 as the Wisp | – |
| Wisp | 2 | 0.05 | 0.5 | 7 | 2 | The old lane drifter under its new name: drifts to a neighbouring column every 3.2–5 s (mid-field only) | 2-1 |
| Wraith | 2 | 0.05 | 0.5 | 7 | 2 | Every 4 s it fades out for 2.5 s: invisible and untargetable, still walking. Reappears when it reaches the wall. Flickers just before fading | 2-4 |
| Wisp Rider | 2 | 0.11 carried, 0.05 walking | 0.5 | 7 | 2 | Fast while its wisp carries it. The first hit of any kind breaks the wisp (no damage), then it walks | 2-7 |
| Plague Doctor | 3 | 0.035 | 0.5 | 9 | 2 | Every 2 s heals every other monster inside its 3×3 zone (3 lanes × 3 tile heights, drawn as a pulsing green box) by 0.5 (owner, 2026-09-25: zone instead of column) | 2-9 |
| Shield Knight | 3 | 0.06 in bursts | 0.6 | 9 | 2 | Marches 1.6 s, rests 1.3 s. Shield up while marching: every hit (pumpkins, burns, fireworks) is blocked and no knockback. Shield down while resting and while chewing the fence | 3-2 |
| Gargoyle Hauler | 3 | 0.02 pushing, 0.075 free | 0.6 | 10 | 2 | Spawns with 2 Gargoyles (5 HP, eat 0.35, minions) ahead of it in its lane. Crawls while any survive, sprints once all are dead. Grey counters the line | 3-3 |
| Skeleton Archer | 2 | 0.04 | 0.4 | 9 | 2 | Stops at 14% of the field and every 5 s fires an arrow down its lane that does 3 wall damage on arrival. Usually sits behind castle walls | 3-5 |
| Vampire | 5 | 0.045 | 0.7 | 14 | 3 | Arrives ringed by 4 bats: left, right, ahead and behind. If not hit for 2 s, heals 1 HP every 2 s (owner, 2026-09-26) | 4-8 |
| Puddle Crawler | 2 | 0.05 | 0.5 | 6 | 2 | Climbs out of a random puddle (its lane and depth) instead of walking in from the top | 4-2 |
| Drunk Sailor | 3 | 0.05 × 0.3–1.7 | 0.6 | 8 | 2 | Every 1.4–2.8 s picks a new lurch speed and, 70% of the time, staggers to a neighbouring lane (anywhere on the field) | 4-3 |
| Puddle Diver | 3 | 0 | 0 | 9 | 2 | Lives in a random puddle. Hidden and untargetable for 3 s, then surfaces for 2.5 s and hurls a water bolt down its lane (2 wall damage). With no puddles on the level it walks in at 0.04 instead | 4-7 |
| Splitter Slime | 3 | 0.045 | 0.5 | 7 | 2 | On death spawns 2 Blobs (1 HP, 0.065, minions) in the lanes beside it | 4-6 |
| Chameleon | 2 | 0.05 | 0.6 | 8 | 2 | Takes one of the player's loadout colours at spawn (drawn in it, with that pumpkin shown above its health bar). Only pumpkins of that colour damage it; other colours bounce off with "Wrong colour". Tools (fireworks, bombs, mines) still hurt it | 3-8 |
| Reverse Chameleon | 3 | 0.05 | 0.6 | 8 | 2 | Takes a loadout colour and is immune to it; every other colour and all tools work. Drawn inverted with an X eye and a red X through the pumpkin above its health bar | 3-7 |
| Mirror Sprite | 2 | 0.045 | 0.5 | 9 | 2 | Mirror up for 2 s, down for 2.5 s, and always down while chewing the fence (owner, 2026-09-25). While up, a pumpkin that hits it is reflected: it flies back down the lane and damages the player's wall for its power. Hit it while the mirror is down | 3-5 |
| Flaming Mummy | 2 | 0.045 | 0.6 | 7 | 2 | Only Ice (hits) kills it; any other kill knocks it down for 4 s and it rises with 1 HP. An ordinary Mummy within one lane and one tile of it catches fire and becomes a Flaming Mummy. Ice is auto-locked into the loadout | 1-16 |
| Cinder Rooster (Release 4, nightmare) | 3 (owner 2026-11-05; was 2) | 0.05 | 0.5 | 6 | 1 | Every 8 s it crows: every monster in its lane and the lane either side (itself included; not bosses, the Loot Sack or the jukebox) walks ×1.6 as fast for 2 s (`m.rush`). The crow timer only runs while it walks: a frozen, chewing or fallen rooster does not crow. Where it dies, however it dies (pumpkin, burn, tool), it leaves a fire tile (`lightFire` in `kill()`). Numbers are first guesses for the bot (`rooster` in `src/data/monsters.js`; behaviour in `src/engine/nightmare.js`) | N1-2 |
| Hayrick (Release 4, nightmare) | 8 | 0.03 | 0.8 | 10 | 2 | A tank. Once a night, as soon as it has walked past p 0.3, it throws its pitchfork. **At the fence** (owner 2026-11-05: "occasionally"; rolled once per Hayrick, `fenceChance` 0.34, our number): the fork flies down its lane (`G.arrows` with `fork`, `forkSp` 0.9) and takes a third of the fence's full health (`fenceHit`), never its last 1, like the Hollow King's smash (our call); a fence already on 1 or less gets no fork, it pins instead. **Otherwise** it throws down its column and pins the first pumpkin it meets there, coming down from the field (the row beside the fence first) (a gourd is skipped, and so is one already pinned or in flight) for 4 s (`cell.pinned`, counted down in `update`): a pinned pumpkin cannot slide, be pushed (a push whose line holds it is refused, as into a grave), be moved by `bestMove` or by wind, but it still flies with its bunch. The throw only happens while it walks (not frozen, chewing or down); with nothing to pin it keeps its fork and tries again. Walks onto fire: becomes the Burning Hayrick | N1-7 |
| Burning Hayrick (Release 4, nightmare) | 8 | 0.03 | 0.8 | 10 | 2 | The Hayrick on fire. Ice-only like the Flaming Mummy: any other kill knocks it down for 4 s and it rises with 1 HP. It keeps its normal throw (no burning pin) and sets ordinary Hayricks within one lane and one tile alight | N1-7 |
| Corn Husker (Release 4, nightmare) | 3 | 0.04 | 0.6 | 8 | 1 | The first pumpkin hit only strips its husk: no damage (any pumpkin, Ice included, which still chills it; its other on-hit effects such as burn, knockback, chain and splash still apply), it becomes the Bare Cob, plays `shed` and walks 1.3x as fast (`bareMul`, `HUSK_STRIP` in `src/data/monsters.js`, `stripHusk` in `monsters.js`, called from `hitMonsterNow`). Tools (Firework, Bomb, mines) and chain or splash damage are not pumpkin hits on that monster, so they damage it normally and do not strip. The Bare Cob (3 health, speed 0.052) takes damage normally. Walks onto fire: becomes the Burning Husker; a Bare Cob on fire becomes the Charred Cob | N1-8 |
| Burning Husker (Release 4, nightmare) | 3 | 0.04 | 0.6 | 8 | 1 | The Husker on fire. Not Ice-only: any pumpkin hit strips its burning husk (no damage) and leaves the Charred Cob, 1.3x as fast. Sets ordinary Huskers within one lane and one tile alight | N1-8 |
| Charred Cob (Release 4, nightmare) | 3 | 0.052 | 0.6 | 8 | 1 | The bare cob on fire. Ice-only like the Flaming Mummy: any other kill knocks it down for 4 s and it rises with 1 HP. Sets Bare Cobs within one lane and one tile alight | N1-8 |
| Crow (Release 4, nightmare) | 1 | 0.11 | 0.4 | 2 | 0 | Flies like a bat down its lane. Out of the Strawlord's flock it bursts from its coat and fans out to a random lane, a minion that does not count toward the night; from N1-7 it is also an ordinary pool monster (owner 2026-11-05: "crows can spawn on normal levels too"; introduced on N1-4). **At the fence** (owner 2026-11-05) it flies over into the patch and destroys one pumpkin anywhere on it, not only its own column: never the Grave Gourd or a pumpkin in the gourd's 3×3 (owner), and (our calls) never one sliding or flying in or the one the player is holding. It is gone at once (no kill, no reward; a pool crow counts as dealt with) and the pumpkin breaks when its 0.4 s dive lands (`diveT`; spared if it has slid into the gourd's square by then). With nothing it may take it pecks the fence like any monster, and leaves the fence for the patch as soon as a pumpkin it may take appears (not while frozen). `crowStrike` / `updateCrowDives` in `src/engine/nightmare.js` | N1-4 |
| Casket Jack (Release 4, nightmare) | 6 | 0.025 | 0.7 | 12 | 2 | Owner 2026-11-05 (from `docs/archive/nightmare-monsters/coffin/`): a slow walking pumpkin-wood coffin; it lets out no Mummy while it walks (owner, same day: the first version, a Mummy every 8 s, was too strong). Where it falls it becomes the **Fallen Casket** (1 health, still, cannot be knocked back, others walk round it): 3 s later its lid flips open (0.6 s clip) and a Mummy (a minion) steps out, unless a pumpkin smashes it first; Ice holds it shut while frozen. The casket gives no coins, drops or loot (`noReward`). It does not catch fire itself; its Mummies do. A level with Casket Jack locks Fire into the loadout, as a Mummy level does. Numbers are our first guesses (`casketjack`, `coffin` in `src/data/monsters.js`; art `src/engine/render/chars/casketjack.js`) | N1-3 |
| Grave Riser (Release 4, nightmare) | 3 | 0.03 | 0.6 | 8 | 1 | A slow, gaunt grave-digger with a lantern and a spade. Every 7 s while it is on the field (p > 0) it raises a grave on a random cell anywhere on the patch (owner 2026-11-05: not only its own column) that has no pumpkin, gourd or grave (the dig clip plays); with no such cell it does nothing that time. The timer only runs while it walks: a frozen, chewing, knocked-back or fallen riser does not dig. The graves are ordinary graves and stay after it dies (the gourd or a Grave buster clears them). It dies by sinking back into the earth, leaving its hat on the hole (a baked clip). Art drawn new for Release 4 and awaiting the owner's look; N1-6, N1-12 and N1-15 use it | N1-6 |
| Fogwalker | 1 | 0.05 | 0.4 | 6 | 2 | Carries a fog band 0.12 of the field tall across every lane at its height; everything inside (itself included) is hidden unless a Lantern is burning | 2-16 |
| Witch | 3 | 0.04 | 0.5 | 9 | 2 | Every 6 s turns a random monster, other witches included but never a true Chameleon, Reverse Chameleon or boss, into a reverse chameleon (75%) or a chameleon (25%). Never hexes a Mummy or Flaming Mummy (owner, 2026-10-19: a hexed mummy could become unkillable in Endless Night); an already hexed monster can be re-hexed to a new colour | 3-16 |
| Bulwark Knight | 5 | 0.04 | 0.7 | 12 | 3 | 3×3 aura (steel box): monsters inside have hp and max hp doubled on entry and halved on leaving; a ×2 label shows beside their health dots | 4-16 |
| Shell Turtle | 10 | 0.03 | 0.3 | 12 | 3 | Rises from a puddle, walks backwards shell-first, immune to knockback: a moving wall in front of whatever follows it | 5-16 |
| Mummy | 2 | 0.045 | 0.6 | 5 | 2 | Only Fire (hits or burn ticks) kills it. Any other kill makes it collapse on the spot for 4 s, untargetable and not walking, then it stands up at full health. No rewards for a collapse | 1-9 |
| The Hexwitch (world 3 boss) | 22 (form 1) / 40 (form 2) | 0.03 until she holds | 0 | 50 | 6 (incl. 1 rainbow) | Holds at 25% and drifts to a neighbouring lane every 6 s. Every 9 s (7 s in form 2) hexes 2–3 monsters on the field: form 1 makes reverse chameleons only, form 2 makes chameleons 25% of the time and reverse chameleons otherwise. Like the Witch she never hexes a Mummy or Flaming Mummy, and neither does her Hollow King form or a hex-all level (owner, 2026-11-03: a hexed Flaming Mummy turned up in 6-20; one `hexable()` rule in `engine/monsters.js` now serves every hex). Every 14 s lays a **hex zone** lasting 10 s: any non-boss monster killed inside it collapses and rises after 4 s. Form 1: one 3×3 zone. Form 2: two zones, each a 3×3 box, a whole 1-wide column, or a 1-tall row across all 7 lanes (owner, 2026-09-26). 3-10's pool has no chameleon spawns; her hexing is the only source there. Immune to knockback and freeze | 3-10 (form 1), 3-20 (form 2) |
| The Twin Tides (world 5 boss) | 14 each (form 1) / 24 each (form 2) | 0.03 until they hold | 0 | 30 each | 3 each (incl. 1 rainbow) | Two serpents in distinct random lanes, holding at 12% (the sea row) in form 1 and halfway down the field (50%) in form 2. Every 6 s (4.5 s in form 2) each hurls a water bolt at a random standing wall for 3: a tail rises out of the water in that column and throws from there. Killing one alone puts it **down** for 8 s (5 s in form 2), untargetable; if the other dies inside that window both die for good, otherwise the fallen one rises at full health. The progress bar tracks their combined health. Immune to knockback and freeze | 4-10 (form 1), 4-20 (form 2) |
| The Vampire Count (world 4 boss) | 24 (form 1) / 42 (form 2) | 0.03 until it holds | 0 | 50 | 6 (incl. 1 rainbow) | Holds at 30%. Every 9 s bursts into bats and reforms in another lane. Every 10 s (8 s in form 2) calls 2 bats. Every 15 s raises a castle wall (the level's wall HP) if fewer than 3 stand. Every 20 s (16 s) enters a **healing trance**: stands still healing 1 HP every 2 s and shows "heal ×N" (N = 2, 3 or 4 in form 1; 4, 5 or 6 in form 2; owner nerf 2026-09-26, was 2 HP/s and 4–6 in both forms); each hit counts down and at zero the trance breaks and it is stunned 2 s. Form 2 also heals 1 HP every 2 s whenever it has not been hit for 4 s. Immune to knockback and freeze | 3-10 (form 1), 3-20 (form 2) |
| The Poltergeist (world 2 boss) | 20 (form 1) / 36 (form 2) | 0.03 until it holds | 0 | 45 | 6 (incl. 1 rainbow) | Holds at 25% of the field and drifts to a neighbouring lane every 5 s. Every 8 s swaps two random pumpkins on the patch, animated so they can be followed; form 2 (every 6.5 s) juggles three at once in a cycle and every 12 s repaints three pumpkins to other loadout colours (owner, 2026-09-26). Immune to knockback and freeze | 2-10 (form 1), 2-20 (form 2) |
| The Gravekeeper (world 1 boss) | 15 (form 1) / 30 (form 2) | 0.03 until it holds | 0 (never reaches the wall) | 40 | 6 (incl. 1 rainbow) | Walks to 28% of the field and stops. Every 6 s teleports to a different lane. Raises a ghoul in a random lane at its own depth every 8 s (form 1) or 5.5 s (form 2). Form 2 also shoves one monster 30% of the field forward every 12 s. Immune to knockback and freeze; can be slowed | 1-10 (form 1), 1-20 (form 2) |
| The Fallen Gravekeeper (the nightmare patch's boss, N1-16, Release 4; owner 2026-11-05) | 40 | 0.03 until it holds | 0 (never reaches the wall) | 50 | 6 | Walks to 28% of the field (`hold`, like the Gravekeeper) and never past it; immune to knockback and freeze, can be slowed. Its timers run once it is on the field. **Teleport**: every 6 s it jumps to another lane (ash and eclipse fire, the teleport clip) and leaves a fire trail on its row across the lanes it passed, at most 4 tiles (`trailMax`, as the Strawlord's). **Summon**: every 8 s 2 minions from Cinder Rooster, Casket Jack and Grave Riser (`summonPool`), in its lane or the one either side (owner: "roosters, casket jacks and gravedigger"). **Smash**: every 12 s it drives its spade in (stab clip) and a wave of eclipse fire (`firewave`, baked flame frames) runs down its lane and both neighbours; 0.45 s later each of those three fences loses a third of its full health (`smashHit`, our number for "high damage"), never its last 1, like the Hollow King's smash. **Inferno**: at 75%, 50% and 25% of its health (owner: health points, three a fight) a whole field column (a random lane, every tile row) or a whole field row (a random row in the fire band, all 7 lanes, sweeping out from its lane) bursts into flame, a tile every 0.06 s with a flare, banner "Inferno!"; its own tile stays clear; a hit past two marks sets the second off when the first sweep ends; a continued night does not replay the ones already passed. **Crows**: every 6 s 1–3 crows swoop in at the top of random lanes (minions; they raid the patch like every crow). No boss items or costume (`noItems`); one treasure chest per win for now (`bossChest:'normal'`; the owner sets the reward later). Art: the archive's fallen look (`src/engine/render/chars/fallengk.js`, own registry key so the story Gravekeeper's atlas is untouched; idle and teleport trimmed to 6 frames and the bake scale capped at 1.9: 11.6 MB). `updateFallenGK` in `src/engine/nightmare.js` | N1-16 |
| The Strawlord (nightmare mini boss, Release 4) | 20 (phase 1 start) / 30 (bossForm 2, N1-13) | 0.03 until it holds | 0 (never reaches the wall) | 30 | 4 | Walks to 12% of the field (`hold`) and never past it; immune to knockback and freeze, can be slowed. Every 8 s moves to another lane (a straw puff, like the Gravekeeper's teleport) and leaves a **fire trail** (owner 2026-11-05: its only fire; flocks no longer light any): the tiles on its own row in the lanes it passed over, from the lane it left towards the one it lands on (that one stays clear), at most 4 (`trailMax`, our number), so monsters coming in through those lanes catch fire. Phase 1: every 6 s casts flock, 3–5 crows dive down random lanes. At half health (of its max) phase 2: it tears off the post once (tear clip) but stays at the back and flocks every 4 s. `bossForm: 2` starts it in phase 2. One normal chest on each win (`bossChest`), no boss items or costume (`noItems`). A continued night keeps its health and its phase | N1-4, N1-13 |

- Monsters **queue**: a monster can't walk into the one ahead of it in its column. Only the front monster chews the wall.
- Spawn lanes avoid columns that already have a monster near the top.
- Monster perspective: drawn slightly smaller near the horizon.

---

## 8. Walls

- Each column has its own wall: **18 health + 5 per Sturdy walls level** (max level 3 → 33).
- A monster that reaches the wall stops and chews it at its *eat* rate (50% if slowed, 0 if frozen).
- **A wall at 0 is down, not lost**: monsters at a fallen wall walk through the gap instead of chewing, and the night is lost about 1.2 s later when one is through (slowed monsters take longer, frozen ones don't move). Repairing the wall before that closes the gap. Archers, divers and the Twin Tides never shoot at a wall that is already down (owner, 2026-09-25).
- Stars come from **quests**, not wall health (owner, 2026-09-27; replaced "≥85% walls = 3 stars, ≥50% = 2, else 1"). Every level has three quests, one star each, shown on a Quests folder tab on the level card (`src/data/quests.js`). Quest 1 is always "Finish the night". Quests 2 and 3 come from `src/data/questTable.js`, generated by `tools/quest_gen.mjs` from the owner's per-world lists (fixed quests where the owner named them, otherwise two picks from the world's pool that never share a quest type with the night before or after, never two wall quests or two fence quests together; N grows through each world). A level's own `quests` field overrides the table. Quests count only on a won night and stay earned (`save.quests[n]` is a 3-bit mask; `save.stars[n]` is its count). **Level 20**: quests 2 and 3 are a pair, shown in a dashed bracket, and only count when both are done in the same run. Quests start at 1-3, which opens on the Quests tab with a short tutorial note the first time (`seenIntro.quests`); 1-1 and 1-2 give three stars for a win. During the night the wall readout in the top bar is replaced by trackers for quests 2 and 3 (green when met, red and struck through when missed), and the pause menu lists all three with live progress. The result card lists the quests with NEW tags and no longer reports wall health. The night bonus is 10 + 3 × level + 5 per quest met that night. Progress carries over when an ad continues a lost night. Old saves: stars already earned become the first quests done, and a won 1-1 or 1-2 becomes three stars.
  - Quest types and what they count: bunches of 5+; win without a tray tool; no wall below N% (each wall) or walls at N% or more (total); a ghoul (any kind) or fogwalker never reaching the fence; N kills by one launch (kills credited to the bunch, not later burns); Ice hits that slow or freeze, or Fire hits that set a burn (15, or about 60% of the monsters on short levels: 2-2, 2-7, 3-1, 3-4, 3-6, 4-2, 4-5, 4-7, 5-1, 5-5, owner 2026-10-19; the owner's "freeze OR burn" slots are one or the other on a given level, never both; 1-13 and 1-17 have both because the owner listed both); White pumpkins that boomerang back; Pink hits that add wall health; mirror reflections (at most 50; was 10, owner 2026-09-27); wrong-colour hits on chameleons and reversed-hex monsters (fewer than 15); every castle wall destroyed at the end (including ones the Vampire Count raises); monsters a Grey passes through after its first (dropped where a level has too few monsters to line up: owner, 2026-10-19/20, 5-1 is now no tools, 5-4 no wall below 55%, 5-7 no ghoul at the fence, 5-12 no tools; 5-18's big-Brown kills became bunches of 5); kills by a fully grown Brown; bring one or two named pumpkins (Deep Blue and Brown only in world 5); a named team of four plus at most one more.

---

## 9. Levels, pacing and progression (story mode)

Levels are data: one literal per level in `src/data/worlds/world<N>.js` (schema in `src/data/levels.js`). World 1 (Pumpkin Patch) has 20 levels; worlds 2–6 are empty and show as "coming soon". Level addresses are `world-level`, e.g. `1-7`; internally story night *n* is the global index.

Per level the data gives: starting pattern, graves, wave size, spawn gap, speed multiplier, weighted monster pool, boss and boss form, pumpkins and tools unlocked, and monsters introduced (banner text). Runtime rules on top of the data:
- Spawn gap is jittered ×0.6–1.4 with an 18% chance of a short gap ×0.3.
- The boss appears once 40% of the wave has spawned. On boss levels spawning continues until the boss dies (see §7).
- A level is won when the wave is exhausted (or the boss is dead) and no monster is left.
- **Level select is a storybook shelf** (owner, 2026-09-26): six picture books on two wooden shelves, one per world, each cover painted with that world's horizon scene (`worldScene()` in `render/sprites.js`), a star tally, and chains with a padlock until the previous world's level 10 is beaten (Hallow's End is a dark "coming soon" tome). Tapping a book opens it with a pop-up: the world's scene rises from the gutter in 3D, the left page carries the world's lore (`src/data/lore.js`) and its boss portrait, the right page the 20 levels as ink stamps on paper (filled when starred, gold ring on the next level to play, boss portraits on 10 and 20, dashed when locked) and the star count. A Bestiary button turns the page (both pages flip edge-on) to the world's collection: every monster, variant, companion and boss in order of first appearance with its portrait, a one-line ability and a line of lore (`src/data/bestiary.js`); a monster counts as met once any level containing it is open, and until then shows as a silhouette with the level to reach. Back from a preview or the loadout returns to the open book; Close book returns to the shelf. Beating a level-10 boss shows the "<next world> unlocked!" card and plays the next book's unlock animation on the shelf **only when that book was still locked**; a replay (or a book already opened by the testing unlock) gets the normal result card (owner, 2026-09-27). **Nightmare mode** (owner, 2026-09-28): once a world's level 20 is beaten, a ribbon bookmark with a demon face hangs from the bottom of its book (not before). Tapping it turns the book to nightmare mode: the cover darkens, the pages turn ash grey (a faded, greenish bone grey, chosen for the owner) with stains, scorch and torn edges, titles go blood red, the pop-up and the whole background become that world's nightmare map (`src/engine/render/nightmare/`, from `docs/archive/nightmare-worlds`), the lore becomes a short nightmare story (`NIGHTMARE_LORE` in `src/data/lore.js`), the boss becomes "The Fallen …" (greyed, red glow), the level page says **Coming soon** (from Release 4, world 1's page lists the nightmare levels instead; see "Nightmare Pumpkin Patch" below), and the nightmare music plays. In nightmare mode the bookmark shows a jack-o'-lantern instead; tapping it goes back to the normal book. Closing the book or opening another one leaves nightmare mode. **After 5-20**: Continue on the trophy card first shows "More content coming soon" with a sneak peek of the Hallow's End map, then goes on to the book as usual.
- **Pumpkin picking** (owner, 2026-09-27): pumpkins are listed in unlock order (Green and Yellow first) with their level badge and a one-line role; tapping one picks it and fills a detail card with its level effects (`lvDesc`) and a line of lore (`PUMPKIN_LORE` in `src/data/lore.js`). With Focused patch on, exactly four can be picked and the title says so. The five level-20 trophies are shown as **Powers** on the level preview card (owner, 2026-09-27), drawn as cups with each world's emblem (`render/trophies.js`): gold when on, dim when off, locked with a padlock and "Complete <world>" until that world's level 20 is beaten; tapping one switches it and states its power. Powers not won yet keep their padlock and "Complete <world>" line and add a pulsing RENT tag: tapping one explains the power and offers "Rent for this night" for 60 coins (`RENT_COST` in `src/data/perks.js`, a first guess for tuning); a rented power is active for the next night only and is cleared when that night ends (owner, 2026-09-27). Release 4 adds the gourd as its own pick on gourd nights: a Your gourd slot in the header and a Gourd · pick 1 section (§5, the Grave Gourd).
- **Title screen** (owner, 2026-09-27): phone-wallpaper key art painted once by `render/keyart.js`: the Gravekeeper and his horde (bats, mummies, a Flaming Mummy, the Mossback, ghouls, imps) in front of a harvest moon, a lit Fire pumpkin streaking up at them, and the pumpkin army in three rows along the bottom, gently bobbing, with the logo on top and the buttons beneath.
- **Shop** (owner, 2026-09-27): tabs across the top (Pumpkins, Tools, Seeds; more shops are added as tabs). Pumpkins not unlocked yet show only a dark silhouette, "??? pumpkin" and the level that unlocks them (owner). Pumpkins are listed in unlock order, each showing power, knockback and special now, with the next level's value in green beside anything that changes. Tools show how many are carried or the upgrade level. Seeds is a second currency (`save.seeds`, shown next to coins) for special items in future shops; its packs are listed with store prices but disabled until the app-store release wires in-app purchases, so nothing in the web build charges money.
- **Level preview**: choosing a level opens a card showing the monsters in its pool (NEW tags on first appearances), the boss if any, and a "New this level" row only when the level unlocks a pumpkin or a tool. No counts and no loadout listing (owner, 2026-09-25). Start from there.
- **Introduced monsters always appear**: every monster listed in a level's `intro` is forced into the spawn order right after the first spawn, so an introduction is never an empty promise.
- **Level 16** of every world introduces one more monster (see §7): Flaming Mummy, Fogwalker, Witch, Bulwark Knight, Shell Turtle. The preview on levels 10 and 20 also states the reward (next world, or the perk).
- **Loadout lock**: on a level that introduces a pumpkin, that pumpkin is pre-selected in the pick-5 screen with a NEW tag and cannot be deselected. On any level whose pool contains Mummies (or a Mummy variant), Fire is pre-selected and locked with an ⓘ badge and the line "Fire is locked in: mummies only die to Fire"; Flaming Mummies lock Ice the same way, so both can be locked at once (owner, 2026-09-25).
- **Intro cards**: the first time a pumpkin, tool, graves, monster or boss form appears, a card with its icon and one paragraph must be confirmed before the level starts (`save.seenIntro`). The bot's `startGame` path bypasses both screens.
- **Reset progress** (owner, 2026-10-07): Settings opened from the storybook shelf (not from the pause menu) has a "Reset progress" link. It asks once more ("Keep my save" / "Erase everything"); erasing wipes every level, star, coin, seed, upgrade and item, keeps the music and sound-effects volumes and mute, and reloads at 1-1 (the 1-1 coach shows again).
- **Pick-pumpkin screen layout** (owner, 2026-10-09; built to grow): a pinned header (title, the detail card of the pumpkin last tapped, a **Your team** row with one slot per pick: tap a slot to drop that pick, required pumpkins show a lock and stay), a scrolling middle split into labelled sections (**Pumpkins**, and from Release 4 a **Gourd · pick 1** section below it on gourd nights, with a separate **Your gourd** slot beside the team row in the header, see §5), and pinned Back / Shop / Start night buttons. Tiles are four to a row and show only the icon, name and level; the detail card explains the tapped pumpkin. All 13 pumpkins fit on one phone screen; more scroll inside the middle without moving the header or buttons.
- **Shop from the pick-pumpkin screen** (owner, 2026-10-07, after tester feedback): a Shop button sits between Back and Start night; Back from the shop returns to the picker with the same picks, and the tiles show any new levels.
- **First-night coach** (owner, 2026-10-06; `src/engine/coach.js`): the first time 1-1 is played, a hand shows the moves on the board instead of a card. (1) The patch starts with a few loose greens set up so one slide makes a bunch of 3; monsters and sprouts wait while a hand drags that pumpkin into place, its cell outlined and the target dashed, under a tip above the fence. (2) When a bunch lights up, one ghoul walks down that column and the hand swipes the bunch upward with a dashed arrow to the ghoul. (3) After the launch the hand presses and holds a spare pumpkin while the hold ring fills, showing how to crush one to make room (owner, 2026-10-07); the step ends when the player crushes any pumpkin. (4) A "Nice!" tip shows for a few seconds, then the night carries on as normal (`save.seenCoach`; the one-off "Flick it!" banner is skipped). The coach's ghoul counts toward the night's monsters.
- Level banners still summarise the same things at the start of the level.

World 1 starting numbers (2026-09-25, to be tuned by the bot): wave 9 → 20 over levels 1–10 and 22 → 36 over 11–20; spawn gap 3.84 s → 2.7 s; speed ×0.76 → ×0.868 by level 10, then +0.02 per level to ×1.068; pool adds Bat at 1-2, Imp at 1-4, Mossback at 1-6 (weight 3 + 0.2 × level), Mummy at 1-9.

Queueing (2026-09-27): monsters do not walk through one another in a column; they queue behind the one ahead. Monsters that stay put on purpose do not hold up the queue and are walked past: an archer at its firing spot, a Puddle Diver in its puddle, and a boss at its holding line. (Before this, bats behind a firing archer froze for the rest of the night.) Monsters already chewing the wall never block the queue.

Spawn pacing (owner, 2026-09-27): in levels 11–20 of every world the level's spawn gap is multiplied by 1.15 and the chance that a monster follows almost at once (gap ×0.3) drops from 18% to 14%; monster counts are unchanged. Levels 1–10 keep gap ×1 and 18%. Exceptions set per level: 4-20 keeps ×1.3 and 10% (the owner found it right at that pace); 5-20 (Twin Tides) keeps the original ×1 and 18%. A first try at ×1.3 and 10% for all of 11–20 was too easy for the owner, who needed no tools. Every gap is randomised ×0.6–1.4. Numbers live in `src/data/rules.js`.

World 2 (Foggy Hollow) starting numbers (2026-09-25, untuned): wave 11 → 21 over levels 1–10 and 22 → 36 over 11–20; spawn gap 3.64 s → 2.5 s; speed ×0.8 → ×0.908 by level 10, then +0.02 per level; pool Bog Ghoul 10 and Wisp 5 from 2-1, Wraith 5 from 2-4, Swift Bat 5 from 2-6, Wisp Rider 4 from 2-7, Marsh Imp 5 from 2-8, Plague Doctor 3 from 2-9; graves 0 (1–5), 1 (6–12), 2 (13–20).

World 4 (Crumbling Keep) starting numbers (2026-09-25, untuned): wave 12 → 22 over levels 1–10 and 23 → 37 over 11–20; spawn gap 3.54 s → 2.5 s; speed ×0.82 → ×0.928 by level 10, then +0.02 per level; pool Crypt Ghoul 10 and Keep Imp 5 from 3-1, Shield Knight 5 from 3-2, Gargoyle Hauler 3 from 3-3, Skeleton Archer 4 from 3-5, Siege Brute 3 from 3-7, Vampire 2 from 3-8; graves 0 (1–6), 1 (7–14), 2 (15–20).

World 5 (Drowned Marsh) starting numbers (2026-09-25, untuned): wave 13 → 23 over levels 1–10 and 24 → 38 over 11–20; spawn gap 3.44 s → 2.4 s; speed ×0.84 → ×0.948 by level 10, then +0.02 per level; pool Drowned Ghoul 10 and Tide Imp 5 from 4-1, Puddle Crawler 5 from 4-2, Drunk Sailor 4 from 4-3, Bog Turtle 3 from 4-5, Splitter Slime 4 from 4-6, Puddle Diver 3 from 4-7, Sodden Mummy 3 from 4-9; graves 0 (1–5), 1 (6–12), 2 (13–20).

World 3 (Witchwood) starting numbers (2026-09-25, untuned): wave 14 → 24 over levels 1–10 and 26 → 39 over 11–20; spawn gap 3.34 s → 2.4 s; speed ×0.86 → ×0.968 by level 10, then +0.02 per level; pool Wood Ghoul 10 and Broom Imp 5 from 5-1, Owl-bat 4 from 5-2, Wisp 4 from 5-4, Chameleon 5 from 5-5, Reverse Chameleon 4 from 5-7, Mirror Sprite 3 from 5-8; graves 0 (1–4), 1 (5–12), 2 (13–20).

### Wind gusts (world 3 map gimmick)
Level data gives `gust:{ every, dirs }`. A gust timer counts down; for the last 2 s leaves blow across the patch in the coming direction and a "Wind →" label shows. Then **every pumpkin slides in that direction until stopped** by the edge, a grave or another pumpkin, leading edge first, so lines compress against the far side (the push rule applied to every row or column at once). Any gesture in progress is cancelled and bunches are recomputed. Levels 1–4 gust every 22 s left or right only; 5–9 every 18 s in all four directions; 10–14 every 14 s; 15–20 every 10 s.

### Puddles and the sea row (world 5 map gimmick)
Level data gives `puddles` (count) and `sea` (boolean). Puddles are placed at level start in distinct random lanes at 30–60% of the field: 1 in levels 1–4, 2 in 5–9, 3 in 10–14, 4 in 15–20. Puddle Crawlers and Puddle Divers spawn from them. On sea levels (every even level from 4-6, plus both boss levels) the top 10% of the field is water and monsters surface from it with a splash; the Twin Tides live there.

### Castle walls (world 4 map gimmick)
Level data gives `castles:{ n, hp }`: at level start *n* stone walls stand in distinct random lanes at 40–72% of the field: 1×6 HP in levels 1–4, 2×9 in 5–10, 3×12 in 11–15, 3×15 in 16–20 (owner, 2026-09-25: ramp 6 → 15). Monsters walk through them freely. A pumpkin flying up its lane hits the wall before anything behind it: it deals its power to the wall and stops. Grey deals its power and continues. A Brown deals its power by size (small ×0.5, medium ×1, big ×2) and a Turquoise pair half, as on monsters (bug fix 2026-09-27: walls took only the base power). Black deals ×1.5, stops, and splashes monsters and walls in the neighbouring lanes at that height for half. Bombs damage walls too. Broken walls crumble away. The Vampire Count raises new ones.

### Fog (world 2 map gimmick)
Level data lists fog banks as `[top, bottom]` fractions of the field. The map behind the level preview card is drawn without the level's fog (banks, rows and columns), so its castles, puddles and graves can be read before the night; the fog rolls in when the night starts (owner, 2026-10-31; a Fogwalker's own fog is unaffected). A monster whose position is inside a bank is not drawn (nor its health), except bosses, which glow through; it keeps walking, chewing and making sounds, and pumpkins hit it as normal. Banks: one thin bank in levels 1–4, one wider bank 5–9, two banks 10–14, two wider banks 15–20. The Lantern tool thins every bank for 10 s and shows what is inside.

### Hallow's End (World 6: Release 2 = 6-1 to 6-16, Release 3 = 6-17 to 6-20; see `docs/RELEASES.md`)
World 6 exists only in builds of Release 2 and later (today: the private playtest link, `npm run build:playtest`, from branch `dev`); Release 1 store builds have five worlds and keep the "coming soon" Hallow's End book and the sneak peek after 5-20. Spec: `docs/superpowers/specs/2026-10-31-hallows-end-first-levels-design.md`.
- **Opens after 5-20** (level field `opensAfter:20` on 6-1; every other world opens after the previous world's level 10). No pumpkin unlocks: the player picks 5 from everything owned; the mummy auto-lock still applies.
- **Every level is hand-designed** around a cross-world monster mix (plain monsters, no modifiers in 6-1 to 6-4). Background: the owner's archived Hallow's End map (theme 5, `hallowSky` / `hallowProps`). Rows are fractions of the field so every phone sees the same map.
- **6-1 Attack and Defend**: fog over the middle three rows hiding three fixed puddles (`puddlesLayout`): Puddle Divers attack the walls from them unseen and Shell Turtles climb out (owner, 2026-10-31: divers, not crawlers); Shield Knights and Skeleton Archers from the top; a full castle row at 90% just in front of the fence (castle walls keep their rules: they block pumpkins, monsters and arrows pass through); graves in an "n".
- **6-2 Timing!**: the sea covers the top half (`shoreFrac:0.5`); Fogwalkers, Mirror Sprites and Shield Knights surface at the shoreline and Puddle Divers lurk in the sea (owner, 2026-11-01: divers in place of witches); graves in two pillars.
- **6-3 Fire and Ice, Round 2**: Mummies and Flaming Mummies; fog over everything but the two rows by the fence, a full castle row at 35% hidden in it; witch wind; 6-2's graves.
- **6-4 A Revisit**: the level-16 monsters only: Flaming Mummies, Fogwalkers, Witches, Bulwark Knights, Shell Turtles (owner, 2026-10-31; no Vampires or Plague Doctors); three random puddles; a full castle row at 50%; no fog banks (the Fogwalkers bring their own); witch wind; graves on the four corners and the centre; the first **Frenzy**.
- **6-5 Field Hospital**: Plague Doctors, Bulwark Knights (they protect each other) and Shell Turtles rising from three random puddles (owner); castle walls down both outer lanes at 30/50/70%; graves in a ring; Frenzy.
- **6-6 Field Spell**: 6-5 with Witches in place of the Doctors (turtles and puddles too); graves in a zig-zag; Frenzy.
- **6-7 Iron Rush**: the fast ones (Vampires, Wisp Riders, Drunk Sailors) strengthened by Bulwark Knights; fog down both outer lanes (`fogCols:[0, 6]`); a castle row at 50% with the sea right behind it (`shoreFrac:0.44`, owner), so monsters surface just behind the walls; Frenzy.
- **6-8 Double Trouble**: the Gravekeeper and the Poltergeist at once (level field `boss2`), first form at full health (15 and 20; owner: "not that challenging"), arriving together at 40% of the night; their minions are Flaming Mummies, Mummies, Fogwalkers, Plague Doctors and Wisp Riders. Monsters keep coming until both fall; when one falls first a banner says one is left. A continued night brings back only the boss still standing, with its health. Introduces Emergency Pumpkins.
- **6-9 Show Your Colours**: be specific (owner): Chameleons, Reverse Chameleons, Flaming Mummies (Ice locked in) and Fogwalkers, whose fog hides the rest until they die; Frenzy.
- **6-10 Turncoat Tide**: Reverse Chameleons and Puddle Divers on 6-7's map (sea right behind a castle row, fog down the outer lanes); Frenzy. With no puddles, every diver hides in the sea (a diver walks in only when a level has no water at all; owner).
- **6-11 Many Guests at the Door**: everything brings company (owner): Gargoyle Haulers and their gargoyles, Splitter Slimes, Vampires with their bats; the tide of 5-19 (`shore:4`); at most 4 haulers; Frenzy.
- **6-12 Court of Hexes**: the Hexwitch and the Vampire Count at once (first form, full health) with Witches, Reverse Chameleons, Mirror Sprites, Vampires, Shield Knights, Skeleton Archers and Bulwark Knights; the Count raises his own castle walls.
- **6-13 Blind Night**: fog over the whole field (owner, 2026-11-02; a Lantern clears it for a while) with Wraiths, Wisps, Drunk Sailors and Puddle Divers, all hard to aim at; a sea tide over the top 20% of the field for the divers, so it is truly blind (owner, 2026-11-03; the other monsters surface at the water's edge, as on every shoreline level); a castle row across the middle, hidden in the fog (owner); Frenzy.
- **6-14 Turncoat Tide 2**: 6-10 with Chameleons in place of the Reverse Chameleons, and Puddle Divers; Frenzy.
- **6-15 Heavy Guests at the Door**: 6-11's tide with Bulwark Knights, Shell Turtles and Puddle Divers; Frenzy.
- **6-16 Four Serpents** (the Release 2 finale): two pairs of Twin Tides at once (`boss:'twintides', boss2:'twintides'`), first form, full health, in four different lanes; each pair rises again on its own; when the first pair is down a "One pair falls!" banner shows and the jukebox drops (`frenzyAfterBoss`), bringing its burst and pairs while the last pair is up; after the jukebox falls the boss track returns. Minions: Drunk Sailors, Splitter Slimes, Puddle Divers and Shell Turtles (rising from the sea; owner). The boss bar counts all four serpents. A continued night brings back only the pair still up.
- **Release 3** (owner, 2026-11-02; spec `docs/superpowers/specs/2026-11-02-release-3-design.md`). Each level has a grave shape not used elsewhere in Hallow's End.
- **6-17 Knights in the Mist**: Shield Knights, Mirror Sprites (the owner's "fairies") and Puddle Divers; fog over the top 80% of the field, the sea over the top half (`shoreFrac:0.5`), two puddles, so the divers hide under the fog; Frenzy, witch wind; graves in a crescent moon.
- **6-18 Bad Medicine**: both monsters heal: Plague Doctors and Vampires; fog over the top 80%; a full map of castle walls (three rows at 0.3, 0.5 and 0.7); Frenzy, witch wind; graves in a diamond.
- **6-19 A Revisit 2**: 6-4 again (the level-16 monsters, castle row at 0.5, three puddles, wind) with **two Frenzy rounds** (`frenzyAt:[0.5, 1]`): the first jukebox drops the moment half the night's monsters have arrived; on levels with jukebox marks the spawn bar counts monsters that **arrived**, not kills, so the drop lands exactly on the mark with no pause in spawning (owner, 2026-11-03: a bar counting kills lagged behind the drop, and pausing spawns until it caught up felt wrong); while it stands its burst and pairs are extra monsters that do not count toward the night, so the spawn bar waits at its mark; once it is smashed the world's music returns and normal spawning resumes, and the second jukebox drops the moment the bar is full (the last monster has arrived). Any later level with jukebox marks works the same way (owner); levels without marks keep the bar on kills. The spawn bar shows a jukebox mark at 50% and 100% that pulses while that jukebox stands and dims once smashed. A continued night remembers which jukeboxes have dropped. Graves in a jack-o'-lantern grin.
- **The Hollow King** (boss of 6-20; owner, 2026-11-02; `TYPES.hollowking`, `src/engine/hollowking.js`, art from `docs/archive/hollow-king/`): 60 health in **five phases of 12**. At the start of each phase he **splits**: a **world boss form** appears in another lane: the Hollow King himself in one boss's colour (first form, no antlers) with that boss's level-10 kit and health, in order Gravekeeper (green, 15), Poltergeist (pale blue, 20), Hexwitch (violet, 22), Vampire Count (crimson, 24), Twin Tides (teal, 28: one body that throws water bolts, no partner and no revive, so it has both serpents' health; owner, 2026-11-03). While a form stands the king **can be hit but takes no damage** from anything (pumpkins, burn, glue, splash, lightning, mines, tools): a "No damage" float and a dull clink. When the form falls ("The Hollow King can be hurt!") he takes damage down to the next phase's floor, which a single hit cannot pass; reaching it splits off the next form. After the fifth form he is open until he dies. What a form leaves behind (castle walls, ghouls, chameleons, hex zones) stays after it falls. **His own powers**, one every 12 s in turn, in every phase: **column wipe** (the patch column with the most pumpkins glows ember for 1 s, then every pumpkin in it is destroyed), **fence smash** (the fence of his own lane loses half its full health, never below 1), **summon** (4–6 of the night's monsters at once, as extras that do not count toward the night). He holds at 0.3 and never reaches the wall; every 6 s he glides one or two lanes left or right, never onto his form's lane (owner, 2026-11-03), so the fence smash follows him; the spawn bar follows his health only (each form has its own health bar over it), with **five phase markers** in the forms' colours where each form splits off; a marker pulses while its form stands and dims once beaten (owner, 2026-11-03). **Sounds** (owner: scary): his arrival tolls a deep bell twice over a low drone with a slowed roar and a far scream; each spell (wipe warning, smash, summon) and each new form layers slowed growls, a dark cast and a bell; a fallen form gives its own boss's death cry; his death is a slowed roar and scream with a double bell toll. A continued night brings back his phase, his health and the standing form with its health. Each form's frames are baked when it appears (the next one in the background, one frame per idle moment: baking it whole at the split froze the game ~100 ms on a desktop, owner 2026-11-03, `check_split_no_hitch`) and dropped once it has fallen, so at most two forms' frames are in memory. His frames are slimmed for phones (owner's phone froze opening 6-20, 2026-11-02: 163 MB of frames at phone sharpness): the first form bakes into a 265 × 315 box instead of the full form's 360 × 360, only the clips in use (him: walk and summon, which his powers play; each form: walk), at most bake scale 2, about 18 MB in all (`check_hk_memory`).
- **6-20 The Hollow King** (the Release 3 finale): the Hollow King in his first form, ember-coloured (owner, 2026-11-02: the full form with antlers, wings and candle halo is saved for a future release), arrives at 40% of the night; before he reaches his spot he cannot be hurt; his minions are the revisit monsters (Flaming Mummy, Fogwalker, Witch, Bulwark Knight, Shell Turtle); two puddles for the turtles; no fog, no jukebox; witch wind; graves in a crown. Rewards: two boss chests, with a 50% chance of a third (`bossChests:2`, `extraChestP`; owner, 2026-11-03, because he is hard; was one plus a 50% second); there is no Hollow King costume yet, so boss-item prizes pay coins. The Hallow's End book now shows him by name instead of the "???" shadow, and the 6-20 tile shows his stamp instead of the devil (owner).
- **Wind** (owner, 2026-11-01): none on 6-5 and 6-6 (hard enough already); 6-7 and 6-8 have narrow witch wind (each gust moves only 2–3 rows or columns, `gust.partial`), 6-9 to 6-12 full witch wind, every 22 s, left or right.
- **Book page**: the Hallow's End book shows the Hollow King as a dark silhouette captioned "???" (his archived drawing, `render/chars/hollowking.js`), not the first boss of the world (owner, 2026-11-02).
- **Book tiles**: World 6 boss levels show a purple wax stamp with the nightmare bookmark's devil face instead of one boss's picture (owner, 2026-11-01).
- **Frenzy jukebox** (level field `frenzy`): once `frenzyAt` (default 80%) of the night's `total` has spawned, a jukebox drops at the top of the field (18% down, two lanes wide, the Loot Sack's hit box). Health: the Loot Sack's rule (`SACK.hpBase + SACK.hpPerWorld × (world − 1)`, 30 in World 6) unless `frenzyHp` is set. It never moves or chews. **Only pumpkins hurt it** (Fire's burn counts; tools do not). Monsters in its lanes shield it, as with any target. When it drops, a burst of 4–6 monsters arrives (one every 0.2 s); while it stands, monsters keep coming past `total` at the night's normal pace but in pairs (owner, 2026-10-31; `FRENZY_BURST`, `FRENZY_PAIR` in `src/data/rules.js`); the night is won only when it is smashed and the field is clear. Its song is the owner's `frenzy.mp3` (from 0:00, a separate module loaded only in `VITE_W6` builds); the night's track returns when it falls. It is drawn above fog, never hexed (witches, the Hexwitch, `hexAll`), untouched by Bulwark auras and Plague Doctor healing (owner, 2026-10-31), and gives the normal kill roll. A continued night keeps a fallen jukebox fallen and brings a standing one back with its health. A faster-pace jukebox is in the backlog (`docs/WORLDS.md` §10).

### Nightmare Pumpkin Patch (Release 4; spec `docs/superpowers/specs/2026-11-04-release-4-nightmare-patch-design.md`)
- **The nightmare track** (Release 4 only; lower builds keep the "Coming soon" page and carry none of it): a separate set of nights, not part of the story numbering (`ALL_LEVELS`, `LEVELS`, `save.unlocked` are untouched). Nightmare world w, level k is night `nmNight(w, k) = 1000 + 100·(w − 1) + k` (`NM_BASE`, `isNightmare`, `NIGHTMARE_LEVELS` in `src/data/worlds/index.js`); its stars and quests are kept in `save.stars` / `save.quests` under that number, so no save migration is needed. Level data: `src/data/worlds/nightmare1.js` (`nightmare:true`, `world:1`, `theme:6`); the runtime label is "N1-k", shown as "Nightmare 1-k" on the preview card, the night banner and the top bar (`nightmareTitle` in `src/data/levels.js`); the preview card lists the Grave Gourd reward only until it is unlocked.
- **Opening** (owner): N1-1 opens once 1-20 is beaten (no 5-20 gate); each nightmare win opens the next, one at a time (our call).
- **Book page**: in nightmare mode the world 1 book's right page shows 16 stamps (`NM_BOOK_LEVELS`), one per nightmare level and "Coming soon" for any not built yet (all 16 are built since 2026-11-05). Continue, Levels and Quit from a nightmare night return to that page in nightmare mode.
- **The night**: its map is the nightmare book's scene (eclipse and burning barn, theme 6 `custom:'nightmare'` in `WORLDS`, painted once by `buildBg`), with the nightmare music. Pumpkins and tools come from story progress (`progressNight`), never from the nightmare night number.
- **Story-only rules do not fire on nightmare nights**: the level-10 "next world unlocked" card, the level-10/20 boss chests and level-20 perks. "New this level" cards compare with the previous level on the same track (`prevLevelFor`), and nightmare level 1 has none before it. The night bonus pays like the last story night (`10 + LEVELS × 3 + 5 per new quest`; placeholder, polished later; recorded in `docs/LOOT.md`).
- **Fire tiles** (Release 4; `src/engine/fire.js`, art `src/engine/render/fire.js`): fire burns on tiles of the monster field, never on the patch. A tile is a lane and a field tile row (`TILE_P()` rows from the top; a fire's `p` is its row's centre). State: `G.fires` (`{lane, p, t}`).
  - **A pumpkin that reaches a fire burns up** and is gone; the fire stays (owner). **Ice puts it out and stops there** (owner); each one counts in `G.q.fireOut`. Fire never burns out on its own.
  - **Order along the column** (our call): a flying pumpkin meets things in the order they stand. After castle walls, it takes the first fire in its lane it has reached (within 20 px of the tile centre), unless a monster it can still hit stands in front of that fire (nearer the fence): that monster is hit first, as usual. A fire that lights on a tile a pumpkin in flight has already passed does not burn it (it flies on; the next one up that column meets the fire). Grey does not pierce fire. A pumpkin that burns has no on-hit power (Deep Blue lightning, Black splash, Beige glue, Fire burn); a White that burns does not fly back, and a burned pumpkin is never counted as a miss. Tools (Firework, Bomb, mines) neither put out fire nor are stopped by it. Fire does not hurt or stop monsters.
  - **Level fields**: `fireLayout` (explicit tiles `[lane, p]`, p snapped to its row), `fireStart` (random tiles at night start), `fireMarks` (`[{at, n}]`). Random tiles (`lightRandomFires`) are field tiles that are not burning yet whose row centre lies in `FIRE_P_RANGE` (25–80% down the field, `src/data/rules.js`), spread across lanes (every lane gets one new tile before any lane gets a second), skipping a tile under a castle wall or a boss. The level preview shows the start fires (random ones land elsewhere in play, as random puddles do).
  - **Fire marks** (owner): marks on the spawn bar like the 6-19 jukebox marks; on a level with marks the bar counts monsters that arrived, not kills. When `at × total` monsters have spawned, that mark's `n` tiles light up and a horde arrives: the jukebox burst (`FRENZY_BURST` 4–6 monsters, one every `FRENZY_BURST_GAP` 0.2 s, banner "Wildfire!"). **After the first mark the fire keeps spreading** (owner 2026-11-05): one random tile (`lightRandomFires(1)`) every `FIRE_TRICKLE_EVERY` 6 s while fewer than `FIRE_TRICKLE_MAX` 4 tiles burn on the field (our numbers); a mark (or a trail, a Rooster) may take the field past 4, and the trickle then waits until Ice brings it back under. Each mark lights two more tiles than in the first draft (owner: "summon more fire tiles"). The horde are extras that do not count toward the night (`G.burstMinion` → `m.minion`); normal spawning waits until the horde is in, then carries on (our call), and the night cannot be won while a horde is still arriving. The mark pulses for 1.5 s when it fires, then dims (our call). `G.fmNext` is the next mark.
  - **A continued night** keeps the burning tiles and the marks already passed (not the level's start fires again).
  - **Burning monsters** (owner; one rule for fire tiles and the Flaming Mummy, `BURNS_TO` / `ICE_ONLY` in `src/data/monsters.js`): fire does not hurt or stop monsters, but a monster whose type is in `BURNS_TO` (the Mummy, and from Release 4 the Hayrick, the Corn Husker and its Bare Cob) that stands on a fire tile turns into its burning version at once (`burnMonster`: it keeps its health; "Alight!", the ignite sound, sparks). A monster that is down (rising) is not lit; a downed Mummy that stands up while still on a fire tile catches fire then (so knocking a Mummy down on a fire only delays its Flaming Mummy). Every `ICE_ONLY` type (the Flaming Mummy, the Burning Hayrick, the Charred Cob) is killed only by Ice: any other kill knocks it down for its `rise` (4 s) and it rises with 1 health. A burning type also ignites ordinary monsters of its own family within one lane and one tile, as the Flaming Mummy always has. Burning types are never hexed. Ice is locked into the loadout (our call) on any level with an `ICE_ONLY` type in its pool (or a type whose husk strips to one: the Burning Husker), with fire (`fireStart`, `fireLayout` or `fireMarks`), or with something that makes fire (a Cinder Rooster in the pool, the Strawlord as a boss); a level whose pool merely holds a Mummy locks Fire only, as before (so world 1 is unchanged). The lock's line reads "Flaming mummies only die to Ice" only when Flaming Mummies are all that is Ice-only and there is no fire (story levels, exactly as before); otherwise it reads "Only Ice puts out fire and kills burning monsters". Checks: `check_burn_walk`, `check_ice_only`, `check_ice_lock` in `tools/nm_check.py`.
  - **Art and sound**: one baked, looping 8-frame flame strip (scorched ground, three breathing tongues, embers), blitted once per tile per frame; a new fire grows in over a quarter second. A steam puff when Ice puts one out, a small flare when a pumpkin burns up. Sounds from the bank: `fire` (lights), `hiss` (put out), the miss sound pitched down (burns up). 20 burning tiles cost 20 canvas calls a frame and no strokes or gradients (`check_fire_budget` in `tools/nm_check.py`).
- **The Strawlord** (mini boss, N1-4 and N1-13; `updateStrawlord` in `src/engine/nightmare.js`, numbers in `TYPES.strawlord`, art `src/engine/render/chars/strawlord.js`): the boss rules apply (it arrives at 40% of the total, the night spawns until it falls, boss bar and music). See the monster table for the fight. Its frames bake only idle (as `walk`), flock, hit and tear, in a box trimmed to what they draw and at a bake scale capped at 2 (9.7 MB at the top bake scale); in phase 2 it holds the last frame of tear (off the post, sickle raised). The crows are baked with it (`ALSO_BAKE` also covers a level's boss). Sounds from the bank (creak, cloth, bat wings, woodbreak, fire).
  - **Boss chests by level field** (`bossChest`, Release 4): a level may name the chest its boss drops ('normal' or 'boss') whatever its number, nightmare nights included; N1-4 and N1-13 set `bossChest:'normal'`. Without it the story rule stands (level 10 normal, level 20 boss, none on a nightmare night).
- **The Grave Gourd** (§5 and §6): beating N1-4 unlocks it; it stands on the patch on every nightmare night from N1-5 on (`gourd:true`).
- **The levels** (Release 4, `src/data/worlds/nightmare1.js`; ideas from the spec's Part 5 table; the numbers are an untuned first draft, to be tuned with the bot later, see §11). Every level sets `spawnGap` and `spawnBurst` itself, so the story rule `SPAWN_LATE_FROM` never decides nightmare pacing; quests 2 and 3 come from each level's own `quests` (existing quest types). "Fire" lists the tiles burning at the start (`fireLayout` tiles or `fireStart` random ones) and the marks (`at` → tiles lit).
  - **N1-1 Embers**: teaches fire with world 1 monsters (Ghoul, Bat, Imp, Mossback). Fire: 3 tiles (lanes 2, 4, 6 counted from 1), one mark at 50% → 4.
  - **N1-2 Cockcrow**: introduces the Cinder Rooster. Fire: 2 random, a mark at 60% → 4.
  - **N1-3 Wrapped in Embers**: Mummies walk into the middle-lane fire and become Flaming Mummies (Fire and Ice locked in); introduces Casket Jack. Fire: 3 tiles in lanes 3–5, marks at 40% → 4 and 80% → 4.
  - **N1-4 The Strawlord**: the mini boss with Ghouls, Roosters and Mummies; introduces crows; one normal chest; beating it unlocks the Grave Gourd. Fire: 2 random, plus the Strawlord's trails.
  - **N1-5 The Grave Gourd**: the gourd tutorial (coach) on five graves ringing the gourd; Ghouls only; no fire.
  - **N1-6 The Grave Riser**: introduces the Grave Riser; three graves to start. Fire: 1 random, a mark at 50% → 4.
  - **N1-7 Haystack**: introduces the Hayrick; crows join the pool. Fire: none at the start, one mark at 50% → 5 (walking Hayricks catch fire).
  - **N1-8 Corn Maze**: introduces the Corn Husker. Fire: a zigzag of 5 tiles across lanes 2–6, a mark at 60% → 4.
  - **N1-9 Harvest Fire**: Hayricks, Huskers, Casket Jacks and Mummies together. Fire: 2 random, marks at 35% → 4 and 70% → 5.
  - **N1-10 Dawn Chorus**: a Rooster swarm with crows (Roosters weigh 12 of 24): speed bursts everywhere and fire from every death. Fire: 1 random, a mark at 60% → 3.
  - **N1-11 The Burning Barn**: three whole lanes ablaze (lanes 2, 4 and 6, one tile per field row from 30% to 78% down); Ice burns a way through while hordes come at three marks (30% → 3, 60% → 4, 90% → 4); a few Casket Jacks.
  - **N1-12 Risen Rows**: Grave Risers and crows plus two rows of graves (rows 2 and 4); moving and breaking the gourd is the game. Fire: a mark at 50% → 4.
  - **N1-13 Strawlord Returns**: the Strawlord in phase 2 from the start (full form health 30), with Hayricks and Roosters. Fire: 2 random, plus its trails.
  - **N1-14 Burnt Offerings**: burning monsters (Flaming Mummies, Burning Hayricks, Burning Huskers) and a few Casket Jacks, whose Mummies catch on the fire: an Ice night. Fire: 2 tiles on the outer lanes, a mark at 50% → 4.
  - **N1-15 Eclipse**: the gauntlet: every new monster (Rooster, Hayrick, Husker, Grave Riser, Crow, Casket Jack) with Ghouls and Mummies. Fire: marks at 33% → 4, 66% → 4 and 100% → 5.
  - **N1-16 The Fallen Gravekeeper** (owner, 2026-11-05): the book's boss (see the monster table) with Ghouls, Mummies and Hayricks walking in; the gourd on the patch; 2 random fires at the start, no fire marks (the boss brings its own fire). One normal chest for now.
  - **Intro cards** (`startPreviewedNight` in `src/ui/screens.js`): fire ("Fire tiles", on the first level with fire: N1-1) and the Grave Gourd (on the first level with `gourd`: N1-5) come from the level fields compared with `prevLevelFor`; new monsters from each level's `intro` (Rooster N1-2, Casket Jack N1-3, Crow N1-4, Grave Riser N1-6, Hayrick N1-7, Corn Husker N1-8); the Strawlord's boss card on N1-4 and its full-form card on N1-13. The preview lists "Fire marks on the spawn bar light more fire and bring a horde" and N1-4's reward, and draws its start fires full size.
  - **The nightmare bestiary** (our call): in nightmare mode the book's Bestiary button stays and opens the nightmare edition ("Nightmare Pumpkin Patch bestiary"): the monsters first met on the nightmare levels in order (the Cinder Rooster, Casket Jack and its Fallen Casket, the Strawlord and its crows, the Grave Riser, the Hayrick and its burning form, the Corn Husker, its bare, burning and charred cobs), without the story book's monsters again, then the Fallen Gravekeeper, N1-16's boss (met once N1-16 can be opened; `FALLEN` only holds its place last in the list). A level you can open counts as met, as in the story book (`renderBestiary(wi, nm)`, entries in `src/data/bestiary.js`, `FALLEN`).
  - **Prebaking**: a level's sprite list is one helper (`bakeKeys` in `src/engine/game.js`, used at night start and on the preview card); on a nightmare night it adds the burning form of every pool type that can catch fire (`BURNS_TO`), so the first ignition never hitches.

### Nightmare Foggy Hollow (Release 5, a beta; spec `docs/superpowers/specs/2026-11-05-release-5-nightmare-hollow-design.md`)
- **The track** (Release 5 only): world 2's nightmare book, nights `nmNight(2, k) = 1100 + k`, labelled `N2-k` and titled "Nightmare 2-k". Its table is `src/data/worlds/nightmare2.js` (`NIGHTMARE_LEVELS[1]`). Its map is the hollow nightmare book's scene (sickly green moon, poison-green fog; theme 7, `custom:'nightmare'`, scene `fogN`, in `WORLDS`). So far the table holds N2-1 to N2-4 as plain placeholder nights (world 2 monsters, the Grave Gourd; the table is indexed by level, so it needs every level up to the last built) and N2-5, the Protector Gourd's tutorial night; Task 10 replaces their numbers and fills the rest. N2-4's placeholder already unlocks the Protector Gourd (`unlockGourds:['protector']`).
- **Opening** (our call): N2-1 opens once 2-20 **and** N1-4 are beaten (N1-4 unlocks the Grave Gourd, which stands on the patch from N2-1); each nightmare win then opens the next. The world 2 bookmark appears once 2-20 is beaten; until N1-4 is beaten the nightmare page shows "Locked" and names what is missing ("Beat Nightmare 1-4"; `nmGateText` in `src/data/worlds/index.js`).
- **Book page**: 16 stamps like the world 1 page (`NM_BOOK_LEVELS`); levels not built yet read "Coming soon".
- **Gourds as a list** (spec Part 6; `src/engine/gourd.js`): a `gourd:true` night stands the gourds it was started with, `G.gourdKinds` (slot order, up to 2; `startGame(mode, n, loadout, gourds)`). Each is a patch cell `{ c:GOURD, gourd:kind }` (`'grave'` / `'protector'`; `gourdKind(cell)`, `gourdsOn()`, `gourdPos(kind)` with the Grave as default) with its own place and its own due-back state (the Grave's is Release 4's `G.gourdDue`; any other kind's is `G.gourdDueOf[kind]`). With no kinds passed a gourd night has the gourds it offers (`['grave']` on every Release 4 night), so Release 4 plays as before (one string, as Release 4's picker passes, counts as one kind). Two of one kind are folded into one for now (owner; `ALLOW_SAME_GOURD`, a one-line switch: see the picker's gourd slots below).
  - **Start cells** (our call): one gourd takes the centre (2, 3), as in Release 4; two take (2, 1) and (2, 5), the Grave on the left whatever the slot order, so their squares do not overlap. A grave on a start cell moves that gourd to the nearest cell without a grave or another gourd; on a full patch they replace pumpkins.
  - **Sprout ticks**: the Grave keeps the first slot of every tick (comes back, else fills its 3×3, else one sprout); with no Grave picked that slot is an ordinary sprout. Any other kind that is due comes back on a random empty cell at the start of the tick, in no slot; on a full patch it waits.
  - **A continued night** keeps every gourd in its cell (or the nearest free one), or due back; the continued night starts with the same kinds. A Release 4 snapshot (one object) still restores as the Grave.
  - **Crows** never take a pumpkin in the Grave Gourd's 3×3 (Release 4's rule, unchanged) nor one in a Protector square; a dive whose pumpkin has slid into either square does not land.
- **The Protector Gourd** (`GOURDS.protector`, "Shields its square"; unlocked by N2-4, taught on N2-5; spec Part 6):
  - **Look** (owner, 2026-11-05: an archived gourd, the Swan): the Swan from `docs/archive/gourds/` (cream `#e4d9bd` with green stripes, a round body with a long thin neck arcing over into a little head, the pumpkins' toy face), ported with its look kept (`PROTECTOR_SHAPE` in `render/gourd.js` names the archive entry). Its ward is the archive's halo, a soft disc in its glow colour behind it, baked once and blitted with a pulsing alpha. Its 3×3 glow is in its own colour with shield corners, so it reads apart from the Grave's amber square. All baked (`render/gourd.js`; one ward, one body and one glow `drawImage` per Protector a frame).
  - **Protects** (`isProtected(r, c)`): the cells of its 3×3, its own cell included, while it stands on the patch (not while it is due back). Protected pumpkins cannot be destroyed by any monster (today: crows) and never rot (`rotCell` refuses them). The player can still crush them, slide them and move them; wind, pushes and the Hayrick's pin still apply.
  - **Launches from its square**: each pumpkin launched from a protected cell mends the fence of its column by `PROTECT_HEAL` 1 at launch (`src/data/rules.js`, our number), never above full, and carries `ward`: its first monster hit always knocks back (the usual knockback distance; bosses and `noKnockback` monsters stay immune; Ice, Fire and other on-hit powers still apply).
  - **Breaking it**: press and hold, as the Grave; it does not clear graves. Every rotten pumpkin in its 3×3 becomes a Rainbow (owner; `onProtectorBreak`); then it comes back on the next sprout tick. It does not sprout.
- **Which gourds a night offers** (spec Part 6; `offeredGourds(def)` in `src/engine/game.js`): a `gourd:true` night offers its level field `gourds` (kinds in slot order, at most `GOURD_SLOTS = 2`), or the Grave Gourd alone when it has none (every Release 4 night, and N2-1 to N2-4). A kind not unlocked yet (`save.gourds[kind]`) is not offered; the Grave counts as unlocked on any gourd night (those nights open only after N1-4, its unlock), so Release 4 is unchanged. N2-5 on offer `['grave', 'protector']`. A night started with no gourds passed (a test, an old continue) takes its offer.
- **The picker's gourd slots** (spec Part 6; `renderGourds` / `renderGourdSlot` / `syncLoadout` in `src/ui/screens.js`; owner: the gourd stays a pick of its own, apart from the pumpkins, as in Release 4):
  - **One gourd offered**: exactly Release 4's picker: "Pick 5 pumpkins and 1 gourd", one "Your gourd" oval beside the team row, filled and locked; the "Gourd · pick 1" section's tile is locked too; tapping either shows its card and never empties it.
  - **Two offered** (`.g2`): the title reads "Pick 5 pumpkins and up to 2 gourds" (a little smaller, so it stays on one line); the header has no room for two ovals beside five team slots, so "Your gourds" sits under the team row with its two oval slots side by side, set apart by the same dashed amber rule (on top instead of on the left); the section reads "Gourds · pick up to 2". Both gourds start picked (our call, spec "Calls settled"). A tile toggles its gourd (into the first free slot; the rest stay in the order picked); a tapped slot empties it (the other moves up); an empty slot is a dashed oval. **Start never waits for a gourd**: either or both slots may be left empty ("Ready, with no gourd tonight…"). The detail card says "A gourd · not one of your pumpkins".
  - **Start night** hands `startGame` the picked kinds in slot order (`loadoutGourdSel`; an empty list means no gourd on the patch); the engine places them (one in the centre, two at (2, 1) and (2, 5)).
  - **Two of one kind**: not allowed for now (owner). `ALLOW_SAME_GOURD = false` in `src/data/gourds.js` is a one-line switch; flipped to true, everything follows it:
    - the picker opens `GOURD_SLOTS` slots on every gourd night (one kind offered included), and a picked tile fills the free slot with a second (with both full, a tap drops one);
    - `nightGourds` keeps the duplicate instead of folding it;
    - the engine tells the two apart by id (`gourdIds`: a kind's first is the kind, a second `'grave#2'`; each cell carries `gid`), so each has its own place and due-back state (the first Grave's is still `G.gourdDue`, every other gourd's `G.gourdDueOf[id]`). Two of a kind start on (2, 1) and (2, 5) in slot order. A broken one comes back on its own (the first Grave in the tick's first slot, any other gourd at the start of the tick); the Grave fill sprouts around every Grave standing; crows spare every Grave's square (`inGraveSquare`) and every Protector's (`isProtected`); `gourdPos(kind)` is the kind's first while it stands; a continued night tells the two apart by their order in the snapshot.
    - `check_same_gourd_flag` (nm2_check) flips it at runtime through the `setAllowSameGourd` test hook and back.
  - **The level preview** stands the gourds the night offers (what the picker preselects) where the night starts them: on N2-5 both once the Protector is unlocked, else the Grave alone in the centre.
  - **Intro card**: "The Protector Gourd" on the first night that offers it, once it is unlocked (N2-5), as the Grave Gourd's card on N1-5.
- **The Protector tutorial on N2-5** (`coach:'protector'`, `src/engine/coach.js`; modelled on N1-5's gourd script, which is unchanged): played the first time N2-5 starts with the Protector picked (`save.seenProtectorCoach` set when it ends; started without the Protector there is no script and it stays unseen). Monsters and sprouts wait, and the level's own fog clock is held, until the praise. The script finds the Protector by kind (`gourdPos('protector')`), never the Grave default. Steps, each waiting for what it shows:
  1. **pshield**: a clear patch with both gourds where they stand; on the Protector's row, outside its square, a pumpkin two cells toward the middle (the cell between empty) and one at the edge; a ring of pumpkins in three colours inside its square (none bunch); two more off the row. The fog warning lights on that row (`poisonNow`) and the tip says pumpkins in its 3×3 never rot. It moves on once the fog has lain 1 s.
  2. **prot** (3 s): the tip says the fog rotted the pumpkins outside its square.
  3. **pslide**: the hand slides the rotten pumpkin into the empty cell of the square ("Rot stays rotten, even in its square"); it waits for a rotten one to be in the square (another rotten one is shown if that one is moved or crushed; with none that can get there the step is skipped).
  4. **phold**: the hand holds the Protector; any way of breaking it counts. Breaking it turns the rotten pumpkins in its square Rainbow.
  5. **pback**: "Rainbow! It grows back on the next sprout"; the script runs one sprout tick, which brings it back (retried when the patch is full). Breaking it early, at any step, jumps here.
  6. **praise** (3.5 s, the night already running): "Nice! Keep your best pumpkins in its square when the fog comes." Then the level's fog clock starts at its `every`.
- **N2-5 The Protector Gourd** (draft, Task 10 tunes it): both gourds, story monsters only (Bog Ghouls, Wisps, Wraiths), gentle fog (`poison: { every:16, lines:[1, 1], dirs:['row', 'col'], dur:3 }`), quests noTools / wallMin 55 / bunch5 2.
- **Rotten pumpkins** (spec Part 2; `src/engine/rot.js`, art `src/engine/render/rot.js`):
  - **A colour of its own**: `ROTTEN = -2`, outside `PTYPES` like the gourd's `GOURD`; never sprouted, never in the team, no level. A pumpkin turns rotten only through rot: `rotCell(r, c)` (poison fog calls it; the Poltergeists will). It refuses an empty cell, a gourd, a cell in flight (`fly > 0`), one already rotten and one a Protector shields; otherwise the pumpkin turns rotten, goes dark (its bunch re-forms) and a green puff rises. A rotten pumpkin can still be slid, pushed and crushed, and the Poltergeist's repaint leaves it rotten.
  - **Bunching**: rotten bunches with rotten only, **three or more** touching, as any colour (our call: the spec's "two or more" read as a slip for "like any colour"; `minBunch`, one line, if the owner wants two). A Rainbow never joins a rotten bunch (nor makes one with two rotten), Paint never pulls a rotten pumpkin, and the hint (`bestMove`) treats rotten as a colour. A lit rotten bunch glows sickly green.
  - **Hit rules** (`hitRule(m, rotten)`, combat.js): a monster flagged `rotOnly` (set each frame by its source: a Plague Doctor 2's square, the Lamplighter's rot mood, the Fallen Poltergeist's reaper phase and black fog) is **hurt** by rotten pumpkins and **blocks** everything else; one flagged `cleanOnly` (the Lamplighter's clean mood) blocks rotten and is hurt by normal ones; any other monster, bosses included, is **healed** by rotten and hurt by normal. Both flags are cleared at the start of every frame, before monsters update (`clearHitFlags`), so they hold only while the source keeps setting them.
    - Hurt: `ROT_DMG` 1.5 per pumpkin (`src/data/rules.js`, our number), flat; no on-hit power, no knockback (not a 5+ bunch's, not the Protector's ward).
    - Heal: `ROT_HEAL` 0.5 per pumpkin (owner), never above full health, with a green "+" float; no knockback.
    - Blocked: a grey puff and a "Blocked" float, nothing else. The pumpkin is used up where it hits, Grey's pierce included.
    - A `rotOnly` monster takes no other damage at all: Black's splash and Deep Blue's chain skip it, and burn, mines, glue and tools are refused in `damage()`.
  - **The flight** is a normal flight (each pumpkin up its own column, stopping at the first thing it meets). On a castle wall it splats and does no damage (our call: rot does not hurt stone); in a fire tile it burns like any pumpkin. Launched from a Protector square it still mends that column's fence.
  - **A continued night** keeps the rotten cells (`continueState().rot`, restored after the gourds; on a cell now taken, the nearest free one).
  - **Art**: the archive's rotten pumpkin (`docs/archive/nightmare-monsters/riders/riders.js` `rotten()`: lopsided ribs, brown rot, a green rot patch, white mould, a split, a wilted stem, X eyes) plus a pink worm curling out of a hole in its left side (owner). Two sprites per canvas scale in a pumpkin sprite's box, baked at night start (`prebakeRot`): plain, and lit (a sickly green glow and stink curls) for a bunch and a flight; its trail is the rot green. No costume is drawn on it.
- **Poison fog on the patch** (spec Part 3; `src/engine/poison.js`, art `src/engine/render/poison.js`): like Witchwood's narrow winds. Level field `poison: { every, lines:[min, max], dirs:['row'|'col'], dur }`. Every `every` s green arrows (chevrons in the direction the fog rolls, pulsing) lie over 1-2 whole rows or columns of the patch for `POISON_WARN = 1.5` s (`rules.js`), then the fog settles there for `dur` s (`POISON_DUR = 3` when a caller gives none; our number) and drifts off; the clock for the next fog restarts when it lifts. Every pumpkin under the fog when it settles goes through `rotCell`, so a Protector's 3×3 and the gourds never rot. **Landing rule**: while the fog lies, one sweep a frame rots every pumpkin in a fogged cell that has finished moving (`fly` over and its slide offset under 6 px), so a pumpkin that slides, sprouts or is dropped into the fog rots on landing, not mid-slide; nothing hooks the board. `G.poison = { t, warn, on }` (`t` the clock, `warn`/`on` carry `dir`, `idx`, `flow`, and the timers); `poisonNow(lines?)` lights a chosen line set at once with the same warning (the Lamplighter's call, Task 8; refused while one runs) and `fogged(r, c)` reads the fog. A continued night keeps the clock (`continueState().poison`; a fog warning or lying at the loss restarts at `every`) and the rot it made. Art: two tiling mist strips and a chevron strip per line shape, baked once per canvas scale (`prebakePoison`, at the start of a night with `poison`, or when the first warning lights); a frame draws a window of each, so a lying fog costs two `drawImage` per line and a warning one (`check_poison_budget`: at most 4, no fill or stroke). The N2-1 to N2-4 placeholders have no `poison`; N2-5 has a gentle one (the tutorial also lights its own row, `poisonNow`); the levels (Task 10) set the rest.
- **Monsters** (spec Part 4; `src/engine/hollow.js`, art `src/engine/render/chars/hollow.js` from the archive; no level uses them yet, Task 10 adds them to the N2 pools, names are in `MNAME` and "New foe" texts in `MINTRO`, bestiary entries come with Task 10):
  | Monster | Numbers *(ours)* | Rule |
  |---|---|---|
  | **Plague Doctor 2** (`rotdoctor`) | hp 4, sp 0.035, r 22, coins 9, eat 0.5, pts 30, drop 2 | Owner: it heals nobody. Every other living monster inside its 3×3 (the Plague Doctor's heal-zone geometry: lanes ±1, 1.5 tiles ahead and behind) can only be hurt by rotten pumpkins (1.5 each, `ROT_DMG`); a normal pumpkin stops there with a grey "blocked" puff, and splash, lightning, burn, mines and tools do nothing either. The doctor itself takes normal damage. `markRotZones` sets `rotOnly` on them once a frame, right after `clearHitFlags` and before monsters update, so the protection holds whatever order monsters sit in; it holds while the doctor is frozen or chewing and ends the frame it dies. The Frenzy jukebox and the Loot Sack are never protected (our call: the player must always be able to hit them with a normal pumpkin). The zone is one baked poison-green sprite (`drawRotZoneFx`, `zoneSprite('rot')`) with a pulsing alpha: one `drawImage` a frame, nothing live. Art: the archive's Rot Doctor (walk, chew). |
  | **Reaper** (`reaper`) | hp 3, sp 0.07, r 21, coins 9, eat 0.5, pts 28, drop 2, show 3, hide 4 | An upgraded Wraith: the Wraith's fade cycle (shown 3 s, hidden 4 s, no toggling in the top or the last tenth of the field), faster, any pumpkin kills it. When it dies a crow (a minion, Release 4's raider) bursts out in its lane where it fell. **At the fence** (owner) its scythe swing is its chewing: no interval, it wears down its own fence and both neighbours (one at the field's edge) continuously at `eat` 0.5 a second each; frozen or slowed scales it as for any chewer. A fence at 0 in its own lane lets it walk through as for any monster. Art: the archive's Reaper glides; its `walk` is the glide and its `chew` clip is the archive's `reap` sweep (10 frames) looping. |
- Release 5 is a beta: the numbers are first guesses and the owner tunes them from playtests; there are no bot balance runs.

### Authored levels 11–19
Levels 11–19 of every world are hand-authored (`docs/WORLDS.md` §8a) with these level fields: `gravesLayout` (explicit patch cells, replacing pumpkins there), `laneWeights` (spawn weight per lane; 0 = never), `fogRows` / `fogCols` (tile rows from the top, whole lanes), `gust.partial` (each gust touches 2–3 columns or rows, marked by arrows during the warning), `castlesLayout` (explicit walls), `shore` (tile rows of sea; monsters spawn at its edge, puddles sit below it, divers may lurk anywhere in it), `hexAll` ('reverse' or 'chameleon' applied to every non-boss spawn) and `name` (shown on the preview). World 6 adds `boss2` (a second boss on the same night; the same kind twice means two of it, e.g. two Twin Tides pairs), `frenzyAfterBoss`, `opensAfter`, `puddlesLayout` (explicit puddles `[lane, p]`), `shoreFrac` (sea edge as a fraction of the field), `frenzy`, `frenzyAt` and `frenzyHp`. Witches and the Hexwitch may re-hex an already hexed monster into a new colour.

### Unlocks and progression
- Level 1 of a world opens when the previous world's level 10 has been beaten (Hallow's End: after 5-20). Every other level opens when the level before it has been beaten. Beating level 10 therefore opens levels 11–20 and the next world at once.
- **Level-20 perks** (`src/data/perks.js`): beating a world's level 20 grants a permanent perk, chosen per night among the powers on the level preview card (no longer toggleable in the pause menu, owner 2026-09-27): 1-20 quick smash (0.35 s hold), 2-20 sprouts 1 s sooner, 3-20 half of sprout ticks bring 3 pumpkins, 4-20 rainbow chance 10%, 5-20 loadouts of 4 allowed. The result screen announces the perk.
- **Unlocks are global**: once a pumpkin or tool is unlocked it can be used on every level, including earlier ones (owner, 2026-09-25). Availability is computed from the highest open level, not the level being played.
- Unlocks sit in levels 1–10 so nothing is missable. World 1: Yellow 1-2, Wall repair 1-3, Ice 1-5, Grave buster 1-6, Firework 1-7, Fire 1-8 (owner reorder, 2026-09-26). World 2: Lantern 2-2, White 2-3, Landmine 2-5, Pink 2-8. World 3 (Witchwood): Scarecrow 3-2, Purple 3-3. World 4 (Crumbling Keep): Bomb 4-4, Grey 4-6, Black 4-9. World 5 (Drowned Marsh): Deep Blue 5-4. World order was changed by the owner on 2026-09-25; level addresses inside the monster and gimmick tables use the new numbering.
- Stars are keyed by global night index in the save; `save.unlocked` mirrors the highest open night for older code and the endless-mode loadout.

### Endless mode
**Where it lives** (owner, 2026-10-08): Endless Night is a storybook now, not a title-screen button. A wide tome on its own shelf under the world books (a night sky with a moon-clock stopped at midnight, and the best hour and score), chained with "Beat 5-10 to open" until 5-10 is beaten (owner, 2026-10-09; was 5-20, `UNLOCK_NIGHT` in `src/data/endless.js`); the first time the shelf shows it open it plays the book-unlock animation (`save.seenEndlessBook`). Opening it shows a two-page spread: lore and the best hour and score on the left, how the night works and "Begin the night" on the right. When a run of **60 s or more** ends, a full-screen ad plays (skippable after about 5 s) before the result card (owner, 2026-10-11; `ENDLESS_AD_MIN_SECONDS`); quitting or restarting from the pause menu shows none, and story nights never do. Back from the pumpkin picker returns to the spread; the result card has Play again, Shop and Storybooks. Under the spread a **Powers for tonight** strip shows the level-20 powers exactly as the level card does (toggle earned ones, rent others for 100 coins for one night) (owner, 2026-10-09). **Restart** in the pause menu during endless returns to the spread, so powers and team can be re-picked (story Restart still goes back through the pumpkin picker). Bosses in endless have a **50% chance of 1–2 seeds** (owner, 2026-10-20; was 1–3) (`ENDLESS_BOSS_SEED`; story bosses keep 5%).

**Endless Night** (owner, 2026-09-27; replaced the prototype's "difficulty 1 + t/25, a Gravekeeper every 100 s"). One night that never ends, split into **hours** of 45 s (milestones). Every number is in `src/data/endless.js`, untuned, for the owner to try.
- **Monsters from every world**, one world per hour: hour 1 ghoul, bat, imp; hour 2 adds mossback and mummy; hour 3 Foggy Hollow; hour 4 Witchwood; hour 5 Crumbling Keep; hour 6 Drowned Marsh (3 puddles open, then one more every 2 hours up to 5, so crawlers, divers and turtles have somewhere to rise); hour 7 the level-16 monsters (Flaming Mummy, Fogwalker, Bulwark Knight, Shell Turtle). Older worlds fade (×0.65 per hour back, never below ×0.3) so the newest world leads. Monsters only one pumpkin can kill come only if that pumpkin is in your team: no Fire, no Mummies or Sodden Mummies; no Ice, no Flaming Mummies (owner, 2026-09-28; `NEEDS` in `src/data/endless.js`). The field's scenery switches to each world as it joins.
- **Hour events**: a boss on even hours from hour 3 (Gravekeeper, Poltergeist, Hexwitch, Vampire Count, Twin Tides, then round again in form 2); a boss only rises if the last one has fallen, otherwise that hour brings a Loot Sack. A **Loot Sack** comes on every other hour (its health grows with the hour; same prizes as in story, chests must be tapped). The Twin Tides bring the sea row with them.
- **Getting harder**: spawn gap 3.0 s × 0.9 per hour (never below 1.2 s), 15% quick bursts; walking speed ×0.8 + 0.025 per hour (max ×1.1); imps, mossbacks and wisps +1 health from hour 7 and +2 from hour 11.
- **Frenzy from hour 9**: the spawn gap drops to 45%, bursts to 35%, speed +0.06, and the boss music plays for the rest of the night.
- Top bar: "Hour N · score" (Frenzy N once it starts), the bar fills to the next hour; the wall readout stays (no quests in endless). Score: monster points plus 100 × hour for each hour reached. The result card shows the hour reached and the best hour (`save.bestHour`). The lantern works whenever a Fogwalker is on the field. Uses unlocked pumpkins (loadout pick if 6+ unlocked); the night ends when a wall falls, as in story.

---

## 10. Economy and shop

- Coins per kill (see monster table; paid on 60% of kills, see §6 kill rewards). Weapons also drop from 10% of kills. Night bonus on a win: `10 + 3n + 5 × stars`. Coins found are kept on a loss. Consumables also drop from 10% of kills (§6).
- Shop ("Pumpkin shed"):
  - Pumpkin levels (per type, see costs above; locked types show their unlock night).
  - **Sturdy walls**: +5 wall health per level, 3 levels, 500 / 1,000 / 1,500.
  - **Every consumable tool costs 300 coins and every tool carries up to 5** (owner, 2026-09-27; the per-tool prices below are superseded). Renting a level-20 power costs 100 coins.
  - **Wall repair** (consumable): fully repairs every wall. 40 coins, carry up to 5, player starts with 1.
  - **Firework** (consumable): 3 damage to the 6 monsters nearest the walls (8 until 2026-10-08) (`FIREWORK_TARGETS`, `FIREWORK_DAMAGE` in `src/data/rules.js`); bosses are immune and show "Immune" (owner, 2026-10-07; it used to hit every monster on the field, bosses included). 30 coins, carry up to 5, player starts with 1.
  - **Grave buster** (consumable, 🧨 icon): tap the button, then tap a grave to dig it out. 30 coins, carry up to 5, one free at level 1-6. Tapping anywhere else cancels.
  - **Lantern** (consumable, 🏮): clears every fog bank for 10 s. 25 coins, carry up to 5, one free at 2-2. Disabled while a lantern is already burning; refuses on levels without fog.
  - **Landmine** (consumable, 💣): tap the button, then tap any column. The mine waits at that column's wall line and blasts the first non-boss monster to reach it for 6 damage. One mine per column. 35 coins, carry up to 5, one free at 2-5.
  - **Bomb** (consumable, 💥): tap the button, then tap a spot on the field. Everything within one lane either side and 1.5 tile heights up or down takes 4 damage, castle walls included. 45 coins, carry up to 5, one free at 3-4.
  - **Emergency Pumpkins** (consumable, 🧺; Release 2, introduced at 6-8, owner 2026-10-31): tap it and up to 9 pumpkins (`EMERGENCY_N`) in the team's colours drop into empty cells of the patch; with a full patch the tap does nothing and keeps the tool. `TOOL_COST`, carry up to 5, one free on 6-8, then in drops and chest tool sets like any introduced tool. Unlike the other tools it is not shown padlocked beforehand: its tray button and shop row appear only once 6-8 is reached (owner).
  - **Scarecrow** (consumable, 🌾): tap the button, then tap a column. A scarecrow with 12 health stands near that wall; monsters in the column stop at it and chew it at their eat rate until it breaks. One per column. 35 coins, carry up to 5, one free at 5-2.
  - **Tools are gated by introduction**: a consumable exists only from the level that introduces it (Wall repair 1-3, Firework 1-7, Grave buster 1-6, Lantern 2-2, Landmine 2-5, Scarecrow 3-2, Bomb 4-4, from level data `unlockGear`). Before that it shows in the tool tray dimmed with a padlock, is locked in the shop, and never drops from kills. New players start with 0 of everything and receive one unit on the introducing level.
- **Shop layout** (owner, 2026-09-27, built to scale with more items): the Pumpkins and Wardrobe tabs show a detail panel on top (the selected item's stats or description and its one action), filter chips (Pumpkins: All, Unlocked, Can level up; Costumes: All, Owned, Boss, Shop; Skins: All, Owned, then one chip per pumpkin colour that has skins) and a four-per-row tile grid with a badge per tile (price, level, progress, Owned or Wearing). The Wardrobe has a Costumes / Skins toggle and a live preview: a costumed pumpkin flying into its hit effect, or a skinned one streaking its trail. Locked pumpkins stay silhouettes.
- **Wardrobe** (shop tab, added 2026-09-27, owner). Cosmetic only: nothing here changes power. Priced in pumpkin seeds; prices are first guesses.
  - **Costumes** are worn by every pumpkin at once, in the patch and in flight, and add a hit effect and a quiet hit sound. One costume at a time. Boss costumes are **traded for 15 of that boss's items** (owner, 2026-10-19; was 30) (see Monetization below); costumes already owned stay owned: Gravekeeper hood (tombstone, soul wisps, bone chips), Poltergeist sheet (cold mist, small ghosts, hollow whoosh), Hexwitch hat (hex sigil, sparks), Count's collar (bats), Tide crown (seawater splash, small fish). The **Crown of Stars** (owner, 2026-09-27) is earned, never sold: it unlocks the moment the player holds every star in worlds 1 to 5 (3 on each of the 100 levels, 300 in all) with a full-screen reveal (Wear it now / Later), and saves that already hold every star get it the next time the shop opens. Its tile shows star progress; its hit is a Supernova (flash, shockwave ring, eight shooting stars, a falling star shower, a bright chime). It is drawn at 62% on the patch and in flight so it does not swamp the row above. Designs B and C from its preview are archived in `docs/archive/star-costumes/`. Shop-only costumes cost 25 seeds: Pirate tricorn (coins, cannon smoke) and Jester's cap (confetti).
  - **Skins** restyle one pumpkin colour: its body, its lit face and a wide comet trail. The colour stays recognisable. One skin per colour. Each skin adds a quiet launch accent under the shared whoosh, once per flick: Frost a crystalline chime, Magma a low rumble and sizzle, Candy corn a sugary sparkle pop, Galaxy a soft shimmer. Hit sounds stay per pumpkin type because they carry game information; costumes get no launch sound because every pumpkin wears them. Candy corn (Yellow, 30 seeds), Frost crystal (Ice, 30), Magma (Fire, 40), Galaxy (Purple, 40). Wardrobe prices were rescaled to the seed economy below (default). Every skin carries a short lore story shown in its Wardrobe panel.
  - Saved as `save.wardrobe = { owned, costume, skins: { typeIndex: key } }`. Hit effects are capped at 5 on screen.
  - A "Testing: add 500 seeds" link sits in the Seeds tab (**remove before release**).
- **Monetization** (owner's `monetization.md`, built 2026-09-27; every number in `src/data/economy.js`, marked "default" where the sheet gave none):
  - **Pumpkin seeds** are the premium currency: top pumpkin levels, skins, costumes and boss items. Sources: rewarded ads (1 seed each, 15 a day), seed packs (10 for $3.99, 25 for $7.99, 50 for $10.99), treasure chests, any boss kill (5% chance of 1–3), and the Loot Sack.
  - **Player awareness**: a pulsing green "Free seed, N left" pill on the book shelf, in the shop header and under every result card; a dot on the shop's Seeds tab while free seeds or chests wait; the Seeds tab opens with the ad card.
  - **Rewarded ads** go through one call (`src/engine/ads.js`, `showRewarded(placement)`). The Capacitor build supplies `window.GGAds`; in the browser a placeholder ad counts down 5 s. Placements: free seed, chest reroll, second chance, Loot Sack.
  - **Seed packs** go through `src/engine/store.js` (`window.GGStore.buy(sku)` in the app build). In the browser the pack buttons are disabled and say nothing is charged.
  - **Treasure chests** (full table in `docs/LOOT.md`; owner, 2026-10-07): a **treasure chest** holds 2 prizes, each rolled as a set of 2 tools 20%, a set of 3 tools 20%, 1 seed 15%, 100–200 coins 45%; a **boss chest** holds 3 prizes, each a boss item 25%, 1–3 seeds 25%, a set of 5 tools 25%, 250–500 coins 25% (was: treasure chest 2% seed / 40% set of 5 tools / 58% coins; boss chest 5% boss item / 5% seed / 35% tools / 55% coins). A treasure chest drops from 1% of kills on normal nights (at most one a night), from every level-10 boss and from half of Loot Sacks; only level-20 bosses drop a boss chest. Tools past their carry limit pay 100 coins each. Chests dropped during a night (the 1% kill drop and the Loot Sack's) land on the field and must be **tapped to pick up** within 10 s or they fade; one still lying there when the night is won is kept. Boss chests (levels 10 and 20) are still given at once (owner, 2026-09-27). Picked-up chests are saved at once and opened from the result card, the shelf or the Seeds tab; one ad rerolls a chest once.
  - **Boss items**: one per boss (Grave key, Sheet scrap, Hex charm, Bat wing, Tide pearl). 15 make that boss's costume in the Wardrobe (owner, 2026-10-19; was 30). They come from level-20 boss chests or cost 10 seeds each (owner, 2026-09-27), so a full costume bought outright is 150 seeds. They are never sold for coins (owner).
  - **Seeds for coins**: the Seeds tab trades seeds for coins at 1 seed = 100 coins, in lots of 1, 10 and 50 (owner, 2026-09-27). There is no trade the other way. The level-10 boss no longer gives its costume free.
  - **Continue a lost night** ("reconvene lost nights", owner 2026-09-27): the night is lost as usual when a monster walks through a fallen wall. The lose card then offers "Watch ad to continue". Watching restarts that night with fresh walls and patch and the progress bar where it was, and only the monsters not yet beaten come again (those alive on the field plus those never spawned); a boss that was out returns at once with the health it had left. Once per night. The balance bot never continues.
  - **Loot Sack**: the level card offers an ad to summon one into that night. It waddles in 4 s after the start across two lanes, stops at 38% of the field, never chews walls, and flees after 25 s (gold timer bar under its health). Health 10 + 4 per world. Beaten, it drops a chest (50%), a tool set (25%) or 80–160 coins (25%), plus a 50% chance of 1 seed (owner, 2026-09-27; was 1 guaranteed and a 5% chance of another). A Loot Sack still on the field does not hold up the win.
- Progress, coins, levels, loadout and settings are saved in the browser (localStorage key `gourdguard.v1`).

---

## 11. Balance status (last automated run)

Simulated human-paced player (~1 action per 0.85 s), pumpkin levels 1 / 2 / 3 / 4 at nights 1–3 / 4–7 / 8–11 / 12+, Sturdy walls 0 / 1 / 2, one wall repair, no fireworks:

| Night | Result |
|---|---|
| 1 | Won, walls 100% |
| 5 (boss) | Won, walls 88% |
| 10 (boss) | Won, walls 84% |
| 13 | Won, walls 77% |
| 15 (final boss) | Roughly 50/50; intended to reward level-5 pumpkins, maxed walls, repairs and fireworks |

Observation: about 30–50% of launched pumpkins miss (fly up empty columns). This is the core skill tax, not a bug.

### Baseline before the restructure (2026-09-25, `tools/balance_bot.py --interval 850`, 2 runs per night)

| Night | Run 1 | Run 2 |
|---|---|---|
| 1 | Won, walls 100%, 13/21 throws missed | – |
| 5 | Won, walls 92%, 10/37 missed | Lost (9/12 resolved), walls 86%, 13/39 missed |
| 10 | Lost (17/20 resolved), walls 74%, 15/58 missed | Won, walls 73%, 21/69 missed |
| 15 | Lost (16/21 resolved), walls 52%, 23/56 missed | Lost (14/21 resolved), walls 10/37 missed, 58% |

Takeaway: single runs are noisy (night 5 and 10 each split 1–1). Comparisons after the restructure need at least 3 runs per night, and the bot should report a win rate over repeats rather than one result. The "won" rows in the table above this one came from earlier single runs.

### Restructure verification (2026-09-25, `--repeats 3 --interval 850`, old single-file prototype vs new Vite build)

| Night | Old: wins / mean walls | New: wins / mean walls |
|---|---|---|
| 1 | 3/3, 100% | 3/3, 100% |
| 5 | 3/3, 97% | 3/3, 97% |
| 10 | 1/3, 72% | 0/3, 69% |
| 15 | 0/3, 74% | 0/3, 73% |

Pass criterion was wins within 1 and mean walls within 10 points per night; both held, no page errors in 24 runs. Behaviour is treated as identical. Note nights 10 and 15 are harder than the earlier single-run table suggested; that is the prototype's real state, not a regression.

### Ground rules: sprouts in twos + kill-reward roll (2026-09-25, `--repeats 3`, old 15-night table, before vs after)

| Night | Before: wins / mean walls | After: wins / mean walls |
|---|---|---|
| 1 | 3/3, 100% | 3/3, 100% |
| 5 | 3/3, 97% | 3/3, 95% |
| 10 | 0/3, 69% | 1/3, 85% |
| 15 | 0/3, 73% | 0/3, 89% |

Wins unchanged within noise; wall health up on the hard nights because two pumpkins per sprout means more throws. No errors in 12 runs. A 60-kill probe of the reward roll landed at 60% coins, 28% pumpkins, 12% weapons. These nights were then replaced by the 20-level world 1 table (§9), which has its own sweep below.

### World 1 first-cut sweep (2026-09-25, `--repeats 3 --interval 850`, 60 runs, no errors). Untuned; the owner chose to build all worlds before tuning.

| Level | Target win % | Expected profile: wins / mean walls / mean coins | One tier behind: wins / walls |
|---|---|---|---|
| 1-1 | 95% | 3/3, 100%, 17 coins | – |
| 1-2 | 95% | 3/3, 100%, 18 coins | – |
| 1-3 | 95% | 3/3, 100%, 21 coins | – |
| 1-4 | 95% | 3/3, 99%, 26 coins | – |
| 1-5 | 95% | 3/3, 98%, 30 coins | 3/3, 94% |
| 1-6 | 85% | 3/3, 96%, 39 coins | – |
| 1-7 | 85% | 3/3, 97%, 46 coins | – |
| 1-8 | 85% | 3/3, 94%, 54 coins | – |
| 1-9 | 85% | 1/3, 82%, 44 coins | – |
| 1-10 | 75% | 0/3, 51%, 99 coins | 0/3, 43% |
| 1-11 | 65% | 2/3, 86%, 50 coins | – |
| 1-12 | 65% | 2/3, 88%, 56 coins | – |
| 1-13 | 65% | 1/3, 73%, 72 coins | – |
| 1-14 | 65% | 1/3, 78%, 55 coins | – |
| 1-15 | 65% | 1/3, 83%, 63 coins | 0/3, 61% |
| 1-16 | 50% | 0/3, 71%, 87 coins | – |
| 1-17 | 50% | 1/3, 81%, 80 coins | – |
| 1-18 | 50% | 0/3, 62%, 81 coins | – |
| 1-19 | 50% | 1/3, 69%, 85 coins | – |
| 1-20 | 40% | 0/3, 51%, 205 coins | 0/3, 45% |

Reading: levels 1–8 sit at or above target. The curve breaks at 1-9 (Mummy arrives) and 1-10 (Gravekeeper: 0/3, walls 51%), then levels 11–20 hover at 1/3 against targets of 65% → 40%, with 1-20 at 0/3. The owner also reported 1-10 as too hard by hand. A player one upgrade tier behind loses 10, 15 and 20 every time, so upgrades already matter. First tuning candidates when the owner revisits: the Gravekeeper's summon rate and health at level 10, the Mummy's rise time, and the wave sizes from 1-9 on; the same profile should then be run on worlds 2–5.

### Owner tuning pass: books 1 and 3, the level-10 bosses, mummy levels, and 5-15/17/18/19 (2026-10-01 to 10-06)

Owner: tune books 1 and 3, book 5 moderately at 5-15, 5-17, 5-18 and 5-19, make every level-10 boss easier, and especially the levels that are all mummies. All changes are level data (`src/data/worlds/*.js`): fewer monsters (`total`), longer spawn gaps (`interval`), slower walking (`spMul`), and two new boss-level fields: **`bossGap`**, how many times longer the spawn gaps are while the boss is up (bursts half as likely), and **`bossHpMul`**, that level's boss health (the boss type's own health is unchanged for its other appearances and endless).

Bot runs, `--repeats 3`, expected profile. The bot fixed in this pass: it counted only "Night saved" as a win, so first level-10 wins ("<world> unlocked!") and level-20 wins ("Trophy earned!") read as losses. Cells are wins out of 3.

| Level | Target | Before | After | What changed |
|---|---|---|---|---|
| 1-8 | 85% | 2/3 | 3/3 | 18 → 16 monsters |
| 1-9 | 85% | 2/3 | 3/3 | 19 → 17, gap 3.36 → 3.56 s |
| 1-10 boss | 75% | 0/3 | 1/3 | 16 → 14, speed ×0.868 → ×0.83, bossGap 2.2 |
| 1-12 | 65% | 0/3 | 1/3 | 23 → 17, gap 3.18 → 3.7 s, speed ×0.908 → ×0.86 |
| 1-13 (all mummies) | 65% | 0/3 | 1/3 | 25 → 16, gap 3.12 → 3.6 s, speed ×0.928 → ×0.86 |
| 1-15 | 65% | 0/3 | 1/3 | 28 → 23, gap 3.0 → 3.3 s, speed ×0.968 → ×0.92 |
| 1-16 | 50% | 1/3 | 1/3 | 30 → 26, gap 2.94 → 3.2 s, speed ×0.988 → ×0.95 |
| 1-17 (mummies + Flaming Mummies) | 50% | 0/3 | 1/3 | 31 → 11, gap 2.88 → 4.2 s, speed ×1.008 → ×0.84 |
| 1-18 | 50% | 0/3 | 2/3 | 33 → 22, gap 2.82 → 3.4 s, speed ×1.028 → ×0.94 |
| 1-19 | 50% | 0/3 | 1/3 | 24 → 21, gap 3.17 → 3.35 s, speed ×1.048 → ×0.98 |
| 1-20 boss | 40% | 0/3 | 0/3 | 36 → 24, gap 2.7 → 3.0 s, speed ×1.068 → ×0.97, bossGap 2.4, boss health ×0.75 |
| 2-10 boss | 75% | 0/3 | 2/3 | 17 → 15, bossGap 1.6 |
| 3-9 | 85% | 0/3 | 2/3 | 23 → 20, gap 2.86 → 3.1 s |
| 3-10 boss | 75% | 0/3 | 2/3 | 24 → 20, gap 2.8 → 3.0 s, bossGap 2.0 |
| 3-12 | 65% | 0/3 | 2/3 | 27 → 20, gap 2.68 → 3.2 s, speed ×1.008 → ×0.94 |
| 3-15 (chameleons only) | 65% | 0/3 | 0/3 | 32 → 14, gap 2.5 → 3.4 s, speed ×1.068 → ×0.9 |
| 3-16 | 50% | 1/3 | 1/3 | 33 → 28, gap 2.44 → 2.75 s, speed ×1.088 → ×1.04 |
| 3-17 (mirrors only) | 50% | 0/3 | 2/3 | 34 → 27, gap 2.4 → 2.75 s, speed ×1.108 → ×1.05 |
| 3-19 | 50% | 0/3 | 0/3 | 27 → 14, gap 2.76 → 3.5 s, speed ×1.148 → ×0.95 |
| 3-20 boss | 40% | 0/3 | 1/3 | 39 → 28, gap 2.4 → 2.65 s, speed ×1.168 → ×1.12, bossGap 2.0 — **reverted 2026-10-08** (owner: it felt quite easy once sprouts went to 4 s; back to 39, 2.4 s, ×1.168, no bossGap) |
| 4-10 boss | 75% | 0/3 | 0/3 | 18 → 15, speed ×0.928 → ×0.89, bossGap 2.2, boss health ×0.7 |
| 5-10 boss | 75% | 0/3 | 1/3 | 23 → 15, speed ×0.948 → ×0.91, bossGap 2.2, boss health ×0.6 |
| 5-15 (all Sodden Mummies) | 65% | 0/3 | 1/3 | 22 → 12, gap 3.4 → 4.2 s, speed ×1.048 → ×0.92 |
| 5-17 | 50% | 0/3 | 1/3 | 34 → 28, gap 2.48 → 2.8 s, speed ×1.088 → ×1.03 |
| 5-18 | 50% | 0/3 | 1/3 | 35 → 16, gap 2.42 → 3.7 s, speed ×1.108 → ×0.9 |
| 5-19 | 50% | 0/3 | 1/3 | 25 → 18, gap 2.76 → 3.3 s, speed ×1.128 → ×1.0 |

Unchanged and already near target: 1-1 to 1-7, 1-11 (3/3), 1-14 (2/3), 3-1 to 3-8, 3-11 (2/3), 3-13 (2/3), 3-14 (3/3), 3-18 (2/3).

Reading: every level that was 0/3 except four now wins at least some runs. The four left are bot blind spots rather than settings: 3-15 and 3-19 are chameleon levels and the bot cannot choose colours (it loses within a minute with few kills); on 4-10 it survives four to five minutes and kills 50 to 80 monsters but never focuses the Vampire Count to break his trance (boss health was taken to ×0.6 there and set back to ×0.7, untested, so the fight stays a fight for people); 1-20 is the world's final boss with a 40% target. These four need a hand playtest before cutting further.

### Hallow's End 6-1 to 6-4, first tuning (World 6 beta, 2026-10-31, `VITE_W6=1` build, `--repeats 3`)
Profile for World 6: every pumpkin at level 5 and Sturdy walls 3 (offset 0), level 4 and walls 2 (offset −1). Wins out of 3; two bots ran side by side.

| Night | Round 1 (first numbers) 0 / −1 | Change | Round 2 0 / −1 | Change | Round 3 0 / −1 | Change | Round 4 0 / −1 |
|---|---|---|---|---|---|---|---|
| 6-1 | **3** / 0 | none | | | | | |
| 6-2 | **2** / 0 | none | | | | | |
| 6-3 | 0 / 0 | total 16→12, interval 3.4→4.2, speed .95→.9, castles 12→8 HP | 0 / 1 | total 12→10, interval 4.2→5.0 | **1** / 0 | none | |
| 6-4 | 0 / 0 | total 26→20, interval 2.9→3.4, speed 1→.95, castles 12→8 HP | 0 / 0 | total 20→18, interval 3.6, lighter pool (Bulwark 1, others 2) | 0 / 0 | graves "plus" → corners + centre | 0 / 0 |

Reading:
- 6-1 and 6-2 meet the rule (winnable at the profile, lost below it).
- 6-3 is borderline: the bot cannot tell a Mummy from a Flaming Mummy and throws whatever bunch is ready, so most of its hits only knock mummies down (kills 2–10 of 10–16). A player who matches Fire and Ice once mummies leave the fog should do better; the owner's playtest decides.
- 6-4: the central "plus" of graves starved the middle lanes of bunches (the middle walls fell first in a watched run). With corner graves every run at the profile now survives past the night's total into the Frenzy (23–27 of 18 resolved), and loses while the jukebox plays. Next levers are the owner's rules (jukebox health 30 like the Loot Sack, the 80% drop point); asked the owner before changing them.

### Hallow's End after the owner's first playtest (2026-10-31, `--repeats 3`, wins out of 3 at offset 0 / −1)
The owner found 6-1 to 6-3 easy (playing with the Paint pumpkin, which the bot does not use) and changed 6-4 to the level-16 monsters only. Numbers now: 6-1 26 monsters every 2.75 s; 6-2 24 every 2.85 s; 6-3 14 every 4.2 s; 6-4 24 every 3.0 s, no fog banks; the jukebox drop brings a burst of 4–6, then pairs.

| Night | Before (round 4) | Harder (owner's ask) |
|---|---|---|
| 6-1 | 3 / 0 | 1 / 0 |
| 6-2 | 2 / 0 | 1 / 1 |
| 6-3 | 1 / 0 | 0 / 0 |
| 6-4 | 0 / 0 | 0 / 0 (two runs reached 30 and 45 of 24 resolved, deep into the Frenzy) |

Below the bot's target by design: the owner asked for harder nights and tunes from their own play. (6-1's crawlers became Puddle Divers right after this run.)

### Release 3 first bot runs (2026-11-02, `--repeats 3`, profile level 5 / fence 3, offset 0 and −1)
| Night | Wins (0 / −1) | Mean walls % (0 / −1) | Resolved at the loss (offset 0) |
|---|---|---|---|
| 6-17 Knights in the Mist | 0 / 0 | 46 / 45 | 8–17 of 24 |
| 6-18 Bad Medicine | 0 / 0 | 46 / 45 | 0 of 22 (2–11 throws a night, lost at about 45 s) |
| 6-19 A Revisit 2 | 0 / 0 | 45 / 48 | 1–6 of 24 |
| 6-20 The Hollow King | 0 / 0 | 68 / 58 | 17–22 of 25 (the king reached his late phases) |

Reading: no numbers changed. The bot loses every World 6 night from 6-5 on, so these are reference only; the owner tunes World 6 from their own play (Paint and Beige, which the bot does not use). The bot only throws at monsters it can see, so under 80% fog it barely throws: on 6-18, with three castle rows to break as well, it threw 2–11 pumpkins and killed almost nothing before the doctors and vampires reached the fence. **Watch 6-18 in the owner's play**: it is the most likely to need softening (fewer castle rows, less fog or a lower total).

### Nightmare Pumpkin Patch N1-1 to N1-15: first numbers, not yet tuned (Release 4, 2026-11-05)
Targets (spec Part 6, our call): wins at the top profile (pumpkins level 5, fence 3, all five level-20 powers, `--offset 0`) about 70% on N1-1 to N1-3, 60% on N1-4, 50% on N1-5 to N1-12, 35% on N1-13 to N1-15, and clearly lower at `--offset -1`.

Bot changes made before any run: on nightmare nights the bot plays a post-5-20 team, Green, Ice, Black, Deep Blue and Grey, with Fire in place of Grey where plain Mummies are in the pool (`NM_TEAM` in `tools/balance_bot.py`; the old "five most recent types" had no Green). The bot now paces its actions on the game clock (`G.t`) instead of the wall clock, so a busy machine, which slows the game (frame time is capped at 50 ms), no longer makes it play faster than a human. The test tools take extra Chrome arguments from `GG_CHROME_ARGS` (e.g. `--disable-gpu` when the headless GPU process hangs).

**Status: not measured.** The numbers in `nightmare1.js` are the first draft and no change was made from bot results. The one sweep attempted (offset 0, five bots side by side, before the two bot changes above) overloaded the machine: the game ran slower than the wall clock, so the wall-paced bot acted too often (an easier game than a human's), and many runs hit the timeout mid-night. Later attempts with one or two bots ran at a small fraction of real time on this machine (Low Power Mode, a hung headless GPU process; software rendering was too slow to finish a night). The completed runs of that first sweep are reference only, not a balance claim (fewer than 3 per night, optimistic pacing):

| Night | Completed runs (offset 0) | Result | Mean walls % |
|---|---|---|---|
| N1-1 Embers | 2 (plus 1 timeout) | 1 win, 1 loss | 85 |
| N1-4 The Strawlord | 2 (plus 1 timeout) | 0 wins (one loss came 24 resolved into a 17-monster boss night) | 64 |
| N1-5 The Grave Gourd | 2 (plus 1 timeout) | 2 wins | 99 |
| N1-7 Haystack | 2 | 2 wins | 100 |
| N1-10 Dawn Chorus | 2 (plus 1 timeout) | 0 wins | 71 |
| N1-13 Strawlord Returns | 2 (plus 1 timeout) | 0 wins | 56 |
| Others | 0 | not reached or timed out | |

Reading (tentative): N1-5 and N1-7 look easier than their 50% target and the Strawlord nights and the Rooster swarm harder; nothing should be changed on this alone. Next: run `balance_bot.py --nights N1-1,…,N1-15 --repeats 3` at `--offset 0` and `-1` on an idle machine (one or two bots at a time), then tune `total`, `interval`, `spMul` and fire counts toward the targets and record the before/after table here.

### 5-20 slightly easier (owner, 2026-10-09)

38 → 35 monsters, average spawn gap 2.4 → 2.55 s, burst chance 18% → 15%; speed, mix and the Twin Tides unchanged. Bot, 3 runs each on the old and new numbers side by side: 0/3 and 0/3 (walls 41% and 41% on average). The bot cannot finish the Twin Tides, so this was judged by the owner's play, not the bot.

### Sprouts every 4 s instead of 5 (owner, 2026-10-07; Eager sprouts 3 s instead of 4)

Same bot, `--repeats 3`, on top of the tuning pass above. Faster sprouts are a large boost:

| Level | Target | Sprouts 5 s | Sprouts 4 s |
|---|---|---|---|
| 1-10 boss | 75% | 1/3 | 3/3, walls 92% |
| 1-15 | 65% | 1/3 | 3/3, walls 94% |
| 3-10 boss | 75% | 2/3 | 3/3, walls 88% |
| 3-15 (chameleons) | 65% | 0/3 | 2/3, walls 80% |
| 4-10 boss | 75% | 0/3 | 1/3, walls 84% |
| 5-15 (Sodden Mummies) | 65% | 1/3 | 0/3, walls 68% |

Reading: with both changes, the tuned levels of books 1 and 3 now sit at or above target for the bot; 5-15 (only Fire kills its monsters, so more sprouts of other colours do not help) and 4-10 (the bot never breaks the Count's trance) are unchanged. If the owner finds books 1 and 3 too easy now, the first lever to give back is the tuning pass's monster counts, not the sprout time.

### Release 1 baseline sweep, all five worlds (2026-09-25, `--repeats 2`, expected profile with level ≤3 in the first half of each world, earlier worlds' perks on)

Cells are wins out of 2 and mean wall health. Caveats: this ran before the level-16 monsters and the Hexwitch redesign, so levels 16–20 and the 3-10/3-20 fights are stale; and the bot cannot pick colours against chameleons or plan around wind, so world 3 (Witchwood) reads far harder for the bot than for a person.

| Level | Target | Pumpkin Patch | Foggy Hollow | Witchwood | Crumbling Keep | Drowned Marsh |
|---|---|---|---|---|---|---|
| 1 | 95% | 2/2, 100% | 2/2, 96% | 1/2, 81% | 2/2, 94% | 2/2, 98% |
| 2 | 95% | 2/2, 100% | 2/2, 98% | 2/2, 97% | 2/2, 87% | 2/2, 96% |
| 3 | 95% | 2/2, 100% | 2/2, 96% | 2/2, 100% | 2/2, 87% | 2/2, 99% |
| 4 | 95% | 2/2, 96% | 2/2, 92% | 2/2, 100% | 2/2, 96% | 2/2, 94% |
| 5 | 95% | 2/2, 98% | 2/2, 91% | 0/2, 72% | 2/2, 75% | 1/2, 88% |
| 6 | 85% | 2/2, 94% | 2/2, 92% | 1/2, 86% | 2/2, 75% | 2/2, 98% |
| 7 | 85% | 2/2, 96% | 2/2, 94% | 1/2, 88% | 1/2, 80% | 2/2, 80% |
| 8 | 85% | 2/2, 98% | 2/2, 89% | 0/2, 70% | 1/2, 60% | 2/2, 88% |
| 9 | 85% | 1/2, 87% | 2/2, 96% | 0/2, 62% | 2/2, 84% | 0/2, 69% |
| 10 | 75% | 0/2, 19% | 0/2, 48% | 0/2, 39% | 0/2, 60% | 0/2, 56% |
| 11 | 65% | 2/2, 83% | 2/2, 87% | 0/2, 72% | 0/2, 66% | 1/2, 84% |
| 12 | 65% | 0/2, 64% | 2/2, 90% | 1/2, 50% | 2/2, 59% | 0/2, 77% |
| 13 | 65% | 1/2, 80% | 2/2, 77% | 0/2, 52% | 1/2, 83% | 1/2, 86% |
| 14 | 65% | 1/2, 86% | 2/2, 88% | 0/2, 52% | 1/2, 76% | 0/2, 72% |
| 15 | 65% | 0/2, 72% | 0/2, 64% | 0/2, 62% | 1/2, 58% | 0/2, 56% |
| 16 | 50% | 2/2, 96% | 2/2, 80% | 0/2, 52% | 2/2, 72% | 0/2, 54% |
| 17 | 50% | 0/2, 56% | 2/2, 90% | 0/2, 85% | 1/2, 82% | 0/2, 64% |
| 18 | 50% | 2/2, 86% | 2/2, 95% | 0/2, 62% | 2/2, 80% | 0/2, 69% |
| 19 | 50% | 0/2, 70% | 2/2, 88% | 0/2, 46% | 2/2, 91% | 0/2, 71% |
| 20 | 40% | 0/2, 52% | 0/2, 30% | 0/2, 40% | 0/2, 52% | 0/2, 50% |

Reading: the first five levels of every world are fine. Worlds 1, 2, 4 and 5 break at the level-10 boss (0/2 in all four) and stay around 1/2 through 11–19 against targets of 65% → 50%. World 3 collapses from 3-5 (chameleons) onward for the bot. Boss fights are the first thing to soften; the owner also plans to hand-author levels 11–19 with twists before tuning them.

### Sweep on the signed-off rules (2026-09-26, `--repeats 2`, same profile, all authored levels, level-16 monsters and perks in; run just before the Turquoise/Brown pumpkins, the Witchwood softening and the Mirror/Chameleon swap)

| Level | Target | Pumpkin Patch | Foggy Hollow | Witchwood | Crumbling Keep | Drowned Marsh |
|---|---|---|---|---|---|---|
| 1 | 95% | 2/2, 100% | 2/2, 100% | 2/2, 100% | 2/2, 98% | 2/2, 100% |
| 2 | 95% | 2/2, 100% | 2/2, 99% | 2/2, 93% | 2/2, 95% | 2/2, 98% |
| 3 | 95% | 2/2, 100% | 2/2, 100% | 2/2, 100% | 2/2, 92% | 2/2, 100% |
| 4 | 95% | 2/2, 95% | 2/2, 100% | 2/2, 100% | 2/2, 93% | 2/2, 99% |
| 5 | 95% | 2/2, 96% | 2/2, 92% | 0/2, 75% | 2/2, 84% | 2/2, 94% |
| 6 | 85% | 2/2, 84% | 2/2, 88% | 1/2, 81% | 2/2, 92% | 2/2, 100% |
| 7 | 85% | 1/2, 82% | 1/2, 86% | 1/2, 86% | 2/2, 87% | 2/2, 83% |
| 8 | 85% | 2/2, 93% | 2/2, 90% | 0/2, 79% | 0/2, 68% | 2/2, 96% |
| 9 | 85% | 2/2, 95% | 1/2, 88% | 0/2, 74% | 0/2, 80% | 0/2, 59% |
| 10 | 75% | 0/2, 74% | 0/2, 61% | 0/2, 68% | 0/2, 71% | 0/2, 62% |
| 11 | 65% | 2/2, 91% | 2/2, 86% | 1/2, 76% | 2/2, 94% | 1/2, 87% |
| 12 | 65% | 0/2, 48% | 1/2, 77% | 0/2, 74% | 2/2, 93% | 0/2, 76% |
| 13 | 65% | 0/2, 59% | 1/2, 74% | 1/2, 67% | 0/2, 62% | 0/2, 56% |
| 14 | 65% | 1/2, 86% | 1/2, 86% | 0/2, 72% | 0/2, 55% | 0/2, 98% |
| 15 | 65% | 1/2, 74% | 0/2, 76% | 0/2, 48% | 1/2, 81% | 0/2, 44% |
| 16 | 50% | 0/2, 76% | 2/2, 95% | 0/2, 64% | 1/2, 95% | 0/2, 79% |
| 17 | 50% | 0/2, 79% | 2/2, 100% | 0/2, 70% | 0/2, 80% | 0/2, 63% |
| 18 | 50% | 1/2, 67% | 1/2, 100% | 0/2, 100% | 1/2, 78% | 0/2, 48% |
| 19 | 50% | 0/2, 62% | 1/2, 98% | 0/2, 44% | 1/2, 85% | 0/2, 62% |
| 20 | 40% | 0/2, 44% | 0/2, 76% | 0/2, 63% | 0/2, 76% | 0/2, 62% |

Same bot caveats as above (no colour picking, no plan for wind). Follow-up (2026-09-26): every level 10's spawn gap lengthened by 35% at the owner's request; see the re-run below.

| Level | Before (2 runs) | After, gap ×1.35 (3 runs) | Gap restored, boss HP −25% (3 runs, 2026-09-26) |
|---|---|---|---|
| 1-10 | 0/2 | 0/3, 66% | 0/3, 56% |
| 2-10 | 0/2 | 0/3, 75% | 0/3, 70% |
| 3-10 | 0/2 | 0/3, 78% | 0/3, 68% |
| 4-10 | 0/2 | 0/3, 70% | 0/3, 67% |
| 5-10 | 0/2 | 0/3, 63% | 0/3, 55% |

### 5-15 "The Drowned" softened (2026-09-26, `--repeats 3`, expected profile, Fire locked in)

The owner found the all-Sodden-Mummy level too dense. Bot fix first: the bot had never carried Fire on mummy levels (it takes the five most recently unlocked types), so its earlier 5-15 figures were 0 kills; it now mirrors the game's Fire and Ice loadout locks.

| 5-15 | Wins | Mean walls | Kills per run | Seconds survived |
|---|---|---|---|---|
| Before: 30 mummies, gap 2.6 s | 0/3 | 57% | 7, 10, 3 | 69, 64, 68 |
| After: 22 mummies, gap 3.4 s | 0/3 | 54% | 10, 10, 13 | 82, 98, 86 |

The bot still loses (it misses about 40% of throws and cannot keep Fire on the lane the mummies rise in), but it lasts noticeably longer; the owner judges the level by hand.

Second follow-up (2026-09-26): the owner reverted the ×1.35 spawn slowdown after cutting boss health (form 1 about −25%). Result at the expected profile: still 0/15 with mean walls 55–70%, in line with the slowed runs, so the boss-health cut roughly offsets the faster spawns for the bot. The bot cannot colour-pick or plan around gusts, so the owner's own runs decide; nothing further changed.


---

**Owner playtest batch (2026-09-26).** Level 10 of worlds 1, 2 and 4: spawn gap ×1.2 and 20% fewer monsters (1-10: 16 at 3.96 s; 2-10: 17 at 3.72 s; 4-10: 18 at 3.6 s), owner playing at pumpkin level 2. Also: Turquoise pairs half power, bunches of 3+ full; landmines on any tile with a 3×3 blast for 6; wall repair fixes one tapped wall; Keep Imp 2 HP; 4-2/4-3 knights weight 2, 4-3 capped at 2 haulers; chameleons from 3-9 capped at 3; no rainbow sprouts or Purple rainbow spawns before 1-9; level-10 wins show a world-unlocked card and return to the menu; the full help no longer auto-opens (1-1 teaches bunches of 3 and 5 in two cards). Bot to re-run on the level 10s later.

### Coin income measurement for the monetization draft (2026-09-27, `--repeats 1`, expected profile, one pass per level)

Coins picked up during the night plus the win bonus (10 + 3 × night + 5 × stars; losses keep only the night's coins). The bot won 22 of 44 nights. World 1 was played in full; worlds 2–5 were sampled at levels 1, 5, 9, 10, 15 and 20, and their levels 1–10 are estimated from the average of the sampled levels 1–10.

| Stretch | Coins earned (bot, one pass) |
|---|---|
| World 1, levels 1–10 (measured) | 1,042 |
| World 2, levels 1–10 (est.) | about 2,300 |
| World 3, levels 1–10 (est.) | about 1,500 |
| World 4, levels 1–10 (est.) | about 1,700 |
| World 5, levels 1–10 (est.) | about 2,600 |
| **All five worlds to each level-10 boss** | **about 9,200** |
| World 1, all 20 levels (measured) | 1,931 |

Reading: the owner played all five worlds to level 10 and had about 15,000 coins, which fits this one-pass figure once replays of lost nights are counted (about 1.6×). Today's coin scale therefore already matches the owner's experience; the draft price list in `monetization.md` is judged against about 15,000 coins by 5-10 and roughly twice that by the end of Release 1. Not applied to the game yet: the owner is deciding the compromise.

### Later levels spaced out (2026-09-27, expected profile; before = 1 run per level, after = 2 runs per level)

Levels 11–20 of every world: spawn gap ×1.3 and bursts 10% instead of 18%, monster counts unchanged (owner).

| Levels | Before: wins, mean walls, mean length | After: wins, mean walls, mean length |
|---|---|---|
| World 1, 11–20 | 1/10, 64%, 85 s | 6/20, 71%, 118 s |
| Worlds 2–5, 15 and 20 | 2/8, 67%, 93 s | 2/16, 62%, 118 s |
| All 18 levels | 3/18 (17%), 66% | 8/36 (22%), 67% |

Reading: nights now last about 30% longer and world 1's second half became clearly more winnable (1-11, 1-14 and 1-16 won in both runs). Worlds 2–5 barely moved for the bot; their difficulty there comes from gimmicks (fog, hexes, castles, the sea) rather than pace. Single and double runs are noisy; treat per-level rows as indications. The bot still plays at the old expected profile (level 4–5 pumpkins in the second half).

---

## 12. Art, audio, tech

- All art is drawn in code on a canvas. No external images.
  - **Art direction (owner, 2026-09-26): "Toy Plastic"**, chosen on the style sheet (https://claude.ai/artifact/KvCFtEpbEbQBMKkWKyWSAd): glossy volume shading with a bevel, bounce light and a thin dark-tone edge, surface materials (pumpkin mottle, skin speckle, cloth weave, bandage strips, brushed metal, gel, wood, moss), MapleStory-like faces (huge eye whites, small pupils, fangs), and every monster a posed figure with real anatomy. Spec: `docs/superpowers/specs/2026-09-26-toy-plastic-sprites-design.md`.
  - **Pipeline**: `render/paint.js` (the painter and materials) → `render/chars.js` (pose-driven drawings; world 1 so far: pumpkins, Bat, Imp, Ghoul, Mossback, Mummy, Flaming Mummy, Gravekeeper) → `render/anim.js` bakes each character's clips (walk, chew, mummy collapse, boss cast / teleport / stab) into strip canvases at the canvas scale, once per level while the level card is open, and blits frames during play. Hit flash, frozen blue and world-variant tints are applied through a scratch canvas. Death pops and the Gravekeeper's teleport-out play as `G.vfx` entries; the engine only sets `m.anim = { clip, t, dur }` hints when a skill fires (Gravekeeper stab / cast / teleport, archer draw, diver throw, witch hex, Twin Tides bolt, Poltergeist swap / recolour, Vampire Count bats / wall, Hexwitch hex / zone), no rule changed. Characters are drawn one module per world in `render/chars/` (all five Release 1 worlds done on 2026-09-26: every monster, variant costume and boss has walk and chew clips plus its state clips: wraith fade, wisp drift, rider ride, doctor heal, knight rest, hauler push, archer hold and draw, vampire heal, Count trance / stun / bats / wall / teleport, mirror reflect, witch hex, Hexwitch hex / zone / teleport, crawler rise, diver surface / throw / down / hidden ripples, Twin Tides bolt / collapse, Poltergeist swap / recolour / teleport, chameleons in every locked colour); the rules for drawing them are in `docs/ART_BRIEF.md` and `tools/char_sheet.py` renders any character's strips for review. Returning variants (Bog Ghoul, Tide Imp, …) wear their world's theme as a drawn costume (kelp, mud, cobwebs, iron, wet sheen), not a tint (owner, 2026-09-26). The imp's arms hang while it walks and rise only on the hop (owner). A type missing from the registry falls back to the old live vector drawing. Effects live in `render/fx.js` (owner request, 2026-09-26): Deep Blue's chain is a jagged glowing bolt between the struck monsters, Black's blast is a fireball with rays, a shockwave and smoke sized to its splash zone, a witch's hex is an arcane zap that streaks to the target followed by a spinning rune circle in the locked colour (a red X for reverse hexes), the Plague Doctor's 3×3 is a green zone with a rune ring and rising crosses, the Bulwark's 3×3 a riveted steel zone with hex plates and a pulse, the Hexwitch's zones purple with spinning sigils and skull motes, and castle walls are baked stone-block sprites that crack and crumble as they lose health. Every boss has a `form2` variant: the level-20 full form is drawn about 12% bigger and more menacing (Gravekeeper: horned hood, half-visible skull, green lantern, chains, glowing runes; Poltergeist: crowned spectre with a second pair of ghostly hands and chest runes; Hexwitch: blood-moon palette, crow familiar, bone charm, glowing face cracks; Vampire Count: spread bat wings, crown, blood at the fangs, trailing red eye glow; Twin Tides: darker plates, extra horns and spikes, glowing cracks). Previews and intro cards show the form the level uses. Second review round (owner, 2026-09-26): wisp arms moved to its body, Shell Turtle rebuilt with a scuted shell, Puddle Diver redrawn as a drowned corpse, Twin Tides as an armoured serpent, Poltergeist as a tattered spectre. Third round (owner, 2026-09-26): the Vampire Count is a slim, sinister count (almond eyes, hollow cheeks, long fangs) whose trance closes his eyes inside a strong pulsing red aura; `render/sprites.js buildBg` paints one painterly composition per world (sky, moon, rim-lit horizon props, a field texture that keeps the seven lanes readable, toy soil cells) from per-world `WORLDS` theme fields (`sky`, `moon`, `halo`, `sil`, `rim`, `ground`, `grass`, `soil`, `mist`); field props are baked toy-plastic sprites in `render/fx.js` (palisade fence with four damage states and a broken gap, three headstone variants, lily-pad puddles, wave and foam tiles for the sea and shoreline, mist tiles for fog banks and columns, the torch-lit castle wall) blitted by `render/draw.js` with cheap live touches (ripples, scrolling waves and foam, drifting mist layers, torch flicker). Field props, tool effects and the hex sigil are baked sprites blitted per frame (the painter and shadow blur are per-frame no-gos on phones; owner reported lag from the scarecrow and the witch hex, fixed 2026-09-26). **Pumpkin faces** (owner, 2026-09-27): pumpkins have no face while they sit in the patch; when they join a bunch they light up with a carved, glowing face with a dark cut rim, and every type has its own expression (`render/faces.js`): Green a classic jack-o'-lantern, Fire furious slanted eyes and fangs, Black a manic toothy grin and Brown a grumpy frown (carved cut-outs, kept by the owner); the rest follow the owner's reference with glowing eyes lit from inside, dark pupils and brows, a tiny nose and a small mouth: Yellow greedy excitement, Ice cool heavy lids, Grey grim determination, Purple a sly sideways look, White startled, Deep Blue fierce focus, Pink warm and kind, Turquoise eager, Rainbow dazzled star pupils. Each bunch's glow is tinted to its pumpkin's colour. Every pumpkin on the board breathes and sways on its own rhythm with an occasional little hop (lit ones livelier), done with transforms on the baked sprite. Skins may supply their own face through `pumpkin(g, cols, lit, R, face)`. Tools are drawn in the same style by `render/tools.js` (owner, 2026-09-26): `toolIcon()` paints the tray, shop, preview, intro-card and drop icons (hammer, rocket, dynamite, lantern, spiked mine, bomb, scarecrow, fence); on the field a landmine is a trembling mound with a fuse ring that pops up as a spiked mine, a scarecrow drops in with a dust puff, sways, hosts a crow, shakes and sheds straw while chewed and falls apart as it wears, and the one-off effects play as `G.vfx` kinds (rockets that climb from the fence and burst, a hammer swinging twice on the repaired wall, dynamite whose fuse burns down on the grave, a lantern that lifts and sweeps warmth up the field, a bomb that falls in before the fireball, a scarecrow post tipping over). Fog is the heaviest prop (about three screen passes per bank); confirm on a phone on nights 2-15 to 2-19. A fog bank is uniformly dense across its whole hide extent and only a fringe outside that extent is translucent, so a monster is never hidden under thin-looking mist (owner, 2026-09-26).
- All sound is synthesised with Web Audio, no audio files: a pumpkin layer and a monster layer on every hit, a death sound per monster, boss sounds for arriving, casting, being hit and dying, a sound per tool, soft pops for sprouts, and different sounds for bunches of 3 and of 5+. The full table is `docs/AUDIO.md`. Music not yet added.
- Fonts: Creepster (titles) and Fredoka (UI) from Google Fonts, both SIL Open Font License.
- Vite project of plain JavaScript ES modules (`src/engine`, `src/data`, `src/ui`), no runtime dependencies. Levels are data in `src/data/worlds/`. Mobile-first touch controls; works with mouse too.

---

## 13. Name and IP notes

- Inspired by the mechanics of an old, discontinued Android game ("Pumpkins vs. Monsters", RunnerGames.Studios, ~2012). **Mechanics are not copyrightable**, but do not reuse its name, art, screenshots or text, do not market this as a remake/sequel, and do not use its name in store keywords.
- Stay clear of Plants vs. Zombies naming and styling.
- "Gourd Guard" is already used by an itch.io game-jam entry; pick a distinct name before a commercial launch and run trademark and app-store searches.
- AI-generated code/art may have limited copyright protection in some jurisdictions; substantial human creative input strengthens ownership. Get IP advice before launch.

---

## 14. Decisions log (why things are the way they are)

1. Free aiming with wall bounces → replaced by **lanes**: pumpkins fly straight up their column (felt buggy/unpredictable otherwise).
2. Matched pumpkins were locked → **lit is a live state**; any pumpkin can be moved.
3. Candy-Crush-style swapping → **sliding** pumpkins with empty spaces.
4. Whole-board tilt → **single-pumpkin slides**, plus the **push** rule for moving lines.
5. Double-tap to smash → **press and hold** to smash.
6. Shared fence hearts, monsters vanishing on contact → **per-column walls** that monsters stay and chew.
7. Generic Sharper knife / Lantern oil upgrades → **per-pumpkin levels** (old purchases refunded as coins).
8. Board widened from 6 to **7 columns**, 5 rows.
9. World 6 "graves only, every monster with modifiers" (old plan) → **hand-designed levels** with cross-world mixes, map gimmicks from every world and the Frenzy jukebox (owner, 2026-10-31). Beta behind `VITE_W6`.

---

## 15. Roadmap (agreed direction)

Goal: a polished **120-level** mobile game (6 worlds × 20 levels) with proper power scaling, 10 pumpkin types, monster variety with modifiers, one boss per world and a map gimmick per world. The full content plan is locked in `docs/WORLDS.md`.

Planned order:
1. **Restructure** the prototype into a real project: data-driven configs (pumpkins, monsters, levels, patterns) separate from engine code; automated balance testing across all levels.
2. **New ground rules** (locked in `docs/WORLDS.md` §2: sprouts in twos, kill reward roll, bosses stay back, returning monsters).
3. **More pumpkin types** (White, Black, Pink, Gold; see `docs/WORLDS.md` §5) and a proper power-scaling model for 120 levels.
4. **Monster variety** (attributes such as armor, shields, splitting, healing, flying over walls, lane-changing, etc.) and more bosses.
5. **Map variety** (board shapes, graves layouts, lane counts, hazards).
6. **120 levels** in 6 worlds: hand-designed milestone levels plus generated levels in between, tuned by the balance bot.
7. Art and music polish, then **mobile packaging**: installable web app first, then Capacitor for the App Store and Google Play.

Boomerang, Blast and Chain pumpkins were adopted into R1 (`docs/WORLDS.md` §5). Still parked: Candy (double coins), "bunch of 7 heals a wall", combo bonus for quick successive launches (listed in `docs/WORLDS.md` §10).
