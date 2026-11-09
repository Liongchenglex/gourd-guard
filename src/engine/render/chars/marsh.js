// ---------- Nightmare Drowned Marsh's monsters (Release 9; spec Part 3) ----------
// Toy Plastic drawings (docs/ART_BRIEF.md) ported from the design archive (docs/archive/nightmare-monsters/): the Blood Splitter Slime and its Bloodlet from
// slime-patch/slime_patch.js, the Drowned Pirate from kraken-pirate/kraken_pirate.js. Every Release 9 monster's drawing goes in this file with its own
// registry key (MARSH is spread into CHARS in index.js behind `__RELEASE__ >= 9`). Glow and shadowBlur are fine here: every clip is baked by render/anim.js
// and nothing in this file may be painted per frame.
//   bloodslime / bloodblob: a blood jelly with a skull and bones floating in it; the blob is the Bloodlet (0.6 size, one bone). Clips: walk, chew. The split
//               clip of the archive is not used: a kill pops the last frame (render/draw.js), and the Bloodlets swell in place while they regrow.
//   turtlerider / rotshot: an imp on a Shell Turtle and the rotten pumpkin it throws (riders/riders.js); eel / stormbolt: the Storm Eel and its bolt (storm-eel/storm_eel.js,
//               without the `leap` clip). Sections 3 and 4 below, each in a scope of its own.
//   pirate: a green-skinned Drowned Pirate with a peg leg, a hook and a flintlock. Clips: walk, chew, shoot (once: the gun comes up, fires, recoils;
//               played by engine/marsh.js as the aim runs out).

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';
import { TYPES } from '../../../data/monsters.js';


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

