import { GEAR } from '../../data/shop.js';
import { PTYPES, RAINBOW } from '../../data/pumpkins.js';
import { emptyCells, findCell, groupCells, heldGid } from '../board.js';
import { dropHop } from '../combat.js';
import { mS, mY } from '../monsters.js';
import { K, coinTarget, ctx } from './canvas.js';
import { drawMonster } from './monsters.js';
import { bg, fogSprite, sprites } from './sprites.js';
import { ell, mix, rrect, shade } from './util.js';
import { COLS, CS, FENCE_Y, FIELD_BOT, FIELD_TOP, G, GX, GY, H, HOLD_TIME, LANE, ROWS, W, gest, graves, grid, state, walls } from '../state.js';
import { TAU, clamp, mulberry } from '../util.js';
import { save } from '../../save.js';

// ---------- Render ----------

export const starsR = mulberry(42), STARS = Array.from({ length:46 }, () => ({ x:starsR() * W, y:starsR(), s:starsR() * 1.6 + 0.6, p:starsR() * TAU }));

export function render(){
  const g = G, t = g.t;
  ctx.setTransform(K, 0, 0, K, 0, 0);
  ctx.save();
  if (g.shake > 0) ctx.translate((Math.random() - 0.5) * g.shake * 14, (Math.random() - 0.5) * g.shake * 10);
  ctx.drawImage(bg, 0, 0, W, H);
  ctx.fillStyle = '#fff';
  for (const s of STARS){ ctx.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.7 + s.p)); ctx.fillRect(s.x, s.y * (FIELD_TOP - 30), s.s, s.s); }
  ctx.globalAlpha = 1;
  if (fogSprite){
    for (let i = 0; i < 4; i++){
      const fw = 300 + i * 40, x = ((t * (8 + i * 3) + i * 170) % (W + fw)) - fw, y = FIELD_TOP - 10 + i * 36;
      ctx.globalAlpha = 0.1; ctx.drawImage(fogSprite, x, y - 30, fw, 90);
    }
    ctx.globalAlpha = 1;
  }
  drawPreview(t);
  const ms = g.monsters.slice().sort((a, b) => a.p - b.p);
  const fogOn = g.def && g.def.fog && g.def.fog.length && !(g.fogClear > 0);
  for (const m of ms){
    if (m.hidden) continue;                                             // wraith: invisible
    if (fogOn && m.p > -0.02 && g.def.fog.some(([a, b]) => m.p >= a && m.p <= b)) continue;   // inside a fog bank
    drawMonster(m, t);
  }
  if (g.def && g.def.fog && g.def.fog.length) drawFog(t, g.def.fog, g.fogClear > 0);
  drawMines(t);
  drawDrops(t);
  drawWalls(t);
  drawGraves();
  if (G.aim === 'buster') drawAimGraves(t);
  drawGrid(t);
  drawSproutBar();
  drawHintArrow(t);
  drawHoldRing();
  for (const pr of g.projs){
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pr.trail.length; i += 2){
      const a = (i / pr.trail.length); ctx.globalAlpha = a * 0.35; ctx.fillStyle = PTYPES[pr.vis].spark;
      ell(ctx, pr.trail[i], pr.trail[i + 1], pr.r * a * 0.9, pr.r * a * 0.9);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const s = pr.guar ? 0.76 : 0.66;
    ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(pr.rot);
    ctx.drawImage(sprites[pr.vis][1], -CS * s / 2, -CS * s / 2, CS * s, CS * s);
    ctx.restore();
  }
  for (const p of g.parts){
    const a = 1 - p.t / p.life;
    if (p.kind === 'ring'){
      ctx.globalAlpha = a; ctx.strokeStyle = p.color; ctx.lineWidth = 3 * a + 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.3 + 0.7 * (p.t / p.life)), 0, TAU); ctx.stroke();
    } else if (p.kind === 'chunk'){
      ctx.globalAlpha = a; ctx.fillStyle = p.color;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7); ctx.restore();
    } else {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = p.color;
      const sz = p.kind === 'flame' ? p.size * a : p.size;
      ell(ctx, p.x, p.y, sz, sz);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  ctx.globalAlpha = 1;
  for (const c of g.coinFx){
    if (c.t < 0) continue;
    const u = clamp(c.t / c.dur, 0, 1), e = u * u * (3 - 2 * u);
    const cx = c.sx + (coinTarget.x - c.sx) * e, cy = c.sy + (coinTarget.y - c.sy) * e - Math.sin(u * Math.PI) * 60;
    ctx.fillStyle = '#c7861a'; ell(ctx, cx, cy, 8, 8); ctx.fillStyle = '#ffd24a'; ell(ctx, cx - 1, cy - 1, 6.5, 6.5); ctx.fillStyle = '#fff4b8'; ell(ctx, cx - 3, cy - 3, 2, 2);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const f of g.floats){
    const a = 1 - f.t / f.life;
    ctx.globalAlpha = a; ctx.font = `700 ${f.size}px Fredoka, 'Trebuchet MS', sans-serif`;
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,10,20,.85)'; ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (g.flash > 0){ ctx.fillStyle = `rgba(255,240,210,${g.flash * 0.45})`; ctx.fillRect(0, 0, W, H); }
}

