// Nightmare gourds (archive only, 2026-11-02). Five gourds, each with its own shape and colour, cute like the pumpkins (owner); one design for every world.
// A gourd sits on the patch and powers up every pumpkin flicked from the 3x3 square around it (owner). Powers are not decided yet.
// Drawn with the game's Toy Plastic painter and baked once into sprites; the preview only blits them (sway, glow pulse).
import { E, S, SM, SO, ell, mix, pal, rgba, rng } from '../../../src/engine/render/paint.js';
import { pumpkin } from '../../../src/engine/render/chars/w1.js';
import NIGHT from './night_1-4.jpg';   // a real frame of night 1-4 from the built game (430×860 at 2×), centre cell cleared

const TAU = Math.PI * 2;
const STEM = pal('#6e4c2a'), LEAF = pal('#4c7a34');
const P = (pts, R) => pts.map(([x, y, k]) => k ? [x * R, y * R, 1] : [x * R, y * R]);

// ---------- the five shapes (one colour each: the owner's idea; the shape tells them apart even in grey Witchwood) ----------
export const SHAPES = [
  { key:'calabash', name:'Calabash', hue:'#e3a43c', colour:'Amber', look:'Tall bottle gourd with a pinched waist: a big bulb below, a small one on top.',
    body:R => SM(P([[0,.86],[.5,.74],[.7,.36],[.6,-.04],[.3,-.3],[.2,-.42],[.32,-.58],[.4,-.82],[.28,-1.04],[0,-1.12],[-.28,-1.04],[-.4,-.82],[-.32,-.58],[-.2,-.42],[-.3,-.3],[-.6,-.04],[-.7,.36],[-.5,.74]], R)),
    b:{ x:0, y:.26, r:.8 }, hl:[-.3, .02], top:[0,-1.1], stem:-Math.PI / 2, face:{ x:0, y:.3, s:.92 }, band:-.4, waist:-.4 },
  { key:'crookneck', name:'Crookneck', hue:'#b9cf3c', colour:'Lime', look:'A fat bumpy base whose neck curls over like a shepherd\'s crook.',
    body:R => SM(P([[0,.88],[.52,.78],[.68,.42],[.52,.02],[.26,-.22],[.15,-.5],[.2,-.76],[.38,-.84],[.5,-.74],[.66,-.66],[.72,-.84],[.6,-1.04],[.36,-1.14],[.06,-1.08],[-.14,-.84],[-.2,-.5],[-.34,-.2],[-.6,.06],[-.7,.42],[-.52,.78]], R)),
    b:{ x:0, y:.34, r:.74 }, hl:[-.3, .1], top:[.7,-.72], stem:.5, face:{ x:-.02, y:.42, s:.86 }, band:.02, bumps:7 },
  { key:'turban', name:'Turban', hue:'#d6472e', colour:'Red with a cream cap', cap:'#ece0b4', look:'Squat and wide, with a striped cream cap sitting on a scalloped collar.',
    body:R => SM(P([[0,.86],[.56,.8],[.86,.56],[.88,.26],[.64,.04],[0,-.02],[-.64,.04],[-.88,.26],[-.86,.56],[-.56,.8]], R)),
    capPath:R => SM(P([[-.5,.12],[-.54,-.18],[-.38,-.48],[0,-.62],[.38,-.48],[.54,-.18],[.5,.12]], R)),
    b:{ x:0, y:.44, r:.86 }, hl:[-.42, .3], top:[0,-.6], stem:-Math.PI / 2, face:{ x:0, y:.5, s:.82 }, band:.36 },
  { key:'wartling', name:'Wartling', hue:'#8a5cc6', colour:'Violet', look:'A round pear gourd covered in little bumps, with a curly stem.',
    body:R => SM(P([[0,.86],[.5,.76],[.7,.4],[.66,0],[.46,-.4],[.24,-.64],[0,-.7],[-.24,-.64],[-.46,-.4],[-.66,0],[-.7,.4],[-.5,.76]], R)),
    b:{ x:0, y:.12, r:.8 }, hl:[-.34, -.22], top:[0,-.68], stem:-Math.PI / 2, face:{ x:0, y:.22, s:.94 }, band:.36, warts:16 },
  { key:'swan', name:'Swan', hue:'#e4d9bd', colour:'Cream with green stripes', stripe:'#5c8c48', look:'A round striped body with a long thin neck that arcs over into a little head.',
    body:R => E(0, R * .38, R * .68, R * .5), neck:[[-.16,.04],[-.24,-.4],[-.2,-.84],[0,-1.16],[.3,-1.26],[.52,-1.1],[.56,-.9]],
    b:{ x:0, y:.38, r:.68 }, hl:[-.34, .1], top:[.6,-.76], stem:.9, face:{ x:0, y:.46, s:.9 }, band:.14 },
];

