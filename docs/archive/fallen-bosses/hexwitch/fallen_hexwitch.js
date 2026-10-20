// ---------- The Fallen Hexwitch (nightmare Witchwood boss), Toy Plastic style: design archive, not wired into the game ----------
// A copy of hexwitch() from src/engine/render/chars/w3.js (with the helpers it uses) plus a third variant, pose.variant 'fallen'.
// 'form2' is the level-20 full form exactly as in the game. 'fallen' is drawn at the full-form size with the same silhouette, pose
// language and clips, but drained of colour: "as she fell, the Hexwitch cast one last spell, and it drank every colour out of the wood".
//   skin ash-grey, sunken cheeks; hair of dead roots; a charcoal hat split by cracks with a torn tip, a bone-white band under a crown of
//   dead thorns, a skull charm and a cobweb hanging from the brim; a bone-white tattered cloak with rot and cobwebs; an ash-grey dress;
//   treant bark growing up the broom handle with thorns and a screaming knothole; bleached dead straw; the crow stays black;
//   a cracked cauldron brewing something worse. The only colour is red: her eyes, the cracks in her face, the gem in the buckle, the
//   hex sigil through her dress, the knothole's eyes, the crow's eye, the brew, the hex orb, the zone slam and the teleport motes.
// pose: { idle, hex, zone, fade } (each 0..1, one at a time) and variant: undefined | 'form2' | 'fallen'. Same clips as the game entry.

import { E, PL, RR, S, SM, SO, mix, pal, rgba, rng } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/render/paint.js';
import { TAU } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/util.js';

// ---- the game's palettes (copied from w3.js) ----
const FACE = pal('#8fbf5a'), FACED = pal('#5f8a38'), HAT = pal('#2f2040'), BUCKLE = pal('#e0b04a'), DRESS = pal('#5a3a7a'), CLOAK = pal('#3a2652'), BOOT = pal('#3a2a2e'),
  HAIR = pal('#9a8ab8'), WOODB = pal('#7a5030'), STRAW = pal('#c9a45c'), TWINE = pal('#6a4a2a'), POT = pal('#3a3a44'), SPARK = '#d09bff', GREEN = '#8cff5a';
const HAT2 = pal('#1a0e2c'), BAND2 = pal('#b0182c'), DRESS2 = pal('#3c1c5e'), CLOAK2 = pal('#20103a'), STRAW2 = pal('#a67c3c'), CROW = pal('#2a1c36'), CHARM = pal('#e2d8c4'), CRACK = '#a8ff5e';

// ---- the fallen palettes: neutral greys (pal() tints its shadows purple and its rim warm, so the drained look gets its own mixer) ----
const gpal = b => ({ base:b, light:mix(b, '#ffffff', .45), dark:mix(b, '#141416', .42), deep:mix(b, '#060608', .68), rim:mix(b, '#ffffff', .6) });
const FACEF = gpal('#a4a4ac'), FACEDF = gpal('#5e5e66'), HATF = gpal('#202024'), BANDF = gpal('#d4d0c8'), BUCKLEF = gpal('#4e4e56'), DRESSF = gpal('#5a5a62'), CLOAKF = gpal('#cdc9c1'), BOOTF = gpal('#222226'),
  ROOT = gpal('#3c3836'), WOODF = gpal('#504c48'), BARK = gpal('#302c2a'), STRAWF = gpal('#7c7872'), TWINEF = gpal('#3a3836'), POTF = gpal('#2c2c32'), CROWF = gpal('#161618'), SKULL = gpal('#e6e2da'), THORN = gpal('#2a2624');
const RED = '#ff2a3a', REDL = '#ff8a80', REDD = '#6a0a14';

// Per-variant theme: every colour the drawing picks between the three forms.
const T1 = { dress:DRESS, cloak:CLOAK, straw:STRAW, hat:HAT, band:pal('#8a3a9a'), buckle:BUCKLE, boot:BOOT, wood:WOODB, twine:TWINE, pot:POT, crow:CROW, charm:CHARM, face:FACE, faced:FACED, hair:HAIR, iris:'#e0b020', glow:GREEN, crack:CRACK, claw:'#d8c8e0',
  brew:'#a8ff70', brewL:'#c8ffa0', fire1:'#7ae848', fire2:'#d8ffa0', orb:['rgba(140,255,90,.55)', 'rgba(160,110,230,.25)', 'rgba(160,110,230,0)'], orbCore:GREEN, mote:SPARK, moteL:'#f0ffe0', slam:'140,255,90', fadeCols:['#5aa040', '#7a4ab8', '#7a4ab8'], fadeGlow:['#a06ae0', '#a06ae0', '#a06ae0'] };
