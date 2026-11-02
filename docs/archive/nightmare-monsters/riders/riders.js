// ---------- Imp riders, design archive ----------
// Two new versions of the ridden monsters (owner: "Wisp Rider 2: it rides a long wisp that shoots down the lane with the imp";
// "Turtle Rider: an imp riding on a turtle monster"):
//   comet  — Wisp Rider 2 (the Comet Rider): the red imp astride a long serpent of ghostfire. A comet head with eyes and fangs
//            leads, the body streams up the lane behind it in an S. It cruises, then stretches out and streaks down the lane.
//   turtle — the Turtle Rider: the red imp perched on the back of a big Shell Turtle (the w5 look: domed shell with raised scutes,
//            barnacles, moss) walking head first, steered with reins and a goad. When hit the turtle can pull into its shell.
// The imp is the world 1 imp (red skin, peach belly, cream horns, pointed ears, fangs) promoted to a rider: brass flying goggles,
// little bat wings and a scarf. Seen from the front like every monster: the mount's head leads at the bottom (toward the wall),
// what trails behind goes up the lane.
// Drawn around (0,0) in drawing units with the ground at y = 50. Glows are fine (clips are baked); nothing random per frame.
// NOT for the game: lives in the owner's design archive.

import { E, PL, S, SM, SO, ell, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';

// ---------- palettes (imp from w1.js, wisp from w2.js, turtle from w5.js) ----------
const IMP = pal('#ec5a3c'), IMPB = pal('#ffb98a'), HORN = pal('#f4dfa0'), WINGM = pal('#b8344a'),
  BRASS = pal('#c99a3a'), STRAP = pal('#4a3320'), SCARF = pal('#7a4ad0'), WOOD = pal('#b48a58'), IRON = pal('#9aa0ae'), LEATH = pal('#6b4a2e'),
  WISP = pal('#a9dcf0'), WISPCORE = pal('#f6fdff'), WISPD = pal('#6aa8c8'),
  SHELLD = pal('#2f5e48'), SHELLR = pal('#7fb08a'), TSKIN = pal('#6a9a62'), TSKIND = pal('#4c7644'), KEEL = pal('#8cbf96'), SCUTE = pal('#3d7a5a'),
  MOSS = pal('#5c9a3a'), BARN = pal('#d8d0c0'), TCLAW = '#e8e8d8', SADDLE = pal('#8a2f3a');
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t * t * (3 - 2 * t);

// ---------- shared helpers ----------
function puff(g, x, y, r, a = .7, col = '#e6f4fb'){
  const gr = g.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r); gr.addColorStop(0, rgba('#ffffff', a)); gr.addColorStop(.55, rgba(col, a * .75)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; ell(g, x, y, r, r * .9); g.fill();
}
function crSample(pts, n){ const out = [], m = pts.length; for (let i = 0; i < m - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, m - 1)]; for (let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[m - 1]); return out; }
/** A tapered ribbon along a spline: { path, left, right, centre, dirs }. */
function ribbon(pts, wf, n = 6){ const c = crSample(pts, n), L = [], R = [], D = []; for (let i = 0; i < c.length; i++){ const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; D.push([dx, dy]); const w = wf(i / (c.length - 1)); L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); } const poly = [...L, ...R.slice().reverse()]; return { path:SM(poly, .5), left:L, right:R, centre:c, dirs:D }; }
function barnacle(g, x, y, r = 4){ S.part(g, E(x, y, r, r * .8), BARN, { x, y, r }, { flat:true, mat:'stone', noEdge:true }); S.dot(g, E(x, y, r * .35, r * .3), '#3a3028', .9); }
function wet(g, clip, b){ g.save(); clip(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, b.x - b.r * .3, b.y - b.r * .2, b.r * .32, b.r * .1, -.5); g.fill(); ell(g, b.x + b.r * .25, b.y + b.r * .3, b.r * .18, b.r * .06, -.4); g.fill(); g.restore(); }

// ---------- the imp rider (imp-local units: seat near y 28, horn tips near y -60, as the w1 imp) ----------
/** Body, head and face. o: jaw 0..1, gog 0 (goggles up on the brow) .. 1 (pulled down over the eyes), wind 0..1 (blown back:
 *  ears and scarf stream up the lane), flap (wing beat, -1..1), lean (radians), grin (open laugh). Arms are drawn after the mount. */
