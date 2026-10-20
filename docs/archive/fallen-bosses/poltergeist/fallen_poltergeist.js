// ---------- The Fallen Poltergeist (nightmare Foggy Hollow), Toy Plastic style ----------
// Design-archive sketch, NOT wired into the game. A copy of `poltergeist` from src/engine/render/chars/w2.js plus a
// `variant: 'fallen'` look: the same spectre at full-form size, but rotten. Poison-green ghostfire where its soul-glow was,
// a shroud stained and dripping with green-black rot and torn open on ribs and a burning heart, a reaper cowl with a skull
// glimpsed in the hood, red ember eyes, black fog curling off it, a scythe-shaped shadow looming behind it and a rusted
// chain with a burning skull. `form2` and the plain form still draw exactly as in the game.
// Clips/poses supported (same as the original): idle, swap, recolour, fade (teleport). In the fallen variant a swap is a
// black fog swirl and a recolour sprays rot instead of paint.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/render/paint.js';
import { TAU } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/util.js';

// ---------- palette (original) ----------
const SPIRIT = pal('#c4dfe8'), TOOTH = pal('#dbe5ec'), SOUL = '#9ef4e2', SOUL2 = '#7ff0ff', VOID = '#0a0f18';
const SHROUD = pal('#aab5c6'), SHROUDD = pal('#6f7e94'), SHROUD2 = pal('#7c879b'), SHROUD2D = pal('#4b5669');
const PAINT = ['#5fbf3a', '#f2c230', '#8a4ad0', '#e85a3a', '#3aa0e0', '#f070a8'];
// ---------- palette (fallen): nightmare Foggy Hollow is poison-green fog under a sickly moon (#d8ffb0), fog #3aa060, red watching eyes ----------
const ROT = pal('#7b857a'), ROTD = pal('#3a4438'), ROTBONE = pal('#c9c8a4'), ROTSPIRIT = pal('#9fcf9a'), ROTTOOTH = pal('#c2bb84'), RUST = pal('#4a3a2a');
const BLIGHT = '#8cff5c', BLIGHT2 = '#d8ffb0', EMBER = '#ff2e2e', EMBER2 = '#ffb08a', ROTVOID = '#040a06', STAIN = '#0e1c10', STAIN2 = '#1f3a1e', FOG = '#132a18';
const ROTPAINT = ['#2f4a1e', '#5a3c1a', '#1c2a10', '#6a5a22', '#3a1f2a', '#243a2a'];

// ---------- helpers (copied from w2.js) ----------
/** A soft puff of mist: translucent gradient ball with a faint rim. */
function puff(g, x, y, r, a = .7, col = '#e6f4fb'){
  const gr = g.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r); gr.addColorStop(0, rgba('#ffffff', a)); gr.addColorStop(.55, rgba(col, a * .75)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; ell(g, x, y, r, r * .9); g.fill();
}
/** Streaks of mist rising from a point (used by fades). dark = fallen black fog. */
function streaks(g, x, y, t, n, seed, up = 40, dark = false){
  const R = rng(seed);
  for (let i = 0; i < n; i++){ const ox = (R() - .5) * 40, sp = 12 + R() * 22, r = 4 + R() * 6, ph = R(); const k = (t + ph) % 1, yy = y - k * up - R() * 10, a = (1 - k) * .55 * Math.min(1, t * 3 + .2);
    if (dark) fogPuff(g, x + ox + Math.sin((t + ph) * 8) * 5, yy, r * (1.2 + k * 1.1), a * 1.3); else puff(g, x + ox + Math.sin((t + ph) * 8) * 5, yy, r * (1 + k * .8), a); }
}
/** Tattered hem points: alternating low and high sharp corners between x1 and x2, waving with `ph`. */
function tatters(x1, x2, y, n, ph, depth = 10){
  const pts = []; for (let i = 0; i <= n; i++){ const t = i / n, x = x1 + (x2 - x1) * t, low = i % 2 === 0; pts.push([x, y + (low ? Math.sin(ph + i * 1.3) * 3 : -depth + Math.sin(ph + i) * 2), 1]); } return pts;
}
/** Long grasping spectre hand: a small bony palm, four thin bent fingers and a thumb, each tipped with a claw.
 *  dir = reach direction, curl 0 (splayed) → 1 (clenched), cd = which way the fingers bend (±1), spread widens the fan. */
