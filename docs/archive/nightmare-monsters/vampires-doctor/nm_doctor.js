// ---------- Nightmare Plague Doctor (nightmare Foggy Hollow), design archive ----------
// A copy of `doctor` from src/engine/render/chars/w2.js (with the helper it uses) plus a nightmare look, P.variant === 'rot':
// the Rot Doctor. Same stooped walk and censer swing, but the coat has rotted to a tattered, mould-spotted green-black with
// ooze dripping from the hem; the mask is cracked and the beak broken, dripping green; the lenses burn with ghostfire; the censer
// is a skull lantern with ghostfire pouring out of its crown; poison vials ride the strap; a carrion crow with a ghostfire eye
// perches on the ragged hat brim; poison fog curls round the shoes. The healing smoke is poison green.
// No variant draws the game's doctor unchanged (all its colours go through one palette table). Every pose param (walk, chew,
// heal) works for both.
// NOT for the game: lives in the owner's design archive.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';

const DOCTOR_HEAL_EVERY = 2;

// ---------- palettes: the game's (copied from w2.js) and the rot look ----------
const GAME = { COAT:pal('#3f4136'), COATD:pal('#2a2b22'), HAT:pal('#26261f'), MASK:pal('#d8cfa8'), BEAK:pal('#a8804a'), LENS:pal('#3a4a2a'), SATCH:pal('#6a8a3a'), BRASS:pal('#c09a3a'), GLOVE:pal('#5a4a3a'), STRAP:pal('#4a3320'), BAND:pal('#4a3a30'),
  GLOW:'#9fe07a', LENSG:'#c9f0a0', SMOKE:'#c8f0a0', CORE:'#e8ffd0' };
const ROT = { COAT:pal('#26302a'), COATD:pal('#141a16'), HAT:pal('#161a17'), MASK:pal('#b9b48a'), BEAK:pal('#7a6440'), LENS:pal('#18300f'), SATCH:pal('#3a3326'), BRASS:pal('#6e8f6a'), GLOVE:pal('#2c2a26'), STRAP:pal('#2a241c'), BAND:pal('#3a1a1e'),
  GLOW:'#6dff3a', LENSG:'#a8ff6a', SMOKE:'#8ee05a', CORE:'#eaffc8' };
const MOULD = pal('#58742c'), OOZE = pal('#5fd03a'), SKULL = pal('#d8d2b4'), CROW = pal('#1e1a26'), GLASS = pal('#9ab8a0');
const GF = '#6dff3a', GF2 = '#d8ffb0';

// ---------- helper copied from w2.js ----------
/** A soft puff of mist: translucent gradient ball with a faint rim. */
function puff(g, x, y, r, a = .7, col = '#e6f4fb'){
  const gr = g.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r); gr.addColorStop(0, rgba('#ffffff', a)); gr.addColorStop(.55, rgba(col, a * .75)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; ell(g, x, y, r, r * .9); g.fill();
}

// ---------- rot helpers ----------
/** Ghostfire: a flickering green flame with a pale core, k = 0..1 flicker phase. */
function ghostfire(g, x, y, h, k, wd = 1){
  const f = Math.sin(k * TAU), f2 = Math.sin(k * TAU * 2 + 1);
  g.save(); g.shadowColor = GF; g.shadowBlur = 10;
  S.dot(g, SM([[x - 6 * wd, y], [x - 5 * wd + f, y - h * .45], [x - 1 + f2 * 2, y - h, 1], [x + 2 * wd + f, y - h * .55], [x + 3 * wd - f2, y - h * .7, 1], [x + 6 * wd, y - h * .3], [x + 5 * wd, y + 2], [x, y + 3]], .8), GF, .85);
  g.restore();
  S.dot(g, SM([[x - 3 * wd, y], [x - 1 + f * .6, y - h * .55, 1], [x + 3 * wd, y - h * .2], [x, y + 1.5]], .8), GF2, .9);
}
/** A drip of ooze hanging from (x, y), stretched by k (0..1). */
function ooze(g, x, y, k, s = 1){ const L = (3 + k * 7) * s; S.part(g, SM([[x - 2 * s, y], [x + 2 * s, y], [x + 1.2 * s, y + L * .6], [x + 2.4 * s, y + L], [x, y + L + 2.4 * s], [x - 2.4 * s, y + L], [x - 1.2 * s, y + L * .6]], .8), OOZE, { x, y:y + L * .6, r:L * .6 + 2 }, { flat:true, lw:.8 });
  g.save(); g.shadowColor = GF; g.shadowBlur = 5; S.dot(g, E(x - .7 * s, y + L, .8 * s, 1.1 * s), GF2, .9); g.restore(); }
