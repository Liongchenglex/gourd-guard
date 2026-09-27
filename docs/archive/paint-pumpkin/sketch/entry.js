// Paint pumpkin v2 (archive only): the owner's sketch — a few big smooth paint patches and a paintbrush stem — in four palettes.
import { pumpkin } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/chars/w1.js';
import { faceFor } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/faces.js';
import { pal, rgba, rng, mix } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/paint.js';
import { monsterIcon } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/monsters.js';
import { pumpkinIcon } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/sprites.js';

const TAU = Math.PI * 2, ease = t => 1 - (1 - t) * (1 - t);
const RIBS = [[-.66, .36, .72], [.62, .4, .74], [-.34, .46, .8], [.3, .48, .82], [-.02, .5, .84]];
const rind = (g, R) => { g.beginPath(); for (const [ox, rw, rh] of RIBS) g.ellipse(ox * R * .95, R * .04, rw * R * 1.12, R * rh, 0, 0, TAU); };
/** A smooth closed curve through points (R units). */
const smooth = (g, pts, R) => { const n = pts.length, P = pts.map(([x, y]) => [x * R, y * R]); g.beginPath(); const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; let s = m(P[n - 1], P[0]); g.moveTo(s[0], s[1]); for (let i = 0; i < n; i++){ const e = m(P[i], P[(i + 1) % n]); g.quadraticCurveTo(P[i][0], P[i][1], e[0], e[1]); } g.closePath(); };
// the sketch's four patches: a big blob right of centre, one wrapping the lower-left edge, a band along the top-left, a small one top-right
const PATCHES = [
  [[.2, .02], [.42, -.06], [.66, .04], [.72, .24], [.6, .44], [.36, .5], [.18, .38], [.12, .18]],
  [[-1.3, .16], [-.84, .14], [-.6, .3], [-.48, .56], [-.44, .84], [-.42, 1.2], [-1.3, 1.2]],
  [[-.95, -.95], [-.12, -1.0], [-.14, -.74], [-.34, -.6], [-.66, -.58], [-.9, -.66]],
  [[.34, -1.0], [1.3, -.9], [1.3, -.3], [.86, -.38], [.62, -.54], [.46, -.72]],
];
function paintPatches(g, R, P){
  g.save(); rind(g, R); g.clip();
  PATCHES.forEach((pts, i) => { const c = P.paints[i];
    smooth(g, pts, R); g.fillStyle = c; g.fill();
    g.save(); smooth(g, pts, R); g.clip(); g.strokeStyle = rgba(mix(c, '#ffffff', .6), .75); g.lineWidth = R * .07; g.translate(-R * .04, -R * .05); smooth(g, pts, R); g.stroke(); g.restore();   // wet gloss along the upper edge
    smooth(g, pts, R); g.strokeStyle = rgba(mix(c, '#1a0a20', .55), .7); g.lineWidth = R * .03; g.stroke(); });   // thick paint edge
  const d = P.paints[0]; g.fillStyle = d; g.beginPath(); g.moveTo(R * .36, R * .44); g.lineTo(R * .34, R * .66); g.arc(R * .4, R * .66, R * .06, Math.PI, 0, true); g.lineTo(R * .44, R * .44); g.closePath(); g.fill();   // a drip off the big blob
  g.restore();
}
/** The paintbrush stem from the sketch: a short wooden handle, a metal ferrule and a flat bristle tip sweeping right, dipped in paint. */
function brushStem(g, R, P){
  g.save(); g.translate(0, -R * .72); g.scale(1.35, 1.35);   // a big, readable brush
  g.fillStyle = '#7a4a26'; g.beginPath(); g.roundRect(-R * .09, -R * .22, R * .18, R * .3, R * .05); g.fill();
  g.fillStyle = '#c8ccd6'; g.beginPath(); g.roundRect(-R * .12, -R * .36, R * .24, R * .16, R * .04); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(-R * .08, -R * .34, R * .05, R * .12);
  g.fillStyle = '#e8d2a8'; g.beginPath(); g.moveTo(-R * .11, -R * .36); g.bezierCurveTo(-R * .12, -R * .6, R * .05, -R * .72, R * .36, -R * .74); g.bezierCurveTo(R * .2, -R * .6, R * .12, -R * .48, R * .11, -R * .36); g.closePath(); g.fill();
  g.save(); g.clip(); g.fillStyle = P.paints[0]; g.beginPath(); g.moveTo(-R * .2, -R * .56); g.bezierCurveTo(R * .02, -R * .64, R * .2, -R * .66, R * .5, -R * .8); g.lineTo(R * .5, -R * .9); g.lineTo(-R * .2, -R * .9); g.closePath(); g.fill(); g.restore();   // dipped tip
  g.strokeStyle = 'rgba(60,30,10,.35)'; g.lineWidth = 1; for (const k of [-.04, .03]){ g.beginPath(); g.moveTo(R * k, -R * .38); g.quadraticCurveTo(R * (k + .06), -R * .56, R * (.2 + k), -R * .66); g.stroke(); }
  g.restore();
}
const PALETTES = [
  { key:'pastel', name:'Paint pumpkin, pastel', rec:true, base:'#c9b6f0', paints:['#7fe0c3', '#ffb59a', '#fff0a0', '#8ec5ff'], face:'purple',
    why:'The chosen look (owner, 2026-09-27): a soft lilac rind with big mint, peach, butter and sky-blue paint patches, and a normal pumpkin stem. Its trail is pastel paint drops and its hit throws the patches out as splats.' },
  { key:'brushskin', name:'Future skin: paintbrush stem', brush:true, base:'#c9b6f0', paints:['#7fe0c3', '#ffb59a', '#fff0a0', '#8ec5ff'], face:'purple',
    why:'Kept for later as a skin: the same pumpkin with a paintbrush for a stem, its bristle tip dipped in paint.' },
];
const bake = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d'); g.scale(2, 2); fn(g); return c; };
const faceOf = P => { const f = faceFor(P.face); return (g, R, c, lit) => { paintPatches(g, R, P); f(g, R, c, lit); }; };
const icon = (P, R, lit) => bake(R * 3.4, R * 3.6, g => { g.translate(R * 1.7, R * 2.0); pumpkin(g, pal(P.base), lit, R, faceOf(P)); if (P.brush) brushStem(g, R, P); });   // the pumpkin keeps its normal stem; the brush stem is saved for a skin
function trail(g, x, y, R, t, P){ const Rr = rng(4); for (let i = 0; i < 16; i++){ const f = (Rr() + t * 2.4) % 1, px = x + (Rr() - .5) * R * 1.6 * (1 - f * .5), py = y + 8 + f * 90, s = (1 - f) * (3 + Rr() * 4); g.fillStyle = rgba(P.paints[i % 4], 1 - f); g.beginPath(); g.ellipse(px, py, s, s * 1.3, 0, 0, TAU); g.fill(); } }
function hit(g, t, P){ const R = rng(21), st = Math.min(1, t * 4), fade = t < .6 ? 1 : 1 - (t - .6) / .4;
  PATCHES.slice(0, 3).forEach((pts, i) => { g.save(); g.globalAlpha = fade * .9; g.translate([0, -26, 24][i], [2, 18, 14][i]); g.scale(st * [34, 18, 16][i], st * [30, 16, 14][i]); smooth(g, pts.map(([x, y]) => [x - .2, y - .2]), 1); g.fillStyle = P.paints[i]; g.fill(); g.restore(); });
  for (let i = 0; i < 20; i++){ const a = R() * TAU, sp = 40 + R() * 70, x = Math.cos(a) * sp * ease(t), y = Math.sin(a) * sp * ease(t) + t * t * 60, s = (2 + R() * 4) * (1 - t * .6); g.fillStyle = rgba(P.paints[i % 4], 1 - t); g.beginPath(); g.ellipse(x, y, s, s * 1.25, a, 0, TAU); g.fill(); } }
