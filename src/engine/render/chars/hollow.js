// ---------- Nightmare Foggy Hollow: Plague Doctor 2, the Reaper, Fogwalker 2 and the Mini Poltergeist (Release 5) ----------
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
//   fogwalker2, minipolt: docs/archive/nightmare-monsters/spirits/spirits.js (Fogwalker 2 with its exhale clip; the Mini Poltergeist with orbiting junk and a toss clip,
//              used as its rot cast). The Comet Rider (Wisp Rider 2) is in chars/hollowcomet.js.
// Drawn around (0,0) in drawing units with the feet near y = 50. Every clip is baked by render/anim.js, so the glows are fine; nothing random
// per frame (rng(seed) only).

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';
import { COMET } from './hollowcomet.js';


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

// ---------- Foggy Hollow spirits: the Mini Poltergeist and Fogwalker 2 (palettes from w2.js) ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
// Foggy Hollow (from w2.js): the Poltergeist's shroud and soul glow, the Fogwalker's robe and lantern
const SHROUD = pal('#aab5c6'), SHROUDD = pal('#6f7e94'), SPIRIT = pal('#c4dfe8'), TOOTH = pal('#dbe5ec'), SOUL = '#9ef4e2', VOID = '#0a0f18',
  FOGR = pal('#7a8a9a'), FOGRD = pal('#4f5c6c'), BONE = pal('#dfe2ec'), LAMP = pal('#5b4b3a'), LAMPG = pal('#dcefff'), IRON = pal('#4a4f5c'), BRASS = pal('#c09a3a'), CYAN2 = '#bfefff';
// junk
const CHINA = pal('#f2eee6'), CHINAB = pal('#3a78c8'), STEEL = pal('#b9c2cc'), BOOK = pal('#b8323a'), PAGE = pal('#f4ecd4'), WAX = pal('#f1e3bc'),
  GOLD = pal('#d4a63a'), FRAME = pal('#3a2a44');

