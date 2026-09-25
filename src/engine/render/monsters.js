import { mS, mY } from '../monsters.js';
import { ctx } from './canvas.js';
import { ell, mix, rrect, tri } from './util.js';
import { clamp } from '../util.js';

export function drawMonster(m, t){
  let y = mY(m); const s = mS(m);
  if (m.eating && m.frozenT <= 0) y += Math.sin(m.ph * 14) * 2.5;
  const fade = m.demo ? 1 : Math.min(1, m.age / 0.5);
  const blue = m.slowT > 0 || m.frozenT > 0;
  ctx.save();
  ctx.translate(m.x, y); ctx.scale(s, s);
  ctx.globalAlpha = fade;
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  if (m.type === 'bat') ell(ctx, 0, m.r + 18, m.r * 0.6, 4);
  else ell(ctx, 0, m.r * 0.95, m.r * (m.type === 'imp' ? 0.9 - m.hop * 0.25 : 1), m.r * 0.22);
  const F = c => m.flash > 0 ? '#ffffff' : blue ? mix(c, '#7fd0ff', 0.6) : c;
  const k = m.type === 'boss' ? 1 : 0.95;
  ctx.scale(k, k);
  switch (m.type){
    case 'ghoul': drawGhoul(m, F); break;
    case 'bat': drawBat(m, F); break;
    case 'imp': drawImp(m, F); break;
    case 'brute': drawBrute(m, F); break;
    case 'wraith': drawWraith(m, F, t); break;
    case 'boss': drawBoss(m, F, t); break;
  }
  if (m.frozenT > 0){
    ctx.globalAlpha = fade * 0.5; ctx.fillStyle = '#d8f4ff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    rrect(ctx, -m.r * 1.15, -m.r * 1.45, m.r * 2.3, m.r * 2.6, 10); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = fade * 0.8; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.moveTo(-m.r * 0.8, -m.r); ctx.lineTo(-m.r * 0.3, -m.r * 1.3); ctx.stroke();
  }
  ctx.restore();
  if (m.demo) return;
  const lift = m.type === 'imp' ? m.hop * 14 * s : 0;
  const by = y - m.r * s * 1.45 - 10 - lift - (m.type === 'boss' ? 30 : 0);
  ctx.globalAlpha = fade;
  if (m.maxHp > 8){
    const bw = Math.max(40, m.r * 1.7) * s, bx = m.x - bw / 2;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(ctx, bx - 1, by - 1, bw + 2, 8, 3.5); ctx.fill();
    ctx.fillStyle = '#c77dff'; rrect(ctx, bx, by, Math.max(0, bw * m.hp / m.maxHp), 6, 3); ctx.fill();
  } else if (m.maxHp >= 2 || m.hp < m.maxHp){
    const n = Math.ceil(m.maxHp), d = 8, gap = 3, tw = n * d + (n - 1) * gap;
    for (let i = 0; i < n; i++){
      const px = m.x - tw / 2 + i * (d + gap) + d / 2, fill = clamp(m.hp - i, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ell(ctx, px, by, d / 2 + 1.5, d / 2 + 1.5);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ell(ctx, px, by, d / 2, d / 2);
      if (fill > 0){ ctx.save(); ctx.beginPath(); ctx.rect(px - d / 2, by - d / 2, d * fill, d); ctx.clip(); ctx.fillStyle = '#ff5a4d'; ell(ctx, px, by, d / 2, d / 2); ctx.restore(); }
    }
  }
  ctx.globalAlpha = 1;
}

export function drawGhoul(m, F){
  const sw = m.eating ? 0 : Math.sin(m.ph * 6);
  ctx.fillStyle = F('#3a2f4b'); ell(ctx, -8, 20 + sw * 2, 6, 7); ell(ctx, 8, 20 - sw * 2, 6, 7);
  ctx.fillStyle = F('#5b4a73');
  ctx.beginPath(); ctx.moveTo(-17, -6); ctx.quadraticCurveTo(-21, 12, -15, 22);
  ctx.lineTo(-9, 17); ctx.lineTo(-4, 23); ctx.lineTo(2, 17); ctx.lineTo(8, 23); ctx.lineTo(15, 21);
  ctx.quadraticCurveTo(21, 12, 17, -6); ctx.quadraticCurveTo(0, -15, -17, -6); ctx.fill();
  ctx.strokeStyle = F('#8fae78'); ctx.lineWidth = 6; ctx.lineCap = 'round';
  const reach = m.eating ? Math.sin(m.ph * 14) * 3 : 0;
  ctx.beginPath(); ctx.moveTo(-14, -3); ctx.lineTo(-21 + reach, 9 + sw * 4 + (m.eating ? 6 : 0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -3); ctx.lineTo(21 - reach, 9 - sw * 4 + (m.eating ? 6 : 0)); ctx.stroke();
  ctx.fillStyle = F('#8fae78'); ell(ctx, -21 + reach, 10 + sw * 4 + (m.eating ? 6 : 0), 4.5, 4.5); ell(ctx, 21 - reach, 10 - sw * 4 + (m.eating ? 6 : 0), 4.5, 4.5);
  ell(ctx, 0, -16, 13, 14);
  ctx.fillStyle = F('#6f8a5c'); ell(ctx, -4, -27, 6, 3, -0.3);
  ctx.fillStyle = m.flash > 0 ? '#fff' : '#ffe066'; ell(ctx, -5, -17, 3.4, 4.2); ell(ctx, 5, -17, 3.4, 4.2);
  ctx.fillStyle = '#1a1020'; ell(ctx, -5, -16, 1.4, 2); ell(ctx, 5, -16, 1.4, 2);
  ctx.strokeStyle = '#2a1a2a'; ctx.lineWidth = 1.8;
  const jaw = m.eating ? Math.abs(Math.sin(m.ph * 14)) * 3 : 0;
  ctx.beginPath(); ctx.moveTo(-6, -8 + jaw); ctx.lineTo(-3, -6 + jaw); ctx.lineTo(0, -8 + jaw); ctx.lineTo(3, -6 + jaw); ctx.lineTo(6, -8 + jaw); ctx.stroke();
}

export function wing(f, F){
  ctx.fillStyle = F('#3a2450');
  ctx.beginPath(); ctx.moveTo(-6, -4);
  ctx.quadraticCurveTo(-20, -18 - f * 8, -33, -6 - f * 12);
  ctx.quadraticCurveTo(-28, 0 - f * 4, -24, 5 - f * 3);
  ctx.quadraticCurveTo(-20, -1, -15, 8 - f * 1);
  ctx.quadraticCurveTo(-11, 2, -6, 8); ctx.closePath(); ctx.fill();
}

export function drawBat(m, F){
  const f = m.frozenT > 0 ? 0.3 : Math.sin(m.ph * 16);
  ctx.translate(0, Math.sin(m.ph * 5) * 3);
  wing(f, F); ctx.save(); ctx.scale(-1, 1); wing(f, F); ctx.restore();
  ctx.fillStyle = F('#4c2d66'); ell(ctx, 0, 0, 10, 12);
  ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-7, -17); ctx.lineTo(-2, -9); ctx.moveTo(8, -6); ctx.lineTo(7, -17); ctx.lineTo(2, -9); ctx.fill();
  ctx.fillStyle = m.flash > 0 ? '#fff' : '#ff4d6d'; ell(ctx, -4, -3, 2.6, 2.6); ell(ctx, 4, -3, 2.6, 2.6);
  ctx.fillStyle = '#fff'; tri(ctx, -2.5, 5, 2); tri(ctx, 2.5, 5, 2);
}

export function drawImp(m, F){
  ctx.translate(0, -m.hop * 14);
  ctx.strokeStyle = F('#a52a22'); ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(8, 10); ctx.quadraticCurveTo(24, 12, 20, -4); ctx.stroke();
  ctx.fillStyle = F('#a52a22'); tri(ctx, 20, -7, 4);
  ctx.fillStyle = F('#e0503a'); ell(ctx, 0, 5, 13, 13);
  ctx.fillStyle = F('#f39a6b'); ell(ctx, 0, 9, 7.5, 7);
  ctx.fillStyle = F('#e0503a'); ell(ctx, 0, -12, 12.5, 11);
  ctx.fillStyle = F('#f3e1c4');
  ctx.beginPath(); ctx.moveTo(-9, -18); ctx.quadraticCurveTo(-15, -26, -12, -32); ctx.lineTo(-5, -21); ctx.fill();
  ctx.beginPath(); ctx.moveTo(9, -18); ctx.quadraticCurveTo(15, -26, 12, -32); ctx.lineTo(5, -21); ctx.fill();
  ctx.fillStyle = m.flash > 0 ? '#fff' : '#fff6a0'; ell(ctx, -4.5, -13, 3.2, 3.6); ell(ctx, 4.5, -13, 3.2, 3.6);
  ctx.fillStyle = '#1a0a08'; ell(ctx, -4.5, -13, 1, 2.6); ell(ctx, 4.5, -13, 1, 2.6);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -8, 5, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.fillStyle = F('#c53e2e'); ell(ctx, -8, 18, 4, 3); ell(ctx, 8, 18, 4, 3);
}

export function drawBrute(m, F){
  const sw = m.eating ? Math.sin(m.ph * 12) * 2 : Math.sin(m.ph * 3.2);
  ctx.fillStyle = F('#3d4a2c'); ell(ctx, -28, 6 + sw * 3, 9, 13, 0.3); ell(ctx, 28, 6 - sw * 3, 9, 13, -0.3);
  ctx.fillStyle = F('#4d5b3a');
  ctx.beginPath(); ctx.moveTo(-30, 26); ctx.quadraticCurveTo(-34, -28, 0, -30); ctx.quadraticCurveTo(34, -28, 30, 26); ctx.quadraticCurveTo(0, 32, -30, 26); ctx.fill();
  ctx.fillStyle = F('#6f8a45'); ell(ctx, -12, -18, 10, 6, -0.3); ell(ctx, 14, -12, 8, 5, 0.4); ell(ctx, 18, 12, 7, 5); ell(ctx, -18, 14, 6, 4);
  ctx.fillStyle = F('#7d766a'); ell(ctx, 2, -26, 7, 5); ell(ctx, -20, -4, 5, 4); ell(ctx, 22, -4, 4, 3.5);
  ctx.fillStyle = m.flash > 0 ? '#fff' : '#ff6a3d'; ell(ctx, -9, -6, 3.5, 3); ell(ctx, 9, -6, 3.5, 3);
  const jaw = m.eating ? Math.abs(Math.sin(m.ph * 12)) * 4 : 0;
  ctx.fillStyle = '#1b140e'; rrect(ctx, -14, 4, 28, 11 + jaw, 5); ctx.fill();
  ctx.fillStyle = '#efe4d0'; tri(ctx, -9, 3, 5); tri(ctx, 9, 3, 5);
}

export function drawWraith(m, F, t){
  ctx.fillStyle = F('#cfe8f2');
  ctx.beginPath(); ctx.moveTo(-18, 16); ctx.lineTo(-18, -6);
  ctx.quadraticCurveTo(-18, -30, 0, -30); ctx.quadraticCurveTo(18, -30, 18, -6); ctx.lineTo(18, 16);
  for (let i = 0; i < 4; i++){ const x1 = 18 - (i + 0.5) * 9, x2 = 18 - (i + 1) * 9; ctx.quadraticCurveTo(x1, 24 + Math.sin(t * 6 + i) * 4, x2, 16); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = F('#1c2a3a'); ell(ctx, 0, -12, 11, 12);
  ctx.fillStyle = m.flash > 0 ? '#fff' : '#7ff9ff'; ell(ctx, -4.5, -13, 2.6, 3.6); ell(ctx, 4.5, -13, 2.6, 3.6);
  ctx.strokeStyle = F('#a9cbd9'); ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-16, 0); ctx.quadraticCurveTo(-26, 6, -22, 14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, 0); ctx.quadraticCurveTo(26, 6, 22, 14); ctx.stroke();
}

export function drawBoss(m, F, t){
  const aura = ctx.createRadialGradient(0, -10, 10, 0, -10, 90);
  aura.addColorStop(0, 'rgba(160,80,220,.35)'); aura.addColorStop(1, 'rgba(160,80,220,0)');
  ctx.fillStyle = aura; ctx.fillRect(-90, -100, 180, 180);
  ctx.strokeStyle = F('#4a3020'); ctx.lineWidth = 7; ctx.lineCap = 'round';
  const sw = Math.sin(m.ph * (m.eating ? 6 : 1.5)) * 6;
  ctx.beginPath(); ctx.moveTo(-40, -6); ctx.lineTo(-66, 10 + sw); ctx.lineTo(-78, 0 + sw); ctx.moveTo(-66, 10 + sw); ctx.lineTo(-72, 26 + sw); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40, -6); ctx.lineTo(66, 10 - sw); ctx.lineTo(78, 0 - sw); ctx.moveTo(66, 10 - sw); ctx.lineTo(72, 26 - sw); ctx.stroke();
  ctx.fillStyle = F('#2b1a2e');
  ctx.beginPath(); ctx.moveTo(-44, 40); ctx.lineTo(-44, -12);
  ctx.quadraticCurveTo(-44, -58, 0, -58); ctx.quadraticCurveTo(44, -58, 44, -12); ctx.lineTo(44, 40);
  for (let i = 0; i < 6; i++){ const x1 = 44 - (i + 0.5) * (88 / 6), x2 = 44 - (i + 1) * (88 / 6); ctx.quadraticCurveTo(x1, 52 + Math.sin(t * 4 + i) * 5, x2, 40); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = F('#5a3a2a');
  for (let i = -2; i <= 2; i++){ ctx.beginPath(); ctx.moveTo(i * 15 - 7, -52); ctx.lineTo(i * 15 + (i % 2 ? 3 : -2), -80 + Math.abs(i) * 7); ctx.lineTo(i * 15 + 7, -52); ctx.fill(); }
  const glow = m.flash > 0 ? '#fff' : '#b6ff5a';
  ctx.fillStyle = glow; ell(ctx, -15, -24, 8, 10); ell(ctx, 15, -24, 8, 10);
  ctx.fillStyle = '#10200a'; ell(ctx, -15, -22, 3, 5); ell(ctx, 15, -22, 3, 5);
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-12, 8); ctx.lineTo(-6, 2); ctx.lineTo(0, 10); ctx.lineTo(6, 2); ctx.lineTo(12, 8); ctx.lineTo(20, 0); ctx.quadraticCurveTo(0, 22, -20, 0); ctx.fill();
}
