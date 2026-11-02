// Preview page for the nightmare Kraken (body + tentacles + cursed anchor) and the Drowned Pirate.
// Every frame is baked once into a canvas (as the game's anim.js would) and blitted.
import { NM } from './kraken_pirate.js';

const app = document.getElementById('app'), DPR = 2;
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

/** Bake every frame of a clip at a given scale: [{ c, x, y, w, h }] with x/y the offset of the box from the drawing origin. */
const cache = new Map();
function bake(key, clip, s, extra = {}){
  const id = key + '/' + clip + '/' + s + '/' + JSON.stringify(extra); if (cache.has(id)) return cache.get(id);
  const E = NM[key], cl = E.clips[clip], b = E.box, out = [];
  for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n, c = document.createElement('canvas');
    c.width = Math.ceil(b.w * s * DPR); c.height = Math.ceil(b.h * s * DPR); const g = c.getContext('2d'); g.scale(s * DPR, s * DPR); g.translate(-b.x, -b.y); E.draw(g, { ...cl.pose(t), ...extra });
    out.push({ c, x:b.x * s, y:b.y * s, w:b.w * s, h:b.h * s }); }
  cache.set(id, out); return out;
}
const blit = (g, f, x, y) => g.drawImage(f.c, x + f.x, y + f.y, f.w, f.h);
const frameAt = (key, clip, T) => { const cl = NM[key].clips[clip], i = Math.floor(T * cl.fps); return cl.once ? Math.min(cl.n - 1, Math.max(0, i)) : ((i % cl.n) + cl.n) % cl.n; };
const dur = (key, clip) => NM[key].clips[clip].n / NM[key].clips[clip].fps;

