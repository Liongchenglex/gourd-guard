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
//   ashcrone:    the Ash Crone, ported from the archive (docs/archive/nightmare-monsters/witches-mirror/): a hunched bone-haired hag in charcoal
//                rags and a crow-feather shawl under a wilted hat, leaning on a goat-skull staff; drained grey, red only in her pupils and the skull's
//                eyes. Clips: walk (a slow shuffle, ash falling), chew, hex (the staff lifts, the skull's eyes flare and smoke).
//   covenwitch:  the Blood Coven Witch, ported from the same file: a pale witch in a crimson high-collared cloak under a horned hat, a little iron
//                cauldron of blood swinging from one hand, a bone athame in the other. Clips: walk, chew, hex (the cauldron boils over).
//   triptych:    the Triptych Sprite, ported from witches-mirror/grand_mirror.js (variant 'grand'): a regal grey mirror sprite with glass-shard wings
//                and crown carrying a hinged three-panel mirror. Clips: walk, chew, reflect (held open in front), summon (thrown open, the barrier
//                flash). Her three-lane barrier is baked in render/fx.js (barrierSprite).
// Drawn around (0,0) in drawing units with the feet near y = 50. Every clip is baked by render/anim.js; nothing random per frame (rng(seed) only).
// Every palette sits inside a function, so lower builds (which never call these) keep none of it. Later Release 7 monsters go beside these.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../paint.js';
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

// ---------- the two witches (the Ash Crone and the Blood Coven Witch) ----------
// Ported from docs/archive/nightmare-monsters/witches-mirror/nightmare_witches.js (variants 'ash' and 'coven' of the witch), each with its own key.
// pose: { walk, chew, hex } (each 0..1, one at a time); the same clips as the game's witch (walk 8, chew 4, hex 6 once).
// pal() tints shadows purple and rims warm; the drained crone gets a neutral grey mixer like the Fallen Hexwitch.
const gpal = b => ({ base:b, light:mix(b, '#ffffff', .45), dark:mix(b, '#141416', .42), deep:mix(b, '#060608', .68), rim:mix(b, '#ffffff', .6) });
const rpal = b => ({ base:b, light:mix(b, '#ffd0c8', .4), dark:mix(b, '#1a0408', .42), deep:mix(b, '#0a0204', .68), rim:mix(b, '#ffe0d0', .55) });
const RED = '#ff2a3a';
let WPALS = null;
/** The witches' palettes (lazy, as P()). */
function WP(){
  return WPALS || (WPALS = {
    ash:{ face:gpal('#a2a2a8'), faced:gpal('#5c5c62'), hat:gpal('#232327'), band:gpal('#d8d4cc'), dress:gpal('#38383e'), cloak:gpal('#5c5c62'), shawl:gpal('#18181c'), boot:gpal('#1e1e22'),
      hair:gpal('#e6e2da'), bone:gpal('#dcd6ca'), skull:gpal('#ece8de'), twine:gpal('#46423e') },
    cov:{ face:pal('#f0dcd6'), faced:pal('#c49a96'), hat:rpal('#1c0a10'), band:rpal('#b0101e'), buckle:pal('#e0b04a'), dress:rpal('#22080e'), cloak:rpal('#9a1022'), lining:rpal('#140608'),
      boot:rpal('#1a0a0e'), hair:rpal('#1e1018'), horn:rpal('#2c1a18'), pot:gpal('#34343a'), blood:'#c8101e', bloodL:'#ff5a5a', bone:pal('#e6dccb'), lace:rpal('#d8b060') },
  });
}

// ---------- nightmare helpers ----------
/** Spark burst at (x, y) in colour col (light rays in lcol), strength s 0..1. */
function burst(g, x, y, s, col, lcol, seed = 31){
  if (s <= 0) return;
  g.save(); g.globalAlpha *= Math.min(1, s * 1.5); S.glow(g, x, y, 3 + s * 4, col);
  if (s > .4){ const R = rng(seed); g.strokeStyle = rgba(lcol, .9); g.lineWidth = 1.4; for (let i = 0; i < 6; i++){ const a = i * TAU / 6 + R() * .5, d = 7 + s * 12; g.beginPath(); g.moveTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); g.stroke(); } }
  g.restore();
}
/** Long gnarled hand: four bony fingers with long claws fanning around dir. */
function crookHand(g, x, y, c, dir, sp = .4, len = 11, claw = '#d8d2c6'){
  for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * (.22 + sp * .38); const kx = x + Math.cos(a) * len * .55, ky = y + Math.sin(a) * len * .55;
    S.tube(g, SO([[x, y], [kx, ky], [kx + Math.cos(a + .6) * len * .45, ky + Math.sin(a + .6) * len * .45]]), c, 2.6); S.claw(g, kx + Math.cos(a + .6) * len * .45, ky + Math.sin(a + .6) * len * .45, a + .6, 3.2, claw); }
  S.part(g, E(x, y, 4.8, 4.4), c, { x, y, r:4.8 }, { flat:true, mat:'skin' });
}

/** Crone face: narrow, long pointed chin, a long hooked nose with a wart, milky eyes with red pinpoint pupils, deep wrinkles,
 *  one snaggle tooth, long straggly bone-white hair. o.jaw, o.glow (eye glow 0..1), o.hair (sway). */
function croneFace(g, x, y, r, o = {}){
  const C = WP().ash; g.save(); g.translate(x, y); g.scale(r / 17, r / 17);
  const jaw = (o.jaw ?? 0) * 5, hs = o.hair ?? 0;
  // straggly hair falling past the shoulders, behind the head
  for (const s of [-1, 1]) for (const [a, b, c2, w] of [[[13, -10], [22, 10], [25, 32], 3.6], [[15, -4], [27, 16], [31, 26], 2]]){
    S.tube(g, SO([[s * a[0], a[1]], [s * b[0] + hs * s * .5, b[1]], [s * c2[0] + hs * s, c2[1]]]), C.hair, w); }
  const head = SM([[-15, -7], [-16, 4], [-11, 12], [-4, 19], [0, 22], [4, 19], [11, 12], [16, 4], [15, -7], [8, -16], [-8, -16]]);
  S.part(g, head, C.face, { x:0, y:1, r:18 }, { mat:'skin' });
  S.contact(g, head, -11, 8, 6, 5, .35); S.contact(g, head, 11, 8, 6, 5, .35); S.contact(g, head, -6.5, -2, 6, 5, .4); S.contact(g, head, 6.5, -2, 6, 5, .4);
  // wrinkles: brow furrows and crow's feet
  for (const s of [-1, 1]){ S.ln(g, [[s * 12, -9], [s * 3.5, -5.5]], C.faced, 2.2, .8); S.ln(g, [[s * 13, 1], [s * 15.5, 3]], C.faced, .9, .55); S.ln(g, [[s * 12.5, 3.5], [s * 14.5, 6.5]], C.faced, .9, .5); }
  S.ln(g, [[-5, -12.5], [5, -12.5]], C.faced, .9, .45); S.ln(g, [[-4, -10.5], [4, -10.5]], C.faced, .9, .4);
  // milky eyes: grey whites, heavy lids, tiny red pupils
  const eo = { lx:.15, ly:.15, pr:.28, pupil:'#7a0a14', lid:.4, lidCol:C.face.base, lidDeep:C.face.deep };
  S.eye(g, -6.5, -1, 5, 5.5, { ...eo, tilt:-.3 }); S.eye(g, 6.5, -1, 5, 5.5, { ...eo, tilt:.3 });
  for (const s of [-1, 1]){ g.save(); ell0(g, s * 6.5, -1, 5, 5.5); g.clip(); g.fillStyle = 'rgba(150,150,160,.35)'; g.fillRect(s * 6.5 - 5, -6.5, 10, 11); g.restore(); }
  const gl = .35 + (o.glow ?? 0) * .65; g.save(); g.globalAlpha *= gl; S.glow(g, -5.7, 0, 1.4 + (o.glow ?? 0) * 1.4, RED); S.glow(g, 7.3, 0, 1.4 + (o.glow ?? 0) * 1.4, RED); g.restore();
  // a long hooked nose hanging over the mouth, with a wart
  S.part(g, SM([[-2.5, -2], [3, 2], [9, 11], [9, 17], [5, 16], [3, 12], [-3, 8]], .7), C.face, { x:3, y:7, r:8 }, { flat:true, mat:'skin' });
  S.part(g, E(5.5, 6, 1.8, 1.7), C.faced, { x:5.5, y:6, r:1.8 }, { flat:true, noEdge:true });
  S.part(g, E(-9, 9, 2, 1.8), C.faced, { x:-9, y:9, r:2 }, { flat:true, noEdge:true });
  if (jaw > 0) S.dot(g, SM([[-7, 13], [-1, 14 + jaw], [5, 13], [-1, 12.5]], .8), '#0a0608');
  S.stroke(g, SO([[-8, 12], [-4, 15 + jaw * .4], [2, 15 + jaw * .4], [5, 13]]), C.face, 1.7);
  S.dot(g, PL([[-4.5, 14.5 + jaw * .3], [-2, 14 + jaw * .3], [-3.5, 18.5 + jaw * .3]]), '#d8d4c8');
  g.restore();
}
const ell0 = (g, x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); };

/** Coven face: pale and sharp, a widow's peak of long black hair, arched brows, crimson eyes, red lips with two little fangs,
 *  a blood sigil on the brow. o.jaw, o.glow, o.hair. */
