// Preview page for the Foggy Hollow and Crumbling Keep mini bosses: each large and animated (every clip) beside the game's
// originals (Fogwalker, Poltergeist; Shield Knight, Skeleton Archer, Vampire Count) and the archive's Kraken, strips of every
// clip, and a game-size row where a Shield Knight is about 60 px.
import { CLIPS } from './minibosses.js';
import { W2 } from '../../../../src/engine/render/chars/w2.js';
import { W4 } from '../../../../src/engine/render/chars/w4.js';
import { NM } from '../kraken-pirate/kraken_pirate.js';

const DPR = Math.min(2, window.devicePixelRatio || 1);
const app = document.getElementById('app');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const GAME = {
  fogwalker: { name:'Fogwalker (game)', ...W2.fogwalker }, poltergeist: { name:'Poltergeist (game boss)', ...W2.poltergeist },
  knight: { name:'Shield Knight (game)', ...W4.knight }, archer: { name:'Skeleton Archer (game)', ...W4.archer }, count: { name:'Vampire Count (game boss)', ...W4.vampirecount },
  kraken: { name:'Kraken (archive mini boss)', ...NM.kraken },
};
const IDEA = {
  lamplighter: 'Proposal: drifts at the back of the field and never walks to the wall. Every few seconds it blinks (vanishes into fog, reappears in another fog bank or lane). It is only hittable while the lantern is lit (drift); a hit while lit makes it snuff the lantern (snuff), and while dark (half-faded, pumpkins pass through) it swings the lantern and pours a fog bank down one lane (shroud). Then it relights (relight) and the window opens again. Kill it to clear its fog.',
  siegetower: 'Proposal: rolls very slowly down one lane like a wall of timber. The two skeleton archers on top loose a volley at a wall every few seconds (volley). Pumpkins hit the archers first: each hit to the top knocks one off (knock, variants a2 → a1 → a0); only with both archers gone does the tower itself take damage. Every so often the ramp drops and a Shield Knight marches out down the lane (ramp, then raise). On death it collapses into a heap of timber (break).',
};
const ROWS = {
  lamplighter: [['drift'], ['dark'], ['snuff'], ['relight'], ['blink'], ['shroud'], ['hit']],
  siegetower: [['roll', 'a2'], ['roll', 'a1'], ['roll', 'a0'], ['volley', 'a2'], ['ramp', 'a2'], ['raise', 'a2'], ['knock', 'a1'], ['knock', 'a0'], ['hit', 'a2'], ['break', 'a1']],
};
const ORIG = { lamplighter: [[GAME.fogwalker, 'walk'], [GAME.poltergeist, 'walk'], [GAME.kraken, 'idle']], siegetower: [[GAME.knight, 'walk'], [GAME.archer, 'hold'], [GAME.archer, 'draw'], [GAME.count, 'walk']] };

/** A canvas showing entry `en`'s box at `scale` CSS px per drawing unit. */
function cell(en, scale, label){
  const B = en.box, w = Math.ceil(B.w * scale), hh = Math.ceil(B.h * scale);
  const wrap = h('div', 'cell'); const c = document.createElement('canvas'); c.width = w * DPR; c.height = hh * DPR; c.style.width = w + 'px'; c.style.height = hh + 'px';
  wrap.appendChild(c); if (label != null) wrap.appendChild(h('div', 'lbl', label));
  const g = c.getContext('2d');
  return { el:wrap, draw(pose){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(scale * DPR, scale * DPR); g.translate(-B.x, -B.y); en.draw(g, pose); g.restore(); } };
}
const anims = [];   // [cell, entry, clipName, variant]
const sec = (title, note) => { const s = h('section'); s.appendChild(h('h2', null, title)); if (note) s.appendChild(h('p', 'note', note)); app.appendChild(s); return s; };
// once clips play, hold the last frame, then restart, so the preview reads like the game
const frameOf = (en, clip, i, v) => { const cl = en.clips[clip]; let p; if (!cl.once) p = cl.pose((i % cl.n) / cl.n); else { const n = cl.n, cyc = n + 8, k = i % cyc; p = cl.pose(Math.min(k, n - 1) / (n - 1)); } return v ? { ...p, variant:v } : p; };

