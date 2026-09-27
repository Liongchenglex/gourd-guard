// Star costume preview (not in the game yet): three grand directions for the all-stars reward.
const SRC = '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/';
import { pumpkin } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/chars/w1.js';
import { faceFor } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/faces.js';
import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/paint.js';
import { monsterIcon } from '/Users/liongchenglex/Desktop/AI_Projects/gourd-guard/src/engine/render/monsters.js';

const TAU = Math.PI * 2, ease = t => 1 - (1 - t) * (1 - t), clamp01 = t => Math.max(0, Math.min(1, t));
const GOLD = pal('#f2c24a'), WGOLD = pal('#ffe7a0'), VEL = pal('#5a2a8a'), NAVY = pal('#1c2458'), SILV = pal('#dfe4f2'), ERM = pal('#f4f0ea'), RUBY = '#e0304a', SAPH = '#3a7aff', EMER = '#2ac07a';
const starP = (x, y, r, rot = -Math.PI / 2, k = .45, n = 5) => g => { g.beginPath(); for (let i = 0; i < n * 2; i++){ const a = rot + i * Math.PI / n, rr = i % 2 ? r * k : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
const fstar = (g, x, y, r, rot, col, k = .45) => { starP(x, y, r, rot, k)(g); g.fillStyle = col; g.fill(); };
const sparkle = (g, x, y, r, a) => { g.save(); g.globalAlpha = a; g.fillStyle = '#fffbe8'; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r * .3, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r * .3, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); g.beginPath(); g.moveTo(x - r * .7, y); g.quadraticCurveTo(x, y, x, y - r * .22); g.quadraticCurveTo(x, y, x + r * .7, y); g.quadraticCurveTo(x, y, x, y + r * .22); g.quadraticCurveTo(x, y, x - r * .7, y); g.fill(); g.restore(); };
const glowStar = (g, x, y, r, c = GOLD) => { g.save(); g.shadowColor = 'rgba(255,220,120,.9)'; g.shadowBlur = r * 1.6; fstar(g, x, y, r, -Math.PI / 2, c.light); g.restore(); S.part(g, starP(x, y, r), c, { x, y, r }, { mat:'metal', flat:true }); S.dot(g, E(x - r * .18, y - r * .2, r * .16, r * .12), 'rgba(255,255,255,.85)'); };

// ---------- A: Crown of Stars ----------
const A = { key:'A', name:'Crown of Stars', tag:'Regal', desc:'A towering gold crown of five star-tipped spires over royal velvet and ermine, a great star jewel at its heart. It glows on every pumpkin in the patch.',
  hitName:'Supernova', hitDesc:'A white-gold flash, a shockwave ring, eight shooting stars flung outward and a shower of twinkling stars falling after.',
  draw(g, R){ grow(g, R, 1.35, () => this.paint(g, R)); },
  paint(g, R){
    g.save(); g.translate(0, -R * 1.35); for (let i = 0; i < 14; i++){ const a = i / 14 * TAU, w = i % 2 ? .07 : .12, L = i % 2 ? R * .95 : R * 1.3; const lg = g.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L); lg.addColorStop(0, 'rgba(255,228,140,.55)'); lg.addColorStop(1, 'rgba(255,228,140,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - w) * L, Math.sin(a - w) * L); g.lineTo(Math.cos(a + w) * L, Math.sin(a + w) * L); g.closePath(); g.fill(); } g.restore();
    g.save(); const gl = g.createRadialGradient(0, -R * 1.2, 0, 0, -R * 1.2, R * 1.1); gl.addColorStop(0, 'rgba(255,225,130,.45)'); gl.addColorStop(1, 'rgba(255,225,130,0)'); g.fillStyle = gl; g.fillRect(-R * 1.3, -R * 2.4, R * 2.6, R * 2.2); g.restore();
    S.part(g, E(0, -R * 1.08, R * .62, R * .36), VEL, { x:0, y:-R * 1.1, r:R * .6 }, { mat:'cloth', hx:-R * .2, hy:-R * 1.3 });   // velvet cap
    const tips = [[-R * .68, -R * 1.28, R * .12], [-R * .36, -R * 1.52, R * .15], [0, -R * 1.78, R * .24], [R * .36, -R * 1.52, R * .15], [R * .68, -R * 1.28, R * .12]];
    const pts = [[-R * .78, -R * .96]]; tips.forEach(([x, y], i) => { pts.push([x - R * .08, y + R * .28]); pts.push([x, y + R * .08]); pts.push([x + R * .08, y + R * .28]); if (i < 4) pts.push([(x + tips[i + 1][0]) / 2, -R * 1.04]); }); pts.push([R * .78, -R * .96]);
    S.part(g, PL(pts), GOLD, { x:0, y:-R * 1.2, r:R * .8 }, { mat:'metal', hx:-R * .3, hy:-R * 1.4 });
    S.part(g, RR(-R * .8, -R * 1.0, R * 1.6, R * .26, R * .08), GOLD, { x:0, y:-R * .88, r:R * .8 }, { mat:'metal', flat:true });   // band
    [[-R * .5, SAPH], [0, RUBY], [R * .5, EMER]].forEach(([x, c]) => { S.dot(g, E(x, -R * .87, R * .085, R * .07), c); S.dot(g, E(x - R * .025, -R * .9, R * .03, R * .02), 'rgba(255,255,255,.9)'); });
    S.part(g, RR(-R * .84, -R * .78, R * 1.68, R * .16, R * .08), ERM, { x:0, y:-R * .7, r:R * .84 }, { mat:'cloth', flat:true });   // ermine trim
    for (let i = -3; i <= 3; i++) S.dot(g, E(i * R * .23, -R * .7, R * .025, R * .045), '#1a1420');
    tips.forEach(([x, y, r]) => glowStar(g, x, y, r));
    S.dot(g, E(0, -R * 1.78, R * .08, R * .08), RUBY);
  },
  idle(g, R, t){ const a = .5 + .5 * Math.sin(t * 3); sparkle(g, R * .12, -R * 1.9, R * .22 * (.6 + a * .6), .5 + a * .5); sparkle(g, -R * .72, -R * 1.42, R * .12 * (1.2 - a * .5), 1 - a * .6); },
  hit(g, t){ const R = rng(7);
    const fl = clamp01(1 - t * 3); if (fl > 0){ const gr = g.createRadialGradient(0, 0, 0, 0, 0, 46); gr.addColorStop(0, `rgba(255,255,240,${fl})`); gr.addColorStop(.4, `rgba(255,220,120,${fl * .8})`); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 46, 0, TAU); g.fill(); }
    g.strokeStyle = `rgba(255,226,140,${1 - t})`; g.lineWidth = 5 * (1 - t) + .5; g.beginPath(); g.arc(0, 0, 10 + 72 * ease(t), 0, TAU); g.stroke();
    for (let i = 0; i < 8; i++){ const a = i / 8 * TAU + .2, d = 12 + 86 * ease(t), x = Math.cos(a) * d, y = Math.sin(a) * d, al = 1 - t;
      const lg = g.createLinearGradient(x * .35, y * .35, x, y); lg.addColorStop(0, 'rgba(255,230,150,0)'); lg.addColorStop(1, `rgba(255,240,190,${al})`); g.strokeStyle = lg; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x * .35, y * .35); g.lineTo(x, y); g.stroke();
      fstar(g, x, y, 6 * (1 - t * .5), t * 6 + i, rgba('#fff3c0', al)); }
    const cs = t < .25 ? t / .25 : 1 - (t - .25) / .75; fstar(g, 0, 0, 22 * cs, t * 3, rgba('#fff6d0', cs), .42);
    for (let i = 0; i < 14; i++){ const st = .25 + R() * .3; if (t < st) continue; const f = (t - st) / (1 - st), x = (R() - .5) * 110, y = -40 + R() * 30 + f * f * 80; fstar(g, x, y, 2.5 + R() * 3, f * 8, rgba(R() > .5 ? '#ffe7a0' : '#ffffff', 1 - f)); }
  } };

