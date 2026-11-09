// Preview page for the Storm Eel: a behaviour loop on a little lane with two puddles, each clip large and animated beside the game's
// Puddle Diver, strips of every clip, and a game-size row at about 60 px.
import { CLIPS } from './storm_eel.js';
import { W5 } from '../../../../src/engine/render/chars/w5.js';

const DPR = Math.min(2, window.devicePixelRatio || 1);
const app = document.getElementById('app');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const DIVER = { name:'Puddle Diver (game)', ...W5.diver };
const EEL = CLIPS.eel, BOLT = CLIPS.bolt;

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
// once clips play through, hold the last frame a moment, and start again
const frameOf = (en, clip, i) => { const cl = en.clips[clip]; if (!cl.once) return cl.pose((i % cl.n) / cl.n); const k = i % (cl.n + 5); return cl.pose(Math.min(cl.n - 1, k) / (cl.n - 1)); };

app.appendChild(h('h1', null, 'The Storm Eel'));
app.appendChild(h('p', 'note', 'Nightmare Drowned Marsh. Owner: "leaps from puddle to puddle and shoots electric bolt like puddle diver. or if its in the tide, anywhere in the tide/water." Design archive only, nothing here is in the game.'));

// 0. behaviour loop: two puddles in a lane strip, a fence at the bottom
{
  const s = sec('Behaviour loop (proposal)', 'Hidden under the water, it surfaces, sways, crackles up, spits a bolt down its lane (the bolt sprite flies to the fence and zaps it), dives, then leaps to the other puddle. It can only be hit while it is up. Timings are the preview\'s, not tuned.');
  const W = 340, H = 300, c = document.createElement('canvas'); c.width = W * DPR; c.height = H * DPR; c.style.width = W + 'px'; c.style.height = H + 'px'; c.style.background = '#16241e'; c.style.borderRadius = '8px'; s.appendChild(c);
  const lbl = h('div', 'lbl', ''); s.appendChild(lbl);
  const g = c.getContext('2d'), K = .62, PUD = [[90, 120], [250, 70]], FENCE = 262;
  const STEPS = [['hidden', .7], ['surface', 6 / 14], ['idle', .8], ['charge', 6 / 12], ['shoot', 8 / 14], ['idle', .5], ['down', 4 / 12], ['hidden', .5], ['leap', 12 / 14]];
  const total = STEPS.reduce((a, b) => a + b[1], 0);
  const drawAt = (en, pose, x, y, k) => { const B = en.box; g.save(); g.translate(x, y); g.scale(k, k); en.draw(g, pose); g.restore(); };
  function frame(sec){
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    // lanes and the fence
    g.strokeStyle = 'rgba(255,255,255,.06)'; for (let i = 1; i < 2; i++){ g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, FENCE - 10); g.stroke(); }
    g.fillStyle = '#5a4630'; for (let x = 8; x < W; x += 18) g.fillRect(x, FENCE - 4, 8, 26); g.fillRect(0, FENCE + 2, W, 5); g.fillRect(0, FENCE + 12, W, 5);
    for (const [x, y] of PUD){ g.fillStyle = '#3a2c20'; g.beginPath(); g.ellipse(x, y + 4, 34, 11, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#143a50'; g.beginPath(); g.ellipse(x, y + 3, 30, 8.5, 0, 0, Math.PI * 2); g.fill(); }
    const cyc = Math.floor(sec / total), from = PUD[cyc % 2], to = PUD[(cyc + 1) % 2];
    let t = sec - cyc * total, i = 0; while (t > STEPS[i][1]){ t -= STEPS[i][1]; i++; } const [clip, dur] = STEPS[i], u = Math.min(1, t / dur);
    lbl.textContent = clip;
    const cl = EEL.clips[clip], pose = cl.once ? cl.pose(Math.min(cl.n - 1, Math.floor(u * cl.n)) / (cl.n - 1)) : cl.pose((Math.floor(t * cl.fps) % cl.n) / cl.n);
    const wl = 38 * K;   // eel waterline sits on the puddle
    if (clip === 'leap'){ const e = u * u * (3 - 2 * u), x = from[0] + (to[0] - from[0]) * e, y = from[1] + (to[1] - from[1]) * e; drawAt(EEL, { ...pose, flip:to[0] < from[0] }, x, y - wl, K); }
    else drawAt(EEL, pose, from[0], from[1] - wl, K);
    // the bolt: leaves the mouth at shoot t .3, flies down the lane, zaps the fence
    if (clip === 'shoot' && u > .45 || (clip === 'idle' && i === 5)){ const st = clip === 'shoot' ? (u - .45) * dur : (8 / 14) * .55 + t, fly = .45, by0 = from[1] - wl + 20 * K;
      if (st < fly){ const k = st / fly; drawAt(BOLT, BOLT.clips.fly.pose((Math.floor(st * 14) % 6) / 6), from[0], by0 + (FENCE - by0) * k, K); }
      else if (st < fly + 7 / 16){ const k = (st - fly) / (7 / 16); drawAt(BOLT, BOLT.clips.zap.pose(Math.min(6, Math.floor(k * 7)) / 6), from[0], FENCE, K); } }
  }
  const t0 = performance.now(); (function loop(now){ frame((now - t0) / 1000); requestAnimationFrame(loop); })(t0);
  window.__loopAt = sec => frame(sec);
}

// 1. every clip large and animated, beside the game's Puddle Diver
{
  const s = sec('Storm Eel: every clip', 'Large, animated. leap is drawn in place: the engine moves the sprite between puddles while it plays (see the loop above).');
  const row = h('div', 'row'); s.appendChild(row);
  for (const clip of Object.keys(EEL.clips)){ const c = cell(EEL, 1.25, clip); row.appendChild(c.el); anims.push([c, EEL, clip]); }
  for (const clip of ['fly', 'zap']){ const c = cell(BOLT, 1.6, `bolt: ${clip}`); row.appendChild(c.el); anims.push([c, BOLT, clip]); }
  for (const clip of ['surface', 'throw', 'idle']){ const c = cell(DIVER, 1.25, `Puddle Diver (game): ${clip}`); row.appendChild(c.el); anims.push([c, DIVER, clip]); }
}
// 2. strips
for (const en of [EEL, BOLT]){
  const s = sec(`${en.name}: frames`, 'Once clips use t = i / (n - 1), loops t = i / n. Frames are the registry box.');
  for (const [name, cl] of Object.entries(en.clips)){
    s.appendChild(h('h3', null, `${name} (${cl.n} frames, ${cl.fps} fps${cl.once ? ', once' : ''})`)); const row = h('div', 'row strip'); s.appendChild(row);
    for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n; const c = cell(en, .62, i); row.appendChild(c.el); c.draw(cl.pose(t)); }
  }
}
// 3. game size: the surfaced Puddle Diver about 60 px tall, everything at the same px per game unit
{
  const s = sec('Game size', 'Every sprite at the same pixels per game unit, with the game\'s surfaced Puddle Diver about 60 px tall. The Storm Eel uses the Diver\'s scale (0.6).');
  const row = h('div', 'row game'); s.appendChild(row);
  const base = 60 / 96 / DIVER.scale;   // the surfaced diver is about 96 drawing units tall
  for (const clip of ['idle', 'throw']){ const c = cell(DIVER, base * DIVER.scale, `Diver ${clip}`); row.appendChild(c.el); anims.push([c, DIVER, clip]); }
  for (const clip of ['idle', 'charge', 'shoot', 'leap']){ const c = cell(EEL, base * EEL.scale, clip); row.appendChild(c.el); anims.push([c, EEL, clip]); }
  for (const clip of ['fly', 'zap']){ const c = cell(BOLT, base * BOLT.scale, `bolt ${clip}`); row.appendChild(c.el); anims.push([c, BOLT, clip]); }
}

