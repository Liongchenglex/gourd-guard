// ---------- Nightmare witches (nightmare Witchwood), Toy Plastic style: design archive, not wired into the game ----------
// A copy of witch() from src/engine/render/chars/w3.js (with the helpers it uses) plus two nightmare looks picked by pose.variant:
//   undefined  the game's witch, exactly as drawn in w3.js.
//   'ash'      THE ASH CRONE: a hunched, bone-white-haired hag in charcoal rags and a crow-feather shawl, under a tall hat whose tip
//              has wilted over and hangs down, leaning on a bone staff crowned with a horned goat skull. All colour drained to grey
//              (nightmare Witchwood); the only colour is red: her pupils, the skull's eyes, the hex. Ash falls around her.
//   'coven'    THE BLOOD COVEN WITCH: a pale, sharp-featured witch of the blood coven in a crimson cloak with a high vampiric collar,
//              a wide-brimmed hat with two black ram horns curling out of it, long black hair, and a small iron cauldron of boiling blood
//              swinging from her left hand. Her wand is a bone athame with a blood gem. The hex boils the cauldron over.
// pose: { walk, chew, hex } (each 0..1, one at a time) and variant. Same clips as the game entry (walk 8, chew 4, hex 6 once).

import { E, PL, RR, S, SM, SO, mix, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';

// ---- the game's palettes (copied from w3.js) ----
const FACE = pal('#8fbf5a'), FACED = pal('#5f8a38'), HAT = pal('#2f2040'), BAND = pal('#c9584a'), BUCKLE = pal('#e0b04a'), DRESS = pal('#5a3a7a'), CLOAK = pal('#3a2652'), BOOT = pal('#3a2a2e'),
  HAIR = pal('#9a8ab8'), WAND = pal('#8a5a2c'), SPARK = '#d09bff', GREEN = '#8cff5a';

// ---- nightmare palettes ----
// pal() tints shadows purple and rims warm; the drained crone gets a neutral grey mixer like the Fallen Hexwitch.
const gpal = b => ({ base:b, light:mix(b, '#ffffff', .45), dark:mix(b, '#141416', .42), deep:mix(b, '#060608', .68), rim:mix(b, '#ffffff', .6) });
const rpal = b => ({ base:b, light:mix(b, '#ffd0c8', .4), dark:mix(b, '#1a0408', .42), deep:mix(b, '#0a0204', .68), rim:mix(b, '#ffe0d0', .55) });
const RED = '#ff2a3a', REDL = '#ff9a90';
const ASH = { face:gpal('#a2a2a8'), faced:gpal('#5c5c62'), hat:gpal('#232327'), band:gpal('#d8d4cc'), dress:gpal('#38383e'), cloak:gpal('#5c5c62'), shawl:gpal('#18181c'), boot:gpal('#1e1e22'),
  hair:gpal('#e6e2da'), bone:gpal('#dcd6ca'), skull:gpal('#ece8de'), twine:gpal('#46423e') };
const COV = { face:pal('#f0dcd6'), faced:pal('#c49a96'), hat:rpal('#1c0a10'), band:rpal('#b0101e'), buckle:pal('#e0b04a'), dress:rpal('#22080e'), cloak:rpal('#9a1022'), lining:rpal('#140608'),
  boot:rpal('#1a0a0e'), hair:rpal('#1e1018'), horn:rpal('#2c1a18'), pot:gpal('#34343a'), blood:'#c8101e', bloodL:'#ff5a5a', bone:pal('#e6dccb'), lace:rpal('#d8b060') };

// ---------- the game's helpers (copied from w3.js) ----------
function witchHat(g, x, y, w, tip = 0, band = BAND){
  const h = w * 2.3;
  const cone = SM([[x - w * .58, y + 1], [x - w * .4, y - h * .42], [x - w * .12 + tip * .4, y - h * .8], [x + w * .12 + tip, y - h - 3], [x + w * .3 + tip * .7, y - h * .8], [x + w * .33, y - h * .42], [x + w * .58, y + 1]], .8);
  S.part(g, cone, HAT, { x, y:y - h * .3, r:w * .95 }, { mat:'cloth', hx:x - w * .18, hy:y - h * .45 });
  S.crease(g, SO([[x - w * .22, y - h * .12], [x - w * .12, y - h * .5], [x + tip * .3, y - h * .78]]), HAT, 2, .4);
  S.part(g, SM([[x - w * .5, y - 1], [x + w * .5, y - 1], [x + w * .38, y - h * .24], [x - w * .42, y - h * .24]], .5), band, { x, y:y - h * .12, r:w * .5 }, { flat:true, mat:'cloth' });
  S.part(g, RR(x - w * .12, y - h * .2, w * .24, h * .15, 2), BUCKLE, { x, y:y - h * .12, r:w * .14 }, { flat:true, mat:'metal' });
  S.part(g, E(x, y, w, w * .27), HAT, { x, y, r:w }, { flat:true, mat:'cloth', hx:x - w * .3, hy:y - w * .08 });
}
function witchFace(g, x, y, r, o = {}){
  g.save(); g.translate(x, y); g.scale(r / 17, r / 17);
  const jaw = (o.jaw ?? 0) * 5;
  for (const s of [-1, 1]) S.tube(g, SO([[s * 13, -6], [s * 21, 8 + (o.hair ?? 0) * s], [s * 19, 24]]), HAIR, 4.5);
  const head = SM([[-16, -6], [-17, 6], [-10, 14], [0, 17], [10, 14], [17, 6], [16, -6], [8, -16], [-8, -16]]);
  S.part(g, head, FACE, { x:0, y:0, r:17 }, { mat:'skin' });
  S.ln(g, [[-11, -8], [-4, -6]], FACED, 2, .7); S.ln(g, [[11, -8], [4, -6]], FACED, 2, .7);
  const iris = o.glow ? GREEN : '#e0b020';
  S.eye(g, -6.5, -1, 5.5, 6, { lx:.2, ly:.1, pr:.42, iris, lid:.28, tilt:-.35, lidCol:FACE.base, lidDeep:FACE.deep });
  S.eye(g, 6.5, -1, 5.5, 6, { lx:.2, ly:.1, pr:.42, iris, lid:.28, tilt:.35, lidCol:FACE.base, lidDeep:FACE.deep });
  if (o.glow){ g.save(); g.globalAlpha *= o.glow; S.glow(g, -5.5, -.5, 2.6, GREEN); S.glow(g, 7.5, -.5, 2.6, GREEN); g.restore(); }
  S.part(g, SM([[-2, -1], [3, 3], [8, 11], [3, 14], [-3, 8]], .7), FACE, { x:2, y:6, r:7 }, { flat:true, mat:'skin' });
  S.part(g, E(-9, 7, 2.2, 2), FACED, { x:-9, y:7, r:2.2 }, { flat:true, noEdge:true });
  if (jaw > 0) S.dot(g, SM([[-8, 9], [0, 10 + jaw], [8, 8], [0, 8]], .8), '#2a1020');
  S.stroke(g, SO([[-9, 8], [-4, 12 + jaw * .4], [4, 12 + jaw * .4], [9, 7]]), FACE, 1.8);
  S.dot(g, PL([[-3, 11.5 + jaw * .3], [0, 11.5 + jaw * .3], [-1.5, 16 + jaw * .3]]), '#fff');
  g.restore();
}
function wand(g, x1, y1, x2, y2, spark){
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny) || 1;
  S.tube(g, SO([[x1, y1], [mx + nx / L * 3, my + ny / L * 3], [x2, y2]]), WAND, 3.2);
  S.part(g, E(x2, y2, 2.4, 2.4), WAND, { x:x2, y:y2, r:2.4 }, { flat:true, noEdge:true });
  if (spark > 0){ g.save(); g.globalAlpha *= Math.min(1, spark * 1.5); S.glow(g, x2, y2, 3 + spark * 4, SPARK);
    if (spark > .4){ const R = rng(31); g.strokeStyle = rgba('#f0e0ff', .9); g.lineWidth = 1.4; for (let i = 0; i < 6; i++){ const a = i * TAU / 6 + R() * .5, d = 7 + spark * 12; g.beginPath(); g.moveTo(x2 + Math.cos(a) * 5, y2 + Math.sin(a) * 5); g.lineTo(x2 + Math.cos(a) * d, y2 + Math.sin(a) * d); g.stroke(); } }
    g.restore(); }
}

