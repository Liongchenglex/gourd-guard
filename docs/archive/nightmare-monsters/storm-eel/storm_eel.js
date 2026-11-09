// ---------- The Storm Eel (Nightmare Drowned Marsh), design archive ----------
// Owner: "leaps from puddle to puddle and shoots electric bolt like puddle diver. or if its in the tide, anywhere in the tide/water."
// A long dark-teal eel that lives in the water and never walks. It rises out of a puddle (or anywhere in the tide on sea levels),
// sways, crackles up, spits a lightning bolt down its lane at the wall, dives, and leaps in an arc to another puddle.
// Look: glowing yellow-white lightning stripes along a slick teal body with a pale belly, a frilled fin crest behind the head whose
// spine tips spark, big angry glowing eyes with slit pupils, a toothy underbite with fangs over the upper lip, a lightning blaze on
// the brow; nightmare touches: a broken harpoon stuck in its back (with a frayed rope) and a rusty fish hook through its jaw.
// Seen from the front like every monster: the face looks down the lane at the wall.
//
// eel(g, P)   P.hidden 0..1 (under water, looped)  P.surface 0..1 (once)  P.idle 0..1 (looped)  P.charge 0..1 (once)
//             P.shoot 0..1 (once; the bolt leaves the mouth at t = .3)  P.down 0..1 (once)
//             P.leap 0..1 (once; out of the water, an arc, and back in head first, drawn in place: the engine moves the sprite
//             from one puddle to the next; P.flip mirrors it for leaps to the left)
// bolt(g, P)  the projectile: P.fly 0..1 (looped, a crackling ball with a zig-zag tail streaming up the lane), P.zap 0..1 (once, the
//             impact on the wall).
// Drawing units, waterline at y = 38 like the Puddle Diver (feet line y = 50). Glows are fine (clips are baked); nothing random per
// frame: every scatter comes from rng(seed) with the seed taken from the pose.
// NOT for the game: lives in the owner's design archive.

import { E, PL, S, SM, SO, ell, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';

// ---------- palette (Drowned Marsh teal, storm yellow) ----------
const EEL = pal('#24606e'), EELD = pal('#163e4a'), BELLY = pal('#a6ccb2'), FIN = pal('#3aa2b6'), SPINE = pal('#1c4c58'),
  WOOD = pal('#7c5a3a'), SPLINT = pal('#c8a47a'), ROPE = pal('#b8a070'), IRON = pal('#7a5a4c'), RUSTO = '#b8582a', HOOKC = pal('#8a6a5a'),
  BARN = pal('#d8d0c0'), KELP = pal('#2f6b3a');
const ZAP = { hot:'#fff6b0', glow:'#ffe04a', halo:'#ffbe1a', deep:'#e09a10' };
const MOUTH = '#0c1418', TOOTH = '#f4fbf0';
const WL = 38;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- splines (as in riders.js) ----------
function crSample(pts, n){ const out = [], m = pts.length; for (let i = 0; i < m - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, m - 1)]; for (let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[m - 1]); return out; }
/** A tapered ribbon along a spline: { path, left, right, centre, dirs }. */
function ribbon(pts, wf, n = 6){ const c = crSample(pts, n), L = [], R = [], D = []; for (let i = 0; i < c.length; i++){ const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; D.push([dx, dy]); const w = wf(i / (c.length - 1)); L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); } const poly = [...L, ...R.slice().reverse()]; return { path:SM(poly, .5), left:L, right:R, centre:c, dirs:D }; }

