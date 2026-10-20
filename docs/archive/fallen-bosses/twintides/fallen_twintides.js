// ---------- The Fallen Twin Tides (design archive, not in the game) ----------
// A copy of the Twin Tides drawing from src/engine/render/chars/w5.js with a nightmare `fallen` variant.
// `twintides(g, P)` is the original: P.variant null (level 10) or 'form2' (level 20, the full form).
// `fallenTwintides(g, P)` adds P.variant === 'fallen' with P.twin 'blood' (crimson siren, gore-slick, needle teeth,
// crown of bone, red eyes) or 'blue' (abyssal blue-black, bioluminescent, frost, whirlpool, ice-blue eyes).
// Both fallen twins are drawn at the full-form size and keep every clip and pose param of the original
// (idle, bolt, collapse) plus an optional `skill` param (0..1): the Blood twin sings (eyes flare red, sound rings),
// the Blue twin opens a whirlpool (eyes flare blue, the water spins).
// In the game both twins are drawn by the same entry (the engine spawns a pair, `a.twin = b`, no mirroring);
// the fallen twins would need `P.twin` passed as part of the variant key ('fallen-blood' / 'fallen-blue' atlases).

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/render/paint.js';
import { TAU } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/util.js';

const DRIP = pal('#9fd8e8'), BARN = pal('#d8d0c0'), TOOTH = '#f4fbff';
// nightmare palettes
const GORE = pal('#7a0a14'), GOREL = pal('#c01828'), CORAL = pal('#c8303a'), BONE = pal('#e6dcc6'), FLESH = pal('#b8343c');
const ICE = pal('#bfe6ff'), SKULL = pal('#b8a68c'), ABYSS = pal('#0a1430'), LUME = '#5ae8ff', LUMED = '#1e9ad0';

// ---------- water and costume helpers (copied from w5.js, with a colour style so the sea can turn red or black) ----------
const SEA0 = { in:'rgba(130,205,228,.95)', out:'rgba(50,130,160,.7)', edge:'rgba(25,80,100,.7)', ring:'225,248,255', hi:'rgba(255,255,255,.55)', foam:'#eafcff', drop:'#bfeeff', bubble:'rgba(230,250,255,.7)' },
  SEABLOOD = { in:'rgba(196,30,42,.96)', out:'rgba(86,6,14,.8)', edge:'rgba(40,2,8,.85)', ring:'255,140,130', hi:'rgba(255,200,190,.45)', foam:'#ffb4b0', drop:'#e03848', bubble:'rgba(255,150,140,.7)' },
  SEABLUE = { in:'rgba(26,56,110,.96)', out:'rgba(5,12,34,.85)', edge:'rgba(3,8,22,.9)', ring:'120,225,255', hi:'rgba(190,240,255,.45)', foam:'#bfeeff', drop:'#8ee6ff', bubble:'rgba(160,230,255,.7)' };
/** Wet sheen: extra soft highlights and a couple of drips on a clip shape. */
function wet(g, clip, b, drips = [], hi = 'rgba(255,255,255,.35)', dp = DRIP, drop = '#c8f0ff'){ g.save(); clip(g); g.clip(); g.fillStyle = hi; ell(g, b.x - b.r * .3, b.y - b.r * .2, b.r * .32, b.r * .1, -.5); g.fill(); ell(g, b.x + b.r * .25, b.y + b.r * .3, b.r * .18, b.r * .06, -.4); g.fill(); g.restore();
  for (const [x, y, l] of drips){ S.tube(g, SO([[x, y], [x + 1, y + l]]), dp, 2.2); S.dot(g, E(x + 1, y + l + 1.5, 1.8, 2.2), drop, .9); } }
