// Preview page for the Strawlord (Pumpkin Patch mini boss), its crows, the Treant (Witchwood mini boss) and its summoned roots:
// each clip large and animated beside the game's originals (scarecrow prop, Gravekeeper, Hexwitch, the Kraken mini boss),
// strips of every clip, and a game-size row next to normal monsters at about 60 px.
import { CLIPS } from './patch_wood.js';
import { W1 } from '../../../../src/engine/render/chars/w1.js';
import { W2 } from '../../../../src/engine/render/chars/w2.js';
import { W3 } from '../../../../src/engine/render/chars/w3.js';
import { NM } from '../kraken-pirate/kraken_pirate.js';
import { E, PL, RR, S, SM, SO, pal } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';

// The game's field scarecrow (a verbatim copy of scarecrow() in src/engine/render/tools.js; that module touches the game canvas on import).
const WOOD = pal('#b48a58'), WOODD = pal('#6b4526'), STRAW = pal('#d9b455'), SACK = pal('#c9a57a'), HAT = pal('#3a2a1a'), COAT = pal('#5a4a7a'), SHIRT = pal('#8a3a3a'), CROW = pal('#2a2430');
function scarecrow(g, P = {}){
  const sw = Math.sin((P.sway || 0) * TAU) * (1 - (P.wear || 0) * .5), wear = P.wear || 0, sh = P.shake ? Math.sin((P.shake) * 40) * 2 : 0;
  g.save(); g.translate(sh, 0);
  S.tube(g, SO([[0, 46], [0, -30]]), WOODD, 7);
  g.save(); g.translate(0, -16); g.rotate(sw * .06 - wear * .12);
  S.tube(g, SO([[-30, 0], [30, 0]]), WOODD, 5);
  S.part(g, SM([[-22, -6], [22, -6], [26, 18], [14, 24], [-14, 24], [-26, 18]], .7), COAT, { x:0, y:8, r:24 }, { mat:'cloth', hx:-10, hy:0 });
  S.part(g, RR(-24, -4, 48, 7, 3), SHIRT, { x:0, y:0, r:24 }, { flat:true, mat:'cloth' });
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++){ if (wear > .5 && i > 1) continue; const a = s * (.4 + i * .3) + sw * .15; S.ln(g, [[s * 26, 0], [s * 26 + Math.cos(a) * 14 * s, Math.sin(a) * 12 + 2]], STRAW, 2.2, .95); }
  for (let i = -3; i <= 3; i++){ if (wear > .3 && Math.abs(i) > 1) continue; S.ln(g, [[i * 6, 22], [i * 7 + sw * 3, 34 + (i % 2) * 4]], STRAW, 2, .9); }
  S.part(g, RR(-12, 8, 9, 8, 2), pal('#7a6a56'), { x:-8, y:12, r:5 }, { flat:true, mat:'cloth' }); for (const y of [2, 10, 18]) S.rivet(g, 4, y, 1.6, WOOD);
  g.restore();
  g.save(); g.translate(sw * 2, -42 + wear * 3); g.rotate(sw * .05 + wear * .25);
  S.part(g, SM([[-14, -12], [14, -12], [16, 6], [8, 14], [-8, 14], [-16, 6]], .8), SACK, { x:0, y:0, r:16 }, { mat:'cloth', hx:-6, hy:-6 });
  S.ln(g, [[-4, -14], [4, -14]], SACK, 1.2, .6);
  for (const s of [-1, 1]){ S.ln(g, [[s * 8, -4], [s * 3, 1]], HAT, 1.6, .9); S.ln(g, [[s * 8, 1], [s * 3, -4]], HAT, 1.6, .9); }
  S.stroke(g, SO([[-6, 7], [-2, 9], [2, 9], [6, 7]]), HAT, 1.4, .8); for (const x of [-4, 0, 4]) S.ln(g, [[x, 6], [x, 10]], HAT, .9, .6);
  for (let i = -2; i <= 2; i++) S.ln(g, [[i * 5, -12], [i * 6, -18 - (i % 2) * 3]], STRAW, 1.8, .9);
  S.part(g, RR(-20, -16, 40, 5, 2), HAT, { x:0, y:-14, r:20 }, { flat:true, mat:'cloth' });
  S.part(g, SM([[-11, -16], [-9, -32], [10, -34], [12, -16]], .6), HAT, { x:0, y:-24, r:12 }, { mat:'cloth', hx:-4, hy:-28 });
  S.ln(g, [[-11, -19], [12, -19]], pal('#b0801a'), 2, .9);
  g.restore();
  if (P.crow){ g.save(); g.translate(-30 + sw * 1.5, -22); S.part(g, E(0, 0, 7, 5), CROW, { x:0, y:0, r:7 }, { flat:true }); S.part(g, E(5, -5, 4, 4), CROW, { x:5, y:-5, r:4 }, { flat:true }); S.part(g, PL([[8, -5], [13, -4], [8, -3]]), pal('#e8a030'), { x:10, y:-4, r:3 }, { flat:true }); S.dot(g, E(6, -6, 1, 1), '#fff'); S.ln(g, [[-7, 0], [-12, -3]], CROW, 1.4, .9); g.restore(); }
  g.restore();
}

