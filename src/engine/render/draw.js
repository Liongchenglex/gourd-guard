import { TYPES } from '../../data/monsters.js';
import { sproutEvery, shoreP, MINE_ARM } from '../game.js';
import { perkOn } from '../../data/perks.js';
import { GEAR } from '../../data/shop.js';
import { PTYPES, RAINBOW, BROWN } from '../../data/pumpkins.js';
import { emptyCells, findCell, groupCells, heldGid, brownSize } from '../board.js';
import { dropHop, castleY } from '../combat.js';
import { mS, mY, TILE_P } from '../monsters.js';
import { K, coinTarget, ctx } from './canvas.js';
import { drawMonster } from './monsters.js';
import { charKey, drawChar } from './anim.js';
import { drawMinesFx, drawScarecrowsFx, drawToolFx, toolIcon } from './tools.js';
import { castleSprite, drawBlast, drawBolt, drawBulwarkZoneFx, drawHealZoneFx, drawHexBolt, drawHexZoneFx, drawMist, drawSigil, fenceSprite, foamTile, glowSprite, graveSprite, postSprite, puddleSprite, seaSprite, waveTile } from './fx.js';
import { bg, fogSprite, sprites } from './sprites.js';
import { ell, rrect, tri } from './util.js';
import { rng } from './paint.js';
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
    if (m.hidden && m.type !== 'diver') continue;                       // wraith: invisible (a submerged diver still shows ripples)
    if (fogOn && m.type !== 'boss' && m.p > -0.02 && (bands.some(([a, b]) => m.p >= a && m.p <= b) || fogCols.includes(m.lane))) continue;   // inside a fog bank (bosses glow through)
    drawMonster(m, t);
  }
  drawVfx();
  drawTails(t);
  drawCastles(t);
  drawScarecrows(t);
  drawArrows(t);
  if (bands.length) drawFog(t, bands, g.fogClear > 0);
  if (fogCols.length) drawFogCols(t, fogCols, g.fogClear > 0);
  if (bands.length || fogCols.length) drawBossBarsOverFog(g);   // owner: the boss's health bar must show through the mist
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
    const ps = s * (pr.type === BROWN ? [0.62, 0.82, 1.06][pr.size == null ? 1 : pr.size] : 1);   // brown flies at its grown size
    ctx.drawImage(sprites[pr.vis][1], -CS * ps / 2, -CS * ps / 2, CS * ps, CS * ps);
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

/** The palisade: a baked wooden sprite per column (render/fx.js) in four damage states, a live hit flash and the per-column health bar. */
export function drawWalls(t){
  const fy = FENCE_Y;
  // rail stubs in the margins outside the outer posts
  ctx.fillStyle = '#6b4526'; ctx.fillRect(0, fy - 19, GX + 2, 7); ctx.fillRect(0, fy + 1, GX + 2, 7); ctx.fillRect(W - GX - 2, fy - 19, GX + 2, 7); ctx.fillRect(W - GX - 2, fy + 1, GX + 2, 7);
  for (let c = 0; c < COLS; c++){
    const w = walls[c]; if (!w) continue;
    const x0 = GX + c * CS, f = w.hp / w.max, st = w.hp <= 0 ? 3 : f > 0.66 ? 0 : f > 0.33 ? 1 : 2;
    const sp = fenceSprite(K, st, c % 3);
    ctx.drawImage(sp.c, x0 - sp.ox, fy - sp.oy, sp.w, sp.h);
    if (w.flash > 0){ ctx.globalAlpha = Math.min(1, w.flash) * 0.55; ctx.fillStyle = '#ffb894'; rrect(ctx, x0 + 3, fy - 46, CS - 6, 60, 6); ctx.fill(); ctx.globalAlpha = 1; }
    if (w.hp <= 0) continue;   // a fallen wall shows its broken gap and no bar
    const bw = CS - 18, bx = x0 + 9, by = fy + 18;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(ctx, bx - 1, by - 1, bw + 2, 6, 3); ctx.fill();
    ctx.fillStyle = f > 0.6 ? '#94d65e' : f > 0.3 ? '#ffc14a' : '#ff5a4d';
    rrect(ctx, bx, by, Math.max(3, bw * f), 4, 2); ctx.fill();
  }
  const ps = postSprite(K); ctx.drawImage(ps.c, W - GX - ps.ox, fy - ps.oy, ps.w, ps.h);   // the right-hand corner post
}

