// ---------- Swooping Crows and the Lobber Cart, design archive ----------
// Two Pumpkin Patch monsters for the nightmare levels (owner approved the reads):
//   crows   — Swooping Crows: a small flock (three blue-black crows with ember-red eyes and ragged feathers) flying as one
//             unit down a lane. fly (cruising flap), swoop (wings folded back, streaking down the lane), chew (pecking the wall).
//             Variants c2 / c1 draw the flock with two or one crow left (proposal: each hit knocks one crow out of the flock).
//   crow    — one crow on its own, same clips.
//   cart    — the Lobber Cart (owner: "a lobber cart that lobs nets that lock pumpkins from the back of the map"): a rickety
//             two-wheeled plank cart with a spoon catapult on a twisted-rope skein, crewed by a little green goblin in a dented
//             pot helmet, with a wicker basket of rolled nets and a ghost-lantern on a bent pole. walk, idle, lob.
//   net     — the weighted rope net it lobs, tumbling open through the air (fly).
//   netted  — that net draped over one of the game's pumpkins in the patch, locking it: land, held, struggle, snap.
// Seen from the front like every monster: what leads (beaks, the cart's front planks) faces the wall at the bottom.
// Drawn around (0,0) in drawing units with the ground at y = 50. Glows are fine (clips are baked); nothing random per frame.
// NOT for the game: lives in the owner's design archive.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';
import { pumpkin } from '../../../../src/engine/render/chars/w1.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, u) => a + (b - a) * u;

// ---------- palettes ----------
const CROW = pal('#4a4268'), CROWW = pal('#383254'), CROWF = pal('#565078'), BEAK = pal('#7a7690'), TALON = '#d8d0e0', EMBER = '#ff4a22';
const WOOD = pal('#a5764a'), WOODD = pal('#7a5434'), PLANK = pal('#b88a58'), IRON = pal('#8a909c'), ROPE = pal('#c8a86a'), WICK = pal('#b88c4c'),
  GOB = pal('#8fbf3a'), GOBB = pal('#d8e89a'), POT = pal('#7c8494'), RAG = pal('#7a4ad0'), LANT = pal('#5a5a64'), GHOST = '#9cff7a', TUNIC = pal('#8a5a3a');
const GREEN = pal('#5c9c33');   // the game's Green pumpkin (PTYPES base), as keyart.js builds it

// =====================================================================================================
// CROWS
// =====================================================================================================
/** One wing, right side (s = 1) in shoulder-local units, ragged primaries at the trailing edge. */
function wingPath(s, seed){
  const R = rng(seed), j = () => (R() - .5) * 3;
  // leading edge, then four fingered primaries at the tip (a crow's spread hand), then a ragged trailing edge
  return SM([[0, -2], [s * 16, -10], [s * 30, -13], [s * (49 + j()), -12, 1], [s * 40, -7, 1], [s * (50 + j()), -4, 1], [s * 41, -1, 1], [s * (47 + j()), 4, 1], [s * 38, 3, 1], [s * (42 + j()), 10, 1], [s * 33, 6, 1],
    [s * (30 + j()), 13, 1], [s * 25, 8, 1], [s * (21 + j()), 14, 1], [s * 16, 9, 1], [s * 11, 13, 1], [s * 7, 8], [0, 8]], .5);
}
/** A crow at (0,0), body about 46 units tall (tail tip to talons). o: flap -1..1 (wings up), fold 0..1 (swept back for the dive),
 *  peck 0..1 (head jabs down, beak opens), blaze 0..1 (eyes flare), seed (ragged feathers). */
