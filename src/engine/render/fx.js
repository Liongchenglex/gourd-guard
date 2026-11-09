// ---------- Effects in the Toy Plastic language ----------
// Lightning (Deep Blue), blast (Black), hex zap and sigil (witches), the 3×3 zones (doctor, bulwark, hex),
// and the baked field props: the wooden palisade, graves, puddles, the sea tiles, the mist tiles and the castle walls.
// Everything is deterministic per frame (seeded), so nothing flickers randomly. Owner asked for these on 2026-09-26.

import { E, PL, RR, S, SM, SO, ell, mix, pal, rgba, rng } from './paint.js';
import { CS, W } from '../state.js';
import { TAU } from '../util.js';

const ease = t => 1 - (1 - t) * (1 - t);

// ---------- Deep Blue: a jagged bolt with glow, re-jittered a few times as it lives ----------
export function drawBolt(g, v){
  const p = Math.min(1, v.t / v.dur), a = p < .7 ? 1 : 1 - (p - .7) / .3, R = rng((v.seed || 1) * 31 + Math.floor(v.t / 0.07) * 7);
  const dx = v.x2 - v.x1, dy = v.y2 - v.y1, len = Math.hypot(dx, dy), n = Math.max(4, Math.round(len / 13)), nx = -dy / len, ny = dx / len;
  const pts = [[v.x1, v.y1]];
  for (let i = 1; i < n; i++){ const f = i / n, off = (R() - .5) * 30 * Math.sin(f * Math.PI); pts.push([v.x1 + dx * f + nx * off, v.y1 + dy * f + ny * off]); }
  pts.push([v.x2, v.y2]);
  const path = () => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); };
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  g.globalAlpha = a * .45; g.strokeStyle = '#6a90ff'; g.lineWidth = 14; path(); g.stroke();
  g.globalAlpha = a * .9; g.strokeStyle = '#bfe0ff'; g.lineWidth = 5.5; path(); g.stroke();
  g.globalAlpha = a; g.strokeStyle = '#ffffff'; g.lineWidth = 2.2; path(); g.stroke();
  for (let b = 0; b < 2; b++){ const i = 1 + Math.floor(R() * (pts.length - 2)), [bx, by] = pts[i], ang = Math.atan2(dy, dx) + (R() - .5) * 2.2, bl = 10 + R() * 18;
    g.globalAlpha = a * .7; g.strokeStyle = '#bfe0ff'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(ang) * bl * .6 + (R() - .5) * 6, by + Math.sin(ang) * bl * .6); g.lineTo(bx + Math.cos(ang) * bl, by + Math.sin(ang) * bl + (R() - .5) * 8); g.stroke(); }
  for (const [x, y] of [[v.x1, v.y1], [v.x2, v.y2]]){ const gr = g.createRadialGradient(x, y, 0, x, y, 26); gr.addColorStop(0, `rgba(210,230,255,${a * .8})`); gr.addColorStop(1, 'rgba(120,160,255,0)'); g.fillStyle = gr; g.fillRect(x - 26, y - 26, 52, 52); }
  g.restore();
}

// ---------- Black: fireball, shockwave, smoke, spokes, scorch ----------
export function drawBlast(g, v){
  const p = Math.min(1, v.t / v.dur), R0 = v.r || CS * 0.9, R = rng((v.seed || 3) * 17);
  g.save();
  // scorch on the ground, lingers
  g.globalAlpha = (1 - p) * .5; g.fillStyle = '#1a1014'; ell(g, v.x, v.y + R0 * .35, R0 * (.5 + .5 * ease(p)), R0 * .2); g.fill();
  // smoke puffs drifting out and up
  for (let i = 0; i < 7; i++){ const ang = (i / 7) * TAU + R() * .6, d = R0 * (.35 + .75 * ease(p)), x = v.x + Math.cos(ang) * d, y = v.y + Math.sin(ang) * d * .7 - p * 18, rr = R0 * (.16 + .22 * p) * (.8 + R() * .5);
    g.globalAlpha = Math.max(0, (1 - p) * .6); const sg = g.createRadialGradient(x - rr * .3, y - rr * .3, rr * .1, x, y, rr); sg.addColorStop(0, '#5a5060'); sg.addColorStop(1, 'rgba(30,24,34,0)'); g.fillStyle = sg; ell(g, x, y, rr, rr); g.fill(); }
  // fireball
  if (p < .8){ const q = p / .8, fr = R0 * (.3 + .7 * ease(q)); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - q * q * q;
    const fg = g.createRadialGradient(v.x, v.y - fr * .1, 0, v.x, v.y, fr); fg.addColorStop(0, '#fff8d0'); fg.addColorStop(.3, '#ffd24a'); fg.addColorStop(.65, '#ff7a1a'); fg.addColorStop(1, 'rgba(160,40,10,0)'); g.fillStyle = fg; ell(g, v.x, v.y, fr, fr * .92); g.fill();
    // spokes
    g.globalAlpha = Math.max(0, .8 - q * 1.6); g.strokeStyle = '#ffe08a'; g.lineCap = 'round';
    for (let i = 0; i < 8; i++){ const ang = i * TAU / 8 + .2, l = fr * (1.3 + R() * .5); g.lineWidth = 3 - q * 2; g.beginPath(); g.moveTo(v.x + Math.cos(ang) * fr * .5, v.y + Math.sin(ang) * fr * .5); g.lineTo(v.x + Math.cos(ang) * l, v.y + Math.sin(ang) * l); g.stroke(); }
    g.globalCompositeOperation = 'source-over'; }
  // shockwave ring
  const sr = R0 * (.3 + 1.1 * ease(p)); g.globalAlpha = Math.max(0, (1 - p) * .9); g.strokeStyle = 'rgba(255,220,150,1)'; g.lineWidth = 5 * (1 - p) + 1; ell(g, v.x, v.y, sr, sr * .72); g.stroke();
  g.globalAlpha = Math.max(0, (1 - p) * .35); g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; ell(g, v.x, v.y, sr * .88, sr * .62); g.stroke();
  g.restore();
}

