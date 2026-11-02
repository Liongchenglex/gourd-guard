// Preview page for the imp riders: each one large and animated (walk, chew and its special clip) beside the game's originals
// (Wisp Rider, Wisp, Imp, Shell Turtle), strips of every clip, and a game-size row at about 60 px.
import { CLIPS } from './riders.js';
import { W1 } from '../../../../src/engine/render/chars/w1.js';
import { W2 } from '../../../../src/engine/render/chars/w2.js';
import { W5 } from '../../../../src/engine/render/chars/w5.js';

const DPR = Math.min(2, window.devicePixelRatio || 1);
const app = document.getElementById('app');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const GAME = {
  rider: { name:'Wisp Rider (game)', ...W2.rider }, wisp: { name:'Wisp (game)', ...W2.wisp }, imp: { name:'Imp (game)', ...W1.imp }, turtle: { name:'Shell Turtle (game)', ...W5.turtle },
};
const KEYS = ['comet', 'turtle'], SPECIAL = { comet:['dash'], turtle:['hide', 'throw'] }, ALL = [...KEYS, 'rotten'];
const IDEA = {
  comet: 'Gameplay idea: cruises at walk pace, then every few seconds stretches out and streaks about a cell and a half down its lane (the dash clip). The first hit breaks the long wisp, which bursts into a plain Wisp in the same lane, and the imp drops to a walk, so one kill leaves two foes.',
  turtle: 'Gameplay idea: plods head first, slow and tough (shell hp like the Shell Turtle, the imp 2 hp on top). After every hit the turtle hides in its shell for 2 s (hide clip, held, then played backwards) and only Grey (pierce) or lightning hurts it. Every few seconds the imp pulls a rotten pumpkin from the net on the shell and hurls it down the lane (throw clip); it flies as its own sprite and splats on the wall (what the splat does is the owner\'s call).',
};

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
// once clips loop with a pause on the last frame (and play back out for hide) so the preview reads like the game
const frameOf = (en, clip, i) => { const cl = en.clips[clip]; if (!cl.once){ const k = i % cl.n; return cl.pose(k / cl.n); }
  const n = cl.n, cyc = n * 2 + 8, k = i % cyc, f = k < n ? k : k < n + 4 ? n - 1 : k < n * 2 + 4 ? n * 2 + 3 - k : 0; return cl.pose(f / (n - 1)); };

// 1. large, animated, beside the originals
for (const key of KEYS){
  const en = CLIPS[key], s = sec(en.name, IDEA[key]);
  const row = h('div', 'row'); s.appendChild(row);
  for (const clip of ['walk', 'chew', ...SPECIAL[key]]){ const c = cell(en, key === 'comet' ? 1.5 : 1.9, `${clip}`); row.appendChild(c.el); anims.push([c, en, clip]); }
  const orig = key === 'comet' ? [[GAME.rider, 'ride'], [GAME.wisp, 'walk'], [GAME.imp, 'walk']] : [[GAME.turtle, 'walk'], [GAME.imp, 'walk']];
  if (key === 'turtle') for (const clip of ['fly', 'splat']){ const c = cell(CLIPS.rotten, 1.9, `rotten pumpkin: ${clip}`); row.appendChild(c.el); anims.push([c, CLIPS.rotten, clip]); }
  for (const [o, clip] of orig){ const c = cell(o, 1.5, o.name); row.appendChild(c.el); anims.push([c, o, clip]); }
}
// 2. strips
for (const key of ALL){
  const en = CLIPS[key], s = sec(`${en.name}: every clip`, 'Once clips use t = i / (n - 1), loops t = i / n. Frames are the registry box.');
  for (const [name, cl] of Object.entries(en.clips)){
    s.appendChild(h('h3', null, `${name} (${cl.n} frames, ${cl.fps} fps${cl.once ? ', once' : ''})`)); const row = h('div', 'row strip'); s.appendChild(row);
    for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n; const c = cell(en, .85, i); row.appendChild(c.el); c.draw(cl.pose(t)); }
  }
}
// 3. game size: the game's Wisp Rider (ride) at its in-game scale so its figure is about 60 px, everything else at the same px per game unit
{
  const s = sec('Game size', 'Every monster at the same pixels per game unit, with the game\'s Wisp Rider (riding) about 60 px tall. The riders use their suggested scale (Comet Rider 0.5 like the Wisp Rider; Turtle Rider 0.56 vs the Shell Turtle\'s 0.66).');
  const row = h('div', 'row game'); s.appendChild(row);
  const base = 60 / 120 / GAME.rider.scale;   // px per game unit: the riding Wisp Rider is about 120 drawing units tall
  for (const [o, clip, lbl] of [[GAME.rider, 'ride', 'Wisp Rider'], [GAME.imp, 'walk', 'Imp'], [GAME.turtle, 'walk', 'Shell Turtle']]){ const c = cell(o, base * o.scale, lbl); row.appendChild(c.el); anims.push([c, o, clip]); }
  for (const key of ALL){ const en = CLIPS[key]; for (const clip of Object.keys(en.clips)){ const c = cell(en, base * en.scale, clip); row.appendChild(c.el); anims.push([c, en, clip]); } }
}

const t0 = performance.now();
function tick(now){ const ph = (now - t0) / 1000; for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, Math.floor(ph * en.clips[clip].fps))); requestAnimationFrame(tick); }
requestAnimationFrame(tick);
// test hooks: freeze every animated cell on one frame; measure how close any frame comes to its box edges (drawing units)
window.__freeze = (frame = 0) => { for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, frame)); };
window.__edges = () => { const out = {}; for (const key of ALL){ const en = CLIPS[key], B = en.box, sc = 2, c = document.createElement('canvas'); c.width = Math.ceil(B.w * sc); c.height = Math.ceil(B.h * sc); const g = c.getContext('2d');
  for (const [name, cl] of Object.entries(en.clips)) for (let i = 0; i < cl.n; i++){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(sc, sc); g.translate(-B.x, -B.y); en.draw(g, cl.pose(cl.once ? i / (cl.n - 1) : i / cl.n)); g.restore();
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const k = key + '/' + name, m = { l:x0 / sc, r:(c.width - 1 - x1) / sc, t:y0 / sc, b:(c.height - 1 - y1) / sc }, o = out[k] || (out[k] = { l:1e9, r:1e9, t:1e9, b:1e9 }); for (const q in m) o[q] = Math.min(o[q], m[q]); } }
  return out; };
// a still of both riders for idle.png
window.__idle = () => { document.body.innerHTML = ''; const row = h('div', 'row'); row.style.padding = '12px'; document.body.appendChild(row);
  for (const [key, clip, t, sc] of [['comet', 'walk', .25, 1.5], ['comet', 'dash', .25, 1.5], ['turtle', 'walk', .25, 1.9]]){ const en = CLIPS[key], c = cell(en, sc, `${en.name}: ${clip}`); row.appendChild(c.el); c.draw(en.clips[clip].pose(t)); } };
