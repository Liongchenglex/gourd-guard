// ---------- Mini bosses for Foggy Hollow and Crumbling Keep (design archive, not in the game) ----------
// Every world gets a mini boss: smaller than the world boss, bigger than its monsters (the Kraken is Drowned Marsh's).
//   lamplighter — The Lamplighter (Foggy Hollow): the tall hooded figure that stands in the fog on the nightmare Foggy Hollow
//                 map (shadeFigure() in docs/archive/nightmare-worlds/entry.js: a peaked hood, a long hanging arm, two pale green
//                 eyes), now a creature. Faceless dark hood with two eye glints, a ragged cloak that dissolves into fog, and a long
//                 crooked pole with a big ghost lantern (a wisp trapped behind the glass). Lit = vulnerable; dark = snuffed, the
//                 figure half-fades. Blinks between fog banks; swings the dark lantern to pour fog down a lane.
//   siegetower  — The Siege Tower (Crumbling Keep): a tall rickety wooden tower on four wheels, wet hides and iron bands, two lit
//                 arrow slits for eyes and a spiked drawbridge ramp for a mouth. Two skeleton archers (the game's `archer`) shoot
//                 from the top platform; pumpkins knock them off first (variants a2 / a1 / a0). The ramp drops and a Shield Knight
//                 (the game's `knight`) marches out.
// Drawn around (0,0) in drawing units with the ground at y = 50. Glows are fine (clips are baked); nothing random per frame.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';
import { archer, knight } from '../../../../src/engine/render/chars/w4.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t * t * (3 - 2 * t);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const bump = (t, a, b) => { const u = seg(t, a, b); return Math.sin(u * Math.PI); };

// =====================================================================================================================
// The Lamplighter (Foggy Hollow, nightmare palette: black marsh, poison-green fog, pale green moon)
// =====================================================================================================================
const CLOAK = pal('#2f4a42'), CLOAKD = pal('#22362f'), HOODIN = '#020604', EYE = '#caffc0', BONEH = pal('#c8d8c4'),
  POLE = pal('#4a3a2c'), LIRON = pal('#4c5650'), BRASSG = pal('#8c8a5a'), FLAME = pal('#9cffb0'), FLAMEC = '#f2fff0', FOG = '#9fd8b4', FOGD = '#4a8a64';

