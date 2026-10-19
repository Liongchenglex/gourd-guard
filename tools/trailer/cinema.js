// Story intro for the trailer: hand-staged shots drawn with the game's own characters, rendered one frame at a time.
// Loaded by tools/trailer/cinema.html through the Vite dev server; tools/trailer.py calls window.renderFrame(t) per frame.
// Offline only: this paints every character every frame, which the game itself must never do (see CLAUDE.md perf rule).

import { CHARS, pumpkin } from '/src/engine/render/chars.js';
import { faceFor } from '/src/engine/render/faces.js';
import { S, pal, mix, rgba, ell } from '/src/engine/render/paint.js';
import { PTYPES } from '/src/data/pumpkins.js';

const W = 540, H = 960, K = 2, TAU = Math.PI * 2;
const cv = document.getElementById('cv'); cv.width = W * K; cv.height = H * K;
const g = cv.getContext('2d');

// Shot timings in seconds; the gameplay (and the music) starts at END.
export const SHOTS = { night:[0, 2.8], rise:[2.8, 5.8], standoff:[5.8, 11.4] };
export const END = 11.4;
export const CAPTIONS = [
  [0.3, 2.6, "It's Halloween night..."],
  [3.1, 5.6, 'The monsters are rising.'],
  [6.0, 8.3, "And they're coming\nfor the patch!"],
  [8.6, 11.0, "Don't worry.\nThe pumpkins will protect you!"],
];

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => x * x * (3 - 2 * x);
const out = x => 1 - (1 - x) * (1 - x) * (1 - x);
const back = x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const hash = i => { const s = Math.sin(i * 127.1) * 43758.5453; return s - Math.floor(s); };
const P = k => pal(PTYPES.find(p => p.key === k).base);
const HALO = { green:'140,255,90', fire:'255,110,50', yellow:'255,214,70', ice:'140,220,255', purple:'200,120,255', pink:'255,130,200' };

// ---------- characters ----------
/** A monster standing with its feet at (x, y). rise 0..1 pulls it up out of the ground (clipped at y). */
function mon(k, x, y, s, pose, rise = 1){
  const C = CHARS[k], sc = s * C.scale * 1.6, feet = (C.box.y + C.box.h) * sc * .9;
  g.save();
  if (rise < 1){ g.beginPath(); g.rect(x - 200, y - 400, 400, 400 + 4 * s); g.clip(); }
  g.translate(x, y - feet + (1 - rise) * C.box.h * sc * 1.05); g.scale(sc, sc); C.draw(g, pose); g.restore();
}
/** A pumpkin with a face that can sleep (lid 1), look around (lx, ly), gasp, or light up into its carved face. */
function pk(key, x, y, R, o = {}){
  const c = P(key);
  g.save(); g.translate(x, y); if (o.squash) g.scale(1 + o.squash, 1 - o.squash);
  if (o.lit){ const hc = HALO[key] || '255,190,70', gl = g.createRadialGradient(0, 0, R * .4, 0, 0, R * 1.7); gl.addColorStop(0, `rgba(${hc},${.6 * o.lit})`); gl.addColorStop(1, `rgba(${hc},0)`); g.fillStyle = gl; g.fillRect(-R * 1.8, -R * 1.8, R * 3.6, R * 3.6); }
  const face = (g2, R2, col, isLit) => {
    if (isLit){ faceFor(key)(g2, R2, col, true); return; }
    const s = R2 / 40, ey = -R2 * .1, ex = R2 * .33, iris = mix(col.dark, '#7a5a2a', .5);
    for (const sx of [-1, 1]) S.eye(g2, sx * ex, ey, 9 * s, (o.gasp ? 11 : 9.5) * s, { lx:o.lx ?? .2, ly:o.ly ?? .12, pr:o.gasp ? .3 : .4, iris, lid:o.lid || 0, lidCol:col.base, lidDeep:col.deep });
    if (o.gasp){ g2.fillStyle = rgba(col.deep, .9); ell(g2, 0, R2 * .32, R2 * .09, R2 * .12 * o.gasp); g2.fill(); }
    else { S.blush(g2, 0, ey + 10 * s, s); S.stroke(g2, g3 => { g3.beginPath(); g3.moveTo(-R2 * .18, R2 * .24); g3.quadraticCurveTo(0, R2 * .38, R2 * .18, R2 * .24); }, col, 2.4 * s); }
  };
  pumpkin(g, c, !!o.lit, R, face);
  g.restore();
}