function covenFace(g, x, y, r, o = {}){
  const C = WP().cov; g.save(); g.translate(x, y); g.scale(r / 17, r / 17);
  const jaw = (o.jaw ?? 0) * 5, hs = o.hair ?? 0;
  // long straight black hair falling behind, down to the waist
  const hair = SM([[-14, -14], [-20, 0], [-22, 20 + hs], [-24, 40 + hs * 1.5, 1], [-14, 34], [-6, 18], [6, 18], [14, 34], [24, 40 - hs * 1.5, 1], [22, 20 - hs], [20, 0], [14, -14], [0, -18]], .8);
  S.part(g, hair, C.hair, { x:0, y:6, r:24 }, { mat:'cloth', hx:-12, hy:-6 });
  for (const s of [-1, 1]) S.crease(g, SO([[s * 15, -2], [s * 18, 18], [s * 20, 34]]), C.hair, 1.4, .45);
  const head = SM([[-15, -8], [-15, 4], [-10, 12], [-3, 17], [0, 18], [3, 17], [10, 12], [15, 4], [15, -8], [8, -16], [-8, -16]]);
  S.part(g, head, C.face, { x:0, y:0, r:17 }, { mat:'skin' });
  S.part(g, SM([[-16, -6], [-14, -15], [-6, -19], [0, -11, 1], [6, -19], [14, -15], [16, -6], [12, -12], [0, -10], [-12, -12]], .8), C.hair, { x:0, y:-14, r:14 }, { flat:true, mat:'cloth' });   // the widow's peak
  for (const s of [-1, 1]) S.ln(g, [[s * 11.5, -7], [s * 7.5, -8.4], [s * 3.5, -6.4]], C.hair, 1.8, .9);
  const iris = '#d0101e';
  S.eye(g, -6.5, -1, 5.5, 6.2, { lx:.15, ly:.12, pr:.42, iris, lid:.24, tilt:-.4, lidCol:C.face.base, lidDeep:C.hair.base });
  S.eye(g, 6.5, -1, 5.5, 6.2, { lx:.15, ly:.12, pr:.42, iris, lid:.24, tilt:.4, lidCol:C.face.base, lidDeep:C.hair.base });
  for (const s of [-1, 1]){ S.ln(g, [[s * 11.5, -3.2], [s * 13.8, -5]], C.hair, 1.2, .9); S.ln(g, [[s * 11, -4.6], [s * 12.6, -7]], C.hair, 1, .9); }   // lashes
  if (o.glow){ g.save(); g.globalAlpha *= o.glow; S.glow(g, -5.6, -.3, 2.6, RED); S.glow(g, 7.4, -.3, 2.6, RED); g.restore(); }
  S.part(g, SM([[-1, 0], [2.5, 3], [4, 8], [1, 9], [-1.5, 6]], .7), C.face, { x:1, y:5, r:5 }, { flat:true, noEdge:true, mat:'skin' });
  S.ln(g, [[1, 9], [3.8, 8.2]], C.faced, 1, .6);
  // lips and fangs
  if (jaw > 0) S.dot(g, SM([[-6, 12], [0, 13 + jaw], [6, 12], [0, 11.5]], .8), '#1a0408');
  S.part(g, SM([[-6.5, 12], [-3, 10.6], [0, 11.4], [3, 10.6], [6.5, 12], [3, 13.6 + jaw * .5], [-3, 13.6 + jaw * .5]], .7), pal('#b81424'), { x:0, y:12, r:6 }, { flat:true, lw:1 });
  for (const s of [-1, 1]) S.dot(g, PL([[s * 2, 12.6 + jaw * .3], [s * 3.8, 12.6 + jaw * .3], [s * 2.9, 16 + jaw * .4]]), '#fff');
  // blood sigil on the brow
  g.save(); g.strokeStyle = rgba('#d0101e', .85 + (o.glow ?? 0) * .15); g.lineWidth = 1.1; g.lineCap = 'round';
  if (o.glow){ g.shadowColor = RED; g.shadowBlur = 4 * o.glow; }
  g.beginPath(); g.moveTo(0, -13.5); g.lineTo(0, -8.5); g.moveTo(-2.2, -11.8); g.lineTo(2.2, -11.8); g.stroke(); g.restore();
  S.blush(g, 0, 6, .5);
  g.restore();
}

/** Crone hat: a tall ragged cone whose tip has wilted over and hangs down to her right, a stitched patch and a torn hole,
 *  a band of knotted twine strung with finger bones, and a ragged brim. `dr` sways the hanging tip. */
function croneHat(g, x, y, w, dr = 0){
  const C = WP().ash, h = w * 2.1;
  const cone = SM([[x - w * .6, y + 1], [x - w * .42, y - h * .4], [x - w * .3, y - h * .78], [x - w * .1, y - h * .98], [x + w * .2, y - h * 1.02], [x + w * .5 + dr * .3, y - h * .88], [x + w * .64 + dr, y - h * .62, 1], [x + w * .46 + dr * .7, y - h * .7], [x + w * .26, y - h * .7], [x + w * .32, y - h * .42], [x + w * .58, y + 1]], .8);
  S.part(g, cone, C.hat, { x, y:y - h * .35, r:w * .95 }, { mat:'cloth', hx:x - w * .2, hy:y - h * .5 });
  S.crease(g, SO([[x - w * .3, y - h * .12], [x - w * .22, y - h * .5], [x - w * .02, y - h * .86]]), C.hat, 2, .45); S.crease(g, SO([[x + w * .12, y - h * .74], [x + w * .2, y - h * .9]]), C.hat, 2, .55);
  g.save(); cone(g); g.clip();
  // a stitched patch and a torn hole
  S.part(g, PL([[x + w * .02, y - h * .5], [x + w * .26, y - h * .54], [x + w * .24, y - h * .32], [x + w * .04, y - h * .3]]), gpal('#3a3a40'), { x:x + w * .14, y:y - h * .42, r:w * .2 }, { flat:true, mat:'cloth', lw:1 });
  g.strokeStyle = 'rgba(220,216,206,.75)'; g.lineWidth = .8; for (let i = 0; i < 4; i++){ const yy = y - h * (.5 - i * .055); g.beginPath(); g.moveTo(x + w * .01, yy - 1); g.lineTo(x + w * .06, yy + 1); g.stroke(); }
  S.dot(g, SM([[x - w * .28, y - h * .62], [x - w * .2, y - h * .68], [x - w * .14, y - h * .6], [x - w * .2, y - h * .55]], .7), '#060608');
  g.restore();
  S.thread(g, x + w * .64 + dr, y - h * .62, 1, C.hat);
  // band of twine with finger bones dangling
  S.part(g, SM([[x - w * .52, y - 1], [x + w * .52, y - 1], [x + w * .42, y - h * .16], [x - w * .46, y - h * .16]], .5), C.twine, { x, y:y - h * .08, r:w * .5 }, { flat:true, mat:'leather' });
  for (const [q, l] of [[-.32, 7], [-.12, 9], [.1, 6], [.3, 8]]){ const bx = x + w * q, by = y - h * .05; S.ln(g, [[bx, by], [bx + .5, by + 3]], C.twine, 1, .9);
    S.part(g, RR(bx - 1.2, by + 2.5, 2.4, l, 1.2), C.bone, { x:bx, y:by + 2.5 + l / 2, r:l / 2 }, { flat:true, mat:'bone', lw:.8 }); S.part(g, E(bx, by + 2.5 + l, 1.7, 1.4), C.bone, { x:bx, y:by + 2.5 + l, r:1.7 }, { flat:true, noEdge:true }); }
  // ragged brim
  const brim = SM([[x - w, y], [x - w * .8, y - w * .24], [x, y - w * .3], [x + w * .8, y - w * .24], [x + w, y], [x + w * .82, y + w * .2, 1], [x + w * .66, y + w * .14, 1], [x + w * .5, y + w * .28, 1], [x + w * .28, y + w * .18, 1], [x + w * .06, y + w * .3, 1], [x - w * .18, y + w * .2, 1], [x - w * .4, y + w * .3, 1], [x - w * .6, y + w * .16, 1], [x - w * .84, y + w * .22, 1]], .6);
  S.part(g, brim, C.hat, { x, y, r:w }, { flat:true, mat:'cloth', hx:x - w * .3, hy:y - w * .08 });
  for (const [q, s] of [[-.84, -1], [.82, 1], [.5, 1]]) S.thread(g, x + w * q, y + w * .2, s, C.hat);
}

/** Coven hat: a shorter crooked cone over a very wide brim, two black ram horns curling out of the cone, a crimson band with a gold buckle. */
function covenHat(g, x, y, w, tip = 0){
  const C = WP().cov, h = w * 1.7;
  // ram horns, behind the brim edge but in front of the cone: drawn after the cone below
  const cone = SM([[x - w * .5, y + 1], [x - w * .36, y - h * .42], [x - w * .1 + tip * .4, y - h * .8], [x + w * .1 + tip, y - h - 3], [x + w * .28 + tip * .7, y - h * .8], [x + w * .3, y - h * .42], [x + w * .5, y + 1]], .8);
  S.part(g, cone, C.hat, { x, y:y - h * .3, r:w * .8 }, { mat:'cloth', hx:x - w * .16, hy:y - h * .45 });
  S.crease(g, SO([[x - w * .2, y - h * .12], [x - w * .1, y - h * .5], [x + tip * .3, y - h * .78]]), C.hat, 2, .45);
  for (const s of [-1, 1]){   // horns: thick at the cone, curling out, back and down, tapering in three runs, with growth rings
    const hx0 = x + s * w * .3, hy0 = y - h * .42;
    const pts = [[hx0, hy0], [hx0 + s * 10, hy0 - 9], [hx0 + s * 20, hy0 - 6], [hx0 + s * 23, hy0 + 3], [hx0 + s * 18, hy0 + 8], [hx0 + s * 14, hy0 + 4]];
    S.tube(g, SO(pts.slice(0, 3)), C.horn, 7); S.tube(g, SO(pts.slice(1, 5)), C.horn, 5); S.tube(g, SO(pts.slice(3)), C.horn, 3);
    g.strokeStyle = rgba(C.horn.light, .45); g.lineWidth = .9; for (const [a, b] of [[pts[1], -1], [pts[2], 1]]){ g.beginPath(); g.moveTo(a[0] - 2.5, a[1] - 2.5 * b); g.lineTo(a[0] + 2.5, a[1] + 2.5 * b); g.stroke(); } }
  S.part(g, SM([[x - w * .44, y - 1], [x + w * .44, y - 1], [x + w * .34, y - h * .26], [x - w * .38, y - h * .26]], .5), C.band, { x, y:y - h * .12, r:w * .45 }, { flat:true, mat:'cloth' });
  S.part(g, RR(x - w * .1, y - h * .22, w * .2, h * .17, 2), C.buckle, { x, y:y - h * .13, r:w * .12 }, { flat:true, mat:'metal' });
  S.glow(g, x, y - h * .13, 1.6, RED);
  const brim = SM([[x - w, y + 1], [x - w * .7, y - w * .2], [x, y - w * .24], [x + w * .7, y - w * .2], [x + w, y + 1], [x + w * .6, y + w * .2], [x, y + w * .24], [x - w * .6, y + w * .2]], .8);
  S.part(g, brim, C.hat, { x, y, r:w }, { flat:true, mat:'cloth', hx:x - w * .3, hy:y - w * .08 });
  S.crease(g, SO([[x - w * .9, y + 2], [x - w * .5, y + w * .16], [x, y + w * .2], [x + w * .5, y + w * .16], [x + w * .9, y + 2]]), C.hat, 1.2, .35);
}

/** Bone staff from the ground at (x, y0) to the top (x, y1), gnarled, crowned with a horned goat skull with red eyes, bone charms
 *  hanging under it. eye = glow of the skull's eyes (0..1), sw = charm sway. */