function crowFig(g, o = {}){
  const flap = o.flap ?? 0, fold = o.fold ?? 0, peck = o.peck ?? 0, blaze = o.blaze ?? 0, seed = o.seed ?? 1;
  // tail fan behind the body, pointing up the lane
  const R = rng(seed + 7);
  for (let i = -2; i <= 2; i++){ const a = -Math.PI / 2 + i * .26 * (1 - fold * .5), L = 22 + (i === 0 ? 3 : 0) + (R() - .5) * 4, x = Math.cos(a) * L, y = -4 + Math.sin(a) * L;
    S.part(g, SM([[i * 2.5 - 3, -2], [x - 3.5, y + 3], [x, y - 1, 1], [x + 3.5, y + 3], [i * 2.5 + 3, -2]], .6), CROWW, { x:x * .5, y:y * .5 - 2, r:12 }, { flat:true, mat:'skin', lw:1.1, noEdge:false }); }
  // wings: spread and flapping, or folded back and up into a dart for the dive
  for (const s of [-1, 1]){
    g.save(); g.translate(s * 8, -3);
    const a = -flap * .62 * (1 - fold) - fold * 1.2; g.rotate(s * a); g.scale(1 - fold * .18, 1 - fold * .5);
    const w = wingPath(s, seed + (s > 0 ? 3 : 5));
    S.part(g, w, CROWW, { x:s * 22, y:0, r:24 }, { mat:'skin', flat:true, hx:s * 18, hy:-6, lw:1.3 });
    S.crease(g, SO([[s * 6, 0], [s * 22, -6], [s * 40, -4]]), CROWW, 1.4, .5);
    S.crease(g, SO([[s * 8, 4], [s * 20, 2], [s * 32, 6]]), CROWW, 1.2, .4);
    g.save(); w(g); g.clip(); g.strokeStyle = 'rgba(150,130,230,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(s * 2, -3); g.quadraticCurveTo(s * 20, -12, s * 44, -7); g.stroke(); g.restore();   // violet sheen on the leading edge
    g.restore();
  }
  // talons tucked under (flying) or gripping (pecking)
  for (const s of [-1, 1]){ const fy = 20 + peck * 2; S.tube(g, SO([[s * 4, 14], [s * 5, fy]]), pal('#9a94ac'), 2.6); for (const d of [-2.2, 0, 2.2]) S.claw(g, s * 5 + d, fy + 1, Math.PI / 2 + d * .15, 3, TALON); }
  // body: a plump teardrop with a ruffled chest
  const body = SM([[-11, -9], [-13, 4], [-9, 15], [0, 19], [9, 15], [13, 4], [11, -9], [0, -12]]);
  S.part(g, body, CROW, { x:0, y:3, r:15 }, { mat:'skin' });
  g.save(); body(g); g.clip(); for (const [x, y] of [[-5, 6], [3, 4], [-1, 11], [6, 11], [-7, 13]]) S.crease(g, SO([[x - 3, y], [x, y + 2.5], [x + 3, y]]), CROW, 1.1, .45); g.restore();
  // head: jabs down to peck
  g.save(); g.translate(0, peck * 7); g.rotate(0);
  // ragged crest
  for (const [x, a, L] of [[-3, -1.75, 7], [1, -1.45, 9], [5, -1.15, 7]]) S.part(g, SM([[x - 2.5, -25], [x + Math.cos(a) * L, -25 + Math.sin(a) * L, 1], [x + 2.5, -25]], .5), CROWF, { x, y:-29, r:6 }, { flat:true, lw:1 });
  const head = SM([[-13, -18], [-12, -8], [-6, -2], [6, -2], [12, -8], [13, -18], [7, -27], [-7, -27]]);
  S.part(g, head, CROW, { x:0, y:-15, r:14 }, { mat:'skin', hx:-6, hy:-22 });
  S.contact(g, body, 0, -4, 10, 4, .45);
  // ember eyes set wide at the sides of the head, under a scowling brow
  for (const s of [-1, 1]){ S.dot(g, E(s * 7.4, -17, 3.8, 3.6), '#140c1c', .95); S.glow(g, s * 7.4, -17, 2.3 + blaze * .9, blaze > .5 ? '#ffb040' : EMBER);
    S.stroke(g, SO([[s * 12, -22], [s * 3.5, -19]]), CROW, 2.4, .95); }
  // the crow's big wedge beak, from the forehead down toward the wall; the lower half drops on the peck
  const gape = peck * 4;
  if (gape > .5){ S.dot(g, PL([[-4, -8], [4, -8], [0, 6 + gape]]), '#3a1428', .95); S.part(g, PL([[-3.6, -6], [3.6, -6], [0.6, 7 + gape * 1.3]]), BEAK, { x:0, y:0, r:5 }, { flat:true, lw:.9 }); }
  const bk = PL([[-5.2, -21], [5.2, -21], [4, -12], [.8, 6 + gape * .2], [-.8, 6 + gape * .2], [-4, -12]]);
  S.part(g, bk, BEAK, { x:0, y:-10, r:9 }, { mat:'horn', lw:1.1, hx:-1.6, hy:-17 });
  S.ln(g, [[0, -20], [0, 3]], BEAK, 1, .5);
  S.dot(g, E(-2, -15, .9, 1.4), BEAK.deep, .8); S.dot(g, E(2, -15, .9, 1.4), BEAK.deep, .8);
  g.restore();
}
/** Speed streaks trailing up the lane behind a diving crow, phase ph. */
function streaks(g, x, y, w, ph, a = 1){
  g.save(); g.lineCap = 'round';
  for (const [dx, k, L] of [[-.7, 0, 30], [-.25, .4, 40], [.25, .2, 36], [.7, .6, 28]]){ const u = (ph + k) % 1, yy = y - 18 - u * 14;
    g.strokeStyle = `rgba(200,190,255,${(.55 * (1 - u * .6) * a).toFixed(3)})`; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x + dx * w, yy); g.lineTo(x + dx * w, yy - L * (1 - u * .3)); g.stroke(); }
  g.restore();
}
/** A loose feather drifting. */
function feather(g, x, y, a, s = 1){ g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); S.part(g, SM([[0, -7], [2.4, -2], [1.6, 5], [0, 7, 1], [-1.6, 5], [-2.4, -2]], .7), CROWW, { x:0, y:0, r:6 }, { flat:true, lw:.9 }); S.ln(g, [[0, -6], [0, 8]], BEAK, .7, .6); g.restore(); }

// flock layout: [x, y, scale, phase offset, seed] for the lead crow and two flankers (cruising / diving)
const FLY_POS = [[-27, -22, .78, .37, 11], [28, -26, .78, .71, 23], [0, 12, 1, 0, 37]];
const DIVE_POS = [[-17, -30, .8, .3, 11], [18, -34, .8, .6, 23], [0, 8, 1, 0, 37]];
/** The flock as one unit. P: fly | swoop | chew (0..1), variant c2 / c1 (crows left), single (one crow, the `crow` entry). */
function crows(g, P = {}){
  const n = P.single ? 1 : P.variant === 'c1' ? 1 : P.variant === 'c2' ? 2 : 3;
  const birds = n === 3 ? [0, 1, 2] : n === 2 ? [1, 2] : [2];
  const fly = P.fly, sw = P.swoop, ch = P.chew;
  // shadows on the ground, under each bird
  for (const i of birds){ const [x, , s] = (sw != null ? DIVE_POS : FLY_POS)[i]; S.shadow(g, x * (P.single ? 0 : 1), 50 - (i < 2 ? 4 : 0), 15 * s, 3.2 * s); }
  if (sw != null) for (const i of birds){ let [x, y, s, off] = DIVE_POS[i]; if (P.single){ x = 0; y = 8; s = 1.2; } g.save(); g.translate(x, y); g.scale(s, s); streaks(g, 0, -10, 13, sw + off); g.restore(); }
  for (const i of birds){
    let [x, y, s, off, seed] = (sw != null ? DIVE_POS : FLY_POS)[i]; if (P.single){ x = 0; y = 8; s = 1.2; }
    g.save();
    if (fly != null){ const ph = (fly + off) * TAU; g.translate(x, y - Math.sin(ph) * 3.5); g.scale(s, s); crowFig(g, { flap:Math.sin(ph), seed }); }
    else if (sw != null){
      const ph = (sw + off) * TAU, jit = Math.sin(ph * 2) * 1.2;
      g.translate(x + jit, y + Math.sin(ph) * 1.5); g.scale(s * .96, s * 1.08);
      crowFig(g, { fold:1, flap:-.2, blaze:.5 + .5 * Math.sin(ph), seed });
      // a ragged feather torn loose, left behind up the lane
      const u = (sw + off * .7) % 1; g.globalAlpha *= 1 - u; feather(g, 14 - u * 4, -24 - u * 26, 1 + u * 3, .9);
    }
    else {
      // at the wall: the lead crow perches and jabs; the flankers flutter above and stab down in turn
      const c = ch ?? 0, k = i === 2 ? c : (c + (i === 0 ? .33 : .66)) % 1, jab = Math.max(0, Math.sin(k * TAU));
      g.translate(x * .85, (i === 2 ? y + 4 : y + 8) + jab * 3); g.scale(s, s);
      crowFig(g, { flap:i === 2 ? .45 + Math.sin(c * TAU * 2) * .25 : Math.sin(k * TAU * 2) * .9, peck:jab, seed });
    }
    g.restore();
  }
  // the wall-peck: splinters chipping off under the lead beak
  if (ch != null){ const jab = Math.max(0, Math.sin(ch * TAU)); if (jab > .5){ const R = rng(5); g.save(); g.globalAlpha *= (jab - .5) * 2;
    for (let i = 0; i < 4; i++){ const a = -Math.PI / 2 + (R() - .5) * 2.4, d = 8 + R() * 6; S.dot(g, E(Math.cos(a) * d, 42 + Math.sin(a) * d * .6, 1.8, 1.2, a), '#e8d8b0', .9); } g.restore(); } }
}

