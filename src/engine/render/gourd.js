// ---------- The gourds on the patch (Release 4: the Grave Gourd; Release 5: the Protector Gourd) ----------
// The Calabash from the gourd archive (docs/archive/gourds/entry.js, SHAPES[0] / gourdSprite(0)): amber #e3a43c, a tall bottle gourd with a
// pinched waist and a curly stem, with the pumpkins' toy face kept on in the patch. Painted once per canvas scale with the Toy Plastic painter
// and blitted (perf rule: never paint or shadowBlur per frame); its 3×3 square is one baked glow tile blitted with a pulsing alpha.
// Placement as the archive's look rules: as wide as a pumpkin, standing on the same soil line, taller than its cell (it is drawn after the
// patch's clip, so in the top row it reaches up over the fence's foot).
// The Protector Gourd (Release 5, spec Part 6): the Swan from the same archive (cream with green stripes, a long neck arcing into a little
// head; owner 2026-11-05), with the archive's halo behind it as its ward, baked once and blitted with a pulsing alpha; its 3×3 glow is in
// its own colour with shield corners, so the two squares read apart.
// The Wartling Gourd (Release 7, spec Part 5): the archive's Wartling (violet #8a5cc6, a round pear gourd covered in little bumps, faint
// ribs and a curly stem), with the toy face; its 3×3 glow is violet with a wart at each corner.
// The Crookneck Gourd (Release 8, spec Part 5): the archive's Crookneck (lime #b9cf3c, a fat bumpy base whose neck curls over like a
// shepherd's crook, the stem hanging from the tip), with the toy face; its 3×3 glow is lime with a little crook at each corner.
// Only called from code gated on `__RELEASE__ >= 4`; every Protector branch is gated on `>= 5`, every Wartling branch on `>= 7` and every
// Crookneck branch on `>= 8`, so lower builds carry none of their art.

import { E, S, SM, SO, mix, pal, rgba, rng } from './paint.js';
import { K } from './canvas.js';
import { COLS, CS, GX, GY, LANE, ROWS, grid } from '../state.js';

export const GOURD_HUE = '#e3a43c';
const R = 0.58 * CS;                                // drawing units: about as wide as a pumpkin (1.4 R), and with its stem about 1.3 cells tall
const BOX = { w:3.2 * R, h:3.1 * R, ox:1.6 * R, oy:1.72 * R };   // sprite box and the gourd's origin inside it
const FOOT = 0.86 * R, LIFT = FOOT - 0.365 * CS;    // its foot (shadow line) is .86 R below its origin and stands on the pumpkins' soil line, .365 CS below the cell centre
const P = pts => pts.map(([x, y]) => [x * R, y * R]);
// Everything that calls the painter lives inside functions, so a build below Release 4 (which imports this module but never calls it)
// drops it all: no top-level calls to pal / mix / SM here.
const BODY = () => SM(P([[0,.86],[.5,.74],[.7,.36],[.6,-.04],[.3,-.3],[.2,-.42],[.32,-.58],[.4,-.82],[.28,-1.04],[0,-1.12],[-.28,-1.04],[-.4,-.82],[-.32,-.58],[-.2,-.42],[-.3,-.3],[-.6,-.04],[-.7,.36],[-.5,.74]]));

