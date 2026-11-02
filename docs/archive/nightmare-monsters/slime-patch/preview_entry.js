// Preview page for the nightmare Pumpkin Patch monsters: a lineup at rest, each monster large and animated
// with its clip buttons, every clip as strips, and a game-size row beside a World 1 ghoul.
import { W1 } from '../../../../src/engine/render/chars/w1.js';
import { PATCH } from './slime_patch.js';

const GHOUL = W1.ghoul;
const LIST = [
  { key:'bloodslime', name:'Blood Splitter Slime', idea:'Every hit that does not kill it pinches off a Bloodlet (1 HP) into a neighbouring lane; on death it bursts into two more.' },
  { key:'bloodlet', name:'Bloodlet (split-off)', idea:'1 HP, quick; the small slime the Blood Splitter sheds.' },
  { key:'hayrick', name:'The Hayrick', idea:'Tank. Once per night it pulls the pitchfork out of its shoulder and throws it down its column, pinning the first pumpkin there (cannot be slid) for 4 s.' },
  { key:'hayrick', variant:'burning', name:'Burning Hayrick', idea:'The barn fire caught it. Its red-hot pitchfork sets the pumpkin it pins on fire (it burns away after 4 s unless an Ice pumpkin is flicked through that column), and it leaves a burning patch on each cell it walks through for 3 s.' },
  { key:'rooster', name:'Cinder Rooster', idea:'Every 8 s it crows: monsters in its lane and the two beside it get a 2 s speed burst. Frozen roosters cannot crow.' },
  { key:'husker', name:'Corn Husker', idea:'Husk cloak: its first hit only strips the husk (shed clip); the bare cob then walks 30% faster.' },
  { key:'husker', variant:'bare', name:'Corn Husker, bare (after the shed)', idea:'Draws with pose.variant = "bare" after the shed.' },
  { key:'husker', variant:'burning', name:'Burning Corn Husker', idea:'Its first hit strips the burning husk, which lands as burning patches in the two neighbouring lanes for 3 s. The charred cob then walks 30% faster and pops: each later hit fires a popcorn kernel that knocks back the pumpkin flicked at it.' },
  { key:'husker', variant:'burnt', name:'Burning Corn Husker, charred cob (after the shed)', idea:'Draws with pose.variant = "burnt" after the shed.' },
];

