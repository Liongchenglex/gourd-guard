// ---------- Nightmare world 1: the Grave Riser (Release 4) ----------
// A gaunt grave-digger in a long tattered coat and a battered hat, a lantern in one hand and a spade in the other. Drawn new for Release 4
// (no archive drawing; spec Part 4), Toy Plastic per docs/ART_BRIEF.md. Clips: walk, chew, dig (engine/nightmare.js plays it when it raises
// a grave) and die (combat.js plays it as a clip effect where it falls: it sinks back into the earth, leaving its hat on the hole).
// Spread into NM1 (nm1.js). Glow and shadowBlur are fine here: every clip is baked by render/anim.js; nothing here is painted per frame.

import { E, PL, RR, S, SM, SO, pal, rng } from '../paint.js';
import { TAU } from '../../util.js';

const cl01 = x => x < 0 ? 0 : x > 1 ? 1 : x, ease = x => { x = cl01(x); return x * x * (3 - 2 * x); }, lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => ease((t - a) / (b - a));

const COAT = pal('#4e4660'), COATP = pal('#6a5a48'), SKIN = pal('#b9c49a'), HAT = pal('#3c3444'), BAND = pal('#8a3a34'), SCARF = pal('#8a5236'),
  PANTS = pal('#5a4c3c'), BOOT = pal('#4a3222'), HANDLE = pal('#9a6e44'), BLADE = pal('#9aa0aa'), LANF = pal('#4a3a2e'), LANG = pal('#ffd890'), LANDIM = pal('#8a7a5a'),
  DIRT = pal('#5e4430'), HAIR = pal('#a4a49a');
const GLOW = '#ffb640';

/** The spade: grip in the hand at (x, y), the blade along angle a. k < 1 foreshortens it (the spade turning towards the viewer). */
function spade(g, x, y, a, k = 1){
  g.save(); g.translate(x, y); g.rotate(a); g.scale(k, 1);
  S.tube(g, SO([[-26, 0], [32, 0]]), HANDLE, 4.4);
  S.part(g, RR(-30, -7, 5, 14, 2), HANDLE, { x:-28, y:0, r:7 }, { flat:true, mat:'wood', lw:1 });   // T grip
  S.part(g, RR(30, -4, 7, 8, 1.5), BLADE, { x:33, y:0, r:5 }, { flat:true, mat:'metal', lw:1 });    // collar
  const blade = SM([[36, -8.5], [50, -9], [56, -4.5], [58, 0], [56, 4.5], [50, 9], [36, 8.5]], .6);
  S.part(g, blade, BLADE, { x:46, y:-1, r:12 }, { mat:'metal' });
  g.save(); blade(g); g.clip(); S.dot(g, SM([[47, -9], [56, -5], [58, 2], [54, 9], [50, 4]], .7), '#4a2e1a', .5); g.restore();   // old earth on the edge
  S.ln(g, [[38, 0], [51, 0]], BLADE, 1, .45);
  S.rivet(g, 33.5, 0, 1.4, BLADE);
  g.restore();
}

/** The lantern hanging from a hand at (x, y), swinging by sw; lit 0..1 (it gutters out as the riser dies). */
function lantern(g, x, y, sw, lit = 1){
  g.save(); g.translate(x, y); g.rotate(sw);
  S.stroke(g, g2 => { g2.beginPath(); g2.arc(0, 6, 3.4, Math.PI, TAU); }, LANF, 1.8);
  S.part(g, PL([[-7.5, 13], [0, 6.5], [7.5, 13]]), LANF, { x:0, y:10, r:6 }, { flat:true, mat:'metal', lw:1 });
  g.save(); if (lit > 0){ g.shadowColor = GLOW; g.shadowBlur = 18 * lit; }
  S.part(g, RR(-7, 12.5, 14, 17, 3.5), lit > .4 ? LANG : LANDIM, { x:0, y:20, r:11 }, { flat:true }); g.restore();
  if (lit > 0){ S.dot(g, E(0, 22, 3.6, 5.6), GLOW, lit); S.dot(g, E(0, 21, 1.6, 2.6), '#fff8d0', lit); }
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-5, 14, 2, 14);
  S.ln(g, [[0, 12.5], [0, 29.5]], LANF, 1, .55); S.ln(g, [[-7, 21], [7, 21]], LANF, 1, .4);
  S.part(g, RR(-8.5, 28.5, 17, 4.5, 1.6), LANF, { x:0, y:30, r:9 }, { flat:true, mat:'metal', lw:1 });
  g.restore();
}