// ---------- nightmare helpers ----------
/** Spark burst at (x, y) in colour col (light rays in lcol), strength s 0..1. */
function burst(g, x, y, s, col, lcol, seed = 31){
  if (s <= 0) return;
  g.save(); g.globalAlpha *= Math.min(1, s * 1.5); S.glow(g, x, y, 3 + s * 4, col);
  if (s > .4){ const R = rng(seed); g.strokeStyle = rgba(lcol, .9); g.lineWidth = 1.4; for (let i = 0; i < 6; i++){ const a = i * TAU / 6 + R() * .5, d = 7 + s * 12; g.beginPath(); g.moveTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); g.stroke(); } }
  g.restore();
}
/** Long gnarled hand: four bony fingers with long claws fanning around dir. */
function crookHand(g, x, y, c, dir, sp = .4, len = 11, claw = '#d8d2c6'){
  for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * (.22 + sp * .38); const kx = x + Math.cos(a) * len * .55, ky = y + Math.sin(a) * len * .55;
    S.tube(g, SO([[x, y], [kx, ky], [kx + Math.cos(a + .6) * len * .45, ky + Math.sin(a + .6) * len * .45]]), c, 2.6); S.claw(g, kx + Math.cos(a + .6) * len * .45, ky + Math.sin(a + .6) * len * .45, a + .6, 3.2, claw); }
  S.part(g, E(x, y, 4.8, 4.4), c, { x, y, r:4.8 }, { flat:true, mat:'skin' });
}

/** Crone face: narrow, long pointed chin, a long hooked nose with a wart, milky eyes with red pinpoint pupils, deep wrinkles,
 *  one snaggle tooth, long straggly bone-white hair. o.jaw, o.glow (eye glow 0..1), o.hair (sway). */
function croneFace(g, x, y, r, o = {}){
  const C = ASH; g.save(); g.translate(x, y); g.scale(r / 17, r / 17);
  const jaw = (o.jaw ?? 0) * 5, hs = o.hair ?? 0;
  // straggly hair falling past the shoulders, behind the head
  for (const s of [-1, 1]) for (const [a, b, c2, w] of [[[13, -10], [22, 10], [25, 32], 3.6], [[15, -4], [27, 16], [31, 26], 2]]){
    S.tube(g, SO([[s * a[0], a[1]], [s * b[0] + hs * s * .5, b[1]], [s * c2[0] + hs * s, c2[1]]]), C.hair, w); }
  const head = SM([[-15, -7], [-16, 4], [-11, 12], [-4, 19], [0, 22], [4, 19], [11, 12], [16, 4], [15, -7], [8, -16], [-8, -16]]);
  S.part(g, head, C.face, { x:0, y:1, r:18 }, { mat:'skin' });
  S.contact(g, head, -11, 8, 6, 5, .35); S.contact(g, head, 11, 8, 6, 5, .35); S.contact(g, head, -6.5, -2, 6, 5, .4); S.contact(g, head, 6.5, -2, 6, 5, .4);
  // wrinkles: brow furrows and crow's feet
  for (const s of [-1, 1]){ S.ln(g, [[s * 12, -9], [s * 3.5, -5.5]], C.faced, 2.2, .8); S.ln(g, [[s * 13, 1], [s * 15.5, 3]], C.faced, .9, .55); S.ln(g, [[s * 12.5, 3.5], [s * 14.5, 6.5]], C.faced, .9, .5); }
  S.ln(g, [[-5, -12.5], [5, -12.5]], C.faced, .9, .45); S.ln(g, [[-4, -10.5], [4, -10.5]], C.faced, .9, .4);
  // milky eyes: grey whites, heavy lids, tiny red pupils
  const eo = { lx:.15, ly:.15, pr:.28, pupil:'#7a0a14', lid:.4, lidCol:C.face.base, lidDeep:C.face.deep };
  S.eye(g, -6.5, -1, 5, 5.5, { ...eo, tilt:-.3 }); S.eye(g, 6.5, -1, 5, 5.5, { ...eo, tilt:.3 });
  for (const s of [-1, 1]){ g.save(); ell0(g, s * 6.5, -1, 5, 5.5); g.clip(); g.fillStyle = 'rgba(150,150,160,.35)'; g.fillRect(s * 6.5 - 5, -6.5, 10, 11); g.restore(); }
  const gl = .35 + (o.glow ?? 0) * .65; g.save(); g.globalAlpha *= gl; S.glow(g, -5.7, 0, 1.4 + (o.glow ?? 0) * 1.4, RED); S.glow(g, 7.3, 0, 1.4 + (o.glow ?? 0) * 1.4, RED); g.restore();
  // a long hooked nose hanging over the mouth, with a wart
  S.part(g, SM([[-2.5, -2], [3, 2], [9, 11], [9, 17], [5, 16], [3, 12], [-3, 8]], .7), C.face, { x:3, y:7, r:8 }, { flat:true, mat:'skin' });
  S.part(g, E(5.5, 6, 1.8, 1.7), C.faced, { x:5.5, y:6, r:1.8 }, { flat:true, noEdge:true });
  S.part(g, E(-9, 9, 2, 1.8), C.faced, { x:-9, y:9, r:2 }, { flat:true, noEdge:true });
  if (jaw > 0) S.dot(g, SM([[-7, 13], [-1, 14 + jaw], [5, 13], [-1, 12.5]], .8), '#0a0608');
  S.stroke(g, SO([[-8, 12], [-4, 15 + jaw * .4], [2, 15 + jaw * .4], [5, 13]]), C.face, 1.7);
  S.dot(g, PL([[-4.5, 14.5 + jaw * .3], [-2, 14 + jaw * .3], [-3.5, 18.5 + jaw * .3]]), '#d8d4c8');
  g.restore();
}
const ell0 = (g, x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); };

