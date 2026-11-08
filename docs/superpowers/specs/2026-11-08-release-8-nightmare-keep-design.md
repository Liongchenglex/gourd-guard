# Release 8: Nightmare Crumbling Keep (design)

Owner conversation, 2026-11-08. Built on branch `r8` in its own worktree (`../gourd-guard-r8`), branched from `r7` (Release 7, Nightmare Witchwood, still being built in a parallel session) and gated `__RELEASE__ >= 8`. **A beta** like Releases 5 and 7: first-guess numbers, tuned from the owner's playtests, no bot balance runs. Releases 4 to 7 must play exactly as before.

Numbers marked *(our number)* and calls marked *(our call)* are defaults we proposed; everything else is the owner's.

## Intent
The fourth nightmare book. Pumpkin Patch's nightmare was **fire**, Foggy Hollow's **rot**, Witchwood's **potions**; the Keep's is **nets** (owner: "the nets are the key gameplay"). Monsters throw nets onto the patch; a netted pumpkin is stuck where it is and can only leave by flying with a bunch. The new **Crookneck Gourd** is the answer: nothing in its square can be netted, everything in its square launches together, and breaking it clears every net on the patch. The map is the archived thunderstorm Keep.

## Goals
- Nightmare 4-1 to 4-16 (`N4-k`, nights `nmNight(4, k)` = 1300 + k), opened by the world 4 book's demon bookmark.
- Nets (normal and red), six new monsters (Storm Lancer, Storm Marshal, Blood Glutton, Bat Bride, Lobber Cart, plus the castle pieces Gatehouse and Archer Tower), the Siege Tower mini boss, the Crookneck Gourd and the Fallen Count.

## Non-goals
- No tuning with the bot (beta).
- No new pumpkins. No change to story levels or to N1 to N3.

## Anti-goals
- Never let nets deadlock the patch (see the cap and the free-neighbour rule).
- No per-frame painting: every new monster, net, wall and effect is baked (perf rule, `CLAUDE.md`).

## Part 1: The track and the book
- `NIGHTMARE_LEVELS[3]` from `src/data/worlds/nightmare4.js`; `nmNight(4, k)`; label `N4-k`, title "Nightmare 4-k".
- Theme: the archived nightmare Keep map (`docs/archive/nightmare-worlds/`, owner: thunderstorm): black storm clouds, forked lightning over the towers, rain across the screen, the Vampire Count on the tallest tower, gargoyles with burning eyes, crows on the battlements, a broken portcullis. Baked once like the other maps; the rain is part of the bake, not a per-frame effect *(our call)*.
- **Opens** once 4-20 **and** N3-4 are beaten *(our call, the pattern of Releases 5 and 7: N3-4 unlocks the Wartling Gourd)*. Below that the world 4 bookmark page says what is missing.
- Book page, stamps (16), nightmare bestiary, intro cards and level preview as Releases 4, 5 and 7.
- Music: the regular nightmare music, as the other nightmare books (owner).

