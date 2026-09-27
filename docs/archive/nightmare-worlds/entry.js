import { P, fill, glow, vband, sil, limb, ridge, stars, moon, cloud, spark, bat, bird, sky, PROPS, field, patch, W, H, FIELD_TOP, FENCE_Y, TAU } from './painter.js';
import { rng, rgba, mix, SO } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/paint.js';
import { ell } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/util.js';

// the game's five palettes (src/data/worlds/index.js), for the side-by-side
const BASE = [
  { name:'Pumpkin Patch', sky:['#110a20','#3d1a3e','#b0552f'], ground:['#3d2630','#1c1216'], moon:'#ffcf72', halo:'#ff9a3a', sil:['#2d1637','#0f0716'], rim:'#ffb070', soil:['#7a4a2c','#4b2a17','#2a160a'] },
  { name:'Foggy Hollow', sky:['#08111c','#193038','#5d7d75'], ground:['#1e3030','#0f1a1a'], moon:'#e9fbff', halo:'#9fd8d0', sil:['#1d3235','#0b1517'], rim:'#bfe8dc', soil:['#4b5a3c','#2b3522','#151d15'] },
  { name:'Crumbling Keep', sky:['#0f0509','#3c0c16','#8e2a1a'], ground:['#3a2c33','#1a1317'], moon:'#ff6a48', halo:'#c02a20', sil:['#2c1119','#120609'], rim:'#ff9a78', soil:['#5a4a52','#372b31','#1c1418'] },
  { name:'Drowned Marsh', sky:['#05161e','#0f3a44','#2f8a80'], ground:['#4a4a3a','#1d2420'], moon:'#dcfff5', halo:'#5fd0bc', sil:['#0f2c30','#071619'], rim:'#a8f0e0', soil:['#77704f','#48432d','#211f16'] },
  { name:'Witchwood', sky:['#150818','#3f1630','#a8522c'], ground:['#3a2418','#1a1009'], moon:'#dcc0ff', halo:'#8a48d0', sil:['#331226','#12060e'], rim:'#e0a8ff', soil:['#6c4028','#43261a','#24130a'] },
];
const GRASS = ['#4e3340', '#2f5a48', '#3f2d33', '#3a6a58', '#5a3a22'], MIST = [null, '#b9d8cf', null, '#a8d8d0', null];
BASE.forEach((b, i) => { b.grass = GRASS[i]; b.mist = MIST[i]; });
const MOON = { x:[136, 92, 118, 110, 140], y:[56, 64, 84, 66, 60], r:[32, 20, 40, 28, 26] };

// ---------- small extras ----------
function deadTree(g, x, y, h, col, R, w = 7){   // bare, forking, skeletal
  const branch = (x0, y0, a, len, wd, d) => { const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    g.strokeStyle = col; g.lineWidth = wd; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + (R() - .5) * len * .3, (y0 + y1) / 2, x1, y1); g.stroke();
    if (d > 0) for (let k = 0; k < 2 + (R() < .4 ? 1 : 0); k++) branch(x1, y1, a + (R() - .5) * 1.3, len * (.6 + R() * .15), wd * .62, d - 1); };
  branch(x, y, -Math.PI / 2 + (R() - .5) * .2, h * .45, w, 4);
}
function bolt(g, x, y0, y1, R, w = 3){   // a jagged lightning bolt with a branch, baked with glow
  const pts = [[x, y0]]; let cx = x; for (let y = y0; y < y1; y += 9 + R() * 10){ cx += (R() - .5) * 22; pts.push([cx, y]); } pts.push([cx + (R() - .5) * 10, y1]);
  const draw = (p, lw, col) => { g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'miter'; g.beginPath(); p.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke(); };
  g.save(); g.shadowColor = 'rgba(190,210,255,1)'; g.shadowBlur = 18; draw(pts, w * 2.2, 'rgba(170,190,255,.55)'); g.restore();
  draw(pts, w, '#f4f6ff');
  const bi = Math.floor(pts.length * .45), br = [pts[bi]]; let bx = pts[bi][0]; for (let i = 1; i < 5; i++){ bx += 8 + R() * 10; br.push([bx, pts[bi][1] + i * 10]); }
  g.save(); g.shadowColor = 'rgba(190,210,255,1)'; g.shadowBlur = 10; draw(br, w * .6, '#e8ecff'); g.restore();
}
function rain(g, R, n, a){ g.strokeStyle = `rgba(200,215,255,${a})`; g.lineWidth = 1; for (let i = 0; i < n; i++){ const x = R() * (W + 80) - 40, y = R() * H, l = 10 + R() * 14; g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * .35, y + l); g.stroke(); } }
function flame(g, x, y, h, R){ for (let i = 0; i < 3; i++){ const hh = h * (1 - i * .28), ww = hh * .42, col = ['#ff4a12', '#ff9a1a', '#ffe27a'][i];
  g.fillStyle = col; g.beginPath(); g.moveTo(x - ww, y); g.quadraticCurveTo(x - ww * 1.1, y - hh * .5, x + (R() - .5) * ww * .6, y - hh); g.quadraticCurveTo(x + ww * 1.1, y - hh * .5, x + ww, y); g.closePath(); g.fill(); } }
