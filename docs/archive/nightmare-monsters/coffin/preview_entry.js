// Preview page for Casket Jack (nightmare Pumpkin Patch): large and animated (walk, chew, summon with the game's mummy stepping out,
// the field coffin opening), strips of every clip, and a game-size row beside the game's mummy and Gravekeeper.
import { CLIPS } from './coffin.js';
import { W1 } from '../../../../src/engine/render/chars/w1.js';

const DPR = Math.min(2, window.devicePixelRatio || 1);
const app = document.getElementById('app');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const MUMMY = { name:'Mummy (game)', ...W1.mummy }, GK = { name:'Gravekeeper (game)', ...W1.gravekeeper }, JACK = CLIPS.casketjack, COF = CLIPS.coffin;

function canvasCell(B, scale, label){
  const w = Math.ceil(B.w * scale), hh = Math.ceil(B.h * scale);
  const wrap = h('div', 'cell'); const c = document.createElement('canvas'); c.width = w * DPR; c.height = hh * DPR; c.style.width = w + 'px'; c.style.height = hh + 'px';
  wrap.appendChild(c); if (label != null) wrap.appendChild(h('div', 'lbl', label));
  const g = c.getContext('2d');
  return { el:wrap, paint(fn){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(scale * DPR, scale * DPR); g.translate(-B.x, -B.y); fn(g); g.restore(); } };
}
function cell(en, scale, label){ const c = canvasCell(en.box, scale, label); return { el:c.el, draw(pose){ c.paint(g => en.draw(g, pose)); } }; }
const anims = [];   // [cell, entry, clipName]
const custom = [];  // (seconds) => void
const sec = (title, note) => { const s = h('section'); s.appendChild(h('h2', null, title)); if (note) s.appendChild(h('p', 'note', note)); app.appendChild(s); return s; };
const frameOf = (en, clip, i) => { const cl = en.clips[clip], k = i % cl.n; return cl.pose(cl.once ? k / (cl.n - 1) : k / cl.n); };

// The summon scene: Casket Jack plays `summon` (10 frames at 12 fps), the game's mummy steps out in front of it as the lid slams,
// walks a few steps toward the viewer, then the loop rests on the walk and starts again.
const SCENE = { x:-120, y:-96, w:240, h:220 }, MS = W1.mummy.scale / JACK.scale;   // mummy size relative to Casket Jack, both in Jack's drawing units
function scene(g, s){
  const sumDur = JACK.clips.summon.n / JACK.clips.summon.fps, cyc = 3.2, t = s % cyc;
  const sumT = Math.min(1, t / sumDur), fi = Math.min(JACK.clips.summon.n - 1, Math.floor(t * JACK.clips.summon.fps));
  const out = t > sumDur * .72;   // the mummy appears as the hands withdraw
  const mt = out ? t - sumDur * .72 : 0, my = 8 + Math.min(1, mt / 1.6) * 48, mx = 6 + Math.min(1, mt / 1.6) * 34;
  const drawJack = () => { if (t < sumDur) JACK.draw(g, JACK.clips.summon.pose(fi / (JACK.clips.summon.n - 1))); else JACK.draw(g, { walk:((t - sumDur) * 8 / 8) % 1 }); };
  drawJack();
  if (out){ g.save(); g.translate(mx, my); g.scale(MS, MS); const a = Math.min(1, mt / .18); g.globalAlpha = a; W1.mummy.draw(g, { walk:(mt * 7 / 8) % 1 }); g.restore(); }
  void sumT;
}

