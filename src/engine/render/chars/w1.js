// ---------- World 1 characters (Pumpkin Patch), Toy Plastic style ----------
// Each drawing takes a pose and draws in "drawing units" around (0,0) with the feet near y = 50.
// CHARS maps a monster type to its fit (scale and dy into in-game units), frame box and animation clips;
// anim.js bakes the clips into strips. Approved on the style sheet, 2026-09-26.

import { E, MATS, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';

const STEM = pal('#8a5a2c'), LEAF = pal('#4f9a3a'), IMP = pal('#ec5a3c'), IMPB = pal('#ffb98a'), HORN = pal('#f4dfa0'), GH = pal('#8dc06c'), GHD = pal('#6f9a52'), SHIRT = pal('#6a5a8a'), PANTS = pal('#4a3f5e'),
  WRAP = pal('#ece0c4'), CHAR = pal('#b8a98c'), ROBE = pal('#5a4a72'), ROBED = pal('#3f3352'), LAN = pal('#5b4b3a'), LANG = pal('#ffe3a0'), WOOD = pal('#b48a58'), PATCH = pal('#7a6a56'), LEATH = pal('#6b4a2e'),
  BONE = pal('#d8d2e6'), ST = pal('#aab3c4'), BATV = pal('#5c4bb0'), BATWV = pal('#7d5fd8'), BATBV = pal('#8a78cc'),
  HIDEV = pal('#7a8a62'), MOSS = pal('#5c9a3a'), MOSSD = pal('#3f7a2a'), TUSK = pal('#efe4d0'), CAP = pal('#d8703a'),
  // world costumes for the returning fodder (docs/WORLDS.md §2): W2 bog / marsh, W3 wood / broom / owl, W4 crypt / keep / siege, W5 drowned / tide / sodden / bog turtle
  GHBOG = pal('#6f9a5e'), GHWOOD = pal('#9a8448'), GHCRYPT = pal('#9a98aa'), GHDROWN = pal('#4f929a'), MUD = pal('#5a3f2a'), REED = pal('#7a9a3a'), KELP = pal('#2f6b3a'), BARK = pal('#6e4f2e'), LEAF2 = pal('#7fae3a'),
  WEB = '#e8e4f0', STONE = pal('#8c8a96'), IMPMARSH = pal('#8aa04a'), IMPBROOM = pal('#a05ad0'), IMPTIDE = pal('#3aa0a8'), IMPKEEP = pal('#c46a4a'), IRON = pal('#8a8f9c'), HAT = pal('#3a2a4a'),
  BATSWIFT = pal('#9a4ab8'), BATOWL = pal('#b07a3a'), OWLF = pal('#e8d4a8'), SHELL = pal('#3f7a62'), SHELLD = pal('#2c5a48'), WRAPWET = pal('#a9b8a0'), STAR = pal('#e88a5a');

// ---------- costume helpers ----------
/** Wet sheen: extra soft highlights and a couple of drips on a clip shape. */
function wet(g, clip, b, drips = []){ g.save(); clip(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, b.x - b.r * .3, b.y - b.r * .2, b.r * .32, b.r * .1, -.5); g.fill(); ell(g, b.x + b.r * .25, b.y + b.r * .3, b.r * .18, b.r * .06, -.4); g.fill(); g.restore();
  for (const [x, y, l] of drips){ S.tube(g, SO([[x, y], [x + 1, y + l]]), pal('#9fd8e8'), 2.2); S.dot(g, E(x + 1, y + l + 1.5, 1.8, 2.2), '#c8f0ff', .9); } }
/** Kelp fronds hanging from a point. */
function kelp(g, x, y, n = 3, len = 22){ const R = rng(x * 3 + y | 0); for (let i = 0; i < n; i++){ const dx = (i - (n - 1) / 2) * 7 + (R() - .5) * 4, L = len * (.7 + R() * .6); S.tube(g, SO([[x + dx, y], [x + dx + (R() - .5) * 10, y + L * .5], [x + dx + (R() - .5) * 12, y + L]]), KELP, 4.5); } }
/** A few mud splats. */
function mud(g, clip, spots){ g.save(); clip(g); g.clip(); for (const [x, y, r] of spots) S.part(g, E(x, y, r, r * .7), MUD, { x, y, r }, { flat:true, noEdge:true }); g.restore(); }
/** Reeds or twigs stuck on. */
function sprigs(g, x, y, col, n = 3, up = -14){ for (let i = 0; i < n; i++){ const dx = (i - (n - 1) / 2) * 5; S.tube(g, SO([[x + dx, y], [x + dx * 1.6, y + up]]), col, 2); S.part(g, E(x + dx * 1.7, y + up - 2, 2.2, 3.6, dx * .04), col, { x:x + dx * 1.7, y:y + up - 2, r:3 }, { flat:true }); } }
/** Leaf sprig. */
function leaves(g, x, y, n = 3){ for (let i = 0; i < n; i++){ const a = -1.2 + i * .9, lx = x + Math.cos(a) * 9, ly = y + Math.sin(a) * 7 - 4; S.part(g, E(lx, ly, 5, 2.6, a), LEAF2, { x:lx, y:ly, r:5 }, { flat:true }); S.ln(g, [[x, y], [lx, ly]], LEAF2, .9, .6); } }
/** Cobweb strands between two points. */
function web(g, x1, y1, x2, y2){ g.strokeStyle = 'rgba(232,228,240,.55)'; g.lineWidth = .8; for (let i = 0; i < 4; i++){ const t = i / 3; g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + 4 + i * 2, x2 + (x2 - x1) * t * .1, y2 + (y2 - y1) * t * .1); g.stroke(); } for (let i = 1; i < 4; i++){ const t = i / 4; g.beginPath(); g.moveTo(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t); g.lineTo(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t + 6); g.stroke(); } }
/** A small starfish. */
function starfish(g, x, y, r = 5){ g.save(); g.translate(x, y); S.part(g, g2 => { g2.beginPath(); for (let i = 0; i < 10; i++){ const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r; g2.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g2.closePath(); }, STAR, { x:0, y:0, r }, { flat:true, mat:'skin' }); g.restore(); }

// ---------- pumpkin ----------
/** cols: a palette for the whole pumpkin, or an array of five rib palettes (rainbow). */
export function pumpkin(g, cols, lit, R = 40){
  const ribs = [[-.66, .36, .72], [.62, .4, .74], [-.34, .46, .8], [.3, .48, .82], [-.02, .5, .84]];
  const rainbow = Array.isArray(cols), c = rainbow ? cols[4] : cols;
  if (lit){ const gl = g.createRadialGradient(0, 0, R * .5, 0, 0, R * 1.6); gl.addColorStop(0, 'rgba(255,190,60,.45)'); gl.addColorStop(1, 'rgba(255,190,60,0)'); g.fillStyle = gl; g.fillRect(-R * 1.7, -R * 1.7, R * 3.4, R * 3.4); }
  S.shadow(g, 0, R * .82, R * 1.1, R * .22);
  g.save(); g.rotate(-.05);
  const union = g2 => { g2.beginPath(); for (const [ox, rw, rh] of ribs) g2.ellipse(ox * R * .95, R * .04, rw * R * 1.12, R * rh, 0, 0, TAU); };
  ribs.forEach(([ox, rw, rh], i) => { const rc = rainbow ? cols[i] : c, col = lit ? { ...rc, base:mix(rc.base, rc.light, .3) } : rc, cx = ox * R * .95;
    S.part(g, E(cx, R * .04, rw * R * 1.12, R * rh), col, { x:cx, y:0, r:R * .8 }, { flat:Math.abs(ox) > 0.4, mat:'pumpkin', hx:cx - R * .12, hy:-R * .5 }); });
  S.overlay(g, union, c, { x:0, y:0, r:R * 1.1 });
  g.save(); union(g); g.clip(); for (const x of [-.5, -.18, .14, .46]){ const px = x * R * .95 * 1.02, s = Math.sign(x); g.beginPath(); g.moveTo(px * .9, -R * .66); g.quadraticCurveTo(px * 1.35 + s * R * .05, 0, px * .9, R * .72); g.strokeStyle = rgba(c.deep, .38); g.lineWidth = R * .07; g.lineCap = 'round'; g.stroke(); g.save(); g.translate(-s * R * .045, 0); g.beginPath(); g.moveTo(px * .9, -R * .62); g.quadraticCurveTo(px * 1.35 + s * R * .05, 0, px * .9, R * .7); g.strokeStyle = rgba(c.rim, .35); g.lineWidth = R * .03; g.stroke(); g.restore(); } g.restore();
  const stem = SM([[-R * .12, -R * .7], [-R * .16, -R * .9], [-R * .02, -R * 1.1], [R * .16, -R * 1.2], [R * .3, -R * 1.14], [R * .3, -R * 1.02], [R * .16, -R * 1.0], [R * .12, -R * .86], [R * .14, -R * .7]], .8);
  S.part(g, stem, STEM, { x:R * .05, y:-R * .95, r:R * .3 }, { flat:true, mat:'wood' });
  S.contact(g, union, R * .02, -R * .7, R * .3, R * .1, .5);
  S.stroke(g, SO([[R * .3, -R * 1.1], [R * .5, -R * 1.2], [R * .6, -R * 1.05], [R * .5, -R * .95], [R * .42, -R * 1.02]]), LEAF, 1.6, .8);
  const leaf = SM([[-R * .16, -R * .86], [-R * .32, -R * 1.02], [-R * .52, -R * 1.0], [-R * .58, -R * .86], [-R * .42, -R * .78]], .8); S.part(g, leaf, LEAF, { x:-R * .38, y:-R * .9, r:R * .22 }, { flat:true });
  S.ln(g, [[-R * .18, -R * .86], [-R * .5, -R * .92]], LEAF, .8, .6);
  g.restore();
  if (rainbow){ g.fillStyle = 'rgba(255,255,255,.75)'; for (const [sx, sy, s] of [[-.45, -.3, .09], [.4, .25, .07], [.1, -.45, .06]]){ ell(g, sx * R, sy * R, s * R, s * R * .35); g.fill(); ell(g, sx * R, sy * R, s * R * .35, s * R); g.fill(); } }
  const ey = -R * .1, ex = R * .33;
  if (lit){
    g.save(); g.shadowColor = '#ffb020'; g.shadowBlur = 14;
    const glow = g.createLinearGradient(0, -R * .4, 0, R * .4); glow.addColorStop(0, '#fff6c0'); glow.addColorStop(1, '#ff9a1a');
    for (const x of [-ex, ex]){ PL([[x - R * .17, ey + R * .1], [x + R * .17, ey + R * .1], [x, ey - R * .18]])(g); g.fillStyle = glow; g.fill(); }
    g.beginPath(); g.moveTo(-R * .5, R * .24); g.quadraticCurveTo(0, R * .74, R * .5, R * .24); g.lineTo(R * .34, R * .32); g.lineTo(R * .22, R * .22); g.lineTo(R * .1, R * .38); g.lineTo(-R * .04, R * .24); g.lineTo(-R * .18, R * .38); g.lineTo(-R * .3, R * .24); g.closePath(); g.fillStyle = glow; g.fill();
    g.restore(); return;
  }
  const s = R / 40;
  S.eye(g, -ex, ey, 9 * s, 9.5 * s, { lx:.2, iris:mix(c.dark, '#7a5a2a', .5) }); S.eye(g, ex, ey, 9 * s, 9.5 * s, { lx:.2, iris:mix(c.dark, '#7a5a2a', .5) });
  S.blush(g, 0, ey + 10 * s, s);
  S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(-R * .18, R * .24); g2.quadraticCurveTo(0, R * .38, R * .18, R * .24); }, c, 2.4 * s);
}

