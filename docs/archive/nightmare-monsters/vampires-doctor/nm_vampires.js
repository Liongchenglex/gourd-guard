// ---------- Nightmare vampires (nightmare Crumbling Keep), design archive ----------
// A copy of `vampire` from src/engine/render/chars/w4.js (with the helpers it uses) plus two nightmare looks picked by P.variant:
//   'glutton': the Blood Glutton, a squat, gorged brute: barrel body bursting a crimson waistcoat, huge arms in broken
//              manacles, a bald head with a lightning scar, tusks and a blood-smeared chin; drinks from an iron goblet to heal.
//   'bride':   the Bat Bride, a tall, slim noble lady who floats: a bat-wing mantle standing up behind her, long black hair with
//              a white lightning lock, an iron tiara and torn veil, a crimson gown whose hem breaks up into bats.
// No variant draws the game's vampire unchanged. Every pose param (walk, chew, heal) works for all three.
// NOT for the game: lives in the owner's design archive.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';

// ---------- palettes copied from w4.js ----------
const GOLD = pal('#e2b24c'), CAPE = pal('#2e1122'), LINING = pal('#ac2140'), SUIT = pal('#3c1526'), PALE = pal('#eee2de'), HAIR = pal('#201519'), BATC = pal('#3a2040');
const VAMPIRE_CALM = 2;

// ---------- helpers copied from w4.js ----------
/** Foot offset for a walking leg: [dx, dy] with the two legs half a cycle apart. */
const stride = (w, s, amp = 5, lift = 7) => { if (w == null) return [0, 0]; const ph = w * TAU + (s < 0 ? 0 : Math.PI); return [Math.cos(ph) * amp, -Math.max(0, Math.sin(ph)) * lift]; };
/** A chunky boot seen from the front. */
function boot(g, x, y, c, r = 9){ const p = SM([[x - r, y - r * .6], [x + r, y - r * .6], [x + r * 1.15, y + r * .2], [x + r * .6, y + r * .55], [x - r * .6, y + r * .55], [x - r * 1.15, y + r * .2]], .7); S.part(g, p, c, { x, y:y - r * .2, r }, { flat:true, mat:'leather' }); S.ln(g, [[x - r * .7, y - r * .05], [x + r * .7, y - r * .05]], c, 1, .45); }
/** Pale clawed hand: palm plus long fingers ending in claws. dir = where the fingers point. */
function clawHand(g, x, y, c, dir, r = 6, len = 8){ for (let i = 0; i < 4; i++){ const a = dir + (i - 1.5) * .42, fx = x + Math.cos(a) * len, fy = y + Math.sin(a) * len; S.tube(g, SO([[x, y], [fx, fy]]), c, 3.2); S.claw(g, fx + Math.cos(a) * 1.5, fy + Math.sin(a) * 1.5, a, 4.5, '#e8e0f0'); } S.part(g, E(x, y, r, r * .9), c, { x, y, r }, { flat:true, mat:'skin' }); }
/** A small bat silhouette. */
function miniBat(g, x, y, s, flap){ g.save(); g.translate(x, y); g.scale(s, s); const lift = flap * 6; for (const d of [-1, 1]) S.dot(g, SM([[d * 3, 0], [d * 10, -6 - lift], [d * 20, -8 - lift], [d * 18, 0, 1], [d * 14, 4, 1], [d * 8, 2, 1]], .7), BATC.dark, .95); S.dot(g, E(0, 0, 4, 5), BATC.base); S.dot(g, PL([[-3, -3], [-5, -9], [-1, -5]]), BATC.base); S.dot(g, PL([[3, -3], [5, -9], [1, -5]]), BATC.base); S.dot(g, E(-1.5, -1, .9, .9), '#ff4a4a'); S.dot(g, E(1.5, -1, .9, .9), '#ff4a4a'); g.restore(); }

