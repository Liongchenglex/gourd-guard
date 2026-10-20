# The Hollow King (archive design, 2026-10-20)

World 6 boss, Hallow's End. Locked facts from `docs/WORLDS.md` §7: five stages, each borrowing one earlier boss's full kit, the final stage mixing everything including the Poltergeist's "destroy every pumpkin of one loadout colour". Everything else below is a proposal for the owner. Nothing is in the game. Art: `hollowking.js` and `preview.html` beside this file.

## Who he is
On All Hallows' night the fires of the five fallen bosses drifted to the oldest tree on the hill and gathered inside one hollow pumpkin. It carved itself a face, crowned itself with thorns, and walked. The Hollow King is not one of them. He is what is left when all of them burn together.

## The look
- A huge jack-o'-lantern skull: carved pumpkin fused with bone, jagged eyes and a fanged grin burning ember-orange from inside, cracks in the rind leaking light.
- An iron crown of thorns with five spikes, each tipped with a small flame in one boss's colour: green (Gravekeeper), pale blue (Poltergeist), violet (Hexwitch), crimson (Vampire Count), teal (Twin Tides). The lit spike is the current stage.
- A tall, gaunt body of knotted black roots in tattered midnight-purple robes with ember trim, bone pauldrons, a cape of shadow whose hem burns away into candle flames.
- A hollow ribcage holding the **ember heart**, a pumpkin-shaped core of fire that takes the current stage's colour. It is his health bar in the world: it dims as he weakens.
- A gnarled sceptre topped with a lantern cage holding a soul-flame; the free hand ringed by will-o'-wisps. He hovers on a pool of shadow and embers; feet never touch the ground.
- **Full form (6-20):** 15% taller, antler branches from the crown, a halo of nine candles behind the head, shadow wings, a blazing heart, longer claws.
- **Fallen form (the nightmare version, see below):** the skull cracked and blackened, bone-white fire, a rusted broken crown, burnt robes, a white-hot heart, ash for embers.

## The fight (6-10 first form, 6-20 full form)
Standard boss rules apply: he holds at 30% of the field, never reaches the wall, and monsters keep coming until he dies. Monsters are the full roster of worlds 1-5, each carrying a modifier (two in the full form), as §6 says for Hallow's End.

**Five stages = five health bands.** First form 40 health (8 per stage), full form 60 (12 per stage); numbers to tune with the bot. Each stage borrows one boss's kit, in story order, so the player meets them in the order they learned them. Between stages: a 2-second **crown flare**: he is untargetable, the ember heart changes colour, the next thorn lights, and a ring of that colour sweeps the field (no damage, just the tell).

| Stage | Heart | Borrowed kit (first form) | Full form adds |
|---|---|---|---|
| 1 | green | Gravekeeper: teleports between lanes every 6 s, raises a ghoul pair every 8 s | Teleports monsters forward or across lanes |
| 2 | pale blue | Poltergeist: drifts between lanes, swaps two pumpkins every 8 s | Recolours a pumpkin every 10 s |
| 3 | violet | Hexwitch: hexes 2-3 monsters into reverse chameleons every 9 s, lays one 3×3 hex zone | Chameleons or reverse (50/50), two zones, zones may be a row or column |
| 4 | crimson | Vampire Count: bat swarm every 10 s, raises a castle wall every 15 s, a **trance** that needs ×4-6 hits to break | Regenerates unless hit within 4 s |
| 5 | teal | Twin Tides: he splits into the King and his **Shadow** on two lanes, each lobbing tide bolts at walls; both must fall within 8 s or the fallen one rises | 5-second window, faster bolts, and the mix: every earlier kit stays switched on, plus once per 20 s he **destroys every pumpkin of one loadout colour** (the Poltergeist's full-form trick) |

**Why this order:** stages 1-3 reuse the player's reading of earlier bosses with rising board pressure (lanes, then pumpkins, then monsters), stage 4 is the first that demands a specific response (break the trance), and stage 5 is the only one with a fail-state loop (the revive window), so the finale is mechanically the hardest, not just the busiest.

**Tells.** Each kit keeps its original boss's animation and sound so a player who beat worlds 1-5 recognises it: the Gravekeeper's teleport puff, the Poltergeist's swap sparkle, the Hexwitch's sigil, the Count's trance aura and counter, the Tides' bolt arc. The King's own tells are the crown flare and the heart colour.

**Rewards.** Level 20 chest as usual, boss items for a **Hollow King costume** (crown of thorns with the five flames; hit effect: a ring of five coloured flames bursts out), the world-6 perk (to define), and the Hallow's End storybook stamp.

## The Fallen Hollow King (nightmare version)
The nightmare edition of Hallow's End ends with the king who would not stay dead. He is the same silhouette so the player knows him, but everything that burned has burned out: the fire is bone-white, the crown is broken, and the five thorn flames are gone. He no longer borrows the bosses' kits one at a time. He has swallowed them.

**Where:** Nightmare Hallow's End N6 (phase 1) and N12 (both phases), once nightmare mode exists; until then an archive design.

**Phase 1, the Ash Court (health 60 (proposal)):** no stages and no crown flare. Instead the fight runs on a **24-second court cycle**, and every cycle he opens with **two kits at once**, drawn from the five in a random order that never repeats inside a fight (the player cannot learn the order between attempts). The pairs are chosen so they clash:
- Gravekeeper + Poltergeist: he teleports monsters across lanes and swaps your pumpkins in the same breath.
- Hexwitch + Vampire Count: hex zones around castle walls; anything you kill inside rises behind cover.
- Twin Tides + anything: the Shadow splits off and lobs bolts while the other kit runs.
The **heart is white** and shows no stage, so the only tell is the sceptre: the lantern cage shows the two kits' colours side by side for 2 seconds before each cycle.

**Phase 2, the Hollow Crown (N12 only, health 90 (proposal)):** at half health the broken crown reforges as **ash**, and he adds the two nightmare twists:
- **Ash fall:** every 20 seconds, pumpkins of one loadout colour turn to **ash** instead of being destroyed. An ash pumpkin stays on the patch as a dead cell for 10 seconds (it blocks slides and bunches) unless a gourd's aura covers it; smashing it costs the usual hold.
- **The Shadow court:** the Twin Tides split is permanent. The Shadow is a second body with its own health and the **Vampire Count's trance**; when either body enters a trance the other regenerates, so the player must break the trance on the body that is NOT regenerating first. Both must fall within 5 seconds.

**Rewards (proposals):** the boss chest, boss items for the **Fallen Hollow King** costume (an ash crown; hit effect: a white flash and falling ash), and the nightmare perk for Hallow's End.

**Why this works as a nightmare:** the story king teaches one kit at a time in a known order; the fallen king makes the player read two tells at once in an unknown order, and the only defence against ash fall is the nightmare mode's own gourd auras, so the new play style is required, not optional.

## Clips (for the game build)
idle (hover, heart breathing, cape drift), cast (sceptre raised, lantern flares in the stage colour), summon (sceptre slam, roots burst), hurt, die (crown falls, fire gutters, body crumbles to roots and ash). Everything baked by `render/anim.js` like the other bosses; the glow is painted into the frames, never per frame.