// ---------- water (copied from w5.js so this file stays self-contained) ----------
/** A disc of water with drifting ripple rings; ph 0..1 animates the rings; zap 0..1 tints it with electric light. */
function water(g, x, y, rx, ry, ph = 0, a = .85, zap = 0){
  g.save(); g.globalAlpha *= a;
  const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, 'rgba(130,205,228,.95)'); gr.addColorStop(1, 'rgba(50,130,160,.7)');
  ell(g, x, y, rx, ry); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(25,80,100,.7)'; g.lineWidth = 1.4; g.stroke();
  if (zap > 0){ const zg = g.createRadialGradient(x, y, 0, x, y, rx); zg.addColorStop(0, rgba(ZAP.hot, .7 * zap)); zg.addColorStop(1, rgba(ZAP.glow, 0)); ell(g, x, y, rx, ry); g.fillStyle = zg; g.fill(); }
  g.lineWidth = 1.3; for (let i = 0; i < 2; i++){ const k = (ph + i * .5) % 1; g.strokeStyle = zap > .3 ? rgba(ZAP.hot, (1 - k) * .8) : `rgba(225,248,255,${(1 - k) * .75})`; ell(g, x, y, rx * (.3 + k * .65), ry * (.3 + k * .65)); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, x - rx * .45, y - ry * .3, rx * .16, ry * .18, -.3); g.fill(); ell(g, x + rx * .4, y + ry * .25, rx * .1, ry * .14, -.3); g.fill();
  g.restore();
}
/** Splash droplets flying up from (x, y); t 0..1 is how far along the arc they are. */
function splash(g, x, y, t, seed = 1, n = 10, spread = 34){
  if (t <= 0 || t >= 1) return;
  const R = rng(seed); g.save(); g.globalAlpha *= 1 - t * t;
  for (let i = 0; i < n; i++){ const a = -Math.PI * .92 + R() * Math.PI * .84, sp = spread * (.5 + R()), px = x + Math.cos(a) * sp * t, py = y + Math.sin(a) * sp * t + t * t * 46, r = 1.6 + R() * 2.2;
    S.dot(g, E(px, py, r, r * 1.3), '#bfeeff'); S.dot(g, E(px - r * .3, py - r * .4, r * .35, r * .35), '#fff', .9); }
  g.restore();
}
/** Clip to everything above the waterline while drawing `fn`. */
function aboveWater(g, wl, fn){ g.save(); g.beginPath(); g.rect(-300, -400, 600, 400 + wl); g.clip(); fn(); g.restore(); }
function barnacle(g, x, y, r = 4){ S.part(g, E(x, y, r, r * .8), BARN, { x, y, r }, { flat:true, mat:'stone', noEdge:true }); S.dot(g, E(x, y, r * .35, r * .3), '#3a3028', .9); }

// ---------- electricity ----------
/** Jagged points from (x1, y1) to (x2, y2), amp is the sideways jitter. */
function zig(x1, y1, x2, y2, R, amp, n){ const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, out = [[x1, y1]];
  for (let i = 1; i < n; i++){ const f = i / n, o = (R() - .5) * 2 * amp * Math.sin(f * Math.PI) + (i % 2 ? 1 : -1) * amp * .45; out.push([x1 + dx * f + nx * o, y1 + dy * f + ny * o]); }
  out.push([x2, y2]); return out; }
/** A glowing electric line: amber halo, yellow-white body, white core. */
function arc(g, pts, w = 2, a = 1){
  if (a <= 0) return;
  const path = () => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
  g.save(); g.globalAlpha *= Math.min(1, a); g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = ZAP.glow; g.shadowBlur = 4 + w * 2; path(); g.strokeStyle = rgba(ZAP.halo, .6); g.lineWidth = w * 2.4; g.stroke();
  g.shadowBlur = 0; path(); g.strokeStyle = ZAP.hot; g.lineWidth = w; g.stroke(); path(); g.strokeStyle = '#fff'; g.lineWidth = w * .45; g.stroke();
  g.restore();
}
/** A little spark: three jagged prongs and a white pip. */
function spark(g, x, y, r, R, a = 1){
  for (let k = 0; k < 3; k++){ const an = R() * TAU, l = r * (.6 + R() * .6); arc(g, zig(x, y, x + Math.cos(an) * l, y + Math.sin(an) * l, R, l * .22, 3), 1, a); }
  g.save(); g.globalAlpha *= a; g.shadowColor = ZAP.glow; g.shadowBlur = 6; S.dot(g, E(x, y, r * .28, r * .28), '#fff'); g.restore();
}
/** A ball of lightning: glow, yellow-white core, crackling prongs. */
function zapBall(g, x, y, r, R, a = 1){
  g.save(); g.globalAlpha *= a;
  let gr = g.createRadialGradient(x, y, 0, x, y, r * 2.2); gr.addColorStop(0, rgba(ZAP.glow, .7)); gr.addColorStop(1, rgba(ZAP.halo, 0)); g.fillStyle = gr; g.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  g.shadowColor = ZAP.glow; g.shadowBlur = r; gr = g.createRadialGradient(x - r * .2, y - r * .2, 0, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.55, ZAP.hot); gr.addColorStop(1, ZAP.glow); ell(g, x, y, r, r); g.fillStyle = gr; g.fill();
  g.restore();
  for (let k = 0; k < 4; k++){ const an = k / 4 * TAU + R() * 1.2, l = r * (1.2 + R() * .8); arc(g, zig(x + Math.cos(an) * r * .5, y + Math.sin(an) * r * .5, x + Math.cos(an) * l, y + Math.sin(an) * l, R, r * .25, 3), Math.max(.8, r * .14), a); }
}

