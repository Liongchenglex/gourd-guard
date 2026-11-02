// ---------- Castle walls, design archive (2026-11-02) ----------
// Two new castle wall types for the Crumbling Keep (owner: "a bulky castle wall with a gate" and "a tall castle wall with archers on top"):
//   gate   — the Gatehouse: one lane wide like the old wall but much heavier: two squat flanking towers with crimson banners,
//            a sloped plinth, and an arched gate with iron-bound oak doors behind a portcullis. Clips: closed, open (portcullis
//            rises, then the doors swing in), opened, shut (doors slam, portcullis drops with a puff of dust), cracked, broken, crumble.
//   tower  — the Archer Tower: a tall, narrow, tapered tower with arrow loops, corbels and a crenellated top; a Skeleton Archer
//            (the game's own `archer` from chars/w4.js, scaled) stands in the embrasure. `tower2` is the same tower with two archers.
//            Clips: idle, shoot (the archer draws and looses), cracked, broken (the tower leans), crumble (the tower sinks into its
//            rubble and the archer drops to the ground, dazed).
// Same language as the old castle wall (render/fx.js bakeCastle): hewn stone courses, moss, a torch, cracks that read as grooves.
// Drawn in GAME UNITS around the wall's lane point (x 0 = lane centre, y 0 = castleY), ground line at y = 22, like the old wall.
// Every frame is meant to be baked (clips), so glows are allowed. Nothing random per frame (seeded rng only).
// NOT for the game: lives in the owner's design archive.

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { archer } from '../../../../src/engine/render/chars/w4.js';

const TAU = Math.PI * 2;
// the old wall's palette (render/fx.js) plus the keep's crimson and gold (chars/w4.js)
const STONE = pal('#8f90a0'), STONED = pal('#6d6f80'), STONEL = pal('#a8a9b8'), STONEK = pal('#5d5f70'), IRONC = pal('#4c505c'), IRONL = pal('#6a6f7c'),
  TORCHW = pal('#5a3a20'), MOSSC = pal('#5c8a3a'), OAK = pal('#7a4e2c'), OAKL = pal('#8f5e36'), CRIM = pal('#9e2f44'), GOLD = pal('#e2b24c');
const GROUND = 22;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t * t * (3 - 2 * t);
const seg = (t, a, b) => clamp((t - a) / (b - a));

// ---------- shared helpers ----------
const path = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
/** A groove: dark line with a lit lower-right lip (as the old wall). */
function crack(g, pts, w = 1.6, a = .85){
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.save(); g.translate(.8, .8); path(g, pts); g.strokeStyle = `rgba(255,240,220,${a * .4})`; g.lineWidth = w; g.stroke(); g.restore();
  path(g, pts); g.strokeStyle = `rgba(22,12,18,${a})`; g.lineWidth = w; g.stroke();
}
function jag(R, x0, y0, x1, y1, n, amp){ const pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; for (let i = 1; i < n; i++){ const f = i / n, o = (R() - .5) * amp; pts.push([x0 + dx * f + nx * o, y0 + dy * f + ny * o]); } pts.push([x1, y1]); return pts; }
/** A dark hole where a block fell out. */
function hole(g, x, y, w, h){ g.fillStyle = '#17121c'; g.beginPath(); g.roundRect(x, y, w, h, 2); g.fill(); const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(60,50,70,.2)'); g.fillStyle = gr; g.fillRect(x, y, w, h); }
/** Hewn block courses filling x0..x1, y0 (top)..y1 (bottom), bottom row first; holes = Set of 'row:col'. */
function masonry(g, R, x0, x1, y0, y1, rows, n, holes, tint = 0){
  const rh = (y1 - y0) / rows;
  for (let ri = 0; ri < rows; ri++){ const yb = y1 - ri * rh, yt = yb - rh, off = ri % 2 ? .5 : 0, bw = (x1 - x0) / n;
    for (let i = -1; i <= n; i++){ let a = x0 + (i + off) * bw, b = a + bw; a = Math.max(a, x0); b = Math.min(b, x1); if (b - a < 2.5) continue;
      if (holes && holes.has(`${ri}:${i}`)){ hole(g, a + .8, yt + .8, b - a - 1.6, rh - 1.6); continue; }
      const q = R() - tint, col = q < .25 ? STONED : q < .8 ? STONE : STONEL, jit = (R() - .5) * 1;
      S.part(g, RR(a + .8, yt + .8 + jit, b - a - 1.6, rh - 1.6, 2.2), col, { x:(a + b) / 2, y:(yt + yb) / 2, r:(b - a) * .62 }, { mat:'stone', flat:R() < .65, lw:1.1, hx:a + (b - a) * .3, hy:yt + 3 });
    } }
}
function moss(g, x, y, rx, ry){ S.part(g, E(x, y, rx, ry), MOSSC, { x, y, r:rx }, { flat:true, mat:'moss', noEdge:true }); }
/** A small cobweb in a corner: radial threads and two sagging rings. */
function web(g, x, y, s, dir = 1){ g.save(); g.translate(x, y); g.scale(dir, 1); g.strokeStyle = 'rgba(235,235,250,.55)'; g.lineWidth = .6;
  const A = [0, .4, .8, 1.2, 1.57]; for (const a of A){ g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * s, Math.sin(a) * s); g.stroke(); }
  for (const r of [.45, .8]){ g.beginPath(); A.forEach((a, i) => { const px = Math.cos(a) * s * r, py = Math.sin(a) * s * r; if (!i) g.moveTo(px, py); else { const m = (A[i - 1] + a) / 2; g.quadraticCurveTo(Math.cos(m) * s * r * .8, Math.sin(m) * s * r * .8, px, py); } }); g.stroke(); }
  g.restore(); }
