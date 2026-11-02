// Preview page for the nightmare witches and the Triptych Sprite: each look large and animated beside the game's original, strips of
// every clip, a game-size row, and the three-lane barrier over three lanes. Bundled by build.sh into preview.html.
import { NWITCH } from './nightmare_witches.js';
import { GRAND, bakeBarrier } from './grand_mirror.js';

const app = document.getElementById('app');
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const BG = '#0c0c0e';

function fit(g, w, h, E, pose, pad = .96){
  const b = E.box, s = Math.min(w * pad / b.w, h * pad / b.h);
  g.save(); g.translate(w / 2 - (b.x + b.w / 2) * s, h / 2 - (b.y + b.h / 2) * s); g.scale(s, s); E.draw(g, pose); g.restore();
}
function boxLines(g, w, h, E, pad = .96){
  const b = E.box, s = Math.min(w * pad / b.w, h * pad / b.h);
  g.save(); g.translate(w / 2 - (b.x + b.w / 2) * s, h / 2 - (b.y + b.h / 2) * s); g.scale(s, s);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1 / s; g.strokeRect(b.x, b.y, b.w, b.h); g.beginPath(); g.moveTo(b.x, 50); g.lineTo(b.x + b.w, 50); g.strokeStyle = 'rgba(255,80,80,.18)'; g.stroke(); g.restore();
}
const players = [];
function clipT(cl, st, now){
  const T = (now - st.t0) / 1000; let t = T * cl.fps / cl.n;
  if (st.freeze != null) return st.freeze;
  if (cl.once){ if (t >= 1){ if (T > cl.n / cl.fps + .7) st.t0 = now; return 1; } return t; }
  return t % 1;
}

// ---- a show block: several looks side by side, one shared clip bar ----
function show(title, E, looks, size = 300){
  const sec = el('div', 'sec'); sec.appendChild(el('h2', null, title));
  const pair = el('div', 'pair'); sec.appendChild(pair);
  const st = { clip:'walk', t0:performance.now(), freeze:null };
  const bigs = looks.map(([label, variant, fallback]) => { const col = el('div', 'col'); const c = el('canvas', 'big'); c.width = size * 2; c.height = size * 2; c.style.width = size + 'px'; c.style.height = size + 'px'; col.append(c, el('div', 'cap', label)); pair.appendChild(col); return { c, variant, fallback }; });
  const bar = el('div', 'bar');
  for (const cl of Object.keys(E.clips)){ const b = el('button', null, cl); b.dataset.clip = cl; b.onclick = () => { st.clip = cl; st.t0 = performance.now(); st.freeze = null; refresh(); }; bar.appendChild(b); }
  sec.appendChild(bar);
  const refresh = () => { for (const b of bar.querySelectorAll('button')) b.classList.toggle('on', b.dataset.clip === st.clip); };
  refresh(); app.appendChild(sec);
  players.push(now => { for (const { c, variant, fallback } of bigs){ const name = fallback && fallback[st.clip] ? fallback[st.clip] : st.clip, cl = E.clips[name], t = clipT(E.clips[st.clip], st, now);
    const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = BG; g.fillRect(0, 0, c.width, c.height); boxLines(g, c.width, c.height, E); fit(g, c.width, c.height, E, { ...cl.pose(t), variant }); } });
  return st;
}

// ---- strips ----
const FW = 130;
function strip(E, name, variant, label){
  const cl = E.clips[name], n = cl.n, FH = Math.round(FW * E.box.h / E.box.w), row = el('div', 'row'); row.appendChild(el('span', 'lbl', label || name));
  const c = el('canvas'); c.width = FW * n * 2; c.height = FH * 2; c.style.width = FW * n + 'px'; c.style.height = FH + 'px';
  const g = c.getContext('2d'); g.scale(2, 2);
  for (let i = 0; i < n; i++){ const t = cl.once ? i / (n - 1) : i / n; g.save(); g.translate(i * FW, 0); g.fillStyle = i % 2 ? '#121214' : BG; g.fillRect(0, 0, FW, FH); fit(g, FW, FH, E, { ...cl.pose(t), variant }, .98); g.restore(); }
  row.appendChild(c); return row;
}