// =====================================================================
// 3. The Turtle Rider and its rotten pumpkin (ported from docs/archive/nightmare-monsters/riders/riders.js, without the Comet Rider; the archive's
//    `hide` clip is not used). A scope of its own: the archive's helper names would clash with the Pirate's above.
//    turtlerider: a red imp on a Shell Turtle. Clips: walk, chew, throw (once: the imp swings the pumpkin up and lets go at t = .63, played by engine/marsh.js
//               so that it lets go as the throw starts to fly).
//    rotshot: the thrown rotten pumpkin (fly, loop) and where it lands (splat, once). Flown and placed by render/draw.js ('rotshot' vfx).
// =====================================================================
const RIDERS = (() => {
  // ---------- palettes (imp from w1.js, wisp from w2.js, turtle from w5.js) ----------
  const IMP = pal('#ec5a3c'), IMPB = pal('#ffb98a'), HORN = pal('#f4dfa0'), WINGM = pal('#b8344a'),
    BRASS = pal('#c99a3a'), STRAP = pal('#4a3320'), SCARF = pal('#7a4ad0'), WOOD = pal('#b48a58'), IRON = pal('#9aa0ae'), LEATH = pal('#6b4a2e'),
    SHELLD = pal('#2f5e48'), SHELLR = pal('#7fb08a'), TSKIN = pal('#6a9a62'), TSKIND = pal('#4c7644'), KEEL = pal('#8cbf96'), SCUTE = pal('#3d7a5a'),
    MOSS = pal('#5c9a3a'), BARN = pal('#d8d0c0'), TCLAW = '#e8e8d8', SADDLE = pal('#8a2f3a');
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = t => t * t * (3 - 2 * t);

  // ---------- shared helpers ----------
  function puff(g, x, y, r, a = .7, col = '#e6f4fb'){
    const gr = g.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r); gr.addColorStop(0, rgba('#ffffff', a)); gr.addColorStop(.55, rgba(col, a * .75)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; ell(g, x, y, r, r * .9); g.fill();
  }
  function crSample(pts, n){ const out = [], m = pts.length; for (let i = 0; i < m - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, m - 1)]; for (let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[m - 1]); return out; }
  /** A tapered ribbon along a spline: { path, left, right, centre, dirs }. */
  function ribbon(pts, wf, n = 6){ const c = crSample(pts, n), L = [], R = [], D = []; for (let i = 0; i < c.length; i++){ const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; D.push([dx, dy]); const w = wf(i / (c.length - 1)); L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); } const poly = [...L, ...R.slice().reverse()]; return { path:SM(poly, .5), left:L, right:R, centre:c, dirs:D }; }
  function barnacle(g, x, y, r = 4){ S.part(g, E(x, y, r, r * .8), BARN, { x, y, r }, { flat:true, mat:'stone', noEdge:true }); S.dot(g, E(x, y, r * .35, r * .3), '#3a3028', .9); }
  function wet(g, clip, b){ g.save(); clip(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, b.x - b.r * .3, b.y - b.r * .2, b.r * .32, b.r * .1, -.5); g.fill(); ell(g, b.x + b.r * .25, b.y + b.r * .3, b.r * .18, b.r * .06, -.4); g.fill(); g.restore(); }

  // ---------- the imp rider (imp-local units: seat near y 28, horn tips near y -60, as the w1 imp) ----------
  /** Body, head and face. o: jaw 0..1, gog 0 (goggles up on the brow) .. 1 (pulled down over the eyes), wind 0..1 (blown back:
   *  ears and scarf stream up the lane), flap (wing beat, -1..1), lean (radians), grin (open laugh). Arms are drawn after the mount. */
  function impBody(g, o = {}){
    const jaw = o.jaw ?? 0, gog = o.gog ?? 0, wind = o.wind ?? 0, flap = o.flap ?? 0, ph = o.ph ?? 0;
    // scarf tails behind everything: flutter to the side, stream straight up the lane in the wind
    for (const s of [-1, 1]){ const L = 26 + wind * 26, sw = Math.sin(ph + s) * (6 - wind * 3);
      const pts = [[s * 4, 6], [s * (12 - wind * 6) + sw * .4, 2 - L * .35], [s * (16 - wind * 10) + sw, 4 - L * .7], [s * (14 - wind * 12) + sw * 1.3, 6 - L]];
      const rb = ribbon(pts, u => 5.2 - u * 2, 4); S.part(g, rb.path, SCARF, { x:s * 10, y:4 - L * .5, r:L * .6 }, { flat:true, mat:'cloth', lw:1.2 });
      const tip = pts[3]; S.thread(g, tip[0], tip[1] - 2, s, SCARF); }
    // little bat wings behind the shoulders
    for (const s of [-1, 1]){ const a = -.2 - flap * .35 - wind * .25; g.save(); g.translate(s * 14, 2); g.scale(s, 1); g.rotate(a);
      const wing = SM([[0, 0], [12, -14], [26, -20, 1], [24, -10], [30, -4, 1], [20, -2], [22, 6, 1], [10, 4]], .5);
      S.part(g, wing, WINGM, { x:14, y:-8, r:16 }, { flat:true, mat:'skin', lw:1.3 }); S.ln(g, [[2, 0], [26, -20]], IMP, 1.6, .8); S.ln(g, [[8, -6], [30, -4]], IMP, 1.2, .6); S.ln(g, [[8, -4], [22, 6]], IMP, 1.2, .6); g.restore(); }
    const body = SM([[-17, 2], [-20, 20], [-10, 34], [10, 34], [20, 20], [17, 2], [0, -6]]); S.part(g, body, IMP, { x:0, y:16, r:20 }, { mat:'skin' });
    const belly = SM([[-9, 12], [-11, 24], [0, 31], [11, 24], [9, 12], [0, 9]]); S.part(g, belly, IMPB, { x:0, y:20, r:11 }, { noEdge:true, flat:true }); S.contact(g, belly, 0, 10, 10, 4, .3);
    // scarf knot at the throat
    S.part(g, SM([[-14, 0], [0, 6], [14, 0], [12, 8], [0, 12], [-12, 8]], .7), SCARF, { x:0, y:6, r:13 }, { flat:true, mat:'cloth', lw:1.2 }); S.part(g, E(3, 8, 4.5, 4), SCARF, { x:3, y:8, r:4.5 }, { flat:true, mat:'cloth', lw:1 });
    // ears (blown back by the wind) and horns
    for (const s of [-1, 1]){ g.save(); g.translate(s * 22, -14); g.rotate(-s * wind * .55); g.translate(-s * 22, 14); S.part(g, SM([[s * 22, -14], [s * 40, -28], [s * 44, -16], [s * 34, -2]], .7), IMP, { x:s * 32, y:-16, r:12 }, { flat:true, mat:'skin' }); S.dot(g, SM([[s * 26, -14], [s * 37, -23], [s * 39, -16], [s * 33, -8]], .7), rgba(IMPB.base, .5)); g.restore(); }
    for (const s of [-1, 1]) S.part(g, SM([[s * 10, -28], [s * 14, -46], [s * (8 + wind * 6), -60 + wind * 4], [s * 22, -48], [s * 22, -28]], .8), HORN, { x:s * 15, y:-42, r:14 }, { flat:true, mat:'horn' });
    const head = SM([[-24, -18], [-27, -4], [-18, 10], [0, 14], [18, 10], [27, -4], [24, -18], [12, -32], [-12, -32]]);
    S.part(g, head, IMP, { x:0, y:-10, r:27 }, { mat:'skin' }); S.contact(g, body, 0, 4, 14, 5, .5);
    // goggle strap round the head, then the eyes, then the lenses either on the brow or over the eyes
    const gy = -26 + gog * 14, lr = 7 + gog * 2.6;
    S.tube(g, SO([[-26, gy + 3], [0, gy - 1], [26, gy + 3]]), STRAP, 3.4);
    S.eye(g, -10, -12, 8.5, 9.5, { lx:.15, ly:.2, iris:'#c04a2a' }); S.eye(g, 10, -12, 8.5, 9.5, { lx:.15, ly:.2, iris:'#c04a2a' });
    // mean brows: this imp is a tougher, older hand
    S.ln(g, [[-18, -23 + gog * 2], [-5, -19 + gog * 2]], IMP, 2.4, .9); S.ln(g, [[18, -23 + gog * 2], [5, -19 + gog * 2]], IMP, 2.4, .9);
    for (const s of [-1, 1]){ const x = s * 10, y = gog ? -12 + (1 - gog) * -14 : gy;
      S.part(g, E(x, y, lr + 2.4, lr + 2), BRASS, { x, y, r:lr + 2.4 }, { flat:true, mat:'metal', lw:1.2 });
      const gl = E(x, y, lr, lr * .92); if (gog > .5){ g.save(); g.globalAlpha *= .5; S.dot(g, gl, '#6fd8e8'); g.restore(); } else S.dot(g, gl, '#3f8a9a');
      g.save(); gl(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, x - lr * .35, y - lr * .4, lr * .45, lr * .2, -.6); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, x + lr * .35, y + lr * .35, lr * .2, lr * .12, -.6); g.fill(); g.restore(); }
    S.ln(g, [[-10 + lr * .6, gog > .5 ? -12 : gy], [10 - lr * .6, gog > .5 ? -12 : gy]], BRASS, 2, .9);
    // fanged grin
    const op = jaw * 5;
    S.dot(g, SM([[-13, 2], [-6, 8 + op * .6], [0, 10 + op], [6, 8 + op * .6], [13, 2], [0, 4]], .9), '#3a1420'); S.dot(g, E(0, 8 + op * .6, 6, 3), '#c8384a', .8);
    S.dot(g, PL([[-10, 3], [-4, 3], [-7, 10]]), '#fff'); S.dot(g, PL([[4, 3], [10, 3], [7, 10]]), '#fff');
    S.blush(g, 0, -2, .8);
  }
  /** One arm from the shoulder to a hand at (hx, hy), imp-local. */
  function impArm(g, s, hx, hy, dir, grip = true){ const sx = s * 18, sy = 14, mx = s * Math.max(30, Math.abs(hx) + 8), my = Math.max(sy + 6, (sy + hy) / 2 + 4); S.tube(g, SO([[sx, sy], [mx, my], [hx, hy]]), IMP, 6); S.hand(g, hx, hy, IMP, dir, 3, grip ? 4.6 : 5); }
  /** Legs straddling a mount: hip to a dangling foot at (fx, fy), imp-local. */
  function impLeg(g, s, fx, fy){ S.tube(g, SO([[s * 8, 24], [s * 20, 32], [fx, fy]]), IMP, 7); S.part(g, E(fx + s * 2, fy + 2, 7.5, 4.2), IMP, { x:fx, y:fy, r:7.5 }, { flat:true, mat:'skin' }); for (const d of [-3.5, 0, 3.5]) S.claw(g, fx + s * 2 + d, fy + 5, Math.PI / 2, 3.2); }

  // ---------- Turtle Rider ----------
  function hexPts(x, y, r, ry){ return [[x, y - ry], [x + r, y - ry * .5], [x + r, y + ry * .5], [x, y + ry], [x - r, y + ry * .5], [x - r, y - ry * .5]]; }
  function scute(g, x, y, r, ry, c = SCUTE){
    const pts = hexPts(x, y, r, ry), p = PL(pts), inner = hexPts(x, y, r * .74, ry * .74);
    S.part(g, p, c, { x, y, r:r * 1.15 }, { flat:true, mat:'stone', hx:x - r * .3, hy:y - ry * .45, lw:2.4 });
    g.lineWidth = 1.6; g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(inner[4][0], inner[4][1]); g.lineTo(inner[5][0], inner[5][1]); g.lineTo(inner[0][0], inner[0][1]); g.lineTo(inner[1][0], inner[1][1]); g.stroke();
    g.strokeStyle = rgba(c.deep, .55); g.beginPath(); g.moveTo(inner[1][0], inner[1][1]); g.lineTo(inner[2][0], inner[2][1]); g.lineTo(inner[3][0], inner[3][1]); g.lineTo(inner[4][0], inner[4][1]); g.stroke();
  }
  /** A short horn spike on a scute: the tougher turtle's armour. */
  function spike(g, x, y, a, len, w){ const ca = Math.cos(a), sa = Math.sin(a); S.part(g, PL([[x - sa * w, y + ca * w], [x + ca * len, y + sa * len], [x + sa * w, y - ca * w]]), pal('#e4dcc4'), { x:x + ca * len * .4, y:y + sa * len * .4, r:len * .6 }, { flat:true, mat:'horn', lw:1.1 }); }
  /** The goad: a wooden pole with an iron point, held at (x, y) pointing along angle a (imp-local). */
  function goad(g, x, y, a, len = 62){ const ca = Math.cos(a), sa = Math.sin(a), bx = x - ca * 14, by = y - sa * 14, tx = x + ca * len, ty = y + sa * len;
    S.tube(g, SO([[bx, by], [tx, ty]]), WOOD, 3.6);
    S.part(g, PL([[tx - sa * 3.4, ty + ca * 3.4], [tx + ca * 13, ty + sa * 13], [tx + sa * 3.4, ty - ca * 3.4]]), IRON, { x:tx + ca * 4, y:ty + sa * 4, r:8 }, { flat:true, mat:'metal', lw:1.1 });
    S.part(g, E(tx, ty, 3.6, 3.6), BRASS, { x:tx, y:ty, r:3.6 }, { flat:true, mat:'metal', lw:.9 }); }
  // ---------- the rotten pumpkin the Turtle Rider's imp throws ----------
  const ROT = pal('#cf7a2c'), ROTG = pal('#7d8a34'), ROTD = pal('#5e4222'), DSTEM = pal('#3a3424'), NET = pal('#8a7550'), MOULD = '#d6e6b8', STINK = '#9ac25a';
  /** A slumped, bruised pumpkin gone bad: lopsided ribs, brown rot, white mould, a wilted stem and X eyes. Centre (x, y), radius R. */
  function rotten(g, x, y, R, spin = 0){
    g.save(); g.translate(x, y); g.rotate(spin);
    const ribs = [[-.6, .42, .64], [.58, .44, .7], [-.22, .5, .74], [.2, .5, .78]];
    const union = g2 => { g2.beginPath(); for (const [ox, rw, rh] of ribs) g2.ellipse(ox * R * .9, R * .06, rw * R * 1.1, R * rh, 0, 0, TAU); };
    for (const [ox, rw, rh] of ribs){ const cx = ox * R * .9; S.part(g, E(cx, R * .06, rw * R * 1.1, R * rh), ROT, { x:cx, y:0, r:R * .8 }, { flat:Math.abs(ox) > .4, mat:'pumpkin', hx:cx - R * .12, hy:-R * .5 }); }
    g.save(); union(g); g.clip();
    for (const xx of [-.42, 0, .4]){ g.beginPath(); g.moveTo(xx * R, -R * .55); g.quadraticCurveTo(xx * R * 1.35, 0, xx * R, R * .6); g.strokeStyle = rgba(ROTD.deep, .4); g.lineWidth = R * .07; g.lineCap = 'round'; g.stroke(); }
    S.dot(g, SM([[R * .12, -R * .12], [R * .5, -R * .32], [R * .74, R * .1], [R * .44, R * .44], [R * .08, R * .26]], .8), ROTG.base, .9);   // green rot patch
    S.dot(g, E(R * .4, R * .08, R * .17, R * .12), ROTD.deep, .75);                                                                      // caved-in bruise
    S.dot(g, E(-R * .48, R * .4, R * .24, R * .14), ROTG.dark, .7);
    for (const [mx, my, mr] of [[-.42, -.36, .1], [-.3, -.26, .07], [.58, .34, .08], [-.08, .5, .06], [.64, -.08, .06], [.5, .2, .045]]) S.dot(g, E(mx * R, my * R, mr * R, mr * R), MOULD, .9);   // mould fuzz
    g.restore();
    S.ln(g, [[R * .18, -R * .46], [R * .3, -R * .24], [R * .2, -R * .04], [R * .34, R * .16]], ROTD, R * .06, .9);                       // a split oozing
    S.tube(g, SO([[R * .02, -R * .6], [-R * .04, -R * .88], [-R * .28, -R * 1.0], [-R * .46, -R * .86]]), DSTEM, R * .14);               // wilted stem, flopped over
    // X eyes and a wobbly frown: a pumpkin that has gone over to the other side
    const ey = -R * .12, ex = R * .32, e = R * .11;
    for (const sx of [-ex, ex]){ S.ln(g, [[sx - e, ey - e], [sx + e, ey + e]], ROTD, R * .07, .95); S.ln(g, [[sx + e, ey - e], [sx - e, ey + e]], ROTD, R * .07, .95); }
    S.ln(g, [[-R * .26, R * .3], [-R * .12, R * .24], [0, R * .3], [R * .12, R * .24], [R * .26, R * .3]], ROTD, R * .06, .9);
    g.restore();
  }
  /** Green stink curls trailing up the lane behind a rotten pumpkin (phase ph 0..1). */
  function stink(g, x, y, R, ph, a = 1){
    g.save(); g.globalAlpha *= a; g.lineCap = 'round';
    for (const [dx, k] of [[-.45, 0], [0, .33], [.45, .66]]){ const u = (ph + k) % 1, yy = y - R * (1.1 + u * 1.4), xx = x + dx * R, w = R * .18;
      g.strokeStyle = rgba(STINK, .75 * (1 - u)); g.lineWidth = R * .1; g.beginPath(); g.moveTo(xx, yy + R * .5);
      g.bezierCurveTo(xx + w * 2, yy + R * .3, xx - w * 2, yy + R * .15, xx + w * .5, yy - R * .1); g.stroke(); }
    g.restore();
  }
  /** The thrown pumpkin as its own sprite: fly (spins, stink trailing up the lane) and splat (bursts on the wall). */
  function rottenShot(g, P = {}){
    if (P.splat == null){ const t = P.fly ?? 0; S.shadow(g, 0, 50, 14, 4); stink(g, 0, 0, 18, t); rotten(g, 0, 0, 18, t * TAU); return; }
    const t = P.splat, sq = clamp(t / .25), burst = clamp((t - .15) / .85), fade = 1 - .75 * clamp((t - .6) / .4);
    // the puddle of rot spreading where it hit
    g.save(); g.globalAlpha *= fade; S.dot(g, SM([[-30, 34], [-18, 26], [0, 30], [16, 24], [32, 32], [24, 42], [0, 44], [-22, 42]].map(([x, y]) => [x * (.4 + burst * .6), 34 + (y - 34) * (.4 + burst * .6)]), .8), ROTD.base, .9);
    S.dot(g, E(-6, 33, 10 * burst, 3.5 * burst), ROT.base, .9); g.restore();
    // the pumpkin squashing flat, then gone
    if (t < .35){ g.save(); g.translate(0, 18 + sq * 14); g.scale(1 + sq * .5, 1 - sq * .55); rotten(g, 0, 0, 18); g.restore(); }
    // chunks and mould flying out
    g.save(); g.globalAlpha *= fade;
    for (const [a, d, r, c] of [[-2.7, 34, 4.5, ROT], [-2.1, 30, 3.5, ROTD], [-1.3, 36, 4, ROT], [-.6, 32, 3.2, ROTD], [-.2, 26, 4, ROT], [-3.0, 22, 3, ROTD], [-1.7, 20, 2.6, ROT]]){
      const x = Math.cos(a) * d * burst, y = 30 + Math.sin(a) * d * burst + burst * burst * 18; S.part(g, E(x, y, r, r * .8), c, { x, y, r }, { flat:true, mat:'pumpkin', noEdge:true }); }
    for (const [a, d] of [[-2.4, 24], [-.9, 28], [-1.6, 30]]){ const x = Math.cos(a) * d * burst, y = 30 + Math.sin(a) * d * burst; S.dot(g, E(x, y, 2.2, 2.2), MOULD, .9); }
    g.restore();
    // a green stink cloud rising
    g.save(); g.globalAlpha *= fade * clamp(t / .3);
    for (const [x, y, r] of [[-14, 18, 12], [10, 14, 14], [0, 2, 11], [-4, -12 - burst * 8, 9]]) puff(g, x, y - burst * 10, r * (.6 + burst * .5), .55, STINK);
    g.restore();
  }
  /** The net of spare rotten pumpkins tied on the shell's right flank, by the saddle. */
  function netBag(g, n = 2){
    S.ln(g, [[22, -38], [36, -42]], NET, 2.2, .9);
    if (n > 1) rotten(g, 47, -26, 12, .2);
    rotten(g, 34, -38, 12.5, -.15);
    g.save(); g.lineCap = 'round'; g.strokeStyle = rgba(NET.dark, .9); g.lineWidth = 1.1;
    for (const k of [-1, 0, 1]){ g.beginPath(); g.moveTo(30 + k * 9, -50); g.quadraticCurveTo(42 + k * 6, -32, 40 + k * 10, -20); g.stroke(); }
    for (const yy of [-40, -31, -24]){ g.beginPath(); g.moveTo(28, yy); g.quadraticCurveTo(44, yy + 4, 58, yy + 2); g.stroke(); }
    g.restore();
  }
  const lerp2 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  /** Throw clip, right hand path in drawing units: rest → into the net → wound up over the head → hurled down the lane → follow-through. */
  const THROW_KEYS = [[0, [22, -46]], [.28, [40, -40]], [.52, [32, -94]], [.66, [20, -58]], [.8, [10, -34]], [1, [22, -46]]];
  function throwHand(t){ for (let i = 1; i < THROW_KEYS.length; i++){ const [t0, a] = THROW_KEYS[i - 1], [t1, b] = THROW_KEYS[i]; if (t <= t1) return lerp2(a, b, ease((t - t0) / (t1 - t0))); } return THROW_KEYS[THROW_KEYS.length - 1][1]; }
  const RELEASE = .63;

  function turtleRider(g, P = {}){
    const w = P.walk, ch = P.chew, hd = P.hide, th = P.throw, ph = (w ?? ch ?? 0) * TAU, sw = w == null ? 0 : Math.sin(ph), cs = ch == null ? 0 : Math.sin(ch * TAU);
    const k = hd == null ? 0 : ease(clamp(hd)), kHead = ease(clamp(hd == null ? 0 : hd * 1.6)), kImp = ease(clamp(hd == null ? 0 : (hd - .2) / .8));
    const rock = sw * .04 + cs * .025, bob = w != null ? -Math.abs(sw) * 2.2 : cs * 1.5, sink = k * 7, bite = ch == null ? 0 : .5 + .5 * cs;
    S.shadow(g, 0, 50, 60 - k * 6, 8);
    // hind feet peeking out behind the shell (pulled in when it hides)
    for (const s of [-1, 1]){ if (k > .8) break; const p2 = ph + (s < 0 ? 0 : Math.PI), lift = w == null ? 0 : Math.max(0, Math.sin(p2)) * 3; g.save(); g.translate(-s * k * 14, -k * 8);
      S.part(g, E(s * 40, 36 - lift, 9, 5), TSKIND, { x:s * 40, y:36 - lift, r:9 }, { flat:true, mat:'scaly' }); g.restore(); }
    // the shell sways as one body with the imp on its back
    g.save(); g.translate(0, 10 + bob + sink); g.rotate(rock); g.translate(0, -10);
    // 1. the imp: behind the crest of the dome, so the shell hides his lower half; ducks down to peek over it when the turtle hides
    const iy = -60 + kImp * 17 + (w != null ? Math.abs(sw) * 2.2 : 0) + bite * 2, is = .7;
    g.save(); g.translate(0, iy); g.scale(is, is); const wind = th == null ? 0 : Math.sin(clamp((th - .25) / .35) * Math.PI / 2) * (th < RELEASE ? 1 : 0), hurl = th == null ? 0 : Math.sin(clamp((th - .5) / .4) * Math.PI);
    g.rotate(th != null ? -wind * .14 + hurl * .12 : ch != null ? -.04 + bite * .08 : sw * .05);
    impBody(g, { jaw:th != null ? .2 + hurl * .9 : ch != null ? bite * .8 : kImp * .3, gog:kImp, wind:0, flap:hd != null ? -.5 * kImp : Math.sin(ph * 2) * .8, ph });
    g.restore();
    // 2. the dome, seen from the front and above: big raised scutes, a keel, horn spikes, a crimson saddle cloth by the crest
    const shell = SM([[-56, 18], [-58, -2], [-50, -24], [-30, -40], [0, -46], [30, -40], [50, -24], [58, -2], [56, 18], [36, 28], [0, 32], [-36, 28]]);
    S.part(g, shell, SHELLD, { x:0, y:-4, r:56 }, { mat:'stone', hx:-24, hy:-28, lw:2.2 });
    g.save(); shell(g); g.clip();
    for (const [x, y, r, ry] of [[-30, -18, 12, 10], [30, -18, 12, 10], [-34, 8, 12, 10], [34, 8, 12, 10], [0, -6, 15, 12.5], [0, 18, 13, 8]]) scute(g, x, y, r, ry);
    const rim = SM([[-62, 14], [-30, 22], [0, 24], [30, 22], [62, 14], [62, 40], [-62, 40]], .8);
    S.part(g, rim, SHELLR, { x:0, y:30, r:58 }, { flat:true, mat:'stone', lw:1.6 });
    for (const x of [-44, -30, -15, 15, 30, 44]) S.ln(g, [[x, 22 - Math.abs(x) * .1], [x * 1.04, 36]], SHELLD, 1.6, .55);
    for (const [x, y, r] of [[-48, 12, 6], [44, -10, 4.5], [-20, -30, 4]]) S.part(g, E(x, y, r, r * .65), MOSS, { x, y, r }, { flat:true, noEdge:true, mat:'moss' });
    g.restore(); S.stroke(g, shell, SHELLD, 2.2, .9);
    // saddle cloth over the crest, under where the imp sits, with brass studs
    const cloth = SM([[-22, -41], [0, -45], [22, -41], [26, -32], [14, -28], [0, -30], [-14, -28], [-26, -32]], .7);
    S.part(g, cloth, SADDLE, { x:0, y:-36, r:24 }, { flat:true, mat:'cloth', lw:1.4 }); for (const x of [-18, -6, 6, 18]) S.rivet(g, x, -33 + Math.abs(x) * .05, 1.6, BRASS);
    S.dot(g, PL([[-24, -31], [-20, -24], [-16, -29]]), SADDLE.dark, .9); S.dot(g, PL([[24, -31], [20, -24], [16, -29]]), SADDLE.dark, .9);
    for (const [x, y, a] of [[-30, -18, -2.1], [30, -18, -1.04], [-34, 8, -2.6], [34, 8, -.54], [0, -6, -Math.PI / 2]]) if (x !== 0) spike(g, x, y - 3, a, 9, 3.4);
    barnacle(g, -50, 20, 4); barnacle(g, 46, 24, 3.5); barnacle(g, 52, 4, 3);
    wet(g, shell, { x:0, y:-4, r:56 });
    netBag(g);
    // 3. the imp's hands grip the crest when he ducks; otherwise reins in the left, the goad in the right
    g.save(); g.translate(0, iy); g.scale(is, is);
    const toL = (x, y) => [x / is, (y - iy) / is];
    if (hd != null && kImp > .5){ const [ax, ay] = toL(-16, -44), [bx, by] = toL(16, -44); impArm(g, -1, ax, ay, Math.PI / 2 + .3); impArm(g, 1, bx, by, Math.PI / 2 - .3);
      const [gx, gy] = toL(30, -40); goad(g, gx, gy, -Math.PI / 2 - .5, 40); }
    else if (th != null){
      // left fist keeps the reins and stands the goad up; the right arm takes a rotten pumpkin from the net and hurls it down the lane
      const [lx, ly] = toL(-18, -38); impArm(g, -1, lx, ly, Math.PI / 2 + .6); goad(g, lx, ly, -Math.PI / 2 - .35, 46);
      const [hxD, hyD] = throwHand(th), [hx, hy] = toL(hxD, hyD), sx = 18, sy = 14, ex = (sx + hx) / 2 + 14, ey = Math.min(sy, hy) + (Math.max(sy, hy) - Math.min(sy, hy)) * .45;
      const holding = th >= .26 && th < RELEASE;
      S.tube(g, SO([[sx, sy], [ex, ey], [hx, hy]]), IMP, 6);
      if (holding) rotten(g, hx, hy - 8 / is, 13 / is, -wind * .6);
      S.hand(g, hx, hy, IMP, hy < sy ? -Math.PI / 2 : Math.PI / 2, 3, 4.6);
      g.restore(); g.save();
      const hyb = 38 + bob * .2;
      for (const s of [-1, 1]){ const fx = -18, fy = -38, ex2 = s * 16, ey2 = hyb - 2, pp = crSample([[fx, fy], [(fx + ex2) / 2 + s * 12, (fy + ey2) / 2 + 6], [ex2, ey2]], 6);
        S.ln(g, pp, LEATH, 3.4, .95); }
    }
    else {
      const jab = ch != null ? bite : 0, [rx, ry] = toL(22 - jab * 2, -46 + jab * 12 + (w != null ? sw * 2 : 0)), [lx, ly] = toL(-18, -38);
      impArm(g, -1, lx, ly, Math.PI / 2 + .6);
      goad(g, rx, ry, Math.PI / 2 - .55 + jab * .25 - kImp * .6, 62 + jab * 14);
      impArm(g, 1, rx, ry, -.2);
      g.restore(); g.save();
      // reins from the left fist over the dome down to the bridle rings (slack as the head comes in)
      const hx = 0, hyb = 38 + bob * .2 + bite * 5 - kHead * 18;
      for (const s of [-1, 1]){ const fx = -18, fy = -38, ex = hx + s * 16, ey = hyb - 2, pp = crSample([[fx, fy], [(fx + ex) / 2 + s * 12, (fy + ey) / 2 + 6 + kHead * 12], [ex, ey]], 6);
        S.ln(g, pp, LEATH, 3.4, .95); g.strokeStyle = rgba(LEATH.light, .5); g.lineWidth = 1; g.beginPath(); pp.forEach((p, i) => i ? g.lineTo(p[0] - .6, p[1] - .8) : g.moveTo(p[0] - .6, p[1] - .8)); g.stroke(); }
    }
    g.restore();
    g.restore();
    // 4. front legs at the sides of the rim (they tuck in under the shell when it hides)
    for (const s of [-1, 1]){ const p = ph + (s < 0 ? Math.PI : 0), lift = w == null ? 0 : Math.max(0, Math.sin(p)) * 6, dx = w == null ? 0 : Math.cos(p) * 3;
      g.save(); g.translate(-s * k * 18, -k * 14 + sink * .5); g.globalAlpha *= 1 - clamp((k - .6) / .4);
      S.tube(g, SO([[s * 44, 22], [s * 52 + dx, 34 - lift]]), TSKIND, 14);
      const fx = s * 54 + dx, fy = 42 - lift; S.part(g, E(fx, fy, 11, 6), TSKIN, { x:fx, y:fy, r:11 }, { flat:true, mat:'scaly' }); for (const d of [-6, 0, 6]) S.claw(g, fx + d, fy + 4, Math.PI / 2, 4, TCLAW);
      g.restore(); }
    // 5. the head, out in front under the rim notch: bridled, heavy-lidded, a hooked beak that gapes on the bite
    if (kHead < .98){
      g.save(); g.translate(0, 10 + bob + sink); g.rotate(rock); g.translate(0, -10);
      const hx = 0, hy = 38 + bob * .2 + bite * 5 - kHead * 18, hs = 1 - kHead * .35;
      // clip to below the rim so the head slides in under the shell
      g.save(); g.beginPath(); g.rect(-80, 26 - kHead * 4, 160, 60); g.clip();
      g.translate(hx, hy); g.scale(hs, hs);
      S.tube(g, SO([[0, -16], [0, -4]]), TSKIND, 18);
      const jaw = bite * 6;
      const head = SM([[-21, -10], [-25, 0], [-20, 11], [-8, 16], [8, 16], [20, 11], [25, 0], [21, -10], [10, -16], [-10, -16]]);
      S.part(g, SM([[-12, 6], [-10, 14 + jaw], [0, 18 + jaw], [10, 14 + jaw], [12, 6]], .8), TSKIND, { x:0, y:12 + jaw, r:12 }, { flat:true, mat:'scaly' });
      S.part(g, head, TSKIN, { x:0, y:0, r:24 }, { mat:'scaly', hx:-9, hy:-8 }); wet(g, head, { x:0, y:0, r:24 });
      if (jaw > 1) S.dot(g, SM([[-10, 9], [0, 11 + jaw], [10, 9], [0, 10]], .8), '#3a1a20');
      S.stroke(g, SO([[-13, 8], [-5, 11], [0, 13], [5, 11], [13, 8]]), TSKIND, 2, .9);   // beak line
      S.dot(g, PL([[-3, 11], [3, 11], [0, 15]]), '#e8e4c8', .95);   // hooked beak tip
      S.dot(g, E(-3, 3, 1.4, 1), TSKIND.deep, .8); S.dot(g, E(3, 3, 1.4, 1), TSKIND.deep, .8);
      for (const s of [-1, 1]) S.eye(g, s * 11, -4, 6.5, 6.5, { lx:-s * .05, ly:.2, pr:.44, lid:.42, tilt:s * -.3, lidCol:TSKIN.base, lidDeep:TSKIN.deep, iris:'#d8a23a' });
      // bridle: a strap over the snout and brass rings for the reins
      S.tube(g, SO([[-22, -2], [-10, 4], [0, 5], [10, 4], [22, -2]]), LEATH, 3); for (const s of [-1, 1]) { S.part(g, E(s * 16, 0, 3.6, 3.6), BRASS, { x:s * 16, y:0, r:3.6 }, { flat:true, mat:'metal', lw:1 }); S.dot(g, E(s * 16, 0, 1.6, 1.6), '#2a2018'); }
      barnacle(g, -14, -12, 3); barnacle(g, 17, -11, 2.4);
      g.restore(); g.restore();
    }
    // in the shell: two wary eyes glinting in the dark front notch
    if (kHead > .7){ g.save(); g.translate(0, 10 + bob + sink); g.rotate(rock); g.translate(0, -10); g.globalAlpha *= clamp((kHead - .7) / .3);
      S.dot(g, SM([[-16, 26], [0, 22], [16, 26], [12, 32], [-12, 32]], .8), '#14201a', .9); for (const s of [-1, 1]) S.glow(g, s * 6, 27, 1.8, '#f0c040'); g.restore(); }
    // the thrown pumpkin flying off down the lane (toward the wall), growing as it comes forward; the game takes over with the rotten sprite
    if (th != null && th >= RELEASE){ const u = (th - RELEASE) / (1 - RELEASE), [x0, y0] = throwHand(RELEASE);
      g.save(); g.globalAlpha *= 1 - clamp((u - .75) / .25); const x = x0 + u * 6, y = y0 - 8 + u * 86 - Math.sin(u * Math.PI) * 10, r = 13 * (1 + u * .35);
      stink(g, x, y, r, u, .8); rotten(g, x, y, r, u * 5); g.restore(); }
  }

  return { turtleRider, rottenShot };
})();

