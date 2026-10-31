# Hallow's End: first levels (6-1 to 6-4) and the Frenzy jukebox

Status: owner's answers in; waiting for the owner's OK (2026-10-31). Branch `w6-hallows-end` only.

## Intent

World 6 (Hallow's End) is a beta the owner plays only through the private playtest artifact. It is never in the store builds. The owner's idea for the world:

- Every monster from worlds 1–5 is back.
- **Every level is custom designed** around the deadliest cross-world mix of monsters and map features (fog, sea, puddles, castle walls, wind, graves). There is no shared world pool that grows level by level, as in worlds 1–5.
- From level 4 on, some levels are **Frenzy** levels: a jukebox drops and monsters keep coming while it stands.
- Boss levels (owner, still thinking): 6-8 Poltergeist + Gravekeeper together, 6-12 Hexwitch + Vampire Count, 6-16 maybe three Twin Tides, 6-20 the Hollow King. **None of these are in this milestone.**

This milestone builds levels 6-1 to 6-4 and the Frenzy jukebox, so the owner can play them on the phone before designing the rest.

## Goals

- World 6 levels 1–4 are playable in a build made with `VITE_W6=1`, with their maps exactly as described below.
- The Frenzy jukebox works as described and is introduced on 6-4.
- Store builds (`npm run build` without the flag) are byte-for-byte the same game as Release 1: five worlds, the "coming soon" Hallow's End sneak peek after 5-20, no World 6 book.

## Non-goals

- Levels 6-5 to 6-20, the two-boss levels, the Hollow King, a level-16 monster or level-20 perk for world 6.
- A faster-pace jukebox (owner: saved for a future jukebox, maybe for nightmare mode; add it to the backlog in `docs/WORLDS.md` §10).
- Tuning beyond "winnable at the expected profile and hard below it" (the owner tunes after playing).
- Publishing. The playtest artifact is updated only when the owner says "deploy".

## Anti-goals

- Anything World 6 leaking into a store build or into `r1-ground-rules`.
- Level-specific numbers in the engine. New behaviour is driven by level fields.
- Per-frame painting or `shadowBlur` for the jukebox or any new prop: bake it.

## Constraints (from the project)

- Follow `docs/WORLD6_BRIEFING.md` and `CLAUDE.md`. Work on `w6-hallows-end` (made from `r1-ground-rules` on 2026-10-31, so it includes the latest performance and audio fixes) and merge `r1-ground-rules` in regularly. Never merge the other way.
- **Safety switch:** World 6 is included only when `import.meta.env.VITE_W6` is set, read in `src/data/worlds/index.js`. With it off, `WORLD_LEVELS` has five worlds. Check what reads `LEVELS` (the 5-20 sneak peek uses `g.n === LEVELS`, Endless Night, the shelf, save migration) and keep the flag-off behaviour unchanged.
- Levels are data in `src/data/worlds/world6.js`; new fields go in the schema in `src/data/levels.js`.
- Docs in sync: `docs/GAME_DESIGN.md` gets the jukebox rule and a World 6 section marked "beta, `VITE_W6` builds only"; `docs/WORLDS.md` §3/§4/§6 rows for World 6 are updated to the owner's new direction; `CLAUDE.md` current state notes the branch and the flag.
- The bot (`tools/balance_bot.py`) needs `profile()` and `UNLOCK` extended past night 100. In World 6 every pumpkin is owned, so the profile is the 5-20 profile (or slightly above).

## World 6 ground rules for these levels

- **Opening (owner, 2026-10-31):** 6-1 opens when **5-20** is beaten (other worlds open after the previous world's level 10). Levels 2–4 open in order. No playtest "unlock all": the owner's playtest save has every level beaten.
- **Pumpkins:** no unlocks. The player picks a team of 5 from everything they own, as in late world 5. Where a level's monsters force a colour (Fire and Ice for the two mummy types), the existing auto-lock rule applies.
- **Monsters (owner):** the plain versions from worlds 1–5, as listed per level, with no modifiers. These levels use no regular monsters (ghouls, imps, bats, brutes), which is where modifiers would apply.
- **Graves:** every level has a hand-placed grave pattern (`gravesLayout`) on the 5×7 patch. The owner wants them to vary between levels.
- **Map art:** a sixth background theme, "Hallow's End", built with the existing `buildBg()` and colours taken from the Hallow's End scene already in the game (`src/engine/render/nightmare/scenes.js`, `'hallow'`). Fog, sea, puddles, castle walls and wind draw as they do in their home worlds.
- **Book:** a Hallow's End storybook on the shelf with short placeholder lore and a bestiary page listing the monsters met so far.

## The Frenzy jukebox (owner's rules)

- On a Frenzy level the jukebox **drops near the end of the night's spawns**. Builder default: once 80% of the level's `total` monsters have spawned.
- It lands at the **far end of the field, opposite the fence** (the top), and stays there: it never walks and never chews walls.
- It is the **size of the Loot Sack** (two lanes wide, same hit box) with the **Loot Sack's health rule**: `SACK.hpBase + SACK.hpPerWorld × (world − 1)`, which is 30 in World 6. Lanes are picked at random.
- **Only pumpkins destroy it.** Builder default: tools (bombs, fireworks and so on) do not hurt it. A pumpkin hits the first thing in its column, so monsters in its two lanes shield it.
- **While it stands, monsters keep coming at the level's normal pace**, past the level's `total`. The night is won only when the jukebox is destroyed and every remaining monster is dead.
- It plays its own music while it stands: the owner's `frenzy.mp3` (owner OK'd committing it on this branch; move it out of `drafts/`). Encode it into a separate module loaded only in `VITE_W6` builds, so the store bundle and `src/data/music.js` stay unchanged. The night's track comes back after the jukebox falls. Per the music rule, play it from 0:00.
- First appearance (6-4) shows an intro card, like new monsters.
- Level field: `frenzy: true` (plus optional `frenzyAt` and `frenzyHp` for later tuning).

## Levels

The field is about 5 tile rows tall on a regular phone and taller on long phones, so rows below are described as parts of the field; build them as fractions of the field, not fixed tile counts, so each phone sees the same layout. "Top" is where monsters enter, "fence" is the bottom, next to the walls.

### 6-1 "Attack and Defend"

- **Fog:** a band across the middle three rows of the field.
- **Puddles:** at fixed spots inside the fog band (builder: 3 puddles in different lanes). **Puddle Crawlers and Shell Turtles** come out of them, unseen until they leave the fog. This needs a new level field for fixed puddle positions (`puddlesLayout`, like `castlesLayout`), since puddles are placed at random today.
- **From the top:** Shield Knights and Skeleton Archers.
- **Castle walls:** a full row (all 7 lanes) just in front of the fence. They keep today's rules (owner): they block the player's pumpkins until broken, and monsters and arrows pass through them. The player has to break out before they can hit anything behind.
- **Graves:** an "n" (an arch) in the middle of the patch (rows 0–4, columns 0–6):
  ```
  . . . . . . .
  . . X X X . .
  . . X . X . .
  . . X . X . .
  . . . . . . .
  ```

### 6-2 "Timing!"

- **Sea:** covers the top half of the field (`shore`). **Fogwalkers, Witches, Mirror Sprites and Shield Knights** all come out of the sea at the shoreline, as on today's sea levels (owner). `shore` is counted in tile rows; add a way to give it as a fraction of the field so every phone gets half.
- **Graves:** a new pattern (builder's choice, different from 6-1).

### 6-3 "Fire and Ice, Round 2"

- **Monsters:** Mummies and Flaming Mummies. The player needs Fire and Ice (auto-locked).
- **Fog:** everything except the two rows nearest the fence.
- **Castle walls:** a full row across the middle of the field, hidden under the fog.
- **Wind:** the Witchwood gusts.
- **Graves:** the same pattern as 6-2.

### 6-4 "A Revisit" (Frenzy)

- **Monsters:** Flaming Mummies, Plague Doctors, Witches, Vampires, Bulwark Knights and Shell Turtles.
- **Puddles:** a few scattered at random for the turtles to rise from.
- **Castle walls:** a full row across the middle of the field, with one row of fog directly above it and one directly below.
- **Wind:** the Witchwood gusts.
- **Graves:** a new pattern (builder's choice).
- **Frenzy:** yes, the first jukebox.

## Left to the builder

- Monster counts, spawn interval, speed and castle health per level: start near late world 5 and tune with the bot (3 repeats, `--offset 0` and `--offset -1`) to "winnable at the profile, hard below it". Record runs in `GAME_DESIGN.md`.
- Grave patterns for 6-2/6-3 and 6-4, and the exact puddle spots in 6-1.
- Jukebox art (Toy Plastic, baked, drawn in code), its hit and break effects and sounds from the existing CC0 bank.
- Quests for the four levels (`src/data/questTable.js`), checked against each level's monster count.
- Level names as written above.
- Gameplay music for World 6 nights: reuse an existing track until the owner supplies one.
- The jukebox drop reward: none beyond its normal kill roll.

## Owner's answers (2026-10-31)

1. Castle walls keep today's rules in World 6.
2. On 6-2 monsters surface at the shoreline, as today.
3. No modifiers.
4. World 6 opens after 5-20; no playtest unlock.
5. Use and commit `frenzy.mp3` on this branch.
