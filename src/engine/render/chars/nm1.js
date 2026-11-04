// ---------- Nightmare world 1: Pumpkin Patch: Nightmare monsters (Release 4) ----------
// Drawings ported from docs/archive/nightmare-monsters/slime-patch/slime_patch.js (Toy Plastic, docs/ART_BRIEF.md). One entry per monster type;
// the registry NM1 is spread into CHARS in index.js behind `__RELEASE__ >= 4`. Glow and shadowBlur are fine here: every clip is baked by
// render/anim.js and nothing in this file may be painted per frame.

import { E, PL, S, SM, SO, ell, pal, rgba } from '../paint.js';
import { TAU } from '../../util.js';

const cl01 = x => x < 0 ? 0 : x > 1 ? 1 : x, ease = x => { x = cl01(x); return x * x * (3 - 2 * x); };

// ---------- shared helpers ----------
/** A glowing ember dot. */
function ember(g, x, y, r, a = 1, col = '#ff8a2a'){ if (a <= 0) return; g.save(); g.globalAlpha *= a; g.shadowColor = col; g.shadowBlur = r * 4; g.fillStyle = col; ell(g, x, y, r, r); g.fill(); g.shadowBlur = 0; g.fillStyle = '#fff2c0'; ell(g, x, y, r * .45, r * .45); g.fill(); g.restore(); }

// =====================================================================
// 3. The Cinder Rooster: a fat black rooster, singed in the barn fire, comb burning
// =====================================================================
const ROO = pal('#3e3040'), ROOB = pal('#8a3218'), COMB = pal('#e8261c'), BEAK = pal('#f2b232'), LEG = pal('#e8a030'), TAILC = pal('#2a2232');
/** A sickle feather from base to tip with an ember-lit tip. */
function feather(g, bx, by, tx, ty, wd, curl, c){
  const mx = (bx + tx) / 2, my = (by + ty) / 2, dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const p = SM([[bx + nx * wd * .5, by + ny * wd * .5], [mx + nx * (wd + curl), my + ny * (wd + curl)], [tx, ty, 1], [mx + nx * (curl - wd * .2), my + ny * (curl - wd * .2)], [bx - nx * wd * .5, by - ny * wd * .5]], .8);
  S.part(g, p, c, { x:mx, y:my, r:L * .5 }, { flat:true, mat:'skin' });
  g.save(); p(g); g.clip(); const gr = g.createRadialGradient(tx, ty, 0, tx, ty, L * .5); gr.addColorStop(0, 'rgba(255,190,70,.95)'); gr.addColorStop(.35, 'rgba(255,90,20,.65)'); gr.addColorStop(1, 'rgba(255,60,10,0)'); g.fillStyle = gr; g.fillRect(tx - L, ty - L, L * 2, L * 2); g.restore();
  S.stroke(g, SO([[bx, by], [mx + nx * curl * .55, my + ny * curl * .55], [tx, ty]]), { deep:'#6a5a70' }, .9, .6);
}
/** A flame tongue (bake-time gradient + glow). */
function flame(g, x, y, h, wd, sway = 0){ const p = SM([[x - wd, y], [x - wd * .7 + sway * .4, y - h * .5], [x + sway, y - h, 1], [x + wd * .7 + sway * .4, y - h * .5], [x + wd, y]], .8);
  g.save(); g.shadowColor = '#ff8a2a'; g.shadowBlur = 8; const gr = g.createLinearGradient(0, y, 0, y - h); gr.addColorStop(0, 'rgba(255,90,30,.95)'); gr.addColorStop(.55, 'rgba(255,170,50,.95)'); gr.addColorStop(1, 'rgba(255,240,170,.9)'); p(g); g.fillStyle = gr; g.fill(); g.restore(); }