// ---------- parts ----------
function stem(g, R, [tx, ty], ang, curly){
  g.save(); g.translate(tx * R, ty * R); g.rotate(ang + Math.PI / 2);
  S.part(g, SM([[-R * .07, R * .06], [-R * .09, -R * .12], [-R * .02, -R * .26], [R * .1, -R * .3], [R * .12, -R * .2], [R * .06, -R * .12], [R * .07, R * .06]], .8), STEM, { x:0, y:-R * .12, r:R * .2 }, { flat:true, mat:'wood' });
  if (curly) S.stroke(g, SO([[R * .1, -R * .26], [R * .26, -R * .34], [R * .32, -R * .2], [R * .22, -R * .14], [R * .2, -R * .22]]), LEAF, 1.4, .85);
  g.restore();
}
const clipTo = (g, path) => { g.save(); path(g); g.clip(); };

/** The gourd: shape, shading, its own pattern, stem and face. */
function drawGourd(g, R, sh){
  const c = pal(sh.hue), b = { x:sh.b.x * R, y:sh.b.y * R, r:sh.b.r * R }, body = sh.body(R);
  S.shadow(g, 0, R * .86, R * (sh.key === 'turban' ? 1.05 : .86), R * .2);
  if (sh.neck){ S.tube(g, SO(P(sh.neck, R)), c, R * .17); S.part(g, E(R * .56, -R * .86, R * .12, R * .13), c, { x:R * .56, y:-R * .86, r:R * .13 }, { flat:true }); }
  S.part(g, body, c, b, { mat:'pumpkin', hx:sh.hl[0] * R, hy:sh.hl[1] * R });
  clipTo(g, body);
    if (sh.stripe){ const sc = sh.stripe; g.strokeStyle = rgba(sc, .55); g.lineWidth = R * .07; g.lineCap = 'round'; for (const x of [-.42, -.2, 0, .2, .42]){ g.beginPath(); g.moveTo(x * R * .7, R * .0); g.quadraticCurveTo(x * R * 1.3, R * .42, x * R * .7, R * .88); g.stroke(); } }
  if (sh.key === 'turban' || sh.key === 'wartling'){ g.strokeStyle = rgba(c.deep, .35); g.lineWidth = R * .045; for (const x of [-.55, -.25, .25, .55]){ g.beginPath(); g.moveTo(x * R * .8, sh.key === 'turban' ? R * .06 : -R * .6); g.quadraticCurveTo(x * R * 1.25, R * .4, x * R * .8, R * .84); g.stroke(); } }
  g.restore();
  if (sh.waist != null){ S.part(g, E(0, -R * .74, R * .38, R * .34), c, { x:0, y:-R * .74, r:R * .4 }, { mat:'pumpkin' }); S.contact(g, E(0, -R * .74, R * .38, R * .34), 0, -R * .42, R * .3, R * .08, .35); }
  if (sh.waist != null) S.crease(g, SO([[-R * .22, R * sh.waist], [0, R * (sh.waist + .04)], [R * .22, R * sh.waist]]), c, R * .04, .5);
  if (sh.bumps){ const Rr = rng(5); for (let i = 0; i < sh.bumps; i++){ const x = (Rr() - .5) * R * 1.0, y = R * (.05 + Rr() * .7), r = R * (.04 + Rr() * .03); if (Math.hypot(x, y - R * .42) < R * .32) continue; S.part(g, E(x, y, r, r), { ...c, base:mix(c.base, c.light, .2) }, { x, y, r }, { flat:true, lw:1 }); } }
  if (sh.warts){ const Rr = rng(17); let n = 0; for (let i = 0; i < 60 && n < sh.warts; i++){ const a = Rr() * TAU, d = Math.sqrt(Rr()) * .62, x = Math.cos(a) * d * R, y = (sh.b.y + Math.sin(a) * d * 1.05) * R, r = R * (.05 + Rr() * .05); if (Math.hypot(x, y - R * .22) < R * .38) continue; n++; S.part(g, E(x, y, r, r * .9), { ...c, base:mix(c.base, c.light, .25) }, { x:x - r * .3, y:y - r * .3, r }, { flat:true, lw:1 }); } }
  if (sh.capPath){ const cap = sh.capPath(R), cc = pal(sh.cap), cb = { x:0, y:-R * .2, r:R * .55 };
    S.part(g, cap, cc, cb, { mat:'pumpkin' });
    clipTo(g, cap); g.strokeStyle = rgba('#4a7a34', .7); g.lineWidth = R * .06; for (const x of [-.32, -.12, .08, .28]){ g.beginPath(); g.moveTo(x * R * .3, -R * .62); g.quadraticCurveTo(x * R * 1.6, -R * .24, x * R * 1.6, R * .12); g.stroke(); } g.restore();
    for (let i = 0; i < 7; i++){ const x = (-.48 + i * .16) * R, y = R * (.1 + Math.abs(i - 3) * -.012); S.part(g, E(x, y, R * .09, R * .07), { ...c, base:mix(c.base, c.light, .15) }, { x, y, r:R * .09 }, { flat:true, lw:1.2 }); } }
  stem(g, R, sh.top, sh.stem, sh.key === 'wartling' || sh.key === 'calabash');
  face(g, R, sh, c);
}