// ---------- bat ----------
export function bat(g, P = {}){
  const V = P.variant, BAT = V === 'swiftBat' ? BATSWIFT : V === 'owlBat' ? BATOWL : BATV, BATW = V === 'swiftBat' ? pal('#c060d8') : V === 'owlBat' ? pal('#c8945a') : BATWV, BATB = V === 'owlBat' ? OWLF : BATBV;
  const f = P.walk == null ? .3 : Math.sin(P.walk * TAU), ch = P.chew, bite = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  S.shadow(g, 0, 44, 20, 4);
  g.save(); g.translate(0, ch == null ? -f * 3 : Math.sin(ch * TAU) * 2);
  const wingPts = (s, lift) => [[s * 8, -4], [s * 22, -24 - lift], [s * 40, -34 - lift], [s * 60, -30 - lift], [s * 56, -18 - lift, 1], [s * 62, -6 - lift * .5, 1], [s * 52, -4, 1], [s * 54, 10, 1], [s * 42, 6, 1], [s * 40, 18, 1], [s * 28, 12, 1], [s * 22, 20, 1], [s * 12, 12]];
  for (const s of [-1, 1]){ const lift = f * 12 - 2; const w = SM(wingPts(s, lift), .7); S.part(g, w, BATW, { x:s * 36, y:-8 - lift, r:30 }, { mat:'skin', flat:true, hx:s * 30, hy:-22 - lift });
    S.crease(g, SO([[s * 10, -2], [s * 30, -20 - lift], [s * 56, -18 - lift]]), BATW, 1.8, .45); S.crease(g, SO([[s * 10, 2], [s * 30, -8 - lift * .6], [s * 52, -4]]), BATW, 1.6, .4); S.crease(g, SO([[s * 10, 6], [s * 26, 2], [s * 40, 18]]), BATW, 1.4, .35);
    g.save(); w(g); g.clip(); w(g); g.strokeStyle = 'rgba(232,168,232,.5)'; g.lineWidth = 3; g.stroke(); g.restore(); }
  const body = SM([[-13, 10], [-15, 24], [-8, 34], [8, 34], [15, 24], [13, 10]]); S.part(g, body, BAT, { x:0, y:22, r:14 }, { mat:'skin' });
  S.part(g, E(0, 24, 8, 7), BATB, { x:0, y:24, r:8 }, { noEdge:true, flat:true });
  for (const s of [-1, 1]){ S.tube(g, SO([[s * 6, 32], [s * 9, 40]]), BAT, 4); S.claw(g, s * 10, 42, Math.PI / 2, 4, '#d8c8f0'); S.claw(g, s * 8, 43, Math.PI / 2 + s * .5, 3.5, '#d8c8f0'); }
  for (const s of [-1, 1]){ S.part(g, SM([[s * 8, -20], [s * 14, -36], [s * 22, -46], [s * 26, -30], [s * 24, -16]], .7), BAT, { x:s * 17, y:-30, r:14 }, { flat:true, mat:'skin' }); S.dot(g, SM([[s * 12, -22], [s * 16, -33], [s * 21, -40], [s * 22, -28], [s * 21, -19]], .7), '#e896c8', .75); }
  const head = SM([[-26, -14], [-28, 2], [-20, 14], [0, 18], [20, 14], [28, 2], [26, -14], [14, -26], [-14, -26]]); S.part(g, head, BAT, { x:0, y:-4, r:27 }, { mat:'skin' });
  S.contact(g, body, 0, 12, 12, 5, .5);
  if (V === 'owlBat'){ for (const s of [-1, 1]) S.part(g, E(s * 10, -6, 12, 12.5), OWLF, { x:s * 10, y:-6, r:12 }, { flat:true, noEdge:true }); for (const s of [-1, 1]) S.part(g, SM([[s * 6, -22], [s * 12, -40], [s * 20, -30], [s * 18, -20]], .7), BATOWL, { x:s * 13, y:-28, r:9 }, { flat:true, mat:'skin' }); }
  if (V === 'swiftBat'){ for (const s of [-1, 1]) S.stroke(g, SO([[s * 30, -2], [s * 46, -4], [s * 58, -2]]), { deep:'#e8b8ff' }, 1.4, .5); }
  S.eye(g, -10, -6, 9.5, 10, { lx:.15, ly:.1, pr:V === 'owlBat' ? .5 : .36, iris:V === 'owlBat' ? '#e0a020' : undefined }); S.eye(g, 10, -6, 9.5, 10, { lx:.15, ly:.1, pr:V === 'owlBat' ? .5 : .36, iris:V === 'owlBat' ? '#e0a020' : undefined });
  if (V === 'owlBat') S.part(g, PL([[-3, 2], [3, 2], [0, 9]]), pal('#e8a040'), { x:0, y:5, r:4 }, { flat:true });
  else S.dot(g, E(0, 6, 2.2, 1.6), '#2a1a30', .9);
  if (bite > .3){ S.dot(g, SM([[-7, 9], [0, 10 + bite * 6], [7, 9], [0, 7]], .8), '#3a1420'); }
  S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(-7, 9); g2.quadraticCurveTo(0, 14, 7, 9); }, BAT, 1.6);
  S.dot(g, PL([[-6, 9], [-2.5, 9], [-4.2, 15]]), '#fff'); S.dot(g, PL([[2.5, 9], [6, 9], [4.2, 15]]), '#fff');
  g.restore();
}