function impBody(g, o = {}){
  const jaw = o.jaw ?? 0, gog = o.gog ?? 0, wind = o.wind ?? 0, flap = o.flap ?? 0, ph = o.ph ?? 0;
  // scarf tails behind everything: flutter to the side, stream straight up the lane in the wind
  for (const s of [-1, 1]){ const L = 26 + wind * 26, sw = Math.sin(ph + s) * (6 - wind * 3);
    const pts = [[s * 4, 6], [s * (12 - wind * 6) + sw * .4, 2 - L * .35], [s * (16 - wind * 10) + sw, 4 - L * .7], [s * (14 - wind * 12) + sw * 1.3, 6 - L]];
    const rb = ribbon(pts, u => 5.2 - u * 2, 4); S.part(g, rb.path, SCARF, { x:s * 10, y:4 - L * .5, r:L * .6 }, { flat:true, mat:'cloth', lw:1.2 });
    const tip = pts[3]; S.thread(g, tip[0], tip[1] - 2, s, SCARF); }
  // little bat wings behind the shoulders
  for (const s of [-1, 1]){ const a = -.2 - flap * .35 - wind * .25; g.save(); g.translate(s * 14, 2); g.scale(s, 1); g.rotate(a);
    const wing = SM([[0, 0], [12, -14], [26, -20, 1], [24, -10], [30, -4, 1], [20, -2], [22, 6, 1], [10, 4]], .5);
    S.part(g, wing, WINGM, { x:14, y:-8, r:16 }, { flat:true, mat:'skin', lw:1.3 }); S.ln(g, [[2, 0], [26, -20]], IMP, 1.6, .8); S.ln(g, [[8, -6], [30, -4]], IMP, 1.2, .6); S.ln(g, [[8, -4], [22, 6]], IMP, 1.2, .6); g.restore(); }
  const body = SM([[-17, 2], [-20, 20], [-10, 34], [10, 34], [20, 20], [17, 2], [0, -6]]); S.part(g, body, IMP, { x:0, y:16, r:20 }, { mat:'skin' });
  const belly = SM([[-9, 12], [-11, 24], [0, 31], [11, 24], [9, 12], [0, 9]]); S.part(g, belly, IMPB, { x:0, y:20, r:11 }, { noEdge:true, flat:true }); S.contact(g, belly, 0, 10, 10, 4, .3);
  // scarf knot at the throat
  S.part(g, SM([[-14, 0], [0, 6], [14, 0], [12, 8], [0, 12], [-12, 8]], .7), SCARF, { x:0, y:6, r:13 }, { flat:true, mat:'cloth', lw:1.2 }); S.part(g, E(3, 8, 4.5, 4), SCARF, { x:3, y:8, r:4.5 }, { flat:true, mat:'cloth', lw:1 });
  // ears (blown back by the wind) and horns
  for (const s of [-1, 1]){ g.save(); g.translate(s * 22, -14); g.rotate(-s * wind * .55); g.translate(-s * 22, 14); S.part(g, SM([[s * 22, -14], [s * 40, -28], [s * 44, -16], [s * 34, -2]], .7), IMP, { x:s * 32, y:-16, r:12 }, { flat:true, mat:'skin' }); S.dot(g, SM([[s * 26, -14], [s * 37, -23], [s * 39, -16], [s * 33, -8]], .7), rgba(IMPB.base, .5)); g.restore(); }
  for (const s of [-1, 1]) S.part(g, SM([[s * 10, -28], [s * 14, -46], [s * (8 + wind * 6), -60 + wind * 4], [s * 22, -48], [s * 22, -28]], .8), HORN, { x:s * 15, y:-42, r:14 }, { flat:true, mat:'horn' });
  const head = SM([[-24, -18], [-27, -4], [-18, 10], [0, 14], [18, 10], [27, -4], [24, -18], [12, -32], [-12, -32]]);
  S.part(g, head, IMP, { x:0, y:-10, r:27 }, { mat:'skin' }); S.contact(g, body, 0, 4, 14, 5, .5);
  // goggle strap round the head, then the eyes, then the lenses either on the brow or over the eyes
  const gy = -26 + gog * 14, lr = 7 + gog * 2.6;
  S.tube(g, SO([[-26, gy + 3], [0, gy - 1], [26, gy + 3]]), STRAP, 3.4);
  S.eye(g, -10, -12, 8.5, 9.5, { lx:.15, ly:.2, iris:'#c04a2a' }); S.eye(g, 10, -12, 8.5, 9.5, { lx:.15, ly:.2, iris:'#c04a2a' });
  // mean brows: this imp is a tougher, older hand
  S.ln(g, [[-18, -23 + gog * 2], [-5, -19 + gog * 2]], IMP, 2.4, .9); S.ln(g, [[18, -23 + gog * 2], [5, -19 + gog * 2]], IMP, 2.4, .9);
  for (const s of [-1, 1]){ const x = s * 10, y = gog ? -12 + (1 - gog) * -14 : gy;
    S.part(g, E(x, y, lr + 2.4, lr + 2), BRASS, { x, y, r:lr + 2.4 }, { flat:true, mat:'metal', lw:1.2 });
    const gl = E(x, y, lr, lr * .92); if (gog > .5){ g.save(); g.globalAlpha *= .5; S.dot(g, gl, '#6fd8e8'); g.restore(); } else S.dot(g, gl, '#3f8a9a');
    g.save(); gl(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, x - lr * .35, y - lr * .4, lr * .45, lr * .2, -.6); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, x + lr * .35, y + lr * .35, lr * .2, lr * .12, -.6); g.fill(); g.restore(); }
  S.ln(g, [[-10 + lr * .6, gog > .5 ? -12 : gy], [10 - lr * .6, gog > .5 ? -12 : gy]], BRASS, 2, .9);
  // fanged grin
  const op = jaw * 5;
  S.dot(g, SM([[-13, 2], [-6, 8 + op * .6], [0, 10 + op], [6, 8 + op * .6], [13, 2], [0, 4]], .9), '#3a1420'); S.dot(g, E(0, 8 + op * .6, 6, 3), '#c8384a', .8);
  S.dot(g, PL([[-10, 3], [-4, 3], [-7, 10]]), '#fff'); S.dot(g, PL([[4, 3], [10, 3], [7, 10]]), '#fff');
  S.blush(g, 0, -2, .8);
}
/** One arm from the shoulder to a hand at (hx, hy), imp-local. */
function impArm(g, s, hx, hy, dir, grip = true){ const sx = s * 18, sy = 14, mx = s * Math.max(30, Math.abs(hx) + 8), my = Math.max(sy + 6, (sy + hy) / 2 + 4); S.tube(g, SO([[sx, sy], [mx, my], [hx, hy]]), IMP, 6); S.hand(g, hx, hy, IMP, dir, 3, grip ? 4.6 : 5); }
/** Legs straddling a mount: hip to a dangling foot at (fx, fy), imp-local. */
function impLeg(g, s, fx, fy){ S.tube(g, SO([[s * 8, 24], [s * 20, 32], [fx, fy]]), IMP, 7); S.part(g, E(fx + s * 2, fy + 2, 7.5, 4.2), IMP, { x:fx, y:fy, r:7.5 }, { flat:true, mat:'skin' }); for (const d of [-3.5, 0, 3.5]) S.claw(g, fx + s * 2 + d, fy + 5, Math.PI / 2, 3.2); }