function eyes(g, x, y, s, col){ glow(g, x, y, s * 7, col, .35); g.fillStyle = col; for (const d of [-1, 1]){ g.beginPath(); g.ellipse(x + d * s * 1.6, y, s, s * .55, d * .25, 0, TAU); g.fill(); } g.fillStyle = 'rgba(255,255,255,.8)'; for (const d of [-1, 1]){ g.beginPath(); g.ellipse(x + d * s * 1.6 - s * .3, y - s * .15, s * .25, s * .15, 0, 0, TAU); g.fill(); } }

// ---------- the themes ----------
const THEMES = [
  { key:'hallow', name:"Hallow's End", tag:'World 6', base:0, desc:"The heart of Halloween. A giant jack-o'-lantern moon grins over a crooked town of spires and lit windows, an orange and violet aurora ripples across the sky, lanterns drift upward and a great twisted tree hangs heavy with glowing pumpkins.",
    w:{ sky:['#07030f','#2a0d3c','#d4602a'], ground:['#3a2233','#170b14'], moon:'#ff9a2a', halo:'#ff7a1a', sil:['#24102f','#0b0510'], rim:'#ffb060', soil:['#7c4a2a','#4a2a18','#26140a'] },
    moonAt:[W / 2, 80, 46], custom:true },
  { key:'patchN', name:'Pumpkin Patch: Nightmare', tag:'Nightmare', base:0, desc:'An eclipse swallows the harvest moon, leaving a burning corona. The barn is ablaze, smoke rolls across the sky, embers drift over the field and crows circle.',
    w:{ sky:['#050204','#2a0806','#c2410f'], ground:['#2e1a16','#120a08'], moon:'#1a0808', halo:'#ff7a1a', sil:['#1a0808','#080303'], rim:'#ff8a3a', soil:['#5e3620','#3a1e10','#1a0c06'] } },
  { key:'fogN', name:'Foggy Hollow: Nightmare', tag:'Nightmare', base:1, desc:'A sickly green moon over a black marsh. The fog has turned poison green and thick, the lanterns burn with ghostfire, and pairs of red eyes watch from the mist.',
    w:{ sky:['#020604','#0b1f12','#2f6a3a'], ground:['#16261a','#08110a'], moon:'#d8ffb0', halo:'#5aff7a', sil:['#0d2014','#040a06'], rim:'#9aff9a', soil:['#3e4a2c','#232c18','#10150a'] } },
  { key:'keepN', name:'Crumbling Keep: Nightmare', tag:'Nightmare', base:2, desc:'A thunderstorm breaks over the keep. Black clouds, forked lightning striking the towers, sheets of rain and a cold blue flash that turns the castle to silhouette.',
    w:{ sky:['#03050c','#141c33','#3a4a6a'], ground:['#2a2c36','#12131a'], moon:'#c8d4ff', halo:'#6a80c8', sil:['#10131e','#05060b'], rim:'#b8c8ff', soil:['#4a4c58','#2c2e38','#15161c'] } },
  { key:'marshN', name:'Drowned Marsh: Nightmare', tag:'Nightmare', base:3, desc:'The red sea. A huge blood moon hangs low over water turned crimson, its reflection a trail of red light, with the wreck black against it.',
    w:{ sky:['#0c0206','#3e0610','#a8141c'], ground:['#3a1c1a','#170a0a'], moon:'#ff3a26', halo:'#c01010', sil:['#2a0508','#100203'], rim:'#ff7a60', soil:['#6a3a2c','#43221a','#21100c'] }, moonAt:[110, 70, 44] },
  { key:'woodN', name:'Witchwood: Nightmare', tag:'Nightmare', base:4, desc:'All the colour drained away. A grey, dead wood of bare skeletal trees under a pale sun-white moon, ash drifting down and crows on the branches.',
    w:{ sky:['#0c0c0e','#2a2a2e','#6a6a70'], ground:['#34343a','#141418'], moon:'#f0f0f0', halo:'#b8b8c0', sil:['#26262c','#0c0c10'], rim:'#e0e0e8', soil:['#5a5a60','#38383e','#1a1a1e'] }, grey:true },
];

