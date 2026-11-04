// ---------- The Strawlord (Nightmare Pumpkin Patch mini boss, Release 4) and its crows ----------
// Ported from docs/archive/nightmare-monsters/minibosses-patch-wood/patch_wood.js (Toy Plastic, docs/ART_BRIEF.md). A giant scarecrow nailed
// to a post: a burning jack-o'-lantern head under a slouched hat, a patchwork coat full of crows, straw bursting from the cuffs, a rusty
// sickle nailed into its right hand. Phase 1 on the post: idle, flock (the coat flaps open and crows burst out), hit. Phase 2: tear (it rips
// off the nails and drops to the ground with the sickle raised) and then stands there (engine/nightmare.js updateStrawlord). The archive's
// walk and chew clips are not used: bosses never reach the wall. Glow and shadowBlur are fine here: every clip is baked by render/anim.js.
// The registry STRAWLORD is spread into NM1 (nm1.js), which index.js adds behind `__RELEASE__ >= 4`.

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t * t * (3 - 2 * t);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;

// ---------- palettes (prop colours from render/tools.js, darkened and enriched) ----------
const POST = pal('#6b4526'), POSTD = pal('#4a2e18'), COAT = pal('#4e4272'), LINING = '#170c16', SHIRT = pal('#8a3a3a'),
  PATCH1 = pal('#7a6a56'), PATCH2 = pal('#8a3a3a'), PATCH3 = pal('#4f6a44'), STRAW = pal('#d9b455'), STRAWD = pal('#a8843a'),
  PUMP = pal('#e8762a'), STEM = pal('#6a4a2a'), HATC = pal('#33261a'), BAND = pal('#7a2a2a'), ROPE = pal('#a88c58'),
  NAIL = pal('#6e6058'), RUST = '#9a4a22', BLADE = pal('#8e8a88'), HANDLE = pal('#7a5030'), TROUS = pal('#5a4a3a'), BOOT = pal('#3a2a22'),
  CROW = pal('#2c2436'), BEAK = pal('#e8a030');

/** A flame tongue standing at (x, y), h tall; ph 0..1 flickers it. */
function flame(g, x, y, h, w, ph, lean = 0){
  const f = Math.sin(ph * TAU) * .18, f2 = Math.sin(ph * TAU * 2 + 1) * .12;
  const outer = SM([[x - w, y], [x - w * .8, y - h * .35], [x - w * .3 + lean * h * .2, y - h * (.7 + f2)], [x + lean * h * .5 + w * f * 2, y - h * (1 + f), 1], [x + w * .45 + lean * h * .2, y - h * (.6 - f2)], [x + w * .9, y - h * .3], [x + w, y]], .8);
  g.save(); g.shadowColor = '#ff7a1a'; g.shadowBlur = 10; S.dot(g, outer, '#ff7a1a', .92); g.restore();
  S.dot(g, SM([[x - w * .55, y], [x - w * .3, y - h * .5], [x + lean * h * .35 + w * f, y - h * (.72 + f * .6), 1], [x + w * .4, y - h * .4], [x + w * .55, y]], .8), '#ffc84a', .95);
  S.dot(g, E(x, y - h * .16, w * .3, h * .14), '#fff4c0', .9);
}
/** Straw spikes fanning out from (x, y) towards angle a. */
function strawBurst(g, x, y, a, n, len, seed, spread = 1.2, w = 2.2){
  const R = rng(seed); for (let i = 0; i < n; i++){ const aa = a + (i / (n - 1 || 1) - .5) * spread + (R() - .5) * .2, L = len * (.65 + R() * .5), c = i % 3 ? STRAW : STRAWD;
    S.ln(g, [[x, y], [x + Math.cos(aa) * L * .55, y + Math.sin(aa) * L * .55 + (R() - .5) * 2], [x + Math.cos(aa) * L, y + Math.sin(aa) * L]], c, w, .95); }
}
/** A crow, seen from the front (it faces the viewer, beak down). fold 1 = perched with wings tucked; flap -1..1 lifts the wings. */
function crow(g, x, y, s = 1, flap = 0, fold = 0, rot = 0, peek = 1){
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  if (fold < 1){ const k = 1 - fold;
    for (const d of [-1, 1]){ const up = flap * 14 * k, span = 10 + 22 * k;
      const wing = SM([[d * 5, -6], [d * (5 + span * .45), -10 - up * .7], [d * (5 + span), -6 - up, 1], [d * (5 + span * .92), 2 - up * .6, 1], [d * (5 + span * .7), -1 - up * .45, 1], [d * (5 + span * .62), 5 - up * .4, 1], [d * (5 + span * .4), 1 - up * .2, 1], [d * (5 + span * .3), 7, 1], [d * 6, 6, 1]], .55);
      S.part(g, wing, CROW, { x:d * (5 + span * .5), y:-3 - up * .5, r:span * .6 + 4 }, { flat:true, mat:'cloth', lw:1.2 });
      S.ln(g, [[d * 7, -4], [d * (5 + span * .8), -5 - up * .9]], { deep:'#6a5a80' }, 1, .55); } }
  else { S.part(g, SM([[-5, 10], [5, 10], [7, 22, 1], [0, 19, 1], [-7, 22, 1]], .6), CROW, { x:0, y:15, r:8 }, { flat:true, mat:'cloth', lw:1 }); }
  if (peek >= 1){ const body = SM([[-9, -4], [-10, 6], [-5, 14], [5, 14], [10, 6], [9, -4], [0, -8]]);
    S.part(g, body, CROW, { x:0, y:4, r:11 }, { mat:'cloth', hx:-4, hy:-1 });
    S.dot(g, SM([[-4, 0], [-4, 9], [0, 12], [4, 9], [4, 0]], .8), '#4a3e5a', .6);
    if (fold >= 1) for (const d of [-1, 1]) S.part(g, SM([[d * 6, -3], [d * 11, 4], [d * 9, 14, 1], [d * 4, 10]], .7), CROW, { x:d * 8, y:5, r:7 }, { flat:true, mat:'cloth', lw:1 });
    if (fold >= 1) for (const d of [-1, 1]) for (const k of [-1.5, 0, 1.5]) S.ln(g, [[d * 3, 14], [d * 3 + k, 18]], BEAK, 1.2, .9); }
  const head = E(0, -11, 8, 7.5); S.part(g, head, CROW, { x:0, y:-11, r:8 }, { mat:'cloth', hx:-3, hy:-15 });
  S.ln(g, [[-2, -18], [-4, -22]], CROW, 1.4, .9); S.ln(g, [[1, -18], [1, -23]], CROW, 1.4, .9);   // ruffled crest
  S.part(g, PL([[-3.4, -10], [3.4, -10], [0, -1]]), BEAK, { x:0, y:-7, r:4 }, { flat:true, lw:.8 }); S.ln(g, [[-2.5, -9], [2.5, -9]], BEAK, .7, .6);
  for (const d of [-1, 1]){ S.ln(g, [[d * 6.5, -16], [d * 1.5, -13.5]], CROW, 1.6, .95); S.glow(g, d * 3.6, -12.5, 1.6, '#ff3a2a'); }
  g.restore();
}