/** The battered hat, centred on its brim at (0, 0). */
function hat(g){
  const crown = SM([[-14, -2], [-15.5, -14], [-11, -24], [-3, -21.5], [3, -25], [11, -22], [14.5, -13], [14, -2]], .8);
  S.part(g, SM([[-27, 1], [-15, -4], [0, -5.5], [15, -4], [27, 0], [24, 4.5], [0, 2], [-24, 5]], .7), HAT, { x:0, y:0, r:24 }, { flat:true, mat:'cloth' });
  S.part(g, crown, HAT, { x:-2, y:-12, r:16 }, { mat:'cloth' });
  S.contact(g, crown, 0, -1, 15, 4, .45);
  S.part(g, PL([[-14.5, -7.5], [14.5, -7], [14.2, -2.5], [-14.2, -2.5]]), BAND, { x:0, y:-5, r:14 }, { flat:true, mat:'cloth', lw:1 });
  S.part(g, RR(4, -18, 7, 7, 1), COATP, { x:7.5, y:-14.5, r:5 }, { flat:true, mat:'cloth', lw:.8 });   // a patch
  for (const [x1, y1, x2, y2] of [[4.5, -16, 6, -16], [10.5, -13, 9, -13]]) S.ln(g, [[x1, y1], [x2, y2]], COATP, .7, .6);
  S.crease(g, SO([[-3, -21], [-2, -12], [-4, -4]]), HAT, 1.3, .45);
}

/** The head: long and gaunt, sunken eyes, a droopy nose, a crooked grin; jaw opens it. Neck at (0, 0). */
function head(g, jaw = 0, look = 0){
  for (const s of [-1, 1]) S.part(g, SM([[s * 13, -22], [s * 20, -27], [s * 15, -17]], .6), SKIN, { x:s * 15, y:-22, r:5 }, { flat:true, mat:'skin' });   // pointed ears
  const face = SM([[-12, -42], [-15, -30], [-14, -17], [-9, -6], [0, -2], [9, -6], [14, -17], [15, -30], [12, -42], [0, -45]], .85);
  S.part(g, face, SKIN, { x:-1, y:-25, r:22 }, { mat:'skin' });
  for (const s of [-1, 1]) S.dot(g, E(s * 9.5, -14, 4, 6, s * .2), SKIN.dark, .35);   // hollow cheeks
  // wisps of grey hair under the brim
  for (const s of [-1, 1]) for (const [dx, l] of [[0, 9], [3, 7]]) S.tube(g, SO([[s * (12 + dx), -38], [s * (15 + dx), -32], [s * (14 + dx), -38 + l * 1.4]]), HAIR, 2);
  // sunken eyes: dark sockets, big whites, small amber pupils (one eye larger)
  S.dot(g, E(-6.5, -26, 7.5, 7.8), SKIN.deep, .55); S.dot(g, E(7, -25.5, 6.4, 6.8), SKIN.deep, .55);
  S.eye(g, -6.5, -26, 6, 6.4, { lx:.12 + look, ly:.22, pr:.36, iris:'#d08a2a' }); S.eye(g, 7, -25.5, 4.9, 5.2, { lx:.12 + look, ly:.22, pr:.38, iris:'#d08a2a' });
  S.ln(g, [[-13, -34], [-8, -35.5], [-2, -33]], HAIR, 2.6, .9); S.ln(g, [[3, -33], [8, -34.5], [12.5, -32]], HAIR, 2.4, .9);   // bushy brows
  // mouth: a thin crooked grin with two crooked teeth
  S.dot(g, SM([[-7.5, -10.5], [-2, -9.5 + jaw * .5], [3, -10 + jaw], [8, -11.5], [3, -8 + jaw], [-3, -8 + jaw * .6]], .6), '#2a1418');
  S.dot(g, PL([[-3.5, -10], [-1, -10], [-2, -7.2]]), '#f4ecd0'); S.dot(g, PL([[2.5, -10.2], [5, -10.6], [4, -7.6]]), '#f4ecd0');
  // long droopy nose
  S.part(g, SM([[-1.5, -27], [2.5, -22], [5, -15], [2.5, -12.5], [-2, -14.5]], .7), SKIN, { x:1.5, y:-18, r:7 }, { flat:true, mat:'skin' });
  // stubble
  const R = rng(91); for (let i = 0; i < 9; i++) S.dot(g, E(-6 + R() * 12, -6 + R() * 3.5, .7, .7), SKIN.deep, .5);
}