export function rooster(g, P = {}){
  const w = P.walk, ch = P.chew, cr = P.crow, ph = w ?? ch ?? cr ?? 0;
  const sw = w == null ? 0 : Math.sin(w * TAU), peck = ch == null ? 0 : Math.max(0, Math.sin(ch * TAU));
  const k = cr == null ? 0 : cr < .25 ? ease(cr / .25) : cr < .8 ? 1 : 1 - ease((cr - .8) / .2);
  const shake = cr != null && cr > .25 && cr < .8 ? Math.sin(cr * TAU * 7) * 1.2 : 0;
  const bob = w != null ? -Math.abs(Math.sin(w * TAU * 2)) * 2.5 : ch != null ? peck * 3 : -k * 2;
  S.shadow(g, 0, 51, 34, 6);
  g.save(); g.translate(shake, 0);
  // legs: scaly yellow, three toes with talons and a back spur
  for (const s of [-1, 1]){
    const lp = w == null ? 0 : w * TAU + (s < 0 ? 0 : Math.PI), lift = w == null ? 0 : Math.max(0, Math.sin(lp)) * 7, dx = w == null ? 0 : Math.cos(lp) * 3;
    const ax = s * 13 + dx, ay = 46 - lift;
    S.tube(g, SO([[s * 10, 28], [ax - s * .5, 37 - lift * .5], [ax, ay]]), LEG, 4.8);
    for (let i = 0; i < 3; i++) S.ln(g, [[ax - 2 - s * .3 * i, 36 + i * 3 - lift * .4], [ax + 2 - s * .3 * i, 37 + i * 3 - lift * .4]], LEG, .8, .5);
    S.claw(g, ax - s * 2, ay - 5, s > 0 ? Math.PI + .5 : -.5, 4.5, '#4a3a3a');
    for (const d of [-1, 0, 1]){ const tx = ax + d * 7, ty = ay + 3.5 - Math.abs(d); S.tube(g, SO([[ax, ay], [tx, ty]]), LEG, 2.8); S.claw(g, tx + d * 1.2, ty, Math.PI / 2 - d * .9, 3.6, '#3a2a2a'); }
  }
  g.save(); g.translate(0, bob);
  // tail: a fan of sickle feathers behind, spread wider when it crows
  const sp = 1 + k * .32;
  for (const [a0, L, curl] of [[-2.6, 44, -5], [-2.25, 52, -6], [-1.95, 50, -4], [-.54, 44, 5], [-.89, 52, 6], [-1.19, 50, 4]]){
    const a = -Math.PI / 2 + (a0 + Math.PI / 2) * sp + sw * .05;
    feather(g, 0, 8, Math.cos(a) * L, 8 + Math.sin(a) * L, 11, curl, TAILC); }
  // body: plump, black-feathered with a rust breast, feather scallops, singed embers at the hem
  g.save(); g.translate(0, 14); const puff = 1 + k * .1; g.scale(puff, puff); g.translate(0, -14);
  const body = SM([[-24, -8], [-31, 10], [-24, 30], [0, 37], [24, 30], [31, 10], [24, -8], [12, -16], [-12, -16]], .9);
  S.part(g, body, ROO, { x:0, y:12, r:32 }, { mat:'skin', hx:-14, hy:0 });
  const breast = SM([[-16, -6], [-19, 12], [-10, 28], [0, 31], [10, 28], [19, 12], [16, -6], [0, -10]], .9);
  S.part(g, breast, ROOB, { x:0, y:10, r:20 }, { flat:true, mat:'skin', noEdge:true });
  g.save(); body(g); g.clip(); g.lineCap = 'round';
  for (let r = 0; r < 6; r++){ const y = -4 + r * 7; for (let c = -4; c <= 4; c++){ const x = c * 8 + (r % 2 ? 4 : 0);
    g.beginPath(); g.arc(x, y, 4.5, .15 * Math.PI, .85 * Math.PI); g.strokeStyle = rgba(ROO.deep, .55); g.lineWidth = 1.1; g.stroke();
    g.beginPath(); g.arc(x, y - 1, 4.5, .2 * Math.PI, .8 * Math.PI); g.strokeStyle = 'rgba(255,170,100,.2)'; g.lineWidth = .7; g.stroke(); } }
  const gr = g.createLinearGradient(0, 22, 0, 38); gr.addColorStop(0, 'rgba(20,8,4,0)'); gr.addColorStop(1, 'rgba(20,8,4,.7)'); g.fillStyle = gr; g.fillRect(-34, 20, 68, 20);
  g.restore();
  for (const [x, y, r] of [[-14, 31, 1.4], [8, 34, 1.2], [20, 26, 1.1], [-22, 20, 1]]) ember(g, x, y, r, .9);
  g.restore();
  // wings: stubby, ember-tipped; flap on the strut, flare up and out when crowing
  for (const s of [-1, 1]){ const fl = w != null ? Math.max(0, Math.sin(w * TAU * 2)) * .12 : ch != null ? peck * .3 : 0;
    g.save(); g.translate(s * 22, -4); g.rotate(-s * (fl + k * 1.05)); g.translate(-s * 22, 4);
    const wing = SM([[s * 18, -8], [s * 32, -5], [s * 38, 10], [s * 37, 27, 1], [s * 32, 21], [s * 29, 30, 1], [s * 24, 22], [s * 19, 27, 1], [s * 16, 14]], .8);
    S.part(g, wing, ROO, { x:s * 28, y:10, r:18 }, { flat:true, mat:'skin', hx:s * 24, hy:0 });
    S.crease(g, SO([[s * 22, 2], [s * 30, 12], [s * 33, 24]]), ROO, 1.3, .45); S.crease(g, SO([[s * 20, 6], [s * 25, 16], [s * 25, 24]]), ROO, 1.2, .4);
    for (const [x, y] of [[37, 26], [29, 29], [19, 26]]) ember(g, s * x, y - 1, 1.3, .85);
    g.restore(); }
  // head
  const hy = -26 - k * 6 + peck * 10, hs = 1 + peck * .1;
  g.save(); g.translate(0, hy); g.scale(hs, hs); g.rotate(-k * .0);
  // burning comb behind the crown
  const cg = 1 + k * .3, flick = ph * TAU;
  for (const [x, y, r, i] of [[-10, -15, 5, 0], [-4, -20, 6, 1], [3.5, -21, 6.5, 2], [10, -16, 5.2, 3]]){
    flame(g, x * cg, y * cg - r * .8, 9 + k * 6 + Math.sin(flick * (i % 2 ? 2 : 1) + i * 1.7) * 2.5, r * .55, Math.sin(flick + i) * 1.5); }
  for (const [x, y, r] of [[-10, -15, 5], [-4, -20, 6], [3.5, -21, 6.5], [10, -16, 5.2]]) S.part(g, E(x * cg, y * cg, r, r * 1.25), COMB, { x:x * cg, y:y * cg, r }, { mat:'skin' });
  const head = SM([[-17, -6], [-18, 6], [-10, 16], [0, 18], [10, 16], [18, 6], [17, -6], [10, -16], [-10, -16]], .9);
  S.part(g, head, ROO, { x:0, y:0, r:19 }, { mat:'skin', hx:-8, hy:-8 });
  S.contact(g, head, 0, -15, 14, 4, .4);
  // wattle
  for (const s of [-1, 1]) S.part(g, SM([[s * 1, 11], [s * 7, 13], [s * 7, 22], [s * 3.5, 25], [s * 1, 20]], .9), COMB, { x:s * 4, y:17, r:6 }, { flat:true, mat:'skin' });
  // eyes: angry, ember-orange irises; squeezed shut while it crows
  if (k > .5){ for (const s of [-1, 1]) S.stroke(g, SO([[s * 13, -1], [s * 8, -5], [s * 3, -1.5]]), { deep:'#120a12' }, 2.4, .95); }
  else for (const s of [-1, 1]) S.eye(g, s * 8, -2, 6.8, 7.2, { lx:-s * .1, ly:.2, pr:.36, iris:'#ff5a1a', lid:.3, tilt:s * -.45, lidCol:ROO.base, lidDeep:ROO.deep });
  for (const s of [-1, 1]) S.ln(g, [[s * 16, -11 - k * 2], [s * 2.5, -6.5]], { deep:'#120a12' }, 3, .9);
  // beak: opens on each peck, gapes wide when crowing
  const o = Math.max(peck * .7, k);
  S.dot(g, SM([[-4.5, 5], [4.5, 5], [3, 8 + o * 8], [0, 10 + o * 10], [-3, 8 + o * 8]], .8), '#3a0a10');
  if (o > .1) S.dot(g, E(0, 7 + o * 7, 2.4, 1.6 + o), '#d83a4a', .8);
  S.part(g, PL([[-4.5, 6 + o * 6], [4.5, 6 + o * 6], [0, 12 + o * 9]]), BEAK, { x:0, y:8 + o * 6, r:5 }, { flat:true, lw:1 });
  S.part(g, PL([[-6, 2.5], [6, 2.5], [0, 12 - o * 4]]), BEAK, { x:0, y:5, r:6 }, { lw:1, hx:-2, hy:4 });
  g.restore();
  g.restore(); g.restore();
}

// ---------- registry ----------
const C = (n, fps, key, once = false) => ({ n, fps, once, pose:t => ({ [key]:t }) });
export const NM1 = {
  // small and quick: r 20, so the feet sit at 19 below the centre (50 x .6 - 11); the archive drew it for r 18 at scale .56
  rooster: { draw:rooster, scale:.6, dy:-11, box:{ x:-60, y:-84, w:120, h:142 }, clips:{ walk:C(8, 12, 'walk'), chew:C(4, 10, 'chew'), crow:C(10, 12, 'crow', true) }, still:{} },
};
