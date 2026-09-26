# Gourd Guard: Audio Design

**Status: sound effects implemented (2026-09-26) as synthesised Web Audio in `src/engine/audio.js`, following the tables below.** Every entry is a small recipe built from tones and filtered noise, so there are no audio files, licences or downloads. If recorded sounds are wanted later, the same hooks (`SFX.pumpkinHit`, `SFX.monsterHit`, `SFX.monsterDie`, `SFX.monsterAct`, `SFX.bossSfx`, `SFX.tool`, `SFX.sprout`, `SFX.match`…) can play files instead. Music is not built yet (§5). Fog and sea ambience loops are not built yet either.

Conventions: every hit has a **pumpkin layer** (what was thrown) and a **monster layer** (what was hit), played together. Kills add a short death sound. Variants (Bog Ghoul, Swift Bat…) reuse their base monster's sound, pitched a little by modifier: Swift higher, Armoured and Hungry lower, Stubborn unchanged.

## 1. Pumpkins

| Pumpkin | On hitting a monster | Other moments |
|---|---|---|
| Green | Neutral pumpkin thump: soft, round, short | – |
| Yellow | Neutral thump with a gold coin chime on top | Kill: coin cascade scaled to the multiplier |
| Ice | Crystalline chime with a frosty shatter tail | Freeze: deeper glassy crack |
| Fire | Whoosh into a crackle | Burn ticks: tiny crackles; a Mummy finished by fire: dry flare |
| Grey | Neutral thump plus a faint metallic "shing" as it passes through | Each pierced monster repeats the shing quieter |
| Purple | Neutral thump | Spawn: pop and sparkle as the new pumpkin lands |
| White | Neutral thump | Return on a miss: reversed whoosh and a soft landing |
| Black | Heavy, low explosive boom | Splash hits: muffled sub-thuds |
| Deep Blue | Lightning crack and zap | Chain strikes: shorter zaps, each a little quieter |
| Pink | Neutral thump | Wall heal: warm hammer tap and a rising chime, clearly audible |
| Turquoise | Light, high, quick tap | – |
| Brown | Small: Turquoise's light tap. Medium: Green's thump. Big: rich, heavy thud with a low body | Growth stage change: soft creak |
| Rainbow | The bunch colour's sound plus a tiny sparkle | – |
| Any | Miss (flies off the top): soft whoosh fading out | Launch: whoosh, pitched up with bunch size; bunch of 5+: extra punch |

## 2. Monsters (hit, death, and their own actions)

| Monster | When hit | Death | Own actions |
|---|---|---|---|
| Ghoul | Guttural zombie groan | Longer groan, fading | Chewing: wet gnaw |
| Bat | Squeak with a wing flutter | Squeak cut short | – |
| Imp | Sharp yelp or hiss | Shriek | Hop: little scrape |
| Mossback | Deep grunt and a thud | Heavy slump | – |
| Mummy | Dry rasp with a cloth thump | Crumple (collapse); rise: dusty shuffle | – |
| Flaming Mummy | Rasp plus a crackle | Hiss of steam (Ice kill) | Setting a mummy alight: flare |
| Wisp, Wraith, Fogwalker | Cloth being struck: a soft whip and flap | Whisper fading | Wraith vanish and return: breathy whoosh; Fogwalker: low mist hiss while walking |
| Wisp Rider | Cloth thump; carrier breaks: cloth rip and imp yelp | Shriek | – |
| Plague Doctor | Muffled cough through the mask | Cough and a glass-jar smash | Heal pulse: soft descending chime |
| Shield Knight | Blocked: metallic clang. Open: grunt behind metal | Armour crashing down | March: heavy footsteps |
| Gargoyle | Stone crack | Stone shatter | – |
| Gargoyle Hauler | Grunt with a rope creak | Grunt | Freed: rope snap and quick footsteps |
| Skeleton Archer | Bone rattle | Bones scattering | Shoot: bow twang; arrow landing: thunk |
| Vampire | Hiss | Scream to ash | Heal: soft heartbeat |
| Bulwark Knight | Heavy armour clank | Great crash | Aura: low steady hum |
| Puddle Crawler | Wet slap | Splash | Rise from puddle: bubbling splash |
| Drunk Sailor | Hiccup | Burp and a thud | Stagger: bottle clink |
| Puddle Diver | Wet slap | Gurgle | Surface: splash; submerge: plop; bolt: water whip |
| Splitter Slime | Squelch | Double pop as it splits | – |
| Blob | Small squelch | Tiny pop | – |
| Chameleon | Lizard chirp; wrong colour: dull "tock" | Chirp cut off | – |
| Reverse Chameleon | Lizard chirp; immune colour: dull "tock" | Chirp cut off | – |
| Mirror Sprite | Glass tink; reflecting: sharp mirror "ping" | Glass shatter | Mirror up: rising glint |
| Witch | Short cackle | Cackle cut off and a hat-flop | Hex: magic shimmer with a brief "haha" |
| Shell Turtle | Hollow knock on the shell | Shell crack | Rise from puddle: heavy splash |

