// ---------- World 2 (Foggy Hollow) characters, Toy Plastic style ----------
// Wisp, Wraith, Wisp Rider, Plague Doctor, Fogwalker and the Poltergeist (boss). Drawn around (0,0) in drawing units
// with the feet (or the bottom of the mist) near y = 50; the registry at the end fits each one to its in-game footprint.
// Auras, heal zones and fog bands are drawn by the engine; only the characters live here.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';

// numbers mirrored from src/data/monsters.js TYPES (this module may only import the painter): keep in step
const WRAITH_SHOW = 4, DOCTOR_HEAL_EVERY = 2;

const WISP = pal('#a9dcf0'), WISPCORE = pal('#f6fdff'), WISPD = pal('#6aa8c8'),
  CLOAK = pal('#93a6bd'), CLOAKIN = pal('#56667f'), BONE = pal('#dfe2ec'),
  GOB = pal('#c9584a'), GOBB = pal('#f0b08a'), CAP = pal('#6b4a2e'), STRAP = pal('#4a3320'),
  COAT = pal('#3f4136'), COATD = pal('#2a2b22'), HAT = pal('#26261f'), MASK = pal('#d8cfa8'), BEAK = pal('#a8804a'), LENS = pal('#3a4a2a'), SATCH = pal('#6a8a3a'), BRASS = pal('#c09a3a'), GLOVE = pal('#5a4a3a'),
  FOGR = pal('#7a8a9a'), FOGRD = pal('#4f5c6c'), POLE = pal('#4a3020'), LAMP = pal('#5b4b3a'), LAMPG = pal('#dcefff'),
  GHOST = pal('#dfe9f5');
const CYAN = '#7ff9ff', CYAN2 = '#bfefff', PAINT = ['#5fbf3a', '#f2c230', '#8a4ad0', '#e85a3a', '#3aa0e0', '#f070a8'];

// ---------- helpers ----------
/** A soft puff of mist: translucent gradient ball with a faint rim. */
function puff(g, x, y, r, a = .7, col = '#e6f4fb'){
  const gr = g.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r); gr.addColorStop(0, rgba('#ffffff', a)); gr.addColorStop(.55, rgba(col, a * .75)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; ell(g, x, y, r, r * .9); g.fill();
}
/** Streaks of mist rising from a point (used by fades and the fogwalker's lantern). */
function streaks(g, x, y, t, n, seed, up = 40){
  const R = rng(seed);
  for (let i = 0; i < n; i++){ const ox = (R() - .5) * 40, sp = 12 + R() * 22, r = 4 + R() * 6, ph = R(); const k = (t + ph) % 1, yy = y - k * up - R() * 10, a = (1 - k) * .55 * Math.min(1, t * 3 + .2);
    puff(g, x + ox + Math.sin((t + ph) * 8) * 5, yy, r * (1 + k * .8), a); }
}
/** Hooded void face: dark cave with two glowing eyes. */
function voidFace(g, cave, ex, ey, r, col, flare = 0){
  S.dot(g, cave, '#0d1420');
  g.save(); cave(g); g.clip(); const gr = g.createRadialGradient(0, ey, 2, 0, ey, 26); gr.addColorStop(0, rgba(col, .25 + flare * .4)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(-40, ey - 40, 80, 80); g.restore();
  S.glow(g, -ex, ey, r + flare, col); S.glow(g, ex, ey, r + flare, col);
}
/** Bony hand: a palm and three thin finger tubes pointing in direction `dir`. */
function bonyHand(g, x, y, c, dir, len = 9){
  for (let i = -1; i <= 1; i++){ const a = dir + i * .42; S.tube(g, SO([[x, y], [x + Math.cos(a) * len * .6, y + Math.sin(a) * len * .6], [x + Math.cos(a + i * .3) * len, y + Math.sin(a + i * .3) * len]]), c, 2.6); }
  S.part(g, E(x, y, 5.5, 5), c, { x, y, r:5.5 }, { flat:true, mat:'bone' });
}
/** Tattered hem points: alternating low and high sharp corners between x1 and x2, waving with `ph`. */
function tatters(x1, x2, y, n, ph, depth = 10){
  const pts = []; for (let i = 0; i <= n; i++){ const t = i / n, x = x1 + (x2 - x1) * t, low = i % 2 === 0; pts.push([x, y + (low ? Math.sin(ph + i * 1.3) * 3 : -depth + Math.sin(ph + i) * 2), 1]); } return pts;
}
/** Hovering flame body of a wisp (also the rider's mount): a teardrop with a main tongue and a side lick, lit from a white core. tip flicker `fl`, phase `ph`. */
function flameBody(g, fl, ph, sx = 1, sy = 1, lean = 0){
  g.save(); g.scale(sx, sy); g.rotate(lean * .35);
  const body = SM([[-24, 14], [-28, -10], [-24, -32], [-26 - fl * .5, -50], [-14, -40], [-6, -50], [-2 + fl, -66], [8 + fl * 1.4, -80], [10 + fl * .6, -58], [20, -40], [28, -14], [24, 12], [8, 28], [-10, 28]], .8);
  g.save(); g.shadowColor = 'rgba(160,225,245,.95)'; g.shadowBlur = 16; S.part(g, body, WISP, { x:0, y:-22, r:46 }, { hx:-12, hy:-30 }); g.restore();
  g.save(); body(g); g.clip();
  let gr = g.createLinearGradient(0, 20, 0, -80); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.55, 'rgba(230,248,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,.85)'); g.fillStyle = gr; g.fillRect(-40, -90, 80, 130);   // the tip burns brightest
  gr = g.createRadialGradient(0, -6, 2, 0, -6, 30); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-40, -90, 80, 130); g.restore();
  const inner = SM([[-9, 4], [-12, -16], [-6, -34], [0 + fl * .7, -50], [5 + fl, -64], [8, -36], [13, -14], [9, 6]], .85);
  g.save(); g.shadowColor = '#ffffff'; g.shadowBlur = 6; S.dot(g, inner, WISPCORE.base, .92); g.restore();
  g.save(); inner(g); g.clip(); gr = g.createRadialGradient(-4, -10, 1, 0, -14, 22); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(210,240,255,0)'); g.fillStyle = gr; g.fillRect(-30, -80, 60, 100); g.restore();
  S.dot(g, SM([[-24, -34], [-24 - fl * .4, -46], [-17, -40], [-14, -32]], .8), WISPCORE.base, .8);
  g.restore();
  return body;
}