/** The Calabash at the origin: shadow, body, the small top bulb with its waist crease, a curly stem and the face. */
function paintGourd(g){
  const c = pal(GOURD_HUE), STEM = pal('#6e4c2a'), LEAF = pal('#4c7a34');
  S.shadow(g, 0, R * .86, R * .86, R * .2);
  S.part(g, BODY(), c, { x:0, y:R * .26, r:R * .8 }, { mat:'pumpkin', hx:-.3 * R, hy:.02 * R });
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

// The Protector Gourd (Release 5): an archived gourd (docs/archive/gourds/entry.js, SHAPES), ported with its look kept (owner 2026-11-05:
// any archived gourd; the Swan). PROTECTOR_SHAPE names the archive entry; its data lives inside a function, like the Grave's painting, so a
// lower build drops it.
const PROTECTOR_SHAPE = 'swan';
const protShape = () => ({
  swan:{ hue:'#e4d9bd', stripe:'#5c8c48', body:() => E(0, R * .38, R * .68, R * .5), neck:[[-.16,.04],[-.24,-.4],[-.2,-.84],[0,-1.16],[.3,-1.26],[.52,-1.1],[.56,-.9]],
    b:{ x:0, y:.38, r:.68 }, hl:[-.34, .1], top:[.6,-.76], stem:.9, face:{ x:0, y:.46, s:.9 } },
})[PROTECTOR_SHAPE];
const protHue = () => protShape().hue;
/** The Protector at the origin, as the archive's drawGourd paints its shape: shadow, neck and head, body, stripes, stem and the toy face. */
function paintProtector(g){
  const sh = protShape(), c = pal(sh.hue), STEM = pal('#6e4c2a'), body = sh.body(), b = { x:sh.b.x * R, y:sh.b.y * R, r:sh.b.r * R };
  S.shadow(g, 0, R * .86, R * .86, R * .2);
  if (sh.neck){ S.tube(g, SO(P(sh.neck)), c, R * .17); S.part(g, E(R * .56, -R * .86, R * .12, R * .13), c, { x:R * .56, y:-R * .86, r:R * .13 }, { flat:true }); }
  S.part(g, body, c, b, { mat:'pumpkin', hx:sh.hl[0] * R, hy:sh.hl[1] * R });
  g.save(); body(g); g.clip();
  if (sh.stripe){ g.strokeStyle = rgba(sh.stripe, .55); g.lineWidth = R * .07; g.lineCap = 'round'; for (const x of [-.42, -.2, 0, .2, .42]){ g.beginPath(); g.moveTo(x * R * .7, 0); g.quadraticCurveTo(x * R * 1.3, R * .42, x * R * .7, R * .88); g.stroke(); } }
  g.restore();
  g.save(); g.translate(sh.top[0] * R, sh.top[1] * R); g.rotate(sh.stem + Math.PI / 2);   // the stem (the archive's stem(), not curly)
  S.part(g, SM([[-R * .07, R * .06], [-R * .09, -R * .12], [-R * .02, -R * .26], [R * .1, -R * .3], [R * .12, -R * .2], [R * .06, -R * .12], [R * .07, R * .06]], .8), STEM, { x:0, y:-R * .12, r:R * .2 }, { flat:true, mat:'wood' });
  g.restore();
  const f = sh.face, s = R / 40 * f.s, x = f.x * R, ey = f.y * R - R * .1 * f.s, ex = R * .3 * f.s, iris = mix(c.dark, '#7a5a2a', .5);   // the archive's face()
  S.eye(g, x - ex, ey, 9 * s, 9.5 * s, { lx:.2, iris }); S.eye(g, x + ex, ey, 9 * s, 9.5 * s, { lx:.2, iris });
  S.blush(g, x, ey + 10 * s, s);
  S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(x - R * .16 * f.s, ey + R * .32 * f.s); g2.quadraticCurveTo(x, ey + R * .45 * f.s, x + R * .16 * f.s, ey + R * .32 * f.s); }, c, 2.4 * s);
}
/** The ward behind the Protector: the archive's halo (a soft disc in the gourd's glow colour), baked once, blitted with a pulsing alpha. */
function paintWard(g){
  const col = glowCol('protector'), cy = -R * .2, rr = R * 1.15;
  const gr = g.createRadialGradient(0, cy, 0, 0, cy, rr); gr.addColorStop(0, rgba(col, .55)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(0, cy, rr, 0, Math.PI * 2); g.fill();
}

// The Wartling Gourd (Release 7): the archive's drawGourd for its SHAPES entry `wartling`, ported as is. Its data lives inside a function.
const wartShape = () => ({ hue:'#8a5cc6', body:() => SM(P([[0,.86],[.5,.76],[.7,.4],[.66,0],[.46,-.4],[.24,-.64],[0,-.7],[-.24,-.64],[-.46,-.4],[-.66,0],[-.7,.4],[-.5,.76]])),
  b:{ x:0, y:.12, r:.8 }, hl:[-.34, -.22], top:[0, -.68], face:{ x:0, y:.22, s:.94 }, warts:16 });
/** The Wartling at the origin: shadow, body, its faint ribs, the warts, a curly stem and the face. */
function paintWartling(g){
  const sh = wartShape(), c = pal(sh.hue), STEM = pal('#6e4c2a'), LEAF = pal('#4c7a34'), body = sh.body(), b = { x:sh.b.x * R, y:sh.b.y * R, r:sh.b.r * R };
  S.shadow(g, 0, R * .86, R * .86, R * .2);
  S.part(g, body, c, b, { mat:'pumpkin', hx:sh.hl[0] * R, hy:sh.hl[1] * R });
  g.save(); body(g); g.clip();   // the ribs
  g.strokeStyle = rgba(c.deep, .35); g.lineWidth = R * .045;
  for (const x of [-.55, -.25, .25, .55]){ g.beginPath(); g.moveTo(x * R * .8, -R * .6); g.quadraticCurveTo(x * R * 1.25, R * .4, x * R * .8, R * .84); g.stroke(); }
  g.restore();
  const Rr = rng(17); let n = 0;   // the warts, the archive's seed: none over the face
  for (let i = 0; i < 60 && n < sh.warts; i++){
    const a = Rr() * Math.PI * 2, d = Math.sqrt(Rr()) * .62, x = Math.cos(a) * d * R, y = (sh.b.y + Math.sin(a) * d * 1.05) * R, r = R * (.05 + Rr() * .05);
    if (Math.hypot(x, y - R * .22) < R * .38) continue;
    n++; S.part(g, E(x, y, r, r * .9), { ...c, base:mix(c.base, c.light, .25) }, { x:x - r * .3, y:y - r * .3, r }, { flat:true, lw:1 });
  }
  g.save(); g.translate(sh.top[0] * R, sh.top[1] * R);   // the curly stem, straight up (the archive's stem() at -90°)
  S.part(g, SM([[-R * .07, R * .06], [-R * .09, -R * .12], [-R * .02, -R * .26], [R * .1, -R * .3], [R * .12, -R * .2], [R * .06, -R * .12], [R * .07, R * .06]], .8), STEM, { x:0, y:-R * .12, r:R * .2 }, { flat:true, mat:'wood' });
  S.stroke(g, SO([[R * .1, -R * .26], [R * .26, -R * .34], [R * .32, -R * .2], [R * .22, -R * .14], [R * .2, -R * .22]]), LEAF, 1.4, .85);
  g.restore();
  const f = sh.face, s = R / 40 * f.s, x = f.x * R, ey = f.y * R - R * .1 * f.s, ex = R * .3 * f.s, iris = mix(c.dark, '#7a5a2a', .5);   // the archive's face()
  S.eye(g, x - ex, ey, 9 * s, 9.5 * s, { lx:.2, iris }); S.eye(g, x + ex, ey, 9 * s, 9.5 * s, { lx:.2, iris });
  S.blush(g, x, ey + 10 * s, s);
  S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(x - R * .16 * f.s, ey + R * .32 * f.s); g2.quadraticCurveTo(x, ey + R * .45 * f.s, x + R * .16 * f.s, ey + R * .32 * f.s); }, c, 2.4 * s);
}