/** A flame (baked: flick 0..1 picks its shape). */
function flame(g, x, y, s = 1, flick = 0){
  const f = Math.sin(flick * TAU), f2 = Math.sin(flick * TAU * 2 + 1);
  g.save(); g.shadowColor = '#ff9a30'; g.shadowBlur = 10 * s;
  SM([[x + f * 1.5 * s, y - 15 * s - f2 * 2 * s], [x - 5 * s, y - 6 * s], [x, y], [x + 5 * s, y - 6 * s]], .9)(g);
  const gr = g.createRadialGradient(x, y - 4 * s, 0, x, y - 6 * s, 10 * s); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(.45, '#ffc93a'); gr.addColorStop(1, '#ff6a1a'); g.fillStyle = gr; g.fill(); g.restore();
  const gl = g.createRadialGradient(x, y - 6 * s, 0, x, y - 6 * s, 20 * s); gl.addColorStop(0, 'rgba(255,170,70,.28)'); gl.addColorStop(1, 'rgba(255,170,70,0)'); g.fillStyle = gl; g.fillRect(x - 20 * s, y - 26 * s, 40 * s, 40 * s);
}
function torch(g, x, y, flick, dir = 1){
  S.part(g, RR(x - 2.5, y + 2, 5, 8, 1.5), IRONC, { x, y:y + 6, r:5 }, { flat:true, mat:'metal', lw:.9 }); S.rivet(g, x, y + 4, 1.2, IRONC);
  S.tube(g, SO([[x, y + 4], [x + dir * 1, y - 10]]), TORCHW, 3.4);
  flame(g, x + dir * 1, y - 10, .9, flick);
}
/** A crimson banner with a swallow tail and a gold bat; torn = 0 | 1 | 2. */
function banner(g, x, y0, len, w, sway, torn = 0){
  const L = torn === 2 ? len * .55 : torn === 1 ? len * .8 : len, sw = Math.sin(sway * TAU) * 1.6;
  S.part(g, RR(x - w / 2 - 2, y0 - 2, w + 4, 3.5, 1.5), IRONC, { x, y:y0, r:w / 2 }, { flat:true, mat:'metal', lw:.8 });
  const tail = torn ? [[x + w / 2 + sw, y0 + L], [x + w * .2 + sw, y0 + L - 4], [x - w * .1 + sw, y0 + L + 1], [x - w * .35 + sw, y0 + L - 3], [x - w / 2 + sw, y0 + L + 1]]
    : [[x + w / 2 + sw, y0 + L], [x + sw, y0 + L - 6], [x - w / 2 + sw, y0 + L]];
  const p = PL([[x - w / 2, y0], [x + w / 2, y0], ...tail]);
  S.part(g, p, CRIM, { x, y:y0 + L / 2, r:L * .6 }, { mat:'cloth', flat:true, lw:1 });
  S.crease(g, SO([[x - w * .2, y0 + 3], [x - w * .25 + sw * .6, y0 + L - 6]]), CRIM, 1.2, .35);
  S.ln(g, [[x - w / 2 + 1.2, y0 + 3], [x - w / 2 + 1.2 + sw * .5, y0 + L - 2]], GOLD, 1, .8); S.ln(g, [[x + w / 2 - 1.2, y0 + 3], [x + w / 2 - 1.2 + sw * .5, y0 + L - 2]], GOLD, 1, .8);
  if (L > 14) bat(g, x + sw * .3, y0 + Math.min(L * .4, 11), w * .055);
}
function bat(g, x, y, s){ g.save(); g.translate(x, y); g.scale(s, s); S.dot(g, SM([[0, -4], [6, -9], [9, -3, 1], [14, -6], [12, 2], [6, 0], [0, 5], [-6, 0], [-12, 2], [-14, -6], [-9, -3, 1], [-6, -9]], .6), GOLD.base); g.restore(); }
/** Rubble stones at the foot (seeded). */
function rubble(g, R, n, hw, y = GROUND, sz = 1){
  for (let i = 0; i < n; i++){ const x = -hw + 4 + R() * (hw * 2 - 8), yy = y - 2 + R() * 5, r = (2.5 + R() * 2.5) * sz; g.save(); g.translate(x, yy); g.rotate(R() * 3); S.part(g, RR(-r, -r * .6, r * 2, r * 1.2, 1.5), R() < .5 ? STONED : STONE, { x:0, y:0, r }, { mat:'stone', flat:true, lw:.9 }); g.restore(); }
}
function dust(g, x, y, r, a){ if (a <= 0) return; const gr = g.createRadialGradient(x - r * .2, y - r * .2, 0, x, y, r); gr.addColorStop(0, `rgba(200,190,200,${a})`); gr.addColorStop(.6, `rgba(150,140,160,${a * .55})`); gr.addColorStop(1, 'rgba(120,110,130,0)'); g.fillStyle = gr; ell(g, x, y, r, r * .8); g.fill(); }
const stars = (g, x, y, t, s = 1) => { for (let i = 0; i < 3; i++){ const a = t * TAU + i * TAU / 3, px = x + Math.cos(a) * 12 * s, py = y + Math.sin(a) * 4 * s; g.save(); g.translate(px, py); g.rotate(a); S.dot(g, PL([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => { const rr = (k % 2 ? 1.4 : 3.6) * s, aa = k * Math.PI / 5 - Math.PI / 2; return [Math.cos(aa) * rr, Math.sin(aa) * rr]; })), '#ffe066'); g.restore(); } };

