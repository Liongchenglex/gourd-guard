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


// ---------- grim touches (owner, 2026-09-28): small menacing details for the Foggy Hollow and Witchwood nightmares ----------
function boneHand(g, x, y, h, lean, col){   // a skeletal forearm and hand reaching out of the bog
  g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * .4, y - h * .5, x + lean, y - h); g.stroke();
  const hx = x + lean, hy = y - h; g.lineWidth = 1.2;
  for (let i = 0; i < 4; i++){ const a = -Math.PI / 2 + (i - 1.5) * .38 + lean * .01, l = 7 + (i === 1 || i === 2 ? 2 : 0); g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(a) * l * .6, hy + Math.sin(a) * l * .6); g.lineTo(hx + Math.cos(a - .3) * l, hy + Math.sin(a - .3) * l); g.stroke(); }
  g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - 6, hy - 2); g.lineTo(hx - 8, hy - 6); g.stroke();   // thumb
}
function shadeFigure(g, x, y, h, eye){   // a tall hooded figure standing in the fog, just two pale eyes
  g.fillStyle = 'rgba(2,6,4,.92)'; g.beginPath(); g.moveTo(x - h * .16, y); g.quadraticCurveTo(x - h * .2, y - h * .5, x - h * .1, y - h * .82); g.quadraticCurveTo(x, y - h * 1.02, x + h * .1, y - h * .82); g.quadraticCurveTo(x + h * .2, y - h * .5, x + h * .16, y); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x - h * .16, y - h * .55); g.quadraticCurveTo(x - h * .34, y - h * .2, x - h * .3, y + 2); g.lineTo(x - h * .2, y); g.fill();   // a long arm hanging
  glow(g, x, y - h * .8, 12, eye, .45); g.fillStyle = eye; for (const d of [-1, 1]){ g.beginPath(); g.ellipse(x + d * 3, y - h * .8, 1.6, 1, 0, 0, TAU); g.fill(); }
}
function sinkingStone(g, x, y, w, h, tilt, col, rim){ g.save(); g.translate(x, y); g.rotate(tilt); g.fillStyle = col; g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-w / 2, -h + w / 2); g.arc(0, -h + w / 2, w / 2, Math.PI, 0); g.lineTo(w / 2, 0); g.closePath(); g.fill(); g.strokeStyle = rgba(rim, .3); g.lineWidth = 1; g.stroke(); g.fillStyle = rgba(rim, .25); g.fillRect(-1, -h + w * .45, 2, h * .45); g.fillRect(-w * .25, -h + w * .62, w * .5, 2); g.restore(); }
function boat(g, x, y, w, col, rim){ g.fillStyle = col; g.beginPath(); g.ellipse(x, y, w, w * .28, .08, Math.PI, 0); g.fill(); g.strokeStyle = rgba(rim, .35); g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, w, w * .28, .08, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); for (let i = -2; i <= 2; i++){ g.beginPath(); g.moveTo(x + i * w * .3, y - w * .02); g.lineTo(x + i * w * .32, y - w * .24); g.stroke(); } }
function screamFace(g, x, y, s){   // knotholes that make a face in a dead trunk
  g.fillStyle = '#050507'; for (const d of [-1, 1]){ g.beginPath(); g.ellipse(x + d * s * .9, y, s * .55, s * .8, d * -.3, 0, TAU); g.fill(); }
  g.beginPath(); g.ellipse(x, y + s * 2, s * .7, s * 1.3, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(200,200,205,.35)'; g.lineWidth = .8; for (const d of [-1, 1]){ g.beginPath(); g.ellipse(x + d * s * .9, y - s * .1, s * .62, s * .86, d * -.3, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
}
function cage(g, x, y, s, col){ g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - s * 2.2); g.lineTo(x, y - s); g.stroke(); g.lineWidth = 1.3;
  g.beginPath(); g.ellipse(x, y - s, s * .8, s * .25, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(x, y + s, s * .8, s * .25, 0, 0, TAU); g.stroke(); for (let i = -2; i <= 2; i++){ g.beginPath(); g.moveTo(x + i * s * .38, y - s); g.lineTo(x + i * s * .38, y + s); g.stroke(); } }
function web(g, x, y, r){ g.strokeStyle = 'rgba(220,220,225,.35)'; g.lineWidth = .7; for (let i = 0; i < 7; i++){ const a = Math.PI * (.05 + i / 6 * .9); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); } for (let k = 1; k <= 4; k++){ g.beginPath(); for (let i = 0; i <= 6; i++){ const a = Math.PI * (.05 + i / 6 * .9), rr = r * k / 4.3; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr + (i % 2 ? 1.5 : 0); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
  g.fillStyle = '#0a0a0c'; g.beginPath(); g.ellipse(x + r * .35, y + r * .55, 2.6, 3.2, 0, 0, TAU); g.fill(); g.strokeStyle = '#0a0a0c'; g.lineWidth = .8; for (const d of [-1, 1]) for (let i = 0; i < 3; i++){ g.beginPath(); g.moveTo(x + r * .35, y + r * .55); g.lineTo(x + r * .35 + d * 5, y + r * .55 - 2 + i * 2.5); g.stroke(); } }
function skullStake(g, x, y, s){ g.strokeStyle = '#1a1a1e'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - s * 3); g.stroke(); g.fillStyle = '#d8d8dc'; g.beginPath(); g.ellipse(x, y - s * 3.4, s * .8, s * .75, 0, 0, TAU); g.fill(); g.fillRect(x - s * .45, y - s * 3, s * .9, s * .5); g.fillStyle = '#0a0a0c'; for (const d of [-1, 1]){ g.beginPath(); g.ellipse(x + d * s * .32, y - s * 3.45, s * .22, s * .25, 0, 0, TAU); g.fill(); } }


function countFigure(g, x, y, h){   // the Vampire Count on the tower top, cape spread, red eyes
  g.fillStyle = '#020306'; g.beginPath(); g.moveTo(x - h * .15, y); g.lineTo(x - h * .12, y - h * .7); g.quadraticCurveTo(x, y - h * .95, x + h * .12, y - h * .7); g.lineTo(x + h * .15, y); g.closePath(); g.fill();
  g.beginPath(); g.arc(x, y - h * .82, h * .13, 0, TAU); g.fill();
  for (const d of [-1, 1]){ g.beginPath(); g.moveTo(x + d * h * .1, y - h * .7); g.quadraticCurveTo(x + d * h * .55, y - h * .9, x + d * h * .72, y - h * .45); g.lineTo(x + d * h * .58, y - h * .38); g.lineTo(x + d * h * .5, y - h * .2); g.lineTo(x + d * h * .36, y - h * .28); g.lineTo(x + d * h * .2, y - h * .05); g.closePath(); g.fill();   // cape wing
    g.beginPath(); g.moveTo(x + d * h * .08, y - h * .88); g.lineTo(x + d * h * .2, y - h * 1.02); g.lineTo(x + d * h * .12, y - h * .84); g.fill(); }   // collar points
  glow(g, x, y - h * .83, 10, '#ff1a1a', .6); g.fillStyle = '#ff3a2a'; for (const d of [-1, 1]){ g.beginPath(); g.ellipse(x + d * h * .05, y - h * .83, 1.3, .8, 0, 0, TAU); g.fill(); }
}
function gargoyle(g, x, y, s, dir){   // a crouched gargoyle on the wall, eyes glowing
  g.save(); g.translate(x, y); g.scale(dir, 1); g.fillStyle = '#06070c';
  g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(-s * 1.1, -s * .9, -s * .2, -s * 1.1); g.quadraticCurveTo(s * .3, -s * 1.7, s * .9, -s * 1.3); g.lineTo(s * 1.2, -s * .9); g.quadraticCurveTo(s * .7, -s * .7, s * .6, 0); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-s * .5, -s * 1.1); g.lineTo(-s * 1.6, -s * 2.1); g.lineTo(-s * 1.2, -s * 1.2); g.lineTo(-s * 1.9, -s * 1.3); g.lineTo(-s * .8, -s * .7); g.closePath(); g.fill();   // wing
  g.beginPath(); g.moveTo(s * .6, -s * 1.55); g.lineTo(s * .75, -s * 2); g.lineTo(s * .85, -s * 1.5); g.fill();   // horn
  g.restore(); glow(g, x + dir * s * .85, y - s * 1.25, 6, '#ffb020', .6); g.fillStyle = '#ffd040'; g.beginPath(); g.ellipse(x + dir * s * .85, y - s * 1.25, 1.2, .7, 0, 0, TAU); g.fill();
}
function tentacle(g, x, y, h, curl, w, col, rim){   // rising out of the sea, curling at the tip, with suckers
  const pts = [[x, y]]; let px = x, py = y, n = 22, step = h / n; for (let i = 1; i <= n; i++){ const f = i / n, a = Math.sign(curl) * (f * f * f * Math.abs(curl) * 1.6 + Math.sin(f * 4) * .18); px += Math.sin(a) * step; py -= Math.cos(a) * step; pts.push([px, py]); }   // rises, sways, and curls over at the tip
  for (let i = 0; i < pts.length - 1; i++){ const f = i / (pts.length - 1), lw = w * (1 - f * .85); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[i + 1]); g.stroke();
    g.strokeStyle = rgba(rim, .35); g.lineWidth = Math.max(.6, lw * .2); g.beginPath(); g.moveTo(pts[i][0] - lw * .3, pts[i][1]); g.lineTo(pts[i + 1][0] - lw * .3, pts[i + 1][1]); g.stroke();
    if (i % 3 === 1 && f < .8){ g.fillStyle = rgba('#ffb0a0', .5); g.beginPath(); g.ellipse(pts[i][0] + lw * .32, pts[i][1], lw * .16, lw * .12, 0, 0, TAU); g.fill(); } }
}
function fin(g, x, y, s, col, rim){ g.fillStyle = col; g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x - s * .2, y - s * 1.6, x + s * .5, y - s * 1.8); g.quadraticCurveTo(x + s * .2, y - s * .8, x + s * .8, y); g.closePath(); g.fill(); g.strokeStyle = rgba(rim, .4); g.lineWidth = 1; g.beginPath(); g.moveTo(x - s * 1.6, y + 1); g.quadraticCurveTo(x, y - 1, x + s * 1.6, y + 1); g.stroke(); }
function ghostShip(g, x, y, s){ g.save(); g.globalAlpha = .45; g.fillStyle = '#ffd0c8'; g.beginPath(); g.moveTo(x - s * 2, y); g.lineTo(x + s * 2, y); g.lineTo(x + s * 1.6, y + s * .5); g.lineTo(x - s * 1.7, y + s * .5); g.closePath(); g.fill();
  g.strokeStyle = '#ffd0c8'; g.lineWidth = 1; for (const mx of [-.8, .5]){ g.beginPath(); g.moveTo(x + mx * s, y); g.lineTo(x + mx * s, y - s * 2.4); g.stroke();
    g.beginPath(); g.moveTo(x + mx * s - s * .6, y - s * 2.1); g.lineTo(x + mx * s + s * .6, y - s * 2.0); g.lineTo(x + mx * s + s * .45, y - s * .9); g.lineTo(x + mx * s + s * .1, y - s * 1.2); g.lineTo(x + mx * s - s * .2, y - s * .8); g.lineTo(x + mx * s - s * .55, y - s * 1.1); g.closePath(); g.globalAlpha = .3; g.fill(); g.globalAlpha = .45; }   // tattered sails
  g.restore(); glow(g, x, y - s, s * 3, '#ffb0a0', .12); }

