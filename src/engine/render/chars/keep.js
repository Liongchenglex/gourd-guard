// ---------- Nightmare Crumbling Keep's monsters (Release 8; spec Part 3) ----------
// New Toy Plastic drawings (docs/ART_BRIEF.md), ported from the design archive (docs/archive/nightmare-monsters/). Every Release 8 monster's
// drawing goes in this file with its own registry key (spread into CHARS under `__RELEASE__ >= 8`).
//   lobbercart: the Lobber Cart (docs/archive/nightmare-monsters/crows-cart): a rickety two-wheeled plank cart with a spoon catapult on a
//               twisted-rope skein, crewed by a little green goblin in a dented pot helmet, a wicker basket of rolled nets and a ghost-lantern.
//               Clips: walk (it rolls in), idle (parked, the goblin looks round), lob (crank back, swing, the net leaves, a fresh one is
//               tossed in; once). The net in flight is the game's own net sprite (engine/render/nets.js), so the clip's net is only the toss.
//   glutton / bride: the Blood Glutton and the Bat Bride (docs/archive/nightmare-monsters/vampires-doctor), ported below with their own keys.
//   lancer / marshal: the Storm Lancer (jouster: a charging lancer on a barded black horse) and the Storm Marshal (commander: a banner on his back, a
//               sword raised to command). Lancer clips: walk = the gallop (it charges from spawn), chew. Marshal: walk, chew, command (once: the sword
//               goes up as a rally starts, played by engine/keep.js).
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

// ---------- the Storm Lancer and the Storm Marshal (ported from docs/archive/nightmare-monsters/knights/knights.js) ----------
// ---------- nightmare Crumbling Keep palette ----------
const STEEL = pal('#7f88a6'), STEELD = pal('#535a74'), IRONK = pal('#2f3448'),
  CRIM = pal('#b8182e'), CRIMD = pal('#76101f'), SLATE = pal('#2c3550'),
  HORSE = pal('#3a3c50'), HORSED = pal('#272834'), MUZZ = pal('#55586e'), MANE = pal('#4a0e1a'),
  HOOF = pal('#24252e'), BRASS = pal('#c39445'), LEATH = pal('#4c3126'),
  PLUME = pal('#d8263f'), LANCEW = pal('#dfe4f0'), CAPE = pal('#17111f'), LINING = pal('#b3132b');
const EYE = '#ff2a3c', BOLT_GLOW = '#9fc0ff', BOLT_CORE = '#f2f7ff', SLIT = '#0b0d16', SIGIL = '#cfdcff';

// ---------- helpers ----------
function metal(g, p, c, b, o = {}){ S.part(g, p, c, b, { mat:'metal', ...o }); }
/** Steel gauntlet: a fist. */
function gauntlet(g, x, y, r = 6.5, c = STEEL){ metal(g, E(x, y, r, r * .92), c, { x, y, r }, { flat:true }); S.ln(g, [[x - r * .5, y + r * .2], [x + r * .5, y + r * .2]], c, 1, .5); }
/** A small lightning-bolt sigil (pale storm blue, softly lit). */
function boltSigil(g, x, y, s = 1, col = SIGIL){ g.save(); g.translate(x, y); g.scale(s, s); g.shadowColor = BOLT_GLOW; g.shadowBlur = 5;
  S.dot(g, PL([[-1, -11], [6, -11], [1.5, -2.5], [6.5, -2.5], [-4, 12], [-.5, 1.5], [-6, 1.5]]), col, .95); g.restore(); }
/** A jagged lightning bolt from a to b (seeded zigzag with a branch, blue glow, white core). */
function bolt(g, a, b, seed, w = 1.2, amp = 5){
  const R = rng(seed), n = 5, pts = [a]; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let i = 1; i < n; i++){ const t = i / n, o = (R() - .5) * 2 * amp; pts.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]); }
  pts.push(b);
  const path = g2 => { g2.beginPath(); pts.forEach((p, i) => i ? g2.lineTo(p[0], p[1]) : g2.moveTo(p[0], p[1])); const p = pts[2], ba = Math.atan2(dy, dx) + (R() < .5 ? -.9 : .9); g2.moveTo(p[0], p[1]); g2.lineTo(p[0] + Math.cos(ba) * L * .25, p[1] + Math.sin(ba) * L * .25); };
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = BOLT_GLOW; g.shadowBlur = 8;
  path(g); g.strokeStyle = rgba(BOLT_GLOW, .55); g.lineWidth = w * 3; g.stroke();
  path(g); g.strokeStyle = BOLT_CORE; g.lineWidth = w; g.stroke(); g.restore(); }
/** Glowing visor eye. */
function visorEye(g, x, y, r, hot = 0){ g.save(); g.shadowColor = EYE; g.shadowBlur = 10 + hot * 8; S.dot(g, E(x, y, r * 1.5, r * .9), EYE, .55 + hot * .3); g.restore(); S.glow(g, x, y, r, EYE); }

