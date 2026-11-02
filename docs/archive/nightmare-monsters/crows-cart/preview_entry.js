// Preview page for the Swooping Crows and the Lobber Cart: each one large and animated (every clip) beside the game's originals
// (Bat, Imp, a Green pumpkin), strips of every clip, and a game-size row at about 60 px.
import { CLIPS } from './crows-cart.js';
import { W1, pumpkin } from '../../../../src/engine/render/chars/w1.js';
import { pal } from '../../../../src/engine/render/paint.js';

const DPR = Math.min(2, window.devicePixelRatio || 1);
const app = document.getElementById('app');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const GREEN = pal('#5c9c33');
const GAME = {
  bat: { name:'Bat (game)', ...W1.bat }, imp: { name:'Imp (game)', ...W1.imp },
  pumpkin: { name:'Green pumpkin (game)', draw:g => pumpkin(g, GREEN, false, 40), scale:.6, box:{ x:-70, y:-95, w:140, h:148 }, clips:{ still:{ n:1, fps:1, pose:() => ({}) } } },
};
const KEYS = ['crows', 'cart', 'netted'], ALL = ['crows', 'crow', 'cart', 'net', 'netted'];
const IDEA = {
  crows: 'Gameplay idea (proposal): a flying flock of three that counts as one monster in its lane, fast like the Swift Bat. It cruises (fly), and every few seconds folds its wings and swoops about a cell and a half down the lane (swoop). Each hit knocks one crow out of the flock (variants c2 and c1 draw what is left), so it takes three hits, but a Black splash or Grey pierce hits the whole flock at once. Flying, so it passes over graves, mines and puddles.',
  cart: 'Gameplay idea (proposal): rolls in slowly and parks in the back rows of its lane (it never comes down to the wall). Every 6 to 8 seconds the goblin cranks the arm back and lobs a net onto a random pumpkin in the patch (lob, then the net sprite flies down to the cell). Tough (about 6 hp) and out of reach of short shots, so the player has to make a point of hitting it.',
  netted: 'Gameplay idea (proposal): a netted pumpkin is locked: it cannot be slid or flicked, and blocks slides through its cell. It breaks free (snap) when a bunch is matched next to it, or by itself after about 8 seconds; it struggles (struggle) for the last 2 seconds as a warning. Killing the Lobber Cart frees every net at once.',
};
const ORIG = { crows:[[GAME.bat, 'walk']], cart:[[GAME.imp, 'walk']], netted:[[GAME.pumpkin, 'still']] };
const EXTRA = { crows:[['crow', 'fly'], ['crow', 'swoop']], cart:[['net', 'fly']], netted:[] };

function cell(en, scale, label, variant){
  const B = en.box, w = Math.ceil(B.w * scale), hh = Math.ceil(B.h * scale);
  const wrap = h('div', 'cell'); const c = document.createElement('canvas'); c.width = w * DPR; c.height = hh * DPR; c.style.width = w + 'px'; c.style.height = hh + 'px';
  wrap.appendChild(c); if (label != null) wrap.appendChild(h('div', 'lbl', label));
  const g = c.getContext('2d');
  return { el:wrap, draw(pose){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(scale * DPR, scale * DPR); g.translate(-B.x, -B.y); en.draw(g, variant ? { ...pose, variant } : pose); g.restore(); } };
}
const anims = [];   // [cell, entry, clipName]
const sec = (title, note) => { const s = h('section'); s.appendChild(h('h2', null, title)); if (note) s.appendChild(h('p', 'note', note)); app.appendChild(s); return s; };
const frameOf = (en, clip, i) => { const cl = en.clips[clip]; if (!cl.once){ const k = i % cl.n; return cl.pose(k / cl.n); }
  const n = cl.n, cyc = n + 8, k = i % cyc; return cl.pose(Math.min(k, n - 1) / (n - 1)); };

// 1. large, animated, beside the originals
for (const key of KEYS){
  const en = CLIPS[key], s = sec(en.name, IDEA[key]);
  const row = h('div', 'row'); s.appendChild(row);
  for (const clip of Object.keys(en.clips)){ const c = cell(en, 1.6, clip); row.appendChild(c.el); anims.push([c, en, clip]); }
  if (key === 'crows') for (const v of ['c2', 'c1']){ const c = cell(en, 1.6, `fly, variant ${v}`, v); row.appendChild(c.el); anims.push([c, en, 'fly']); }
  for (const [k2, clip] of EXTRA[key]){ const e2 = CLIPS[k2], c = cell(e2, 1.6, `${e2.name}: ${clip}`); row.appendChild(c.el); anims.push([c, e2, clip]); }
  for (const [o, clip] of ORIG[key]){ const c = cell(o, 1.6, o.name); row.appendChild(c.el); anims.push([c, o, clip]); }
}
// 2. strips
for (const key of ALL){
  const en = CLIPS[key], s = sec(`${en.name}: every clip`, 'Once clips use t = i / (n - 1), loops t = i / n. Frames are the registry box.');
  for (const [name, cl] of Object.entries(en.clips)){
    s.appendChild(h('h3', null, `${name} (${cl.n} frames, ${cl.fps} fps${cl.once ? ', once' : ''})`)); const row = h('div', 'row strip'); s.appendChild(row);
    for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n; const c = cell(en, .85, i); row.appendChild(c.el); c.draw(cl.pose(t)); }
  }
}
// 3. game size: the game's Bat at its in-game scale about 60 px across, everything else at the same px per game unit
{
  const s = sec('Game size', 'Every sprite at the same pixels per game unit, with the game\'s Bat (scale 0.56) about 60 px wide. Suggested scales: crows 0.5, cart 0.55, net 0.55, netted pumpkin 0.6 (the green pumpkin beside it at the same scale).');
  const row = h('div', 'row game'); s.appendChild(row);
  const base = 60 / 110 / GAME.bat.scale;
  for (const [o, clip, lbl] of [[GAME.bat, 'walk', 'Bat'], [GAME.imp, 'walk', 'Imp'], [GAME.pumpkin, 'still', 'Pumpkin']]){ const c = cell(o, base * o.scale, lbl); row.appendChild(c.el); anims.push([c, o, clip]); }
  for (const key of ALL){ const en = CLIPS[key]; for (const clip of Object.keys(en.clips)){ const c = cell(en, base * en.scale, `${key} ${clip}`); row.appendChild(c.el); anims.push([c, en, clip]); } }
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
window.__idle = () => { anims.length = 0; document.body.innerHTML = ''; const row = h('div', 'row'); row.style.padding = '12px'; document.body.appendChild(row);
  for (const [key, clip, t, sc] of [['crows', 'fly', .25, 1.4], ['crows', 'swoop', .2, 1.4], ['cart', 'walk', .1, 1.4], ['cart', 'lob', .3, 1.4], ['net', 'fly', .2, 1.4], ['netted', 'held', .25, 1.2]]){ const en = CLIPS[key], c = cell(en, sc, `${en.name}: ${clip}`); row.appendChild(c.el); c.draw(en.clips[clip].pose(t)); } };
// a big strip of one clip (review aid)
window.__strip = (key, clip, sc = 2) => { anims.length = 0; document.body.innerHTML = ''; const row = h('div', 'row'); row.style.padding = '8px'; document.body.appendChild(row); const en = CLIPS[key], cl = en.clips[clip];
  for (let i = 0; i < cl.n; i++){ const c = cell(en, sc, i); row.appendChild(c.el); c.draw(cl.pose(cl.once ? i / (cl.n - 1) : i / cl.n)); } };
