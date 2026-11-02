// ---------- Nightmare knights (Crumbling Keep: thunderstorm), design archive ----------
// Two mounted knights for the nightmare levels (owner: "a jousting knight monster, a commander knight monster. Both on a horse."):
//   jouster   — the Storm Lancer: a charging lancer on a barded black horse, a long striped lance, a plumed helm.
//   commander — the Storm Marshal: heavier, a war banner on his back, a sword raised to command, a cape and a crowned helm.
// Built on the Crumbling Keep knights in src/engine/render/chars/w4.js (knight, bulwark, vampirecount): the same metal helper,
// rivets, visor slit with glowing eyes and plume, re-coloured for the storm: storm-dark steel, crimson, pale lightning sigils.
// Both are seen from the front like every monster, riding down the lane toward the wall: the horse's head is turned a little to
// the viewer's right so the rider stays readable, the lance or sword is on the viewer's left.
// Drawn around (0,0) in drawing units with the hooves at y = 50. Every clip is meant to be baked (render/anim.js), so the
// glows are fine; nothing random per frame (rng(seed) only).
// NOT for the game: lives in the owner's design archive.

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';

// ---------- nightmare Crumbling Keep palette ----------
const STEEL = pal('#7f88a6'), STEELD = pal('#535a74'), IRONK = pal('#2f3448'),
  CRIM = pal('#b8182e'), CRIMD = pal('#76101f'), SLATE = pal('#2c3550'),
  HORSE = pal('#3a3c50'), HORSED = pal('#272834'), MUZZ = pal('#55586e'), MANE = pal('#4a0e1a'),
  HOOF = pal('#24252e'), BRASS = pal('#c39445'), LEATH = pal('#4c3126'),
  PLUME = pal('#d8263f'), LANCEW = pal('#dfe4f0'), CAPE = pal('#17111f'), LINING = pal('#b3132b');
const EYE = '#ff2a3c', BOLT_GLOW = '#9fc0ff', BOLT_CORE = '#f2f7ff', SLIT = '#0b0d16', SIGIL = '#cfdcff';

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t * t * (3 - 2 * t);
function metal(g, p, c, b, o = {}){ S.part(g, p, c, b, { mat:'metal', ...o }); }
/** Steel gauntlet: a fist. */
function gauntlet(g, x, y, r = 6.5, c = STEEL){ metal(g, E(x, y, r, r * .92), c, { x, y, r }, { flat:true }); S.ln(g, [[x - r * .5, y + r * .2], [x + r * .5, y + r * .2]], c, 1, .5); }
/** A small lightning-bolt sigil (pale storm blue, softly lit). */
function boltSigil(g, x, y, s = 1, col = SIGIL){ g.save(); g.translate(x, y); g.scale(s, s); g.shadowColor = BOLT_GLOW; g.shadowBlur = 5;
  S.dot(g, PL([[-1, -11], [6, -11], [1.5, -2.5], [6.5, -2.5], [-4, 12], [-.5, 1.5], [-6, 1.5]]), col, .95); g.restore(); }
/** A jagged lightning bolt from a to b (seeded zigzag with a branch, blue glow, white core). */
function bolt(g, a, b, seed, w = 1.2, amp = 5){
  const R = rng(seed), n = 5, pts = [a]; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let i = 1; i < n; i++){ const t = i / n, o = (R() - .5) * 2 * amp; pts.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]); }
  pts.push(b);
  const path = g2 => { g2.beginPath(); pts.forEach((p, i) => i ? g2.lineTo(p[0], p[1]) : g2.moveTo(p[0], p[1])); const p = pts[2], ba = Math.atan2(dy, dx) + (R() < .5 ? -.9 : .9); g2.moveTo(p[0], p[1]); g2.lineTo(p[0] + Math.cos(ba) * L * .25, p[1] + Math.sin(ba) * L * .25); };
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = BOLT_GLOW; g.shadowBlur = 8;
  path(g); g.strokeStyle = rgba(BOLT_GLOW, .55); g.lineWidth = w * 3; g.stroke();
  path(g); g.strokeStyle = BOLT_CORE; g.lineWidth = w; g.stroke(); g.restore(); }
/** Glowing visor eye. */
function visorEye(g, x, y, r, hot = 0){ g.save(); g.shadowColor = EYE; g.shadowBlur = 10 + hot * 8; S.dot(g, E(x, y, r * 1.5, r * .9), EYE, .55 + hot * .3); g.restore(); S.glow(g, x, y, r, EYE); }

