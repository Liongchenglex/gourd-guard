# Nightmare monsters (archive, 2026-11-02)

New monsters the owner asked for, for the nightmare levels. Open `index.html` (rebuilt by `python3 docs/archive/nightmare-monsters/make_index.py`) for the overview, or any folder's `preview.html` for that group animated with every clip and a game-size row. Nothing here is in the game.

| Folder | Monsters | Owner's request |
|---|---|---|
| `knights/` | Storm Lancer (jousting knight; trots, then charges in bursts), Storm Marshal (commander; rallies nearby knights) | "a jousting knight monster, a commander knight monster, both on a horse" |
| `vampires-doctor/` | Blood Glutton, Bat Bride (vampire variants); Rot Doctor (plague doctor variant) | "2 different versions of the current vampire, 1 different version of the plague doctor" |
| `witches-mirror/` | Ash Crone, Blood Coven Witch (witch variants); Triptych Sprite with a baked 3-lane reflect barrier | "2 different versions of the witch; enhanced mirror sprite: a barrier that reflects 3 columns instead of 1" |
| `kraken-pirate/` | The Kraken (body, tentacle, cursed-anchor projectile), Drowned Pirate | "a kraken: surfaces and dives in intervals; when it dives its tentacles are up and throw projectiles; pirate monster" |
| `riders/` | Wisp Rider 2 (Comet Rider: imp on a long ghostfire serpent that dashes), Turtle Rider (imp on a saddled Shell Turtle that hides; the imp throws rotten pumpkins, with a separate fly/splat sprite) | "wisp rider 2 rides a long wisp that shoots down the lane with the imp; an imp riding on a turtle" |
| `coffin/` | Casket Jack (walking pumpkin-wood coffin that summons mummies) and its field coffin | "a monster that summons mummies, fitting for pumpkin patch, something to do with coffins" |
| `slime-patch/` | Blood Splitter Slime and its Bloodlet, Hayrick (hay monster) and Burning Hayrick, Cinder Rooster, Corn Husker and Burning Corn Husker | "blood splitter slime; more pumpkin patch monsters, like a hay monster" (rooster and husker are design proposals) |
| `spirits/` | The Reaper (glides, reaps 3 walls), Mini Poltergeist (orbiting junk, tosses it), Fogwalker 2 (lantern-cage chest, exhales fog) | "a reaper monster, a mini poltergeist, fog walker 2" |
| `crows-cart/` | Swooping Crows (flock of 3), Lobber Cart (goblin catapult) with its net projectile and a netted pumpkin | "crows that swoop down the lane; a lobber cart that lobs nets that lock pumpkins from the back of the map" |
| `castle-walls/` | Gatehouse (gated wall) and Archer Tower, composited on a real frame of night 4-15 | "bulky castle wall with gates, tall castle walls with archers at the top; show how they look in the map" |
| `minibosses-hollow-keep/` | Mini bosses: the Lamplighter (Foggy Hollow), the Siege Tower (Crumbling Keep) | "every world could have a mini boss" (the owner took Claude's picks for now) |
| `minibosses-patch-wood/` | Mini bosses: the Strawlord (Pumpkin Patch), the Treant and its roots (Witchwood) | "witchwood would be a treant that stands at the back and summons roots"; the Kraken (`kraken-pirate/`) is Drowned Marsh's |

**Shared notes.** Each drawing file uses the game's painter through relative imports (read only) and exports registry-style entries; variants of existing monsters copy the game function so the no-variant path draws the game look. Gameplay lines in each preview are proposals, not rules. Bringing any of them in needs its own registry key, an entry in `src/data/monsters.js`, and engine hints for its special clip (charge, command, summon, surface/dive/throw, shoot, split, toss, crow, shed); each folder's preview notes which.