// ---------- the eel ----------
/** Angry glowing eye: yellow-white glow, slit pupil looking down at the wall, a lid slanting down to the middle and a heavy brow. */
function stormEye(g, x, y, rx, ry, s, glow){
  g.save(); g.shadowColor = ZAP.glow; g.shadowBlur = 6 + glow * 6; ell(g, x, y, rx, ry); g.fillStyle = ZAP.glow; g.fill(); g.restore();
  const gr = g.createRadialGradient(x - rx * .15, y + ry * .1, 0, x, y, rx * 1.05); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.5, ZAP.hot); gr.addColorStop(1, '#f2b418'); ell(g, x, y, rx, ry); g.fillStyle = gr; g.fill();
  const px = x - s * rx * .14, py = y + ry * .16; S.dot(g, E(px, py, rx * .2, ry * .6), '#1a1206'); S.dot(g, E(px - rx * .1, py - ry * .26, rx * .1, ry * .13), '#fff', .9);
  g.save(); ell(g, x, y, rx, ry); g.clip(); g.translate(x, y); g.rotate(-s * .5); g.fillStyle = EELD.base; g.fillRect(-rx - 6, -ry - 8, rx * 2 + 12, ry * .62 + 8); g.restore();
  g.save(); g.translate(x, y); g.rotate(-s * .5); S.tube(g, SO([[-rx - 3, -ry * .38 - 1], [0, -ry * .5 - 1.5], [rx + 3, -ry * .38 - 1]]), EELD, 4.2); g.restore();
  ell(g, x, y, rx, ry); g.strokeStyle = rgba(ZAP.deep, .7); g.lineWidth = 1; g.stroke();
}
/** The frilled fin crest fanned out behind the head (head-local, centred on (0, cy)); c 0..1 raises it; tips spark with glow. */
function crest(g, cy, c, glow, R){
  const n = 7, spread = 1.28, Ls = [32, 37, 41, 43, 41, 37, 32], k = .84 + c * .22, tips = [], bases = [];
  for (let i = 0; i < n; i++){ const a = -Math.PI / 2 + (i / (n - 1) * 2 - 1) * spread, L = Ls[i] * k; tips.push([Math.cos(a) * L, cy + Math.sin(a) * L]); bases.push([Math.cos(a) * 10, cy + Math.sin(a) * 10]); }
  const pts = [bases[0]]; for (let i = 0; i < n; i++){ pts.push(tips[i]); if (i < n - 1){ const a = -Math.PI / 2 + ((i + .5) / (n - 1) * 2 - 1) * spread, L = (Ls[i] + Ls[i + 1]) / 2 * k * .74; pts.push([Math.cos(a) * L, cy + Math.sin(a) * L]); } } pts.push(bases[n - 1]);
  const mem = SM(pts, .45);
  g.save(); g.globalAlpha *= .94; S.part(g, mem, FIN, { x:0, y:cy - 22, r:38 }, { flat:true, mat:'gel', lw:1.3 }); g.restore();
  g.save(); mem(g); g.clip(); const gr = g.createRadialGradient(0, cy, 14, 0, cy, 46); gr.addColorStop(0, rgba(ZAP.glow, 0)); gr.addColorStop(1, rgba(ZAP.glow, .18 + glow * .18)); g.fillStyle = gr; g.fillRect(-60, cy - 60, 120, 70); g.restore();
  for (let i = 0; i < n; i++) S.tube(g, SO([bases[i], [(bases[i][0] + tips[i][0]) / 2, (bases[i][1] + tips[i][1]) / 2 - 1], tips[i]]), SPINE, 2.4);
  for (let i = 0; i < n; i++){ g.save(); g.shadowColor = ZAP.glow; g.shadowBlur = 5 + glow * 4; S.dot(g, E(tips[i][0], tips[i][1], 2 + glow * .5, 2 + glow * .5), ZAP.hot); g.restore(); S.dot(g, E(tips[i][0] - .5, tips[i][1] - .6, .8, .8), '#fff'); }
  // crackle jumping between neighbouring tips
  const m = glow > 1.2 ? n - 1 : glow > .5 ? 2 : 1;
  for (let j = 0; j < m; j++){ const i = glow > 1.2 ? j : Math.floor(R() * (n - 1)); arc(g, zig(tips[i][0], tips[i][1], tips[i + 1][0], tips[i + 1][1], R, 3.2, 4), 1, .55 + glow * .3); }
  return tips;
}
/** A side fin at the neck, fanned out sideways (s = -1 left, 1 right) from (x, y). */
function sideFin(g, x, y, s, flap){
  g.save(); g.translate(x, y); g.scale(s, 1); g.rotate(flap * .25);
  const f = SM([[0, -4], [12, -11], [22, -9], [25, -2], [21, 5], [9, 6]], .6); S.part(g, f, FIN, { x:12, y:-2, r:13 }, { flat:true, mat:'gel', lw:1.1 });
  for (const [ex, ey] of [[22, -9], [25, -2], [21, 5]]) S.ln(g, [[2, -1], [ex - 2, ey]], SPINE, 1.2, .7);
  g.restore();
}
/** The broken harpoon: a snapped shaft stuck in the eel's back, angled up and out, with a rusted collar and a frayed rope. */
function harpoon(g, x, y, ang, len){
  const cx = Math.cos(ang), cy = Math.sin(ang), ex = x + cx * len, ey = y + cy * len;
  S.tube(g, SO([[x, y], [ex, ey]]), WOOD, 4.4);
  // splintered break
  const nx = -cy, ny = cx; S.part(g, PL([[ex + nx * 2.6, ey + ny * 2.6], [ex + cx * 6 + nx * 1.4, ey + cy * 6 + ny * 1.4], [ex + cx * 3, ey + cy * 3], [ex + cx * 7.5 - nx * .6, ey + cy * 7.5 - ny * .6], [ex + cx * 2 - nx * 1.6, ey + cy * 2 - ny * 1.6], [ex - nx * 2.6, ey - ny * 2.6]]), SPLINT, { x:ex, y:ey, r:5 }, { flat:true, mat:'wood', lw:.9 });
  // rusted iron collar where the head was, and rope lashing
  const kx = x + cx * len * .32, ky = y + cy * len * .32; g.save(); g.translate(kx, ky); g.rotate(ang); S.part(g, PL([[-4, -3.6], [4, -3.6], [4, 3.6], [-4, 3.6]]), IRON, { x:0, y:0, r:5 }, { flat:true, mat:'metal', lw:1 }); S.dot(g, E(1, -1, 1.6, 1.2), RUSTO, .8); S.dot(g, E(-2, 1.6, 1.2, .9), RUSTO, .7); g.restore();
  const rx = x + cx * len * .58, ry = y + cy * len * .58; for (const d of [-1.6, 1.6]) S.ln(g, [[rx + cx * d + nx * 2.8, ry + cy * d + ny * 2.8], [rx + cx * d - nx * 2.8, ry + cy * d - ny * 2.8]], ROPE, 1.4, .9);
  S.tube(g, SO([[rx, ry + 2], [rx - 2, ry + 9], [rx + 1, ry + 15]]), ROPE, 1.8); S.thread(g, rx + 1, ry + 15, 1, ROPE);
}
/** The whole eel. Neck at (off(0), -2), spine running down `len` units to the tail. o: off(u) sideways offset along the body
 *  (u 0 neck .. 1 tail), jaw 0..1, glow 0..2, crest 0..1, ball 0..1 (lightning in the mouth), tilt (head), tail (draw the tail fin), seed. */