function skullStaff(g, x, y0, y1, eye, sw = 0){
  const C = WP().ash;
  S.tube(g, SO([[x + 1, y0], [x - 1.5, (y0 + y1) * .5 + 6], [x + 1, y1 + 10], [x, y1]]), C.bone, 4.6);
  for (const yy of [y1 + 26, y1 + 52, y1 + 80]) if (yy < y0 - 4){ S.part(g, E(x, yy, 3.6, 2.2), C.bone, { x, y:yy, r:3.6 }, { flat:true, mat:'bone', lw:1 }); }
  // charms on twine: a finger bone and a little bird skull
  S.ln(g, [[x - 2, y1 + 8], [x - 7 + sw, y1 + 20]], C.twine, 1, .9); S.part(g, RR(x - 8.2 + sw, y1 + 19, 2.4, 8, 1.2), C.bone, { x:x - 7 + sw, y:y1 + 23, r:4 }, { flat:true, mat:'bone', lw:.8 });
  S.ln(g, [[x + 2, y1 + 8], [x + 6 + sw * .7, y1 + 16]], C.twine, 1, .9); S.part(g, E(x + 6.5 + sw * .7, y1 + 18, 2.6, 2.2), C.bone, { x:x + 6.5, y:y1 + 18, r:2.6 }, { flat:true, mat:'bone', lw:.8 });
  S.dot(g, PL([[x + 6 + sw * .7, y1 + 19.5], [x + 8.5 + sw * .7, y1 + 19.5], [x + 7 + sw * .7, y1 + 24]]), C.bone.dark);
  // horns curling back from the skull, then the skull: wide brow, long snout, dark sockets
  const sy = y1 - 2;
  for (const s of [-1, 1]){ const pts = [[x + s * 5, sy - 5], [x + s * 13, sy - 11], [x + s * 18, sy - 4], [x + s * 15, sy + 2], [x + s * 11, sy]];
    S.tube(g, SO(pts.slice(0, 3)), C.bone, 4.2); S.tube(g, SO(pts.slice(2)), C.bone, 2.6); }
  const skull = SM([[x - 7, sy - 6], [x - 8, sy + 1], [x - 4, sy + 6], [x - 3, sy + 12], [x, sy + 14], [x + 3, sy + 12], [x + 4, sy + 6], [x + 8, sy + 1], [x + 7, sy - 6], [x, sy - 9]], .8);
  S.part(g, skull, C.skull, { x, y:sy + 1, r:9 }, { mat:'bone', hx:x - 3, hy:sy - 5 });
  for (const s of [-1, 1]) S.dot(g, SM([[x + s * 1.5, sy - 2], [x + s * 6, sy - 3], [x + s * 5.5, sy + 2.5], [x + s * 2, sy + 2]], .7), '#0a0608');
  S.dot(g, E(x - 1, sy + 10, .9, 1.4), '#0a0608'); S.dot(g, E(x + 1, sy + 10, .9, 1.4), '#0a0608');
  g.save(); g.globalAlpha *= .45 + eye * .55; S.glow(g, x - 3.6, sy - .2, 1.3 + eye * 1.6, RED); S.glow(g, x + 3.6, sy - .2, 1.3 + eye * 1.6, RED); g.restore();
  if (eye > .2){   // ash and red smoke curling up off the skull
    g.save(); g.globalAlpha *= Math.min(1, (eye - .2) * 1.6); const R = rng(57);
    for (let i = 0; i < 7; i++){ const a = -Math.PI / 2 + (R() - .5) * 2.4, d = 8 + R() * 10 + eye * 8, rr = 1.6 + R() * 2.4; S.dot(g, E(x + Math.cos(a) * d, sy + Math.sin(a) * d, rr, rr), i % 3 ? '#6a6a72' : RED, .8); }
    g.restore(); }
}

/** Small iron cauldron hanging from a bail at (x, y) (the bail top), boiling blood. boil 0..1 = the hex boil-over. */
function bloodPot(g, x, y, boil, bub){
  const C = WP().cov;
  S.stroke(g, SO([[x - 8, y + 9], [x, y], [x + 8, y + 9]]), C.pot, 1.4, .9);
  const pot = SM([[x - 10, y + 8], [x + 10, y + 8], [x + 12, y + 16], [x + 7, y + 23], [x - 7, y + 23], [x - 12, y + 16]], .8);
  S.part(g, pot, C.pot, { x, y:y + 15, r:11 }, { mat:'metal' }); S.tube(g, SO([[x - 11, y + 9], [x + 11, y + 9]]), C.pot, 2.6);
  for (const s of [-1, 1]) S.part(g, E(x + s * 6, y + 24, 2.2, 1.6), C.pot, { x:x + s * 6, y:y + 24, r:2.2 }, { flat:true, noEdge:true });
  g.save(); g.shadowColor = RED; g.shadowBlur = 5 + boil * 6; S.dot(g, E(x, y + 8, 9, 2.4), C.blood, 1); g.restore();
  S.dot(g, E(x - 2, y + 7.5, 4, 1), C.bloodL, .6);
  for (const [bx, by] of [[-4, 6], [3, 4]]) S.dot(g, E(x + bx, y + by - bub * 2, 1.5, 1.5), C.bloodL, .85);
  if (boil > 0){   // boiling over: red flame tongues and drips running down the iron
    g.save(); g.globalAlpha *= Math.min(1, boil * 1.4); g.shadowColor = RED; g.shadowBlur = 8; const l = boil * 10;
    S.dot(g, SM([[x - 9, y + 8], [x - 10, y - 2 - l * .6, 1], [x - 5, y + 2], [x - 2, y - 8 - l, 1], [x + 1, y + 2], [x + 5, y - 5 - l * .8, 1], [x + 7, y + 3], [x + 10, y - l * .4, 1], [x + 9, y + 8]], .6), '#b0101e', .9);
    S.dot(g, SM([[x - 5, y + 7], [x - 4, y - 2 - l * .5, 1], [x, y + 3], [x + 2, y - 4 - l * .6, 1], [x + 5, y + 7]], .6), '#ff7060', .9);
    for (const [dx, dy, dl] of [[-10, 10, 6 + boil * 4], [9, 11, 4 + boil * 3], [-3, 9, 5]]){ S.dot(g, RR(x + dx - 1.1, y + dy, 2.2, dl, 1.1), C.blood, .9); S.dot(g, E(x + dx, y + dy + dl, 1.6, 1.8), C.blood, .95); }
    g.restore(); }
}

// ---------- the Ash Crone (ported from docs/archive/nightmare-monsters/witches-mirror/nightmare_witches.js, variant 'ash') ----------
export function ashcrone(g, P0 = {}){
  const C = WP().ash, w = P0.walk, ch = P0.chew, hx = P0.hex, sw = w == null ? 0 : Math.sin(w * TAU), cw = w == null ? 0 : Math.cos(w * TAU);
  // a slow, heavy shuffle: smaller bob, more sway
  const bob = w != null ? -Math.abs(sw) * 1.8 : ch != null ? Math.sin(ch * TAU) * 2.5 : 0, lean = ch == null ? 0 : .5 + Math.sin(ch * TAU) * .5, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  const raise = hx == null ? 0 : Math.sin(Math.min(1, hx * 1.4) * Math.PI) ** .7, spark = hx == null ? 0 : Math.max(0, Math.sin(hx * Math.PI));
  const sway = w == null ? 0 : sw * .04;
  // falling ash, behind her (stable flakes that drift with the clip phase)
  { const R = rng(73), t = w ?? ch ?? hx ?? 0; g.save();
    for (let i = 0; i < 6; i++){ const x0 = -42 + R() * 86, y0 = -90 + R() * 130, y = ((y0 + 90 + t * 40) % 130) - 90, x = x0 + Math.sin(t * TAU + i) * 3, rr = .9 + R() * 1.4; S.dot(g, E(x, y, rr * 1.4, rr), i % 2 ? '#8a8a92' : '#c8c8cc', .55); }
    g.restore(); }
  S.shadow(g, 2, 50, 28, 5);
  // the staff stands in her right hand; its foot stays on the ground except when she lifts it in the hex
  const stX = 33 + sw * 2, stTop = -64 - raise * 12, stFoot = 49 - raise * 12, tiltS = -raise * .18 + sway;
  // bony feet in ragged wraps, shuffling
  for (const s of [-1, 1]){ const ph = w == null ? null : w * TAU + (s < 0 ? 0 : Math.PI), lift = ph == null ? 0 : Math.max(0, Math.sin(ph)) * 4, dx = ph == null ? 0 : Math.cos(ph) * 3;
    S.tube(g, SO([[s * 6, 30], [s * 7 + dx, 42 - lift]]), C.face, 4.5);
    S.part(g, SM([[s * 2 + dx, 41 - lift], [s * 12 + dx, 41 - lift], [s * 17 + dx, 47 - lift], [s * 18 + dx, 44 - lift, 1], [s * 19 + dx, 49 - lift], [s * 7 + dx, 50 - lift], [s * 1 + dx, 47 - lift]], .6), C.boot, { x:s * 9 + dx, y:46 - lift, r:8 }, { flat:true, mat:'cloth' }); }
  g.save(); g.translate(0, bob); g.rotate(sway); g.translate(0, lean * 3);
  // staff behind the body
  g.save(); g.translate(stX, stFoot); g.rotate(tiltS); skullStaff(g, 0, 0, stTop - stFoot, spark, cw * 2); g.restore();
  // long ragged cloak to the ground, wide at the hem
  const cloak = SM([[-15, -12], [-26, 8], [-32, 30], [-33, 44, 1], [-24, 38, 1], [-18, 46, 1], [-10, 39, 1], [-3, 47, 1], [4, 40, 1], [11, 47, 1], [18, 39, 1], [25, 45, 1], [33, 40, 1], [27, 8], [15, -12]], .8);
  S.part(g, cloak, C.cloak, { x:0, y:14, r:30 }, { mat:'cloth', hx:-12, hy:0 });
  for (const [x, y, s] of [[-33, 44, -1], [-18, 46, -1], [-3, 47, 1], [11, 47, 1], [25, 45, 1]]) S.thread(g, x, y, s, C.cloak);
  g.save(); cloak(g); g.clip(); for (const [x, y, r] of [[-20, 28, 3], [16, 22, 2.4]]) S.dot(g, E(x, y, r, r * .8), '#08080a', .9); g.restore();   // moth holes
  const dress = SM([[-9, -8], [-13, 10], [-16, 38], [0, 41], [16, 38], [13, 10], [9, -8]], .8);
  S.part(g, dress, C.dress, { x:0, y:16, r:18 }, { mat:'cloth' }); S.crease(g, SO([[-5, 2], [-7, 36]]), C.dress, 1.6, .45); S.crease(g, SO([[5, 2], [8, 36]]), C.dress, 1.6, .45);
  // rope belt with a bone toggle
  S.tube(g, SO([[-12, 8], [0, 10], [12, 8]]), C.twine, 2.6); S.ln(g, [[-2, 10], [-4, 20]], C.twine, 1.4, .9); S.part(g, RR(-6, 19, 4, 7, 2), C.bone, { x:-4, y:22, r:4 }, { flat:true, mat:'bone', lw:.8 });
  // the hump: a crow-feather shawl high on the shoulders, drawn as overlapping feathers
  const R = rng(91);
  for (let i = 0; i < 13; i++){ const a = Math.PI + .15 + i * (Math.PI - .3) / 12, d = 16 + R() * 3, fx = Math.cos(a) * d * 1.15, fy = -6 + Math.sin(a) * d * -.55 + 6, ang = Math.atan2(fy + 2, fx) ;
    g.save(); g.translate(fx, fy + 4); g.rotate(ang - Math.PI / 2 + (fx < 0 ? .2 : -.2));
    S.part(g, SM([[-4, -2], [4, -2], [3, 10], [0, 15, 1], [-3, 10]], .7), C.shawl, { x:0, y:5, r:7 }, { flat:true, mat:'leather', lw:1 }); S.ln(g, [[0, -1], [0, 12]], { deep:'#5a5a62' }, .7, .7); g.restore(); }
  S.part(g, SM([[-20, -10], [-12, -16], [0, -14], [12, -16], [20, -10], [14, 0], [0, 4], [-14, 0]], .8), C.shawl, { x:0, y:-6, r:20 }, { mat:'leather', hx:-8, hy:-12 });
  // left arm: a gnarled hand held up, clawing, in front of the chest
  const la = w == null ? 0 : sw * .2;
  g.save(); g.translate(-12, -6); g.rotate(la - raise * .5); S.tube(g, SO([[0, 0], [-8, 10], [-6, 18]]), C.cloak, 5.5); crookHand(g, -5, 20, C.face, -Math.PI * .4 - raise * .6, .5 + raise * .4); g.restore();
  // right arm out to the staff
  const gy = Math.max(-28, stTop + 34);
  const hgx = stX + Math.sin(tiltS) * (stFoot - gy) - 2, hgy = gy;
  S.tube(g, SO([[12, -6], [20, -2 + (hgy + 2) * .3], [hgx - 2, hgy + 2]]), C.cloak, 5.5);
  S.part(g, E(hgx, hgy, 4.4, 4.6), C.face, { x:hgx, y:hgy, r:4.4 }, { flat:true, mat:'skin' });
  for (let i = 0; i < 3; i++) S.tube(g, SO([[hgx + 2, hgy - 2 + i * 2.4], [hgx + 5, hgy - 1 + i * 2.4], [hgx + 4.5, hgy + 1 + i * 2.4]]), C.face, 2.2);
  // head hangs lower and forward (the hunch), then the hat
  const hy = -17 + lean * 2;
  croneFace(g, 0, hy, 15, { jaw, glow:spark, hair:sw * 1.5 });
  croneHat(g, 0, hy - 14, 27, (w == null ? 0 : sw * 2.5) - raise * 2);
  g.restore();
}

