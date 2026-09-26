import { sprites } from './sprites.js';
import { PTYPES } from '../../data/pumpkins.js';
import { mS, mY } from '../monsters.js';
import { ctx } from './canvas.js';
import { FIELD_TOP } from '../state.js';
import { TYPES, VARIANTS } from '../../data/monsters.js';
import { CS } from '../state.js';

let cx = ctx;   // drawing context; monsterIcon() swaps it for an offscreen canvas
import { ell, mix, rrect, tri } from './util.js';
import { clamp, TAU } from '../util.js';

export function drawMonster(m, t){
  let y = mY(m); const s = mS(m);
  if (m.eating && m.frozenT <= 0) y += Math.sin(m.ph * 14) * 2.5;
  const fade = m.demo ? 1 : Math.min(1, m.age / 0.5);
  const blue = m.slowT > 0 || m.frozenT > 0;
  cx.save();
  cx.translate(m.x, y); cx.scale(s, s);
  cx.globalAlpha = fade;
  cx.fillStyle = 'rgba(0,0,0,.35)';
  if (m.type === 'bat') ell(cx, 0, m.r + 18, m.r * 0.6, 4);
  else ell(cx, 0, m.r * 0.95, m.r * (m.type === 'imp' ? 0.9 - m.hop * 0.25 : 1), m.r * 0.22);
  const F = c => m.flash > 0 ? '#ffffff' : blue ? mix(c, '#7fd0ff', 0.6) : m.tint ? mix(c, m.tint, 0.45) : c;
  const k = m.type === 'boss' ? 1 : 0.95;
  cx.scale(k, k);
  if (m.rise > 0){ cx.translate(0, m.r * 0.6); cx.scale(1.15, 0.35); cx.globalAlpha = fade * 0.85; }   // collapsed mummy lies flat
  switch (m.type){
    case 'ghoul': drawGhoul(m, F); break;
    case 'bat': drawBat(m, F); break;
    case 'imp': drawImp(m, F); break;
    case 'brute': drawBrute(m, F); break;
    case 'wisp': drawWisp(m, F, t); break;
    case 'wraith': drawWraith(m, F, t); break;
    case 'rider': drawRider(m, F, t); break;
    case 'doctor': drawDoctor(m, F, t); break;
    case 'mummy': drawMummy(m, F, t); break;
    case 'knight': drawKnight(m, F, t); break;
    case 'hauler': drawHauler(m, F, t); break;
    case 'gargoyle': drawGargoyle(m, F, t); break;
    case 'archer': drawArcher(m, F, t); break;
    case 'vampire': drawVampire(m, F, t); break;
    case 'crawler': drawCrawler(m, F, t); break;
    case 'sailor': drawSailor(m, F, t); break;
    case 'diver': drawDiver(m, F, t); break;
    case 'slime': drawSlime(m, F, t); break;
    case 'blob': drawBlob(m, F, t); break;
    case 'chameleon': drawChameleon(m, F, t, false); break;
    case 'rchameleon': drawChameleon(m, F, t, true); break;
    case 'mirror': drawMirror(m, F, t); break;
    case 'firemummy': drawMummy(m, F, t); drawFlames(m, t); break;
    case 'fogwalker': drawFogwalker(m, F, t); break;
    case 'witch': drawWitch(m, F, t); break;
    case 'bulwark': drawBulwark(m, F, t); break;
    case 'turtle': drawTurtle(m, F, t); break;
    case 'boss': if (m.kind === 'poltergeist') drawPoltergeist(m, F, t); else if (m.kind === 'vampirecount') drawVampireCount(m, F, t); else if (m.kind === 'twintides') drawTwinTide(m, F, t); else if (m.kind === 'hexwitch') drawHexwitch(m, F, t); else drawBoss(m, F, t); break;
  }

  if (m.frozenT > 0){
    cx.globalAlpha = fade * 0.5; cx.fillStyle = '#d8f4ff'; cx.strokeStyle = '#ffffff'; cx.lineWidth = 2;
    rrect(cx, -m.r * 1.15, -m.r * 1.45, m.r * 2.3, m.r * 2.6, 10); cx.fill(); cx.stroke();
    cx.globalAlpha = fade * 0.8; cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.beginPath(); cx.moveTo(-m.r * 0.8, -m.r); cx.lineTo(-m.r * 0.3, -m.r * 1.3); cx.stroke();
  }
  cx.restore();
  if (m.demo) return;
  const lift = m.type === 'imp' ? m.hop * 14 * s : 0;
  let by = y - m.r * s * 1.45 - 10 - lift - (m.type === 'boss' ? 30 : 0);
  if (by < FIELD_TOP + 4) by = y + m.r * s * 1.25 + 8;   // a boss on the top row (Twin Tides) carries its bar below it, clear of the tools tray (owner)
  cx.globalAlpha = fade;
  if (m.maxHp > 8){
    const bw = Math.max(40, m.r * 1.7) * s, bx = m.x - bw / 2;
    cx.fillStyle = 'rgba(0,0,0,.6)'; rrect(cx, bx - 1, by - 1, bw + 2, 8, 3.5); cx.fill();
    cx.fillStyle = '#c77dff'; rrect(cx, bx, by, Math.max(0, bw * m.hp / m.maxHp), 6, 3); cx.fill();
  } else if (m.maxHp >= 2 || m.hp < m.maxHp){
    const n = Math.ceil(m.maxHp), d = 8, gap = 3, tw = n * d + (n - 1) * gap;
    for (let i = 0; i < n; i++){
      const px = m.x - tw / 2 + i * (d + gap) + d / 2, fill = clamp(m.hp - i, 0, 1);
      cx.fillStyle = 'rgba(0,0,0,.65)'; ell(cx, px, by, d / 2 + 1.5, d / 2 + 1.5);
      cx.fillStyle = 'rgba(255,255,255,.18)'; ell(cx, px, by, d / 2, d / 2);
      if (fill > 0){ cx.save(); cx.beginPath(); cx.rect(px - d / 2, by - d / 2, d * fill, d); cx.clip(); cx.fillStyle = '#ff5a4d'; ell(cx, px, by, d / 2, d / 2); cx.restore(); }
    }
  }
  if (m.bulk === 2){ cx.fillStyle = '#bcd0ff'; cx.font = 'bold 13px Fredoka, system-ui, sans-serif'; cx.textAlign = 'left'; cx.fillText('×2', m.x + Math.ceil(m.maxHp) * 5.5 + 8, by + 5); }   // bulwark aura
  const sign = m.colourLock != null ? m.colourLock : m.colourImmune;
  if (sign != null && sprites[sign]){   // chameleons carry their pumpkin above the health bar; reverse ones with an X through it
    const sz = 30, sy = by - 12 - sz;
    cx.drawImage(sprites[sign][0], m.x - sz / 2, sy, sz, sz);
    if (m.colourImmune != null){ cx.strokeStyle = '#ff3a3a'; cx.lineWidth = 3.5; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(m.x - 11, sy + 4); cx.lineTo(m.x + 11, sy + sz - 4); cx.moveTo(m.x + 11, sy + 4); cx.lineTo(m.x - 11, sy + sz - 4); cx.stroke(); }
  }
  if (m.healing){ cx.fillStyle = '#ff6a6a'; cx.font = 'bold 22px Fredoka, system-ui, sans-serif'; cx.textAlign = 'center'; cx.fillText(`heal ×${m.healHits}`, m.x, by - 14); cx.textAlign = 'left'; }
  cx.globalAlpha = 1;
}

