// ---------- World 5 (Drowned Marsh) characters, Toy Plastic style ----------
// Puddle Crawler, Drunk Sailor, Puddle Diver, Splitter Slime, Blob, Shell Turtle and the Twin Tides.
// Each drawing takes a pose and draws in "drawing units" around (0,0) with the feet (or the waterline) near y = 50.
// Style and rules: docs/ART_BRIEF.md. Helpers copied from w1.js (wet, kelp, starfish) so this file stays self-contained.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';

const KELP = pal('#2f6b3a'), STAR = pal('#e88a5a'), DRIP = pal('#9fd8e8'),
  CRAWL = pal('#4a8a96'), CRAWLD = pal('#3a6a74'), HUMP = pal('#3f7a6c'), CLAW = '#e8f4f0',
  SKIN = pal('#a9bfa4'), SHIRT = pal('#ece8dc'), NAVY = pal('#2e3f70'), PANTS = pal('#6a5a4a'), SHOE = pal('#3a2e2a'), BOTTLE = pal('#3e8a52'), CORK = pal('#c9a45c'), NOSE = pal('#d86a6a'),
  WATERB = pal('#8fd8f0'),
  SLIME = pal('#5ad08a'), SLIMEC = pal('#9af0b8'), BLOBC = pal('#7fe0a0'), YOLK = pal('#2f7a52'),
  SHELLD = pal('#2f5e48'), SHELLR = pal('#7fb08a'), TSKIN = pal('#6a9a62'), MOSS = pal('#5c9a3a'), BARN = pal('#d8d0c0'),
  TOOTH = '#f4fbff';

// ---------- costume helpers ----------
/** Wet sheen: extra soft highlights and a couple of drips on a clip shape. */
function wet(g, clip, b, drips = []){ g.save(); clip(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, b.x - b.r * .3, b.y - b.r * .2, b.r * .32, b.r * .1, -.5); g.fill(); ell(g, b.x + b.r * .25, b.y + b.r * .3, b.r * .18, b.r * .06, -.4); g.fill(); g.restore();
  for (const [x, y, l] of drips){ S.tube(g, SO([[x, y], [x + 1, y + l]]), DRIP, 2.2); S.dot(g, E(x + 1, y + l + 1.5, 1.8, 2.2), '#c8f0ff', .9); } }
/** Kelp fronds hanging from a point. */
function kelp(g, x, y, n = 3, len = 22){ const R = rng(x * 3 + y | 0); for (let i = 0; i < n; i++){ const dx = (i - (n - 1) / 2) * 7 + (R() - .5) * 4, L = len * (.7 + R() * .6); S.tube(g, SO([[x + dx, y], [x + dx + (R() - .5) * 10, y + L * .5], [x + dx + (R() - .5) * 12, y + L]]), KELP, 4.5); } }
/** A small starfish. */
function starfish(g, x, y, r = 5){ g.save(); g.translate(x, y); S.part(g, g2 => { g2.beginPath(); for (let i = 0; i < 10; i++){ const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r; g2.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g2.closePath(); }, STAR, { x:0, y:0, r }, { flat:true, mat:'skin' }); g.restore(); }
/** A barnacle: a little cone with a dark mouth. */
function barnacle(g, x, y, r = 4){ S.part(g, E(x, y, r, r * .8), BARN, { x, y, r }, { flat:true, mat:'stone', noEdge:true }); S.dot(g, E(x, y, r * .35, r * .3), '#3a3028', .9); }
/** A disc of water with drifting ripple rings; ph 0..1 animates the rings. */
function water(g, x, y, rx, ry, ph = 0, a = .85){
  g.save(); g.globalAlpha *= a;
  const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, 'rgba(130,205,228,.95)'); gr.addColorStop(1, 'rgba(50,130,160,.7)');
  ell(g, x, y, rx, ry); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(25,80,100,.7)'; g.lineWidth = 1.4; g.stroke();
  g.lineWidth = 1.3; for (let i = 0; i < 2; i++){ const k = (ph + i * .5) % 1; g.strokeStyle = `rgba(225,248,255,${(1 - k) * .75})`; ell(g, x, y, rx * (.3 + k * .65), ry * (.3 + k * .65)); g.stroke(); }
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
/** Clip to everything above the waterline while drawing `fn` (body sinking into or rising from water). */
function aboveWater(g, wl, fn){ g.save(); g.beginPath(); g.rect(-260, -320, 520, 320 + wl); g.clip(); fn(); g.restore(); }
/** A ring of foam blobs churning around (x, y); ph 0..1 drifts them. Sizes come from the seed so frames are stable. */
function foam(g, x, y, rx, ry, ph, n = 10, seed = 1){
  const R = rng(seed);
  for (let i = 0; i < n; i++){ const a = (i / n + ph * .15) * TAU, wob = 1 + Math.sin(ph * TAU * 2 + i * 1.7) * .12, px = x + Math.cos(a) * rx * wob, py = y + Math.sin(a) * ry * wob, r = 2 + R() * 2.6, al = .55 + R() * .3;
    S.dot(g, E(px, py, r, r * .75), '#eafcff', al); S.dot(g, E(px - r * .3, py - r * .3, r * .35, r * .3), '#fff', al); }
}
/** Thin water streaks running down a clip shape. */
function streaks(g, clip, lines){ g.save(); clip(g); g.clip(); g.strokeStyle = 'rgba(225,245,255,.42)'; g.lineWidth = 1.1; g.lineCap = 'round'; for (const [x, y, l] of lines){ g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 1, y + l * .5, x - .5, y + l); g.stroke(); } g.restore(); }
/** A pointed spike with its base at (x, y), pointing along angle a. */
function spike(g, x, y, a, len, w, c){ S.part(g, PL([[x - Math.sin(a) * w, y + Math.cos(a) * w], [x + Math.sin(a) * w, y - Math.cos(a) * w], [x + Math.cos(a) * len, y + Math.sin(a) * len]]), c, { x:x + Math.cos(a) * len * .35, y:y + Math.sin(a) * len * .35, r:len * .5 }, { flat:true, mat:'horn', lw:1.2 }); }
/** Glowing cracks across a clip shape (the Twin Tides' full form). */
function cracks(g, clip, lines, col){ g.save(); clip(g); g.clip(); g.shadowColor = col; g.shadowBlur = 8; g.strokeStyle = col; g.lineWidth = 1.4; g.lineCap = 'round'; g.lineJoin = 'round'; for (const pts of lines){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } g.restore(); }

