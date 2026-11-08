// ---------- Nightmare Witchwood's monsters (Release 7; spec Part 3) ----------
// New Toy Plastic drawings (docs/ART_BRIEF.md). The nightmare wood is drained grey with red accents; the potions (red, green, violet) are the only
// other colour, so every monster here is grey hide and black iron with a red eye or lining, and the bottles they carry are the potion colours.
//   flaskbearer: a little grey imp, big-headed and quick, a red neckerchief and red eyes. A leather belt round its middle carries the three potions
//                on cords (a round red flask, a thin green vial, a violet swirl bottle) that swing and clink as it scurries. Clips: walk (a scurry,
//                the bottles knocking together), chew (leaning in to gnaw, bottles jolting), die (it trips, the bottles fly off and shatter, it fades).
//   toad:        the Cauldron Toad. A fat warty grey toad squatting low, its belly a black iron cauldron (a lip and two ring handles) with a red brew
//                glinting at the lip; bulging red-eyed lids on top of a wide mouth. Clips: walk (a heavy waddle), chew (the tongue lash: the mouth gapes
//                and the tongue shoots out; the long tongue down the lane to the fence is drawn by render/witchwood.js from `toadLash`, so it always
//                reaches the fence whatever the screen), die (it swells and bursts, leaving a splash of grey and iron that fades).
// Drawn around (0,0) in drawing units with the feet near y = 50. Every clip is baked by render/anim.js; nothing random per frame (rng(seed) only).
// Every palette sits inside a function, so lower builds (which never call these) keep none of it. Later Release 7 monsters go beside these.

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';

const ease = t => t * t * (3 - 2 * t);
const clamp01 = x => Math.max(0, Math.min(1, x));
const lerp = (a, b, t) => a + (b - a) * t;

let PALS = null;
/** The Witchwood nightmare palette (lazy: built on first draw). */
function P(){
  return PALS || (PALS = {
    // flask bearer
    imp:pal('#8f8d96'), impD:pal('#6a6872'), belly:pal('#c3bfc6'), horn:pal('#d8d0c2'), red:pal('#c82a3a'), redD:pal('#8a1a26'),
    belt:pal('#3c3134'), buckle:pal('#a9a9b2'), cord:pal('#6b5a50'), cork:pal('#8c7462'), glass:pal('#cfd8e6'),
    pRed:pal('#d8262e'), pGreen:pal('#3fc23a'), pViolet:pal('#8a3ce0'), bolt:pal('#ffd92e'),
    // toad
    hide:pal('#7a7a80'), hideD:pal('#55555c'), wart:pal('#8e8e95'), wartD:pal('#5e5c64'), iron:pal('#2c2b31'), ironL:pal('#4a4952'), lid:pal('#6c6b72'),
    mouth:'#3a0c14', tongue:pal('#c23a48'), brew:pal('#d8262e'),
  });
}
const POTC = { bulky:'#ff4a4a', speed:'#6cf05a', colour:'#b46cff' };

