import { MFIRST } from '../monsters.js';
import { PATTERNS } from '../patterns.js';

export function gravesFor(n){ return n >= 13 ? 4 : n >= 10 ? 3 : n >= 6 ? 2 : n >= 3 ? 1 : 0; }

export const WORLDS = [
  { name:'The Pumpkin Patch', sky:['#170d2a','#46213f','#a9523a'], ground:['#2b1b2a','#1a1219'], moon:'#ffe6ad', grass:'#3a2436' },
  { name:'Crooked Graveyard', sky:['#0a1322','#1b3145','#4d6b67'], ground:['#1a2427','#10171a'], moon:'#e2f4ff', grass:'#233236' },
  { name:'Hollow Manor',      sky:['#12060c','#3a0f1c','#86291d'], ground:['#271417','#170b0e'], moon:'#ffb893', grass:'#3a1c20' },
];

export const LEVELS = 15;

export function poolFor(n){
  const p = [['ghoul', 10]];
  if (n >= MFIRST.bat) p.push(['bat', 6]);
  if (n >= MFIRST.imp) p.push(['imp', 6]);
  if (n >= MFIRST.brute) p.push(['brute', 3 + n * 0.2]);
  if (n >= MFIRST.wraith) p.push(['wraith', 4]);
  return p;
}

export function levelDef(n){
  return { n, world:Math.min(2, Math.floor((n - 1) / 5)), total:6 + Math.round(n * (n > 10 ? 1.1 : 1.6)) - (n % 5 === 0 ? 3 : 0),
    interval:Math.max(2.9, 4.0 - n * 0.11), spMul:0.76 + Math.min(n - 1, 9) * 0.012 + Math.max(0, n - 10) * 0.005,
    boss:n % 5 === 0, pool:poolFor(n), pattern:(n - 1) % PATTERNS.length, graves:gravesFor(n) };
}
