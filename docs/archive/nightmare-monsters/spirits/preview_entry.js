// Preview page for the spirits: each one large and animated (walk, chew and its special clip) beside the game's originals
// (Wraith, Poltergeist, Fogwalker), strips of every clip, and a game-size row at about 60 px.
import { CLIPS } from './spirits.js';
import { W2 } from '../../../../src/engine/render/chars/w2.js';

const DPR = Math.min(2, window.devicePixelRatio || 1);
const app = document.getElementById('app');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const GAME = {
  wraith: { name:'Wraith (game)', ...W2.wraith }, poltergeist: { name:'Poltergeist (game boss)', ...W2.poltergeist }, fogwalker: { name:'Fogwalker (game)', ...W2.fogwalker },
};
const KEYS = ['reaper', 'minipolt', 'fogwalker2'], SPECIAL = { reaper:['reap'], minipolt:['toss'], fogwalker2:['exhale'] }, ALL = [...KEYS, 'junk'];
const ORIG = { reaper:[[GAME.wraith, 'walk']], minipolt:[[GAME.poltergeist, 'walk']], fogwalker2:[[GAME.fogwalker, 'walk']] };
const BIG = { reaper:1.6, minipolt:1.9, fogwalker2:1.5 };
const IDEA = {
  reaper: 'Gameplay proposal: glides (no feet), so landmines and puddles do not catch it and it never stumbles on graves. At the wall, every few seconds instead of one chew it reaps (the reap clip): one wide sweep that hits the wall in its own lane and both neighbouring walls for a chew\'s damage each. Killing it before it reaches the wall is the answer.',
  minipolt: 'Gameplay proposal: three pieces of junk orbit it and each one blocks a pumpkin (the pumpkin breaks the junk, not the ghost), so it takes 1 + junk hits. Every few seconds it tosses a piece down its lane (the toss clip, then the teacup projectile), which chips the wall in its lane and leaves it one piece lighter. Small and quick like a Wisp.',
  fogwalker2: 'Gameplay proposal: carries a Fogwalker\'s fog band across its row, but takes 3 hits. Every few seconds it exhales (the exhale clip): its band swells to about twice its height for 3 s, hiding the rows around it. A Lantern shows it as usual.',
};

function cell(en, scale, label){
  const B = en.box, w = Math.ceil(B.w * scale), hh = Math.ceil(B.h * scale);
  const wrap = h('div', 'cell'); const c = document.createElement('canvas'); c.width = w * DPR; c.height = hh * DPR; c.style.width = w + 'px'; c.style.height = hh + 'px';
  wrap.appendChild(c); if (label != null) wrap.appendChild(h('div', 'lbl', label));
  const g = c.getContext('2d');
  return { el:wrap, draw(pose){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(scale * DPR, scale * DPR); g.translate(-B.x, -B.y); en.draw(g, pose); g.restore(); } };
}
const anims = [];
const sec = (title, note) => { const s = h('section'); s.appendChild(h('h2', null, title)); if (note) s.appendChild(h('p', 'note', note)); app.appendChild(s); return s; };
const frameOf = (en, clip, i) => { const cl = en.clips[clip]; if (!cl.once){ const k = i % cl.n; return cl.pose(k / cl.n); }
  const n = cl.n, cyc = n + 10, k = i % cyc, f = k < n ? k : n - 1; return k < n + 4 ? cl.pose(f / (n - 1)) : en.clips.walk.pose(0); };

for (const key of KEYS){
  const en = CLIPS[key], s = sec(en.name, IDEA[key]);
  const row = h('div', 'row'); s.appendChild(row);
  for (const clip of ['walk', 'chew', ...SPECIAL[key]]){ const c = cell(en, BIG[key], clip); row.appendChild(c.el); anims.push([c, en, clip]); }
  if (key === 'minipolt'){ const c = cell(CLIPS.junk, 1.9, 'teacup: fly'); row.appendChild(c.el); anims.push([c, CLIPS.junk, 'fly']); }
  for (const [o, clip] of ORIG[key]){ const c = cell(o, key === 'minipolt' ? .9 : 1.5, o.name); row.appendChild(c.el); anims.push([c, o, clip]); }
}
for (const key of ALL){
  const en = CLIPS[key], s = sec(`${en.name}: every clip`, 'Once clips use t = i / (n - 1), loops t = i / n. Frames are the registry box.');
  for (const [name, cl] of Object.entries(en.clips)){
    s.appendChild(h('h3', null, `${name} (${cl.n} frames, ${cl.fps} fps${cl.once ? ', once' : ''})`)); const row = h('div', 'row strip'); s.appendChild(row);
    for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n; const c = cell(en, .85, i); row.appendChild(c.el); c.draw(cl.pose(t)); }
  }
}
{
  const s = sec('Game size', 'Every monster at the same pixels per game unit, with the game\'s Fogwalker about 60 px tall. Suggested scales: Reaper 0.56, Mini Poltergeist 0.5, Fogwalker 2 0.66 (the Fogwalker is 0.6, the Wraith 0.56, the Poltergeist 0.6).');
  const row = h('div', 'row game'); s.appendChild(row);
  const base = 60 / 170 / GAME.fogwalker.scale;   // the Fogwalker with its lantern is about 170 drawing units tall
  for (const [o, clip, lbl] of [[GAME.wraith, 'walk', 'Wraith'], [GAME.fogwalker, 'walk', 'Fogwalker'], [GAME.poltergeist, 'walk', 'Poltergeist']]){ const c = cell(o, base * o.scale, lbl); row.appendChild(c.el); anims.push([c, o, clip]); }
  for (const key of ALL){ const en = CLIPS[key]; for (const clip of Object.keys(en.clips)){ const c = cell(en, base * en.scale, clip); row.appendChild(c.el); anims.push([c, en, clip]); } }
}

const t0 = performance.now();
function tick(now){ const ph = (now - t0) / 1000; for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, Math.floor(ph * en.clips[clip].fps))); requestAnimationFrame(tick); }
requestAnimationFrame(tick);
window.__freeze = (frame = 0) => { for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, frame)); };
window.__edges = () => { const out = {}; for (const key of ALL){ const en = CLIPS[key], B = en.box, sc = 2, c = document.createElement('canvas'); c.width = Math.ceil(B.w * sc); c.height = Math.ceil(B.h * sc); const g = c.getContext('2d');
  for (const [name, cl] of Object.entries(en.clips)) for (let i = 0; i < cl.n; i++){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(sc, sc); g.translate(-B.x, -B.y); en.draw(g, cl.pose(cl.once ? i / (cl.n - 1) : i / cl.n)); g.restore();
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const k = key + '/' + name, m = { l:x0 / sc, r:(c.width - 1 - x1) / sc, t:y0 / sc, b:(c.height - 1 - y1) / sc }, o = out[k] || (out[k] = { l:1e9, r:1e9, t:1e9, b:1e9 }); for (const q in m) o[q] = Math.min(o[q], m[q]); } }
  return out; };
window.__idle = () => { document.body.innerHTML = ''; const row = h('div', 'row'); row.style.padding = '12px'; document.body.appendChild(row);
  for (const [key, clip, t, sc] of [['reaper', 'walk', .25, 1.25], ['reaper', 'reap', .6, 1.25], ['minipolt', 'walk', .1, 1.6], ['minipolt', 'toss', .5, 1.6], ['fogwalker2', 'walk', .25, 1.3], ['fogwalker2', 'exhale', .55, 1.3]]){ const en = CLIPS[key], c = cell(en, sc, `${en.name}: ${clip}`); row.appendChild(c.el); c.draw(en.clips[clip].pose(t)); } };
