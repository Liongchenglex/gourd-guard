// ---------- World 4 (Crumbling Keep) characters, Toy Plastic style ----------
// Shield Knight, Gargoyle Hauler, Gargoyle, Skeleton Archer, Vampire, Bulwark Knight and the Vampire Count (boss).
// Drawn around (0,0) in drawing units with the feet near y = 50 (the Count hovers a little above its shadow);
// the registry at the end fits each one to its in-game footprint. The Bulwark's steel aura, the archer's arrows,
// the Count's lane-burst sparks and castle walls are drawn by the engine; only the characters live here.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';

// numbers mirrored from src/data/monsters.js TYPES (this module may only import the painter): keep in step
const VAMPIRE_CALM = 2, ARCHER_DRAW = 0.35;

const STEEL = pal('#a8adc0'), STEELD = pal('#767b8c'), IRON = pal('#575b69'), GOLD = pal('#e2b24c'), CRIM = pal('#9e2f44'), CRIMD = pal('#6e1f32'), LEATH = pal('#6b4a2e'), BOOT = pal('#48331f'), PLUME = pal('#e2543c'),
  HAUL = pal('#8d7862'), HAULD = pal('#6a5646'), RAG = pal('#5e5670'), ROPE = pal('#cbb084'), STONE = pal('#8a8e9a'), STONED = pal('#60646f'),
  BONE = pal('#ded6c6'), HOOD = pal('#4c4256'), WOOD = pal('#7c5634'), QUIV = pal('#6e4a2a'), FLETCH = pal('#c9584a'),
  CAPE = pal('#2e1122'), LINING = pal('#ac2140'), SUIT = pal('#3c1526'), PALE = pal('#eee2de'), HAIR = pal('#201519'), VEST = pal('#c94a44'),
  BANNER = pal('#3f4d96'), BATC = pal('#3a2040');
const EYE_KNIGHT = '#ffd35a', EYE_GARG = '#ff9a3a', EYE_BULWARK = '#bcd0ff', EYE_ARCHER = '#9fe8ff';

// ---------- helpers ----------
/** Foot offset for a walking leg: [dx, dy] with the two legs half a cycle apart. */
const stride = (w, s, amp = 5, lift = 7) => { if (w == null) return [0, 0]; const ph = w * TAU + (s < 0 ? 0 : Math.PI); return [Math.cos(ph) * amp, -Math.max(0, Math.sin(ph)) * lift]; };
/** A chunky boot seen from the front. */
function boot(g, x, y, c, r = 9){ const p = SM([[x - r, y - r * .6], [x + r, y - r * .6], [x + r * 1.15, y + r * .2], [x + r * .6, y + r * .55], [x - r * .6, y + r * .55], [x - r * 1.15, y + r * .2]], .7); S.part(g, p, c, { x, y:y - r * .2, r }, { flat:true, mat:'leather' }); S.ln(g, [[x - r * .7, y - r * .05], [x + r * .7, y - r * .05]], c, 1, .45); }
function metal(g, p, c, b, o = {}){ S.part(g, p, c, b, { mat:'metal', ...o }); }
/** Cracks in stone: a dark line with a lit edge. */
function cracks(g, lines, c){ for (const pts of lines){ S.ln(g, pts, c, 1.5, .7); g.save(); g.translate(.8, .8); S.ln(g, pts, { deep:c.light }, .8, .5); g.restore(); } }
/** A short sword with the grip centred on (x, y); a = tilt (0 = blade straight up). Draw the hand after it. */
function sword(g, x, y, a){ g.save(); g.translate(x, y); g.rotate(a);
  S.part(g, E(0, 8, 3.2, 3.2), GOLD, { x:0, y:8, r:3.2 }, { flat:true, mat:'metal' }); S.tube(g, SO([[0, 6], [0, -5]]), LEATH, 4);
  metal(g, RR(-9, -8, 18, 4, 2), GOLD, { x:0, y:-6, r:9 }, { flat:true });
  const blade = SM([[-3.4, -8, 1], [3.4, -8, 1], [3, -32, 1], [0, -42, 1], [-3, -32, 1]], .5); metal(g, blade, STEEL, { x:0, y:-24, r:18 }, { flat:true, hx:-1, hy:-30 }); S.ln(g, [[0, -10], [0, -34]], STEEL, .9, .5);
  g.restore(); }
/** Kite shield: top edge centred on (x, y), pointing down; sc < 1 squashes it sideways (seen edge-on at the side). */
function kite(g, x, y, rot, sx = 1){ g.save(); g.translate(x, y); g.rotate(rot); g.scale(sx, 1);
  const p = SM([[-17, 0, 1], [17, 0, 1], [19, 12], [12, 32], [0, 44], [-12, 32], [-19, 12]], .8);
  S.part(g, p, CRIM, { x:0, y:16, r:24 }, { mat:'paint', hx:-8, hy:4 });
  S.dot(g, PL([[-15, 4], [15, 4], [0, 18]]), STEEL.light, .5);
  S.stroke(g, p, { deep:STEEL.light }, 3.4, .95); S.stroke(g, p, STEELD, 1.3, .8);
  const gr = g.createRadialGradient(-2, 14, 1, 0, 16, 7); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.4, STEEL.light); gr.addColorStop(1, STEEL.deep); ell(g, 0, 16, 7, 7); g.fillStyle = gr; g.fill(); g.strokeStyle = rgba(STEEL.deep, .8); g.lineWidth = 1; g.stroke();
  for (const [rx, ry] of [[-13, 6], [13, 6], [0, 36]]) S.rivet(g, rx, ry, 1.6, STEEL);
  g.restore(); }
