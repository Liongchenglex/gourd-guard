import { PTYPES } from '../../data/pumpkins.js';
import { WORLDS } from '../../data/worlds/index.js';
import { K, dpr } from './canvas.js';
import { ell, rrect } from './util.js';
import { pumpkin } from './chars.js';
import { faceFor } from './faces.js';
import { skinnedPumpkin } from './wardrobe.js';
import { save } from '../../save.js';
import { E, pal, rng, rgba, mix, SM, SO } from './paint.js';
import { COLS, CS, FENCE_Y, FIELD_TOP, GX, GY, H, ROWS, W } from '../state.js';
import { TAU } from '../util.js';

export let sprites = [], fogSprite = null, bg = null, bgWorld = -1;

export const RAINBOW_RIBS = [
  { base:'#d63a2a', light:'#ff8a70', dark:'#7f1c13' }, { base:'#8746c2', light:'#c79cf2', dark:'#4c2379' },
  { base:'#f0a020', light:'#ffd98a', dark:'#9a5a08' }, { base:'#3f86d5', light:'#a8d4ff', dark:'#1d4a82' },
  { base:'#5c9c33', light:'#a6e07a', dark:'#305c17' },
];

export function paintPumpkin(g, cx, cy, R, col, lit){
  g.save(); g.translate(cx, cy);
  const skin = save.wardrobe && save.wardrobe.skins[PTYPES.indexOf(col)];   // a worn skin repaints this colour (owner, 2026-09-27)
  if (skin) skinnedPumpkin(g, skin, R, lit);
  else pumpkin(g, col.rainbow ? RAINBOW_RIBS.map(c => pal(c.base)) : pal(col.base), lit, R, faceFor(col.key));   // no face in the patch; a carved face per type when bunched (owner, 2026-09-27)
  g.restore();
}

export function pumpkinIcon(t, lit, px){
  const c = document.createElement('canvas'); c.width = c.height = px || 96;
  const g = c.getContext('2d'); g.scale(c.width / CS, c.width / CS); paintPumpkin(g, CS / 2, CS / 2 + 3, CS * 0.4, PTYPES[t], lit);
  return c;
}

export function buildSprites(){
  const px = Math.max(24, Math.round(CS * K));
  sprites = PTYPES.map(col => [false, true].map(lit => {
    const c = document.createElement('canvas'); c.width = c.height = px;
    const g = c.getContext('2d'); g.scale(px / CS, px / CS);
    paintPumpkin(g, CS / 2, CS / 2 + 3, CS * 0.4, col, lit);
    return c;
  }));
  const fs = Math.round(256 * Math.min(dpr, 1.5));
  fogSprite = document.createElement('canvas'); fogSprite.width = fogSprite.height = fs;
  const fg = fogSprite.getContext('2d'), gr = fg.createRadialGradient(fs / 2, fs / 2, 0, fs / 2, fs / 2, fs / 2);
  gr.addColorStop(0, 'rgba(210,200,230,.55)'); gr.addColorStop(1, 'rgba(210,200,230,0)');
  fg.fillStyle = gr; fg.fillRect(0, 0, fs, fs);
}

// ======================================================================
// Background painter: one painterly night per world, cached as one canvas.
// Three layers: sky (gradient, stars, moon), a horizon silhouette band with
// rim-lit props, then the field (7 soft lanes) and the pumpkin patch.
// Everything is seeded with rng() so the picture never changes between builds.
// ======================================================================

