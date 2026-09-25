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
Immovable obstacles placed on empty pattern cells at night start. They block slides and pushes, cannot be smashed, and are never filled by sprouts or drops.

| Nights | Graves |
|---|---|
| 1–2 | 0 |
| 3–5 | 1 |
| 6–9 | 2 |
| 10–12 | 3 |
| 13+ | 4 |

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
| Space / F / R / P or Esc | Launch best bunch / firework / wall repair / pause (desktop). |

Hints: after ~6 s idle with no lit bunch, the game outlines one pumpkin with an arrow showing a slide/push that builds a bunch (weighted toward columns with monsters).

---

## 4. Bunches and launching

- A **bunch** is 3+ orthogonally touching pumpkins of the same color. Any shape counts (lines, L-shapes, clumps).
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
| Green | green | Normal | Night 1 |
| Yellow | yellow | Normal (separate type and level from Green) | Night 1 |
| Ice | ice blue | Freeze | Night 2 |
| Fire | red | Flame | Night 4 |
| Grey | grey | Piercing | Night 6 |
| Purple | purple | Spawn | Night 8 |
| Rainbow | multicolor | Wildcard, no level | Rare (see below) |

### Level tables (levels 1–5, bought in the shop per type)

All types share the power curve: **1, 1, 1.5, 1.5, 2** (power = damage per hit).

| Level | Knockback chance (Green, Yellow, Grey, Purple) | Ice | Fire (burns × power) | Purple extra spawn on kill |
|---|---|---|---|---|
| 1 | none | slow 1 s | 2 × 0.1 | 25% |
| 2 | 25% | slow 1.5 s | 2 × 0.2 | 50% |
| 3 | 25% | slow 2 s, 25% freeze | 3 × 0.2 | 100% |
| 4 | 50% | slow 2.5 s, 50% freeze | 4 × 0.2 | 100% (25% of spawns are rainbow) |
| 5 | 50% | slow 3 s, 50% freeze | 5 × 0.2 | 100% (50% of spawns are rainbow) |

Details:
- **Knockback**: pushes the monster back up its column by one tile (one cell height). A monster eating a wall is pulled off it.
- **Ice**: slowed monsters move at 50% speed, eat walls at 50%, and turn blue. Frozen monsters stop completely (drawn inside an ice block) for the same duration and don't eat. New hits refresh timers; they don't stack. Bosses can be slowed but not frozen. Ice and Fire only knock back via the 5+ bunch rule.
- **Fire**: burns tick every **1 second**, first tick 1 s after the hit. A new fire hit refreshes to the larger count/amount.
- **Grey**: pierces every monster in its column; each hit rolls knockback separately.
- **Purple**: on a kill, may spawn an extra random pumpkin (from the loadout, never rainbow unless the level allows) that flies directly into a random empty cell of the patch. Nothing spawns if the patch is full.
- **Rainbow sources**: Purple level 4–5 spawns; 3% of sprouts and drops; every boss drop includes one rainbow.

### Upgrade costs (coins) per pumpkin type
Level 2: 40 · Level 3: 80 · Level 4: 130 · Level 5: 200.

### Loadout
- Nights 1–7 use every unlocked type (2, 3, 4, then 5 colors).
- From night 8 (6 types unlocked), the player picks **exactly 5** before each night. "Up to 5" was rejected because fewer colors make bunching trivially easy.
- Only loadout colors sprout and drop.

---

## 6. Pumpkin supply

- **Sprouts**: one pumpkin every *N* seconds in a random empty cell. *N* defaults to **5 s**; the player can set 2, 3, 4, 5, 6, 7, 8 or 10 s in the pause menu. When fewer than 10 pumpkins are on the patch, sprouting runs **2× faster** (catch-up rule, added because 5 s alone starved later nights).
- **Drops**: killed monsters drop pumpkins in the field (count = floor(drop) + chance of fractional part). They fade after 7 s (blinking in the last 2 s). Tap to collect.
- **Purple spawns**: see above.
- **Smashing** (hold) removes a pumpkin to make space.

