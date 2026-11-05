// ---------- Nightmare Foggy Hollow: Plague Doctor 2 and the Reaper (Release 5) ----------
// Ported from the design archive (Toy Plastic, docs/ART_BRIEF.md).
//   rotdoctor: docs/archive/nightmare-monsters/vampires-doctor/nm_doctor.js, the Rot Doctor. The same stooped walk and censer swing as the Plague
//              Doctor, but the coat has rotted to a tattered, mould-spotted green-black with ooze dripping from the hem; the mask is cracked and the
//              beak broken; the lenses burn with ghostfire; the censer is a skull lantern pouring ghostfire; poison vials ride the strap; a carrion
//              crow with a ghostfire eye perches on the ragged hat brim; poison fog curls round the shoes. (The archive's plain-doctor look and its
//              heal clip are left out: Plague Doctor 2 does not heal.) Clips: walk, chew.
//   reaper:    docs/archive/nightmare-monsters/spirits/spirits.js, the Reaper: a hooded skeleton in a tattered plum-black robe with ember eyes and a
//              long scythe. It has no feet: it glides, the hem fraying into smoke. Its `chew` clip IS the archive's `reap` sweep, looping (owner:
//              the Reaper's scythe swing is its chewing at the fence, there is no pause between swings). The archive's single-hack `chew` pose is
//              still drawn below but not baked. Clips: walk, chew (= reap).
// Drawn around (0,0) in drawing units with the feet near y = 50. Every clip is baked by render/anim.js, so the glows are fine; nothing random
// per frame (rng(seed) only).

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';


const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// Reaper
const ROBE = pal('#3d3550'), ROBED = pal('#262033'), HOODIN = '#0b0910', RBONE = pal('#efe6d2'), SNATH = pal('#6e4a30'), BLADE = pal('#c3cdd9'),
  COLLAR = pal('#5a5f6e'), GRIP = pal('#8a2f3a'), ROPE = pal('#9a8458'), EMBER = '#ffb03a', REAPG = '#d8c8ff', SMOKE = '#4e4466',
  PUMP = pal('#f08a24'), PSTEM = pal('#5f7a2c');

function puff(g, x, y, r, a = .7, col = '#e6f4fb', core = '#ffffff'){
  const gr = g.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r); gr.addColorStop(0, rgba(core, a)); gr.addColorStop(.55, rgba(col, a * .75)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; ell(g, x, y, r, r * .9); g.fill();
}
function tatters(x1, x2, y, n, ph, depth = 10){
  const pts = []; for (let i = 0; i <= n; i++){ const t = i / n, x = x1 + (x2 - x1) * t, low = i % 2 === 0; pts.push([x, y + (low ? Math.sin(ph + i * 1.3) * 3 : -depth + Math.sin(ph + i) * 2), 1]); } return pts;
}
function crSample(pts, n){ const out = [], m = pts.length; for (let i = 0; i < m - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, m - 1)]; for (let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[m - 1]); return out; }
/** A tapered ribbon along a spline: closed path through both sides. */
function ribbon(pts, wf, n = 6){ const c = crSample(pts, n), L = [], R = []; for (let i = 0; i < c.length; i++){ const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = wf(i / (c.length - 1)); L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); } return SM([...L, ...R.slice().reverse()], .5); }
function bonyHand(g, x, y, c, dir, len = 9, w = 2.6, palm = 5.5){
  for (let i = -1; i <= 1; i++){ const a = dir + i * .42; S.tube(g, SO([[x, y], [x + Math.cos(a) * len * .6, y + Math.sin(a) * len * .6], [x + Math.cos(a + i * .3) * len, y + Math.sin(a + i * .3) * len]]), c, w); }
  S.part(g, E(x, y, palm, palm * .9), c, { x, y, r:palm }, { flat:true, mat:'bone' });
}
/** Bony fist closed round a pole running along `dir` (knuckles toward the viewer). */
function gripHand(g, x, y, c, dir, r = 5){
  S.part(g, E(x, y, r, r * 1.05, dir), c, { x, y, r }, { flat:true, mat:'bone' });
  for (let i = -1; i <= 1; i++){ const kx = x + Math.cos(dir) * i * r * .62 + Math.cos(dir + Math.PI / 2) * r * .55, ky = y + Math.sin(dir) * i * r * .62 + Math.sin(dir + Math.PI / 2) * r * .55;
    S.part(g, E(kx, ky, r * .36, r * .32), c, { x:kx, y:ky, r:r * .36 }, { flat:true, mat:'bone', lw:1 }); }
}

