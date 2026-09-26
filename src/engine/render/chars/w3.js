// ---------- World 3 (Witchwood) characters, Toy Plastic style ----------
// Chameleon, Reverse Chameleon, Mirror Sprite, Witch and the Hexwitch, drawn per docs/ART_BRIEF.md.
// Each drawing takes a pose and draws in drawing units around (0,0) with the feet near y = 50; anim.js bakes the clips.
// Chameleons are painted in the pumpkin colour they are locked to: the registry derives a variant key 'c<index>' from the
// live monster (vkeyOf) and draw() reads pose.variant to build its palette from PTYPES.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';
import { PTYPES } from '../../../data/pumpkins.js';

const TONGUE = pal('#ee6a8a'), CLAWC = '#f4ead0',
  FACE = pal('#8fbf5a'), FACED = pal('#5f8a38'), HAT = pal('#2f2040'), BAND = pal('#c9584a'), BUCKLE = pal('#e0b04a'), DRESS = pal('#5a3a7a'), CLOAK = pal('#3a2652'), BOOT = pal('#3a2a2e'),
  HAIR = pal('#9a8ab8'), WAND = pal('#8a5a2c'), WOODB = pal('#7a5030'), STRAW = pal('#c9a45c'), TWINE = pal('#6a4a2a'), POT = pal('#3a3a44'),
  SKINF = pal('#e8e0f6'), HAIRF = pal('#b8ecdc'), DRESSF = pal('#6a4ac0'), WING = pal('#d4ecff'), FRAME = pal('#c8a050'), GLASS = pal('#9ad0ff'),
  SPARK = '#d09bff', GREEN = '#8cff5a';

// ---------- shared helpers ----------
/** A stubby three-toed foot at (x, y) in palette c. */
function foot3(g, x, y, c){
  S.part(g, E(x, y, 9, 5), c, { x, y, r:9 }, { flat:true, mat:'scaly' });
  for (const d of [-6, 0, 6]){ S.part(g, E(x + d, y + 2.5, 3.2, 2.8), c, { x:x + d, y:y + 2.5, r:3.2 }, { flat:true, noEdge:true }); S.claw(g, x + d, y + 5, Math.PI / 2, 2.6, CLAWC); }
}
/** Witch's pointed hat: brim centred at (x, y) with half-width w, a crooked cone above it whose tip leans by `tip`. */
function witchHat(g, x, y, w, tip = 0, band = BAND){
  const h = w * 2.3;
  const cone = SM([[x - w * .58, y + 1], [x - w * .4, y - h * .42], [x - w * .12 + tip * .4, y - h * .8], [x + w * .12 + tip, y - h - 3], [x + w * .3 + tip * .7, y - h * .8], [x + w * .33, y - h * .42], [x + w * .58, y + 1]], .8);
  S.part(g, cone, HAT, { x, y:y - h * .3, r:w * .95 }, { mat:'cloth', hx:x - w * .18, hy:y - h * .45 });
  S.crease(g, SO([[x - w * .22, y - h * .12], [x - w * .12, y - h * .5], [x + tip * .3, y - h * .78]]), HAT, 2, .4);
  S.part(g, SM([[x - w * .5, y - 1], [x + w * .5, y - 1], [x + w * .38, y - h * .24], [x - w * .42, y - h * .24]], .5), band, { x, y:y - h * .12, r:w * .5 }, { flat:true, mat:'cloth' });
  S.part(g, RR(x - w * .12, y - h * .2, w * .24, h * .15, 2), BUCKLE, { x, y:y - h * .12, r:w * .14 }, { flat:true, mat:'metal' });
  S.part(g, E(x, y, w, w * .27), HAT, { x, y, r:w }, { flat:true, mat:'cloth', hx:x - w * .3, hy:y - w * .08 });
}
/** Green witch face at (x, y) with head radius r: hooked nose, wart, yellow eyes, a grin with a lone tooth. o.jaw opens the mouth, o.glow lights the eyes. */
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
/** Crooked wand from (x1, y1) to (x2, y2) with a spark at the tip (0..1). */
function wand(g, x1, y1, x2, y2, spark){
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny) || 1;
  S.tube(g, SO([[x1, y1], [mx + nx / L * 3, my + ny / L * 3], [x2, y2]]), WAND, 3.2);
  S.part(g, E(x2, y2, 2.4, 2.4), WAND, { x:x2, y:y2, r:2.4 }, { flat:true, noEdge:true });
  if (spark > 0){ g.save(); g.globalAlpha *= Math.min(1, spark * 1.5); S.glow(g, x2, y2, 3 + spark * 4, SPARK);
    if (spark > .4){ const R = rng(31); g.strokeStyle = rgba('#f0e0ff', .9); g.lineWidth = 1.4; for (let i = 0; i < 6; i++){ const a = i * TAU / 6 + R() * .5, d = 7 + spark * 12; g.beginPath(); g.moveTo(x2 + Math.cos(a) * 5, y2 + Math.sin(a) * 5); g.lineTo(x2 + Math.cos(a) * d, y2 + Math.sin(a) * d); g.stroke(); } }
    g.restore(); }
}
/** Long-fingered hand at (x, y): four thin fingers fanning around dir, spread by `sp` (0..1). */
function longHand(g, x, y, c, dir, sp = .5, len = 13){
  for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * (.22 + sp * .38); S.tube(g, SO([[x, y], [x + Math.cos(a) * len * .55, y + Math.sin(a) * len * .55], [x + Math.cos(a + .25) * len, y + Math.sin(a + .25) * len]]), c, 3.2); S.claw(g, x + Math.cos(a + .25) * len, y + Math.sin(a + .25) * len, a + .25, 3, '#d8c8e0'); }
  S.part(g, E(x, y, 6, 5.5), c, { x, y, r:6 }, { flat:true, mat:'skin' });
}
/** Magic orb: a glowing green core with purple motes, size s and strength a (0..1). */
function orb(g, x, y, s, a){
  if (a <= 0) return;
  g.save(); g.globalAlpha *= Math.min(1, a);
  const gr = g.createRadialGradient(x, y, 0, x, y, s * 2.2); gr.addColorStop(0, 'rgba(140,255,90,.55)'); gr.addColorStop(.5, 'rgba(160,110,230,.25)'); gr.addColorStop(1, 'rgba(160,110,230,0)'); g.fillStyle = gr; g.fillRect(x - s * 2.4, y - s * 2.4, s * 4.8, s * 4.8);
  S.glow(g, x, y, s, GREEN);
  const R = rng(19); for (let i = 0; i < 7; i++){ const an = R() * TAU + a * 3, d = s * (1.2 + R() * 1.4), rr = 1.2 + R() * 1.8; S.dot(g, E(x + Math.cos(an) * d, y + Math.sin(an) * d, rr, rr), i % 2 ? SPARK : '#f0ffe0', .9); }
  g.restore();
}