// ---------- Puddle Crawler: a drowned thing on all fours, weed-hung and dripping ----------
function crawlerBody(g, w, jaw, lean){
  const ph = w == null ? .25 * TAU : w * TAU, sw = Math.sin(ph), bob = -Math.abs(sw) * 2 + lean;
  // hind legs: knees tucked behind the body, feet shuffling
  for (const s of [-1, 1]){ const dx = Math.cos(ph + (s < 0 ? Math.PI : 0)) * 3; S.tube(g, SO([[s * 30, 14], [s * 40 + dx, 30], [s * 36 + dx, 46]]), CRAWLD, 9); const f = E(s * 36 + dx, 48, 9, 4.5); S.part(g, f, CRAWLD, { x:s * 36 + dx, y:48, r:9 }, { flat:true, mat:'skin' }); for (const d of [-4, 0, 4]) S.claw(g, s * 36 + dx + d, 51, Math.PI / 2, 3.5, CLAW); }
  g.save(); g.translate(0, bob);
  // hunched back arching up behind the head, with a knobbly spine
  const hump = SM([[-36, 26], [-46, 4], [-38, -20], [-16, -36], [10, -40], [34, -28], [46, -6], [40, 20], [20, 32], [-16, 34]]); S.part(g, hump, HUMP, { x:-2, y:-4, r:44 }, { mat:'skin', hx:-22, hy:-26 });
  for (const [x, y, r] of [[-26, -24, 5], [-8, -34, 5.5], [12, -34, 5], [30, -22, 4.5]]) S.part(g, E(x, y, r, r * .75), HUMP, { x, y, r }, { flat:true, mat:'skin' });
  S.crease(g, SO([[-34, -2], [-18, -22], [8, -30], [34, -18]]), HUMP, 1.8, .4);
  kelp(g, -10, -36, 4, 32); starfish(g, 30, -8, 5); barnacle(g, -34, 8, 3.5);
  g.restore();
  // arms: planted in front, one lifting as it crawls
  for (const s of [-1, 1]){ const lift = w == null ? 0 : Math.max(0, Math.sin(ph + (s < 0 ? 0 : Math.PI))) * 9, dx = w == null ? 0 : Math.cos(ph + (s < 0 ? 0 : Math.PI)) * 4;
    S.tube(g, SO([[s * 26, 8 + bob], [s * 40, 26 - lift * .6], [s * 42 + dx, 44 - lift]]), CRAWL, 8);
    const hx = s * 44 + dx, hy = 46 - lift; S.hand(g, hx, hy, CRAWL, Math.PI / 2 + s * .3, 3, 6.5); for (const d of [-.5, 0, .5]) S.claw(g, hx + Math.cos(Math.PI / 2 + s * .3 + d) * 6, hy + Math.sin(Math.PI / 2 + s * .3 + d) * 6, Math.PI / 2 + s * .3 + d, 3.5, CLAW); }
  g.save(); g.translate(0, bob);
  // head hanging low and forward, under the arch of the back
  const head = SM([[-22, 2], [-25, 16], [-16, 30], [0, 34], [16, 30], [25, 16], [22, 2], [11, -10], [-11, -10]]); S.part(g, head, CRAWL, { x:0, y:12, r:24 }, { mat:'skin' }); S.contact(g, hump, 0, -2, 20, 7, .5);
  wet(g, head, { x:0, y:12, r:24 }, [[-46, 24, 6], [42, 28, 5], [22, 32, 4]]);
  S.tube(g, SO([[-12, -10], [-18, 8], [-14, 24]]), KELP, 3.5);
  S.eye(g, -9, 12, 8, 8.5, { lx:.05, ly:.25, pr:.3, iris:'#7fd8e8' }); S.eye(g, 9, 12, 8, 8.5, { lx:-.05, ly:.25, pr:.3, iris:'#7fd8e8' });
  S.ln(g, [[-17, 3], [-5, 4]], CRAWLD, 1.6, .7); S.ln(g, [[17, 3], [5, 4]], CRAWLD, 1.6, .7);
  const mouth = SM([[-10, 23], [-5, 26 + jaw * 6], [0, 28 + jaw * 8], [5, 26 + jaw * 6], [10, 23], [0, 21]], .8); S.dot(g, mouth, '#1c2a34'); S.dot(g, E(0, 26 + jaw * 6, 4.5, 2.2), '#3a8a90', .7);
  for (const x of [-6, -2, 2, 6]) S.dot(g, PL([[x - 1.6, 22], [x + 1.6, 22], [x, 25.5]]), '#eef8f8');
  S.dot(g, E(7, 30 + jaw * 6, 1.6, 3.5), '#9fd8e8', .8);
  g.restore();
}
function crawler(g, P = {}){
  const WL = 38;
  if (P.rise != null){   // climbing out of a puddle
    const t = P.rise;
    aboveWater(g, WL, () => { g.translate(0, (1 - t) * 64); crawlerBody(g, .25, 0, 0); });
    water(g, 0, WL + 3, 44, 10, t * .9, .8);
    splash(g, 0, WL, Math.min(1, t * 1.25), 3, 12, 40); splash(g, 0, WL, Math.max(0, t * 1.6 - .5), 7, 8, 28);
    return;
  }
  S.shadow(g, 0, 50, 48, 7);
  const ch = P.chew, jaw = ch == null ? .1 : Math.abs(Math.sin(ch * TAU)), lean = ch == null ? 0 : 2 + Math.sin(ch * TAU) * 2;
  crawlerBody(g, P.walk, jaw, lean);
}

// ---------- Drunk Sailor: striped shirt, cap, bottle, listing to one side ----------
function bottle(g, x, y, ang, slosh){
  g.save(); g.translate(x, y); g.rotate(ang);
  const body = RR(-6, -26, 12, 28, 4); S.part(g, body, BOTTLE, { x:0, y:-12, r:12 }, { mat:'gel', hx:-3, hy:-20 });
  g.save(); body(g); g.clip(); S.dot(g, RR(-6, -10 + slosh, 12, 14, 2), '#8ad8a0', .55); g.restore();
  S.part(g, RR(-5, -12, 10, 8, 1), pal('#e8dcc0'), { x:0, y:-8, r:5 }, { flat:true, mat:'cloth', lw:1 });
  S.part(g, RR(-3, -38, 6, 14, 2), BOTTLE, { x:0, y:-32, r:7 }, { mat:'gel', hx:-1, hy:-34 }); S.part(g, RR(-3.5, -42, 7, 5, 2), CORK, { x:0, y:-40, r:4 }, { flat:true, mat:'wood' });
  g.restore();
}
function sailor(g, P = {}){
  const w = P.walk, ch = P.chew, ph = w == null ? 0 : w * TAU, sw = w == null ? 0 : Math.sin(ph), cs = ch == null ? 0 : Math.sin(ch * TAU);
  const list = -.16 + sw * .12 + cs * .05, bob = w != null ? -Math.abs(sw) * 3 : cs * 3, jaw = ch == null ? .25 : .25 + Math.abs(cs) * .75, slosh = w != null ? sw * 2 : cs * 1.5;
  S.shadow(g, 2, 50, 32, 6);
  for (const s of [-1, 1]){ const p2 = ph + (s < 0 ? 0 : Math.PI), lift = w == null ? 0 : Math.max(0, Math.sin(p2)) * 8, dx = w == null ? s * 2 : Math.cos(p2) * 7;
    const leg = SM([[s * 5, 14], [s * 20, 14], [s * 26 + dx, 46 - lift], [s * 9 + dx, 46 - lift]], .5); S.part(g, leg, PANTS, { x:s * 15 + dx * .5, y:30, r:14 }, { flat:true, mat:'cloth' }); S.crease(g, SO([[s * 13, 20], [s * 15 + dx * .5, 40 - lift]]), PANTS, 1.4, .35);
    const fy = 48 - lift, fx = s * 18 + dx; S.part(g, SM([[fx - 11, fy - 3], [fx + 11, fy - 3], [fx + 12, fy + 3], [fx - 12, fy + 3]], .7), SHOE, { x:fx, y:fy, r:11 }, { flat:true, mat:'leather' }); }
  g.save(); g.translate(0, 22 + bob); g.rotate(list); g.translate(0, -22);
  const torso = SM([[-24, -8], [-27, 10], [-21, 28], [0, 32], [21, 28], [27, 10], [24, -8], [12, -20], [-12, -20]]); S.part(g, torso, SHIRT, { x:0, y:6, r:30 }, { mat:'cloth' });
  g.save(); torso(g); g.clip(); for (let i = 0; i < 6; i++){ const y = -16 + i * 8; S.part(g, g2 => { g2.beginPath(); g2.moveTo(-32, y); g2.quadraticCurveTo(0, y + 2, 32, y); g2.lineTo(32, y + 4); g2.quadraticCurveTo(0, y + 6, -32, y + 4); g2.closePath(); }, NAVY, { x:0, y:y + 2, r:32 }, { flat:true, noEdge:true, mat:'cloth' }); } g.restore();
  S.overlay(g, torso, SHIRT, { x:0, y:6, r:30 }, .5); S.crease(g, SO([[-12, 8], [-10, 30]]), NAVY, 1.4, .3);
  S.dot(g, E(6, 22, 6, 4), '#7a8a78', .35);
  // hanging arm and the bottle arm
  const sw2 = w != null ? Math.sin(ph + Math.PI) * .2 : cs * .1; g.save(); g.translate(-24, -4); g.rotate(-sw2); g.translate(24, 4);
  S.part(g, SM([[-22, -12], [-36, -6], [-38, 6], [-24, 8]], .6), SHIRT, { x:-30, y:-2, r:9 }, { flat:true, mat:'cloth' }); S.tube(g, SO([[-32, 2], [-40, 16], [-42, 30]]), SKIN, 7); S.hand(g, -43, 34, SKIN, Math.PI / 2 + .3, 3, 6); g.restore();
  S.part(g, SM([[22, -12], [36, -6], [38, 6], [24, 8]], .6), SHIRT, { x:30, y:-2, r:9 }, { flat:true, mat:'cloth' }); S.tube(g, SO([[32, 0], [44, -12], [48, -28]]), SKIN, 7); S.hand(g, 48, -30, SKIN, -Math.PI / 2 + .4, 3, 6);
  bottle(g, 50, -30, -.35 + slosh * .04, slosh);
  S.contact(g, torso, 0, -14, 16, 6, .4);
  // head, cap and a bleary face
  g.save(); g.rotate(list * .5); g.translate(0, cs * 1.5);
  const head = SM([[-20, -40], [-23, -24], [-16, -10], [0, -6], [16, -10], [23, -24], [20, -40], [10, -50], [-10, -50]]); S.part(g, head, SKIN, { x:0, y:-28, r:22 }, { mat:'skin' });
  wet(g, head, { x:0, y:-28, r:22 }, [[-24, -18, 6], [22, -14, 5]]);
  for (const s of [-1, 1]) S.part(g, E(s * 22, -26, 3.5, 4.5), SKIN, { x:s * 22, y:-26, r:4 }, { flat:true, noEdge:true, mat:'skin' });
  const cap = SM([[-24, -44], [-19, -58], [0, -63], [19, -58], [24, -44], [0, -40]], .8); S.part(g, cap, NAVY, { x:0, y:-50, r:24 }, { mat:'cloth', hx:-10, hy:-56 });
  S.part(g, RR(-25, -47, 50, 6, 3), pal(NAVY.dark), { x:0, y:-44, r:25 }, { flat:true, mat:'cloth' }); S.part(g, E(0, -63, 5, 4.5), pal('#d84a4a'), { x:0, y:-63, r:5 }, { flat:true, mat:'cloth' });
  kelp(g, -18, -46, 2, 16); starfish(g, 16, -54, 4.5);
  S.eye(g, -8, -30, 8, 8.5, { lx:.05, ly:.35, pr:.36, lid:.45, tilt:-.2, lidCol:SKIN.base, lidDeep:SKIN.deep, iris:'#6a7a5a' }); S.eye(g, 9, -29, 7, 7.5, { lx:-.1, ly:.35, pr:.4, lid:.55, tilt:.25, lidCol:SKIN.base, lidDeep:SKIN.deep, iris:'#6a7a5a' });
  S.ln(g, [[-15, -22], [-3, -21]], SKIN, 1.2, .45); S.ln(g, [[3, -21], [15, -22]], SKIN, 1.2, .45);
  S.part(g, E(0, -20, 5, 4.2), NOSE, { x:0, y:-20, r:5 }, { flat:true, mat:'skin' }); S.blush(g, 0, -19, .9);
  const R = rng(9); g.strokeStyle = rgba(SKIN.deep, .5); g.lineWidth = .8; for (let i = 0; i < 9; i++){ const x = -12 + R() * 24, y = -12 + R() * 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + .8, y + 1.6); g.stroke(); }
  S.dot(g, SM([[-9, -12], [-4, -8 + jaw * 5], [3, -7 + jaw * 7], [9, -10 + jaw * 2], [10, -13], [0, -14]], .8), '#2a1420'); S.dot(g, E(1, -9 + jaw * 4, 4, 2), '#b84a5a', .8);
  for (const x of [-5, 1, 6]) S.dot(g, PL([[x - 1.6, -13], [x + 1.6, -13], [x, -9.5]]), '#f4f4e8');
  S.dot(g, E(10, -8 + jaw * 4, 1.4, 3), '#9fd8e8', .8);
  g.restore(); g.restore();
}