/** Coven face: pale and sharp, a widow's peak of long black hair, arched brows, crimson eyes, red lips with two little fangs,
 *  a blood sigil on the brow. o.jaw, o.glow, o.hair. */
function covenFace(g, x, y, r, o = {}){
  const C = COV; g.save(); g.translate(x, y); g.scale(r / 17, r / 17);
  const jaw = (o.jaw ?? 0) * 5, hs = o.hair ?? 0;
  // long straight black hair falling behind, down to the waist
  const hair = SM([[-14, -14], [-20, 0], [-22, 20 + hs], [-24, 40 + hs * 1.5, 1], [-14, 34], [-6, 18], [6, 18], [14, 34], [24, 40 - hs * 1.5, 1], [22, 20 - hs], [20, 0], [14, -14], [0, -18]], .8);
  S.part(g, hair, C.hair, { x:0, y:6, r:24 }, { mat:'cloth', hx:-12, hy:-6 });
  for (const s of [-1, 1]) S.crease(g, SO([[s * 15, -2], [s * 18, 18], [s * 20, 34]]), C.hair, 1.4, .45);
  const head = SM([[-15, -8], [-15, 4], [-10, 12], [-3, 17], [0, 18], [3, 17], [10, 12], [15, 4], [15, -8], [8, -16], [-8, -16]]);
  S.part(g, head, C.face, { x:0, y:0, r:17 }, { mat:'skin' });
  S.part(g, SM([[-16, -6], [-14, -15], [-6, -19], [0, -11, 1], [6, -19], [14, -15], [16, -6], [12, -12], [0, -10], [-12, -12]], .8), C.hair, { x:0, y:-14, r:14 }, { flat:true, mat:'cloth' });   // the widow's peak
  for (const s of [-1, 1]) S.ln(g, [[s * 11.5, -7], [s * 7.5, -8.4], [s * 3.5, -6.4]], C.hair, 1.8, .9);
  const iris = '#d0101e';
  S.eye(g, -6.5, -1, 5.5, 6.2, { lx:.15, ly:.12, pr:.42, iris, lid:.24, tilt:-.4, lidCol:C.face.base, lidDeep:C.hair.base });
  S.eye(g, 6.5, -1, 5.5, 6.2, { lx:.15, ly:.12, pr:.42, iris, lid:.24, tilt:.4, lidCol:C.face.base, lidDeep:C.hair.base });
  for (const s of [-1, 1]){ S.ln(g, [[s * 11.5, -3.2], [s * 13.8, -5]], C.hair, 1.2, .9); S.ln(g, [[s * 11, -4.6], [s * 12.6, -7]], C.hair, 1, .9); }   // lashes
  if (o.glow){ g.save(); g.globalAlpha *= o.glow; S.glow(g, -5.6, -.3, 2.6, RED); S.glow(g, 7.4, -.3, 2.6, RED); g.restore(); }
  S.part(g, SM([[-1, 0], [2.5, 3], [4, 8], [1, 9], [-1.5, 6]], .7), C.face, { x:1, y:5, r:5 }, { flat:true, noEdge:true, mat:'skin' });
  S.ln(g, [[1, 9], [3.8, 8.2]], C.faced, 1, .6);
  // lips and fangs
  if (jaw > 0) S.dot(g, SM([[-6, 12], [0, 13 + jaw], [6, 12], [0, 11.5]], .8), '#1a0408');
  S.part(g, SM([[-6.5, 12], [-3, 10.6], [0, 11.4], [3, 10.6], [6.5, 12], [3, 13.6 + jaw * .5], [-3, 13.6 + jaw * .5]], .7), pal('#b81424'), { x:0, y:12, r:6 }, { flat:true, lw:1 });
  for (const s of [-1, 1]) S.dot(g, PL([[s * 2, 12.6 + jaw * .3], [s * 3.8, 12.6 + jaw * .3], [s * 2.9, 16 + jaw * .4]]), '#fff');
  // blood sigil on the brow
  g.save(); g.strokeStyle = rgba('#d0101e', .85 + (o.glow ?? 0) * .15); g.lineWidth = 1.1; g.lineCap = 'round';
  if (o.glow){ g.shadowColor = RED; g.shadowBlur = 4 * o.glow; }
  g.beginPath(); g.moveTo(0, -13.5); g.lineTo(0, -8.5); g.moveTo(-2.2, -11.8); g.lineTo(2.2, -11.8); g.stroke(); g.restore();
  S.blush(g, 0, 6, .5);
  g.restore();
}

/** Crone hat: a tall ragged cone whose tip has wilted over and hangs down to her right, a stitched patch and a torn hole,
 *  a band of knotted twine strung with finger bones, and a ragged brim. `dr` sways the hanging tip. */
