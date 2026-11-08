// ---------- Nightmare Crumbling Keep's monsters (Release 8; spec Part 3) ----------
// New Toy Plastic drawings (docs/ART_BRIEF.md), ported from the design archive (docs/archive/nightmare-monsters/). Every Release 8 monster's
// drawing goes in this file with its own registry key (spread into CHARS under `__RELEASE__ >= 8`).
//   lobbercart: the Lobber Cart (docs/archive/nightmare-monsters/crows-cart): a rickety two-wheeled plank cart with a spoon catapult on a
//               twisted-rope skein, crewed by a little green goblin in a dented pot helmet, a wicker basket of rolled nets and a ghost-lantern.
//               Clips: walk (it rolls in), idle (parked, the goblin looks round), lob (crank back, swing, the net leaves, a fresh one is
//               tossed in; once). The net in flight is the game's own net sprite (engine/render/nets.js), so the clip's net is only the toss.
// Drawn around (0,0) in drawing units with the ground at y = 50. Every clip is baked by render/anim.js; nothing random per frame (rng(seed) only).
// Every palette sits at module level as plain `pal()` data, as the other chars files; lower builds never import this module.

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, u) => a + (b - a) * u;

// ---------- palettes ----------
const WOOD = pal('#a5764a'), WOODD = pal('#7a5434'), PLANK = pal('#b88a58'), IRON = pal('#8a909c'), ROPE = pal('#c8a86a'), WICK = pal('#b88c4c'),
  GOB = pal('#8fbf3a'), GOBB = pal('#d8e89a'), POT = pal('#7c8494'), RAG = pal('#7a4ad0'), LANT = pal('#5a5a64'), GHOST = '#9cff7a', TUNIC = pal('#8a5a3a');

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

// ---------- registry ----------
// The Lobber Cart (r 26): the archive's suggested scale .55; dy puts its wheels on the ground. The cart has no die or chew clip (it never chews;
// it is shattered by the game's ordinary death burst). `frame` shows the parked idle while it sits at its park point (m.parked) and lets a lob
// (m.anim, set by engine/keep.js) play through.
const idleFrame = (m, clips) => m.anim ? null : m.parked ? ['idle', Math.floor(m.ph * clips.idle.fps) % clips.idle.n] : null;
export const KEEP = {
  lobbercart: { draw:cart, scale:.55, dy:-14, box:{ x:-76, y:-104, w:154, h:162 }, frame:idleFrame, clips:{ walk:{ n:8, fps:8, pose:t => ({ walk:t }) }, idle:{ n:6, fps:5, pose:t => ({ idle:t }) }, lob:{ n:10, fps:12, once:true, pose:t => ({ lob:t }) } }, still:{} },
};
