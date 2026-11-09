// ---------- The Siren, design archive (Nightmare Drowned Marsh) ----------
// A pale, pretty-but-creepy mermaid sitting on a barnacled, kelp-draped rock in her own little pool near the back of the field.
// Blue-green skin with scales on the shoulders, a teal fish tail coiled over the front of the rock, fin ears, long dripping kelp
// hair with a fish-bone comb and a pearl, a scallop-shell top and a pearl necklace, and big glowing sea-green eyes. When she
// sings her mouth opens far too wide on rows of needle teeth and her eyes burn white.
//   siren(g, P)  P.surface 0..1 (once: rock and siren rise out of the pool), P.idle 0..1 (loop), P.sing 0..1 (loop),
//                P.charm 0..1 (once: winds up, sweeps an arm sideways and sends the strong note), P.hit 0..1 (once),
//                P.dive 0..1 (once: slips off the rock into the pool, then the rock sinks). P.flip mirrors her (charm to the left).
//   note(g, P)   the glowing teal music note the engine sends down her lane: P.drift 0..1 (loop), a wavy trail above it.
//   bend(g, P)   the swirl that sits on a pumpkin being pushed sideways: P.swirl 0..1 (loop), P.flip pushes to the left.
// Drawn around (0,0) in drawing units with the rock's foot / the waterline near y = 44..50. Glows are fine (clips are baked);
// nothing random per frame (rng(seed) only). NOT for the game: lives in the owner's design archive.

import { E, PL, S, SM, SO, ell, mix, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';

// ---------- palettes (Drowned Marsh, w5.js: kelp #2f6b3a, barnacles, drips #9fd8e8, sheen #5fa882) ----------
const SKIN = pal('#c2ddd3'), SKIND = pal('#a2c6bb'), SHEEN = pal('#5fb0a0'),
  TAIL = pal('#2a8a86'), TAILB = pal('#7cc8b4'), FIN = pal('#6fd6c8'), SCL = '#8ff0dc',
  HAIR = pal('#2b5a46'), KELP = pal('#2f6b3a'), DRIP = pal('#9fd8e8'),
  ROCK = pal('#5f6d70'), MOSS = pal('#5c9a3a'), BARN = pal('#d8d0c0'), STAR = pal('#e88a5a'),
  SHELL = pal('#f0c2cc'), PEARL = pal('#eef0fa'), BONE = pal('#ece4cc'),
  EYEG = '#4ef0c4', EYEW = '#e6fff8', NOTEC = '#8ff8e2', NOTEG = '#2ee8c4', THROAT = '#4a1426', NEEDLE = '#f0f8f2';
const WL = 44;   // the pool's waterline
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const lp = (A, B, t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t)];

// ---------- helpers (copied from w5.js / kraken_pirate.js so the file stays self-contained) ----------
function wet(g, clip, b, drips = []){ g.save(); clip(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, b.x - b.r * .3, b.y - b.r * .2, b.r * .32, b.r * .1, -.5); g.fill(); ell(g, b.x + b.r * .25, b.y + b.r * .3, b.r * .18, b.r * .06, -.4); g.fill(); g.restore();
  for (const [x, y, l] of drips){ S.tube(g, SO([[x, y], [x + 1, y + l]]), DRIP, 2); S.dot(g, E(x + 1, y + l + 1.5, 1.7, 2.1), '#c8f0ff', .9); } }