// ---------- the pumpkin face: big toy eyes, blush and a little smile (as `pumpkin` in chars/w1.js) ----------
function face(g, R, sh, c){
  const f = sh.face, s = R / 40 * f.s, x = f.x * R, ey = f.y * R - R * .1 * f.s, ex = R * .3 * f.s;
  S.eye(g, x - ex, ey, 9 * s, 9.5 * s, { lx:.2, iris:mix(c.dark, '#7a5a2a', .5) }); S.eye(g, x + ex, ey, 9 * s, 9.5 * s, { lx:.2, iris:mix(c.dark, '#7a5a2a', .5) });
  S.blush(g, x, ey + 10 * s, s);
  S.stroke(g, g2 => { g2.beginPath(); g2.moveTo(x - R * .16 * f.s, ey + R * .32 * f.s); g2.quadraticCurveTo(x, ey + R * .45 * f.s, x + R * .16 * f.s, ey + R * .32 * f.s); }, c, 2.4 * s);
}

// ---------- baking ----------
const SP = { w:3.2, h:3.1, ox:1.6, oy:1.72 };   // sprite box in R units and the gourd's origin inside it
const cache = new Map();
/** One baked gourd at R drawing units and device scale k. */
export function gourdSprite(si, R = 40, k = 2){
  const id = `${si}/${R}/${k}`; if (cache.has(id)) return cache.get(id);
  const cv = document.createElement('canvas'); cv.width = Math.ceil(SP.w * R * k); cv.height = Math.ceil(SP.h * R * k); const g = cv.getContext('2d'); g.scale(k, k); g.translate(SP.ox * R, SP.oy * R);
  drawGourd(g, R, SHAPES[si]);
  const out = { cv, ox:SP.ox * R, oy:SP.oy * R, k }; cache.set(id, out); return out;
}
/** A soft glow disc in a colour, baked once (the 3x3 aura and the halo pulse only change its alpha). */
const halos = new Map();
export function halo(col, r = 64){ if (halos.has(col)) return halos.get(col); const c = document.createElement('canvas'); c.width = c.height = r * 2; const g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, rgba(col, .55)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); halos.set(col, c); return c; }

