// ---------- Loot: chests, boss items and the seed currency, drawn in Toy Plastic ----------
// Icons are painted once into cached canvases (px × px drawn at 2× for crispness) and blitted; never paint per frame.
//   chestIcon(kind, open, px)  kind 'normal' | 'boss'
//   bossItemIcon(boss, px)     boss 'gravekeeper' | 'poltergeist' | 'hexwitch' | 'vampirecount' | 'twintides'
//   seedIcon(px)               the premium currency

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from './paint.js';
import { TAU } from '../util.js';

const WOOD = pal('#a8703e'), WOODD = pal('#7a4a26'), WOODIN = pal('#4a2a16'), IRON = pal('#5a5e6c'), PUMP = pal('#ee8a2e'), STEM = pal('#6b4526'),
  LAC = pal('#3c1f46'), LACD = pal('#26122e'), GOLD = pal('#eab53a'), GOLDC = pal('#f4c430'), BONE = pal('#efe6d0'), BATC = pal('#2e2236'),
  GEM = pal('#e0385a'), GEMG = pal('#3ad06a'), SEED = pal('#f3e3b8'), RUST = pal('#8a5a44'), SHEET = pal('#eef0fb'), HATB = pal('#4a2a66'),
  WING = pal('#5a2440'), WINGB = pal('#c9b8a8'), SHELL = pal('#f2b8a8'), PEARL = pal('#f4f0ff');

export const BOSS_ITEM_NAMES = { gravekeeper:'Grave key', poltergeist:'Sheet scrap', hexwitch:'Hex charm', vampirecount:'Bat wing', twintides:'Tide pearl' };

