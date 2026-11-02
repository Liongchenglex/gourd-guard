// ---------- Nightmare Drowned Marsh: the Kraken and the Drowned Pirate (design archive, not in the game) ----------
// Toy Plastic style (docs/ART_BRIEF.md). Drawing units, feet / waterline at y = 50.
// kraken(g, P)    the boss body: a violet mantle with huge red-irised eyes and a hooked beak, rising out of the crimson sea.
//                 Poses: P.surface 0..1 (rising, once), P.idle 0..1 (surfaced, breathing, looped), P.dive 0..1 (sinking, once).
// tentacle(g, P)  one of the Kraken's arms, a separate monster in its own lane: P.rise 0..1 (once), P.sway 0..1 (looped),
//                 P.throw 0..1 (once: coils back with a cursed anchor and flings it; the anchor leaves the tip at t = .55).
//                 P.flip mirrors it so arms on the left and right of the Kraken lean away from it.
// anchor(g, P)    the projectile: a rusted, barnacled cursed anchor with a red glow; P.spin 0..1 turns it.
// pirate(g, P)    fodder walker: P.walk 0..1, P.chew 0..1, P.shoot 0..1 (once: raise the flintlock, fire, recoil).
// No per-frame randomness: every scatter comes from rng(seed).

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';

// ---------- palettes (nightmare Drowned Marsh: blood moon, crimson sea) ----------
const KR = pal('#6a2c7a'), KRD = pal('#45195a'), KRU = pal('#f0b0b4'), SUCK = pal('#ffd8d0'), BEAK = pal('#3a2a2e'), BROW = pal('#52206a'),
  BARN = pal('#d8d0c0'), KELP = pal('#3a5a2a'), RUST = pal('#6a5a52'), RUSTO = '#b8582a', CHAIN = pal('#58504c'),
  EYEI = '#ff3a26', GLOW = '#ff3a26';
const SEA = { in:'rgba(196,30,42,.96)', out:'rgba(86,6,14,.8)', edge:'rgba(40,2,8,.85)', ring:'255,140,130', hi:'rgba(255,200,190,.45)', foam:'#ffc4bc', drop:'#e03848' };
// pirate
const DSKIN = pal('#a6c0a2'), COAT = pal('#2a2a4a'), TRIM = pal('#c8a048'), SASH = pal('#b0202a'), SHIRT = pal('#d8d0b8'), PANTS = pal('#6a5440'),
  BOOT = pal('#3a2a22'), PEG = pal('#9a6a3a'), HAT = pal('#25212e'), HOOK = pal('#b8b8c0'), GUN = pal('#5a3a26'), GUNM = pal('#8a8a96'), BEARD = pal('#3a5a30'), GOLD = '#ffd25a';

// ---------- shared helpers ----------
/** Wet sheen and drips on a clip shape. */
function wet(g, clip, b, drips = [], hi = 'rgba(255,255,255,.32)', dc = pal('#c8e8f0'), drop = '#e8f8ff'){ g.save(); clip(g); g.clip(); g.fillStyle = hi; ell(g, b.x - b.r * .3, b.y - b.r * .2, b.r * .32, b.r * .1, -.5); g.fill(); ell(g, b.x + b.r * .25, b.y + b.r * .3, b.r * .18, b.r * .06, -.4); g.fill(); g.restore();
  for (const [x, y, l] of drips){ S.tube(g, SO([[x, y], [x + 1, y + l]]), dc, 2.2); S.dot(g, E(x + 1, y + l + 1.5, 1.8, 2.2), drop, .9); } }
function barnacle(g, x, y, r = 4){ S.part(g, E(x, y, r, r * .8), BARN, { x, y, r }, { flat:true, mat:'stone', noEdge:true }); S.dot(g, E(x, y, r * .35, r * .3), '#3a3028', .9); }
function kelp(g, x, y, n = 3, len = 22, w = 4){ const R = rng(x * 3 + y * 5 + 7 | 0); for (let i = 0; i < n; i++){ const dx = (i - (n - 1) / 2) * 6 + (R() - .5) * 4, L = len * (.7 + R() * .6); S.tube(g, SO([[x + dx, y], [x + dx + (R() - .5) * 8, y + L * .5], [x + dx + (R() - .5) * 10, y + L]]), KELP, w); } }
function aboveWater(g, wl, fn){ g.save(); g.beginPath(); g.rect(-300, -400, 600, 400 + wl); g.clip(); fn(); g.restore(); }
/** Splash droplets flying up from (x, y); t 0..1 along the arc. */
function splash(g, x, y, t, seed = 1, n = 10, spread = 34, col = '#e03848'){
  if (t <= 0 || t >= 1) return;
  const R = rng(seed); g.save(); g.globalAlpha *= 1 - t * t;
  for (let i = 0; i < n; i++){ const a = -Math.PI * .92 + R() * Math.PI * .84, sp = spread * (.5 + R()), px = x + Math.cos(a) * sp * t, py = y + Math.sin(a) * sp * t + t * t * 46, r = 1.8 + R() * 2.4;
    S.dot(g, E(px, py, r, r * 1.3), col); S.dot(g, E(px - r * .3, py - r * .4, r * .35, r * .35), '#ffd0c8', .9); }
  g.restore();
}
/** Foam ring at the waterline. */
function foam(g, x, y, rx, ry, ph, n = 12, seed = 1, a = 1){
  const R = rng(seed); g.save(); g.globalAlpha *= a;
  for (let i = 0; i < n; i++){ const an = (i / n + ph * .15) * TAU, wob = 1 + Math.sin(ph * TAU * 2 + i * 1.7) * .12, px = x + Math.cos(an) * rx * wob, py = y + Math.sin(an) * ry * wob, r = 2.4 + R() * 3, al = .6 + R() * .3;
    S.dot(g, E(px, py, r, r * .7), SEA.foam, al); S.dot(g, E(px - r * .3, py - r * .3, r * .35, r * .3), '#fff', al); }
  g.restore();
}
/** Ripple rings on the water (only rings, the sea itself is the engine's). */
function ripples(g, x, y, rx, ry, ph, a = .8){ g.save(); g.lineWidth = 1.6; for (let i = 0; i < 2; i++){ const k = (ph + i * .5) % 1; g.strokeStyle = `rgba(${SEA.ring},${(1 - k) * a})`; ell(g, x, y, rx * (.45 + k * .6), ry * (.45 + k * .6)); g.stroke(); } g.restore(); }
/** Rising bubbles (dive). */
function bubbles(g, x, y, t, seed, n = 7, h = 60){ const R = rng(seed); for (let i = 0; i < n; i++){ const k = (t + R()) % 1, px = x + (R() - .5) * 60 + Math.sin(k * 9 + i) * 3, py = y - k * h * (.5 + R() * .5), r = 1.5 + R() * 3; g.strokeStyle = `rgba(255,200,190,${(1 - k) * .9})`; g.lineWidth = 1.1; ell(g, px, py, r, r); g.stroke(); S.dot(g, E(px - r * .3, py - r * .3, r * .3, r * .3), '#fff', (1 - k) * .8); } }