// ---------- the horse ----------
/** One horse leg, front view: shoulder (x0, y0) to the hoof at (x1, y1). lift 0..1 bends the knee out and tips the hoof so its shod sole shows. */
function leg(g, x0, y0, x1, y1, lift, c, w, s, o = {}){
  const kx = x0 + (x1 - x0) * .5 + s * lift * 4.5, ky = y0 + (y1 - y0) * .5 - lift * 1.5;
  S.tube(g, SO([[x0, y0], [kx, ky], [x1, y1 - 5]]), c, w);
  S.part(g, E(kx, ky, w * .62, w * .56), c, { x:kx, y:ky, r:w * .62 }, { flat:true, mat:'skin' });
  if (o.cop){ metal(g, E(kx, ky - 1, w * .72, w * .62), STEELD, { x:kx, y:ky - 1, r:w * .72 }, { flat:true }); S.rivet(g, kx, ky - 1, 1.3, STEEL); }
  for (const d of [-1, 0, 1]) S.ln(g, [[x1 + d * w * .3, y1 - 10], [x1 + d * w * .5 + s * .6, y1 - 3]], MANE, 1.5, .8);   // crimson feathering at the fetlock
  const hw = w * .62, hh = 6.5;
  if (lift > .35){   // tipped back: the sole and the iron shoe face the viewer
    S.part(g, E(x1, y1 - 1.5, hw * 1.1, hh * .8), HOOF, { x:x1, y:y1 - 2, r:hw }, { flat:true, mat:'horn' });
    S.dot(g, E(x1, y1 - 1, hw * .7, hh * .48), '#0d0d13');
    S.stroke(g, g2 => { g2.beginPath(); g2.ellipse(x1, y1 - 1, hw * .86, hh * .62, 0, Math.PI * 1.05, Math.PI * 1.95, true); }, { deep:STEEL.base }, 1.3, .8);
  } else S.part(g, SM([[x1 - hw * .8, y1 - hh], [x1 + hw * .8, y1 - hh], [x1 + hw * 1.08, y1, 1], [x1 - hw * 1.08, y1, 1]], .5), HOOF, { x:x1, y:y1 - 3, r:hw }, { flat:true, mat:'horn' });
}
/** Four legs from a gait: lifts = [front-left, front-right, back-left, back-right]; bob moves the shoulders. */
function legs(g, lifts, bob, heavy){
  const [fl, fr, bl, br] = lifts;
  for (const [s, l] of [[-1, bl], [1, br]]) leg(g, s * 23, 20 + bob, s * 25, 45 - l * 11, l, HORSED, 8.5, s);
  for (const [s, l] of [[-1, fl], [1, fr]]) leg(g, s * 12, 16 + bob, s * 13 + s * l * 1.5, 50 - l * 16, l, HORSE, 10.5, s, { cop:heavy });
}
/** Chest, steel peytral and the two caparison panels. o.cap/o.trim: cloth and trim palettes; o.wave sways the dagged hem. */
function horseBody(g, o){
  const wv = o.wave || 0, heavy = o.heavy;
  const chest = SM([[-28, -8], [-32, 8], [-22, 26], [0, 30], [22, 26], [32, 8], [28, -8], [0, -12]], .85);
  S.part(g, chest, HORSE, { x:0, y:8, r:32 }, { mat:'skin', hx:-10, hy:0 });
  for (const s of [-1, 1]){
    const d = i => wv * (i % 2 ? .6 : 1) * (s > 0 ? 1 : -.7);
    const panel = SM([[s * 15, -12, 1], [s * 38, -10], [s * 46, 6], [s * (49 + d(0)), 31, 1], [s * 42, 26, 1], [s * (36 + d(1)), 33, 1], [s * 29, 27, 1], [s * (22 + d(2) * .5), 32, 1], [s * 16, 26, 1], [s * 14, 8]], .75);
    S.part(g, panel, o.cap, { x:s * 32, y:8, r:28 }, { mat:'cloth', hx:s * 28 - 6, hy:-2 });
    S.contact(g, panel, s * 15, 4, 8, 20, .45);
    S.crease(g, SO([[s * 30, -4], [s * 34, 14], [s * 36, 28]]), o.cap, 1.6, .38); S.crease(g, SO([[s * 22, 2], [s * 22, 26]]), o.cap, 1.3, .3);
    // trim along the hem
    S.stroke(g, SO([[s * 16, 26], [s * (22 + d(2) * .5), 32], [s * 29, 27], [s * (36 + d(1)), 33], [s * 42, 26], [s * (49 + d(0)), 31]], .2), { deep:o.trim.base }, 2.6, .95);
    if (heavy){ S.stroke(g, SO([[s * 15, -12], [s * 14, 8], [s * 16, 26]]), { deep:o.trim.base }, 2.4, .9); for (const y of [-6, 6, 18]) S.rivet(g, s * 15, y, 1.3, BRASS); }
    boltSigil(g, s * 32, 10, .85);
  }
  // steel peytral over the chest
  const pey = SM([[-19, -6], [19, -6], [18, 8], [0, 16], [-18, 8]], .8);
  metal(g, pey, heavy ? STEEL : STEELD, { x:0, y:2, r:20 }, { hx:-8, hy:-2 });
  for (const [x, y] of [[-13, -1], [13, -1], [0, 10]]) S.rivet(g, x, y, 1.6, heavy ? BRASS : STEEL);
  if (heavy){ metal(g, E(0, 2, 5, 5), BRASS, { x:0, y:2, r:5 }, { flat:true }); S.dot(g, E(0, 2, 2, 2), CRIM.base); }
}
/** Neck, mane, ears and the head with a steel chamfron, turned a little to the viewer's right. (cx, cy): head centre. */
function horseHead(g, cx, cy, o = {}){
  const wv = o.wave || 0, heavy = o.heavy, open = o.open || 0;
  // neck, with the mane falling on its far (left) side
  const neck = SM([[cx - 18, cy + 30], [cx - 16, cy], [cx - 8, cy - 18], [cx + 8, cy - 16], [cx + 14, cy + 26]], .85);
  S.part(g, neck, HORSE, { x:cx - 2, y:cy + 6, r:22 }, { mat:'skin', hx:cx - 8, hy:cy - 4 });
  for (let i = 0; i < 5; i++){ const y = cy - 22 + i * 9, x = cx - 12 - i * 1.4, sw = wv * (1 + i * .25) + Math.sin(i * 1.7) * 1.5;
    S.part(g, SM([[x + 4, y - 4], [x - 12 - sw, y + 2], [x - 16 - sw, y + 9, 1], [x - 6, y + 8], [x + 3, y + 7]], .8), MANE, { x:x - 6, y:y + 3, r:10 }, { flat:true, mat:'cloth', lw:1.2 }); }
  if (heavy) for (let i = 0; i < 3; i++){ const y = cy + 2 + i * 8; metal(g, SM([[cx - 16, y], [cx + 10, y - 3], [cx + 12, y + 5], [cx - 15, y + 8]], .6), STEELD, { x:cx - 2, y:y + 2, r:14 }, { flat:true }); S.rivet(g, cx - 10, y + 3, 1.2, BRASS); }   // crinet: plates over the neck
  // ears
  for (const s of [-1, 1]){ const ear = SM([[cx + s * 5, cy - 22], [cx + s * 11, cy - 38, 1], [cx + s * 15, cy - 21]], .7); S.part(g, ear, HORSE, { x:cx + s * 10, y:cy - 27, r:8 }, { flat:true, mat:'skin' }); S.dot(g, SM([[cx + s * 8, cy - 23], [cx + s * 11, cy - 33], [cx + s * 13, cy - 23]], .7), HORSED.deep, .7); }
  // head
  const head = SM([[cx - 14, cy - 18], [cx - 7, cy - 26], [cx + 7, cy - 26], [cx + 14, cy - 18], [cx + 15, cy - 2], [cx + 12, cy + 12], [cx + 6, cy + 21], [cx - 6, cy + 21], [cx - 12, cy + 12], [cx - 15, cy - 2]], .85);
  S.part(g, head, HORSE, { x:cx, y:cy - 4, r:25 }, { mat:'skin', hx:cx - 8, hy:cy - 16 });
  // muzzle, smoking crimson nostrils, mouth (opens on the chew)
  const mz = E(cx, cy + 14, 11.5, 8.5); S.part(g, mz, MUZZ, { x:cx, y:cy + 13, r:11.5 }, { flat:true, mat:'skin', hx:cx - 4, hy:cy + 9 });
  for (const s of [-1, 1]){ g.save(); g.shadowColor = EYE; g.shadowBlur = 6; S.dot(g, E(cx + s * 5, cy + 13, 2.2, 2.8, s * .4), '#3a0710'); g.restore(); S.dot(g, E(cx + s * 5, cy + 13.6, 1.1, 1.4, s * .4), '#ff3a40', .8); }
  if (open > .05){ S.dot(g, SM([[cx - 6, cy + 19], [cx + 6, cy + 19], [cx + 4, cy + 20 + open * 6], [cx - 4, cy + 20 + open * 6]], .8), '#2a0810'); for (const x of [-3, 1]) S.dot(g, RR(cx + x, cy + 19, 2.6, 2.4, .8), '#ece6dc'); }
  else S.ln(g, [[cx - 5, cy + 20], [cx, cy + 21], [cx + 5, cy + 20]], HORSED, 1.2, .7);
  // chamfron: a steel plate down the face with a spike (two side horns on the heavy barding)
  if (heavy) for (const s of [-1, 1]) metal(g, SM([[cx + s * 3, cy - 21], [cx + s * 13, cy - 34, 1], [cx + s * 7, cy - 19]], .6), STEEL, { x:cx + s * 8, y:cy - 26, r:7 }, { flat:true });
  else metal(g, PL([[cx - 3.2, cy - 22], [cx + 3.2, cy - 22], [cx, cy - 38]]), STEEL, { x:cx, y:cy - 28, r:7 }, { flat:true });
  const plate = SM([[cx - 6, cy - 25], [cx + 6, cy - 25], [cx + 5, cy - 2], [cx, cy + 5], [cx - 5, cy - 2]], .6);
  metal(g, plate, heavy ? STEEL : STEELD, { x:cx, y:cy - 12, r:14 }, { hx:cx - 2, hy:cy - 20 });
  S.rivet(g, cx, cy - 20, 1.4, heavy ? BRASS : STEEL); S.rivet(g, cx, cy - 4, 1.4, heavy ? BRASS : STEEL);
  if (heavy) S.dot(g, PL([[cx - 2.4, cy - 15], [cx + 2.4, cy - 15], [cx, cy - 9]]), CRIM.base, .95);
  // forelock spilling over the plate
  for (const [dx, a] of [[-4, -.4], [0, 0], [4, .4]]) S.part(g, SM([[cx + dx - 3, cy - 27], [cx + dx + 3, cy - 27], [cx + dx + Math.sin(a) * 6, cy - 17]], .7), MANE, { x:cx + dx, y:cy - 23, r:5 }, { flat:true, mat:'cloth', lw:1 });
  // big angry eyes with crimson irises and a soft red glow
  for (const s of [-1, 1]){ const ex = cx + s * 10.6, ey = cy - 9;
    g.save(); g.shadowColor = EYE; g.shadowBlur = 9; S.dot(g, E(ex, ey, 5.6, 6.4), '#ff3040', .35); g.restore();
    S.eye(g, ex, ey, 5.9, 6.7, { lx:s * -.1 + .1, ly:.18, pr:.44, pupil:'#9a0c1a', iris:'#ff6060', lid:.3, lidCol:HORSE.dark, lidDeep:HORSE.deep, tilt:-s * .38 }); }
}