// ---------- the Strawlord ----------
/** Carved, burning jack-o'-lantern head. R radius, bright 0..1 extra blaze, bite 0..1 opens the grin, ph flame phase. */
function jackHead(g, R, bright, bite, ph){
  const ribs = [[-.66, .36, .72], [.62, .4, .74], [-.34, .46, .8], [.3, .48, .82], [-.02, .5, .84]];
  const gl = g.createRadialGradient(0, 0, R * .4, 0, 0, R * 1.7); gl.addColorStop(0, `rgba(255,170,50,${.35 + bright * .3})`); gl.addColorStop(1, 'rgba(255,170,50,0)'); g.fillStyle = gl; g.fillRect(-R * 1.8, -R * 1.8, R * 3.6, R * 3.6);
  const union = g2 => { g2.beginPath(); for (const [ox, rw, rh] of ribs) g2.ellipse(ox * R * .95, R * .04, rw * R * 1.12, R * rh, 0, 0, TAU); };
  for (const [ox, rw, rh] of ribs){ const cx = ox * R * .95; S.part(g, E(cx, R * .04, rw * R * 1.12, R * rh), PUMP, { x:cx, y:0, r:R * .8 }, { flat:Math.abs(ox) > .4, mat:'pumpkin', hx:cx - R * .12, hy:-R * .5 }); }
  S.overlay(g, union, PUMP, { x:0, y:0, r:R * 1.1 }, .55);
  g.save(); union(g); g.clip(); for (const x of [-.5, -.18, .14, .46]){ const px = x * R * .95 * 1.02, s = Math.sign(x); g.beginPath(); g.moveTo(px * .9, -R * .66); g.quadraticCurveTo(px * 1.35 + s * R * .05, 0, px * .9, R * .72); g.strokeStyle = rgba(PUMP.deep, .38); g.lineWidth = R * .07; g.lineCap = 'round'; g.stroke(); }
  // scorch marks rising from the carved holes
  const sc = g.createLinearGradient(0, -R * .9, 0, R * .2); sc.addColorStop(0, 'rgba(40,14,8,.55)'); sc.addColorStop(1, 'rgba(40,14,8,0)'); g.fillStyle = sc; for (const x of [-.36, .36]){ ell(g, x * R, -R * .45, R * .2, R * .3); g.fill(); }
  g.restore();
  // the carved face: angry slanted eyes, a nose notch and a jagged grin; dark carved rim, then the fire inside
  const ey = -R * .14, ex = R * .36, jaw = bite * R * .18;
  const eye = d => PL([[d * ex - d * R * .22, ey - R * .2], [d * ex + d * R * .2, ey + R * .02], [d * ex + d * R * .05, ey + R * .16], [d * ex - d * R * .2, ey + R * .08]]);
  const nose = PL([[-R * .08, R * .1], [R * .08, R * .1], [0, -R * .03]]);
  const mouth = g2 => { g2.beginPath(); g2.moveTo(-R * .62, R * .2); g2.lineTo(-R * .44, R * .3); g2.lineTo(-R * .36, R * .2); g2.lineTo(-R * .24, R * .32); g2.lineTo(-R * .12, R * .22); g2.lineTo(0, R * .34); g2.lineTo(R * .12, R * .22); g2.lineTo(R * .24, R * .32); g2.lineTo(R * .36, R * .2); g2.lineTo(R * .44, R * .3); g2.lineTo(R * .62, R * .2);
    g2.quadraticCurveTo(R * .4, R * .62 + jaw, 0, R * .66 + jaw); g2.lineTo(R * .1, R * .52 + jaw); g2.lineTo(-R * .02, R * .62 + jaw); g2.lineTo(-R * .14, R * .5 + jaw); g2.lineTo(-R * .2, R * .63 + jaw); g2.quadraticCurveTo(-R * .44, R * .6 + jaw, -R * .62, R * .2); g2.closePath(); };
  for (const p of [eye(-1), eye(1), nose, mouth]){ g.save(); g.translate(-R * .02, -R * .03); S.dot(g, p, '#5a1a08', 1); g.restore(); }
  g.save(); g.shadowColor = '#ffb020'; g.shadowBlur = 12 + bright * 10;
  const fire = g.createLinearGradient(0, -R * .4, 0, R * .6); fire.addColorStop(0, bright > .5 ? '#ffffff' : '#fff6c0'); fire.addColorStop(.5, '#ffc040'); fire.addColorStop(1, '#ff6a10');
  for (const p of [eye(-1), eye(1), nose, mouth]){ p(g); g.fillStyle = fire; g.fill(); }
  g.restore();
  // flame tongues licking out of the eyes
  for (const d of [-1, 1]) flame(g, d * ex + d * R * .06, ey - R * .12, R * (.34 + bright * .2), R * .1, ph + (d > 0 ? .4 : 0), d * .2);
  S.dot(g, E(-R * .1, R * .1, R * .03, R * .03), '#fff', .6);
}
/** Slouched, battered hat with a crow feather and smouldering holes. */
function strawHat(g, R, ph, tilt){
  g.save(); g.rotate(tilt);
  const by = -R * .62;
  const brim = SM([[-R * 1.32, by + 6], [-R * .9, by - 3], [0, by - 5], [R * .95, by - 4], [R * 1.36, by + 2], [R * 1.2, by + 8], [R * .5, by + 6], [-R * .6, by + 8], [-R * 1.12, by + 11]], .8);
  S.part(g, brim, HATC, { x:0, y:by + 2, r:R * 1.3 }, { mat:'cloth', hx:-R * .5, hy:by - 2 });
  const crown = SM([[-R * .64, by - 2], [-R * .7, by - R * .62], [-R * .4, by - R * 1.02], [R * .05, by - R * 1.18], [R * .2, by - R * .9, 1], [R * .5, by - R * .96], [R * .66, by - R * .5], [R * .62, by - 2]], .8);
  S.part(g, crown, HATC, { x:0, y:by - R * .55, r:R * .8 }, { mat:'cloth', hx:-R * .3, hy:by - R * .8 });
  S.crease(g, SO([[-R * .1, by - R * 1.0], [R * .04, by - R * .66], [0, by - R * .3]]), HATC, 2, .45);
  S.part(g, SM([[-R * .66, by - 1], [R * .63, by - 1], [R * .66, by - R * .22], [-R * .68, by - R * .24]], .4), BAND, { x:0, y:by - R * .1, r:R * .66 }, { flat:true, mat:'cloth' });
  // a crow feather tucked in the band
  g.save(); g.translate(R * .5, by - R * .14); g.rotate(-.5); S.part(g, SM([[0, 0], [-3, -R * .5], [0, -R * .9], [3, -R * .5]], .7), CROW, { x:0, y:-R * .45, r:R * .45 }, { flat:true, mat:'cloth', lw:1 }); S.ln(g, [[0, 2], [0, -R * .86]], { deep:'#6a5a80' }, .9, .7); g.restore();
  // patch and a smouldering burnt hole with an ember edge
  S.part(g, RR(-R * .5, by - R * .78, R * .34, R * .28, 2), PATCH1, { x:-R * .33, y:by - R * .64, r:R * .2 }, { flat:true, mat:'cloth', lw:1 });
  for (let i = 0; i < 4; i++) S.ln(g, [[-R * .5 + i * R * .1 + 1, by - R * .8], [-R * .5 + i * R * .1 + 2, by - R * .74]], PATCH1, .8, .8);
  g.save(); g.shadowColor = '#ff7a1a'; g.shadowBlur = 6; S.dot(g, E(R * .3, by - R * .5, R * .13, R * .1), '#ff8a2a', .95); g.restore(); S.dot(g, E(R * .3, by - R * .5, R * .08, R * .06), '#2a120a');
  // wisps of smoke curling off the hole
  g.save(); g.globalAlpha *= .4; for (let i = 0; i < 3; i++){ const k = (ph + i / 3) % 1, x = R * .3 + Math.sin(k * 7 + i) * 4, y = by - R * .62 - k * 22; S.dot(g, E(x, y, 3 + k * 4, 2.6 + k * 3), '#b8a8b0', 1 - k); } g.restore();
  g.restore();
}
/** Rusty sickle in a hand at the origin; the blade points along angle a (0 = right). */
function sickle(g, x, y, a, s = 1){
  g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
  S.tube(g, SO([[-12, 0], [0, 0], [16, 0]]), HANDLE, 6); S.ln(g, [[-10, -1], [14, -1]], { deep:HANDLE.light }, 1, .4);
  S.part(g, RR(14, -4, 7, 8, 2), NAIL, { x:17, y:0, r:5 }, { flat:true, mat:'metal', lw:1 });
  const blade = SM([[20, -2, 1], [30, -12], [42, -18], [56, -14], [64, -2], [62, 10, 1], [56, 0], [48, -6], [36, -5], [26, 2, 1]], .8);
  S.part(g, blade, BLADE, { x:44, y:-6, r:22 }, { mat:'metal', hx:40, hy:-14 });
  g.save(); blade(g); g.clip(); const R = rng(77); for (let i = 0; i < 7; i++) S.dot(g, E(26 + R() * 36, -14 + R() * 18, 2 + R() * 4, 1.5 + R() * 2.5, R() * 3), RUST, .55 + R() * .3); g.restore();
  S.ln(g, [[30, -9], [42, -14], [54, -11], [61, -1]], { deep:'#f2eee8' }, 1, .7);   // the honed edge
  S.dot(g, PL([[44, -6], [48, -6], [46, -2]]), LINING, .7);   // a nick
  g.restore();
}
/** A sleeve from shoulder to wrist with a frayed cuff, and the straw hand. dir: angle the hand points. */
function arm(g, sx, sy, ex, ey, hx, hy, side, seed){
  S.tube(g, SO([[sx, sy], [ex, ey], [hx, hy]]), COAT, 15);
  S.crease(g, SO([[ex - side * 3, ey - 5], [ex + side * 2, ey + 3]]), COAT, 1.5, .4);
  const a = Math.atan2(hy - ey, hx - ex);
  g.save(); g.translate(hx, hy); g.rotate(a);
  S.part(g, SM([[-6, -10], [3, -10, 1], [1, -6, 1], [4, -3, 1], [1, 0, 1], [4, 4, 1], [1, 7, 1], [3, 10, 1], [-6, 10]], .6), COAT, { x:-2, y:0, r:10 }, { flat:true, mat:'cloth', lw:1.2 });
  g.restore();
  // straw fingers (three thick bundles) plus loose straw
  strawBurst(g, hx, hy, a, 7, 13, seed, 1.5, 1.6);
  for (let i = -1; i <= 1; i++){ const aa = a + i * .45; S.tube(g, SO([[hx, hy], [hx + Math.cos(aa) * 8, hy + Math.sin(aa) * 8], [hx + Math.cos(aa + .35 * side) * 14, hy + Math.sin(aa + .35 * side) * 14]]), STRAW, 3.6); }
  S.tube(g, SO([[hx - Math.cos(a) * 3 - Math.sin(a) * 6, hy - Math.sin(a) * 3 + Math.cos(a) * 6], [hx + Math.cos(a) * 1 + Math.sin(a) * 6, hy + Math.sin(a) * 1 - Math.cos(a) * 6]]), ROPE, 2.2);   // twine at the wrist
}
/** A stuffed trouser leg from hip to foot; boot on the right leg, a straw foot on the left. */
function leg(g, hx, hy, fx, fy, side, ground, seed){
  const kx = (hx + fx) / 2 + side * 3, ky = (hy + fy) / 2;
  S.tube(g, SO([[hx, hy], [kx, ky], [fx, fy - 6]]), TROUS, 15);
  S.crease(g, SO([[kx - 4, ky - 2], [kx + 4, ky + 1]]), TROUS, 1.4, .4);
  if (side < 0) S.part(g, RR(kx - 6, ky - 5, 10, 9, 2), PATCH2, { x:kx - 1, y:ky, r:6 }, { flat:true, mat:'cloth', lw:1 });
  S.part(g, SM([[fx - 9, fy - 10], [fx + 9, fy - 10], [fx + 10, fy - 4, 1], [fx + 6, fy - 2, 1], [fx + 2, fy - 5, 1], [fx - 3, fy - 1, 1], [fx - 7, fy - 4, 1], [fx - 10, fy - 3, 1]], .6), TROUS, { x:fx, y:fy - 6, r:10 }, { flat:true, mat:'cloth', lw:1.2 });
  if (side > 0 && ground){ const boot = SM([[fx - 9, fy - 6], [fx + 8, fy - 7], [fx + 12, fy - 1], [fx + 16, fy + 3], [fx + 14, fy + 6], [fx - 9, fy + 6]], .7); S.part(g, boot, BOOT, { x:fx + 2, y:fy, r:12 }, { mat:'leather', hx:fx - 2, hy:fy - 4 }); S.ln(g, [[fx - 8, fy + 3], [fx + 13, fy + 3]], BOOT, 1, .6); S.dot(g, E(fx + 11, fy + 2, 2, 1.4), '#1a120e', .8); }
  else strawBurst(g, fx, fy - 3, ground ? Math.PI / 2 : Math.PI / 2 + side * .2, 9, ground ? 9 : 14, seed, ground ? 2.6 : 1.3, 2);
}
export function strawlord(g, P = {}){
  const idle = P.idle, fl = P.flock, hit = P.hit ?? 0, tear = P.tear, w = P.walk, ch = P.chew;
  const ph = idle ?? fl ?? w ?? ch ?? tear ?? 0;
  // phase blend: post 1 = nailed to the post, 0 = free
  let post = 1, oy = -8, shake = 0, armK = 0, fall = 0, stumpA = 1, raise = 0, nailsOut = 0;
  if (w != null || ch != null){ post = 0; oy = 0; stumpA = 0; }
  if (tear != null){
    const a = seg(tear, 0, .34), b = seg(tear, .34, .48), c = seg(tear, .48, .72), d = seg(tear, .72, 1);
    shake = a * (1 - b) * Math.sin(tear * 90) * 2.4; armK = ease(b); post = 1 - armK; nailsOut = b;
    oy = c < 1 ? lerp(-8, 6, c * c) : lerp(6, 0, ease(d)); fall = ease(seg(tear, .38, .9)); stumpA = 1 - seg(tear, .8, 1); raise = Math.sin(d * Math.PI * .5) * (1 - seg(tear, .97, 1) * 0);
  }
  const sw = idle != null ? Math.sin(idle * TAU) : fl != null ? Math.sin(fl * TAU * .5) * .3 : 0;
  // walk / chew rhythm
  const wp = w ?? 0, step = w != null ? Math.sin(wp * TAU) : 0, bob = w != null ? -Math.abs(Math.cos(wp * TAU)) * 4 : 0;
  let chop = 0; if (ch != null) chop = ch < .5 ? ease(ch / .5) : 1 - ease((ch - .5) / .5);   // 0 rest .. 1 raised; the hack is the fall
  const lean = ch != null ? (1 - chop) * 4 : 0;
  const hitK = hit ? Math.sin(hit * Math.PI) : 0;
  const open = fl != null ? (fl < .22 ? ease(fl / .22) : fl < .62 ? 1 : 1 - ease((fl - .62) / .38)) : 0;
  g.save(); g.translate(shake + hitK * 3, 0);
  S.shadow(g, 0, 52, post > .5 ? 34 : 50, 8);
  // the post and crossbar behind the figure
  if (stumpA > 0){ g.save(); g.globalAlpha *= stumpA;
    S.tube(g, SO([[0, 52], [0, -2]]), POST, 13);
    if (fall > 0) S.part(g, PL([[-7, -4], [-3, -10], [1, -5], [4, -12], [7, -4]]), POSTD, { x:0, y:-6, r:7 }, { flat:true, mat:'wood', lw:1 });
    for (let i = 0; i < 3; i++) S.ln(g, [[-5, 40 - i * 13], [5, 37 - i * 13]], POSTD, 1, .45);
    g.restore();
    g.save(); g.globalAlpha *= 1 - fall; g.translate(0, -4); g.rotate(-fall * .7); g.translate(fall * -10, fall * 14);
    S.tube(g, SO([[0, 0], [0, -100]]), POST, 13); S.tube(g, SO([[-100, -56], [100, -56]]), POST, 10);
    for (const d of [-1, 1]) S.part(g, E(d * 100, -56, 5, 5), POSTD, { x:d * 100, y:-56, r:5 }, { flat:true, mat:'wood', lw:1 });
    S.tube(g, SO([[-6, -62], [6, -50]]), ROPE, 3); S.tube(g, SO([[6, -62], [-6, -50]]), ROPE, 3);
    g.restore(); }
  g.save(); g.translate(0, oy + bob);
  // legs
  const dangle = post * (idle != null ? Math.sin(idle * TAU + 1) * 2 : 0);
  for (const s of [-1, 1]){ const lift = w != null ? Math.max(0, Math.sin(wp * TAU + (s < 0 ? 0 : Math.PI))) * 9 : 0;
    const fx = s * lerp(13, 17, 1 - post) + dangle * s * .3, fy = lerp(50 - oy - bob, 40, post) - lift + (ch != null && s > 0 ? -2 : 0);
    leg(g, s * 11, 4, fx, fy, s, post < .5, 30 + s * 7); }
  if (post > .3){ g.save(); g.globalAlpha *= clamp((post - .3) / .4); S.tube(g, SO([[-20, 22], [0, 26], [20, 22]]), ROPE, 3.4); S.tube(g, SO([[-20, 28], [0, 31], [20, 28]]), ROPE, 2.6); g.restore(); }
  g.save(); g.translate(0, lean); g.rotate(sw * .03 * post + (w != null ? step * .03 : 0) - hitK * .04);
  // the hollow inside the coat (seen when it opens), straw ribs and glinting eyes
  const ty = -58, hem = 16;
  if (open > 0){ const hole = SM([[-20, ty + 2], [-30, -20], [-28, hem - 4], [0, hem + 2], [28, hem - 4], [30, -20], [20, ty + 2]], .8);
    S.dot(g, hole, LINING); g.save(); hole(g); g.clip();
    for (let i = 0; i < 5; i++) S.stroke(g, SO([[-26, -44 + i * 12], [0, -38 + i * 12], [26, -44 + i * 12]]), STRAWD, 3, .7);
    for (const [x, y] of [[-12, -30], [10, -14], [-6, 2]]) for (const d of [-1, 1]) S.glow(g, x + d * 2.5, y, 1.3, '#ff3a2a');
    g.restore(); }
  // shirt front under the coat
  S.part(g, SM([[-14, ty + 2], [14, ty + 2], [16, hem - 6], [0, hem - 2], [-16, hem - 6]], .7), SHIRT, { x:0, y:-22, r:30 }, { mat:'cloth', hx:-6, hy:-40 });
  for (let i = 0; i < 4; i++) S.ln(g, [[-12, -44 + i * 14], [12, -42 + i * 14]], SHIRT, 1.2, .35);
  strawBurst(g, 0, hem - 2, Math.PI / 2, 9, 16, 5, 1.6, 2);
  // coat panels, each pivoting about its shoulder (flock flaps them open like wings)
  for (const s of [-1, 1]){ g.save(); g.translate(s * 30, ty + 2); g.rotate(s * open * 1.05); g.scale(1 + open * .15, 1); g.translate(-s * 30, -(ty + 2));
    const panel = SM([[s * 2, ty], [s * 34, ty + 4], [s * 38, -22], [s * 44, hem, 1], [s * 36, hem - 7, 1], [s * 30, hem + 4, 1], [s * 22, hem - 5, 1], [s * 14, hem + 3, 1], [s * 6, hem - 6, 1], [s * 3, -10]], .7);
    S.part(g, panel, COAT, { x:s * 22, y:-22, r:40 }, { mat:'cloth', flat:true });
    S.crease(g, SO([[s * 24, -40], [s * 28, -14], [s * 30, 8]]), COAT, 2, .4); S.crease(g, SO([[s * 12, -30], [s * 14, 0]]), COAT, 1.5, .3);
    if (s < 0){ S.part(g, RR(-30, -8, 13, 13, 2), PATCH3, { x:-24, y:-2, r:8 }, { flat:true, mat:'cloth', lw:1 }); for (let i = 0; i < 5; i++) S.ln(g, [[-31, -6 + i * 3], [-29, -6 + i * 3]], PATCH3, .8, .8); }
    else { S.part(g, RR(18, -40, 14, 11, 2), PATCH1, { x:25, y:-35, r:8 }, { flat:true, mat:'cloth', lw:1 }); for (let i = 0; i < 4; i++) S.ln(g, [[19 + i * 4, -41], [20 + i * 4, -39]], PATCH1, .8, .8);
      for (const y of [-40, -24, -8]) S.rivet(g, 7, y, 2.2, PATCH1); }
    for (const x of [s * 40, s * 26, s * 10]) S.thread(g, x, hem - 2, s, COAT);
    // a torn hole in the left panel, a crow peeking out of it on idle
    if (s < 0){ const hole = SM([[-24, -34], [-17, -38, 1], [-12, -31], [-15, -24, 1], [-22, -25]], .7); S.dot(g, hole, LINING);
      const pk = idle != null ? clamp(Math.sin(idle * TAU + 2.2) * 1.6) : 0;
      if (pk > 0){ g.save(); hole(g); g.clip(); crow(g, -18, -24 - pk * 6, .62, 0, 1, -.15, 0); g.restore(); } }
    g.restore(); }
  // collar
  S.part(g, SM([[-24, ty - 2], [-6, ty + 10, 1], [0, ty + 4], [6, ty + 10, 1], [24, ty - 2], [10, ty - 6], [-10, ty - 6]], .7), COAT, { x:0, y:ty + 2, r:22 }, { flat:true, mat:'cloth' });
  // arms: nailed out along the crossbar on the post, hanging (sickle in the right hand) when free
  const fA = 1 - post, swingL = w != null ? Math.sin(wp * TAU + Math.PI) * 6 : 0, swingR = w != null ? Math.sin(wp * TAU) * 6 : 0;
  let rh = [lerp(78, 50, fA), lerp(-56 - oy, -6 + swingR, fA)], lh = [lerp(-78, -50, fA), lerp(-56 - oy, 2 + swingL, fA)];
  if (tear != null && tear < .34){ const k = Math.sin(seg(tear, 0, .34) * Math.PI) * 6; rh = [rh[0] - k, rh[1]]; lh = [lh[0] + k, lh[1]]; }
  if (raise > 0) rh = [lerp(rh[0], 46, raise), lerp(rh[1], -84, raise)];
  if (ch != null) rh = [lerp(34, 44, chop), lerp(16, -78, chop)];
  if (hitK) { lh = [lh[0] - hitK * 3, lh[1] - hitK * 6]; rh = [rh[0] + hitK * 3, rh[1] - hitK * 6]; }
  if (open > 0 && post > .5){ lh = [lh[0], lh[1] - open * 4]; rh = [rh[0], rh[1] - open * 4]; }
  const re = [lerp(54, 46, fA) + (ch != null ? 8 : 0), lerp(-58 - oy, -34, fA) + (ch != null ? -14 * chop : 0) - raise * 18], le = [lerp(-54, -48, fA), lerp(-58 - oy, -30, fA)];
  // sickle angle: hangs below the hand on the post, swung up when free
  const sa = ch != null ? lerp(.7, -1.9, chop) : raise > 0 ? lerp(lerp(1.35, -.6, fA), -1.7, raise) : lerp(1.35, -.65, fA) + swingR * .02 + hitK * .3;
  sickle(g, rh[0], rh[1], sa, 1);
  arm(g, -30, ty + 4, le[0], le[1], lh[0], lh[1], -1, 11);
  arm(g, 30, ty + 4, re[0], re[1], rh[0], rh[1], 1, 12);
  // nails through the wrists (popping out on tear)
  if (post > 0 || nailsOut > 0) for (const d of [-1, 1]){ const k = nailsOut, nx = d * (72 + k * 18), ny = -56 - oy - k * 26 + k * k * 30;
    g.save(); g.globalAlpha *= 1 - seg(nailsOut, .6, 1); g.translate(nx, ny); g.rotate(k * d * 3);
    S.part(g, RR(-1.6, -9, 3.2, 12, 1), NAIL, { x:0, y:-3, r:5 }, { flat:true, mat:'metal', lw:.8 }); S.rivet(g, 0, -9, 3.6, NAIL); S.dot(g, E(0, -3, 1.4, 4), RUST, .55); g.restore(); }
  if (tear != null && nailsOut > 0 && nailsOut < 1) for (const d of [-1, 1]) strawBurst(g, d * 66, -56 - oy + 4, d < 0 ? Math.PI : 0, 9, 10 + nailsOut * 18, 90 + d, 2.6, 1.8);
  // crows: one on the crossbar end, one in the collar
  if (post > .5 && fl == null){ const hop = idle != null ? Math.max(0, Math.sin(idle * TAU * 2)) * 3 : 0;
    crow(g, -100, -74 - oy - hop, .78, 0, 1, idle != null ? Math.sin(idle * TAU) * .15 : 0); }
  const cp = idle != null ? clamp(Math.sin(idle * TAU) * 1.4 + .3) : 0;
  if (cp > 0){ g.save(); g.beginPath(); g.rect(-40, -140, 80, 140 + ty - 2); g.clip(); crow(g, 16, ty + 8 - cp * 14, .66, 0, 1, .2, 0); g.restore(); }
  // the head and hat
  const ht = sw * .06 * post + (w != null ? step * .05 : 0) - hitK * .3 + (ch != null ? .08 * (1 - chop) : 0) + (tear != null ? Math.sin(tear * 70) * .06 * (1 - seg(tear, .5, .6)) : 0);
  g.save(); g.translate(sw * 2 * post, ty - 26 - hitK * 4 + (ch != null ? 4 * (1 - chop) : 0)); g.rotate(ht);
  const bright = hitK + (fl != null ? open * .6 : 0) + (raise > 0 ? raise * .5 : 0);
  jackHead(g, 28, bright, ch != null ? 1 - chop : fl != null ? open : raise * .6, ph);
  strawHat(g, 28, ph, -.12 + sw * .03);
  strawBurst(g, -28, -10, Math.PI * .95, 5, 12, 41, 1, 1.6); strawBurst(g, 28, -12, .05, 5, 12, 42, 1, 1.6);
  g.restore();
  // hit: straw bits flying off
  if (hitK){ const R = rng(5); g.save(); g.globalAlpha *= 1 - hit * .7; for (let i = 0; i < 12; i++){ const a = -Math.PI * (.05 + R() * .9), d = 20 + hit * 40 * (.6 + R()), x = (R() - .5) * 50 + Math.cos(a) * d, y = -30 + Math.sin(a) * d * .8; S.ln(g, [[x, y], [x + Math.cos(i) * 6, y + Math.sin(i) * 6]], i % 2 ? STRAW : STRAWD, 2, .95); } g.restore(); }
  g.restore();
  g.restore();
  // flock: crows burst out of the coat, flying out and up the field, fading at the edges
  if (fl != null){ const R = rng(19);
    for (let i = 0; i < 8; i++){ const delay = .14 + R() * .16, u = seg(fl, delay, delay + .62); if (u <= 0 || u >= 1) { R(); R(); continue; }
      const ang = -Math.PI * (.08 + (i / 7) * .84) + (R() - .5) * .2, dist = 30 + ease(u) * (56 + R() * 16), x = Math.cos(ang) * dist * .85, y = -26 + oy + Math.sin(ang) * dist * .95 - u * 8;
      g.save(); g.globalAlpha *= 1 - seg(u, .5, .8); crow(g, x, y, .5 + u * .4, Math.sin(u * TAU * 2.5 + i), 0, Math.cos(ang) * .35); g.restore(); }
    if (fl > .12 && fl < .5){ const R2 = rng(8); g.save(); g.globalAlpha *= 1 - seg(fl, .3, .5); for (let i = 0; i < 14; i++){ const a = -Math.PI * R2(), d = 20 + seg(fl, .12, .5) * 60 * (.5 + R2()), x = Math.cos(a) * d, y = -26 + oy + Math.sin(a) * d; S.dot(g, E(x, y, 3, 1.4, a + i), i % 3 ? '#2c2436' : STRAW.base, .9); } g.restore(); }
  }
  // tear: splinters off the snapping post
  if (tear != null && fall > 0 && fall < 1){ const R = rng(3); g.save(); g.globalAlpha *= 1 - fall; for (let i = 0; i < 8; i++){ const a = -Math.PI * (.1 + R() * .8), d = 10 + fall * 40 * (.5 + R()); S.part(g, E(Math.cos(a) * d, -8 + Math.sin(a) * d, 4, 1.4, a), POST, { x:0, y:0, r:4 }, { flat:true, lw:.8 }); } g.restore(); }
  g.restore();
}
/** A single crow as its own flying monster (front view, like the bat): P.fly 0..1. */
export function crowMob(g, P = {}){
  const f = P.fly ?? 0, flap = Math.sin(f * TAU), bob = -flap * 3;
  S.shadow(g, 0, 50, 20, 4);
  crow(g, 0, 8 + bob, 1.45, flap, 0, Math.sin(f * TAU * .5) * .06);
}


