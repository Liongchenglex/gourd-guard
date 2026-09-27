// ---------- Title key art (owner, 2026-09-27): a phone-wallpaper stand-off, the pumpkin patch against the monster horde ----------
// Painted once into two canvases (the scene, and the pumpkin front line that bobs) and cached per screen height.

import { CHARS, pumpkin } from './chars.js';
import { faceFor } from './faces.js';
import { pal, rgba, ell } from './paint.js';
import { PTYPES } from '../../data/pumpkins.js';
import { W } from '../state.js';

const PX = 2;   // canvas pixels per unit
let built = null;

function horde(g, H){
  // the horde, back to front: bats in the sky, the Gravekeeper towering, then mummies, the Mossback, ghouls and imps on the march
  const put = (k, x, y, s, pose = {}) => { const C = CHARS[k]; if (!C) return; g.save(); g.translate(x, y); g.scale(s * C.scale * 1.6, s * C.scale * 1.6); C.draw(g, pose); g.restore(); };
  const top = H * .30;
  put('bat', 110, top - 40, .7, { walk:.2 }); put('bat', 430, top - 70, .8, { walk:.6 }); put('bat', 480, top + 20, .55, { walk:.9 });
  put('gravekeeper', 290, top + 60, 1.25, { cast:1 });
  put('mummy', 120, top + 120, .9, { walk:.25 }); put('firemummy', 445, top + 110, .85, { walk:.7 });
  put('brute', 380, top + 175, 1.0, { walk:.4 });
  put('ghoul', 70, top + 215, .95, { walk:.1 }); put('imp', 200, top + 205, .95, { walk:.3 }); put('ghoul', 290, top + 240, 1.05, { walk:.55 });
  put('imp', 480, top + 235, .9, { walk:.8 });
}
function front(g, H){
  // the pumpkin front line along the bottom, lit and glaring up at the horde, one in mid-flight with a trail
  const HALO = { green:'140,255,90', fire:'255,110,50', yellow:'255,214,70', ice:'140,220,255', purple:'200,120,255', pink:'255,130,200', blue:'120,160,255', black:'255,140,50', brown:'240,170,80' };
  const base = H * .665, cols = ['fire', 'green', 'yellow', 'ice', 'purple', 'green', 'pink', 'blue'];
  const P = k => pal(PTYPES.find(p => p.key === k).base);
  const glow = g.createLinearGradient(0, base - 120, 0, H); glow.addColorStop(0, 'rgba(255,150,40,0)'); glow.addColorStop(.5, 'rgba(255,150,40,.22)'); glow.addColorStop(1, 'rgba(20,8,20,.9)');
  g.fillStyle = glow; g.fillRect(0, base - 120, W, H - base + 120);
  const row = (y, R, n, off, lit) => { for (let i = 0; i < n; i++){ const x = off + i * (W - off * 2) / (n - 1); g.save(); g.translate(x, y + (i % 2) * 6); const k = cols[(i * 3 + n) % cols.length]; if (lit){ const hc = HALO[k] || '255,190,70', gl = g.createRadialGradient(0, 0, R * .4, 0, 0, R * 1.5); gl.addColorStop(0, `rgba(${hc},.55)`); gl.addColorStop(1, `rgba(${hc},0)`); g.fillStyle = gl; g.fillRect(-R * 1.6, -R * 1.6, R * 3.2, R * 3.2); } pumpkin(g, P(k), lit, R, faceFor(k)); g.restore(); } };   // plain in the patch, carved glowing faces in the bunch (owner, 2026-09-27)
  { const R = 36, n = 5, off = 56; for (let i = 0; i < n; i++){ const x = off + i * (W - off * 2) / (n - 1), k = ['green', 'green', 'fire', 'fire', 'fire'][i]; g.save(); g.translate(x, base - 10 + (i % 2) * 6); const hc = HALO[k], gl = g.createRadialGradient(0, 0, R * .4, 0, 0, R * 1.5); gl.addColorStop(0, `rgba(${hc},.55)`); gl.addColorStop(1, `rgba(${hc},0)`); g.fillStyle = gl; g.fillRect(-R * 1.6, -R * 1.6, R * 3.2, R * 3.2); pumpkin(g, P(k), true, R, faceFor(k)); g.restore(); } }
  row(base + 62, 46, 4, 72, false);
  row(base + 134, 40, 5, 50, false);
  // the throw: a lit pumpkin streaking up toward the Gravekeeper
  const fx = 300, fy = H * .56;
  for (let i = 0; i < 14; i++){ const f = i / 14; g.fillStyle = rgba('#ffb640', (1 - f) * .45); ell(g, fx - 30 * f, fy + 110 * f, 22 * (1 - f * .6), 22 * (1 - f * .6)); g.fill(); }
  g.save(); g.translate(fx, fy); g.rotate(.3); pumpkin(g, P('fire'), true, 28, faceFor('fire')); g.restore();
}
export function titleArt(H){
  if (built && built.H === H) return built;
  const mk = () => { const c = document.createElement('canvas'); c.width = W * PX; c.height = H * PX; const g = c.getContext('2d'); g.scale(PX, PX); return [c, g]; };
  const [back, bg] = mk(), [fr, fg] = mk();
  // sky: harvest moon behind the horde
  let gr = bg.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0e0718'); gr.addColorStop(.45, '#3a1636'); gr.addColorStop(.75, '#7a2f24'); gr.addColorStop(1, '#1a0c12');
  bg.fillStyle = gr; bg.fillRect(0, 0, W, H);
  const mx = W * .5, my = H * .30, mr = 150;
  gr = bg.createRadialGradient(mx, my, mr * .6, mx, my, mr * 2.2); gr.addColorStop(0, 'rgba(255,190,90,.45)'); gr.addColorStop(1, 'rgba(255,190,90,0)'); bg.fillStyle = gr; bg.fillRect(0, 0, W, H);
  gr = bg.createRadialGradient(mx - 40, my - 40, 10, mx, my, mr); gr.addColorStop(0, '#fff0c0'); gr.addColorStop(.7, '#ffc062'); gr.addColorStop(1, '#e8903a'); bg.fillStyle = gr; ell(bg, mx, my, mr, mr); bg.fill();
  bg.fillStyle = 'rgba(120,50,20,.18)'; for (const [x, y, r] of [[-50, -30, 26], [40, 30, 18], [20, -60, 12], [-20, 60, 14]]){ ell(bg, mx + x, my + y, r, r); bg.fill(); }
  // stars
  for (let i = 0; i < 70; i++){ const x = (i * 97.3) % W, y = (i * 53.7) % (H * .4); bg.fillStyle = `rgba(255,240,210,${.25 + (i % 5) * .12})`; bg.fillRect(x, y, 1.6, 1.6); }
  // graveyard silhouette and ground
  bg.fillStyle = '#1a0a18'; bg.beginPath(); bg.moveTo(0, H * .52);
  for (let x = 0; x <= W; x += 30) bg.lineTo(x, H * .52 - Math.sin(x * .02) * 12 - (x % 90 === 0 ? 26 : 0));
  bg.lineTo(W, H); bg.lineTo(0, H); bg.fill();
  bg.fillStyle = '#12070f'; for (const [x, h] of [[40, 34], [140, 26], [400, 30], [490, 38]]){ bg.beginPath(); bg.roundRect(x - 12, H * .52 - h, 24, h + 6, [12, 12, 2, 2]); bg.fill(); }
  horde(bg, H);
  // a ground mist between the horde and the patch
  gr = bg.createLinearGradient(0, H * .52, 0, H * .64); gr.addColorStop(0, 'rgba(200,160,220,0)'); gr.addColorStop(.5, 'rgba(200,160,220,.18)'); gr.addColorStop(1, 'rgba(200,160,220,0)'); bg.fillStyle = gr; bg.fillRect(0, H * .52, W, H * .12);
  front(fg, H);
  built = { H, back, front:fr };
  return built;
}