function fogPuff(g, x, y, r, a = .6, col = FOG){
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
  if (lit > 0){ const R0 = 32 + flare * 6, gr = g.createRadialGradient(0, cy, 2, 0, cy, R0); gr.addColorStop(0, rgba('#d8ffd0', .7 * lit)); gr.addColorStop(.45, rgba('#7aff9a', .3 * lit)); gr.addColorStop(1, rgba('#7aff9a', 0)); g.fillStyle = gr; ell(g, 0, cy, R0, R0); g.fill(); }
  // ring and cap
  g.strokeStyle = rgba(LIRON.deep, .9); g.lineWidth = 2.6; ell(g, 0, -1, 4, 3.4); g.stroke(); g.strokeStyle = LIRON.light; g.lineWidth = 1; ell(g, -.6, -1.6, 3.4, 2.8); g.stroke();
  S.part(g, SM([[-6, 2], [6, 2], [hw + 2, cy - hh + 1], [-hw - 2, cy - hh + 1]], .5), LIRON, { x:0, y:cy - hh - 2, r:12 }, { flat:true, mat:'metal', lw:1.2 });
  // glass body
  const glass = RR(-hw, cy - hh, hw * 2, hh * 2, 5);
  if (lit > 0){ g.save(); g.shadowColor = '#9cffb0'; g.shadowBlur = 10 + flare * 8; S.dot(g, glass, mix('#1a2a20', '#c8ffc0', lit)); g.restore(); }
  else S.dot(g, glass, '#16201b');
  g.save(); glass(g); g.clip();
  // inside: the trapped wisp (lit) or a curl of smoke and an ember (dark)
  if (lit > .02){ g.globalAlpha *= lit; const fl = Math.sin(ph * 2) * 1.6;
    S.part(g, SM([[-9, cy + 12], [-11, cy + 2], [-7 + fl * .3, cy - 8], [fl, cy - 17, 1], [7 + fl * .3, cy - 8], [11, cy + 2], [9, cy + 12]], .8), FLAME, { x:0, y:cy, r:13 }, { flat:true, noEdge:true });
    S.dot(g, SM([[-5, cy + 10], [-6, cy + 2], [fl * .5, cy - 9], [6, cy + 2], [5, cy + 10]], .8), FLAMEC, .9);
    S.dot(g, E(-3.8, cy + 1, 2.3, 3.1), '#1a3a28'); S.dot(g, E(3.8, cy + 1, 2.3, 3.1), '#1a3a28'); S.dot(g, E(0, cy + 7.6, 2, 1.6 + flare * 1.4), '#1a3a28', .9);
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
function lamplighter(g, P = {}){
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
  if (lit > 0){ g.save(); cloak(g); g.clip(); const lg = g.createRadialGradient(end[0], lanY - bob, 4, end[0], lanY - bob, 110); lg.addColorStop(0, rgba('#9cffb0', .5 * lit)); lg.addColorStop(1, rgba('#9cffb0', 0)); g.fillStyle = lg; g.fillRect(-70, -130, 140, 190); g.restore(); }
  // shoulder mantle (a short scalloped cape)
  const mantle = SM([[-26, -114], [-40, -92], [-44, -68, 1], [-32, -74], [-22, -64, 1], [-10, -72], [2, -62, 1], [14, -72], [26, -64, 1], [36, -74], [44, -68, 1], [40, -92], [26, -114]], .7);
  S.part(g, mantle, CLOAKD, { x:-8, y:-96, r:44 }, { mat:'cloth', hx:-22, hy:-104 }); S.contact(g, cloak, 0, -64, 40, 8, .5);
  if (lit > 0){ g.save(); mantle(g); g.clip(); const lg = g.createRadialGradient(end[0], lanY - bob, 4, end[0], lanY - bob, 80); lg.addColorStop(0, rgba('#9cffb0', .45 * lit)); lg.addColorStop(1, rgba('#9cffb0', 0)); g.fillStyle = lg; g.fillRect(-50, -120, 100, 60); g.restore(); }
  // the long left arm hanging down the side, as on the map: a ragged bell sleeve and a bony hand
  const hang = Math.sin(ph + 1.2) * 2;
  const sleeve = SM([[-30, -100], [-42, -84], [-50, -50], [-58 + hang, -26, 1], [-50 + hang, -22], [-40 + hang, -28, 1], [-38, -56], [-28, -86]], .7);
  boneHand(g, -48 + hang, -18, Math.PI / 2 + .1, .35, 13);
  S.part(g, sleeve, CLOAKD, { x:-40, y:-64, r:34 }, { mat:'cloth', flat:true }); S.crease(g, SO([[-36, -86], [-44, -56], [-50 + hang, -32]]), CLOAKD, 2, .45);
  // the hood: tall, peaked, drooping forward, a void inside with two pale glints
  const hood = SM([[-27, -108], [-31, -134], [-23, -160], [-9, -178], [2, -188, 1], [9, -172], [23, -152], [29, -128], [27, -106], [0, -100]], .75);
  S.part(g, hood, CLOAK, { x:-4, y:-142, r:42 }, { mat:'cloth', hx:-16, hy:-162 });
  if (lit > 0){ g.save(); hood(g); g.clip(); const lg = g.createRadialGradient(end[0], lanY - bob, 4, end[0], lanY - bob, 80); lg.addColorStop(0, rgba('#9cffb0', .45 * lit)); lg.addColorStop(1, rgba('#9cffb0', 0)); g.fillStyle = lg; g.fillRect(-35, -190, 70, 90); g.restore(); }
  S.crease(g, SO([[-4, -178], [-15, -158], [-20, -138]]), CLOAK, 2.2, .45);
  const cave = SM([[-19, -112], [-21, -134], [-11, -152], [0, -156], [11, -152], [20, -134], [18, -112], [0, -106]], .8);
  S.dot(g, cave, HOODIN); g.save(); cave(g); g.clip(); const cg = g.createRadialGradient(0, -130, 2, 0, -130, 24); cg.addColorStop(0, rgba('#1e4a2e', .55 + eyeF * .35)); cg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = cg; g.fillRect(-26, -160, 52, 56); g.restore();
  S.ln(g, [[-20, -112], [-21, -134], [-11, -152], [0, -156], [11, -152], [20, -134], [18, -112]], CLOAK, 2.6, .75);
  const ey = -131 + Math.sin(ph) * .6, er = 3 + eyeF * 1;
  for (const s of [-1, 1]){ g.save(); g.shadowColor = EYE; g.shadowBlur = 10 + eyeF * 10; g.fillStyle = EYE; ell(g, s * 7.5, ey, er * 1.25, er * .72, s * .2); g.fill(); g.restore(); S.dot(g, E(s * 7.5 - 1, ey - .6, .9, .6), '#ffffff'); }
  // the right sleeve reaching to the pole
  S.part(g, SM([[18, -106], [34, -100], [44, -80], [42, -62, 1], [30, -60], [26, -78], [16, -92]], .7), CLOAKD, { x:30, y:-84, r:26 }, { mat:'cloth', flat:true });
  g.restore();

  // dissolve the hem into fog: erase a soft band at the bottom (the frame is baked on its own canvas, nothing else is under it yet)
  g.save(); g.globalCompositeOperation = 'destination-out'; const fg = g.createLinearGradient(0, 10 + bob, 0, 56 + bob); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = fg; g.fillRect(-100, 10 + bob, 200, 60); g.restore();
  // fog the figure floats on (behind, then in front)
  g.save(); g.globalCompositeOperation = 'destination-over'; for (let i = 0; i < 5; i++){ const x = -48 + i * 24 + Math.sin(ph + i * 2) * 4; fogPuff(g, x, 30 + (i % 2) * 6, 24, .45, FOGD); } g.restore();
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
    for (const s of [-1, 1]){ g.save(); g.globalAlpha *= clamp(1 - (vanish - .6) / .4); g.shadowColor = EYE; g.shadowBlur = 10; g.fillStyle = EYE; ell(g, s * 7.5, -131 + bob, 3.6, 2, s * .2); g.fill(); g.restore(); } }
  // the hit: a gust of fog bursting off the cloak
  if (recoil > .1){ for (let i = 0; i < 5; i++){ const a = -Math.PI * (.1 + i * .2); fogPuff(g, Math.cos(a) * (44 + recoil * 14), -60 + Math.sin(a) * (50 + recoil * 14), 10 + recoil * 6, .5 * recoil); } }
}

// =====================================================================================================================
// The Siege Tower (Crumbling Keep: stone, iron, crimson, timber)
// =====================================================================================================================
const TIMB = pal('#8a5f38'), TIMBD = pal('#6a4528'), TIMBL = pal('#a8784a'), HIDE = pal('#b08a62'), HIDED = pal('#8a6a4a'), IRONB = pal('#5a5e6c'),
  STEELB = pal('#a8adc0'), CRIMB = pal('#9e2f44'), ROPEB = pal('#cbb084'), SLIT = '#ffb040', DUST = '#b8a48a';
const AX = [-24, 24];   // archer slots on the platform (viewer's left falls first)

/** One wooden wheel seen at three-quarters: rim, hub, rotating spokes. */
function wheel(g, x, y, r, rot, s = 1){
  const rx = r * .5;
  S.part(g, E(x, y, rx + 2, r + 2), TIMBD, { x, y, r }, { flat:true, mat:'wood' });
  S.dot(g, E(x + s * 1, y, rx - 3, r - 4), TIMBD.deep, .85);
  for (let i = 0; i < 6; i++){ const a = rot + i * TAU / 6; S.tube(g, SO([[x, y], [x + s * 1 + Math.cos(a) * (rx - 3), y + Math.sin(a) * (r - 4)]]), TIMB, 2.6); }
  S.part(g, E(x, y, 4, 5), IRONB, { x, y, r:5 }, { flat:true, mat:'metal', lw:1 });
  g.strokeStyle = rgba(IRONB.base, .95); g.lineWidth = 2.2; ell(g, x, y, rx + 1.2, r + 1.2); g.stroke();
  for (let i = 0; i < 6; i++){ const a = rot + .5 + i * TAU / 6; S.rivet(g, x + Math.cos(a) * (rx + 1), y + Math.sin(a) * (r + 1), 1.1, IRONB); }
}
/** An iron band across the face from x0 to x1 at y, with rivets. */
function band(g, x0, x1, y, h = 5){ S.part(g, RR(x0, y - h / 2, x1 - x0, h, 1.5), IRONB, { x:(x0 + x1) / 2, y, r:(x1 - x0) / 2 }, { flat:true, mat:'metal', lw:1 }); for (let x = x0 + 5; x < x1 - 2; x += 10) S.rivet(g, x, y, 1.3, STEELB); }
/** Vertical plank seams and a few knots on a face clipped to `clip`. */
function planks(g, clip, x0, x1, y0, y1, seed, step = 10){ g.save(); clip(g); g.clip(); const R = rng(seed);
  for (let x = x0 + step; x < x1; x += step){ S.ln(g, [[x + (R() - .5) * 1.4, y0], [x + (R() - .5) * 1.4, y1]], TIMB, 1.2, .55); g.strokeStyle = 'rgba(255,230,190,.16)'; g.lineWidth = .8; g.beginPath(); g.moveTo(x + 1.2, y0); g.lineTo(x + 1.2, y1); g.stroke(); }
  for (let i = 0; i < 4; i++){ const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); S.dot(g, E(x, y, 1.6, 2.4), TIMB.deep, .5); }
  g.restore(); }
