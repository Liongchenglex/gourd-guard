// ---------- Nightmare Foggy Hollow: the Lamplighter (mini boss of N2-4 and N2-13, Release 5) ----------
// Ported from docs/archive/nightmare-monsters/minibosses-hollow-keep/minibosses.js (Toy Plastic, docs/ART_BRIEF.md): the tall hooded figure from the
// nightmare Foggy Hollow map, a faceless hood with two eye glints, a ragged cloak dissolving into fog, a long bony hand, and a crooked pole with a
// ghost lantern (a wisp trapped behind the glass) that lights its right side. Its two moods (engine/hollow.js) are two baked looks of the archive's
// lit `drift` clip: `walk` = the clean mood, the lantern burning amber; `rot` = the rot mood, burning sickly green (the light palette LIGHT below is
// the only difference: flame, halo, glass, the light on the cloak, the eyes, the fog it floats on, and a soft aura of the
// lantern's colour behind the figure that we added so the mood reads at game size; the lantern halo is also stronger than the archive's). Each mood has its `hit` recoil (`hit`,
// `rothit`). The archive's dark, snuff, relight, blink and shroud clips are not baked (no lantern mechanic, owner). Glow and shadowBlur are fine
// here: every clip is baked by render/anim.js; nothing random per frame (rng(seed) only). Drawn around (0,0) with the ground at y = 50.