// ---------- Witch hex: an arcane head streaks to the target on a curve with a trail of motes ----------
export function drawHexBolt(g, v){
  const p = Math.min(1, v.t / v.dur), R = rng((v.seed || 5) * 13);
  const cx = (v.x1 + v.x2) / 2 + (v.y2 - v.y1) * .25, cy = (v.y1 + v.y2) / 2 - (v.x2 - v.x1) * .25;
  const at = f => { const u = 1 - f; return [u * u * v.x1 + 2 * u * f * cx + f * f * v.x2, u * u * v.y1 + 2 * u * f * cy + f * f * v.y2]; };
  const gl = glowSprite(2, '#d09bff');
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 10; i++){ const f = Math.max(0, p - i * .045); if (f <= 0) continue; const [x, y] = at(f), rr = 4.5 - i * .35, a = (1 - i / 10) * (p < .9 ? 1 : (1 - p) * 10);
    g.globalAlpha = a * .8; g.fillStyle = i % 2 ? '#d09bff' : '#f4e6ff'; ell(g, x + (R() - .5) * 4, y + (R() - .5) * 4, rr, rr); g.fill(); }
  const [hx, hy] = at(Math.min(1, p));
  g.globalAlpha = p < .9 ? 1 : (1 - p) * 10; g.drawImage(gl.c, hx - 20, hy - 20, 40, 40); g.fillStyle = '#fff4ff'; ell(g, hx, hy, 4, 4); g.fill();
  g.restore();
}
function star(g, x, y, r, rot){ g.beginPath(); for (let i = 0; i < 8; i++){ const a = rot + i * Math.PI / 4, rr = i % 2 ? r * .4 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
/** A spinning rune circle with a pentagram over the hexed monster, in the colour it was locked to; reverse hexes get a red X. */
let sigilCache = new Map();
function sigilSprite(col, reverse){
  const key = col + (reverse ? 'x' : ''); if (sigilCache.has(key)) return sigilCache.get(key);
  const R = 40, pad = 12, sz = (R + pad) * 2, c = document.createElement('canvas'); c.width = c.height = sz * 2; const g = c.getContext('2d'); g.scale(2, 2); g.translate(R + pad, R + pad);
  const gg = g.createRadialGradient(0, 0, 0, 0, 0, R); gg.addColorStop(0, rgba(col, .35)); gg.addColorStop(1, rgba(col, 0)); g.fillStyle = gg; g.fillRect(-R, -R, R * 2, R * 2);
  g.strokeStyle = col; g.lineWidth = 2.6; g.shadowColor = col; g.shadowBlur = 10;
  g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, R * .8, 0, TAU); g.lineWidth = 1.2; g.stroke();
  g.beginPath(); for (let i = 0; i < 5; i++){ const ang = -Math.PI / 2 + i * TAU * 2 / 5; g.lineTo(Math.cos(ang) * R * .78, Math.sin(ang) * R * .78); } g.closePath(); g.lineWidth = 2.2; g.stroke();
  for (let i = 0; i < 12; i++){ const ang = i * TAU / 12; g.beginPath(); g.moveTo(Math.cos(ang) * R * .84, Math.sin(ang) * R * .84); g.lineTo(Math.cos(ang) * R * (i % 3 ? .92 : .98), Math.sin(ang) * R * (i % 3 ? .92 : .98)); g.stroke(); }
  if (reverse){ g.strokeStyle = '#ff3a3a'; g.lineWidth = 4.5; g.lineCap = 'round'; g.shadowColor = '#ff3a3a'; g.beginPath(); g.moveTo(-R * .45, -R * .45); g.lineTo(R * .45, R * .45); g.moveTo(R * .45, -R * .45); g.lineTo(-R * .45, R * .45); g.stroke(); }
  const sp = { c, half:R + pad }; sigilCache.set(key, sp); return sp;
}
/** A spinning rune circle with a pentagram over the hexed monster, in the colour it was locked to; reverse hexes get a red X. Baked once per colour. */
export function drawSigil(g, v){
  const p = Math.min(1, v.t / v.dur), a = p < .2 ? p / .2 : p > .7 ? (1 - p) / .3 : 1, sc = (.6 + .5 * ease(Math.min(1, p / .3))) * .75, sp = sigilSprite(v.col || '#d09bff', !!v.reverse);
  g.save(); g.translate(v.x, v.y); g.rotate(v.t * 2.2); g.scale(sc, sc); g.globalAlpha = a; g.globalCompositeOperation = 'lighter';
  g.drawImage(sp.c, -sp.half, -sp.half, sp.half * 2, sp.half * 2);
  g.restore();
}

// ---------- 3×3 zones ----------
function zoneBase(g, x, y, w, h, col, a, t){
  const gr = g.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, Math.max(w, h) * .65); gr.addColorStop(0, rgba(col, .22 * a)); gr.addColorStop(1, rgba(col, .04 * a));
  g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, 14); g.fill();
  g.strokeStyle = rgba(col, .5 * a); g.lineWidth = 1.5; g.beginPath(); g.roundRect(x, y, w, h, 14); g.stroke();
  g.strokeStyle = rgba(col, .9 * a); g.lineWidth = 3; g.lineCap = 'round'; const L = 14;
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]){ g.beginPath(); g.moveTo(cx, cy + sy * L); g.lineTo(cx, cy); g.lineTo(cx + sx * L, cy); g.stroke(); }
}
function motes(g, x, y, w, h, n, t, seed, fn){ const R = rng(seed); for (let i = 0; i < n; i++){ const ph = R(), sx = x + 10 + R() * (w - 20), sp = .12 + R() * .1, f = (t * sp + ph) % 1, my = y + h - 8 - f * (h - 16), a = Math.sin(f * Math.PI); fn(sx + Math.sin(t * 2 + i) * 4, my, a, i); } }
// Zone backdrops are baked once per size and scale, then blitted with a pulsing alpha; only the cheap moving bits stay live.
// (2026-11-03: the Bulwark aura drew ~300 strokes and 8 painter rivets per Bulwark per frame, and 6-20 lagged on the owner's phone.)
function zoneSprite(kind, w, h, k, fn){
  const pad = 4, key = 'zone:' + kind + ':' + Math.round(w) + 'x' + Math.round(h) + ':' + bakeK(k).toFixed(2);
  return bake(key, w + pad * 2, h + pad * 2, pad, pad, bakeK(k), g => fn(g, 0, 0, w, h));
}
const blitZone = (g, sp, x, y, a) => { g.save(); g.globalAlpha = a; g.drawImage(sp.c, x - sp.ox, y - sp.oy, sp.w, sp.h); g.restore(); };
/** Plague Doctor: green, a slow rune ring at the centre, rising crosses. */
export function drawHealZoneFx(g, x, y, w, h, t, k){
  const pulse = .5 + .5 * Math.sin(t * 3), col = '#8ee88a', cx = x + w / 2, cy = y + h / 2;
  blitZone(g, zoneSprite('heal', w, h, k, (z, zx, zy, zw, zh) => zoneBase(z, zx, zy, zw, zh, col, 1, 0)), x, y, .8 + .2 * pulse);
  g.save(); g.globalAlpha = .45 + .25 * pulse; g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, CS * .95, 0, TAU); g.stroke();
  g.translate(cx, cy); g.rotate(t * .6); g.fillStyle = col;
  for (let i = 0; i < 8; i++){ const ang = i * TAU / 8, px = Math.cos(ang) * CS * .95, py = Math.sin(ang) * CS * .95; g.fillRect(px - 4, py - 1.2, 8, 2.4); g.fillRect(px - 1.2, py - 4, 2.4, 8); }
  g.restore();
  g.save(); motes(g, x, y, w, h, 7, t, 91, (mx, my, a) => { g.globalAlpha = a * .8; g.fillStyle = '#c8ffc0'; g.fillRect(mx - 4, my - 1.3, 8, 2.6); g.fillRect(mx - 1.3, my - 4, 2.6, 8); }); g.restore();
}
/** Plague Doctor 2 (Release 5): the same 3x3, in poison green: a dim bog wash, a ring of ticks and a few mould blotches, all baked into the one sprite; only its alpha pulses live. */
function rotZoneBack(g, x, y, w, h){
  const col = '#8fcf3a', cx = x + w / 2, cy = y + h / 2, R = rng(23);
  zoneBase(g, x, y, w, h, col, 1, 0);
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 14); g.clip();
  for (let i = 0; i < 9; i++){ const bx = x + 14 + R() * (w - 28), by = y + 14 + R() * (h - 28), br = 6 + R() * 12; g.fillStyle = rgba(i % 2 ? '#3f5a1a' : '#a8e05a', .16); g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill(); }
  g.restore();
  g.strokeStyle = rgba(col, .6); g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, CS * .95, 0, TAU); g.stroke();
  g.fillStyle = col;
  for (let i = 0; i < 12; i++){ const ang = i * TAU / 12, px = cx + Math.cos(ang) * CS * .95, py = cy + Math.sin(ang) * CS * .95; g.beginPath(); g.arc(px, py, i % 3 ? 2 : 3.4, 0, TAU); g.fill(); }
}
export function drawRotZoneFx(g, x, y, w, h, t, k){
  const pulse = .5 + .5 * Math.sin(t * 2.4);
  blitZone(g, zoneSprite('rot', w, h, k, rotZoneBack), x, y, .75 + .25 * pulse);
}
/** The Storm Marshal's rally square (Release 8): the same 3x3, in command crimson with a faint lightning-blue rim and a ring of pennant ticks, one baked sprite per size; only its alpha pulses. */
function rallyZoneBack(g, x, y, w, h){
  const col = '#ff4a5c', cx = x + w / 2, cy = y + h / 2, R = rng(53);
  zoneBase(g, x, y, w, h, col, 1, 0);
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 14); g.clip(); g.strokeStyle = rgba('#9fc0ff', .22); g.lineWidth = 1.2;
  for (let i = 0; i < 6; i++){ const bx = x + 10 + R() * (w - 20); g.beginPath(); g.moveTo(bx, y); g.lineTo(bx + (R() - .5) * 30, y + h * .45); g.lineTo(bx + (R() - .5) * 30, y + h); g.stroke(); }
  g.restore();
  g.strokeStyle = rgba(col, .6); g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, CS * .95, 0, TAU); g.stroke();
  g.fillStyle = col;
  for (let i = 0; i < 12; i++){ const ang = i * TAU / 12, px = cx + Math.cos(ang) * CS * .95, py = cy + Math.sin(ang) * CS * .95; g.save(); g.translate(px, py); g.rotate(ang); g.beginPath(); g.moveTo(-2, -3); g.lineTo(5, 0); g.lineTo(-2, 3); g.closePath(); g.fill(); g.restore(); }
}
export function drawRallyZoneFx(g, x, y, w, h, t, k, a){
  const pulse = .5 + .5 * Math.sin(t * 4);
  blitZone(g, zoneSprite('rally', w, h, k, rallyZoneBack), x, y, a * (.75 + .25 * pulse));
}
/** The Fallen Poltergeist's black fog (Release 5): Plague Doctor 2's square and geometry, darker: a black-green fog wash with curls of black fog and a
 *  dim poison rim, its own sprite baked once per size (`zoneSprite('blackfog')`). a fades it in and out; only that and the pulse are live. */
function blackFogBack(g, x, y, w, h){
  const col = '#5f9a2c', R = rng(41);
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 14); g.clip();
  let gr = g.createRadialGradient(x + w / 2, y + h / 2, 8, x + w / 2, y + h / 2, Math.max(w, h) * .7); gr.addColorStop(0, rgba('#050c07', .62)); gr.addColorStop(1, rgba('#132a18', .38));
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  for (let i = 0; i < 14; i++){ const bx = x + 10 + R() * (w - 20), by = y + 10 + R() * (h - 20), br = 10 + R() * 18;
    gr = g.createRadialGradient(bx, by, 0, bx, by, br); gr.addColorStop(0, rgba(i % 3 ? '#071009' : '#1b3620', .55)); gr.addColorStop(1, rgba('#071009', 0)); g.fillStyle = gr; g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill(); }
  g.restore();
  zoneBase(g, x, y, w, h, col, .8, 0);
  g.fillStyle = rgba('#8cff5c', .55);
  for (let i = 0; i < 10; i++){ const px = x + 12 + R() * (w - 24), py = y + 12 + R() * (h - 24); g.beginPath(); g.arc(px, py, 1.4 + R() * 1.4, 0, TAU); g.fill(); }   // poison motes caught in it
}
export function drawBlackFogZoneFx(g, x, y, w, h, t, k, a){
  const pulse = .5 + .5 * Math.sin(t * 2);
  blitZone(g, zoneSprite('blackfog', w, h, k, blackFogBack), x, y, a * (.8 + .2 * pulse));
}
/** Bulwark Knight: steel plates, a riveted rim (baked), a live pulse ring. */
function bulwarkBack(g, x, y, w, h){
  const col = '#9fb4dc', cx = x + w / 2, cy = y + h / 2;
  zoneBase(g, x, y, w, h, col, 1, 0);
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 14); g.clip(); g.strokeStyle = rgba(col, .16); g.lineWidth = 1;
  const s = 16; for (let r = 0; r < h / (s * 1.5) + 1; r++) for (let c = 0; c < w / (s * 1.75) + 1; c++){ const hx = x + c * s * 1.75 + (r % 2 ? s * .87 : 0), hy = y + r * s * 1.5; g.beginPath(); for (let i = 0; i < 6; i++){ const ang = i * TAU / 6 + Math.PI / 6; g.lineTo(hx + Math.cos(ang) * s * .5, hy + Math.sin(ang) * s * .5); } g.closePath(); g.stroke(); }
  g.restore();
  g.save(); g.strokeStyle = rgba('#dfe8f8', .8); g.lineWidth = 3; g.beginPath(); g.roundRect(x + 3, y + 3, w - 6, h - 6, 12); g.stroke();
  const ST = pal('#aab3c4'); for (const [rx, ry] of [[x + 12, y + 12], [x + w - 12, y + 12], [x + 12, y + h - 12], [x + w - 12, y + h - 12], [cx, y + 8], [cx, y + h - 8], [x + 8, cy], [x + w - 8, cy]]) S.rivet(g, rx, ry, 3.2, ST);
  g.restore();
}
export function drawBulwarkZoneFx(g, x, y, w, h, t, k){
  const pulse = .5 + .5 * Math.sin(t * 2.5), cx = x + w / 2, cy = y + h / 2;
  blitZone(g, zoneSprite('bulwark', w, h, k, bulwarkBack), x, y, .75 + .25 * pulse);
  const q = (t * .8) % 1, pr = 10 + q * CS * 1.4; g.save(); g.globalAlpha = (1 - q) * .6; g.strokeStyle = '#cfe0ff'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, pr, 0, TAU); g.stroke(); g.restore();
}
const hexSprite = (w, h, k) => zoneSprite('hex', w, h, k, (z, zx, zy, zw, zh) => zoneBase(z, zx, zy, zw, zh, '#c07cff', 1, 0));
/** The Ash Crone's 3x3 zone (Release 7): the Hexwitch's purple box, but with its dashed rim, sigil and skull motes baked into the one sprite
 *  (`zoneSprite('crone')`, prebaked on a night that can spawn her); only its alpha pulses live, one drawImage a zone. (Story zones above keep their live sigil.) */
