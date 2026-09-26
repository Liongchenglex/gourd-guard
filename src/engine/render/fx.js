// ---------- Effects in the Toy Plastic language ----------
// Lightning (Deep Blue), blast (Black), hex zap and sigil (witches), the 3×3 zones (doctor, bulwark, hex),
// and the baked field props: the wooden palisade, graves, puddles, the sea tiles, the mist tiles and the castle walls.
// Everything is deterministic per frame (seeded), so nothing flickers randomly. Owner asked for these on 2026-09-26.

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from './paint.js';
import { CS, W } from '../state.js';
import { TAU } from '../util.js';

const ease = t => 1 - (1 - t) * (1 - t);

// ---------- Deep Blue: a jagged bolt with glow, re-jittered a few times as it lives ----------
export function drawBolt(g, v){
  const p = Math.min(1, v.t / v.dur), a = p < .7 ? 1 : 1 - (p - .7) / .3, R = rng((v.seed || 1) * 31 + Math.floor(v.t / 0.07) * 7);
  const dx = v.x2 - v.x1, dy = v.y2 - v.y1, len = Math.hypot(dx, dy), n = Math.max(4, Math.round(len / 13)), nx = -dy / len, ny = dx / len;
  const pts = [[v.x1, v.y1]];
  for (let i = 1; i < n; i++){ const f = i / n, off = (R() - .5) * 30 * Math.sin(f * Math.PI); pts.push([v.x1 + dx * f + nx * off, v.y1 + dy * f + ny * off]); }
  pts.push([v.x2, v.y2]);
  const path = () => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); };
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  g.globalAlpha = a * .45; g.strokeStyle = '#6a90ff'; g.lineWidth = 14; path(); g.stroke();
  g.globalAlpha = a * .9; g.strokeStyle = '#bfe0ff'; g.lineWidth = 5.5; path(); g.stroke();
  g.globalAlpha = a; g.strokeStyle = '#ffffff'; g.lineWidth = 2.2; path(); g.stroke();
  for (let b = 0; b < 2; b++){ const i = 1 + Math.floor(R() * (pts.length - 2)), [bx, by] = pts[i], ang = Math.atan2(dy, dx) + (R() - .5) * 2.2, bl = 10 + R() * 18;
    g.globalAlpha = a * .7; g.strokeStyle = '#bfe0ff'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(ang) * bl * .6 + (R() - .5) * 6, by + Math.sin(ang) * bl * .6); g.lineTo(bx + Math.cos(ang) * bl, by + Math.sin(ang) * bl + (R() - .5) * 8); g.stroke(); }
  for (const [x, y] of [[v.x1, v.y1], [v.x2, v.y2]]){ const gr = g.createRadialGradient(x, y, 0, x, y, 26); gr.addColorStop(0, `rgba(210,230,255,${a * .8})`); gr.addColorStop(1, 'rgba(120,160,255,0)'); g.fillStyle = gr; g.fillRect(x - 26, y - 26, 52, 52); }
  g.restore();
}

// ---------- Black: fireball, shockwave, smoke, spokes, scorch ----------
export function drawBlast(g, v){
  const p = Math.min(1, v.t / v.dur), R0 = v.r || CS * 0.9, R = rng((v.seed || 3) * 17);
  g.save();
  // scorch on the ground, lingers
  g.globalAlpha = (1 - p) * .5; g.fillStyle = '#1a1014'; ell(g, v.x, v.y + R0 * .35, R0 * (.5 + .5 * ease(p)), R0 * .2); g.fill();
  // smoke puffs drifting out and up
  for (let i = 0; i < 7; i++){ const ang = (i / 7) * TAU + R() * .6, d = R0 * (.35 + .75 * ease(p)), x = v.x + Math.cos(ang) * d, y = v.y + Math.sin(ang) * d * .7 - p * 18, rr = R0 * (.16 + .22 * p) * (.8 + R() * .5);
    g.globalAlpha = Math.max(0, (1 - p) * .6); const sg = g.createRadialGradient(x - rr * .3, y - rr * .3, rr * .1, x, y, rr); sg.addColorStop(0, '#5a5060'); sg.addColorStop(1, 'rgba(30,24,34,0)'); g.fillStyle = sg; ell(g, x, y, rr, rr); g.fill(); }
  // fireball
  if (p < .8){ const q = p / .8, fr = R0 * (.3 + .7 * ease(q)); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - q * q * q;
    const fg = g.createRadialGradient(v.x, v.y - fr * .1, 0, v.x, v.y, fr); fg.addColorStop(0, '#fff8d0'); fg.addColorStop(.3, '#ffd24a'); fg.addColorStop(.65, '#ff7a1a'); fg.addColorStop(1, 'rgba(160,40,10,0)'); g.fillStyle = fg; ell(g, v.x, v.y, fr, fr * .92); g.fill();
    // spokes
    g.globalAlpha = Math.max(0, .8 - q * 1.6); g.strokeStyle = '#ffe08a'; g.lineCap = 'round';
    for (let i = 0; i < 8; i++){ const ang = i * TAU / 8 + .2, l = fr * (1.3 + R() * .5); g.lineWidth = 3 - q * 2; g.beginPath(); g.moveTo(v.x + Math.cos(ang) * fr * .5, v.y + Math.sin(ang) * fr * .5); g.lineTo(v.x + Math.cos(ang) * l, v.y + Math.sin(ang) * l); g.stroke(); }
    g.globalCompositeOperation = 'source-over'; }
  // shockwave ring
  const sr = R0 * (.3 + 1.1 * ease(p)); g.globalAlpha = Math.max(0, (1 - p) * .9); g.strokeStyle = 'rgba(255,220,150,1)'; g.lineWidth = 5 * (1 - p) + 1; ell(g, v.x, v.y, sr, sr * .72); g.stroke();
  g.globalAlpha = Math.max(0, (1 - p) * .35); g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; ell(g, v.x, v.y, sr * .88, sr * .62); g.stroke();
  g.restore();
}