function croneHat(g, x, y, w, dr = 0){
  const C = ASH, h = w * 2.1;
  const cone = SM([[x - w * .6, y + 1], [x - w * .42, y - h * .4], [x - w * .3, y - h * .78], [x - w * .1, y - h * .98], [x + w * .2, y - h * 1.02], [x + w * .5 + dr * .3, y - h * .88], [x + w * .64 + dr, y - h * .62, 1], [x + w * .46 + dr * .7, y - h * .7], [x + w * .26, y - h * .7], [x + w * .32, y - h * .42], [x + w * .58, y + 1]], .8);
  S.part(g, cone, C.hat, { x, y:y - h * .35, r:w * .95 }, { mat:'cloth', hx:x - w * .2, hy:y - h * .5 });
  S.crease(g, SO([[x - w * .3, y - h * .12], [x - w * .22, y - h * .5], [x - w * .02, y - h * .86]]), C.hat, 2, .45); S.crease(g, SO([[x + w * .12, y - h * .74], [x + w * .2, y - h * .9]]), C.hat, 2, .55);
  g.save(); cone(g); g.clip();
  // a stitched patch and a torn hole
  S.part(g, PL([[x + w * .02, y - h * .5], [x + w * .26, y - h * .54], [x + w * .24, y - h * .32], [x + w * .04, y - h * .3]]), gpal('#3a3a40'), { x:x + w * .14, y:y - h * .42, r:w * .2 }, { flat:true, mat:'cloth', lw:1 });
  g.strokeStyle = 'rgba(220,216,206,.75)'; g.lineWidth = .8; for (let i = 0; i < 4; i++){ const yy = y - h * (.5 - i * .055); g.beginPath(); g.moveTo(x + w * .01, yy - 1); g.lineTo(x + w * .06, yy + 1); g.stroke(); }
  S.dot(g, SM([[x - w * .28, y - h * .62], [x - w * .2, y - h * .68], [x - w * .14, y - h * .6], [x - w * .2, y - h * .55]], .7), '#060608');
  g.restore();
  S.thread(g, x + w * .64 + dr, y - h * .62, 1, C.hat);
  // band of twine with finger bones dangling
  S.part(g, SM([[x - w * .52, y - 1], [x + w * .52, y - 1], [x + w * .42, y - h * .16], [x - w * .46, y - h * .16]], .5), C.twine, { x, y:y - h * .08, r:w * .5 }, { flat:true, mat:'leather' });
  for (const [q, l] of [[-.32, 7], [-.12, 9], [.1, 6], [.3, 8]]){ const bx = x + w * q, by = y - h * .05; S.ln(g, [[bx, by], [bx + .5, by + 3]], C.twine, 1, .9);
    S.part(g, RR(bx - 1.2, by + 2.5, 2.4, l, 1.2), C.bone, { x:bx, y:by + 2.5 + l / 2, r:l / 2 }, { flat:true, mat:'bone', lw:.8 }); S.part(g, E(bx, by + 2.5 + l, 1.7, 1.4), C.bone, { x:bx, y:by + 2.5 + l, r:1.7 }, { flat:true, noEdge:true }); }
  // ragged brim
  const brim = SM([[x - w, y], [x - w * .8, y - w * .24], [x, y - w * .3], [x + w * .8, y - w * .24], [x + w, y], [x + w * .82, y + w * .2, 1], [x + w * .66, y + w * .14, 1], [x + w * .5, y + w * .28, 1], [x + w * .28, y + w * .18, 1], [x + w * .06, y + w * .3, 1], [x - w * .18, y + w * .2, 1], [x - w * .4, y + w * .3, 1], [x - w * .6, y + w * .16, 1], [x - w * .84, y + w * .22, 1]], .6);
  S.part(g, brim, C.hat, { x, y, r:w }, { flat:true, mat:'cloth', hx:x - w * .3, hy:y - w * .08 });
  for (const [q, s] of [[-.84, -1], [.82, 1], [.5, 1]]) S.thread(g, x + w * q, y + w * .2, s, C.hat);
}

/** Coven hat: a shorter crooked cone over a very wide brim, two black ram horns curling out of the cone, a crimson band with a gold buckle. */
function covenHat(g, x, y, w, tip = 0){
  const C = COV, h = w * 1.7;
  // ram horns, behind the brim edge but in front of the cone: drawn after the cone below
  const cone = SM([[x - w * .5, y + 1], [x - w * .36, y - h * .42], [x - w * .1 + tip * .4, y - h * .8], [x + w * .1 + tip, y - h - 3], [x + w * .28 + tip * .7, y - h * .8], [x + w * .3, y - h * .42], [x + w * .5, y + 1]], .8);
  S.part(g, cone, C.hat, { x, y:y - h * .3, r:w * .8 }, { mat:'cloth', hx:x - w * .16, hy:y - h * .45 });
  S.crease(g, SO([[x - w * .2, y - h * .12], [x - w * .1, y - h * .5], [x + tip * .3, y - h * .78]]), C.hat, 2, .45);
  for (const s of [-1, 1]){   // horns: thick at the cone, curling out, back and down, tapering in three runs, with growth rings
    const hx0 = x + s * w * .3, hy0 = y - h * .42;
    const pts = [[hx0, hy0], [hx0 + s * 10, hy0 - 9], [hx0 + s * 20, hy0 - 6], [hx0 + s * 23, hy0 + 3], [hx0 + s * 18, hy0 + 8], [hx0 + s * 14, hy0 + 4]];
    S.tube(g, SO(pts.slice(0, 3)), C.horn, 7); S.tube(g, SO(pts.slice(1, 5)), C.horn, 5); S.tube(g, SO(pts.slice(3)), C.horn, 3);
    g.strokeStyle = rgba(C.horn.light, .45); g.lineWidth = .9; for (const [a, b] of [[pts[1], -1], [pts[2], 1]]){ g.beginPath(); g.moveTo(a[0] - 2.5, a[1] - 2.5 * b); g.lineTo(a[0] + 2.5, a[1] + 2.5 * b); g.stroke(); } }
  S.part(g, SM([[x - w * .44, y - 1], [x + w * .44, y - 1], [x + w * .34, y - h * .26], [x - w * .38, y - h * .26]], .5), C.band, { x, y:y - h * .12, r:w * .45 }, { flat:true, mat:'cloth' });
  S.part(g, RR(x - w * .1, y - h * .22, w * .2, h * .17, 2), C.buckle, { x, y:y - h * .13, r:w * .12 }, { flat:true, mat:'metal' });
  S.glow(g, x, y - h * .13, 1.6, RED);
  const brim = SM([[x - w, y + 1], [x - w * .7, y - w * .2], [x, y - w * .24], [x + w * .7, y - w * .2], [x + w, y + 1], [x + w * .6, y + w * .2], [x, y + w * .24], [x - w * .6, y + w * .2]], .8);
  S.part(g, brim, C.hat, { x, y, r:w }, { flat:true, mat:'cloth', hx:x - w * .3, hy:y - w * .08 });
  S.crease(g, SO([[x - w * .9, y + 2], [x - w * .5, y + w * .16], [x, y + w * .2], [x + w * .5, y + w * .16], [x + w * .9, y + 2]]), C.hat, 1.2, .35);
}

