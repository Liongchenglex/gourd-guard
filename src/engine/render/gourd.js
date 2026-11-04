// ---------- The Grave Gourd on the patch (Release 4) ----------
// The Calabash from the gourd archive (docs/archive/gourds/entry.js, SHAPES[0] / gourdSprite(0)): amber #e3a43c, a tall bottle gourd with a
// pinched waist and a curly stem, with the pumpkins' toy face kept on in the patch. Painted once per canvas scale with the Toy Plastic painter
// and blitted (perf rule: never paint or shadowBlur per frame); its 3×3 square is one baked glow tile blitted with a pulsing alpha.
// Placement as the archive's look rules: as wide as a pumpkin, standing on the same soil line, taller than its cell (it is drawn after the
// patch's clip, so in the top row it reaches up over the fence's foot).
// Only called from code gated on `__RELEASE__ >= 4`.

import { E, S, SM, SO, mix, pal, rgba } from './paint.js';
import { K } from './canvas.js';
import { COLS, CS, GX, GY, LANE, ROWS, grid } from '../state.js';

export const GOURD_HUE = '#e3a43c';
const GLOW = mix(GOURD_HUE, '#fff6d0', .35);
const STEM = pal('#6e4c2a'), LEAF = pal('#4c7a34');
const R = 0.58 * CS;                                // drawing units: about as wide as a pumpkin (1.4 R), and with its stem about 1.3 cells tall
const BOX = { w:3.2 * R, h:3.1 * R, ox:1.6 * R, oy:1.72 * R };   // sprite box and the gourd's origin inside it
const FOOT = 0.86 * R, LIFT = FOOT - 0.365 * CS;    // its foot (shadow line) is .86 R below its origin and stands on the pumpkins' soil line, .365 CS below the cell centre
const P = pts => pts.map(([x, y]) => [x * R, y * R]);
const BODY = SM(P([[0,.86],[.5,.74],[.7,.36],[.6,-.04],[.3,-.3],[.2,-.42],[.32,-.58],[.4,-.82],[.28,-1.04],[0,-1.12],[-.28,-1.04],[-.4,-.82],[-.32,-.58],[-.2,-.42],[-.3,-.3],[-.6,-.04],[-.7,.36],[-.5,.74]]));

/** The Calabash at the origin: shadow, body, the small top bulb with its waist crease, a curly stem and the face. */
function paintGourd(g){
  const c = pal(GOURD_HUE);
  S.shadow(g, 0, R * .86, R * .86, R * .2);
  S.part(g, BODY, c, { x:0, y:R * .26, r:R * .8 }, { mat:'pumpkin', hx:-.3 * R, hy:.02 * R });
  S.part(g, E(0, -R * .74, R * .38, R * .34), c, { x:0, y:-R * .74, r:R * .4 }, { mat:'pumpkin' });
  S.contact(g, E(0, -R * .74, R * .38, R * .34), 0, -R * .42, R * .3, R * .08, .35);
  S.crease(g, SO([[-R * .22, -R * .4], [0, -R * .36], [R * .22, -R * .4]]), c, R * .04, .5);
  g.save(); g.translate(0, -R * 1.1);   // the stem, curling over
  S.part(g, SM([[-R * .07, R * .06], [-R * .09, -R * .12], [-R * .02, -R * .26], [R * .1, -R * .3], [R * .12, -R * .2], [R * .06, -R * .12], [R * .07, R * .06]], .8), STEM, { x:0, y:-R * .12, r:R * .2 }, { flat:true, mat:'wood' });
  S.stroke(g, SO([[R * .1, -R * .26], [R * .26, -R * .34], [R * .32, -R * .2], [R * .22, -R * .14], [R * .2, -R * .22]]), LEAF, 1.4, .85);
  g.restore();
  const s = R / 40 * .92, ey = R * .3 - R * .1 * .92, ex = R * .3 * .92, iris = mix(c.dark, '#7a5a2a', .5);   // big toy eyes, blush and a little smile (as the pumpkins')
  S.eye(g, -ex, ey, 9 * s, 9.5 * s, { lx:.2, iris }); S.eye(g, ex, ey, 9 * s, 9.5 * s, { lx:.2, iris });
  S.blush(g, 0, ey + 10 * s, s);
  S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(-R * .16 * .92, ey + R * .32 * .92); g2.quadraticCurveTo(0, ey + R * .45 * .92, R * .16 * .92, ey + R * .32 * .92); }, c, 2.4 * s);
}