// ---------- Witch hex: an arcane head streaks to the target on a curve with a trail of motes ----------
export function drawHexBolt(g, v){
  const p = Math.min(1, v.t / v.dur), R = rng((v.seed || 5) * 13);
  const cx = (v.x1 + v.x2) / 2 + (v.y2 - v.y1) * .25, cy = (v.y1 + v.y2) / 2 - (v.x2 - v.x1) * .25;
  const at = f => { const u = 1 - f; return [u * u * v.x1 + 2 * u * f * cx + f * f * v.x2, u * u * v.y1 + 2 * u * f * cy + f * f * v.y2]; };
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 10; i++){ const f = Math.max(0, p - i * .045); if (f <= 0) continue; const [x, y] = at(f), rr = 5 - i * .4, a = (1 - i / 10) * (p < .9 ? 1 : (1 - p) * 10);
    g.globalAlpha = a * .8; g.fillStyle = i % 2 ? '#d09bff' : '#f4e6ff'; star(g, x + (R() - .5) * 4, y + (R() - .5) * 4, rr, v.t * 6 + i); g.fill(); }
  const [hx, hy] = at(Math.min(1, p)); const hg = g.createRadialGradient(hx, hy, 0, hx, hy, 18); hg.addColorStop(0, 'rgba(255,240,255,.95)'); hg.addColorStop(.4, 'rgba(208,155,255,.7)'); hg.addColorStop(1, 'rgba(160,80,220,0)');
  g.globalAlpha = p < .9 ? 1 : (1 - p) * 10; g.fillStyle = hg; g.fillRect(hx - 18, hy - 18, 36, 36);
  g.restore();
}
function star(g, x, y, r, rot){ g.beginPath(); for (let i = 0; i < 8; i++){ const a = rot + i * Math.PI / 4, rr = i % 2 ? r * .4 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
/** A spinning rune circle with a pentagram over the hexed monster, in the colour it was locked to; reverse hexes get a red X. */
export function drawSigil(g, v){
  const p = Math.min(1, v.t / v.dur), a = p < .2 ? p / .2 : p > .7 ? (1 - p) / .3 : 1, sc = .6 + .5 * ease(Math.min(1, p / .3)), r = 30 * sc, col = v.col || '#d09bff';
  g.save(); g.translate(v.x, v.y); g.rotate(v.t * 2.2); g.globalAlpha = a;
  g.strokeStyle = col; g.lineWidth = 2.2; g.shadowColor = col; g.shadowBlur = 10;
  g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, r * .8, 0, TAU); g.lineWidth = 1; g.stroke();
  g.beginPath(); for (let i = 0; i < 5; i++){ const ang = -Math.PI / 2 + i * TAU * 2 / 5; g.lineTo(Math.cos(ang) * r * .78, Math.sin(ang) * r * .78); } g.closePath(); g.lineWidth = 1.8; g.stroke();
  for (let i = 0; i < 12; i++){ const ang = i * TAU / 12; g.beginPath(); g.moveTo(Math.cos(ang) * r * .84, Math.sin(ang) * r * .84); g.lineTo(Math.cos(ang) * r * (i % 3 ? .92 : .98), Math.sin(ang) * r * (i % 3 ? .92 : .98)); g.stroke(); }
  g.rotate(-v.t * 2.2); g.globalCompositeOperation = 'lighter';
  const gg = g.createRadialGradient(0, 0, 0, 0, 0, r); gg.addColorStop(0, rgba(col, .35 * a)); gg.addColorStop(1, rgba(col, 0)); g.fillStyle = gg; g.fillRect(-r, -r, r * 2, r * 2);
  if (v.reverse){ g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#ff3a3a'; g.lineWidth = 3.5; g.lineCap = 'round'; g.shadowColor = '#ff3a3a'; g.beginPath(); g.moveTo(-r * .45, -r * .45); g.lineTo(r * .45, r * .45); g.moveTo(r * .45, -r * .45); g.lineTo(-r * .45, r * .45); g.stroke(); }
  g.restore();
}

// ---------- 3×3 zones ----------
function zoneBase(g, x, y, w, h, col, a, t){
  const gr = g.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, Math.max(w, h) * .65); gr.addColorStop(0, rgba(col, .22 * a)); gr.addColorStop(1, rgba(col, .04 * a));
  g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, 14); g.fill();
  g.strokeStyle = rgba(col, .5 * a); g.lineWidth = 1.5; g.beginPath(); g.roundRect(x, y, w, h, 14); g.stroke();
  g.strokeStyle = rgba(col, .9 * a); g.lineWidth = 3; g.lineCap = 'round'; const L = 14;
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]){ g.beginPath(); g.moveTo(cx, cy + sy * L); g.lineTo(cx, cy); g.lineTo(cx + sx * L, cy); g.stroke(); }
}
function motes(g, x, y, w, h, n, t, seed, fn){ const R = rng(seed); for (let i = 0; i < n; i++){ const ph = R(), sx = x + 10 + R() * (w - 20), sp = .12 + R() * .1, f = (t * sp + ph) % 1, my = y + h - 8 - f * (h - 16), a = Math.sin(f * Math.PI); fn(sx + Math.sin(t * 2 + i) * 4, my, a, i); } }
/** Plague Doctor: green, a slow rune ring at the centre, rising crosses. */
export function drawHealZoneFx(g, x, y, w, h, t){
  const pulse = .5 + .5 * Math.sin(t * 3), col = '#8ee88a', cx = x + w / 2, cy = y + h / 2;
  zoneBase(g, x, y, w, h, col, .8 + .2 * pulse, t);
  g.save(); g.globalAlpha = .45 + .25 * pulse; g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, CS * .95, 0, TAU); g.stroke();
  g.translate(cx, cy); g.rotate(t * .6); g.fillStyle = col;
  for (let i = 0; i < 8; i++){ const ang = i * TAU / 8, px = Math.cos(ang) * CS * .95, py = Math.sin(ang) * CS * .95; g.fillRect(px - 4, py - 1.2, 8, 2.4); g.fillRect(px - 1.2, py - 4, 2.4, 8); }
  g.restore();
  g.save(); motes(g, x, y, w, h, 7, t, 91, (mx, my, a) => { g.globalAlpha = a * .8; g.fillStyle = '#c8ffc0'; g.fillRect(mx - 4, my - 1.3, 8, 2.6); g.fillRect(mx - 1.3, my - 4, 2.6, 8); }); g.restore();
}
/** Bulwark Knight: steel plates, a riveted rim, a pulse ring. */
export function drawBulwarkZoneFx(g, x, y, w, h, t){
  const pulse = .5 + .5 * Math.sin(t * 2.5), col = '#9fb4dc', cx = x + w / 2, cy = y + h / 2;
  zoneBase(g, x, y, w, h, col, .7 + .3 * pulse, t);
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 14); g.clip(); g.strokeStyle = rgba(col, .16); g.lineWidth = 1;
  const s = 16; for (let r = 0; r < h / (s * 1.5) + 1; r++) for (let c = 0; c < w / (s * 1.75) + 1; c++){ const hx = x + c * s * 1.75 + (r % 2 ? s * .87 : 0), hy = y + r * s * 1.5; g.beginPath(); for (let i = 0; i < 6; i++){ const ang = i * TAU / 6 + Math.PI / 6; g.lineTo(hx + Math.cos(ang) * s * .5, hy + Math.sin(ang) * s * .5); } g.closePath(); g.stroke(); }
  g.restore();
  g.save(); g.strokeStyle = rgba('#dfe8f8', .6 + .3 * pulse); g.lineWidth = 3; g.beginPath(); g.roundRect(x + 3, y + 3, w - 6, h - 6, 12); g.stroke();
  const ST = pal('#aab3c4'); for (const [rx, ry] of [[x + 12, y + 12], [x + w - 12, y + 12], [x + 12, y + h - 12], [x + w - 12, y + h - 12], [cx, y + 8], [cx, y + h - 8], [x + 8, cy], [x + w - 8, cy]]) S.rivet(g, rx, ry, 3.2, ST);
  const q = (t * .8) % 1, pr = 10 + q * CS * 1.4; g.globalAlpha = (1 - q) * .6; g.strokeStyle = '#cfe0ff'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, pr, 0, TAU); g.stroke();
  g.restore();
}
/** Hexwitch zones: purple, a spinning sigil every couple of tiles, ghostly skull motes drifting up. */
export function drawHexZoneFx(g, x, y, w, h, t, a){
  const pulse = .5 + .5 * Math.sin(t * 3), col = '#c07cff';
  zoneBase(g, x, y, w, h, col, a * (.8 + .2 * pulse), t);
  g.save(); g.strokeStyle = rgba(col, a * (.5 + .3 * pulse)); g.lineWidth = 2; g.setLineDash([6, 6]); g.lineDashOffset = t * 24; g.beginPath(); g.roundRect(x + 2, y + 2, w - 4, h - 4, 12); g.stroke(); g.setLineDash([]);
  const nx = Math.max(1, Math.round(w / (CS * 2.2))), ny = Math.max(1, Math.round(h / (CS * 2.2)));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++){ const cx = x + (i + .5) * w / nx, cy = y + (j + .5) * h / ny, r = Math.min(CS * .8, w / nx * .4, h / ny * .4);
    g.save(); g.translate(cx, cy); g.rotate(t * 1.2 * (i + j) % 2 ? t : -t); g.globalAlpha = a * (.35 + .2 * pulse); g.strokeStyle = col; g.lineWidth = 1.5;
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.beginPath(); for (let k = 0; k < 5; k++){ const ang = -Math.PI / 2 + k * TAU * 2 / 5; g.lineTo(Math.cos(ang) * r * .8, Math.sin(ang) * r * .8); } g.closePath(); g.stroke();
    for (let k = 0; k < 10; k++){ const ang = k * TAU / 10; g.beginPath(); g.moveTo(Math.cos(ang) * r * .85, Math.sin(ang) * r * .85); g.lineTo(Math.cos(ang) * r * .96, Math.sin(ang) * r * .96); g.stroke(); }
    g.restore(); }
  motes(g, x, y, w, h, Math.round(w * h / (CS * CS) * .6) + 2, t, 57, (mx, my, ma) => { g.globalAlpha = a * ma * .7; g.fillStyle = '#e8d8ff'; ell(g, mx, my, 4.5, 5); g.fill(); g.fillStyle = '#4a2a6a'; ell(g, mx - 1.8, my - .8, 1.2, 1.5); g.fill(); ell(g, mx + 1.8, my - .8, 1.2, 1.5); g.fill(); });
  g.restore();
}