// ---------- the three little bottles (belt size: about 12-16 units tall) ----------
/** A bottle of `kind` hanging from (0,0) (the top of its cord loop), drawn with its own Toy Plastic glass and liquid. */
function bottle(g, kind, s = 1){
  const C = P();
  g.save(); g.scale(s, s);
  const liq = kind === 'bulky' ? C.pRed : kind === 'speed' ? C.pGreen : C.pViolet;
  const glass = kind === 'bulky' ? E(0, 11, 6.6, 6.4) : kind === 'speed' ? RR(-2.8, 3, 5.6, 15, [1.5, 1.5, 2.8, 2.8]) : SM([[-2, 3], [-6.5, 9], [-7, 14], [0, 18], [7, 14], [6.5, 9], [2, 3]], .8);
  const neckY = kind === 'speed' ? 3 : 4;
  // the cord loop from the belt down to the neck
  S.ln(g, [[0, 0], [0, neckY]], C.cord, 1.2, .9);
  S.part(g, glass, liq, { x:-1, y:kind === 'speed' ? 9 : 11, r:kind === 'speed' ? 8 : 7.5 }, { mat:'gel', hx:-2.5, hy:kind === 'speed' ? 7 : 8 });
  if (kind === 'colour'){ g.save(); glass(g); g.clip(); g.strokeStyle = 'rgba(240,200,255,.85)'; g.lineWidth = 1.1; g.beginPath(); for (let i = 0; i <= 16; i++){ const a = i / 16 * TAU * 1.5, r = .6 + i * .28; const x = Math.cos(a) * r, y = 12.5 + Math.sin(a) * r * .8; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.restore(); }
  if (kind === 'speed') S.dot(g, PL([[1.2, 6], [-1.6, 11], [.2, 11], [-1.2, 16], [1.8, 10], [0, 10.2], [1.6, 6]]), C.bolt.base, .95);
  if (kind === 'bulky'){ g.fillStyle = '#fff2ee'; g.beginPath(); g.moveTo(0, 13.6); g.bezierCurveTo(-3, 11.6, -2.3, 8.8, 0, 10.2); g.bezierCurveTo(2.3, 8.8, 3, 11.6, 0, 13.6); g.fill(); }
  S.stroke(g, glass, { deep:'#ffffff' }, .7, .45);
  S.part(g, RR(-2.4, neckY - 3.6, 4.8, 4, 1.4), kind === 'colour' ? pal('#c99aef') : C.cork, { x:0, y:neckY - 2, r:3 }, { flat:true, mat:kind === 'colour' ? undefined : 'wood', lw:.9 });
  g.restore();
}

/** A little bright star where two bottles clink (a = 0..1). */
function clink(g, x, y, a){
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.shadowColor = '#ffffff'; g.shadowBlur = 5; g.fillStyle = '#ffffff';
  g.beginPath(); for (let i = 0; i < 8; i++){ const ang = i * Math.PI / 4 + .3, r = i % 2 ? 1.1 : 4.2 * (.6 + a * .4); g.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r); } g.closePath(); g.fill(); g.restore();
}