// ---------- imp ----------
export function imp(g, P = {}){
  const V = P.variant, c = V === 'marshImp' ? IMPMARSH : V === 'broomImp' ? IMPBROOM : V === 'tideImp' ? IMPTIDE : V === 'keepImp' ? IMPKEEP : IMP, b = V === 'tideImp' ? pal('#a8e8e0') : IMPB, h = V === 'keepImp' ? IRON : HORN, w = P.walk, ch = P.chew;
  const hop = w == null ? 0 : Math.max(0, Math.sin(w * TAU)), tuck = hop, bob = ch == null ? 0 : Math.sin(ch * TAU) * 3, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  S.shadow(g, 0, 48, 30 - hop * 8, 6);
  const tailP = SO([[6, 26], [26, 36 - hop * 10], [46, 24 - hop * 6], [44, 4 - hop * 10]]); S.tube(g, tailP, c, 3.5); S.part(g, PL([[38, 8 - hop * 10], [50, 2 - hop * 10], [48, 14 - hop * 10]]), c, { x:45, y:8, r:7 }, { flat:true });
  for (const s of [-1, 1]){ S.tube(g, SO([[s * 8, 26], [s * (16 + tuck * 4), 36 - tuck * 6], [s * 12, 46 - tuck * 4]]), c, 7); const fy = 47 - tuck * 4, f = E(s * 14, fy, 8, 4.5); S.part(g, f, c, { x:s * 14, y:fy, r:8 }, { flat:true, mat:'skin' }); for (const d of [-4, 0, 4]) S.claw(g, s * 14 + d, fy + 3, Math.PI / 2, 4); }
  g.save(); g.translate(0, bob);
  const body = SM([[-17, 2], [-20, 20], [-10, 34], [10, 34], [20, 20], [17, 2], [0, -6]]); S.part(g, body, c, { x:0, y:16, r:20 }, { mat:'skin' });
  const belly = SM([[-9, 12], [-11, 24], [0, 31], [11, 24], [9, 12], [0, 9]]); S.part(g, belly, b, { x:0, y:20, r:11 }, { noEdge:true, flat:true }); S.contact(g, belly, 0, 10, 10, 4, .3);
  // arms hang while it walks and fly up on the hop (owner, 2026-09-26)
  for (const s of [-1, 1]){ const k = hop, ax = s * (24 + 6 * k), ay = 20 - 28 * k, bx = s * (26 + 12 * k), by = 30 - 42 * k; S.tube(g, SO([[s * 16, 8], [ax, ay], [bx, by]]), c, 6); S.hand(g, s * (27 + 13 * k), 34 - 46 * k, c, Math.PI / 2 - k * Math.PI + s * .5 * k, 3, 5); }
  if (V === 'broomImp'){ g.save(); g.translate(30, 26); g.rotate(-.5); S.tube(g, SO([[0, 30], [0, -34]]), WOOD, 3); S.part(g, SM([[-7, 30], [7, 30], [10, 46], [-10, 46]], .5), pal('#c9a45c'), { x:0, y:38, r:9 }, { flat:true, mat:'wood' }); for (let i = -8; i <= 8; i += 3) S.ln(g, [[i * .8, 32], [i, 46]], pal('#c9a45c'), .8, .5); g.restore(); }
  const head = SM([[-24, -18], [-27, -4], [-18, 10], [0, 14], [18, 10], [27, -4], [24, -18], [12, -32], [-12, -32]]);
  for (const s of [-1, 1]) S.part(g, SM([[s * 22, -14], [s * 40, -28], [s * 44, -16], [s * 34, -2]], .7), c, { x:s * 32, y:-16, r:12 }, { flat:true, mat:'skin' });
  for (const s of [-1, 1]) S.part(g, SM([[s * 10, -28], [s * 14, -46], [s * 8, -60], [s * 22, -48], [s * 22, -28]], .8), h, { x:s * 15, y:-42, r:14 }, { flat:true, mat:'horn' });
  S.part(g, head, c, { x:0, y:-10, r:27 }, { mat:'skin' }); S.contact(g, body, 0, 4, 14, 5, .5);
  if (V === 'tideImp'){ wet(g, head, { x:0, y:-10, r:27 }, [[-20, 4, 6], [22, -2, 5]]); for (const s of [-1, 1]) S.part(g, SM([[s * 22, -14], [s * 42, -30], [s * 46, -14], [s * 34, -2]], .7), pal('#6ad0d8'), { x:s * 32, y:-16, r:12 }, { flat:true, mat:'gel' }); }
  if (V === 'marshImp'){ mud(g, body, [[-8, 28, 5], [10, 30, 4], [14, 18, 3]]); sprigs(g, 10, -30, REED, 3, -16); }
  if (V === 'keepImp'){ S.part(g, SM([[-22, -26], [-18, -44], [0, -50], [18, -44], [22, -26], [0, -22]], .8), IRON, { x:0, y:-36, r:22 }, { mat:'metal' }); for (const x of [-14, 0, 14]) S.rivet(g, x, -30, 1.8, IRON); S.part(g, SM([[14, 2], [30, -6], [34, 10], [20, 14]], .7), IRON, { x:24, y:4, r:10 }, { flat:true, mat:'metal' }); }
  if (V === 'broomImp'){ S.part(g, SM([[-24, -28], [24, -28], [26, -24], [-26, -24]], .5), HAT, { x:0, y:-26, r:26 }, { flat:true, mat:'cloth' }); S.part(g, SM([[-14, -28], [-6, -60], [8, -74], [4, -50], [14, -28]], .8), HAT, { x:0, y:-46, r:16 }, { mat:'cloth' }); S.ln(g, [[-14, -32], [14, -32]], pal('#c09a3a'), 2.5, .9); }
  S.eye(g, -10, -12, 8.5, 9.5, { lx:.25, iris:V === 'tideImp' ? '#2a8aa0' : '#c04a2a' }); S.eye(g, 10, -12, 8.5, 9.5, { lx:.25, iris:V === 'tideImp' ? '#2a8aa0' : '#c04a2a' });
  S.dot(g, SM([[-13, 2], [-6, 8 + jaw * 3], [0, 10 + jaw * 5], [6, 8 + jaw * 3], [13, 2], [0, 4]], .9), '#3a1420'); S.dot(g, E(0, 8 + jaw * 3, 6, 3), '#c8384a', .8);
  S.dot(g, PL([[-10, 3], [-4, 3], [-7, 10]]), '#fff'); S.dot(g, PL([[4, 3], [10, 3], [7, 10]]), '#fff');
  S.blush(g, 0, -2, .9);
  g.restore();
}