// ---------- small painting helpers ----------
const P = pts => g => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
const fill = (g, p, col) => { p(g); g.fillStyle = col; g.fill(); };
function glow(g, x, y, r, col, a, r0 = 0){
  const gr = g.createRadialGradient(x, y, r0, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}
function vband(g, y0, y1, col, a0, a1, a2){
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, rgba(col, a0)); gr.addColorStop(.5, rgba(col, a1)); gr.addColorStop(1, rgba(col, a2));
  g.fillStyle = gr; g.fillRect(0, y0, W, y1 - y0);
}
/** Soft silhouette: flat dark fill plus a thin rim light on the top edge and the moon-facing side (dir = +1 when the moon is to the right). */
function sil(g, p, col, rim, dir = -1, a = .5, w = 2.4){
  fill(g, p, col);
  g.save(); p(g); g.clip(); g.translate(-dir * w * .5, w * .7); p(g); g.strokeStyle = rgba(rim, a); g.lineWidth = w; g.lineJoin = 'round'; g.stroke(); g.restore();
}
/** Thick rim-lit stroke (branches, masts, posts). */
function limb(g, p, col, rim, w, dir = -1, a = .45){
  p(g); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
  // a light stroke shifted toward the moon, then a dark re-stroke shifted away, leaves the rim on the lit edge only
  g.save(); g.translate(dir * w * .28, -w * .22); p(g); g.strokeStyle = rgba(rim, a); g.lineWidth = Math.max(.8, w * .32); g.stroke(); g.restore();
  g.save(); g.translate(-dir * w * .1, w * .18); p(g); g.strokeStyle = col; g.lineWidth = w * .55; g.stroke(); g.restore();
}
/** Rolling ridge silhouette with a faint lit crest. */
function ridge(g, y, amp, col, rim, f = .011, ph = 0, x0 = 0, x1 = W){
  const path = g2 => { g2.beginPath(); g2.moveTo(x0, y + 90); for (let x = x0; x <= x1; x += 6) g2.lineTo(x, y - Math.sin(x * f + ph) * amp - Math.sin(x * f * 2.6 + ph * 1.7) * amp * .4); g2.lineTo(x1, y + 90); g2.closePath(); };
  if (rim){ g.save(); g.translate(0, -1.6); fill(g, path, rim); g.restore(); }
  fill(g, path, col);
}
function stars(g, R, n, y1, col = '#ffffff'){
  for (let i = 0; i < n; i++){ const x = R() * W, y = R() * y1, r = .35 + R() * .8; g.fillStyle = rgba(col, .2 + R() * .45); ell(g, x, y, r, r); }
  for (let i = 0; i < 4; i++){ const x = R() * W, y = R() * y1 * .9, s = 2 + R() * 2; g.fillStyle = rgba(col, .55); g.fillRect(x - s, y - .5, s * 2, 1); g.fillRect(x - .5, y - s, 1, s * 2); }
}
function moon(g, x, y, r, col, halo, o = {}){
  glow(g, x, y, r * (o.haloR ?? 3.2), halo, o.haloA ?? .26, r * .55);
  if (o.ring){ g.strokeStyle = rgba(halo, .12); g.lineWidth = r * .5; g.beginPath(); g.arc(x, y, r * 2.2, 0, TAU); g.stroke(); }
  const gr = g.createRadialGradient(x - r * .3, y - r * .3, r * .05, x, y, r);
  gr.addColorStop(0, mix(col, '#ffffff', .4)); gr.addColorStop(.65, col); gr.addColorStop(1, mix(col, halo, .45));
  g.fillStyle = gr; ell(g, x, y, r, r);
  const R = rng(x * 3 + y | 0); g.fillStyle = rgba(mix(col, halo, .8), .35);
  for (let i = 0; i < 7; i++){ const a = R() * TAU, d = R() * r * .68, cr = r * (.07 + R() * .15); ell(g, x + Math.cos(a) * d, y + Math.sin(a) * d, cr, cr * .85); }
  g.fillStyle = 'rgba(255,255,255,.18)'; ell(g, x - r * .35, y - r * .4, r * .32, r * .18, -.6);
}
/** Thin soft cloud streak. */
function cloud(g, x, y, w, h, col, a){
  const gr = g.createRadialGradient(x, y, 0, x, y, w); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(.6, rgba(col, a * .5)); gr.addColorStop(1, rgba(col, 0));
  g.save(); g.translate(x, y); g.scale(1, h / w); g.translate(-x, -y); g.fillStyle = gr; ell(g, x, y, w, w); g.restore();
}
function spark(g, x, y, s, col, a){ g.fillStyle = rgba(col, a); g.fillRect(x - s, y - .6, s * 2, 1.2); g.fillRect(x - .6, y - s, 1.2, s * 2); }
function bat(g, x, y, s, col){
  g.beginPath(); g.moveTo(x - 6 * s, y); g.quadraticCurveTo(x - 3 * s, y - 4 * s, x, y - 1.2 * s); g.quadraticCurveTo(x + 3 * s, y - 4 * s, x + 6 * s, y);
  g.quadraticCurveTo(x + 3 * s, y + .6 * s, x + 1.5 * s, y + 2.4 * s); g.lineTo(x, y + 1.4 * s); g.lineTo(x - 1.5 * s, y + 2.4 * s); g.quadraticCurveTo(x - 3 * s, y + .6 * s, x - 6 * s, y); g.closePath();
  g.fillStyle = col; g.fill();
}
function bird(g, x, y, s, col){ g.strokeStyle = col; g.lineWidth = 1.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 5 * s, y); g.quadraticCurveTo(x - 2.5 * s, y - 3 * s, x, y); g.quadraticCurveTo(x + 2.5 * s, y - 3 * s, x + 5 * s, y); g.stroke(); }
function reeds(g, R, x, n, hMin, hMax, col, rim, heads = true){
  for (let i = 0; i < n; i++){
    const bx = x + (R() - .5) * 28, h = hMin + R() * (hMax - hMin), lean = (R() - .5) * 14, y0 = FIELD_TOP - 2 + R() * 6;
    const p = g2 => { g2.beginPath(); g2.moveTo(bx, y0); g2.quadraticCurveTo(bx + lean * .3, y0 - h * .55, bx + lean, y0 - h); };
    p(g); g.strokeStyle = col; g.lineWidth = 1.6; g.lineCap = 'round'; g.stroke();
    if (heads && R() < .5){ g.fillStyle = col; ell(g, bx + lean, y0 - h + 4, 2.1, 6); g.fillStyle = rgba(rim, .35); ell(g, bx + lean - .7, y0 - h + 2.5, .8, 3.5); }
  }
}

// ---------- the sky ----------
function sky(g, w, R, hz, mx, my, mr, world){
  let gr = g.createLinearGradient(0, 0, 0, hz + 30);
  gr.addColorStop(0, w.sky[0]); gr.addColorStop(.5, w.sky[1]); gr.addColorStop(1, w.sky[2]);
  g.fillStyle = gr; g.fillRect(0, 0, W, hz + 30);
  // warm/cool haze pooling at the horizon
  vband(g, hz - 70, hz + 30, w.sky[2], 0, .35, .7);
  stars(g, R, world === 1 ? 30 : 80, hz - 30, world === 3 ? '#dffff4' : world === 2 ? '#ffd8c8' : '#ffffff');
  moon(g, mx, my, mr, w.moon, w.halo, world === 1 ? { haloR:6, haloA:.42, ring:true } : world === 2 ? { haloR:3.6, haloA:.4 } : world === 3 ? { haloR:4.2, haloA:.3 } : {});
  if (world === 0){ cloud(g, mx + 30, my + 8, 70, 7, '#2a1030', .55); cloud(g, mx - 40, my - 16, 55, 5, '#2a1030', .4); }
  if (world === 2){ cloud(g, mx + 26, my - 10, 80, 8, '#1a0508', .6); cloud(g, mx + 90, my + 22, 90, 6, '#1a0508', .5); }
  if (world === 4){ cloud(g, mx + 40, my + 12, 60, 6, '#2a0c24', .5); for (let i = 0; i < 7; i++) spark(g, mx + (R() - .5) * 150, my + (R() - .5) * 80, 1.5 + R() * 2, '#e8c8ff', .5 + R() * .4); }
}