---

## 7. Monsters

Speed is in "field lengths per second" before level multipliers (so 0.055 ≈ 18 s to cross). *Eat* is wall damage per second while chewing.

| Monster | HP | Speed | Eat | Coins | Drops | Behavior | First night |
|---|---|---|---|---|---|---|---|
| Ghoul | 1 | 0.055 | 0.5 | 2 | 0.8 | Walks straight | 1 |
| Bat | 1 | 0.085 | 0.4 | 2 | 0.8 | Fast, flutters in lane | 3 |
| Imp | 2 | 0.074 (avg) | 0.6 | 3 | 1.5 | Hops in bursts | 5 |
| Mossback | 4 | 0.028 | 1.1 | 6 | 3 | Slow tank | 7 |
| Wraith | 2 | 0.05 | 0.5 | 4 | 1.5 | Drifts to a neighboring column every 3.2–5 s (only mid-field) | 9 |
| Bramble King (boss) | 13 + 4 × world | 0.0092 | 1.0 per wall | 40 | 6 (incl. 1 rainbow) | Fills the middle 3 columns (2–4) and chews all three walls; from world 2 on, summons a bat into column 1 or 5 every 14 s; immune to knockback and freeze | Every 5th night |

- Monsters **queue**: a monster can't walk into the one ahead of it in its column. Only the front monster chews the wall.
- Spawn lanes avoid columns that already have a monster near the top.
- Monster perspective: drawn slightly smaller near the horizon.

---

## 8. Walls

- Each column has its own wall: **18 health + 5 per Sturdy walls level** (max level 3 → 33).
- A monster that reaches the wall stops and chews it at its *eat* rate (50% if slowed, 0 if frozen).
- **If any single wall reaches 0, the night is lost.**
- Stars are based on total wall health left at the end: ≥85% = 3 stars, ≥50% = 2, else 1.

---

## 9. Nights, pacing and progression (story mode, 15 nights in the prototype)

Three worlds of 5 nights: The Pumpkin Patch (1–5), Crooked Graveyard (6–10), Hollow Manor (11–15). Every 5th night is a boss night.

Per night *n*:
- Monsters: `6 + round(n × (n > 10 ? 1.1 : 1.6))`, minus 3 on boss nights (plus the boss).
- Spawn gap: `max(2.9, 4.0 − 0.11n)` seconds × random 0.6–1.4 (18% chance of a short gap ×0.3).
- Speed multiplier: `0.76 + 0.012 × min(n−1, 9) + 0.005 × max(0, n−10)`.
- Monster pool weights: Ghoul 10, Bat 6, Imp 6, Mossback 3 + 0.2n, Wraith 4 (each from its first night).
- Boss spawns once 40% of the night's monsters have spawned.
- The night is won when every monster (including the boss) is dead.
- Night banners announce new pumpkins, new monsters, bosses and new graves.

### Endless mode
Difficulty `1 + t/25`; boss every 100 s; world changes at 120 s and 240 s; uses unlocked pumpkins (loadout pick if 6 unlocked); score from kills.

---

## 10. Economy and shop

- Coins per kill (see monster table). Night bonus on a win: `10 + 3n + 5 × stars`. Coins found are kept on a loss.
- Shop ("Pumpkin shed"):
  - Pumpkin levels (per type, see costs above; locked types show their unlock night).
  - **Sturdy walls**: +5 wall health per level, 3 levels, 40 / 80 / 130.
  - **Wall repair** (consumable): fully repairs every wall. 40 coins, carry up to 3, player starts with 1.
  - **Firework** (consumable): 3 damage to every monster. 30 coins, carry up to 5, player starts with 1.
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

---

## 12. Art, audio, tech

- All art is drawn in code on a canvas (vector shapes); pumpkins are pre-rendered to sprites. No external images.
- All sound is synthesized with Web Audio. No audio files. (Music not yet added.)
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