// ---------- Puddle Diver: a drowned, bloated thing that rises from a puddle to hurl water ----------
const DROWN = pal('#b9cbb5'), DROWND = pal('#8fa898'), SHEEN = pal('#5fa882'), HAIR = pal('#22362c'), NEEDLE = '#e9f1e6', PUPIL = '#b4ffd4';
/** Greenish sheen rising from below on a clip shape (light off the water on wet, pale skin). */
function sheen(g, clip, x, y, r, a = .5){ g.save(); clip(g); g.clip(); const gr = g.createRadialGradient(x, y, r * .1, x, y, r); gr.addColorStop(0, rgba(SHEEN.base, a)); gr.addColorStop(1, rgba(SHEEN.base, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
/** The drowned head: skull-like, hollow sockets with pinpoint glowing pupils, a wide needle-toothed grin, lank hair plastered over it. */
function drownedHead(g, jaw = .1, tilt = 0){
  g.save(); g.rotate(tilt);
  const head = SM([[-27, -12], [-29, 4], [-22, 16], [-10, 26], [0, 28], [10, 26], [22, 16], [29, 4], [27, -12], [16, -30], [0, -34], [-16, -30]]);
  S.part(g, head, DROWN, { x:0, y:-4, r:31 }, { mat:'skin', hx:-14, hy:-22 });
  sheen(g, head, 0, 22, 36, .55);
  S.contact(g, head, -19, 8, 9, 12, .4); S.contact(g, head, 19, 8, 9, 12, .4);   // sunken cheeks
  for (const [x, y, r] of [[-22, -18, 4], [20, 10, 3.5], [8, -26, 3]]) S.dot(g, E(x, y, r, r * .7), SHEEN.deep, .18);   // mottling
  // hollow sockets with pinpoint glowing pupils under a heavy brow
  for (const s of [-1, 1]){ const sock = E(s * 11, -8, 9.5, 8.5, s * .15); S.dot(g, sock, '#07100d'); g.save(); sock(g); g.clip(); S.dot(g, E(s * 11, -12, 9.5, 5), DROWN.deep, .35); g.restore();
    g.save(); g.shadowColor = PUPIL; g.shadowBlur = 9; S.dot(g, E(s * 10, -7, 1.7, 1.9), PUPIL); g.restore(); S.dot(g, E(s * 10 - .5, -7.6, .6, .6), '#fff');
    S.ln(g, [[s * 21, -18], [s * 4, -16]], DROWND, 2.6, .55); }
  for (const s of [-1, 1]) S.dot(g, E(s * 2.5, 3, 1.2, 2.2, s * .3), DROWN.deep, .7);   // nose slits
  // a wide grin of needle teeth
  const lip = x => 12 - Math.abs(x) * .12, J = jaw * 10;
  const mouth = SM([[-24, lip(-24)], [-12, lip(-12) + J * .6], [0, lip(0) + 2 + J], [12, lip(12) + J * .6], [24, lip(24)], [12, lip(12) - 2], [0, lip(0) - 3], [-12, lip(-12) - 2]], .7);
  S.dot(g, mouth, '#0b1511'); if (jaw > .3) S.dot(g, E(0, 13 + J * .5, 8, 2 + J * .3), '#4a2a3a', .7);
  for (let i = 0; i < 11; i++){ const x = -20 + i * 4, up = lip(x) - 2.5, len = 4 + (i % 2) * 2.5; S.dot(g, PL([[x - 1, up], [x + 1, up], [x + .2, up + len]]), NEEDLE); }
  for (let i = 0; i < 9; i++){ const x = -16 + i * 4, lo = lip(x) + 1.5 + J * (1 - Math.abs(x) / 30); S.dot(g, PL([[x - 1, lo], [x + 1, lo], [x - .2, lo - 3.5]]), NEEDLE); }
  S.stroke(g, SO([[-25, lip(-25)], [-12, lip(-12) - 2], [0, lip(0) - 3], [12, lip(12) - 2], [25, lip(25)]]), DROWND, 1.4, .8);
  // lank hair and weed plastered over the skull, one strand across a socket
  for (const [pts, w] of [[[[-14, -33], [-24, -16], [-27, 6]], 3.4], [[[-4, -35], [-10, -20], [-16, -2]], 2.8], [[[4, -35], [2, -22], [-2, -10]], 2.4], [[[12, -33], [20, -18], [22, 2]], 3.2], [[[18, -28], [28, -12], [30, 6]], 2.6], [[[-20, -26], [-28, -12], [-30, 4]], 2.6]]) S.tube(g, SO(pts), HAIR, w);
  streaks(g, head, [[-18, -8, 22], [16, -2, 18], [4, 16, 10]]);
  wet(g, head, { x:0, y:-4, r:31 }, [[-26, 6, 6], [26, 4, 5], [0, 27, 5]]);
  g.restore();
}
/** A long thin drowned arm ending in four dripping fingers; dir is where the fingers point, curl bends their tips. */
function drownedArm(g, pts, dir, curl = .6, drip = true){
  S.tube(g, SO(pts), DROWND, 5.5); const [hx, hy] = pts[pts.length - 1];
  S.part(g, E(hx, hy, 4.5, 4), DROWND, { x:hx, y:hy, r:4.5 }, { flat:true, mat:'skin', lw:1 });
  for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * .38, L = 11 + (i === 1 || i === 2 ? 3 : 0), mx = hx + Math.cos(a) * L * .55, my = hy + Math.sin(a) * L * .55, tx = mx + Math.cos(a + curl * .6) * L * .5, ty = my + Math.sin(a + curl * .6) * L * .5;
    S.tube(g, SO([[hx + Math.cos(a) * 3, hy + Math.sin(a) * 3], [mx, my], [tx, ty]]), DROWND, 2.4); S.dot(g, E(tx, ty, 1.1, 1.1), '#3a3a34', .8);
    if (drip && i === 2) S.dot(g, E(tx + 1, ty + 4, 1.6, 2.2), '#c8f0ff', .85); }
}
/** Head, shoulders and arms out of the water, fingers gripping the puddle edge; throw 0..1 winds up and hurls. */
function diverTop(g, throwT, bobT = 0){
  const bob = Math.sin(bobT * TAU) * 2, k = throwT == null ? 0 : throwT, wind = k < .45 ? k / .45 : 0, lunge = k >= .45 ? Math.sin(Math.min(1, (k - .45) / .55) * Math.PI) : 0;
  g.save(); g.translate(0, bob + lunge * 4); g.rotate(-wind * .1 + lunge * .14);
  // bloated torso with the ribs showing, weed over one shoulder
  const body = SM([[-30, 6], [-38, 22], [-36, 46], [36, 46], [38, 22], [30, 6], [14, 0], [-14, 0]]); S.part(g, body, DROWN, { x:0, y:26, r:36 }, { mat:'skin', hx:-16, hy:14 });
  sheen(g, body, 0, 48, 40, .5); S.dot(g, E(0, 34, 16, 10), DROWN.deep, .15);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) S.crease(g, SO([[s * 6, 12 + i * 6], [s * 20, 14 + i * 6], [s * 28, 20 + i * 6]]), DROWN, 1.5, .28);
  streaks(g, body, [[-24, 8, 30], [20, 10, 26], [4, 30, 14]]);
  kelp(g, -22, 4, 2, 18);
  // arms: long and thin, fingers spread over the water's edge
  drownedArm(g, [[-30, 12], [-46, 24], [-52, 38]], Math.PI / 2 + .35, -.7);
  if (throwT == null) drownedArm(g, [[30, 12], [46, 24], [52, 38]], Math.PI / 2 - .35, .7);
  else if (k < .45){ const hx = 40 + wind * 8, hy = 8 - wind * 40; drownedArm(g, [[30, 10], [48, 2 - wind * 12], [hx, hy]], -Math.PI / 2 + .3, .3, false); if (wind > .35){ const r = 5 + wind * 5; g.save(); g.shadowColor = '#bfeeff'; g.shadowBlur = 8; S.part(g, E(hx, hy - 7, r, r), WATERB, { x:hx, y:hy - 7, r }, { mat:'gel' }); g.restore(); } }
  else { const f = Math.min(1, (k - .45) / .25); drownedArm(g, [[30, 10], [46 + f * 4, 8 + f * 10], [54 - f * 8, -6 + f * 28]], Math.PI / 2 - .8 + f * .6, .2, false); if (f < .6) splash(g, 54, 0, f * 1.4 + .2, 5, 6, 22); }
  S.tube(g, SO([[0, 4], [0, 20]]), DROWND, 12);
  g.save(); g.translate(0, -8); drownedHead(g, throwT == null ? .15 : lunge * .9, -wind * .12 + lunge * .18 + Math.sin(bobT * TAU) * .04); g.restore();
  S.contact(g, body, 0, 6, 20, 6, .45);
  g.restore();
}
function diver(g, P = {}){
  const WL = 38;
  if (P.hidden){ water(g, 0, WL + 3, 42, 10, .3, .75); S.dot(g, E(-10, WL - 1, 2.5, 2.5), '#e8f8ff', .7); S.dot(g, E(8, WL - 4, 1.8, 1.8), '#e8f8ff', .6); return; }
  if (P.surface != null || P.down != null){
    const t = P.surface != null ? P.surface : 1 - P.down, sink = (1 - t) * 90;
    aboveWater(g, WL, () => { g.translate(0, sink); diverTop(g, null, 0); });
    water(g, 0, WL + 3, 42, 10, t * .9, .8);
    if (P.surface != null){ splash(g, 0, WL, Math.min(1, t * 1.3), 4, 12, 44); splash(g, 0, WL, Math.max(0, t * 1.5 - .5), 8, 8, 30); }
    else splash(g, 0, WL, Math.max(0, P.down * 1.2 - .1), 6, 8, 26);
    return;
  }
  if (P.throw != null || P.idle != null){
    aboveWater(g, WL, () => diverTop(g, P.throw, P.idle ?? 0));
    water(g, 0, WL + 3, 42, 10, (P.idle ?? P.throw) * .9, .8);
    return;
  }
  // walker: the whole drowned thing shambling in (levels without puddles)
  const w = P.walk, ch = P.chew, ph = w == null ? 0 : w * TAU, sw = w == null ? 0 : Math.sin(ph), cs = ch == null ? 0 : Math.sin(ch * TAU), jaw = ch == null ? .15 : Math.abs(cs), bob = w != null ? -Math.abs(sw) * 2.5 : cs * 2;
  S.shadow(g, 0, 50, 36, 6);
  // thin bent legs, feet dragging
  for (const s of [-1, 1]){ const p2 = ph + (s < 0 ? 0 : Math.PI), lift = w == null ? 0 : Math.max(0, Math.sin(p2)) * 7, dx = w == null ? s * 2 : Math.cos(p2) * 7;
    S.tube(g, SO([[s * 10, 22], [s * 17 + dx * .5, 36 - lift], [s * 14 + dx, 48 - lift]]), DROWND, 7);
    const fx = s * 15 + dx, fy = 49 - lift; S.part(g, SM([[fx - 9, fy - 2], [fx + 8, fy - 3], [fx + 11, fy + 2], [fx - 10, fy + 3]], .7), DROWND, { x:fx, y:fy, r:10 }, { flat:true, mat:'skin' }); for (const d of [-6, -2, 2, 6]) S.dot(g, E(fx + d, fy + 3, 1, 1), '#3a3a34', .7); }
  g.save(); g.translate(0, bob);
  const body = SM([[-24, -6], [-30, 10], [-26, 30], [0, 34], [26, 30], [30, 10], [24, -6], [12, -12], [-12, -12]]); S.part(g, body, DROWN, { x:0, y:12, r:30 }, { mat:'skin', hx:-14, hy:0 });
  sheen(g, body, 0, 36, 36, .5); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) S.crease(g, SO([[s * 5, 2 + i * 6], [s * 16, 4 + i * 6], [s * 23, 10 + i * 6]]), DROWN, 1.4, .28);
  streaks(g, body, [[-18, -4, 26], [16, 0, 22]]); kelp(g, 18, -8, 2, 16);
  // long hanging arms, fingers dangling and dripping
  for (const s of [-1, 1]){ const a = w == null ? 0 : Math.sin(ph + (s < 0 ? Math.PI : 0)) * 8, cd = ch == null ? 0 : Math.abs(cs) * 10; drownedArm(g, [[s * 26, 0], [s * 34 + a * .5, 22 - cd * .3], [s * 36 + a, 40 - cd]], Math.PI / 2 + s * .2, s * .6); }
  S.tube(g, SO([[0, -8], [0, 4]]), DROWND, 11);
  g.save(); g.translate(0, -12 + cs * 2); g.rotate(sw * .05 + .1 + (ch == null ? 0 : cs * .08)); drownedHead(g, jaw, 0); g.restore();
  S.contact(g, body, 0, -4, 18, 6, .45);
  g.restore();
}