function voidFace(g, cave, ex, ey, r, col, flare = 0){
  S.dot(g, cave, '#0d1420');
  g.save(); cave(g); g.clip(); const gr = g.createRadialGradient(0, ey, 2, 0, ey, 26); gr.addColorStop(0, rgba(col, .25 + flare * .4)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(-40, ey - 40, 80, 80); g.restore();
  S.glow(g, -ex, ey, r + flare, col); S.glow(g, ex, ey, r + flare, col);
}
// ---------- Mini Poltergeist ----------
// junk, each drawn around (0,0), about 10 units across
const JUNK = [
  function teacup(g){ S.part(g, SM([[-7, -4], [7, -4], [5.5, 3], [2, 5.5], [-2, 5.5], [-5.5, 3]], .7), CHINA, { x:0, y:0, r:7 }, { flat:true, lw:1.1 });
    g.save(); SM([[-7, -4], [7, -4], [5.5, 3], [2, 5.5], [-2, 5.5], [-5.5, 3]], .7)(g); g.clip(); S.dot(g, RR(-8, -1, 16, 2.6, 0), CHINAB.base); g.restore();
    S.stroke(g, g2 => { g2.beginPath(); g2.ellipse(8, 0, 3, 3.2, 0, -1.6, 1.6); }, CHINA, 1.8, .9); S.dot(g, E(0, -4, 7, 1.8), '#6a4630'); },
  function fork(g){ S.tube(g, SO([[0, 9], [0, -2]]), STEEL, 2.4); S.part(g, RR(-3.4, -4, 6.8, 3.2, 1.2), STEEL, { x:0, y:-3, r:4 }, { flat:true, mat:'metal', lw:.9 });
    for (const x of [-2.4, -.8, .8, 2.4]) S.tube(g, SO([[x, -3], [x, -9]]), STEEL, 1); },
  function book(g){ S.part(g, RR(-6, -7.5, 12, 15, 1.5), BOOK, { x:0, y:0, r:8 }, { flat:true, mat:'leather', lw:1.1 }); S.dot(g, RR(4.5, -6.5, 2.4, 13, .8), PAGE.base); S.dot(g, RR(-6, -7.5, 2.2, 15, 1), BOOK.dark);
    S.part(g, E(.5, -1, 2.4, 2.4), GOLD, { x:.5, y:-1, r:2.4 }, { flat:true, mat:'metal', lw:.8 }); },
  function candle(g){ S.part(g, RR(-2.6, -4, 5.2, 11, 1.5), WAX, { x:0, y:1, r:6 }, { flat:true, lw:1 }); S.part(g, E(0, 7, 5.5, 2.2), GOLD, { x:0, y:7, r:5 }, { flat:true, mat:'metal', lw:.9 });
    S.ln(g, [[0, -4], [0, -6]], { deep:'#2a1a10' }, .8, .9); g.save(); g.shadowColor = '#ffcc60'; g.shadowBlur = 6; S.dot(g, SM([[0, -12], [2, -7.5], [0, -5.5], [-2, -7.5]], .8), '#ffd27a'); g.restore(); S.dot(g, E(0, -7.4, .9, 1.4), '#ffffff'); },
  function frame(g){ S.part(g, RR(-6.5, -6, 13, 12, 1.5), GOLD, { x:0, y:0, r:8 }, { flat:true, mat:'metal', lw:1 }); S.part(g, RR(-4, -3.6, 8, 7.2, 1), FRAME, { x:0, y:0, r:5 }, { flat:true, lw:.8 });
    S.dot(g, E(0, -.6, 2, 2.2), SHROUD.light, .8); S.dot(g, E(-.8, -1, .5, .6), '#111'); S.dot(g, E(.8, -1, .5, .6), '#111'); },
];
function junkItem(g, i, x, y, s, rot, a = 1){ g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot); g.scale(s, s); JUNK[i](g); g.restore(); }
function smallHand(g, x, y, c, dir, curl, k = .55){
  g.save(); g.translate(x, y); g.scale(k, k);
  const w = 4, len = 20;
  for (let i = 0; i < 3; i++){ const ang = dir + (i - 1) * .42, L = len * (i === 1 ? 1 : .85), mx = Math.cos(ang) * L * .5, my = Math.sin(ang) * L * .5, a2 = ang + .25 + curl, tx = mx + Math.cos(a2) * L * .5, ty = my + Math.sin(a2) * L * .5;
    S.tube(g, SO([[0, 0], [mx, my], [tx, ty]]), c, w); S.claw(g, tx, ty, a2, 5, '#eaf1f6'); }
  S.part(g, E(0, 0, 8, 7, dir), c, { x:0, y:0, r:8 }, { flat:true, mat:'bone' });
  g.restore();
}