const kOf = () => Math.min(2.5, Math.max(0.5, K || 1));
let body = null, glow = null;
function bodySprite(){
  const k = kOf(); if (body && body.k === k) return body;
  const c = document.createElement('canvas'); c.width = Math.ceil(BOX.w * k); c.height = Math.ceil(BOX.h * k);
  const g = c.getContext('2d'); g.scale(k, k); g.translate(BOX.ox, BOX.oy); paintGourd(g);
  return (body = { c, k });
}
/** The 3×3 square: a soft amber fill per cell and one glowing rim, baked once (the shadowBlur runs at bake time only). */
function glowSprite(){
  const k = kOf(); if (glow && glow.k === k) return glow;
  const S3 = CS * 3, c = document.createElement('canvas'); c.width = c.height = Math.ceil(S3 * k);
  const g = c.getContext('2d'); g.scale(k, k);
  for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++){ g.beginPath(); g.roundRect(q * CS + 6, r * CS + 6, CS - 12, CS - 12, 12); g.fillStyle = rgba(GLOW, r === 1 && q === 1 ? .1 : .2); g.fill(); }
  g.save(); g.shadowColor = GLOW; g.shadowBlur = 10; g.strokeStyle = rgba(GLOW, .75); g.lineWidth = 2.5; g.beginPath(); g.roundRect(3, 3, S3 - 6, S3 - 6, 16); g.stroke(); g.restore();
  return (glow = { c, k });
}
/** Bake both now (night start), not on first sight. */
export function prebakeGourd(){ bodySprite(); glowSprite(); }

/** The gourd in its cell: (x, y) is the cell centre with the slide offsets already in; s the pop/grow scale; ph its own idle phase. */
export function drawGourdCell(ctx, x, y, s, t, ph){
  const sp = bodySprite(), br = Math.sin(t * 2.1 + ph), rot = Math.sin(t * 1.3 + ph * 1.7) * .035;
  ctx.save(); ctx.translate(x, y - LIFT + FOOT * s); ctx.rotate(rot); ctx.scale(s * (1 + br * .02), s * (1 - br * .025));   // breathes and sways on its foot, as a pumpkin does
  ctx.drawImage(sp.c, -BOX.ox, -BOX.oy - FOOT, BOX.w, BOX.h);
  ctx.restore();
}

/** The glow of its 3×3 under the graves and pumpkins, cut to the patch (5 cells on an edge, 3 in a corner): one drawImage a frame. */
export function drawGourdGlow(ctx, t){
  let cell = null, r0 = 0, c0 = 0;
  for (let r = 0; r < ROWS && !cell; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && grid[r][c].gourd && !(grid[r][c].fly > 0)){ cell = grid[r][c]; r0 = r; c0 = c; break; }
  if (!cell) return;
  const sp = glowSprite(), k = sp.k;
  const x0 = LANE(c0) - CS * 1.5 + cell.ox, y0 = GY + (r0 - 1) * CS + cell.oy;
  const ax = Math.max(x0, GX), ay = Math.max(y0, GY), bx = Math.min(x0 + CS * 3, GX + COLS * CS), by = Math.min(y0 + CS * 3, GY + ROWS * CS);
  if (bx <= ax || by <= ay) return;
  ctx.globalAlpha = (0.55 + 0.35 * Math.sin(t * 2)) * Math.min(1, cell.grow * 1.5);
  ctx.drawImage(sp.c, (ax - x0) * k, (ay - y0) * k, (bx - ax) * k, (by - ay) * k, ax, ay, bx - ax, by - ay);
  ctx.globalAlpha = 1;
}

/** A picker tile icon: the baked gourd fitted into a px square canvas. */
export function gourdIcon(px = 96){
  const sp = bodySprite(), c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d'), span = 2.5 * R, f = px / span;   // the gourd spans about 1.45 R above its origin to its .9 R foot, 2 R wide
  g.scale(f, f); g.translate(span / 2, 1.5 * R);
  g.drawImage(sp.c, -BOX.ox, -BOX.oy, BOX.w, BOX.h);
  return c;
}
