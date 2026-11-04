// ---------- The Hayrick's pitchfork stuck in a pinned pumpkin (Release 4) ----------
// Painted once per canvas scale (Toy Plastic, the same fork the Hayrick throws in render/chars/nm1.js) and blitted: per frame a pinned
// pumpkin costs one drawImage (perf rule: never paint or shadowBlur per frame). Only called from code gated on `__RELEASE__ >= 4`.

import { E, RR, S, SO, pal } from './paint.js';
import { CS } from '../state.js';
import { K } from './canvas.js';

const W = 90, H = 120, OX = 40, OY = 84;   // the sprite in world units; (OX, OY) is the pumpkin's centre
const DROP = 0.22, FADE = 0.45;            // seconds: the fork drops in, and it works loose before the pin ends
let sp = null, spK = 0;

function bakeFork(k){
  const HANDLE = pal('#7a5434'), FORK = pal('#9aa0ac');
  const c = document.createElement('canvas'); c.width = Math.ceil(W * k); c.height = Math.ceil(H * k);
  const g = c.getContext('2d'); g.scale(k, k); g.translate(OX, OY);
  // a soft dent where the tines bite
  g.fillStyle = 'rgba(30,14,6,.35)'; g.beginPath(); g.ellipse(-1, 8, 13, 5, -0.3, 0, Math.PI * 2); g.fill();
  g.save(); g.translate(15, -30); g.rotate(1.97);   // grip up and to the right, tines down into the pumpkin
  S.tube(g, SO([[-30, 0], [12, 0]]), HANDLE, 4);
  S.part(g, RR(10, -3, 7, 6, 1.5), FORK, { x:13, y:0, r:5 }, { flat:true, mat:'metal', lw:1 });
  S.tube(g, SO([[19, -8], [16.5, 0], [19, 8]]), FORK, 2.8);
  for (const o of [-8, 0, 8]){ S.tube(g, SO([[19, o], [19 + 12, o * 1.05], [19 + 20, o * 1.1]]), FORK, 2.3); S.dot(g, E(19 + 20, o * 1.1, 2.4, 2.8), '#2a1608', .9); }
  g.restore();
  return { c, k };
}

/** The fork over a pinned pumpkin at (x, y): `left` seconds of the pin remain of `max`. */
export function drawPin(ctx, x, y, left, max){
  const k = Math.min(2.5, Math.max(0.5, K || 1));
  if (!sp || spK !== k){ sp = bakeFork(k); spK = k; }
  const el = max - left, d = Math.min(1, el / DROP), fade = Math.min(1, left / FADE), s = CS / 74;
  ctx.save();
  ctx.globalAlpha *= Math.min(d * 1.6, 1) * fade;
  ctx.translate(x, y - (1 - d) * (1 - d) * 40 * s + (left < FADE ? Math.sin(left * 60) * 1.5 : 0));
  ctx.drawImage(sp.c, -OX * s, -OY * s, W * s, H * s);
  ctx.restore();
}
