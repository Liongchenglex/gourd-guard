// Preview page for the nightmare mounted knights: each one large and animated (walk + its special clip), strips of every clip,
// and a game-size row beside the Crumbling Keep Shield Knight from the game for scale.
import { CLIPS } from './knights.js';
import { W4 } from '../../../../src/engine/render/chars/w4.js';

const DPR = Math.min(2, window.devicePixelRatio || 1);
const app = document.getElementById('app');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const KNIGHT = { name:'Shield Knight (game)', draw:W4.knight.draw, scale:W4.knight.scale, box:W4.knight.box, clips:W4.knight.clips };

/** A canvas showing entry `en`'s box at `scale` CSS px per drawing unit. */
function cell(en, scale, label){
  const B = en.box, w = Math.ceil(B.w * scale), hh = Math.ceil(B.h * scale);
  const wrap = h('div', 'cell'); const c = document.createElement('canvas'); c.width = w * DPR; c.height = hh * DPR; c.style.width = w + 'px'; c.style.height = hh + 'px';
  wrap.appendChild(c); if (label != null) wrap.appendChild(h('div', 'lbl', label));
  const g = c.getContext('2d');
  return { el:wrap, draw(pose){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(scale * DPR, scale * DPR); g.translate(-B.x, -B.y); en.draw(g, pose); g.restore(); } };
}
const anims = [];   // [cell, entry, clipName]
const sec = (title, note) => { const s = h('section'); s.appendChild(h('h2', null, title)); if (note) s.appendChild(h('p', 'note', note)); app.appendChild(s); return s; };

// 1. large, animated
{
  const s = sec('Nightmare knights: Storm Lancer and Storm Marshal', 'Crumbling Keep nightmare (thunderstorm). Each knight large, looping its walk and its special clip.');
  const row = h('div', 'row'); s.appendChild(row);
  for (const [key, special] of [['jouster', 'charge'], ['commander', 'command']]){ const en = CLIPS[key], sc = 2.3;
    for (const clip of ['walk', special]){ const c = cell(en, sc, `${en.name}: ${clip}`); row.appendChild(c.el); anims.push([c, en, clip]); } }
}
// 2. strips
for (const key of ['jouster', 'commander']){
  const en = CLIPS[key], s = sec(`${en.name}: every clip`, 'Once clips use t = i / (n - 1), loops t = i / n. Frames are the registry box.');
  for (const [name, cl] of Object.entries(en.clips)){
    s.appendChild(h('h3', null, `${name} (${cl.n} frames, ${cl.fps} fps${cl.once ? ', once' : ''})`)); const row = h('div', 'row strip'); s.appendChild(row);
    for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n; const c = cell(en, 1.05, i); row.appendChild(c.el); c.draw(cl.pose(t)); }
  }
}
// 3. game size: the Shield Knight's figure (plume to boots, ~126 units) at 60 px; the mounted knights at their suggested scale relative to it
{
  const s = sec('Game size', 'The Shield Knight from the game at about 60 px tall, then the mounted knights at their suggested in-game scale (0.62 vs the knight\'s 0.66), animated, plus stills of each special clip.');
  const row = h('div', 'row game'); s.appendChild(row);
  const base = 60 / 126 / KNIGHT.scale;   // px per game unit
  { const c = cell(KNIGHT, base * KNIGHT.scale, 'Shield Knight'); row.appendChild(c.el); anims.push([c, KNIGHT, 'walk']); }
  for (const key of ['jouster', 'commander']){ const en = CLIPS[key], sc = base * en.scale;
    for (const clip of Object.keys(en.clips)){ const c = cell(en, sc, clip); row.appendChild(c.el); anims.push([c, en, clip]); } }
}

const t0 = performance.now();
const frameOf = (en, clip, i) => { const cl = en.clips[clip], k = i % cl.n; return cl.pose(cl.once ? k / (cl.n - 1) : k / cl.n); };
function tick(now){ const ph = (now - t0) / 1000; for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, Math.floor(ph * en.clips[clip].fps))); requestAnimationFrame(tick); }
requestAnimationFrame(tick);
// test hooks: freeze every animated cell on one frame; measure how close any frame comes to its box edges (drawing units)
window.__freeze = (frame = 0) => { for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, frame)); };
window.__edges = () => { const out = {}; for (const key of ['jouster', 'commander']){ const en = CLIPS[key], B = en.box, sc = 2, c = document.createElement('canvas'); c.width = Math.ceil(B.w * sc); c.height = Math.ceil(B.h * sc); const g = c.getContext('2d');
  for (const [name, cl] of Object.entries(en.clips)) for (let i = 0; i < cl.n; i++){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(sc, sc); g.translate(-B.x, -B.y); en.draw(g, frameOf(en, name, i)); g.restore();
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const k = key + '/' + name, m = { l:x0 / sc, r:(c.width - 1 - x1) / sc, t:y0 / sc, b:(c.height - 1 - y1) / sc }, o = out[k] || (out[k] = { l:1e9, r:1e9, t:1e9, b:1e9 }); for (const q in m) o[q] = Math.min(o[q], m[q]); } }
  return out; };