// ---------- preview page ----------
const PATCH = { sky:['#110a20','#3d1a3e','#b0552f'], soil:['#7a4a2c','#4b2a17','#2a160a'] };   // the Pumpkin Patch palette
const PUMPKIN_COLS = ['#e9842a', '#f0c63a', '#7fd0f0', '#e0503a', '#8a5ac8', '#5c9c33', '#f2f0ea', '#3a8ad0'];
const glowOf = sh => mix(sh.hue, '#fff6d0', .35);
function backdrop(g, w, h, soilY){ let gr = g.createLinearGradient(0, 0, 0, soilY); gr.addColorStop(0, PATCH.sky[0]); gr.addColorStop(.6, PATCH.sky[1]); gr.addColorStop(1, PATCH.sky[2]); g.fillStyle = gr; g.fillRect(0, 0, w, soilY);
  gr = g.createLinearGradient(0, soilY, 0, h); gr.addColorStop(0, PATCH.soil[0]); gr.addColorStop(.4, PATCH.soil[1]); gr.addColorStop(1, PATCH.soil[2]); g.fillStyle = gr; g.fillRect(0, soilY, w, h - soilY);
  const R2 = rng(9); g.fillStyle = 'rgba(255,240,220,.5)'; for (let i = 0; i < 40; i++){ ell(g, R2() * w, R2() * soilY * .7, .6 + R2(), .6 + R2()); g.fill(); } }
function blit(g, sp, x, y, scale, rot = 0, sy = 1){ g.save(); g.translate(x, y); g.rotate(rot); g.scale(scale, scale * sy); g.drawImage(sp.cv, -sp.ox, -sp.oy, sp.cv.width / sp.k, sp.cv.height / sp.k); g.restore(); }
function hiDPI(cv, w, h){ const d = Math.min(2, window.devicePixelRatio || 1); cv.width = w * d; cv.height = h * d; cv.style.aspectRatio = `${w} / ${h}`; const g = cv.getContext('2d'); g.scale(d, d); return g; }
const bob = (t, i) => Math.sin(t * 1.6 + i * 1.3);

const state = { s:0 }, live = [];
const $ = s => document.querySelector(s);
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function heroScene(){ const cv = document.createElement('canvas'), w = 960, h = 320, g = hiDPI(cv, w, h); cv.className = 'hero';
  const bgc = document.createElement('canvas'); bgc.width = w * 2; bgc.height = h * 2; const bgg = bgc.getContext('2d'); bgg.scale(2, 2); backdrop(bgg, w, h, 240);
  return { cv, draw(t){ g.drawImage(bgc, 0, 0, w, h);
    SHAPES.forEach((sh, i) => { const x = 110 + i * 185, y = 234, p = bob(t, i);
      g.globalAlpha = .35 + .15 * p; g.drawImage(halo(glowOf(sh)), x - 85, y - 145, 170, 170); g.globalAlpha = 1;
      blit(g, gourdSprite(i), x, y - 34 * 1.55, 1.55, p * .03, 1 + Math.sin(t * 3.2 + i) * .012); }); } }; }

function cards(){ const wrap = $('#cards'); wrap.innerHTML = '';
  SHAPES.forEach((sh, i) => { const el = document.createElement('button'); el.className = 'card' + (i === state.s ? ' on' : ''); el.type = 'button'; el.setAttribute('aria-pressed', i === state.s);
    const cv = document.createElement('canvas'), g = hiDPI(cv, 200, 200); el.appendChild(cv);
    el.insertAdjacentHTML('beforeend', `<h3>${sh.name}</h3><p>${sh.look}</p><span class="sw"><i style="background:${sh.hue}"></i>${sh.colour}</span><span class="pw"><b>Power</b> to be decided</span>`);
    el.onclick = () => { state.s = i; render(); };
    wrap.appendChild(el);
    live.push(t => { g.clearRect(0, 0, 200, 200); const p = bob(t, i); g.globalAlpha = .3 + .12 * p; g.drawImage(halo(glowOf(sh)), 20, 10, 160, 160); g.globalAlpha = 1; blit(g, gourdSprite(i), 100, 126, 1.75, p * .04); }); }); }