/** Steel gauntlet: a fist. */
function gauntlet(g, x, y, r = 6.5){ metal(g, E(x, y, r, r * .92), STEEL, { x, y, r }, { flat:true }); S.ln(g, [[x - r * .5, y + r * .2], [x + r * .5, y + r * .2]], STEEL, 1, .5); }
/** Pale clawed hand: palm plus long fingers ending in claws. dir = where the fingers point. */
function clawHand(g, x, y, c, dir, r = 6, len = 8){ for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * .42, fx = x + Math.cos(a) * len, fy = y + Math.sin(a) * len; S.tube(g, SO([[x, y], [fx, fy]]), c, 3.2); S.claw(g, fx + Math.cos(a) * 1.5, fy + Math.sin(a) * 1.5, a, 4.5, '#e8e0f0'); } S.part(g, E(x, y, r, r * .9), c, { x, y, r }, { flat:true, mat:'skin' }); }
/** A small bat silhouette. */
function miniBat(g, x, y, s, flap){ g.save(); g.translate(x, y); g.scale(s, s); const lift = flap * 6; for (const d of [-1, 1]) S.dot(g, SM([[d * 3, 0], [d * 10, -6 - lift], [d * 20, -8 - lift], [d * 18, 0, 1], [d * 14, 4, 1], [d * 8, 2, 1]], .7), BATC.dark, .95); S.dot(g, E(0, 0, 4, 5), BATC.base); S.dot(g, PL([[-3, -3], [-5, -9], [-1, -5]]), BATC.base); S.dot(g, PL([[3, -3], [5, -9], [1, -5]]), BATC.base); S.dot(g, E(-1.5, -1, .9, .9), '#ff4a4a'); S.dot(g, E(1.5, -1, .9, .9), '#ff4a4a'); g.restore(); }
/** A five-point star. */
function star(g, x, y, r, col){ g.save(); g.shadowColor = col; g.shadowBlur = 6; g.beginPath(); for (let i = 0; i < 10; i++){ const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fillStyle = col; g.fill(); g.restore(); }
/** Bat sigil: a gold bat on cloth or steel. */
function batSigil(g, x, y, s, col = GOLD.base){ g.save(); g.translate(x, y); g.scale(s, s); S.dot(g, SM([[0, -4], [-6, -8], [-14, -6], [-12, 0, 1], [-8, 2, 1], [-5, 6, 1], [0, 4], [5, 6, 1], [8, 2, 1], [12, 0, 1], [14, -6], [6, -8]], .7), col, .9); S.dot(g, PL([[-2, -6], [-3, -10], [0, -7]]), col, .9); S.dot(g, PL([[2, -6], [3, -10], [0, -7]]), col, .9); g.restore(); }

// ---------- Shield Knight ----------
export function knight(g, P = {}){
  const w = P.walk, ch = P.chew, rs = P.rest, up = !!P.up;
  const sw = w != null ? Math.sin(w * TAU) : 0, br = rs != null ? Math.sin(rs * TAU) : 0;
  const bob = w != null ? -Math.abs(sw) * 3 : ch != null ? Math.sin(ch * TAU) * 2.5 : br * 1.3, lean = ch != null ? .1 : 0;
  S.shadow(g, 0, 50, 34, 6);
  for (const s of [-1, 1]){ const [dx, dy] = stride(w, s, 5, 7); S.tube(g, SO([[s * 9, 22], [s * 11 + dx * .5, 34 + dy * .5], [s * 12 + dx, 44 + dy]]), IRON, 9); metal(g, E(s * 11 + dx * .5, 33 + dy * .5, 5.5, 4.5), STEEL, { x:s * 11 + dx * .5, y:33 + dy * .5, r:5.5 }, { flat:true }); boot(g, s * 12 + dx, 46 + dy, BOOT, 9); }
  g.save(); g.translate(0, 48); g.rotate(lean); g.translate(0, -48 + bob);
  const tunic = SM([[-21, -4], [-24, 14], [-24, 30, 1], [-8, 27, 1], [0, 33, 1], [8, 27, 1], [24, 30, 1], [24, 14], [21, -4], [0, -8]], .8);
  S.part(g, tunic, CRIM, { x:0, y:12, r:26 }, { mat:'cloth' });
  S.crease(g, SO([[-12, 22], [-14, 30]]), CRIM, 1.6, .4); S.crease(g, SO([[12, 22], [14, 30]]), CRIM, 1.6, .4);
  S.part(g, RR(-24, 14, 48, 7, 3), LEATH, { x:0, y:17, r:24 }, { flat:true, mat:'leather' }); S.part(g, RR(-4, 12.5, 8, 10, 2), GOLD, { x:0, y:17, r:5 }, { flat:true, mat:'metal' });
  metal(g, SM([[-14, -8], [14, -8], [17, -1], [0, 4], [-17, -1]], .7), STEEL, { x:0, y:-3, r:16 }, { flat:true });
  for (const s of [-1, 1]){ const pd = SM([[s * 10, -8], [s * 24, -12], [s * 34, -2], [s * 28, 9], [s * 14, 6]], .75); metal(g, pd, STEEL, { x:s * 22, y:-2, r:13 }, { hx:s * 20 - 4, hy:-8 }); S.rivet(g, s * 24, -3, 1.8, STEEL); }
  // sword arm (viewer's left)
  { const a = w != null ? sw * .3 : ch != null ? -.25 : br * .05; g.save(); g.translate(-22, 2); g.rotate(a); g.translate(22, -2);
    S.tube(g, SO([[-24, 2], [-34, 12], [-37, 24]]), CRIMD, 8); sword(g, -38, 26, -.5 + (ch != null ? .45 : 0)); gauntlet(g, -38, 26); g.restore(); }
  // shield arm (viewer's right)
  if (up){ S.tube(g, SO([[24, 2], [26, 14], [14, 20]]), CRIMD, 8); kite(g, 8, -12, -.1); }
  else { S.tube(g, SO([[24, 2], [32, 12], [34, 26]]), CRIMD, 8); kite(g, 37, -4 + br, .12, .5); gauntlet(g, 34, 26); }
  // helm: chin guard, visor slit with glowing eyes, dome, brim, plume
  metal(g, SM([[-19, -24], [-19, -14], [-10, -6], [0, -4], [10, -6], [19, -14], [19, -24]], .7), STEELD, { x:0, y:-16, r:20 });
  S.ln(g, [[0, -20], [0, -6]], STEELD, 1.2, .5); S.rivet(g, -9, -12, 1.4, STEELD); S.rivet(g, 9, -12, 1.4, STEELD);
  S.dot(g, RR(-14, -26, 28, 7, 3), '#161824');
  S.glow(g, -6, -22.5, 2.6, EYE_KNIGHT); S.glow(g, 6, -22.5, 2.6, EYE_KNIGHT);
  metal(g, SM([[-22, -28], [-20, -24], [0, -22], [20, -24], [22, -28], [16, -50], [0, -57], [-16, -50]], .8), STEEL, { x:0, y:-40, r:24 }, { hx:-9, hy:-48 });
  metal(g, E(0, -30, 31, 6), STEELD, { x:0, y:-30, r:31 }, { flat:true, hx:-14, hy:-32 }); S.ln(g, [[-28, -29], [28, -29]], STEELD, .9, .4);
  S.tube(g, SO([[0, -54], [-4, -66], [-14, -76], [-26, -74]]), PLUME, 7); S.stroke(g, SO([[-1, -56], [-5, -66], [-14, -73], [-24, -72]]), { deep:PLUME.light }, 1.6, .6);
  for (const [x, y, dx, dy] of [[-8, -70, -4, 4], [-13, -74, -3, 5], [-19, -75, -2, 5]]) S.ln(g, [[x, y], [x + dx, y + dy]], PLUME, 1, .5);
  metal(g, E(0, -56, 3.5, 3), GOLD, { x:0, y:-56, r:3.5 }, { flat:true });
  g.restore();
}

// ---------- Gargoyle Hauler ----------
export function hauler(g, P = {}){
  const w = P.walk, ch = P.chew, pu = P.push, h = pu != null ? 1 : ch != null ? .65 : 0;   // hunch: 1 straining forward, 0 upright sprint
  const strain = pu != null ? Math.sin(pu * TAU) : 0, sw = w != null ? Math.sin(w * TAU) : 0;
  const bob = w != null ? -Math.abs(sw) * 4 : pu != null ? strain * 2.5 : ch != null ? Math.sin(ch * TAU) * 2.5 : 0, jaw = ch != null ? Math.abs(Math.sin(ch * TAU)) * 5 : 0;
  S.shadow(g, 0, 50, 36, 6);
  for (const s of [-1, 1]){ let fx, fy; if (pu != null){ const p2 = pu * TAU + (s < 0 ? 0 : Math.PI); fx = s * 19 + Math.cos(p2) * 4; fy = 46 - Math.max(0, Math.sin(p2)) * 3; } else { const [dx, dy] = stride(w, s, 7, 10); fx = s * 12 + dx; fy = 46 + dy; }
    S.tube(g, SO([[s * 9, 24 + h * 4], [s * (13 + h * 5) + (fx - s * 12) * .5, 36 + (fy - 46) * .5], [fx, fy - 3]]), HAUL, 9);
    S.part(g, E(fx, fy, 9, 4.5), HAULD, { x:fx, y:fy, r:8 }, { flat:true, mat:'skin' }); for (const dd of [-4, 0, 4]) S.claw(g, fx + dd, fy + 3, Math.PI / 2, 3, '#e8dcc8'); }
  g.save(); g.translate(0, bob);
  const top = -8 - (1 - h) * 12;
  const torso = SM([[-22, 30], [-26, 12], [-24, top + 6], [-10, top - 10], [10, top - 10], [24, top + 6], [26, 12], [22, 30]], .8);
  S.part(g, torso, HAUL, { x:0, y:top + 16, r:28 }, { mat:'skin', hx:-12, hy:top + 2 });
  const rag = SM([[-20, 30, 1], [-10, 26, 1], [-2, 32, 1], [8, 26, 1], [20, 30, 1], [24, 10], [16, -2 + h * 4], [0, 2 + h * 4], [-16, -2 + h * 4], [-24, 10]], .7);
  S.part(g, rag, RAG, { x:0, y:14, r:24 }, { flat:true, mat:'cloth' }); S.crease(g, SO([[-8, 6 + h * 4], [-6, 26]]), RAG, 1.5, .4); S.crease(g, SO([[10, 8 + h * 4], [8, 26]]), RAG, 1.5, .4);
  for (const [x, y] of [[-20, 30], [-2, 32], [20, 30]]) S.thread(g, x, y, x < 0 ? -1 : 1, RAG);
  S.part(g, RR(-24, 16, 48, 5, 2), LEATH, { x:0, y:18, r:24 }, { flat:true, mat:'leather' });
  const hy = -28 + h * 22;
  const rope = (pts, w2 = 5.5) => { S.tube(g, SO(pts), ROPE, w2); S.stroke(g, SO(pts), { deep:ROPE.light }, 1.2, .5); };
  if (pu != null){ rope([[-20, hy + 4], [-26, hy + 20], [-14, 24], [0, 30]]); rope([[-12, hy - 6], [-22, hy + 4]]); }   // tow rope over the left shoulder and across the chest to the hands
  else { rope([[-22, top + 14], [-30, top + 30], [-24, top + 40], [-14, top + 30], [-18, top + 16]], 4); }   // slack coil on the shoulder once it is freed
  // arms: straining forward on the rope, or pumping while it sprints
  for (const s of [-1, 1]){ let hx, hyy;
    if (pu != null){ hx = s * 8 + strain * 2; hyy = 30 + s * 5; } else if (ch != null){ hx = s * 20; hyy = 34; } else { const a = Math.sin(w * TAU + (s < 0 ? Math.PI : 0)); hx = s * 30; hyy = 14 - a * 14; }
    S.tube(g, SO([[s * 22, top + 12], [s * 30 + (hx - s * 30) * .4, top + 26 + (hyy - top - 26) * .5], [hx, hyy]]), HAUL, 9); S.hand(g, hx, hyy + 2, HAUL, pu != null ? Math.PI / 2 : ch != null ? Math.PI / 2 : -Math.PI / 2 + s * .4, 3, 7); }
  if (pu != null){ rope([[-2, 32 + strain], [10, 42], [14, 56]]); for (let i = 0; i < 4; i++){ const t = i / 4, x = -2 + 16 * t, y = 32 + 24 * t; S.ln(g, [[x - 2.5, y - 1.5], [x + 2, y + 2.5]], ROPE, 1.1, .6); } S.dot(g, E(14, 56, 4, 2.6), ROPE.dark, .9); }   // the taut line leads down the lane to the gargoyles
  // head: bald, pointed ears, heavy brow; strains with a squint and gritted teeth, sprints wide-eyed
  const head = SM([[-21, hy - 14], [-23, hy], [-15, hy + 13], [0, hy + 17], [15, hy + 13], [23, hy], [21, hy - 14], [10, hy - 24], [-10, hy - 24]], .85);
  for (const s of [-1, 1]) S.part(g, SM([[s * 18, hy - 8], [s * 34, hy - 20], [s * 32, hy - 6], [s * 22, hy + 2]], .7), HAUL, { x:s * 26, y:hy - 10, r:9 }, { flat:true, mat:'skin' });
  S.part(g, head, HAUL, { x:0, y:hy - 4, r:23 }, { mat:'skin' }); S.contact(g, torso, 0, hy + 14, 18, 6, .45);
  S.ln(g, [[-14, hy - 12], [-4, hy - 9]], HAULD, 2.6, .8); S.ln(g, [[14, hy - 12], [4, hy - 9]], HAULD, 2.6, .8);
  const lid = pu != null ? .45 : 0;
  S.eye(g, -8, hy - 3, 7.5, 8, { lx:.15, ly:.2, pr:.42, iris:'#c08a2a', lid, lidCol:HAUL.base, tilt:-.3 }); S.eye(g, 8, hy - 3, 7.5, 8, { lx:.15, ly:.2, pr:.42, iris:'#c08a2a', lid, lidCol:HAUL.base, tilt:.3 });
  S.dot(g, E(0, hy + 4, 3, 2), HAULD.base, .8);
  if (pu != null){ S.dot(g, RR(-9, hy + 7, 18, 5, 2), '#2a1a20'); for (let x = -7; x <= 5; x += 4) S.dot(g, RR(x, hy + 7.5, 3, 4), '#fff', .95); S.dot(g, E(18, hy - 18 + strain * 2, 2, 3), '#bfefff', .9); }
  else { S.dot(g, SM([[-9, hy + 6], [-4, hy + 10 + jaw], [0, hy + 12 + jaw], [4, hy + 10 + jaw], [9, hy + 6], [0, hy + 8]], .8), '#2a1a20'); S.dot(g, PL([[-7, hy + 6], [-3, hy + 6], [-5, hy + 11]]), '#fff'); S.dot(g, PL([[3, hy + 6], [7, hy + 6], [5, hy + 11]]), '#fff'); }
  g.restore();
}

// ---------- Gargoyle ----------
export function gargoyle(g, P = {}){
  const w = P.walk, ch = P.chew, sw = w != null ? Math.sin(w * TAU) : 0;
  const bob = w != null ? -Math.abs(sw) * 1.5 : ch != null ? Math.sin(ch * TAU) * 2 : 0, jaw = ch != null ? Math.abs(Math.sin(ch * TAU)) * 6 : 0, sway = w != null ? sw * .03 : 0;
  S.shadow(g, 0, 50, 42, 7);
  g.save(); g.translate(0, bob); g.rotate(sway);
  for (const s of [-1, 1]){ const lift = w != null ? Math.sin(w * TAU * 2) * 2 : 0; const wing = SM([[s * 8, 16], [s * 18, -8], [s * 26, -42 - lift, 1], [s * 36, -14], [s * 40, 14], [s * 26, 26]], .75); S.part(g, wing, STONED, { x:s * 26, y:-6, r:26 }, { mat:'stone', flat:true, hx:s * 24, hy:-20 });
    S.crease(g, SO([[s * 14, 14], [s * 26, -34 - lift]]), STONED, 1.8, .45); S.crease(g, SO([[s * 22, 20], [s * 34, -8]]), STONED, 1.5, .35); S.claw(g, s * 26, -44 - lift, -Math.PI / 2, 4, '#d8d4dc'); }
  for (const s of [-1, 1]){ S.tube(g, SO([[s * 24, 26], [s * 30, 44]]), STONED, 10); S.part(g, E(s * 31, 47, 9, 4.5), STONED, { x:s * 31, y:47, r:8 }, { flat:true, mat:'stone' }); for (const dd of [-4, 0, 4]) S.claw(g, s * 31 + dd, 50, Math.PI / 2, 3.5, '#d8d4dc'); }
  const body = SM([[-30, 8], [-34, 28], [-22, 44], [0, 47], [22, 44], [34, 28], [30, 8], [14, -8], [-14, -8]], .85); S.part(g, body, STONE, { x:0, y:20, r:34 }, { mat:'stone', hx:-14, hy:4 });
  cracks(g, [[[-10, 18], [-4, 30], [-9, 40]], [[16, 12], [22, 24]], [[-24, 30], [-18, 36]]], STONE);
  S.dot(g, SM([[-12, 22], [-14, 40], [0, 44], [14, 40], [12, 22], [0, 18]], .9), STONE.light, .25);
  for (const s of [-1, 1]){ const ph = w == null ? null : w * TAU + (s < 0 ? 0 : Math.PI), dx = ph == null ? 0 : Math.cos(ph) * 3, dy = ph == null ? 0 : -Math.max(0, Math.sin(ph)) * 3;
    S.tube(g, SO([[s * 16, 24], [s * 18 + dx, 44 + dy]]), STONE, 11); S.part(g, E(s * 19 + dx, 47 + dy, 10, 5), STONE, { x:s * 19 + dx, y:47 + dy, r:9 }, { flat:true, mat:'stone' }); for (const dd of [-5, 0, 5]) S.claw(g, s * 19 + dx + dd, 50 + dy, Math.PI / 2, 4, '#d8d4dc'); }
  // head: horns, ears, brow ridge, glowing eye slits, a wide toothy maw
  for (const s of [-1, 1]){ S.part(g, SM([[s * 8, -24], [s * 14, -36], [s * 10, -50], [s * 22, -40], [s * 20, -24]], .8), STONED, { x:s * 14, y:-36, r:10 }, { flat:true, mat:'horn' }); S.part(g, SM([[s * 18, -14], [s * 32, -24], [s * 30, -10], [s * 22, -4]], .7), STONE, { x:s * 25, y:-14, r:8 }, { flat:true, mat:'stone' }); }
  const head = SM([[-21, -16], [-23, -2], [-14, 10], [0, 14], [14, 10], [23, -2], [21, -16], [10, -28], [-10, -28]], .85); S.part(g, head, STONE, { x:0, y:-8, r:23 }, { mat:'stone' }); S.contact(g, body, 0, 4, 16, 6, .5);
  cracks(g, [[[8, -26], [12, -18], [8, -12]]], STONE);
  S.part(g, SM([[-20, -16], [-8, -20], [0, -18], [8, -20], [20, -16], [16, -10], [0, -12], [-16, -10]], .7), STONED, { x:0, y:-15, r:20 }, { flat:true, mat:'stone' });
  for (const s of [-1, 1]){ S.dot(g, SM([[s * 15, -10], [s * 4, -7], [s * 5, -3], [s * 16, -5]], .6), '#1a1418'); S.glow(g, s * 9.5, -6.5, 2.6, EYE_GARG); }
  S.dot(g, SM([[-14, 2], [-8, 6 + jaw], [0, 8 + jaw], [8, 6 + jaw], [14, 2], [0, 0]], .8), '#1b1216');
  for (const x of [-9, -3, 3, 9]) S.dot(g, PL([[x - 2.5, 1], [x + 2.5, 1], [x, 7]]), '#e8e4ec');
  for (const x of [-7, 7]) S.dot(g, PL([[x - 2, 7 + jaw], [x + 2, 7 + jaw], [x, 2 + jaw]]), '#e8e4ec');
  g.restore();
}

// ---------- Skeleton Archer ----------
export function archer(g, P = {}){
  const w = P.walk, ch = P.chew, dr = P.draw, ho = P.hold, aim = dr != null || ho != null;
  const sw = w != null ? Math.sin(w * TAU) : 0, bob = w != null ? -Math.abs(sw) * 2.5 : ch != null ? Math.sin(ch * TAU) * 2 : ho != null ? Math.sin(ho * TAU) * 1 : 0, jaw = ch != null ? Math.abs(Math.sin(ch * TAU)) * 4 : 0;
  const pull = dr == null ? 0 : dr < .7 ? Math.min(1, dr / .55) : 0, rec = dr == null || dr < .7 ? 0 : 1 - (dr - .7) / .3;   // pull builds, then the string snaps back and the hand recoils
  S.shadow(g, 0, 50, 28, 5);
  for (const s of [-1, 1]){ const [dx, dy] = stride(w, s, 5, 8); S.tube(g, SO([[s * 7, 22], [s * 9 + dx * .5, 34 + dy * .5], [s * 10 + dx, 44 + dy]]), BONE, 5); S.part(g, E(s * 9 + dx * .5, 34 + dy * .5, 3.6, 3.6), BONE, { x:s * 9 + dx * .5, y:34 + dy * .5, r:3.6 }, { flat:true, mat:'bone' });
    S.part(g, SM([[s * 4 + dx, 44 + dy], [s * 16 + dx, 44 + dy], [s * 18 + dx, 49 + dy], [s * 4 + dx, 49 + dy]], .6), BONE, { x:s * 10 + dx, y:46 + dy, r:8 }, { flat:true, mat:'bone' }); for (const dd of [-3, 1, 5]) S.ln(g, [[s * 10 + dd + dx, 45 + dy], [s * 10 + dd + dx, 49 + dy]], BONE, 1, .5); }
  g.save(); g.translate(0, bob);
  // quiver behind the right shoulder (viewer's left)
  g.save(); g.translate(-19, 4); g.rotate(-.3); S.part(g, RR(-6, -22, 12, 38, 5), QUIV, { x:0, y:-4, r:14 }, { mat:'leather', flat:true }); S.ln(g, [[-6, -14], [6, -14]], QUIV, 1.2, .6); S.ln(g, [[-6, 6], [6, 6]], QUIV, 1.2, .6);
  for (const x of [-3, 1, 4]){ S.ln(g, [[x, -22], [x - 1, -40]], WOOD, 1.6, .95); S.dot(g, PL([[x - 3.5, -32], [x - 1, -42], [x + 1.5, -33]]), FLETCH.base, .95); } g.restore();
  S.part(g, SM([[-12, 16], [-14, 26], [0, 29], [14, 26], [12, 16]], .7), BONE, { x:0, y:22, r:13 }, { flat:true, mat:'bone' }); S.dot(g, E(-6, 22, 2.5, 2), BONE.deep, .5); S.dot(g, E(6, 22, 2.5, 2), BONE.deep, .5);
  const cavity = SM([[-16, -4], [-18, 10], [-12, 22], [0, 24], [12, 22], [18, 10], [16, -4], [0, -8]], .85); S.dot(g, cavity, '#1e1622');
  S.tube(g, SO([[0, -8], [0, 24]]), BONE, 4);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++){ const y = -2 + i * 7; S.tube(g, SO([[s * 1, y], [s * (12 - i), y + 3], [s * (15 - i * 2), y + 7]]), BONE, 3.4); }
  // cowl over the shoulders
  const cowl = SM([[-24, -12], [-30, 4, 1], [-20, 2, 1], [-12, 8, 1], [0, 4, 1], [12, 8, 1], [20, 2, 1], [30, 4, 1], [24, -12]], .7); S.part(g, cowl, HOOD, { x:0, y:-6, r:28 }, { flat:true, mat:'cloth' }); for (const [x, y] of [[-30, 4], [-12, 8], [12, 8], [30, 4]]) S.thread(g, x, y, x < 0 ? -1 : 1, HOOD);
  // arms and bow
  const drawArm = (s, pts, hx, hy) => { S.tube(g, SO(pts), BONE, 4.6); S.part(g, E(pts[1][0], pts[1][1], 3.2, 3.2), BONE, { x:pts[1][0], y:pts[1][1], r:3.2 }, { flat:true, mat:'bone' }); S.hand(g, hx, hy, BONE, Math.atan2(hy - pts[1][1], hx - pts[1][0]), 3, 5); };
  if (aim){   // bow held out in front, face on; the string is drawn back to the cheek and loosed
    drawArm(1, [[18, -4], [16, 10], [6, 8]], 4, 6);
    const tip1 = [6, -30], tip2 = [6, 34], bend = pull * 3; S.tube(g, SO([[6, -30], [14 + bend, -12], [16 + bend, 2], [14 + bend, 16], [6, 34]]), WOOD, 4.2); S.tube(g, SO([[2, -2], [10, 8]]), LEATH, 5);
    const hx = 6 - pull * 14 + rec * 8, hy = 2 - pull * 16 - rec * 6;
    g.strokeStyle = '#efe6d8'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(tip1[0], tip1[1]); g.lineTo(hx, hy); g.lineTo(tip2[0], tip2[1]); g.stroke();
    drawArm(-1, [[-18, -4], [-24 + pull * 6, 8 - pull * 4], [hx, hy]], hx, hy);
  } else {
    { const a = w != null ? sw * .35 : ch != null ? -.3 : 0; drawArm(-1, [[-18, -4], [-27, 8 + a * 10], [-30, 22 + a * 8]], -30, 24 + a * 8); }
    S.tube(g, SO([[26, -26], [34, -10], [36, 2], [34, 14], [26, 30]]), WOOD, 4.2); g.strokeStyle = '#efe6d8'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(26, -26); g.lineTo(26, 30); g.stroke();
    { const a = w != null ? -sw * .3 : 0; drawArm(1, [[18, -4], [26, 6 + a * 8], [30, 2 + a * 8]], 30, 2 + a * 8); }
    S.tube(g, SO([[30, -5], [30, 8]]), LEATH, 5);
  }
  // skull with a ragged hood
  const skull = SM([[-17, -30], [-18, -16], [-12, -6], [0, -3], [12, -6], [18, -16], [17, -30], [8, -44], [-8, -44]], .85); S.part(g, skull, BONE, { x:0, y:-24, r:20 }, { mat:'bone' }); S.contact(g, cowl, 0, -8, 14, 5, .45);
  for (const s of [-1, 1]){ S.dot(g, SM([[s * 4, -32], [s * 14, -30], [s * 15, -20], [s * 6, -18]], .8), '#1e1622'); S.glow(g, s * 9.5, -25, 2.2, EYE_ARCHER); }
  S.dot(g, PL([[-2.5, -14], [2.5, -14], [0, -19]]), '#1e1622', .8);
  S.dot(g, RR(-9, -11, 18, 6 + jaw, 2), '#1e1622'); for (let x = -7; x <= 5; x += 4) S.dot(g, RR(x, -11, 3, 4), '#f4efe4', .95); if (jaw > 0) for (let x = -7; x <= 5; x += 4) S.dot(g, RR(x, -8 + jaw, 3, 3), '#f4efe4', .95);
  const hood = SM([[-21, -10, 1], [-26, -28], [-22, -46], [-8, -56], [4, -62, 1], [14, -52], [25, -30], [21, -10, 1], [16, -30, 1], [10, -38, 1], [0, -42, 1], [-10, -38, 1], [-16, -30, 1]], .8); S.part(g, hood, HOOD, { x:0, y:-38, r:26 }, { mat:'cloth', flat:true });
  S.crease(g, SO([[-18, -44], [-10, -30]]), HOOD, 1.6, .45); S.crease(g, SO([[18, -42], [12, -30]]), HOOD, 1.6, .45); S.crease(g, SO([[-2, -56], [2, -46]]), HOOD, 1.4, .4);
  S.stroke(g, SO([[-21, -10], [-16, -30], [-10, -38], [0, -42], [10, -38], [16, -30], [21, -10]]), HOOD, 1.6, .7); S.thread(g, -21, -10, -1, HOOD); S.thread(g, 21, -10, 1, HOOD); S.thread(g, -24, -24, -1, HOOD);
  S.dot(g, PL([[4, -62], [10, -72], [12, -58]]), HOOD.dark, .95); S.dot(g, PL([[-8, -52], [-4, -44], [-2, -54]]), HOOD.deep, .5);
  g.restore();
}