// ---------- baked field props ----------
// Each prop is painted once per canvas scale `k` into an offscreen canvas and blitted every frame (60 fps on a phone).
// A sprite is { c, w, h, ox, oy }: draw it at (x - ox, y - oy, w, h) so its local origin lands on (x, y).
const bakeK = k => Math.min(2.5, Math.max(.5, k || 1));
let propCache = new Map();
function bake(key, w, h, ox, oy, k, fn){
  let sp = propCache.get(key); if (sp) return sp;
  const c = document.createElement('canvas'); c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
  const g = c.getContext('2d'); g.scale(k, k); g.translate(ox, oy); fn(g);
  sp = { c, w, h, ox, oy }; propCache.set(key, sp); return sp;
}
export function resetProps(){ propCache = new Map(); }
export const resetCastles = resetProps;

const path = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
/** A groove: a dark line with a lit lower-right lip, so cracks read as depth rather than ink. */
function crack(g, pts, w = 1.6, a = .85){
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.save(); g.translate(.8, .8); path(g, pts); g.strokeStyle = `rgba(255,240,220,${a * .4})`; g.lineWidth = w; g.stroke(); g.restore();
  path(g, pts); g.strokeStyle = `rgba(22,12,18,${a})`; g.lineWidth = w; g.stroke();
}
/** Jagged polyline from (x0,y0) to (x1,y1) with n segments and sideways wobble `amp`. */
function jag(R, x0, y0, x1, y1, n, amp){ const pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; for (let i = 1; i < n; i++){ const f = i / n, o = (R() - .5) * amp; pts.push([x0 + dx * f + nx * o, y0 + dy * f + ny * o]); } pts.push([x1, y1]); return pts; }
/** Horizontal wood grain inside a clip (the painter's `wood` material runs vertically, for planks). */
function grainH(g, clip, x0, x1, y0, y1, c, R){ g.save(); clip(g); g.clip(); g.strokeStyle = rgba(c.deep, .38); g.lineWidth = .9; for (let i = 0; i < 3; i++){ const y = y0 + (y1 - y0) * (.25 + i * .25) + (R() - .5) * 2; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + (R() - .5) * 3, x1, y); g.stroke(); } g.strokeStyle = 'rgba(255,235,200,.32)'; g.beginPath(); g.moveTo(x0, y0 + 1.2); g.lineTo(x1, y0 + 1.2); g.stroke(); g.restore(); }
/** A twisted rope along a polyline. */
function rope(g, pts, c, w = 5){
  S.tube(g, SO(pts), c, w);
  g.strokeStyle = rgba(c.deep, .55); g.lineWidth = 1; g.lineCap = 'round';
  for (let s = 0; s < pts.length - 1; s++){ const [ax, ay] = pts[s], [bx, by] = pts[s + 1], L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L, px = -uy, py = ux;
    for (let d = 2; d < L; d += 3.2){ const x = ax + ux * d, y = ay + uy * d; g.beginPath(); g.moveTo(x - px * w * .45 - ux * .9, y - py * w * .45 - uy * .9); g.lineTo(x + px * w * .45 + ux * .9, y + py * w * .45 + uy * .9); g.stroke(); } }
}

