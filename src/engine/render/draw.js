import { TYPES } from '../../data/monsters.js';
import { sproutEvery, shoreP } from '../game.js';
import { perkOn } from '../../data/perks.js';
import { GEAR } from '../../data/shop.js';
import { PTYPES, RAINBOW } from '../../data/pumpkins.js';
import { emptyCells, findCell, groupCells, heldGid } from '../board.js';
import { dropHop, castleY } from '../combat.js';
import { mS, mY, TILE_P } from '../monsters.js';
import { K, coinTarget, ctx } from './canvas.js';
import { drawMonster } from './monsters.js';
import { bg, fogSprite, sprites } from './sprites.js';
import { ell, mix, rrect, shade, tri } from './util.js';
import { COLS, CS, FENCE_Y, FIELD_BOT, FIELD_TOP, G, GX, GY, H, HOLD_TIME, LANE, ROWS, W, gest, graves, grid, state, walls, HOLD_TIME_QUICK } from '../state.js';
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
  if (g.def && g.def.sea) drawSea(t);
  drawPuddles(t);
  for (const m of g.monsters) if (m.type === 'doctor' && !m.dead && m.p > 0) drawHealZone(m, t);
  for (const m of g.monsters) if (m.type === 'bulwark' && !m.dead && m.p > 0) drawBulwarkZone(m, t);
  drawHexZones(t);
  const ms = g.monsters.slice().sort((a, b) => a.p - b.p);
  const walkerBands = g.monsters.filter(m => m.type === 'fogwalker' && !m.dead && m.p > 0).map(m => [m.p - TYPES.fogwalker.band, m.p + TYPES.fogwalker.band]);
  const rowBands = ((g.def && g.def.fogRows) || []).map(r => [r * TILE_P(), (r + 1) * TILE_P()]);
  const bands = [...((g.def && g.def.fog) || []), ...rowBands, ...walkerBands];
  const fogCols = (g.def && g.def.fogCols) || [];
  const fogOn = (bands.length || fogCols.length) && !(g.fogClear > 0);
  for (const m of ms){
    if (m.hidden) continue;                                             // wraith: invisible
    if (fogOn && m.type !== 'boss' && m.p > -0.02 && (bands.some(([a, b]) => m.p >= a && m.p <= b) || fogCols.includes(m.lane))) continue;   // inside a fog bank (bosses glow through)
    drawMonster(m, t);
  }
  drawTails(t);
  drawCastles(t);
  drawScarecrows(t);
  drawArrows(t);
  if (bands.length) drawFog(t, bands, g.fogClear > 0);
  if (fogCols.length) drawFogCols(t, fogCols, g.fogClear > 0);
  if (g.gustDir) drawWindArrows(t);
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
    const al = cleared ? 0.16 : 0.93;
    gr.addColorStop(0, 'rgba(150,172,190,0)'); gr.addColorStop(0.2, `rgba(158,180,198,${al})`); gr.addColorStop(0.5, `rgba(176,196,210,${al})`); gr.addColorStop(0.8, `rgba(150,172,190,${al})`); gr.addColorStop(1, 'rgba(140,162,180,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, y0 - pad, W, y1 - y0 + pad * 2);
    if (fogSprite){
      ctx.globalAlpha = cleared ? 0.08 : 0.5;
      for (let i = 0; i < 7; i++){ const x = ((i * 113 + t * 18) % (W + 240)) - 120, fw = 260; ctx.drawImage(fogSprite, x, y0 - 30 + Math.sin(t * 0.7 + i) * 10, fw, y1 - y0 + 60); }
      ctx.globalAlpha = 1;
    }
  }
}
/** Puddles (world 4): dark water pools on the field. */
export function drawPuddles(t){
  for (const pd of G.puddles || []){
    const x = LANE(pd.lane), y = FIELD_TOP + pd.p * (FIELD_BOT - FIELD_TOP);
    ctx.fillStyle = 'rgba(20,60,80,.75)'; ell(ctx, x, y + 8, CS * 0.44, 14);
    ctx.fillStyle = 'rgba(80,160,190,.35)'; ell(ctx, x - 6, y + 4, CS * 0.22, 6);
    ctx.strokeStyle = `rgba(160,220,240,${0.35 + 0.25 * Math.sin(t * 2 + pd.lane)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y + 8, CS * 0.3, 9, 0, 0, TAU); ctx.stroke();
  }
}
/** Sea row (world 4): water across the top of the field. */
export function drawSea(t){   // water from the top of the field down to the shoreline, with a foam edge so the spawn line is visible
  const y0 = FIELD_TOP - 6, h = Math.max(0.1, shoreP()) * (FIELD_BOT - FIELD_TOP) + 6, y1 = y0 + h;
  const gr = ctx.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, 'rgba(30,110,130,.92)'); gr.addColorStop(0.7, 'rgba(24,90,110,.8)'); gr.addColorStop(1, 'rgba(40,130,150,.75)');
  ctx.fillStyle = gr; ctx.fillRect(0, y0, W, h);
  ctx.strokeStyle = 'rgba(180,235,245,.35)'; ctx.lineWidth = 2;
  for (let i = 0; i < Math.floor(h / 26); i++){ ctx.beginPath(); for (let x = 0; x <= W; x += 12) ctx.lineTo(x, y0 + 14 + i * 26 + Math.sin(x * 0.05 + t * 2 + i) * 3); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(235,250,255,.9)'; ctx.lineWidth = 3;   // foam at the shoreline
  ctx.beginPath(); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, y1 + Math.sin(x * 0.08 + t * 3) * 3); ctx.stroke();
  ctx.fillStyle = 'rgba(235,250,255,.5)'; for (let x = 6; x < W; x += 22) ell(ctx, x + Math.sin(t * 2 + x) * 2, y1 + 4 + Math.cos(t * 3 + x) * 2, 4, 2);
}
/** Twin Tides: a serpent tail curling out of the water where a bolt is thrown from. */
export function drawTails(t){
  for (const tl of G.tails || []){
    const x = LANE(tl.lane), y = FIELD_TOP + tl.p * (FIELD_BOT - FIELD_TOP), up = Math.sin(Math.min(1, (0.9 - tl.t) / 0.35) * Math.PI) * 60;
    ctx.fillStyle = 'rgba(127,208,232,.5)'; ell(ctx, x, y + 6, 26, 7);
    ctx.strokeStyle = '#1f6f78'; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 8, y + 8); ctx.quadraticCurveTo(x + 10, y - up * 0.6, x + 4 + Math.sin(t * 12) * 6, y - up); ctx.stroke();
    ctx.fillStyle = '#2a8a90'; tri(ctx, x + 4 + Math.sin(t * 12) * 6, y - up - 10, 9);
  }
}
/** Castle walls (world 3): a stone segment across the lane with a health bar. */
export function drawCastles(t){
  for (const w of G.castles || []){
    if (w.dead) continue;
    const x = LANE(w.lane), y = castleY(w), hw = CS * 0.46;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(ctx, x, y + 20, hw, 7);
    ctx.fillStyle = w.flash > 0 ? '#e8e8f0' : '#6c6f78'; rrect(ctx, x - hw, y - 16, hw * 2, 34, 4); ctx.fill();
    ctx.fillStyle = w.flash > 0 ? '#ffffff' : '#8a8d96';
    for (let i = 0; i < 4; i++) ctx.fillRect(x - hw + 3 + i * (hw * 2 / 4), y - 24, hw * 2 / 4 - 6, 10);   // crenellations
    ctx.strokeStyle = 'rgba(20,20,26,.7)'; ctx.lineWidth = 2;
    for (let r = 0; r < 2; r++){ ctx.beginPath(); ctx.moveTo(x - hw, y - 5 + r * 12); ctx.lineTo(x + hw, y - 5 + r * 12); ctx.stroke(); }
    for (let i = 0; i < 3; i++){ ctx.beginPath(); ctx.moveTo(x - hw + (i + 0.5) * hw * 0.66, y - 16); ctx.lineTo(x - hw + (i + 0.5) * hw * 0.66, y + 18); ctx.stroke(); }
    const bw = hw * 1.6, bx = x - bw / 2, by = y + 24;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(ctx, bx - 1, by - 1, bw + 2, 7, 3); ctx.fill();
    ctx.fillStyle = '#d8d0c8'; rrect(ctx, bx, by, Math.max(0, bw * w.hp / w.maxHp), 5, 2.5); ctx.fill();
  }
}
/** Bulwark Knight's aura: 3 lanes × 3 tile heights, steel blue. */
export function drawBulwarkZone(m, t){
  const w = CS * 3 * 0.98, h = CS * 3, x = m.x - w / 2, y = mY(m) - h / 2;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);
  ctx.fillStyle = `rgba(140,160,200,${0.10 + 0.05 * pulse})`; rrect(ctx, x, y, w, h, 16); ctx.fill();
  ctx.strokeStyle = `rgba(190,205,235,${0.45 + 0.3 * pulse})`; ctx.lineWidth = 2; rrect(ctx, x, y, w, h, 16); ctx.stroke();
}
/** Hexwitch zones: purple; box (3×3), a whole column, or a row across the field. */
export function drawHexZones(t){
  for (const z of G.hexZones || []){
    const a = Math.min(1, z.t / 1.5), pulse = 0.5 + 0.5 * Math.sin(t * 3);
    let x, y, w, h;
    if (z.shape === 'col'){ x = LANE(z.lane) - CS * 0.49; y = FIELD_TOP; w = CS * 0.98; h = FIELD_BOT - FIELD_TOP; }
    else if (z.shape === 'row'){ x = GX; y = FIELD_TOP + z.p * (FIELD_BOT - FIELD_TOP) - CS * 1.5; w = CS * COLS; h = CS * 3; }
    else { x = LANE(z.lane) - CS * 1.5 * 0.98; y = FIELD_TOP + z.p * (FIELD_BOT - FIELD_TOP) - CS * 1.5; w = CS * 3 * 0.98; h = CS * 3; }
    ctx.fillStyle = `rgba(160,80,220,${(0.12 + 0.06 * pulse) * a})`; rrect(ctx, x, y, w, h, 16); ctx.fill();
    ctx.strokeStyle = `rgba(210,155,255,${(0.5 + 0.3 * pulse) * a})`; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = t * 24; rrect(ctx, x, y, w, h, 16); ctx.stroke(); ctx.setLineDash([]);
  }
}
/** Plague Doctor's healing zone: 3 lanes × 3 tile heights, pulsing green. */
export function drawHealZone(m, t){
  const w = CS * 3 * 0.98, h = CS * 3, x = m.x - w / 2, y = mY(m) - h / 2;
  const pulse = 0.5 + 0.5 * Math.sin(t * 3);
  ctx.fillStyle = `rgba(120,220,120,${0.10 + 0.06 * pulse})`; rrect(ctx, x, y, w, h, 16); ctx.fill();
  ctx.strokeStyle = `rgba(160,240,140,${0.45 + 0.3 * pulse})`; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 30; rrect(ctx, x, y, w, h, 16); ctx.stroke(); ctx.setLineDash([]);
}
/** Scarecrows (world 5 tool): a post with a straw figure and a health bar. */
export function drawScarecrows(t){
  for (const sc of G.scarecrows || []){
    const x = sc.x, y = sc.y;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(ctx, x, y + 24, 18, 6);
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 3, y - 20, 6, 44); ctx.fillRect(x - 22, y - 8, 44, 5);
    ctx.fillStyle = '#c8b060'; ell(ctx, x, y - 2, 12, 14); ell(ctx, x - 22, y - 6 + Math.sin(t * 3) * 2, 6, 4); ell(ctx, x + 22, y - 6 - Math.sin(t * 3) * 2, 6, 4);
    ctx.fillStyle = '#e8a030'; ell(ctx, x, y - 22, 11, 10);
    ctx.fillStyle = '#3a2a1a'; ell(ctx, x - 4, y - 24, 2, 2.5); ell(ctx, x + 4, y - 24, 2, 2.5);
    ctx.fillStyle = '#4a2a10'; ctx.fillRect(x - 14, y - 34, 28, 4); ctx.fillRect(x - 8, y - 46, 16, 13);
    const bw = 40, bx = x - bw / 2, by = y + 28;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(ctx, bx - 1, by - 1, bw + 2, 7, 3); ctx.fill();
    ctx.fillStyle = '#c8b060'; rrect(ctx, bx, by, Math.max(0, bw * sc.hp / sc.maxHp), 5, 2.5); ctx.fill();
  }
}
/** Archers' arrows. */
export function drawArrows(t){
  for (const a of G.arrows || []){
    const x = LANE(a.lane), y = FIELD_TOP + a.p * (FIELD_BOT - FIELD_TOP);
    if (a.mirror){ const sz = CS * 0.5; ctx.drawImage(sprites[a.vis][0], x - sz / 2, y - sz / 2, sz, sz); continue; }   // a reflected pumpkin
    ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 10); ctx.stroke();
    ctx.fillStyle = '#d8d0c0'; tri(ctx, x, y + 14, 5);
    ctx.fillStyle = '#c8b090'; ctx.fillRect(x - 4, y - 16, 8, 5);
  }
}
/** Column fog: a vertical bank down a whole lane. */
export function drawFogCols(t, lanes, cleared){
  for (const l of lanes){
    const x0 = LANE(l) - CS * 0.5 - 8, al = cleared ? 0.16 : 0.93;
    const gr = ctx.createLinearGradient(x0, 0, x0 + CS + 16, 0);
    gr.addColorStop(0, 'rgba(150,172,190,0)'); gr.addColorStop(0.2, `rgba(158,180,198,${al})`); gr.addColorStop(0.8, `rgba(158,180,198,${al})`); gr.addColorStop(1, 'rgba(150,172,190,0)');
    ctx.fillStyle = gr; ctx.fillRect(x0, FIELD_TOP - 10, CS + 16, FIELD_BOT - FIELD_TOP + 20);
    if (fogSprite){ ctx.globalAlpha = cleared ? 0.08 : 0.45; for (let i = 0; i < 4; i++) ctx.drawImage(fogSprite, x0 - 20, FIELD_TOP + ((i * 150 + t * 16) % (FIELD_BOT - FIELD_TOP + 100)) - 80, CS + 56, 160); ctx.globalAlpha = 1; }
  }
}
/** Wind warning: arrows on the patch rows or columns a gust will touch (all of them for a full gust). */
export function drawWindArrows(t){
  const d = G.gustDir, set = G.gustSet, vertical = d === 'up' || d === 'down';
  const glyph = { left:'←', right:'→', up:'↑', down:'↓' }[d];
  const a = 0.35 + 0.3 * Math.sin(t * 8);
  ctx.font = 'bold 44px Fredoka, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const idx = set || [...Array(vertical ? COLS : ROWS).keys()];
  for (const i of idx){   // big translucent arrows laid over the affected columns or rows of the patch
    const x = vertical ? LANE(i) : GX + COLS * CS / 2, y = vertical ? GY + ROWS * CS / 2 : GY + i * CS + CS / 2;
    if (vertical){ ctx.fillStyle = `rgba(255,217,160,${a * 0.25})`; ctx.fillRect(LANE(i) - CS / 2, GY, CS, ROWS * CS); }
    else { ctx.fillStyle = `rgba(255,217,160,${a * 0.25})`; ctx.fillRect(GX, GY + i * CS, COLS * CS, CS); }
    ctx.fillStyle = `rgba(255,217,160,${a + 0.3})`; ctx.fillText(glyph, x, y);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
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
  const full = emptyCells().length === 0, f = clamp(G.sproutT / sproutEvery(), 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,.1)'; rrect(ctx, x, y, w, 5, 2.5); ctx.fill();
  ctx.fillStyle = full ? 'rgba(255,90,77,.7)' : '#94d65e'; rrect(ctx, x, y, Math.max(5, w * f), 5, 2.5); ctx.fill();
}

export function drawHoldRing(){
  if (!gest || gest.done || !gest.ref || gest.held < 0.12) return;
  const pos = findCell(gest.ref); if (!pos) return;
  const f = clamp((gest.held - 0.12) / ((perkOn('smash') ? HOLD_TIME_QUICK : HOLD_TIME) - 0.12), 0, 1);
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
