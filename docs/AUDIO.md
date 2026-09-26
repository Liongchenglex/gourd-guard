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
| Menus | Level tile: pluck. Pumpkin picked: rising blip; dropped: falling blip; locked: dull buzz. Start, Next, Got it: two rising notes. Back and Quit: two falling notes. Any other button: soft click |
| Chewing the wall | A clearly audible bite about three times a second while any monster chews: wood being gnawed by default, metal or stone scraping for knights, bulwarks and gargoyles, wet chomps for slimes, blobs, crawlers and divers, a hollow knock for turtles, quick nibbles for bats |

## 5. Music (to design after the effects)

One loop per world plus a boss variant that layers on top of it, with per-world instrumentation to match the theme. Separate music and effects sliders in the pause menu; music ducks under banners and boss arrivals.

**Mix (2026-09-26).** The first synthesised pass measured peaks of 0.02–0.05 (about −30 dBFS) and the monster layer played at the same instant as the pumpkin thump, so on a phone only the thump was heard. Now every primitive is mixed ×5 hotter into a limiter (compressor −14 dB, ratio 10), the monster hit and death layers play 45–60 ms after the impact at 1.5–1.6× gain, and hit, death and chew sounds carry ±5–8% random detune. Measured peaks after: 0.5–0.75 for single sounds, 0.75 for a thump plus ghoul together.
