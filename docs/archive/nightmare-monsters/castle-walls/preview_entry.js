// Preview page for the two new castle walls: first a real frame of night 4-15 (The Flanks) with the walls placed in its lanes,
// then each wall large with every clip, strips of every frame, and a game-size row beside the old castle wall.
// Every frame is baked once into a canvas (as the game's anim.js does) and only blitted per frame.
import { CLIPS } from './walls.js';
import { W1 } from '../../../../src/engine/render/chars/w1.js';
import { W4 } from '../../../../src/engine/render/chars/w4.js';
import { castleSprite } from '../../../../src/engine/render/fx.js';
import NIGHT from './night_4-15.jpg';   // the built game, night 4-15, 430×860 CSS at 2×, monsters cleared (old castle walls in lanes 1 and 7)

const DPR = Math.min(2, window.devicePixelRatio || 1);
const app = document.getElementById('app');
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- baking ----------
const cache = new Map();
/** A baked frame of entry `en` for `pose` (cached by `key`), at k device px per unit. */
function baked(en, key, pose, k = 2){
  const id = `${key}@${k}`; let c = cache.get(id); if (c) return c;
  const B = en.box; c = document.createElement('canvas'); c.width = Math.ceil(B.w * k); c.height = Math.ceil(B.h * k);
  const g = c.getContext('2d'); g.scale(k, k); g.translate(-B.x, -B.y); en.draw(g, pose); cache.set(id, c); return c;
}
const tOf = (cl, i) => cl.once ? i / (cl.n - 1) : i / cl.n;
function frame(en, ekey, clip, i, extra = {}, k = 2){ const cl = en.clips[clip]; i = Math.max(0, Math.min(cl.n - 1, i)); const pose = { ...cl.pose(tOf(cl, i)), ...extra };
  return baked(en, `${ekey}/${clip}/${i}/${JSON.stringify(extra)}`, pose, k); }
/** blit a baked frame with its box at (x, y) in the current units, scaled by s */
function put(g, en, c, x, y, s = 1){ const B = en.box; g.drawImage(c, x + B.x * s, y + B.y * s, B.w * s, B.h * s); }
// once clips loop with a pause on the last frame so the preview reads
const loopIdx = (cl, i) => { if (!cl.once) return i % cl.n; const cyc = cl.n + 10, k = i % cyc; return k < cl.n ? k : cl.n - 1; };

// the game's monsters, wrapped into game units (scale and dy applied), for scale on the map
const mon = (C, variant) => ({ box:{ x:C.box.x * C.scale, y:C.box.y * C.scale + C.dy, w:C.box.w * C.scale, h:C.box.h * C.scale }, clips:C.clips,
  draw(g, p){ g.translate(0, C.dy); g.scale(C.scale, C.scale); C.draw(g, { ...p, variant }); } });
const M = { ghoul:mon(W1.ghoul, 'cryptGhoul'), imp:mon(W1.imp, 'keepImp'), knight:mon(W4.knight), archer:mon(W4.archer) };
const OLD = { box:{ x:-40, y:-62, w:80, h:90 }, clips:{}, draw(){} };   // the old wall is the game's own baked sprite (castleSprite)

