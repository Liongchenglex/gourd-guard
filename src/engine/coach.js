// ---------- First-night coach (owner, 2026-10-06) ----------
// The first time 1-1 is played, a hand shows the two moves on the board instead of a card:
//   1. slide: the patch is set up so one slide makes a bunch of 3; monsters and sprouts wait while a hand drags it
//   2. flick: once the bunch lights up, one ghoul walks down its column and the hand swipes the bunch upward
//   3. praise: after the launch a short "Nice!" tip, then the night carries on as normal
// The hand is one baked sprite blitted with transforms (no painter calls or shadowBlur per frame).
import { G, grid, graves, setGrid, ROWS, COLS, CS, GX, GY, LANE, FIELD_TOP, FENCE_Y } from './state.js';
import { newCell, planMove, applyMove, revertMove, sameColorSize, findCell, bestLitGroup, resolveMatches } from './board.js';
import { spawnMonster } from './monsters.js';
import { scale } from './render/canvas.js';
import { save, persist } from '../save.js';
import { $ } from './util.js';

const TIPS = {
  slide: 'Drag a pumpkin to slide it. Line up <b>3 of the same colour</b> to make a bunch.',
  flick: 'The bunch is lit! <b>Swipe it up</b> to launch it at the ghoul.',
  praise: '<b>Nice!</b> Keep bunching and launching to guard your walls.',
};

/** Starts the coach on a fresh 1-1 (call after the board is built). */
export function startCoach(){
  if (!(G.mode === 'story' && G.n === 1 && !save.seenCoach)) return;
  // a clear patch: greens that touch nothing, plus two in the corner and one that slides in to make three
  setGrid(Array.from({ length:ROWS }, () => Array(COLS).fill(null)));
  const col = G.loadout[0];
  for (const [r, c] of [[4, 0], [4, 1], [4, 3], [2, 0], [1, 3], [2, 5], [4, 6], [0, 6]]) if (!graves[r][c]) grid[r][c] = newCell(col);
  save.seenFlick = true;   // the coach teaches the flick; skip the one-off banner
  G.coach = { step:'slide', t:0, move:null, stepT:0 };
  findMove(); tip('slide');
}

/** A slide that makes a bunch right now: the hand demonstrates this one. */
function findMove(){
  const c = G.coach; c.move = null;
  for (let r = 0; r < ROWS && !c.move; r++) for (let k = 0; k < COLS && !c.move; k++){
    const cell = grid[r][k]; if (!cell || cell.lit || cell.fly) continue;
    for (const dir of ['left', 'right', 'up', 'down']){
      const moves = planMove(r, k, dir); if (!moves) continue;
      const [, , tr, tc] = moves[0], cells = applyMove(moves, false);
      const ok = sameColorSize(grid, tr, tc) >= 3;
      revertMove(moves, cells);
      if (ok){ c.move = { ref:cell, dir, tr, tc }; break; }
    }
  }
}

function tip(step){
  const el = $('#coachTip'); if (!el) return;
  if (!step){ el.hidden = true; return; }
  el.innerHTML = TIPS[step]; el.hidden = false;
  el.style.top = Math.round((FENCE_Y - CS * 1.25) * scale) + 'px';
}

export const coachHolds = () => !!(G && G.coach && G.coach.step !== 'praise');   // monsters and sprouts wait while the coach is teaching

/** Called every frame from the game update. */
export function coachUpdate(dt){
  const c = G && G.coach; if (!c || G.over) return;
  c.t += dt; c.stepT += dt;
  const lit = bestLitGroup();
  if (c.step === 'slide'){
    if (lit){   // a bunch formed: send one ghoul down its column
      const pos = findCell(lit), lane = pos ? pos.c : 3;
      spawnMonster('ghoul', lane, false, 0.08); G.spawned++;
      c.step = 'flick'; c.stepT = 0; c.ref = lit; tip('flick');
    } else if (!c.move || !findCell(c.move.ref)) findMove();
  } else if (c.step === 'flick'){
    if (!lit && G.projs.length === 0 && c.stepT > 0.2){ c.step = 'praise'; c.stepT = 0; tip('praise'); }
    else if (lit) c.ref = lit;
  } else if (c.step === 'praise' && c.stepT > 3.5){
    tip(null); G.coach = null; save.seenCoach = true; persist(); resolveMatches();
  }
}
export function coachEnd(){ tip(null); }   // leaving the night hides the tip

