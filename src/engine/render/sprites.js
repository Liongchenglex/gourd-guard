import { PTYPES } from '../../data/pumpkins.js';
import { WORLDS } from '../../data/worlds/index.js';
import { K, dpr } from './canvas.js';
import { ell, rrect, tri } from './util.js';
import { COLS, CS, FENCE_Y, FIELD_TOP, GX, GY, H, ROWS, W } from '../state.js';
import { TAU, mulberry } from '../util.js';

export let sprites = [], fogSprite = null, bg = null, bgWorld = -1;

export const RAINBOW_RIBS = [
  { base:'#d63a2a', light:'#ff8a70', dark:'#7f1c13' }, { base:'#8746c2', light:'#c79cf2', dark:'#4c2379' },
  { base:'#f0a020', light:'#ffd98a', dark:'#9a5a08' }, { base:'#3f86d5', light:'#a8d4ff', dark:'#1d4a82' },
  { base:'#5c9c33', light:'#a6e07a', dark:'#305c17' },
];

export function paintPumpkin(g, cx, cy, R, col, lit){
  g.fillStyle = 'rgba(0,0,0,.35)'; ell(g, cx, cy + R * 0.8, R * 0.9, R * 0.2);
  const ribs = [[-0.55, 0.5], [0.55, 0.5], [-0.28, 0.58], [0.28, 0.58], [0, 0.6]];
  ribs.forEach(([ox, rw], i) => {
    const c = col.rainbow ? RAINBOW_RIBS[i] : col;
    const grd = g.createRadialGradient(cx + ox * R - R * 0.18, cy - R * 0.35, R * 0.08, cx + ox * R, cy, R * 0.95);
    grd.addColorStop(0, c.light); grd.addColorStop(0.55, c.base); grd.addColorStop(1, c.dark);
    g.fillStyle = grd;
    g.beginPath(); g.ellipse(cx + ox * R, cy + R * 0.05, rw * R, R * 0.78, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = R * 0.04; g.stroke();
  });
  if (col.rainbow){
    g.fillStyle = 'rgba(255,255,255,.55)';
    for (const [sx, sy, s] of [[-0.45, -0.3, 0.09], [0.4, 0.25, 0.07], [0.1, -0.45, 0.06]]){ ell(g, cx + sx * R, cy + sy * R, s * R, s * R * 0.35); ell(g, cx + sx * R, cy + sy * R, s * R * 0.35, s * R); }
  }
  g.fillStyle = '#5a3a1a';
  g.beginPath(); g.moveTo(cx - R * 0.09, cy - R * 0.6);
  g.quadraticCurveTo(cx - R * 0.06, cy - R * 0.95, cx + R * 0.16, cy - R * 1.02);
  g.lineTo(cx + R * 0.22, cy - R * 0.9);
  g.quadraticCurveTo(cx + R * 0.07, cy - R * 0.84, cx + R * 0.1, cy - R * 0.6); g.closePath(); g.fill();
  g.fillStyle = '#3f7a2a'; ell(g, cx - R * 0.3, cy - R * 0.78, R * 0.22, R * 0.09, -0.45);
  if (lit){
    const fg = g.createRadialGradient(cx, cy + R * 0.08, 0, cx, cy + R * 0.08, R * 0.75);
    fg.addColorStop(0, '#fff8c8'); fg.addColorStop(0.45, '#ffd04a'); fg.addColorStop(1, '#ff8a1f');
    g.fillStyle = fg;
    tri(g, cx - R * 0.3, cy - R * 0.17, R * 0.2); tri(g, cx + R * 0.3, cy - R * 0.17, R * 0.2);
    tri(g, cx, cy + R * 0.03, R * 0.09);
    g.beginPath(); g.moveTo(cx - R * 0.52, cy + R * 0.14);
    g.quadraticCurveTo(cx, cy + R * 0.74, cx + R * 0.52, cy + R * 0.14);
    g.lineTo(cx + R * 0.34, cy + R * 0.26); g.lineTo(cx + R * 0.22, cy + R * 0.16);
    g.lineTo(cx + R * 0.1, cy + R * 0.3); g.lineTo(cx - R * 0.04, cy + R * 0.18);
    g.lineTo(cx - R * 0.18, cy + R * 0.3); g.lineTo(cx - R * 0.3, cy + R * 0.18);
    g.closePath(); g.fill();
  } else if (!col.rainbow){
    g.fillStyle = 'rgba(255,255,255,.28)'; ell(g, cx - R * 0.32, cy - R * 0.32, R * 0.1, R * 0.2, 0.35);
  }
}

export function pumpkinIcon(t, lit, px){
  const c = document.createElement('canvas'); c.width = c.height = px || 96;
  const g = c.getContext('2d'); g.scale(c.width / CS, c.width / CS); paintPumpkin(g, CS / 2, CS / 2 + 3, CS * 0.4, PTYPES[t], lit);
  return c;
}

export function buildSprites(){
  const px = Math.max(24, Math.round(CS * K));
  sprites = PTYPES.map(col => [false, true].map(lit => {
    const c = document.createElement('canvas'); c.width = c.height = px;
    const g = c.getContext('2d'); g.scale(px / CS, px / CS);
    paintPumpkin(g, CS / 2, CS / 2 + 3, CS * 0.4, col, lit);
    return c;
  }));
  const fs = Math.round(256 * Math.min(dpr, 1.5));
  fogSprite = document.createElement('canvas'); fogSprite.width = fogSprite.height = fs;
  const fg = fogSprite.getContext('2d'), gr = fg.createRadialGradient(fs / 2, fs / 2, 0, fs / 2, fs / 2, fs / 2);
  gr.addColorStop(0, 'rgba(210,200,230,.55)'); gr.addColorStop(1, 'rgba(210,200,230,0)');
  fg.fillStyle = gr; fg.fillRect(0, 0, fs, fs);
}

export function buildBg(world){
  bgWorld = world;
  const w = WORLDS[world];
  bg = document.createElement('canvas'); bg.width = Math.round(W * K); bg.height = Math.round(H * K);
  const g = bg.getContext('2d'); g.scale(K, K);
  const hz = FIELD_TOP - 8;
  let gr = g.createLinearGradient(0, 0, 0, hz + 30);
  gr.addColorStop(0, w.sky[0]); gr.addColorStop(0.6, w.sky[1]); gr.addColorStop(1, w.sky[2]);
  g.fillStyle = gr; g.fillRect(0, 0, W, hz + 30);
  const mx = [405, 130, 420][world], my = hz * 0.52 + 14, mr = 30;
  const halo = g.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3.2);
  halo.addColorStop(0, 'rgba(255,240,200,.28)'); halo.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = halo; g.fillRect(mx - mr * 3.3, my - mr * 3.3, mr * 6.6, mr * 6.6);
  g.fillStyle = w.moon; ell(g, mx, my, mr, mr);
  g.fillStyle = 'rgba(0,0,0,.09)'; ell(g, mx - 9, my - 6, 7, 6); ell(g, mx + 10, my + 8, 5, 4); ell(g, mx + 4, my - 12, 3.5, 3);
  const R = mulberry(world * 91 + 7);
  g.fillStyle = 'rgba(10,6,14,.85)';
  g.beginPath(); g.moveTo(0, hz + 10);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, hz - 6 - Math.sin(x * 0.012 + world) * 10 - R() * 5);
  g.lineTo(W, hz + 30); g.lineTo(0, hz + 30); g.closePath(); g.fill();
  g.fillStyle = '#08050c';
  if (world === 0){
    g.beginPath(); g.moveTo(40, hz); g.lineTo(40, hz - 26); g.lineTo(62, hz - 44); g.lineTo(84, hz - 26); g.lineTo(84, hz); g.fill();
    g.fillRect(470, hz - 40, 4, 40); g.fillRect(456, hz - 32, 32, 3); ell(g, 472, hz - 44, 7, 7);
    g.beginPath(); g.moveTo(462, hz - 48); g.lineTo(482, hz - 48); g.lineTo(472, hz - 58); g.fill();
  } else if (world === 1){
    g.fillRect(360, hz - 40, 40, 40); g.beginPath(); g.moveTo(372, hz - 40); g.lineTo(380, hz - 78); g.lineTo(388, hz - 40); g.fill();
    g.fillRect(378, hz - 90, 4, 14); g.fillRect(373, hz - 85, 14, 3);
    g.strokeStyle = '#08050c'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(60, hz); g.lineTo(62, hz - 50); g.lineTo(45, hz - 72); g.moveTo(62, hz - 38); g.lineTo(82, hz - 60); g.moveTo(62, hz - 52); g.lineTo(68, hz - 76); g.stroke();
    g.fillStyle = '#1a2224';
    for (const x of [150, 210, 300, 450]){ rrect(g, x, hz - 12, 12, 16, 6); g.fill(); }
  } else {
    g.fillRect(170, hz - 46, 200, 46);
    g.fillRect(180, hz - 84, 34, 40); g.beginPath(); g.moveTo(174, hz - 84); g.lineTo(197, hz - 118); g.lineTo(220, hz - 84); g.fill();
    g.fillRect(326, hz - 76, 30, 32); g.beginPath(); g.moveTo(320, hz - 76); g.lineTo(341, hz - 104); g.lineTo(362, hz - 76); g.fill();
    g.beginPath(); g.moveTo(230, hz - 46); g.lineTo(270, hz - 76); g.lineTo(310, hz - 46); g.fill();
    g.fillStyle = 'rgba(255,190,90,.75)';
    [[192, hz - 70], [262, hz - 34], [290, hz - 34], [336, hz - 60], [228, hz - 30]].forEach(([x, y]) => g.fillRect(x, y, 7, 9));
  }
  const top = hz + 4;
  gr = g.createLinearGradient(0, top, 0, FENCE_Y + 10);
  gr.addColorStop(0, w.ground[0]); gr.addColorStop(1, w.ground[1]);
  g.fillStyle = gr; g.fillRect(0, top, W, FENCE_Y + 10 - top);
  for (let c = 0; c < COLS; c++){
    g.fillStyle = c % 2 ? 'rgba(255,235,210,.035)' : 'rgba(0,0,0,.12)';
    g.fillRect(GX + c * CS, top, CS, FENCE_Y - top);
    const fur = g.createLinearGradient(GX + c * CS, 0, GX + (c + 1) * CS, 0);
    fur.addColorStop(0, 'rgba(0,0,0,0)'); fur.addColorStop(0.5, 'rgba(0,0,0,.14)'); fur.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fur; g.fillRect(GX + c * CS + CS * 0.25, top, CS * 0.5, FENCE_Y - top);
  }
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, top, GX, FENCE_Y - top); g.fillRect(W - GX, top, GX, FENCE_Y - top);
  g.strokeStyle = 'rgba(255,230,200,.1)'; g.lineWidth = 1.5; g.setLineDash([6, 8]);
  for (let c = 0; c <= COLS; c++){ g.beginPath(); g.moveTo(GX + c * CS, top + 4); g.lineTo(GX + c * CS, FENCE_Y); g.stroke(); }
  g.setLineDash([]);
  g.strokeStyle = 'rgba(255,230,200,.04)'; g.lineWidth = 1;
  for (let y = FENCE_Y - CS; y > top + 20; y -= CS){ g.beginPath(); g.moveTo(GX, y); g.lineTo(W - GX, y); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, top, W, 3);
  const fh = FENCE_Y - top;
  for (let i = 0; i < 60; i++){
    const py = R(), y = top + 12 + py * (fh - 20), s = 0.5 + py * 0.8;
    const c = Math.floor(R() * COLS), x = GX + c * CS + (R() < 0.5 ? 6 + R() * 10 : CS - 6 - R() * 10);
    g.strokeStyle = w.grass; g.lineWidth = 1.5 * s; g.beginPath();
    g.moveTo(x, y); g.lineTo(x - 3 * s, y - 7 * s); g.moveTo(x, y); g.lineTo(x + 1 * s, y - 9 * s); g.moveTo(x, y); g.lineTo(x + 4 * s, y - 6 * s); g.stroke();
  }
  gr = g.createLinearGradient(0, FENCE_Y, 0, H);
  gr.addColorStop(0, '#2c1a10'); gr.addColorStop(1, '#170c06');
  g.fillStyle = gr; g.fillRect(0, FENCE_Y + 4, W, H - FENCE_Y);
  g.strokeStyle = 'rgba(70,120,40,.3)'; g.lineWidth = 3.5; g.lineCap = 'round';
  for (let r = 0; r <= ROWS; r++){
    g.beginPath(); const y = GY + r * CS - 2;
    g.moveTo(0, y); for (let x = 0; x <= W; x += 30) g.quadraticCurveTo(x + 15, y + (R() * 8 - 4), x + 30, y);
    g.stroke();
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    g.fillStyle = (r + c) % 2 ? 'rgba(90,56,34,.45)' : 'rgba(74,44,26,.45)';
    rrect(g, GX + c * CS + 4, GY + r * CS + 4, CS - 8, CS - 8, 16); g.fill();
    g.fillStyle = 'rgba(0,0,0,.2)'; ell(g, GX + c * CS + CS / 2, GY + r * CS + CS / 2 + 4, CS * 0.22, CS * 0.08);
  }
}