/** A stitched wet hide nailed over a face. */
function hide(g, pts, seed){ const p = SM(pts, .6); S.part(g, p, HIDE, { x:pts[0][0] + 10, y:pts[0][1] + 10, r:24 }, { flat:true, mat:'leather', lw:1.2 });
  const R = rng(seed); g.save(); p(g); g.clip(); for (let i = 0; i < 5; i++){ S.dot(g, E(pts[0][0] + R() * 40 - 10, pts[0][1] + R() * 30, 3 + R() * 4, 2 + R() * 3, R() * 3), HIDED.base, .45); } g.restore();
  for (const [x, y] of pts.filter((_, i) => i % 2 === 0)) S.rivet(g, x, y, 1.4, IRONB); }

// The three storeys are drawn as separate pieces so the break clip can tear them apart. Origin: tower centre on the ground.
// Front face: x ±46 at the base (y 40) narrowing to ±38 at the platform (y -122); the right side face shows as a darker sliver.
const FX = y => 46 - (40 - y) * (8 / 162);
function sideFace(g, y0, y1){ const p = PL([[FX(y1), y1], [FX(y1) + 9, y1 - 7], [FX(y0) + 9, y0 - 7], [FX(y0), y0]]); S.part(g, p, TIMBD, { x:FX(y0) + 5, y:(y0 + y1) / 2, r:30 }, { flat:true, mat:'wood', lw:1.2 }); planks(g, p, FX(y0), FX(y0) + 10, y0 - 8, y1, y0 | 0, 4); }
function face(g, y0, y1, seed){ const p = PL([[-FX(y1), y1], [FX(y1), y1], [FX(y0), y0], [-FX(y0), y0]]); S.part(g, p, TIMB, { x:-10, y:(y0 + y1) / 2 - 10, r:60 }, { flat:true, mat:'wood', lw:1.4 }); planks(g, p, -50, 50, y0, y1, seed); S.overlay(g, p, TIMB, { x:-10, y:(y0 + y1) / 2 - 10, r:60 }, .35); return p; }
/** Bottom storey (y 40 .. -20): the doorway, the hinge beam. The ramp is drawn separately. */
function storeyBottom(g){
  sideFace(g, -20, 40); const p = face(g, -20, 40, 3);
  // the dark doorway behind the ramp
  S.dot(g, SM([[-24, 38, 1], [-24, -12], [-16, -22], [0, -25], [16, -22], [24, -12], [24, 38, 1]], .8), '#140a0c');
  g.save(); SM([[-24, 38, 1], [-24, -12], [-16, -22], [0, -25], [16, -22], [24, -12], [24, 38, 1]], .8)(g); g.clip(); const gr = g.createRadialGradient(0, 20, 2, 0, 20, 34); gr.addColorStop(0, 'rgba(255,140,60,.35)'); gr.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = gr; g.fillRect(-30, -30, 60, 70); g.restore();
  band(g, -FX(40) - 1, FX(40) + 1, 38, 6); S.contact(g, p, 0, 38, 46, 6, .35);
  for (const s of [-1, 1]){ S.part(g, RR(s * 30 - 3.5, -18, 7, 56, 2), TIMBD, { x:s * 30, y:10, r:20 }, { flat:true, mat:'wood', lw:1.1 }); }   // door posts
  // pulleys for the ramp chains
  for (const s of [-1, 1]) S.part(g, E(s * 34, -14, 4, 4), IRONB, { x:s * 34, y:-14, r:4 }, { flat:true, mat:'metal', lw:1 });
}
/** Middle storey (y -20 .. -76): wet hides and the two lit arrow slits that make the eyes. glare 0..1 */
function storeyMiddle(g, glare = 0){
  sideFace(g, -76, -20); face(g, -76, -20, 5);
  hide(g, [[-38, -70], [-18, -72], [-6, -66], [-8, -44], [-16, -30], [-36, -32]], 9);
  hide(g, [[10, -70], [34, -72], [36, -50], [32, -30], [16, -32], [8, -46]], 11);
  band(g, -FX(-20) - 1, FX(-20) + 1, -20, 6);
  // arrow-slit eyes, slanted into a scowl, lit from inside
  for (const s of [-1, 1]){ const x = s * 17, y = -48; g.save(); g.translate(x, y); g.rotate(s * .35);
    S.part(g, RR(-7, -3.6, 14, 7.2, 2), TIMBD, { x:0, y:0, r:8 }, { flat:true, lw:1.4 });
    g.save(); g.shadowColor = SLIT; g.shadowBlur = 8 + glare * 8; S.dot(g, RR(-5.4, -2.2, 10.8, 4.4, 1.6), glare > .5 ? '#ffe28a' : SLIT); g.restore(); S.dot(g, E(-1.5, -.6, 1.6, .9), '#fff6d8', .9); g.restore(); }
  // a spiked iron boss on the nose between the eyes
  S.part(g, E(0, -38, 5, 5), IRONB, { x:0, y:-38, r:5 }, { mat:'metal', lw:1 }); S.dot(g, PL([[-2, -40], [2, -40], [0, -47]]), STEELB.light);
}
/** Top storey (y -76 .. -122) and the platform floor. */
function storeyTop(g){
  sideFace(g, -122, -76); face(g, -122, -76, 7);
  band(g, -FX(-76) - 1, FX(-76) + 1, -76, 6);
  // crossed braces
  S.tube(g, SO([[-32, -116], [30, -82]]), TIMBD, 4); S.tube(g, SO([[32, -116], [-30, -82]]), TIMBD, 4);
  S.part(g, E(0, -99, 4.5, 4.5), IRONB, { x:0, y:-99, r:4.5 }, { flat:true, mat:'metal', lw:1 });
  // crimson banner hanging down the front, with a bat sigil
  S.part(g, SM([[-9, -120, 1], [9, -120, 1], [9, -88], [0, -82, 1], [-9, -88]], .6), CRIMB, { x:0, y:-104, r:16 }, { flat:true, mat:'cloth', lw:1.2 });
  S.dot(g, SM([[0, -106], [-3, -109], [-7, -108], [-6, -104, 1], [-3, -103, 1], [0, -101], [3, -103, 1], [6, -104, 1], [7, -108], [3, -109]], .7), '#e2b24c', .9);
}
/** The platform: the floor beam, corner posts and the front parapet (drawn in front of the archers). */
function platformBack(g){
  S.part(g, PL([[-44, -122], [44, -122], [52, -130], [-36, -130]]), TIMBD, { x:0, y:-126, r:40 }, { flat:true, mat:'wood', lw:1.2 });
  for (const [x, top] of [[-38, -164], [47, -170]]) S.part(g, RR(x - 3, top, 6, -122 - top + 2, 2), TIMBD, { x, y:(top - 122) / 2, r:24 }, { flat:true, mat:'wood', lw:1.1 });
  // a tattered pennant on the right post
  S.part(g, SM([[49, -170, 1], [72, -165], [64, -161, 1], [74, -156], [49, -158, 1]], .5), CRIMB, { x:58, y:-163, r:14 }, { flat:true, mat:'cloth', lw:1.1 });
}
function parapet(g){
  const p = PL([[-44, -122], [44, -122], [44, -146], [36, -146], [36, -139], [24, -139], [24, -146], [12, -146], [12, -139], [-12, -139], [-12, -146], [-24, -146], [-24, -139], [-36, -139], [-36, -146], [-44, -146]]);
  S.part(g, p, TIMBL, { x:-10, y:-139, r:44 }, { flat:true, mat:'wood', lw:1.3 }); planks(g, p, -44, 44, -146, -122, 13, 8);
  hide(g, [[-42, -132], [-28, -133], [-26, -124], [-40, -123]], 15); hide(g, [[26, -132], [40, -133], [41, -124], [28, -123]], 17);
  band(g, -45, 45, -122, 4.5);
  // the platform's side edge
  S.part(g, PL([[44, -122], [52, -130], [52, -152], [44, -146]]), TIMBD, { x:48, y:-139, r:10 }, { flat:true, mat:'wood', lw:1.1 });
}
/** The drawbridge ramp: hinged at the doorway foot (y 40), `drop` 0 (up, closing the door) .. 1 (down on the ground, toward us). */
function ramp(g, drop){
  const th = drop * Math.PI / 2, L = 62, top = 40 - L * Math.cos(th) + L * Math.sin(th) * .5, wTop = 25 * (1 + Math.sin(th) * .22), wBot = 26;
  if (drop > 0){   // chains from the pulleys to the ramp's top corners
    for (const s of [-1, 1]) S.ln(g, [[s * 34, -14], [s * wTop * .9, top + (drop > .5 ? -2 : 2)]], IRONB, 1.6, .95); }
  const p = PL([[-wBot, 40], [wBot, 40], [wTop, top], [-wTop, top]]), up = top < 40;
  S.part(g, p, TIMBL, { x:-6, y:(top + 40) / 2 - 6, r:34 }, { flat:true, mat:'wood', lw:1.4 });
  planks(g, p, -28, 28, Math.min(top, 40), Math.max(top, 40), 21, 9);
  // iron straps across (cleats when lowered)
  const yAt = k => 40 + (top - 40) * k, wAt = k => wBot + (wTop - wBot) * k;
  for (const k of [.18, .5, .82]){ const y = yAt(k), w = wAt(k); band(g, -w, w, y, 4 * (up ? 1 : .8)); }
  // a row of iron spikes along the top edge: the tower's teeth (they point up when closed, toward us when lowered)
  const sp = Math.cos(th);
  for (let i = 0; i < 5; i++){ const x = -wTop + 5 + i * (wTop * 2 - 10) / 4; S.dot(g, PL([[x - 3, top + 1], [x + 3, top + 1], [x, top - 8 * sp - 2]]), STEELB.light); S.ln(g, [[x - 3, top + 1], [x, top - 8 * sp - 2], [x + 3, top + 1]], STEELB, 1, .7); }
  // chain eyes
  for (const s of [-1, 1]) S.rivet(g, s * wTop * .9, top + 3, 2, IRONB);
}
/** Dust puffs at the wheels. */
function dust(g, x, y, r, a){ const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(DUST, a)); gr.addColorStop(1, rgba(DUST, 0)); g.fillStyle = gr; ell(g, x, y, r, r * .7); g.fill(); }