// ---------- 1. the map scene ----------
// Grid maths from src/engine/state.js at this frame's aspect: W 540, H 1080, CS 74, GX 11, FIELD_TOP 162, FIELD_BOT 628.
const GW = 540, GH = 1080, FT = 162, FB = 628, LANE = c => 11 + c * 74 + 37, Y = p => FT + p * (FB - FT), mS = p => .85 + .2 * Math.min(1, Math.max(0, p));
const opt = { dmg:0, n:1, crumbleAt:-1 };
const GATE = { lane:2, p:.55 }, TOWER = { lane:4, p:.5 };
function mapScene(){
  const img = new Image(); img.src = NIGHT;
  const cv = document.createElement('canvas'), w = 430, hh = 860; cv.width = w * DPR; cv.height = hh * DPR; cv.className = 'map'; cv.style.aspectRatio = `${w} / ${hh}`;
  const g = cv.getContext('2d'), K = DPR * w / GW;   // device px per game unit
  const bk = Math.min(2.5, K * 1.2);
  const drawMon = (m, key, clip, i, lane, p, alpha = 1) => { const en = M[key], cl = en.clips[clip], s = mS(p); g.globalAlpha = alpha; put(g, en, frame(en, key, clip, i % cl.n, {}, bk * s), LANE(lane), Y(p), s); g.globalAlpha = 1; };
  return { cv, draw(t){
    if (!img.complete || !img.naturalWidth) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(img, 0, 0, cv.width, cv.height); g.setTransform(K, 0, 0, K, 0, 0);
    const crumbling = opt.crumbleAt >= 0, ct = crumbling ? (t - opt.crumbleAt) : 0;
    if (crumbling && ct > 4.2) opt.crumbleAt = -1;
    // gate cycle (9 s): closed, open, held open while the front ghoul goes through, shut
    const T = 9, c = t % T, gi = Math.floor(t * 6), gate = CLIPS.gate, ex = { dmg:opt.dmg };
    let gf;
    if (crumbling){ const cl = gate.clips.crumble; gf = frame(gate, 'gate', 'crumble', Math.min(cl.n - 1, Math.floor(ct * cl.fps)), {}, bk); }
    else if (c < 5) gf = frame(gate, 'gate', 'closed', gi % 6, ex, bk);
    else if (c < 6) gf = frame(gate, 'gate', 'open', Math.floor((c - 5) * 12), ex, bk);
    else if (c < 7.8) gf = frame(gate, 'gate', 'opened', gi % 6, ex, bk);
    else if (c < 8.4) gf = frame(gate, 'gate', 'shut', Math.floor((c - 7.8) * 15), ex, bk);
    else gf = frame(gate, 'gate', 'closed', gi % 6, ex, bk);
    // the front ghoul: waits at the gate, walks through while it is open, fades out down the lane, comes back next cycle
    const wk = Math.floor(t * 9);
    let fp = .49, fa = Math.min(1, c * 2);
    if (!crumbling && c >= 6){ fp = .49 + (c - 6) * .14; fa = c > 8.2 ? Math.max(0, 1 - (c - 8.2) / .8) : 1; }
    // behind the gate (drawn first, so the wall covers their feet): the queue
    drawMon(0, 'ghoul', 'walk', Math.floor(t * 4), GATE.lane, .17);
    drawMon(0, 'imp', 'walk', Math.floor(t * 5) + 3, GATE.lane, .27);
    drawMon(0, 'knight', 'rest', Math.floor(t * 4), GATE.lane, .38);
    if (fp < GATE.p + .02) drawMon(0, 'ghoul', fp > .49 ? 'walk' : 'chew', fp > .49 ? wk : Math.floor(t * 6), GATE.lane, fp, fa);
    // a ground Skeleton Archer in lane 6, for size against the tower archer
    drawMon(0, 'archer', 'hold', Math.floor(t * 4), 5, .12);
    put(g, gate, gf, LANE(GATE.lane), Y(GATE.p));
    if (fp >= GATE.p + .02) drawMon(0, 'ghoul', 'walk', wk, GATE.lane, fp, fa);
    // the tower: shoots every 3.2 s; the arrow (the game's arrow) flies down its lane to the fence
    const tw = opt.n === 2 ? CLIPS.tower2 : CLIPS.tower, tk = opt.n === 2 ? 'tower2' : 'tower', sc = t % 3.2;
    let tf;
    if (crumbling){ const cl = tw.clips.crumble; tf = frame(tw, tk, 'crumble', Math.min(cl.n - 1, Math.floor(ct * cl.fps)), {}, bk); }
    else if (sc < .43) tf = frame(tw, tk, 'shoot', Math.floor(sc * 14), ex, bk);
    else tf = frame(tw, tk, 'idle', Math.floor(t * 4) % 4, ex, bk);
    put(g, tw, tf, LANE(TOWER.lane), Y(TOWER.p));
    if (!crumbling && sc > .3){ const f = (sc - .3) / 1.3; if (f < 1){ const x0 = LANE(TOWER.lane), y = Y(TOWER.p) - 120 + f * (FB - Y(TOWER.p) + 130);
      for (const dx of opt.n === 2 ? [-7, 7] : [0]) arrow(g, x0 + dx, y); } else if (f < 1.25){ const a = 1 - (f - 1) / .25; g.globalAlpha = a; g.strokeStyle = '#ffe2a0'; g.lineWidth = 2; for (let i = 0; i < 6; i++){ const an = -Math.PI / 2 + (i - 2.5) * .45; g.beginPath(); g.moveTo(LANE(TOWER.lane) + Math.cos(an) * 6, FB + 22 + Math.sin(an) * 6); g.lineTo(LANE(TOWER.lane) + Math.cos(an) * (10 + 10 * (1 - a)), FB + 22 + Math.sin(an) * (10 + 10 * (1 - a))); g.stroke(); } g.globalAlpha = 1; } }
    // in front of everything: a knight marching down lane 3 and an imp in lane 1
    { const p = .1 + ((t * .05) % .75); drawMon(0, 'knight', 'walk', Math.floor(t * 9), 3, p); }
    drawMon(0, 'imp', 'walk', Math.floor(t * 12), 1, .62);
  } };
}
/** The game's archer arrow (render/draw.js drawArrows), pointing down the lane. */
function arrow(g, x, y){ g.strokeStyle = '#3a2a1c'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x, y + 10); g.stroke();
  g.fillStyle = '#d8d0c0'; g.beginPath(); g.moveTo(x - 5, y + 9); g.lineTo(x + 5, y + 9); g.lineTo(x, y + 19); g.closePath(); g.fill(); g.fillStyle = '#c8b090'; g.fillRect(x - 4, y - 16, 8, 5); }