// ---------- small bits ----------
function coin(g, x, y, r, rot = 0, k = 1){
  S.part(g, E(x, y, r, r * k, rot), GOLDC, { x, y, r }, { mat:'metal', hx:x - r * .35, hy:y - r * .4 * k, lw:.9 });
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, k); g.strokeStyle = rgba(GOLDC.deep, .55); g.lineWidth = r * .14; ell(g, 0, 0, r * .64, r * .64); g.stroke(); g.restore();
}
function gem(g, x, y, r, c = GEM, rot = 0){
  g.save(); g.translate(x, y); g.rotate(rot);
  S.part(g, PL([[-r * .6, -r * .7], [r * .6, -r * .7], [r, -r * .15], [0, r], [-r, -r * .15]]), c, { x:0, y:0, r }, { hx:-r * .3, hy:-r * .4, lw:.9 });
  g.strokeStyle = rgba(c.light, .8); g.lineWidth = .6; g.beginPath(); g.moveTo(-r, -r * .15); g.lineTo(r, -r * .15); g.moveTo(-r * .3, -r * .15); g.lineTo(0, r); g.lineTo(r * .3, -r * .15); g.stroke();
  g.restore();
}
function sparkle(g, x, y, s, a = 1, col = '#fffbe0', glow = '#fff2a0'){
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.shadowColor = glow; g.shadowBlur = 4;
  g.beginPath(); for (let i = 0; i < 4; i++){ const an = i * TAU / 4; g.lineTo(Math.cos(an) * s, Math.sin(an) * s); g.quadraticCurveTo(0, 0, Math.cos(an + TAU / 4) * s, Math.sin(an + TAU / 4) * s); }
  g.closePath(); g.fillStyle = col; g.fill(); g.restore();
}
function glow(g, x, y, r, col, a){ const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; ell(g, x, y, r, r); g.fill(); }
function rays(g, x, y, col, a, n = 5, len = 34, spread = 1.3){
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++){ const an = -Math.PI / 2 + (i - (n - 1) / 2) * spread / (n - 1), w = .1; const gr = g.createLinearGradient(x, y, x + Math.cos(an) * len, y + Math.sin(an) * len); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr;
    g.beginPath(); g.moveTo(x + Math.cos(an - Math.PI / 2) * 3, y + Math.sin(an - Math.PI / 2) * 3); g.lineTo(x + Math.cos(an - w) * len, y + Math.sin(an - w) * len); g.lineTo(x + Math.cos(an + w) * len, y + Math.sin(an + w) * len); g.lineTo(x + Math.cos(an + Math.PI / 2) * 3, y + Math.sin(an + Math.PI / 2) * 3); g.closePath(); g.fill(); }
  g.restore();
}
function planks(g, clip, x0, x1, ys, c){ g.save(); clip(g); g.clip(); for (const y of ys){ g.strokeStyle = rgba(c.deep, .55); g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); g.strokeStyle = rgba(c.light, .35); g.lineWidth = .6; g.beginPath(); g.moveTo(x0, y + 1); g.lineTo(x1, y + 1); g.stroke(); } g.restore(); }
function pumpkinLock(g, x, y){
  S.stroke(g, g2 => { g2.beginPath(); g2.arc(x, y - 4, 4.2, Math.PI, TAU); }, IRON, 2.2, .95);
  g.strokeStyle = '#9aa0ae'; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y - 4, 4.2, Math.PI, TAU); g.stroke();
  const b = E(x, y + 2.5, 7.5, 6.2); S.part(g, b, PUMP, { x, y:y + 2.5, r:7.5 }, { mat:'pumpkin', hx:x - 3, hy:y - .5, lw:1 });
  for (const dx of [-3.2, 3.2]){ g.strokeStyle = rgba(PUMP.deep, .55); g.lineWidth = .8; g.beginPath(); g.moveTo(x + dx * .6, y - 3); g.quadraticCurveTo(x + dx * 1.5, y + 2.5, x + dx * .6, y + 8.4); g.stroke(); }
  S.part(g, RR(x - 1, y - 5, 2.2, 3.2, 1), STEM, { x, y:y - 3.5, r:2 }, { flat:true, lw:.6 });
  S.dot(g, PL([[x - 1.3, y + 1.5], [x + 1.3, y + 1.5], [x, y + 5.5]]), '#2a1408'); S.dot(g, E(x, y + 1.5, 1.4, 1.4), '#2a1408');
}
function skullCrest(g, x, y, s, col = BONE){
  for (const d of [-1, 1]) S.part(g, SM([[x + d * 3 * s, y - 1 * s], [x + d * 13 * s, y - 7 * s], [x + d * 16 * s, y - 1 * s], [x + d * 13 * s, y + 1 * s], [x + d * 10 * s, y + 4 * s], [x + d * 7 * s, y + 2 * s], [x + d * 4 * s, y + 4 * s]], .6), BATC, { x:x + d * 9 * s, y, r:8 * s }, { flat:true, lw:.8 });
  const sk = SM([[x - 5 * s, y - 3 * s], [x, y - 7 * s], [x + 5 * s, y - 3 * s], [x + 4 * s, y + 2 * s], [x + 2.4 * s, y + 5 * s], [x - 2.4 * s, y + 5 * s], [x - 4 * s, y + 2 * s]], .9);
  S.part(g, sk, col, { x, y:y - 1 * s, r:6 * s }, { mat:'bone', hx:x - 2 * s, hy:y - 4 * s, lw:.8 });
  S.dot(g, E(x - 2 * s, y - .5 * s, 1.5 * s, 1.7 * s), '#1a0c1c'); S.dot(g, E(x + 2 * s, y - .5 * s, 1.5 * s, 1.7 * s), '#1a0c1c'); S.dot(g, PL([[x - .6 * s, y + 2 * s], [x + .6 * s, y + 2 * s], [x, y + 1 * s]]), '#1a0c1c');
}
function mkCanvas(px, units, oy = 0){ const c = document.createElement('canvas'); c.width = c.height = px * 2; const g = c.getContext('2d'); g.scale(px * 2 / units, px * 2 / units); g.translate(units / 2, units / 2 + oy); return [c, g]; }