function eelFigure(g, o){
  const len = o.len ?? 112, off = o.off ?? (() => 0), jaw = o.jaw ?? .12, glow = o.glow ?? .8, R = rng(o.seed ?? 1);
  const spine = []; for (let i = 0; i <= 5; i++){ const u = i / 5; spine.push([off(u), -2 + u * len]); }
  const rb = ribbon(spine, u => u < .12 ? 13 + u * 25 : Math.max(4.5, 16 - Math.max(0, u - .5) * (o.tail ? 22 : 8)), 6), C = rb.centre, N = C.length;
  const hx = spine[0][0], d0 = rb.dirs[0], tilt = (o.tilt ?? 0) + Math.atan2(-d0[0], d0[1]) * .6;
  // behind the body: the harpoon, the side fins, the tail fin
  { const i = Math.round(N * .14), [bx, by] = C[i]; harpoon(g, bx - 4, by, -Math.PI + .42, 42); }
  { const i = Math.round(N * .1); sideFin(g, rb.left[i][0] + 3, rb.left[i][1], -1, Math.sin((o.ph ?? 0)) ); sideFin(g, rb.right[i][0] - 3, rb.right[i][1], 1, Math.sin((o.ph ?? 0) + 1)); }
  if (o.tail){ const [tx, ty] = C[N - 1], [dx, dy] = rb.dirs[N - 1], nx = -dy, ny = dx;
    const fin = SM([[tx - nx * 3, ty - ny * 3], [tx + dx * 6 - nx * 13, ty + dy * 6 - ny * 13], [tx + dx * 16, ty + dy * 16], [tx + dx * 6 + nx * 13, ty + dy * 6 + ny * 13], [tx + nx * 3, ty + ny * 3]], .6);
    S.part(g, fin, FIN, { x:tx + dx * 8, y:ty + dy * 8, r:12 }, { flat:true, mat:'gel', lw:1.1 }); arc(g, zig(tx, ty, tx + dx * 15, ty + dy * 15, R, 2, 3), .8, .6 * glow); }
  // body: slick teal with a pale belly down the front and glowing lightning chevrons
  const mid = C[Math.round(N * .3)];
  S.part(g, rb.path, EEL, { x:mid[0] - 4, y:mid[1] - 6, r:30 }, { mat:'skin', hx:mid[0] - 9, hy:mid[1] - 20 });
  const belly = ribbon(spine, u => (u < .12 ? 13 + u * 25 : Math.max(4.5, 16 - Math.max(0, u - .5) * (o.tail ? 22 : 8))) * .42, 6);
  S.part(g, belly.path, BELLY, { x:mid[0], y:mid[1], r:20 }, { flat:true, noEdge:true, mat:'skin' });
  g.save(); rb.path(g); g.clip();
  let acc = 0, next = 12; for (let i = 1; i < N - 1; i++){ acc += Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]); if (acc < next) continue; next += 17; const L = rb.left[i], Rr = rb.right[i], [dx, dy] = rb.dirs[i], pts = [];
    for (let k = 0; k <= 4; k++){ const f = k / 4, sh = (k % 2 ? 1 : -1) * 3.4 + (k === 0 || k === 4 ? -2 : 0); pts.push([L[0] + (Rr[0] - L[0]) * f + dx * sh, L[1] + (Rr[1] - L[1]) * f + dy * sh]); }
    arc(g, pts, 2, .55 + glow * .3); }
  g.restore();
  S.overlay(g, rb.path, EEL, { x:mid[0] - 4, y:mid[1] - 6, r:30 }, .35);
  // a couple of barnacles and a weed strand low on the body
  { const i = Math.round(N * .3); barnacle(g, rb.right[i][0] - 4, rb.right[i][1] - 2, 3.2); barnacle(g, rb.right[i + 1][0] - 7, rb.right[i + 1][1] + 2, 2.4); }
  // charged arcs running down the body's edges
  if (glow > 1.05){ const a = (glow - 1.05) * 1.4; for (const side of [rb.left, rb.right]){ const i0 = 2 + Math.floor(R() * 4); arc(g, zig(side[i0][0], side[i0][1], side[i0 + 6][0], side[i0 + 6][1], R, 3, 5), 1.1, a); } }

  // head
  g.save(); g.translate(hx, -2); g.rotate(tilt);
  const tips = crest(g, -24, o.crest ?? 0, glow, R);
  const head = SM([[-22, -4], [-27, -16], [-25, -30], [-16, -42], [0, -46], [16, -42], [25, -30], [27, -16], [22, -4], [10, 0], [-10, 0]]);
  S.part(g, head, EEL, { x:0, y:-24, r:28 }, { mat:'skin', hx:-12, hy:-36 });
  S.contact(g, head, 0, -2, 18, 6, .35);
  // brow blaze: a little lightning bolt between the eyes
  arc(g, [[-3, -44], [2, -40], [-2, -38.5], [3, -33]], 1.6, .8 + glow * .2);
  // gill slits
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) S.ln(g, [[s * (19 + k * 2.4), -19 + k * 1.2], [s * (21 + k * 2.4), -10 + k * 1.2]], EELD, 1.3, .55);
  stormEye(g, -12, -28, 9.5, 9, -1, glow); stormEye(g, 12, -28, 9.5, 9, 1, glow);
  for (const s of [-1, 1]) S.dot(g, E(s * 4, -16, 1.4, 1), EELD.deep, .8);   // nostrils
  // mouth: the upper lip; it gapes as the jaw drops, lit from inside by the charge
  const J = jaw * 11, ball = o.ball ?? 0;
  if (J > .6){ const m = SM([[-19, -9], [-10, -10.5], [0, -11], [10, -10.5], [19, -9], [16, -7 + J * .9], [0, -6 + J], [-16, -7 + J * .9]], .7); S.dot(g, m, MOUTH);
    if (ball > 0){ g.save(); m(g); g.clip(); const gr = g.createRadialGradient(0, -6 + J * .5, 0, 0, -6 + J * .5, 22); gr.addColorStop(0, rgba(ZAP.hot, .9 * ball)); gr.addColorStop(1, rgba(ZAP.glow, 0)); g.fillStyle = gr; g.fillRect(-24, -14, 48, 30); g.restore(); }
    for (let i = 0; i < 6; i++){ const x = -12.5 + i * 5; S.dot(g, PL([[x - 1.2, -10.4], [x + 1.2, -10.4], [x, -7.4]]), TOOTH); } }
  S.stroke(g, SO([[-20, -9], [-10, -10.5], [0, -11], [10, -10.5], [20, -9]]), EELD, 1.5, .8);
  // the underbite: a jutting lower jaw, a pale chin, fangs standing up over the upper lip
  g.save(); g.translate(0, J);
  const jawP = SM([[-24, -10], [-28, -3], [-20, 5], [0, 8], [20, 5], [28, -3], [24, -10], [12, -7.5], [0, -7], [-12, -7.5]], .8);
  S.part(g, jawP, EEL, { x:0, y:-2, r:26 }, { flat:true, mat:'skin', lw:1.4 });
  S.part(g, SM([[-14, -4], [0, -3], [14, -4], [10, 4], [0, 6], [-10, 4]], .8), BELLY, { x:0, y:1, r:14 }, { flat:true, noEdge:true, mat:'skin' });
  for (const [x, L] of [[-19, 7], [-10, 5], [10, 5], [19, 7.5]]){ const b = -8.4 + Math.abs(x) * .03; S.part(g, PL([[x - 2.2, b], [x + 2.2, b], [x + (x < 0 ? .6 : -.6), b - L]]), pal('#eef6e4'), { x, y:b - L / 2, r:L / 2 + 1 }, { flat:true, mat:'bone', lw:.8 }); }
  for (let i = 0; i < 5; i++){ const x = -6 + i * 3; S.dot(g, PL([[x - 1, -7.6], [x + 1, -7.6], [x, -10]]), TOOTH); }
  // rusty fish hook through the jaw corner, a snapped line trailing off
  g.save(); g.lineCap = 'round'; g.strokeStyle = rgba(HOOKC.deep, .9); g.lineWidth = 2.6; g.beginPath(); g.moveTo(24, -14); g.lineTo(24, -4); g.arc(20, -4, 4, 0, Math.PI * .95); g.stroke();
  g.strokeStyle = HOOKC.base; g.lineWidth = 1.5; g.beginPath(); g.moveTo(24, -14); g.lineTo(24, -4); g.arc(20, -4, 4, 0, Math.PI * .95); g.stroke(); g.restore();
  S.dot(g, PL([[16, -4], [15, -8], [18.5, -5.5]]), HOOKC.base); S.dot(g, E(24, -9, 1.2, 1.6), RUSTO, .85); S.dot(g, E(22.5, -1.5, 1, .8), RUSTO, .8);
  S.dot(g, E(24, -15, 1.8, 1.4), IRON.base); g.strokeStyle = 'rgba(220,230,230,.55)'; g.lineWidth = .7; g.beginPath(); g.moveTo(24, -15.5); g.quadraticCurveTo(32, -22, 30, -34); g.stroke();
  g.restore();
  // wet sheen on the head
  g.save(); head(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.3)'; ell(g, -10, -38, 9, 2.6, -.4); g.fill(); g.restore();
  // lightning in the mouth
  if (ball > 0) zapBall(g, 0, -6 + J * .55, 3 + ball * 6, R, clamp(ball * 1.5));
  g.restore();
  // stray sparks around the crest and body
  const ns = glow > 1.2 ? 4 : glow > .7 ? 2 : 1;
  for (let k = 0; k < ns; k++){ const t = tips[Math.floor(R() * tips.length)], sx = hx + t[0] * 1.08 + (R() - .5) * 6, sy = -2 + t[1] * 1.05; spark(g, sx, sy, 4 + R() * 3, R, .6 + Math.min(.4, glow * .25)); }
}