/** Glass shards and a splash of `col` flying out from (x, y) (k = 0..1 through the burst), seeded so frames are stable. */
function shatter(g, x, y, col, k, seed){
  const R = rng(seed);
  g.save();
  const sp = ease(k), fade = 1 - clamp01((k - .55) / .45);
  g.globalAlpha *= fade;
  const gr = g.createRadialGradient(x, y, 0, x, y, 5 + sp * 10); gr.addColorStop(0, rgba(col, .85)); gr.addColorStop(.6, rgba(col, .45)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; ell(g, x, y + sp * 2, 5 + sp * 11, (5 + sp * 11) * .5); g.fill();
  for (let i = 0; i < 7; i++){ const a = R() * TAU, d = (4 + R() * 9) * sp, sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d * .7 - sp * 4 + sp * sp * 6, r = 1 + R() * 1.6;
    g.fillStyle = i % 2 ? rgba(col, .95) : 'rgba(235,245,255,.9)'; g.beginPath(); g.moveTo(sx, sy - r); g.lineTo(sx + r * .8, sy + r * .6); g.lineTo(sx - r * .7, sy + r * .4); g.closePath(); g.fill(); }
  g.restore();
}

// ---------- the Flask Bearer ----------
const BOTTLES = [['bulky', -12, 1.05, 0], ['speed', 1, 1, 2.1], ['colour', 13, 1, 4.2]];   // kind, belt x, size, swing phase
export function flaskbearer(g, P0 = {}){
  const C = P(), w = P0.walk, ch = P0.chew, di = P0.die;
  const ph = (w ?? ch ?? 0) * TAU;
  const step = w != null ? Math.sin(ph) : 0, bob = w != null ? -Math.abs(Math.sin(ph)) * 3 : ch != null ? Math.sin(ph) * 2.5 : 0;
  const lean = ch != null ? (1 - Math.cos(ph)) * .5 : 0, jaw = ch != null ? Math.abs(Math.sin(ph)) : w != null ? .15 : .1;
  // die: a stumble (0-.25), the bottles fly off (.15-.5) and shatter where they land (.4-.9); it tips over backwards and fades (.3-1)
  const fall = di != null ? ease(clamp01((di - .2) / .5)) : 0, fadeA = di != null ? 1 - clamp01((di - .55) / .45) : 1;
  S.shadow(g, 0, 49, 26 * (1 - fall * .2), 5);
  if (di != null){   // the broken bottles on the ground, behind the falling imp
    const k = clamp01((di - .38) / .62);
    if (di > .38) BOTTLES.forEach(([kind], i) => shatter(g, [-30, 4, 30][i], [44, 50, 42][i], POTC[kind], k, 11 + i * 7));
  }
  g.save(); g.globalAlpha *= fadeA;
  g.translate(0, 48); g.rotate(-fall * .32); g.scale(1 + fall * .12, 1 - fall * .42); g.translate(0, -48);
  // tail with a red arrow tip, flicking with the step
  const tw = w != null ? Math.sin(ph + 1) * 6 : 0;
  S.tube(g, SO([[8, 26], [24, 32 + tw * .3], [36, 20 + tw], [34, 4 + tw]]), C.imp, 3.2);
  S.part(g, PL([[30, 6 + tw], [36, -6 + tw], [42, 6 + tw], [36, 3 + tw]]), C.red, { x:36, y:2 + tw, r:6 }, { flat:true, lw:1 });
  // legs: a quick scurry, feet alternate
  for (const s of [-1, 1]){
    const k = w != null ? Math.sin(ph + (s < 0 ? 0 : Math.PI)) : 0, lift = Math.max(0, k) * 6, fx = s * 12 + k * 3 * s;
    S.tube(g, SO([[s * 7, 26], [s * 11 + k * 2, 36 - lift * .5], [fx, 45 - lift]]), C.imp, 6.4);
    const f = E(fx + s * 1.5, 46.5 - lift, 7, 4); S.part(g, f, C.impD, { x:fx, y:46 - lift, r:7 }, { flat:true, mat:'skin' });
    for (const d of [-3.5, 0, 3.5]) S.claw(g, fx + s * 1.5 + d, 49 - lift, Math.PI / 2, 3);
  }
  g.save(); g.translate(0, bob); g.translate(0, 30); g.rotate(step * .04); g.scale(1, 1 - lean * .04); g.translate(0, -30);
  // a pear body; pale belly
  const body = SM([[-15, 0], [-18, 16], [-12, 30], [0, 33], [12, 30], [18, 16], [15, 0], [0, -6]]);
  S.part(g, body, C.imp, { x:0, y:14, r:19 }, { mat:'skin', hx:-6, hy:4 });
  const belly = SM([[-8, 6], [-10, 20], [0, 28], [10, 20], [8, 6], [0, 3]]);
  S.part(g, belly, C.belly, { x:0, y:16, r:11 }, { noEdge:true, flat:true, mat:'skin' }); S.contact(g, belly, 0, 6, 9, 3, .3);
  // the belt and buckle
  const beltP = SM([[-18, 15], [0, 19], [18, 15], [18, 20], [0, 24], [-18, 20]], .6);
  S.part(g, beltP, C.belt, { x:0, y:19, r:16 }, { flat:true, mat:'leather', lw:1.1 });
  S.part(g, RR(-4, 16.5, 8, 7, 1.5), C.buckle, { x:0, y:20, r:5 }, { flat:true, mat:'metal', lw:1 }); S.dot(g, RR(-1.8, 18.3, 3.6, 3.4, .8), C.belt.base);
  for (const x of [-14, 14]) S.rivet(g, x, 19, 1.1, C.buckle);
  // the bottles on their cords: they lag the step and knock together (a clink star where two meet)
  const sw = BOTTLES.map(([, , , p]) => w != null ? Math.sin(ph - 1 + p * .25) * .45 : ch != null ? Math.sin(ph * 2 + p) * .3 : 0);
  if (di == null || di < .18){
    const fly = di != null ? di / .18 : 0;
    BOTTLES.forEach(([kind, x, s], i) => {
      g.save(); g.translate(x + (di != null ? (i - 1) * fly * 10 : 0), 21 - (di != null ? fly * 8 : 0)); g.rotate(sw[i] + (di != null ? (i - 1) * fly * 1.2 : 0)); bottle(g, kind, s); g.restore();
    });
    if (w != null){   // the clink: the swing brings neighbours together twice a stride
      const c1 = Math.max(0, Math.cos(ph * 2 - .6)) ** 8, c2 = Math.max(0, Math.cos(ph * 2 + 2.5)) ** 8;
      clink(g, -5.5, 31, c1); clink(g, 7, 32, c2);
    }
  } else if (di < .45){   // the bottles in flight, spinning away
    const k = (di - .18) / .27;
    BOTTLES.forEach(([kind, , s], i) => { const tx = [-30, 4, 30][i], ty = [44, 50, 42][i], x = lerp([-12, 1, 13][i], tx, k), y = lerp(14, ty, k) - Math.sin(k * Math.PI) * 26;
      g.save(); g.translate(x, y - 10); g.rotate((i - 1 || .6) * k * 5); bottle(g, kind, s); g.restore(); });
  }
  // arms: swing opposite the legs; chewing they reach forward and grab the wall
  for (const s of [-1, 1]){
    const a = w != null ? Math.sin(ph + (s < 0 ? Math.PI : 0)) : 0;
    let hx = s * (20 + a * 2), hy = 22 - a * 4 * s;
    if (ch != null){ hx = s * (13 - lean * 3); hy = 26 + lean * 8; }
    if (di != null){ hx = s * (24 + fall * 6); hy = 4 - fall * 14; }
    S.tube(g, SO([[s * 13, 6], [s * 19 + (hx - s * 19) * .3, (6 + hy) / 2 + 2], [hx, hy]]), C.imp, 5.2);
    S.hand(g, hx, hy + 2, C.imp, ch != null ? Math.PI / 2 : Math.PI / 2 + s * .4, 3, 4.2);
  }
  // a red neckerchief round the neck, knotted at the front; its corner hangs over the chest (drawn before the head, so the chin sits on it)
  const nk = SM([[-17, 3], [0, 9], [17, 3], [15, 10], [0, 16], [-15, 10]], .7);
  S.part(g, nk, C.red, { x:0, y:8, r:15 }, { mat:'cloth', flat:true, lw:1.1 });
  const tail = w != null ? Math.sin(ph + 2) * 2 : 0;
  S.part(g, SM([[2, 12], [8 + tail, 22], [3 + tail, 24], [-2, 14]], .6), C.red, { x:3, y:17, r:7 }, { flat:true, mat:'cloth', lw:1 });
  S.part(g, E(1, 13, 3.2, 2.8), C.red, { x:1, y:13, r:3.2 }, { flat:true, mat:'cloth', lw:1 });
  // head: big and round, pointed ears with red insides, two short bone horns
  g.save(); g.translate(0, lean * 7); g.rotate(step * -.03);
  for (const s of [-1, 1]){
    const ear = SM([[s * 18, -14], [s * 36, -28], [s * 38, -16], [s * 28, -3]], .7);
    S.part(g, ear, C.imp, { x:s * 28, y:-15, r:11 }, { flat:true, mat:'skin' });
    S.dot(g, SM([[s * 22, -13], [s * 33, -23], [s * 34, -16], [s * 27, -7]], .7), C.red.dark, .75);
  }
  for (const s of [-1, 1]) S.part(g, SM([[s * 8, -27], [s * 12, -40], [s * 7, -52], [s * 18, -42], [s * 18, -26]], .8), C.horn, { x:s * 13, y:-37, r:12 }, { flat:true, mat:'horn' });
  const head = SM([[-22, -18], [-24, -4], [-16, 9], [0, 12], [16, 9], [24, -4], [22, -18], [11, -30], [-11, -30]]);
  S.part(g, head, C.imp, { x:0, y:-9, r:25 }, { mat:'skin', hx:-9, hy:-20 }); S.contact(g, body, 0, 3, 13, 5, .5);
  // brow and a sly grin with two fangs; red eyes
  const eyeA = di != null ? clamp01(1 - di * 2.5) : 1;
  S.eye(g, -9, -10, 7.6, 8.6, { lx:.2, ly:ch != null ? .3 : .12, pr:.42, iris:'#e0283a', lid:ch != null ? .32 : di != null ? 1 - eyeA * .7 : .18, lidCol:C.imp.dark, tilt:.2 });
  S.eye(g, 9, -10, 7.6, 8.6, { lx:.2, ly:ch != null ? .3 : .12, pr:.42, iris:'#e0283a', lid:ch != null ? .32 : di != null ? 1 - eyeA * .7 : .18, lidCol:C.imp.dark, tilt:-.2 });
  S.ln(g, [[-16, -19], [-4, -16]], C.imp, 2, .8); S.ln(g, [[16, -19], [4, -16]], C.imp, 2, .8);
  const mo = SM([[-11, 1], [-5, 5 + jaw * 3], [0, 6 + jaw * 5], [5, 5 + jaw * 3], [11, 1], [0, 3]], .9);
  S.dot(g, mo, '#2a0c14'); if (jaw > .3) S.dot(g, E(0, 5 + jaw * 3.5, 4.5, 2 * jaw), '#c8384a', .85);
  S.dot(g, PL([[-8, 2], [-4, 2.4], [-6, 7.5]]), '#fff'); S.dot(g, PL([[4, 2.4], [8, 2], [6, 7.5]]), '#fff');
  g.restore();
  g.restore(); g.restore();
}

// ---------- the Cauldron Toad ----------
/** The lash cycle shared by the chew clip and the long tongue (render/witchwood.js): t = 0..1 through one lash. gape = how wide the mouth is,
 *  reach = how far the tongue is out (1 = at the fence). */
export function toadLash(t){
  const gape = t < .15 ? ease(t / .15) * .6 : t < .3 ? .6 + ease((t - .15) / .15) * .4 : t < .7 ? 1 : t < .9 ? 1 - ease((t - .7) / .2) * .85 : .15 - (t - .9) / .1 * .15;
  const reach = t < .25 ? 0 : t < .45 ? ease((t - .25) / .2) : t < .55 ? 1 : t < .8 ? 1 - ease((t - .55) / .25) : 0;
  return { gape, reach };
}
/** Where the mouth is, in drawing units (the tongue leaves from here). */
export const TOAD_MOUTH = { x:0, y:8 };

/** A wart: a little raised bump (red-tipped when `red`). */
function wart(g, x, y, r, c, red){
  S.part(g, E(x, y, r, r * .85), c, { x, y, r }, { flat:true, noEdge:true, mat:'skin' });
  g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, x - r * .35, y - r * .35, r * .3, r * .22); g.fill();
  if (red) S.dot(g, E(x + r * .1, y + r * .1, r * .45, r * .4), '#b0303c', .75);
}
export function toad(g, P0 = {}){
  const C = P(), w = P0.walk, ch = P0.chew, di = P0.die;
  const ph = (w ?? 0) * TAU;
  // walk: a heavy waddle, the body rolling side to side, the front feet stepping in turn, the throat pulsing
  const roll = w != null ? Math.sin(ph) * .07 : 0, sq = w != null ? Math.abs(Math.sin(ph)) : 0, throat = w != null ? (Math.sin(ph * 2) + 1) / 2 : 0;
  const lash = ch != null ? toadLash(ch) : null, gape = lash ? lash.gape : 0;
  // die: swells (0-.45), bursts (.45-.6), the splash and the flattened skin fade (.6-1)
  const swell = di != null ? ease(clamp01(di / .45)) : 0, burst = di != null ? clamp01((di - .45) / .55) : 0;
  S.shadow(g, 0, 50, 46 + swell * 8, 7);
  if (di != null && di >= .45){
    const R = rng(77), k = ease(burst), fade = 1 - clamp01((burst - .3) / .7);
    g.save(); g.globalAlpha *= fade;
    // the flat skin left on the ground
    S.part(g, SM([[-34, 44], [-20, 38], [0, 40], [20, 37], [36, 44], [18, 50], [-16, 50]], .8), C.hide, { x:0, y:44, r:30 }, { flat:true, mat:'skin' });
    for (const [x, y] of [[-18, 43], [4, 42], [20, 45]]) wart(g, x, y, 2.4, C.wart, x === 4);
    // the splash: grey hide flecks, iron shards and a red brew spray flying outwards
    const gr = g.createRadialGradient(0, 12, 0, 0, 12, 26 + k * 40); gr.addColorStop(0, 'rgba(230,230,235,.75)'); gr.addColorStop(.5, 'rgba(160,160,170,.35)'); gr.addColorStop(1, 'rgba(160,160,170,0)');
    g.fillStyle = gr; ell(g, 0, 12, 26 + k * 40, (26 + k * 40) * .7); g.fill();
    for (let i = 0; i < 18; i++){ const a = R() * TAU, d = (14 + R() * 44) * k, x = Math.cos(a) * d, y = 10 + Math.sin(a) * d * .7 + k * k * 10, r = 2 + R() * 3.5, typ = i % 3;
      if (typ === 0) S.part(g, E(x, y, r, r * .8), C.hide, { x, y, r }, { flat:true, lw:.8 });
      else if (typ === 1){ g.fillStyle = C.iron.light; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y + r * .4); g.lineTo(x - r * .8, y + r * .7); g.closePath(); g.fill(); }
      else S.dot(g, E(x, y, r * .8, r * .8), rgba(C.brew.base, .9)); }
    g.restore();
    return;
  }
  g.save(); g.translate(0, 50); g.rotate(roll); g.scale(1 + sq * .04 + swell * .2, 1 - sq * .07 + swell * .14); g.translate(0, -50 - (w != null ? (1 - sq) * 2.5 : 0));
  // the back legs: big haunches folded at the sides, the hind feet splayed out
  for (const s of [-1, 1]){
    const haunch = SM([[s * 26, 4], [s * 46, 12], [s * 52, 34], [s * 40, 48], [s * 24, 44], [s * 22, 22]], .85);
    S.part(g, haunch, C.hide, { x:s * 38, y:26, r:22 }, { mat:'skin', hx:s * 34, hy:16 });
    const hf = SM([[s * 38, 44], [s * 50, 42], [s * 60, 48], [s * 52, 52], [s * 36, 51]], .7);
    S.part(g, hf, C.hideD, { x:s * 48, y:47, r:12 }, { flat:true, mat:'skin' });
    for (const [dx, dy] of [[60, 48], [55, 52.5], [48, 52.5]]) S.part(g, E(s * dx, dy, 2.6, 2.2), C.hideD, { x:s * dx, y:dy, r:2.6 }, { flat:true, lw:.8 });
    for (const [x, y, r] of [[40, 18, 3], [46, 30, 2.6], [34, 36, 2.2]]) wart(g, s * x, y, r, C.wart, s > 0 && r === 3);
  }
  // the body: a fat dome
  const body = SM([[-40, 0], [-44, 22], [-34, 44], [0, 50], [34, 44], [44, 22], [40, 0], [24, -24], [0, -30], [-24, -24]], .9);
  S.part(g, body, C.hide, { x:0, y:8, r:46 }, { mat:'skin', hx:-18, hy:-14 });
  // warts across the back and shoulders (seeded, a couple red-tipped)
  { const R = rng(31); for (let i = 0; i < 14; i++){ const a = -Math.PI + R() * Math.PI, d = 26 + R() * 14, x = Math.cos(a) * d * 1.05, y = 4 + Math.sin(a) * d * .9, r = 2 + R() * 2.6; if (Math.abs(x) < 20 && y > -6) continue; wart(g, x, y, r, R() < .5 ? C.wart : C.wartD, i % 5 === 2); } }
  // the cauldron belly: black iron, a thick lip with two ring handles, the red brew glinting at the lip; a bubble rises from it
  const bel = SM([[-26, 14], [-30, 30], [-20, 46], [0, 50], [20, 46], [30, 30], [26, 14], [0, 10]], .85);
  S.part(g, bel, C.iron, { x:-2, y:30, r:26 }, { mat:'metal', hx:-12, hy:24 });
  S.overlay(g, bel, C.ironL, { x:-6, y:26, r:24 }, .25);
  for (const s of [-1, 1]){ g.save(); g.strokeStyle = C.ironL.base; g.lineWidth = 2.6; g.beginPath(); g.ellipse(s * 28, 27, 4, 5, 0, 0, TAU); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = .9; g.beginPath(); g.ellipse(s * 28 - .6, 26.4, 4, 5, 0, Math.PI, TAU * .9); g.stroke(); g.restore(); }
  const lip = SM([[-29, 13], [0, 8], [29, 13], [29, 18], [0, 14], [-29, 18]], .6);
  S.part(g, lip, C.ironL, { x:0, y:13, r:26 }, { flat:true, mat:'metal', lw:1.2 });
  for (const x of [-18, 0, 18]) S.rivet(g, x, 15.5 + Math.abs(x) * -.05, 1.4, C.ironL);
  { const b = w != null ? (w * 2) % 1 : ch != null ? ch : .4; g.save(); g.globalAlpha *= 1 - b; S.dot(g, E(-10 + b * 4, 36 - b * 22, 2 + b * 1.6, 2 + b * 1.6), rgba(C.brew.light, .5)); g.restore(); }
  S.dot(g, SM([[-20, 13.5], [0, 10.5], [20, 13.5], [0, 12]], .8), C.brew.base, .9);
  g.save(); g.shadowColor = '#ff4a4a'; g.shadowBlur = 5; S.dot(g, E(-8, 12, 4, 1.1), '#ff7a6a', .8); g.restore();
  // the front legs: stubby, stepping in turn, the toes splayed
  for (const s of [-1, 1]){
    const k = w != null ? Math.sin(ph + (s < 0 ? 0 : Math.PI)) : 0, lift = Math.max(0, k) * 8;
    const fx = s * (34 + Math.max(0, k) * 2), fy = 48 - lift;
    S.tube(g, SO([[s * 28, 16], [s * 41, 30 - lift * .4], [fx, fy - 3]]), C.hide, 9);
    for (const a of [-.55, 0, .55]){ const tx = fx + Math.sin(a) * 7 * s, ty = fy + 2 + Math.cos(a) * 1.5; S.tube(g, SO([[fx, fy - 2], [tx, ty]]), C.hideD, 3); S.part(g, E(tx, ty + .5, 2.4, 2), C.hideD, { x:tx, y:ty, r:2.4 }, { flat:true, lw:.8 }); }
  }
  // the head: wide and flat across the top of the body, the throat pouch pulsing under the mouth
  g.save(); g.translate(0, gape * 3);
  const head = SM([[-34, -6], [-36, -20], [-24, -32], [0, -36], [24, -32], [36, -20], [34, -6], [18, 4], [0, 6], [-18, 4]], .9);
  S.part(g, head, C.hide, { x:0, y:-16, r:34 }, { mat:'skin', hx:-14, hy:-28 });
  S.contact(g, body, 0, 4, 30, 8, .45);
  const pouch = 2 + throat * 2.5 + (ch != null && ch > .85 ? 3 : 0);
  S.part(g, E(0, 5 + pouch * .4, 14 + pouch, 3 + pouch * .6), C.hideD, { x:0, y:5, r:14 }, { flat:true, noEdge:true, mat:'skin' });
  // the mouth: a wide closed grin that gapes open into a red-black maw with the tongue curled inside
  const mw = 26, my = 0;
  if (gape > .08){
    const open = SM([[-mw, my - 2], [-mw * .6, my + 4 + gape * 9], [0, my + 6 + gape * 13], [mw * .6, my + 4 + gape * 9], [mw, my - 2], [0, my + 1]], .85);
    S.dot(g, open, C.mouth);
    g.save(); open(g); g.clip();
    S.part(g, E(0, my + 5 + gape * 11, 11, 4 + gape * 5), C.tongue, { x:0, y:my + 6 + gape * 10, r:11 }, { flat:true, lw:1 });   // the tongue's root bunched in the mouth
    g.restore();
    S.stroke(g, open, C.hide, 1.6, .85);
  }
  S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(-mw - 3, my - 5); g2.quadraticCurveTo(-mw * .5, my + 2, 0, my + 1); g2.quadraticCurveTo(mw * .5, my + 2, mw + 3, my - 5); }, C.hide, 2.2, .95);
  for (const s of [-1, 1]) S.dot(g, E(s * 6, -14, 1.3, 1), C.hide.deep, .8);   // nostrils
  // the eyes: bulging lids on top of the head, red irises, heavy-lidded; they squeeze shut as it lashes
  const squint = ch != null ? .45 + gape * .35 : w != null ? .4 + sq * .1 : .4;
  for (const s of [-1, 1]){
    const ex = s * 17, ey = -30;
    S.part(g, E(ex, ey, 11, 10), C.lid, { x:ex, y:ey, r:11 }, { mat:'skin', hx:ex - 4, hy:ey - 5 });
    S.eye(g, ex, ey + 1, 7.4, 7, { lx:s * .05, ly:.15, pr:.46, iris:'#e0283a', lid:di != null ? .45 + swell * .5 : squint, lidCol:C.lid.dark, tilt:s * -.25 });
    S.stroke(g, SO([[ex - 8, ey - 4 + squint * 6], [ex, ey - 6 + squint * 8], [ex + 8, ey - 4 + squint * 6]]), C.lid, 1.4, .7);
    wart(g, ex + s * 7, ey - 7, 2, C.wart, false);
  }
  g.restore();
  g.restore();
}

// ---------- registry ----------
// The Flask Bearer (r 18): scale .55, dy -10.4 puts its feet at r × 0.95 (the imp's size). The Cauldron Toad (r 24): scale .6, dy -7.2. Both die
// clips are 8 frames: combat.js plays them as a clip effect where the monster falls (render/draw.js plays 8 frames).
const clipOf = (n, fps, key, once) => ({ n, fps, once, pose:t => ({ [key]:t }) });
export const TOAD_FPS = 9, TOAD_N = 6;   // the lash clip; render/witchwood.js keys the long tongue to the same cycle
export const WITCHWOOD = {
  flaskbearer: { draw:flaskbearer, scale:.55, dy:-10.4, box:{ x:-60, y:-58, w:120, h:114 }, clips:{ walk:clipOf(8, 13, 'walk'), chew:clipOf(4, 8, 'chew'), die:clipOf(8, 13, 'die', true) }, still:{} },
  toad: { draw:toad, scale:.6, dy:-7.2, box:{ x:-80, y:-62, w:160, h:122 }, clips:{ walk:clipOf(8, 7, 'walk'), chew:clipOf(TOAD_N, TOAD_FPS, 'chew'), die:clipOf(8, 13, 'die', true) }, still:{} },
};