// ---------- ghoul ----------
export function ghoul(g, P = {}){
  const V = P.variant, c = V === 'bogGhoul' ? GHBOG : V === 'woodGhoul' ? GHWOOD : V === 'cryptGhoul' ? GHCRYPT : V === 'drownedGhoul' ? GHDROWN : GH, d = pal(c.dark), t = V === 'cryptGhoul' ? pal('#5a5468') : V === 'drownedGhoul' ? pal('#3f5f6a') : V === 'woodGhoul' ? pal('#6a5a3a') : SHIRT, p = V === 'drownedGhoul' ? pal('#2f4a54') : PANTS, w = P.walk, ch = P.chew;
  const L = s => { if (w == null) return [0, 0]; const ph = w * TAU + (s < 0 ? 0 : Math.PI); return [Math.cos(ph) * 5, -Math.max(0, Math.sin(ph)) * 7]; }, [lx, ly] = L(-1), [rx, ry] = L(1);
  const bob = w != null ? -Math.abs(Math.sin(w * TAU)) * 3 : ch != null ? Math.sin(ch * TAU) * 3 : 0, lean = w == null ? 0 : Math.sin(w * TAU) * .06, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU)) * 5;
  S.shadow(g, 2, 50, 32, 6);
  S.tube(g, SO([[-10, 26], [-16 + lx * .5, 38 + ly * .5], [-14 + lx, 48 + ly]]), c, 7); S.tube(g, SO([[10, 26], [14 + rx * .5, 36 + ry * .5], [18 + rx, 46 + ry]]), c, 7);
  S.part(g, SM([[-20, 30], [-22, 42], [-10, 42], [-8, 32]], .6), p, { x:-15, y:36, r:8 }, { flat:true, mat:'cloth' }); S.part(g, SM([[8, 28], [10, 40], [22, 40], [20, 30]], .6), p, { x:15, y:34, r:8 }, { flat:true, mat:'cloth' });
  for (const [x, y] of [[-14 + lx, 50 + ly], [18 + rx, 48 + ry]]){ S.part(g, E(x, y, 9, 4.5), d, { x, y, r:8 }, { flat:true, mat:'skin' }); for (const dd of [-4, 0, 4]) S.claw(g, x + dd, y + 3, Math.PI / 2, 3.5); }
  g.save(); g.translate(0, 20 + bob); g.rotate(lean); g.translate(0, -20);
  const torso = SM([[-26, 2], [-28, 20], [-18, 34], [0, 36], [18, 34], [28, 20], [26, 2], [16, -22], [-2, -30], [-20, -22]]); S.part(g, torso, t, { x:0, y:6, r:30 }, { mat:'cloth' });
  S.crease(g, SO([[-14, 6], [-12, 20], [-15, 32]]), t, 1.6, .45); S.crease(g, SO([[10, 4], [14, 18], [11, 32]]), t, 1.6, .45);
  S.dot(g, SM([[-8, 24], [-2, 20], [4, 26], [-1, 30]], .6), d.base);
  for (const s of [-1, 1]){ const sw = w != null ? Math.sin(w * TAU + (s < 0 ? Math.PI : 0)) * .25 : ch != null ? Math.sin(ch * TAU) * .12 : 0; g.save(); g.translate(s * 24, 3); g.rotate(sw * s); g.translate(-s * 24, -3);
    S.tube(g, SO([[s * 24, 3], [s * 38, 12], [s * 46, 26]]), c, 8); S.hand(g, s * 48, 30, c, Math.PI * (s < 0 ? .6 : .4), 3, 6); g.restore(); }
  const head = SM([[-20, -20], [-22, -6], [-14, 6], [0, 9], [14, 6], [22, -6], [20, -20], [10, -30], [-10, -30]]); S.part(g, head, c, { x:0, y:-12, r:22 }, { mat:V === 'woodGhoul' ? 'wood' : V === 'cryptGhoul' ? 'stone' : 'skin' });
  S.contact(g, torso, 0, 6, 18, 6, .5);
  if (V === 'bogGhoul'){ mud(g, torso, [[-14, 30, 6], [8, 34, 5], [18, 22, 4]]); mud(g, head, [[14, 0, 4]]); sprigs(g, -8, -30, REED, 3, -14); }
  if (V === 'woodGhoul'){ leaves(g, 8, -30, 3); S.part(g, SM([[-22, -8], [-30, -20], [-26, -24], [-18, -14]], .6), BARK, { x:-24, y:-16, r:6 }, { flat:true, mat:'wood' }); S.part(g, SM([[12, -30], [16, -40], [20, -38], [16, -28]], .6), BARK, { x:16, y:-34, r:5 }, { flat:true, mat:'wood' }); }
  if (V === 'cryptGhoul'){ web(g, -24, 4, -44, 24); web(g, 20, -20, 26, 2); S.dot(g, E(-6, -28, 2, 2), '#fff', .5); S.part(g, SM([[-8, -30], [-2, -40], [6, -32], [10, -28]], .6), STONE, { x:0, y:-33, r:6 }, { flat:true, mat:'stone' }); }
  if (V === 'drownedGhoul'){ wet(g, head, { x:0, y:-12, r:22 }, [[-46, 34, 6], [40, 30, 5], [20, 8, 4]]); kelp(g, 2, -30, 4, 26); starfish(g, 22, 0, 5); S.dot(g, E(-16, -2, 3, 2.2), '#b8e8f0', .5); }
  for (const [x, y, r] of [[16, -24, 2.6], [-18, -2, 2.2]]) S.part(g, E(x, y, r, r), c, { x, y, r }, { flat:true, noEdge:true });
  S.dot(g, SM([[-6, -30], [-2, -38], [2, -32], [6, -38], [8, -30]], .5), d.dark);
  S.ln(g, [[-20, -12], [-8, -10]], c, 1.6); S.ln(g, [[-16, -15], [-15, -7]], c, 1.3); S.ln(g, [[-12, -15], [-11, -7]], c, 1.3);
  S.eye(g, -6, -14, 8, 8.5, { lx:.1, ly:.15, pr:.42, iris:'#4a6a2a' }); S.eye(g, 11, -10, 4.5, 4.5, { lx:.2, pr:.45, iris:'#4a6a2a' });
  const jaw2 = SM([[-9, 2 + jaw], [-8, 12 + jaw], [0, 15 + jaw], [8, 12 + jaw], [9, 2 + jaw]], .7); S.dot(g, SM([[-9, 0], [-6, 4 + jaw], [0, 6 + jaw], [6, 4 + jaw], [9, 0], [0, -2]], .7), '#2a1020'); S.part(g, jaw2, c, { x:0, y:8 + jaw, r:9 }, { flat:true, mat:'skin' });
  for (const x of [-5, 0, 5]) S.dot(g, PL([[x - 2, 2], [x + 2, 2], [x, 6]]), '#fff');
  S.dot(g, E(7, 14 + jaw, 2, 4), '#a0e0a0', .9);
  g.restore();
}

