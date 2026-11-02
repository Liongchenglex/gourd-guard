// ---------- Casket Jack (nightmare Pumpkin Patch), design archive ----------
// Owner: "a monster that summons mummies but also fitting for pumpkin patch. Something to do with coffins?"
//   casketjack — a walking pumpkin-wood coffin from the farm graveyard: a jack-o'-lantern face carved into the lid, a pumpkin stem and
//                vine sprouting from the head end, iron hinges, a cross-nailed patch plank and a twine belt, stubby root legs and
//                vine arms, a rusty spade in one hand. On `summon` its lid creaks open with dust and amber light and a mummy's
//                wrapped hands reach out; the mummy steps out in front of it as the lid slams shut.
//   coffin     — the coffin it leaves on the field when it falls: lying in a dirt mound, face glowing through the cracks
//                (`idle`), and an `open` clip where the lid flips up with dust and light and two wrapped hands reach out.
// Drawn around (0,0) in drawing units with the feet at y = 50 (the prop sits on y ≈ 20). Every clip is meant to be baked
// (render/anim.js), so the glows are fine; nothing random per frame (rng(seed) only).
// NOT for the game: lives in the owner's design archive.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';

// ---------- palette: pumpkin-wood, rust, vine, amber glow ----------
const WOOD = pal('#b5652a'), WOODD = pal('#7c3f1c'), WOODIN = pal('#4a2412'), IRON = pal('#5f5a62'), RUST = pal('#8a4a2a'),
  VINE = pal('#4f8a2e'), LEAF = pal('#6aa83a'), STEM = pal('#7a5a2c'), TWINE = pal('#c9a464'), DIRT = pal('#5a3c26'), DIRTL = pal('#7a5636'),
  WRAP = pal('#ece0c4'), SPADE = pal('#8c8a96'), HANDLE = pal('#9a7448');
const GLOW = '#ffa030', GLOW_HOT = '#ffe8a8', DUST = '#c9b08a', CAVE = '#1a0c08';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t * t * (3 - 2 * t);
/** Rounded polygon path (each corner rounded by r). */
const RP = (pts, r = 3) => g => { const n = pts.length; g.beginPath(); const m = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2]; g.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++){ const p = pts[i], q = pts[(i + 1) % n]; g.arcTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, r); } g.closePath(); };

// The upright coffin's front outline: narrow head end, wide shoulders, narrow foot end.
const OUT = [[-14, -66], [14, -66], [27, -36], [16, 38], [-16, 38], [-27, -36]];
const inset = (pts, k, cx = 0, cy = -12) => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
const LID = inset(OUT, .9, 0, -14);

