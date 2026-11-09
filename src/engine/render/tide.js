// ---------- The rising blood tide (Release 9): the surge wave and the wave icon ----------
// The surge wave is a crimson crest strip as wide as the field, baked once per canvas scale into SURGE_FRAMES frames stacked in one canvas;
// a surge blits one frame at the leading shore (one drawImage a frame, no fill or stroke; perf rule). The wave icon is a small baked
// disc for cards and marks. Only called from code gated on `__RELEASE__ >= 9`.

import { W } from '../state.js';
import { K } from './canvas.js';
import { TAU } from '../util.js';

export const SURGE_FRAMES = 6, CREST_H = 44;
const cache = new Map();

/** The crest strip: all frames stacked, `{ c, k }`; frame i is the rows i * CREST_H .. (i + 1) * CREST_H (in game pixels). */
export function crestStrip(k = K){
  k = Math.min(2.5, Math.max(0.5, k || 1)); const key = 'crest:' + k.toFixed(2);
  let sp = cache.get(key); if (sp) return sp;
  const c = document.createElement('canvas'); c.width = Math.ceil(W * k); c.height = Math.ceil(CREST_H * SURGE_FRAMES * k);
  const g = c.getContext('2d'); g.scale(k, k);
  for (let f = 0; f < SURGE_FRAMES; f++){
    const ph = f / SURGE_FRAMES * TAU, top = x => 20 + Math.sin(x / W * TAU * 3 + ph) * 5 + Math.sin(x / W * TAU * 7 - ph * 2) * 2;
    g.save(); g.translate(0, f * CREST_H);
    g.beginPath(); g.moveTo(0, top(0)); for (let x = 5; x <= W; x += 5) g.lineTo(x, top(x)); g.lineTo(W, CREST_H); g.lineTo(0, CREST_H); g.closePath();
    const gr = g.createLinearGradient(0, 10, 0, CREST_H); gr.addColorStop(0, 'rgba(200,28,32,.9)'); gr.addColorStop(1, 'rgba(120,12,14,0)'); g.fillStyle = gr; g.fill();
    g.lineCap = 'round'; g.lineWidth = 3; g.strokeStyle = 'rgba(255,150,140,.85)';
    g.beginPath(); g.moveTo(0, top(0)); for (let x = 5; x <= W; x += 5) g.lineTo(x, top(x)); g.stroke();
    for (let i = 0; i < 16; i++){ const x = ((i * 53 + f * 19) % W), y = top(x) - 1 - (i % 3); g.fillStyle = 'rgba(255,214,208,.8)'; g.beginPath(); g.ellipse(x, y, 3 + (i % 4), 1.6, 0, 0, TAU); g.fill(); }
    g.restore();
  }
  sp = { c, k }; cache.set(key, sp); return sp;
}

/** A small wave icon (a crimson disc with two crests), `size` css px. */
export function tideIcon(size = 28, k = K){
  k = Math.min(2.5, Math.max(0.5, k || 1)); const key = 'icon:' + size + ':' + k.toFixed(2);
  let sp = cache.get(key); if (sp) return sp;
  const c = document.createElement('canvas'); c.width = c.height = Math.ceil(size * k);
  const g = c.getContext('2d'); g.scale(k * size / 28, k * size / 28);
  g.fillStyle = '#7a0f14'; g.beginPath(); g.arc(14, 14, 13, 0, TAU); g.fill();
  g.strokeStyle = '#ff9a8c'; g.lineWidth = 2.4; g.lineCap = 'round';
  for (const y of [11, 18]){ g.beginPath(); g.moveTo(5, y); g.bezierCurveTo(9, y - 5, 12, y + 5, 14, y); g.bezierCurveTo(16, y - 5, 19, y + 5, 23, y); g.stroke(); }
  sp = c; cache.set(key, sp); return sp;
}

export function prebakeTide(){ crestStrip(K); }
