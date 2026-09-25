# Gourd Guard: World Bible

**Status: LOCKED, Release 1 (R1).** Locked by the owner on 2026-09-25 from the ideas in `dump.md`. Everything in §1–§9 is the agreed target for R1. Changing any of it needs owner approval and a line in §11 (change log). Ideas that are not decided or not in R1 live in §10 (R2 backlog) so nothing gets lost.

`GAME_DESIGN.md` describes the game **as currently built**. Where the two disagree, this file is the target and the design doc gets updated when the code catches up.

Level addresses are written `world-level`, e.g. `3-12` = world 3, level 12. Level numbers inside worlds show ordering; the balance bot tunes the exact spots.

---

## 1. Shape of the game

| Item | Decision |
|---|---|
| Worlds | 6 |
| Levels per world | 20 |
| Total levels | 120 |
| Bosses | Level 10 of each world: boss, first form (fewer abilities). Level 20: same boss, full form. All other levels are normal waves. |
| World unlock | Beating the level-10 boss unlocks the next world. Levels 11–20 are the hard half of a world: optional for progression, harder, with the full-form boss at 20. |
| Difficulty curve | Every world starts easy and gets harder level by level. Target win rate for the bot (a stand-in for a mid-skill player with the expected upgrades): levels 1–5 ≈ 95%, 6–9 ≈ 85%, boss 10 ≈ 75%, 11–15 ≈ 65%, 16–19 ≈ 50%, boss 20 ≈ 40%. The curve resets at each new world because new mechanics arrive. |
| Unlock placement | Pumpkin, monster and weapon unlocks sit in levels 1–10 of a world so no player misses them; the level-20 boss and levels 11–19 reward coins and stars. |
| Colour ramp | World 1 starts with Green + Yellow only. From the 6th unlocked type (3-6) the player picks exactly 5 per level. |
| Difficulty modes | R2 (see §10). R1 ships one difficulty per level. |

---

## 2. Ground rules (new in R1)

| Rule | Detail | What changes in the prototype |
|---|---|---|
| Pumpkins sprout in twos | Every sprout tick places 2 pumpkins in 2 random empty cells, independent colours. If only one empty cell is left, place one. If none, nothing. | Sprout interval and the "fewer than 10 pumpkins" catch-up rule get retuned by the bot. |
| Kill rewards | Every kill rolls **one** reward: weapon 10%, pumpkin 30%, coins 60%. | Replaces "coins on every kill plus a fractional pumpkin drop". Coins per kill go up (~×1.7) so the economy stays level; the bot confirms. Weapon drops are new. |
| Bosses don't reach the wall | Bosses stay back and pressure the player with summons, projectiles or board tricks. | Bramble King's wall-chewing is retired; the world 1 boss replaces it. |
| Monsters return across worlds | Any earlier monster may reappear in a later world when it fits the theme, always **stronger**: it carries one modifier from §6 and a themed skin. | New. |
| Ghoul and Imp are in every world | Every world's fodder monsters are a Ghoul variant and an Imp variant with that world's skin and one modifier each. Ghoul: Bog Ghoul (W2, Armoured), Crypt Ghoul (W3, Stubborn), Drowned Ghoul (W4, Hungry), Wood Ghoul (W5, Swift). Imp: Marsh Imp (W2, Stubborn), Keep Imp (W3, Armoured), Tide Imp (W4, Swift), Broom Imp (W5, Hungry). All of them in W6. | New (owner, 2026-09-25). |

---

## 3. Worlds at a glance