/** The skull lantern that replaces the censer: a skull hanging by its crown, ghostfire pouring out of the top, sockets alight. */
function skullLantern(g, ex, ey, raise, k){
  ghostfire(g, ex, ey - 8, 14 + raise * 10, k, 1.1);
  const sk = SM([[ex - 8, ey - 6], [ex - 9, ey + 1], [ex - 6, ey + 6], [ex - 4, ey + 10, 1], [ex + 4, ey + 10, 1], [ex + 6, ey + 6], [ex + 9, ey + 1], [ex + 8, ey - 6], [ex, ey - 10]], .85);
  S.part(g, sk, SKULL, { x:ex, y:ey, r:10 }, { mat:'bone', hx:ex - 3, hy:ey - 5 });
  S.ln(g, [[ex - 7, ey - 7], [ex + 7, ey - 7]], SKULL, 1.4, .5);   // the sawn-open crown
  g.save(); g.shadowColor = GF; g.shadowBlur = 6 + raise * 8; for (const s of [-1, 1]) S.dot(g, SM([[ex + s * 1.6, ey - 2], [ex + s * 6, ey - 2.5], [ex + s * 5.5, ey + 2.5], [ex + s * 2, ey + 2]], .8), GF); g.restore();
  for (const s of [-1, 1]) S.dot(g, E(ex + s * 3.8, ey - .2, 1.1, 1.1), GF2, .95);
  S.dot(g, PL([[ex, ey + 2.5], [ex - 1.4, ey + 5], [ex + 1.4, ey + 5]]), SKULL.deep, .8);
  for (let i = -2; i <= 2; i++) S.ln(g, [[ex + i * 1.6, ey + 7], [ex + i * 1.6, ey + 9.6]], SKULL, .8, .6);
}
/** A carrion crow perched on the hat brim, ragged and thin, with a ghostfire eye. */
function crow(g, x, y, k){
  const nod = Math.sin(k * TAU) * 1.2;
  S.ln(g, [[x - 2, y], [x - 3, y - 4]], CROW, 1.4, .9); S.ln(g, [[x + 2, y], [x + 2, y - 4]], CROW, 1.4, .9);
  const tail = SM([[x - 4, y - 8], [x - 16, y - 2, 1], [x - 12, y - 6, 1], [x - 17, y - 7, 1], [x - 7, y - 12]], .7); S.part(g, tail, CROW, { x:x - 10, y:y - 7, r:8 }, { flat:true, mat:'cloth' });
  const body = SM([[x - 8, y - 9], [x - 2, y - 15], [x + 6, y - 14], [x + 8, y - 8], [x + 3, y - 3], [x - 4, y - 4]], .85); S.part(g, body, CROW, { x, y:y - 9, r:9 }, { mat:'cloth', hx:x - 2, hy:y - 12 });
  const wing = SM([[x - 6, y - 11], [x + 4, y - 12], [x - 2, y - 6, 1], [x - 4, y - 8, 1], [x - 8, y - 5, 1]], .7); S.part(g, wing, pal(CROW.light), { x:x - 2, y:y - 9, r:7 }, { flat:true, mat:'cloth' });
  g.save(); g.translate(0, nod);
  const hd = E(x + 7, y - 17, 5.5, 5); S.part(g, hd, CROW, { x:x + 7, y:y - 17, r:5.5 }, { mat:'cloth', hx:x + 5, hy:y - 19 });
  S.part(g, PL([[x + 11, y - 19], [x + 20, y - 15.5], [x + 11, y - 15]]), pal('#4a4450'), { x:x + 14, y:y - 17, r:4 }, { flat:true, lw:.8 });
  S.glow(g, x + 8.5, y - 18, 1.7, GF);
  g.restore();
}