function kelp(g, x, y, n = 3, len = 22, w = 4){ const R = rng(x * 3 + y * 5 + 7 | 0); for (let i = 0; i < n; i++){ const dx = (i - (n - 1) / 2) * 6 + (R() - .5) * 4, L = len * (.7 + R() * .6); S.tube(g, SO([[x + dx, y], [x + dx + (R() - .5) * 8, y + L * .5], [x + dx + (R() - .5) * 10, y + L]]), KELP, w); } }
function barnacle(g, x, y, r = 4){ S.part(g, E(x, y, r, r * .8), BARN, { x, y, r }, { flat:true, mat:'stone', noEdge:true }); S.dot(g, E(x, y, r * .35, r * .3), '#3a3028', .9); }
function starfish(g, x, y, r = 5, rot = 0){ g.save(); g.translate(x, y); g.rotate(rot); S.part(g, g2 => { g2.beginPath(); for (let i = 0; i < 10; i++){ const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r; g2.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g2.closePath(); }, STAR, { x:0, y:0, r }, { flat:true, mat:'skin' }); g.restore(); }
function water(g, x, y, rx, ry, ph = 0, a = .85){
  g.save(); g.globalAlpha *= a;
  const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, 'rgba(130,205,228,.95)'); gr.addColorStop(1, 'rgba(50,130,160,.7)');
  ell(g, x, y, rx, ry); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(25,80,100,.7)'; g.lineWidth = 1.4; g.stroke();
  g.lineWidth = 1.3; for (let i = 0; i < 2; i++){ const k = (((ph + i * .5) % 1) + 1) % 1; g.strokeStyle = `rgba(225,248,255,${(1 - k) * .75})`; ell(g, x, y, rx * (.3 + k * .65), ry * (.3 + k * .65)); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, x - rx * .45, y - ry * .3, rx * .16, ry * .18, -.3); g.fill(); ell(g, x + rx * .4, y + ry * .25, rx * .1, ry * .14, -.3); g.fill();
  g.restore();
}
function splash(g, x, y, t, seed = 1, n = 10, spread = 34){
  if (t <= 0 || t >= 1) return;
  const R = rng(seed); g.save(); g.globalAlpha *= 1 - t * t;
  for (let i = 0; i < n; i++){ const a = -Math.PI * .92 + R() * Math.PI * .84, sp = spread * (.5 + R()), px = x + Math.cos(a) * sp * t, py = y + Math.sin(a) * sp * t + t * t * 22, r = 1.6 + R() * 2.2;
    S.dot(g, E(px, py, r, r * 1.3), '#bfeeff'); S.dot(g, E(px - r * .3, py - r * .4, r * .35, r * .35), '#fff', .9); }
  g.restore();
}
function foam(g, x, y, rx, ry, ph, n = 10, seed = 1, a = 1){
  const R = rng(seed); g.save(); g.globalAlpha *= a;
  for (let i = 0; i < n; i++){ const an = (i / n + ph * .15) * TAU, wob = 1 + Math.sin(ph * TAU * 2 + i * 1.7) * .12, px = x + Math.cos(an) * rx * wob, py = y + Math.sin(an) * ry * wob, r = 2 + R() * 2.4, al = .5 + R() * .3;
    S.dot(g, E(px, py, r, r * .75), '#eafcff', al); S.dot(g, E(px - r * .3, py - r * .3, r * .35, r * .3), '#fff', al); }
  g.restore();
}
function bubbles(g, x, y, t, seed, n = 7, h = 50){ const R = rng(seed); for (let i = 0; i < n; i++){ const k = (t + R()) % 1, px = x + (R() - .5) * 50 + Math.sin(k * 9 + i) * 3, py = y - k * h * (.5 + R() * .5), r = 1.5 + R() * 2.6; g.strokeStyle = `rgba(220,250,255,${(1 - k) * .9})`; g.lineWidth = 1.1; ell(g, px, py, r, r); g.stroke(); S.dot(g, E(px - r * .3, py - r * .3, r * .3, r * .3), '#fff', (1 - k) * .8); } }
function aboveWater(g, wl, fn){ g.save(); g.beginPath(); g.rect(-300, -400, 600, 400 + wl); g.clip(); fn(); g.restore(); }
function sheen(g, clip, x, y, r, a = .5){ g.save(); clip(g); g.clip(); const gr = g.createRadialGradient(x, y, r * .1, x, y, r); gr.addColorStop(0, rgba(SHEEN.base, a)); gr.addColorStop(1, rgba(SHEEN.base, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
function crSample(pts, n){ const out = [], m = pts.length; for (let i = 0; i < m - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, m - 1)]; for (let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[m - 1]); return out; }
/** A tapered ribbon along a spline: { path, left, right, centre, w }. */
function ribbon(pts, wf, n = 6){ const c = crSample(pts, n), L = [], R = [], W = []; for (let i = 0; i < c.length; i++){ const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = wf(i / (c.length - 1)); W.push(w); L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); }
  const poly = [...L, ...R.slice().reverse()].map(p => [p[0], p[1]]); poly[0][2] = 1; poly[poly.length - 1][2] = 1; return { path:SM(poly, .5), left:L, right:R, centre:c, w:W }; }

/** A glowing eighth note at (x, y), scale s, rotation rot, alpha a. */
function noteGlyph(g, x, y, s = 1, rot = 0, a = 1, dbl = false){
  if (a <= .01) return;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha *= a;
  g.shadowColor = NOTEG; g.shadowBlur = 9;
  g.fillStyle = NOTEC; g.strokeStyle = NOTEC; g.lineCap = 'round'; g.lineJoin = 'round';
  ell(g, 0, 0, 5.2, 3.8, -.45); g.fill();
  g.lineWidth = 2; g.beginPath(); g.moveTo(4.4, -1.4); g.lineTo(4.4, -18); g.stroke();
  if (dbl){ ell(g, 12, -3, 5.2, 3.8, -.45); g.fill(); g.beginPath(); g.moveTo(16.4, -4.4); g.lineTo(16.4, -21); g.stroke(); g.lineWidth = 3.4; g.beginPath(); g.moveTo(4.4, -17); g.lineTo(16.4, -20); g.stroke(); }
  else { g.lineWidth = 2.4; g.beginPath(); g.moveTo(4.4, -18); g.quadraticCurveTo(12, -14, 10, -6); g.stroke(); }
  g.shadowBlur = 0;
  g.fillStyle = '#ffffff'; ell(g, -1.6, -1.2, 1.8, 1, -.45); g.fill();
  g.strokeStyle = 'rgba(10,80,70,.55)'; g.lineWidth = .8; ell(g, 0, 0, 5.2, 3.8, -.45); g.stroke();
  g.restore();
}

// ---------- the rock (part of her sprite) ----------
function rock(g, ph){
  const R0 = SM([[-50, 48], [-54, 32], [-48, 18], [-36, 8], [-20, 4], [-4, 7], [12, 3], [30, 7], [44, 15], [52, 30], [50, 48]], .8), RB = { x:-6, y:22, r:52 };
  S.part(g, R0, ROCK, RB, { mat:'stone', hx:-28, hy:12 });
  g.save(); R0(g); g.clip();
  S.dot(g, E(10, 46, 46, 12), '#1c2a2c', .35);   // wet, dark foot
  S.crease(g, SO([[-30, 14], [-24, 26], [-28, 40]]), ROCK, 2.2, .55); S.crease(g, SO([[30, 14], [38, 26], [34, 40]]), ROCK, 2, .5);
  S.dot(g, SM([[-48, 22], [-34, 12], [-22, 10], [-30, 18], [-44, 28]], .8), MOSS.base, .7);   // moss cap on the left shoulder
  g.restore();
  wet(g, R0, RB);
  for (const [x, y, r] of [[-42, 30, 4], [-35, 36, 3], [-44, 40, 2.6], [40, 24, 3.6], [46, 32, 2.8], [36, 36, 2.4], [20, 40, 2.4]]) barnacle(g, x, y, r);
  starfish(g, 44, 18, 6, .3);
  // kelp draped over the left edge, swaying
  const sw = Math.sin(ph * TAU) * 2;
  for (const [x0, L] of [[-38, 30], [-30, 24]]) S.tube(g, SO([[x0, 8], [x0 - 8, 18], [x0 - 12 + sw, 28], [x0 - 10 + sw * 1.4, 8 + L]]), KELP, 4.2);
}

// ---------- body parts ----------
/** The tail: from the hips, around the right front of the rock, curling to the left, fluke flicking. f -1..1 flick, lift raises the tip. */
function tail(g, f = 0, lift = 0){
  const pts = [[0, -4], [6, 8], [18, 20], [16, 33], [2, 39], [-16, 36], [-28, 26 - lift * 6], [-34 - f * 2, 14 - f * 4 - lift * 14]];
  const rb = ribbon(pts, u => 15 * Math.pow(1 - u, .75) + 2.6, 5), c = rb.centre, N = c.length;
  S.part(g, rb.path, TAIL, { x:4, y:20, r:30 }, { mat:'scaly', hx:8, hy:8 });
  // pale belly stripe along the inner edge
  g.save(); rb.path(g); g.clip(); g.strokeStyle = rgba(TAILB.base, .55); g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); for (let i = 2; i < N - 2; i++){ const p = [c[i][0] + (rb.left[i][0] - c[i][0]) * .55, c[i][1] + (rb.left[i][1] - c[i][1]) * .55]; i > 2 ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.restore();
  // scale crescents along the top
  for (let i = 3; i < N - 4; i += 2){ const k = .2, px = c[i][0] + (rb.right[i][0] - c[i][0]) * k, py = c[i][1] + (rb.right[i][1] - c[i][1]) * k, r = rb.w[i] * .28; g.strokeStyle = rgba(SCL, .6); g.lineWidth = .9; g.beginPath(); g.arc(px, py, r, .2, Math.PI - .2); g.stroke(); }
  // a little frill fin on the coil
  const m = c[Math.floor(N * .45)], m2 = c[Math.floor(N * .45) + 2];
  S.part(g, SM([[m[0], m[1] + 6], [m[0] - 4, m[1] + 14], [m2[0] - 2, m2[1] + 16], [m2[0] + 2, m2[1] + 6]], .8), FIN, { x:m[0], y:m[1] + 10, r:8 }, { flat:true, mat:'gel', lw:1 });
  // the fluke at the tip, two lobes with ribs
  const tp = c[N - 1], pr = c[N - 4], a = Math.atan2(tp[1] - pr[1], tp[0] - pr[0]) + f * .35;
  g.save(); g.translate(tp[0], tp[1]); g.rotate(a);
  const fl = SM([[-3, 0, 1], [6, -6], [16, -15], [18, -9], [12, -1], [9, 0, 1], [12, 1], [18, 9], [16, 15], [6, 6]], .7);
  g.save(); g.globalAlpha *= .92; S.part(g, fl, FIN, { x:8, y:0, r:16 }, { mat:'gel', lw:1.2, hx:6, hy:-6 }); g.restore();
  for (const s of [-1, 1]) for (const k of [.4, .7, 1]) S.ln(g, [[1, 0], [6 + k * 10, s * (4 + k * 9)]], FIN, .8, .45);
  g.restore();
  return rb;
}
/** A scallop shell at (x, y), opening up, radius r. */
function scallop(g, x, y, r, rot = 0){
  g.save(); g.translate(x, y); g.rotate(rot);
  const pts = [[-r * .25, r * .55, 1]]; for (let i = 0; i <= 8; i++){ const a = Math.PI * (1.05 + i / 8 * .9), rr = r * (i % 2 ? .92 : 1); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * .85 + r * .1]); } pts.push([r * .25, r * .55, 1]);
  const p = SM(pts, .6); S.part(g, p, SHELL, { x:0, y:-r * .2, r }, { mat:'paint', lw:1.1, hx:-r * .35, hy:-r * .45 });
  for (let i = 1; i < 8; i++){ const a = Math.PI * (1.05 + i / 8 * .9); S.ln(g, [[0, r * .45], [Math.cos(a) * r * .9, Math.sin(a) * r * .78 + r * .1]], SHELL, .8, .4); }
  S.part(g, E(0, r * .5, r * .3, r * .16), SHELL, { x:0, y:r * .5, r:r * .3 }, { flat:true, lw:.8 });
  g.restore();
}
function pearl(g, x, y, r){ S.part(g, E(x, y, r, r), PEARL, { x, y, r }, { lw:.7, hx:x - r * .35, hy:y - r * .4 }); }
/** A fish skeleton used as a hair comb. */
function boneComb(g, x, y, rot){
  g.save(); g.translate(x, y); g.rotate(rot);
  S.ln(g, [[-12, 0], [12, 0]], BONE, 3.4, .85); S.ln(g, [[-12, 0], [12, 0]], pal('#fffaf0'), 1.8, .9);
  for (let i = 0; i < 5; i++){ const xx = -7 + i * 4, l = 5.5 - Math.abs(i - 1.5) * .8; for (const s of [-1, 1]){ g.strokeStyle = BONE.base; g.lineWidth = 1.3; g.lineCap = 'round'; g.beginPath(); g.moveTo(xx, 0); g.quadraticCurveTo(xx - 1.5, s * l * .6, xx - 2.4, s * l); g.stroke(); } }
  S.part(g, PL([[11, -5], [20, 0], [11, 5], [9, 0]]), BONE, { x:14, y:0, r:6 }, { flat:true, mat:'bone', lw:.9 }); S.dot(g, E(14.5, -.8, 1.3, 1.3), '#2a2a28');
  S.part(g, PL([[-12, 0], [-18, -5], [-16, 0], [-18, 5]]), BONE, { x:-15, y:0, r:5 }, { flat:true, mat:'bone', lw:.8 });
  g.restore();
}
/** An arm: shoulder, elbow, hand; dir = where the fingers point. */
function arm(g, sh, el, hd, dir, fingers = 4){
  S.tube(g, SO([sh, el, hd]), SKIND, 6.4);
  // webbed fingers with pointed nails
  const [hx, hy] = hd;
  g.save(); g.globalAlpha *= .55; S.dot(g, PL([[hx + Math.cos(dir - .7) * 6, hy + Math.sin(dir - .7) * 6], [hx + Math.cos(dir) * 8, hy + Math.sin(dir) * 8], [hx + Math.cos(dir + .7) * 6, hy + Math.sin(dir + .7) * 6], [hx, hy]]), FIN.base); g.restore();
  for (let i = 0; i < fingers; i++){ const a = dir + (i - (fingers - 1) / 2) * .42, mx = hx + Math.cos(a) * 4, my = hy + Math.sin(a) * 4, tx = hx + Math.cos(a) * 8.5, ty = hy + Math.sin(a) * 8.5;
    S.tube(g, SO([[mx, my], [tx, ty]]), SKIND, 2.4); S.claw(g, tx, ty, a, 2.6, '#e8f6f0'); }
  S.part(g, E(hx, hy, 4.4, 4), SKIND, { x:hx, y:hy, r:4.4 }, { flat:true, mat:'skin', lw:1 });
}

