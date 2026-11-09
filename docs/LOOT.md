# Loot reference

Every chest, drop and seed source in one place, as currently built. The numbers live in `src/data/economy.js` (chests, the Loot Sack, boss seeds) and `src/data/rules.js` (kill rewards). When a number changes there, change it here in the same edit.

Last updated 2026-11-02. Players see the chest tables in the game too: the "What's inside?" link on every chest, generated from the same data.

## Treasure chest

Holds **2 prizes**. Each prize is one roll on this table:

| Prize | Chance |
|---|---|
| Set of 2 tools | 20% |
| Set of 3 tools | 20% |
| 1 pumpkin seed | 15% |
| 100–200 coins | 45% |

Where it comes from: the 1% chest drop on normal nights, every level-10 boss, the Strawlord (Nightmare 1-4 and 1-13, Release 4), the Fallen Gravekeeper (Nightmare 1-16, Release 4), the Lamplighter (Nightmare 2-4 and 2-13, Release 5), the Fallen Poltergeist (Nightmare 2-16, Release 5), the Treant (Nightmare 3-4 and 3-13, Release 7), the Fallen Hexwitch (Nightmare 3-16, Release 7), the Siege Tower (Nightmare 4-4 and 4-13, Release 8), the Fallen Count (Nightmare 4-16, Release 8), and half of all Loot Sacks.

## Boss chest

Holds **3 prizes**. Each prize is one roll on this table:

| Prize | Chance |
|---|---|
| Boss item (from the boss that dropped it) | 25% |
| 1–3 pumpkin seeds | 25% |
| Set of 5 tools | 25% |
| 250–500 coins | 25% |

Where it comes from: every level-20 boss.

## What the prizes mean

- **Tool set**: that many tools, each picked at random from the tools introduced so far (in World 6 playtest builds this includes Emergency Pumpkins once 6-8 is reached). A tool already at its carry limit (5) pays **100 coins** instead.
- **Boss item**: collect **15** of one boss's item (owner, 2026-10-19; was 30) to trade for that boss's costume. Boss items are never sold for coins; one costs 10 seeds in the shop.
- **Fallbacks**: if no tools have been introduced yet, a tool prize becomes coins. If a chest has no boss to take an item from, a boss-item prize becomes coins.
- Chests are saved the moment they are picked up and opened from the result card, the shelf or the Seeds tab. One ad rerolls a chest once.

## Where chests and seeds come from

| Source | What it gives |
|---|---|
| Any kill on a normal (non-boss) night | 1% chance of a treasure chest, at most one per night. It lands on the field and must be tapped within 10 s; one still there when the night is won is kept. |
| Level-10 boss | A treasure chest, given at once |
| Level-20 boss | A boss chest, given at once |
| The Hollow King (6-20, Release 3) | Two boss chests, plus a 50% chance of a third (owner, 2026-11-03; was one plus a 50% second); boss-item prizes in them pay coins (no Hollow King costume yet) |
| The Fallen Gravekeeper (Nightmare 1-16, Release 4) | One treasure chest, given at once, on each win (2026-11-05; placeholder until the owner sets the reward). No boss items and no costume. `bossChest:'normal'` |
| The Strawlord (Nightmare 1-4 and 1-13, Release 4) | One treasure chest, given at once, on each win (owner, 2026-11-04; placeholder, polished later). No boss items and no costume. Set by the level field `bossChest:'normal'` |
| The Lamplighter (Nightmare 2-4 and 2-13, Release 5) | One treasure chest, given at once, on each win (spec Part 5; placeholder, polished later). No boss items and no costume (`noItems`). Set by the level field `bossChest:'normal'` |
| The Fallen Poltergeist (Nightmare 2-16, Release 5) | One treasure chest, given at once, on each win (spec Part 8; placeholder, polished later). No boss items and no costume (`noItems`). Set by the level field `bossChest:'normal'` |
| The Treant (Nightmare 3-4 and 3-13, Release 7) | One treasure chest, given at once, on each win (spec Part 4; placeholder, polished later). No boss items and no costume (`noItems`). Set by the level field `bossChest:'normal'` |
| The Fallen Hexwitch (Nightmare 3-16, Release 7) | One treasure chest, given at once, on each win (spec Part 6; placeholder, polished later). No boss items and no costume (`noItems`). Set by the level field `bossChest:'normal'` |
| The Siege Tower (Nightmare 4-4 and 4-13, Release 8) | One treasure chest, given at once, on each win (spec Part 4; a beta placeholder). No boss items and no costume (`noItems`). Set by the level field `bossChest:'normal'` |
| The Fallen Count (Nightmare 4-16, Release 8) | One treasure chest, given at once, on each win (spec Part 7; his reward is still open with the owner). No boss items and no costume (`noItems`). Set by the level field `bossChest:'normal'` |
| A won nightmare night (Release 4) | The night bonus of the last story night: 10 + 3 × LEVELS coins (LEVELS = the story levels in the build: 120 in the playtest build, so 370) + 5 per quest met that night. Placeholder (owner, 2026-11-04: "assume for now, polish later"). Kills roll the usual kill reward, and on non-boss nightmare nights the 1% chest chance applies as on any normal night |
| Any boss kill in the story | Also a 5% chance of 1–3 seeds |
| A boss beaten in Endless Night | A 50% chance of 1–2 seeds (no chest; owner, 2026-10-20, was 1–3) |
| Loot Sack (an ad on the level card summons it) | A treasure chest 50% (tap to pick up), a set of 5 tools 25%, or 80–160 coins 25%; plus a 50% chance of 1 seed. In endless, a Loot Sack comes every other hour. |
| Rewarded ad | 1 seed, up to 15 ads a day |

## Ordinary kill rewards (not loot boxes)

Every non-boss kill rolls exactly one reward (`KILL_REWARD` in `src/data/rules.js`, tools in `src/engine/combat.js`):

| Reward | Chance |
|---|---|
| A tool | 10% |
| Dropped pumpkins | 30% |
| Coins | 60% |

How the tool drop works:
- The tool is picked at random, each with an equal chance, from the tools **introduced so far that you are not already carrying the maximum of** (5). With 4 tools available, each is 2.5% per kill.
- If every introduced tool is already full, the tool roll pays coins instead.
- The tool lands on the field and must be tapped (or swept with a drag) within **7 seconds**, or it fades.
- Bosses and the Loot Sack do not roll kill rewards; they have their own drops above.
- A kill made by a **Yellow** pumpkin skips the roll: it always pays coins, multiplied by Yellow's level bonus (×2 to ×4), so Yellow kills never drop tools or pumpkins.
