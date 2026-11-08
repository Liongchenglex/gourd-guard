// The Crumbling Keep nightmare's weather (Release 8; spec Part 1, owner 2026-11-08): rain that falls over the whole screen and lightning
// that flashes now and then. Perf rule (CLAUDE.md): everything is baked once. Two tileable rain sheets (far drops, near drops) scroll down at
// different speeds, and three forked bolts are baked with their glow; a frame is at most 6 drawImage calls and one fillRect, no paths, no
// shadowBlur. Drawn behind the monsters and the patch (render() in draw.js), on the `keepN` nightmare scene only.
import { G, H, W, state } from '../state.js';
import { WORLDS } from '../../data/worlds/index.js';
import { SFX } from '../audio.js';
import { bolt } from './nightmare/scenes.js';
import { rng } from './paint.js';

const SHEET_H = 960;                       // the rain sheets are baked W x 960 (css px at 1x) and stretched to the screen
const FAR_SPEED = 380, NEAR_SPEED = 700;   // css px a second
const FLASH_PEAK = 0.25, FLASH_FIRST = 8, FLASH_SPREAD = 7;   // a flash every 8 to 15 s; peak alpha of the pale blue-white overlay
const BOLT_H = 150, BOLT_K = 1.5;
const TIP = '#c8d4ff';

let far = null, near = null, bolts = null;
let farY = 0, nearY = 0, flashT = -1, nextT = FLASH_FIRST, double = false, boltIx = 0, thunderT = -1, flash = 0, boltShown = -1;
let mq = null, last = 0;

function ensureBaked(){ if (!far){ bakeRain(); bakeBolts(); } }

/** Two tileable rain sheets (the far one fine and faint, the near one longer and brighter). Drops are repeated one sheet up and down and to
 *  the sides, so the sheet wraps both ways. */
export function bakeRain(){
  const make = (n, a, lw, l0, l1, seed) => {
    const c = document.createElement('canvas'); c.width = W; c.height = SHEET_H; const g = c.getContext('2d'), R = rng(seed);
    g.strokeStyle = `rgba(200,215,255,${a})`; g.lineWidth = lw; g.lineCap = 'round';
    for (let i = 0; i < n; i++){
      const x = R() * W, y = R() * SHEET_H, l = l0 + R() * (l1 - l0);
      for (const dy of [-SHEET_H, 0, SHEET_H]) for (const dx of [-W, 0, W]){ g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx - l * .35, y + dy + l); g.stroke(); }
    }
    return c;
  };
  far = make(150, .12, 1, 8, 14, 5); near = make(75, .24, 1.4, 16, 26, 6);
}

/** Three forked bolts over the towers, baked with their glow (the scene's bolt()). */
export function bakeBolts(){
  bolts = [[250, 4, 5], [430, 3, 7], [110, 3.4, 9]].map(([x, w, seed]) => {
    const c = document.createElement('canvas'); c.width = Math.round(W * BOLT_K); c.height = Math.round(BOLT_H * BOLT_K); const g = c.getContext('2d'); g.scale(BOLT_K, BOLT_K);
    bolt(g, x, 0, BOLT_H - 20, rng(seed), w); return c;
  });
}

function reduced(){ if (!mq && typeof matchMedia === 'function') mq = matchMedia('(prefers-reduced-motion: reduce)'); return !!(mq && mq.matches); }

function trigger(){   // a flash now: one of the three bolts, sometimes a double flicker, and thunder about 0.6 s later
  flashT = 0; boltIx = Math.min(2, Math.floor(Math.random() * 3)); double = Math.random() < 0.4; thunderT = 0.6;
}

// One pulse: a quick rise, then a fade out (total 0.34 s); the double flicker adds a weaker second one 0.1 s in, so a flash is over by 0.45 s.
const pulse = tau => tau < 0 ? 0 : tau < 0.04 ? tau / 0.04 : tau < 0.34 ? ((0.34 - tau) / 0.3) ** 2 : 0;

/** Advance the weather by dt seconds and blit it. Called once a frame behind the monsters. */
export function drawWeather(ctx, dt){
  if (!far) ensureBaked();
  if (state !== 'play' || G.over || document.hidden) dt = 0;   // paused, over or the app asleep: the sky stands still (no rain, flash or thunder timers)
  const calm = reduced();
  if (!calm){
    farY = (farY + FAR_SPEED * dt) % SHEET_H; nearY = (nearY + NEAR_SPEED * dt) % SHEET_H;
    if (flashT < 0){ nextT -= dt; if (nextT <= 0) trigger(); }
    if (flashT >= 0){
      flashT += dt;
      flash = FLASH_PEAK * Math.max(pulse(flashT), double ? 0.8 * pulse(flashT - 0.1) : 0);
      if (flashT > (double ? 0.45 : 0.35)){ flashT = -1; flash = 0; nextT = FLASH_FIRST + Math.random() * FLASH_SPREAD; }
    }
    if (thunderT >= 0){ thunderT -= dt; if (thunderT < 0) SFX.thunder(); }
  } else { flash = 0; flashT = -1; }
  // the stretch onto the screen: sheet y runs 0..SHEET_H over H css px
  const k = H / SHEET_H, fy = farY * k, ny = nearY * k;
  ctx.drawImage(far, 0, fy - H, W, H); ctx.drawImage(far, 0, fy, W, H);
  ctx.drawImage(near, 0, ny - H, W, H); ctx.drawImage(near, 0, ny, W, H);
  boltShown = -1;
  if (flash > 0){
    ctx.globalAlpha = flash; ctx.fillStyle = TIP; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = Math.min(1, flash * 4); ctx.drawImage(bolts[boltIx], 0, 0, W, BOLT_H); boltShown = boltIx;
    ctx.globalAlpha = 1;
  }
}

/** Is the night on the Keep nightmare's thunderstorm map? */
export function stormOn(){ const w = G.def && G.def.nightmare ? WORLDS[G.world] : null; return !!(w && w.scene === 'keepN'); }

/** render() calls this every frame: the weather on the storm map only, timed by the wall clock (clamped so a pause does not jump). */
export function drawWeatherFrame(ctx){
  const now = performance.now(), dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016; last = now;
  if (stormOn()) drawWeather(ctx, dt);
}

// ---- test hooks (src/main.js, ?test only) ----
export const weatherState = () => ({ far:farY, near:nearY, flash, bolt:boltShown, active:stormOn() });
/** Called at every night start (game.js): the timers start fresh (no late rumble from the last storm), and on the storm map the sheets and bolts are baked now, not on the first frame. */
export function prebakeWeather(){ weatherReset(); if (stormOn()) ensureBaked(); }
export function weatherReset(){ farY = nearY = 0; flashT = -1; flash = 0; thunderT = -1; nextT = FLASH_FIRST + Math.random() * FLASH_SPREAD; boltShown = -1; }
export function weatherForce(){ trigger(); }
export const weatherBaked = () => !!far;