export function drawWalls(t){
  const fy = FENCE_Y;
  // corner posts
  ctx.fillStyle = '#4a3220'; ctx.fillRect(0, fy - 26, GX, 42); ctx.fillRect(W - GX, fy - 26, GX, 42);
  for (let c = 0; c < COLS; c++){
    const w = walls[c]; if (!w) continue;
    const x0 = GX + c * CS, f = w.hp / w.max, fl = w.flash;
    if (w.hp <= 0){
      ctx.fillStyle = '#3a2616';
      for (let i = 0; i < 5; i++) ell(ctx, x0 + 10 + i * 13, fy + 6 - (i % 2) * 4, 8, 5, i);
      continue;
    }
    const wood = fl > 0 ? mix('#8a6440', '#ff4a3a', Math.min(1, fl) * 0.7) : f < 0.35 ? '#6d4a2c' : '#8a6440';
    const rail = shade(wood, -34);
    ctx.fillStyle = rail; ctx.fillRect(x0 + 1, fy - 18, CS - 2, 7); ctx.fillRect(x0 + 1, fy - 1, CS - 2, 7);
    const intact = Math.ceil(f * 3);
    for (let i = 0; i < 3; i++){
      const px = x0 + 5 + i * 23, broken = i >= intact;
      const top = broken ? fy - 6 - (i * 5 % 9) : fy - 24;
      ctx.fillStyle = (c + i) % 3 === 1 ? shade(wood, -12) : wood;
      ctx.beginPath(); ctx.moveTo(px, fy + 14); ctx.lineTo(px, top);
      if (broken){ ctx.lineTo(px + 6, top - 5); ctx.lineTo(px + 11, top + 2); ctx.lineTo(px + 18, top - 3); }
      else { ctx.lineTo(px + 9, fy - 33 + ((c + i) % 2) * 3); ctx.lineTo(px + 18, top); }
      ctx.lineTo(px + 18, fy + 14); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(40,24,10,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      if (!broken){ ctx.fillStyle = 'rgba(30,18,8,.7)'; ell(ctx, px + 9, fy - 15, 1.6, 1.6); ell(ctx, px + 9, fy + 2, 1.6, 1.6); }
    }
    const bw = CS - 18, bx = x0 + 9, by = fy + 18;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(ctx, bx - 1, by - 1, bw + 2, 6, 3); ctx.fill();
    ctx.fillStyle = f > 0.6 ? '#94d65e' : f > 0.3 ? '#ffc14a' : '#ff5a4d';
    rrect(ctx, bx, by, Math.max(3, bw * f), 4, 2); ctx.fill();
  }
}

export function drawGraves(){
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    if (!graves[r][c]) continue;
    const x = LANE(c), y = GY + r * CS + CS / 2;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(ctx, x, y + 24, 24, 7);
    ctx.fillStyle = '#3b2a1c'; ell(ctx, x, y + 20, 26, 9);
    ctx.fillStyle = '#6c6f78'; rrect(ctx, x - 18, y - 24, 36, 46, 16); ctx.fill();
    ctx.fillStyle = '#8a8d96'; rrect(ctx, x - 18, y - 24, 30, 42, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(20,20,26,.7)'; ctx.lineWidth = 2; rrect(ctx, x - 18, y - 24, 36, 46, 16); ctx.stroke();
    ctx.fillStyle = '#55585f'; ctx.fillRect(x - 2.5, y - 14, 5, 20); ctx.fillRect(x - 8, y - 8, 16, 5);
    ctx.fillStyle = '#4f7a34'; ell(ctx, x + 12, y + 16, 7, 4, -0.4);
  }
}

export function drawPreview(t){
  const gid = heldGid(); if (gid == null || state !== 'play') return;
  const cols = new Set(groupCells(gid).map(o => o.c));
  for (const c of cols){
    const x = LANE(c);
    let best = null;
    for (const m of G.monsters) if (!m.dead && Math.abs(m.x - x) < m.hw && (!best || m.p > best.p)) best = m;
    const topY = best ? mY(best) : FIELD_TOP;
    const gr = ctx.createLinearGradient(0, FENCE_Y, 0, topY);
    gr.addColorStop(0, 'rgba(255,200,90,.32)'); gr.addColorStop(1, 'rgba(255,200,90,.06)');
    ctx.fillStyle = gr; ctx.fillRect(x - CS / 2 + 6, topY, CS - 12, FENCE_Y - topY);
    if (best){ ctx.strokeStyle = `rgba(255,220,120,${0.6 + 0.3 * Math.sin(t * 8)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, topY, best.r * mS(best) + 8, 0, TAU); ctx.stroke(); }
  }
}

export function drawDrops(t){
  for (const d of G.drops){
    if (d.t < 0) continue;
    const left = d.life - d.t, y = d.y - dropHop(d);
    const blink = left < 2 && Math.floor(left * 6) % 2 === 0;
    ctx.globalAlpha = (d.t < 0.3 ? d.t / 0.3 : 1) * (blink ? 0.35 : 1);
    const pulse = 26 + Math.sin(t * 6 + d.ph) * 3;
    ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(d.x, y, 6, d.x, y, pulse + 10);
    gr.addColorStop(0, 'rgba(255,200,90,.45)'); gr.addColorStop(1, 'rgba(255,160,40,0)');
    ctx.fillStyle = gr; ctx.fillRect(d.x - pulse - 10, y - pulse - 10, (pulse + 10) * 2, (pulse + 10) * 2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(255,220,130,.85)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(d.x, y, 25, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(left / d.life, 0, 1)); ctx.stroke();
    const sz = CS * 0.66;
    if (d.kind === 'weapon'){
      ctx.fillStyle = '#2a1636'; ctx.beginPath(); ctx.arc(d.x, y, 19, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '22px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(GEAR.find(g => g.key === d.item).icon, d.x, y + 1);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    } else ctx.drawImage(sprites[d.c][0], d.x - sz / 2, y - sz / 2 - 2, sz, sz);
    ctx.globalAlpha = 1;
  }
}

/** Pulsing outline on every grave while the grave buster is armed. */
/** Fog banks: opaque marsh mist over field ranges; thin and see-through while a lantern burns. */
export function drawFog(t, bands, cleared){
  const H0 = FIELD_TOP, H1 = FIELD_BOT;
  for (const [a, b] of bands){
    const y0 = H0 + a * (H1 - H0), y1 = H0 + b * (H1 - H0), pad = 26;
    const gr = ctx.createLinearGradient(0, y0 - pad, 0, y1 + pad);
    const al = cleared ? 0.18 : 0.94;
    gr.addColorStop(0, 'rgba(190,205,215,0)'); gr.addColorStop(0.18, `rgba(190,205,215,${al})`); gr.addColorStop(0.82, `rgba(170,190,205,${al})`); gr.addColorStop(1, 'rgba(170,190,205,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, y0 - pad, W, y1 - y0 + pad * 2);
    if (fogSprite){
      ctx.globalAlpha = cleared ? 0.08 : 0.35;
      for (let i = 0; i < 5; i++){ const x = ((i * 137 + t * 14) % (W + 200)) - 100, fw = 220; ctx.drawImage(fogSprite, x, y0 - 20 + Math.sin(t * 0.7 + i) * 8, fw, y1 - y0 + 40); }
      ctx.globalAlpha = 1;
    }
  }
}
/** Landmines waiting at the wall line. */
export function drawMines(t){
  for (const mine of G.mines || []){
    const x = LANE(mine.lane), y = FENCE_Y - 30;
    ctx.fillStyle = '#2a2230'; ell(ctx, x, y + 6, 13, 6);
    ctx.fillStyle = '#3d3348'; ell(ctx, x, y, 12, 9);
    ctx.fillStyle = Math.floor(t * 4) % 2 ? '#ff5a4d' : '#ffd35a'; ell(ctx, x, y - 4, 3, 3);
  }
}
export function drawAimGraves(t){
  ctx.strokeStyle = `rgba(255,211,90,${0.6 + 0.4 * Math.sin(t * 8)})`; ctx.lineWidth = 4;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    if (!graves[r][c]) continue;
    rrect(ctx, LANE(c) - 30, GY + r * CS + CS / 2 - 34, 60, 68, 18); ctx.stroke();
  }
}
export function drawGrid(t){
  const hg = heldGid(), flying = [];
  ctx.save();
  ctx.beginPath(); ctx.rect(0, GY - 4, W, ROWS * CS + 8); ctx.clip();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const cell = grid[r][c]; if (!cell) continue;
    if (cell.fly > 0){ flying.push([r, c, cell]); continue; }
    drawCell(r, c, cell, t, hg);
  }
  ctx.restore();
  for (const [r, c, cell] of flying) drawCell(r, c, cell, t, hg);
}

export function drawCell(r, c, cell, t, hg){
  const held = hg != null && cell.lit && cell.gids.includes(hg);
  let x = LANE(c) + cell.ox, y = GY + r * CS + CS / 2 + cell.oy;
  let s = (1 + cell.pop * 0.25) * (0.2 + 0.8 * cell.grow);
  if (cell.fly > 0){ s *= 0.85; y -= Math.sin((1 - cell.fly / 0.55) * Math.PI) * 50; }
  if (cell.wig > 0) x += Math.sin(cell.wig * 30) * 3 * cell.wig;
  if (cell.lit){
    y += Math.sin(t * 3 + cell.t) * 1.5;
    const fl = 0.75 + 0.25 * Math.sin(t * 9 + cell.t * 3) * Math.sin(t * 5.3 + cell.t);
    const rad = CS * (cell.bsize >= 5 ? 0.78 : 0.62) * (held ? 1.2 : 1);
    ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(x, y + 4, 4, x, y + 4, rad);
    gr.addColorStop(0, `rgba(255,190,70,${(held ? 0.8 : 0.5) * fl})`); gr.addColorStop(1, 'rgba(255,120,20,0)');
    ctx.fillStyle = gr; ctx.fillRect(x - rad, y + 4 - rad, rad * 2, rad * 2);
    ctx.globalCompositeOperation = 'source-over';
    if (held){ s *= 1.1; y -= 4; }
  }
  if (cell.c === RAINBOW){
    ctx.globalCompositeOperation = 'lighter';
    const hue = (t * 120 + cell.t * 40) % 360;
    ctx.strokeStyle = `hsla(${hue},90%,65%,.7)`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y + 2, CS * 0.42, 0, TAU); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
  const sz = CS * s;
  ctx.drawImage(sprites[cell.c][cell.lit ? 1 : 0], x - sz / 2, y - sz / 2, sz, sz);
  if (cell.lit && cell.bsize >= 5){
    ctx.fillStyle = '#ffe27a'; ctx.strokeStyle = 'rgba(60,30,0,.7)'; ctx.lineWidth = 1.5;
    drawStar(x + CS * 0.3, y - CS * 0.34, 6.5, t * 2);
  }
}

export function drawSproutBar(){
  if (G.mode === 'demo') return;
  const y = GY + ROWS * CS + 8, w = COLS * CS - 16, x = GX + 8;
  const full = emptyCells().length === 0, f = clamp(G.sproutT / save.spawnEvery, 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,.1)'; rrect(ctx, x, y, w, 5, 2.5); ctx.fill();
  ctx.fillStyle = full ? 'rgba(255,90,77,.7)' : '#94d65e'; rrect(ctx, x, y, Math.max(5, w * f), 5, 2.5); ctx.fill();
}

export function drawHoldRing(){
  if (!gest || gest.done || !gest.ref || gest.held < 0.12) return;
  const pos = findCell(gest.ref); if (!pos) return;
  const f = clamp((gest.held - 0.12) / (HOLD_TIME - 0.12), 0, 1);
  const x = LANE(pos.c), y = GY + pos.r * CS + CS / 2;
  ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(x, y, CS * 0.44, 0, TAU); ctx.stroke();
  ctx.strokeStyle = f > 0.85 ? '#ff5a4d' : '#ffb04a';
  ctx.beginPath(); ctx.arc(x, y, CS * 0.44, -Math.PI / 2, -Math.PI / 2 + TAU * f); ctx.stroke();
}

export function drawHintArrow(t){
  if (!G.hint || state !== 'play') return;
  const pos = findCell(G.hint.ref); if (!pos){ G.hint = null; return; }
  const cx = LANE(pos.c), cy = GY + pos.r * CS + CS / 2;
  const a = { left:Math.PI, right:0, up:-Math.PI / 2, down:Math.PI / 2 }[G.hint.dir], o = 8 + Math.sin(t * 6) * 8;
  ctx.save();
  ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 6);
  ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = 3;
  rrect(ctx, GX + pos.c * CS + 4, GY + pos.r * CS + 4, CS - 8, CS - 8, 16); ctx.stroke();
  ctx.translate(cx + Math.cos(a) * (CS * 0.5 + o), cy + Math.sin(a) * (CS * 0.5 + o)); ctx.rotate(a);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#ffd35a'; ctx.strokeStyle = 'rgba(60,30,0,.85)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(4, -6); ctx.lineTo(4, -15); ctx.lineTo(22, 0); ctx.lineTo(4, 15); ctx.lineTo(4, 6); ctx.lineTo(-14, 6); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawStar(x, y, r, rot){
  ctx.beginPath();
  for (let i = 0; i < 10; i++){ const a = rot + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
}
