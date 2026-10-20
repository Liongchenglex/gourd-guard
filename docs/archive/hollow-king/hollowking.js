// ---------- The Hollow King (world 6 boss, Hallow's End), Toy Plastic style ----------
// Lord of All Hallows' night. A huge jack-o'-lantern skull (carved pumpkin fused with a bone jaw) burning from inside, under an iron
// crown of thorns whose five spikes each carry a small flame in an earlier boss's colour. A tall gaunt body of knotted black vines in
// tattered midnight robes with ember trim and a high collar, bone pauldrons, a cape of shadow whose hem dissolves into candle flames,
// and a hollow ribcage holding a pumpkin-shaped ember heart. Root-like arms end in bark claws: the right holds a gnarled sceptre topped
// with a lantern cage of soul-flame, the left hangs open inside a ring of will-o'-wisp candles. It hovers over a pool of shadow and embers.
// Drawn around (0,0) in drawing units with the robe hem near y = 44 and the root tips at y = 50; feet-fit numbers are in the registry.
//
// pose: { idle, cast, summon, hurt, die } (each 0..1, one at a time), stage (0..4 tints the heart and the eye-fire to an earlier boss:
//   0 green Gravekeeper, 1 pale blue Poltergeist, 2 crimson Vampire Count, 3 teal Twin Tides, 4 violet Hexwitch; undefined = ember orange),
//   variant: 'form2' (level 20 full form: 15% taller, antlers, a halo of nine candles, shadow wings, a blazing heart, longer claws)
//   or 'fallen' (nightmare: cracked blackened skull, bone-white fire, rusted broken crown, burnt robes, a white-hot heart, ash for embers).

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/render/paint.js';
import { TAU } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/util.js';

// palettes
const VINE = pal('#3a2a26'), VINED = pal('#241815'), ROBE = pal('#2c1650'), ROBED = pal('#1c0d36'), TRIM = pal('#ff8c2a'), CAPE = pal('#1b0f28'),
  BONE = pal('#d9d0bc'), IRON = pal('#4a4a58'), RUST = pal('#6e4426'), RIND = pal('#e07828'), RINDF = pal('#2c2420'), ROBEF = pal('#221a18'), WAX = pal('#efe4c8'), WAXF = pal('#b8b0a4'),
  SCEPT = pal('#4a3224'), CAGE = pal('#56525e');
const STAGES = ['#7aff5a', '#9ad8ff', '#ff2838', '#3ae0c8', '#c060ff'];   // Gravekeeper, Poltergeist, Vampire Count, Twin Tides, Hexwitch
const EMBER = '#ff9a2a', WHITE_FIRE = '#f6f1e2';
const CROWN_FLAMES = ['#7aff5a', '#9ad8ff', '#ff3848', '#3ae0c8', '#c060ff'];

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const ease = v => { v = clamp01(v); return v * v * (3 - 2 * v); };