export function drawGhoul(m, F){
  const sw = m.eating ? 0 : Math.sin(m.ph * 6);
  cx.fillStyle = F('#3a2f4b'); ell(cx, -8, 20 + sw * 2, 6, 7); ell(cx, 8, 20 - sw * 2, 6, 7);
  cx.fillStyle = F('#5b4a73');
  cx.beginPath(); cx.moveTo(-17, -6); cx.quadraticCurveTo(-21, 12, -15, 22);
  cx.lineTo(-9, 17); cx.lineTo(-4, 23); cx.lineTo(2, 17); cx.lineTo(8, 23); cx.lineTo(15, 21);
  cx.quadraticCurveTo(21, 12, 17, -6); cx.quadraticCurveTo(0, -15, -17, -6); cx.fill();
  cx.strokeStyle = F('#8fae78'); cx.lineWidth = 6; cx.lineCap = 'round';
  const reach = m.eating ? Math.sin(m.ph * 14) * 3 : 0;
  cx.beginPath(); cx.moveTo(-14, -3); cx.lineTo(-21 + reach, 9 + sw * 4 + (m.eating ? 6 : 0)); cx.stroke();
  cx.beginPath(); cx.moveTo(14, -3); cx.lineTo(21 - reach, 9 - sw * 4 + (m.eating ? 6 : 0)); cx.stroke();
  cx.fillStyle = F('#8fae78'); ell(cx, -21 + reach, 10 + sw * 4 + (m.eating ? 6 : 0), 4.5, 4.5); ell(cx, 21 - reach, 10 - sw * 4 + (m.eating ? 6 : 0), 4.5, 4.5);
  ell(cx, 0, -16, 13, 14);
  cx.fillStyle = F('#6f8a5c'); ell(cx, -4, -27, 6, 3, -0.3);
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ffe066'; ell(cx, -5, -17, 3.4, 4.2); ell(cx, 5, -17, 3.4, 4.2);
  cx.fillStyle = '#1a1020'; ell(cx, -5, -16, 1.4, 2); ell(cx, 5, -16, 1.4, 2);
  cx.strokeStyle = '#2a1a2a'; cx.lineWidth = 1.8;
  const jaw = m.eating ? Math.abs(Math.sin(m.ph * 14)) * 3 : 0;
  cx.beginPath(); cx.moveTo(-6, -8 + jaw); cx.lineTo(-3, -6 + jaw); cx.lineTo(0, -8 + jaw); cx.lineTo(3, -6 + jaw); cx.lineTo(6, -8 + jaw); cx.stroke();
}

export function wing(f, F){
  cx.fillStyle = F('#3a2450');
  cx.beginPath(); cx.moveTo(-6, -4);
  cx.quadraticCurveTo(-20, -18 - f * 8, -33, -6 - f * 12);
  cx.quadraticCurveTo(-28, 0 - f * 4, -24, 5 - f * 3);
  cx.quadraticCurveTo(-20, -1, -15, 8 - f * 1);
  cx.quadraticCurveTo(-11, 2, -6, 8); cx.closePath(); cx.fill();
}

export function drawBat(m, F){
  const f = m.frozenT > 0 ? 0.3 : Math.sin(m.ph * 16);
  cx.translate(0, Math.sin(m.ph * 5) * 3);
  wing(f, F); cx.save(); cx.scale(-1, 1); wing(f, F); cx.restore();
  cx.fillStyle = F('#4c2d66'); ell(cx, 0, 0, 10, 12);
  cx.beginPath(); cx.moveTo(-8, -6); cx.lineTo(-7, -17); cx.lineTo(-2, -9); cx.moveTo(8, -6); cx.lineTo(7, -17); cx.lineTo(2, -9); cx.fill();
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ff4d6d'; ell(cx, -4, -3, 2.6, 2.6); ell(cx, 4, -3, 2.6, 2.6);
  cx.fillStyle = '#fff'; tri(cx, -2.5, 5, 2); tri(cx, 2.5, 5, 2);
}

export function drawImp(m, F){
  cx.translate(0, -m.hop * 14);
  cx.strokeStyle = F('#a52a22'); cx.lineWidth = 3; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(8, 10); cx.quadraticCurveTo(24, 12, 20, -4); cx.stroke();
  cx.fillStyle = F('#a52a22'); tri(cx, 20, -7, 4);
  cx.fillStyle = F('#e0503a'); ell(cx, 0, 5, 13, 13);
  cx.fillStyle = F('#f39a6b'); ell(cx, 0, 9, 7.5, 7);
  cx.fillStyle = F('#e0503a'); ell(cx, 0, -12, 12.5, 11);
  cx.fillStyle = F('#f3e1c4');
  cx.beginPath(); cx.moveTo(-9, -18); cx.quadraticCurveTo(-15, -26, -12, -32); cx.lineTo(-5, -21); cx.fill();
  cx.beginPath(); cx.moveTo(9, -18); cx.quadraticCurveTo(15, -26, 12, -32); cx.lineTo(5, -21); cx.fill();
  cx.fillStyle = m.flash > 0 ? '#fff' : '#fff6a0'; ell(cx, -4.5, -13, 3.2, 3.6); ell(cx, 4.5, -13, 3.2, 3.6);
  cx.fillStyle = '#1a0a08'; ell(cx, -4.5, -13, 1, 2.6); ell(cx, 4.5, -13, 1, 2.6);
  cx.strokeStyle = '#fff'; cx.lineWidth = 2; cx.beginPath(); cx.arc(0, -8, 5, 0.2, Math.PI - 0.2); cx.stroke();
  cx.fillStyle = F('#c53e2e'); ell(cx, -8, 18, 4, 3); ell(cx, 8, 18, 4, 3);
}

