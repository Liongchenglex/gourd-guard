// ---------- Wardrobe (owner, 2026-09-27) ----------
// Costumes are worn by every pumpkin at once: a hat or accessory plus a hit effect. Visual only, never power.
// Boss costumes are traded for 30 of that boss's items (economy.js); boss items come from level-20 boss chests or are bought.
// Skins change one pumpkin colour: its body, its lit face and its flight trail. Prices are in pumpkin seeds (first guesses, scaled to 1 seed per ad and $0.22-0.40 per seed).

export const COSTUMES = [
  { key:'gravekeeper',  name:'Gravekeeper hood',  boss:'gravekeeper',  price:null, hit:'A little tombstone bursts up with dirt, green soul wisps and bone chips.' },
  { key:'poltergeist',  name:'Poltergeist sheet', boss:'poltergeist',  price:null, hit:'A cold puff of mist and two little ghosts drifting up, with a hollow whoosh.' },
  { key:'hexwitch',     name:'Hexwitch hat',      boss:'hexwitch',     price:null, hit:'A purple hex sigil flashes on the target and green sparks spin off it.' },
  { key:'vampirecount', name:'Count’s collar', boss:'vampirecount', price:null, hit:'A burst of bats flaps out of the impact and scatters.' },
  { key:'twintides',    name:'Tide crown',        boss:'twintides',    price:null, hit:'A splash of seawater bursts up with a flicker of little fish.' },
  { key:'pirate',       name:'Pirate tricorn',    price:25, hit:'Gold coins and a puff of cannon smoke burst from the hit.' },
  { key:'jester',       name:'Jester’s cap', price:25, hit:'Confetti and streamers pop out in every colour.' },
];

/** t = pumpkin type index (PTYPES) the skin is for. */
export const SKINS = [
  { key:'candycorn', name:'Candy corn',    t:1, price:30, desc:'White tip, yellow middle, orange base, sugar sparkle, a gleeful face and a stream of sprinkles.' },
  { key:'magma',     name:'Magma',         t:3, price:40, desc:'Red rind cracked over glowing lava, a white-hot carving and a stream of fire.' },
  { key:'frost',     name:'Frost crystal', t:2, price:30, desc:'Faceted ice with frozen light inside, a serene frosty face and a flurry of snowflakes.' },
  { key:'galaxy',    name:'Galaxy',        t:5, price:40, desc:'A nebula and stars inside the purple rind, starry eyes and a stream of stardust.' },
];

export const costumeFor = boss => COSTUMES.find(c => c.boss === boss) || null;
