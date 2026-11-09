// ---------- Nightmare Drowned Marsh's monsters (Release 9; spec Part 3) ----------
// Toy Plastic drawings (docs/ART_BRIEF.md) ported from the design archive (docs/archive/nightmare-monsters/): the Blood Splitter Slime and its Bloodlet from
// slime-patch/slime_patch.js, the Drowned Pirate from kraken-pirate/kraken_pirate.js. Every Release 9 monster's drawing goes in this file with its own
// registry key (MARSH is spread into CHARS in index.js behind `__RELEASE__ >= 9`). Glow and shadowBlur are fine here: every clip is baked by render/anim.js
// and nothing in this file may be painted per frame.
//   bloodslime / bloodblob: a blood jelly with a skull and bones floating in it; the blob is the Bloodlet (0.6 size, one bone). Clips: walk, chew. The split
//               clip of the archive is not used: a kill pops the last frame (render/draw.js), and the Bloodlets swell in place while they regrow.
//   pirate: a green-skinned Drowned Pirate with a peg leg, a hook and a flintlock. Clips: walk, chew, shoot (once: the gun comes up, fires, recoils;
//               played by engine/marsh.js as the aim runs out).

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';


// ---------- palettes ----------
const BARN = pal('#d8d0c0'), KELP = pal('#3a5a2a');
const DSKIN = pal('#a6c0a2'), COAT = pal('#2a2a4a'), TRIM = pal('#c8a048'), SASH = pal('#b0202a'), SHIRT = pal('#d8d0b8'), PANTS = pal('#6a5440'),
  BOOT = pal('#3a2a22'), PEG = pal('#9a6a3a'), HAT = pal('#25212e'), HOOK = pal('#b8b8c0'), GUN = pal('#5a3a26'), GUNM = pal('#8a8a96'), BEARD = pal('#3a5a30'), GOLD = '#ffd25a';

// =====================================================================
// 1. The Blood Splitter Slime and its Bloodlet
// =====================================================================
const BLOOD = pal('#c81c30'), CLOT = pal('#5e0814'), BONEC = pal('#ecdcc4'), GORE = '#3a0610';
function bone(g, x, y, len, rot, w = 3){ g.save(); g.translate(x, y); g.rotate(rot); S.tube(g, SO([[-len / 2, 0], [len / 2, 0]]), BONEC, w);
  for (const s of [-1, 1]) for (const k of [-1, 1]){ const bx = s * len / 2, by = k * w * .42; S.part(g, E(bx, by, w * .62, w * .62), BONEC, { x:bx, y:by, r:w * .6 }, { flat:true, mat:'bone', lw:.9 }); }
  g.restore(); }
function skull(g, x, y, r, rot = 0){ g.save(); g.translate(x, y); g.rotate(rot);
  const h = SM([[-r, -r * .15], [-r * .85, -r * .8], [0, -r * 1.05], [r * .85, -r * .8], [r, -r * .15], [r * .62, r * .45], [r * .5, r * .9], [-r * .5, r * .9], [-r * .62, r * .45]], .85);
  S.part(g, h, BONEC, { x:0, y:-r * .1, r }, { flat:true, mat:'bone', lw:1 });
  for (const s of [-1, 1]) S.dot(g, E(s * r * .38, -r * .08, r * .27, r * .3), '#3a0a14');
  S.dot(g, PL([[-r * .12, r * .38], [r * .12, r * .38], [0, r * .16]]), '#3a0a14');
  for (const xx of [-.3, -.1, .1, .3]) S.ln(g, [[xx * r, r * .58], [xx * r, r * .86]], { deep:'#5a2a2a' }, .7, .8);
  g.restore(); }