// ---------- the game's Vampire (copied unchanged; the two nightmare looks branch off at the top) ----------
export function nmVampire(g, P = {}){
  if (P.variant === 'glutton') return glutton(g, P);
  if (P.variant === 'bride') return bride(g, P);
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


// ---------- nightmare palettes: storm navy, rain-black, crimson ----------
const STORM = '#c8d4ff', BOLT = '#f2f7ff', BLOODC = '#c8101e';
const G_SKIN = pal('#d9b4bd'), G_COAT = pal('#30395c'), G_VEST = pal('#a3122a'), G_SHIRT = pal('#d8cfd2'), G_TROU = pal('#232637'), G_BOOT = pal('#1c1418'),
  G_IRON = pal('#5a5f70'), G_CAPE = pal('#1c2238'), G_LIN = pal('#8e0f22'), G_GOB = pal('#4c505e'), BLOOD = pal('#c8101e');
const B_SKIN = pal('#e4e6f4'), B_HAIR = pal('#251a32'), B_GOWN = pal('#b3132c'), B_DARK = pal('#2a0a18'), B_WING = pal('#1c1226'), B_MEMB = pal('#6a1030'),
  B_GLOVE = pal('#1e1424'), B_IRON = pal('#3c4050'), B_GEM = pal('#e0203a');

/** Rain sheen: a few short lit streaks clipped to a part (the storm is on them). */
function rain(g, clip, x0, y0, w, h, seed){ const R = rng(seed); g.save(); clip(g); g.clip(); g.strokeStyle = 'rgba(200,212,255,.45)'; g.lineWidth = .9;
  for (let i = 0; i < 7; i++){ const x = x0 + R() * w, y = y0 + R() * h, l = 4 + R() * 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * .25, y + l); g.stroke(); } g.restore(); }
/** A drop of blood: teardrop with a highlight. */
function drop(g, x, y, s = 1){ S.part(g, SM([[x, y - 4 * s, 1], [x + 2.4 * s, y + 1 * s], [x, y + 3.4 * s], [x - 2.4 * s, y + 1 * s]], .9), BLOOD, { x, y, r:3 * s }, { flat:true, lw:.8 }); S.dot(g, E(x - .8 * s, y, .7 * s, 1 * s), '#ffd0d6', .8); }
/** Iron manacle on a wrist with two broken chain links swinging below it. */
function manacle(g, x, y, a, sw){ g.save(); g.translate(x, y); g.rotate(a);
  for (let i = 0; i < 2; i++){ const lx = Math.sin(sw) * (2 + i * 2), ly = 8 + i * 6; g.save(); g.translate(lx, ly); g.rotate(i % 2 ? 0 : Math.PI / 2); g.strokeStyle = G_IRON.deep; g.lineWidth = 3.2; ell(g, 0, 0, 3.4, 2.2); g.stroke(); g.strokeStyle = G_IRON.light; g.lineWidth = 1.4; ell(g, 0, 0, 3.4, 2.2); g.stroke(); g.restore(); }
  S.part(g, RR(-10, -4, 20, 8, 3), G_IRON, { x:0, y:0, r:10 }, { flat:true, mat:'metal' }); S.rivet(g, -5, 0, 1.4, G_IRON); S.rivet(g, 5, 0, 1.4, G_IRON);
  g.restore(); }
/** Heal aura copied from the game's vampire: a red pulse and a widening ring. */
function healAura(g, pulse, k = 1){ const rr = (52 + pulse * 12) * k, gr = g.createRadialGradient(0, 0, 4, 0, 0, rr); gr.addColorStop(0, `rgba(255,60,70,${.35 + pulse * .3})`); gr.addColorStop(.6, `rgba(255,40,60,${.18 + pulse * .15})`); gr.addColorStop(1, 'rgba(255,40,60,0)'); g.fillStyle = gr; g.fillRect(-100, -110, 200, 170);
  g.strokeStyle = `rgba(255,120,130,${.5 - pulse * .4})`; g.lineWidth = 2; ell(g, 0, 0, (30 + pulse * 34) * k, (36 + pulse * 30) * k); g.stroke(); }