// ---------- Wisp ----------
export function wisp(g, P = {}){
  const w = P.walk, ch = P.chew, lean = P.lean ?? 0, ph = (w ?? ch ?? 0) * TAU;
  const bob = w != null ? Math.sin(ph) * 4 : ch != null ? Math.sin(ph) * 1.5 : 0, fl = Math.sin(ph * 2) * 5, press = ch == null ? 0 : .5 + .5 * Math.sin(ph);
  S.shadow(g, 0, 50, 16 - press * 3, 3.5);
  for (let i = 0; i < 4; i++){ const t = i / 3, x = Math.sin(ph + i * 1.7) * 6 * (t + .3) - lean * 16 * t, y = 20 + t * 28 + bob * (1 - t), r = 12 - t * 6; puff(g, x, y, r, .8 - t * .5); }
  g.save(); g.translate(0, bob + press * 5);
  flameBody(g, fl, ph, 1.04 + press * .1, .8 - press * .1, lean);
  const jaw = press;
  // wispy arms: hang while it floats, reach forward and press when it chews
  // (shoulders sit on the lower body, well below the face: owner, 2026-09-26)
  for (const s of [-1, 1]){ const ax = s * (28 - jaw * 2), ay = 18 + jaw * 6, bx = s * (27 - jaw * 9), by = 27 + jaw * 12; S.tube(g, SO([[s * 19, 9], [ax, ay], [bx, by]]), WISP, 6.5); S.hand(g, bx + s * 1.5, by + 3, WISP, Math.PI / 2 + s * .4 - jaw * .6 * s, 3, 5.5); }
  // impish face
  S.eye(g, -9, -14, 7.5, 8, { lx:.2, ly:.15, pr:.42, iris:'#3ab0c8' }); S.eye(g, 9, -14, 7.5, 8, { lx:.2, ly:.15, pr:.42, iris:'#3ab0c8' });
  S.ln(g, [[-15, -25], [-6, -22]], WISPD, 1.8, .7); S.ln(g, [[15, -25], [6, -22]], WISPD, 1.8, .7);
  S.dot(g, SM([[-9, -2], [-4, 3 + jaw * 4], [0, 4 + jaw * 6], [4, 3 + jaw * 4], [9, -2], [0, 0]], .9), '#1c3a48');
  S.dot(g, PL([[-7, -1.5], [-3, -1.5], [-5, 4]]), '#fff'); S.dot(g, PL([[3, -1.5], [7, -1.5], [5, 4]]), '#fff');
  S.blush(g, 0, -6, .7);
  g.restore();
}

// ---------- Wraith ----------
export function wraith(g, P = {}){
  const w = P.walk, ch = P.chew, fade = P.fade ?? 0, ph = (w ?? ch ?? 0) * TAU;
  const bob = w != null ? Math.sin(ph) * 3 : ch != null ? Math.sin(ph) * 2 : 0, sway = w != null ? Math.sin(ph) * .05 : 0, press = ch == null ? 0 : .5 + .5 * Math.sin(ph);
  if (fade > 0){ streaks(g, 0, 20, fade, 12, 17, 70); if (fade >= 1) return; g.save(); g.globalAlpha *= 1 - fade; g.translate(0, -fade * 18); g.scale(1 - fade * .35, 1 + fade * .15); }
  S.shadow(g, 0, 50, 26, 5);
  g.save(); g.translate(0, bob + press * 3); g.rotate(sway);
  const hem = tatters(-30, 30, 44, 6, ph, 11);
  const cloak = SM([[0, -26], [-22, -18], [-33, 0], [-32, 20], [-31, 36], ...hem, [31, 36], [32, 20], [33, 0], [22, -18]], .8);
  S.part(g, cloak, CLOAK, { x:0, y:12, r:40 }, { mat:'cloth', hx:-16, hy:-8 });
  S.crease(g, SO([[-18, 0], [-22, 20], [-20, 40]]), CLOAK, 2, .4); S.crease(g, SO([[16, 2], [20, 20], [18, 40]]), CLOAK, 2, .4); S.crease(g, SO([[-4, 12], [-6, 28], [-4, 42]]), CLOAK, 1.6, .3);
  for (const [x, y] of hem.filter((p, i) => i % 2 === 0)) S.thread(g, x, y, x < 0 ? -1 : 1, CLOAK);
  // sleeves and bony hands: hang at the sides, reach down and grab when it chews
  for (const s of [-1, 1]){ const k = press, ex = s * (34 - k * 6), ey = 30 + k * 12; g.save(); g.translate(s * 30, -2); g.rotate(s * (-.15 + k * .35)); g.translate(-s * 30, 2);
    const sleeve = SM([[s * 26, -8], [s * 44, 10], [s * 40, 30], [s * 24, 26]], .7); S.part(g, sleeve, CLOAK, { x:s * 35, y:10, r:16 }, { flat:true, mat:'cloth' }); S.contact(g, cloak, s * 28, -2, 10, 8, .35);
    bonyHand(g, ex, ey, BONE, Math.PI / 2 + s * .3, 9); g.restore(); }
  // hood: a big peaked cowl that flops back, with a deep opening and a shadowed lining
  const hood = SM([[6, -62], [-8, -54], [-20, -44], [-30, -28], [-32, -8], [-24, 4], [0, 8], [24, 4], [32, -8], [30, -28], [22, -46], [14, -56]], .85); S.part(g, hood, CLOAK, { x:0, y:-22, r:34 }, { mat:'cloth', hx:-14, hy:-40 });
  S.crease(g, SO([[8, -58], [2, -44], [-4, -34]]), CLOAK, 1.8, .4);
  S.contact(g, cloak, 0, 6, 26, 8, .45);
  const cave = SM([[-20, -8], [-17, -26], [0, -34], [17, -26], [20, -8], [13, 2], [0, 5], [-13, 2]], .9);
  S.part(g, SM([[-23, -8], [-20, -29], [0, -38], [20, -29], [23, -8], [15, 4], [0, 8], [-15, 4]], .9), CLOAKIN, { x:0, y:-14, r:24 }, { flat:true, mat:'cloth', noEdge:true });
  voidFace(g, cave, 8, -15, 3.6, CYAN2, press * 1.2);
  g.restore();
  if (fade > 0) g.restore();
}