function crSample(pts, n){ const out = [], m = pts.length; for (let i = 0; i < m - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, m - 1)]; for (let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[m - 1]); return out; }
/** A tapered ribbon along a spline: { path, left, right, centre, w }. Left is the side the tip curls towards when angles increase. */
function ribbon(pts, wf, n = 6){ const c = crSample(pts, n), L = [], R = [], W = []; for (let i = 0; i < c.length; i++){ const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = wf(i / (c.length - 1)); W.push(w); L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); }
  const poly = [...L, ...R.slice().reverse()].map(p => [p[0], p[1]]); poly[0][2] = 1; poly[poly.length - 1][2] = 1; return { path:SM(poly, .5), left:L, right:R, centre:c, w:W }; }
/** A chain of segments from (x, y) starting at angle a0; curls[i] bends each joint. */
function spine(x, y, a0, segL, curls){ const pts = [[x, y]]; let a = a0; for (const c of curls){ a += c; x += Math.cos(a) * segL; y += Math.sin(a) * segL; pts.push([x, y]); } return pts; }
/** An octopus arm along spine points: violet top, pink underside on the curling side, suckers. `side` 1 = suckers on left, -1 = right. */
function arm(g, pts, w0, side = 1, seed = 1, tipW = 1.3){
  const rb = ribbon(pts, u => w0 * Math.pow(1 - u, .8) + tipW, 5), c = rb.centre, N = c.length;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of c){ x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  const b = { x:(x0 + x1) / 2, y:(y0 + y1) / 2, r:Math.max(x1 - x0, y1 - y0) / 2 + w0 };
  S.part(g, rb.path, KR, b, { mat:'skin', flat:true });
  const inner = side > 0 ? rb.left : rb.right;
  // the pink underside: a strip between the centre line (pushed a bit outward) and the inner edge
  const strip = [...inner.map(p => [p[0], p[1]]), ...c.map((p, i) => [p[0] + (p[0] - inner[i][0]) * .15, p[1] + (p[1] - inner[i][1]) * .15]).reverse()]; strip[0][2] = 1; strip[strip.length - 1][2] = 1;
  g.save(); rb.path(g); g.clip(); S.part(g, SM(strip, .5), KRU, b, { flat:true, noEdge:true, mat:'skin' }); g.restore();
  // a lit line along the top side
  const outer = side > 0 ? rb.right : rb.left; g.save(); g.strokeStyle = 'rgba(255,220,255,.32)'; g.lineWidth = Math.max(1, w0 * .18); g.lineCap = 'round'; g.beginPath(); for (let i = 1; i < N - 3; i++){ const p = [c[i][0] + (outer[i][0] - c[i][0]) * .5, c[i][1] + (outer[i][1] - c[i][1]) * .5]; i > 1 ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.restore();
  // suckers
  for (let i = 2; i < N - 2; i += 2){ const k = .6, px = c[i][0] + (inner[i][0] - c[i][0]) * k, py = c[i][1] + (inner[i][1] - c[i][1]) * k, r = rb.w[i] * .36; if (r < .9) continue;
    S.dot(g, E(px, py, r, r), SUCK.base); S.dot(g, E(px, py, r * .5, r * .5), mix(KRU.deep, '#3a0a1a', .3), .85); S.dot(g, E(px - r * .35, py - r * .4, r * .25, r * .2), '#fff', .8); }
  // a few dark spots on top
  const R = rng(seed); for (let i = 3; i < N - 4; i += 3){ const k = .45 + R() * .2, px = c[i][0] + (outer[i][0] - c[i][0]) * k, py = c[i][1] + (outer[i][1] - c[i][1]) * k, r = rb.w[i] * (.18 + R() * .12); S.dot(g, E(px, py, r, r * .8, R() * 3), KRD.deep, .45); }
  return rb;
}

// ---------- the cursed anchor (projectile prop) ----------
export function anchor(g, P = {}){
  const sp = (P.spin ?? 0) * TAU;
  g.save(); g.rotate(sp);
  // cursed glow behind it (baked once into the prop sprite)
  g.save(); g.shadowColor = GLOW; g.shadowBlur = 9;   // cursed glow: a red halo around every main part (baked once)
  // chain stub from the ring
  for (let i = 0; i < 3; i++){ const y = -26 - i * 6, x = Math.sin(i * 1.3) * 2; g.save(); g.translate(x, y); g.rotate(i % 2 ? .2 : -.2); S.part(g, E(0, 0, i % 2 ? 1.8 : 3, 3.8), CHAIN, { x:0, y:0, r:4 }, { flat:true, mat:'metal', lw:1 }); S.dot(g, E(0, 0, i % 2 ? .6 : 1.4, 2), '#1a1418', .9); g.restore(); }
  // ring, shank, stock
  g.save(); ell(g, 0, -19, 5.5, 5.5); g.strokeStyle = rgba(RUST.deep, .9); g.lineWidth = 4.6; g.stroke(); ell(g, 0, -19, 5.5, 5.5); g.strokeStyle = RUST.base; g.lineWidth = 3; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = .8; g.beginPath(); g.arc(0, -19, 5.5, Math.PI * 1.1, Math.PI * 1.6); g.stroke(); g.restore();
  S.part(g, RR(-14, -14, 28, 5, 2.5), RUST, { x:0, y:-12, r:14 }, { flat:true, mat:'metal', lw:1.2 });
  S.part(g, RR(-3.2, -15, 6.4, 34, 3), RUST, { x:0, y:2, r:16 }, { mat:'metal', hx:-1, hy:-6 });
  // arms with flukes
  const arms = SM([[-22, 4, 1], [-18, 13], [-8, 21], [0, 23], [8, 21], [18, 13], [22, 4, 1], [16, 9], [8, 15], [0, 16], [-8, 15], [-16, 9]], .7);
  S.part(g, arms, RUST, { x:0, y:12, r:20 }, { flat:true, mat:'metal', lw:1.3 });
  for (const s of [-1, 1]) S.part(g, PL([[s * 24, -1], [s * 17, 6], [s * 26, 9]]), RUST, { x:s * 22, y:4, r:6 }, { flat:true, mat:'metal', lw:1.1 });
  S.part(g, PL([[-3, 20], [3, 20], [0, 27]]), RUST, { x:0, y:22, r:4 }, { flat:true, mat:'metal', lw:1 });
  g.restore();
  // rust blooms, barnacles, a strand of weed, and a glowing red crack
  const R = rng(77); for (let i = 0; i < 6; i++) S.dot(g, E(-12 + R() * 24, -12 + R() * 30, 1.2 + R() * 1.6, 1 + R(), R() * 3), RUSTO, .55);
  barnacle(g, 10, 13, 2.6); barnacle(g, -2, -2, 2.2); barnacle(g, -15, 11, 2);
  S.tube(g, SO([[-12, -12], [-15, -4], [-13, 4]]), KELP, 2.2);
  g.save(); g.shadowColor = GLOW; g.shadowBlur = 6; g.strokeStyle = '#ff6a50'; g.lineWidth = 1.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -10); g.lineTo(1.5, -3); g.lineTo(-1, 3); g.lineTo(1, 10); g.stroke(); g.restore();
  g.restore();
}