// ---------- scenery ----------
function sky(top, mid, bot){ const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(.5, mid); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
function stars(t, n = 70, maxY = .45){ for (let i = 0; i < n; i++){ const a = .25 + .5 * (.5 + .5 * Math.sin(t * 2 + i * 1.7)); g.fillStyle = `rgba(255,240,210,${a})`; g.fillRect(hash(i) * W, hash(i + 99) * H * maxY, 1.8, 1.8); } }
function moon(x, y, r, a = 1){
  let gr = g.createRadialGradient(x, y, r * .6, x, y, r * 2.6); gr.addColorStop(0, `rgba(255,190,90,${.42 * a})`); gr.addColorStop(1, 'rgba(255,190,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  gr = g.createRadialGradient(x - r * .3, y - r * .3, 4, x, y, r); gr.addColorStop(0, '#fff2c8'); gr.addColorStop(.7, '#ffc062'); gr.addColorStop(1, '#e8903a'); g.fillStyle = gr; ell(g, x, y, r, r); g.fill();
  g.fillStyle = 'rgba(120,50,20,.16)'; for (const [dx, dy, rr] of [[-.35, -.2, .18], [.25, .2, .12], [.1, -.4, .08], [-.1, .4, .1]]){ ell(g, x + dx * r, y + dy * r, rr * r, rr * r); g.fill(); }
}
function hills(y, col, amp, f, ph){ g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 10) g.lineTo(x, y - Math.sin(x * f + ph) * amp - Math.sin(x * f * 2.3 + ph * 2) * amp * .4); g.lineTo(W, H); g.fill(); }
function house(x, y, s){
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#12070f';
  g.beginPath(); g.moveTo(-60, 0); g.lineTo(-60, -60); g.lineTo(0, -110); g.lineTo(60, -60); g.lineTo(60, 0); g.fill();
  g.fillRect(28, -118, 14, 40); g.fillRect(70, -70, 46, 70); g.beginPath(); g.moveTo(66, -70); g.lineTo(93, -96); g.lineTo(120, -70); g.fill();
  g.fillStyle = '#ffc24a'; g.shadowColor = '#ffa020'; g.shadowBlur = 18; g.fillRect(-14, -52, 26, 24); g.shadowBlur = 0; g.fillStyle = '#12070f'; g.fillRect(-2, -52, 2, 24); g.fillRect(-14, -41, 26, 2);
  g.restore();
}
function tree(x, y, s){
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = '#12070f'; g.lineCap = 'round';
  const br = (len, a, w, d) => { if (d > 5) return; g.lineWidth = w; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -len); g.stroke(); g.save(); g.translate(0, -len); for (const da of [-.5, .45]){ g.save(); g.rotate(da + (hash(d * 7 + len) - .5) * .4); br(len * .7, a, w * .65, d + 1); g.restore(); } g.restore(); };
  br(70, 0, 12, 0); g.restore();
}
function grave(x, y, s, kind){
  g.save(); g.translate(x, y); g.scale(s, s);
  const gr = g.createLinearGradient(-22, -60, 22, 0); gr.addColorStop(0, '#8a8698'); gr.addColorStop(1, '#4a4658'); g.fillStyle = gr; g.strokeStyle = '#231c2c'; g.lineWidth = 3;
  g.beginPath(); if (kind === 1){ g.rect(-6, -66, 12, 66); g.rect(-22, -50, 44, 12); } else g.roundRect(-22, -58, 44, 58, [22, 22, 3, 3]); g.fill(); g.stroke();
  if (kind !== 1){ g.fillStyle = 'rgba(30,20,40,.45)'; g.fillRect(-2, -46, 4, 26); g.fillRect(-10, -38, 20, 4); }
  g.fillStyle = '#3a2a1e'; ell(g, 0, 2, 30, 7); g.fill(); g.restore();
}
function mist(y, h, a, t, col = '200,170,230'){
  for (let i = 0; i < 6; i++){ const x = ((i * 130 + t * (12 + i * 3)) % (W + 300)) - 150, gr = g.createRadialGradient(x, y, 10, x, y, 160); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - 170, y - h, 340, h * 2); }
}
function soil(y){ const gr = g.createLinearGradient(0, y, 0, H); gr.addColorStop(0, '#3a2418'); gr.addColorStop(1, '#170b0a'); g.fillStyle = gr; g.fillRect(0, y, W, H - y);
  g.strokeStyle = 'rgba(90,60,40,.5)'; g.lineWidth = 2; for (let i = 0; i < 5; i++){ const yy = y + 30 + i * i * 14; g.beginPath(); g.moveTo(0, yy); g.quadraticCurveTo(W / 2, yy - 8, W, yy); g.stroke(); } }