const SL = 86;   // snath length
/** The scythe in its own frame: grip at (0,0), the snath runs up to (0,-SL), the blade sweeps out toward -x. glow 0..1 lights the blade. */
function scythe(g, glow = 0){
  S.tube(g, SO([[0, 18], [1.6, -SL * .45], [0, -SL]]), SNATH, 5.2);
  S.part(g, E(0, 19, 3.6, 3), COLLAR, { x:0, y:19, r:3.6 }, { flat:true, mat:'metal', lw:1 });
  for (const y of [-26]) S.part(g, RR(-3.8, y - 6, 7.6, 12, 2), GRIP, { x:0, y, r:6 }, { flat:true, mat:'leather', lw:1 });
  const blade = SM([[3, -SL - 3], [-14, -SL - 10], [-38, -SL - 7], [-62, -SL + 16, 1], [-40, -SL + 3], [-18, -SL + 1], [3, -SL + 5]], .8);
  if (glow > 0){ g.save(); g.shadowColor = REAPG; g.shadowBlur = 8 + glow * 14; S.dot(g, blade, REAPG, .5 + glow * .5); g.restore(); }
  S.part(g, blade, BLADE, { x:-30, y:-SL - 2, r:32 }, { mat:'metal', hx:-22, hy:-SL - 6 });
  S.overlay(g, blade, BLADE, { x:-30, y:-SL - 2, r:32 }, .35);
  // honed cutting edge (the inner curve) and a notch
  S.stroke(g, SO([[-60, -SL + 14], [-40, -SL + 3], [-18, -SL + 1], [2, -SL + 4]]), { deep:'#ffffff' }, 1.6, .9);
  S.dot(g, PL([[-28, -SL + 2.2], [-25, -SL - 1.4], [-22, -SL + 1.8]]), BLADE.deep, .7);
  S.part(g, RR(-5, -SL - 8, 10, 13, 2.5), COLLAR, { x:0, y:-SL - 2, r:7 }, { flat:true, mat:'metal', lw:1.2 }); S.rivet(g, 0, -SL - 2, 1.8, COLLAR);
  if (glow > .3){ const a = (glow - .3) / .7; g.save(); g.globalAlpha *= a; g.translate(-60, -SL + 15); g.fillStyle = '#ffffff'; g.shadowColor = REAPG; g.shadowBlur = 10;
    g.beginPath(); for (let i = 0; i < 8; i++){ const ang = i * Math.PI / 4, rr = i % 2 ? 1.6 : 7; g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } g.closePath(); g.fill(); g.restore(); }
}
/** The scythe's frame as an affine matrix: scythe-local x runs along X, local y along Y, the grip sits at (px, py). */
function rotM(px, py, ang, f = 1, sq = 1){ const c = Math.cos(ang), s = Math.sin(ang); return { X:[c, s * sq], Y:[-s * f, c * f * sq], px, py }; }
/** Sweep frame: the snath points along world angle b on a flattened circle (a horizontal swing seen from the front), shortened to L;
 *  the blade hangs perpendicular to it on the downward side, so it leads the swing as it passes in front. */
function sweepM(px, py, b, L){ const d = [Math.cos(b) * L / SL, Math.sin(b) * .38 * L / SL], dl = Math.hypot(d[0], d[1]); let n = [-d[1] / dl, d[0] / dl]; if (n[1] < 0 || (n[1] === 0 && n[0] > 0)) n = [-n[0], -n[1]];
  n = [n[0] * .8 - .2, n[1] * .8 + .25]; const nl = Math.hypot(n[0], n[1]); return { X:[-n[0] / nl * .7, -n[1] / nl * .7], Y:[-d[0], -d[1]], px, py }; }
const lerpM = (A, B, u) => ({ X:[lerp(A.X[0], B.X[0], u), lerp(A.X[1], B.X[1], u)], Y:[lerp(A.Y[0], B.Y[0], u), lerp(A.Y[1], B.Y[1], u)], px:lerp(A.px, B.px, u), py:lerp(A.py, B.py, u) });
function sxf(M, x, y){ return [M.px + M.X[0] * x + M.Y[0] * y, M.py + M.X[1] * x + M.Y[1] * y]; }
function drawScythe(g, M, glow){ g.save(); g.transform(M.X[0], M.X[1], M.Y[0], M.Y[1], M.px, M.py); scythe(g, glow); g.restore(); }
function tinyPumpkin(g, x, y, r){
  for (const [ox, rw] of [[-.45, .6], [.45, .6], [0, .66]]) S.part(g, E(x + ox * r, y, rw * r, r * .82), PUMP, { x:x + ox * r, y, r:r * .8 }, { flat:true, mat:'pumpkin', lw:1 });
  S.part(g, E(x + r * .1, y - r * .9, r * .2, r * .3, .3), PSTEM, { x, y:y - r, r:r * .3 }, { flat:true, lw:.8 });
  g.save(); g.shadowColor = '#ffd060'; g.shadowBlur = 4; S.dot(g, PL([[x - r * .5, y - r * .2], [x - r * .15, y - r * .2], [x - r * .32, y - r * .45]]), '#ffe27a');
  S.dot(g, PL([[x + r * .5, y - r * .2], [x + r * .15, y - r * .2], [x + r * .32, y - r * .45]]), '#ffe27a'); S.dot(g, SM([[x - r * .45, y + r * .15], [x, y + r * .4], [x + r * .45, y + r * .15], [x, y + r * .25]], .8), '#ffe27a'); g.restore();
}