export function drawBrute(m, F){
  const sw = m.eating ? Math.sin(m.ph * 12) * 2 : Math.sin(m.ph * 3.2);
  cx.fillStyle = F('#3d4a2c'); ell(cx, -28, 6 + sw * 3, 9, 13, 0.3); ell(cx, 28, 6 - sw * 3, 9, 13, -0.3);
  cx.fillStyle = F('#4d5b3a');
  cx.beginPath(); cx.moveTo(-30, 26); cx.quadraticCurveTo(-34, -28, 0, -30); cx.quadraticCurveTo(34, -28, 30, 26); cx.quadraticCurveTo(0, 32, -30, 26); cx.fill();
  cx.fillStyle = F('#6f8a45'); ell(cx, -12, -18, 10, 6, -0.3); ell(cx, 14, -12, 8, 5, 0.4); ell(cx, 18, 12, 7, 5); ell(cx, -18, 14, 6, 4);
  cx.fillStyle = F('#7d766a'); ell(cx, 2, -26, 7, 5); ell(cx, -20, -4, 5, 4); ell(cx, 22, -4, 4, 3.5);
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ff6a3d'; ell(cx, -9, -6, 3.5, 3); ell(cx, 9, -6, 3.5, 3);
  const jaw = m.eating ? Math.abs(Math.sin(m.ph * 12)) * 4 : 0;
  cx.fillStyle = '#1b140e'; rrect(cx, -14, 4, 28, 11 + jaw, 5); cx.fill();
  cx.fillStyle = '#efe4d0'; tri(cx, -9, 3, 5); tri(cx, 9, 3, 5);
}

export function drawWisp(m, F, t){
  cx.fillStyle = F('#cfe8f2');
  cx.beginPath(); cx.moveTo(-18, 16); cx.lineTo(-18, -6);
  cx.quadraticCurveTo(-18, -30, 0, -30); cx.quadraticCurveTo(18, -30, 18, -6); cx.lineTo(18, 16);
  for (let i = 0; i < 4; i++){ const x1 = 18 - (i + 0.5) * 9, x2 = 18 - (i + 1) * 9; cx.quadraticCurveTo(x1, 24 + Math.sin(t * 6 + i) * 4, x2, 16); }
  cx.closePath(); cx.fill();
  cx.fillStyle = F('#1c2a3a'); ell(cx, 0, -12, 11, 12);
  cx.fillStyle = m.flash > 0 ? '#fff' : '#7ff9ff'; ell(cx, -4.5, -13, 2.6, 3.6); ell(cx, 4.5, -13, 2.6, 3.6);
  cx.strokeStyle = F('#a9cbd9'); cx.lineWidth = 5; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(-16, 0); cx.quadraticCurveTo(-26, 6, -22, 14); cx.stroke();
  cx.beginPath(); cx.moveTo(16, 0); cx.quadraticCurveTo(26, 6, 22, 14); cx.stroke();
}

export function drawMummy(m, F, t){
  const r = m.r;
  cx.fillStyle = F('#d8cfb0');
  ell(cx, 0, r * 0.15, r * 0.78, r * 0.95);            // body
  ell(cx, 0, -r * 0.75, r * 0.6, r * 0.62);            // head
  cx.strokeStyle = F('#a99c7a'); cx.lineWidth = 2.2;   // bandage lines
  for (let i = -3; i <= 3; i++){ cx.beginPath(); cx.moveTo(-r * 0.75, i * r * 0.26 + Math.sin(m.ph + i) * 2); cx.lineTo(r * 0.75, i * r * 0.26 + 4 + Math.cos(m.ph + i) * 2); cx.stroke(); }
  cx.beginPath(); cx.moveTo(-r * 0.55, -r * 0.9); cx.lineTo(r * 0.55, -r * 0.7); cx.stroke();
  cx.beginPath(); cx.moveTo(-r * 0.55, -r * 0.55); cx.lineTo(r * 0.55, -r * 0.42); cx.stroke();
  cx.fillStyle = m.flash > 0 ? '#fff' : '#3b1d0c'; ell(cx, -r * 0.2, -r * 0.72, r * 0.16, r * 0.18);   // one eye
  cx.fillStyle = '#ff9a3a'; ell(cx, -r * 0.2, -r * 0.72, r * 0.07, r * 0.09);
  cx.strokeStyle = F('#c9bd9a'); cx.lineWidth = 6; cx.lineCap = 'round';                            // arms out
  const sw = Math.sin(m.ph * 3) * 4;
  cx.beginPath(); cx.moveTo(-r * 0.6, -r * 0.1); cx.lineTo(-r * 1.15, r * 0.05 + sw); cx.stroke();
  cx.beginPath(); cx.moveTo(r * 0.6, -r * 0.1); cx.lineTo(r * 1.15, r * 0.05 - sw); cx.stroke();
}
export function drawBoss(m, F, t){   // The Gravekeeper: hooded digger with a lantern and a shovel
  const glow = cx.createRadialGradient(-34, -26, 4, -34, -26, 70);
  glow.addColorStop(0, 'rgba(255,200,90,.45)'); glow.addColorStop(1, 'rgba(255,200,90,0)');
  cx.fillStyle = glow; cx.fillRect(-104, -96, 140, 140);
  const aura = cx.createRadialGradient(0, 0, 10, 0, 0, 80);
  aura.addColorStop(0, 'rgba(120,80,200,.25)'); aura.addColorStop(1, 'rgba(120,80,200,0)');
  cx.fillStyle = aura; cx.fillRect(-80, -90, 160, 170);
  // shovel (right)
  cx.strokeStyle = F('#6b4a2b'); cx.lineWidth = 5; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(30, -40); cx.lineTo(38, 34); cx.stroke();
  cx.fillStyle = F('#9a9ea8'); cx.beginPath(); cx.moveTo(28, 30); cx.lineTo(50, 30); cx.lineTo(46, 52); cx.quadraticCurveTo(39, 60, 32, 52); cx.closePath(); cx.fill();
  // lantern pole (left)
  cx.strokeStyle = F('#4a3020'); cx.lineWidth = 4;
  cx.beginPath(); cx.moveTo(-26, -8); cx.lineTo(-38, -52); cx.stroke();
  cx.fillStyle = F('#3a2a20'); rrect(cx, -44, -36, 20, 24, 4); cx.fill();
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ffd35a'; rrect(cx, -41, -33, 14, 18, 3); cx.fill();
  cx.fillStyle = '#fff3a0'; ell(cx, -34, -22 + Math.sin(t * 9) * 1.5, 3, 5);
  // robe
  cx.fillStyle = F('#241a2e');
  cx.beginPath(); cx.moveTo(-30, 44); cx.lineTo(-28, -10); cx.quadraticCurveTo(-30, -52, 0, -60); cx.quadraticCurveTo(30, -52, 28, -10); cx.lineTo(30, 44);
  for (let i = 0; i < 5; i++){ const x1 = 30 - (i + 0.5) * 12, x2 = 30 - (i + 1) * 12; cx.quadraticCurveTo(x1, 54 + Math.sin(t * 5 + i) * 4, x2, 44); }
  cx.closePath(); cx.fill();
  cx.fillStyle = F('#3a2a48'); cx.beginPath(); cx.moveTo(-22, -6); cx.quadraticCurveTo(0, 6, 22, -6); cx.lineTo(24, 4); cx.quadraticCurveTo(0, 16, -24, 4); cx.closePath(); cx.fill();   // shoulder cape edge
  // hood shadow and eyes
  cx.fillStyle = '#0c0812'; cx.beginPath(); cx.moveTo(-18, -20); cx.quadraticCurveTo(0, -46, 18, -20); cx.quadraticCurveTo(0, -14, -18, -20); cx.fill();
  const eye = m.flash > 0 ? '#fff' : '#b6ff5a';
  cx.fillStyle = eye; ell(cx, -7, -26, 4, 3.5); ell(cx, 7, -26, 4, 3.5);
  cx.fillStyle = '#10200a'; ell(cx, -7, -26, 1.5, 2); ell(cx, 7, -26, 1.5, 2);
  // hands
  cx.fillStyle = F('#cfc6b0'); ell(cx, -27, -8, 5, 4); ell(cx, 31, -2, 5, 4);
}