// ---------- poses ----------
/** Side-to-side sway along the body for a phase ph (radians) and amount a. */
const swayOf = (ph, a = 1) => u => (Math.sin(ph + u * 3.2) * 8 - Math.sin(ph) * 3) * a * (1 - u * .35);
const LIFT = 18;   // surfaced, the neck stands this far above the Diver's so a good length of body shows
function eel(g, P = {}){
  if (P.hidden != null){ const t = P.hidden, R = rng(1 + Math.floor(t * 4) * 13);
    // under water: a glow of the stripes below the surface, bubbles and a spark breaking the surface now and then
    water(g, 0, WL + 3, 42, 10, t, .78);
    g.save(); const gr = g.createRadialGradient(0, WL + 4, 0, 0, WL + 4, 30); gr.addColorStop(0, rgba(ZAP.glow, .35 + Math.sin(t * TAU) * .12)); gr.addColorStop(1, rgba(ZAP.glow, 0)); ell(g, 0, WL + 3, 40, 9); g.fillStyle = gr; g.fill(); g.restore();
    arc(g, zig(-14, WL + 5, 12, WL + 2, R, 2.5, 4), .9, .45);
    for (const [x, y, r] of [[-10, WL - 1, 2.5], [8, WL - 4 - t * 4, 1.8], [16, WL + 1, 1.4]]) S.dot(g, E(x, y, r, r), '#e8f8ff', .7);
    if (Math.floor(t * 4) % 2 === 0) spark(g, 6 + R() * 10, WL - 3, 4, R, .7);
    return;
  }
  if (P.surface != null || P.down != null){
    const t = P.surface != null ? P.surface : 1 - P.down, sink = (1 - ease(t)) * 132;
    aboveWater(g, WL, () => { g.translate(0, sink - LIFT); eelFigure(g, { len:130, off:swayOf(0, .5), glow:.7, crest:.2 + t * .3, seed:3 }); });
    water(g, 0, WL + 3, 42, 10, t * .9, .8);
    if (P.surface != null){ splash(g, 0, WL, Math.min(1, t * 1.3), 4, 12, 44); splash(g, 0, WL, Math.max(0, t * 1.5 - .5), 8, 8, 30); }
    else splash(g, 0, WL, Math.max(0, P.down * 1.2 - .1), 6, 8, 26);
    return;
  }
  if (P.idle != null){ const ph = P.idle * TAU;
    aboveWater(g, WL, () => { g.translate(0, Math.sin(ph * 2) * 1.2 - LIFT); eelFigure(g, { len:130, off:swayOf(ph), tilt:Math.sin(ph) * .05, jaw:.12 + Math.max(0, Math.sin(ph)) * .1, glow:.75 + Math.sin(ph * 2) * .2, crest:.4 + Math.sin(ph) * .1, ph, seed:5 + Math.floor(P.idle * 6) }); });
    water(g, 0, WL + 3, 42, 10, P.idle, .8);
    return;
  }
  if (P.charge != null){ const k = ease(P.charge), ph = P.charge * TAU * .5;
    aboveWater(g, WL, () => { g.translate(0, -5 * k - LIFT); g.scale(1 - .05 * k, 1 - .05 * k); eelFigure(g, { len:130, off:u => swayOf(ph, 1 - k * .6)(u) - k * 3 * (1 - u), tilt:-k * .06, jaw:.12 + k * .4, glow:.8 + k * 1.2, crest:.4 + k * .6, ball:k * .75, ph, seed:11 + Math.floor(P.charge * 5) }); });
    water(g, 0, WL + 3, 42, 10, P.charge * .9, .8, k * .6);
    return;
  }
  if (P.shoot != null){ const t = P.shoot, REL = .3, lunge = t < REL ? ease(t / REL) : 1 - ease((t - REL) / (1 - REL)), drain = clamp((t - REL) / .5);
    aboveWater(g, WL, () => { g.translate(0, lunge * 7 - LIFT); g.scale(1 + lunge * .07, 1 + lunge * .07); eelFigure(g, { len:130, off:u => -2 * (1 - u) * lunge, tilt:0, jaw:t < REL ? .5 + lunge * .5 : 1 - drain * .85, glow:2 - drain * 1.3, crest:1 - drain * .6, ball:t < REL ? .75 + lunge * .25 : 0, seed:17 + Math.floor(t * 7) }); });
    water(g, 0, WL + 3, 42, 10, t * .9, .8, (1 - drain) * .7);
    // the bolt leaving the mouth down the lane (toward the wall); the engine takes over with the bolt sprite
    if (t >= REL){ const u = (t - REL) / (1 - REL), R = rng(23 + Math.floor(t * 8)), my = 1 - LIFT + 6, by = lerp(my + 4, 42, ease(clamp(u * 1.4))), a = 1 - clamp((u - .55) / .45);
      if (u < .35){ g.save(); g.globalAlpha *= 1 - u / .35; const gr = g.createRadialGradient(0, my, 0, 0, my, 34); gr.addColorStop(0, 'rgba(255,255,240,.95)'); gr.addColorStop(.4, rgba(ZAP.glow, .5)); gr.addColorStop(1, rgba(ZAP.glow, 0)); g.fillStyle = gr; g.fillRect(-34, my - 34, 68, 68); g.restore(); }
      arc(g, zig(0, my, 0, by, R, 5, 6), 2.4, a); zapBall(g, 0, by, 8, R, a); }
    return;
  }
  if (P.leap != null){ const t = P.leap, f = P.flip ? -1 : 1, th = lerp(-.3, Math.PI + .3, ease(t)) * f, cy = 92 - 128 * Math.sin(Math.PI * t), ph = t * TAU;
    aboveWater(g, WL, () => { g.translate(0, cy); g.rotate(th); g.translate(0, -12);
      eelFigure(g, { len:54, tail:true, off:u => (Math.sin(ph * 1.5 + u * 5) * 6 * u - u * u * 16 * Math.sin(Math.PI * t)) * f, jaw:.25, glow:1.05, crest:.1, seed:29 + Math.floor(t * 11) }); });
    const a0 = 1 - clamp(t / .3), a1 = clamp((t - .7) / .3);
    if (a0 > 0) water(g, 0, WL + 3, 42, 10, t * 2, .8 * a0);
    if (a1 > 0) water(g, 0, WL + 3, 42, 10, t * 2, .8 * a1);
    splash(g, 0, WL, clamp(t / .35), 31, 12, 44); splash(g, 0, WL, clamp((t - .72) / .28), 37, 12, 40);
    return;
  }
  eel(g, { idle:0 });
}