// ---------- horizon props, one function per theme ----------
const PROPS = [
  // 0 Pumpkin Patch: barn under the harvest moon, a dead tree, a country graveyard and a scarecrow.
  function pumpkinPatch(g, w, R, hz, mx){
    const [far, near] = w.sil, rim = w.rim;
    ridge(g, hz - 26, 9, far, rgba(rim, .12), .009, 1.2);
    ridge(g, hz - 12, 6, mix(far, near, .5), rgba(rim, .1), .017, 2.4);
    // barn with a hayloft door and a lit window, silo beside it
    sil(g, P([[28, hz + 4], [28, hz - 42], [46, hz - 56], [70, hz - 74], [94, hz - 56], [112, hz - 42], [112, hz + 4]]), near, rim, 1, .5);
    sil(g, g2 => { g2.beginPath(); g2.moveTo(114, hz + 6); g2.lineTo(114, hz - 52); g2.arc(124, hz - 52, 10, Math.PI, 0); g2.lineTo(134, hz + 6); g2.closePath(); }, near, rim, 1, .4);
    g.fillStyle = 'rgba(255,190,90,.85)'; g.fillRect(64, hz - 30, 12, 12); glow(g, 70, hz - 24, 16, '#ffb060', .35);
    g.fillStyle = rgba(rim, .12); g.fillRect(60, hz - 58, 20, 3);
    // dead tree reaching toward the moon
    const tx = 205, dir = mx > tx ? 1 : -1;
    limb(g, SO([[tx + 2, hz + 6], [tx, hz - 30], [tx - 6, hz - 62], [tx - 14, hz - 84]]), near, rim, 9, dir, .4);
    limb(g, SO([[tx - 1, hz - 40], [tx - 24, hz - 56], [tx - 34, hz - 72]]), near, rim, 4.5, dir, .4);
    limb(g, SO([[tx - 3, hz - 52], [tx + 16, hz - 70], [tx + 22, hz - 90]]), near, rim, 4, dir, .4);
    limb(g, SO([[tx + 14, hz - 68], [tx + 30, hz - 76]]), near, rim, 2.4, dir, .4);
    limb(g, SO([[tx - 30, hz - 66], [tx - 44, hz - 70]]), near, rim, 2.2, dir, .4);
    limb(g, SO([[tx - 8, hz - 74], [tx - 6, hz - 96], [tx + 2, hz - 104]]), near, rim, 2.6, dir, .4);
    // graveyard: leaning stones and a cross behind a low iron rail
    const stones = [[262, 22, 0], [286, 30, 1], [318, 24, 0], [346, 18, 0], [376, 28, 2]];
    for (const [sx, sh, kind] of stones){
      if (kind === 2){ sil(g, P([[sx - 3, hz + 4], [sx - 3, hz - sh], [sx - 9, hz - sh], [sx - 9, hz - sh - 5], [sx - 3, hz - sh - 5], [sx - 3, hz - sh - 14], [sx + 3, hz - sh - 14], [sx + 3, hz - sh - 5], [sx + 9, hz - sh - 5], [sx + 9, hz - sh], [sx + 3, hz - sh], [sx + 3, hz + 4]]), near, rim, -1, .45); continue; }
      sil(g, g2 => { g2.beginPath(); g2.moveTo(sx - 9, hz + 4); g2.lineTo(sx - 9 + (kind ? 2 : 0), hz - sh + 8); g2.arc(sx + (kind ? 1 : 0), hz - sh + 8, 9, Math.PI, 0); g2.lineTo(sx + 9, hz + 4); g2.closePath(); }, near, rim, -1, .45);
    }
    g.strokeStyle = near; g.lineWidth = 1.6; g.beginPath(); g.moveTo(244, hz - 8); g.lineTo(396, hz - 8); g.stroke();
    for (let x = 246; x <= 396; x += 10){ g.beginPath(); g.moveTo(x, hz + 2); g.lineTo(x, hz - 13); g.stroke(); }
    // scarecrow with a crow
    const sx = 452;
    limb(g, SO([[sx, hz + 4], [sx, hz - 62]]), near, rim, 4, -1, .4);
    sil(g, P([[sx - 22, hz - 44], [sx + 22, hz - 44], [sx + 20, hz - 40], [sx - 20, hz - 40]]), near, rim, -1, .4);
    sil(g, P([[sx - 11, hz - 40], [sx + 11, hz - 40], [sx + 15, hz - 10], [sx + 4, hz - 12], [sx, hz - 4], [sx - 4, hz - 12], [sx - 15, hz - 10]]), near, rim, -1, .4);
    sil(g, E(sx, hz - 54, 8, 8), near, rim, -1, .45);
    sil(g, P([[sx - 13, hz - 60], [sx + 13, hz - 60], [sx + 8, hz - 62], [sx + 5, hz - 76], [sx - 5, hz - 76], [sx - 8, hz - 62]]), near, rim, -1, .45);
    g.fillStyle = 'rgba(255,200,120,.75)'; g.fillRect(sx - 4, hz - 56, 2, 2); g.fillRect(sx + 2, hz - 56, 2, 2);
    bat(g, sx + 30, hz - 50, .9, near);   // crow-ish shape perched in the air
    ridge(g, hz - 2, 3, near, null, .03, 0);
  },
  // 1 Foggy Hollow: reeds, a boardwalk into the mist, hanging lanterns and floating wisps.
  function foggyHollow(g, w, R, hz, mx){
    const [far, near] = w.sil, rim = w.rim;
    // far treeline (spiky) fading into mist
    g.fillStyle = far; g.beginPath(); g.moveTo(0, hz + 40);
    for (let x = 0; x <= W; x += 9){ const h = 26 + Math.sin(x * .05) * 8 + R() * 14; g.lineTo(x, hz - h); g.lineTo(x + 4.5, hz - h + 9); }
    g.lineTo(W, hz + 40); g.closePath(); g.fill();
    vband(g, hz - 40, hz + 4, w.mist, 0, .22, .3);
    // boardwalk running back into the fog
    sil(g, P([[168, hz + 8], [244, hz + 8], [268, hz - 30], [222, hz - 30]]), mix(near, '#5a4a38', .45), rim, -1, .4);
    g.strokeStyle = rgba('#000000', .4); g.lineWidth = 1;
    for (let i = 1; i < 7; i++){ const t = i / 7, y = hz + 8 - 38 * t, x0 = 168 + (222 - 168) * t, x1 = 244 + (268 - 244) * t; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
    for (const [px, py] of [[166, hz + 2], [246, hz + 2], [206, hz - 14], [258, hz - 14], [224, hz - 30], [268, hz - 30]]){ limb(g, SO([[px, py + 6], [px, py - 18]]), near, rim, 3.2, -1, .4); }
    g.strokeStyle = rgba(near, .9); g.lineWidth = 1.2; g.beginPath(); g.moveTo(166, hz - 16); g.quadraticCurveTo(186, hz - 22, 206, hz - 32); g.quadraticCurveTo(216, hz - 40, 224, hz - 48); g.stroke();
    // lantern posts
    for (const lx of [66, 340]){
      limb(g, SO([[lx, hz + 6], [lx, hz - 66]]), near, rim, 4, mx > lx ? 1 : -1, .4);
      limb(g, SO([[lx, hz - 64], [lx + 16, hz - 60]]), near, rim, 3, -1, .4);
      g.strokeStyle = near; g.lineWidth = 1; g.beginPath(); g.moveTo(lx + 16, hz - 60); g.lineTo(lx + 16, hz - 52); g.stroke();
      glow(g, lx + 16, hz - 44, 30, '#ffc070', .45); g.fillStyle = 'rgba(255,205,120,.95)'; rrect(g, lx + 12, hz - 52, 8, 13, 2.5); g.fill();
      g.fillStyle = near; g.fillRect(lx + 11, hz - 54, 10, 2.5); g.fillRect(lx + 12, hz - 40, 8, 2);
      g.fillStyle = 'rgba(255,255,230,.95)'; ell(g, lx + 16, hz - 45, 2, 3.2);
    }
    // willow on the right, curtain of trailing strokes
    limb(g, SO([[470, hz + 6], [474, hz - 30], [486, hz - 60], [500, hz - 72]]), near, rim, 8, -1, .35);
    limb(g, SO([[478, hz - 44], [456, hz - 60], [446, hz - 74]]), near, rim, 4, -1, .35);
    g.strokeStyle = rgba(near, .95); g.lineWidth = 1.3; g.lineCap = 'round';
    for (let i = 0; i < 14; i++){ const x = 440 + i * 6 + R() * 3, y0 = hz - 76 + Math.abs(i - 7) * 2, len = 28 + R() * 30; g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + 3 + R() * 4, y0 + len * .6, x + 1 + R() * 3, y0 + len); g.stroke(); }
    // reed clusters at the water's edge
    for (const [rx, n] of [[24, 8], [128, 7], [300, 6], [402, 9], [518, 8]]) reeds(g, R, rx, n, 18, 48, near, rim);
    // will-o'-wisps drifting over the marsh
    for (let i = 0; i < 6; i++){ const x = 140 + R() * 380, y = hz - 18 - R() * 44, r = 1.6 + R() * 1.6; glow(g, x, y, r * 7, '#9ff5d0', .5); g.fillStyle = 'rgba(230,255,245,.95)'; ell(g, x, y, r, r * 1.15); }
    vband(g, hz - 14, hz + 12, w.mist, 0, .28, .4);
  },
  // 2 Crumbling Keep: the vampire's castle under siege, a blood moon behind the battlements, bats and siege fires.
  function crumblingKeep(g, w, R, hz, mx){
    const [far, near] = w.sil, rim = w.rim;
    ridge(g, hz - 34, 10, far, rgba(rim, .12), .012, .6);
    // siege fires on the horizon
    for (const fx of [40, 500]){ glow(g, fx, hz - 6, 44, '#ff7a30', .4); g.fillStyle = 'rgba(255,170,70,.9)'; for (let i = 0; i < 3; i++){ const x = fx - 8 + i * 8; g.beginPath(); g.moveTo(x - 3, hz - 2); g.lineTo(x, hz - 12 - (i % 2) * 5); g.lineTo(x + 3, hz - 2); g.closePath(); g.fill(); } }
    cloud(g, 60, hz - 60, 40, 12, '#2a1418', .45); cloud(g, 480, hz - 70, 46, 14, '#2a1418', .45);
    const merlons = (x0, x1, y, wd = 8, h = 8) => { for (let x = x0; x + wd <= x1; x += wd * 2) g.rect(x, y - h, wd, h); };
    // left tower (in front of the moon), curtain wall with a breach, central keep, right tower
    sil(g, g2 => { g2.beginPath(); g2.rect(82, hz - 96, 44, 102); merlons.call(null, 82, 126, hz - 96); }, near, rim, 1, .55);
    sil(g, P([[76, hz - 104], [104, hz - 138], [132, hz - 104]]), near, rim, 1, .5);
    sil(g, g2 => { g2.beginPath(); g2.rect(126, hz - 44, 178, 50); g2.rect(340, hz - 44, 82, 50); merlons.call(null, 128, 300, hz - 44); merlons.call(null, 344, 420, hz - 44); }, near, rim, -1, .45);
    sil(g, P([[304, hz + 6], [304, hz - 40], [312, hz - 26], [320, hz - 34], [328, hz - 14], [336, hz - 22], [340, hz - 8], [340, hz + 6]]), near, rim, -1, .4);   // the breach
    glow(g, 322, hz - 8, 26, '#ff8a40', .35);
    for (let i = 0; i < 6; i++){ g.fillStyle = near; ell(g, 296 + R() * 50, hz + 1 + R() * 4, 5 + R() * 4, 3 + R() * 2, R()); }
    sil(g, g2 => { g2.beginPath(); g2.rect(198, hz - 80, 74, 90); merlons.call(null, 198, 272, hz - 80, 9, 10); }, near, rim, -1, .5);
    limb(g, SO([[236, hz - 90], [236, hz - 116]]), near, rim, 2, -1, .4); sil(g, P([[236, hz - 116], [256, hz - 110], [236, hz - 104]]), '#5a1020', rim, -1, .4);
    sil(g, g2 => { g2.beginPath(); g2.rect(420, hz - 70, 40, 76); merlons.call(null, 420, 460, hz - 70); }, near, rim, -1, .5);
    sil(g, P([[414, hz - 78], [440, hz - 108], [466, hz - 78]]), near, rim, -1, .5);
    // arrow slits and windows lit from within
    for (const [x, y, wd, h] of [[96, hz - 76, 3, 11], [110, hz - 60, 3, 11], [214, hz - 62, 3, 12], [234, hz - 50, 4, 14], [254, hz - 62, 3, 12], [438, hz - 54, 3, 11], [170, hz - 30, 3, 9], [260, hz - 26, 3, 9], [380, hz - 30, 3, 9]]){
      glow(g, x + wd / 2, y + h / 2, 10, '#ffa050', .3); g.fillStyle = 'rgba(255,190,110,.95)'; g.fillRect(x, y, wd, h);
    }
    // bats crossing the blood moon
    for (let i = 0; i < 7; i++) bat(g, mx - 30 + R() * 90, hz - 130 + R() * 70, .6 + R() * .7, near);
    ridge(g, hz - 2, 3, near, null, .03, 0);
  },
  // 3 Drowned Marsh: sea to the horizon, a wrecked ship, a broken pier, rocks with a lighthouse and seabirds.
  function drownedMarsh(g, w, R, hz, mx, my, mr){
    const [far, near] = w.sil, rim = w.rim, sea = hz - 44;
    // the sea and the moon's glitter path
    let gr = g.createLinearGradient(0, sea, 0, hz + 10); gr.addColorStop(0, mix(w.sky[2], far, .35)); gr.addColorStop(1, far);
    g.fillStyle = gr; g.fillRect(0, sea, W, hz + 10 - sea);
    g.fillStyle = rgba(w.moon, .25); g.fillRect(0, sea, W, 1.2);
    for (let i = 0; i < 16; i++){ const y = sea + 2 + i * 2.6, sp = 4 + i * 1.6, a = .5 - i * .028; g.fillStyle = rgba(w.moon, Math.max(.05, a)); for (let k = -2; k <= 2; k++){ const x = mx + k * sp + (R() - .5) * 3; g.fillRect(x - 2.5, y, 5, 1); } }
    g.strokeStyle = rgba(rim, .12); g.lineWidth = 1;
    for (let i = 0; i < 12; i++){ const x = R() * W, y = sea + 6 + R() * 34, l = 14 + R() * 30; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 1.5, x + l, y); g.stroke(); }
    // the wreck, listing to port
    sil(g, P([[164, hz + 6], [176, hz - 14], [206, hz - 22], [298, hz - 32], [312, hz - 12], [304, hz + 6]]), near, rim, -1, .45);
    g.strokeStyle = rgba(rim, .14); g.lineWidth = 1; for (let i = 0; i < 3; i++){ g.beginPath(); g.moveTo(180, hz - 8 + i * 5); g.lineTo(300, hz - 20 + i * 5); g.stroke(); }
    limb(g, SO([[244, hz - 22], [252, hz - 60], [258, hz - 86]]), near, rim, 4, -1, .4);
    limb(g, SO([[258, hz - 86], [268, hz - 98]]), near, rim, 2.4, -1, .4);
    limb(g, SO([[232, hz - 66], [280, hz - 74]]), near, rim, 2.6, -1, .4);
    sil(g, P([[254, hz - 70], [278, hz - 74], [274, hz - 60], [282, hz - 46], [266, hz - 50], [258, hz - 38]]), mix(near, '#8a8070', .35), rim, -1, .35);
    g.strokeStyle = rgba(near, .9); g.lineWidth = .9; g.beginPath(); g.moveTo(252, hz - 60); g.lineTo(212, hz - 24); g.moveTo(252, hz - 60); g.lineTo(292, hz - 32); g.stroke();
    // broken pier
    const deck = hz - 30;
    for (const [px, h] of [[344, 30], [372, 30], [400, 22], [428, 30], [456, 14]]) limb(g, SO([[px, hz + 2], [px, hz - h]]), near, rim, 3.4, -1, .4);
    sil(g, P([[338, deck - 4], [388, deck - 4], [388, deck], [338, deck]]), near, rim, -1, .4);
    sil(g, P([[412, deck - 4], [436, deck - 4], [440, deck + 3], [412, deck]]), near, rim, -1, .4);
    sil(g, P([[392, deck - 2], [404, deck - 12], [408, deck + 2]]), near, rim, -1, .4);
    g.strokeStyle = rgba(near, .95); g.lineWidth = 1; g.beginPath(); g.moveTo(344, deck - 14); g.quadraticCurveTo(358, deck - 10, 372, deck - 14); g.stroke();
    // rocks and the lighthouse
    sil(g, SM([[456, hz + 8], [462, hz - 14], [484, hz - 24], [512, hz - 30], [536, hz - 18], [W + 4, hz - 10], [W + 4, hz + 8]]), near, rim, -1, .45);
    sil(g, SM([[500, hz - 30], [498, hz - 82], [512, hz - 82], [514, hz - 30]]), mix(near, '#c8c0b0', .18), rim, -1, .45);
    g.fillStyle = mix(near, '#c8c0b0', .18); g.fillRect(494, hz - 86, 24, 3); g.fillRect(496, hz - 96, 20, 10);
    glow(g, 506, hz - 92, 22, '#ffe08a', .6); g.fillStyle = 'rgba(255,240,180,.95)'; g.fillRect(500, hz - 95, 12, 7);
    gr = g.createLinearGradient(506, 0, 250, 0); gr.addColorStop(0, 'rgba(255,230,150,.16)'); gr.addColorStop(1, 'rgba(255,230,150,0)');
    fill(g, P([[506, hz - 92], [250, hz - 128], [250, hz - 56]]), gr);
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 1.2; for (let i = 0; i < 6; i++){ const x = 458 + i * 14; g.beginPath(); g.moveTo(x, hz - 2 - (i % 2) * 3); g.lineTo(x + 8, hz - 4 - (i % 2) * 3); g.stroke(); }
    for (const [bx, by, s] of [[300, hz - 112, 1], [326, hz - 100, .8], [350, hz - 118, 1.1], [396, hz - 104, .7]]) bird(g, bx, by, s, 'rgba(215,240,240,.7)');
    // wet shore in front (the shoreline itself is drawn by the field on sea levels)
    reeds(g, R, 40, 7, 14, 30, near, rim, false); reeds(g, R, 130, 5, 12, 26, near, rim, false);
    vband(g, hz - 10, hz + 12, w.mist, 0, .16, .28);
  },
  // 4 Witchwood: twisted autumn trees, a witch-hut roof, a bubbling cauldron and leaves on the wind.
  function witchwood(g, w, R, hz, mx){
    const [far, near] = w.sil, rim = w.rim, canopy = mix(near, '#7a1c34', .35);
    ridge(g, hz - 36, 8, far, rgba(rim, .1), .02, .3);
    ridge(g, hz - 22, 6, mix(far, near, .5), rgba(rim, .1), .033, 1.9);
    const tree = (tx, s, dir) => {
      limb(g, SO([[tx + 4 * s, hz + 8], [tx, hz - 26 * s], [tx - 8 * s, hz - 50 * s], [tx - 4 * s, hz - 74 * s]]), near, rim, 10 * s, dir, .4);
      limb(g, SO([[tx - 2 * s, hz - 40 * s], [tx - 26 * s, hz - 54 * s], [tx - 36 * s, hz - 78 * s], [tx - 30 * s, hz - 92 * s]]), near, rim, 5 * s, dir, .4);
      limb(g, SO([[tx - 4 * s, hz - 56 * s], [tx + 22 * s, hz - 66 * s], [tx + 38 * s, hz - 88 * s]]), near, rim, 4.5 * s, dir, .4);
      limb(g, SO([[tx - 4 * s, hz - 74 * s], [tx + 6 * s, hz - 96 * s], [tx - 2 * s, hz - 108 * s]]), near, rim, 3.6 * s, dir, .4);
      limb(g, SO([[tx + 24 * s, hz - 68 * s], [tx + 34 * s, hz - 62 * s]]), near, rim, 2.2 * s, dir, .4);
      for (const [cx, cy, cr] of [[-34, -96, 16], [-10, -104, 18], [16, -96, 15], [36, -92, 13], [4, -84, 14]]) sil(g, SM([[tx + (cx - cr) * s, hz + cy * s], [tx + cx * s, hz + (cy - cr * .9) * s], [tx + (cx + cr) * s, hz + (cy - cr * .1) * s], [tx + (cx + cr * .5) * s, hz + (cy + cr * .7) * s], [tx + (cx - cr * .6) * s, hz + (cy + cr * .6) * s]]), canopy, rim, dir, .35);
      for (let i = 0; i < 5; i++){ const lx = tx + (-30 + i * 16) * s, ly = hz - (88 - Math.abs(i - 2) * 6) * s, len = 8 + R() * 12; g.strokeStyle = rgba(near, .9); g.lineWidth = .9; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 1, ly + len); g.stroke(); g.fillStyle = ['#c9581f', '#a8281f', '#d68a1c'][i % 3]; ell(g, lx + 1, ly + len + 3, 2.4, 3.6, .4); }
    };
    tree(72, .85, 1); tree(506, .7, -1); tree(322, .95, -1);
    // witch hut: crooked pointed roof, a chimney, a lit window
    sil(g, g2 => { g2.beginPath(); g2.moveTo(150, hz + 6); g2.lineTo(158, hz - 34); g2.quadraticCurveTo(178, hz - 62, 190, hz - 92); g2.quadraticCurveTo(196, hz - 60, 224, hz - 34); g2.lineTo(238, hz + 6); g2.closePath(); }, mix(near, '#3a1a3a', .3), rim, -1, .45);
    g.fillStyle = near; g.fillRect(204, hz - 66, 9, 18); g.fillRect(202, hz - 68, 13, 3);
    for (let i = 0; i < 3; i++) cloud(g, 214 + i * 6, hz - 80 - i * 9, 6 + i * 3, 4 + i * 2, '#b8a8c0', .28 - i * .06);
    glow(g, 190, hz - 20, 18, '#ffb050', .4); g.fillStyle = 'rgba(255,190,100,.9)'; g.fillRect(185, hz - 26, 6, 8); g.fillRect(193, hz - 26, 6, 8);
    // cauldron on a fire, green glow and bubbles
    const cx = 412, cy = hz - 12;
    glow(g, cx, cy - 4, 40, '#7dffa0', .35); glow(g, cx, cy + 12, 22, '#ff8a30', .4);
    limb(g, SO([[cx - 12, cy + 12], [cx - 6, cy + 2]]), near, rim, 2.4); limb(g, SO([[cx + 12, cy + 12], [cx + 6, cy + 2]]), near, rim, 2.4); limb(g, SO([[cx, cy + 14], [cx, cy + 4]]), near, rim, 2.4);
    sil(g, SM([[cx - 18, cy - 8], [cx - 16, cy + 6], [cx, cy + 12], [cx + 16, cy + 6], [cx + 18, cy - 8]]), near, rim, -1, .45);
    sil(g, E(cx, cy - 8, 19, 5), mix(near, '#4a4a58', .3), rim, -1, .5);
    g.fillStyle = 'rgba(120,255,160,.85)'; ell(g, cx, cy - 8, 15, 3.4);
    for (let i = 0; i < 4; i++){ const bx = cx - 10 + i * 7, by = cy - 14 - (i % 2) * 8 - i * 3; g.fillStyle = 'rgba(160,255,190,.65)'; ell(g, bx, by, 1.8 + (i % 2), 1.8 + (i % 2)); }
    // leaves on the wind
    for (let i = 0; i < 14; i++){ const x = R() * W, y = hz - 20 - R() * 110; g.fillStyle = rgba(['#c9581f', '#a8281f', '#d68a1c', '#8a3a2a'][i % 4], .45 + R() * .3); ell(g, x, y, 2.6 + R() * 1.6, 1.4 + R(), R() * TAU); }
    ridge(g, hz - 2, 3, near, null, .03, 0);
  },
];

