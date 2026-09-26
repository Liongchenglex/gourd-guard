// ---------- Baked animation ----------
// Characters in chars.js are drawn once per frame into strip canvases at the canvas scale K, then blitted.
// Atlases are built on first use and dropped when the canvas is resized (K changes).
// Spec: docs/superpowers/specs/2026-09-26-toy-plastic-sprites-design.md

import { CHARS, atlasKey, charKey } from './chars.js';
import { TYPES } from '../../data/monsters.js';
import { rgba } from './paint.js';
import { TAU } from '../util.js';

let atlases = new Map(), bakeK = 1;
let scratch = null;

/** Set the bake scale (device pixels per world unit). Drops every atlas when it changes. */
export function setBakeScale(k){ k = Math.min(2.5, Math.max(0.5, k)); if (k !== bakeK){ bakeK = k; atlases = new Map(); } }

function bake(akey){
  const [key, vkey] = akey.split('|'), C = CHARS[key], { box, scale } = C, fw = Math.ceil(box.w * scale * bakeK), fh = Math.ceil(box.h * scale * bakeK), clips = {};
  for (const [name, cl] of Object.entries(C.clips)){
    const c = document.createElement('canvas'); c.width = fw * cl.n; c.height = fh;
    const g = c.getContext('2d');
    for (let i = 0; i < cl.n; i++){
      const t = cl.once ? i / (cl.n - 1) : i / cl.n;
      g.save(); g.translate(i * fw, 0); g.scale(scale * bakeK, scale * bakeK); g.translate(-box.x, -box.y);
      C.draw(g, { ...cl.pose(t), variant:vkey || null }); g.restore();
    }
    clips[name] = { c, n:cl.n, fps:cl.fps, once:!!cl.once, fw, fh };
  }
  const a = { clips, fw, fh, dx:box.x * scale, dy:box.y * scale + C.dy, dw:box.w * scale, dh:box.h * scale };
  atlases.set(akey, a);
  return a;
}
export function atlas(akey){ return atlases.get(akey) || bake(akey); }
/** Atlas keys for a level pool entry: a plain type, or 'type|variantKey' for a costumed variant. */
export function poolKey(k, VARIANTS){ const v = VARIANTS[k]; return v ? atlasKey(v.base, k) : k; }
/** Bake every character a level can spawn so nothing hitches on first sight. keys are atlas keys (see poolKey). */
export function prebake(keys){ for (const k of keys) if (CHARS[k.split('|')[0]] && !atlases.has(k)) bake(k); }
/** Same, spread over idle time (used while the level card is open so Start does not hitch). */
export function prebakeAsync(keys){ const todo = keys.filter(k => CHARS[k.split('|')[0]] && !atlases.has(k)); const step = () => { const k = todo.shift(); if (!k) return; if (!atlases.has(k)) bake(k); (window.requestIdleCallback || (f => setTimeout(f, 16)))(step); }; step(); }

/** Which clip and frame a monster shows right now. */
export function pickFrame(m, key){
  const C = CHARS[key], clips = C.clips;
  if (C.frame){ const r = C.frame(m, clips); if (r) return r; }
  if (m.rise > 0 && clips.collapse){
    const T = TYPES[m.type] || {}, total = T.rise || TYPES.hexwitch.zoneRise, el = total - m.rise, n = clips.collapse.n, d = n / clips.collapse.fps;
    if (el < d) return ['collapse', Math.min(n - 1, Math.floor(el / d * n))];
    if (m.rise < d) return ['collapse', Math.min(n - 1, Math.floor(m.rise / d * n))];
    return ['collapse', n - 1];
  }
  if (m.anim && clips[m.anim.clip]){ const cl = clips[m.anim.clip]; return [m.anim.clip, Math.min(cl.n - 1, Math.floor(m.anim.t / m.anim.dur * cl.n))]; }
  if (m.type === 'boss' && !m.demo && m.age < 0.5 && clips.teleport){ const n = clips.teleport.n; return ['teleport', Math.max(0, Math.min(n - 1, Math.floor((1 - m.age / 0.5) * n)))]; }
  if (m.eating && clips.chew && m.frozenT <= 0){ const cl = clips.chew; return ['chew', Math.floor(m.ph * cl.fps) % cl.n]; }
  const cl = clips.walk;
  if (m.type === 'imp'){ const ph = ((m.ph * 4.5) / TAU) % 1; return ['walk', Math.floor(ph * cl.n) % cl.n]; }   // keyed to the engine's hop: sin(ph × 4.5)
  if (m.type === 'bat'){ const ph = ((m.ph * 16) / TAU) % 1; return ['walk', Math.floor(ph * cl.n) % cl.n]; }
  const rate = m.frozenT > 0 ? 0 : m.slowT > 0 ? 0.5 : 1;
  return ['walk', Math.floor(m.ph * cl.fps * rate) % cl.n];
}

/** Draw a character's current frame at the origin of `ctx` (already translated and scaled to the monster). tint = [colour, alpha] or null. */
export function drawChar(ctx, m, key, tint, clipOverride){
  const A = atlas(atlasKey(key, m.vkey)), [clip, fi] = clipOverride || pickFrame(m, key), cl = A.clips[clip] || A.clips.walk;
  const sx = fi * cl.fw;
  if (!tint){ ctx.drawImage(cl.c, sx, 0, cl.fw, cl.fh, A.dx, A.dy, A.dw, A.dh); return; }
  if (!scratch){ scratch = document.createElement('canvas'); }
  if (scratch.width < cl.fw || scratch.height < cl.fh){ scratch.width = Math.max(scratch.width, cl.fw); scratch.height = Math.max(scratch.height, cl.fh); }
  const g = scratch.getContext('2d');
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cl.fw, cl.fh);
  g.drawImage(cl.c, sx, 0, cl.fw, cl.fh, 0, 0, cl.fw, cl.fh);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = rgba(tint[0], tint[1]); g.fillRect(0, 0, cl.fw, cl.fh);
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(scratch, 0, 0, cl.fw, cl.fh, A.dx, A.dy, A.dw, A.dh);
}

/** A still of a character for icons and cards, fitted into a px × px canvas. */
export function charIcon(key, px, vkey){
  const C = CHARS[key], c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d'), s = Math.min(px * .86 / C.box.w, px * .86 / C.box.h);
  g.translate(px / 2 - (C.box.x + C.box.w / 2) * s, px / 2 - (C.box.y + C.box.h / 2) * s); g.scale(s, s);
  C.draw(g, { ...(C.still || {}), variant:vkey && C.variants && C.variants[vkey] ? vkey : null });
  return c;
}
export { charKey };