// ---------- Vampire ----------
export function vampire(g, P = {}){
  const w = P.walk, ch = P.chew, he = P.heal;
  const sw = w != null ? Math.sin(w * TAU) : 0, pulse = he == null ? 0 : (Math.sin(he * TAU) + 1) / 2;
  const bob = w != null ? sw * 3 : ch != null ? Math.sin(ch * TAU) * 2.5 : he != null ? Math.sin(he * TAU) * 1.5 : 0, sway = w != null ? sw * .05 : 0, cs = w != null ? Math.sin(w * TAU + 1) * 6 : 0;
  S.shadow(g, 0, 50, 30, 6);
  if (he != null){ const rr = 52 + pulse * 12, gr = g.createRadialGradient(0, 0, 4, 0, 0, rr); gr.addColorStop(0, `rgba(255,60,70,${.35 + pulse * .3})`); gr.addColorStop(.6, `rgba(255,40,60,${.18 + pulse * .15})`); gr.addColorStop(1, 'rgba(255,40,60,0)'); g.fillStyle = gr; g.fillRect(-80, -80, 160, 140);
    g.strokeStyle = `rgba(255,120,130,${.5 - pulse * .4})`; g.lineWidth = 2; ell(g, 0, 0, 30 + pulse * 34, 36 + pulse * 30); g.stroke(); }
  g.save(); g.translate(0, 46); g.rotate(sway); g.translate(0, -46 + bob);
  const cape = SM([[-20, -40], [-30, -8 + cs], [-38, 42 + cs * .5, 1], [-27, 32, 1], [-16, 44, 1], [-5, 34, 1], [6, 46, 1], [17, 34, 1], [28, 44, 1], [38, 42 - cs * .5, 1], [30, -8 - cs], [20, -40]], .8);
  S.part(g, cape, CAPE, { x:0, y:0, r:44 }, { mat:'cloth', hx:-18, hy:-20 }); S.crease(g, SO([[-20, -20], [-26, 30]]), CAPE, 1.8, .4); S.crease(g, SO([[20, -20], [26, 30]]), CAPE, 1.8, .4);
  const collar = SM([[-24, -20], [-23, -60, 1], [-8, -46], [0, -42], [8, -46], [23, -60, 1], [24, -20]], .8); S.part(g, collar, LINING, { x:0, y:-38, r:24 }, { mat:'cloth', flat:true, hx:-12, hy:-50 }); S.stroke(g, collar, CAPE, 2, .8);
  for (const s of [-1, 1]){ S.tube(g, SO([[s * 6, 26], [s * 7, 42]]), SUIT, 6); S.part(g, E(s * 8, 45, 7.5, 3.5), HAIR, { x:s * 8, y:45, r:7 }, { flat:true, mat:'leather' }); }
  const torso = SM([[-15, -8], [-18, 12], [-14, 32], [0, 34], [14, 32], [18, 12], [15, -8], [0, -12]], .85); S.part(g, torso, SUIT, { x:0, y:12, r:22 }, { mat:'cloth' });
  S.dot(g, PL([[-8, -10], [8, -10], [0, 8]]), '#f4eef0'); S.dot(g, PL([[-4, -8], [4, -8], [0, -2]]), LINING.base); S.part(g, E(0, -5, 3, 3), GOLD, { x:0, y:-5, r:3 }, { flat:true, mat:'metal' });
  S.crease(g, SO([[-10, 6], [-12, 30]]), SUIT, 1.5, .5); S.crease(g, SO([[10, 6], [12, 30]]), SUIT, 1.5, .5);
  // arms: crossed while it heals, one hand raised clawing on the glide, both forward while it chews
  if (he != null){ S.tube(g, SO([[-15, -2], [-2, 8], [12, 6]]), SUIT, 7); S.tube(g, SO([[15, -2], [2, 12], [-12, 10]]), SUIT, 7); clawHand(g, -13, 12, PALE, Math.PI * .9, 5, 6); clawHand(g, 13, 8, PALE, Math.PI * .1, 5, 6); }
  else if (ch != null){ for (const s of [-1, 1]){ S.tube(g, SO([[s * 15, -2], [s * 24, 14], [s * 18, 30]]), SUIT, 7); clawHand(g, s * 17, 33, PALE, Math.PI / 2 + s * .3, 5, 7); } }
  else { const a = sw * .15; S.tube(g, SO([[-15, -2], [-24, 12 + a * 10], [-26, 28]]), SUIT, 7); clawHand(g, -27, 31, PALE, Math.PI / 2 + .3, 5, 7);
    S.tube(g, SO([[15, -2], [26, 4], [30, -14 + a * 8]]), SUIT, 7); clawHand(g, 31, -18 + a * 8, PALE, -Math.PI / 2 - .2, 5, 8); }
  // head: pale, sharp chin, pointed ears, slicked hair with a widow's peak, red eyes, fangs
  for (const s of [-1, 1]) S.part(g, PL([[s * 15, -30], [s * 25, -38], [s * 18, -20]]), PALE, { x:s * 19, y:-30, r:6 }, { flat:true, mat:'skin' });
  const head = SM([[-17, -36], [-18, -20], [-9, -8], [0, -4, 1], [9, -8], [18, -20], [17, -36], [8, -50], [-8, -50]], .85); S.part(g, head, PALE, { x:0, y:-28, r:21 }, { mat:'skin', hx:-8, hy:-40 }); S.contact(g, torso, 0, -10, 14, 5, .45);
  const hair = SM([[-19, -34], [-21, -46], [-9, -57], [0, -54], [9, -57], [21, -46], [19, -34], [10, -42], [0, -35], [-10, -42]], .8); S.part(g, hair, HAIR, { x:0, y:-46, r:20 }, { mat:'leather', hx:-8, hy:-50 }); S.crease(g, SO([[-12, -50], [-4, -42]]), { deep:HAIR.light, rim:HAIR.light }, 1.2, .5);
  S.ln(g, [[-14, -32], [-5, -29]], HAIR, 2.2, .9); S.ln(g, [[14, -32], [5, -29]], HAIR, 2.2, .9);
  if (he != null){ S.glow(g, -7, -23, 4 + pulse * 2, '#ff3030'); S.glow(g, 7, -23, 4 + pulse * 2, '#ff3030'); }
  S.eye(g, -7, -23, 7, 7.5, { lx:.1, ly:.15, pr:.4, pupil:'#c01020', iris:'#ff6060' }); S.eye(g, 7, -23, 7, 7.5, { lx:.1, ly:.15, pr:.4, pupil:'#c01020', iris:'#ff6060' });
  S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(-7, -12); g2.quadraticCurveTo(0, -8 + (ch != null ? 3 : 0), 7, -12); }, HAIR, 1.6, .8);
  S.dot(g, PL([[-6, -12], [-2.5, -12], [-4.2, -6]]), '#fff'); S.dot(g, PL([[2.5, -12], [6, -12], [4.2, -6]]), '#fff');
  g.restore();
}