/** Which of the three headstone shapes a cell gets: seeded from its position so it never changes mid-night. */
const GRAVE_VAR = Array.from({ length:ROWS }, (_, r) => Array.from({ length:COLS }, (_, c) => Math.floor(rng(r * 31 + c * 7 + 1)() * 3)));
export function drawGraves(){
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    if (!graves[r][c]) continue;
    const sp = graveSprite(K, GRAVE_VAR[r][c]);
    ctx.drawImage(sp.c, LANE(c) - sp.ox, GY + r * CS + CS / 2 - sp.oy, sp.w, sp.h);
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
      ctx.fillStyle = '#2a1636'; ctx.beginPath(); ctx.arc(d.x, y, 20, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = 2; ctx.stroke();
      const ic = toolIcon(d.item, 36); ctx.drawImage(ic, d.x - 17, y - 17, 34, 34);
    } else ctx.drawImage(sprites[d.c][0], d.x - sz / 2, y - sz / 2 - 2, sz, sz);
    ctx.globalAlpha = 1;
  }
}

/** Pulsing outline on every grave while the grave buster is armed. */
/** Fog banks: opaque marsh mist over field ranges; thin and see-through while a lantern burns. */
export function drawFog(t, bands, cleared){   // layered drifting mist (render/fx.js drawMist): the whole hide extent is dense, only a fringe outside it is thin
  const FR = 44, H0 = FIELD_TOP, H1 = FIELD_BOT, pad = FR / (H1 - H0);
  // overlapping banks (fogwalkers crowd the same rows) are merged into one so they cost one bank and show no seams; the extents drawn are unchanged
  const sorted = bands.slice().sort((p, q) => p[0] - q[0]), merged = [];
  for (const [a, b] of sorted){ const last = merged[merged.length - 1]; if (last && a - pad <= last[1] + pad) last[1] = Math.max(last[1], b); else merged.push([a, b]); }
  let i = 0;
  for (const [a, b] of merged){
    const y0 = H0 + a * (H1 - H0), y1 = H0 + b * (H1 - H0);
    drawMist(ctx, K, 0, y0 - FR, W, y1 - y0 + FR * 2, t, cleared, i++, false, FR);
  }
}
/** Puddles (world 5): baked glossy pools (render/fx.js) with two slow live ripples each. */
export function drawPuddles(t){
  const pds = G.puddles; if (!pds || !pds.length) return;
  const rx = CS * 0.44, ry = 14;
  ctx.lineWidth = 1.3; ctx.strokeStyle = '#b8e6f4';
  for (const pd of pds){
    const x = LANE(pd.lane), y = FIELD_TOP + pd.p * (FIELD_BOT - FIELD_TOP) + 8;
    const sp = puddleSprite(K, pd.lane); ctx.drawImage(sp.c, x - sp.ox, y - sp.oy, sp.w, sp.h);
    for (let j = 0; j < 2; j++){
      const f = (t * 0.28 + j * 0.5 + pd.lane * 0.19) % 1, s = 0.12 + 0.68 * f;
      ctx.globalAlpha = (1 - f) * 0.55 * Math.min(1, f * 12);
      ctx.beginPath(); ctx.ellipse(x + (j ? 4 : -4), y + (j ? 1.5 : -1.5), rx * s, ry * s, 0, 0, TAU); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
/** Sea (world 5): a baked water base, scrolling wave tiles and a foam lace at the shoreline so the spawn line stays obvious. */
export function drawSea(t){
  const y0 = FIELD_TOP - 6, h = Math.max(0.1, shoreP()) * (FIELD_BOT - FIELD_TOP) + 6, y1 = y0 + h;
  const sea = seaSprite(K, h); ctx.drawImage(sea.c, 0, y0, W, h);
  const wt = waveTile(K), rows = Math.max(1, Math.floor(h / 34)), n = Math.ceil(W / 240) + 1;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip();
  for (let i = 0; i < rows; i++){
    const yy = y0 + 2 + (i + 0.5) * (h - 16) / rows - 8, spd = (14 + i * 5) * (i % 2 ? -1 : 1), off = ((t * spd + i * 80) % 240 + 240) % 240 - 240, bob = Math.sin(t * 1.3 + i * 1.7) * 1.5;
    ctx.globalAlpha = 0.4 + 0.45 * (rows > 1 ? i / (rows - 1) : 1);
    for (let j = 0; j <= n; j++) ctx.drawImage(wt.c, off + j * 240, yy + bob, 240, 30);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  for (let i = 0; i < 6; i++){   // bubbles rising through the water
    const f = (t * (0.1 + i * 0.02) + i * 0.17) % 1, bx = (i * 97 + 30) % W + Math.sin(t * 2 + i) * 3, by = y1 - 8 - f * (h - 18);
    ctx.globalAlpha = Math.sin(f * Math.PI) * 0.5; ctx.strokeStyle = '#dff6fb'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, 2 + (i % 3), 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(12,44,62,.28)'; ctx.fillRect(0, y1 + 4, W, 8);   // wet sand under the foam
  const ft = foamTile(K), off = ((t * 22) % 240 + 240) % 240 - 240, bob = Math.sin(t * 1.6) * 2;
  for (let j = 0; j <= n; j++) ctx.drawImage(ft.c, off + j * 240, y1 - 14 + bob, 240, 30);
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
  const cs = G.castles; if (!cs || !cs.length) return;
  const glow = glowSprite(K);
  for (const w of cs){
    if (w.dead) continue;
    const x = LANE(w.lane), y = castleY(w), hw = CS * 0.46;
    const sp = castleSprite(K, w.hp / w.maxHp);   // baked hewn stone with crenellations and a portcullis, cracking as it takes damage (render/fx.js)
    ctx.drawImage(sp.c, x - sp.ox, y - sp.oy, sp.w, sp.h);
    const tx = x + sp.w / 2 - 9, ty = y - 27, ga = 0.3 + 0.1 * Math.sin(t * 13 + w.lane * 2) + 0.06 * Math.sin(t * 7.3 + w.lane);   // torch flicker
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = ga; ctx.drawImage(glow.c, tx - 24, ty - 24, 48, 48); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if (w.flash > 0){ ctx.globalAlpha = 0.7; ctx.fillStyle = '#ffffff'; rrect(ctx, x - sp.w / 2, y - 52, sp.w, 72, 6); ctx.fill(); ctx.globalAlpha = 1; }
    const bw = hw * 1.6, bx = x - bw / 2, by = y + 24;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(ctx, bx - 1, by - 1, bw + 2, 7, 3); ctx.fill();
    ctx.fillStyle = '#d8d0c8'; rrect(ctx, bx, by, Math.max(0, bw * w.hp / w.maxHp), 5, 2.5); ctx.fill();
  }
}
/** Bulwark Knight's aura: 3 lanes × 3 tile heights, steel blue. */
export function drawBulwarkZone(m, t){
  const w = CS * 3 * 0.98, h = CS * 3, x = m.x - w / 2, y = mY(m) - h / 2;
  drawBulwarkZoneFx(ctx, x, y, w, h, t);
}
/** Hexwitch zones: purple; box (3×3), a whole column, or a row across the field. */
export function drawHexZones(t){
  for (const z of G.hexZones || []){
    const a = Math.min(1, z.t / 1.5), pulse = 0.5 + 0.5 * Math.sin(t * 3);
    let x, y, w, h;
    if (z.shape === 'col'){ x = LANE(z.lane) - CS * 0.49; y = FIELD_TOP; w = CS * 0.98; h = FIELD_BOT - FIELD_TOP; }
    else if (z.shape === 'row'){ x = GX; y = FIELD_TOP + z.p * (FIELD_BOT - FIELD_TOP) - CS * 0.5; w = CS * COLS; h = CS; }
    else { x = LANE(z.lane) - CS * 1.5 * 0.98; y = FIELD_TOP + z.p * (FIELD_BOT - FIELD_TOP) - CS * 1.5; w = CS * 3 * 0.98; h = CS * 3; }
    drawHexZoneFx(ctx, x, y, w, h, t, a);
  }
}
/** Plague Doctor's healing zone: 3 lanes × 3 tile heights, pulsing green. */
export function drawHealZone(m, t){
  const w = CS * 3 * 0.98, h = CS * 3, x = m.x - w / 2, y = mY(m) - h / 2;
  drawHealZoneFx(ctx, x, y, w, h, t);
}
/** Scarecrows (world 5 tool): a post with a straw figure and a health bar. */
export function drawScarecrows(t){ drawScarecrowsFx(ctx, G.scarecrows || [], t, sc => G.monsters.some(m => !m.dead && m.chewing === sc)); }
/** Archers' arrows. */
export function drawArrows(t){
  for (const a of G.arrows || []){
    const x = LANE(a.lane), y = FIELD_TOP + a.p * (FIELD_BOT - FIELD_TOP);
    if (a.mirror){ const sz = CS * 0.5; ctx.drawImage(sprites[a.vis][0], x - sz / 2, y - sz / 2, sz, sz); continue; }   // a reflected pumpkin
    if (a.water){   // divers and Twin Tides hurl water balls: a wobbling blue blob with a highlight and a spray of droplets behind it
      const r = 11 + Math.sin(t * 18 + a.lane) * 1.5, ry = 11 - Math.sin(t * 18 + a.lane) * 1.5;
      for (let i = 1; i <= 3; i++){ ctx.fillStyle = `rgba(120,190,235,${0.5 - i * 0.12})`; ctx.beginPath(); ctx.arc(x + Math.sin(t * 25 + i * 2.1) * 5, y - 12 - i * 8, 4 - i * 0.7, 0, Math.PI * 2); ctx.fill(); }
      const gr = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, 13); gr.addColorStop(0, '#dff4ff'); gr.addColorStop(0.35, '#7cc4ec'); gr.addColorStop(1, '#2a72b0');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(20,70,120,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(x - 4, y - 5, 3.5, 2.2, -0.6, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 10); ctx.stroke();
    ctx.fillStyle = '#d8d0c0'; tri(ctx, x, y + 14, 5);
    ctx.fillStyle = '#c8b090'; ctx.fillRect(x - 4, y - 16, 8, 5);
  }
}
/** Column fog: a vertical bank down a whole lane. */
export function drawFogCols(t, lanes, cleared){
  for (const l of lanes) drawMist(ctx, K, LANE(l) - CS * 0.5 - 16, FIELD_TOP - 10, FIELD_BOT - FIELD_TOP + 20, CS + 32, t, cleared, 10 + l, true, 16);
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
/** Boss health bars redrawn on top of the fog so they are never hidden (mirrors the bar in render/monsters.js). */
export function drawBossBarsOverFog(g){
  for (const m of g.monsters){
    if (m.type !== 'boss' || m.dead || m.hidden || m.maxHp <= 8) continue;
    const s = mS(m), y = mY(m); let by = y - m.r * s * 1.45 - 10 - 30; if (by < FIELD_TOP + 4) by = y + m.r * s * 1.25 + 8;
    const bw = Math.max(40, m.r * 1.7) * s, bx = m.x - bw / 2;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(ctx, bx - 1, by - 1, bw + 2, 8, 3.5); ctx.fill();
    ctx.fillStyle = '#c77dff'; rrect(ctx, bx, by, Math.max(0, bw * m.hp / m.maxHp), 6, 3); ctx.fill();
  }
}
/** Landmines waiting on their tile. */
export function drawMines(t){ drawMinesFx(ctx, G.mines || [], t, p => p == null ? FENCE_Y - 30 : FIELD_TOP + p * (FIELD_BOT - FIELD_TOP), LANE, MINE_ARM); }
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
  const bsz = cell.c === BROWN ? brownSize(cell) : -1;
  if (bsz >= 0) s *= [0.55, 0.8, 1.18][bsz];   // small, medium, big: clearly different sizes
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
  if (bsz === 2){ const gg = ctx.createRadialGradient(x, y, CS * 0.2, x, y, CS * 0.7); gg.addColorStop(0, 'rgba(255,190,90,.55)'); gg.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = gg; ctx.fillRect(x - CS * 0.7, y - CS * 0.7, CS * 1.4, CS * 1.4); }   // big brown: ripe glow
  ctx.drawImage(sprites[cell.c][cell.lit ? 1 : 0], x - sz / 2, y - sz / 2, sz, sz);
  if (bsz === 0){ ctx.fillStyle = '#7fd05a'; ell(ctx, x + CS * 0.12, y - CS * 0.3, 6, 3, -0.6); ell(ctx, x + CS * 0.2, y - CS * 0.36, 5, 2.5, 0.5); }   // small brown: a sprout
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

/** Baked-character effects: a dying monster's last frame popping, or a clip played on its own (the Gravekeeper dissolving). */
function drawVfx(){
  if (!G.vfx) return;
  for (const v of G.vfx){
    if (v.t < 0) continue;   // a delayed effect
    const p = Math.min(1, v.t / v.dur);
    if (['firework', 'hammer', 'dynamite', 'lantern', 'bombdrop', 'scbreak'].includes(v.kind)){ drawToolFx(ctx, v, G.t); continue; }
    if (v.kind === 'pop'){
      const key = charKey(v.m); if (!key) continue;
      ctx.save(); ctx.translate(v.x, v.y); ctx.scale(v.s * (1 + p * 0.5), v.s * (1 - p * 0.85)); ctx.globalAlpha = 1 - p;
      if (v.m.type === 'imp') ctx.translate(0, -(v.m.hop || 0) * 14);
      drawChar(ctx, v.m, key, ['#ffffff', 0.3]); ctx.restore();
    } else if (v.kind === 'bolt') drawBolt(ctx, v);
    else if (v.kind === 'blast') drawBlast(ctx, v);
    else if (v.kind === 'hexbolt') drawHexBolt(ctx, v);
    else if (v.kind === 'sigil') drawSigil(ctx, v);
    else if (v.kind === 'clip'){
      ctx.save(); ctx.translate(v.x, v.y); ctx.scale(v.s, v.s);
      drawChar(ctx, {}, v.key, null, [v.clip, Math.floor(p * 7.999)]); ctx.restore();
    }
  }
}
