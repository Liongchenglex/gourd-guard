# Release 3: the Beige pumpkin and Hallow's End 6-17 to 6-20 (design)

Owner: designed in conversation on 2026-11-02. Release plan: `docs/RELEASES.md` (Release 3 = Hallow's End 6-17 to 6-20 plus the Beige pumpkin). Lines marked **(our call)** were proposed by Claude and accepted by the owner without change ("ok all good for now", "yes and yes"), or settled by Claude as minor; everything else is the owner's.

## Intent

Finish Hallow's End. The owner wants a new pumpkin that rewards kills with a lingering area effect (Beige glue), three more hand-designed levels that each push one World 6 idea further (hidden divers, monsters that both heal, two Frenzy rounds), and a final boss, the Hollow King, whose fight is a tour of the five world bosses in his own body.

## Hard rule: everything here is Release 3

Every piece of this work ships in Release 3 and must be absent from store builds below it.
- Levels 6-17 to 6-20 are already tagged 3 by `releaseOf()` in `src/data/worlds/world6.js`.
- Everything else is gated `__RELEASE__ >= 3` directly in the expression (see `docs/RELEASES.md` "How tagging works"): the Beige pumpkin (type data, picker, shop, unlock, upgrade costs, art, glue), the Hollow King (monster data, boss logic, art registration, banners, intro cards, book page change), the 6-19 mid-night jukebox mark, and the two-chest reward.
- `VITE_RELEASE=2 npm run build` must contain none of it; `npm run build` (Release 1) none of it nor Release 2. `tools/w6_check.py` gains Release 3 presence checks (`--expect on`) and absence checks for a Release 2 build (a new expectation level, e.g. `--expect r2`, is the builder's choice).

## Part 1: the Beige pumpkin

**Getting it.** Bought with **50 seeds** once **6-16** has been beaten (our call on the gate), the same way Paint is bought after 5-20 (`PAINT_UNLOCK`, `save.paintOwned`, `openLoadout`/shop in `src/ui/screens.js`). Before the gate the picker shows it locked with a line saying which level opens it.

**Upgrades** (owner): level 1→2 **5,000 coins**, 2→3 **10,000 coins**, 3→4 **50 seeds**, 4→5 **75 seeds**. Lives in `UPGRADE_COST` (`src/data/economy.js`); update `docs/LOOT.md` if it lists costs.

**Hit power**: the usual `POWER` table, 1 / 1 / 1.5 / 1.5 / 2. Knockback: the usual `KB_CHANCE` (our call).

**Glue.** When a Beige pumpkin's hit kills a monster, a patch of beige glue is laid on the field where the monster died.
- A "tile" is one field cell: one lane wide and one tile height (`CS`) tall, on the same grid Black's splash uses. The centre tile is the one containing the dead monster's position.
- **Shape by level** (owner): levels 1–2 one tile; levels 3–4 three tiles across (centre, left, right); level 5 a plus (centre, left, right, above, below). Tiles that would fall outside the field are dropped (our call).
- **Duration by level** (owner): 1, 2, 3, 4, 5 seconds.
- **No stacking** (owner): a tile that already has glue gets nothing from a new kill. Its timer is not refreshed and it gets no stronger (our call: refreshing counts as stacking). In a 3-tile or plus shape, only the tiles without glue are laid.
- **Effect** (owner): a monster inside glue is slowed and takes **0.3 damage every 1 s** (Fire's `BURN_EVERY` rhythm). Slow is half speed, Ice's slow (our call); glue and Ice slow do not multiply (our call). Damage is the same at every level; level changes only duration and shape (our call).
- Affects every monster that overlaps a glued tile, bosses included, flying ones included (our call). The Loot Sack and the jukebox are excluded, as they are from other effects.
- Glue damage is non-pumpkin damage for mummy rules: it cannot finish a Mummy or Flaming Mummy (only Fire can) (our call). A kill by glue does not lay new glue (only a Beige pumpkin's hit does) (our call).
- What lays glue: a kill by the Beige pumpkin's own hit. A Beige pumpkin launched as part of a Paint bunch or rainbow-joined bunch still counts as Beige.
- Visual: a flat beige, slightly glossy splat on the tile, fading out over its last 0.5 s, drawn under monsters. **Baked sprite, blitted** (never paint per frame, `CLAUDE.md` performance rule).
- Glue is cleared at the end of the night and is not saved by "continue night".

**Look and words.** Beige body (a warm sand/oat colour), Toy Plastic like the others, with a glue-drip detail; its own pumpkin lore line and picker detail text built from `lvStats` ("leaves glue on a kill: slows and hurts for 0.3 a second, lasts N s, 1 tile / 3 across / a plus"). Add it to the pumpkin tables in `docs/WORLDS.md` §5 / `docs/GAME_DESIGN.md`.

**Not in this release** (our call): no Beige Wardrobe skin (the skins list must simply skip Beige, never show an empty slot or break); costumes' hit effects must work on it as on any colour; it can be taken into Endless Night like any owned pumpkin; no new quests.

**Balance target** (our call): Beige is optional, so 6-17 to 6-20 must be winnable without it; the bot does not play Beige or glue. The owner tunes from their own play.

**Save safety.** Existing saves (type indices in loadouts, `save.lv` by key) must keep working when the type is added; the builder picks how (e.g. append the type rather than shift Rainbow's index).

## Part 2: levels 6-17 to 6-19

General: hand-designed like 6-1 to 6-16, data in `src/data/worlds/world6.js`, no level-specific numbers in the engine. Each level gets a **new grave arrangement not used anywhere else in Hallow's End**: the owner asked for creative shapes (our call on the shapes, e.g. a spiral, a crescent moon, a crown, an hourglass). Totals, intervals and wind follow the 6-13 to 6-16 pattern (around 22–24 monsters, interval ~3.0, witch wind every 22 s, Frenzy), bot-checked, then tuned from the owner's play.

**6-17** (name: our call)
- Monsters: Shield Knights (`knight`), Mirror Sprites (`mirror`, the owner's "fairies") and Puddle Divers (`diver`).
- Fog over 80% of the field: the top 80% (`fog:[[0, 0.8]]`), so only the strip in front of the fence is clear (our call on which 80%).
- Tide at 50%: `shoreFrac:0.5` with the sea on. Divers lurk in the sea and in puddles, hidden under the fog.
- Frenzy on, witch wind.

**6-18** (name: our call): "both monsters heal"
- Monsters: Plague Doctors (`doctor`) and Vampires (`vampire`).
- Fog over 80%, as 6-17.
- "A full map of castle walls": **three rows of castle walls across the field at about 0.3, 0.5 and 0.7** (owner confirmed). Each row blocks pumpkins until broken.
- Frenzy on, witch wind.

**6-19 "A Revisit 2"**
- Same as 6-4 "A Revisit": Flaming Mummy, Fogwalker, Witch, Bulwark Knight, Shell Turtle; castle row at 0.5, puddles, witch wind. New graves.
- **Two Frenzy rounds** (owner): the first jukebox drops at **50%** of the night's spawns; the second at **100%**.
- While the first jukebox stands, the usual Frenzy rules run (a burst, then pairs). Those Frenzy monsters do not count toward the night's total, so the progress bar holds at 50% until the jukebox is smashed (our call on the mechanism: it is what "only after that the level continues with normal spawn" needs).
- **Spawn bar mark** (owner): the HUD progress bar shows a jukebox mark at 50%; it glows/pulses while that jukebox is being fought and dims (done) once it is smashed. A mark at 100% for the second one too (our call).
- After the first jukebox falls: back to the world's music, normal spawning resumes until the total, then the second jukebox drops and plays out as on every Frenzy level. The night is won when everything, both jukeboxes included, is down.
- Level data gets a general field for jukebox drop points (e.g. `frenzyAt:[0.5, 1]`), not a 6-19 special case. "Continue night" restores which jukeboxes are done.

## Part 3: 6-20, the Hollow King

**Art.** The archived Hollow King (`docs/archive/hollow-king/hollowking.js`, already copied to `src/engine/render/chars/hollowking.js` for the book silhouette). 6-20 uses the **full form** (`variant:'form2'`) for the original. The **world boss forms** are the Hollow King himself in the five stage colours the archive already draws (`stage` 0–4): green, pale blue, violet, crimson, teal (owner: "world boss form of the hallow king himself (different colours)"). Each colour needs its own baked atlas or a baked tint; nothing per frame.

**Shape of the fight** (owner)
- Five phases. At the start of each phase he splits: the **original** stays, and a **world boss form** appears in another lane.
- While the world boss form is alive, the original **can be hit but takes no damage**: pumpkins stop on him as on any monster (they are used up), show a "no damage" tell (our call: a dull clink and a grey spark), and do nothing.
- Killing the world boss form makes the original take damage again. When he has lost that phase's share of his health, the next phase starts with a new split.
- Phase order and kits (our call, the archive's story order): 1 Gravekeeper (green), 2 Poltergeist (pale blue), 3 Hexwitch (violet), 4 Vampire Count (crimson), 5 Twin Tides (teal). Each world boss form uses that boss's own powers from its level-10 kit, and its sounds and tells, so the player recognises it. Twin Tides form: it lobs tide bolts at walls; it is one body, with no twin and no revive window (our call: the revive rule needs a pair).
- After the fifth world boss form falls, the original is open until he dies.
- **Immune means all damage** (our call, from "no damage done"): while a world boss form lives, nothing hurts the original: pumpkin hits, Fire burn, glue, Deep Blue lightning, Black splash, landmines, Firework, Emergency Pumpkins. One shared damage gate. Splash or lightning that reaches the world boss form does hurt the form.
- **Leftovers** (our call): what a world boss form made stays after it dies, exactly as when that boss dies on its own level: raised castle walls, monsters it summoned or hexed into chameleons; hex zones run out on their own timer.

**Health** (our call, to tune with the bot and the owner)
- Original: 60, five phases of 12. The phase threshold triggers the next split (damage beyond it is lost, so one big hit cannot skip a phase).
- World boss forms: that boss's level-10 health (Gravekeeper 15, Poltergeist 20, Hexwitch 22, Vampire Count 24, Twin Tides 14).
- Boss bar: shows the original's health, with the world boss form's health shown while it is up (exact presentation is the builder's choice; it must be readable on a phone).

**The original's own powers** (owner; timing our call): about every 12 s he uses one, in rotation, in every phase, including while immune:
- **Column wipe**: destroys every pumpkin in one column of the player's patch (a telegraph first: the column glows for ~1 s).
- **Fence smash**: the fence of **the column he stands in** loses **half its full health** in one blow, but never drops below 1 health from the smash (owner, 2026-11-02, accepting Claude's suggestion). A full fence can't be wiped out by bad luck.
- **Summon**: a burst of 4–6 revisit monsters at once.

**Rules shared with other bosses**: he holds (around 0.3 of the field, our call), never reaches the wall; monsters keep coming until he dies. Minions: the revisit monsters (Flaming Mummy, Fogwalker, Witch, Bulwark Knight, Shell Turtle). Frenzy: none on 6-20 (our call; the owner did not ask for one).

**Map** (our call): no fog over the boss lanes so the colour tells read; a new grave arrangement; witch wind.

**Rewards** (owner): the level-20 boss chest as usual, **with a chance of a second boss chest** (50%, our call). Boss items: there is no Hollow King costume in this release, so boss-item prizes fall back to coins as the existing fallback does (our call). No new level-20 perk in this release (our call). Book page: the "???" silhouette is replaced by his real name and art once Release 3 is in the build (our call). Intro card and banners: "The Hollow King" with one line per phase naming the borrowed boss.

**Continue night**: restores the phase, the original's health and the current world boss form (or its absence).

## Non-goals

- No Hollow King costume, no world 6 perk, no nightmare (Fallen) Hollow King: archive only.
- No changes to Release 1 or Release 2 behaviour in their builds.
- No rebalancing of other pumpkins or levels.

## Constraints (from `CLAUDE.md` and `docs/RELEASES.md`)

- Levels are data; engine free of level numbers. Rule changes go into `docs/GAME_DESIGN.md` in the same edit.
- Bake every sprite; no `S.part` or `shadowBlur` per frame.
- Offline, original IP, test hook only with `?test`.
- Stage files by name; never commit `dump.md`, `monetization.md`, `questdump.md`, `assets/music/drafts/*`.
- Deploy to the playtest link only when the owner says "deploy".

## Left to the builder

Code structure, field names, sprite sizes, exact glue colour, the no-damage tell, boss-bar layout, the level names and grave shapes (proposed to the owner at handoff), bot-backed totals and intervals.