// ---------- chameleon ----------
/** Front-facing two-legged chameleon in the pumpkin colour of pose.variant ('c3' → PTYPES[3]). reverse: hollow eyes, dark belly and markings, cracked casque. */
export function chameleon(g, P = {}, reverse = false){
  const idx = P.variant ? +P.variant.slice(1) : reverse ? 1 : 0, base = (PTYPES[idx] && PTYPES[idx].base) || '#5c9c33';
  const c = pal(base), belly = reverse ? pal(mix(base, '#1a0a24', .38)) : pal(mix(base, '#fff2c0', .42)), mark = reverse ? c.deep : c.light, cas = pal(mix(base, reverse ? '#1a0a24' : '#fff2c0', .18));
  const w = P.walk, ch = P.chew, sw = w == null ? 0 : Math.sin(w * TAU);
  const bob = w != null ? -Math.abs(sw) * 3 : ch != null ? Math.sin(ch * TAU) * 2.5 : 0, lean = ch == null ? 0 : .5 + Math.sin(ch * TAU) * .5, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU)), wag = w != null ? sw : ch != null ? Math.sin(ch * TAU) : 0;
  S.shadow(g, 2, 50, 32, 6);
  // legs and three-toed feet
  for (const s of [-1, 1]){ const ph = w == null ? null : w * TAU + (s < 0 ? 0 : Math.PI), lift = ph == null ? 0 : Math.max(0, Math.sin(ph)) * 7, dx = ph == null ? 0 : Math.cos(ph) * 4;
    S.tube(g, SO([[s * 11, 28], [s * 14 + dx * .5, 38 - lift * .5], [s * 15 + dx, 44 - lift]]), c, 8); foot3(g, s * 15 + dx, 46 - lift, c); }
  g.save(); g.translate(0, bob);
  // tail curling out to the right, tapered in three runs
  const tail = [[16, 26], [32, 32 + wag * 2], [44, 22 + wag * 3], [42, 8 + wag * 4], [32, 8 + wag * 3]];
  S.tube(g, SO(tail.slice(0, 3)), c, 7); S.tube(g, SO(tail.slice(1, 4)), c, 5); S.tube(g, SO(tail.slice(2)), c, 3.4);
  // chubby body with a lighter ridged belly
  const body = SM([[-22, -2], [-25, 18], [-15, 36], [0, 39], [15, 36], [25, 18], [22, -2], [0, -9]]);
  S.part(g, body, c, { x:0, y:15, r:25 }, { mat:'scaly', hx:-12, hy:2 });
  for (const [x, y, r] of [[-16, 8, 3], [-10, 27, 2.4], [17, 6, 2.8], [19, 25, 2.4], [-20, 20, 2]]) S.dot(g, E(x, y, r, r * .8), mark, .75);
  const bel = SM([[-12, 3], [-15, 20], [-7, 34], [7, 34], [15, 20], [12, 3], [0, -1]]);
  S.part(g, bel, belly, { x:0, y:17, r:14 }, { flat:true, noEdge:true, mat:'scaly' });
  g.save(); bel(g); g.clip(); for (const y of [8, 15, 22, 29]) S.crease(g, SO([[-16, y], [0, y + 2], [16, y]]), belly, 1.6, .38); g.restore();
  // little arms held up, hands open
  for (const s of [-1, 1]){ const k = w == null ? 0 : Math.sin(w * TAU + (s < 0 ? 0 : Math.PI)) * 3, hx = s * 31, hy = -12 + k - lean * 4;
    S.tube(g, SO([[s * 19, 6], [s * 29, 0], [hx, hy + 4]]), c, 6); S.hand(g, hx, hy, c, -Math.PI / 2 + s * .35, 3, 5); }
  // head: spines behind, a wide flat head, the casque ridge on top
  g.save(); g.translate(0, lean * 5); g.rotate(w == null ? 0 : sw * .03);
  for (const x of [-20, -10, 0, 10, 20]) S.part(g, PL([[x - 4, -36], [x + 4, -36], [x + (x < 0 ? -2 : 2), -52 - Math.abs(x) * .1]]), cas, { x, y:-44, r:6 }, { flat:true, mat:'horn' });
  const head = SM([[-31, -22], [-33, -10], [-22, -3], [0, 1], [22, -3], [33, -10], [31, -22], [18, -41], [0, -45], [-18, -41]]);
  S.part(g, head, c, { x:0, y:-20, r:31 }, { mat:'scaly', hx:-14, hy:-34 });
  S.contact(g, body, 0, -4, 18, 5, .5);
  const casque = SM([[-15, -38], [-9, -52], [0, -59], [9, -52], [15, -38], [0, -40]]);
  S.part(g, casque, cas, { x:0, y:-46, r:14 }, { flat:true, mat:'horn' });
  if (reverse) S.ln(g, [[-4, -57], [-1, -50], [-5, -46], [-1, -41]], c, 1.4, .9);
  // turret eyes looking different ways (both forward when chewing)
  for (const s of [-1, 1]){ const ex = s * 20, ey = -25; S.part(g, E(ex, ey, 11, 10.5), c, { x:ex, y:ey, r:11 }, { mat:'scaly', hx:ex - 5, hy:ey - 5 });
    g.strokeStyle = rgba(c.deep, .35); g.lineWidth = 1; for (const rr of [8.6, 6.6]){ ell(g, ex, ey, rr, rr * .95); g.stroke(); }
    const lx = ch != null ? .15 : s < 0 ? -.45 : .4, ly = ch != null ? .35 : s < 0 ? -.35 : .3;
    if (reverse){ S.dot(g, E(ex, ey, 5.4, 5.4), '#140a1c'); S.overlay(g, E(ex, ey, 5.4, 5.4), c, { x:ex, y:ey, r:5.4 }, .3); S.dot(g, E(ex + lx * 4, ey + ly * 4, 1.3, 1.3), '#fff'); }
    else S.eye(g, ex, ey, 5.6, 5.6, { lx, ly, pr:.5, iris:mix(c.dark, '#c07020', .5) }); }
  // mouth and the tongue tip
  if (jaw > .05) S.dot(g, SM([[-16, -10], [0, -6], [16, -10], [0, -6 + jaw * 9]], .8), '#2a1020');
  S.stroke(g, SO([[-20, -12], [-8, -6 + jaw * 2], [8, -6 + jaw * 2], [20, -12]]), c, 2.2);
  S.tube(g, SO([[7, -7 + jaw * 3], [12 + jaw * 8, -2 + jaw * 5]]), TONGUE, 3.4); S.part(g, E(13 + jaw * 8, -1 + jaw * 5, 2.6, 2.4), TONGUE, { x:13, y:-1, r:2.6 }, { flat:true, noEdge:true });
  if (!reverse) S.blush(g, 0, -8, .7);
  g.restore(); g.restore();
}
export function rchameleon(g, P = {}){ chameleon(g, P, true); }