function siegeTower(g, P = {}){
  const n = P.variant === 'a0' ? 0 : P.variant === 'a1' ? 1 : 2;   // archers left (pumpkins knock the viewer's-left one off first)
  let ph = 0, rot = 0, rock = 0, drop = 0, shake = 0, glare = 0, volley = null, kn = null, br = null, knockT = null, flinch = 0;
  if (P.roll != null){ ph = P.roll * TAU; rot = P.roll * TAU / 3; rock = Math.sin(ph) * .014; }
  if (P.volley != null){ const t = P.volley; volley = t; rock = -bump(t, .55, 1) * .02; glare = bump(t, 0, .6); }
  if (P.ramp != null){ const t = P.ramp; drop = ease(seg(t, 0, .3)); kn = seg(t, .3, 1); shake = bump(t, .22, .34); glare = bump(t, 0, .4); }
  if (P.raise != null){ const t = P.raise; drop = 1 - ease(seg(t, 0, .85)); shake = bump(t, .8, 1) * .6; }
  if (P.knock != null){ knockT = P.knock; shake = bump(P.knock, 0, .3); flinch = shake; }
  if (P.hit != null){ shake = Math.sin(P.hit * Math.PI); flinch = shake; glare = shake; }
  if (P.brk != null) br = P.brk;
  const sx = shake ? Math.sin(shake * 9) * 2.2 * shake : 0;
  const bob = P.roll != null ? Math.abs(Math.sin(ph * 2)) * -1 : 0;

  // ---------- break: the tower creaks, leans, and comes apart into a heap of timber ----------
  if (br != null){
    const lean = ease(seg(br, 0, .3)) * .06, fall = ease(seg(br, .25, .8)), settle = seg(br, .75, 1), R = rng(55);
    S.shadow(g, 0, 50, 56 + fall * 14, 8);
    // wheels: the right ones splay out, the left one rolls off
    wheel(g, -50 - fall * 18, 34 + fall * 2, 16, fall * 3, -1); g.save(); g.translate(52 + fall * 10, 34 + fall * 8); g.rotate(fall * 1.1); wheel(g, 0, 0, 16, 0, 1); g.restore();
    // the pieces: bottom storey sags, middle slides down and tilts, the top storey and platform topple to the right and fall
    g.save(); g.translate(0, 50); g.rotate(lean * (1 - fall)); g.translate(0, -50);
    g.save(); g.translate(0, fall * 14); g.translate(0, 40); g.rotate(fall * -.12); g.scale(1, 1 - fall * .35); g.translate(0, -40); storeyBottom(g); ramp(g, fall * .5); g.restore();
    g.save(); g.translate(fall * -14, fall * 58); g.translate(0, -20); g.rotate(fall * -.3); g.translate(0, 20); storeyMiddle(g, 0); g.restore();
    g.save(); g.translate(fall * -8, fall * 104); g.translate(0, -76); g.rotate(fall * .26); g.translate(0, 76); storeyTop(g); platformBack(g);
    // archers still on top are flung off
    for (let i = 0; i < n; i++){ const ax = AX[2 - n + i]; g.save(); g.translate(ax + fall * (i ? 22 : -22), -150 - bump(br, .2, .7) * 12 + fall * 40); g.rotate(fall * (i ? 2.2 : -2.4)); g.scale(.5, .5); g.globalAlpha *= 1 - seg(br, .55, .8); archer(g, { hold:0 }); g.restore(); }
    parapet(g); g.restore();
    g.restore();
    // planks and splinters flying, then settling; a dust cloud rolls out
    for (let i = 0; i < 9; i++){ const a = -Math.PI * (.1 + R() * .8), sp = 16 + R() * 24, x0 = (R() - .5) * 50, y0 = -60 + R() * 80, u = seg(br, .3, .85), x = x0 + Math.cos(a) * sp * u, y = Math.min(46 - R() * 6, y0 + Math.sin(a) * sp * u + u * u * 140);
      g.save(); g.translate(x, y); g.rotate(R() * 3 + u * (R() - .5) * 8); S.part(g, RR(-12, -2.5, 24, 5, 1.5), TIMBL, { x:0, y:0, r:12 }, { flat:true, mat:'wood', lw:1 }); g.restore(); }
    const dA = bump(br, .4, 1) * .8;
    if (dA > 0) for (let i = 0; i < 8; i++){ const x = -58 + i * 16.5 + Math.sin(i * 2.1) * 4, y = 30 - (i % 3) * 14 - settle * 10; dust(g, x, y, 18 + settle * 8, dA * .7); }
    return;
  }

  // ---------- standing tower ----------
  S.shadow(g, 0, 50, 58, 8);
  g.save(); g.translate(sx, bob); g.translate(0, 50); g.rotate(rock); g.translate(0, -50);
  // rear wheels peek out behind
  wheel(g, -44, 28, 13, rot + .4, -1); wheel(g, 52, 28, 13, rot + .4, 1);
  // archers on the platform (behind the parapet), and the platform behind them
  platformBack(g);
  for (let i = 0; i < 2; i++){ const present = i >= 2 - n; const falling = knockT != null && i === 2 - n - 1;   // the one knocked off this time was the next in line
    if (!present && !falling) continue;
    if (falling) continue;   // the falling archer is drawn in front of everything below
    const ax = AX[i], up = volley != null ? bump(volley, 0, 1) * 12 : 0; g.save(); g.translate(ax, -155 + flinch * 3 - up); g.scale(.5, .5);
    if (volley != null){ const dl = i ? .12 : 0; archer(g, { draw:clamp((volley - dl) / .88) }); }
    else archer(g, { hold:(P.roll ?? 0) + i * .25 });
    g.restore(); }
  parapet(g);
  storeyTop(g); storeyMiddle(g, glare); storeyBottom(g);
  // front wheels
  wheel(g, -50, 34, 16, rot, -1); wheel(g, 50, 34, 16, rot, 1);
  // axle ends
  for (const s of [-1, 1]) S.part(g, RR(s * 44 - 5, 30, 10, 8, 2), IRONB, { x:s * 44, y:34, r:6 }, { flat:true, mat:'metal', lw:1 });
  // the knight inside the doorway (drawn before the ramp while the ramp is still up), then the ramp
  const kOnRamp = kn != null && kn > .08;
  if (kn != null && !kOnRamp && drop > .6){ g.save(); g.translate(0, 18); g.scale(.36, .36); knight(g, { walk:0, up:true }); g.restore(); }
  ramp(g, drop);
  if (kOnRamp){ const u = ease(seg(kn, .08, .85)), y = 22 + u * 38, s = .4 + u * .42; g.save(); g.translate(0, y - 50 * s); g.scale(s, s); knight(g, { walk:(kn * 3) % 1, up:true }); g.restore(); }
  // rolling dust
  if (P.roll != null){ for (const s of [-1, 1]){ const k = (P.roll * 2 + (s > 0 ? .5 : 0)) % 1; dust(g, s * (52 + k * 10), 46 - k * 8, 8 + k * 10, .45 * (1 - k)); } }
  if (drop > 0 && drop < 1 || shake > .3 && P.ramp != null){ const a = P.ramp != null ? bump(P.ramp, .2, .55) : 0; if (a > 0) for (let i = 0; i < 5; i++) dust(g, -30 + i * 15, 66, 14, a * .6); }
  // splinters on a hit
  if (P.hit != null){ const R = rng(9), u = P.hit; for (let i = 0; i < 6; i++){ const a = -Math.PI * (.15 + R() * .7), sp = 20 + R() * 26, x = (R() - .5) * 30 + Math.cos(a) * sp * u, y = -60 + R() * 30 + Math.sin(a) * sp * u + u * u * 30;
    g.save(); g.globalAlpha *= 1 - u * .6; g.translate(x, y); g.rotate(R() * 3 + u * 4); S.part(g, PL([[-5, -1.2], [5, 0], [-5, 1.2]]), TIMBL, { x:0, y:0, r:5 }, { flat:true, lw:.8 }); g.restore(); } }
  g.restore();
  // the archer knocked off this time topples forward over the parapet and drops away
  if (knockT != null && n < 2){ const i = 2 - n - 1, ax = AX[i], u = knockT;
    g.save(); g.translate(sx + ax + (i ? 10 : -10) * u, -155 - Math.sin(u * Math.PI * .6) * 18 + u * u * 150); g.rotate((i ? 1 : -1) * u * 3.2); g.scale(.5, .5); g.globalAlpha *= 1 - seg(u, .7, 1); archer(g, { hold:0 }); g.restore();
    const R = rng(4); for (let k = 0; k < 4; k++){ const bx = ax + (R() - .5) * 20 + (R() - .5) * 40 * u, by = -140 + u * u * 160 * (.6 + R() * .4); g.save(); g.globalAlpha *= 1 - seg(u, .6, 1); g.translate(bx, by); g.rotate(u * 6 + k); S.part(g, RR(-5, -1.6, 10, 3.2, 1.6), { base:'#ded6c6', light:'#f6f2ea', dark:'#a8a090', deep:'#6a6458', rim:'#fff8e8' }, { x:0, y:0, r:5 }, { flat:true, mat:'bone', lw:.8 }); g.restore(); } }
}