export function reaper(g, P = {}){
  const w = P.walk, ch = P.chew, rp = P.reap;
  const ph = (w ?? ch ?? (rp != null ? rp * .5 : 0)) * TAU;
  const bob = w != null ? Math.sin(ph) * 3.5 : 0, sway = w != null ? Math.sin(ph) * .03 : 0;
  // scythe frame, blade glow, both-hands grip
  const REST = rotM(30, 8, .1 + Math.sin(ph) * .04);
  let M = REST, glow = 0, twoHand = false, hunch = 0, trail = null, beckon = w != null ? Math.sin(ph) : 0;
  if (ch != null){   // hacks the scythe down at the wall in front of it (the snath foreshortens as it tips toward the viewer)
    const k = (1 - Math.cos(ph)) / 2, f = .95 - 1.4 * k * k; M = rotM(22, -4 + k * 6, -.08, f); twoHand = true; hunch = k * .5;
  }
  if (rp != null){   // wind up over the shoulder, one wide sweep across its lane and both neighbours, follow through, settle
    const b0 = -.45, b1 = Math.PI + .45, L = 74, UP = rotM(26, -6, .75), sw = b => sweepM(2, -14, b, L);
    if (rp < .3){ const u = ease(rp / .3); M = lerpM(REST, UP, u); glow = u; hunch = -u * .4; }
    else if (rp < .6){ const u = ease((rp - .3) / .3), b = lerp(b0, b1, u); M = sw(b); glow = 1; hunch = lerp(-.4, .6, u); trail = { b, a:1 }; }
    else if (rp < .8){ const u = (rp - .6) / .2; M = sw(b1); glow = 1 - u * .7; hunch = .6 - u * .2; trail = { b:b1, a:1 - u }; }
    else { const u = ease((rp - .8) / .2); M = lerpM(sw(b1), REST, u); glow = .3 * (1 - u); hunch = .4 * (1 - u); }
    twoHand = true;
    if (trail){ const pts = []; for (let i = 0; i <= 12; i++) pts.push(sxf(sw(lerp(b0, trail.b, i / 12)), -60, -SL + 16)); trail.pts = pts; }
  }
  S.shadow(g, 0, 52, 26, 5);
  // the sweep's ghostly crescent: the path of the blade tip, lit along its length (drawn under the figure)
  if (trail && trail.pts.length > 1){ const pts = trail.pts, N = pts.length - 1;
    g.save(); g.globalAlpha *= trail.a; g.shadowColor = REAPG; g.shadowBlur = 14;
    const rb = ribbon(pts, u => 1 + u * u * 9, 4); const gr = g.createLinearGradient(pts[0][0], pts[0][1], pts[N][0], pts[N][1]); gr.addColorStop(0, rgba(REAPG, 0)); gr.addColorStop(.5, rgba(REAPG, .55)); gr.addColorStop(1, rgba('#ffffff', .95));
    rb(g); g.fillStyle = gr; g.fill(); g.restore();
    g.save(); g.globalAlpha *= trail.a * .8; S.stroke(g, SO(pts), { deep:'#ffffff' }, 1.4, .9); g.restore(); }
  // smoke where the feet should be: dark wisps trailing up the lane behind it
  const tk = (w ?? ch ?? (rp ?? 0)) % 1;
  for (let i = 0; i < 6; i++){ const k = (tk + i / 6) % 1, x = Math.sin(i * 2.3 + k * TAU) * 14 + (i - 2.5) * 5, y = 50 - k * 22; puff(g, x, y, 6 + k * 6, (1 - k) * .38, SMOKE, '#8a7aa8'); }
  g.save(); g.translate(0, bob); g.translate(0, 40); g.rotate(sway + hunch * .05); g.scale(1, 1 - Math.max(0, hunch) * .05); g.translate(0, -40);
  // smoky tails under the robe
  for (const [x, len, s] of [[-18, 16, -1], [-4, 20, 1], [10, 17, -1], [22, 14, 1]]){ const wv = Math.sin(ph + x) * 4;
    const tail = ribbon([[x, 34], [x + s * 3 + wv * .5, 34 + len * .5], [x + s * 6 + wv, 34 + len]], u => 6 * (1 - u) + .4, 4);
    const gr = g.createLinearGradient(0, 34, 0, 36 + len); gr.addColorStop(0, rgba(ROBE.dark, .95)); gr.addColorStop(1, rgba(SMOKE, 0)); tail(g); g.fillStyle = gr; g.fill(); }
  // robe: a bell that frays at the hem
  const hem = tatters(-30, 30, 40, 6, ph, 9);
  const robe = SM([[-14, -16], [-24, -6], [-28, 14], [-31, 34], ...hem, [31, 34], [28, 14], [24, -6], [14, -16]], .8);
  S.part(g, robe, ROBE, { x:0, y:10, r:40 }, { mat:'cloth', hx:-14, hy:-4 }); S.overlay(g, robe, ROBED, { x:0, y:10, r:38 }, .5);
  S.crease(g, SO([[-14, 0], [-18, 20], [-16, 38]]), ROBE, 1.8, .45); S.crease(g, SO([[12, 2], [16, 20], [14, 38]]), ROBE, 1.8, .45); S.crease(g, SO([[-2, 12], [-3, 26], [-1, 38]]), ROBE, 1.4, .35);
  for (const [x, y] of hem.filter((p, i) => i % 2 === 0)) S.thread(g, x, y, x < 0 ? -1 : 1, ROBE);
  // rope belt with a little jack-o'-lantern tied on
  S.tube(g, SO([[-25, 8], [0, 12], [25, 8]]), ROPE, 3.2); S.part(g, E(-8, 11, 3.6, 3), ROPE, { x:-8, y:11, r:3.6 }, { flat:true, lw:1 });
  const pk = w != null ? Math.sin(ph + 1) * 3 : 0; S.ln(g, [[-8, 12], [-10 + pk, 22]], ROPE, 1.2, .9); tinyPumpkin(g, -10 + pk, 26, 5);
  // hood: a big peaked cowl, the peak flopped back
  const hood = SM([[4, -66, 1], [-10, -60], [-24, -48], [-31, -28], [-29, -10], [-18, -1], [0, 2], [18, -1], [29, -10], [31, -28], [26, -46], [14, -58]], .85);
  S.part(g, hood, ROBE, { x:0, y:-28, r:34 }, { mat:'cloth', hx:-14, hy:-46 }); S.overlay(g, hood, ROBED, { x:0, y:-28, r:32 }, .4);
  S.crease(g, SO([[6, -62], [0, -50], [-6, -42]]), ROBE, 1.8, .45);
  S.contact(g, robe, 0, -2, 26, 8, .5);
  S.part(g, SM([[-24, -12], [-25, -32], [-14, -48], [0, -52], [14, -48], [25, -32], [24, -12], [12, -3], [0, -1], [-12, -3]], .9), ROBED, { x:0, y:-24, r:26 }, { flat:true, mat:'cloth', noEdge:true });
  const cave = SM([[-20, -13], [-22, -31], [-12, -45], [0, -48], [12, -45], [22, -31], [20, -13], [10, -5], [0, -3], [-10, -5]], .9);
  S.dot(g, cave, HOODIN);
  // the skull, lit from below by its own eyes; the hood's shadow falls over the crown
  const fy = ch != null ? Math.max(0, -M.Y[1]) : 0, jaw = ch != null ? fy * 3 : rp != null ? glow * 3 : 0, flare = rp != null ? glow : fy;
  const skull = SM([[-15, -24], [-15, -36], [-9, -43], [0, -45], [9, -43], [15, -36], [15, -24], [11, -15], [6, -10 + jaw * .3], [0, -9 + jaw * .3], [-6, -10 + jaw * .3], [-11, -15]], .85);
  g.save(); cave(g); g.clip();
  S.part(g, skull, RBONE, { x:0, y:-28, r:19 }, { mat:'bone', hx:-6, hy:-36 });
  const hs = g.createLinearGradient(0, -48, 0, -30); hs.addColorStop(0, 'rgba(8,6,12,.85)'); hs.addColorStop(1, 'rgba(8,6,12,0)'); g.fillStyle = hs; g.fillRect(-26, -50, 52, 22);
  for (const s of [-1, 1]){ S.dot(g, SM([[s * 2.5, -31], [s * 6, -36], [s * 12, -35], [s * 13.5, -28], [s * 10, -22.5], [s * 4, -23.5]], .85), '#170d16'); }
  for (const s of [-1, 1]){ g.save(); g.shadowColor = EMBER; g.shadowBlur = 10; S.dot(g, E(s * 7.6, -28.5, 3.4 + flare * .8, 3.8 + flare * .8), rgba(EMBER, .55)); g.restore(); S.glow(g, s * 7.6, -28.5, 2 + flare * .7, EMBER); }
  S.dot(g, PL([[-2, -19.5], [2, -19.5], [0, -22.5]]), '#170d16', .85);
  S.dot(g, RR(-7.5, -16, 15, 4.5 + jaw, 2), '#170d16'); for (let x = -6.5; x <= 4; x += 3.5) S.dot(g, RR(x, -16, 2.6, 3.2), '#f6efe0', .95);
  S.ln(g, [[-12, -19], [-9, -17.5]], RBONE, .9, .5); S.ln(g, [[12, -19], [9, -17.5]], RBONE, .9, .5);
  g.restore();
  S.stroke(g, SO([[-20, -13], [-22, -31], [-12, -45], [0, -48], [12, -45], [22, -31], [20, -13]]), { deep:ROBE.light }, 1.6, .5);
  // the free (left) arm: beckons with a bony finger while it glides; grips the snath for a hack or a reap
  const H1 = sxf(M, 0, -2), H2 = sxf(M, 0, -26);
  if (!twoHand){
    const hx = -30, hy = 12 + beckon * 2, sleeve = SM([[-20, -10], [-34, 6], [-34 + beckon, 18], [-24, 14]], .7);
    S.part(g, sleeve, ROBE, { x:-28, y:4, r:14 }, { flat:true, mat:'cloth' }); S.contact(g, robe, -22, -6, 8, 8, .35);
    bonyHand(g, hx, hy + 6, RBONE, Math.PI / 2 - .2 + beckon * .25, 8, 2.4, 4.6);
  }
  // scythe in front, then the arms that hold it
  drawScythe(g, M, glow);
  const arm = (sx, sy, hx, hy) => { const mx = (sx + hx) / 2 + (hx > sx ? 4 : -4), my = (sy + hy) / 2 + 6;
    S.tube(g, SO([[sx, sy], [mx, my], [hx, hy]]), ROBE, 8.5);
    const a = Math.atan2(hy - my, hx - mx); g.save(); g.translate(hx, hy); g.rotate(a); S.part(g, SM([[-9, -6.5], [-1, -7.5], [2, 0], [-1, 7.5], [-9, 6.5]], .7), ROBE, { x:-4, y:0, r:8 }, { flat:true, mat:'cloth' }); g.restore(); };
  const sdir = Math.atan2(-M.Y[1], -M.Y[0]);
  arm(20, -8, H2[0], H2[1]); gripHand(g, H2[0], H2[1], RBONE, sdir, 4.6);
  if (twoHand){ arm(-20, -8, H1[0], H1[1]); gripHand(g, H1[0], H1[1], RBONE, sdir, 4.6); }
  g.restore();
}