/** The crumble: shake, then the wall sinks into the ground (clipped at the ground line) while stones fly and dust rolls. */
function crumbling(g, c, hw, top, drawWall, seed){
  const R = rng(seed), shake = c < .35 ? Math.sin(c * 90) * 1.8 * (c / .35) : 0, s = ease(seg(c, .22, .82));
  const H = GROUND - top;
  if (s < 1){ g.save(); g.beginPath(); g.rect(-hw - 30, top - 80, hw * 2 + 60, GROUND - top + 80 - 1); g.clip(); g.translate(shake, s * H); drawWall(); g.restore(); }
  // the mound grows as the wall goes
  rubble(g, rng(seed + 3), Math.round(4 + s * 10), hw * (.7 + s * .35), GROUND - s * 3, .9 + s * .4);
  // stones thrown out of the top
  for (let i = 0; i < 9; i++){ const a0 = .25 + R() * .3, ft = seg(c, a0, a0 + .45); if (ft <= 0 || ft >= 1) continue;
    const dir = (R() - .5) * 2, x = dir * (hw * .4 + ft * hw * .8), y0 = top + 10 + R() * 25, y = y0 + (-28 * ft + 70 * ft * ft) * (1 + R() * .3), r = 2.5 + R() * 3;
    g.save(); g.translate(x, Math.min(y, GROUND)); g.rotate(ft * 6 * dir); S.part(g, RR(-r, -r * .7, r * 2, r * 1.4, 1.2), R() < .5 ? STONE : STONED, { x:0, y:0, r }, { mat:'stone', flat:true, lw:.8 }); g.restore(); }
  // dust: rolls out at the base and up the face, then settles
  const da = Math.sin(seg(c, .2, 1) * Math.PI) * .75;
  for (let i = 0; i < 7; i++){ const x = (i / 6 - .5) * hw * 2.1, r = 12 + 10 * s + (i % 2) * 5; dust(g, x, GROUND - 6 - (i % 3) * 7 * s, r, da); }
  dust(g, 0, GROUND - H * .4 * (1 - s), hw * 1.1, da * .7);
}