// ---------- mirror sprite ----------
/** A small winged sprite with a hand mirror: up and glinting (P.reflect), lowered on the walk, biting on the chew. */
export function mirror(g, P = {}){
  const w = P.walk, ch = P.chew, rf = P.reflect, t = w ?? rf ?? ch ?? 0;
  const flap = Math.sin(t * TAU * 2), hover = ch == null ? Math.sin(t * TAU) * 3 : Math.sin(ch * TAU) * 2, lean = ch == null ? 0 : .5 + Math.sin(ch * TAU) * .5, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  const up = rf != null;
  S.shadow(g, 0, 50, 22 - Math.abs(hover), 4);
  g.save(); g.translate(0, hover + lean * 6);
  // wings behind: two big upper, two small lower, translucent with veins
  for (const s of [-1, 1]){ const lift = flap * 9;
    const W1 = SM([[s * 6, -4], [s * 20, -22 - lift], [s * 40, -30 - lift], [s * 46, -14 - lift * .6], [s * 34, 2], [s * 14, 4]], .8), W2 = SM([[s * 6, 6], [s * 24, 12 + lift * .4], [s * 36, 26 + lift * .5], [s * 24, 30], [s * 10, 18]], .8);
    g.save(); g.globalAlpha *= .8; S.part(g, W1, WING, { x:s * 26, y:-12, r:22 }, { flat:true, mat:'gel', lw:1.2 }); S.part(g, W2, WING, { x:s * 22, y:18, r:14 }, { flat:true, mat:'gel', lw:1.2 }); g.restore();
    S.crease(g, SO([[s * 8, -2], [s * 26, -18 - lift * .8], [s * 42, -22 - lift]]), WING, 1.2, .35); S.crease(g, SO([[s * 8, 2], [s * 28, -6 - lift * .3], [s * 40, -10 - lift * .4]]), WING, 1, .3); S.crease(g, SO([[s * 8, 8], [s * 22, 16], [s * 32, 26]]), WING, 1, .3); }
  // legs dangling, tiny slippers
  for (const s of [-1, 1]){ const k = Math.sin(t * TAU + (s < 0 ? 0 : 2)) * 2; S.tube(g, SO([[s * 5, 22], [s * 7 + k, 34]]), SKINF, 4.5); S.part(g, E(s * 8 + k, 37, 5, 3), DRESSF, { x:s * 8, y:37, r:5 }, { flat:true, mat:'cloth' }); }
  // dress: a short flared tunic
  const dress = SM([[-9, -2], [-13, 12], [-16, 26, 1], [-8, 22, 1], [0, 28, 1], [8, 22, 1], [16, 26, 1], [13, 12], [9, -2]], .8);
  S.part(g, dress, DRESSF, { x:0, y:12, r:16 }, { mat:'cloth' }); S.crease(g, SO([[-5, 4], [-6, 22]]), DRESSF, 1.4, .4); S.crease(g, SO([[5, 4], [7, 22]]), DRESSF, 1.4, .4);
  // arms: mirror arm (right) up or down, the other waving
  const wave = Math.sin(t * TAU) * 3;
  S.tube(g, SO([[-8, 2], [-16, 8 + wave], [-20, 16 + wave]]), SKINF, 4); S.hand(g, -21, 19 + wave, SKINF, Math.PI * .7, 3, 3.6);
  const mx = up ? 6 : 22, my = up ? 6 : 24;
  if (up) S.tube(g, SO([[8, 2], [14, 12], [10, 16]]), SKINF, 4); else S.tube(g, SO([[8, 2], [16, 10], [20, 18]]), SKINF, 4);
  // head: big, pale, with a swept mint bob and pointed ears
  const head = SM([[-16, -22], [-17, -10], [-10, -1], [0, 1], [10, -1], [17, -10], [16, -22], [8, -32], [-8, -32]]);
  for (const s of [-1, 1]) S.part(g, SM([[s * 12, -18], [s * 26, -26], [s * 20, -12]], .6), SKINF, { x:s * 18, y:-18, r:7 }, { flat:true, mat:'skin' });
  S.part(g, head, SKINF, { x:0, y:-15, r:17 }, { mat:'skin' }); S.contact(g, dress, 0, -2, 10, 4, .4);
  S.part(g, SM([[-18, -22], [-14, -36], [0, -41], [14, -36], [18, -22], [12, -26], [6, -22], [-2, -28], [-10, -24]], .8), HAIRF, { x:0, y:-30, r:18 }, { mat:'skin', hx:-8, hy:-34 });
  S.crease(g, SO([[-6, -38], [-2, -30]]), HAIRF, 1.2, .35); S.crease(g, SO([[6, -37], [10, -29]]), HAIRF, 1.2, .35);
  S.eye(g, -6.5, -13, 5.5, 6.5, { lx:.15, ly:.2, pr:.44, iris:'#5a7aff' }); S.eye(g, 6.5, -13, 5.5, 6.5, { lx:.15, ly:.2, pr:.44, iris:'#5a7aff' });
  S.blush(g, 0, -6, .55);
  if (jaw > .05){ S.dot(g, SM([[-4, -4], [0, -3 + jaw * 5], [4, -4], [0, -5]], .8), '#3a1a3a'); S.dot(g, PL([[-3, -4], [-1, -4], [-2, -1]]), '#fff'); S.dot(g, PL([[1, -4], [3, -4], [2, -1]]), '#fff'); }
  else S.stroke(g, SO([[-4, -4], [0, -2], [4, -4]]), SKINF, 1.4);
  // the hand mirror: brass frame, glass, handle; glinting when up
  const ang = up ? -.15 : .5;
  g.save(); g.translate(mx, my); g.rotate(ang);
  S.tube(g, SO([[0, 10], [1, 22]]), FRAME, 4); S.part(g, E(0, 0, 12.5, 13.5), FRAME, { x:0, y:0, r:12.5 }, { mat:'metal', flat:true });
  const glass = E(0, 0, 9, 10);
  if (up){ g.save(); g.shadowColor = '#bfefff'; g.shadowBlur = 10; S.part(g, glass, GLASS, { x:0, y:2, r:9 }, { flat:true, noEdge:true }); g.restore();
    g.save(); glass(g); g.clip(); const gl = g.createLinearGradient(-9, -9, 9, 9); gl.addColorStop(0, '#ffffff'); gl.addColorStop(.5, '#bfe6ff'); gl.addColorStop(1, '#7ab0ff'); g.fillStyle = gl; g.fillRect(-10, -11, 20, 22);
    const k = -1.3 + rf * 2.6; g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(-14 + k * 10, 12); g.lineTo(-8 + k * 10, -12); g.lineTo(-4 + k * 10, -12); g.lineTo(-10 + k * 10, 12); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(-1 + k * 10, 12); g.lineTo(3 + k * 10, -12); g.lineTo(5 + k * 10, -12); g.lineTo(1 + k * 10, 12); g.closePath(); g.fill(); g.restore();
    g.strokeStyle = '#fff'; g.lineWidth = 1.2; const sx = 5, sy = -5, sr = 3 + Math.sin(rf * TAU) * 1.5; g.beginPath(); g.moveTo(sx - sr, sy); g.lineTo(sx + sr, sy); g.moveTo(sx, sy - sr); g.lineTo(sx, sy + sr); g.stroke(); }
  else { S.part(g, glass, pal('#6a7a8a'), { x:0, y:2, r:9 }, { flat:true, noEdge:true }); S.dot(g, E(-3, -3, 2.5, 1.5), '#fff', .35); }
  S.stroke(g, glass, FRAME, 1.4, .8);
  g.restore();
  S.hand(g, up ? 8 : 20, up ? 18 : 20, SKINF, up ? -Math.PI / 2 : Math.PI / 2, 3, 3.6);
  g.restore();
}