// ---------- the horse ----------
/** One horse leg, front view: shoulder (x0, y0) to the hoof at (x1, y1). lift 0..1 bends the knee out and tips the hoof so its shod sole shows. */
function leg(g, x0, y0, x1, y1, lift, c, w, s, o = {}){
  const kx = x0 + (x1 - x0) * .5 + s * lift * 4.5, ky = y0 + (y1 - y0) * .5 - lift * 1.5;
  S.tube(g, SO([[x0, y0], [kx, ky], [x1, y1 - 5]]), c, w);
  S.part(g, E(kx, ky, w * .62, w * .56), c, { x:kx, y:ky, r:w * .62 }, { flat:true, mat:'skin' });
  if (o.cop){ metal(g, E(kx, ky - 1, w * .72, w * .62), STEELD, { x:kx, y:ky - 1, r:w * .72 }, { flat:true }); S.rivet(g, kx, ky - 1, 1.3, STEEL); }
  for (const d of [-1, 0, 1]) S.ln(g, [[x1 + d * w * .3, y1 - 10], [x1 + d * w * .5 + s * .6, y1 - 3]], MANE, 1.5, .8);   // crimson feathering at the fetlock
  const hw = w * .62, hh = 6.5;
  if (lift > .35){   // tipped back: the sole and the iron shoe face the viewer
    S.part(g, E(x1, y1 - 1.5, hw * 1.1, hh * .8), HOOF, { x:x1, y:y1 - 2, r:hw }, { flat:true, mat:'horn' });
    S.dot(g, E(x1, y1 - 1, hw * .7, hh * .48), '#0d0d13');
    S.stroke(g, g2 => { g2.beginPath(); g2.ellipse(x1, y1 - 1, hw * .86, hh * .62, 0, Math.PI * 1.05, Math.PI * 1.95, true); }, { deep:STEEL.base }, 1.3, .8);
  } else S.part(g, SM([[x1 - hw * .8, y1 - hh], [x1 + hw * .8, y1 - hh], [x1 + hw * 1.08, y1, 1], [x1 - hw * 1.08, y1, 1]], .5), HOOF, { x:x1, y:y1 - 3, r:hw }, { flat:true, mat:'horn' });
}
/** Four legs from a gait: lifts = [front-left, front-right, back-left, back-right]; bob moves the shoulders. */
function legs(g, lifts, bob, heavy){
  const [fl, fr, bl, br] = lifts;
  for (const [s, l] of [[-1, bl], [1, br]]) leg(g, s * 23, 20 + bob, s * 25, 45 - l * 11, l, HORSED, 8.5, s);
  for (const [s, l] of [[-1, fl], [1, fr]]) leg(g, s * 12, 16 + bob, s * 13 + s * l * 1.5, 50 - l * 16, l, HORSE, 10.5, s, { cop:heavy });
}
/** Chest, steel peytral and the two caparison panels. o.cap/o.trim: cloth and trim palettes; o.wave sways the dagged hem. */
function horseBody(g, o){
  const wv = o.wave || 0, heavy = o.heavy;
  const chest = SM([[-28, -8], [-32, 8], [-22, 26], [0, 30], [22, 26], [32, 8], [28, -8], [0, -12]], .85);
  S.part(g, chest, HORSE, { x:0, y:8, r:32 }, { mat:'skin', hx:-10, hy:0 });
  for (const s of [-1, 1]){
    const d = i => wv * (i % 2 ? .6 : 1) * (s > 0 ? 1 : -.7);
    const panel = SM([[s * 15, -12, 1], [s * 38, -10], [s * 46, 6], [s * (49 + d(0)), 31, 1], [s * 42, 26, 1], [s * (36 + d(1)), 33, 1], [s * 29, 27, 1], [s * (22 + d(2) * .5), 32, 1], [s * 16, 26, 1], [s * 14, 8]], .75);
    S.part(g, panel, o.cap, { x:s * 32, y:8, r:28 }, { mat:'cloth', hx:s * 28 - 6, hy:-2 });
    S.contact(g, panel, s * 15, 4, 8, 20, .45);
    S.crease(g, SO([[s * 30, -4], [s * 34, 14], [s * 36, 28]]), o.cap, 1.6, .38); S.crease(g, SO([[s * 22, 2], [s * 22, 26]]), o.cap, 1.3, .3);
    // trim along the hem
    S.stroke(g, SO([[s * 16, 26], [s * (22 + d(2) * .5), 32], [s * 29, 27], [s * (36 + d(1)), 33], [s * 42, 26], [s * (49 + d(0)), 31]], .2), { deep:o.trim.base }, 2.6, .95);
    if (heavy){ S.stroke(g, SO([[s * 15, -12], [s * 14, 8], [s * 16, 26]]), { deep:o.trim.base }, 2.4, .9); for (const y of [-6, 6, 18]) S.rivet(g, s * 15, y, 1.3, BRASS); }
    boltSigil(g, s * 32, 10, .85);
  }
  // steel peytral over the chest
  const pey = SM([[-19, -6], [19, -6], [18, 8], [0, 16], [-18, 8]], .8);
  metal(g, pey, heavy ? STEEL : STEELD, { x:0, y:2, r:20 }, { hx:-8, hy:-2 });
  for (const [x, y] of [[-13, -1], [13, -1], [0, 10]]) S.rivet(g, x, y, 1.6, heavy ? BRASS : STEEL);
  if (heavy){ metal(g, E(0, 2, 5, 5), BRASS, { x:0, y:2, r:5 }, { flat:true }); S.dot(g, E(0, 2, 2, 2), CRIM.base); }
}
/** Neck, mane, ears and the head with a steel chamfron, turned a little to the viewer's right. (cx, cy): head centre. */
function horseHead(g, cx, cy, o = {}){
  const wv = o.wave || 0, heavy = o.heavy, open = o.open || 0;
  // neck, with the mane falling on its far (left) side
  const neck = SM([[cx - 18, cy + 30], [cx - 16, cy], [cx - 8, cy - 18], [cx + 8, cy - 16], [cx + 14, cy + 26]], .85);
  S.part(g, neck, HORSE, { x:cx - 2, y:cy + 6, r:22 }, { mat:'skin', hx:cx - 8, hy:cy - 4 });
  for (let i = 0; i < 5; i++){ const y = cy - 22 + i * 9, x = cx - 12 - i * 1.4, sw = wv * (1 + i * .25) + Math.sin(i * 1.7) * 1.5;
    S.part(g, SM([[x + 4, y - 4], [x - 12 - sw, y + 2], [x - 16 - sw, y + 9, 1], [x - 6, y + 8], [x + 3, y + 7]], .8), MANE, { x:x - 6, y:y + 3, r:10 }, { flat:true, mat:'cloth', lw:1.2 }); }
  if (heavy) for (let i = 0; i < 3; i++){ const y = cy + 2 + i * 8; metal(g, SM([[cx - 16, y], [cx + 10, y - 3], [cx + 12, y + 5], [cx - 15, y + 8]], .6), STEELD, { x:cx - 2, y:y + 2, r:14 }, { flat:true }); S.rivet(g, cx - 10, y + 3, 1.2, BRASS); }   // crinet: plates over the neck
  // ears
  for (const s of [-1, 1]){ const ear = SM([[cx + s * 5, cy - 22], [cx + s * 11, cy - 38, 1], [cx + s * 15, cy - 21]], .7); S.part(g, ear, HORSE, { x:cx + s * 10, y:cy - 27, r:8 }, { flat:true, mat:'skin' }); S.dot(g, SM([[cx + s * 8, cy - 23], [cx + s * 11, cy - 33], [cx + s * 13, cy - 23]], .7), HORSED.deep, .7); }
  // head
  const head = SM([[cx - 14, cy - 18], [cx - 7, cy - 26], [cx + 7, cy - 26], [cx + 14, cy - 18], [cx + 15, cy - 2], [cx + 12, cy + 12], [cx + 6, cy + 21], [cx - 6, cy + 21], [cx - 12, cy + 12], [cx - 15, cy - 2]], .85);
  S.part(g, head, HORSE, { x:cx, y:cy - 4, r:25 }, { mat:'skin', hx:cx - 8, hy:cy - 16 });
  // muzzle, smoking crimson nostrils, mouth (opens on the chew)
  const mz = E(cx, cy + 14, 11.5, 8.5); S.part(g, mz, MUZZ, { x:cx, y:cy + 13, r:11.5 }, { flat:true, mat:'skin', hx:cx - 4, hy:cy + 9 });
  for (const s of [-1, 1]){ g.save(); g.shadowColor = EYE; g.shadowBlur = 6; S.dot(g, E(cx + s * 5, cy + 13, 2.2, 2.8, s * .4), '#3a0710'); g.restore(); S.dot(g, E(cx + s * 5, cy + 13.6, 1.1, 1.4, s * .4), '#ff3a40', .8); }
  if (open > .05){ S.dot(g, SM([[cx - 6, cy + 19], [cx + 6, cy + 19], [cx + 4, cy + 20 + open * 6], [cx - 4, cy + 20 + open * 6]], .8), '#2a0810'); for (const x of [-3, 1]) S.dot(g, RR(cx + x, cy + 19, 2.6, 2.4, .8), '#ece6dc'); }
  else S.ln(g, [[cx - 5, cy + 20], [cx, cy + 21], [cx + 5, cy + 20]], HORSED, 1.2, .7);
  // chamfron: a steel plate down the face with a spike (two side horns on the heavy barding)
  if (heavy) for (const s of [-1, 1]) metal(g, SM([[cx + s * 3, cy - 21], [cx + s * 13, cy - 34, 1], [cx + s * 7, cy - 19]], .6), STEEL, { x:cx + s * 8, y:cy - 26, r:7 }, { flat:true });
  else metal(g, PL([[cx - 3.2, cy - 22], [cx + 3.2, cy - 22], [cx, cy - 38]]), STEEL, { x:cx, y:cy - 28, r:7 }, { flat:true });
  const plate = SM([[cx - 6, cy - 25], [cx + 6, cy - 25], [cx + 5, cy - 2], [cx, cy + 5], [cx - 5, cy - 2]], .6);
  metal(g, plate, heavy ? STEEL : STEELD, { x:cx, y:cy - 12, r:14 }, { hx:cx - 2, hy:cy - 20 });
  S.rivet(g, cx, cy - 20, 1.4, heavy ? BRASS : STEEL); S.rivet(g, cx, cy - 4, 1.4, heavy ? BRASS : STEEL);
  if (heavy) S.dot(g, PL([[cx - 2.4, cy - 15], [cx + 2.4, cy - 15], [cx, cy - 9]]), CRIM.base, .95);
  // forelock spilling over the plate
  for (const [dx, a] of [[-4, -.4], [0, 0], [4, .4]]) S.part(g, SM([[cx + dx - 3, cy - 27], [cx + dx + 3, cy - 27], [cx + dx + Math.sin(a) * 6, cy - 17]], .7), MANE, { x:cx + dx, y:cy - 23, r:5 }, { flat:true, mat:'cloth', lw:1 });
  // big angry eyes with crimson irises and a soft red glow
  for (const s of [-1, 1]){ const ex = cx + s * 10.6, ey = cy - 9;
    g.save(); g.shadowColor = EYE; g.shadowBlur = 9; S.dot(g, E(ex, ey, 5.6, 6.4), '#ff3040', .35); g.restore();
    S.eye(g, ex, ey, 5.9, 6.7, { lx:s * -.1 + .1, ly:.18, pr:.44, pupil:'#9a0c1a', iris:'#ff6060', lid:.3, lidCol:HORSE.dark, lidDeep:HORSE.deep, tilt:-s * .38 }); }
}