function croneBack(g, x, y, w, h){
  const col = '#c07cff', R = rng(57);
  zoneBase(g, x, y, w, h, col, 1, 0);
  g.save(); g.strokeStyle = rgba(col, .7); g.lineWidth = 2; g.setLineDash([6, 6]); g.beginPath(); g.roundRect(x + 2, y + 2, w - 4, h - 4, 12); g.stroke(); g.restore();
  const nx = Math.max(1, Math.round(w / (CS * 2.2))), ny = Math.max(1, Math.round(h / (CS * 2.2)));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++){ const cx = x + (i + .5) * w / nx, cy = y + (j + .5) * h / ny, r = Math.min(CS * .8, w / nx * .4, h / ny * .4);
    g.save(); g.translate(cx, cy); g.globalAlpha = .5; g.strokeStyle = col; g.lineWidth = 1.5;
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.beginPath(); for (let q = 0; q < 5; q++){ const ang = -Math.PI / 2 + q * TAU * 2 / 5; g.lineTo(Math.cos(ang) * r * .8, Math.sin(ang) * r * .8); } g.closePath(); g.stroke();
    for (let q = 0; q < 10; q++){ const ang = q * TAU / 10; g.beginPath(); g.moveTo(Math.cos(ang) * r * .85, Math.sin(ang) * r * .85); g.lineTo(Math.cos(ang) * r * .96, Math.sin(ang) * r * .96); g.stroke(); }
    g.restore(); }
  for (let i = 0; i < Math.round(w * h / (CS * CS) * .6) + 2; i++){ const mx = x + 10 + R() * (w - 20), my = y + 10 + R() * (h - 20), a = .3 + R() * .4;
    g.globalAlpha = a * .7; g.fillStyle = '#e8d8ff'; ell(g, mx, my, 4.5, 5); g.fill(); g.fillStyle = '#4a2a6a'; ell(g, mx - 1.8, my - .8, 1.2, 1.5); g.fill(); ell(g, mx + 1.8, my - .8, 1.2, 1.5); g.fill(); }
  g.globalAlpha = 1;
}
const croneSprite = (w, h, k) => zoneSprite('crone', w, h, k, croneBack);
export function drawCroneZoneFx(g, x, y, w, h, t, a, k){ blitZone(g, croneSprite(w, h, k), x, y, a * (.8 + .2 * (.5 + .5 * Math.sin(t * 3)))); }
/** Bake her zone's sprite now (render/witchwood.js prebakeCroneZone, at night start). */
export const prebakeHexZone = (w, h, k) => { croneSprite(w, h, k); };
/** Hexwitch zones: purple, a spinning sigil every couple of tiles, ghostly skull motes drifting up. */
export function drawHexZoneFx(g, x, y, w, h, t, a, k){
  const pulse = .5 + .5 * Math.sin(t * 3), col = '#c07cff';
  blitZone(g, hexSprite(w, h, k), x, y, a * (.8 + .2 * pulse));
  g.save(); g.strokeStyle = rgba(col, a * (.5 + .3 * pulse)); g.lineWidth = 2; g.setLineDash([6, 6]); g.lineDashOffset = t * 24; g.beginPath(); g.roundRect(x + 2, y + 2, w - 4, h - 4, 12); g.stroke(); g.setLineDash([]);
  const nx = Math.max(1, Math.round(w / (CS * 2.2))), ny = Math.max(1, Math.round(h / (CS * 2.2)));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++){ const cx = x + (i + .5) * w / nx, cy = y + (j + .5) * h / ny, r = Math.min(CS * .8, w / nx * .4, h / ny * .4);
    g.save(); g.translate(cx, cy); g.rotate(t * 1.2 * (i + j) % 2 ? t : -t); g.globalAlpha = a * (.35 + .2 * pulse); g.strokeStyle = col; g.lineWidth = 1.5;
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.beginPath(); for (let k = 0; k < 5; k++){ const ang = -Math.PI / 2 + k * TAU * 2 / 5; g.lineTo(Math.cos(ang) * r * .8, Math.sin(ang) * r * .8); } g.closePath(); g.stroke();
    for (let k = 0; k < 10; k++){ const ang = k * TAU / 10; g.beginPath(); g.moveTo(Math.cos(ang) * r * .85, Math.sin(ang) * r * .85); g.lineTo(Math.cos(ang) * r * .96, Math.sin(ang) * r * .96); g.stroke(); }
    g.restore(); }
  motes(g, x, y, w, h, Math.round(w * h / (CS * CS) * .6) + 2, t, 57, (mx, my, ma) => { g.globalAlpha = a * ma * .7; g.fillStyle = '#e8d8ff'; ell(g, mx, my, 4.5, 5); g.fill(); g.fillStyle = '#4a2a6a'; ell(g, mx - 1.8, my - .8, 1.2, 1.5); g.fill(); ell(g, mx + 1.8, my - .8, 1.2, 1.5); g.fill(); });
  g.restore();
}

/** The Fallen Hexwitch's undead zone (Release 7): a 5x5 box in ash and blood red, its rune circles, ash motes and grave dust all baked into one
 *  sprite per size (`zoneSprite('undead')`, prebaked on her night); only its alpha pulses live, one drawImage a zone. */
function undeadZoneBack(g, x, y, w, h){
  const col = '#ff2a3a', ash = '#9a9aa2', R = rng(67);
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 16); g.clip();
  let gr = g.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, Math.max(w, h) * .7); gr.addColorStop(0, rgba('#2a0a10', .34)); gr.addColorStop(1, rgba('#1a1a1e', .2));
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  for (let i = 0; i < 16; i++){ const bx = x + 12 + R() * (w - 24), by = y + 12 + R() * (h - 24), br = 10 + R() * 20;
    gr = g.createRadialGradient(bx, by, 0, bx, by, br); gr.addColorStop(0, rgba(i % 3 ? '#3a3a40' : '#5a0a14', .32)); gr.addColorStop(1, rgba('#3a3a40', 0)); g.fillStyle = gr; g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill(); }
  g.restore();
  zoneBase(g, x, y, w, h, col, .85, 0);
  g.save(); g.strokeStyle = rgba(ash, .45); g.lineWidth = 2; g.setLineDash([7, 7]); g.beginPath(); g.roundRect(x + 4, y + 4, w - 8, h - 8, 13); g.stroke(); g.restore();
  for (const [fx, fy, fr] of [[.5, .5, .2], [.24, .24, .1], [.76, .24, .1], [.24, .76, .1], [.76, .76, .1]]){   // a great rune circle and four small ones
    const cx = x + fx * w, cy = y + fy * h, r = Math.min(w, h) * fr;
    g.strokeStyle = rgba(col, .5); g.lineWidth = 1.6; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
    g.beginPath(); for (let k = 0; k < 5; k++){ const a = -Math.PI / 2 + k * TAU * 2 / 5; g.lineTo(cx + Math.cos(a) * r * .8, cy + Math.sin(a) * r * .8); } g.closePath(); g.stroke();
    g.strokeStyle = rgba(ash, .4); for (let k = 0; k < 12; k++){ const a = k * TAU / 12; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * .86, cy + Math.sin(a) * r * .86); g.lineTo(cx + Math.cos(a) * r * 1.02, cy + Math.sin(a) * r * 1.02); g.stroke(); }
  }
  for (let i = 0; i < 22; i++){ const mx = x + 10 + R() * (w - 20), my = y + 10 + R() * (h - 20), a = .35 + R() * .4;   // little skull motes of ash, one with red eyes now and then
    g.fillStyle = rgba('#d8d4cc', a); ell(g, mx, my, 4, 4.5); g.fill(); g.fillStyle = i % 4 ? rgba('#2a2a30', a) : rgba(col, a + .2); ell(g, mx - 1.6, my - .7, 1.1, 1.3); g.fill(); ell(g, mx + 1.6, my - .7, 1.1, 1.3); g.fill(); }
}
const undeadSprite = (w, h, k) => zoneSprite('undead', w, h, k, undeadZoneBack);
export function drawUndeadZoneFx(g, x, y, w, h, t, a, k){
  const pulse = .5 + .5 * Math.sin(t * 2.6);
  blitZone(g, undeadSprite(w, h, k), x, y, a * (.78 + .22 * pulse));
}
/** Bake her zone's sprite at size w x h now (render/witchwood.js prebakeFallenHex, at night start). */
export const prebakeUndeadZone = (w, h, k) => { undeadSprite(w, h, k); };

// ---------- baked field props ----------
// Each prop is painted once per canvas scale `k` into an offscreen canvas and blitted every frame (60 fps on a phone).
// A sprite is { c, w, h, ox, oy }: draw it at (x - ox, y - oy, w, h) so its local origin lands on (x, y).
const bakeK = k => Math.min(2.5, Math.max(.5, k || 1));
let propCache = new Map();
function bake(key, w, h, ox, oy, k, fn){
  let sp = propCache.get(key); if (sp) return sp;
  const c = document.createElement('canvas'); c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
  const g = c.getContext('2d'); g.scale(k, k); g.translate(ox, oy); fn(g);
  sp = { c, w, h, ox, oy }; propCache.set(key, sp); return sp;
}
export function resetProps(){ propCache = new Map(); }

