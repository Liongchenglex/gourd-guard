// ---------- Extra characters (not tied to a world), Toy Plastic style ----------
// The Loot Sack: a greedy treasure goblin that is mostly a burlap sack of loot on two stubby legs. It is two lanes wide
// (r 40). It waddles in, stops to taunt the player while it waits (m.p >= m.hold), then turns and hops away when its
// timer runs out (m.fleeing). Drawn around (0,0) with the feet at y = 50, like every other character.

import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from '../paint.js';
import { TAU } from '../../util.js';

const BURLAP = pal('#c99a5c'), PATCH = pal('#7a5a8c'), PATCH2 = pal('#5f8a6a'), ROPE = pal('#dcc080'), SKIN = pal('#7fae4a'), SHOE = pal('#6a3f7a'),
  GOLD = pal('#f2c02e'), GEM = pal('#e0385a'), GEM2 = pal('#3ac0a0'), SEED = pal('#f2e2b6'), HOLE = '#2a1610', THREAD = '#4a2c16';

// ---------- loot bits ----------
function coin(g, x, y, r, rot = 0, k = 1){
  S.part(g, E(x, y, r, r * k, rot), GOLD, { x, y, r }, { mat:'metal', hx:x - r * .35, hy:y - r * .4 * k, lw:1.2 });
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, k);
  g.strokeStyle = rgba(GOLD.deep, .55); g.lineWidth = r * .13; ell(g, 0, 0, r * .66, r * .66); g.stroke();
  g.fillStyle = rgba(GOLD.deep, .5); ell(g, 0, 0, r * .18, r * .32); g.fill(); g.restore();
}
function gem(g, x, y, r, rot = 0, c = GEM){
  g.save(); g.translate(x, y); g.rotate(rot);
  const out = PL([[-r * .6, -r * .7], [r * .6, -r * .7], [r, -r * .15], [0, r], [-r, -r * .15]]);
  S.part(g, out, c, { x:0, y:0, r }, { hx:-r * .3, hy:-r * .4, lw:1.2 });
  g.strokeStyle = rgba(c.light, .8); g.lineWidth = .9; g.beginPath(); g.moveTo(-r, -r * .15); g.lineTo(r, -r * .15); g.moveTo(-r * .3, -r * .15); g.lineTo(0, r); g.lineTo(r * .3, -r * .15); g.moveTo(-r * .6, -r * .7); g.lineTo(-r * .3, -r * .15); g.moveTo(r * .6, -r * .7); g.lineTo(r * .3, -r * .15); g.stroke();
  g.restore();
}
function seed(g, x, y, r, rot = 0){
  g.save(); g.translate(x, y); g.rotate(rot);
  const p = SM([[0, -r * 1.3, 1], [r * .72, -r * .25], [r * .6, r * .65], [0, r], [-r * .6, r * .65], [-r * .72, -r * .25]], .85);
  S.part(g, p, SEED, { x:0, y:0, r }, { mat:'bone', hx:-r * .25, hy:-r * .2, lw:1.1 });
  g.strokeStyle = rgba(SEED.dark, .5); g.lineWidth = r * .12; SM([[0, -r * .95, 1], [r * .5, -r * .15], [r * .42, r * .5], [0, r * .72], [-r * .42, r * .5], [-r * .5, -r * .15]], .85)(g); g.stroke();
  g.restore();
}
function sparkle(g, x, y, s, a = 1){
  if (a <= .02) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.shadowColor = '#fff2a0'; g.shadowBlur = 5;
  g.beginPath(); for (let i = 0; i < 4; i++){ const an = i * TAU / 4; g.lineTo(Math.cos(an) * s, Math.sin(an) * s); g.quadraticCurveTo(0, 0, Math.cos(an + TAU / 8) * s * .2, Math.sin(an + TAU / 8) * s * .2); g.quadraticCurveTo(0, 0, Math.cos(an + TAU / 4) * s, Math.sin(an + TAU / 4) * s); }
  g.closePath(); g.fillStyle = '#fffbe0'; g.fill(); g.restore();
}
/** A coarse burlap weave and a few slubs over a clip shape. */
function burlap(g, clip, b, seedN){
  const R = rng(seedN); g.save(); clip(g); g.clip();
  g.lineWidth = .7;
  for (let y = b.y - b.r; y < b.y + b.r; y += 3.2){ g.strokeStyle = `rgba(60,34,14,${.12 + R() * .08})`; g.beginPath(); g.moveTo(b.x - b.r * 1.2, y); g.quadraticCurveTo(b.x, y + (R() - .5) * 3, b.x + b.r * 1.2, y + (R() - .5) * 2); g.stroke(); }
  for (let x = b.x - b.r * 1.1; x < b.x + b.r * 1.1; x += 3.2){ g.strokeStyle = `rgba(255,236,190,${.06 + R() * .07})`; g.beginPath(); g.moveTo(x, b.y - b.r * 1.2); g.lineTo(x + (R() - .5) * 3, b.y + b.r * 1.2); g.stroke(); }
  for (let i = 0; i < 12; i++){ g.fillStyle = R() < .5 ? 'rgba(80,46,18,.22)' : 'rgba(255,240,200,.2)'; ell(g, b.x + (R() - .5) * b.r * 1.7, b.y + (R() - .5) * b.r * 1.5, 2 + R() * 4, .8 + R() * .6, (R() - .5) * .3); g.fill(); }
  g.restore();
}
/** Running stitches along a path of points. */
function stitches(g, pts, len = 3){
  g.strokeStyle = THREAD; g.lineWidth = 1.3; g.lineCap = 'round';
  for (let i = 0; i < pts.length - 1; i++){ const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    g.beginPath(); g.moveTo(mx - Math.cos(a) * len, my - Math.sin(a) * len); g.lineTo(mx + Math.cos(a) * len, my + Math.sin(a) * len); g.stroke(); }
}
function fray(g, x, y, dir, n = 3){ const R = rng(x * 7 + y * 11 | 0); g.strokeStyle = rgba(BURLAP.dark, .9); g.lineWidth = .9; for (let i = 0; i < n; i++){ const a = dir + (R() - .5) * 1.2, l = 3 + R() * 5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + (R() - .5) * 2, y + Math.sin(a) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } }

