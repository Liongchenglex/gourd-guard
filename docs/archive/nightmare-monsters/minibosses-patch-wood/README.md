# Mini bosses: the Strawlord and the Treant (PROPOSAL, design archive)

Not in the game. Pumpkin Patch and Witchwood mini bosses in the Kraken's size class (`../kraken-pirate/`): bigger than monsters, smaller than the world bosses. Drawn with the game's Toy Plastic painter (`src/engine/render/paint.js`), drawing units with the ground at y = 50, no per-frame randomness.

- `patch_wood.js`: drawings and registry-style `CLIPS` (box, suggested scale, clips).
- `preview_entry.js` + `build.sh` → `preview.html` (each clip large and animated beside the game's scarecrow prop, Gravekeeper, Hexwitch, Witch and the Kraken; strips of every clip; a game-size row). Rebuild from the repo root: `zsh docs/archive/nightmare-monsters/minibosses-patch-wood/build.sh`.
- `idle.png`: a still of both mini bosses and the root.

| entry | box (x, y, w, h) | scale | clips |
|---|---|---|---|
| `strawlord` | -128, -156, 252, 228 | .56 | idle 8 loop, flock 12 once, hit 5 once, tear 12 once, walk 8 loop, chew 4 loop |
| `crow` | -60, -34, 120, 90 | .6 | fly 6 loop |
| `treant` | -104, -156, 208, 232 | .58 | idle 8 loop, summon 10 once, hit 5 once |
| `root` | -40, -62, 80, 132 | .55 | rise 8 once, idle 8 loop, sink 6 once |

## The Strawlord (Pumpkin Patch)
**Look.** A giant scarecrow nailed to a wooden post. It has a burning jack-o'-lantern head with an angry carved face, flames licking out of the eyes, under a slouched, smouldering hat with a crow feather. It wears a ragged purple patchwork coat over the red shirt of the game's scarecrow prop, with straw bursting from the cuffs, hem and trouser legs. One foot is a battered boot and the other is a straw stump. A rusty sickle is nailed into its right hand. Crows perch on the crossbar, peek out of the collar and peek out of a hole in the coat.

**Clips.** Phase 1 (on the post): `idle` (it sways while the crows peek), `flock` (it flaps both coat panels open like wings, showing a hollow of straw ribs with red eyes inside; eight crows burst out and the coat closes), `hit`. Phase 2: `tear` (it strains against the nails, the nails pop, straw bursts at the wrists, the post snaps and topples away, it drops to the ground and raises the sickle), `walk` (a slow stomp), `chew` (it hacks down at the wall with the sickle and bites).

**Proposed fight.** Phase 1: it stands on its post at the back of the centre lane and takes pumpkin hits. Every few seconds it casts `flock`, and three to five crows (the `crow` entry: fast, 1 hp, flying like bats) dive down random lanes at the walls. At half health it plays `tear` and becomes a slow, very tough walker in its lane that chews the wall with the sickle. The engine would leave the snapped stump as a field prop if wanted; the clip fades it out.

## The Treant (Witchwood)
**Look.** A huge, gnarled, hollow tree in Witchwood colours. The bark is violet-brown with deep ridges and knotholes. The face looks carved and angry: a heavy V brow, hollow eye sockets with glowing violet eyes, a knot nose and a jagged maw that glows violet inside. It stands on splayed root feet and has branch arms with twig claws. Its crown is sparse autumn leaves (red, orange and amber), grey-green moss hangs from its shoulders and arms, and a twig-and-twine hex charm with a glowing rune and a bone bead swings from its left arm.

**Clips.** `idle` (it creaks and sways, the arms drift, the eyes pulse and leaves fall), `summon` (it raises both arms high and roars, slams its hands into the ground, and the earth cracks with violet light and throws up clods), `hit` (it recoils, its eyes flash white and bark chips and leaves fly).

**Proposed fight.** Owner: "stands at the back and summons roots". It never walks. Every few seconds it casts `summon`, and roots rise in two or three lanes.

## The summoned root
**Look.** A thick, thorny bark root bursting out of a cracked mound. A violet vein glows along it, pale thorns line both edges, a side rootlet ends in a claw, a couple of autumn leaves cling to it and its tip curls into a hook.

**Clips.** `rise` (the ground cracks, clods fly and the root punches up with a little overshoot), `idle` (it writhes), `sink` (it retracts and the clods tumble back in).

**Proposed behaviour.** A root that rises mid-field blocks its lane: the next pumpkin flicked up that lane hits the root (2 to 3 hits destroy it), so the Treant is shielded in that lane. A root that rises at the wall grabs it and squeezes (wall damage over time) until it is destroyed or sinks after about 8 s.

## Open questions for the owner
- The Strawlord walks to the wall and chews in phase 2, as asked. The current ground rule "bosses never reach the wall" would then not apply to mini bosses. Should it, or should the Strawlord stop a few rows short?
- The registry convention is `walk` = a boss's idle. In the game, `idle` would be registered as `walk` for the Strawlord on the post and for the Treant. The Strawlord's two phases would need a `phase` field to choose between the post clips and the free clips (`tear` played via `m.anim` when the phase flips).