// ---------- the themes ----------
const THEMES = [
  { key:'hallow', name:"Hallow's End", tag:'World 6', base:0, desc:"The heart of Halloween. A giant jack-o'-lantern moon grins over a crooked town of spires and lit windows, an orange and violet aurora ripples across the sky, lanterns drift upward and a great twisted tree hangs heavy with glowing pumpkins.",
    w:{ sky:['#07030f','#2a0d3c','#d4602a'], ground:['#3a2233','#170b14'], moon:'#ff9a2a', halo:'#ff7a1a', sil:['#24102f','#0b0510'], rim:'#ffb060', soil:['#7c4a2a','#4a2a18','#26140a'] },
    moonAt:[W / 2, 80, 46], custom:true },
  { key:'patchN', name:'Pumpkin Patch: Nightmare', tag:'Nightmare', base:0, desc:'An eclipse swallows the harvest moon, leaving a burning corona. The barn is ablaze, smoke rolls across the sky, embers drift over the field and crows circle.',
    w:{ sky:['#050204','#2a0806','#c2410f'], ground:['#2e1a16','#120a08'], moon:'#1a0808', halo:'#ff7a1a', sil:['#1a0808','#080303'], rim:'#ff8a3a', soil:['#5e3620','#3a1e10','#1a0c06'] } },
  { key:'fogN', name:'Foggy Hollow: Nightmare', tag:'Nightmare', base:1, desc:'A sickly green moon over a black marsh. Poison-green fog swallows sinking gravestones and a capsized boat, bony hands reach out of the bog, a tall hooded figure stands in the mist, and red eyes watch from everywhere.',
    w:{ sky:['#020604','#0b1f12','#2f6a3a'], ground:['#16261a','#08110a'], moon:'#d8ffb0', halo:'#5aff7a', sil:['#0d2014','#040a06'], rim:'#9aff9a', soil:['#3e4a2c','#232c18','#10150a'] } },
  { key:'keepN', name:'Crumbling Keep: Nightmare', tag:'Nightmare', base:2, desc:'A thunderstorm breaks over the keep. Forked lightning lights up the Vampire Count on the tallest tower, cape spread and eyes red; gargoyles with burning eyes crouch on the walls, crows line the battlements and the portcullis hangs broken in the rain.',
    w:{ sky:['#03050c','#141c33','#3a4a6a'], ground:['#2a2c36','#12131a'], moon:'#c8d4ff', halo:'#6a80c8', sil:['#10131e','#05060b'], rim:'#b8c8ff', soil:['#4a4c58','#2c2e38','#15161c'] } },
  { key:'marshN', name:'Drowned Marsh: Nightmare', tag:'Nightmare', base:3, desc:'The red sea. A huge blood moon hangs low over crimson water. Tentacles rise beside the wreck, shark fins circle, a ghost ship with tattered sails drifts on the horizon and the lighthouse burns red.',
    w:{ sky:['#0c0206','#3e0610','#a8141c'], ground:['#3a1c1a','#170a0a'], moon:'#ff3a26', halo:'#c01010', sil:['#2a0508','#100203'], rim:'#ff7a60', soil:['#6a3a2c','#43221a','#21100c'] }, moonAt:[110, 70, 44] },
  { key:'woodN', name:'Witchwood: Nightmare', tag:'Nightmare', base:4, desc:'All the colour drained away, except for what watches you. Bare skeletal trees with screaming faces in their trunks, iron cages swinging from the branches, cobwebs and a spider, skulls on stakes, ash falling, and the witch\'s window burning red.',
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
  if (T.key === 'keepN'){ for (let i = 0; i < 5; i++) bat(g, 60 + R() * 420, 50 + R() * 60, .7 + R() * .6, 'rgba(4,5,10,.9)');
    countFigure(g, 236, 58, 34);
    gargoyle(g, 150, 90, 6, 1); gargoyle(g, 194, 90, 5.5, -1); gargoyle(g, 380, 94, 6, 1);
    for (const x of [352, 364, 404, 414]) bird(g, x, 90, .55, 'rgba(2,3,6,.95)');
    g.fillStyle = '#05060b'; for (let i = 0; i < 5; i++){ const x = 290 + i * 5, l = [8, 14, 6, 11, 4][i]; g.fillRect(x, 108, 2, l); g.beginPath(); g.moveTo(x - .5, 108 + l); g.lineTo(x + 1, 111 + l); g.lineTo(x + 2.5, 108 + l); g.fill(); } }   // broken portcullis teeth
  if (T.key === 'fogN'){
    for (const [x, t] of [[70, -.25], [96, .18], [122, -.08], [488, .3]]) sinkingStone(g, x, hz + 4, 12, 22, t, '#0e1d12', w.rim);
    boat(g, 420, hz + 2, 26, '#081208', w.rim);
    for (const [x, h, l] of [[176, 26, -6], [196, 18, 5], [352, 30, 8], [512, 20, -4]]) boneHand(g, x, hz + 4, h, l, 'rgba(200,225,195,.75)');
    shadeFigure(g, 284, hz - 2, 64, '#caffc0');
    for (let i = 0; i < 7; i++) cloud(g, R() * W, hz - 20 - R() * 60, 120 + R() * 80, 16, '#3aa060', .28); }
  if (T.key === 'marshN'){ for (let i = 0; i < 5; i++) bird(g, 280 + R() * 220, 50 + R() * 60, .9, 'rgba(20,0,0,.85)');
    ghostShip(g, 360, hz - 44, 9);
    for (const [x, h, c, wd] of [[322, 96, 2.6, 13], [372, 74, -2.8, 10], [130, 62, 2.4, 8]]) tentacle(g, x, hz + 4, h, c, wd, '#1a0306', '#ff6a50');
    fin(g, 60, hz - 4, 10, '#140204', '#ff7a60'); fin(g, 210, hz - 8, 7, '#140204', '#ff7a60'); fin(g, 470, hz - 6, 8, '#140204', '#ff7a60');
    glow(g, 507, 42, 44, '#ff1a1a', .6); g.fillStyle = '#ff5a40'; g.beginPath(); g.ellipse(507, 42, 4, 3.4, 0, 0, TAU); g.fill(); const bg2 = g.createLinearGradient(507, 42, 300, 30); bg2.addColorStop(0, 'rgba(255,50,30,.6)'); bg2.addColorStop(1, 'rgba(255,50,30,0)'); g.fillStyle = bg2; g.beginPath(); g.moveTo(507, 39); g.lineTo(300, 6); g.lineTo(300, 56); g.lineTo(507, 45); g.closePath(); g.fill(); }   // the lighthouse burns red
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
  const FACES = [[42, hz - 30, 5.5], [302, hz - 30, 5], [470, hz - 28, 4.6]]; for (const [x, y, s] of FACES) screamFace(g, x, y, s);
  cage(g, 338, hz - 74, 12, '#55555e'); cage(g, 508, hz - 58, 9, '#55555e');
  web(g, 120, hz - 88, 22); web(g, 386, hz - 110, 18);
  for (const [x, s] of [[232, 5.5], [262, 4.6], [522, 5]]) skullStake(g, x, hz + 8, s);
  // the only colour left: the witch's window burning red, and eyes in the hollows
  glow(g, 191, 114, 22, '#ff1a1a', .55); g.fillStyle = '#ff3a2a'; g.fillRect(187, 110, 8, 8);
  for (const [x, y, s] of FACES) for (const d of [-1, 1]){ glow(g, x + d * s * .9, y, s * 2.4, '#ff2020', .5); g.fillStyle = '#ff4a3a'; g.beginPath(); g.ellipse(x + d * s * .9, y + s * .1, s * .26, s * .2, 0, 0, TAU); g.fill(); }   // red pupils inside the knothole eyes
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
