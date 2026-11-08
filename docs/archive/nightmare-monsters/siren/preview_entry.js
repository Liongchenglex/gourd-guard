// Preview page for the Siren: a lane demo of the proposed song bend, every clip large and animated beside the game's Drowned
// Marsh monsters (Puddle Diver, Drunk Sailor), strips of every clip, and a game-size row at about 60 px.
import { CLIPS } from './siren.js';
import { W5 } from '../../../../src/engine/render/chars/w5.js';
import { E, S, pal } from '../../../../src/engine/render/paint.js';

const DPR = Math.min(2, window.devicePixelRatio || 1);
const app = document.getElementById('app');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const GAME = { diver: { name:'Puddle Diver (game)', ...W5.diver }, sailor: { name:'Drunk Sailor (game)', ...W5.sailor } };
const ALL = ['siren', 'note', 'bend'];

/** A canvas showing entry `en`'s box at `scale` CSS px per drawing unit. */
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
  const n = cl.n, cyc = n + 8, k = i % cyc; return cl.pose(Math.min(k, n - 1) / (n - 1)); };

/** Bake every frame of a clip at a scale (as the game's anim.js would). */
const cache = new Map();
function bake(key, clip, s){ const id = key + '/' + clip + '/' + s; if (cache.has(id)) return cache.get(id);
  const en = CLIPS[key], cl = en.clips[clip], B = en.box, out = [];
  for (let i = 0; i < cl.n; i++){ const c = document.createElement('canvas'); c.width = Math.ceil(B.w * s * DPR); c.height = Math.ceil(B.h * s * DPR); const g = c.getContext('2d'); g.scale(s * DPR, s * DPR); g.translate(-B.x, -B.y); en.draw(g, cl.pose(cl.once ? i / (cl.n - 1) : i / cl.n)); out.push({ c, x:B.x * s, y:B.y * s, w:B.w * s, h:B.h * s }); }
  cache.set(id, out); return out; }
const blit = (g, f, x, y) => g.drawImage(f.c, x + f.x, y + f.y, f.w, f.h);
const fr = (key, clip, T) => { const cl = CLIPS[key].clips[clip], i = Math.floor(T * cl.fps); return bake(key, clip, LS)[cl.once ? Math.min(cl.n - 1, Math.max(0, i)) : ((i % cl.n) + cl.n) % cl.n]; };

// ---------- 0. lane demo: the song bends a pumpkin into the next lane ----------
const LW = 7, DW = 350, DH = 440, LANE = DW / LW, LS = .42, SL = 3, FENCE = DH - 70;
const demo = sec('The Siren: proposed song bend', 'Proposal. She sits on her rock at the back of lane 4. Between songs a pumpkin flicked up her lane hits her. While she sings, notes drift down her lane, and the next pumpkin flicked up it is bent into the neighbouring lane (the way her charm sweeps) and flies past her.');
const cap = h('div', 'phase', ''); demo.appendChild(cap);
const dc = document.createElement('canvas'); dc.width = DW * DPR; dc.height = DH * DPR; dc.style.width = DW + 'px'; dc.style.height = DH + 'px'; dc.className = 'demo'; demo.appendChild(dc);
const bg = (() => { const c = document.createElement('canvas'); c.width = DW * DPR; c.height = DH * DPR; const g = c.getContext('2d'); g.scale(DPR, DPR);
  let gr = g.createLinearGradient(0, 0, 0, DH); gr.addColorStop(0, '#0e2a30'); gr.addColorStop(1, '#14383a'); g.fillStyle = gr; g.fillRect(0, 0, DW, DH);
  for (let i = 0; i < 9; i++){ g.fillStyle = 'rgba(120,200,210,.06)'; g.beginPath(); g.ellipse((i * 97) % DW, 60 + (i * 53) % 280, 26, 8, 0, 0, Math.PI * 2); g.fill(); }
  for (let i = 1; i < LW; i++){ g.strokeStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.moveTo(i * LANE, 0); g.lineTo(i * LANE, FENCE); g.stroke(); }
  for (let i = 0; i < LW; i++){ const x0 = i * LANE + 4, w0 = LANE - 8; g.fillStyle = '#6a5034'; g.fillRect(x0, FENCE, w0, 12); g.fillStyle = '#8a6a44'; for (let k = 0; k < 4; k++){ g.fillRect(x0 + k * w0 / 4 + 1, FENCE - 8, w0 / 4 - 3, 22); } }
  g.fillStyle = '#2a1e18'; g.fillRect(0, FENCE + 22, DW, DH - FENCE - 22);
  for (let r = 0; r < 2; r++) for (let i = 0; i < LW; i++){ g.fillStyle = 'rgba(90,70,50,.5)'; g.fillRect(i * LANE + 3, FENCE + 28 + r * 20, LANE - 6, 16); }
  return c; })();