// ---------- the field: 7 soft lanes with a ground texture per theme ----------
const TEX = [
  // 0 turned earth with grass tufts and pebbles
  function earth(g, w, R, top){
    g.strokeStyle = 'rgba(0,0,0,.09)'; g.lineWidth = 2.2; g.lineCap = 'round';
    for (let c = 0; c < COLS; c++) for (const f of [.28, .5, .72]){ const x = GX + c * CS + CS * f; g.beginPath(); g.moveTo(x, top); for (let y = top; y <= FENCE_Y; y += 24) g.quadraticCurveTo(x + (R() - .5) * 5, y + 12, x + (R() - .5) * 1.5, y + 24); g.stroke(); }
    for (let i = 0; i < 44; i++){ const x = GX + R() * COLS * CS, y = top + 14 + R() * (FENCE_Y - top - 24), r = 1.4 + R() * 2; g.fillStyle = 'rgba(0,0,0,.2)'; ell(g, x, y, r, r * .7); g.fillStyle = 'rgba(255,220,190,.09)'; ell(g, x - r * .2, y - r * .35, r * .55, r * .25); }
    tufts(g, R, w.grass, 80, 7, 10, .6);
  },
  // 1 wet peat: sheen, mud clumps and tall reed tufts
  function peat(g, w, R, top){
    for (let i = 0; i < 26; i++){ const x = GX + R() * COLS * CS, y = top + 16 + R() * (FENCE_Y - top - 30), rx = 12 + R() * 26; const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, 'rgba(170,225,215,.11)'); gr.addColorStop(1, 'rgba(170,225,215,0)'); g.save(); g.translate(x, y); g.scale(1, .3); g.translate(-x, -y); g.fillStyle = gr; ell(g, x, y, rx, rx); g.restore(); }
    for (let i = 0; i < 24; i++){ const x = GX + R() * COLS * CS, y = top + 14 + R() * (FENCE_Y - top - 24), r = 2 + R() * 3; g.fillStyle = 'rgba(0,0,0,.2)'; ell(g, x, y, r, r * .55); }
    tufts(g, R, w.grass, 90, 12, 22, .9);
  },
  // 2 flagstones and rubble, two stones per lane so the lanes stay readable
  function flagstones(g, w, R, top){
    const tw = CS / 2, th = 28;
    for (let row = 0, y = top + 6; y < FENCE_Y - 8; y += th, row++){
      for (let c = 0; c < COLS; c++) for (let k = 0; k < 2; k++){
        if (R() < .1) continue;
        const x = GX + c * CS + k * tw, h = Math.min(th, FENCE_Y - 4 - y), tint = R();
        g.fillStyle = tint < .3 ? 'rgba(255,230,220,.06)' : tint < .6 ? 'rgba(255,230,220,.03)' : 'rgba(0,0,0,.05)';
        rrect(g, x + 2, y + 2, tw - 4, h - 4, 4); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 1.2; g.stroke();
        g.strokeStyle = 'rgba(255,230,220,.06)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 5, y + 2.5); g.lineTo(x + tw - 5, y + 2.5); g.stroke();
      }
    }
    for (let i = 0; i < 30; i++){ const x = GX + R() * COLS * CS, y = top + 12 + R() * (FENCE_Y - top - 24), r = 2 + R() * 3.5; g.fillStyle = 'rgba(0,0,0,.26)'; ell(g, x, y + 1, r, r * .7); g.fillStyle = 'rgba(120,100,110,.55)'; ell(g, x, y, r, r * .65, R()); g.fillStyle = 'rgba(255,230,220,.12)'; ell(g, x - r * .25, y - r * .3, r * .45, r * .2); }
    g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1;
    for (let i = 0; i < 8; i++){ let x = GX + R() * COLS * CS, y = top + 20 + R() * (FENCE_Y - top - 40); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++){ x += (R() - .5) * 14; y += 6 + R() * 8; g.lineTo(x, y); } g.stroke(); }
    tufts(g, R, w.grass, 24, 5, 8, .5);
  },
  // 3 wet sand: grains, ripple lines, shells and a wet sheen near the water
  function sand(g, w, R, top){
    vband(g, top, top + 90, '#bfeee0', .1, .04, 0);
    for (let i = 0; i < 380; i++){ const x = GX + R() * COLS * CS, y = top + 6 + R() * (FENCE_Y - top - 10), r = .4 + R() * .8; g.fillStyle = R() < .6 ? 'rgba(255,240,205,.14)' : 'rgba(0,0,0,.16)'; ell(g, x, y, r, r); }
    g.strokeStyle = 'rgba(200,240,230,.1)'; g.lineWidth = 1.2; g.lineCap = 'round';
    for (let i = 0; i < 40; i++){ const x = GX + R() * COLS * CS, y = top + 10 + R() * (FENCE_Y - top - 20), l = 22 + R() * 34; g.beginPath(); g.moveTo(x - l / 2, y); g.quadraticCurveTo(x, y - 3, x + l / 2, y); g.stroke(); }
    for (let i = 0; i < 20; i++){
      const x = GX + R() * COLS * CS, y = top + 16 + R() * (FENCE_Y - top - 30), r = 2.6 + R() * 2.4, rot = R() * TAU;
      g.save(); g.translate(x, y); g.rotate(rot);
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.moveTo(0, 1.5); g.arc(0, 1.5, r, Math.PI, 0); g.closePath(); g.fill();
      g.fillStyle = 'rgba(236,222,190,.7)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, Math.PI, 0); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(120,90,70,.35)'; g.lineWidth = .7; for (let k = 1; k < 4; k++){ const a = Math.PI + k * Math.PI / 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke(); }
      g.restore();
    }
    for (let i = 0; i < 18; i++){ const x = GX + R() * COLS * CS, y = top + 10 + R() * (FENCE_Y - top - 20), r = 1.6 + R() * 2.2; g.fillStyle = 'rgba(0,0,0,.2)'; ell(g, x, y, r, r * .6); g.fillStyle = 'rgba(200,240,230,.16)'; ell(g, x - r * .2, y - r * .25, r * .5, r * .2); }
    tufts(g, R, w.grass, 30, 8, 14, .7);
  },
  // 4 leaf litter and roots between the trees
  function litter(g, w, R, top){
    const cols = ['#c9581f', '#a8281f', '#d68a1c', '#7a3a24', '#b5622a'];
    for (let i = 0; i < 110; i++){
      const x = GX + R() * COLS * CS, y = top + 8 + R() * (FENCE_Y - top - 14), rx = 3.2 + R() * 2.4, rot = R() * TAU, col = cols[i % cols.length];
      g.fillStyle = rgba(col, .18 + R() * .22); ell(g, x, y, rx, rx * .5, rot);
      g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = .6; g.beginPath(); g.moveTo(x - Math.cos(rot) * rx * .8, y - Math.sin(rot) * rx * .8); g.lineTo(x + Math.cos(rot) * rx * .8, y + Math.sin(rot) * rx * .8); g.stroke();
    }
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 7; i++){ const left = i % 2 === 0, y = top + 30 + R() * (FENCE_Y - top - 60), x0 = left ? -4 : W + 4, len = 40 + R() * 70, d = left ? 1 : -1; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 + d * len * .5, y + (R() - .5) * 30, x0 + d * len, y + (R() - .5) * 20); g.stroke(); }
    tufts(g, R, w.grass, 40, 6, 10, .6);
  },
];