// ---------- rider parts ----------
/** Armoured leg in a stirrup on side s; the rider's centre is x = -8. */
function riderLeg(g, s, c){
  const hip = [-8 + s * 10, -12], knee = [-8 + s * 26, -2], ank = [-8 + s * 27, 13];
  S.tube(g, SO([hip, knee, ank]), c, 10);
  metal(g, E(knee[0], knee[1], 6, 5.2), c, { x:knee[0], y:knee[1], r:6 }, { flat:true }); S.rivet(g, knee[0], knee[1], 1.4, c);
  S.tube(g, SO([[ank[0] - 6, ank[1] + 6], [ank[0] - 6, ank[1] + 10], [ank[0] + 6, ank[1] + 10], [ank[0] + 6, ank[1] + 6]]), IRONK, 2);   // stirrup
  metal(g, SM([[ank[0] - 6, ank[1] - 2], [ank[0] + 6, ank[1] - 2], [ank[0] + 7, ank[1] + 6, 1], [ank[0] - 7, ank[1] + 6, 1]], .6), STEELD, { x:ank[0], y:ank[1] + 2, r:7 }, { flat:true });
}
/** The jouster's lance, from the hand at (hx, hy) toward angle a: butt, crimson-and-white spiral stripes, a steel vamplate cone and a coronel tip. */
function lance(g, hx, hy, a, len){
  g.save(); g.translate(hx, hy); g.rotate(a);
  const shaft = SM([[-18, -3.4, 1], [6, -5.2, 1], [len, -1.6, 1], [len + 2, 0, 1], [len, 1.6, 1], [6, 5.2, 1], [-18, 3.4, 1], [-20, 0, 1]], .3);
  S.part(g, shaft, LANCEW, { x:len * .3, y:0, r:len * .45 }, { mat:'paint', hx:len * .2, hy:-2 });
  g.save(); shaft(g); g.clip();
  for (let x = 10; x < len; x += 12){ S.dot(g, PL([[x, -7], [x + 6, -7], [x + 2, 7], [x - 4, 7]]), CRIM.base, .95); S.dot(g, PL([[x + 1, -7], [x + 2.5, -7], [x - 1.5, 7], [x - 3, 7]]), CRIM.light, .35); }
  const gr = g.createLinearGradient(0, -6, 0, 6); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(.35, 'rgba(255,255,255,0)'); gr.addColorStop(.7, 'rgba(20,8,30,0)'); gr.addColorStop(1, 'rgba(20,8,30,.45)'); g.fillStyle = gr; g.fillRect(-22, -7, len + 30, 14);
  g.restore(); S.stroke(g, shaft, CRIMD, 1.2, .7);
  metal(g, PL([[len - 2, -2.6], [len + 9, 0], [len - 2, 2.6]]), STEEL, { x:len + 3, y:0, r:6 }, { flat:true });   // coronel
  for (const s of [-1, 1]) metal(g, PL([[len + 2, s * 1.4], [len + 6, s * 5.5], [len + 7, s * 1.5]]), STEEL, { x:len + 5, y:s * 3, r:4 }, { flat:true, noEdge:true });
  gauntlet(g, 0, 0, 6.2);
  const vam = SM([[18, -5, 1], [6, -13, 1], [3, -11], [3, 11], [6, 13, 1], [18, 5, 1]], .6);   // vamplate: a steel cone guarding the hand, wide end at the hand
  metal(g, vam, STEEL, { x:9, y:-2, r:13 }, { hx:7, hy:-7 }); S.ln(g, [[6, -12], [6, 12]], STEELD, 1, .6); S.rivet(g, 11, -4, 1.2, STEEL); S.rivet(g, 11, 4, 1.2, STEEL);
  g.restore();
}
/** Arming sword: grip centred on (x, y), tilt a (0 = blade straight up), length L. glow > 0 lights the blade crimson. */
function sword(g, x, y, a, L = 42, glow = 0, seed = 3){
  g.save(); g.translate(x, y); g.rotate(a);
  metal(g, E(0, 10, 3.6, 3.6), BRASS, { x:0, y:10, r:3.6 }, { flat:true }); S.tube(g, SO([[0, 7], [0, -5]]), CRIMD, 4.4);
  metal(g, SM([[-12, -5], [-13, -9, 1], [0, -8], [13, -9, 1], [12, -5], [0, -4.6]], .6), BRASS, { x:0, y:-7, r:12 }, { flat:true });
  const blade = SM([[-4, -9, 1], [4, -9, 1], [3.4, -L + 9, 1], [0, -L, 1], [-3.4, -L + 9, 1]], .5);
  if (glow > 0){ g.save(); g.shadowColor = EYE; g.shadowBlur = 16; S.dot(g, blade, '#ff4050', .55 * glow); g.restore(); }
  metal(g, blade, STEEL, { x:0, y:-L * .55, r:L * .45 }, { flat:true, hx:-1, hy:-L + 12 }); S.ln(g, [[0, -11], [0, -L + 8]], STEELD, 1, .6);
  if (glow > 0){ S.ln(g, [[0, -11], [0, -L + 6]], { deep:'#ff8a90' }, 1.4, .8 * glow); if (glow > .5) for (let i = 0; i < 2; i++){ const R = rng(seed + i * 17); bolt(g, [(R() - .5) * 4, -L * (.3 + R() * .3)], [(R() < .5 ? -1 : 1) * (8 + R() * 6), -L - 4 - R() * 8], seed + i, .8, 3); } }
  g.restore();
}

// ---------- Storm Lancer (jousting knight) ----------
// P.walk (trot, lance carried upright), P.charge (gallop, lance couched low), P.chew (rearing, lance jabbing the wall).
export function jouster(g, P = {}){
  const w = P.walk, cg = P.charge, ch = P.chew;
  let lifts = [0, 0, 0, 0], bob = 0, rear = 0, wave = 0, lean = 0, jab = 0, plumeBlow = 0, low = false;
  if (w != null){ const a = Math.sin(w * TAU); lifts = [Math.max(0, a), Math.max(0, -a), Math.max(0, -a) * .8, Math.max(0, a) * .8]; bob = -Math.abs(a) * 3; wave = a * 3; }
  else if (cg != null){ const L = off => clamp(Math.sin((cg - off) * TAU) * 1.3); lifts = [L(.38), L(.5), L(0), L(.12)]; bob = Math.sin(cg * TAU * 2 + 1) * 3 - 3; wave = Math.sin(cg * TAU * 2) * 4 + 3; lean = 1; plumeBlow = 1; low = true; }
  else if (ch != null){ const q = Math.sin(ch * TAU); rear = .55 + .45 * q; lifts = [rear * (.75 + .25 * Math.sin(ch * TAU * 2)), rear * (.75 - .25 * Math.sin(ch * TAU * 2)), 0, 0]; wave = q * 2; jab = Math.max(0, -Math.cos(ch * TAU)); low = true; }
  const B = bob - rear * 8;
  S.shadow(g, 0, 50, 54, 8);
  // raised lance first when it is carried upright (it rises behind the plume)
  legs(g, lifts, B, false);
  g.save(); g.translate(0, B);
  horseBody(g, { cap:SLATE, trim:CRIM, wave });
  riderLeg(g, -1, STEELD); riderLeg(g, 1, STEELD);
  g.save(); g.translate(-8, -8); g.rotate(-lean * .04); g.translate(8, 8 + lean * 4);
  // torso: breastplate with a crimson tabard stripe and a bolt, faulds over the saddle
  for (const x of [-22, -8, 6]) metal(g, RR(x - 7, -14, 15, 10, 3), STEELD, { x, y:-9, r:9 }, { flat:true });
  const torso = SM([[-26, -40], [-29, -24], [-24, -10], [-8, -6], [8, -10], [13, -24], [10, -40], [-8, -46]], .85);
  metal(g, torso, STEEL, { x:-8, y:-26, r:24 }, { hx:-18, hy:-34 });
  S.part(g, SM([[-14, -44], [-2, -44], [-1, -8], [-8, -5], [-15, -8]], .6), CRIM, { x:-8, y:-26, r:16 }, { flat:true, mat:'cloth' }); boltSigil(g, -8, -26, .7);
  for (const [x, y] of [[-22, -32], [6, -32], [-22, -16]]) S.rivet(g, x, y, 1.7, STEEL);
  // pauldron on the left shoulder (viewer's right), big grand-guard on the lance side
  metal(g, SM([[2, -44], [18, -48], [24, -36], [18, -26], [6, -30]], .75), STEEL, { x:14, y:-37, r:12 }, { hx:12, hy:-44 }); S.rivet(g, 16, -38, 1.6, STEEL);
  S.tube(g, SO([[14, -32], [16, -20], [10, -10]]), IRONK, 8); gauntlet(g, 9, -9, 5.5);   // rein hand
  S.ln(g, [[9, -9], [16, -2], [20, 4]], { deep:LEATH.base }, 1.6, .95);
  metal(g, SM([[-18, -44], [-36, -50], [-44, -36], [-38, -24], [-24, -28]], .75), STEEL, { x:-32, y:-37, r:14 }, { hx:-36, hy:-44 }); S.rivet(g, -34, -38, 1.8, STEEL);
  // helm: rounded armet, a frog-mouth visor ridge, glowing crimson eyes, crimson plume
  const hy = -64, pw = plumeBlow ? 1 : 0, pwv = w != null ? Math.sin(w * TAU + 1) * 3 : ch != null ? Math.sin(ch * TAU) * 2 : Math.sin((cg ?? 0) * TAU * 2) * 2;
  S.tube(g, SO([[-6, hy - 20], [0 + pw * 4, hy - 34 - pw * 6], [14 + pw * 10, hy - 42 - pw * 4 + pwv * .3], [28 + pw * 14, hy - 38 - pw * 2 + pwv]]), PLUME, 10);
  S.tube(g, SO([[-6, hy - 20], [6 + pw * 6, hy - 28 - pw * 6], [20 + pw * 12, hy - 28 - pw * 4 + pwv * .5], [32 + pw * 14, hy - 22 + pwv]]), PLUME, 7);
  S.stroke(g, SO([[-4, hy - 24], [2 + pw * 4, hy - 36 - pw * 6], [14 + pw * 10, hy - 41 - pw * 4], [24 + pw * 14, hy - 39 - pw * 2 + pwv]]), { deep:PLUME.light }, 1.8, .6);
  for (const [x, y] of [[8, hy - 40], [16, hy - 42], [22, hy - 40]]) S.ln(g, [[x + pw * 10, y - pw * 4], [x + 3 + pw * 10, y + 5 - pw * 4]], PLUME, 1, .5);
  metal(g, SM([[-26, hy + 20], [10, hy + 20], [12, hy + 26], [-8, hy + 30], [-28, hy + 26]], .7), STEELD, { x:-8, y:hy + 24, r:18 }, { flat:true });   // gorget
  const helm = SM([[-30, hy], [-28, hy - 16], [-18, hy - 25], [2, hy - 25], [12, hy - 16], [14, hy], [10, hy + 14], [-8, hy + 20], [-26, hy + 14]], .85);
  metal(g, helm, STEEL, { x:-8, y:hy - 4, r:25 }, { hx:-20, hy:hy - 16 });
  S.ln(g, [[-8, hy - 25], [-8, hy - 8]], STEELD, 1.4, .55);   // comb ridge
  metal(g, SM([[-29, hy + 1], [-8, hy - 4], [13, hy + 1], [12, hy + 12], [-8, hy + 19], [-28, hy + 12]], .7), STEELD, { x:-8, y:hy + 8, r:21 }, { hx:-18, hy:hy + 4 });   // visor
  S.dot(g, RR(-25, hy - 7, 34, 7, 3.4), SLIT);
  visorEye(g, -15, hy - 3.5, 3.2); visorEye(g, -1, hy - 3.5, 3.2);
  for (let i = 0; i < 5; i++) S.dot(g, E(-16 + i * 4, hy + 10 - Math.abs(i - 2) * .6, 1, 1.4), SLIT, .85);   // breaths
  for (const x of [-25, 9]) S.rivet(g, x, hy + 2, 1.5, STEEL);
  g.restore();
  // horse head in front of the rider
  horseHead(g, 18, -10 + rear * -2, { wave: -wave, open: ch != null ? rear * .9 : cg != null ? .5 : 0 });
  // right arm and the lance
  const sh = [-30 + lean * 0, -38 + lean * 4];
  if (!low){ const a = -Math.PI / 2 - .32 + (w != null ? Math.sin(w * TAU) * .03 : 0); const hx = -32, hyy = -22 + (w != null ? Math.sin(w * TAU) * 1.5 : 0);
    S.tube(g, SO([sh, [-40, -28], [hx, hyy]]), IRONK, 8.5); lance(g, hx, hyy, a, 92); }
  else { const a = Math.PI * .7 - (cg != null ? .04 : 0), ux = Math.cos(a), uy = Math.sin(a), hx = -30 + ux * jab * 8, hyy = -18 + lean * 4 + uy * jab * 8;
    S.tube(g, SO([sh, [-40, -26 + lean * 3], [hx, hyy]]), IRONK, 8.5); lance(g, hx, hyy, a, 64 + jab * 6); }
  g.restore();
  if (cg != null){ const R = rng(9); for (let i = 0; i < 4; i++){ const ph = (cg + i * .25) % 1, x = (R() - .5) * 70, y = 46 - ph * 6, r = 3 + ph * 7; S.dot(g, E(x, y, r * 1.3, r * .7), '#5a6078', .4 * (1 - ph)); } }   // kicked-up mud
}