function pumpkin(g, x, y, r = 10){ S.part(g, E(x, y, r, r * .88), pal('#ff8a2a'), { x, y, r }, { mat:'pumpkin' }); S.tube(g, g2 => { g2.beginPath(); g2.moveTo(x, y - r * .8); g2.lineTo(x + 2, y - r * 1.2); }, pal('#4a7a2a'), 3); }
// timeline (s): idle → sing (notes) → pumpkin A flicked mid-song, bent at the note line → charm → idle; pumpkin B flicked after the song hits her
const TL = { end:7.2, singA:1.0, singB:4.2, flickA:2.2, flickB:5.0 };
const lx = l => (l + .5) * LANE, SX = lx(SL), SY = 92;
const t0d = performance.now(), FREEZE = location.hash.startsWith('#t=') ? parseFloat(location.hash.slice(3)) : null;
function dtick(now){ if (window.__stop) return;
  const g = dc.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.drawImage(bg, 0, 0, DW, DH);
  const T = FREEZE != null ? FREEZE : (Math.max(0, now - t0d) / 1000) % TL.end;
  const singing = T >= TL.singA && T < TL.singB, bendY = 210, fly = 1.15;   // pumpkin flies from FENCE+40 to the siren in `fly` s
  let clip = 'idle', ct = T, label = 'between songs: she can be hit from her lane';
  const kA = (T - TL.flickA) / fly, bendAt = (FENCE + 40 - bendY) / (FENCE + 40 - SY), charmT0 = TL.flickA + fly * bendAt - .35;
  if (T < .6){ clip = 'surface'; ct = T; label = 'surface: rock and siren rise from the pool (once)'; }
  else if (singing){ clip = 'sing'; ct = T - TL.singA; label = 'SINGING: the next pumpkin up her lane is bent';
    if (T >= charmT0 && T < charmT0 + CLIPS.siren.clips.charm.n / 14){ clip = 'charm'; ct = T - charmT0; label = 'charm: the strong note bends the pumpkin into lane 5'; } }
  else if (T >= TL.flickB + fly && T < TL.flickB + fly + .36){ clip = 'hit'; ct = T - TL.flickB - fly; label = 'hit: between songs the pumpkin reaches her'; }
  else if (T >= TL.flickB + fly + .36 && T < TL.flickB + fly + .36 + .75){ clip = 'dive'; ct = T - TL.flickB - fly - .36; label = 'dive: hurt, she slips into the pool (and resurfaces)'; }
  else if (T >= TL.flickB + fly + 1.11){ clip = 'surface'; ct = (T - TL.flickB - fly - 1.11); }
  // notes drifting down her lane while she sings
  if (singing || (T >= TL.singB && T < TL.singB + 1.6)) for (let i = 0; i < 8; i++){ const born = TL.singA + .3 + i * .4, a = T - born; if (a < 0 || born > TL.singB) continue; const y = SY + 10 + a * 110; if (y > FENCE - 10) continue; const nf = fr('note', 'drift', a + i * .13); g.save(); g.globalAlpha = Math.min(1, a * 3) * (1 - Math.max(0, (y - FENCE + 70) / 60)); blit(g, nf, SX + Math.sin(a * 3 + i) * 3, y); g.restore(); }
  blit(g, fr('siren', clip, ct), SX, SY - 50 * LS);
  // pumpkin A: flicked mid-song, bent into lane 5 at the note line, flies past her
  if (kA >= 0 && kA < 1.25){ const y = FENCE + 40 - kA * (FENCE + 40 - SY); let x = SX; if (y < bendY){ const u = Math.min(1, (bendY - y) / 70), e = u * u * (3 - 2 * u); x = SX + e * LANE; if (u < 1 || y > bendY - 90) blit(g, fr('bend', 'swirl', T), x, y); }
    if (y > -20) pumpkin(g, x, y); }
  // pumpkin B: flicked after the song, hits her
  const kB = (T - TL.flickB) / fly; if (kB >= 0 && kB < 1){ pumpkin(g, SX, FENCE + 40 - kB * (FENCE + 40 - SY - 14)); }
  if (kB >= 1 && kB < 1.3){ g.save(); g.globalAlpha = 1 - (kB - 1) / .3; g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(SX, SY + 14, 14 + (kB - 1) * 40, 0, Math.PI * 2); g.fill(); g.restore(); }
  cap.textContent = label;
  requestAnimationFrame(dtick);
}
requestAnimationFrame(dtick);

