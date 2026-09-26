// ---------- Toy Plastic painter ----------
// The art style approved on the style sheet (docs/superpowers/specs/2026-09-26-toy-plastic-sprites-design.md):
// glossy volume shading with a bevel, bounce light and a thin dark-tone edge, plus surface materials.
// Everything here draws in "drawing units" on any 2D context; characters in chars.js are built from it.

import { TAU } from '../util.js';

const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const mix = (a, b, t) => { const A = hex2(a), B = hex2(b); return '#' + A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, '0')).join(''); };
export const rgba = (h, a) => { const [r, g, b] = hex2(h); return `rgba(${r},${g},${b},${a})`; };
export const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); };
export const E = (x, y, rx, ry, rot = 0) => g => ell(g, x, y, rx, ry, rot);
export const RR = (x, y, w, h, r) => g => { g.beginPath(); g.roundRect(x, y, w, h, r); };
export const PL = pts => g => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
/** Smooth closed blob through points (Catmull-Rom). A point with a third element of 1 is a sharp corner. */
export const SM = (pts, t = .9) => g => { g.beginPath(); const n = pts.length; g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++){ const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = p1[2] ? [p1[0], p1[1]] : [p1[0] + (p2[0] - p0[0]) * t / 6, p1[1] + (p2[1] - p0[1]) * t / 6], c2 = p2[2] ? [p2[0], p2[1]] : [p2[0] - (p3[0] - p1[0]) * t / 6, p2[1] - (p3[1] - p1[1]) * t / 6];
    g.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]); } g.closePath(); };
/** Open smooth stroke path through points. */
export const SO = (pts, t = .9) => g => { g.beginPath(); const n = pts.length; g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, n - 1)];
    g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * t / 6, p1[1] + (p2[1] - p0[1]) * t / 6, p2[0] - (p3[0] - p1[0]) * t / 6, p2[1] - (p3[1] - p1[1]) * t / 6, p2[0], p2[1]); } };
