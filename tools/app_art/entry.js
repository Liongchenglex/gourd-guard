// App icon and launch screen, drawn with the game's own pumpkin painter (tools/app_art.py renders these to PNG).
import { pumpkin } from '../../src/engine/render/chars/w1.js';
import { faceFor } from '../../src/engine/render/faces.js';
import { pal } from '../../src/engine/render/paint.js';

const ORANGE = pal('#f08a24');
function night(g, W, H, moon){
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#120a24'); sky.addColorStop(.62, '#3d1a3e'); sky.addColorStop(1, '#b0552f');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const [mx, my, mr] = moon;
  const halo = g.createRadialGradient(mx, my, mr * .6, mx, my, mr * 3.2); halo.addColorStop(0, 'rgba(255,190,90,.55)'); halo.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
  const mg = g.createRadialGradient(mx - mr * .3, my - mr * .3, mr * .1, mx, my, mr); mg.addColorStop(0, '#fff2c4'); mg.addColorStop(1, '#ffcf72');
  g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(230,170,80,.35)'; for (const [dx, dy, r] of [[-.3, -.1, .16], [.25, .2, .12], [.05, -.35, .09]]){ g.beginPath(); g.arc(mx + dx * mr, my + dy * mr, r * mr, 0, Math.PI * 2); g.fill(); }
  let s = 7; const R = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.fillStyle = 'rgba(255,240,210,.8)'; for (let i = 0; i < 60; i++){ const x = R() * W, y = R() * H * .55, r = R() * W * .0022 + W * .0008; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
}
function bat(g, x, y, s){
  g.fillStyle = '#140818'; g.beginPath(); g.moveTo(x, y);
  g.quadraticCurveTo(x - s * .5, y - s * .55, x - s * 1.2, y - s * .2); g.quadraticCurveTo(x - s * .85, y - s * .05, x - s * .7, y + s * .2);
  g.quadraticCurveTo(x - s * .4, y, x, y + s * .25); g.quadraticCurveTo(x + s * .4, y, x + s * .7, y + s * .2);
  g.quadraticCurveTo(x + s * .85, y - s * .05, x + s * 1.2, y - s * .2); g.quadraticCurveTo(x + s * .5, y - s * .55, x, y); g.fill();
}
export function icon(px){
  const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d');
  night(g, px, px, [px * .72, px * .28, px * .17]);
  g.fillStyle = '#1c0f16'; g.beginPath(); g.ellipse(px * .5, px * 1.02, px * .75, px * .2, 0, 0, Math.PI * 2); g.fill();   // the patch
  bat(g, px * .24, px * .2, px * .07);
  g.save(); g.translate(px * .5, px * .6); pumpkin(g, ORANGE, true, px * .3, faceFor('yellow')); g.restore();
  return c;
}
export function splash(px){
  const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d');
  g.fillStyle = '#1a0f22'; g.fillRect(0, 0, px, px);
  const mid = px / 2, glow = g.createRadialGradient(mid, mid, px * .02, mid, mid, px * .3); glow.addColorStop(0, 'rgba(255,150,60,.28)'); glow.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = glow; g.fillRect(0, 0, px, px);
  g.save(); g.translate(mid, mid - px * .03); pumpkin(g, ORANGE, true, px * .075, faceFor('yellow')); g.restore();
  g.font = `400 ${Math.round(px * .06)}px Creepster`; g.textAlign = 'center'; g.fillStyle = '#ffc14a'; g.shadowColor = 'rgba(255,140,40,.6)'; g.shadowBlur = px * .012;
  g.fillText('Gourd Guard', mid, mid + px * .12);
  return c;
}
/** The launch art centred on any rectangle (Android launch images come in many shapes). */
export function splashWH(w, h){
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = '#1a0f22'; g.fillRect(0, 0, w, h); const m = Math.min(w, h); g.drawImage(splash(m), (w - m) / 2, (h - m) / 2);
  return c;
}
/** Android's round launcher icon. */
export function round(px){
  const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d');
  g.beginPath(); g.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2); g.clip(); g.drawImage(icon(px), 0, 0);
  return c;
}
/** Google Play's feature graphic (1024 x 500): night sky, moon, the pumpkin on the left and the title on the right. */
export function feature(w, h){
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  night(g, w, h, [w * .86, h * .3, h * .16]);
  g.fillStyle = '#1c0f16'; g.beginPath(); g.ellipse(w * .26, h * 1.05, w * .34, h * .22, 0, 0, Math.PI * 2); g.fill();
  bat(g, w * .62, h * .2, h * .06); bat(g, w * .7, h * .32, h * .04);
  g.save(); g.translate(w * .25, h * .6); pumpkin(g, ORANGE, true, h * .3, faceFor('yellow')); g.restore();
  g.font = `400 ${Math.round(h * .2)}px Creepster`; g.textAlign = 'center'; g.fillStyle = '#ffc14a'; g.shadowColor = 'rgba(255,140,40,.7)'; g.shadowBlur = h * .03;
  g.fillText('Gourd Guard', w * .64, h * .62);
  return c;
}
window.ART = { icon, splash, splashWH, round, feature };
