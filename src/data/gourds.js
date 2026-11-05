// Gourds (Release 4, Nightmare Pumpkin Patch; spec Part 3). A gourd stands on the patch on its own; it is not a pumpkin colour and does not
// take a pumpkin slot. Release 4 has the Grave Gourd; Release 5 (Nightmare Foggy Hollow, spec Part 6) adds the Protector Gourd, and a night
// may stand up to two (engine: src/engine/gourd.js, art: src/engine/render/gourd.js).
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
} : {};