const T2 = { ...T1, dress:DRESS2, cloak:CLOAK2, straw:STRAW2, hat:HAT2, band:BAND2, claw:'#ece0f0', fadeCols:['#5aa040', '#a01a3a', '#7a4ab8'], fadeGlow:['#a06ae0', '#ff4a5a', '#a06ae0'] };
const TF = { dress:DRESSF, cloak:CLOAKF, straw:STRAWF, hat:HATF, band:BANDF, buckle:BUCKLEF, boot:BOOTF, wood:WOODF, twine:TWINEF, pot:POTF, crow:CROWF, charm:SKULL, face:FACEF, faced:FACEDF, hair:ROOT, iris:RED, glow:RED, crack:RED, claw:'#dcd8d0',
  brew:'#ff3a3a', brewL:'#ffb0a0', fire1:'#8a0a18', fire2:'#ff5a50', orb:['rgba(255,42,58,.6)', 'rgba(90,10,20,.3)', 'rgba(90,10,20,0)'], orbCore:RED, mote:'#8a8a90', moteL:'#ffb0a0', slam:'255,42,58', fadeCols:['#8a8a90', '#a01020', '#3a3a40'], fadeGlow:['#c8c8cc', '#ff2a3a', '#c8c8cc'] };

// ---------- helpers ----------
/** Witch face at (x, y) with head radius r, in theme T. o.jaw opens the mouth, o.glow lights the eyes, o.hair sways the hair. */
function witchFaceT(g, x, y, r, o, T, FL){
  g.save(); g.translate(x, y); g.scale(r / 17, r / 17);
  const jaw = (o.jaw ?? 0) * 5;
  if (FL){   // hair of dead roots: a thick taproot each side splitting into rootlets, tips curling
    for (const s of [-1, 1]){ const h = (o.hair ?? 0) * s;
      S.tube(g, SO([[s * 12, -9], [s * 21, 6 + h], [s * 19, 25]]), T.hair, 4.8);
      S.tube(g, SO([[s * 17, 1 + h * .5], [s * 23, 9 + h], [s * 24, 19]]), T.hair, 2.6);
      S.tube(g, SO([[s * 20, 13], [s * 15, 23], [s * 17, 31]]), T.hair, 2.2);
      S.tube(g, SO([[s * 13, -11], [s * 21, -5], [s * 24, 1]]), T.hair, 2.2);
      S.tube(g, SO([[s * 21, 20], [s * 23, 28], [s * 21, 34]]), T.hair, 1.4); }
  } else for (const s of [-1, 1]) S.tube(g, SO([[s * 13, -6], [s * 21, 8 + (o.hair ?? 0) * s], [s * 19, 24]]), T.hair, 4.5);
  const head = SM([[-16, -6], [-17, 6], [-10, 14], [0, 17], [10, 14], [17, 6], [16, -6], [8, -16], [-8, -16]]);
  S.part(g, head, T.face, { x:0, y:0, r:17 }, { mat:'skin' });
  if (FL){ S.contact(g, head, -12, 8, 7, 5, .4); S.contact(g, head, 12, 8, 7, 5, .4); S.contact(g, head, -7, -2, 5, 4, .35); S.contact(g, head, 7, -2, 5, 4, .35); }   // sunken cheeks and eye sockets
  S.ln(g, [[-11, -8], [-4, -6]], T.faced, 2, .7); S.ln(g, [[11, -8], [4, -6]], T.faced, 2, .7);
  const iris = o.glow && !FL ? T.glow : T.iris, lid = FL ? .34 : .28, tilt = FL ? .42 : .35;
  S.eye(g, -6.5, -1, 5.5, 6, { lx:.2, ly:.1, pr:.42, iris, lid, tilt:-tilt, lidCol:T.face.base, lidDeep:T.face.deep, pupil:FL ? '#3a0408' : undefined });
  S.eye(g, 6.5, -1, 5.5, 6, { lx:.2, ly:.1, pr:.42, iris, lid, tilt, lidCol:T.face.base, lidDeep:T.face.deep, pupil:FL ? '#3a0408' : undefined });
  if (o.glow){ g.save(); g.globalAlpha *= o.glow; S.glow(g, -5.5, -.5, FL ? 3 : 2.6, T.glow); S.glow(g, 7.5, -.5, FL ? 3 : 2.6, T.glow); g.restore(); }
  S.part(g, SM([[-2, -1], [3, 3], [8, 11], [3, 14], [-3, 8]], .7), T.face, { x:2, y:6, r:7 }, { flat:true, mat:'skin' });
  S.part(g, E(-9, 7, 2.2, 2), T.faced, { x:-9, y:7, r:2.2 }, { flat:true, noEdge:true });
  if (jaw > 0) S.dot(g, SM([[-8, 9], [0, 10 + jaw], [8, 8], [0, 8]], .8), FL ? '#0a0608' : '#2a1020');
  S.stroke(g, SO([[-9, 8], [-4, 12 + jaw * .4], [4, 12 + jaw * .4], [9, 7]]), T.face, 1.8);
  if (FL){ S.dot(g, PL([[-4, 11.5 + jaw * .3], [-1, 11.5 + jaw * .3], [-2.5, 15.5 + jaw * .3]]), '#d8d4cc'); S.dot(g, PL([[2, 11.2 + jaw * .3], [5, 11 + jaw * .3], [3.8, 14.5 + jaw * .3]]), '#c8c4bc');   // two cracked grey teeth, cracked lips
    S.ln(g, [[-6, 10], [-7, 13]], T.faced, .9, .6); S.ln(g, [[6, 9.5], [7.5, 12]], T.faced, .9, .6); }
  else S.dot(g, PL([[-3, 11.5 + jaw * .3], [0, 11.5 + jaw * .3], [-1.5, 16 + jaw * .3]]), '#fff');
  g.restore();
}
/** Long-fingered hand at (x, y): four thin fingers fanning around dir, spread by `sp` (0..1). */
function longHand(g, x, y, c, dir, sp = .5, len = 13){
  for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * (.22 + sp * .38); S.tube(g, SO([[x, y], [x + Math.cos(a) * len * .55, y + Math.sin(a) * len * .55], [x + Math.cos(a + .25) * len, y + Math.sin(a + .25) * len]]), c, 3.2); S.claw(g, x + Math.cos(a + .25) * len, y + Math.sin(a + .25) * len, a + .25, 3, '#d8c8e0'); }
  S.part(g, E(x, y, 6, 5.5), c, { x, y, r:6 }, { flat:true, mat:'skin' });
}
/** Magic orb: a glowing core with motes, size s and strength a (0..1), coloured by theme T. */
function orbT(g, x, y, s, a, T){
  if (a <= 0) return;
  g.save(); g.globalAlpha *= Math.min(1, a);
  const gr = g.createRadialGradient(x, y, 0, x, y, s * 2.2); gr.addColorStop(0, T.orb[0]); gr.addColorStop(.5, T.orb[1]); gr.addColorStop(1, T.orb[2]); g.fillStyle = gr; g.fillRect(x - s * 2.4, y - s * 2.4, s * 4.8, s * 4.8);
  S.glow(g, x, y, s, T.orbCore);
  const R = rng(19); for (let i = 0; i < 7; i++){ const an = R() * TAU + a * 3, d = s * (1.2 + R() * 1.4), rr = 1.2 + R() * 1.8; S.dot(g, E(x + Math.cos(an) * d, y + Math.sin(an) * d, rr, rr), i % 2 ? T.mote : T.moteL, .9); }
  g.restore();
}
/** Cobweb: a fan of strands from (x, y) across angles a0..a1 to radius r, with sagging rings. */
function web(g, x, y, r, a0, a1, n = 5, rings = 3, al = .5){
  g.save(); g.strokeStyle = `rgba(238,238,242,${al})`; g.lineWidth = .9; g.lineCap = 'round';
  for (let i = 0; i <= n; i++){ const a = a0 + (a1 - a0) * i / n; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); }
  for (let k = 1; k <= rings; k++){ const rr = r * (k / rings) ** 1.2; g.beginPath();
    for (let i = 0; i <= n; i++){ const a = a0 + (a1 - a0) * i / n, px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (i){ const pa = a0 + (a1 - a0) * (i - 1) / n, ma = (a + pa) / 2, mr = rr - rr * .14; g.quadraticCurveTo(x + Math.cos(ma) * mr, y + Math.sin(ma) * mr, px, py); } else g.moveTo(px, py); }
    g.stroke(); }
  g.restore();
}
/** Crack lines: a pale lit edge over a dark groove, for the split hat and the cracked iron. */
function cracks(g, lines, lit = 'rgba(200,200,206,.55)', dark = 'rgba(0,0,0,.6)', w = 1.1){
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const pts of lines){ g.strokeStyle = dark; g.lineWidth = w * 1.5; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
    g.strokeStyle = lit; g.lineWidth = w * .6; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0] - .5, p[1] - .7) : g.moveTo(p[0] - .5, p[1] - .7)); g.stroke(); }
  g.restore();
}

