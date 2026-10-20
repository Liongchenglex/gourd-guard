// Preview page for the Hollow King: an animated showcase plus baked strips per clip and variant.
import { hollowking, HOLLOWKING } from '/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/hollowking/hollowking.js';

const C = HOLLOWKING.hollowking, box = C.box;
const app = document.getElementById('app');
const state = { variant:null, stage:undefined, clip:'idle', t0:performance.now(), freeze:null };

const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

// ---- showcase ----
const show = el('div', 'show');
const big = el('canvas', 'big'); big.width = 840; big.height = 840; big.style.width = '420px'; big.style.height = '420px'; show.appendChild(big);
const bar1 = el('div', 'bar'), bar2 = el('div', 'bar'), bar3 = el('div', 'bar');
const btn = (label, on, group) => { const b = el('button', group, label); b.onclick = () => { on(); refresh(); }; b.dataset.group = group; b.dataset.label = label; return b; };
for (const [l, v] of [['Form 1', null], ['Full form', 'form2'], ['Fallen', 'fallen']]) bar1.appendChild(btn(l, () => { state.variant = v; }, 'variant'));
for (const [l, v] of [['Ember', undefined], ['0 green', 0], ['1 blue', 1], ['2 crimson', 2], ['3 teal', 3], ['4 violet', 4]]) bar2.appendChild(btn(l, () => { state.stage = v; }, 'stage'));
for (const cl of ['idle', 'cast', 'summon', 'hurt', 'die']) bar3.appendChild(btn(cl, () => { state.clip = cl; state.t0 = performance.now(); }, 'clip'));
show.append(bar1, bar2, bar3);
app.appendChild(show);
function refresh(){ for (const b of app.querySelectorAll('button')){ const g = b.dataset.group, l = b.dataset.label; const cur = g === 'variant' ? ({ 'Form 1':null, 'Full form':'form2', Fallen:'fallen' })[l] === state.variant : g === 'stage' ? (l === 'Ember' ? state.stage === undefined : state.stage === +l[0]) : l === state.clip; b.classList.toggle('on', cur); } }
refresh();

// draw a pose at a fitted scale into a canvas context, centred on the box
function drawFit(g, w, h, pose, pad = .96){
  const s = Math.min(w * pad / box.w, h * pad / box.h);
  g.save(); g.translate(w / 2 - (box.x + box.w / 2) * s, h / 2 - (box.y + box.h / 2) * s); g.scale(s, s);
  hollowking(g, pose); g.restore();
}
function frame(now){
  const cl = C.clips[state.clip], T = (now - state.t0) / 1000;
  let t = T * cl.fps / cl.n; if (state.freeze != null) t = state.freeze; else if (cl.once){ if (t >= 1){ t = 1; if (T > cl.n / cl.fps + .8){ state.clip = 'idle'; state.t0 = now; refresh(); } } } else t %= 1;
  const g = big.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, big.width, big.height);
  g.fillStyle = '#0d0a14'; g.fillRect(0, 0, big.width, big.height);
  // box outline so clipping is visible
  const s = Math.min(big.width * .96 / box.w, big.height * .96 / box.h); g.save(); g.translate(big.width / 2 - (box.x + box.w / 2) * s, big.height / 2 - (box.y + box.h / 2) * s); g.scale(s, s); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1 / s; g.strokeRect(box.x, box.y, box.w, box.h); g.beginPath(); g.moveTo(box.x, 50); g.lineTo(box.x + box.w, 50); g.strokeStyle = 'rgba(255,200,80,.18)'; g.stroke(); g.restore();
  drawFit(g, big.width, big.height, { ...cl.pose(t), variant:state.variant, stage:state.stage });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---- strips ----
const strips = el('div', 'strips');
app.appendChild(strips);
const FW = 150, FH = Math.round(FW * box.h / box.w);
for (const [label, variant] of [['Form 1', null], ['Full form', 'form2'], ['Fallen', 'fallen']]){
  const sec = el('div', 'sec'); sec.appendChild(el('h2', null, label));
  for (const name of ['idle', 'cast', 'summon', 'hurt', 'die']){
    const cl = C.clips[name], n = cl.n, row = el('div', 'row'); row.appendChild(el('span', 'lbl', name));
    const c = el('canvas'); c.width = FW * n * 2; c.height = FH * 2; c.style.width = FW * n + 'px'; c.style.height = FH + 'px';
    const g = c.getContext('2d'); g.scale(2, 2);
    for (let i = 0; i < n; i++){ const t = cl.once ? i / (n - 1) : i / n; g.save(); g.translate(i * FW, 0); g.fillStyle = i % 2 ? '#120e1c' : '#0d0a14'; g.fillRect(0, 0, FW, FH); drawFit(g, FW, FH, { ...cl.pose(t), variant, stage:variant === 'form2' ? 4 : undefined }, .98); g.restore(); }
    row.appendChild(c); sec.appendChild(row);
  }
  strips.appendChild(sec);
}
// game-size check: the idle frame at about 85 px tall for each variant
const small = el('div', 'sec'); small.appendChild(el('h2', null, 'Game size (about 85 px tall)'));
const sc = el('canvas'); sc.width = 600; sc.height = 240; sc.style.width = '300px'; sc.style.height = '120px'; const sg = sc.getContext('2d'); sg.scale(2, 2); sg.fillStyle = '#1a1424'; sg.fillRect(0, 0, 300, 120);
[[null, 0], ['form2', 1], ['fallen', 2]].forEach(([v, i]) => { sg.save(); sg.translate(50 + i * 100, 60); const s = .28; sg.scale(s, s); sg.translate(0, -(box.y + box.h / 2)); hollowking(sg, { idle:.2, variant:v, stage:i === 1 ? 2 : undefined }); sg.restore(); });
small.appendChild(sc); strips.appendChild(small);

window.__hk = { state, refresh, set(v, st, clip){ state.variant = v; state.stage = st; if (clip){ state.clip = clip; state.t0 = performance.now(); } refresh(); }, still(v, st, clip, t){ const cl = C.clips[clip || 'idle']; const g = big.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0d0a14'; g.fillRect(0, 0, big.width, big.height); drawFit(g, big.width, big.height, { ...cl.pose(t ?? .2), variant:v, stage:st }); } };