// ---------- Wisp Rider ----------
export function rider(g, P = {}){
  const w = P.walk, ch = P.chew, ride = P.ride, ph = (w ?? ch ?? ride ?? 0) * TAU, riding = ride != null;
  const bob = riding ? Math.sin(ph) * 3 : w != null ? -Math.abs(Math.sin(ph)) * 2.5 : ch != null ? Math.sin(ph) * 2 : 0, jaw = ch == null ? 0 : Math.abs(Math.sin(ph)), lift = riding ? -22 : 0;
  S.shadow(g, 0, 52, riding ? 18 : 22, riding ? 3.5 : 5);
  if (riding){   // the mount: a wisp under the goblin, its flame tip streaming up behind him and mist trailing off it
    for (let i = 0; i < 4; i++){ const t = i / 3; puff(g, -8 + Math.sin(ph * 2 + i) * 4 - 8 * t, -10 - t * 44, 9 - t * 5, .7 - t * .45); }
    g.save(); g.translate(0, 32 + bob * .5); g.scale(.85, .7); g.rotate(Math.sin(ph) * .05);
    const fl = Math.sin(ph * 2) * 6 - 10, body = flameBody(g, fl, ph, 1, 1, -.15);
    S.eye(g, -8, 2, 5.5, 6, { lx:.2, ly:.1, pr:.45, iris:'#3ab0c8' }); S.eye(g, 8, 2, 5.5, 6, { lx:.2, ly:.1, pr:.45, iris:'#3ab0c8' });
    S.dot(g, SM([[-7, 12], [0, 16 + Math.abs(Math.sin(ph)) * 3], [7, 12], [0, 11]], .9), '#1c3a48'); S.dot(g, PL([[-5, 12], [-2, 12], [-3.5, 15]]), '#fff'); S.dot(g, PL([[2, 12], [5, 12], [3.5, 15]]), '#fff');
    g.restore();
  }
  g.save(); g.translate(0, lift);
  // legs: straddle the mount's shoulders, or walk on their own once it is broken
  for (const s of [-1, 1]){ const p = w == null ? 0 : ph + (s < 0 ? 0 : Math.PI), dx = w == null ? 0 : Math.cos(p) * 4, dy = w == null ? 0 : -Math.max(0, Math.sin(p)) * 5;
    const kx = riding ? s * 22 : s * 9 + dx, ky = riding ? 36 : 38 + dy, fx = riding ? s * 27 : s * 10 + dx, fy = riding ? 46 : 48 + dy;
    S.tube(g, SO([[s * 8, 24], [kx, ky], [fx, fy]]), GOB, 6); S.part(g, E(fx + s * 2, fy + 2, 7, 3.8), STRAP, { x:fx, y:fy, r:7 }, { flat:true, mat:'leather' }); }
  g.save(); g.translate(0, bob);
  const body = SM([[-14, 4], [-17, 18], [-9, 30], [9, 30], [17, 18], [14, 4], [0, -2]]); S.part(g, body, GOB, { x:0, y:14, r:17 }, { mat:'skin' });
  S.part(g, SM([[-16, 6], [-17, 18], [-6, 24], [6, 24], [17, 18], [16, 6], [0, 2]], .7), CAP, { x:0, y:14, r:16 }, { flat:true, mat:'leather', noEdge:true }); S.ln(g, [[-12, 14], [12, 14]], STRAP, 2, .8); S.rivet(g, 0, 14, 2, BRASS);
  // arms: grip the mount ahead when riding, swing when walking, reach for the wall when chewing
  for (const s of [-1, 1]){ const sw = w != null ? Math.sin(ph + (s < 0 ? Math.PI : 0)) * .3 : 0; g.save(); g.translate(s * 13, 6); g.rotate(sw * s); g.translate(-s * 13, -6);
    const ex = riding ? s * 16 : s * 20, ey = riding ? 30 : 22 + jaw * 6, hx = riding ? s * 12 : s * 22, hy = riding ? 40 : 30 + jaw * 8;
    S.tube(g, SO([[s * 13, 6], [ex, ey], [hx, hy]]), GOB, 4.5); S.hand(g, hx, hy + 1, GOB, riding ? Math.PI / 2 + s * .5 : Math.PI / 2 - s * .3, 3, 4.2); g.restore(); }
  // head: big ears, leather cap, yellow eyes and a snaggle grin
  const head = SM([[-19, -22], [-21, -8], [-14, 4], [0, 7], [14, 4], [21, -8], [19, -22], [9, -32], [-9, -32]]);
  for (const s of [-1, 1]) S.part(g, SM([[s * 16, -18], [s * 32, -30], [s * 36, -16], [s * 26, -6]], .7), GOB, { x:s * 26, y:-18, r:10 }, { flat:true, mat:'skin' });
  S.part(g, head, GOB, { x:0, y:-12, r:21 }, { mat:'skin' }); S.contact(g, body, 0, 2, 12, 5, .5);
  for (const s of [-1, 1]) S.dot(g, SM([[s * 20, -18], [s * 29, -26], [s * 31, -17], [s * 25, -10]], .7), rgba(GOBB.base, .55));
  S.part(g, SM([[-18, -26], [-12, -38], [4, -44], [16, -38], [20, -26], [0, -22]], .8), CAP, { x:0, y:-32, r:20 }, { mat:'leather' }); S.ln(g, [[-18, -27], [20, -27]], STRAP, 2.2, .9); S.stroke(g, SO([[4, -44], [12, -52], [8, -40]]), CAP, 3, .9);
  S.eye(g, -7, -13, 6.5, 7, { lx:.2, pr:.45, iris:'#e0a020' }); S.eye(g, 7, -13, 6.5, 7, { lx:.2, pr:.45, iris:'#e0a020' });
  S.ln(g, [[-12, -22], [-3, -20]], pal(GOB.dark), 1.8, .7); S.ln(g, [[12, -22], [3, -20]], pal(GOB.dark), 1.8, .7);
  S.dot(g, E(0, -6, 2.6, 1.8), GOB.deep, .8);
  S.dot(g, SM([[-9, 0], [-4, 3 + jaw * 3], [0, 4 + jaw * 4], [4, 3 + jaw * 3], [9, 0], [0, -1]], .9), '#3a1420');
  S.dot(g, PL([[-7, 0], [-3, 0], [-5, 4]]), '#fff'); S.dot(g, PL([[4, 0], [8, 0], [6, 3]]), '#fff');
  S.blush(g, 0, -4, .6);
  g.restore(); g.restore();
}