## Part 2: Nets (owner)
- **A netted pumpkin** (`cell.net = 'net' | 'red'`) cannot slide, be pushed (a push whose line holds it is refused, as into a grave or a pinned pumpkin), be moved by `bestMove`, and **cannot be destroyed**: crushing (press and hold) is refused, lightning and any other pumpkin-destroying effect skip it. It **cannot be flicked on its own**; it still bunches with its colour, lights up and **flies with its bunch** (owner), taking the net with it. A net has no timer: it stays until its pumpkin flies or the Crookneck Gourd is broken.
- **Red nets** (the Blood Glutton's and the Fallen Count's) work the same on the pumpkin and also shield the monster that cast them (Parts 3 and 7). Drawn as a crimson net over a red-tinted pumpkin (owner: "the pumpkin is red").
- **Who nets:** the Lobber Cart, the Siege Tower, the Blood Glutton and the Fallen Count. A thrown net flies to its cell (the archive's net sprite) and lands; a net never lands on a gourd, on a pumpkin already netted, in the Crookneck Gourd's square, or on a pumpkin that would then have no free (un-netted, non-grave) neighbour *(our call)*.
- **Cap: 15 nets on the patch at once** (owner), both kinds together; a throw over the cap fizzles.
- Art: the archive's net and netted pumpkin (`docs/archive/nightmare-monsters/crows-cart/`), plus a red version.

## Part 3: New monsters (owner)

| Monster | HP | Behaviour |
|---|---|---|
| **Storm Lancer** (archive `knights/`) | 5 | Charges down its lane the moment it spawns, fast (about 4× a normal walk) *(our number)*. On reaching the fence it deals massive damage: **half the fence's full health**, never its last 1 (the Hayrick's fork rule) *(our numbers)*, and is gone. Ice slows the charge. |
| **Storm Marshal** (archive `knights/`) | 10 (the Shell Turtle's) | Walks like a knight. Every 8 s raises his sword for 4 s *(our numbers)*: while raised, monsters in his 3×3 move at ×2 speed and get ×2 HP (current and max). The speed ends when the sword drops; the HP stays. A monster gets the HP boost once ever, and bosses and other Marshals never *(our calls, so it cannot stack)*. |
| **Blood Glutton** (archive `vampires-doctor/`) | 8 *(our number)* | When it spawns it red-nets 2 pumpkins. **While any of its red nets is on the patch it takes no damage** (a "No damage" float and a dull clink, the Hollow King's rule). Every 10 s *(our number)* it casts another red net, at most 2 of its own at a time *(our call)*. Its red nets stay if it dies, as ordinary nets until they fly *(our call)*. |
| **Bat Bride** (archive `vampires-doctor/`) | 6 *(our number)* | **Bridal veil** (owner's pick): drapes a red veil over the nearest other monster in her lane or the ones beside it; the veiled monster takes no damage until the Bride dies. One veil at a time; when its monster dies she veils the next after 3 s *(our numbers)*. A veiled Glutton needs its red nets gone **and** the Bride dead. |
| **Lobber Cart** (archive `crows-cart/`) | 6 *(our number)* | Rolls in slowly and parks at the back of its lane (never comes down to the wall). Every 6–8 s lobs a net onto a random pumpkin. Killing it does not free its nets *(our call)*. |

**Castle pieces** (archive `castle-walls/`; placed by the level like castle walls, `castles` layout entries with a `kind`):
- **Gatehouse**: a castle wall (blocks shots like one) with 2.5× the level's castle wall HP *(our number)*. It **summons monsters one at a time** from its gate (owner: no queueing): every 8 s *(our number)* one monster from the level's `gatePool` walks out of it. Breaking it stops the summons.
- **Archer Tower**: a castle wall with 1.5× the level's castle wall HP *(our number)* and a Skeleton Archer on top that shoots down the lane every 5 s (3 wall damage, as the Skeleton Archer). **Pumpkins hit the tower, no exception for Grey** (owner). When it falls the archer drops to the rubble and **fights on straight away** as an ordinary Skeleton Archer holding there, **not stunned** (owner).

**Reused from world 4** (owner): Shield Knight, Bulwark Knight, Vampire, Skeleton Archer, castle walls.

## Part 4: The Siege Tower (mini boss, N4-4 and N4-13; archive `minibosses-hollow-keep/`)
- 24 health; N4-13 is form 2 (34) *(our numbers, the Treant's)*. Rolls very slowly down one lane and never reaches the wall (mini boss rule).
- **Archers:** two Skeleton Archers on its top deck loose volleys at a wall every 6 s *(our number)*. Pumpkins hit the archers first: each hit knocks one off (variants `a2` → `a1` → `a0`); only with both gone does the tower take damage *(archive proposal, kept)*.
- **Nets** (owner): lobs a net onto the patch every 9 s *(our number)*, as the Lobber Cart.
- **Ramp** (owner): every 12 s *(our number)* the ramp drops and releases **only a Storm Lancer or a Storm Marshal** (random; at most one Marshal from the tower on the field at a time *(our call)*). A Lancer from the ramp charges at once.
- On death it collapses (`break`) and its own nets are cleared *(our call: a mini boss's reward)*. One treasure chest per win. Beating N4-4 does **not** unlock the gourd (the Crookneck comes on N4-3, Part 5).

## Part 5: The Crookneck Gourd (owner)
- The fourth gourd. Art: the archive's **Crookneck** (`docs/archive/gourds/`: lime `#b9cf3c`, a fat bumpy base whose neck curls over like a shepherd's crook, the stem hanging from the tip), with the toy face *(our pick: the Calabash is the Grave Gourd's, the Crookneck the Protector's, the Wartling Release 7's, and the Turban's red would read as a red net; the crook suits hooking nets off)*.
- Moves, is never flicked, and comes back on the next sprout tick after it breaks, like the other gourds.
- **No nets in its square:** nothing in its 3×3 can be netted (owner).
- **Group launch:** every pumpkin in its 3×3 lights up and launches together as one bunch, any colour, without the usual 3 in a line (owner); each flies up its own column with its own power. Needs at least 2 pumpkins in the square *(our call)*. A pumpkin already netted that ends up in the square (the gourd slid next to it) keeps its net but flies with the group *(our call)*. If a pumpkin in the square is also part of a normal bunch reaching outside, flicking launches the square's group and that whole bunch *(our call)*.
- **Breaking it** (press and hold, as the other gourds) **clears every net on the patch, red nets too** (owner).
- **Introduced early, on N4-3** (owner: an exception to the other books' "unlocked by the mini boss"): given at the start of N4-3 with the coach tutorial (drag it, launch a mixed group from its square, break it to clear the nets), the same shape as N1-5's, N2-5's and N3-5's *(our call)*. On N4-3 the Crookneck is locked into a gourd slot; from N4-4 it is a free pick.
- **Picker:** still two gourd slots (`GOURD_SLOTS`); with four gourds unlocked the player picks two of the four *(our call, as Release 7)*.

## Part 6: Levels N4-1 to N4-15 (first draft, owner approved the shape)

| Level | Introduces | Notes |
|---|---|---|
| 4-1 | Nets and the Lobber Cart | One cart, light mix of Shield Knights and Vampires |
| 4-2 | Storm Lancer | Lancers in short bursts |
| 4-3 | The Crookneck Gourd | Coach tutorial; two carts so the gourd matters |
| 4-4 | The Siege Tower | Mini boss; the Storm Marshal first appears from its ramp |
| 4-5 | Archer Tower | Two towers plus Skeleton Archers |
| 4-6 | Blood Glutton | Red nets; the gourd as the shortcut |
| 4-7 | Gatehouse | Gates sending out Shield Knights and Vampires |
| 4-8 | Bat Bride | Veils on Bulwarks and Marshals |
| 4-9 | Glutton and Bride | A veiled Glutton |
| 4-10 | Marshal rush | Marshals boosting crowds out of two Gatehouses |
| 4-11 | The tower line | A full row of Archer Towers, carts behind |
| 4-12 | Lancer storm | Lancers and carts only |
| 4-13 | Siege Tower 2 | Form 2, with Gluttons and Brides |
| 4-14 | Fortress | Two rows of walls, Gatehouses and Towers |
| 4-15 | The gauntlet | Every new monster |

The Grave, Protector and Wartling Gourds are on offer from N4-1 on gourd nights *(our call)*; the Crookneck joins from N4-3. Pumpkins are named by key in the level tables, not by index (Release 7's rule).

## Part 7: The Fallen Count (N4-16; art `docs/archive/fallen-bosses/`)
- 48 health *(our number)*. **Moves like the Vampire Count**: walks down his lane and holds at 30% of the field, never reaches the wall; immune to knockback and freeze. **No bat scatter** (owner): he does not change lanes.
- **Blood nets:** at the start and at 75%, 50% and 25% of his health he red-nets 3 pumpkins; while any of his red nets is on the patch he takes no damage (the Glutton's rule). A hit cannot carry him past the next mark while shielded *(our call, as the Fallen Hexwitch's altars)*.
- **Blood trance** (every 18 s): stands still and heals 1 HP every 2 s **for each netted pumpkin on the patch** (either kind); a few hits (3 *(our number)*) break it and stun him 2 s, as the Count's trance.
- **Blood spear** (every 10 s): thrown down his lane, takes a third of the fence's full health, never its last 1 (the Hayrick's fork rule).
- **Lightning** (every 12 s): a patch column flashes for 1.5 s, then a bolt smashes every pumpkin in it **except netted ones**; sprouts refill it.
- **Summons** (every 14 s): one Storm Lancer (charges at once) and one Bat Bride. A Bride may veil him; then he is immune until she dies.
- **Castle pieces** (owner): raises **one Archer Tower and one Gatehouse**; every 20 s he rebuilds whichever is missing *(our number)*, at most one of each. His Gatehouse sends out Shield Knights, Bulwark Knights and Vampires *(our call)*.
- Removed by the owner: bat scatter, storm surge.
- Shield Knights and Vampires walk in during the fight. Reward: one normal chest for now (as N1-16).

## Part 8: Checks and docs
- `tools/nm4_check.py --expect on|r7|…|off`, like `nm3_check.py`: builds with and without Release 8 and checks the bundle has (or lacks) every Release 8 name, and that Releases 4 to 7 still pass their own checks.
- `GAME_DESIGN.md` §9 "Nightmare Crumbling Keep", the monster table rows, `docs/RELEASES.md` (Release 8 row and gated places), `docs/WORLDS.md` §10, `CLAUDE.md` current state, the nightmare bestiary. Draw budget checked for the rain map and nets (`check_draw_budget`).

## Merging with Release 7
`r8` starts from `r7`. Pull new `r7` commits in as they land. Shared tables touched by both: `NIGHTMARE_LEVELS` / `nmNight`, the book bookmarks in `src/ui/screens.js`, `src/data/gourds.js` and the picker, monster tables, bestiary, lore, `vite.config.js`, the release table. Keep Release 8 code in its own files (`src/engine/nets.js`, `src/engine/keep.js`, `render/chars/keep.js`, `nightmare4.js`) so merges stay small.

## Still open (owner, to revisit later)
- The Fallen Count's reward.
- All numbers marked *(our number)*.