function vignette(a = .55){ const gr = g.createRadialGradient(W / 2, H * .45, H * .25, W / 2, H * .5, H * .75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
function zoom(z, cx, cy){ g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy); }

// ---------- shots ----------
function shotNight(t){
  const u = seg(t, 0, 2.8);
  g.save(); zoom(1 + u * .07, W / 2, H * .62);
  sky('#0b0614', '#2a1236', '#4a1e24'); stars(t); moon(400, 210, 70);
  hills(560, '#1f0d1c', 18, .012, 1); house(120, 560, .9); tree(470, 575, .9);
  soil(600); mist(610, 40, .12, t);
  const rows = [[640, 26, 6, 70], [715, 36, 5, 64], [810, 50, 4, 75]], cols = ['green', 'fire', 'yellow', 'ice', 'purple', 'green', 'pink'];
  rows.forEach(([y, R, n, off], ri) => { for (let i = 0; i < n; i++){ const x = off + i * (W - off * 2) / (n - 1), k = cols[(i * 3 + ri * 2) % cols.length], br = Math.sin(t * 2.2 + i + ri) * .02;
    pk(k, x, y + (i % 2) * 6, R, { lid:.92, squash:br }); } });
  // a little "z" drifting up from the front sleepers
  g.font = '700 30px Fredoka'; g.textAlign = 'center';
  for (let i = 0; i < 3; i++){ const p = ((t * .55 + i / 3) % 1), x = 210 + p * 40 + Math.sin(p * 6) * 6; g.fillStyle = `rgba(255,240,220,${Math.sin(p * Math.PI) * .8})`; g.fillText('z', x + 40, 640 - p * 80); }
  g.restore(); vignette();
}

const RISERS = [ // key, x, ground y, scale, rise start
  ['ghoul', 140, 700, 1.35, 3.15], ['ghoul', 400, 720, 1.45, 3.6], ['imp', 270, 610, 1.0, 4.0], ['mummy', 450, 590, .95, 4.3], ['ghoul', 90, 590, .95, 4.5], ['brute', 280, 820, 1.6, 4.7],
];
function shotRise(t){
  const u = seg(t, 2.8, 5.8);
  g.save(); zoom(1 + u * .06, W / 2, H * .6);
  sky('#090512', '#1e1030', '#2c1a2a'); stars(t, 50, .35); moon(110, 170, 52, .8);
  hills(470, '#170a18', 14, .015, 3); tree(80, 520, 1.1);
  { const gy = 500; g.save(); g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 10) g.lineTo(x, gy - Math.sin(x * .01 + 1) * 10); g.lineTo(W, H); g.clip();
    const gr = g.createLinearGradient(0, gy - 20, 0, H); gr.addColorStop(0, '#1e1424'); gr.addColorStop(1, '#0a060d'); g.fillStyle = gr; g.fillRect(0, gy - 30, W, H); g.restore(); }
  mist(530, 60, .05, t, '150,200,170');
  // graves behind each riser, then the risers climbing out, back to front
  const order = [...RISERS].sort((a, b) => a[2] - b[2]);
  for (const [k, x, y, s, t0] of order){
    grave(x + 52 * s, y - 4, s * .9, (x | 0) % 2);
    const r = out(seg(t, t0, t0 + .9));
    if (r > 0){ mon(k, x, y, s, { walk:(t * .9 + x * .01) % 1 }, r);
      for (let i = 0; i < 8; i++){ const p = seg(t, t0 + i * .03, t0 + .6 + i * .03); if (p > 0 && p < 1){ g.fillStyle = `rgba(90,60,40,${1 - p})`; ell(g, x + (hash(i + x) - .5) * 90 * p, y - Math.sin(p * Math.PI) * 50 * hash(i * 3 + x), 4, 4); g.fill(); } } }
  }
  // bats crossing the moon
  for (let i = 0; i < 3; i++){ const p = seg(t, 3.0 + i * .5, 5.4 + i * .3); if (p > 0 && p < 1) mon('bat', -60 + p * (W + 120), 150 + i * 40 - Math.sin(p * 6) * 20, .45, { walk:(t * 2.3 + i * .3) % 1 }); }
  mist(700, 60, .12, t, '150,200,170');
  g.restore(); vignette(.6);
}

