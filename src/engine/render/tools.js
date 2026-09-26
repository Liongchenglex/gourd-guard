// ---------- Tools: icons, field props and their animations (Toy Plastic) ----------
// Owner request (2026-09-26): the consumables drawn in the game's style with animations. toolIcon() paints the tray, shop,
// preview and drop icons; drawMinesFx / drawScarecrowsFx draw the props on the field; drawToolFx plays the one-off effects
// the engine pushes into G.vfx (firework, hammer, dynamite, lantern sweep, bomb drop, scarecrow break, mine surfacing).

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from './paint.js';
import { drawBlast } from './fx.js';
import { CS, FENCE_Y } from '../state.js';
import { TAU } from '../util.js';

const WOOD = pal('#b48a58'), WOODD = pal('#6b4526'), STEEL = pal('#aab3c4'), IRON = pal('#4c505c'), RED = pal('#d8323c'), BRASS = pal('#d9a53a'),
  STRAW = pal('#d9b455'), STRAWD = pal('#a8843a'), SACK = pal('#c9a57a'), HAT = pal('#3a2a1a'), COAT = pal('#5a4a7a'), SHIRT = pal('#8a3a3a'),
  FUSE = pal('#c9b090'), CARD = pal('#e04a3a'), GLASS = pal('#ffe3a0'), EARTH = pal('#4e3a26'), EARTHD = pal('#3a2a1c'), GREEN = pal('#5c9a3a'), CROW = pal('#2a2430');
const ease = t => 1 - (1 - t) * (1 - t);

