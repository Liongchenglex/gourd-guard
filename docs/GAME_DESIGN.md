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
| Pink | pink | Heal: every hit repairs the wall of the column it flew up by 1/1/2/2/3. Knockback 50/50/50/75/75%. | Level 2-8 |
| Black | black | Blast: explodes on its first hit for full power; the splash covers 3 lanes × 1 tile height (levels 1–3) or 3 × 3 (levels 4–5) at 50/50/75/75/100% power; level 5 splash also knocks back. Against a castle wall ×1.5. Knockback like Green. | Level 4-9 |
| Turquoise | turquoise | Bunches of 2 light up and launch (everything else needs 3); power is half of Green's: 0.5, 0.5, 0.75, 0.75, 1; knockback like Green. | Level 3-6 |
| Brown | brown | Grows on the patch by time since it appeared: small until 4 s, medium until 8 s, then big (level 3–4: 3 s and 6 s; level 5: 2 s and 4 s). Power = Green's × 0.5 / 1 / 2 by size; sizes mix in one bunch and each projectile hits for its own size. Knockback 0, 50, 50, 100, 100% by level. | Level 5-7 |
| White | white | Boomerang: a throw that hits nothing flies back into the patch and does not count as a miss. Levels 1–2: top-most empty cell of its column (else the nearest column with space); levels 3+: an empty cell beside a same-colour pumpkin when one exists. Knockback like Green. | Level 2-3 |
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
| Fire, Ice, White, Pink, Purple, Turquoise | 100 coins | 500 coins | 3,000 coins | 50 seeds |
| Grey, Black, Deep Blue, Brown | 1,000 coins | 2,500 coins | 50 seeds | 100 seeds |

The balance bot's expected upgrade profile has not been re-checked against these prices yet.

### Loadout
- While 5 or fewer types are unlocked, every unlocked type is in play (world 1: 2, 3, then 4 colours).
- From the 6th unlocked type (Pink at 2-8), the player picks **exactly 5** before each level. "Up to 5" was rejected because fewer colors make bunching trivially easy.
- Only loadout colors sprout and drop.
- Level-by-level tables for every type, including the ones with their own effects, live in `docs/WORLDS.md` §5.

---

## 6. Pumpkin supply

