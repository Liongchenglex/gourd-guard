// ---------- Trophies (the level-20 perks) drawn in Toy Plastic ----------
// One cup per world, each topped with that world's emblem (owner, 2026-09-27). trophyIcon(world, px, lit).

import { E, PL, RR, S, SM, SO, ell, pal, rgba } from './paint.js';
import { TAU } from '../util.js';

const GOLD = pal('#e6b23a'), GOLDD = pal('#b8801a'), STONE = pal('#7d7a8a'), WOOD = pal('#6b4526'), GREY = pal('#8c8c96'), GREYD = pal('#5c5c66');
const PUMP = pal('#e8873a'), LEAF = pal('#4f9a3a'), TEAL = pal('#3fb0a8'), HAT = pal('#3a2a4a'), CRIM = pal('#b0182c'), SEA = pal('#3a8ab0'), FOAM = pal('#dff4ff');

function cup(g, c, cd){
  S.part(g, RR(-18, 20, 36, 6, 2), cd, { x:0, y:23, r:18 }, { flat:true, mat:'metal' });
  S.part(g, RR(-12, 14, 24, 7, 2), c, { x:0, y:17, r:12 }, { flat:true, mat:'metal' });
  S.part(g, SM([[-6, 14], [6, 14], [8, 6], [-8, 6]], .5), cd, { x:0, y:10, r:8 }, { flat:true, mat:'metal' });
  for (const s of [-1, 1]) S.stroke(g, SO([[s * 18, -14], [s * 30, -12], [s * 30, 0], [s * 18, 4]]), cd, 4.5, .95);
  S.part(g, SM([[-20, -18], [20, -18], [16, 0], [8, 8], [-8, 8], [-16, 0]], .7), c, { x:0, y:-6, r:20 }, { mat:'metal', hx:-9, hy:-12 });
  S.part(g, RR(-21, -22, 42, 6, 3), cd, { x:0, y:-19, r:21 }, { flat:true, mat:'metal' });
}
const EMBLEM = [
  g => { S.part(g, E(0, -30, 11, 9), PUMP, { x:0, y:-30, r:11 }, { mat:'pumpkin' }); S.part(g, RR(-2, -42, 4, 6, 1.5), WOOD, { x:0, y:-39, r:3 }, { flat:true, mat:'wood' }); S.part(g, E(-5, -38, 4, 2, -.5), LEAF, { x:-5, y:-38, r:4 }, { flat:true }); },
  g => { S.part(g, RR(-7, -42, 14, 18, 3), pal('#ffe3a0'), { x:0, y:-33, r:9 }, { flat:true }); S.dot(g, E(0, -33, 3.5, 5), '#ffb640'); S.part(g, RR(-8, -44, 16, 4, 1.5), TEAL, { x:0, y:-42, r:8 }, { flat:true, mat:'metal' }); S.part(g, RR(-8, -25, 16, 4, 1.5), TEAL, { x:0, y:-23, r:8 }, { flat:true, mat:'metal' }); S.stroke(g, g2 => { g2.beginPath(); g2.arc(0, -46, 4, Math.PI, TAU); }, TEAL, 2, .9); },
  g => { S.part(g, RR(-15, -25, 30, 4, 2), HAT, { x:0, y:-23, r:15 }, { flat:true, mat:'cloth' }); S.part(g, SM([[-9, -25], [-5, -44], [6, -54], [3, -38], [9, -25]], .8), HAT, { x:0, y:-36, r:10 }, { mat:'cloth' }); S.ln(g, [[-9, -28], [9, -28]], pal('#c09a3a'), 2, .9); },
  g => { S.part(g, RR(-12, -42, 24, 20, 2), STONE, { x:0, y:-32, r:12 }, { mat:'stone' }); for (let i = -1; i <= 1; i++) S.part(g, RR(i * 8 - 3, -46, 6, 5, 1), STONE, { x:i * 8, y:-44, r:3 }, { flat:true, mat:'stone' }); S.dot(g, RR(-3, -34, 6, 9, 3), '#1a1020'); S.part(g, PL([[0, -46], [0, -56], [9, -52]]), CRIM, { x:4, y:-52, r:5 }, { flat:true }); },
  g => { S.part(g, SM([[-14, -24], [-10, -38], [-2, -30], [4, -42], [10, -32], [15, -24]], .8), SEA, { x:0, y:-32, r:14 }, { mat:'gel', hx:-6, hy:-36 }); S.dot(g, E(-9, -38, 3, 2), FOAM.base); S.dot(g, E(4, -42, 3, 2), FOAM.base); S.stroke(g, SO([[-6, -30], [0, -34], [6, -30]]), FOAM, 1.4, .8); },
];
const iconCache = new Map();
/** A trophy cup for world w (0-based), lit gold or dull grey when not earned. */
export function trophyIcon(w, px = 56, lit = true){
  const key = `${w}:${px}:${lit ? 1 : 0}`; if (iconCache.has(key)) return iconCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = px * 2; const g = c.getContext('2d'); g.scale(px * 2 / 72, px * 2 / 72); g.translate(36, 44);
  if (lit){ const gl = g.createRadialGradient(0, -10, 4, 0, -10, 34); gl.addColorStop(0, 'rgba(255,220,120,.55)'); gl.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = gl; g.fillRect(-36, -50, 72, 80); }
  cup(g, lit ? GOLD : GREY, lit ? GOLDD : GREYD);
  g.save(); if (!lit) g.filter = 'grayscale(1) brightness(.7)'; (EMBLEM[w] || EMBLEM[0])(g); g.restore();
  if (lit){ g.fillStyle = 'rgba(255,255,255,.85)'; ell(g, -9, -12, 2.5, 5, -.4); g.fill(); }
  iconCache.set(key, c); return c;
}