function specHand(g, x, y, c, dir, curl = .3, spread = 1, cd = 1, len = 22, clawCol = '#eaf1f6'){
  const w = 4;
  const finger = (ang, L, bend) => { const mx = x + Math.cos(ang) * L * .5, my = y + Math.sin(ang) * L * .5, a2 = ang + bend, tx = mx + Math.cos(a2) * L * .5, ty = my + Math.sin(a2) * L * .5;
    S.tube(g, SO([[x, y], [mx, my], [tx, ty]]), c, w); S.dot(g, E(mx, my, w * .5, w * .5), rgba(c.dark, .45)); S.claw(g, tx, ty, a2, 5.5, clawCol); };
  for (let i = 0; i < 4; i++){ const ang = dir + (i - 1.5) * .36 * spread, L = len * (i === 0 || i === 3 ? .82 : 1); finger(ang, L, (.25 + curl * 1.1) * cd); }
  finger(dir - cd * 1.05, len * .55, (.2 + curl * .8) * cd);   // thumb
  S.part(g, E(x, y, 8.5, 7.2, dir), c, { x, y, r:8.5 }, { flat:true, mat:'bone' });
  S.dot(g, E(x + Math.cos(dir) * 3, y + Math.sin(dir) * 3, 4.5, 3, dir), rgba(c.dark, .4));
}
/** Torn shroud strips trailing down from y0, spread between x1 and x2, waving with `ph`. Returns the strip tips (for drips). */
function shreds(g, c, ph, n, y0, x1, x2, len, seed, rot = false){
  const R = rng(seed), tips = [];
  for (let i = 0; i < n; i++){ const t = n === 1 ? .5 : i / (n - 1), bx = x1 + (x2 - x1) * t, L = len * (.7 + R() * .5), wv = Math.sin(ph + i * 1.4 + R()) * 7, w0 = 9 + R() * 4;
    const p = SM([[bx - w0, y0], [bx - w0 * .9 + wv * .3, y0 + L * .35], [bx - w0 * .5 + wv, y0 + L * .7], [bx - 3 + wv * 1.3, y0 + L, 1], [bx + 2 + wv * 1.2, y0 + L * .8, 1], [bx + w0 * .5 + wv, y0 + L * .6], [bx + w0 * .9 + wv * .3, y0 + L * .3], [bx + w0, y0]], .8);
    S.part(g, p, c, { x:bx, y:y0 + L * .4, r:L * .55 }, { flat:true, mat:'cloth', hx:bx - 3, hy:y0 + 8 });
    if (rot){ g.save(); p(g); g.clip(); const gr = g.createLinearGradient(0, y0 + L * .3, 0, y0 + L); gr.addColorStop(0, rgba(STAIN, 0)); gr.addColorStop(1, rgba(STAIN, .8)); g.fillStyle = gr; g.fillRect(bx - 20, y0, 40, L + 4); g.restore(); }
    S.thread(g, bx - 3 + wv * 1.3, y0 + L, wv > 0 ? 1 : -1, c); tips.push([bx - 1 + wv * 1.3, y0 + L]); }
  return tips;
}
/** A chain of small links hanging from (x, y) with a cracked soul-orb bauble at the end; sw = sideways swing. */
function soulChain(g, x, y, len, sw, c, glow, skull = false){
  const n = Math.round(len / 5); g.save(); g.globalAlpha *= .85;
  for (let i = 0; i <= n; i++){ const t = i / n, lx = x + sw * t * t, ly = y + len * t; g.beginPath(); g.ellipse(lx, ly, 1.6, 2.4, sw * t * .05, 0, TAU); g.strokeStyle = rgba(c.light, .9); g.lineWidth = 1.1; g.stroke(); }
  const bx = x + sw, by = y + len + 5;
  if (skull){   // fallen: a tiny burning skull swings on the chain
    g.save(); g.shadowColor = glow; g.shadowBlur = 10; S.part(g, SM([[-5.5, -2], [-4, -6.5], [0, -8], [4, -6.5], [5.5, -2], [4, 3], [2.5, 6], [-2.5, 6], [-4, 3]].map(([px, py]) => [bx + px, by + py]), .8), ROTBONE, { x:bx, y:by - 1, r:6 }, { flat:true, mat:'bone', lw:1 }); g.restore();
    S.dot(g, E(bx - 2.2, by - 2, 1.5, 1.7), ROTVOID); S.dot(g, E(bx + 2.2, by - 2, 1.5, 1.7), ROTVOID); S.dot(g, E(bx - 2.2, by - 2, .8, .9), glow, .95); S.dot(g, E(bx + 2.2, by - 2, .8, .9), glow, .95);
    S.ln(g, [[bx - 2.5, by + 3.2], [bx + 2.5, by + 3.2]], ROTBONE, .8, .6); S.ln(g, [[bx - 1.2, by + 2.2], [bx - 1.2, by + 4.5]], ROTBONE, .6, .6); S.ln(g, [[bx + 1.2, by + 2.2], [bx + 1.2, by + 4.5]], ROTBONE, .6, .6);
    g.restore(); return; }
  g.save(); g.shadowColor = glow; g.shadowBlur = 8; S.part(g, E(bx, by, 5.5, 6), pal('#3a4256'), { x:bx, y:by, r:5.5 }, { mat:'metal' }); g.restore();
  S.ln(g, [[bx - 2.5, by - 3], [bx + .5, by], [bx - 1, by + 3.5]], { deep:glow }, 1.2, .95); S.dot(g, E(bx + 1.5, by - 1, 1.2, 1.2), glow, .9);
  g.restore();
}