/** Offscreen icon of a monster type (for level previews and intro cards). */
export function monsterIcon(key, px){
  const c = document.createElement('canvas'); c.width = c.height = px || 96;
  const v = VARIANTS[key];
  const kind = v ? v.base : key, T = TYPES[kind], isBoss = !!T.boss, type = isBoss ? 'boss' : kind;
  const m = { type, kind, r:T.r, ph:1.3, flash:0, hop:0.4, slowT:0, frozenT:0, rise:0, eating:false, age:5, demo:true, x:0, p:0.5, hp:T.hp, maxHp:T.hp, form:1, carrier:true, tint:v ? v.tint : null, vanish:5, colourLock:kind === 'chameleon' ? 0 : null, colourImmune:kind === 'rchameleon' ? 1 : null, reflecting:kind === 'mirror' };
  const prev = cx; cx = c.getContext('2d');
  const box = isBoss ? 150 : T.r * 3.2;
  cx.scale(c.width / box, c.width / box); cx.translate(box / 2, box / 2 + (isBoss ? 6 : T.r * 0.15));
  cx.fillStyle = 'rgba(0,0,0,.3)'; ell(cx, 0, T.r * 0.95, T.r, T.r * 0.22);
  const F = col => m.tint ? mix(col, m.tint, 0.45) : col;
  switch (type){
    case 'ghoul': drawGhoul(m, F); break;
    case 'bat': drawBat(m, F); break;
    case 'imp': drawImp(m, F); break;
    case 'brute': drawBrute(m, F); break;
    case 'wisp': drawWisp(m, F, 1); break;
    case 'wraith': drawWraith(m, F, 1); break;
    case 'rider': drawRider(m, F, 1); break;
    case 'doctor': drawDoctor(m, F, 1); break;
    case 'mummy': drawMummy(m, F, 1); break;
    case 'knight': drawKnight(m, F, 1); break;
    case 'hauler': drawHauler(m, F, 1); break;
    case 'gargoyle': drawGargoyle(m, F, 1); break;
    case 'archer': drawArcher(m, F, 1); break;
    case 'vampire': drawVampire(m, F, 1); break;
    case 'crawler': drawCrawler(m, F, 1); break;
    case 'sailor': drawSailor(m, F, 1); break;
    case 'diver': drawDiver(m, F, 1); break;
    case 'slime': drawSlime(m, F, 1); break;
    case 'blob': drawBlob(m, F, 1); break;
    case 'chameleon': drawChameleon(m, F, 1, false); break;
    case 'rchameleon': drawChameleon(m, F, 1, true); break;
    case 'mirror': drawMirror(m, F, 1); break;
    case 'firemummy': drawMummy(m, F, 1); drawFlames(m, 1); break;
    case 'fogwalker': drawFogwalker(m, F, 1); break;
    case 'witch': drawWitch(m, F, 1); break;
    case 'bulwark': drawBulwark(m, F, 1); break;
    case 'turtle': drawTurtle(m, F, 1); break;
    case 'boss': if (kind === 'poltergeist') drawPoltergeist(m, F, 1); else if (kind === 'vampirecount') drawVampireCount(m, F, 1); else if (kind === 'twintides') drawTwinTide(m, F, 1); else if (kind === 'hexwitch') drawHexwitch(m, F, 1); else drawBoss(m, F, 1); break;
  }
  cx = prev;
  return c;
}

export function drawWraith(m, F, t){   // a hooded shade; flickers as it is about to fade
  const near = m.vanish < 0.6 ? 0.5 + 0.5 * Math.sin(t * 30) : 1;
  cx.globalAlpha *= near * 0.9;
  cx.fillStyle = F('#b8c8d8');
  cx.beginPath(); cx.moveTo(-17, 18); cx.lineTo(-17, -8); cx.quadraticCurveTo(-17, -34, 0, -34); cx.quadraticCurveTo(17, -34, 17, -8); cx.lineTo(17, 18);
  for (let i = 0; i < 4; i++){ const x1 = 17 - (i + 0.5) * 8.5, x2 = 17 - (i + 1) * 8.5; cx.quadraticCurveTo(x1, 26 + Math.sin(t * 5 + i) * 4, x2, 18); }
  cx.closePath(); cx.fill();
  cx.fillStyle = '#0d1420'; cx.beginPath(); cx.moveTo(-11, -12); cx.quadraticCurveTo(0, -28, 11, -12); cx.quadraticCurveTo(0, -6, -11, -12); cx.fill();
  cx.fillStyle = m.flash > 0 ? '#fff' : '#9fe8ff'; ell(cx, -4, -15, 2.4, 3); ell(cx, 4, -15, 2.4, 3);
}
export function drawRider(m, F, t){   // a small imp-like rider; while carried, a wisp glows under it and it bobs
  if (m.carrier){
    const glow = cx.createRadialGradient(0, 4, 2, 0, 4, 26); glow.addColorStop(0, 'rgba(207,232,242,.85)'); glow.addColorStop(1, 'rgba(207,232,242,0)');
    cx.fillStyle = glow; cx.fillRect(-30, -24, 60, 56);
    cx.fillStyle = F('#cfe8f2'); ell(cx, 0, 6, 14, 9); ell(cx, -10, 2, 6, 7); ell(cx, 10, 2, 6, 7);
    cx.translate(0, -12 + Math.sin(t * 8) * 2);
  }
  cx.fillStyle = F('#c9584a'); ell(cx, 0, -4, 11, 12);
  cx.fillStyle = F('#7a2a20'); tri(cx, -7, -14, 5); tri(cx, 7, -14, 5);
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ffe27a'; ell(cx, -4, -6, 2.5, 3); ell(cx, 4, -6, 2.5, 3);
  cx.strokeStyle = F('#c9584a'); cx.lineWidth = 4; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(-9, 2); cx.lineTo(-16, 10); cx.moveTo(9, 2); cx.lineTo(16, 10); cx.stroke();
}
export function drawDoctor(m, F, t){   // plague doctor: wide hat, beaked mask, green satchel
  cx.fillStyle = F('#2a2a22');
  cx.beginPath(); cx.moveTo(-16, 22); cx.lineTo(-14, -8); cx.quadraticCurveTo(0, -18, 14, -8); cx.lineTo(16, 22); cx.closePath(); cx.fill();
  cx.fillStyle = F('#6a8a3a'); rrect(cx, 6, 2, 12, 10, 3); cx.fill();
  cx.fillStyle = F('#3b3b30'); ell(cx, 0, -14, 12, 11);
  cx.fillStyle = F('#d8cfa8'); cx.beginPath(); cx.moveTo(-4, -12); cx.lineTo(0, 2); cx.lineTo(6, -12); cx.closePath(); cx.fill();   // beak
  cx.fillStyle = m.flash > 0 ? '#fff' : '#c9f0a0'; ell(cx, -5, -16, 2.6, 2.6); ell(cx, 5, -16, 2.6, 2.6);
  cx.fillStyle = F('#1c1c16'); ell(cx, 0, -25, 20, 4); rrect(cx, -10, -40, 20, 16, 3); cx.fill();   // hat
}
export function drawPoltergeist(m, F, t){   // translucent ghost with trailing tatters and two grabbing hands
  const aura = cx.createRadialGradient(0, -10, 6, 0, -10, 80); aura.addColorStop(0, 'rgba(200,220,255,.35)'); aura.addColorStop(1, 'rgba(200,220,255,0)');
  cx.fillStyle = aura; cx.fillRect(-80, -90, 160, 170);
  cx.globalAlpha *= 0.85;
  cx.fillStyle = F('#dfe9f5');
  cx.beginPath(); cx.moveTo(-32, 30); cx.lineTo(-30, -14); cx.quadraticCurveTo(-30, -56, 0, -56); cx.quadraticCurveTo(30, -56, 30, -14); cx.lineTo(32, 30);
  for (let i = 0; i < 6; i++){ const x1 = 32 - (i + 0.5) * (64 / 6), x2 = 32 - (i + 1) * (64 / 6); cx.quadraticCurveTo(x1, 46 + Math.sin(t * 4 + i) * 6, x2, 30); }
  cx.closePath(); cx.fill();
  cx.fillStyle = '#1c2a3a'; ell(cx, -11, -26, 6, 9); ell(cx, 11, -26, 6, 9);
  cx.fillStyle = m.flash > 0 ? '#fff' : '#7ff9ff'; ell(cx, -11, -27, 3, 4.5); ell(cx, 11, -27, 3, 4.5);
  cx.fillStyle = '#1c2a3a'; cx.beginPath(); cx.ellipse(0, -6, 9, 12 + Math.sin(t * 3) * 3, 0, 0, TAU); cx.fill();   // wailing mouth
  cx.strokeStyle = F('#dfe9f5'); cx.lineWidth = 7; cx.lineCap = 'round';
  const sw = Math.sin(t * 2.2) * 10;
  cx.beginPath(); cx.moveTo(-28, -4); cx.lineTo(-52, 6 + sw); cx.stroke(); cx.beginPath(); cx.moveTo(28, -4); cx.lineTo(52, 6 - sw); cx.stroke();
  cx.fillStyle = F('#dfe9f5'); ell(cx, -54, 8 + sw, 7, 6); ell(cx, 54, 8 - sw, 7, 6);
}