// =====================================================================
// 4. The Storm Eel and its bolt (ported from docs/archive/nightmare-monsters/storm-eel/storm_eel.js; the archive's `leap` clip is NOT ported: the Eel dives
//    and comes up elsewhere, owner).
//    eel: clips hidden (loop), surface, idle (loop), charge, shoot (the bolt leaves the mouth at t = .3), down.
//    stormbolt: the projectile, fly (loop, the ball at the foot of a zig-zag tail up the lane) and zap (once: it bursts on the fence).
// =====================================================================
const EELART = (() => {
  // ---------- palette (Drowned Marsh teal, storm yellow) ----------
  const EEL = pal('#24606e'), EELD = pal('#163e4a'), BELLY = pal('#a6ccb2'), FIN = pal('#3aa2b6'), SPINE = pal('#1c4c58'),
    WOOD = pal('#7c5a3a'), SPLINT = pal('#c8a47a'), ROPE = pal('#b8a070'), IRON = pal('#7a5a4c'), RUSTO = '#b8582a', HOOKC = pal('#8a6a5a'),
    BARN = pal('#d8d0c0'), KELP = pal('#2f6b3a');
  const ZAP = { hot:'#fff6b0', glow:'#ffe04a', halo:'#ffbe1a', deep:'#e09a10' };
  const MOUTH = '#0c1418', TOOTH = '#f4fbf0';
  const WL = 38;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = t => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- splines (as in riders.js) ----------
  function crSample(pts, n){ const out = [], m = pts.length; for (let i = 0; i < m - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, m - 1)]; for (let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[m - 1]); return out; }
  /** A tapered ribbon along a spline: { path, left, right, centre, dirs }. */
  function ribbon(pts, wf, n = 6){ const c = crSample(pts, n), L = [], R = [], D = []; for (let i = 0; i < c.length; i++){ const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; D.push([dx, dy]); const w = wf(i / (c.length - 1)); L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); } const poly = [...L, ...R.slice().reverse()]; return { path:SM(poly, .5), left:L, right:R, centre:c, dirs:D }; }

  // ---------- water (copied from w5.js so this file stays self-contained) ----------
  /** A disc of water with drifting ripple rings; ph 0..1 animates the rings; zap 0..1 tints it with electric light. */
  function water(g, x, y, rx, ry, ph = 0, a = .85, zap = 0){
    g.save(); g.globalAlpha *= a;
    const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, 'rgba(130,205,228,.95)'); gr.addColorStop(1, 'rgba(50,130,160,.7)');
    ell(g, x, y, rx, ry); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(25,80,100,.7)'; g.lineWidth = 1.4; g.stroke();
    if (zap > 0){ const zg = g.createRadialGradient(x, y, 0, x, y, rx); zg.addColorStop(0, rgba(ZAP.hot, .7 * zap)); zg.addColorStop(1, rgba(ZAP.glow, 0)); ell(g, x, y, rx, ry); g.fillStyle = zg; g.fill(); }
    g.lineWidth = 1.3; for (let i = 0; i < 2; i++){ const k = (ph + i * .5) % 1; g.strokeStyle = zap > .3 ? rgba(ZAP.hot, (1 - k) * .8) : `rgba(225,248,255,${(1 - k) * .75})`; ell(g, x, y, rx * (.3 + k * .65), ry * (.3 + k * .65)); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, x - rx * .45, y - ry * .3, rx * .16, ry * .18, -.3); g.fill(); ell(g, x + rx * .4, y + ry * .25, rx * .1, ry * .14, -.3); g.fill();
    g.restore();
  }
  /** Splash droplets flying up from (x, y); t 0..1 is how far along the arc they are. */
  function splash(g, x, y, t, seed = 1, n = 10, spread = 34){
    if (t <= 0 || t >= 1) return;
    const R = rng(seed); g.save(); g.globalAlpha *= 1 - t * t;
    for (let i = 0; i < n; i++){ const a = -Math.PI * .92 + R() * Math.PI * .84, sp = spread * (.5 + R()), px = x + Math.cos(a) * sp * t, py = y + Math.sin(a) * sp * t + t * t * 46, r = 1.6 + R() * 2.2;
      S.dot(g, E(px, py, r, r * 1.3), '#bfeeff'); S.dot(g, E(px - r * .3, py - r * .4, r * .35, r * .35), '#fff', .9); }
    g.restore();
  }
  /** Clip to everything above the waterline while drawing `fn`. */
  function aboveWater(g, wl, fn){ g.save(); g.beginPath(); g.rect(-300, -400, 600, 400 + wl); g.clip(); fn(); g.restore(); }
  function barnacle(g, x, y, r = 4){ S.part(g, E(x, y, r, r * .8), BARN, { x, y, r }, { flat:true, mat:'stone', noEdge:true }); S.dot(g, E(x, y, r * .35, r * .3), '#3a3028', .9); }

  // ---------- electricity ----------
  /** Jagged points from (x1, y1) to (x2, y2), amp is the sideways jitter. */
  function zig(x1, y1, x2, y2, R, amp, n){ const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, out = [[x1, y1]];
    for (let i = 1; i < n; i++){ const f = i / n, o = (R() - .5) * 2 * amp * Math.sin(f * Math.PI) + (i % 2 ? 1 : -1) * amp * .45; out.push([x1 + dx * f + nx * o, y1 + dy * f + ny * o]); }
    out.push([x2, y2]); return out; }
  /** A glowing electric line: amber halo, yellow-white body, white core. */
  function arc(g, pts, w = 2, a = 1){
    if (a <= 0) return;
    const path = () => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
    g.save(); g.globalAlpha *= Math.min(1, a); g.lineCap = 'round'; g.lineJoin = 'round';
    g.shadowColor = ZAP.glow; g.shadowBlur = 4 + w * 2; path(); g.strokeStyle = rgba(ZAP.halo, .6); g.lineWidth = w * 2.4; g.stroke();
    g.shadowBlur = 0; path(); g.strokeStyle = ZAP.hot; g.lineWidth = w; g.stroke(); path(); g.strokeStyle = '#fff'; g.lineWidth = w * .45; g.stroke();
    g.restore();
  }
  /** A little spark: three jagged prongs and a white pip. */
  function spark(g, x, y, r, R, a = 1){
    for (let k = 0; k < 3; k++){ const an = R() * TAU, l = r * (.6 + R() * .6); arc(g, zig(x, y, x + Math.cos(an) * l, y + Math.sin(an) * l, R, l * .22, 3), 1, a); }
    g.save(); g.globalAlpha *= a; g.shadowColor = ZAP.glow; g.shadowBlur = 6; S.dot(g, E(x, y, r * .28, r * .28), '#fff'); g.restore();
  }
  /** A ball of lightning: glow, yellow-white core, crackling prongs. */
  function zapBall(g, x, y, r, R, a = 1){
    g.save(); g.globalAlpha *= a;
    let gr = g.createRadialGradient(x, y, 0, x, y, r * 2.2); gr.addColorStop(0, rgba(ZAP.glow, .7)); gr.addColorStop(1, rgba(ZAP.halo, 0)); g.fillStyle = gr; g.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
    g.shadowColor = ZAP.glow; g.shadowBlur = r; gr = g.createRadialGradient(x - r * .2, y - r * .2, 0, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.55, ZAP.hot); gr.addColorStop(1, ZAP.glow); ell(g, x, y, r, r); g.fillStyle = gr; g.fill();
    g.restore();
    for (let k = 0; k < 4; k++){ const an = k / 4 * TAU + R() * 1.2, l = r * (1.2 + R() * .8); arc(g, zig(x + Math.cos(an) * r * .5, y + Math.sin(an) * r * .5, x + Math.cos(an) * l, y + Math.sin(an) * l, R, r * .25, 3), Math.max(.8, r * .14), a); }
  }

  // ---------- the eel ----------
  /** Angry glowing eye: yellow-white glow, slit pupil looking down at the wall, a lid slanting down to the middle and a heavy brow. */
  function stormEye(g, x, y, rx, ry, s, glow){
    g.save(); g.shadowColor = ZAP.glow; g.shadowBlur = 6 + glow * 6; ell(g, x, y, rx, ry); g.fillStyle = ZAP.glow; g.fill(); g.restore();
    const gr = g.createRadialGradient(x - rx * .15, y + ry * .1, 0, x, y, rx * 1.05); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.5, ZAP.hot); gr.addColorStop(1, '#f2b418'); ell(g, x, y, rx, ry); g.fillStyle = gr; g.fill();
    const px = x - s * rx * .14, py = y + ry * .16; S.dot(g, E(px, py, rx * .2, ry * .6), '#1a1206'); S.dot(g, E(px - rx * .1, py - ry * .26, rx * .1, ry * .13), '#fff', .9);
    g.save(); ell(g, x, y, rx, ry); g.clip(); g.translate(x, y); g.rotate(-s * .5); g.fillStyle = EELD.base; g.fillRect(-rx - 6, -ry - 8, rx * 2 + 12, ry * .62 + 8); g.restore();
    g.save(); g.translate(x, y); g.rotate(-s * .5); S.tube(g, SO([[-rx - 3, -ry * .38 - 1], [0, -ry * .5 - 1.5], [rx + 3, -ry * .38 - 1]]), EELD, 4.2); g.restore();
    ell(g, x, y, rx, ry); g.strokeStyle = rgba(ZAP.deep, .7); g.lineWidth = 1; g.stroke();
  }
  /** The frilled fin crest fanned out behind the head (head-local, centred on (0, cy)); c 0..1 raises it; tips spark with glow. */
  function crest(g, cy, c, glow, R){
    const n = 7, spread = 1.28, Ls = [32, 37, 41, 43, 41, 37, 32], k = .84 + c * .22, tips = [], bases = [];
    for (let i = 0; i < n; i++){ const a = -Math.PI / 2 + (i / (n - 1) * 2 - 1) * spread, L = Ls[i] * k; tips.push([Math.cos(a) * L, cy + Math.sin(a) * L]); bases.push([Math.cos(a) * 10, cy + Math.sin(a) * 10]); }
    const pts = [bases[0]]; for (let i = 0; i < n; i++){ pts.push(tips[i]); if (i < n - 1){ const a = -Math.PI / 2 + ((i + .5) / (n - 1) * 2 - 1) * spread, L = (Ls[i] + Ls[i + 1]) / 2 * k * .74; pts.push([Math.cos(a) * L, cy + Math.sin(a) * L]); } } pts.push(bases[n - 1]);
    const mem = SM(pts, .45);
    g.save(); g.globalAlpha *= .94; S.part(g, mem, FIN, { x:0, y:cy - 22, r:38 }, { flat:true, mat:'gel', lw:1.3 }); g.restore();
    g.save(); mem(g); g.clip(); const gr = g.createRadialGradient(0, cy, 14, 0, cy, 46); gr.addColorStop(0, rgba(ZAP.glow, 0)); gr.addColorStop(1, rgba(ZAP.glow, .18 + glow * .18)); g.fillStyle = gr; g.fillRect(-60, cy - 60, 120, 70); g.restore();
    for (let i = 0; i < n; i++) S.tube(g, SO([bases[i], [(bases[i][0] + tips[i][0]) / 2, (bases[i][1] + tips[i][1]) / 2 - 1], tips[i]]), SPINE, 2.4);
    for (let i = 0; i < n; i++){ g.save(); g.shadowColor = ZAP.glow; g.shadowBlur = 5 + glow * 4; S.dot(g, E(tips[i][0], tips[i][1], 2 + glow * .5, 2 + glow * .5), ZAP.hot); g.restore(); S.dot(g, E(tips[i][0] - .5, tips[i][1] - .6, .8, .8), '#fff'); }
    // crackle jumping between neighbouring tips
    const m = glow > 1.2 ? n - 1 : glow > .5 ? 2 : 1;
    for (let j = 0; j < m; j++){ const i = glow > 1.2 ? j : Math.floor(R() * (n - 1)); arc(g, zig(tips[i][0], tips[i][1], tips[i + 1][0], tips[i + 1][1], R, 3.2, 4), 1, .55 + glow * .3); }
    return tips;
  }
  /** A side fin at the neck, fanned out sideways (s = -1 left, 1 right) from (x, y). */
  function sideFin(g, x, y, s, flap){
    g.save(); g.translate(x, y); g.scale(s, 1); g.rotate(flap * .25);
    const f = SM([[0, -4], [12, -11], [22, -9], [25, -2], [21, 5], [9, 6]], .6); S.part(g, f, FIN, { x:12, y:-2, r:13 }, { flat:true, mat:'gel', lw:1.1 });
    for (const [ex, ey] of [[22, -9], [25, -2], [21, 5]]) S.ln(g, [[2, -1], [ex - 2, ey]], SPINE, 1.2, .7);
    g.restore();
  }
  /** The broken harpoon: a snapped shaft stuck in the eel's back, angled up and out, with a rusted collar and a frayed rope. */
  function harpoon(g, x, y, ang, len){
    const cx = Math.cos(ang), cy = Math.sin(ang), ex = x + cx * len, ey = y + cy * len;
    S.tube(g, SO([[x, y], [ex, ey]]), WOOD, 4.4);
    // splintered break
    const nx = -cy, ny = cx; S.part(g, PL([[ex + nx * 2.6, ey + ny * 2.6], [ex + cx * 6 + nx * 1.4, ey + cy * 6 + ny * 1.4], [ex + cx * 3, ey + cy * 3], [ex + cx * 7.5 - nx * .6, ey + cy * 7.5 - ny * .6], [ex + cx * 2 - nx * 1.6, ey + cy * 2 - ny * 1.6], [ex - nx * 2.6, ey - ny * 2.6]]), SPLINT, { x:ex, y:ey, r:5 }, { flat:true, mat:'wood', lw:.9 });
    // rusted iron collar where the head was, and rope lashing
    const kx = x + cx * len * .32, ky = y + cy * len * .32; g.save(); g.translate(kx, ky); g.rotate(ang); S.part(g, PL([[-4, -3.6], [4, -3.6], [4, 3.6], [-4, 3.6]]), IRON, { x:0, y:0, r:5 }, { flat:true, mat:'metal', lw:1 }); S.dot(g, E(1, -1, 1.6, 1.2), RUSTO, .8); S.dot(g, E(-2, 1.6, 1.2, .9), RUSTO, .7); g.restore();
    const rx = x + cx * len * .58, ry = y + cy * len * .58; for (const d of [-1.6, 1.6]) S.ln(g, [[rx + cx * d + nx * 2.8, ry + cy * d + ny * 2.8], [rx + cx * d - nx * 2.8, ry + cy * d - ny * 2.8]], ROPE, 1.4, .9);
    S.tube(g, SO([[rx, ry + 2], [rx - 2, ry + 9], [rx + 1, ry + 15]]), ROPE, 1.8); S.thread(g, rx + 1, ry + 15, 1, ROPE);
  }
  /** The whole eel. Neck at (off(0), -2), spine running down `len` units to the tail. o: off(u) sideways offset along the body
   *  (u 0 neck .. 1 tail), jaw 0..1, glow 0..2, crest 0..1, ball 0..1 (lightning in the mouth), tilt (head), tail (draw the tail fin), seed. */
  function eelFigure(g, o){
    const len = o.len ?? 112, off = o.off ?? (() => 0), jaw = o.jaw ?? .12, glow = o.glow ?? .8, R = rng(o.seed ?? 1);
    const spine = []; for (let i = 0; i <= 5; i++){ const u = i / 5; spine.push([off(u), -2 + u * len]); }
    const rb = ribbon(spine, u => u < .12 ? 13 + u * 25 : Math.max(4.5, 16 - Math.max(0, u - .5) * (o.tail ? 22 : 8)), 6), C = rb.centre, N = C.length;
    const hx = spine[0][0], d0 = rb.dirs[0], tilt = (o.tilt ?? 0) + Math.atan2(-d0[0], d0[1]) * .6;
    // behind the body: the harpoon, the side fins, the tail fin
    { const i = Math.round(N * .14), [bx, by] = C[i]; harpoon(g, bx - 4, by, -Math.PI + .42, 42); }
    { const i = Math.round(N * .1); sideFin(g, rb.left[i][0] + 3, rb.left[i][1], -1, Math.sin((o.ph ?? 0)) ); sideFin(g, rb.right[i][0] - 3, rb.right[i][1], 1, Math.sin((o.ph ?? 0) + 1)); }
    if (o.tail){ const [tx, ty] = C[N - 1], [dx, dy] = rb.dirs[N - 1], nx = -dy, ny = dx;
      const fin = SM([[tx - nx * 3, ty - ny * 3], [tx + dx * 6 - nx * 13, ty + dy * 6 - ny * 13], [tx + dx * 16, ty + dy * 16], [tx + dx * 6 + nx * 13, ty + dy * 6 + ny * 13], [tx + nx * 3, ty + ny * 3]], .6);
      S.part(g, fin, FIN, { x:tx + dx * 8, y:ty + dy * 8, r:12 }, { flat:true, mat:'gel', lw:1.1 }); arc(g, zig(tx, ty, tx + dx * 15, ty + dy * 15, R, 2, 3), .8, .6 * glow); }
    // body: slick teal with a pale belly down the front and glowing lightning chevrons
    const mid = C[Math.round(N * .3)];
    S.part(g, rb.path, EEL, { x:mid[0] - 4, y:mid[1] - 6, r:30 }, { mat:'skin', hx:mid[0] - 9, hy:mid[1] - 20 });
    const belly = ribbon(spine, u => (u < .12 ? 13 + u * 25 : Math.max(4.5, 16 - Math.max(0, u - .5) * (o.tail ? 22 : 8))) * .42, 6);
    S.part(g, belly.path, BELLY, { x:mid[0], y:mid[1], r:20 }, { flat:true, noEdge:true, mat:'skin' });
    g.save(); rb.path(g); g.clip();
    let acc = 0, next = 12; for (let i = 1; i < N - 1; i++){ acc += Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]); if (acc < next) continue; next += 17; const L = rb.left[i], Rr = rb.right[i], [dx, dy] = rb.dirs[i], pts = [];
      for (let k = 0; k <= 4; k++){ const f = k / 4, sh = (k % 2 ? 1 : -1) * 3.4 + (k === 0 || k === 4 ? -2 : 0); pts.push([L[0] + (Rr[0] - L[0]) * f + dx * sh, L[1] + (Rr[1] - L[1]) * f + dy * sh]); }
      arc(g, pts, 2, .55 + glow * .3); }
    g.restore();
    S.overlay(g, rb.path, EEL, { x:mid[0] - 4, y:mid[1] - 6, r:30 }, .35);
    // a couple of barnacles and a weed strand low on the body
    { const i = Math.round(N * .3); barnacle(g, rb.right[i][0] - 4, rb.right[i][1] - 2, 3.2); barnacle(g, rb.right[i + 1][0] - 7, rb.right[i + 1][1] + 2, 2.4); }
    // charged arcs running down the body's edges
    if (glow > 1.05){ const a = (glow - 1.05) * 1.4; for (const side of [rb.left, rb.right]){ const i0 = 2 + Math.floor(R() * 4); arc(g, zig(side[i0][0], side[i0][1], side[i0 + 6][0], side[i0 + 6][1], R, 3, 5), 1.1, a); } }

    // head
    g.save(); g.translate(hx, -2); g.rotate(tilt);
    const tips = crest(g, -24, o.crest ?? 0, glow, R);
    const head = SM([[-22, -4], [-27, -16], [-25, -30], [-16, -42], [0, -46], [16, -42], [25, -30], [27, -16], [22, -4], [10, 0], [-10, 0]]);
    S.part(g, head, EEL, { x:0, y:-24, r:28 }, { mat:'skin', hx:-12, hy:-36 });
    S.contact(g, head, 0, -2, 18, 6, .35);
    // brow blaze: a little lightning bolt between the eyes
    arc(g, [[-3, -44], [2, -40], [-2, -38.5], [3, -33]], 1.6, .8 + glow * .2);
    // gill slits
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) S.ln(g, [[s * (19 + k * 2.4), -19 + k * 1.2], [s * (21 + k * 2.4), -10 + k * 1.2]], EELD, 1.3, .55);
    stormEye(g, -12, -28, 9.5, 9, -1, glow); stormEye(g, 12, -28, 9.5, 9, 1, glow);
    for (const s of [-1, 1]) S.dot(g, E(s * 4, -16, 1.4, 1), EELD.deep, .8);   // nostrils
    // mouth: the upper lip; it gapes as the jaw drops, lit from inside by the charge
    const J = jaw * 11, ball = o.ball ?? 0;
    if (J > .6){ const m = SM([[-19, -9], [-10, -10.5], [0, -11], [10, -10.5], [19, -9], [16, -7 + J * .9], [0, -6 + J], [-16, -7 + J * .9]], .7); S.dot(g, m, MOUTH);
      if (ball > 0){ g.save(); m(g); g.clip(); const gr = g.createRadialGradient(0, -6 + J * .5, 0, 0, -6 + J * .5, 22); gr.addColorStop(0, rgba(ZAP.hot, .9 * ball)); gr.addColorStop(1, rgba(ZAP.glow, 0)); g.fillStyle = gr; g.fillRect(-24, -14, 48, 30); g.restore(); }
      for (let i = 0; i < 6; i++){ const x = -12.5 + i * 5; S.dot(g, PL([[x - 1.2, -10.4], [x + 1.2, -10.4], [x, -7.4]]), TOOTH); } }
    S.stroke(g, SO([[-20, -9], [-10, -10.5], [0, -11], [10, -10.5], [20, -9]]), EELD, 1.5, .8);
    // the underbite: a jutting lower jaw, a pale chin, fangs standing up over the upper lip
    g.save(); g.translate(0, J);
    const jawP = SM([[-24, -10], [-28, -3], [-20, 5], [0, 8], [20, 5], [28, -3], [24, -10], [12, -7.5], [0, -7], [-12, -7.5]], .8);
    S.part(g, jawP, EEL, { x:0, y:-2, r:26 }, { flat:true, mat:'skin', lw:1.4 });
    S.part(g, SM([[-14, -4], [0, -3], [14, -4], [10, 4], [0, 6], [-10, 4]], .8), BELLY, { x:0, y:1, r:14 }, { flat:true, noEdge:true, mat:'skin' });
    for (const [x, L] of [[-19, 7], [-10, 5], [10, 5], [19, 7.5]]){ const b = -8.4 + Math.abs(x) * .03; S.part(g, PL([[x - 2.2, b], [x + 2.2, b], [x + (x < 0 ? .6 : -.6), b - L]]), pal('#eef6e4'), { x, y:b - L / 2, r:L / 2 + 1 }, { flat:true, mat:'bone', lw:.8 }); }
    for (let i = 0; i < 5; i++){ const x = -6 + i * 3; S.dot(g, PL([[x - 1, -7.6], [x + 1, -7.6], [x, -10]]), TOOTH); }
    // rusty fish hook through the jaw corner, a snapped line trailing off
    g.save(); g.lineCap = 'round'; g.strokeStyle = rgba(HOOKC.deep, .9); g.lineWidth = 2.6; g.beginPath(); g.moveTo(24, -14); g.lineTo(24, -4); g.arc(20, -4, 4, 0, Math.PI * .95); g.stroke();
    g.strokeStyle = HOOKC.base; g.lineWidth = 1.5; g.beginPath(); g.moveTo(24, -14); g.lineTo(24, -4); g.arc(20, -4, 4, 0, Math.PI * .95); g.stroke(); g.restore();
    S.dot(g, PL([[16, -4], [15, -8], [18.5, -5.5]]), HOOKC.base); S.dot(g, E(24, -9, 1.2, 1.6), RUSTO, .85); S.dot(g, E(22.5, -1.5, 1, .8), RUSTO, .8);
    S.dot(g, E(24, -15, 1.8, 1.4), IRON.base); g.strokeStyle = 'rgba(220,230,230,.55)'; g.lineWidth = .7; g.beginPath(); g.moveTo(24, -15.5); g.quadraticCurveTo(32, -22, 30, -34); g.stroke();
    g.restore();
    // wet sheen on the head
    g.save(); head(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.3)'; ell(g, -10, -38, 9, 2.6, -.4); g.fill(); g.restore();
    // lightning in the mouth
    if (ball > 0) zapBall(g, 0, -6 + J * .55, 3 + ball * 6, R, clamp(ball * 1.5));
    g.restore();
    // stray sparks around the crest and body
    const ns = glow > 1.2 ? 4 : glow > .7 ? 2 : 1;
    for (let k = 0; k < ns; k++){ const t = tips[Math.floor(R() * tips.length)], sx = hx + t[0] * 1.08 + (R() - .5) * 6, sy = -2 + t[1] * 1.05; spark(g, sx, sy, 4 + R() * 3, R, .6 + Math.min(.4, glow * .25)); }
  }

  // ---------- poses ----------
  /** Side-to-side sway along the body for a phase ph (radians) and amount a. */
  const swayOf = (ph, a = 1) => u => (Math.sin(ph + u * 3.2) * 8 - Math.sin(ph) * 3) * a * (1 - u * .35);
  const LIFT = 18;   // surfaced, the neck stands this far above the Diver's so a good length of body shows
  function eel(g, P = {}){
    if (P.hidden != null){ const t = P.hidden, R = rng(1 + Math.floor(t * 4) * 13);
      // under water: a glow of the stripes below the surface, bubbles and a spark breaking the surface now and then
      water(g, 0, WL + 3, 42, 10, t, .78);
      g.save(); const gr = g.createRadialGradient(0, WL + 4, 0, 0, WL + 4, 30); gr.addColorStop(0, rgba(ZAP.glow, .35 + Math.sin(t * TAU) * .12)); gr.addColorStop(1, rgba(ZAP.glow, 0)); ell(g, 0, WL + 3, 40, 9); g.fillStyle = gr; g.fill(); g.restore();
      arc(g, zig(-14, WL + 5, 12, WL + 2, R, 2.5, 4), .9, .45);
      for (const [x, y, r] of [[-10, WL - 1, 2.5], [8, WL - 4 - t * 4, 1.8], [16, WL + 1, 1.4]]) S.dot(g, E(x, y, r, r), '#e8f8ff', .7);
      if (Math.floor(t * 4) % 2 === 0) spark(g, 6 + R() * 10, WL - 3, 4, R, .7);
      return;
    }
    if (P.surface != null || P.down != null){
      const t = P.surface != null ? P.surface : 1 - P.down, sink = (1 - ease(t)) * 132;
      aboveWater(g, WL, () => { g.translate(0, sink - LIFT); eelFigure(g, { len:130, off:swayOf(0, .5), glow:.7, crest:.2 + t * .3, seed:3 }); });
      water(g, 0, WL + 3, 42, 10, t * .9, .8);
      if (P.surface != null){ splash(g, 0, WL, Math.min(1, t * 1.3), 4, 12, 44); splash(g, 0, WL, Math.max(0, t * 1.5 - .5), 8, 8, 30); }
      else splash(g, 0, WL, Math.max(0, P.down * 1.2 - .1), 6, 8, 26);
      return;
    }
    if (P.idle != null){ const ph = P.idle * TAU;
      aboveWater(g, WL, () => { g.translate(0, Math.sin(ph * 2) * 1.2 - LIFT); eelFigure(g, { len:130, off:swayOf(ph), tilt:Math.sin(ph) * .05, jaw:.12 + Math.max(0, Math.sin(ph)) * .1, glow:.75 + Math.sin(ph * 2) * .2, crest:.4 + Math.sin(ph) * .1, ph, seed:5 + Math.floor(P.idle * 6) }); });
      water(g, 0, WL + 3, 42, 10, P.idle, .8);
      return;
    }
    if (P.charge != null){ const k = ease(P.charge), ph = P.charge * TAU * .5;
      aboveWater(g, WL, () => { g.translate(0, -5 * k - LIFT); g.scale(1 - .05 * k, 1 - .05 * k); eelFigure(g, { len:130, off:u => swayOf(ph, 1 - k * .6)(u) - k * 3 * (1 - u), tilt:-k * .06, jaw:.12 + k * .4, glow:.8 + k * 1.2, crest:.4 + k * .6, ball:k * .75, ph, seed:11 + Math.floor(P.charge * 5) }); });
      water(g, 0, WL + 3, 42, 10, P.charge * .9, .8, k * .6);
      return;
    }
    if (P.shoot != null){ const t = P.shoot, REL = .3, lunge = t < REL ? ease(t / REL) : 1 - ease((t - REL) / (1 - REL)), drain = clamp((t - REL) / .5);
      aboveWater(g, WL, () => { g.translate(0, lunge * 7 - LIFT); g.scale(1 + lunge * .07, 1 + lunge * .07); eelFigure(g, { len:130, off:u => -2 * (1 - u) * lunge, tilt:0, jaw:t < REL ? .5 + lunge * .5 : 1 - drain * .85, glow:2 - drain * 1.3, crest:1 - drain * .6, ball:t < REL ? .75 + lunge * .25 : 0, seed:17 + Math.floor(t * 7) }); });
      water(g, 0, WL + 3, 42, 10, t * .9, .8, (1 - drain) * .7);
      // the bolt leaving the mouth down the lane (toward the wall); the engine takes over with the bolt sprite
      if (t >= REL){ const u = (t - REL) / (1 - REL), R = rng(23 + Math.floor(t * 8)), my = 1 - LIFT + 6, by = lerp(my + 4, 42, ease(clamp(u * 1.4))), a = 1 - clamp((u - .55) / .45);
        if (u < .35){ g.save(); g.globalAlpha *= 1 - u / .35; const gr = g.createRadialGradient(0, my, 0, 0, my, 34); gr.addColorStop(0, 'rgba(255,255,240,.95)'); gr.addColorStop(.4, rgba(ZAP.glow, .5)); gr.addColorStop(1, rgba(ZAP.glow, 0)); g.fillStyle = gr; g.fillRect(-34, my - 34, 68, 68); g.restore(); }
        arc(g, zig(0, my, 0, by, R, 5, 6), 2.4, a); zapBall(g, 0, by, 8, R, a); }
      return;
    }
    eel(g, { idle:0 });
  }

  // ---------- the bolt (projectile) ----------
  function bolt(g, P = {}){
    if (P.zap == null){ const t = P.fly ?? 0, R = rng(41 + Math.floor(t * 6) * 7);
      // zig-zag tail streaming up the lane behind the ball (the ball flies down at the wall)
      arc(g, zig(0, 0, (R() - .5) * 8, -54, R, 6, 6), 2.2, .85); arc(g, zig(0, -4, (R() - .5) * 14, -36, R, 5, 4), 1.3, .6);
      zapBall(g, 0, 0, 10 + Math.sin(t * TAU) * 1.2, R, 1);
      return;
    }
    const t = P.zap, R = rng(53 + Math.floor(t * 7) * 5), fl = 1 - clamp(t / .4), sp = ease(clamp(t / .7)), fade = 1 - clamp((t - .55) / .45);
    // scorch on the wall
    g.save(); g.globalAlpha *= .55 * clamp(t * 3) * (1 - .5 * clamp((t - .6) / .4)); S.dot(g, SM([[-18, 6], [-10, -4], [0, -2], [12, -6], [20, 4], [12, 12], [-4, 14], [-16, 12]], .7), '#1c1a14'); g.restore();
    // flash
    if (fl > 0){ g.save(); g.globalAlpha *= fl; const gr = g.createRadialGradient(0, 0, 0, 0, 0, 40); gr.addColorStop(0, 'rgba(255,255,245,1)'); gr.addColorStop(.35, rgba(ZAP.glow, .7)); gr.addColorStop(1, rgba(ZAP.glow, 0)); g.fillStyle = gr; g.fillRect(-40, -40, 80, 80); g.restore(); }
    // forks spraying out over the wall
    for (let k = 0; k < 6; k++){ const an = -Math.PI + (k + .5) / 6 * Math.PI * 1.3 - .15 + (R() - .5) * .3, L = 12 + sp * 26 * (.7 + R() * .5); arc(g, zig(0, 0, Math.cos(an) * L, Math.sin(an) * L * .8, R, 4, 4), 1.6 * (1 - sp * .4), fade); }
    if (t < .5) zapBall(g, 0, 0, 9 * (1 - t * 1.6), R, 1);
    // sparks falling off
    for (let k = 0; k < 6; k++){ const an = -Math.PI * .9 + R() * Math.PI * .8, d = 10 + sp * 22 * (.6 + R() * .6), x = Math.cos(an) * d, y = Math.sin(an) * d + sp * sp * 22; g.save(); g.globalAlpha *= fade; g.shadowColor = ZAP.glow; g.shadowBlur = 5; S.dot(g, E(x, y, 1.6, 1.6), ZAP.hot); g.restore(); }
  }

  return { eel, bolt };
})();