// 1. large, animated
{
  const s = sec('Casket Jack', 'Nightmare Pumpkin Patch. A walking pumpkin-wood coffin with a jack-o\'-lantern face carved in the lid, a stem and vine sprouting from the head end, a twine belt, root legs and a rusty spade. Proposed: every 8 s it stops, its lid creaks open and a mummy steps out into its lane in front of it. When it falls it leaves a field coffin that bursts open 3 s later with one last mummy unless a pumpkin smashes it first.');
  const row = h('div', 'row'); s.appendChild(row);
  for (const clip of ['walk', 'chew']){ const c = cell(JACK, 2.2, `Casket Jack: ${clip}`); row.appendChild(c.el); anims.push([c, JACK, clip]); }
  const sc = canvasCell(SCENE, 2.0, 'summon: a game mummy steps out'); row.appendChild(sc.el); custom.push(t => sc.paint(g => scene(g, t)));
  const cof = canvasCell(COF.box, 2.2, 'field coffin: idle, then open'); row.appendChild(cof.el);
  custom.push(t => { const cyc = 2.6, u = t % cyc; cof.paint(g => { if (u < 1.4) COF.draw(g, frameOf(COF, 'idle', Math.floor(u * COF.clips.idle.fps))); else { const i = Math.min(COF.clips.open.n - 1, Math.floor((u - 1.4) * COF.clips.open.fps)); COF.draw(g, frameOf(COF, 'open', i)); } }); });
}
// 2. strips
for (const en of [JACK, COF]){
  const s = sec(`${en.name}: every clip`, 'Once clips use t = i / (n - 1), loops t = i / n. Frames are the registry box.');
  for (const [name, cl] of Object.entries(en.clips)){
    s.appendChild(h('h3', null, `${name} (${cl.n} frames, ${cl.fps} fps${cl.once ? ', once' : ''})`)); const row = h('div', 'row strip'); s.appendChild(row);
    for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n; const c = cell(en, 1, i); row.appendChild(c.el); c.draw(cl.pose(t)); }
  }
}
// 3. game size: the game's mummy (wrap to feet ~108 units at scale .6) at about 60 px; everything else at its in-game scale relative to it
{
  const s = sec('Game size', 'The game\'s Mummy at about 60 px tall and the Gravekeeper boss, then Casket Jack (suggested scale .62) walking, chewing and summoning, and the field coffin (same scale).');
  const row = h('div', 'row game'); s.appendChild(row);
  const base = 60 / (108 * MUMMY.scale);   // px per game unit
  { const c = cell(MUMMY, base * MUMMY.scale, 'Mummy'); row.appendChild(c.el); anims.push([c, MUMMY, 'walk']); }
  { const c = cell(GK, base * GK.scale, 'Gravekeeper'); row.appendChild(c.el); anims.push([c, GK, 'walk']); }
  for (const clip of Object.keys(JACK.clips)){ const c = cell(JACK, base * JACK.scale, clip); row.appendChild(c.el); anims.push([c, JACK, clip]); }
  for (const clip of Object.keys(COF.clips)){ const c = cell(COF, base * COF.scale, 'coffin ' + clip); row.appendChild(c.el); anims.push([c, COF, clip]); }
}

const t0 = performance.now();
function tick(now){ const ph = (now - t0) / 1000; for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, Math.floor(ph * en.clips[clip].fps))); for (const f of custom) f(ph); requestAnimationFrame(tick); }
requestAnimationFrame(tick);
// test hooks: freeze on a time; measure how close any frame comes to its box edges (drawing units)
window.__freeze = (sec = 0) => { for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, Math.floor(sec * en.clips[clip].fps))); for (const f of custom) f(sec); };
window.__edges = () => { const out = {}; for (const en of [JACK, COF]){ const B = en.box, sc = 2, c = document.createElement('canvas'); c.width = Math.ceil(B.w * sc); c.height = Math.ceil(B.h * sc); const g = c.getContext('2d');
  for (const [name, cl] of Object.entries(en.clips)) for (let i = 0; i < cl.n; i++){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(sc, sc); g.translate(-B.x, -B.y); en.draw(g, frameOf(en, name, i)); g.restore();
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const k = en.name + '/' + name, m = { l:x0 / sc, r:(c.width - 1 - x1) / sc, t:y0 / sc, b:(c.height - 1 - y1) / sc }, o = out[k] || (out[k] = { l:1e9, r:1e9, t:1e9, b:1e9 }); for (const q in m) o[q] = Math.min(o[q], m[q]); } }
  return out; };