// ---------- witch ----------
/** A small witch on foot: pointed hat, cloak, crooked wand. P.hex (once) is the wand flourish. */
export function witch(g, P = {}){
  const w = P.walk, ch = P.chew, hx = P.hex, sw = w == null ? 0 : Math.sin(w * TAU);
  const bob = w != null ? -Math.abs(sw) * 2.5 : ch != null ? Math.sin(ch * TAU) * 2.5 : 0, lean = ch == null ? 0 : .5 + Math.sin(ch * TAU) * .5, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  const raise = hx == null ? 0 : Math.sin(Math.min(1, hx * 1.4) * Math.PI) ** .7, spark = hx == null ? 0 : Math.max(0, Math.sin(hx * Math.PI)), back = raise * .1;
  S.shadow(g, 0, 50, 26, 5);
  // boots stepping
  for (const s of [-1, 1]){ const ph = w == null ? null : w * TAU + (s < 0 ? 0 : Math.PI), lift = ph == null ? 0 : Math.max(0, Math.sin(ph)) * 6, dx = ph == null ? 0 : Math.cos(ph) * 4;
    S.tube(g, SO([[s * 7, 30], [s * 8 + dx, 42 - lift]]), BOOT, 6); S.part(g, SM([[s * 3 + dx, 40 - lift], [s * 14 + dx, 40 - lift], [s * 18 + dx, 48 - lift], [s * 8 + dx, 50 - lift], [s * 2 + dx, 46 - lift]], .6), BOOT, { x:s * 10 + dx, y:45 - lift, r:8 }, { flat:true, mat:'leather' }); }
  g.save(); g.translate(0, bob); g.rotate(-back); g.translate(0, lean * 3);
  // cloak behind, then the dress
  const cloak = SM([[-14, -8], [-24, 10], [-28, 36, 1], [-18, 30, 1], [-10, 38, 1], [0, 32, 1], [10, 38, 1], [18, 30, 1], [28, 36, 1], [24, 10], [14, -8]], .8);
  S.part(g, cloak, CLOAK, { x:0, y:14, r:28 }, { mat:'cloth', hx:-10, hy:0 }); for (const [x, y] of [[-28, 36], [-10, 38], [10, 38], [28, 36]]) S.thread(g, x, y, 1, CLOAK);
  const dress = SM([[-9, -6], [-12, 10], [-16, 36], [0, 39], [16, 36], [12, 10], [9, -6]], .8);
  S.part(g, dress, DRESS, { x:0, y:16, r:18 }, { mat:'cloth' }); S.crease(g, SO([[-5, 4], [-7, 34]]), DRESS, 1.6, .4); S.crease(g, SO([[5, 4], [8, 34]]), DRESS, 1.6, .4);
  S.tube(g, SO([[-11, 6], [11, 6]]), BOOT, 3); S.part(g, RR(-3, 3, 6, 6, 1), BUCKLE, { x:0, y:6, r:3 }, { flat:true, mat:'metal' });
  // left arm swinging; right arm holds the wand out, raised in the hex flourish
  const swing = w == null ? 0 : sw * .3;
  g.save(); g.translate(-9, -2); g.rotate(swing); S.tube(g, SO([[0, 0], [-8, 10], [-10, 20]]), CLOAK, 6); S.hand(g, -11, 23, FACE, Math.PI * .6, 3, 4); g.restore();
  const aa = .5 - raise * 1.5 + (w == null ? 0 : -sw * .2);
  g.save(); g.translate(10, -2); g.rotate(aa); S.tube(g, SO([[0, 0], [10, 8], [18, 12]]), CLOAK, 6); S.hand(g, 20, 13, FACE, 0, 3, 4);
  g.save(); g.translate(20, 13); g.rotate(.1 - raise * 1.0); wand(g, -3, 4, 5, -24, spark); g.restore(); g.restore();
  // head and hat
  witchFace(g, 0, -22, 15, { jaw, glow:spark * .8, hair:sw * 2 });
  S.contact(g, dress, 0, -8, 10, 4, .45);
  witchHat(g, 1, -37, 24, 6 + (w == null ? 0 : sw * 2) - raise * 4);
  g.restore();
}