/** Where the spade is in the dig clip: grip (x, y), angle a, foreshortening k. Shouldered (blade up), flipped high, plunged, levered, back. */
function digSpade(t){
  const K0 = [24, 6, -1.25], K1 = [26, -14, 1.35], K2 = [28, 2, 1.42], K3 = [21, -3, .98];
  const at = (A, B, u) => [lerp(A[0], B[0], u), lerp(A[1], B[1], u), lerp(A[2], B[2], u)];
  if (t < .28){ const u = seg(t, 0, .28); return [...at(K0, K1, u), 1 - .45 * Math.sin(u * Math.PI)]; }
  if (t < .45){ const u = seg(t, .28, .45); return [...at(K1, K2, u), 1]; }
  if (t < .68){ const u = seg(t, .45, .68); return [...at(K2, K3, u), 1]; }
  const u = seg(t, .68, 1); return [...at(K3, K0, u), 1 - .45 * Math.sin(u * Math.PI)];
}

export function graveriser(g, P = {}){
  const w = P.walk, ch = P.chew, dg = P.dig, di = P.die;
  const sw = w == null ? 0 : Math.sin(w * TAU), cs = ch == null ? 0 : Math.sin(ch * TAU);
  // die: a hole opens at its feet (0-.2), it sinks into it (.1-.8), its hat stays on the hole; the lantern drops and gutters out; all fades (.82-1)
  const hole = di == null ? 0 : seg(di, 0, .2), sink = di == null ? 0 : seg(di, .1, .8) * 132, drop = di == null ? 0 : seg(di, .08, .35), fade = di == null ? 0 : seg(di, .82, 1);
  const plunge = dg == null ? 0 : seg(dg, .3, .45) * (1 - seg(dg, .6, .9));
  const bob = w != null ? -Math.abs(sw) * 2.5 : ch != null ? cs * 2.5 + 2 : plunge * 3, rock = w != null ? sw * .04 : ch != null ? cs * .03 : plunge * .05;
  const jaw = ch != null ? Math.abs(cs) * 4 : dg != null ? seg(dg, .4, .5) * (1 - seg(dg, .7, .9)) * 2.5 : 0;
  g.save(); if (fade) g.globalAlpha *= 1 - fade;
  if (di == null) S.shadow(g, 2, 51, 34, 6);
  if (hole){ S.dot(g, E(0, 50, 30 * hole, 8 * hole), '#1a1210', .92); for (const s of [-1, 1]) S.part(g, E(s * 28 * hole, 49, 9 * hole + .1, 4.5 * hole + .1), DIRT, { x:s * 28, y:49, r:9 }, { flat:true, mat:'stone' }); }
  // the spade's pose
  let [gx, gy, ga, gk] = [24, 6, -1.25, 1];
  if (dg != null) [gx, gy, ga, gk] = digSpade(dg);
  if (ch != null){ ga = -1.25 + cs * .3; gy = 6 + cs * 3; }
  if (w != null){ gy = 6 + sw * 1.5; ga = -1.25 + sw * .04; }
  // the lantern hand: swinging on the walk, raised over the hole while it digs
  const lift = dg == null ? 0 : seg(dg, .1, .35) * (1 - seg(dg, .75, 1));
  let lx = -26 - lift * 4, ly = 12 - lift * 14 + (ch != null ? cs * 2 : 0);
  const lsw = w != null ? Math.sin(w * TAU + .9) * .28 : ch != null ? cs * .12 : dg != null ? Math.sin(dg * TAU) * .1 : 0;
  g.save();
  if (di != null){ g.beginPath(); g.rect(-200, -200, 400, 252); g.clip(); g.translate(0, sink); g.rotate(Math.sin(di * TAU * 1.5) * .06 * (1 - di)); }
  // legs: thin trousers, big worn boots
  for (const s of [-1, 1]){
    const lp = w == null ? 0 : w * TAU + (s < 0 ? 0 : Math.PI), dx = w == null ? 0 : Math.cos(lp) * 4, dy = w == null ? 0 : -Math.max(0, Math.sin(lp)) * 5;
    S.tube(g, SO([[s * 7, 26], [s * 8.5 + dx * .5, 38 + dy * .5], [s * 8 + dx, 46 + dy]]), PANTS, 6.5);
    const bx = s * 9 + dx + s * 1.5, by = 48.5 + dy;
    const X = v => bx + s * v;   // the toe points outwards
    S.part(g, SM([[X(-6), by + 2.5], [X(-5), by - 4], [X(3), by - 4.5], [X(8.5), by - .5], [X(8.5), by + 2.5]], .6), BOOT, { x:X(1), y:by, r:8 }, { flat:true, mat:'leather' });
    S.ln(g, [[X(-5.5), by + 2.2], [X(8), by + 2.2]], BOOT, 1.4, .8);
  }
  g.save(); g.translate(0, bob); g.translate(0, 30); g.rotate(rock); g.translate(0, -30);
  // the long coat, tattered at the hem
  const hs = sw * 2;
  const coat = SM([[-14, -16], [-18, -2], [-20, 16], [-22 + hs, 34], [-16 + hs, 30.5], [-11 + hs, 36], [-5 + hs, 31.5], [1 + hs, 37], [7 + hs, 31.5], [13 + hs, 35.5], [18 + hs, 30.5], [22 + hs, 33.5], [20, 15], [18, -2], [14, -16], [5, -20], [-5, -20]], .5);
  S.part(g, coat, COAT, { x:-2, y:6, r:30 }, { mat:'cloth' });
  S.crease(g, SO([[2, -14], [3.5, 8], [1 + hs * .6, 33]]), COAT, 2, .5);
  S.crease(g, SO([[-12, 2], [-13, 18], [-15 + hs * .6, 30]]), COAT, 1.5, .4); S.crease(g, SO([[12, 4], [14, 18], [15 + hs * .6, 29]]), COAT, 1.5, .4);
  for (const y of [-6, 4, 14]) S.rivet(g, 5.2, y, 1.5, pal('#9a8a6a'));
  g.save(); coat(g); g.clip();
  S.part(g, RR(-16, 14, 9, 9, 1.5), COATP, { x:-11.5, y:18.5, r:6 }, { flat:true, mat:'cloth', lw:1 });   // a patch on the coat
  for (const [x1, y1, x2, y2] of [[-15, 15.5, -13, 15.5], [-9, 21.5, -11, 21.5], [-15, 21, -14, 22]]) S.ln(g, [[x1, y1], [x2, y2]], COATP, .7, .6);
  g.restore();
  for (const [x, d] of [[-21 + hs, -1], [-11 + hs, -1], [1 + hs, 1], [13 + hs, 1], [22 + hs, 1]]) S.thread(g, x, 34, d, COAT);
  // the scarf round its neck, one end hanging
  S.part(g, SM([[-13, -18], [-6, -14], [6, -14], [13, -18], [10, -23], [0, -21], [-10, -23]], .7), SCARF, { x:0, y:-18, r:12 }, { flat:true, mat:'cloth' });
  S.part(g, SM([[-9, -17], [-12, -6 + sw], [-8, 2 + sw * 1.5], [-5, -5], [-5, -15]], .7), SCARF, { x:-8, y:-8, r:8 }, { flat:true, mat:'cloth' });
  S.ln(g, [[-11.5, 0 + sw * 1.5], [-11, 3 + sw * 1.5]], SCARF, 1, .6); S.ln(g, [[-8.5, 1 + sw * 1.5], [-8, 4 + sw * 1.5]], SCARF, 1, .6);
  // the lantern arm (its left, our left)
  S.tube(g, SO([[-14, -12], [-24, -1 - lift * 8], [lx, ly - 3]]), COAT, 7);
  S.hand(g, lx, ly, SKIN, Math.PI / 2, 3, 4.2);
  if (di == null) lantern(g, lx, ly + 1, lsw);   // dying, it lets go of it (drawn below)
  // the spade, then the spade arm over it so the hand grips the shaft
  spade(g, gx, gy, ga, gk);
  const ex = (14 + gx) / 2 + 9, ey = (-12 + gy) / 2 + 6;
  S.tube(g, SO([[14, -12], [ex, ey], [gx - 1, gy]]), COAT, 7);
  S.hand(g, gx, gy, SKIN, ga, 3, 4.4);
  // head, then the hat
  g.save(); g.translate(0, -16 + plunge * 2 + (ch != null ? Math.abs(cs) * 2 : 0)); g.rotate(w != null ? -sw * .03 : 0);
  head(g, jaw, dg != null ? .1 * plunge : 0);
  if (di == null){ g.save(); g.translate(1, -40); g.rotate(-.12); hat(g); g.restore(); }
  g.restore();
  g.restore();
  g.restore();
  if (di != null){ g.save(); g.translate(1, Math.min(-56 + sink, 47)); g.rotate(-.12 - seg(di, .55, .75) * .14); hat(g); g.restore(); }   // it sinks with him, then comes to rest on the hole
  if (hole){ S.part(g, SM([[-30 * hole, 50], [-16, 55.5], [0, 57], [16, 55.5], [30 * hole, 50], [16, 53], [0, 54], [-16, 53]], .6), DIRT, { x:0, y:54, r:24 }, { flat:true, mat:'stone' }); }   // the hole's front lip
  if (di != null) lantern(g, lerp(-26, -30, drop), lerp(13, 17, drop), drop * .5, 1 - seg(di, .3, .85));   // the lantern drops beside the hole and gutters out
  // the dig: a mound over the blade tip and clods flung up
  if (dg != null){
    const mound = seg(dg, .33, .46) * (1 - seg(dg, .8, 1));
    if (mound > 0) S.part(g, SM([[40 - 17 * mound, 52], [34, 52 - 7 * mound], [42, 52 - 10 * mound], [50, 52 - 6 * mound], [40 + 17 * mound, 52]], .7), DIRT, { x:41, y:48, r:12 }, { flat:true, mat:'stone' });
    const u = cl01((dg - .52) / .38);
    if (u > 0 && u < 1){ const R = rng(17); for (let i = 0; i < 5; i++){ const vx = (i - 2) * 5 + (R() - .5) * 4, h = 60 + R() * 30, x = 44 + vx * u * 1.6, y = 46 - h * u + h * .9 * u * u, r = 2.4 + R() * 1.6;
      g.save(); g.globalAlpha *= 1 - seg(u, .7, 1); S.part(g, E(x, y, r, r * .85, R() * 3), DIRT, { x, y, r }, { flat:true, mat:'stone', lw:1 }); g.restore(); } }
  }
  g.restore();
}

// ---------- registry ----------
const C = (n, fps, key, once = false) => ({ n, fps, once, pose:t => ({ [key]:t }) });
// r 22, so the feet sit at 21 below the centre (50 x .6 - 9). Tall and thin; the box holds the spade's swing and the clods of the dig.
// dig is 10 frames at 12 fps (engine/nightmare.js plays it for 10 / 12 s); die is 8 frames (the clip effect in render/draw.js plays 8).
export const GRAVERISER = {
  graveriser: { draw:graveriser, scale:.6, dy:-9, box:{ x:-58, y:-80, w:126, h:140 }, clips:{ walk:C(8, 7, 'walk'), chew:C(4, 7, 'chew'), dig:C(10, 12, 'dig', true), die:C(8, 11, 'die', true) }, still:{} },
};
