// Preview page for the Fallen Hexwitch: the full form beside the fallen form (idle, animated), strips of every clip for the fallen
// variant, and a game-size row. Bundled by build.sh into preview.html.
import { fallenHexwitch, FALLEN } from '/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/fallen/hexwitch/fallen_hexwitch.js';

const box = FALLEN.box, CLIPS = FALLEN.clips;
const app = document.getElementById('app');
const state = { clip:'walk', t0:performance.now(), freeze:null };
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

// draw a pose at a fitted scale into a canvas context, centred on the box
function drawFit(g, w, h, pose, pad = .96){
  const s = Math.min(w * pad / box.w, h * pad / box.h);
  g.save(); g.translate(w / 2 - (box.x + box.w / 2) * s, h / 2 - (box.y + box.h / 2) * s); g.scale(s, s);
  fallenHexwitch(g, pose); g.restore();
}
function boxLines(g, w, h, pad = .96){
  const s = Math.min(w * pad / box.w, h * pad / box.h); g.save(); g.translate(w / 2 - (box.x + box.w / 2) * s, h / 2 - (box.y + box.h / 2) * s); g.scale(s, s);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1 / s; g.strokeRect(box.x, box.y, box.w, box.h); g.beginPath(); g.moveTo(box.x, 50); g.lineTo(box.x + box.w, 50); g.strokeStyle = 'rgba(255,80,80,.18)'; g.stroke(); g.restore();
}

// ---- (1) side by side, large, looping ----
const show = el('div', 'show');
const pair = el('div', 'pair');
const bigs = [['The Hexwitch (full form)', 'form2'], ['The Fallen Hexwitch', 'fallen']].map(([label, variant]) => {
  const col = el('div', 'col'); const c = el('canvas', 'big'); c.width = 760; c.height = 760; c.style.width = '380px'; c.style.height = '380px'; col.append(c, el('div', 'cap', label)); pair.appendChild(col); return { c, variant };
});
show.appendChild(pair);
const bar = el('div', 'bar');
for (const cl of Object.keys(CLIPS)){ const b = el('button', null, cl); b.dataset.clip = cl; b.onclick = () => { state.clip = cl; state.t0 = performance.now(); state.freeze = null; refresh(); }; bar.appendChild(b); }
show.appendChild(bar); app.appendChild(show);
function refresh(){ for (const b of bar.querySelectorAll('button')) b.classList.toggle('on', b.dataset.clip === state.clip); }
refresh();
function frame(now){
  const cl = CLIPS[state.clip], T = (now - state.t0) / 1000;
  let t = T * cl.fps / cl.n; if (state.freeze != null) t = state.freeze; else if (cl.once){ if (t >= 1){ t = 1; if (T > cl.n / cl.fps + .8){ state.clip = 'walk'; state.t0 = now; refresh(); } } } else t %= 1;
  for (const { c, variant } of bigs){ const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, c.width, c.height); boxLines(g, c.width, c.height); drawFit(g, c.width, c.height, { ...cl.pose(t), variant }); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---- (2) strips of every clip, fallen variant (plus the full form's idle for reference) ----
const strips = el('div', 'strips'); app.appendChild(strips);
const FW = 150, FH = Math.round(FW * box.h / box.w);
function strip(name, variant){
  const cl = CLIPS[name], n = cl.n, row = el('div', 'row'); row.appendChild(el('span', 'lbl', name));
  const c = el('canvas'); c.width = FW * n * 2; c.height = FH * 2; c.style.width = FW * n + 'px'; c.style.height = FH + 'px';
  const g = c.getContext('2d'); g.scale(2, 2);
  for (let i = 0; i < n; i++){ const t = cl.once ? i / (n - 1) : i / n; g.save(); g.translate(i * FW, 0); g.fillStyle = i % 2 ? '#121214' : '#0c0c0e'; g.fillRect(0, 0, FW, FH); drawFit(g, FW, FH, { ...cl.pose(t), variant }, .98); g.restore(); }
  row.appendChild(c); return row;
}
const secF = el('div', 'sec'); secF.appendChild(el('h2', null, 'Fallen: every clip'));
for (const name of Object.keys(CLIPS)) secF.appendChild(strip(name, 'fallen'));
strips.appendChild(secF);
const sec2 = el('div', 'sec'); sec2.appendChild(el('h2', null, 'Full form (form2), for reference')); sec2.appendChild(strip('walk', 'form2')); sec2.appendChild(strip('hex', 'form2')); strips.appendChild(sec2);

// ---- (3) game size: about 85 px tall ----
const small = el('div', 'sec'); small.appendChild(el('h2', null, 'Game size (about 85 px tall): form2, fallen, fallen at the hex peak'));
const sc = el('canvas'); sc.width = 720; sc.height = 240; sc.style.width = '360px'; sc.style.height = '120px'; const sg = sc.getContext('2d'); sg.scale(2, 2); sg.fillStyle = '#2a2a2e'; sg.fillRect(0, 0, 360, 120);
[['form2', { idle:.2 }], ['fallen', { idle:.2 }], ['fallen', { hex:.5 }]].forEach(([v, pose], i) => { sg.save(); sg.translate(60 + i * 120, 60); const s = 85 / box.h; sg.scale(s, s); sg.translate(0, -(box.y + box.h / 2)); fallenHexwitch(sg, { ...pose, variant:v }); sg.restore(); });
small.appendChild(sc); strips.appendChild(small);

window.__fx = { state, refresh, set(clip, t){ state.clip = clip; state.t0 = performance.now(); state.freeze = t ?? null; refresh(); } };