// =====================================================================================================
// THE NET (in flight, rolled up, draped)
// =====================================================================================================
/** Rope line: a dark cord with a lit core. */
function cord(g, path, w = 2.4, a = 1){ g.save(); g.globalAlpha *= a; path(g); g.strokeStyle = rgba(ROPE.deep, .95); g.lineWidth = w + 1.4; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
  path(g); g.strokeStyle = ROPE.base; g.lineWidth = w; g.stroke(); path(g); g.strokeStyle = rgba(ROPE.light, .6); g.lineWidth = w * .35; g.stroke(); g.restore(); }
const polyPath = pts => g => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
function weight(g, x, y, r){ S.part(g, E(x, y, r, r), IRON, { x, y, r }, { mat:'metal', lw:1 }); }
/** A rolled-up net bundle (cup, basket): a rope ball with crossed cords and a weight hanging. */
function bundle(g, x, y, r, rot = 0){
  g.save(); g.translate(x, y); g.rotate(rot);
  S.part(g, E(0, 0, r, r * .82), ROPE, { x:0, y:0, r }, { mat:'cloth', lw:1.2 });
  g.save(); ell(g, 0, 0, r, r * .82); g.clip(); g.strokeStyle = rgba(ROPE.deep, .7); g.lineWidth = 1.1;
  for (let i = -2; i <= 2; i++){ g.beginPath(); g.moveTo(-r + i * r * .5, -r); g.lineTo(r + i * r * .5, r); g.stroke(); g.beginPath(); g.moveTo(r + i * r * .5, -r); g.lineTo(-r + i * r * .5, r); g.stroke(); }
  g.restore();
  S.ln(g, [[r * .5, r * .5], [r * .8, r * 1.1]], ROPE, 1.2, .9); weight(g, r * .82, r * 1.25, r * .3);
  g.restore();
}
/** The open net, flat in the air: a 4×4 rope mesh with iron weights at the corners. Centre (x, y), half-size a, spin, billow (centre
 *  dragged back up the lane), squash (perspective, seen from above). */
function flatNet(g, x, y, a, spin, billow = 0, squash = .62, alpha = 1){
  const N = 4, C = [0, 1, 2, 3].map(k => { const an = spin + Math.PI / 4 + k * Math.PI / 2; return [Math.cos(an) * a * 1.25, Math.sin(an) * a * 1.25 * squash]; });
  const P = (u, v) => { const x0 = lerp(C[0][0], C[1][0], u), y0 = lerp(C[0][1], C[1][1], u), x1 = lerp(C[3][0], C[2][0], u), y1 = lerp(C[3][1], C[2][1], u);
    const bu = 2 * u - 1, bv = 2 * v - 1, b = (1 - bu * bu) * (1 - bv * bv); return [x + lerp(x0, x1, v), y + lerp(y0, y1, v) - billow * b * a * .55]; };
  g.save(); g.globalAlpha *= alpha;
  // a faint shade under the mesh so it reads as a net, not a grid
  g.save(); g.fillStyle = rgba(ROPE.deep, .18); g.beginPath(); for (let k = 0; k <= 16; k++){ const t = k / 16, p = k < 4 ? P(t * 4, 0) : k < 8 ? P(1, (t - .25) * 4) : k < 12 ? P(1 - (t - .5) * 4, 1) : P(0, 1 - (t - .75) * 4); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.closePath(); g.fill(); g.restore();
  for (let i = 0; i <= N; i++){ const u = i / N, A = [], B = []; for (let j = 0; j <= 8; j++){ A.push(P(u, j / 8)); B.push(P(j / 8, u)); } cord(g, polyPath(A), 2); cord(g, polyPath(B), 2); }
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++){ const [px, py] = P(i / N, j / N); S.dot(g, E(px, py, 1.9, 1.7), ROPE.dark, .95); }
  for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]){ const [px, py] = P(u, v); weight(g, px, py + 2, 4.2); }
  g.restore();
}
/** The net projectile: tumbling open on its way down the lane (fly t 0..1, looped). */
function netShot(g, P = {}){
  const t = P.fly ?? 0, ph = t * TAU;
  S.shadow(g, 0, 50, 26, 5);
  // a few rope wisps trailing up the lane
  g.save(); g.lineCap = 'round'; for (const [dx, k] of [[-14, 0], [0, .5], [14, .25]]){ const u = (t + k) % 1; g.strokeStyle = `rgba(232,214,170,${(.45 * (1 - u)).toFixed(3)})`; g.lineWidth = 1.6; g.beginPath(); g.moveTo(dx, -26 - u * 10); g.lineTo(dx, -44 - u * 14); g.stroke(); } g.restore();
  flatNet(g, 0, 0 + Math.sin(ph) * 2, 26 + Math.sin(ph * 2) * 2, ph * .25, .6 + .4 * Math.sin(ph), .58 + .08 * Math.cos(ph));
}

// ---------- the netted pumpkin ----------
const PR = 40;   // the game's pumpkin radius
/** A worried face for the trapped pumpkin (pumpkin() face hook): eyes looking up at the net, brows tilted, wobbly mouth. */
const worried = (look = 0) => (g, R, c) => { const s = R / 40, ey = -R * .1, ex = R * .33;
  for (const sx of [-1, 1]){ S.eye(g, sx * ex, ey, 9 * s, 9.5 * s, { lx:look * .35, ly:-.35, pr:.42, iris:mix(c.dark, '#7a5a2a', .5) }); S.stroke(g, SO([[sx * (ex + 9 * s), ey - 13 * s], [sx * (ex - 7 * s), ey - 16 * s]]), c, 2.2 * s, .9); }
  S.stroke(g, SO([[-R * .16, R * .3], [-R * .08, R * .25], [0, R * .3], [R * .08, R * .25], [R * .16, R * .3]]), c, 2.2 * s); };