## 3. Bosses

| Boss | Arrives | Casts | Hit | Dies |
|---|---|---|---|---|
| The Gravekeeper | Shovel scrape and a slow bell toll | Teleport: whoosh with falling dirt. Summon: grave bursting open. Shove (form 2): dragging chains | Dull thud and a low grunt | Bell toll, shovel clatter, body collapsing |
| The Poltergeist | Rising ghostly wail | Swap: whoosh and a chime per pumpkin. Repaint: paint splash. Drift: whisper | Ethereal "oof" with reverb | Long wail fading to silence |
| The Hexwitch | **Witch laugh** (owner) | **Hex: the magic "turning things" shimmer with a brief "haha" at the same time. Hex zone: a brief "hehe" with a low rumble** (owner). Drift: broom swish | Yelp | Cackle cut short, broom crash |
| The Vampire Count | Organ chord with a bat flutter | Lane burst: bat swarm. Bat call: flutter. Wall raise: stone grinding. Trance: heartbeat loop; each counted hit: glass tick; trance broken: glass shatter | Hiss | Scream, then ash crumbling |
| The Twin Tides | Big splash and a double roar | Bolt: tail splash and a water whip. One down: splash and gurgle. Revive: water rising | Wet slap with a growl | Both: double roar and rolling waves |

## 4. Game and interface

| Moment | Sound |
|---|---|
| Slide, push | Soft slide; push adds a second, heavier slide |
| Bunch lights up | Rising sparkle, bigger for bigger bunches; combo: stacked |
| Smash (hold) | Ring fill: rising tick; smash: wet splat |
| Sprout | Soft pop, two quick pops for two |
| Drop collect | Pluck |
| Tool use | Repair: hammer strikes. Firework: launch and burst. Grave buster: dig and crack. Lantern: match strike and glow. Landmine: click on placing, boom on trigger. Bomb: fuse and blast. Scarecrow: post driven in |
| Wall hit / wall down / breach | Wood crack; wood collapse; alarm thump while a monster is walking in |
| Wind gust | Leaves rustling during the warning, a gust rush on the shift |
| Fog | Soft breathing ambience while a bank is on screen; lantern lit: crackle |
| Sea | Lapping waves ambience on shore levels |
| Level start / win / lose | Owl hoot and a chord; short fanfare; low tolling |
| Coins, perk unlock, star | Coin tick; bright rising jingle; ding |
| Menus | Organic, PvZ 2 style (owner): wooden click on any button, a water bloop for Start, Next and Got it, a page turn for Back and Quit, a plop on level tiles, a bubble pop picking a pumpkin and a low plop dropping it, a dull wooden thunk on a locked pick |
| Chewing the wall | A clearly audible bite about three times a second while any monster chews: wood being gnawed by default, metal or stone scraping for knights, bulwarks and gargoyles, wet chomps for slimes, blobs, crawlers and divers, a hollow knock for turtles, quick nibbles for bats |

## 5. Music (to design after the effects)