// ---------- the bolt (projectile) ----------
function bolt(g, P = {}){
  if (P.zap == null){ const t = P.fly ?? 0, R = rng(41 + Math.floor(t * 6) * 7);
    // zig-zag tail streaming up the lane behind the ball (the ball flies down at the wall)
    arc(g, zig(0, 0, (R() - .5) * 8, -54, R, 6, 6), 2.2, .85); arc(g, zig(0, -4, (R() - .5) * 14, -36, R, 5, 4), 1.3, .6);
    zapBall(g, 0, 0, 10 + Math.sin(t * TAU) * 1.2, R, 1);
    return;
  }
  const t = P.zap, R = rng(53 + Math.floor(t * 7) * 5), fl = 1 - clamp(t / .4), sp = ease(clamp(t / .7)), fade = 1 - clamp((t - .55) / .45);
  // scorch on the wall
  g.save(); g.globalAlpha *= .55 * clamp(t * 3) * (1 - .5 * clamp((t - .6) / .4)); S.dot(g, SM([[-18, 6], [-10, -4], [0, -2], [12, -6], [20, 4], [12, 12], [-4, 14], [-16, 12]], .7), '#1c1a14'); g.restore();
  // flash
  if (fl > 0){ g.save(); g.globalAlpha *= fl; const gr = g.createRadialGradient(0, 0, 0, 0, 0, 40); gr.addColorStop(0, 'rgba(255,255,245,1)'); gr.addColorStop(.35, rgba(ZAP.glow, .7)); gr.addColorStop(1, rgba(ZAP.glow, 0)); g.fillStyle = gr; g.fillRect(-40, -40, 80, 80); g.restore(); }
  // forks spraying out over the wall
  for (let k = 0; k < 6; k++){ const an = -Math.PI + (k + .5) / 6 * Math.PI * 1.3 - .15 + (R() - .5) * .3, L = 12 + sp * 26 * (.7 + R() * .5); arc(g, zig(0, 0, Math.cos(an) * L, Math.sin(an) * L * .8, R, 4, 4), 1.6 * (1 - sp * .4), fade); }
  if (t < .5) zapBall(g, 0, 0, 9 * (1 - t * 1.6), R, 1);
  // sparks falling off
  for (let k = 0; k < 6; k++){ const an = -Math.PI * .9 + R() * Math.PI * .8, d = 10 + sp * 22 * (.6 + R() * .6), x = Math.cos(an) * d, y = Math.sin(an) * d + sp * sp * 22; g.save(); g.globalAlpha *= fade; g.shadowColor = ZAP.glow; g.shadowBlur = 5; S.dot(g, E(x, y, 1.6, 1.6), ZAP.hot); g.restore(); }
}