/** Draped mesh over the pumpkin: meridians from a knot at the stem to weights on the ground, three cross cords.
 *  top: where the knot sits (moves with the pumpkin while the weights stay put), bulge: how tight it pulls. */
function drapedNet(g, top, bulge = 0, alpha = 1){
  const R = PR;
  // a point on the draped surface: u -1..1 across, v 0 (knot at the stem) .. 1 (hem on the ground)
  const surf = (u, v) => { const T = [top[0] + u * 4, top[1]], Q = [u * R * (1.55 + bulge * .12) + top[0] * .4, -R * .15 + (top[1] + R * .82) * .3], En = [u * R * 1.05, R * .8 + (1 - u * u) * R * .1];
    const a = (1 - v) * (1 - v), b = 2 * v * (1 - v), c = v * v; return [a * T[0] + b * Q[0] + c * En[0], a * T[1] + b * Q[1] + c * En[1]]; };
  const line = (fn, v0 = 0, v1 = 1) => { const pts = []; for (let i = 0; i <= 12; i++){ const v = v0 + (v1 - v0) * i / 12, u = fn(v); if (u < -1.001 || u > 1.001) continue; pts.push(surf(u, v)); } return pts; };
  g.save(); g.globalAlpha *= alpha;
  // two families of diagonal cords crossing into diamonds, the outer edges and the hem
  const D = 1.25, step = .5;
  for (let u0 = -2.5; u0 <= 1.01; u0 += step){ const A = line(v => u0 + v * D); if (A.length > 1) cord(g, polyPath(A), 2.3); }
  for (let u0 = -1; u0 <= 2.51; u0 += step){ const B = line(v => u0 - v * D); if (B.length > 1) cord(g, polyPath(B), 2.3); }
  for (const e of [-1, 1]) cord(g, polyPath(line(() => e)), 2.6);
  { const H = []; for (let i = 0; i <= 12; i++) H.push(surf(-1 + i / 6, 1)); cord(g, polyPath(H), 2.8); }
  for (let jv = 1; jv <= 5; jv++){ const v = jv / 5; for (let u0 = -2.5; u0 <= 1.01; u0 += step){ const u = u0 + v * D; if (u < -1.001 || u > 1.001) continue; const [x, y] = surf(u, v); S.dot(g, E(x, y, 2, 1.8), ROPE.dark, .95); } }
  for (const u of [-1, -.35, .35, 1]){ const p = surf(u, 1); weight(g, p[0], p[1] + 3, 4.6); }
  // the gather knot round the stem
  S.part(g, E(top[0], top[1] - 2, 6, 4), ROPE, { x:top[0], y:top[1] - 2, r:6 }, { flat:true, mat:'cloth', lw:1 });
  for (const s of [-1, 1]) cord(g, SO([[top[0], top[1] - 3], [top[0] + s * 7, top[1] - 9], [top[0] + s * 9, top[1] - 4]]), 1.8);
  g.restore();
}
/** The netted pumpkin. P: land | held | struggle | snap (0..1). */
function netted(g, P = {}){
  const R = PR, ld = P.land, hd = P.held, st = P.struggle, sn = P.snap;
  if (sn != null){
    // ropes strain, then pop: cord pieces and weights fly out, the pumpkin hops free and lands happy
    const swell = Math.sin(clamp(sn / .25) * Math.PI / 2) * (sn < .25 ? 1 : 0), u = clamp((sn - .25) / .75), hop = Math.sin(clamp((sn - .22) / .55) * Math.PI) * 14;
    g.save(); g.translate(0, -hop); g.scale(1 + swell * .07 - (sn > .78 ? Math.sin((sn - .78) / .22 * Math.PI) * .05 : 0), 1 + swell * .05 + (sn > .78 ? Math.sin((sn - .78) / .22 * Math.PI) * -.08 : 0));
    pumpkin(g, GREEN, false, R, sn < .3 ? worried(0) : null); g.restore();
    if (sn < .25) drapedNet(g, [0, -R * .84 - swell * 3], swell);
    else {
      const R2 = rng(9);
      g.save(); g.globalAlpha *= 1 - clamp((u - .45) / .55);
      for (let i = 0; i < 12; i++){ const a = -Math.PI / 2 + (i / 11 - .5) * 3.4, d = 24 + R2() * 14, x0 = Math.cos(a) * R * .8, y0 = Math.sin(a) * R * .6, x = x0 + Math.cos(a) * d * u, y = y0 + Math.sin(a) * d * u + u * u * 30, rot = (R2() - .5) * 6 * u, L = 10 + R2() * 8;
        g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2 + rot); cord(g, SO([[-L / 2, 0], [0, (R2() - .5) * 6], [L / 2, 0]]), 2.2); S.dot(g, E(L / 2, 0, 1.8, 1.6), ROPE.dark); g.restore(); }
      for (const [x0, dir] of [[-R * 1.05, -1], [-R * .35, -1], [R * .35, 1], [R * 1.05, 1]]){ const x = x0 + dir * u * 18, y = R * .8 + 3 - Math.sin(u * Math.PI) * 6; weight(g, x, y, 4.6); }
      g.restore();
      // pops of light where the cords snapped
      g.save(); g.globalAlpha *= 1 - u; for (const [x, y] of [[-30, -10], [32, -4], [-8, -30], [18, 22]]){ const r = 3 + u * 6; g.strokeStyle = '#fff6c0'; g.lineWidth = 1.6; g.beginPath(); for (let k = 0; k < 4; k++){ const a = k * Math.PI / 4; g.moveTo(x + Math.cos(a) * r * .3, y - hop + Math.sin(a) * r * .3); g.lineTo(x + Math.cos(a) * r, y - hop + Math.sin(a) * r); g.moveTo(x - Math.cos(a) * r * .3, y - hop - Math.sin(a) * r * .3); g.lineTo(x - Math.cos(a) * r, y - hop - Math.sin(a) * r); } g.stroke(); } g.restore();
    }
    return;
  }
  if (ld != null){
    // the open net drops in from above, wraps over the pumpkin, and the weights thump down
    const k = ease(clamp(ld / .65)), settle = clamp((ld - .55) / .45);
    pumpkin(g, GREEN, false, R, ld > .5 ? worried(0) : null);
    if (settle < 1) flatNet(g, 0, lerp(-72, -10, k), lerp(34, 46, k), .12, .3 + k * .6, lerp(.5, .9, k), 1 - settle);
    if (settle > 0) drapedNet(g, [0, -R * .84], 0, settle);
    if (settle > .2){ g.save(); g.globalAlpha *= 1 - settle * .9; for (const x of [-R * 1.05, -R * .35, R * .35, R * 1.05]) for (const s of [-1, 1]){ const sx = x + s * (4 + settle * 8); S.dot(g, E(sx, R * .86 + 2, 3, 1.6), '#d8c8a0', .7); } g.restore(); }
    return;
  }
  // held (gently squirming, eyes darting) or struggle (rocking hard against the cords)
  const t = st ?? hd ?? 0, hard = st != null, ph = t * TAU;
  const rot = hard ? Math.sin(ph) * .12 : Math.sin(ph) * .025, sq = hard ? Math.sin(ph * 2) * .06 : Math.sin(ph) * .015, rise = hard ? Math.max(0, Math.sin(ph * 2)) * 3 : 0;
  g.save(); g.translate(0, R * .8 - rise); g.rotate(rot); g.scale(1 + sq, 1 - sq); g.translate(0, -R * .8);
  pumpkin(g, GREEN, false, R, worried(hard ? Math.sin(ph) : Math.sin(ph) * .6)); g.restore();
  // the knot rides with the pumpkin; the weights stay on the ground, so the cords pull taut
  const tx = Math.sin(rot) * R * 1.6, ty = -R * .84 - rise * 1.2;
  drapedNet(g, [tx, ty], hard ? .5 + .5 * Math.abs(Math.sin(ph)) : 0);
  if (hard){ g.save(); g.globalAlpha *= Math.abs(Math.sin(ph)); for (const s of [-1, 1]){ const x = s * (R * 1.2), y = -R * .4; S.stroke(g, SO([[x, y], [x + s * 6, y - 4]]), { deep:'#fff2c0' }, 1.6, .9); S.stroke(g, SO([[x + s * 1, y + 7], [x + s * 8, y + 6]]), { deep:'#fff2c0' }, 1.6, .9); }
    S.dot(g, SM([[R * .62, -R * .62], [R * .7, -R * .48], [R * .62, -R * .4], [R * .54, -R * .48]], .9), '#bfe8ff', .9); g.restore(); }
}

