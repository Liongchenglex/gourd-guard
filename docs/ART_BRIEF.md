# Gourd Guard art brief: drawing a world's monsters

The owner approved this direction on 2026-09-26 (style sheet: https://claude.ai/artifact/KvCFtEpbEbQBMKkWKyWSAd). Read this before drawing anything, then read `src/engine/render/paint.js` (the painter), `src/engine/render/chars/w1.js` (finished examples: pumpkin, bat, imp, ghoul, Mossback, mummy, Gravekeeper, plus world costumes) and `src/engine/render/chars/index.js` (the registry schema).

## The look: "Toy Plastic", MapleStory-like
- **Volume, not lines.** Every part is painted with `S.part`: gradient volume, rim light, bevel, bounce light, a thin dark-tone edge (never a black outline). Limbs are `S.tube`. Materials go through `mat:` (`skin`, `scaly`, `cloth`, `bandage`, `metal`, `paint`, `gel`, `wood`, `horn`, `bone`, `leather`, `stone`, `moss`).
- **Real anatomy, posed.** A head, a body and limbs built from `SM` (smooth blob through points) and `SO` (smooth open stroke). Never a bare ellipse for a body. Parts overlap and cast onto each other with `S.contact`. Cloth gets `S.crease` folds, frayed hems get `S.thread`, metal gets `S.rivet`.
- **Faces.** Huge eye whites with small pupils (`S.eye`, `pr` .36–.45), fangs or teeth where they fit, `S.blush` on anything friendly. Glowing eyes (`S.glow`) for spirits and skulls.
- **Chubby proportions.** Heads 40–60% of the height. Saturated colours from `pal(base)`.
- **World theme.** Foggy Hollow: marsh, mist, will-o'-wisps, lanterns, bog mud, reeds. Witchwood: enchanted autumn forest, witches, leaves, bark, purple magic. Crumbling Keep: vampire castle under siege, stone, iron, cobwebs, bats, crimson. Drowned Marsh: sunken shore, drowned sailors, kelp, barnacles, wet sheen, teal. Reuse the costume helpers in w1.js (`wet`, `kelp`, `mud`, `sprigs`, `leaves`, `web`, `starfish`) or add your own.
- **Read at 60 px.** In the game a monster is about 50–70 px tall. Keep textures subtle and shapes bold; test at game size, not only on the sheet.

## Drawing units and fit
- Draw around (0,0) with the feet at about y = 50; a fodder monster is roughly 100 units tall, a boss 150–170.
- Each registry entry gives `scale` and `dy` so that the feet land at `r × 0.95` below the monster's centre in game units, where `r` is that type's `r` in `src/data/monsters.js` (e.g. r 21 → feet at 20: with feet at drawing y 50 and scale .7, dy = 20 − 35 = −15). Match the footprint of the old drawing in `src/engine/render/monsters.js` (its `drawX` function) so health bars and lane spacing still work.
- `box` is the frame in drawing units and must contain every pose of every clip (arms out, wings up, a skill's props). Keep it as tight as you can: frames are baked at 2× and memory matters.

## Clips and states
- Every walking monster needs `walk` (8 frames, looped; legs alternate, body bobs, arms swing) and `chew` (4 frames, looped; leaning in and biting the wall).
- Add clips for the monster's special states and pick them in `frame(m, clips)` from the live monster's fields (read `src/engine/monsters.js` `updateMonster` for the fields: `shield`, `phase`, `hidden`, `vanish`, `carrier`, `reflecting`, `healing`, `stunT`, `puddle`, `upT`, `lurch`, `gargs`, `freed`, `shootT`, `calmT`, `rise`, `age`, `anim`…). Return `[clipName, frameIndex]` or `null` for the default logic (walk / chew / collapse / `m.anim` hints). `once` clips use `t = i / (n − 1)`, looped clips `t = i / n`.
- Bosses: `walk` is their idle (breathing, floating, lantern sway). Skills are `once` clips; the engine plays them through `m.anim = { clip, t, dur }`. If a skill needs a hint the engine does not set yet, name it in your report (clip name, when it should fire) instead of editing the engine.
- Flames, auras, fog banks, heal zones and projectiles are drawn by the engine separately; do not bake them into the character.
- Death is generic (the last frame pops) unless the design doc says otherwise (mummies collapse into wrappers: see `collapse` in w1.js).

## Rules
- Edit only your world's file `src/engine/render/chars/wN.js`. Export `const WN = { type: entry, ... }`. Do not touch paint.js, anim.js, index.js, the engine or the docs; report what you need changed.
- Import from `'../paint.js'` and `'../../util.js'` only.
- No image assets, no external fonts, no per-frame randomness (use `rng(seed)` so frames are stable).
- Keep chameleon colour locks working: a chameleon is drawn in the pumpkin colour it is locked to (`PTYPES[m.colourLock].base`, `src/data/pumpkins.js`); use `vkeyOf(m)` in the entry to return `'c' + colourIndex` and list `variants: { c0:true … c11:true }`, and read `pose.variant` in draw to pick the colour. Reverse chameleons (`m.colourImmune`) are drawn inverted / hollow-eyed in the same colour.

## Review loop
1. `node --check src/engine/render/chars/wN.js`.
2. Render the strips: `.venv/bin/python tools/char_sheet.py --url http://localhost:PORT/ --keys wisp,wraith,... --out /tmp/wN.png --frame 120` with your own `npx vite --port PORT --strictPort` running, then Read the PNG. Iterate until every clip reads as a posed figure with clear volume and a readable face.
3. Check it in the game at real size: open `http://localhost:PORT/?test`, run `__gg.startGame('story', NIGHT, [0,1,2,3,4])` (nights 21–40 are world 2, 41–60 world 3, 61–80 world 4, 81–100 world 5) and `__gg.spawnMonster('wisp', 3, false, 0.4)` for each type, screenshot at 430×860 with device scale 2, and Read it.