// ---------- Splitter Slime and its Blobs: translucent jellies ----------
function yolk(g, x, y, r, a = .6){ g.save(); g.globalAlpha *= a; S.part(g, E(x, y, r, r * .9), BLOBC, { x, y, r }, { flat:true, noEdge:true, mat:'gel' }); S.dot(g, E(x - r * .3, y - r * .1, r * .18, r * .22), YOLK.deep); S.dot(g, E(x + r * .3, y - r * .1, r * .18, r * .22), YOLK.deep); g.restore(); }
function slime(g, P = {}){
  const w = P.walk, ch = P.chew, ph = (w ?? ch ?? 0) * TAU, wob = Math.sin(ph) * .06, lean = ch == null ? 0 : Math.abs(Math.sin(ch * TAU)), jaw = ch == null ? .15 : .15 + lean * .85;
  S.shadow(g, 0, 50, 44, 7);
  g.save(); g.globalAlpha *= .8; S.part(g, E(0, 46, 46, 8), SLIME, { x:0, y:46, r:46 }, { flat:true, mat:'gel' }); g.restore();
  g.save(); g.translate(0, 50); g.scale(1 + wob - lean * .04, 1 - wob - lean * .08); g.translate(0, -50);
  // drip on the right flank
  const dl = 10 + Math.max(0, Math.sin(ph + 1)) * 6; S.tube(g, SO([[38, 26], [41, 36 + dl * .5], [42, 40 + dl]]), SLIME, 5); S.part(g, E(42, 42 + dl, 4.5, 5.5), SLIME, { x:42, y:42 + dl, r:5 }, { mat:'gel' });
  const body = SM([[-36, 46], [-42, 22], [-36, -6], [-22, -26], [-6, -36], [8, -30], [22, -26], [36, -12], [42, 12], [38, 46]], .9); S.part(g, body, SLIME, { x:0, y:10, r:42 }, { mat:'gel', hx:-16, hy:-22 });
  yolk(g, -14, 24, 11); yolk(g, 14, 22, 11); S.dot(g, E(-4, 30, 2, 2), '#e8fff0', .5); S.dot(g, E(26, 8, 1.5, 1.5), '#e8fff0', .5);
  S.dot(g, E(-16, -20, 9, 4), '#f0fff4', .55);
  S.eye(g, -11, -4, 8.5, 9, { lx:.15, ly:.15, pr:.42, iris:'#2a8a5a' }); S.eye(g, 12, -6, 8.5, 9, { lx:.15, ly:.15, pr:.42, iris:'#2a8a5a' });
  S.dot(g, SM([[-9, 10], [-4, 12 + jaw * 7], [0, 13 + jaw * 9], [4, 12 + jaw * 7], [9, 10], [0, 8]], .8), '#1e4a32'); S.dot(g, E(0, 12 + jaw * 6, 4, 2), '#5ac08a', .8);
  S.blush(g, 0, 8, .9);
  g.restore();
}
function blob(g, P = {}){
  const w = P.walk, ch = P.chew, ph = (w ?? ch ?? 0) * TAU, wob = Math.sin(ph) * .09, lean = ch == null ? 0 : Math.abs(Math.sin(ch * TAU)), jaw = ch == null ? .15 : .15 + lean * .85;
  S.shadow(g, 0, 50, 26, 5);
  g.save(); g.globalAlpha *= .8; S.part(g, E(0, 47, 27, 5), BLOBC, { x:0, y:47, r:27 }, { flat:true, mat:'gel' }); g.restore();
  g.save(); g.translate(0, 50); g.scale(1 + wob - lean * .04, 1 - wob - lean * .1); g.translate(0, -50);
  const body = SM([[-22, 46], [-26, 26], [-18, 8], [-4, 2], [12, 6], [24, 20], [24, 46]], .9); S.part(g, body, BLOBC, { x:0, y:26, r:26 }, { mat:'gel', hx:-10, hy:12 });
  g.save(); g.globalAlpha *= .6; S.part(g, E(0, 30, 8, 7), SLIME, { x:0, y:30, r:8 }, { flat:true, noEdge:true, mat:'gel' }); g.restore(); S.dot(g, E(-8, 20, 5, 2.4), '#f0fff4', .5);
  S.eye(g, -7, 18, 5.5, 6, { lx:.15, ly:.15, pr:.45, iris:'#2a8a5a' }); S.eye(g, 8, 17, 5.5, 6, { lx:.15, ly:.15, pr:.45, iris:'#2a8a5a' });
  S.dot(g, SM([[-5, 28], [-2, 29 + jaw * 4], [0, 30 + jaw * 5], [2, 29 + jaw * 4], [5, 28], [0, 27]], .8), '#1e4a32');
  S.blush(g, 0, 26, .55);
  g.restore();
}