// ---------- fallen helpers ----------
/** A curl of black rotting fog: a dark gradient ball with a faint green rim. */
function fogPuff(g, x, y, r, a = .6){
  const gr = g.createRadialGradient(x - r * .2, y - r * .2, 0, x, y, r); gr.addColorStop(0, rgba('#1b3620', a)); gr.addColorStop(.45, rgba(FOG, a * .9)); gr.addColorStop(.85, rgba('#071009', a * .35)); gr.addColorStop(1, rgba(BLIGHT, 0));
  g.fillStyle = gr; ell(g, x, y, r, r * .85); g.fill();
}
/** A tongue of poison-green ghostfire rising from (x, y): bright core, soft halo. k = size, lean = sideways tip offset. */
function ghostfire(g, x, y, k, lean, a = 1, seed = 0){
  const tip = y - k * 2.1, p = SM([[x - k * .55, y], [x - k * .62, y - k * .7], [x - k * .3 + lean * .4, y - k * 1.4], [x + lean, tip, 1], [x + k * .28 + lean * .5, y - k * 1.3], [x + k * .6, y - k * .6], [x + k * .55, y]], .8);
  g.save(); g.globalAlpha *= a; g.shadowColor = BLIGHT; g.shadowBlur = 10;
  let gr = g.createLinearGradient(0, y, 0, tip); gr.addColorStop(0, rgba(BLIGHT, .85)); gr.addColorStop(.65, rgba(BLIGHT, .55)); gr.addColorStop(1, rgba(BLIGHT, 0)); p(g); g.fillStyle = gr; g.fill(); g.restore();
  const core = SM([[x - k * .22, y], [x - k * .26, y - k * .55], [x + lean * .3, y - k * 1.25, 1], [x + k * .24, y - k * .5], [x + k * .22, y]], .8);
  g.save(); g.globalAlpha *= a; gr = g.createLinearGradient(0, y, 0, y - k * 1.3); gr.addColorStop(0, rgba(BLIGHT2, .95)); gr.addColorStop(1, rgba(BLIGHT2, 0)); core(g); g.fillStyle = gr; g.fill(); g.restore();
}
/** A drip of rot hanging from (x, y): a thin run that swells into a drop. */
function drip(g, x, y, len, w = 2.2){
  S.stroke(g, SO([[x, y], [x + .3, y + len * .5], [x, y + len]]), { deep:STAIN }, w, .9);
  const dy = y + len; g.save(); g.shadowColor = rgba(BLIGHT, .5); g.shadowBlur = 3; S.dot(g, E(x, dy + 1.2, w * .95, w * 1.25), STAIN); g.restore(); S.dot(g, E(x - w * .3, dy + .4, w * .25, w * .32), rgba(BLIGHT2, .55));
}
/** Rot stains with drips, clipped to a shape: dark green-black blotches that creep over the cloth. */
function rotStains(g, clip, seed, blobs, bx, by, bw, bh){
  g.save(); clip(g); g.clip(); const R = rng(seed);
  for (let i = 0; i < blobs; i++){ const x = bx + (R() - .5) * bw, y = by + (R() - .5) * bh, r = 6 + R() * 7, pts = []; for (let k = 0; k < 8; k++){ const a = k / 8 * TAU, rr = r * (.55 + R() * .9); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8]); }
    const p = SM(pts, .9); g.save(); p(g); g.clip(); const gr = g.createRadialGradient(x, y, 0, x, y, r * 1.1); gr.addColorStop(0, rgba(STAIN, .85)); gr.addColorStop(.7, rgba(STAIN, .7)); gr.addColorStop(1, rgba(STAIN2, .25)); g.fillStyle = gr; g.fillRect(x - r * 2, y - r * 2, r * 4, r * 4); g.restore();
    S.dot(g, E(x - r * .3, y - r * .35, r * .3, r * .18, -.4), rgba(BLIGHT2, .14));   // wet sheen
    const nd = 1 + (R() < .5 ? 1 : 0); for (let d = 0; d < nd; d++) drip(g, x + (R() - .5) * r * 1.2, y + r * .6, 6 + R() * 16, 1.6 + R() * 1.2); }
  g.restore();
}
/** A torn hole in the shroud clipped to it: ragged void with frayed cloth edges and a green inner light; `inner` draws what shows through. */
function hole(g, clip, c, pts, glow, inner){
  const p = SM(pts, .5); g.save(); clip(g); g.clip();
  S.dot(g, p, ROTVOID); g.save(); p(g); g.clip(); const cx = pts.reduce((s, q) => s + q[0], 0) / pts.length, cy = pts.reduce((s, q) => s + q[1], 0) / pts.length; const gr = g.createRadialGradient(cx, cy, 1, cx, cy, 26); gr.addColorStop(0, rgba(glow, .35)); gr.addColorStop(1, rgba(glow, 0)); g.fillStyle = gr; g.fillRect(cx - 40, cy - 40, 80, 80);
  if (inner) inner(); g.restore();
  S.stroke(g, p, { deep:c.light }, 1.3, .5); S.stroke(g, p, { deep:c.deep }, .8, .9);
  for (let i = 0; i < pts.length; i += 2) S.thread(g, pts[i][0], pts[i][1], pts[i][0] < cx ? -1 : 1, c);
  g.restore();
}

// ---------- the boss ----------
/** The Poltergeist (world 2 boss) and its fallen nightmare. P: idle (0..1 breathing loop), swap (0..1 once), recolour (0..1 once), fade (0..1 once),
 *  variant: null (level 10), 'form2' (level 20 full form), 'fallen' (nightmare, drawn at full-form size). */
