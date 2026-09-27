// ---------- Economy (owner's monetization.md, 2026-09-27) ----------
// Every price, drop rate and ad rule lives here. Numbers marked (default) were not in the owner's sheet and are first guesses.

/** Pumpkin level-up cost by type key, one entry per step (1→2, 2→3, 3→4, 4→5): { coins } or { seeds }. */
const A = [{ coins:100 }, { coins:300 }, { coins:600 }, { coins:1500 }];          // Green, Yellow
const B = [{ coins:100 }, { coins:500 }, { coins:3000 }, { seeds:50 }];           // Fire, Ice, White, Pink, Purple, Turquoise
const C = [{ coins:1000 }, { coins:2500 }, { seeds:50 }, { seeds:100 }];          // Grey, Black, Deep Blue, Brown
export const UPGRADE_COST = { green:A, yellow:A, fire:B, ice:B, white:B, pink:B, purple:B, turquoise:B, grey:C, black:C, blue:C, brown:C };
export const upgradeCost = (key, lv) => (UPGRADE_COST[key] || A)[lv - 1] || null;

export const TOOL_COST = 300;                       // every consumable tool
export const FENCE_COST = [500, 1000, 1500];        // Sturdy walls levels 1-3
export const RENT_COST = 100;                       // renting a level-20 power for one night

/** Seed packs: real-money purchases, sold through the app stores (see engine/store.js). */
export const SEED_PACKS = [
  { sku:'seeds_10', seeds:10, price:'$3.99' },
  { sku:'seeds_25', seeds:25, price:'$7.99', tag:'Popular' },
  { sku:'seeds_50', seeds:50, price:'$10.99', tag:'Best value' },
];

/** Rewarded ads. One ad pays one seed, up to SEED_ADS_PER_DAY a day. */
export const SEED_ADS_PER_DAY = 15;
export const AD_SEEDS = 1;

/** Treasure chests. `slots` rewards each; every slot rolls boss item, then seed, then tool set, else coins. */
export const CHESTS = {
  normal: { name:'Treasure chest', slots:2, bossItem:0,    seed:0.02, tools:0.40, coins:[100, 200] },   // coins (default)
  boss:   { name:'Boss chest',     slots:3, bossItem:0.05, seed:0.05, tools:0.60, coins:[250, 500] },   // level-20 bosses; coins (default)
};
export const TOOL_SET = 5;                // a tool set is 5 random introduced tools
export const TOOL_OVERFLOW_COINS = 100;   // a tool past its carry limit pays this instead (default)
export const CHEST_KILL_CHANCE = 0.01;    // a normal kill drops a treasure chest (at most one per night, default)
export const BOSS_SEED = { chance:0.05, min:1, max:3 };   // any boss kill

/** Boss items: collect BOSS_ITEMS_FOR_COSTUME of one boss's item to trade for its costume. */
export const BOSS_ITEMS_FOR_COSTUME = 30;
export const BOSS_ITEM_SEED_PACK = { items:10, seeds:10 };   // buy boss items with seeds (default)
export const BOSS_ITEM_COINS = 400;                          // or one at a time with coins (default)

/** The Loot Sack: summoned by watching an ad on the level card. Two lanes wide, never chews walls, flees when its time is up. */
export const SACK = { hpBase:10, hpPerWorld:4, stay:25, hold:0.38, sp:0.05, spawnAt:4,
  drop:{ chest:0.50, tools:0.25, coins:0.25 }, seedChance:0.05, guaranteedSeeds:1, coins:[80, 160] };