/** Soft dust puffs; seed picks the cloud, q 0..1 its spread and fade. */
function dust(g, x, y, q, seed, n = 7, spread = 24, up = 14){
  if (q <= 0 || q >= 1) return; const R = rng(seed);
  for (let i = 0; i < n; i++){ const a = -Math.PI * (.1 + R() * .8) + (R() < .5 ? 0 : Math.PI * .2), sp = spread * (.5 + R() * .7), r = 2.5 + R() * 3.5;
    const px = x + Math.cos(a) * sp * ease(q) * (R() < .5 ? -1 : 1), py = y + Math.sin(a) * up * ease(q) - q * 6;
    g.save(); g.globalAlpha *= (1 - q) * .75; S.dot(g, E(px, py, r * (1 + q), r * (1 + q) * .8), DUST); S.dot(g, E(px - r * .3, py - r * .3, r * .5, r * .4), '#ead8b4', .6); g.restore(); }
}
/** A carved, glowing jack-o'-lantern eye socket with a small floating pupil (the toy eye rule, carved). */
function carvedEye(g, x, y, s, flip, glow, look = 0){
  const sock = SM([[x - 7 * s * flip, y + 5 * s], [x + 7 * s * flip, y + 6 * s], [x + 6 * s * flip, y - 3 * s], [x - 3 * s * flip, y - 7 * s]], .8);
  S.dot(g, sock, '#2a1206');
  g.save(); g.shadowColor = GLOW; g.shadowBlur = 6 + glow * 6; sock(g); const gr = g.createRadialGradient(x, y + s, 0, x, y, 9 * s); gr.addColorStop(0, GLOW_HOT); gr.addColorStop(.55, GLOW); gr.addColorStop(1, '#c2410f'); g.fillStyle = gr;
  g.save(); g.translate(x, y); g.scale(.82, .82); g.translate(-x, -y); sock(g); g.fill(); g.restore(); g.restore();
  const px = x + (1.4 + look) * s * flip * .4 + .6 * s, py = y + 1.4 * s; S.dot(g, E(px, py, 2.3 * s, 2.7 * s), '#2a1206'); S.dot(g, E(px - .8 * s, py - 1 * s, .9 * s, .8 * s), '#fff');
}
/** The jagged carved grin; open 0..1 drops the lower teeth. */
function grin(g, y, open, glow){
  const o = open * 6, top = [[-14, y - 2], [-9, y + 1], [-6, y - 2], [-2, y + 1], [2, y - 2], [6, y + 1], [9, y - 2], [14, y - 2]],
    bot = [[13, y + 1 + o * .5], [8, y + 6 + o], [4, y + 3 + o], [0, y + 7 + o], [-4, y + 3 + o], [-8, y + 6 + o], [-13, y + 1 + o * .5]];
  const p = PL([...top, ...bot]); S.dot(g, p, '#2a1206');
  g.save(); g.shadowColor = GLOW; g.shadowBlur = 6 + glow * 6; g.translate(0, .6); g.scale(.92, .92); g.translate(0, y * (1 / .92 - 1)); p(g); const gr = g.createLinearGradient(0, y - 2, 0, y + 8 + o); gr.addColorStop(0, GLOW_HOT); gr.addColorStop(1, GLOW); g.fillStyle = gr; g.fill(); g.restore();
  for (const x of [-5, 5]) S.part(g, RR(x - 1.8, y - 2.5, 3.6, 4, 1), WOOD, { x, y, r:3 }, { flat:true, noEdge:true });   // two wooden tooth stubs
}
/** Iron strap hinge on the lid's left edge. */
function hinge(g, x, y, len = 13){ S.part(g, RR(x - 3, y - 3, len, 6, 2.5), IRON, { x:x + len / 2, y, r:len / 2 }, { flat:true, mat:'metal', lw:1 }); S.rivet(g, x + 1, y, 1.6, IRON); S.rivet(g, x + len - 4, y, 1.3, IRON); S.dot(g, E(x + len * .6, y + 2.6, 2.4, 1), RUST.base, .7); }
const nail = (g, x, y) => S.rivet(g, x, y, 1.25, IRON);

/** The front lid: planks, carved face, hinges, patch plank, nails. o.open (grin), o.glow (light through the carvings), o.back draws the plain inner face. */
function lid(g, o = {}){
  const p = RP(LID, 4);
  if (o.back){ S.part(g, p, WOODD, { x:0, y:-18, r:44 }, { mat:'wood', hx:-8, hy:-46 }); for (const x of [-8, 8]) S.ln(g, [[x, -58], [x * .9, 32]], WOODIN, 1.4, .55); S.dot(g, E(-2, -40, 9, 8), '#2a1206', .35); return; }
  S.part(g, p, WOOD, { x:0, y:-18, r:44 }, { mat:'wood', hx:-12, hy:-48 });
  g.save(); p(g); g.clip(); for (const x of [-9, 9]){ S.ln(g, [[x, -70], [x * .86, 40]], WOODD, 1.6, .7); S.ln(g, [[x + 1.2, -70], [x * .86 + 1.2, 40]], { deep:WOOD.light }, .8, .45); } g.restore();
  // a patch plank nailed across the foot end
  g.save(); g.translate(-1, 16); g.rotate(-.24); S.part(g, RR(-17, -4.5, 34, 9, 2), WOODD, { x:0, y:0, r:17 }, { flat:true, mat:'wood', lw:1.2 }); nail(g, -13, 0); nail(g, 13, 0); g.restore();
  carvedEye(g, -9.5, -40, 1, -1, o.glow ?? 0, o.look ?? 0); carvedEye(g, 9.5, -40, 1, 1, o.glow ?? 0, o.look ?? 0);
  grin(g, -22, o.open ?? 0, o.glow ?? 0);
  for (const [x, y] of [[-11, -58], [11, -58], [-14, 2], [14, 2]]) nail(g, x, y);
  hinge(g, -24, -42, 12); hinge(g, -16, 28, 11);
  S.part(g, RR(19, -16, 5, 9, 2), IRON, { x:21, y:-12, r:5 }, { flat:true, mat:'metal', lw:1 });   // latch
}
/** The pumpkin stem, vine and leaves sprouting from the head end of the coffin. */
function sprout(g, x, y, sw){
  S.tube(g, SO([[x - 2, y + 4], [x - 4 + sw, y - 6], [x + 2 + sw * 1.5, y - 13]]), STEM, 5.5); S.part(g, E(x + 2 + sw * 1.5, y - 13, 3.4, 2.4, -.4), STEM, { x:x + 2, y:y - 13, r:3 }, { flat:true, mat:'wood' });
  S.stroke(g, SO([[x + 1, y], [x + 12 + sw, y - 4], [x + 15 + sw, y - 12], [x + 10 + sw, y - 14], [x + 11 + sw, y - 9]], .9), VINE, 1.6, .95);
  for (const [lx, ly, a, r] of [[x - 12 + sw * .5, y - 3, -.6, 6.5], [x + 9, y + 2, .4, 5]]){ S.part(g, SM([[lx - r, ly], [lx - r * .2, ly - r * .7], [lx + r, ly - r * .1], [lx + r * .1, ly + r * .6]], .7), LEAF, { x:lx, y:ly, r }, { flat:true }); S.ln(g, [[lx - r * .8, ly], [lx + r * .8, ly - r * .1]], LEAF, .8, .6); }
}
/** Wrapped mummy arm reaching from (x0,y0) toward (x1,y1); s scales it (closer = bigger). */
function wrappedArm(g, x0, y0, x1, y1, s, dir){
  S.tube(g, SO([[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2 * s], [x1, y1]]), WRAP, 7 * s);
  for (let i = 1; i < 4; i++){ const t = i / 4, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + 1.5 * s; S.ln(g, [[x - 1.5 * s, y - 3.4 * s], [x + 1.5 * s, y + 3.4 * s]], WRAP, 1, .5); }
  S.hand(g, x1, y1, WRAP, dir, 3, 5 * s);
  S.thread(g, x1 - 4 * s, y1 + 3 * s, -1, WRAP);
}

