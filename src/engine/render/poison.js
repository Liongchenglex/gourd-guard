// ---------- Poison fog on the patch (Release 5; spec Part 3) ----------
// Everything is painted once per canvas scale into offscreen canvases (perf rule: no painting, gradients or strokes per frame):
//  - the warning: one strip per line shape and roll direction, a faint green band with a chevron on every cell (the wind's arrows in poison green);
//  - the fog: two seamlessly tiling strips (twice the line long) of green mist; a frame draws a window of each, slid along the line, so a lying fog
//    costs two drawImage per line and a warning one.
// Only called from code gated on `__RELEASE__ >= 5`.

import { K, ctx } from './canvas.js';
import { rng } from './paint.js';
import { COLS, CS, GX, GY, ROWS } from '../state.js';
import { TAU } from '../util.js';

const bk = k => Math.min(2.5, Math.max(0.5, k || 1));
const cache = new Map();
const lenOf = vertical => (vertical ? ROWS : COLS) * CS;

/** A canvas holding a strip `along` × CS world units (vertical lines are painted sideways and turned by mapping coordinates in `at`). */
function strip(key, vertical, along, k, paint){
  key += ':' + (vertical ? 'v' : 'h') + ':' + k; let c = cache.get(key); if (c) return c;
  c = document.createElement('canvas');
  c.width = Math.ceil((vertical ? CS : along) * k); c.height = Math.ceil((vertical ? along : CS) * k);
  const g = c.getContext('2d'); g.scale(k, k);
  paint(g, (a, b) => vertical ? [b, a] : [a, b]);   // (a along the line, b across it) -> canvas (x, y)
  cache.set(key, c); return c;
}

/** The mist: layer 0 broad and slow, layer 1 paler wisps. Tiles seamlessly over its first `P` units (each blob is drawn once per period). */
function fogStrip(vertical, layer, k){
  const P = lenOf(vertical);
  return strip('fog' + layer, vertical, P * 2, k, (g, at) => {
    const R = rng(31 + layer * 7);
    const [bx, by] = at(0, 0);
    // a faint band down the middle of the line, fading to nothing at its edges
    const band = vertical ? g.createLinearGradient(0, 0, CS, 0) : g.createLinearGradient(0, 0, 0, CS);
    band.addColorStop(0, 'rgba(110,170,50,0)'); band.addColorStop(0.5, `rgba(110,170,50,${layer ? 0.1 : 0.22})`); band.addColorStop(1, 'rgba(110,170,50,0)');
    g.fillStyle = band; g.fillRect(bx, by, vertical ? CS : P * 2, vertical ? P * 2 : CS);
    const n = Math.round(P / (CS * (layer ? 0.55 : 0.4)));
    for (let i = 0; i < n; i++){
      const a = R() * P, b = CS * (0.3 + 0.4 * R()), r = CS * (layer ? 0.26 + 0.18 * R() : 0.3 + 0.22 * R());
      const rgb = layer ? (R() < 0.5 ? '190,230,110' : '160,215,90') : (R() < 0.3 ? '60,110,30' : R() < 0.5 ? '120,185,55' : '150,205,70');
      const al = layer ? 0.3 + 0.2 * R() : 0.34 + 0.2 * R();
      for (const off of [-P, 0, P, 2 * P]){
        const [x, y] = at(a + off, b);   // every blob at each period, so a window of P anywhere in the strip is seamless
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(${rgb},${al})`); gr.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }
  });
}

/** The warning band: the line's cells each with a bold chevron pointing the way the fog rolls (flow 1 = right / down, -1 = left / up). */
function warnStrip(vertical, flow, k){
  const P = lenOf(vertical);
  return strip('warn' + flow, vertical, P, k, (g, at) => {
    const [x0, y0] = at(0, 0);
    const band = vertical ? g.createLinearGradient(0, 0, CS, 0) : g.createLinearGradient(0, 0, 0, CS);
    band.addColorStop(0, 'rgba(120,200,60,.05)'); band.addColorStop(0.5, 'rgba(120,200,60,.3)'); band.addColorStop(1, 'rgba(120,200,60,.05)');
    g.fillStyle = band; g.fillRect(x0, y0, vertical ? CS : P, vertical ? P : CS);
    const n = vertical ? ROWS : COLS;
    for (let i = 0; i < n; i++){
      const [cx, cy] = at((i + 0.5) * CS, CS / 2);
      g.save(); g.translate(cx, cy); g.rotate((vertical ? Math.PI / 2 : 0) + (flow < 0 ? Math.PI : 0));
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (const [w, col] of [[11, 'rgba(34,70,20,.55)'], [6, 'rgba(176,246,100,.95)']]){
        g.lineWidth = w; g.strokeStyle = col;
        for (const dx of [-9, 7]){ g.beginPath(); g.moveTo(dx - 7, -13); g.lineTo(dx + 6, 0); g.lineTo(dx - 7, 13); g.stroke(); }
      }
      g.restore();
    }
  });
}

export function prebakePoison(){ for (const v of [false, true]){ fogStrip(v, 0, bk(K)); fogStrip(v, 1, bk(K)); warnStrip(v, 1, bk(K)); warnStrip(v, -1, bk(K)); } }

/** The line `i` of a fog: its patch rectangle in world units. */
function box(vertical, i){ return vertical ? [GX + i * CS, GY, CS, ROWS * CS] : [GX, GY + i * CS, COLS * CS, CS]; }

/** A window of a doubled fog strip, slid `s` units along the line, onto the line's rectangle. */
function blitWindow(c, vertical, s, x, y, w, h){
  const P = lenOf(vertical), pxP = vertical ? c.height / 2 : c.width / 2, o = (((s % P) + P) % P) / P * pxP;
  if (vertical) ctx.drawImage(c, 0, o, c.width, pxP, x, y, w, h); else ctx.drawImage(c, o, 0, pxP, c.height, x, y, w, h);
}

/** The warning arrows (G.poison.warn) and the lying fog (G.poison.on): per line, one blit for the warning, two for the fog. */
export function drawPoison(p, t){
  const kk = bk(K);
  if (p.warn){
    const v = p.warn.dir === 'col', c = warnStrip(v, p.warn.flow, kk);
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 8);
    for (const i of p.warn.idx){ const [x, y, w, h] = box(v, i); ctx.drawImage(c, x, y, w, h); }
    ctx.globalAlpha = 1;
  }
  if (p.on){
    const o = p.on, v = o.dir === 'col', c0 = fogStrip(v, 0, kk), c1 = fogStrip(v, 1, kk);
    const a = Math.min(1, o.age / 0.45, Math.max(0, o.t) / 0.7) * (0.82 + 0.18 * Math.sin(t * 3));
    ctx.globalAlpha = a;
    for (const i of o.idx){
      const [x, y, w, h] = box(v, i);
      blitWindow(c0, v, t * 38 * o.flow + i * 97, x, y, w, h);
      blitWindow(c1, v, -t * 24 * o.flow + 160 + i * 53, x, y, w, h);
    }
    ctx.globalAlpha = 1;
  }
}