// ---------- parts ----------
function shoe(g, x, y, s){   // curly-toed goblin shoe, sole at y, toe points to side s
  const p = SM([[x - s * 11, y - 9], [x + s * 4, y - 10], [x + s * 16, y - 5], [x + s * 24, y - 10], [x + s * 25, y - 3], [x + s * 16, y + 1], [x - s * 11, y + 1]], .75);
  S.part(g, p, SHOE, { x:x + s * 4, y:y - 4, r:14 }, { mat:'leather', hx:x - s * 2, hy:y - 7 });
  S.part(g, E(x + s * 24, y - 11, 3, 3), GOLD, { x:x + s * 24, y:y - 11, r:3 }, { flat:true, lw:1 });
}
function leg(g, s, lx, ly){
  const fx = s * 34 + lx, fy = 49 + ly;
  S.tube(g, SO([[s * 30, 20], [s * 32 + lx * .5, 33 + ly * .5], [fx, fy - 7]]), SKIN, 14);
  shoe(g, fx, fy, s);
}
function arm(g, sx, sy, ex, ey, hx, hy, dir){
  S.dot(g, E(sx, sy, 8, 9), HOLE);
  S.tube(g, SO([[sx, sy], [ex, ey], [hx, hy]]), SKIN, 11);
  S.hand(g, hx, hy, SKIN, dir, 3, 8);
  fray(g, sx - 4, sy - 6, -2, 3); fray(g, sx + 3, sy + 7, 1.8, 2);
}
const BODY = SM([[-20, -64], [-46, -55], [-72, -35], [-88, -8], [-90, 14], [-78, 25], [-50, 32], [-18, 30], [16, 32], [52, 32], [79, 24], [91, 9], [86, -12], [70, -37], [45, -55], [20, -64]], .9);
const BODYB = { x:-8, y:-12, r:96 };
function ruff(g, j){
  const top = SM([[-22, -66], [-36, -79], [-28, -94], [-14, -86], [-4, -100], [8, -90], [22, -97], [32, -80], [22, -66]], .8);
  S.dot(g, E(-1, -88, 17, 5), HOLE);
  coin(g, -6 + j, -95, 9, .2, .45); gem(g, 9, -94 - j * .5, 6, .3, GEM2);
  S.part(g, top, BURLAP, { x:-2, y:-82, r:30 }, { mat:'cloth', hx:-14, hy:-86 }); burlap(g, top, { x:0, y:-82, r:32 }, 5);
  // the mouth of the sack, gathered: the loot sits in it, the front lip in front
  S.part(g, SM([[-24, -80], [-12, -84], [0, -82], [14, -85], [26, -80], [14, -76], [0, -77], [-14, -75]], .8), BURLAP, { x:0, y:-80, r:24 }, { flat:true, mat:'cloth', lw:1.2 });
  for (const [x, y, d] of [[-28, -94, -2.2], [-4, -100, -1.6], [22, -97, -1.1], [-36, -79, -2.8], [32, -80, -.4]]) fray(g, x, y, d, 3);
  S.crease(g, SO([[-18, -68], [-22, -78]]), BURLAP, 1.4, .5); S.crease(g, SO([[0, -67], [-2, -80]]), BURLAP, 1.4, .5); S.crease(g, SO([[16, -68], [20, -79]]), BURLAP, 1.4, .5);
}
function rope(g, back){
  S.part(g, RR(-27, -71, 54, 10, 5), ROPE, { x:0, y:-66, r:27 }, { flat:true, mat:'cloth', lw:1.2 });
  g.strokeStyle = rgba(ROPE.deep, .6); g.lineWidth = 1.1; for (let x = -24; x < 26; x += 5){ g.beginPath(); g.moveTo(x, -70); g.lineTo(x + 4, -62); g.stroke(); }
  const kx = back ? -4 : 16;
  for (const [ex, ey] of back ? [[-18, -40], [6, -38]] : [[30, -42], [20, -38]]){ S.tube(g, SO([[kx, -64], [(kx + ex) / 2 + 3, -54], [ex, ey]]), ROPE, 4); fray(g, ex, ey, Math.PI / 2, 3); }
  S.part(g, E(kx, -65, 6, 5.5), ROPE, { x:kx, y:-65, r:6 }, { flat:true, mat:'cloth', lw:1.2 });
  if (back) for (const s of [-1, 1]) S.part(g, SM([[kx, -65], [kx + s * 14, -74], [kx + s * 17, -62]], .8), ROPE, { x:kx + s * 10, y:-67, r:8 }, { flat:true, mat:'cloth', lw:1.2 });
}