// ---------- the Hexwitch ----------
/** Witch astride a broom: idle hover (P.idle), two-handed hex (P.hex), broom raised and slammed (P.zone), teleport fade (P.fade). */
// Full form (level 20, pose.variant 'form2'): 12% taller about the boots, a blood-moon palette (near-black hat, crimson band, deeper dress and cloak),
// a bigger crooked hat with a bone charm, a crow familiar on the broom, glowing crack-lines on the face, longer claws and a cauldron boiling over with green fire.
const HAT2 = pal('#1a0e2c'), BAND2 = pal('#b0182c'), DRESS2 = pal('#3c1c5e'), CLOAK2 = pal('#20103a'), STRAW2 = pal('#a67c3c'), CROW = pal('#2a1c36'), CHARM = pal('#e2d8c4'), CRACK = '#a8ff5e';
export function hexwitch(g, P = {}){
  const F2 = P.variant === 'form2';
  const idle = P.idle, hx = P.hex ?? 0, zn = P.zone, fade = P.fade ?? 0;
  const dress = F2 ? DRESS2 : DRESS, cloakC = F2 ? CLOAK2 : CLOAK, strawC = F2 ? STRAW2 : STRAW, hatC = F2 ? HAT2 : HAT, bandC = F2 ? BAND2 : pal('#8a3a9a');
  const br = idle == null ? 0 : Math.sin(idle * TAU), bob = br * 4;
  const R = rng(9);
  // form-2 hat: witchHat with its own palette, wider and more crooked, a bone charm swinging from the brim
  const hat2 = (x, y, w, tip) => { const h = w * 2.3;
    const cone = SM([[x - w * .58, y + 1], [x - w * .4, y - h * .42], [x - w * .12 + tip * .4, y - h * .8], [x + w * .12 + tip, y - h - 3], [x + w * .3 + tip * .7, y - h * .8], [x + w * .33, y - h * .42], [x + w * .58, y + 1]], .8);
    S.part(g, cone, hatC, { x, y:y - h * .3, r:w * .95 }, { mat:'cloth', hx:x - w * .18, hy:y - h * .45 });
    S.crease(g, SO([[x - w * .22, y - h * .12], [x - w * .12, y - h * .5], [x + tip * .3, y - h * .78]]), hatC, 2, .4); S.crease(g, SO([[x + w * .18, y - h * .1], [x + w * .2, y - h * .45]]), hatC, 1.6, .35);
    S.part(g, SM([[x - w * .5, y - 1], [x + w * .5, y - 1], [x + w * .38, y - h * .24], [x - w * .42, y - h * .24]], .5), bandC, { x, y:y - h * .12, r:w * .5 }, { flat:true, mat:'cloth' });
    S.part(g, RR(x - w * .12, y - h * .2, w * .24, h * .15, 2), BUCKLE, { x, y:y - h * .12, r:w * .14 }, { flat:true, mat:'metal' });
    S.part(g, E(x, y, w, w * .27), hatC, { x, y, r:w }, { flat:true, mat:'cloth', hx:x - w * .3, hy:y - w * .08 });
    const cx = x - w * .9 + br * 1.5, cy = y + 14; S.ln(g, [[x - w * .82, y + 1], [cx, cy - 2]], TWINE, 1.3, .9);
    g.save(); g.translate(cx, cy); g.rotate(.35 - br * .15); S.part(g, RR(-8, -2.2, 16, 4.4, 2), CHARM, { x:0, y:0, r:8 }, { flat:true, mat:'bone', lw:1 }); for (const d of [-8, 8]) for (const e of [-2.2, 2.2]) S.part(g, E(d, e, 3.2, 2.8), CHARM, { x:d, y:e, r:3.2 }, { flat:true, mat:'bone', lw:1 }); g.restore(); };
  // form-2 hand: longer fingers ending in long pale claws
  const hand2 = (x, y, c, dir, sp = .5, len = 16) => { for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * (.22 + sp * .38); S.tube(g, SO([[x, y], [x + Math.cos(a) * len * .55, y + Math.sin(a) * len * .55], [x + Math.cos(a + .25) * len, y + Math.sin(a + .25) * len]]), c, 3.4); S.claw(g, x + Math.cos(a + .25) * len, y + Math.sin(a + .25) * len, a + .25, 6, '#ece0f0'); }
    S.part(g, E(x, y, 6.5, 6), c, { x, y, r:6.5 }, { flat:true, mat:'skin' }); };
  if (F2){ g.save(); g.translate(0, 52); g.scale(1.12, 1.12); g.translate(0, -52); }
  if (fade > 0){
    for (let i = 0; i < 12; i++){ const x = (R() - .5) * 120, y0 = -80 + R() * 130, rr = 4 + R() * 6, y = y0 - fade * 70 - R() * 20, a = Math.max(0, (1 - fade) * .6) * (fade < .15 ? fade / .15 : 1); g.save(); g.globalAlpha *= a; g.shadowColor = F2 && i % 3 === 1 ? '#ff4a5a' : '#a06ae0'; g.shadowBlur = 8; S.dot(g, E(x + Math.sin(fade * 6 + i) * 8, y, rr * (1 + fade * 1.5), rr * (1 + fade * 1.5)), i % 3 ? (F2 && i % 3 === 1 ? '#a01a3a' : '#7a4ab8') : '#5aa040'); g.restore(); }
    if (fade >= 1){ if (F2) g.restore(); return; }
    g.save(); g.globalAlpha *= 1 - fade; g.translate(0, -fade * 30); g.scale(1, 1 - fade * .3); }
  // broom pose: raised then slammed on the zone clip
  let tilt = -.12 + br * .03, lift = 0, slam = 0;
  if (zn != null){ if (zn < .45){ const q = zn / .45; tilt = -.12 + Math.sin(q * Math.PI / 2) * .67; lift = -q * 16; } else if (zn < .65){ const q = (zn - .45) / .2; tilt = .55 - q * .87; lift = -16 + q * 24; slam = q; } else { const q = (zn - .65) / .35; tilt = -.32 + q * .2; lift = 8 - q * 8; slam = 1 - q * .6; } }
  S.shadow(g, 0, 52, 62, 9);
  g.save(); g.translate(0, bob + lift);
  // the broom: a long handle, straw bundle bound with twine, a little cauldron hooked on the tip
  g.save(); g.translate(0, 18); g.rotate(tilt);
  const sway = idle == null ? 0 : Math.sin(idle * TAU * 2) * 3;
  const straw = SM([[-48, -8], [-84, -16 + sway, 1], [-94, -4 + sway * .5, 1], [-92, 14, 1], [-96, 28 - sway * .5, 1], [-80, 26 - sway, 1], [-50, 12]], .6);
  S.part(g, straw, strawC, { x:-72, y:6, r:26 }, { mat:'wood', hx:-70, hy:-6 });
  g.save(); straw(g); g.clip(); for (let i = -14; i <= 26; i += 5) S.ln(g, [[-52, i * .5 - 2], [-96, i + sway * (i < 4 ? -.6 : .6)]], strawC, 1.1, .45); g.restore();
  S.part(g, RR(-56, -10, 10, 24, 3), TWINE, { x:-51, y:2, r:10 }, { flat:true, mat:'leather' }); for (const y of [-6, 0, 6]) S.ln(g, [[-56, y], [-46, y + 1]], TWINE, 1, .5);
  S.tube(g, SO([[-48, 2], [0, -2], [62, -8]]), WOODB, 6); S.ln(g, [[-40, -1], [60, -10]], { deep:WOODB.light }, 1, .5);
  S.stroke(g, SO([[62, -8], [66, 4], [70, 10]]), TWINE, 1.4, .8);
  if (F2){   // the crow familiar perched on the straw, facing its mistress, wings lifting with the breath, one red eye
    g.save(); g.translate(-72, -18 + sway * .8); const flap = Math.max(0, br) * 5 + (zn != null ? slam * 6 : 0) + hx * 4;
    for (const s of [-1, 1]) S.part(g, SM([[s * 4, -6], [s * 12, -12 - flap], [s * 22, -14 - flap * 1.4], [s * 20, -6 - flap * .6, 1], [s * 14, -2, 1], [s * 6, 2, 1]], .7), CROW, { x:s * 12, y:-8, r:12 }, { flat:true, mat:'leather', lw:1.2 });
    S.part(g, SM([[-8, -10], [-14, -2], [-18, 6, 1], [-12, 6, 1], [-4, 3], [6, 4], [12, -2], [8, -10], [0, -13]], .8), CROW, { x:-2, y:-3, r:11 }, { mat:'leather', hx:-6, hy:-8 });
    S.part(g, E(9, -13, 6.5, 6), CROW, { x:9, y:-13, r:6.5 }, { mat:'leather', hx:7, hy:-16 });
    S.part(g, PL([[13, -14], [22, -12], [13, -10]]), pal('#e8a040'), { x:16, y:-12, r:4 }, { flat:true, lw:.8 });
    S.glow(g, 10, -14, 2, '#ff3a3a');
    for (const d of [-2, 3]) S.tube(g, SO([[d, 4], [d + 1, 9]]), pal('#e8a040'), 1.6);
    g.restore(); }
  g.save(); g.translate(70, 18); S.part(g, SM([[-9, -8], [9, -8], [11, 4], [0, 9], [-11, 4]], .6), POT, { x:0, y:0, r:10 }, { mat:'metal', flat:true }); S.tube(g, SO([[-11, -6], [11, -6]]), POT, 2.5);
  g.save(); g.shadowColor = GREEN; g.shadowBlur = 8; S.dot(g, E(0, -7, 8, 2.5), '#a8ff70', .95); g.restore(); for (const [x, y] of [[-3, -12], [3, -15]]) S.dot(g, E(x, y - br * 2, 1.6, 1.6), '#c8ffa0', .8);
  if (F2){   // boiling over: tongues of green fire licking up, bright drips running down the side
    g.save(); g.shadowColor = GREEN; g.shadowBlur = 10; const lick = br * 3;
    S.dot(g, SM([[-9, -6], [-11, -16 - lick, 1], [-5, -12], [-3, -26 + lick, 1], [1, -14], [5, -30 - lick, 1], [7, -14], [11, -20 + lick, 1], [9, -6]], .6), '#7ae848', .9);
    S.dot(g, SM([[-5, -8], [-6, -16 - lick, 1], [-1, -12], [1, -22 + lick, 1], [4, -13], [5, -8]], .6), '#d8ffa0', .9);
    for (const [x, y, l] of [[-10, -3, 7 + Math.max(0, br) * 2], [9, -1, 5], [-4, 3, 4]]) { S.dot(g, RR(x - 1.2, y - 2, 2.4, l, 1.2), '#a8ff70', .85); S.dot(g, E(x, y + l - 1, 1.8, 1.8), '#c8ffa0', .9); }
    g.restore(); }
  g.restore();
  g.restore();
  if (slam > 0){ g.save(); g.globalAlpha *= slam * .8; S.dot(g, E(-72, 48, 34 * slam + 10, 6), '#3a1a4a', .5); const gr = g.createRadialGradient(-72, 44, 4, -72, 44, 30 + slam * 36); gr.addColorStop(0, 'rgba(140,255,90,.5)'); gr.addColorStop(1, 'rgba(140,255,90,0)'); g.fillStyle = gr; g.fillRect(-140, -20, 140, 90); g.restore(); }
  // legs dangling in front of the broom, boots
  for (const s of [-1, 1]){ const k = br * 2 * s; S.tube(g, SO([[s * 8, 14], [s * 12 + k, 30], [s * 10 + k, 42]]), dress, 9); S.part(g, SM([[s * 4 + k, 40], [s * 16 + k, 40], [s * 20 + k, 50], [s * 8 + k, 52], [s * 2 + k, 47]], .6), BOOT, { x:s * 10 + k, y:46, r:9 }, { flat:true, mat:'leather' }); }
  // cloak flaring behind, then the dress and torso
  const fl = idle == null ? 0 : Math.sin(idle * TAU + 1) * 4;
  const cloak = SM([[-18, -34], [-38, -10], [-50, 20 + fl, 1], [-36, 14, 1], [-26, 26 + fl, 1], [-10, 18, 1], [4, 28 + fl, 1], [18, 18, 1], [30, 26 + fl, 1], [40, 14, 1], [50, 22 + fl, 1], [38, -10], [18, -34]], .8);
  S.part(g, cloak, cloakC, { x:0, y:-4, r:48 }, { mat:'cloth', hx:-20, hy:-22 }); S.crease(g, SO([[-26, -18], [-34, 10]]), cloakC, 2.2, .4); S.crease(g, SO([[26, -18], [34, 10]]), cloakC, 2.2, .4);
  for (const [x, y] of [[-50, 20 + fl], [-26, 26 + fl], [4, 28 + fl], [30, 26 + fl], [50, 22 + fl]]) S.thread(g, x, y, 1, cloakC);
  const torso = SM([[-16, -40], [-20, -12], [-16, 18], [0, 22], [16, 18], [20, -12], [16, -40], [0, -44]], .8);
  S.part(g, torso, dress, { x:0, y:-10, r:26 }, { mat:'cloth' }); S.crease(g, SO([[-7, -30], [-9, 10]]), dress, 1.8, .4); S.crease(g, SO([[7, -30], [10, 10]]), dress, 1.8, .4);
  if (F2){ g.save(); torso(g); g.clip(); g.shadowColor = CRACK; g.shadowBlur = 5; g.strokeStyle = rgba(CRACK, .5 + Math.max(0, br) * .2 + hx * .3); g.lineWidth = 1.4; g.lineCap = 'round';   // a hex sigil glowing through the dress
    g.beginPath(); g.moveTo(0, -30); g.lineTo(9, -16); g.lineTo(-9, -16); g.closePath(); g.moveTo(0, -12); g.lineTo(9, -26); g.lineTo(-9, -26); g.closePath(); g.stroke(); g.restore(); }
  S.tube(g, SO([[-19, 0], [19, 0]]), BOOT, 4); S.part(g, RR(-4, -4, 8, 8, 1.5), BUCKLE, { x:0, y:0, r:4 }, { flat:true, mat:'metal' });
  // arms: resting on the broom, both raised and spread in the hex, gripping the handle in the zone slam
  const cast = Math.sin(Math.min(1, hx * 1.25) * Math.PI) ** .6, glowA = hx > 0 ? Math.max(0, Math.sin(hx * Math.PI)) : 0;
  for (const s of [-1, 1]){
    let ex, ey, px, py, dir, sp;
    if (zn != null){ const gx = s * 26, gy = 18 + Math.sin(tilt) * -gx * .9; ex = s * 22; ey = -2; px = gx; py = gy - 6; dir = Math.PI / 2 + tilt; sp = .2; }
    else { const t2 = cast; ex = s * (30 + t2 * 8); ey = -12 - t2 * 8; px = s * (44 - t2 * 12); py = -6 - t2 * 14; dir = s < 0 ? Math.PI * .85 - t2 * 2.4 : Math.PI * .15 + t2 * 2.4; sp = .3 + t2 * .7; if (idle != null){ px += Math.sin(idle * TAU + s) * 2; py += br * 2; } }
    S.tube(g, SO([[s * 16, -30], [ex, ey], [px, py]]), dress, 9); S.contact(g, torso, s * 16, -30, 8, 8, .35); if (F2) hand2(px, py, FACE, dir, sp); else longHand(g, px, py, FACE, dir, sp);
  }
  if (glowA > 0) orb(g, 0, -20 - cast * 4, 5 + cast * 5 + (F2 ? 2 : 0), glowA);
  // head with the big hat
  const nod = zn == null ? 0 : (zn < .45 ? -zn * .3 : slam * .18);
  g.save(); g.translate(0, -50); g.rotate(nod); witchFace(g, 0, 0, 22, { glow:(F2 ? .6 : .35) + glowA * (F2 ? .4 : .65), hair:br * 2 });
  if (F2){ g.save(); g.shadowColor = CRACK; g.shadowBlur = 6; g.strokeStyle = rgba(CRACK, .6 + glowA * .4); g.lineWidth = 1.5; g.lineCap = 'round'; g.lineJoin = 'round';   // glowing crack-lines splitting the face
    for (const pts of [[[-13, -12], [-17, -3], [-14, 5], [-18, 12]], [[-9, 6], [-12, 13]], [[12, -14], [15, -5], [12, 3], [16, 11]], [[9, 8], [12, 15]], [[-6, -16], [-3, -10]], [[4, -17], [7, -11]]]){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
    g.restore(); }
  g.restore();
  S.contact(g, torso, 0, -40, 14, 5, .45);
  g.save(); g.translate(0, -50); g.rotate(nod); if (F2) hat2(2, -22, 42, 16 + br * 3 - cast * 10); else witchHat(g, 2, -22, 38, 12 + br * 3 - cast * 8, bandC); g.restore();
  g.restore();
  if (fade > 0) g.restore();
  if (F2) g.restore();
}