// ---------- the Kraken body ----------
/** The surfaced head-and-mantle; o: br (breath -1..1), sw (sway -1..1), eye (open 0..1), beak (0..1), look (-1..1), armPh 0..1, strain (0..1, the dive squeeze). */
function krakenBody(g, o){
  const br = o.br ?? 0, sw = o.sw ?? 0, op = o.eye ?? 1, bk = o.beak ?? .2, ap = (o.armPh ?? 0) * TAU, st = o.strain ?? 0, lk = o.look ?? 0;
  // back arms (behind the body): a low arch over the water and a tall arm whose tip curls up above the brows
  for (const s of [-1, 1]){ const pB = ap + (s > 0 ? 2.1 : .3), pA = ap + (s > 0 ? 1 : 0), side = s > 0 ? 1 : -1;
    arm(g, spine(s * 74, 64, -Math.PI / 2 + s * .5, 9, [0, .25, .35, .45, .55, .6].map((c, i) => s * (c + Math.sin(pB + i * .7) * .07))), 10, side, 37 + (s > 0 ? 3 : 0));
    arm(g, spine(s * 62, 66, -Math.PI / 2 - s * (.15 + Math.sin(pA) * .05), 15, [0, .03, .05, .07, .1, .16, .3, .5, .7, .9].map((c, i) => s * (c + Math.sin(pA + i * .6) * .05))), 13, side, 31 + (s > 0 ? 3 : 0)); }
  g.save(); g.translate(0, 44); g.rotate(sw * .03); g.scale(1 + br * .025, 1 - br * .03 - st * .05); g.translate(0, -44);
  // the mantle: a tall tapering sack that bends back and droops its tip to the right; the tip sways with the breath
  const spn = [[0, 50], [-2, 0], [-8, -48], [-2, -88], [16 + sw * 6, -110 + br * 2], [38 + sw * 10, -110 + br * 3], [52 + sw * 13, -94 + br * 4]];
  const mb = ribbon(spn, u => 3 + 51 * Math.pow(Math.cos(u * Math.PI / 2), .85), 6), mantle = mb.path, MB = { x:-4, y:-44, r:86 };
  S.part(g, mantle, KR, MB, { mat:'skin', hx:-26, hy:-74 });
  g.save(); mantle(g); g.clip();
  const R = rng(5); for (let i = 0; i < 18; i++){ const k = 2 + Math.floor(R() * (mb.centre.length - 6)), c = mb.centre[k], w = mb.w[k] * .8, x = c[0] + (R() - .5) * w * 2, y = c[1] + (R() - .5) * 12, r = 2.2 + R() * 4.5; S.dot(g, E(x, y, r, r * .75, R() * 3), KRD.deep, .3 + R() * .2); }
  // two ridges running up the mantle, following its bend
  for (const off of [-.42, .3]){ const pts = []; for (let i = 3; i < mb.centre.length - 3; i++){ const c = mb.centre[i], l = mb.left[i]; pts.push([c[0] + (l[0] - c[0]) * off, c[1] + (l[1] - c[1]) * off]); } S.crease(g, SO(pts), KR, 2.6, .5); }
  // glowing red veins (the curse) faint under the skin
  g.shadowColor = GLOW; g.shadowBlur = 6; g.strokeStyle = 'rgba(255,70,50,.55)'; g.lineWidth = 1.3; g.lineCap = 'round';
  for (const pts of [[[-32, -78], [-26, -64], [-32, -50], [-28, -38]], [[6, -104], [10, -88], [4, -74]], [[36, -48], [30, -36], [36, -24]]]){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
  g.shadowBlur = 0;
  // gill folds behind the eyes
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++){ const y = -6 + i * 9; S.crease(g, SO([[s * 42, y - 4], [s * 48, y], [s * 50, y + 6]]), KR, 2.2, .6); S.dot(g, E(s * 47, y + 1, 1.3, 4, -s * .4), '#1a0618', .55); }
  S.contact(g, mantle, 0, 50, 60, 14, .45);
  g.restore();
  barnacle(g, -40, -44, 4.4); barnacle(g, -34, -54, 3); barnacle(g, 30, -76, 3.4); barnacle(g, 42, -30, 3); barnacle(g, -10, -96, 3);
  kelp(g, -50, -34, 2, 18, 3.6);
  wet(g, mantle, MB, [[-53, 6, 8], [52, 0, 7]], 'rgba(255,220,240,.3)', pal('#d8a8c8'), '#ffd8e0');
  // the eyes: huge, red-irised, glowing slit pupils, angled lids
  for (const s of [-1, 1]){ const ex = s * 25, ey = -2;
    S.dot(g, E(ex, ey, 19, 20), KRD.deep, .55);
    const lid = Math.min(1, .26 + (1 - op) * .74 + st * .4);
    S.eye(g, ex, ey, 16, 17, { pr:.46, lx:lk * .3 - s * .06, ly:.15, iris:EYEI, pupil:'#3a0408', lid, lidCol:KR.base, lidDeep:KR.deep, tilt:-s * .38 });
    if (op > .3){ const px = ex + lk * 4.8 - s * 1, py = ey + 3; g.save(); ell(g, ex, ey, 16, 17); g.clip(); g.globalAlpha *= op; g.shadowColor = '#ff3a26'; g.shadowBlur = 8; g.fillStyle = '#ffb02a'; ell(g, px, py, 2.4, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = '#fff2b0'; ell(g, px, py, .9, 5); g.fill(); g.restore(); } }
  // heavy brows angled down to the middle
  for (const s of [-1, 1]) S.part(g, SM([[s * 4, -10 + st * 2], [s * 14, -18], [s * 40, -32 - st * 2], [s * 52, -28], [s * 48, -19], [s * 22, -8 + st * 3], [s * 9, -3]], .7), BROW, { x:s * 28, y:-18, r:26 }, { mat:'skin', lw:1.5, hx:s * 24 - 6, hy:-22 });
  // the open maw low on the body: a wide fleshy lip ring, a red throat ringed with hooked teeth, and the parrot beak inside
  const gap = 2 + bk * 7, my = 33;
  const lip = SM([[-30, my], [-18, my - 13 - gap * .3], [0, my - 16 - gap * .4], [18, my - 13 - gap * .3], [30, my], [18, my + 13 + gap * .3], [0, my + 16 + gap * .4], [-18, my + 13 + gap * .3]], .9);
  S.part(g, lip, KRU, { x:0, y:my, r:30 }, { flat:true, mat:'skin', lw:1.6 });
  for (let i = 0; i < 14; i++){ const a = i / 14 * TAU; S.ln(g, [[Math.cos(a) * 22, my + Math.sin(a) * (11 + gap * .5)], [Math.cos(a) * 28, my + Math.sin(a) * (14 + gap * .4)]], KRU, 1.3, .55); }
  const rx = 21, ry = 9 + gap * .7, maw = E(0, my, rx, ry);
  S.dot(g, maw, '#4a0818'); g.save(); maw(g); g.clip(); const tg = g.createRadialGradient(0, my, 1, 0, my, rx); tg.addColorStop(0, '#0c0006'); tg.addColorStop(.55, '#2a0410'); tg.addColorStop(1, '#6a1028'); g.fillStyle = tg; g.fillRect(-rx, my - ry, rx * 2, ry * 2); g.restore();
  g.strokeStyle = 'rgba(40,0,10,.8)'; g.lineWidth = 1.4; ell(g, 0, my, rx, ry); g.stroke();
  // a ring of small hooked teeth around the rim, pointing in
  for (let i = 0; i < 14; i++){ const a = i / 14 * TAU + .1, x = Math.cos(a) * rx, y = my + Math.sin(a) * ry, ix = -Math.cos(a), iy = -Math.sin(a) * ry / rx, n = Math.hypot(ix, iy), dx = ix / n, dy = iy / n, L = 4.5;
    S.dot(g, PL([[x - dy * 1.7, y + dx * 1.7], [x + dy * 1.7, y - dx * 1.7], [x + dx * L + dy * 1.2, y + dy * L - dx * 1.2]]), '#f4e8dc'); }
  // the beak: lower jaw (point up) under the upper hook (point down), the gap between them opening on the clack
  g.save(); g.translate(0, my + 2 + gap * .45); g.scale(.85, .85);
  S.part(g, SM([[-9, -1], [-3, 1], [0, -4, 1], [3, 1], [9, -1], [7, 5], [0, 8], [-7, 5]], .8), BEAK, { x:0, y:3, r:9 }, { mat:'horn', hx:-4, hy:1 });
  g.restore();
  g.save(); g.translate(0, my - 4 - gap * .45); g.scale(.85, .85);
  const upper = SM([[-11, -5], [0, -8], [11, -5], [10, 1], [5, 5], [2, 10], [0, 13, 1], [-2, 10], [-5, 5], [-10, 1]], .8);
  S.part(g, upper, BEAK, { x:0, y:0, r:12 }, { mat:'horn', hx:-4, hy:-4 });
  S.ln(g, [[-8, -1], [0, 2], [8, -1]], BEAK, 1, .6); g.fillStyle = 'rgba(255,255,255,.6)'; ell(g, 4, -4, 3.2, 1.2, .3); g.fill(); ell(g, 1, 7, .8, 2.4); g.fill();
  g.restore();
  g.restore();
  // big front arms rising out of the water on both sides of the mouth, sucker rows facing out, tips curling outward
  for (const s of [-1, 1]){ const c = Math.sin(ap + (s > 0 ? 2.4 : .6)) * .06; arm(g, spine(s * 32, 70, -Math.PI / 2 + s * .3, 13, [0, .04, .07, .11, .28, .5, .75, .9].map(k => s * (k + c))), 13, s > 0 ? 1 : -1, 61 + (s > 0 ? 2 : 0)); }
}
export function kraken(g, P = {}){
  const WL = 50;
  let sink = 0, eye = 1, beak = .2, br = 0, sw = 0, look = 0, armPh = 0, strain = 0, ph = 0;
  if (P.surface != null){ const t = P.surface, e = 1 - Math.pow(1 - t, 2.2); sink = (1 - e) * 175; eye = t < .65 ? 0 : (t - .65) / .35; beak = t > .8 ? (t - .8) * 3 : 0; armPh = t * .5; ph = t; br = Math.sin(t * Math.PI) * .6; }
  else if (P.dive != null){ const t = P.dive, e = t * t; sink = e * 180; strain = Math.min(1, t * 3); eye = 1 - Math.min(1, t * 2.2); beak = .4 * (1 - t); armPh = .5 + t * .4; ph = t; br = -Math.min(1, t * 2); }
  else { const t = P.idle ?? 0; br = Math.sin(t * TAU); sw = Math.sin(t * TAU + .8); beak = .1 + Math.max(0, Math.sin(t * TAU * 2)) * .9; look = Math.sin(t * TAU) * .8; armPh = t; ph = t; eye = 1; }
  aboveWater(g, WL, () => { g.translate(0, sink); krakenBody(g, { br, sw, eye, beak, look, armPh, strain }); });
  // the waterline: foam, ripples, splashes and bubbles (the sea itself is drawn by the engine)
  const ext = P.surface != null || P.dive != null ? Math.max(.25, 1 - sink / 180) : 1;
  ripples(g, 0, WL + 2, 96 * ext + 10, 13, ph * .9, .7);
  foam(g, 0, WL + 2, 62 * ext + 8, 8, ph, 16, 3, .4 + ext * .6);
  if (P.surface != null){ splash(g, 0, WL, Math.min(.999, P.surface * 1.25), 4, 18, 70); splash(g, 0, WL, Math.max(0, P.surface * 1.6 - .6), 8, 12, 46); }
  if (P.dive != null){ splash(g, 0, WL, Math.max(0, P.dive * 1.3 - .3), 6, 14, 48); bubbles(g, 0, WL, P.dive, 9, 9, 50 * P.dive); }
}

// ---------- a Kraken tentacle (its own lane, rises when the body dives) ----------
const TSEG = 15, TN = 8;
/** Curl profile: a gentle S near the base and a tight hook at the tip; `bend` shifts the whole arm, `hook` the tip. */
function tentCurls(bend, hook, wave){ const c = []; for (let i = 0; i < TN; i++){ const u = i / (TN - 1); c.push(bend * (1 - u) * .22 + Math.sin(wave + i * .75) * .1 * (1 - u * .4) + hook * Math.pow(u, 2.2) * .8); } c[0] = 0; return c; }
export function tentacle(g, P = {}){
  const WL = 50; let a0 = -Math.PI / 2, bend = 0, hook = .9, wave = 0, sink = 0, hold = false, holdT = 0, ph = 0, swoosh = 0, fling = 0;
  if (P.rise != null){ const t = P.rise, e = 1 - Math.pow(1 - t, 2); sink = (1 - e) * 140; hook = 1.6 - e * .7; bend = -(1 - t) * .5; wave = t * 2; ph = t; }
  else if (P.throw != null){ const k = P.throw; ph = k;
    if (k < .45){ const e = Math.sin(k / .45 * Math.PI / 2); a0 = -Math.PI / 2 - e * .55; bend = -e * 1.6; hook = .9 + e * .8; wave = 0; hold = true; holdT = e; }
    else if (k < .7){ const e = (k - .45) / .25, s = e * e * (3 - 2 * e); a0 = -Math.PI / 2 - .55 + s * .85; bend = -1.6 + s * 1.9; hook = 1.7 - s * 2.0; wave = 0; hold = k < .55; holdT = 1; swoosh = Math.sin(e * Math.PI); fling = e; }
    else { const e = (k - .7) / .3, s = e * e * (3 - 2 * e); a0 = -Math.PI / 2 + .3 * (1 - s); bend = .3 * (1 - s); hook = -.3 + 1.33 * s; wave = 0; }
  } else { const t = P.sway ?? 0; ph = t; wave = -t * TAU; bend = Math.sin(t * TAU) * .5; hook = .9 + Math.sin(t * TAU + 1) * .15; a0 = -Math.PI / 2 + Math.sin(t * TAU) * .08; }
  g.save(); if (P.flip) g.scale(-1, 1);
  aboveWater(g, WL, () => {
    g.translate(0, sink);
    const pts = spine(0, WL + 22, a0, TSEG, tentCurls(bend, hook, wave));
    // swoosh trail behind the whip
    if (swoosh > .05){ g.save(); g.globalAlpha *= swoosh * .7; g.lineCap = 'round'; for (let i = 0; i < 3; i++){ g.strokeStyle = `rgba(255,190,190,${.5 - i * .14})`; g.lineWidth = 3 - i * .8; g.beginPath(); g.arc(0, WL + 22, 100 + i * 9, -Math.PI * .78, -Math.PI * (.78 - .4 * fling)); g.stroke(); } g.restore(); }
    const tip = pts[pts.length - 1], pre = pts[pts.length - 2];
    if (hold){ g.save(); g.translate(tip[0] + (tip[0] - pre[0]) * .2, tip[1] + (tip[1] - pre[1]) * .2 + 6); g.scale(.8, .8); anchor(g, { spin:-.08 - holdT * .1 }); g.restore(); }
    arm(g, pts, 15, 1, 101, 1.6);
    barnacle(g, pts[2][0] - 6, pts[2][1] + 4, 3); barnacle(g, pts[3][0] - 5, pts[3][1], 2.4);
    wet(g, g2 => { g2.beginPath(); g2.rect(-200, -200, 400, 400); }, { x:pts[3][0], y:pts[3][1], r:30 }, [[pts[1][0] - 8, pts[1][1], 6]], 'rgba(0,0,0,0)', pal('#d8a8c8'), '#ffd8e0');
    // once released (t >= .55) the anchor is the engine's projectile, drawn from the `anchor` prop
  });
  ripples(g, 0, WL + 2, 26, 7, ph, .8); foam(g, 0, WL + 2, 18, 5, ph, 9, 5, .9);
  if (P.rise != null) splash(g, 0, WL, Math.min(.999, P.rise * 1.3), 12, 10, 32);
  g.restore();
}

// ---------- the Drowned Pirate ----------
function tricorn(g){
  const hat = SM([[-34, -46, 1], [-24, -50], [-18, -66], [0, -72], [18, -66], [24, -50], [34, -46, 1], [22, -42], [8, -40], [0, -34, 1], [-8, -40], [-22, -42]], .8);
  S.part(g, hat, HAT, { x:0, y:-56, r:34 }, { mat:'cloth', hx:-10, hy:-64 });
  // upturned brim: gold-trimmed edge
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = TRIM.dark; g.lineWidth = 3.2; g.beginPath(); g.moveTo(-34, -46); g.quadraticCurveTo(-22, -40, -8, -40); g.lineTo(0, -34); g.lineTo(8, -40); g.quadraticCurveTo(22, -40, 34, -46); g.stroke(); g.strokeStyle = TRIM.light; g.lineWidth = 1.5; g.stroke(); g.restore();
  S.crease(g, SO([[-22, -48], [-14, -58], [-4, -62]]), HAT, 1.6, .5); S.crease(g, SO([[22, -48], [14, -58], [4, -62]]), HAT, 1.6, .5);
  // skull and crossbones badge
  for (const s of [-1, 1]) S.tube(g, SO([[s * -6, -46], [s * 6, -57]]), pal('#e4dcc8'), 1.4);
  S.part(g, E(0, -52, 5.2, 4.8), pal('#ece4d0'), { x:0, y:-52, r:5 }, { flat:true, mat:'bone', lw:1 }); for (const s of [-1, 1]) S.dot(g, E(s * 1.9, -52.5, 1.3, 1.5), '#1a1418'); S.dot(g, PL([[-2.6, -49], [2.6, -49], [2, -47.2], [-2, -47.2]]), '#ece4d0'); S.ln(g, [[-1, -49], [-1, -47.5]], pal('#1a1418'), .6, .8); S.ln(g, [[1, -49], [1, -47.5]], pal('#1a1418'), .6, .8);
  barnacle(g, -20, -60, 3); barnacle(g, -15, -64, 2.2); barnacle(g, 24, -50, 2.4);
  wet(g, hat, { x:0, y:-56, r:34 }, [], 'rgba(255,255,255,.22)'); kelp(g, -26, -45, 1, 9, 2.6);
}
function pirateHead(g, jaw, look = 0){
  const head = SM([[-22, -40], [-25, -22], [-20, -6], [-8, 2], [0, 3], [8, 2], [20, -6], [25, -22], [22, -40], [12, -46], [-12, -46]]);
  S.part(g, head, DSKIN, { x:0, y:-24, r:25 }, { mat:'skin', hx:-10, hy:-36 });
  S.contact(g, head, -15, -10, 7, 9, .38); S.contact(g, head, 15, -10, 7, 9, .38);
  for (const [x, y, r] of [[-16, -32, 3], [18, -6, 2.4], [8, -40, 2.2]]) S.dot(g, E(x, y, r, r * .7), DSKIN.deep, .18);
  // stitched scar across the cheek
  S.ln(g, [[10, -14], [20, -22]], DSKIN, 1.3, .7); for (const k of [.2, .5, .8]){ const x = 10 + k * 10, y = -14 - k * 8; S.ln(g, [[x - 2, y - 2.5], [x + 2, y + 2.5]], pal('#3a2a2a'), .9, .8); }
  // eye patch over the left eye, a huge glaring right eye
  S.ln(g, [[-24, -36], [-6, -30], [24, -42]], pal('#1a1418'), 1.8, .95);
  S.part(g, SM([[-18, -34], [-6, -34], [-5, -24], [-12, -20], [-19, -26]], .8), pal('#1e1a22'), { x:-12, y:-28, r:8 }, { flat:true, mat:'leather', lw:1 });
  S.eye(g, 9, -28, 9.5, 10, { pr:.38, lx:look * .3 - .05, ly:.2, iris:'#ff3a26', pupil:'#2a0608', lid:.22, tilt:.3, lidCol:DSKIN.base, lidDeep:DSKIN.deep });
  S.ln(g, [[1, -40], [17, -37]], DSKIN, 2.2, .7);
  for (const s of [-1, 1]) S.dot(g, E(s * 2, -18, 1, 1.8, s * .3), DSKIN.deep, .7);
  // kelp-weed beard around a gap-toothed grin with one gold tooth
  const R = rng(13);
  const bj = jaw * 4, beard = SM([[-18, -12], [-12, -8], [12, -8], [18, -12], [16, -2 + bj], [10, 5 + bj], [6, 10 + bj, 1], [2, 5 + bj], [0, 13 + bj, 1], [-3, 5 + bj], [-7, 10 + bj, 1], [-10, 4 + bj], [-16, -2 + bj]], .7);
  S.part(g, beard, BEARD, { x:0, y:-1, r:16 }, { flat:true, mat:'moss', lw:1.2 });
  for (let i = 0; i < 4; i++){ const x = -12 + i * 8 + (R() - .5) * 2; S.tube(g, SO([[x, 2 + bj], [x + (R() - .5) * 3, 8 + bj], [x + (R() - .5) * 4, 13 + bj + R() * 3]]), BEARD, 1.6); }
  const J = jaw * 7;
  const mouth = SM([[-13, -12], [-6, -9 + J * .6], [0, -8 + J], [6, -9 + J * .6], [13, -12], [6, -13], [0, -13.5], [-6, -13]], .7);
  S.dot(g, mouth, '#170c10'); if (jaw > .3) S.dot(g, E(0, -9 + J * .6, 5, 1.6 + J * .2), '#5a2a3a', .8);
  for (const [x, c] of [[-9, '#e8e4cc'], [-4, '#e8e4cc'], [2, GOLD], [8, '#d8d4b0']]) { S.dot(g, RR(x - 1.6, -13.2, 3.2, 3.6, .8), c); if (c === GOLD) S.dot(g, E(x - .5, -12, .7, 1), '#fff', .9); }
  for (const x of [-6, 4]) S.dot(g, RR(x - 1.4, -9.5 + J - 2.6, 2.8, 2.8, .7), '#d8d4b0');
  wet(g, head, { x:0, y:-24, r:25 }, [[23, -16, 4]], 'rgba(255,255,255,.3)');
  tricorn(g);
}
function flintlock(g, x, y, ang, s = 1){
  g.save(); g.translate(x, y); g.rotate(ang);
  // grip down-back, barrel forward along +x
  S.part(g, SM([[-4, -2], [4, -3], [6, 2], [-2, 10], [-8, 12], [-9, 8]], .7), GUN, { x:-2, y:4, r:8 }, { flat:true, mat:'wood', lw:1.1 });
  S.part(g, RR(2, -4, 22, 4.6, 2), GUNM, { x:12, y:-2, r:12 }, { flat:true, mat:'metal', lw:1.1 });
  S.part(g, RR(2, -1, 15, 3, 1.2), GUN, { x:9, y:0, r:8 }, { flat:true, mat:'wood', noEdge:true });
  S.part(g, E(24, -1.7, 2.2, 2.8), GUNM, { x:24, y:-2, r:3 }, { flat:true, mat:'metal', lw:.9 });
  S.part(g, PL([[0, -4], [4, -9], [6, -8], [3, -3]]), GUNM, { x:3, y:-6, r:4 }, { flat:true, mat:'metal', lw:.8 });
  S.rivet(g, 4, -1, 1.2, TRIM);
  g.restore();
}
export function pirate(g, P = {}){
  const w = P.walk, ch = P.chew, sh = P.shoot;
  const ph = w == null ? 0 : w * TAU, sw = w == null ? 0 : Math.sin(ph), cs = ch == null ? 0 : Math.sin(ch * TAU);
  // the hobble: the body dips and lists when the peg leg takes the weight
  const pegDown = w == null ? 0 : Math.max(0, -Math.sin(ph)), bob = w != null ? -Math.abs(sw) * 2.5 + pegDown * 2 : cs * 2.5;
  let list = w != null ? pegDown * .1 - .03 : cs * .06, lean = ch != null ? .08 + Math.abs(cs) * .06 : 0;
  let aimK = 0, fire = 0, recoil = 0; if (sh != null){ if (sh < .4) aimK = Math.sin(sh / .4 * Math.PI / 2); else { aimK = 1; const k = (sh - .4) / .6; fire = k < .25 ? k / .25 : Math.max(0, 1 - (k - .25) / .5); recoil = k < .2 ? k / .2 : Math.max(0, 1 - (k - .2) / .6); } list = -.06 - recoil * .05; }
  S.shadow(g, 2, 50, 30, 6);
  // legs: a booted left leg and a pegged right leg
  { const s = -1, p2 = ph, lift = w == null ? 0 : Math.max(0, Math.sin(p2)) * 7, dx = w == null ? -2 : Math.cos(p2) * 6;
    const leg = SM([[-4, 18], [-18, 18], [-20 + dx, 40 - lift], [-8 + dx, 40 - lift]], .5); S.part(g, leg, PANTS, { x:-12 + dx * .5, y:30, r:13 }, { flat:true, mat:'cloth' });
    S.part(g, SM([[-21 + dx, 34 - lift], [-7 + dx, 34 - lift], [-6 + dx, 46 - lift], [-24 + dx, 48 - lift], [-25 + dx, 44 - lift]], .6), BOOT, { x:-15 + dx, y:42 - lift, r:11 }, { mat:'leather', hx:-18 + dx, hy:38 - lift });
    S.part(g, RR(-22 + dx, 32 - lift, 17, 5, 2), pal('#4a3a30'), { x:-14 + dx, y:34 - lift, r:9 }, { flat:true, mat:'leather', lw:1 }); }
  { const p2 = ph + Math.PI, lift = w == null ? 0 : Math.max(0, Math.sin(p2)) * 4, dx = w == null ? 2 : Math.cos(p2) * 5;
    const stump = SM([[4, 18], [18, 18], [17 + dx * .4, 31], [6 + dx * .4, 31]], .5); S.part(g, stump, PANTS, { x:11, y:24, r:10 }, { flat:true, mat:'cloth' }); S.thread(g, 8 + dx * .4, 31, -1, PANTS); S.thread(g, 15 + dx * .4, 31, 1, PANTS);
    S.part(g, RR(5 + dx * .4, 29, 13, 5, 2), pal('#5a4030'), { x:11, y:31, r:7 }, { flat:true, mat:'leather', lw:1 });
    S.part(g, PL([[7 + dx * .4, 33], [16 + dx * .4, 33], [12.5 + dx, 50 - lift], [10.5 + dx, 50 - lift]]), PEG, { x:11 + dx * .7, y:41, r:9 }, { flat:true, mat:'wood', lw:1.1 });
    S.part(g, E(11.5 + dx, 50 - lift, 2.6, 1.6), PEG.dark ? pal(PEG.dark) : PEG, { x:11.5 + dx, y:50 - lift, r:3 }, { flat:true, mat:'wood', lw:.8 }); barnacle(g, 13 + dx * .6, 40, 1.8); }
  g.save(); g.translate(0, 20 + bob); g.rotate(list + lean); g.translate(0, -20);
  // coat with tails, open over a ragged shirt, red sash
  const coat = SM([[-20, -8], [-26, 6], [-30, 30, 1], [-20, 26], [-12, 32, 1], [12, 32, 1], [20, 26], [30, 30, 1], [26, 6], [20, -8], [8, -12], [-8, -12]], .8);
  S.part(g, coat, COAT, { x:0, y:8, r:30 }, { mat:'cloth', hx:-12, hy:-2 });
  const shirt = SM([[-8, -11], [8, -11], [10, 6], [6, 22], [-6, 22], [-10, 6]], .8); S.part(g, shirt, SHIRT, { x:0, y:4, r:14 }, { flat:true, mat:'cloth', lw:1.2 });
  S.crease(g, SO([[-3, -6], [-1, 8]]), SHIRT, 1.2, .35); S.thread(g, -4, 22, -1, SHIRT); S.thread(g, 4, 22, 1, SHIRT);
  S.part(g, SM([[-24, 12], [24, 12], [24, 20], [-24, 20]], .5), SASH, { x:0, y:16, r:24 }, { flat:true, mat:'cloth', lw:1.2 }); S.part(g, SM([[-17, 18], [-13, 18], [-12, 30], [-15, 33, 1], [-19, 30]], .6), SASH, { x:-15, y:25, r:8 }, { flat:true, mat:'cloth', lw:1 });
  S.part(g, RR(-5, 12.5, 10, 7, 1.5), TRIM, { x:0, y:16, r:6 }, { flat:true, mat:'metal', lw:1 });
  for (const s of [-1, 1]){ S.ln(g, [[s * 9, -10], [s * 12, 10]], TRIM, 2.2, .9); for (const y of [-4, 4]) S.rivet(g, s * 13, y, 1.5, TRIM); }
  g.save(); coat(g); g.clip(); S.dot(g, PL([[-30, 30], [-24, 22], [-26, 32]]), '#0c0a14'); S.dot(g, PL([[26, 32], [22, 25], [30, 29]]), '#0c0a14'); g.restore();
  barnacle(g, -18, -4, 2.6); barnacle(g, 22, 22, 2.2); barnacle(g, 19, 26, 1.6);
  wet(g, coat, { x:0, y:8, r:30 }, [], 'rgba(255,255,255,.25)');
  // left arm: the hook (swings on the walk, slashes on the chew)
  const hs = w != null ? Math.sin(ph + Math.PI) * .25 : ch != null ? -.5 + Math.abs(cs) * 1.1 : sh != null ? .15 : 0;
  g.save(); g.translate(-20, -6); g.rotate(hs); g.translate(20, 6);
  S.part(g, SM([[-18, -10], [-28, -4], [-32, 14], [-24, 16], [-20, 2]], .7), COAT, { x:-24, y:2, r:10 }, { flat:true, mat:'cloth' });
  S.part(g, RR(-34, 13, 12, 6, 2), TRIM, { x:-28, y:16, r:6 }, { flat:true, mat:'cloth', lw:1 });
  S.part(g, RR(-31, 18, 6, 5, 1.5), pal('#3a2a22'), { x:-28, y:20, r:4 }, { flat:true, mat:'leather', lw:.9 });
  g.save(); g.lineCap = 'round'; const hk = g2 => { g2.beginPath(); g2.moveTo(-28, 22); g2.lineTo(-28, 28); g2.arc(-23, 28, 5, Math.PI, Math.PI * .1, true); }; hk(g); g.strokeStyle = rgba(HOOK.deep, .9); g.lineWidth = 4.2; g.stroke(); hk(g); g.strokeStyle = HOOK.base; g.lineWidth = 2.6; g.stroke(); hk(g); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = .8; g.translate(-.6, -.6); g.stroke(); g.restore();
  g.restore();
  // right arm: the flintlock, hanging on the walk, raised and aimed down-lane on the shoot
  if (sh == null){ const as = w != null ? Math.sin(ph) * .2 : ch != null ? cs * .15 : 0;
    g.save(); g.translate(20, -6); g.rotate(as); g.translate(-20, 6);
    S.part(g, SM([[18, -10], [28, -4], [32, 14], [24, 16], [20, 2]], .7), COAT, { x:24, y:2, r:10 }, { flat:true, mat:'cloth' });
    S.part(g, RR(22, 13, 12, 6, 2), TRIM, { x:28, y:16, r:6 }, { flat:true, mat:'cloth', lw:1 });
    flintlock(g, 28, 22, 1.25); S.hand(g, 28, 21, DSKIN, Math.PI / 2, 3, 5);
    g.restore(); }
  else { const ang = -1.25 + aimK * 1.6 - recoil * .55, sx = 20, sy = -6, L1 = 15, L2 = 15, ea = ang + .25, ex = sx + Math.cos(ea) * L1, ey = sy + Math.sin(ea) * L1, hx = ex + Math.cos(ang) * L2, hy = ey + Math.sin(ang) * L2;
    S.tube(g, SO([[sx, sy], [ex, ey]]), COAT, 10); S.tube(g, SO([[ex, ey], [hx - Math.cos(ang) * 3, hy - Math.sin(ang) * 3]]), COAT, 8.5);
    S.part(g, E(hx - Math.cos(ang) * 4, hy - Math.sin(ang) * 4, 4.5, 4.5), TRIM, { x:hx, y:hy, r:4.5 }, { flat:true, mat:'cloth', lw:1 });
    const ga = ang + .1; flintlock(g, hx, hy, ga); S.hand(g, hx, hy, DSKIN, ga + .6, 3, 5);
    const mx = hx + Math.cos(ga) * 27 - Math.sin(ga) * -2, my = hy + Math.sin(ga) * 27 + Math.cos(ga) * -2;
    if (fire > 0){ g.save(); g.translate(mx, my); g.rotate(ga); g.globalAlpha *= Math.min(1, fire * 1.5);
      g.shadowColor = '#ffb040'; g.shadowBlur = 12; S.dot(g, PL([[0, -5], [9, -3], [18, 0], [9, 3], [0, 5], [4, 0]]), '#ffd25a'); S.dot(g, PL([[0, -3], [7, -1], [12, 0], [7, 1], [0, 3]]), '#fff6d0'); g.shadowBlur = 0;
      for (const [d, r] of [[4, 6], [10, 7.5], [16, 6]]) S.dot(g, E(d + (1 - fire) * 8, -4 - (1 - fire) * 10, r * (1.2 - fire * .4), r * (1.1 - fire * .4)), '#b8a8a8', .55 * (1 - fire * .3));
      g.restore(); }
    if (sh > .55){ const k = (sh - .55) / .45; g.save(); g.globalAlpha *= (1 - k) * .7; for (const [d, r] of [[0, 5], [6, 6.5], [12, 5.5]]) S.dot(g, E(mx + d * Math.cos(ga) - 2, my - 6 - k * 22 + d * .3, r + k * 4, r + k * 3), '#a898a0'); g.restore(); }
  }
  S.contact(g, coat, 0, -10, 16, 5, .42);
  // the head on a short neck
  S.tube(g, SO([[0, -14], [0, -8]]), DSKIN, 10);
  g.save(); g.translate(0, -9 + (ch != null ? cs * 2 : 0)); g.rotate(ch != null ? .06 + cs * .08 : sh != null ? aimK * .12 - recoil * .06 : sw * .04);
  pirateHead(g, ch != null ? .2 + Math.abs(cs) * .8 : sh != null ? .2 + fire * .5 : .25, sh != null ? aimK : 0);
  g.restore();
  g.restore();
}

// ---------- registry-style entries (as they would sit in a world module) ----------
// Sizes: kraken body box 228 x 218 (boss), tentacle 150 x 182, anchor 56 x 76, pirate 142 x 140 (the shoot clip's arm and muzzle flash need the width).
export const NM = {
  kraken: { draw:kraken, scale:.58, dy:-6, box:{ x:-114, y:-154, w:228, h:218 },
    clips:{ surface:{ n:8, fps:9, once:true, pose:t => ({ surface:t }) }, idle:{ n:8, fps:6, pose:t => ({ idle:t }) }, dive:{ n:8, fps:9, once:true, pose:t => ({ dive:t }) } } },
  tentacle: { draw:tentacle, scale:.55, dy:-8, box:{ x:-75, y:-120, w:150, h:182 },
    clips:{ rise:{ n:6, fps:10, once:true, pose:t => ({ rise:t }) }, sway:{ n:8, fps:7, pose:t => ({ sway:t }) }, throw:{ n:8, fps:12, once:true, pose:t => ({ throw:t }) } } },
  anchor: { draw:anchor, scale:.55, dy:0, box:{ x:-28, y:-44, w:56, h:76 }, clips:{ spin:{ n:8, fps:12, pose:t => ({ spin:t }) } } },
  pirate: { draw:pirate, scale:.6, dy:-11, box:{ x:-48, y:-86, w:142, h:140 },
    clips:{ walk:{ n:8, fps:8, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, shoot:{ n:8, fps:12, once:true, pose:t => ({ shoot:t }) } } },
};