// ---------- Bulwark Knight ----------
export function bulwark(g, P = {}){
  const w = P.walk, ch = P.chew, sw = w != null ? Math.sin(w * TAU) : 0;
  const bob = w != null ? -Math.abs(sw) * 3 : ch != null ? Math.sin(ch * TAU) * 2.5 : 0, rock = w != null ? sw * .04 : 0, lean = ch != null ? .08 : 0, wave = w != null ? Math.sin(w * TAU * 2) * 4 : ch != null ? Math.sin(ch * TAU) * 3 : 0;
  S.shadow(g, 0, 50, 52, 8);
  // banner behind everything
  S.tube(g, SO([[44, 34], [44, -98]]), WOOD, 4); metal(g, PL([[40, -98], [48, -98], [44, -110]]), GOLD, { x:44, y:-102, r:6 }, { flat:true });
  const flag = SM([[44, -96, 1], [78 + wave, -92], [70 + wave * .4, -74], [80 + wave, -56], [44, -60, 1]], .7); S.part(g, flag, BANNER, { x:60, y:-76, r:22 }, { mat:'cloth', flat:true, hx:52, hy:-88 }); S.crease(g, SO([[54, -92], [58 + wave * .3, -62]]), BANNER, 1.4, .4); batSigil(g, 60 + wave * .4, -76, .9);
  for (const s of [-1, 1]){ const [dx, dy] = stride(w, s, 5, 6); S.tube(g, SO([[s * 14, 20], [s * 16 + dx * .5, 32 + dy * .5], [s * 17 + dx, 42 + dy]]), IRON, 14); metal(g, RR(s * 17 - 6 + dx * .5, 24 + dy * .5, 12, 16, 4), STEEL, { x:s * 17 + dx * .5, y:32 + dy * .5, r:9 }, { flat:true }); boot(g, s * 18 + dx, 45 + dy, STEELD, 11); }
  g.save(); g.translate(0, 46); g.rotate(lean + rock); g.translate(0, -46 + bob);
  for (const x of [-26, -9, 8, 25]) metal(g, RR(x - 8, 16, 17, 20, 4), STEELD, { x:x + .5, y:26, r:10 }, { flat:true });
  const torso = SM([[-30, -16], [-34, 6], [-30, 24], [0, 28], [30, 24], [34, 6], [30, -16], [0, -22]], .85); metal(g, torso, STEEL, { x:0, y:2, r:34 }, { hx:-14, hy:-10 });
  S.part(g, SM([[-9, -20], [9, -20], [11, 24], [0, 28], [-11, 24]], .6), CRIM, { x:0, y:4, r:14 }, { flat:true, mat:'cloth' }); batSigil(g, 0, 2, .7);
  S.ln(g, [[-30, 4], [-12, 8]], STEEL, 1.4, .6); S.ln(g, [[30, 4], [12, 8]], STEEL, 1.4, .6); for (const [x, y] of [[-24, -8], [24, -8], [-26, 12], [26, 12]]) S.rivet(g, x, y, 2, STEEL);
  for (const s of [-1, 1]){ metal(g, SM([[s * 16, -18], [s * 34, -24], [s * 46, -10], [s * 40, 6], [s * 22, 0]], .75), STEEL, { x:s * 32, y:-10, r:16 }, { hx:s * 28 - 6, hy:-18 }); metal(g, PL([[s * 30, -22], [s * 40, -22], [s * 38, -38]]), STEEL, { x:s * 36, y:-28, r:8 }, { flat:true }); S.rivet(g, s * 34, -8, 2, STEEL); }
  // arms: tower shield on the left arm, banner pole in the right hand
  S.tube(g, SO([[-34, -4], [-44, 10], [-46, 26]]), IRON, 11); S.tube(g, SO([[34, -4], [42, 10], [44, 14]]), IRON, 11); gauntlet(g, 44, 14, 8);
  const shield = RR(-68, -36, 34, 90, 8); metal(g, shield, STEEL, { x:-51, y:8, r:46 }, { hx:-60, hy:-20 }); S.part(g, RR(-64, -32, 26, 82, 6), STEELD, { x:-51, y:8, r:40 }, { flat:true, mat:'metal', noEdge:true }); S.part(g, RR(-58, -18, 14, 52, 4), CRIM, { x:-51, y:8, r:26 }, { flat:true, mat:'paint' }); batSigil(g, -51, 8, .6);
  for (const [x, y] of [[-63, -30], [-39, -30], [-63, 48], [-39, 48], [-63, 8], [-39, 8]]) S.rivet(g, x, y, 2.2, STEEL);
  // great helm with a crimson comb and a glowing cross visor
  S.tube(g, SO([[0, -74], [0, -86]]), CRIM, 8); S.part(g, SM([[-4, -72], [-6, -90], [0, -96], [6, -90], [4, -72]], .7), CRIM, { x:0, y:-84, r:10 }, { flat:true, mat:'cloth' });
  const helm = SM([[-24, -40], [-25, -70, 1], [25, -70, 1], [24, -40], [14, -26], [0, -24], [-14, -26]], .7); metal(g, helm, STEEL, { x:0, y:-48, r:27 }, { hx:-12, hy:-62 });
  S.ln(g, [[-25, -66], [25, -66]], STEEL, 1.2, .5); for (const x of [-18, -6, 6, 18]) S.rivet(g, x, -68, 1.6, STEEL);
  S.dot(g, RR(-18, -56, 36, 7, 3), '#161824'); S.dot(g, RR(-3.5, -56, 7, 24, 3), '#161824'); for (const [x, y] of [[-10, -36], [-6, -34], [6, -34], [10, -36]]) S.dot(g, E(x, y, 1.2, 1.2), '#161824', .8);
  S.glow(g, -8, -52.5, 3, EYE_BULWARK); S.glow(g, 8, -52.5, 3, EYE_BULWARK);
  g.restore();
}