// ---------- 1. large, animated, beside the originals ----------
{
  const en = CLIPS.siren, s = sec('The Siren (box 176 × 180)', 'She never walks: she surfaces once on her rock and stays at the back. Once clips replay with a short pause.');
  const row = h('div', 'row'); s.appendChild(row);
  for (const clip of ['idle', 'sing', 'charm', 'hit', 'dive', 'surface']){ const c = cell(en, 1.05, clip); row.appendChild(c.el); anims.push([c, en, clip]); }
  const row2 = h('div', 'row'); s.appendChild(row2);
  for (const [key, clip, sc] of [['note', 'drift', 1.6], ['bend', 'swirl', 1.3], ['bend', 'swirlL', 1.3]]){ const c = cell(CLIPS[key], sc, `${CLIPS[key].name}: ${clip}`); row2.appendChild(c.el); anims.push([c, CLIPS[key], clip]); }
  for (const [o, clip] of [[GAME.diver, 'idle'], [GAME.sailor, 'walk']]){ const c = cell(o, .9, o.name); row2.appendChild(c.el); anims.push([c, o, clip]); }
}
// ---------- 2. strips ----------
for (const key of ALL){
  const en = CLIPS[key], s = sec(`${en.name}: every clip`, 'Once clips use t = i / (n - 1), loops t = i / n. Frames are the registry box.');
  for (const [name, cl] of Object.entries(en.clips)){
    s.appendChild(h('h3', null, `${name} (${cl.n} frames, ${cl.fps} fps${cl.once ? ', once' : ''})`)); const row = h('div', 'row strip'); s.appendChild(row);
    for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n; const c = cell(en, key === 'siren' ? .5 : .8, i); row.appendChild(c.el); c.draw(cl.pose(t)); }
  }
}
// ---------- 3. game size ----------
{
  const s = sec('Game size', 'Everything at the same pixels per game unit, with the game\'s Drunk Sailor about 60 px tall. The Siren uses scale 0.5 (about 75 px from the pool to the top of her head).');
  const row = h('div', 'row game'); s.appendChild(row);
  const base = 60 / 130 / GAME.sailor.scale;
  for (const [o, clip, lbl] of [[GAME.sailor, 'walk', 'Sailor'], [GAME.diver, 'idle', 'Diver']]){ const c = cell(o, base * o.scale, lbl); row.appendChild(c.el); anims.push([c, o, clip]); }
  for (const key of ALL){ const en = CLIPS[key]; for (const clip of Object.keys(en.clips)){ if (clip === 'charmL' || clip === 'swirlL') continue; const c = cell(en, base * en.scale, clip); row.appendChild(c.el); anims.push([c, en, clip]); } }
}

const t0 = performance.now();
function tick(now){ if (window.__stop) return; const ph = Math.max(0, now - t0) / 1000; for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, Math.floor(ph * en.clips[clip].fps))); requestAnimationFrame(tick); }
requestAnimationFrame(tick);
// test hooks
window.__freeze = (frame = 0) => { for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, frame)); };
window.__edges = () => { const out = {}; for (const key of ALL){ const en = CLIPS[key], B = en.box, sc = 2, c = document.createElement('canvas'); c.width = Math.ceil(B.w * sc); c.height = Math.ceil(B.h * sc); const g = c.getContext('2d', { willReadFrequently:true });
  for (const [name, cl] of Object.entries(en.clips)) for (let i = 0; i < cl.n; i++){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(sc, sc); g.translate(-B.x, -B.y); en.draw(g, cl.pose(cl.once ? i / (cl.n - 1) : i / cl.n)); g.restore();
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const k = key + '/' + name, m = { l:x0 / sc, r:(c.width - 1 - x1) / sc, t:y0 / sc, b:(c.height - 1 - y1) / sc }, o = out[k] || (out[k] = { l:1e9, r:1e9, t:1e9, b:1e9 }); for (const q in m) o[q] = Math.min(o[q], m[q]); } }
  return out; };
window.__idle = () => { window.__stop = true; document.body.innerHTML = ''; const row = h('div', 'row'); row.style.padding = '12px'; row.style.background = '#0e1e24'; document.body.appendChild(row);
  for (const [clip, t] of [['idle', .25], ['sing', .125], ['charm', .5]]){ const en = CLIPS.siren, c = cell(en, 1.6, `The Siren: ${clip}`); row.appendChild(c.el); c.draw(en.clips[clip].pose(t)); } };
