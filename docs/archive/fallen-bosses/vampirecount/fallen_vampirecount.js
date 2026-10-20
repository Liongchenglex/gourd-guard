// ---------- The Fallen Count (nightmare Crumbling Keep), design archive ----------
// A copy of `vampirecount` from src/engine/render/chars/w4.js (with the helpers it uses) plus a third variant,
// P.variant === 'fallen': the same Count, drawn at the full-form (form2) size, but storm-touched and monstrous:
//   corpse-grey skin webbed with dark veins and a lightning-white streak in the hair; a rain-black cape and suit, torn to rags
//   with a crimson lining showing through the slashes; the gold crown gone to blackened iron with taller spikes; larger, ragged
//   bat wings with torn holes and lightning crawling along the bones; longer claws dripping blood; eyes and mouth bleeding
//   crimson light (blood tears, a glowing throat); a blood spear held in the left hand on the idle and bats clips and planted
//   in the ground beside him on the trance, stun and wall clips. Every original pose param still works (idle, trance, stun,
//   bats, wall, teleport), including the trance aura, and `form2` is unchanged.
// NOT for the game: lives in the owner's design archive.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/render/paint.js';
import { TAU } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/util.js';

// ---------- palettes copied from w4.js ----------
const GOLD = pal('#e2b24c'), CRIM = pal('#9e2f44'),
  CAPE = pal('#2e1122'), LINING = pal('#ac2140'), SUIT = pal('#3c1526'), HAIR = pal('#201519'), VEST = pal('#c94a44'), BATC = pal('#3a2040');
const CAPE2 = pal('#150610'), LINING2 = pal('#c4162c'), SUIT2 = pal('#20090f'), VEST2 = pal('#8c1424'), WINGM = pal('#2c0a1c'), WINGB = pal('#4a1a2e'), VC_EYE = '#ff2838';
const VC_SKIN = pal('#e8dfe6'), VC_LASH = { deep:'#2a141c' };

// ---------- fallen palette: storm blues, rain-black, crimson ----------
const CAPE_F = pal('#0b0e1a'), LINING_F = pal('#b4101f'), SUIT_F = pal('#0d1122'), VEST_F = pal('#3a0a14'), WINGM_F = pal('#151c30'), WINGB_F = pal('#2c3448'),
  IRONC = pal('#3a3f4e'), SKIN_F = pal('#aab3c2'), BLOOD = pal('#c8101e'), SHAFT = pal('#1c1f2a');
const F_EYE = '#ff1e30', VEIN = { deep:'#3e2a5e' }, VEIN_R = { deep:'#7a1430' }, BOLT_GLOW = '#9fc0ff', BOLT_CORE = '#f2f7ff', LASH_F = { deep:'#1a1424' };

// ---------- helpers copied from w4.js ----------
/** A small bat silhouette. */
function miniBat(g, x, y, s, flap){ g.save(); g.translate(x, y); g.scale(s, s); const lift = flap * 6; for (const d of [-1, 1]) S.dot(g, SM([[d * 3, 0], [d * 10, -6 - lift], [d * 20, -8 - lift], [d * 18, 0, 1], [d * 14, 4, 1], [d * 8, 2, 1]], .7), BATC.dark, .95); S.dot(g, E(0, 0, 4, 5), BATC.base); S.dot(g, PL([[-3, -3], [-5, -9], [-1, -5]]), BATC.base); S.dot(g, PL([[3, -3], [5, -9], [1, -5]]), BATC.base); S.dot(g, E(-1.5, -1, .9, .9), '#ff4a4a'); S.dot(g, E(1.5, -1, .9, .9), '#ff4a4a'); g.restore(); }
/** A five-point star. */
function star(g, x, y, r, col){ g.save(); g.shadowColor = col; g.shadowBlur = 6; g.beginPath(); for (let i = 0; i < 10; i++){ const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fillStyle = col; g.fill(); g.restore(); }
/** Bat sigil: a gold bat on cloth or steel. */
function batSigil(g, x, y, s, col = GOLD.base){ g.save(); g.translate(x, y); g.scale(s, s); S.dot(g, SM([[0, -4], [-6, -8], [-14, -6], [-12, 0, 1], [-8, 2, 1], [-5, 6, 1], [0, 4], [5, 6, 1], [8, 2, 1], [12, 0, 1], [14, -6], [6, -8]], .7), col, .9); S.dot(g, PL([[-2, -6], [-3, -10], [0, -7]]), col, .9); S.dot(g, PL([[2, -6], [3, -10], [0, -7]]), col, .9); g.restore(); }

// ---------- fallen helpers ----------
/** A jagged lightning bolt from a to b: seeded zigzag with one branch, a soft blue glow and a white core (baked, so the blur is fine). */
function bolt(g, a, b, seed, w = 1.2, amp = 5, branch = true){
  const R = rng(seed), n = 6, pts = [a]; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let i = 1; i < n; i++){ const t = i / n, o = (R() - .5) * 2 * amp; pts.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]); }
  pts.push(b);
  const path = g2 => { g2.beginPath(); pts.forEach((p, i) => i ? g2.lineTo(p[0], p[1]) : g2.moveTo(p[0], p[1])); if (branch){ const k = 2 + Math.floor(R() * 2), p = pts[k], bl = L * .22, ba = Math.atan2(dy, dx) + (R() < .5 ? -1 : 1) * (.6 + R() * .5); g2.moveTo(p[0], p[1]); g2.lineTo(p[0] + Math.cos(ba) * bl * .5 + nx * (R() - .5) * 4, p[1] + Math.sin(ba) * bl * .5 + ny * (R() - .5) * 4); g2.lineTo(p[0] + Math.cos(ba) * bl, p[1] + Math.sin(ba) * bl); } };
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = BOLT_GLOW; g.shadowBlur = 9;
  path(g); g.strokeStyle = rgba(BOLT_GLOW, .55); g.lineWidth = w * 3; g.stroke();
  path(g); g.strokeStyle = BOLT_CORE; g.lineWidth = w; g.stroke();
  g.restore(); }