/** Bone staff from the ground at (x, y0) to the top (x, y1), gnarled, crowned with a horned goat skull with red eyes, bone charms
 *  hanging under it. eye = glow of the skull's eyes (0..1), sw = charm sway. */
function skullStaff(g, x, y0, y1, eye, sw = 0){
  const C = ASH;
  S.tube(g, SO([[x + 1, y0], [x - 1.5, (y0 + y1) * .5 + 6], [x + 1, y1 + 10], [x, y1]]), C.bone, 4.6);
  for (const yy of [y1 + 26, y1 + 52, y1 + 80]) if (yy < y0 - 4){ S.part(g, E(x, yy, 3.6, 2.2), C.bone, { x, y:yy, r:3.6 }, { flat:true, mat:'bone', lw:1 }); }
  // charms on twine: a finger bone and a little bird skull
  S.ln(g, [[x - 2, y1 + 8], [x - 7 + sw, y1 + 20]], C.twine, 1, .9); S.part(g, RR(x - 8.2 + sw, y1 + 19, 2.4, 8, 1.2), C.bone, { x:x - 7 + sw, y:y1 + 23, r:4 }, { flat:true, mat:'bone', lw:.8 });
  S.ln(g, [[x + 2, y1 + 8], [x + 6 + sw * .7, y1 + 16]], C.twine, 1, .9); S.part(g, E(x + 6.5 + sw * .7, y1 + 18, 2.6, 2.2), C.bone, { x:x + 6.5, y:y1 + 18, r:2.6 }, { flat:true, mat:'bone', lw:.8 });
  S.dot(g, PL([[x + 6 + sw * .7, y1 + 19.5], [x + 8.5 + sw * .7, y1 + 19.5], [x + 7 + sw * .7, y1 + 24]]), C.bone.dark);
  // horns curling back from the skull, then the skull: wide brow, long snout, dark sockets
  const sy = y1 - 2;
  for (const s of [-1, 1]){ const pts = [[x + s * 5, sy - 5], [x + s * 13, sy - 11], [x + s * 18, sy - 4], [x + s * 15, sy + 2], [x + s * 11, sy]];
    S.tube(g, SO(pts.slice(0, 3)), C.bone, 4.2); S.tube(g, SO(pts.slice(2)), C.bone, 2.6); }
  const skull = SM([[x - 7, sy - 6], [x - 8, sy + 1], [x - 4, sy + 6], [x - 3, sy + 12], [x, sy + 14], [x + 3, sy + 12], [x + 4, sy + 6], [x + 8, sy + 1], [x + 7, sy - 6], [x, sy - 9]], .8);
  S.part(g, skull, C.skull, { x, y:sy + 1, r:9 }, { mat:'bone', hx:x - 3, hy:sy - 5 });
  for (const s of [-1, 1]) S.dot(g, SM([[x + s * 1.5, sy - 2], [x + s * 6, sy - 3], [x + s * 5.5, sy + 2.5], [x + s * 2, sy + 2]], .7), '#0a0608');
  S.dot(g, E(x - 1, sy + 10, .9, 1.4), '#0a0608'); S.dot(g, E(x + 1, sy + 10, .9, 1.4), '#0a0608');
  g.save(); g.globalAlpha *= .45 + eye * .55; S.glow(g, x - 3.6, sy - .2, 1.3 + eye * 1.6, RED); S.glow(g, x + 3.6, sy - .2, 1.3 + eye * 1.6, RED); g.restore();
  if (eye > .2){   // ash and red smoke curling up off the skull
    g.save(); g.globalAlpha *= Math.min(1, (eye - .2) * 1.6); const R = rng(57);
    for (let i = 0; i < 7; i++){ const a = -Math.PI / 2 + (R() - .5) * 2.4, d = 8 + R() * 10 + eye * 8, rr = 1.6 + R() * 2.4; S.dot(g, E(x + Math.cos(a) * d, sy + Math.sin(a) * d, rr, rr), i % 3 ? '#6a6a72' : RED, .8); }
    g.restore(); }
}

/** Small iron cauldron hanging from a bail at (x, y) (the bail top), boiling blood. boil 0..1 = the hex boil-over. */
function bloodPot(g, x, y, boil, bub){
  const C = COV;
  S.stroke(g, SO([[x - 8, y + 9], [x, y], [x + 8, y + 9]]), C.pot, 1.4, .9);
  const pot = SM([[x - 10, y + 8], [x + 10, y + 8], [x + 12, y + 16], [x + 7, y + 23], [x - 7, y + 23], [x - 12, y + 16]], .8);
  S.part(g, pot, C.pot, { x, y:y + 15, r:11 }, { mat:'metal' }); S.tube(g, SO([[x - 11, y + 9], [x + 11, y + 9]]), C.pot, 2.6);
  for (const s of [-1, 1]) S.part(g, E(x + s * 6, y + 24, 2.2, 1.6), C.pot, { x:x + s * 6, y:y + 24, r:2.2 }, { flat:true, noEdge:true });
  g.save(); g.shadowColor = RED; g.shadowBlur = 5 + boil * 6; S.dot(g, E(x, y + 8, 9, 2.4), C.blood, 1); g.restore();
  S.dot(g, E(x - 2, y + 7.5, 4, 1), C.bloodL, .6);
  for (const [bx, by] of [[-4, 6], [3, 4]]) S.dot(g, E(x + bx, y + by - bub * 2, 1.5, 1.5), C.bloodL, .85);
  if (boil > 0){   // boiling over: red flame tongues and drips running down the iron
    g.save(); g.globalAlpha *= Math.min(1, boil * 1.4); g.shadowColor = RED; g.shadowBlur = 8; const l = boil * 10;
    S.dot(g, SM([[x - 9, y + 8], [x - 10, y - 2 - l * .6, 1], [x - 5, y + 2], [x - 2, y - 8 - l, 1], [x + 1, y + 2], [x + 5, y - 5 - l * .8, 1], [x + 7, y + 3], [x + 10, y - l * .4, 1], [x + 9, y + 8]], .6), '#b0101e', .9);
    S.dot(g, SM([[x - 5, y + 7], [x - 4, y - 2 - l * .5, 1], [x, y + 3], [x + 2, y - 4 - l * .6, 1], [x + 5, y + 7]], .6), '#ff7060', .9);
    for (const [dx, dy, dl] of [[-10, 10, 6 + boil * 4], [9, 11, 4 + boil * 3], [-3, 9, 5]]){ S.dot(g, RR(x + dx - 1.1, y + dy, 2.2, dl, 1.1), C.blood, .9); S.dot(g, E(x + dx, y + dy + dl, 1.6, 1.8), C.blood, .95); }
    g.restore(); }
}

