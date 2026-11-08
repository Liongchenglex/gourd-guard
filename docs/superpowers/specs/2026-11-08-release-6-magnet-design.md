# Release 6: the Magnet pumpkin (design)

Owner, 2026-11-08. Tagged **Release 6**. Built on `dev`; not shipped.

## Intent

A combo pumpkin and a wall rescuer. A Magnet hit drags nearby monsters onto the tile of the monster it hit. Hits stay as they are today (owner, 2026-11-08, option A): an ordinary pumpkin still hits only the first monster it meets, so the clump pays off through Grey's pierce, Black's splash, Deep Blue's chain, Beige's glue and several pumpkins stacked in that column. Because it pulls from the rows below the hit, it also drags monsters off a wall they are chewing (owner: "I want it to rescue walls"). The owner chose it from a list of ideas on 2026-11-03 ("Magnet: bunches monsters into a column").

## Release number (owner, 2026-11-08)

Magnet is **Release 6**. Nightmare Witchwood becomes **Release 7** and later nightmare worlds follow from there.

## Standalone release (owner question, 2026-11-08)

The owner may ship Release 6 **before** Releases 4 and 5. Builds today include every release up to a number, so shipping Magnet first means renumbering it to the next store release and moving the nightmare worlds up one. To keep that a mechanical change:

- Magnet depends only on Release 1 content (worlds 1–5): its code reads no Release 2–5 module, constant or level field, and treats Release 2–5 things it must skip (the jukebox, mini bosses, Crows) by generic properties (`type`, a not-on-the-field flag) rather than by importing them. If its gate were changed to `>= 2`, it would work in a Release 2 build with no Beige.
- Its type index is computed from what the build contains (Beige may or may not exist), the same way `BEIGE` / `RAINBOW` are today.
- Its unlock is 5-20 (Release 1), not 6-16 or a nightmare level.
- All Magnet code and data sit behind one build constant, `__MAGNET__` (true when the build's release is at least `MAGNET_AT` in `vite.config.js`, 6 today), so shipping it earlier is a one-number change (builder's call, 2026-11-08; replaces "`__RELEASE__ >= 6` written inline").

## Rules (owner)

**Pull.** When a Magnet pumpkin hits a monster (the "anchor"), up to N other monsters slide onto the anchor's tile: its lane and its height on the field. The anchor counts toward nothing; N is the number pulled in.

| Level | Pulled (N) | Rows it pulls from |
|---|---|---|
| 1 | 3 | the anchor's row only |
| 2 | 3 | the anchor's row only |
| 3 | 4 | the anchor's row and 1 row below |
| 4 | 5 | the anchor's row and 1 row below |
| 5 | 6 | the anchor's row and 2 rows below |

- "Row" is one tile height of the field (`TILE_P()`), the same rows glue uses; "below" means closer to the wall (larger `p`). Rows above the anchor (further from the wall) are never pulled (owner: "not up and down, 2 rows down").
- Any lane counts.
- When more monsters are in reach than N, the nearest ones are pulled first (distance on the field from the anchor).
- It pulls whether or not the hit kills the anchor; a dead anchor's tile is still where the clump forms.
- The slide takes about 0.3 s and is visible (not a jump). Pulled monsters keep walking after it.
- Each pumpkin in a bunch that hits pulls separately; a monster already pulled can be pulled again by a later hit.

**Rescuing walls (owner, 2026-11-08).** A monster chewing a wall (`m.eating`) or a scarecrow (`m.chewing`) can be pulled: it stops chewing and slides up to the anchor's tile, then walks on from there. A monster that has already walked through a fallen wall (off the field) is not pulled. A pulled monster that lands where a standing castle wall holds that lane at that height behaves as any monster reaching that castle wall does.

**Never pulled:** bosses (including mini bosses and the Hollow King's forms), the Loot Sack, the jukebox, a diver hidden underwater, a mummy lying down waiting to rise, a monster that is not walking a lane on the field (for example a Release 4 Crow in the patch), and anything already dead. Everything else can be pulled, including Bulwark Knights and Shell Turtles.

**Getting it.** In the pumpkin shop, bought for **50 seeds** once **5-20** is beaten, then usable in every level (like Paint). Upgrades: **3,000 coins, 5,000 coins, 10,000 coins, 50 seeds** (same as Beige).

**Numbers.** Power 1 / 1 / 1.5 / 1.5 / 2. **No knockback** at any level (knockback would break the clump it just made).

## Look and sound (owner approved the suggestions)

- A shiny copper pumpkin with a small red-and-silver horseshoe-magnet band around the stem. Distinct from Brown, Yellow and Beige on the patch.
- Lit face: a smug grin.
- The pull: faint copper spark lines from each pulled monster to the anchor during the slide; a soft metallic "clunk" when they land. Baked sprites only, nothing painted per frame (perf rule in `CLAUDE.md`).
- Lore line and a level-stats "special" line like the other pumpkins.

## Non-goals

- No skin, costume, gourd or tool for Magnet.
- No level is built around Magnet; no changes to existing levels.
- No balance tuning by bot (the owner tunes from play).

## Left to the builder

- Exactly how the slide is animated, within "visible, about 0.3 s".
- How pulled monsters interact with special movement (a Witch drifting lanes, a Hexwitch, a Wisp's drift) after the slide: they resume their own behaviour from the new tile.
- Sound sample choice (CC0, listed in `assets/sfx/SOURCES.md`).
- Checks in a new or existing `tools/*_check.py`, with `--expect` modes that prove Magnet is absent below Release 6 and present in the playtest build, plus a check that runs the Magnet checks against a build with Magnet's gate lowered to Release 2 (for example a `VITE_MAGNET_AT=2` override read only by the checks' build step, or an equivalent) to prove the standalone requirement.