// ---------- Mossback (brute): a hulking knuckle-walker with a mossy back ----------
export function brute(g, P = {}){
  const V = P.variant, w = P.walk, ch = P.chew, HIDE = V === 'bogTurtle' ? pal('#5f8a78') : V === 'siegeBrute' ? pal('#8a7a66') : HIDEV, HIDED = pal(HIDE.dark);
  const sw = w == null ? 0 : Math.sin(w * TAU), bob = w != null ? -Math.abs(sw) * 2 : ch != null ? Math.sin(ch * TAU) * 2 : 0, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU)) * 6;
  S.shadow(g, 0, 52, 52, 8);
  // legs and flat feet
  for (const s of [-1, 1]){ const dx = w == null ? 0 : Math.cos(w * TAU + (s < 0 ? 0 : Math.PI)) * 3; S.tube(g, SO([[s * 20, 24], [s * 24 + dx, 44]]), HIDE, 12); const f = SM([[s * 12 + dx, 40], [s * 8 + dx, 50], [s * 24 + dx, 52], [s * 36 + dx, 48], [s * 32 + dx, 40]], .7); S.part(g, f, HIDED, { x:s * 22 + dx, y:46, r:12 }, { flat:true, mat:'stone' }); for (const dd of [-6, 0, 6]) S.claw(g, s * 22 + dx + dd, 52, Math.PI / 2, 4, '#e8e0c8'); }
  g.save(); g.translate(0, bob);
  // body
  const body = SM([[-46, -6], [-50, 20], [-34, 44], [0, 48], [34, 44], [50, 20], [46, -6], [24, -36], [0, -42], [-24, -36]]); S.part(g, body, HIDE, { x:0, y:4, r:48 }, { mat:'stone', hx:-24, hy:-24 });
  S.dot(g, SM([[-18, 14], [-20, 36], [0, 42], [20, 36], [18, 14], [0, 8]], .9), HIDED.light, .35);
  // moss on the back and shoulders
  const moss = SM([[-44, -8], [-40, -30], [-22, -44], [0, -50], [22, -44], [40, -30], [44, -8], [30, -14], [12, -24], [-12, -24], [-30, -14]], .8);
  if (V === 'bogTurtle'){ S.part(g, moss, SHELL, { x:0, y:-24, r:44 }, { mat:'stone', hx:-20, hy:-38 }); g.save(); moss(g); g.clip(); for (const [x, y] of [[-20, -30], [8, -36], [30, -24], [-4, -14], [22, -8], [-30, -12]]) S.part(g, E(x, y, 9, 7), SHELLD, { x, y, r:9 }, { flat:true, noEdge:true, mat:'stone' }); g.restore(); S.stroke(g, moss, SHELLD, 2, .8); for (const [x, y, r] of [[-38, -10, 5], [36, -14, 4]]) S.part(g, E(x, y, r, r * .7), MOSSD, { x, y, r }, { flat:true, mat:'moss', noEdge:true }); }
  else if (V === 'siegeBrute'){ S.part(g, moss, IRON, { x:0, y:-24, r:44 }, { mat:'metal', hx:-20, hy:-38 }); S.ln(g, [[-40, -20], [40, -20]], IRON, 1.6, .7); for (const x of [-30, -15, 0, 15, 30]) S.rivet(g, x, -20, 2.2, IRON); for (const [x, y] of [[-24, -40], [0, -48], [24, -40]]) S.part(g, PL([[x - 5, y + 4], [x, y - 12], [x + 5, y + 4]]), IRON, { x, y:y - 2, r:6 }, { flat:true, mat:'metal' }); S.tube(g, SO([[-44, 6], [-30, 14], [-14, 10]]), pal('#5a5a66'), 3); }
  else { S.part(g, moss, MOSS, { x:0, y:-24, r:44 }, { mat:'moss', hx:-20, hy:-38 });
  for (const [x, y, r] of [[-36, -4, 7], [38, -6, 6], [-8, -46, 5], [16, -42, 6]]) S.part(g, E(x, y, r, r * .7), MOSSD, { x, y, r }, { flat:true, mat:'moss', noEdge:true });
  S.part(g, SM([[22, -50], [26, -58], [34, -56], [34, -50]], .7), CAP, { x:28, y:-54, r:6 }, { flat:true }); S.tube(g, SO([[28, -50], [28, -44]]), TUSK, 2.5); }
  // arms: knuckle-walking, swinging opposite to the legs
  for (const s of [-1, 1]){ const a = w == null ? 0 : Math.sin(w * TAU + (s < 0 ? Math.PI : 0)) * .18; g.save(); g.translate(s * 40, -10); g.rotate(a * s); g.translate(-s * 40, 10);
    S.tube(g, SO([[s * 40, -10], [s * 54, 14], [s * 56, 36]]), HIDE, 14); const fist = E(s * 56, 40, 11, 9); S.part(g, fist, HIDE, { x:s * 56, y:40, r:11 }, { flat:true, mat:'stone' }); for (const dd of [-6, -2, 2, 6]) S.ln(g, [[s * 56 + dd, 34], [s * 56 + dd, 38]], HIDE, 1.2, .5); g.restore(); }
  // small low head with a heavy brow, tusks and tiny eyes
  const head = SM([[-18, -22], [-20, -6], [-12, 8], [0, 10], [12, 8], [20, -6], [18, -22], [8, -30], [-8, -30]]); S.part(g, head, HIDE, { x:0, y:-10, r:20 }, { mat:'stone' });
  S.contact(g, body, 0, 4, 16, 6, .5);
  if (V === 'siegeBrute'){ S.part(g, SM([[-20, -18], [-18, -34], [0, -40], [18, -34], [20, -18], [0, -14]], .8), IRON, { x:0, y:-28, r:20 }, { mat:'metal' }); S.part(g, PL([[-3, -40], [3, -40], [0, -54]]), IRON, { x:0, y:-46, r:6 }, { flat:true, mat:'metal' }); }
  if (V === 'bogTurtle'){ wet(g, head, { x:0, y:-10, r:20 }, [[-40, 20, 5], [44, 24, 5]]); kelp(g, -30, -6, 2, 16); }
  S.ln(g, [[-14, -18], [-4, -14]], HIDED, 3, .8); S.ln(g, [[14, -18], [4, -14]], HIDED, 3, .8);
  S.eye(g, -8, -10, 4.5, 4, { lx:.2, pr:.55, lid:.4, tilt:-.4, lidCol:HIDE.base, iris:'#c05a2a' }); S.eye(g, 8, -10, 4.5, 4, { lx:.2, pr:.55, lid:.4, tilt:.4, lidCol:HIDE.base, iris:'#c05a2a' });
  for (const s of [-1, 1]) S.dot(g, E(s * 3, -3, 1.6, 1.2), '#2a2a24', .8);
  S.dot(g, SM([[-12, 2], [-10, 8 + jaw], [0, 10 + jaw], [10, 8 + jaw], [12, 2]], .7), '#1b140e');
  for (const s of [-1, 1]) S.part(g, PL([[s * 10, 4 + jaw], [s * 6, 4 + jaw], [s * 9, -6]]), TUSK, { x:s * 8, y:0, r:5 }, { flat:true, mat:'bone' });
  g.restore();
}