// ---------- Shell Turtle: a big turtle walking backwards at the player, shell first, head looking back over its shoulder ----------
const TSKIND = pal('#4c7644'), KEEL = pal('#8cbf96'), SCUTE = pal('#3d7a5a'), TCLAW = '#e8e8d8';
function hexPts(x, y, r, ry){ return [[x, y - ry], [x + r, y - ry * .5], [x + r, y + ry * .5], [x, y + ry], [x - r, y + ry * .5], [x - r, y - ry * .5]]; }
/** A raised hexagonal scute: plate, bevel (lit upper-left edges, shaded lower-right) inside a dark groove. */
function scute(g, x, y, r, ry, c = SCUTE){
  const pts = hexPts(x, y, r, ry), p = PL(pts), inner = hexPts(x, y, r * .74, ry * .74);
  S.part(g, p, c, { x, y, r:r * 1.15 }, { flat:true, mat:'stone', hx:x - r * .3, hy:y - ry * .45, lw:2.4 });
  g.lineWidth = 1.6; g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(inner[4][0], inner[4][1]); g.lineTo(inner[5][0], inner[5][1]); g.lineTo(inner[0][0], inner[0][1]); g.lineTo(inner[1][0], inner[1][1]); g.stroke();
  g.strokeStyle = rgba(c.deep, .55); g.beginPath(); g.moveTo(inner[1][0], inner[1][1]); g.lineTo(inner[2][0], inner[2][1]); g.lineTo(inner[3][0], inner[3][1]); g.lineTo(inner[4][0], inner[4][1]); g.stroke();
  S.dot(g, E(x - r * .25, y - ry * .3, r * .28, ry * .16, -.4), '#fff', .16);
}
function turtle(g, P = {}){
  const w = P.walk, ch = P.chew, ph = w == null ? 0 : w * TAU, sw = w == null ? 0 : Math.sin(ph), cs = ch == null ? 0 : Math.sin(ch * TAU);
  const rock = sw * .045 + cs * .03, bob = w != null ? -Math.abs(sw) * 2 : cs * 2, lean = ch == null ? 0 : Math.abs(cs) * 3;
  S.shadow(g, 0, 50, 56, 8);
  // the head peeks over the top edge, turned to look back over its shoulder with a wary eye (the shell overlaps its neck)
  g.save(); g.translate(0, bob * .5 + lean); g.translate(2, -46); g.scale(1.15, 1.15); g.translate(-2, 46);
  S.tube(g, SO([[4, -24], [8, -40], [10, -50]]), TSKIND, 13);
  const head = SM([[-8, -64], [-22, -60], [-28, -50], [-22, -42], [-8, -38], [8, -38], [20, -42], [24, -52], [18, -62], [6, -66]]);
  S.part(g, head, TSKIN, { x:2, y:-52, r:20 }, { mat:'scaly', hx:-8, hy:-60 });
  wet(g, head, { x:2, y:-52, r:20 }, [[-24, -46, 4]]);
  S.stroke(g, SO([[-27, -48], [-18, -45], [-8, -46]]), TSKIND, 1.6, .8);   // beak
  S.dot(g, E(-22, -54, 1.6, 1.2), TSKIND.deep, .8);   // nostril
  S.dot(g, E(-15, -56, 2.4, 3), '#2a2a24', .45);   // the far eye, mostly turned away
  S.ln(g, [[-2, -61], [15, -59]], TSKIND, 2.6, .7);   // brow
  S.eye(g, 7, -52, 7, 6.5, { lx:-.35, ly:.1, pr:.42, lid:.35, tilt:.25, lidCol:TSKIN.base, lidDeep:TSKIN.deep, iris:'#d8a23a' });
  g.restore();
  // the front pair of legs, seen past the shell's sides
  for (const s of [-1, 1]){ const dx = Math.cos(ph + (s < 0 ? Math.PI : 0)) * 4; S.tube(g, SO([[s * 36, 4], [s * 50 + dx, 20]]), TSKIND, 11); S.part(g, E(s * 52 + dx, 24, 9, 5.5), TSKIND, { x:s * 52 + dx, y:24, r:9 }, { flat:true, mat:'scaly' }); for (const d of [-4, 0, 4]) S.claw(g, s * 52 + dx + d, 28, Math.PI / 2, 3, TCLAW); }
  // stubby tail and the hind legs under the rim
  g.save(); g.translate(0, bob); S.part(g, SM([[-7, 30], [7, 30], [4, 46], [0, 56], [-4, 46]], .6), TSKIND, { x:0, y:40, r:8 }, { flat:true, mat:'scaly' }); g.restore();
  for (const s of [-1, 1]){ const p2 = ph + (s < 0 ? 0 : Math.PI), lift = w == null ? 0 : Math.max(0, Math.sin(p2)) * 5, dx = w == null ? 0 : Math.cos(p2) * 4;
    S.tube(g, SO([[s * 30, 30], [s * 37 + dx, 46 - lift]]), TSKIN, 13);
    const fx = s * 38 + dx, fy = 48 - lift; S.part(g, E(fx, fy, 11, 5.5), TSKIN, { x:fx, y:fy, r:11 }, { flat:true, mat:'scaly' }); for (const d of [-6, 0, 6]) S.claw(g, fx + d, fy + 3.5, Math.PI / 2, 4, TCLAW); }
  g.save(); g.translate(0, 10 + bob); g.rotate(rock); g.translate(0, -10);
  // the shell: a domed bowl seen from behind, dark base with big raised scutes and a keel down the middle
  const shell = SM([[-52, 26], [-54, 2], [-46, -22], [-28, -40], [0, -46], [28, -40], [46, -22], [54, 2], [52, 26], [34, 38], [0, 42], [-34, 38]]);
  S.part(g, shell, SHELLD, { x:0, y:0, r:52 }, { mat:'stone', hx:-24, hy:-26, lw:2.2 });
  g.save(); shell(g); g.clip();
  for (const [x, y, r, ry] of [[-27, -12, 12, 10.5], [27, -12, 12, 10.5], [-29, 14, 12, 10.5], [29, 14, 12, 10.5], [0, -22, 13, 11], [0, 4, 15, 13], [0, 27, 11, 7]]) scute(g, x, y, r, ry);
  const keel = SM([[-5, -46], [5, -46], [7, -20], [6, 6], [5, 30], [-5, 30], [-6, 6], [-7, -20]], .7);
  S.part(g, keel, KEEL, { x:0, y:-8, r:36 }, { flat:true, mat:'stone', noEdge:true });
  S.ln(g, [[5, -44], [6, 28]], SHELLD, 1.6, .6); S.ln(g, [[-4, -44], [-5, 28]], { deep:'#ffffff' }, 1, .35);
  for (const y of [-22, 4, 27]) S.part(g, E(0, y, 6, 5), KEEL, { x:0, y, r:6 }, { flat:true, mat:'stone' });
  // rim band of marginal scutes
  const rim = SM([[-58, 24], [-30, 30], [0, 32], [30, 30], [58, 24], [58, 52], [-58, 52]], .8);
  S.part(g, rim, SHELLR, { x:0, y:38, r:56 }, { flat:true, mat:'stone', lw:1.6 });
  for (const x of [-40, -27, -14, 0, 14, 27, 40]) S.ln(g, [[x, 30 - Math.abs(x) * .04], [x * 1.04, 44]], SHELLD, 1.6, .55);
  for (const [x, y, r] of [[-44, 24, 6], [30, 36, 5], [-12, 40, 4.5], [50, 18, 4]]) S.part(g, E(x, y, r, r * .65), MOSS, { x, y, r }, { flat:true, noEdge:true, mat:'moss' });
  g.restore(); S.stroke(g, shell, SHELLD, 2.2, .9);
  barnacle(g, -47, 30, 4); barnacle(g, 40, 34, 3.5); barnacle(g, 14, 40, 3); barnacle(g, -20, 40, 2.6); barnacle(g, 52, 12, 3);
  starfish(g, 34, -28, 5);
  wet(g, shell, { x:0, y:0, r:52 }, [[-46, 20, 6], [48, 24, 5]]); kelp(g, -30, 40, 2, 12);
  g.restore();
}