// ---------- The Vampire Count ----------
// An elegant, sinister count: a long pale face with a pointed chin, high cheekbones over hollow cheeks and a widow's peak; slim slanted
// almond eyes under heavy lids with small pupils in crimson irises; thin arched brows; a thin mouth with two long fangs; long fingers
// tipped with claws; a slim double-breasted suit under a tall collar; a cape hanging in long folds.
// Full form (level 20, pose.variant 'form2'): 12% taller about the feet, a near-black cape with a brighter blood lining that flares wider,
// spread bat wings behind it, a gold crown, longer claws, eyes that always burn crimson with a trailing glow, and blood running from the fangs.
// Trance clip: eyes closed, head tilted back, arms crossed, and a wide pulsing blood-red aura with expanding rings and rising motes
// (baked into the frames; the registry box is tall enough to hold it in both forms).
const CAPE2 = pal('#150610'), LINING2 = pal('#c4162c'), SUIT2 = pal('#20090f'), VEST2 = pal('#8c1424'), WINGM = pal('#2c0a1c'), WINGB = pal('#4a1a2e'), VC_EYE = '#ff2838';
const VC_SKIN = pal('#e8dfe6'), VC_LASH = { deep:'#2a141c' };
export function vampirecount(g, P = {}){
  const F2 = P.variant === 'form2';
  const idle = P.idle, tr = P.trance, st = P.stun, ba = P.bats, wa = P.wall, tp = P.teleport ?? 0;
  const capeC = F2 ? CAPE2 : CAPE, lining = F2 ? LINING2 : LINING, suit = F2 ? SUIT2 : SUIT, vest = F2 ? VEST2 : VEST, skin = VC_SKIN;
  const ph = idle ?? tr ?? st ?? 0, hover = Math.sin(ph * TAU) * 3, pulse = tr == null ? 0 : (Math.sin(tr * TAU) + 1) / 2;
  const R = rng(31);
  // long elegant hand: a small palm, four slender fingers that curl a little, each tipped with a claw (longer in the full form)
  const hand = (x, y, dir) => { const len = F2 ? 13 : 10, cl = F2 ? 7 : 5;
    for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * .34, L = len * (i === 0 || i === 3 ? .86 : 1), fx = x + Math.cos(a) * L, fy = y + Math.sin(a) * L, mx = x + Math.cos(a) * L * .5 - Math.sin(a) * 1.4, my = y + Math.sin(a) * L * .5 + Math.cos(a) * 1.4;
      S.tube(g, SO([[x, y], [mx, my], [fx, fy]]), skin, 2.7); S.claw(g, fx + Math.cos(a) * 1.2, fy + Math.sin(a) * 1.2, a, cl, '#ece4f4'); }
    S.part(g, E(x, y, 5.2, 4.8), skin, { x, y, r:5.2 }, { flat:true, mat:'skin' }); };
  // almond eye on side s (outer corner lifted): white, crimson iris with a small pupil, a heavy upper lid with a lash line that wings out.
  // o.closed draws the serene closed lid instead; o.lid deepens the lid (dazed); o.dx/dy/ir move and size the iris.
  const eye = (s, x, y, o = {}) => {
    const ix = x - s * 8, ox = x + s * 8.5, cx = x + s * .5;
    if (o.closed){
      const lid = g2 => { g2.beginPath(); g2.moveTo(ix, y - .5); g2.quadraticCurveTo(cx, y + 5.5, ox, y - 2.5); };
      S.stroke(g, lid, VC_LASH, 1.8, .9);
      for (let i = 0; i < 3; i++){ const t = .62 + i * .15, lx = ix + (ox - ix) * t, ly = y - .5 + Math.sin(t * Math.PI) * 4.2 - (t - .5) * 2; S.ln(g, [[lx, ly], [lx + s * 1.3, ly + 3]], VC_LASH, 1, .8); }
      S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(ix + s * 2.5, y - 4.5); g2.quadraticCurveTo(cx, y - 7.5, ox - s * 1.5, y - 7); }, skin, 1.2, .4);   // the fold above the lid
      return; }
    const shape = SM([[ix, y + 1, 1], [x - s * 1.5, y - 5], [x + s * 4.5, y - 4.4], [ox, y - 2.5, 1], [x + s * 2.5, y + 3.6], [x - s * 4, y + 2.6]], .8);
    g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 3; g.shadowOffsetY = 1; shape(g); g.fillStyle = '#fbf7f9'; g.fill(); g.restore();
    g.save(); shape(g); g.clip();
    let gr = g.createLinearGradient(0, y - 5, 0, y + 1.5); gr.addColorStop(0, 'rgba(70,30,60,.4)'); gr.addColorStop(1, 'rgba(70,30,60,0)'); g.fillStyle = gr; g.fillRect(x - 14, y - 8, 28, 16);
    const lidT = o.lid ?? .3, px = cx + s * (o.dx ?? 0), py = y - .6 + (o.dy ?? 0), ir = o.ir ?? 3.6;
    gr = g.createRadialGradient(px - ir * .3, py - ir * .3, ir * .1, px, py, ir); gr.addColorStop(0, o.irisL); gr.addColorStop(.7, o.iris); gr.addColorStop(1, o.irisD); ell(g, px, py, ir, ir); g.fillStyle = gr; g.fill();
    ell(g, px, py, ir, ir); g.strokeStyle = rgba(o.irisD, .8); g.lineWidth = .7; g.stroke();
    S.dot(g, E(px, py, ir * .42, ir * .46), '#12060c');
    g.fillStyle = 'rgba(255,255,255,.9)'; ell(g, px - ir * .35, py - ir * .4, ir * .3, ir * .22, -.5); g.fill();
    g.fillStyle = mix(skin.base, skin.dark, .3); g.beginPath(); g.moveTo(ix, y + 1); g.quadraticCurveTo(cx, y - 5 + lidT * 4, ox, y - 2.5); g.lineTo(ox + s * 8, y - 16); g.lineTo(ix - s * 8, y - 16); g.closePath(); g.fill();   // heavy upper lid
    g.restore();
    S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(ix, y + 1); g2.quadraticCurveTo(cx, y - 5 + lidT * 4, ox, y - 2.5); g2.lineTo(ox + s * 2.5, y - 4.5); }, VC_LASH, 1.5, .9);   // lash line with a wing
    S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(ix, y + 1); g2.quadraticCurveTo(x + s * 2, y + 4.6, ox, y - 2.5); }, VC_LASH, .8, .35); };
  // thin arched brow; knot > 0 pulls the inner end down (menace), < 0 lifts it (serene / dazed)
  const brow = (s, x, y, knot = 0) => { const p = g2 => { g2.beginPath(); g2.moveTo(x - s * 6, y + knot); g2.quadraticCurveTo(x + s * 2, y - 6 - knot * .2, x + s * 13, y - 2); }; S.stroke(g, p, HAIR, 2.2, .95); S.stroke(g, p, { deep:HAIR.light }, .7, .35); };
  // form-2 wing: three bone fingers from the shoulder blade with a scalloped membrane; L lifts the tips, sp spreads them
  const wing = (s, L, sp) => { const root = [s * 22, -54], tips = [[s * (60 + sp * 6), -118 + L], [s * (104 + sp * 8), -92 + L * .6], [s * (114 + sp * 6), -44 + L * .3], [s * 46, 12]];
    const pts = [[root[0], root[1] - 6, 1], [s * 40, -82 + L * .4]];
    for (let i = 0; i < tips.length; i++){ pts.push([tips[i][0], tips[i][1], 1]); if (i < tips.length - 1){ const a = tips[i], b = tips[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; pts.push([mx + (root[0] - mx) * .32, my + (root[1] - my) * .32]); } }
    pts.push([root[0], root[1] + 8, 1]);
    S.part(g, SM(pts, .9), WINGM, { x:s * 66, y:-56, r:64 }, { mat:'leather', hx:s * 62, hy:-82 });
    for (let i = 0; i < 3; i++){ const t = tips[i]; S.tube(g, SO([root, [(root[0] + t[0]) / 2 + s * 3, (root[1] + t[1]) / 2 - 5], t]), WINGB, 4.2); S.claw(g, t[0], t[1], Math.atan2(t[1] - root[1], t[0] - root[0]), 5, '#e8e0f0'); } };
  if (F2){ g.save(); g.translate(0, 46); g.scale(1.12, 1.12); g.translate(0, -46); }
  // burst into bats (teleport clip plays backwards as it reforms in a new lane)
  if (tp > 0){ for (let i = 0; i < 9; i++){ const a = R() * TAU, d = 20 + tp * (50 + R() * 40), x = Math.cos(a) * d, y = -24 + Math.sin(a) * d * .8 - tp * 10, al = tp < .2 ? tp / .2 : 1 - Math.max(0, tp - .8) / .2; g.save(); g.globalAlpha *= al; miniBat(g, x, y, .55 + R() * .3, Math.sin(tp * 12 + i)); g.restore(); }
    if (tp >= 1){ if (F2) g.restore(); return; } }
  if (tr != null){   // blood aura behind everything: a wide pulsing glow, two expanding rings, rising motes
    g.save(); g.translate(0, -26); g.scale(1, .8);
    const rr = 112 + pulse * 16; const gr = g.createRadialGradient(0, 0, 4, 0, 0, rr);
    gr.addColorStop(0, `rgba(255,90,95,${.8 + pulse * .2})`); gr.addColorStop(.28, `rgba(245,40,55,${.6 + pulse * .22})`); gr.addColorStop(.62, `rgba(215,15,45,${.26 + pulse * .14})`); gr.addColorStop(1, 'rgba(180,0,30,0)');
    g.fillStyle = gr; g.fillRect(-150, -190, 300, 380);
    for (const off of [0, .5]){ const q = (tr + off) % 1, rad = 38 + q * 84; g.save(); g.shadowColor = '#ff5060'; g.shadowBlur = 6; g.strokeStyle = `rgba(255,160,165,${(1 - q) * .9})`; g.lineWidth = 4 - q * 2.2; ell(g, 0, 0, rad, rad); g.stroke(); g.restore(); }
    g.restore();
    const M = rng(77); g.save(); g.shadowColor = '#ff4050'; g.shadowBlur = 8;
    for (let i = 0; i < 10; i++){ const x0 = (M() - .5) * 120, phs = M(), sz = 2.2 + M() * 2.4, wob = M() * TAU, q = (tr + phs) % 1, y = 44 - q * 150, x = x0 + Math.sin(q * 5 + wob) * 6, al = Math.sin(q * Math.PI);
      S.dot(g, E(x, y, sz, sz * 1.3), '#ff6a70', al * .95); S.dot(g, E(x - sz * .3, y - sz * .4, sz * .35, sz * .35), '#fff0f0', al * .8); }
    g.restore(); }
  g.save(); g.globalAlpha *= 1 - tp; S.shadow(g, 0, 54, 40 - Math.abs(hover) * 2, 7); g.restore();
  g.save(); g.globalAlpha *= 1 - tp; g.translate(0, -20); g.scale(1 - tp * .3, 1 - tp * .3); g.translate(0, 20 + hover);
  if (st != null){ g.translate(0, 8); g.rotate(Math.sin(st * TAU) * .1); }
  const flare = ba != null ? Math.sin(Math.min(1, ba * 1.6) * Math.PI) : 0, spread = wa != null ? Math.sin(Math.min(1, wa * 1.4) * Math.PI / 2) : 0;   // cape flung right for bats, spread both sides for a wall
  if (F2){ const L = st != null ? 16 : tr != null ? -4 - pulse * 6 : idle != null ? Math.sin(idle * TAU) * 6 : -6 - flare * 16 - spread * 12, sp = flare + spread; wing(-1, L, sp); wing(1, L + flare * -6, sp); }
  // cape: hangs from the shoulders in long folds, the hem cut into points; lining shows inside
  const capeR = 56 + flare * 26 + spread * 18 + (F2 ? 8 : 0), capeL = 56 + spread * 18 + (F2 ? 8 : 0), drift = idle != null ? Math.sin(idle * TAU + 2) * 4 : 0;
  const cape = SM([[-28, -84], [-40, -50], [-capeL, 32 + drift, 1], [-44, 26, 1], [-31, 48, 1], [-16, 34, 1], [0, 52, 1], [16, 34, 1], [31, 48, 1], [44, 26, 1], [capeR, 32 - drift - flare * 30, 1], [40 + flare * 10, -50 - flare * 10], [28, -84]], .8);
  S.part(g, cape, capeC, { x:0, y:-20, r:70 }, { mat:'cloth', hx:-28, hy:-52 });
  for (const s of [-1, 1]){ S.crease(g, SO([[s * 34, -46], [s * 44, -6], [s * (capeL - 8) * (s > 0 ? capeR / capeL : 1), 24]]), capeC, 2, .42); S.crease(g, SO([[s * 24, -40], [s * 28, 0], [s * 30, 38]]), capeC, 1.6, .32); S.crease(g, SO([[s * 12, -30], [s * 13, 10], [s * 14, 36]]), capeC, 1.3, .26); }
  const liningP = SM([[-22, -62], [-32, -30], [-38 - (F2 ? 6 : 0), 22], [-19, 32], [0, 38], [19, 32], [38 + (F2 ? 6 : 0), 22], [32, -30], [22, -62]], .8); S.part(g, liningP, lining, { x:0, y:-10, r:44 }, { flat:true, mat:'cloth', noEdge:true, hx:-16, hy:-40 });
  for (const s of [-1, 1]) S.crease(g, SO([[s * 14, -40], [s * 18, 20]]), lining, 1.4, .3);
  // tall collar rising past the head
  const collar = SM([[-32, -40], [-40, -114, 1], [-32, -104, 1], [-18, -88], [0, -82], [18, -88], [32, -104, 1], [40, -114, 1], [32, -40]], .8); S.part(g, collar, lining, { x:0, y:-76, r:38 }, { mat:'cloth', flat:true, hx:-20, hy:-98 }); S.stroke(g, collar, capeC, 2.4, .85);
  // slim legs and pointed shoes
  for (const s of [-1, 1]){ S.tube(g, SO([[s * 8, 22], [s * 9, 38]]), suit, 7); S.part(g, SM([[s * 3, 36], [s * 15, 36], [s * 23, 41, 1], [s * 12, 45], [s * 3, 44]], .6), HAIR, { x:s * 11, y:40, r:9 }, { flat:true, mat:'leather' }); }
  // slim torso: double-breasted vest with a pinched waist, lapels, shirt, cravat and medallion
  const torso = SM([[-20, -34], [-23, -10], [-17, 8], [-18, 26], [0, 30], [18, 26], [17, 8], [23, -10], [20, -34], [0, -38]], .85); S.part(g, torso, vest, { x:0, y:-6, r:30 }, { mat:'cloth' });
  for (const s of [-1, 1]) S.part(g, PL([[s * 20, -34], [s * 6, -34], [s * 12, 6], [s * 23, -10]]), suit, { x:s * 16, y:-14, r:14 }, { flat:true, mat:'cloth' });
  S.dot(g, PL([[-7, -38], [7, -38], [0, -22]]), '#f4eef0'); S.dot(g, PL([[-4, -36], [4, -36], [0, -29]]), lining.base);
  for (const y of [-10, 2, 14]) for (const s of [-1, 1]) S.rivet(g, s * 4.5, y, 1.5, GOLD);
  S.crease(g, SO([[-15, 2], [-14, 26]]), vest, 1.4, .4); S.crease(g, SO([[15, 2], [14, 26]]), vest, 1.4, .4);
  S.stroke(g, SO([[-12, -34], [-5, -22], [0, -18], [5, -22], [12, -34]]), { deep:GOLD.base }, 1.3, .95); S.part(g, E(0, -17, 5.5, 5.5), GOLD, { x:0, y:-17, r:5.5 }, { flat:true, mat:'metal' }); S.dot(g, E(0, -17, 2.6, 2.6), '#e0203a'); S.dot(g, E(-.8, -18, .8, .8), '#fff', .9);
  if (F2){ g.save(); g.shadowColor = VC_EYE; g.shadowBlur = 8; S.dot(g, E(0, -17, 3, 3), '#ff3040', .8); g.restore(); }
  batSigil(g, 0, -42, .42, mix(GOLD.base, '#ffffff', .1));
  // arms and clawed hands, posed per clip
  const arm = (s, mid, hx, hy, dir) => { S.tube(g, SO([[s * 20, -28], mid, [hx, hy]]), suit, 8); hand(hx, hy, dir); };
  if (tr != null){ arm(-1, [-6, -6], 16, -6, -.15); arm(1, [6, -2], -16, -1, Math.PI + .15); }
  else if (st != null){ const d = Math.sin(st * TAU) * 6; arm(-1, [-36, 0], -40, 22 + d, Math.PI / 2 + .4); arm(1, [36, 0], 40, 22 - d, Math.PI / 2 - .4); }
  else if (ba != null){ arm(-1, [-32, -6], -34, 18, Math.PI / 2 + .3); const e = Math.sin(Math.min(1, ba * 1.6) * Math.PI / 2); arm(1, [24 + e * 20, -16 - e * 18], 34 + e * 30, 12 - e * 50, -.6 - e * .4);
    for (let i = 0; i < 5; i++){ const q = Math.max(0, ba - .25 - i * .08) / .75; if (q <= 0) continue; const a = -1.1 + i * .38, x = 40 + Math.cos(a) * q * 70, y = -30 + Math.sin(a) * q * 60; g.save(); g.globalAlpha *= Math.max(0, 1 - q); miniBat(g, x, y, .5 + i * .06, Math.sin(ba * 20 + i)); g.restore(); } }
  else if (wa != null){ const u = spread; for (const s of [-1, 1]){ arm(s, [s * (34 - u * 4), -30 - u * 30], s * (38 - u * 4), -20 - u * 74, -Math.PI / 2 + s * .3);
      if (u > .3){ g.save(); g.shadowColor = '#d8b8ff'; g.shadowBlur = 14; S.dot(g, E(s * (38 - u * 4), -28 - u * 74, 9 * u, 9 * u), '#c8a8f0', .55 * u); g.restore(); } } }
  else { const f = Math.sin(ph * TAU) * .12; arm(-1, [-36, -8], -38, 20, Math.PI / 2 + .35 + f); arm(1, [36, -8], 38, 20, Math.PI / 2 - .35 - f); }
  // head: long pale face with a pointed chin, high cheekbones over hollow cheeks, tall pointed ears, slicked hair with a widow's peak
  g.save(); if (tr != null){ g.translate(0, -33); g.rotate(-.05); g.translate(0, 30); }   // trance: chin lifted, head tipped back a touch
  for (const s of [-1, 1]) S.part(g, PL([[s * 17, -64], [s * 30, -82], [s * 20, -48]]), skin, { x:s * 22, y:-64, r:8 }, { flat:true, mat:'skin' });
  const head = SM([[-19, -72], [-21, -56], [-18, -40], [-9, -24], [0, -16, 1], [9, -24], [18, -40], [21, -56], [19, -72], [10, -88], [-10, -88]], .85); S.part(g, head, skin, { x:0, y:-56, r:30 }, { mat:'skin', hx:-9, hy:-76 });
  S.contact(g, torso, 0, -30, 16, 6, .45);
  for (const s of [-1, 1]){ S.contact(g, head, s * 13, -36, 8, 11, .3); S.dot(g, E(s * 15.5, -47, 4, 2.4, s * .5), '#ffffff', .22); }   // hollow cheeks under lit cheekbones
  S.ln(g, [[-1.5, -48], [-3.5, -38], [-.5, -36]], { deep:skin.deep }, 1.2, .4); S.dot(g, E(1.5, -45, 1.4, 3), '#ffffff', .3);   // straight sharp nose
  const hair = SM([[-22, -62], [-25, -80], [-13, -94], [0, -92], [13, -94], [25, -80], [22, -62], [12, -77], [0, -67, 1], [-12, -77]], .8); S.part(g, hair, HAIR, { x:0, y:-80, r:26 }, { mat:'leather', hx:-10, hy:-86 });
  S.crease(g, SO([[-15, -89], [-7, -74]]), { deep:'#9a8ea0', rim:'#9a8ea0' }, 1.5, .5); S.crease(g, SO([[13, -89], [7, -76]]), { deep:'#9a8ea0', rim:'#9a8ea0' }, 1.1, .35); S.crease(g, SO([[-3, -91], [-1, -76]]), { deep:'#9a8ea0', rim:'#9a8ea0' }, 1, .3);
  if (F2){   // gold crown set into the hair, a blood gem at its peak
    S.part(g, SM([[-22, -80], [-24, -92], [-16, -87], [-12, -104, 1], [-6, -89], [0, -110, 1], [6, -89], [12, -104, 1], [16, -87], [24, -92], [22, -80]], .5), GOLD, { x:0, y:-90, r:24 }, { mat:'metal', flat:true, hx:-10, hy:-88 });
    for (const x of [-12, 0, 12]) S.dot(g, E(x, x ? -103 : -109, 1.6, 1.6), '#fff4c0', .9);
    S.part(g, E(0, -90, 3.4, 4), CRIM, { x:0, y:-90, r:3.4 }, { flat:true, lw:.8 }); S.dot(g, E(-1, -91.5, 1, 1), '#fff', .9); }
  // eyes: slim, slanted and heavy-lidded; closed in the trance; dazed under deeper lids when stunned
  const ey = -53, irisC = F2 ? { irisL:'#ff8a8a', iris:'#e01828', irisD:'#7a0414' } : { irisL:'#ff9a9a', iris:'#d82a3a', irisD:'#7c0c1c' };
  if (F2){ g.save(); for (const s of [-1, 1]){ const gr = g.createRadialGradient(s * 9.5, ey, 2, s * 9.5, ey, 26); gr.addColorStop(0, `rgba(255,40,60,${tr != null ? .3 : .5})`); gr.addColorStop(1, 'rgba(255,40,60,0)'); g.fillStyle = gr; g.save(); g.translate(s * 9.5, ey); g.scale(1.4, .4); g.translate(-s * 9.5, -ey); ell(g, s * 9.5 + s * 8, ey, 26, 26); g.fill(); g.restore(); } g.restore();   // trailing crimson glow streaming from the eyes
    if (tr == null) for (const s of [-1, 1]) S.glow(g, s * 9.5, ey, 5 + pulse * 2, VC_EYE); }
  if (tr != null) for (const s of [-1, 1]){ eye(s, s * 9.5, ey, { closed:true }); brow(s, s * 9.5, ey - 10, -1.5); }
  else if (st != null){ for (const s of [-1, 1]){ eye(s, s * 9.5, ey, { ...irisC, lid:.7, dx:2.2, dy:.4, ir:3 }); brow(s, s * 9.5, ey - 10, -2.5); } }
  else for (const s of [-1, 1]){ eye(s, s * 9.5, ey, irisC); brow(s, s * 9.5, ey - 9, F2 ? 4 : 2.5); }
  // thin mouth with one corner raised, two long fangs; opens into a snarl for bats and walls
  const grin = wa != null || ba != null, my = -30;
  if (grin) S.dot(g, SM([[-8, my], [0, my + .5], [8, my - 1.5], [4, my + 5], [-4, my + 5.5]], .7), '#3a0c18');
  S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(-8, my); g2.quadraticCurveTo(-3, my + 1.6, 0, my + 1.2); g2.quadraticCurveTo(4, my + .8, 8, my - 2); }, VC_LASH, 1.4, .85);
  const fl = F2 ? 9 : 7.5;
  for (const s of [-1, 1]){ const fx = s * 4.6; S.dot(g, PL([[fx - 1.5, my + .2], [fx + 1.5, my + .2], [fx + s * .3, my + fl]]), '#f8f3f4'); S.ln(g, [[fx + s * 1.2, my + .6], [fx + s * .3, my + fl]], { deep:'#8a7a80' }, .6, .6); }
  if (F2) for (const s of [-1, 1]){ const fx = s * 4.6 + s * .3, ty = my + fl - 1, ext = s > 0 ? 3 : 0; S.dot(g, RR(fx - .8, ty, 1.6, 5 + ext, .8), '#b00c24', .95); S.dot(g, E(fx, ty + 5.5 + ext, 1.6, 2), '#c8102a', .95); S.dot(g, E(fx - .5, ty + 4.8 + ext, .5, .6), '#ff9aa0', .9); }   // blood running from the fangs
  g.restore();
  if (tr != null){ g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, -20, 6, 0, -20, 78); gr.addColorStop(0, `rgba(255,40,50,${.22 + pulse * .16})`); gr.addColorStop(1, 'rgba(255,40,50,0)'); g.fillStyle = gr; g.fillRect(-90, -110, 180, 180); g.restore(); }   // the figure itself glows blood-red with the aura
  if (st != null) for (let i = 0; i < 3; i++){ const a = st * TAU + i * TAU / 3, x = Math.cos(a) * 30, y = -104 + Math.sin(a) * 7; star(g, x, y, 4.5 + Math.sin(a) * 1, '#ffd35a'); }
  g.restore();
  if (F2) g.restore();
}

