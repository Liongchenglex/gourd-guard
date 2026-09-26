// ---------- Storybooks ----------
// One picture book per world on the level-select shelf (owner, 2026-09-26). Index = world number − 1.
// cover / edge: the book's leather and page-edge colours. lore: read on the left page when the book opens.

export const BOOKS = [
  { cover:'#c9631f', edge:'#f3dfb0', ink:'#3b1d0c',
    lore:'Every autumn the harvest moon rises over the old patch, and every autumn the graves beside it stir. The pumpkins grew brave this year. They grew brave enough to fly.',
    blurb:'Where it all begins: ghouls, bats and the Gravekeeper.' },
  { cover:'#2f6b62', edge:'#e4ead8', ink:'#12302a',
    lore:'Past the fence the ground turns to marsh, and the mist keeps its own secrets. Lanterns bob where no one carries them. Something in the fog is counting your walls.',
    blurb:'Fog hides the field. Wisps, wraiths and the Poltergeist.' },
  { cover:'#5c2a72', edge:'#ecdcc8', ink:'#2a0f34',
    lore:'The trees of Witchwood remember every spell cast beneath them. Leaves fly the wrong way, monsters change their colours, and somewhere a cauldron is always boiling.',
    blurb:'Wind moves your patch. Chameleons, witches and the Hexwitch.' },
  { cover:'#7d1d24', edge:'#e9d8c4', ink:'#32080c',
    lore:'The keep on the hill has been crumbling for a hundred years, and its master has been waiting for exactly as long. Tonight the drawbridge is down.',
    blurb:'Castle walls block your shots. Knights, archers and the Vampire Count.' },
  { cover:'#1f5b6c', edge:'#dfe6d6', ink:'#0b2a34',
    lore:'The sea took the village long ago. It did not take the villagers. When the tide comes in, so do they, and they are very, very thirsty.',
    blurb:'Puddles and the sea spawn monsters. Sailors, slimes and the Twin Tides.' },
  { cover:'#26202e', edge:'#cfc6d6', ink:'#1a1420',
    lore:'On the last night of October every door between the worlds stands open at once.',
    blurb:'Coming in a future release.' },
];

// A line of story per pumpkin for the picking screen (owner, 2026-09-27). Keys match PTYPES[].key.
export const PUMPKIN_LORE = {
  green:'The patch\u2019s everyday pumpkin. Not clever, not fancy, but there are always more of them.',
  yellow:'Grown from seeds a travelling pedlar swapped for a night\u2019s shelter. Something about them makes monsters drop their coins.',
  ice:'Ripened in the first frost and never quite thawed. Monsters that get hit stop to shiver.',
  fire:'Sprouted where the bonfire stood last year. Still warm in the middle, and the only thing a mummy fears.',
  grey:'Hard as river stone and twice as stubborn. It goes straight through whatever is in its way.',
  purple:'The witches\u2019 own strain. Where it lands, something new grows.',
  white:'A ghost of a pumpkin. Throw it at nothing and it drifts back home to the patch.',
  black:'Packed tight with something that should not be inside a vegetable. Handle it quickly.',
  blue:'Grew under the wreck at the bottom of the marsh, where the lightning sleeps. It remembers.',
  pink:'Sweet enough to mend a broken fence with a single thump. Monsters hate the smell.',
  turquoise:'Small, quick and impatient. Two is enough for a throw, half as hard.',
  brown:'A slow grower with a temper. Leave it in the patch and it comes back twice the size.',
  rainbow:'Nobody plants these. They simply appear when a patch has been looked after well.',
};