// ---------- Wisp Rider 2: the Comet Rider ----------
/** The comet head of the long wisp: a round ghostfire head with flame horns (the imp's handholds), coma tongues sweeping back
 *  up the lane, big angry eyes and a fanged mouth. Centre (0,0), about 26 units across each way. */
function cometHead(g, o = {}){
  const jaw = o.jaw ?? 0, fl = o.fl ?? 0, wind = o.wind ?? 0;
  // coma tongues sweeping up and back from the cheeks
  for (const s of [-1, 1]){ const L = 30 + wind * 22; const tg = SM([[s * 18, 10], [s * 27, -4], [s * (32 - wind * 6), -L * .55], [s * (24 - wind * 6) + fl * .4, -L], [s * 20, -L * .55], [s * 12, -10]], .8);
    S.part(g, tg, WISP, { x:s * 22, y:-L * .4, r:L * .55 }, { flat:true, noEdge:true }); S.dot(g, SM([[s * 19, 2], [s * 24, -L * .5], [s * (21 - wind * 5) + fl * .3, -L * .85], [s * 16, -L * .4]], .8), WISPCORE.base, .55); }
  const head = SM([[-25, 4], [-26, -10], [-18, -22], [-6, -26], [6, -26], [18, -22], [26, -10], [25, 4], [16, 18], [0, 24], [-16, 18]], .85);
  g.save(); g.shadowColor = 'rgba(160,225,245,.95)'; g.shadowBlur = 16; S.part(g, head, WISP, { x:0, y:-2, r:28 }, { hx:-10, hy:-14 }); g.restore();
  g.save(); head(g); g.clip(); let gr = g.createRadialGradient(0, 2, 2, 0, 2, 24); gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-30, -30, 60, 60); g.restore();
  // flame horns the imp hangs on to
  for (const s of [-1, 1]){ const hn = SM([[s * 8, -22], [s * 14, -34], [s * (17 - wind * 4), -46 + wind * 4], [s * 20, -32], [s * 18, -20]], .8); S.part(g, hn, WISP, { x:s * 14, y:-32, r:12 }, { flat:true }); S.dot(g, SM([[s * 12, -24], [s * 15, -34], [s * 17, -26]], .8), WISPCORE.base, .8); }
  // face
  S.eye(g, -10, -4, 7.5, 8.5, { lx:.15, ly:.3, pr:.42, iris:'#3ab0c8' }); S.eye(g, 10, -4, 7.5, 8.5, { lx:.15, ly:.3, pr:.42, iris:'#3ab0c8' });
  S.ln(g, [[-17, -15], [-5, -10]], WISPD, 2.4, .85); S.ln(g, [[17, -15], [5, -10]], WISPD, 2.4, .85);
  const op = jaw * 8;
  S.dot(g, SM([[-12, 8], [-6, 13 + op * .6], [0, 15 + op], [6, 13 + op * .6], [12, 8], [0, 10]], .9), '#1c3a48');
  if (jaw > .2) S.dot(g, E(0, 13 + op * .7, 5, 2.4 + op * .2), '#3ab0c8', .5);
  for (const x of [-8, -3]) S.dot(g, PL([[x, 8.6], [x + 3.4, 9.2], [x + 1.6, 14]]), '#fff');
  for (const x of [3, 8]) S.dot(g, PL([[x - 1, 9.2], [x + 2.4, 8.6], [x + .4, 14]]), '#fff');
  S.blush(g, 0, 2, .6);
}
/** The serpent body of ghostfire, from the head (pts[0]) up the lane; flame licks along both edges, a white core. */
function wispTrail(g, pts, wf, ph, o = {}){
  const rb = ribbon(pts, wf, 7), N = rb.centre.length;
  g.save(); g.shadowColor = 'rgba(160,225,245,.95)'; g.shadowBlur = 14; S.part(g, rb.path, WISP, { x:pts[1][0], y:pts[1][1], r:40 }, { flat:true, lw:1.4 }); g.restore();
  g.save(); rb.path(g); g.clip(); const top = pts[pts.length - 1][1]; const gr = g.createLinearGradient(0, pts[0][1], 0, top); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.75)'); g.fillStyle = gr; g.fillRect(-80, top - 10, 160, pts[0][1] - top + 20); g.restore();
  // flame licks along the edges, pointing back up the lane
  for (let i = 3; i < N - 1; i += 4){ const u = i / (N - 1), d = rb.dirs[i]; for (const [side, P] of [[-1, rb.left], [1, rb.right]]){ const p = P[i], len = (22 - u * 12) * (1 + .3 * Math.sin(ph * 2 + i * 1.7 + side)), nx = side * d[1] * -1, ny = side * d[0];
    const tip = [p[0] + d[0] * len * 1.1 + nx * len * .75, p[1] + d[1] * len * 1.1 + ny * len * .75];
    const lk = SM([[p[0] - d[0] * 6 - nx * 3, p[1] - d[1] * 6 - ny * 3], [p[0] + nx * len * .35, p[1] + ny * len * .35], [tip[0], tip[1], 1], [p[0] + d[0] * 6 - nx * 3, p[1] + d[1] * 6 - ny * 3]], .8); S.part(g, lk, WISP, { x:p[0], y:p[1], r:len }, { flat:true, noEdge:true }); S.dot(g, SM([[p[0] + nx * 2, p[1] + ny * 2], [p[0] + nx * len * .4 + d[0] * len * .3, p[1] + ny * len * .4 + d[1] * len * .3], [p[0] + d[0] * 4, p[1] + d[1] * 4]], .8), WISPCORE.base, .7); } }
  const core = ribbon(pts, u => wf(u) * .38, 7); g.save(); g.shadowColor = '#ffffff'; g.shadowBlur = 6; S.dot(g, core.path, WISPCORE.base, o.coreA ?? .85); g.restore();
  // ember sparks along the trail
  const R = rng(o.seed ?? 31); for (let i = 0; i < 6; i++){ const k = Math.floor(R() * (N - 4)) + 3, c = rb.centre[k], w = wf(k / (N - 1)); const x = c[0] + (R() - .5) * w * 3.2, y = c[1] + ((ph / TAU + R()) % 1) * -14; S.dot(g, E(x, y, 1.6, 1.6), '#ffffff', .8); }
  return rb;
}
function comet(g, P = {}){
  const w = P.walk, ch = P.chew, da = P.dash, ph = (w ?? ch ?? da ?? 0) * TAU, dashing = da != null;
  const bob = dashing ? Math.sin(ph * 2) * 1 : w != null ? Math.sin(ph) * 3.5 : Math.sin(ph) * 1.5, fl = Math.sin(ph * 2) * 4;
  const bite = ch == null ? 0 : .5 + .5 * Math.sin(ph), wind = dashing ? 1 : .15;
  S.shadow(g, 0, 52, dashing ? 20 : 24, dashing ? 3.5 : 4.5);
  // 1. the long body: an S-curve up the lane when cruising, pulled almost straight and long in the dash
  let pts;
  if (dashing){ const s1 = Math.sin(ph) * 3, s2 = Math.sin(ph - 1) * 5, s3 = Math.sin(ph - 2) * 7;
    pts = [[0, 20], [-4, -20], [-6 + s1, -64], [-4 + s2, -110], [-2 + s3, -150], [s3 * .8, -176]];
    // speed streaks either side: scroll up the lane (the rider moves down)
    const R = rng(77); for (let i = 0; i < 9; i++){ const x = (R() < .5 ? -1 : 1) * (26 + R() * 24), len = 16 + R() * 26, k = ((da + R()) % 1), y = 40 - k * 190; g.strokeStyle = rgba('#d8f4ff', .55 * (1 - k * .6)); g.lineWidth = 1.4 + R() * 1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - len); g.stroke(); }
    for (let i = 0; i < 5; i++){ const k = (da * 2 + i / 5) % 1; puff(g, Math.sin(i * 2.1) * 10, -30 - k * 150, 7 + k * 8, .45 * (1 - k)); }
  } else { const A = ch != null ? .5 : 1, s1 = Math.sin(ph) * 4 * A, s2 = Math.sin(ph - 1.2) * 7 * A, s3 = Math.sin(ph - 2.4) * 9 * A, s4 = Math.sin(ph - 3.6) * 10 * A;
    pts = [[0, 20 + bob], [-16 + s1, -8], [-34 + s2, -44], [-30 + s3, -82], [-10 + s4, -110], [10 + s4, -122]];
    for (let i = 0; i < 4; i++){ const t = i / 3; puff(g, -24 + Math.sin(ph + i * 1.7) * 6 + 12 * t, -60 - t * 60, 10 - t * 4, .5 - t * .3); }
  }
  wispTrail(g, pts, dashing ? (u => (17 * (1 - u) + 1.5) * (1 + .12 * Math.sin(u * 22 - ph * 2))) : (u => (19 * Math.pow(1 - u, .8) + 1.5) * (1 + .2 * Math.sin(u * 16 - ph * 2))), ph, { seed:dashing ? 41 : 31 });
  // 2. the imp, sitting on the neck just behind the head: low and hugging in the dash, rocking forward to the bite
  const ix = 0, iy = (dashing ? -18 : -26) + bob * .6 + bite * 4, is = .72;
  g.save(); g.translate(ix, iy); g.scale(is, is); g.rotate(dashing ? 0 : ch != null ? -.05 + bite * .1 : Math.sin(ph) * .04);
  impBody(g, { jaw:dashing ? .8 : ch != null ? bite : 0, gog:dashing ? 1 : 0, wind, flap:Math.sin(ph * 2) * (dashing ? .3 : 1), ph });
  g.restore();
  // 3. legs hang over both sides of the head, then the head in front
  g.save(); g.translate(ix, iy); g.scale(is, is);
  for (const s of [-1, 1]) impLeg(g, s, s * (36 + (dashing ? 6 : 0)), 52 - (dashing ? 6 : 0) + (w != null ? Math.sin(ph + s) * 2 : 0));
  g.restore();
  g.save(); g.translate(0, 22 + bob + bite * 4); if (dashing) g.scale(.94, 1.06); else if (ch != null) g.scale(1 + bite * .06, 1 + bite * .06);
  cometHead(g, { jaw:ch != null ? bite : dashing ? .35 : .1, fl, wind:dashing ? 1 : 0 });
  g.restore();
  // 4. the imp's arms over the head: gripping the flame horns; on the bite one fist pumps; in the dash both grip low
  g.save(); g.translate(ix, iy); g.scale(is, is);
  const hy = (22 + bob + bite * 4 - 32 - iy) / is, hxk = 14 / is;
  if (ch != null){ impArm(g, -1, -hxk, hy, Math.PI / 2 + .3); const up = bite; impArm(g, 1, 30 - up * 4, 2 - up * 28, -Math.PI / 2 + .2, true); }
  else for (const s of [-1, 1]) impArm(g, s, s * hxk, hy + (dashing ? 6 : 0), Math.PI / 2 - s * .5);
  g.restore();
}