// =====================================================================
// 5. The Siren and her song note (ported from docs/archive/nightmare-monsters/siren/siren.js, without the `bend` swirl: her song hides rows, it does not
//    bend pumpkins). A scope of its own for the same reason as the others.
//    siren: a mermaid on a barnacled rock in her own pool. Clips: surface (once), idle (loop), sing (loop; engine/marsh.js plays it for SING_CLIP s), hit (once),
//               dive (once). The archive's `charm` clips are not used.
//    sirennote: the glowing note the engine lets drift down her lane (drift, loop).
// =====================================================================
const SIRENART = (() => {
  // ---------- palettes (Drowned Marsh, w5.js: kelp #2f6b3a, barnacles, drips #9fd8e8, sheen #5fa882) ----------
  const SKIN = pal('#c2ddd3'), SKIND = pal('#a2c6bb'), SHEEN = pal('#5fb0a0'),
    TAIL = pal('#2a8a86'), TAILB = pal('#7cc8b4'), FIN = pal('#6fd6c8'), SCL = '#8ff0dc',
    HAIR = pal('#2b5a46'), KELP = pal('#2f6b3a'), DRIP = pal('#9fd8e8'),
    ROCK = pal('#5f6d70'), MOSS = pal('#5c9a3a'), BARN = pal('#d8d0c0'), STAR = pal('#e88a5a'),
    SHELL = pal('#f0c2cc'), PEARL = pal('#eef0fa'), BONE = pal('#ece4cc'),
    EYEG = '#4ef0c4', EYEW = '#e6fff8', NOTEC = '#8ff8e2', NOTEG = '#2ee8c4', THROAT = '#4a1426', NEEDLE = '#f0f8f2';
  const WL = 44;   // the pool's waterline
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = t => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const lp = (A, B, t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t)];

  // ---------- helpers (copied from w5.js / kraken_pirate.js so the file stays self-contained) ----------
  function wet(g, clip, b, drips = []){ g.save(); clip(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, b.x - b.r * .3, b.y - b.r * .2, b.r * .32, b.r * .1, -.5); g.fill(); ell(g, b.x + b.r * .25, b.y + b.r * .3, b.r * .18, b.r * .06, -.4); g.fill(); g.restore();
    for (const [x, y, l] of drips){ S.tube(g, SO([[x, y], [x + 1, y + l]]), DRIP, 2); S.dot(g, E(x + 1, y + l + 1.5, 1.7, 2.1), '#c8f0ff', .9); } }
  function kelp(g, x, y, n = 3, len = 22, w = 4){ const R = rng(x * 3 + y * 5 + 7 | 0); for (let i = 0; i < n; i++){ const dx = (i - (n - 1) / 2) * 6 + (R() - .5) * 4, L = len * (.7 + R() * .6); S.tube(g, SO([[x + dx, y], [x + dx + (R() - .5) * 8, y + L * .5], [x + dx + (R() - .5) * 10, y + L]]), KELP, w); } }
  function barnacle(g, x, y, r = 4){ S.part(g, E(x, y, r, r * .8), BARN, { x, y, r }, { flat:true, mat:'stone', noEdge:true }); S.dot(g, E(x, y, r * .35, r * .3), '#3a3028', .9); }
  function starfish(g, x, y, r = 5, rot = 0){ g.save(); g.translate(x, y); g.rotate(rot); S.part(g, g2 => { g2.beginPath(); for (let i = 0; i < 10; i++){ const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r; g2.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g2.closePath(); }, STAR, { x:0, y:0, r }, { flat:true, mat:'skin' }); g.restore(); }
  function water(g, x, y, rx, ry, ph = 0, a = .85){
    g.save(); g.globalAlpha *= a;
    const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, 'rgba(130,205,228,.95)'); gr.addColorStop(1, 'rgba(50,130,160,.7)');
    ell(g, x, y, rx, ry); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(25,80,100,.7)'; g.lineWidth = 1.4; g.stroke();
    g.lineWidth = 1.3; for (let i = 0; i < 2; i++){ const k = (((ph + i * .5) % 1) + 1) % 1; g.strokeStyle = `rgba(225,248,255,${(1 - k) * .75})`; ell(g, x, y, rx * (.3 + k * .65), ry * (.3 + k * .65)); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, x - rx * .45, y - ry * .3, rx * .16, ry * .18, -.3); g.fill(); ell(g, x + rx * .4, y + ry * .25, rx * .1, ry * .14, -.3); g.fill();
    g.restore();
  }
  function splash(g, x, y, t, seed = 1, n = 10, spread = 34){
    if (t <= 0 || t >= 1) return;
    const R = rng(seed); g.save(); g.globalAlpha *= 1 - t * t;
    for (let i = 0; i < n; i++){ const a = -Math.PI * .92 + R() * Math.PI * .84, sp = spread * (.5 + R()), px = x + Math.cos(a) * sp * t, py = y + Math.sin(a) * sp * t + t * t * 22, r = 1.6 + R() * 2.2;
      S.dot(g, E(px, py, r, r * 1.3), '#bfeeff'); S.dot(g, E(px - r * .3, py - r * .4, r * .35, r * .35), '#fff', .9); }
    g.restore();
  }
  function foam(g, x, y, rx, ry, ph, n = 10, seed = 1, a = 1){
    const R = rng(seed); g.save(); g.globalAlpha *= a;
    for (let i = 0; i < n; i++){ const an = (i / n + ph * .15) * TAU, wob = 1 + Math.sin(ph * TAU * 2 + i * 1.7) * .12, px = x + Math.cos(an) * rx * wob, py = y + Math.sin(an) * ry * wob, r = 2 + R() * 2.4, al = .5 + R() * .3;
      S.dot(g, E(px, py, r, r * .75), '#eafcff', al); S.dot(g, E(px - r * .3, py - r * .3, r * .35, r * .3), '#fff', al); }
    g.restore();
  }
  function bubbles(g, x, y, t, seed, n = 7, h = 50){ const R = rng(seed); for (let i = 0; i < n; i++){ const k = (t + R()) % 1, px = x + (R() - .5) * 50 + Math.sin(k * 9 + i) * 3, py = y - k * h * (.5 + R() * .5), r = 1.5 + R() * 2.6; g.strokeStyle = `rgba(220,250,255,${(1 - k) * .9})`; g.lineWidth = 1.1; ell(g, px, py, r, r); g.stroke(); S.dot(g, E(px - r * .3, py - r * .3, r * .3, r * .3), '#fff', (1 - k) * .8); } }
  function aboveWater(g, wl, fn){ g.save(); g.beginPath(); g.rect(-300, -400, 600, 400 + wl); g.clip(); fn(); g.restore(); }
  function sheen(g, clip, x, y, r, a = .5){ g.save(); clip(g); g.clip(); const gr = g.createRadialGradient(x, y, r * .1, x, y, r); gr.addColorStop(0, rgba(SHEEN.base, a)); gr.addColorStop(1, rgba(SHEEN.base, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
  function crSample(pts, n){ const out = [], m = pts.length; for (let i = 0; i < m - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, m - 1)]; for (let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[m - 1]); return out; }
  /** A tapered ribbon along a spline: { path, left, right, centre, w }. */
  function ribbon(pts, wf, n = 6){ const c = crSample(pts, n), L = [], R = [], W = []; for (let i = 0; i < c.length; i++){ const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = wf(i / (c.length - 1)); W.push(w); L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); }
    const poly = [...L, ...R.slice().reverse()].map(p => [p[0], p[1]]); poly[0][2] = 1; poly[poly.length - 1][2] = 1; return { path:SM(poly, .5), left:L, right:R, centre:c, w:W }; }

  /** A glowing eighth note at (x, y), scale s, rotation rot, alpha a. */
  function noteGlyph(g, x, y, s = 1, rot = 0, a = 1, dbl = false){
    if (a <= .01) return;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha *= a;
    g.shadowColor = NOTEG; g.shadowBlur = 9;
    g.fillStyle = NOTEC; g.strokeStyle = NOTEC; g.lineCap = 'round'; g.lineJoin = 'round';
    ell(g, 0, 0, 5.2, 3.8, -.45); g.fill();
    g.lineWidth = 2; g.beginPath(); g.moveTo(4.4, -1.4); g.lineTo(4.4, -18); g.stroke();
    if (dbl){ ell(g, 12, -3, 5.2, 3.8, -.45); g.fill(); g.beginPath(); g.moveTo(16.4, -4.4); g.lineTo(16.4, -21); g.stroke(); g.lineWidth = 3.4; g.beginPath(); g.moveTo(4.4, -17); g.lineTo(16.4, -20); g.stroke(); }
    else { g.lineWidth = 2.4; g.beginPath(); g.moveTo(4.4, -18); g.quadraticCurveTo(12, -14, 10, -6); g.stroke(); }
    g.shadowBlur = 0;
    g.fillStyle = '#ffffff'; ell(g, -1.6, -1.2, 1.8, 1, -.45); g.fill();
    g.strokeStyle = 'rgba(10,80,70,.55)'; g.lineWidth = .8; ell(g, 0, 0, 5.2, 3.8, -.45); g.stroke();
    g.restore();
  }

  // ---------- the rock (part of her sprite) ----------
  function rock(g, ph){
    const R0 = SM([[-50, 48], [-54, 32], [-48, 18], [-36, 8], [-20, 4], [-4, 7], [12, 3], [30, 7], [44, 15], [52, 30], [50, 48]], .8), RB = { x:-6, y:22, r:52 };
    S.part(g, R0, ROCK, RB, { mat:'stone', hx:-28, hy:12 });
    g.save(); R0(g); g.clip();
    S.dot(g, E(10, 46, 46, 12), '#1c2a2c', .35);   // wet, dark foot
    S.crease(g, SO([[-30, 14], [-24, 26], [-28, 40]]), ROCK, 2.2, .55); S.crease(g, SO([[30, 14], [38, 26], [34, 40]]), ROCK, 2, .5);
    S.dot(g, SM([[-48, 22], [-34, 12], [-22, 10], [-30, 18], [-44, 28]], .8), MOSS.base, .7);   // moss cap on the left shoulder
    g.restore();
    wet(g, R0, RB);
    for (const [x, y, r] of [[-42, 30, 4], [-35, 36, 3], [-44, 40, 2.6], [40, 24, 3.6], [46, 32, 2.8], [36, 36, 2.4], [20, 40, 2.4]]) barnacle(g, x, y, r);
    starfish(g, 44, 18, 6, .3);
    // kelp draped over the left edge, swaying
    const sw = Math.sin(ph * TAU) * 2;
    for (const [x0, L] of [[-38, 30], [-30, 24]]) S.tube(g, SO([[x0, 8], [x0 - 8, 18], [x0 - 12 + sw, 28], [x0 - 10 + sw * 1.4, 8 + L]]), KELP, 4.2);
  }

  // ---------- body parts ----------
  /** The tail: from the hips, around the right front of the rock, curling to the left, fluke flicking. f -1..1 flick, lift raises the tip. */
  function tail(g, f = 0, lift = 0){
    const pts = [[0, -4], [6, 8], [18, 20], [16, 33], [2, 39], [-16, 36], [-28, 26 - lift * 6], [-34 - f * 2, 14 - f * 4 - lift * 14]];
    const rb = ribbon(pts, u => 15 * Math.pow(1 - u, .75) + 2.6, 5), c = rb.centre, N = c.length;
    S.part(g, rb.path, TAIL, { x:4, y:20, r:30 }, { mat:'scaly', hx:8, hy:8 });
    // pale belly stripe along the inner edge
    g.save(); rb.path(g); g.clip(); g.strokeStyle = rgba(TAILB.base, .55); g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); for (let i = 2; i < N - 2; i++){ const p = [c[i][0] + (rb.left[i][0] - c[i][0]) * .55, c[i][1] + (rb.left[i][1] - c[i][1]) * .55]; i > 2 ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.restore();
    // scale crescents along the top
    for (let i = 3; i < N - 4; i += 2){ const k = .2, px = c[i][0] + (rb.right[i][0] - c[i][0]) * k, py = c[i][1] + (rb.right[i][1] - c[i][1]) * k, r = rb.w[i] * .28; g.strokeStyle = rgba(SCL, .6); g.lineWidth = .9; g.beginPath(); g.arc(px, py, r, .2, Math.PI - .2); g.stroke(); }
    // a little frill fin on the coil
    const m = c[Math.floor(N * .45)], m2 = c[Math.floor(N * .45) + 2];
    S.part(g, SM([[m[0], m[1] + 6], [m[0] - 4, m[1] + 14], [m2[0] - 2, m2[1] + 16], [m2[0] + 2, m2[1] + 6]], .8), FIN, { x:m[0], y:m[1] + 10, r:8 }, { flat:true, mat:'gel', lw:1 });
    // the fluke at the tip, two lobes with ribs
    const tp = c[N - 1], pr = c[N - 4], a = Math.atan2(tp[1] - pr[1], tp[0] - pr[0]) + f * .35;
    g.save(); g.translate(tp[0], tp[1]); g.rotate(a);
    const fl = SM([[-3, 0, 1], [6, -6], [16, -15], [18, -9], [12, -1], [9, 0, 1], [12, 1], [18, 9], [16, 15], [6, 6]], .7);
    g.save(); g.globalAlpha *= .92; S.part(g, fl, FIN, { x:8, y:0, r:16 }, { mat:'gel', lw:1.2, hx:6, hy:-6 }); g.restore();
    for (const s of [-1, 1]) for (const k of [.4, .7, 1]) S.ln(g, [[1, 0], [6 + k * 10, s * (4 + k * 9)]], FIN, .8, .45);
    g.restore();
    return rb;
  }
  /** A scallop shell at (x, y), opening up, radius r. */
  function scallop(g, x, y, r, rot = 0){
    g.save(); g.translate(x, y); g.rotate(rot);
    const pts = [[-r * .25, r * .55, 1]]; for (let i = 0; i <= 8; i++){ const a = Math.PI * (1.05 + i / 8 * .9), rr = r * (i % 2 ? .92 : 1); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * .85 + r * .1]); } pts.push([r * .25, r * .55, 1]);
    const p = SM(pts, .6); S.part(g, p, SHELL, { x:0, y:-r * .2, r }, { mat:'paint', lw:1.1, hx:-r * .35, hy:-r * .45 });
    for (let i = 1; i < 8; i++){ const a = Math.PI * (1.05 + i / 8 * .9); S.ln(g, [[0, r * .45], [Math.cos(a) * r * .9, Math.sin(a) * r * .78 + r * .1]], SHELL, .8, .4); }
    S.part(g, E(0, r * .5, r * .3, r * .16), SHELL, { x:0, y:r * .5, r:r * .3 }, { flat:true, lw:.8 });
    g.restore();
  }
  function pearl(g, x, y, r){ S.part(g, E(x, y, r, r), PEARL, { x, y, r }, { lw:.7, hx:x - r * .35, hy:y - r * .4 }); }
  /** A fish skeleton used as a hair comb. */
  function boneComb(g, x, y, rot){
    g.save(); g.translate(x, y); g.rotate(rot);
    S.ln(g, [[-12, 0], [12, 0]], BONE, 3.4, .85); S.ln(g, [[-12, 0], [12, 0]], pal('#fffaf0'), 1.8, .9);
    for (let i = 0; i < 5; i++){ const xx = -7 + i * 4, l = 5.5 - Math.abs(i - 1.5) * .8; for (const s of [-1, 1]){ g.strokeStyle = BONE.base; g.lineWidth = 1.3; g.lineCap = 'round'; g.beginPath(); g.moveTo(xx, 0); g.quadraticCurveTo(xx - 1.5, s * l * .6, xx - 2.4, s * l); g.stroke(); } }
    S.part(g, PL([[11, -5], [20, 0], [11, 5], [9, 0]]), BONE, { x:14, y:0, r:6 }, { flat:true, mat:'bone', lw:.9 }); S.dot(g, E(14.5, -.8, 1.3, 1.3), '#2a2a28');
    S.part(g, PL([[-12, 0], [-18, -5], [-16, 0], [-18, 5]]), BONE, { x:-15, y:0, r:5 }, { flat:true, mat:'bone', lw:.8 });
    g.restore();
  }
  /** An arm: shoulder, elbow, hand; dir = where the fingers point. */
  function arm(g, sh, el, hd, dir, fingers = 4){
    S.tube(g, SO([sh, el, hd]), SKIND, 6.4);
    // webbed fingers with pointed nails
    const [hx, hy] = hd;
    g.save(); g.globalAlpha *= .55; S.dot(g, PL([[hx + Math.cos(dir - .7) * 6, hy + Math.sin(dir - .7) * 6], [hx + Math.cos(dir) * 8, hy + Math.sin(dir) * 8], [hx + Math.cos(dir + .7) * 6, hy + Math.sin(dir + .7) * 6], [hx, hy]]), FIN.base); g.restore();
    for (let i = 0; i < fingers; i++){ const a = dir + (i - (fingers - 1) / 2) * .42, mx = hx + Math.cos(a) * 4, my = hy + Math.sin(a) * 4, tx = hx + Math.cos(a) * 8.5, ty = hy + Math.sin(a) * 8.5;
      S.tube(g, SO([[mx, my], [tx, ty]]), SKIND, 2.4); S.claw(g, tx, ty, a, 2.6, '#e8f6f0'); }
    S.part(g, E(hx, hy, 4.4, 4), SKIND, { x:hx, y:hy, r:4.4 }, { flat:true, mat:'skin', lw:1 });
  }

  /** Hair behind the head: a long wet mass down both sides to the rock, ends split like kelp fronds. sw -1..1 sways the ends. */
  function backHair(g, sw, flare = 0){
    const d = y => (y + 70) / 90;   // how far down the strand: ends sway most
    const X = (x, y) => x + sw * 5 * d(y) * Math.sign(x || 1) * .3 + sw * 4 * d(y) + Math.sign(x) * flare * 8 * d(y);
    const pts = [[-24, -78], [-31, -60], [-33, -36], [-36, -12], [-38, 8, 1], [-33, 4], [-31, 14, 1], [-26, 2], [-20, -10], [20, -10], [26, 2], [31, 14, 1], [33, 4], [38, 8, 1], [36, -12], [33, -36], [31, -60], [24, -78], [0, -88]].map(p => [X(p[0], p[1]), p[1], p[2]]);
    const hp = SM(pts, .8);
    S.part(g, hp, HAIR, { x:0, y:-46, r:46 }, { mat:'skin', hx:-20, hy:-74 });
    g.save(); hp(g); g.clip();
    for (const s of [-1, 1]) for (const k of [0, 1]) S.crease(g, SO([[s * (22 + k * 5), -64], [X(s * (28 + k * 4), -30), -30], [X(s * (30 + k * 3), 2), 2]]), HAIR, 1.6, .5);
    g.restore();
    // dripping kelp-leaf tips
    for (const [x, y] of [[-38, 8], [-31, 14], [31, 14], [38, 8]]){ const px = X(x, y), py = y; S.dot(g, E(px, py + 3, 1.6, 2.1), '#c8f0ff', .85); }
  }
  /** Strands that fall in front of the shoulders. */
  function frontHair(g, sw, flare = 0){
    for (const s of [-1, 1]){ const k = sw * 3, f = flare * s * 6;
      S.tube(g, SO([[s * 18, -66], [s * 25, -44], [s * 23 + k * .5 + f * .4, -20], [s * 26 + k + f, 0]]), HAIR, 5.2);
      S.tube(g, SO([[s * 13, -70], [s * 20, -48], [s * 17 + k * .5 + f * .3, -30], [s * 19 + k + f * .7, -14]]), HAIR, 3.6);
      S.dot(g, E(s * 26 + k + f + .5, 4, 1.6, 2.1), '#c8f0ff', .85); }
  }

  /** The head. o: mouth 0..1 (gape), white 0..1 (eye glow), squeeze (hit), look -1..1, tilt. */
  function head(g, o){
    const mouth = o.mouth ?? 0, J = mouth * 9, white = o.white ?? 0, sq = o.squeeze ?? 0, lk = o.look ?? 0;
    // fin ears
    for (const s of [-1, 1]){ const fe = SM([[s * 20, -64, 1], [s * 34, -80], [s * 38, -72], [s * 41, -62], [s * 37, -52], [s * 22, -52, 1]], .7);
      g.save(); g.globalAlpha *= .92; S.part(g, fe, FIN, { x:s * 30, y:-64, r:14 }, { flat:true, mat:'gel', lw:1.1 }); g.restore();
      for (const [ex, ey] of [[34, -78], [39, -68], [38, -56]]) S.ln(g, [[s * 22, -58], [s * ex, ey]], FIN, .8, .45); }
    const hd = SM([[-24, -64], [-24, -50], [-18, -40 + J * .3], [-8, -33 + J], [0, -32 + J], [8, -33 + J], [18, -40 + J * .3], [24, -50], [24, -64], [18, -80], [0, -86], [-18, -80]]), HB = { x:0, y:-58, r:28 };
    S.part(g, hd, SKIN, HB, { mat:'skin', hx:-12, hy:-74 });
    sheen(g, hd, 0, -28, 30, .45);
    S.contact(g, hd, 0, -84, 26, 8, .3);
    // cheek scales and a faint blush
    for (const s of [-1, 1]) for (const [dx, dy] of [[0, 0], [3, 3], [-1, 4]]){ S.dot(g, E(s * (19 + dx), -50 + dy, 1.7, 1.5), SCL, .7); S.dot(g, E(s * (19 + dx), -49.4 + dy, 1.7, .8), TAIL.deep, .3); }
    S.blush(g, 0, -46, .62);
    // eyes
    for (const s of [-1, 1]){ const ex = s * 10.5, ey = -58;
      if (sq > .3){ S.ln(g, [[ex - s * 6, ey - 5], [ex + s * 3, ey], [ex - s * 6, ey + 4]], SKIN, 2.2, .9); continue; }
      if (white > .5){
        g.save(); g.shadowColor = EYEW; g.shadowBlur = 14; S.dot(g, E(ex, ey, 9, 10), '#dffff6'); g.restore();
        S.dot(g, E(ex, ey, 7.5, 8.5), '#ffffff'); S.dot(g, E(ex, ey + 1, 4.5, 5), rgba(EYEG, .35));
        // a heavy, slanted lid: the sweet look gone
        g.save(); ell(g, ex, ey, 9.2, 10.2); g.clip(); g.translate(ex, ey); g.rotate(s * .38); g.fillStyle = SKIN.dark; g.fillRect(-14, -16, 28, 10); g.restore();
        S.ln(g, [[ex - s * 9, ey - 2], [ex + s * 7, ey - 9]], SKIN, 1.6, .8);
      } else {
        g.save(); g.shadowColor = EYEG; g.shadowBlur = 10; S.dot(g, E(ex, ey, 9.6, 10.6), rgba(EYEG, .45)); g.restore();
        S.eye(g, ex, ey, 8.6, 9.6, { pr:.44, lx:lk * .25 + s * .04, ly:.14, iris:EYEG, pupil:'#0c3a34', lid:.12, tilt:-s * .12, lidCol:SKIN.base, lidDeep:SKIN.deep });
        // glow in the iris
        g.save(); ell(g, ex, ey, 8.6, 9.6); g.clip(); g.shadowColor = EYEG; g.shadowBlur = 6; S.dot(g, E(ex + lk * 2 + s * .4, ey + 3.6, 3.4, 2), EYEG, .8); g.restore();
        // lashes at the outer corner and a tired dark ring under
        for (const k of [0, 1]) S.ln(g, [[ex + s * (6 + k * 2), ey - 7 + k * 2], [ex + s * (10 + k * 2), ey - 10 + k * 2]], pal('#1a2a26'), 1.3, .9);
        S.dot(g, SM([[ex - 6, ey + 9], [ex, ey + 11.5], [ex + 6, ey + 9], [ex, ey + 10]], .8), SKIN.deep, .32);
      } }
    // nose slits
    for (const s of [-1, 1]) S.dot(g, E(s * 1.8, -47, .8, 1.5, s * .3), SKIN.deep, .6);
    // the mouth
    if (mouth < .12 && sq < .3){
      S.stroke(g, SO([[-6.5, -42], [-3, -40], [0, -40.5], [3, -40], [6.5, -42]]), SKIN, 1.4, .9);
      for (const x of [-3, 3]) S.dot(g, PL([[x - .9, -40.4], [x + .9, -40.4], [x, -38]]), NEEDLE);   // a hint of fang
    } else {
      const m = Math.max(mouth, sq > .3 ? .35 : 0), cy = -40 + m * 4.5, rx = 5 + m * 8, ry = 1.8 + m * 7.4, mp = E(0, cy, rx, ry);
      S.dot(g, mp, '#0a1614'); g.save(); mp(g); g.clip(); const tg = g.createRadialGradient(0, cy + ry * .3, 1, 0, cy, rx); tg.addColorStop(0, THROAT); tg.addColorStop(.55, '#1a0a12'); tg.addColorStop(1, '#0a1614'); g.fillStyle = tg; g.fillRect(-rx, cy - ry, rx * 2, ry * 2);
      S.dot(g, E(0, cy + ry * .7, rx * .45, ry * .3), '#8a3a4a', .7); g.restore();
      // needle teeth, top row pointing down, bottom row pointing up
      const n = Math.round(7 + m * 6);
      for (const top of [true, false]) for (let i = 0; i < n; i++){ const u = i / (n - 1), a = top ? Math.PI + .22 + u * (Math.PI - .44) : .22 + u * (Math.PI - .44), x = Math.cos(a) * rx, y = cy + Math.sin(a) * ry,
        L = (2.2 + m * 2.6) * (1 - Math.abs(u - .5) * .7), dir = top ? 1 : -1;
        S.dot(g, PL([[x - .9, y], [x + .9, y], [x * .94, y + dir * L]]), NEEDLE); }
      g.strokeStyle = rgba(SKIN.deep, .75); g.lineWidth = 1.2; ell(g, 0, cy, rx, ry); g.stroke();
      S.dot(g, E(0, cy + ry + 2, rx * .5, 1.2), SKIN.light, .35);   // the stretched lower lip catching light
    }
    // bangs: side-swept wet hair over the forehead
    const bang = SM([[-25, -60], [-26, -74], [-14, -87], [4, -89], [20, -82], [26, -68], [25, -58], [18, -70], [10, -67, 1], [3, -75], [-6, -69, 1], [-14, -74], [-20, -66, 1]], .8);
    S.part(g, bang, HAIR, { x:0, y:-76, r:26 }, { mat:'skin', hx:-8, hy:-84 });
    g.save(); bang(g); g.clip(); for (const x of [-14, -4, 8, 18]) S.crease(g, SO([[x + 4, -88], [x, -76], [x - 3, -68]]), HAIR, 1.3, .5); g.restore();
    wet(g, hd, HB, [[-22, -46, 4]]);
    // ornaments: a fish-bone comb on the right, a pearl and a little shell on the left
    boneComb(g, 16, -86, -.55);
    pearl(g, -22, -80, 3); scallop(g, -16, -86, 5, -.4);
  }

  // ---------- the siren ----------
  function siren(g, P = {}){
    let sink = 0, rockSink = 0, ph = 0, flick = 0, mouth = 0, white = 0, sq = 0, lean = 0, sway = 0, flare = 0, look = 0, br = 0, notesT = null, wave = 0,
      charmK = null, slipK = 0, lift = 0, dripAll = false, splashT = 0, splashT2 = 0, splashX = 0, bub = 0;
    if (P.surface != null){ const t = P.surface, e = 1 - Math.pow(1 - t, 2.2); sink = (1 - e) * 150; ph = t; sway = Math.sin(t * TAU) * .6; flick = Math.sin(t * TAU * 1.5); dripAll = true; splashT = Math.min(.999, t * 1.25); splashT2 = Math.max(0, t * 1.6 - .6); }
    else if (P.dive != null){ const t = P.dive; ph = t; slipK = ease(clamp(t / .55)); rockSink = ease(clamp((t - .5) / .5)) * 80; flick = -slipK; lift = slipK; sq = slipK > .1 && slipK < .9 ? 1 : 0; flare = slipK * .6; splashT = clamp((t - .3) / .55); splashX = -22; bub = t; mouth = slipK > .1 ? .2 : 0; }
    else if (P.sing != null){ const t = P.sing; ph = t; br = Math.sin(t * TAU); mouth = .8 + Math.sin(t * TAU * 2) * .2; white = 1; notesT = t; wave = t; sway = Math.sin(t * TAU) * .8; flick = Math.sin(t * TAU) * .6; lean = Math.sin(t * TAU) * .03; }
    else if (P.charm != null){ const t = P.charm; charmK = t; ph = t; const wind = ease(clamp(t / .35)), sweep = ease(clamp((t - .35) / .22)), rel = ease(clamp((t - .7) / .3));
      lean = -wind * .1 + sweep * .2 - rel * .1; mouth = .5 + sweep * .5 - rel * .3; white = 1; sway = -wind * .6 + sweep * 1.4 - rel * .8; flare = sweep * (1 - rel) * .5; flick = -wind + sweep * 1.6 - rel * .6; look = -wind + sweep * 2 - rel; }
    else if (P.hit != null){ const t = P.hit, k = Math.sin(t * Math.PI); ph = t; sq = k > .25 ? 1 : 0; mouth = .1; lean = -k * .16; flare = k * .9; sway = k * .6; flick = k * 1.2; }
    else { const t = P.idle ?? 0; ph = t; br = Math.sin(t * TAU); sway = Math.sin(t * TAU); flick = Math.sin(t * TAU + .6); look = Math.sin(t * TAU + 1.4) * .7; }
    g.save(); if (P.flip) g.scale(-1, 1);
    aboveWater(g, WL, () => {
      g.save(); g.translate(0, sink);
      g.save(); g.translate(0, rockSink); rock(g, ph); g.restore();
      // she: pivots at the hips (0, 0); the dive slides her off the rock to the left and down into the pool
      g.save();
      if (slipK > 0){ g.translate(-slipK * 16, slipK * 120 - Math.sin(slipK * Math.PI) * 10); g.rotate(-slipK * .95); }
      backHair(g, sway, flare);
      // hips: where skin turns to tail, with little side fins
      tail(g, flick, lift);
      for (const s of [-1, 1]) S.part(g, SM([[s * 13, -2], [s * 24, 2], [s * 26, 10], [s * 16, 8]], .8), FIN, { x:s * 20, y:4, r:8 }, { flat:true, mat:'gel', lw:1 });
      const hip = SM([[-16, -8], [-17, 4], [-8, 12], [8, 12], [17, 4], [16, -8]], .8); S.part(g, hip, TAIL, { x:0, y:2, r:17 }, { mat:'scaly', hx:-6, hy:-2 });
      g.save(); g.translate(0, 2); g.rotate(lean); g.translate(0, -2 + br * -.8);
      // torso
      const torso = SM([[-14, 0], [-13, -10], [-18, -22], [-15, -29], [0, -31], [15, -29], [18, -22], [13, -10], [14, 0]], .85), TB = { x:0, y:-14, r:20 };
      S.part(g, torso, SKIN, TB, { mat:'skin', hx:-6, hy:-22 }); sheen(g, torso, 0, 4, 22, .5);
      // the scalloped line where the scales start
      for (let x = -13; x <= 13; x += 3.25){ S.part(g, E(x, -1.5, 2.5, 2.4), TAIL, { x, y:-1.5, r:2.5 }, { flat:true, noEdge:true }); g.strokeStyle = rgba(SCL, .7); g.lineWidth = .7; g.beginPath(); g.arc(x, -1.5, 2.2, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      S.crease(g, SO([[-2, -12], [0, -6], [-1, -2]]), SKIN, 1.1, .3);
      // shoulder scales
      for (const s of [-1, 1]) for (const [dx, dy] of [[0, 0], [3, 2], [-2, 3], [1, 5], [5, -1]]){ S.dot(g, E(s * (14 + dx), -27 + dy, 2.1, 1.8), SCL, .8); S.dot(g, E(s * (14 + dx), -26.2 + dy, 2.1, 1), TAIL.deep, .3); }
      scallop(g, -7.5, -15, 7.6, -.2); scallop(g, 7.5, -15, 7.6, .2);
      S.ln(g, [[-2, -18], [2, -18]], SHELL, 1.2, .7);
      // pearl necklace with a little conch
      for (let i = 0; i < 9; i++){ const u = i / 8, x = -11 + u * 22, y = -28 + Math.sin(u * Math.PI) * 4.4; pearl(g, x, y, 1.6); }
      S.part(g, SM([[-2.4, -22], [2.4, -22], [1.4, -17], [0, -15, 1], [-1.4, -17]], .7), SHELL, { x:0, y:-19, r:4 }, { flat:true, mat:'paint', lw:.8 });
      wet(g, torso, TB, [[-12, -4, 4]]);
      frontHair(g, sway, flare);
      // arms
      const LS = [-15, -25], RS = [15, -25];
      let lEl, lHd, lDir, rEl, rHd, rDir;
      if (P.sing != null){ const b = Math.sin(ph * TAU) * 2; lEl = [-28, -16 + b]; lHd = [-38, -32 + b]; lDir = -Math.PI * .7; rEl = [28, -16 - b]; rHd = [38, -32 - b]; rDir = -Math.PI * .3; }
      else if (charmK != null){ const t = charmK, rest = [[28, -16], [38, -32]], wind = [[8, -12], [-12, -24]], out = [[32, -24], [48, -28]], w = ease(clamp(t / .35)), s = ease(clamp((t - .35) / .22)), r = ease(clamp((t - .7) / .3));
        let E2 = lp(rest[0], wind[0], w), H2 = lp(rest[1], wind[1], w); if (s > 0){ E2 = lp(E2, out[0], s); H2 = lp(H2, out[1], s); } if (r > 0){ E2 = lp(E2, rest[0], r); H2 = lp(H2, rest[1], r); }
        rEl = E2; rHd = H2; rDir = lerp(lerp(-Math.PI * .3, Math.PI * 1.1, w), 0, s) * (1 - r) + -Math.PI * .3 * r; lEl = [-26, -12]; lHd = [-32, 4]; lDir = Math.PI * .55; }
      else if (P.hit != null){ const k = Math.sin(P.hit * Math.PI); lEl = lp([-26, -8], [-30, -22], k); lHd = lp([-30, 6], [-36, -38], k); lDir = lerp(Math.PI * .55, -Math.PI * .7, k); rEl = lp([24, -10], [30, -22], k); rHd = lp([14, 2], [36, -38], k); rDir = lerp(Math.PI * .8, -Math.PI * .3, k); }
      else { const b = br * 1.2; lEl = [-26, -8 + b * .3]; lHd = [-30, 6]; lDir = Math.PI * .55; rEl = [24, -10 + b * .3]; rHd = [14, 2]; rDir = Math.PI * .85; }
      // the charm sweep trail (behind the arm)
      if (charmK != null){ const s = clamp((charmK - .35) / .22), fade = 1 - clamp((charmK - .6) / .15); if (s > 0 && fade > 0){ g.save(); g.globalAlpha *= fade * .8; g.lineCap = 'round'; g.shadowColor = NOTEG; g.shadowBlur = 8;
        for (let i = 0; i < 3; i++){ g.strokeStyle = `rgba(143,248,226,${.6 - i * .16})`; g.lineWidth = 3 - i * .8; g.beginPath(); g.arc(15, -25, 32 + i * 6, Math.PI * (1.05 - .05 * i), Math.PI * (1.05 + .95 * s), false); g.stroke(); } g.restore(); } }
      arm(g, LS, lEl, lHd, lDir); arm(g, RS, rEl, rHd, rDir);
      // neck and head
      S.tube(g, SO([[0, -32], [0, -38]]), SKIND, 9);
      g.save(); g.translate(0, -36); g.rotate(sway * .05 + (P.hit != null ? -Math.sin(P.hit * Math.PI) * .12 : 0) + (charmK != null ? lean * .5 : 0)); g.translate(0, 36);
      head(g, { mouth, white, squeeze:sq, look });
      g.restore();
      // song notes rising off her mouth (the engine sends the lane note separately, from the `note` entry)
      if (notesT != null) for (let i = 0; i < 3; i++){ const k = (notesT + i / 3) % 1, s = i % 2 ? 1 : -1, x = s * (8 + k * 30) + Math.sin(k * 7 + i) * 3, y = -38 - k * 50;
        noteGlyph(g, x, y, .62 + k * .3, s * .25 + Math.sin(k * 6) * .2, Math.sin(k * Math.PI), i === 1); }
      // the charm: the strong note blooms at her fingertips as the sweep ends
      if (charmK != null){ const k = clamp((charmK - .5) / .4); if (k > 0 && k < 1){ const [hx, hy] = rHd; g.save(); g.globalAlpha *= Math.sin(k * Math.PI);
        g.shadowColor = NOTEG; g.shadowBlur = 14; g.strokeStyle = rgba(NOTEC, .7); g.lineWidth = 1.6; ell(g, hx + 2, hy - 4, 7 + k * 6, 7 + k * 6); g.stroke(); g.restore();
        noteGlyph(g, hx - 2 + k * 2, hy - 2, .9 + k * .15, .2, Math.sin(k * Math.PI) * 1.2, true); } }
      g.restore();
      if (dripAll){ for (const [x, y, l] of [[-24, -10, 6], [22, -6, 5], [-6, 10, 4]]) { S.tube(g, SO([[x, y], [x + 1, y + l]]), DRIP, 1.8); S.dot(g, E(x + 1, y + l + 1.5, 1.6, 2), '#c8f0ff', .9); } }
      g.restore();
      g.restore();
    });
    // the pool: water disc over the rock's foot, ripples, foam, splashes and bubbles
    const ext = P.surface != null ? .4 + P.surface * .6 : 1;
    water(g, 0, WL + 3, 60 * ext + 2, 11 * ext + 1, ph * .9, .82);
    foam(g, 0, WL + 1, 46 * ext, 6, ph, 12, 3, P.dive != null ? Math.max(.3, 1 - rockSink / 80) : .9);
    if (wave){ g.save(); g.strokeStyle = 'rgba(143,248,226,.55)'; g.lineWidth = 1.2; for (let i = 0; i < 2; i++){ const k = (wave + i * .5) % 1; g.globalAlpha = 1 - k; ell(g, 0, WL + 3, 34 + k * 26, 6 + k * 5); g.stroke(); } g.restore(); }
    if (P.surface != null){ splash(g, 0, WL, splashT, 4, 16, 44); splash(g, 0, WL, splashT2, 8, 10, 32); }
    if (P.dive != null){ splash(g, splashX, WL, splashT, 6, 14, 28); splash(g, 0, WL, clamp((P.dive - .6) / .4), 11, 10, 36); bubbles(g, -12, WL, bub, 9, 7, 30 * bub); }
    g.restore();
  }

  // ---------- the lane note (engine projectile / effect) ----------
  function note(g, P = {}){
    const t = P.drift ?? 0, wx = Math.sin(t * TAU) * 4, rot = Math.sin(t * TAU) * .18;
    // the wavy trail streaming up behind it (it drifts down the lane, toward the wall)
    g.save(); g.lineCap = 'round'; g.shadowColor = NOTEG; g.shadowBlur = 8;
    for (let j = 0; j < 2; j++){ g.beginPath(); for (let i = 0; i <= 14; i++){ const u = i / 14, y = -4 - u * 44, x = wx * (1 - u) + Math.sin(u * 9 - t * TAU + j * 1.6) * (2 + u * 5) + (j ? 3 : -2);
        i ? g.lineTo(x, y) : g.moveTo(x, y); }
      const gr = g.createLinearGradient(0, -4, 0, -48); gr.addColorStop(0, rgba(NOTEC, j ? .55 : .8)); gr.addColorStop(1, rgba(NOTEC, 0)); g.strokeStyle = gr; g.lineWidth = j ? 1.5 : 2.6; g.stroke(); }
    g.restore();
    // sparkles shed along the trail
    for (let i = 0; i < 3; i++){ const k = (t + i / 3) % 1, x = Math.sin(i * 2.4 + k * 5) * 9, y = -10 - k * 34; g.save(); g.globalAlpha *= (1 - k) * .9; g.shadowColor = NOTEG; g.shadowBlur = 6; S.dot(g, E(x, y, 1.5 - k * .6, 1.5 - k * .6), '#e8fff8'); g.restore(); }
    // soft halo and the note itself
    g.save(); const hg = g.createRadialGradient(wx, 0, 0, wx, 0, 16); hg.addColorStop(0, 'rgba(78,240,196,.45)'); hg.addColorStop(1, 'rgba(78,240,196,0)'); g.fillStyle = hg; ell(g, wx, -4, 16, 16); g.fill(); g.restore();
    noteGlyph(g, wx - 3, 6, 1.15, rot, 1);
  }
  return { siren, note };
})();