/** Grass / reed tufts at the lane edges, small and dark so the lanes stay clean. */
function tufts(g, R, col, n, hMin, hMax, alpha){
  g.lineCap = 'round';
  for (let i = 0; i < n; i++){
    const py = R(), y = FIELD_TOP + 12 + py * (FENCE_Y - FIELD_TOP - 24), s = 0.55 + py * 0.7, h = (hMin + R() * (hMax - hMin)) * s;
    const c = Math.floor(R() * COLS), x = GX + c * CS + (R() < 0.5 ? 5 + R() * 9 : CS - 5 - R() * 9);
    g.strokeStyle = rgba(col, alpha); g.lineWidth = 1.5 * s; g.beginPath();
    g.moveTo(x, y); g.lineTo(x - 3 * s, y - h * .8); g.moveTo(x, y); g.lineTo(x + 1 * s, y - h); g.moveTo(x, y); g.lineTo(x + 4 * s, y - h * .7); g.stroke();
    g.strokeStyle = rgba(mix(col, '#ffffff', .35), alpha * .35); g.lineWidth = .8 * s; g.beginPath(); g.moveTo(x + 1 * s, y - h * .5); g.lineTo(x + 1 * s, y - h); g.stroke();
  }
}

function field(g, w, R, top, world){
  let gr = g.createLinearGradient(0, top, 0, FENCE_Y + 10);
  gr.addColorStop(0, w.ground[0]); gr.addColorStop(1, w.ground[1]);
  g.fillStyle = gr; g.fillRect(0, top, W, FENCE_Y + 10 - top);
  // seven soft lane strips: alternating tone, darker toward each edge
  for (let c = 0; c < COLS; c++){
    const x = GX + c * CS;
    g.fillStyle = c % 2 ? 'rgba(255,235,210,.045)' : 'rgba(0,0,0,.10)'; g.fillRect(x, top, CS, FENCE_Y - top);
    const fur = g.createLinearGradient(x, 0, x + CS, 0);
    fur.addColorStop(0, 'rgba(0,0,0,.2)'); fur.addColorStop(.22, 'rgba(0,0,0,0)'); fur.addColorStop(.78, 'rgba(0,0,0,0)'); fur.addColorStop(1, 'rgba(0,0,0,.2)');
    g.fillStyle = fur; g.fillRect(x, top, CS, FENCE_Y - top);
  }
  g.save(); g.beginPath(); g.rect(0, top, W, FENCE_Y - top); g.clip(); TEX[world](g, w, R, top); g.restore();
  // margins, lane guides, row guides
  g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, top, GX, FENCE_Y - top); g.fillRect(W - GX, top, GX, FENCE_Y - top);
  g.strokeStyle = 'rgba(255,230,200,.11)'; g.lineWidth = 1.5; g.setLineDash([6, 8]);
  for (let c = 0; c <= COLS; c++){ g.beginPath(); g.moveTo(GX + c * CS, top + 4); g.lineTo(GX + c * CS, FENCE_Y); g.stroke(); }
  g.setLineDash([]);
  g.strokeStyle = 'rgba(255,230,200,.04)'; g.lineWidth = 1;
  for (let y = FENCE_Y - CS; y > top + 20; y -= CS){ g.beginPath(); g.moveTo(GX, y); g.lineTo(W - GX, y); g.stroke(); }
  // the horizon casts a soft shadow onto the field; the fence sits in a slightly darker strip
  vband(g, top, top + 34, '#000000', .5, .18, 0);
  vband(g, FENCE_Y - 40, FENCE_Y + 10, '#000000', 0, .12, .3);
  gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(0,0,0,.22)'); gr.addColorStop(.12, 'rgba(0,0,0,0)'); gr.addColorStop(.88, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.22)');
  g.fillStyle = gr; g.fillRect(0, top, W, FENCE_Y - top);
}