// ---------- the palisade: one sprite per column, four damage states, seeded by column ----------
const WOODS = [pal('#ad7442'), pal('#bd874f'), pal('#9c6537')], RAIL = pal('#8a5a2e'), POST = pal('#7a4b26'), ROPE = pal('#d6b06c'), IRON = pal('#5c606e'), RAW = pal('#e2bd86');
/** A fresh-wood sliver: too thin for the painter's dark edge, so it gets a faint one. */
function sliver(g, p, c, b){ S.part(g, p, c, b, { flat:true, noEdge:true }); p(g); g.strokeStyle = rgba(c.dark, .45); g.lineWidth = .7; g.lineJoin = 'round'; g.stroke(); }
/** Plank outline: 0 pointed, 1 chipped tip, 2 broken low, 3 stub (the wall is down). Local y: 12 is the ground line, negative is up. */
function plankPath(px, top, R){
  const x0 = px, x1 = px + 18, m = px + 9, yb = 12;
  if (top === 0) return SM([[x0, yb, 1], [x0, -34, 1], [m, -45], [x1, -34, 1], [x1, yb, 1]], .8);
  if (top === 1) return PL([[x0, yb], [x0, -34], [x0 + 4, -41], [x0 + 8, -31], [x0 + 12, -38], [x1, -34], [x1, yb]]);
  if (top === 2) return PL([[x0, yb], [x0, -12], [x0 + 4, -21], [x0 + 9, -9], [x0 + 13, -17], [x1, -11], [x1, yb]]);
  return PL([[x0, yb], [x0, -1 - R() * 4], [x0 + 5, -9 - R() * 4], [x0 + 9, -2], [x0 + 14, -7 - R() * 3], [x1, -3], [x1, yb]]);
}
function post(g, x, lean, R){
  g.save(); g.translate(x, 14); g.rotate(lean);
  S.tube(g, SO([[0, 0], [0, -56]]), POST, 11);
  S.part(g, E(0, -57, 7, 5.5), POST, { x:0, y:-58, r:7 }, { mat:'wood', lw:1.2 });
  g.strokeStyle = rgba(POST.deep, .5); g.lineWidth = 1; g.beginPath(); g.moveTo(-5.5, -52); g.lineTo(5.5, -52); g.stroke();
  g.fillStyle = rgba(POST.deep, .5); ell(g, 2, -30 + R() * 10, 1.6, 2.4); g.fill();
  g.restore();
}
export function fenceSprite(k, state, seed){
  k = bakeK(k);
  return bake(`fence:${k}:${state}:${seed}`, CS + 16, 74, 8, 54, k, g => {
    const R = rng(seed * 31 + state * 7 + 5), hw = CS / 2, broken = state === 3;
    S.shadow(g, hw, 15, hw + 4, 5);
    // rails behind the planks (stubs by the posts once the wall is down)
    for (const ry of [-19, 1]){
      if (broken){
        const L = 12 + R() * 6, M = 10 + R() * 6;
        S.part(g, PL([[-8, ry], [-8 + L, ry], [-8 + L - 3, ry + 4], [-8 + L + 1, ry + 7], [-8, ry + 7]]), RAIL, { x:-2, y:ry + 3.5, r:10 }, { flat:true, lw:1 });
        S.part(g, PL([[CS + 8, ry], [CS + 8 - M, ry + 1], [CS + 8 - M + 3, ry + 4], [CS + 8 - M - 1, ry + 7], [CS + 8, ry + 7]]), RAIL, { x:CS + 2, y:ry + 3.5, r:10 }, { flat:true, lw:1 });
      } else { const p = RR(-8, ry, CS + 16, 7, 2); S.part(g, p, RAIL, { x:hw, y:ry + 3.5, r:hw + 10 }, { flat:true, lw:1.1 }); grainH(g, p, -8, CS + 8, ry, ry + 7, RAIL, R); }
    }
    // plank tops per state
    const tops = [0, 0, 0], a = seed % 3, b = (seed + 1) % 3;
    if (state === 1) tops[a] = 1;
    if (state === 2){ tops[a] = 2; tops[b] = 1; }
    if (broken) tops.fill(3);
    for (let i = 0; i < 3; i++){
      const px = 6 + i * 22, top = tops[i], p = plankPath(px, top, R), col = WOODS[(seed + i) % 3];
      S.part(g, p, col, { x:px + 9, y:-14, r:27 }, { flat:true, mat:'wood', lw:1.3 });
      g.save(); p(g); g.clip(); g.fillStyle = 'rgba(255,240,210,.22)'; g.fillRect(px + 1, -46, 2.5, 60); g.fillStyle = rgba(col.deep, .25); g.fillRect(px + 15, -46, 2.5, 60); g.restore();
      if (top >= 2){
        const ty = top === 2 ? -21 : -13;
        g.save(); p(g); g.clip(); g.fillStyle = rgba(RAW.light, .8); g.fillRect(px, ty, 18, 7); g.restore();
        sliver(g, PL([[px + 3, ty + 2], [px + 6, ty - 9 - R() * 4], [px + 8, ty + 1]]), RAW, { x:px + 6, y:ty - 3, r:6 });
        if (top === 2) sliver(g, PL([[px + 12, ty + 4], [px + 15, ty - 5 - R() * 3], [px + 17, ty + 3]]), RAW, { x:px + 14, y:ty, r:5 });
      } else for (const ry of [-19, 1]) S.rivet(g, px + 9, ry + 3.5, 1.8, IRON);
      if (state >= 1 && top <= 1 && (i === b || state >= 2)) crack(g, jag(R, px + 4 + R() * 8, -30 + R() * 6, px + 6 + R() * 8, -4 + R() * 10, 4, 5), 1.1, .55);
    }
    // the rope lashing: taut, sagging through a gap, or hanging loose from the posts
    if (!broken){ const sag = state >= 2 ? 5 : 1.5; rope(g, [[-8, -8], [hw, -8 + sag], [CS + 8, -8]], ROPE, 5); }
    else { rope(g, [[-2, -8], [5, -1], [8, 9]], ROPE, 5); rope(g, [[CS + 2, -8], [CS - 4, 0], [CS - 6, 10]], ROPE, 5); }
    // splinters and chunks on the ground
    if (state >= 2){ const n = broken ? 6 : 3; for (let i = 0; i < n; i++){ const x = 8 + R() * (CS - 16), y = 8 + R() * 8, L = 6 + R() * 8, ang = (R() - .5) * 1.2; g.save(); g.translate(x, y); g.rotate(ang); sliver(g, RR(-L / 2, -1.5, L, 3, 1.5), i % 2 ? RAW : WOODS[2], { x:0, y:0, r:L / 2 }); g.restore(); } }
    if (broken) for (let i = 0; i < 3; i++){ const x = 12 + R() * (CS - 24), y = 10 + R() * 6; S.part(g, PL([[x - 5, y + 2], [x - 2, y - 4], [x + 4, y - 3], [x + 6, y + 2]]), WOODS[1], { x, y, r:6 }, { flat:true, mat:'wood', lw:.9 }); }
    // the post on the column's left boundary (the last column's right post is a separate sprite)
    post(g, 0, broken ? .06 : 0, R);
  });
}
export function postSprite(k){ k = bakeK(k); return bake(`post:${k}`, 22, 74, 11, 54, k, g => post(g, 0, 0, rng(3))); }

