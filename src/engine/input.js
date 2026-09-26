import { updateHud } from '../ui/hud.js';
import { ensureAudio } from './audio.js';
import { bestLitGroup, collectDrop, findCell, slideOne } from './board.js';
import { dropHop, launchGroup } from './combat.js';
import { useFirework, useRepair, useBuster, bustGrave, useLantern, useMine, placeMine, repairWall, useBomb, dropBomb, useScarecrow, placeScarecrow } from './game.js';
import { cv } from './render/canvas.js';
import { COLS, CS, G, GX, GY, H, ROWS, W, gest, graves, grid, setGest, state, FIELD_TOP, FENCE_Y, FIELD_BOT } from './state.js';
import { setState } from '../ui/screens.js';

// ---------- Input ----------

export function toLogical(e){ const r = cv.getBoundingClientRect(); return { x:(e.clientX - r.left) / r.width * W, y:(e.clientY - r.top) / r.height * H }; }

export function cellAt(x, y){
  const c = Math.floor((x - GX) / CS), r = Math.floor((y - GY) / CS);
  return (r >= 0 && r < ROWS && c >= 0 && c < COLS) ? { r, c } : null;
}

export function dropAt(x, y){
  let best = null, bd = 44;
  for (const d of G.drops){ if (d.dead || d.t < 0) continue; const dist = Math.hypot(d.x - x, (d.y - dropHop(d)) - y); if (dist < bd){ bd = dist; best = d; } }
  return best;
}

export function endGesture(e, cancel){
  if (!gest || e.pointerId !== gest.id) return;
  const g = gest; setGest(null);
  if (cancel || state !== 'play' || G.over || g.done) return;
  if (Math.hypot(g.x - g.sx, g.y - g.sy) >= 16) return;
  if (g.ref && findCell(g.ref)){
    if (g.ref.lit){ launchGroup(g.ref); return; }
    g.ref.wig = 1;
    return;
  }
  const d = dropAt(g.sx, g.sy);
  if (d) collectDrop(d);
}

export function attachInput(){
  cv.addEventListener('pointerdown', e => {
    ensureAudio();
    if (state !== 'play' || G.over) return;
    const p = toLogical(e);
    if (p.y < 70) return;   // top bar; the tool tray below it is DOM buttons, taps between them fall through harmlessly
    const pos = cellAt(p.x, p.y);
    if (G.aim === 'bomb'){   // armed bomb: this tap picks a spot on the field
      if (p.y >= FIELD_TOP && p.y <= FENCE_Y) dropBomb(p.x, p.y); else { G.aim = null; updateHud(true); }
      e.preventDefault(); return;
    }
    if (G.aim === 'scarecrow'){   // armed scarecrow: this tap picks a column
      const lane = Math.floor((p.x - GX) / CS);
      if (lane >= 0 && lane < COLS) placeScarecrow(lane); else { G.aim = null; updateHud(true); }
      e.preventDefault(); return;
    }
    if (G.aim === 'mine'){   // armed landmine: this tap picks a tile of the monster field (owner)
      const lane = Math.floor((p.x - GX) / CS), pp = (p.y - FIELD_TOP) / (FIELD_BOT - FIELD_TOP);
      if (lane >= 0 && lane < COLS && pp >= 0.04 && pp <= 0.97) placeMine(lane, pp); else { G.aim = null; updateHud(true); }
      e.preventDefault(); return;
    }
    if (G.aim === 'repair'){   // armed wall repair: this tap picks the wall to fix (owner: not all walls at once)
      const lane = Math.floor((p.x - GX) / CS);
      if (lane >= 0 && lane < COLS && p.y > FENCE_Y - CS * 1.2 && p.y < FENCE_Y + CS) repairWall(lane); else { G.aim = null; updateHud(true); }
      e.preventDefault(); return;
    }
    if (G.aim === 'buster'){   // armed grave buster: this tap either digs a grave or cancels
      if (pos && graves[pos.r][pos.c]) bustGrave(pos.r, pos.c); else { G.aim = null; updateHud(true); }
      e.preventDefault(); return;
    }
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    const inField = p.y < FENCE_Y;   // above the fence: a drag sweeps up dropped pumpkins and tools
    setGest({ id:e.pointerId, sx:p.x, sy:p.y, x:p.x, y:p.y, ref:pos ? grid[pos.r][pos.c] : null, done:false, held:0, collect:inField });
    if (inField){ const d = dropAt(p.x, p.y); if (d) collectDrop(d); }
    G.idle = 0; G.hint = null;
    e.preventDefault();
  });

  cv.addEventListener('pointermove', e => {
    if (!gest || e.pointerId !== gest.id) return;
    const p = toLogical(e); gest.x = p.x; gest.y = p.y;
    if (gest.collect){ const d = dropAt(p.x, p.y); if (d) collectDrop(d); return; }
    if (gest.done) return;
    const dx = p.x - gest.sx, dy = p.y - gest.sy;
    if (Math.hypot(dx, dy) < 26) return;
    gest.done = true;
    if (!gest.ref || !findCell(gest.ref)) return;
    if (gest.ref.lit && dy < 0 && Math.abs(dy) > Math.abs(dx) * 0.6){ launchGroup(gest.ref); return; }
    slideOne(gest.ref, Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
  });

  cv.addEventListener('pointerup', e => endGesture(e, false));

  cv.addEventListener('pointercancel', e => endGesture(e, true));

  cv.addEventListener('contextmenu', e => e.preventDefault());

  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play' && G && !G.over) setState('pause'); });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key === 'p'){ if (state === 'play' && !G.over) setState('pause'); else if (state === 'pause') setState('play'); return; }
    if (state !== 'play' || G.over) return;
    if (e.key === ' '){ e.preventDefault(); const b = bestLitGroup(); if (b) launchGroup(b); }
    else if (e.key === 'f') useFirework();
    else if (e.key === 'r') useRepair();
    else if (e.key === 'g') useBuster();
    else if (e.key === 'l') useLantern();
    else if (e.key === 'm') useMine();
    else if (e.key === 'b') useBomb();
    else if (e.key === 's') useScarecrow();
  });

}
