// ---------- Pumpkins ----------

export const PTYPES = [
  { key:'green',  name:'Green',  role:'normal pumpkin', base:'#5c9c33', light:'#94d65e', dark:'#305c17', spark:'#a6f06a' },
  { key:'yellow', name:'Yellow', role:'normal pumpkin', base:'#e8b323', light:'#ffe27a', dark:'#9a6a08', spark:'#ffe27a' },
  { key:'ice',    name:'Ice',    role:'slows monsters and can freeze them solid', base:'#7cc6ec', light:'#e6f8ff', dark:'#2f73a3', spark:'#bfefff' },
  { key:'fire',   name:'Fire',   role:'keeps burning monsters as they walk', base:'#d63a2a', light:'#ff7057', dark:'#7f1c13', spark:'#ff6a3a' },
  { key:'grey',   name:'Grey',   role:'pierces through every monster in its column', base:'#8f9096', light:'#d4d5da', dark:'#4d4e55', spark:'#e8e8ee' },
  { key:'purple', name:'Purple', role:'can spawn a bonus pumpkin in your patch when it kills', base:'#8746c2', light:'#bb88ee', dark:'#4c2379', spark:'#d09bff' },
  { key:'white',  name:'White',  role:'flies back into your patch if it hits nothing', base:'#e9e4d8', light:'#ffffff', dark:'#9a948a', spark:'#ffffff' },
  { key:'black',  name:'Black',  role:'explodes on impact and splashes the columns beside it', base:'#3a3540', light:'#6e6878', dark:'#17141c', spark:'#ff9a3a' },
  { key:'pink',   name:'Pink',   role:'chains lightning to the nearest monster in a neighbouring column', base:'#e05aa8', light:'#ff9ad6', dark:'#8a2a66', spark:'#ffb3e6' },
  { key:'gold',   name:'Gold',   role:'always pays coins on a kill, and twice as many', base:'#d9a520', light:'#fff0a0', dark:'#7a5a08', spark:'#ffe680', gold:true },
  { key:'rainbow',name:'Rainbow',role:'joins any bunch as any color', rainbow:true, spark:'#fff3a0' },
];

export const RAINBOW = 10, NTYPES = 10, GOLD = 9;   // type indices: 0 Green, 1 Yellow, 2 Ice, 3 Fire, 4 Grey, 5 Purple, 6 White, 7 Black, 8 Pink, 9 Gold, 10 Rainbow

export const POWER     = [1, 1, 1.5, 1.5, 2];

export const KB_CHANCE = [0, 0.25, 0.25, 0.5, 0.5];

export const SLOW_T    = [1, 1.5, 2, 2.5, 3];

export const FREEZE_P  = [0, 0, 0.25, 0.5, 0.5];

export const BURN_N    = [2, 2, 3, 4, 5];

export const BURN_AMT  = [0.1, 0.2, 0.2, 0.2, 0.2];

export const BURN_EVERY = 1;

export const SPAWN_P   = [0.25, 0.5, 1, 1, 1];

export const RAINBOW_P = [0, 0, 0, 0.25, 0.5];

export const LV_COST   = [40, 80, 130, 200];

export const WILD_CHANCE = 0.03;

export function pct(v){ return Math.round(v * 100) + '%'; }

export function lvDesc(t, L){
  const i = L - 1, parts = [`power ${POWER[i]}`];
  if (t === 2){ parts.push(`slows ${SLOW_T[i]}s`); if (FREEZE_P[i]) parts.push(`${pct(FREEZE_P[i])} freeze`); }
  else if (t === 3) parts.push(`burns ${BURN_N[i]} times for ${BURN_AMT[i]}`);
  else {
    parts.push(KB_CHANCE[i] ? `${pct(KB_CHANCE[i])} knockback` : 'no knockback');
    if (t === 4) parts.push('pierces');
    if (t === 5){ parts.push(`${pct(SPAWN_P[i])} spawn on kill`); if (RAINBOW_P[i]) parts.push(`${pct(RAINBOW_P[i])} rainbow`); }
    if (t === 6) parts.push('returns on a miss');
    if (t === 7) parts.push('splashes neighbours for half');
    if (t === 8) parts.push('chains to a neighbour for half');
    if (t === 9) parts.push('kills always pay double coins');
  }
  return parts.join(', ');
}