app.appendChild(h('h1', null, 'Mini bosses: the Lamplighter and the Siege Tower'));
app.appendChild(h('p', 'note', 'Foggy Hollow and Crumbling Keep mini bosses (design archive, not in the game). Smaller than the world boss, bigger than its monsters, the same size class as the Kraken (Drowned Marsh). Gameplay lines are proposals.'));
// 1. large, animated, beside the originals
for (const key of ['lamplighter', 'siegetower']){
  const en = CLIPS[key], s = sec(en.name, IDEA[key]);
  const row = h('div', 'row'); s.appendChild(row);
  for (const [clip, v] of ROWS[key]){ const c = cell(en, 1.1, v ? `${clip} (${v})` : clip); row.appendChild(c.el); anims.push([c, en, clip, v]); }
  s.appendChild(h('h3', null, 'Beside the game (same drawing units)'));
  const row2 = h('div', 'row'); s.appendChild(row2);
  for (const [o, clip] of ORIG[key]){ const c = cell(o, .7, `${o.name}: ${clip}`); row2.appendChild(c.el); anims.push([c, o, clip]); }
  const c = cell(en, .7, en.name); row2.appendChild(c.el); anims.push([c, en, key === 'lamplighter' ? 'drift' : 'roll', key === 'siegetower' ? 'a2' : undefined]);
}
// 2. strips
for (const key of ['lamplighter', 'siegetower']){
  const en = CLIPS[key], s = sec(`${en.name}: every clip`, 'Once clips use t = i / (n - 1), loops t = i / n. Frames are the registry box.' + (key === 'siegetower' ? ' Variants a2 / a1 / a0 = archers left; every clip is drawn for each variant (shown here with the most telling one).' : ''));
  for (const [name, cl] of Object.entries(en.clips)){
    const v = key === 'siegetower' ? (name === 'knock' ? 'a1' : name === 'break' ? 'a1' : 'a2') : undefined;
    s.appendChild(h('h3', null, `${name} (${cl.n} frames, ${cl.fps} fps${cl.once ? ', once' : ''})${v ? ' ' + v : ''}`)); const row = h('div', 'row strip'); s.appendChild(row);
    for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n; const c = cell(en, .55, i); row.appendChild(c.el); c.draw({ ...cl.pose(t), variant:v }); }
  }
}
// 3. game size: px per game unit chosen so the Shield Knight is about 60 px tall; everything at its registry scale
{
  const s = sec('Game size', 'Every figure at the same pixels per game unit (a Shield Knight about 60 px tall, a lane about 61 px wide on a 430 px phone), each at its registry scale: Lamplighter and Siege Tower .46, Kraken .58, Poltergeist .6, Vampire Count .76.');
  const row = h('div', 'row game'); s.appendChild(row);
  const base = 60 / (126 * GAME.knight.scale);
  for (const [o, clip, lbl, v] of [[GAME.knight, 'walk', 'Knight'], [GAME.archer, 'hold', 'Archer'], [GAME.fogwalker, 'walk', 'Fogwalker'], [CLIPS.lamplighter, 'drift', 'Lamplighter'], [CLIPS.lamplighter, 'dark', 'dark'], [CLIPS.siegetower, 'roll', 'Siege Tower', 'a2'], [GAME.kraken, 'idle', 'Kraken'], [GAME.poltergeist, 'walk', 'Poltergeist'], [GAME.count, 'walk', 'Vampire Count']]){
    const c = cell(o, base * o.scale, lbl); row.appendChild(c.el); anims.push([c, o, clip, v]); }
}

const t0 = performance.now(); let running = true;
function tick(now){ if (!running) return; const ph = (now - t0) / 1000; for (const [c, en, clip, v] of anims) c.draw(frameOf(en, clip, Math.floor(ph * en.clips[clip].fps), v)); requestAnimationFrame(tick); }
requestAnimationFrame(tick);
// test hooks: freeze every animated cell on one frame; measure how close any frame of any variant comes to its box edges (drawing units)
window.__freeze = (frame = 0) => { running = false; for (const [c, en, clip, v] of anims) c.draw(frameOf(en, clip, frame, v)); };
window.__edges = () => { const out = {}; for (const key of ['lamplighter', 'siegetower']){ const en = CLIPS[key], B = en.box, sc = 2, c = document.createElement('canvas'); c.width = Math.ceil(B.w * sc); c.height = Math.ceil(B.h * sc); const g = c.getContext('2d');
  for (const v of en.variants ? Object.keys(en.variants) : [undefined]) for (const [name, cl] of Object.entries(en.clips)) for (let i = 0; i < cl.n; i++){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(sc, sc); g.translate(-B.x, -B.y); en.draw(g, { ...cl.pose(cl.once ? i / (cl.n - 1) : i / cl.n), variant:v }); g.restore();
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const k = key + '/' + name, m = { l:x0 / sc, r:(c.width - 1 - x1) / sc, t:y0 / sc, b:(c.height - 1 - y1) / sc }, o = out[k] || (out[k] = { l:1e9, r:1e9, t:1e9, b:1e9 }); for (const q in m) o[q] = Math.min(o[q], m[q]); } }
  return out; };
// a still of both mini bosses for idle.png
window.__idle = () => { running = false; document.body.innerHTML = ''; const row = h('div', 'row'); row.style.padding = '12px'; document.body.appendChild(row);
  for (const [key, clip, t, v] of [['lamplighter', 'drift', .25], ['lamplighter', 'dark', .25], ['siegetower', 'roll', .25, 'a2']]){ const en = CLIPS[key], c = cell(en, 1.25, `${en.name}: ${clip}`); row.appendChild(c.el); c.draw({ ...en.clips[clip].pose(t), variant:v }); } };
// review hook: a row of chosen frames, large ([key, clip, t, variant] each)
window.__zoom = (list, sc = 1.2) => { running = false; document.body.innerHTML = ''; const row = h('div', 'row'); row.style.padding = '12px'; document.body.appendChild(row);
  for (const [key, clip, t, v] of list){ const en = CLIPS[key], c = cell(en, sc, `${clip} ${t}`); row.appendChild(c.el); c.draw({ ...en.clips[clip].pose(t), variant:v }); } };