// ---------- graves: three toy headstones on a mound of turned earth ----------
const STONE_G = pal('#a3a6ba'), STONE_D = pal('#7f8398'), EARTH = pal('#5e3f27'), BONE = pal('#efe6cf'), MOSSC = pal('#5c8a3a');
function chisel(g, p, c){ g.save(); g.translate(.8, .8); S.stroke(g, p, c, 1.2, .55); g.restore(); g.save(); g.translate(-.6, -.6); p(g); g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 1; g.stroke(); g.restore(); }
function engrave(g, p, c){ p(g); g.fillStyle = rgba(c.deep, .6); g.fill(); g.save(); g.translate(.7, .7); p(g); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.stroke(); g.restore(); }
function skull(g, x, y){
  S.part(g, E(x, y, 7.5, 7), BONE, { x, y, r:7.5 }, { flat:true, mat:'bone', lw:.9 });
  S.part(g, RR(x - 4.5, y + 3, 9, 5, 2), BONE, { x, y:y + 5, r:5 }, { flat:true, lw:.8 });
  g.fillStyle = '#2b2030'; ell(g, x - 3, y - 1, 2.2, 2.5); g.fill(); ell(g, x + 3, y - 1, 2.2, 2.5); g.fill();
  g.beginPath(); g.moveTo(x, y + 1); g.lineTo(x - 1.2, y + 3.2); g.lineTo(x + 1.2, y + 3.2); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(43,32,48,.7)'; g.lineWidth = .8; for (const tx of [-2.5, 0, 2.5]){ g.beginPath(); g.moveTo(x + tx, y + 5); g.lineTo(x + tx, y + 7.5); g.stroke(); }
}
export function graveSprite(k, v){
  k = bakeK(k);
  return bake(`grave:${k}:${v}`, 76, 70, 38, 36, k, g => {
    const R = rng(v * 13 + 7);
    S.shadow(g, 0, 26, 27, 7);
    // mound of turned earth with clods
    S.part(g, E(0, 21, 29, 9), EARTH, { x:-2, y:18, r:28 }, { flat:true, mat:'stone', lw:1.1 });
    for (let i = 0; i < 5; i++){ const x = (R() - .5) * 46, y = 17 + R() * 8, r = 2 + R() * 2; S.part(g, E(x, y, r, r * .7, R() * 3), EARTH, { x, y, r }, { flat:true, lw:.7, noEdge:true }); }
    if (v === 1){   // a stone cross on a plinth
      S.part(g, RR(-15, 8, 30, 13, 3), STONE_D, { x:0, y:14, r:17 }, { flat:true, mat:'stone', lw:1.2 });
      S.contact(g, RR(-15, 8, 30, 13, 3), 0, 9, 8, 4, .45);
      const cross = g2 => { g2.beginPath(); g2.roundRect(-5.5, -30, 11, 42, 3.5); g2.roundRect(-17, -16, 34, 10.5, 3.5); };
      S.part(g, cross, STONE_G, { x:-2, y:-10, r:24 }, { mat:'stone', lw:1.3, hx:-3, hy:-25 });
      chisel(g, RR(-3.5, -28, 7, 38, 2), STONE_G); chisel(g, RR(-15, -14, 30, 6.5, 2), STONE_G);
      crack(g, jag(R, 3, -2, 5, 8, 3, 3), 1.1, .6);
    } else {
      g.save(); if (v === 2) g.rotate(-.09);
      const p = v === 0 ? SM([[-18, 22, 1], [-18, -6], [-12, -21], [0, -26], [12, -21], [18, -6], [18, 22, 1]], .8) : SM([[-23, 20, 1], [-23, -6], [-17, -17], [0, -21], [17, -17], [23, -6], [23, 20, 1]], .8);
      S.part(g, p, v === 2 ? STONE_D : STONE_G, { x:-3, y:-4, r:27 }, { mat:'stone', lw:1.4, hx:-9, hy:-18 });
      const inner = v === 0 ? SM([[-14, 18, 1], [-14, -5], [-9.5, -17], [0, -21], [9.5, -17], [14, -5], [14, 18, 1]], .8) : SM([[-19, 16, 1], [-19, -5], [-14, -13], [0, -17], [14, -13], [19, -5], [19, 16, 1]], .8);
      chisel(g, inner, STONE_G);
      if (v === 0) engrave(g, g2 => { g2.beginPath(); g2.roundRect(-2.5, -15, 5, 21, 2); g2.roundRect(-8, -9.5, 16, 5, 2); }, STONE_G);
      else skull(g, 0, -3);
      crack(g, jag(R, v === 0 ? 10 : -14, -12, v === 0 ? 14 : -9, 6, 4, 4), 1.2, .65);
      g.restore();
    }
    // moss at the base and a few pebbles
    for (const [x, y, rx, ry, rot] of [[13, 15, 7.5, 4, -.4], [-12, 16, 5.5, 3, .3]]) S.part(g, E(x, y, rx, ry, rot), MOSSC, { x, y, r:rx }, { flat:true, mat:'moss', noEdge:true });
    for (let i = 0; i < 3; i++){ const x = (R() - .5) * 50, y = 22 + R() * 4; S.part(g, E(x, y, 1.8, 1.3), STONE_D, { x, y, r:2 }, { flat:true, lw:.6 }); }
  });
}