// ---------- chests ----------
function chest(g, boss, open){
  const body = boss ? LAC : WOOD, trim = boss ? GOLD : IRON, lidC = boss ? LACD : WOODD, W = boss ? 29 : 26, x0 = -W, x1 = W;
  if (boss) glow(g, 0, 2, 40, '#a45ad8', open ? .5 : .42);
  S.shadow(g, 0, 27, W + 6, 4);
  if (open){
    // lid thrown back: its inside faces us
    const lid = PL([[x0 + 1, -4], [x1 - 1, -4], [x1 + 3, -30], [x0 - 3, -30]]);
    S.part(g, lid, boss ? pal('#5a2a6a') : WOODIN, { x:0, y:-17, r:W }, { flat:true, mat:boss ? 'cloth' : 'wood', lw:1.2 });
    if (!boss) planks(g, lid, x0 - 4, x1 + 4, [-12, -21], WOODIN);
    S.part(g, PL([[x0 - 3, -30], [x1 + 3, -30], [x1 + 1, -35], [x0 - 1, -35]]), lidC, { x:0, y:-32, r:W }, { flat:true, mat:boss ? 'paint' : 'wood', lw:1.2 });
    for (const s of [-1, 1]) S.part(g, PL([[s * (W - 10) - 3, -4], [s * (W - 10) + 3, -4], [s * (W - 9) + 3.5, -35], [s * (W - 9) - 3.5, -35]]), trim, { x:s * (W - 10), y:-20, r:6 }, { flat:true, mat:'metal', lw:1 });
    // warm light out of the chest
    glow(g, 0, -6, 34, boss ? '#ffd27a' : '#ffcf6a', .6);
    rays(g, 0, -4, '#fff0b0', .55, 5, 38, 1.5);
  }
  // box
  const box = RR(x0, -6, W * 2, 30, 4);
  S.part(g, box, body, { x:-4, y:6, r:W + 4 }, { mat:boss ? 'paint' : 'wood', hx:x0 + 10, hy:0 });
  if (!boss) planks(g, box, x0, x1, [4, 14], body);
  if (boss){ S.ln(g, [[x0 + 3, 1], [x1 - 3, 1]], GOLD, 1, .8); g.strokeStyle = rgba(GOLD.light, .8); g.lineWidth = .8; g.beginPath(); g.moveTo(x0 + 3, 19); g.lineTo(x1 - 3, 19); g.stroke(); }
  // bands and corners
  for (const s of [-1, 1]) S.part(g, RR(s * (W - 10) - 3, -6, 6, 30, 1), trim, { x:s * (W - 10), y:9, r:8 }, { flat:true, mat:'metal', lw:1 });
  for (const s of [-1, 1]){ S.part(g, PL([[s * W, -6], [s * (W - 7), -6], [s * W, 1]]), trim, { x:s * (W - 3), y:-3, r:4 }, { flat:true, lw:.9 }); S.part(g, PL([[s * W, 24], [s * (W - 7), 24], [s * W, 17]]), trim, { x:s * (W - 3), y:21, r:4 }, { flat:true, lw:.9 }); }
  if (boss) for (const s of [-1, 1]) S.part(g, SM([[s * (W - 8), 22], [s * (W - 2), 22], [s * (W - 1), 28], [s * (W - 9), 28]], .6), GOLD, { x:s * (W - 5), y:25, r:4 }, { flat:true, mat:'metal', lw:.9 });
  for (const s of [-1, 1]) for (const y of [0, 18]) S.rivet(g, s * (W - 10), y, 1.2, trim);
  if (open){
    // the mouth, heaped with gold
    S.dot(g, RR(x0 + 3, -9, W * 2 - 6, 6, 2), boss ? '#1c0a22' : '#2a1408');
    const heap = SM([[x0 + 4, -5], [-14, -12], [-4, -15], [6, -13], [16, -14], [x1 - 4, -5]], .8);
    S.part(g, heap, GOLDC, { x:0, y:-8, r:W }, { mat:'metal', hx:-8, hy:-12, lw:1 });
    for (const [x, y, r, rot, k] of [[-15, -11, 4.2, .3, .6], [-5, -15, 4.6, -.2, .7], [7, -14, 4.2, .2, .55], [17, -11, 4, -.4, .6], [0, -9, 4, 0, .5]]) coin(g, x, y, r, rot, k);
    gem(g, 11, -18, 3.6, boss ? pal('#b04ae0') : GEM, .3); if (boss) gem(g, -11, -17, 3, GEMG, -.3);
    // spill over the front
    coin(g, x1 - 4, 2, 4.4, .6, .45); coin(g, x1 + 4, 24, 4.4, 0, .45); coin(g, x0 + 2, 25, 4, 0, .45);
    // the lid lip, in front of the back of the heap
    S.part(g, RR(x0 - 1, -8, W * 2 + 2, 5, 2), trim, { x:0, y:-6, r:W }, { flat:true, mat:'metal', lw:1 });
    sparkle(g, -10, -22, 4, .95); sparkle(g, 14, -26, 3, .85); sparkle(g, x1 + 2, -10, 3.2, .8); sparkle(g, -4, -32, 2.4, .7);
    if (boss) skullCrest(g, 0, 8, .9, GOLD);
    else pumpkinLock(g, 0, 7);
  } else {
    // closed lid
    const lid = SM([[x0, -6, 1], [x0, -14], [x0 + 6, -23], [0, -25], [x1 - 6, -23], [x1, -14], [x1, -6, 1]], .8);
    S.part(g, lid, lidC, { x:-4, y:-14, r:W }, { mat:boss ? 'paint' : 'wood', hx:x0 + 12, hy:-19 });
    if (!boss) planks(g, lid, x0, x1, [-16], lidC);
    for (const s of [-1, 1]){ g.save(); lid(g); g.clip(); S.part(g, RR(s * (W - 10) - 3, -30, 6, 26, 1), trim, { x:s * (W - 10), y:-16, r:8 }, { flat:true, mat:'metal', lw:1 }); g.restore(); S.rivet(g, s * (W - 10), -16, 1.2, trim); }
    S.part(g, RR(x0 - 1, -8, W * 2 + 2, 5, 2), trim, { x:0, y:-6, r:W }, { flat:true, mat:'metal', lw:1 });
    if (boss){
      S.part(g, SM([[-7, -8], [7, -8], [6, 8], [0, 12], [-6, 8]], .5), GOLD, { x:0, y:1, r:8 }, { mat:'metal', hx:-3, hy:-4, lw:1 });
      S.dot(g, E(0, 1, 1.6, 1.6), '#1a0c1c'); S.dot(g, PL([[-.9, 1.5], [.9, 1.5], [0, 5.5]]), '#1a0c1c');
      skullCrest(g, 0, -17, .85, GOLD);
      sparkle(g, x1 - 6, -21, 2.6, .85); sparkle(g, x0 + 4, 4, 2, .6, '#f0d8ff', '#c88aff');
    } else pumpkinLock(g, 0, 0);
  }
}
const cache = new Map();
/** A treasure chest icon. kind 'normal' (wooden, iron bands, pumpkin padlock) or 'boss' (lacquer and gold, skull-and-bat crest). */
export function chestIcon(kind = 'normal', open = false, px = 64){
  const key = `chest:${kind}:${open ? 1 : 0}:${px}`; if (cache.has(key)) return cache.get(key);
  const [c, g] = mkCanvas(px, 72, 4); chest(g, kind === 'boss', open); cache.set(key, c); return c;
}

