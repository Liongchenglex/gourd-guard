// Preview page for the Fallen Gravekeeper: original full form beside the fallen form, strips of every clip, a game-size row.
import { gravekeeper } from '/Users/liongchenglex/AI_Projects/gourd-guard/src/engine/render/chars/w1.js';
import { fallenGravekeeper, FALLEN } from '/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/fallen/gravekeeper/fallen_gravekeeper.js';

const box = FALLEN.box, clips = FALLEN.clips, app = document.getElementById('app');
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const state = { clip:'walk', t0:performance.now(), freeze:null };

function drawFit(g, w, h, draw, pose, pad = .96, showBox = false){
  const s = Math.min(w * pad / box.w, h * pad / box.h);
  g.save(); g.translate(w / 2 - (box.x + box.w / 2) * s, h / 2 - (box.y + box.h / 2) * s); g.scale(s, s);
  if (showBox){ g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1 / s; g.strokeRect(box.x, box.y, box.w, box.h); g.beginPath(); g.moveTo(box.x, 66); g.lineTo(box.x + box.w, 66); g.strokeStyle = 'rgba(255,200,80,.18)'; g.stroke(); }
  draw(g, pose); g.restore();
}

// ---- side by side ----
const top = el('div', 'top');
const pair = el('div', 'pair');
const mk = (label) => { const w = el('div', 'cell'); const c = el('canvas', 'big'); c.width = 760; c.height = 760; c.style.width = '380px'; c.style.height = '380px'; w.append(c, el('div', 'cap', label)); pair.appendChild(w); return c; };
const cOrig = mk('The Gravekeeper, full form (as built)'), cFall = mk('The Fallen Gravekeeper (nightmare)');
const bar = el('div', 'bar');
for (const cl of Object.keys(clips)){ const b = el('button', null, cl); b.dataset.clip = cl; b.onclick = () => { state.clip = cl; state.t0 = performance.now(); state.freeze = null; refresh(); }; bar.appendChild(b); }
top.append(pair, bar); app.appendChild(top);
function refresh(){ for (const b of bar.querySelectorAll('button')) b.classList.toggle('on', b.dataset.clip === state.clip); }
refresh();
function paintBig(c, draw, variant, pose){ const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b0608'; g.fillRect(0, 0, c.width, c.height); drawFit(g, c.width, c.height, draw, { ...pose, variant }, .96, true); }
function frame(now){
  const cl = clips[state.clip], T = (now - state.t0) / 1000;
  let t = T * cl.fps / cl.n; if (state.freeze != null) t = state.freeze; else if (cl.once){ if (t >= 1){ t = 1; if (T > cl.n / cl.fps + .9){ state.clip = 'walk'; state.t0 = now; refresh(); } } } else t %= 1;
  const pose = cl.pose(t); paintBig(cOrig, gravekeeper, 'form2', pose); paintBig(cFall, fallenGravekeeper, 'fallen', pose);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---- strips of every clip, fallen variant ----
const strips = el('div', 'strips'); strips.appendChild(el('h2', null, 'Fallen: every clip, every frame'));
const FW = 150, FH = Math.round(FW * box.h / box.w);
for (const name of Object.keys(clips)){
  const cl = clips[name], n = cl.n, row = el('div', 'row'); row.appendChild(el('span', 'lbl', name));
  const c = el('canvas'); c.width = FW * n * 2; c.height = FH * 2; c.style.width = FW * n + 'px'; c.style.height = FH + 'px';
  const g = c.getContext('2d'); g.scale(2, 2);
  for (let i = 0; i < n; i++){ const t = cl.once ? i / (n - 1) : i / n; g.save(); g.translate(i * FW, 0); g.fillStyle = i % 2 ? '#110a0c' : '#0b0608'; g.fillRect(0, 0, FW, FH); drawFit(g, FW, FH, fallenGravekeeper, { ...cl.pose(t), variant:'fallen' }, .98); g.restore(); }
  row.appendChild(c); strips.appendChild(row);
}
app.appendChild(strips);

// ---- game size: about 85 px tall, original form2 vs fallen ----
const small = el('div', 'strips'); small.appendChild(el('h2', null, 'Game size (about 85 px tall): full form vs fallen'));
const sc = el('canvas'); sc.width = 520; sc.height = 240; sc.style.width = '260px'; sc.style.height = '120px'; const sg = sc.getContext('2d'); sg.scale(2, 2);
const gr = sg.createLinearGradient(0, 0, 0, 120); gr.addColorStop(0, '#050204'); gr.addColorStop(.6, '#2a0806'); gr.addColorStop(1, '#3a1a10'); sg.fillStyle = gr; sg.fillRect(0, 0, 260, 120);
// a figure of ~215 drawing units (eclipse top to feet) at 85 px -> scale .4
[[gravekeeper, 'form2', 0], [fallenGravekeeper, 'fallen', 1]].forEach(([draw, v, i]) => { sg.save(); sg.translate(70 + i * 120, 104); sg.scale(.4, .4); sg.translate(0, -66); draw(sg, { idle:.2, variant:v }); sg.restore(); });
small.appendChild(sc); app.appendChild(small);

window.__fg = { orig:gravekeeper, draw:fallenGravekeeper, state, refresh, set(clip, t){ state.clip = clip; state.t0 = performance.now(); state.freeze = t ?? null; refresh(); } };
