// ---------- Nightmare world 1: Pumpkin Patch: Nightmare monsters (Release 4) ----------
// Drawings ported from docs/archive/nightmare-monsters/slime-patch/slime_patch.js (Toy Plastic, docs/ART_BRIEF.md). One entry per monster type;
// the registry NM1 is spread into CHARS in index.js behind `__RELEASE__ >= 4`. Glow and shadowBlur are fine here: every clip is baked by
// render/anim.js and nothing in this file may be painted per frame.

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';

const cl01 = x => x < 0 ? 0 : x > 1 ? 1 : x, ease = x => { x = cl01(x); return x * x * (3 - 2 * x); }, lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => ease((t - a) / (b - a));

// ---------- shared helpers ----------
/** A glowing ember dot. */
function ember(g, x, y, r, a = 1, col = '#ff8a2a'){ if (a <= 0) return; g.save(); g.globalAlpha *= a; g.shadowColor = col; g.shadowBlur = r * 4; g.fillStyle = col; ell(g, x, y, r, r); g.fill(); g.shadowBlur = 0; g.fillStyle = '#fff2c0'; ell(g, x, y, r * .45, r * .45); g.fill(); g.restore(); }

/** Sparks rising in a loop: ph 0..1 moves every spark along its own seeded path, so looped clips stay seamless. */
function sparks(g, ph, x, y, n, h, seed){ const R = rng(seed); for (let i = 0; i < n; i++){ const o = R(), dx = (R() - .5) * 16, r = 1 + R() * .8, p = (ph + o) % 1; ember(g, x + dx + Math.sin(p * TAU + o * 6) * 4, y - p * h, r, Math.sin(p * Math.PI) * .95); } }
/** Soft smoke puffs rising in a loop. */
function smoke(g, ph, x, y, n, h, seed){ const R = rng(seed); for (let i = 0; i < n; i++){ const o = i / n + R() * .1, jx = (R() - .5) * 6, p = (ph + o) % 1, r = 5 + p * 10, cx = x + p * 12 + jx, cy = y - p * h;
  g.save(); g.globalAlpha *= .55 * Math.sin(p * Math.PI); const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(70,58,58,1)'); gr.addColorStop(1, 'rgba(70,58,58,0)'); g.fillStyle = gr; ell(g, cx, cy, r, r); g.fill(); g.restore(); } }

// =====================================================================
// 2. The Hayrick: a living haystack, smouldering from the barn fire, a pitchfork stuck in its shoulder
// =====================================================================
const HAY = pal('#e2b24c'), HAYD = pal('#b8822e'), HAYS = ['#f8dc88', '#cf9a3c', '#8e5c1e', '#fff2b8'],
  HAYB = pal('#8a5a2a'), HAYBD = pal('#5a3a1e'), HAYSB = ['#c08a3a', '#5a3416', '#2e1a0c', '#ffb050'], TWINEB = pal('#4a2a1a'), HOT = pal('#ff5a1a'), HANDLEB = pal('#3a2418'), TWINEC = pal('#8a4a2a'), FORKC = pal('#9aa0ac'), HANDLE = pal('#7a5434'), CROWC = pal('#2e2838'), BEAKY = pal('#e8b030');
// straw palette for the current drawing: plain or burning (set at the top of hayrick)
const HT = { hay:HAY, hayd:HAYD, strs:HAYS, loose:['#f8dc88', '#e2b24c'] };
const setHT = b => { HT.hay = b ? HAYB : HAY; HT.hayd = b ? HAYBD : HAYD; HT.strs = b ? HAYSB : HAYS; HT.loose = b ? ['#ffb050', '#6a4020'] : ['#f8dc88', '#e2b24c']; };
/** Straw strands clipped to a shape, draping outward from the centre line like hay over a dome. */
function straw(g, clip, cx, cy, rx, ry, seed, n, len = 12, fan = .7){
  const R = rng(seed), pa = g.globalAlpha; g.save(); clip(g); g.clip(); g.lineCap = 'round';
  for (let i = 0; i < n; i++){ const x = cx + (R() * 2 - 1) * rx, y = cy + (R() * 2 - 1) * ry, l = len * (.5 + R() * .8), a = Math.PI / 2 + ((x - cx) / rx) * fan + (R() - .5) * .5, b = (R() - .5) * 4;
    g.strokeStyle = HT.strs[R() * 4 | 0]; g.globalAlpha = pa * (.35 + R() * .5); g.lineWidth = .7 + R() * .9;
    g.beginPath(); g.moveTo(x - Math.cos(a) * l * .5, y - Math.sin(a) * l * .5); g.quadraticCurveTo(x + b, y, x + Math.cos(a) * l * .5, y + Math.sin(a) * l * .5); g.stroke(); }
  g.restore(); }
/** Loose straws poking out of a silhouette: [x, y, angle] each. */
function looseStraw(g, pts, seed, len = 8){ const R = rng(seed); for (const [x, y, a] of pts){ const l = len * (.6 + R() * .7), aa = a + (R() - .5) * .5, p = [[x, y], [x + Math.cos(aa) * l * .5 + (R() - .5) * 2, y + Math.sin(aa) * l * .5], [x + Math.cos(aa) * l, y + Math.sin(aa) * l]];
  S.stroke(g, SO(p), HT.hayd, 2.6, .55); S.stroke(g, SO(p), { deep:HT.loose[R() < .5 ? 0 : 1] }, 1.3, 1); } }
/** Pitchfork: grip at (x,y), pointing along angle a; vis < 1 hides the tine tips (stuck in the straw). */
function pitchfork(g, x, y, a, vis = 1, sc = 1, hot = false){
  const FORK = hot ? HOT : FORKC;
  g.save(); g.translate(x, y); g.rotate(a); g.scale(sc, sc);
  S.tube(g, SO([[-30, 0], [12, 0]]), hot ? HANDLEB : HANDLE, 4);
  if (hot){ g.save(); g.shadowColor = '#ff6a10'; g.shadowBlur = 10; g.strokeStyle = 'rgba(255,120,30,.7)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(19, -8); g.lineTo(19 + 20 * vis, -8.8); g.moveTo(19, 0); g.lineTo(19 + 20 * vis, 0); g.moveTo(19, 8); g.lineTo(19 + 20 * vis, 8.8); g.stroke(); g.restore(); }
  S.part(g, RR(10, -3, 7, 6, 1.5), FORK, { x:13, y:0, r:5 }, { flat:true, mat:'metal', lw:1 });
  S.tube(g, SO([[19, -8], [16.5, 0], [19, 8]]), FORK, 2.8);
  const L = 20 * vis;
  for (const o of [-8, 0, 8]){ S.tube(g, SO([[19, o], [19 + L * .6, o * 1.05], [19 + L, o * 1.1]]), FORK, 2.3);
    if (vis < 1) S.dot(g, E(19 + L, o * 1.1, 2.4, 2.8), '#2a1608', .9); else S.claw(g, 19 + L, o * 1.1, 0, 4, hot ? '#ffe080' : '#e6eaf0'); }
  g.restore(); }
/** A crow perched on top, red-eyed; flap 0..1 raises its wings. */
function crow(g, x, y, s = 1, flap = 0){
  g.save(); g.translate(x, y); g.scale(s, s);
  for (const d of [-1, 1]) S.ln(g, [[d * 2.5, 5], [d * 3, 10]], BEAKY, 1.5, 1);
  S.part(g, SM([[-6, 2], [-19, 9], [-17, 3], [-21, -1]], .5), CROWC, { x:-12, y:2, r:7 }, { flat:true, mat:'skin' });
  if (flap > 0) S.part(g, SM([[0, -3], [-6 - flap * 4, -10 - flap * 12], [-16 - flap * 4, -8 - flap * 14], [-12, -2], [-4, 3]], .6), CROWC, { x:-8, y:-6, r:9 }, { flat:true, mat:'skin' });
  S.part(g, E(0, 0, 9, 7.5), CROWC, { x:0, y:0, r:9 }, { mat:'skin' });
  if (flap > 0) S.part(g, SM([[2, -3], [10 + flap * 4, -10 - flap * 12], [18 + flap * 4, -8 - flap * 14], [12, -2], [4, 3]], .6), CROWC, { x:8, y:-6, r:9 }, { flat:true, mat:'skin' });
  else S.part(g, SM([[-8, -3], [4, -3], [3, 5], [-9, 4]], .7), pal('#3c3448'), { x:-2, y:1, r:7 }, { flat:true, mat:'skin', noEdge:true });
  S.part(g, E(5, -8, 6, 5.5), CROWC, { x:5, y:-8, r:6 }, { mat:'skin' });
  S.part(g, PL([[9, -10], [17, -7], [9, -5]]), BEAKY, { x:12, y:-7, r:4 }, { flat:true, lw:.8 });
  S.glow(g, 5.8, -9, 1.7, '#ff3a1a');
  g.restore(); }
export function hayrick(g, P = {}){
  const w = P.walk, ch = P.chew, ts = P.toss, ph = w ?? ch ?? ts ?? 0, B = P.variant === 'burning'; setHT(B);
  const HAY = HT.hay, HAYD = HT.hayd, TWINE = B ? TWINEB : TWINEC;
  const sw = w == null ? 0 : Math.sin(w * TAU), cs = ch == null ? 0 : Math.sin(ch * TAU);
  const rock = w != null ? sw * .06 : cs * .025, bob = w != null ? -Math.abs(sw) * 3 : ch != null ? cs * 2.5 + 2 : 0, lean = ch == null ? 0 : Math.abs(cs);
  const mouth = ch != null ? .35 + lean * .65 : ts != null ? .3 + seg(ts, .55, .75) * .7 : .25;
  S.shadow(g, 0, 51, 50, 7);
  // legs: short straw bundles tied at the ankle, splayed straw for feet
  for (const s of [-1, 1]){
    const lp = w == null ? 0 : w * TAU + (s < 0 ? 0 : Math.PI), dx = w == null ? 0 : Math.cos(lp) * 4, dy = w == null ? 0 : -Math.max(0, Math.sin(lp)) * 6;
    g.save(); g.translate(dx, dy);
    const leg = SM([[s * 8, 26], [s * 27, 26], [s * 26, 46], [s * 9, 46]], .5);
    S.part(g, leg, HAYD, { x:s * 17, y:36, r:12 }, { flat:true });
    straw(g, leg, s * 17, 37, 9, 10, 31 + s, 24, 10, .2);
    S.tube(g, SO([[s * 8, 41], [s * 17, 42.5], [s * 26.5, 41]]), TWINE, 2.8);
    looseStraw(g, [[s * 10, 46, 2.3], [s * 14, 47, 1.9], [s * 19, 47, 1.3], [s * 24, 46, .85]], 40 + s, 7);
    g.restore(); }
  g.save(); g.translate(0, 44 + bob); g.rotate(rock); g.translate(0, -44);
  if (B){ smoke(g, ph, 18, -56, 6, 40, 6); smoke(g, ph + .5, -22, -50, 4, 38, 7);
    // flames behind the crown: their bases hide behind the stack
    [[-36, -24, 20], [-24, -40, 26], [-8, -46, 30], [8, -47, 28], [24, -38, 26], [38, -20, 20]].forEach(([x, y, h], i) => flame(g, x, y + 6, h * (1 + .2 * Math.sin(ph * TAU * 2 + i * 1.9)), 7, Math.sin(ph * TAU + i * 1.3) * 3)); }
  else smoke(g, ph, 26, -42, 3, 40, 5);
  const body = SM([[-40, 40], [-47, 14], [-43, -14], [-31, -36], [-12, -50], [10, -51], [30, -38], [43, -15], [47, 14], [40, 40], [0, 45]], .9), bb = { x:-2, y:-4, r:52 };
  S.part(g, body, HAY, bb, { hx:-22, hy:-34 });
  straw(g, body, 0, -2, 48, 48, 77, 280, 14, .8);
  // scorched: the barn fire caught its hem and right shoulder; ember cracks glow in the char
  g.save(); body(g); g.clip();
  let gr = g.createLinearGradient(0, 14, 0, 46); gr.addColorStop(0, 'rgba(40,20,10,0)'); gr.addColorStop(.55, 'rgba(40,20,10,.72)'); gr.addColorStop(1, 'rgba(24,10,4,.96)'); g.fillStyle = gr; g.fillRect(-52, 12, 104, 40);
  gr = g.createRadialGradient(32, -32, 2, 32, -32, 22); gr.addColorStop(0, 'rgba(30,14,6,.85)'); gr.addColorStop(1, 'rgba(30,14,6,0)'); g.fillStyle = gr; g.fillRect(8, -58, 50, 50);
  g.shadowColor = '#ff6a10'; g.shadowBlur = 6; g.strokeStyle = '#ffb040'; g.lineWidth = 1.4; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const pts of [[[-36, 36], [-30, 31], [-25, 37], [-18, 32], [-14, 36]], [[4, 42], [10, 35], [16, 39], [24, 33], [30, 37]], [[26, -40], [31, -33], [28, -27], [34, -22]], [[-8, 40], [-4, 36], [0, 40]]]){
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
  if (B){ g.fillStyle = 'rgba(30,14,6,.35)'; g.fillRect(-52, -60, 104, 110);
    g.lineWidth = 1.8;
    for (const pts of [[[-32, -12], [-25, -5], [-29, 3], [-21, 9]], [[20, -4], [27, 2], [23, 9], [31, 15]], [[-12, -40], [-5, -34], [-9, -27]], [[8, 24], [15, 19], [13, 28], [20, 30]], [[-40, 14], [-34, 20], [-38, 26]], [[36, -6], [40, 4], [36, 10]]]){
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } }
  g.restore();
  S.overlay(g, body, HAY, bb, .4);
  looseStraw(g, [[-30, -36, -2.4], [-14, -49, -1.9], [-4, -51, -1.6], [6, -51, -1.3], [18, -47, -1.0], [-42, -16, -2.8], [44, -12, -.3], [-46, 12, 3.0], [46, 12, .1]], 55, 10);
  // twine belt with a knot
  g.save(); body(g); g.clip(); S.tube(g, SO([[-50, 4], [-20, 13], [0, 15], [20, 13], [50, 4]]), TWINE, 4); g.restore();
  S.tube(g, SO([[4, 17], [2, 23], [4, 28]]), TWINE, 2); S.tube(g, SO([[6, 17], [10, 22], [9, 27]]), TWINE, 2);
  S.part(g, E(5, 15.5, 4, 3.2), TWINE, { x:5, y:15, r:4 }, { flat:true, lw:1 });
  // face: a dark hollow in the straw, ember eyes under an angry straw brow, a jagged glowing mouth
  const fy = -20 + lean * 4;
  g.save(); body(g); g.clip(); gr = g.createRadialGradient(0, fy + 4, 2, 0, fy + 4, 26); gr.addColorStop(0, 'rgba(30,14,4,.9)'); gr.addColorStop(.6, 'rgba(30,14,4,.6)'); gr.addColorStop(1, 'rgba(30,14,4,0)'); g.fillStyle = gr; ell(g, 0, fy + 4, 26, 20); g.fill(); g.restore();
  for (const s of [-1, 1]){ S.glow(g, s * 10, fy, 5, '#ff8a1a'); S.dot(g, E(s * 10, fy + .6, 2.4, 2.8), '#fff0a0'); S.dot(g, E(s * 10 + s * .4, fy + 1, 1, 2.2), '#5a1a04', .85); }
  for (const s of [-1, 1]) S.tube(g, SO([[s * 23, fy - 13], [s * 13, fy - 9], [s * 3, fy - 4]]), HAYD, 5);
  const my = fy + 12, mh = 3 + mouth * 9;
  const mp = PL([[-13, my], [-9, my - 2.5], [-5, my + 1], [-1, my - 2.5], [3, my + 1], [7, my - 2.5], [12, my], [9, my + mh * .7], [4, my + mh], [-4, my + mh], [-10, my + mh * .7]]);
  S.dot(g, mp, '#1c0a04');
  g.save(); mp(g); g.clip(); gr = g.createRadialGradient(0, my + mh, 0, 0, my + mh, 12); gr.addColorStop(0, 'rgba(255,150,40,.95)'); gr.addColorStop(1, 'rgba(255,80,10,0)'); g.fillStyle = gr; g.fillRect(-14, my - 4, 28, 20); g.restore();
  // the pitchfork: stuck in the left shoulder, or in the hand during the toss
  let G = [-38, -52], fa = .9, vis = .55, fsc = 1, falpha = 1, lh = null, rh = null;
  if (ts != null){
    const a1 = seg(ts, 0, .28), a2 = seg(ts, .3, .55), a3 = seg(ts, .58, .76), a4 = seg(ts, .76, 1);
    rh = [lerp(54, 56, a2), lerp(18, -4, a2 - a4)];
    if (ts <= .3) lh = [lerp(-52, -36, a1), lerp(18, -50, a1)];
    else {
      G = [lerp(-38, -14, a2), lerp(-52, -62, a2)]; fa = lerp(.9, -2.1, a2); vis = lerp(.55, 1, Math.min(1, a2 * 3));
      if (a3 > 0){ G = [lerp(-14, -4, a3), lerp(-62, -18, a3)]; fa = lerp(-2.1, 1.45, a3); fsc = lerp(1, 1.3, a3); }
      lh = [G[0], G[1]];
      if (a4 > 0){ G = [lerp(-4, 0, a4), lerp(-18, 4, a4)]; fsc = lerp(1.3, 1.9, a4); falpha = 1 - a4; lh = [lerp(-4, -48, a4), lerp(-18, 14, a4)]; }
    }
  }
  if (falpha > 0){ g.save(); g.globalAlpha *= falpha; pitchfork(g, G[0], G[1], fa, vis, fsc, B); g.restore(); }
  // arms: straw bundles tied at the wrist with splayed straw hands
  const arm = (s, hx, hy) => { const sx = s * 38, sy = -10, mx = (sx + hx) / 2 + s * 8, my2 = (sy + hy) / 2 + 2;
    S.tube(g, SO([[sx, sy], [mx, my2], [hx, hy]]), HAYD, 11);
    for (const [o, col, a] of B ? [[-3.5, '#c08a3a', .8], [-1.5, '#2e1a0c', .6], [.5, '#ff9a3a', .6], [2.5, '#2e1a0c', .6], [4, '#8a5a2a', .7]] : [[-3.5, '#f6d27a', .8], [-1.5, '#8a5a1c', .55], [.5, '#fff0b0', .6], [2.5, '#8a5a1c', .6], [4, '#e2b24c', .7]]){ const dx = -Math.sin(Math.atan2(hy - sy, hx - sx)) * o, dy = Math.cos(Math.atan2(hy - sy, hx - sx)) * o;
      S.stroke(g, SO([[sx + dx, sy + dy], [mx + dx * .9, my2 + dy * .9], [hx + dx * .6, hy + dy * .6]]), { deep:col }, .9, a); }
    for (const t of [.3, .6]){ const bx = lerp(sx, hx, t) + (t < .5 ? s * 4 : s * 3), by = lerp(sy, hy, t) + 1; looseStraw(g, [[bx, by, s > 0 ? .2 : 2.9]], 70 + t * 10 + s, 6); }
    const a = Math.atan2(hy - my2, hx - mx);
    for (const d of [-.7, -.25, .25, .7]) S.tube(g, SO([[hx, hy], [hx + Math.cos(a + d) * 6, hy + Math.sin(a + d) * 6], [hx + Math.cos(a + d * 1.2) * 10, hy + Math.sin(a + d * 1.2) * 10]]), HAY, 2.6);
    S.part(g, E(hx - Math.cos(a) * 2, hy - Math.sin(a) * 2, 4, 6.5, a), TWINE, { x:hx, y:hy, r:6 }, { flat:true, lw:1 }); };
  for (const s of [-1, 1]){
    let hx = s * 52, hy = 18;
    if (w != null){ const sa = Math.sin(w * TAU + (s < 0 ? Math.PI : 0)); hx += sa * 3; hy += sa * 6; }
    if (ch != null){ hx = s * 32; hy = 4 + Math.sin(ch * TAU + (s < 0 ? 0 : Math.PI)) * 9; }
    if (s < 0 && lh) [hx, hy] = lh;
    if (s > 0 && rh) [hx, hy] = rh;
    arm(s, hx, hy); }
  if (B){
    // flames licking up the flanks and hem, in front of the stack
    [[-45, 10, 14], [-41, 32, 12], [45, 2, 15], [41, 28, 12], [-20, 42, 11], [22, 42, 12], [-16, -44, 13], [14, -45, 14]].forEach(([x, y, h], i) => flame(g, x, y, h * (1 + .25 * Math.sin(ph * TAU * 2 + i * 2.3)), 4.5, Math.sin(ph * TAU + i) * 2));
    sparks(g, ph, 0, -40, 10, 60, 13); sparks(g, ph + .3, 30, -20, 5, 50, 14);
    g.restore(); return;   // the crow has flown off
  }
  sparks(g, ph, 30, -34, 4, 44, 12);
  // a crow rides on top; it flaps off its perch when the fork comes up
  const cf = ts == null ? 0 : Math.sin(seg(ts, .3, .9) * Math.PI);
  crow(g, 8 + cf * 10, -55 - cf * 14 + (w != null ? Math.abs(sw) * 1.5 : 0), 1, cf);
  g.restore();
}

// =====================================================================
// 3. The Cinder Rooster: a fat black rooster, singed in the barn fire, comb burning
// =====================================================================
const ROO = pal('#3e3040'), ROOB = pal('#8a3218'), COMB = pal('#e8261c'), BEAK = pal('#f2b232'), LEG = pal('#e8a030'), TAILC = pal('#2a2232');
/** A sickle feather from base to tip with an ember-lit tip. */
function feather(g, bx, by, tx, ty, wd, curl, c){
  const mx = (bx + tx) / 2, my = (by + ty) / 2, dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const p = SM([[bx + nx * wd * .5, by + ny * wd * .5], [mx + nx * (wd + curl), my + ny * (wd + curl)], [tx, ty, 1], [mx + nx * (curl - wd * .2), my + ny * (curl - wd * .2)], [bx - nx * wd * .5, by - ny * wd * .5]], .8);
  S.part(g, p, c, { x:mx, y:my, r:L * .5 }, { flat:true, mat:'skin' });
  g.save(); p(g); g.clip(); const gr = g.createRadialGradient(tx, ty, 0, tx, ty, L * .5); gr.addColorStop(0, 'rgba(255,190,70,.95)'); gr.addColorStop(.35, 'rgba(255,90,20,.65)'); gr.addColorStop(1, 'rgba(255,60,10,0)'); g.fillStyle = gr; g.fillRect(tx - L, ty - L, L * 2, L * 2); g.restore();
  S.stroke(g, SO([[bx, by], [mx + nx * curl * .55, my + ny * curl * .55], [tx, ty]]), { deep:'#6a5a70' }, .9, .6);
}
/** A flame tongue (bake-time gradient + glow). */
function flame(g, x, y, h, wd, sway = 0){ const p = SM([[x - wd, y], [x - wd * .7 + sway * .4, y - h * .5], [x + sway, y - h, 1], [x + wd * .7 + sway * .4, y - h * .5], [x + wd, y]], .8);
  g.save(); g.shadowColor = '#ff8a2a'; g.shadowBlur = 8; const gr = g.createLinearGradient(0, y, 0, y - h); gr.addColorStop(0, 'rgba(255,90,30,.95)'); gr.addColorStop(.55, 'rgba(255,170,50,.95)'); gr.addColorStop(1, 'rgba(255,240,170,.9)'); p(g); g.fillStyle = gr; g.fill(); g.restore(); }
export function rooster(g, P = {}){
  const w = P.walk, ch = P.chew, cr = P.crow, ph = w ?? ch ?? cr ?? 0;
  const sw = w == null ? 0 : Math.sin(w * TAU), peck = ch == null ? 0 : Math.max(0, Math.sin(ch * TAU));
  const k = cr == null ? 0 : cr < .25 ? ease(cr / .25) : cr < .8 ? 1 : 1 - ease((cr - .8) / .2);
  const shake = cr != null && cr > .25 && cr < .8 ? Math.sin(cr * TAU * 7) * 1.2 : 0;
  const bob = w != null ? -Math.abs(Math.sin(w * TAU * 2)) * 2.5 : ch != null ? peck * 3 : -k * 2;
  S.shadow(g, 0, 51, 34, 6);
  g.save(); g.translate(shake, 0);
  // legs: scaly yellow, three toes with talons and a back spur
  for (const s of [-1, 1]){
    const lp = w == null ? 0 : w * TAU + (s < 0 ? 0 : Math.PI), lift = w == null ? 0 : Math.max(0, Math.sin(lp)) * 7, dx = w == null ? 0 : Math.cos(lp) * 3;
    const ax = s * 13 + dx, ay = 46 - lift;
    S.tube(g, SO([[s * 10, 28], [ax - s * .5, 37 - lift * .5], [ax, ay]]), LEG, 4.8);
    for (let i = 0; i < 3; i++) S.ln(g, [[ax - 2 - s * .3 * i, 36 + i * 3 - lift * .4], [ax + 2 - s * .3 * i, 37 + i * 3 - lift * .4]], LEG, .8, .5);
    S.claw(g, ax - s * 2, ay - 5, s > 0 ? Math.PI + .5 : -.5, 4.5, '#4a3a3a');
    for (const d of [-1, 0, 1]){ const tx = ax + d * 7, ty = ay + 3.5 - Math.abs(d); S.tube(g, SO([[ax, ay], [tx, ty]]), LEG, 2.8); S.claw(g, tx + d * 1.2, ty, Math.PI / 2 - d * .9, 3.6, '#3a2a2a'); }
  }
  g.save(); g.translate(0, bob);
  // tail: a fan of sickle feathers behind, spread wider when it crows
  const sp = 1 + k * .32;
  for (const [a0, L, curl] of [[-2.6, 44, -5], [-2.25, 52, -6], [-1.95, 50, -4], [-.54, 44, 5], [-.89, 52, 6], [-1.19, 50, 4]]){
    const a = -Math.PI / 2 + (a0 + Math.PI / 2) * sp + sw * .05;
    feather(g, 0, 8, Math.cos(a) * L, 8 + Math.sin(a) * L, 11, curl, TAILC); }
  // body: plump, black-feathered with a rust breast, feather scallops, singed embers at the hem
  g.save(); g.translate(0, 14); const puff = 1 + k * .1; g.scale(puff, puff); g.translate(0, -14);
  const body = SM([[-24, -8], [-31, 10], [-24, 30], [0, 37], [24, 30], [31, 10], [24, -8], [12, -16], [-12, -16]], .9);
  S.part(g, body, ROO, { x:0, y:12, r:32 }, { mat:'skin', hx:-14, hy:0 });
  const breast = SM([[-16, -6], [-19, 12], [-10, 28], [0, 31], [10, 28], [19, 12], [16, -6], [0, -10]], .9);
  S.part(g, breast, ROOB, { x:0, y:10, r:20 }, { flat:true, mat:'skin', noEdge:true });
  g.save(); body(g); g.clip(); g.lineCap = 'round';
  for (let r = 0; r < 6; r++){ const y = -4 + r * 7; for (let c = -4; c <= 4; c++){ const x = c * 8 + (r % 2 ? 4 : 0);
    g.beginPath(); g.arc(x, y, 4.5, .15 * Math.PI, .85 * Math.PI); g.strokeStyle = rgba(ROO.deep, .55); g.lineWidth = 1.1; g.stroke();
    g.beginPath(); g.arc(x, y - 1, 4.5, .2 * Math.PI, .8 * Math.PI); g.strokeStyle = 'rgba(255,170,100,.2)'; g.lineWidth = .7; g.stroke(); } }
  const gr = g.createLinearGradient(0, 22, 0, 38); gr.addColorStop(0, 'rgba(20,8,4,0)'); gr.addColorStop(1, 'rgba(20,8,4,.7)'); g.fillStyle = gr; g.fillRect(-34, 20, 68, 20);
  g.restore();
  for (const [x, y, r] of [[-14, 31, 1.4], [8, 34, 1.2], [20, 26, 1.1], [-22, 20, 1]]) ember(g, x, y, r, .9);
  g.restore();
  // wings: stubby, ember-tipped; flap on the strut, flare up and out when crowing
  for (const s of [-1, 1]){ const fl = w != null ? Math.max(0, Math.sin(w * TAU * 2)) * .12 : ch != null ? peck * .3 : 0;
    g.save(); g.translate(s * 22, -4); g.rotate(-s * (fl + k * 1.05)); g.translate(-s * 22, 4);
    const wing = SM([[s * 18, -8], [s * 32, -5], [s * 38, 10], [s * 37, 27, 1], [s * 32, 21], [s * 29, 30, 1], [s * 24, 22], [s * 19, 27, 1], [s * 16, 14]], .8);
    S.part(g, wing, ROO, { x:s * 28, y:10, r:18 }, { flat:true, mat:'skin', hx:s * 24, hy:0 });
    S.crease(g, SO([[s * 22, 2], [s * 30, 12], [s * 33, 24]]), ROO, 1.3, .45); S.crease(g, SO([[s * 20, 6], [s * 25, 16], [s * 25, 24]]), ROO, 1.2, .4);
    for (const [x, y] of [[37, 26], [29, 29], [19, 26]]) ember(g, s * x, y - 1, 1.3, .85);
    g.restore(); }
  // head
  const hy = -26 - k * 6 + peck * 10, hs = 1 + peck * .1;
  g.save(); g.translate(0, hy); g.scale(hs, hs); g.rotate(-k * .0);
  // burning comb behind the crown
  const cg = 1 + k * .3, flick = ph * TAU;
  for (const [x, y, r, i] of [[-10, -15, 5, 0], [-4, -20, 6, 1], [3.5, -21, 6.5, 2], [10, -16, 5.2, 3]]){
    flame(g, x * cg, y * cg - r * .8, 9 + k * 6 + Math.sin(flick * (i % 2 ? 2 : 1) + i * 1.7) * 2.5, r * .55, Math.sin(flick + i) * 1.5); }
  for (const [x, y, r] of [[-10, -15, 5], [-4, -20, 6], [3.5, -21, 6.5], [10, -16, 5.2]]) S.part(g, E(x * cg, y * cg, r, r * 1.25), COMB, { x:x * cg, y:y * cg, r }, { mat:'skin' });
  const head = SM([[-17, -6], [-18, 6], [-10, 16], [0, 18], [10, 16], [18, 6], [17, -6], [10, -16], [-10, -16]], .9);
  S.part(g, head, ROO, { x:0, y:0, r:19 }, { mat:'skin', hx:-8, hy:-8 });
  S.contact(g, head, 0, -15, 14, 4, .4);
  // wattle
  for (const s of [-1, 1]) S.part(g, SM([[s * 1, 11], [s * 7, 13], [s * 7, 22], [s * 3.5, 25], [s * 1, 20]], .9), COMB, { x:s * 4, y:17, r:6 }, { flat:true, mat:'skin' });
  // eyes: angry, ember-orange irises; squeezed shut while it crows
  if (k > .5){ for (const s of [-1, 1]) S.stroke(g, SO([[s * 13, -1], [s * 8, -5], [s * 3, -1.5]]), { deep:'#120a12' }, 2.4, .95); }
  else for (const s of [-1, 1]) S.eye(g, s * 8, -2, 6.8, 7.2, { lx:-s * .1, ly:.2, pr:.36, iris:'#ff5a1a', lid:.3, tilt:s * -.45, lidCol:ROO.base, lidDeep:ROO.deep });
  for (const s of [-1, 1]) S.ln(g, [[s * 16, -11 - k * 2], [s * 2.5, -6.5]], { deep:'#120a12' }, 3, .9);
  // beak: opens on each peck, gapes wide when crowing
  const o = Math.max(peck * .7, k);
  S.dot(g, SM([[-4.5, 5], [4.5, 5], [3, 8 + o * 8], [0, 10 + o * 10], [-3, 8 + o * 8]], .8), '#3a0a10');
  if (o > .1) S.dot(g, E(0, 7 + o * 7, 2.4, 1.6 + o), '#d83a4a', .8);
  S.part(g, PL([[-4.5, 6 + o * 6], [4.5, 6 + o * 6], [0, 12 + o * 9]]), BEAK, { x:0, y:8 + o * 6, r:5 }, { flat:true, lw:1 });
  S.part(g, PL([[-6, 2.5], [6, 2.5], [0, 12 - o * 4]]), BEAK, { x:0, y:5, r:6 }, { lw:1, hx:-2, hy:4 });
  g.restore();
  g.restore(); g.restore();
}


// =====================================================================
// 4. The Corn Husker: a blood-corn cob on a lanky stalk body, wrapped in a cloak of dry husk
// =====================================================================
const HUSKB = pal('#7a5a34'), HUSKBD = pal('#4a3220'), SILKB = pal('#b8481a'), COBCH = pal('#3a1a16'), KERNCH = ['#2a1410', '#3a1a12', '#1e0e0a', '#4a2016'], POP = pal('#fff2d0'),
  HUSK = pal('#d2b878'), HUSKD = pal('#a88a54'), STALK = pal('#8e9450'), STALKD = pal('#6a6e3a'), COBC0 = pal('#7a1e2c'), SILK0 = pal('#9a5a30'), ROOT = pal('#7a5a3a'),
  KERN0 = ['#8a1a2c', '#7a1828', '#9a2434', '#6a1424', '#c8962e', '#8a1a2c', '#a8283a', '#5e1830', '#8e1e30', '#7a1828'];
function leafP(bx, by, tx, ty, wd, curl = 0){ const mx = (bx + tx) / 2, my = (by + ty) / 2, dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return SM([[bx + nx * wd * .5, by + ny * wd * .5], [mx + nx * (wd * .6 + curl), my + ny * (wd * .6 + curl)], [tx, ty, 1], [mx - nx * (wd * .6 - curl), my - ny * (wd * .6 - curl)], [bx - nx * wd * .5, by - ny * wd * .5]], .8); }
/** One papery husk leaf with veins. */
function huskLeaf(g, bx, by, tx, ty, wd, curl, c, fire = null){
  if (fire) c = c === HUSK ? HUSKB : HUSKBD;
  const p = leafP(bx, by, tx, ty, wd, curl), mx = (bx + tx) / 2, my = (by + ty) / 2, dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  S.part(g, p, c, { x:mx, y:my, r:L * .5 }, { flat:true, mat:'cloth', hx:mx - nx * wd * .2, hy:my - L * .2 });
  g.save(); p(g); g.clip(); g.lineWidth = .8; g.lineCap = 'round';
  for (const f of [-.3, 0, .3]){ g.strokeStyle = rgba(c.deep, .4); g.beginPath(); g.moveTo(bx + nx * wd * f, by + ny * wd * f); g.quadraticCurveTo(mx + nx * (curl + wd * f * .8), my + ny * (curl + wd * f * .8), tx, ty); g.stroke(); }
  if (fire){ const gr = g.createRadialGradient(tx, ty, 0, tx, ty, L * .7); gr.addColorStop(0, 'rgba(14,6,2,.95)'); gr.addColorStop(1, 'rgba(14,6,2,0)'); g.fillStyle = gr; g.fillRect(tx - L, ty - L, L * 2, L * 2); }
  g.restore();
  if (fire){ g.save(); g.shadowColor = '#ff6a10'; g.shadowBlur = 6; p(g); g.strokeStyle = 'rgba(255,140,40,.85)'; g.lineWidth = 1.2; g.stroke(); g.restore();
    flame(g, tx, ty + 3, 10 * (1 + .25 * Math.sin(fire.ph * TAU * 2 + fire.i * 1.7)), 3.4, Math.sin(fire.ph * TAU + fire.i) * 2); } }
/** Kernel-studded blood-corn cob centred on (0,0), about 30 wide and 52 tall, with a face. */
function cob(g, jaw, eyeR, mode = 0, ph = 0){   // mode 0 plain, 1 burning (kernels popping), 2 charred (glowing kernels)
  const COBC = mode === 2 ? COBCH : COBC0, KERN = mode === 2 ? KERNCH : KERN0;
  const head = SM([[0, -26], [11, -22], [15, -8], [15, 8], [12, 20], [0, 26], [-12, 20], [-15, 8], [-15, -8], [-11, -22]], .9);
  S.part(g, head, COBC, { x:0, y:0, r:24 }, { flat:true });
  g.save(); head(g); g.clip(); const R = rng(91);
  for (let r = -7; r <= 7; r++){ const yy = r * 3.9, half = 16 * Math.sqrt(Math.max(0, 1 - (yy / 27) ** 2));
    for (let c = -5; c <= 5; c++){ const u = (c + (r % 2 ? .5 : 0)) / 5.4; if (Math.abs(u) > 1) continue; const xx = Math.sin(u * 1.35) / Math.sin(1.35) * half, kw = 2.9 * Math.cos(u * 1.35) + .5;
      const hot = mode && R() < (mode === 2 ? .3 : .08);
      if (hot){ g.save(); g.shadowColor = '#ff7a1a'; g.shadowBlur = 4; g.fillStyle = R() < .5 ? '#ff8a2a' : '#ffc04a'; g.beginPath(); g.roundRect(xx - kw / 2, yy - 1.75, kw, 3.5, 1.2); g.fill(); g.restore(); continue; }
      g.fillStyle = KERN[R() * KERN.length | 0]; g.beginPath(); g.roundRect(xx - kw / 2, yy - 1.75, kw, 3.5, 1.2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.32)'; ell(g, xx - kw * .15, yy - .8, kw * .26, .7); g.fill(); } }
  g.restore();
  S.overlay(g, head, COBC, { x:0, y:0, r:22 }, .7);
  S.dot(g, E(-7, -12, 3.2, 5, .3), '#fff', .22);
  S.stroke(g, head, COBC, 1.6, .9);
  // popcorn: kernels bursting in the heat, each puff swelling and shrinking on its own beat
  if (mode === 1) [[-10, -15], [11, -11], [-12, 6], [12, 3], [4, -22], [-2, 20]].forEach(([x, y], i) => { const k = .65 + .35 * Math.abs(Math.sin(ph * TAU + i * 1.3));
    for (const [dx, dy, r] of [[0, 0, 2.6], [2.2, -1.4, 2], [-2, -1.2, 1.9], [.6, 1.8, 1.7]]) S.part(g, E(x + dx * k, y + dy * k, r * k, r * k), POP, { x:x + dx * k, y:y + dy * k, r:r * k }, { flat:true, lw:.7 }); });
  // eyes: sockets where kernels are missing, slanted angry, with sickly glowing pupils
  for (const s of [-1, 1]){ S.dot(g, SM([[s * 1.5, -4], [s * 11, -10], [s * 12, -1], [s * 6.5, 2]], .8), '#14040c'); S.glow(g, s * 7, -3, 2.4 * eyeR, '#e4ff6a'); }
  // mouth: a gap of missing kernels with kernel teeth
  const my = 10, mh = 3 + jaw * 7;
  S.dot(g, SM([[-9, my], [0, my - 1], [9, my], [7, my + mh], [0, my + mh + 1.5], [-7, my + mh]], .8), '#14040c');
  for (const x of [-6, -2, 2, 6]){ S.dot(g, RR(x - 1.5, my - .5, 3, 3.2, 1), '#efe2b8'); }
  for (const x of [-4, 0, 4]){ S.dot(g, RR(x - 1.4, my + mh - 2, 2.8, 3, 1), '#efe2b8'); }
}

function husker(g, P = {}){
  const V = P.variant, burn = V === 'burning' || V === 'burnt', w = P.walk, ch = P.chew, sh = P.shed, bare = V === 'bare' || V === 'burnt' || sh != null, ph = w ?? ch ?? sh ?? 0;
  const SILK = burn ? SILKB : SILK0, fire = i => burn ? { ph, i } : null;
  const sw = w == null ? 0 : Math.sin(w * TAU), cs = ch == null ? 0 : Math.sin(ch * TAU);
  const sway = w != null ? sw * .05 : 0, bob = w != null ? -Math.abs(sw) * 3 : ch != null ? 3 + cs * 2 : 0, lean = ch == null ? 0 : .5 + Math.abs(cs) * .5;
  const jaw = ch != null ? .3 + Math.abs(cs) * .7 : sh != null ? Math.sin(cl01(sh * 1.6) * Math.PI) * .9 + .2 : .2;
  const flinch = sh == null ? 0 : Math.sin(sh * TAU * 3) * 2.5 * (1 - sh), eyeR = 1 + (sh != null ? Math.sin(cl01(sh * 1.4) * Math.PI) * .6 : 0);
  // shed: every husk piece flies outward, spins and falls away (the engine would play this on the first hit)
  const fly = (mx, my, i) => { if (sh == null) return null; const d = Math.hypot(mx, my + 10) || 1, k = ease(sh / .7), out = k * 30, dir = mx >= 0 ? 1 : -1;
    return { dx:mx / d * out + dir * k * 14, dy:(my + 10) / d * out * .35 + sh * sh * 14, rot:(mx >= 0 ? 1 : -1) * k * (.7 + i * .12), a:1 - cl01((sh - .5) / .5), px:mx, py:my }; };
  const piece = (f, draw) => { if (!f){ draw(); return; } if (f.a <= 0) return; g.save(); g.globalAlpha *= f.a; g.translate(f.px + f.dx, f.py + f.dy); g.rotate(f.rot); g.translate(-f.px, -f.py); draw(); g.restore(); };
  S.shadow(g, 0, 51, 32, 6);
  // legs: stalks with a node at the knee and roots for feet
  for (const s of [-1, 1]){
    const lp = w == null ? 0 : w * TAU + (s < 0 ? 0 : Math.PI), lift = w == null ? 0 : Math.max(0, Math.sin(lp)) * 7, dx = w == null ? 0 : Math.cos(lp) * 4;
    const kx = s * 10 + dx * .5, ky = 36 - lift * .5, ax = s * 9 + dx, ay = 46 - lift;
    S.tube(g, SO([[s * 5, 22], [kx, ky], [ax, ay]]), STALKD, 6); S.part(g, E(kx, ky, 4, 3), STALKD, { x:kx, y:ky, r:4 }, { flat:true, lw:1 });
    for (const d of [-1.1, -.4, .3, 1]){ S.tube(g, SO([[ax, ay], [ax + d * 5, ay + 3], [ax + d * 9, ay + 4.5 - Math.abs(d) * 1.5]]), ROOT, 2.2); }
  }
  g.save(); g.translate(flinch, 0); g.translate(0, 48 + bob); g.rotate(sway); g.translate(0, -48);
  const hx = 0, hy = -34 + lean * 6;
  // husk hood: leaves peeled back behind the cob
  const HOOD = [[-6, 14, -28, -30, 15, -3, HUSKD], [6, 14, 28, -30, 15, 3, HUSKD], [-8, 18, -34, -6, 14, -2, HUSK], [8, 18, 34, -6, 14, 2, HUSK]];
  if (!bare || sh != null) HOOD.forEach(([bx, by, tx, ty, wd, curl, c], i) => piece(fly(hx + (bx + tx) / 2, hy + (by + ty) / 2, i), () => huskLeaf(g, hx + bx, hy + by, hx + tx, hy + ty, wd, curl, c, fire(i))));
  // silk hair behind
  for (const [x0, x1, y1] of [[-6, -19, -2], [-3, -22, 6], [3, 21, 4], [6, 18, -4], [0, -15, 10], [1, 16, 12]]){ const sx = hx + x0, sy = hy - 24, ex = hx + x1, ey = hy + y1;
    const sp = SO([[sx, sy], [(sx + ex) / 2 + Math.sign(x1) * 6, sy + 4], [ex, ey]]); S.tube(g, sp, SILK, 1.8);
    if (burn){ g.save(); g.shadowColor = '#ff7a1a'; g.shadowBlur = 5; sp(g); g.strokeStyle = '#ffb040'; g.lineWidth = .8; g.stroke(); g.restore(); } }
  // torso: a jointed stalk
  S.tube(g, SO([[0, hy + 20], [0, 4], [0, 24]]), STALK, bare ? 12 : 10);
  for (const y of [-2, 12]) S.part(g, E(0, y, bare ? 7.5 : 6.5, 2.8), STALKD, { x:0, y, r:6 }, { flat:true, lw:1 });
  if (bare) for (const s of [-1, 1]){ S.tube(g, SO([[0, 4], [s * 8, 0], [s * 13, 4]]), STALKD, 2); S.tube(g, SO([[0, 14], [s * 7, 11], [s * 12, 15]]), STALKD, 2); }
  // arms: long thin stalks, leaf-blade claws
  for (const s of [-1, 1]){
    let ex = s * 30, ey = 10, wx = s * 36, wy = 30;
    if (w != null){ const sa = Math.sin(w * TAU + (s < 0 ? Math.PI : 0)); wx += sa * 4; wy += sa * 5; ex += sa * 2; }
    if (ch != null){ const sa = Math.sin(ch * TAU + (s < 0 ? 0 : Math.PI)); ex = s * 28; ey = 2; wx = s * 22; wy = 14 + sa * 8; }
    if (sh != null){ const f = Math.sin(cl01(sh * 1.5) * Math.PI); ex = s * (30 + f * 6); ey = 10 - f * 14; wx = s * (36 + f * 8); wy = 30 - f * 32; }
    S.tube(g, SO([[s * 9, -6], [ex, ey], [wx, wy]]), STALK, 5); S.part(g, E(ex, ey, 3.6, 3.6), STALKD, { x:ex, y:ey, r:3.6 }, { flat:true, lw:1 });
    const a = Math.atan2(wy - ey, wx - ex);
    for (const d of [-.5, 0, .5]){ const L = d ? 11 : 13, tx = wx + Math.cos(a + d) * L, ty = wy + Math.sin(a + d) * L; S.part(g, leafP(wx, wy, tx, ty, 4, d * 2), HUSKD, { x:(wx + tx) / 2, y:(wy + ty) / 2, r:6 }, { flat:true, lw:1 }); }
  }
  // husk cloak hanging from the shoulders
  const CLOAK = [[-6, -9, -24, 6, 13, -2, HUSKD], [6, -9, 24, 6, 13, 2, HUSKD], [-9, -6, -24, 34, 14, -3, HUSK], [9, -6, 24, 34, 14, 3, HUSK], [-4, -4, -11, 39, 13, -1, HUSKD], [4, -4, 11, 39, 13, 1, HUSKD], [0, -4, 0, 36, 12, 0, HUSK]];
  const order = [2, 3, 4, 5, 6, 0, 1];
  if (!bare || sh != null) order.forEach(i => { const [bx, by, tx, ty, wd, curl, c] = CLOAK[i]; piece(fly((bx + tx) / 2, (by + ty) / 2, i + 4), () => huskLeaf(g, bx, by, tx, ty, wd, curl, c, fire(i + 4))); });
  if (bare && sh == null) for (const s of [-1, 1]) huskLeaf(g, s * 6, -9, s * 16, 0, 9, s, HUSKD, burn ? { ph, i:s + 2 } : null);
  // the cob head
  g.save(); g.translate(hx, hy); cob(g, jaw, eyeR, burn ? (bare ? 2 : 1) : 0, ph); g.restore();
  // a few silk strands falling over the crown in front
  for (const [x0, x1, y1] of [[-2, -10, -16], [2, 9, -18], [0, -4, -20]]) S.tube(g, SO([[hx + x0, hy - 26], [hx + (x0 + x1) / 2, hy - 24], [hx + x1, hy + y1]]), SILK, 1.5);
  if (burn){ smoke(g, ph, -4, hy - 30, 4, 18, 3); sparks(g, ph, 0, hy - 14, 7, 36, 4); }
  g.restore();
}

// ---------- registry ----------
const C = (n, fps, key, once = false) => ({ n, fps, once, pose:t => ({ [key]:t }) });
export const NM1 = {
  // small and quick: r 20, so the feet sit at 19 below the centre (50 x .6 - 11); the archive drew it for r 18 at scale .56
  // a tank like the Mossback: r 26, so the feet sit at 24.6 below the centre (50 x .66 - 10 = 23)
  hayrick: { draw:hayrick, scale:.66, dy:-10, box:{ x:-72, y:-112, w:144, h:172 }, clips:{ walk:C(8, 6, 'walk'), chew:C(4, 7, 'chew'), toss:C(10, 14, 'toss', true) }, still:{} },
  // the same drawing in its burning look (the engine turns a hayrick into this when it walks onto fire); it keeps the toss
  hayrickBurning: { draw:(g, P) => hayrick(g, { ...P, variant:'burning' }), scale:.66, dy:-10, box:{ x:-72, y:-112, w:144, h:172 }, clips:{ walk:C(8, 6, 'walk'), chew:C(4, 7, 'chew'), toss:C(10, 14, 'toss', true) }, still:{} },
  // r 22, so the feet sit at 21 below the centre (50 x .64 - 11). The engine turns a husker into huskerBare on the first hit (and plays shed there); fire makes
  // huskerBurning, and huskerBare on fire becomes huskerCharred. The looks a strip leaves behind (bare, charred) carry the shed clip: the husk pieces fly off.
  husker: { draw:husker, scale:.64, dy:-11, box:{ x:-84, y:-90, w:168, h:148 }, clips:{ walk:C(8, 8, 'walk'), chew:C(4, 8, 'chew') }, still:{} },
  huskerBare: { draw:(g, P) => husker(g, { ...P, variant:'bare' }), scale:.64, dy:-11, box:{ x:-84, y:-90, w:168, h:148 }, clips:{ walk:C(8, 8, 'walk'), chew:C(4, 8, 'chew'), shed:C(10, 14, 'shed', true) }, still:{} },
  huskerBurning: { draw:(g, P) => husker(g, { ...P, variant:'burning' }), scale:.64, dy:-11, box:{ x:-84, y:-90, w:168, h:148 }, clips:{ walk:C(8, 8, 'walk'), chew:C(4, 8, 'chew') }, still:{} },
  huskerCharred: { draw:(g, P) => husker(g, { ...P, variant:'burnt' }), scale:.64, dy:-11, box:{ x:-84, y:-90, w:168, h:148 }, clips:{ walk:C(8, 8, 'walk'), chew:C(4, 8, 'chew'), shed:C(10, 14, 'shed', true) }, still:{} },
  rooster: { draw:rooster, scale:.6, dy:-11, box:{ x:-60, y:-84, w:120, h:142 }, clips:{ walk:C(8, 12, 'walk'), chew:C(4, 10, 'chew'), crow:C(10, 12, 'crow', true) }, still:{} },
};