// ---------- the Triptych Sprite's barrier (Release 7; ported from docs/archive/nightmare-monsters/witches-mirror/grand_mirror.js) ----------
// A wall of mirror glass across `lanes` lanes, standing BARRIER_H tall on y = 0, centred on x = 0, in game pixels: one arched pane per lane in a
// tarnished silver frame, posts with red-gem finials on the lane lines, fine cracks, and a sheen band at offset k (-1..1 across the wall).
// Baked into BARRIER_N sheen frames per lane count (2 at the field's edge, 3 elsewhere), each on first sight; one drawImage per barrier a frame.
export const BARRIER_H = 50, BARRIER_N = 6;
const barrierArch = (x, y, w, h) => g => { const r = w / 2; g.beginPath(); g.moveTo(x - r, y + h / 2); g.lineTo(x - r, y - h / 2 + r); g.arc(x, y - h / 2 + r, r, Math.PI, 0); g.lineTo(x + r, y + h / 2); g.closePath(); };
function barrier(g, lanes, cs, h, k){
  const W = lanes * cs, x0 = -W / 2, F = { base:'#a6a6b2', light:mix('#a6a6b2', '#ffffff', .45), dark:mix('#a6a6b2', '#141416', .42), deep:mix('#a6a6b2', '#060608', .68), rim:mix('#a6a6b2', '#ffffff', .6) };
  // soft glow on the ground and a pale haze behind
  let gr = g.createLinearGradient(0, -h - 16, 0, 6); gr.addColorStop(0, 'rgba(210,228,255,0)'); gr.addColorStop(.7, 'rgba(210,228,255,.18)'); gr.addColorStop(1, 'rgba(210,228,255,0)'); g.fillStyle = gr; g.fillRect(x0 - 6, -h - 16, W + 12, h + 22);
  S.shadow(g, 0, 2, W * .55, 6);
  for (let i = 0; i < lanes; i++){
    const cx = x0 + cs * (i + .5), pw = cs - 14, ph = h - 8;
    const pane = barrierArch(cx, -ph / 2 - 4, pw, ph);
    S.part(g, barrierArch(cx, -ph / 2 - 4, pw + 6, ph + 5), F, { x:cx, y:-h / 2, r:h * .7 }, { mat:'metal', flat:true, lw:1.4 });
    // glass with a sheen continuous across the whole wall
    g.save(); g.shadowColor = '#d8ecff'; g.shadowBlur = 10; pane(g); g.fillStyle = 'rgba(150,180,220,.7)'; g.fill(); g.restore();
    g.save(); pane(g); g.clip();
    const gl = g.createLinearGradient(cx - pw / 2, -h, cx + pw / 2, 0); gl.addColorStop(0, 'rgba(255,255,255,.95)'); gl.addColorStop(.5, 'rgba(196,220,248,.82)'); gl.addColorStop(1, 'rgba(110,140,196,.8)'); g.fillStyle = gl; g.fillRect(cx - pw, -h - 4, pw * 2, h + 8);
    const o = k * W * .6 - cx;
    for (const [a, b, al] of [[-.22, -.06, .7], [.02, .08, .45], [.16, .19, .35]]){ g.fillStyle = `rgba(255,255,255,${al})`; g.beginPath(); g.moveTo(o + a * W, 0); g.lineTo(o + a * W + h * .55, -h); g.lineTo(o + b * W + h * .55, -h); g.lineTo(o + b * W, 0); g.closePath(); g.fill(); }
    // a faint reflection of the field: a darker band low in the glass
    gr = g.createLinearGradient(0, -14, 0, 0); gr.addColorStop(0, 'rgba(40,50,70,0)'); gr.addColorStop(1, 'rgba(40,50,70,.35)'); g.fillStyle = gr; g.fillRect(cx - pw, -14, pw * 2, 14);
    const R = rng(17 + i * 5); g.strokeStyle = 'rgba(30,30,50,.4)'; g.lineWidth = .8;   // fine cracks spidering from one point
    const px = cx + (R() - .5) * pw * .5, py = -ph * (.3 + R() * .3); g.beginPath(); for (let j = 0; j < 5; j++){ const a = R() * TAU, l = 6 + R() * 10; g.moveTo(px, py); g.lineTo(px + Math.cos(a) * l * .5 + 1, py + Math.sin(a) * l * .5); g.lineTo(px + Math.cos(a + .2) * l, py + Math.sin(a + .2) * l); } g.stroke();
    g.restore();
    S.stroke(g, pane, F, 1.2, .7);
    // a glint star near the top of each pane
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.2; const sx = cx + pw * .22, sy = -ph + 6; g.beginPath(); g.moveTo(sx - 4, sy); g.lineTo(sx + 4, sy); g.moveTo(sx, sy - 4); g.lineTo(sx, sy + 4); g.stroke();
  }
  // base rail and posts on the lane lines with gem finials
  S.part(g, RR(x0 + 2, -5, W - 4, 7, 3), F, { x:0, y:-1, r:W * .5 }, { mat:'metal', flat:true, lw:1.2 });
  for (let i = 0; i <= lanes; i++){ const px = x0 + cs * i + (i === 0 ? 5 : i === lanes ? -5 : 0);
    S.part(g, RR(px - 3.5, -h + 2, 7, h, 2.5), F, { x:px, y:-h / 2, r:h * .5 }, { mat:'metal', flat:true, lw:1.2 });
    S.part(g, PL([[px - 4, -h + 3], [px, -h - 9], [px + 4, -h + 3]]), F, { x:px, y:-h - 2, r:6 }, { flat:true, mat:'metal', lw:1 });
    g.save(); g.shadowColor = '#ff2a3a'; g.shadowBlur = 6; S.dot(g, E(px, -h - 1, 2.8, 3), '#e8101e'); g.restore(); S.dot(g, E(px - 1, -h - 2.2, 1, 1), '#fff', .8);
    S.rivet(g, px, -10, 1.6, F); S.rivet(g, px, -h * .55, 1.6, F); }
}
/** Sheen frame i of the barrier across `lanes` lanes, baked at scale k; its origin is the middle of the wall's base line. */
export function barrierSprite(k, lanes, i){
  k = bakeK(k); const pad = 20, w = lanes * CS + 24, h = BARRIER_H + pad + 12;
  return bake(`barrier:${k}:${lanes}:${i}`, w, h, w / 2, pad + BARRIER_H, k, g => barrier(g, lanes, CS, BARRIER_H, -1.2 + 2.4 * i / BARRIER_N));
}
/** Test hook: how many barrier frames are baked. */
export const barrierBaked = () => [...propCache.keys()].filter(k => k.startsWith('barrier:')).length;
/** Blit the barrier with its base line's middle at (x, y), scaled by s, at alpha a; the sheen sweeps across with the clock t. */
export function drawBarrierFx(g, x, y, lanes, t, k, s, a){
  const sp = barrierSprite(k, lanes, Math.floor(t * 5) % BARRIER_N);
  const ga = g.globalAlpha; g.globalAlpha = ga * a;
  g.drawImage(sp.c, x - sp.ox * s, y - sp.oy * s, sp.w * s, sp.h * s);
  g.globalAlpha = ga;
}
export const resetCastles = resetProps;

// ---------- the Fallen Hexwitch's altar (Release 7) ----------
// A low stone altar on a plinth, ash-grey with a bone-white cloth hanging torn down its front, a skull on top with red eyes between two black candles
// with red flames, and a red rune carved in the stone. Three crack states (0 whole, 1 cracked, 2 shattered and chipped), each baked once per scale;
// its origin is the middle of its base line. One drawImage an altar a frame.
export const ALTAR_W = 52, ALTAR_H = 58, ALTAR_STATES = 3;
function altar(g, st){
  const ST = { base:'#7c7c84', light:mix('#7c7c84', '#ffffff', .4), dark:mix('#7c7c84', '#141416', .42), deep:mix('#7c7c84', '#060608', .68), rim:mix('#7c7c84', '#ffffff', .6) };
  const CL = { base:'#d4d0c8', light:mix('#d4d0c8', '#ffffff', .45), dark:mix('#d4d0c8', '#141416', .42), deep:mix('#d4d0c8', '#060608', .68), rim:'#ffffff' };
  const BONE = { base:'#e6e2da', light:'#ffffff', dark:mix('#e6e2da', '#141416', .42), deep:mix('#e6e2da', '#060608', .68), rim:'#ffffff' };
  const WAX = { base:'#26262a', light:'#55555c', dark:'#141416', deep:'#060608', rim:'#7a7a80' };
  S.shadow(g, 0, 1, 30, 7);
  S.part(g, RR(-26, -12, 52, 13, 3), ST, { x:0, y:-6, r:26 }, { mat:'stone', lw:1.4 });   // plinth
  S.part(g, RR(-20, -36, 40, 26, 3), ST, { x:0, y:-24, r:22 }, { mat:'stone', lw:1.4 });   // body
  S.part(g, RR(-25, -42, 50, 8, 3), ST, { x:0, y:-38, r:26 }, { mat:'stone', lw:1.4 });   // top slab
  S.part(g, PL([[-14, -36], [14, -36], [12, -18], [7, -22], [3, -15], [-2, -21], [-7, -16], [-12, -20]]), CL, { x:0, y:-28, r:14 }, { mat:'cloth', flat:true, lw:1 });   // the torn cloth
  g.save(); g.shadowColor = '#ff2a3a'; g.shadowBlur = 6; g.strokeStyle = '#ff2a3a'; g.lineWidth = 1.6; g.lineCap = 'round';   // the rune on the cloth
  g.beginPath(); g.moveTo(0, -33); g.lineTo(0, -22); g.moveTo(-4, -30); g.lineTo(4, -25); g.moveTo(4, -30); g.lineTo(-4, -25); g.stroke(); g.restore();
  for (const sx of [-1, 1]){   // two black candles with red flames
    const cx = sx * 17;
    S.part(g, RR(cx - 3, -56, 6, 14, 2), WAX, { x:cx, y:-49, r:5 }, { flat:true, lw:1 });
    S.dot(g, E(cx + sx * 2.6, -48, 1.4, 3), '#3a3a40');   // a wax drip
    g.save(); g.shadowColor = '#ff2a3a'; g.shadowBlur = 8; S.dot(g, PL([[cx - 2.6, -56], [cx, -64], [cx + 2.6, -56]]), '#ff3a3a'); g.restore(); S.dot(g, E(cx, -57.5, 1, 1.6), '#ffd0c0');
  }
  S.part(g, SM([[-8, -42], [-9, -50], [-5, -56], [5, -56], [9, -50], [8, -42]]), BONE, { x:0, y:-49, r:9 }, { mat:'bone', lw:1.2 });   // the skull
  S.dot(g, RR(-5, -44, 10, 3, 1), '#2a2a30');
  for (const ex of [-3.4, 3.4]){ S.dot(g, E(ex, -49.5, 2.3, 2.6), '#120608'); g.save(); g.shadowColor = '#ff2a3a'; g.shadowBlur = 6; S.dot(g, E(ex, -49.5, 1.1, 1.2), '#ff3a3a'); g.restore(); }
  if (st >= 1) crack(g, [[-18, -40], [-12, -33], [-14, -26], [-8, -19]], 1.4, .8), crack(g, [[16, -12], [12, -6], [15, -1]], 1.2, .7), crack(g, [[22, -40], [17, -36]], 1.1, .7);
  if (st >= 2){
    crack(g, [[6, -42], [9, -34], [5, -28], [10, -20], [7, -12]], 1.6, .9); crack(g, [[-24, -10], [-18, -6], [-21, 0]], 1.4, .85); crack(g, [[-5, -55], [-2, -50]], 1, .8);
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.beginPath(); g.moveTo(25, -42); g.lineTo(18, -42); g.lineTo(25, -34); g.closePath(); g.fill(); g.restore();   // a chipped corner
    for (const [cx, cy] of [[-30, -2], [30, -1], [26, 0]]) S.part(g, E(cx, cy, 2.6, 1.8), ST, { x:cx, y:cy, r:3 }, { flat:true, mat:'stone', lw:.8 });   // rubble at its foot
  }
}
/** Crack state st (0 whole .. 2 shattered) of the altar, baked at scale k. */
export function altarSprite(k, st){ k = bakeK(k); return bake(`altar:${k}:${st}`, ALTAR_W + 24, ALTAR_H + 22, ALTAR_W / 2 + 12, ALTAR_H + 12, k, g => altar(g, st)); }
/** Test hook: [altar frames baked, her zone sizes baked]. */
export const hexZoneBaked = () => [...propCache.keys()].filter(k => k.startsWith('zone:crone:')).length;   // test hook (Release 7)
export const fallenHexBaked = () => [[...propCache.keys()].filter(k => k.startsWith('altar:')).length, [...propCache.keys()].filter(k => k.startsWith('zone:undead:')).length];

