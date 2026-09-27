// Paint pumpkin preview (archive only, not in the game): a white pumpkin spattered with the other pumpkins' colours.
import { pumpkin } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/chars/w1.js';
import { faceFor } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/faces.js';
import { pal, rgba, rng } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/paint.js';
import { monsterIcon } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/monsters.js';

const TAU = Math.PI * 2, ease = t => 1 - (1 - t) * (1 - t);
const PAINTS = ['#ff4d5a', '#ffc93a', '#3fa8ff', '#5fd36a', '#b36bff', '#ff8ad0'];
const WHITE = pal('#f4f1ea');
const RIBS = [[-.66, .36, .72], [.62, .4, .74], [-.34, .46, .8], [.3, .48, .82], [-.02, .5, .84]];
const rind = (g, R) => { g.beginPath(); for (const [ox, rw, rh] of RIBS) g.ellipse(ox * R * .95, R * .04, rw * R * 1.12, R * rh, 0, 0, TAU); };
/** A wobbly paint blob with a few satellite drops. */
function blob(g, x, y, r, col, seed, drops = 3){
  const R = rng(seed); g.fillStyle = col; g.beginPath();
  for (let i = 0; i <= 14; i++){ const a = i / 14 * TAU, rr = r * (.78 + R() * .38); i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(x - r * .3, y - r * .3, r * .28, r * .16, -.6, 0, TAU); g.fill();
  g.fillStyle = col; for (let i = 0; i < drops; i++){ const a = R() * TAU, d = r * (1.2 + R() * .7), s = r * (.12 + R() * .16); g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, s, 0, TAU); g.fill(); }
}
function drip(g, x, y0, len, w, col){ g.fillStyle = col; g.beginPath(); g.moveTo(x - w, y0); g.lineTo(x - w * .8, y0 + len - w); g.arc(x, y0 + len - w, w * .95, Math.PI, 0, true); g.lineTo(x + w, y0); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - w * .55, y0 + 2, w * .3, len * .6); }

// ---------- three looks: each paints over the white rind (clipped), under the face ----------
const LOOKS = [
  { key:'A', name:'Splatter', tag:'Playful', desc:'A clean white pumpkin that walked through the art room: round splotches of every pumpkin colour, with little flicked drops around them.',
    paint(g, R){ const spots = [[-.55, -.35, .2, 0], [.35, -.5, .16, 1], [.62, .2, .22, 2], [-.2, .45, .18, 3], [-.72, .25, .13, 4], [.12, .08, .1, 5], [.3, .55, .11, 1]];
      spots.forEach(([x, y, r, c], i) => blob(g, x * R, y * R, r * R, PAINTS[c], 11 + i * 7)); } },
  { key:'B', name:'Paint pour', tag:'Messy', desc:'Paint poured over the top and running down the ribs in thick drips of red, yellow, blue and purple, pooling at the bottom.',
    paint(g, R){ const cols = [PAINTS[0], PAINTS[1], PAINTS[2], PAINTS[4], PAINTS[3]];
      g.fillStyle = cols[0]; g.beginPath(); g.ellipse(0, -R * .78, R * .75, R * .22, 0, 0, TAU); g.fill();
      [[-.62, .55, 0], [-.38, .8, 1], [-.12, .42, 2], [.1, .95, 3], [.34, .6, 4], [.58, .72, 1]].forEach(([x, l, c]) => drip(g, x * R, -R * .82, R * l, R * .1, cols[c]));
      blob(g, -R * .25, R * .78, R * .16, PAINTS[2], 5, 1); blob(g, R * .4, R * .8, R * .12, PAINTS[1], 9, 1); } },
  { key:'C', name:'Brushstrokes', tag:'Artsy', desc:'Bold sweeping brushstrokes of colour across the white, like an artist tested their whole palette on it, with a painted star for a signature.',
    paint(g, R){ g.lineCap = 'round';
      [[-.9, -.45, .8, -.6, 0, .17], [-.85, .05, .9, -.15, 2, .15], [-.8, .5, .7, .38, 3, .14], [-.3, -.8, .5, .8, 4, .1]].forEach(([x0, y0, x1, y1, c, w]) => {
        g.strokeStyle = PAINTS[c]; g.lineWidth = R * w * 2; g.beginPath(); g.moveTo(x0 * R, y0 * R); g.quadraticCurveTo((x0 + x1) / 2 * R, (y0 + y1) / 2 * R - R * .25, x1 * R, y1 * R); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = R * w * .5; g.beginPath(); g.moveTo(x0 * R, (y0 - w * .4) * R); g.quadraticCurveTo((x0 + x1) / 2 * R, ((y0 + y1) / 2 - w * .4) * R - R * .25, x1 * R, (y1 - w * .4) * R); g.stroke(); });
      g.fillStyle = PAINTS[1]; g.beginPath(); for (let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * .07 : R * .16; g.lineTo(R * .55 + Math.cos(a) * r, R * .55 + Math.sin(a) * r); } g.closePath(); g.fill(); } },
];
const whiteFace = faceFor('white');
/** The face hook: paint first (clipped to the rind), then the lit face on top, plus a cheeky paint dab on the cheek. */
/** Keep paint off the eyes and mouth so the lit face always reads (the same rule the skins follow). */
const faceHoles = (g, R) => { g.beginPath(); g.rect(-R * 2, -R * 2, R * 4, R * 4); for (const x of [-R * .3, R * .3]) g.ellipse(x, -R * .1, R * .27, R * .29, 0, 0, TAU); g.ellipse(0, R * .3, R * .3, R * .16, 0, 0, TAU); };
const painted = L => (g, R, c, lit) => { g.save(); rind(g, R); g.clip(); if (lit){ faceHoles(g, R); g.clip('evenodd'); } L.paint(g, R); g.restore(); whiteFace(g, R, c, lit); if (lit) blob(g, R * .52, R * .22, R * .07, PAINTS[5], 3, 0); };