// ---------- the objects, drawn around (0,0) in drawing units ----------
export function hammer(g){
  S.tube(g, SO([[-2, 30], [4, -6]]), WOOD, 8);
  S.part(g, RR(-20, -22, 40, 20, 5), STEEL, { x:0, y:-12, r:20 }, { mat:'metal', hx:-10, hy:-18 });
  S.part(g, RR(-20, -22, 12, 20, [5, 2, 2, 5]), pal('#8a929f'), { x:-14, y:-12, r:10 }, { flat:true, mat:'metal' });
  S.part(g, PL([[20, -22], [30, -14], [20, -2]]), STEEL, { x:24, y:-12, r:8 }, { flat:true, mat:'metal' });
  S.rivet(g, 0, -12, 2.6, STEEL);
}
export function rocket(g){
  S.tube(g, SO([[0, 6], [0, 34]]), WOODD, 3);
  S.part(g, RR(-8, -18, 16, 30, 5), CARD, { x:0, y:-3, r:14 }, { mat:'paint', hx:-4, hy:-10 });
  for (const y of [-12, -2, 8]) S.ln(g, [[-8, y], [8, y]], CARD, 1.2, .5);
  S.part(g, PL([[-9, -17], [0, -32], [9, -17]]), pal('#3d6ad0'), { x:0, y:-24, r:9 }, { flat:true });
  S.part(g, E(0, 14, 5, 3.5), pal('#ffd35a'), { x:0, y:14, r:5 }, { flat:true, noEdge:true });
  g.save(); g.shadowColor = '#ffd35a'; g.shadowBlur = 8; S.dot(g, E(0, 14, 2.4, 2.4), '#fff8d0'); g.restore();
}
export function dynamite(g, f = 0){   // f: fuse burn 0..1
  g.save(); g.rotate(-.35);
  S.part(g, RR(-9, -20, 18, 40, 4), CARD, { x:0, y:0, r:18 }, { mat:'paint', hx:-4, hy:-12 });
  for (const y of [-12, 8]) S.ln(g, [[-9, y], [9, y]], pal('#8a1e1a'), 1.4, .6);
  S.part(g, RR(-9, -20, 18, 5, [4, 4, 0, 0]), pal('#f4dfa0'), { x:0, y:-18, r:9 }, { flat:true, noEdge:true });
  const L = 16 * (1 - f); S.stroke(g, SO([[0, -20], [4, -26], [2, -20 - L]]), FUSE, 2.2, .9);
  g.save(); g.translate(2, -20 - L); g.shadowColor = '#ffd35a'; g.shadowBlur = 8; S.dot(g, E(0, 0, 3, 3), '#fff2b0'); for (let i = 0; i < 4; i++){ const a = i * TAU / 4 + f * 20; S.ln(g, [[0, 0], [Math.cos(a) * 6, Math.sin(a) * 6]], { deep:'#ffd35a' }, 1.2, .9); } g.restore();
  g.restore();
}
export function lantern(g, lit = 1){
  S.stroke(g, g2 => { g2.beginPath(); g2.arc(0, -26, 6, Math.PI, TAU); }, IRON, 2.4, .9);
  S.part(g, RR(-13, -20, 26, 6, 2), BRASS, { x:0, y:-17, r:13 }, { flat:true, mat:'metal' });
  g.save(); if (lit){ g.shadowColor = '#ffb640'; g.shadowBlur = 22 * lit; } S.part(g, RR(-11, -14, 22, 28, 3), GLASS, { x:0, y:0, r:14 }, { flat:true }); g.restore();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-8, -12, 3, 24);
  S.dot(g, E(0, 4, 5, 7), `rgba(255,182,64,${.5 + .5 * lit})`); S.dot(g, E(0, 2, 2, 3.2), '#fff8d0');
  S.ln(g, [[0, -14], [0, 14]], IRON, 1, .5); S.ln(g, [[-11, 0], [11, 0]], IRON, 1, .4);
  S.part(g, RR(-13, 14, 26, 6, 2), BRASS, { x:0, y:17, r:13 }, { flat:true, mat:'metal' });
}
export function mine(g, blink = 0){
  S.part(g, E(0, 4, 17, 8), IRON, { x:0, y:4, r:16 }, { flat:true, mat:'metal' });
  for (let i = 0; i < 7; i++){ const a = Math.PI + i * Math.PI / 6; S.part(g, PL([[Math.cos(a) * 13 - Math.sin(a) * 3, Math.sin(a) * 11 - 2 + Math.cos(a) * 3], [Math.cos(a) * 21, Math.sin(a) * 18 - 2], [Math.cos(a) * 13 + Math.sin(a) * 3, Math.sin(a) * 11 - 2 - Math.cos(a) * 3]]), STEEL, { x:Math.cos(a) * 16, y:Math.sin(a) * 14, r:5 }, { flat:true, mat:'metal' }); }
  S.part(g, E(0, -2, 15, 13), IRON, { x:0, y:-2, r:15 }, { mat:'metal', hx:-6, hy:-9 });
  S.ln(g, [[-14, -2], [14, -2]], IRON, 1, .5); for (const x of [-9, 0, 9]) S.rivet(g, x, -2, 1.6, STEEL);
  g.save(); g.shadowColor = blink ? '#ff5a4d' : '#ffd35a'; g.shadowBlur = 8 + 8 * blink; S.dot(g, E(0, -9, 3.2, 3.2), blink ? '#ff5a4d' : '#ffd35a'); g.restore(); S.dot(g, E(-1, -10, 1, 1), '#fff');
}
export function bomb(g, f = 0){
  S.part(g, E(0, 4, 19, 19), pal('#2e2a36'), { x:0, y:4, r:19 }, { mat:'metal', hx:-8, hy:-4 });
  S.part(g, RR(-7, -20, 14, 8, 2), IRON, { x:0, y:-16, r:7 }, { flat:true, mat:'metal' });
  const L = 14 * (1 - f); S.stroke(g, SO([[0, -20], [-5, -26], [-3, -20 - L]]), FUSE, 2.4, .9);
  g.save(); g.translate(-3, -20 - L); g.shadowColor = '#ffd35a'; g.shadowBlur = 8; S.dot(g, E(0, 0, 3, 3), '#fff2b0'); for (let i = 0; i < 5; i++){ const a = i * TAU / 5 + f * 30; S.ln(g, [[0, 0], [Math.cos(a) * 6, Math.sin(a) * 6]], { deep:'#ffd35a' }, 1.2, .9); } g.restore();
}
/** The scarecrow. P: sway (0..1 phase), wear (0..1 = falling apart), shake (0..1), crow (bool). */
export function scarecrow(g, P = {}){
  const sw = Math.sin((P.sway || 0) * TAU) * (1 - (P.wear || 0) * .5), wear = P.wear || 0, sh = P.shake ? Math.sin((P.shake) * 40) * 2 : 0;
  g.save(); g.translate(sh, 0);
  S.tube(g, SO([[0, 46], [0, -30]]), WOODD, 7);
  g.save(); g.translate(0, -16); g.rotate(sw * .06 - wear * .12);
  S.tube(g, SO([[-30, 0], [30, 0]]), WOODD, 5);
  // coat over the crossbar
  S.part(g, SM([[-22, -6], [22, -6], [26, 18], [14, 24], [-14, 24], [-26, 18]], .7), COAT, { x:0, y:8, r:24 }, { mat:'cloth', hx:-10, hy:0 });
  S.part(g, RR(-24, -4, 48, 7, 3), SHIRT, { x:0, y:0, r:24 }, { flat:true, mat:'cloth' });
  // straw out of the sleeves and the hem
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++){ if (wear > .5 && i > 1) continue; const a = s * (.4 + i * .3) + sw * .15; S.ln(g, [[s * 26, 0], [s * 26 + Math.cos(a) * 14 * s, Math.sin(a) * 12 + 2]], STRAW, 2.2, .95); }
  for (let i = -3; i <= 3; i++){ if (wear > .3 && Math.abs(i) > 1) continue; S.ln(g, [[i * 6, 22], [i * 7 + sw * 3, 34 + (i % 2) * 4]], STRAW, 2, .9); }
  // patches and buttons
  S.part(g, RR(-12, 8, 9, 8, 2), pal('#7a6a56'), { x:-8, y:12, r:5 }, { flat:true, mat:'cloth' }); for (const y of [2, 10, 18]) S.rivet(g, 4, y, 1.6, WOOD);
  g.restore();
  // head: a sack with a stitched face, hat askew as it wears
  g.save(); g.translate(sw * 2, -42 + wear * 3); g.rotate(sw * .05 + wear * .25);
  S.part(g, SM([[-14, -12], [14, -12], [16, 6], [8, 14], [-8, 14], [-16, 6]], .8), SACK, { x:0, y:0, r:16 }, { mat:'cloth', hx:-6, hy:-6 });
  S.ln(g, [[-4, -14], [4, -14]], SACK, 1.2, .6);
  for (const s of [-1, 1]){ S.ln(g, [[s * 8, -4], [s * 3, 1]], HAT, 1.6, .9); S.ln(g, [[s * 8, 1], [s * 3, -4]], HAT, 1.6, .9); }
  S.stroke(g, SO([[-6, 7], [-2, 9], [2, 9], [6, 7]]), HAT, 1.4, .8); for (const x of [-4, 0, 4]) S.ln(g, [[x, 6], [x, 10]], HAT, .9, .6);
  for (let i = -2; i <= 2; i++) S.ln(g, [[i * 5, -12], [i * 6, -18 - (i % 2) * 3]], STRAW, 1.8, .9);
  S.part(g, RR(-20, -16, 40, 5, 2), HAT, { x:0, y:-14, r:20 }, { flat:true, mat:'cloth' });
  S.part(g, SM([[-11, -16], [-9, -32], [10, -34], [12, -16]], .6), HAT, { x:0, y:-24, r:12 }, { mat:'cloth', hx:-4, hy:-28 });
  S.ln(g, [[-11, -19], [12, -19]], pal('#b0801a'), 2, .9);
  g.restore();
  if (P.crow){ g.save(); g.translate(-30 + sw * 1.5, -22); S.part(g, E(0, 0, 7, 5), CROW, { x:0, y:0, r:7 }, { flat:true }); S.part(g, E(5, -5, 4, 4), CROW, { x:5, y:-5, r:4 }, { flat:true }); S.part(g, PL([[8, -5], [13, -4], [8, -3]]), pal('#e8a030'), { x:10, y:-4, r:3 }, { flat:true }); S.dot(g, E(6, -6, 1, 1), '#fff'); S.ln(g, [[-7, 0], [-12, -3]], CROW, 1.4, .9); g.restore(); }
  g.restore();
}