// ---------- Twin Tides: an armoured sea serpent rearing out of the sea row ----------
// F is the form: TT1 (level 10) or TT2 (level 20: bigger, darker, more spikes, torn fins, cracked glowing plates).
const TT1 = { body:pal('#1f5d68'), dark:pal('#143f48'), plate:pal('#2c7682'), fin:pal('#1b636c'), belly:pal('#6c9890'), horn:pal('#cfd4c4'), eye:'#5ee6ec', glow:11, crack:0, spikes:4, scale:1 },
  TT2 = { body:pal('#163c48'), dark:pal('#0e2a32'), plate:pal('#1e5460'), fin:pal('#0f3d46'), belly:pal('#45696a'), horn:pal('#b9bfb0'), eye:'#8afcff', glow:18, crack:1, spikes:6, scale:1.12 };
function crSample(pts, n){ const out = [], m = pts.length; for (let i = 0; i < m - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, m - 1)]; for (let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[m - 1]); return out; }
/** A tapered ribbon along a spline: returns { path, left, right, centre }. */
function ribbon(pts, wf, n = 6){ const c = crSample(pts, n), L = [], R = []; for (let i = 0; i < c.length; i++){ const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = wf(i / (c.length - 1)); L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); } const poly = [...L, ...R.slice().reverse()]; poly[0][2] = 1; poly[L.length - 1][2] = 1; poly[L.length][2] = 1; poly[poly.length - 1][2] = 1; return { path:SM(poly, .5), left:L, right:R, centre:c }; }
function serpentHead(g, F, jaw, spray){
  const C = F.body, J = jaw * 18, big = F.crack ? 8 : 0;
  // horns curving back from the brow (the full form grows a second, smaller pair)
  for (const s of [-1, 1]){ const h = SM([[s * 18, -22], [s * 30, -36], [s * 42, -52 - big], [s * 45, -46 - big], [s * 36, -32], [s * 26, -18]], .8); S.part(g, h, F.horn, { x:s * 32, y:-36, r:16 }, { mat:'horn', hx:s * 30 - 4, hy:-40 }); if (F.crack) spike(g, s * 27, -14, s * .75 - Math.PI / 2, 14, 3, F.horn); }
  // spiked crest running back over the skull
  for (let i = 0; i < F.spikes; i++){ const t = (i + .5) / F.spikes, x = -18 + t * 36, len = 14 + Math.sin(t * Math.PI) * 12; spike(g, x, -26, -Math.PI / 2 + (x / 18) * .4, len, 3.2, F.fin); }
  // torn cheek fins
  for (const s of [-1, 1]){ const fin = SM([[s * 26, -6], [s * 44, -18], [s * 50, -10, 1], [s * 58, -14, 1], [s * 55, -2, 1], [s * 60, 4, 1], [s * 52, 10, 1], [s * 48, 20, 1], [s * 26, 16]], .7); S.part(g, fin, F.fin, { x:s * 42, y:2, r:16 }, { flat:true, mat:'scaly' }); for (const a of [-.5, -.1, .3]) S.ln(g, [[s * 28, 4], [s * 28 + Math.cos(a) * s * 26, 2 + Math.sin(a) * 22]], F.dark, 1.2, .5); }
  // the head: broad and flat under a heavy brow ridge
  const head = SM([[-34, -6], [-36, 8], [-30, 16], [-24, 20], [0, 24], [24, 20], [30, 16], [36, 8], [34, -6], [24, -24], [0, -30], [-24, -24]]);
  S.part(g, head, C, { x:0, y:-4, r:34 }, { mat:'scaly', hx:-14, hy:-18 });
  const brow = SM([[-34, -8], [-22, -18], [0, -22], [22, -18], [34, -8], [26, -4], [0, -8], [-26, -4]], .8); S.part(g, brow, F.plate, { x:0, y:-12, r:34 }, { flat:true, mat:'stone', lw:1.4 });
  barnacle(g, -26, -12, 3.5); barnacle(g, 22, -14, 3); barnacle(g, -30, 6, 2.6);
  if (F.crack) cracks(g, head, [[[-20, -20], [-12, -10], [-16, 2]], [[14, -22], [22, -10], [18, 0]], [[-4, -28], [2, -20]]], F.eye);
  wet(g, head, { x:0, y:-4, r:34 }, [[-34, 12, 6], [33, 10, 5]]);
  // narrow glowing eyes under the brow
  for (const s of [-1, 1]){ const sock = SM([[s * 6, -6], [s * 26, -12], [s * 31, -3], [s * 24, 2], [s * 8, 0]], .6); S.dot(g, sock, '#06161a');
    g.save(); g.shadowColor = F.eye; g.shadowBlur = F.glow; g.fillStyle = F.eye; ell(g, s * 18, -5, 8, 2.6, -s * .22); g.fill(); g.restore(); S.dot(g, E(s * 18, -5, 1.4, 2.6, -s * .22), '#06161a', .9); S.dot(g, E(s * 15, -6.5, 1.2, .8), '#fff', .8); }
  for (const s of [-1, 1]) S.dot(g, E(s * 7, 8, 2.2, 1.4, s * .4), F.dark.deep, .85);   // nostrils
  // the long jaw: chin plate dropping with J, dark cavity, fangs above and below
  const lip = x => 14 + (1 - (x / 30) ** 2) * 8;
  const chin = SM([[-30, lip(-30) + J], [-31, 20 + J], [-18, 30 + J], [0, 33 + J], [18, 30 + J], [31, 20 + J], [30, lip(30) + J], [15, lip(15) + J], [0, lip(0) + J], [-15, lip(-15) + J]], .7);
  S.part(g, chin, C, { x:0, y:24 + J, r:30 }, { mat:'scaly', hx:-14, hy:22 + J });
  const cav = SM([[-30, lip(-30)], [-15, lip(-15)], [0, lip(0)], [15, lip(15)], [30, lip(30)], [30, lip(30) + 2 + J * .6, 1], [15, lip(15) + 3 + J, 1], [0, lip(0) + 3 + J, 1], [-15, lip(-15) + 3 + J, 1], [-30, lip(-30) + 2 + J * .6, 1]], .6); S.dot(g, cav, '#0b2228');
  if (jaw > .3) S.dot(g, E(0, lip(0) + 2 + J * .7, 10, 2 + J * .25), '#b03a4a', .8);
  for (const [x, len] of [[-24, 9], [-14, 6], [-6, 5], [6, 5], [14, 6], [24, 9]]) S.dot(g, PL([[x - 2.2, lip(x) - 1], [x + 2.2, lip(x) - 1], [x + .4, lip(x) + len]]), TOOTH);
  for (const [x, len] of [[-19, 6], [-9, 4], [0, 4], [9, 4], [19, 6]]){ const y = lip(x) + 3 + J * (x === 0 ? 1 : .9); S.dot(g, PL([[x - 2, y + 1], [x + 2, y + 1], [x - .3, y - len]]), TOOTH); }
  S.stroke(g, SO([[-30, lip(-30)], [-15, lip(-15)], [0, lip(0)], [15, lip(15)], [30, lip(30)]]), F.dark, 1.6, .85);
  if (spray > 0) splash(g, 0, lip(0) + J, spray, 11, 9, 30);
}
function twintides(g, P = {}){
  const F = P.variant === 'form2' ? TT2 : TT1, WL = 50, idle = P.idle, bolt = P.bolt, col = P.collapse ?? 0;
  const sway = idle == null ? 0 : Math.sin(idle * TAU), breathe = idle == null ? 0 : Math.cos(idle * TAU);
  let rear = 0, lunge = 0, jaw = .12, spray = 0;
  if (bolt != null){ if (bolt < .4){ rear = bolt / .4; jaw = .12 + rear * .4; } else if (bolt < .6){ const k = (bolt - .4) / .2; rear = 1 - k; lunge = k; jaw = .5 + k * .5; spray = k * .6; } else { const k = (bolt - .6) / .4; lunge = 1 - k; jaw = 1 - k * .88; spray = .6 + k * .4; } }
  const sink = col * 210, ph = idle ?? bolt ?? col;
  water(g, 0, WL + 2, 78, 15, ph * .9, .7);
  aboveWater(g, WL, () => {
    g.translate(0, WL); g.scale(F.scale, F.scale); g.translate(0, -WL + sink);
    // a coil of the body breaking the surface to the right: plated, spined, barnacled
    const coil = SM([[16, WL + 8], [22, 30 + breathe * 2], [42, 14 + breathe * 3], [64, 20 + breathe * 2], [76, WL + 8]], .8);
    for (const [x, y] of F.crack ? [[28, 26], [36, 19], [44, 14], [52, 15], [60, 20]] : [[30, 24], [42, 15], [54, 17]]) spike(g, x, y + breathe * 2, -Math.PI / 2 + (x - 42) * .03, 15, 4, F.fin);
    S.part(g, coil, F.body, { x:46, y:32, r:28 }, { mat:'scaly', hx:34, hy:20 });
    g.save(); coil(g); g.clip(); for (const x of [28, 40, 52, 64]) S.ln(g, [[x, 0], [x - 4, 60]], F.dark, 2.2, .6); if (F.crack) cracks(g, coil, [[[34, 26], [40, 34], [36, 44]], [[56, 24], [60, 36]]], F.eye); g.restore();
    S.part(g, SM([[26, WL + 8], [30, 36 + breathe * 2], [44, 28 + breathe * 3], [58, 32 + breathe * 2], [64, WL + 8]], .8), F.belly, { x:46, y:40, r:18 }, { flat:true, noEdge:true, mat:'scaly' });
    barnacle(g, 62, 30, 3); barnacle(g, 34, 36, 2.6);
    // the neck: a thick tapered ribbon rising from the water
    const hb = [10 - rear * 22 + lunge * 18 + sway * 3, -66 - rear * 8 + lunge * 14], mid = [-40 + sway * 6 - rear * 6, 2 + breathe * 2], mid2 = [-2 + sway * 4 - rear * 10 + lunge * 6, -34 - rear * 4 + lunge * 6];
    const spine = [[-8, WL + 12], [-30 + sway * 3, 32], mid, mid2, hb];
    const rb = ribbon(spine, t => 27 - t * 8, 6);
    // dorsal spines with a torn membrane along the outer edge
    for (let i = 3; i < rb.left.length - 3; i += 2){ const a = rb.left[i], b = rb.left[i + 2], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = dy / l, ny = -dx / l, ang = Math.atan2(ny, nx) + .25;
      S.part(g, PL([a, b, [mx + nx * 9 + dx / l * 5, my + ny * 9 + dy / l * 5]]), F.fin, { x:mx + nx * 4, y:my + ny * 4, r:7 }, { flat:true, mat:'scaly', lw:1.2 });
      spike(g, mx + nx * 2, my + ny * 2, ang, F.crack ? 22 : 17, 3.4, F.fin); if (F.crack) spike(g, a[0] + nx * 2, a[1] + ny * 2, ang - .3, 11, 2.2, F.fin); }
    S.part(g, rb.path, F.body, { x:-14, y:-10, r:64 }, { mat:'scaly', flat:true }); S.dot(g, E(-30, -22, 5, 2.4, -.9), '#fff', .45);
    // armour plates banded across the neck, barnacles along the inner edge
    g.save(); rb.path(g); g.clip();
    for (let i = 1; i < rb.centre.length - 2; i += 2){ const a = rb.left[i], b = rb.right[i], a2 = rb.left[i + 2], b2 = rb.right[i + 2], cx = (a[0] + b[0] + a2[0] + b2[0]) / 4, cy = (a[1] + b[1] + a2[1] + b2[1]) / 4;
      if (i % 4 === 1) S.part(g, PL([a, a2, b2, b]), F.plate, { x:cx, y:cy, r:24 }, { flat:true, noEdge:true, mat:'scaly' }); S.ln(g, [a, b], F.dark, 2.2, .7); S.ln(g, [[a[0] + (b[0] - a[0]) * .1, a[1] + (b[1] - a[1]) * .1 + 1.5], [b[0] - (b[0] - a[0]) * .1, b[1] - (b[1] - a[1]) * .1 + 1.5]], { deep:'#ffffff' }, 1, .22); }
    if (F.crack) cracks(g, rb.path, [[rb.centre[5], [rb.centre[6][0] + 6, rb.centre[6][1]], rb.centre[8]], [[rb.centre[12][0] - 5, rb.centre[12][1]], rb.centre[14], [rb.centre[15][0] + 4, rb.centre[15][1]]], [rb.centre[19], [rb.centre[20][0] + 5, rb.centre[20][1] - 2]]], F.eye);
    g.restore();
    for (const i of [4, 10, 16]){ const p = rb.right[i], c = rb.centre[i]; barnacle(g, p[0] + (c[0] - p[0]) * .2, p[1] + (c[1] - p[1]) * .2, 3); }
    const belly = ribbon(spine, t => 9 - t * 3, 6); S.part(g, belly.path, F.belly, { x:-14, y:-10, r:64 }, { flat:true, noEdge:true, mat:'scaly' });
    g.save(); belly.path(g); g.clip(); for (let i = 2; i < belly.centre.length - 2; i += 2){ const c = belly.centre[i]; S.ln(g, [[c[0] - 9, c[1]], [c[0] + 9, c[1]]], F.dark, 1.2, .4); } g.restore();
    S.contact(g, coil, 22, 36, 14, 10, .35);
    // the head, facing the player, rearing back or lunging forward
    g.save(); g.translate(hb[0], hb[1] - 14); g.rotate(-rear * .3 + lunge * .35 + sway * .04); g.scale(1 + lunge * .1, 1 + lunge * .1); serpentHead(g, F, jaw, spray); g.restore();
    S.contact(g, rb.path, hb[0], hb[1] - 4, 22, 8, .35);
  });
  water(g, 0, WL + 2, 78, 15, ph * .9 + .5, .55);
  // foam churning where the serpent breaks the surface
  foam(g, -6 * F.scale, WL + 4, 30 * F.scale, 7, ph, 12, 3); foam(g, 46 * F.scale, WL + 4, 28 * F.scale, 6, ph + .3, 10, 5);
  if (col > 0){ splash(g, 0, WL, Math.min(1, col * 1.6), 13, 14, 60); splash(g, 40, WL, Math.max(0, col * 1.8 - .5), 17, 10, 40);
    if (col > .6){ const R = rng(21); for (let i = 0; i < 6; i++){ const x = -40 + R() * 80, y = WL - 4 - (col - .6) * 40 * R(), r = 2 + R() * 2.5; g.strokeStyle = 'rgba(230,250,255,.7)'; g.lineWidth = 1; ell(g, x, y, r, r); g.stroke(); } } }
}

