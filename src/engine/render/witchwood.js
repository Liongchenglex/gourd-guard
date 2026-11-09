// Nightmare Witchwood's field effects (Release 7): the Cauldron Toad's long tongue and the Treant's roots. Its body and the tongue's root in its mouth are baked
// character frames (render/chars/witchwood.js); the tongue that reaches down the lane to the fence is two baked sprites, a strip stretched to
// the current reach and a sticky tip, so it always lands on the fence whatever the screen height (perf rule: no painting per frame, two
// drawImage calls a lashing toad). Only called from code gated on `__RELEASE__ >= 7`, so lower builds drop it.

import { K } from './canvas.js';
import { E, S, pal } from './paint.js';
import { TOAD_FPS, TOAD_MOUTH, TOAD_N, WITCHWOOD, toadLash } from './chars/witchwood.js';
import { CS, FENCE_Y, LANE } from '../state.js';
import { ALTAR_STATES, BARRIER_N, altarSprite, barrierSprite, prebakeHexZone, prebakeUndeadZone } from './fx.js';
import { drawChar } from './anim.js';
import { ROOT_RISE, altarY, rootGround, rootScale } from '../witchwood.js';
import { TYPES } from '../../data/monsters.js';

const TW = 8, TH = 32, TIPW = 14, TIPH = 12;   // the tongue strip and its tip, world units
const cache = new Map();
const bk = k => Math.min(3, Math.max(0.5, k || 1));

function tongueSprites(){
  const k = bk(K), hit = cache.get(k); if (hit) return hit;
  const col = pal('#c23a48');
  // the strip: a cylinder lit from the left, so stretching it lengthwise keeps its look
  const strip = document.createElement('canvas'); strip.width = Math.ceil(TW * k); strip.height = Math.ceil(TH * k);
  { const g = strip.getContext('2d'); g.scale(k, k); const gr = g.createLinearGradient(0, 0, TW, 0);
    gr.addColorStop(0, col.deep); gr.addColorStop(.18, col.dark); gr.addColorStop(.38, col.light); gr.addColorStop(.6, col.base); gr.addColorStop(.85, col.dark); gr.addColorStop(1, col.deep);
    g.fillStyle = gr; g.fillRect(0, 0, TW, TH); g.fillStyle = 'rgba(90,10,24,.45)'; g.fillRect(TW / 2 - .4, 0, .8, TH); }   // the groove down its middle
  // the tip: a fat sticky pad
  const tip = document.createElement('canvas'); tip.width = Math.ceil(TIPW * k); tip.height = Math.ceil(TIPH * k);
  { const g = tip.getContext('2d'); g.scale(k, k); g.translate(TIPW / 2, TIPH / 2);
    S.part(g, E(0, 0, TIPW / 2 - 1, TIPH / 2 - 1), col, { x:0, y:0, r:TIPW / 2 - 1 }, { hx:-2, hy:-2, lw:1.2 }); }
  const sp = { strip, tip }; cache.set(k, sp); return sp;
}

/** Bake the tongue strip and tip now (game.js, on a night whose pool has a toad). */
export const prebakeTongue = () => { tongueSprites(); };
export const tongueBaked = () => cache.has(bk(K));

/** Draw a lashing toad's tongue. `g` is already translated to the monster (its drawn y) and scaled by `s`; `y` is that drawn y on screen. */
export function drawTongue(g, m, s, y){
  const t = ((m.ph * TOAD_FPS) % TOAD_N) / TOAD_N, { gape, reach } = toadLash(t);
  if (reach <= 0.01) return;
  const C = WITCHWOOD.toad, y0 = C.dy + (TOAD_MOUTH.y + 3 + gape * 10) * C.scale;   // inside the open mouth (the head drops by gape × 3 as it opens)
  const y1 = (FENCE_Y - 18 - y) / s;   // the fence's top rail, in the monster's units
  if (y1 <= y0) return;
  const len = (y1 - y0) * reach, { strip, tip } = tongueSprites(), w = TW * C.scale * 1.6;
  g.drawImage(strip, -w / 2, y0, w, len);
  g.drawImage(tip, -TIPW * C.scale * .75, y0 + len - TIPH * C.scale * .6, TIPW * C.scale * 1.5, TIPH * C.scale * 1.2);
}

/** The Triptych Sprite's barrier: every sheen frame for 2 lanes (the field's edge) and 3, baked at the canvas scale when a night that can
 *  spawn one starts (game.js), so no barrier is painted mid-night. */
export function prebakeBarrier(){ for (const n of [2, 3]) for (let i = 0; i < BARRIER_N; i++) barrierSprite(K, n, i); }

/** The Treant's roots (G.roots): one baked frame each (the 'root' atlas, prebaked on a Treant night through ALSO_BAKE): its rise clip over its
 *  first ROOT_RISE s, then its writhing idle. `fence` picks the fence roots (drawn over the fence, which they grip) or the mid-field ones
 *  (drawn under the monsters). One drawImage a root. */
export function drawRoots(g, roots, fence){
  for (let i = 0; i < roots.length; i++){
    const r = roots[i]; if (!!r.atFence !== fence) continue;
    const s = rootScale(r);
    g.save(); g.translate(LANE(r.lane), rootGround(r)); g.scale(s, s);
    drawChar(g, r, 'root', null, r.t < ROOT_RISE ? ['rise', Math.min(7, Math.floor(r.t / ROOT_RISE * 8))] : ['idle', Math.floor((r.t - ROOT_RISE) * 7) % 8]);
    g.restore();
  }
}

/** The Fallen Hexwitch's undead zone is 5 lanes by 5 tiles (render/draw.js drawHexZones). */
export const undeadZoneSize = () => [CS * 5 * 0.98, CS * 5];
/** Her night's field props, baked at the canvas scale when it starts (game.js): the altar's crack states and her 5x5 zone. */
export function prebakeFallenHex(){ for (let i = 0; i < ALTAR_STATES; i++) altarSprite(K, i); const [w, h] = undeadZoneSize(); prebakeUndeadZone(w, h, K); }
/** The Ash Crone's 3x3 zone (G.hexZones shape 'box'; render/draw.js drawHexZones) is the story Hexwitch's box: bake its backdrop at night start, not on first sight. */
export const prebakeCroneZone = () => prebakeHexZone(CS * 3 * 0.98, CS * 3, K);
/** The altar (G.altar): its crack state by health left, rising out of the ground over its first 0.4 s. One drawImage. */
export function drawAltar(g, a){
  const f = a.hp / TYPES.fallenhexwitch.altarHp, st = f > 2 / 3 ? 0 : f > 1 / 3 ? 1 : 2, sp = altarSprite(K, st);
  const rise = Math.min(1, a.t / 0.4), x = LANE(a.lane), y = altarY(a) + 22, s = 1.05;
  g.save(); g.globalAlpha *= rise;
  g.drawImage(sp.c, x - sp.ox * s, y - sp.oy * s * rise, sp.w * s, sp.h * s * rise);
  g.restore();
}