const app = document.getElementById('app');
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
function drawFit(g, w, h, ent, pose, pad = .96, clip = false){
  const box = ent.box, s = Math.min(w * pad / box.w, h * pad / box.h);
  g.save(); g.translate(w / 2 - (box.x + box.w / 2) * s, h / 2 - (box.y + box.h / 2) * s); g.scale(s, s);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1 / s; g.strokeRect(box.x, box.y, box.w, box.h);
  if (clip){ g.beginPath(); g.rect(box.x, box.y, box.w, box.h); g.clip(); }
  ent.draw(g, pose); g.restore();
}
function nightBg(g, w, h){ const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#050204'); gr.addColorStop(.6, '#2a0806'); gr.addColorStop(1, '#3a1a10'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }

// ---- lineup at rest (idle.png): every monster at its in-game size x3, feet on one line, a ghoul for scale ----
const lu = el('canvas'); lu.id = 'lineup'; const LW = 1420, LH = 330; lu.width = LW * 2; lu.height = LH * 2; lu.style.width = LW + 'px'; lu.style.height = LH + 'px';
{ const g = lu.getContext('2d'); g.scale(2, 2); nightBg(g, LW, LH);
  const ground = LH - 26, Z = 3, row = [[GHOUL, {}, 'Ghoul (W1)'], [PATCH.bloodslime, {}, 'Blood Splitter'], [PATCH.bloodlet, {}, 'Bloodlet'], [PATCH.hayrick, {}, 'Hayrick'], [PATCH.rooster, {}, 'Cinder Rooster'], [PATCH.husker, {}, 'Corn Husker'], [PATCH.husker, { variant:'bare' }, 'bare'], [PATCH.hayrick, { variant:'burning' }, 'Burning Hayrick'], [PATCH.husker, { variant:'burning' }, 'Burning Husker'], [PATCH.husker, { variant:'burnt' }, 'charred']];
  const xs = [70, 205, 320, 450, 605, 745, 875, 1035, 1200, 1345];
  row.forEach(([e, pose, label], i) => { g.save(); g.translate(xs[i], ground - 50 * e.scale * Z); g.scale(e.scale * Z, e.scale * Z); e.draw(g, { walk:0, ...pose }); g.restore();
    g.fillStyle = '#c8a888'; g.font = '13px system-ui'; g.textAlign = 'center'; g.fillText(label, xs[i], LH - 8); });
}
app.appendChild(el('h1', null, 'Nightmare Pumpkin Patch: Blood Splitter Slime, Hayrick, Cinder Rooster, Corn Husker (plus burning Hayrick and Husker)'));
app.appendChild(el('p', 'cap', 'Archive only (2026-11-02). Lineup at 3x in-game size, feet aligned, with a World 1 ghoul for scale.'));
app.appendChild(lu);

// ---- one card per monster: big animated view + clip buttons + strips ----
const cards = [];
for (const m of LIST){
  const ent = PATCH[m.key], card = el('section', 'card');
  card.appendChild(el('h2', null, m.name)); card.appendChild(el('p', 'cap', m.idea));
  const c = el('canvas', 'big'); c.width = 640; c.height = 640; c.style.width = '320px'; c.style.height = '320px';
  const bar = el('div', 'bar'), st = { clip:'walk', t0:performance.now() };
  for (const cl of Object.keys(ent.clips)){ const b = el('button', null, cl); b.dataset.clip = cl; b.onclick = () => { st.clip = cl; st.t0 = performance.now(); sync(); }; bar.appendChild(b); }
  const sync = () => { for (const b of bar.querySelectorAll('button')) b.classList.toggle('on', b.dataset.clip === st.clip); }; sync();
  const top = el('div', 'pair'); const left = el('div', 'cell'); left.append(c, bar); top.appendChild(left);
  const strips = el('div', 'strips');
  const FW = 120, FH = Math.round(FW * ent.box.h / ent.box.w);
  for (const name of Object.keys(ent.clips)){
    const cl = ent.clips[name], n = cl.n, row = el('div', 'row'); row.appendChild(el('span', 'lbl', name));
    const sc = el('canvas'); sc.width = FW * n * 2; sc.height = FH * 2; sc.style.width = FW * n + 'px'; sc.style.height = FH + 'px';
    const g = sc.getContext('2d'); g.scale(2, 2);
    for (let i = 0; i < n; i++){ const t = cl.once ? i / (n - 1) : i / n; g.save(); g.translate(i * FW, 0); g.fillStyle = i % 2 ? '#140a0a' : '#0b0608'; g.fillRect(0, 0, FW, FH); drawFit(g, FW, FH, ent, { ...cl.pose(t), variant:m.variant }, .98, true); g.restore(); }
    row.appendChild(sc); strips.appendChild(row);
  }
  top.appendChild(strips); card.appendChild(top); app.appendChild(card);
  cards.push({ ent, c, st, sync, variant:m.variant });
}
function frame(now){
  for (const k of cards){ const cl = k.ent.clips[k.st.clip], T = (now - k.st.t0) / 1000; let t = T * cl.fps / cl.n;
    if (cl.once){ if (t >= 1){ t = 1; if (T > cl.n / cl.fps + .8){ k.st.clip = 'walk'; k.st.t0 = now; k.sync(); } } } else t %= 1;
    const g = k.c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b0608'; g.fillRect(0, 0, k.c.width, k.c.height);
    drawFit(g, k.c.width, k.c.height, k.ent, { ...cl.pose(t), variant:k.variant }, .94); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---- game size: each at its registry scale (about 60-75 px tall), feet on the wall line, beside a ghoul ----
const gs = el('section', 'card'); gs.appendChild(el('h2', null, 'Game size (registry scale, 1x), walking, beside a World 1 ghoul'));
const gc = el('canvas'); gc.id = 'gamesize'; const GW = 760, GH = 120; gc.width = GW * 2; gc.height = GH * 2; gc.style.width = GW + 'px'; gc.style.height = GH + 'px';
{ const g = gc.getContext('2d'); g.scale(2, 2); nightBg(g, GW, GH); const ground = GH - 14;
  [[GHOUL, {}], [PATCH.bloodslime, {}], [PATCH.bloodlet, {}], [PATCH.hayrick, {}], [PATCH.rooster, {}], [PATCH.husker, {}], [PATCH.husker, { variant:'bare' }], [PATCH.hayrick, { variant:'burning' }], [PATCH.husker, { variant:'burning' }], [PATCH.husker, { variant:'burnt' }]].forEach(([e, v], i) => {
    g.save(); g.translate(40 + i * 72, ground - 50 * e.scale); g.scale(e.scale, e.scale); e.draw(g, { walk:.25, ...v }); g.restore(); }); }
gs.appendChild(gc); app.appendChild(gs);
window.__np = { PATCH, cards };