/** Hair behind the head: a long wet mass down both sides to the rock, ends split like kelp fronds. sw -1..1 sways the ends. */
function backHair(g, sw, flare = 0){
  const d = y => (y + 70) / 90;   // how far down the strand: ends sway most
  const X = (x, y) => x + sw * 5 * d(y) * Math.sign(x || 1) * .3 + sw * 4 * d(y) + Math.sign(x) * flare * 8 * d(y);
  const pts = [[-24, -78], [-31, -60], [-33, -36], [-36, -12], [-38, 8, 1], [-33, 4], [-31, 14, 1], [-26, 2], [-20, -10], [20, -10], [26, 2], [31, 14, 1], [33, 4], [38, 8, 1], [36, -12], [33, -36], [31, -60], [24, -78], [0, -88]].map(p => [X(p[0], p[1]), p[1], p[2]]);
  const hp = SM(pts, .8);
  S.part(g, hp, HAIR, { x:0, y:-46, r:46 }, { mat:'skin', hx:-20, hy:-74 });
  g.save(); hp(g); g.clip();
  for (const s of [-1, 1]) for (const k of [0, 1]) S.crease(g, SO([[s * (22 + k * 5), -64], [X(s * (28 + k * 4), -30), -30], [X(s * (30 + k * 3), 2), 2]]), HAIR, 1.6, .5);
  g.restore();
  // dripping kelp-leaf tips
  for (const [x, y] of [[-38, 8], [-31, 14], [31, 14], [38, 8]]){ const px = X(x, y), py = y; S.dot(g, E(px, py + 3, 1.6, 2.1), '#c8f0ff', .85); }
}
/** Strands that fall in front of the shoulders. */
function frontHair(g, sw, flare = 0){
  for (const s of [-1, 1]){ const k = sw * 3, f = flare * s * 6;
    S.tube(g, SO([[s * 18, -66], [s * 25, -44], [s * 23 + k * .5 + f * .4, -20], [s * 26 + k + f, 0]]), HAIR, 5.2);
    S.tube(g, SO([[s * 13, -70], [s * 20, -48], [s * 17 + k * .5 + f * .3, -30], [s * 19 + k + f * .7, -14]]), HAIR, 3.6);
    S.dot(g, E(s * 26 + k + f + .5, 4, 1.6, 2.1), '#c8f0ff', .85); }
}