export function minipolt(g, P = {}){
  const w = P.walk, ch = P.chew, ts = P.toss;
  const ph = (w ?? ch ?? 0) * TAU;
  const bob = w != null ? Math.sin(ph) * 4 : ch != null ? Math.sin(ph) * 2 : 0, press = ch == null ? 0 : .5 + .5 * Math.sin(ph), sway = w != null ? Math.sin(ph) * .06 : 0;
  // toss: grab the teacup out of the orbit (0–.35), wind up high (.35–.5), fling it down the lane (.5–.75), settle
  let tossK = 0, cupHeld = null, cupFly = null, lean = 0, grin = press * .5;
  let rh = { x:24, y:-12 + Math.sin(ph + 1) * 3, dir:Math.PI / 2 - .5, curl:.2 }, lh = { x:-24, y:-12 + Math.sin(ph) * 3, dir:Math.PI / 2 + .5, curl:.2 };
  if (ch != null){ rh = { x:14, y:6 + press * 10, dir:Math.PI / 2 - .2, curl:press * .5 }; lh = { x:-14, y:6 + (1 - press) * 10, dir:Math.PI / 2 + .2, curl:(1 - press) * .5 }; }
  const orbitA = w != null ? -w * TAU : ch != null ? Math.sin(ph) * .4 : 0;
  if (ts != null){
    const grab = ease(clamp(ts / .3)), up = ease(clamp((ts - .3) / .2)), fl = ease(clamp((ts - .5) / .2)), back = ease(clamp((ts - .8) / .2));
    rh = { x:lerp(lerp(24, 30, grab), 12, fl), y:lerp(lerp(-12, -22, grab) - up * 26, 8, fl), dir:lerp(-1.2, Math.PI / 2 - .2, fl), curl:fl < 1 ? .9 : .2 };
    if (back > 0){ rh = { x:lerp(12, 24, back), y:lerp(8, -12, back), dir:lerp(Math.PI / 2 - .2, Math.PI / 2 - .5, back), curl:.2 }; }
    lean = up * -.12 + fl * .2 - back * .08; grin = .6 + up * .4; tossK = 1;
    if (ts < .58) cupHeld = { x:rh.x - 2, y:rh.y - 8, rot:-.4 + up * 1.2 }; else { const u = clamp((ts - .58) / .42); cupFly = { x:lerp(rh.x, 2, u), y:lerp(4, 46, u), rot:2 + u * 6, s:lerp(1.1, .7, u), a:1 - clamp((u - .7) / .3) }; }
  }
  S.shadow(g, 0, 52, 20, 4);
  for (let i = 0; i < 4; i++){ const t = i / 3; puff(g, Math.sin(ph + i * 1.9) * 8 * (t + .3) + (i - 1.5) * 6, 32 + t * 16, 10 - t * 4, .4 - t * .25); }
  // the orbit: items behind the body are drawn first, the ones in front after
  const orbit = [];
  for (let i = 0; i < 5; i++){ if (tossK && i === 0) continue; const a = orbitA + i * TAU / 5 + .5, x = Math.cos(a) * 38, y = -22 + Math.sin(a) * 11 - Math.cos(a) * 4 + bob * .5, s = 1 + Math.sin(a) * .14;
    orbit.push({ i, x, y, s, rot:a * 1.5 + i, front:Math.sin(a) > 0 }); }
  for (const o of orbit) if (!o.front) junkItem(g, o.i, o.x, o.y, o.s * .95, o.rot, .8);
  g.save(); g.translate(0, bob + press * 4); g.translate(0, 20); g.rotate(sway + lean); g.translate(0, -20);
  // shredded tail strips under the shroud
  const R = rng(17);
  for (let i = 0; i < 4; i++){ const bx = -12 + i * 8, L = 26 + R() * 10, wv = Math.sin(ph + i * 1.4) * 5, w0 = 6 + R() * 2;
    const p = SM([[bx - w0, 0], [bx - w0 * .8 + wv * .3, L * .4], [bx - 2 + wv, L, 1], [bx + 2 + wv * 1.1, L * .75, 1], [bx + w0 * .8 + wv * .3, L * .35], [bx + w0, 0]], .8);
    S.part(g, p, SHROUD, { x:bx, y:L * .4, r:L * .5 }, { flat:true, mat:'cloth', hx:bx - 2, hy:6 }); S.thread(g, bx - 2 + wv, L, wv > 0 ? 1 : -1, SHROUDD); }
  // shroud: a round little ghost-sack with a nightcap tip that curls over to one side
  const hem = tatters(-22, 22, 8, 4, ph, 6), curl = w != null ? Math.sin(ph) * 2 : 0;
  const torso = SM([[2, -60], [-12, -56], [-21, -46], [-25, -30], [-24, -14], [-22, -2], ...hem, [22, -2], [24, -14], [25, -30], [22, -46], [14, -56], [12, -64], [18 + curl, -70], [24 + curl, -66, 1], [20 + curl, -74], [10, -72], [4, -64]], .8);
  g.save(); g.shadowColor = rgba(SOUL, .5); g.shadowBlur = 12; S.part(g, torso, SHROUD, { x:0, y:-28, r:36 }, { mat:'cloth', hx:-10, hy:-46 }); g.restore();
  S.overlay(g, torso, SHROUDD, { x:0, y:-26, r:34 }, .5);
  g.save(); torso(g); g.clip(); const gr = g.createRadialGradient(0, -14, 2, 0, -14, 28); gr.addColorStop(0, rgba(SOUL, .4)); gr.addColorStop(1, rgba(SOUL, 0)); g.fillStyle = gr; g.fillRect(-40, -80, 80, 100); g.restore();
  S.crease(g, SO([[-16, -20], [-18, -4]]), SHROUDD, 1.6, .4); S.crease(g, SO([[15, -18], [17, -4]]), SHROUDD, 1.6, .4);
  for (const [x, y] of hem.filter((p, i) => i % 2 === 0)) S.thread(g, x, y, x < 0 ? -1 : 1, SHROUDD);
  // stubby torn sleeves to the hands
  for (const [s, h] of [[-1, lh], [1, rh]]){ const sx = s * 20, sy = -26, wx = h.x - Math.cos(h.dir) * 3, wy = h.y - Math.sin(h.dir) * 3;
    S.tube(g, SO([[sx, sy], [(sx + wx) / 2 + s * 6, (sy + wy) / 2], [wx, wy]]), SHROUD, 8); S.contact(g, torso, sx, sy, 6, 6, .3); }
  // face: a big hollow with lopsided blazing eyes (one squinting) and a wide jagged grin
  const cave = SM([[-17, -30], [-18, -44], [-10, -52], [0, -50], [10, -52], [18, -44], [17, -30], [10, -22], [0, -20], [-10, -22]], .85);
  S.dot(g, cave, VOID);
  g.save(); cave(g); g.clip(); const cg = g.createRadialGradient(0, -38, 1, 0, -38, 20); cg.addColorStop(0, rgba(SOUL, .25 + grin * .2)); cg.addColorStop(1, rgba(SOUL, 0)); g.fillStyle = cg; g.fillRect(-30, -60, 60, 50); g.restore();
  S.stroke(g, SO([[-17, -30], [-18, -44], [-10, -52], [0, -50], [10, -52], [18, -44], [17, -30]]), { deep:SHROUD.light }, 1.6, .45);
  S.dot(g, E(-8, -40, 5.6, 6.2), '#03060c'); S.dot(g, E(8, -40, 5.6, 5.2), '#03060c');
  S.glow(g, -8, -39.5, 3.3 + grin * .6, SOUL); S.glow(g, 8, -39, 2.6 + grin * .4, SOUL);
  S.dot(g, PL([[-15, -48], [-2, -46], [-4, -43.5], [-14, -45]]), SHROUDD.deep, .9); S.dot(g, PL([[15, -45], [3, -44], [4, -41.5], [15, -42.5]]), SHROUDD.deep, .95);   // mismatched scowl: one brow up, one lid down
  const op = .3 + grin * .7 + press * .4;
  const mouth = SM([[-14, -33, 1], [-7, -29.5], [0, -29], [7, -29.5], [14, -34, 1], [10, -27 + op * 2], [0, -23.5 + op * 3], [-10, -27 + op * 2]], .8);
  S.dot(g, mouth, VOID); g.save(); mouth(g); g.clip(); const mg = g.createRadialGradient(0, -25, 1, 0, -26, 12); mg.addColorStop(0, rgba(SOUL, .45)); mg.addColorStop(1, rgba(SOUL, 0)); g.fillStyle = mg; g.fillRect(-16, -38, 32, 18);
  S.part(g, E(4, -23 + op * 3, 4.5, 3.4), pal('#7fd8c8'), { x:4, y:-23, r:4.5 }, { flat:true, lw:.8 }); g.restore();   // a little ghost-tongue
  for (const x of [-10.5, -6, -1.5, 3, 7.5, 11.5]){ const yy = -30.5 + Math.abs(x) * .1 - (Math.abs(x) > 10 ? 1.5 : 0); S.dot(g, PL([[x - 1.9, yy], [x + 1.9, yy], [x, yy + 3.6]]), TOOTH.base); }
  S.ln(g, [[-15, -34.5], [-13, -31.5]], SHROUD, 1, .7); S.ln(g, [[15, -35.5], [13, -32.5]], SHROUD, 1, .7);   // grin dimples
  // hands, then the cup it holds
  smallHand(g, lh.x, lh.y, SPIRIT, lh.dir, lh.curl); smallHand(g, rh.x, rh.y, SPIRIT, rh.dir, rh.curl);
  if (cupHeld) junkItem(g, 0, cupHeld.x, cupHeld.y, 1.1, cupHeld.rot);
  g.restore();
  for (const o of orbit) if (o.front) junkItem(g, o.i, o.x, o.y, o.s, o.rot);
  if (cupFly){ g.save(); g.globalAlpha *= cupFly.a * .5; for (let k = 1; k <= 3; k++) junkItem(g, 0, cupFly.x + (rh.x - cupFly.x) * k * .08, cupFly.y - k * 5, cupFly.s, cupFly.rot - k * .5, .5 - k * .12); g.restore(); junkItem(g, 0, cupFly.x, cupFly.y, cupFly.s, cupFly.rot, cupFly.a); }
}
/** The flung teacup on its own, spinning down the lane with a soul-glow trail (the engine's projectile). */