// ---------- the Blood Coven Witch (ported from the same file, variant 'coven') ----------
export function covenwitch(g, P0 = {}){
  const C = WP().cov, w = P0.walk, ch = P0.chew, hx = P0.hex, sw = w == null ? 0 : Math.sin(w * TAU);
  const bob = w != null ? -Math.abs(sw) * 2.5 : ch != null ? Math.sin(ch * TAU) * 2.5 : 0, lean = ch == null ? 0 : .5 + Math.sin(ch * TAU) * .5, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  const raise = hx == null ? 0 : Math.sin(Math.min(1, hx * 1.4) * Math.PI) ** .7, spark = hx == null ? 0 : Math.max(0, Math.sin(hx * Math.PI)), back = raise * .1;
  const t = w ?? ch ?? hx ?? 0;
  S.shadow(g, 0, 50, 28, 5);
  // pointed heeled boots
  for (const s of [-1, 1]){ const ph = w == null ? null : w * TAU + (s < 0 ? 0 : Math.PI), lift = ph == null ? 0 : Math.max(0, Math.sin(ph)) * 6, dx = ph == null ? 0 : Math.cos(ph) * 4;
    S.tube(g, SO([[s * 7, 30], [s * 8 + dx, 42 - lift]]), C.boot, 6);
    S.part(g, SM([[s * 3 + dx, 40 - lift], [s * 12 + dx, 41 - lift], [s * 20 + dx, 46 - lift, 1], [s * 10 + dx, 50 - lift], [s * 4 + dx, 50 - lift, 1], [s * 2 + dx, 46 - lift]], .6), C.boot, { x:s * 10 + dx, y:45 - lift, r:8 }, { flat:true, mat:'leather' }); }
  g.save(); g.translate(0, bob); g.rotate(-back); g.translate(0, lean * 3);
  // high vampiric collar behind the head, then the crimson cloak with a black lining showing at the front
  const fl = Math.sin(t * TAU + 1) * 2;
  const collar = SM([[-13, -6], [-24, -18], [-26, -34, 1], [-16, -26], [-8, -14], [8, -14], [16, -26], [26, -34, 1], [24, -18], [13, -6]], .8);
  S.part(g, collar, C.lining, { x:0, y:-18, r:24 }, { flat:true, mat:'cloth', lw:1.2 });
  S.part(g, SM([[-14, -8], [-23, -18], [-25, -30, 1], [-20, -21], [-12, -12]], .7), C.cloak, { x:-19, y:-18, r:10 }, { flat:true, mat:'cloth', lw:1 });
  S.part(g, SM([[14, -8], [23, -18], [25, -30, 1], [20, -21], [12, -12]], .7), C.cloak, { x:19, y:-18, r:10 }, { flat:true, mat:'cloth', lw:1 });
  const cloak = SM([[-14, -8], [-26, 10], [-31, 38 + fl, 1], [-20, 34, 1], [-11, 41 + fl, 1], [0, 36, 1], [11, 41 - fl, 1], [20, 34, 1], [31, 38 - fl, 1], [26, 10], [14, -8]], .8);
  S.part(g, cloak, C.cloak, { x:0, y:14, r:30 }, { mat:'cloth', hx:-12, hy:0 });
  S.crease(g, SO([[-18, 2], [-24, 32]]), C.cloak, 1.8, .4); S.crease(g, SO([[18, 2], [24, 32]]), C.cloak, 1.8, .4);
  const dress = SM([[-10, -6], [-13, 10], [-18, 38], [0, 41], [18, 38], [13, 10], [10, -6]], .8);
  S.part(g, dress, C.dress, { x:0, y:16, r:19 }, { mat:'cloth' }); S.crease(g, SO([[-5, 14], [-8, 36]]), C.dress, 1.6, .45); S.crease(g, SO([[5, 14], [9, 36]]), C.dress, 1.6, .45);
  // corset: crimson panel with gold lacing
  const cor = SM([[-8, -4], [8, -4], [9, 12], [0, 16], [-9, 12]], .6);
  S.part(g, cor, C.band, { x:0, y:5, r:10 }, { flat:true, mat:'cloth' });
  g.strokeStyle = rgba(C.lace.base, .95); g.lineWidth = .9; for (let i = 0; i < 4; i++){ const y = -1 + i * 3.6; g.beginPath(); g.moveTo(-2.5, y); g.lineTo(2.5, y + 3); g.moveTo(2.5, y); g.lineTo(-2.5, y + 3); g.stroke(); }
  // left arm carries the blood cauldron by its bail, swinging against the walk
  const swing = w == null ? 0 : sw * .25;
  g.save(); g.translate(-10, -3); g.rotate(swing + raise * .15);
  S.tube(g, SO([[0, 0], [-7, 9], [-9, 18]]), C.cloak, 6);
  g.save(); g.translate(-9, 21); g.rotate(-swing * 1.6 - raise * .15); bloodPot(g, 0, 0, spark, Math.sin(t * TAU * 2) * .5 + .5); g.restore();
  S.hand(g, -9, 20, C.face, Math.PI * .5, 3, 3.8); g.restore();
  // right arm raises the bone athame
  const aa = .5 - raise * 1.5 + (w == null ? 0 : -sw * .2);
  g.save(); g.translate(10, -2); g.rotate(aa); S.tube(g, SO([[0, 0], [10, 8], [18, 12]]), C.cloak, 6); S.hand(g, 20, 13, C.face, 0, 3, 4);
  g.save(); g.translate(20, 13); g.rotate(.1 - raise * 1.0);
  S.tube(g, SO([[-2, 5], [1, -6]]), C.lining, 3.4); S.tube(g, SO([[-4, -6], [6, -7]]), C.bone, 2.4);   // grip and crossguard
  S.part(g, PL([[-1, -7], [4, -7], [3, -20], [1.8, -27], [0, -20]]), C.bone, { x:1.5, y:-15, r:7 }, { flat:true, mat:'bone', lw:1 });
  S.ln(g, [[1.8, -9], [1.8, -23]], C.bone, .8, .4);
  g.save(); g.shadowColor = RED; g.shadowBlur = 4; S.dot(g, E(1, -7, 2, 2), '#e01020'); g.restore();
  burst(g, 1.8, -27, spark, RED, '#ffd0c8', 31);
  g.restore(); g.restore();
  // head, high-collared, under the wide horned hat
  covenFace(g, 0, -22, 15, { jaw, glow:.25 + spark * .75, hair:sw * 2 });
  S.contact(g, dress, 0, -8, 10, 4, .45);
  covenHat(g, 1, -37, 30, 5 + (w == null ? 0 : sw * 2) - raise * 4);
  g.restore();
}

// ---------- the Triptych Sprite (ported from docs/archive/nightmare-monsters/witches-mirror/grand_mirror.js, variant 'grand') ----------
// pose: { walk, chew, reflect, summon } (each 0..1, one at a time). The three-lane barrier is a baked field prop in render/fx.js.
let TPALS = null;
/** Her palettes (lazy): neutral greys with red, the glass kept pale blue so it still reads as a mirror. */
function TP(){
  return TPALS || (TPALS = { skin:gpal('#d2d2da'), hair:gpal('#eeeef2'), gown:gpal('#2c2c34'), trim:gpal('#b4b4c0'), wing:gpal('#e4ecf4'), frame:gpal('#a6a6b2'), back:gpal('#3a3a42'), crown:gpal('#dfe8f4'), vein:pal('#c01828') });
}
const tstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
/** Arched panel: a rectangle w × h centred on (x, y) with a round top. */
const archP = (x, y, w, h) => g => { const r = w / 2; g.beginPath(); g.moveTo(x - r, y + h / 2); g.lineTo(x - r, y - h / 2 + r); g.arc(x, y - h / 2 + r, r, Math.PI, 0); g.lineTo(x + r, y + h / 2); g.closePath(); };
/** Mirror glass filling path p: pale gradient, two sheen bands at offset k (-1..1), optionally a few fine cracks. */
function glassFill(g, p, x, y, w, h, k, lit, cracked){
  g.save(); if (lit > 0){ g.shadowColor = '#d8ecff'; g.shadowBlur = 6 + lit * 10; }
  p(g); g.fillStyle = '#9ab4d8'; g.fill(); g.restore();
  g.save(); p(g); g.clip();
  const gl = g.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2); gl.addColorStop(0, '#ffffff'); gl.addColorStop(.45, mix('#bcd8f4', '#ffffff', lit * .4)); gl.addColorStop(1, '#6f8cc0'); g.fillStyle = gl; g.fillRect(x - w, y - h, w * 2, h * 2);
  const o = k * w; g.fillStyle = `rgba(255,255,255,${.55 + lit * .35})`; g.beginPath(); g.moveTo(x - w * .4 + o, y + h / 2); g.lineTo(x - w * .05 + o, y - h / 2); g.lineTo(x + w * .12 + o, y - h / 2); g.lineTo(x - w * .23 + o, y + h / 2); g.closePath(); g.fill();
  g.fillStyle = `rgba(255,255,255,${.3 + lit * .3})`; g.beginPath(); g.moveTo(x - w * .02 + o, y + h / 2); g.lineTo(x + w * .3 + o, y - h / 2); g.lineTo(x + w * .38 + o, y - h / 2); g.lineTo(x + w * .06 + o, y + h / 2); g.closePath(); g.fill();
  if (cracked){ g.strokeStyle = 'rgba(40,40,60,.45)'; g.lineWidth = .7; g.beginPath(); g.moveTo(x + w * .3, y + h * .1); g.lineTo(x + w * .05, y + h * .2); g.lineTo(x - w * .2, y + h * .42); g.moveTo(x + w * .05, y + h * .2); g.lineTo(x + w * .12, y + h * .48); g.stroke(); }
  g.restore();
}
/** The triptych at (x, y) (centre of the middle panel): a 22 × 32 arched mirror in a silver frame with a red gem, two hinged doors opening by
 *  o (0 shut → 1 open), glass lit by `lit` (0..1), sheen offset k. */