/** One blood jelly. size scales it about the feet; small = the Bloodlet (one bone, bigger eyes); stretch/pinch = splitting; shock = wide eyes. */
function jelly(g, o){
  const { ph = 0, lean = 0, jaw = .15, small = false, stretch = 0, pinch = 0, size = 1, shock = 0 } = o;
  const wob = Math.sin(ph) * (small ? .09 : .06);
  g.save(); g.translate(0, 50); g.scale(size, size); g.translate(0, -50);
  S.shadow(g, 0, 50, 46, 7);
  g.save(); g.globalAlpha *= .9; S.part(g, E(0, 47, 48, 8), CLOT, { x:0, y:47, r:48 }, { flat:true, mat:'gel' }); g.restore();
  g.save(); g.translate(0, 50); g.scale(1 + wob - lean * .04 + stretch * .22, 1 - wob - lean * .08 - stretch * .14); g.translate(0, -50);
  // a blood drip running down the right flank
  const dl = 6 + Math.max(0, Math.sin(ph + 1)) * 5; S.tube(g, SO([[36, 26], [40, 34 + dl * .5], [41, 38 + dl]]), BLOOD, 5); S.part(g, E(41, 40 + dl, 4.5, 5.5), BLOOD, { x:41, y:40 + dl, r:5 }, { mat:'gel' });
  const body = SM([[-36, 46], [-42, 22], [-36, -6], [-22, -26], [-6, -36], [8, -32], [22, -26], [36, -12], [42, 12], [38, 46]], .9);
  S.part(g, body, BLOOD, { x:0, y:10, r:42 }, { mat:'gel', hx:-16, hy:-22 });
  // what floats inside: clots, a skull and bones, bubbles rising; then a translucent skin over them
  g.save(); body(g); g.clip();
  g.save(); g.globalAlpha *= .62;
  for (const [x, y, r] of [[-22, 6, 6], [22, 38, 7], [-6, 42, 5], [8, -18, 4]]) S.dot(g, E(x, y, r, r * .7), CLOT.base, .8);
  if (small) bone(g, 2, 30, 15, -.4 + Math.sin(ph) * .12, 3.4);
  else { skull(g, 17, 24, 10.5, .35 + Math.sin(ph) * .08); bone(g, -18, 27, 18, -.6 + Math.sin(ph + 1) * .1, 3.4); bone(g, -3, 39, 12, .3, 2.6); }
  g.restore();
  const R = rng(small ? 5 : 9), base = ((ph / TAU) % 1 + 1) % 1;
  for (let i = 0; i < 7; i++){ const off = R(), p = (base + off) % 1, x = (R() - .5) * 58, y = 44 - p * 66, r = 1.4 + R() * 2.2, a = .7 * Math.sin(p * Math.PI);
    g.strokeStyle = `rgba(255,220,225,${a})`; g.lineWidth = .9; ell(g, x, y, r, r); g.fillStyle = `rgba(255,120,130,${a * .25})`; g.fill(); g.stroke(); g.fillStyle = `rgba(255,255,255,${a})`; ell(g, x - r * .35, y - r * .35, r * .3, r * .3); g.fill(); }
  g.fillStyle = rgba(BLOOD.light, .16); body(g); g.fill();
  if (pinch > 0){ g.strokeStyle = rgba(CLOT.deep, .7 * pinch); g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -38); g.quadraticCurveTo(-2, -26, 0, -16 + pinch * 6); g.moveTo(0, 50); g.quadraticCurveTo(2, 40, 0, 26 - pinch * 4); g.stroke(); }
  g.restore();
  S.stroke(g, body, BLOOD, 1.6, .9);
  S.dot(g, E(-16, -20, 9, 4, -.3), '#ffe0e4', .6); S.dot(g, E(-24, -8, 3, 2), '#ffe0e4', .45);
  // face: angry yellow eyes under heavy lids, a fanged mouth that drips
  const er = small ? 1.35 : 1, ex = small ? 13 : 11, ey = small ? -2 : -4;
  for (const s of [-1, 1]) S.eye(g, s * ex, ey - (s > 0 ? 1 : 0), 8.5 * er, 9 * er, { lx:.1 - s * .05, ly:.2, pr:shock ? .26 : .34, iris:'#ffcc30', lid:shock ? 0 : .34, tilt:s * -.42, lidCol:BLOOD.dark, lidDeep:CLOT.deep });
  const my = small ? 14 : 10;
  S.dot(g, SM([[-11, my], [-5, my + 3 + jaw * 7], [0, my + 4 + jaw * 9], [5, my + 3 + jaw * 7], [11, my], [0, my + 1.5]], .8), GORE);
  S.dot(g, E(0, my + 3 + jaw * 6, 4, 2), '#ff5060', .7);
  for (const s of [-1, 1]) S.dot(g, PL([[s * 8.5, my + .4], [s * 4.5, my + 1.4], [s * 6.8, my + 6 + jaw * 2]]), '#fff');
  S.tube(g, SO([[-7, my + 4], [-7.5, my + 9 + jaw * 3]]), BLOOD, 2); S.part(g, E(-7.5, my + 11 + jaw * 3, 2, 2.6), BLOOD, { x:-7.5, y:my + 11, r:2.4 }, { mat:'gel', lw:1 });
  g.restore(); g.restore();
}
export function bloodslime(g, P = {}){
  const w = P.walk, ch = P.chew, ph = (w ?? ch ?? 0) * TAU, lean = ch == null ? 0 : Math.abs(Math.sin(ch * TAU)), jaw = ch == null ? .15 : .15 + lean * .85;
  jelly(g, { ph, lean, jaw });
}
export function bloodlet(g, P = {}){
  const w = P.walk, ch = P.chew, ph = (w ?? ch ?? 0) * TAU, lean = ch == null ? 0 : Math.abs(Math.sin(ch * TAU)), jaw = ch == null ? .2 : .2 + lean * .8;
  jelly(g, { ph, lean, jaw, small:true, size:.6 });
}

