// Preview page for the Fallen Twin Tides: three animated figures, baked strips per clip and twin, and a game-size row.
import { fallenTwintides, FALLEN } from '/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/fallen/twintides/fallen_twintides.js';

const C = FALLEN, box = C.box, app = document.getElementById('app');
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const FIGS = [['The Twin Tides (full form)', { variant:'form2' }, '#0a1620'], ['The Blood twin', { variant:'fallen', twin:'blood' }, '#1a0408'], ['The Blue twin', { variant:'fallen', twin:'blue' }, '#040814']];
const CLIPS = ['walk', 'bolt', 'skill', 'collapse'];
const ORDER = ['walk', 'bolt', 'skill', 'collapse'];

// draw a pose at a fitted scale into a canvas context, centred on the box; `outline` draws the box and the waterline
function drawFit(g, w, h, pose, pad = .96, outline = false){
  const s = Math.min(w * pad / box.w, h * pad / box.h);
  g.save(); g.translate(w / 2 - (box.x + box.w / 2) * s, h / 2 - (box.y + box.h / 2) * s); g.scale(s, s);
  if (outline){ g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1 / s; g.strokeRect(box.x, box.y, box.w, box.h); g.beginPath(); g.moveTo(box.x, 50); g.lineTo(box.x + box.w, 50); g.strokeStyle = 'rgba(255,200,80,.2)'; g.stroke(); }
  fallenTwintides(g, pose); g.restore();
}

// ---- (1) three large figures looping the idle clip (buttons switch the clip) ----
const state = { clip:'walk', t0:performance.now() };
const show = el('div', 'show'); app.appendChild(el('h1', null, 'The Fallen Twin Tides'));
app.appendChild(el('p', 'sub', 'Under a blood moon the sea turned red, and the Twin Tides rose from it changed. Left: the original full form. Middle: the Blood twin (siren, blood, healing aura). Right: the Blue twin (water spears, whirlpools).'));
const bigs = FIGS.map(([name, pose, bg]) => { const wrap = el('div', 'fig'); const c = el('canvas', 'big'); c.width = 640; c.height = Math.round(640 * box.h / box.w); c.style.width = '320px'; c.style.height = Math.round(320 * box.h / box.w) + 'px'; wrap.appendChild(c); wrap.appendChild(el('div', 'cap', name)); show.appendChild(wrap); return { c, pose, bg }; });
app.appendChild(show);
const bar = el('div', 'bar');
for (const cl of ORDER){ const b = el('button', null, cl === 'walk' ? 'idle (walk)' : cl); b.onclick = () => { state.clip = cl; state.t0 = performance.now(); for (const x of bar.children) x.classList.toggle('on', x === b); }; if (cl === 'walk') b.classList.add('on'); bar.appendChild(b); }
app.appendChild(bar);
function frame(now){
  const cl = C.clips[state.clip], T = (now - state.t0) / 1000;
  let t = T * cl.fps / cl.n; if (cl.once){ if (t >= 1){ t = 1; if (T > cl.n / cl.fps + .8){ state.clip = 'walk'; state.t0 = now; for (const x of bar.children) x.classList.toggle('on', x.textContent.startsWith('idle')); } } } else t %= 1;
  for (const { c, pose, bg } of bigs){ const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.scale(2, 2);
    const p = { ...cl.pose(t), ...pose }; if (state.clip === 'skill' && pose.variant !== 'fallen') delete p.skill; drawFit(g, c.width / 2, c.height / 2, p, .96, true); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---- (2) strips: every clip for each fallen twin, 8 frames each ----
const FW = 150, FH = Math.round(FW * box.h / box.w), NF = 8;
for (const [name, pose, bg] of FIGS.slice(1)){
  const sec = el('div', 'sec'); sec.appendChild(el('h2', null, name + ': clips'));
  for (const cn of CLIPS){ const cl = C.clips[cn], row = el('div', 'row'); row.appendChild(el('span', 'lbl', cn === 'walk' ? 'walk (idle)' : cn));
    const c = el('canvas'); c.width = FW * NF * 2; c.height = FH * 2; c.style.width = FW * NF + 'px'; c.style.height = FH + 'px'; const g = c.getContext('2d'); g.scale(2, 2);
    for (let i = 0; i < NF; i++){ const t = cl.once ? i / (NF - 1) : i / NF; g.save(); g.translate(i * FW, 0); g.fillStyle = i % 2 ? bg : '#0b0a10'; g.fillRect(0, 0, FW, FH); drawFit(g, FW, FH, { ...cl.pose(t), ...pose }, .98); g.restore(); }
    row.appendChild(c); sec.appendChild(row); }
  app.appendChild(sec);
}

// ---- (3) game size: the box about 85 px tall, original vs blood vs blue ----
const small = el('div', 'sec'); small.appendChild(el('h2', null, 'Game size (box about 85 px tall; the sea row in the game is darker than this)'));
const sc = el('canvas'); const SW = 110, SH = 92; sc.width = SW * 3 * 2; sc.height = SH * 2; sc.style.width = SW * 3 + 'px'; sc.style.height = SH + 'px'; const sg = sc.getContext('2d'); sg.scale(2, 2);
FIGS.forEach(([name, pose, bg], i) => { sg.save(); sg.translate(i * SW, 0); sg.fillStyle = bg; sg.fillRect(0, 0, SW, SH); drawFit(sg, SW, SH, { ...C.clips.walk.pose(.25), ...pose }, .92); sg.restore(); });
small.appendChild(sc); app.appendChild(small);