/** A small flame: glowing teardrop with a pale core. h = height, flick wobbles the tip, a = alpha. */
function flame(g, x, y, h, col, flick = 0, a = 1, core = '#fff6d8'){
  if (a <= 0 || h <= 0) return;
  const w = h * .42, tip = Math.sin(flick * TAU) * h * .18;
  g.save(); g.globalAlpha *= a; g.shadowColor = col; g.shadowBlur = h * .9;
  const p = SM([[x, y - h + tip, 1], [x + w * .55, y - h * .5], [x + w, y - h * .12], [x, y + h * .12], [x - w, y - h * .12], [x - w * .55, y - h * .5]], .9);
  const gr = g.createRadialGradient(x, y - h * .18, 0, x, y - h * .3, h * .9); gr.addColorStop(0, core); gr.addColorStop(.45, col); gr.addColorStop(1, rgba(col, .15));
  p(g); g.fillStyle = gr; g.fill();
  g.shadowBlur = 0; S.dot(g, E(x, y - h * .18, w * .42, h * .3), core, .85);
  g.restore();
}
/** Soft radial glow. */
function glow(g, x, y, r, col, a){ if (a <= 0) return; const gr = g.createRadialGradient(x, y, r * .05, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(.5, rgba(col, a * .35)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
/** A gnarled vine: a tube with knots and a bark line. */
function vine(g, pts, c, w, seed = 1){
  S.tube(g, SO(pts), c, w);
  const R = rng(seed);
  for (let i = 1; i < pts.length - 1; i++){ const [x, y] = pts[i], r = w * (.42 + R() * .22); S.part(g, E(x + (R() - .5) * w * .3, y, r * 1.1, r), c, { x, y, r }, { flat:true, mat:'wood', lw:1 }); }
  g.save(); g.globalAlpha *= .5; S.stroke(g, SO(pts.map(([x, y]) => [x - w * .18, y - w * .1])), { deep:c.light }, w * .14, .5); g.restore();
}
/** A bark claw hand: palm with four root fingers tipped with bone claws. dir = where the fingers point, spread widens them, len is finger length. */
function clawHand(g, x, y, dir, c, len = 12, spread = .34, claw = 5, seed = 3){
  const R = rng(seed);
  for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * spread, L = len * (i === 0 || i === 3 ? .82 : 1), mx = x + Math.cos(a) * L * .5 - Math.sin(a) * 2 * (i < 2 ? 1 : -1), my = y + Math.sin(a) * L * .5 + Math.cos(a) * 2 * (i < 2 ? 1 : -1), fx = x + Math.cos(a) * L, fy = y + Math.sin(a) * L;
    S.tube(g, SO([[x, y], [mx, my], [fx, fy]]), c, 3.4 - i % 2 * .4); S.part(g, E(mx, my, 2.2, 1.9), c, { x:mx, y:my, r:2.2 }, { flat:true, noEdge:true }); S.claw(g, fx + Math.cos(a) * 1.4, fy + Math.sin(a) * 1.4, a, claw, '#efe6d0'); }
  S.part(g, E(x, y, 6.2, 5.6), c, { x, y, r:6.2 }, { flat:true, mat:'wood' });
}
/** A stubby wax candle with a flame; the wick base at (x, y). */
function candle(g, x, y, s, col, flick, wax = WAX, a = 1){
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  S.part(g, RR(x - 3 * s, y, 6 * s, 9 * s, 1.5 * s), wax, { x, y:y + 4 * s, r:5 * s }, { flat:true, mat:'bone', lw:1 });
  S.dot(g, E(x, y, 3 * s, 1.3 * s), wax.light, .9); S.ln(g, [[x - 2 * s, y + 2 * s], [x - 2.4 * s, y + 7 * s]], wax, .8, .4);
  g.restore();
  flame(g, x, y - 1 * s, 9 * s, col, flick, a);
}

/** The jack-o'-lantern skull around (0,0): a carved pumpkin with deep jagged sockets and a wide grin burning from inside, a bone lower
 * jaw with teeth rising into the grin, and cracks in the rind leaking the fire. R is the pumpkin radius (about 40). */
function skull(g, R, o){
  const { fire, fireCore, rind, fallen, flick, cracksA, eyeSquint, jawOpen, lightA } = o;
  const bone = fallen ? WAXF : BONE, fireD = mix(fire, '#200806', .7);
  const ribs = [[-.66, .36, .72], [.62, .4, .74], [-.34, .46, .8], [.3, .48, .82], [-.02, .5, .84]];
  const union = g2 => { g2.beginPath(); for (const [ox, rw, rh] of ribs) g2.ellipse(ox * R * .95, R * .04, rw * R * 1.12, R * rh, 0, 0, TAU); };
  // the rind: five ribs with grooves, like the pumpkins
  ribs.forEach(([ox, rw, rh]) => { const cx = ox * R * .95; S.part(g, E(cx, R * .04, rw * R * 1.12, R * rh), rind, { x:cx, y:0, r:R * .8 }, { flat:Math.abs(ox) > .4, mat:fallen ? 'stone' : 'pumpkin', hx:cx - R * .12, hy:-R * .5 }); });
  S.overlay(g, union, rind, { x:0, y:0, r:R * 1.1 });
  g.save(); union(g); g.clip(); for (const x of [-.5, -.18, .14, .46]){ const px = x * R * .95 * 1.02, s = Math.sign(x); g.beginPath(); g.moveTo(px * .9, -R * .66); g.quadraticCurveTo(px * 1.35 + s * R * .05, 0, px * .9, R * .72); g.strokeStyle = rgba(rind.deep, .4); g.lineWidth = R * .07; g.lineCap = 'round'; g.stroke(); g.save(); g.translate(-s * R * .045, 0); g.beginPath(); g.moveTo(px * .9, -R * .62); g.quadraticCurveTo(px * 1.35 + s * R * .05, 0, px * .9, R * .7); g.strokeStyle = rgba(rind.rim, .3); g.lineWidth = R * .03; g.stroke(); g.restore(); } g.restore();
  if (fallen){ const R2 = rng(19); g.fillStyle = 'rgba(0,0,0,.5)'; for (let i = 0; i < 9; i++){ ell(g, (R2() - .5) * R * 1.3, (R2() - .6) * R * .9, 2 + R2() * 4, 1.5 + R2() * 3, R2() * 3); g.fill(); } }   // scorch spots
  // a carved opening: the cut face of the rind shows as a lit lip under the hole, the hole burns with the inner fire
  const carve = (p, cx, cy, rr, bright) => {
    g.save(); g.translate(0, R * .05); p(g); g.fillStyle = mix(rind.light, fire, .3); g.fill(); g.restore();   // the cut face
    g.save(); g.shadowColor = fire; g.shadowBlur = 16 * lightA; p(g); g.fillStyle = '#160806'; g.fill(); g.restore();
    g.save(); p(g); g.clip(); g.globalAlpha *= lightA;
    const gr = g.createRadialGradient(cx, cy, rr * .04, cx, cy, rr); gr.addColorStop(0, bright ? '#ffffff' : fireCore); gr.addColorStop(bright ? .16 : .3, fireCore); gr.addColorStop(bright ? .42 : .6, fire); gr.addColorStop(1, fireD); g.fillStyle = gr; g.fillRect(cx - rr * 1.5, cy - rr * 1.5, rr * 3, rr * 3);
    g.restore();
    p(g); g.strokeStyle = rgba(rind.deep, .95); g.lineWidth = 2; g.lineJoin = 'round'; g.stroke(); };
  // the grin: a wide jagged mouth, corners curling up; the lower edge hides behind the jaw
  const my = R * .22, mw = R * .72, jy = jawOpen * R * .14;
  const mouthPts = [[-mw * 1.02, my - R * .14]];
  for (let i = 0; i <= 8; i++){ const x = -mw + i * mw * 2 / 8, down = i % 2 ? R * .16 : 0; mouthPts.push([x, my + down - Math.abs(x / mw) * R * .1]); }
  mouthPts.push([mw * 1.02, my - R * .14], [mw * .95, my + R * .36 + jy], [mw * .5, my + R * .54 + jy], [0, my + R * .58 + jy], [-mw * .5, my + R * .54 + jy], [-mw * .95, my + R * .36 + jy]);
  carve(PL(mouthPts), 0, my + R * .34, R * .78, false);
  g.save(); PL(mouthPts)(g); g.clip(); for (let i = -2; i <= 2; i++){ const fl = flick + i * .21; flame(g, i * R * .26, my + R * .5 + jy, R * (.34 - Math.abs(i) * .04 + Math.sin(fl * TAU) * .04), fire, fl, .75 * lightA, fireCore); } g.restore();   // tongues of fire behind the teeth
  // bone lower jaw hanging under the rind, its teeth rising into the grin
  g.save(); g.translate(0, jy);
  const jaw = SM([[-R * .72, R * .5], [-R * .64, R * .86], [-R * .32, R * 1.06], [0, R * 1.1], [R * .32, R * 1.06], [R * .64, R * .86], [R * .72, R * .5], [R * .34, R * .66], [0, R * .7], [-R * .34, R * .66]], .75);
  S.part(g, jaw, bone, { x:0, y:R * .82, r:R * .64 }, { mat:'bone', hx:-R * .34, hy:R * .74 });
  S.crease(g, SO([[-R * .42, R * .78], [-R * .36, R * .98]]), bone, 1.4, .4); S.crease(g, SO([[R * .42, R * .78], [R * .36, R * .98]]), bone, 1.4, .4); S.crease(g, SO([[-R * .12, R * 1.04], [R * .12, R * 1.04]]), bone, 1.2, .35);
  for (let i = -3; i <= 3; i++){ const x = i * R * .17 + (i < 0 ? R * .02 : i > 0 ? -R * .02 : 0), big = Math.abs(i) === 2, h = big ? R * .34 : R * .15, w = big ? R * .075 : R * .06, base = R * .68 - Math.abs(i) * R * .02; const t = PL([[x - w, base], [x + w, base], [x + (i < 0 ? -1 : 1) * w * .3, base - h]]); S.part(g, t, bone, { x, y:base - h * .4, r:h * .6 }, { flat:true, mat:'bone', lw:.9 }); }
  g.restore();
  // the sockets: deep, jagged, slanting down toward the centre (menace), each with a white-hot core like a pupil
  for (const s of [-1, 1]){ const ex = s * R * .38, ey = -R * .12, sq = eyeSquint * R * .1;
    const pts = [[-.38, -.08], [-.16, -.34], [.1, -.24], [.3, .02], [.26, .2], [.04, .28], [-.1, .14], [-.32, .22]].map(([x, y], i) => [ex + s * x * R, ey + y * R + (i < 3 ? sq : 0)]);
    carve(PL(pts), ex + s * R * .02, ey + R * .06, R * .44, true);
    g.save(); g.shadowColor = '#ffffff'; g.shadowBlur = 6; S.dot(g, E(ex + s * R * .03, ey + R * .06, R * .07, R * .08), '#ffffff', lightA); g.restore();
    S.ln(g, [[ex - s * R * .4, ey - R * .06 + sq], [ex - s * R * .14, ey - R * .36 + sq], [ex + s * R * .12, ey - R * .25 + sq]], rind, 3.2, .95); }   // the heavy carved brow edge
  { const Em = rng(71); for (let i = 0; i < 8; i++){ const s = i % 2 ? 1 : -1, x = s * R * .38 + (Em() - .5) * R * .3, q = (flick + Em()) % 1, y = -R * .2 - q * R * .7, rr = .8 + Em() * 1.1; g.save(); g.shadowColor = fire; g.shadowBlur = 4; S.dot(g, E(x + Math.sin(q * 6 + i) * 2, y, rr, rr * 1.3), i % 3 ? fire : fireCore, Math.sin(q * Math.PI) * .8 * lightA); g.restore(); } }   // embers drifting up from the sockets
  // cracks leaking light
  const cr = [[[-R * .62, -R * .14], [-R * .72, -R * .34], [-R * .6, -R * .56]], [[R * .64, -R * .1], [R * .76, -R * .3], [R * .66, -R * .5], [R * .74, -R * .62]], [[-R * .26, R * .08], [-R * .36, -R * .02]], [[R * .32, -R * .62], [R * .22, -R * .74]], [[-R * .2, R * .1], [-R * .3, R * .18]]];
  if (fallen) cr.push([[-R * .1, -R * .75], [-R * .04, -R * .5], [R * .1, -R * .38], [R * .02, -R * .2]], [[R * .2, -R * .66], [R * .32, -R * .42]], [[R * .5, R * .1], [R * .6, R * .26]]);
  for (const pts of cr){ S.ln(g, pts, rind, 2.6, .85); g.save(); g.shadowColor = fire; g.shadowBlur = 6; g.globalAlpha *= cracksA; S.ln(g, pts, { deep:fire }, 1.1, 1); g.restore(); }
  if (fallen){   // the skull split open at the crown: a jagged gap through which the white fire shows
    const gap = PL([[-R * .14, -R * .72], [-R * .02, -R * .5], [R * .08, -R * .62], [R * .16, -R * .4], [R * .04, -R * .24], [-R * .06, -R * .44], [-R * .2, -R * .5]]);
    g.save(); g.shadowColor = fire; g.shadowBlur = 10; gap(g); g.fillStyle = '#100a08'; g.fill(); g.restore();
    g.save(); gap(g); g.clip(); glow(g, R * .02, -R * .48, R * .3, fire, .9 * lightA); g.restore();
    S.stroke(g, gap, rind, 1.4, .9);
  }
}

/** The iron crown of thorns on the skull: a circlet following the top of the rind, five tall thorns tipped with an earlier boss's flame. */
function crownOf(g, R, o){
  const { crown, fallen, flick, lightA, gutter, tall } = o;
  const band = SM([[-R * .68, -R * .5], [-R * .36, -R * .76], [0, -R * .84], [R * .36, -R * .76], [R * .68, -R * .5], [R * .6, -R * .34], [R * .3, -R * .5], [0, -R * .58], [-R * .3, -R * .5], [-R * .6, -R * .34]], .8);
  S.part(g, band, crown, { x:0, y:-R * .6, r:R * .66 }, { mat:'metal', flat:true, hx:-R * .3, hy:-R * .74 });
  for (let i = 0; i < 7; i++){ const t = (i + .5) / 7, x = -R * .6 + t * R * 1.2, y = -R * .45 - Math.sin(t * Math.PI) * R * .22; S.rivet(g, x, y, R * .035, crown); }
  for (let i = 0; i < 5; i++){ const x = (i - 2) * R * .3, baseY = -R * .5 - Math.cos((i - 2) * .55) * R * .28, h = (R * .8 + (2 - Math.abs(i - 2)) * R * .2) * (tall ? 1.12 : 1), lean = (i - 2) * .16, broken = fallen && i >= 3, hh = broken ? h * .45 : h;
    const tx = x + Math.sin(lean) * hh, ty = baseY - Math.cos(lean) * hh, w = R * .09;
    const spike = SM([[x - w, baseY + R * .04, 1], [x + w, baseY + R * .04, 1], [x + Math.sin(lean) * hh * .55 + w * .55 + (i >= 2 ? w * .4 : 0), baseY - Math.cos(lean) * hh * .55, 1], [tx + .8, ty, 1], [tx - .8, ty, 1], [x + Math.sin(lean) * hh * .55 - w * .55 - (i <= 2 ? w * .4 : 0), baseY - Math.cos(lean) * hh * .55, 1]], .5);
    S.part(g, spike, crown, { x:x + Math.sin(lean) * hh * .5, y:baseY - Math.cos(lean) * hh * .5, r:hh * .5 }, { flat:true, mat:'metal', lw:1.2, hx:x + Math.sin(lean) * hh * .5 - w * .3, hy:baseY - hh * .6 });
    for (const k of [.3, .62]){ const bx = x + Math.sin(lean) * hh * k, by = baseY - Math.cos(lean) * hh * k, d = i < 2 ? -1 : i > 2 ? 1 : (k < .5 ? -1 : 1); S.part(g, PL([[bx, by + R * .04], [bx + d * w * .4, by - R * .02], [bx + d * (w + R * .07), by - R * .06], [bx + d * w * .2, by - R * .06]]), crown, { x:bx, y:by, r:w }, { flat:true, noEdge:true }); }   // barbs
    if (broken){ S.ln(g, [[tx - 2.5, ty + 1], [tx + 2.5, ty - 1]], crown, 1.6, .9); continue; }
    const fa = Math.max(0, (fallen ? .4 : 1) * lightA - gutter * (1 - i * .15)); flame(g, tx, ty + 2, R * .38 + (i === 2 ? R * .1 : 0) + (tall ? R * .08 : 0), fallen ? WHITE_FIRE : CROWN_FLAMES[i], flick + i * .23, fa); }
}

export function hollowking(g, P = {}){
  const F2 = P.variant === 'form2', FALLEN = P.variant === 'fallen';
  const idle = P.idle, cast = P.cast, summon = P.summon, hurt = P.hurt, die = P.die;
  const ph = idle ?? 0, st = P.stage;
  const fire = FALLEN ? WHITE_FIRE : (st != null && STAGES[st]) ? STAGES[st] : EMBER, fireCore = FALLEN ? '#ffffff' : mix(fire, '#ffffff', .75);
  const rind = FALLEN ? RINDF : RIND, robe = FALLEN ? ROBEF : ROBE, robeD = FALLEN ? pal('#15100f') : ROBED, trim = FALLEN ? pal('#8a6a40') : TRIM, crown = FALLEN ? RUST : IRON, wax = FALLEN ? WAXF : WAX;
  const emberCol = FALLEN ? '#c8c2b8' : EMBER, emberCore = FALLEN ? '#f0ece4' : '#fff0c0';
  const R = rng(13);
  // ---- clip timing ----
  const hover = idle != null ? Math.sin(ph * TAU) * 4 : 0, breathe = idle != null ? (Math.sin(ph * TAU * 2 + .6) + 1) / 2 : .5, drift = idle != null ? Math.sin(ph * TAU + 2) : 0;
  const flick = idle ?? cast ?? summon ?? hurt ?? die ?? 0;
  // cast: raise the sceptre (0–.4), flare (.4–.6), burst leaves (.5–1)
  const raise = cast != null ? ease(cast / .4) : 0, flare = cast != null ? Math.sin(clamp01((cast - .25) / .6) * Math.PI) : 0, burst = cast != null ? clamp01((cast - .45) / .55) : 0;
  // summon: lift (0–.35), slam (.35–.5), pool and roots (.45–1)
  const lift = summon != null ? (summon < .35 ? ease(summon / .35) : summon < .5 ? 1 - ease((summon - .35) / .15) : 0) : 0, slam = summon != null ? ease((summon - .35) / .15) : 0, spread = summon != null ? clamp01((summon - .45) / .55) : 0, rootsT = summon != null ? Math.sin(clamp01((summon - .45) / .55) * Math.PI * .5) : 0;
  // hurt: a sharp recoil that settles
  const rec = hurt != null ? Math.sin(clamp01(hurt) * Math.PI) : 0, flash = hurt != null ? Math.max(0, 1 - hurt * 2.2) : 0;
  // die: gutter (0–.3), sink (.3–.7), crumble (.6–1)
  const gutter = die != null ? clamp01(die / .3) : 0, sink = die != null ? ease((die - .25) / .45) : 0, crumble = die != null ? clamp01((die - .6) / .4) : 0;
  const lightA = die != null ? Math.max(0, 1 - gutter * .55 - sink * .45) * (1 + Math.sin(die * 40) * .25 * gutter) : 1, heartA = (.6 + breathe * .4 + flare * .6 + (F2 ? .3 : 0)) * lightA;
  const bodyA = 1 - crumble;

  if (F2){ g.save(); g.translate(0, 50); g.scale(1.15, 1.15); g.translate(0, -50); }
  // ---- pool of shadow and embers ----
  const poolR = 62 + spread * 48 + (F2 ? 8 : 0) - sink * 10;
  { g.save(); g.translate(0, 56); g.scale(1, .2); const gr = g.createRadialGradient(0, 0, 2, 0, 0, poolR); gr.addColorStop(0, 'rgba(10,4,16,.95)'); gr.addColorStop(.6, 'rgba(14,6,22,.8)'); gr.addColorStop(1, 'rgba(14,6,22,0)'); g.fillStyle = gr; ell(g, 0, 0, poolR, poolR); g.fill(); g.restore();
    g.save(); g.translate(0, 56); g.scale(1, .2); glow(g, 0, 0, poolR * .7, fire, .35 * lightA + spread * .3); g.restore();
    const E2 = rng(41); for (let i = 0; i < 14; i++){ const x0 = (E2() - .5) * poolR * 1.6, phs = E2(), sz = 1.2 + E2() * 1.8, q = (flick + phs) % 1, y = 56 - q * (40 + E2() * 30), x = x0 + Math.sin(q * 6 + i) * 4, al = Math.sin(q * Math.PI) * (crumble > 0 ? 1 : lightA);
      g.save(); g.shadowColor = emberCol; g.shadowBlur = 4; S.dot(g, E(x, y, sz, sz * 1.3), i % 3 ? emberCol : emberCore, al * .9); g.restore(); } }
  // summon: roots bursting up around the king
  if (rootsT > 0){ const RT = rng(57); for (let i = 0; i < 8; i++){ const x0 = -118 + i * 34 + (RT() - .5) * 14, h = (30 + RT() * 34) * rootsT, lean = (RT() - .5) * 30, w = 5 + RT() * 3;
      vine(g, [[x0, 58], [x0 + lean * .4, 58 - h * .55], [x0 + lean, 58 - h]], VINE, w, 60 + i); S.tube(g, SO([[x0 + lean * .3, 58 - h * .45], [x0 + lean * .3 - 8, 58 - h * .7]]), VINE, w * .5); S.claw(g, x0 + lean, 58 - h - 2, -Math.PI / 2 + lean * .02, 6 * rootsT, '#d8ccb0'); S.claw(g, x0 + lean * .3 - 9, 58 - h * .72, -Math.PI * .7, 4 * rootsT, '#d8ccb0'); }
    g.save(); g.translate(0, 56); g.scale(1, .2); g.shadowColor = fire; g.shadowBlur = 8; for (const q of [spread, Math.max(0, spread - .3)]){ if (q <= 0) continue; g.strokeStyle = rgba(fire, (1 - q) * .8); g.lineWidth = 3; ell(g, 0, 0, 40 + q * 110, 40 + q * 110); g.stroke(); } g.restore(); }
  // die: the crumbled king: scattered roots and bark on the ground, ash rising
  if (crumble > 0){ const D = rng(99); for (let i = 0; i < 12; i++){ const x = (D() - .5) * 120 * (0.5 + crumble * .5), y = 46 + D() * 8, L = 10 + D() * 18, a = (D() - .5) * 1.2; g.save(); g.globalAlpha *= crumble; vine(g, [[x, y], [x + Math.cos(a) * L * .5, y + Math.sin(a) * L * .3 - 3], [x + Math.cos(a) * L, y + Math.sin(a) * L * .4]], VINE, 4 + D() * 3, 80 + i); g.restore(); }
    for (let i = 0; i < 18; i++){ const q = (crumble * .9 + D() * .5) % 1, x = (D() - .5) * 110, y = 40 - q * 110, sz = 1 + D() * 2; S.dot(g, E(x + Math.sin(q * 5 + i) * 6, y, sz, sz * 1.2), i % 2 ? '#8a8490' : '#c8c0c0', (1 - q) * crumble * .8); } }

  // ---- the body: everything below rides the hover and the clip motion ----
  g.save(); g.globalAlpha *= bodyA;
  g.translate(rec * 7, hover - 2 + sink * 26 + rec * -5); g.translate(0, 44); g.rotate(rec * -.09 + sink * .06); g.scale(1, 1 - sink * .35); g.translate(0, -44);
  const capeW = 84 + (F2 ? 14 : 0) + flare * 10 + spread * 14, capeDrift = drift * 5;
  // form 2: shadow wings behind the cape
  if (F2) for (const s of [-1, 1]){ const L = -6 + drift * 6 - flare * 14 - spread * 10, sp = flare + spread;
      const w = SM([[s * 30, -78, 1], [s * 70, -118 + L], [s * (112 + sp * 10), -126 + L * 1.2, 1], [s * (96 + sp * 6), -84 + L * .5], [s * (134 + sp * 14), -70 + L * .4, 1], [s * (104 + sp * 4), -40], [s * (126 + sp * 10), -6, 1], [s * 90, 2], [s * 100, 34, 1], [s * 60, 10], [s * 40, -20]], .8);
      g.save(); g.shadowColor = '#000'; g.shadowBlur = 10; S.part(g, w, CAPE, { x:s * 80, y:-60, r:70 }, { mat:'cloth', noEdge:true, flat:true }); g.restore();
      g.save(); w(g); g.clip(); glow(g, s * 70, -70, 80, fire, .18 * lightA); g.restore();
      S.stroke(g, w, { deep:fire }, 1.6, .7 * lightA);
      for (const [tx, ty] of [[s * (112 + sp * 10), -126 + L * 1.2], [s * (134 + sp * 14), -70 + L * .4], [s * (126 + sp * 10), -6]]){ vine(g, [[s * 34, -76], [s * 30 + (tx - s * 30) * .5 + s * 4, -76 + (ty + 76) * .5 - 8], [tx, ty]], VINED, 4.5, 90 + s * 3 + tx); S.claw(g, tx, ty, Math.atan2(ty + 76, tx - s * 34), 6, '#d8ccb0'); } }
  // cape of shadow: hangs from the shoulders, its hem cut into flame tatters
  const hem = [];
  for (let i = 0; i <= 10; i++){ const x = -capeW + i * capeW * 2 / 10, up = i % 2 ? 22 : 0, wob = Math.sin(flick * TAU + i * 1.3) * 3; hem.push([x + (i % 2 ? 0 : capeDrift * (i < 5 ? -1 : 1) * .5), 64 - up + wob - Math.abs(x) / capeW * 14, 1]); }
  const cape = SM([[-46, -88], [-capeW - 2, 4 - capeDrift], ...hem, [capeW + 2, 4 + capeDrift], [46, -88]], .8);
  S.part(g, cape, CAPE, { x:0, y:-10, r:92 }, { mat:'cloth', hx:-40, hy:-60 });
  g.save(); cape(g); g.clip();
  for (let i = 0; i <= 10; i++){ const [x, y] = hem[i]; glow(g, x, y + 4, 26 + (i % 2 ? 8 : 0), fire, (i % 2 ? .55 : .35) * lightA); if (i % 2) flame(g, x, y + 10, 24 + Math.sin(flick * TAU + i) * 4, fire, flick + i * .17, .8 * lightA, fireCore); }
  g.restore();
  S.stroke(g, cape, { deep:ROBE.light }, 1.2, .28);
  for (const s of [-1, 1]){ S.crease(g, SO([[s * 40, -70], [s * 58, -10], [s * (capeW - 14), 46]]), CAPE, 2.2, .45); S.crease(g, SO([[s * 26, -60], [s * 34, 0], [s * 40, 50]]), CAPE, 1.6, .32); }
  // form 2: the halo of nine candles behind the head
  if (F2) for (let i = 0; i < 9; i++){ const a = -Math.PI + i * Math.PI / 8, rr = 70, x = Math.cos(a) * rr, y = -118 + Math.sin(a) * rr * .72 + drift * 2; candle(g, x, y - 4, .9 + (i === 4 ? .3 : 0), fire, flick + i * .11, wax, lightA); }
  // the high collar
  const collar = SM([[-40, -62], [-54, -156, 1], [-40, -140, 1], [-22, -112], [0, -104], [22, -112], [40, -140, 1], [54, -156, 1], [40, -62]], .8);
  S.part(g, collar, robe, { x:0, y:-104, r:50 }, { mat:'cloth', flat:true, hx:-28, hy:-130 });
  g.save(); collar(g); g.clip(); glow(g, 0, -108, 56, fire, .3 * lightA); g.restore();
  for (const s of [-1, 1]) S.crease(g, SO([[s * 44, -150], [s * 36, -110], [s * 40, -70]]), robe, 1.8, .4);
  S.stroke(g, SO([[-50, -152], [-40, -140], [-22, -112], [0, -104], [22, -112], [40, -140], [50, -152]]), { deep:trim.base }, 2.2, .9 * lightA);
  // the lower robe: tattered hem over the root tips
  const hemR = []; for (let i = 0; i <= 8; i++){ const x = -52 + i * 13, up = i % 2 ? 10 : 0; hemR.push([x, 44 - up + Math.sin(flick * TAU + i) * 1.5, 1]); }
  const robeP = SM([[-30, -30], [-40, 4], [-52, 36], ...hemR, [52, 36], [40, 4], [30, -30]], .8);
  S.part(g, robeP, robe, { x:0, y:6, r:52 }, { mat:'cloth', hx:-24, hy:-16 });
  for (const s of [-1, 1]){ S.crease(g, SO([[s * 22, -20], [s * 30, 10], [s * 38, 40]]), robe, 2, .45); S.crease(g, SO([[s * 8, -6], [s * 10, 20], [s * 12, 42]]), robe, 1.5, .3); }
  for (let i = 0; i <= 8; i += 2) S.thread(g, hemR[i][0], hemR[i][1], i < 4 ? -1 : 1, robe);
  if (FALLEN){ g.save(); robeP(g); g.clip(); const B = rng(23); for (let i = 0; i < 8; i++){ const x = (B() - .5) * 90, y = -10 + B() * 50, r = 1.5 + B() * 3.5; S.dot(g, E(x, y, r, r * .8), '#070404', .9); g.save(); g.shadowColor = EMBER; g.shadowBlur = 4; g.strokeStyle = rgba('#ff7a30', .6 * lightA); g.lineWidth = 1; ell(g, x, y, r + .6, r * .8 + .6); g.stroke(); g.restore(); } g.restore(); }   // burn holes with ember edges
  // root tips dangling under the hem
  for (let i = 0; i < 6; i++){ const x = -35 + i * 14, sw = Math.sin(flick * TAU + i * .9) * 2.5; S.tube(g, SO([[x, 40], [x + sw, 47], [x + sw * 1.8, 52 + i % 2 * 3]]), VINE, 3.2 - i % 2 * .6); S.claw(g, x + sw * 1.8, 53 + i % 2 * 3, Math.PI / 2 + sw * .1, 3.5, '#d8ccb0'); }
  // the vine torso: knotted roots rising from the hips to the shoulders, with the ribcage open in front
  const torso = SM([[-30, -82], [-34, -58], [-30, -34], [-26, -12], [0, -4], [26, -12], [30, -34], [34, -58], [30, -82], [0, -88]], .85);
  S.part(g, torso, VINED, { x:0, y:-46, r:44 }, { mat:'wood', hx:-16, hy:-70 });
  for (const [a, b, c2, w] of [[[-26, -80], [-30, -50], [-22, -18], 7], [[26, -80], [30, -50], [22, -18], 7], [[-16, -84], [-20, -56], [-12, -30], 5], [[16, -84], [20, -56], [12, -30], 5]]) vine(g, [a, b, c2], VINE, w, 10 + a[0]);
  // ribcage cavity and the ember heart
  const cav = SM([[-18, -70], [-22, -52], [-20, -32], [-12, -18], [0, -14], [12, -18], [20, -32], [22, -52], [18, -70], [0, -76]], .85);
  g.save(); g.shadowColor = fire; g.shadowBlur = 16 * heartA; cav(g); g.fillStyle = '#0c0608'; g.fill(); g.restore();
  g.save(); cav(g); g.clip(); glow(g, 0, -40, 34 + flare * 10, fire, heartA);
  if (F2 || FALLEN){ const H = rng(67); for (let i = 0; i < 8; i++){ const q = (flick + H()) % 1, x = (H() - .5) * 24 + Math.sin(q * 7 + i) * 3, y = -36 - q * 44, sz = .8 + H() * 1.2; S.dot(g, E(x, y, sz, sz * 1.4), fireCore, Math.sin(q * Math.PI) * lightA); } }   // embers rising from the heart
  // the heart: a little pumpkin of fire
  { const hr = 10 + breathe * 1.2 + flare * 2, hy = -42; g.save(); g.shadowColor = fire; g.shadowBlur = 14; g.globalAlpha *= lightA;
    if (FALLEN){ for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4 + flick * TAU * .2, L = i % 2 ? hr * 1.6 : hr * .9; S.dot(g, PL([[Math.cos(a + 1.5) * 2, hy + Math.sin(a + 1.5) * 2], [Math.cos(a) * L, hy + Math.sin(a) * L], [Math.cos(a - 1.5) * 2, hy + Math.sin(a - 1.5) * 2]]), '#ffffff', .95); } S.dot(g, E(0, hy, hr * .5, hr * .5), '#ffffff'); }
    else { for (const [ox, rw] of [[-.5, .5], [.5, .5], [0, .62]]){ const gr = g.createRadialGradient(ox * hr * .5, hy - hr * .2, 1, ox * hr * .5, hy, hr * .9); gr.addColorStop(0, fireCore); gr.addColorStop(.5, fire); gr.addColorStop(1, mix(fire, '#300a04', .5)); ell(g, ox * hr * .6, hy, rw * hr * 1.2, hr * .9); g.fillStyle = gr; g.fill(); }
      S.dot(g, RR(-1.5, hy - hr * 1.15, 3, hr * .4, 1), mix(fire, '#000000', .5)); S.dot(g, E(-hr * .3, hy - hr * .4, hr * .22, hr * .14, -.5), '#ffffff', .8);
      flame(g, 0, hy - hr * .8, hr * (.9 + breathe * .3), fire, flick, .85, fireCore); }
    g.restore(); }
  g.restore();
  // ribs of vine arching over the cavity
  for (let i = 0; i < 4; i++){ const y = -66 + i * 13; for (const s of [-1, 1]) S.tube(g, SO([[s * 20, y - 3], [s * 12, y + 2], [s * (3 + i * .5), y + 5 + i]]), VINE, 3.6 - i * .3); }
  S.contact(g, torso, 0, -86, 30, 8, .4);
  // the robe's front panels and ember trim framing the cavity
  for (const s of [-1, 1]){ const pan = SM([[s * 22, -84], [s * 32, -60], [s * 30, -30], [s * 28, -8], [s * 36, -4], [s * 38, -40], [s * 40, -70], [s * 34, -86]], .8); S.part(g, pan, robe, { x:s * 32, y:-46, r:22 }, { mat:'cloth', flat:true, hx:s * 28, hy:-70 });
    S.stroke(g, SO([[s * 22, -84], [s * 32, -60], [s * 30, -30], [s * 28, -8]]), { deep:trim.base }, 2, .9 * lightA); }
  // sash with an iron buckle
  S.part(g, SM([[-30, -8], [30, -8], [34, 2], [-34, 2]], .5), trim, { x:0, y:-3, r:32 }, { flat:true, mat:'cloth', lw:1 });
  S.part(g, RR(-7, -11, 14, 12, 3), crown, { x:0, y:-5, r:8 }, { flat:true, mat:'metal' }); S.dot(g, E(0, -5, 2.4, 2.4), fire, lightA);
  // bone pauldrons with spikes
  for (const s of [-1, 1]){ const px = s * 46, py = -78;
    S.part(g, SM([[px - s * 18, py + 2], [px - s * 10, py - 14], [px + s * 6, py - 18], [px + s * 20, py - 8], [px + s * 22, py + 10], [px + s * 8, py + 16], [px - s * 10, py + 10]], .8), FALLEN ? WAXF : BONE, { x:px, y:py + 8, r:16 }, { mat:'bone', hx:px - s * 6, hy:py - 10 });
    for (let i = 0; i < 3; i++){ const bx = px + s * (2 + i * 8), by = py - 12 + i * 6, L = 16 - i * 3, a = -Math.PI / 2 + s * (.55 + i * .3); S.part(g, PL([[bx - s * 3.5, by + 2], [bx + s * 3.5, by + 2], [bx + Math.cos(a) * L, by + Math.sin(a) * L]]), FALLEN ? WAXF : BONE, { x:bx, y:by - 5, r:6 }, { flat:true, mat:'bone', lw:1.1 }); }
    S.crease(g, SO([[px - s * 8, py - 6], [px + s * 10, py + 4]]), BONE, 1.4, .4); }
  // ---- arms ----
  const clawL = F2 ? 8 : 5.5, fingL = F2 ? 15 : 12;
  // right arm (viewer's right): holds the sceptre. The hand climbs and the sceptre tilts for a cast; it lifts then slams for a summon.
  const hx = 64 - raise * 22 + lift * -6 + slam * 4, hy = -4 - raise * 62 - lift * 36 + slam * 8, tilt = -.08 - raise * .5 + lift * -.5 + slam * .15 + sink * .6;
  { const ex = 70 - raise * 26, ey = -40 - raise * 34 - lift * 20; vine(g, [[40, -70], [ex, ey], [hx, hy]], VINE, 9, 21); }
  // sceptre: gnarled shaft, the lantern cage at the top
  g.save(); g.translate(hx, hy); g.rotate(tilt);
  { const top = -150, bot = 46 + slam * 10;
    vine(g, [[0, bot], [-2, 14], [2, -40], [-1.5, -90], [1, top + 14]], SCEPT, 6, 44);
    for (let i = 0; i < 4; i++){ const y = -20 - i * 34, s = i % 2 ? 1 : -1; S.tube(g, SO([[0, y], [s * 6, y - 9], [s * 5, y - 16]]), SCEPT, 2.6); }
    // cage: an iron orb of bars holding the soul-flame
    const cy = top - 12, cr = 15 + flare * 3;
    glow(g, 0, cy, cr * 3 + burst * 20, fire, (.45 + flare * .5) * lightA);
    g.save(); g.shadowColor = fire; g.shadowBlur = 12; S.dot(g, E(0, cy, cr * .78, cr * .78), mix(fire, '#000000', .55), lightA); g.restore();
    for (let i = 0; i < 4; i++){ const a = flick * TAU + i * TAU / 4, fx = Math.cos(a) * cr * .3, fh = cr * (.9 + Math.sin(a * 1.7) * .2); flame(g, fx, cy + cr * .4, fh, fire, flick + i * .25, lightA, fireCore); }
    S.dot(g, E(0, cy, cr * .3 + flare * 2, cr * .35 + flare * 2), '#ffffff', .9 * lightA);
    for (const sx of [-1, -.45, .45, 1]) S.stroke(g, g2 => { g2.beginPath(); g2.ellipse(0, cy, cr * Math.abs(sx), cr, 0, 0, TAU); }, { deep:CAGE.light }, 1.6, .9);
    S.stroke(g, E(0, cy, cr, cr), { deep:CAGE.light }, 2.2, .95);
    for (const yy of [cy - cr, cy + cr]) S.part(g, RR(-7, yy - 4, 14, 8, 3), crown, { x:0, y:yy, r:7 }, { flat:true, mat:'metal' });
    S.part(g, PL([[-5, cy - cr - 4], [5, cy - cr - 4], [0, cy - cr - 16]]), crown, { x:0, y:cy - cr - 8, r:5 }, { flat:true, mat:'metal' });
    // cast burst: a ring and streaks of the stage colour leaving the lantern
    if (burst > 0){ g.save(); g.globalAlpha *= 1 - burst * .9; g.shadowColor = fire; g.shadowBlur = 10; g.strokeStyle = fireCore; g.lineWidth = 3 - burst * 2; ell(g, 0, cy, 22 + burst * 130, 22 + burst * 130); g.stroke(); glow(g, 0, cy, 30 + burst * 40, fireCore, Math.max(0, .8 - burst * 1.6));
      const Bx = rng(5); for (let i = 0; i < 10; i++){ const a = Bx() * TAU, d1 = 20 + burst * 90 * (.6 + Bx() * .4), d0 = d1 - 14 - burst * 20; g.strokeStyle = i % 2 ? fire : fireCore; g.lineWidth = 2.4; g.beginPath(); g.moveTo(Math.cos(a) * d0, cy + Math.sin(a) * d0); g.lineTo(Math.cos(a) * d1, cy + Math.sin(a) * d1); g.stroke(); } g.restore(); } }
  g.restore();
  clawHand(g, hx, hy, Math.PI / 2 + tilt + .3, VINE, fingL * .8, .5, clawL, 7); S.part(g, E(hx - 3, hy - 2, 4, 3.4), VINE, { x:hx, y:hy, r:4 }, { flat:true, noEdge:true });
  // left arm: open hand, fingers spread, a ring of will-o'-wisp candles around it
  const lx = -70 + rec * 8, ly = -22 + drift * 3 + (summon != null ? -lift * 10 : 0) + sink * 20, lsp = .46 + flare * .2;
  vine(g, [[-40, -70], [-70 + rec * 4, -48], [lx, ly]], VINE, 9, 22);
  clawHand(g, lx, ly, Math.PI * .5 + .9, VINE, fingL, lsp, clawL, 8);
  for (let i = 0; i < 5; i++){ const a = -Math.PI * .95 + i * Math.PI * 1.5 / 4 + drift * .15, rr = 24 + Math.sin(flick * TAU * 2 + i) * 2, cx = lx + Math.cos(a) * rr * 1.1, cy = ly + 2 + Math.sin(a) * rr * .8;
    glow(g, cx, cy - 6, 12, fire, .35 * lightA); candle(g, cx, cy, .75, fire, flick + i * .19, wax, lightA); }
  // ---- head ----
  g.save(); g.translate(0, -118 + drift * 1.5 + sink * 6); g.rotate(rec * .06 + sink * -.12 + (die != null ? Math.sin(die * 30) * .03 * gutter : 0));
  // neck of vines up into the skull
  for (const [x, w] of [[-7, 6], [6, 6], [0, 5]]) vine(g, [[x, 30], [x * 1.3, 14], [x * .8, 0]], VINE, w, 50 + x);
  // form 2 antlers: bark branches growing from the crown
  if (F2) for (const s of [-1, 1]){ vine(g, [[s * 26, -30], [s * 46, -54], [s * 56, -84]], VINED, 6.5, 70 + s);
      vine(g, [[s * 40, -48], [s * 58, -56], [s * 72, -68]], VINED, 4.5, 72 + s); vine(g, [[s * 52, -72], [s * 68, -86], [s * 74, -100]], VINED, 4, 74 + s); vine(g, [[s * 54, -78], [s * 44, -94], [s * 40, -104]], VINED, 3.5, 76 + s);
      for (const [tx, ty] of [[s * 56, -86], [s * 72, -70], [s * 74, -102], [s * 40, -106]]) S.claw(g, tx, ty, Math.atan2(ty + 50, tx), 5, '#d8ccb0'); }
  skull(g, 40, { fire, fireCore, rind, fallen:FALLEN, flick, cracksA:(.75 + breathe * .25 + flash) * lightA + (FALLEN ? .25 : 0), eyeSquint:rec + (die != null ? sink : 0), jawOpen:flare * .6 + slam * .5 + (die != null ? sink * .8 : 0) + rec * .3, lightA });
  if (flash > 0){ g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 0, -4, 52, '#ffffff', flash * .55); g.restore(); }
  // the crown of thorns: it tips off the skull and falls as the king dies
  { const fall = die != null ? ease((die - .05) / .35) : 0;
    g.save(); g.translate(fall * 44, fall * 150 - Math.sin(fall * Math.PI) * 30); g.rotate(fall * 1.4); g.globalAlpha *= 1 - crumble;
    crownOf(g, 40, { crown, fallen:FALLEN, flick, lightA, gutter, tall:F2 });
    g.restore(); }
  g.restore();
  g.restore();   // body
  if (F2) g.restore();
}

// registry entry (same shape as src/engine/render/chars/*.js): scale/dy fit the drawing to an in-game boss footprint of r 36 (feet at
// 34 below the centre: 50 × .74 − 3 = 34); box holds the 15% taller antlered full form with its wings and halo, the raised sceptre of a
// cast and the summon roots (shared atlas box). `walk` is the engine's idle name; `idle` is listed too for tools that ask for it by name.
const clips = { idle:{ n:8, fps:6, pose:t => ({ idle:t }) }, cast:{ n:8, fps:12, once:true, pose:t => ({ cast:t }) }, summon:{ n:8, fps:12, once:true, pose:t => ({ summon:t }) }, hurt:{ n:4, fps:12, once:true, pose:t => ({ hurt:t }) }, die:{ n:10, fps:8, once:true, pose:t => ({ die:t }) } };
export const HOLLOWKING = { hollowking: { draw:hollowking, scale:.74, dy:-3, box:{ x:-180, y:-280, w:360, h:360 }, variants:{ form2:true, fallen:true }, clips:{ walk:clips.idle, ...clips }, still:{} } };