const DPR = Math.min(2, window.devicePixelRatio || 1);
const app = document.getElementById('app');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const GAME = {
  scarecrow: { name:'Scarecrow prop (game)', draw:scarecrow, scale:.62, box:{ x:-50, y:-80, w:100, h:134 }, clips:{ sway:{ n:8, fps:6, pose:t => ({ sway:t, crow:true }) } } },
  gravekeeper: { name:'Gravekeeper (world 1 boss)', ...W1.gravekeeper }, imp: { name:'Imp (game)', ...W1.imp }, ghoul: { name:'Ghoul (game)', ...W1.ghoul }, bat: { name:'Bat (game)', ...W1.bat },
  poltergeist: { name:'Poltergeist (world 2 boss)', ...W2.poltergeist }, hexwitch: { name:'Hexwitch (world 3 boss)', ...W3.hexwitch }, witch: { name:'Witch (game)', ...W3.witch },
  kraken: { name:'Kraken (Drowned Marsh mini boss)', ...NM.kraken },
};
const ALL = ['strawlord', 'crow', 'treant', 'root'];
const IDEA = {
  strawlord: 'Proposal. Phase 1: nailed to its post at the back of the field (centre lane), it sways while crows peek out of its coat; every few seconds it flaps the coat open (flock) and a flock of crows bursts out and dives down the lanes as fast, fragile flyers. Phase 2 (at half health): it tears free of the post (tear), drops to the ground and stomps down its lane as a slow, very tough brute, hacking at the wall with its rusty sickle (chew).',
  treant: 'Proposal. The Treant never walks: it stands at the back of the field like a world boss. Every few seconds it raises its branch arms and slams them into the ground (summon), and thorny roots burst up in two or three lanes.',
  root: 'Proposal. A root rises in a lane (rise), writhes (idle) and later sinks back (sink). A root mid-field blocks its lane: the next pumpkin flicked up that lane hits the root instead (it takes 2-3 hits). A root that rises at the wall grabs it and squeezes (wall damage over time) until it is destroyed or sinks.',
};

