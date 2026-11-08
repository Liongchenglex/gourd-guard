# Release 7: Nightmare Witchwood (design)

Owner conversation, 2026-11-08. Built on branch `r7` in its own worktree (`../gourd-guard-r7`), gated `__RELEASE__ >= 7`, merged into `dev` after Release 6 (a standalone pumpkin, built in a parallel session). **A beta** like Release 5: first-guess numbers, tuned from the owner's playtests, no bot balance runs. Releases 4 and 5 must play exactly as before.

## Intent

The third nightmare book. Pumpkin Patch's nightmare was **fire**, Foggy Hollow's was **rot**; Witchwood's is **potions**. Witches' brews appear on the field and any monster that walks over one drinks it and grows stronger: tougher, faster or colour-locked. The player cannot clear potions, so the night is about killing the right monster before it reaches them, and about where monsters die: the Cauldron Toad and the Flask Bearer put potions back on the field when they fall, so **potions get recycled** (owner). The new **Wartling Gourd** answers with raw damage: pumpkins launched from its square hit twice as hard, and breaking it by the fence mends the fence.

Audience and difficulty as Releases 4 and 5: endgame players; very hard. Numbers marked *(our number)* are first guesses.

## Goals
- Nightmare 3-1 to 3-16 (`N3-k`, nights `nmNight(3, k)` = 1200 + k), opened by the world 3 book's demon bookmark.
- Potions (three kinds), six new monsters (Ash Crone, Blood Coven Witch, Triptych Sprite, Flask Bearer, Cauldron Toad, plus the Treant's roots), the Treant mini boss, the Wartling Gourd and the Fallen Hexwitch boss.
- Every level has a theme. Art comes from the archive where it exists.

## Non-goals
- No changes to Release 4 or 5 rules or levels (shared code may be generalised, never re-tuned).
- No fire tiles or poison fog in Witchwood (Releases 4 and 5's gimmicks).
- No new tools, no new purchasable pumpkin (Release 6's pumpkin is that release's business; which pumpkins each N3 level offers is settled after the Release 6 merge).
- Rewards are placeholders (one treasure chest per boss win).

## Anti-goals
- Potions must always be readable: every potion on the field is visible (drawn above fog), its kind clear from its bottle, and a buffed monster shows what it drank.
- No per-frame painting (perf rule): potions, zones, roots, the altar and the triptych barrier are baked sprites.
- Lower builds (store, R2–R6) carry nothing from Release 7.

---

## Part 1: The track and the book

- `NIGHTMARE_LEVELS[2]` from `src/data/worlds/nightmare3.js`; `nmNight(3, k)`; label `N3-k`, title "Nightmare 3-k"; theme: the archived nightmare Witchwood map (`docs/archive/nightmare-worlds/`: all colour drained, dead trees, pale moon, falling ash, crows, screaming knotholes, cages, the witch's window burning red).
- **Opens** once 3-20 is beaten **and** N2-4 is beaten *(our call, as Release 5's N1-4 rule: N2-4 unlocks the Protector Gourd, which stands on the patch from N3-1)*. Below that the world 3 bookmark page says what is missing.
- Book page, stamps (16), nightmare bestiary, intro cards and level preview as Releases 4 and 5.

## Part 2: Potions (owner)

- **Three kinds** (owner):
  - **Bulky**: the drinker's health and full health double.
  - **Speed**: the drinker walks and chews faster (×1.5 each *(our number)*).
  - **Colour**: the drinker is hexed: **10% Chameleon, 90% Reverse Chameleon** (owner), in a random loadout colour, as a witch's hex.
- **Where they come from:**
  - **At intervals on random field tiles** (owner), on every level with the level field `potions: { every, count:[min, max], kinds, cap }` (e.g. every 9 s, 1–2 potions, all three kinds, at most 6 on the field *(our numbers)*). They use the same field tile grid as Release 4's fire tiles; never on a tile with a potion already.
  - **The Blood Coven Witch** places them (Part 3).
  - **The Flask Bearer and the Cauldron Toad** drop them when they die (Part 3).
  - **The Fallen Hexwitch** summons them (Part 6).
- **Drinking:** a monster that walks onto a potion's tile drinks it if it may, and the potion **vanishes** (owner). A monster that may not drink walks past and leaves it for the next one.
- **Who may drink:** any monster, except **bosses, mini bosses and mummies** (owner; one rule beside `hexable()`), and never the **same kind twice**: a monster may hold one of each, so at most bulky + speed + colour (owner). A true Chameleon or Reverse Chameleon may not take the colour potion *(our call: as the witch's hex)*; a monster a witch already hexed may (it is re-hexed, as witches re-hex today) but only once.
- **The player cannot remove potions** (owner): pumpkins fly over them, tools ignore them.
- **Look:** three baked bottle sprites, each its own shape and glow so they read in grey Witchwood: bulky a round red flask, speed a thin green vial with a bolt, colour a violet bottle with a swirl *(our call; shown to the owner before levels are built on them)*. A monster that drank shows a small bottle icon per potion beside its health pips; a bulky drinker is drawn about 15% bigger *(our call)*.

## Part 3: New monsters

| Monster | Rules | Art |
|---|---|---|
| **Ash Crone** (`ashcrone`) | Owner: raises **undead zones** like the Hexwitch: every 10 s a 3×3 zone for 8 s, centred on a monster near her; a non-boss monster killed inside collapses and rises after 4 s *(our numbers; the Hexwitch form 1 rule)*. **Arrives ringed by crows** as the Vampire arrives with its bats (owner): 4 crows, left, right, ahead and behind; they are Release 4's crows and raid the patch. 4 health *(our number)*, slow | `witches-mirror/` (Ash Crone) |
| **Blood Coven Witch** (`covenwitch`) | Owner: **places potions** on monster tiles: every 7 s she casts (hex clip, the cauldron boils over) and 1–2 potions land on tiles just ahead of monsters on the field *(our numbers; our reading of "on the monster tiles")*. 3 health *(our number)* | `witches-mirror/` (Blood Coven Witch) |
| **Triptych Sprite** (`triptych`) | Owner: an enhanced Mirror Sprite whose barrier **reflects 3 lanes**: its own and the two beside it. Barrier up 2 s, down 2.5 s, down while it chews (the Mirror Sprite's timing *(our call)*); a pumpkin that meets the barrier in any of the three lanes flies back down that lane and damages that lane's fence for its power. 3 health *(our number)* | `witches-mirror/` (Triptych Sprite, baked barrier) |
| **Flask Bearer** (`flaskbearer`) | Owner: **leaves a potion where it dies**, a random kind *(our call)*. A little imp with bottles on its belt *(our call)*. 2 health, quick *(our numbers)* | New, Toy Plastic (shown to the owner first) |
| **Cauldron Toad** (`toad`) | Owner: **attacks the fence from afar with its tongue**: it stops about a third of the field short of the fence and lashes its own fence at the chew rate (0.5 a second *(our number)*) without walking up to it. It drinks potions like any monster (same stacking rule). **When it dies it bursts** and every potion it drank drops back onto the field as a fresh potion on the tiles around where it died (owner: "potions get recycled"); none if it drank none. 5 health, slow *(our numbers)* | New, Toy Plastic (shown to the owner first) |

Story monsters reused: Wood Ghoul and world 3 variants, Broom Imp, Owl-bat, Wisp, Chameleon, Reverse Chameleon, Mirror Sprite, Witch; crows (Release 4) where a level wants them. Witchwood's wind gusts on the patch may return on some levels.

## Part 4: The Treant (mini boss, N3-4 and N3-13)

From the owner's note "stands at the back and summons roots" and the archive (`docs/archive/nightmare-monsters/minibosses-patch-wood/`).
- Boss rules as the Strawlord and the Lamplighter: holds at the back of the field, **never walks**, never reaches the wall, immune to knockback and freeze, monsters keep coming until it falls. Never drinks potions.
- **Summons roots** every 7 s (summon clip) in 2–3 lanes *(our numbers)*:
  - A root rising **mid-field** blocks its lane: the next pumpkin flicked up that lane hits the root; 3 hits destroy it *(our number)*. So the Treant is shielded in that lane.
  - A root rising **at the fence** grabs it and squeezes (0.5 a second *(our number)*) until it is destroyed or sinks after 8 s.
- 24 health; N3-13 is form 2 (34 health, roots every 5 s in 3–4 lanes) *(our numbers)*. One treasure chest per win. **Beating N3-4 unlocks the Wartling Gourd.**

## Part 5: The Wartling Gourd (owner)

- The third gourd. Art: the archive's **Wartling** (`docs/archive/gourds/`: violet `#8a5cc6`, a round pear gourd covered in little bumps, curly stem), with the toy face, as the other gourds *(our pick of the unused shapes: violet suits Witchwood)*.
- **Power** (owner): any pumpkin launched from its 3×3 does **double damage** (its hit damage ×2; on-hit powers such as Ice, Fire and lightning apply as normal on top) *(our call on what doubles)*.
- **Breaking it** (press and hold, as the other gourds): if it stands in the **top row of the patch**, right under the fence (owner, 2026-11-08), each fence above its 3×3 (its column and the one each side, up to 3) heals by **half its full health**, never above full. Broken anywhere else it does nothing extra. It comes back on the next sprout tick, as the other gourds.
- **Unlocked by N3-4**; **tutorial on N3-5** with the coach (owner: "as usual"), the same shape as N1-5's and N2-5's: drag it, launch a bunch from its square (big damage numbers), slide it to the top row and break it to mend the fence.
- **Picker:** still two gourd slots (`GOURD_SLOTS`); with three gourds unlocked the player picks two of the three *(our call: the slots were built for this)*.

## Part 6: The Fallen Hexwitch (N3-16)

From the owner (2026-11-08) and the archive art (`docs/archive/fallen-bosses/`: ash-grey and bone-white, dead-root hair, thorn crown, rotting cloak, treant-bark broom with a screaming knothole, a cauldron brewing red; red is her only colour). Own registry key, so the story Hexwitch's atlas is untouched.
- Boss rules as the other fallen bosses: holds at 28% of the field, never reaches the wall, immune to knockback and freeze, monsters keep coming until she falls, never drinks potions. 45 health *(our number)*.
- **Larger undead zones** (owner): every 12 s a **5×5** zone for 10 s; a non-boss monster killed inside collapses and rises after 4 s *(our numbers)*.
- **The altar, three times a fight** (owner, "like N1-16's wildfire"): at 75%, 50% and 25% of her health an altar rises in another lane towards the back of the field, never her lane. **While it stands she takes no damage** from anything (the Hollow King's rule: a "No damage" float and a dull clink); a hit cannot carry her past the next mark while an altar is up. **Only pumpkins** break the altar (8 health *(our number)*); monsters in front of it shield it, as with any target. A hit past two marks raises the second altar when the first falls; a continued night keeps the altars already passed and brings a standing one back with its health.
- **Summons potions** (owner): 2–3 onto random field tiles every 8 s *(our numbers)*. *(Our reading: this replaces the story Hexwitch's hexing; she does not hex.)*
- **Crow swoops** (owner): 1–3 crows at the top of random lanes every 6 s, as N1-16.
- **Fence smash, then move** (owner): every 10 s she strikes the fence of her own lane for **half its full health**, never its last 1, then glides 1–2 lanes left or right *(our numbers)*.
- One treasure chest per win (reward later), no boss items or costume (`noItems`), as N1-16 and N2-16.

## Part 7: Levels N3-1 to N3-15 (drafted by us, each with a theme)

| # | Name | Idea |
|---|---|---|
| 3-1 | Witch's Brew | Potions on the field, taught with world 3 monsters (intro card for potions) |
| 3-2 | Ash and Crows | Introduces the Ash Crone and her crows |
| 3-3 | Blood Coven | Introduces the Blood Coven Witch |
| 3-4 | The Treant | Mini boss; unlocks the Wartling Gourd |
| 3-5 | The Wartling Gourd | Tutorial (coach), then the night carries on |
| 3-6 | Bottle Imps | Introduces the Flask Bearer |
| 3-7 | Toad Song | Introduces the Cauldron Toad |
| 3-8 | Hall of Mirrors | Introduces the Triptych Sprite, with Mirror Sprites |
| 3-9 | Turncoat Brew | Colour potions only, Chameleons and Reverse Chameleons, witches |
| 3-10 | Graveless Dead | Ash Crones and undead zones; many monsters to rise |
| 3-11 | Ill Wind | Witchwood's patch wind returns with Flask Bearers |
| 3-12 | The Cauldron | Toads and Blood Coven Witches: potions everywhere |
| 3-13 | Treant Returns | The Treant in form 2 |
| 3-14 | Glass Coven | Triptych Sprites and Blood Coven Witches |
| 3-15 | The Long Night | The gauntlet: every new monster |
| 3-16 | The Fallen Hexwitch | The boss (Part 6) |

The Grave Gourd and the Protector Gourd are on offer from N3-1; the Wartling joins from N3-5.

## Part 8: Checks and docs

- A new `tools/nm3_check.py --expect on|r6|r5|r4|r3|r2|off`; `nm2_check.py` and `nm_check.py` gain `--expect r6` (a Release 6 build carries nothing from Release 7: `check_r7_absent` greps for the Release 7 names). Every rule above gets a check, as Releases 4 and 5 did.
- `GAME_DESIGN.md`, `RELEASES.md`, `WORLDS.md`, `LOOT.md` and `CLAUDE.md` updated with the code.

## Merging with Release 6
Release 6 (a new pumpkin) is built in parallel on `dev`. Before merging `r7`: merge the latest `dev` into `r7`, settle the shared tables (`PTYPES` and pumpkin indices, `WORLDS` / `NIGHTMARE_LEVELS`, monster tables, bestiary, lore, the release table) and decide with the owner which pumpkins the N3 levels offer. Level tables should name pumpkins by key, not by index, so a new pumpkin cannot shift them.

## Left to the builder
Exact numbers marked *(our number)*, sound choices from the bank, the potion, Flask Bearer and Cauldron Toad art (shown to the owner first), level pools and pacing within each level's idea, and the coach script for N3-5 (modelled on N1-5's and N2-5's).