// ---------- Turtle Rider ----------
function hexPts(x, y, r, ry){ return [[x, y - ry], [x + r, y - ry * .5], [x + r, y + ry * .5], [x, y + ry], [x - r, y + ry * .5], [x - r, y - ry * .5]]; }
function scute(g, x, y, r, ry, c = SCUTE){
  const pts = hexPts(x, y, r, ry), p = PL(pts), inner = hexPts(x, y, r * .74, ry * .74);
  S.part(g, p, c, { x, y, r:r * 1.15 }, { flat:true, mat:'stone', hx:x - r * .3, hy:y - ry * .45, lw:2.4 });
  g.lineWidth = 1.6; g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(inner[4][0], inner[4][1]); g.lineTo(inner[5][0], inner[5][1]); g.lineTo(inner[0][0], inner[0][1]); g.lineTo(inner[1][0], inner[1][1]); g.stroke();
  g.strokeStyle = rgba(c.deep, .55); g.beginPath(); g.moveTo(inner[1][0], inner[1][1]); g.lineTo(inner[2][0], inner[2][1]); g.lineTo(inner[3][0], inner[3][1]); g.lineTo(inner[4][0], inner[4][1]); g.stroke();
}
/** A short horn spike on a scute: the tougher turtle's armour. */
function spike(g, x, y, a, len, w){ const ca = Math.cos(a), sa = Math.sin(a); S.part(g, PL([[x - sa * w, y + ca * w], [x + ca * len, y + sa * len], [x + sa * w, y - ca * w]]), pal('#e4dcc4'), { x:x + ca * len * .4, y:y + sa * len * .4, r:len * .6 }, { flat:true, mat:'horn', lw:1.1 }); }
/** The goad: a wooden pole with an iron point, held at (x, y) pointing along angle a (imp-local). */
function goad(g, x, y, a, len = 62){ const ca = Math.cos(a), sa = Math.sin(a), bx = x - ca * 14, by = y - sa * 14, tx = x + ca * len, ty = y + sa * len;
  S.tube(g, SO([[bx, by], [tx, ty]]), WOOD, 3.6);
  S.part(g, PL([[tx - sa * 3.4, ty + ca * 3.4], [tx + ca * 13, ty + sa * 13], [tx + sa * 3.4, ty - ca * 3.4]]), IRON, { x:tx + ca * 4, y:ty + sa * 4, r:8 }, { flat:true, mat:'metal', lw:1.1 });
  S.part(g, E(tx, ty, 3.6, 3.6), BRASS, { x:tx, y:ty, r:3.6 }, { flat:true, mat:'metal', lw:.9 }); }