export function drawKnight(m, F, t){   // armoured walker; the shield swings up in front while marching
  cx.fillStyle = F('#6f7380'); ell(cx, 0, 4, 13, 16);                                // body
  cx.fillStyle = F('#8c90a0'); ell(cx, 0, -16, 11, 11);                              // helm
  cx.fillStyle = '#1a1c24'; cx.fillRect(-8, -18, 16, 4);                             // visor slit
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ffd35a'; ell(cx, -4, -16, 1.6, 1.6); ell(cx, 4, -16, 1.6, 1.6);
  cx.fillStyle = F('#c9584a'); cx.beginPath(); cx.moveTo(-3, -27); cx.lineTo(3, -27); cx.lineTo(0, -34); cx.closePath(); cx.fill();   // plume
  if (m.shield){                                                                     // shield raised, covering the front
    cx.fillStyle = F('#b4b8c8'); rrect(cx, -16, -12, 32, 30, 8); cx.fill();
    cx.strokeStyle = F('#4a4e5c'); cx.lineWidth = 2; rrect(cx, -16, -12, 32, 30, 8); cx.stroke();
    cx.fillStyle = F('#c9584a'); ell(cx, 0, 3, 5, 5);
  } else {                                                                           // shield lowered to the side
    cx.fillStyle = F('#b4b8c8'); rrect(cx, 10, 0, 12, 22, 5); cx.fill();
    cx.strokeStyle = F('#4a4e5c'); cx.lineWidth = 2; rrect(cx, 10, 0, 12, 22, 5); cx.stroke();
  }
}
export function drawHauler(m, F, t){   // hunched figure with a rope over its shoulder, leaning forward
  const lean = m.freed ? 0 : 6;
  cx.fillStyle = F('#7a6a5a'); ell(cx, lean, 6, 14, 15);
  cx.fillStyle = F('#8a7a6a'); ell(cx, lean + 2, -12, 10, 10);
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ffe27a'; ell(cx, lean - 2, -13, 2.5, 3); ell(cx, lean + 6, -13, 2.5, 3);
  cx.strokeStyle = F('#c8b090'); cx.lineWidth = 3; cx.lineCap = 'round';
  if (!m.freed){ cx.beginPath(); cx.moveTo(lean + 8, -4); cx.lineTo(lean + 26, -18); cx.stroke(); }          // tow rope
  cx.strokeStyle = F('#7a6a5a'); cx.lineWidth = 5;
  cx.beginPath(); cx.moveTo(lean - 10, 4); cx.lineTo(lean - 18, 14); cx.moveTo(lean + 10, 4); cx.lineTo(lean + 18, 14); cx.stroke();
}
export function drawGargoyle(m, F, t){   // crouched stone beast with folded wings
  cx.fillStyle = F('#7a7c86'); ell(cx, 0, 8, 18, 12);
  cx.fillStyle = F('#8a8d96'); ell(cx, 0, -8, 12, 11);
  cx.fillStyle = F('#5f616a'); tri(cx, -8, -18, 5); tri(cx, 8, -18, 5);                     // horns
  cx.beginPath(); cx.moveTo(-16, 0); cx.lineTo(-30, -14); cx.lineTo(-26, 6); cx.closePath(); cx.fill();   // wings
  cx.beginPath(); cx.moveTo(16, 0); cx.lineTo(30, -14); cx.lineTo(26, 6); cx.closePath(); cx.fill();
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ff9a3a'; ell(cx, -4, -9, 2.2, 2.2); ell(cx, 4, -9, 2.2, 2.2);
  cx.strokeStyle = 'rgba(20,20,26,.5)'; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(-6, 4); cx.lineTo(2, 14); cx.stroke();   // crack
}
export function drawArcher(m, F, t){   // skeleton with a bow
  cx.fillStyle = F('#d8d0c0'); ell(cx, 0, 4, 10, 14); ell(cx, 0, -14, 9, 10);
  cx.fillStyle = '#1a1414'; ell(cx, -3.5, -15, 2.4, 3); ell(cx, 3.5, -15, 2.4, 3);
  cx.strokeStyle = F('#b8b0a0'); cx.lineWidth = 2; for (let i = 0; i < 3; i++){ cx.beginPath(); cx.moveTo(-8, -2 + i * 6); cx.lineTo(8, -2 + i * 6); cx.stroke(); }   // ribs
  cx.strokeStyle = F('#6b4a2b'); cx.lineWidth = 3; cx.beginPath(); cx.arc(12, 0, 16, -Math.PI * 0.55, Math.PI * 0.55); cx.stroke();   // bow
  cx.strokeStyle = '#e8e0d0'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(12, -15); cx.lineTo(12, 15); cx.stroke();
  cx.strokeStyle = F('#d8d0c0'); cx.lineWidth = 4; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(-8, 0); cx.lineTo(-14, 12); cx.moveTo(8, 0); cx.lineTo(12, 0); cx.stroke();
}
export function drawVampire(m, F, t){   // caped figure, pale face, red eyes
  cx.fillStyle = F('#2a0f1a'); cx.beginPath(); cx.moveTo(-20, 22); cx.lineTo(-14, -8); cx.quadraticCurveTo(0, -14, 14, -8); cx.lineTo(20, 22); cx.closePath(); cx.fill();   // cape
  cx.fillStyle = F('#5a1a2a'); ell(cx, 0, 6, 10, 14);
  cx.fillStyle = F('#e8dcd8'); ell(cx, 0, -14, 9, 10);
  cx.fillStyle = F('#1a1014'); cx.beginPath(); cx.moveTo(-9, -20); cx.quadraticCurveTo(0, -30, 9, -20); cx.lineTo(9, -16); cx.quadraticCurveTo(0, -22, -9, -16); cx.fill();   // hair
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ff3a3a'; ell(cx, -3.5, -14, 2.2, 2.2); ell(cx, 3.5, -14, 2.2, 2.2);
  cx.fillStyle = '#fff'; tri(cx, -2.5, -8, 2); tri(cx, 2.5, -8, 2);   // fangs (inverted look via small triangles)
}
export function drawVampireCount(m, F, t){   // taller vampire with a high collar; glows red while healing
  if (m.healing){ const g = cx.createRadialGradient(0, -10, 6, 0, -10, 90); g.addColorStop(0, 'rgba(255,60,60,.45)'); g.addColorStop(1, 'rgba(255,60,60,0)'); cx.fillStyle = g; cx.fillRect(-90, -100, 180, 180); }
  else { const g = cx.createRadialGradient(0, -10, 6, 0, -10, 80); g.addColorStop(0, 'rgba(120,20,60,.3)'); g.addColorStop(1, 'rgba(120,20,60,0)'); cx.fillStyle = g; cx.fillRect(-80, -90, 160, 170); }
  cx.fillStyle = F('#1a0a12'); cx.beginPath(); cx.moveTo(-34, 40); cx.lineTo(-24, -20); cx.lineTo(-30, -48); cx.lineTo(-10, -30); cx.lineTo(0, -26); cx.lineTo(10, -30); cx.lineTo(30, -48); cx.lineTo(24, -20); cx.lineTo(34, 40); cx.closePath(); cx.fill();   // cape with collar
  cx.fillStyle = F('#5a1a2a'); ell(cx, 0, 10, 16, 26);
  cx.fillStyle = F('#c9584a'); rrect(cx, -6, -8, 12, 30, 3); cx.fill();   // waistcoat
  cx.fillStyle = F('#e8dcd8'); ell(cx, 0, -30, 12, 14);
  cx.fillStyle = F('#1a1014'); cx.beginPath(); cx.moveTo(-12, -38); cx.quadraticCurveTo(0, -52, 12, -38); cx.lineTo(12, -32); cx.quadraticCurveTo(0, -40, -12, -32); cx.fill();
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ff3a3a'; ell(cx, -5, -30, 3, 3); ell(cx, 5, -30, 3, 3);
  cx.fillStyle = '#fff'; tri(cx, -3, -22, 2.5); tri(cx, 3, -22, 2.5);
  if (m.stunT > 0){ cx.fillStyle = '#ffd35a'; for (let i = 0; i < 3; i++) ell(cx, -14 + i * 14, -54 + Math.sin(t * 8 + i) * 4, 3, 3); }
}