const path = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
/** A groove: a dark line with a lit lower-right lip, so cracks read as depth rather than ink. */
function crack(g, pts, w = 1.6, a = .85){
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.save(); g.translate(.8, .8); path(g, pts); g.strokeStyle = `rgba(255,240,220,${a * .4})`; g.lineWidth = w; g.stroke(); g.restore();
  path(g, pts); g.strokeStyle = `rgba(22,12,18,${a})`; g.lineWidth = w; g.stroke();
}
/** Jagged polyline from (x0,y0) to (x1,y1) with n segments and sideways wobble `amp`. */
function jag(R, x0, y0, x1, y1, n, amp){ const pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; for (let i = 1; i < n; i++){ const f = i / n, o = (R() - .5) * amp; pts.push([x0 + dx * f + nx * o, y0 + dy * f + ny * o]); } pts.push([x1, y1]); return pts; }
/** Horizontal wood grain inside a clip (the painter's `wood` material runs vertically, for planks). */
function grainH(g, clip, x0, x1, y0, y1, c, R){ g.save(); clip(g); g.clip(); g.strokeStyle = rgba(c.deep, .38); g.lineWidth = .9; for (let i = 0; i < 3; i++){ const y = y0 + (y1 - y0) * (.25 + i * .25) + (R() - .5) * 2; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + (R() - .5) * 3, x1, y); g.stroke(); } g.strokeStyle = 'rgba(255,235,200,.32)'; g.beginPath(); g.moveTo(x0, y0 + 1.2); g.lineTo(x1, y0 + 1.2); g.stroke(); g.restore(); }
/** A twisted rope along a polyline. */
function rope(g, pts, c, w = 5){
  S.tube(g, SO(pts), c, w);
  g.strokeStyle = rgba(c.deep, .55); g.lineWidth = 1; g.lineCap = 'round';
  for (let s = 0; s < pts.length - 1; s++){ const [ax, ay] = pts[s], [bx, by] = pts[s + 1], L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L, px = -uy, py = ux;
    for (let d = 2; d < L; d += 3.2){ const x = ax + ux * d, y = ay + uy * d; g.beginPath(); g.moveTo(x - px * w * .45 - ux * .9, y - py * w * .45 - uy * .9); g.lineTo(x + px * w * .45 + ux * .9, y + py * w * .45 + uy * .9); g.stroke(); } }
}

// ---------- the palisade: one sprite per column, four damage states, seeded by column ----------
const WOODS = [pal('#ad7442'), pal('#bd874f'), pal('#9c6537')], RAIL = pal('#8a5a2e'), POST = pal('#7a4b26'), ROPE = pal('#d6b06c'), IRON = pal('#5c606e'), RAW = pal('#e2bd86');
/** A fresh-wood sliver: too thin for the painter's dark edge, so it gets a faint one. */
function sliver(g, p, c, b){ S.part(g, p, c, b, { flat:true, noEdge:true }); p(g); g.strokeStyle = rgba(c.dark, .45); g.lineWidth = .7; g.lineJoin = 'round'; g.stroke(); }
/** Plank outline: 0 pointed, 1 chipped tip, 2 broken low, 3 stub (the wall is down). Local y: 12 is the ground line, negative is up. */
function plankPath(px, top, R){
  const x0 = px, x1 = px + 18, m = px + 9, yb = 12;
  if (top === 0) return SM([[x0, yb, 1], [x0, -34, 1], [m, -45], [x1, -34, 1], [x1, yb, 1]], .8);
  if (top === 1) return PL([[x0, yb], [x0, -34], [x0 + 4, -41], [x0 + 8, -31], [x0 + 12, -38], [x1, -34], [x1, yb]]);
  if (top === 2) return PL([[x0, yb], [x0, -12], [x0 + 4, -21], [x0 + 9, -9], [x0 + 13, -17], [x1, -11], [x1, yb]]);
  return PL([[x0, yb], [x0, -1 - R() * 4], [x0 + 5, -9 - R() * 4], [x0 + 9, -2], [x0 + 14, -7 - R() * 3], [x1, -3], [x1, yb]]);
}
function post(g, x, lean, R){
  g.save(); g.translate(x, 14); g.rotate(lean);
  S.tube(g, SO([[0, 0], [0, -56]]), POST, 11);
  S.part(g, E(0, -57, 7, 5.5), POST, { x:0, y:-58, r:7 }, { mat:'wood', lw:1.2 });
  g.strokeStyle = rgba(POST.deep, .5); g.lineWidth = 1; g.beginPath(); g.moveTo(-5.5, -52); g.lineTo(5.5, -52); g.stroke();
  g.fillStyle = rgba(POST.deep, .5); ell(g, 2, -30 + R() * 10, 1.6, 2.4); g.fill();
  g.restore();
}
export function fenceSprite(k, state, seed){
  k = bakeK(k);
  return bake(`fence:${k}:${state}:${seed}`, CS + 16, 74, 8, 54, k, g => {
    const R = rng(seed * 31 + state * 7 + 5), hw = CS / 2, broken = state === 3;
    S.shadow(g, hw, 15, hw + 4, 5);
    // rails behind the planks (stubs by the posts once the wall is down)
    for (const ry of [-19, 1]){
      if (broken){
        const L = 12 + R() * 6, M = 10 + R() * 6;
        S.part(g, PL([[-8, ry], [-8 + L, ry], [-8 + L - 3, ry + 4], [-8 + L + 1, ry + 7], [-8, ry + 7]]), RAIL, { x:-2, y:ry + 3.5, r:10 }, { flat:true, lw:1 });
        S.part(g, PL([[CS + 8, ry], [CS + 8 - M, ry + 1], [CS + 8 - M + 3, ry + 4], [CS + 8 - M - 1, ry + 7], [CS + 8, ry + 7]]), RAIL, { x:CS + 2, y:ry + 3.5, r:10 }, { flat:true, lw:1 });
      } else { const p = RR(-8, ry, CS + 16, 7, 2); S.part(g, p, RAIL, { x:hw, y:ry + 3.5, r:hw + 10 }, { flat:true, lw:1.1 }); grainH(g, p, -8, CS + 8, ry, ry + 7, RAIL, R); }
    }
    // plank tops per state
    const tops = [0, 0, 0], a = seed % 3, b = (seed + 1) % 3;
    if (state === 1) tops[a] = 1;
    if (state === 2){ tops[a] = 2; tops[b] = 1; }
    if (broken) tops.fill(3);
    for (let i = 0; i < 3; i++){
      const px = 6 + i * 22, top = tops[i], p = plankPath(px, top, R), col = WOODS[(seed + i) % 3];
      S.part(g, p, col, { x:px + 9, y:-14, r:27 }, { flat:true, mat:'wood', lw:1.3 });
      g.save(); p(g); g.clip(); g.fillStyle = 'rgba(255,240,210,.22)'; g.fillRect(px + 1, -46, 2.5, 60); g.fillStyle = rgba(col.deep, .25); g.fillRect(px + 15, -46, 2.5, 60); g.restore();
      if (top >= 2){
        const ty = top === 2 ? -21 : -13;
        g.save(); p(g); g.clip(); g.fillStyle = rgba(RAW.light, .8); g.fillRect(px, ty, 18, 7); g.restore();
        sliver(g, PL([[px + 3, ty + 2], [px + 6, ty - 9 - R() * 4], [px + 8, ty + 1]]), RAW, { x:px + 6, y:ty - 3, r:6 });
        if (top === 2) sliver(g, PL([[px + 12, ty + 4], [px + 15, ty - 5 - R() * 3], [px + 17, ty + 3]]), RAW, { x:px + 14, y:ty, r:5 });
      } else for (const ry of [-19, 1]) S.rivet(g, px + 9, ry + 3.5, 1.8, IRON);
      if (state >= 1 && top <= 1 && (i === b || state >= 2)) crack(g, jag(R, px + 4 + R() * 8, -30 + R() * 6, px + 6 + R() * 8, -4 + R() * 10, 4, 5), 1.1, .55);
    }
    // the rope lashing: taut, sagging through a gap, or hanging loose from the posts
    if (!broken){ const sag = state >= 2 ? 5 : 1.5; rope(g, [[-8, -8], [hw, -8 + sag], [CS + 8, -8]], ROPE, 5); }
    else { rope(g, [[-2, -8], [5, -1], [8, 9]], ROPE, 5); rope(g, [[CS + 2, -8], [CS - 4, 0], [CS - 6, 10]], ROPE, 5); }
    // splinters and chunks on the ground
    if (state >= 2){ const n = broken ? 6 : 3; for (let i = 0; i < n; i++){ const x = 8 + R() * (CS - 16), y = 8 + R() * 8, L = 6 + R() * 8, ang = (R() - .5) * 1.2; g.save(); g.translate(x, y); g.rotate(ang); sliver(g, RR(-L / 2, -1.5, L, 3, 1.5), i % 2 ? RAW : WOODS[2], { x:0, y:0, r:L / 2 }); g.restore(); } }
    if (broken) for (let i = 0; i < 3; i++){ const x = 12 + R() * (CS - 24), y = 10 + R() * 6; S.part(g, PL([[x - 5, y + 2], [x - 2, y - 4], [x + 4, y - 3], [x + 6, y + 2]]), WOODS[1], { x, y, r:6 }, { flat:true, mat:'wood', lw:.9 }); }
    // the post on the column's left boundary (the last column's right post is a separate sprite)
    post(g, 0, broken ? .06 : 0, R);
  });
}
export function postSprite(k){ k = bakeK(k); return bake(`post:${k}`, 22, 74, 11, 54, k, g => post(g, 0, 0, rng(3))); }

