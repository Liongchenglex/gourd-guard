// ---------- Potions (Release 7, Nightmare Witchwood; spec Part 2): three bottles, their small icons and the drink puff ----------
// Each kind has its own shape and glow so it reads on the grey Witchwood field (our call, shown to the owner): bulky a round red flask,
// speed a thin green vial with a lightning bolt, colour a violet bottle with a swirl. Everything is painted once per canvas scale with the
// Toy Plastic painter into offscreen canvases (perf rule: no painting or shadowBlur per frame); per frame a potion on the field costs one
// drawImage, a drinker one per potion it drank (the icons beside its health pips), a drink one per puff.
// Only called from code gated on `__RELEASE__ >= 7`, so lower builds drop it.

import { E, RR, S, pal, rgba } from './paint.js';
import { K, ctx } from './canvas.js';
import { FIELD_BOT, FIELD_TOP, LANE } from '../state.js';
import { TAU } from '../util.js';

const BW = 46, BH = 64, OX = 23, OY = 56;   // a bottle in world units; (OX, OY) is where it stands (its foot)
const IW = 15, IH = 18;                     // an icon beside the health pips, world units
const PW = 60;                              // a drink puff, world units across
const bk = k => Math.min(3, Math.max(0.5, k || 1));
const cache = new Map();
const KINDS = ['bulky', 'speed', 'colour'];

// The palette, kept inside a function so a lower build (which never calls it) drops every call to pal.
const cols = () => ({
  bulky:{ liq:pal('#d8262e'), glow:'255,70,60', swirl:'#ffb0a0' },
  speed:{ liq:pal('#3fc23a'), glow:'110,240,90', swirl:'#e8ff7a' },
  colour:{ liq:pal('#8a3ce0'), glow:'180,110,255', swirl:'#f0c8ff' },
  cork:pal('#b07a40'), gem:pal('#d6a0ff'), bolt:pal('#ffd92e'), label:pal('#efe2c2'),
});

/** The glass outline of each bottle, its foot at (0, 0). */
const GLASS = {
  bulky: g => { g.beginPath(); g.moveTo(-4.5, -40); g.lineTo(-4.5, -31); g.arc(0, -17, 15, -Math.PI / 2 - 0.3, -Math.PI / 2 + 0.3, true); g.lineTo(4.5, -40); g.closePath(); },
  speed: g => { g.beginPath(); g.roundRect(-6.5, -46, 13, 45, [3, 3, 6.5, 6.5]); },
  colour: g => { g.beginPath(); g.moveTo(-4.5, -40); g.lineTo(-4.5, -31); g.bezierCurveTo(-6, -27, -16, -26, -16, -13.5); g.bezierCurveTo(-16, -3.5, -8.5, 0, 0, 0);
    g.bezierCurveTo(8.5, 0, 16, -3.5, 16, -13.5); g.bezierCurveTo(16, -26, 6, -27, 4.5, -31); g.lineTo(4.5, -40); g.closePath(); },
};
const LIQ_TOP = { bulky:-24, speed:-34, colour:-21 };
const NECK = { bulky:-40, speed:-46, colour:-40 };