function hallowSky(g, w, R, hz){
  let gr = g.createLinearGradient(0, 0, 0, hz + 30); gr.addColorStop(0, w.sky[0]); gr.addColorStop(.55, w.sky[1]); gr.addColorStop(1, w.sky[2]); g.fillStyle = gr; g.fillRect(0, 0, W, hz + 30);
  vband(g, hz - 70, hz + 30, w.sky[2], 0, .35, .7); stars(g, R, 90, hz - 30, '#ffe8d0');
  for (let b = 0; b < 3; b++){ const col = ['#b04aff', '#ff8a2a', '#5affc0'][b]; g.save(); g.globalCompositeOperation = 'lighter';   // aurora ribbons
    for (let x = 0; x < W; x += 3){ const y = 18 + b * 16 + Math.sin(x * .018 + b * 2) * 14 + Math.sin(x * .05 + b) * 5, hgt = 26 + Math.sin(x * .03 + b) * 10; const a = .09 + .06 * Math.sin(x * .04 + b * 3);
      const lg = g.createLinearGradient(0, y, 0, y + hgt); lg.addColorStop(0, rgba(col, 0)); lg.addColorStop(.3, rgba(col, a)); lg.addColorStop(1, rgba(col, 0)); g.fillStyle = lg; g.fillRect(x, y, 3, hgt); } g.restore(); }
  // the jack-o'-lantern moon
  const mx = 408, my = 58, r = 38; glow(g, mx, my, r * 3.4, '#ff7a1a', .35, r * .6);
  const pg = g.createRadialGradient(mx - r * .3, my - r * .35, r * .1, mx, my, r); pg.addColorStop(0, '#ffc060'); pg.addColorStop(.7, '#f07a1a'); pg.addColorStop(1, '#a8400c');
  g.fillStyle = pg; g.beginPath(); g.ellipse(mx, my, r * 1.12, r, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(120,40,8,.45)'; g.lineWidth = 2; for (const k of [-.62, -.28, .28, .62]){ g.beginPath(); g.ellipse(mx + k * r * .6, my, r * .5 * (1 - Math.abs(k) * .4), r * .98, 0, 0, TAU); g.stroke(); }
  g.fillStyle = '#4a7a2a'; g.beginPath(); g.roundRect(mx - 4, my - r - 10, 8, 14, 3); g.fill();
  g.save(); g.shadowColor = '#ffe27a'; g.shadowBlur = 14; g.fillStyle = '#fff0a0';
  for (const s of [-1, 1]){ g.beginPath(); g.moveTo(mx + s * r * .18, my - r * .08); g.lineTo(mx + s * r * .5, my - r * .08); g.lineTo(mx + s * r * .34, my - r * .42); g.closePath(); g.fill(); }
  g.beginPath(); g.moveTo(mx - r * .1, my + r * .02); g.lineTo(mx + r * .1, my + r * .02); g.lineTo(mx, my - r * .14); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(mx - r * .62, my + r * .2); for (let i = 0; i <= 8; i++){ const x = mx - r * .62 + i * r * .155, y = my + r * (.2 + (i % 2 ? .16 : 0)) + Math.sin(i / 8 * Math.PI) * r * .3; g.lineTo(x, y); } for (let i = 8; i >= 0; i--){ const x = mx - r * .62 + i * r * .155, y = my + r * (.5 + (i % 2 ? 0 : .1)) + Math.sin(i / 8 * Math.PI) * r * .18; g.lineTo(x, y); } g.closePath(); g.fill(); g.restore();
  for (let i = 0; i < 14; i++){ const x = 20 + R() * (W - 40), y = 40 + R() * (hz - 90), s = 2 + R() * 2.5; glow(g, x, y, s * 6, '#ffb040', .35); g.fillStyle = '#ffd890'; g.beginPath(); g.roundRect(x - s, y - s * 1.3, s * 2, s * 2.6, s * .6); g.fill(); }   // drifting lanterns
  for (let i = 0; i < 5; i++) bat(g, 60 + R() * (W - 120), 30 + R() * 90, .8 + R() * .7, 'rgba(10,4,16,.9)');
}
function hallowProps(g, w, R, hz){
  const [far, near] = w.sil, rim = w.rim;
  ridge(g, hz - 30, 10, far, rgba(rim, .12), .008, .4);
  // crooked town: houses, spires and a leaning clock tower, windows lit
  const bld = (x, bw, bh, lean, spire) => { const top = hz - bh; sil(g, P([[x, hz + 4], [x + lean * .3, top], [x + bw / 2 + lean, top - spire], [x + bw + lean * .3, top], [x + bw, hz + 4]]), mix(far, near, .55), rim, 1, .35);
    for (let i = 0; i < Math.floor(bh / 16); i++) if (R() < .6){ const wx = x + 4 + R() * (bw - 10), wy = top + 8 + i * 14; g.fillStyle = R() < .5 ? '#ffc060' : '#ff9a3a'; g.fillRect(wx, wy, 4, 5); glow(g, wx + 2, wy + 2, 9, '#ffa040', .25); } };
  [[130, 34, 40, 3, 20], [166, 26, 32, -4, 16], [196, 40, 56, 5, 28], [240, 30, 36, -3, 18], [274, 22, 48, 6, 24], [300, 36, 30, -2, 14], [340, 28, 44, 4, 22], [372, 40, 34, -5, 18]].forEach(a => bld(...a));
  g.fillStyle = '#ffe8a0'; g.beginPath(); g.arc(218, hz - 44, 7, 0, TAU); g.fill(); g.strokeStyle = '#3a1a10'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(218, hz - 44); g.lineTo(218, hz - 49); g.moveTo(218, hz - 44); g.lineTo(222, hz - 43); g.stroke(); glow(g, 218, hz - 44, 20, '#ffd070', .3);   // clock
  // the great twisted tree on the left, hung with jack-o'-lanterns
  const tx = 60, dir = 1;
  limb(g, SO([[tx, hz + 8], [tx + 4, hz - 40], [tx - 8, hz - 90], [tx + 10, hz - 130]]), near, rim, 13, dir, .4);
  const arms = [[[tx - 4, hz - 70], [tx + 50, hz - 96], [tx + 96, hz - 104]], [[tx - 6, hz - 92], [tx - 40, hz - 120], [tx - 60, hz - 128]], [[tx + 8, hz - 120], [tx + 44, hz - 146], [tx + 70, hz - 150]]];
  arms.forEach(a => limb(g, SO(a), near, rim, 5, dir, .4));
  [[tx + 60, hz - 100, 16], [tx + 92, hz - 104, 22], [tx - 44, hz - 124, 14], [tx + 40, hz - 142, 18]].forEach(([x, y, l]) => { g.strokeStyle = near; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + l); g.stroke();
    const cy = y + l + 6; glow(g, x, cy, 18, '#ff8a2a', .4); g.fillStyle = '#e8741a'; g.beginPath(); g.ellipse(x, cy, 7.5, 6.5, 0, 0, TAU); g.fill(); g.fillStyle = '#ffe07a'; g.fillRect(x - 4, cy - 2, 2.2, 2.2); g.fillRect(x + 1.8, cy - 2, 2.2, 2.2); g.fillRect(x - 3, cy + 1.6, 6, 1.6); });
  // a path of candles leading to the town
  for (let i = 0; i < 8; i++){ const x = 470 - i * 14 + (i % 2) * 6, y = hz + 2 - i * .5, s = 1.4; glow(g, x, y - 5, 8, '#ffb050', .5); g.fillStyle = '#f4e8d0'; g.fillRect(x - s, y - 4, s * 2, 5); g.fillStyle = '#ffd070'; g.beginPath(); g.ellipse(x, y - 6, 1, 2, 0, 0, TAU); g.fill(); }
}

