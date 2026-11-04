// Gourds (Release 4, Nightmare Pumpkin Patch; spec Part 3). A gourd stands on the patch on its own; it is not a pumpkin colour and does not
// take a pumpkin slot. Only the Grave Gourd exists in this release (engine: src/engine/gourd.js, art: src/engine/render/gourd.js).
// Wrapped in the release gate so lower builds carry none of these names.
export const GOURDS = __RELEASE__ >= 4 ? {
  grave:{ key:'grave', name:'Grave Gourd', role:'Clears graves',
    power:'Each sprout fills the empty cells around it. Press and hold it to break it: every grave in the 3×3 around it is cleared, and a new one sprouts on the next tick.',
    lore:'A calabash that grew in the churchyard. Graves crumble when it cracks open.' },
} : {};