// ---------- the boss ----------
/** Witch astride a broom: idle hover (P.idle), two-handed hex (P.hex), broom raised and slammed (P.zone), teleport fade (P.fade). */
export function fallenHexwitch(g, P = {}){
  const F2 = P.variant === 'form2', FL = P.variant === 'fallen', FULL = F2 || FL;
  const idle = P.idle, hx = P.hex ?? 0, zn = P.zone, fade = P.fade ?? 0;
  const T = FL ? TF : F2 ? T2 : T1;
  const dress = T.dress, cloakC = T.cloak, strawC = T.straw, hatC = T.hat, bandC = T.band;
  const br = idle == null ? 0 : Math.sin(idle * TAU), bob = br * 4;
  const R = rng(9);
  // full-form hat: wider and more crooked, a charm swinging from the brim. The fallen hat is split by cracks with a torn tip,
  // wears a crown of dead thorns over its bone-white band, a red gem in the buckle, a skull charm and a cobweb under the brim.
  const hat2 = (x, y, w, tip) => { const h = w * 2.3;
    const cone = SM([[x - w * .58, y + 1], [x - w * .4, y - h * .42], [x - w * .12 + tip * .4, y - h * .8], [x + w * .12 + tip, y - h - 3], [x + w * .3 + tip * .7, y - h * .8], [x + w * .33, y - h * .42], [x + w * .58, y + 1]], .8);
    S.part(g, cone, hatC, { x, y:y - h * .3, r:w * .95 }, { mat:'cloth', hx:x - w * .18, hy:y - h * .45 });
    S.crease(g, SO([[x - w * .22, y - h * .12], [x - w * .12, y - h * .5], [x + tip * .3, y - h * .78]]), hatC, 2, .4); S.crease(g, SO([[x + w * .18, y - h * .1], [x + w * .2, y - h * .45]]), hatC, 1.6, .35);
    if (FL){ g.save(); cone(g); g.clip();   // the cracks, a torn hole showing its grey lining, and dust on the cloth
      const hx0 = x + w * .06 + tip * .42, hy0 = y - h * .64;
      S.dot(g, PL([[hx0 - w * .11, hy0 + h * .02], [hx0 - w * .06, hy0 - h * .06], [hx0 + w * .01, hy0 - h * .03], [hx0 + w * .05, hy0 - h * .09], [hx0 + w * .1, hy0 - h * .02], [hx0 + w * .06, hy0 + h * .05], [hx0 - w * .02, hy0 + h * .03], [hx0 - w * .06, hy0 + h * .08]]), '#050506', .95);
      g.strokeStyle = 'rgba(205,205,210,.55)'; g.lineWidth = .7; g.lineCap = 'round';
      for (const [ax, ay, bx, by] of [[-.11, .02, .1, -.02], [-.06, -.06, .06, .05], [.01, -.03, -.06, .08], [.05, -.09, -.02, .03]]){ g.beginPath(); g.moveTo(hx0 + w * ax, hy0 + h * ay); g.quadraticCurveTo(hx0 + w * (ax + bx) / 2, hy0 + h * (ay + by) / 2 + 1.5, hx0 + w * bx, hy0 + h * by); g.stroke(); }
      for (const [px, py] of [[-.11, .02], [.05, -.09], [.1, -.02], [-.06, .08]]) S.thread(g, hx0 + w * px, hy0 + h * py, px < 0 ? -1 : 1, hatC);
      cracks(g, [[[x - w * .3, y - h * .3], [x - w * .18, y - h * .48], [x - w * .2, y - h * .6], [x - w * .08 + tip * .3, y - h * .72]], [[x - w * .18, y - h * .48], [x - w * .06, y - h * .44]], [[x + w * .3, y - h * .2], [x + w * .22, y - h * .34], [x + w * .26 + tip * .3, y - h * .52]], [[x - w * .34, y - h * .12], [x - w * .26, y - h * .2]], [[x + w * .08 + tip * .6, y - h * .86], [x + w * .14 + tip * .8, y - h * .96]]]);
      g.restore(); }
    S.part(g, SM([[x - w * .5, y - 1], [x + w * .5, y - 1], [x + w * .38, y - h * .24], [x - w * .42, y - h * .24]], .5), bandC, { x, y:y - h * .12, r:w * .5 }, { flat:true, mat:FL ? 'bone' : 'cloth' });
    S.part(g, RR(x - w * .12, y - h * .2, w * .24, h * .15, 2), T.buckle, { x, y:y - h * .12, r:w * .14 }, { flat:true, mat:'metal' });
    if (FL){ S.glow(g, x, y - h * .125, 2.6, RED);   // the gem
      // crown of dead thorns: brambles wound across the band, thorns pointing up and out
      const bra = [[[x - w * .5, y - h * .06], [x - w * .34, y - h * .21], [x - w * .18, y - h * .12], [x - w * .04, y - h * .23]], [[x + w * .04, y - h * .08], [x + w * .18, y - h * .23], [x + w * .34, y - h * .12], [x + w * .5, y - h * .2]]];
      for (const b of bra) S.tube(g, SO(b, .8), THORN, 1.6);
      for (const [q, a, l] of [[-.44, -2.4, 8], [-.3, -2, 9], [-.17, -1.75, 10], [-.05, -1.55, 11], [.07, -1.45, 10], [.19, -1.3, 9], [.31, -1.1, 8], [.42, -.85, 7]]) S.claw(g, x + w * q, y - h * .235 - w * q * .02, a, l, '#8c8882');
      for (const [q, a, l] of [[-.3, -2.3, 5], [.2, -1.2, 5]]) S.claw(g, x + w * q, y - h * .215, a, l, '#5a5650'); }
    S.part(g, E(x, y, w, w * .27), hatC, { x, y, r:w }, { flat:true, mat:'cloth', hx:x - w * .3, hy:y - w * .08 });
    if (FL){ cracks(g, [[[x + w * .4, y + w * .2], [x + w * .6, y + w * .1], [x + w * .8, y + w * .16]], [[x - w * .7, y + w * .18], [x - w * .5, y + w * .1]]], 'rgba(180,180,186,.5)', 'rgba(0,0,0,.5)', 1);
      web(g, x + w * .62, y + w * .22, w * .36, Math.PI * .3, Math.PI * .95, 5, 3, .55); }   // the cobweb hanging under the brim
    const cx = x - w * .9 + br * 1.5, cy = y + 14; S.ln(g, [[x - w * .82, y + 1], [cx, cy - 2]], T.twine, 1.3, .9);
    g.save(); g.translate(cx, cy); g.rotate(.35 - br * .15);
    if (FL){ S.part(g, SM([[-6, -7], [6, -7], [8, 0], [5, 6], [-5, 6], [-8, 0]], .7), SKULL, { x:0, y:-1, r:7 }, { mat:'bone', hx:-2, hy:-4, lw:1 }); S.dot(g, E(-3, -2, 1.8, 2), '#0a0608'); S.dot(g, E(3, -2, 1.8, 2), '#0a0608'); S.ln(g, [[-3, 4], [3, 4]], SKULL, 1, .6); for (const d of [-2, 0, 2]) S.ln(g, [[d, 3], [d, 6]], SKULL, .7, .6); }
    else { S.part(g, RR(-8, -2.2, 16, 4.4, 2), T.charm, { x:0, y:0, r:8 }, { flat:true, mat:'bone', lw:1 }); for (const d of [-8, 8]) for (const e of [-2.2, 2.2]) S.part(g, E(d, e, 3.2, 2.8), T.charm, { x:d, y:e, r:3.2 }, { flat:true, mat:'bone', lw:1 }); }
    g.restore(); };
  // full-form hand: longer fingers ending in long pale claws
  const hand2 = (x, y, c, dir, sp = .5, len = 16) => { for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * (.22 + sp * .38); S.tube(g, SO([[x, y], [x + Math.cos(a) * len * .55, y + Math.sin(a) * len * .55], [x + Math.cos(a + .25) * len, y + Math.sin(a + .25) * len]]), c, 3.4); S.claw(g, x + Math.cos(a + .25) * len, y + Math.sin(a + .25) * len, a + .25, 6, T.claw); }
    S.part(g, E(x, y, 6.5, 6), c, { x, y, r:6.5 }, { flat:true, mat:'skin' }); };
  if (FULL){ g.save(); g.translate(0, 52); g.scale(1.12, 1.12); g.translate(0, -52); }
  if (fade > 0){
    for (let i = 0; i < 12; i++){ const x = (R() - .5) * 120, y0 = -80 + R() * 130, rr = 4 + R() * 6, y = y0 - fade * 70 - R() * 20, a = Math.max(0, (1 - fade) * .6) * (fade < .15 ? fade / .15 : 1); g.save(); g.globalAlpha *= a; g.shadowColor = T.fadeGlow[i % 3]; g.shadowBlur = 8; S.dot(g, E(x + Math.sin(fade * 6 + i) * 8, y, rr * (1 + fade * 1.5), rr * (1 + fade * 1.5)), T.fadeCols[i % 3]); g.restore(); }
    if (fade >= 1){ if (FULL) g.restore(); return; }
    g.save(); g.globalAlpha *= 1 - fade; g.translate(0, -fade * 30); g.scale(1, 1 - fade * .3); }
  // broom pose: raised then slammed on the zone clip
  let tilt = -.12 + br * .03, lift = 0, slam = 0;
  if (zn != null){ if (zn < .45){ const q = zn / .45; tilt = -.12 + Math.sin(q * Math.PI / 2) * .67; lift = -q * 16; } else if (zn < .65){ const q = (zn - .45) / .2; tilt = .55 - q * .87; lift = -16 + q * 24; slam = q; } else { const q = (zn - .65) / .35; tilt = -.32 + q * .2; lift = 8 - q * 8; slam = 1 - q * .6; } }
  S.shadow(g, 0, 52, 62, 9);
  if (FL){   // ash drifting up around her (seeded, cycles with the idle phase)
    const Ra = rng(77); for (let i = 0; i < 12; i++){ const x0 = (Ra() - .5) * 170, y0 = -70 + Ra() * 130, ph = ((idle ?? 0) + Ra()) % 1, y = y0 - ph * 36, a = Math.sin(ph * Math.PI) * .55; S.dot(g, E(x0 + Math.sin(ph * TAU + i) * 4, y, 1.5 + Ra() * 1.4, 1.1 + Ra() * .6, Ra() * 3), i % 3 ? '#b4b4ba' : '#6e6e74', a); } }
  g.save(); g.translate(0, bob + lift);
  // the broom: a long handle, straw bundle bound with twine, a little cauldron hooked on the tip
  g.save(); g.translate(0, 18); g.rotate(tilt);
  const sway = idle == null ? 0 : Math.sin(idle * TAU * 2) * 3;
  const straw = SM([[-48, -8], [-84, -16 + sway, 1], [-94, -4 + sway * .5, 1], [-92, 14, 1], [-96, 28 - sway * .5, 1], [-80, 26 - sway, 1], [-50, 12]], .6);
  S.part(g, straw, strawC, { x:-72, y:6, r:26 }, { mat:'wood', hx:-70, hy:-6 });
  g.save(); straw(g); g.clip(); for (let i = -14; i <= 26; i += 5) S.ln(g, [[-52, i * .5 - 2], [-96, i + sway * (i < 4 ? -.6 : .6)]], strawC, 1.1, .45); g.restore();
  S.part(g, RR(-56, -10, 10, 24, 3), T.twine, { x:-51, y:2, r:10 }, { flat:true, mat:'leather' }); for (const y of [-6, 0, 6]) S.ln(g, [[-56, y], [-46, y + 1]], T.twine, 1, .5);
  S.tube(g, SO([[-48, 2], [0, -2], [62, -8]]), T.wood, 6); S.ln(g, [[-40, -1], [60, -10]], { deep:T.wood.light }, 1, .5);
  if (FL){   // treant bark grown up the handle: a knotted sleeve, thorns, and a screaming knothole with red eyes
    const bark = SM([[14, -6], [24, -11], [40, -13], [56, -15], [64, -14, 1], [62, -6, 1], [50, -4], [36, -2], [22, 1], [12, 0]], .7);
    S.part(g, bark, BARK, { x:40, y:-7, r:26 }, { mat:'wood', hx:28, hy:-10 });
    S.crease(g, SO([[18, -3], [32, -7], [50, -10]]), BARK, 1.4, .5); S.crease(g, SO([[22, -1], [38, -4], [58, -9]]), BARK, 1.2, .4);
    for (const [x, y, a, l] of [[20, -10, -1.9, 8], [32, -12, -1.5, 10], [48, -14, -1.3, 9], [60, -15, -1.1, 7], [26, 0, 1.5, 5], [54, -3, 1.3, 5], [14, -2, -2.5, 6]]) S.claw(g, x, y, a, l, '#8c8882');
    S.part(g, E(55, -9, 7, 6), BARK, { x:55, y:-9, r:7 }, { flat:true, mat:'wood', noEdge:true });
    S.dot(g, SM([[50.5, -8], [53, -12], [57, -12], [59.5, -8], [57, -4], [53, -4]], .7), '#060608', .95);
    S.glow(g, 52.5, -12.5, 1.3, RED); S.glow(g, 57.5, -12.5, 1.3, RED); }
  S.stroke(g, SO([[62, -8], [66, 4], [70, 10]]), T.twine, 1.4, .8);
  if (FULL){   // the crow familiar perched on the straw, facing its mistress, wings lifting with the breath, one red eye
    g.save(); g.translate(-72, -18 + sway * .8); const flap = Math.max(0, br) * 5 + (zn != null ? slam * 6 : 0) + hx * 4;
    for (const s of [-1, 1]) S.part(g, SM([[s * 4, -6], [s * 12, -12 - flap], [s * 22, -14 - flap * 1.4], [s * 20, -6 - flap * .6, 1], [s * 14, -2, 1], [s * 6, 2, 1]], .7), T.crow, { x:s * 12, y:-8, r:12 }, { flat:true, mat:'leather', lw:1.2 });
    S.part(g, SM([[-8, -10], [-14, -2], [-18, 6, 1], [-12, 6, 1], [-4, 3], [6, 4], [12, -2], [8, -10], [0, -13]], .8), T.crow, { x:-2, y:-3, r:11 }, { mat:'leather', hx:-6, hy:-8 });
    S.part(g, E(9, -13, 6.5, 6), T.crow, { x:9, y:-13, r:6.5 }, { mat:'leather', hx:7, hy:-16 });
    S.part(g, PL([[13, -14], [22, -12], [13, -10]]), FL ? gpal('#7a7672') : pal('#e8a040'), { x:16, y:-12, r:4 }, { flat:true, lw:.8 });
    S.glow(g, 10, -14, 2, '#ff3a3a');
    for (const d of [-2, 3]) S.tube(g, SO([[d, 4], [d + 1, 9]]), FL ? gpal('#7a7672') : pal('#e8a040'), 1.6);
    g.restore(); }
  g.save(); g.translate(70, 18); S.part(g, SM([[-9, -8], [9, -8], [11, 4], [0, 9], [-11, 4]], .6), T.pot, { x:0, y:0, r:10 }, { mat:'metal', flat:true }); S.tube(g, SO([[-11, -6], [11, -6]]), T.pot, 2.5);
  if (FL) cracks(g, [[[-8, -2], [-4, 2], [-5, 6]], [[6, -3], [8, 3]]], 'rgba(170,170,176,.45)', 'rgba(0,0,0,.7)', 1);
  g.save(); g.shadowColor = T.glow; g.shadowBlur = 8; S.dot(g, E(0, -7, 8, 2.5), T.brew, .95); g.restore(); for (const [x, y] of [[-3, -12], [3, -15]]) S.dot(g, E(x, y - br * 2, 1.6, 1.6), T.brewL, .8);
  if (FULL){   // boiling over: tongues of fire licking up, bright drips running down the side (green for the full form, red for the fallen)
    g.save(); g.shadowColor = T.glow; g.shadowBlur = 10; const lick = br * 3;
    S.dot(g, SM([[-9, -6], [-11, -16 - lick, 1], [-5, -12], [-3, -26 + lick, 1], [1, -14], [5, -30 - lick, 1], [7, -14], [11, -20 + lick, 1], [9, -6]], .6), T.fire1, .9);
    S.dot(g, SM([[-5, -8], [-6, -16 - lick, 1], [-1, -12], [1, -22 + lick, 1], [4, -13], [5, -8]], .6), T.fire2, .9);
    for (const [x, y, l] of [[-10, -3, 7 + Math.max(0, br) * 2], [9, -1, 5], [-4, 3, 4]]) { S.dot(g, RR(x - 1.2, y - 2, 2.4, l, 1.2), T.brew, .85); S.dot(g, E(x, y + l - 1, 1.8, 1.8), T.brewL, .9); }
    if (FL){ g.shadowBlur = 0; const Rs = rng(5); for (let i = 0; i < 6; i++){ const x = -6 + Rs() * 12, y = -26 - Rs() * 16 - Math.max(0, br) * 4, rr = 3 + Rs() * 3; S.dot(g, E(x, y, rr, rr * .8, Rs() * 3), '#3a3a40', .5); } }   // black smoke over the brew
    g.restore(); }
  g.restore();
  g.restore();
  if (slam > 0){ g.save(); g.globalAlpha *= slam * .8; S.dot(g, E(-72, 48, 34 * slam + 10, 6), FL ? '#1a1a1e' : '#3a1a4a', .5); const gr = g.createRadialGradient(-72, 44, 4, -72, 44, 30 + slam * 36); gr.addColorStop(0, `rgba(${T.slam},.5)`); gr.addColorStop(1, `rgba(${T.slam},0)`); g.fillStyle = gr; g.fillRect(-140, -20, 140, 90); g.restore(); }
  // legs dangling in front of the broom, boots
  for (const s of [-1, 1]){ const k = br * 2 * s; S.tube(g, SO([[s * 8, 14], [s * 12 + k, 30], [s * 10 + k, 42]]), dress, 9); S.part(g, SM([[s * 4 + k, 40], [s * 16 + k, 40], [s * 20 + k, 50], [s * 8 + k, 52], [s * 2 + k, 47]], .6), T.boot, { x:s * 10 + k, y:46, r:9 }, { flat:true, mat:'leather' }); }
  // cloak flaring behind, then the dress and torso
  const fl = idle == null ? 0 : Math.sin(idle * TAU + 1) * 4;
  const cloak = SM([[-18, -34], [-38, -10], [-50, 20 + fl, 1], [-36, 14, 1], [-26, 26 + fl, 1], [-10, 18, 1], [4, 28 + fl, 1], [18, 18, 1], [30, 26 + fl, 1], [40, 14, 1], [50, 22 + fl, 1], [38, -10], [18, -34]], .8);
  S.part(g, cloak, cloakC, { x:0, y:-4, r:48 }, { mat:'cloth', hx:-20, hy:-22 }); S.crease(g, SO([[-26, -18], [-34, 10]]), cloakC, 2.2, .4); S.crease(g, SO([[26, -18], [34, 10]]), cloakC, 2.2, .4);
  if (FL){ g.save(); cloak(g); g.clip();   // rot: grey mottling creeping up from the hem, moth holes, and cobwebs strung between the points
    const gr = g.createLinearGradient(0, -10, 0, 30); gr.addColorStop(0, 'rgba(70,70,76,0)'); gr.addColorStop(1, 'rgba(70,70,76,.55)'); g.fillStyle = gr; g.fillRect(-60, -40, 120, 80);
    const Rr = rng(13); for (let i = 0; i < 9; i++){ const x = (Rr() - .5) * 90, y = -6 + Rr() * 30, rr = 1.5 + Rr() * 2.5; S.dot(g, E(x, y, rr, rr * .7, Rr() * 3), '#2a2a2e', .7); }
    g.restore();
    web(g, -50, 20 + fl, 22, -Math.PI * .5, -Math.PI * .02, 4, 3, .45); web(g, 50, 22 + fl, 22, -Math.PI * .98, -Math.PI * .5, 4, 3, .45); }
  for (const [x, y] of [[-50, 20 + fl], [-26, 26 + fl], [4, 28 + fl], [30, 26 + fl], [50, 22 + fl]]) S.thread(g, x, y, 1, cloakC);
  const torso = SM([[-16, -40], [-20, -12], [-16, 18], [0, 22], [16, 18], [20, -12], [16, -40], [0, -44]], .8);
  S.part(g, torso, dress, { x:0, y:-10, r:26 }, { mat:'cloth' }); S.crease(g, SO([[-7, -30], [-9, 10]]), dress, 1.8, .4); S.crease(g, SO([[7, -30], [10, 10]]), dress, 1.8, .4);
  if (FULL){ g.save(); torso(g); g.clip(); g.shadowColor = T.crack; g.shadowBlur = FL ? 7 : 5; g.strokeStyle = rgba(T.crack, .5 + Math.max(0, br) * .2 + hx * .3); g.lineWidth = FL ? 1.6 : 1.4; g.lineCap = 'round';   // a hex sigil glowing through the dress
    g.beginPath(); g.moveTo(0, -30); g.lineTo(9, -16); g.lineTo(-9, -16); g.closePath(); g.moveTo(0, -12); g.lineTo(9, -26); g.lineTo(-9, -26); g.closePath(); g.stroke();
    if (FL){ g.beginPath(); g.arc(0, -21, 12.5, 0, TAU); g.stroke(); g.fillStyle = rgba(RED, .25 + hx * .3); g.beginPath(); g.arc(0, -21, 12.5, 0, TAU); g.fill(); }   // the fallen sigil is ringed and bleeds through the cloth
    g.restore(); }
  S.tube(g, SO([[-19, 0], [19, 0]]), T.boot, 4); S.part(g, RR(-4, -4, 8, 8, 1.5), T.buckle, { x:0, y:0, r:4 }, { flat:true, mat:'metal' });
  // arms: resting on the broom, both raised and spread in the hex, gripping the handle in the zone slam
  const cast = Math.sin(Math.min(1, hx * 1.25) * Math.PI) ** .6, glowA = hx > 0 ? Math.max(0, Math.sin(hx * Math.PI)) : 0;
  for (const s of [-1, 1]){
    let ex, ey, px, py, dir, sp;
    if (zn != null){ const gx = s * 26, gy = 18 + Math.sin(tilt) * -gx * .9; ex = s * 22; ey = -2; px = gx; py = gy - 6; dir = Math.PI / 2 + tilt; sp = .2; }
    else { const t2 = cast; ex = s * (30 + t2 * 8); ey = -12 - t2 * 8; px = s * (44 - t2 * 12); py = -6 - t2 * 14; dir = s < 0 ? Math.PI * .85 - t2 * 2.4 : Math.PI * .15 + t2 * 2.4; sp = .3 + t2 * .7; if (idle != null){ px += Math.sin(idle * TAU + s) * 2; py += br * 2; } }
    S.tube(g, SO([[s * 16, -30], [ex, ey], [px, py]]), dress, 9); S.contact(g, torso, s * 16, -30, 8, 8, .35); if (FULL) hand2(px, py, T.face, dir, sp); else longHand(g, px, py, T.face, dir, sp);
  }
  if (glowA > 0) orbT(g, 0, -20 - cast * 4, 5 + cast * 5 + (FULL ? 2 : 0), glowA, T);
  // head with the big hat
  const nod = zn == null ? 0 : (zn < .45 ? -zn * .3 : slam * .18);
  g.save(); g.translate(0, -50); g.rotate(nod); witchFaceT(g, 0, 0, 22, { glow:(FL ? .9 : F2 ? .6 : .35) + glowA * (FULL ? .4 : .65), hair:br * 2 }, T, FL);
  if (FULL){ g.save(); g.shadowColor = T.crack; g.shadowBlur = 6; g.strokeStyle = rgba(T.crack, .6 + glowA * .4); g.lineWidth = 1.5; g.lineCap = 'round'; g.lineJoin = 'round';   // glowing crack-lines splitting the face
    for (const pts of [[[-13, -12], [-17, -3], [-14, 5], [-18, 12]], [[-9, 6], [-12, 13]], [[12, -14], [15, -5], [12, 3], [16, 11]], [[9, 8], [12, 15]], [[-6, -16], [-3, -10]], [[4, -17], [7, -11]]]){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
    g.restore(); }
  g.restore();
  S.contact(g, torso, 0, -40, 14, 5, .45);
  g.save(); g.translate(0, -50); g.rotate(nod); if (FULL) hat2(2, -22, 42, 16 + br * 3 - cast * 10); else witchHatT(g, 2, -22, 38, 12 + br * 3 - cast * 8, T); g.restore();
  g.restore();
  if (fade > 0) g.restore();
  if (FULL) g.restore();
}
/** Form-1 hat (the game's witchHat with the hexwitch's band colour): brim centred at (x, y) with half-width w, a crooked cone whose tip leans by `tip`. */
function witchHatT(g, x, y, w, tip, T){
  const h = w * 2.3;
  const cone = SM([[x - w * .58, y + 1], [x - w * .4, y - h * .42], [x - w * .12 + tip * .4, y - h * .8], [x + w * .12 + tip, y - h - 3], [x + w * .3 + tip * .7, y - h * .8], [x + w * .33, y - h * .42], [x + w * .58, y + 1]], .8);
  S.part(g, cone, T.hat, { x, y:y - h * .3, r:w * .95 }, { mat:'cloth', hx:x - w * .18, hy:y - h * .45 });
  S.crease(g, SO([[x - w * .22, y - h * .12], [x - w * .12, y - h * .5], [x + tip * .3, y - h * .78]]), T.hat, 2, .4);
  S.part(g, SM([[x - w * .5, y - 1], [x + w * .5, y - 1], [x + w * .38, y - h * .24], [x - w * .42, y - h * .24]], .5), T.band, { x, y:y - h * .12, r:w * .5 }, { flat:true, mat:'cloth' });
  S.part(g, RR(x - w * .12, y - h * .2, w * .24, h * .15, 2), T.buckle, { x, y:y - h * .12, r:w * .14 }, { flat:true, mat:'metal' });
  S.part(g, E(x, y, w, w * .27), T.hat, { x, y, r:w }, { flat:true, mat:'cloth', hx:x - w * .3, hy:y - w * .08 });
}

// ---------- registry entry (copied from W3.hexwitch; the box is widened for the thorn crown and the brew's smoke) ----------
export const FALLEN = {
  key:'hexwitch', name:'The Fallen Hexwitch', draw:fallenHexwitch, scale:.68, dy:-4,
  box:{ x:-124, y:-216, w:244, h:286 },
  variants:{ form2:true, fallen:true },
  clips:{ walk:{ n:8, fps:6, pose:t => ({ idle:t }) }, hex:{ n:8, fps:11, once:true, pose:t => ({ hex:t }) }, zone:{ n:8, fps:10, once:true, pose:t => ({ zone:t }) }, teleport:{ n:8, fps:16, once:true, pose:t => ({ fade:t }) } },
  still:{ hex:.5 },
};