// ---------- Storm Marshal (commander knight) ----------
// P.walk (stately trot, sword held up), P.chew (horse paws, sword hacks at the wall), P.command (once: sword raised high, banner flares, lightning on the blade).
export function commander(g, P = {}){
  const w = P.walk, ch = P.chew, cm = P.command;
  let lifts = [0, 0, 0, 0], bob = 0, rear = 0, wave = 0, raise = 0, chop = 0, flare = 0, glow = 0;
  if (w != null){ const a = Math.sin(w * TAU); lifts = [Math.max(0, a) * .85, Math.max(0, -a) * .85, Math.max(0, -a) * .7, Math.max(0, a) * .7]; bob = -Math.abs(a) * 2.5; wave = a * 2.5; }
  else if (ch != null){ const q = Math.sin(ch * TAU); rear = .3 + .3 * q; lifts = [Math.max(0, q) * .9, Math.max(0, -q) * .5, 0, 0]; chop = (1 - Math.cos(ch * TAU)) / 2; wave = q * 2; }
  else if (cm != null){ raise = ease(clamp(cm / .35)); rear = Math.sin(clamp(cm / .8) * Math.PI) * .85; lifts = [rear * (.8 + .2 * Math.sin(cm * TAU * 2)), rear * (.8 - .2 * Math.sin(cm * TAU * 2)), 0, 0]; flare = ease(clamp(cm / .45)); glow = clamp((cm - .3) / .2) * (1 - clamp((cm - .9) / .1) * .4); wave = Math.sin(cm * TAU * 2) * 3; }
  const B = bob - rear * 9, flagWave = w != null ? Math.sin(w * TAU * 2) * 4 : ch != null ? Math.sin(ch * TAU) * 3 : Math.sin(cm * TAU * 3) * 4;
  S.shadow(g, 0, 50, 58, 9);
  legs(g, lifts, B, true);
  g.save(); g.translate(0, B);
  // war banner on a pole strapped to his back (behind everything on the horse)
  { const px = 22, top = -120 - flare * 4;
    S.tube(g, SO([[px - 4, -20], [px, top]]), pal('#3a2a24'), 4.2); metal(g, SM([[px - 4, top + 2], [px + 4, top + 2], [px, top - 12, 1]], .5), BRASS, { x:px, y:top - 4, r:6 }, { flat:true });
    metal(g, E(px, top + 4, 4, 2.6), BRASS, { x:px, y:top + 4, r:4 }, { flat:true });
    const fl = 40 + flare * 22, lift = flare * 10, wv = flagWave, y0 = top + 6;
    const flag = SM([[px, y0, 1], [px + fl * .5, y0 - lift * .5 + wv * .3], [px + fl + wv, y0 - lift + 2], [px + fl * .78 + wv * .5, y0 + 16 - lift * .7, 1], [px + fl + wv * .8, y0 + 30 - lift * .4], [px + fl * .5, y0 + 30 - lift * .2 - wv * .3], [px, y0 + 32, 1]], .7);
    S.part(g, flag, CRIM, { x:px + fl * .45, y:y0 + 14, r:26 }, { mat:'cloth', flat:true, hx:px + 10, hy:y0 + 6 });
    S.stroke(g, SO([[px, y0 + 1], [px + fl * .5, y0 - lift * .5 + wv * .3 + 1], [px + fl + wv - 2, y0 - lift + 3]]), { deep:BRASS.base }, 1.8, .9);
    S.crease(g, SO([[px + fl * .3, y0 + 4], [px + fl * .34 + wv * .2, y0 + 28]]), CRIM, 1.4, .4); S.crease(g, SO([[px + fl * .62, y0 + 2 - lift * .5], [px + fl * .62 + wv * .3, y0 + 26 - lift * .3]]), CRIM, 1.2, .35);
    // sigil: a crown over a lightning bolt
    const sx = px + fl * .42 + wv * .2, sy = y0 + 15 - lift * .4;
    S.dot(g, PL([[sx - 6, sy - 5], [sx - 6, sy - 11], [sx - 3, sy - 8], [sx, sy - 12], [sx + 3, sy - 8], [sx + 6, sy - 11], [sx + 6, sy - 5]]), BRASS.light, .95);
    boltSigil(g, sx, sy + 4, .55); }
  // cape behind the rider, flaring out past the caparison
  { const cw = w != null ? Math.sin(w * TAU + 1) * 3 : flare * 8, cape = SM([[-30, -46], [-46, -30], [-56 - cw, 4], [-54 - cw, 22, 1], [-44, 14, 1], [-40, -4], [24, -4], [30, 14, 1], [40 + cw * .5, 22, 1], [42 + cw * .5, 2], [34, -30], [14, -46]], .8);
    S.part(g, cape, CAPE, { x:-8, y:-14, r:44 }, { mat:'cloth', hx:-36, hy:-34 });
    for (const s of [-1, 1]) S.dot(g, SM([[-8 + s * 30, -30], [-8 + s * (44 + (s < 0 ? cw : cw * .5)), 6], [-8 + s * 36, 4]], .8), LINING.base, .9);
    S.crease(g, SO([[-36, -30], [-48 - cw, 10]]), CAPE, 1.6, .4); }
  horseBody(g, { cap:CRIM, trim:BRASS, wave, heavy:true });
  riderLeg(g, -1, STEEL); riderLeg(g, 1, STEEL);
  // torso: heavy breastplate, brass trim, crimson sash, faulds
  for (const x of [-24, -8, 8]) metal(g, RR(x - 8, -14, 17, 11, 3), STEELD, { x, y:-9, r:10 }, { flat:true });
  const torso = SM([[-28, -42], [-32, -24], [-26, -8], [-8, -4], [10, -8], [16, -24], [12, -42], [-8, -48]], .85);
  metal(g, torso, STEEL, { x:-8, y:-26, r:26 }, { hx:-20, hy:-36 });
  S.stroke(g, SO([[-26, -40], [-8, -34], [10, -40]]), { deep:BRASS.base }, 2.2, .95);
  S.part(g, SM([[-28, -22], [12, -36], [14, -28], [-26, -12]], .6), CRIM, { x:-8, y:-24, r:20 }, { flat:true, mat:'cloth' });   // sash
  metal(g, E(-8, -40, 4.4, 4.4), BRASS, { x:-8, y:-40, r:4.4 }, { flat:true }); S.dot(g, E(-8, -40, 1.8, 1.8), CRIM.base);
  for (const [x, y] of [[-24, -32], [6, -32], [-22, -14], [4, -14]]) S.rivet(g, x, y, 1.8, BRASS);
  // spiked pauldrons
  for (const s of [-1, 1]){ const cx = -8 + s * 25; metal(g, SM([[cx - s * 12, -46], [cx + s * 8, -52], [cx + s * 16, -38], [cx + s * 10, -26], [cx - s * 6, -30]], .75), STEEL, { x:cx, y:-39, r:14 }, { hx:cx - 4, hy:-46 });
    metal(g, PL([[cx - 3, -50], [cx + 4, -51], [cx + s * 2, -62]]), STEELD, { x:cx, y:-54, r:6 }, { flat:true }); S.rivet(g, cx + s * 2, -40, 1.7, BRASS); }
  S.tube(g, SO([[16, -34], [18, -20], [10, -10]]), IRONK, 9); gauntlet(g, 9, -9, 6);   // rein hand
  S.ln(g, [[9, -9], [16, -2], [20, 4]], { deep:LEATH.base }, 1.6, .95);
  // crowned great helm: flat-topped, a cross visor with glowing eyes, an iron crown with crimson gems
  const hy = -66;
  metal(g, SM([[-28, hy + 18], [12, hy + 18], [14, hy + 26], [-8, hy + 31], [-30, hy + 26]], .7), STEELD, { x:-8, y:hy + 24, r:20 }, { flat:true });
  const helm = SM([[-29, hy + 14], [-31, hy - 4], [-28, hy - 22, 1], [12, hy - 22, 1], [15, hy - 4], [13, hy + 14], [-8, hy + 20]], .7);
  metal(g, helm, STEEL, { x:-8, y:hy - 2, r:26 }, { hx:-20, hy:hy - 14 });
  S.dot(g, RR(-24, hy - 6, 32, 7, 3), SLIT); S.dot(g, RR(-11.5, hy - 6, 7, 20, 3), SLIT);
  for (const [x, y] of [[-18, hy + 9], [-14, hy + 12], [-2, hy + 12], [2, hy + 9]]) S.dot(g, E(x, y, 1.1, 1.3), SLIT, .85);
  visorEye(g, -16, hy - 2.5, 3.4 + glow * .8, glow); visorEye(g, 0, hy - 2.5, 3.4 + glow * .8, glow);
  // crown
  const ctop = hy - 22, crown = SM([[-31, ctop + 6], [-32, ctop - 6, 1], [-25, ctop - 2], [-19, ctop - 14, 1], [-13, ctop - 3], [-8, ctop - 18, 1], [-3, ctop - 3], [3, ctop - 14, 1], [9, ctop - 2], [16, ctop - 6, 1], [15, ctop + 6]], .4);
  metal(g, crown, BRASS, { x:-8, y:ctop - 4, r:22 }, { flat:true, hx:-18, hy:ctop - 2 });
  for (const [x, y] of [[-19, ctop - 13], [-8, ctop - 17], [3, ctop - 13]]) S.dot(g, E(x, y, 1.6, 1.6), '#fff1c0', .9);
  for (const x of [-20, -8, 4]){ S.part(g, E(x, ctop + 1.5, 2.6, 3), CRIM, { x, y:ctop + 1.5, r:2.8 }, { flat:true, lw:.8 }); S.dot(g, E(x - .8, ctop + .5, .8, .8), '#fff', .9); }
  // horse head
  horseHead(g, 18, -10 + rear * -2, { wave:-wave, open:ch != null ? rear * .6 : rear * .8, heavy:true });
  // sword arm (viewer's left): held up at the shoulder, raised high to command, hacking down on the chew
  const sh = [-32, -40];
  if (cm != null){ const hx = -40 - raise * 6, hyy = -26 - raise * 56, el = [-48 - raise * 6, -34 - raise * 14];
    S.tube(g, SO([sh, el, [hx, hyy]]), IRONK, 9); sword(g, hx, hyy, -.45 + raise * .38, 44, glow, 3 + Math.floor(cm * 8)); gauntlet(g, hx, hyy, 6.4); }
  else if (ch != null){ const a = -.5 - chop * 1.9 + .4, hx = -40 - chop * 4, hyy = -32 + chop * 16;
    S.tube(g, SO([sh, [-46, -30 + chop * 6], [hx, hyy]]), IRONK, 9); sword(g, hx, hyy, a, 44); gauntlet(g, hx, hyy, 6.4); }
  else { const sw = w != null ? Math.sin(w * TAU) * .05 : 0, hx = -40, hyy = -26 + sw * 20;
    S.tube(g, SO([sh, [-46, -28], [hx, hyy]]), IRONK, 9); sword(g, hx, hyy, -.42 + sw, 44); gauntlet(g, hx, hyy, 6.4); }
  g.restore();
}