// ---------- B: Celestial Halo and Starry Mantle ----------
const B = { key:'B', name:'Celestial Mantle', tag:'Heavenly', desc:'A floating golden halo ringed with little stars above a night-sky mantle full of stars and a gold-hemmed collar, like the sky itself is wearing your pumpkin.',
  hitName:'Comet strike', hitDesc:'A comet streaks down onto the target and bursts into a spinning star-shaped shockwave, with stars scattering out of the blast.',
  draw(g, R){
    for (const s of [-1, 1]){ const c = SM([[s * R * .2, R * .2], [s * R * 1.2, R * .35], [s * R * 1.5, -R * .2], [s * R * 1.42, -R * 1.15], [s * R * 1.0, -R * .75], [s * R * .6, -R * .95], [s * R * .42, -R * .35]], .8);
      S.part(g, c, NAVY, { x:s * R * .8, y:-R * .3, r:R * .7 }, { mat:'cloth' });
      g.save(); c(g); g.clip(); const r = rng(s > 0 ? 5 : 9); for (let i = 0; i < 16; i++){ const x = s * R * (.3 + r() * 1.05), y = -R * .75 + r() * R * .9; fstar(g, x, y, R * (.03 + r() * .045), r() * 3, rgba('#fff3c0', .6 + r() * .4)); } g.restore();
      S.stroke(g, SO([[s * R * .28, R * .2], [s * R * 1.2, R * .35], [s * R * 1.5, -R * .2], [s * R * 1.42, -R * 1.15]]), GOLD, 2.6); glowStar(g, s * R * 1.42, -R * 1.2, R * .12, WGOLD); }
    S.part(g, E(0, R * .32, R * .16, R * .14), GOLD, { x:0, y:R * .32, r:R * .16 }, { flat:true, mat:'metal' }); fstar(g, 0, R * .32, R * .09, -Math.PI / 2, '#fff6d0');
    g.save(); g.shadowColor = 'rgba(255,220,120,.95)'; g.shadowBlur = R * .5; g.strokeStyle = GOLD.light; g.lineWidth = R * .16; ell(g, 0, -R * 1.62, R * .78, R * .21); g.stroke(); g.restore();
    g.strokeStyle = GOLD.base; g.lineWidth = R * .1; ell(g, 0, -R * 1.62, R * .78, R * .21); g.stroke(); g.strokeStyle = 'rgba(255,255,240,.9)'; g.lineWidth = R * .035; ell(g, 0, -R * 1.64, R * .6, R * .19); g.stroke();
    for (let i = 0; i < 7; i++){ const a = Math.PI + i / 6 * Math.PI; glowStar(g, Math.cos(a) * R * .78, -R * 1.62 + Math.sin(a) * R * .21 - R * .06, R * .1, WGOLD); }
  },
  idle(g, R, t){ for (let i = 0; i < 3; i++){ const a = t * 1.4 + i * TAU / 3; if (Math.sin(a) < 0) continue; sparkle(g, Math.cos(a) * R * .78, -R * 1.62 + Math.sin(a) * R * .21, R * .16, Math.sin(a)); } },
  hit(g, t){ const R = rng(11);
    if (t < .28){ const f = t / .28, x = 70 - 70 * f, y = -90 + 90 * f; const lg = g.createLinearGradient(x + 50, y - 60, x, y); lg.addColorStop(0, 'rgba(160,190,255,0)'); lg.addColorStop(1, 'rgba(255,245,210,1)'); g.strokeStyle = lg; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 50, y - 60); g.lineTo(x, y); g.stroke(); fstar(g, x, y, 9, f * 8, '#fffbe8'); return; }
    const f = (t - .28) / .72, fl = clamp01(1 - f * 4);
    if (fl > 0){ const gr = g.createRadialGradient(0, 0, 0, 0, 0, 40); gr.addColorStop(0, `rgba(230,240,255,${fl})`); gr.addColorStop(1, 'rgba(150,180,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 40, 0, TAU); g.fill(); }
    starP(0, 0, 14 + 70 * ease(f), f * 1.5, .5)(g); g.strokeStyle = `rgba(255,236,160,${1 - f})`; g.lineWidth = 4 * (1 - f) + .5; g.stroke();
    starP(0, 0, 8 + 40 * ease(f), -f * 2, .5)(g); g.strokeStyle = `rgba(170,200,255,${(1 - f) * .8})`; g.lineWidth = 2.5 * (1 - f) + .3; g.stroke();
    for (let i = 0; i < 5; i++){ const a = i / 5 * TAU + f * 2, d = 16 + 60 * ease(f); fstar(g, Math.cos(a) * d, Math.sin(a) * d, 7 * (1 - f * .6), f * 6, rgba('#ffe7a0', 1 - f)); }
    for (let i = 0; i < 16; i++){ const a = R() * TAU, sp = 30 + R() * 60, x = Math.cos(a) * sp * f, y = Math.sin(a) * sp * f + f * f * 30; sparkle(g, x, y, 3 + R() * 3, 1 - f); }
  } };

// ---------- C: Moon Queen's Diadem ----------
const C = { key:'C', name:"Moon Queen's Diadem", tag:'Mystic', desc:'A silver crescent moon rising from a fine gold circlet, three star charms swinging on chains and a violet gem at the brow. Quiet, rare and unmistakable.',
  hitName:'Constellation', hitDesc:'Six stars flare around the target, gold lines draw a constellation between them, then a crescent slash sweeps through and it all twinkles out.',
  draw(g, R){ grow(g, R, 1.3, () => this.paint(g, R)); },
  paint(g, R){
    g.save(); const gl = g.createRadialGradient(0, -R * 1.45, 0, 0, -R * 1.45, R * .9); gl.addColorStop(0, 'rgba(200,215,255,.45)'); gl.addColorStop(1, 'rgba(200,215,255,0)'); g.fillStyle = gl; g.fillRect(-R, -R * 2.4, R * 2, R * 1.9); g.restore();
    const moon = g2 => { g2.beginPath(); g2.arc(0, -R * 1.42, R * .5, Math.PI * .15, Math.PI * .85, true); g2.arc(0, -R * 1.62, R * .42, Math.PI * .78, Math.PI * .22, false); g2.closePath(); };
    g.save(); g.shadowColor = 'rgba(210,225,255,.95)'; g.shadowBlur = R * .45; g.fillStyle = SILV.light; moon(g); g.fill(); g.restore();
    { const mg = g.createLinearGradient(-R * .5, -R * 1.9, R * .5, -R * 1.1); mg.addColorStop(0, '#ffffff'); mg.addColorStop(.5, '#e8eeff'); mg.addColorStop(1, '#a8b4e0'); g.fillStyle = mg; moon(g); g.fill(); g.strokeStyle = 'rgba(120,130,190,.8)'; g.lineWidth = 1.2; moon(g); g.stroke(); }
    S.part(g, RR(-R * .78, -R * .98, R * 1.56, R * .14, R * .07), GOLD, { x:0, y:-R * .9, r:R * .78 }, { mat:'metal', flat:true });
    S.part(g, SM([[-R * .16, -R * .98], [0, -R * 1.2], [R * .16, -R * .98], [0, -R * .82]], .7), GOLD, { x:0, y:-R * .98, r:R * .2 }, { mat:'metal', flat:true });
    S.dot(g, E(0, -R * .98, R * .09, R * .12), '#9a4aff'); S.dot(g, E(-R * .03, -R * 1.03, R * .03, R * .04), 'rgba(255,255,255,.9)');
    for (const [x, len] of [[-R * .55, R * .38], [-R * .3, R * .22], [R * .55, R * .38]]){ g.strokeStyle = GOLD.light; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, -R * .9); g.lineTo(x, -R * .9 + len); g.stroke(); glowStar(g, x, -R * .9 + len + R * .08, R * .09, WGOLD); }
    fstar(g, R * .42, -R * 1.9, R * .07, 0, '#fffbe8'); fstar(g, -R * .5, -R * 1.72, R * .05, .5, '#fffbe8');
  },
  idle(g, R, t){ sparkle(g, R * .42, -R * 1.9, R * .16 * (.7 + .5 * Math.sin(t * 2.6)), .9); sparkle(g, -R * .2, -R * 1.2, R * .12 * (.6 + .5 * Math.sin(t * 3.3 + 1)), .8); },
  hit(g, t){ const pts = [[-40, -26], [-14, -44], [16, -30], [38, -8], [18, 20], [-26, 14]];
    const on = clamp01(t / .15), draw = clamp01((t - .1) / .4), out = clamp01((t - .65) / .35);
    g.save(); g.globalAlpha = 1 - out; g.strokeStyle = 'rgba(255,226,140,.9)'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); const n = draw * (pts.length - 1);
    for (let i = 0; i <= Math.floor(n); i++){ const [x, y] = pts[i]; i ? g.lineTo(x, y) : g.moveTo(x, y); } const i0 = Math.floor(n); if (i0 < pts.length - 1){ const f = n - i0, [ax, ay] = pts[i0], [bx, by] = pts[i0 + 1]; g.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f); } g.stroke(); g.restore();
    pts.forEach(([x, y], i) => { const tw = .7 + .3 * Math.sin(t * 30 + i * 2); fstar(g, x, y, 6 * on * tw * (1 - out * .7), i, rgba('#fff3c0', 1 - out)); sparkle(g, x, y, 9 * on * (1 - out), (1 - out) * tw); });
    if (t > .45 && t < .9){ const f = (t - .45) / .45; g.save(); g.rotate(-.6 + f * 1.2); g.strokeStyle = `rgba(220,230,255,${1 - f})`; g.lineWidth = 6 * (1 - f) + 1; g.beginPath(); g.arc(0, 0, 44, -Math.PI * .8, -Math.PI * .1); g.stroke(); g.restore(); }
    const fl = clamp01(1 - Math.abs(t - .5) * 6); if (fl > 0){ const gr = g.createRadialGradient(0, 0, 0, 0, 0, 36); gr.addColorStop(0, `rgba(235,240,255,${fl})`); gr.addColorStop(1, 'rgba(180,200,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 36, 0, TAU); g.fill(); }
  } };