// ---------- the backdrop: blood moon, crimson sea, a strip of field and a wall row ----------
function backdrop(W, H, seaTop, seaBot){
  const c = document.createElement('canvas'); c.width = W * DPR; c.height = H * DPR; const g = c.getContext('2d'); g.scale(DPR, DPR);
  let gr = g.createLinearGradient(0, 0, 0, seaTop); gr.addColorStop(0, '#0c0206'); gr.addColorStop(1, '#3e0610'); g.fillStyle = gr; g.fillRect(0, 0, W, seaTop);
  g.save(); g.shadowColor = '#ff3a26'; g.shadowBlur = 50; g.fillStyle = '#e8402a'; g.beginPath(); g.arc(W * .78, seaTop - 28, 54, 0, Math.PI * 2); g.fill(); g.restore();
  g.fillStyle = 'rgba(120,10,16,.35)'; for (const [x, y, r] of [[W * .76, seaTop - 40, 12], [W * .8, seaTop - 16, 8], [W * .75, seaTop - 12, 6]]){ g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  // a ghost ship on the horizon
  g.fillStyle = 'rgba(10,2,6,.85)'; g.beginPath(); g.moveTo(W * .12, seaTop - 4); g.lineTo(W * .22, seaTop - 4); g.lineTo(W * .2, seaTop + 2); g.lineTo(W * .14, seaTop + 2); g.fill(); g.fillRect(W * .165, seaTop - 46, 2, 42);
  g.fillStyle = 'rgba(200,190,200,.18)'; for (const [x0, y0, w0, h0] of [[W * .14, seaTop - 42, 22, 16], [W * .172, seaTop - 38, 18, 14], [W * .14, seaTop - 22, 26, 14]]){ g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w0, y0 + 2); g.lineTo(x0 + w0 - 3, y0 + h0); g.lineTo(x0 + 4, y0 + h0 - 2); g.fill(); }
  gr = g.createLinearGradient(0, seaTop, 0, seaBot); gr.addColorStop(0, '#5a0810'); gr.addColorStop(.5, '#a8141c'); gr.addColorStop(1, '#6a0a12'); g.fillStyle = gr; g.fillRect(0, seaTop, W, seaBot - seaTop);
  g.fillStyle = 'rgba(255,120,90,.25)'; g.fillRect(W * .72, seaTop, W * .12, seaBot - seaTop);   // moon trail
  g.strokeStyle = 'rgba(255,170,150,.35)'; g.lineWidth = 1.5; for (let y = seaTop + 10; y < seaBot; y += 14) for (let x = (y * 7) % 60; x < W; x += 60){ g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 4, x + 20, y); g.stroke(); }
  g.fillStyle = '#ffd0c8'; for (let x = 0; x < W; x += 18){ g.globalAlpha = .55; g.beginPath(); g.ellipse(x + 9, seaBot, 10, 4, 0, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1;
  gr = g.createLinearGradient(0, seaBot, 0, H); gr.addColorStop(0, '#2a1416'); gr.addColorStop(1, '#180a0c'); g.fillStyle = gr; g.fillRect(0, seaBot + 3, W, H - seaBot - 3);
  for (let i = 1; i < 7; i++){ g.strokeStyle = 'rgba(255,255,255,.04)'; g.beginPath(); g.moveTo(W * i / 7, seaBot + 4); g.lineTo(W * i / 7, H); g.stroke(); }
  // a palisade wall row near the bottom
  for (let i = 0; i < 7; i++){ const x0 = W * i / 7 + 6, w0 = W / 7 - 12, y0 = H - 34; g.fillStyle = '#6a4a2a'; g.fillRect(x0, y0, w0, 18); g.fillStyle = '#8a6438'; for (let k = 0; k < 5; k++){ g.fillRect(x0 + k * w0 / 5 + 1, y0 - 6, w0 / 5 - 3, 24); g.beginPath(); g.moveTo(x0 + k * w0 / 5 + 1, y0 - 6); g.lineTo(x0 + (k + .5) * w0 / 5 - 1, y0 - 12); g.lineTo(x0 + (k + 1) * w0 / 5 - 2, y0 - 6); g.fill(); } }
  return c;
}

// ---------- (1) the cycle ----------
app.appendChild(el('h1', null, 'The Kraken and the Drowned Pirate'));
app.appendChild(el('p', 'sub', 'Nightmare Drowned Marsh. The Kraken lives in the crimson sea row: its body surfaces (vulnerable, the eyes and beak are the target), breathes a while, then dives; while it is down, its tentacles rise in their own lanes and fling cursed anchors at the walls. Below: every clip as strips, the Drowned Pirate, and everything at game size.'));
const SW = 960, SH = 470, SEA0 = 160, SEA1 = 300, WLY = 262;
const scene = el('canvas', 'big'); scene.width = SW * DPR; scene.height = SH * DPR; scene.style.width = SW + 'px'; scene.style.height = SH + 'px';
const cap = el('div', 'phase', ''); app.appendChild(cap); app.appendChild(scene);
const bg = backdrop(SW, SH, SEA0, SEA1);
const KS = 1.05, TS = 1, OX = SW / 2, OY = WLY - 50 * KS;   // the kraken's drawing origin, waterline at WLY
const TENTS = [{ x:SW * .5 / 7 + 30, flip:true, d:0 }, { x:SW * 1.5 / 7 + 30, flip:true, d:.25 }, { x:SW * 5.5 / 7 - 30, flip:false, d:.12 }, { x:SW * 6.5 / 7 - 30, flip:false, d:.37 }];
const TL = { surface:dur('kraken', 'surface'), idle:4.2, dive:dur('kraken', 'dive'), rise:dur('tentacle', 'rise'), sway:1.0, thr:dur('tentacle', 'throw'), fly:1.0, after:1.4 };
const T0 = { surface:0 }; T0.idle = T0.surface + TL.surface; T0.dive = T0.idle + TL.idle; T0.rise = T0.dive + TL.dive; T0.sway = T0.rise + TL.rise + .4; T0.thr = T0.sway + TL.sway; T0.after = T0.thr + .4 + TL.thr + TL.fly; T0.sink = T0.after + TL.after; T0.end = T0.sink + TL.rise + .6;
const anchorF = bake('anchor', 'spin', .62);
const start = performance.now(), FREEZE = location.hash.startsWith('#t=') ? parseFloat(location.hash.slice(3)) : null;   // #t=3 freezes the cycle (for screenshots)
function tick(now){
  const g = scene.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.drawImage(bg, 0, 0, SW, SH);
  const T = FREEZE != null ? FREEZE : ((now - start) / 1000) % T0.end;
  // kraken body
  let phase = '';
  if (T < T0.idle){ blit(g, bake('kraken', 'surface', KS)[frameAt('kraken', 'surface', T)], OX, OY); phase = 'surface: the body rises (once)'; }
  else if (T < T0.dive){ blit(g, bake('kraken', 'idle', KS)[frameAt('kraken', 'idle', T - T0.idle)], OX, OY); phase = 'idle: BODY UP, vulnerable (eyes and beak take hits)'; }
  else if (T < T0.rise){ blit(g, bake('kraken', 'dive', KS)[frameAt('kraken', 'dive', T - T0.dive)], OX, OY); phase = 'dive: the body sinks (once), untargetable'; }
  else phase = T < T0.sway ? 'BODY DOWN: tentacles rise in their lanes' : T < T0.after ? 'BODY DOWN: tentacles fling cursed anchors at the walls' : T < T0.sink ? 'BODY DOWN: tentacles sway (each can be hit)' : 'tentacles sink: the body surfaces next';
  // tentacles (anchors in flight are drawn after them all)
  const fly = [];
  for (const tn of TENTS){ const ox = tn.x, oy = WLY - 50 * TS, ex = { flip:tn.flip }; let f = null;
    if (T >= T0.rise && T < T0.sway) { const t = T - T0.rise - tn.d; if (t >= 0) f = bake('tentacle', 'rise', TS, ex)[frameAt('tentacle', 'rise', t)]; }
    else if (T >= T0.sway && T < T0.sink){ const tt = T - T0.thr - tn.d; if (tt >= 0 && tt < TL.thr) f = bake('tentacle', 'throw', TS, ex)[frameAt('tentacle', 'throw', tt)]; else f = bake('tentacle', 'sway', TS, ex)[frameAt('tentacle', 'sway', T - T0.sway + tn.d)];
      // the anchor in flight: from the tip at release down its lane to the wall
      const rel = tt - TL.thr * .55; if (rel > 0 && rel < TL.fly){ const k = rel / TL.fly, sx = ox + (tn.flip ? -1 : 1) * 40 * TS, sy = oy - 30 * TS, tx = ox + (tn.flip ? -1 : 1) * 10, ty = SH - 40, x = sx + (tx - sx) * k, y = sy + (ty - sy) * k - Math.sin(k * Math.PI) * 50;
        fly.push([k, x, y, tx, ty]); } }
    else if (T >= T0.sink){ const t = T - T0.sink - tn.d * .5, n = NM.tentacle.clips.rise.n; if (t < TL.rise){ const i = Math.max(0, n - 1 - frameAt('tentacle', 'rise', Math.max(0, t))); f = bake('tentacle', 'rise', TS, ex)[i]; } }
    if (f) blit(g, f, ox, oy); }
  for (const [k, x, y, tx, ty] of fly){ if (k < .92) blit(g, anchorF[Math.floor(k * 30) % anchorF.length], x, y); else { g.save(); g.globalAlpha = (1 - k) / .08; g.fillStyle = '#ffb090'; g.beginPath(); g.arc(tx, ty, 22, 0, Math.PI * 2); g.fill(); g.restore(); } }
  cap.textContent = phase;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ---------- (2) strips ----------
function strip(key, clip, fw, extra = {}, bgc = '#2a0a10'){
  const E = NM[key], cl = E.clips[clip], b = E.box, s = Math.min(fw / b.w, 1.2), fh = Math.round(b.h * s), row = el('div', 'row');
  row.appendChild(el('span', 'lbl', clip + (cl.once ? ' (once)' : ' (loop)')));
  const c = el('canvas'); c.width = fw * cl.n * DPR; c.height = fh * DPR; c.style.width = fw * cl.n + 'px'; c.style.height = fh + 'px'; const g = c.getContext('2d'); g.scale(DPR, DPR);
  const fr = bake(key, clip, s, extra);
  fr.forEach((f, i) => { g.fillStyle = i % 2 ? bgc : '#14060a'; g.fillRect(i * fw, 0, fw, fh); if (key !== 'pirate' && key !== 'anchor'){ g.fillStyle = 'rgba(168,20,28,.35)'; g.fillRect(i * fw, (50 - b.y) * s, fw, fh - (50 - b.y) * s); } blit(g, f, i * fw + (-b.x) * s + (fw - b.w * s) / 2, -b.y * s); });
  row.appendChild(c); return row;
}
for (const [title, key, clips, fw] of [['Kraken body (box 228 × 218, boss)', 'kraken', ['surface', 'idle', 'dive'], 112], ['Kraken tentacle (box 150 × 182)', 'tentacle', ['rise', 'sway', 'throw'], 100], ['Cursed anchor (projectile prop, box 56 × 76)', 'anchor', ['spin'], 60]]){
  const sec = el('div', 'sec'); sec.appendChild(el('h2', null, title)); for (const cl of clips) sec.appendChild(strip(key, cl, fw)); app.appendChild(sec); }

// ---------- (3) the pirate large, animated ----------
const psec = el('div', 'sec'); psec.appendChild(el('h2', null, 'The Drowned Pirate (fodder, box 142 × 140)'));
const pshow = el('div', 'show'), pc = el('canvas', 'big'), PB = NM.pirate.box, PS = 2.6; pc.width = PB.w * PS * DPR; pc.height = PB.h * PS * DPR; pc.style.width = PB.w * PS + 'px'; pc.style.height = PB.h * PS + 'px';
pshow.appendChild(pc); const pside = el('div'); pshow.appendChild(pside); psec.appendChild(pshow);
const bar = el('div', 'bar'), pst = { clip:'walk', t0:performance.now() };
for (const cl of ['walk', 'chew', 'shoot']){ const b = el('button', null, cl); if (cl === 'walk') b.classList.add('on'); b.onclick = () => { pst.clip = cl; pst.t0 = performance.now(); for (const x of bar.children) x.classList.toggle('on', x === b); }; bar.appendChild(b); }
psec.appendChild(bar);
for (const cl of ['walk', 'chew', 'shoot']) psec.appendChild(strip('pirate', cl, 96, {}, '#241820'));
app.appendChild(psec);
function ptick(now){ const g = pc.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = '#1c1014'; g.fillRect(0, 0, PB.w * PS, PB.h * PS);
  const cl = NM.pirate.clips[pst.clip], T = (now - pst.t0) / 1000; let i = Math.floor(T * cl.fps);
  if (cl.once){ if (T > cl.n / cl.fps + .8) pst.t0 = now; i = Math.min(cl.n - 1, i); } else i %= cl.n;
  blit(g, bake('pirate', pst.clip, PS)[i], -PB.x * PS, -PB.y * PS); requestAnimationFrame(ptick); }
requestAnimationFrame(ptick);

// ---------- (4) game size ----------
const gsec = el('div', 'sec'); gsec.appendChild(el('h2', null, 'Game size (one lane is about 61 px wide on a 430 px phone; registry scales: kraken .58, tentacle .55, pirate .6, anchor .55)'));
const GW = 430, GH = 220, gc = el('canvas'); gc.width = GW * DPR; gc.height = GH * DPR; gc.style.width = GW + 'px'; gc.style.height = GH + 'px'; const gg = gc.getContext('2d'); gg.scale(DPR, DPR);
gg.drawImage(backdrop(GW, GH, 40, 110), 0, 0, GW, GH);
const LW = GW / 7, gWL = 96;
blit(gg, bake('tentacle', 'sway', NM.tentacle.scale, { flip:true })[1], LW * .5, gWL - 50 * NM.tentacle.scale);
blit(gg, bake('kraken', 'idle', NM.kraken.scale)[2], LW * 3.5, gWL - 50 * NM.kraken.scale);
blit(gg, bake('tentacle', 'throw', NM.tentacle.scale)[3], LW * 5.5, gWL - 50 * NM.tentacle.scale);
blit(gg, bake('anchor', 'spin', NM.anchor.scale)[2], LW * 5.5 + 6, 150);
blit(gg, bake('pirate', 'walk', NM.pirate.scale)[1], LW * 1.5, 170 - 50 * NM.pirate.scale);
blit(gg, bake('pirate', 'shoot', NM.pirate.scale)[5], LW * 2.5 + 4, 182 - 50 * NM.pirate.scale);
gsec.appendChild(gc); app.appendChild(gsec);