// ---------- page ----------
const anims = [];   // [draw(i)] per animated cell, i = frame counter at its own fps
const sec = (title, note) => { const s = h('section'); s.appendChild(h('h2', null, title)); if (note){ const p = h('p', 'note'); p.innerHTML = note; s.appendChild(p); } app.appendChild(s); return s; };
function cellCanvas(B, scale, label){
  const w = Math.ceil(B.w * scale), hh = Math.ceil(B.h * scale), wrap = h('div', 'cell'), c = document.createElement('canvas');
  c.width = w * DPR; c.height = hh * DPR; c.style.width = w + 'px'; c.style.height = hh + 'px'; wrap.appendChild(c); if (label != null) wrap.appendChild(h('div', 'lbl', label));
  return { wrap, g:c.getContext('2d'), c };
}
function clipCell(row, en, key, clip, scale, label = clip){
  const { wrap, g, c } = cellCanvas(en.box, scale, label); row.appendChild(wrap); const cl = en.clips[clip], k = Math.min(3, scale * DPR);
  const draw = i => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.drawImage(frame(en, key, clip, loopIdx(cl, i), {}, k), 0, 0, c.width, c.height); };
  anims.push([draw, cl.fps]); draw(0);
}
function oldCell(row, scale, label, hp = 1){
  const { wrap, g, c } = cellCanvas(OLD.box, scale, label); row.appendChild(wrap);
  const sp = castleSprite(Math.min(2.5, scale * DPR), hp); g.setTransform(DPR * scale, 0, 0, DPR * scale, 0, 0); g.drawImage(sp.c, -OLD.box.x - sp.ox, -OLD.box.y - sp.oy, sp.w, sp.h);
}

app.appendChild(h('h1', null, 'Castle walls'));
{ const p = h('p', 'lede'); p.innerHTML = 'Two new castle walls for the Crumbling Keep, drawn in the same Toy Plastic stone as the old wall: the <b>Gatehouse</b> (bulky, with a gate that opens and shuts) and the <b>Archer Tower</b> (tall, with Skeleton Archers on top). Design archive only: nothing here is in the game.'; app.appendChild(p); }

// 1. map
let map;
{ const s = sec('On a real night: 4-15 The Flanks', 'A frame of the built game with its monsters cleared. The <b>old castle walls</b> stand in lanes 1 and 7 (the level\'s own layout). Placed at the game\'s own cell size: the <b>Gatehouse</b> in lane 3 with a queue bunched up behind it, and the <b>Archer Tower</b> in lane 5, shooting down its lane at the fence. Every 9 s the gate opens, the front ghoul walks through, and it shuts again.');
  const wrap = h('div', 'mapwrap'); s.appendChild(wrap); map = mapScene(); wrap.appendChild(map.cv);
  const ctl = h('div', 'ctl'); wrap.appendChild(ctl);
  const group = (label, vals, keyName) => { const gdiv = h('div', 'grp'); gdiv.appendChild(h('span', 'gl', label)); const btns = [];
    vals.forEach(([v, t]) => { const b = h('button', null, t); b.type = 'button'; b.onclick = () => { opt[keyName] = v; btns.forEach(x => x.classList.toggle('on', x === b)); }; if (opt[keyName] === v) b.classList.add('on'); btns.push(b); gdiv.appendChild(b); }); ctl.appendChild(gdiv); };
  group('Damage', [[0, 'Whole'], [1, 'Cracked'], [2, 'Broken']], 'dmg');
  group('Archers', [[1, 'One'], [2, 'Two']], 'n');
  const cb = h('button', 'go', 'Knock both down'); cb.type = 'button'; cb.onclick = () => { opt.crumbleAt = lastT; }; ctl.appendChild(cb);
}

