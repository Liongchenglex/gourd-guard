// ---------- Nightmare Foggy Hollow: Wisp Rider 2, the Comet Rider (Release 5) ----------
// Ported from docs/archive/nightmare-monsters/riders/riders.js (the `comet` entry; the Turtle Rider and the thrown rotten pumpkin stay in the archive).
// The red imp astride a long serpent of ghostfire: a comet head with eyes and fangs leads, the body streams up the lane behind it in an S.
// Clips: walk (cruise), chew, dash (stretched out, streaking down the lane). Drawn around (0,0) in drawing units with the ground at y = 50;
// every clip is baked by render/anim.js, so the glows are fine; nothing random per frame (rng(seed) only). Own file so the imp's palette
// (BRASS, IRON ...) does not collide with the spirits' in hollow.js.

import { E, PL, S, SM, SO, ell, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';

const IMP = pal('#ec5a3c'), IMPB = pal('#ffb98a'), HORN = pal('#f4dfa0'), WINGM = pal('#b8344a'),
  BRASS = pal('#c99a3a'), STRAP = pal('#4a3320'), SCARF = pal('#7a4ad0'),
  WISP = pal('#a9dcf0'), WISPCORE = pal('#f6fdff'), WISPD = pal('#6aa8c8');
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


export const COMET = {
  comet: { draw:comet, scale:.5, dy:-8, box:{ x:-70, y:-190, w:120, h:252 },
    clips:{ walk:{ n:8, fps:10, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, dash:{ n:8, fps:16, pose:t => ({ dash:t }) } }, still:{ walk:.25 },
    frame(m, clips){ return m.dashing && !m.eating && m.frozenT <= 0 ? ['dash', Math.floor(m.ph * clips.dash.fps) % clips.dash.n] : null; } },   // the dash is a state, not a one-off animation
};