const HORDE = [ // key, x, y (feet), scale, walk phase offset
  ['bat', 110, 210, .55, 0], ['bat', 440, 170, .6, .4], ['gravekeeper', 280, 400, 1.0, 0], ['mummy', 110, 420, .8, .2], ['firemummy', 450, 410, .78, .6],
  ['brute', 360, 470, .95, .3], ['ghoul', 60, 480, .9, .1], ['imp', 200, 470, .85, .5], ['ghoul', 290, 505, 1.0, .7], ['imp', 485, 495, .85, .9],
];
const TRIO = [['green', 120, 780], ['fire', 270, 800], ['ice', 420, 780]];
function shotStandoff(t){
  const u = seg(t, 5.8, 11.4), lt = t - 5.8;
  const push = ease(seg(t, 8.4, 11.2));
  g.save(); zoom(1 + push * .1, W / 2, H * .78);
  sky('#0e0718', '#3a1636', '#7a2f24'); stars(t, 60, .3); moon(270, 250, 120);
  hills(520, '#1a0a18', 12, .02, 0);
  // the horde edges forward the whole shot (slower once the pumpkins light up)
  const adv = ease(u) * .6 + u * .4;
  const hs = [...HORDE].sort((a, b) => a[2] - b[2]);
  for (const [k, x, y, s, ph] of hs){
    const yy = y + adv * 55 * (k === 'bat' ? .3 : 1), ss = s * (1 + adv * .14), xx = W / 2 + (x - W / 2) * (1 + adv * .1);
    mon(k, xx, yy, ss, k === 'gravekeeper' ? { idle:(t * .6) % 1 } : { walk:(t * (k === 'bat' ? 2.2 : .8) + ph) % 1 });
  }
  mist(560, 50, .18, t);
  soil(620);
  const gl = g.createLinearGradient(0, 600, 0, H); gl.addColorStop(0, 'rgba(255,150,40,0)'); gl.addColorStop(.6, `rgba(255,150,40,${.08 + .22 * seg(t, 8.8, 10.2)})`); gl.addColorStop(1, 'rgba(20,8,20,.6)'); g.fillStyle = gl; g.fillRect(0, 600, W, H - 600);
  // the trio: asleep, wake with a start, stare up at the horde, then light up one by one; the middle one launches
  const wake = seg(lt, .35, .5), awake = wake > 0;
  TRIO.forEach(([k, x, y], i) => {
    const litAt = 8.9 + i * .42, lit = t >= litAt, flash = seg(t, litAt - .08, litAt + .35);
    const jump = awake && !lit ? Math.max(0, Math.sin(seg(lt, .35, .7) * Math.PI)) * 18 : 0;
    const shake = awake && !lit && lt < 3 ? Math.sin(t * 70 + i) * 1.4 : 0;
    let px = x + shake, py = y - jump, R = 62;
    if (k === 'fire' && t > 10.55){ const f = seg(t, 10.55, 11.2); py = y - out(f) * 900; R = 62 * (1 - f * .45);
      for (let j = 0; j < 14; j++){ const q = j / 14; g.fillStyle = rgba('#ffb640', (1 - q) * .5 * (1 - f * .3)); ell(g, px, py + 40 + q * 160 * Math.min(1, f * 3), R * .5 * (1 - q * .6), R * .5 * (1 - q * .6)); g.fill(); } }
    const look = { lx:(270 - x) / 600 + Math.sin(lt * 1.3 + i) * .08, ly:-.42 };
    const squash = lit ? -.08 * Math.sin(seg(t, litAt, litAt + .3) * Math.PI) : 0;
    pk(k, px, py, R, lit ? { lit:1, squash } : awake ? { ...look, lid:1 - wake, gasp:1 } : { lid:.92, squash:Math.sin(t * 2.2 + i) * .02 });
    if (flash > 0 && flash < 1){ const fr = g.createRadialGradient(px, py, 5, px, py, 140 * flash); fr.addColorStop(0, `rgba(255,240,200,${(1 - flash) * .9})`); fr.addColorStop(1, 'rgba(255,160,60,0)'); g.fillStyle = fr; ell(g, px, py, 160 * flash, 160 * flash); g.fill(); }
    // a startled "!" when they wake
    const ex = seg(lt, .4, 1.6); if (ex > 0 && ex < 1){ g.save(); g.translate(px + 34, py - 84); g.scale(back(clamp(ex * 4)), back(clamp(ex * 4))); g.globalAlpha = 1 - seg(ex, .7, 1); g.font = '700 46px Fredoka'; g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = '#2a0d05'; g.strokeText('!', 0, 0); g.fillStyle = '#ffd34a'; g.fillText('!', 0, 0); g.restore(); }
  });
  g.restore(); vignette(.5);
  const wf = seg(t, 11.1, 11.4); if (wf > 0){ g.fillStyle = `rgba(255,236,200,${wf})`; g.fillRect(0, 0, W, H); }
}