const t0 = performance.now();
function tick(now){ const ph = (now - t0) / 1000; for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, Math.floor(ph * en.clips[clip].fps))); requestAnimationFrame(tick); }
requestAnimationFrame(tick);
// test hooks: freeze every animated cell on one frame; measure how close any frame comes to its box edges (drawing units)
window.__freeze = (frame = 0) => { for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, frame)); };
window.__edges = () => { const out = {}; for (const [key, en] of Object.entries(CLIPS)){ const B = en.box, sc = 2, c = document.createElement('canvas'); c.width = Math.ceil(B.w * sc); c.height = Math.ceil(B.h * sc); const g = c.getContext('2d');
  for (const [name, cl] of Object.entries(en.clips)) for (const flip of key === 'eel' && name === 'leap' ? [false, true] : [false]) for (let i = 0; i < cl.n; i++){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(sc, sc); g.translate(-B.x, -B.y); en.draw(g, { ...cl.pose(cl.once ? i / (cl.n - 1) : i / cl.n), flip }); g.restore();
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const k = key + '/' + name, m = { l:x0 / sc, r:(c.width - 1 - x1) / sc, t:y0 / sc, b:(c.height - 1 - y1) / sc }, o = out[k] || (out[k] = { l:1e9, r:1e9, t:1e9, b:1e9 }); for (const q in m) o[q] = Math.min(o[q], m[q]); } }
  return out; };
// key poses for idle.png: surfaced, shooting, leaping (and the bolt)
window.__idle = () => { document.body.innerHTML = ''; const row = h('div', 'row'); row.style.padding = '12px'; document.body.appendChild(row);
  for (const [en, pose, lbl] of [[EEL, { idle:.15 }, 'surfaced'], [EEL, { charge:.8 }, 'charging'], [EEL, { shoot:.43 }, 'shooting'], [EEL, { leap:.45 }, 'leaping'], [BOLT, { fly:0 }, 'bolt']]){ const c = cell(en, 1.5, lbl); row.appendChild(c.el); c.draw(pose); } };