// The Crookneck Gourd (Release 8): the archive's drawGourd for its SHAPES entry `crookneck`, ported as is. Its data lives inside a function.
const crookShape = () => ({ hue:'#b9cf3c', body:() => SM(P([[0,.88],[.52,.78],[.68,.42],[.52,.02],[.26,-.22],[.15,-.5],[.2,-.76],[.38,-.84],[.5,-.74],[.66,-.66],[.72,-.84],[.6,-1.04],[.36,-1.14],[.06,-1.08],[-.14,-.84],[-.2,-.5],[-.34,-.2],[-.6,.06],[-.7,.42],[-.52,.78]])),
  b:{ x:0, y:.34, r:.74 }, hl:[-.3, .1], top:[.7, -.72], stem:.5, face:{ x:-.02, y:.42, s:.86 }, bumps:7 });
/** The Crookneck at the origin: shadow, body and its curled neck, the bumps on the base, the stem hanging from the tip and the face. */
function paintCrookneck(g){
  const sh = crookShape(), c = pal(sh.hue), STEM = pal('#6e4c2a'), body = sh.body(), b = { x:sh.b.x * R, y:sh.b.y * R, r:sh.b.r * R };
  S.shadow(g, 0, R * .86, R * .86, R * .2);
  S.part(g, body, c, b, { mat:'pumpkin', hx:sh.hl[0] * R, hy:sh.hl[1] * R });
  const Rr = rng(5);   // the bumps, the archive's seed: none over the face
  for (let i = 0; i < sh.bumps; i++){
    const x = (Rr() - .5) * R, y = R * (.05 + Rr() * .7), r = R * (.04 + Rr() * .03);
    if (Math.hypot(x, y - R * .42) < R * .32) continue;
    S.part(g, E(x, y, r, r), { ...c, base:mix(c.base, c.light, .2) }, { x, y, r }, { flat:true, lw:1 });
  }
  g.save(); g.translate(sh.top[0] * R, sh.top[1] * R); g.rotate(sh.stem + Math.PI / 2);   // the stem hanging from the tip (the archive's stem(), not curly)
  S.part(g, SM([[-R * .07, R * .06], [-R * .09, -R * .12], [-R * .02, -R * .26], [R * .1, -R * .3], [R * .12, -R * .2], [R * .06, -R * .12], [R * .07, R * .06]], .8), STEM, { x:0, y:-R * .12, r:R * .2 }, { flat:true, mat:'wood' });
  g.restore();
  const f = sh.face, s = R / 40 * f.s, x = f.x * R, ey = f.y * R - R * .1 * f.s, ex = R * .3 * f.s, iris = mix(c.dark, '#7a5a2a', .5);   // the archive's face()
  S.eye(g, x - ex, ey, 9 * s, 9.5 * s, { lx:.2, iris }); S.eye(g, x + ex, ey, 9 * s, 9.5 * s, { lx:.2, iris });
  S.blush(g, x, ey + 10 * s, s);
  S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(x - R * .16 * f.s, ey + R * .32 * f.s); g2.quadraticCurveTo(x, ey + R * .45 * f.s, x + R * .16 * f.s, ey + R * .32 * f.s); }, c, 2.4 * s);
}