| # | Name | Theme | Map gimmick | New pumpkins | New monsters | Returning monsters (stronger) | Boss |
|---|---|---|---|---|---|---|---|
| 1 | Pumpkin Patch | Harvest moon over a country graveyard | Graves on the patch | Green, Yellow, Ice, Fire | Ghoul, Bat, Imp, Mossback, Mummy | – | Gravekeeper |
| 2 | Foggy Hollow | Marsh mist, will-o'-wisps, lanterns | Fog hides field rows; occasional graves | White (boomerang) | Wisp, Wraith, Wisp Rider, Plague Doctor | Bog Ghoul (Armoured), Marsh Imp (Stubborn), Swift Bat | Poltergeist |
| 3 | Crumbling Keep | Vampire's castle under siege | Castle walls block shots; occasional graves | Grey (piercing), Black (blast) | Shield Knight, Gargoyle Hauler, Skeleton Archer, Vampire | Crypt Ghoul (Stubborn), Keep Imp (Armoured), Bat (swarm), Mossback (Siege Brute) | Vampire Count |
| 4 | Drowned Marsh | Sunken shore, drowned sailors, sea row | Puddles spawn monsters; sea-row levels; occasional graves | Pink (chain) | Puddle Crawler, Drunk Sailor, Puddle Diver, Splitter Slime | Drowned Ghoul (Hungry), Tide Imp (Swift), Mossback (Bog Turtle), Mummy (Sodden) | Twin Tides |
| 5 | Witchwood | Enchanted autumn forest, witches | Wind gusts shift the patch; occasional graves | Purple (spawn), Gold (coins) | Chameleon, Reverse Chameleon, Mirror Sprite | Wood Ghoul (Swift), Broom Imp (Hungry), Bat (Owl-bat), Wisp | Hexwitch |
| 6 | Hallow's End | All Hallows' night, everything at once | Graves only | none (full choice from all 10) | none | Everything from worlds 1–5, all with modifiers | Hollow King (5 stages) |

Names are placeholders the owner is free to change.

---

## 4. Map gimmicks

**World 1: Graves.** Immovable patch cells, count ramps with level. "Gravestone buster" removes one.

**World 2: Fog.** One or more horizontal bands of the field are fogged. Monsters inside are invisible; their movement, chewing and sounds still happen. Bands are per-level data (e.g. field rows 2–3 of 5). The Lantern weapon clears all fog for 10 s.

**World 3: Castle walls.** Stone segments spawn in random lanes at random field heights, with high HP. A pumpkin that hits a wall damages it and stops; monsters behind it are safe until it breaks. Grey passes through with damage. Black damages the wall and splashes the neighbouring lanes. Walls never spawn on the player's wall line.

**World 4: Puddles and sea.** Puddle cells are marked field tiles. Monsters may rise from any puddle instead of the top of the field. On sea levels the whole top row is water and monsters surface anywhere along it. The Puddle Diver hides in a puddle between attacks and is immune while submerged.

**World 5: Wind gusts.** A gust has a direction: left, right, up or down. Leaves blow across the patch for 2 s in that direction as a warning. Then **every pumpkin moves one cell** in the gust direction, resolved as a board-wide push: pumpkins nearest the leading edge move first, and a pumpkin stays put if the edge, a grave, or a pumpkin that itself cannot move blocks it. Lit state is recomputed after the gust. It is the push rule applied to every row (or column) at once, limited to one step. A full slide until blocked was rejected because it would pile the whole patch against one side and kill the puzzle. Gust frequency is the difficulty knob (e.g. every 20 s in early levels, every 10 s late).

**World 6: Graves only.** The challenge is the monster mix.

---

## 5. Pumpkin types

Existing level tables (power 1/1/1.5/1.5/2, shop costs 40/80/130/200) stay unless the bot says otherwise.

| Type | Look | Role | Effect | Introduced |
|---|---|---|---|---|
| Green | green | Normal | Damage; knockback chance from level 2 | 1-1 |
| Yellow | yellow | Normal | Same as Green, separate level | 1-1 |
| Ice | ice blue | Freeze | Slow; freeze chance from level 3 | 1-3 |
| Fire | red | Flame | Burn ticks; the only thing that kills a Mummy for good | 1-8 |
| White | white | Boomerang | If it hits nothing it flies back into the patch (top-most empty cell of its column, else nearest column with space) instead of being wasted | 2-3 |
| Grey | grey | Piercing | Hits every monster in its column; passes castle walls | 3-6 (right after the Gargoyle Hauler at 3-3) |
| Black | black | Blast | Explodes on the first hit; splashes the lanes to the left and right at the same height | 3-9 |
| Pink | pink plasma | Chain | Lightning jumps from the hit monster to the nearest monster in a neighbouring column at half power | 4-4 |
| Purple | purple | Spawn | A kill may spawn a pumpkin into the patch | 5-3 |
| Gold | gold, with top hat, monocle and coin belt so it reads differently from Yellow | Coins | A Gold kill always gives coins (skips the reward roll) and gives ×2 coins (value tuned by the bot) | 5-10 |
| Rainbow | multicolour | Wildcard | Any colour, no level | rare from 1-1 |

Loadout choice (exactly 5) starts at 3-6 when Grey becomes the 6th type.

---

## 6. Monsters