/** The head. o: mouth 0..1 (gape), white 0..1 (eye glow), squeeze (hit), look -1..1, tilt. */
function head(g, o){
  const mouth = o.mouth ?? 0, J = mouth * 9, white = o.white ?? 0, sq = o.squeeze ?? 0, lk = o.look ?? 0;
  // fin ears
  for (const s of [-1, 1]){ const fe = SM([[s * 20, -64, 1], [s * 34, -80], [s * 38, -72], [s * 41, -62], [s * 37, -52], [s * 22, -52, 1]], .7);
    g.save(); g.globalAlpha *= .92; S.part(g, fe, FIN, { x:s * 30, y:-64, r:14 }, { flat:true, mat:'gel', lw:1.1 }); g.restore();
    for (const [ex, ey] of [[34, -78], [39, -68], [38, -56]]) S.ln(g, [[s * 22, -58], [s * ex, ey]], FIN, .8, .45); }
  const hd = SM([[-24, -64], [-24, -50], [-18, -40 + J * .3], [-8, -33 + J], [0, -32 + J], [8, -33 + J], [18, -40 + J * .3], [24, -50], [24, -64], [18, -80], [0, -86], [-18, -80]]), HB = { x:0, y:-58, r:28 };
  S.part(g, hd, SKIN, HB, { mat:'skin', hx:-12, hy:-74 });
  sheen(g, hd, 0, -28, 30, .45);
  S.contact(g, hd, 0, -84, 26, 8, .3);
  // cheek scales and a faint blush
  for (const s of [-1, 1]) for (const [dx, dy] of [[0, 0], [3, 3], [-1, 4]]){ S.dot(g, E(s * (19 + dx), -50 + dy, 1.7, 1.5), SCL, .7); S.dot(g, E(s * (19 + dx), -49.4 + dy, 1.7, .8), TAIL.deep, .3); }
  S.blush(g, 0, -46, .62);
  // eyes
  for (const s of [-1, 1]){ const ex = s * 10.5, ey = -58;
    if (sq > .3){ S.ln(g, [[ex - s * 6, ey - 5], [ex + s * 3, ey], [ex - s * 6, ey + 4]], SKIN, 2.2, .9); continue; }
    if (white > .5){
      g.save(); g.shadowColor = EYEW; g.shadowBlur = 14; S.dot(g, E(ex, ey, 9, 10), '#dffff6'); g.restore();
      S.dot(g, E(ex, ey, 7.5, 8.5), '#ffffff'); S.dot(g, E(ex, ey + 1, 4.5, 5), rgba(EYEG, .35));
      // a heavy, slanted lid: the sweet look gone
      g.save(); ell(g, ex, ey, 9.2, 10.2); g.clip(); g.translate(ex, ey); g.rotate(s * .38); g.fillStyle = SKIN.dark; g.fillRect(-14, -16, 28, 10); g.restore();
      S.ln(g, [[ex - s * 9, ey - 2], [ex + s * 7, ey - 9]], SKIN, 1.6, .8);
    } else {
      g.save(); g.shadowColor = EYEG; g.shadowBlur = 10; S.dot(g, E(ex, ey, 9.6, 10.6), rgba(EYEG, .45)); g.restore();
      S.eye(g, ex, ey, 8.6, 9.6, { pr:.44, lx:lk * .25 + s * .04, ly:.14, iris:EYEG, pupil:'#0c3a34', lid:.12, tilt:-s * .12, lidCol:SKIN.base, lidDeep:SKIN.deep });
      // glow in the iris
      g.save(); ell(g, ex, ey, 8.6, 9.6); g.clip(); g.shadowColor = EYEG; g.shadowBlur = 6; S.dot(g, E(ex + lk * 2 + s * .4, ey + 3.6, 3.4, 2), EYEG, .8); g.restore();
      // lashes at the outer corner and a tired dark ring under
      for (const k of [0, 1]) S.ln(g, [[ex + s * (6 + k * 2), ey - 7 + k * 2], [ex + s * (10 + k * 2), ey - 10 + k * 2]], pal('#1a2a26'), 1.3, .9);
      S.dot(g, SM([[ex - 6, ey + 9], [ex, ey + 11.5], [ex + 6, ey + 9], [ex, ey + 10]], .8), SKIN.deep, .32);
    } }
  // nose slits
  for (const s of [-1, 1]) S.dot(g, E(s * 1.8, -47, .8, 1.5, s * .3), SKIN.deep, .6);
  // the mouth
  if (mouth < .12 && sq < .3){
    S.stroke(g, SO([[-6.5, -42], [-3, -40], [0, -40.5], [3, -40], [6.5, -42]]), SKIN, 1.4, .9);
    for (const x of [-3, 3]) S.dot(g, PL([[x - .9, -40.4], [x + .9, -40.4], [x, -38]]), NEEDLE);   // a hint of fang
  } else {
    const m = Math.max(mouth, sq > .3 ? .35 : 0), cy = -40 + m * 4.5, rx = 5 + m * 8, ry = 1.8 + m * 7.4, mp = E(0, cy, rx, ry);
    S.dot(g, mp, '#0a1614'); g.save(); mp(g); g.clip(); const tg = g.createRadialGradient(0, cy + ry * .3, 1, 0, cy, rx); tg.addColorStop(0, THROAT); tg.addColorStop(.55, '#1a0a12'); tg.addColorStop(1, '#0a1614'); g.fillStyle = tg; g.fillRect(-rx, cy - ry, rx * 2, ry * 2);
    S.dot(g, E(0, cy + ry * .7, rx * .45, ry * .3), '#8a3a4a', .7); g.restore();
    // needle teeth, top row pointing down, bottom row pointing up
    const n = Math.round(7 + m * 6);
    for (const top of [true, false]) for (let i = 0; i < n; i++){ const u = i / (n - 1), a = top ? Math.PI + .22 + u * (Math.PI - .44) : .22 + u * (Math.PI - .44), x = Math.cos(a) * rx, y = cy + Math.sin(a) * ry,
      L = (2.2 + m * 2.6) * (1 - Math.abs(u - .5) * .7), dir = top ? 1 : -1;
      S.dot(g, PL([[x - .9, y], [x + .9, y], [x * .94, y + dir * L]]), NEEDLE); }
    g.strokeStyle = rgba(SKIN.deep, .75); g.lineWidth = 1.2; ell(g, 0, cy, rx, ry); g.stroke();
    S.dot(g, E(0, cy + ry + 2, rx * .5, 1.2), SKIN.light, .35);   // the stretched lower lip catching light
  }
  // bangs: side-swept wet hair over the forehead
  const bang = SM([[-25, -60], [-26, -74], [-14, -87], [4, -89], [20, -82], [26, -68], [25, -58], [18, -70], [10, -67, 1], [3, -75], [-6, -69, 1], [-14, -74], [-20, -66, 1]], .8);
  S.part(g, bang, HAIR, { x:0, y:-76, r:26 }, { mat:'skin', hx:-8, hy:-84 });
  g.save(); bang(g); g.clip(); for (const x of [-14, -4, 8, 18]) S.crease(g, SO([[x + 4, -88], [x, -76], [x - 3, -68]]), HAIR, 1.3, .5); g.restore();
  wet(g, hd, HB, [[-22, -46, 4]]);
  // ornaments: a fish-bone comb on the right, a pearl and a little shell on the left
  boneComb(g, 16, -86, -.55);
  pearl(g, -22, -80, 3); scallop(g, -16, -86, 5, -.4);
}