One loop per world plus a boss variant that layers on top of it, with per-world instrumentation to match the theme. Separate music and effects sliders in the pause menu; music ducks under banners and boss arrivals.

**Mix (2026-09-26).** The first synthesised pass measured peaks of 0.02–0.05 (about −30 dBFS) and the monster layer played at the same instant as the pumpkin thump, so on a phone only the thump was heard. Now every primitive is mixed ×5 hotter into a limiter (compressor −14 dB, ratio 10), the monster hit and death layers play 45–60 ms after the impact at 1.5–1.6× gain, and hit, death and chew sounds carry ±5–8% random detune. Measured peaks after: 0.5–0.75 for single sounds, 0.75 for a thump plus ghoul together.

## Sample bank (2026-09-26)

The owner asked for the PvZ 2 texture rather than chiptune, so every hit, death, tool, wall and menu sound is now a recorded clip; the synthesiser remains for musical accents (bunch chords, level start, the alarm) and as a fallback while the bank decodes.

- **Sources.** All clips are CC0 (public domain): Freesound recordings found with the CC0 licence filter and Kenney's Impact, Interface and RPG packs. Every clip is credited in `assets/sfx/SOURCES.md` even though CC0 requires no attribution. Splice was considered first but the connected account has no plan; the manifest of 63 Splice picks is kept in `assets/sfx/manifest.tsv` in case the owner subscribes later for hero sounds.
- **Pipeline.** `tools/sfx_source.py` searches Freesound by category and downloads HQ previews to `assets/sfx/raw/`; `tools/sfx_build.py` cuts, drops leading silence, peak-normalises to −1 dBFS, fades and encodes each variant to 32 kHz mono MP3 at 48 kbps, then writes the bank as base64 data URIs to `src/data/sfxbank.js` (114 clips, about 0.6 MB of MP3, 0.8 MB of JS). The bank decodes once on the first user gesture; until then the synth plays.
- **Playback.** `sample(key, gain, {rate, delay, jit, i})` in `src/engine/audio.js` picks a random variant (never the same one twice in a row), applies ±5% random speed plus the hit layer's detune, and mixes into the same limiter as the synth. Peak-normalised clips at gain 0.5–0.9 land at 0.6–0.9 measured peak, level with the synth.
- **Mapping.** Bank keys are grouped: pumpkin impacts (thud, tap, heavy, ice, fire, boom, zap, pop, sparkle, coin), monster voices (ghoul, bat, imp, giant, ghost, human, witch, hiss, cathiss, slime), materials (clank, metal, stonebreak, glass, splash, bubbles, knock, cloth, wood, woodbreak, crunch), bosses (roar, roarbig, roarfar, warp, teleport, darkcast, seabark, seabig), tools (rocket, torch, creak, explode, hammer, arrow, dig, wind, heal) and interface (uitap, uigo, uiback, uilevel, uipick, uiunpick, uibad, uistar, win, lose). The `BANK` table in `tools/sfx_build.py` is the single place to swap a recording.

**Owner tuning (2026-09-26, after the first sample pass).** Ghost deaths are a soft moan with no scream (gain 0.35). Bats are just a squeak, ghouls are short cartoon grunts and cute monster mumbles pitched up a little, imps are soft giggles, chameleons a cute hiccup; all three are shorter clips. Boss casts got a voice on top of the spell whoosh and play louder: Gravekeeper roars on teleport, summon and shove; Poltergeist moans on swap and repaint; the Hexwitch cackles with each hex; the Vampire Count's trance is a loud dark cast plus a hiss, then a hiss-and-rumble heartbeat every 0.9 s while the trance holds; Twin Tides bark on bolt and revive. Castle walls sound like stone: rock impacts on hits and a brick crash when one falls (`wallHit('castle')`, `wallDown('castle')`). The win sting was briefly an 8-bit fanfare; it is now a bright bell chime with a rising bell arpeggio and a sparkle, Mario Kart-like (owner).

## Music