import { E, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t * t * (3 - 2 * t);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const bump = (t, a, b) => { const u = seg(t, a, b); return Math.sin(u * Math.PI); };

/** The lantern's light per mood: amber (clean: only normal pumpkins hurt it) and sickly green (rot: only rotten ones do). */
const LIGHT = {
  clean:{ flame:pal('#ffbe4a'), core:'#fff6dc', haloIn:'#fff0c4', halo:'#ffa830', glass:'#ffe2a0', glow:'#ffb040', spill:'#ffb050', eye:'#ffe2a0', cave:'#5a3a12', face:'#4a2a08', fog:'#b8bec0', fogD:'#5e6466' },
  rot:{ flame:pal('#a6e04a'), core:'#f0ffc4', haloIn:'#e2ffa0', halo:'#8ccc1e', glass:'#d2f29a', glow:'#9ee03a', spill:'#a0dc3a', eye:'#d6ff86', cave:'#2e4a12', face:'#22380a', fog:'#9ac25a', fogD:'#4e6a22' },
};
let LT = LIGHT.clean;

const CLOAK = pal('#2f4a42'), CLOAKD = pal('#22362f'), HOODIN = '#020604', BONEH = pal('#c8d8c4'),
  POLE = pal('#4a3a2c'), LIRON = pal('#4c5650'), BRASSG = pal('#8c8a5a');

function fogPuff(g, x, y, r, a = .6, col = LT.fog){
  const gr = g.createRadialGradient(x - r * .25, y - r * .3, 0, x, y, r); gr.addColorStop(0, rgba('#eafff0', a)); gr.addColorStop(.5, rgba(col, a * .7)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; ell(g, x, y, r, r * .78); g.fill();
}
/** A bony hand: palm and four long fingers pointing in `dir`, curled by `curl`. */
function boneHand(g, x, y, dir, curl = .4, len = 10){
  for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * .3, mx = x + Math.cos(a) * len * .55, my = y + Math.sin(a) * len * .55, a2 = a + curl, fx = mx + Math.cos(a2) * len * .55, fy = my + Math.sin(a2) * len * .55;
    S.tube(g, SO([[x, y], [mx, my], [fx, fy]]), BONEH, 2.4); }
  S.tube(g, SO([[x, y], [x + Math.cos(dir - 1.3) * 6, y + Math.sin(dir - 1.3) * 6]]), BONEH, 2.4);
  S.part(g, E(x, y, 4.2, 3.8), BONEH, { x, y, r:4.2 }, { flat:true, mat:'bone', lw:1 });
}
/** The ghost lantern hanging from its ring at (0,0), body centre about (0, 22). lit 0..1, flare 0..1, ph for the flame. */
function ghostLantern(g, lit, flare, ph, tilt = 0){
  g.save(); g.rotate(tilt);
  const cy = 24, hw = 15, hh = 19;
  // halo
  if (lit > 0){ const R0 = 40 + flare * 6, gr = g.createRadialGradient(0, cy, 2, 0, cy, R0); gr.addColorStop(0, rgba(LT.haloIn, .9 * lit)); gr.addColorStop(.45, rgba(LT.halo, .5 * lit)); gr.addColorStop(1, rgba(LT.halo, 0)); g.fillStyle = gr; ell(g, 0, cy, R0, R0); g.fill(); }
  // ring and cap
  g.strokeStyle = rgba(LIRON.deep, .9); g.lineWidth = 2.6; ell(g, 0, -1, 4, 3.4); g.stroke(); g.strokeStyle = LIRON.light; g.lineWidth = 1; ell(g, -.6, -1.6, 3.4, 2.8); g.stroke();
  S.part(g, SM([[-6, 2], [6, 2], [hw + 2, cy - hh + 1], [-hw - 2, cy - hh + 1]], .5), LIRON, { x:0, y:cy - hh - 2, r:12 }, { flat:true, mat:'metal', lw:1.2 });
  // glass body
  const glass = RR(-hw, cy - hh, hw * 2, hh * 2, 5);
  if (lit > 0){ g.save(); g.shadowColor = LT.glow; g.shadowBlur = 10 + flare * 8; S.dot(g, glass, mix('#1a2a20', LT.glass, lit)); g.restore(); }
  else S.dot(g, glass, '#16201b');
  g.save(); glass(g); g.clip();
  // inside: the trapped wisp (lit) or a curl of smoke and an ember (dark)
  if (lit > .02){ g.globalAlpha *= lit; const fl = Math.sin(ph * 2) * 1.6;
    S.part(g, SM([[-9, cy + 12], [-11, cy + 2], [-7 + fl * .3, cy - 8], [fl, cy - 17, 1], [7 + fl * .3, cy - 8], [11, cy + 2], [9, cy + 12]], .8), LT.flame, { x:0, y:cy, r:13 }, { flat:true, noEdge:true });
    S.dot(g, SM([[-5, cy + 10], [-6, cy + 2], [fl * .5, cy - 9], [6, cy + 2], [5, cy + 10]], .8), LT.core, .9);
    S.dot(g, E(-3.8, cy + 1, 2.3, 3.1), LT.face); S.dot(g, E(3.8, cy + 1, 2.3, 3.1), LT.face); S.dot(g, E(0, cy + 7.6, 2, 1.6 + flare * 1.4), LT.face, .9);
    S.dot(g, E(-4.5, cy - .2, .8, .8), '#fff'); S.dot(g, E(3.1, cy - .2, .8, .8), '#fff'); }
  if (lit < .98){ g.globalAlpha = 1 - lit; S.dot(g, E(0, cy + 13, 3, 1.6), '#ff7a3a', .7);
    g.strokeStyle = 'rgba(160,190,170,.55)'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, cy + 12); g.bezierCurveTo(-6 + Math.sin(ph) * 2, cy + 4, 6, cy - 2, Math.sin(ph) * 2, cy - 14); g.stroke(); }
  g.restore();
  // glass sheen and the iron cage over it
  g.save(); glass(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-hw + 3, cy - hh + 3, 4, hh * 2 - 6); g.restore();
  g.strokeStyle = rgba('#0a0f0c', .55); g.lineWidth = 1.2; glass(g); g.stroke();
  for (const x of [-hw, -hw * .62, hw * .62, hw]) S.tube(g, SO([[x, cy - hh], [x, cy + hh]]), LIRON, x === -hw || x === hw ? 3.4 : 2);
  S.part(g, SM([[-hw - 3, cy + hh - 1], [hw + 3, cy + hh - 1], [hw - 2, cy + hh + 6], [-hw + 2, cy + hh + 6]], .5), LIRON, { x:0, y:cy + hh + 2, r:12 }, { flat:true, mat:'metal', lw:1.2 });
  for (const x of [-hw, hw]) S.rivet(g, x, cy, 1.8, BRASSG);
  g.restore();
}
export function lamplighter(g, P = {}){
  LT = LIGHT[P.mood === 'rot' ? 'rot' : 'clean'];   // the mood's light, read by the helpers below
  // ---- pose ----
  let ph = 0, lit = 1, vanish = 0, recoil = 0, flare = 0, eyeF = 0, fwd = 0, rot = 0, pour = 0, tilt = 0, lift = 0;
  if (P.drift != null) ph = P.drift * TAU;
  if (P.dark != null){ ph = P.dark * TAU; lit = 0; }
  if (P.snuff != null){ const t = P.snuff; ph = t * 2; lit = 1 - ease(seg(t, .15, .75)); flare = bump(t, 0, .35) * .8; eyeF = bump(t, .3, 1) * .6; }
  if (P.relight != null){ const t = P.relight; ph = t * 2; lit = ease(seg(t, .2, .7)); flare = bump(t, .4, 1); eyeF = bump(t, .3, 1) * .5; }
  if (P.blink != null){ const t = P.blink; ph = t * TAU; vanish = t < .5 ? ease(seg(t, 0, .42)) : 1 - ease(seg(t, .58, 1)); }
  if (P.shroud != null){ const t = P.shroud; ph = t * TAU; lit = 0;
    fwd = ease(seg(t, .2, .42)) - ease(seg(t, .82, 1));                          // the pole tips forward (toward us, down the lane)
    rot = -.16 * bump(t, 0, .3) + .22 * fwd;                                       // a wind-up back first
    tilt = .75 * ease(seg(t, .38, .5)) - .75 * ease(seg(t, .76, .9)); pour = seg(t, .4, .56) * (1 - seg(t, .78, .95)); eyeF = bump(t, .25, .9) * .8; lift = bump(t, 0, .4) * 4; }
  if (P.hit != null){ const t = P.hit; recoil = Math.sin(t * Math.PI) * (1 - t * .3); eyeF = recoil; ph = t; }
  const bob = Math.sin(ph) * 3.5 - lift - recoil * 4, sway = Math.sin(ph + .6) * .05, bodyA = (1 - (1 - lit) * .5) * (1 - vanish);
  const hx = 34, hy = -66, LS = 1.45 * (1 + fwd * .25);
  // the pole is drawn by mapping its points about the hand: rotate, and foreshorten when it tips toward us
  const pr = sway + rot + recoil * .1, cr = Math.cos(pr), sr = Math.sin(pr), psx = 1 + fwd * .1, psy = 1 - fwd * .55;
  const map = ([x, y]) => { const dx = (x - hx) * psx, dy = (y - hy) * psy; return [hx + dx * cr - dy * sr, hy + dx * sr + dy * cr]; };
  const end = map([78, -166]), lanY = end[1] + bob + (14 + 24) * LS;   // lantern body centre (for the light on the cloak)

  // ---- the figure ----
  g.save(); g.translate(0, bob);
  if (vanish > 0){ g.translate(0, 40); g.scale(1 - vanish * .45, 1); g.translate(0, -40); }
  if (recoil){ g.translate(0, 40); g.rotate(-recoil * .04); g.scale(1 + recoil * .03, 1 - recoil * .03); g.translate(0, -40); }
  g.globalAlpha *= bodyA;
  // the cloak: narrow peaked shoulders, a fitted waist, flaring into long ragged tatters that swing with the drift
  const R = rng(17), hem = [];
  for (let i = 0; i <= 10; i++){ const u = i / 10, x = -58 + u * 116, d = (i % 2 ? 6 : 16) + R() * 12; hem.push([x + Math.sin(ph + i * 1.3) * 3, 28 + d + Math.sin(ph + i) * 3]); }
  const cloak = SM([[-24, -114], [-34, -96], [-36, -66], [-40, -30], [-50, 4], [-60, 26], ...hem, [60, 26], [50, 4], [40, -30], [36, -66], [34, -96], [24, -114], [0, -120]], .7);
  S.part(g, cloak, CLOAK, { x:-10, y:-50, r:84 }, { mat:'cloth', hx:-24, hy:-90 });
  for (const pts of [[[-12, -84], [-20, -30], [-30, 34]], [[4, -86], [6, -30], [6, 38]], [[22, -78], [30, -20], [40, 32]], [[-26, -60], [-38, 0], [-48, 30]], [[14, -40], [18, 0], [22, 36]]]) S.crease(g, SO(pts), CLOAK, 2.4, .5);
  for (let i = 1; i < hem.length; i += 2) S.thread(g, hem[i][0], hem[i][1], i < 5 ? -1 : 1, CLOAK);
  // the lantern's green light on the cloak's right side
  if (lit > 0){ g.save(); cloak(g); g.clip(); const lg = g.createRadialGradient(end[0], lanY - bob, 4, end[0], lanY - bob, 110); lg.addColorStop(0, rgba(LT.spill, .5 * lit)); lg.addColorStop(1, rgba(LT.spill, 0)); g.fillStyle = lg; g.fillRect(-70, -130, 140, 190); g.restore(); }
  // shoulder mantle (a short scalloped cape)
  const mantle = SM([[-26, -114], [-40, -92], [-44, -68, 1], [-32, -74], [-22, -64, 1], [-10, -72], [2, -62, 1], [14, -72], [26, -64, 1], [36, -74], [44, -68, 1], [40, -92], [26, -114]], .7);
  S.part(g, mantle, CLOAKD, { x:-8, y:-96, r:44 }, { mat:'cloth', hx:-22, hy:-104 }); S.contact(g, cloak, 0, -64, 40, 8, .5);
  if (lit > 0){ g.save(); mantle(g); g.clip(); const lg = g.createRadialGradient(end[0], lanY - bob, 4, end[0], lanY - bob, 80); lg.addColorStop(0, rgba(LT.spill, .45 * lit)); lg.addColorStop(1, rgba(LT.spill, 0)); g.fillStyle = lg; g.fillRect(-50, -120, 100, 60); g.restore(); }
  // the long left arm hanging down the side, as on the map: a ragged bell sleeve and a bony hand
  const hang = Math.sin(ph + 1.2) * 2;
  const sleeve = SM([[-30, -100], [-42, -84], [-50, -50], [-58 + hang, -26, 1], [-50 + hang, -22], [-40 + hang, -28, 1], [-38, -56], [-28, -86]], .7);
  boneHand(g, -48 + hang, -18, Math.PI / 2 + .1, .35, 13);
  S.part(g, sleeve, CLOAKD, { x:-40, y:-64, r:34 }, { mat:'cloth', flat:true }); S.crease(g, SO([[-36, -86], [-44, -56], [-50 + hang, -32]]), CLOAKD, 2, .45);
  // the hood: tall, peaked, drooping forward, a void inside with two pale glints
  const hood = SM([[-27, -108], [-31, -134], [-23, -160], [-9, -178], [2, -188, 1], [9, -172], [23, -152], [29, -128], [27, -106], [0, -100]], .75);
  S.part(g, hood, CLOAK, { x:-4, y:-142, r:42 }, { mat:'cloth', hx:-16, hy:-162 });
  if (lit > 0){ g.save(); hood(g); g.clip(); const lg = g.createRadialGradient(end[0], lanY - bob, 4, end[0], lanY - bob, 80); lg.addColorStop(0, rgba(LT.spill, .45 * lit)); lg.addColorStop(1, rgba(LT.spill, 0)); g.fillStyle = lg; g.fillRect(-35, -190, 70, 90); g.restore(); }
  S.crease(g, SO([[-4, -178], [-15, -158], [-20, -138]]), CLOAK, 2.2, .45);
  const cave = SM([[-19, -112], [-21, -134], [-11, -152], [0, -156], [11, -152], [20, -134], [18, -112], [0, -106]], .8);
  S.dot(g, cave, HOODIN); g.save(); cave(g); g.clip(); const cg = g.createRadialGradient(0, -130, 2, 0, -130, 24); cg.addColorStop(0, rgba(LT.cave, .55 + eyeF * .35)); cg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = cg; g.fillRect(-26, -160, 52, 56); g.restore();
  S.ln(g, [[-20, -112], [-21, -134], [-11, -152], [0, -156], [11, -152], [20, -134], [18, -112]], CLOAK, 2.6, .75);
  const ey = -131 + Math.sin(ph) * .6, er = 3 + eyeF * 1;
  for (const s of [-1, 1]){ g.save(); g.shadowColor = LT.eye; g.shadowBlur = 10 + eyeF * 10; g.fillStyle = LT.eye; ell(g, s * 7.5, ey, er * 1.25, er * .72, s * .2); g.fill(); g.restore(); S.dot(g, E(s * 7.5 - 1, ey - .6, .9, .6), '#ffffff'); }
  // the right sleeve reaching to the pole
  S.part(g, SM([[18, -106], [34, -100], [44, -80], [42, -62, 1], [30, -60], [26, -78], [16, -92]], .7), CLOAKD, { x:30, y:-84, r:26 }, { mat:'cloth', flat:true });
  g.restore();

  // dissolve the hem into fog: erase a soft band at the bottom (the frame is baked on its own canvas, nothing else is under it yet)
  g.save(); g.globalCompositeOperation = 'destination-out'; const fg = g.createLinearGradient(0, 10 + bob, 0, 56 + bob); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = fg; g.fillRect(-100, 10 + bob, 200, 60); g.restore();
  // fog the figure floats on (behind, then in front)
  g.save(); g.globalCompositeOperation = 'destination-over'; for (let i = 0; i < 5; i++){ const x = -48 + i * 24 + Math.sin(ph + i * 2) * 4; fogPuff(g, x, 30 + (i % 2) * 6, 24, .45, LT.fogD); } g.restore();
  for (let i = 0; i < 6; i++){ const x = -54 + i * 21.6 + Math.sin(ph + i * 1.7) * 5, y = 40 + (i % 3) * 4 + Math.cos(ph + i) * 2; fogPuff(g, x, y, 15 + (i % 2) * 5, .5); }

  // ---- pole, hand and lantern (in front of the figure) ----
  g.save(); g.translate(0, bob); g.globalAlpha *= bodyA;
  const pole = [[24, 30], [hx, hy], [48, -136], [58, -172]].map(map), crook = [[58, -172], [68, -182], [80, -176], [78, -166]].map(map);
  S.tube(g, SO(pole), POLE, 5.2); S.tube(g, SO(crook), POLE, 4.6);
  S.part(g, E(end[0], end[1], 3.4, 3.4), LIRON, { x:end[0], y:end[1], r:3.4 }, { flat:true, mat:'metal', lw:1 });
  boneHand(g, hx, hy, -.3 + pr, -1.2, 10);
  // chain and lantern (the lantern swings against the pole, and tips when it pours)
  const lsw = -(sway + rot) * .8 + Math.sin(ph + .3) * .08 + recoil * .15;
  g.save(); g.translate(end[0], end[1] + 2); g.rotate(lsw); g.scale(LS, LS);
  for (let i = 0; i < 3; i++){ g.strokeStyle = rgba(LIRON.deep, .9); g.lineWidth = 1.5; ell(g, 0, 2 + i * 4, 1.5, 2.4); g.stroke(); }
  g.translate(0, 12); ghostLantern(g, lit, Math.min(1, flare + recoil * .3), ph, tilt);
  g.restore();
  // fog pouring out of the tipped lantern and rolling down the lane
  if (pour > 0){ const mx = end[0] + Math.sin(lsw + tilt) * -40 * LS * .5, my = end[1] + (12 + 24 + 22) * LS;
    for (let i = 0; i < 8; i++){ const k = (i / 8 + (P.shroud ?? 0) * 1.4) % 1; fogPuff(g, mx + Math.sin(i * 2.3) * 5 - k * 12, my + k * (50 - my), 10 + k * 18, .95 * pour * (1 - k * .3)); } }
  g.restore();

  // ---- blink: the figure becomes a column of swirling fog at the midpoint ----
  if (vanish > 0){ const k = Math.sin(vanish * Math.PI / 2);
    for (let i = 0; i < 9; i++){ const u = i / 8, y = 26 - u * 170 + bob + vanish * u * 20, x = Math.sin(u * 4.5 + vanish * 3) * (5 + vanish * 9) + 4 * u; fogPuff(g, x, y, 34 - u * 12, .42 * k); }
    for (let i = 0; i < 5; i++){ const a = i / 5 * TAU + vanish * 2.4; fogPuff(g, Math.cos(a) * (30 + vanish * 20), -76 + Math.sin(a) * (48 + vanish * 18) + bob, 20, .3 * k); }
    // the two eyes are the last thing to go (and the first to come back)
    for (const s of [-1, 1]){ g.save(); g.globalAlpha *= clamp(1 - (vanish - .6) / .4); g.shadowColor = LT.eye; g.shadowBlur = 10; g.fillStyle = LT.eye; ell(g, s * 7.5, -131 + bob, 3.6, 2, s * .2); g.fill(); g.restore(); } }
  // the mood's aura (ours, not the archive's): a wide soft glow of the lantern's colour behind the whole figure, so amber and green read at game size
  { g.save(); g.globalCompositeOperation = 'destination-over'; const ax = end[0], ay = lanY, gr = g.createRadialGradient(ax, ay, 6, ax - 20, ay + 30, 130);
    gr.addColorStop(0, rgba(LT.halo, .55)); gr.addColorStop(.5, rgba(LT.halo, .2)); gr.addColorStop(1, rgba(LT.halo, 0)); g.fillStyle = gr; g.fillRect(-79, -197, 219, 267); g.restore(); }
  // the hit: a gust of fog bursting off the cloak
  if (recoil > .1){ for (let i = 0; i < 5; i++){ const a = -Math.PI * (.1 + i * .2); fogPuff(g, Math.cos(a) * (44 + recoil * 14), -60 + Math.sin(a) * (50 + recoil * 14), 10 + recoil * 6, .5 * recoil); } }
}