// =====================================================================
// 5. The Kraken, its Tentacle and the anchor (Release 9, Task 8; docs/archive/nightmare-monsters/kraken-pirate/kraken_pirate.js, the pirate left out).
//    kraken: the surfaced head, violet with red-irised eyes and a hooked beak, rising from the crimson sea. Clips: surface (once), idle (loop), dive (once).
//    tentacle: one arm in its own lane. Clips: rise (once), sway (loop), throw (once: it coils back with a cursed anchor and flings it; the anchor leaves the tip
//               0.55 of the way through, engine/marsh.js). Not flipped: one baked look for every lane.
//    anchor: the cursed anchor in flight (spin, loop; render/draw.js drawArrows). Every clip is baked by render/anim.js; the glow and shadows are baked with it.
// =====================================================================
const KRAKENART = (() => {
  // ---------- palettes (blood moon, crimson sea) ----------
  const KR = pal('#6a2c7a'), KRD = pal('#45195a'), KRU = pal('#f0b0b4'), SUCK = pal('#ffd8d0'), BEAK = pal('#3a2a2e'), BROW = pal('#52206a'),
    BARN = pal('#d8d0c0'), KELP = pal('#3a5a2a'), RUST = pal('#6a5a52'), RUSTO = '#b8582a', CHAIN = pal('#58504c'),
    EYEI = '#ff3a26', GLOW = '#ff3a26';
  const SEA = { in:'rgba(196,30,42,.96)', out:'rgba(86,6,14,.8)', edge:'rgba(40,2,8,.85)', ring:'255,140,130', hi:'rgba(255,200,190,.45)', foam:'#ffc4bc', drop:'#e03848' };

  // ---------- shared helpers ----------
  /** Wet sheen and drips on a clip shape. */
  function wet(g, clip, b, drips = [], hi = 'rgba(255,255,255,.32)', dc = pal('#c8e8f0'), drop = '#e8f8ff'){ g.save(); clip(g); g.clip(); g.fillStyle = hi; ell(g, b.x - b.r * .3, b.y - b.r * .2, b.r * .32, b.r * .1, -.5); g.fill(); ell(g, b.x + b.r * .25, b.y + b.r * .3, b.r * .18, b.r * .06, -.4); g.fill(); g.restore();
    for (const [x, y, l] of drips){ S.tube(g, SO([[x, y], [x + 1, y + l]]), dc, 2.2); S.dot(g, E(x + 1, y + l + 1.5, 1.8, 2.2), drop, .9); } }
  function barnacle(g, x, y, r = 4){ S.part(g, E(x, y, r, r * .8), BARN, { x, y, r }, { flat:true, mat:'stone', noEdge:true }); S.dot(g, E(x, y, r * .35, r * .3), '#3a3028', .9); }
  function kelp(g, x, y, n = 3, len = 22, w = 4){ const R = rng(x * 3 + y * 5 + 7 | 0); for (let i = 0; i < n; i++){ const dx = (i - (n - 1) / 2) * 6 + (R() - .5) * 4, L = len * (.7 + R() * .6); S.tube(g, SO([[x + dx, y], [x + dx + (R() - .5) * 8, y + L * .5], [x + dx + (R() - .5) * 10, y + L]]), KELP, w); } }
  function aboveWater(g, wl, fn){ g.save(); g.beginPath(); g.rect(-300, -400, 600, 400 + wl); g.clip(); fn(); g.restore(); }
  /** Splash droplets flying up from (x, y); t 0..1 along the arc. */
  function splash(g, x, y, t, seed = 1, n = 10, spread = 34, col = '#e03848'){
    if (t <= 0 || t >= 1) return;
    const R = rng(seed); g.save(); g.globalAlpha *= 1 - t * t;
    for (let i = 0; i < n; i++){ const a = -Math.PI * .92 + R() * Math.PI * .84, sp = spread * (.5 + R()), px = x + Math.cos(a) * sp * t, py = y + Math.sin(a) * sp * t + t * t * 46, r = 1.8 + R() * 2.4;
      S.dot(g, E(px, py, r, r * 1.3), col); S.dot(g, E(px - r * .3, py - r * .4, r * .35, r * .35), '#ffd0c8', .9); }
    g.restore();
  }
  /** Foam ring at the waterline. */
  function foam(g, x, y, rx, ry, ph, n = 12, seed = 1, a = 1){
    const R = rng(seed); g.save(); g.globalAlpha *= a;
    for (let i = 0; i < n; i++){ const an = (i / n + ph * .15) * TAU, wob = 1 + Math.sin(ph * TAU * 2 + i * 1.7) * .12, px = x + Math.cos(an) * rx * wob, py = y + Math.sin(an) * ry * wob, r = 2.4 + R() * 3, al = .6 + R() * .3;
      S.dot(g, E(px, py, r, r * .7), SEA.foam, al); S.dot(g, E(px - r * .3, py - r * .3, r * .35, r * .3), '#fff', al); }
    g.restore();
  }
  /** Ripple rings on the water (only rings, the sea itself is the engine's). */
  function ripples(g, x, y, rx, ry, ph, a = .8){ g.save(); g.lineWidth = 1.6; for (let i = 0; i < 2; i++){ const k = (ph + i * .5) % 1; g.strokeStyle = `rgba(${SEA.ring},${(1 - k) * a})`; ell(g, x, y, rx * (.45 + k * .6), ry * (.45 + k * .6)); g.stroke(); } g.restore(); }
  /** Rising bubbles (dive). */
  function bubbles(g, x, y, t, seed, n = 7, h = 60){ const R = rng(seed); for (let i = 0; i < n; i++){ const k = (t + R()) % 1, px = x + (R() - .5) * 60 + Math.sin(k * 9 + i) * 3, py = y - k * h * (.5 + R() * .5), r = 1.5 + R() * 3; g.strokeStyle = `rgba(255,200,190,${(1 - k) * .9})`; g.lineWidth = 1.1; ell(g, px, py, r, r); g.stroke(); S.dot(g, E(px - r * .3, py - r * .3, r * .3, r * .3), '#fff', (1 - k) * .8); } }

  function crSample(pts, n){ const out = [], m = pts.length; for (let i = 0; i < m - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, m - 1)]; for (let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[m - 1]); return out; }
  /** A tapered ribbon along a spline: { path, left, right, centre, w }. Left is the side the tip curls towards when angles increase. */
  function ribbon(pts, wf, n = 6){ const c = crSample(pts, n), L = [], R = [], W = []; for (let i = 0; i < c.length; i++){ const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = wf(i / (c.length - 1)); W.push(w); L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); }
    const poly = [...L, ...R.slice().reverse()].map(p => [p[0], p[1]]); poly[0][2] = 1; poly[poly.length - 1][2] = 1; return { path:SM(poly, .5), left:L, right:R, centre:c, w:W }; }
  /** A chain of segments from (x, y) starting at angle a0; curls[i] bends each joint. */
  function spine(x, y, a0, segL, curls){ const pts = [[x, y]]; let a = a0; for (const c of curls){ a += c; x += Math.cos(a) * segL; y += Math.sin(a) * segL; pts.push([x, y]); } return pts; }
  /** An octopus arm along spine points: violet top, pink underside on the curling side, suckers. `side` 1 = suckers on left, -1 = right. */
  function arm(g, pts, w0, side = 1, seed = 1, tipW = 1.3){
    const rb = ribbon(pts, u => w0 * Math.pow(1 - u, .8) + tipW, 5), c = rb.centre, N = c.length;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of c){ x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const b = { x:(x0 + x1) / 2, y:(y0 + y1) / 2, r:Math.max(x1 - x0, y1 - y0) / 2 + w0 };
    S.part(g, rb.path, KR, b, { mat:'skin', flat:true });
    const inner = side > 0 ? rb.left : rb.right;
    // the pink underside: a strip between the centre line (pushed a bit outward) and the inner edge
    const strip = [...inner.map(p => [p[0], p[1]]), ...c.map((p, i) => [p[0] + (p[0] - inner[i][0]) * .15, p[1] + (p[1] - inner[i][1]) * .15]).reverse()]; strip[0][2] = 1; strip[strip.length - 1][2] = 1;
    g.save(); rb.path(g); g.clip(); S.part(g, SM(strip, .5), KRU, b, { flat:true, noEdge:true, mat:'skin' }); g.restore();
    // a lit line along the top side
    const outer = side > 0 ? rb.right : rb.left; g.save(); g.strokeStyle = 'rgba(255,220,255,.32)'; g.lineWidth = Math.max(1, w0 * .18); g.lineCap = 'round'; g.beginPath(); for (let i = 1; i < N - 3; i++){ const p = [c[i][0] + (outer[i][0] - c[i][0]) * .5, c[i][1] + (outer[i][1] - c[i][1]) * .5]; i > 1 ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.restore();
    // suckers
    for (let i = 2; i < N - 2; i += 2){ const k = .6, px = c[i][0] + (inner[i][0] - c[i][0]) * k, py = c[i][1] + (inner[i][1] - c[i][1]) * k, r = rb.w[i] * .36; if (r < .9) continue;
      S.dot(g, E(px, py, r, r), SUCK.base); S.dot(g, E(px, py, r * .5, r * .5), mix(KRU.deep, '#3a0a1a', .3), .85); S.dot(g, E(px - r * .35, py - r * .4, r * .25, r * .2), '#fff', .8); }
    // a few dark spots on top
    const R = rng(seed); for (let i = 3; i < N - 4; i += 3){ const k = .45 + R() * .2, px = c[i][0] + (outer[i][0] - c[i][0]) * k, py = c[i][1] + (outer[i][1] - c[i][1]) * k, r = rb.w[i] * (.18 + R() * .12); S.dot(g, E(px, py, r, r * .8, R() * 3), KRD.deep, .45); }
    return rb;
  }

  // ---------- the cursed anchor (projectile prop) ----------
  function anchor(g, P = {}){
    const sp = (P.spin ?? 0) * TAU;
    g.save(); g.rotate(sp);
    // cursed glow behind it (baked once into the prop sprite)
    g.save(); g.shadowColor = GLOW; g.shadowBlur = 9;   // cursed glow: a red halo around every main part (baked once)
    // chain stub from the ring
    for (let i = 0; i < 3; i++){ const y = -26 - i * 6, x = Math.sin(i * 1.3) * 2; g.save(); g.translate(x, y); g.rotate(i % 2 ? .2 : -.2); S.part(g, E(0, 0, i % 2 ? 1.8 : 3, 3.8), CHAIN, { x:0, y:0, r:4 }, { flat:true, mat:'metal', lw:1 }); S.dot(g, E(0, 0, i % 2 ? .6 : 1.4, 2), '#1a1418', .9); g.restore(); }
    // ring, shank, stock
    g.save(); ell(g, 0, -19, 5.5, 5.5); g.strokeStyle = rgba(RUST.deep, .9); g.lineWidth = 4.6; g.stroke(); ell(g, 0, -19, 5.5, 5.5); g.strokeStyle = RUST.base; g.lineWidth = 3; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = .8; g.beginPath(); g.arc(0, -19, 5.5, Math.PI * 1.1, Math.PI * 1.6); g.stroke(); g.restore();
    S.part(g, RR(-14, -14, 28, 5, 2.5), RUST, { x:0, y:-12, r:14 }, { flat:true, mat:'metal', lw:1.2 });
    S.part(g, RR(-3.2, -15, 6.4, 34, 3), RUST, { x:0, y:2, r:16 }, { mat:'metal', hx:-1, hy:-6 });
    // arms with flukes
    const arms = SM([[-22, 4, 1], [-18, 13], [-8, 21], [0, 23], [8, 21], [18, 13], [22, 4, 1], [16, 9], [8, 15], [0, 16], [-8, 15], [-16, 9]], .7);
    S.part(g, arms, RUST, { x:0, y:12, r:20 }, { flat:true, mat:'metal', lw:1.3 });
    for (const s of [-1, 1]) S.part(g, PL([[s * 24, -1], [s * 17, 6], [s * 26, 9]]), RUST, { x:s * 22, y:4, r:6 }, { flat:true, mat:'metal', lw:1.1 });
    S.part(g, PL([[-3, 20], [3, 20], [0, 27]]), RUST, { x:0, y:22, r:4 }, { flat:true, mat:'metal', lw:1 });
    g.restore();
    // rust blooms, barnacles, a strand of weed, and a glowing red crack
    const R = rng(77); for (let i = 0; i < 6; i++) S.dot(g, E(-12 + R() * 24, -12 + R() * 30, 1.2 + R() * 1.6, 1 + R(), R() * 3), RUSTO, .55);
    barnacle(g, 10, 13, 2.6); barnacle(g, -2, -2, 2.2); barnacle(g, -15, 11, 2);
    S.tube(g, SO([[-12, -12], [-15, -4], [-13, 4]]), KELP, 2.2);
    g.save(); g.shadowColor = GLOW; g.shadowBlur = 6; g.strokeStyle = '#ff6a50'; g.lineWidth = 1.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -10); g.lineTo(1.5, -3); g.lineTo(-1, 3); g.lineTo(1, 10); g.stroke(); g.restore();
    g.restore();
  }

  // ---------- the Kraken body ----------
  /** The surfaced head-and-mantle; o: br (breath -1..1), sw (sway -1..1), eye (open 0..1), beak (0..1), look (-1..1), armPh 0..1, strain (0..1, the dive squeeze). */
  function krakenBody(g, o){
    const br = o.br ?? 0, sw = o.sw ?? 0, op = o.eye ?? 1, bk = o.beak ?? .2, ap = (o.armPh ?? 0) * TAU, st = o.strain ?? 0, lk = o.look ?? 0;
    // back arms (behind the body): a low arch over the water and a tall arm whose tip curls up above the brows
    for (const s of [-1, 1]){ const pB = ap + (s > 0 ? 2.1 : .3), pA = ap + (s > 0 ? 1 : 0), side = s > 0 ? 1 : -1;
      arm(g, spine(s * 74, 64, -Math.PI / 2 + s * .5, 9, [0, .25, .35, .45, .55, .6].map((c, i) => s * (c + Math.sin(pB + i * .7) * .07))), 10, side, 37 + (s > 0 ? 3 : 0));
      arm(g, spine(s * 62, 66, -Math.PI / 2 - s * (.15 + Math.sin(pA) * .05), 15, [0, .03, .05, .07, .1, .16, .3, .5, .7, .9].map((c, i) => s * (c + Math.sin(pA + i * .6) * .05))), 13, side, 31 + (s > 0 ? 3 : 0)); }
    g.save(); g.translate(0, 44); g.rotate(sw * .03); g.scale(1 + br * .025, 1 - br * .03 - st * .05); g.translate(0, -44);
    // the mantle: a tall tapering sack that bends back and droops its tip to the right; the tip sways with the breath
    const spn = [[0, 50], [-2, 0], [-8, -48], [-2, -88], [16 + sw * 6, -110 + br * 2], [38 + sw * 10, -110 + br * 3], [52 + sw * 13, -94 + br * 4]];
    const mb = ribbon(spn, u => 3 + 51 * Math.pow(Math.cos(u * Math.PI / 2), .85), 6), mantle = mb.path, MB = { x:-4, y:-44, r:86 };
    S.part(g, mantle, KR, MB, { mat:'skin', hx:-26, hy:-74 });
    g.save(); mantle(g); g.clip();
    const R = rng(5); for (let i = 0; i < 18; i++){ const k = 2 + Math.floor(R() * (mb.centre.length - 6)), c = mb.centre[k], w = mb.w[k] * .8, x = c[0] + (R() - .5) * w * 2, y = c[1] + (R() - .5) * 12, r = 2.2 + R() * 4.5; S.dot(g, E(x, y, r, r * .75, R() * 3), KRD.deep, .3 + R() * .2); }
    // two ridges running up the mantle, following its bend
    for (const off of [-.42, .3]){ const pts = []; for (let i = 3; i < mb.centre.length - 3; i++){ const c = mb.centre[i], l = mb.left[i]; pts.push([c[0] + (l[0] - c[0]) * off, c[1] + (l[1] - c[1]) * off]); } S.crease(g, SO(pts), KR, 2.6, .5); }
    // glowing red veins (the curse) faint under the skin
    g.shadowColor = GLOW; g.shadowBlur = 6; g.strokeStyle = 'rgba(255,70,50,.55)'; g.lineWidth = 1.3; g.lineCap = 'round';
    for (const pts of [[[-32, -78], [-26, -64], [-32, -50], [-28, -38]], [[6, -104], [10, -88], [4, -74]], [[36, -48], [30, -36], [36, -24]]]){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
    g.shadowBlur = 0;
    // gill folds behind the eyes
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++){ const y = -6 + i * 9; S.crease(g, SO([[s * 42, y - 4], [s * 48, y], [s * 50, y + 6]]), KR, 2.2, .6); S.dot(g, E(s * 47, y + 1, 1.3, 4, -s * .4), '#1a0618', .55); }
    S.contact(g, mantle, 0, 50, 60, 14, .45);
    g.restore();
    barnacle(g, -40, -44, 4.4); barnacle(g, -34, -54, 3); barnacle(g, 30, -76, 3.4); barnacle(g, 42, -30, 3); barnacle(g, -10, -96, 3);
    kelp(g, -50, -34, 2, 18, 3.6);
    wet(g, mantle, MB, [[-53, 6, 8], [52, 0, 7]], 'rgba(255,220,240,.3)', pal('#d8a8c8'), '#ffd8e0');
    // the eyes: huge, red-irised, glowing slit pupils, angled lids
    for (const s of [-1, 1]){ const ex = s * 25, ey = -2;
      S.dot(g, E(ex, ey, 19, 20), KRD.deep, .55);
      const lid = Math.min(1, .26 + (1 - op) * .74 + st * .4);
      S.eye(g, ex, ey, 16, 17, { pr:.46, lx:lk * .3 - s * .06, ly:.15, iris:EYEI, pupil:'#3a0408', lid, lidCol:KR.base, lidDeep:KR.deep, tilt:-s * .38 });
      if (op > .3){ const px = ex + lk * 4.8 - s * 1, py = ey + 3; g.save(); ell(g, ex, ey, 16, 17); g.clip(); g.globalAlpha *= op; g.shadowColor = '#ff3a26'; g.shadowBlur = 8; g.fillStyle = '#ffb02a'; ell(g, px, py, 2.4, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = '#fff2b0'; ell(g, px, py, .9, 5); g.fill(); g.restore(); } }
    // heavy brows angled down to the middle
    for (const s of [-1, 1]) S.part(g, SM([[s * 4, -10 + st * 2], [s * 14, -18], [s * 40, -32 - st * 2], [s * 52, -28], [s * 48, -19], [s * 22, -8 + st * 3], [s * 9, -3]], .7), BROW, { x:s * 28, y:-18, r:26 }, { mat:'skin', lw:1.5, hx:s * 24 - 6, hy:-22 });
    // the open maw low on the body: a wide fleshy lip ring, a red throat ringed with hooked teeth, and the parrot beak inside
    const gap = 2 + bk * 7, my = 33;
    const lip = SM([[-30, my], [-18, my - 13 - gap * .3], [0, my - 16 - gap * .4], [18, my - 13 - gap * .3], [30, my], [18, my + 13 + gap * .3], [0, my + 16 + gap * .4], [-18, my + 13 + gap * .3]], .9);
    S.part(g, lip, KRU, { x:0, y:my, r:30 }, { flat:true, mat:'skin', lw:1.6 });
    for (let i = 0; i < 14; i++){ const a = i / 14 * TAU; S.ln(g, [[Math.cos(a) * 22, my + Math.sin(a) * (11 + gap * .5)], [Math.cos(a) * 28, my + Math.sin(a) * (14 + gap * .4)]], KRU, 1.3, .55); }
    const rx = 21, ry = 9 + gap * .7, maw = E(0, my, rx, ry);
    S.dot(g, maw, '#4a0818'); g.save(); maw(g); g.clip(); const tg = g.createRadialGradient(0, my, 1, 0, my, rx); tg.addColorStop(0, '#0c0006'); tg.addColorStop(.55, '#2a0410'); tg.addColorStop(1, '#6a1028'); g.fillStyle = tg; g.fillRect(-rx, my - ry, rx * 2, ry * 2); g.restore();
    g.strokeStyle = 'rgba(40,0,10,.8)'; g.lineWidth = 1.4; ell(g, 0, my, rx, ry); g.stroke();
    // a ring of small hooked teeth around the rim, pointing in
    for (let i = 0; i < 14; i++){ const a = i / 14 * TAU + .1, x = Math.cos(a) * rx, y = my + Math.sin(a) * ry, ix = -Math.cos(a), iy = -Math.sin(a) * ry / rx, n = Math.hypot(ix, iy), dx = ix / n, dy = iy / n, L = 4.5;
      S.dot(g, PL([[x - dy * 1.7, y + dx * 1.7], [x + dy * 1.7, y - dx * 1.7], [x + dx * L + dy * 1.2, y + dy * L - dx * 1.2]]), '#f4e8dc'); }
    // the beak: lower jaw (point up) under the upper hook (point down), the gap between them opening on the clack
    g.save(); g.translate(0, my + 2 + gap * .45); g.scale(.85, .85);
    S.part(g, SM([[-9, -1], [-3, 1], [0, -4, 1], [3, 1], [9, -1], [7, 5], [0, 8], [-7, 5]], .8), BEAK, { x:0, y:3, r:9 }, { mat:'horn', hx:-4, hy:1 });
    g.restore();
    g.save(); g.translate(0, my - 4 - gap * .45); g.scale(.85, .85);
    const upper = SM([[-11, -5], [0, -8], [11, -5], [10, 1], [5, 5], [2, 10], [0, 13, 1], [-2, 10], [-5, 5], [-10, 1]], .8);
    S.part(g, upper, BEAK, { x:0, y:0, r:12 }, { mat:'horn', hx:-4, hy:-4 });
    S.ln(g, [[-8, -1], [0, 2], [8, -1]], BEAK, 1, .6); g.fillStyle = 'rgba(255,255,255,.6)'; ell(g, 4, -4, 3.2, 1.2, .3); g.fill(); ell(g, 1, 7, .8, 2.4); g.fill();
    g.restore();
    g.restore();
    // big front arms rising out of the water on both sides of the mouth, sucker rows facing out, tips curling outward
    for (const s of [-1, 1]){ const c = Math.sin(ap + (s > 0 ? 2.4 : .6)) * .06; arm(g, spine(s * 32, 70, -Math.PI / 2 + s * .3, 13, [0, .04, .07, .11, .28, .5, .75, .9].map(k => s * (k + c))), 13, s > 0 ? 1 : -1, 61 + (s > 0 ? 2 : 0)); }
  }
  function kraken(g, P = {}){
    const WL = 50;
    let sink = 0, eye = 1, beak = .2, br = 0, sw = 0, look = 0, armPh = 0, strain = 0, ph = 0;
    if (P.surface != null){ const t = P.surface, e = 1 - Math.pow(1 - t, 2.2); sink = (1 - e) * 175; eye = t < .65 ? 0 : (t - .65) / .35; beak = t > .8 ? (t - .8) * 3 : 0; armPh = t * .5; ph = t; br = Math.sin(t * Math.PI) * .6; }
    else if (P.dive != null){ const t = P.dive, e = t * t; sink = e * 180; strain = Math.min(1, t * 3); eye = 1 - Math.min(1, t * 2.2); beak = .4 * (1 - t); armPh = .5 + t * .4; ph = t; br = -Math.min(1, t * 2); }
    else { const t = P.idle ?? 0; br = Math.sin(t * TAU); sw = Math.sin(t * TAU + .8); beak = .1 + Math.max(0, Math.sin(t * TAU * 2)) * .9; look = Math.sin(t * TAU) * .8; armPh = t; ph = t; eye = 1; }
    aboveWater(g, WL, () => { g.translate(0, sink); krakenBody(g, { br, sw, eye, beak, look, armPh, strain }); });
    // the waterline: foam, ripples, splashes and bubbles (the sea itself is drawn by the engine)
    const ext = P.surface != null || P.dive != null ? Math.max(.25, 1 - sink / 180) : 1;
    ripples(g, 0, WL + 2, 96 * ext + 10, 13, ph * .9, .7);
    foam(g, 0, WL + 2, 62 * ext + 8, 8, ph, 16, 3, .4 + ext * .6);
    if (P.surface != null){ splash(g, 0, WL, Math.min(.999, P.surface * 1.25), 4, 18, 70); splash(g, 0, WL, Math.max(0, P.surface * 1.6 - .6), 8, 12, 46); }
    if (P.dive != null){ splash(g, 0, WL, Math.max(0, P.dive * 1.3 - .3), 6, 14, 48); bubbles(g, 0, WL, P.dive, 9, 9, 50 * P.dive); }
  }

  // ---------- a Kraken tentacle (its own lane, rises when the body dives) ----------
  const TSEG = 15, TN = 8;
  /** Curl profile: a gentle S near the base and a tight hook at the tip; `bend` shifts the whole arm, `hook` the tip. */
  function tentCurls(bend, hook, wave){ const c = []; for (let i = 0; i < TN; i++){ const u = i / (TN - 1); c.push(bend * (1 - u) * .22 + Math.sin(wave + i * .75) * .1 * (1 - u * .4) + hook * Math.pow(u, 2.2) * .8); } c[0] = 0; return c; }
  function tentacle(g, P = {}){
    const WL = 50; let a0 = -Math.PI / 2, bend = 0, hook = .9, wave = 0, sink = 0, hold = false, holdT = 0, ph = 0, swoosh = 0, fling = 0;
    if (P.rise != null){ const t = P.rise, e = 1 - Math.pow(1 - t, 2); sink = (1 - e) * 140; hook = 1.6 - e * .7; bend = -(1 - t) * .5; wave = t * 2; ph = t; }
    else if (P.throw != null){ const k = P.throw; ph = k;
      if (k < .45){ const e = Math.sin(k / .45 * Math.PI / 2); a0 = -Math.PI / 2 - e * .55; bend = -e * 1.6; hook = .9 + e * .8; wave = 0; hold = true; holdT = e; }
      else if (k < .7){ const e = (k - .45) / .25, s = e * e * (3 - 2 * e); a0 = -Math.PI / 2 - .55 + s * .85; bend = -1.6 + s * 1.9; hook = 1.7 - s * 2.0; wave = 0; hold = k < .55; holdT = 1; swoosh = Math.sin(e * Math.PI); fling = e; }
      else { const e = (k - .7) / .3, s = e * e * (3 - 2 * e); a0 = -Math.PI / 2 + .3 * (1 - s); bend = .3 * (1 - s); hook = -.3 + 1.33 * s; wave = 0; }
    } else { const t = P.sway ?? 0; ph = t; wave = -t * TAU; bend = Math.sin(t * TAU) * .5; hook = .9 + Math.sin(t * TAU + 1) * .15; a0 = -Math.PI / 2 + Math.sin(t * TAU) * .08; }
    g.save(); if (P.flip) g.scale(-1, 1);
    aboveWater(g, WL, () => {
      g.translate(0, sink);
      const pts = spine(0, WL + 22, a0, TSEG, tentCurls(bend, hook, wave));
      // swoosh trail behind the whip
      if (swoosh > .05){ g.save(); g.globalAlpha *= swoosh * .7; g.lineCap = 'round'; for (let i = 0; i < 3; i++){ g.strokeStyle = `rgba(255,190,190,${.5 - i * .14})`; g.lineWidth = 3 - i * .8; g.beginPath(); g.arc(0, WL + 22, 100 + i * 9, -Math.PI * .78, -Math.PI * (.78 - .4 * fling)); g.stroke(); } g.restore(); }
      const tip = pts[pts.length - 1], pre = pts[pts.length - 2];
      if (hold){ g.save(); g.translate(tip[0] + (tip[0] - pre[0]) * .2, tip[1] + (tip[1] - pre[1]) * .2 + 6); g.scale(.8, .8); anchor(g, { spin:-.08 - holdT * .1 }); g.restore(); }
      arm(g, pts, 15, 1, 101, 1.6);
      barnacle(g, pts[2][0] - 6, pts[2][1] + 4, 3); barnacle(g, pts[3][0] - 5, pts[3][1], 2.4);
      wet(g, g2 => { g2.beginPath(); g2.rect(-200, -200, 400, 400); }, { x:pts[3][0], y:pts[3][1], r:30 }, [[pts[1][0] - 8, pts[1][1], 6]], 'rgba(0,0,0,0)', pal('#d8a8c8'), '#ffd8e0');
      // once released (t >= .55) the anchor is the engine's projectile, drawn from the `anchor` prop
    });
    ripples(g, 0, WL + 2, 26, 7, ph, .8); foam(g, 0, WL + 2, 18, 5, ph, 9, 5, .9);
    if (P.rise != null) splash(g, 0, WL, Math.min(.999, P.rise * 1.3), 12, 10, 32);
    g.restore();
  }
  return { kraken, tentacle, anchor };
})();