// ---------- icons for the tray, shop, cards and drops ----------
const iconCache = new Map();
export function toolIcon(key, px = 44){
  const ck = key + ':' + px; if (iconCache.has(ck)) return iconCache.get(ck);
  const c = document.createElement('canvas'); c.width = c.height = px * 2; const g = c.getContext('2d'); g.scale(px * 2 / 64, px * 2 / 64); g.translate(32, 34);
  switch (key){
    case 'repair': g.rotate(.5); g.scale(.9, .9); hammer(g); break;
    case 'fw': g.rotate(.45); g.scale(.95, .95); rocket(g); break;
    case 'buster': g.scale(.9, .9); dynamite(g, .2); break;
    case 'lantern': g.scale(.95, .95); g.translate(0, 4); lantern(g, 1); break;
    case 'mine': g.scale(1.05, 1.05); g.translate(0, 4); mine(g, 0); break;
    case 'bomb': g.scale(1, 1); g.translate(0, 4); bomb(g, .2); break;
    case 'scarecrow': g.scale(.62, .62); g.translate(0, 8); scarecrow(g, { sway:.25 }); break;
    case 'fence': g.translate(0, 2); for (let i = -1; i <= 1; i++) S.part(g, PL([[i * 16 - 6, -14], [i * 16, -22], [i * 16 + 6, -14], [i * 16 + 6, 20], [i * 16 - 6, 20]]), WOOD, { x:i * 16, y:0, r:12 }, { mat:'wood', flat:i !== 0 }); for (const y of [-4, 10]) S.part(g, RR(-26, y - 3, 52, 6, 2), WOODD, { x:0, y, r:26 }, { flat:true, mat:'wood' }); break;
    default: S.part(g, E(0, 0, 20, 20), STEEL, { x:0, y:0, r:20 }, { mat:'metal' });
  }
  iconCache.set(ck, c);
  return c;
}