// ---------- registry-style entries ----------
// Sizes: Lamplighter box 219 x 267 (the lantern hangs out to the right), Siege Tower box 174 x 288 (the knight walks down the lowered ramp) (the Kraken is 228 x 218 at .58, the Poltergeist 276 x 236 at .6).
export const CLIPS = {
  lamplighter: { name:'The Lamplighter', draw:lamplighter, scale:.46, box:{ x:-79, y:-197, w:219, h:267 },
    clips:{ drift:{ n:8, fps:7, pose:t => ({ drift:t }) }, dark:{ n:8, fps:7, pose:t => ({ dark:t }) },
      snuff:{ n:6, fps:10, once:true, pose:t => ({ snuff:t }) }, relight:{ n:6, fps:10, once:true, pose:t => ({ relight:t }) },
      blink:{ n:10, fps:14, once:true, pose:t => ({ blink:t }) }, shroud:{ n:12, fps:12, once:true, pose:t => ({ shroud:t }) },
      hit:{ n:5, fps:14, once:true, pose:t => ({ hit:t }) } } },
  siegetower: { name:'The Siege Tower', draw:siegeTower, scale:.46, box:{ x:-83, y:-207, w:174, h:288 }, variants:{ a2:true, a1:true, a0:true },
    clips:{ roll:{ n:8, fps:6, pose:t => ({ roll:t }) }, volley:{ n:8, fps:12, once:true, pose:t => ({ volley:t }) },
      ramp:{ n:12, fps:10, once:true, pose:t => ({ ramp:t }) }, raise:{ n:6, fps:8, once:true, pose:t => ({ raise:t }) },
      knock:{ n:8, fps:12, once:true, pose:t => ({ knock:t }) }, hit:{ n:5, fps:14, once:true, pose:t => ({ hit:t }) },
      break:{ n:12, fps:10, once:true, pose:t => ({ brk:t }) } } },
};