export function drawCrawler(m, F, t){   // dripping, weed-hung crawler on all fours
  cx.fillStyle = F('#3a7a8a'); ell(cx, 0, 6, 18, 11); ell(cx, 0, -8, 12, 11);
  cx.fillStyle = F('#2a5a4a'); for (let i = -2; i <= 2; i++){ cx.beginPath(); cx.moveTo(i * 6, -16); cx.lineTo(i * 6 + 2, -2 + Math.sin(t * 3 + i) * 2); cx.lineTo(i * 6 - 3, -4); cx.closePath(); cx.fill(); }   // weeds
  cx.fillStyle = m.flash > 0 ? '#fff' : '#bfefff'; ell(cx, -5, -9, 2.6, 2.6); ell(cx, 5, -9, 2.6, 2.6);
  cx.strokeStyle = F('#3a7a8a'); cx.lineWidth = 5; cx.lineCap = 'round';
  const w = Math.sin(m.ph * 6) * 4;
  cx.beginPath(); cx.moveTo(-12, 8); cx.lineTo(-22, 16 + w); cx.moveTo(12, 8); cx.lineTo(22, 16 - w); cx.stroke();
  cx.fillStyle = 'rgba(127,208,232,.7)'; ell(cx, 8, 18 + ((t * 20) % 8), 2, 3);   // drip
}
export function drawSailor(m, F, t){   // bottle in hand, striped shirt, listing to one side
  const tilt = Math.sin(m.ph * 2) * 0.25;
  cx.rotate(tilt);
  cx.fillStyle = F('#6a5a4a'); ell(cx, 0, 8, 12, 15);
  cx.fillStyle = F('#e8e0d0'); for (let i = 0; i < 3; i++) cx.fillRect(-10, -2 + i * 7, 20, 3);   // stripes
  cx.fillStyle = F('#c9b8a0'); ell(cx, 0, -12, 10, 10);
  cx.fillStyle = F('#2a3a6a'); cx.fillRect(-11, -22, 22, 6);                                    // cap
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ff8a6a'; ell(cx, -4, -12, 2.2, 2.2); ell(cx, 4, -12, 2.2, 2.2);
  cx.fillStyle = F('#2a3a2a'); cx.fillRect(14, -10, 5, 14); cx.fillRect(15, -16, 3, 7);          // bottle
  cx.strokeStyle = F('#c9b8a0'); cx.lineWidth = 4; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(10, 0); cx.lineTo(16, -6); cx.moveTo(-10, 0); cx.lineTo(-16, 8); cx.stroke();
}
export function drawDiver(m, F, t){   // frog-like head and shoulders rising from the water
  cx.fillStyle = 'rgba(127,208,232,.5)'; ell(cx, 0, 12, 24, 7);
  cx.fillStyle = F('#2a6a7a'); ell(cx, 0, 4, 16, 12); ell(cx, 0, -10, 13, 11);
  cx.fillStyle = F('#3a8a9a'); ell(cx, -7, -18, 5, 5); ell(cx, 7, -18, 5, 5);
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ffe27a'; ell(cx, -7, -18, 2.5, 2.5); ell(cx, 7, -18, 2.5, 2.5);
  cx.strokeStyle = F('#2a6a7a'); cx.lineWidth = 5; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(12, 0); cx.lineTo(22, -12 + Math.sin(t * 8) * 3); cx.stroke();   // throwing arm
}
export function drawSlime(m, F, t){   // wobbling green blob with two eyes
  const wob = 1 + Math.sin(m.ph * 5) * 0.08;
  cx.fillStyle = F('#5ad08a'); cx.beginPath(); cx.ellipse(0, 4, 20 * wob, 16 / wob, 0, 0, TAU); cx.fill();
  cx.fillStyle = 'rgba(255,255,255,.35)'; ell(cx, -7, -4, 5, 3);
  cx.fillStyle = '#1a3a2a'; ell(cx, -6, 2, 3, 3.5); ell(cx, 6, 2, 3, 3.5);
  cx.fillStyle = m.flash > 0 ? '#fff' : '#eafff0'; ell(cx, -6.5, 1, 1.2, 1.2); ell(cx, 5.5, 1, 1.2, 1.2);
}
export function drawBlob(m, F, t){
  const wob = 1 + Math.sin(m.ph * 7) * 0.1;
  cx.fillStyle = F('#7fe0a0'); cx.beginPath(); cx.ellipse(0, 3, 12 * wob, 10 / wob, 0, 0, TAU); cx.fill();
  cx.fillStyle = '#1a3a2a'; ell(cx, -4, 1, 2, 2.4); ell(cx, 4, 1, 2, 2.4);
}
export function drawTwinTide(m, F, t){   // sea serpent rearing out of the water
  cx.fillStyle = 'rgba(127,208,232,.45)'; ell(cx, 0, 26, 40, 9);
  const g = cx.createRadialGradient(0, -10, 6, 0, -10, 70); g.addColorStop(0, 'rgba(60,160,180,.3)'); g.addColorStop(1, 'rgba(60,160,180,0)'); cx.fillStyle = g; cx.fillRect(-70, -80, 140, 130);
  cx.strokeStyle = F('#1f6f78'); cx.lineWidth = 16; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(-26, 24); cx.quadraticCurveTo(-30, -10 + Math.sin(t * 2) * 4, 0, -14); cx.quadraticCurveTo(26, -18, 20, -44); cx.stroke();   // neck
  cx.fillStyle = F('#2a8a90'); for (let i = 0; i < 4; i++) tri(cx, -22 + i * 12, -6 - i * 8, 5);   // fins along the neck
  cx.fillStyle = F('#1f6f78'); ell(cx, 22, -48, 16, 12);                                          // head
  cx.fillStyle = F('#2a8a90'); tri(cx, 14, -60, 6); tri(cx, 30, -60, 6);
  cx.fillStyle = m.flash > 0 ? '#fff' : '#bfefff'; ell(cx, 18, -50, 3.2, 3.2); ell(cx, 28, -50, 3.2, 3.2);
  cx.fillStyle = '#0b2a30'; cx.beginPath(); cx.ellipse(26, -42, 8, 3 + Math.sin(t * 3) * 2, 0, 0, TAU); cx.fill();   // jaws
}