export function fallenPoltergeist(g, P = {}){
  const idle = P.idle, swap = P.swap, rec = P.recolour, fade = P.fade ?? 0, ph = (idle ?? 0) * TAU, fallen = P.variant === 'fallen', full = P.variant === 'form2' || fallen;
  const C = fallen ? ROT : full ? SHROUD2 : SHROUD, CD = fallen ? ROTD : full ? SHROUD2D : SHROUDD, glow = fallen ? BLIGHT : full ? SOUL2 : SOUL;
  const eyeCol = fallen ? EMBER : glow, tooth = fallen ? ROTTOOTH : TOOTH, voidCol = fallen ? ROTVOID : VOID, handC = fallen ? ROTBONE : C, spiritC = fallen ? ROTSPIRIT : SPIRIT, clawCol = fallen ? '#1a2014' : '#eaf1f6';
  const bob = idle != null ? Math.sin(ph) * 5 : 0;
  const flare = swap != null ? Math.sin(swap * Math.PI) : rec != null ? Math.min(1, rec * 2) : 0;   // eyes blaze and the jaw drops while it works its mischief
  if (fade > 0){ streaks(g, 0, 30, fade, 16, 29, 130, fallen); if (fade >= 1) return; g.save(); g.globalAlpha *= 1 - fade; g.translate(0, fade * 30); g.scale(1 - fade * .3, 1 - fade * .3); }
  g.save();
  if (full){ g.translate(0, 50); g.scale(1.12, 1.12); g.translate(0, -50); }
  S.shadow(g, 0, 56, 40, 6);
  if (fallen){   // a pool of poison light on the ground, and the black fog it stands in
    const gr = g.createRadialGradient(0, 54, 2, 0, 54, 46); gr.addColorStop(0, rgba(BLIGHT, .28)); gr.addColorStop(1, rgba(BLIGHT, 0)); g.save(); g.translate(0, 54); g.scale(1, .22); g.translate(0, -54); g.fillStyle = gr; ell(g, 0, 54, 46, 46); g.fill(); g.restore();
    for (let i = 0; i < 7; i++){ const t = i / 6; fogPuff(g, Math.sin(ph + i * 1.9) * 12 * (t + .3) + (i - 3) * 14, 34 + t * 22, 17 - t * 6, .62 - t * .3); }
  } else for (let i = 0; i < 5; i++){ const t = i / 4; puff(g, Math.sin(ph + i * 1.9) * 12 * (t + .3) + (i - 2) * 10, 36 + t * 20, 14 - t * 6, .45 - t * .3, full ? '#c8dce8' : '#e6f4fb'); }
  g.save(); g.translate(0, bob); g.globalAlpha *= .94;
  // hand targets: hang beside the waist and slowly clench in idle; fling wide and spin for a swap; raise then flick down and out for a recolour
  const hands = [];
  for (const s of [-1, 1]){
    let hx = s * 60, hy = 14 + Math.sin(ph + s) * 4, dir = Math.PI / 2 + s * .35, curl = .35 + Math.sin(ph * 2 + s) * .15, spread = 1, swirl = 0, spin = 0, fl = 0;
    if (swap != null){ const out = Math.sin(Math.min(1, swap * 1.15) * Math.PI); spin = swap * TAU * 2; hx = s * (62 + out * 26); hy = -26 - out * 18 + Math.sin(ph + s) * 3; dir = Math.PI / 2 + s * .4 + spin * s; curl = 0; spread = 1.3; swirl = out; }
    if (rec != null){ const k = rec < .4 ? rec / .4 : 1; fl = rec < .4 ? 0 : (rec - .4) / .6; hx = s * (44 + fl * 28); hy = 6 - k * 92 + fl * 84; dir = -Math.PI / 2 + s * (.25 + fl * 1.35); curl = fl * .4; spread = 1.35; }
    hands.push({ s, hx, hy, dir, curl, spread, swirl, spin, fl });
  }
  if (fallen){   // the scythe-shaped shadow looming behind it: black fog in the shape of a reaper's scythe, its edge lit poison green, swaying with the body
    const sw = Math.sin(ph * .7) * 3; g.save(); g.translate(sw, 0); g.rotate(Math.sin(ph) * .02);
    const shaft = SO([[36, 44], [-6, -46], [-48, -138]]), blade = SM([[-46, -140], [-74, -158], [-104, -150], [-124, -120], [-118, -92], [-108, -70, 1], [-102, -96], [-88, -118], [-66, -130], [-46, -128]], .7);
    g.save(); g.globalAlpha *= .9; g.shadowColor = rgba(BLIGHT, .6); g.shadowBlur = 14;
    g.lineCap = 'round'; shaft(g); g.strokeStyle = rgba('#050c07', .92); g.lineWidth = 9; g.stroke(); shaft(g); g.strokeStyle = rgba('#1c3320', .7); g.lineWidth = 3; g.save(); g.translate(-2, -1.5); g.stroke(); g.restore();
    const gr = g.createLinearGradient(-118, -150, -60, -100); gr.addColorStop(0, rgba('#0a1a0e', .96)); gr.addColorStop(1, rgba('#050c07', .9)); blade(g); g.fillStyle = gr; g.fill(); g.restore();
    g.save(); g.shadowColor = BLIGHT; g.shadowBlur = 8; S.stroke(g, SO([[-48, -129], [-66, -131], [-88, -119], [-102, -96], [-108, -70]]), { deep:BLIGHT }, 2.4, .9); g.restore();   // the cutting edge burns
    S.stroke(g, SO([[-46, -140], [-74, -158], [-104, -150], [-124, -120]]), { deep:'#2c4a30' }, 1.2, .6);
    for (let i = 0; i < 4; i++){ const t = .2 + i * .2, x = -48 - 70 * t * .9, y = -140 - Math.sin(t * Math.PI) * 14 - 6; fogPuff(g, x + Math.sin(ph * 1.5 + i * 2) * 3, y - ((ph / TAU + i * .25) % 1) * 10, 7 + i, .4); }   // fog smokes off the blade
    S.dot(g, E(-52, -134, 5, 4.5, -.6), '#0a1a0e'); S.stroke(g, E(-52, -134, 5, 4.5, -.6), { deep:'#355a3a' }, 1, .7); for (const [x, y] of [[8, -76], [-28, -108]]) S.dot(g, E(x, y, 3, 2.4, -1.1), rgba('#355a3a', .6));   // heel collar and iron bands on the shaft
    g.restore();
    for (let i = 0; i < 6; i++){ const R = rng(61 + i), ox = (R() - .5) * 150, k = (ph / TAU + R()) % 1; fogPuff(g, ox + Math.sin(ph * 1.3 + i * 2) * 6, -40 - k * 110, 10 + k * 14, (1 - k) * .45); }   // black fog curling up around it
  }
  // second pair of ghostly hands (full form only): translucent, floating raised behind the shoulders, mirroring the mischief
  if (full){ for (const h of hands){ const { s } = h; let x = s * 64, y = -74 + Math.sin(ph * 1.3 + s * 2) * 5, dir = -Math.PI / 2 + s * .55, curl = .3 + Math.sin(ph * 2 + s * 3) * .2;
      if (swap != null){ x = s * (64 + h.swirl * 18); y = -84 - h.swirl * 12; dir = -Math.PI / 2 + s * .5 + h.spin * s; curl = 0; }
      if (rec != null){ y = -74 - (h.hy - 6) * .3; dir = -Math.PI / 2 + s * .4; }
      g.save(); g.globalAlpha *= .65; g.shadowColor = glow; g.shadowBlur = 10; specHand(g, x, y, spiritC, dir, curl, 1.2, -s, 19, fallen ? '#1a2014' : '#eaf1f6'); g.restore(); } }
  // trailing strips of the shredded shroud, then the shroud over the top of them
  const tips = shreds(g, C, ph, full ? 7 : 5, -8, full ? -40 : -34, full ? 40 : 34, 56, full ? 43 : 37, fallen);
  if (full) shreds(g, CD, ph + 1.2, 2, -20, -50, 50, 42, 53, fallen);
  if (fallen) for (const [x, y] of tips.filter((p, i) => i % 2 === 0)) drip(g, x, y, 6 + Math.abs(Math.sin(ph + x)) * 6, 1.8);
  const hem = tatters(-30, 30, 4, 6, ph, 7);
  const torso = SM([[0, -128], [-20, -122], [-33, -106], [-37, -86], [-34, -68], [-48, -56], [-52, -38], [-46, -16], [-36, -4], ...hem, [36, -4], [46, -16], [52, -38], [48, -56], [34, -68], [37, -86], [33, -106], [20, -122]], .8);
  g.save(); g.shadowColor = rgba(glow, .55); g.shadowBlur = 18; S.part(g, torso, C, { x:0, y:-60, r:70 }, { mat:'cloth', hx:-20, hy:-108 }); g.restore();
  S.overlay(g, torso, CD, { x:0, y:-56, r:66 }, .55);
  g.save(); torso(g); g.clip(); let gr = g.createRadialGradient(0, -34, 4, 0, -34, 56); gr.addColorStop(0, rgba(glow, fallen ? .3 : full ? .5 : .42)); gr.addColorStop(1, rgba(glow, 0)); g.fillStyle = gr; g.fillRect(-80, -140, 160, 200); g.restore();   // eerie inner glow
  S.crease(g, SO([[-30, -60], [-36, -30], [-30, -4]]), CD, 2.4, .45); S.crease(g, SO([[28, -58], [34, -28], [28, -4]]), CD, 2.4, .45); S.crease(g, SO([[-12, -66], [-14, -34], [-10, -2]]), CD, 1.8, .35); S.crease(g, SO([[12, -64], [14, -32], [10, -2]]), CD, 1.8, .35);
  for (const [x, y] of hem.filter((p, i) => i % 2 === 0)) S.thread(g, x, y, x < 0 ? -1 : 1, CD);
  if (fallen){   // the rot: the hem soaked black, stains creeping up with drips, and the sheet torn open on its ribs and a heart of ghostfire
    g.save(); torso(g); g.clip(); gr = g.createLinearGradient(0, -2, 0, -44); gr.addColorStop(0, rgba(STAIN, .85)); gr.addColorStop(.5, rgba(STAIN, .45)); gr.addColorStop(1, rgba(STAIN, 0)); g.fillStyle = gr; g.fillRect(-60, -50, 120, 60); g.restore();
    rotStains(g, torso, 77, 5, 0, -70, 90, 70); rotStains(g, torso, 91, 3, 0, -112, 60, 24);
    hole(g, torso, C, [[-16, -60], [-6, -66], [4, -62], [14, -66], [18, -54], [14, -42], [6, -36], [-4, -39], [-14, -34], [-19, -46]], BLIGHT, () => {
      g.save(); g.globalAlpha *= .9; for (const [y, w] of [[-58, 13], [-50, 15], [-42, 14]]) { S.tube(g, SO([[-w, y + 2], [-w * .5, y - 1.5], [0, y - 2.5], [w * .5, y - 1.5], [w, y + 2]]), ROTBONE, 2.6); } S.tube(g, SO([[0, -64], [0, -36]]), ROTBONE, 2.4); g.restore();   // ribs and sternum
      g.save(); g.shadowColor = BLIGHT; g.shadowBlur = 10; S.dot(g, E(-1, -49, 6, 5.5), rgba('#2a4a1e', .9)); g.restore(); ghostfire(g, -1, -45, 5, Math.sin(ph * 2) * 1.5, 1); S.dot(g, E(-2.5, -51, 1.6, 1.3, -.5), rgba(BLIGHT2, .85));   // a heart burning green
    });
    hole(g, torso, C, [[-45, -32], [-40, -36], [-35, -31], [-30, -34], [-29, -24], [-33, -18], [-39, -20], [-43, -15], [-47, -24]], BLIGHT, () => { S.tube(g, SO([[-47, -26], [-38, -28], [-30, -24]]), ROTBONE, 2.2); });
    hole(g, torso, C, [[25, -102], [30, -106], [34, -101], [37, -94], [33, -90], [30, -86], [26, -91], [23, -96]], BLIGHT, null);
    for (const [x, y, l] of [[-24, -6, 12], [8, -4, 9], [30, -8, 14]]) drip(g, x, y + Math.sin(ph + x) * 1.5, l, 2);   // rot runs off the hem
  }
  if (full && !fallen){   // cracked glowing runes on the chest
    g.save(); torso(g); g.clip(); g.shadowColor = glow; g.shadowBlur = 8;
    for (const pts of [[[-22, -46], [-14, -54], [-10, -42], [-18, -36]], [[-2, -40], [6, -50], [8, -38], [0, -30], [-6, -36]], [[16, -52], [24, -46], [18, -36]]]) S.ln(g, pts, { deep:glow }, 2, .95);
    g.restore(); for (const [x, y] of [[-16, -50], [4, -44], [20, -44]]) S.ln(g, [[x - 4, y + 6], [x, y], [x + 3, y - 5]], CD, .9, .7); }
  // arms: torn sleeves from the shoulders to the wrists, then the grasping hands
  for (const h of hands){ const { s, hx, hy, dir } = h, sx = s * 44, sy = -54, wx = hx - Math.cos(dir) * 6, wy = hy - Math.sin(dir) * 6, ex = (sx + wx) / 2 + s * 16, ey = (sy + wy) / 2 - 4;
    S.tube(g, SO([[sx, sy], [ex, ey], [wx, wy]]), C, 13); S.contact(g, torso, sx, sy + 2, 10, 10, .35);
    const a = Math.atan2(wy - ey, wx - ex); g.save(); g.translate(wx, wy); g.rotate(a);
    const cuff = SM([[-10, -8], [4, -9], [10, -3, 1], [4, 0, 1], [11, 4, 1], [5, 6, 1], [8, 10, 1], [-10, 8]], .6);
    S.part(g, cuff, C, { x:0, y:0, r:10 }, { flat:true, mat:'cloth' });
    if (fallen){ g.save(); cuff(g); g.clip(); const gr2 = g.createLinearGradient(-10, 0, 11, 0); gr2.addColorStop(0, rgba(STAIN, 0)); gr2.addColorStop(1, rgba(STAIN, .8)); g.fillStyle = gr2; g.fillRect(-12, -12, 24, 24); g.restore(); }
    g.restore(); }
  if (fallen){   // reaper cowl: a tall peaked hood thrown over the head, its tip drooping back, stained and frayed, with ghostfire burning from the peak
    const tipx = 30 + Math.sin(ph) * 2, tipy = -156 + Math.sin(ph * 1.3) * 2;
    const hood = SM([[-36, -80, 1], [-41, -104], [-39, -126], [-29, -142], [-12, -152], [8, -154], [tipx, tipy, 1], [27, -140], [33, -118], [36, -100], [32, -80, 1], [24, -90], [0, -94], [-24, -90]], .75);
    g.save(); g.shadowColor = rgba(BLIGHT, .4); g.shadowBlur = 12; S.part(g, hood, C, { x:-4, y:-118, r:42 }, { mat:'cloth', flat:true }); g.restore();
    S.dot(g, E(-22, -132, 9, 4, -.9), rgba('#ffffff', .22));   // a dull sheen on the damp cloth
    S.overlay(g, hood, CD, { x:-2, y:-116, r:40 }, .55);
    S.crease(g, SO([[-30, -96], [-26, -120], [-14, -140]]), CD, 2.2, .45); S.crease(g, SO([[22, -98], [20, -120], [14, -142]]), CD, 1.8, .4); S.crease(g, SO([[-2, -150], [10, -150], [tipx - 4, tipy + 3]]), CD, 1.4, .4);
    S.contact(g, hood, 0, -84, 30, 10, .4);
    rotStains(g, hood, 117, 2, -8, -124, 48, 30);
    for (const [x, y] of [[-40, -112], [-29, -142], [34, -116]]) S.thread(g, x, y, x < 0 ? -1 : 1, C);
    ghostfire(g, tipx - 4, tipy + 13, 9 + Math.sin(ph * 2) * 1.5, Math.sin(ph * 1.5) * 2 + 3, .95); ghostfire(g, tipx - 8, tipy + 13, 5 + Math.sin(ph * 2 + 2) * 1.2, Math.sin(ph * 1.5 + 1) * 1.5 - 2, .8);   // the peak burns like a wick
  }
  // hood opening: a hollow void with sunken blazing eyes and a wide jagged gaping mouth
  const cave = SM([[-26, -76], [-28, -98], [-18, -114], [-6, -108], [0, -105], [6, -108], [18, -114], [28, -98], [26, -76], [14, -62], [0, -58], [-14, -62]], .85);
  S.dot(g, cave, voidCol);
  if (fallen){   // a skull glimpsed in the dark of the hood, lit from below by the ember eyes
    g.save(); cave(g); g.clip(); g.globalAlpha *= .72;
    S.part(g, SM([[-22, -84], [-24, -100], [-14, -112], [0, -115], [14, -112], [24, -100], [22, -84], [14, -78], [0, -76], [-14, -78]], .85), ROTBONE, { x:0, y:-98, r:24 }, { mat:'bone', hx:-9, hy:-110, lw:1 });
    S.dot(g, E(-8, -86, 5, 4, .4), rgba(ROTBONE.deep, .5)); S.dot(g, E(8, -86, 5, 4, -.4), rgba(ROTBONE.deep, .5));   // cheekbone hollows
    S.dot(g, PL([[-3.5, -79], [3.5, -79], [0, -86]]), ROTVOID);   // nasal hole
    g.globalAlpha *= 1.2; const gr2 = g.createLinearGradient(0, -80, 0, -116); gr2.addColorStop(0, rgba(ROTVOID, .1)); gr2.addColorStop(1, rgba(ROTVOID, .75)); g.fillStyle = gr2; g.fillRect(-30, -120, 60, 44);   // the cranium sinks back into shadow
    g.restore();
  }
  g.save(); cave(g); g.clip(); gr = g.createRadialGradient(0, -92, 2, 0, -92, 30); gr.addColorStop(0, rgba(eyeCol, .22 + flare * .35)); gr.addColorStop(1, rgba(eyeCol, 0)); g.fillStyle = gr; g.fillRect(-40, -130, 80, 80); g.restore();
  S.stroke(g, SO([[-26, -76], [-28, -98], [-18, -114], [-6, -108], [0, -105], [6, -108], [18, -114], [28, -98], [26, -76]]), { deep:C.light }, 2.2, .45);
  for (const s of [-1, 1]){ S.dot(g, E(s * 12, -96, 7.5, 8.5), '#03060c'); S.dot(g, PL([[s * 21, -108], [s * 3, -99], [s * 21, -99]]), CD.deep, .95);   // a lid of shroud scowls over each socket
    if (fallen){ g.save(); g.shadowColor = EMBER; g.shadowBlur = 14; S.dot(g, E(s * 12, -95, 5 + flare * 1.5, 5.5 + flare * 1.5), rgba(EMBER, .55)); g.restore();
      for (let i = 0; i < 2; i++){ const k = (ph / TAU * 1.3 + i * .5) % 1; S.dot(g, E(s * (13 + k * 6), -98 - k * 12, 1.4 * (1 - k) + .4, 2 * (1 - k) + .5), rgba(EMBER, (1 - k) * .7)); } }   // embers drift up from the sockets
    S.glow(g, s * 12, -94, 3.2 + flare * 1.8, eyeCol); if (fallen) S.dot(g, E(s * 12, -94, 1.6 + flare * .6, 2 + flare * .6), EMBER2, .9); }
  const open = .3 + flare * .7, mouth = PL([[-20, -80], [-12, -84], [0, -86], [12, -84], [20, -80], [15, -71 - open * 7], [8, -65 - open * 10], [0, -62 - open * 12], [-8, -65 - open * 10], [-15, -71 - open * 7]]);
  S.dot(g, mouth, voidCol); g.save(); mouth(g); g.clip(); gr = g.createRadialGradient(0, -64 - open * 8, 1, 0, -66, 18); gr.addColorStop(0, rgba(glow, .45)); gr.addColorStop(1, rgba(glow, 0)); g.fillStyle = gr; g.fillRect(-30, -100, 60, 60); g.restore();
  if (fallen){ g.save(); mouth(g); g.clip(); for (let i = -1; i <= 1; i++) ghostfire(g, i * 7, -62 - open * 11, 4 + flare * 3, Math.sin(ph * 2 + i) * 2, .7 + flare * .3); g.restore(); }   // ghostfire licks out of the throat
  for (const [x, l] of [[-15, 5], [-9, 7], [-3, 5], [3, 6], [9, 7], [15, 5]]){ if (fallen && x === 3) continue; S.dot(g, PL([[x - 2.6, -84 + Math.abs(x) * .25], [x + 2.6, -84 + Math.abs(x) * .25], [x, -84 + l + Math.abs(x) * .25]]), tooth.base); }
  for (const [x, l] of [[-12, 4], [-6, 5.5], [0, 4], [6, 5.5], [12, 4]]){ if (fallen && x === -6) continue; const by = -66 - open * 10 + Math.abs(x) * .45; S.dot(g, PL([[x - 2.4, by + 1], [x + 2.4, by + 1], [x, by - l]]), tooth.dark); }
  if (fallen){   // where the spectral crown was: the rim of the cowl smoulders with poison light
    g.save(); g.shadowColor = BLIGHT; g.shadowBlur = 8; S.stroke(g, SO([[-26, -98], [-18, -114], [-6, -108], [0, -105], [6, -108], [18, -114], [26, -98]]), { deep:BLIGHT2 }, 1.6, .65); g.restore();
  } else if (full){   // spectral crown: a jagged ring of cold light hovering on the head
    g.save(); g.globalAlpha *= .85; g.shadowColor = glow; g.shadowBlur = 12; const crown = PL([[-26, -120], [-20, -140], [-13, -126], [-6, -146], [0, -128], [6, -146], [13, -126], [20, -140], [26, -120]]);
    gr = g.createLinearGradient(0, -146, 0, -118); gr.addColorStop(0, rgba(glow, .55)); gr.addColorStop(1, rgba('#ffffff', .9)); crown(g); g.fillStyle = gr; g.fill(); g.strokeStyle = rgba(glow, .9); g.lineWidth = 1.4; g.lineJoin = 'round'; g.stroke();
    S.dot(g, E(0, -121, 27, 3.5), rgba('#ffffff', .6)); g.restore(); }
  // hands with their mischief effects: a cyan swirl for a swap (black fog when fallen), paint sprayed off the fingers for a recolour (rot when fallen)
  for (const h of hands){ const { s, hx, hy, dir, curl, spread, swirl, spin, fl } = h;
    if (swirl > 0){ g.save(); g.shadowColor = fallen ? BLIGHT : SOUL2; g.shadowBlur = 8; for (let i = 0; i < 6; i++){ const a = spin * .5 + i * TAU / 6, rr = 22 + swirl * 8, px = hx + Math.cos(a) * rr, py = hy + Math.sin(a) * rr * .7;
        if (fallen){ fogPuff(g, px, py, 7 - i * .5, swirl * (.9 - i * .1)); S.dot(g, E(px, py, 1.6 - i * .15, 1.6 - i * .15), BLIGHT2, swirl * (.8 - i * .1)); } else S.dot(g, E(px, py, 3.5 - i * .3, 3.5 - i * .3), SOUL2, swirl * (.75 - i * .09)); } g.restore(); }
    if (fl > 0){ const R = rng(31 + (s < 0 ? 0 : 7)); for (let i = 0; i < 5; i++){ const a = -Math.PI / 2 + s * (.1 + R() * 1.4), d = 14 + R() * 36, ex = hx + Math.cos(a) * d * fl, ey = hy + Math.sin(a) * d * fl + fl * fl * 34, rr = 4.5 + R() * 4; g.save(); g.globalAlpha *= 1 - fl * .4;
        if (fallen){ g.shadowColor = rgba(BLIGHT, .5); g.shadowBlur = 6; S.part(g, E(ex, ey, rr, rr * .85), pal(ROTPAINT[(i + (s < 0 ? 0 : 3)) % ROTPAINT.length]), { x:ex, y:ey, r:rr }, { flat:true, mat:'moss' }); drip(g, ex + 1, ey + rr * .6, 4 + rr * fl, 1.4); }
        else S.part(g, E(ex, ey, rr, rr * .85), pal(PAINT[(i + (s < 0 ? 0 : 3)) % PAINT.length]), { x:ex, y:ey, r:rr }, { flat:true, mat:'paint' }); g.restore(); } }
    specHand(g, hx, hy, handC, dir, curl, spread, -s, 22, clawCol);
    if (s < 0 || full){ const cl = full ? 30 : 24; soulChain(g, hx + s * 3, hy + 3, cl, Math.sin(ph + s) * 5 + (swap != null ? Math.cos(spin) * 8 : 0), fallen ? RUST : C, glow, fallen); }
  }
  if (fallen) for (let i = 0; i < 3; i++){ const R = rng(23 + i), ox = (R() - .5) * 130, k = (ph / TAU + R()) % 1; fogPuff(g, ox + Math.sin(ph + i) * 4, -10 - k * 90, 7 + k * 9, (1 - k) * .16); }   // a thin veil of fog drifts in front
  g.restore(); g.restore();
  if (fade > 0) g.restore();
}

// ---------- registry entry (copied from W2.poltergeist; the box is widened for the cowl, the ghostfire crown and the scythe) ----------
export const FALLEN = { key:'poltergeist', name:'The Fallen Poltergeist', draw:fallenPoltergeist, scale:.6, dy:0, box:{ x:-150, y:-206, w:300, h:296 }, variants:{ form2:true, fallen:true },
  clips:{ walk:{ n:8, fps:6, pose:t => ({ idle:t }) }, swap:{ n:8, fps:14, once:true, pose:t => ({ idle:.25, swap:t }) }, recolour:{ n:8, fps:12, once:true, pose:t => ({ idle:.25, recolour:t }) }, teleport:{ n:8, fps:16, once:true, pose:t => ({ idle:0, fade:t }) } }, still:{} };