// ---------- the Blood Glutton: squat, gorged, huge arms ----------
function glutton(g, P){
  const w = P.walk, ch = P.chew, he = P.heal;
  const sw = w != null ? Math.sin(w * TAU) : 0, pulse = he == null ? 0 : (Math.sin(he * TAU) + 1) / 2, lunge = ch == null ? 0 : (1 - Math.cos(ch * TAU)) / 2;
  const bob = w != null ? -Math.abs(Math.cos(w * TAU)) * 3 + 1.5 : ch != null ? lunge * 4 : he != null ? Math.sin(he * TAU) * 1.2 : 0, sway = w != null ? sw * .07 : 0;
  S.shadow(g, 0, 50, 44, 7);
  if (he != null) healAura(g, pulse, 1.1);
  // short, thick, bowed legs and heavy boots (outside the body sway so the feet stay planted)
  for (const s of [-1, 1]){ const [dx, dy] = stride(w, s, 4, 6); S.tube(g, SO([[s * 13, 18], [s * 20 + dx * .5, 32 + dy * .5], [s * 18 + dx, 42 + dy]]), G_TROU, 14); boot(g, s * 19 + dx, 46 + dy, G_BOOT, 11.5); }
  g.save(); g.translate(0, 46); g.rotate(sway); g.translate(0, -46 + bob);
  // ragged mantle behind the shoulders: rain-black, crimson lining at the slashes
  const mant = SM([[-30, -34], [-46, -16], [-50, 14, 1], [-42, 6, 1], [-36, 18, 1], [-28, 8, 1], [28, 8, 1], [36, 18, 1], [42, 6, 1], [50, 14, 1], [46, -16], [30, -34]], .8);
  S.part(g, mant, G_CAPE, { x:0, y:-8, r:48 }, { mat:'cloth', hx:-30, hy:-22 });
  for (const s of [-1, 1]) S.dot(g, PL([[s * 44, -6], [s * 47, 8], [s * 41, 2]]), G_LIN.base, .9);
  // barrel body: open storm-navy coat over a crimson waistcoat straining at the buttons, blood down the shirt
  const body = SM([[-30, -30], [-40, -6], [-38, 18], [-24, 32], [0, 36], [24, 32], [38, 18], [40, -6], [30, -30], [0, -34]], .85);
  S.part(g, body, G_COAT, { x:0, y:2, r:38 }, { mat:'cloth', hx:-22, hy:-16 });
  const belly = SM([[-20, -24], [-27, 0], [-23, 24], [0, 32], [23, 24], [27, 0], [20, -24], [0, -18]], .85);
  S.part(g, belly, G_VEST, { x:0, y:6, r:28 }, { mat:'cloth', hx:-10, hy:-6 });
  S.part(g, PL([[-11, -26], [11, -26], [0, -6]]), G_SHIRT, { x:0, y:-18, r:12 }, { flat:true, mat:'cloth' });
  S.dot(g, SM([[-4, -18], [3, -16], [5, -4], [1, 6], [-2, -2], [-5, -10]], .8), BLOOD.dark, .85);   // the stain spreading down the front
  for (const y of [0, 12, 23]){ S.rivet(g, 0, y, 2.4, GOLD); S.ln(g, [[-6, y - 3], [-1.5, y]], G_VEST, 1, .55); S.ln(g, [[6, y - 3], [1.5, y]], G_VEST, 1, .55); }   // buttons pulling the cloth
  S.crease(g, SO([[-30, -4], [-33, 22]]), G_COAT, 2, .45); S.crease(g, SO([[30, -4], [33, 22]]), G_COAT, 2, .45);
  rain(g, body, -38, -30, 76, 30, 7);
  // arms: huge, hanging and swinging on the walk; hammering the wall on the chew; raising the goblet on the heal
  const arm = (s, el, hx, hy, dir, a) => { S.tube(g, SO([[s * 30, -22], el, [hx, hy]]), G_COAT, 16); manacle(g, hx + Math.cos(dir + Math.PI) * 9, hy + Math.sin(dir + Math.PI) * 9, dir - Math.PI / 2, a); clawHand(g, hx, hy, G_SKIN, dir, 9, 10); };
  if (he != null){ const lift = (Math.sin(he * TAU) + 1) / 2;
    arm(-1, [-46, -4], -34, 16, Math.PI / 2 + .4, 0);   // the other hand rests on the belly
    S.tube(g, SO([[30, -22], [44, -6 - lift * 4], [24, -14 - lift * 6]]), G_COAT, 16);
    const gx = 18, gy = -20 - lift * 8;   // iron goblet raised to the mouth, brimming with blood
    S.part(g, SM([[gx - 9, gy - 10], [gx + 9, gy - 10], [gx + 7, gy], [gx + 2, gy + 4], [gx - 2, gy + 4], [gx - 7, gy]], .7), G_GOB, { x:gx, y:gy - 4, r:10 }, { mat:'metal' });
    S.tube(g, SO([[gx, gy + 4], [gx, gy + 11]]), G_GOB, 3.5); S.part(g, E(gx, gy + 12, 6, 2), G_GOB, { x:gx, y:gy + 12, r:6 }, { flat:true, mat:'metal' });
    S.dot(g, E(gx, gy - 10, 8.5, 2.4), BLOOD.base); S.dot(g, E(gx - 3, gy - 10.5, 3, .9), '#ff8090', .7); drop(g, gx + 8, gy - 2 + lift * 4, .8);
    clawHand(g, 30, -12 - lift * 6, G_SKIN, Math.PI + .4, 9, 7); manacle(g, 38, -10 - lift * 6, .8, 0); }
  else if (ch != null){ for (const s of [-1, 1]){ const hy = -6 + lunge * 40, hx = s * (30 - lunge * 8); arm(s, [s * 50, -14 + lunge * 6], hx, hy, Math.PI / 2 - s * .2, ch * TAU + s); } }
  else { const a = sw * .35; arm(-1, [-50, -2 + a * 6], -46 + a * 4, 26 + a * 6, Math.PI / 2 + .25, a * 2); arm(1, [50, -2 - a * 6], 46 + a * 4, 26 - a * 6, Math.PI / 2 - .25, -a * 2); }
  // head: wide and low between the shoulders, bald with a slicked widow's peak and a lightning scar; bat ears, heavy brow, tusks
  g.save(); g.translate(0, ch != null ? lunge * 6 : 0);
  for (const s of [-1, 1]){ const ear = SM([[s * 20, -32], [s * 36, -46, 1], [s * 31, -30], [s * 34, -22, 1], [s * 22, -20]], .6); S.part(g, ear, G_SKIN, { x:s * 27, y:-30, r:9 }, { flat:true, mat:'skin' }); S.dot(g, SM([[s * 23, -30], [s * 31, -40], [s * 28, -27]], .7), '#b05a6a', .55); }
  const head = SM([[-22, -36], [-25, -20], [-20, -6], [-8, 0], [8, 0], [20, -6], [25, -20], [22, -36], [12, -50], [-12, -50]], .85);
  S.part(g, head, G_SKIN, { x:0, y:-26, r:25 }, { mat:'skin', hx:-10, hy:-40 }); S.contact(g, body, 0, -26, 22, 6, .5);
  S.dot(g, SM([[-10, -50], [0, -44, 1], [10, -50], [4, -51], [0, -48], [-4, -51]], .8), HAIR.base, .95);   // the widow's peak, all that's left of the hair
  S.ln(g, [[14, -48], [8, -41], [13, -38], [6, -30]], { deep:'#7a2a3a' }, 2, .8); S.ln(g, [[14, -48], [8, -41], [13, -38], [6, -30]], { deep:BOLT }, .8, .7);   // lightning scar
  for (const [x, y] of [[10, -45], [11, -39], [9, -34]]) S.ln(g, [[x - 2.2, y - .8], [x + 2.2, y + .8]], { deep:'#5a1e2a' }, .9, .7);
  S.ln(g, [[-19, -32], [-4, -27]], HAIR, 3, .9); S.ln(g, [[19, -32], [4, -27]], HAIR, 3, .9);
  if (he != null){ S.glow(g, -9, -23, 3.5 + pulse * 2, '#ff3030'); S.glow(g, 9, -23, 3.5 + pulse * 2, '#ff3030'); }
  for (const s of [-1, 1]) S.eye(g, s * 9, -22, 6.5, 6.5, { lx:-s * .05, ly:.1, pr:.44, pupil:'#c01020', iris:'#ff6060', lid:.32, tilt:s * .35, lidCol:G_SKIN.dark, lidDeep:'#3a1020' });
  const jaw = ch != null ? 2 + lunge * 4 : he != null ? 1 : 0;
  const mouth = SM([[-13, -12], [-7, -8 + jaw], [0, -7 + jaw * 1.2], [7, -8 + jaw], [13, -12], [0, -13]], .8); S.dot(g, mouth, '#3a0a14');
  S.dot(g, PL([[-8, -12.5], [-4.5, -12.5], [-6.2, -5]]), '#fff'); S.dot(g, PL([[4.5, -12.5], [8, -12.5], [6.2, -5]]), '#fff');   // fangs
  for (const s of [-1, 1]) S.part(g, PL([[s * 11, -8 + jaw], [s * 14.5, -9 + jaw], [s * 13.5, -18 + jaw * .5]]), pal('#f4ecd8'), { x:s * 13, y:-12, r:4 }, { flat:true, lw:.8 });   // lower tusks
  S.dot(g, SM([[-13, -11], [-10, -6], [-11, 2], [-13, -4]], .8), BLOOD.base, .9); drop(g, -11.5, 4 + (w != null ? w * 3 : 0), .8); S.dot(g, SM([[10, -9], [13, -10], [12, -3]], .8), BLOOD.base, .8);   // blood-smeared chin
  g.restore();
  g.restore();
}

