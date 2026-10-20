// ---------- The Fallen Gravekeeper (archive art, not in the game) ----------
// The Gravekeeper of the Pumpkin Patch (src/engine/render/chars/w1.js) copied whole, plus a 'fallen' variant for the
// nightmare patch: the eclipse came and he came back with it. Drawn at the full-form size (he is the nightmare world's
// final boss). Same silhouette and pose language as the original; scorched, cracked and smouldering, with a cracked
// eclipse-black moon rising behind his hood, a coffin lid chained to his back, a crow perched on his shovel, black-and-
// orange eclipse fire in the lantern and eclipse eyes (a black pupil in a burning ring).
// pose: idle (0-1 loop), cast (0-1), fade (0-1, teleport), stab (0-1), variant: null | 'form2' | 'fallen'.
import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/render/paint.js';
import { TAU } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/util.js';

// palettes shared with w1.js
const ROBE = pal('#5a4a72'), ROBED = pal('#3f3352'), LAN = pal('#5b4b3a'), LANG = pal('#ffe3a0'), WOOD = pal('#b48a58'), PATCH = pal('#7a6a56'), LEATH = pal('#6b4a2e'), BONE = pal('#d8d2e6'), ST = pal('#aab3c4');
const ROBE2 = pal('#3a2258'), ROBED2 = pal('#24143a'), LANG2 = pal('#c4ff8c'), HORN2 = pal('#d6ccb4'), GK_GLOW = '#8cff5a', GK_RUNE = '#a4ff62', GK_EYE = '#ff7a1a';
// the fallen palette: charred cloth, scorched bone, rusted iron, eclipse fire
const ROBEF = pal('#2c1612'), ROBEDF = pal('#170907'), HORNF = pal('#74625a'), BONEF = pal('#a89482'), IRONF = pal('#4a3e3c'), WOODF = pal('#3a2820'), STF = pal('#5a4e4a'), PATCHF = pal('#1c1210'), LEATHF = pal('#2a1a14'),
  COFFIN = pal('#3c2616'), BANDF = pal('#766a66'), CROW = pal('#1b1826'), GLASSF = pal('#7a3e22'), ASH = pal('#5c5254');
const FL_GLOW = '#ff7a1a', FL_EMBER = '#ffb040', FL_CORE = '#fff0c0', FL_BLACK = '#050204', FL_CORONA = '#c2410f', FL_RING = '#ffc060';

