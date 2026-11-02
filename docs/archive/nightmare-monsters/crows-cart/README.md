# Swooping Crows and the Lobber Cart (archive, 2026-11-02)

Two Pumpkin Patch monsters for the nightmare levels, drawn in the Toy Plastic style. Not in the game.

- `crows-cart.js`: the drawings, registry-style entries in `CLIPS` (imports the game's painter and `pumpkin()` read-only).
- `preview_entry.js` + `build.sh`: `zsh docs/archive/nightmare-monsters/crows-cart/build.sh` from the repo root rebuilds `preview.html` (every clip animated beside the game's Bat, Imp and Green pumpkin, strips of every clip, a game-size row). Test hooks: `__edges()`, `__idle()`, `__strip(key, clip, scale)`.
- `idle.png`: a still of everything.

## Swooping Crows (`crows`, `crow`)
A small flock of three blue-black crows with glowing ember-red eyes, scowling brows, big slate wedge beaks, ragged crests and fingered, tattered wing tips. They fly as one unit: a lead crow in front and two flankers behind.
- `fly` (8 frames, loop): cruising flap, each crow on its own beat.
- `swoop` (6, loop): wings swept back into a V, eyes flaring orange, speed streaks and a loose feather trailing up the lane.
- `chew` (4, loop): the lead crow perches and jabs the wall (splinters fly), the flankers flutter and stab down in turn.
- Variants `c2`, `c1`: the flock with two or one crow left. `crow` is a single crow with the same clips.

**Gameplay (proposal):** a flying flock that counts as one monster in its lane, fast like the Swift Bat. It cruises, and every few seconds swoops about a cell and a half down the lane. Each hit knocks one crow out (3 hits), but a Black splash or Grey pierce hits the whole flock. Flying, so it passes over graves, mines and puddles. Engine hint needed: `m.anim = { clip:'swoop' }` while dashing, and the variant from the crows left.

## Lobber Cart (`cart`, `net`, `netted`)
A rickety two-wheeled plank cart with mismatched spoked wheels, iron corner straps and a patched front board. On it: a spoon catapult on a twisted-rope skein with a crank, a wicker basket of rolled nets, and a ghost-green lantern and tattered purple pennant on a bent pole. Its crew is a little green goblin with huge ears, a dented cooking pot for a helmet (slipping over one eye) and a toothy grin.
- `cart` `walk` (8, loop): wheels turn, the cart rattles and rocks, the goblin bounces, lantern and pennant swing.
- `cart` `idle` (6, loop): parked; the goblin looks around, the lantern sways.
- `cart` `lob` (10, once): the goblin cranks the arm back (gritted teeth, sweat), it swings over and flings the net (the cart bucks, dust), he cheers, then tosses a fresh net from the basket into the cup. Ends on the walk pose.
- `net` `fly` (8, loop): the weighted rope net tumbling open, iron balls at the corners.
- `netted` (over the game's own Green pumpkin): `land` (6, once) the net drops and drapes, weights thump down; `held` (4, loop) worried pumpkin under a diamond mesh tied at the stem; `struggle` (6, loop) it rocks against the taut cords; `snap` (8, once) the cords pop, pieces and weights fly off, and the pumpkin hops free, happy.

**Gameplay (proposal):** the cart rolls in slowly and parks in the back rows of its lane; it never comes down to the wall. Every 6 to 8 seconds it lobs a net onto a random pumpkin in the patch. A netted pumpkin is locked: it cannot be slid or flicked and blocks slides through its cell. It breaks free when a bunch is matched next to it, or by itself after about 8 seconds (struggling for the last 2 as a warning). Killing the cart frees every net. About 6 hp. Engine hints needed: `lob` when it throws; the netted pumpkin's land, struggle and snap states.

## Suggested scales
crows 0.5, crow 0.5, cart 0.55, net 0.55, netted 0.6 (the box matches the pumpkin drawn at radius 40).