// ---------- Plague Doctor ----------
export function doctor(g, P = {}){
  const w = P.walk, ch = P.chew, heal = P.heal ?? 0, ph = (w ?? ch ?? 0) * TAU;
  const bob = w != null ? -Math.abs(Math.sin(ph)) * 2 : ch != null ? Math.sin(ph) * 2 : 0, peck = ch == null ? 0 : .5 + .5 * Math.sin(ph), stoop = .12 + (w != null ? Math.sin(ph) * .03 : 0) + peck * .12;
  const raise = Math.sin(Math.min(1, heal) * Math.PI);   // the censer swings up and back down during a heal
  S.shadow(g, 0, 52, 32, 6);
  // shoes
  for (const s of [-1, 1]){ const p = w == null ? 0 : ph + (s < 0 ? 0 : Math.PI), dx = w == null ? 0 : Math.cos(p) * 3, dy = w == null ? 0 : -Math.max(0, Math.sin(p)) * 3; S.part(g, SM([[s * 6 + dx, 44 + dy], [s * 20 + dx, 44 + dy], [s * 22 + dx, 51 + dy], [s * 4 + dx, 51 + dy]], .6), GLOVE, { x:s * 13 + dx, y:48 + dy, r:9 }, { flat:true, mat:'leather' }); }
  g.save(); g.translate(0, bob);
  // long coat with a swinging hem, stooped forward (shoulders hunched up)
  const swing = w != null ? Math.sin(ph) * 3 : 0;
  const coat = SM([[-12, -30], [-30, -14], [-32, 12], [-30 + swing, 46], [-10 + swing, 49], [0, 47], [12 + swing, 49], [30 + swing, 46], [32, 12], [30, -14], [12, -30]], .8);
  S.part(g, coat, COAT, { x:0, y:8, r:42 }, { mat:'leather', hx:-16, hy:-14 });
  S.crease(g, SO([[-20, -6], [-22, 16], [-20 + swing, 44]]), COAT, 2, .45); S.crease(g, SO([[18, -8], [22, 14], [20 + swing, 44]]), COAT, 2, .45);
  S.ln(g, [[0, -24], [1, 46]], COATD, 1.6, .7); for (const y of [-14, -2, 10, 22]) S.rivet(g, 1, y, 2, BRASS);
  // belt and satchel
  S.part(g, RR(-31, 4, 62, 7, 2), STRAP, { x:0, y:8, r:31 }, { flat:true, mat:'leather' }); S.rivet(g, 0, 7.5, 2.6, BRASS);
  S.tube(g, SO([[-22, -20], [22, 20]]), STRAP, 3.5);
  S.part(g, RR(14, 12, 20, 16, 4), SATCH, { x:24, y:20, r:12 }, { mat:'leather' }); S.part(g, RR(14, 10, 20, 7, 3), pal(SATCH.dark), { x:24, y:13, r:10 }, { flat:true, mat:'leather' }); S.rivet(g, 24, 18, 1.8, BRASS);
  S.dot(g, PL([[19, 21], [29, 21], [24, 26]]), '#fff', .7); S.dot(g, PL([[22, 18], [26, 18], [24, 25]]), '#fff', .7);
  // arms: right holds the censer chain, left tucked
  const cx = -30, cy = -2, ca = -.5 + raise * -1.2 + (w != null ? Math.sin(ph + 1) * .1 : 0);
  S.tube(g, SO([[-24, -18], [-36, -6], [cx, cy]]), COAT, 8); S.part(g, E(cx, cy + 2, 6, 5.5), GLOVE, { x:cx, y:cy, r:6 }, { flat:true, mat:'leather' });
  S.tube(g, SO([[24, -18], [34, -2], [28, 12]]), COAT, 8); S.part(g, E(28, 14, 6, 5.5), GLOVE, { x:28, y:14, r:6 }, { flat:true, mat:'leather' });
  // censer swinging from the chain: a brass pot with a green-glowing grate
  const cl = 26, ex = cx + Math.sin(ca) * cl, ey = cy + Math.cos(ca) * cl;
  S.ln(g, [[cx, cy], [ex, ey - 8]], BRASS, 1.6, .9); for (let i = 1; i < 4; i++) S.dot(g, E(cx + (ex - cx) * i / 4, cy + (ey - 8 - cy) * i / 4, 1.6, 1.6), BRASS.light, .9);
  g.save(); g.shadowColor = '#9fe07a'; g.shadowBlur = 8 + raise * 12; S.part(g, SM([[ex - 8, ey - 8], [ex + 8, ey - 8], [ex + 9, ey + 2], [ex, ey + 8], [ex - 9, ey + 2]], .7), BRASS, { x:ex, y:ey, r:9 }, { mat:'metal' }); g.restore();
  S.dot(g, E(ex, ey - 1, 4.5, 3.2), '#9fe07a', .8 + raise * .2); S.dot(g, E(ex - 1.2, ey - 1.6, 1.6, 1.3), '#e8ffd0', .9);
  for (let i = 0; i < 3; i++){ const t = ((heal * 2 + i / 3) % 1); puff(g, ex + Math.sin(i * 2 + heal * 10) * 6, ey - 12 - t * 22, 4 + t * 4, (1 - t) * .5 * (.4 + raise * .6), '#c8f0a0'); }
  // head: stooped forward and low, beaked mask, lenses, wide hat
  g.save(); g.translate(0, -4); g.rotate(stoop); g.translate(0, 14);   // the head sits low on the chest: hunched
  const head = SM([[-18, -36], [-20, -22], [-14, -10], [0, -6], [14, -10], [20, -22], [18, -36], [8, -44], [-8, -44]]); S.part(g, head, MASK, { x:0, y:-26, r:20 }, { mat:'leather' });
  S.contact(g, coat, 0, -26, 16, 8, .5);
  // stitched seams of the mask
  S.ln(g, [[-12, -30], [12, -30]], pal(MASK.dark), 1.2, .6); for (const x of [-9, -3, 3, 9]) S.ln(g, [[x, -33], [x, -27]], pal(MASK.dark), 1, .5);
  // the beak: a long leather cone curving down toward the wall, stitched along its ridge
  const beak = SM([[-11, -24], [11, -22], [15, -10], [12 + peck * 4, 6 + peck * 8], [4, 14 + peck * 8], [-4, 8], [-9, -8]], .75); S.part(g, beak, BEAK, { x:2, y:-8, r:16 }, { mat:'leather', hx:-3, hy:-16 });
  S.contact(g, beak, 0, -22, 12, 5, .45);
  S.ln(g, [[-3, -18], [7, 6 + peck * 8]], pal(BEAK.dark), 1.4, .7); for (let i = 0; i < 5; i++) S.ln(g, [[-4.5 + i * 2, -15 + i * 5], [-1.5 + i * 2, -14 + i * 5]], pal(BEAK.dark), 1, .6);
  for (const y of [-10, -2]) S.dot(g, E(-3, y, 1.6, 1.3), BEAK.deep, .7);
  // goggle lenses: brass rings with glowing green glass
  for (const s of [-1, 1]){ S.part(g, E(s * 10, -30, 7.5, 7.5), BRASS, { x:s * 10, y:-30, r:7.5 }, { mat:'metal', flat:true }); g.save(); g.shadowColor = '#c9f0a0'; g.shadowBlur = 6; S.part(g, E(s * 10, -30, 5.5, 5.5), LENS, { x:s * 10, y:-30, r:5.5 }, { noEdge:true }); g.restore();
    S.dot(g, E(s * 10, -30, 3, 3), '#c9f0a0', .9); S.dot(g, E(s * 10 - 1.4, -31.6, 1.4, 1.1), '#fff', .95); }
  // hat: wide brim and a low crown with a band
  S.part(g, E(0, -46, 36, 7.5), HAT, { x:0, y:-46, r:36 }, { flat:true, mat:'cloth', hx:-16, hy:-49 }); S.contact(g, head, 0, -42, 18, 6, .5);
  S.part(g, SM([[-20, -46], [-17, -60], [0, -63], [17, -60], [20, -46]], .6), HAT, { x:0, y:-54, r:20 }, { mat:'cloth', hx:-8, hy:-58 });
  S.part(g, RR(-19, -53, 38, 5, 2), pal('#4a3a30'), { x:0, y:-50, r:19 }, { flat:true, mat:'leather' }); S.rivet(g, 8, -50.5, 2, BRASS);
  g.restore();
  g.restore();
}