// ---------- the pumpkin patch: rounded toy soil cells ----------
function patch(g, w, R){
  const [lt, dk, base] = w.soil;
  let gr = g.createLinearGradient(0, FENCE_Y, 0, H); gr.addColorStop(0, base); gr.addColorStop(1, mix(base, '#000000', .5));
  g.fillStyle = gr; g.fillRect(0, FENCE_Y + 4, W, H - FENCE_Y);
  g.strokeStyle = rgba(lt, .3); g.lineWidth = 3; g.lineCap = 'round';
  for (let r = 0; r <= ROWS; r++){ const y = GY + r * CS - 2; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 30) g.quadraticCurveTo(x + 15, y + (R() * 6 - 3), x + 30, y); g.stroke(); }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
    const x = GX + c * CS + 4, y = GY + r * CS + 4, s = CS - 8, cx = x + s / 2, cy = y + s / 2, alt = (r + c) % 2;
    g.fillStyle = 'rgba(0,0,0,.28)'; rrect(g, x, y + 2.5, s, s, 16); g.fill();
    gr = g.createLinearGradient(0, y, 0, y + s); gr.addColorStop(0, mix(lt, dk, alt ? .22 : .04)); gr.addColorStop(1, mix(dk, base, alt ? .25 : .1));
    g.fillStyle = gr; rrect(g, x, y, s, s, 16); g.fill();
    g.save(); rrect(g, x, y, s, s, 16); g.clip();
    g.strokeStyle = 'rgba(255,240,220,.17)'; g.lineWidth = 2.4; g.save(); g.translate(0, 1.4); rrect(g, x, y, s, s, 16); g.stroke(); g.restore();
    g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 3.5; g.save(); g.translate(0, -1.8); rrect(g, x, y, s, s, 16); g.stroke(); g.restore();
    const dg = g.createRadialGradient(cx, cy + 5, 1, cx, cy + 5, s * .34); dg.addColorStop(0, 'rgba(0,0,0,.3)'); dg.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.translate(cx, cy + 5); g.scale(1, .45); g.translate(-cx, -cy - 5); g.fillStyle = dg; ell(g, cx, cy + 5, s * .34, s * .34); g.restore();
    for (let i = 0; i < 7; i++){ const px = x + 6 + R() * (s - 12), py = y + 6 + R() * (s - 12), pr = .7 + R() * 1.1; g.fillStyle = R() < .7 ? 'rgba(0,0,0,.14)' : 'rgba(255,240,220,.09)'; ell(g, px, py, pr, pr * .7); }
    g.restore();
  }
}