// ---------- the witch ----------
/** A small witch on foot: pointed hat, cloak, crooked wand. P.hex (once) is the wand flourish. P.variant: undefined | 'ash' | 'coven'. */
export function witch(g, P = {}){
  const V = P.variant;
  if (V === 'ash') return ashCrone(g, P);
  if (V === 'coven') return covenWitch(g, P);
  const w = P.walk, ch = P.chew, hx = P.hex, sw = w == null ? 0 : Math.sin(w * TAU);
  const bob = w != null ? -Math.abs(sw) * 2.5 : ch != null ? Math.sin(ch * TAU) * 2.5 : 0, lean = ch == null ? 0 : .5 + Math.sin(ch * TAU) * .5, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  const raise = hx == null ? 0 : Math.sin(Math.min(1, hx * 1.4) * Math.PI) ** .7, spark = hx == null ? 0 : Math.max(0, Math.sin(hx * Math.PI)), back = raise * .1;
  S.shadow(g, 0, 50, 26, 5);
  for (const s of [-1, 1]){ const ph = w == null ? null : w * TAU + (s < 0 ? 0 : Math.PI), lift = ph == null ? 0 : Math.max(0, Math.sin(ph)) * 6, dx = ph == null ? 0 : Math.cos(ph) * 4;
    S.tube(g, SO([[s * 7, 30], [s * 8 + dx, 42 - lift]]), BOOT, 6); S.part(g, SM([[s * 3 + dx, 40 - lift], [s * 14 + dx, 40 - lift], [s * 18 + dx, 48 - lift], [s * 8 + dx, 50 - lift], [s * 2 + dx, 46 - lift]], .6), BOOT, { x:s * 10 + dx, y:45 - lift, r:8 }, { flat:true, mat:'leather' }); }
  g.save(); g.translate(0, bob); g.rotate(-back); g.translate(0, lean * 3);
  const cloak = SM([[-14, -8], [-24, 10], [-28, 36, 1], [-18, 30, 1], [-10, 38, 1], [0, 32, 1], [10, 38, 1], [18, 30, 1], [28, 36, 1], [24, 10], [14, -8]], .8);
  S.part(g, cloak, CLOAK, { x:0, y:14, r:28 }, { mat:'cloth', hx:-10, hy:0 }); for (const [x, y] of [[-28, 36], [-10, 38], [10, 38], [28, 36]]) S.thread(g, x, y, 1, CLOAK);
  const dress = SM([[-9, -6], [-12, 10], [-16, 36], [0, 39], [16, 36], [12, 10], [9, -6]], .8);
  S.part(g, dress, DRESS, { x:0, y:16, r:18 }, { mat:'cloth' }); S.crease(g, SO([[-5, 4], [-7, 34]]), DRESS, 1.6, .4); S.crease(g, SO([[5, 4], [8, 34]]), DRESS, 1.6, .4);
  S.tube(g, SO([[-11, 6], [11, 6]]), BOOT, 3); S.part(g, RR(-3, 3, 6, 6, 1), BUCKLE, { x:0, y:6, r:3 }, { flat:true, mat:'metal' });
  const swing = w == null ? 0 : sw * .3;
  g.save(); g.translate(-9, -2); g.rotate(swing); S.tube(g, SO([[0, 0], [-8, 10], [-10, 20]]), CLOAK, 6); S.hand(g, -11, 23, FACE, Math.PI * .6, 3, 4); g.restore();
  const aa = .5 - raise * 1.5 + (w == null ? 0 : -sw * .2);
  g.save(); g.translate(10, -2); g.rotate(aa); S.tube(g, SO([[0, 0], [10, 8], [18, 12]]), CLOAK, 6); S.hand(g, 20, 13, FACE, 0, 3, 4);
  g.save(); g.translate(20, 13); g.rotate(.1 - raise * 1.0); wand(g, -3, 4, 5, -24, spark); g.restore(); g.restore();
  witchFace(g, 0, -22, 15, { jaw, glow:spark * .8, hair:sw * 2 });
  S.contact(g, dress, 0, -8, 10, 4, .45);
  witchHat(g, 1, -37, 24, 6 + (w == null ? 0 : sw * 2) - raise * 4);
  g.restore();
}