// ---------- registry ----------
// scale/dy fit the drawing to the in-game footprint (feet at about r × 0.95 below the monster's centre):
// chameleons r 21 → 20, mirror r 19 → 18, witch r 22 → 21, hexwitch r 32 → 30.
const CHAM_VARIANTS = {}; for (let i = 0; i < 12; i++) CHAM_VARIANTS['c' + i] = true;
const chamClips = { walk:{ n:8, fps:9, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) } };
const chamVkey = m => 'c' + (m.colourLock ?? m.colourImmune ?? 0);
export const W3 = {
  chameleon:  { draw:chameleon, scale:.58, dy:-9, box:{ x:-40, y:-66, w:88, h:122 }, variants:CHAM_VARIANTS, vkeyOf:chamVkey, clips:chamClips, still:{} },
  rchameleon: { draw:rchameleon, scale:.58, dy:-9, box:{ x:-40, y:-66, w:88, h:122 }, variants:CHAM_VARIANTS, vkeyOf:chamVkey, clips:chamClips, still:{} },
  mirror: { draw:mirror, scale:.62, dy:-13, box:{ x:-50, y:-50, w:100, h:106 },
    clips:{ walk:{ n:8, fps:12, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, reflect:{ n:6, fps:10, pose:t => ({ reflect:t }) } }, still:{ reflect:.3 },
    frame(m, clips){ if (m.reflecting && !(m.eating && m.frozenT <= 0)){ const cl = clips.reflect; return ['reflect', Math.floor(m.ph * cl.fps) % cl.n]; } return null; } },
  witch: { draw:witch, scale:.62, dy:-10, box:{ x:-46, y:-96, w:96, h:150 },
    clips:{ walk:{ n:8, fps:9, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, hex:{ n:6, fps:12, once:true, pose:t => ({ hex:t }) } }, still:{ hex:.5 } },
  hexwitch: { draw:hexwitch, scale:.68, dy:-4, box:{ x:-120, y:-208, w:234, h:278 }, variants:{ form2:true },   // box holds the bigger-hatted, 12% taller full form too (shared atlas box)
    clips:{ walk:{ n:8, fps:6, pose:t => ({ idle:t }) }, hex:{ n:8, fps:11, once:true, pose:t => ({ hex:t }) }, zone:{ n:8, fps:10, once:true, pose:t => ({ zone:t }) }, teleport:{ n:8, fps:16, once:true, pose:t => ({ fade:t }) } }, still:{ hex:.5 } },
};