// ---------- field props ----------
const MINE_ARM_DEFAULT = 6;
export function drawMinesFx(g, mines, t, fieldY, laneX, MINE_ARM = MINE_ARM_DEFAULT){
  for (const m of mines){
    const x = laneX(m.lane), y = fieldY(m.p), tt = m.t || 0, R = rng(m.lane * 31 + Math.round(m.p * 97));
    if (tt < MINE_ARM){   // buried: a mound that trembles as the timer runs out, with a ring filling around it
      const f = tt / MINE_ARM, rumble = f > .8 ? Math.sin(t * 40) * (f - .8) * 8 : 0;
      g.save(); g.translate(x + rumble, y);
      S.part(g, E(0, 4, 16, 6), EARTHD, { x:0, y:4, r:16 }, { flat:true, mat:'stone', noEdge:true }); S.part(g, E(0, 0, 13, 6), EARTH, { x:0, y:0, r:13 }, { flat:true, mat:'stone' });
      for (let i = 0; i < 4; i++) S.part(g, E(-9 + i * 6 + (R() - .5) * 3, -2 + (R() - .5) * 3, 2, 1.4), EARTHD, { x:0, y:0, r:2 }, { flat:true, noEdge:true });
      if (f > .8) for (let i = 0; i < 3; i++){ const a = (t * 3 + i) % 1; S.dot(g, E((i - 1) * 8, -6 - a * 14, 1.8, 1.8), rgba(EARTH.base, 1 - a)); }
      g.restore();
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 19, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(255,211,90,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 19, -Math.PI / 2, -Math.PI / 2 + TAU * f); g.stroke();
      continue;
    }
    const up = Math.min(1, (tt - MINE_ARM) / .35), s = .4 + .6 * ease(up) * (1 + .25 * Math.sin(up * Math.PI));   // pops up out of the ground
    g.save(); g.translate(x, y + 4 - (1 - up) * 4);
    S.part(g, E(0, 8, 18, 6), EARTHD, { x:0, y:8, r:18 }, { flat:true, mat:'stone', noEdge:true });
    if (up < 1) for (let i = 0; i < 6; i++){ const a = -Math.PI * .9 + i * Math.PI * .8 / 5, d = 10 + up * 26; S.part(g, E(Math.cos(a) * d, Math.sin(a) * d * .6 + up * up * 20, 3, 2.2), EARTH, { x:0, y:0, r:3 }, { flat:true }); }
    g.scale(s, s * (2 - s > 1 ? 1 : 1)); mine(g, Math.floor(t * 3) % 2);
    g.restore();
  }
}
/** Scarecrows: planted with a drop-in, sway in the wind, shake when chewed, fall apart as they lose health. */
export function drawScarecrowsFx(g, scs, t, chewers){
  for (const sc of scs){
    const age = sc.age == null ? 1 : sc.age, plant = Math.min(1, age / .4), wear = 1 - sc.hp / sc.maxHp, chewed = chewers(sc);
    const drop = (1 - ease(plant)) * -80, squash = plant < 1 ? 1 + .25 * Math.sin(plant * Math.PI) : 1;
    g.save(); g.translate(sc.x, sc.y + 20);
    S.shadow(g, 0, 8, 22 * plant, 6 * plant);
    if (plant < 1) for (let i = 0; i < 6; i++){ const a = i * Math.PI / 5, d = 8 + plant * 26; S.dot(g, E(Math.cos(a) * d, 6 - Math.sin(a) * d * .3 - plant * 6, 2.5, 1.8), rgba(EARTH.base, 1 - plant)); }
    g.translate(0, drop); g.scale(1 / squash, squash); g.scale(.78, .78); g.translate(0, -46);
    scarecrow(g, { sway:(t * .35 + sc.lane * .17) % 1, wear, shake:chewed ? t : 0, crow:!chewed && wear < .5 });
    if (chewed) for (let i = 0; i < 3; i++){ const a = (t * 1.5 + i * .33) % 1; S.ln(g, [[-20 + i * 20, 10 + a * 40], [-24 + i * 20 + Math.sin(a * 8) * 4, 16 + a * 40]], STRAW, 2, 1 - a); }
    g.restore();
    const bw = 40, bx = sc.x - bw / 2, by = sc.y + 30;
    g.fillStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.roundRect(bx - 1, by - 1, bw + 2, 7, 3); g.fill();
    g.fillStyle = '#d9b455'; g.beginPath(); g.roundRect(bx, by, Math.max(0, bw * sc.hp / sc.maxHp), 5, 2.5); g.fill();
  }
}