// ---------- clips (registry-style) ----------
// box: the frame in drawing units holding every pose. scale/dy as the Puddle Diver (waterline at y 38, scale .6, dy -11).
export const CLIPS = {
  eel: { name:'Storm Eel', draw:eel, scale:.6, dy:-11, box:{ x:-88, y:-108, w:176, h:174 },
    clips:{
      hidden:{ n:4, fps:6, pose:t => ({ hidden:t }) },
      surface:{ n:6, fps:14, once:true, pose:t => ({ surface:t }) },
      idle:{ n:6, fps:8, pose:t => ({ idle:t }) },
      charge:{ n:6, fps:12, once:true, pose:t => ({ charge:t }) },
      shoot:{ n:8, fps:14, once:true, pose:t => ({ shoot:t }) },
      down:{ n:4, fps:12, once:true, pose:t => ({ down:t }) },
      leap:{ n:12, fps:14, once:true, pose:t => ({ leap:t }) },
    }, still:{ idle:0 } },
  bolt: { name:'Storm bolt (projectile)', draw:bolt, scale:.6, box:{ x:-50, y:-62, w:100, h:112 },
    clips:{ fly:{ n:6, fps:14, pose:t => ({ fly:t }) }, zap:{ n:7, fps:16, once:true, pose:t => ({ zap:t }) } } },
};