export function pal(base){ return { base, light:mix(base, '#ffffff', .45), dark:mix(base, '#2a1236', .4), deep:mix(base, '#140a20', .66), rim:mix(base, '#fff1c8', .62) }; }
/** Tiny seeded generator so textures and scatter are the same every frame. */
export function rng(seed){ let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

// ---------- texture patterns (built once, lazily: no DOM at import time) ----------
let PAT = null;
function patCanvas(size, fn){ const c = document.createElement('canvas'); c.width = c.height = size; fn(c.getContext('2d'), size); return c; }
function patterns(){
  if (PAT) return PAT;
  PAT = {
    speckle: patCanvas(64, (g, s) => { const R = rng(11); for (let i = 0; i < 150; i++){ const v = R() < .5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${.35 + R() * .4})`; const r = .6 + R() * 1.1; ell(g, R() * s, R() * s, r, r); g.fill(); } }),
    mottle: patCanvas(96, (g, s) => { const R = rng(23); for (let i = 0; i < 70; i++){ const v = R() < .5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${.18 + R() * .22})`; ell(g, R() * s, R() * s, 1.5 + R() * 2.5, 5 + R() * 10, (R() - .5) * .4); g.fill(); } }),
    weave: patCanvas(6, (g, s) => { g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(0, 0, s, 1); g.fillRect(0, 0, 1, s); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(1, 1, 2, 1); g.fillRect(3, 3, 1, 2); }),
    streak: patCanvas(64, (g, s) => { const R = rng(7); for (let i = 0; i < 70; i++){ const v = R() < .5 ? 0 : 255; g.strokeStyle = `rgba(${v},${v},${v},${.2 + R() * .45})`; g.lineWidth = .6 + R() * .8; const x = R() * s, y = R() * s, l = 6 + R() * 24; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (R() - .5) * 1.2); g.stroke(); } }),
    scales: patCanvas(24, (g, s) => { g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++){ const x = c * 6 + (r % 2 ? 3 : 0), y = r * 6; g.beginPath(); g.arc(x, y, 3, 0, Math.PI); g.stroke(); } g.strokeStyle = 'rgba(255,255,255,.35)'; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++){ const x = c * 6 + (r % 2 ? 3 : 0), y = r * 6 - 1; g.beginPath(); g.arc(x, y, 3, 0, Math.PI); g.stroke(); } }),
    fuzz: patCanvas(48, (g, s) => { const R = rng(41); for (let i = 0; i < 90; i++){ const v = R() < .55 ? 0 : 255; g.strokeStyle = `rgba(${v},${v},${v},${.25 + R() * .4})`; g.lineWidth = .8; const x = R() * s, y = R() * s, a = R() * TAU; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); g.stroke(); } }),
  };
  return PAT;
}
function over(g, pat, a, b, op = 'overlay'){ g.save(); g.globalCompositeOperation = op; g.globalAlpha *= a; g.fillStyle = g.createPattern(pat, 'repeat'); g.fillRect(b.x - b.r * 3, b.y - b.r * 3, b.r * 6, b.r * 6); g.restore(); }
function freckles(g, c, b, n, a, size = 1){ const R = rng(b.x * 7 + b.y * 13 + b.r * 3 | 0); g.fillStyle = rgba(c.deep, a); for (let i = 0; i < n; i++){ const ang = R() * TAU, d = R() * b.r * .8, x = b.x + Math.cos(ang) * d + b.r * .15, y = b.y + Math.sin(ang) * d + b.r * .15, r = (1 + R() * 1.6) * size; ell(g, x, y, r, r * .8, R() * 3); g.fill(); } }
function scratches(g, b, n){ const R = rng(b.x * 3 + b.y * 5 + 11 | 0); for (let i = 0; i < n; i++){ const x = b.x + (R() - .5) * b.r * 1.2, y = b.y + (R() - .5) * b.r * 1.2, l = b.r * (.2 + R() * .4), a = (R() - .5) * 1.2; g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = .8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(x, y + 1); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l + 1); g.stroke(); } }
/** Surface materials, applied inside a part's clip after the volume shading. */
export const MATS = {
  pumpkin(g, c, b){ const P = patterns(); over(g, P.mottle, .32, b); freckles(g, c, b, 2, .14); g.fillStyle = 'rgba(255,255,255,.1)'; ell(g, b.x - b.r * .15, b.y - b.r * .4, b.r * .5, b.r * .16, -.3); g.fill(); },
  skin(g, c, b){ const P = patterns(); over(g, P.speckle, .36, b); freckles(g, c, b, 5, .12); },
  scaly(g, c, b){ const P = patterns(); over(g, P.scales, .32, b); over(g, P.speckle, .25, b); },
  cloth(g, c, b){ const P = patterns(); over(g, P.weave, .22, b, 'multiply'); over(g, P.speckle, .18, b); },
  bandage(g, c, b){ const P = patterns(); over(g, P.weave, .3, b, 'multiply'); over(g, P.speckle, .22, b); },
  metal(g, c, b){ const P = patterns(); over(g, P.streak, .5, b); scratches(g, b, 3); g.fillStyle = 'rgba(255,255,255,.13)'; ell(g, b.x, b.y - b.r * .22, b.r * .95, b.r * .11); g.fill(); },
  paint(g, c, b){ const P = patterns(); over(g, P.speckle, .3, b); const R = rng(b.x + b.y * 3 | 0); for (let i = 0; i < 4; i++){ g.fillStyle = 'rgba(255,240,220,.5)'; ell(g, b.x + (R() - .5) * b.r * 1.3, b.y + (R() - .5) * b.r * 1.3, 1.4 + R() * 1.4, 1 + R(), R() * 3); g.fill(); } },
  gel(g, c, b){ let gr = g.createRadialGradient(b.x - b.r * .05, b.y + b.r * .25, 0, b.x, b.y + b.r * .2, b.r * .95); gr.addColorStop(0, rgba(c.light, .55)); gr.addColorStop(1, rgba(c.light, 0)); g.fillStyle = gr; g.fillRect(b.x - b.r * 3, b.y - b.r * 3, b.r * 6, b.r * 6);
    gr = g.createRadialGradient(b.x, b.y + b.r * 1.1, b.r * .2, b.x, b.y + b.r * 1.1, b.r * 1.1); gr.addColorStop(0, rgba(c.rim, .75)); gr.addColorStop(1, rgba(c.rim, 0)); g.fillStyle = gr; g.fillRect(b.x - b.r * 3, b.y - b.r * 3, b.r * 6, b.r * 6);
    const R = rng(b.x * 5 + b.y | 0); for (let i = 0; i < 7; i++){ const x = b.x + (R() - .5) * b.r * 1.4, y = b.y + (R() - .2) * b.r * 1.2, r = 1.2 + R() * 3; g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = .9; ell(g, x, y, r, r); g.fillStyle = 'rgba(255,255,255,.12)'; g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, x - r * .35, y - r * .35, r * .3, r * .3); g.fill(); } },
  wood(g, c, b){ const P = patterns(); over(g, P.streak, .35, b); g.strokeStyle = rgba(c.deep, .35); g.lineWidth = .9; for (let i = -2; i <= 2; i++){ const x = b.x + i * b.r * .3; g.beginPath(); g.moveTo(x, b.y - b.r * 1.5); g.quadraticCurveTo(x + b.r * .12, b.y, x, b.y + b.r * 1.5); g.stroke(); } },
  horn(g, c, b){ const P = patterns(); g.strokeStyle = rgba(c.deep, .3); g.lineWidth = 1; for (let i = 0; i < 5; i++){ const y = b.y - b.r * .8 + i * b.r * .4; g.beginPath(); g.moveTo(b.x - b.r * 1.2, y); g.quadraticCurveTo(b.x, y + b.r * .15, b.x + b.r * 1.2, y); g.stroke(); } over(g, P.streak, .25, b); },
  bone(g, c, b){ const P = patterns(); over(g, P.speckle, .3, b); },
  leather(g, c, b){ const P = patterns(); over(g, P.speckle, .4, b); over(g, P.weave, .12, b, 'multiply'); },
  stone(g, c, b){ const P = patterns(); over(g, P.speckle, .5, b); over(g, P.mottle, .25, b); freckles(g, c, b, 4, .16, 1.4); },
  moss(g, c, b){ const P = patterns(); over(g, P.fuzz, .6, b); over(g, P.speckle, .3, b); },
};

