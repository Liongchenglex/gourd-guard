// Frozen copy of the prototype's level formulas (index.html at a7845a2), kept only for check_levels.mjs.
import { MFIRST } from '../src/data/monsters.js';
import { PATTERNS } from '../src/data/patterns.js';
function gravesFor(n){ return n >= 13 ? 4 : n >= 10 ? 3 : n >= 6 ? 2 : n >= 3 ? 1 : 0; }
function poolFor(n){
  const p = [['ghoul', 10]];
  if (n >= MFIRST.bat) p.push(['bat', 6]);
  if (n >= MFIRST.imp) p.push(['imp', 6]);
  if (n >= MFIRST.brute) p.push(['brute', 3 + n * 0.2]);
  if (n >= MFIRST.wraith) p.push(['wraith', 4]);
  return p;
}
export function legacyLevelDef(n){
  return { n, world:Math.min(2, Math.floor((n - 1) / 5)), total:6 + Math.round(n * (n > 10 ? 1.1 : 1.6)) - (n % 5 === 0 ? 3 : 0),
    interval:Math.max(2.9, 4.0 - n * 0.11), spMul:0.76 + Math.min(n - 1, 9) * 0.012 + Math.max(0, n - 10) * 0.005,
    boss:n % 5 === 0, pool:poolFor(n), pattern:(n - 1) % PATTERNS.length, graves:gravesFor(n) };
}