function triptychPanel(g, x, y, o, lit, k){
  const C = TP(), W = 22, H = 32, F = 3;
  S.part(g, archP(x, y, W + F * 2, H + F * 2), C.frame, { x, y, r:H * .6 }, { mat:'metal', flat:true, lw:1.3 });
  glassFill(g, archP(x, y + .5, W - 1, H - 1), x, y, W, H, k, lit, false);
  S.stroke(g, archP(x, y + .5, W - 1, H - 1), C.frame, 1, .7);
  S.part(g, PL([[x - 3, y - H / 2 - F + 1], [x, y - H / 2 - F - 6], [x + 3, y - H / 2 - F + 1]]), C.frame, { x, y:y - H / 2 - F - 2, r:4 }, { flat:true, mat:'metal', lw:1 });
  g.save(); g.shadowColor = RED; g.shadowBlur = 3 + lit * 6; S.dot(g, E(x, y - H / 2 - F - 1, 2.6, 2.6), '#e8101e'); g.restore(); S.dot(g, E(x - .8, y - H / 2 - F - 2, .9, .9), '#fff', .8);
  S.part(g, RR(x - 6, y + H / 2 + F - 1, 12, 4, 2), C.frame, { x, y:y + H / 2 + F + 1, r:6 }, { flat:true, mat:'metal', lw:1 });
  // the doors: hinged at the panel's sides; past 90° their glass faces us, before it their backs do
  const th = Math.PI * (1 - o) + .32 * o, cs = Math.cos(th), sn = Math.sin(th), DW = 13;
  for (const s of [-1, 1]){
    const hx = x + s * (W / 2 + F), ox = hx + s * DW * cs, top0 = y - H / 2 + 4, bot0 = y + H / 2 + F - 1, grow = 1 + sn * .1;
    const yt = top0 - 2 - (grow - 1) * 10, yb = bot0 + (grow - 1) * 6, ot = y - H / 2 + 8 - (grow - 1) * 10;
    const door = PL([[hx, top0], [hx, bot0], [ox, yb], [ox, ot], [ox + (hx - ox) * .4, yt]]);
    if (Math.abs(cs) < .08){ S.tube(g, SO([[hx, top0], [hx, bot0]]), C.frame, 3); continue; }
    if (cs > 0){   // open: glass facing us
      S.part(g, door, C.frame, { x:(hx + ox) / 2, y, r:H * .5 }, { mat:'metal', flat:true, lw:1.2 });
      const dg = PL([[hx + s * 1.6, top0 + 2], [hx + s * 1.6, bot0 - 2], [ox - s * 1.8, yb - 2.5], [ox - s * 1.8, ot + 2], [ox + (hx - ox) * .4, yt + 2.5]]);
      glassFill(g, dg, (hx + ox) / 2, y, Math.abs(ox - hx), H, k * .8 + s * .2, lit * .9, true);
    } else {   // shut: the back of the door, dark silver-grey with a red eye sigil
      S.part(g, door, C.back, { x:(hx + ox) / 2, y, r:H * .5 }, { mat:'metal', flat:true, lw:1.2 });
      g.save(); door(g); g.clip(); const ex = hx + (ox - hx) * .5, ey = y + 1, ew = Math.abs(ox - hx) * .36;
      g.strokeStyle = rgba(C.frame.light, .55); g.lineWidth = 1; g.beginPath(); g.moveTo(hx + (ox - hx) * .12, y - H * .32); g.lineTo(hx + (ox - hx) * .12, y + H * .4); g.moveTo(hx + (ox - hx) * .88, y - H * .26); g.lineTo(hx + (ox - hx) * .88, y + H * .44); g.stroke();
      if (ew > 1.5){ S.dot(g, SM([[ex - ew, ey], [ex, ey - ew * .7], [ex + ew, ey], [ex, ey + ew * .7]], .9), '#0c0c10', .9); g.save(); g.shadowColor = RED; g.shadowBlur = 4; S.dot(g, E(ex, ey, ew * .32, ew * .45), RED); g.restore(); }
      g.restore(); }
    for (const yy of [top0 + 4, bot0 - 4]) S.rivet(g, hx, yy, 1.4, C.frame);
  }
}
/** Shard-wing: an angular glass wing between points, gel-shaded, with red veins. */
function shardWing(g, pts, b, veins){
  const C = TP();
  g.save(); g.globalAlpha *= .85; S.part(g, SM(pts, .5), C.wing, b, { flat:true, mat:'gel', lw:1.2 }); g.restore();
  for (const v of veins) S.crease(g, SO(v), C.vein, 1, .55);
}
/** The Triptych Sprite: a bigger (×1.2), regal mirror sprite drained grey: silver skin and long floating hair, a crown of glass shards with a red
 *  gem, a charcoal gown with a shard-cut hem, two pairs of jagged glass-shard wings with red veins. She carries a tall arched mirror with two
 *  hinged doors: shut at her side on the walk and chew (the doors' backs show a red eye sigil), held open in front of her while she reflects,
 *  swung up and thrown open in `summon`, which flashes sideways as the three-lane barrier goes up. */
export function triptych(g, P0 = {}){
  const G = TP();
  const w = P0.walk, ch = P0.chew, rf = P0.reflect, sm = P0.summon, t = w ?? rf ?? ch ?? sm ?? 0;
  const flap = Math.sin(t * TAU * 2), hover = ch == null ? Math.sin(t * TAU) * 3 : Math.sin(ch * TAU) * 2, lean = ch == null ? 0 : .5 + Math.sin(ch * TAU) * .5, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  // triptych placement: at her right side, shut (walk / chew); in front, open (reflect); summon swings it in, throws it high and open, flashes, then settles in front
  let tx = 23, ty = 14, tr = .42, ts = .78, open = 0, lit = 0, arms = 0, flash = 0;
  if (rf != null){ tx = 0; ty = 25; tr = 0; ts = .88; open = 1; lit = .55 + Math.sin(rf * TAU) * .25; arms = 1; }
  if (sm != null){ const a = tstep(0, .3, sm), up = tstep(.25, .5, sm) * (1 - tstep(.78, 1, sm));
    tx = 23 * (1 - a); tr = .42 * (1 - a); ts = .78 + .1 * a + up * .1; ty = 14 * (1 - a) + 27 * a;
    open = tstep(.32, .6, sm); arms = a; lit = tstep(.45, .6, sm) * (1 - tstep(.85, 1, sm) * .45); flash = Math.max(0, Math.sin(clamp01((sm - .52) / .4) * Math.PI)); }
  const k = -1 + ((rf ?? sm ?? 0) * 2);
  g.save(); g.translate(0, 50); g.scale(1.2, 1.2); g.translate(0, -50);
  S.shadow(g, 0, 50, 24 - Math.abs(hover), 4);
  g.save(); g.translate(0, hover + lean * 6);
  // sideways flash behind her: the barrier being thrown out across three lanes
  if (flash > 0){ g.save(); g.globalAlpha *= flash;
    const gr = g.createLinearGradient(-58, 0, 58, 0); gr.addColorStop(0, 'rgba(220,236,255,0)'); gr.addColorStop(.25, 'rgba(220,236,255,.6)'); gr.addColorStop(.5, 'rgba(255,255,255,.95)'); gr.addColorStop(.75, 'rgba(220,236,255,.6)'); gr.addColorStop(1, 'rgba(220,236,255,0)');
    g.fillStyle = gr; const by = ty - 4; g.beginPath(); g.moveTo(-58, by - 2); g.quadraticCurveTo(0, by - 14 - flash * 6, 58, by - 2); g.lineTo(58, by + 4); g.quadraticCurveTo(0, by + 12 + flash * 4, -58, by + 4); g.closePath(); g.fill();
    const R = rng(13); for (let i = 0; i < 10; i++){ const sx = (R() - .5) * 104 * (.4 + flash * .6), sy = by + (R() - .5) * 18, ss = 1.2 + R() * 2; g.strokeStyle = i % 4 ? '#ffffff' : RED; g.lineWidth = 1; g.beginPath(); g.moveTo(sx - ss, sy); g.lineTo(sx + ss, sy); g.moveTo(sx, sy - ss); g.lineTo(sx, sy + ss); g.stroke(); }
    g.restore(); }
  // two pairs of glass-shard wings
  for (const s of [-1, 1]){ const lift = flap * 8 + (sm != null ? flash * 6 : 0);
    shardWing(g, [[s * 6, -6, 1], [s * 14, -26 - lift, 1], [s * 30, -40 - lift, 1], [s * 34, -30 - lift, 1], [s * 46, -38 - lift * .9, 1], [s * 44, -20 - lift * .6, 1], [s * 50, -12 - lift * .5, 1], [s * 34, -2, 1], [s * 14, 2, 1]], { x:s * 28, y:-18, r:24 },
      [[[s * 8, -4], [s * 26, -24 - lift * .8], [s * 40, -32 - lift * .9]], [[s * 8, -1], [s * 32, -12 - lift * .4], [s * 46, -14 - lift * .5]]]);
    shardWing(g, [[s * 6, 6, 1], [s * 22, 8 + lift * .3, 1], [s * 34, 20 + lift * .4, 1], [s * 30, 26, 1], [s * 36, 34 + lift * .3, 1], [s * 20, 30, 1], [s * 10, 18, 1]], { x:s * 22, y:20, r:14 },
      [[[s * 8, 8], [s * 22, 18], [s * 32, 30]]]); }
  // a long gown with a shard-cut hem, slippers peeking
  for (const s of [-1, 1]){ const kk = Math.sin(t * TAU + (s < 0 ? 0 : 2)) * 1.5; S.part(g, PL([[s * 4 + kk, 34], [s * 12 + kk, 36], [s * 6 + kk, 39]]), G.gown, { x:s * 8, y:36, r:5 }, { flat:true, lw:1 }); }
  const gown = SM([[-9, -2], [-14, 12], [-18, 32, 1], [-12, 28, 1], [-8, 36, 1], [-3, 30, 1], [0, 37, 1], [3, 30, 1], [8, 36, 1], [12, 28, 1], [18, 32, 1], [14, 12], [9, -2]], .8);
  S.part(g, gown, G.gown, { x:0, y:14, r:18 }, { mat:'cloth', hx:-6, hy:2 });
  S.crease(g, SO([[-5, 4], [-7, 28]]), G.gown, 1.4, .45); S.crease(g, SO([[5, 4], [7, 28]]), G.gown, 1.4, .45);
  S.tube(g, SO([[-10, 6], [0, 8], [10, 6]]), G.trim, 2.4); g.save(); g.shadowColor = RED; g.shadowBlur = 4; S.dot(g, E(0, 8, 1.8, 1.8), RED); g.restore();
  { const fl = Math.sin(t * TAU) * 2;   // long hair hanging behind the shoulders, its ends lifting as if under water
    const hair = SM([[-14, -30], [-21, -16], [-24, 2 + fl], [-28, 16 + fl * 1.5, 1], [-18, 10], [-10, 2], [10, 2], [18, 10], [28, 16 - fl * 1.5, 1], [24, 2 - fl], [21, -16], [14, -30]], .8);
    S.part(g, hair, G.hair, { x:0, y:-8, r:24 }, { mat:'skin', hx:-14, hy:-14 }); for (const s of [-1, 1]) S.crease(g, SO([[s * 17, -14], [s * 21, 0], [s * 25, 12]]), G.hair, 1.2, .4); }
  // the arms: walk = one waving, one holding the shut triptych at her side; reflect / summon = both on the doors' outer frames
  const wave = Math.sin(t * TAU) * 3, front = arms;
  const lhx = -21 * (1 - front) + (tx - 30 * ts) * front, lhy = (19 + wave) * (1 - front) + (ty + 4 * ts) * front;
  const rhx = 20 * (1 - front) + (tx + 30 * ts) * front, rhy = 20 * (1 - front) + (ty + 4 * ts) * front;
  S.tube(g, SO([[-8, 2], [(-8 + lhx) / 2 - 6, (2 + lhy) / 2 + 2], [lhx, lhy - 3]]), G.skin, 4); S.tube(g, SO([[8, 2], [(8 + rhx) / 2 + 6, (2 + rhy) / 2 + 2], [rhx, rhy - 3]]), G.skin, 4);
  // head: big, silver, pointed ears, narrowed red eyes, a thin smirk
  const head = SM([[-16, -22], [-17, -10], [-10, -1], [0, 1], [10, -1], [17, -10], [16, -22], [8, -32], [-8, -32]]);
  for (const s of [-1, 1]) S.part(g, SM([[s * 12, -18], [s * 28, -28], [s * 20, -12]], .6), G.skin, { x:s * 18, y:-18, r:7 }, { flat:true, mat:'skin' });
  S.part(g, head, G.skin, { x:0, y:-15, r:17 }, { mat:'skin' }); S.contact(g, gown, 0, -2, 10, 4, .4);
  S.part(g, SM([[-18, -20], [-14, -36], [0, -41], [14, -36], [18, -20], [13, -27], [7, -24], [0, -30], [-7, -24], [-13, -27]], .8), G.hair, { x:0, y:-30, r:18 }, { mat:'skin', hx:-8, hy:-34 });
  S.crease(g, SO([[-6, -38], [-3, -30]]), G.hair, 1.2, .35); S.crease(g, SO([[6, -37], [9, -29]]), G.hair, 1.2, .35);
  // crown of glass shards with a red gem
  for (const [x, h, wd] of [[-11, 7, 3], [-6, 10, 3.4], [0, 15, 4], [6, 10, 3.4], [11, 7, 3]]){ const by = -38 + Math.abs(x) * .18;
    S.part(g, PL([[x - wd, by], [x - wd * .3, by - h], [x + wd * .5, by - h + 2], [x + wd, by]]), G.crown, { x, y:by - h / 2, r:h * .6 }, { flat:true, mat:'gel', lw:1 }); }
  S.tube(g, SO([[-13, -36], [0, -38.5], [13, -36]]), G.frame, 2.6);
  g.save(); g.shadowColor = RED; g.shadowBlur = 5; S.dot(g, E(0, -38.5, 2.2, 2.4), '#e8101e'); g.restore();
  const eo = { lx:.15, ly:.2, pr:.44, iris:'#e01828', lid:.18, lidCol:G.skin.base, lidDeep:G.skin.deep };
  S.eye(g, -6.5, -13, 5.5, 6.5, { ...eo, tilt:-.3 }); S.eye(g, 6.5, -13, 5.5, 6.5, { ...eo, tilt:.3 });
  if (lit > .3){ g.save(); g.globalAlpha *= (lit - .3) * 1.4; S.glow(g, -5.6, -12, 1.8, RED); S.glow(g, 7.4, -12, 1.8, RED); g.restore(); }
  if (jaw > .05){ S.dot(g, SM([[-4, -4], [0, -3 + jaw * 5], [4, -4], [0, -5]], .8), '#1a0a14'); S.dot(g, PL([[-3, -4], [-1, -4], [-2, -.5]]), '#fff'); S.dot(g, PL([[1, -4], [3, -4], [2, -.5]]), '#fff'); }
  else S.stroke(g, SO([[-4, -4.5], [0, -3], [5, -5.5]]), G.skin, 1.4);
  // the triptych, then the hands over its frame
  g.save(); g.translate(tx, ty); g.rotate(tr); g.scale(ts, ts);
  if (open < .05) S.tube(g, SO([[0, 18], [1, 30]]), G.frame, 4);   // a handle under it while carried shut
  triptychPanel(g, 0, 0, open, lit, k);
  g.restore();
  S.hand(g, lhx, lhy, G.skin, front > .5 ? 0 : Math.PI * .7, 3, 3.6); S.hand(g, rhx, rhy, G.skin, front > .5 ? Math.PI : Math.PI / 2, 3, 3.6);
  g.restore(); g.restore();
}