/** A canvas showing entry `en`'s box at `scale` CSS px per drawing unit. */
function cell(en, scale, label){
  const B = en.box, w = Math.ceil(B.w * scale), hh = Math.ceil(B.h * scale);
  const wrap = h('div', 'cell'); const c = document.createElement('canvas'); c.width = w * DPR; c.height = hh * DPR; c.style.width = w + 'px'; c.style.height = hh + 'px';
  wrap.appendChild(c); if (label != null) wrap.appendChild(h('div', 'lbl', label));
  const g = c.getContext('2d');
  return { el:wrap, draw(pose){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(scale * DPR, scale * DPR); g.translate(-B.x, -B.y); en.draw(g, pose); g.restore(); } };
}
const anims = [];
const sec = (title, note) => { const s = h('section'); s.appendChild(h('h2', null, title)); if (note) s.appendChild(h('p', 'note', note)); app.appendChild(s); return s; };
// once clips play, hold on the last frame, then restart, so the preview reads like the game
const frameOf = (en, clip, i) => { const cl = en.clips[clip]; if (!cl.once){ const k = i % cl.n; return cl.pose(k / cl.n); }
  const n = cl.n, cyc = n + 8, k = i % cyc; return cl.pose(Math.min(k, n - 1) / (n - 1)); };
const add = (row, en, clip, sc, lbl) => { const c = cell(en, sc, lbl); row.appendChild(c.el); anims.push([c, en, clip]); };

app.appendChild(h('h1', null, 'Mini bosses: the Strawlord and the Treant'));
app.appendChild(h('p', 'note', 'Design archive, not in the game. Pumpkin Patch and Witchwood mini bosses, in the Kraken\'s size class (smaller than the world bosses, bigger than monsters). Every clip below is drawn with the game\'s Toy Plastic painter and would be baked like any monster.'));
// 1. large, animated, beside the originals
{
  const s = sec('The Strawlord (Pumpkin Patch mini boss)', IDEA.strawlord);
  s.appendChild(h('h3', null, 'Phase 1: on the post')); let row = h('div', 'row'); s.appendChild(row);
  for (const clip of ['idle', 'flock', 'hit']) add(row, CLIPS.strawlord, clip, 1.3, clip + (CLIPS.strawlord.clips[clip].once ? ' (once)' : ''));
  s.appendChild(h('h3', null, 'Phase 2: torn free')); row = h('div', 'row'); s.appendChild(row);
  for (const clip of ['tear', 'walk', 'chew']) add(row, CLIPS.strawlord, clip, 1.3, clip + (CLIPS.strawlord.clips[clip].once ? ' (once)' : ''));
  s.appendChild(h('h3', null, 'Its crow as a flying monster, and the game\'s originals (same drawing-unit scale)')); row = h('div', 'row'); s.appendChild(row);
  add(row, CLIPS.crow, 'fly', 1.3, 'crow: fly'); add(row, GAME.scarecrow, 'sway', 1.3, GAME.scarecrow.name); add(row, GAME.gravekeeper, 'walk', 1.1, GAME.gravekeeper.name);
}
{
  const s = sec('The Treant (Witchwood mini boss)', IDEA.treant);
  let row = h('div', 'row'); s.appendChild(row);
  for (const clip of ['idle', 'summon', 'hit']) add(row, CLIPS.treant, clip, 1.3, clip + (CLIPS.treant.clips[clip].once ? ' (once)' : ''));
  const s2 = sec('The summoned root', IDEA.root); row = h('div', 'row'); s2.appendChild(row);
  for (const clip of ['rise', 'idle', 'sink']) add(row, CLIPS.root, clip, 1.5, clip + (CLIPS.root.clips[clip].once ? ' (once)' : ''));
  s2.appendChild(h('h3', null, 'Originals for size and palette: the Hexwitch, the Witch, the Kraken')); row = h('div', 'row'); s2.appendChild(row);
  add(row, GAME.hexwitch, 'walk', .95, GAME.hexwitch.name); add(row, GAME.witch, 'walk', 1.3, GAME.witch.name); add(row, GAME.kraken, 'idle', 1.1, GAME.kraken.name);
}
// 2. strips
for (const key of ALL){
  const en = CLIPS[key], s = sec(`${en.name}: every clip`, `Box ${en.box.w} × ${en.box.h} drawing units, suggested scale ${en.scale}. Once clips use t = i / (n − 1), loops t = i / n.`);
  for (const [name, cl] of Object.entries(en.clips)){
    s.appendChild(h('h3', null, `${name} (${cl.n} frames, ${cl.fps} fps${cl.once ? ', once' : ''})`)); const row = h('div', 'row strip'); s.appendChild(row);
    const sc = key === 'root' || key === 'crow' ? .6 : .4;
    for (let i = 0; i < cl.n; i++){ const t = cl.once ? i / (cl.n - 1) : i / cl.n; const c = cell(en, sc, i); row.appendChild(c.el); c.draw(cl.pose(t)); }
  }
}
// 3. game size: everything at the same px per game unit, with the Imp about 60 px tall
{
  const s = sec('Game size', 'Every figure at the same pixels per game unit (the Imp is about 60 px tall, one lane is about 61 px). Mini bosses use their suggested scale: Strawlord 0.56, Treant 0.58, root 0.55, crow 0.6; the Kraken is 0.58, the Gravekeeper 0.68.');
  const row = h('div', 'row game'); s.appendChild(row);
  const base = 60 / (128 * GAME.imp.scale);
  for (const [o, clip, lbl] of [[GAME.imp, 'walk', 'Imp'], [GAME.ghoul, 'walk', 'Ghoul'], [GAME.bat, 'walk', 'Bat'], [CLIPS.crow, 'fly', 'Crow'], [CLIPS.strawlord, 'idle', 'Strawlord (post)'], [CLIPS.strawlord, 'walk', 'Strawlord (free)'],
    [CLIPS.treant, 'idle', 'Treant'], [CLIPS.root, 'idle', 'Root'], [GAME.witch, 'walk', 'Witch'], [GAME.kraken, 'idle', 'Kraken'], [GAME.gravekeeper, 'walk', 'Gravekeeper'], [GAME.hexwitch, 'walk', 'Hexwitch']]) add(row, o, clip, base * o.scale, lbl);
}