// ---------- graves: three toy headstones on a mound of turned earth ----------
const STONE_G = pal('#a3a6ba'), STONE_D = pal('#7f8398'), EARTH = pal('#5e3f27'), BONE = pal('#efe6cf'), MOSSC = pal('#5c8a3a');
function chisel(g, p, c){ g.save(); g.translate(.8, .8); S.stroke(g, p, c, 1.2, .55); g.restore(); g.save(); g.translate(-.6, -.6); p(g); g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 1; g.stroke(); g.restore(); }
function engrave(g, p, c){ p(g); g.fillStyle = rgba(c.deep, .6); g.fill(); g.save(); g.translate(.7, .7); p(g); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.stroke(); g.restore(); }
function skull(g, x, y){
  S.part(g, E(x, y, 7.5, 7), BONE, { x, y, r:7.5 }, { flat:true, mat:'bone', lw:.9 });
  S.part(g, RR(x - 4.5, y + 3, 9, 5, 2), BONE, { x, y:y + 5, r:5 }, { flat:true, lw:.8 });
  g.fillStyle = '#2b2030'; ell(g, x - 3, y - 1, 2.2, 2.5); g.fill(); ell(g, x + 3, y - 1, 2.2, 2.5); g.fill();
  g.beginPath(); g.moveTo(x, y + 1); g.lineTo(x - 1.2, y + 3.2); g.lineTo(x + 1.2, y + 3.2); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(43,32,48,.7)'; g.lineWidth = .8; for (const tx of [-2.5, 0, 2.5]){ g.beginPath(); g.moveTo(x + tx, y + 5); g.lineTo(x + tx, y + 7.5); g.stroke(); }
}
export function graveSprite(k, v){
  k = bakeK(k);
  return bake(`grave:${k}:${v}`, 76, 70, 38, 36, k, g => {
    const R = rng(v * 13 + 7);
    S.shadow(g, 0, 26, 27, 7);
    // mound of turned earth with clods
    S.part(g, E(0, 21, 29, 9), EARTH, { x:-2, y:18, r:28 }, { flat:true, mat:'stone', lw:1.1 });
    for (let i = 0; i < 5; i++){ const x = (R() - .5) * 46, y = 17 + R() * 8, r = 2 + R() * 2; S.part(g, E(x, y, r, r * .7, R() * 3), EARTH, { x, y, r }, { flat:true, lw:.7, noEdge:true }); }
    if (v === 1){   // a stone cross on a plinth
      S.part(g, RR(-15, 8, 30, 13, 3), STONE_D, { x:0, y:14, r:17 }, { flat:true, mat:'stone', lw:1.2 });
      S.contact(g, RR(-15, 8, 30, 13, 3), 0, 9, 8, 4, .45);
      const cross = g2 => { g2.beginPath(); g2.roundRect(-5.5, -30, 11, 42, 3.5); g2.roundRect(-17, -16, 34, 10.5, 3.5); };
      S.part(g, cross, STONE_G, { x:-2, y:-10, r:24 }, { mat:'stone', lw:1.3, hx:-3, hy:-25 });
      chisel(g, RR(-3.5, -28, 7, 38, 2), STONE_G); chisel(g, RR(-15, -14, 30, 6.5, 2), STONE_G);
      crack(g, jag(R, 3, -2, 5, 8, 3, 3), 1.1, .6);
    } else {
      g.save(); if (v === 2) g.rotate(-.09);
      const p = v === 0 ? SM([[-18, 22, 1], [-18, -6], [-12, -21], [0, -26], [12, -21], [18, -6], [18, 22, 1]], .8) : SM([[-23, 20, 1], [-23, -6], [-17, -17], [0, -21], [17, -17], [23, -6], [23, 20, 1]], .8);
      S.part(g, p, v === 2 ? STONE_D : STONE_G, { x:-3, y:-4, r:27 }, { mat:'stone', lw:1.4, hx:-9, hy:-18 });
      const inner = v === 0 ? SM([[-14, 18, 1], [-14, -5], [-9.5, -17], [0, -21], [9.5, -17], [14, -5], [14, 18, 1]], .8) : SM([[-19, 16, 1], [-19, -5], [-14, -13], [0, -17], [14, -13], [19, -5], [19, 16, 1]], .8);
      chisel(g, inner, STONE_G);
      if (v === 0) engrave(g, g2 => { g2.beginPath(); g2.roundRect(-2.5, -15, 5, 21, 2); g2.roundRect(-8, -9.5, 16, 5, 2); }, STONE_G);
      else skull(g, 0, -3);
      crack(g, jag(R, v === 0 ? 10 : -14, -12, v === 0 ? 14 : -9, 6, 4, 4), 1.2, .65);
      g.restore();
    }
    // moss at the base and a few pebbles
    for (const [x, y, rx, ry, rot] of [[13, 15, 7.5, 4, -.4], [-12, 16, 5.5, 3, .3]]) S.part(g, E(x, y, rx, ry, rot), MOSSC, { x, y, r:rx }, { flat:true, mat:'moss', noEdge:true });
    for (let i = 0; i < 3; i++){ const x = (R() - .5) * 50, y = 22 + R() * 4; S.part(g, E(x, y, 1.8, 1.3), STONE_D, { x, y, r:2 }, { flat:true, lw:.6 }); }
  });
}

// ---------- puddles: glossy dark water in a muddy rim, with reeds and a lily pad ----------
const MUD = pal('#4a3524'), REED = pal('#6a9a3c'), PAD = pal('#4e9448'), CAT = pal('#6e4b2b');
export function puddleSprite(k, seed){
  k = bakeK(k); const rx = CS * .44, ry = 14;
  return bake(`puddle:${k}:${seed}`, CS + 16, 64, CS / 2 + 8, 42, k, g => {
    const R = rng(seed * 19 + 3), side = seed % 2 ? 1 : -1;
    S.part(g, E(0, 1.5, rx + 6, ry + 4.5), MUD, { x:0, y:0, r:rx + 6 }, { flat:true, mat:'stone', lw:1.1 });
    const wp = E(0, 0, rx, ry);
    let gr = g.createLinearGradient(0, -ry, 0, ry); gr.addColorStop(0, '#0b2436'); gr.addColorStop(.5, '#164561'); gr.addColorStop(1, '#2c7593');
    wp(g); g.fillStyle = gr; g.fill();
    g.save(); wp(g); g.clip();
    gr = g.createRadialGradient(rx * .15, ry * .7, 0, rx * .15, ry * .7, rx * .8); gr.addColorStop(0, 'rgba(120,190,215,.45)'); gr.addColorStop(1, 'rgba(120,190,215,0)'); g.fillStyle = gr; g.fillRect(-rx, -ry, rx * 2, ry * 2);
    g.save(); g.shadowColor = 'rgba(255,255,255,.9)'; g.shadowBlur = 6; g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, -rx * .3, -ry * .3, rx * .3, 2.2, -.12); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, rx * .1, -ry * .05, rx * .14, 1.4, -.12); g.fill(); g.restore();
    gr = g.createLinearGradient(0, -ry, 0, -ry * .2); gr.addColorStop(0, 'rgba(4,14,22,.75)'); gr.addColorStop(1, 'rgba(4,14,22,0)'); g.fillStyle = gr; g.fillRect(-rx, -ry, rx * 2, ry);
    g.restore();
    g.lineWidth = 1.8; g.strokeStyle = 'rgba(160,220,240,.6)'; g.beginPath(); g.ellipse(0, 0, rx - .5, ry - .5, 0, .15 * Math.PI, .85 * Math.PI); g.stroke();
    g.strokeStyle = 'rgba(6,18,28,.8)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 1.1 * Math.PI, 1.9 * Math.PI); g.stroke();
    // lily pad with a notch and a tiny flower
    const lx = -side * rx * .4, ly = ry * .25;
    S.part(g, E(lx, ly, 9, 5.5), PAD, { x:lx, y:ly, r:9 }, { flat:true, mat:'skin', lw:1 });
    g.fillStyle = '#164561'; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 10, ly - 5.5); g.lineTo(lx + 10, ly - 1); g.closePath(); g.fill();
    S.dot(g, E(lx - 3, ly - 2, 2.2, 2), '#ff9ec8'); S.dot(g, E(lx - 3, ly - 2.4, .9, .9), '#ffe27a');
    // reeds on the bank with one cattail and a leaf blade
    const bx = side * rx * .72;
    for (let i = 0; i < 3; i++){ const x = bx + (i - 1) * 4, h = 22 + R() * 12, lean = (R() - .5) * 6; S.tube(g, SO([[x, 4], [x + lean * .5, 4 - h * .5], [x + lean, 4 - h]]), REED, 2.4); if (i === 1) S.part(g, RR(x + lean - 2, 4 - h - 2, 4, 9, 2), CAT, { x:x + lean, y:4 - h + 2, r:4 }, { flat:true, lw:.8 }); }
    S.part(g, SM([[bx - side * 6, 4], [bx - side * 10, -10], [bx - side * 16, -22], [bx - side * 8, -12]]), REED, { x:bx - side * 10, y:-10, r:8 }, { flat:true, lw:.8 });
  });
}

// ---------- sea: a baked base per height, a scrolling wave tile and a foam tile for the shoreline ----------
export function seaSprite(k, h){
  k = bakeK(k); h = Math.round(h);
  return bake(`sea:${k}:${h}`, W, h, 0, 0, k, g => {
    const R = rng(77);
    let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0c2f45'); gr.addColorStop(.45, '#174c66'); gr.addColorStop(.85, '#1f6a83'); gr.addColorStop(1, '#2b8199'); g.fillStyle = gr; g.fillRect(0, 0, W, h);
    for (let i = 0; i < 5; i++){ const x = R() * W, y = h * (.1 + R() * .35), r = 40 + R() * 60; gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(4,18,30,.35)'); gr.addColorStop(1, 'rgba(4,18,30,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.save(); g.translate(W * .62, h * .5); g.scale(1, Math.max(1, h / 90)); gr = g.createRadialGradient(0, 0, 0, 0, 0, 70); gr.addColorStop(0, 'rgba(225,245,250,.22)'); gr.addColorStop(.5, 'rgba(225,245,250,.08)'); gr.addColorStop(1, 'rgba(225,245,250,0)'); g.fillStyle = gr; g.fillRect(-70, -70, 140, 140); g.restore();
    g.lineCap = 'round'; g.lineWidth = 1.2;
    const n = Math.round(W * h / 900);
    for (let i = 0; i < n; i++){ const y = h * (.3 + Math.sqrt(R()) * .68), x = R() * W, L = 20 + R() * 40; g.strokeStyle = `rgba(150,225,240,${.08 + (y / h) * .14})`; g.beginPath(); g.moveTo(x, y); for (let d = 8; d <= L; d += 8) g.lineTo(x + d, y + Math.sin(d * .4 + i) * 2.5); g.stroke(); }
    for (let i = 0; i < n / 3; i++){ const x = R() * W, y = h * (.2 + R() * .75); g.fillStyle = `rgba(235,250,255,${.15 + R() * .25})`; ell(g, x, y, 1.6 + R(), .9); g.fill(); }
  });
}
export function waveTile(k){
  k = bakeK(k);
  return bake(`wave:${k}`, 240, 30, 0, 0, k, g => {
    const top = x => 11 + Math.sin(x / 240 * TAU * 2) * 3.5 + Math.sin(x / 240 * TAU * 4 + 1) * 1.5;
    g.beginPath(); g.moveTo(0, top(0)); for (let x = 4; x <= 240; x += 4) g.lineTo(x, top(x)); g.lineTo(240, 30); g.lineTo(0, 30); g.closePath();
    const gr = g.createLinearGradient(0, 8, 0, 30); gr.addColorStop(0, 'rgba(170,225,240,.34)'); gr.addColorStop(1, 'rgba(170,225,240,0)'); g.fillStyle = gr; g.fill();
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, top(0) - 1.6); for (let x = 4; x <= 240; x += 4) g.lineTo(x, top(x) - 1.6); g.strokeStyle = 'rgba(30,90,120,.35)'; g.lineWidth = 1.2; g.stroke();
    g.beginPath(); g.moveTo(0, top(0)); for (let x = 4; x <= 240; x += 4) g.lineTo(x, top(x)); g.strokeStyle = 'rgba(225,248,252,.6)'; g.lineWidth = 2; g.stroke();
    for (const x of [60, 180]){ g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, x, top(x) - 1, 5, 2); g.fill(); ell(g, x + 9, top(x + 9) - .5, 2.5, 1.4); g.fill(); }
  });
}
export function foamTile(k){
  k = bakeK(k);
  return bake(`foam:${k}`, 240, 30, 0, 0, k, g => {
    const R = rng(5);
    g.strokeStyle = 'rgba(8,36,54,.4)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 17); for (let x = 8; x <= 240; x += 8) g.lineTo(x, 17 + Math.sin(x / 240 * TAU * 3) * 1.5); g.stroke();
    for (let i = 0; i < 18; i++){ const x = i * 13.3 + R() * 6, y = 12 + (R() - .5) * 5, r = 4.5 + R() * 4.5;
      for (const xx of [x - 240, x, x + 240]){ const gr = g.createRadialGradient(xx, y, 0, xx, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.55, 'rgba(240,250,255,.8)'); gr.addColorStop(1, 'rgba(240,250,255,0)'); g.fillStyle = gr; ell(g, xx, y, r, r * .7); g.fill(); } }
    for (let i = 0; i < 14; i++){ const x = R() * 240, y = 6 + R() * 12; g.fillStyle = 'rgba(255,255,255,.75)'; ell(g, x, y, 1.2 + R(), 1 + R() * .6); g.fill(); }
  });
}