// ---------- Plague Doctor 2 ----------
const ROT = { COAT:pal('#26302a'), COATD:pal('#141a16'), HAT:pal('#161a17'), MASK:pal('#b9b48a'), BEAK:pal('#7a6440'), LENS:pal('#18300f'), SATCH:pal('#3a3326'), BRASS:pal('#6e8f6a'), GLOVE:pal('#2c2a26'), STRAP:pal('#2a241c'), BAND:pal('#3a1a1e'),
  GLOW:'#6dff3a', LENSG:'#a8ff6a', SMOKE:'#8ee05a', CORE:'#eaffc8' };
const MOULD = pal('#58742c'), OOZE = pal('#5fd03a'), SKULL = pal('#d8d2b4'), CROW = pal('#1e1a26'), GLASS = pal('#9ab8a0');
const GF = '#6dff3a', GF2 = '#d8ffb0';

// ---------- rot helpers ----------
/** Ghostfire: a flickering green flame with a pale core, k = 0..1 flicker phase. */
function ghostfire(g, x, y, h, k, wd = 1){
  const f = Math.sin(k * TAU), f2 = Math.sin(k * TAU * 2 + 1);
  g.save(); g.shadowColor = GF; g.shadowBlur = 10;
  S.dot(g, SM([[x - 6 * wd, y], [x - 5 * wd + f, y - h * .45], [x - 1 + f2 * 2, y - h, 1], [x + 2 * wd + f, y - h * .55], [x + 3 * wd - f2, y - h * .7, 1], [x + 6 * wd, y - h * .3], [x + 5 * wd, y + 2], [x, y + 3]], .8), GF, .85);
  g.restore();
  S.dot(g, SM([[x - 3 * wd, y], [x - 1 + f * .6, y - h * .55, 1], [x + 3 * wd, y - h * .2], [x, y + 1.5]], .8), GF2, .9);
}
/** A drip of ooze hanging from (x, y), stretched by k (0..1). */
function ooze(g, x, y, k, s = 1){ const L = (3 + k * 7) * s; S.part(g, SM([[x - 2 * s, y], [x + 2 * s, y], [x + 1.2 * s, y + L * .6], [x + 2.4 * s, y + L], [x, y + L + 2.4 * s], [x - 2.4 * s, y + L], [x - 1.2 * s, y + L * .6]], .8), OOZE, { x, y:y + L * .6, r:L * .6 + 2 }, { flat:true, lw:.8 });
  g.save(); g.shadowColor = GF; g.shadowBlur = 5; S.dot(g, E(x - .7 * s, y + L, .8 * s, 1.1 * s), GF2, .9); g.restore(); }
