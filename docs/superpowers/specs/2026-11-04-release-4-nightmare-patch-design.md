# Release 4: Nightmare Pumpkin Patch (design)

Owner conversation 2026-11-04. "Owner" marks the owner's decisions; "our call" marks Claude's defaults for the owner to check. The owner will rework any level they are unhappy with.

## Intent

The world 1 storybook already has a demon bookmark that turns it into a grim nightmare edition (map, lore, music, "The Fallen Gravekeeper"), but its level page says **Coming soon**. Release 4 fills it: **16 nightmare levels** for Pumpkin Patch, a new map gimmick (**fire**), new monsters, a **mini boss**, and the first **gourd**, a new piece on the patch that changes how you play. It is endgame content for players who have already beaten 5-20, so it must be **much harder** than anything in worlds 1 to 5 (owner).

After 1-4 the levels should lean hard into the nightmare monsters and the gourd playstyle (owner). Levels 1-1 to 1-4 teach fire with mostly familiar monsters.

## Hard rule: everything here is Release 4

Gate every piece with `__RELEASE__ >= 4` written directly in the expression (`docs/RELEASES.md`). Store builds (1), the Release 2 build and the Release 3 build must contain nothing from this release: no nightmare level names, no Grave Gourd, no Rooster / Hayrick / Husker / Grave Riser / Strawlord names or art, no fire tiles. Below Release 4 the nightmare book keeps its "Coming soon" page exactly as today. Extend `tools/w6_check.py` with an `--expect r3` mode (Release 3 build: World 6 complete, nothing from R4) and Release 4 presence checks for `--expect on`.

## Part 1: how the nightmare levels are reached

- **Where** (owner): the demon bookmark on the world 1 book, which appears once 1-20 is beaten (already built). In nightmare mode the right page shows 16 level stamps in place of "Coming soon".
- **Opens after 1-20** (owner): no 5-20 gate. The levels are simply very hard.
- **One at a time** (our call): N1-1 opens with the bookmark; each win opens the next, like story levels.
- **A separate track** (our call): nightmare levels are not part of the story night numbering (`ALL_LEVELS` / `save.unlocked` stay untouched). They need their own level table (`src/data/worlds/nightmare1.js`), their own progress, stars and quest keys in the save (backward-compatible migration), and their own label on the HUD and preview, e.g. "Nightmare 1-5". How the track is keyed is left to the builder.
- **Shown as** "Nightmare 1-1" … "Nightmare 1-16" with each level's name (our call).
- **The map in play** (our call): the nightmare Pumpkin Patch scene already drawn for the book (`src/engine/render/nightmare/`, eclipse, burning barn) becomes the night's background, baked once like the other backgrounds. Music: the existing nightmare track (`musicStart('nightmare')`), from 0:00.
- **Team** (our call): any pumpkin the player owns, Paint and Beige included, with the usual locks (Ice locked in on any level with fire or burning monsters, since only Ice can put out fire or kill burning monsters; Fire locked in where plain Mummies appear).
- **Rewards** (owner, 2026-11-04: "assume for now, polish later"): coins and kill rolls like a World 6 level; stars from quests built from the existing quest types. **Each Strawlord win (N1-4, N1-13) gives a normal treasure chest** (owner); no boss items or costume. The reward for beating N1-16 is the owner's to decide later. All nightmare rewards are placeholders to be polished; record them in `docs/LOOT.md`.
- **Endless Night**: unchanged; no fire, no gourd (our call).

## Part 2: fire tiles (new map gimmick)

- **Where** (owner): on random tiles of the **monster side** (the field), never on the patch.
- **What it does** (owner): a pumpkin flying up its column that reaches a fire tile **burns up and disappears**. The fire stays.
- **Ice puts it out** (owner): an Ice pumpkin that reaches a fire tile puts it out and **stops there** (it does not fly on).
- **It stays** (owner): fire never burns out on its own. Only Ice removes it.
- **Order along the column** (our call): a flying pumpkin meets things in the order they stand. A monster in front of the fire is hit as usual; the fire only matters to a pumpkin that would pass that tile. Any pumpkin's on-hit power (Deep Blue lightning, Black splash, Beige glue, Fire burn) does not fire when it burns up in a fire tile. Tools (Firework, Bomb, mines) neither put out fire nor are stopped by it.
- **Monsters and fire** (owner): fire does not hurt or stop monsters. A **Mummy, Hayrick or Corn Husker** that walks onto a fire tile becomes its **burning version** (Part 4).
- **Where fire comes from:**
  - **At night start**: a level may light some tiles (level data).
  - **Fire marks** (owner): stages through the night, shown as marks on the spawn bar like the 6-19 jukebox marks. When the bar reaches a mark, that mark's fire tiles light up and **a horde arrives: the jukebox burst** (4–6 monsters, one every 0.2 s, `FRENZY_BURST`). There is nothing to smash; after the burst normal spawning carries on (our call). The burst monsters are extras that do not count toward the night (our call, as with the jukebox). The bar counts arrivals on levels with fire marks, as 6-19 does. The mark pulses briefly when it fires and then dims (our call).
  - **The Cinder Rooster** (owner): leaves a fire tile where it dies, however it dies.