// ---------- fog: horizontally tileable mist layers (big billows, small wisps, an eerie green glow) ----------
export function mistTile(k, kind){
  k = bakeK(k);
  return bake(`mist:${k}:${kind}`, 256, 192, 0, 0, k, g => {
    const R = rng(kind === 'a' ? 21 : kind === 'b' ? 43 : 65);
    const n = kind === 'a' ? 10 : kind === 'b' ? 16 : 8, col = kind === 'a' ? '196,212,222' : kind === 'b' ? '232,240,244' : '130,245,205';
    for (let i = 0; i < n; i++){   // flat, elongated billows: mist drifts sideways, it does not pile up like cloud
      const r = kind === 'a' ? 44 + R() * 32 : kind === 'b' ? 18 + R() * 16 : 30 + R() * 26, ry = r * (kind === 'g' ? .4 + R() * .2 : .3 + R() * .2);
      const x = R() * 256, y = ry + 6 + R() * (180 - ry * 2);   // whole blob inside the tile, so a scaled band never shows a hard cut
      for (const xx of [x - 256, x, x + 256]){
        if (xx + r < 0 || xx - r > 256) continue;
        g.save(); g.translate(xx, y); g.scale(1, ry / r);
        const gr = g.createRadialGradient(-r * .2, -r * .25, 0, 0, 0, r); gr.addColorStop(0, `rgba(${col},${kind === 'b' ? .6 : .55})`); gr.addColorStop(.5, `rgba(${col},${kind === 'b' ? .3 : .28})`); gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2); g.restore();
      }
    }
    if (kind === 'a'){   // darker hollows between the billows so the bank reads as layered, not flat
      for (let i = 0; i < 6; i++){ const r = 26 + R() * 24, x = R() * 256, y = r * .5 + 10 + R() * (170 - r); for (const xx of [x - 256, x, x + 256]){ if (xx + r < 0 || xx - r > 256) continue; g.save(); g.translate(xx, y); g.scale(1, .45); const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, 'rgba(90,110,125,.3)'); gr.addColorStop(1, 'rgba(90,110,125,0)'); g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2); g.restore(); } }
    }
  });
}
/** A mist band `len` long and `thick` deep at (x, y); `vertical` turns it into a column of width `thick`. Dense at the core, drifting layers, faint glow; thin when a Lantern has cleared it. */
/** A fog bank. The hide extent is the rect minus `pad` on each side: that core is uniformly dense (monsters inside are invisible),
 *  and only the `pad` fringe outside it is translucent, so players never see a thin patch with a monster hidden in it (owner, 2026-09-26). */
export function drawMist(g, k, x, y, len, thick, t, cleared, idx, vertical, pad = 26){
  g.save();
  if (vertical){ g.translate(x + thick, y); g.rotate(Math.PI / 2); } else g.translate(x, y);
  const al = cleared ? .15 : .94, p = Math.min(.45, pad / thick);
  const gr = g.createLinearGradient(0, 0, 0, thick);
  gr.addColorStop(0, 'rgba(150,176,192,0)'); gr.addColorStop(p * .55, `rgba(156,182,196,${al * .3})`); gr.addColorStop(p, `rgba(168,192,204,${al})`); gr.addColorStop(1 - p, `rgba(168,192,204,${al})`); gr.addColorStop(1 - p * .55, `rgba(156,182,196,${al * .3})`); gr.addColorStop(1, 'rgba(150,176,192,0)');
  g.fillStyle = gr; g.fillRect(0, 0, len, thick);
  // tiles are always at least 256 wide (thin bands stretch the billows sideways), so a band costs a handful of draws whatever its depth
  // Three layers (billows one way, wisps the other, a glow): the cost is fill area, so the band stays at ~3 screen passes on a phone
  const tw = Math.max(256, 256 * thick / 192);
  const layer = (tile, speed, alpha, sx, dy) => { const w = tw * sx, n = Math.ceil(len / w) + 1, off = ((t * speed + idx * 91) % w + w) % w - w; g.globalAlpha = alpha; for (let j = 0; j <= n; j++) g.drawImage(tile.c, off + j * w, dy, w, thick); };
  if (cleared) layer(mistTile(k, 'b'), -14, .16, 1, 0);
  else {
    // a second flat pass keeps the core opaque under the billow gaps; the billows then only add texture
    g.fillStyle = `rgba(172,194,206,${al * .55})`; g.fillRect(0, pad, len, Math.max(0, thick - pad * 2));
    layer(mistTile(k, 'a'), 7, .85, 1.3, Math.sin(t * .5 + idx) * thick * .03);
    layer(mistTile(k, 'b'), -17, .55, .8, Math.sin(t * .8 + idx * 2) * thick * .05);
    g.globalCompositeOperation = 'lighter';
    layer(mistTile(k, 'g'), 5, .2 + .07 * Math.sin(t * 1.3 + idx), 1.2, 0);
  }
  g.restore();
}

/** A soft warm glow disc for live flicker (torches). */
export function glowSprite(k, col = '#ffa040'){ k = bakeK(k); return bake(`glow:${k}:${col}`, 64, 64, 32, 32, k, g => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 32); gr.addColorStop(0, rgba(col, .9)); gr.addColorStop(.4, rgba(col, .35)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(-32, -32, 64, 64); }); }

// ---------- tiny per-frame marks, baked (2026-10-31: live ellipse paths were the busiest canvas calls in a crowded Endless Night) ----------
/** A flat disc of one colour, 32 px across, blitted at any size: one drawImage instead of an anti-aliased ellipse path (particles, trails). */
export function discSprite(k, col){ k = bakeK(k); return bake(`disc:${k}:${col}`, 32, 32, 16, 16, k, g => { g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, 16, 16, 0, 0, TAU); g.fill(); }); }
/** A coin flying to the purse: the three stacked discs of the old live drawing, centred. */
export function coinSprite(k){ k = bakeK(k); return bake(`coin:${k}`, 20, 20, 10, 10, k, g => {
  const d = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, r, r, 0, 0, TAU); g.fill(); };
  d(0, 0, 8, '#c7861a'); d(-1, -1, 6.5, '#ffd24a'); d(-3, -3, 2, '#fff4b8');
}); }
/** One health pip of a small monster: dark ring, pale empty disc, red fill clipped to `step`/8 (0 = empty). 12 px, centred. */
export function pipSprite(k, step){ k = bakeK(k); return bake(`pip:${k}:${step}`, 12, 12, 6, 6, k, g => {
  const d = (r, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, r, r, 0, 0, TAU); g.fill(); };
  d(5.5, 'rgba(0,0,0,.65)'); d(4, 'rgba(255,255,255,.18)');
  if (step > 0){ g.save(); g.beginPath(); g.rect(-4, -4, 8 * step / 8, 8); g.clip(); d(4, '#ff5a4d'); g.restore(); }
}); }