// ---------- Fogwalker 2 ----------
/** The lantern-cage chest: an iron barrel of curved bars between two banded rims, full of glowing fog. bright 0..1+, breath = fog spilling out. */
function cage(g, cx, cy, bright, ph, swell = 0){
  const W = 21 + swell * 2, H = 26 + swell * 2;
  // its light spills over the robe around it
  let gr = g.createRadialGradient(cx, cy, 4, cx, cy, 40 + Math.min(1, bright) * 6); gr.addColorStop(0, rgba(LAMPG.base, .45 + bright * .3)); gr.addColorStop(1, rgba(LAMPG.base, 0)); g.fillStyle = gr; g.fillRect(cx - 60, cy - 60, 120, 120);
  const inside = SM([[cx - W, cy - H * .6], [cx - W * 1.1, cy], [cx - W, cy + H * .6], [cx, cy + H * .72], [cx + W, cy + H * .6], [cx + W * 1.1, cy], [cx + W, cy - H * .6], [cx, cy - H * .72]], .9);
  g.save(); g.shadowColor = '#dcefff'; g.shadowBlur = 12 + bright * 14; S.dot(g, inside, '#cfe6f6'); g.restore();
  g.save(); inside(g); g.clip();
  gr = g.createRadialGradient(cx - 2, cy + 2, 1, cx, cy, W * 1.25); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.45, rgba(LAMPG.base, .95)); gr.addColorStop(1, '#7f9fc0'); g.fillStyle = gr; g.fillRect(cx - 40, cy - 40, 80, 80);
  for (let i = 0; i < 5; i++){ const t = ((ph / TAU) + i / 5) % 1; puff(g, cx + Math.sin(i * 2.1 + t * TAU) * 10, cy + 14 - t * 30, 6 + t * 5, .5, '#8aa6c0', '#c8dceb'); }   // fog churning inside
  g.save(); g.shadowColor = CYAN2; g.shadowBlur = 10 + bright * 10; S.dot(g, SM([[cx, cy - 12 - bright * 4], [cx + 5.5, cy + 1], [cx, cy + 6], [cx - 5.5, cy + 1]], .8), '#f6feff'); g.restore();   // the soul flame at its heart
  S.dot(g, SM([[cx - 2, cy - 4 - bright * 2], [cx + 2.5, cy + 2], [cx - 1, cy + 4], [cx - 3.5, cy + 1]], .8), CYAN2, .9);
  g.save(); g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, cx - W * .55, cy - H * .25, 2.5, H * .3, .15); g.fill(); g.restore();   // glass glint
  g.restore();
  S.stroke(g, inside, LAMP, 2.4, .95);
  // four curved bars like ribs
  for (const k of [-.52, 0, .52]){ const bx = cx + k * W; S.tube(g, SO([[bx, cy - H * .66], [bx + k * 7, cy], [bx, cy + H * .66]]), LAMP, 2.4); }
  for (const [y, s] of [[cy - H * .66, -1], [cy + H * .66, 1]]){ const band = SM([[cx - W - 2, y - 3], [cx, y - 4 + s * 2], [cx + W + 2, y - 3], [cx + W + 2, y + 3], [cx, y + 4 + s * 2], [cx - W - 2, y + 3]], .7);
    S.part(g, band, LAMP, { x:cx, y, r:W }, { flat:true, mat:'metal', lw:1.3 }); for (const k of [-.7, 0, .7]) S.rivet(g, cx + k * W, y + s * .5, 1.5, BRASS); }
  S.part(g, SM([[cx - 8, cy - H * .66 - 3], [cx - 5, cy - H * .66 - 9], [cx + 5, cy - H * .66 - 9], [cx + 8, cy - H * .66 - 3]], .6), LAMP, { x:cx, y:cy - H * .7, r:9 }, { flat:true, mat:'metal', lw:1.2 });   // vent cap under the chin
  return inside;
}