// ---------- registry ----------
// Only the clips the fight plays are baked (idle as `walk`, the engine's boss idle name; flock; hit; tear), and the bake scale is capped
// like the Hollow King's (at 2), so its frames stay small on a phone (tools/nm_check.py check_strawlord_baked: 9.7 MB at bake scale 2.5, limit 10).
// The box is the archive's trimmed to what the four clips draw (measured: x -123..112, y -152..59), with 2-3 units to spare.
// In phase 2 it holds the last frame of tear: off the post, on the ground, sickle raised (the archive's walk and chew are not used).
const clips = { walk:{ n:8, fps:6, pose:t => ({ idle:t }) }, flock:{ n:12, fps:12, once:true, pose:t => ({ flock:t }) },
  hit:{ n:5, fps:14, once:true, pose:t => ({ idle:0, hit:t }) }, tear:{ n:12, fps:10, once:true, pose:t => ({ tear:t }) } };
export const STRAWLORD = {
  // r 30 boss footprint: the feet sit 20 below the centre (50 x .56 - 8), as the Gravekeeper's do
  strawlord: { draw:strawlord, scale:.56, dy:-8, box:{ x:-126, y:-154, w:241, h:216 }, clips, still:{ idle:0 }, maxK:2,
    frame:(m, cl) => m.phase2 && !(m.anim && m.anim.clip === 'tear') ? ['tear', cl.tear.n - 1] : null },
  // a crow flies like a bat (r 14): `fly` is baked as its walk; at the wall it keeps flapping
  crow: { draw:crowMob, scale:.6, dy:-8, box:{ x:-60, y:-34, w:120, h:90 }, clips:{ walk:{ n:6, fps:14, pose:t => ({ fly:t }) } }, still:{ fly:.25 } },
};