// ---------- The Treant (the N3-4 and N3-13 mini boss) and its roots ----------
// Ported from the archive (docs/archive/nightmare-monsters/minibosses-patch-wood/patch_wood.js, owner-approved): a huge gnarled hollow tree in
// Witchwood colours (violet-brown bark, an angry carved face with glowing violet eyes and maw, root feet, branch arms with twig claws, a sparse
// crown of autumn leaves, hanging moss and a hex charm). Clips: idle (registered as walk: it creaks and sways, leaves fall), summon (both arms
// raised, then slammed into the ground, which cracks with violet light), hit. The summoned root: a thorny bark root bursting out of a cracked
// mound with a violet vein; rise (once), idle (it writhes), sink (once). Glows are fine here: every frame is baked (render/anim.js).
let TRPALS = null;
/** The Treant's palette (lazy, as P() above). */
function TRP(){
  return TRPALS || (TRPALS = { BARK:pal('#5c3b3c'), BARKD:pal('#3e2429'), BARKL:pal('#7e5852'), MOSSH:pal('#8e9c74'), HOLLOW:'#12060e',
    LEAFC:['#c9581f', '#a8281f', '#d68a1c', '#8a3a2a'], GLOWV:'#c87aff', GLOWC:'#f4e0ff', CHARM:pal('#e2d8c4'), TWINE:pal('#6a4a2a'),
    THORN:pal('#d8c8a8'), SOIL:pal('#5a3a26'), SOILD:pal('#3a2418') });
}
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
function crSample(pts, n){ const out = [], m = pts.length; for (let i = 0; i < m - 1; i++){ const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, m - 1)]; for (let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[m - 1]); return out; }
/** A tapered ribbon along a spline (same helper as the Kraken's arms): { path, left, right, centre, w }. */
function ribbon(pts, wf, n = 6){ const c = crSample(pts, n), L = [], R = [], W = []; for (let i = 0; i < c.length; i++){ const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = wf(i / (c.length - 1)); W.push(w); L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); }
  const poly = [...L, ...R.slice().reverse()].map(p => [p[0], p[1]]); poly[0][2] = 1; poly[poly.length - 1][2] = 1; return { path:SM(poly, .5), left:L, right:R, centre:c, w:W }; }
function spine(x, y, a0, segL, curls){ const pts = [[x, y]]; let a = a0; for (const c of curls){ a += c; x += Math.cos(a) * segL; y += Math.sin(a) * segL; pts.push([x, y]); } return pts; }
function bboxOf(pts, pad){ let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts){ x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } return { x:(x0 + x1) / 2, y:(y0 + y1) / 2, r:Math.max(x1 - x0, y1 - y0) / 2 + pad }; }
function leaf(g, x, y, r, a, ci){ const { BARK, BARKD, BARKL, MOSSH, HOLLOW, LEAFC, GLOWV, GLOWC, CHARM, TWINE, THORN, SOIL, SOILD } = TRP();  const c = pal(LEAFC[ci % 4]); g.save(); g.translate(x, y); g.rotate(a); S.part(g, SM([[-r, 0], [-r * .3, -r * .55], [r * .2, -r * .4, 1], [r * .55, -r * .7], [r, 0, 1], [r * .55, r * .5], [-r * .3, r * .5]], .7), c, { x:0, y:0, r }, { flat:true, lw:.9 }); S.ln(g, [[-r * .9, 0], [r * .8, 0]], c, .7, .6); g.restore(); }
function moss(g, x, y, len, sw, seed){ const { BARK, BARKD, BARKL, MOSSH, HOLLOW, LEAFC, GLOWV, GLOWC, CHARM, TWINE, THORN, SOIL, SOILD } = TRP();  const R = rng(seed); S.part(g, E(x, y + 1, 6, 3), MOSSH, { x, y, r:6 }, { flat:true, mat:'moss', lw:.8 });
  for (let i = 0; i < 5; i++){ const dx = (i - 2) * 2.4 + (R() - .5) * 2, L = len * (.5 + R() * .6), pts = [[x + dx, y], [x + dx + sw * .3 + (R() - .5) * 3, y + L * .5], [x + dx + sw, y + L]];
    g.save(); g.globalAlpha *= .85; S.stroke(g, SO(pts), { deep:MOSSH.dark }, 2.4, .9); S.stroke(g, SO(pts), { deep:MOSSH.light }, 1.1, .9); g.restore(); S.dot(g, E(x + dx + sw, y + L + 1, 1.3, 2), MOSSH.light, .8); } }