// ---------- the painter ----------
const cfg = { rim:.35, bevel:.7, bounce:.4, edge:{ w:1.6, a:.9 }, lineA:.85 };
export const S = {};
/** Fill a path with Toy Plastic volume: gradient, rim, bevel, bounce light, material, specular, edge. b = {x,y,r} is the sphere the shading follows. */
S.part = (g, p, c, b, o = {}) => {
  const { x, y, r } = b;
  p(g); g.fillStyle = c.base; g.fill();
  g.save(); p(g); g.clip();
  let gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .02, x - r * .12, y - r * .12, r * 1.35);
  gr.addColorStop(0, c.light); gr.addColorStop(.4, c.base); gr.addColorStop(.8, c.dark); gr.addColorStop(1, c.deep); g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  gr = g.createRadialGradient(x + r * .1, y + r * .15, r * .4, x + r * .1, y + r * .15, r * 1.04); gr.addColorStop(0, rgba(c.rim, 0)); gr.addColorStop(.78, rgba(c.rim, 0)); gr.addColorStop(1, rgba(c.rim, cfg.rim)); g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  gr = g.createRadialGradient(x, y, r * .7, x, y, r * 1.02); gr.addColorStop(0, rgba(c.deep, 0)); gr.addColorStop(.75, rgba(c.deep, 0)); gr.addColorStop(1, rgba(c.deep, cfg.bevel)); g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  gr = g.createRadialGradient(x - r * .3, y + r * .7, r * .1, x - r * .3, y + r * .7, r * .9); gr.addColorStop(0, rgba(c.rim, cfg.bounce)); gr.addColorStop(1, rgba(c.rim, 0)); g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  if (o.mat && MATS[o.mat]) MATS[o.mat](g, c, b);
  if (!o.flat){ const hx = o.hx ?? x - r * .4, hy = o.hy ?? y - r * .5; g.fillStyle = 'rgba(255,255,255,.95)'; ell(g, hx, hy, r * .17, r * .09, -.6); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, hx + r * .2, hy - r * .12, r * .05, r * .04); g.fill(); }
  g.restore();
  if (!o.noEdge){ p(g); g.strokeStyle = rgba(c.deep, cfg.edge.a); g.lineWidth = o.lw ?? cfg.edge.w; g.lineJoin = 'round'; g.stroke(); }
};
S.overlay = (g, p, c, b, a = .5) => { const { x, y, r } = b; g.save(); p(g); g.clip(); const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .2, x - r * .1, y - r * .1, r * 1.5); gr.addColorStop(0, rgba(c.deep, 0)); gr.addColorStop(.55, rgba(c.deep, 0)); gr.addColorStop(1, rgba(c.deep, a)); g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); g.restore(); };
S.stroke = (g, p, c, w, a) => { p(g); g.strokeStyle = rgba(c.deep, a ?? cfg.lineA); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
S.ln = (g, pts, c, w, a) => S.stroke(g, g2 => { g2.beginPath(); pts.forEach((p, i) => i ? g2.lineTo(p[0], p[1]) : g2.moveTo(p[0], p[1])); }, c, w, a);
/** A rounded limb: a thick stroke with edge, a shaded side and a lit side. */
S.tube = (g, p, c, w) => {
  p(g); g.strokeStyle = rgba(c.deep, cfg.edge.a); g.lineWidth = w + cfg.edge.w * 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
  p(g); g.strokeStyle = c.base; g.lineWidth = w; g.stroke();
  p(g); g.strokeStyle = rgba(c.dark, .4); g.lineWidth = w * .5; g.save(); g.translate(w * .2, w * .24); g.stroke(); g.restore();
  p(g); g.strokeStyle = rgba(c.light, .28); g.lineWidth = w * .16; g.save(); g.translate(-w * .22, -w * .26); g.stroke(); g.restore();
};
S.dot = (g, p, col, a = 1) => { const pa = g.globalAlpha; p(g); g.globalAlpha = pa * a; g.fillStyle = col; g.fill(); g.globalAlpha = pa; };
S.blush = (g, x, y, s = 1) => { g.save(); g.shadowColor = '#ff6a80'; g.shadowBlur = 6 * s; S.dot(g, E(x - 16 * s, y, 5 * s, 3 * s), '#ff7a90', .45); S.dot(g, E(x + 16 * s, y, 5 * s, 3 * s), '#ff7a90', .45); g.restore(); };
S.shadow = (g, x, y, rx, ry) => { const ox = rx * .15; const gr = g.createRadialGradient(x + ox, y, 0, x + ox, y, rx); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.translate(0, y); g.scale(1, ry / rx); g.translate(0, -y); g.fillStyle = gr; ell(g, x + ox, y, rx, rx); g.fill(); g.restore(); };
/** Soft dark contact shadow clipped to a shape, where another part sits on it. */
S.contact = (g, clip, x, y, rx, ry, a = .4) => { g.save(); clip(g); g.clip(); const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, `rgba(20,8,30,${a})`); gr.addColorStop(1, 'rgba(20,8,30,0)'); g.translate(0, y); g.scale(1, ry / rx); g.translate(0, -y); g.fillStyle = gr; ell(g, x, y, rx, rx); g.fill(); g.restore(); };
S.crease = (g, p, c, w = 2, a = .4) => { p(g); g.strokeStyle = rgba(c.deep, a); g.lineWidth = w; g.lineCap = 'round'; g.stroke(); g.save(); g.translate(-w * .5, -w * .5); p(g); g.strokeStyle = rgba(c.rim, a * .7); g.lineWidth = w * .5; g.stroke(); g.restore(); };
S.rivet = (g, x, y, r, c) => { const gr = g.createRadialGradient(x - r * .3, y - r * .4, 0, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.5, c.light); gr.addColorStop(1, c.deep); ell(g, x, y, r, r); g.fillStyle = gr; g.fill(); g.strokeStyle = rgba(c.deep, .7); g.lineWidth = .8; g.stroke(); };
S.thread = (g, x, y, dir, c) => { const R = rng(x * 3 + y * 7 | 0); g.strokeStyle = rgba(c.dark, .8); g.lineWidth = .9; for (let i = 0; i < 3; i++){ g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + dir * (3 + R() * 3), y + (R() - .5) * 6, x + dir * (6 + R() * 5), y + (R() - .5) * 10); g.stroke(); } };
/** Big toy eye: white with a top shadow, glossy pupil, iris crescent, two reflections. */
S.eye = (g, x, y, rx, ry, o = {}) => {
  const pr = (o.pr ?? .4) * Math.min(rx, ry), px = x + (o.lx ?? .18) * rx, py = y + (o.ly ?? .12) * ry;
  g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 3; g.shadowOffsetY = 1; ell(g, x, y, rx, ry); g.fillStyle = '#fff'; g.fill(); g.restore();
  let gr = g.createLinearGradient(0, y - ry, 0, y + ry * .3); gr.addColorStop(0, 'rgba(60,30,70,.35)'); gr.addColorStop(1, 'rgba(60,30,70,0)'); g.save(); ell(g, x, y, rx, ry); g.clip(); g.fillStyle = gr; g.fillRect(x - rx, y - ry, rx * 2, ry * 2); g.restore();
  ell(g, x, y, rx, ry); g.strokeStyle = 'rgba(120,110,130,.5)'; g.lineWidth = 1; g.stroke();
  const pc = o.pupil ?? '#241a2a';
  gr = g.createRadialGradient(px - pr * .3, py - pr * .3, pr * .1, px, py, pr * 1.1); gr.addColorStop(0, mix(pc, '#ffffff', .35)); gr.addColorStop(1, pc); ell(g, px, py, pr, pr * 1.12); g.fillStyle = gr; g.fill();
  if (o.iris){ g.save(); ell(g, px, py, pr, pr * 1.12); g.clip(); g.fillStyle = rgba(o.iris, .7); ell(g, px, py + pr * .5, pr * .85, pr * .65); g.fill(); g.restore(); }
  g.fillStyle = 'rgba(255,255,255,.95)'; ell(g, px - pr * .35, py - pr * .45, pr * .4, pr * .28, -.5); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; ell(g, px + pr * .3, py + pr * .4, pr * .14, pr * .14); g.fill();
  if (o.lid){ g.save(); ell(g, x, y, rx, ry); g.clip(); g.translate(x, y); g.rotate(o.tilt ?? 0); g.fillStyle = o.lidCol; g.fillRect(-rx - 4, -ry - 4, rx * 2 + 8, ry * 2 * o.lid + 4); g.restore(); g.save(); g.translate(x, y); g.rotate(o.tilt ?? 0); g.beginPath(); g.moveTo(-rx, -ry + ry * 2 * o.lid); g.lineTo(rx, -ry + ry * 2 * o.lid); g.strokeStyle = rgba(o.lidDeep ?? '#241a2a', .6); g.lineWidth = 1.2; g.stroke(); g.restore(); }
};
S.glow = (g, x, y, r, col) => { g.save(); g.shadowColor = col; g.shadowBlur = 12; g.fillStyle = col; ell(g, x, y, r, r * 1.2); g.fill(); g.restore(); g.fillStyle = '#fff'; ell(g, x - r * .3, y - r * .4, r * .3, r * .3); g.fill(); };
/** Bandage strips laid across a clip shape, each with a shadowed and a lit edge. */
S.wrap = (g, clip, c, bands, w = 7) => { g.save(); clip(g); g.clip();
  for (const [x1, y1, x2, y2] of bands){ const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1) + 8; g.save(); g.translate((x1 + x2) / 2, (y1 + y2) / 2); g.rotate(a);
    S.part(g, RR(-L / 2, -w / 2, L, w, w * .35), c, { x:0, y:0, r:L / 2 }, { flat:true, mat:'bandage', lw:1 }); g.strokeStyle = rgba(c.deep, .45); g.lineWidth = .9; g.beginPath(); g.moveTo(-L / 2, -w / 2); g.lineTo(L / 2, -w / 2); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(-L / 2, w / 2 - .5); g.lineTo(L / 2, w / 2 - .5); g.stroke(); g.restore(); }
  g.restore(); };
/** Mitten hand with finger nubs pointing in direction `dir`. */
S.hand = (g, x, y, c, dir, fingers = 3, r = 6) => {
  for (let i = 0; i < fingers; i++){ const a = dir + (i - (fingers - 1) / 2) * .5; S.part(g, E(x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .9, r * .42, r * .42), c, { x:x + Math.cos(a) * r * .9, y:y + Math.sin(a) * r * .9, r:r * .42 }, { flat:true, mat:'skin' }); }
  S.part(g, E(x, y, r, r * .9), c, { x, y, r }, { flat:true, mat:'skin' }); };
S.claw = (g, x, y, dir, len = 4, col = '#fff5dc') => { S.dot(g, PL([[x - 1.6 * Math.sin(dir), y + 1.6 * Math.cos(dir)], [x + 1.6 * Math.sin(dir), y - 1.6 * Math.cos(dir)], [x + Math.cos(dir) * len, y + Math.sin(dir) * len]]), col); g.strokeStyle = 'rgba(60,30,40,.6)'; g.lineWidth = .6; g.stroke(); };