// ---------- rider parts ----------
/** Armoured leg in a stirrup on side s; the rider's centre is x = -8. */
function riderLeg(g, s, c){
  const hip = [-8 + s * 10, -12], knee = [-8 + s * 26, -2], ank = [-8 + s * 27, 13];
  S.tube(g, SO([hip, knee, ank]), c, 10);
  metal(g, E(knee[0], knee[1], 6, 5.2), c, { x:knee[0], y:knee[1], r:6 }, { flat:true }); S.rivet(g, knee[0], knee[1], 1.4, c);
  S.tube(g, SO([[ank[0] - 6, ank[1] + 6], [ank[0] - 6, ank[1] + 10], [ank[0] + 6, ank[1] + 10], [ank[0] + 6, ank[1] + 6]]), IRONK, 2);   // stirrup
  metal(g, SM([[ank[0] - 6, ank[1] - 2], [ank[0] + 6, ank[1] - 2], [ank[0] + 7, ank[1] + 6, 1], [ank[0] - 7, ank[1] + 6, 1]], .6), STEELD, { x:ank[0], y:ank[1] + 2, r:7 }, { flat:true });
}
/** The jouster's lance, from the hand at (hx, hy) toward angle a: butt, crimson-and-white spiral stripes, a steel vamplate cone and a coronel tip. */
function lance(g, hx, hy, a, len){
  g.save(); g.translate(hx, hy); g.rotate(a);
  const shaft = SM([[-18, -3.4, 1], [6, -5.2, 1], [len, -1.6, 1], [len + 2, 0, 1], [len, 1.6, 1], [6, 5.2, 1], [-18, 3.4, 1], [-20, 0, 1]], .3);
  S.part(g, shaft, LANCEW, { x:len * .3, y:0, r:len * .45 }, { mat:'paint', hx:len * .2, hy:-2 });
  g.save(); shaft(g); g.clip();
  for (let x = 10; x < len; x += 12){ S.dot(g, PL([[x, -7], [x + 6, -7], [x + 2, 7], [x - 4, 7]]), CRIM.base, .95); S.dot(g, PL([[x + 1, -7], [x + 2.5, -7], [x - 1.5, 7], [x - 3, 7]]), CRIM.light, .35); }
  const gr = g.createLinearGradient(0, -6, 0, 6); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(.35, 'rgba(255,255,255,0)'); gr.addColorStop(.7, 'rgba(20,8,30,0)'); gr.addColorStop(1, 'rgba(20,8,30,.45)'); g.fillStyle = gr; g.fillRect(-22, -7, len + 30, 14);
  g.restore(); S.stroke(g, shaft, CRIMD, 1.2, .7);
  metal(g, PL([[len - 2, -2.6], [len + 9, 0], [len - 2, 2.6]]), STEEL, { x:len + 3, y:0, r:6 }, { flat:true });   // coronel
  for (const s of [-1, 1]) metal(g, PL([[len + 2, s * 1.4], [len + 6, s * 5.5], [len + 7, s * 1.5]]), STEEL, { x:len + 5, y:s * 3, r:4 }, { flat:true, noEdge:true });
  gauntlet(g, 0, 0, 6.2);
  const vam = SM([[18, -5, 1], [6, -13, 1], [3, -11], [3, 11], [6, 13, 1], [18, 5, 1]], .6);   // vamplate: a steel cone guarding the hand, wide end at the hand
  metal(g, vam, STEEL, { x:9, y:-2, r:13 }, { hx:7, hy:-7 }); S.ln(g, [[6, -12], [6, 12]], STEELD, 1, .6); S.rivet(g, 11, -4, 1.2, STEEL); S.rivet(g, 11, 4, 1.2, STEEL);
  g.restore();
}
/** Arming sword: grip centred on (x, y), tilt a (0 = blade straight up), length L. glow > 0 lights the blade crimson. */
function sword(g, x, y, a, L = 42, glow = 0, seed = 3){
  g.save(); g.translate(x, y); g.rotate(a);
  metal(g, E(0, 10, 3.6, 3.6), BRASS, { x:0, y:10, r:3.6 }, { flat:true }); S.tube(g, SO([[0, 7], [0, -5]]), CRIMD, 4.4);
  metal(g, SM([[-12, -5], [-13, -9, 1], [0, -8], [13, -9, 1], [12, -5], [0, -4.6]], .6), BRASS, { x:0, y:-7, r:12 }, { flat:true });
  const blade = SM([[-4, -9, 1], [4, -9, 1], [3.4, -L + 9, 1], [0, -L, 1], [-3.4, -L + 9, 1]], .5);
  if (glow > 0){ g.save(); g.shadowColor = EYE; g.shadowBlur = 16; S.dot(g, blade, '#ff4050', .55 * glow); g.restore(); }
  metal(g, blade, STEEL, { x:0, y:-L * .55, r:L * .45 }, { flat:true, hx:-1, hy:-L + 12 }); S.ln(g, [[0, -11], [0, -L + 8]], STEELD, 1, .6);
  if (glow > 0){ S.ln(g, [[0, -11], [0, -L + 6]], { deep:'#ff8a90' }, 1.4, .8 * glow); if (glow > .5) for (let i = 0; i < 2; i++){ const R = rng(seed + i * 17); bolt(g, [(R() - .5) * 4, -L * (.3 + R() * .3)], [(R() < .5 ? -1 : 1) * (8 + R() * 6), -L - 4 - R() * 8], seed + i, .8, 3); } }
  g.restore();
}