// ---------- mummy ----------
function mummyStrips(g, t, c = WRAP){   // wrappers unwinding to the ground as the mummy collapses
  const R = rng(77), strips = [];
  for (let i = 0; i < 9; i++){ const ang = (i / 9) * Math.PI + (R() - .5) * .4, len = 26 + R() * 30, side = i % 2 ? 1 : -1; strips.push({ ang, len, side, curl:R() * 12 - 6 }); }
  for (const st of strips){ const ex = Math.cos(st.ang) * st.len * t * st.side, ey = 46 + Math.sin(st.ang) * 8 * t, sx = Math.cos(st.ang) * 8 * st.side, sy = 40 - (1 - t) * 24;
    S.tube(g, SO([[sx, sy], [(sx + ex) / 2 + st.curl, (sy + ey) / 2 - 8 * t], [ex, ey], [ex + st.side * 6, ey - 4 * t]]), c, 4.5); }
  if (t > .55){ const a = (t - .55) / .45; g.save(); g.globalAlpha *= a; for (const [x, y, rx, ry] of [[-12, 44, 14, 7], [10, 46, 16, 8], [0, 40, 12, 6]]) S.part(g, E(x, y, rx, ry), c, { x, y, r:rx }, { flat:true, mat:'bandage' });
    S.glow(g, -3, 40, 4, '#ffa030'); S.dot(g, E(-3, 40, 2, 2.4), '#3b1d0c'); g.restore(); }
}
export function mummy(g, P = {}){
  const V = P.variant, c = P.charred ? CHAR : V === 'soddenMummy' ? WRAPWET : WRAP, t = P.collapse ?? 0, w = P.walk, ch = P.chew;
  if (t >= 1){ S.shadow(g, 0, 52, 30, 6); mummyStrips(g, 1, c); return; }
  S.shadow(g, 0, 52, 30, 6);
  if (t > 0){ mummyStrips(g, t, c); g.save(); g.translate(0, 50); g.scale(1 - t * .2, 1 - t * .92); g.translate(0, -50); g.globalAlpha *= Math.max(0, 1 - t * 1.1); }
  const bob = w != null ? -Math.abs(Math.sin(w * TAU)) * 2.5 : ch != null ? Math.sin(ch * TAU) * 2 : 0, sway = w != null ? Math.sin(w * TAU) * .12 : ch != null ? Math.sin(ch * TAU) * .18 : 0;
  for (const s of [-1, 1]){ const ph = w == null ? null : w * TAU + (s < 0 ? 0 : Math.PI), dy = ph == null ? 0 : -Math.max(0, Math.sin(ph)) * 6, dx = ph == null ? 0 : Math.cos(ph) * 4;
    g.save(); g.translate(dx, dy);
    const leg = SM([[s * 6, 20], [s * 18, 20], [s * 19, 48], [s * 7, 48]], .5); S.part(g, leg, c, { x:s * 12, y:34, r:12 }, { flat:true, mat:'bandage' }); S.wrap(g, leg, c, [[s * 2, 24, s * 24, 28], [s * 2, 34, s * 24, 38], [s * 2, 44, s * 24, 47]], 6); S.part(g, E(s * 13, 50, 9, 4.5), c, { x:s * 13, y:50, r:8 }, { flat:true, mat:'bandage' }); g.restore(); }
  g.save(); g.translate(0, bob);
  const torso = SM([[-22, -10], [-25, 8], [-18, 26], [0, 30], [18, 26], [25, 8], [22, -10], [0, -14]]); S.part(g, torso, c, { x:0, y:8, r:26 }, { mat:'bandage' });
  S.dot(g, E(6, 14, 8, 5), '#3a2a40', .9);
  S.wrap(g, torso, c, [[-30, -6, 30, -2], [-30, 4, 30, 10], [-30, 16, 30, 20], [-30, 26, 30, 30], [-26, -14, 26, -10]], 7);
  for (const s of [-1, 1]){ g.save(); g.translate(s * 20, -2); g.rotate(sway * s); g.translate(-s * 20, 2);
    const arm = SM([[s * 20, -8], [s * 60, -4], [s * 60, 6], [s * 20, 4]], .4); S.part(g, arm, c, { x:s * 40, y:-1, r:20 }, { flat:true, mat:'bandage' }); S.wrap(g, arm, c, [[s * 26, -10, s * 30, 8], [s * 36, -10, s * 40, 8], [s * 46, -10, s * 50, 8], [s * 56, -10, s * 60, 8]], 6);
    S.part(g, SM([[s * 58, -8], [s * 70, -7], [s * 72, 4], [s * 60, 6]], .6), c, { x:s * 65, y:-1, r:8 }, { flat:true, mat:'bandage' }); S.contact(g, torso, s * 20, -2, 8, 8, .35);
    if (s < 0){ const fl = w == null ? 0 : Math.sin(w * TAU) * 6; S.stroke(g, SO([[-70, 4], [-80 + fl, 16], [-76, 30], [-84 + fl, 40]]), c, 4, .9); S.stroke(g, SO([[-70, 4], [-80 + fl, 16], [-76, 30], [-84 + fl, 40]]), { deep:c.base }, 2.2, 1); S.thread(g, -84, 40, -1, c); }
    g.restore(); }
  g.save(); g.rotate(sway * .4);
  const head = SM([[-19, -40], [-22, -26], [-16, -12], [0, -8], [16, -12], [22, -26], [19, -40], [8, -50], [-8, -50]]);
  S.part(g, head, c, { x:0, y:-30, r:22 }, { mat:'bandage' }); S.contact(g, torso, 0, -10, 16, 6, .5);
  S.dot(g, SM([[-16, -34], [-4, -38], [8, -34], [6, -24], [-6, -22], [-16, -26]], .7), '#2a1a30');
  S.wrap(g, head, c, [[-26, -48, 26, -44], [-26, -16, 26, -20], [-26, -10, 26, -12], [8, -40, 26, -30]], 6);
  S.stroke(g, SO([[16, -46], [30, -52], [38, -44]]), c, 3.5, .9); S.stroke(g, SO([[16, -46], [30, -52], [38, -44]]), { deep:c.base }, 1.8, 1);
  const eye = P.charred ? '#ff6a1a' : V === 'soddenMummy' ? '#7ef0d8' : '#ffa030';
  S.glow(g, -4, -30, 5, eye); S.dot(g, E(-4, -30, 2.4, 3), '#3b1d0c'); S.dot(g, E(-5.2, -31.4, .9, .9), '#fff');
  if (V === 'soddenMummy'){ wet(g, head, { x:0, y:-30, r:22 }, [[-70, 10, 6], [66, 8, 5], [18, 32, 5]]); kelp(g, 6, -48, 3, 22); }
  g.restore(); g.restore();
  if (t > 0) g.restore();
}
/** Flames licking up a flaming mummy; f is the flicker phase 0..1. */
export function flames(g, f, low){
  const R = rng(13), n = 7;
  for (let i = 0; i < n; i++){ const bx = -34 + i * 11 + (R() - .5) * 6, by = low ? 42 : 30 - R() * 40, ph = f * TAU + R() * TAU, h = 12 + R() * 14 + Math.sin(ph) * 5, wv = Math.sin(ph * 1.7) * 3;
    const tongue = SM([[bx - 5, by], [bx - 4 + wv * .5, by - h * .5], [bx + wv, by - h], [bx + 4 + wv * .5, by - h * .5], [bx + 5, by]], .8);
    g.save(); g.shadowColor = '#ff8a2a'; g.shadowBlur = 8; const gr = g.createLinearGradient(0, by, 0, by - h); gr.addColorStop(0, 'rgba(255,90,30,.9)'); gr.addColorStop(.55, 'rgba(255,170,50,.95)'); gr.addColorStop(1, 'rgba(255,240,170,.9)'); tongue(g); g.fillStyle = gr; g.fill(); g.restore(); }
}
export function firemummy(g, P = {}){
  mummy(g, { ...P, charred:true });
  const t = P.collapse ?? 0;
  flames(g, P.flick ?? 0, t > .5);
}