// ---------- boss items ----------
const ITEMS = {
  gravekeeper(g){
    g.rotate(-.7);
    const R = rng(5);
    S.tube(g, SO([[0, -8], [0, 26]]), RUST, 5.5);
    for (const [y, w] of [[18, 7], [24, 5]]) S.part(g, RR(0, y - 2, w, 4, .8), RUST, { x:w / 2, y, r:4 }, { flat:true, mat:'metal', lw:.9 });
    S.part(g, RR(-4, -8, 8, 3.5, 1), RUST, { x:0, y:-6, r:4 }, { flat:true, mat:'metal', lw:.9 });
    // skull bow
    const sk = SM([[-11, -18], [-8, -27], [0, -30], [8, -27], [11, -18], [8, -11], [5, -8], [-5, -8], [-8, -11]], .9);
    S.part(g, sk, RUST, { x:0, y:-19, r:12 }, { mat:'metal', hx:-5, hy:-24, lw:1.1 });
    g.save(); sk(g); g.clip(); for (let i = 0; i < 9; i++){ S.dot(g, E(-10 + R() * 20, -30 + R() * 22, 1 + R() * 2, .8 + R() * 1.4, R() * 3), R() < .5 ? '#c8703a' : '#5a3424', .55); } g.restore();
    for (const s of [-1, 1]){ S.dot(g, E(s * 4.2, -18, 3.2, 3.6), '#140a10'); g.save(); g.shadowColor = '#8cff5a'; g.shadowBlur = 5; S.dot(g, E(s * 4.2, -17.6, 1.3, 1.5), '#b8ff8a'); g.restore(); }
    S.dot(g, PL([[-1.3, -13], [1.3, -13], [0, -15.6]]), '#140a10');
    for (const x of [-3, 0, 3]) S.ln(g, [[x, -11], [x, -8.6]], RUST, .9, .8);
    for (let i = 0; i < 5; i++) S.dot(g, E(-1.5 + R() * 3, -4 + R() * 28, .9 + R(), .7 + R() * .6), '#c8703a', .6);
  },
  poltergeist(g){
    g.save(); g.globalAlpha = .45; glow(g, 0, 0, 30, '#c8d8ff', .6); g.restore();
    const R = rng(9), pts = [[-20, -16], [-8, -22], [2, -18], [14, -24], [22, -12], [18, -4], [24, 6], [16, 12], [18, 22], [8, 16], [2, 26], [-6, 18], [-14, 24], [-16, 12], [-24, 8], [-18, -2]];
    const sheet = PL(pts);
    S.part(g, sheet, SHEET, { x:-2, y:-2, r:24 }, { hx:-8, hy:-10, lw:1.1 });
    S.overlay(g, sheet, pal('#9aa8d8'), { x:-2, y:-2, r:24 }, .35);
    S.crease(g, SO([[-12, -12], [-6, 2], [-10, 16]]), pal('#aab4dc'), 1.4, .45); S.crease(g, SO([[8, -16], [6, 0], [10, 10]]), pal('#aab4dc'), 1.4, .45);
    // stitched hole
    const hole = SM([[-3, -6], [5, -8], [8, 0], [3, 6], [-4, 4], [-6, -1]], .9);
    S.dot(g, hole, 'rgba(40,40,80,.55)'); g.strokeStyle = 'rgba(60,64,110,.8)'; g.lineWidth = 1; hole(g); g.stroke();
    g.strokeStyle = '#4a4a7a'; g.lineWidth = 1; for (let i = 0; i < 7; i++){ const a = i / 7 * TAU, x = 1 + Math.cos(a) * 8.5, y = -1 + Math.sin(a) * 7.5; g.beginPath(); g.moveTo(x - Math.cos(a) * 2.2, y - Math.sin(a) * 2.2); g.lineTo(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2); g.stroke(); }
    // wispy torn threads trailing off
    for (const [x, y, d] of [[18, 22, 1.2], [2, 26, 1.6], [-14, 24, 2], [24, 6, .3]]){ g.strokeStyle = 'rgba(220,228,255,.75)'; g.lineWidth = .9; for (let i = 0; i < 3; i++){ const a = d + (R() - .5) * .8, l = 4 + R() * 5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + (R() - .5) * 3, y + Math.sin(a) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } }
    for (const [x, y, r] of [[-22, 20, 2.2], [24, -18, 1.8], [-26, -8, 1.4]]){ S.dot(g, E(x, y, r, r), '#e8eeff', .6); }
  },
  hexwitch(g){
    g.rotate(-.12);
    S.part(g, RR(-26, -6, 52, 13, 2), HATB, { x:0, y:0, r:26 }, { mat:'cloth', hx:-14, hy:-4, lw:1.1 });
    S.crease(g, SO([[-24, 4], [-12, 5], [0, 3]]), HATB, 1, .4);
    g.save(); g.transform(1, 0, -.18, 1, 0, 0);
    const outer = RR(-15, -15, 30, 30, 4), inner = RR(-9, -9, 18, 18, 2);
    g.save(); g.beginPath(); g.rect(-40, -40, 80, 80); inner(g); g.clip('evenodd');
    S.part(g, outer, GOLD, { x:0, y:0, r:16 }, { mat:'metal', hx:-8, hy:-10, lw:1.1 }); g.restore();
    g.strokeStyle = rgba(GOLD.deep, .9); g.lineWidth = 1.1; inner(g); g.stroke();
    for (const [x, y] of [[-12, -12], [12, -12], [12, 12], [-12, 12]]) S.rivet(g, x, y, 1.4, GOLD);
    g.restore();
    // hex runes scratched into the frame
    g.strokeStyle = rgba(GOLD.deep, .7); g.lineWidth = .8; for (const [x, y] of [[-2, -12.5], [12.6, 0], [-14.2, 1]]){ g.beginPath(); g.moveTo(x - 1.5, y - 1.2); g.lineTo(x + 1.5, y + 1.2); g.moveTo(x + 1.5, y - 1.2); g.lineTo(x - 1.5, y + 1.2); g.stroke(); }
    g.save(); g.globalAlpha = .7; glow(g, 0, 0, 16, '#6aff8a', .55); g.restore();
    gem(g, 0, -.5, 7, GEMG, 0);
    sparkle(g, -3.5, -4.5, 2.6, .95); sparkle(g, 16, -18, 2.6, .8, '#e8ffe8', '#6aff8a');
    // a little crooked hat charm hanging off the buckle
    S.ln(g, [[14, 12], [20, 20]], GOLD, 1, .9);
    S.part(g, RR(14, 23, 14, 3, 1.4), HATB, { x:21, y:24, r:7 }, { flat:true, lw:.8 }); S.part(g, SM([[16, 24], [20, 14], [27, 10], [23, 17], [26, 24]], .8), HATB, { x:21, y:19, r:6 }, { lw:.8, hx:18, hy:17 });
  },
  vampirecount(g){
    g.rotate(.15);
    const tips = [[-24, 14], [-12, 20], [2, 22], [16, 16]];
    const wing = SM([[-6, -22, 1], [8, -18], [22, -8], [28, 6], [16, 16, 1], [12, 11], [2, 22, 1], [-3, 16], [-12, 20, 1], [-15, 12], [-24, 14, 1], [-21, 2], [-12, -10]], .7);
    S.part(g, wing, WING, { x:4, y:0, r:28 }, { mat:'leather', hx:-4, hy:-10, lw:1.2 });
    g.save(); wing(g); g.clip(); for (const t of tips){ g.strokeStyle = rgba(WING.deep, .45); g.lineWidth = 3; g.beginPath(); g.moveTo(-6, -22); g.quadraticCurveTo((t[0] - 6) / 2 + 4, (t[1] - 22) / 2 + 2, t[0], t[1]); g.stroke(); } g.restore();
    // arm bone and finger spars
    S.tube(g, SO([[-6, -22], [8, -18], [22, -8]]), WINGB, 3);
    for (const t of tips) S.tube(g, SO([[-6, -22], [(t[0] - 6) / 2 + 3, (t[1] - 22) / 2 + 1], t]), WINGB, 1.8);
    S.part(g, E(-6, -22, 3.4, 3.4), WINGB, { x:-6, y:-22, r:3.4 }, { flat:true, mat:'bone', lw:.9 });
    S.claw(g, -7, -25, -2.2, 6, '#f4ead8');
    S.dot(g, E(-10, 4, 2.4, 1.6), '#1a0a14', .5); S.dot(g, E(6, 8, 1.6, 1.2), '#1a0a14', .5);
    g.fillStyle = 'rgba(255,200,220,.35)'; ell(g, -2, -8, 8, 2.4, -.4); g.fill();
  },
  twintides(g){
    g.save(); g.globalAlpha = .5; glow(g, 0, 2, 28, '#9ae8ff', .5); g.restore();
    // scalloped half shell, the fan opening upward
    const n = 7, sh = g2 => { g2.beginPath(); g2.moveTo(-6, 20); for (let i = 0; i <= n; i++){ const a = Math.PI + .15 + i * (Math.PI - .3) / n, x = Math.cos(a) * 26, y = 10 + Math.sin(a) * 22; if (i === 0) g2.lineTo(x, y); else { const pa = Math.PI + .15 + (i - .5) * (Math.PI - .3) / n; g2.quadraticCurveTo(Math.cos(pa) * 31, 10 + Math.sin(pa) * 27, x, y); } } g2.lineTo(6, 20); g2.closePath(); };
    S.part(g, sh, SHELL, { x:0, y:0, r:26 }, { mat:'bone', hx:-10, hy:-4, lw:1.2 });
    g.save(); sh(g); g.clip(); for (let i = 0; i <= n; i++){ const a = Math.PI + .15 + i * (Math.PI - .3) / n; g.strokeStyle = rgba(SHELL.deep, .45); g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 20); g.lineTo(Math.cos(a) * 30, 10 + Math.sin(a) * 26); g.stroke(); g.strokeStyle = rgba(SHELL.light, .6); g.lineWidth = .7; g.beginPath(); g.moveTo(0, 20); g.lineTo(Math.cos(a) * 30 + 1.4, 10 + Math.sin(a) * 26 + .4); g.stroke(); } g.restore();
    S.part(g, SM([[-8, 18], [8, 18], [6, 25], [-6, 25]], .6), SHELL, { x:0, y:21, r:8 }, { flat:true, mat:'bone', lw:1 });
    // the pearl
    S.contact(g, sh, 0, 8, 14, 6, .45);
    S.part(g, E(0, 2, 9.5, 9.5), PEARL, { x:0, y:2, r:9.5 }, { hx:-3.5, hy:-2, lw:1 });
    const gr = g.createRadialGradient(2, 5, 1, 0, 2, 10); gr.addColorStop(0, 'rgba(255,190,230,.0)'); gr.addColorStop(.7, 'rgba(190,210,255,.25)'); gr.addColorStop(1, 'rgba(255,200,240,.35)'); g.fillStyle = gr; ell(g, 0, 2, 9.5, 9.5); g.fill();
    sparkle(g, -4, -2, 4, 1); sparkle(g, 14, -14, 2.8, .8, '#e8fbff', '#9ae8ff'); sparkle(g, -17, -8, 2, .6, '#e8fbff', '#9ae8ff');
  },
};
/** The collectible item a boss drops (30 buy that boss's costume). */
export function bossItemIcon(boss, px = 48){
  const key = `item:${boss}:${px}`; if (cache.has(key)) return cache.get(key);
  const [c, g] = mkCanvas(px, 64); (ITEMS[boss] || ITEMS.gravekeeper)(g); cache.set(key, c); return c;
}

// ---------- seed ----------
/** A single pumpkin seed, the premium currency. */
export function seedIcon(px = 32){
  const key = `seed:${px}`; if (cache.has(key)) return cache.get(key);
  const [c, g] = mkCanvas(px, 40); g.rotate(.35);
  const outer = SM([[0, -17, 1], [9.5, -4], [9, 8], [0, 14], [-9, 8], [-9.5, -4]], .85), inner = SM([[0, -13, 1], [7, -3], [6.6, 6.6], [0, 11], [-6.6, 6.6], [-7, -3]], .85);
  S.part(g, outer, SEED, { x:0, y:0, r:14 }, { mat:'bone', hx:-3, hy:-4, lw:1.1 });
  S.part(g, inner, pal('#f8ecc8'), { x:-1, y:1, r:11 }, { hx:-3, hy:-5, lw:.8 });
  g.fillStyle = 'rgba(255,255,255,.75)'; ell(g, -3.2, -2, 1.6, 5, .15); g.fill();
  cache.set(key, c); return c;
}