// ---------- Fogwalker ----------
export function fogwalker(g, P = {}){
  const w = P.walk, ch = P.chew, ph = (w ?? ch ?? 0) * TAU;
  const bob = w != null ? -Math.abs(Math.sin(ph)) * 2 : ch != null ? Math.sin(ph) * 2 : 0, sway = w != null ? Math.sin(ph) * .04 : 0, press = ch == null ? 0 : .5 + .5 * Math.sin(ph);
  S.shadow(g, 0, 52, 26, 5);
  g.save(); g.translate(0, bob + press * 3); g.rotate(sway);
  // a narrow robe with a swaying hem
  const hem = tatters(-24, 24, 46, 4, ph, 7);
  const robe = SM([[-2, -40], [-18, -32], [-24, -10], [-22, 14], [-24, 36], ...hem, [24, 36], [22, 14], [24, -10], [18, -32]], .8);
  S.part(g, robe, FOGR, { x:0, y:4, r:40 }, { mat:'cloth', hx:-12, hy:-24 });
  S.crease(g, SO([[-12, -6], [-14, 16], [-12, 42]]), FOGR, 1.8, .4); S.crease(g, SO([[10, -4], [13, 18], [11, 42]]), FOGR, 1.8, .4);
  S.tube(g, SO([[-20, 8], [0, 12], [20, 8]]), FOGRD, 3);
  // left arm hangs, right arm lifts a pole with the lantern on top
  S.tube(g, SO([[-18, -14], [-28, 4], [-26, 24]]), FOGR, 7); bonyHand(g, -26, 28, BONE, Math.PI / 2 + .2, 8);
  const lift = -Math.sin(ph) * 2 - press * 6;
  g.save(); g.translate(20, -12); g.rotate(-.35 + press * .1); g.translate(-20, 12);
  S.tube(g, SO([[18, -14], [32, -4], [36, 14 + lift]]), FOGR, 7); S.contact(g, robe, 18, -12, 8, 8, .35);
  S.tube(g, SO([[36, 30 + lift], [36, -56 + lift]]), POLE, 3.5); S.ln(g, [[35.2, 26 + lift], [35.2, -50 + lift]], { deep:pal(POLE.light).base }, .7, .5);
  bonyHand(g, 36, 16 + lift, BONE, Math.PI / 2 - .3, 8);
  // the lantern: a glass box of pale fog that spills out of the top vents
  g.save(); g.translate(36, -68 + lift);
  S.stroke(g, g2 => { g2.beginPath(); g2.arc(0, 8, 4, 0, TAU); }, LAMP, 2); S.ln(g, [[0, 12], [0, 18]], LAMP, 2);
  for (let i = 0; i < 5; i++){ const t = ((ph / TAU) + i / 5) % 1; puff(g, Math.sin(i * 2.1 + t * 6) * 8 + (i - 2) * 3, -4 - t * 34, 5 + t * 7, (1 - t) * .7); }
  g.save(); g.shadowColor = '#dcefff'; g.shadowBlur = 16; S.part(g, RR(-11, 18, 22, 26, 4), LAMPG, { x:0, y:31, r:14 }, { flat:true }); g.restore();
  const fg = g.createRadialGradient(0, 30, 1, 0, 30, 12); fg.addColorStop(0, 'rgba(255,255,255,.95)'); fg.addColorStop(1, 'rgba(220,235,245,.1)'); g.fillStyle = fg; ell(g, 0, 30, 9, 11); g.fill();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-8, 20, 2.5, 22); S.ln(g, [[0, 18], [0, 44]], LAMP, 1, .5);
  for (const yy of [18, 44]) S.part(g, RR(-13, yy - 3, 26, 6, 2), LAMP, { x:0, y:yy, r:13 }, { flat:true, mat:'metal' });
  g.restore(); g.restore();
  // hood: deep, with a void face and pale eyes
  const hood = SM([[2, -56], [-14, -52], [-24, -38], [-26, -16], [-18, -2], [0, 2], [18, -2], [26, -16], [24, -38], [14, -52]], .85); S.part(g, hood, FOGR, { x:0, y:-28, r:28 }, { mat:'cloth', hx:-12, hy:-46 });
  S.contact(g, robe, 0, 0, 20, 8, .45);
  S.part(g, SM([[-19, -18], [-15, -40], [0, -47], [15, -40], [19, -18], [11, -4], [0, 0], [-11, -4]], .9), FOGRD, { x:0, y:-24, r:20 }, { flat:true, mat:'cloth', noEdge:true });
  voidFace(g, SM([[-16, -18], [-12, -36], [0, -42], [12, -36], [16, -18], [9, -6], [0, -3], [-9, -6]], .9), 6, -24, 3, CYAN2, press);
  g.restore();
}

// ---------- The Poltergeist (boss) ----------
// A tall tattered spectre (owner, 2026-09-26: menacing, not a cute sheet ghost): a shroud shredded into long trailing strips,
// a hollow face with sunken glowing eyes and a jagged gaping mouth, long grasping clawed hands and a dangling soul-chain.
// Full form (variant 'form2', level 20) is 12% bigger and darker with more strips, a second pair of ghostly hands, cracked runes and a spectral crown.
const SHROUD = pal('#aab5c6'), SHROUDD = pal('#6f7e94'), SHROUD2 = pal('#7c879b'), SHROUD2D = pal('#4b5669'), SPIRIT = pal('#c4dfe8'), TOOTH = pal('#dbe5ec'), SOUL = '#9ef4e2', SOUL2 = '#7ff0ff', VOID = '#0a0f18';

/** Long grasping spectre hand: a small bony palm, four thin bent fingers and a thumb, each tipped with a claw.
 *  dir = reach direction, curl 0 (splayed) → 1 (clenched), cd = which way the fingers bend (±1), spread widens the fan. */
