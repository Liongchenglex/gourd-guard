# Nightmare vampires and the Rot Doctor (archive, 2026-11-02)

Owner's request: two nightmare versions of the Vampire and one of the Plague Doctor, for the nightmare levels. Nothing here is in the game.

- `nm_vampires.js`: a copy of `vampire` from `src/engine/render/chars/w4.js` (no variant draws the game's vampire) plus `P.variant` `'glutton'` (Blood Glutton) and `'bride'` (Bat Bride). The clips are the same: walk 8, chew 4, heal 6.
- `nm_doctor.js`: a copy of `doctor` from `src/engine/render/chars/w2.js` (its colours go through a palette table, and no variant gives the game look) plus `P.variant` `'rot'` (Rot Doctor). The clips are the same: walk 8, chew 4, heal 6 (once).
- `NM_VAMPIRES` / `NM_DOCTOR` are registry entries in the `chars/index.js` format. In the game each look would be its own type key.
- `preview.html`: rebuild it with `./build.sh`. `idle.png` is a still.