/** A hex charm hanging from (x, y): a twig triangle bound with twine around a glowing rune, and a bone bead. */
function hexCharm(g, x, y, swing, glow){ const { BARK, BARKD, BARKL, MOSSH, HOLLOW, LEAFC, GLOWV, GLOWC, CHARM, TWINE, THORN, SOIL, SOILD } = TRP();
  const cx = x + swing * 4, cy = y + 16; S.ln(g, [[x, y], [cx, cy - 8]], TWINE, 1.2, .9);
  g.save(); g.translate(cx, cy); g.rotate(swing * .2);
  g.save(); g.shadowColor = GLOWV; g.shadowBlur = 6 + glow * 6; S.dot(g, E(0, 0, 3.5, 3.5), GLOWV, .7 + glow * .3); g.restore(); S.dot(g, E(0, 0, 1.5, 1.5), GLOWC);
  for (const [a, b] of [[[-8, 6], [8, 6]], [[8, 6], [0, -8]], [[0, -8], [-8, 6]]]) S.tube(g, SO([a, b]), BARKL, 2.4);
  for (const [px, py] of [[-8, 6], [8, 6], [0, -8]]) S.dot(g, E(px, py, 1.8, 1.8), TWINE.base);
  S.part(g, E(0, 12, 3, 3.5), CHARM, { x:0, y:12, r:3 }, { flat:true, mat:'bone', lw:.8 }); S.ln(g, [[0, 6], [0, 9]], TWINE, .9, .9);
  g.restore();
}
/** A branch arm from the shoulder through the elbow to a gnarled hand with four twig claws. */
function branchArm(g, sx, sy, ex, ey, hx, hy, side, spread, seed){ const { BARK, BARKD, BARKL, MOSSH, HOLLOW, LEAFC, GLOWV, GLOWC, CHARM, TWINE, THORN, SOIL, SOILD } = TRP();
  const rb = ribbon([[sx, sy], [ex, ey], [hx, hy]], u => 11 * (1 - u * .45), 6);
  S.part(g, rb.path, BARK, bboxOf(rb.centre, 10), { mat:'wood', flat:true });
  S.crease(g, SO([[sx + (ex - sx) * .3, sy + (ey - sy) * .3 - 3], [ex, ey - 2]]), BARK, 1.6, .45);
  S.part(g, E(ex, ey, 5, 4), BARKD, { x:ex, y:ey, r:5 }, { flat:true, mat:'wood', lw:1 });   // knot at the elbow
  const a = Math.atan2(hy - ey, hx - ex);
  // twig spur off the forearm
  const mx = (ex + hx) / 2, my = (ey + hy) / 2; S.tube(g, SO([[mx, my], [mx + side * 8, my - 10], [mx + side * 10, my - 18]]), BARK, 3);
  for (let i = 0; i < 4; i++){ const fa = a + (i - 1.5) * (.32 + spread * .2), L = 18 + (i % 2) * 4;
    const p1 = [hx + Math.cos(fa) * L * .5, hy + Math.sin(fa) * L * .5], p2 = [hx + Math.cos(fa + side * .3) * L, hy + Math.sin(fa + side * .3) * L];
    S.tube(g, SO([[hx, hy], p1, p2]), BARK, 4.4); S.claw(g, p2[0], p2[1], fa + side * .3, 5, '#e8d8c0'); }
  S.part(g, E(hx, hy, 9, 8), BARK, { x:hx, y:hy, r:9 }, { flat:true, mat:'wood' });
}
export function treant(g, P = {}){ const { BARK, BARKD, BARKL, MOSSH, HOLLOW, LEAFC, GLOWV, GLOWC, CHARM, TWINE, THORN, SOIL, SOILD } = TRP();
  const idle = P.idle, sm = P.summon, hit = P.hit ?? 0;
  const ph = idle ?? sm ?? 0, sw = idle != null ? Math.sin(idle * TAU) : 0, hitK = hit ? Math.sin(hit * Math.PI) : 0;
  // summon: raise (0..0.4), slam (0.4..0.52), hold in the ground (0.52..0.82), lift a little (0.82..1)
  let up = 0, down = 0, roar = 0;
  if (sm != null){ up = sm < .4 ? ease(sm / .4) : sm < .52 ? 1 - ease((sm - .4) / .12) : 0; down = sm < .4 ? 0 : sm < .52 ? ease((sm - .4) / .12) : sm < .82 ? 1 : 1 - ease((sm - .82) / .18) * .7; roar = clamp(sm < .4 ? sm / .4 : sm < .82 ? 1 : (1 - sm) / .18); }
  const squash = down * (sm != null && sm < .6 ? Math.sin(seg(sm, .4, .6) * Math.PI) : 0);
  S.shadow(g, 0, 52, 72, 10);
  g.save(); g.translate(0, 50); g.rotate(sw * .022 - hitK * .05); g.scale(1 + squash * .04, 1 - squash * .05 - hitK * .02); g.translate(hitK * 4, -50);
  // root feet splaying out over the ground
  for (const [x1, x2, x3, w0] of [[-26, -52, -78, 12], [-12, -26, -40, 10], [14, 30, 48, 10], [28, 56, 80, 12], [0, 6, 4, 8]]){
    const rb = ribbon([[x1 * .7, 24], [x2, 40], [x3, 49]], u => w0 * (1 - u * .8), 5); S.part(g, rb.path, BARKD, bboxOf(rb.centre, 8), { mat:'wood', flat:true });
    S.ln(g, [[x2 - 4, 39], [x2 + 4, 42]], BARKD, 1, .4); }
  // crown behind: three gnarled upper limbs with sparse autumn leaf clumps and moss
  const cs = sw * 3;
  for (const [pts, w0] of [[[[-14, -70], [-30, -104], [-56, -124], [-70, -140]], 9], [[[12, -72], [30, -108], [58, -126], [72, -134]], 9], [[[0, -78], [-4, -116], [8, -148]], 8]]){
    const q = pts.map(([x, y], i) => [x + cs * i * .6, y]); const rb = ribbon(q, u => w0 * (1 - u * .75), 6); S.part(g, rb.path, BARK, bboxOf(rb.centre, 8), { mat:'wood', flat:true }); }
  for (const [x, y, n, sd] of [[-62, -132, 7, 1], [64, -128, 7, 2], [6, -146, 6, 3], [-34, -112, 5, 4], [36, -114, 5, 5]]){ const R = rng(sd * 13);
    for (let i = 0; i < n; i++) leaf(g, x + cs * 2 + (R() - .5) * 26, y + (R() - .5) * 16, 5 + R() * 2.5, R() * TAU, i + sd); }
  // the trunk
  const trunk = SM([[-38, 40], [-44, 16], [-36, -14], [-32, -46], [-24, -72], [-10, -86], [8, -86], [24, -74], [32, -46], [36, -14], [44, 16], [38, 40], [0, 44]], .85);
  S.part(g, trunk, BARK, { x:0, y:-20, r:60 }, { mat:'wood', flat:true }); S.dot(g, E(-20, -58, 6, 2.4, -.7), '#ffffff', .22);
  // bark ridges
  for (const [pts, a] of [[[[-30, 30], [-34, 0], [-28, -30], [-22, -60]], .5], [[[28, 30], [32, 0], [26, -34], [18, -66]], .5], [[[-18, 38], [-20, 20]], .4], [[[16, 38], [20, 22]], .4], [[[-6, -60], [-2, -80]], .35]]) S.crease(g, SO(pts), BARK, 3, a + .25);
  S.part(g, E(-24, 22, 6, 5), BARKD, { x:-24, y:22, r:6 }, { flat:true, mat:'wood', lw:1 }); S.dot(g, E(-24, 22, 2.4, 2), HOLLOW, .9);
  // the angry carved face: heavy brow, glowing hollow eyes, knot nose, jagged glowing maw
  const fy = -32, glow = .6 + Math.sin(ph * TAU * 2) * .1 + roar * .3 + hitK * .4;
  for (const d of [-1, 1]){ const sock = SM([[d * 6, fy - 2], [d * 12, fy - 6, 1], [d * 24, fy - 2], [d * 22, fy + 6], [d * 12, fy + 8], [d * 6, fy + 4]], .7);
    S.dot(g, sock, HOLLOW); g.save(); sock(g); g.clip(); const gr = g.createRadialGradient(d * 15, fy + 2, 0, d * 15, fy + 2, 12); gr.addColorStop(0, rgba(GLOWV, .9 * glow)); gr.addColorStop(1, rgba(GLOWV, 0)); g.fillStyle = gr; g.fillRect(d * 15 - 14, fy - 12, 28, 26); g.restore();
    S.stroke(g, sock, BARKD, 1.6, .9);
    S.glow(g, d * 15, fy + 2, 3.2 + roar * .8, hitK > .3 ? GLOWC : GLOWV); }
  // brow: two bark ridges in a deep V
  for (const d of [-1, 1]) S.part(g, SM([[d * 2, fy - 4], [d * 14, fy - 14 - roar * 2], [d * 30, fy - 12], [d * 28, fy - 7], [d * 14, fy - 7], [d * 4, fy + 1]], .7), BARKL, { x:d * 15, y:fy - 9, r:15 }, { flat:true, mat:'wood' });
  S.part(g, SM([[-4, fy + 4], [4, fy + 4], [6, fy + 16], [0, fy + 19], [-6, fy + 16]], .8), BARKL, { x:0, y:fy + 12, r:8 }, { flat:true, mat:'wood' });
  const mo = 4 + roar * 12 + hitK * 4, my = fy + 26;
  const maw = SM([[-22, my], [-12, my - 4], [0, my - 2], [12, my - 4], [22, my], [16, my + 8 + mo * .6], [0, my + 10 + mo], [-16, my + 8 + mo * .6]], .8);
  S.dot(g, maw, HOLLOW); g.save(); maw(g); g.clip(); const mg = g.createRadialGradient(0, my + 6 + mo * .6, 0, 0, my + 6 + mo * .6, 20); mg.addColorStop(0, rgba(GLOWV, .85 * glow)); mg.addColorStop(.6, rgba('#6a2aa0', .4 * glow)); mg.addColorStop(1, rgba('#6a2aa0', 0)); g.fillStyle = mg; g.fillRect(-26, my - 8, 52, 40);
  for (let i = -3; i <= 3; i++){ const x = i * 6; S.part(g, PL([[x - 3, my - 4], [x + 3, my - 4], [x + (i % 2) * 1, my + 4 + (i % 2 ? 1 : 3)]]), BARKL, { x, y:my, r:4 }, { flat:true, lw:.8 }); }
  for (let i = -2; i <= 2; i++){ const x = i * 7 + 2, yb = my + 10 + mo - Math.abs(i) * 2; S.part(g, PL([[x - 3, yb + 2], [x + 3, yb + 2], [x, yb - 5]]), BARKL, { x, y:yb, r:4 }, { flat:true, lw:.8 }); }
  g.restore(); S.stroke(g, maw, BARKD, 1.8, .9);
  // moss draped over the shoulders, a hex charm and a bone charm hanging from the trunk
  moss(g, -28, -62, 30, sw * 2, 3); moss(g, 26, -66, 24, sw * 2, 4);
  // arms
  for (const s of [-1, 1]){ const drift = idle != null ? Math.sin(idle * TAU + (s < 0 ? 0 : 1.6)) * 3 : 0, rec = hitK * 6;
    const restE = [s * 66, -36 + drift], restH = [s * 78, 6 + drift], upE = [s * 60, -88], upH = [s * 52, -126], dnE = [s * 66, -10], dnH = [s * 68, 44];
    const E1 = [lerp(lerp(restE[0], upE[0], up), dnE[0], down), lerp(lerp(restE[1], upE[1], up), dnE[1], down) - rec], H1 = [lerp(lerp(restH[0], upH[0], up), dnH[0], down), lerp(lerp(restH[1], upH[1], up), dnH[1], down) - rec];
    branchArm(g, s * 28, -54, E1[0], E1[1], H1[0], H1[1], s, up + down * .5, 50 + s);
    moss(g, (E1[0] * 2 + H1[0]) / 3, (E1[1] * 2 + H1[1]) / 3 + 4, 24 - up * 8, sw * 2 + s * 2, 7 + s);
    if (s < 0) hexCharm(g, (E1[0] + H1[0]) / 2 + 6, (E1[1] + H1[1]) / 2 + 2, sw - up, roar); }
  // slam: the hands punch into the ground, which cracks with violet light and throws up clods
  if (sm != null && down > 0){ const k = seg(sm, .48, 1), R = rng(12);
    for (const s of [-1, 1]){ const x = s * 68;
      g.save(); g.shadowColor = GLOWV; g.shadowBlur = 8; g.strokeStyle = rgba(GLOWV, .9 * (1 - k * .6)); g.lineWidth = 2;
      for (let i = 0; i < 4; i++){ const a = Math.PI * (.05 + i * .3) * (s < 0 ? -1 : 1) + (s < 0 ? Math.PI : 0), L = 10 + k * 18; g.beginPath(); g.moveTo(x, 48); g.lineTo(x + Math.cos(a) * L * .5, 48 + Math.sin(a) * 2); g.lineTo(x + Math.cos(a) * L, 49 + Math.sin(a) * 3); g.stroke(); } g.restore();
      S.part(g, SM([[x - 16, 50], [x - 10, 42], [x, 40], [x + 10, 42], [x + 16, 50]], .8), SOIL, { x, y:46, r:14 }, { flat:true, mat:'stone' });
      if (k > 0 && k < 1){ g.save(); g.globalAlpha *= 1 - k; for (let i = 0; i < 6; i++){ const a = -Math.PI * (.15 + R() * .7), d = k * (16 + R() * 18), cx = x + Math.cos(a) * d, cy = 42 + Math.sin(a) * d + k * k * 16; S.part(g, E(cx, cy, 2.6, 2), SOIL, { x:cx, y:cy, r:3 }, { flat:true, lw:.8 }); } g.restore(); } } }
  g.restore();
  // falling leaves (idle) or leaves shaken loose (hit, summon)
  const R = rng(31), nL = hit ? 7 : sm != null ? 5 : 4;
  for (let i = 0; i < nL; i++){ const x0 = (R() - .5) * 140, y0 = -130 + R() * 30, sp = R(), off = R();
    let k, burst = true; if (hit) k = hit * (.4 + sp * .4); else if (sm != null) k = seg(sm, .4, 1) * (.6 + sp * .3); else if (idle != null){ k = (idle + off) % 1; burst = false; } else continue;
    const x = x0 + Math.sin(k * TAU + i) * 10, y = y0 + k * 150; g.save(); g.globalAlpha *= Math.min(1, (1 - k) * 4) * (burst ? (k > 0 ? 1 : 0) : 1); leaf(g, x, y, 4.2, k * 6 + i, i); g.restore(); }
  // hit: bark chips flying
  if (hitK){ const R2 = rng(44); g.save(); g.globalAlpha *= 1 - hit * .6; for (let i = 0; i < 8; i++){ const a = -Math.PI * (.1 + R2() * .8), d = 20 + hit * 34 * (.6 + R2()), x = Math.cos(a) * d, y = -30 + Math.sin(a) * d; S.part(g, PL([[x - 3, y - 2], [x + 3, y - 1], [x + 1, y + 3]]), BARKL, { x, y, r:3 }, { flat:true, lw:.8 }); } g.restore(); }
}

