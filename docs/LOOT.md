# Loot reference

Every chest, drop and seed source in one place, as currently built. The numbers live in `src/data/economy.js` (chests, the Loot Sack, boss seeds) and `src/data/rules.js` (kill rewards). When a number changes there, change it here in the same edit.

Last updated 2026-10-07.

## Treasure chest

Holds **2 prizes**. Each prize is one roll on this table:

| Prize | Chance |
|---|---|
| Set of 2 tools | 20% |
| Set of 3 tools | 20% |
| 1 pumpkin seed | 15% |
| 100–200 coins | 45% |

Where it comes from: the 1% chest drop on normal nights, every level-10 boss, and half of all Loot Sacks.

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

- **Tool set**: that many tools, each picked at random from the tools introduced so far. A tool already at its carry limit (5 for most tools, 3 for the Firework) pays **100 coins** instead.
- **Boss item**: collect **30** of one boss's item to trade for that boss's costume. Boss items are never sold for coins; one costs 10 seeds in the shop.
- **Fallbacks**: if no tools have been introduced yet, a tool prize becomes coins. If a chest has no boss to take an item from, a boss-item prize becomes coins.
- Chests are saved the moment they are picked up and opened from the result card, the shelf or the Seeds tab. One ad rerolls a chest once.

## Where chests and seeds come from

| Source | What it gives |
|---|---|
| Any kill on a normal (non-boss) night | 1% chance of a treasure chest, at most one per night. It lands on the field and must be tapped within 10 s; one still there when the night is won is kept. |
| Level-10 boss | A treasure chest, given at once |
| Level-20 boss | A boss chest, given at once |
| Any boss kill | Also a 5% chance of 1–3 seeds |
| Loot Sack (an ad on the level card summons it) | A treasure chest 50% (tap to pick up), a set of 5 tools 25%, or 80–160 coins 25%; plus a 50% chance of 1 seed. In endless, a Loot Sack comes every other hour. |
| Rewarded ad | 1 seed, up to 15 ads a day |

## Ordinary kill rewards (not loot boxes)

Every non-boss kill rolls exactly one: a dropped tool (weapon) **10%**, dropped pumpkins **30%**, coins **60%** (`src/data/rules.js`).
