// Gourds (Release 4, Nightmare Pumpkin Patch; spec Part 3). A gourd stands on the patch on its own; it is not a pumpkin colour and does not
// take a pumpkin slot. Release 4 has the Grave Gourd; Release 5 (Nightmare Foggy Hollow, spec Part 6) adds the Protector Gourd, and a night
// may stand up to two (engine: src/engine/gourd.js, art: src/engine/render/gourd.js). Release 7 (Nightmare Witchwood, spec Part 5) adds the
// Wartling Gourd: with three unlocked, the player picks two of the three for the two slots.
// Wrapped in the release gates so lower builds carry none of these names.
export const GOURDS = __RELEASE__ >= 4 ? {
  grave:{ key:'grave', name:'Grave Gourd', role:'Clears graves',
    power:'Each sprout fills the empty cells around it. Press and hold it to break it: every grave in the 3×3 around it is cleared, and a new one sprouts on the next tick.',
    lore:'A calabash that grew in the churchyard. Graves crumble when it cracks open.' },
  ...(__RELEASE__ >= 5 ? {
    protector:{ key:'protector', name:'Protector Gourd', role:'Shields its square',
      power:'Pumpkins in the 3×3 around it never rot, and no monster can destroy them. A pumpkin flicked from its square always knocks back what it hits and mends the fence of its column by 1. Press and hold it to break it: every rotten pumpkin around it turns Rainbow, and a new one sprouts on the next tick.',
      lore:'A swan-necked gourd that grew beside the chapel lantern. Rot will not cross the soft light around it.' },
  } : {}),
  ...(__RELEASE__ >= 7 ? {   // Release 7 (Nightmare Witchwood, spec Part 5): the third gourd
    wartling:{ key:'wartling', name:'Wartling Gourd', role:'Doubles launch damage',
      power:'A pumpkin flicked from the 3×3 around it does double damage (its powers work as usual). Press and hold it to break it: in the top row, right under the fence, it mends each fence above its square by half; anywhere else it just breaks. A new one sprouts on the next tick.',
      lore:'A warty violet gourd from the witch\'s garden. Whatever leaves its patch flies with a hex behind it.' },
  } : {}),
} : {};
/** The picker's gourd slots (Release 5, spec Part 6): a night takes up to this many gourds, each slot any unlocked gourd the night offers
 *  (a level's `gourds` field; a `gourd:true` night without one offers the Grave Gourd alone). */
export const GOURD_SLOTS = 2;
/** May both slots hold the same kind? No for now (owner): the one-line switch to flip later. Everything follows it: the picker (a night that
 *  offers one kind then opens GOURD_SLOTS slots, and a picked tile fills the free one), `nightGourds` (src/engine/game.js, which folds two of
 *  a kind into one while it is false), and the engine, which keys each gourd's place and due-back state by its own id (gourdIds in
 *  src/engine/gourd.js). `let`, so the checks can flip it at runtime (setAllowSameGourd, a ?test hook). */
export let ALLOW_SAME_GOURD = false;
export function setAllowSameGourd(v){ ALLOW_SAME_GOURD = !!v; }