export function fogwalker2(g, P = {}){
  const w = P.walk, ch = P.chew, ex = P.exhale;
  const ph = (w ?? ch ?? 0) * TAU;
  const step = w != null ? Math.sin(ph) : 0, bob = w != null ? -Math.abs(Math.sin(ph)) * 3 : ch != null ? Math.sin(ph) * 2 : 0, sway = w != null ? step * .035 : 0, press = ch == null ? 0 : .5 + .5 * Math.sin(ph);
  let inh = 0, blow = 0;
  if (ex != null){ inh = ex < .3 ? ease(ex / .3) : 1 - ease(clamp((ex - .3) / .2)); blow = clamp((ex - .28) / .72); }
  const bright = .2 + press * .3 + inh * .3 + (blow > 0 ? Math.sin(blow * Math.PI) * 1 : 0);
  S.shadow(g, 0, 52, 36, 6);
  // the big breath: fog billowing out of the cage and rolling down and out across the ground (under the figure's arms)
  const breath = [];
  if (blow > 0){ const R = rng(5); for (let i = 0; i < 14; i++){ const a = Math.PI * (.05 + .9 * (i / 13)) + (R() - .5) * .2, d = (16 + R() * 44) * ease(clamp(blow * 1.6 - R() * .3)), rr = 8 + R() * 6 + blow * 8, al = (1 - blow) * (.55 + R() * .3);
      breath.push([Math.cos(a) * d * 1.15, 6 + Math.sin(a) * d * .5, rr, al]); } }
  g.save(); g.translate(0, bob + press * 2); g.translate(0, 46); g.rotate(sway); g.scale(1 + inh * .03, 1 + inh * .04); g.translate(0, -46);
  // wrapped feet peek out under the robe, plodding
  for (const s of [-1, 1]){ const lift = w != null ? Math.max(0, s * step) * 4 : 0; S.part(g, SM([[s * 6, 40 - lift], [s * 20, 40 - lift], [s * 24, 48 - lift], [s * 4, 49 - lift]], .7), FOGRD, { x:s * 14, y:44, r:10 }, { flat:true, mat:'bandage', lw:1.2 }); }
  // robe: broad, hunched shoulders humped up behind the head
  const hem = tatters(-38, 38, 44, 7, ph, 8);
  const robe = SM([[-30, -60], [-43, -50], [-47, -28], [-42, 0], [-40, 38], ...hem, [40, 38], [42, 0], [47, -28], [43, -50], [30, -60], [14, -68], [0, -70], [-14, -68]], .8);
  S.part(g, robe, FOGR, { x:0, y:-4, r:52 }, { mat:'cloth', hx:-24, hy:-38 });
  S.overlay(g, robe, FOGRD, { x:0, y:0, r:50 }, .4);
  S.crease(g, SO([[-30, 10], [-32, 28], [-30, 42]]), FOGR, 2, .4); S.crease(g, SO([[28, 10], [30, 28], [28, 42]]), FOGR, 2, .4);
  for (const [x, y] of hem.filter((p, i) => i % 2 === 0)) S.thread(g, x, y, x < 0 ? -1 : 1, FOGR);
  // the robe falls open over the cage: dark lining, then the cage
  const open = SM([[-6, -30], [-26, -16], [-30, 14], [-22, 34], [0, 30], [22, 34], [30, 14], [26, -16], [6, -30]], .8);
  S.part(g, open, FOGRD, { x:0, y:4, r:30 }, { flat:true, mat:'cloth', lw:1.4 });
  const cy = 8, inside = cage(g, 0, cy, bright, ph, inh * 2 + (ex != null ? 0 : press));
  S.contact(g, open, 0, -14, 22, 6, .35);
  // inhale: wisps sucked back into the cage
  if (inh > 0 && blow < .05) for (let i = 0; i < 6; i++){ const a = i / 6 * TAU, d = 44 * (1 - inh) + 18; puff(g, Math.cos(a) * d, cy + Math.sin(a) * d * .7, 5, inh * .5); }
  // long arms: hang to the knees and swing heavily; claw down at the wall in turn when chewing; flung back for the breath
  for (const s of [-1, 1]){
    let hx = s * 44 - s * step * 0, hy = 30 + s * step * 4, dir = Math.PI / 2 + s * .25;
    if (w != null){ hx = s * 46; hy = 28 - s * step * 5; }
    if (ch != null){ const k = s < 0 ? press : 1 - press; hx = s * (30 - k * 6); hy = 26 + k * 14; dir = Math.PI / 2 - s * .2; }
    if (ex != null){ const o = Math.max(inh, blow > 0 ? Math.sin(Math.min(1, blow * 2) * Math.PI / 2) * (1 - blow) : 0); hx = s * (46 + o * 14); hy = 26 - o * 30; dir = Math.PI / 2 + s * (.25 + o * .9); }
    const sx = s * 39, sy = -46, ex2 = (sx + hx) / 2 + s * 8, ey = (sy + hy) / 2;
    S.tube(g, SO([[sx, sy], [ex2, ey], [hx - Math.cos(dir) * 4, hy - Math.sin(dir) * 4]]), FOGR, 10);
    const a = Math.atan2(hy - ey, hx - ex2); g.save(); g.translate(hx - Math.cos(dir) * 4, hy - Math.sin(dir) * 4); g.rotate(a); S.part(g, SM([[-10, -8], [2, -9], [6, -3, 1], [2, 0, 1], [7, 4, 1], [2, 8], [-10, 8]], .6), FOGR, { x:-2, y:0, r:10 }, { flat:true, mat:'cloth' }); g.restore();
    bonyHand(g, hx, hy, BONE, dir, 12, 3.2, 6.5);
  }
  // fog leaking out between the bars and curling up past the shoulders
  { const t = (w ?? ch ?? (ex != null ? ex : 0)) % 1; for (let i = 0; i < 8; i++){ const k = (t + i / 8) % 1, s = i % 2 ? 1 : -1, x = s * (20 + k * 18) + Math.sin(i * 1.7 + k * TAU) * 3, y = cy - k * 70; puff(g, x, y, 5 + k * 9, (1 - k) * .85 * (1 - inh * .7) * Math.min(1, k * 5 + .3), '#eef7fc'); } }
  // hood: low and pushed forward between the shoulders, its brim drooping over a void face
  g.save(); g.translate(0, 5);
  const hood = SM([[0, -66], [-14, -62], [-25, -50], [-27, -32], [-21, -16], [0, -10], [21, -16], [27, -32], [25, -50], [14, -62]], .85);
  S.contact(g, robe, 0, -24, 28, 10, .45);
  S.part(g, hood, FOGR, { x:0, y:-38, r:28 }, { mat:'cloth', hx:-12, hy:-56 });
  S.crease(g, SO([[-6, -62], [-2, -54]]), FOGR, 1.6, .4);
  S.part(g, SM([[-20, -26], [-17, -46], [0, -53], [17, -46], [20, -26], [11, -15], [0, -12], [-11, -15]], .9), FOGRD, { x:0, y:-32, r:20 }, { flat:true, mat:'cloth', noEdge:true });
  const flare = ch != null ? press * .8 : blow > 0 ? Math.sin(blow * Math.PI) * 1.3 : inh * .4;
  voidFace(g, SM([[-16, -26], [-13, -43], [0, -49], [13, -43], [16, -26], [9, -16], [0, -14], [-9, -16]], .9), 7, -32, 3.4, CYAN2, flare);
  S.stroke(g, SO([[-21, -24], [-18, -46], [0, -55], [18, -46], [21, -24]]), { deep:FOGR.light }, 1.6, .4);   // the brim's lit edge
  g.restore(); g.restore();
  for (const [x, y, rr, al] of breath) puff(g, x, y, rr, al, '#dbe9f2');
  if (blow > 0){ const c = Math.sin(blow * Math.PI); puff(g, 0, cy + 10, 26 + blow * 10, c * .75, '#eaf6fc'); }
}