/** One bottle of `kind`, its foot at (0, 0); `glow` adds the coloured halo behind it (the field sprite; icons go without). */
function paintBottle(g, kind, glow){
  const C = cols(), c = C[kind], top = NECK[kind], path = GLASS[kind];
  if (glow){
    const gr = g.createRadialGradient(0, -20, 4, 0, -20, 30); gr.addColorStop(0, `rgba(${c.glow},.55)`); gr.addColorStop(0.55, `rgba(${c.glow},.2)`); gr.addColorStop(1, `rgba(${c.glow},0)`);
    g.fillStyle = gr; g.fillRect(-OX, -OY, BW, BH);
    S.shadow(g, 0, 1, 15, 4);
  }
  // the glass behind the liquid: a faint tint so the empty top reads as glass
  path(g); g.fillStyle = 'rgba(225,235,255,.22)'; g.fill();
  // the liquid, with Toy Plastic volume, clipped to the glass; a lighter meniscus on top and a few bubbles
  g.save(); path(g); g.clip();
  const lt = LIQ_TOP[kind];
  S.part(g, RR(-18, lt, 36, -lt + 2, 0), c.liq, { x:0, y:(lt) / 2, r:Math.max(12, -lt / 2 + 4) }, { flat:true });
  S.dot(g, E(0, lt, 17, 2.4), c.liq.light, 0.8);
  if (kind === 'colour'){   // the swirl: a pale spiral through the violet
    g.strokeStyle = rgba(c.swirl, 0.85); g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i <= 40; i++){ const a = i / 40 * TAU * 1.75, r = 1.2 + i * 0.26, x = Math.cos(a) * r, y = -11 + Math.sin(a) * r * 0.8; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
  for (const [bx, by, br] of kind === 'speed' ? [[-2, -10, 1.6], [2, -20, 1.1], [-1.5, -28, 0.9]] : [[-6, -8, 1.8], [5, -12, 1.3], [-2, -18, 1.0], [8, -6, 0.9]]){
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(bx, by, br, br, 0, 0, TAU); g.stroke();
  }
  g.restore();
  if (kind === 'speed'){   // the bolt on the vial
    const bolt = g2 => { g2.beginPath(); g2.moveTo(2.6, -31); g2.lineTo(-3.6, -18); g2.lineTo(0.2, -18.5); g2.lineTo(-2.6, -7); g2.lineTo(4, -21.5); g2.lineTo(0.2, -21); g2.lineTo(3.4, -31); g2.closePath(); };
    S.part(g, bolt, C.bolt, { x:0, y:-19, r:9 }, { flat:true });
    S.stroke(g, bolt, C.bolt, 1, 0.9);
  }
  if (kind === 'bulky'){   // a little cream label with a red heart: health
    S.part(g, RR(-7, -21, 14, 9, 2), C.label, { x:0, y:-17, r:8 }, { flat:true, mat:'cloth' });
    g.fillStyle = '#c21e28'; g.beginPath(); g.moveTo(0, -13.6); g.bezierCurveTo(-4.6, -16.4, -3.6, -20.4, 0, -18.6); g.bezierCurveTo(3.6, -20.4, 4.6, -16.4, 0, -13.6); g.fill();
  }
  // the glass: a dark rim, a pale inner line and the plastic gloss
  path(g); g.lineJoin = 'round'; g.strokeStyle = 'rgba(40,14,40,.75)'; g.lineWidth = 2.4; g.stroke();
  path(g); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)';
  if (kind === 'speed'){ g.beginPath(); g.roundRect(-4.6, -42, 2.2, 30, 1.1); g.fill(); }
  else { g.beginPath(); g.ellipse(-8.5, -18, 2.2, 6.5, 0.45, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-5, -27.5, 1.1, 1.6, 0.4, 0, TAU); g.fill(); }
  // the lip and the stopper: a cork for the flask and the vial, a violet gem for the swirl bottle
  S.part(g, RR(-6.5, top - 2.5, 13, 4, 2), pal('#cfd8e6'), { x:0, y:top, r:6 }, { flat:true });
  if (kind === 'colour') S.part(g, E(0, top - 6.5, 5, 5), C.gem, { x:0, y:top - 6.5, r:5 });
  else S.part(g, RR(-4.5, top - 10, 9, 8.5, 2.5), C.cork, { x:0, y:top - 6, r:6 }, { flat:true, mat:'wood' });
}

