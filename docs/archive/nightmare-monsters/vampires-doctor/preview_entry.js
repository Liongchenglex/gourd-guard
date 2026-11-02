// Preview page for the nightmare vampires and the Rot Doctor: each look large and animated beside the game's monster,
// strips of every clip, and a game-size row.
import { NM_VAMPIRES } from './nm_vampires.js';
import { NM_DOCTOR } from './nm_doctor.js';

const DPR = Math.min(2, window.devicePixelRatio || 1);
const app = document.getElementById('app');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

/** A canvas showing an entry's box at `scale` CSS px per drawing unit. */
function cell(E, scale, label){
  const B = E.box, w = Math.ceil(B.w * scale), hh = Math.ceil(B.h * scale);
  const wrap = h('div', 'cell'); const c = document.createElement('canvas'); c.width = w * DPR; c.height = hh * DPR; c.style.width = w + 'px'; c.style.height = hh + 'px';
  wrap.appendChild(c); if (label != null) wrap.appendChild(h('div', 'lbl', label));
  const g = c.getContext('2d');
  return { el:wrap, draw(pose){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(scale * DPR, scale * DPR); g.translate(-B.x, -B.y); E.draw(g, { ...pose, variant:E.variant }); g.restore(); } };
}
const anims = [];   // [cell, entry, clipName]
const sec = (title, note) => { const s = h('section'); s.appendChild(h('h2', null, title)); if (note) s.appendChild(h('p', 'note', note)); app.appendChild(s); return s; };

const GROUPS = [
  { title:'Nightmare vampires (Crumbling Keep: thunderstorm, crimson)', base:NM_VAMPIRES.vampire, looks:[NM_VAMPIRES.glutton, NM_VAMPIRES.bride],
    notes:{ glutton:'Squat and gorged: barrel body in a bursting crimson waistcoat, huge arms in broken manacles, bald head with a lightning scar, tusks and a bloody chin. Heals by drinking from an iron goblet.',
      bride:'Tall, slim and floating: a bat-wing mantle standing up behind her, long black hair with a white lightning lock, iron tiara and torn veil, a crimson gown whose hem breaks up into bats.' } },
  { title:'Nightmare Plague Doctor (Foggy Hollow: poison fog, rot, ghostfire)', base:NM_DOCTOR.doctor, looks:[NM_DOCTOR.rotdoctor],
    notes:{ rotdoctor:'Tattered, mould-spotted coat dripping ooze, cracked mask and broken dripping beak, ghostfire lenses, a skull lantern pouring ghostfire instead of the censer, poison vials, a carrion crow on the ragged hat, poison fog at the feet.' } },
];
const keyOf = E => Object.entries({ ...NM_VAMPIRES, ...NM_DOCTOR }).find(([, v]) => v === E)[0];

for (const G of GROUPS){
  // 1. large, walking, beside the game's monster
  const s = sec(G.title, 'Walk loop, large. Left: the monster as it is in the game. ' + G.looks.map(L => `${L.name}: ${G.notes[keyOf(L)]}`).join(' '));
  const row = h('div', 'row'); s.appendChild(row);
  for (const E of [G.base, ...G.looks]){ const c = cell(E, 2.6, E.name); row.appendChild(c.el); anims.push([c, E, 'walk']); }
  // 2. every clip as strips
  for (const L of G.looks){
    s.appendChild(h('h3', null, `${L.name}: every clip`));
    for (const [name, cl] of Object.entries(L.clips)){
      const r = h('div', 'row strip'); s.appendChild(h('div', 'lbl', `${name} (${cl.n} frames${cl.once ? ', once' : ''})`)); s.appendChild(r);
      for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n; const c = cell(L, 1.05, i); r.appendChild(c.el); c.draw(cl.pose(t)); }
    }
  }
}
// 3. game size
{
  const s = sec('Game size', 'About the size on a phone (a fodder monster is 50 to 70 px tall): each game monster beside its nightmare looks, walking, then a still of chew and heal.');
  const row = h('div', 'row game'); s.appendChild(row);
  for (const G of GROUPS) for (const E of [G.base, ...G.looks]){ const sc = E.scale * .82; const c = cell(E, sc, E.name.replace(' (game)', '')); row.appendChild(c.el); anims.push([c, E, 'walk']); }
  const row2 = h('div', 'row game'); s.appendChild(row2);
  for (const G of GROUPS) for (const E of G.looks) for (const name of ['chew', 'heal']){ const cl = E.clips[name], c = cell(E, E.scale * .82, name); row2.appendChild(c.el); c.draw(cl.pose(cl.once ? .5 : .25)); }
}

const t0 = performance.now();
function tick(now){
  const ph = (now - t0) / 1000;
  for (const [c, E, clip] of anims){ const cl = E.clips[clip], i = Math.floor(ph * cl.fps) % cl.n; c.draw(cl.pose(cl.once ? i / (cl.n - 1) : i / cl.n)); }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.__freeze = (frame = 0) => { for (const [c, E, clip] of anims){ const cl = E.clips[clip], i = frame % cl.n; c.draw(cl.pose(cl.once ? i / (cl.n - 1) : i / cl.n)); } };
// test hook: how close every frame of every clip gets to the box edges (drawing units; negative never happens, 0 = touching)
window.__edges = () => { const out = {};
  for (const [key, E] of Object.entries({ ...NM_VAMPIRES, ...NM_DOCTOR })){ const B = E.box, sc = 2, c = document.createElement('canvas'); c.width = Math.ceil(B.w * sc); c.height = Math.ceil(B.h * sc); const g = c.getContext('2d');
    for (const [name, cl] of Object.entries(E.clips)) for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(sc, sc); g.translate(-B.x, -B.y); E.draw(g, { ...cl.pose(t), variant:E.variant }); g.restore();
      const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const m = { l:x0 / sc, r:(c.width - 1 - x1) / sc, t:y0 / sc, b:(c.height - 1 - y1) / sc }, o = out[key] || (out[key] = { l:1e9, r:1e9, t:1e9, b:1e9 }); for (const q in m) o[q] = Math.min(o[q], m[q]); } }
  return out; };