// ---------- puddles: glossy dark water in a muddy rim, with reeds and a lily pad ----------
const MUD = pal('#4a3524'), REED = pal('#6a9a3c'), PAD = pal('#4e9448'), CAT = pal('#6e4b2b');
export function puddleSprite(k, seed){
  k = bakeK(k); const rx = CS * .44, ry = 14;
  return bake(`puddle:${k}:${seed}`, CS + 16, 64, CS / 2 + 8, 42, k, g => {
    const R = rng(seed * 19 + 3), side = seed % 2 ? 1 : -1;
    S.part(g, E(0, 1.5, rx + 6, ry + 4.5), MUD, { x:0, y:0, r:rx + 6 }, { flat:true, mat:'stone', lw:1.1 });
    const wp = E(0, 0, rx, ry);
    let gr = g.createLinearGradient(0, -ry, 0, ry); gr.addColorStop(0, '#0b2436'); gr.addColorStop(.5, '#164561'); gr.addColorStop(1, '#2c7593');
    wp(g); g.fillStyle = gr; g.fill();
    g.save(); wp(g); g.clip();
    gr = g.createRadialGradient(rx * .15, ry * .7, 0, rx * .15, ry * .7, rx * .8); gr.addColorStop(0, 'rgba(120,190,215,.45)'); gr.addColorStop(1, 'rgba(120,190,215,0)'); g.fillStyle = gr; g.fillRect(-rx, -ry, rx * 2, ry * 2);
    g.save(); g.shadowColor = 'rgba(255,255,255,.9)'; g.shadowBlur = 6; g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, -rx * .3, -ry * .3, rx * .3, 2.2, -.12); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, rx * .1, -ry * .05, rx * .14, 1.4, -.12); g.fill(); g.restore();
    gr = g.createLinearGradient(0, -ry, 0, -ry * .2); gr.addColorStop(0, 'rgba(4,14,22,.75)'); gr.addColorStop(1, 'rgba(4,14,22,0)'); g.fillStyle = gr; g.fillRect(-rx, -ry, rx * 2, ry);
    g.restore();
    g.lineWidth = 1.8; g.strokeStyle = 'rgba(160,220,240,.6)'; g.beginPath(); g.ellipse(0, 0, rx - .5, ry - .5, 0, .15 * Math.PI, .85 * Math.PI); g.stroke();
    g.strokeStyle = 'rgba(6,18,28,.8)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 1.1 * Math.PI, 1.9 * Math.PI); g.stroke();
    // lily pad with a notch and a tiny flower
    const lx = -side * rx * .4, ly = ry * .25;
    S.part(g, E(lx, ly, 9, 5.5), PAD, { x:lx, y:ly, r:9 }, { flat:true, mat:'skin', lw:1 });
    g.fillStyle = '#164561'; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 10, ly - 5.5); g.lineTo(lx + 10, ly - 1); g.closePath(); g.fill();
    S.dot(g, E(lx - 3, ly - 2, 2.2, 2), '#ff9ec8'); S.dot(g, E(lx - 3, ly - 2.4, .9, .9), '#ffe27a');
    // reeds on the bank with one cattail and a leaf blade
    const bx = side * rx * .72;
    for (let i = 0; i < 3; i++){ const x = bx + (i - 1) * 4, h = 22 + R() * 12, lean = (R() - .5) * 6; S.tube(g, SO([[x, 4], [x + lean * .5, 4 - h * .5], [x + lean, 4 - h]]), REED, 2.4); if (i === 1) S.part(g, RR(x + lean - 2, 4 - h - 2, 4, 9, 2), CAT, { x:x + lean, y:4 - h + 2, r:4 }, { flat:true, lw:.8 }); }
    S.part(g, SM([[bx - side * 6, 4], [bx - side * 10, -10], [bx - side * 16, -22], [bx - side * 8, -12]]), REED, { x:bx - side * 10, y:-10, r:8 }, { flat:true, lw:.8 });
  });
}

// ---------- sea: a baked base per height, a scrolling wave tile and a foam tile for the shoreline ----------
export function seaSprite(k, h){
  k = bakeK(k); h = Math.round(h);
  return bake(`sea:${k}:${h}`, W, h, 0, 0, k, g => {
    const R = rng(77);
    let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0c2f45'); gr.addColorStop(.45, '#174c66'); gr.addColorStop(.85, '#1f6a83'); gr.addColorStop(1, '#2b8199'); g.fillStyle = gr; g.fillRect(0, 0, W, h);
    for (let i = 0; i < 5; i++){ const x = R() * W, y = h * (.1 + R() * .35), r = 40 + R() * 60; gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(4,18,30,.35)'); gr.addColorStop(1, 'rgba(4,18,30,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.save(); g.translate(W * .62, h * .5); g.scale(1, Math.max(1, h / 90)); gr = g.createRadialGradient(0, 0, 0, 0, 0, 70); gr.addColorStop(0, 'rgba(225,245,250,.22)'); gr.addColorStop(.5, 'rgba(225,245,250,.08)'); gr.addColorStop(1, 'rgba(225,245,250,0)'); g.fillStyle = gr; g.fillRect(-70, -70, 140, 140); g.restore();
    g.lineCap = 'round'; g.lineWidth = 1.2;
    const n = Math.round(W * h / 900);
    for (let i = 0; i < n; i++){ const y = h * (.3 + Math.sqrt(R()) * .68), x = R() * W, L = 20 + R() * 40; g.strokeStyle = `rgba(150,225,240,${.08 + (y / h) * .14})`; g.beginPath(); g.moveTo(x, y); for (let d = 8; d <= L; d += 8) g.lineTo(x + d, y + Math.sin(d * .4 + i) * 2.5); g.stroke(); }
    for (let i = 0; i < n / 3; i++){ const x = R() * W, y = h * (.2 + R() * .75); g.fillStyle = `rgba(235,250,255,${.15 + R() * .25})`; ell(g, x, y, 1.6 + R(), .9); g.fill(); }
  });
}
export function waveTile(k){
  k = bakeK(k);
  return bake(`wave:${k}`, 240, 30, 0, 0, k, g => {
    const top = x => 11 + Math.sin(x / 240 * TAU * 2) * 3.5 + Math.sin(x / 240 * TAU * 4 + 1) * 1.5;
    g.beginPath(); g.moveTo(0, top(0)); for (let x = 4; x <= 240; x += 4) g.lineTo(x, top(x)); g.lineTo(240, 30); g.lineTo(0, 30); g.closePath();
    const gr = g.createLinearGradient(0, 8, 0, 30); gr.addColorStop(0, 'rgba(170,225,240,.34)'); gr.addColorStop(1, 'rgba(170,225,240,0)'); g.fillStyle = gr; g.fill();
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, top(0) - 1.6); for (let x = 4; x <= 240; x += 4) g.lineTo(x, top(x) - 1.6); g.strokeStyle = 'rgba(30,90,120,.35)'; g.lineWidth = 1.2; g.stroke();
    g.beginPath(); g.moveTo(0, top(0)); for (let x = 4; x <= 240; x += 4) g.lineTo(x, top(x)); g.strokeStyle = 'rgba(225,248,252,.6)'; g.lineWidth = 2; g.stroke();
    for (const x of [60, 180]){ g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, x, top(x) - 1, 5, 2); g.fill(); ell(g, x + 9, top(x + 9) - .5, 2.5, 1.4); g.fill(); }
  });
}
export function foamTile(k){
  k = bakeK(k);
  return bake(`foam:${k}`, 240, 30, 0, 0, k, g => {
    const R = rng(5);
    g.strokeStyle = 'rgba(8,36,54,.4)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 17); for (let x = 8; x <= 240; x += 8) g.lineTo(x, 17 + Math.sin(x / 240 * TAU * 3) * 1.5); g.stroke();
    for (let i = 0; i < 18; i++){ const x = i * 13.3 + R() * 6, y = 12 + (R() - .5) * 5, r = 4.5 + R() * 4.5;
      for (const xx of [x - 240, x, x + 240]){ const gr = g.createRadialGradient(xx, y, 0, xx, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.55, 'rgba(240,250,255,.8)'); gr.addColorStop(1, 'rgba(240,250,255,0)'); g.fillStyle = gr; ell(g, xx, y, r, r * .7); g.fill(); } }
    for (let i = 0; i < 14; i++){ const x = R() * 240, y = 6 + R() * 12; g.fillStyle = 'rgba(255,255,255,.75)'; ell(g, x, y, 1.2 + R(), 1 + R() * .6); g.fill(); }
  });
}