// ---------- registry ----------
// scale/dy fit the drawing to the in-game footprint (feet or waterline at about r × 0.95 below the monster's centre).
// box is the frame in drawing units; clips are baked by anim.js: n frames at fps; `once` clips play a single time.
const WALK8 = { n:8, fps:9, pose:t => ({ walk:t }) }, CHEW4 = { n:4, fps:8, pose:t => ({ chew:t }) };
export const W5 = {
  crawler: { draw:crawler, scale:.6, dy:-11, box:{ x:-62, y:-46, w:124, h:104 },
    clips:{ walk:{ n:8, fps:10, pose:t => ({ walk:t }) }, chew:CHEW4, rise:{ n:6, fps:10, once:true, pose:t => ({ rise:t }) } }, still:{},
    frame(m, clips){ if (m.puddle && m.age < 0.6){ const n = clips.rise.n; return ['rise', Math.min(n - 1, Math.floor(m.age / 0.6 * n))]; } return null; } },
  sailor: { draw:sailor, scale:.62, dy:-11, box:{ x:-62, y:-84, w:132, h:138 },
    clips:{ walk:{ n:8, fps:8, pose:t => ({ walk:t }) }, chew:CHEW4 }, still:{},
    // its lurch (0.3–1.7) speeds or slows the stagger; frozen and eating fall back to the default logic
    frame(m, clips){ if (m.eating || m.frozenT > 0) return null; const cl = clips.walk, rate = (m.slowT > 0 ? 0.5 : 1) * (0.55 + (m.lurch || 1) * 0.45); return ['walk', Math.floor(m.ph * cl.fps * rate) % cl.n]; } },
  diver: { draw:diver, scale:.6, dy:-11, box:{ x:-70, y:-66, w:140, h:124 },
    clips:{ walk:{ n:8, fps:10, pose:t => ({ walk:t }) }, chew:CHEW4, idle:{ n:4, fps:6, pose:t => ({ idle:t }) }, hidden:{ n:1, fps:1, pose:() => ({ hidden:true }) },
      surface:{ n:6, fps:14, once:true, pose:t => ({ surface:t }) }, throw:{ n:6, fps:12, once:true, pose:t => ({ throw:t }) }, down:{ n:4, fps:12, once:true, pose:t => ({ down:t }) } }, still:{ idle:0 },
    // puddle divers: hidden → surface (first 0.4 s up) → throw (next 0.5 s) → idle bob → down (last 0.35 s); walkers use the default walk/chew
    frame(m, clips){
      if (m.walker || !m.puddle) return null;
      if (m.hidden) return ['hidden', 0];
      const up = 2.5, el = up - m.upT;   // TYPES.diver.up: seconds it stays surfaced
      if (el < 0.4){ const n = clips.surface.n; return ['surface', Math.min(n - 1, Math.floor(el / 0.4 * n))]; }
      if (el < 0.9){ const n = clips.throw.n; return ['throw', Math.min(n - 1, Math.floor((el - 0.4) / 0.5 * n))]; }
      if (m.upT < 0.35){ const n = clips.down.n; return ['down', Math.min(n - 1, Math.floor((1 - m.upT / 0.35) * n))]; }
      const cl = clips.idle; return ['idle', Math.floor(m.ph * cl.fps) % cl.n];
    } },
  slime: { draw:slime, scale:.64, dy:-11, box:{ x:-50, y:-42, w:100, h:100 }, clips:{ walk:WALK8, chew:CHEW4 }, still:{} },
  blob:  { draw:blob, scale:.5, dy:-13, box:{ x:-32, y:-4, w:64, h:60 }, clips:{ walk:{ n:8, fps:12, pose:t => ({ walk:t }) }, chew:CHEW4 }, still:{} },
  turtle: { draw:turtle, scale:.66, dy:-8, box:{ x:-68, y:-72, w:136, h:130 }, clips:{ walk:{ n:8, fps:6, pose:t => ({ walk:t }) }, chew:{ n:4, fps:6, pose:t => ({ chew:t }) } }, still:{} },
  twintides: { draw:twintides, scale:.62, dy:-1, box:{ x:-110, y:-186, w:220, h:256 }, variants:{ form2:true },
    clips:{ walk:{ n:8, fps:6, pose:t => ({ idle:t }) }, bolt:{ n:8, fps:14, once:true, pose:t => ({ bolt:t }) }, collapse:{ n:6, fps:12, once:true, pose:t => ({ collapse:t }) } }, still:{ idle:.25 },
    // `collapse` (named so the engine does not squash the sprite flat while m.rise > 0) plays forward when a twin is felled,
    // holds on its last frame while down, and runs backwards in the last 0.4 s of m.rise and as the twins first rise on spawn.
    frame(m, clips){
      const cl = clips.collapse, n = cl.n, d = n / cl.fps;
      if (m.rise > 0){
        if (m.anim && m.anim.clip === 'collapse') return ['collapse', Math.min(n - 1, Math.floor(m.anim.t / m.anim.dur * n))];
        const win = m.form === 2 ? 5 : 8, el = win - m.rise;   // TYPES.twintides.window / form2.window (until the engine sets m.anim on the kill)
        if (el < d) return ['collapse', Math.min(n - 1, Math.floor(el / d * n))];
        if (m.rise < 0.4) return ['collapse', Math.max(0, Math.min(n - 1, Math.floor(m.rise / 0.4 * n)))];
        return ['collapse', n - 1];
      }
      if (!m.demo && m.age < 0.5) return ['collapse', Math.max(0, Math.min(n - 1, Math.floor((1 - m.age / 0.5) * n)))];
      return null;
    } },
};