// ---------- preview cards ----------
const grow = (g, R, k, fn) => { g.save(); g.translate(0, -R * .85); g.scale(k, k); g.translate(0, R * .85); fn(); g.restore(); };
const bake = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d'); g.scale(2, 2); fn(g); return c; };
const wearing = (O, R, lit = true) => bake(R * 3.2, R * 4.4, g => { g.translate(R * 1.6, R * 2.9); pumpkin(g, pal('#6db33f'), lit, R, lit ? faceFor('green') : () => {}); O.draw(g, R); });
const W = 340, H = 330;
function card(O){
  const el = document.createElement('article'); el.className = 'card';
  el.innerHTML = `<div class="tag">${O.tag}</div><h3>${O.key}. ${O.name}</h3>`;
  const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2; cv.style.width = W + 'px'; cv.style.maxWidth = '100%'; el.appendChild(cv);
  el.insertAdjacentHTML('beforeend', `<p>${O.desc}</p><p class="hit"><b>Hit: ${O.hitName}.</b> ${O.hitDesc}</p><div class="small"><span>Shop tile</span><span>In the patch (game size)</span></div>`);
  const row = el.querySelector('.small'); const tileC = wearing(O, 17); tileC.style.width = '54px'; row.children[0].prepend(tileC);
  const patch = document.createElement('canvas'); patch.width = 170 * 2; patch.height = 70 * 2; patch.style.width = '170px'; row.children[1].prepend(patch);
  const R = 26, big = wearing(O, R), fly = wearing(O, 20), ghoul = monsterIcon('ghoul', 110), small = wearing(O, 12, false), smallLit = wearing(O, 12);
  const g = cv.getContext('2d'), pg = patch.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1a1030'); sky.addColorStop(1, '#2a1a1a');
  const t0 = performance.now();
  (function loop(now){
    const t = (now - t0) / 1000; g.setTransform(2, 0, 0, 2, 0, 0); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const T = 2.4, u = t % T, hx = W / 2, hy = 92, HIT = .42;
    const hitOn = u > HIT && u < HIT + .12; g.drawImage(ghoul, hx - 55, hy - 62, 110, 110);
    if (hitOn){ g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .6; g.drawImage(ghoul, hx - 55, hy - 62, 110, 110); g.restore(); }
    [[W * .22, 0], [W * .5, .9], [W * .78, 1.8]].forEach(([x, ph]) => { const b = 1 + Math.sin(t * 2.4 + ph) * .03; g.save(); g.translate(x, H - 22); g.scale(b, 1 / b); g.drawImage(big, -R * 1.6, -R * 2.9 - R, R * 3.2, R * 4.4); g.translate(0, -R); O.idle(g, R, t + ph); g.restore(); });
    if (u < HIT){ const f = u / HIT, e = 1 - (1 - f) * (1 - f), y = H - 40 - (H - 40 - hy) * e; g.save(); g.translate(hx, y); g.rotate(f * 6); g.drawImage(fly, -20 * 1.6, -20 * 2.9, 20 * 3.2, 20 * 4.4); g.restore(); }
    else if (u < HIT + 1.25){ g.save(); g.translate(hx, hy); g.scale(1.3, 1.3); O.hit(g, (u - HIT) / 1.25); g.restore(); }
    pg.setTransform(2, 0, 0, 2, 0, 0); pg.fillStyle = '#3a2718'; pg.fillRect(0, 0, 170, 70);
    for (let i = 0; i < 4; i++){ const img = i < 2 ? smallLit : small, x = 22 + i * 42; pg.drawImage(img, x - 12 * 1.6, 56 - 12 * 2.9, 12 * 3.2, 12 * 4.4); }
    requestAnimationFrame(loop);
  })(t0);
  return el;
}
const box = document.getElementById('opts'); [A, B, C].forEach(O => box.appendChild(card(O)));