/** The skull lantern that replaces the censer: a skull hanging by its crown, ghostfire pouring out of the top, sockets alight. */
function skullLantern(g, ex, ey, raise, k){
  ghostfire(g, ex, ey - 8, 14 + raise * 10, k, 1.1);
  const sk = SM([[ex - 8, ey - 6], [ex - 9, ey + 1], [ex - 6, ey + 6], [ex - 4, ey + 10, 1], [ex + 4, ey + 10, 1], [ex + 6, ey + 6], [ex + 9, ey + 1], [ex + 8, ey - 6], [ex, ey - 10]], .85);
  S.part(g, sk, SKULL, { x:ex, y:ey, r:10 }, { mat:'bone', hx:ex - 3, hy:ey - 5 });
  S.ln(g, [[ex - 7, ey - 7], [ex + 7, ey - 7]], SKULL, 1.4, .5);   // the sawn-open crown
  g.save(); g.shadowColor = GF; g.shadowBlur = 6 + raise * 8; for (const s of [-1, 1]) S.dot(g, SM([[ex + s * 1.6, ey - 2], [ex + s * 6, ey - 2.5], [ex + s * 5.5, ey + 2.5], [ex + s * 2, ey + 2]], .8), GF); g.restore();
  for (const s of [-1, 1]) S.dot(g, E(ex + s * 3.8, ey - .2, 1.1, 1.1), GF2, .95);
  S.dot(g, PL([[ex, ey + 2.5], [ex - 1.4, ey + 5], [ex + 1.4, ey + 5]]), SKULL.deep, .8);
  for (let i = -2; i <= 2; i++) S.ln(g, [[ex + i * 1.6, ey + 7], [ex + i * 1.6, ey + 9.6]], SKULL, .8, .6);
}
/** A carrion crow perched on the hat brim, ragged and thin, with a ghostfire eye. */
function crow(g, x, y, k){
  const nod = Math.sin(k * TAU) * 1.2;
  S.ln(g, [[x - 2, y], [x - 3, y - 4]], CROW, 1.4, .9); S.ln(g, [[x + 2, y], [x + 2, y - 4]], CROW, 1.4, .9);
  const tail = SM([[x - 4, y - 8], [x - 16, y - 2, 1], [x - 12, y - 6, 1], [x - 17, y - 7, 1], [x - 7, y - 12]], .7); S.part(g, tail, CROW, { x:x - 10, y:y - 7, r:8 }, { flat:true, mat:'cloth' });
  const body = SM([[x - 8, y - 9], [x - 2, y - 15], [x + 6, y - 14], [x + 8, y - 8], [x + 3, y - 3], [x - 4, y - 4]], .85); S.part(g, body, CROW, { x, y:y - 9, r:9 }, { mat:'cloth', hx:x - 2, hy:y - 12 });
  const wing = SM([[x - 6, y - 11], [x + 4, y - 12], [x - 2, y - 6, 1], [x - 4, y - 8, 1], [x - 8, y - 5, 1]], .7); S.part(g, wing, pal(CROW.light), { x:x - 2, y:y - 9, r:7 }, { flat:true, mat:'cloth' });
  g.save(); g.translate(0, nod);
  const hd = E(x + 7, y - 17, 5.5, 5); S.part(g, hd, CROW, { x:x + 7, y:y - 17, r:5.5 }, { mat:'cloth', hx:x + 5, hy:y - 19 });
  S.part(g, PL([[x + 11, y - 19], [x + 20, y - 15.5], [x + 11, y - 15]]), pal('#4a4450'), { x:x + 14, y:y - 17, r:4 }, { flat:true, lw:.8 });
  S.glow(g, x + 8.5, y - 18, 1.7, GF);
  g.restore();
}

