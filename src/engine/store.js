// ---------- In-app purchases (foundation, owner 2026-09-27) ----------
// Seed packs are real-money products. The Capacitor build supplies `window.GGStore`:
//   GGStore.buy(sku) → Promise<{ ok:boolean }>   (the store confirms payment; seeds are granted here)
// In the browser there is no store, so packs show as "In the app" and cannot be bought.
import { SEED_PACKS } from '../data/economy.js';
import { persist, save } from '../save.js';

export const storeReady = () => !!(window.GGStore && typeof window.GGStore.buy === 'function');

export async function buyPack(sku){
  const pack = SEED_PACKS.find(p => p.sku === sku); if (!pack || !storeReady()) return false;
  try {
    const r = await window.GGStore.buy(sku);
    if (!r || !r.ok) return false;
    save.seeds = (save.seeds || 0) + pack.seeds; persist(); return true;
  } catch (e) { return false; }
}
