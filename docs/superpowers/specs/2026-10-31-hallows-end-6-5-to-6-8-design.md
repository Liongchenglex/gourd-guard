# Hallow's End 6-5 to 6-8, the double boss and Emergency Pumpkins

Status: reviewed by a builder; waiting for the owner's OK (2026-10-31). Branch `w6-hallows-end` only, behind `VITE_W6`, like 6-1 to 6-4 (`2026-10-31-hallows-end-first-levels-design.md`). The store version is not touched (owner).

## Intent

The owner's next four World 6 levels. Each level mixes monsters across worlds. 6-5 to 6-7 are Frenzy levels. 6-8 is the first level with two bosses at once. 6-8 also introduces a new tool, Emergency Pumpkins, that rescues a jammed patch. The owner said 6-4's difficulty is right; these levels should sit around that level of pressure.

## Goals

- 6-5 to 6-8 are playable in `VITE_W6` builds, with the monsters, maps and Frenzy as below.
- 6-8 runs two bosses at once. Monsters keep coming until both fall.
- Emergency Pumpkins works as a tool (tray, shop and drops) once 6-8 introduces it.
- Then deploy to the playtest link together with the 6-1 Puddle Diver change (owner: "build 6-5 to 6-8 and deploy with 6-1").

## Non-goals

- Levels 6-9 onward, the 6-12 / 6-16 / 6-20 bosses and the Hollow King.
- Any change to the store version or `r1-ground-rules`.
- Boss chests or costumes for 6-8. It is not a level 10 or 20, and today chests come only from those levels.

## Anti-goals

- Level-specific numbers in the engine.
- Per-frame painting or `shadowBlur` (the tool icon and effect are baked).
- Breaking the one-boss levels in worlds 1–5 while adding the second boss.

## Levels (owner's design; *(my call)* marks the builder's choices)

All levels use theme 5 (the Hallow's End map), plain monsters with no modifiers, and fractions of the field.

### 6-5 "Field Hospital" (Frenzy)
- Monsters: **Plague Doctors and Bulwark Knights** only (owner: no brutes). The Doctors heal and the Bulwarks double health inside their auras, so the two protect each other.
- Map: castle walls down both outer lanes (lanes 0 and 6, three walls each at 30/50/70% like world 4's "The Flanks"), graves in a ring *(my call: the 8 cells around the patch centre)*.
- Frenzy: yes (burst, then pairs, as in 6-4).

### 6-6 "Field Spell" (Frenzy) *(name: my suggestion from the owner's "field caster / field spell")*
- Same as 6-5 with **Witches in place of the Doctors**: Witches and Bulwark Knights.
- Same castle walls and the same Frenzy; a different grave shape *(my call: a zig-zag across rows 1–2)*.

### 6-7 "Iron Rush" (Frenzy) *(name: my suggestion; the owner wants it named for the monsters: fast ones, strengthened by Bulwarks)*
- Monsters: **Vampires, Wisp Riders, Drunk Sailors and Bulwark Knights**.
- Map: fog down the two outer lanes (`fogCols:[0, 6]`) and castle walls *(my call: a full row across the middle at 50%, like 6-4)*.
- Frenzy: yes.

### 6-8 "Double Trouble" (boss level)
- **The Poltergeist and the Gravekeeper at the same time**, each with its first-form (level-10) kit: the Gravekeeper teleports between lanes and raises ghouls, and the Poltergeist drifts between lanes and swaps two of your pumpkins. Monsters keep coming until **both** have fallen.
- Their minions (the level's monster pool): **Flaming Mummies, Mummies, Fogwalkers, Plague Doctors and Wisp Riders**. The Gravekeeper's own raised ghouls are part of its kit and still appear.
- Both bosses arrive together at 40% of the night, like a single boss today. *(My call:* each with less health than its level-10 self, `bossHpMul` per level, tuned with the bot.)
- Fire and Ice are both locked into the team (both mummy types).
- No Frenzy. No castle walls or fog *(my call)*. A grave pattern *(my call)*.
- Plague Doctors heal the bosses, as they already do on every level today *(my call: unlike the jukebox, which the owner made immune)*.
- Built on the Twin Tides pattern (two linked boss bodies); the combined boss bar adds up both. A boss level is any level with `boss` or `bosses` (so the 1% kill chest stays off, as on boss levels). A continued night stores each boss's kind and health: a fallen boss stays fallen, a living one comes back with the health it had.
- Introduces **Emergency Pumpkins** (one free, like other tools on their first level).

## Emergency Pumpkins (new tool, owner)
- Tap the tool in the tray: **9 pumpkins** drop into empty cells of the patch, in random colours from the player's team (owner: 9).
- If fewer than 9 cells are empty, it fills what it can. If the patch is full, the tap does nothing and the tool is not used up *(my call)*.
- Like every consumable *(my call)*: `TOOL_COST` (300 coins, the owner's price for every tool), carry up to 5, one free on 6-8, shown locked in the tray until 6-8, droppable from kills after that. Because it is introduced in World 6, it exists only in `VITE_W6` builds.
- Art: a toy-plastic icon (a wicker basket of pumpkins) baked like the other tool icons; on use, the pumpkins pop in with the usual sprout pop.
- The tray shows every tool; the eighth button appears only in `VITE_W6` builds, and the tray must still fit on one row on a phone.

## Constraints
- Same as the first-levels spec: branch, flag, levels as data, docs in sync (`GAME_DESIGN.md`, `WORLDS.md`, `LOOT.md` for the new tool), bot runs recorded, checks in `tools/w6_check.py` on both builds.
- The second boss must be data: e.g. a level field `bosses:['poltergeist', 'gravekeeper']` alongside the existing single `boss`; one-boss levels unchanged.

## Left to the builder
- Monster counts, pacing and boss health: start near 6-4 (24 monsters, 3.0 s), tune with the bot, and record results. The owner tunes from play.
- Grave shapes marked *(my call)*, the tool icon, the tool's sound (existing CC0 bank) and quests for the four levels.
- How the HUD shows two boss health bars, matching the existing boss bar.
- Music: the boss track when the bosses arrive, as on boss levels today.
