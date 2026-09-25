// ---------- Pumpkins ----------

export const PTYPES = [
  { key:'green',  name:'Green',  role:'normal pumpkin', base:'#5c9c33', light:'#94d65e', dark:'#305c17', spark:'#a6f06a' },
  { key:'yellow', name:'Yellow', role:'pays extra coins on every kill it makes', base:'#e8b323', light:'#ffe27a', dark:'#9a6a08', spark:'#ffe27a' },
  { key:'ice',    name:'Ice',    role:'slows monsters and can freeze them solid', base:'#7cc6ec', light:'#e6f8ff', dark:'#2f73a3', spark:'#bfefff' },
  { key:'fire',   name:'Fire',   role:'keeps burning monsters as they walk', base:'#d63a2a', light:'#ff7057', dark:'#7f1c13', spark:'#ff6a3a' },
  { key:'grey',   name:'Grey',   role:'pierces through every monster in its column', base:'#8f9096', light:'#d4d5da', dark:'#4d4e55', spark:'#e8e8ee' },
  { key:'purple', name:'Purple', role:'can spawn a bonus pumpkin in your patch when it kills', base:'#8746c2', light:'#bb88ee', dark:'#4c2379', spark:'#d09bff' },
  { key:'white',  name:'White',  role:'flies back into your patch if it hits nothing', base:'#e9e4d8', light:'#ffffff', dark:'#9a948a', spark:'#ffffff' },
  { key:'black',  name:'Black',  role:'explodes on impact and splashes the columns beside it', base:'#3a3540', light:'#6e6878', dark:'#17141c', spark:'#ff9a3a' },
  { key:'blue',   name:'Deep Blue', role:'chains lightning along the row it hits', base:'#2a3a8a', light:'#6a8aff', dark:'#101a4a', spark:'#9ab0ff' },
  { key:'pink',   name:'Pink',   role:'repairs the wall of its column on every hit and knocks monsters back often', base:'#e05aa8', light:'#ff9ad6', dark:'#8a2a66', spark:'#ffb3e6' },
  { key:'rainbow',name:'Rainbow',role:'joins any bunch as any color', rainbow:true, spark:'#fff3a0' },
];

export const RAINBOW = 10, NTYPES = 10;   // type indices: 0 Green, 1 Yellow, 2 Ice, 3 Fire, 4 Grey, 5 Purple, 6 White, 7 Black, 8 Deep Blue, 9 Pink, 10 Rainbow
export const YELLOW = 1, BLUE = 8, PINK = 9, WHITE = 6, BLACK = 7;
// Per-level tables for the special types (docs/WORLDS.md §5)
export const COIN_MULT  = [2, 2, 3, 3, 4];          // Yellow: coin multiplier on its kills (always pays coins)
export const CHAIN_N     = [3, 3, 4, 5, 5];          // Deep Blue: monsters in the same row struck (including the one hit)
export const CHAIN_FRAC  = [0.25, 0.5, 0.5, 0.75, 0.75];   // Deep Blue: chain damage as a fraction of power
export const SPLASH_FRAC = [0.5, 0.5, 0.75, 0.75, 1];     // Black: splash damage fraction; level 5 splash also knocks back
export const SPLASH_ROWS = [1, 1, 1, 3, 3];               // Black: splash zone is 3 lanes × this many tile heights
export const HEAL_AMT    = [1, 1, 2, 2, 3];          // Pink: wall repair per hit
export const KB_PINK     = [0.5, 0.5, 0.5, 0.75, 0.75];   // Pink: knockback chance

export const POWER     = [1, 1, 1.5, 1.5, 2];

export const KB_CHANCE = [0, 0.25, 0.25, 0.5, 0.5];

export const SLOW_T    = [1.5, 2, 3, 4, 5];

export const FREEZE_P  = [0, 0, 0.25, 0.5, 0.5];

export const BURN_N    = [2, 2, 3, 4, 5];

export const BURN_AMT  = [0.1, 0.2, 0.2, 0.3, 0.3];

export const BURN_EVERY = 1;

export const SPAWN_P   = [0.25, 0.4, 0.5, 0.6, 0.7];   // Purple: extra spawn chance per kill (every launched group also spawns one on its first hit)

export const RAINBOW_P = [0.1, 0.2, 0.3, 0.4, 0.5];   // Purple: chance a spawn is rainbow

export const LV_COST   = [40, 80, 130, 200];

export const WILD_CHANCE = 0.03, WILD_CHANCE_PERK = 0.10;   // rainbow chance on sprouts and drops; the 4-20 perk uses the higher one

export function pct(v){ return Math.round(v * 100) + '%'; }

export function lvDesc(t, L){
  const i = L - 1, parts = [`power ${POWER[i]}`];
  if (t === 2){ parts.push(`slows ${SLOW_T[i]}s`); if (FREEZE_P[i]) parts.push(`${pct(FREEZE_P[i])} freeze`); }
  else if (t === 3) parts.push(`burns ${BURN_N[i]} times for ${BURN_AMT[i]}`);
  else if (t === 9) parts.push(`heals wall ${HEAL_AMT[i]}`, `${pct(KB_PINK[i])} knockback`);
  else {
    parts.push(KB_CHANCE[i] ? `${pct(KB_CHANCE[i])} knockback` : 'no knockback');
    if (t === 4) parts.push('pierces');
    if (t === 5){ parts.push('1 spawn per bunch', `${pct(SPAWN_P[i])} more per kill`, `${pct(RAINBOW_P[i])} rainbow`); }
    if (t === 1) parts.push(`kills pay ×${COIN_MULT[i]} coins`);
    if (t === 6) parts.push(i >= 2 ? 'returns beside its colour' : 'returns on a miss');
    if (t === 7) parts.push(`splashes 3×${SPLASH_ROWS[i]} for ${pct(SPLASH_FRAC[i])}${i >= 4 ? ' with knockback' : ''}`);
    if (t === 8) parts.push(`lightning hits ${CHAIN_N[i]} in the row at ${pct(CHAIN_FRAC[i])}`);
  }
  return parts.join(', ');
}