// ---------- the Ash Crone ----------
function ashCrone(g, P){
  const C = ASH, w = P.walk, ch = P.chew, hx = P.hex, sw = w == null ? 0 : Math.sin(w * TAU), cw = w == null ? 0 : Math.cos(w * TAU);
  // a slow, heavy shuffle: smaller bob, more sway
  const bob = w != null ? -Math.abs(sw) * 1.8 : ch != null ? Math.sin(ch * TAU) * 2.5 : 0, lean = ch == null ? 0 : .5 + Math.sin(ch * TAU) * .5, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  const raise = hx == null ? 0 : Math.sin(Math.min(1, hx * 1.4) * Math.PI) ** .7, spark = hx == null ? 0 : Math.max(0, Math.sin(hx * Math.PI));
  const sway = w == null ? 0 : sw * .04;
  // falling ash, behind her (stable flakes that drift with the clip phase)
  { const R = rng(73), t = w ?? ch ?? hx ?? 0; g.save();
    for (let i = 0; i < 6; i++){ const x0 = -42 + R() * 86, y0 = -90 + R() * 130, y = ((y0 + 90 + t * 40) % 130) - 90, x = x0 + Math.sin(t * TAU + i) * 3, rr = .9 + R() * 1.4; S.dot(g, E(x, y, rr * 1.4, rr), i % 2 ? '#8a8a92' : '#c8c8cc', .55); }
    g.restore(); }
  S.shadow(g, 2, 50, 28, 5);
  // the staff stands in her right hand; its foot stays on the ground except when she lifts it in the hex
  const stX = 33 + sw * 2, stTop = -64 - raise * 12, stFoot = 49 - raise * 12, tiltS = -raise * .18 + sway;
  // bony feet in ragged wraps, shuffling
  for (const s of [-1, 1]){ const ph = w == null ? null : w * TAU + (s < 0 ? 0 : Math.PI), lift = ph == null ? 0 : Math.max(0, Math.sin(ph)) * 4, dx = ph == null ? 0 : Math.cos(ph) * 3;
    S.tube(g, SO([[s * 6, 30], [s * 7 + dx, 42 - lift]]), C.face, 4.5);
    S.part(g, SM([[s * 2 + dx, 41 - lift], [s * 12 + dx, 41 - lift], [s * 17 + dx, 47 - lift], [s * 18 + dx, 44 - lift, 1], [s * 19 + dx, 49 - lift], [s * 7 + dx, 50 - lift], [s * 1 + dx, 47 - lift]], .6), C.boot, { x:s * 9 + dx, y:46 - lift, r:8 }, { flat:true, mat:'cloth' }); }
  g.save(); g.translate(0, bob); g.rotate(sway); g.translate(0, lean * 3);
  // staff behind the body
  g.save(); g.translate(stX, stFoot); g.rotate(tiltS); skullStaff(g, 0, 0, stTop - stFoot, spark, cw * 2); g.restore();
  // long ragged cloak to the ground, wide at the hem
  const cloak = SM([[-15, -12], [-26, 8], [-32, 30], [-33, 44, 1], [-24, 38, 1], [-18, 46, 1], [-10, 39, 1], [-3, 47, 1], [4, 40, 1], [11, 47, 1], [18, 39, 1], [25, 45, 1], [33, 40, 1], [27, 8], [15, -12]], .8);
  S.part(g, cloak, C.cloak, { x:0, y:14, r:30 }, { mat:'cloth', hx:-12, hy:0 });
  for (const [x, y, s] of [[-33, 44, -1], [-18, 46, -1], [-3, 47, 1], [11, 47, 1], [25, 45, 1]]) S.thread(g, x, y, s, C.cloak);
  g.save(); cloak(g); g.clip(); for (const [x, y, r] of [[-20, 28, 3], [16, 22, 2.4]]) S.dot(g, E(x, y, r, r * .8), '#08080a', .9); g.restore();   // moth holes
  const dress = SM([[-9, -8], [-13, 10], [-16, 38], [0, 41], [16, 38], [13, 10], [9, -8]], .8);
  S.part(g, dress, C.dress, { x:0, y:16, r:18 }, { mat:'cloth' }); S.crease(g, SO([[-5, 2], [-7, 36]]), C.dress, 1.6, .45); S.crease(g, SO([[5, 2], [8, 36]]), C.dress, 1.6, .45);
  // rope belt with a bone toggle
  S.tube(g, SO([[-12, 8], [0, 10], [12, 8]]), C.twine, 2.6); S.ln(g, [[-2, 10], [-4, 20]], C.twine, 1.4, .9); S.part(g, RR(-6, 19, 4, 7, 2), C.bone, { x:-4, y:22, r:4 }, { flat:true, mat:'bone', lw:.8 });
  // the hump: a crow-feather shawl high on the shoulders, drawn as overlapping feathers
  const R = rng(91);
  for (let i = 0; i < 13; i++){ const a = Math.PI + .15 + i * (Math.PI - .3) / 12, d = 16 + R() * 3, fx = Math.cos(a) * d * 1.15, fy = -6 + Math.sin(a) * d * -.55 + 6, ang = Math.atan2(fy + 2, fx) ;
    g.save(); g.translate(fx, fy + 4); g.rotate(ang - Math.PI / 2 + (fx < 0 ? .2 : -.2));
    S.part(g, SM([[-4, -2], [4, -2], [3, 10], [0, 15, 1], [-3, 10]], .7), C.shawl, { x:0, y:5, r:7 }, { flat:true, mat:'leather', lw:1 }); S.ln(g, [[0, -1], [0, 12]], { deep:'#5a5a62' }, .7, .7); g.restore(); }
  S.part(g, SM([[-20, -10], [-12, -16], [0, -14], [12, -16], [20, -10], [14, 0], [0, 4], [-14, 0]], .8), C.shawl, { x:0, y:-6, r:20 }, { mat:'leather', hx:-8, hy:-12 });
  // left arm: a gnarled hand held up, clawing, in front of the chest
  const la = w == null ? 0 : sw * .2;
  g.save(); g.translate(-12, -6); g.rotate(la - raise * .5); S.tube(g, SO([[0, 0], [-8, 10], [-6, 18]]), C.cloak, 5.5); crookHand(g, -5, 20, C.face, -Math.PI * .4 - raise * .6, .5 + raise * .4); g.restore();
  // right arm out to the staff
  const gy = Math.max(-28, stTop + 34);
  const hgx = stX + Math.sin(tiltS) * (stFoot - gy) - 2, hgy = gy;
  S.tube(g, SO([[12, -6], [20, -2 + (hgy + 2) * .3], [hgx - 2, hgy + 2]]), C.cloak, 5.5);
  S.part(g, E(hgx, hgy, 4.4, 4.6), C.face, { x:hgx, y:hgy, r:4.4 }, { flat:true, mat:'skin' });
  for (let i = 0; i < 3; i++) S.tube(g, SO([[hgx + 2, hgy - 2 + i * 2.4], [hgx + 5, hgy - 1 + i * 2.4], [hgx + 4.5, hgy + 1 + i * 2.4]]), C.face, 2.2);
  // head hangs lower and forward (the hunch), then the hat
  const hy = -17 + lean * 2;
  croneFace(g, 0, hy, 15, { jaw, glow:spark, hair:sw * 1.5 });
  croneHat(g, 0, hy - 14, 27, (w == null ? 0 : sw * 2.5) - raise * 2);
  g.restore();
}