// ---------- Storm Lancer (jousting knight) ----------
// P.walk (trot, lance carried upright), P.charge (gallop, lance couched low), P.chew (rearing, lance jabbing the wall).
export function jouster(g, P = {}){
  const w = P.walk, cg = P.charge, ch = P.chew;
  let lifts = [0, 0, 0, 0], bob = 0, rear = 0, wave = 0, lean = 0, jab = 0, plumeBlow = 0, low = false;
  if (w != null){ const a = Math.sin(w * TAU); lifts = [Math.max(0, a), Math.max(0, -a), Math.max(0, -a) * .8, Math.max(0, a) * .8]; bob = -Math.abs(a) * 3; wave = a * 3; }
  else if (cg != null){ const L = off => clamp(Math.sin((cg - off) * TAU) * 1.3); lifts = [L(.38), L(.5), L(0), L(.12)]; bob = Math.sin(cg * TAU * 2 + 1) * 3 - 3; wave = Math.sin(cg * TAU * 2) * 4 + 3; lean = 1; plumeBlow = 1; low = true; }
  else if (ch != null){ const q = Math.sin(ch * TAU); rear = .55 + .45 * q; lifts = [rear * (.75 + .25 * Math.sin(ch * TAU * 2)), rear * (.75 - .25 * Math.sin(ch * TAU * 2)), 0, 0]; wave = q * 2; jab = Math.max(0, -Math.cos(ch * TAU)); low = true; }
  const B = bob - rear * 8;
  S.shadow(g, 0, 50, 54, 8);
  // raised lance first when it is carried upright (it rises behind the plume)
  legs(g, lifts, B, false);
  g.save(); g.translate(0, B);
  horseBody(g, { cap:SLATE, trim:CRIM, wave });
  riderLeg(g, -1, STEELD); riderLeg(g, 1, STEELD);
  g.save(); g.translate(-8, -8); g.rotate(-lean * .04); g.translate(8, 8 + lean * 4);
  // torso: breastplate with a crimson tabard stripe and a bolt, faulds over the saddle
  for (const x of [-22, -8, 6]) metal(g, RR(x - 7, -14, 15, 10, 3), STEELD, { x, y:-9, r:9 }, { flat:true });
  const torso = SM([[-26, -40], [-29, -24], [-24, -10], [-8, -6], [8, -10], [13, -24], [10, -40], [-8, -46]], .85);
  metal(g, torso, STEEL, { x:-8, y:-26, r:24 }, { hx:-18, hy:-34 });
  S.part(g, SM([[-14, -44], [-2, -44], [-1, -8], [-8, -5], [-15, -8]], .6), CRIM, { x:-8, y:-26, r:16 }, { flat:true, mat:'cloth' }); boltSigil(g, -8, -26, .7);
  for (const [x, y] of [[-22, -32], [6, -32], [-22, -16]]) S.rivet(g, x, y, 1.7, STEEL);
  // pauldron on the left shoulder (viewer's right), big grand-guard on the lance side
  metal(g, SM([[2, -44], [18, -48], [24, -36], [18, -26], [6, -30]], .75), STEEL, { x:14, y:-37, r:12 }, { hx:12, hy:-44 }); S.rivet(g, 16, -38, 1.6, STEEL);
  S.tube(g, SO([[14, -32], [16, -20], [10, -10]]), IRONK, 8); gauntlet(g, 9, -9, 5.5);   // rein hand
  S.ln(g, [[9, -9], [16, -2], [20, 4]], { deep:LEATH.base }, 1.6, .95);
  metal(g, SM([[-18, -44], [-36, -50], [-44, -36], [-38, -24], [-24, -28]], .75), STEEL, { x:-32, y:-37, r:14 }, { hx:-36, hy:-44 }); S.rivet(g, -34, -38, 1.8, STEEL);
  // helm: rounded armet, a frog-mouth visor ridge, glowing crimson eyes, crimson plume
  const hy = -64, pw = plumeBlow ? 1 : 0, pwv = w != null ? Math.sin(w * TAU + 1) * 3 : ch != null ? Math.sin(ch * TAU) * 2 : Math.sin((cg ?? 0) * TAU * 2) * 2;
  S.tube(g, SO([[-6, hy - 20], [0 + pw * 4, hy - 34 - pw * 6], [14 + pw * 10, hy - 42 - pw * 4 + pwv * .3], [28 + pw * 14, hy - 38 - pw * 2 + pwv]]), PLUME, 10);
  S.tube(g, SO([[-6, hy - 20], [6 + pw * 6, hy - 28 - pw * 6], [20 + pw * 12, hy - 28 - pw * 4 + pwv * .5], [32 + pw * 14, hy - 22 + pwv]]), PLUME, 7);
  S.stroke(g, SO([[-4, hy - 24], [2 + pw * 4, hy - 36 - pw * 6], [14 + pw * 10, hy - 41 - pw * 4], [24 + pw * 14, hy - 39 - pw * 2 + pwv]]), { deep:PLUME.light }, 1.8, .6);
  for (const [x, y] of [[8, hy - 40], [16, hy - 42], [22, hy - 40]]) S.ln(g, [[x + pw * 10, y - pw * 4], [x + 3 + pw * 10, y + 5 - pw * 4]], PLUME, 1, .5);
  metal(g, SM([[-26, hy + 20], [10, hy + 20], [12, hy + 26], [-8, hy + 30], [-28, hy + 26]], .7), STEELD, { x:-8, y:hy + 24, r:18 }, { flat:true });   // gorget
  const helm = SM([[-30, hy], [-28, hy - 16], [-18, hy - 25], [2, hy - 25], [12, hy - 16], [14, hy], [10, hy + 14], [-8, hy + 20], [-26, hy + 14]], .85);
  metal(g, helm, STEEL, { x:-8, y:hy - 4, r:25 }, { hx:-20, hy:hy - 16 });
  S.ln(g, [[-8, hy - 25], [-8, hy - 8]], STEELD, 1.4, .55);   // comb ridge
  metal(g, SM([[-29, hy + 1], [-8, hy - 4], [13, hy + 1], [12, hy + 12], [-8, hy + 19], [-28, hy + 12]], .7), STEELD, { x:-8, y:hy + 8, r:21 }, { hx:-18, hy:hy + 4 });   // visor
  S.dot(g, RR(-25, hy - 7, 34, 7, 3.4), SLIT);
  visorEye(g, -15, hy - 3.5, 3.2); visorEye(g, -1, hy - 3.5, 3.2);
  for (let i = 0; i < 5; i++) S.dot(g, E(-16 + i * 4, hy + 10 - Math.abs(i - 2) * .6, 1, 1.4), SLIT, .85);   // breaths
  for (const x of [-25, 9]) S.rivet(g, x, hy + 2, 1.5, STEEL);
  g.restore();
  // horse head in front of the rider
  horseHead(g, 18, -10 + rear * -2, { wave: -wave, open: ch != null ? rear * .9 : cg != null ? .5 : 0 });
  // right arm and the lance
  const sh = [-30 + lean * 0, -38 + lean * 4];
  if (!low){ const a = -Math.PI / 2 - .32 + (w != null ? Math.sin(w * TAU) * .03 : 0); const hx = -32, hyy = -22 + (w != null ? Math.sin(w * TAU) * 1.5 : 0);
    S.tube(g, SO([sh, [-40, -28], [hx, hyy]]), IRONK, 8.5); lance(g, hx, hyy, a, 92); }
  else { const a = Math.PI * .7 - (cg != null ? .04 : 0), ux = Math.cos(a), uy = Math.sin(a), hx = -30 + ux * jab * 8, hyy = -18 + lean * 4 + uy * jab * 8;
    S.tube(g, SO([sh, [-40, -26 + lean * 3], [hx, hyy]]), IRONK, 8.5); lance(g, hx, hyy, a, 64 + jab * 6); }
  g.restore();
  if (cg != null){ const R = rng(9); for (let i = 0; i < 4; i++){ const ph = (cg + i * .25) % 1, x = (R() - .5) * 70, y = 46 - ph * 6, r = 3 + ph * 7; S.dot(g, E(x, y, r * 1.3, r * .7), '#5a6078', .4 * (1 - ph)); } }   // kicked-up mud
}