function specHand(g, x, y, c, dir, curl = .3, spread = 1, cd = 1, len = 22){
  const w = 4;
  const finger = (ang, L, bend) => { const mx = x + Math.cos(ang) * L * .5, my = y + Math.sin(ang) * L * .5, a2 = ang + bend, tx = mx + Math.cos(a2) * L * .5, ty = my + Math.sin(a2) * L * .5;
    S.tube(g, SO([[x, y], [mx, my], [tx, ty]]), c, w); S.dot(g, E(mx, my, w * .5, w * .5), rgba(c.dark, .45)); S.claw(g, tx, ty, a2, 5.5, '#eaf1f6'); };
  for (let i = 0; i < 4; i++){ const ang = dir + (i - 1.5) * .36 * spread, L = len * (i === 0 || i === 3 ? .82 : 1); finger(ang, L, (.25 + curl * 1.1) * cd); }
  finger(dir - cd * 1.05, len * .55, (.2 + curl * .8) * cd);   // thumb
  S.part(g, E(x, y, 8.5, 7.2, dir), c, { x, y, r:8.5 }, { flat:true, mat:'bone' });
  S.dot(g, E(x + Math.cos(dir) * 3, y + Math.sin(dir) * 3, 4.5, 3, dir), rgba(c.dark, .4));
}
/** Torn shroud strips trailing down from y0, spread between x1 and x2, waving with `ph`. */
function shreds(g, c, ph, n, y0, x1, x2, len, seed){
  const R = rng(seed);
  for (let i = 0; i < n; i++){ const t = n === 1 ? .5 : i / (n - 1), bx = x1 + (x2 - x1) * t, L = len * (.7 + R() * .5), wv = Math.sin(ph + i * 1.4 + R()) * 7, w0 = 9 + R() * 4;
    const p = SM([[bx - w0, y0], [bx - w0 * .9 + wv * .3, y0 + L * .35], [bx - w0 * .5 + wv, y0 + L * .7], [bx - 3 + wv * 1.3, y0 + L, 1], [bx + 2 + wv * 1.2, y0 + L * .8, 1], [bx + w0 * .5 + wv, y0 + L * .6], [bx + w0 * .9 + wv * .3, y0 + L * .3], [bx + w0, y0]], .8);
    S.part(g, p, c, { x:bx, y:y0 + L * .4, r:L * .55 }, { flat:true, mat:'cloth', hx:bx - 3, hy:y0 + 8 });
    S.thread(g, bx - 3 + wv * 1.3, y0 + L, wv > 0 ? 1 : -1, c); }
}
/** A chain of small links hanging from (x, y) with a cracked soul-orb bauble at the end; sw = sideways swing. */
function soulChain(g, x, y, len, sw, c, glow){
  const n = Math.round(len / 5); g.save(); g.globalAlpha *= .85;
  for (let i = 0; i <= n; i++){ const t = i / n, lx = x + sw * t * t, ly = y + len * t; g.beginPath(); g.ellipse(lx, ly, 1.6, 2.4, sw * t * .05, 0, TAU); g.strokeStyle = rgba(c.light, .9); g.lineWidth = 1.1; g.stroke(); }
  const bx = x + sw, by = y + len + 5;
  g.save(); g.shadowColor = glow; g.shadowBlur = 8; S.part(g, E(bx, by, 5.5, 6), pal('#3a4256'), { x:bx, y:by, r:5.5 }, { mat:'metal' }); g.restore();
  S.ln(g, [[bx - 2.5, by - 3], [bx + .5, by], [bx - 1, by + 3.5]], { deep:glow }, 1.2, .95); S.dot(g, E(bx + 1.5, by - 1, 1.2, 1.2), glow, .9);
  g.restore();
}

