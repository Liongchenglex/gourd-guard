// ---------- Nets on the patch (Release 8): the rope net over a pumpkin, the crimson one, and the net in flight ----------
// Ported from the archive (docs/archive/nightmare-monsters/crows-cart/crows-cart.js: drapedNet, flatNet). Painted once per canvas scale (Toy
// Plastic) into small sprites and blitted: a netted pumpkin costs one drawImage a frame, a net in flight one more (perf rule: never paint or
// shadowBlur per frame). Only called from code gated on `__RELEASE__ >= 8`.

import { E, S, SO, mix, pal, rgba } from './paint.js';
import { CS } from '../state.js';
import { K } from './canvas.js';
import { TAU } from '../util.js';

const PR = 40;                       // the archive's pumpkin radius, world units
const OW = 140, OH = 120, OX = 70, OY = 62;   // the draped overlay in world units; (OX, OY) is the pumpkin's centre
const FW = 100, FH = 70, FX = 50, FY = 35;    // the flat net in flight
const lerp = (a, b, u) => a + (b - a) * u;
const bk = k => Math.min(2.5, Math.max(0.5, k || 1));
const cache = new Map();

const PAL = { net:{ rope:pal('#c8a86a'), iron:pal('#8a909c'), tint:null }, red:{ rope:pal('#b8202e'), iron:pal('#5a1218'), tint:'rgba(214,24,44,.38)' } };
let ROPE = PAL.net.rope, IRON = PAL.net.iron;

function cord(g, path, w = 2.4, a = 1){ g.save(); g.globalAlpha *= a; path(g); g.strokeStyle = rgba(ROPE.deep, .95); g.lineWidth = w + 1.4; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
  path(g); g.strokeStyle = ROPE.base; g.lineWidth = w; g.stroke(); path(g); g.strokeStyle = rgba(ROPE.light, .6); g.lineWidth = w * .35; g.stroke(); g.restore(); }
const polyPath = pts => g => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
function weight(g, x, y, r){ S.part(g, E(x, y, r, r), IRON, { x, y, r }, { mat:'metal', lw:1 }); }

/** The open net, flat in the air (the archive's flatNet): a 4x4 rope mesh with iron weights at the corners. */
function flatNet(g, x, y, a, spin, billow = 0, squash = .62){
  const N = 4, C = [0, 1, 2, 3].map(k => { const an = spin + Math.PI / 4 + k * Math.PI / 2; return [Math.cos(an) * a * 1.25, Math.sin(an) * a * 1.25 * squash]; });
  const P = (u, v) => { const x0 = lerp(C[0][0], C[1][0], u), y0 = lerp(C[0][1], C[1][1], u), x1 = lerp(C[3][0], C[2][0], u), y1 = lerp(C[3][1], C[2][1], u);
    const bu = 2 * u - 1, bv = 2 * v - 1, b = (1 - bu * bu) * (1 - bv * bv); return [x + lerp(x0, x1, v), y + lerp(y0, y1, v) - billow * b * a * .55]; };
  g.save(); g.fillStyle = rgba(ROPE.deep, .18); g.beginPath();
  for (let k = 0; k <= 16; k++){ const t = k / 16, p = k < 4 ? P(t * 4, 0) : k < 8 ? P(1, (t - .25) * 4) : k < 12 ? P(1 - (t - .5) * 4, 1) : P(0, 1 - (t - .75) * 4); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
  g.closePath(); g.fill(); g.restore();
  for (let i = 0; i <= N; i++){ const u = i / N, A = [], B = []; for (let j = 0; j <= 8; j++){ A.push(P(u, j / 8)); B.push(P(j / 8, u)); } cord(g, polyPath(A), 2); cord(g, polyPath(B), 2); }
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++){ const [px, py] = P(i / N, j / N); S.dot(g, E(px, py, 1.9, 1.7), ROPE.dark, .95); }
  for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]){ const [px, py] = P(u, v); weight(g, px, py + 2, 4.2); }
}