// ---------- clips (registry-style) ----------

// ---------- registry ----------
// =====================================================================================================
// THE BLOOD GLUTTON AND THE BAT BRIDE (ported from docs/archive/nightmare-monsters/vampires-doctor/nm_vampires.js, its `glutton` and `bride`
// looks of the nightmare vampire; the w4.js helpers they use are copied with them). Poses: walk, chew, and heal (the archive's goblet raise /
// spread arms), played here as `cast`: the Glutton toasting a red net away, the Bride spreading her arms as she drops a veil (engine/keep.js).
// =====================================================================================================
const GOLD = pal('#e2b24c'), HAIR = pal('#201519'), BATC = pal('#3a2040');
/** Foot offset for a walking leg: [dx, dy] with the two legs half a cycle apart. */
const stride = (w, s, amp = 5, lift = 7) => { if (w == null) return [0, 0]; const ph = w * TAU + (s < 0 ? 0 : Math.PI); return [Math.cos(ph) * amp, -Math.max(0, Math.sin(ph)) * lift]; };
/** A chunky boot seen from the front. */
function boot(g, x, y, c, r = 9){ const p = SM([[x - r, y - r * .6], [x + r, y - r * .6], [x + r * 1.15, y + r * .2], [x + r * .6, y + r * .55], [x - r * .6, y + r * .55], [x - r * 1.15, y + r * .2]], .7); S.part(g, p, c, { x, y:y - r * .2, r }, { flat:true, mat:'leather' }); S.ln(g, [[x - r * .7, y - r * .05], [x + r * .7, y - r * .05]], c, 1, .45); }
/** Pale clawed hand: palm plus long fingers ending in claws. dir = where the fingers point. */
function clawHand(g, x, y, c, dir, r = 6, len = 8){ for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * .42, fx = x + Math.cos(a) * len, fy = y + Math.sin(a) * len; S.tube(g, SO([[x, y], [fx, fy]]), c, 3.2); S.claw(g, fx + Math.cos(a) * 1.5, fy + Math.sin(a) * 1.5, a, 4.5, '#e8e0f0'); } S.part(g, E(x, y, r, r * .9), c, { x, y, r }, { flat:true, mat:'skin' }); }
/** A small bat silhouette. */
function miniBat(g, x, y, s, flap){ g.save(); g.translate(x, y); g.scale(s, s); const lift = flap * 6; for (const d of [-1, 1]) S.dot(g, SM([[d * 3, 0], [d * 10, -6 - lift], [d * 20, -8 - lift], [d * 18, 0, 1], [d * 14, 4, 1], [d * 8, 2, 1]], .7), BATC.dark, .95); S.dot(g, E(0, 0, 4, 5), BATC.base); S.dot(g, PL([[-3, -3], [-5, -9], [-1, -5]]), BATC.base); S.dot(g, PL([[3, -3], [5, -9], [1, -5]]), BATC.base); S.dot(g, E(-1.5, -1, .9, .9), '#ff4a4a'); S.dot(g, E(1.5, -1, .9, .9), '#ff4a4a'); g.restore(); }
// ---------- nightmare palettes: storm navy, rain-black, crimson ----------
const BOLT = '#f2f7ff';
const G_SKIN = pal('#d9b4bd'), G_COAT = pal('#30395c'), G_VEST = pal('#a3122a'), G_SHIRT = pal('#d8cfd2'), G_TROU = pal('#232637'), G_BOOT = pal('#1c1418'),
  G_IRON = pal('#5a5f70'), G_CAPE = pal('#1c2238'), G_LIN = pal('#8e0f22'), G_GOB = pal('#4c505e'), BLOOD = pal('#c8101e');
