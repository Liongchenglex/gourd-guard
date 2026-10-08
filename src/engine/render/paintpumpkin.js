// The Paint pumpkin's look (owner, 2026-09-27, from docs/archive/paint-pumpkin/sketch): a lilac rind with four big smooth
// paint patches (a blob right of centre, one wrapping the lower-left edge, a band along the top-left, a small one top-right),
// each with a wet gloss along its upper edge and a darker paint rim, plus one drip. Drawn once into the cached sprite.
import { rgba, mix } from './paint.js';

const TAU = Math.PI * 2;
const RIBS = [[-.66, .36, .72], [.62, .4, .74], [-.34, .46, .8], [.3, .48, .82], [-.02, .5, .84]];   // the pumpkin() rind outline (chars/w1.js)
const rind = (g, R) => { g.beginPath(); for (const [ox, rw, rh] of RIBS) g.ellipse(ox * R * .95, R * .04, rw * R * 1.12, R * rh, 0, 0, TAU); };
/** A smooth closed curve through points given in R units. */
const smooth = (g, pts, R) => { const n = pts.length, P = pts.map(([x, y]) => [x * R, y * R]), m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let s = m(P[n - 1], P[0]); g.beginPath(); g.moveTo(s[0], s[1]);
  for (let i = 0; i < n; i++){ const e = m(P[i], P[(i + 1) % n]); g.quadraticCurveTo(P[i][0], P[i][1], e[0], e[1]); } g.closePath(); };
const PATCHES = [
  [[.2, .02], [.42, -.06], [.66, .04], [.72, .24], [.6, .44], [.36, .5], [.18, .38], [.12, .18]],
  [[-1.3, .16], [-.84, .14], [-.6, .3], [-.48, .56], [-.44, .84], [-.42, 1.2], [-1.3, 1.2]],
  [[-.95, -.95], [-.12, -1.0], [-.14, -.74], [-.34, -.6], [-.66, -.58], [-.9, -.66]],
  [[.34, -1.0], [1.3, -.9], [1.3, -.3], [.86, -.38], [.62, -.54], [.46, -.72]],
];
/** Paint patches over a pumpkin of radius R drawn at (0, 0); `paints` are the four patch colours. */
export function paintPatches(g, R, paints){
  g.save(); rind(g, R); g.clip();
  PATCHES.forEach((pts, i) => { const c = paints[i];
    smooth(g, pts, R); g.fillStyle = c; g.fill();
    g.save(); smooth(g, pts, R); g.clip(); g.strokeStyle = rgba(mix(c, '#ffffff', .6), .75); g.lineWidth = R * .07; g.translate(-R * .04, -R * .05); smooth(g, pts, R); g.stroke(); g.restore();
    smooth(g, pts, R); g.strokeStyle = rgba(mix(c, '#1a0a20', .55), .7); g.lineWidth = R * .03; g.stroke(); });
  g.fillStyle = paints[0]; g.beginPath(); g.moveTo(R * .36, R * .44); g.lineTo(R * .34, R * .66); g.arc(R * .4, R * .66, R * .06, Math.PI, 0, true); g.lineTo(R * .44, R * .44); g.closePath(); g.fill();   // a drip
  g.restore();
}