function zoneScene(){ const cv = document.createElement('canvas'), w = 420, h = 420, g = hiDPI(cv, w, h); cv.className = 'zone';
  const pumps = PUMPKIN_COLS.map(c => { const s = document.createElement('canvas'); s.width = s.height = 140; const gg = s.getContext('2d'); gg.scale(2, 2); gg.translate(35, 38); pumpkin(gg, pal(c), false, 22); return s; });
  return { cv, draw(t){ const sh = SHAPES[state.s], gl = glowOf(sh), C = 118, x0 = (w - C * 3) / 2, y0 = (h - C * 3) / 2 + 10; g.fillStyle = PATCH.soil[2]; g.fillRect(0, 0, w, h);
    const pulse = .5 + .5 * Math.sin(t * 2); let n = 0;
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++){ const x = x0 + q * C, y = y0 + r * C, gr = g.createLinearGradient(0, y, 0, y + C); gr.addColorStop(0, PATCH.soil[0]); gr.addColorStop(1, PATCH.soil[1]); g.fillStyle = gr; g.beginPath(); g.roundRect(x + 4, y + 4, C - 8, C - 8, 14); g.fill();
      g.fillStyle = rgba(gl, .1 + .08 * pulse); g.fill(); g.strokeStyle = rgba(gl, .35); g.lineWidth = 1.5; g.stroke();
      if (r === 1 && q === 1) continue;
      const lift = Math.max(0, Math.sin(t * 1.4 - n * .7)) * 6; g.globalAlpha = .45 + .3 * pulse; g.drawImage(halo(gl), x + 14, y + 20, C - 28, C - 28); g.globalAlpha = 1;
      g.drawImage(pumps[n], x + C / 2 - 35, y + C / 2 - 34 - lift, 70, 70); n++; }
    g.save(); g.shadowColor = gl; g.shadowBlur = 16; g.strokeStyle = rgba(gl, .6 + .3 * pulse); g.lineWidth = 3; g.beginPath(); g.roundRect(x0, y0, C * 3, C * 3, 20); g.stroke(); g.restore();
    blit(g, gourdSprite(state.s), x0 + C * 1.5, y0 + C * 1.5 + 10, 1.25, Math.sin(t * 1.6) * .03); } }; }

/** The gourd on a real night: the game's screenshot with a gourd in the middle cell (row 3, column 4) and its 3×3 glowing.
 *  Cell maths from src/engine/state.js: W 540, CS 74, GX 11, GY = H − 26 − 5·CS, with H from the frame's aspect. */
function mapScene(){ const img = new Image(); img.src = NIGHT; const cv = document.createElement('canvas'), w = 430, h = 860, g = hiDPI(cv, w, h); cv.className = 'map';
  return { cv, draw(t){ if (!img.complete || !img.naturalWidth) return; g.drawImage(img, 0, 0, w, h);
    const k = w / 540, H = 540 * img.naturalHeight / img.naturalWidth, CS = 74, GX = 11, GY = H - 26 - 5 * CS, r0 = 2, c0 = 3, sh = SHAPES[state.s], gl = glowOf(sh), pulse = .5 + .5 * Math.sin(t * 2);
    g.save(); g.scale(k, k);
    for (let r = r0 - 1; r <= r0 + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++){ g.beginPath(); g.roundRect(GX + c * CS + 6, GY + r * CS + 6, CS - 12, CS - 12, 10); g.fillStyle = rgba(gl, .1 + .08 * pulse); g.fill(); }
    g.save(); g.shadowColor = gl; g.shadowBlur = 10; g.strokeStyle = rgba(gl, .55 + .3 * pulse); g.lineWidth = 2; g.beginPath(); g.roundRect(GX + (c0 - 1) * CS + 2, GY + (r0 - 1) * CS + 2, CS * 3 - 4, CS * 3 - 4, 14); g.stroke(); g.restore();
    blit(g, gourdSprite(state.s), GX + c0 * CS + CS / 2, GY + r0 * CS + CS / 2 - 8, .95, Math.sin(t * 1.6) * .03);   // as wide as a pumpkin, standing on the same base line, taller than its cell
    g.restore(); } }; }

let hero, zone, map, lastT = 0;
function drawAll(t){ lastT = t; hero.draw(t); zone.draw(t); map.draw(t); for (const f of live) f(t); }
function render(){ live.length = 0; cards(); $('#zoneTitle').textContent = `The ${SHAPES[state.s].name} on the patch`; $('#mapTitle').textContent = `The ${SHAPES[state.s].name} on night 1-4`; if (hero) drawAll(lastT); }
function boot(){
  hero = heroScene(); $('#heroSlot').appendChild(hero.cv); zone = zoneScene(); $('#zoneSlot').appendChild(zone.cv); map = mapScene(); $('#mapSlot').appendChild(map.cv);
  render(); drawAll(0);
  const tick = ms => { drawAll(reduce ? 0 : ms / 1000); if (!reduce) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
if (typeof document !== 'undefined') (document.fonts ? document.fonts.ready : Promise.resolve()).then(boot);