// ---------- one-off effects ----------
const FW_COLS = ['#ffd35a', '#ff6a3a', '#d09bff', '#aee8ff', '#a6f06a'];
export function drawToolFx(g, v, t){
  const p = Math.min(1, Math.max(0, v.t / v.dur));
  switch (v.kind){
    case 'firework': {   // a rocket climbs from the fence, then bursts into rays and a sparkle ring in its colour
      const rise = .42, col = v.col || FW_COLS[v.i % 5];
      if (p < rise){ const q = ease(p / rise), y = FENCE_Y - 20 + (v.y - FENCE_Y + 20) * q, x = v.x + Math.sin(q * 6) * 6;
        g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++){ const f = i / 8; g.globalAlpha = (1 - f) * .6; S.dot(g, E(x, y + 6 + f * 40, 3 - f * 2, 5), '#ffd35a'); } g.restore();
        g.save(); g.translate(x, y); g.rotate(Math.sin(q * 6) * .2); g.scale(.7, .7); rocket(g); g.restore(); }
      else { const q = (p - rise) / (1 - rise), r = 18 + ease(q) * 62, R = rng(v.i * 7 + 3);
        g.save(); g.globalCompositeOperation = 'lighter'; g.translate(v.x, v.y);
        const gl = g.createRadialGradient(0, 0, 0, 0, 0, r * .8); gl.addColorStop(0, rgba(col, (1 - q) * .55)); gl.addColorStop(1, rgba(col, 0)); g.fillStyle = gl; g.fillRect(-r, -r, r * 2, r * 2);
        g.lineCap = 'round'; for (let i = 0; i < 14; i++){ const a = i * TAU / 14 + R() * .3, L = r * (.8 + R() * .3), inner = r * q * .5; g.globalAlpha = 1 - q; g.strokeStyle = i % 2 ? col : '#fff6d0'; g.lineWidth = 3 - q * 2; g.beginPath(); g.moveTo(Math.cos(a) * inner, Math.sin(a) * inner + q * q * 20); g.lineTo(Math.cos(a) * L, Math.sin(a) * L + q * q * 30); g.stroke();
          g.fillStyle = '#fff'; S.dot(g, E(Math.cos(a) * L, Math.sin(a) * L + q * q * 30, 2.5 * (1 - q) + .5, 2.5 * (1 - q) + .5), '#fff'); }
        g.restore(); }
      break; }
    case 'hammer': {   // swings twice onto the wall with sparks and chips
      const sw = (p * 2) % 1, ang = sw < .5 ? -1.4 + ease(sw * 2) * 1.9 : .5 - (sw - .5) * 2 * 1.9 * .3;
      g.save(); g.translate(v.x + 14, v.y - 38); g.rotate(ang); g.scale(.9, .9); hammer(g); g.restore();
      if (sw > .45 && sw < .75){ const q = (sw - .45) / .3, R = rng(Math.floor(p * 2) * 5 + 1); for (let i = 0; i < 6; i++){ const a = -Math.PI * (.2 + R() * .6), d = 6 + q * 26; S.dot(g, E(v.x + Math.cos(a) * d, v.y - 10 + Math.sin(a) * d + q * q * 18, 2.4, 1.6), rgba(i % 2 ? WOOD.light : '#ffe27a', 1 - q)); } }
      break; }
    case 'dynamite': {   // dropped on a grave, the fuse burns down, then it blows
      if (p < .55){ const q = p / .55, fall = Math.min(1, q * 2.2); g.save(); g.translate(v.x, v.y - 12 - (1 - ease(fall)) * 60); g.scale(.75, .75); dynamite(g, q); g.restore(); }
      else drawBlast(g, { x:v.x, y:v.y, t:(p - .55) / .45 * .6, dur:.6, r:CS * .7, seed:9 });
      break; }
    case 'lantern': {   // the lantern lifts from the fence line and a warm sweep runs up the field
      const lift = Math.min(1, p / .3), y = v.y - ease(lift) * 50;
      g.save(); g.translate(v.x, y); g.scale(1.1, 1.1); lantern(g, 1); g.restore();
      if (p > .25){ const q = (p - .25) / .75, r = 40 + ease(q) * 900; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(v.x, y, r * .7, v.x, y, r); gr.addColorStop(0, 'rgba(255,200,90,0)'); gr.addColorStop(.7, `rgba(255,210,110,${(1 - q) * .35})`); gr.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = gr; g.fillRect(v.x - r, y - r, r * 2, r * 2); g.restore(); }
      break; }
    case 'bombdrop': {   // falls from above onto the spot, shadow growing, fuse sparking
      const q = ease(p), y = v.y - (1 - q) * 360;
      g.fillStyle = `rgba(0,0,0,${.15 + .3 * q})`; ell(g, v.x, v.y + 6, 10 + 12 * q, 4 + 5 * q); g.fill();
      g.save(); g.translate(v.x, y); g.rotate(p * 4); g.scale(1.1, 1.1); bomb(g, p); g.restore();
      break; }
    case 'scbreak': {   // the post tips over and the straw scatters
      const R = rng(v.x | 0);
      g.save(); g.translate(v.x, v.y + 20); g.rotate(ease(p) * 1.3); g.globalAlpha = 1 - p * .8; g.scale(.78, .78); g.translate(0, -46); scarecrow(g, { sway:0, wear:1 }); g.restore();
      for (let i = 0; i < 12; i++){ const a = R() * TAU, d = 10 + ease(p) * (30 + R() * 30); S.ln(g, [[v.x + Math.cos(a) * d, v.y + Math.sin(a) * d * .5 + p * p * 40], [v.x + Math.cos(a) * d + 6, v.y + Math.sin(a) * d * .5 + p * p * 40 + 3]], STRAW, 2, 1 - p); }
      break; }
  }
}
