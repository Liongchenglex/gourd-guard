# Release 5: Nightmare Foggy Hollow (design)

Owner conversation, 2026-11-05. Built on branch `dev`, gated `__RELEASE__ >= 5`. **Release 5 is a beta** (owner): built to see how it plays, polished and tuned seriously later; no bot balance runs. Release 4 (Nightmare Pumpkin Patch) is a **beta** the owner will revisit later; Release 5 builds on its shared systems (the nightmare track, the gourd, the picker, boss patterns) and must not change how Release 4 plays.

## Intent

The second nightmare book. Pumpkin Patch's nightmare was about **fire**; Foggy Hollow's is about **rot**. Poison fog rolls over the patch and spoils pumpkins. A rotten pumpkin is mostly a liability (it heals what it hits), but some enemies can only be hurt by rot, so the player has to keep some rot around, aim it, and protect the rest of the patch from it. The new **Protector Gourd** is the answer to rot: it shields its square and turns rot into Rainbows when broken.

Audience and difficulty as Release 4: endgame players who beat 5-20; "open and simply be very hard". Numbers below marked *(our number)* are first guesses; the owner tunes from playtests (no bot balance runs: owner, 2026-11-05).

## Goals
- Nightmare 2-1 to 2-16 (`N2-k`, nights `nmNight(2, k)` = 1100 + k), opened by the world 2 book's demon bookmark.
- Poison fog on the patch, rotten pumpkins, five new monsters, the Lamplighter mini boss, the Protector Gourd with a two-gourd picker, and the Fallen Poltergeist boss.
- Every level has a theme. Art comes from the archive where it exists.