/** A blood drop hanging below (x, y), with a glossy highlight. */
function drop(g, x, y, r = 1.6, a = .95){ S.dot(g, RR(x - r * .45, y - r * 2.2, r * .9, r * 2.6, r * .45), '#a80c1e', a); S.dot(g, E(x, y + r * .4, r, r * 1.25), '#c8102a', a); S.dot(g, E(x - r * .35, y - r * .1, r * .32, r * .4), '#ff9aa0', a * .9); }
/** Blood spear: iron shaft from the butt (x1, y1) to (x2, y2), then a long glowing blade of blood beyond it. */
function spear(g, x1, y1, x2, y2, seed = 5){
  const a = Math.atan2(y2 - y1, x2 - x1), ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  S.tube(g, SO([[x1, y1], [x2, y2]]), SHAFT, 3.8);
  S.part(g, E(x1 - ux * 1, y1 - uy * 1, 3.2, 3.2), IRONC, { x:x1, y:y1, r:3.2 }, { flat:true, mat:'metal' });   // iron butt cap
  for (let i = 0; i < 3; i++){ const t = .78 + i * .035, px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t; S.ln(g, [[px - nx * 2.6, py - ny * 2.6], [px + nx * 2.6, py + ny * 2.6]], LINING_F, 1.4, .9); }   // crimson binding
  g.save(); g.translate(x2, y2); g.rotate(a);
  const blade = SM([[-2, -4.2, 1], [8, -5.6], [20, -3.2], [30, 0, 1], [20, 3.2], [8, 5.6], [-2, 4.2, 1]], .7);
  g.save(); g.shadowColor = '#ff2030'; g.shadowBlur = 10; S.dot(g, blade, '#ff2a3a', .5); g.restore();
  S.part(g, blade, BLOOD, { x:12, y:0, r:14 }, { hx:6, hy:-2.4, lw:1 });
  S.ln(g, [[0, 0], [26, 0]], { deep:'#ffb0b0' }, .9, .55); S.ln(g, [[4, -3.2], [20, -1.6]], { deep:'#ffffff' }, .7, .35);
  const R = rng(seed); for (let i = 0; i < 2; i++){ const t = 6 + R() * 16; g.save(); g.translate(t, 4.5); g.rotate(-a); drop(g, 0, 2.5, 1.3, .9); g.restore(); }   // blood running off the blade (drops hang straight down)
  g.restore(); }