// ---------- Casket Jack ----------
export function casketjack(g, P = {}){
  const w = P.walk, ch = P.chew, su = P.summon;
  // summon timeline: creak (0–.15), swing open (.15–.45), hands reach (.4–.7), withdraw as the mummy steps out (.7–.8), slam shut (.8–1)
  const creak = su == null ? 0 : (su < .18 ? Math.sin(su * 70) * .035 : 0),
    openA = su == null ? 0 : su < .8 ? ease(clamp((su - .15) / .3)) : 1 - ease(clamp((su - .8) / .14)),
    reach = su == null ? 0 : su < .7 ? ease(clamp((su - .4) / .3)) : 1 - ease(clamp((su - .7) / .1)),
    glow = su == null ? (ch != null ? .3 : 0) : clamp(openA * 1.2),
    slam = su == null ? 0 : clamp((su - .9) / .1);
  const step = w == null ? 0 : Math.sin(w * TAU), bob = w != null ? -Math.abs(step) * 3 : ch != null ? Math.sin(ch * TAU) * 2.5 : su != null ? -openA * 2 : 0,
    rock = w != null ? step * .08 : ch != null ? .03 + Math.sin(ch * TAU) * .03 : creak, chomp = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  S.shadow(g, 0, 52, 34, 6);
  // root legs (behind)
  for (const s of [-1, 1]){ const ph = w == null ? null : w * TAU + (s < 0 ? 0 : Math.PI), ly = ph == null ? 0 : -Math.max(0, Math.sin(ph)) * 7, lx = ph == null ? 0 : Math.cos(ph) * 3;
    S.tube(g, SO([[s * 8, 30], [s * 11 + lx * .5, 40 + ly * .5], [s * 12 + lx, 47 + ly]]), WOODD, 8);
    const f = SM([[s * 4 + lx, 46 + ly], [s * 3 + lx, 51 + ly], [s * 14 + lx, 53 + ly], [s * 22 + lx, 51 + ly], [s * 18 + lx, 45 + ly]], .7); S.part(g, f, WOODD, { x:s * 13 + lx, y:49 + ly, r:9 }, { flat:true, mat:'wood' });
    for (const d of [0, 6]) S.tube(g, SO([[s * (14 + d) + lx, 51 + ly], [s * (17 + d) + lx, 54 + ly]]), WOODD, 2.2); }
  g.save(); g.translate(0, 48); g.rotate(rock); g.translate(0, -48 + bob);
  if (ch != null){ g.translate(0, 38); g.scale(1, 1 - chomp * .04); g.translate(0, -38); }
  // the coffin box: back plate and side depth (darker), then the front rim
  const body = RP(OUT, 5);
  g.save(); g.translate(5, -3); S.part(g, body, WOODD, { x:0, y:-14, r:50 }, { mat:'wood', flat:true }); g.restore();
  S.part(g, body, WOOD, { x:0, y:-14, r:50 }, { mat:'wood', hx:-14, hy:-50 });
  // twine belt round the box
  S.stroke(g, SO([[-26, -6], [0, -3], [26, -6]]), { deep:TWINE.deep }, 4.2, .9); S.stroke(g, SO([[-26, -6], [0, -3], [26, -6]]), { deep:TWINE.base }, 2.6, 1);
  // the cavity and the mummy inside (seen only while the lid is open)
  if (openA > .02){
    const cav = RP(LID, 4); S.dot(g, cav, CAVE);
    g.save(); cav(g); g.clip();
    const gr = g.createRadialGradient(0, -20, 2, 0, -18, 46); gr.addColorStop(0, rgba(GLOW_HOT, .85 * glow)); gr.addColorStop(.35, rgba(GLOW, .6 * glow)); gr.addColorStop(1, rgba('#3a1408', 0)); g.fillStyle = gr; g.fillRect(-40, -80, 80, 130);
    // a mummy standing in the dark: wrapped head and shoulders, one ember eye
    const mh = SM([[-12, -54], [-14, -40], [-9, -30], [0, -28], [9, -30], [14, -40], [12, -54], [0, -60]]);
    g.save(); g.globalAlpha *= .9; S.part(g, SM([[-24, -24], [-20, 10], [20, 10], [24, -24], [0, -30]]), pal('#8a7a60'), { x:0, y:-10, r:26 }, { flat:true, mat:'bandage' }); S.part(g, mh, pal('#a8987a'), { x:0, y:-44, r:14 }, { flat:true, mat:'bandage' });
    S.wrap(g, mh, pal('#a8987a'), [[-16, -50, 16, -46], [-16, -36, 16, -38]], 4.5); S.dot(g, SM([[-10, -45], [6, -46], [5, -39], [-9, -39]], .7), '#2a1a30'); S.glow(g, -3, -42, 3, GLOW); g.restore();
    S.overlay(g, cav, { deep:'#120604' }, { x:0, y:-18, r:36 }, .65);
    g.restore();
    S.stroke(g, cav, { deep:'#2a1206' }, 1.6, .9);
  }
  // the lid, swinging on its left-edge hinge: cos(angle) squeezes it, past 90° its inner face shows
  const ang = openA * 2.05, k = Math.cos(ang), hx = -24;
  g.save(); g.translate(hx, 0); g.transform(Math.max(Math.abs(k), .04) * Math.sign(k || 1), Math.sin(ang) * -.06, 0, 1, 0, 0); g.translate(-hx, 0);
  if (k >= 0) lid(g, { open:chomp, glow:glow + (ch != null ? chomp * .4 : 0), look:w != null ? step * .4 : 0 }); else { g.save(); g.translate(0, 0); lid(g, { back:true }); g.restore(); }
  g.restore();
  // light spilling over the front edge while open
  if (openA > .1){ g.save(); g.globalAlpha *= openA * .6; g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(4, -10, 4, 4, -10, 60); gr.addColorStop(0, 'rgba(255,170,60,.45)'); gr.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = gr; g.fillRect(-70, -90, 140, 150); g.restore(); }
  sprout(g, 2, -66, w != null ? step * 2 : ch != null ? chomp * 2 : openA * -3);
  // vine arms; the right hand carries a rusty spade
  for (const s of [-1, 1]){ const swing = w != null ? Math.sin(w * TAU + (s < 0 ? Math.PI : 0)) * .22 : ch != null ? -.32 - chomp * .26 : su != null ? -openA * .4 - creak * 4 : 0;
    g.save(); g.translate(s * 25, -30); g.rotate(swing * s); g.translate(-s * 25, 30);
    const hxx = s * 38, hyy = ch != null ? -2 : 4;
    if (s > 0){ g.save(); g.translate(hxx, hyy); g.rotate(-.3); S.tube(g, SO([[0, -30], [0, 30]]), HANDLE, 3.6); S.part(g, RR(-5, -36, 10, 7, 3), HANDLE, { x:0, y:-32, r:5 }, { flat:true, mat:'wood' });
      const blade = SM([[-7, 28], [7, 28], [8, 40], [0, 48, 1], [-8, 40]], .6); S.part(g, blade, SPADE, { x:0, y:37, r:10 }, { flat:true, mat:'metal' }); g.save(); blade(g); g.clip(); for (const [x, y, r] of [[-4, 41, 3], [4, 34, 2.4], [2, 44, 2]]) S.dot(g, E(x, y, r, r * .8), RUST.base, .75); g.restore(); g.restore(); }
    S.tube(g, SO([[s * 25, -30], [s * 33, -18], [hxx, hyy - 4]]), VINE, 6); S.stroke(g, SO([[s * 25, -28], [s * 30, -24], [s * 31, -18], [s * 35, -14]]), { deep:VINE.deep }, 1, .6);
    S.part(g, E(s * 29, -24, 3.6, 2.2, s * .6), LEAF, { x:s * 29, y:-24, r:3.6 }, { flat:true });
    S.hand(g, hxx, hyy, VINE, Math.PI * (s < 0 ? .62 : .38), 3, 5.2);
    g.restore(); }
  // wrapped mummy hands reaching out of the coffin toward the viewer
  if (reach > 0){ const r = reach; for (const [s, y0, ya, sz] of [[-1, -28, -12, 1], [1, -16, 4, 1.12]]){ wrappedArm(g, s * 4, y0, s * (8 + 14 * r), y0 + (ya - y0) * r + 6 * r, (.75 + .45 * r) * sz, Math.PI * (s < 0 ? .75 : .25) + .3 * (1 - r)); } }
  g.restore();
  // dust: a creak puff from the seams, a cloud as it swings open, and a burst at the slam
  if (su != null){ dust(g, -22, -8, clamp(su / .22), 3, 5, 14, 10); dust(g, -26, -20, clamp((su - .18) / .4), 9, 8, 30, 22); dust(g, 0, 40, clamp((su - .55) / .35), 21, 6, 30, 6); dust(g, -4, -10, slam, 33, 9, 40, 26); }
}