// ---------- the game's Plague Doctor (copied; colours through the palette table) with the rot look added ----------
export function nmDoctor(g, P = {}){
  const N = P.variant === 'rot', C = N ? ROT : GAME;
  const { COAT, COATD, HAT, MASK, BEAK, LENS, SATCH, BRASS, GLOVE, STRAP } = C;
  const w = P.walk, ch = P.chew, heal = P.heal ?? 0, ph = (w ?? ch ?? 0) * TAU;
  const bob = w != null ? -Math.abs(Math.sin(ph)) * 2 : ch != null ? Math.sin(ph) * 2 : 0, peck = ch == null ? 0 : .5 + .5 * Math.sin(ph), stoop = .12 + (w != null ? Math.sin(ph) * .03 : 0) + peck * .12;
  const raise = Math.sin(Math.min(1, heal) * Math.PI);   // the censer swings up and back down during a heal
  const k = w ?? ch ?? heal;   // flicker phase for the ghostfire
  S.shadow(g, 0, 52, 32, 6);
  if (N) for (let i = 0; i < 5; i++){ const x = -30 + i * 15, t = (k + i * .23) % 1; puff(g, x + Math.sin((k + i * .3) * TAU) * 3, 48 - t * 6, 9 + (i % 2) * 3, .38, '#4f8a2a'); }   // poison fog round the shoes
  // shoes
  for (const s of [-1, 1]){ const p = w == null ? 0 : ph + (s < 0 ? 0 : Math.PI), dx = w == null ? 0 : Math.cos(p) * 3, dy = w == null ? 0 : -Math.max(0, Math.sin(p)) * 3; S.part(g, SM([[s * 6 + dx, 44 + dy], [s * 20 + dx, 44 + dy], [s * 22 + dx, 51 + dy], [s * 4 + dx, 51 + dy]], .6), GLOVE, { x:s * 13 + dx, y:48 + dy, r:9 }, { flat:true, mat:'leather' }); }
  g.save(); g.translate(0, bob);
  // long coat with a swinging hem, stooped forward (shoulders hunched up); the rot coat is torn to tatters at the hem
  const swing = w != null ? Math.sin(ph) * 3 : 0;
  const coat = N
    ? SM([[-12, -30], [-30, -14], [-32, 12], [-32 + swing, 46, 1], [-25 + swing, 37, 1], [-19 + swing, 49, 1], [-11 + swing, 39, 1], [-3, 50, 1], [5 + swing, 40, 1], [13 + swing, 50, 1], [21 + swing, 38, 1], [31 + swing, 47, 1], [32, 12], [30, -14], [12, -30]], .8)
    : SM([[-12, -30], [-30, -14], [-32, 12], [-30 + swing, 46], [-10 + swing, 49], [0, 47], [12 + swing, 49], [30 + swing, 46], [32, 12], [30, -14], [12, -30]], .8);
  S.part(g, coat, COAT, { x:0, y:8, r:42 }, { mat:'leather', hx:-16, hy:-14 });
  if (N){ g.save(); coat(g); g.clip(); for (const [x, y, r] of [[-22, -8, 5], [24, -12, 4.5], [-14, 30, 6], [20, 32, 4.5], [-28, 14, 3.5]]) S.part(g, SM([[x - r, y], [x - r * .4, y - r * .8], [x + r * .5, y - r * .7], [x + r, y + r * .1], [x + r * .3, y + r * .8], [x - r * .6, y + r * .6]], .9), MOULD, { x, y, r }, { flat:true, noEdge:true, mat:'moss' }); g.restore(); }
  S.crease(g, SO([[-20, -6], [-22, 16], [-20 + swing, 44]]), COAT, 2, .45); S.crease(g, SO([[18, -8], [22, 14], [20 + swing, 44]]), COAT, 2, .45);
  S.ln(g, [[0, -24], [1, 46]], COATD, 1.6, .7); for (const y of [-14, -2, 10, 22]) S.rivet(g, 1, y, 2, BRASS);
  if (N) for (const [x, y, i] of [[-19, 48, 0], [-3, 49, 1], [13, 49, 2]]) ooze(g, x + swing, y, (k + i * .37) % 1, .8);
  // belt and satchel (the rot satchel is marked with a glowing skull, and poison vials ride the strap)
  S.part(g, RR(-31, 4, 62, 7, 2), STRAP, { x:0, y:8, r:31 }, { flat:true, mat:'leather' }); S.rivet(g, 0, 7.5, 2.6, BRASS);
  S.tube(g, SO([[-22, -20], [22, 20]]), STRAP, 3.5);
  if (N) for (const t of [.22, .42]){ const vx = -22 + 44 * t, vy = -20 + 40 * t; S.part(g, RR(vx - 2.6, vy - 7, 5.2, 11, 2.2), GLASS, { x:vx, y:vy - 2, r:6 }, { flat:true, lw:.8 }); g.save(); g.shadowColor = GF; g.shadowBlur = 5; S.dot(g, RR(vx - 1.8, vy - 2, 3.6, 5.4, 1.6), GF, .9); g.restore(); S.part(g, RR(vx - 1.8, vy - 9, 3.6, 2.6, .8), STRAP, { x:vx, y:vy - 8, r:2 }, { flat:true, lw:.6 }); }
  S.part(g, RR(14, 12, 20, 16, 4), SATCH, { x:24, y:20, r:12 }, { mat:'leather' }); S.part(g, RR(14, 10, 20, 7, 3), pal(SATCH.dark), { x:24, y:13, r:10 }, { flat:true, mat:'leather' }); S.rivet(g, 24, 18, 1.8, BRASS);
  if (N){ g.save(); g.shadowColor = GF; g.shadowBlur = 5; S.dot(g, SM([[20.5, 22], [24, 18.5], [27.5, 22], [26.5, 25], [21.5, 25]], .9), GF, .9); g.restore(); S.dot(g, E(22.6, 22, .9, 1), '#14200c'); S.dot(g, E(25.4, 22, .9, 1), '#14200c'); }
  else { S.dot(g, PL([[19, 21], [29, 21], [24, 26]]), '#fff', .7); S.dot(g, PL([[22, 18], [26, 18], [24, 25]]), '#fff', .7); }
  // arms: right holds the censer chain, left tucked
  const cx = -30, cy = -2, ca = -.5 + raise * -1.2 + (w != null ? Math.sin(ph + 1) * .1 : 0);
  S.tube(g, SO([[-24, -18], [-36, -6], [cx, cy]]), COAT, 8); S.part(g, E(cx, cy + 2, 6, 5.5), GLOVE, { x:cx, y:cy, r:6 }, { flat:true, mat:'leather' });
  S.tube(g, SO([[24, -18], [34, -2], [28, 12]]), COAT, 8); S.part(g, E(28, 14, 6, 5.5), GLOVE, { x:28, y:14, r:6 }, { flat:true, mat:'leather' });
  // censer swinging from the chain: a brass pot with a green-glowing grate (rot: a skull lantern pouring ghostfire)
  const cl = 26, ex = cx + Math.sin(ca) * cl, ey = cy + Math.cos(ca) * cl;
  S.ln(g, [[cx, cy], [ex, ey - 8]], BRASS, 1.6, .9); for (let i = 1; i < 4; i++) S.dot(g, E(cx + (ex - cx) * i / 4, cy + (ey - 8 - cy) * i / 4, 1.6, 1.6), BRASS.light, .9);
  if (N) skullLantern(g, ex, ey, raise, k);
  else { g.save(); g.shadowColor = C.GLOW; g.shadowBlur = 8 + raise * 12; S.part(g, SM([[ex - 8, ey - 8], [ex + 8, ey - 8], [ex + 9, ey + 2], [ex, ey + 8], [ex - 9, ey + 2]], .7), BRASS, { x:ex, y:ey, r:9 }, { mat:'metal' }); g.restore();
    S.dot(g, E(ex, ey - 1, 4.5, 3.2), C.GLOW, .8 + raise * .2); S.dot(g, E(ex - 1.2, ey - 1.6, 1.6, 1.3), C.CORE, .9); }
  for (let i = 0; i < 3; i++){ const t = ((heal * 2 + i / 3) % 1); puff(g, ex + Math.sin(i * 2 + heal * 10) * 6, ey - 12 - t * 22, 4 + t * 4, (1 - t) * .5 * (.4 + raise * .6), C.SMOKE); }
  // head: stooped forward and low, beaked mask, lenses, wide hat
  g.save(); g.translate(0, -4); g.rotate(stoop); g.translate(0, 14);   // the head sits low on the chest: hunched
  const head = SM([[-18, -36], [-20, -22], [-14, -10], [0, -6], [14, -10], [20, -22], [18, -36], [8, -44], [-8, -44]]); S.part(g, head, MASK, { x:0, y:-26, r:20 }, { mat:'leather' });
  S.contact(g, coat, 0, -26, 16, 8, .5);
  // stitched seams of the mask
  S.ln(g, [[-12, -30], [12, -30]], pal(MASK.dark), 1.2, .6); for (const x of [-9, -3, 3, 9]) S.ln(g, [[x, -33], [x, -27]], pal(MASK.dark), 1, .5);
  if (N){ g.save(); head(g); g.clip(); for (const [x, y, r] of [[-15, -16, 5], [14, -38, 4]]) S.part(g, E(x, y, r, r * .7), MOULD, { x, y, r }, { flat:true, noEdge:true, mat:'moss' }); g.restore(); S.ln(g, [[16, -20], [11, -16], [14, -12], [9, -9]], MASK, 1.3, .85); }   // mould and a crack
  // the beak: a long leather cone curving down toward the wall, stitched along its ridge (rot: broken off jaggedly near the tip, dripping)
  const beak = N
    ? SM([[-11, -24], [11, -22], [15, -10], [12 + peck * 4, 4 + peck * 8, 1], [8 + peck * 3, 6 + peck * 7, 1], [6 + peck * 3, 11 + peck * 8, 1], [2, 8 + peck * 6, 1], [-4, 6], [-9, -8]], .75)
    : SM([[-11, -24], [11, -22], [15, -10], [12 + peck * 4, 6 + peck * 8], [4, 14 + peck * 8], [-4, 8], [-9, -8]], .75);
  S.part(g, beak, BEAK, { x:2, y:-8, r:16 }, { mat:'leather', hx:-3, hy:-16 });
  S.contact(g, beak, 0, -22, 12, 5, .45);
  S.ln(g, [[-3, -18], [7, 6 + peck * 8]], pal(BEAK.dark), 1.4, .7); for (let i = 0; i < 5; i++) S.ln(g, [[-4.5 + i * 2, -15 + i * 5], [-1.5 + i * 2, -14 + i * 5]], pal(BEAK.dark), 1, .6);
  for (const y of [-10, -2]) S.dot(g, E(-3, y, 1.6, 1.3), BEAK.deep, .7);
  if (N){ S.ln(g, [[10, -18], [6, -10], [10, -4]], BEAK, 1.2, .85); ooze(g, 5 + peck * 3, 10 + peck * 8, (k * 2) % 1, .9); }
  // goggle lenses: brass rings with glowing green glass (rot: ghostfire burning out of them, the left one cracked)
  for (const s of [-1, 1]){ S.part(g, E(s * 10, -30, 7.5, 7.5), BRASS, { x:s * 10, y:-30, r:7.5 }, { mat:'metal', flat:true }); g.save(); g.shadowColor = C.LENSG; g.shadowBlur = N ? 10 : 6; S.part(g, E(s * 10, -30, 5.5, 5.5), LENS, { x:s * 10, y:-30, r:5.5 }, { noEdge:true }); g.restore();
    S.dot(g, E(s * 10, -30, 3, 3), C.LENSG, .9); S.dot(g, E(s * 10 - 1.4, -31.6, 1.4, 1.1), '#fff', .95); }
  if (N){ S.ln(g, [[-14, -34], [-10, -30], [-12, -26]], { deep:'#d8ffb0' }, .9, .9); S.ln(g, [[-10, -30], [-6, -31]], { deep:'#d8ffb0' }, .8, .8); }
  // hat: wide brim and a low crown with a band (rot: a ragged brim, a torn band and a crow perched on it)
  if (N){ const R = rng(31), pts = []; for (let i = 0; i < 18; i++){ const a = Math.PI + i / 17 * Math.PI, r = i % 2 ? 1 : .86 + R() * .08; pts.push([Math.cos(a) * 37 * r, -46 + Math.sin(a) * 7.5 * r, i % 2]); } for (let i = 17; i >= 0; i--){ const a = Math.PI + i / 17 * Math.PI, r = i % 3 === 1 ? .8 : 1; pts.push([Math.cos(a) * 37 * r, -46 - Math.sin(a) * 7.5 * r + (i % 3 === 1 ? 3 : 0), i % 3 === 1 ? 1 : 0]); }
    S.part(g, SM(pts, .5), HAT, { x:0, y:-46, r:36 }, { flat:true, mat:'cloth', hx:-16, hy:-49 }); }
  else S.part(g, E(0, -46, 36, 7.5), HAT, { x:0, y:-46, r:36 }, { flat:true, mat:'cloth', hx:-16, hy:-49 });
  S.contact(g, head, 0, -42, 18, 6, .5);
  S.part(g, SM([[-20, -46], [-17, -60], [0, -63], [17, -60], [20, -46]], .6), HAT, { x:0, y:-54, r:20 }, { mat:'cloth', hx:-8, hy:-58 });
  S.part(g, RR(-19, -53, 38, 5, 2), C.BAND, { x:0, y:-50, r:19 }, { flat:true, mat:'leather' }); S.rivet(g, 8, -50.5, 2, BRASS);
  if (N){ S.dot(g, PL([[-12, -48], [-16, -40], [-10, -44], [-8, -38], [-7, -48]]), C.BAND.base); crow(g, 24, -50, k); }
  g.restore();
  g.restore();
}

// ---------- registry entries (the rot look would be its own type in the game; box widened for the crow and the fog) ----------
const stream = (m, cl) => Math.floor(m.ph * cl.fps) % cl.n;
const clips = { walk:{ n:8, fps:7, pose:t => ({ walk:t }) }, chew:{ n:4, fps:7, pose:t => ({ chew:t }) }, heal:{ n:6, fps:12, once:true, pose:t => ({ walk:.25, heal:t }) } };
const frame = (m, cl) => { if (m.p > .05 && m.healT > DOCTOR_HEAL_EVERY - .5 && m.frozenT <= 0){ const n = cl.heal.n; return ['heal', Math.min(n - 1, Math.floor((DOCTOR_HEAL_EVERY - m.healT) / .5 * n))]; } return null; };
export const NM_DOCTOR = {
  doctor: { name:'Plague Doctor (game)', draw:nmDoctor, scale:.62, dy:-10, box:{ x:-70, y:-62, w:140, h:118 }, clips, still:{}, frame },
  rotdoctor: { name:'Rot Doctor', variant:'rot', draw:nmDoctor, scale:.62, dy:-10, box:{ x:-70, y:-74, w:140, h:130 }, clips, still:{}, frame },
};