- **How much fire** (owner): varies per level. Level data gives the fire at start and the tiles per mark.
- **Placement** (our call): random field tiles that are not already burning, spread across lanes (no lane gets a second new tile from the same mark while another lane has none). A tile under the Strawlord or a castle wall is skipped. A continued night keeps the burning tiles and the marks already passed.
- **Art**: a baked, looping flame sprite per tile (frames baked once, blitted; never painted or `shadowBlur`'d per frame), a hiss-and-steam puff when Ice puts it out, a small flare when a pumpkin burns up in it. A sound for each.

## Part 3: the Grave Gourd (first gourd)

The archived gourd rules (`docs/archive/gourds/`) are replaced by these where they disagree.

- **Design** (our call, owner said "your pick"): the **Calabash** (amber `#e3a43c`, tall bottle gourd, pinched waist, curly stem), named **the Grave Gourd**. Cute like the pumpkins, keeps its face on the patch, one design everywhere.
- **Unlocked by beating Nightmare 1-4** (owner). **Nightmare 1-5 teaches it** with a coach tutorial (owner), like the first-night coach (`src/engine/coach.js`): slide the gourd, watch a sprout fill the cells around it, press and hold it to destroy it and clear the graves around it, see a new one come back.
- **How many** (owner): one gourd on the patch on every nightmare night from 1-5 on. It is shown in a new **Gourds** section of the pumpkin picker (`#loScroll` already plans for it). With only one gourd it is picked and locked (our call); it does not take one of the pumpkin slots.
- **It moves** (owner): you slide it like a pumpkin, and it is part of a push line like a pumpkin. It **never joins a bunch, never lights up and is never flicked** (our call). Rainbow does not match it; Paint does not pull it.
- **You destroy it yourself** (owner) by pressing and holding it (the same hold as crushing a pumpkin, quick with the 1-20 power). When destroyed it **clears every grave in the 3×3 around it** (owner). Pumpkins in that square are untouched (our call).
- **It comes back on the very next sprout** (owner): the next sprout tick puts a new gourd in a random empty cell. That takes one sprout slot (our call). If the patch is full it waits for the first sprout tick with a free cell.
- **Its power: sprouting around it** (owner). Every sprout tick, **one of the tick's sprout slots fills every empty cell in the 3×3 around the gourd** (up to 8 pumpkins, team colours chosen as for sprouts), and the tick's other slots sprout as usual anywhere on the patch. Example (owner): with the 3-pumpkin sprout power, one slot fills the gourd's square and the other two sprout elsewhere. Without it, the same: one slot for the square, the other as normal.
  - If the square has no empty cell, that slot sprouts one normal pumpkin elsewhere (our call).
  - The catch-up rule (2× faster under 10 pumpkins) and the sprout timer are unchanged.
  - A tick that brings back a destroyed gourd uses its gourd slot for the gourd, not the fill (our call).
- **Edges** (archive rule): on an edge the square is 5 cells, in a corner 3.
- **Night start** (our call): the gourd starts in the patch's centre cell (row 2, column 3), replacing what the pattern put there. If a grave layout covers the centre, the nearest free cell.
- **Edge cases** (our calls; the owner asked us to handle them):
  - Full patch: nothing sprouts, the fill does nothing; holding the gourd still destroys it (that frees a cell, and the next tick brings it back there or elsewhere).
  - A grave (Grave Riser) may land in the gourd's square; destroying the gourd clears it.
  - Nothing else destroys the gourd: the Hayrick's pitchfork skips it, monsters never reach it, and the Hollow King's column wipe does not apply here.
  - Drops and Emergency Pumpkins never land on its cell (it is occupied).
  - A continued night keeps the gourd where it stood, or brings it back on the first sprout if it was destroyed.
  - It cannot be crushed by accident during a slide: a swipe that starts a hold and moves becomes a slide, as with pumpkins.
- **No levels or upgrades** for the gourd in this release (our call).
- **Art**: from `docs/archive/gourds/entry.js` (`gourdSprite`), baked at patch size; the 3×3 shown as one baked glow tile behind it; a crack-and-pop when destroyed, a sprout puff around it on a fill.

## Part 4: monsters

Reuse world 1's monsters (Ghoul, Bat, Imp, Mossback, Mummy, Flaming Mummy) alongside the new ones (owner). Art for the new ones is in `docs/archive/nightmare-monsters/slime-patch/` and `minibosses-patch-wood/` except the Grave Riser, which needs drawing. Numbers (health, speed, timers) are first guesses for the bot to tune.

- **Cinder Rooster** (owner): crows every 8 s, giving monsters in its lane and the two lanes beside it a 2 s speed burst (archive). A frozen rooster cannot crow (archive). **Leaves a fire tile where it dies** (owner).
- **The Hayrick** (owner: replaces the long "hay monster" idea): a tank. Once a night it throws its pitchfork down its column and pins the first pumpkin there (cannot be slid) for 4 s (archive). The gourd is skipped (our call). Walks onto fire → **Burning Hayrick**.
- **Corn Husker** (archive): its first hit only strips the husk; the bare cob then walks 30% faster. Walks onto fire → **Burning Corn Husker**; a bare cob walking onto fire becomes the charred cob (our call; both drawn). A Burning Husker's husk is stripped by any pumpkin; only the charred cob underneath is Ice-only (our call).
- **Mummy** walking onto fire → **Flaming Mummy** (owner; the world 1 monster, unchanged).
- **Burning versions** (owner): like today's Flaming Mummy, **only Ice kills them**; any other kill knocks one down for 4 s and it rises with 1 health. Ice does not turn them back (owner). They keep their normal ability; the archive's extra burning abilities (burning patches, a burning pin) are dropped so fire has one meaning (our call). A burning Hayrick or Husker sets fire to an ordinary one of its kind within one lane and one tile, as a Flaming Mummy does to Mummies (our call). A level may also spawn burning versions directly.
- **Grave Riser** (owner's idea, new; design our call): a gaunt grave-digger with a lantern and a spade. Slow, 3 health. Every 7 s while on the field it raises a grave on a random **empty** cell of its own column on the patch (no grave if that column has none). Graves stay after it dies. Needs new Toy Plastic art: the strip is drawn early for the owner to see; until approved, N1-6, N1-12 and N1-15 are built and tuned with a stand-in and marked unfinished (our call).
- **Crows** (archive): fast, 1 health, fly like bats down a lane at the wall. They come only from the Strawlord.

### The mini boss: the Strawlord (Nightmare 1-4, owner: "the scarecrow")

Art: `docs/archive/nightmare-monsters/minibosses-patch-wood/` (`strawlord`, `crow`). Fight (our call, adapted from the archive proposal because **bosses never reach the wall**):

- Stands nailed to its post at the back of a lane and takes pumpkin hits; immune to knockback and freeze, can be slowed (like the world bosses). Moves to another lane every 8 s.
- **Phase 1**: every 6 s casts `flock`: 3–5 crows dive down random lanes.
- **Phase 2 at half health**: plays `tear` (it rips off the post) but stays at the back instead of walking down. It flocks every 4 s, and its burning head lights 2 fire tiles each cast.
- The night spawns until it falls (boss rule). Health ~20 to start (tune). The archive's `walk`/`chew` clips are not used.
- Name on screen: "The Strawlord" (our call; the owner called it "the scarecrow", so this name is easy to change).

### The Fallen Gravekeeper (Nightmare 1-16)

**The owner designs this fight.** This release builds 1-16 as a placeholder: its stamp shows "Coming soon" until the owner's design is in. The art is in `docs/archive/fallen-bosses/gravekeeper/`.

## Part 5: the 16 levels (first draft, owner will change any)

Every level has a name and one clear idea. "Fire" = tiles at start + marks. Numbers are left for the bot to tune at the post-5-20 profile; these are the ideas.

| Level | Name | Idea |
|---|---|---|
| N1-1 | **Embers** | Teaches fire tiles: three tiles burning at the start, one fire mark at 50%. Ghouls, Bats, Imps, Mossbacks. Ice locked in. |
| N1-2 | **Cockcrow** | Introduces the Cinder Rooster: its crow speeds the lanes, its death lights a tile. Fire mark at 60%. |
| N1-3 | **Wrapped in Embers** | Mummies walk into fire and become Flaming Mummies. Fire in the middle lanes from the start; two fire marks. |
| N1-4 | **The Strawlord** | Mini boss with crows, Roosters and Mummies. Beating it unlocks the Grave Gourd. |
| N1-5 | **The Grave Gourd** | Gourd tutorial (coach). A heavy grave layout to clear; ghouls only so the lesson is clear, then the night carries on. |
| N1-6 | **The Grave Riser** | Introduces the Grave Riser: graves fill the patch; the gourd clears them. |
| N1-7 | **Haystack** | Introduces the Hayrick (pitchfork pin); one fire mark turns walking Hayricks into Burning Hayricks. |
| N1-8 | **Corn Maze** | Introduces the Corn Husker (husk, fast cob); fire lanes in a zigzag. |
| N1-9 | **Harvest Fire** | Hayricks, Huskers and Mummies together with two fire marks: keep the fire off their path. |
| N1-10 | **Dawn Chorus** | A Rooster swarm: constant speed bursts and a field filling with fire from their deaths. |
| N1-11 | **The Burning Barn** | Three whole lanes ablaze at the start; you must burn through with Ice while hordes come at each mark. |
| N1-12 | **Risen Rows** | Grave Risers plus a grave layout in rows; moving and breaking the gourd is the whole game. |
| N1-13 | **Strawlord Returns** | The Strawlord in phase 2 from the start (stronger), with Hayricks and Roosters. |
| N1-14 | **Burnt Offerings** | Only burning monsters (Flaming Mummies, Burning Hayricks and Huskers spawn burning): an Ice night, like 1-17's "Wrapped and Burning". |
| N1-15 | **Eclipse** | The gauntlet before the boss: every new monster, three fire marks (33%, 66%, 100%), Grave Risers. |
| N1-16 | **The Fallen Gravekeeper** | Owner's fight, to come. |

Intro cards and the nightmare book's Bestiary (our call: the nightmare edition lists the nightmare monsters, the Strawlord and the Fallen Gravekeeper) follow the existing rules: first appearance shows a card; unmet monsters are silhouettes.

## Part 6: balance

- **Target** (owner): much harder than worlds 1–5, for a player who has beaten 5-20. Bot profile: the top `profile()` (level 5, fence 3, all five level-20 powers on), checked at `--offset 0` and `-1`, 3 repeats.
- **Win-rate targets at offset 0** (our call): N1-1 to N1-3 about 70%, N1-4 about 60%, N1-5 to N1-12 about 50%, N1-13 to N1-15 about 35%. Clearly lower at −1.
- **The bot must learn** (our call, needed for honest numbers): flick Ice into a column whose next blocker is fire, avoid flicking other pumpkins into it, slide the gourd towards empty space and destroy it when graves crowd its square. Without that the bot's results would not reflect the release.
- Record runs in `GAME_DESIGN.md` §11.

## Non-goals

- Other nightmare worlds (Releases 5+), the other four gourds and their powers.
- The Fallen Gravekeeper's fight (owner) and the N1-16 reward (owner, later).
- **Urgent Sprout** (from `dump.md`): dropped, since Emergency Pumpkins already exists (owner).
- The `dump.md` rule that crows destroy pumpkins on the patch: crows only dive at walls (our call, from the archive).
- Coffins rising and the coffin man from `dump.md`: not in this release (owner's list replaced them).

## Constraints (from `CLAUDE.md` and `docs/RELEASES.md`)

- Levels are data; the engine holds no level-specific numbers. New level fields (fire at start, fire marks with tiles per mark, gourd on/off, coach) go in `src/data/levels.js`'s schema.
- Shared state only through `src/engine/state.js` setters (fire tiles and the gourd are new state).
- Performance on the owner's phone: every flame, glow and gourd aura is a baked sprite; count canvas calls per frame on a full fire level (extend `check_draw_budget`).
- Original IP, CC0 sounds listed in `assets/sfx/SOURCES.md`, no network, touch targets ≥44 px.
- Rules change → `GAME_DESIGN.md` in the same edit (a new "Nightmare Pumpkin Patch" section), `docs/WORLDS.md` §10 gourd and nightmare notes updated, `docs/RELEASES.md` table updated, `docs/LOOT.md` if any drop changes.
- Save migrations backward-compatible.
- Deploy to the playtest link only when the owner says "deploy".

## Left to the builder

- How the nightmare track is keyed in the save and in level lookups.
- Exact numbers (health, speed, timers, totals, fire counts) through bot runs.
- The tile grid used for fire placement (field rows) and how the bot reads it.
- The Grave Riser's look, within the Toy Plastic rules, shown to the owner as a strip first.