function caption(t){
  for (const [a, b, text] of CAPTIONS){
    if (t < a || t > b) continue;
    const fi = seg(t, a, a + .35), fo = 1 - seg(t, b - .3, b), al = Math.min(fi, fo), lines = text.split('\n');
    g.save(); g.globalAlpha = al; g.textAlign = 'center'; g.font = '700 33px Fredoka'; g.lineJoin = 'round';
    const y0 = 900 - (lines.length - 1) * 42 + (1 - out(fi)) * 14;
    const bg = g.createLinearGradient(0, y0 - 80, 0, H); bg.addColorStop(0, 'rgba(10,4,14,0)'); bg.addColorStop(.5, 'rgba(10,4,14,.55)'); bg.addColorStop(1, 'rgba(10,4,14,.75)'); g.fillStyle = bg; g.fillRect(0, y0 - 80, W, H);
    lines.forEach((ln, i) => { const y = y0 + i * 42; g.lineWidth = 7; g.strokeStyle = '#2a0d05'; g.strokeText(ln, W / 2, y); g.fillStyle = '#fff1dc'; g.fillText(ln, W / 2, y); });
    g.restore();
  }
}

function black(t, a, b){ const d = .22; let x = 0; if (t < a + d) x = 1 - seg(t, a, a + d); if (t > b - d) x = Math.max(x, seg(t, b - d, b)); return x; }

window.renderFrame = t => {
  g.setTransform(K, 0, 0, K, 0, 0); g.clearRect(0, 0, W, H);
  let sh;
  if (t < SHOTS.night[1]){ shotNight(t); sh = SHOTS.night; }
  else if (t < SHOTS.rise[1]){ shotRise(t); sh = SHOTS.rise; }
  else { shotStandoff(t); sh = SHOTS.standoff; }
  const b = sh === SHOTS.standoff ? (t < sh[0] + .22 ? 1 - seg(t, sh[0], sh[0] + .22) : 0) : black(t, sh[0], sh[1]);
  if (b > 0){ g.fillStyle = `rgba(0,0,0,${b})`; g.fillRect(0, 0, W, H); }
  caption(t);
  return true;
};
window.END = END;
window.ready = (async () => { const f = new FontFace('Fredoka', 'url(/src/fonts/fredoka-latin.woff2)', { weight:'300 700' }); document.fonts.add(await f.load()); return true; })();

/** A gameplay caption as a transparent full-frame PNG, laid over the recorded nights by tools/trailer.py: a dark band over the top bar, the same lettering as the intro. */
window.captionPNG = text => {
  const c = document.createElement('canvas'); c.width = W * K; c.height = H * K;
  const x = c.getContext('2d'), lines = text.split('\n'); x.scale(K, K);
  const band = x.createLinearGradient(0, 0, 0, 190 + lines.length * 20); band.addColorStop(0, 'rgba(10,4,14,.92)'); band.addColorStop(.55, 'rgba(10,4,14,.75)'); band.addColorStop(1, 'rgba(10,4,14,0)');
  x.fillStyle = band; x.fillRect(0, 0, W, 190 + lines.length * 20);
  x.textAlign = 'center'; x.font = '700 36px Fredoka'; x.lineJoin = 'round';
  lines.forEach((ln, i) => { const y = 82 + i * 44; x.lineWidth = 8; x.strokeStyle = '#2a0d05'; x.strokeText(ln, W / 2, y); x.fillStyle = '#ffd9a0'; x.fillText(ln, W / 2, y); });
  return c.toDataURL('image/png');
};