// ---------- helpers ----------
function lantern(g, x, y, s = 1, glow = '#ffb640', body = LANG, core = '#fff8d0', frame = LAN, ecl = 0){
  g.save(); g.translate(x, y); g.scale(s, s);
  S.stroke(g, g2 => { g2.beginPath(); g2.arc(0, -20, 4, 0, TAU); }, frame, 2); S.ln(g, [[0, -16], [0, -10]], frame, 2);
  g.save(); g.shadowColor = glow; g.shadowBlur = 22; S.part(g, RR(-12, -10, 24, 28, 5), body, { x:0, y:4, r:16 }, { flat:true }); g.restore();
  if (ecl){   // eclipse fire: a black disc in a burning ring, black tongues licking up off it
    const R = rng(17); g.save(); g.shadowColor = glow; g.shadowBlur = 12; S.dot(g, E(0, 4, 7.5, 10), '#ff8c2a'); g.restore();
    S.dot(g, E(0, 4, 6.2, 8.6), core); S.dot(g, E(0, 4, 4.4, 6.4), FL_BLACK);
    for (let i = 0; i < 4; i++){ const bx = -4 + i * 2.7, h = 5 + R() * 5 + Math.sin(ecl * TAU * 2 + i * 1.9) * 2, wv = Math.sin(ecl * TAU + i) * 1.2; S.dot(g, SM([[bx - 2, -1], [bx - 1.4 + wv * .4, -1 - h * .5], [bx + wv, -1 - h], [bx + 1.4 + wv * .4, -1 - h * .5], [bx + 2, -1]], .8), i % 2 ? '#ff8c2a' : FL_BLACK, .9); }
  } else { S.dot(g, E(0, 4, 5.5, 8), glow); S.dot(g, E(0, 2, 2.2, 3.5), core); }
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-9, -8, 3, 22); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-4, -8, 1.5, 22); S.ln(g, [[0, -10], [0, 18]], frame, 1, .5); S.ln(g, [[-12, 4], [12, 4]], frame, 1, .4);
  for (const yy of [-10, 18]) S.part(g, RR(-14, yy - 3, 28, 6, 2), frame, { x:0, y:yy, r:14 }, { flat:true, mat:'metal' });
  g.restore();
}
/** The eclipsed harvest moon: a black disc with a burning corona, cracked, rising behind the hood. a = brightness, ph = idle phase. */
function eclipse(g, x, y, r, a, ph){
  const R = rng(31); g.save();
  let gr = g.createRadialGradient(x, y, r * .9, x, y, r * 1.7); gr.addColorStop(0, rgba('#ffa040', .95 * a)); gr.addColorStop(.22, rgba('#ff6a14', .55 * a)); gr.addColorStop(.6, rgba(FL_CORONA, .2 * a)); gr.addColorStop(1, rgba(FL_CORONA, 0)); g.fillStyle = gr; ell(g, x, y, r * 1.7, r * 1.7); g.fill();
  for (let i = 0; i < 16; i++){   // corona tongues, swaying with the breath
    const an = i / 16 * TAU + R() * .3, L = r * (1.2 + R() * .32 + Math.sin(ph * TAU + i * 1.7) * .07), w = .1 + R() * .08;
    g.fillStyle = rgba(i % 3 ? '#ff7a1a' : FL_EMBER, .45 * a); g.beginPath(); g.moveTo(x + Math.cos(an - w) * r * .94, y + Math.sin(an - w) * r * .94);
    g.quadraticCurveTo(x + Math.cos(an - w * .3) * L * .85, y + Math.sin(an - w * .3) * L * .85, x + Math.cos(an) * L, y + Math.sin(an) * L);
    g.quadraticCurveTo(x + Math.cos(an + w * .3) * L * .85, y + Math.sin(an + w * .3) * L * .85, x + Math.cos(an + w) * r * .94, y + Math.sin(an + w) * r * .94); g.fill(); }
  g.save(); g.shadowColor = FL_GLOW; g.shadowBlur = 18; S.dot(g, E(x, y, r, r), FL_BLACK); g.restore();
  g.save(); ell(g, x, y, r, r); g.clip();   // a faint lunar surface so it reads as a moon, then glowing cracks
  g.fillStyle = 'rgba(90,70,80,.28)'; for (const [cx, cy, cr] of [[-.35, -.2, .22], [.25, .3, .16], [.1, -.45, .1], [-.1, .35, .09], [.45, -.1, .12]]){ ell(g, x + cx * r, y + cy * r, cr * r, cr * r * .85); g.fill(); }
  g.shadowColor = FL_GLOW; g.shadowBlur = 7; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [pts, w] of [[[[-1, -.18], [-.6, -.05], [-.42, .26], [-.14, .14], [.02, .34]], 2.2], [[[.3, -1], [.24, -.62], [.46, -.36], [.34, -.1], [.5, .08]], 1.8], [[[.74, .68], [.5, .46], [.56, .2]], 1.4], [[[-.42, .26], [-.6, .5], [-.5, .74]], 1.2]]){
    g.strokeStyle = rgba('#ff9a2a', .95 * a); g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(x + p[0] * r, y + p[1] * r) : g.moveTo(x + p[0] * r, y + p[1] * r)); g.stroke();
    g.strokeStyle = rgba('#fff0c0', .6 * a); g.lineWidth = w * .4; g.stroke(); }
  g.restore();
  ell(g, x, y, r, r); g.strokeStyle = rgba(FL_RING, .95 * a); g.lineWidth = 2.4; g.stroke(); ell(g, x, y, r - 2, r - 2); g.strokeStyle = rgba('#ff6a10', .5 * a); g.lineWidth = 1.2; g.stroke();
  g.restore();
}
/** A crow in flight, silhouetted: the "M" of two wings. */
function crowSil(g, x, y, s, flap, a = 1){
  g.strokeStyle = rgba('#0a0608', a); g.lineWidth = 1.7 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 6 * s, y - 2 * s - flap * 3 * s); g.quadraticCurveTo(x - 3 * s, y + 1.5 * s, x, y); g.quadraticCurveTo(x + 3 * s, y + 1.5 * s, x + 6 * s, y - 2 * s - flap * 3 * s); g.stroke();
}
/** The counting crow, perched: body, tail, head with a hooked beak and an ember eye; flap 0-1 spreads the wings, lift raises it off the perch. */
function crow(g, x, y, flap = 0, lift = 0){
  g.save(); g.translate(x, y - lift * 10); g.scale(1.25, 1.25);
  const sheen = { ...CROW, light:mix('#1b1826', '#6a7ac0', .5), rim:mix('#1b1826', '#8aa0ff', .55) };
  for (const [sx, sy] of [[-2.5, 0], [2.5, 0]]) S.ln(g, [[sx, -1], [sx, 3 + lift * 4], [sx - 2, 5 + lift * 4]], { deep:'#2a2020' }, 1.3, .9);   // feet / talons
  if (flap > .05) for (const s of [-1, 1]){ const f = flap; const wing = SM([[s * 2, -5], [s * (6 + f * 8), -8 - f * 9], [s * (14 + f * 10), -8 - f * 14], [s * (18 + f * 8), -2 - f * 8], [s * (12 + f * 4), 0], [s * 4, -1]], .75); S.part(g, wing, sheen, { x:s * 10, y:-6 - f * 6, r:11 }, { flat:true, mat:'cloth', lw:1.2 });
    g.strokeStyle = rgba('#0a0608', .5); g.lineWidth = .8; for (let i = 0; i < 4; i++){ g.beginPath(); g.moveTo(s * (6 + i * 3), -5 - f * 6 - i * 2); g.lineTo(s * (10 + i * 3 + f * 4), -1 - f * 6 + i); g.stroke(); } }
  S.part(g, PL([[-6, -1], [-15, 1], [-16, -2], [-14, -4], [-7, -5]]), sheen, { x:-11, y:-2, r:5 }, { flat:true, lw:1.1 });   // tail
  S.part(g, SM([[-8, -1], [-5, -6], [2, -8], [8, -5], [9, 0], [5, 4], [-3, 4]], .8), sheen, { x:0, y:-2, r:8 }, { mat:'cloth', hx:-3, hy:-5 });   // body
  if (flap <= .05) S.part(g, SM([[-6, -2], [-1, -6], [6, -4], [7, 0], [1, 3]], .8), { ...sheen, base:mix('#1b1826', '#4a5a90', .18) }, { x:0, y:-2, r:6 }, { flat:true, lw:1 });   // folded wing
  S.part(g, E(8, -9, 4.6, 4.2), sheen, { x:8, y:-9, r:4.6 }, { mat:'cloth', hx:6.5, hy:-11 });   // head
  S.part(g, PL([[11, -10], [19, -8.5], [11, -7]]), ASH, { x:14, y:-9, r:4 }, { flat:true, lw:.9 }); S.ln(g, [[11.5, -8.6], [18, -8.5]], { deep:'#2a2024' }, .7, .6);   // beak
  g.save(); g.shadowColor = FL_GLOW; g.shadowBlur = 5; S.dot(g, E(9.2, -10, 1.5, 1.4), '#ff9a2a'); g.restore(); S.dot(g, E(9.6, -10.4, .5, .5), '#fff0c0');
  g.restore();
}
/** A charred coffin lid, toe-pincher shape, iron cross and bands, slung on the back. */
function coffinLid(g, x, y, rot){
  g.save(); g.translate(x, y); g.rotate(rot);
  const lid = PL([[-17, -64], [-26, -38], [-15, 64], [15, 64], [26, -38], [17, -64]]);
  S.part(g, lid, COFFIN, { x:-2, y:-10, r:64 }, { mat:'wood', flat:true, lw:1.8 });
  S.overlay(g, lid, { deep:'#050204' }, { x:0, y:-14, r:44 }, .45);
  g.save(); lid(g); g.clip(); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1; for (let i = -1; i <= 1; i++){ g.beginPath(); g.moveTo(i * 7, -58); g.quadraticCurveTo(i * 7 + 2, 0, i * 6.5, 58); g.stroke(); }   // planks
  g.shadowColor = FL_GLOW; g.shadowBlur = 6; g.strokeStyle = rgba('#ff8c2a', .85); g.lineWidth = 1.4; g.lineCap = 'round'; for (const pts of [[[-16, 40], [-10, 24], [-14, 10]], [[12, 50], [8, 36], [13, 24], [9, 14]], [[-18, -30], [-12, -44]]]){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }   // ember cracks
  g.shadowBlur = 0; for (const [hx, hy, hr] of [[6, 44, 3.2], [-9, 2, 2.4]]){ S.dot(g, E(hx, hy, hr, hr * .8), '#070404'); g.strokeStyle = rgba('#ff7a30', .6); g.lineWidth = 1; ell(g, hx, hy, hr + .6, hr * .8 + .6); g.stroke(); }   // burn holes
  g.restore();
  for (const yy of [-28, 36]){ S.part(g, RR(-25, yy - 3.5, 50, 7, 1.5), BANDF, { x:0, y:yy, r:25 }, { flat:true, mat:'metal', lw:1.1 }); S.rivet(g, -20, yy, 1.8, BANDF); S.rivet(g, 20, yy, 1.8, BANDF); }
  S.part(g, RR(-3.5, -54, 7, 70, 2), BANDF, { x:0, y:-19, r:35 }, { flat:true, mat:'metal', lw:1.1 }); S.part(g, RR(-14, -40, 28, 7, 2), BANDF, { x:0, y:-36, r:14 }, { flat:true, mat:'metal', lw:1.1 });
  g.restore();
}
/** A run of iron chain links between two points, drifting sideways by `drift`. */
function chain(g, x0, y0, x1, y1, n, drift, c){
  let px = x0, py = y0;
  for (let i = 1; i <= n; i++){ const t = i / n, x = x0 + (x1 - x0) * t + drift * Math.sin(t * Math.PI), y = y0 + (y1 - y0) * t; g.strokeStyle = rgba(c.deep, .9); g.lineWidth = 2.6; ell(g, (x + px) / 2, (y + py) / 2, 2.4, 3.4, Math.atan2(y1 - y0, x1 - x0) + (i % 2 ? .5 : -.5)); g.stroke(); g.strokeStyle = c.light; g.lineWidth = 1.1; ell(g, (x + px) / 2 - .4, (y + py) / 2 - .5, 2.2, 3.1, Math.atan2(y1 - y0, x1 - x0) + (i % 2 ? .5 : -.5)); g.stroke(); px = x; py = y; }
  return [px, py];
}

