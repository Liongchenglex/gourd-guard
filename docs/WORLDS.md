# Gourd Guard: World Bible

**Status: LOCKED, Release 1 (R1).** Locked by the owner on 2026-09-25 from the ideas in `dump.md`. Everything in §1–§9 is the agreed target for R1. Changing any of it needs owner approval and a line in §11 (change log). Ideas that are not decided or not in R1 live in §10 (R2 backlog) so nothing gets lost.

`GAME_DESIGN.md` describes the game **as currently built**. Where the two disagree, this file is the target and the design doc gets updated when the code catches up.

Level addresses are written `world-level`, e.g. `3-12` = world 3, level 12. Level numbers inside worlds show ordering; the balance bot tunes the exact spots.

---

## 1. Shape of the game

| Item | Decision |
|---|---|
| Worlds | 6 designed; **Release 1 ships worlds 1–5**. World 6 (Hallow's End) is saved for a future release (owner, 2026-09-25). |
| Levels per world | 20 |
| Total levels | 120 designed, 100 in Release 1 |
| Bosses | Level 10 of each world: boss, first form (fewer abilities). Level 20: same boss, full form. All other levels are normal waves. |
| World unlock | Beating the level-10 boss unlocks the next world. Levels 11–20 are the hard half of a world: optional for progression, harder, with the full-form boss at 20. |
| Difficulty curve | Every world starts easy and gets harder level by level. Target win rate for the bot (a stand-in for a mid-skill player with the expected upgrades): levels 1–5 ≈ 95%, 6–9 ≈ 85%, boss 10 ≈ 75%, 11–15 ≈ 65%, 16–19 ≈ 50%, boss 20 ≈ 40%. The curve resets at each new world because new mechanics arrive. |
| Unlock placement | Pumpkin, monster and weapon unlocks sit in levels 1–10 of a world so no player misses them; the level-20 boss and levels 11–19 reward coins and stars. Once unlocked, a pumpkin or tool is usable on every level, earlier worlds included (owner, 2026-09-25). |
| Colour ramp | World 1 starts with Green + Yellow only. From the 6th unlocked type (3-6) the player picks exactly 5 per level. |
| Difficulty modes | R2 (see §10). R1 ships one difficulty per level. |
| Level 16 | Every world introduces one more monster at level 16 (owner, 2026-09-25): Flaming Mummy (1-16), Fogwalker (2-16), Witch (3-16), Bulwark Knight (4-16), Shell Turtle (5-16). |
| Previews | The level card shows the monsters, anything new, and on levels 10 and 20 the reward (next world / the perk). |
| Upgrade expectation | Players reach pumpkin **level 3 easily** with coins. **Levels 4 and 5 will be gated behind ads** when the game is monetised. So levels 1–10 of every world are tuned to be comfortable at pumpkin level 3 or below, and levels 11–20 are where levels 4–5 pay off. The bot's expected profile must follow this: level ≤3 through the first half of a world, 4–5 only in the second half (owner, 2026-09-25). |

---

## 2. Ground rules (new in R1)

| Rule | Detail | What changes in the prototype |
|---|---|---|
| Pumpkins sprout in twos | Every sprout tick places 2 pumpkins in 2 random empty cells, independent colours. If only one empty cell is left, place one. If none, nothing. | Sprout interval and the "fewer than 10 pumpkins" catch-up rule get retuned by the bot. |
| Kill rewards | Every kill rolls **one** reward: weapon 10%, pumpkin 30%, coins 60%. | Replaces "coins on every kill plus a fractional pumpkin drop". Coins per kill go up (~×1.7) so the economy stays level; the bot confirms. Weapon drops are new. |
| Bosses don't reach the wall | Bosses stay back and pressure the player with summons, projectiles or board tricks. | Bramble King's wall-chewing is retired; the world 1 boss replaces it. |
| A fallen wall is a gap, not a loss | When a wall's health hits 0 it is down, but the night is lost only when a monster **walks through the gap** (about 1.2 s at the fence). Repairing the wall in time closes it. Projectile monsters do not shoot at a wall that is already down. | Replaces "any wall at 0 loses the night" (owner, 2026-09-25). |
| Monsters return across worlds | Any earlier monster may reappear in a later world when it fits the theme, always **stronger**: it carries one modifier from §6 and a themed skin. | New. |
| Ghoul and Imp are in every world | Every world's fodder monsters are a Ghoul variant and an Imp variant with that world's skin and one modifier each. Ghoul: Bog Ghoul (W2, Armoured), Crypt Ghoul (W3, Stubborn), Drowned Ghoul (W4, Hungry), Wood Ghoul (W5, Swift). Imp: Marsh Imp (W2, Stubborn), Keep Imp (W3, Armoured), Tide Imp (W4, Swift), Broom Imp (W5, Hungry). All of them in W6. | New (owner, 2026-09-25). |

---

## 3. Worlds at a glance

| # | Name | Theme | Map gimmick | New pumpkins | New monsters | Returning monsters (stronger) | Boss |
|---|---|---|---|---|---|---|---|
| 1 | Pumpkin Patch | Harvest moon over a country graveyard | Graves on the patch | Green, Yellow, Ice, Fire | Ghoul, Bat, Imp, Mossback, Mummy | – | Gravekeeper |
| 2 | Foggy Hollow | Marsh mist, will-o'-wisps, lanterns | Fog hides field rows; occasional graves | White (boomerang), Pink (heal) | Wisp, Wraith, Wisp Rider, Plague Doctor | Bog Ghoul (Stubborn, 1 HP), Marsh Imp (Stubborn), Swift Bat | Poltergeist |
| 3 | Witchwood | Enchanted autumn forest, witches | Wind gusts shift the patch; occasional graves | Purple (spawn), Turquoise (bunches of 2) | Chameleon, Reverse Chameleon, Mirror Sprite | Wood Ghoul (Swift), Broom Imp (Hungry), Bat (Owl-bat), Wisp | Hexwitch |
| 4 | Crumbling Keep | Vampire's castle under siege | Castle walls block shots; occasional graves | Grey (piercing), Black (blast) | Shield Knight, Gargoyle Hauler, Skeleton Archer, Vampire | Crypt Ghoul (Stubborn), Keep Imp (Armoured), Bat (swarm), Mossback (Siege Brute) | Vampire Count |
| 5 | Drowned Marsh | Sunken shore, drowned sailors, sea row | Puddles spawn monsters; sea-row levels; occasional graves | Deep Blue (chain), Brown (grows) | Puddle Crawler, Drunk Sailor, Puddle Diver, Splitter Slime | Drowned Ghoul (Hungry), Tide Imp (Swift), Mossback (Bog Turtle), Mummy (Sodden) | Twin Tides |
| 6 | Hallow's End | All Hallows' night, everything at once | Graves only | none (full choice from all 11) | none | Everything from worlds 1–5, all with modifiers | Hollow King (5 stages) |

Names are placeholders the owner is free to change.

---

## 4. Map gimmicks

**World 1: Graves.** Immovable patch cells, count ramps with level. "Gravestone buster" removes one.

**World 2: Fog.** One or more horizontal bands of the field are fogged. Monsters inside are invisible; their movement, chewing and sounds still happen. Bands are per-level data (e.g. field rows 2–3 of 5). The Lantern weapon clears all fog for 10 s.

**World 3: Wind gusts.** A gust has a direction: left, right, up or down. Leaves blow across the patch for 2 s in that direction as a warning. Then **every pumpkin slides in the gust direction until it is stopped** by the edge, a grave or another pumpkin: the push rule applied to every row (or column) at once, leading edge first, so lines compress against the far side (`pumpkin, blank, pumpkin, blank` blown right becomes `blank, blank, pumpkin, pumpkin`). Lit state is recomputed after the gust. Gust frequency is the difficulty knob (e.g. every 20 s in early levels, every 10 s late).

**World 4: Castle walls.** Stone segments spawn in random lanes at random field heights, with high HP. A pumpkin that hits a wall damages it and stops; monsters behind it are safe until it breaks. Grey passes through with damage. Black damages the wall and splashes the neighbouring lanes. Walls never spawn on the player's wall line.

**World 5: Puddles and sea.** Puddle cells are marked field tiles. Monsters may rise from any puddle instead of the top of the field. On sea levels the whole top row is water and monsters surface anywhere along it. The Puddle Diver hides in a puddle between attacks and is immune while submerged.

**World 6: Graves only.** The challenge is the monster mix.

---

## 5. Pumpkin types

Upgrade costs per type: level 2 = 40, level 3 = 80, level 4 = 130, level 5 = 200 coins. Levels 4 and 5 will be ad-gated (see §1).

| Type | Look | Role | Introduced |
|---|---|---|---|
| Green | green | Normal | 1-1 |
| Yellow | yellow | Coins: a Yellow kill always pays coins, multiplied by level (replaces the Gold idea; a separate gold pumpkin could not be told from Yellow and confused chameleons) | 1-2 |
| Pink | pink | Heal: repairs its column's wall on every hit; high knockback | 2-8 |
| Ice | ice blue | Freeze | 1-5 |
| Fire | red | Flame; the only thing that kills a Mummy for good | 1-8 |
| White | white | Boomerang | 2-3 |
| Grey | grey | Piercing; passes castle walls | 4-4 |
| Black | black | Blast | 4-9 |
| Deep Blue | deep navy blue | Chain lightning along a row | 5-4 |
| Purple | purple | Spawn | 3-3 |
| Turquoise | turquoise | Launches in bunches of just 2, at half of Green's power; knockback like Green | 3-6 |
| Brown | brown | Grows on the patch: small (half power), medium (Green's power), big (double). Sizes bunch together and each hits for its own size | 5-7 |
| Rainbow | multicolour | Wildcard, any colour, no level | rare from 1-1; explained by a card at 1-9 |

Loadout choice (exactly 5) starts at 2-8 when Pink becomes the 6th type.

### Level-by-level effects

Power = damage per hit. "Knockback" = chance per hit to push the monster back one tile (a bunch of 5+ always knocks back; bosses and Stubborn monsters never). Values without a mark are what the game does today. 💡 = proposed, not built yet; edit freely.

**Green** (normal)

| Level | Power | Knockback |
|---|---|---|
| 1 | 1 | none |
| 2 | 1 | 25% |
| 3 | 1.5 | 25% |
| 4 | 1.5 | 50% |
| 5 | 2 | 50% |

**Yellow** (normal, plus coins: a kill made with Yellow skips the reward roll, always pays coins, multiplied)

| Level | Power | Knockback | Coins on a Yellow kill |
|---|---|---|---|
| 1 | 1 | none | ×2 |
| 2 | 1 | 25% | ×2 |
| 3 | 1.5 | 25% | ×3 |
| 4 | 1.5 | 50% | ×3 |
| 5 | 2 | 50% | ×4 |

**Ice** (slows; frozen monsters stop and don't eat; bosses can be slowed but not frozen; never knocks back on its own)

| Level | Power | Slow lasts | Freeze chance |
|---|---|---|---|
| 1 | 1 | 1.5 s | none |
| 2 | 1 | 2 s | none |
| 3 | 1.5 | 3 s | 25% |
| 4 | 1.5 | 4 s | 50% |
| 5 | 2 | 5 s | 50% |

**Fire** (burn ticks every 1 s; a new hit refreshes to the larger count and amount; never knocks back on its own)

| Level | Power | Burn ticks × damage | Total burn |
|---|---|---|---|
| 1 | 1 | 2 × 0.1 | 0.2 |
| 2 | 1 | 2 × 0.2 | 0.4 |
| 3 | 1.5 | 3 × 0.2 | 0.6 |
| 4 | 1.5 | 4 × 0.3 | 1.2 |
| 5 | 2 | 5 × 0.3 | 1.5 |

**Grey** (hits every monster in its column and passes castle walls, damaging them; each hit rolls knockback separately)

| Level | Power | Knockback |
|---|---|---|
| 1 | 1 | none |
| 2 | 1 | 25% |
| 3 | 1.5 | 25% |
| 4 | 1.5 | 50% |
| 5 | 2 | 50% |

**Purple** (every launched Purple bunch spawns one pumpkin into the patch on its first hit, whatever its size; each kill it makes may spawn one more)

| Level | Power | Knockback | Spawn is rainbow | Extra spawn per kill |
|---|---|---|---|---|
| 1 | 1 | none | 10% | 25% |
| 2 | 1 | 25% | 20% | 40% |
| 3 | 1.5 | 25% | 30% | 50% |
| 4 | 1.5 | 50% | 40% | 60% |
| 5 | 2 | 50% | 50% | 70%  |

**White** (a throw that hits nothing flies back into the patch instead of being wasted)

| Level | Power | Knockback | Return |
|---|---|---|---|
| 1 | 1 | none | returns to the top-most empty cell of its column |
| 2 | 1 | 25% | same |
| 3 | 1.5 | 25% | returns beside a same-colour pumpkin when one has a free neighbour |
| 4 | 1.5 | 50% | same |
| 5 | 2 | 50% | same (a return that completes a bunch lights it, as any landing does) |

**Black** (explodes on its first hit; splash zone is 3 lanes wide by 1 or 3 tile heights; ×1.5 against castle walls)

| Level | Power | Knockback | Splash damage | Splash zone |
|---|---|---|---|
| 1 | 1 | none | 50% of power | 3 × 1 |
| 2 | 1 | 25% | 50% | 3 × 1 |
| 3 | 1.5 | 25% | 75% | 3 × 1 |
| 4 | 1.5 | 50% | 75% | 3 × 3 |
| 5 | 2 | 50% | 100%, and the splash also knocks back | 3 × 3 |

**Deep Blue** (lightning runs along the row of the monster it hits: the nearest monsters at that height, in any lane, are struck too)

| Level | Power | Knockback | Chain power | Monsters struck in the row (including the first) |
|---|---|---|---|
| 1 | 1 | none | 25% | 3 |
| 2 | 1 | 25% | 50% | 3 |
| 3 | 1.5 | 25% | 50% | 4 |
| 4 | 1.5 | 50% | 75% | 5 |
| 5 | 2 | 50% | 75% | 5 |

**Pink** (healer: every hit repairs the wall of the column it flew up; knocks back often)

| Level | Power | Knockback | Wall repair per hit |
|---|---|---|---|
| 1 | 1 | 50% | 1 |
| 2 | 1 | 50% | 1 |
| 3 | 1.5 | 50% | 2 |
| 4 | 1.5 | 75% | 2 |
| 5 | 2 | 75% | 3 |

**Turquoise** (a bunch of 2 is enough to launch; power is half of Green's)

| Level | Power | Knockback |
|---|---|---|
| 1 | 0.5 | none |
| 2 | 0.5 | 25% |
| 3 | 0.75 | 25% |
| 4 | 0.75 | 50% |
| 5 | 1 | 50% |

**Brown** (grows while it sits on the patch: small = half of Green's power, medium = Green's, big = double. Sizes bunch together; each pumpkin hits for its size when launched)

| Level | Power (small / medium / big) | Knockback | Full size after | Stage every |
|---|---|---|---|---|
| 1 | 0.5 / 1 / 2 | none | 8 s | 4 s |
| 2 | 0.5 / 1 / 2 | 50% (double Green's) | 8 s | 4 s |
| 3 | 0.75 / 1.5 / 3 | 50% | 6 s | 3 s |
| 4 | 0.75 / 1.5 / 3 | 100% (double again) | 6 s | 3 s |
| 5 | 1 / 2 / 4 | 100% | 4 s | 2 s |

**Rainbow**: no level. Acts as the colour and level of the bunch it is thrown in. Sources: 3% of sprouts and drops, Purple spawns (10–50% by level), one in every boss drop.

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
| Flaming Mummy (1-16) | Only **Ice** kills it; anything else knocks it down and it rises again after 4 s. Sets ordinary mummies it passes alight, turning them into flaming mummies. Ice is auto-locked into the loadout (both Fire and Ice when both mummies are in the pool) | Ice |

### World 2: Foggy Hollow

| Monster | Behaviour | Counter |
|---|---|---|
| Wisp (today's Wraith, renamed) | Drifts to a neighbouring column every few seconds, only mid-field | timing |
| Wraith | Turns invisible for a few seconds, reappears further down the lane | throw where it will be |
| Wisp Rider | Carried by a wisp: fast while carried, normal speed once the carrier is destroyed | two hits |
| Plague Doctor | Slow; heals every monster in its 3×3 zone (drawn as a green aura) | kill it first |
| Fogwalker (2-16) | Drags a bank of fog across its whole row as it walks, hiding everything at that height, itself included: you cannot tell which column it is in. One hit. Usually escorted | Lantern, then one hit |

### World 4: Crumbling Keep

| Monster | Behaviour | Counter |
|---|---|---|
| Shield Knight | Shield up while moving, down while stopped; moves in stop-go steps | hit during the stop |
| Gargoyle Hauler | Pushes a row of high-HP stone gargoyles ahead of it; slow while pushing, fast once they are all destroyed | Grey (piercing), unlocked right after |
| Skeleton Archer | Stays at the back and fires projectiles at a wall | Grey or Black to reach it behind castle walls |
| Vampire (elite) | Arrives with a bat swarm; regenerates HP if not hit for a while | burst damage, big bunches |
| Bulwark Knight (4-16) | Armoured giant with a 3×3 steel aura: every monster inside has double health (shown as ×2 beside its health dots) while it stays there | kill the knight, or hit what leaves the aura |

### World 5: Drowned Marsh

| Monster | Behaviour | Counter |
|---|---|---|
| Puddle Crawler | Spawns from a random puddle cell, not the top | watch the puddles |
| Drunk Sailor | Wanders freely across rows and columns | Pink chain, Black blast |
| Puddle Diver | Sits in a puddle, surfaces to throw a projectile at a wall, submerges again | hit while surfaced |
| Splitter Slime | Splits into two 1-HP blobs when killed | Black blast, Grey |
| Shell Turtle (5-16) | Rises from a puddle and walks backwards, shell towards the player: a slow 10-HP moving wall that shields whatever is behind it. Cannot be knocked back | Grey pierces; otherwise chew the shell |

### World 3: Witchwood

| Monster | Behaviour | Counter |
|---|---|---|
| Chameleon | Coloured like one of the player's loadout colours; only that colour damages it. 2 HP (reverse ones have 3) | matching colour |
| Reverse Chameleon | Coloured like a loadout colour; immune to that colour, anything else works. Visually distinct: inverted markings, hollow eyes | any other colour |
| Mirror Sprite | Alternates between a reflecting phase and an open phase (stop-go like the Shield Knight). While reflecting, a pumpkin that hits it bounces back down and hits the player's wall as a projectile | hit during the open phase |
| Witch (3-16) | Every 6 s turns one monster on the field (other witches included) into a reverse chameleon (75%) or a chameleon (25%) | kill her early |

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
| 4 | Vampire Count | Bat swarms; raises new castle walls. **Healing mode**: periodically it stops and starts regenerating, showing a counter (×4, ×5 or ×6); the player must land that many pumpkin hits to break the mode | Regenerates unless hit within 4 s even outside healing mode |
| 5 | Twin Tides | Two bosses on the sea row lobbing projectiles at walls. Both must die within a short window; otherwise the dead twin revives after ~8 s | Shorter window, faster projectiles |
| 3 | Hexwitch | Drifts between lanes; every 9 s hexes 2–3 monsters into **reverse chameleons** (form 1 never makes true chameleons: too hard at level 10, owner); every 14 s lays a **hex zone** (3×3) for 10 s: anything killed inside it rises again after 4 s | Hexes into chameleons or reverse chameleons (50/50); two zones at a time, which can also be a whole column or a whole row; hexes every 7 s |
| 6 | Hollow King | 5 stages: each stage borrows one earlier boss's full kit (Gravekeeper, Poltergeist, Vampire Count, Twin Tides, Hexwitch) | Final stage mixes everything, including the Poltergeist's "destroy every pumpkin of one loadout colour" |

---

## 8. Weapons (consumables)

Weapons drop from kills (10% roll) and can also be bought in the shop. The HUD always shows the full set of tools; ones not yet introduced are dimmed with a padlock (owner, 2026-09-25).

| Weapon | Effect | Introduced |
|---|---|---|
| Wall repair | Tap it, then tap one wall to repair it fully (owner, 2026-09-26: no longer all walls) | 1-3 |
| Firework | 3 damage to every monster | 1-7 |
| Gravestone buster | Removes one grave (tap it) | 1-6 |
| Lantern | Clears all fog for 10 s | 2-2 |
| Landmine | Tap it, then tap any tile of the field: the mine lies buried for 6 s, then surfaces armed; the first monster to step on it sets off a 3×3 blast (3 lanes × 3 tile heights) for 6 (owner, 2026-09-26; was: waits at the wall line of one lane) | Tap it, then tap any tile of the field: the mine hides there and the first monster to step on it sets off a 3×3 blast for 6 (owner, 2026-09-26) |
| Bomb | Damages a 3×3 area of the field: 3 lanes × 3 tile heights, tap to aim | 4-6 |
| Scarecrow | Decoy planted in a lane; monsters stop to chew it until it breaks | 3-2 |

---

## 8a. Levels 11–19: hand-authored (owner, 2026-09-25)

The second half of every world is authored level by level. Each line is data in `src/data/worlds/world<N>.js` using the fields in `src/data/levels.js` (grave layouts, lane weights, fog rows and columns, partial wind, castle layouts, shoreline, whole-level hexing, "only" pools, level names). Field rows are tile rows counted from the top (about 8 tall).

| Level | 1 Pumpkin Patch | 2 Foggy Hollow | 3 Witchwood | 4 Crumbling Keep | 5 Drowned Marsh |
|---|---|---|---|---|---|
| 10 | "The Gravekeeper Stirs" | "A Ghost in the Patch" | "The Hexwitch's Circle" | "The Count's Court" | "Twin Tides Rising" |
| 11 | as generated | as generated | as generated | as generated | as generated |
| 12 | V-shaped graves | Wraiths only | Wind now blows on 2–3 columns or rows only (arrows mark them), through 20 | 4 castle walls | Shoreline 2 rows down |
| 13 | Mummies only | L-shaped fog: top row + left column | Mirror sprites only | A full row of castle walls with archers behind it, plus the usual mix | Shoreline 3 rows down |
| 14 | 6 graves | Left and right columns fogged | Everything spawns as a reverse chameleon (no true chameleons) | Gargoyle haulers, shield knights and archers only, behind two rows of walls | Puddle divers and crawlers only, with 6 puddles |
| 15 | Whole top patch row is graves (a 4-row board) | Only the first two rows and the fence row are clear | Chameleons and reverse chameleons only | Left and right columns are castle walls | Shoreline 4 rows down, Sodden Mummies only |
| 16 | Flaming Mummy: "Wrapped in Flame" | Fogwalker: "The Walking Mist" | Witch: "Hex in the Woods" | Bulwark Knight: "Iron Aura" | Shell Turtle: "Shell First" |
| 17 | Mummies and Flaming Mummies only | Fogwalkers only | Mirror sprites only, all reverse-chameleonised | Level 14 plus Bulwark Knights | Shoreline 4 rows down; Bog Turtles, Shell Turtles and divers only |
| 18 | Top and bottom patch rows are graves | Only the top (spawn) row is clear | Witches only (they may re-hex a monster into a new colour) | H-shaped castle walls, every monster | Shoreline 4 rows down; Shell Turtles, Sodden Mummies and divers only |
| 19 | Columns 1, 4 and 7 are graves except their last row (reach them with chain lightning); those lanes spawn less | Only the fence row is clear | Chameleons plus everything else chameleonised | Castle walls everywhere except the first two rows | Shoreline 4 rows down; divers and Shell Turtles only |
| 20 | "Gravekeeper's Wake" | "Poltergeist Unbound" | "Full Coven Moon" | "Blood Moon Siege" | "The Drowning Tide" |

Rules that came with it: authored levels have no random graves (world 1's drawn layouts stay); the level 19s spawn about 30% fewer monsters, more slowly; on shoreline levels every monster surfaces at the water's edge (shorelines are 1, 2, 2.5, 2.5, 3, 4 and 2.5 rows down on 5-12/13/15/17/18/19/20, the foam line marks the spawn line) and puddles still exist below it; Puddle Divers may lurk anywhere in the sea; witches can change an already hexed monster's colour.

---

## 8b. Level-20 perks

Beating level 10 opens the next world; beating **level 20** grants a permanent perk (owner, 2026-09-25). Perks stack, apply on every level, and can each be switched off in the pause menu. The bot's expected profile assumes the perks of earlier worlds are on.

| Beat | Perk | Effect |
|---|---|---|
| 1-20 | Quick smash | Hold 0.35 s instead of 0.6 s to smash a pumpkin |
| 2-20 | Eager sprouts | Sprout interval −1 s |
| 3-20 | Bumper crop | 50% of sprout ticks bring 3 pumpkins, the other 50% bring 2 |
| 4-20 | Rainbow harvest | Rainbow chance on sprouts and drops 3% → 10% |
| 5-20 | Focused patch | The loadout may be 4 colours instead of 5 (a level's locked pumpkin still counts) |

---

## 9. Data shape this implies

One data file per world. It declares gimmick settings, monster pool, unlock schedule and 20 levels. Each level lists: pattern, graves, sprout settings, wave list (monster, count, modifiers), gimmick parameters (fog bands, castle wall count, puddle cells, sea row, gust interval and directions), boss flag, unlocks and rewards. Monsters are behaviour + stats + optional modifier, so a returning monster is one line. The restructure has to support this shape before any world content is built.

---

## 10. R2 backlog and undecided items

Not in R1. Kept here so they are not lost. Owner ideas unless marked 💡.

| Item | Notes |
|---|---|
| Paint pumpkin 💡 (owner) | When it lights up, it converts the pumpkins touching it to its colour, turning messy boards into big bunches. |
| Echo pumpkin (owner) | A bunch you can launch twice. |
| Twin pumpkin (owner, confirmed 2026-09-26) | Two colours on one pumpkin, e.g. half red, half blue: a **combination of two pumpkins** that acts as a Rainbow for exactly those two colours. It counts as either colour, so it can bridge two bunches of different colours into one launch. |
| Gourds (owner, 2026-09-26) | A new family of taller pumpkins on the swipe board. Play style: **break the gourd** to stop enemy-made obstacles on the patch. To define: how a gourd is broken (hold to smash, or a bunch beside it), what enemy obstacles it clears (graves, webs, hex zones, planted blockers), whether it occupies one tall cell or two, and whether it can be launched at all. |
| Boss fallen mode (owner, 2026-09-26) | Every boss gets a **fallen mode**: a state after it is beaten (or when its health is gone) in which it keeps acting in a weakened way, or a final phase that must also be cleared. To define per boss: what a fallen Gravekeeper, Poltergeist, Hexwitch, Vampire Count and Twin Tides can still do, how long it lasts, and what ends it. |
| Extensions of existing worlds (owner, 2026-09-26) | More levels after 20 in worlds 1–5 (or side branches), reusing each world's gimmick with the later pumpkins and monsters. Level data already supports it (per-level definitions); to decide: how many, unlock rule, and whether they carry rewards. |
| New world (owner, 2026-09-26) | Beyond Hallow's End (world 6, already stubbed): at least one further world with its own gimmick, pumpkin, monsters and boss. Theme to be chosen by the owner. |
| Poison pumpkin (owner) | To define: e.g. a hit leaves a poison that ticks like Fire's burn but also spreads to monsters that touch the victim. |
| Burning Mummy | Only Ice kills it. Burns other mummies along the way. To define in R2: does "burn" kill them, or turn them into Burning Mummies (spreading)? Natural home: world 4 or 6. |
| Medium / Hard per level | Variables: longer sprout interval, 1 pumpkin per sprout instead of 2, no wall (any monster reaching the bottom loses), more graves, more monsters, stacked modifiers, more frequent gusts. Data-wise these are overrides on a level. |
| Quests | Optional objectives per level (e.g. "keep every wall above 50%", "kill 5 with Fire"). Meaning to confirm. |
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
| 2026-09-26 | Owner: boss health cut about 25% in form 1 and 15% in form 2 (Gravekeeper 15/30, Poltergeist 20/36, Hexwitch 22/40, Vampire Count 24/42, Twin Tides 14/24 each). |
| 2026-09-26 | Owner: level 10 of every world spawns 35% more slowly (the bot lost every level-10 fight at the expected upgrades). |
| 2026-09-26 | Owner: the level-10 slowdown is reverted (spawn gaps back to 3.3 / 3.1 / 2.8 / 3.0 / 2.9 s for worlds 1–5) now that boss health was cut; bot re-run recorded in the design doc §11. Shell Turtle hits sound thick and metallic. Puddle Diver and Twin Tides bolts are drawn as water balls and sound liquid. |
| 2026-09-26 | Owner: 5-10 shoreline lowered (sea two rows deep, so the Twin Tides sit lower); a boss on the top row draws its health bar below itself so the tools tray never hides it; hexes draw lightning from the caster to each victim with a zap sound; the hex zone sounds magical; one sparkly bunch sound for all sizes; vampires only chuckle. Unreleased: the owner is collecting more feedback before the next phone build. |
| 2026-09-26 | Owner: 5-15 (The Drowned, all Sodden Mummies) is lighter: 22 mummies instead of 30, spawn gap 2.6 s → 3.4 s. Bot before/after in the design doc §11. |
| 2026-09-26 | Owner: Vampire Count trance nerfed: form 1 asks 2–4 hits (was 4–6), form 2 stays 4–6, and it heals 1.2 HP/s instead of 2. Level-20 boosts appear as trophies on the pumpkin-picking screen, tappable on or off (the pause menu toggles stay). Bunch sound is sparkle only; coins sound like a treasure chest; the trance heartbeat is a real heartbeat recording. |
| 2026-09-26 | Owner: future-release ideas recorded in §10: extensions of existing worlds, boss fallen mode, gourds (taller pumpkins that are broken to stop enemy obstacles on the patch), twin pumpkins as a two-colour rainbow, and a new world beyond world 6. |
| 2026-09-26 | Owner playtest batch: world 1 reordered (1-1 Green + a two-line tutorial instead of the full help; 1-2 Yellow; 1-3 Bat + Wall repair; 1-4 Imp; 1-5 Ice with 'slow the imps' copy; 1-7 Firework; 1-8 Fire with a personable line; 1-9 unchanged) and no rainbows before 1-9. Level 10 of worlds 1, 2 and 4 spawns 20% slower and 20% fewer. Beating a level-10 boss shows a world-unlocked card and returns to the menu. Turquoise pairs are half power but bunches of 3+ hit like Green. Chameleons first appear at 3-9, at most 3 (3-8 drops them); the Reverse Chameleon keeps its own card at 3-7. 4-2 and 4-3 have fewer knights, 4-3 at most 2 haulers; Grey moves to 4-4 and the Bomb to 4-6; Keep Imps have 2 HP. Landmines are placed on any tile and blast a 3×3; wall repair fixes one tapped wall. The world-2 boss's health bar shows through the fog. |
| 2026-09-26 | Owner: after a level-10 boss falls, Continue leads to the storybook shelf where the next world's book plays an unlock animation (lock shakes and pops, stripes lift, cover brightens). Tapping a level shows that night's own map behind the preview card and as a snapshot inside it, instead of the title scene. |
| 2026-09-26 | Owner: Mirror Sprite now arrives at 3-5 and the Chameleon at 3-8 (swapped). |
| 2026-09-26 | Owner: chameleons have 2 HP; 3-10 spawns no chameleons; Hexwitch zones are 3×3, a 1-tall row or a 1-wide column. |
| 2026-09-26 | Owner: two more pumpkins: Turquoise (3-6, bunches of 2 at half power) and Brown (5-7, grows small → medium → big); a rainbow intro card at 1-9. |
| 2026-09-26 | Owner: Bog Ghoul back to 1 HP (Stubborn instead of Armoured); witches and the Hexwitch's full form hex 25% chameleon / 75% reverse; boss levels named; the owner is happy with the difficulty design at this point. |
| 2026-09-26 | Owner: several monsters chew the same wall; twins' full form sits mid-field and throws from any column via a tail; mummies rise with 1 HP; Poltergeist full form juggles three pumpkins and repaints three; restart goes through the pumpkin picker; witches hex each other. |
| 2026-09-25 | Owner: levels 11–19 of every world hand-authored (§8a) with graves layouts, fog shapes, partial wind, castle layouts, shorelines and "only" pools. |
| 2026-09-25 | Owner: a level-16 monster per world (Flaming Mummy, Fogwalker, Witch, Bulwark Knight, Shell Turtle); Hexwitch redesigned around hex zones; rewards shown on level 10 and 20 previews. |
| 2026-09-25 | Owner: level-20 perks (§8b): quick smash, sprouts −1 s, 50% triple sprouts, 10% rainbows, pick 4. Fire auto-locked on mummy levels. Unlocks usable on every level. |
| 2026-09-25 | Owner: a fallen wall only loses the night once a monster walks through it; projectile monsters stop shooting at fallen walls. Silver pumpkin removed. Plague Doctor heals a 3×3 zone with a visible aura. |
| 2026-09-25 | Owner: World 6 is deferred to a future release; worlds 1–5 are the Release 1 base to polish and tune. |
| 2026-09-25 | Owner, after the tables: Gold removed (Yellow pays the coins by level); Pink lightning became Deep Blue (row lightning); new Pink healer at 2-8; new Silver net pumpkin at 5-8 for projectile monsters; world order is now Pumpkin Patch, Foggy Hollow, Witchwood, Crumbling Keep, Drowned Marsh, Hallow's End; the tool tray shows the full set with locks; dragging across the field collects drops. Owner's per-level numbers for Ice, Fire, Purple, Black, Deep Blue and White adopted. |
| 2026-09-25 | Owner, after playing the whole game: pumpkin level 3 is the easy ceiling, levels 4–5 will be ad-gated, so levels 1–10 of each world must be comfortable at level ≤3. §5 rewritten as level-by-level tables with proposals for White, Black, Pink and Gold. |
| 2026-09-25 | Owner, after playing: wind gusts slide pumpkins all the way until blocked (full push), replacing the one-cell nudge. |
| 2026-09-25 | Owner: the Ghoul and the Imp are reused in every world as the fodder monsters, each with a world skin and one modifier. World 2 design approved with Bog Ghoul at 2-1 and Swift Bat at 2-6; Poltergeist drifts between lanes rather than teleporting. |
| 2026-09-25 | Owner: on boss levels monsters keep spawning until the boss is killed; the night is won once the boss and the remaining monsters are dead. |
| 2026-09-25 | Owner: difficulty rises within each world (easy start, harder finish); the next world unlocks after the level-10 boss. Added the target win-rate curve and the rule that unlocks sit in levels 1–10. Black moved from 3-13 to 3-9 accordingly. |
| 2026-09-25 | Draft compiled from `dump.md`. Owner decisions: 20 levels per world (120 total); bosses at levels 10 and 20; sprouts place 2 pumpkins in random cells; kill reward 10/30/60 confirmed; world 5 gimmick = wind gusts in four directions, one-cell shift, frequency as difficulty knob; boss placement as proposed; Vampire Count gains healing mode with an ×4/×5/×6 hit counter; Bomb targets the field 3×3; Mirror Sprite reflects into the player's wall and has an open phase; Lantern and Scarecrow weapons kept; Splitter Slime and Plague Doctor kept; earlier monsters return stronger in later worlds. Locked as R1. |