// ======== 1. the witches ========
const stW = show('Nightmare witches: the game\'s Witch, the Ash Crone, the Blood Coven Witch', NWITCH, [['Witch (game)', undefined], ['The Ash Crone', 'ash'], ['The Blood Coven Witch', 'coven']]);
// ======== 2. the mirror ========
const stM = show('Enhanced Mirror Sprite: the game\'s Mirror Sprite and the Triptych Sprite (summon raises the three-lane barrier)', GRAND, [['Mirror Sprite (game)', undefined, { summon:'reflect' }], ['The Triptych Sprite', 'grand']], 340);

// ======== 3. the barrier over three lanes ========
const CS = 74, BH = 50;
const bar3 = bakeBarrier(3, CS, BH, 8, 2.4), bar1 = bakeBarrier(1, CS, BH, 8, 2.4);
{
  const sec = el('div', 'sec'); sec.appendChild(el('h2', null, 'The three-lane barrier (baked prop, 8 sheen frames) on the nightmare Witchwood field: the Triptych Sprite summons it in front of her'));
  const row = el('div', 'pair'); sec.appendChild(row);
  const mk = (scale, label) => { const col = el('div', 'col'); const SW = CS * 5, SH = 300; const c = el('canvas', 'big'); c.width = Math.round(SW * scale * 2); c.height = Math.round(SH * scale * 2); c.style.width = SW * scale + 'px'; c.style.height = SH * scale + 'px'; col.append(c, el('div', 'cap', label)); row.appendChild(col); return { c, scale, SW, SH }; };
  const views = [mk(1.25, 'large'), mk(.8, 'phone size (game px × 0.8)')];
  // a static field background: grey dead grass, five lanes with the three under the barrier marked
  const field = (g, SW, SH) => { g.fillStyle = '#26262a'; g.fillRect(0, 0, SW, SH); for (let i = 0; i < 5; i++){ g.fillStyle = i % 2 ? '#2c2c31' : '#29292d'; g.fillRect(i * CS, 0, CS, SH); }
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; for (let i = 1; i < 5; i++){ g.beginPath(); g.moveTo(i * CS, 0); g.lineTo(i * CS, SH); g.stroke(); }
    g.fillStyle = 'rgba(255,42,58,.06)'; g.fillRect(CS, 0, CS * 3, SH); };
  const st = { t0:performance.now(), freeze:null }; window.__barrier = st;
  players.push(now => {
    // loop: walk 1.2 s, summon (0.83 s), reflect 2 s, the barrier fades 0.4 s
    const T = st.freeze != null ? st.freeze : ((now - st.t0) / 1000) % 4.6; let pose, rise = 0, alpha = 1;
    const sDur = GRAND.clips.summon.n / GRAND.clips.summon.fps;
    if (T < 1.2){ pose = { walk:(T * 12 / 8) % 1 }; rise = 0; }
    else if (T < 1.2 + sDur){ const q = (T - 1.2) / sDur; pose = { summon:q }; rise = Math.max(0, Math.min(1, (q - .5) / .35)); }
    else if (T < 4.2){ pose = { reflect:((T - 1.2 - sDur) * 10 / 6) % 1 }; rise = 1; }
    else { pose = { walk:((T - 4.2) * 12 / 8) % 1 }; rise = 1; alpha = 1 - (T - 4.2) / .4; }
    const fi = Math.floor(now / 90) % 8;
    for (const v of views){ const g = v.c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.scale(v.scale * 2, v.scale * 2); field(g, v.SW, v.SH);
      const mx = CS * 2.5, my = 110;   // the sprite's feet, in the middle lane
      if (rise > 0 && alpha > 0){ const f = bar3.frames[fi], by = my + 70; g.save(); g.globalAlpha = alpha; g.translate(mx, by); g.scale(.6 + .4 * rise, rise); g.drawImage(f, -bar3.w / 2, -bar3.base, bar3.w, bar3.h); g.restore(); }
      g.save(); g.translate(mx, my); g.scale(GRAND.scale, GRAND.scale); g.translate(0, -50); GRAND.draw(g, { ...pose, variant:'grand' }); g.restore(); }
  });
  // the one-lane version for comparison (the game today draws no barrier: the sprite's own mirror reflects)
  const c1 = el('canvas', 'big'); const W1 = CS * 3, H1 = 120; c1.width = W1 * 2.5; c1.height = H1 * 2.5; c1.style.width = W1 * 1.25 + 'px'; c1.style.height = H1 * 1.25 + 'px';
  const col1 = el('div', 'col'); col1.append(c1, el('div', 'cap', 'the same prop at one lane, for scale')); row.appendChild(col1);
  players.push(now => { const g = c1.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.scale(2.5, 2.5); g.fillStyle = '#26262a'; g.fillRect(0, 0, W1, H1); for (let i = 0; i < 3; i++){ g.fillStyle = i % 2 ? '#2c2c31' : '#29292d'; g.fillRect(i * CS, 0, CS, H1); }
    const f = bar1.frames[Math.floor(now / 90) % 8]; g.drawImage(f, CS * 1.5 - bar1.w / 2, 90 - bar1.base, bar1.w, bar1.h); });
  app.appendChild(sec);
}

