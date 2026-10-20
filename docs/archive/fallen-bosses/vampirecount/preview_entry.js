// Preview page for the Fallen Count: original full form vs fallen (large, looping idle), strips of every fallen clip, and a game-size row.
import { fallenVampirecount, FALLEN } from './fallen_vampirecount.js';

const BOX = FALLEN.box, DPR = Math.min(2, window.devicePixelRatio || 1);
const app = document.getElementById('app');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

/** A canvas showing the character box at `scale` CSS px per drawing unit. */
function cell(scale, label){
  const w = Math.ceil(BOX.w * scale), hh = Math.ceil(BOX.h * scale);
  const wrap = h('div', 'cell'); const c = document.createElement('canvas'); c.width = w * DPR; c.height = hh * DPR; c.style.width = w + 'px'; c.style.height = hh + 'px';
  wrap.appendChild(c); if (label != null) wrap.appendChild(h('div', 'lbl', label));
  const g = c.getContext('2d');
  return { el:wrap, draw(pose){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(scale * DPR, scale * DPR); g.translate(-BOX.x, -BOX.y); fallenVampirecount(g, pose); g.restore(); } };
}

const anims = [];   // [cellObj, clipName, variant]
const sec = (title, note) => { const s = h('section'); s.appendChild(h('h2', null, title)); if (note) s.appendChild(h('p', 'note', note)); app.appendChild(s); return s; };

// 1. side by side, large, idle loop
{
  const s = sec('The Vampire Count: full form vs. the Fallen Count', 'Idle loop. Left: the game\'s level-20 full form (form2). Right: the nightmare Fallen Count at the same size.');
  const row = h('div', 'row'); s.appendChild(row);
  const sc = 520 / BOX.h;
  for (const [v, lbl] of [['form2', 'form2 (original)'], ['fallen', 'fallen']]){ const c = cell(sc, lbl); row.appendChild(c.el); anims.push([c, 'walk', v]); }
}
// 2. strips of every clip, fallen
{
  const s = sec('Fallen Count: every clip', '8 frames per clip (once clips use t = i / 7, loops t = i / 8). Frames are the registry box, so nothing may touch the edge.');
  const sc = 150 / BOX.h;
  for (const [name, cl] of Object.entries(FALLEN.clips)){
    const row = h('div', 'row strip'); s.appendChild(h('h3', null, `${name}${cl.once ? ' (once)' : ''}`)); s.appendChild(row);
    for (let i = 0; i < 8; i++){ const t = cl.once ? i / 7 : i / 8; const c = cell(sc, i); row.appendChild(c.el); c.draw({ ...cl.pose(t), variant:'fallen' }); }
  }
}
// 3. game size
{
  const s = sec('Game size', 'About 85 px tall figures, as on a phone: original form2 vs. fallen, idle loop, plus one still of every fallen clip.');
  const row = h('div', 'row game'); s.appendChild(row);
  const sc = 85 / 190;   // the figure (crown to shoes, scaled 1.12 about the feet) is about 190 drawing units tall
  for (const [v, lbl] of [['form2', 'form2'], ['fallen', 'fallen']]){ const c = cell(sc, lbl); row.appendChild(c.el); anims.push([c, 'walk', v]); }
  for (const [name, cl] of Object.entries(FALLEN.clips)){ if (name === 'walk') continue; const c = cell(sc, name); row.appendChild(c.el); c.draw({ ...cl.pose(cl.once ? .6 : .25), variant:'fallen' }); }
}

let t0 = performance.now();
function tick(now){
  const ph = (now - t0) / 1000;
  for (const [c, clip, v] of anims){ const cl = FALLEN.clips[clip], i = Math.floor(ph * cl.fps) % cl.n, t = cl.once ? i / (cl.n - 1) : i / cl.n; c.draw({ ...cl.pose(t), variant:v }); }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
// test hook: freeze the loop on a given frame so screenshots are stable
window.__freeze = (frame = 0) => { for (const [c, clip, v] of anims){ const cl = FALLEN.clips[clip], i = frame % cl.n, t = cl.once ? i / (cl.n - 1) : i / cl.n; c.draw({ ...cl.pose(t), variant:v }); } };

// test hook: render every frame of every clip for both variants offscreen and report how close the drawing gets to the box edges (in drawing units)
window.__edges = () => { const sc = 2, c = document.createElement('canvas'); c.width = Math.ceil(BOX.w * sc); c.height = Math.ceil(BOX.h * sc); const g = c.getContext('2d'); const out = {};
  for (const v of ['form2', 'fallen']) for (const [name, cl] of Object.entries(FALLEN.clips)) for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(sc, sc); g.translate(-BOX.x, -BOX.y); fallenVampirecount(g, { ...cl.pose(t), variant:v }); g.restore();
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const k = v + '/' + name, m = { l:x0 / sc, r:(c.width - 1 - x1) / sc, t:y0 / sc, b:(c.height - 1 - y1) / sc }; const o = out[k] || (out[k] = { l:1e9, r:1e9, t:1e9, b:1e9 }); for (const q in m) o[q] = Math.min(o[q], m[q]); }
  return out; };
