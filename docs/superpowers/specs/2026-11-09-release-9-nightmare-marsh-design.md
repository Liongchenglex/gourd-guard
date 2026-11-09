# Release 9: Nightmare Drowned Marsh (design)

Owner conversation, 2026-11-09. To be built on branch `r9` in its own worktree (`../gourd-guard-r9`), branched from `r8` (Release 8, Nightmare Crumbling Keep, waiting for the owner's playtest), which was branched from `r7`. Gated `__RELEASE__ >= 9`. **A beta** like Releases 5, 7 and 8: first-guess numbers, tuned from the owner's playtests, no bot balance runs. Releases 4 to 8 must play exactly as before.

Numbers marked *(our number)* and calls marked *(our call)* are defaults we proposed; everything else is the owner's.

## Intent
The fifth and last nightmare book. The Patch's nightmare was **fire**, the Hollow's **rot**, Witchwood's **potions**, the Keep's **nets**; the Marsh's is **the blood tide**: a crimson sea under a blood moon that **rises toward the fence** during the night, with **whirlpools** that throw monsters from one end to the other. The new **Swan Gourd** is the last gourd and feels like a **black hole**: everything launched from its square drags a black ring of splash behind it. The night ends with the **Fallen Twin Tides**, the owner's "night serpents".

## Goals
- Nightmare 5-1 to 5-16 (`N5-k`, nights `nmNight(5, k)` = 1400 + k), opened by the world 5 book's demon bookmark.
- The rising blood tide, whirlpools, five new monsters (Blood Slime, Pirate, Turtle Rider, Storm Eel, Siren), the Kraken mini boss, the Swan Gourd and the Fallen Twin Tides.

## Non-goals
- No tuning with the bot (beta).
- No new pumpkins. No change to story levels or to N1 to N4.
- The tide never covers the patch; whirlpools never touch pumpkins (owner: "only move monster").

## Anti-goals
- No per-frame painting: the tide, whirlpools, every new monster, ring and effect are baked (perf rule, `CLAUDE.md`).
- Endless Blood Slimes must never lag the phone (see the cap in Part 3).
- The tide must never reach the fence (Part 2).

## Part 1: The track and the book
- `NIGHTMARE_LEVELS[4]` from `src/data/worlds/nightmare5.js`; `nmNight(5, k)`; label `N5-k`, title "Nightmare 5-k".
- **Map:** the archived nightmare Marsh (`docs/archive/nightmare-worlds/`, owner loved it): the red lighthouse, tentacles in the water, the grim touches as drawn. **The sea is blood-red under a blood moon** (owner) instead of blue. Baked once, like the other maps.
- **Opens** once 5-20 **and** N4-4 are beaten *(our call, the pattern of Releases 5, 7 and 8)*. Below that the world 5 bookmark page says what is missing.
- Gated by `__RELEASE__ >= 9`; store builds (`STORE_RELEASE` 1) never contain it.
- Book page, stamps (16), nightmare bestiary, intro cards and level preview as the other nightmare books.
- Music: the regular nightmare music (owner, as Release 8).

## Part 2: The blood tide and whirlpools (owner)
- **The tide moves** (owner): each N5 night starts with its sea at the level's shore line, and the spawn bar carries **tide marks** (a wave icon, like the fire, potion and jukebox marks). When the night's progress reaches a mark, the tide **surges** toward the fence to that mark's new line. Level field `tideMarks: [{ at, to }]` (`at` = spawn-bar fraction, `to` = the new shore as a field fraction) *(our shape)*.
- **How far:** set per level; on harder nights **beyond halfway** (owner). It always stops at least one tile row before the fence *(our call)* and never covers the patch.
- **The surge:** a quick crimson wave sweeps across the field (baked sprites) *(our call)*. Monsters already on the field are not moved; a monster in the newly covered area keeps walking *(our call)*.
- **New monsters appear at the water's edge**, as on story shoreline nights, so each surge brings every new monster's start closer to the fence (owner: that is what makes the harder nights harder).
- **One shore line** across every lane *(our call)*. After a surge the new line is the live shore for everything that reads it: where monsters appear, where Storm Eels, the Siren, the Kraken and the Twin Tides may surface, and what counts as water for whirlpools. Every reader of `shoreP` must use the live line (the builder audits them all) *(our call)*. Monsters on rows the tide newly covers just keep walking.
- **Pools** on dry land are swallowed into the tide when it reaches them (owner).
- **Whirlpools** (owner): a monster that steps into one end of a pair comes out of the other end. **Up to 4 pairs** on a night (owner). They sit in water, either in a pool or in the tide (owner); a whirlpool in a pool the tide swallows becomes a whirlpool in the tide (owner). The two ends can be in different lanes and at different heights, so a whirlpool can throw a monster back up the field or pull it closer *(our call)*. Each pair spins in its own colour so the linked ends read at a glance, baked and blitted with a pulsing alpha like the zones *(our call)*.
- A monster is taken when it walks across an end's `p` in that end's lane *(our call)*. Both ends of a pair may be in the same lane. Ends are only ever placed in water that exists at that moment (a level's ends are in its pools or its starting sea; the blue twin places new ones only in the current tide) *(our call)*.
- A monster keeps its health and status through a whirlpool; one that just came out cannot be taken again for 2 s *(our number)* so it never bounces back and forth. **Never taken:** bosses and mini bosses, the Kraken's head and tentacles, and the water dwellers (Puddle Divers, Storm Eels, the Siren), which surface rather than walk *(our call)*.
- Level field `whirlpools: [[endA, endB], …]`, each end `{ lane, p }` *(our shape)*.

## Part 3: New monsters (owner; art in `docs/archive/nightmare-monsters/`)

| Monster | Health | Behaviour |
|---|---|---|
| **Blood Slime** (`slime-patch/`, the Blood Splitter Slime) | 4 *(our number)* | Killed, it splits into **3 blobs**. Each blob **grows back into a full Blood Slime** after 6 s *(our number)*, swelling as it grows so the player sees it coming, **and it can go on forever** (owner: it rewards killing fast). A blob killed before it regrows is gone; it is an ordinary kill (the reward roll, coins) and the night cannot be won while any slime or blob stands, as with Splitter Slimes today *(our call)*. **Cap** *(our call, anti-goal)*: at most 12 Blood Slimes and blobs on the field; a split that would go over makes only as many blobs as fit. |
| **Pirate** (`kraken-pirate/`, the Drowned Pirate) | 4 *(our number)* | Walks down his lane and **stops once or twice** *(owner: "a pumpkin or two")* to **shoot a pumpkin**: a short aim line shows for 1 s *(our call)*, then the shot **destroys** that pumpkin; sprouts refill the cell. He stops at a random point between 30% and 60% of the field *(our numbers)* and aims at the pumpkin in his column nearest the top of the patch *(our call)*; a column with no pumpkin (or only a gourd) means he walks on without shooting. Never a gourd; a gourd's square does not protect *(our call)*. The shot needs no line of sight. |
| **Turtle Rider** (`riders/`) | 10 (the Shell Turtle's) | A Shell Turtle with an imp riding it: walks backward, shell toward you, Grey pierces it, as the Shell Turtle *(our call)*. The imp **throws rotten pumpkins from afar** that turn a pumpkin rotten (Release 5 rot, `rotCell`) every 7 s *(our number)*. **When it dies an imp is released** (owner): a normal Imp, from where it fell. |
| **Storm Eel** (`storm-eel/`) | 3 (the Puddle Diver's) *(our number)* | Hides under the water and can only be hit while up. It surfaces, crackles for 0.5 s as a warning, and **shoots an electric bolt at the fence from afar** (the Puddle Diver's damage) *(our number)*, then **dives and comes up in another pool or anywhere in the tide** (owner). **It does not leap** (owner): it sinks in one spot and rises in the next. |
| **Siren** (`siren/`) | 6 *(our number)* | Stays in the sea at the back of one lane on her rock and never walks; can be hit in her lane. Every 12 s *(our number)* she sings: one patch row gets a warning (like Witchwood's narrow wind), then **its pumpkins turn into red spheres that hide their colour** for 6 s (owner, from the dump note). Hidden pumpkins still bunch, light up and launch by their true colour; only the player cannot see it (no hint arrow onto a hidden row either) *(our call)*. The row is picked at random among rows not already hidden; a second song on a hidden row refreshes its 6 s *(our call)*. |

- The Marsh story monsters come back mixed in (Puddle Crawlers, Drunk Sailors, Puddle Divers, Splitter Slimes, Shell Turtles), as Release 8 brought back Shield Knights, Bulwarks and Vampires *(our call)*.

## Part 4: The Kraken (mini boss, N5-4 and N5-13; archive `kraken-pirate/` and `minibosses`)
- **The head** is the only part that can die (owner). It **rises and dives**: while it is down, **tentacles** are up; **killing the tentacles brings the head back up** (owner). You must have **every** tentacle down at the same moment; each downed tentacle **comes back up** on its own 6 s clock *(our number)* if the head has not risen, so they must be cleared quickly *(our reading of the owner)*. The head rises at a random spot in the tide *(our call)*.
- With the head up for 8 s *(our number)* it can be hit (its health carries over between surfacings; form 2 has the same cycle with more tentacles and health); then it **dives again and sends up a fresh set of tentacles** (owner). The head is worn down over several surfacings.
- **Tentacles:** **3 on N5-4** (owner), **5 on N5-13** *(our number; owner: more on the later stage)*. They rise at random spots in the water (tide or pools). 3 health each *(our number)*. Each **throws an anchor** at its lane's fence every 6 s *(our number)*. An anchor **only damages the fence**, a bit more than a Puddle Diver's or Storm Eel's bolt (owner): 1.5× the Diver's *(our number)*.
- Head health 20 on N5-4, 32 on N5-13 (form 2) *(our numbers)*. It sits in the tide at the back and never reaches the wall; immune to knockback and freeze like every boss. Never taken by whirlpools.
- Beating N5-4 unlocks the Swan Gourd.
- A continued night keeps the head's health and the phase (head up or down) through `bossMood`, like the other mini bosses *(our call)*; tentacles come back fresh.

## Part 5: The Swan Gourd (owner)
- The fifth and last gourd. Art: the archive's **Swan** (`docs/archive/gourds/`: cream `#e4d9bd` with green stripes, a round striped body with a long thin neck arcing into a little head), with the toy face, cute like the other gourds.
- Moves, is never flicked, and comes back on the next sprout tick after it breaks, like the other gourds.
- **Black-hole splash** (owner): every pumpkin launched from its 3×3 also deals **1 splash damage** where it hits a monster. It shows as a **black ring that expands** from the hit, like a black hole (a baked ring, scaled and faded). It hurts **only the monsters around the one that was hit, never the hit monster itself** (owner), reaching the monsters Black's splash would reach *(our call)*.
- **The splash gets past the "only X can kill it" rules** (owner): it can kill **Mummies, Flaming Mummies, every flaming monster from Nightmare 1** (Burning Hayrick, Burning Husker, Charred Cob and the rest), **Chameleons and Reverse Chameleons**. Shields still refuse it: the shield door of Releases 3 and 8, the Siege Tower's archers, a Lamplighter's or Plague Doctor 2's rot rules *(our call)*.
- **Independent of Black** (owner): a Black pumpkin launched from the square deals its own splash **and** the black-hole splash.
- A burning form hit by the splash simply takes the damage and can die for good; it does not burn into another form *(our call)*. A neighbour in reach of both a Black pumpkin's splash and the black-hole splash takes both (owner: independent).
- **Breaking it** (press and hold, as the other gourds) **fills the empty cells in its 3×3 with Rainbow pumpkins** (owner).
- **Introduced on N5-5** with the coach tutorial (drag it, launch from its square so the black ring finishes a Mummy beside the monster it hits, break it for Rainbows), the shape of N1-5's, N2-5's and N3-5's *(our call)*. On N5-5 it is locked into the second gourd slot *(our call)*; from N5-6 it is a free pick.
- **Picker:** still two gourd slots; with five gourds unlocked the player picks two of the five *(our call)*.

## Part 6: Levels N5-1 to N5-15 (first draft, owner approved the shape)

| Level | Introduces | Notes |
|---|---|---|
| 5-1 | The blood tide and whirlpools | One whirlpool pair, one gentle tide mark |
| 5-2 | Blood Slime | Slimes near a whirlpool |
| 5-3 | Pirate | Pirates with crawlers |
| 5-4 | The Kraken | Mini boss, 3 tentacles; unlocks the Swan Gourd |
| 5-5 | The Swan Gourd | Coach tutorial; Mummies and Flaming Mummies so the splash matters |
| 5-6 | Turtle Rider | Rot from afar |
| 5-7 | Storm Eel | Pools and tide |
| 5-8 | Siren | Hidden rows |
| 5-9 | Siren and Pirates | Shots and hidden rows together |
| 5-10 | Chameleon tide | Chameleons and Reverse Chameleons, the Swan Gourd as the answer |
| 5-11 | Slime flood | Many Blood Slimes; the tide goes past halfway |
| 5-12 | Eel storm | Eels with a high tide and three whirlpool pairs |
| 5-13 | The Kraken 2 | Form 2, 5 tentacles |
| 5-14 | Maelstrom | All 4 whirlpool pairs, a high tide |
| 5-15 | The gauntlet | Every new monster |

The other four gourds are on offer from N5-1 on gourd nights *(our call)*; the Swan joins from N5-5. Pumpkins are named by key in the level tables (Release 7's rule).

## Part 7: The Fallen Twin Tides (N5-16; art `docs/archive/fallen-bosses/twintides`)
The owner's night serpents, two different twins (the archive's blood and blue looks).
- **Both:** hold in the tide, never reach the wall, immune to knockback and freeze. 30 health each *(our number)*. Each time a twin loses a quarter of its health it **dives and resurfaces elsewhere in the water** (owner: "depending on its hp bar").
- **Killed together** (owner): when one goes down, the other has **12 s** to be killed (the story Twin Tides give 8 s; owner: "can be extended"); otherwise the fallen one rises again at full health, and the rule starts over the next time one falls.
- **Blood twin** (owner): throws blood bolts at the fence every 6 s *(our number)*. **When its eyes glow red it sings like the Siren** (a warned row turns to red spheres for 6 s), every 14 s *(our number)*. A **3×3 aura** around it **heals it whenever a new monster spawns in it or steps into it**, 1 health per monster *(our number)*; summons and monsters a whirlpool throws into the aura count too *(our call)*.
- **Blue twin** (owner): throws water bolts at the fence every 6 s *(our number)*. Now and then (every 12 s *(our number)*) a **water spear** destroys **a whole patch column of pumpkins**, after a 1.5 s warning flash like the Fallen Count's lightning; gourds are spared *(our call)*. **When its eyes glow blue it opens a new whirlpool pair** on the field, every 16 s *(our number)*, at most 4 pairs at once.
- **Summons** *(our call)*: Blood Slimes, Pirates and Storm Eels arrive during the fight.
- Reward: one normal chest for now (as N1-16 and N4-16).

## Part 8: Checks and docs
- `tools/nm5_check.py --expect on|r8|r7|…|off`, like `nm4_check.py`: builds with and without Release 9 and checks the bundle has (or lacks) every Release 9 name, and that Releases 4 to 8 still pass their own checks.
- `GAME_DESIGN.md` §9 "Nightmare Drowned Marsh", the monster table rows, `docs/RELEASES.md` (Release 9 row and gated places), `docs/WORLDS.md` §10, `CLAUDE.md` current state, the nightmare bestiary. Draw budget checked for the tide, whirlpools and slime crowds (`check_draw_budget`).

## Merging with Releases 7 and 8
`r9` starts from `r8`, which starts from `r7`. Pull new `r8` (and through it `r7`) commits in as they land, especially any net or Lancer changes from the owner's Release 8 playtest. Shared tables touched by all three: `NIGHTMARE_LEVELS` / `nmNight`, the book bookmarks in `src/ui/screens.js`, `src/data/gourds.js` and the picker, monster tables, `ALSO_BAKE`, the Fallen book list, bestiary, lore, `vite.config.js`, the release table and every check's `--expect` list. Keep Release 9 code in its own files (`src/engine/tide.js`, `src/engine/marsh.js`, `render/chars/marsh.js`, `nightmare5.js`) so merges stay small.

## Still open (owner, to revisit later)
- The Fallen Twin Tides' reward.
- All numbers marked *(our number)*.