First gameplay draft from the owner (`assets/music/play_draft1.mp3`, "jack in the box recut", 78 s). `tools/music_build.py` re-encodes tracks in `assets/music` to 96 kbps MP3 and writes them as data URIs to `src/data/music.js` (about 0.9 MB). The engine (`musicStart`, `musicStop`, `musicSync` in `src/engine/audio.js`) decodes a track on first use, loops it at gain 0.32 through the same limiter as the effects, fades in over 1.2 s when a night starts (`startGame`) and out when the night ends or the player quits; the mute toggle ducks it without restarting. Draft comparison (2026-09-26, owner): six tracks in `assets/music`, one per world plus a menu loop, so the owner can pick favourites in play. Worlds 1–3 play the owner's drafts as delivered ("jack in the box recut", "journey 4 ghost lullaby", "journey 1 unwound"). Two are ffmpeg reworks: world 4 plays "unwound developing melody" pitched down two semitones (so 11% slower) with a +3 dB low shelf and −5 dB highs for a heavier castle mood; world 5 plays the ghost lullaby "underwater" (low-pass at 1.6 kHz, chorus, a short echo, +2.5 dB). The menu loop is the first draft at 85% tempo, low-passed at 3.8 kHz and 2 dB quieter, started by `setState` on every menu screen; `startGame` swaps in the world's track and Quit returns to the menu loop. Tracks are encoded at 80 kbps and shared files are bundled once; the music bank is about 6.8 MB of JS, which is fine for the artifact but will be trimmed to the chosen tracks (and shorter loops) before release. Still planned: a boss variant, fog and sea ambience, separate music and effects sliders.

**Owner tuning, second pass (2026-09-26).** Shell Turtle: heavy metal impact pitched down on hits and chews, a deeper clang plus a splash on death. Water bolts (Puddle Diver, Twin Tides): bubbles plus a bright splash when thrown, a splash plus bubbles when they land on a wall (`water:land`).

**Owner tuning, third pass (2026-09-26).** Five-or-more bunches: a harp glissando or fast chip arpeggio (`combo`) with a soft rising sine run underneath, no punch; Tetris-like reward rather than impact. Vampires (monster and Count): a deep chuckle on hits, heals and death instead of hisses; the Count arrives with an evil laugh, laughs again as a trance begins, and the trance itself is only a soft low pad with a quiet lub-dub heartbeat. Mossback: first cute mumbles, then (owner: "squeaky") a low monster grunt over a heavy thud on hits and a deep death grunt; Gargoyle Haulers and Bulwark Knights use the same giant grunts. Boss warning: when a boss spawns a blaring siren plays (about 2 s), the music ducks to 25% for 3.5 s (`musicDuck`), and the boss's own arrival sound follows 0.9 s later. Music and effects levels were left as they were at the owner's request.

**Owner tuning, fourth pass (2026-09-26, unreleased).** Bunch sound unified: any bunch of 3 or more plays a sparkle plus a short harp glissando with a bright twinkle on top, climbing in pitch with combos; the 5-bunch no longer differs. Vampires only ever chuckle: the Count arrives with two chuckles, snickers as a trance begins, and the trance is nothing but a faint background lub-dub. The evil-laugh clips were dropped from the bank (they read as a witch). Hexes now zap: an electric crack (two for the Hexwitch) with a purple lightning bolt drawn from the caster to each hexed monster, and a light cackle after; the Hexwitch's undead zone plays the magic transition and a sparkle with only a soft dark cast underneath. Pumpkin swipes: a short recorded swish (pitched up, wide random detune) with a landing pop; row pushes use a cartoon slide whistle and a soft thud. Grey (piercing) pumpkins play the plain pumpkin thud on every monster they pass through; the extra pierce ping is gone.

**Owner tuning, fifth pass (2026-09-26).** Bunch: sparkle and twinkle only, the harp is gone. Coins: treasure-chest coin clips instead of arcade pickups (Yellow hits, coin drops, collection). Vampire Count trance: a recorded heartbeat every 0.9 s at a clearly audible level; the owner could not hear the synthesised lub-dub.