function build(T){
  if (!T.w.grass) T.w.grass = mix(T.w.ground[0], T.w.sil[0], .3); if (T.w.mist === undefined) T.w.mist = T.key === 'fogN' ? '#5ac07a' : T.key === 'marshN' ? '#c04040' : null;
  const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2; const g = c.getContext('2d'); g.scale(2, 2);
  const t = T.base, w = T.w, hz = FIELD_TOP - 8, R = rng(t * 91 + 7 + (T.key ? T.key.length * 13 : 0));
  const mx = T.moonAt ? T.moonAt[0] : MOON.x[t], my = T.moonAt ? T.moonAt[1] : hz - MOON.y[t], mr = T.moonAt ? T.moonAt[2] : MOON.r[t];
  if (T.custom){ hallowSky(g, w, R, hz); hallowProps(g, w, R, hz); }
  else { sky(g, w, R, hz, mx, my, mr, t); pre(T, g, w, R, hz, mx, my, mr); PROPS[t](g, w, R, hz, mx, my, mr); post(T, g, w, R, hz, mx, my, mr); }
  g.fillStyle = w.sil[1]; g.beginPath(); g.moveTo(0, hz + 8); for (let x = 0; x <= W; x += 20) g.lineTo(x, hz - 2 - Math.sin(x * .02 + t) * 2.5); g.lineTo(W, hz + 30); g.lineTo(0, hz + 30); g.closePath(); g.fill();
  field(g, w, R, hz + 4, t); patch(g, w, R);
  after(T, g, w, R, hz, mx, my, mr);
  if (T.grey){ const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; const kg = k.getContext('2d'); kg.filter = 'grayscale(1) contrast(1.08)'; kg.drawImage(c, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.drawImage(k, 0, 0); g.setTransform(2, 0, 0, 2, 0, 0); greyExtras(g, w, R, hz); }
  return c;
}
function pre(T, g, w, R, hz, mx, my, mr){
  if (T.key === 'patchN'){ g.fillStyle = '#040102'; g.beginPath(); g.arc(mx, my, mr * .96, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,190,90,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.stroke(); glow(g, mx, my, mr * 1.9, '#ffb050', .45, mr * .9);   // eclipse corona
    for (let i = 0; i < 4; i++) cloud(g, 40 + i * 120, 40 + (i % 2) * 30, 110, 22, '#120404', .7); }
  if (T.key === 'keepN'){ for (let i = 0; i < 6; i++) cloud(g, i * 100 + 20, 30 + (i % 3) * 22, 130, 34, '#05070f', .85); bolt(g, 250, 0, hz - 70, R, 4); bolt(g, 430, 20, hz - 40, R, 3); bolt(g, 250, 0, hz - 70, rng(8), 2.4); glow(g, 250, 60, 180, '#8aa0ff', .18); }
  if (T.key === 'fogN'){ cloud(g, mx + 60, my + 10, 90, 10, '#020604', .6); }
  if (T.key === 'marshN'){ glow(g, mx, my, mr * 5, '#ff1a1a', .18, mr); }
}
function post(T, g, w, R, hz, mx, my, mr){
  if (T.key === 'patchN'){ // the barn ablaze, smoke rolling off it
    glow(g, 70, hz - 40, 90, '#ff5a12', .45); for (const [x, h] of [[40, 34], [58, 48], [72, 62], [88, 44], [104, 30], [120, 36]]) flame(g, x, hz - 50 + (x > 60 && x < 84 ? -14 : 0), h, R);
    for (let i = 0; i < 5; i++) cloud(g, 90 + i * 34, hz - 110 - i * 20, 60 + i * 10, 18, '#150808', .6);
    for (let i = 0; i < 40; i++) spark(g, 30 + R() * 260, hz - 160 + R() * 150, .8 + R() * 1.2, R() < .5 ? '#ffb050' : '#ff6a20', .6 + R() * .4);
    for (let i = 0; i < 6; i++) bird(g, 200 + R() * 280, 40 + R() * 70, .9 + R() * .6, 'rgba(8,2,2,.9)'); }
  if (T.key === 'keepN'){ for (let i = 0; i < 5; i++) bat(g, 60 + R() * 420, 50 + R() * 60, .7 + R() * .6, 'rgba(4,5,10,.9)'); }
  if (T.key === 'fogN'){ for (let i = 0; i < 7; i++) cloud(g, R() * W, hz - 20 - R() * 60, 120 + R() * 80, 16, '#3aa060', .28); }
  if (T.key === 'marshN'){ for (let i = 0; i < 5; i++) bird(g, 280 + R() * 220, 50 + R() * 60, .9, 'rgba(20,0,0,.85)'); }
}
function after(T, g, w, R, hz){
  if (T.key === 'keepN') rain(g, rng(5), 520, .14);
  if (T.key === 'fogN'){ for (let i = 0; i < 6; i++) cloud(g, R() * W, hz + 10 + R() * 30, 160, 14, '#4ac070', .22);
    for (const [x, y, s] of [[60, hz - 18, 2.6], [150, hz - 10, 2], [330, hz - 22, 2.4], [470, hz - 14, 2.2], [250, hz - 40, 1.6], [410, hz - 46, 1.8]]) eyes(g, x, y, s, '#ff2a2a'); }
  if (T.key === 'patchN'){ vband(g, FIELD_TOP, FENCE_Y, '#ff4a12', .1, .04, 0); for (let i = 0; i < 26; i++) spark(g, R() * W, FIELD_TOP + R() * (FENCE_Y - FIELD_TOP), .7 + R(), '#ffa040', .4 + R() * .4); }
  if (T.key === 'marshN') vband(g, FIELD_TOP, FIELD_TOP + 120, '#ff2020', .12, .05, 0);
}
function greyExtras(g, w, R, hz){
  const r2 = rng(33); [[40, 120], [120, 90], [300, 110], [380, 140], [470, 100], [520, 80]].forEach(([x, h]) => deadTree(g, x, hz + 6, h, '#0e0e12', r2, 6));
  for (let i = 0; i < 6; i++) bird(g, 200 + r2() * 300, 40 + r2() * 60, .9, 'rgba(0,0,0,.85)');
  for (let i = 0; i < 160; i++){ const x = r2() * W, y = r2() * H, s = .6 + r2() * 1.3; g.fillStyle = `rgba(210,210,215,${.15 + r2() * .35})`; ell(g, x, y, s, s * .7); }   // ash
}

// ---------- page ----------
const box = document.getElementById('opts');
for (const T of THEMES){
  const el = document.createElement('article'); el.className = 'card';
  el.innerHTML = `<div class="tag${T.custom ? '' : ' dim'}">${T.tag}</div><h3>${T.name}</h3>`;
  const full = build(T), crop = document.createElement('canvas'), CH = FIELD_TOP + 70; crop.width = W * 2; crop.height = CH * 2; crop.getContext('2d').drawImage(full, 0, 0, W * 2, CH * 2, 0, 0, W * 2, CH * 2); crop.className = 'sky'; el.appendChild(crop);   // the sky and horizon, large
  const row = document.createElement('div'); row.className = 'pair';
  const big = full; big.className = 'big'; row.appendChild(big);
  if (!T.custom){ const s = document.createElement('div'); s.className = 'was'; const orig = build({ base:T.base, w:BASE[T.base] }); s.appendChild(orig); s.insertAdjacentHTML('beforeend', `<small>Today's ${BASE[T.base].name}</small>`); big.insertAdjacentHTML?.call;  row.appendChild(s); }
  el.appendChild(row); el.insertAdjacentHTML('beforeend', `<p>${T.desc}</p>`); box.appendChild(el);
}