// ---------- registry ----------
// Plague Doctor 2 (r 22) keeps the Plague Doctor's scale .62 and dy -10 (its box is widened for the crow and the fog); the Reaper (r 21) is .56 like
// the Wraith with dy -8, and the archive's wide box so the sweep's crescent fits. The Reaper's chew is the 10-frame reap loop (not `once`).
const clipOf = (n, fps, key) => ({ n, fps, pose:t => ({ [key]:t }) });
export const HOLLOW = {
  rotdoctor: { draw:rotDoctor, scale:.62, dy:-10, box:{ x:-70, y:-74, w:140, h:130 }, clips:{ walk:clipOf(8, 7, 'walk'), chew:clipOf(4, 7, 'chew') }, still:{} },
  reaper: { draw:reaper, scale:.56, dy:-8, box:{ x:-96, y:-114, w:190, h:178 }, clips:{ walk:clipOf(8, 8, 'walk'), chew:clipOf(10, 14, 'reap') }, still:{} },
  // Fogwalker 2 (r 24): the archive's scale .66 (a bigger Fogwalker); its `exhale` plays when it brings its Mossbacks. The Mini Poltergeist (r 22) is small, .5;
  // its `toss` is the rot cast. The archive's flung-teacup projectile sprite is not ported (the rot puff on each pumpkin is the effect).
  fogwalker2: { draw:fogwalker2, scale:.66, dy:-11, box:{ x:-84, y:-80, w:168, h:142 }, clips:{ walk:clipOf(8, 7, 'walk'), chew:clipOf(4, 6, 'chew'), exhale:{ n:10, fps:12, once:true, pose:t => ({ exhale:t }) } }, still:{} },
  minipolt: { draw:minipolt, scale:.5, dy:-10, box:{ x:-52, y:-86, w:104, h:144 }, clips:{ walk:clipOf(12, 10, 'walk'), chew:clipOf(4, 8, 'chew'), toss:{ n:9, fps:14, once:true, pose:t => ({ toss:t }) } }, still:{} },
  ...COMET,
};