/** The mesh draped over the pumpkin (the archive's drapedNet): diagonal cords from a knot at the stem down to weights on the ground. */
function drapedNet(g, top){
  const R = PR;
  const surf = (u, v) => { const T = [top[0] + u * 4, top[1]], Q = [u * R * 1.55 + top[0] * .4, -R * .15 + (top[1] + R * .82) * .3], En = [u * R * 1.05, R * .8 + (1 - u * u) * R * .1];
    const a = (1 - v) * (1 - v), b = 2 * v * (1 - v), c = v * v; return [a * T[0] + b * Q[0] + c * En[0], a * T[1] + b * Q[1] + c * En[1]]; };
  const line = (fn, v0 = 0, v1 = 1) => { const pts = []; for (let i = 0; i <= 12; i++){ const v = v0 + (v1 - v0) * i / 12, u = fn(v); if (u < -1.001 || u > 1.001) continue; pts.push(surf(u, v)); } return pts; };
  const D = 1.25, step = .5;
  for (let u0 = -2.5; u0 <= 1.01; u0 += step){ const A = line(v => u0 + v * D); if (A.length > 1) cord(g, polyPath(A), 2.3); }
  for (let u0 = -1; u0 <= 2.51; u0 += step){ const B = line(v => u0 - v * D); if (B.length > 1) cord(g, polyPath(B), 2.3); }
  for (const e of [-1, 1]) cord(g, polyPath(line(() => e)), 2.6);
  { const H = []; for (let i = 0; i <= 12; i++) H.push(surf(-1 + i / 6, 1)); cord(g, polyPath(H), 2.8); }
  for (let jv = 1; jv <= 5; jv++){ const v = jv / 5; for (let u0 = -2.5; u0 <= 1.01; u0 += step){ const u = u0 + v * D; if (u < -1.001 || u > 1.001) continue; const [x, y] = surf(u, v); S.dot(g, E(x, y, 2, 1.8), ROPE.dark, .95); } }
  for (const u of [-1, -.35, .35, 1]){ const p = surf(u, 1); weight(g, p[0], p[1] + 3, 4.6); }
  S.part(g, E(top[0], top[1] - 2, 6, 4), ROPE, { x:top[0], y:top[1] - 2, r:6 }, { flat:true, mat:'cloth', lw:1 });
  for (const s of [-1, 1]) cord(g, SO([[top[0], top[1] - 3], [top[0] + s * 7, top[1] - 9], [top[0] + s * 9, top[1] - 4]]), 1.8);
}

/** The baked overlay for a kind ('net' | 'red') at scale k; `flat` is the net in flight. */
function sprite(kind, flat, k){
  k = bk(k); const key = kind + (flat ? ':flat:' : ':') + k; let sp = cache.get(key); if (sp) return sp;
  ROPE = PAL[kind].rope; IRON = PAL[kind].iron;
  const w = flat ? FW : OW, h = flat ? FH : OH, c = document.createElement('canvas'); c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
  const g = c.getContext('2d'); g.scale(k, k); g.translate(flat ? FX : OX, flat ? FY : OY);
  if (flat) flatNet(g, 0, 0, 26, .3, .5, .62);
  else {
    const t = PAL[kind].tint;
    if (t){ g.fillStyle = t; g.beginPath(); g.ellipse(0, 2, PR * .98, PR * .86, 0, 0, TAU); g.fill(); }   // the pumpkin is red under the crimson net
    drapedNet(g, [0, -PR * .84]);
  }
  sp = { c }; cache.set(key, sp); return sp;
}

/** Bake both nets now (a night start), not on the first one thrown. */
export function prebakeNets(){ for (const kind of ['net', 'red']){ sprite(kind, false, K); sprite(kind, true, K); } }

/** The net over a pumpkin at (x, y): `drop` 0..1 is the landing (it falls in from above and settles). */
export function drawNetOver(ctx, x, y, kind, drop = 1){
  const sp = sprite(kind, false, K), s = CS / 92, d = Math.min(1, drop), e = 1 - (1 - d) * (1 - d);
  ctx.save(); ctx.globalAlpha *= Math.min(1, d * 3);
  ctx.drawImage(sp.c, x - OX * s, y + 2 - OY * s - (1 - e) * 46 * s, OW * s, OH * s);
  ctx.restore();
}

/** A net in flight, tumbling open on its way from (x0, y0) to (x1, y1); u is 0..1 of the flight. */
export function drawNetFlight(ctx, x0, y0, x1, y1, u, kind, spin){
  const sp = sprite(kind, true, K), s = CS / 92 * 1.15, x = lerp(x0, x1, u), y = lerp(y0, y1, u) - Math.sin(u * Math.PI) * CS * 1.4;
  ctx.save(); ctx.translate(x, y); ctx.rotate(spin + u * 7); ctx.scale(.7 + .5 * u, .7 + .5 * u);
  ctx.drawImage(sp.c, -FX * s, -FY * s, FW * s, FH * s);
  ctx.restore();
}