// ---------- the field coffin (left where Casket Jack falls) ----------
// Lies in a dirt mound, head end to the left. idle: the carved face glows through the cracks; open: the lid flips up on its
// back edge with dust and light and two wrapped hands reach up; the engine pops the mummy out on the last frame.
const PLID = [[-42, -4], [-30, -16], [34, -14], [44, -4], [34, 6], [-30, 6]];
export function coffinProp(g, P = {}){
  const op = P.open ?? 0, pulse = P.idle == null ? 0 : (Math.sin(P.idle * TAU) + 1) / 2,
    lift = ease(clamp(op / .55)), reach = ease(clamp((op - .3) / .7)), glow = .25 + pulse * .2 + lift * .75;
  const R = rng(17);
  S.shadow(g, 0, 18, 56, 7);
  // dirt mound
  const mound = SM([[-56, 16], [-50, 4], [-30, 0], [0, 2], [30, 0], [52, 4], [58, 16], [0, 20]], .8); S.part(g, mound, DIRT, { x:0, y:10, r:56 }, { mat:'stone', flat:true });
  for (let i = 0; i < 8; i++){ const x = -50 + R() * 100, y = 8 + R() * 8, r = 1.5 + R() * 2; S.part(g, E(x, y, r, r * .8), DIRTL, { x, y, r }, { flat:true, noEdge:true }); }
  // the box: front face below the lid edge
  const front = RP([[-42, -4], [-30, 6], [34, 6], [44, -4], [44, 6], [34, 15], [-30, 15], [-42, 6]], 2); S.part(g, front, WOODD, { x:0, y:6, r:46 }, { mat:'wood', flat:true });
  for (const x of [-24, 0, 24]) S.ln(g, [[x, 7], [x, 14]], WOODIN, 1, .5); hinge(g, -20, 10, 10); hinge(g, 12, 10, 10);
  // cavity, revealed as the lid lifts
  const cav = RP(PLID, 3);
  S.dot(g, cav, CAVE);
  g.save(); cav(g); g.clip(); const gr = g.createRadialGradient(0, -4, 1, 0, -4, 44); gr.addColorStop(0, rgba(GLOW_HOT, .9 * glow)); gr.addColorStop(.4, rgba(GLOW, .6 * glow)); gr.addColorStop(1, rgba('#3a1408', 0)); g.fillStyle = gr; g.fillRect(-50, -20, 100, 30);
  if (lift > .05){ S.part(g, SM([[-30, -6], [-26, -12], [-14, -12], [-10, -6], [-14, 0], [-26, 0]], .8), pal('#a8987a'), { x:-20, y:-6, r:10 }, { flat:true, mat:'bandage' }); S.glow(g, -18, -7, 2.4, GLOW); }   // the mummy's wrapped head in the box
  g.restore();
  // the lid: hinged on its back (top) edge, flipping up and over; its underside shows past vertical
  const ang = lift * 2.3, k = Math.cos(ang), hy = -15;
  g.save(); g.translate(0, hy); g.transform(1, 0, -Math.sin(ang) * .08, Math.max(Math.abs(k), .05) * Math.sign(k || 1), 0, 0); g.translate(0, -hy - lift * 3);
  const lp = RP(PLID, 3);
  if (k >= 0){ S.part(g, lp, WOOD, { x:0, y:-4, r:44 }, { mat:'wood', hx:-20, hy:-12 });
    g.save(); lp(g); g.clip(); for (const y of [-9, 1]) S.ln(g, [[-46, y], [46, y]], WOODD, 1.3, .6); g.restore();
    // carved face near the head end, glowing through
    g.save(); g.shadowColor = GLOW; g.shadowBlur = 5 + glow * 6;
    for (const [x, fl] of [[-20, -1], [-10, 1]]) S.dot(g, PL([[x - 3 * fl, -2], [x + 3 * fl, -1], [x + 1 * fl, -8]]), mix(GLOW, GLOW_HOT, pulse * .6));
    S.dot(g, PL([[-23, 1], [-20, 3], [-17, 1], [-14, 3], [-11, 1], [-7, 1], [-10, 5], [-15, 4], [-20, 5]]), mix(GLOW, GLOW_HOT, pulse * .4)); g.restore();
    for (const [x, y] of [[-36, -4], [38, -4], [8, -12], [8, 3]]) nail(g, x, y);
    g.save(); g.translate(18, -4); g.rotate(-.18); S.part(g, RR(-12, -3, 24, 6, 1.5), WOODD, { x:0, y:0, r:12 }, { flat:true, mat:'wood', lw:1 }); nail(g, -9, 0); nail(g, 9, 0); g.restore();
    sprout(g, -40, -6, pulse * 1.5);
  } else { S.part(g, lp, WOODD, { x:0, y:-4, r:44 }, { mat:'wood', flat:true }); g.save(); lp(g); g.clip(); const ug = g.createLinearGradient(0, -16, 0, 6); ug.addColorStop(0, rgba(GLOW, .55 * lift)); ug.addColorStop(1, rgba(GLOW, 0)); g.fillStyle = ug; g.fillRect(-50, -20, 100, 30); g.restore(); }
  g.restore();
  if (lift > .1){ g.save(); g.globalAlpha *= lift * .55; g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(0, -8, 3, 0, -8, 46); gl.addColorStop(0, 'rgba(255,170,60,.5)'); gl.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = gl; g.fillRect(-60, -60, 120, 80); g.restore(); }
  if (reach > 0) for (const [x, s] of [[-6, -1], [12, 1]]) wrappedArm(g, x, -2, x + s * 8 * reach, -2 - 30 * reach, .8 + .3 * reach, -Math.PI / 2 + s * .35);
  if (op > 0){ dust(g, -30, -10, clamp(op / .7), 41, 7, 30, 18); dust(g, 30, -10, clamp((op - .1) / .7), 43, 7, 30, 18); }
}

// ---------- clips (registry-style) ----------
// box: the frame in drawing units holding every pose. scale: a suggested in-game scale (mummy .6, r 22 → feet at 21; Casket Jack r 24 → dy = 22.8 − 50 × .62 ≈ −8).
export const CLIPS = {
  casketjack: { name:'Casket Jack', draw:casketjack, scale:.62, dy:-8, box:{ x:-66, y:-90, w:160, h:150 },
    clips:{ walk:{ n:8, fps:8, pose:t => ({ walk:t }) }, chew:{ n:4, fps:7, pose:t => ({ chew:t }) }, summon:{ n:10, fps:12, once:true, pose:t => ({ summon:t }) } } },
  coffin: { name:'Field coffin', draw:coffinProp, scale:.62, dy:0, box:{ x:-66, y:-56, w:132, h:84 },
    clips:{ idle:{ n:4, fps:5, pose:t => ({ idle:t }) }, open:{ n:6, fps:10, once:true, pose:t => ({ open:t }) } } },
};
