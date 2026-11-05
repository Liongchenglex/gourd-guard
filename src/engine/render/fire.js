// ---------- Fire tiles (Release 4): a looping flame strip, a hiss-and-steam puff and a burn-up flare ----------
// Everything here is painted once per canvas scale into offscreen canvases; per frame a fire costs one drawImage
// (a frame of the strip), so a field full of fire stays cheap on a phone (perf rule: no painting or shadowBlur per frame).
// Only called from code gated on `__RELEASE__ >= 4`.

import { K, ctx } from './canvas.js';
import { rng } from './paint.js';
import { FIELD_BOT, FIELD_TOP, LANE } from '../state.js';
import { TAU } from '../util.js';

const N = 8, FPS = 11;                 // frames in the loop, loop speed
const FW = 64, FH = 78, OX = 32, OY = 60;   // one frame in world units; (OX, OY) is the tile centre
const bk = k => Math.min(2.5, Math.max(0.5, k || 1));
const cache = new Map();

/** One flame tongue: a teardrop from a base of width w, h tall, its tip leaning `lean`. */
function tongue(g, cx, by, w, h, lean){
  g.beginPath(); g.moveTo(cx - w / 2, by);
  g.bezierCurveTo(cx - w * 0.62, by - h * 0.45, cx + lean - w * 0.18, by - h * 0.78, cx + lean, by - h);
  g.bezierCurveTo(cx + lean + w * 0.16, by - h * 0.74, cx + w * 0.62, by - h * 0.45, cx + w / 2, by);
  g.quadraticCurveTo(cx, by + w * 0.32, cx - w / 2, by); g.closePath();
}
const LAYERS = [[1, '#b3261a', '#e0461e'], [0.8, '#ff6a1a', '#ff9a2a'], [0.58, '#ffb52e', '#ffd84a'], [0.32, '#fff0b0', '#fffbe6']];
function flameFrame(g, i){
  const ph = i / N * TAU, R = rng(11);
  // scorched ground with a glowing ember rim
  let gr = g.createRadialGradient(0, 8, 2, 0, 8, 30); gr.addColorStop(0, 'rgba(255,120,30,.45)'); gr.addColorStop(1, 'rgba(255,90,20,0)');
  g.fillStyle = gr; g.fillRect(-32, -22, 64, 60);
  g.fillStyle = 'rgba(26,10,6,.78)'; g.beginPath(); g.ellipse(0, 9, 25, 8.5, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,140,50,.75)'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(0, 9, 24, 8, 0, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
  for (let k = 0; k < 5; k++){ const a = R() * TAU, d = 8 + R() * 12; g.fillStyle = `rgba(255,${150 + Math.floor(R() * 80)},60,${0.5 + 0.4 * Math.sin(ph + k * 1.7)})`; g.beginPath(); g.ellipse(Math.cos(a) * d, 9 + Math.sin(a) * d * 0.3, 1.6, 1.1, 0, 0, TAU); g.fill(); }
  // three tongues, each breathing on its own beat; the tallest in the middle
  const tongues = [[-11, 18, 30 + 6 * Math.sin(ph + 2.1), -3 + 3 * Math.sin(ph * 2 + 1)], [11, 18, 33 + 6 * Math.sin(ph + 4.2), 3 + 3 * Math.sin(ph * 2 + 3)], [0, 26, 46 + 7 * Math.sin(ph), 4 * Math.sin(ph * 2)]];
  for (const [cx, w, h, lean] of tongues){
    for (const [s, c0, c1] of LAYERS){
      const hh = h * s, ww = w * (0.35 + 0.65 * s);
      gr = g.createLinearGradient(0, 8 - hh, 0, 8); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
      g.fillStyle = gr; tongue(g, cx, 8, ww, hh, lean * s); g.fill();
    }
    // the plastic gloss: a pale streak down the left of each tongue
    g.fillStyle = 'rgba(255,250,225,.42)'; g.beginPath(); g.ellipse(cx - w * 0.16, 8 - h * 0.42, w * 0.07, h * 0.16, -0.12 + lean * 0.01, 0, TAU); g.fill();
  }
  g.strokeStyle = 'rgba(110,18,10,.55)'; g.lineWidth = 1.2; tongue(g, 0, 8, 26, 46 + 7 * Math.sin(ph), 4 * Math.sin(ph * 2)); g.stroke();
  // embers drifting up, looping with the strip
  for (let k = 0; k < 4; k++){ const f = (i / N + k / 4) % 1, x = (k - 1.5) * 9 + Math.sin(ph + k * 2) * 4, y = 2 - f * 54;
    g.fillStyle = `rgba(255,${190 + k * 15},90,${(1 - f) * 0.9})`; g.beginPath(); g.ellipse(x, y, 1.8 - f, 1.8 - f, 0, 0, TAU); g.fill(); }
}