// ---------- registry (format of ./index.js) ----------
const C = (n, fps, key, once = false) => ({ n, fps, once, pose:t => ({ [key]:t }) });
export const MARSH = {
  // r 23 like the Splitter Slime's family (scale .64, dy -11)
  bloodslime: { draw:bloodslime, scale:.64, dy:-11, box:{ x:-64, y:-46, w:128, h:106 }, clips:{ walk:C(8, 9, 'walk'), chew:C(4, 8, 'chew') }, still:{} },
  bloodblob: { draw:bloodlet, scale:.64, dy:-11, box:{ x:-32, y:-6, w:64, h:64 }, clips:{ walk:C(8, 12, 'walk'), chew:C(4, 8, 'chew') }, still:{} },
  // r 22; the shoot clip's arm and muzzle flash need the width
  pirate: { draw:pirate, scale:.6, dy:-11, box:{ x:-48, y:-86, w:142, h:140 }, clips:{ walk:C(8, 8, 'walk'), chew:C(4, 8, 'chew'), shoot:C(8, 12, 'shoot', true) }, still:{} },
  // r 26 like the Shell Turtle; the imp stands tall on the shell
  turtlerider: { draw:RIDERS.turtleRider, scale:.56, dy:-8, box:{ x:-70, y:-118, w:140, h:190 }, clips:{ walk:C(8, 6, 'walk'), chew:C(4, 6, 'chew'), throw:C(10, 14, 'throw', true) }, still:{} },
  rotshot: { draw:RIDERS.rottenShot, scale:.56, dy:0, box:{ x:-44, y:-56, w:88, h:110 }, clips:{ fly:C(6, 12, 'fly'), splat:C(7, 14, 'splat', true) }, still:{ fly:0 } },
  // the Puddle Diver's footprint (waterline 38, scale .6, dy -11). The pose follows the engine's cycle (engine/marsh.js): surface 0.4 s, charge TYPES.eel.charge s, shoot 0.57 s
  // (the bolt leaves 0.17 s in), then idle, and the down clip for its last 0.33 s.
  eel: { draw:EELART.eel, scale:.6, dy:-11, box:{ x:-88, y:-108, w:176, h:174 }, still:{ idle:0 },
    clips:{ hidden:C(4, 6, 'hidden'), surface:C(6, 14, 'surface', true), idle:C(6, 8, 'idle'), charge:C(6, 12, 'charge', true), shoot:C(8, 14, 'shoot', true), down:C(4, 12, 'down', true) },
    frame(m, clips){
      if (m.hidden) return ['hidden', Math.floor(m.ph * clips.hidden.fps) % clips.hidden.n];
      const T = TYPES.eel, el = T.up - m.upT, c = clips;
      const at = (name, t, d) => [name, Math.max(0, Math.min(c[name].n - 1, Math.floor(t / d * c[name].n)))];
      if (el < 0.4) return at('surface', el, 0.4);
      if (el < 0.4 + T.charge) return at('charge', el - 0.4, T.charge);
      const sd = c.shoot.n / c.shoot.fps;
      if (el < 0.4 + T.charge + sd) return at('shoot', el - 0.4 - T.charge, sd);
      if (m.upT < c.down.n / c.down.fps) return at('down', c.down.n / c.down.fps - m.upT, c.down.n / c.down.fps);
      return ['idle', Math.floor(m.ph * c.idle.fps) % c.idle.n];
    } },
  // r 24; the archive's own suggested scale and box. She surfaces for her first 0.8 s, sings while the engine's m.sing runs (engine/marsh.js), else idles.
  siren: { draw:SIRENART.siren, scale:.5, dy:-3, box:{ x:-92, y:-112, w:176, h:180 }, still:{ idle:0 },
    clips:{ surface:C(8, 10, 'surface', true), idle:C(8, 6, 'idle'), sing:C(8, 8, 'sing') },
    frame(m, clips){
      if (m.age < 0.8) return ['surface', Math.min(clips.surface.n - 1, Math.floor(m.age * clips.surface.fps))];
      if (m.sing > 0) return ['sing', Math.floor(m.ph * clips.sing.fps) % clips.sing.n];
      return ['idle', Math.floor(m.ph * clips.idle.fps) % clips.idle.n];
    } },
  sirennote: { draw:SIRENART.note, scale:.5, dy:0, box:{ x:-26, y:-54, w:52, h:72 }, clips:{ drift:C(8, 10, 'drift') }, still:{ drift:0 } },
  // The Kraken (r 34 boss footprint at the archive's scale .58 and box). Bake scale capped at 2: 24 frames of 132 x 126 px stay near 6 MB (check_kraken_baked < 12 MB incl. the arm).
  // The head is only drawn while it is up (m.hidden: render/draw.js skips it); surface for its first KR_SURFACE s, dive for its last, idle between (engine/marsh.js).
  kraken: { draw:KRAKENART.kraken, scale:.58, dy:-6, box:{ x:-114, y:-154, w:228, h:218 }, maxK:2, still:{ idle:0 },
    clips:{ surface:C(8, 9, 'surface', true), idle:C(8, 6, 'idle'), dive:C(8, 9, 'dive', true) },
    frame(m, clips){
      const sd = clips.surface.n / clips.surface.fps, dd = clips.dive.n / clips.dive.fps;
      if (m.age < sd) return ['surface', Math.min(clips.surface.n - 1, Math.floor(m.age / sd * clips.surface.n))];
      if (m.upT != null && m.upT > 0 && m.upT < dd) return ['dive', Math.min(clips.dive.n - 1, Math.floor((1 - m.upT / dd) * clips.dive.n))];
      return ['idle', Math.floor(m.ph * clips.idle.fps) % clips.idle.n];
    } },
  // r 20: it rises for its first 0.6 s, throws on the engine's m.anim, sways between.
  tentacle: { draw:KRAKENART.tentacle, scale:.55, dy:-8, box:{ x:-75, y:-120, w:150, h:182 }, maxK:2, still:{ sway:0 },
    clips:{ rise:C(6, 10, 'rise', true), sway:C(8, 7, 'sway'), throw:C(8, 12, 'throw', true) },
    frame(m, clips){
      if (m.anim) return null;
      if (m.age < clips.rise.n / clips.rise.fps) return ['rise', Math.min(clips.rise.n - 1, Math.floor(m.age * clips.rise.fps))];
      return ['sway', Math.floor(m.ph * clips.sway.fps) % clips.sway.n];
    } },
  anchor: { draw:KRAKENART.anchor, scale:.55, dy:0, box:{ x:-28, y:-44, w:56, h:76 }, clips:{ spin:C(8, 12, 'spin') }, still:{ spin:0 } },
  stormbolt: { draw:EELART.bolt, scale:.6, dy:0, box:{ x:-50, y:-62, w:100, h:112 }, clips:{ fly:C(6, 14, 'fly'), zap:C(7, 16, 'zap', true) }, still:{ fly:0 } },
};