// ---------- Gravekeeper ----------
function lantern(g, x, y, s = 1){
  g.save(); g.translate(x, y); g.scale(s, s);
  S.stroke(g, g2 => { g2.beginPath(); g2.arc(0, -20, 4, 0, TAU); }, LAN, 2); S.ln(g, [[0, -16], [0, -10]], LAN, 2);
  g.save(); g.shadowColor = '#ffb640'; g.shadowBlur = 22; S.part(g, RR(-12, -10, 24, 28, 5), LANG, { x:0, y:4, r:16 }, { flat:true }); g.restore();
  S.dot(g, E(0, 4, 5.5, 8), '#ffb640'); S.dot(g, E(0, 2, 2.2, 3.5), '#fff8d0');
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-9, -8, 3, 22); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-4, -8, 1.5, 22); S.ln(g, [[0, -10], [0, 18]], LAN, 1, .5); S.ln(g, [[-12, 4], [12, 4]], LAN, 1, .4);
  for (const yy of [-10, 18]) S.part(g, RR(-14, yy - 3, 28, 6, 2), LAN, { x:0, y:yy, r:14 }, { flat:true, mat:'metal' });
  g.restore();
}
export function gravekeeper(g, P = {}){
  const r = ROBE, rd = ROBED, w = WOOD, st = ST, k = BONE, cast = P.cast ?? 0, fade = P.fade ?? 0, stab = P.stab ?? 0, idle = P.idle;
  const R = rng(5);
  if (fade > 0){
    for (let i = 0; i < 10; i++){ const x = (R() - .5) * 80, y0 = -60 + R() * 120, rr = 4 + R() * 5; const y = y0 - fade * 60 - R() * 20, a = Math.max(0, (1 - fade) * .6) * (fade < .15 ? fade / .15 : 1); g.save(); g.globalAlpha *= a; g.shadowColor = '#8a6ad8'; g.shadowBlur = 8; S.dot(g, E(x + Math.sin(fade * 6 + i) * 6, y, rr * (1 + fade * 1.5), rr * (1 + fade * 1.5)), '#6a52a8'); g.restore(); }
    if (fade >= 1) return;
    g.save(); g.globalAlpha *= 1 - fade; g.translate(0, -fade * 20); g.scale(1, 1 - fade * .3); }
  S.shadow(g, 0, 66, 46, 8);
  const ang = .42 - stab * 1.05, push = stab * 8, breathe = idle == null ? 0 : Math.sin(idle * TAU);
  g.save(); g.translate(46, 4 + push); g.rotate(ang); S.tube(g, SO([[0, 62], [0, -40]]), w, 5); S.ln(g, [[-.8, 56], [-.8, -34]], { deep:w.light }, .8, .6);
  S.part(g, SM([[-11, 58], [11, 58], [11, 74], [0, 86], [-11, 74]], .5), st, { x:0, y:70, r:12 }, { flat:true, mat:'metal' }); S.part(g, RR(-6, -46, 12, 8, 3), w, { x:0, y:-42, r:6 }, { flat:true, mat:'wood' }); g.restore();
  g.save(); g.translate(0, 66); g.rotate(stab * .14); g.translate(0, -66 - stab * 4 + breathe * 1.5);
  if (stab > .45){ const q = (stab - .45) / .55; const bx = 46 + Math.sin(-ang) * 74, by = 4 + push + Math.cos(ang) * 74; for (let i = 0; i < 8; i++){ const a = -Math.PI * .95 + R() * Math.PI * .9, sp = 18 + R() * 34, x = bx + Math.cos(a) * sp * q, y = by + Math.sin(a) * sp * q + q * q * 30, rr = 3 + R() * 3.5; g.save(); g.globalAlpha *= 1 - q * .6; S.part(g, E(x, y, rr, rr * .8), LEATH, { x, y, r:rr }, { flat:true }); g.restore(); }
    g.save(); g.globalAlpha *= (1 - q) * .5; S.dot(g, E(bx, by + 6, 18 * q + 6, 5), '#3a2a1c'); g.restore(); S.stroke(g, SO([[bx - 30 * q, by + 8], [bx - 10, by + 4], [bx + 8, by + 9], [bx + 28 * q, by + 5]]), { deep:'#1a1010' }, 2, .7 * q); }
  for (const s of [-1, 1]) S.part(g, SM([[s * 8, 54], [s * 8, 66], [s * 24, 66], [s * 24, 60], [s * 20, 54]], .5), LEATH, { x:s * 16, y:60, r:9 }, { flat:true, mat:'leather' });
  const robe = SM([[12, -78], [-16, -70], [-38, -44], [-48, -8], [-50, 30], [-52, 58, 1], [-40, 50, 1], [-28, 64, 1], [-14, 52, 1], [2, 66, 1], [16, 52, 1], [30, 64, 1], [42, 50, 1], [50, 60, 1], [48, 26], [44, -10], [36, -44], [30, -66]], .85);
  S.part(g, robe, r, { x:0, y:0, r:64 }, { mat:'cloth', hx:-26, hy:-46 });
  S.crease(g, SO([[-30, -30], [-38, 10], [-34, 52]]), r, 2.6, .45); S.crease(g, SO([[28, -24], [36, 10], [32, 50]]), r, 2.6, .45); S.crease(g, SO([[-8, 10], [-12, 34], [-14, 60]]), r, 2, .35); S.crease(g, SO([[12, 12], [16, 36], [14, 60]]), r, 2, .35);
  g.save(); robe(g); g.clip(); for (const [x, y, wd, hd, a] of [[-32, 36, 15, 13, .2], [24, 44, 13, 11, -.15]]){ g.save(); g.translate(x, y); g.rotate(a); S.part(g, RR(-wd / 2, -hd / 2, wd, hd, 2), PATCH, { x:0, y:0, r:wd / 2 }, { flat:true, mat:'cloth' }); g.strokeStyle = rgba(r.deep, .8); g.lineWidth = 1; for (let i = -wd / 2 + 2; i < wd / 2; i += 4){ g.beginPath(); g.moveTo(i, -hd / 2 - 1.5); g.lineTo(i + 1.5, -hd / 2 + 1.5); g.moveTo(i, hd / 2 - 1.5); g.lineTo(i + 1.5, hd / 2 + 1.5); g.stroke(); } g.restore(); } g.restore();
  for (const [x, y] of [[-52, 58], [-28, 64], [2, 66], [30, 64], [50, 60]]) S.thread(g, x, y, 1, r);
  const cape = SM([[-44, -30], [-20, -22], [0, -18], [20, -22], [44, -30], [42, -12, 1], [30, -6, 1], [22, -16, 1], [10, -4, 1], [0, -14, 1], [-10, -4, 1], [-22, -16, 1], [-30, -6, 1], [-42, -12, 1]], .7); S.part(g, cape, rd, { x:0, y:-20, r:44 }, { flat:true, mat:'cloth' }); S.contact(g, robe, 0, -8, 40, 8, .4);
  S.tube(g, SO([[-46, 20], [-10, 26], [44, 22]]), w, 4); for (let x = -42; x < 42; x += 6) S.ln(g, [[x, 19 + (x + 46) * .05], [x + 2.5, 24 + (x + 46) * .05]], w, 1, .6);
  for (const [x, y] of [[-22, 36], [-14, 40], [-6, 38]]){ S.ln(g, [[x, 26], [x, y]], { deep:'#d8c070' }, 1.2, .9); g.beginPath(); g.arc(x, y + 4, 3.5, 0, TAU); g.strokeStyle = '#d8c070'; g.lineWidth = 1.2; g.stroke(); S.dot(g, E(x + 2, y + 5, 1.6, 1.2), '#d8c070'); }
  const hood = SM([[10, -82], [-14, -76], [-30, -58], [-34, -34], [-24, -20], [0, -16], [24, -20], [34, -36], [30, -62]], .85); S.part(g, hood, r, { x:0, y:-50, r:36 }, { mat:'cloth', hx:-16, hy:-70 });
  const cave = SM([[-24, -38], [-18, -58], [0, -66], [18, -58], [24, -38], [16, -24], [0, -20], [-16, -24]], .9); S.dot(g, cave, '#140c1c');
  g.save(); cave(g); g.clip(); const gr = g.createRadialGradient(0, -40, 2, 0, -40, 28); gr.addColorStop(0, `rgba(255,138,42,${.35 + cast * .4})`); gr.addColorStop(1, 'rgba(255,138,42,0)'); g.fillStyle = gr; g.fillRect(-40, -80, 80, 80); g.restore();
  S.stroke(g, SO([[-24, -38], [-18, -58], [0, -66], [18, -58], [24, -38]]), { deep:r.light }, 2.4, .5);
  S.glow(g, -9, -44, 4.5 + cast * 1.5, '#ff8a2a'); S.glow(g, 9, -44, 4.5 + cast * 1.5, '#ff8a2a');
  const ca = cast * 1.15 + breathe * .04, cs = Math.cos(ca), sn = Math.sin(ca), hx = -36 + (-34 * cs - 30 * sn), hy = -14 + (-34 * sn + 30 * cs);
  g.save(); g.translate(-36, -14); g.rotate(ca); g.translate(36, 14);
  const sleeve = SM([[-36, -14], [-64, -2], [-72, 14], [-56, 22], [-34, 8]], .7); S.part(g, sleeve, r, { x:-52, y:4, r:20 }, { flat:true, mat:'cloth' }); S.contact(g, robe, -36, -2, 10, 10, .4);
  g.restore();
  const swing = idle == null ? 0 : Math.sin(idle * TAU + 1) * 4;
  S.tube(g, SO([[hx - 2, hy + 2], [hx - 8 + swing, hy + 26]]), w, 3.5);
  for (let i = 0; i < 3; i++){ const a = Math.PI * .55 + (i - 1) * .4; S.tube(g, SO([[hx, hy + 2], [hx + Math.cos(a) * 7, hy + 2 + Math.sin(a) * 8]]), k, 2.4); } S.part(g, E(hx + 2, hy, 5.5, 5), k, { x:hx + 2, y:hy, r:5.5 }, { flat:true, mat:'bone' });
  if (cast > 0){ const fl = g.createRadialGradient(hx - 8, hy + 50, 4, hx - 8, hy + 50, 30 + cast * 80); fl.addColorStop(0, `rgba(255,200,90,${.55 * cast})`); fl.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = fl; g.fillRect(-220, -140, 300, 320); }
  lantern(g, hx - 8 + swing * 1.4, hy + 46, 1.1 + cast * .15);
  S.part(g, E(46, 4 + push, 5.5, 5), k, { x:46, y:4 + push, r:5.5 }, { flat:true, mat:'bone' });
  g.restore();
  if (fade > 0) g.restore();
}