// 2. each wall large
const IDEA = {
  gate: '<b>Look:</b> one lane wide like the old wall, but a heavy gatehouse: two squat flanking towers with crimson bat banners and torches, a sloped plinth, a crest, and a wide arch with iron-bound oak doors behind a portcullis. <b>Proposal (gameplay):</b> about 2.5× the HP of the level\'s castle walls. Pumpkins hit it like any castle wall. Monsters in its lane <b>stop at the gate and bunch up</b> behind it; every 8 s the gate opens (portcullis up, doors in) for about 2 s and lets the queue through, then slams shut. Breaking the wall frees the whole queue at once, so the player may prefer to leave it standing and hit the crowd with a Black or a Deep Blue.',
  tower: '<b>Look:</b> a tall, narrow, tapered round tower with arrow loops, corbels, a crenellated top, a pennant and a torch, about twice the old wall\'s height. A Skeleton Archer (the game\'s own drawing, scaled) stands in the embrasure. <b>Proposal (gameplay):</b> about 1.5× the HP of the level\'s castle walls; the archer shoots an arrow down the lane every 5 s (3 wall damage, as the Skeleton Archer) and cannot be hit while the tower stands (pumpkins hit the tower), except that a Grey pierces the tower and hits the archer. When the tower falls the archer drops onto the rubble, dazed for 2 s, then fights on as an ordinary Skeleton Archer holding at that spot.',
  tower2: 'The same tower with two archers (for later levels): a merlon between them, both shoot together, two arrows down the lane.',
};
const BIG = { gate:1.35, tower:1.15, tower2:1.15 };
for (const key of ['gate', 'tower', 'tower2']){
  const en = CLIPS[key], s = sec(en.name, IDEA[key]), row = h('div', 'row'); s.appendChild(row);
  for (const clip of Object.keys(en.clips)) clipCell(row, en, key, clip, BIG[key]);
  if (key === 'gate') oldCell(row, BIG.gate, 'old wall (game)');
}

// 3. strips
for (const key of ['gate', 'tower', 'tower2']){
  const en = CLIPS[key], s = sec(`${en.name}: every frame`, 'Once clips use t = i / (n − 1), loops t = i / n. Each frame shows the whole box.');
  for (const [name, cl] of Object.entries(en.clips)){
    s.appendChild(h('h3', null, `${name} (${cl.n} frames, ${cl.fps} fps${cl.once ? ', once' : ''})`)); const row = h('div', 'row strip'); s.appendChild(row);
    for (let i = 0; i < cl.n; i++){ const { wrap, g, c } = cellCanvas(en.box, .5, i); row.appendChild(wrap); g.drawImage(frame(en, key, name, i, {}, Math.min(3, .5 * DPR * 2)), 0, 0, c.width, c.height); }
  }
}

// 4. game size
{ const s = sec('Game size', 'At the game\'s scale on a 430 px wide phone (0.8 px per game unit): the old wall in its three damage states, the two new walls, and a Skeleton Archer on the ground.');
  const row = h('div', 'row game'), k = 430 / 540; s.appendChild(row);
  oldCell(row, k, 'old', 1); oldCell(row, k, 'old ½', .5); oldCell(row, k, 'old ¼', .2);
  for (const [key, clip] of [['gate', 'closed'], ['gate', 'opened'], ['gate', 'broken'], ['tower', 'idle'], ['tower', 'broken'], ['tower2', 'idle']]) clipCell(row, CLIPS[key], key, clip, k, `${key} ${clip}`);
  clipCell(row, M.archer, 'archer', 'hold', k, 'archer'); }

let lastT = 0, frozen = false;
const t0 = performance.now();
function tick(now){ const ph = (now - t0) / 1000; lastT = ph; if (!frozen) map.draw(ph); for (const [d, fps] of anims) d(Math.floor(ph * fps)); if (!reduce) requestAnimationFrame(tick); }
requestAnimationFrame(tick);

// ---------- test hooks ----------
window.__freeze = (sec2 = 2) => { map.draw(sec2); for (const [d] of anims) d(0); };
window.__map = (sec2, o = {}) => { frozen = true; Object.assign(opt, o); map.draw(sec2); };
window.__edges = () => { const out = {}; for (const key of Object.keys(CLIPS)){ const en = CLIPS[key], B = en.box, sc = 2, c = document.createElement('canvas'); c.width = Math.ceil(B.w * sc); c.height = Math.ceil(B.h * sc); const g = c.getContext('2d');
  for (const [name, cl] of Object.entries(en.clips)) for (let i = 0; i < cl.n; i++){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save(); g.scale(sc, sc); g.translate(-B.x, -B.y); en.draw(g, cl.pose(tOf(cl, i))); g.restore();
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const k = key + '/' + name, m = { l:x0 / sc, r:(c.width - 1 - x1) / sc, t:y0 / sc, b:(c.height - 1 - y1) / sc }, o = out[k] || (out[k] = { l:1e9, r:1e9, t:1e9, b:1e9 }); for (const q in m) o[q] = Math.min(o[q], m[q]); } }
  return out; };
// a still of the map scene alone for idle.png
window.__idle = (sec2 = 2.2) => { document.body.innerHTML = ''; document.body.style.padding = '0'; map.cv.style.width = '430px'; map.cv.style.maxWidth = 'none'; map.cv.style.borderRadius = '0'; document.body.appendChild(map.cv); frozen = true; map.draw(sec2); };