Stats (HP, speed, eat rate, coins) come from bot runs; this table fixes behaviour, placement and counters.

### World 1: Pumpkin Patch

| Monster | Behaviour | Counter |
|---|---|---|
| Ghoul | Walks straight | anything |
| Bat | Fast, flutters | anything |
| Imp | Hops in bursts | anything |
| Mossback | Slow tank | bunches of 5, Fire |
| Mummy | Only Fire kills it. Killed by anything else it respawns in the same tile after a delay | Fire |

### World 2: Foggy Hollow

| Monster | Behaviour | Counter |
|---|---|---|
| Wisp (today's Wraith, renamed) | Drifts to a neighbouring column every few seconds, only mid-field | timing |
| Wraith | Turns invisible for a few seconds, reappears further down the lane | throw where it will be |
| Wisp Rider | Carried by a wisp: fast while carried, normal speed once the carrier is destroyed | two hits |
| Plague Doctor | Slow; heals monsters in its column | kill it first |

### World 3: Crumbling Keep

| Monster | Behaviour | Counter |
|---|---|---|
| Shield Knight | Shield up while moving, down while stopped; moves in stop-go steps | hit during the stop |
| Gargoyle Hauler | Pushes a row of high-HP stone gargoyles ahead of it; slow while pushing, fast once they are all destroyed | Grey (piercing), unlocked right after |
| Skeleton Archer | Stays at the back and fires projectiles at a wall | Grey or Black to reach it behind castle walls |
| Vampire (elite) | Arrives with a bat swarm; regenerates HP if not hit for a while | burst damage, big bunches |

### World 4: Drowned Marsh

| Monster | Behaviour | Counter |
|---|---|---|
| Puddle Crawler | Spawns from a random puddle cell, not the top | watch the puddles |
| Drunk Sailor | Wanders freely across rows and columns | Pink chain, Black blast |
| Puddle Diver | Sits in a puddle, surfaces to throw a projectile at a wall, submerges again | hit while surfaced |
| Splitter Slime | Splits into two 1-HP blobs when killed | Black blast, Grey |

### World 5: Witchwood

| Monster | Behaviour | Counter |
|---|---|---|
| Chameleon | Coloured like one of the player's loadout colours; only that colour damages it | matching colour |
| Reverse Chameleon | Coloured like a loadout colour; immune to that colour, anything else works. Visually distinct: inverted markings, hollow eyes | any other colour |
| Mirror Sprite | Alternates between a reflecting phase and an open phase (stop-go like the Shield Knight). While reflecting, a pumpkin that hits it bounces back down and hits the player's wall as a projectile | hit during the open phase |

### World 6: Hallow's End

Every monster above, all carrying modifiers.

### Modifiers (data, any monster, any world)

| Modifier | Effect |
|---|---|
| Swift | +40% speed |
| Stubborn | Immune to knockback |
| Armoured | +2 HP |
| Hungry | Eats walls ×2 |

Returning monsters (§3) carry exactly one modifier by default. World 6 and future Hard modes may stack two.

---

## 7. Bosses

Rules:
- Bosses do not walk to the wall. Level 10 = first form, level 20 = full form.
- **Monsters keep coming until the boss is killed.** A boss level spawns its wave normally and the boss appears partway through it; once the wave is exhausted, monsters keep spawning at the level's gap until the boss dies. Spawning then stops, and the night is won when every remaining monster is dead. The progress bar on a boss level shows the boss's health, not the wave count.

| World | Boss | Abilities | Full form adds |
|---|---|---|---|
| 1 | Gravekeeper | Summons ghouls; teleports itself around the field | Teleports monsters forward or across lanes |
| 2 | Poltergeist | Swaps pumpkin positions on the patch | Recolours pumpkins |
| 3 | Vampire Count | Bat swarms; raises new castle walls. **Healing mode**: periodically it stops and starts regenerating, showing a counter (×4, ×5 or ×6); the player must land that many pumpkin hits to break the mode | Regenerates unless hit within 4 s even outside healing mode |
| 4 | Twin Tides | Two bosses on the sea row lobbing projectiles at walls. Both must die within a short window; otherwise the dead twin revives after ~8 s | Shorter window, faster projectiles |
| 5 | Hexwitch | Spawns chameleons | Turns monsters already on the field into chameleons |
| 6 | Hollow King | 5 stages: each stage borrows one earlier boss's full kit (Gravekeeper, Poltergeist, Vampire Count, Twin Tides, Hexwitch) | Final stage mixes everything, including the Poltergeist's "destroy every pumpkin of one loadout colour" |

---

## 8. Weapons (consumables)

Weapons drop from kills (10% roll) and can also be bought in the shop.

| Weapon | Effect | Introduced |
|---|---|---|
| Wall repair | Fully repairs every wall | 1-1 (exists) |
| Firework | 3 damage to every monster | 1-5 (exists) |
| Gravestone buster | Removes one grave (tap it) | 1-6 |
| Lantern | Clears all fog for 10 s | 2-2 |
| Landmine | Placed in a lane at the wall line; explodes on the first monster to step on it | 2-5 |
| Bomb | Damages a 3×3 area of the field: 3 lanes × 3 tile heights, tap to aim | 3-4 |
| Scarecrow | Decoy planted in a lane; monsters stop to chew it until it breaks | 5-2 |

---

## 9. Data shape this implies

One data file per world. It declares gimmick settings, monster pool, unlock schedule and 20 levels. Each level lists: pattern, graves, sprout settings, wave list (monster, count, modifiers), gimmick parameters (fog bands, castle wall count, puddle cells, sea row, gust interval and directions), boss flag, unlocks and rewards. Monsters are behaviour + stats + optional modifier, so a returning monster is one line. The restructure has to support this shape before any world content is built.

---

## 10. R2 backlog and undecided items

Not in R1. Kept here so they are not lost. Owner ideas unless marked 💡.

| Item | Notes |
|---|---|
| Burning Mummy | Only Ice kills it. Burns other mummies along the way. To define in R2: does "burn" kill them, or turn them into Burning Mummies (spreading)? Natural home: world 4 or 6. |
| Medium / Hard per level | Variables: longer sprout interval, 1 pumpkin per sprout instead of 2, no wall (any monster reaching the bottom loses), more graves, more monsters, stacked modifiers, more frequent gusts. Data-wise these are overrides on a level. |
| Quests | Optional objectives per level (e.g. "keep every wall above 50%", "kill 5 with Fire"). Meaning to confirm. |
| Full-slide gust variant | Wind that slides pumpkins until blocked, as a Hard-mode option. |
| Gravedigger 💡 | Plants a new grave on the patch when it reaches the wall. |
| Spider 💡 | Webs a random patch cell when it reaches mid-field. |
| Pumpkin Thief 💡 | Steals a pumpkin from the patch at the wall, then retreats. |
| Fog glimpse 💡 | Fog thins for 1 s where a pumpkin passes through. Cheap polish, decide when fog is built. |
| Ice vs Wraith 💡 | A slowed or frozen Wraith cannot turn invisible. Decide when the Wraith is built. |
| Older parked ideas | From the design doc §15: Candy (double coins), "bunch of 7 heals a wall", combo bonus for quick successive launches. |
| Gold coin multiplier | ×2 in R1; the bot may move it. |
| Exact unlock levels | The `world-level` numbers in §5 and §8 are first placements; the bot tunes them. |

---

## 11. Change log

| Date | Change |
|---|---|
| 2026-09-25 | Owner: the Ghoul and the Imp are reused in every world as the fodder monsters, each with a world skin and one modifier. World 2 design approved with Bog Ghoul at 2-1 and Swift Bat at 2-6; Poltergeist drifts between lanes rather than teleporting. |
| 2026-09-25 | Owner: on boss levels monsters keep spawning until the boss is killed; the night is won once the boss and the remaining monsters are dead. |
| 2026-09-25 | Owner: difficulty rises within each world (easy start, harder finish); the next world unlocks after the level-10 boss. Added the target win-rate curve and the rule that unlocks sit in levels 1–10. Black moved from 3-13 to 3-9 accordingly. |
| 2026-09-25 | Draft compiled from `dump.md`. Owner decisions: 20 levels per world (120 total); bosses at levels 10 and 20; sprouts place 2 pumpkins in random cells; kill reward 10/30/60 confirmed; world 5 gimmick = wind gusts in four directions, one-cell shift, frequency as difficulty knob; boss placement as proposed; Vampire Count gains healing mode with an ×4/×5/×6 hit counter; Bomb targets the field 3×3; Mirror Sprite reflects into the player's wall and has an open phase; Lantern and Scarecrow weapons kept; Splitter Slime and Plague Doctor kept; earlier monsters return stronger in later worlds. Locked as R1. |