// ---------- the siren ----------
export function siren(g, P = {}){
  let sink = 0, rockSink = 0, ph = 0, flick = 0, mouth = 0, white = 0, sq = 0, lean = 0, sway = 0, flare = 0, look = 0, br = 0, notesT = null, wave = 0,
    charmK = null, slipK = 0, lift = 0, dripAll = false, splashT = 0, splashT2 = 0, splashX = 0, bub = 0;
  if (P.surface != null){ const t = P.surface, e = 1 - Math.pow(1 - t, 2.2); sink = (1 - e) * 150; ph = t; sway = Math.sin(t * TAU) * .6; flick = Math.sin(t * TAU * 1.5); dripAll = true; splashT = Math.min(.999, t * 1.25); splashT2 = Math.max(0, t * 1.6 - .6); }
  else if (P.dive != null){ const t = P.dive; ph = t; slipK = ease(clamp(t / .55)); rockSink = ease(clamp((t - .5) / .5)) * 80; flick = -slipK; lift = slipK; sq = slipK > .1 && slipK < .9 ? 1 : 0; flare = slipK * .6; splashT = clamp((t - .3) / .55); splashX = -22; bub = t; mouth = slipK > .1 ? .2 : 0; }
  else if (P.sing != null){ const t = P.sing; ph = t; br = Math.sin(t * TAU); mouth = .8 + Math.sin(t * TAU * 2) * .2; white = 1; notesT = t; wave = t; sway = Math.sin(t * TAU) * .8; flick = Math.sin(t * TAU) * .6; lean = Math.sin(t * TAU) * .03; }
  else if (P.charm != null){ const t = P.charm; charmK = t; ph = t; const wind = ease(clamp(t / .35)), sweep = ease(clamp((t - .35) / .22)), rel = ease(clamp((t - .7) / .3));
    lean = -wind * .1 + sweep * .2 - rel * .1; mouth = .5 + sweep * .5 - rel * .3; white = 1; sway = -wind * .6 + sweep * 1.4 - rel * .8; flare = sweep * (1 - rel) * .5; flick = -wind + sweep * 1.6 - rel * .6; look = -wind + sweep * 2 - rel; }
  else if (P.hit != null){ const t = P.hit, k = Math.sin(t * Math.PI); ph = t; sq = k > .25 ? 1 : 0; mouth = .1; lean = -k * .16; flare = k * .9; sway = k * .6; flick = k * 1.2; }
  else { const t = P.idle ?? 0; ph = t; br = Math.sin(t * TAU); sway = Math.sin(t * TAU); flick = Math.sin(t * TAU + .6); look = Math.sin(t * TAU + 1.4) * .7; }
  g.save(); if (P.flip) g.scale(-1, 1);
  aboveWater(g, WL, () => {
    g.save(); g.translate(0, sink);
    g.save(); g.translate(0, rockSink); rock(g, ph); g.restore();
    // she: pivots at the hips (0, 0); the dive slides her off the rock to the left and down into the pool
    g.save();
    if (slipK > 0){ g.translate(-slipK * 16, slipK * 120 - Math.sin(slipK * Math.PI) * 10); g.rotate(-slipK * .95); }
    backHair(g, sway, flare);
    // hips: where skin turns to tail, with little side fins
    tail(g, flick, lift);
    for (const s of [-1, 1]) S.part(g, SM([[s * 13, -2], [s * 24, 2], [s * 26, 10], [s * 16, 8]], .8), FIN, { x:s * 20, y:4, r:8 }, { flat:true, mat:'gel', lw:1 });
    const hip = SM([[-16, -8], [-17, 4], [-8, 12], [8, 12], [17, 4], [16, -8]], .8); S.part(g, hip, TAIL, { x:0, y:2, r:17 }, { mat:'scaly', hx:-6, hy:-2 });
    g.save(); g.translate(0, 2); g.rotate(lean); g.translate(0, -2 + br * -.8);
    // torso
    const torso = SM([[-14, 0], [-13, -10], [-18, -22], [-15, -29], [0, -31], [15, -29], [18, -22], [13, -10], [14, 0]], .85), TB = { x:0, y:-14, r:20 };
    S.part(g, torso, SKIN, TB, { mat:'skin', hx:-6, hy:-22 }); sheen(g, torso, 0, 4, 22, .5);
    // the scalloped line where the scales start
    for (let x = -13; x <= 13; x += 3.25){ S.part(g, E(x, -1.5, 2.5, 2.4), TAIL, { x, y:-1.5, r:2.5 }, { flat:true, noEdge:true }); g.strokeStyle = rgba(SCL, .7); g.lineWidth = .7; g.beginPath(); g.arc(x, -1.5, 2.2, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    S.crease(g, SO([[-2, -12], [0, -6], [-1, -2]]), SKIN, 1.1, .3);
    // shoulder scales
    for (const s of [-1, 1]) for (const [dx, dy] of [[0, 0], [3, 2], [-2, 3], [1, 5], [5, -1]]){ S.dot(g, E(s * (14 + dx), -27 + dy, 2.1, 1.8), SCL, .8); S.dot(g, E(s * (14 + dx), -26.2 + dy, 2.1, 1), TAIL.deep, .3); }
    scallop(g, -7.5, -15, 7.6, -.2); scallop(g, 7.5, -15, 7.6, .2);
    S.ln(g, [[-2, -18], [2, -18]], SHELL, 1.2, .7);
    // pearl necklace with a little conch
    for (let i = 0; i < 9; i++){ const u = i / 8, x = -11 + u * 22, y = -28 + Math.sin(u * Math.PI) * 4.4; pearl(g, x, y, 1.6); }
    S.part(g, SM([[-2.4, -22], [2.4, -22], [1.4, -17], [0, -15, 1], [-1.4, -17]], .7), SHELL, { x:0, y:-19, r:4 }, { flat:true, mat:'paint', lw:.8 });
    wet(g, torso, TB, [[-12, -4, 4]]);
    frontHair(g, sway, flare);
    // arms
    const LS = [-15, -25], RS = [15, -25];
    let lEl, lHd, lDir, rEl, rHd, rDir;
    if (P.sing != null){ const b = Math.sin(ph * TAU) * 2; lEl = [-28, -16 + b]; lHd = [-38, -32 + b]; lDir = -Math.PI * .7; rEl = [28, -16 - b]; rHd = [38, -32 - b]; rDir = -Math.PI * .3; }
    else if (charmK != null){ const t = charmK, rest = [[28, -16], [38, -32]], wind = [[8, -12], [-12, -24]], out = [[32, -24], [48, -28]], w = ease(clamp(t / .35)), s = ease(clamp((t - .35) / .22)), r = ease(clamp((t - .7) / .3));
      let E2 = lp(rest[0], wind[0], w), H2 = lp(rest[1], wind[1], w); if (s > 0){ E2 = lp(E2, out[0], s); H2 = lp(H2, out[1], s); } if (r > 0){ E2 = lp(E2, rest[0], r); H2 = lp(H2, rest[1], r); }
      rEl = E2; rHd = H2; rDir = lerp(lerp(-Math.PI * .3, Math.PI * 1.1, w), 0, s) * (1 - r) + -Math.PI * .3 * r; lEl = [-26, -12]; lHd = [-32, 4]; lDir = Math.PI * .55; }
    else if (P.hit != null){ const k = Math.sin(P.hit * Math.PI); lEl = lp([-26, -8], [-30, -22], k); lHd = lp([-30, 6], [-36, -38], k); lDir = lerp(Math.PI * .55, -Math.PI * .7, k); rEl = lp([24, -10], [30, -22], k); rHd = lp([14, 2], [36, -38], k); rDir = lerp(Math.PI * .8, -Math.PI * .3, k); }
    else { const b = br * 1.2; lEl = [-26, -8 + b * .3]; lHd = [-30, 6]; lDir = Math.PI * .55; rEl = [24, -10 + b * .3]; rHd = [14, 2]; rDir = Math.PI * .85; }
    // the charm sweep trail (behind the arm)
    if (charmK != null){ const s = clamp((charmK - .35) / .22), fade = 1 - clamp((charmK - .6) / .15); if (s > 0 && fade > 0){ g.save(); g.globalAlpha *= fade * .8; g.lineCap = 'round'; g.shadowColor = NOTEG; g.shadowBlur = 8;
      for (let i = 0; i < 3; i++){ g.strokeStyle = `rgba(143,248,226,${.6 - i * .16})`; g.lineWidth = 3 - i * .8; g.beginPath(); g.arc(15, -25, 32 + i * 6, Math.PI * (1.05 - .05 * i), Math.PI * (1.05 + .95 * s), false); g.stroke(); } g.restore(); } }
    arm(g, LS, lEl, lHd, lDir); arm(g, RS, rEl, rHd, rDir);
    // neck and head
    S.tube(g, SO([[0, -32], [0, -38]]), SKIND, 9);
    g.save(); g.translate(0, -36); g.rotate(sway * .05 + (P.hit != null ? -Math.sin(P.hit * Math.PI) * .12 : 0) + (charmK != null ? lean * .5 : 0)); g.translate(0, 36);
    head(g, { mouth, white, squeeze:sq, look });
    g.restore();
    // song notes rising off her mouth (the engine sends the lane note separately, from the `note` entry)
    if (notesT != null) for (let i = 0; i < 3; i++){ const k = (notesT + i / 3) % 1, s = i % 2 ? 1 : -1, x = s * (8 + k * 30) + Math.sin(k * 7 + i) * 3, y = -38 - k * 50;
      noteGlyph(g, x, y, .62 + k * .3, s * .25 + Math.sin(k * 6) * .2, Math.sin(k * Math.PI), i === 1); }
    // the charm: the strong note blooms at her fingertips as the sweep ends
    if (charmK != null){ const k = clamp((charmK - .5) / .4); if (k > 0 && k < 1){ const [hx, hy] = rHd; g.save(); g.globalAlpha *= Math.sin(k * Math.PI);
      g.shadowColor = NOTEG; g.shadowBlur = 14; g.strokeStyle = rgba(NOTEC, .7); g.lineWidth = 1.6; ell(g, hx + 2, hy - 4, 7 + k * 6, 7 + k * 6); g.stroke(); g.restore();
      noteGlyph(g, hx - 2 + k * 2, hy - 2, .9 + k * .15, .2, Math.sin(k * Math.PI) * 1.2, true); } }
    g.restore();
    if (dripAll){ for (const [x, y, l] of [[-24, -10, 6], [22, -6, 5], [-6, 10, 4]]) { S.tube(g, SO([[x, y], [x + 1, y + l]]), DRIP, 1.8); S.dot(g, E(x + 1, y + l + 1.5, 1.6, 2), '#c8f0ff', .9); } }
    g.restore();
    g.restore();
  });
  // the pool: water disc over the rock's foot, ripples, foam, splashes and bubbles
  const ext = P.surface != null ? .4 + P.surface * .6 : 1;
  water(g, 0, WL + 3, 60 * ext + 2, 11 * ext + 1, ph * .9, .82);
  foam(g, 0, WL + 1, 46 * ext, 6, ph, 12, 3, P.dive != null ? Math.max(.3, 1 - rockSink / 80) : .9);
  if (wave){ g.save(); g.strokeStyle = 'rgba(143,248,226,.55)'; g.lineWidth = 1.2; for (let i = 0; i < 2; i++){ const k = (wave + i * .5) % 1; g.globalAlpha = 1 - k; ell(g, 0, WL + 3, 34 + k * 26, 6 + k * 5); g.stroke(); } g.restore(); }
  if (P.surface != null){ splash(g, 0, WL, splashT, 4, 16, 44); splash(g, 0, WL, splashT2, 8, 10, 32); }
  if (P.dive != null){ splash(g, splashX, WL, splashT, 6, 14, 28); splash(g, 0, WL, clamp((P.dive - .6) / .4), 11, 10, 36); bubbles(g, -12, WL, bub, 9, 7, 30 * bub); }
  g.restore();
}

// ---------- the lane note (engine projectile / effect) ----------
export function note(g, P = {}){
  const t = P.drift ?? 0, wx = Math.sin(t * TAU) * 4, rot = Math.sin(t * TAU) * .18;
  // the wavy trail streaming up behind it (it drifts down the lane, toward the wall)
  g.save(); g.lineCap = 'round'; g.shadowColor = NOTEG; g.shadowBlur = 8;
  for (let j = 0; j < 2; j++){ g.beginPath(); for (let i = 0; i <= 14; i++){ const u = i / 14, y = -4 - u * 44, x = wx * (1 - u) + Math.sin(u * 9 - t * TAU + j * 1.6) * (2 + u * 5) + (j ? 3 : -2);
      i ? g.lineTo(x, y) : g.moveTo(x, y); }
    const gr = g.createLinearGradient(0, -4, 0, -48); gr.addColorStop(0, rgba(NOTEC, j ? .55 : .8)); gr.addColorStop(1, rgba(NOTEC, 0)); g.strokeStyle = gr; g.lineWidth = j ? 1.5 : 2.6; g.stroke(); }
  g.restore();
  // sparkles shed along the trail
  for (let i = 0; i < 3; i++){ const k = (t + i / 3) % 1, x = Math.sin(i * 2.4 + k * 5) * 9, y = -10 - k * 34; g.save(); g.globalAlpha *= (1 - k) * .9; g.shadowColor = NOTEG; g.shadowBlur = 6; S.dot(g, E(x, y, 1.5 - k * .6, 1.5 - k * .6), '#e8fff8'); g.restore(); }
  // soft halo and the note itself
  g.save(); const hg = g.createRadialGradient(wx, 0, 0, wx, 0, 16); hg.addColorStop(0, 'rgba(78,240,196,.45)'); hg.addColorStop(1, 'rgba(78,240,196,0)'); g.fillStyle = hg; ell(g, wx, -4, 16, 16); g.fill(); g.restore();
  noteGlyph(g, wx - 3, 6, 1.15, rot, 1);
}

// ---------- the bend swirl (sits on a pumpkin her song pushes sideways) ----------
export function bend(g, P = {}){
  const t = P.swirl ?? 0, sp = t * TAU;
  g.save(); if (P.flip) g.scale(-1, 1);
  // motion streaks trailing on the side it came from (the push goes to +x)
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 4; i++){ const y = -14 + i * 9, k = (t * 2 + i * .27) % 1, x0 = -30 - k * 8, L = 12 + (i % 2) * 6; const gr = g.createLinearGradient(x0 - L, 0, x0, 0); gr.addColorStop(0, 'rgba(143,248,226,0)'); gr.addColorStop(1, `rgba(143,248,226,${.75 * (1 - k * .6)})`); g.strokeStyle = gr; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x0 - L, y); g.lineTo(x0, y); g.stroke(); }
  g.restore();
  // the swirl: three glowing arcs spinning around the pumpkin, the ring squashed in the push direction
  g.save(); g.shadowColor = NOTEG; g.shadowBlur = 9; g.lineCap = 'round';
  for (let i = 0; i < 3; i++){ const a0 = sp + i * TAU / 3, r = 26 + i * 2.5; g.save(); g.scale(1.12, .8); g.strokeStyle = rgba(NOTEC, .85 - i * .15); g.lineWidth = 3 - i * .6; g.beginPath(); g.arc(0, 0, r, a0, a0 + 1.7); g.stroke();
    const ex = Math.cos(a0 + 1.7) * r, ey = Math.sin(a0 + 1.7) * r; g.fillStyle = '#e8fff8'; ell(g, ex, ey, 1.8, 1.8); g.fill(); g.restore(); }
  g.restore();
  // a curved arrow showing which way it is pushed
  g.save(); g.shadowColor = NOTEG; g.shadowBlur = 6; g.strokeStyle = rgba(NOTEC, .9); g.fillStyle = NOTEC; g.lineWidth = 2.6; g.lineCap = 'round';
  const ax = 32 + Math.sin(sp * 2) * 2; g.beginPath(); g.moveTo(ax - 10, -10); g.quadraticCurveTo(ax + 2, -8, ax + 4, 0); g.stroke(); g.beginPath(); g.moveTo(ax + 9, -3); g.lineTo(ax + 4, 6); g.lineTo(ax - 1, -1); g.closePath(); g.fill(); g.restore();
  // two little notes orbiting
  for (let i = 0; i < 2; i++){ const a = -sp * 1 + i * Math.PI, x = Math.cos(a) * 30, y = Math.sin(a) * 20; noteGlyph(g, x, y + 4, .55, Math.sin(a) * .3, .55 + .45 * Math.max(0, -Math.sin(a))); }
  g.restore();
}