// ---------- the boss ----------
export function fallenGravekeeper(g, P = {}){
  const FL = P.variant === 'fallen', F2 = P.variant === 'form2' || FL;
  const r = FL ? ROBEF : F2 ? ROBE2 : ROBE, rd = FL ? ROBEDF : F2 ? ROBED2 : ROBED, w = FL ? WOODF : WOOD, st = FL ? STF : ST, k = FL ? BONEF : BONE, horn = FL ? HORNF : HORN2, iron = FL ? IRONF : ST, leath = FL ? LEATHF : LEATH, patch = FL ? PATCHF : PATCH,
    cast = P.cast ?? 0, fade = P.fade ?? 0, stab = P.stab ?? 0, idle = P.idle;
  const R = rng(5);
  if (F2){ g.save(); g.translate(0, 66); g.scale(1.12, 1.12); g.translate(0, -66); }
  if (fade > 0){
    for (let i = 0; i < 10; i++){ const x = (R() - .5) * 80, y0 = -60 + R() * 120, rr = 4 + R() * 5; const y = y0 - fade * 60 - R() * 20, a = Math.max(0, (1 - fade) * .6) * (fade < .15 ? fade / .15 : 1);
      const col = FL ? (i % 2 ? '#ff8c2a' : '#3a2e30') : F2 && i % 2 ? '#4a9a30' : '#6a52a8', sh = FL ? (i % 2 ? FL_GLOW : '#2a2024') : F2 && i % 2 ? '#7ae050' : '#8a6ad8';
      g.save(); g.globalAlpha *= a; g.shadowColor = sh; g.shadowBlur = 8; S.dot(g, E(x + Math.sin(fade * 6 + i) * 6, y, rr * (1 + fade * 1.5), rr * (1 + fade * 1.5)), col); g.restore(); }
    if (fade >= 1){ if (F2) g.restore(); return; }
    g.save(); g.globalAlpha *= 1 - fade; g.translate(0, -fade * 20); g.scale(1, 1 - fade * .3); }
  S.shadow(g, 0, 66, 46, 8);
  const ang = .42 - stab * 1.05, push = stab * 8, breathe = idle == null ? 0 : Math.sin(idle * TAU), ph = idle ?? 0;
  if (FL){   // firelight on the ground, the eclipsed moon behind him, crows crossing its corona, the coffin lid on his back
    const gl = g.createRadialGradient(0, 64, 4, 0, 64, 60); gl.addColorStop(0, `rgba(255,120,30,${.3 + cast * .25})`); gl.addColorStop(1, 'rgba(255,120,30,0)'); g.save(); g.translate(0, 64); g.scale(1, .22); g.translate(0, -64); g.fillStyle = gl; ell(g, 0, 64, 60, 60); g.fill(); g.restore();
    eclipse(g, 0, -56, 46, .75 + breathe * .1 + cast * .25, ph);
    for (const [cx, cy, s, f] of [[-62, -96, 1.1, .3], [52, -104, .9, .7], [68, -84, .7, .1]]) crowSil(g, cx + Math.sin(ph * TAU + cx) * 2, cy + Math.cos(ph * TAU + cy) * 2.5, s, (Math.sin(ph * TAU * 2 + f * 6) + 1) * .5, .9);
    coffinLid(g, -44, -34, -.44); }
  g.save(); g.translate(46, 4 + push); g.rotate(ang); S.tube(g, SO([[0, 62], [0, -40]]), w, 5);
  if (FL){ g.save(); g.shadowColor = FL_GLOW; g.shadowBlur = 5; S.ln(g, [[-.6, 52], [.4, 30], [-.8, 10], [.6, -12], [-.4, -32]], { deep:'#ff8c2a' }, 1, .7); g.restore(); } else S.ln(g, [[-.8, 56], [-.8, -34]], { deep:w.light }, .8, .6);
  S.part(g, SM([[-11, 58], [11, 58], [11, 74], [0, 86], [-11, 74]], .5), st, { x:0, y:70, r:12 }, { flat:true, mat:'metal' });
  if (FL){ g.save(); g.shadowColor = FL_GLOW; g.shadowBlur = 5; S.ln(g, [[-6, 62], [-2, 70], [-5, 78]], { deep:'#ff8c2a' }, 1.2, .8); S.ln(g, [[4, 66], [7, 72]], { deep:'#ff8c2a' }, 1, .7); g.restore(); }   // the blade cracked and glowing
  S.part(g, RR(-6, -46, 12, 8, 3), w, { x:0, y:-42, r:6 }, { flat:true, mat:'wood' }); g.restore();
  g.save(); g.translate(0, 66); g.rotate(stab * .14); g.translate(0, -66 - stab * 4 + breathe * 1.5);
  if (stab > .45){ const q = (stab - .45) / .55; const bx = 46 + Math.sin(-ang) * 74, by = 4 + push + Math.cos(ang) * 74;
    for (let i = 0; i < 8; i++){ const a = -Math.PI * .95 + R() * Math.PI * .9, sp = 18 + R() * 34, x = bx + Math.cos(a) * sp * q, y = by + Math.sin(a) * sp * q + q * q * 30, rr = 3 + R() * 3.5; g.save(); g.globalAlpha *= 1 - q * .6;
      if (FL && i % 2){ g.shadowColor = FL_GLOW; g.shadowBlur = 6; S.dot(g, E(x, y, rr * .7, rr * .6), FL_EMBER); } else S.part(g, E(x, y, rr, rr * .8), leath, { x, y, r:rr }, { flat:true }); g.restore(); }
    g.save(); g.globalAlpha *= (1 - q) * .5; S.dot(g, E(bx, by + 6, 18 * q + 6, 5), FL ? '#1a0c08' : '#3a2a1c'); g.restore(); S.stroke(g, SO([[bx - 30 * q, by + 8], [bx - 10, by + 4], [bx + 8, by + 9], [bx + 28 * q, by + 5]]), { deep:FL ? '#ff8c2a' : '#1a1010' }, 2, .7 * q); }
  for (const s of [-1, 1]) S.part(g, SM([[s * 8, 54], [s * 8, 66], [s * 24, 66], [s * 24, 60], [s * 20, 54]], .5), leath, { x:s * 16, y:60, r:9 }, { flat:true, mat:'leather' });
  const robe = SM([[12, -78], [-16, -70], [-38, -44], [-48, -8], [-50, 30], [-52, 58, 1], [-40, 50, 1], [-28, 64, 1], [-14, 52, 1], [2, 66, 1], [16, 52, 1], [30, 64, 1], [42, 50, 1], [50, 60, 1], [48, 26], [44, -10], [36, -44], [30, -66]], .85);
  S.part(g, robe, r, { x:0, y:0, r:64 }, { mat:'cloth', hx:-26, hy:-46 });
  S.crease(g, SO([[-30, -30], [-38, 10], [-34, 52]]), r, 2.6, .45); S.crease(g, SO([[28, -24], [36, 10], [32, 50]]), r, 2.6, .45); S.crease(g, SO([[-8, 10], [-12, 34], [-14, 60]]), r, 2, .35); S.crease(g, SO([[12, 12], [16, 36], [14, 60]]), r, 2, .35);
  g.save(); robe(g); g.clip(); for (const [x, y, wd, hd, a] of [[-32, 36, 15, 13, .2], [24, 44, 13, 11, -.15]]){ g.save(); g.translate(x, y); g.rotate(a); S.part(g, RR(-wd / 2, -hd / 2, wd, hd, 2), patch, { x:0, y:0, r:wd / 2 }, { flat:true, mat:'cloth' }); g.strokeStyle = rgba(r.deep, .8); g.lineWidth = 1; for (let i = -wd / 2 + 2; i < wd / 2; i += 4){ g.beginPath(); g.moveTo(i, -hd / 2 - 1.5); g.lineTo(i + 1.5, -hd / 2 + 1.5); g.moveTo(i, hd / 2 - 1.5); g.lineTo(i + 1.5, hd / 2 + 1.5); g.stroke(); } g.restore(); } g.restore();
  if (FL){   // the robe burnt from the hem up: a smoulder glow, ember cracks climbing the cloth, burn holes with glowing rims
    g.save(); robe(g); g.clip();
    const hg = g.createLinearGradient(0, 68, 0, 20); hg.addColorStop(0, `rgba(255,120,30,${.55 + breathe * .1 + cast * .2})`); hg.addColorStop(.5, 'rgba(255,90,20,.18)'); hg.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = hg; g.fillRect(-60, 10, 120, 60);
    g.shadowColor = FL_GLOW; g.shadowBlur = 7; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pts of [[[-38, 62], [-34, 46], [-40, 36], [-32, 24], [-36, 14]], [[-16, 66], [-12, 50], [-18, 40], [-10, 30]], [[6, 64], [10, 48], [4, 38], [10, 28], [6, 16]], [[30, 62], [34, 46], [28, 36], [34, 26]], [[-26, 10], [-20, -4], [-28, -14]], [[22, 2], [28, -10], [24, -22]], [[44, 30], [40, 14]]]){
      g.strokeStyle = rgba('#ff8c2a', .6 + breathe * .15 + cast * .3); g.lineWidth = 1.7; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.strokeStyle = rgba(FL_CORE, .35 + cast * .3); g.lineWidth = .6; g.stroke(); }
    g.shadowBlur = 0; const B = rng(23); for (let i = 0; i < 7; i++){ const x = (B() - .5) * 84, y = 26 + B() * 36, hr = 1.6 + B() * 3; S.dot(g, E(x, y, hr, hr * .8), '#070404', .92); g.strokeStyle = rgba('#ff7a30', .7); g.lineWidth = 1; ell(g, x, y, hr + .7, hr * .8 + .7); g.stroke(); }
    g.restore(); }
  else if (F2){   // glowing runes stitched down the robe, pulsing with the breath and flaring on a cast
    g.save(); robe(g); g.clip(); g.shadowColor = GK_RUNE; g.shadowBlur = 7; g.strokeStyle = rgba(GK_RUNE, .55 + breathe * .2 + cast * .3); g.lineWidth = 1.8; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pts of [[[-26, -18], [-18, -28], [-14, -14], [-24, -8]], [[-38, 22], [-30, 8], [-24, 24], [-34, 18]], [[-10, 44], [-2, 30], [6, 46], [-4, 38]], [[22, -2], [30, -14], [34, 4], [22, -2]], [[30, 34], [40, 22], [36, 40]], [[4, -6], [10, -18], [2, -18]]]){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
    g.restore(); }
  for (const [x, y] of [[-52, 58], [-28, 64], [2, 66], [30, 64], [50, 60]]) S.thread(g, x, y, 1, r);
  const cape = SM([[-44, -30], [-20, -22], [0, -18], [20, -22], [44, -30], [42, -12, 1], [30, -6, 1], [22, -16, 1], [10, -4, 1], [0, -14, 1], [-10, -4, 1], [-22, -16, 1], [-30, -6, 1], [-42, -12, 1]], .7); S.part(g, cape, rd, { x:0, y:-20, r:44 }, { flat:true, mat:'cloth' }); S.contact(g, robe, 0, -8, 40, 8, .4);
  if (FL){ g.save(); cape(g); g.clip(); for (const [x, y, hr] of [[-30, -16, 2.2], [14, -12, 1.8], [36, -20, 1.5]]){ S.dot(g, E(x, y, hr, hr * .8), '#070404', .9); g.strokeStyle = rgba('#ff7a30', .6); g.lineWidth = .9; ell(g, x, y, hr + .6, hr * .8 + .6); g.stroke(); } g.restore(); }
  if (F2) for (const s of [-1, 1]) for (let i = 0; i < 3; i++){   // bone spikes on the shoulders
    const bx = s * (41 - i * 9), by = -28 + i * 3, L = 17 - i * 3, a = -Math.PI / 2 + s * (.6 - i * .18);
    S.part(g, PL([[bx - s * 4, by + 1], [bx + s * 3, by + 2], [bx + Math.cos(a) * L, by + Math.sin(a) * L]]), horn, { x:bx, y:by - 5, r:6 }, { flat:true, mat:'bone', lw:1.2 });
    if (FL){ g.save(); g.shadowColor = FL_GLOW; g.shadowBlur = 4; S.ln(g, [[bx, by], [bx + Math.cos(a) * L * .45, by + Math.sin(a) * L * .45]], { deep:'#ff8c2a' }, .9, .8); g.restore(); } }
  S.tube(g, SO([[-46, 20], [-10, 26], [44, 22]]), w, 4); for (let x = -42; x < 42; x += 6) S.ln(g, [[x, 19 + (x + 46) * .05], [x + 2.5, 24 + (x + 46) * .05]], w, 1, .6);
  const trk = FL ? '#9a7a48' : '#d8c070';
  for (const [x, y] of [[-22, 36], [-14, 40], [-6, 38]]){ S.ln(g, [[x, 26], [x, y]], { deep:trk }, 1.2, .9); g.beginPath(); g.arc(x, y + 4, 3.5, 0, TAU); g.strokeStyle = trk; g.lineWidth = 1.2; g.stroke(); S.dot(g, E(x + 2, y + 5, 1.6, 1.2), trk); }
  const swing = idle == null ? 0 : Math.sin(idle * TAU + 1) * 4;
  if (FL){   // the chain that holds the coffin lid, across the chest, with a padlock
    chain(g, -38, -22, 42, 30, 11, 0, iron); S.stroke(g, g2 => { g2.beginPath(); g2.arc(3, -5, 4, Math.PI, TAU); g2.moveTo(-1, -5); g2.lineTo(-1, -1); g2.moveTo(7, -5); g2.lineTo(7, -1); }, iron, 2.2); S.part(g, RR(-4, -2, 14, 13, 3), iron, { x:3, y:4, r:7 }, { flat:true, mat:'metal', lw:1.1 }); S.dot(g, E(3, 4, 1.4, 1.9), '#1a1012'); }
  if (F2){   // iron chains swinging from the belt, a bone bead on each end
    for (const [x0, len, ph2] of [[-36, 30, 0], [24, 26, 2], [40, 34, 1]]){ const drift = (swing + stab * 6) * .5; let px = x0, py = 24 + (x0 + 46) * .05;
      for (let i = 1; i <= 6; i++){ const t = i / 6, x = x0 + drift * t * t * Math.cos(ph2), y = 24 + (x0 + 46) * .05 + t * len; g.strokeStyle = rgba(iron.deep, .9); g.lineWidth = 2.6; ell(g, (x + px) / 2, (y + py) / 2, 2.4, 3.4, i % 2 ? .5 : -.5); g.stroke(); g.strokeStyle = iron.light; g.lineWidth = 1.1; ell(g, (x + px) / 2 - .4, (y + py) / 2 - .5, 2.2, 3.1, i % 2 ? .5 : -.5); g.stroke(); px = x; py = y; }
      S.part(g, E(px, py + 3, 3.4, 3), k, { x:px, y:py + 3, r:3.4 }, { flat:true, mat:'bone', lw:1 }); } }
  if (F2) for (const s of [-1, 1]){ S.part(g, SM([[s * 24, -50], [s * 22, -64], [s * 32, -82], [s * 48, -98, 1], [s * 40, -80], [s * 34, -64], [s * 33, -52]], .7), horn, { x:s * 34, y:-72, r:16 }, { flat:true, mat:'horn', hx:s * 30, hy:-70 });   // horns rising from the hood
    if (FL){ g.save(); g.shadowColor = FL_GLOW; g.shadowBlur = 5; S.ln(g, [[s * 26, -56], [s * 30, -66], [s * 28, -74]], { deep:'#ff8c2a' }, 1.1, .85); S.ln(g, [[s * 36, -70], [s * 40, -82]], { deep:'#ff8c2a' }, .9, .7); g.restore(); } }
  const hood = SM([[10, -82], [-14, -76], [-30, -58], [-34, -34], [-24, -20], [0, -16], [24, -20], [34, -36], [30, -62]], .85); S.part(g, hood, r, { x:0, y:-50, r:36 }, { mat:'cloth', hx:-16, hy:-70 });
  if (FL){ g.save(); hood(g); g.clip(); g.shadowColor = FL_GLOW; g.shadowBlur = 6; g.strokeStyle = rgba('#ff8c2a', .55 + cast * .3); g.lineWidth = 1.4; g.lineCap = 'round'; for (const pts of [[[-30, -40], [-26, -52], [-30, -62]], [[26, -30], [30, -44]], [[-4, -80], [2, -72]]]){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } g.restore(); }
  const cave = SM([[-24, -38], [-18, -58], [0, -66], [18, -58], [24, -38], [16, -24], [0, -20], [-16, -24]], .9); S.dot(g, cave, '#140c1c');
  if (F2){   // a skull half-visible in the hood: brow and sockets lit by the embers, the jaw lost in shadow
    g.save(); cave(g); g.clip(); S.part(g, SM([[-17, -40], [-19, -52], [-12, -63], [0, -66], [12, -63], [19, -52], [17, -40], [11, -33], [-11, -33]], .8), k, { x:0, y:-50, r:18 }, { mat:'bone', hx:-7, hy:-59 });
    if (FL){ S.ln(g, [[-17, -47], [-9, -51.5], [-3, -47.5]], { deep:'#0c0812' }, 2.6, .95); S.ln(g, [[17, -47], [9, -51.5], [3, -47.5]], { deep:'#0c0812' }, 2.6, .95);   // heavy angry brow ridge
      S.ln(g, [[-6, -64], [-3, -56], [-8, -50], [-4, -46]], { deep:'#1a0c08' }, 1.2, .8); S.ln(g, [[10, -60], [13, -52]], { deep:'#1a0c08' }, 1, .7); g.fillStyle = 'rgba(20,8,6,.35)'; ell(g, -4, -60, 9, 5, .3); g.fill(); }   // a split brow and soot
    if (FL){ for (const s of [-1, 1]) S.dot(g, PL([[s * 3, -41], [s * 16, -48.5], [s * 15, -41.5], [s * 4, -38.5]]), '#0c0812'); S.dot(g, PL([[-2.6, -38], [2.6, -38], [0, -32]]), '#0c0812'); }   // fallen: slanted sockets, narrow and sunk under the brow
    else { for (const s of [-1, 1]) S.dot(g, E(s * 9, -44, 6.5, 6.2), '#0c0812'); S.dot(g, PL([[-2.6, -38], [2.6, -38], [0, -32]]), '#0c0812'); }
    for (let x = -8; x <= 8; x += 4){ S.dot(g, RR(x - 1.6, -34, 3.2, 5, 1), FL ? '#b8a898' : '#e4dcee', .85); } S.overlay(g, cave, { deep:'#0c0812' }, { x:0, y:-52, r:22 }, .7); g.restore(); }
  g.save(); cave(g); g.clip(); const gr = g.createRadialGradient(0, -40, 2, 0, -40, 28); gr.addColorStop(0, `rgba(255,138,42,${.35 + cast * .4 + (F2 ? .1 : 0) + (FL ? .15 : 0)})`); gr.addColorStop(1, 'rgba(255,138,42,0)'); g.fillStyle = gr; g.fillRect(-40, -80, 80, 80); g.restore();
  S.stroke(g, SO([[-24, -38], [-18, -58], [0, -66], [18, -58], [24, -38]]), { deep:FL ? '#ff9a3a' : r.light }, 2.4, FL ? .7 : .5);
  const eyeR = 4.5 + cast * 1.5 + (F2 ? 1.6 : 0), eyeCol = F2 ? GK_EYE : '#ff8a2a';
  if (FL) for (const s of [-1, 1]){   // fallen eyes: narrow burning slits slanting inward under the brow, the fire bleeding up out of the socket
    const w = 6.2 + cast * 1.2, slit = (yy, k) => PL([[s * 3.6, yy - 1.2 * k], [s * (3.6 + w), yy - 6.4 * k], [s * (3.6 + w * .92), yy - 2.2 * k], [s * 4.2, yy + 1.4 * k]]);
    g.save(); g.shadowColor = FL_GLOW; g.shadowBlur = 16; S.dot(g, slit(-43, 1.25), '#ff7a1a', .9); g.restore();   // the glow bleed
    S.dot(g, slit(-43, 1), FL_RING); S.dot(g, slit(-43.2, .5), '#fff0c0', .95);   // ring of fire, white-hot core
    g.save(); g.shadowColor = FL_EMBER; g.shadowBlur = 5; for (let i = 0; i < 3; i++){ const q = ((i * .37 + ph) % 1), x = s * (7 + i * 3) + Math.sin(q * 9 + i) * 1.2, y = -47 - q * 11 - cast * 4; S.dot(g, E(x, y, .8 + q * .5, 1.6), i ? '#ffc060' : '#fff0c0', .85 * (1 - q)); } g.restore();   // fire licking up from the slit
  }
  else { S.glow(g, -9, -44, eyeR, eyeCol); S.glow(g, 9, -44, eyeR, eyeCol); }
  if (F2){ const R2 = rng(77); for (let i = 0; i < 8; i++){ const s = i % 2 ? 1 : -1, x = s * 9 + (R2() - .5) * 9, y = -49 - R2() * 16 - breathe * 2 - cast * 6, rr = .9 + R2() * 1.2; g.save(); g.shadowColor = '#ffb040'; g.shadowBlur = 4; S.dot(g, E(x, y, rr, rr * 1.3), i % 3 ? '#ffc060' : '#fff0c0', .75); g.restore(); } }   // embers drifting up from the sockets
  const ca = cast * 1.15 + breathe * .04, cs = Math.cos(ca), sn = Math.sin(ca), hx = -36 + (-34 * cs - 30 * sn), hy = -14 + (-34 * sn + 30 * cs);
  if (FL){ const lx = hx - 8 + swing * 1.4 - 10, ly = hy + 46 - 22; for (let i = 0; i < 5; i++){ const q = (i / 5 + ph) % 1, x = lx - q * 16 + Math.sin(q * 7 + i) * 3, y = ly - q * 44, rr = 3 + q * 6; const sg = g.createRadialGradient(x, y, 0, x, y, rr); sg.addColorStop(0, `rgba(140,126,132,${.22 * Math.sin(q * Math.PI)})`); sg.addColorStop(1, 'rgba(140,126,132,0)'); g.fillStyle = sg; ell(g, x, y, rr, rr); g.fill(); } }   // soft smoke puffs off the lantern, drifting away from the sleeve
  g.save(); g.translate(-36, -14); g.rotate(ca); g.translate(36, 14);
  const sleeve = SM([[-36, -14], [-64, -2], [-72, 14], [-56, 22], [-34, 8]], .7); S.part(g, sleeve, r, { x:-52, y:4, r:20 }, { flat:true, mat:'cloth' }); S.contact(g, robe, -36, -2, 10, 10, .4);
  if (FL){ g.save(); sleeve(g); g.clip(); g.shadowColor = FL_GLOW; g.shadowBlur = 5; S.ln(g, [[-66, 12], [-58, 4], [-62, -4]], { deep:'#ff8c2a' }, 1.3, .7); g.shadowBlur = 0; S.dot(g, E(-60, 16, 2, 1.6), '#070404', .9); g.strokeStyle = rgba('#ff7a30', .6); g.lineWidth = .9; ell(g, -60, 16, 2.6, 2.2); g.stroke(); g.restore(); }
  g.restore();
  S.tube(g, SO([[hx - 2, hy + 2], [hx - 8 + swing, hy + 26]]), w, 3.5);
  for (let i = 0; i < 3; i++){ const a = Math.PI * .55 + (i - 1) * .4; S.tube(g, SO([[hx, hy + 2], [hx + Math.cos(a) * 7, hy + 2 + Math.sin(a) * 8]]), k, 2.4); } S.part(g, E(hx + 2, hy, 5.5, 5), k, { x:hx + 2, y:hy, r:5.5 }, { flat:true, mat:'bone' });
  if (cast > 0){ const fl = g.createRadialGradient(hx - 8, hy + 50, 4, hx - 8, hy + 50, 30 + cast * 80); const fc = FL ? [255, 120, 30] : F2 ? [150, 255, 100] : [255, 200, 90]; fl.addColorStop(0, `rgba(${fc},${.55 * cast})`); fl.addColorStop(1, `rgba(${fc},0)`); g.fillStyle = fl; g.fillRect(-220, -140, 300, 320); }
  if (FL) lantern(g, hx - 8 + swing * 1.4, hy + 46, 1.2 + cast * .15, FL_GLOW, GLASSF, FL_RING, IRONF, .5 + (idle ?? 0) + cast);
  else if (F2) lantern(g, hx - 8 + swing * 1.4, hy + 46, 1.2 + cast * .15, GK_GLOW, LANG2, '#f4ffe0'); else lantern(g, hx - 8 + swing * 1.4, hy + 46, 1.1 + cast * .15);
  S.part(g, E(46, 4 + push, 5.5, 5), k, { x:46, y:4 + push, r:5.5 }, { flat:true, mat:'bone' });
  if (FL){   // embers rising off him and ash drifting down, looping with the idle phase; smoke off the lantern
    const R3 = rng(91); for (let i = 0; i < 18; i++){ const q = (R3() + ph) % 1, x0 = (R3() - .5) * 110, y0 = 60 - R3() * 110, x = x0 + Math.sin(q * 9 + i) * 4, y = y0 - q * 46, rr = .8 + R3() * 1.4, a = Math.sin(q * Math.PI) * .85;
      g.save(); g.shadowColor = FL_EMBER; g.shadowBlur = 5; S.dot(g, E(x, y, rr, rr * 1.4), i % 3 ? '#ffb040' : '#fff0c0', a); g.restore(); }
    for (let i = 0; i < 8; i++){ const q = (R3() + ph * .6) % 1, x = (R3() - .5) * 120 + Math.sin(q * 6 + i) * 5, y = -90 + q * 150, rr = 1 + R3() * 1.6; S.dot(g, E(x, y, rr, rr * .6, R3() * 3), '#8a8088', Math.sin(q * Math.PI) * .55); }
  }
  g.restore();
  if (FL){ const fl = stab > .25 ? Math.min(1, (stab - .25) / .5) : 0, tx = 46 + Math.sin(ang) * 48 + fl * 30, ty = 4 + push - Math.cos(ang) * 48 - fl * 34; crow(g, tx, ty, fl ? .35 + Math.sin(stab * 22) * .3 + fl * .3 : 0, fl); }   // the counting crow: perched on the shovel, takes off when it stabs
  if (fade > 0) g.restore();
  if (F2) g.restore();
}

// Registry entry, copied from w1.js and widened for the eclipse corona above the hood and the crow on the shovel.
export const FALLEN = { key:'gravekeeper', name:'The Fallen Gravekeeper', draw:fallenGravekeeper, scale:.68, dy:-13, box:{ x:-128, y:-164, w:242, h:274 }, variants:{ form2:true, fallen:true },
  clips:{ walk:{ n:8, fps:6, pose:t => ({ idle:t }) }, cast:{ n:6, fps:12, once:true, pose:t => ({ cast:t }) }, teleport:{ n:8, fps:16, once:true, pose:t => ({ cast:1, fade:t }) }, stab:{ n:8, fps:12, once:true, pose:t => ({ stab:t }) } }, still:{} };