// ---------- Storm Marshal (commander knight) ----------
// P.walk (stately trot, sword held up), P.chew (horse paws, sword hacks at the wall), P.command (once: sword raised high, banner flares, lightning on the blade).
export function commander(g, P = {}){
  const w = P.walk, ch = P.chew, cm = P.command;
  let lifts = [0, 0, 0, 0], bob = 0, rear = 0, wave = 0, raise = 0, chop = 0, flare = 0, glow = 0;
  if (w != null){ const a = Math.sin(w * TAU); lifts = [Math.max(0, a) * .85, Math.max(0, -a) * .85, Math.max(0, -a) * .7, Math.max(0, a) * .7]; bob = -Math.abs(a) * 2.5; wave = a * 2.5; }
  else if (ch != null){ const q = Math.sin(ch * TAU); rear = .3 + .3 * q; lifts = [Math.max(0, q) * .9, Math.max(0, -q) * .5, 0, 0]; chop = (1 - Math.cos(ch * TAU)) / 2; wave = q * 2; }
  else if (cm != null){ raise = ease(clamp(cm / .35)); rear = Math.sin(clamp(cm / .8) * Math.PI) * .85; lifts = [rear * (.8 + .2 * Math.sin(cm * TAU * 2)), rear * (.8 - .2 * Math.sin(cm * TAU * 2)), 0, 0]; flare = ease(clamp(cm / .45)); glow = clamp((cm - .3) / .2) * (1 - clamp((cm - .9) / .1) * .4); wave = Math.sin(cm * TAU * 2) * 3; }
  const B = bob - rear * 9, flagWave = w != null ? Math.sin(w * TAU * 2) * 4 : ch != null ? Math.sin(ch * TAU) * 3 : Math.sin(cm * TAU * 3) * 4;
  S.shadow(g, 0, 50, 58, 9);
  legs(g, lifts, B, true);
  g.save(); g.translate(0, B);
  // war banner on a pole strapped to his back (behind everything on the horse)
  { const px = 22, top = -120 - flare * 4;
    S.tube(g, SO([[px - 4, -20], [px, top]]), pal('#3a2a24'), 4.2); metal(g, SM([[px - 4, top + 2], [px + 4, top + 2], [px, top - 12, 1]], .5), BRASS, { x:px, y:top - 4, r:6 }, { flat:true });
    metal(g, E(px, top + 4, 4, 2.6), BRASS, { x:px, y:top + 4, r:4 }, { flat:true });
    const fl = 40 + flare * 22, lift = flare * 10, wv = flagWave, y0 = top + 6;
    const flag = SM([[px, y0, 1], [px + fl * .5, y0 - lift * .5 + wv * .3], [px + fl + wv, y0 - lift + 2], [px + fl * .78 + wv * .5, y0 + 16 - lift * .7, 1], [px + fl + wv * .8, y0 + 30 - lift * .4], [px + fl * .5, y0 + 30 - lift * .2 - wv * .3], [px, y0 + 32, 1]], .7);
    S.part(g, flag, CRIM, { x:px + fl * .45, y:y0 + 14, r:26 }, { mat:'cloth', flat:true, hx:px + 10, hy:y0 + 6 });
    S.stroke(g, SO([[px, y0 + 1], [px + fl * .5, y0 - lift * .5 + wv * .3 + 1], [px + fl + wv - 2, y0 - lift + 3]]), { deep:BRASS.base }, 1.8, .9);
    S.crease(g, SO([[px + fl * .3, y0 + 4], [px + fl * .34 + wv * .2, y0 + 28]]), CRIM, 1.4, .4); S.crease(g, SO([[px + fl * .62, y0 + 2 - lift * .5], [px + fl * .62 + wv * .3, y0 + 26 - lift * .3]]), CRIM, 1.2, .35);
    // sigil: a crown over a lightning bolt
    const sx = px + fl * .42 + wv * .2, sy = y0 + 15 - lift * .4;
    S.dot(g, PL([[sx - 6, sy - 5], [sx - 6, sy - 11], [sx - 3, sy - 8], [sx, sy - 12], [sx + 3, sy - 8], [sx + 6, sy - 11], [sx + 6, sy - 5]]), BRASS.light, .95);
    boltSigil(g, sx, sy + 4, .55); }
  // cape behind the rider, flaring out past the caparison
  { const cw = w != null ? Math.sin(w * TAU + 1) * 3 : flare * 8, cape = SM([[-30, -46], [-46, -30], [-56 - cw, 4], [-54 - cw, 22, 1], [-44, 14, 1], [-40, -4], [24, -4], [30, 14, 1], [40 + cw * .5, 22, 1], [42 + cw * .5, 2], [34, -30], [14, -46]], .8);
    S.part(g, cape, CAPE, { x:-8, y:-14, r:44 }, { mat:'cloth', hx:-36, hy:-34 });
    for (const s of [-1, 1]) S.dot(g, SM([[-8 + s * 30, -30], [-8 + s * (44 + (s < 0 ? cw : cw * .5)), 6], [-8 + s * 36, 4]], .8), LINING.base, .9);
    S.crease(g, SO([[-36, -30], [-48 - cw, 10]]), CAPE, 1.6, .4); }
  horseBody(g, { cap:CRIM, trim:BRASS, wave, heavy:true });
  riderLeg(g, -1, STEEL); riderLeg(g, 1, STEEL);
  // torso: heavy breastplate, brass trim, crimson sash, faulds
  for (const x of [-24, -8, 8]) metal(g, RR(x - 8, -14, 17, 11, 3), STEELD, { x, y:-9, r:10 }, { flat:true });
  const torso = SM([[-28, -42], [-32, -24], [-26, -8], [-8, -4], [10, -8], [16, -24], [12, -42], [-8, -48]], .85);
  metal(g, torso, STEEL, { x:-8, y:-26, r:26 }, { hx:-20, hy:-36 });
  S.stroke(g, SO([[-26, -40], [-8, -34], [10, -40]]), { deep:BRASS.base }, 2.2, .95);
  S.part(g, SM([[-28, -22], [12, -36], [14, -28], [-26, -12]], .6), CRIM, { x:-8, y:-24, r:20 }, { flat:true, mat:'cloth' });   // sash
  metal(g, E(-8, -40, 4.4, 4.4), BRASS, { x:-8, y:-40, r:4.4 }, { flat:true }); S.dot(g, E(-8, -40, 1.8, 1.8), CRIM.base);
  for (const [x, y] of [[-24, -32], [6, -32], [-22, -14], [4, -14]]) S.rivet(g, x, y, 1.8, BRASS);
  // spiked pauldrons
  for (const s of [-1, 1]){ const cx = -8 + s * 25; metal(g, SM([[cx - s * 12, -46], [cx + s * 8, -52], [cx + s * 16, -38], [cx + s * 10, -26], [cx - s * 6, -30]], .75), STEEL, { x:cx, y:-39, r:14 }, { hx:cx - 4, hy:-46 });
    metal(g, PL([[cx - 3, -50], [cx + 4, -51], [cx + s * 2, -62]]), STEELD, { x:cx, y:-54, r:6 }, { flat:true }); S.rivet(g, cx + s * 2, -40, 1.7, BRASS); }
  S.tube(g, SO([[16, -34], [18, -20], [10, -10]]), IRONK, 9); gauntlet(g, 9, -9, 6);   // rein hand
  S.ln(g, [[9, -9], [16, -2], [20, 4]], { deep:LEATH.base }, 1.6, .95);
  // crowned great helm: flat-topped, a cross visor with glowing eyes, an iron crown with crimson gems
  const hy = -66;
  metal(g, SM([[-28, hy + 18], [12, hy + 18], [14, hy + 26], [-8, hy + 31], [-30, hy + 26]], .7), STEELD, { x:-8, y:hy + 24, r:20 }, { flat:true });
  const helm = SM([[-29, hy + 14], [-31, hy - 4], [-28, hy - 22, 1], [12, hy - 22, 1], [15, hy - 4], [13, hy + 14], [-8, hy + 20]], .7);
  metal(g, helm, STEEL, { x:-8, y:hy - 2, r:26 }, { hx:-20, hy:hy - 14 });
  S.dot(g, RR(-24, hy - 6, 32, 7, 3), SLIT); S.dot(g, RR(-11.5, hy - 6, 7, 20, 3), SLIT);
  for (const [x, y] of [[-18, hy + 9], [-14, hy + 12], [-2, hy + 12], [2, hy + 9]]) S.dot(g, E(x, y, 1.1, 1.3), SLIT, .85);
  visorEye(g, -16, hy - 2.5, 3.4 + glow * .8, glow); visorEye(g, 0, hy - 2.5, 3.4 + glow * .8, glow);
  // crown
  const ctop = hy - 22, crown = SM([[-31, ctop + 6], [-32, ctop - 6, 1], [-25, ctop - 2], [-19, ctop - 14, 1], [-13, ctop - 3], [-8, ctop - 18, 1], [-3, ctop - 3], [3, ctop - 14, 1], [9, ctop - 2], [16, ctop - 6, 1], [15, ctop + 6]], .4);
  metal(g, crown, BRASS, { x:-8, y:ctop - 4, r:22 }, { flat:true, hx:-18, hy:ctop - 2 });
  for (const [x, y] of [[-19, ctop - 13], [-8, ctop - 17], [3, ctop - 13]]) S.dot(g, E(x, y, 1.6, 1.6), '#fff1c0', .9);
  for (const x of [-20, -8, 4]){ S.part(g, E(x, ctop + 1.5, 2.6, 3), CRIM, { x, y:ctop + 1.5, r:2.8 }, { flat:true, lw:.8 }); S.dot(g, E(x - .8, ctop + .5, .8, .8), '#fff', .9); }
  // horse head
  horseHead(g, 18, -10 + rear * -2, { wave:-wave, open:ch != null ? rear * .6 : rear * .8, heavy:true });
  // sword arm (viewer's left): held up at the shoulder, raised high to command, hacking down on the chew
  const sh = [-32, -40];
  if (cm != null){ const hx = -40 - raise * 6, hyy = -26 - raise * 56, el = [-48 - raise * 6, -34 - raise * 14];
    S.tube(g, SO([sh, el, [hx, hyy]]), IRONK, 9); sword(g, hx, hyy, -.45 + raise * .38, 44, glow, 3 + Math.floor(cm * 8)); gauntlet(g, hx, hyy, 6.4); }
  else if (ch != null){ const a = -.5 - chop * 1.9 + .4, hx = -40 - chop * 4, hyy = -32 + chop * 16;
    S.tube(g, SO([sh, [-46, -30 + chop * 6], [hx, hyy]]), IRONK, 9); sword(g, hx, hyy, a, 44); gauntlet(g, hx, hyy, 6.4); }
  else { const sw = w != null ? Math.sin(w * TAU) * .05 : 0, hx = -40, hyy = -26 + sw * 20;
    S.tube(g, SO([sh, [-46, -28], [hx, hyy]]), IRONK, 9); sword(g, hx, hyy, -.42 + sw, 44); gauntlet(g, hx, hyy, 6.4); }
  g.restore();
}

// ---------- clips (registry-style) ----------
// box: the frame in drawing units holding every pose. scale: a suggested in-game scale (see the report).
export const CLIPS = {
  jouster: { name:'Storm Lancer', draw:jouster, scale:.62, box:{ x:-86, y:-126, w:146, h:186 },
    clips:{ walk:{ n:8, fps:10, pose:t => ({ walk:t }) }, charge:{ n:8, fps:16, pose:t => ({ charge:t }) }, chew:{ n:4, fps:7, pose:t => ({ chew:t }) } } },
  commander: { name:'Storm Marshal', draw:commander, scale:.62, box:{ x:-86, y:-148, w:176, h:208 },
    clips:{ walk:{ n:8, fps:7, pose:t => ({ walk:t }) }, chew:{ n:4, fps:6, pose:t => ({ chew:t }) }, command:{ n:8, fps:9, once:true, pose:t => ({ command:t }) } } },
};