// ---------- fog: horizontally tileable mist layers (big billows, small wisps, an eerie green glow) ----------
export function mistTile(k, kind){
  k = bakeK(k);
  return bake(`mist:${k}:${kind}`, 256, 192, 0, 0, k, g => {
    const R = rng(kind === 'a' ? 21 : kind === 'b' ? 43 : 65);
    const n = kind === 'a' ? 10 : kind === 'b' ? 16 : 8, col = kind === 'a' ? '196,212,222' : kind === 'b' ? '232,240,244' : '130,245,205';
    for (let i = 0; i < n; i++){   // flat, elongated billows: mist drifts sideways, it does not pile up like cloud
      const r = kind === 'a' ? 44 + R() * 32 : kind === 'b' ? 18 + R() * 16 : 30 + R() * 26, ry = r * (kind === 'g' ? .4 + R() * .2 : .3 + R() * .2);
      const x = R() * 256, y = ry + 6 + R() * (180 - ry * 2);   // whole blob inside the tile, so a scaled band never shows a hard cut
      for (const xx of [x - 256, x, x + 256]){
        if (xx + r < 0 || xx - r > 256) continue;
        g.save(); g.translate(xx, y); g.scale(1, ry / r);
        const gr = g.createRadialGradient(-r * .2, -r * .25, 0, 0, 0, r); gr.addColorStop(0, `rgba(${col},${kind === 'b' ? .6 : .55})`); gr.addColorStop(.5, `rgba(${col},${kind === 'b' ? .3 : .28})`); gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2); g.restore();
      }
    }
    if (kind === 'a'){   // darker hollows between the billows so the bank reads as layered, not flat
      for (let i = 0; i < 6; i++){ const r = 26 + R() * 24, x = R() * 256, y = r * .5 + 10 + R() * (170 - r); for (const xx of [x - 256, x, x + 256]){ if (xx + r < 0 || xx - r > 256) continue; g.save(); g.translate(xx, y); g.scale(1, .45); const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, 'rgba(90,110,125,.3)'); gr.addColorStop(1, 'rgba(90,110,125,0)'); g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2); g.restore(); } }
    }
  });
}
/** A mist band `len` long and `thick` deep at (x, y); `vertical` turns it into a column of width `thick`. Dense at the core, drifting layers, faint glow; thin when a Lantern has cleared it. */
/** A fog bank. The hide extent is the rect minus `pad` on each side: that core is uniformly dense (monsters inside are invisible),
 *  and only the `pad` fringe outside it is translucent, so players never see a thin patch with a monster hidden in it (owner, 2026-09-26). */
export function drawMist(g, k, x, y, len, thick, t, cleared, idx, vertical, pad = 26){
  g.save();
  if (vertical){ g.translate(x + thick, y); g.rotate(Math.PI / 2); } else g.translate(x, y);
  const al = cleared ? .15 : .94, p = Math.min(.45, pad / thick);
  const gr = g.createLinearGradient(0, 0, 0, thick);
  gr.addColorStop(0, 'rgba(150,176,192,0)'); gr.addColorStop(p * .55, `rgba(156,182,196,${al * .3})`); gr.addColorStop(p, `rgba(168,192,204,${al})`); gr.addColorStop(1 - p, `rgba(168,192,204,${al})`); gr.addColorStop(1 - p * .55, `rgba(156,182,196,${al * .3})`); gr.addColorStop(1, 'rgba(150,176,192,0)');
  g.fillStyle = gr; g.fillRect(0, 0, len, thick);
  // tiles are always at least 256 wide (thin bands stretch the billows sideways), so a band costs a handful of draws whatever its depth
  // Three layers (billows one way, wisps the other, a glow): the cost is fill area, so the band stays at ~3 screen passes on a phone
  const tw = Math.max(256, 256 * thick / 192);
  const layer = (tile, speed, alpha, sx, dy) => { const w = tw * sx, n = Math.ceil(len / w) + 1, off = ((t * speed + idx * 91) % w + w) % w - w; g.globalAlpha = alpha; for (let j = 0; j <= n; j++) g.drawImage(tile.c, off + j * w, dy, w, thick); };
  if (cleared) layer(mistTile(k, 'b'), -14, .16, 1, 0);
  else {
    // a second flat pass keeps the core opaque under the billow gaps; the billows then only add texture
    g.fillStyle = `rgba(172,194,206,${al * .55})`; g.fillRect(0, pad, len, Math.max(0, thick - pad * 2));
    layer(mistTile(k, 'a'), 7, .85, 1.3, Math.sin(t * .5 + idx) * thick * .03);
    layer(mistTile(k, 'b'), -17, .55, .8, Math.sin(t * .8 + idx * 2) * thick * .05);
    g.globalCompositeOperation = 'lighter';
    layer(mistTile(k, 'g'), 5, .2 + .07 * Math.sin(t * 1.3 + idx), 1.2, 0);
  }
  g.restore();
}

/** A soft warm glow disc for live flicker (torches). */
export function glowSprite(k, col = '#ffa040'){ k = bakeK(k); return bake(`glow:${k}:${col}`, 64, 64, 32, 32, k, g => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 32); gr.addColorStop(0, rgba(col, .9)); gr.addColorStop(.4, rgba(col, .35)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(-32, -32, 64, 64); }); }