const t0 = performance.now();
function tick(now){ const ph = (now - t0) / 1000; for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, Math.floor(ph * en.clips[clip].fps))); requestAnimationFrame(tick); }
requestAnimationFrame(tick);
// test hooks: freeze every animated cell on one frame; measure how close any frame comes to its box edges (drawing units)
window.__freeze = (frame = 0) => { for (const [c, en, clip] of anims) c.draw(frameOf(en, clip, frame)); };
window.__edges = () => { const out = {}; for (const key of ALL){ const en = CLIPS[key], B = en.box, sc = 2, c = document.createElement('canvas'); c.width = Math.ceil(B.w * sc); c.height = Math.ceil(B.h * sc); const g = c.getContext('2d', { willReadFrequently:true });
  for (const [name, cl] of Object.entries(en.clips)) for (let i = 0; i < cl.n; i++){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(sc, sc); g.translate(-B.x, -B.y); en.draw(g, cl.pose(cl.once ? i / (cl.n - 1) : i / cl.n)); g.restore();
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const k = key + '/' + name, m = { l:x0 / sc, r:(c.width - 1 - x1) / sc, t:y0 / sc, b:(c.height - 1 - y1) / sc }, o = out[k] || (out[k] = { l:1e9, r:1e9, t:1e9, b:1e9 }); for (const q in m) o[q] = Math.min(o[q], m[q]); } }
  return out; };
// a still of both mini bosses for idle.png
window.__idle = () => { document.body.innerHTML = ''; const row = h('div', 'row'); row.style.padding = '12px'; document.body.appendChild(row);
  for (const [key, clip, t, sc] of [['strawlord', 'idle', .25, 1.3], ['strawlord', 'walk', .25, 1.3], ['treant', 'idle', .25, 1.3], ['root', 'idle', .25, 1.3]]){ const en = CLIPS[key], c = cell(en, sc, `${en.name}: ${clip}`); row.appendChild(c.el); c.draw(en.clips[clip].pose(t)); } };