// ---------- drawing ----------
let handSprite = null;
function hand(){
  if (handSprite) return handSprite;
  const c = document.createElement('canvas'), S = 64; c.width = c.height = S * 2; const g = c.getContext('2d'); g.scale(2, 2);
  g.translate(18, 6);   // the fingertip sits at (18, 6) in the sprite
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(14, 40, 16, 20, -.3, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff4e6'; g.strokeStyle = '#3a2418'; g.lineWidth = 2.2; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(-4, 4); g.quadraticCurveTo(-4, -4, 2, -4); g.quadraticCurveTo(8, -4, 8, 4); g.lineTo(8, 20);   // pointing finger
  g.quadraticCurveTo(10, 15, 15, 16); g.quadraticCurveTo(20, 17, 20, 23);   // knuckles
  g.quadraticCurveTo(24, 20, 28, 23); g.quadraticCurveTo(31, 26, 30, 32);
  g.quadraticCurveTo(33, 31, 35, 35); g.quadraticCurveTo(36, 46, 30, 54); g.quadraticCurveTo(22, 62, 8, 58);
  g.quadraticCurveTo(-6, 52, -10, 38); g.quadraticCurveTo(-13, 30, -6, 30); g.quadraticCurveTo(-3, 31, -4, 36);
  g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(58,36,24,.5)'; g.lineWidth = 1.4;
  for (const [x1, y1, x2, y2] of [[20, 23, 20, 30], [30, 32, 29, 38]]){ g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  handSprite = c; return c;
}
const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const cellXY = (r, c) => [GX + c * CS + CS / 2, GY + r * CS + CS / 2];

export function drawCoach(ctx){
  const c = G && G.coach; if (!c || G.over) return;
  const h = hand();
  const blit = (x, y, s, a) => { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.drawImage(h, -18, -6, 64, 64); ctx.restore(); };
  if (c.step === 'slide' && c.move){
    const pos = findCell(c.move.ref); if (!pos) return;
    const [x0, y0] = cellXY(pos.r, pos.c), [x1, y1] = cellXY(c.move.tr, c.move.tc);
    const P = 2.0, u = (c.t % P) / P;   // press 0-.2, drag .2-.65, hold .65-.85, fade .85-1
    const d = u < .2 ? 0 : u < .65 ? ease((u - .2) / .45) : 1;
    const x = x0 + (x1 - x0) * d, y = y0 + (y1 - y0) * d, press = u < .2 ? 1 - u * .6 : u < .65 ? .88 : 1;
    ctx.save(); ctx.globalAlpha = .55 + .35 * Math.sin(c.t * 6); ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = 3;
    ctx.strokeRect(GX + pos.c * CS + 5, GY + pos.r * CS + 5, CS - 10, CS - 10);
    ctx.setLineDash([6, 6]); ctx.strokeRect(GX + c.move.tc * CS + 5, GY + c.move.tr * CS + 5, CS - 10, CS - 10); ctx.restore();
    blit(x + 6, y + 4, press, u > .85 ? (1 - u) / .15 : 1);
  } else if (c.step === 'flick'){
    const pos = c.ref && findCell(c.ref); if (!pos) return;
    const [x0, y0] = cellXY(pos.r, pos.c), P = 1.4, u = (c.t % P) / P;
    const d = u < .25 ? 0 : u < .6 ? ease((u - .25) / .35) : 1, y = y0 - d * CS * 1.6;
    ctx.save();   // a dashed arrow up the column to the ghoul
    ctx.globalAlpha = .5 + .3 * Math.sin(c.t * 5); ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = 4; ctx.setLineDash([10, 10]); ctx.lineDashOffset = -c.t * 40;
    ctx.beginPath(); ctx.moveTo(x0, y0 - CS * .6); ctx.lineTo(x0, FIELD_TOP + 40); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.moveTo(x0, FIELD_TOP + 18); ctx.lineTo(x0 - 14, FIELD_TOP + 42); ctx.lineTo(x0 + 14, FIELD_TOP + 42); ctx.closePath(); ctx.fill();
    ctx.restore();
    blit(x0 + 6, y + 4, u < .25 ? .9 : 1, u > .8 ? (1 - u) / .2 : 1);
  }
}