/** The flame loop at scale k: N frames side by side. */
export function fireStrip(k){
  k = bk(k); const key = 'strip:' + k; let sp = cache.get(key); if (sp) return sp;
  const fw = Math.ceil(FW * k), fh = Math.ceil(FH * k), c = document.createElement('canvas'); c.width = fw * N; c.height = fh;
  const g = c.getContext('2d');
  for (let i = 0; i < N; i++){ g.save(); g.translate(i * fw, 0); g.scale(k, k); g.translate(OX, OY); flameFrame(g, i); g.restore(); }
  sp = { c, fw, fh }; cache.set(key, sp); return sp;
}
/** A soft round puff (steam) or glow (flare), 64 world units across. */
function puff(k, kind){
  k = bk(k); const key = kind + ':' + k; let c = cache.get(key); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = Math.ceil(64 * k); const g = c.getContext('2d'); g.scale(k, k);
  const gr = g.createRadialGradient(28, 28, 2, 32, 32, 32);
  if (kind === 'steam'){ gr.addColorStop(0, 'rgba(250,252,255,.95)'); gr.addColorStop(0.5, 'rgba(214,226,234,.55)'); gr.addColorStop(1, 'rgba(190,205,215,0)'); }
  else { gr.addColorStop(0, 'rgba(255,248,210,1)'); gr.addColorStop(0.3, 'rgba(255,190,70,.8)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); }
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); cache.set(key, c); return c;
}
export function prebakeFire(){ fireStrip(K); puff(K, 'steam'); puff(K, 'flare'); }

/** Every burning tile: one blit of its current frame. New fires grow in over a quarter second. */
export function drawFires(fires, t){
  const sp = fireStrip(K);
  for (const f of fires){
    const fi = Math.floor(t * FPS + f.lane * 3 + f.p * 17) % N, s = Math.min(1, 0.35 + f.t * 2.6);
    const x = LANE(f.lane), y = FIELD_TOP + f.p * (FIELD_BOT - FIELD_TOP);
    ctx.drawImage(sp.c, fi * sp.fw, 0, sp.fw, sp.fh, x - OX * s, y + (FH - OY) * (1 - s) - OY * s, FW * s, FH * s);
  }
}

/** The put-out puff (Ice) and the burn-up flare (any other pumpkin). */
export function drawFireFx(v){
  const p = Math.min(1, v.t / v.dur);
  if (v.kind === 'firewave'){   // the Fallen Gravekeeper's smash: a wall of eclipse fire racing down each lane to its fence, then a flare on the fence (baked frames only)
    const sp = fireStrip(K), e = p * p * (3 - 2 * p), y = v.y0 + (v.y1 - v.y0) * e, fi = Math.floor(v.t * FPS * 1.6);
    for (const l of v.lanes){
      const x = LANE(l);
      for (let k = 0; k < 3; k++){ const s = 1.25 - k * 0.28, yy = y - k * 24; ctx.globalAlpha = (p > 0.85 ? (1 - p) / 0.15 : 1) * (1 - k * 0.25);
        ctx.drawImage(sp.c, ((fi + k * 3 + l) % N) * sp.fw, 0, sp.fw, sp.fh, x - OX * s, yy - OY * s, FW * s, FH * s); }
    }
    if (p > 0.75){ const fl = puff(K, 'flare'), r = 24 + (p - 0.75) * 160; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, (1 - p) * 4);
      for (const l of v.lanes) ctx.drawImage(fl, LANE(l) - r, v.y1 - r, r * 2, r * 2);
      ctx.globalCompositeOperation = 'source-over'; }
    ctx.globalAlpha = 1; return;
  }
  if (v.kind === 'firehiss'){
    const st = puff(K, 'steam');
    for (let i = 0; i < 5; i++){ const a = -Math.PI / 2 + (i - 2) * 0.55, d = 6 + p * 26, r = 10 + p * 20 + i * 2;
      ctx.globalAlpha = (1 - p) * 0.75; ctx.drawImage(st, v.x + Math.cos(a) * d - r, v.y - 6 + Math.sin(a) * d - p * 18 - r, r * 2, r * 2); }
  } else {
    const fl = puff(K, 'flare'), r = 16 + p * 34;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - p;
    ctx.drawImage(fl, v.x - r, v.y - 14 - r, r * 2, r * 2);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;
}