// ======== 4. strips ========
const strips = el('div', 'sec'); strips.appendChild(el('h2', null, 'Every clip'));
for (const [v, lab] of [['ash', 'Ash Crone'], ['coven', 'Blood Coven']]){ strips.appendChild(el('h3', null, lab)); for (const n of Object.keys(NWITCH.clips)) strips.appendChild(strip(NWITCH, n, v)); }
strips.appendChild(el('h3', null, 'Triptych Sprite')); for (const n of Object.keys(GRAND.clips)) strips.appendChild(strip(GRAND, n, 'grand'));
strips.appendChild(el('h3', null, 'Originals, for reference')); strips.appendChild(strip(NWITCH, 'walk', undefined, 'witch')); strips.appendChild(strip(GRAND, 'reflect', undefined, 'mirror'));
app.appendChild(strips);

// ======== 5. game size ========
{
  const sec = el('div', 'sec'); sec.appendChild(el('h2', null, 'Game size (registry scale × 0.8 for a phone): witch, ash crone, coven witch, mirror sprite, triptych sprite (shut), triptych sprite (open)'));
  const SW = 480, SH = 120, c = el('canvas'); c.width = SW * 2; c.height = SH * 2; c.style.width = SW + 'px'; c.style.height = SH + 'px'; const g = c.getContext('2d'); g.scale(2, 2); g.fillStyle = '#2a2a2e'; g.fillRect(0, 0, SW, SH);
  const items = [[NWITCH, { walk:.1 }, undefined], [NWITCH, { walk:.1 }, 'ash'], [NWITCH, { walk:.1 }, 'coven'], [GRAND, { reflect:.3 }, undefined], [GRAND, { walk:.2 }, 'grand'], [GRAND, { reflect:.3 }, 'grand']];
  items.forEach(([E, pose, v], i) => { g.save(); g.translate(40 + i * 80, 95); const s = E.scale * .8; g.scale(s, s); g.translate(0, -50); E.draw(g, { ...pose, variant:v }); g.restore(); });
  sec.appendChild(c); app.appendChild(sec);
}

function frame(now){ for (const p of players) p(now); requestAnimationFrame(frame); }
requestAnimationFrame(frame);
window.__fx = { set(which, clip, t){ if (which === 'barrier'){ window.__barrier.freeze = t; return; } const st = which === 'mirror' ? stM : stW; st.clip = clip; st.t0 = performance.now(); st.freeze = t ?? null; } };