export function drawChameleon(m, F, t, reverse){   // lizard in the colour it is locked to; reverse ones are inverted with hollow eyes
  const colIdx = reverse ? m.colourImmune : m.colourLock;
  const P = PTYPES[colIdx == null ? 0 : colIdx];
  const body = reverse ? P.dark : P.base, spots = reverse ? P.light : P.dark;
  cx.fillStyle = F(body); ell(cx, 0, 6, 20, 11); ell(cx, 14, -6, 11, 9);                        // body, head
  cx.strokeStyle = F(body); cx.lineWidth = 5; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(-18, 6); cx.quadraticCurveTo(-30, 2, -28, -10 + Math.sin(t * 3) * 3); cx.stroke();   // curled tail
  cx.fillStyle = F(spots); for (let i = 0; i < 4; i++) ell(cx, -12 + i * 8, 4 + (i % 2) * 5, 3, 3);
  if (reverse){ cx.strokeStyle = '#ff3a3a'; cx.lineWidth = 2.2; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(13, -13); cx.lineTo(21, -5); cx.moveTo(21, -13); cx.lineTo(13, -5); cx.stroke(); }   // X eye
  else { cx.fillStyle = m.flash > 0 ? '#fff' : P.light; ell(cx, 17, -9, 3.5, 4); cx.fillStyle = '#10200a'; ell(cx, 18, -9, 1.5, 2); }
  cx.strokeStyle = F(body); cx.lineWidth = 4; cx.beginPath(); cx.moveTo(-8, 12); cx.lineTo(-14, 20); cx.moveTo(8, 12); cx.lineTo(14, 20); cx.stroke();
}
export function drawMirror(m, F, t){   // small winged sprite holding a hand mirror
  cx.fillStyle = F('#c8d8f0'); ell(cx, 0, 2, 9, 12); ell(cx, 0, -12, 8, 8);
  cx.fillStyle = 'rgba(200,216,240,.5)'; ell(cx, -14, -4 + Math.sin(t * 12) * 2, 8, 4, -0.4); ell(cx, 14, -4 - Math.sin(t * 12) * 2, 8, 4, 0.4);
  cx.fillStyle = m.flash > 0 ? '#fff' : '#5a7aff'; ell(cx, -3, -13, 2, 2.4); ell(cx, 3, -13, 2, 2.4);
  const my = m.reflecting ? 14 : -4, mx = m.reflecting ? 0 : 16;
  cx.strokeStyle = F('#8a7a5a'); cx.lineWidth = 3; cx.beginPath(); cx.moveTo(8, 4); cx.lineTo(mx, my + 10); cx.stroke();
  cx.fillStyle = F('#8a7a5a'); ell(cx, mx, my, 11, 11);
  const g = cx.createLinearGradient(mx - 8, my - 8, mx + 8, my + 8); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#bfe6ff'); g.addColorStop(1, '#8ac0ff');
  cx.fillStyle = m.reflecting ? g : '#6a7a8a'; ell(cx, mx, my, 8, 8);
  if (m.reflecting){ cx.fillStyle = 'rgba(255,255,255,.9)'; ell(cx, mx - 3, my - 3, 2, 3, -0.7); }
}
export function drawHexwitch(m, F, t){   // witch astride a broom, hat and cauldron-green glow
  const g = cx.createRadialGradient(0, -10, 6, 0, -10, 80); g.addColorStop(0, 'rgba(160,80,220,.3)'); g.addColorStop(1, 'rgba(160,80,220,0)'); cx.fillStyle = g; cx.fillRect(-80, -90, 160, 170);
  cx.strokeStyle = F('#6b4a2b'); cx.lineWidth = 6; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(-44, 26); cx.lineTo(30, 12); cx.stroke();
  cx.fillStyle = F('#c8b060'); cx.beginPath(); cx.moveTo(-40, 20); cx.lineTo(-62, 12 + Math.sin(t * 6) * 3); cx.lineTo(-64, 34); cx.lineTo(-42, 32); cx.closePath(); cx.fill();   // broom straw
  cx.fillStyle = F('#2a1a3a'); cx.beginPath(); cx.moveTo(-18, 20); cx.lineTo(-10, -24); cx.lineTo(14, -24); cx.lineTo(22, 20); cx.closePath(); cx.fill();   // robe
  cx.fillStyle = F('#8fbf5a'); ell(cx, 2, -32, 11, 12);                                                                                       // green face
  cx.fillStyle = F('#4a2a5a'); ell(cx, -2, -30, 2.5, 1.5);                                                                                     // wart
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ffe27a'; ell(cx, -3, -34, 2.6, 3); ell(cx, 7, -34, 2.6, 3);
  cx.fillStyle = F('#1a1020'); ell(cx, 2, -44, 22, 5); cx.beginPath(); cx.moveTo(-10, -44); cx.lineTo(4, -78 + Math.sin(t * 2) * 2); cx.lineTo(16, -44); cx.closePath(); cx.fill();   // hat
  cx.fillStyle = F('#c9584a'); cx.fillRect(-9, -50, 24, 4);
  cx.strokeStyle = F('#8fbf5a'); cx.lineWidth = 4; cx.beginPath(); cx.moveTo(14, -12); cx.lineTo(30, -22 + Math.sin(t * 4) * 4); cx.stroke();   // pointing hand
  cx.fillStyle = 'rgba(210,155,255,.9)'; ell(cx, 32, -24 + Math.sin(t * 4) * 4, 4, 4);
}