const hueOf = kind => __RELEASE__ >= 5 && kind === 'protector' ? protHue() : __RELEASE__ >= 7 && kind === 'wartling' ? wartShape().hue : __RELEASE__ >= 8 && kind === 'crookneck' ? crookShape().hue : GOURD_HUE;
const glowCol = kind => mix(hueOf(kind), '#fff6d0', .35);   // the archive's glowOf
const kOf = () => Math.min(2.5, Math.max(0.5, K || 1));
const bodies = {}, glows = {};
let ward = null;
function bodySprite(kind = 'grave'){
  const k = kOf(), have = bodies[kind]; if (have && have.k === k) return have;
  const c = document.createElement('canvas'); c.width = Math.ceil(BOX.w * k); c.height = Math.ceil(BOX.h * k);
  const g = c.getContext('2d'); g.scale(k, k); g.translate(BOX.ox, BOX.oy);
  if (__RELEASE__ >= 5 && kind === 'protector') paintProtector(g); else if (__RELEASE__ >= 7 && kind === 'wartling') paintWartling(g); else if (__RELEASE__ >= 8 && kind === 'crookneck') paintCrookneck(g); else paintGourd(g);
  return (bodies[kind] = { c, k });
}
function wardSprite(){
  const k = kOf(); if (ward && ward.k === k) return ward;
  const c = document.createElement('canvas'); c.width = Math.ceil(BOX.w * k); c.height = Math.ceil(BOX.h * k);
  const g = c.getContext('2d'); g.scale(k, k); g.translate(BOX.ox, BOX.oy); paintWard(g);
  return (ward = { c, k });
}
/** The 3×3 square: a soft fill per cell and one glowing rim in the gourd's colour, baked once per kind (the shadowBlur runs at bake time
 *  only); the Protector's adds shield corners. */
function glowSprite(kind = 'grave'){
  const k = kOf(), have = glows[kind]; if (have && have.k === k) return have;
  const S3 = CS * 3, c = document.createElement('canvas'); c.width = c.height = Math.ceil(S3 * k);
  const g = c.getContext('2d'), col = glowCol(kind); g.scale(k, k);
  for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++){ g.beginPath(); g.roundRect(q * CS + 6, r * CS + 6, CS - 12, CS - 12, 12); g.fillStyle = rgba(col, r === 1 && q === 1 ? .1 : .2); g.fill(); }
  g.save(); g.shadowColor = col; g.shadowBlur = 10; g.strokeStyle = rgba(col, .75); g.lineWidth = 2.5; g.beginPath(); g.roundRect(3, 3, S3 - 6, S3 - 6, 16); g.stroke();
  if (__RELEASE__ >= 5 && kind === 'protector'){   // shield corners
    g.lineWidth = 4; g.strokeStyle = rgba(col, .95); const L = CS * .42, m = 4;
    for (const [x, y, dx, dy] of [[m, m, 1, 1], [S3 - m, m, -1, 1], [m, S3 - m, 1, -1], [S3 - m, S3 - m, -1, -1]]){ g.beginPath(); g.moveTo(x, y + dy * L); g.lineTo(x, y); g.lineTo(x + dx * L, y); g.stroke(); }
  }
  if (__RELEASE__ >= 7 && kind === 'wartling'){   // a little wart at each corner and mid-edge
    g.fillStyle = rgba(col, .95);
    for (const [x, y, r] of [[9, 9, 5], [S3 - 9, 9, 5], [9, S3 - 9, 5], [S3 - 9, S3 - 9, 5], [S3 / 2, 4, 3.5], [S3 / 2, S3 - 4, 3.5], [4, S3 / 2, 3.5], [S3 - 4, S3 / 2, 3.5]]){ g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  }
  if (__RELEASE__ >= 8 && kind === 'crookneck'){   // a little shepherd's crook at each corner, curling inward
    g.lineWidth = 3.5; g.lineCap = 'round'; g.strokeStyle = rgba(col, .95); const L = CS * .36, m = 6, hk = CS * .09;
    for (const [x, y, dx, dy] of [[m, m, 1, 1], [S3 - m, m, -1, 1], [m, S3 - m, 1, -1], [S3 - m, S3 - m, -1, -1]]){
      g.beginPath(); g.moveTo(x, y + dy * L); g.lineTo(x, y + dy * hk); g.arc(x + dx * hk, y + dy * hk, hk, dx > 0 ? Math.PI : 0, dx > 0 ? 0 : Math.PI, (dx > 0) !== (dy > 0)); g.stroke();   // up the edge, then over in a hook
    }
  }
  g.restore();
  return (glows[kind] = { c, k });
}
/** Bake them now (night start), not on first sight. */
export function prebakeGourd(){ bodySprite(); glowSprite(); if (__RELEASE__ >= 5){ bodySprite('protector'); glowSprite('protector'); wardSprite(); } if (__RELEASE__ >= 7){ bodySprite('wartling'); glowSprite('wartling'); } if (__RELEASE__ >= 8){ bodySprite('crookneck'); glowSprite('crookneck'); } }