// ---------- registry ----------
// scale/dy fit the drawing to the in-game footprint (feet at about r × 0.95 below the monster's centre).
// box is the frame in drawing units; clips are baked by anim.js: n frames at fps; `once` clips play a single time.
export const W1 = {
  bat:   { draw:bat, scale:.56, dy:-3, box:{ x:-66, y:-50, w:132, h:100 }, variants:{ swiftBat:true, owlBat:true }, clips:{ walk:{ n:6, fps:14, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) } }, still:{ walk:.3 } },
  imp:   { draw:imp, scale:.57, dy:-12, box:{ x:-56, y:-78, w:112, h:134 }, variants:{ marshImp:true, broomImp:true, keepImp:true, tideImp:true }, clips:{ walk:{ n:8, fps:12, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) } }, still:{} },
  ghoul: { draw:ghoul, scale:.7, dy:-15, box:{ x:-60, y:-48, w:120, h:106 }, variants:{ bogGhoul:true, woodGhoul:true, cryptGhoul:true, drownedGhoul:true }, clips:{ walk:{ n:8, fps:9, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) } }, still:{} },
  brute: { draw:brute, scale:.66, dy:-6, box:{ x:-74, y:-66, w:148, h:124 }, variants:{ siegeBrute:true, bogTurtle:true }, clips:{ walk:{ n:8, fps:6, pose:t => ({ walk:t }) }, chew:{ n:4, fps:7, pose:t => ({ chew:t }) } }, still:{} },
  mummy: { draw:mummy, scale:.6, dy:-10, box:{ x:-92, y:-58, w:176, h:118 }, variants:{ soddenMummy:true }, clips:{ walk:{ n:8, fps:7, pose:t => ({ walk:t }) }, chew:{ n:4, fps:6, pose:t => ({ chew:t }) }, collapse:{ n:8, fps:16, once:true, pose:t => ({ collapse:t }) } }, still:{} },
  firemummy: { draw:firemummy, scale:.6, dy:-10, box:{ x:-92, y:-70, w:176, h:130 }, clips:{ walk:{ n:8, fps:7, pose:t => ({ walk:t, flick:t * 2 }) }, chew:{ n:4, fps:6, pose:t => ({ chew:t, flick:t }) }, collapse:{ n:8, fps:16, once:true, pose:t => ({ collapse:t, flick:t }) } }, still:{} },
  gravekeeper: { draw:gravekeeper, scale:.68, dy:-13, box:{ x:-110, y:-98, w:206, h:200 }, clips:{ walk:{ n:8, fps:6, pose:t => ({ idle:t }) }, cast:{ n:6, fps:12, once:true, pose:t => ({ cast:t }) }, teleport:{ n:8, fps:16, once:true, pose:t => ({ cast:1, fade:t }) }, stab:{ n:8, fps:12, once:true, pose:t => ({ stab:t }) } }, still:{} },
};
/** The type or boss kind a monster is drawn as, or null when it still uses the old vector drawing. */
export function charKey(m){ const k = m.type === 'boss' ? m.kind : m.type; return CHARS[k] ? k : null; }