// =====================================================================================================
// THE LOBBER CART
// =====================================================================================================
/** A spoked cart wheel seen at a slant: ellipse rx × ry, rotation `rot`, one patched spoke. */
function wheel(g, x, y, rx, ry, rot, seed){
  S.shadow(g, x, 50, rx * 1.6, 4);
  // tyre and rim
  S.part(g, E(x, y, rx, ry), IRON, { x, y, r:ry }, { flat:true, mat:'metal', lw:1.4 });
  S.part(g, E(x, y, rx - 3, ry - 3.4), WOODD, { x, y, r:ry - 3 }, { flat:true, mat:'wood', lw:1.1 });
  S.dot(g, E(x, y, rx - 6.4, ry - 7.4), '#24160e', .92);
  g.save(); ell(g, x, y, rx - 4, ry - 4.4); g.clip();
  for (let i = 0; i < 6; i++){ const a = rot + i * TAU / 6, ex = x + Math.cos(a) * (rx - 4), ey = y + Math.sin(a) * (ry - 4);
    S.tube(g, SO([[x, y], [ex, ey]]), i === 2 ? PLANK : WOOD, 3.2); if (i === 2){ const mx = (x + ex) / 2, my = (y + ey) / 2; S.ln(g, [[mx - 2.5, my - 1], [mx + 2.5, my + 1]], ROPE, 2.2, .95); } }
  g.restore();
  S.part(g, E(x, y, rx * .38, ry * .26), WOOD, { x, y, r:ry * .26 }, { flat:true, mat:'wood', lw:1.1 }); S.rivet(g, x, y, 2.2, IRON);
  const R = rng(seed); for (let i = 0; i < 4; i++){ const a = R() * TAU; S.rivet(g, x + Math.cos(a) * (rx - 1.4), y + Math.sin(a) * (ry - 1.6), 1.1, IRON); }
}
/** The catapult arm. th: forward angle (negative = leaning back up the lane), cargo: draw the net bundle in the cup. Pivot (px, py). */
const ARM_L = 66;
function armTip(px, py, th){ return [px - ARM_L * Math.sin(th) * .3, py - ARM_L * Math.cos(th) * .85 + ARM_L * Math.sin(th) * .3, 1 + Math.sin(th) * .22]; }
function arm(g, px, py, th, cargo){
  const [cx, cy, sc] = armTip(px, py, th);
  S.tube(g, SO([[px, py], [cx, cy + 8 * sc]]), WOOD, 8 * (1 + (sc - 1) * .6));
  for (const f of [.3, .62]) S.ln(g, [[px - 5, lerp(py, cy, f)], [px + 5, lerp(py, cy, f) + 1]], ROPE, 2.4, .95);   // rope lashings
  // the spoon cup
  const cup = SM([[cx - 14 * sc, cy - 3 * sc], [cx - 12 * sc, cy + 8 * sc], [cx, cy + 12 * sc], [cx + 12 * sc, cy + 8 * sc], [cx + 14 * sc, cy - 3 * sc], [cx, cy - 6 * sc]], .8);
  S.part(g, cup, WOODD, { x:cx, y:cy + 2 * sc, r:14 * sc }, { mat:'wood', lw:1.4 });
  S.dot(g, E(cx, cy - 1.5 * sc, 11 * sc, 4.4 * sc), '#2a180e', .85);
  S.ln(g, [[cx - 13 * sc, cy + 2 * sc], [cx + 13 * sc, cy + 2 * sc]], IRON, 2, .8);
  if (cargo) bundle(g, cx, cy - 6 * sc, 9.5 * sc, -.3);
}
/** The goblin loader: a little green goblin in a dented pot helmet, seated (hips hidden by the cart's front planks).
 *  o: bob, look (-1..1), crank (angle of the crank, right hand on it), cheer 0..1 (both arms up), toss 0..1 (left arm throws a net),
 *  strain 0..1 (gritted teeth, sweat), jaw. Hands are placed by the caller via `rh` (right hand target). */
