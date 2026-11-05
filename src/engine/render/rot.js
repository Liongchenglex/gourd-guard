// ---------- The rotten pumpkin (Release 5, Nightmare Foggy Hollow; spec Part 2) ----------
// Ported from the design archive (docs/archive/nightmare-monsters/riders/riders.js, rotten(): lopsided ribs, brown rot, a green rot patch,
// white mould, a split, a wilted stem flopped over and X eyes), plus a little worm poking out of a hole in its side (owner). Drawn into the
// same box as a pumpkin sprite (render/sprites.js: CS square, centre (CS/2, CS/2 + 3), radius 0.4 CS), so the patch, the flight and the
// lit bunch blit it exactly where a pumpkin goes. Two sprites per canvas scale, painted once with the Toy Plastic painter and blitted (perf
// rule: no painting or shadowBlur per frame): plain, and lit (a sickly green glow and stink curls, for a rotten bunch and a rotten flight).
// Only called from code gated on `__RELEASE__ >= 5`, so lower builds drop it.

import { E, S, SM, SO, pal, rgba } from './paint.js';
import { K } from './canvas.js';
import { CS } from '../state.js';
import { TAU } from '../util.js';

// The archive's palette, kept inside functions so a lower build (which never calls them) drops every call to pal.
const cols = () => ({ ROT:pal('#cf7a2c'), ROTG:pal('#7d8a34'), ROTD:pal('#5e4222'), DSTEM:pal('#3a3424'), WORM:pal('#e3928c'), MOULD:'#d6e6b8', STINK:'#9ac25a', HOLE:'#24160a' });