// ---------- the Bat Bride: tall, floating, a mantle of bat wings, a hem that breaks up into bats ----------
function bride(g, P){
  const w = P.walk, ch = P.chew, he = P.heal;
  const fl = w != null ? Math.sin(w * TAU) : 0, pulse = he == null ? 0 : (Math.sin(he * TAU) + 1) / 2, lean = ch == null ? 0 : (1 - Math.cos(ch * TAU)) / 2;
  const ph = (w ?? ch ?? he ?? 0) * TAU;
  const bob = w != null ? fl * 3 - 2 : ch != null ? lean * 5 : he != null ? -pulse * 3 : 0;
  S.shadow(g, 0, 50, 24, 5);
  if (he != null) healAura(g, pulse, 1);
  g.save(); g.translate(0, bob);
  // the bat-wing mantle standing up behind her shoulders: membrane scallops and finger bones
  const flap = w != null ? Math.sin(ph) * 3 : he != null ? -pulse * 6 : ch != null ? lean * 4 : 0;
  for (const s of [-1, 1]){ const wing = SM([[s * 8, -26], [s * 22, -50 - flap, 1], [s * 46, -68 - flap, 1], [s * 44, -50 - flap * .6, 1], [s * 48, -32, 1], [s * 38, -34, 1], [s * 36, -18, 1], [s * 26, -22, 1], [s * 18, -6, 1]], .5);
    S.part(g, wing, B_WING, { x:s * 28, y:-36, r:30 }, { mat:'leather', flat:true });
    g.save(); wing(g); g.clip(); S.dot(g, SM([[s * 14, -24], [s * 40, -60 - flap], [s * 40, -40], [s * 22, -14]], .8), B_MEMB.base, .45); g.restore();
    for (const [ex, ey] of [[46, -68], [48, -32], [36, -18]]) S.ln(g, [[s * 12, -22], [s * ex, ey - (ey < -40 ? flap : 0)]], B_WING, 1.6, .9);
    S.claw(g, s * 46, -68 - flap, -Math.PI / 2 - s * .6, 5, '#d8d0e0'); }
  // long black hair falling behind to the waist, one white lightning lock
  const hair = SM([[-18, -54], [-26, -36], [-26, -10], [-30, 10, 1], [-20, 4], [-14, 14, 1], [-8, -10], [8, -10], [14, 14, 1], [20, 4], [30, 10, 1], [26, -10], [26, -36], [18, -54], [0, -60]], .8);
  S.part(g, hair, B_HAIR, { x:0, y:-24, r:34 }, { mat:'leather', hx:-14, hy:-46 });
  // gown: crimson skirt flaring to a scalloped bat-wing hem; dark overskirt panels; bats peeling off the hem
  const sw = w != null ? Math.sin(ph + 1) * 3 : 0;
  const skirt = SM([[-10, 2], [-20, 18], [-30 + sw, 40, 1], [-22 + sw, 36, 1], [-15, 44, 1], [-7, 38, 1], [0, 45, 1], [7, 38, 1], [15, 44, 1], [22 - sw, 36, 1], [30 - sw, 40, 1], [20, 18], [10, 2]], .75);
  S.part(g, skirt, B_GOWN, { x:0, y:22, r:30 }, { mat:'cloth', hx:-12, hy:12 });
  for (const s of [-1, 1]){ const pnl = SM([[s * 6, 2], [s * 16, 18], [s * (27 - s * sw), 39, 1], [s * 21, 35, 1], [s * 14, 42, 1], [s * 10, 20]], .75); S.part(g, pnl, B_DARK, { x:s * 15, y:22, r:22 }, { mat:'cloth', flat:true }); }
  S.crease(g, SO([[-3, 8], [-6, 38]]), B_GOWN, 1.6, .45); S.crease(g, SO([[3, 8], [6, 38]]), B_GOWN, 1.6, .45);
  for (let i = 0; i < 4; i++){ const k = ((w ?? he ?? 0) + i / 4) % 1, bx = (i % 2 ? 1 : -1) * (12 + i * 5) + Math.sin(k * TAU + i) * 4, by = 46 - k * 16; g.save(); g.globalAlpha = Math.min(1, (1 - k) * 2.2); miniBat(g, bx, by, .5 + (1 - k) * .1, Math.sin((k * 3 + i * .4) * TAU)); g.restore(); }
  // bodice: corset with lacing, iron-clasped, a blood-drop pendant
  const bod = SM([[-13, -18], [-15, -6], [-10, 4], [0, 6], [10, 4], [15, -6], [13, -18], [0, -14]], .85); S.part(g, bod, B_DARK, { x:0, y:-6, r:16 }, { mat:'leather' });
  for (let i = 0; i < 4; i++) S.ln(g, [[-3, -12 + i * 4], [3, -10 + i * 4]], B_GOWN, 1.1, .9);
  S.dot(g, SM([[-12, -18], [0, -11], [12, -18], [8, -21], [0, -17], [-8, -21]], .8), B_SKIN.base);   // neckline
  S.ln(g, [[-7, -19], [0, -14], [7, -19]], B_IRON, 1, .8); S.part(g, SM([[0, -15, 1], [2.6, -11], [0, -7.5], [-2.6, -11]], .9), B_GEM, { x:0, y:-11, r:3.5 }, { flat:true, lw:.8 });
  // arms: thin, black-gloved; one at the breast and one trailing on the float; reaching down on the chew; spread wide on the heal
  const glove = (pts, hx, hy, dir) => { S.tube(g, SO(pts), B_GLOVE, 5); clawHand(g, hx, hy, B_GLOVE, dir, 4, 7); };
  if (he != null){ const u = pulse * 6; glove([[-12, -14], [-26, -26 - u], [-34, -40 - u]], -35, -43 - u, -Math.PI / 2 - .5); glove([[12, -14], [26, -26 - u], [34, -40 - u]], 35, -43 - u, -Math.PI / 2 + .5); }
  else if (ch != null){ for (const s of [-1, 1]) glove([[s * 12, -14], [s * 20, 0 + lean * 4], [s * 14, 16 + lean * 12]], s * 13, 19 + lean * 12, Math.PI / 2 - s * .3); }
  else { glove([[-12, -14], [-16, -4], [-6, -8]], -4, -9, 0); glove([[12, -14], [24, -2 + fl * 2], [30, 12 + fl * 3]], 30, 15 + fl * 3, Math.PI / 2 - .4); }
  // head: heart-shaped pale face, red eyes with lashes, dark lips and small fangs; iron tiara and a torn black veil
  g.save(); g.translate(0, ch != null ? lean * 5 : 0); g.rotate(ch != null ? 0 : w != null ? fl * .03 : 0);
  const face = SM([[-17, -44], [-18, -30], [-12, -18], [0, -13, 1], [12, -18], [18, -30], [17, -44], [8, -52], [-8, -52]], .85);
  S.part(g, face, B_SKIN, { x:0, y:-34, r:20 }, { mat:'skin', hx:-8, hy:-44 });
  for (const s of [-1, 1]) S.part(g, PL([[s * 15, -38], [s * 25, -46], [s * 17, -30]]), B_SKIN, { x:s * 19, y:-38, r:6 }, { flat:true, mat:'skin' });
  const bangs = SM([[-19, -40], [-19, -52], [-6, -60], [6, -60], [19, -52], [19, -40], [12, -48], [3, -45], [0, -50], [-3, -45], [-12, -48]], .8); S.part(g, bangs, B_HAIR, { x:0, y:-50, r:20 }, { mat:'leather', hx:-8, hy:-55 });
  const lock = SM([[-8, -59], [-3, -60], [-9, -52], [-13, -46], [-17, -40], [-15, -48]], .8); S.part(g, lock, pal('#e8ecff'), { x:-10, y:-52, r:8 }, { flat:true, lw:1 }); S.ln(g, [[-6, -58], [-11, -50], [-15, -43]], { deep:'#9fb0ff' }, 1, .8);   // the white lightning lock
  // veil from the tiara, torn, translucent
  g.save(); g.globalAlpha = .55; S.dot(g, SM([[-16, -58], [-28, -48], [-30, -24, 1], [-25, -30, 1], [-22, -20, 1], [-20, -50]], .7), '#0a0610'); S.dot(g, SM([[16, -58], [28, -48], [30, -24, 1], [25, -30, 1], [22, -20, 1], [20, -50]], .7), '#0a0610'); g.restore();
  const tiara = PL([[-14, -56], [-11, -66], [-7, -58], [-3, -70], [0, -60], [3, -70], [7, -58], [11, -66], [14, -56], [0, -54]]);
  S.part(g, tiara, B_IRON, { x:0, y:-60, r:12 }, { flat:true, mat:'metal' }); S.part(g, E(0, -59, 2.6, 2.6), B_GEM, { x:0, y:-59, r:2.6 }, { flat:true, lw:.8 });
  if (he != null){ S.glow(g, -7, -33, 4 + pulse * 2, '#ff3030'); S.glow(g, 7, -33, 4 + pulse * 2, '#ff3030'); }
  for (const s of [-1, 1]){ S.eye(g, s * 7, -33, 6.5, 7.5, { lx:.05, ly:.2, pr:.42, pupil:'#b0101c', iris:'#ff5a6a' });
    S.ln(g, [[s * 1.5, -39], [s * 7, -41], [s * 13, -38]], B_HAIR, 1.8, .95); for (const k of [0, 1]) S.ln(g, [[s * (11 + k * 2), -38.5 - k * .5], [s * (14 + k * 2.5), -41 - k * .5]], B_HAIR, 1.2, .9); }
  const op = ch != null ? 1.5 + lean * 2 : 0;
  S.dot(g, SM([[-5, -22], [0, -23.5], [5, -22], [0, -19 + op]], .9), '#5a0a1e'); S.dot(g, PL([[-3.6, -22.4], [-1.6, -22.6], [-2.6, -18.5]]), '#fff'); S.dot(g, PL([[1.6, -22.6], [3.6, -22.4], [2.6, -18.5]]), '#fff');
  S.dot(g, E(9, -24, .9, .9), '#2a1020');   // beauty mark
  g.restore();
  g.restore();
}

// ---------- registry entries (each nightmare look would be its own type in the game; box widened for each) ----------
const loop = (m, cl) => Math.floor(m.ph * cl.fps) % cl.n;
const clips = { walk:{ n:8, fps:8, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, heal:{ n:6, fps:8, pose:t => ({ heal:t }) } };
const frame = (m, cl) => (!m.eating && m.calmT >= VAMPIRE_CALM && m.hp < m.maxHp) ? ['heal', loop(m, cl.heal)] : null;
export const NM_VAMPIRES = {
  vampire: { name:'Vampire (game)', draw:nmVampire, scale:.74, dy:-14, box:{ x:-80, y:-80, w:160, h:136 }, clips, still:{}, frame },
  glutton: { name:'Blood Glutton', variant:'glutton', draw:nmVampire, scale:.74, dy:-14, box:{ x:-80, y:-80, w:160, h:136 }, clips, still:{}, frame },
  bride: { name:'Bat Bride', variant:'bride', draw:nmVampire, scale:.74, dy:-14, box:{ x:-80, y:-80, w:160, h:136 }, clips, still:{}, frame },
};