export function drawFlames(m, t){   // flames licking up a flaming mummy
  for (let i = -1; i <= 1; i++){ const h = 10 + Math.sin(t * 9 + i * 2) * 4; cx.fillStyle = i ? '#ff8a3a' : '#ffd35a'; tri(cx, i * 9, -m.r * 0.9 - h * 0.5, h * 0.55); }
}
export function drawFogwalker(m, F, t){   // hooded figure holding up a lantern of mist
  cx.fillStyle = F('#7a8a9a'); cx.beginPath(); cx.moveTo(-14, 20); cx.lineTo(-12, -8); cx.quadraticCurveTo(0, -30, 12, -8); cx.lineTo(14, 20); cx.closePath(); cx.fill();
  cx.fillStyle = '#1a2230'; cx.beginPath(); cx.moveTo(-8, -10); cx.quadraticCurveTo(0, -22, 8, -10); cx.quadraticCurveTo(0, -6, -8, -10); cx.fill();
  cx.fillStyle = m.flash > 0 ? '#fff' : '#bfefff'; ell(cx, -3, -12, 2, 2.4); ell(cx, 3, -12, 2, 2.4);
  cx.strokeStyle = F('#4a3020'); cx.lineWidth = 3; cx.beginPath(); cx.moveTo(10, 0); cx.lineTo(20, -18); cx.stroke();
  const g = cx.createRadialGradient(22, -22, 2, 22, -22, 16); g.addColorStop(0, 'rgba(220,235,245,.9)'); g.addColorStop(1, 'rgba(220,235,245,0)'); cx.fillStyle = g; cx.fillRect(4, -40, 36, 36);
}
export function drawWitch(m, F, t){   // small witch on foot with a crooked wand
  cx.fillStyle = F('#2a1a3a'); cx.beginPath(); cx.moveTo(-13, 20); cx.lineTo(-8, -10); cx.lineTo(8, -10); cx.lineTo(13, 20); cx.closePath(); cx.fill();
  cx.fillStyle = F('#8fbf5a'); ell(cx, 0, -16, 9, 9);
  cx.fillStyle = m.flash > 0 ? '#fff' : '#ffe27a'; ell(cx, -3, -17, 2, 2.4); ell(cx, 3, -17, 2, 2.4);
  cx.fillStyle = F('#1a1020'); ell(cx, 0, -24, 15, 3.5); cx.beginPath(); cx.moveTo(-7, -24); cx.lineTo(2, -46); cx.lineTo(9, -24); cx.closePath(); cx.fill();
  cx.strokeStyle = F('#6b4a2b'); cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(10, -4); cx.lineTo(22, -14); cx.stroke();
  cx.fillStyle = 'rgba(210,155,255,.9)'; ell(cx, 23, -15 + Math.sin(t * 5) * 2, 3, 3);
}
export function drawBulwark(m, F, t){   // heavy armoured knight with a tower shield and a banner
  cx.fillStyle = F('#6f7380'); ell(cx, 0, 6, 17, 20);
  cx.fillStyle = F('#8c90a0'); ell(cx, 0, -18, 13, 13);
  cx.fillStyle = '#1a1c24'; cx.fillRect(-10, -20, 20, 5);
  cx.fillStyle = m.flash > 0 ? '#fff' : '#bcd0ff'; ell(cx, -5, -18, 1.8, 1.8); ell(cx, 5, -18, 1.8, 1.8);
  cx.fillStyle = F('#b4b8c8'); rrect(cx, -22, -10, 18, 36, 6); cx.fill(); cx.strokeStyle = F('#4a4e5c'); cx.lineWidth = 2; rrect(cx, -22, -10, 18, 36, 6); cx.stroke();
  cx.strokeStyle = F('#6b4a2b'); cx.lineWidth = 3; cx.beginPath(); cx.moveTo(18, 10); cx.lineTo(18, -44); cx.stroke();
  cx.fillStyle = F('#3a4a8a'); cx.beginPath(); cx.moveTo(18, -44); cx.lineTo(34 + Math.sin(t * 3) * 3, -38); cx.lineTo(18, -28); cx.closePath(); cx.fill();
}
export function drawTurtle(m, F, t){   // walking backwards: a big plated shell faces the player, the head peeks out at the top
  cx.fillStyle = F('#3a6a4a'); ell(cx, 0, -20, 7, 6);                                                     // head (away from the player)
  cx.fillStyle = F('#4a7a5a'); ell(cx, 0, 2, 24, 20);                                                     // shell
  cx.strokeStyle = F('#2a4a34'); cx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++){ cx.beginPath(); cx.arc(i * 12, 2 + j * 10, 6, 0, TAU); cx.stroke(); }   // plates
  cx.fillStyle = F('#3a6a4a'); ell(cx, -22, 12, 6, 4); ell(cx, 22, 12, 6, 4); ell(cx, -20, -10, 6, 4); ell(cx, 20, -10, 6, 4);   // legs
}