## Non-goals
- No changes to Release 4's rules or levels (shared code may be generalised, never re-tuned).
- No fire tiles in Foggy Hollow (fire is Release 4's gimmick).
- No new tools, no new purchasable pumpkin.
- Rewards are placeholders (one treasure chest per boss win), polished later (owner's standing rule).

## Anti-goals
- Rot must never feel random-unfair: every rot source is telegraphed (fog arrows, a Poltergeist's cast) and the Protector Gourd always works.
- No per-frame painting (perf rule): fog, zones, the worm, mood glows are baked sprites.
- Lower builds (store, R2, R3, R4) carry nothing from Release 5.

---

## Part 1: The track and the book

- `NIGHTMARE_LEVELS[1]` from `src/data/worlds/nightmare2.js`; `nmNight(2, k)`; label `N2-k`, title "Nightmare 2-k"; theme: the archived nightmare Foggy Hollow map (`docs/archive/nightmare-worlds/`: sickly green moon, poison-green fog, ghostfire lanterns, red eyes, bony hands in the bog, a hooded figure).
- **Opens** once 2-20 is beaten **and** N1-4 is beaten *(our call: N1-4 is what unlocks the Grave Gourd, which stands on the patch from N2-1)*. Below that the world 2 bookmark page says what is missing.
- Book page, stamps (16), nightmare bestiary, intro cards and the level preview work as Release 4's do.

## Part 2: Rotten pumpkins (owner)

- A **rotten pumpkin** is its own colour on the patch (`ROTTEN`), drawn from the archive's rotten pumpkin (`docs/archive/nightmare-monsters/riders/riders.js` `rotten()`: lopsided ribs, brown rot, white mould, wilted stem, X eyes) **plus a worm poking out of it** (owner). It is never sprouted and never in the team; pumpkins become rotten only through rot (Parts 3, 6).
- Rotten pumpkins bunch with each other like any colour (two or more touching light up, with a sickly green glow) *(our call)*. Rainbow and Paint do not join rotten bunches *(our call)*.
- **On hit:**
  - An ordinary monster is **healed by half a hit point** (owner), never above its full health. No damage, no on-hit power, no knockback.
  - A monster inside a **Plague Doctor 2's** 3×3 (Part 4), the **Lamplighter in its rot mood** (Part 5) and the **Fallen Poltergeist in its reaper phase** (Part 8) take damage from it: `ROT_DMG` 1.5 per pumpkin *(our number)*, no on-hit power.
  - The flight is a normal flight: it stops at the first thing it meets.
- A rotten pumpkin can still be slid, crushed by holding it, and pushed.

## Part 3: Poison fog on the patch (owner)

- Like Witchwood's narrow winds (`gust` with `partial`): at level-set intervals poison fog covers **1–2 whole rows or columns of the patch** (owner: "rows/columns").
- **Warning first:** green arrows over the lines it will cover for 1.5 s *(our call: as the wind's warning arrows)*, then the fog lies there for `dur` s (3 s, *our number*) and drifts off.
- Every pumpkin under the fog when it settles, or slid / sprouted into a fogged cell while it lasts, **turns rotten**. Pumpkins in a Protector Gourd's 3×3 never rot. Gourds never rot.
- Level field `poison: { every, lines:[min, max], dirs:['row', 'col'], dur }`. Baked fog sprite per line, blitted with a pulsing alpha (perf rule).

## Part 4: New monsters

All drawn already in `docs/archive/nightmare-monsters/` unless said.

| Monster | Rules | Art |
|---|---|---|
| **Plague Doctor 2** (`rotdoctor`) | Owner: monsters inside its 3×3 can only be hurt by rotten pumpkins; the doctor itself is hurt by anything. A normal pumpkin hitting a protected monster stops there with a "blocked" puff and does nothing *(our call)*. It does not heal *(our call: the owner's rule replaces the old heal)*. Slow, 4 health *(our number)*. Baked 3×3 zone in poison green | `vampires-doctor/` (Rot Doctor) |
| **Reaper** (`reaper`) | Owner: an upgraded Wraith. Fades out for longer (hide 4 s, show 3 s *(our numbers)*; the Wraith is 2.5 / 4), moves faster (sp 0.07, *our number*; the Wraith 0.05), 3 health, any pumpkin can kill it. When it dies a **crow** (Release 4's, it raids the patch) bursts out where it fell | `spirits/` (glide, reap clip unused) |
| **Fogwalker 2** (`fogwalker2`) | Owner: 3 health, its fog band covers **2 rows**, and it arrives with **Mossbacks**: two Mossbacks spawn beside it as part of its arrival *(our call: in the lanes either side, as minions)*. A Lantern shows it, as the Fogwalker | `spirits/` (exhale clip) |
| **Wisp Rider 2** (`comet`) | Owner: speeds all the way down to the fence (no stopping). It cruises, then streaks down its lane (dash clip) to the fence and chews. First hit breaks it into a plain Wisp and a walking Imp, as the Wisp Rider *(archive proposal)* | `riders/` (Comet Rider) |
| **Poltergeist 2** (`minipolt`) | Owner: moves between lanes, now and then disappears and reappears, and turns pumpkins rotten. Every 6 s it rots 1–2 random pumpkins outside any Protector square (a cast tell, then a green puff on each) *(our numbers)*; drifts a lane every 5 s; vanishes for 2 s every 7 s (untargetable, like a Wraith) *(our numbers)*. 3 health | `spirits/` (Mini Poltergeist) |

Dropped (owner): the Rotten Imp. Story monsters reused: Bog Ghoul and other world 2 variants, Wisp, Wraith, Wisp Rider, Plague Doctor, Marsh Imp, Fogwalker, Mossback; crows (Release 4) where a level wants them.

## Part 5: The Lamplighter (mini boss, N2-4 and N2-13)

- Owner: no lantern mechanic. It has **two moods** and switches between them: in one only **rotten** pumpkins hurt it, in the other only **normal** pumpkins do. The wrong kind does nothing (a "blocked" puff; a rotten one that does nothing does not heal it either *(our call)*).
- Mood switch every 8 s *(our number)*; the glow tells which: **sickly green** = rot mood, **amber** = clean mood *(our call)*. Baked from the archive's `drift` (lit) and `dark` clips, tinted per mood.
- Boss rules as the Strawlord: holds at the back, never reaches the wall, immune to knockback and freeze, monsters keep coming until it falls. Drifts to another lane every 8 s *(our number)*. So the player always has rot to answer its rot mood, it **calls a poison fog line** on the patch every 12 s *(our call)*.
- 24 health; N2-13 is form 2 (34 health, switches every 6 s) *(our numbers)*. One treasure chest per win. Beating N2-4 unlocks the Protector Gourd.

Art: `minibosses-hollow-keep/` (the Lamplighter).

## Part 6: Gourds (owner)

- **Two gourd slots.** The picker gets a second gourd slot: the team is up to 4 or 5 pumpkins plus up to **2 gourds**, each slot taking any unlocked gourd. For now the two must be different kinds (the Grave Gourd and the Protector Gourd); the slots are built so allowing two of the same kind later is a one-line rule change (owner). Release 4's single-gourd behaviour (N1-5 on) is unchanged: with one gourd unlocked there is one gourd on the patch.
- The engine generalises from "the gourd" to a list of gourds on the patch, each a grid cell with its kind (`gourd:'grave'` / `'protector'`), its own destroyed-and-due-back state and its own place. Both stand on the patch at once.
- **The Protector Gourd** (new; unlocked by N2-4, tutorial on N2-5 with the coach, the same shape as N1-5's):
  - **Protects** the pumpkins in its 3×3 from rot and from destruction (owner): poison fog, Poltergeist 2 and the Fallen Poltergeist cannot rot them; crows and any monster ability cannot destroy them. The player can still crush them by holding.
  - **Launches from it:** a pumpkin launched from its 3×3 gets **100% knockback** and **heals the fence** of its column when it is launched (owner): `PROTECT_HEAL` 1 health per pumpkin, never above full *(our number)*.
  - **Breaking it** (hold, as the Grave Gourd): every rotten pumpkin in its 3×3 becomes a **Rainbow pumpkin** (owner). It comes back on the next sprout tick, as the Grave Gourd does.
  - It does not sprout (owner). Art: new, Toy Plastic, a pale-gold ribbed gourd with a ward glow *(our call; shown to the owner before building levels on it)*.
- The Grave Gourd keeps every Release 4 rule (sprout fill, grave clearing).

## Part 7: Levels N2-1 to N2-15 (drafted by us, each with a theme)

| # | Name | Idea |
|---|---|---|
| 2-1 | Rot Mist | Poison fog on the patch and rotten pumpkins, taught with world 2 monsters (intro card for both) |
| 2-2 | The Reaper | Introduces the Reaper (and its crow) |
| 2-3 | Night Doctors | Introduces Plague Doctor 2: save your rot for its square |
| 2-4 | The Lamplighter | Mini boss; unlocks the Protector Gourd |
| 2-5 | The Protector Gourd | Tutorial (coach), steady fog, then the night carries on |
| 2-6 | Fog Giants | Introduces Fogwalker 2 and its Mossbacks |
| 2-7 | Comet Trail | Introduces Wisp Rider 2 |
| 2-8 | Restless Spirits | Introduces Poltergeist 2 |
| 2-9 | Thick Fog | Field fog banks (the story mechanic) plus Fogwalker 2s and Reapers |
| 2-10 | Plague Ward | Many Plague Doctor 2s; frequent poison fog |
| 2-11 | Wisp Storm | Wisp Riders 2, Wisps and crows |
| 2-12 | Haunted Patch | Poltergeist 2 swarm |
| 2-13 | Lamplighter Returns | The Lamplighter in form 2 |
| 2-14 | The Rot | Near-constant poison fog, Reapers and Plague Doctor 2s |
| 2-15 | The Long Night | The gauntlet: every new monster |
| 2-16 | The Fallen Poltergeist | The boss (Part 8) |

The Grave Gourd stands on the patch from N2-1; the Protector Gourd joins from N2-5.

## Part 8: The Fallen Poltergeist (N2-16)

From the owner's notes (`dump.md`) and the archive art (`docs/archive/fallen-bosses/poltergeist/`); drafted by us.
- Boss rules as the others (holds, never reaches the wall, monsters keep coming until it falls). 45 health *(our number)*.
- **Vanishes and reappears in other lanes** every 6 s.
- **Swaps pumpkins**: every 8 s it swaps the positions of 3 pumpkins, colours unchanged (swap clip), never touching a Protector square.
- **Black fog like Plague Doctor 2**: every 12 s it lays a 3×3 rot-only zone on the field for 8 s around a random monster; monsters in it can only be hurt by rotten pumpkins.
- **Changes the whole board** at 66% and 33% health: every pumpkin outside Protector squares is shuffled to a new cell.
- **Reaper phase** at 50% and 20% health: it can only be hurt by rotten pumpkins until it has taken 3 rotten hits, then it returns to normal.
- The level has steady poison fog so rot is always available. One treasure chest per win (reward later).

## Part 9: Checks and docs

- A new `tools/nm2_check.py --expect on|r4|r3|r2|off`; `nm_check.py` gains `--expect r4` (a Release 4 build carries nothing from Release 5). Every rule above gets a check, as Release 4's did.
- `GAME_DESIGN.md`, `RELEASES.md`, `WORLDS.md`, `LOOT.md` and `CLAUDE.md` updated with the code.

## Calls settled after the builder check (ours)
- **Gourds on the patch:** "up to 2" (owner) means each slot may be left empty. Once both are unlocked the picker preselects both; the player may drop either. Start cells: with one gourd, the centre (2, 3) as in Release 4; with two, the Grave Gourd at (2, 1) and the Protector at (2, 5), so their squares do not overlap (nearest cell without a grave if one is covered). The N2-5 coach uses the Protector at (2, 5).
- **100% knockback** = the knockback roll always succeeds for a pumpkin launched from the Protector's square (the usual knockback distance); bosses and `noKnockback` monsters stay immune; Ice / Fire / other on-hit powers still apply on top.
- **A blocked hit** (a normal pumpkin on a monster in a Plague Doctor 2's square, the wrong kind on the Lamplighter) is used up where it hits, like any hit. A monster in a Plague Doctor 2's square is immune to every non-rotten damage: splash, lightning, burn, mines and tools.
- **Rotten bunches** fly like any bunch (each pumpkin up its own column). `ROT_DMG` and the 0.5 heal are per pumpkin, flat (no bunch-size or level multiplier). A rotten pumpkin heals any monster it cannot hurt, bosses included (the Fallen Poltergeist outside its reaper phase), except the Lamplighter, on which the wrong kind does nothing (owner).
- **No jam:** rot never needs a safeguard. Rotten pumpkins can always be flicked or crushed, and sprouts only fill empty cells, as now.
- **Protection covers:** rot, destruction, the Poltergeist's swaps and the Fallen Poltergeist's shuffle. It does not stop the player's own moves, wind, pushes or the Hayrick's pin.
- **Reaper phase hits** count per rotten pumpkin. The Lamplighter's fog call uses the level's `poison.dur`; its mood clock restarts in form 2 at its form's interval.
- **The N2 gate** reads the stored result of N1-4 (as `isOpen` does for every level), not the gourd save field.

## Left to the builder
Exact numbers marked *(our number)*, sound choices from the bank, the Protector Gourd's art (shown to the owner first), level pools and pacing within each level's idea, and the coach script for N2-5 (modelled on N1-5's).