// =====================================================================
// 2. The Drowned Pirate
// =====================================================================
/** Wet sheen and drips on a clip shape. */
function wet(g, clip, b, drips = [], hi = 'rgba(255,255,255,.32)', dc = pal('#c8e8f0'), drop = '#e8f8ff'){ g.save(); clip(g); g.clip(); g.fillStyle = hi; ell(g, b.x - b.r * .3, b.y - b.r * .2, b.r * .32, b.r * .1, -.5); g.fill(); ell(g, b.x + b.r * .25, b.y + b.r * .3, b.r * .18, b.r * .06, -.4); g.fill(); g.restore();
  for (const [x, y, l] of drips){ S.tube(g, SO([[x, y], [x + 1, y + l]]), dc, 2.2); S.dot(g, E(x + 1, y + l + 1.5, 1.8, 2.2), drop, .9); } }
function barnacle(g, x, y, r = 4){ S.part(g, E(x, y, r, r * .8), BARN, { x, y, r }, { flat:true, mat:'stone', noEdge:true }); S.dot(g, E(x, y, r * .35, r * .3), '#3a3028', .9); }
function kelp(g, x, y, n = 3, len = 22, w = 4){ const R = rng(x * 3 + y * 5 + 7 | 0); for (let i = 0; i < n; i++){ const dx = (i - (n - 1) / 2) * 6 + (R() - .5) * 4, L = len * (.7 + R() * .6); S.tube(g, SO([[x + dx, y], [x + dx + (R() - .5) * 8, y + L * .5], [x + dx + (R() - .5) * 10, y + L]]), KELP, w); } }
// ---------- the Drowned Pirate ----------
function tricorn(g){
  const hat = SM([[-34, -46, 1], [-24, -50], [-18, -66], [0, -72], [18, -66], [24, -50], [34, -46, 1], [22, -42], [8, -40], [0, -34, 1], [-8, -40], [-22, -42]], .8);
  S.part(g, hat, HAT, { x:0, y:-56, r:34 }, { mat:'cloth', hx:-10, hy:-64 });
  // upturned brim: gold-trimmed edge
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = TRIM.dark; g.lineWidth = 3.2; g.beginPath(); g.moveTo(-34, -46); g.quadraticCurveTo(-22, -40, -8, -40); g.lineTo(0, -34); g.lineTo(8, -40); g.quadraticCurveTo(22, -40, 34, -46); g.stroke(); g.strokeStyle = TRIM.light; g.lineWidth = 1.5; g.stroke(); g.restore();
  S.crease(g, SO([[-22, -48], [-14, -58], [-4, -62]]), HAT, 1.6, .5); S.crease(g, SO([[22, -48], [14, -58], [4, -62]]), HAT, 1.6, .5);
  // skull and crossbones badge
  for (const s of [-1, 1]) S.tube(g, SO([[s * -6, -46], [s * 6, -57]]), pal('#e4dcc8'), 1.4);
  S.part(g, E(0, -52, 5.2, 4.8), pal('#ece4d0'), { x:0, y:-52, r:5 }, { flat:true, mat:'bone', lw:1 }); for (const s of [-1, 1]) S.dot(g, E(s * 1.9, -52.5, 1.3, 1.5), '#1a1418'); S.dot(g, PL([[-2.6, -49], [2.6, -49], [2, -47.2], [-2, -47.2]]), '#ece4d0'); S.ln(g, [[-1, -49], [-1, -47.5]], pal('#1a1418'), .6, .8); S.ln(g, [[1, -49], [1, -47.5]], pal('#1a1418'), .6, .8);
  barnacle(g, -20, -60, 3); barnacle(g, -15, -64, 2.2); barnacle(g, 24, -50, 2.4);
  wet(g, hat, { x:0, y:-56, r:34 }, [], 'rgba(255,255,255,.22)'); kelp(g, -26, -45, 1, 9, 2.6);
}
function pirateHead(g, jaw, look = 0){
  const head = SM([[-22, -40], [-25, -22], [-20, -6], [-8, 2], [0, 3], [8, 2], [20, -6], [25, -22], [22, -40], [12, -46], [-12, -46]]);
  S.part(g, head, DSKIN, { x:0, y:-24, r:25 }, { mat:'skin', hx:-10, hy:-36 });
  S.contact(g, head, -15, -10, 7, 9, .38); S.contact(g, head, 15, -10, 7, 9, .38);
  for (const [x, y, r] of [[-16, -32, 3], [18, -6, 2.4], [8, -40, 2.2]]) S.dot(g, E(x, y, r, r * .7), DSKIN.deep, .18);
  // stitched scar across the cheek
  S.ln(g, [[10, -14], [20, -22]], DSKIN, 1.3, .7); for (const k of [.2, .5, .8]){ const x = 10 + k * 10, y = -14 - k * 8; S.ln(g, [[x - 2, y - 2.5], [x + 2, y + 2.5]], pal('#3a2a2a'), .9, .8); }
  // eye patch over the left eye, a huge glaring right eye
  S.ln(g, [[-24, -36], [-6, -30], [24, -42]], pal('#1a1418'), 1.8, .95);
  S.part(g, SM([[-18, -34], [-6, -34], [-5, -24], [-12, -20], [-19, -26]], .8), pal('#1e1a22'), { x:-12, y:-28, r:8 }, { flat:true, mat:'leather', lw:1 });
  S.eye(g, 9, -28, 9.5, 10, { pr:.38, lx:look * .3 - .05, ly:.2, iris:'#ff3a26', pupil:'#2a0608', lid:.22, tilt:.3, lidCol:DSKIN.base, lidDeep:DSKIN.deep });
  S.ln(g, [[1, -40], [17, -37]], DSKIN, 2.2, .7);
  for (const s of [-1, 1]) S.dot(g, E(s * 2, -18, 1, 1.8, s * .3), DSKIN.deep, .7);
  // kelp-weed beard around a gap-toothed grin with one gold tooth
  const R = rng(13);
  const bj = jaw * 4, beard = SM([[-18, -12], [-12, -8], [12, -8], [18, -12], [16, -2 + bj], [10, 5 + bj], [6, 10 + bj, 1], [2, 5 + bj], [0, 13 + bj, 1], [-3, 5 + bj], [-7, 10 + bj, 1], [-10, 4 + bj], [-16, -2 + bj]], .7);
  S.part(g, beard, BEARD, { x:0, y:-1, r:16 }, { flat:true, mat:'moss', lw:1.2 });
  for (let i = 0; i < 4; i++){ const x = -12 + i * 8 + (R() - .5) * 2; S.tube(g, SO([[x, 2 + bj], [x + (R() - .5) * 3, 8 + bj], [x + (R() - .5) * 4, 13 + bj + R() * 3]]), BEARD, 1.6); }
  const J = jaw * 7;
  const mouth = SM([[-13, -12], [-6, -9 + J * .6], [0, -8 + J], [6, -9 + J * .6], [13, -12], [6, -13], [0, -13.5], [-6, -13]], .7);
  S.dot(g, mouth, '#170c10'); if (jaw > .3) S.dot(g, E(0, -9 + J * .6, 5, 1.6 + J * .2), '#5a2a3a', .8);
  for (const [x, c] of [[-9, '#e8e4cc'], [-4, '#e8e4cc'], [2, GOLD], [8, '#d8d4b0']]) { S.dot(g, RR(x - 1.6, -13.2, 3.2, 3.6, .8), c); if (c === GOLD) S.dot(g, E(x - .5, -12, .7, 1), '#fff', .9); }
  for (const x of [-6, 4]) S.dot(g, RR(x - 1.4, -9.5 + J - 2.6, 2.8, 2.8, .7), '#d8d4b0');
  wet(g, head, { x:0, y:-24, r:25 }, [[23, -16, 4]], 'rgba(255,255,255,.3)');
  tricorn(g);
}
function flintlock(g, x, y, ang, s = 1){
  g.save(); g.translate(x, y); g.rotate(ang);
  // grip down-back, barrel forward along +x
  S.part(g, SM([[-4, -2], [4, -3], [6, 2], [-2, 10], [-8, 12], [-9, 8]], .7), GUN, { x:-2, y:4, r:8 }, { flat:true, mat:'wood', lw:1.1 });
  S.part(g, RR(2, -4, 22, 4.6, 2), GUNM, { x:12, y:-2, r:12 }, { flat:true, mat:'metal', lw:1.1 });
  S.part(g, RR(2, -1, 15, 3, 1.2), GUN, { x:9, y:0, r:8 }, { flat:true, mat:'wood', noEdge:true });
  S.part(g, E(24, -1.7, 2.2, 2.8), GUNM, { x:24, y:-2, r:3 }, { flat:true, mat:'metal', lw:.9 });
  S.part(g, PL([[0, -4], [4, -9], [6, -8], [3, -3]]), GUNM, { x:3, y:-6, r:4 }, { flat:true, mat:'metal', lw:.8 });
  S.rivet(g, 4, -1, 1.2, TRIM);
  g.restore();
}
export function pirate(g, P = {}){
  const w = P.walk, ch = P.chew, sh = P.shoot;
  const ph = w == null ? 0 : w * TAU, sw = w == null ? 0 : Math.sin(ph), cs = ch == null ? 0 : Math.sin(ch * TAU);
  // the hobble: the body dips and lists when the peg leg takes the weight
  const pegDown = w == null ? 0 : Math.max(0, -Math.sin(ph)), bob = w != null ? -Math.abs(sw) * 2.5 + pegDown * 2 : cs * 2.5;
  let list = w != null ? pegDown * .1 - .03 : cs * .06, lean = ch != null ? .08 + Math.abs(cs) * .06 : 0;
  let aimK = 0, fire = 0, recoil = 0; if (sh != null){ if (sh < .4) aimK = Math.sin(sh / .4 * Math.PI / 2); else { aimK = 1; const k = (sh - .4) / .6; fire = k < .25 ? k / .25 : Math.max(0, 1 - (k - .25) / .5); recoil = k < .2 ? k / .2 : Math.max(0, 1 - (k - .2) / .6); } list = -.06 - recoil * .05; }
  S.shadow(g, 2, 50, 30, 6);
  // legs: a booted left leg and a pegged right leg
  { const s = -1, p2 = ph, lift = w == null ? 0 : Math.max(0, Math.sin(p2)) * 7, dx = w == null ? -2 : Math.cos(p2) * 6;
    const leg = SM([[-4, 18], [-18, 18], [-20 + dx, 40 - lift], [-8 + dx, 40 - lift]], .5); S.part(g, leg, PANTS, { x:-12 + dx * .5, y:30, r:13 }, { flat:true, mat:'cloth' });
    S.part(g, SM([[-21 + dx, 34 - lift], [-7 + dx, 34 - lift], [-6 + dx, 46 - lift], [-24 + dx, 48 - lift], [-25 + dx, 44 - lift]], .6), BOOT, { x:-15 + dx, y:42 - lift, r:11 }, { mat:'leather', hx:-18 + dx, hy:38 - lift });
    S.part(g, RR(-22 + dx, 32 - lift, 17, 5, 2), pal('#4a3a30'), { x:-14 + dx, y:34 - lift, r:9 }, { flat:true, mat:'leather', lw:1 }); }
  { const p2 = ph + Math.PI, lift = w == null ? 0 : Math.max(0, Math.sin(p2)) * 4, dx = w == null ? 2 : Math.cos(p2) * 5;
    const stump = SM([[4, 18], [18, 18], [17 + dx * .4, 31], [6 + dx * .4, 31]], .5); S.part(g, stump, PANTS, { x:11, y:24, r:10 }, { flat:true, mat:'cloth' }); S.thread(g, 8 + dx * .4, 31, -1, PANTS); S.thread(g, 15 + dx * .4, 31, 1, PANTS);
    S.part(g, RR(5 + dx * .4, 29, 13, 5, 2), pal('#5a4030'), { x:11, y:31, r:7 }, { flat:true, mat:'leather', lw:1 });
    S.part(g, PL([[7 + dx * .4, 33], [16 + dx * .4, 33], [12.5 + dx, 50 - lift], [10.5 + dx, 50 - lift]]), PEG, { x:11 + dx * .7, y:41, r:9 }, { flat:true, mat:'wood', lw:1.1 });
    S.part(g, E(11.5 + dx, 50 - lift, 2.6, 1.6), PEG.dark ? pal(PEG.dark) : PEG, { x:11.5 + dx, y:50 - lift, r:3 }, { flat:true, mat:'wood', lw:.8 }); barnacle(g, 13 + dx * .6, 40, 1.8); }
  g.save(); g.translate(0, 20 + bob); g.rotate(list + lean); g.translate(0, -20);
  // coat with tails, open over a ragged shirt, red sash
  const coat = SM([[-20, -8], [-26, 6], [-30, 30, 1], [-20, 26], [-12, 32, 1], [12, 32, 1], [20, 26], [30, 30, 1], [26, 6], [20, -8], [8, -12], [-8, -12]], .8);
  S.part(g, coat, COAT, { x:0, y:8, r:30 }, { mat:'cloth', hx:-12, hy:-2 });
  const shirt = SM([[-8, -11], [8, -11], [10, 6], [6, 22], [-6, 22], [-10, 6]], .8); S.part(g, shirt, SHIRT, { x:0, y:4, r:14 }, { flat:true, mat:'cloth', lw:1.2 });
  S.crease(g, SO([[-3, -6], [-1, 8]]), SHIRT, 1.2, .35); S.thread(g, -4, 22, -1, SHIRT); S.thread(g, 4, 22, 1, SHIRT);
  S.part(g, SM([[-24, 12], [24, 12], [24, 20], [-24, 20]], .5), SASH, { x:0, y:16, r:24 }, { flat:true, mat:'cloth', lw:1.2 }); S.part(g, SM([[-17, 18], [-13, 18], [-12, 30], [-15, 33, 1], [-19, 30]], .6), SASH, { x:-15, y:25, r:8 }, { flat:true, mat:'cloth', lw:1 });
  S.part(g, RR(-5, 12.5, 10, 7, 1.5), TRIM, { x:0, y:16, r:6 }, { flat:true, mat:'metal', lw:1 });
  for (const s of [-1, 1]){ S.ln(g, [[s * 9, -10], [s * 12, 10]], TRIM, 2.2, .9); for (const y of [-4, 4]) S.rivet(g, s * 13, y, 1.5, TRIM); }
  g.save(); coat(g); g.clip(); S.dot(g, PL([[-30, 30], [-24, 22], [-26, 32]]), '#0c0a14'); S.dot(g, PL([[26, 32], [22, 25], [30, 29]]), '#0c0a14'); g.restore();
  barnacle(g, -18, -4, 2.6); barnacle(g, 22, 22, 2.2); barnacle(g, 19, 26, 1.6);
  wet(g, coat, { x:0, y:8, r:30 }, [], 'rgba(255,255,255,.25)');
  // left arm: the hook (swings on the walk, slashes on the chew)
  const hs = w != null ? Math.sin(ph + Math.PI) * .25 : ch != null ? -.5 + Math.abs(cs) * 1.1 : sh != null ? .15 : 0;
  g.save(); g.translate(-20, -6); g.rotate(hs); g.translate(20, 6);
  S.part(g, SM([[-18, -10], [-28, -4], [-32, 14], [-24, 16], [-20, 2]], .7), COAT, { x:-24, y:2, r:10 }, { flat:true, mat:'cloth' });
  S.part(g, RR(-34, 13, 12, 6, 2), TRIM, { x:-28, y:16, r:6 }, { flat:true, mat:'cloth', lw:1 });
  S.part(g, RR(-31, 18, 6, 5, 1.5), pal('#3a2a22'), { x:-28, y:20, r:4 }, { flat:true, mat:'leather', lw:.9 });
  g.save(); g.lineCap = 'round'; const hk = g2 => { g2.beginPath(); g2.moveTo(-28, 22); g2.lineTo(-28, 28); g2.arc(-23, 28, 5, Math.PI, Math.PI * .1, true); }; hk(g); g.strokeStyle = rgba(HOOK.deep, .9); g.lineWidth = 4.2; g.stroke(); hk(g); g.strokeStyle = HOOK.base; g.lineWidth = 2.6; g.stroke(); hk(g); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = .8; g.translate(-.6, -.6); g.stroke(); g.restore();
  g.restore();
  // right arm: the flintlock, hanging on the walk, raised and aimed down-lane on the shoot
  if (sh == null){ const as = w != null ? Math.sin(ph) * .2 : ch != null ? cs * .15 : 0;
    g.save(); g.translate(20, -6); g.rotate(as); g.translate(-20, 6);
    S.part(g, SM([[18, -10], [28, -4], [32, 14], [24, 16], [20, 2]], .7), COAT, { x:24, y:2, r:10 }, { flat:true, mat:'cloth' });
    S.part(g, RR(22, 13, 12, 6, 2), TRIM, { x:28, y:16, r:6 }, { flat:true, mat:'cloth', lw:1 });
    flintlock(g, 28, 22, 1.25); S.hand(g, 28, 21, DSKIN, Math.PI / 2, 3, 5);
    g.restore(); }
  else { const ang = -1.25 + aimK * 1.6 - recoil * .55, sx = 20, sy = -6, L1 = 15, L2 = 15, ea = ang + .25, ex = sx + Math.cos(ea) * L1, ey = sy + Math.sin(ea) * L1, hx = ex + Math.cos(ang) * L2, hy = ey + Math.sin(ang) * L2;
    S.tube(g, SO([[sx, sy], [ex, ey]]), COAT, 10); S.tube(g, SO([[ex, ey], [hx - Math.cos(ang) * 3, hy - Math.sin(ang) * 3]]), COAT, 8.5);
    S.part(g, E(hx - Math.cos(ang) * 4, hy - Math.sin(ang) * 4, 4.5, 4.5), TRIM, { x:hx, y:hy, r:4.5 }, { flat:true, mat:'cloth', lw:1 });
    const ga = ang + .1; flintlock(g, hx, hy, ga); S.hand(g, hx, hy, DSKIN, ga + .6, 3, 5);
    const mx = hx + Math.cos(ga) * 27 - Math.sin(ga) * -2, my = hy + Math.sin(ga) * 27 + Math.cos(ga) * -2;
    if (fire > 0){ g.save(); g.translate(mx, my); g.rotate(ga); g.globalAlpha *= Math.min(1, fire * 1.5);
      g.shadowColor = '#ffb040'; g.shadowBlur = 12; S.dot(g, PL([[0, -5], [9, -3], [18, 0], [9, 3], [0, 5], [4, 0]]), '#ffd25a'); S.dot(g, PL([[0, -3], [7, -1], [12, 0], [7, 1], [0, 3]]), '#fff6d0'); g.shadowBlur = 0;
      for (const [d, r] of [[4, 6], [10, 7.5], [16, 6]]) S.dot(g, E(d + (1 - fire) * 8, -4 - (1 - fire) * 10, r * (1.2 - fire * .4), r * (1.1 - fire * .4)), '#b8a8a8', .55 * (1 - fire * .3));
      g.restore(); }
    if (sh > .55){ const k = (sh - .55) / .45; g.save(); g.globalAlpha *= (1 - k) * .7; for (const [d, r] of [[0, 5], [6, 6.5], [12, 5.5]]) S.dot(g, E(mx + d * Math.cos(ga) - 2, my - 6 - k * 22 + d * .3, r + k * 4, r + k * 3), '#a898a0'); g.restore(); }
  }
  S.contact(g, coat, 0, -10, 16, 5, .42);
  // the head on a short neck
  S.tube(g, SO([[0, -14], [0, -8]]), DSKIN, 10);
  g.save(); g.translate(0, -9 + (ch != null ? cs * 2 : 0)); g.rotate(ch != null ? .06 + cs * .08 : sh != null ? aimK * .12 - recoil * .06 : sw * .04);
  pirateHead(g, ch != null ? .2 + Math.abs(cs) * .8 : sh != null ? .2 + fire * .5 : .25, sh != null ? aimK : 0);
  g.restore();
  g.restore();
}

// ---------- registry (format of ./index.js) ----------
const C = (n, fps, key, once = false) => ({ n, fps, once, pose:t => ({ [key]:t }) });
export const MARSH = {
  // r 23 like the Splitter Slime's family (scale .64, dy -11)
  bloodslime: { draw:bloodslime, scale:.64, dy:-11, box:{ x:-64, y:-46, w:128, h:106 }, clips:{ walk:C(8, 9, 'walk'), chew:C(4, 8, 'chew') }, still:{} },
  bloodblob: { draw:bloodlet, scale:.64, dy:-11, box:{ x:-32, y:-6, w:64, h:64 }, clips:{ walk:C(8, 12, 'walk'), chew:C(4, 8, 'chew') }, still:{} },
  // r 22; the shoot clip's arm and muzzle flash need the width
  pirate: { draw:pirate, scale:.6, dy:-11, box:{ x:-48, y:-86, w:142, h:140 }, clips:{ walk:C(8, 8, 'walk'), chew:C(4, 8, 'chew'), shoot:C(8, 12, 'shoot', true) }, still:{} },
};