function goblin(g, o = {}){
  const gx = o.gx ?? -34, bob = o.bob ?? 0, look = o.look ?? 0, cheer = o.cheer ?? 0, strain = o.strain ?? 0, jaw = o.jaw ?? 0, toss = o.toss ?? 0;
  g.save(); g.translate(gx, bob);
  // body: a patched tunic
  const body = SM([[-12, -14], [-14, 0], [-12, 10], [12, 10], [14, 0], [12, -14], [0, -18]]);
  S.part(g, body, TUNIC, { x:0, y:-4, r:14 }, { mat:'cloth' });
  S.part(g, RR(-5, -6, 8, 7, 1.5), PLANK, { x:-1, y:-3, r:6 }, { flat:true, mat:'cloth', lw:1 }); S.ln(g, [[-5, -6], [3, 1]], ROPE, .9, .7);
  // ears: huge and pointy, drooping
  for (const s of [-1, 1]) { S.part(g, SM([[s * 11, -34], [s * 25, -42], [s * 29, -38, 1], [s * 21, -28], [s * 12, -26]], .7), GOB, { x:s * 20, y:-33, r:10 }, { flat:true, mat:'skin' }); S.dot(g, SM([[s * 14, -32], [s * 24, -38], [s * 20, -30]], .7), rgba(GOBB.base, .55)); }
  const head = SM([[-14, -40], [-16, -30], [-12, -21], [0, -18], [12, -21], [16, -30], [14, -40], [0, -44]]);
  S.part(g, head, GOB, { x:0, y:-31, r:16 }, { mat:'skin' }); S.contact(g, body, 0, -18, 10, 4, .45);
  // the dented pot helmet, slipping over one eye, with a handle sticking out
  g.save(); g.translate(0, -41); g.rotate(-.18);
  S.part(g, SM([[-17, 4], [-15, -6], [-8, -12], [8, -12], [15, -6], [17, 4]], .8), POT, { x:0, y:-3, r:16 }, { mat:'metal', lw:1.3 });
  S.part(g, RR(-19, 1.5, 38, 4.6, 2), POT, { x:0, y:4, r:19 }, { flat:true, mat:'metal', lw:1.1 });
  S.tube(g, SO([[16, -3], [26, -5]]), WOODD, 3.2); S.dot(g, E(-6, -6, 3, 2), rgba(POT.deep, .6)); S.rivet(g, 8, -6, 1.5, POT);
  g.restore();
  // face: big eyes (yellow irises), long nose, toothy grin
  for (const s of [-1, 1]) S.eye(g, s * 7, -30, 6, 6.6, { lx:look * .35 + .05, ly:.15, pr:.42, iris:'#d8b020', lid:s < 0 ? .3 : .12, tilt:s * .15, lidCol:POT.base, lidDeep:POT.deep });
  S.part(g, SM([[-2.6, -27], [2.6, -27], [4, -18], [0, -15], [-3, -18]], .8), GOB, { x:0, y:-21, r:5 }, { flat:true, mat:'skin', lw:1.1 });
  const mw = strain > .3 ? 8 : 7;
  S.dot(g, SM([[-mw, -18], [0, -15 + jaw * 4 + (strain > .3 ? -1 : 2)], [mw, -18], [0, -17]], .8), '#2a1418');
  if (strain > .3){ for (const x of [-5, -2, 1, 4]) S.dot(g, RR(x, -18.4, 2.4, 2.6, .6), '#fff'); }
  else { S.dot(g, PL([[-5, -17.6], [-3, -17.6], [-4, -14.8]]), '#fff'); S.dot(g, PL([[3, -17.6], [5, -17.6], [4, -14.8]]), '#fff'); }
  S.blush(g, 0, -24, .55);
  if (strain > .5){ g.save(); g.globalAlpha *= (strain - .5) * 2; S.dot(g, SM([[16, -44], [18, -40], [16, -37], [14, -40]], .9), '#bfe8ff'); g.restore(); }
  g.restore();
  // arms: left arm (outer side) cheers or tosses; right arm on the crank (target given in cart coordinates)
  const sh = [gx - 12, -12 + bob], rs = [gx + 12, -12 + bob];
  const lh = toss > 0 ? [lerp(gx - 4, gx + 14, Math.sin(toss * Math.PI)), lerp(-10, -50, Math.sin(toss * Math.PI)) + bob] : cheer > 0 ? [gx - 18, lerp(-6, -50, cheer) + bob] : [gx - 6, -6 + bob];
  S.tube(g, SO([sh, [(sh[0] + lh[0]) / 2 - 5, (sh[1] + lh[1]) / 2 + 2], lh]), GOB, 5); S.hand(g, lh[0], lh[1], GOB, cheer > 0 || toss > 0 ? -Math.PI / 2 : Math.PI / 2, 3, 3.8);
  const rh = o.rh ?? [0, -2];
  if (cheer > .5){ const r2 = [gx + 18, lerp(-6, -50, cheer) + bob]; S.tube(g, SO([rs, [gx + 18, (rs[1] + r2[1]) / 2], r2]), GOB, 5); S.hand(g, r2[0], r2[1], GOB, -Math.PI / 2, 3, 3.8); }
  else { S.tube(g, SO([rs, [(rs[0] + rh[0]) / 2, Math.max(rs[1], rh[1]) + 4], rh]), GOB, 5); S.hand(g, rh[0], rh[1], GOB, 0, 3, 3.8); }
}
/** The wicker basket of rolled nets, back left of the bed. jig: nets jostle. */
function basket(g, jig = 0){
  bundle(g, -50, -10 + jig, 7, -.6); bundle(g, -40, -14 - jig * .6, 7.5, .2); bundle(g, -30, -9 + jig * .4, 6.5, .5);
  const b = SM([[-58, -8], [-22, -8], [-24, 5], [-56, 5]], .4);
  S.part(g, b, WICK, { x:-40, y:-2, r:18 }, { mat:'cloth', lw:1.3 });
  g.save(); b(g); g.clip(); for (let x = -58; x < -20; x += 4) S.ln(g, [[x, -9], [x + 1, 6]], WICK, 1, .45); S.ln(g, [[-59, -1], [-20, -1]], WICK, 1, .35); g.restore();
  S.part(g, RR(-60, -11, 40, 4.4, 2), WICK, { x:-40, y:-9, r:20 }, { flat:true, mat:'cloth', lw:1.1 });
}
/** The ghost lantern on a bent pole at the back right corner, with a tattered pennant. sway radians, flag 0..1 phase. */
function lanternPole(g, sway, flag){
  S.tube(g, SO([[44, 2], [45, -40], [42, -66]]), WOODD, 3.4);
  // pennant
  const f = flag * TAU, pts = [[43, -64], [58 + Math.sin(f) * 2, -62 + Math.sin(f + 1) * 2], [70 + Math.sin(f + 1) * 3, -58 + Math.sin(f + 2) * 3, 1], [62 + Math.sin(f + 1.5) * 2, -55], [68 + Math.sin(f + 2) * 3, -50 + Math.sin(f + 3) * 2, 1], [56, -52], [44, -54]];
  S.part(g, SM(pts, .6), RAG, { x:54, y:-58, r:12 }, { flat:true, mat:'cloth', lw:1.1 });
  // hook and lantern
  S.tube(g, SO([[42, -66], [34, -70], [28, -66]]), WOODD, 3);
  g.save(); g.translate(28, -66); g.rotate(sway);
  S.ln(g, [[0, 0], [0, 6]], IRON, 1.4, .9);
  const gl = g.createRadialGradient(0, 15, 0, 0, 15, 16); gl.addColorStop(0, rgba(GHOST, .5)); gl.addColorStop(1, rgba(GHOST, 0)); g.fillStyle = gl; ell(g, 0, 15, 16, 16); g.fill();
  S.part(g, RR(-6, 8, 12, 14, 3), LANT, { x:0, y:15, r:8 }, { flat:true, mat:'metal', lw:1.1 });
  S.dot(g, RR(-4, 10, 8, 10, 2), '#d8ffc0', .95); S.glow(g, 0, 15, 2.6, GHOST);
  S.part(g, PL([[-7, 9], [0, 4], [7, 9]]), LANT, { x:0, y:7, r:6 }, { flat:true, mat:'metal', lw:1 });
  S.ln(g, [[-6, 22], [6, 22]], LANT, 2.4, .95);
  g.restore();
}
const PIV = [10, -8];
/** Lob timing: 0–.36 crank back, .36–.5 release and swing, .5–.66 slam and bounce, .7–1 the goblin tosses a fresh net into the cup. */
function lobArm(t){
  if (t < .36) return lerp(-.8, -1.28, ease(t / .36));
  if (t < .5){ const u = (t - .36) / .14; return lerp(-1.28, 1.05, u * u); }
  if (t < .66){ const u = (t - .5) / .16; return 1.05 - Math.sin(u * Math.PI) * .25 - u * 0; }
  return lerp(1.05, -.8, ease(clamp((t - .62) / .26)));
}
function cart(g, P = {}){
  const w = P.walk, id = P.idle, lb = P.lob;
  const ph = (w ?? id ?? 0) * TAU;
  const rattle = w != null ? Math.sin(ph * 2) : 0, roll = w != null ? Math.sin(ph) * .025 : 0, bob = w != null ? -Math.abs(Math.sin(ph * 2)) * 2.2 : 0;
  const wrot = w != null ? w * TAU / 3 : 0;
  const th = lb != null ? lobArm(lb) : -.8, cargo = lb == null || lb < .45 || lb > .92;
  const kick = lb != null && lb > .44 && lb < .62 ? Math.sin((lb - .44) / .18 * Math.PI) : 0;   // the cart bucks on the release
  // wheels and axle first
  S.shadow(g, 0, 50, 62, 6);
  // the body rides on the axle and rocks
  g.save(); g.translate(0, 28 + bob - kick * 3); g.rotate(roll - kick * .02); g.translate(0, -28);
  // bed top (seen from above, a strip behind the front planks)
  const top = PL([[-46, 4], [-40, -8], [40, -8], [46, 4]]);
  S.part(g, top, PLANK, { x:0, y:-2, r:44 }, { flat:true, mat:'wood', lw:1.4 });
  g.save(); top(g); g.clip(); for (const y of [-4, 0]) S.ln(g, [[-48, y], [48, y]], PLANK, 1, .4); g.restore();
  // a lob in progress: the fresh net tossed from the basket into the cup
  const toss = lb != null && lb > .7 && lb < .92 ? (lb - .7) / .22 : 0;
  // the arm behind the uprights while it leans back up the lane; in front once it swings toward the wall
  if (th <= .1) arm(g, PIV[0], PIV[1], th, cargo);
  // A-frame uprights and the twisted rope skein with a crank on its left end
  for (const s of [-1, 1]) S.tube(g, SO([[PIV[0] + s * 14, 2], [PIV[0] + s * 13, PIV[1] - 6]]), WOODD, 5);
  const skein = RR(PIV[0] - 15, PIV[1] - 4.5, 30, 9, 4.5);
  S.part(g, skein, ROPE, { x:PIV[0], y:PIV[1], r:15 }, { flat:true, mat:'cloth', lw:1.2 });
  g.save(); skein(g); g.clip(); const twist = lb != null && lb < .36 ? lb * 6 : 0; for (let i = -6; i <= 6; i++){ const x = PIV[0] + i * 3 + (twist % 1) * 3; S.ln(g, [[x - 3, PIV[1] - 6], [x + 3, PIV[1] + 6]], ROPE, 1.1, .6); } g.restore();
  // crank: a little iron wheel and handle at the skein's left end
  const ca = lb != null && lb < .36 ? -lb / .36 * TAU * 1.5 : w != null ? 0 : .3, cx = PIV[0] - 19, cy = PIV[1];
  S.part(g, E(cx, cy, 5, 6), IRON, { x:cx, y:cy, r:6 }, { flat:true, mat:'metal', lw:1.1 });
  const hx = cx + Math.cos(ca) * 6, hy = cy + Math.sin(ca) * 7; S.tube(g, SO([[cx, cy], [hx, hy]]), IRON, 2.4);
  // the goblin
  const strain = lb != null && lb < .38 ? Math.sin(clamp(lb / .36) * Math.PI / 2) : 0;
  const cheer = lb != null && lb >= .46 && lb < .72 ? Math.sin(clamp((lb - .46) / .26) * Math.PI) : 0;
  const look = id != null ? Math.sin(ph) : lb != null && lb > .45 && lb < .7 ? 0 : .2;
  goblin(g, { gx:-38, bob:w != null ? -Math.abs(Math.sin(ph * 2 + .6)) * 3 : id != null ? Math.sin(ph) * .8 : -strain * 1.5 - cheer * 3, look, strain, cheer, toss, jaw:cheer > 0 ? cheer : id != null ? .1 : 0, rh:[hx, hy] });
  basket(g, w != null ? rattle * 1.2 : 0);
  if (toss > 0){ const u = ease(toss), [tx, ty, sc] = armTip(PIV[0], PIV[1], th); const bx = lerp(-30, tx, u), by = lerp(-40, ty - 6 * sc, u) - Math.sin(u * Math.PI) * 22; bundle(g, bx, by, 9, u * 4); }
  lanternPole(g, w != null ? Math.sin(ph) * .22 : id != null ? Math.sin(ph) * .1 : kick * .3, (w ?? id ?? lb ?? 0) * (w != null ? 2 : 1));
  // front planks with a patch, iron corner straps and a painted pumpkin-crossed-out tally
  const front = SM([[-48, 4, 1], [48, 4, 1], [46, 30, 1], [-46, 30, 1]], .3);
  S.part(g, front, WOOD, { x:0, y:16, r:46 }, { mat:'wood', lw:1.6, hy:8 });
  g.save(); front(g); g.clip(); for (const y of [12.5, 21.5]) S.crease(g, SO([[-50, y], [0, y + .6], [50, y - .4]]), WOOD, 1.4, .5); g.restore();
  S.part(g, PL([[8, 7], [30, 9], [29, 18], [7, 16]]), PLANK, { x:18, y:12, r:12 }, { flat:true, mat:'wood', lw:1.1 }); for (const [x, y] of [[10, 9], [27, 11], [27, 16], [10, 14]]) S.rivet(g, x, y, 1.1, IRON);
  for (const s of [-1, 1]){ S.part(g, PL([[s * 48, 4], [s * 38, 4], [s * 38, 9], [s * 43, 9], [s * 43, 30], [s * 47, 30]]), IRON, { x:s * 44, y:16, r:14 }, { flat:true, mat:'metal', lw:1 }); S.rivet(g, s * 40.5, 6.5, 1.2, IRON); S.rivet(g, s * 45, 18, 1.2, IRON); S.rivet(g, s * 45, 26, 1.2, IRON); }
  // tally marks: three little pumpkins scratched out in white paint (nets landed)
  for (const x of [-26, -16, -6]){ S.dot(g, E(x, 17, 3.4, 3), '#efe6d0', .75); S.ln(g, [[x - 4, 13], [x + 4, 21]], { deep:'#7a2a1a' }, 1.4, .9); }
  if (th > .1) arm(g, PIV[0], PIV[1], th, cargo);
  if (lb != null && lb > .4 && lb < .6){ const a = Math.sin((lb - .4) / .2 * Math.PI), [cx, cy] = armTip(PIV[0], PIV[1], th); g.save(); g.lineCap = 'round';
    for (let k = 1; k <= 3; k++){ g.strokeStyle = `rgba(255,246,210,${(.8 * a * (1 - k * .22)).toFixed(3)})`; g.lineWidth = 3 - k * .6; g.beginPath(); g.arc(cx + k * 3, cy - 4 - k * 9, 15 - k * 2, Math.PI * .1, Math.PI * .9); g.stroke(); } g.restore(); }
  g.restore();
  // wheels on the sides, turning as it rolls (left a touch bigger: a rickety mismatched pair)
  wheel(g, -55, 30, 10, 20, wrot, 3); wheel(g, 55, 31, 9.5, 19, wrot + .3, 7);
  // the net leaving the cup, opening and flying off down the lane (the game takes over with the net sprite)
  if (lb != null && lb >= .45 && lb < .8){ const u = (lb - .45) / .35, [x0, y0] = armTip(PIV[0], PIV[1], .2);
    if (u < .25) bundle(g, x0, y0 - 6 + u * 30, 9 * (1 + u), u * 6);
    else flatNet(g, x0 - 2, y0 + 4 + u * 80, 10 + u * 22, u * 2, .7, .6, 1 - clamp((u - .8) / .2)); }
  if (kick > .3){ g.save(); g.globalAlpha *= (kick - .3); for (const s of [-1, 1]) for (const k of [0, 1]) S.dot(g, E(s * (58 + k * 8), 47 - k * 3, 5 - k * 2, 2.6 - k), '#c8b890', .7); g.restore(); }
}