// ---------- registry ----------
// r 32 boss footprint: the archive's scale .46 and box (the lantern hangs out to the right); dy -4 puts the fog it floats on 19 below the centre.
// maxK 2 caps the bake scale like the Strawlord's (26 frames of 219 x 267).
const moodClip = (key, mood, n, fps, once) => ({ n, fps, ...(once ? { once:true } : {}), pose:t => ({ [key]:t, mood }) });
export const LAMPLIGHTER = {
  lamplighter: { draw:lamplighter, scale:.46, dy:-4, box:{ x:-79, y:-197, w:219, h:267 }, maxK:2, still:{ drift:0, mood:'clean' },
    clips:{ walk:moodClip('drift', 'clean', 8, 7), rot:moodClip('drift', 'rot', 8, 7), hit:moodClip('hit', 'clean', 5, 14, true), rothit:moodClip('hit', 'rot', 5, 14, true) },
    frame(m, cl){   // the rot mood shows its own loop and its own recoil; the clean mood falls through to walk / hit
      if (m.mood !== 'rot') return null;
      if (m.anim && m.anim.clip === 'hit'){ const n = cl.rothit.n; return ['rothit', Math.min(n - 1, Math.floor(m.anim.t / m.anim.dur * n))]; }
      return ['rot', Math.floor(m.ph * cl.rot.fps * (m.slowT > 0 ? 0.5 : 1)) % cl.rot.n];
    } },
};