const W = 340, H = 300;
function card(P){
  const el = document.createElement('article'); el.className = 'card' + (P.rec ? ' rec' : '');
  el.innerHTML = `${P.rec ? '<div class="tag">Chosen</div>' : '<div class="tag dim">Skin idea</div>'}<h3>${P.name}</h3><div class="sw">${[P.base, ...P.paints].map((c, i) => `<i style="background:${c}" title="${c}"></i>${i === 0 ? '<b>+</b>' : ''}`).join('')}</div>`;
  const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2; cv.style.width = W + 'px'; cv.style.maxWidth = '100%'; el.appendChild(cv);
  el.insertAdjacentHTML('beforeend', `<p>${P.why}</p><div class="small"><span>In the patch</span><span>Lit</span><span>Shop icon</span></div><div class="mixLabel">In a mixed patch, unlit (can you spot it?)</div>`);
  const row = el.querySelector('.small'); [[icon(P, 22, false), 74], [icon(P, 22, true), 74], [icon(P, 16, true), 54]].forEach(([c, w], i) => { c.style.width = w + 'px'; row.children[i].prepend(c); });
  const mixC = document.createElement('canvas'); mixC.width = 300 * 2; mixC.height = 56 * 2; mixC.style.width = '300px'; mixC.style.maxWidth = '100%'; mixC.className = 'mix'; el.appendChild(mixC);
  { const mg = mixC.getContext('2d'); mg.scale(2, 2); mg.fillStyle = '#3a2718'; mg.fillRect(0, 0, 300, 56); const order = [0, 6, 3, 'P', 1, 7, 5, 4, 2, 9]; order.forEach((t, i) => { const x = 4 + i * 29.5; if (t === 'P') mg.drawImage(icon(P, 13, false), x - 7.1, 1, 44.2, 46.8); else mg.drawImage(pumpkinIcon(t, false, 60), x, 12, 30, 30); }); }
  const big = icon(P, 26, true), fly = icon(P, 20, true), ghoul = monsterIcon('ghoul', 100), g = cv.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1a1030'); sky.addColorStop(1, '#2a1a1a'); const t0 = performance.now();
  (function loop(now){
    const t = (now - t0) / 1000; g.setTransform(2, 0, 0, 2, 0, 0); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const T = 2.2, u = t % T, hx = W / 2, hy = 80, HIT = .42; g.drawImage(ghoul, hx - 50, hy - 56, 100, 100);
    [[W * .2, 0], [W * .8, 1.3]].forEach(([x, ph]) => { const s = 1 + Math.sin(t * 2.4 + ph) * .03; g.save(); g.translate(x, H - 50); g.scale(s, 1 / s); g.drawImage(big, -26 * 1.7, -26 * 2.0, 26 * 3.4, 26 * 3.6); g.restore(); });
    if (u < HIT){ const f = u / HIT, y = H - 30 - (H - 30 - hy) * ease(f); trail(g, hx, y, 20, t, P); g.save(); g.translate(hx, y); g.rotate(f * 6); g.drawImage(fly, -20 * 1.7, -20 * 2.0, 20 * 3.4, 20 * 3.6); g.restore(); }
    else if (u < HIT + 1.2){ g.save(); g.translate(hx, hy); g.scale(1.2, 1.2); hit(g, (u - HIT) / 1.2, P); g.restore(); }
    requestAnimationFrame(loop);
  })(t0);
  return el;
}
const box = document.getElementById('opts'); PALETTES.forEach(P => box.appendChild(card(P)));