- **Sprouts**: **two pumpkins** every *N* seconds, each in its own random empty cell with an independent colour (one if only one cell is free, none if the patch is full). *N* defaults to **5 s**; the player can set 2, 3, 4, 5, 6, 7, 8 or 10 s in the pause menu. When fewer than 10 pumpkins are on the patch, sprouting runs **2× faster** (catch-up rule, added because 5 s alone starved later nights).
- **Kill rewards**: every non-boss kill rolls exactly **one** reward: **weapon 10%**, **pumpkin 30%**, **coins 60%** (`src/data/rules.js`). A pumpkin roll drops `max(1, round(drop))` pumpkins in the field; a weapon roll drops one consumable (Wall repair or Firework, chosen among those below their carry limit; if all are full the roll pays coins instead); a coin roll pays the monster's coins. Bosses skip the roll and always pay coins plus their pumpkin drop. Drops fade after 7 s (blinking in the last 2 s). Tap to collect.
- **Purple spawns**: see above.
- **Smashing** (hold) removes a pumpkin to make space.

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
| Fogwalker | 1 | 0.05 | 0.4 | 6 | 2 | Carries a fog band 0.12 of the field tall across every lane at its height; everything inside (itself included) is hidden unless a Lantern is burning | 2-16 |
| Witch | 3 | 0.04 | 0.5 | 9 | 2 | Every 6 s turns a random monster, other witches included but never a true Chameleon, Reverse Chameleon or boss, into a reverse chameleon (75%) or a chameleon (25%); an already hexed monster can be re-hexed to a new colour | 3-16 |
| Bulwark Knight | 5 | 0.04 | 0.7 | 12 | 3 | 3×3 aura (steel box): monsters inside have hp and max hp doubled on entry and halved on leaving; a ×2 label shows beside their health dots | 4-16 |
| Shell Turtle | 10 | 0.03 | 0.3 | 12 | 3 | Rises from a puddle, walks backwards shell-first, immune to knockback: a moving wall in front of whatever follows it | 5-16 |
| Mummy | 2 | 0.045 | 0.6 | 5 | 2 | Only Fire (hits or burn ticks) kills it. Any other kill makes it collapse on the spot for 4 s, untargetable and not walking, then it stands up at full health. No rewards for a collapse | 1-9 |
| The Hexwitch (world 3 boss) | 22 (form 1) / 40 (form 2) | 0.03 until she holds | 0 | 50 | 6 (incl. 1 rainbow) | Holds at 25% and drifts to a neighbouring lane every 6 s. Every 9 s (7 s in form 2) hexes 2–3 monsters on the field: form 1 makes reverse chameleons only, form 2 makes chameleons 25% of the time and reverse chameleons otherwise. Every 14 s lays a **hex zone** lasting 10 s: any non-boss monster killed inside it collapses and rises after 4 s. Form 1: one 3×3 zone. Form 2: two zones, each a 3×3 box, a whole 1-wide column, or a 1-tall row across all 7 lanes (owner, 2026-09-26). 3-10's pool has no chameleon spawns; her hexing is the only source there. Immune to knockback and freeze | 3-10 (form 1), 3-20 (form 2) |
| The Twin Tides (world 5 boss) | 14 each (form 1) / 24 each (form 2) | 0.03 until they hold | 0 | 30 each | 3 each (incl. 1 rainbow) | Two serpents in distinct random lanes, holding at 12% (the sea row) in form 1 and halfway down the field (50%) in form 2. Every 6 s (4.5 s in form 2) each hurls a water bolt at a random standing wall for 3: a tail rises out of the water in that column and throws from there. Killing one alone puts it **down** for 8 s (5 s in form 2), untargetable; if the other dies inside that window both die for good, otherwise the fallen one rises at full health. The progress bar tracks their combined health. Immune to knockback and freeze | 4-10 (form 1), 4-20 (form 2) |
| The Vampire Count (world 4 boss) | 24 (form 1) / 42 (form 2) | 0.03 until it holds | 0 | 50 | 6 (incl. 1 rainbow) | Holds at 30%. Every 9 s bursts into bats and reforms in another lane. Every 10 s (8 s in form 2) calls 2 bats. Every 15 s raises a castle wall (the level's wall HP) if fewer than 3 stand. Every 20 s (16 s) enters a **healing trance**: stands still healing 1 HP every 2 s and shows "heal ×N" (N = 2, 3 or 4 in form 1; 4, 5 or 6 in form 2; owner nerf 2026-09-26, was 2 HP/s and 4–6 in both forms); each hit counts down and at zero the trance breaks and it is stunned 2 s. Form 2 also heals 1 HP every 2 s whenever it has not been hit for 4 s. Immune to knockback and freeze | 3-10 (form 1), 3-20 (form 2) |
| The Poltergeist (world 2 boss) | 20 (form 1) / 36 (form 2) | 0.03 until it holds | 0 | 45 | 6 (incl. 1 rainbow) | Holds at 25% of the field and drifts to a neighbouring lane every 5 s. Every 8 s swaps two random pumpkins on the patch, animated so they can be followed; form 2 (every 6.5 s) juggles three at once in a cycle and every 12 s repaints three pumpkins to other loadout colours (owner, 2026-09-26). Immune to knockback and freeze | 2-10 (form 1), 2-20 (form 2) |
| The Gravekeeper (world 1 boss) | 15 (form 1) / 30 (form 2) | 0.03 until it holds | 0 (never reaches the wall) | 40 | 6 (incl. 1 rainbow) | Walks to 28% of the field and stops. Every 6 s teleports to a different lane. Raises a ghoul in a random lane at its own depth every 8 s (form 1) or 5.5 s (form 2). Form 2 also shoves one monster 30% of the field forward every 12 s. Immune to knockback and freeze; can be slowed | 1-10 (form 1), 1-20 (form 2) |

- Monsters **queue**: a monster can't walk into the one ahead of it in its column. Only the front monster chews the wall.
- Spawn lanes avoid columns that already have a monster near the top.
- Monster perspective: drawn slightly smaller near the horizon.

---

## 8. Walls

- Each column has its own wall: **18 health + 5 per Sturdy walls level** (max level 3 → 33).
- A monster that reaches the wall stops and chews it at its *eat* rate (50% if slowed, 0 if frozen).
- **A wall at 0 is down, not lost**: monsters at a fallen wall walk through the gap instead of chewing, and the night is lost about 1.2 s later when one is through (slowed monsters take longer, frozen ones don't move). Repairing the wall before that closes the gap. Archers, divers and the Twin Tides never shoot at a wall that is already down (owner, 2026-09-25).
- Stars are based on total wall health left at the end: ≥85% = 3 stars, ≥50% = 2, else 1.

---

## 9. Levels, pacing and progression (story mode)

Levels are data: one literal per level in `src/data/worlds/world<N>.js` (schema in `src/data/levels.js`). World 1 (Pumpkin Patch) has 20 levels; worlds 2–6 are empty and show as "coming soon". Level addresses are `world-level`, e.g. `1-7`; internally story night *n* is the global index.

Per level the data gives: starting pattern, graves, wave size, spawn gap, speed multiplier, weighted monster pool, boss and boss form, pumpkins and tools unlocked, and monsters introduced (banner text). Runtime rules on top of the data:
- Spawn gap is jittered ×0.6–1.4 with an 18% chance of a short gap ×0.3.
- The boss appears once 40% of the wave has spawned. On boss levels spawning continues until the boss dies (see §7).
- A level is won when the wave is exhausted (or the boss is dead) and no monster is left.
- **Level select is a storybook shelf** (owner, 2026-09-26): six picture books on two wooden shelves, one per world, each cover painted with that world's horizon scene (`worldScene()` in `render/sprites.js`), a star tally, and chains with a padlock until the previous world's level 10 is beaten (Hallow's End is a dark "coming soon" tome). Tapping a book opens it with a pop-up: the world's scene rises from the gutter in 3D, the left page carries the world's lore (`src/data/lore.js`) and its boss portrait, the right page the 20 levels as ink stamps on paper (filled when starred, gold ring on the next level to play, boss portraits on 10 and 20, dashed when locked) and the star count. A Bestiary button turns the page (both pages flip edge-on) to the world's collection: every monster, variant, companion and boss in order of first appearance with its portrait, a one-line ability and a line of lore (`src/data/bestiary.js`); a monster counts as met once any level containing it is open, and until then shows as a silhouette with the level to reach. Back from a preview or the loadout returns to the open book; Close book returns to the shelf.
- **Pumpkin picking** (owner, 2026-09-27): pumpkins are listed in unlock order (Green and Yellow first) with their level badge and a one-line role; tapping one picks it and fills a detail card with its level effects (`lvDesc`) and a line of lore (`PUMPKIN_LORE` in `src/data/lore.js`). With Focused patch on, exactly four can be picked and the title says so. The five level-20 trophies are shown as **Powers** on the level preview card (owner, 2026-09-27), drawn as cups with each world's emblem (`render/trophies.js`): gold when on, dim when off, locked with a padlock and "Complete <world>" until that world's level 20 is beaten; tapping one switches it and states its power. Powers not won yet keep their padlock and "Complete <world>" line and add a pulsing RENT tag: tapping one explains the power and offers "Rent for this night" for 60 coins (`RENT_COST` in `src/data/perks.js`, a first guess for tuning); a rented power is active for the next night only and is cleared when that night ends (owner, 2026-09-27). A future release adds a second section on the picking screen for playstyle gourds (owner).
- **Title screen** (owner, 2026-09-27): phone-wallpaper key art painted once by `render/keyart.js`: the Gravekeeper and his horde (bats, mummies, a Flaming Mummy, the Mossback, ghouls, imps) in front of a harvest moon, a lit Fire pumpkin streaking up at them, and the pumpkin army in three rows along the bottom, gently bobbing, with the logo on top and the buttons beneath.
- **Shop** (owner, 2026-09-27): tabs across the top (Pumpkins, Tools, Seeds; more shops are added as tabs). Pumpkins not unlocked yet show only a dark silhouette, "??? pumpkin" and the level that unlocks them (owner). Pumpkins are listed in unlock order, each showing power, knockback and special now, with the next level's value in green beside anything that changes. Tools show how many are carried or the upgrade level. Seeds is a second currency (`save.seeds`, shown next to coins) for special items in future shops; its packs are listed with store prices but disabled until the app-store release wires in-app purchases, so nothing in the web build charges money.
- **Level preview**: choosing a level opens a card showing the monsters in its pool (NEW tags on first appearances), the boss if any, and a "New this level" row only when the level unlocks a pumpkin or a tool. No counts and no loadout listing (owner, 2026-09-25). Start from there.
- **Introduced monsters always appear**: every monster listed in a level's `intro` is forced into the spawn order right after the first spawn, so an introduction is never an empty promise.
- **Level 16** of every world introduces one more monster (see §7): Flaming Mummy, Fogwalker, Witch, Bulwark Knight, Shell Turtle. The preview on levels 10 and 20 also states the reward (next world, or the perk).
- **Loadout lock**: on a level that introduces a pumpkin, that pumpkin is pre-selected in the pick-5 screen with a NEW tag and cannot be deselected. On any level whose pool contains Mummies (or a Mummy variant), Fire is pre-selected and locked with an ⓘ badge and the line "Fire is locked in: mummies only die to Fire"; Flaming Mummies lock Ice the same way, so both can be locked at once (owner, 2026-09-25).
- **Intro cards**: the first time a pumpkin, tool, graves, monster or boss form appears, a card with its icon and one paragraph must be confirmed before the level starts (`save.seenIntro`). The bot's `startGame` path bypasses both screens.
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
Level data gives `castles:{ n, hp }`: at level start *n* stone walls stand in distinct random lanes at 40–72% of the field: 1×6 HP in levels 1–4, 2×9 in 5–10, 3×12 in 11–15, 3×15 in 16–20 (owner, 2026-09-25: ramp 6 → 15). Monsters walk through them freely. A pumpkin flying up its lane hits the wall before anything behind it: it deals its power to the wall and stops. Grey deals its power and continues. Black deals ×1.5, stops, and splashes monsters and walls in the neighbouring lanes at that height for half. Bombs damage walls too. Broken walls crumble away. The Vampire Count raises new ones.

### Fog (world 2 map gimmick)
Level data lists fog banks as `[top, bottom]` fractions of the field. A monster whose position is inside a bank is not drawn (nor its health), except bosses, which glow through; it keeps walking, chewing and making sounds, and pumpkins hit it as normal. Banks: one thin bank in levels 1–4, one wider bank 5–9, two banks 10–14, two wider banks 15–20. The Lantern tool thins every bank for 10 s and shows what is inside.

### Authored levels 11–19
Levels 11–19 of every world are hand-authored (`docs/WORLDS.md` §8a) with these level fields: `gravesLayout` (explicit patch cells, replacing pumpkins there), `laneWeights` (spawn weight per lane; 0 = never), `fogRows` / `fogCols` (tile rows from the top, whole lanes), `gust.partial` (each gust touches 2–3 columns or rows, marked by arrows during the warning), `castlesLayout` (explicit walls), `shore` (tile rows of sea; monsters spawn at its edge, puddles sit below it, divers may lurk anywhere in it), `hexAll` ('reverse' or 'chameleon' applied to every non-boss spawn) and `name` (shown on the preview). Witches and the Hexwitch may re-hex an already hexed monster into a new colour.

### Unlocks and progression
- Level 1 of a world opens when the previous world's level 10 has been beaten. Every other level opens when the level before it has been beaten. Beating level 10 therefore opens levels 11–20 and the next world at once.
- **Level-20 perks** (`src/data/perks.js`): beating a world's level 20 grants a permanent perk, toggleable in the pause menu: 1-20 quick smash (0.35 s hold), 2-20 sprouts 1 s sooner, 3-20 half of sprout ticks bring 3 pumpkins, 4-20 rainbow chance 10%, 5-20 loadouts of 4 allowed. The result screen announces the perk.
- **Unlocks are global**: once a pumpkin or tool is unlocked it can be used on every level, including earlier ones (owner, 2026-09-25). Availability is computed from the highest open level, not the level being played.
- Unlocks sit in levels 1–10 so nothing is missable. World 1: Yellow 1-2, Wall repair 1-3, Ice 1-5, Grave buster 1-6, Firework 1-7, Fire 1-8 (owner reorder, 2026-09-26). World 2: Lantern 2-2, White 2-3, Landmine 2-5, Pink 2-8. World 3 (Witchwood): Scarecrow 3-2, Purple 3-3. World 4 (Crumbling Keep): Bomb 4-4, Grey 4-6, Black 4-9. World 5 (Drowned Marsh): Deep Blue 5-4. World order was changed by the owner on 2026-09-25; level addresses inside the monster and gimmick tables use the new numbering.
- Stars are keyed by global night index in the save; `save.unlocked` mirrors the highest open night for older code and the endless-mode loadout.

### Endless mode
Difficulty `1 + t/25`; the Gravekeeper every 100 s (form 2 once the world changes); world changes at 120 s and 240 s; uses unlocked pumpkins (loadout pick if 6 unlocked); score from kills.

---

## 10. Economy and shop

- Coins per kill (see monster table; paid on 60% of kills, see §6 kill rewards). Weapons also drop from 10% of kills. Night bonus on a win: `10 + 3n + 5 × stars`. Coins found are kept on a loss. Consumables also drop from 10% of kills (§6).
- Shop ("Pumpkin shed"):
  - Pumpkin levels (per type, see costs above; locked types show their unlock night).
  - **Sturdy walls**: +5 wall health per level, 3 levels, 500 / 1,000 / 1,500.
  - **Every consumable tool costs 300 coins** (owner, 2026-09-27; the per-tool prices below are superseded). Renting a level-20 power costs 100 coins.
  - **Wall repair** (consumable): fully repairs every wall. 40 coins, carry up to 3, player starts with 1.
  - **Firework** (consumable): 3 damage to every monster. 30 coins, carry up to 5, player starts with 1.
  - **Grave buster** (consumable, 🧨 icon): tap the button, then tap a grave to dig it out. 30 coins, carry up to 3, one free at level 1-6. Tapping anywhere else cancels.
  - **Lantern** (consumable, 🏮): clears every fog bank for 10 s. 25 coins, carry up to 3, one free at 2-2. Disabled while a lantern is already burning; refuses on levels without fog.
  - **Landmine** (consumable, 💣): tap the button, then tap any column. The mine waits at that column's wall line and blasts the first non-boss monster to reach it for 6 damage. One mine per column. 35 coins, carry up to 3, one free at 2-5.
  - **Bomb** (consumable, 💥): tap the button, then tap a spot on the field. Everything within one lane either side and 1.5 tile heights up or down takes 4 damage, castle walls included. 45 coins, carry up to 3, one free at 3-4.
  - **Scarecrow** (consumable, 🌾): tap the button, then tap a column. A scarecrow with 12 health stands near that wall; monsters in the column stop at it and chew it at their eat rate until it breaks. One per column. 35 coins, carry up to 3, one free at 5-2.
  - **Tools are gated by introduction**: a consumable exists only from the level that introduces it (Wall repair 1-3, Firework 1-7, Grave buster 1-6, Lantern 2-2, Landmine 2-5, Scarecrow 3-2, Bomb 4-4, from level data `unlockGear`). Before that it shows in the tool tray dimmed with a padlock, is locked in the shop, and never drops from kills. New players start with 0 of everything and receive one unit on the introducing level.
- **Wardrobe** (shop tab, added 2026-09-27, owner). Cosmetic only: nothing here changes power. Priced in pumpkin seeds; prices are first guesses.
  - **Costumes** are worn by every pumpkin at once, in the patch and in flight, and add a hit effect and a quiet hit sound. One costume at a time. Boss costumes are **traded for 30 of that boss's items** (see Monetization below); costumes already owned stay owned: Gravekeeper hood (tombstone, soul wisps, bone chips), Poltergeist sheet (cold mist, small ghosts, hollow whoosh), Hexwitch hat (hex sigil, sparks), Count's collar (bats), Tide crown (seawater splash, small fish). Shop-only costumes cost 25 seeds: Pirate tricorn (coins, cannon smoke) and Jester's cap (confetti).
  - **Skins** restyle one pumpkin colour: its body, its lit face and a wide comet trail. The colour stays recognisable. One skin per colour. Each skin adds a quiet launch accent under the shared whoosh, once per flick: Frost a crystalline chime, Magma a low rumble and sizzle, Candy corn a sugary sparkle pop, Galaxy a soft shimmer. Hit sounds stay per pumpkin type because they carry game information; costumes get no launch sound because every pumpkin wears them. Candy corn (Yellow, 30 seeds), Frost crystal (Ice, 30), Magma (Fire, 40), Galaxy (Purple, 40). Wardrobe prices were rescaled to the seed economy below (default).
  - Saved as `save.wardrobe = { owned, costume, skins: { typeIndex: key } }`. Hit effects are capped at 5 on screen.
  - A "Testing: add 500 seeds" link sits in the Seeds tab (**remove before release**).
- **Monetization** (owner's `monetization.md`, built 2026-09-27; every number in `src/data/economy.js`, marked "default" where the sheet gave none):
  - **Pumpkin seeds** are the premium currency: top pumpkin levels, skins, costumes and boss items. Sources: rewarded ads (1 seed each, 15 a day), seed packs (10 for $3.99, 25 for $7.99, 50 for $10.99), treasure chests, any boss kill (5% chance of 1–3), and the Loot Sack.
  - **Player awareness**: a pulsing green "Free seed, N left" pill on the book shelf, in the shop header and under every result card; a dot on the shop's Seeds tab while free seeds or chests wait; the Seeds tab opens with the ad card.
  - **Rewarded ads** go through one call (`src/engine/ads.js`, `showRewarded(placement)`). The Capacitor build supplies `window.GGAds`; in the browser a placeholder ad counts down 5 s. Placements: free seed, chest reroll, second chance, Loot Sack.
  - **Seed packs** go through `src/engine/store.js` (`window.GGStore.buy(sku)` in the app build). In the browser the pack buttons are disabled and say nothing is charged.
  - **Treasure chests**: a normal chest drops from 1% of kills on normal (non-boss) nights (at most one a night, default), is the main prize of every level-10 boss, and drops from half of Loot Sacks; only level-20 bosses drop a boss chest. A normal chest holds 2 prizes, a boss chest 3. Each prize rolls: boss item (0% / 5%), 1 seed (2% / 5%), a set of 5 random introduced tools (40% / 35%), else coins (58% / 55%; 100–200 / 250–500, default). Coins are the most common prize in both (owner, 2026-09-27; the boss chest's 60% tools from the sheet was lowered to 35%). Tools past their carry limit pay 100 coins each (default). Chests are saved the moment they drop and opened from the result card, the shelf or the Seeds tab; one ad rerolls a chest once.
  - **Boss items**: one per boss (Grave key, Sheet scrap, Hex charm, Bat wing, Tide pearl). 30 make that boss's costume in the Wardrobe. They come from level-20 boss chests or cost 10 seeds for 10 (default). They are never sold for coins (owner). The level-10 boss no longer gives its costume free.
  - **Continue a lost night** ("reconvene lost nights", owner 2026-09-27): the night is lost as usual when a monster walks through a fallen wall. The lose card then offers "Watch ad to continue". Watching restarts that night with fresh walls and patch, and only the monsters not yet beaten come again (those alive on the field plus those never spawned); a boss that was out returns at once with the health it had left. Once per night. The balance bot never continues.
  - **Loot Sack**: the level card offers an ad to summon one into that night. It waddles in 4 s after the start across two lanes, stops at 38% of the field, never chews walls, and flees after 25 s (gold timer bar under its health). Health 10 + 4 per world. Beaten, it drops a chest (50%), a tool set (25%) or 80–160 coins (25%), plus 1 guaranteed seed and a 5% chance of another. A Loot Sack still on the field does not hold up the win.
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