/** A gourd in its cell: (x, y) is the cell centre with the slide offsets already in; s the pop/grow scale; ph its own idle phase. The
 *  Protector's ward is blitted behind it with a pulsing alpha. */
export function drawGourdCell(ctx, x, y, s, t, ph, kind = 'grave'){
  const sp = bodySprite(kind), br = Math.sin(t * 2.1 + ph), rot = Math.sin(t * 1.3 + ph * 1.7) * .035;
  ctx.save(); ctx.translate(x, y - LIFT + FOOT * s);
  if (__RELEASE__ >= 5 && kind === 'protector'){ ctx.save(); ctx.globalAlpha = 0.45 + 0.25 * Math.sin(t * 2.4 + ph); ctx.scale(s, s); ctx.drawImage(wardSprite().c, -BOX.ox, -BOX.oy - FOOT, BOX.w, BOX.h); ctx.restore(); }
  ctx.rotate(rot); ctx.scale(s * (1 + br * .02), s * (1 - br * .025));   // breathes and sways on its foot, as a pumpkin does
  ctx.drawImage(sp.c, -BOX.ox, -BOX.oy - FOOT, BOX.w, BOX.h);
  ctx.restore();
}

/** The glow of each standing gourd's 3×3 under the graves and pumpkins, cut to the patch (5 cells on an edge, 3 in a corner): one drawImage
 *  per gourd a frame. */
export function drawGourdGlow(ctx, t){
  for (let r0 = 0; r0 < ROWS; r0++) for (let c0 = 0; c0 < COLS; c0++){
    const cell = grid[r0][c0]; if (!cell || !cell.gourd || cell.fly > 0) continue;
    const kind = cell.gourd === true ? 'grave' : cell.gourd, sp = glowSprite(kind), k = sp.k;
    const x0 = LANE(c0) - CS * 1.5 + cell.ox, y0 = GY + (r0 - 1) * CS + cell.oy;
    const ax = Math.max(x0, GX), ay = Math.max(y0, GY), bx = Math.min(x0 + CS * 3, GX + COLS * CS), by = Math.min(y0 + CS * 3, GY + ROWS * CS);
    if (bx <= ax || by <= ay) continue;
    ctx.globalAlpha = (0.55 + 0.35 * Math.sin(t * 2 + (kind === 'grave' ? 0 : kind === 'protector' ? 1.6 : kind === 'crookneck' ? 2.4 : 0.8))) * Math.min(1, cell.grow * 1.5);
    ctx.drawImage(sp.c, (ax - x0) * k, (ay - y0) * k, (bx - ax) * k, (by - ay) * k, ax, ay, bx - ax, by - ay);
  }
  ctx.globalAlpha = 1;
}

/** A picker tile icon: a baked gourd of a kind fitted into a px square canvas (the Protector with its ward). */
export function gourdIcon(px = 96, kind = 'grave'){
  const sp = bodySprite(kind), c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d'), span = 2.5 * R, f = px / span;   // the gourd spans about 1.45 R above its origin to its .9 R foot, 2 R wide
  g.scale(f, f); g.translate(span / 2, 1.5 * R);
  if (__RELEASE__ >= 5 && kind === 'protector') g.drawImage(wardSprite().c, -BOX.ox, -BOX.oy, BOX.w, BOX.h);
  g.drawImage(sp.c, -BOX.ox, -BOX.oy, BOX.w, BOX.h);
  return c;
}