export function poltergeist(g, P = {}){
  const idle = P.idle, swap = P.swap, rec = P.recolour, fade = P.fade ?? 0, ph = (idle ?? 0) * TAU, full = P.variant === 'form2';
  const C = full ? SHROUD2 : SHROUD, CD = full ? SHROUD2D : SHROUDD, glow = full ? SOUL2 : SOUL;
  const bob = idle != null ? Math.sin(ph) * 5 : 0;
  const flare = swap != null ? Math.sin(swap * Math.PI) : rec != null ? Math.min(1, rec * 2) : 0;   // eyes blaze and the jaw drops while it works its mischief
  if (fade > 0){ streaks(g, 0, 30, fade, 16, 29, 130); if (fade >= 1) return; g.save(); g.globalAlpha *= 1 - fade; g.translate(0, fade * 30); g.scale(1 - fade * .3, 1 - fade * .3); }
  g.save();
  if (full){ g.translate(0, 50); g.scale(1.12, 1.12); g.translate(0, -50); }
  S.shadow(g, 0, 56, 40, 6);
  for (let i = 0; i < 5; i++){ const t = i / 4; puff(g, Math.sin(ph + i * 1.9) * 12 * (t + .3) + (i - 2) * 10, 36 + t * 20, 14 - t * 6, .45 - t * .3, full ? '#c8dce8' : '#e6f4fb'); }
  g.save(); g.translate(0, bob); g.globalAlpha *= .94;
  // hand targets: hang beside the waist and slowly clench in idle; fling wide and spin for a swap; raise then flick down and out for a recolour
  const hands = [];
  for (const s of [-1, 1]){
    let hx = s * 60, hy = 14 + Math.sin(ph + s) * 4, dir = Math.PI / 2 + s * .35, curl = .35 + Math.sin(ph * 2 + s) * .15, spread = 1, swirl = 0, spin = 0, fl = 0;
    if (swap != null){ const out = Math.sin(Math.min(1, swap * 1.15) * Math.PI); spin = swap * TAU * 2; hx = s * (62 + out * 26); hy = -26 - out * 18 + Math.sin(ph + s) * 3; dir = Math.PI / 2 + s * .4 + spin * s; curl = 0; spread = 1.3; swirl = out; }
    if (rec != null){ const k = rec < .4 ? rec / .4 : 1; fl = rec < .4 ? 0 : (rec - .4) / .6; hx = s * (44 + fl * 28); hy = 6 - k * 92 + fl * 84; dir = -Math.PI / 2 + s * (.25 + fl * 1.35); curl = fl * .4; spread = 1.35; }
    hands.push({ s, hx, hy, dir, curl, spread, swirl, spin, fl });
  }
  // second pair of ghostly hands (full form only): translucent, floating raised behind the shoulders, mirroring the mischief
  if (full){ for (const h of hands){ const { s } = h; let x = s * 64, y = -74 + Math.sin(ph * 1.3 + s * 2) * 5, dir = -Math.PI / 2 + s * .55, curl = .3 + Math.sin(ph * 2 + s * 3) * .2;
      if (swap != null){ x = s * (64 + h.swirl * 18); y = -84 - h.swirl * 12; dir = -Math.PI / 2 + s * .5 + h.spin * s; curl = 0; }
      if (rec != null){ y = -74 - (h.hy - 6) * .3; dir = -Math.PI / 2 + s * .4; }
      g.save(); g.globalAlpha *= .65; g.shadowColor = glow; g.shadowBlur = 10; specHand(g, x, y, SPIRIT, dir, curl, 1.2, -s, 19); g.restore(); } }
  // trailing strips of the shredded shroud, then the shroud over the top of them
  shreds(g, C, ph, full ? 7 : 5, -8, full ? -40 : -34, full ? 40 : 34, 56, full ? 43 : 37);
  if (full) shreds(g, CD, ph + 1.2, 2, -20, -50, 50, 42, 53);
  const hem = tatters(-30, 30, 4, 6, ph, 7);
  const torso = SM([[0, -128], [-20, -122], [-33, -106], [-37, -86], [-34, -68], [-48, -56], [-52, -38], [-46, -16], [-36, -4], ...hem, [36, -4], [46, -16], [52, -38], [48, -56], [34, -68], [37, -86], [33, -106], [20, -122]], .8);
  g.save(); g.shadowColor = rgba(glow, .55); g.shadowBlur = 18; S.part(g, torso, C, { x:0, y:-60, r:70 }, { mat:'cloth', hx:-20, hy:-108 }); g.restore();
  S.overlay(g, torso, CD, { x:0, y:-56, r:66 }, .55);
  g.save(); torso(g); g.clip(); let gr = g.createRadialGradient(0, -34, 4, 0, -34, 56); gr.addColorStop(0, rgba(glow, full ? .5 : .42)); gr.addColorStop(1, rgba(glow, 0)); g.fillStyle = gr; g.fillRect(-80, -140, 160, 200); g.restore();   // eerie inner glow
  S.crease(g, SO([[-30, -60], [-36, -30], [-30, -4]]), CD, 2.4, .45); S.crease(g, SO([[28, -58], [34, -28], [28, -4]]), CD, 2.4, .45); S.crease(g, SO([[-12, -66], [-14, -34], [-10, -2]]), CD, 1.8, .35); S.crease(g, SO([[12, -64], [14, -32], [10, -2]]), CD, 1.8, .35);
  for (const [x, y] of hem.filter((p, i) => i % 2 === 0)) S.thread(g, x, y, x < 0 ? -1 : 1, CD);
  if (full){   // cracked glowing runes on the chest
    g.save(); torso(g); g.clip(); g.shadowColor = glow; g.shadowBlur = 8;
    for (const pts of [[[-22, -46], [-14, -54], [-10, -42], [-18, -36]], [[-2, -40], [6, -50], [8, -38], [0, -30], [-6, -36]], [[16, -52], [24, -46], [18, -36]]]) S.ln(g, pts, { deep:glow }, 2, .95);
    g.restore(); for (const [x, y] of [[-16, -50], [4, -44], [20, -44]]) S.ln(g, [[x - 4, y + 6], [x, y], [x + 3, y - 5]], CD, .9, .7); }
  // arms: torn sleeves from the shoulders to the wrists, then the grasping hands
  for (const h of hands){ const { s, hx, hy, dir } = h, sx = s * 44, sy = -54, wx = hx - Math.cos(dir) * 6, wy = hy - Math.sin(dir) * 6, ex = (sx + wx) / 2 + s * 16, ey = (sy + wy) / 2 - 4;
    S.tube(g, SO([[sx, sy], [ex, ey], [wx, wy]]), C, 13); S.contact(g, torso, sx, sy + 2, 10, 10, .35);
    const a = Math.atan2(wy - ey, wx - ex); g.save(); g.translate(wx, wy); g.rotate(a);
    S.part(g, SM([[-10, -8], [4, -9], [10, -3, 1], [4, 0, 1], [11, 4, 1], [5, 6, 1], [8, 10, 1], [-10, 8]], .6), C, { x:0, y:0, r:10 }, { flat:true, mat:'cloth' }); g.restore(); }
  // hood opening: a hollow void with sunken blazing eyes and a wide jagged gaping mouth
  const cave = SM([[-26, -76], [-28, -98], [-18, -114], [-6, -108], [0, -105], [6, -108], [18, -114], [28, -98], [26, -76], [14, -62], [0, -58], [-14, -62]], .85);
  S.dot(g, cave, VOID);
  g.save(); cave(g); g.clip(); gr = g.createRadialGradient(0, -92, 2, 0, -92, 30); gr.addColorStop(0, rgba(glow, .22 + flare * .35)); gr.addColorStop(1, rgba(glow, 0)); g.fillStyle = gr; g.fillRect(-40, -130, 80, 80); g.restore();
  S.stroke(g, SO([[-26, -76], [-28, -98], [-18, -114], [-6, -108], [0, -105], [6, -108], [18, -114], [28, -98], [26, -76]]), { deep:C.light }, 2.2, .45);
  for (const s of [-1, 1]){ S.dot(g, E(s * 12, -96, 7.5, 8.5), '#03060c'); S.dot(g, PL([[s * 21, -108], [s * 3, -99], [s * 21, -99]]), CD.deep, .95);   // a lid of shroud scowls over each socket
    S.glow(g, s * 12, -94, 3.2 + flare * 1.8, glow); }
  const open = .3 + flare * .7, mouth = PL([[-20, -80], [-12, -84], [0, -86], [12, -84], [20, -80], [15, -71 - open * 7], [8, -65 - open * 10], [0, -62 - open * 12], [-8, -65 - open * 10], [-15, -71 - open * 7]]);
  S.dot(g, mouth, VOID); g.save(); mouth(g); g.clip(); gr = g.createRadialGradient(0, -64 - open * 8, 1, 0, -66, 18); gr.addColorStop(0, rgba(glow, .45)); gr.addColorStop(1, rgba(glow, 0)); g.fillStyle = gr; g.fillRect(-30, -100, 60, 60); g.restore();
  for (const [x, l] of [[-15, 5], [-9, 7], [-3, 5], [3, 6], [9, 7], [15, 5]]) S.dot(g, PL([[x - 2.6, -84 + Math.abs(x) * .25], [x + 2.6, -84 + Math.abs(x) * .25], [x, -84 + l + Math.abs(x) * .25]]), TOOTH.base);
  for (const [x, l] of [[-12, 4], [-6, 5.5], [0, 4], [6, 5.5], [12, 4]]){ const by = -66 - open * 10 + Math.abs(x) * .45; S.dot(g, PL([[x - 2.4, by + 1], [x + 2.4, by + 1], [x, by - l]]), TOOTH.dark); }
  if (full){   // spectral crown: a jagged ring of cold light hovering on the head
    g.save(); g.globalAlpha *= .85; g.shadowColor = glow; g.shadowBlur = 12; const crown = PL([[-26, -120], [-20, -140], [-13, -126], [-6, -146], [0, -128], [6, -146], [13, -126], [20, -140], [26, -120]]);
    gr = g.createLinearGradient(0, -146, 0, -118); gr.addColorStop(0, rgba(glow, .55)); gr.addColorStop(1, rgba('#ffffff', .9)); crown(g); g.fillStyle = gr; g.fill(); g.strokeStyle = rgba(glow, .9); g.lineWidth = 1.4; g.lineJoin = 'round'; g.stroke();
    S.dot(g, E(0, -121, 27, 3.5), rgba('#ffffff', .6)); g.restore(); }
  // hands with their mischief effects: a cyan swirl for a swap, paint sprayed off the fingers for a recolour
  for (const h of hands){ const { s, hx, hy, dir, curl, spread, swirl, spin, fl } = h;
    if (swirl > 0){ g.save(); g.shadowColor = SOUL2; g.shadowBlur = 8; for (let i = 0; i < 6; i++){ const a = spin * .5 + i * TAU / 6, rr = 22 + swirl * 8, px = hx + Math.cos(a) * rr, py = hy + Math.sin(a) * rr * .7; S.dot(g, E(px, py, 3.5 - i * .3, 3.5 - i * .3), SOUL2, swirl * (.75 - i * .09)); } g.restore(); }
    if (fl > 0){ const R = rng(31 + (s < 0 ? 0 : 7)); for (let i = 0; i < 5; i++){ const a = -Math.PI / 2 + s * (.1 + R() * 1.4), d = 14 + R() * 36, ex = hx + Math.cos(a) * d * fl, ey = hy + Math.sin(a) * d * fl + fl * fl * 34, rr = 4.5 + R() * 4; g.save(); g.globalAlpha *= 1 - fl * .4; S.part(g, E(ex, ey, rr, rr * .85), pal(PAINT[(i + (s < 0 ? 0 : 3)) % PAINT.length]), { x:ex, y:ey, r:rr }, { flat:true, mat:'paint' }); g.restore(); } }
    specHand(g, hx, hy, C, dir, curl, spread, -s, 22);
    if (s < 0 || full){ const cl = full ? 30 : 24; soulChain(g, hx + s * 3, hy + 3, cl, Math.sin(ph + s) * 5 + (swap != null ? Math.cos(spin) * 8 : 0), C, glow); }
  }
  g.restore(); g.restore();
  if (fade > 0) g.restore();
}