// ---------- registry-style entries ----------
// box: the frame in drawing units holding every pose. scale: a suggested in-game scale (see README).
export const CLIPS = {
  siren: { name:'The Siren', draw:siren, scale:.5, dy:-3, box:{ x:-92, y:-112, w:176, h:180 },
    clips:{ surface:{ n:8, fps:10, once:true, pose:t => ({ surface:t }) }, idle:{ n:8, fps:6, pose:t => ({ idle:t }) }, sing:{ n:8, fps:8, pose:t => ({ sing:t }) },
      charm:{ n:10, fps:14, once:true, pose:t => ({ charm:t }) }, charmL:{ n:10, fps:14, once:true, pose:t => ({ charm:t, flip:true }) },
      hit:{ n:5, fps:14, once:true, pose:t => ({ hit:t }) }, dive:{ n:9, fps:12, once:true, pose:t => ({ dive:t }) } } },
  note: { name:'Song note (lane effect)', draw:note, scale:.5, box:{ x:-26, y:-54, w:52, h:72 }, clips:{ drift:{ n:8, fps:10, pose:t => ({ drift:t }) } } },
  bend: { name:'Bend swirl (on a pumpkin)', draw:bend, scale:.5, box:{ x:-58, y:-34, w:116, h:66 },
    clips:{ swirl:{ n:8, fps:14, pose:t => ({ swirl:t }) }, swirlL:{ n:8, fps:14, pose:t => ({ swirl:t, flip:true }) } } },
};