// ---------- the game's Plague Doctor (copied; colours through the palette table) with the rot look added ----------
export function rotDoctor(g, P = {}){
  const C = ROT;
  const { COAT, COATD, HAT, MASK, BEAK, LENS, SATCH, BRASS, GLOVE, STRAP } = C;
  const w = P.walk, ch = P.chew, heal = P.heal ?? 0, ph = (w ?? ch ?? 0) * TAU;
  const bob = w != null ? -Math.abs(Math.sin(ph)) * 2 : ch != null ? Math.sin(ph) * 2 : 0, peck = ch == null ? 0 : .5 + .5 * Math.sin(ph), stoop = .12 + (w != null ? Math.sin(ph) * .03 : 0) + peck * .12;
  const raise = Math.sin(Math.min(1, heal) * Math.PI);   // the censer swings up and back down during a heal
  const k = w ?? ch ?? heal;   // flicker phase for the ghostfire
  S.shadow(g, 0, 52, 32, 6);
  for (let i = 0; i < 5; i++){ const x = -30 + i * 15, t = (k + i * .23) % 1; puff(g, x + Math.sin((k + i * .3) * TAU) * 3, 48 - t * 6, 9 + (i % 2) * 3, .38, '#4f8a2a'); }   // poison fog round the shoes
  // shoes
  for (const s of [-1, 1]){ const p = w == null ? 0 : ph + (s < 0 ? 0 : Math.PI), dx = w == null ? 0 : Math.cos(p) * 3, dy = w == null ? 0 : -Math.max(0, Math.sin(p)) * 3; S.part(g, SM([[s * 6 + dx, 44 + dy], [s * 20 + dx, 44 + dy], [s * 22 + dx, 51 + dy], [s * 4 + dx, 51 + dy]], .6), GLOVE, { x:s * 13 + dx, y:48 + dy, r:9 }, { flat:true, mat:'leather' }); }
  g.save(); g.translate(0, bob);
  // long coat with a swinging hem, stooped forward (shoulders hunched up); the rot coat is torn to tatters at the hem
  const swing = w != null ? Math.sin(ph) * 3 : 0;
  const coat =
  SM([[-12, -30], [-30, -14], [-32, 12], [-32 + swing, 46, 1], [-25 + swing, 37, 1], [-19 + swing, 49, 1], [-11 + swing, 39, 1], [-3, 50, 1], [5 + swing, 40, 1], [13 + swing, 50, 1], [21 + swing, 38, 1], [31 + swing, 47, 1], [32, 12], [30, -14], [12, -30]], .8)
  S.part(g, coat, COAT, { x:0, y:8, r:42 }, { mat:'leather', hx:-16, hy:-14 });
  g.save(); coat(g); g.clip(); for (const [x, y, r] of [[-22, -8, 5], [24, -12, 4.5], [-14, 30, 6], [20, 32, 4.5], [-28, 14, 3.5]]) S.part(g, SM([[x - r, y], [x - r * .4, y - r * .8], [x + r * .5, y - r * .7], [x + r, y + r * .1], [x + r * .3, y + r * .8], [x - r * .6, y + r * .6]], .9), MOULD, { x, y, r }, { flat:true, noEdge:true, mat:'moss' }); g.restore();
  S.crease(g, SO([[-20, -6], [-22, 16], [-20 + swing, 44]]), COAT, 2, .45); S.crease(g, SO([[18, -8], [22, 14], [20 + swing, 44]]), COAT, 2, .45);
  S.ln(g, [[0, -24], [1, 46]], COATD, 1.6, .7); for (const y of [-14, -2, 10, 22]) S.rivet(g, 1, y, 2, BRASS);
  for (const [x, y, i] of [[-19, 48, 0], [-3, 49, 1], [13, 49, 2]]) ooze(g, x + swing, y, (k + i * .37) % 1, .8);
  // belt and satchel (the rot satchel is marked with a glowing skull, and poison vials ride the strap)
  S.part(g, RR(-31, 4, 62, 7, 2), STRAP, { x:0, y:8, r:31 }, { flat:true, mat:'leather' }); S.rivet(g, 0, 7.5, 2.6, BRASS);
  S.tube(g, SO([[-22, -20], [22, 20]]), STRAP, 3.5);
  for (const t of [.22, .42]){ const vx = -22 + 44 * t, vy = -20 + 40 * t; S.part(g, RR(vx - 2.6, vy - 7, 5.2, 11, 2.2), GLASS, { x:vx, y:vy - 2, r:6 }, { flat:true, lw:.8 }); g.save(); g.shadowColor = GF; g.shadowBlur = 5; S.dot(g, RR(vx - 1.8, vy - 2, 3.6, 5.4, 1.6), GF, .9); g.restore(); S.part(g, RR(vx - 1.8, vy - 9, 3.6, 2.6, .8), STRAP, { x:vx, y:vy - 8, r:2 }, { flat:true, lw:.6 }); }
  S.part(g, RR(14, 12, 20, 16, 4), SATCH, { x:24, y:20, r:12 }, { mat:'leather' }); S.part(g, RR(14, 10, 20, 7, 3), pal(SATCH.dark), { x:24, y:13, r:10 }, { flat:true, mat:'leather' }); S.rivet(g, 24, 18, 1.8, BRASS);
  g.save(); g.shadowColor = GF; g.shadowBlur = 5; S.dot(g, SM([[20.5, 22], [24, 18.5], [27.5, 22], [26.5, 25], [21.5, 25]], .9), GF, .9); g.restore(); S.dot(g, E(22.6, 22, .9, 1), '#14200c'); S.dot(g, E(25.4, 22, .9, 1), '#14200c');
  // arms: right holds the censer chain, left tucked
  const cx = -30, cy = -2, ca = -.5 + raise * -1.2 + (w != null ? Math.sin(ph + 1) * .1 : 0);
  S.tube(g, SO([[-24, -18], [-36, -6], [cx, cy]]), COAT, 8); S.part(g, E(cx, cy + 2, 6, 5.5), GLOVE, { x:cx, y:cy, r:6 }, { flat:true, mat:'leather' });
  S.tube(g, SO([[24, -18], [34, -2], [28, 12]]), COAT, 8); S.part(g, E(28, 14, 6, 5.5), GLOVE, { x:28, y:14, r:6 }, { flat:true, mat:'leather' });
  // censer swinging from the chain: a brass pot with a green-glowing grate (rot: a skull lantern pouring ghostfire)
  const cl = 26, ex = cx + Math.sin(ca) * cl, ey = cy + Math.cos(ca) * cl;
  S.ln(g, [[cx, cy], [ex, ey - 8]], BRASS, 1.6, .9); for (let i = 1; i < 4; i++) S.dot(g, E(cx + (ex - cx) * i / 4, cy + (ey - 8 - cy) * i / 4, 1.6, 1.6), BRASS.light, .9);
  skullLantern(g, ex, ey, raise, k);
  for (let i = 0; i < 3; i++){ const t = ((heal * 2 + i / 3) % 1); puff(g, ex + Math.sin(i * 2 + heal * 10) * 6, ey - 12 - t * 22, 4 + t * 4, (1 - t) * .5 * (.4 + raise * .6), C.SMOKE); }
  // head: stooped forward and low, beaked mask, lenses, wide hat
  g.save(); g.translate(0, -4); g.rotate(stoop); g.translate(0, 14);   // the head sits low on the chest: hunched
  const head = SM([[-18, -36], [-20, -22], [-14, -10], [0, -6], [14, -10], [20, -22], [18, -36], [8, -44], [-8, -44]]); S.part(g, head, MASK, { x:0, y:-26, r:20 }, { mat:'leather' });
  S.contact(g, coat, 0, -26, 16, 8, .5);
  // stitched seams of the mask
  S.ln(g, [[-12, -30], [12, -30]], pal(MASK.dark), 1.2, .6); for (const x of [-9, -3, 3, 9]) S.ln(g, [[x, -33], [x, -27]], pal(MASK.dark), 1, .5);
  g.save(); head(g); g.clip(); for (const [x, y, r] of [[-15, -16, 5], [14, -38, 4]]) S.part(g, E(x, y, r, r * .7), MOULD, { x, y, r }, { flat:true, noEdge:true, mat:'moss' }); g.restore(); S.ln(g, [[16, -20], [11, -16], [14, -12], [9, -9]], MASK, 1.3, .85);   // mould and a crack
  // the beak: a long leather cone curving down toward the wall, stitched along its ridge (rot: broken off jaggedly near the tip, dripping)
  const beak =
  SM([[-11, -24], [11, -22], [15, -10], [12 + peck * 4, 4 + peck * 8, 1], [8 + peck * 3, 6 + peck * 7, 1], [6 + peck * 3, 11 + peck * 8, 1], [2, 8 + peck * 6, 1], [-4, 6], [-9, -8]], .75)
  S.part(g, beak, BEAK, { x:2, y:-8, r:16 }, { mat:'leather', hx:-3, hy:-16 });
  S.contact(g, beak, 0, -22, 12, 5, .45);
  S.ln(g, [[-3, -18], [7, 6 + peck * 8]], pal(BEAK.dark), 1.4, .7); for (let i = 0; i < 5; i++) S.ln(g, [[-4.5 + i * 2, -15 + i * 5], [-1.5 + i * 2, -14 + i * 5]], pal(BEAK.dark), 1, .6);
  for (const y of [-10, -2]) S.dot(g, E(-3, y, 1.6, 1.3), BEAK.deep, .7);
  S.ln(g, [[10, -18], [6, -10], [10, -4]], BEAK, 1.2, .85); ooze(g, 5 + peck * 3, 10 + peck * 8, (k * 2) % 1, .9);
  // goggle lenses: brass rings with glowing green glass (rot: ghostfire burning out of them, the left one cracked)
  for (const s of [-1, 1]){ S.part(g, E(s * 10, -30, 7.5, 7.5), BRASS, { x:s * 10, y:-30, r:7.5 }, { mat:'metal', flat:true }); g.save(); g.shadowColor = C.LENSG; g.shadowBlur = 10; S.part(g, E(s * 10, -30, 5.5, 5.5), LENS, { x:s * 10, y:-30, r:5.5 }, { noEdge:true }); g.restore();
    S.dot(g, E(s * 10, -30, 3, 3), C.LENSG, .9); S.dot(g, E(s * 10 - 1.4, -31.6, 1.4, 1.1), '#fff', .95); }
  S.ln(g, [[-14, -34], [-10, -30], [-12, -26]], { deep:'#d8ffb0' }, .9, .9); S.ln(g, [[-10, -30], [-6, -31]], { deep:'#d8ffb0' }, .8, .8);
  // hat: wide brim and a low crown with a band (rot: a ragged brim, a torn band and a crow perched on it)
  { const R = rng(31), pts = []; for (let i = 0; i < 18; i++){ const a = Math.PI + i / 17 * Math.PI, r = i % 2 ? 1 : .86 + R() * .08; pts.push([Math.cos(a) * 37 * r, -46 + Math.sin(a) * 7.5 * r, i % 2]); } for (let i = 17; i >= 0; i--){ const a = Math.PI + i / 17 * Math.PI, r = i % 3 === 1 ? .8 : 1; pts.push([Math.cos(a) * 37 * r, -46 - Math.sin(a) * 7.5 * r + (i % 3 === 1 ? 3 : 0), i % 3 === 1 ? 1 : 0]); }
    S.part(g, SM(pts, .5), HAT, { x:0, y:-46, r:36 }, { flat:true, mat:'cloth', hx:-16, hy:-49 }); }
  S.contact(g, head, 0, -42, 18, 6, .5);
  S.part(g, SM([[-20, -46], [-17, -60], [0, -63], [17, -60], [20, -46]], .6), HAT, { x:0, y:-54, r:20 }, { mat:'cloth', hx:-8, hy:-58 });
  S.part(g, RR(-19, -53, 38, 5, 2), C.BAND, { x:0, y:-50, r:19 }, { flat:true, mat:'leather' }); S.rivet(g, 8, -50.5, 2, BRASS);
  S.dot(g, PL([[-12, -48], [-16, -40], [-10, -44], [-8, -38], [-7, -48]]), C.BAND.base); crow(g, 24, -50, k);
  g.restore();
  g.restore();
}

// ---------- registry ----------
// Plague Doctor 2 (r 22) keeps the Plague Doctor's scale .62 and dy -10 (its box is widened for the crow and the fog); the Reaper (r 21) is .56 like
// the Wraith with dy -8, and the archive's wide box so the sweep's crescent fits. The Reaper's chew is the 10-frame reap loop (not `once`).
const clipOf = (n, fps, key) => ({ n, fps, pose:t => ({ [key]:t }) });
export const HOLLOW = {
  rotdoctor: { draw:rotDoctor, scale:.62, dy:-10, box:{ x:-70, y:-74, w:140, h:130 }, clips:{ walk:clipOf(8, 7, 'walk'), chew:clipOf(4, 7, 'chew') }, still:{} },
  reaper: { draw:reaper, scale:.56, dy:-8, box:{ x:-96, y:-114, w:190, h:178 }, clips:{ walk:clipOf(8, 8, 'walk'), chew:clipOf(10, 14, 'reap') }, still:{} },
};