// ---------- castle walls: rough hewn courses, crenellations, a portcullis, moss and a torch; three damage states ----------
const STONE = pal('#8f90a0'), STONED = pal('#6d6f80'), STONEL = pal('#a8a9b8'), IRONC = pal('#4c505c'), TORCH = pal('#5a3a20');
function bakeCastle(k, state){
  const w = CS * 1.04, hw = w / 2;
  return bake(`castle:${k}:${state}`, w, 90, hw, 62, k, g => {
    const R = rng(11 + state * 7);
    S.shadow(g, 0, 22, hw, 6);
    // block courses, bottom to top; missing blocks show a dark hole
    const rows = [[8, 20], [-4, 8], [-16, -4], [-28, -16]];
    const holes = state === 0 ? [] : state === 1 ? [[3, 0]] : [[3, 0], [3, 2], [2, 3]];
    rows.forEach(([y0, y1], ri) => { const n = ri % 2 ? 3 : 4, bw = (hw * 2) / n;
      for (let i = 0; i < n; i++){ const bx = -hw + i * bw;
        if (holes.some(([r, c]) => r === ri && c === i)){ g.fillStyle = '#17121c'; g.beginPath(); g.roundRect(bx + 1, y0 + 1, bw - 2, y1 - y0 - 2, 2); g.fill(); const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(60,50,70,.2)'); g.fillStyle = gr; g.fillRect(bx + 1, y0 + 1, bw - 2, y1 - y0 - 2); continue; }
        const q = R(), col = q < .25 ? STONED : q < .8 ? STONE : STONEL, jit = (R() - .5) * 1.2;
        S.part(g, RR(bx + 1, y0 + 1 + jit, bw - 2, y1 - y0 - 2, 2.5), col, { x:bx + bw / 2, y:(y0 + y1) / 2, r:bw * .62 }, { mat:'stone', flat:R() < .6, lw:1.3, hx:bx + bw * .3, hy:y0 + 3 });
      } });
    // portcullis: a dark arch with iron bars and a warm glow inside
    const arch = SM([[-8, 20, 1], [-8, -12], [0, -21], [8, -12], [8, 20, 1]], .9);
    arch(g); g.fillStyle = '#120c16'; g.fill();
    g.save(); arch(g); g.clip();
    let gr = g.createRadialGradient(0, 22, 0, 0, 22, 26); gr.addColorStop(0, 'rgba(255,150,60,.35)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(-10, -22, 20, 44);
    g.strokeStyle = IRONC.base; g.lineWidth = 1.7; g.lineCap = 'round'; for (const x of [-4, 0, 4]){ g.beginPath(); g.moveTo(x, -20); g.lineTo(x, 22); g.stroke(); } for (const y of [-10, 0, 10]){ g.beginPath(); g.moveTo(-9, y); g.lineTo(9, y); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = .6; for (const x of [-4, 0, 4]){ g.beginPath(); g.moveTo(x - .6, -20); g.lineTo(x - .6, 22); g.stroke(); }
    g.restore();
    for (let i = 0; i < 5; i++){ const a = Math.PI + i * Math.PI / 4, cx = Math.cos(a) * 10.5, cy = -12 + Math.sin(a) * 10.5; g.save(); g.translate(cx, cy); g.rotate(a + Math.PI / 2); S.part(g, RR(-3.6, -2.6, 7.2, 5.2, 1.5), STONED, { x:0, y:0, r:4 }, { mat:'stone', flat:true, lw:1 }); g.restore(); }
    // cornice ledge and crenellations
    S.part(g, RR(-hw - 1.5, -35, hw * 2 + 3, 7, 2), STONED, { x:0, y:-31.5, r:hw + 2 }, { mat:'stone', flat:true, lw:1.2 });
    for (const [mx, mi] of [[-hw + 1, 0], [-7, 1], [hw - 15, 2]]){
      if (state === 2 && mi === 1) continue;
      let p;
      if (state >= 1 && mi === 2) p = PL([[mx, -35], [mx, -46], [mx + 4, -43], [mx + 8, -50], [mx + 11, -44], [mx + 14, -47], [mx + 14, -35]]);
      else if (state === 2 && mi === 0) p = PL([[mx, -35], [mx, -42], [mx + 5, -45], [mx + 9, -40], [mx + 14, -43], [mx + 14, -35]]);
      else p = RR(mx, -50, 14, 15, 2.5);
      S.part(g, p, mi === 1 ? STONEL : STONE, { x:mx + 7, y:-43, r:9 }, { mat:'stone', lw:1.3, hx:mx + 4, hy:-47 });
    }
    // moss clumps and a hanging strand
    for (const [x, y, rx, ry] of [[-hw + 9, 17, 7, 3.5], [hw - 11, 18, 5.5, 3], [-hw + 3, -30, 5, 2.5], [6, 12, 4, 2.2]]) S.part(g, E(x, y, rx, ry), MOSSC, { x, y, r:rx }, { flat:true, mat:'moss', noEdge:true });
    S.tube(g, SO([[-hw + 4, -29], [-hw + 5, -20], [-hw + 3, -12]]), MOSSC, 2.2);
    // torch bracket on the right (the flicker is drawn live)
    const tx = hw - 9;
    S.part(g, RR(tx - 2.5, -8, 5, 9, 1.5), IRONC, { x:tx, y:-4, r:5 }, { flat:true, mat:'metal', lw:.9 }); S.rivet(g, tx, -6, 1.3, IRONC);
    S.tube(g, SO([[tx, -6], [tx + 1, -22]]), TORCH, 3.6);
    g.save(); g.shadowColor = '#ff9a30'; g.shadowBlur = 8; SM([[tx + 1, -36], [tx - 4, -27], [tx + 1, -21], [tx + 6, -27]], .9)(g); gr = g.createRadialGradient(tx + 1, -25, 0, tx + 1, -27, 10); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(.45, '#ffc93a'); gr.addColorStop(1, '#ff6a1a'); g.fillStyle = gr; g.fill(); g.restore();
    // damage: deepening cracks, then rubble at the foot
    if (state >= 1){ crack(g, jag(R, -hw * .6, -26, -hw * .45, 6, 5, 6), 2, .9); crack(g, jag(R, hw * .35, -14, hw * .5, 14, 4, 5), 1.8, .85); }
    if (state >= 2){ crack(g, jag(R, -hw * .2, -46, hw * .25, 18, 7, 9), 2.4, .95); crack(g, jag(R, hw * .55, -30, hw * .8, -8, 4, 5), 1.8, .85);
      for (let i = 0; i < 5; i++){ const x = -hw + 6 + R() * (hw * 2 - 12), y = 20 + R() * 5, r = 3 + R() * 2.5; g.save(); g.translate(x, y); g.rotate(R() * 3); S.part(g, RR(-r, -r * .6, r * 2, r * 1.2, 1.5), STONED, { x:0, y:0, r }, { mat:'stone', flat:true, lw:.9 }); g.restore(); } }
  });
}
export function castleSprite(k, hpFrac){ return bakeCastle(bakeK(k), hpFrac > .66 ? 0 : hpFrac > .33 ? 1 : 2); }

// ---------- the Bat Bride's veil (Release 8): a sheer crimson veil with a lace hem, draped over a veiled monster; baked once, one drawImage ----------
// Drawn for a monster of radius 40 around its centre: the crown of the veil 1.8 r above, the hem 0.8 r below. render/monsters.js scales it to m.r.
export const VEIL_R = 40;
export function veilSprite(k){ k = bakeK(k); return bake(`veil:${k}`, 124, 112, 62, 76, k, g => {
  const R = rng(11), hem = [];
  for (let i = 0; i <= 12; i++){ const u = i / 12, x = -54 + u * 108; hem.push([x, 26 + Math.sin(u * Math.PI) * 6 + (i % 2 ? 7 : 0)]); }   // scalloped lace hem
  const shape = gg => { gg.beginPath(); gg.moveTo(-54, 26); gg.bezierCurveTo(-60, -20, -34, -72, 0, -72); gg.bezierCurveTo(34, -72, 60, -20, 54, 26); for (let i = hem.length - 1; i >= 0; i--) gg.lineTo(hem[i][0], hem[i][1]); gg.closePath(); };
  const gr = g.createLinearGradient(0, -72, 0, 34); gr.addColorStop(0, 'rgba(150,12,40,.5)'); gr.addColorStop(.55, 'rgba(190,24,56,.32)'); gr.addColorStop(1, 'rgba(220,40,70,.42)');
  shape(g); g.fillStyle = gr; g.fill();
  g.save(); shape(g); g.clip();
  g.strokeStyle = 'rgba(255,170,190,.18)'; g.lineWidth = 1;   // the sheer weave
  for (let x = -60; x <= 60; x += 9){ g.beginPath(); g.moveTo(x, -76); g.quadraticCurveTo(x * 1.1, -10, x * 1.25, 40); g.stroke(); }
  g.strokeStyle = 'rgba(255,200,215,.35)'; g.lineWidth = 2.4;   // soft folds
  for (const fx of [-30, -8, 16, 36]){ g.beginPath(); g.moveTo(fx * .4, -64); g.quadraticCurveTo(fx * .9 + (R() - .5) * 6, -16, fx * 1.15, 30); g.stroke(); }
  g.restore();
  g.strokeStyle = 'rgba(255,210,220,.75)'; g.lineWidth = 1.6; g.lineJoin = 'round';   // the lace hem and its picots
  g.beginPath(); hem.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  g.fillStyle = 'rgba(255,220,228,.85)'; for (let i = 0; i < hem.length; i += 2){ g.beginPath(); g.ellipse(hem[i][0], hem[i][1] + 3, 1.8, 1.8, 0, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(110,6,28,.7)'; g.lineWidth = 1.4; shape(g); g.stroke();   // a dark edge so it reads on any monster
  g.fillStyle = '#e0203a'; g.beginPath(); g.ellipse(0, -70, 4, 4, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,230,235,.9)'; g.beginPath(); g.ellipse(-1.2, -71.4, 1.2, 1.2, 0, 0, TAU); g.fill();   // the Bride's blood-red gem pinning it
}); }


// ---------- the Fallen Count (Release 8): the lightning column warning, the bolt, the blood spear; each baked once, one drawImage a frame ----------
// Baked in fixed drawing units and stretched onto the patch at draw time (render/draw.js drawCountBolt / drawCountSpears), so a change of tile size
// needs no new art; like every prop here they are keyed by the bake scale K, so a resize that changes K bakes them once more.
export const FC_COL = { w:100, h:500 }, FC_BOLT = { w:160, h:620 }, FC_SPEAR = { w:28, h:110 };
/** A patch column under a lightning warning: a pale storm-blue wash with crimson-lit edges and chevrons pointing down. */
export function countWarnSprite(k){ k = bakeK(k); return bake(`fcwarn:${k}`, FC_COL.w, FC_COL.h, 0, 0, k, g => {
  const { w, h } = FC_COL;
  let gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(200,212,255,.55)'); gr.addColorStop(.18, 'rgba(160,180,255,.22)'); gr.addColorStop(.82, 'rgba(160,180,255,.22)'); gr.addColorStop(1, 'rgba(200,212,255,.55)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,60,80,.85)'; g.lineWidth = 3; g.setLineDash([14, 10]); g.strokeRect(2, 2, w - 4, h - 4); g.setLineDash([]);
  g.strokeStyle = 'rgba(240,246,255,.75)'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let y = 40; y < h - 20; y += 90){ g.beginPath(); g.moveTo(w * .3, y); g.lineTo(w * .5, y + 22); g.lineTo(w * .7, y); g.stroke(); }
}); }
/** The bolt itself: a forked white-blue stroke with a wide glow, top to bottom of the column. */
export function countBoltSprite(k){ k = bakeK(k); return bake(`fcbolt:${k}`, FC_BOLT.w, FC_BOLT.h, 0, 0, k, g => {
  const { w, h } = FC_BOLT, R = rng(77), pts = [[w / 2, 0]];
  for (let i = 1; i < 12; i++) pts.push([w / 2 + (R() - .5) * w * .5, h * i / 12]);
  pts.push([w / 2, h]);
  const path = () => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    for (const k0 of [3, 7]){ const p = pts[k0], d = k0 === 3 ? -1 : 1; g.moveTo(p[0], p[1]); g.lineTo(p[0] + d * w * .22, p[1] + h * .05); g.lineTo(p[0] + d * w * .34, p[1] + h * .12); } };
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.save(); g.shadowColor = '#9fc0ff'; g.shadowBlur = 24; path(); g.strokeStyle = 'rgba(159,192,255,.6)'; g.lineWidth = 18; g.stroke(); g.restore();
  path(); g.strokeStyle = 'rgba(200,220,255,.9)'; g.lineWidth = 8; g.stroke();
  path(); g.strokeStyle = '#f6f9ff'; g.lineWidth = 3; g.stroke();
}); }
/** The blood spear in flight, point down: an iron shaft and a long glowing blade of blood. */
export function countSpearSprite(k){ k = bakeK(k); return bake(`fcspear:${k}`, FC_SPEAR.w, FC_SPEAR.h, FC_SPEAR.w / 2, 0, k, g => {
  S.tube(g, SO([[0, 4], [0, 62]]), pal('#1c1f2a'), 3.8);
  for (let i = 0; i < 3; i++) S.ln(g, [[-2.6, 56 + i * 3], [2.6, 56 + i * 3]], pal('#b4101f'), 1.4, .9);
  const blade = SM([[-4.2, 64, 1], [-5.6, 74], [-3.2, 88], [0, 106, 1], [3.2, 88], [5.6, 74], [4.2, 64, 1]], .7);
  g.save(); g.shadowColor = '#ff2030'; g.shadowBlur = 10; S.dot(g, blade, '#ff2a3a', .5); g.restore();
  S.part(g, blade, pal('#c8101e'), { x:0, y:80, r:14 }, { hx:-2.4, hy:72, lw:1 });
  S.ln(g, [[0, 66], [0, 100]], { deep:'#ffb0b0' }, .9, .55);
}); }
export function prebakeCountFx(k){ countWarnSprite(k); countBoltSprite(k); countSpearSprite(k); }