// ---------- the Gatehouse ----------
const GW = 41;   // half width (the old wall is 38.5)
/** P: open 0..1 (portcullis rises over 0..0.55, doors swing over 0.45..1), shut 0..1 (the reverse, fast, with a slam), dmg 0..2, sway 0..1, crumble 0..1 */
function gatehouse(g, P = {}){
  if (P.crumble != null){ S.shadow(g, 0, GROUND, GW + 10, 7); crumbling(g, P.crumble, GW * 1.06, -96, () => gateBody(g, { dmg:2, sway:P.crumble * 2 }), 41); return; }
  S.shadow(g, 0, GROUND, GW + 10, 7);
  gateBody(g, P);
}
/** The gatehouse is drawn on a 1.06 × 1.14 stretch about the ground line: still one lane, but heavier and taller than the old wall. */
function gateBody(g, P){ g.save(); g.translate(0, GROUND); g.scale(1.06, 1.14); g.translate(0, -GROUND); gateBody0(g, P); g.restore(); }
function gateBody0(g, P){
  const dmg = P.dmg ?? 0, sway = P.sway ?? 0, R = rng(31 + dmg * 7);
  let port = 0, doors = 0, slam = 0;   // portcullis lift 0..1, door swing 0..1
  if (P.open != null){ port = ease(seg(P.open, 0, .55)); doors = ease(seg(P.open, .45, 1)); }
  else if (P.shut != null){ doors = 1 - ease(seg(P.shut, 0, .4)); const d = seg(P.shut, .4, .7); port = 1 - d * d; slam = seg(P.shut, .68, 1); }
  else if (P.opened) { port = 1; doors = 1; }
  // sloped plinth (batter): the wall is thicker at the foot
  const plinth = PL([[-GW - 5, GROUND + 1], [GW + 5, GROUND + 1], [GW + 1, 8], [-GW - 1, 8]]);
  S.part(g, plinth, STONEK, { x:0, y:14, r:GW }, { mat:'stone', flat:true, lw:1.3 });
  for (const x of [-30, -12, 8, 26]) S.ln(g, [[x, 9], [x + (x < 0 ? -2 : 2), GROUND]], STONEK, .9, .5);
  // central block behind the towers
  const holesC = new Set(dmg === 0 ? [] : dmg === 1 ? ['4:2'] : ['4:2', '5:0', '3:2']);
  masonry(g, R, -24, 24, -50, 9, 6, 3, holesC);
  // the archway: voussoirs, then the dark passage with a warm glow
  const arch = SM([[-18, 9, 1], [-18, -18], [-12, -32], [0, -37], [12, -32], [18, -18], [18, 9, 1]], .85);
  for (let i = 0; i <= 6; i++){ const a = Math.PI + i * Math.PI / 6, cx = Math.cos(a) * 21.5, cy = -18 + Math.sin(a) * 21.5; g.save(); g.translate(cx, cy); g.rotate(a + Math.PI / 2); S.part(g, RR(-4.2, -3.4, 8.4, 6.8, 1.6), i === 3 ? STONEL : STONED, { x:0, y:0, r:5 }, { mat:'stone', flat:true, lw:1 }); g.restore(); }
  arch(g); g.fillStyle = '#120c16'; g.fill();
  g.save(); arch(g); g.clip();
  let gr = g.createRadialGradient(0, 10, 0, 0, 6, 30); gr.addColorStop(0, `rgba(255,150,60,${.25 + doors * .3})`); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(-19, -40, 38, 50);
  // the far end of the passage once the doors are open: a lit floor and a far arch
  if (doors > .05){ g.globalAlpha = doors; S.dot(g, PL([[-12, 9], [12, 9], [6, -8], [-6, -8]]), '#3a2a2c'); S.dot(g, SM([[-6, -8, 1], [-6, -19], [0, -24], [6, -19], [6, -8, 1]], .85), 'rgba(255,170,90,.35)'); g.globalAlpha = 1; }
  // doors: hinged at the arch sides, swinging in (foreshortened and darker as they open)
  for (const s of [-1, 1]){ const wv = 18 * Math.cos(doors * Math.PI * .46), x0 = s * 18, x1 = s * (18 - wv), dark = doors * .5;
    if (wv < .6) continue;
    const dp = PL([[x0, 10], [x1, 10 - doors * 2], [x1, -42], [x0, -42]]);
    g.save(); dp(g); g.clip();
    S.part(g, dp, OAK, { x:(x0 + x1) / 2, y:-10, r:20 }, { mat:'wood', flat:true, lw:1.1 });
    const nPl = 3; for (let k = 1; k < nPl; k++){ const px = x0 + (x1 - x0) * k / nPl; S.ln(g, [[px, -42], [px, 10]], OAK, 1, .6); }
    for (const by of [-24, -6, 5]){ S.part(g, PL([[x0, by - 1.8], [x1, by - 1.8 - doors], [x1, by + 1.8 - doors], [x0, by + 1.8]]), IRONC, { x:(x0 + x1) / 2, y:by, r:10 }, { flat:true, mat:'metal', lw:.7 }); for (let k = 0; k < 3; k++){ const rx = x0 + (x1 - x0) * (k + .5) / 3; S.rivet(g, rx, by - doors * (k + .5) / 3, .9, IRONL); } }
    if (dmg >= 2 && s < 0){ crack(g, jag(rng(5), x0 + (x1 - x0) * .55, -30, x0 + (x1 - x0) * .4, 8, 5, 3), 1.8, .9); }
    if (wv > 6){ const kx = x0 + (x1 - x0) * .7; g.strokeStyle = GOLD.dark; g.lineWidth = 1.3; ell(g, kx, 0, 2.2, 2.6); g.stroke(); S.rivet(g, kx, -2.6, 1, GOLD); }
    if (dark > 0){ g.fillStyle = `rgba(10,6,14,${dark})`; g.fillRect(-19, -44, 38, 56); }
    g.restore(); }
  // the portcullis in front: an iron grid that rises into the wall (clipped by the arch), spikes at its foot
  { const lift = port * 50, yb = 9 - lift;
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 2.6; g.lineCap = 'round';
    for (const x of [-14, -7, 0, 7, 14]){ g.beginPath(); g.moveTo(x + .8, yb - 56); g.lineTo(x + .8, yb + .8); g.stroke(); }
    for (const x of [-14, -7, 0, 7, 14]){ g.strokeStyle = IRONC.deep; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x, yb - 56); g.lineTo(x, yb); g.stroke(); g.strokeStyle = IRONC.base; g.lineWidth = 1.7; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = .6; g.beginPath(); g.moveTo(x - .5, yb - 56); g.lineTo(x - .5, yb); g.stroke();
      S.dot(g, PL([[x - 1.6, yb - 1], [x + 1.6, yb - 1], [x, yb + 3.5]]), IRONC.dark); }
    for (const y of [yb - 9, yb - 20, yb - 31, yb - 42]){ g.strokeStyle = IRONC.deep; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-18, y); g.lineTo(18, y); g.stroke(); g.strokeStyle = IRONL.base; g.lineWidth = 1.4; g.stroke(); for (const x of [-14, -7, 0, 7, 14]) S.rivet(g, x, y, .9, IRONL); }
  }
  g.restore();
  // the slam: a puff of dust under the arch
  if (slam > 0){ const a = Math.sin(slam * Math.PI) * .7; dust(g, -11, 8, 8 + slam * 7, a); dust(g, 11, 8, 8 + slam * 7, a); }
  // cornice and three merlons on the central block
  S.part(g, RR(-25, -54, 50, 6, 2), STONED, { x:0, y:-51, r:25 }, { mat:'stone', flat:true, lw:1.1 });
  for (const [mx, mi] of [[-20, 0], [-5, 1], [10, 2]]){
    if (dmg === 2 && mi === 1) continue;
    const p = dmg >= 1 && mi === 2 ? PL([[mx, -54], [mx, -62], [mx + 3, -60], [mx + 6, -65], [mx + 8, -60], [mx + 10, -62], [mx + 10, -54]]) : RR(mx, -66, 10, 12, 2);
    S.part(g, p, mi === 1 ? STONEL : STONE, { x:mx + 5, y:-60, r:7 }, { mat:'stone', lw:1.1, hx:mx + 3, hy:-63 });
  }
  // the crest: a crimson shield with a gold bat on the middle merlon (or on the cornice once that merlon has fallen)
  { const cy = dmg === 2 ? -50 : -60, sh = SM([[-4.5, cy - 4], [4.5, cy - 4], [4.5, cy + 1], [0, cy + 5, 1], [-4.5, cy + 1]], .6); S.part(g, sh, CRIM, { x:0, y:cy, r:5 }, { mat:'paint', lw:1 }); S.stroke(g, sh, GOLD, 1, .9); bat(g, 0, cy - .5, .26); }
  // the two flanking towers
  for (const s of [-1, 1]){
    const x0 = s < 0 ? -GW : 23, x1 = s < 0 ? -23 : GW, cx = (x0 + x1) / 2;
    const holes = new Set(dmg === 0 ? [] : dmg === 1 ? (s < 0 ? ['3:1'] : []) : (s < 0 ? ['3:1', '5:0'] : ['2:1', '6:0']));
    g.save(); g.beginPath(); g.rect(x0 - 1, -70, x1 - x0 + 2, 82); g.clip();
    masonry(g, rng(70 + s + dmg), x0, x1, -66, 10, 7, 2, holes, .05);
    g.restore();
    // the tower's front corner shading: a light lit edge and a dark far edge, so it reads as a round-cornered bulk
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(s < 0 ? x0 : x0, -66, 3, 76); g.fillStyle = 'rgba(20,10,30,.28)'; g.fillRect(s < 0 ? x1 - 3 : x1 - 3, -66, 3, 76);
    S.stroke(g, RR(x0, -66, x1 - x0, 76, 2), STONED, 1.2, .8);
    // corbelled cap and two merlons
    S.part(g, RR(x0 - 2, -71, x1 - x0 + 4, 6, 2), STONED, { x:cx, y:-68, r:12 }, { mat:'stone', flat:true, lw:1.1 });
    for (const k of [0, 1]){ const mx = k ? x1 - 7 : x0 - 1, broken = dmg === 2 && ((s < 0 && k === 0) || (s > 0 && k === 1)), chip = dmg >= 1 && s > 0 && k === 0;
      const p = broken ? PL([[mx, -71], [mx, -76], [mx + 3, -78], [mx + 6, -74], [mx + 8, -76], [mx + 8, -71]]) : chip ? PL([[mx, -71], [mx, -83], [mx + 5, -83], [mx + 8, -79], [mx + 8, -71]]) : RR(mx, -83, 8, 12, 2);
      S.part(g, p, k ? STONE : STONEL, { x:mx + 4, y:-77, r:6 }, { mat:'stone', lw:1.1, hx:mx + 2, hy:-80 }); }
    banner(g, cx, -64, 21, 11, sway + (s > 0 ? .3 : 0), dmg);
    torch(g, cx, -14, (sway + (s > 0 ? .5 : 0)) % 1, s);
  }
  // moss, a strand down the left tower, cobwebs in the arch corners
  moss(g, -GW + 4, 9, 7, 3); moss(g, GW - 6, 10, 5, 2.6); moss(g, -24, -52, 5, 2.2); moss(g, 18, 7, 4, 2);
  S.tube(g, SO([[-GW + 2, -64], [-GW + 3, -52], [-GW + 1, -44]]), MOSSC, 2);
  web(g, -18, -18, 6, 1); web(g, 18, -18, 6, -1);
  // damage: cracks deepen; rubble at the foot
  if (dmg >= 1){ crack(g, jag(R, -GW + 6, -60, -GW + 12, -36, 5, 6), 1.8, .9); crack(g, jag(R, 20, -48, 24, -20, 5, 5), 1.6, .85); crack(g, jag(R, -22, -10, -20, 8, 4, 4), 1.4, .8); }
  if (dmg >= 2){ crack(g, jag(R, -6, -54, 4, -36, 5, 6), 2.2, .95); crack(g, jag(R, GW - 4, -70, GW - 12, -40, 6, 6), 2, .9); crack(g, jag(R, 30, -10, 34, 8, 3, 4), 1.6, .85); rubble(g, R, 6, GW); }
}