/** A barnacle: a little cone with a dark mouth. */
function barnacle(g, x, y, r = 4){ S.part(g, E(x, y, r, r * .8), BARN, { x, y, r }, { flat:true, mat:'stone', noEdge:true }); S.dot(g, E(x, y, r * .35, r * .3), '#3a3028', .9); }
/** A disc of water with drifting ripple rings; ph 0..1 animates the rings. whirl > 0 spins a whirlpool spiral in it. */
function water(g, x, y, rx, ry, ph = 0, a = .85, W = SEA0, whirl = 0){
  g.save(); g.globalAlpha *= a;
  const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, W.in); gr.addColorStop(1, W.out);
  ell(g, x, y, rx, ry); g.fillStyle = gr; g.fill(); g.strokeStyle = W.edge; g.lineWidth = 1.4; g.stroke();
  if (whirl > 0){ g.save(); ell(g, x, y, rx, ry); g.clip(); g.shadowColor = LUME; g.shadowBlur = 6 * whirl; g.lineCap = 'round';
    for (const arm of [0, .5]){ g.beginPath(); for (let k = 0; k <= 40; k++){ const t = k / 40, r = rx * (.08 + t * .9), an = (t * 2.2 + arm + ph * 2) * TAU; const px = x + Math.cos(an) * r, py = y + Math.sin(an) * r * ry / rx; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.strokeStyle = `rgba(${W.ring},${.95 * whirl})`; g.lineWidth = 2.2; g.stroke(); }
    const eye = g.createRadialGradient(x, y, 0, x, y, rx * .3); eye.addColorStop(0, 'rgba(2,6,16,.9)'); eye.addColorStop(1, 'rgba(2,6,16,0)'); g.fillStyle = eye; g.globalAlpha *= whirl; ell(g, x, y, rx * .3, ry * .3); g.fill(); g.restore(); }
  g.lineWidth = 1.3; for (let i = 0; i < 2; i++){ const k = (ph + i * .5) % 1; g.strokeStyle = `rgba(${W.ring},${(1 - k) * .75})`; ell(g, x, y, rx * (.3 + k * .65), ry * (.3 + k * .65)); g.stroke(); }
  g.fillStyle = W.hi; ell(g, x - rx * .45, y - ry * .3, rx * .16, ry * .18, -.3); g.fill(); ell(g, x + rx * .4, y + ry * .25, rx * .1, ry * .14, -.3); g.fill();
  g.restore();
}
/** Splash droplets flying up from (x, y); t 0..1 is how far along the arc they are. */
function splash(g, x, y, t, seed = 1, n = 10, spread = 34, col = '#bfeeff'){
  if (t <= 0 || t >= 1) return;
  const R = rng(seed); g.save(); g.globalAlpha *= 1 - t * t;
  for (let i = 0; i < n; i++){ const a = -Math.PI * .92 + R() * Math.PI * .84, sp = spread * (.5 + R()), px = x + Math.cos(a) * sp * t, py = y + Math.sin(a) * sp * t + t * t * 46, r = 1.6 + R() * 2.2;
    S.dot(g, E(px, py, r, r * 1.3), col); S.dot(g, E(px - r * .3, py - r * .4, r * .35, r * .35), '#fff', .9); }
  g.restore();
}
/** Clip to everything above the waterline while drawing `fn` (body sinking into or rising from water). */
function aboveWater(g, wl, fn){ g.save(); g.beginPath(); g.rect(-260, -320, 520, 320 + wl); g.clip(); fn(); g.restore(); }
/** A ring of foam blobs churning around (x, y); ph 0..1 drifts them. Sizes come from the seed so frames are stable. */
function foam(g, x, y, rx, ry, ph, n = 10, seed = 1, col = '#eafcff'){
  const R = rng(seed);
  for (let i = 0; i < n; i++){ const a = (i / n + ph * .15) * TAU, wob = 1 + Math.sin(ph * TAU * 2 + i * 1.7) * .12, px = x + Math.cos(a) * rx * wob, py = y + Math.sin(a) * ry * wob, r = 2 + R() * 2.6, al = .55 + R() * .3;
    S.dot(g, E(px, py, r, r * .75), col, al); S.dot(g, E(px - r * .3, py - r * .3, r * .35, r * .3), '#fff', al); }
}
/** A pointed spike with its base at (x, y), pointing along angle a. */
function spike(g, x, y, a, len, w, c, mat = 'horn'){ S.part(g, PL([[x - Math.sin(a) * w, y + Math.cos(a) * w], [x + Math.sin(a) * w, y - Math.cos(a) * w], [x + Math.cos(a) * len, y + Math.sin(a) * len]]), c, { x:x + Math.cos(a) * len * .35, y:y + Math.sin(a) * len * .35, r:len * .5 }, { flat:true, mat, lw:1.2 }); }
/** Glowing cracks across a clip shape (the Twin Tides' full form; the fallen twins' veins and bioluminescent lines). */
function cracks(g, clip, lines, col, w = 1.4, blur = 8){ g.save(); clip(g); g.clip(); g.shadowColor = col; g.shadowBlur = blur; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; for (const pts of lines){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } g.restore(); }

// ---------- nightmare helpers ----------
/** A blood drip hanging from (x, y): a dark string with a fat drop at the end. */
function gore(g, x, y, l, w = 2.2){ S.tube(g, SO([[x, y], [x + .6, y + l * .5], [x + 1, y + l]]), GORE, w); S.dot(g, E(x + 1, y + l + 1.6, w * .85, w * 1.05), GOREL.base, .95); S.dot(g, E(x + .4, y + l + 1, w * .3, w * .3), '#ff9aa0', .8); }
/** A clump of branching red coral growing out of (x, y). */
function coral(g, x, y, r, seed){ const R = rng(seed); for (let i = 0; i < 3; i++){ const a = -Math.PI / 2 + (i - 1) * .75 + (R() - .5) * .4, L = r * (1 + R() * .7), ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
    S.tube(g, SO([[x, y], [x + Math.cos(a) * L * .5 + (R() - .5) * 3, y + Math.sin(a) * L * .5], [ex, ey]]), CORAL, 2.6); S.dot(g, E(ex, ey, 1.5, 1.5), CORAL.light, .9); if (R() < .6){ const b = a + (R() - .5) * 1.4; S.tube(g, SO([[x + Math.cos(a) * L * .5, y + Math.sin(a) * L * .5], [x + Math.cos(a) * L * .5 + Math.cos(b) * L * .45, y + Math.sin(a) * L * .5 + Math.sin(b) * L * .45]]), CORAL, 1.8); } }
  S.part(g, E(x, y, r * .55, r * .42), CORAL, { x, y, r:r * .55 }, { flat:true, mat:'stone', noEdge:true }); }