// ---------- the Blood Coven Witch ----------
function covenWitch(g, P){
  const C = COV, w = P.walk, ch = P.chew, hx = P.hex, sw = w == null ? 0 : Math.sin(w * TAU);
  const bob = w != null ? -Math.abs(sw) * 2.5 : ch != null ? Math.sin(ch * TAU) * 2.5 : 0, lean = ch == null ? 0 : .5 + Math.sin(ch * TAU) * .5, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  const raise = hx == null ? 0 : Math.sin(Math.min(1, hx * 1.4) * Math.PI) ** .7, spark = hx == null ? 0 : Math.max(0, Math.sin(hx * Math.PI)), back = raise * .1;
  const t = w ?? ch ?? hx ?? 0;
  S.shadow(g, 0, 50, 28, 5);
  // pointed heeled boots
  for (const s of [-1, 1]){ const ph = w == null ? null : w * TAU + (s < 0 ? 0 : Math.PI), lift = ph == null ? 0 : Math.max(0, Math.sin(ph)) * 6, dx = ph == null ? 0 : Math.cos(ph) * 4;
    S.tube(g, SO([[s * 7, 30], [s * 8 + dx, 42 - lift]]), C.boot, 6);
    S.part(g, SM([[s * 3 + dx, 40 - lift], [s * 12 + dx, 41 - lift], [s * 20 + dx, 46 - lift, 1], [s * 10 + dx, 50 - lift], [s * 4 + dx, 50 - lift, 1], [s * 2 + dx, 46 - lift]], .6), C.boot, { x:s * 10 + dx, y:45 - lift, r:8 }, { flat:true, mat:'leather' }); }
  g.save(); g.translate(0, bob); g.rotate(-back); g.translate(0, lean * 3);
  // high vampiric collar behind the head, then the crimson cloak with a black lining showing at the front
  const fl = Math.sin(t * TAU + 1) * 2;
  const collar = SM([[-13, -6], [-24, -18], [-26, -34, 1], [-16, -26], [-8, -14], [8, -14], [16, -26], [26, -34, 1], [24, -18], [13, -6]], .8);
  S.part(g, collar, C.lining, { x:0, y:-18, r:24 }, { flat:true, mat:'cloth', lw:1.2 });
  S.part(g, SM([[-14, -8], [-23, -18], [-25, -30, 1], [-20, -21], [-12, -12]], .7), C.cloak, { x:-19, y:-18, r:10 }, { flat:true, mat:'cloth', lw:1 });
  S.part(g, SM([[14, -8], [23, -18], [25, -30, 1], [20, -21], [12, -12]], .7), C.cloak, { x:19, y:-18, r:10 }, { flat:true, mat:'cloth', lw:1 });
  const cloak = SM([[-14, -8], [-26, 10], [-31, 38 + fl, 1], [-20, 34, 1], [-11, 41 + fl, 1], [0, 36, 1], [11, 41 - fl, 1], [20, 34, 1], [31, 38 - fl, 1], [26, 10], [14, -8]], .8);
  S.part(g, cloak, C.cloak, { x:0, y:14, r:30 }, { mat:'cloth', hx:-12, hy:0 });
  S.crease(g, SO([[-18, 2], [-24, 32]]), C.cloak, 1.8, .4); S.crease(g, SO([[18, 2], [24, 32]]), C.cloak, 1.8, .4);
  const dress = SM([[-10, -6], [-13, 10], [-18, 38], [0, 41], [18, 38], [13, 10], [10, -6]], .8);
  S.part(g, dress, C.dress, { x:0, y:16, r:19 }, { mat:'cloth' }); S.crease(g, SO([[-5, 14], [-8, 36]]), C.dress, 1.6, .45); S.crease(g, SO([[5, 14], [9, 36]]), C.dress, 1.6, .45);
  // corset: crimson panel with gold lacing
  const cor = SM([[-8, -4], [8, -4], [9, 12], [0, 16], [-9, 12]], .6);
  S.part(g, cor, C.band, { x:0, y:5, r:10 }, { flat:true, mat:'cloth' });
  g.strokeStyle = rgba(C.lace.base, .95); g.lineWidth = .9; for (let i = 0; i < 4; i++){ const y = -1 + i * 3.6; g.beginPath(); g.moveTo(-2.5, y); g.lineTo(2.5, y + 3); g.moveTo(2.5, y); g.lineTo(-2.5, y + 3); g.stroke(); }
  // left arm carries the blood cauldron by its bail, swinging against the walk
  const swing = w == null ? 0 : sw * .25;
  g.save(); g.translate(-10, -3); g.rotate(swing + raise * .15);
  S.tube(g, SO([[0, 0], [-7, 9], [-9, 18]]), C.cloak, 6);
  g.save(); g.translate(-9, 21); g.rotate(-swing * 1.6 - raise * .15); bloodPot(g, 0, 0, spark, Math.sin(t * TAU * 2) * .5 + .5); g.restore();
  S.hand(g, -9, 20, C.face, Math.PI * .5, 3, 3.8); g.restore();
  // right arm raises the bone athame
  const aa = .5 - raise * 1.5 + (w == null ? 0 : -sw * .2);
  g.save(); g.translate(10, -2); g.rotate(aa); S.tube(g, SO([[0, 0], [10, 8], [18, 12]]), C.cloak, 6); S.hand(g, 20, 13, C.face, 0, 3, 4);
  g.save(); g.translate(20, 13); g.rotate(.1 - raise * 1.0);
  S.tube(g, SO([[-2, 5], [1, -6]]), C.lining, 3.4); S.tube(g, SO([[-4, -6], [6, -7]]), C.bone, 2.4);   // grip and crossguard
  S.part(g, PL([[-1, -7], [4, -7], [3, -20], [1.8, -27], [0, -20]]), C.bone, { x:1.5, y:-15, r:7 }, { flat:true, mat:'bone', lw:1 });
  S.ln(g, [[1.8, -9], [1.8, -23]], C.bone, .8, .4);
  g.save(); g.shadowColor = RED; g.shadowBlur = 4; S.dot(g, E(1, -7, 2, 2), '#e01020'); g.restore();
  burst(g, 1.8, -27, spark, RED, '#ffd0c8', 31);
  g.restore(); g.restore();
  // head, high-collared, under the wide horned hat
  covenFace(g, 0, -22, 15, { jaw, glow:.25 + spark * .75, hair:sw * 2 });
  S.contact(g, dress, 0, -8, 10, 4, .45);
  covenHat(g, 1, -37, 30, 5 + (w == null ? 0 : sw * 2) - raise * 4);
  g.restore();
}

// ---------- registry entry (format of src/engine/render/chars/index.js) ----------
// The game's witch entry with the two looks as variants. Both fit the game's witch box; scale/dy unchanged (r 22 → feet at 21).
// In the game each would get its own key (or a vkeyOf reading a nightmare field), since the variant is chosen per monster.
export const NWITCH = { key:'witch', draw:witch, scale:.62, dy:-10, box:{ x:-48, y:-98, w:100, h:154 }, variants:{ ash:true, coven:true },
  clips:{ walk:{ n:8, fps:9, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, hex:{ n:6, fps:12, once:true, pose:t => ({ hex:t }) } }, still:{ hex:.5 } };