export function buildBg(world){
  bgWorld = world;
  const w = WORLDS[world] || WORLDS[0], t = WORLDS.indexOf(w);
  bg = document.createElement('canvas'); bg.width = Math.round(W * K); bg.height = Math.round(H * K);
  const g = bg.getContext('2d'); g.scale(K, K);
  const hz = FIELD_TOP - 8, R = rng(t * 91 + 7);
  const mx = [136, 92, 118, 110, 140][t], my = hz - [56, 64, 84, 66, 60][t], mr = [32, 20, 40, 28, 26][t];
  sky(g, w, R, hz, mx, my, mr, t);
  PROPS[t](g, w, R, hz, mx, my, mr);
  // the ground the props stand on
  g.fillStyle = w.sil[1]; g.beginPath(); g.moveTo(0, hz + 8); for (let x = 0; x <= W; x += 20) g.lineTo(x, hz - 2 - Math.sin(x * .02 + t) * 2.5); g.lineTo(W, hz + 30); g.lineTo(0, hz + 30); g.closePath(); g.fill();
  field(g, w, R, hz + 4, t);
  patch(g, w, R);
}

/** A cropped painting of a world's sky and horizon (moon and props) for the storybook covers and pop-ups: w × h in css px,
 *  rendered at 2× and cached per theme and aspect. Builds the world background off-screen and restores the current one. */
const sceneCache = new Map();
export function worldScene(theme, w, h){
  const key = `${theme}:${Math.round(w * 100 / h)}`;
  if (sceneCache.has(key)) return sceneCache.get(key);
  const pb = bg, pw = bgWorld;
  buildBg(theme);
  const kx = bg.width / W, sh0 = FIELD_TOP + 22;
  let sw = W, sh = sh0;
  if (w / h > W / sh0) sh = W * h / w; else sw = sh0 * w / h;
  const sx = (W - sw) / 2, sy = sh0 - sh;
  const c = document.createElement('canvas'); c.width = Math.round(w * 2); c.height = Math.round(h * 2);
  c.getContext('2d').drawImage(bg, sx * kx, sy * kx, sw * kx, sh * kx, 0, 0, c.width, c.height);
  bg = pb; bgWorld = pw;
  sceneCache.set(key, c);
  return c;
}