// ---------- the Loot Sack ----------
export function sack(g, P = {}){
  const w = P.walk, ta = P.taunt, fl = P.flee, back = fl != null;
  let rot = 0, bob = 0, sx = 1, sy = 1, lL = [0, 0], lR = [0, 0], j = 0, lid = .32, grin = 0, tongue = 0, hop = 0;
  if (w != null){
    const leg2 = s => { const ph = w * TAU + (s < 0 ? 0 : Math.PI); return [Math.cos(ph) * 7, -Math.max(0, Math.sin(ph)) * 9]; };
    lL = leg2(-1); lR = leg2(1); rot = Math.sin(w * TAU) * .07; bob = -Math.abs(Math.sin(w * TAU)) * 4; const th = Math.abs(Math.cos(w * TAU)); sy = 1 - th * .035; sx = 1 + th * .03; j = Math.sin(w * TAU * 2) * 1.6;
  }
  if (ta != null){
    const wg = Math.sin(ta * TAU * 2); rot = Math.sin(ta * TAU) * .1; sy = 1 + wg * .04; sx = 1 - wg * .035; j = wg * 2.6; lid = .4; grin = 1; tongue = 1;
    lL = [0, -Math.max(0, Math.sin(ta * TAU * 2)) * 8]; lR = [0, -Math.max(0, -Math.sin(ta * TAU * 2)) * 8];
  }
  if (fl != null){
    const h = Math.sin(fl * Math.PI); hop = h * 24; const land = 1 - Math.min(1, h * 3); sy = 1 - land * .08 + h * .05; sx = 1 + land * .07 - h * .03; rot = Math.sin(fl * TAU) * .06; j = h * 3;
    lL = [-4 * h, -h * 12]; lR = [4 * h, -h * 12];
  }
  S.shadow(g, 2, 50, 94 - hop * 1.2, 11 - hop * .15);
  g.save(); g.translate(0, -hop);
  // legs under the sack; from behind the shoes point the other way
  leg(g, -1, lL[0], lL[1]); leg(g, 1, lR[0], lR[1]);
  g.save(); g.translate(0, 36 + bob); g.rotate(rot); g.scale(sx, sy); g.translate(0, -36);
  // arms that stick out of holes in the sides
  const ARM = s => {
    if (ta != null && s > 0){ const sh = Math.sin(ta * TAU * 2) * 7; return [s * 82, -10, s * 104, -38, s * 98 + sh, -70, -Math.PI / 2]; }
    if (ta != null){ const sh = Math.sin(ta * TAU * 2 + 1) * 8; return [s * 84, -4, s * 108, -18, s * 114, -40 + sh, -Math.PI / 2 - .5]; }
    if (fl != null){ const f = Math.sin(fl * TAU * 2) * 8; return [s * 82, -8, s * 102, -28 + f * s, s * 104, -52 + f * s, -Math.PI / 2 + s * .6]; }
    const sw = w != null ? Math.sin(w * TAU + (s < 0 ? Math.PI : 0)) * 8 : 0; return [s * 84, -4, s * 98, 6 + sw * .4, s * 100 + sw, 20, Math.PI / 2 - s * .3];
  };
  const drawArm = s => { const [a, b, c, d, e, f, dir] = ARM(s); arm(g, a, b, c, d, e, f, dir); };
  // the sack
  S.part(g, BODY, BURLAP, BODYB, { mat:'cloth', hx:-46, hy:-38 }); burlap(g, BODY, BODYB, back ? 9 : 3);
  S.overlay(g, BODY, BURLAP, BODYB, .25);
  // lumps of loot pressing through the cloth
  for (const [x, y, r] of back ? [[-40, 6, 18], [30, -18, 16], [52, 20, 14]] : [[-44, 18, 16], [-20, -40, 12], [62, -20, 13]]){ g.save(); BODY(g); g.clip(); const gr = g.createRadialGradient(x - r * .3, y - r * .3, 1, x, y, r); gr.addColorStop(0, rgba(BURLAP.light, .5)); gr.addColorStop(.7, rgba(BURLAP.light, 0)); gr.addColorStop(1, rgba(BURLAP.deep, .22)); g.fillStyle = gr; ell(g, x, y, r, r); g.fill(); g.restore(); }
  for (const p of [[[-14, -60], [-26, -46], [-34, -30]], [[12, -60], [22, -46], [28, -32]], [[-2, -58], [-1, -46]], [[-60, 26], [-50, 18]], [[58, 28], [66, 18]]]) S.crease(g, SO(p), BURLAP, 1.8, .45);
  if (!back){
    // a patch sewn on the shoulder
    const pt = SM([[-72, -24, 1], [-50, -28, 1], [-48, -6, 1], [-70, -2, 1]]); S.part(g, pt, PATCH, { x:-60, y:-15, r:14 }, { flat:true, mat:'cloth', lw:1.2 });
    stitches(g, [[-72, -24], [-61, -26], [-50, -28], [-49, -17], [-48, -6], [-59, -4], [-70, -2], [-71, -13], [-72, -24]], 2.4);
    // the tear, and the loot poking out of it
    const tear = PL([[34, 2], [44, -4], [50, 2], [60, -6], [66, 4], [74, 2], [70, 14], [74, 20], [62, 24], [54, 28], [44, 25], [36, 26], [38, 18], [32, 12]]);
    S.dot(g, tear, HOLE); S.contact(g, tear, 54, 12, 20, 14, .6);
    coin(g, 64 + j * .4, 24 - Math.abs(j) * .3, 9, -.3, .9); coin(g, 48, 25 + j * .2, 8.5, .2, .8); gem(g, 60, 8 - j * .6, 8, .25); seed(g, 43, 12 + j * .3, 7, -.5); coin(g, 72, 16 + j * .5, 7, .6, .55);
    for (const [x, y, d] of [[44, -4, -1.8], [60, -6, -1.4], [74, 2, -.2], [74, 20, .4], [54, 28, 1.6], [36, 26, 2.4], [32, 12, 3.1]]) fray(g, x, y, d, 3);
    // face: two eyes peeking out of holes in the weave, and a sly stitched grin
    for (const s of [-1, 1]){ const ex = s * 22 + 2, ey = -28;
      const hole = SM([[ex - 15, ey - 2], [ex - 8, ey - 13], [ex + 6, ey - 13], [ex + 15, ey - 3], [ex + 12, ey + 10], [ex - 12, ey + 10]], .9);
      S.part(g, hole, pal('#3a2216'), { x:ex, y:ey, r:15 }, { flat:true, noEdge:true }); S.contact(g, hole, ex, ey - 10, 14, 6, .7);
      S.eye(g, ex + s * .5, ey + 1, 10.5, 11, { pr:.42, lx:.1 * -s + .15, ly:.2, iris:'#c08a1a', pupil:'#1a1016', lid, lidCol:BURLAP.dark, lidDeep:THREAD, tilt:-s * .32 });
      g.strokeStyle = rgba(BURLAP.deep, .9); g.lineWidth = 2.2; hole(g); g.stroke();
      for (let i = 0; i < 6; i++){ const a = i / 6 * TAU + .3; fray(g, ex + Math.cos(a) * 14, ey + Math.sin(a) * 11, a, 1); }
    }
    sparkle(g, -12, -34, 4.5, .95); sparkle(g, 32, -34, 3.2, .8);
    S.blush(g, 2, -10, 1.15);
    // grin: a thread line with cross stitches, one corner hitched up (sly), a gold tooth
    const gl = [[-30, -4 - grin * 2], [-18, 5 + grin * 2], [-4, 9 + grin * 3], [10, 8 + grin * 3], [24, 1 + grin], [34, -10 - grin * 2]];
    if (grin){ S.dot(g, SM([...gl, [10, 14 + grin * 3], [-4, 15 + grin * 3], [-18, 11]], .9), '#3a1420'); }
    g.strokeStyle = THREAD; g.lineWidth = 2.6; g.lineCap = 'round'; SO(gl)(g); g.stroke();
    stitches(g, gl, 4.2); stitches(g, [[-30, -4 - grin * 2], [-24, 0], [-18, 5 + grin * 2], [-11, 7], [-4, 9 + grin * 3], [3, 9], [10, 8 + grin * 3], [17, 5], [24, 1 + grin], [29, -4], [34, -10 - grin * 2]], 3);
    S.part(g, RR(4, 8 + grin * 3, 6, 7, 2), GOLD, { x:7, y:11, r:5 }, { flat:true, lw:1 }); S.dot(g, E(5.8, 10 + grin * 3, 1, 2), '#fff', .8);
    if (tongue) S.part(g, SM([[14, 9 + grin * 3], [22, 7 + grin * 2], [24, 16], [18, 20]], .8), pal('#ff7a9a'), { x:19, y:13, r:6 }, { flat:true, lw:1.1 });
    sparkle(g, 62, 4, 5, .85 + j * .05); sparkle(g, 74, 24, 3.5, .5 + Math.abs(j) * .15);
  } else {
    // from behind: a seam up the back and a big patch
    g.strokeStyle = rgba(BURLAP.deep, .5); g.lineWidth = 1.6; SO([[2, -60], [4, -20], [2, 20], [4, 34]])(g); g.stroke(); stitches(g, [[2, -58], [3, -44], [4, -30], [4, -16], [3, -2], [2, 12], [3, 26], [4, 34]], 3.4);
    const pt = SM([[20, -6, 1], [52, -12, 1], [56, 20, 1], [24, 24, 1]]); S.part(g, pt, PATCH2, { x:38, y:6, r:18 }, { flat:true, mat:'cloth', lw:1.2 });
    stitches(g, [[20, -6], [36, -9], [52, -12], [54, 4], [56, 20], [40, 22], [24, 24], [22, 9], [20, -6]], 2.6);
    const tear = PL([[-58, 4], [-48, -2], [-40, 6], [-34, 2], [-36, 14], [-48, 18], [-58, 14]]); S.dot(g, tear, HOLE); coin(g, -48, 10 + j * .3, 7, .3, .8);
  }
  drawArm(-1); drawArm(1);
  if (ta != null){ const sh = Math.sin(ta * TAU * 2) * 7; coin(g, 98 + sh, -84, 11, sh * .05, .95); sparkle(g, 110 + sh, -94, 5, .9); sparkle(g, 84 + sh, -76, 3, .6); }
  rope(g, back); ruff(g, j);
  if (back && fl != null){ const f = fl; coin(g, -30 - f * 16, -70 + f * 60, 6, f * 4, .6 + .4 * Math.abs(Math.cos(f * 6))); coin(g, 34 + f * 10, -60 + f * 50, 5, f * 5, .5 + .5 * Math.abs(Math.sin(f * 7))); }
  g.restore(); g.restore();
}

// ---------- registry ----------
// r 40, feet at 38 below the centre: scale .7, dy = 38 − 50 × .7 = 3. The body spans about ±90 drawing units (±63 in game), two lanes.
export const EXTRA = {
  sack: { draw:sack, scale:.7, dy:3, box:{ x:-128, y:-138, w:256, h:196 },
    clips:{ walk:{ n:8, fps:8, pose:t => ({ walk:t }) }, taunt:{ n:8, fps:8, pose:t => ({ taunt:t }) }, flee:{ n:8, fps:10, pose:t => ({ flee:t }) } },
    frame(m, clips){
      if (m.fleeing){ const c = clips.flee; return ['flee', Math.floor((m.age || 0) * c.fps) % c.n]; }
      if (m.hold != null && m.p >= m.hold){ const c = clips.taunt; return ['taunt', Math.floor((m.age || 0) * c.fps) % c.n]; }
      return null;
    }, still:{ taunt:.15 } },
};