/** Frost: a cluster of ice crystals growing out of (x, y) in direction `dir` (default up), with a cold glow. */
function frost(g, x, y, r, seed, dir = -Math.PI / 2){ const R = rng(seed); g.save(); g.shadowColor = LUME; g.shadowBlur = 5;
  for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * .34 + (R() - .5) * .3, L = r * (.5 + R() * 1.1) * (i === 1 || i === 2 ? 1.25 : .8), w = 1 + R() * .9; S.part(g, PL([[x - Math.sin(a) * w, y + Math.cos(a) * w], [x + Math.sin(a) * w, y - Math.cos(a) * w], [x + Math.cos(a) * L, y + Math.sin(a) * L]]), ICE, { x:x + Math.cos(a) * L * .4, y:y + Math.sin(a) * L * .4, r:L * .5 }, { flat:true, mat:'gel', lw:.8, noEdge:true }); }
  g.restore(); S.dot(g, E(x, y, r * .35, r * .3), '#eaf8ff', .8); }
/** Bioluminescent dots: a glowing cold-blue point with a white core at each point. */
function lume(g, pts, r = 1.6, k = 1){ g.save(); g.shadowColor = LUME; g.shadowBlur = 7 * k; for (const [x, y] of pts){ g.fillStyle = rgba(LUME, .95); ell(g, x, y, r, r); g.fill(); } g.restore(); for (const [x, y] of pts){ g.fillStyle = 'rgba(255,255,255,.85)'; ell(g, x, y, r * .45, r * .45); g.fill(); } }
/** Sound rings for the Blood twin's siren song: red arcs fanning out from (x, y). */
function song(g, x, y, k){ if (k <= 0) return; g.save(); g.lineCap = 'round'; g.shadowColor = '#ff3a26'; g.shadowBlur = 12;
  for (let i = 0; i < 3; i++){ const p = (k * 1.4 + i * .33) % 1, r = 10 + p * 46; g.strokeStyle = `rgba(255,90,70,${(1 - p) * .95 * Math.min(1, k * 3)})`; g.lineWidth = 2.8 - p; g.beginPath(); g.arc(x, y, r, -Math.PI * .34, Math.PI * .34); g.stroke(); g.beginPath(); g.arc(x, y, r, Math.PI * .66, Math.PI * 1.34); g.stroke(); }
  g.restore(); }

// ---------- Twin Tides: an armoured sea serpent rearing out of the sea row ----------
// F is the form: TT1 (level 10), TT2 (level 20: bigger, darker, more spikes, torn fins, cracked glowing plates),
// or the fallen twins (full-form size; `fallen` names the twin and picks its sea, growths and gore).
const TT1 = { body:pal('#1f5d68'), dark:pal('#143f48'), plate:pal('#2c7682'), fin:pal('#1b636c'), belly:pal('#6c9890'), horn:pal('#cfd4c4'), eye:'#5ee6ec', glow:11, crack:0, spikes:4, scale:1, sea:SEA0 },
  TT2 = { body:pal('#163c48'), dark:pal('#0e2a32'), plate:pal('#1e5460'), fin:pal('#0f3d46'), belly:pal('#45696a'), horn:pal('#b9bfb0'), eye:'#8afcff', glow:18, crack:1, spikes:6, scale:1.12, sea:SEA0 },
  TTBLOOD = { body:pal('#7c0e1c'), dark:pal('#420810'), plate:pal('#a8222c'), fin:pal('#560a14'), belly:pal('#a65450'), horn:pal('#d4c4a8'), eye:'#ff3a26', glow:20, crack:1, spikes:7, scale:1.12, sea:SEABLOOD, fallen:'blood', vein:'#ff5a40' },
  TTBLUE = { body:pal('#0c1a3a'), dark:pal('#050c1e'), plate:pal('#163058'), fin:pal('#0a1e40'), belly:pal('#2a4a70'), horn:pal('#c6dcec'), eye:'#7af0ff', glow:20, crack:1, spikes:8, scale:1.12, sea:SEABLUE, fallen:'blue', vein:LUME };