// ---------- clips (registry-style) ----------
// box: the frame in drawing units holding every pose. scale: a suggested in-game scale (see the README).
export const CLIPS = {
  crows: { name:'Swooping Crows', draw:crows, scale:.5, box:{ x:-78, y:-102, w:156, h:158 }, variants:{ c2:true, c1:true },
    clips:{ fly:{ n:8, fps:14, pose:t => ({ fly:t }) }, swoop:{ n:6, fps:16, pose:t => ({ swoop:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) } } },
  crow: { name:'Crow (single)', draw:(g, P) => crows(g, { ...P, single:true }), scale:.5, box:{ x:-74, y:-88, w:148, h:144 },
    clips:{ fly:{ n:8, fps:14, pose:t => ({ fly:t }) }, swoop:{ n:6, fps:16, pose:t => ({ swoop:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) } } },
  cart: { name:'Lobber Cart', draw:cart, scale:.55, box:{ x:-76, y:-104, w:154, h:162 },
    clips:{ walk:{ n:8, fps:8, pose:t => ({ walk:t }) }, idle:{ n:6, fps:5, pose:t => ({ idle:t }) }, lob:{ n:10, fps:12, once:true, pose:t => ({ lob:t }) } } },
  net: { name:'Net (thrown)', draw:netShot, scale:.55, box:{ x:-50, y:-66, w:100, h:124 },
    clips:{ fly:{ n:8, fps:14, pose:t => ({ fly:t }) } } },
  netted: { name:'Netted pumpkin', draw:netted, scale:.6, box:{ x:-70, y:-95, w:140, h:148 },
    clips:{ land:{ n:6, fps:14, once:true, pose:t => ({ land:t }) }, held:{ n:4, fps:4, pose:t => ({ held:t }) }, struggle:{ n:6, fps:12, pose:t => ({ struggle:t }) }, snap:{ n:8, fps:14, once:true, pose:t => ({ snap:t }) } } },
};