const B_SKIN = pal('#e4e6f4'), B_HAIR = pal('#251a32'), B_GOWN = pal('#b3132c'), B_DARK = pal('#2a0a18'), B_WING = pal('#1c1226'), B_MEMB = pal('#6a1030'),
  B_GLOVE = pal('#1e1424'), B_IRON = pal('#3c4050'), B_GEM = pal('#e0203a');

/** Rain sheen: a few short lit streaks clipped to a part (the storm is on them). */
function rain(g, clip, x0, y0, w, h, seed){ const R = rng(seed); g.save(); clip(g); g.clip(); g.strokeStyle = 'rgba(200,212,255,.45)'; g.lineWidth = .9;
  for (let i = 0; i < 7; i++){ const x = x0 + R() * w, y = y0 + R() * h, l = 4 + R() * 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * .25, y + l); g.stroke(); } g.restore(); }
/** A drop of blood: teardrop with a highlight. */
function drop(g, x, y, s = 1){ S.part(g, SM([[x, y - 4 * s, 1], [x + 2.4 * s, y + 1 * s], [x, y + 3.4 * s], [x - 2.4 * s, y + 1 * s]], .9), BLOOD, { x, y, r:3 * s }, { flat:true, lw:.8 }); S.dot(g, E(x - .8 * s, y, .7 * s, 1 * s), '#ffd0d6', .8); }
/** Iron manacle on a wrist with two broken chain links swinging below it. */
function manacle(g, x, y, a, sw){ g.save(); g.translate(x, y); g.rotate(a);
  for (let i = 0; i < 2; i++){ const lx = Math.sin(sw) * (2 + i * 2), ly = 8 + i * 6; g.save(); g.translate(lx, ly); g.rotate(i % 2 ? 0 : Math.PI / 2); g.strokeStyle = G_IRON.deep; g.lineWidth = 3.2; ell(g, 0, 0, 3.4, 2.2); g.stroke(); g.strokeStyle = G_IRON.light; g.lineWidth = 1.4; ell(g, 0, 0, 3.4, 2.2); g.stroke(); g.restore(); }
  S.part(g, RR(-10, -4, 20, 8, 3), G_IRON, { x:0, y:0, r:10 }, { flat:true, mat:'metal' }); S.rivet(g, -5, 0, 1.4, G_IRON); S.rivet(g, 5, 0, 1.4, G_IRON);
  g.restore(); }
/** Heal aura copied from the game's vampire: a red pulse and a widening ring. */
function healAura(g, pulse, k = 1){ const rr = (52 + pulse * 12) * k, gr = g.createRadialGradient(0, 0, 4, 0, 0, rr); gr.addColorStop(0, `rgba(255,60,70,${.35 + pulse * .3})`); gr.addColorStop(.6, `rgba(255,40,60,${.18 + pulse * .15})`); gr.addColorStop(1, 'rgba(255,40,60,0)'); g.fillStyle = gr; g.fillRect(-100, -110, 200, 170);
  g.strokeStyle = `rgba(255,120,130,${.5 - pulse * .4})`; g.lineWidth = 2; ell(g, 0, 0, (30 + pulse * 34) * k, (36 + pulse * 30) * k); g.stroke(); }