function crSample(pts, n){ const out = [], m = pts.length; for (let i = 0; i < m - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, m - 1)]; for (let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[m - 1]); return out; }
/** A tapered ribbon along a spline: returns { path, left, right, centre }. */
function ribbon(pts, wf, n = 6){ const c = crSample(pts, n), L = [], R = []; for (let i = 0; i < c.length; i++){ const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = wf(i / (c.length - 1)); L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); } const poly = [...L, ...R.slice().reverse()]; poly[0][2] = 1; poly[L.length - 1][2] = 1; poly[L.length][2] = 1; poly[poly.length - 1][2] = 1; return { path:SM(poly, .5), left:L, right:R, centre:c }; }
function serpentHead(g, F, jaw, spray, flare = 0){
  const C = F.body, J = jaw * 18, big = F.crack ? 8 : 0, FB = F.fallen === 'blood', FU = F.fallen === 'blue', FN = FB || FU;
  // horns curving back from the brow (the full form grows a second, smaller pair; the Blue twin's are longer and frosted)
  const hl = FU ? 10 : 0;
  for (const s of [-1, 1]){ const h = SM([[s * 18, -22], [s * 30, -36], [s * 42, -52 - big - hl], [s * 45, -46 - big - hl], [s * 36, -32], [s * 26, -18]], .8); S.part(g, h, F.horn, { x:s * 32, y:-36, r:16 }, { mat:FB ? 'bone' : 'horn', hx:s * 30 - 4, hy:-40 }); if (F.crack) spike(g, s * 27, -14, s * .75 - Math.PI / 2, 14, 3, F.horn, FB ? 'bone' : 'horn');
    if (FU){ frost(g, s * 41, -50 - hl, 5, 31 + s, -Math.PI / 2 + s * .5); S.tube(g, SO([[s * 44, -44 - hl], [s * 45, -34 - hl]]), ICE, 2); S.dot(g, E(s * 45, -32 - hl, 1.4, 1.8), '#eaf8ff', .9); }
    if (FB) gore(g, s * 36, -30, 6, 1.8); }
  // spiked crest running back over the skull (the Blood twin wears a crown of bone instead; the Blue twin's spines are longer)
  if (FB){ const band = SM([[-32, -18], [-30, -26], [-16, -31], [0, -33], [16, -31], [30, -26], [32, -18], [20, -24], [0, -27], [-20, -24]], .7); S.part(g, band, BONE, { x:0, y:-24, r:32 }, { flat:true, mat:'bone', lw:1.2 });
    for (let i = 0; i < 7; i++){ const t = (i + .5) / 7, x = -26 + t * 52, len = 11 + Math.sin(t * Math.PI) * 15; spike(g, x, -27, -Math.PI / 2 + (x / 26) * .55, len, 3.2, BONE, 'bone'); }
    S.dot(g, E(0, -30, 3, 3), '#2a0408', .9); g.save(); g.shadowColor = F.eye; g.shadowBlur = 8; S.dot(g, E(0, -30, 1.8, 1.8), F.eye, .95); g.restore(); }
  else for (let i = 0; i < F.spikes; i++){ const t = (i + .5) / F.spikes, x = -18 + t * 36, len = (14 + Math.sin(t * Math.PI) * 12) * (FU ? 1.5 : 1); spike(g, x, -26, -Math.PI / 2 + (x / 18) * .4, len, 3.2, F.fin); if (FU) S.dot(g, E(x - Math.sin((x / 18) * .4) * len * .9, -26 - Math.cos((x / 18) * .4) * len * .9, 1.1, 1.1), '#eaf8ff', .9); }
  // torn cheek fins (the Blood twin's are shredded and bleeding, the Blue twin's longer with glowing rays)
  for (const s of [-1, 1]){
    const fin = FB ? SM([[s * 26, -6], [s * 44, -18], [s * 48, -8, 1], [s * 60, -16, 1], [s * 53, -4, 1], [s * 64, 2, 1], [s * 50, 6, 1], [s * 58, 14, 1], [s * 46, 12, 1], [s * 48, 24, 1], [s * 38, 16, 1], [s * 26, 16]], .7)
      : FU ? SM([[s * 26, -6], [s * 46, -20], [s * 56, -14, 1], [s * 68, -18, 1], [s * 62, -4, 1], [s * 72, 4, 1], [s * 60, 10, 1], [s * 58, 24, 1], [s * 26, 16]], .7)
      : SM([[s * 26, -6], [s * 44, -18], [s * 50, -10, 1], [s * 58, -14, 1], [s * 55, -2, 1], [s * 60, 4, 1], [s * 52, 10, 1], [s * 48, 20, 1], [s * 26, 16]], .7);
    S.part(g, fin, F.fin, { x:s * 42, y:2, r:16 }, { flat:true, mat:'scaly' });
    if (FU) cracks(g, fin, [-.55, -.2, .15, .5].map(a => [[s * 28, 4], [s * 28 + Math.cos(a) * s * 38, 2 + Math.sin(a) * 30]]), F.vein, 1.1, 6);
    else for (const a of [-.5, -.1, .3]) S.ln(g, [[s * 28, 4], [s * 28 + Math.cos(a) * s * 26, 2 + Math.sin(a) * 22]], F.dark, 1.2, .5);
    if (FB){ gore(g, s * 56, 14, 7, 1.8); gore(g, s * 62, 3, 5, 1.5); }
  }
  // the head: broad and flat under a heavy brow ridge
  const head = SM([[-34, -6], [-36, 8], [-30, 16], [-24, 20], [0, 24], [24, 20], [30, 16], [36, 8], [34, -6], [24, -24], [0, -30], [-24, -24]]);
  S.part(g, head, C, { x:0, y:-4, r:34 }, { mat:'scaly', hx:-14, hy:-18 });
  const brow = SM([[-34, -8], [-22, -18], [0, -22], [22, -18], [34, -8], [26, -4], [0, -8], [-26, -4]], .8); S.part(g, brow, FB ? SKULL : F.plate, { x:0, y:-12, r:34 }, { flat:true, mat:FB ? 'bone' : 'stone', lw:1.4 });
  if (FB){ S.ln(g, [[-14, -20], [-8, -13], [-10, -8]], SKULL, 1.1, .7); S.ln(g, [[10, -21], [16, -14]], SKULL, 1.1, .7); S.ln(g, [[2, -22], [-1, -16]], SKULL, .9, .6); coral(g, -27, -11, 5, 41); coral(g, 24, -13, 4, 43); barnacle(g, -30, 8, 2.6); S.dot(g, E(-29, 7, 1.2, 1), '#4a0810', .9); }
  else if (FU){ frost(g, -27, -12, 5, 51); frost(g, 23, -14, 4.5, 53, -Math.PI / 2 + .4); lume(g, [[-24, 14], [-12, 19], [12, 19], [24, 14], [-30, -2], [30, -2]], 1.4); }
  else { barnacle(g, -26, -12, 3.5); barnacle(g, 22, -14, 3); barnacle(g, -30, 6, 2.6); }
  if (F.crack) cracks(g, head, [[[-20, -20], [-12, -10], [-16, 2]], [[14, -22], [22, -10], [18, 0]], [[-4, -28], [2, -20]]], F.vein || F.eye);
  if (FB) wet(g, head, { x:0, y:-4, r:34 }, [[-33, 12, 7], [33, 10, 6]], 'rgba(255,170,160,.32)', GORE, GOREL.base);
  else wet(g, head, { x:0, y:-4, r:34 }, [[-34, 12, 6], [33, 10, 5]]);
  // narrow glowing eyes under the brow (the fallen twins' flare up when they use their power)
  const gk = 1 + flare * 1.3;
  for (const s of [-1, 1]){ const sock = SM([[s * 6, -6], [s * 26, -12], [s * 31, -3], [s * 24, 2], [s * 8, 0]], .6); S.dot(g, sock, FB ? '#1a0306' : FU ? '#030810' : '#06161a');
    if (FN && flare > 0){ g.save(); g.globalAlpha *= flare * .55; const hg = g.createRadialGradient(s * 18, -5, 0, s * 18, -5, 22); hg.addColorStop(0, F.eye); hg.addColorStop(1, rgba(F.eye, 0)); g.fillStyle = hg; ell(g, s * 18, -5, 22, 16); g.fill(); g.restore(); }
    g.save(); g.shadowColor = F.eye; g.shadowBlur = F.glow * gk; g.fillStyle = F.eye; ell(g, s * 18, -5, 8 + (FN ? 1 : 0), 2.6 + flare * 1.6, -s * .22); g.fill(); g.restore();
    S.dot(g, E(s * 18, -5, 1.4 - flare * .6, 2.6 + flare * 1.6, -s * .22), FB ? '#1a0306' : '#06161a', .9); S.dot(g, E(s * 15, -6.5, 1.2, .8), '#fff', .8);
    if (FB) gore(g, s * 25, -1, 6 + flare * 4, 1.5);   // blood tears
    if (FU && flare > 0){ g.save(); g.shadowColor = F.eye; g.shadowBlur = 10; g.strokeStyle = rgba(F.eye, flare * .9); g.lineWidth = 1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 26, -6); g.lineTo(s * (34 + flare * 10), -12 - flare * 6); g.stroke(); g.restore(); } }
  for (const s of [-1, 1]) S.dot(g, E(s * 7, 8, 2.2, 1.4, s * .4), F.dark.deep, .85);   // nostrils
  if (FU) { g.save(); g.globalAlpha *= .35 + flare * .4; for (const s of [-1, 1]) S.dot(g, E(s * 9, 4, 4, 2.4, s * .3), LUME, .5); g.restore(); }
  // the long jaw: chin plate dropping with J, dark cavity, fangs above and below
  const lip = x => 14 + (1 - (x / 30) ** 2) * 8;
  const chin = SM([[-30, lip(-30) + J], [-31, 20 + J], [-18, 30 + J], [0, 33 + J], [18, 30 + J], [31, 20 + J], [30, lip(30) + J], [15, lip(15) + J], [0, lip(0) + J], [-15, lip(-15) + J]], .7);
  S.part(g, chin, C, { x:0, y:24 + J, r:30 }, { mat:'scaly', hx:-14, hy:22 + J });
  if (FU) lume(g, [[-22, 26 + J], [-11, 30 + J], [0, 31 + J], [11, 30 + J], [22, 26 + J]], 1.2);
  const cav = SM([[-30, lip(-30)], [-15, lip(-15)], [0, lip(0)], [15, lip(15)], [30, lip(30)], [30, lip(30) + 2 + J * .6, 1], [15, lip(15) + 3 + J, 1], [0, lip(0) + 3 + J, 1], [-15, lip(-15) + 3 + J, 1], [-30, lip(-30) + 2 + J * .6, 1]], .6); S.dot(g, cav, FB ? '#2a0408' : FU ? '#040a18' : '#0b2228');
  if (jaw > .3) S.dot(g, E(0, lip(0) + 2 + J * .7, 10, 2 + J * .25), FB ? '#d02838' : FU ? '#2a5a90' : '#b03a4a', .8);
  if (FB){   // a maw of needle teeth: many long thin yellowed fangs, blood strings between the jaws
    const NT = '#efe4cc';
    for (let i = 0; i < 11; i++){ const x = -27 + i * 5.4, len = 6 + (1 - (x / 30) ** 2) * 5 + (i % 2) * 2; S.dot(g, PL([[x - 1.4, lip(x) - 1], [x + 1.4, lip(x) - 1], [x + .3, lip(x) + len]]), NT); }
    for (let i = 0; i < 10; i++){ const x = -24.5 + i * 5.4, y = lip(x) + 3 + J * .92, len = 5 + (1 - (x / 30) ** 2) * 4 + ((i + 1) % 2) * 2; S.dot(g, PL([[x - 1.3, y + 1], [x + 1.3, y + 1], [x - .2, y - len]]), NT); }
    if (J > 4){ g.strokeStyle = 'rgba(150,12,24,.85)'; g.lineWidth = 1.1; g.lineCap = 'round'; for (const x of [-16, -4, 9, 20]){ g.beginPath(); g.moveTo(x, lip(x) + 2); g.quadraticCurveTo(x + 1.5, lip(x) + 2 + J * .7, x + 2, lip(x) + 2 + J * .9); g.stroke(); } }
    for (const [x, l] of [[-20, 7], [-6, 10], [10, 6], [24, 8]]) gore(g, x, 28 + J + (1 - (x / 30) ** 2) * 4, l + J * .25, 2);
  } else if (FU){   // icy translucent fangs with two long tusks, frost on the chin
    const IT = '#e2f6ff';
    for (const [x, len] of [[-24, 13], [-14, 7], [-6, 6], [6, 6], [14, 7], [24, 13]]) S.dot(g, PL([[x - 2.4, lip(x) - 1], [x + 2.4, lip(x) - 1], [x + .4, lip(x) + len]]), IT);
    for (const [x, len] of [[-19, 7], [-9, 5], [0, 5], [9, 5], [19, 7]]){ const y = lip(x) + 3 + J * (x === 0 ? 1 : .9); S.dot(g, PL([[x - 2.2, y + 1], [x + 2.2, y + 1], [x - .3, y - len]]), IT); }
    frost(g, -22, 30 + J, 5, 61, Math.PI / 2 + .3); frost(g, 20, 31 + J, 4.5, 63, Math.PI / 2 - .3);
  } else {
    for (const [x, len] of [[-24, 9], [-14, 6], [-6, 5], [6, 5], [14, 6], [24, 9]]) S.dot(g, PL([[x - 2.2, lip(x) - 1], [x + 2.2, lip(x) - 1], [x + .4, lip(x) + len]]), TOOTH);
    for (const [x, len] of [[-19, 6], [-9, 4], [0, 4], [9, 4], [19, 6]]){ const y = lip(x) + 3 + J * (x === 0 ? 1 : .9); S.dot(g, PL([[x - 2, y + 1], [x + 2, y + 1], [x - .3, y - len]]), TOOTH); }
  }
  S.stroke(g, SO([[-30, lip(-30)], [-15, lip(-15)], [0, lip(0)], [15, lip(15)], [30, lip(30)]]), F.dark, 1.6, .85);
  if (spray > 0) splash(g, 0, lip(0) + J, spray, 11, 9, 30, F.sea.drop);
  if (FB && flare > 0) song(g, 0, lip(0) + J * .5, flare);
}
/** The original Twin Tides (P.variant null or 'form2'), plus the fallen twins when P.variant === 'fallen' and P.twin is 'blood' or 'blue'. */
export function fallenTwintides(g, P = {}){
  const F = P.variant === 'fallen' ? (P.twin === 'blue' ? TTBLUE : TTBLOOD) : P.variant === 'form2' ? TT2 : TT1, WL = 50, idle = P.idle, bolt = P.bolt, col = P.collapse ?? 0, FB = F.fallen === 'blood', FU = F.fallen === 'blue';
  const sway = idle == null ? 0 : Math.sin(idle * TAU), breathe = idle == null ? 0 : Math.cos(idle * TAU);
  let rear = 0, lunge = 0, jaw = .12, spray = 0, flare = 0, whirl = 0;
  if (bolt != null){ if (bolt < .4){ rear = bolt / .4; jaw = .12 + rear * .4; } else if (bolt < .6){ const k = (bolt - .4) / .2; rear = 1 - k; lunge = k; jaw = .5 + k * .5; spray = k * .6; } else { const k = (bolt - .6) / .4; lunge = 1 - k; jaw = 1 - k * .88; spray = .6 + k * .4; } }
  // the fallen twins' power: the Blood twin sings (head up, maw open, eyes flare), the Blue twin opens a whirlpool (head low, eyes flare, the sea spins)
  if (P.skill != null && F.fallen){ const k = Math.sin(Math.min(1, Math.max(0, P.skill)) * Math.PI); flare = k; if (FB){ rear = Math.max(rear, k * .55); jaw = Math.max(jaw, .12 + k * .6); } else { lunge = Math.max(lunge, k * .25); whirl = k; jaw = Math.max(jaw, .12 + k * .2); } }
  const sink = col * 210, ph = idle ?? bolt ?? P.skill ?? col, SEA = F.sea;
  water(g, 0, WL + 2, 78, 15, ph * .9, .7, SEA, whirl);
  if (FB){ S.dot(g, E(-12 + sway * 3, WL + 3, 34, 6.5, .05), '#4a0410', .5); S.dot(g, E(44, WL + 5, 16, 3.5), '#4a0410', .4); }   // blood slicks spreading on the sea
  aboveWater(g, WL, () => {
    g.translate(0, WL); g.scale(F.scale, F.scale); g.translate(0, -WL + sink);
    // a coil of the body breaking the surface to the right: plated, spined, barnacled
    const coil = SM([[16, WL + 8], [22, 30 + breathe * 2], [42, 14 + breathe * 3], [64, 20 + breathe * 2], [76, WL + 8]], .8);
    for (const [x, y] of F.crack ? [[28, 26], [36, 19], [44, 14], [52, 15], [60, 20]] : [[30, 24], [42, 15], [54, 17]]) spike(g, x, y + breathe * 2, -Math.PI / 2 + (x - 42) * .03, FU ? 21 : 15, 4, FB ? BONE : F.fin, FB ? 'bone' : 'horn');
    S.part(g, coil, F.body, { x:46, y:32, r:28 }, { mat:'scaly', hx:34, hy:20 });
    g.save(); coil(g); g.clip(); for (const x of [28, 40, 52, 64]) S.ln(g, [[x, 0], [x - 4, 60]], F.dark, 2.2, .6); if (F.crack) cracks(g, coil, [[[34, 26], [40, 34], [36, 44]], [[56, 24], [60, 36]]], F.vein || F.eye); g.restore();
    S.part(g, SM([[26, WL + 8], [30, 36 + breathe * 2], [44, 28 + breathe * 3], [58, 32 + breathe * 2], [64, WL + 8]], .8), F.belly, { x:46, y:40, r:18 }, { flat:true, noEdge:true, mat:'scaly' });
    if (FB){ coral(g, 62, 30, 5, 71); barnacle(g, 34, 36, 2.6); gore(g, 46, 40 + breathe * 2, 7); }
    else if (FU){ frost(g, 62, 30, 5, 73); lume(g, [[30, 34 + breathe * 2], [40, 30 + breathe * 3], [50, 30 + breathe * 3], [60, 34 + breathe * 2]], 1.3); }
    else { barnacle(g, 62, 30, 3); barnacle(g, 34, 36, 2.6); }
    // the neck: a thick tapered ribbon rising from the water
    const hb = [10 - rear * 22 + lunge * 18 + sway * 3, -66 - rear * 8 + lunge * 14], mid = [-40 + sway * 6 - rear * 6, 2 + breathe * 2], mid2 = [-2 + sway * 4 - rear * 10 + lunge * 6, -34 - rear * 4 + lunge * 6];
    const spine = [[-8, WL + 12], [-30 + sway * 3, 32], mid, mid2, hb];
    const rb = ribbon(spine, t => 27 - t * 8, 6);
    // dorsal spines with a torn membrane along the outer edge (longer on the Blue twin, bone on the Blood twin)
    const sl = FU ? 1.4 : 1;
    for (let i = 3; i < rb.left.length - 3; i += 2){ const a = rb.left[i], b = rb.left[i + 2], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = dy / l, ny = -dx / l, ang = Math.atan2(ny, nx) + .25;
      const mem = FB ? PL([a, [mx + nx * 5 + dx / l * 1, my + ny * 5 + dy / l * 1], [mx + nx * 3 + dx / l * 3, my + ny * 3 + dy / l * 3], [mx + nx * 10 + dx / l * 5, my + ny * 10 + dy / l * 5], b]) : PL([a, b, [mx + nx * 9 * sl + dx / l * 5, my + ny * 9 * sl + dy / l * 5]]);
      S.part(g, mem, F.fin, { x:mx + nx * 4, y:my + ny * 4, r:7 }, { flat:true, mat:'scaly', lw:1.2 });
      if (FU) cracks(g, mem, [[a, [mx + nx * 8 + dx / l * 4, my + ny * 8 + dy / l * 4]]], F.vein, 1, 5);
      const L1 = (F.crack ? 22 : 17) * sl; spike(g, mx + nx * 2, my + ny * 2, ang, L1, 3.4, FB ? BONE : F.fin, FB ? 'bone' : 'horn'); if (F.crack) spike(g, a[0] + nx * 2, a[1] + ny * 2, ang - .3, 11 * sl, 2.2, FB ? BONE : F.fin, FB ? 'bone' : 'horn');
      if (FU) S.dot(g, E(mx + nx * 2 + Math.cos(ang) * L1 * .92, my + ny * 2 + Math.sin(ang) * L1 * .92, 1.2, 1.2), '#eaf8ff', .9); }
    S.part(g, rb.path, F.body, { x:-14, y:-10, r:64 }, { mat:'scaly', flat:true }); S.dot(g, E(-30, -22, 5, 2.4, -.9), '#fff', FB ? .3 : .45);
    // armour plates banded across the neck, barnacles along the inner edge
    g.save(); rb.path(g); g.clip();
    for (let i = 1; i < rb.centre.length - 2; i += 2){ const a = rb.left[i], b = rb.right[i], a2 = rb.left[i + 2], b2 = rb.right[i + 2], cx = (a[0] + b[0] + a2[0] + b2[0]) / 4, cy = (a[1] + b[1] + a2[1] + b2[1]) / 4;
      if (i % 4 === 1) S.part(g, PL([a, a2, b2, b]), F.plate, { x:cx, y:cy, r:24 }, { flat:true, noEdge:true, mat:FB ? 'skin' : 'scaly' }); S.ln(g, [a, b], FB ? GORE : F.dark, 2.2, .7); S.ln(g, [[a[0] + (b[0] - a[0]) * .1, a[1] + (b[1] - a[1]) * .1 + 1.5], [b[0] - (b[0] - a[0]) * .1, b[1] - (b[1] - a[1]) * .1 + 1.5]], { deep:'#ffffff' }, 1, FB ? .14 : .22); }
    if (F.crack) cracks(g, rb.path, [[rb.centre[5], [rb.centre[6][0] + 6, rb.centre[6][1]], rb.centre[8]], [[rb.centre[12][0] - 5, rb.centre[12][1]], rb.centre[14], [rb.centre[15][0] + 4, rb.centre[15][1]]], [rb.centre[19], [rb.centre[20][0] + 5, rb.centre[20][1] - 2]]], F.vein || F.eye);
    g.restore();
    if (FB){ for (const i of [4, 10, 16]){ const p = rb.right[i], c = rb.centre[i]; coral(g, p[0] + (c[0] - p[0]) * .2, p[1] + (c[1] - p[1]) * .2, 4, 81 + i); } for (const i of [7, 13, 19]){ const p = rb.right[i]; gore(g, p[0] - 2, p[1], 6 + (i % 3) * 2); } }
    else if (FU){ for (const i of [4, 10, 16]){ const p = rb.right[i], c = rb.centre[i]; frost(g, p[0] + (c[0] - p[0]) * .2, p[1] + (c[1] - p[1]) * .2, 4, 91 + i, Math.atan2(p[1] - c[1], p[0] - c[0])); } lume(g, [3, 6, 9, 12, 15, 18, 21].map(i => { const p = rb.right[i], c = rb.centre[i]; return [p[0] + (c[0] - p[0]) * .32, p[1] + (c[1] - p[1]) * .32]; }), 1.5, 1.2); }
    else for (const i of [4, 10, 16]){ const p = rb.right[i], c = rb.centre[i]; barnacle(g, p[0] + (c[0] - p[0]) * .2, p[1] + (c[1] - p[1]) * .2, 3); }
    const belly = ribbon(spine, t => 9 - t * 3, 6); S.part(g, belly.path, F.belly, { x:-14, y:-10, r:64 }, { flat:true, noEdge:true, mat:'scaly' });
    g.save(); belly.path(g); g.clip(); for (let i = 2; i < belly.centre.length - 2; i += 2){ const c = belly.centre[i]; S.ln(g, [[c[0] - 9, c[1]], [c[0] + 9, c[1]]], F.dark, 1.2, .4); } g.restore();
    if (FB) wet(g, rb.path, { x:-20, y:-10, r:40 }, [], 'rgba(255,160,150,.22)');
    S.contact(g, coil, 22, 36, 14, 10, .35);
    // the head, facing the player, rearing back or lunging forward
    g.save(); g.translate(hb[0], hb[1] - 14); g.rotate(-rear * .3 + lunge * .35 + sway * .04); g.scale(1 + lunge * .1, 1 + lunge * .1); serpentHead(g, F, jaw, spray, flare); g.restore();
    S.contact(g, rb.path, hb[0], hb[1] - 4, 22, 8, .35);
  });
  water(g, 0, WL + 2, 78, 15, ph * .9 + .5, .55, SEA, whirl * .6);
  // foam churning where the serpent breaks the surface
  foam(g, -6 * F.scale, WL + 4, 30 * F.scale, 7, ph, 12, 3, SEA.foam); foam(g, 46 * F.scale, WL + 4, 28 * F.scale, 6, ph + .3, 10, 5, SEA.foam);
  if (col > 0){ splash(g, 0, WL, Math.min(1, col * 1.6), 13, 14, 60, SEA.drop); splash(g, 40, WL, Math.max(0, col * 1.8 - .5), 17, 10, 40, SEA.drop);
    if (col > .6){ const R = rng(21); for (let i = 0; i < 6; i++){ const x = -40 + R() * 80, y = WL - 4 - (col - .6) * 40 * R(), r = 2 + R() * 2.5; g.strokeStyle = SEA.bubble; g.lineWidth = 1; ell(g, x, y, r, r); g.stroke(); } } }
}
/** The original drawing, kept under its own name so the preview can show it side by side. */
export const twintides = fallenTwintides;

// ---------- registry entry (same shape as src/engine/render/chars/w5.js) ----------
// box widened from the original { x:-110, y:-186, w:220, h:256 } for the Blue twin's longer horns, crest and dorsal spines and the Blood twin's crown.
export const FALLEN = { key:'twintides', name:'The Fallen Twin Tides', draw:fallenTwintides, scale:.62, dy:-1, box:{ x:-124, y:-204, w:248, h:274 },
  variants:{ form2:true, fallen:true }, twins:['blood', 'blue'],
  clips:{ walk:{ n:8, fps:6, pose:t => ({ idle:t }) }, bolt:{ n:8, fps:14, once:true, pose:t => ({ bolt:t }) }, collapse:{ n:6, fps:12, once:true, pose:t => ({ collapse:t }) },
    skill:{ n:8, fps:12, once:true, pose:t => ({ skill:t }) } }, still:{ idle:.25 } };