/** The archive's rotten(): a slumped, bruised pumpkin gone bad, centre (0, 0), radius R; then the worm out of a hole in its left side. */
function paintRotten(g, R, lit){
  const { ROT, ROTG, ROTD, DSTEM, WORM, MOULD, HOLE } = cols();
  const ribs = [[-.6, .42, .64], [.58, .44, .7], [-.22, .5, .74], [.2, .5, .78]];
  const union = g2 => { g2.beginPath(); for (const [ox, rw, rh] of ribs) g2.ellipse(ox * R * .9, R * .06, rw * R * 1.1, R * rh, 0, 0, TAU); };
  const lift = c => lit ? { ...c, base:c.light } : c;   // a lit rotten one is a touch brighter, as lit pumpkins are
  for (const [ox, rw, rh] of ribs){ const cx = ox * R * .9; S.part(g, E(cx, R * .06, rw * R * 1.1, R * rh), lit ? { ...ROT, base:'#d98a3c' } : ROT, { x:cx, y:0, r:R * .8 }, { flat:Math.abs(ox) > .4, mat:'pumpkin', hx:cx - R * .12, hy:-R * .5 }); }
  g.save(); union(g); g.clip();
  for (const xx of [-.42, 0, .4]){ g.beginPath(); g.moveTo(xx * R, -R * .55); g.quadraticCurveTo(xx * R * 1.35, 0, xx * R, R * .6); g.strokeStyle = rgba(ROTD.deep, .4); g.lineWidth = R * .07; g.lineCap = 'round'; g.stroke(); }
  S.dot(g, SM([[R * .12, -R * .12], [R * .5, -R * .32], [R * .74, R * .1], [R * .44, R * .44], [R * .08, R * .26]], .8), lift(ROTG).base, .9);   // green rot patch
  S.dot(g, E(R * .4, R * .08, R * .17, R * .12), ROTD.deep, .75);                                                                              // caved-in bruise
  S.dot(g, E(-R * .48, R * .4, R * .24, R * .14), ROTG.dark, .7);
  for (const [mx, my, mr] of [[-.42, -.36, .1], [-.3, -.26, .07], [.58, .34, .08], [-.08, .5, .06], [.64, -.08, .06], [.5, .2, .045]]) S.dot(g, E(mx * R, my * R, mr * R, mr * R), MOULD, .9);   // mould fuzz
  // the worm's hole, low on the left flank: a dark pit with a bruised rim
  const hx = -R * .7, hy = R * .26;
  S.dot(g, E(hx, hy, R * .17, R * .14), ROTD.deep, .8);
  S.dot(g, E(hx + R * .02, hy, R * .115, R * .095), HOLE, .95);
  g.restore();
  S.ln(g, [[R * .18, -R * .46], [R * .3, -R * .24], [R * .2, -R * .04], [R * .34, R * .16]], ROTD, R * .06, .9);                               // a split oozing
  S.tube(g, SO([[R * .02, -R * .6], [-R * .04, -R * .88], [-R * .28, -R * 1.0], [-R * .46, -R * .86]]), DSTEM, R * .14);                       // wilted stem, flopped over
  // X eyes and a wobbly frown: a pumpkin that has gone over to the other side
  const ey = -R * .12, ex = R * .32, e = R * .11;
  for (const sx of [-ex, ex]){ S.ln(g, [[sx - e, ey - e], [sx + e, ey + e]], ROTD, R * .07, .95); S.ln(g, [[sx + e, ey - e], [sx - e, ey + e]], ROTD, R * .07, .95); }
  S.ln(g, [[-R * .26, R * .3], [-R * .12, R * .24], [0, R * .3], [R * .12, R * .24], [R * .26, R * .3]], ROTD, R * .06, .9);
  // the worm: out of the hole, curling up and outward, ringed, a little round head with a bead eye looking about
  const body = [[hx - R * .01, hy + R * .02], [hx - R * .15, hy], [hx - R * .3, hy - R * .08], [hx - R * .4, hy - R * .22], [hx - R * .36, hy - R * .36]];
  S.tube(g, SO(body), WORM, R * .11);
  g.save(); g.lineCap = 'round'; g.strokeStyle = rgba(WORM.deep, .45); g.lineWidth = R * .02;
  for (const [x, y, a] of [[hx - R * .14, hy, 1.5], [hx - R * .27, hy - R * .06, 1.1], [hx - R * .37, hy - R * .17, .55], [hx - R * .39, hy - R * .29, .05]]){ const dx = Math.cos(a) * R * .055, dy = Math.sin(a) * R * .055; g.beginPath(); g.moveTo(x - dx, y - dy); g.lineTo(x + dx, y + dy); g.stroke(); }
  g.restore();
  const wx = hx - R * .29, wy = hy - R * .44;
  S.part(g, E(wx, wy, R * .085, R * .08), WORM, { x:wx, y:wy, r:R * .085 }, { flat:true });
  S.dot(g, E(wx - R * .03, wy - R * .01, R * .024, R * .028), '#1c1012', 1);
  S.dot(g, E(wx - R * .036, wy - R * .02, R * .009, R * .009), '#ffffff', .9);
  S.dot(g, E(wx + R * .035, wy + R * .03, R * .022, R * .014), '#ff8a9a', .6);   // a blush
}
/** The archive's stink: three green curls rising over it (baked at a fixed phase), for the lit sprite. */
function paintStink(g, R){
  const { STINK } = cols();
  g.save(); g.lineCap = 'round';
  for (const [dx, u] of [[-.45, .2], [0, .55], [.45, .85]]){ const yy = -R * (.86 + u * .3), xx = dx * R, w = R * .18;
    g.strokeStyle = rgba(STINK, .7 * (1 - u * .5)); g.lineWidth = R * .1; g.beginPath(); g.moveTo(xx, yy + R * .4);
    g.bezierCurveTo(xx + w * 2, yy + R * .3, xx - w * 2, yy + R * .15, xx + w * .5, yy - R * .1); g.stroke(); }
  g.restore();
}

function bakeOne(px, lit){
  const c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d'), R = CS * 0.4; g.scale(px / CS, px / CS); g.translate(CS / 2, CS / 2 + 3);
  if (lit){ const gl = g.createRadialGradient(0, 0, R * .4, 0, 0, R * 1.25); gl.addColorStop(0, 'rgba(150,205,70,.5)'); gl.addColorStop(1, 'rgba(150,205,70,0)'); g.fillStyle = gl; g.fillRect(-CS / 2, -CS / 2 - 3, CS, CS); }   // the sickly green glow
  S.shadow(g, 0, R * .82, R * 1.05, R * .22);
  paintRotten(g, R, lit);
  if (lit) paintStink(g, R);
  return c;
}
let cache = null;
/** The rotten pumpkin's sprite at the current canvas scale, in a pumpkin sprite's box: plain, or lit (bunch and flight). */
export function rotSprite(lit){
  const px = Math.max(24, Math.round(CS * K));
  if (!cache || cache.px !== px) cache = { px, c:[bakeOne(px, false), bakeOne(px, true)] };
  return cache.c[lit ? 1 : 0];
}
/** Bake both now (night start), not on first sight. */
export function prebakeRot(){ rotSprite(false); }
/** An icon for cards and the bestiary: a px square canvas with the rotten pumpkin (plain or lit) fitted in. */
export function rotIcon(px = 96, lit = false){
  const c = document.createElement('canvas'); c.width = c.height = px;
  c.getContext('2d').drawImage(rotSprite(lit), 0, 0, px, px);
  return c;
}