// ---------- the Blood Glutton: squat, gorged, huge arms ----------
function glutton(g, P){
  const w = P.walk, ch = P.chew, he = P.heal;
  const sw = w != null ? Math.sin(w * TAU) : 0, pulse = he == null ? 0 : (Math.sin(he * TAU) + 1) / 2, lunge = ch == null ? 0 : (1 - Math.cos(ch * TAU)) / 2;
  const bob = w != null ? -Math.abs(Math.cos(w * TAU)) * 3 + 1.5 : ch != null ? lunge * 4 : he != null ? Math.sin(he * TAU) * 1.2 : 0, sway = w != null ? sw * .07 : 0;
  S.shadow(g, 0, 50, 44, 7);
  if (he != null) healAura(g, pulse, 1.1);
  // short, thick, bowed legs and heavy boots (outside the body sway so the feet stay planted)
  for (const s of [-1, 1]){ const [dx, dy] = stride(w, s, 4, 6); S.tube(g, SO([[s * 13, 18], [s * 20 + dx * .5, 32 + dy * .5], [s * 18 + dx, 42 + dy]]), G_TROU, 14); boot(g, s * 19 + dx, 46 + dy, G_BOOT, 11.5); }
  g.save(); g.translate(0, 46); g.rotate(sway); g.translate(0, -46 + bob);
  // ragged mantle behind the shoulders: rain-black, crimson lining at the slashes
  const mant = SM([[-30, -34], [-46, -16], [-50, 14, 1], [-42, 6, 1], [-36, 18, 1], [-28, 8, 1], [28, 8, 1], [36, 18, 1], [42, 6, 1], [50, 14, 1], [46, -16], [30, -34]], .8);
  S.part(g, mant, G_CAPE, { x:0, y:-8, r:48 }, { mat:'cloth', hx:-30, hy:-22 });
  for (const s of [-1, 1]) S.dot(g, PL([[s * 44, -6], [s * 47, 8], [s * 41, 2]]), G_LIN.base, .9);
  // barrel body: open storm-navy coat over a crimson waistcoat straining at the buttons, blood down the shirt
  const body = SM([[-30, -30], [-40, -6], [-38, 18], [-24, 32], [0, 36], [24, 32], [38, 18], [40, -6], [30, -30], [0, -34]], .85);
  S.part(g, body, G_COAT, { x:0, y:2, r:38 }, { mat:'cloth', hx:-22, hy:-16 });
  const belly = SM([[-20, -24], [-27, 0], [-23, 24], [0, 32], [23, 24], [27, 0], [20, -24], [0, -18]], .85);
  S.part(g, belly, G_VEST, { x:0, y:6, r:28 }, { mat:'cloth', hx:-10, hy:-6 });
  S.part(g, PL([[-11, -26], [11, -26], [0, -6]]), G_SHIRT, { x:0, y:-18, r:12 }, { flat:true, mat:'cloth' });
  S.dot(g, SM([[-4, -18], [3, -16], [5, -4], [1, 6], [-2, -2], [-5, -10]], .8), BLOOD.dark, .85);   // the stain spreading down the front
  for (const y of [0, 12, 23]){ S.rivet(g, 0, y, 2.4, GOLD); S.ln(g, [[-6, y - 3], [-1.5, y]], G_VEST, 1, .55); S.ln(g, [[6, y - 3], [1.5, y]], G_VEST, 1, .55); }   // buttons pulling the cloth
  S.crease(g, SO([[-30, -4], [-33, 22]]), G_COAT, 2, .45); S.crease(g, SO([[30, -4], [33, 22]]), G_COAT, 2, .45);
  rain(g, body, -38, -30, 76, 30, 7);
  // arms: huge, hanging and swinging on the walk; hammering the wall on the chew; raising the goblet on the heal
  const arm = (s, el, hx, hy, dir, a) => { S.tube(g, SO([[s * 30, -22], el, [hx, hy]]), G_COAT, 16); manacle(g, hx + Math.cos(dir + Math.PI) * 9, hy + Math.sin(dir + Math.PI) * 9, dir - Math.PI / 2, a); clawHand(g, hx, hy, G_SKIN, dir, 9, 10); };
  if (he != null){ const lift = (Math.sin(he * TAU) + 1) / 2;
    arm(-1, [-46, -4], -34, 16, Math.PI / 2 + .4, 0);   // the other hand rests on the belly
    S.tube(g, SO([[30, -22], [44, -6 - lift * 4], [24, -14 - lift * 6]]), G_COAT, 16);
    const gx = 18, gy = -20 - lift * 8;   // iron goblet raised to the mouth, brimming with blood
    S.part(g, SM([[gx - 9, gy - 10], [gx + 9, gy - 10], [gx + 7, gy], [gx + 2, gy + 4], [gx - 2, gy + 4], [gx - 7, gy]], .7), G_GOB, { x:gx, y:gy - 4, r:10 }, { mat:'metal' });
    S.tube(g, SO([[gx, gy + 4], [gx, gy + 11]]), G_GOB, 3.5); S.part(g, E(gx, gy + 12, 6, 2), G_GOB, { x:gx, y:gy + 12, r:6 }, { flat:true, mat:'metal' });
    S.dot(g, E(gx, gy - 10, 8.5, 2.4), BLOOD.base); S.dot(g, E(gx - 3, gy - 10.5, 3, .9), '#ff8090', .7); drop(g, gx + 8, gy - 2 + lift * 4, .8);
    clawHand(g, 30, -12 - lift * 6, G_SKIN, Math.PI + .4, 9, 7); manacle(g, 38, -10 - lift * 6, .8, 0); }
  else if (ch != null){ for (const s of [-1, 1]){ const hy = -6 + lunge * 40, hx = s * (30 - lunge * 8); arm(s, [s * 50, -14 + lunge * 6], hx, hy, Math.PI / 2 - s * .2, ch * TAU + s); } }
  else { const a = sw * .35; arm(-1, [-50, -2 + a * 6], -46 + a * 4, 26 + a * 6, Math.PI / 2 + .25, a * 2); arm(1, [50, -2 - a * 6], 46 + a * 4, 26 - a * 6, Math.PI / 2 - .25, -a * 2); }
  // head: wide and low between the shoulders, bald with a slicked widow's peak and a lightning scar; bat ears, heavy brow, tusks
  g.save(); g.translate(0, ch != null ? lunge * 6 : 0);
  for (const s of [-1, 1]){ const ear = SM([[s * 20, -32], [s * 36, -46, 1], [s * 31, -30], [s * 34, -22, 1], [s * 22, -20]], .6); S.part(g, ear, G_SKIN, { x:s * 27, y:-30, r:9 }, { flat:true, mat:'skin' }); S.dot(g, SM([[s * 23, -30], [s * 31, -40], [s * 28, -27]], .7), '#b05a6a', .55); }
  const head = SM([[-22, -36], [-25, -20], [-20, -6], [-8, 0], [8, 0], [20, -6], [25, -20], [22, -36], [12, -50], [-12, -50]], .85);
  S.part(g, head, G_SKIN, { x:0, y:-26, r:25 }, { mat:'skin', hx:-10, hy:-40 }); S.contact(g, body, 0, -26, 22, 6, .5);
  S.dot(g, SM([[-10, -50], [0, -44, 1], [10, -50], [4, -51], [0, -48], [-4, -51]], .8), HAIR.base, .95);   // the widow's peak, all that's left of the hair
  S.ln(g, [[14, -48], [8, -41], [13, -38], [6, -30]], { deep:'#7a2a3a' }, 2, .8); S.ln(g, [[14, -48], [8, -41], [13, -38], [6, -30]], { deep:BOLT }, .8, .7);   // lightning scar
  for (const [x, y] of [[10, -45], [11, -39], [9, -34]]) S.ln(g, [[x - 2.2, y - .8], [x + 2.2, y + .8]], { deep:'#5a1e2a' }, .9, .7);
  S.ln(g, [[-19, -32], [-4, -27]], HAIR, 3, .9); S.ln(g, [[19, -32], [4, -27]], HAIR, 3, .9);
  if (he != null){ S.glow(g, -9, -23, 3.5 + pulse * 2, '#ff3030'); S.glow(g, 9, -23, 3.5 + pulse * 2, '#ff3030'); }
  for (const s of [-1, 1]) S.eye(g, s * 9, -22, 6.5, 6.5, { lx:-s * .05, ly:.1, pr:.44, pupil:'#c01020', iris:'#ff6060', lid:.32, tilt:s * .35, lidCol:G_SKIN.dark, lidDeep:'#3a1020' });
  const jaw = ch != null ? 2 + lunge * 4 : he != null ? 1 : 0;
  const mouth = SM([[-13, -12], [-7, -8 + jaw], [0, -7 + jaw * 1.2], [7, -8 + jaw], [13, -12], [0, -13]], .8); S.dot(g, mouth, '#3a0a14');
  S.dot(g, PL([[-8, -12.5], [-4.5, -12.5], [-6.2, -5]]), '#fff'); S.dot(g, PL([[4.5, -12.5], [8, -12.5], [6.2, -5]]), '#fff');   // fangs
  for (const s of [-1, 1]) S.part(g, PL([[s * 11, -8 + jaw], [s * 14.5, -9 + jaw], [s * 13.5, -18 + jaw * .5]]), pal('#f4ecd8'), { x:s * 13, y:-12, r:4 }, { flat:true, lw:.8 });   // lower tusks
  S.dot(g, SM([[-13, -11], [-10, -6], [-11, 2], [-13, -4]], .8), BLOOD.base, .9); drop(g, -11.5, 4 + (w != null ? w * 3 : 0), .8); S.dot(g, SM([[10, -9], [13, -10], [12, -3]], .8), BLOOD.base, .8);   // blood-smeared chin
  g.restore();
  g.restore();
}