// ---------- the Archer Tower ----------
const TB = 30, TT = 24, TTOP = -98;   // half width at the foot and at the top, top of the shaft
const AS = .52;                       // archer scale on the tower (a game archer is .66 × 0.85..1.05)
/** P: hold 0..1 | draw 0..1 (archer clips), n archers (1 | 2), dmg 0..2, flick 0..1 (torch), crumble 0..1 */
function tower(g, P = {}){
  const n = P.n ?? 1;
  if (P.crumble != null){ const c = P.crumble;
    S.shadow(g, 0, GROUND, TB + 8, 7);
    crumbling(g, c, TB, TTOP - 20, () => towerBody(g, { dmg:2, n, lean:.03 + c * .05, flick:c * 3 % 1, noArchers:c > .28 }), 77);
    // the archer(s) drop: knocked off as the tower sinks, tumble, land on the rubble, stagger, then stand dazed
    if (c > .28){ const f = seg(c, .28, .66), land = seg(c, .66, .78), xs = n === 2 ? [-14, 14] : [0];
      xs.forEach((x0, i) => { const sc = (n === 2 ? .46 : AS) + (.58 - (n === 2 ? .46 : AS)) * f, feet = TTOP - 2 + (GROUND - 3 - TTOP + 2) * f * f, x = x0 * (1 + f * .5) + (i ? 1 : -1) * Math.sin(f * Math.PI) * 6 * (n === 2 ? 1 : 0),
        rot = (n === 2 && i ? -1 : 1) * Math.sin(f * Math.PI) * .9 * (1 - land), sq = land > 0 && land < 1 ? 1 - Math.sin(land * Math.PI) * .18 : 1;
        g.save(); g.translate(x, feet); g.rotate(rot); g.scale(sc * (2 - sq), sc * sq); g.translate(0, -50); archer(g, { hold:c * 4 % 1 }); g.restore();
        if (c > .8) stars(g, x, feet - 115 * sc, c * 3 + i * .3, .9); }); }
    return; }
  S.shadow(g, 0, GROUND, TB + 8, 7);
  towerBody(g, P);
}
function towerBody(g, P){
  const dmg = P.dmg ?? 0, n = P.n ?? 1, R = rng(53 + dmg * 5), lean = P.lean ?? (dmg === 2 ? .035 : 0), flick = P.flick ?? (P.hold ?? P.draw ?? 0);
  g.save(); g.translate(0, GROUND); g.rotate(lean); g.translate(0, -GROUND);
  // plinth
  S.part(g, PL([[-TB - 5, GROUND + 1], [TB + 5, GROUND + 1], [TB + 1, 10], [-TB - 1, 10]]), STONEK, { x:0, y:16, r:TB }, { mat:'stone', flat:true, lw:1.3 });
  // tapered shaft: masonry clipped to the trapezoid; a chunk bitten out of the top corner once broken
  const shaft = dmg === 2 ? PL([[-TB, 11], [TB, 11], [TT, TTOP], [-TT + 14, TTOP], [-TT + 8, TTOP + 6], [-TT + 3, TTOP + 4], [-TT - .5, TTOP + 12]]) : PL([[-TB, 11], [TB, 11], [TT, TTOP], [-TT, TTOP]]);
  const holes = new Set(dmg === 0 ? [] : dmg === 1 ? ['6:3', '2:0'] : ['6:3', '2:0', '8:1', '3:3', '10:2']);
  g.save(); shaft(g); g.clip(); masonry(g, R, -TB, TB, TTOP, 11, 12, 3, holes);
  let gr = g.createLinearGradient(-TB, 0, TB, 0); gr.addColorStop(0, 'rgba(255,255,255,.08)'); gr.addColorStop(.25, 'rgba(255,255,255,0)'); gr.addColorStop(.75, 'rgba(20,10,30,0)'); gr.addColorStop(1, 'rgba(20,10,30,.35)'); g.fillStyle = gr; g.fillRect(-TB, TTOP, TB * 2, 112);   // round tower: lit left, shaded right
  g.restore(); S.stroke(g, shaft, STONED, 1.3, .85);
  // arrow loops (cross slits) with a faint glow inside
  for (const [y, s] of [[-16, 1], [-60, .9]]){ const p = PL([[-1.6 * s, y - 11 * s], [1.6 * s, y - 11 * s], [1.6 * s, y - 2.2 * s], [5 * s, y - 2.2 * s], [5 * s, y + .8 * s], [1.6 * s, y + .8 * s], [1.6 * s, y + 10 * s], [-1.6 * s, y + 10 * s], [-1.6 * s, y + .8 * s], [-5 * s, y + .8 * s], [-5 * s, y - 2.2 * s], [-1.6 * s, y - 2.2 * s]]);
    S.part(g, RR(-7 * s, y - 13 * s, 14 * s, 25 * s, 3), STONED, { x:0, y, r:10 * s }, { mat:'stone', flat:true, lw:1 }); S.dot(g, p, '#120c16');
    const gl = g.createRadialGradient(0, y, 0, 0, y, 8 * s); gl.addColorStop(0, 'rgba(255,150,60,.5)'); gl.addColorStop(1, 'rgba(255,150,60,0)'); g.save(); p(g); g.clip(); g.fillStyle = gl; g.fillRect(-8, y - 12, 16, 24); g.restore(); }
  // corbels under the parapet
  for (let i = 0; i < 5; i++){ const x = -TT + 2 + i * (TT * 2 - 4) / 4; S.part(g, SM([[x - 3.2, TTOP], [x + 3.2, TTOP], [x + 2, TTOP + 6], [x, TTOP + 7.5], [x - 2, TTOP + 6]], .7), STONED, { x, y:TTOP + 3, r:4 }, { mat:'stone', flat:true, lw:.9 }); }
  // walkway floor seen through the embrasures
  S.part(g, RR(-TT - 5, TTOP - 7, TT * 2 + 10, 8, 2), STONEK, { x:0, y:TTOP - 3, r:TT }, { mat:'stone', flat:true, lw:1.1 });
  // the archers stand behind the parapet
  if (!P.noArchers){ const xs = n === 2 ? [-13, 13] : [0], sc = n === 2 ? .46 : AS;
    xs.forEach((x, i) => { g.save(); g.translate(x, TTOP - 3); g.scale(sc, sc); g.translate(0, -50);
      const q = i ? .5 : 0; archer(g, P.draw != null ? { draw:clamp(P.draw - q * .25) } : { hold:((P.hold ?? 0) + q) % 1 }); g.restore(); }); }
  // parapet: a low wall then merlons (gaps where the archers stand)
  S.part(g, RR(-TT - 6, TTOP - 16, TT * 2 + 12, 11, 2), STONE, { x:0, y:TTOP - 10, r:TT + 6 }, { mat:'stone', flat:true, lw:1.2 });
  for (const x of [-18, 0, 18]) S.ln(g, [[x, TTOP - 15], [x, TTOP - 6]], STONED, .8, .5);
  const mers = n === 2 ? [[-TT - 6, 9], [-4, 8], [TT - 3, 9]] : [[-TT - 6, 11], [TT - 5, 11]];
  mers.forEach(([mx, mw], i) => {
    const broken = dmg === 2 && i === 0, chip = dmg >= 1 && i === mers.length - 1;
    const p = broken ? PL([[mx, TTOP - 16], [mx, TTOP - 20], [mx + 4, TTOP - 23], [mx + 7, TTOP - 19], [mx + mw, TTOP - 21], [mx + mw, TTOP - 16]]) : chip ? PL([[mx, TTOP - 16], [mx, TTOP - 29], [mx + mw - 4, TTOP - 29], [mx + mw, TTOP - 25], [mx + mw, TTOP - 16]]) : RR(mx, TTOP - 29, mw, 13, 2);
    S.part(g, p, i === 1 && n === 2 ? STONEL : STONE, { x:mx + mw / 2, y:TTOP - 22, r:8 }, { mat:'stone', lw:1.1, hx:mx + 3, hy:TTOP - 26 }); });
  // a crimson pennant on the back corner pole
  { const px = TT + 2, sw = Math.sin(flick * TAU) * 2; S.tube(g, SO([[px, TTOP - 16], [px, TTOP - 46]]), TORCHW, 2); S.part(g, PL([[px, TTOP - 46], [px + 16 + sw, TTOP - 42 + sw * .3], [px + 10, TTOP - 39], [px + 15 + sw, TTOP - 35], [px, TTOP - 35]]), CRIM, { x:px + 8, y:TTOP - 40, r:9 }, { mat:'cloth', flat:true, lw:.9 }); }
  torch(g, TB - 8, -34, flick, 1);
  moss(g, -TB + 6, 10, 7, 3); moss(g, TB - 9, 11, 5, 2.4); moss(g, -TT - 3, TTOP - 8, 4, 2);
  S.tube(g, SO([[-TT + 1, TTOP + 4], [-TT, TTOP + 20], [-TT + 2, TTOP + 34], [-TT - 1, TTOP + 44]]), MOSSC, 1.8);
  web(g, -TT + 1, TTOP + 1, 9, 1);
  if (dmg >= 1){ crack(g, jag(R, -12, -88, -16, -48, 5, 6), 1.8, .9); crack(g, jag(R, 14, -30, 18, 4, 5, 5), 1.6, .85); }
  if (dmg >= 2){ crack(g, jag(R, 2, -96, -4, -10, 10, 8), 2.4, .95); crack(g, jag(R, 21, -94, 12, -64, 4, 5), 1.8, .85); crack(g, jag(R, -24, -30, -14, -6, 4, 4), 1.6, .85); }
  g.restore();
  if (dmg >= 2) rubble(g, R, 6, TB);
}