// ---------- castle walls: rough hewn courses, crenellations, a portcullis, moss and a torch; three damage states ----------
const STONE = pal('#8f90a0'), STONED = pal('#6d6f80'), STONEL = pal('#a8a9b8'), IRONC = pal('#4c505c'), TORCH = pal('#5a3a20');
function bakeCastle(k, state){
  const w = CS * 1.04, hw = w / 2;
  return bake(`castle:${k}:${state}`, w, 90, hw, 62, k, g => {
    const R = rng(11 + state * 7);
    S.shadow(g, 0, 22, hw, 6);
    // block courses, bottom to top; missing blocks show a dark hole
    const rows = [[8, 20], [-4, 8], [-16, -4], [-28, -16]];
    const holes = state === 0 ? [] : state === 1 ? [[3, 0]] : [[3, 0], [3, 2], [2, 3]];
    rows.forEach(([y0, y1], ri) => { const n = ri % 2 ? 3 : 4, bw = (hw * 2) / n;
      for (let i = 0; i < n; i++){ const bx = -hw + i * bw;
        if (holes.some(([r, c]) => r === ri && c === i)){ g.fillStyle = '#17121c'; g.beginPath(); g.roundRect(bx + 1, y0 + 1, bw - 2, y1 - y0 - 2, 2); g.fill(); const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(60,50,70,.2)'); g.fillStyle = gr; g.fillRect(bx + 1, y0 + 1, bw - 2, y1 - y0 - 2); continue; }
        const q = R(), col = q < .25 ? STONED : q < .8 ? STONE : STONEL, jit = (R() - .5) * 1.2;
        S.part(g, RR(bx + 1, y0 + 1 + jit, bw - 2, y1 - y0 - 2, 2.5), col, { x:bx + bw / 2, y:(y0 + y1) / 2, r:bw * .62 }, { mat:'stone', flat:R() < .6, lw:1.3, hx:bx + bw * .3, hy:y0 + 3 });
      } });
    // portcullis: a dark arch with iron bars and a warm glow inside
    const arch = SM([[-8, 20, 1], [-8, -12], [0, -21], [8, -12], [8, 20, 1]], .9);
    arch(g); g.fillStyle = '#120c16'; g.fill();
    g.save(); arch(g); g.clip();
    let gr = g.createRadialGradient(0, 22, 0, 0, 22, 26); gr.addColorStop(0, 'rgba(255,150,60,.35)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(-10, -22, 20, 44);
    g.strokeStyle = IRONC.base; g.lineWidth = 1.7; g.lineCap = 'round'; for (const x of [-4, 0, 4]){ g.beginPath(); g.moveTo(x, -20); g.lineTo(x, 22); g.stroke(); } for (const y of [-10, 0, 10]){ g.beginPath(); g.moveTo(-9, y); g.lineTo(9, y); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = .6; for (const x of [-4, 0, 4]){ g.beginPath(); g.moveTo(x - .6, -20); g.lineTo(x - .6, 22); g.stroke(); }
    g.restore();
    for (let i = 0; i < 5; i++){ const a = Math.PI + i * Math.PI / 4, cx = Math.cos(a) * 10.5, cy = -12 + Math.sin(a) * 10.5; g.save(); g.translate(cx, cy); g.rotate(a + Math.PI / 2); S.part(g, RR(-3.6, -2.6, 7.2, 5.2, 1.5), STONED, { x:0, y:0, r:4 }, { mat:'stone', flat:true, lw:1 }); g.restore(); }
    // cornice ledge and crenellations
    S.part(g, RR(-hw - 1.5, -35, hw * 2 + 3, 7, 2), STONED, { x:0, y:-31.5, r:hw + 2 }, { mat:'stone', flat:true, lw:1.2 });
    for (const [mx, mi] of [[-hw + 1, 0], [-7, 1], [hw - 15, 2]]){
      if (state === 2 && mi === 1) continue;
      let p;
      if (state >= 1 && mi === 2) p = PL([[mx, -35], [mx, -46], [mx + 4, -43], [mx + 8, -50], [mx + 11, -44], [mx + 14, -47], [mx + 14, -35]]);
      else if (state === 2 && mi === 0) p = PL([[mx, -35], [mx, -42], [mx + 5, -45], [mx + 9, -40], [mx + 14, -43], [mx + 14, -35]]);
      else p = RR(mx, -50, 14, 15, 2.5);
      S.part(g, p, mi === 1 ? STONEL : STONE, { x:mx + 7, y:-43, r:9 }, { mat:'stone', lw:1.3, hx:mx + 4, hy:-47 });
    }
    // moss clumps and a hanging strand
    for (const [x, y, rx, ry] of [[-hw + 9, 17, 7, 3.5], [hw - 11, 18, 5.5, 3], [-hw + 3, -30, 5, 2.5], [6, 12, 4, 2.2]]) S.part(g, E(x, y, rx, ry), MOSSC, { x, y, r:rx }, { flat:true, mat:'moss', noEdge:true });
    S.tube(g, SO([[-hw + 4, -29], [-hw + 5, -20], [-hw + 3, -12]]), MOSSC, 2.2);
    // torch bracket on the right (the flicker is drawn live)
    const tx = hw - 9;
    S.part(g, RR(tx - 2.5, -8, 5, 9, 1.5), IRONC, { x:tx, y:-4, r:5 }, { flat:true, mat:'metal', lw:.9 }); S.rivet(g, tx, -6, 1.3, IRONC);
    S.tube(g, SO([[tx, -6], [tx + 1, -22]]), TORCH, 3.6);
    g.save(); g.shadowColor = '#ff9a30'; g.shadowBlur = 8; SM([[tx + 1, -36], [tx - 4, -27], [tx + 1, -21], [tx + 6, -27]], .9)(g); gr = g.createRadialGradient(tx + 1, -25, 0, tx + 1, -27, 10); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(.45, '#ffc93a'); gr.addColorStop(1, '#ff6a1a'); g.fillStyle = gr; g.fill(); g.restore();
    // damage: deepening cracks, then rubble at the foot
    if (state >= 1){ crack(g, jag(R, -hw * .6, -26, -hw * .45, 6, 5, 6), 2, .9); crack(g, jag(R, hw * .35, -14, hw * .5, 14, 4, 5), 1.8, .85); }
    if (state >= 2){ crack(g, jag(R, -hw * .2, -46, hw * .25, 18, 7, 9), 2.4, .95); crack(g, jag(R, hw * .55, -30, hw * .8, -8, 4, 5), 1.8, .85);
      for (let i = 0; i < 5; i++){ const x = -hw + 6 + R() * (hw * 2 - 12), y = 20 + R() * 5, r = 3 + R() * 2.5; g.save(); g.translate(x, y); g.rotate(R() * 3); S.part(g, RR(-r, -r * .6, r * 2, r * 1.2, 1.5), STONED, { x:0, y:0, r }, { mat:'stone', flat:true, lw:.9 }); g.restore(); } }
  });
}
export function castleSprite(k, hpFrac){ return bakeCastle(bakeK(k), hpFrac > .66 ? 0 : hpFrac > .33 ? 1 : 2); }