// ---------- the Bat Bride: tall, floating, a mantle of bat wings, a hem that breaks up into bats ----------
function bride(g, P){
  const w = P.walk, ch = P.chew, he = P.heal;
  const fl = w != null ? Math.sin(w * TAU) : 0, pulse = he == null ? 0 : (Math.sin(he * TAU) + 1) / 2, lean = ch == null ? 0 : (1 - Math.cos(ch * TAU)) / 2;
  const ph = (w ?? ch ?? he ?? 0) * TAU;
  const bob = w != null ? fl * 3 - 2 : ch != null ? lean * 5 : he != null ? -pulse * 3 : 0;
  S.shadow(g, 0, 50, 24, 5);
  if (he != null) healAura(g, pulse, 1);
  g.save(); g.translate(0, bob);
  // the bat-wing mantle standing up behind her shoulders: membrane scallops and finger bones
  const flap = w != null ? Math.sin(ph) * 3 : he != null ? -pulse * 6 : ch != null ? lean * 4 : 0;
  for (const s of [-1, 1]){ const wing = SM([[s * 8, -26], [s * 22, -50 - flap, 1], [s * 46, -68 - flap, 1], [s * 44, -50 - flap * .6, 1], [s * 48, -32, 1], [s * 38, -34, 1], [s * 36, -18, 1], [s * 26, -22, 1], [s * 18, -6, 1]], .5);
    S.part(g, wing, B_WING, { x:s * 28, y:-36, r:30 }, { mat:'leather', flat:true });
    g.save(); wing(g); g.clip(); S.dot(g, SM([[s * 14, -24], [s * 40, -60 - flap], [s * 40, -40], [s * 22, -14]], .8), B_MEMB.base, .45); g.restore();
    for (const [ex, ey] of [[46, -68], [48, -32], [36, -18]]) S.ln(g, [[s * 12, -22], [s * ex, ey - (ey < -40 ? flap : 0)]], B_WING, 1.6, .9);
    S.claw(g, s * 46, -68 - flap, -Math.PI / 2 - s * .6, 5, '#d8d0e0'); }
  // long black hair falling behind to the waist, one white lightning lock
  const hair = SM([[-18, -54], [-26, -36], [-26, -10], [-30, 10, 1], [-20, 4], [-14, 14, 1], [-8, -10], [8, -10], [14, 14, 1], [20, 4], [30, 10, 1], [26, -10], [26, -36], [18, -54], [0, -60]], .8);
  S.part(g, hair, B_HAIR, { x:0, y:-24, r:34 }, { mat:'leather', hx:-14, hy:-46 });
  // gown: crimson skirt flaring to a scalloped bat-wing hem; dark overskirt panels; bats peeling off the hem
  const sw = w != null ? Math.sin(ph + 1) * 3 : 0;
  const skirt = SM([[-10, 2], [-20, 18], [-30 + sw, 40, 1], [-22 + sw, 36, 1], [-15, 44, 1], [-7, 38, 1], [0, 45, 1], [7, 38, 1], [15, 44, 1], [22 - sw, 36, 1], [30 - sw, 40, 1], [20, 18], [10, 2]], .75);
  S.part(g, skirt, B_GOWN, { x:0, y:22, r:30 }, { mat:'cloth', hx:-12, hy:12 });
  for (const s of [-1, 1]){ const pnl = SM([[s * 6, 2], [s * 16, 18], [s * (27 - s * sw), 39, 1], [s * 21, 35, 1], [s * 14, 42, 1], [s * 10, 20]], .75); S.part(g, pnl, B_DARK, { x:s * 15, y:22, r:22 }, { mat:'cloth', flat:true }); }
  S.crease(g, SO([[-3, 8], [-6, 38]]), B_GOWN, 1.6, .45); S.crease(g, SO([[3, 8], [6, 38]]), B_GOWN, 1.6, .45);
  for (let i = 0; i < 4; i++){ const k = ((w ?? he ?? 0) + i / 4) % 1, bx = (i % 2 ? 1 : -1) * (12 + i * 5) + Math.sin(k * TAU + i) * 4, by = 46 - k * 16; g.save(); g.globalAlpha = Math.min(1, (1 - k) * 2.2); miniBat(g, bx, by, .5 + (1 - k) * .1, Math.sin((k * 3 + i * .4) * TAU)); g.restore(); }
  // bodice: corset with lacing, iron-clasped, a blood-drop pendant
  const bod = SM([[-13, -18], [-15, -6], [-10, 4], [0, 6], [10, 4], [15, -6], [13, -18], [0, -14]], .85); S.part(g, bod, B_DARK, { x:0, y:-6, r:16 }, { mat:'leather' });
  for (let i = 0; i < 4; i++) S.ln(g, [[-3, -12 + i * 4], [3, -10 + i * 4]], B_GOWN, 1.1, .9);
  S.dot(g, SM([[-12, -18], [0, -11], [12, -18], [8, -21], [0, -17], [-8, -21]], .8), B_SKIN.base);   // neckline
  S.ln(g, [[-7, -19], [0, -14], [7, -19]], B_IRON, 1, .8); S.part(g, SM([[0, -15, 1], [2.6, -11], [0, -7.5], [-2.6, -11]], .9), B_GEM, { x:0, y:-11, r:3.5 }, { flat:true, lw:.8 });
  // arms: thin, black-gloved; one at the breast and one trailing on the float; reaching down on the chew; spread wide on the heal
  const glove = (pts, hx, hy, dir) => { S.tube(g, SO(pts), B_GLOVE, 5); clawHand(g, hx, hy, B_GLOVE, dir, 4, 7); };
  if (he != null){ const u = pulse * 6; glove([[-12, -14], [-26, -26 - u], [-34, -40 - u]], -35, -43 - u, -Math.PI / 2 - .5); glove([[12, -14], [26, -26 - u], [34, -40 - u]], 35, -43 - u, -Math.PI / 2 + .5); }
  else if (ch != null){ for (const s of [-1, 1]) glove([[s * 12, -14], [s * 20, 0 + lean * 4], [s * 14, 16 + lean * 12]], s * 13, 19 + lean * 12, Math.PI / 2 - s * .3); }
  else { glove([[-12, -14], [-16, -4], [-6, -8]], -4, -9, 0); glove([[12, -14], [24, -2 + fl * 2], [30, 12 + fl * 3]], 30, 15 + fl * 3, Math.PI / 2 - .4); }
  // head: heart-shaped pale face, red eyes with lashes, dark lips and small fangs; iron tiara and a torn black veil
  g.save(); g.translate(0, ch != null ? lean * 5 : 0); g.rotate(ch != null ? 0 : w != null ? fl * .03 : 0);
  const face = SM([[-17, -44], [-18, -30], [-12, -18], [0, -13, 1], [12, -18], [18, -30], [17, -44], [8, -52], [-8, -52]], .85);
  S.part(g, face, B_SKIN, { x:0, y:-34, r:20 }, { mat:'skin', hx:-8, hy:-44 });
  for (const s of [-1, 1]) S.part(g, PL([[s * 15, -38], [s * 25, -46], [s * 17, -30]]), B_SKIN, { x:s * 19, y:-38, r:6 }, { flat:true, mat:'skin' });
  const bangs = SM([[-19, -40], [-19, -52], [-6, -60], [6, -60], [19, -52], [19, -40], [12, -48], [3, -45], [0, -50], [-3, -45], [-12, -48]], .8); S.part(g, bangs, B_HAIR, { x:0, y:-50, r:20 }, { mat:'leather', hx:-8, hy:-55 });
  const lock = SM([[-8, -59], [-3, -60], [-9, -52], [-13, -46], [-17, -40], [-15, -48]], .8); S.part(g, lock, pal('#e8ecff'), { x:-10, y:-52, r:8 }, { flat:true, lw:1 }); S.ln(g, [[-6, -58], [-11, -50], [-15, -43]], { deep:'#9fb0ff' }, 1, .8);   // the white lightning lock
  // veil from the tiara, torn, translucent
  g.save(); g.globalAlpha = .55; S.dot(g, SM([[-16, -58], [-28, -48], [-30, -24, 1], [-25, -30, 1], [-22, -20, 1], [-20, -50]], .7), '#0a0610'); S.dot(g, SM([[16, -58], [28, -48], [30, -24, 1], [25, -30, 1], [22, -20, 1], [20, -50]], .7), '#0a0610'); g.restore();
  const tiara = PL([[-14, -56], [-11, -66], [-7, -58], [-3, -70], [0, -60], [3, -70], [7, -58], [11, -66], [14, -56], [0, -54]]);
  S.part(g, tiara, B_IRON, { x:0, y:-60, r:12 }, { flat:true, mat:'metal' }); S.part(g, E(0, -59, 2.6, 2.6), B_GEM, { x:0, y:-59, r:2.6 }, { flat:true, lw:.8 });
  if (he != null){ S.glow(g, -7, -33, 4 + pulse * 2, '#ff3030'); S.glow(g, 7, -33, 4 + pulse * 2, '#ff3030'); }
  for (const s of [-1, 1]){ S.eye(g, s * 7, -33, 6.5, 7.5, { lx:.05, ly:.2, pr:.42, pupil:'#b0101c', iris:'#ff5a6a' });
    S.ln(g, [[s * 1.5, -39], [s * 7, -41], [s * 13, -38]], B_HAIR, 1.8, .95); for (const k of [0, 1]) S.ln(g, [[s * (11 + k * 2), -38.5 - k * .5], [s * (14 + k * 2.5), -41 - k * .5]], B_HAIR, 1.2, .9); }
  const op = ch != null ? 1.5 + lean * 2 : 0;
  S.dot(g, SM([[-5, -22], [0, -23.5], [5, -22], [0, -19 + op]], .9), '#5a0a1e'); S.dot(g, PL([[-3.6, -22.4], [-1.6, -22.6], [-2.6, -18.5]]), '#fff'); S.dot(g, PL([[1.6, -22.6], [3.6, -22.4], [2.6, -18.5]]), '#fff');
  S.dot(g, E(9, -24, .9, .9), '#2a1020');   // beauty mark
  g.restore();
  g.restore();
}


// The Lobber Cart (r 26): the archive's suggested scale .55; dy puts its wheels on the ground. The cart has no die or chew clip (it never chews;
// it is shattered by the game's ordinary death burst). `frame` shows the parked idle while it sits at its park point (m.parked) and lets a lob
// (m.anim, set by engine/keep.js) play through.
const idleFrame = (m, clips) => m.anim ? null : m.parked ? ['idle', Math.floor(m.ph * clips.idle.fps) % clips.idle.n] : null;
export const KEEP = {
  lancer: { draw:jouster, scale:.62, dy:-12, box:{ x:-86, y:-126, w:146, h:186 }, clips:{ walk:{ n:8, fps:16, pose:t => ({ charge:t }) }, chew:{ n:4, fps:7, pose:t => ({ chew:t }) } }, still:{ charge:0 } },
  marshal: { draw:commander, scale:.62, dy:-12, box:{ x:-86, y:-148, w:176, h:208 }, clips:{ walk:{ n:8, fps:7, pose:t => ({ walk:t }) }, chew:{ n:4, fps:6, pose:t => ({ chew:t }) }, command:{ n:8, fps:9, once:true, pose:t => ({ command:t }) } }, still:{} },
  // The Blood Glutton (r 24) and the Bat Bride (r 22): the archive's scale and box. `cast` (once) is played by engine/keep.js as a net flies / a veil drops.
  glutton: { draw:glutton, scale:.74, dy:-14, box:{ x:-80, y:-80, w:160, h:136 }, clips:{ walk:{ n:8, fps:8, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, cast:{ n:6, fps:8, once:true, pose:t => ({ heal:t }) } }, still:{} },
  bride: { draw:bride, scale:.74, dy:-14, box:{ x:-80, y:-80, w:160, h:136 }, clips:{ walk:{ n:8, fps:8, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, cast:{ n:6, fps:8, once:true, pose:t => ({ heal:t }) } }, still:{} },
  lobbercart: { draw:cart, scale:.55, dy:-14, box:{ x:-76, y:-104, w:154, h:162 }, frame:idleFrame, clips:{ walk:{ n:8, fps:8, pose:t => ({ walk:t }) }, idle:{ n:6, fps:5, pose:t => ({ idle:t }) }, lob:{ n:10, fps:12, once:true, pose:t => ({ lob:t }) } }, still:{} },
};