// ---------- registry: like chars/index.js entries (box in drawing units = game units here; clips baked n frames at fps) ----------
const GBOX = { x:-68, y:-104, w:136, h:146 }, TBOX = { x:-64, y:-178, w:128, h:220 };
const gateClips = {
  closed:  { n:6, fps:6, pose:t => ({ sway:t }) },
  open:    { n:12, fps:12, once:true, pose:t => ({ open:t, sway:t }) },
  opened:  { n:6, fps:6, pose:t => ({ opened:true, sway:t }) },
  shut:    { n:9, fps:16, once:true, pose:t => ({ shut:t, sway:t }) },
  cracked: { n:6, fps:6, pose:t => ({ sway:t, dmg:1 }) },
  broken:  { n:6, fps:6, pose:t => ({ sway:t, dmg:2 }) },
  crumble: { n:14, fps:12, once:true, pose:t => ({ crumble:t }) },
};
const towerClips = n => ({
  idle:    { n:4, fps:4, pose:t => ({ hold:t, n }) },
  shoot:   { n:6, fps:14, once:true, pose:t => ({ draw:t, n, flick:t }) },
  cracked: { n:4, fps:4, pose:t => ({ hold:t, n, dmg:1 }) },
  broken:  { n:4, fps:4, pose:t => ({ hold:t, n, dmg:2 }) },
  crumble: { n:16, fps:12, once:true, pose:t => ({ crumble:t, n }) },
});
export const CLIPS = {
  gate:   { name:'Gatehouse', draw:gatehouse, box:GBOX, clips:gateClips },
  tower:  { name:'Archer Tower', draw:tower, box:TBOX, clips:towerClips(1) },
  tower2: { name:'Archer Tower, two archers', draw:tower, box:TBOX, clips:towerClips(2) },
};