// ---------- the Count (original, with the fallen variant folded in) ----------
export function fallenVampirecount(g, P = {}){
  const FN = P.variant === 'fallen', F2 = P.variant === 'form2' || FN;   // FN: the fallen look; F2: full-form size, wings, crown, longer claws
  const idle = P.idle, tr = P.trance, st = P.stun, ba = P.bats, wa = P.wall, tp = P.teleport ?? 0;
  const capeC = FN ? CAPE_F : F2 ? CAPE2 : CAPE, lining = FN ? LINING_F : F2 ? LINING2 : LINING, suit = FN ? SUIT_F : F2 ? SUIT2 : SUIT, vest = FN ? VEST_F : F2 ? VEST2 : VEST, skin = FN ? SKIN_F : VC_SKIN;
  const wingM = FN ? WINGM_F : WINGM, wingB = FN ? WINGB_F : WINGB, lash = FN ? LASH_F : VC_LASH, eyeCol = FN ? F_EYE : VC_EYE, clawCol = FN ? '#d6dde9' : '#ece4f4';
  const ph = idle ?? tr ?? st ?? 0, hover = Math.sin(ph * TAU) * 3, pulse = tr == null ? 0 : (Math.sin(tr * TAU) + 1) / 2;
  const R = rng(31);
  const fr = Math.floor(((idle ?? tr ?? st ?? ba ?? wa ?? tp) || 0) * 8 + .001);   // frame index of whichever clip is playing: seeds the lightning so each frame flickers differently but stably
  // long elegant hand: a small palm, four slender fingers that curl a little, each tipped with a claw (longer in the full form, longer still and bleeding when fallen)
  const hand = (x, y, dir) => { const len = FN ? 15 : F2 ? 13 : 10, cl = FN ? 9 : F2 ? 7 : 5;
    for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * .34, L = len * (i === 0 || i === 3 ? .86 : 1), fx = x + Math.cos(a) * L, fy = y + Math.sin(a) * L, mx = x + Math.cos(a) * L * .5 - Math.sin(a) * 1.4, my = y + Math.sin(a) * L * .5 + Math.cos(a) * 1.4;
      S.tube(g, SO([[x, y], [mx, my], [fx, fy]]), skin, 2.7); S.claw(g, fx + Math.cos(a) * 1.2, fy + Math.sin(a) * 1.2, a, cl, clawCol);
      if (FN && (i === 1 || i === 2) && Math.sin(a) > -.3) drop(g, fx + Math.cos(a) * (cl + 1.4), fy + Math.sin(a) * (cl + 1.4) + 2.2, 1.1, .92); }
    S.part(g, E(x, y, 5.2, 4.8), skin, { x, y, r:5.2 }, { flat:true, mat:'skin' });
    if (FN){ S.ln(g, [[x - 3, y - 2], [x + 1, y + 1.5], [x + 3.5, y + .5]], VEIN, 1, .65); } };
  // almond eye on side s (outer corner lifted): white, crimson iris with a small pupil, a heavy upper lid with a lash line that wings out.
  // o.closed draws the serene closed lid instead; o.lid deepens the lid (dazed); o.dx/dy/ir move and size the iris.
  const eye = (s, x, y, o = {}) => {
    const ix = x - s * 8, ox = x + s * 8.5, cx = x + s * .5;
    if (o.closed){
      const lid = g2 => { g2.beginPath(); g2.moveTo(ix, y - .5); g2.quadraticCurveTo(cx, y + 5.5, ox, y - 2.5); };
      S.stroke(g, lid, lash, 1.8, .9);
      for (let i = 0; i < 3; i++){ const t = .62 + i * .15, lx = ix + (ox - ix) * t, ly = y - .5 + Math.sin(t * Math.PI) * 4.2 - (t - .5) * 2; S.ln(g, [[lx, ly], [lx + s * 1.3, ly + 3]], lash, 1, .8); }
      S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(ix + s * 2.5, y - 4.5); g2.quadraticCurveTo(cx, y - 7.5, ox - s * 1.5, y - 7); }, skin, 1.2, .4);   // the fold above the lid
      return; }
    const shape = SM([[ix, y + 1, 1], [x - s * 1.5, y - 5], [x + s * 4.5, y - 4.4], [ox, y - 2.5, 1], [x + s * 2.5, y + 3.6], [x - s * 4, y + 2.6]], .8);
    g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 3; g.shadowOffsetY = 1; shape(g); g.fillStyle = o.white ?? '#fbf7f9'; g.fill(); g.restore();
    g.save(); shape(g); g.clip();
    let gr = g.createLinearGradient(0, y - 5, 0, y + 1.5); gr.addColorStop(0, 'rgba(70,30,60,.4)'); gr.addColorStop(1, 'rgba(70,30,60,0)'); g.fillStyle = gr; g.fillRect(x - 14, y - 8, 28, 16);
    if (o.veins) for (let i = 0; i < 3; i++){ const vx = x + s * (6 - i * 3.5); S.ln(g, [[vx, y + 3.5], [vx - s * .8, y + 1.2], [vx - s * 1.6, y - 1]], VEIN_R, .55, .45); }   // bloodshot threads
    const lidT = o.lid ?? .3, px = cx + s * (o.dx ?? 0), py = y - .6 + (o.dy ?? 0), ir = o.ir ?? 3.6;
    gr = g.createRadialGradient(px - ir * .3, py - ir * .3, ir * .1, px, py, ir); gr.addColorStop(0, o.irisL); gr.addColorStop(.7, o.iris); gr.addColorStop(1, o.irisD); ell(g, px, py, ir, ir); g.fillStyle = gr; g.fill();
    ell(g, px, py, ir, ir); g.strokeStyle = rgba(o.irisD, .8); g.lineWidth = .7; g.stroke();
    S.dot(g, E(px, py, ir * .42, ir * .46), o.pupil ?? '#12060c');
    g.fillStyle = 'rgba(255,255,255,.9)'; ell(g, px - ir * .35, py - ir * .4, ir * .3, ir * .22, -.5); g.fill();
    g.fillStyle = mix(skin.base, skin.dark, .3); g.beginPath(); g.moveTo(ix, y + 1); g.quadraticCurveTo(cx, y - 5 + lidT * 4, ox, y - 2.5); g.lineTo(ox + s * 8, y - 16); g.lineTo(ix - s * 8, y - 16); g.closePath(); g.fill();   // heavy upper lid
    g.restore();
    S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(ix, y + 1); g2.quadraticCurveTo(cx, y - 5 + lidT * 4, ox, y - 2.5); g2.lineTo(ox + s * 2.5, y - 4.5); }, lash, 1.5, .9);   // lash line with a wing
    S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(ix, y + 1); g2.quadraticCurveTo(x + s * 2, y + 4.6, ox, y - 2.5); }, lash, .8, .35); };
  // thin arched brow; knot > 0 pulls the inner end down (menace), < 0 lifts it (serene / dazed)
  const brow = (s, x, y, knot = 0) => { const p = g2 => { g2.beginPath(); g2.moveTo(x - s * 6, y + knot); g2.quadraticCurveTo(x + s * 2, y - 6 - knot * .2, x + s * 13, y - 2); }; S.stroke(g, p, HAIR, 2.2, .95); S.stroke(g, p, { deep:HAIR.light }, .7, .35); };
  // form-2 wing: three bone fingers from the shoulder blade with a scalloped membrane; L lifts the tips, sp spreads them
  const wing = (s, L, sp) => { const root = [s * 22, -54], tips = [[s * (60 + sp * 6), -118 + L], [s * (104 + sp * 8), -92 + L * .6], [s * (114 + sp * 6), -44 + L * .3], [s * 46, 12]];
    const pts = [[root[0], root[1] - 6, 1], [s * 40, -82 + L * .4]];
    for (let i = 0; i < tips.length; i++){ pts.push([tips[i][0], tips[i][1], 1]); if (i < tips.length - 1){ const a = tips[i], b = tips[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; pts.push([mx + (root[0] - mx) * .32, my + (root[1] - my) * .32]); } }
    pts.push([root[0], root[1] + 8, 1]);
    S.part(g, SM(pts, .9), WINGM, { x:s * 66, y:-56, r:64 }, { mat:'leather', hx:s * 62, hy:-82 });
    for (let i = 0; i < 3; i++){ const t = tips[i]; S.tube(g, SO([root, [(root[0] + t[0]) / 2 + s * 3, (root[1] + t[1]) / 2 - 5], t]), WINGB, 4.2); S.claw(g, t[0], t[1], Math.atan2(t[1] - root[1], t[0] - root[0]), 5, '#e8e0f0'); } };
  // fallen wing: a fifth larger, the membrane torn into ragged points between the bones with two holes, lightning crawling along the bones
  const wingF = (s, L, sp) => { const root = [s * 22, -54], tips = [[s * (68 + sp * 7), -140 + L], [s * (120 + sp * 9), -106 + L * .6], [s * (134 + sp * 7), -48 + L * .3], [s * 54, 18]];
    const pts = [[root[0], root[1] - 7, 1], [s * 42, -94 + L * .4]];
    const tear = (a, b, t, k) => [a[0] + (b[0] - a[0]) * t + (root[0] - (a[0] + (b[0] - a[0]) * t)) * k, a[1] + (b[1] - a[1]) * t + (root[1] - (a[1] + (b[1] - a[1]) * t)) * k, 1];
    for (let i = 0; i < tips.length; i++){ pts.push([tips[i][0], tips[i][1], 1]); if (i < tips.length - 1){ const a = tips[i], b = tips[i + 1]; pts.push(tear(a, b, .22, .16), tear(a, b, .4, .34), tear(a, b, .55, .2), tear(a, b, .72, .38), tear(a, b, .86, .18)); } }
    pts.push([root[0], root[1] + 10, 1]);
    const mem = SM(pts, .9); S.part(g, mem, WINGM_F, { x:s * 74, y:-60, r:74 }, { mat:'leather', hx:s * 70, hy:-96 });
    g.save(); mem(g); g.clip();   // rain sheen and torn holes, kept inside the membrane
    for (let i = 0; i < 4; i++){ const x0 = s * (50 + i * 18), y0 = -104 + i * 9 + L * .3; S.ln(g, [[x0, y0], [x0 - s * 4, y0 + 14]], { deep:WINGM_F.light }, .8, .22); }
    for (const [hx, hy, hr, ha] of [[s * 86, -78 + L * .5, 4.2, .5], [s * 104, -58 + L * .3, 3, -.4], [s * 64, -40 + L * .2, 2.6, .8]]){ const hole = SM([[hx - hr, hy - hr * .4, 1], [hx - hr * .3, hy - hr * 1.1, 1], [hx + hr * .8, hy - hr * .7, 1], [hx + hr * 1.1, hy + hr * .3, 1], [hx + hr * .2, hy + hr, 1], [hx - hr * .9, hy + hr * .6, 1]], .5);
      g.save(); g.translate(hx, hy); g.rotate(ha); g.translate(-hx, -hy); S.dot(g, hole, '#04060c', .92); S.stroke(g, hole, { deep:WINGM_F.light }, .7, .3); g.restore(); }
    g.restore();
    for (let i = 0; i < 3; i++){ const t = tips[i], mid = [(root[0] + t[0]) / 2 + s * 3, (root[1] + t[1]) / 2 - 5]; S.tube(g, SO([root, mid, t]), WINGB_F, 4.6); S.claw(g, t[0], t[1], Math.atan2(t[1] - root[1], t[0] - root[0]), 7, clawCol);
      if ((fr + (s > 0 ? 1 : 0)) % 3 === i){ const q0 = .3 + ((fr * 7) % 3) * .08, q1 = q0 + .4, lerp = (a, b, q) => [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q]; bolt(g, lerp(mid, root, 1 - q0 * 2 > 0 ? 1 - q0 * 2 : 0), lerp(mid, t, (q1 - .5) * 2), 400 + fr * 11 + i * 7 + (s > 0 ? 3 : 0), .8, 3, true); } } };   // a short crawl of lightning along one bone per wing, hopping between the bones frame by frame
  if (F2){ g.save(); g.translate(0, 46); g.scale(1.12, 1.12); g.translate(0, -46); }
  // burst into bats (teleport clip plays backwards as it reforms in a new lane)
  if (tp > 0){ for (let i = 0; i < 9; i++){ const a = R() * TAU, d = 20 + tp * (50 + R() * 40), x = Math.cos(a) * d, y = -24 + Math.sin(a) * d * .8 - tp * 10, al = tp < .2 ? tp / .2 : 1 - Math.max(0, tp - .8) / .2; g.save(); g.globalAlpha *= al; miniBat(g, x, y, .55 + R() * .3, Math.sin(tp * 12 + i)); g.restore(); }
    if (tp >= 1){ if (F2) g.restore(); return; } }
  if (tr != null){   // blood aura behind everything: a wide pulsing glow, two expanding rings, rising motes
    g.save(); g.translate(0, -26); g.scale(1, .8);
    const rr = 112 + pulse * 16; const gr = g.createRadialGradient(0, 0, 4, 0, 0, rr);
    gr.addColorStop(0, `rgba(255,90,95,${.8 + pulse * .2})`); gr.addColorStop(.28, `rgba(245,40,55,${.6 + pulse * .22})`); gr.addColorStop(.62, `rgba(215,15,45,${.26 + pulse * .14})`); gr.addColorStop(1, 'rgba(180,0,30,0)');
    g.fillStyle = gr; g.fillRect(-150, -190, 300, 380);
    for (const off of [0, .5]){ const q = (tr + off) % 1, rad = 38 + q * 84; g.save(); g.shadowColor = '#ff5060'; g.shadowBlur = 6; g.strokeStyle = `rgba(255,160,165,${(1 - q) * .9})`; g.lineWidth = 4 - q * 2.2; ell(g, 0, 0, rad, rad); g.stroke(); g.restore(); }
    g.restore();
    const M = rng(77); g.save(); g.shadowColor = '#ff4050'; g.shadowBlur = 8;
    for (let i = 0; i < 10; i++){ const x0 = (M() - .5) * 120, phs = M(), sz = 2.2 + M() * 2.4, wob = M() * TAU, q = (tr + phs) % 1, y = 44 - q * 150, x = x0 + Math.sin(q * 5 + wob) * 6, al = Math.sin(q * Math.PI);
      S.dot(g, E(x, y, sz, sz * 1.3), '#ff6a70', al * .95); S.dot(g, E(x - sz * .3, y - sz * .4, sz * .35, sz * .35), '#fff0f0', al * .8); }
    g.restore();
    if (FN){ const B = rng(900 + fr); for (let i = 0; i < 3; i++){ const a = B() * TAU, r0 = 46 + B() * 30, r1 = r0 + 24 + B() * 20; bolt(g, [Math.cos(a) * r0, -26 + Math.sin(a) * r0 * .8], [Math.cos(a) * r1, -26 + Math.sin(a) * r1 * .8], 950 + fr * 5 + i, .9, 4, false); } } }   // storm flickers in the fallen aura
  g.save(); g.globalAlpha *= 1 - tp; S.shadow(g, 0, 54, 40 - Math.abs(hover) * 2, 7); g.restore();
  // fallen: the blood spear stands planted beside him while his hands are busy (trance, stun, wall)
  const planted = FN && (tr != null || st != null || wa != null);
  if (planted){ g.save(); g.globalAlpha *= 1 - tp; spear(g, -62, 56, -79, -88, 9); g.restore(); }
  g.save(); g.globalAlpha *= 1 - tp; g.translate(0, -20); g.scale(1 - tp * .3, 1 - tp * .3); g.translate(0, 20 + hover);
  if (st != null){ g.translate(0, 8); g.rotate(Math.sin(st * TAU) * .1); }
  const flare = ba != null ? Math.sin(Math.min(1, ba * 1.6) * Math.PI) : 0, spread = wa != null ? Math.sin(Math.min(1, wa * 1.4) * Math.PI / 2) : 0;   // cape flung right for bats, spread both sides for a wall
  if (F2){ const L = st != null ? 16 : tr != null ? -4 - pulse * 6 : idle != null ? Math.sin(idle * TAU) * 6 : -6 - flare * 16 - spread * 12, sp = flare + spread; if (FN){ wingF(-1, L, sp); wingF(1, L + flare * -6, sp); } else { wing(-1, L, sp); wing(1, L + flare * -6, sp); } }
  // cape: hangs from the shoulders in long folds, the hem cut into points; lining shows inside. Fallen: the hem hangs longer and is torn to rags.
  const capeR = 56 + flare * 26 + spread * 18 + (F2 ? 8 : 0), capeL = 56 + spread * 18 + (F2 ? 8 : 0), drift = idle != null ? Math.sin(idle * TAU + 2) * 4 : 0;
  const cape = FN
    ? SM([[-28, -84], [-40, -50], [-capeL, 36 + drift, 1], [-48, 22, 1], [-39, 54, 1], [-31, 30, 1], [-21, 58, 1], [-13, 34, 1], [-4, 62, 1], [5, 40, 1], [13, 58, 1], [21, 34, 1], [31, 56, 1], [39, 28, 1], [48, 50, 1], [capeR, 36 - drift - flare * 30, 1], [40 + flare * 10, -50 - flare * 10], [28, -84]], .8)
    : SM([[-28, -84], [-40, -50], [-capeL, 32 + drift, 1], [-44, 26, 1], [-31, 48, 1], [-16, 34, 1], [0, 52, 1], [16, 34, 1], [31, 48, 1], [44, 26, 1], [capeR, 32 - drift - flare * 30, 1], [40 + flare * 10, -50 - flare * 10], [28, -84]], .8);
  S.part(g, cape, capeC, { x:0, y:-20, r:70 }, { mat:'cloth', hx:-28, hy:-52 });
  if (FN) S.stroke(g, cape, { deep:'#c8d4ff' }, 1.2, .2);   // rain-wet edge catching the lightning
  for (const s of [-1, 1]){ S.crease(g, SO([[s * 34, -46], [s * 44, -6], [s * (capeL - 8) * (s > 0 ? capeR / capeL : 1), 24]]), capeC, 2, .42); S.crease(g, SO([[s * 24, -40], [s * 28, 0], [s * 30, 38]]), capeC, 1.6, .32); S.crease(g, SO([[s * 12, -30], [s * 13, 10], [s * 14, 36]]), capeC, 1.3, .26); }
  if (FN){   // slashes in the cape showing the crimson lining, wet rain streaks, frayed threads at the rags
    g.save(); cape(g); g.clip();
    for (const [x0, y0, x1, y1, w] of [[-34, -30, -30, 6, 2.6], [-40, 14, -36, 34, 1.8], [36, -24, 40, 12, 2.4], [30, 20, 34, 40, 1.6], [18, 30, 20, 48, 1.4]]){ S.dot(g, PL([[x0, y0], [x0 + w, y0 + 1], [x1 + w * .4, y1], [x1 - w * .4, y1 - 1]]), LINING_F.dark, .95); S.ln(g, [[x0, y0], [x1, y1]], { deep:'#000000' }, .7, .5); }
    for (let i = 0; i < 7; i++){ const x0 = -48 + i * 16, y0 = -56 + (i % 3) * 14; S.ln(g, [[x0, y0], [x0 - 3, y0 + 26]], { deep:'#c8d4ff' }, .7, .14); }
    g.restore();
    for (const [x, y, d] of [[-39, 54, -1], [-21, 58, -1], [13, 58, 1], [31, 56, 1], [48, 50, 1]]) S.thread(g, x, y, d, capeC);
    drop(g, -21, 61, 1.1, .9); drop(g, 31, 59, 1.1, .9); }
  const liningP = SM([[-22, -62], [-32, -30], [-38 - (F2 ? 6 : 0), 22], [-19, 32], [0, 38], [19, 32], [38 + (F2 ? 6 : 0), 22], [32, -30], [22, -62]], .8); S.part(g, liningP, lining, { x:0, y:-10, r:44 }, { flat:true, mat:'cloth', noEdge:true, hx:-16, hy:-40 });
  for (const s of [-1, 1]) S.crease(g, SO([[s * 14, -40], [s * 18, 20]]), lining, 1.4, .3);
  // tall collar rising past the head (fallen: torn at the tips)
  const collar = FN ? SM([[-32, -40], [-40, -114, 1], [-36, -100, 1], [-33, -108, 1], [-30, -98, 1], [-18, -88], [0, -82], [18, -88], [30, -98, 1], [33, -108, 1], [36, -100, 1], [40, -114, 1], [32, -40]], .8)
    : SM([[-32, -40], [-40, -114, 1], [-32, -104, 1], [-18, -88], [0, -82], [18, -88], [32, -104, 1], [40, -114, 1], [32, -40]], .8);
  S.part(g, collar, lining, { x:0, y:-76, r:38 }, { mat:'cloth', flat:true, hx:-20, hy:-98 }); S.stroke(g, collar, capeC, 2.4, .85);
  // slim legs and pointed shoes
  for (const s of [-1, 1]){ S.tube(g, SO([[s * 8, 22], [s * 9, 38]]), suit, 7); S.part(g, SM([[s * 3, 36], [s * 15, 36], [s * 23, 41, 1], [s * 12, 45], [s * 3, 44]], .6), HAIR, { x:s * 11, y:40, r:9 }, { flat:true, mat:'leather' }); }
  // slim torso: double-breasted vest with a pinched waist, lapels, shirt, cravat and medallion
  const torso = SM([[-20, -34], [-23, -10], [-17, 8], [-18, 26], [0, 30], [18, 26], [17, 8], [23, -10], [20, -34], [0, -38]], .85); S.part(g, torso, vest, { x:0, y:-6, r:30 }, { mat:'cloth' });
  for (const s of [-1, 1]) S.part(g, PL([[s * 20, -34], [s * 6, -34], [s * 12, 6], [s * 23, -10]]), suit, { x:s * 16, y:-14, r:14 }, { flat:true, mat:'cloth' });
  S.dot(g, PL([[-7, -38], [7, -38], [0, -22]]), FN ? '#d8d2dc' : '#f4eef0'); S.dot(g, PL([[-4, -36], [4, -36], [0, -29]]), lining.base);
  if (FN){ S.dot(g, PL([[-6, -37], [-3, -37], [-1, -24], [-2.5, -24]]), '#a80c1e', .8); }   // blood soaked into the shirt
  const stud = FN ? IRONC : GOLD; for (const y of [-10, 2, 14]) for (const s of [-1, 1]) S.rivet(g, s * 4.5, y, 1.5, stud);
  S.crease(g, SO([[-15, 2], [-14, 26]]), vest, 1.4, .4); S.crease(g, SO([[15, 2], [14, 26]]), vest, 1.4, .4);
  S.stroke(g, SO([[-12, -34], [-5, -22], [0, -18], [5, -22], [12, -34]]), { deep:FN ? IRONC.light : GOLD.base }, 1.3, .95); S.part(g, E(0, -17, 5.5, 5.5), stud, { x:0, y:-17, r:5.5 }, { flat:true, mat:'metal' }); S.dot(g, E(0, -17, 2.6, 2.6), '#e0203a'); S.dot(g, E(-.8, -18, .8, .8), '#fff', .9);
  if (F2){ g.save(); g.shadowColor = eyeCol; g.shadowBlur = FN ? 12 : 8; S.dot(g, E(0, -17, FN ? 3.4 : 3, FN ? 3.4 : 3), '#ff3040', FN ? .9 : .8); g.restore(); }
  batSigil(g, 0, -42, .42, FN ? IRONC.light : mix(GOLD.base, '#ffffff', .1));
  // arms and clawed hands, posed per clip (fallen: the spear shaft is drawn under the left hand on idle and bats)
  const arm = (s, mid, hx, hy, dir) => { S.tube(g, SO([[s * 20, -28], mid, [hx, hy]]), suit, 8); hand(hx, hy, dir); };
  const held = FN && !planted && tp < 1;
  if (tr != null){ arm(-1, [-6, -6], 16, -6, -.15); arm(1, [6, -2], -16, -1, Math.PI + .15); }
  else if (st != null){ const d = Math.sin(st * TAU) * 6; arm(-1, [-36, 0], -40, 22 + d, Math.PI / 2 + .4); arm(1, [36, 0], 40, 22 - d, Math.PI / 2 - .4); }
  else if (ba != null){ if (held) spear(g, -40, 56, -60, -98, 3); arm(-1, [-32, -6], -44, 18, Math.PI / 2 + .3); const e = Math.sin(Math.min(1, ba * 1.6) * Math.PI / 2); arm(1, [24 + e * 20, -16 - e * 18], 34 + e * 30, 12 - e * 50, -.6 - e * .4);
    for (let i = 0; i < 5; i++){ const q = Math.max(0, ba - .25 - i * .08) / .75; if (q <= 0) continue; const a = -1.1 + i * .38, x = 40 + Math.cos(a) * q * 70, y = -30 + Math.sin(a) * q * 60; g.save(); g.globalAlpha *= Math.max(0, 1 - q); miniBat(g, x, y, .5 + i * .06, Math.sin(ba * 20 + i)); g.restore(); } }
  else if (wa != null){ const u = spread; for (const s of [-1, 1]){ arm(s, [s * (34 - u * 4), -30 - u * 30], s * (38 - u * 4), -20 - u * 74, -Math.PI / 2 + s * .3);
      if (u > .3){ g.save(); g.shadowColor = FN ? BOLT_GLOW : '#d8b8ff'; g.shadowBlur = 14; S.dot(g, E(s * (38 - u * 4), -28 - u * 74, 9 * u, 9 * u), FN ? '#c8dcff' : '#c8a8f0', .55 * u); g.restore();
        if (FN) bolt(g, [s * (38 - u * 4), -28 - u * 74], [s * (38 - u * 4 + 14), -28 - u * 74 - 22 + (fr % 2) * 10], 700 + fr * 3 + s, 1, 4); } } }
  else { const f = Math.sin(ph * TAU) * .12; if (held) spear(g, -40, 56, -60, -98, 3); arm(-1, [-38, -8], -44, 20, Math.PI / 2 + .35 + f); arm(1, [36, -8], 38, 20, Math.PI / 2 - .35 - f); }
  // head: long pale face with a pointed chin, high cheekbones over hollow cheeks, tall pointed ears, slicked hair with a widow's peak
  g.save(); if (tr != null){ g.translate(0, -33); g.rotate(-.05); g.translate(0, 30); }   // trance: chin lifted, head tipped back a touch
  for (const s of [-1, 1]) S.part(g, PL([[s * 17, -64], [s * 30, -82], [s * 20, -48]]), skin, { x:s * 22, y:-64, r:8 }, { flat:true, mat:'skin' });
  const head = SM([[-19, -72], [-21, -56], [-18, -40], [-9, -24], [0, -16, 1], [9, -24], [18, -40], [21, -56], [19, -72], [10, -88], [-10, -88]], .85); S.part(g, head, skin, { x:0, y:-56, r:30 }, { mat:'skin', hx:-9, hy:-76 });
  S.contact(g, torso, 0, -30, 16, 6, .45);
  for (const s of [-1, 1]){ S.contact(g, head, s * 13, -36, 8, 11, FN ? .4 : .3); S.dot(g, E(s * 15.5, -47, 4, 2.4, s * .5), '#ffffff', .22); }   // hollow cheeks under lit cheekbones
  if (FN){   // dark veins webbing the temples, the cheeks and the throat
    g.save(); head(g); g.clip();
    for (const s of [-1, 1]){ S.ln(g, [[s * 17, -70], [s * 14, -62], [s * 16, -55], [s * 13, -50]], VEIN, 1.2, .7); S.ln(g, [[s * 14, -62], [s * 10, -64]], VEIN, .9, .55); S.ln(g, [[s * 13, -44], [s * 10, -36], [s * 12, -30]], VEIN, 1.1, .65); S.ln(g, [[s * 10, -36], [s * 7, -33]], VEIN, .8, .5); }
    S.ln(g, [[3, -24], [5, -19], [3, -16]], VEIN, 1, .6); S.ln(g, [[-4, -22], [-6, -18]], VEIN, .8, .45); g.restore(); }
  S.ln(g, [[-1.5, -48], [-3.5, -38], [-.5, -36]], { deep:skin.deep }, 1.2, .4); S.dot(g, E(1.5, -45, 1.4, 3), '#ffffff', .3);   // straight sharp nose
  const hair = SM([[-22, -62], [-25, -80], [-13, -94], [0, -92], [13, -94], [25, -80], [22, -62], [12, -77], [0, -67, 1], [-12, -77]], .8); S.part(g, hair, HAIR, { x:0, y:-80, r:26 }, { mat:'leather', hx:-10, hy:-86 });
  S.crease(g, SO([[-15, -89], [-7, -74]]), { deep:'#9a8ea0', rim:'#9a8ea0' }, 1.5, .5); S.crease(g, SO([[13, -89], [7, -76]]), { deep:'#9a8ea0', rim:'#9a8ea0' }, 1.1, .35); S.crease(g, SO([[-3, -91], [-1, -76]]), { deep:'#9a8ea0', rim:'#9a8ea0' }, 1, .3);
  if (FN){ g.save(); hair(g); g.clip(); S.dot(g, SM([[-11, -94], [-5, -92], [-2, -80], [0, -68], [-4, -70], [-8, -80]], .8), '#c4ccda', .92); S.ln(g, [[-7, -90], [-3, -72]], { deep:'#ffffff' }, .7, .55); S.ln(g, [[-9, -88], [-6, -76]], { deep:'#8a94a8' }, .6, .5); g.restore(); }   // a streak gone lightning-white
  if (F2 && !FN){   // gold crown set into the hair, a blood gem at its peak
    S.part(g, SM([[-22, -80], [-24, -92], [-16, -87], [-12, -104, 1], [-6, -89], [0, -110, 1], [6, -89], [12, -104, 1], [16, -87], [24, -92], [22, -80]], .5), GOLD, { x:0, y:-90, r:24 }, { mat:'metal', flat:true, hx:-10, hy:-88 });
    for (const x of [-12, 0, 12]) S.dot(g, E(x, x ? -103 : -109, 1.6, 1.6), '#fff4c0', .9);
    S.part(g, E(0, -90, 3.4, 4), CRIM, { x:0, y:-90, r:3.4 }, { flat:true, lw:.8 }); S.dot(g, E(-1, -91.5, 1, 1), '#fff', .9); }
  if (FN){   // the crown gone to blackened iron: taller, sharper spikes, one snapped, a cracked band, a blood gem burning at the peak, sparks jumping between the points
    const crown = SM([[-23, -80], [-25, -93], [-19, -88], [-16, -108, 1], [-12, -89], [-6, -89], [0, -118, 1], [6, -89], [10, -89], [14, -104, 1], [17, -88], [25, -93], [23, -80]], .4);
    S.part(g, crown, IRONC, { x:0, y:-92, r:25 }, { mat:'metal', flat:true, hx:-12, hy:-90 }); S.stroke(g, crown, { deep:'#b8c4e0' }, .8, .4);
    S.ln(g, [[-24, -90], [-20, -84], [-16, -86]], { deep:'#000000' }, .9, .6); S.ln(g, [[10, -83], [13, -88]], { deep:'#000000' }, .8, .5);
    for (const [x, y] of [[-16, -107], [0, -117], [14, -103]]) S.dot(g, E(x, y, 1.3, 1.3), '#c8d4ff', .8);
    g.save(); g.shadowColor = '#ff2030'; g.shadowBlur = 12; S.dot(g, E(0, -92, 4.4, 5), '#ff2a3a', .6); g.restore();
    S.part(g, E(0, -92, 3.8, 4.4), BLOOD, { x:0, y:-92, r:3.8 }, { flat:true, lw:.8, mat:'gel' }); S.dot(g, E(-1.2, -93.6, 1.1, 1.1), '#fff', .9);
    if (fr % 3 === 0) bolt(g, [-16, -107], [0, -116], 600 + fr, .8, 2.5, false); else if (fr % 3 === 1) bolt(g, [0, -116], [14, -103], 620 + fr, .8, 2.5, false); }
  // eyes: slim, slanted and heavy-lidded; closed in the trance; dazed under deeper lids when stunned
  const ey = -53, irisC = FN ? { irisL:'#ffb4b4', iris:'#ff1a2a', irisD:'#6a0010', white:'#f3dfe3', veins:true, pupil:'#2a0008' } : F2 ? { irisL:'#ff8a8a', iris:'#e01828', irisD:'#7a0414' } : { irisL:'#ff9a9a', iris:'#d82a3a', irisD:'#7c0c1c' };
  if (F2){ g.save(); for (const s of [-1, 1]){ const gr = g.createRadialGradient(s * 9.5, ey, 2, s * 9.5, ey, FN ? 30 : 26); gr.addColorStop(0, `rgba(255,40,60,${tr != null ? .3 : FN ? .62 : .5})`); gr.addColorStop(1, 'rgba(255,40,60,0)'); g.fillStyle = gr; g.save(); g.translate(s * 9.5, ey); g.scale(1.4, .4); g.translate(-s * 9.5, -ey); ell(g, s * 9.5 + s * 8, ey, FN ? 30 : 26, FN ? 30 : 26); g.fill(); g.restore(); } g.restore();   // trailing crimson glow streaming from the eyes
    if (tr == null) for (const s of [-1, 1]) S.glow(g, s * 9.5, ey, (FN ? 5.8 : 5) + pulse * 2, eyeCol); }
  if (tr != null) for (const s of [-1, 1]){ eye(s, s * 9.5, ey, { closed:true }); brow(s, s * 9.5, ey - 10, -1.5); }
  else if (st != null){ for (const s of [-1, 1]){ eye(s, s * 9.5, ey, { ...irisC, lid:.7, dx:2.2, dy:.4, ir:3 }); brow(s, s * 9.5, ey - 10, -2.5); } }
  else for (const s of [-1, 1]){ eye(s, s * 9.5, ey, irisC); brow(s, s * 9.5, ey - 9, FN ? 5 : F2 ? 4 : 2.5); }
  if (FN){   // blood tears bleeding from the eyes, glowing like the irises
    g.save(); head(g); g.clip(); g.shadowColor = '#ff2030'; g.shadowBlur = 5;
    for (const s of [-1, 1]){ const x0 = s * 12, y0 = ey + (tr != null ? 1 : 3); S.dot(g, SM([[x0 - 1.6, y0, 1], [x0 + 1.6, y0, 1], [x0 + s * 1.2 + .9, y0 + 11], [x0 + s * 1.4, y0 + 18], [x0 + s * 1.2 - .9, y0 + 11]], .7), '#b80e22', .95); S.ln(g, [[x0 - s * .4, y0 + 1], [x0 + s * .6, y0 + 12]], { deep:'#ff9aa0' }, .5, .6); drop(g, x0 + s * 1.4, y0 + 20, 1, .95); }
    g.restore(); }
  // thin mouth with one corner raised, two long fangs; opens into a snarl for bats and walls
  const grin = wa != null || ba != null, my = -30;
  if (grin){ S.dot(g, SM([[-8, my], [0, my + .5], [8, my - 1.5], [4, my + 5], [-4, my + 5.5]], .7), '#3a0c18');
    if (FN){ g.save(); g.shadowColor = '#ff2030'; g.shadowBlur = 8; S.dot(g, SM([[-6, my + 1], [0, my + 1.4], [6, my - .4], [3, my + 4], [-3, my + 4.4]], .7), '#ff2a3a', .85); g.restore(); } }   // fallen: the throat glows crimson
  else if (FN){ g.save(); g.shadowColor = '#ff2030'; g.shadowBlur = 6; S.dot(g, SM([[-7, my + .3], [0, my + 1.2], [7, my - 1.4], [2, my + 2.2], [-4, my + 2.4]], .7), '#ff2a3a', .55); g.restore(); }   // and a seam of light shows even with the mouth shut
  S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(-8, my); g2.quadraticCurveTo(-3, my + 1.6, 0, my + 1.2); g2.quadraticCurveTo(4, my + .8, 8, my - 2); }, lash, 1.4, .85);
  const fl = FN ? 11 : F2 ? 9 : 7.5;
  for (const s of [-1, 1]){ const fx = s * 4.6; S.dot(g, PL([[fx - 1.5, my + .2], [fx + 1.5, my + .2], [fx + s * .3, my + fl]]), FN ? '#ece6ea' : '#f8f3f4'); S.ln(g, [[fx + s * 1.2, my + .6], [fx + s * .3, my + fl]], { deep:'#8a7a80' }, .6, .6); }
  if (F2) for (const s of [-1, 1]){ const fx = s * 4.6 + s * .3, ty = my + fl - 1, ext = s > 0 ? 3 : 0; S.dot(g, RR(fx - .8, ty, 1.6, 5 + ext, .8), '#b00c24', .95); S.dot(g, E(fx, ty + 5.5 + ext, 1.6, 2), '#c8102a', .95); S.dot(g, E(fx - .5, ty + 4.8 + ext, .5, .6), '#ff9aa0', .9); }   // blood running from the fangs
  if (FN){ S.dot(g, RR(7.6, my - 1.4, 1.4, 9, .7), '#b00c24', .9); drop(g, 8.3, my + 9.5, 1.1, .9); }   // and from the raised corner of the mouth
  g.restore();
  if (tr != null){ g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, -20, 6, 0, -20, 78); gr.addColorStop(0, `rgba(255,40,50,${.22 + pulse * .16})`); gr.addColorStop(1, 'rgba(255,40,50,0)'); g.fillStyle = gr; g.fillRect(-90, -110, 180, 180); g.restore(); }   // the figure itself glows blood-red with the aura
  if (st != null) for (let i = 0; i < 3; i++){ const a = st * TAU + i * TAU / 3, x = Math.cos(a) * 30, y = -104 + Math.sin(a) * 7; star(g, x, y, 4.5 + Math.sin(a) * 1, FN ? '#c8d4ff' : '#ffd35a'); }
  g.restore();
  if (F2) g.restore();
}

// ---------- registry entry (copied from W4.vampirecount, box widened for the larger wings and the spear) ----------
const loop = (m, cl) => Math.floor(m.ph * cl.fps) % cl.n;
export const FALLEN = { key:'vampirecount', name:'The Fallen Count', draw:fallenVampirecount, scale:.76, dy:-6, box:{ x:-172, y:-208, w:344, h:298 }, variants:{ form2:true, fallen:true },
  clips:{ walk:{ n:8, fps:6, pose:t => ({ idle:t }) }, trance:{ n:8, fps:8, pose:t => ({ trance:t }) }, stun:{ n:6, fps:8, pose:t => ({ stun:t }) }, bats:{ n:8, fps:12, once:true, pose:t => ({ bats:t }) }, wall:{ n:8, fps:10, once:true, pose:t => ({ wall:t }) }, teleport:{ n:8, fps:16, once:true, pose:t => ({ teleport:t }) } }, still:{},
  frame(m, clips){ if (m.stunT > 0) return ['stun', loop(m, clips.stun)]; if (m.healing) return ['trance', loop(m, clips.trance)]; return null; } };