// ---------- the summoned root ----------
/** A thorny root bursting out of the ground: P.rise 0..1 (once), P.idle 0..1 (writhe), P.sink 0..1 (once). */
export function root(g, P = {}){ const { BARK, BARKD, BARKL, MOSSH, HOLLOW, LEAFC, GLOWV, GLOWC, CHARM, TWINE, THORN, SOIL, SOILD } = TRP();
  const ri = P.rise, id = P.idle, sk = P.sink;
  let L = 1, wr = 0, burst = 0, mound = 1;
  if (ri != null){ L = ri < .75 ? ease(ri / .75) * 1.08 : lerp(1.08, 1, ease((ri - .75) / .25)); burst = ri; mound = .4 + ease(Math.min(1, ri * 2.5)) * .6; }
  if (id != null) wr = id;
  if (sk != null){ L = 1 - ease(sk) ; mound = 1 - seg(sk, .7, 1) * .5; wr = sk * .3; }
  S.shadow(g, 0, 52, 30, 6);
  // the hole: dark earth with violet cracks
  S.dot(g, E(0, 48, 22 * mound, 6 * mound), '#1a0c08');
  g.save(); g.shadowColor = GLOWV; g.shadowBlur = 6; g.strokeStyle = rgba(GLOWV, .75 * mound); g.lineWidth = 1.6;
  for (const [a, l] of [[.15, 30], [2.9, 28], [3.4, 22], [-.25, 24]]){ g.beginPath(); g.moveTo(Math.cos(a) * 16, 49 + Math.sin(a) * 3); g.lineTo(Math.cos(a) * l * .7, 50 + Math.sin(a) * 4); g.lineTo(Math.cos(a) * l, 49 + Math.sin(a) * 6); g.stroke(); } g.restore();
  if (L > .02){
    const ph = wr * TAU, segs = 7, len = 15.5 * L;
    const curls = [0, .1 + Math.sin(ph) * .1, .12 + Math.sin(ph + .9) * .14, -.18 + Math.sin(ph + 1.8) * .16, -.2 + Math.sin(ph + 2.7) * .16, .35 + Math.sin(ph + 3.4) * .18, .85 + Math.sin(ph + 4.1) * .2].map(c => c * (.6 + L * .4));
    const pts = spine(-2, 50, -Math.PI / 2 + Math.sin(ph) * .06, len, curls.slice(0, segs));
    const rb = ribbon(pts, u => 13 * Math.pow(1 - u, .7) + 1.4, 6), c = rb.centre, N = c.length, b = bboxOf(c, 13);
    // side rootlet
    if (L > .5){ const i = Math.floor(N * .45); const [x, y] = c[i]; S.tube(g, SO([[x, y], [x + 12, y - 4 + Math.sin(ph) * 2], [x + 20, y - 12 + Math.sin(ph + 1) * 3]]), BARKD, 4); S.claw(g, x + 20, y - 12 + Math.sin(ph + 1) * 3, -1.2, 5, THORN.base); }
    S.part(g, rb.path, BARKD, b, { mat:'wood', flat:true });
    // lit ridge and a violet vein along the root
    g.save(); g.strokeStyle = 'rgba(255,230,240,.25)'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); for (let i = 1; i < N - 3; i++){ const p = [c[i][0] + (rb.right[i][0] - c[i][0]) * .5, c[i][1] + (rb.right[i][1] - c[i][1]) * .5]; i > 1 ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.restore();
    g.save(); g.shadowColor = GLOWV; g.shadowBlur = 6; g.strokeStyle = rgba(GLOWV, .75); g.lineWidth = 1.4; g.beginPath(); for (let i = 2; i < N - 4; i++){ const k = .25 * Math.sin(i * 1.3), p = [c[i][0] + (rb.left[i][0] - c[i][0]) * k, c[i][1] + (rb.left[i][1] - c[i][1]) * k]; i > 2 ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.restore();
    // bark rings and thorns on both edges
    for (let i = 3; i < N - 2; i += 4) S.ln(g, [rb.left[i], [(rb.left[i][0] + rb.right[i][0]) / 2, (rb.left[i][1] + rb.right[i][1]) / 2 + 2], rb.right[i]], BARKD, 1.2, .5);
    for (let i = 2; i < N - 2; i += 3) for (const [side, sgn] of [[rb.left, 1], [rb.right, -1]]){ if ((i + (sgn > 0 ? 0 : 1)) % 2) continue; const p = side[i], q = c[i], dx = p[0] - q[0], dy = p[1] - q[1], l = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx) - .5 * sgn, tl = 4 + rb.w[i] * .35;
      S.part(g, PL([[p[0] - dy / l * 2.4, p[1] + dx / l * 2.4], [p[0] + dy / l * 2.4, p[1] - dx / l * 2.4], [p[0] + Math.cos(a) * tl, p[1] + Math.sin(a) * tl]]), THORN, { x:p[0], y:p[1], r:tl }, { flat:true, lw:.8 }); }
    // a few autumn leaves clinging on
    if (L > .6){ leaf(g, c[Math.floor(N * .3)][0] - 8, c[Math.floor(N * .3)][1], 4, -.6 + Math.sin(ph) * .2, 1); leaf(g, c[Math.floor(N * .62)][0] + 7, c[Math.floor(N * .62)][1] - 2, 3.6, 2.4 + Math.sin(ph + 1) * .2, 2); }
  }
  // front lip of the mound over the root base
  S.part(g, SM([[-24 * mound, 50], [-18 * mound, 43], [-8, 44], [0, 46], [8, 44], [18 * mound, 43], [24 * mound, 50], [0, 54]], .8), SOIL, { x:0, y:48, r:20 }, { flat:true, mat:'stone' });
  for (const [x, y] of [[-14, 46], [12, 47], [2, 50]]) S.part(g, E(x * mound, y, 3, 2.2), SOILD, { x, y, r:3 }, { flat:true, noEdge:true });
  // rise: clods burst up; sink: clods tumble back in
  const R = rng(66), k = ri != null ? seg(ri, 0, .6) : sk != null ? seg(sk, .2, .9) : 0;
  if (k > 0 && k < 1){ g.save(); g.globalAlpha *= 1 - k * k; for (let i = 0; i < 9; i++){ const a = -Math.PI * (.1 + R() * .8), d = (ri != null ? k : 1 - k) * (18 + R() * 22), x = Math.cos(a) * d * 1.2, y = 44 + Math.sin(a) * d + (ri != null ? k * k * 26 : 0); S.part(g, E(x, y, 3, 2.3, a), i % 3 ? SOIL : SOILD, { x, y, r:3 }, { flat:true, lw:.8 }); } g.restore(); }
}

// ---------- registry ----------
// The Ash Crone and the Blood Coven Witch (r 22): the game witch's scale .62 and dy -10 (feet at 21); the crone's box is taller for the skull
// staff's smoke and wider for the staff. Their hex clip is 6 frames at 12 fps (0.5 s: engine/witchwood.js plays it for 0.5 s as they cast).
// The Flask Bearer (r 18): scale .55, dy -10.4 puts its feet at r × 0.95 (the imp's size). The Cauldron Toad (r 24): scale .6, dy -7.2. Both die
// clips are 8 frames: combat.js plays them as a clip effect where the monster falls (render/draw.js plays 8 frames).
const clipOf = (n, fps, key, once) => ({ n, fps, once, pose:t => ({ [key]:t }) });
export const TOAD_FPS = 9, TOAD_N = 6;   // the lash clip; render/witchwood.js keys the long tongue to the same cycle
export const WITCHWOOD = {
  flaskbearer: { draw:flaskbearer, scale:.55, dy:-10.4, box:{ x:-60, y:-58, w:120, h:114 }, clips:{ walk:clipOf(8, 13, 'walk'), chew:clipOf(4, 8, 'chew'), die:clipOf(8, 13, 'die', true) }, still:{} },
  toad: { draw:toad, scale:.6, dy:-7.2, box:{ x:-80, y:-62, w:160, h:122 }, clips:{ walk:clipOf(8, 7, 'walk'), chew:clipOf(TOAD_N, TOAD_FPS, 'chew'), die:clipOf(8, 13, 'die', true) }, still:{} },
  ashcrone: { draw:ashcrone, scale:.62, dy:-10, box:{ x:-54, y:-108, w:110, h:164 }, clips:{ walk:clipOf(8, 9, 'walk'), chew:clipOf(4, 8, 'chew'), hex:clipOf(6, 12, 'hex', true) }, still:{ hex:.5 } },
  covenwitch: { draw:covenwitch, scale:.62, dy:-10, box:{ x:-54, y:-100, w:108, h:156 }, clips:{ walk:clipOf(8, 9, 'walk'), chew:clipOf(4, 8, 'chew'), hex:clipOf(6, 12, 'hex', true) }, still:{ hex:.5 } },
  // The Triptych Sprite (r 26): the archive's 1.2× sprite at scale .7, dy -10 (feet near 25). Reflect while the barrier is up (not chewing), its summon
  // clip (10 frames at 12 fps, engine/witchwood.js SUMMON_DUR) as it goes up; the box is wide for the open doors and the wings.
  triptych: { draw:triptych, scale:.7, dy:-10, box:{ x:-62, y:-72, w:124, h:128 }, clips:{ walk:clipOf(8, 12, 'walk'), chew:clipOf(4, 8, 'chew'), reflect:clipOf(6, 10, 'reflect'), summon:clipOf(10, 12, 'summon', true) }, still:{ reflect:.3 },
    frame(m, clips){ if (m.reflecting && !(m.eating && m.frozenT <= 0) && !(m.anim && m.anim.clip === 'summon')){ const cl = clips.reflect; return ['reflect', Math.floor(m.ph * cl.fps) % cl.n]; } return null; } },
  // The Treant (r 34): the archive's box at its sibling the Strawlord's scale .56 and dy -8, capped at bake scale 2 like it (23 frames, about 5.6 MB).
  // Its idle is its walk (it never walks: the registry's convention for a boss's idle); summon is 10 frames at 10 fps (engine/witchwood.js plays it 1 s).
  treant: { draw:treant, scale:.56, dy:-8, box:{ x:-104, y:-156, w:208, h:232 }, maxK:2, still:{ idle:0 },
    clips:{ walk:clipOf(8, 5, 'idle'), summon:clipOf(10, 10, 'summon', true), hit:{ n:5, fps:14, once:true, pose:t => ({ idle:0, hit:t }) } } },
  // The summoned root: not a monster, a field object (render/witchwood.js drawRoots blits one frame per root). dy puts its ground line (y 50) at
  // the origin. Rise 8 frames at 12 fps and sink 8 at 13 (engine/witchwood.js ROOT_RISE / ROOT_SINK; the archive's sink had 6). Scale .75 (the archive's .55 read too small on the field).
  root: { draw:root, scale:.75, dy:-37.5, box:{ x:-40, y:-62, w:80, h:132 }, still:{ idle:0 },
    clips:{ rise:clipOf(8, 12, 'rise', true), idle:clipOf(8, 7, 'idle'), sink:clipOf(8, 13, 'sink', true) } },
};
