// Preview page for the Fallen Poltergeist: the original full form beside the fallen form (idle loop), fallen clip strips, a game-size row.
import { poltergeist, W2 } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/render/chars/w2.js';
import { fallenPoltergeist, FALLEN } from '/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/fallen/poltergeist/fallen_poltergeist.js';

const ORIG = W2.poltergeist, box = FALLEN.box;   // one shared frame (the fallen box contains the original's)
const app = document.getElementById('app');
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const BG = '#06100a', BG2 = '#0a1a10';
const params = new URLSearchParams(location.search), FREEZE = params.has('t') ? +params.get('t') : null;

// draw a pose fitted into w × h, centred on the box
function drawFit(g, w, h, draw, pose, pad = .96){
  const s = Math.min(w * pad / box.w, h * pad / box.h);
  g.save(); g.translate(w / 2 - (box.x + box.w / 2) * s, h / 2 - (box.y + box.h / 2) * s); g.scale(s, s); draw(g, pose); g.restore();
}
function fogBack(g, w, h, nightmare){   // a hint of the world: pale mist for Foggy Hollow, poison fog under a green moon for its nightmare
  g.fillStyle = nightmare ? '#071a0e' : '#0e1a26'; g.fillRect(0, 0, w, h);
  let gr = g.createRadialGradient(w * .78, h * .14, 2, w * .78, h * .14, w * .32); gr.addColorStop(0, nightmare ? 'rgba(216,255,176,.85)' : 'rgba(230,240,255,.8)'); gr.addColorStop(.12, nightmare ? 'rgba(216,255,176,.5)' : 'rgba(220,235,255,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  gr = g.createLinearGradient(0, h * .55, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, nightmare ? 'rgba(58,160,96,.55)' : 'rgba(150,180,200,.45)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}

// ---- 1. side by side, idle loop ----
const top = el('div', 'sec'); top.appendChild(el('h2', null, 'The Poltergeist, full form (2-20)  →  The Fallen Poltergeist (nightmare Foggy Hollow)'));
const pair = el('div', 'row'); const bigs = [];
for (const [draw, variant, nm] of [[poltergeist, 'form2', false], [fallenPoltergeist, 'fallen', true]]){ const c = el('canvas', 'big'); c.width = 760; c.height = 760; c.style.width = '380px'; c.style.height = '380px'; pair.appendChild(c); bigs.push({ c, draw, variant, nm }); }
top.appendChild(pair); app.appendChild(top);
const t0 = performance.now();
function frame(now){
  const cl = FALLEN.clips.walk; let t = ((now - t0) / 1000 * cl.fps / cl.n) % 1; if (FREEZE != null) t = FREEZE;
  for (const b of bigs){ const g = b.c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); fogBack(g, b.c.width, b.c.height, b.nm); drawFit(g, b.c.width, b.c.height, b.draw, { idle:t, variant:b.variant }); }
  if (FREEZE == null) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---- 2. strips of every fallen clip ----
const FW = 150, FH = Math.round(FW * box.h / box.w);
const sec = el('div', 'sec'); sec.appendChild(el('h2', null, 'Fallen clips (8 frames each)'));
for (const [name, cl] of Object.entries(FALLEN.clips)){
  const n = cl.n, row = el('div', 'row'); row.appendChild(el('span', 'lbl', name));
  const c = el('canvas'); c.width = FW * n * 2; c.height = FH * 2; c.style.width = FW * n + 'px'; c.style.height = FH + 'px';
  const g = c.getContext('2d'); g.scale(2, 2);
  for (let i = 0; i < n; i++){ const t = cl.once ? i / (n - 1) : i / n; g.save(); g.translate(i * FW, 0); g.fillStyle = i % 2 ? BG2 : BG; g.fillRect(0, 0, FW, FH); drawFit(g, FW, FH, fallenPoltergeist, { ...cl.pose(t), variant:'fallen' }, .98); g.restore(); }
  row.appendChild(c); sec.appendChild(row);
}
// the original's clips through the copied function, to show form2 / plain still draw as before
for (const [label, variant] of [['form2', 'form2'], ['plain', null]]){
  const cl = FALLEN.clips.walk, row = el('div', 'row'); row.appendChild(el('span', 'lbl', 'copy ' + label));
  const c = el('canvas'); c.width = FW * 8 * 2; c.height = FH * 2; c.style.width = FW * 8 + 'px'; c.style.height = FH + 'px'; const g = c.getContext('2d'); g.scale(2, 2);
  for (let i = 0; i < 8; i++){ const t = i / 8; g.save(); g.translate(i * FW, 0); g.fillStyle = i % 2 ? BG2 : BG; g.fillRect(0, 0, FW, FH); drawFit(g, FW, FH, i < 4 ? poltergeist : fallenPoltergeist, { ...cl.pose(t), variant }, .98); g.fillStyle = '#6a8a6a'; g.font = '10px system-ui'; g.fillText(i < 4 ? 'w2.js' : 'copy', 4, 12); g.restore(); }
  row.appendChild(c); sec.appendChild(row);
}
app.appendChild(sec);

// ---- 3. game size: the boss is about 85 px tall on a phone ----
const small = el('div', 'sec'); small.appendChild(el('h2', null, 'Game size (about 85 px tall, form2 vs fallen, on the patch colours)'));
const sc = el('canvas'); sc.width = 720; sc.height = 300; sc.style.width = '360px'; sc.style.height = '150px'; const sg = sc.getContext('2d'); sg.scale(2, 2);
sg.fillStyle = '#1b2a1c'; sg.fillRect(0, 0, 180, 150); sg.fillStyle = '#0d1f14'; sg.fillRect(180, 0, 180, 150);
[[poltergeist, 'form2', 0], [fallenPoltergeist, 'fallen', 1]].forEach(([draw, v, i]) => { const s = 85 / 268 * (268 / 224); sg.save(); sg.translate(90 + i * 180, 78); sg.scale(s, s); sg.translate(0, -(box.y + box.h / 2)); draw(sg, { idle:.2, variant:v }); sg.restore(); });
small.appendChild(sc); app.appendChild(small);

// ---- bounds check: the tightest box around every fallen frame vs the declared one ----
(function bounds(){
  const c = document.createElement('canvas'), K = 2; c.width = 1000; c.height = 1000; const g = c.getContext('2d');
  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
  for (const cl of Object.values(FALLEN.clips)) for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1000, 1000); g.translate(500, 500); g.scale(K, K); fallenPoltergeist(g, { ...cl.pose(t), variant:'fallen' });
    const d = g.getImageData(0, 0, 1000, 1000).data; for (let y = 0; y < 1000; y++) for (let x = 0; x < 1000; x++) if (d[(y * 1000 + x) * 4 + 3] > 8){ if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; } }
  const b = { x:(minx - 500) / K, y:(miny - 500) / K, w:(maxx - minx) / K, h:(maxy - miny) / K };
  const p = el('p', 'note', `tight bounds of every fallen frame: x ${b.x.toFixed(0)}..${(b.x + b.w).toFixed(0)}, y ${b.y.toFixed(0)}..${(b.y + b.h).toFixed(0)}   |   declared box: x ${box.x}..${box.x + box.w}, y ${box.y}..${box.y + box.h}` + (b.x < box.x || b.y < box.y || b.x + b.w > box.x + box.w || b.y + b.h > box.y + box.h ? '   CLIPPED' : '   ok'));
  app.appendChild(p); window.__bounds = b;
})();
