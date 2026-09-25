import { SFX } from './audio.js';
import { chunk } from './combat.js';
import { endGame } from './game.js';
import { COLS, FENCE_Y, G, LANE, setWalls, walls } from './state.js';
import { save } from '../save.js';

export const wallMax = () => 18 + 5 * save.fence;

export function initWalls(){ const m = wallMax(); setWalls(Array.from({ length:COLS }, () => ({ hp:m, max:m, flash:0 }))); }

export function damageWall(c, amt){
  const w = walls[c]; if (!w || w.hp <= 0 || G.over) return;
  w.hp = Math.max(0, w.hp - amt); w.flash = Math.min(1, w.flash + amt * 0.6);
  if (w.hp <= 0){
    G.shake = 1.2;
    for (let i = 0; i < 26; i++) chunk(LANE(c), FENCE_Y - 8, '#8a6440', 300);
    SFX.wallBreak();
    if (navigator.vibrate) try { navigator.vibrate([60, 40, 90]); } catch (e) {}
    G.brokeAt = c;
    endGame(false);
  }
}

export function wallFrac(){ let a = 0, b = 0; for (const w of walls){ a += w.hp; b += w.max; } return b ? a / b : 1; }