// ---------- registry ----------
// scale/dy fit the drawing to the in-game footprint (feet at about r × 0.95 below the monster's centre).
const stream = (m, n, fps = 12) => Math.floor(m.ph * fps) % n;
export const W2 = {
  wisp: { draw:wisp, scale:.6, dy:-10, box:{ x:-48, y:-82, w:96, h:136 },
    clips:{ walk:{ n:8, fps:10, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, driftL:{ n:4, fps:10, pose:t => ({ walk:t, lean:-1 }) }, driftR:{ n:4, fps:10, pose:t => ({ walk:t, lean:1 }) } }, still:{ walk:.25 },
    frame(m, clips){ const d = m.tx - m.x; if (!m.eating && Math.abs(d) > 4) return [d < 0 ? 'driftL' : 'driftR', stream(m, clips.driftL.n, clips.driftL.fps)]; return null; } },
  wraith: { draw:wraith, scale:.56, dy:-8, box:{ x:-56, y:-70, w:112, h:126 },
    clips:{ walk:{ n:8, fps:9, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, fade:{ n:6, fps:12, once:true, pose:t => ({ walk:.25, fade:t }) } }, still:{},
    frame(m, clips){ if (m.hidden) return null; const n = clips.fade.n;
      if (m.vanish > 0 && m.vanish < .5 && m.p > .05 && m.p < .9) return ['fade', Math.min(n - 1, Math.floor((.5 - m.vanish) / .5 * n))];          // about to vanish
      if (m.vanish > WRAITH_SHOW - .5 && m.age > .5) return ['fade', Math.max(0, Math.min(n - 1, Math.floor((m.vanish - (WRAITH_SHOW - .5)) / .5 * n)))];   // just reappeared: plays backwards
      return null; } },
  rider: { draw:rider, scale:.5, dy:-8, box:{ x:-44, y:-84, w:88, h:140 },
    clips:{ walk:{ n:8, fps:10, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, ride:{ n:8, fps:14, pose:t => ({ ride:t }) }, ridechew:{ n:4, fps:8, pose:t => ({ ride:t, chew:t }) } }, still:{ ride:.25 },
    frame(m, clips){ if (!m.carrier) return null; if (m.eating && m.frozenT <= 0) return ['ridechew', stream(m, clips.ridechew.n, clips.ridechew.fps)]; return ['ride', stream(m, clips.ride.n, m.frozenT > 0 ? 0 : clips.ride.fps)]; } },
  doctor: { draw:doctor, scale:.62, dy:-10, box:{ x:-70, y:-62, w:140, h:118 },
    clips:{ walk:{ n:8, fps:7, pose:t => ({ walk:t }) }, chew:{ n:4, fps:7, pose:t => ({ chew:t }) }, heal:{ n:6, fps:12, once:true, pose:t => ({ walk:.25, heal:t }) } }, still:{},
    frame(m, clips){ if (m.p > .05 && m.healT > DOCTOR_HEAL_EVERY - .5 && m.frozenT <= 0){ const n = clips.heal.n; return ['heal', Math.min(n - 1, Math.floor((DOCTOR_HEAL_EVERY - m.healT) / .5 * n))]; } return null; } },
  fogwalker: { draw:fogwalker, scale:.6, dy:-11, box:{ x:-50, y:-126, w:116, h:182 },
    clips:{ walk:{ n:8, fps:8, pose:t => ({ walk:t }) }, chew:{ n:4, fps:7, pose:t => ({ chew:t }) } }, still:{} },
  poltergeist: { draw:poltergeist, scale:.6, dy:0, box:{ x:-138, y:-172, w:276, h:236 }, variants:{ form2:true },   // box fits the full form (×1.12 about the feet, crown on top)
    clips:{ walk:{ n:8, fps:6, pose:t => ({ idle:t }) }, swap:{ n:8, fps:14, once:true, pose:t => ({ idle:.25, swap:t }) }, recolour:{ n:8, fps:12, once:true, pose:t => ({ idle:.25, recolour:t }) }, teleport:{ n:8, fps:16, once:true, pose:t => ({ idle:0, fade:t }) } }, still:{} },
};