/** The bottle sprite for the field at scale k: { c, ... } with the glow; per frame one drawImage. */
export function potionSprite(kind, k){
  k = bk(k); const key = 'b:' + kind + ':' + k; let c = cache.get(key); if (c) return c;
  c = document.createElement('canvas'); c.width = Math.ceil(BW * k); c.height = Math.ceil(BH * k);
  const g = c.getContext('2d'); g.scale(k, k); g.translate(OX, OY); paintBottle(g, kind, true);
  cache.set(key, c); return c;
}
/** The small icon a drinker carries beside its health pips: the bottle on a dark disc, IW × IH world units. */
export function potionIcon(kind, k){
  k = bk(k); const key = 'i:' + kind + ':' + k; let c = cache.get(key); if (c) return c;
  c = document.createElement('canvas'); c.width = Math.ceil(IW * k); c.height = Math.ceil(IH * k);
  const g = c.getContext('2d'); g.scale(k, k);
  g.fillStyle = 'rgba(20,10,30,.62)'; g.beginPath(); g.ellipse(IW / 2, IH / 2, IW / 2, IH / 2, 0, 0, TAU); g.fill();
  const s = (IH - 2) / 52; g.translate(IW / 2, IH - 1.5); g.scale(s, s); paintBottle(g, kind, false);
  cache.set(key, c); return c;
}
/** A drink: a soft puff in the potion's colour with a few motes, PW world units across. */
function puffSprite(kind, k){
  k = bk(k); const key = 'p:' + kind + ':' + k; let c = cache.get(key); if (c) return c;
  const C = cols()[kind];
  c = document.createElement('canvas'); c.width = c.height = Math.ceil(PW * k); const g = c.getContext('2d'); g.scale(k, k);
  const gr = g.createRadialGradient(PW / 2, PW / 2, 2, PW / 2, PW / 2, PW / 2); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(0.35, `rgba(${C.glow},.6)`); gr.addColorStop(1, `rgba(${C.glow},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, PW, PW);
  for (let i = 0; i < 7; i++){ const a = i / 7 * TAU + 0.4, d = 14 + (i % 3) * 5; g.fillStyle = i % 2 ? C.swirl : '#ffffff'; g.beginPath(); g.ellipse(PW / 2 + Math.cos(a) * d, PW / 2 + Math.sin(a) * d, 2.2, 2.2, 0, 0, TAU); g.fill(); }
  cache.set(key, c); return c;
}
/** The three bottles side by side on a px-square canvas: the Potions intro card's icon (Release 7). Painted once per call, never per frame. */
export function potionsCard(px = 160){
  const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d');
  const k = px / 150; g.scale(k, k);
  for (const [kd, x, y] of [['bulky', 30, 112], ['colour', 120, 112], ['speed', 75, 100]]){ g.save(); g.translate(x, y); g.scale(1.25, 1.25); paintBottle(g, kd, true); g.restore(); }
  return c;
}
/** Bake everything now (night start), not on first sight. */
export function prebakePotions(){ for (const kd of KINDS){ potionSprite(kd, K); potionIcon(kd, K); puffSprite(kd, K); } }

/** Every potion on the field: one blit each, bobbing a little; a new one grows in over a third of a second. Drawn above the fog (readability). */
export function drawPotions(potions, t){
  for (const o of potions){
    const c = potionSprite(o.kind, K), s = Math.min(1, 0.3 + o.t * 2.2), bob = Math.sin(t * 2.6 + o.lane * 1.7 + o.p * 9) * 1.5;
    const x = LANE(o.lane), y = FIELD_TOP + o.p * (FIELD_BOT - FIELD_TOP) + 12;
    ctx.drawImage(c, x - OX * s, y - OY * s + bob, BW * s, BH * s);
  }
}
/** A drinker's icons, one per potion it drank (stacked ones repeat), in kind order, leftward from x (the left end of its health pips), centred on y. */
export function drawPotionIcons(cx, drank, x, y){
  let n = 0;
  for (const kd of KINDS) for (let i = +drank[kd] || 0; i > 0; i--){ cx.drawImage(potionIcon(kd, K), x - (n + 1) * (IW + 1), y - IH / 2, IW, IH); n++; }
}
/** The drink puff (vfx kind 'potiondrink'): it swells and fades. */
export function drawPotionFx(v){
  const p = Math.min(1, v.t / v.dur), c = puffSprite(v.potion, K), sz = PW * (0.6 + p * 0.8);
  ctx.globalAlpha = 1 - p; ctx.drawImage(c, v.x - sz / 2, v.y - sz / 2, sz, sz); ctx.globalAlpha = 1;
}