// ---------- registry ----------
// scale/dy fit the drawing to the in-game footprint (feet at about r × 0.95 below the monster's centre).
// box is the frame in drawing units; clips are baked by anim.js: n frames at fps; `once` clips play a single time.
const loop = (m, cl) => Math.floor(m.ph * cl.fps) % cl.n;
export const W4 = {
  knight: { draw:knight, scale:.66, dy:-12, box:{ x:-64, y:-82, w:128, h:138 }, clips:{ walk:{ n:8, fps:9, pose:t => ({ walk:t, up:true }) }, rest:{ n:4, fps:4, pose:t => ({ rest:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) } }, still:{ up:true },
    frame(m, clips){ if (m.shield || m.eating) return null; return ['rest', loop(m, clips.rest)]; } },   // shield up → march; down → rest (or chew at the wall)
  hauler: { draw:hauler, scale:.66, dy:-12, box:{ x:-56, y:-66, w:112, h:126 }, clips:{ walk:{ n:8, fps:12, pose:t => ({ walk:t }) }, push:{ n:8, fps:6, pose:t => ({ push:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) } }, still:{ push:0 },
    frame(m, clips){ if (m.freed || m.eating) return null; return ['push', loop(m, clips.push)]; } },   // straining on the rope until every gargoyle is dead, then sprinting
  gargoyle: { draw:gargoyle, scale:.72, dy:-13, box:{ x:-52, y:-58, w:104, h:114 }, clips:{ walk:{ n:8, fps:5, pose:t => ({ walk:t }) }, chew:{ n:4, fps:6, pose:t => ({ chew:t }) } }, still:{} },
  archer: { draw:archer, scale:.66, dy:-14, box:{ x:-50, y:-78, w:100, h:134 }, clips:{ walk:{ n:8, fps:9, pose:t => ({ walk:t }) }, hold:{ n:4, fps:4, pose:t => ({ hold:t }) }, draw:{ n:6, fps:14, once:true, pose:t => ({ draw:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) } }, still:{ hold:0 },
    frame(m, clips){ if (m.eating || m.p < m.hold) return null; if (m.shootT > 0 && m.shootT < ARCHER_DRAW){ const n = clips.draw.n; return ['draw', Math.min(n - 1, Math.floor((1 - m.shootT / ARCHER_DRAW) * n))]; } return ['hold', loop(m, clips.hold)]; } },   // nocks and looses in the last 0.35 s before a shot; otherwise stands ready at its hold point
  vampire: { draw:vampire, scale:.74, dy:-14, box:{ x:-80, y:-80, w:160, h:136 }, clips:{ walk:{ n:8, fps:8, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, heal:{ n:6, fps:8, pose:t => ({ heal:t }) } }, still:{},
    frame(m, clips){ if (!m.eating && m.calmT >= VAMPIRE_CALM && m.hp < m.maxHp) return ['heal', loop(m, clips.heal)]; return null; } },   // red pulse while it regenerates (calm for 2 s, not full)
  bulwark: { draw:bulwark, scale:.8, dy:-15, box:{ x:-74, y:-114, w:162, h:172 }, clips:{ walk:{ n:8, fps:5, pose:t => ({ walk:t }) }, chew:{ n:4, fps:6, pose:t => ({ chew:t }) } }, still:{} },
  vampirecount: { draw:vampirecount, scale:.76, dy:-6, box:{ x:-140, y:-176, w:280, h:262 }, variants:{ form2:true }, clips:{ walk:{ n:8, fps:6, pose:t => ({ idle:t }) }, trance:{ n:8, fps:8, pose:t => ({ trance:t }) }, stun:{ n:6, fps:8, pose:t => ({ stun:t }) }, bats:{ n:8, fps:12, once:true, pose:t => ({ bats:t }) }, wall:{ n:8, fps:10, once:true, pose:t => ({ wall:t }) }, teleport:{ n:8, fps:16, once:true, pose:t => ({ teleport:t }) } }, still:{},   // box holds the winged, crowned, 12% taller full form and the trance aura too (shared atlas box)
    frame(m, clips){ if (m.stunT > 0) return ['stun', loop(m, clips.stun)]; if (m.healing) return ['trance', loop(m, clips.trance)]; return null; } },   // bats / wall play through m.anim hints; teleport reforms it from bats after a lane burst (m.age reset)
};