// ---------- trail and hit (cheap per-frame shapes) ----------
function trail(g, x, y, R, t){ const Rr = rng(4); for (let i = 0; i < 16; i++){ const f = (Rr() + t * 2.4) % 1, px = x + (Rr() - .5) * R * 1.6 * (1 - f * .5), py = y + 8 + f * 90, s = (1 - f) * (3 + Rr() * 4); g.fillStyle = rgba(PAINTS[i % PAINTS.length], 1 - f); g.beginPath(); g.ellipse(px, py, s, s * 1.3, 0, 0, TAU); g.fill(); } }
function hit(g, t){ const R = rng(21);
  const st = Math.min(1, t * 4), fade = t < .6 ? 1 : 1 - (t - .6) / .4;
  g.save(); g.globalAlpha = fade * .9; blob(g, 0, 4, 26 * st, PAINTS[Math.floor(t * 0) % 6], 17, 0); g.restore();   // the splat stain
  for (let i = 0; i < 5; i++){ const a = i / 5 * TAU + .4; g.save(); g.globalAlpha = fade; blob(g, Math.cos(a) * 30 * st, Math.sin(a) * 22 * st, 9 * st, PAINTS[(i + 1) % 6], 30 + i, 0); g.restore(); }
  for (let i = 0; i < 22; i++){ const a = R() * TAU, sp = 40 + R() * 70, x = Math.cos(a) * sp * ease(t), y = Math.sin(a) * sp * ease(t) + t * t * 60, s = (2 + R() * 4) * (1 - t * .6);
    g.fillStyle = rgba(PAINTS[i % 6], 1 - t); g.beginPath(); g.ellipse(x, y, s, s * 1.25, a, 0, TAU); g.fill(); }
}

// ---------- page ----------
const bake = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d'); g.scale(2, 2); fn(g); return c; };
const icon = (L, R, lit) => bake(R * 3.4, R * 3.4, g => { g.translate(R * 1.7, R * 1.75); pumpkin(g, WHITE, lit, R, painted(L)); });
const W = 340, H = 330;
function card(L){
  const el = document.createElement('article'); el.className = 'card';
  el.innerHTML = `<div class="tag">${L.tag}</div><h3>${L.key}. ${L.name}</h3>`;
  const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2; cv.style.width = W + 'px'; cv.style.maxWidth = '100%'; el.appendChild(cv);
  el.insertAdjacentHTML('beforeend', `<p>${L.desc}</p><div class="small"><span>In the patch</span><span>Lit in a bunch</span><span>Shop icon</span></div>`);
  const row = el.querySelector('.small'); const a = icon(L, 22, false), b = icon(L, 22, true), c = icon(L, 16, true);
  for (const [i, cvs, w] of [[0, a, 74], [1, b, 74], [2, c, 54]]){ cvs.style.width = w + 'px'; row.children[i].prepend(cvs); }
  const big = icon(L, 26, true), fly = icon(L, 20, true), ghoul = monsterIcon('ghoul', 110), g = cv.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1a1030'); sky.addColorStop(1, '#2a1a1a'); const t0 = performance.now();
  (function loop(now){
    const t = (now - t0) / 1000; g.setTransform(2, 0, 0, 2, 0, 0); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const T = 2.2, u = t % T, hx = W / 2, hy = 92, HIT = .42;
    g.drawImage(ghoul, hx - 55, hy - 62, 110, 110);
    [[W * .2, 0], [W * .8, 1.3]].forEach(([x, ph]) => { const s = 1 + Math.sin(t * 2.4 + ph) * .03; g.save(); g.translate(x, H - 48); g.scale(s, 1 / s); g.drawImage(big, -26 * 1.7, -26 * 1.75, 26 * 3.4, 26 * 3.4); g.restore(); });
    if (u < HIT){ const f = u / HIT, y = H - 30 - (H - 30 - hy) * ease(f); trail(g, hx, y, 20, t); g.save(); g.translate(hx, y); g.rotate(f * 6); g.drawImage(fly, -20 * 1.7, -20 * 1.75, 20 * 3.4, 20 * 3.4); g.restore(); }
    else if (u < HIT + 1.2){ g.save(); g.translate(hx, hy); g.scale(1.25, 1.25); hit(g, (u - HIT) / 1.2); g.restore(); }
    requestAnimationFrame(loop);
  })(t0);
  return el;
}
const box = document.getElementById('opts'); LOOKS.forEach(L => box.appendChild(card(L)));