function turtleRider(g, P = {}){
  const w = P.walk, ch = P.chew, hd = P.hide, ph = (w ?? ch ?? 0) * TAU, sw = w == null ? 0 : Math.sin(ph), cs = ch == null ? 0 : Math.sin(ch * TAU);
  const k = hd == null ? 0 : ease(clamp(hd)), kHead = ease(clamp(hd == null ? 0 : hd * 1.6)), kImp = ease(clamp(hd == null ? 0 : (hd - .2) / .8));
  const rock = sw * .04 + cs * .025, bob = w != null ? -Math.abs(sw) * 2.2 : cs * 1.5, sink = k * 7, bite = ch == null ? 0 : .5 + .5 * cs;
  S.shadow(g, 0, 50, 60 - k * 6, 8);
  // hind feet peeking out behind the shell (pulled in when it hides)
  for (const s of [-1, 1]){ if (k > .8) break; const p2 = ph + (s < 0 ? 0 : Math.PI), lift = w == null ? 0 : Math.max(0, Math.sin(p2)) * 3; g.save(); g.translate(-s * k * 14, -k * 8);
    S.part(g, E(s * 40, 36 - lift, 9, 5), TSKIND, { x:s * 40, y:36 - lift, r:9 }, { flat:true, mat:'scaly' }); g.restore(); }
  // the shell sways as one body with the imp on its back
  g.save(); g.translate(0, 10 + bob + sink); g.rotate(rock); g.translate(0, -10);
  // 1. the imp: behind the crest of the dome, so the shell hides his lower half; ducks down to peek over it when the turtle hides
  const iy = -60 + kImp * 17 + (w != null ? Math.abs(sw) * 2.2 : 0) + bite * 2, is = .7;
  g.save(); g.translate(0, iy); g.scale(is, is); g.rotate(ch != null ? -.04 + bite * .08 : sw * .05);
  impBody(g, { jaw:ch != null ? bite * .8 : kImp * .3, gog:kImp, wind:0, flap:hd != null ? -.5 * kImp : Math.sin(ph * 2) * .8, ph });
  g.restore();
  // 2. the dome, seen from the front and above: big raised scutes, a keel, horn spikes, a crimson saddle cloth by the crest
  const shell = SM([[-56, 18], [-58, -2], [-50, -24], [-30, -40], [0, -46], [30, -40], [50, -24], [58, -2], [56, 18], [36, 28], [0, 32], [-36, 28]]);
  S.part(g, shell, SHELLD, { x:0, y:-4, r:56 }, { mat:'stone', hx:-24, hy:-28, lw:2.2 });
  g.save(); shell(g); g.clip();
  for (const [x, y, r, ry] of [[-30, -18, 12, 10], [30, -18, 12, 10], [-34, 8, 12, 10], [34, 8, 12, 10], [0, -6, 15, 12.5], [0, 18, 13, 8]]) scute(g, x, y, r, ry);
  const rim = SM([[-62, 14], [-30, 22], [0, 24], [30, 22], [62, 14], [62, 40], [-62, 40]], .8);
  S.part(g, rim, SHELLR, { x:0, y:30, r:58 }, { flat:true, mat:'stone', lw:1.6 });
  for (const x of [-44, -30, -15, 15, 30, 44]) S.ln(g, [[x, 22 - Math.abs(x) * .1], [x * 1.04, 36]], SHELLD, 1.6, .55);
  for (const [x, y, r] of [[-48, 12, 6], [44, -10, 4.5], [-20, -30, 4]]) S.part(g, E(x, y, r, r * .65), MOSS, { x, y, r }, { flat:true, noEdge:true, mat:'moss' });
  g.restore(); S.stroke(g, shell, SHELLD, 2.2, .9);
  // saddle cloth over the crest, under where the imp sits, with brass studs
  const cloth = SM([[-22, -41], [0, -45], [22, -41], [26, -32], [14, -28], [0, -30], [-14, -28], [-26, -32]], .7);
  S.part(g, cloth, SADDLE, { x:0, y:-36, r:24 }, { flat:true, mat:'cloth', lw:1.4 }); for (const x of [-18, -6, 6, 18]) S.rivet(g, x, -33 + Math.abs(x) * .05, 1.6, BRASS);
  S.dot(g, PL([[-24, -31], [-20, -24], [-16, -29]]), SADDLE.dark, .9); S.dot(g, PL([[24, -31], [20, -24], [16, -29]]), SADDLE.dark, .9);
  for (const [x, y, a] of [[-30, -18, -2.1], [30, -18, -1.04], [-34, 8, -2.6], [34, 8, -.54], [0, -6, -Math.PI / 2]]) if (x !== 0) spike(g, x, y - 3, a, 9, 3.4);
  barnacle(g, -50, 20, 4); barnacle(g, 46, 24, 3.5); barnacle(g, 52, 4, 3);
  wet(g, shell, { x:0, y:-4, r:56 });
  // 3. the imp's hands grip the crest when he ducks; otherwise reins in the left, the goad in the right
  g.save(); g.translate(0, iy); g.scale(is, is);
  const toL = (x, y) => [x / is, (y - iy) / is];
  if (hd != null && kImp > .5){ const [ax, ay] = toL(-16, -44), [bx, by] = toL(16, -44); impArm(g, -1, ax, ay, Math.PI / 2 + .3); impArm(g, 1, bx, by, Math.PI / 2 - .3);
    const [gx, gy] = toL(30, -40); goad(g, gx, gy, -Math.PI / 2 - .5, 40); }
  else {
    const jab = ch != null ? bite : 0, [rx, ry] = toL(22 - jab * 2, -46 + jab * 12 + (w != null ? sw * 2 : 0)), [lx, ly] = toL(-18, -38);
    impArm(g, -1, lx, ly, Math.PI / 2 + .6);
    goad(g, rx, ry, Math.PI / 2 - .55 + jab * .25 - kImp * .6, 62 + jab * 14);
    impArm(g, 1, rx, ry, -.2);
    g.restore(); g.save();
    // reins from the left fist over the dome down to the bridle rings (slack as the head comes in)
    const hx = 0, hyb = 38 + bob * .2 + bite * 5 - kHead * 18;
    for (const s of [-1, 1]){ const fx = -18, fy = -38, ex = hx + s * 16, ey = hyb - 2, pp = crSample([[fx, fy], [(fx + ex) / 2 + s * 12, (fy + ey) / 2 + 6 + kHead * 12], [ex, ey]], 6);
      S.ln(g, pp, LEATH, 3.4, .95); g.strokeStyle = rgba(LEATH.light, .5); g.lineWidth = 1; g.beginPath(); pp.forEach((p, i) => i ? g.lineTo(p[0] - .6, p[1] - .8) : g.moveTo(p[0] - .6, p[1] - .8)); g.stroke(); }
  }
  g.restore();
  g.restore();
  // 4. front legs at the sides of the rim (they tuck in under the shell when it hides)
  for (const s of [-1, 1]){ const p = ph + (s < 0 ? Math.PI : 0), lift = w == null ? 0 : Math.max(0, Math.sin(p)) * 6, dx = w == null ? 0 : Math.cos(p) * 3;
    g.save(); g.translate(-s * k * 18, -k * 14 + sink * .5); g.globalAlpha *= 1 - clamp((k - .6) / .4);
    S.tube(g, SO([[s * 44, 22], [s * 52 + dx, 34 - lift]]), TSKIND, 14);
    const fx = s * 54 + dx, fy = 42 - lift; S.part(g, E(fx, fy, 11, 6), TSKIN, { x:fx, y:fy, r:11 }, { flat:true, mat:'scaly' }); for (const d of [-6, 0, 6]) S.claw(g, fx + d, fy + 4, Math.PI / 2, 4, TCLAW);
    g.restore(); }
  // 5. the head, out in front under the rim notch: bridled, heavy-lidded, a hooked beak that gapes on the bite
  if (kHead < .98){
    g.save(); g.translate(0, 10 + bob + sink); g.rotate(rock); g.translate(0, -10);
    const hx = 0, hy = 38 + bob * .2 + bite * 5 - kHead * 18, hs = 1 - kHead * .35;
    // clip to below the rim so the head slides in under the shell
    g.save(); g.beginPath(); g.rect(-80, 26 - kHead * 4, 160, 60); g.clip();
    g.translate(hx, hy); g.scale(hs, hs);
    S.tube(g, SO([[0, -16], [0, -4]]), TSKIND, 18);
    const jaw = bite * 6;
    const head = SM([[-21, -10], [-25, 0], [-20, 11], [-8, 16], [8, 16], [20, 11], [25, 0], [21, -10], [10, -16], [-10, -16]]);
    S.part(g, SM([[-12, 6], [-10, 14 + jaw], [0, 18 + jaw], [10, 14 + jaw], [12, 6]], .8), TSKIND, { x:0, y:12 + jaw, r:12 }, { flat:true, mat:'scaly' });
    S.part(g, head, TSKIN, { x:0, y:0, r:24 }, { mat:'scaly', hx:-9, hy:-8 }); wet(g, head, { x:0, y:0, r:24 });
    if (jaw > 1) S.dot(g, SM([[-10, 9], [0, 11 + jaw], [10, 9], [0, 10]], .8), '#3a1a20');
    S.stroke(g, SO([[-13, 8], [-5, 11], [0, 13], [5, 11], [13, 8]]), TSKIND, 2, .9);   // beak line
    S.dot(g, PL([[-3, 11], [3, 11], [0, 15]]), '#e8e4c8', .95);   // hooked beak tip
    S.dot(g, E(-3, 3, 1.4, 1), TSKIND.deep, .8); S.dot(g, E(3, 3, 1.4, 1), TSKIND.deep, .8);
    for (const s of [-1, 1]) S.eye(g, s * 11, -4, 6.5, 6.5, { lx:-s * .05, ly:.2, pr:.44, lid:.42, tilt:s * -.3, lidCol:TSKIN.base, lidDeep:TSKIN.deep, iris:'#d8a23a' });
    // bridle: a strap over the snout and brass rings for the reins
    S.tube(g, SO([[-22, -2], [-10, 4], [0, 5], [10, 4], [22, -2]]), LEATH, 3); for (const s of [-1, 1]) { S.part(g, E(s * 16, 0, 3.6, 3.6), BRASS, { x:s * 16, y:0, r:3.6 }, { flat:true, mat:'metal', lw:1 }); S.dot(g, E(s * 16, 0, 1.6, 1.6), '#2a2018'); }
    barnacle(g, -14, -12, 3); barnacle(g, 17, -11, 2.4);
    g.restore(); g.restore();
  }
  // in the shell: two wary eyes glinting in the dark front notch
  if (kHead > .7){ g.save(); g.translate(0, 10 + bob + sink); g.rotate(rock); g.translate(0, -10); g.globalAlpha *= clamp((kHead - .7) / .3);
    S.dot(g, SM([[-16, 26], [0, 22], [16, 26], [12, 32], [-12, 32]], .8), '#14201a', .9); for (const s of [-1, 1]) S.glow(g, s * 6, 27, 1.8, '#f0c040'); g.restore(); }
}

// ---------- clips (registry-style) ----------
// box: the frame in drawing units holding every pose. scale: a suggested in-game scale (see the report).
export const CLIPS = {
  comet: { name:'Wisp Rider 2 (Comet Rider)', draw:comet, scale:.5, box:{ x:-70, y:-190, w:120, h:252 },
    clips:{ walk:{ n:8, fps:10, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, dash:{ n:8, fps:16, pose:t => ({ dash:t }) } } },
  turtle: { name:'Turtle Rider', draw:turtleRider, scale:.56, box:{ x:-70, y:-106, w:140, h:178 },
    clips:{ walk:{ n:8, fps:6, pose:t => ({ walk:t }) }, chew:{ n:4, fps:6, pose:t => ({ chew:t }) }, hide:{ n:6, fps:12, once:true, pose:t => ({ hide:t }) } } },
};
