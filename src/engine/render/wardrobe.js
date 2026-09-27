// ---------- Wardrobe art (owner, 2026-09-27): costumes, their hit effects, skins and their flight trails ----------
// Ported from the approved wardrobe preview. Costumes are baked once per costume and scale into a sprite drawn over any pumpkin;
// skins are baked into that colour's pumpkin sprites; hit effects and trails are cheap per-frame fills (no shadow blur).
import { E, PL, RR, S, SM, SO, ell, pal, rgba, rng } from './paint.js';
import { pumpkin } from './chars.js';
import { faceFor } from './faces.js';

const TAU = Math.PI * 2, ease = t => 1 - (1 - t) * (1 - t);
const RIBS = [[-.66, .36, .72], [.62, .4, .74], [-.34, .46, .8], [.3, .48, .82], [-.02, .5, .84]];
const union = (g, R) => { g.beginPath(); for (const [ox, rw, rh] of RIBS) g.ellipse(ox * R * .95, R * .04, rw * R * 1.12, R * rh, 0, 0, TAU); };
const rind = (g, R) => { g.beginPath(); g.rect(-R * 2, -R * 2, R * 4, R * 4); for (const x of [-R * .33, R * .33]) g.ellipse(x, -R * .1, R * .26, R * .28, 0, 0, TAU); g.ellipse(0, R * .3, R * .36, R * .16, 0, 0, TAU); g.clip('evenodd'); union(g, R); g.clip(); };

// ---------- costumes: drawn over the pumpkin, head at about y = -R*0.8 ----------
const HOOD = pal('#4a3a62'), CLOTH = pal('#e8e6f0'), HAT = pal('#2e1a44'), BAND = pal('#7a3ad0'), CAPE = pal('#1a0a14'), LINE = pal('#b0182c'), GOLD = pal('#e6b23a'),
  FIN = pal('#3a9ab0'), PIRATE = pal('#2a1e18'), JEST1 = pal('#d8323c'), JEST2 = pal('#3d6ad0');
const COSTUME_ART = [
  { key:'gravekeeper', name:'Gravekeeper hood', from:'Drops from the Gravekeeper', hit:'A little tombstone bursts up out of the ground with a spray of dirt, green soul wisps and bone chips.',
    draw(g, R){ const p = SM([[-R * .9, -R * .15], [-R * .86, -R * .75], [-R * .4, -R * 1.2], [R * .1, -R * 1.32], [R * .6, -R * 1.12], [R * .92, -R * .7], [R * .9, -R * .12], [R * .6, -R * .42], [0, -R * .55], [-R * .6, -R * .42]], .8);
      S.part(g, p, HOOD, { x:0, y:-R * .75, r:R }, { mat:'cloth', hx:-R * .35, hy:-R * 1.05 }); S.crease(g, SO([[-R * .5, -R * .9], [-R * .62, -R * .35]]), HOOD, 2, .4); S.crease(g, SO([[R * .45, -R * .95], [R * .6, -R * .35]]), HOOD, 2, .4);
      for (const s of [-1, 1]) S.part(g, RR(s * R * .95 - R * .06, -R * .3, R * .12, R * .12, 2), pal('#7a6a56'), { x:s * R * .95, y:-R * .25, r:R * .08 }, { flat:true, mat:'cloth' }); } },
  { key:'poltergeist', name:'Poltergeist sheet', from:'Drops from the Poltergeist', hit:'A cold puff of mist rolls out and two little ghosts drift up, with a hollow whoosh.',
    draw(g, R){ const p = SM([[-R * 1.02, R * .1], [-R * .95, -R * .7], [-R * .4, -R * 1.18], [R * .2, -R * 1.2], [R * .8, -R * .9], [R * 1.02, -R * .2], [R * .98, R * .12, 1], [R * .7, -R * .02, 1], [R * .45, R * .14, 1], [R * .18, -R * .02, 1], [-R * .1, R * .14, 1], [-R * .4, -R * .02, 1], [-R * .7, R * .14, 1]], .7);
      g.save(); g.globalAlpha = .88; S.part(g, p, CLOTH, { x:0, y:-R * .5, r:R * 1.1 }, { mat:'cloth', hx:-R * .4, hy:-R * .95 }); g.restore();
      for (const s of [-1, 1]){ S.dot(g, E(s * R * .3, -R * .35, R * .14, R * .18), '#241a2a'); } S.dot(g, E(0, -R * .05, R * .1, R * .12), '#241a2a'); } },
  { key:'hexwitch', name:'Hexwitch hat', from:'Drops from the Hexwitch', hit:'A purple hex sigil flashes on the target and green sparks spin off it.',
    draw(g, R){ S.part(g, RR(-R * 1.0, -R * .82, R * 2.0, R * .16, R * .08), HAT, { x:0, y:-R * .74, r:R }, { flat:true, mat:'cloth' });
      S.part(g, SM([[-R * .5, -R * .8], [-R * .3, -R * 1.5], [R * .2, -R * 2.05], [R * .55, -R * 1.9], [R * .2, -R * 1.45], [R * .5, -R * .8]], .8), HAT, { x:0, y:-R * 1.3, r:R * .7 }, { mat:'cloth', hx:-R * .2, hy:-R * 1.4 });
      S.part(g, RR(-R * .52, -R * .98, R * 1.04, R * .16, 2), BAND, { x:0, y:-R * .9, r:R * .5 }, { flat:true }); S.part(g, RR(-R * .1, -R * 1.0, R * .2, R * .2, 3), GOLD, { x:0, y:-R * .9, r:R * .1 }, { flat:true, mat:'metal' }); } },
  { key:'vampirecount', name:'Count’s collar', from:'Drops from the Vampire Count', hit:'A burst of bats flaps out of the impact and scatters.',
    draw(g, R){ for (const s of [-1, 1]){ const c = SM([[s * R * .25, R * .1], [s * R * 1.05, -R * .15], [s * R * 1.25, -R * .9], [s * R * .95, -R * .55], [s * R * .6, -R * .75], [s * R * .45, -R * .25]], .6);
        S.part(g, c, CAPE, { x:s * R * .7, y:-R * .35, r:R * .7 }, { mat:'cloth', flat:true }); g.save(); g.translate(s * -R * .08, R * .04); S.stroke(g, SO([[s * R * .5, -R * .3], [s * R * 1.0, -R * .2], [s * R * 1.15, -R * .8]]), LINE, 2.5, .8); g.restore(); }
      S.part(g, E(0, R * .35, R * .16, R * .14), GOLD, { x:0, y:R * .35, r:R * .16 }, { flat:true, mat:'metal' }); S.dot(g, E(0, R * .35, R * .07, R * .07), '#c0182c'); } },
  { key:'twintides', name:'Tide crown', from:'Drops from the Twin Tides', hit:'A splash of seawater bursts up with a flicker of little fish.',
    draw(g, R){ S.part(g, RR(-R * .6, -R * .98, R * 1.2, R * .2, 4), FIN, { x:0, y:-R * .88, r:R * .6 }, { flat:true, mat:'metal' });
      for (let i = -2; i <= 2; i++){ const x = i * R * .24, h = R * (.45 - Math.abs(i) * .08); S.part(g, PL([[x - R * .1, -R * .96], [x, -R * .96 - h], [x + R * .1, -R * .96]]), i % 2 ? FIN : pal('#5fd0c8'), { x, y:-R * 1.1, r:R * .12 }, { flat:true, mat:'gel' }); }
      for (const x of [-R * .36, 0, R * .36]) S.dot(g, E(x, -R * .88, R * .05, R * .05), '#f4f0e0'); } },
  { key:'pirate', name:'Pirate tricorn', from:'Shop costume', hit:'Gold coins and a flash of cannon smoke burst from the hit.',
    draw(g, R){ S.part(g, SM([[-R * 1.05, -R * .8], [-R * .5, -R * 1.25], [0, -R * 1.05], [R * .5, -R * 1.25], [R * 1.05, -R * .8], [R * .5, -R * .7], [0, -R * .78], [-R * .5, -R * .7]], .7), PIRATE, { x:0, y:-R * .95, r:R }, { mat:'leather', hx:-R * .3, hy:-R * 1.05 });
      S.ln(g, [[-R * .8, -R * .82], [R * .8, -R * .82]], GOLD, 2.2, .9); S.dot(g, E(0, -R * 1.0, R * .12, R * .1), '#f4f0e0'); S.dot(g, E(0, -R * .98, R * .04, R * .04), '#241a2a');
      S.part(g, E(R * .33, -R * .1, R * .17, R * .15), PIRATE, { x:R * .33, y:-R * .1, r:R * .17 }, { flat:true }); S.ln(g, [[-R * .7, -R * .4], [R * .8, R * .05]], PIRATE, 1.6, .9); } },
  { key:'jester', name:'Jester’s cap', from:'Shop costume', hit:'Confetti and streamers pop out in every colour.',
    draw(g, R){ S.part(g, RR(-R * .75, -R * .9, R * 1.5, R * .2, 4), GOLD, { x:0, y:-R * .8, r:R * .75 }, { flat:true, mat:'metal' });
      const horn = (s, c) => { S.part(g, SM([[s * R * .1, -R * .88], [s * R * .35, -R * 1.45], [s * R * 1.0, -R * 1.55], [s * R * .55, -R * 1.2], [s * R * .7, -R * .88]], .8), c, { x:s * R * .5, y:-R * 1.2, r:R * .5 }, { mat:'cloth', flat:true }); S.part(g, E(s * R * 1.0, -R * 1.55, R * .12, R * .12), GOLD, { x:s * R, y:-R * 1.55, r:R * .12 }, { flat:true, mat:'metal' }); };
      horn(-1, JEST1); horn(1, JEST2); S.part(g, SM([[-R * .1, -R * .88], [0, -R * 1.7], [R * .1, -R * .88]], .8), JEST1, { x:0, y:-R * 1.3, r:R * .3 }, { flat:true, mat:'cloth' }); S.part(g, E(0, -R * 1.72, R * .12, R * .12), GOLD, { x:0, y:-R * 1.72, r:R * .12 }, { flat:true, mat:'metal' }); } },
];

// ---------- hit effects: t 0..1 at (0,0) ----------
function bird(g, x, y, s, flap, col){ g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(-5, -6 * flap - 2, 0, 0); g.quadraticCurveTo(5, -6 * flap - 2, 10, 0); g.quadraticCurveTo(5, -1, 0, 2); g.quadraticCurveTo(-5, -1, -10, 0); g.fill(); g.restore(); }
function batShape(g, x, y, s, flap){ g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#8a6ad8'; g.beginPath(); g.moveTo(0, -3); g.quadraticCurveTo(-6, -8 - flap * 4, -14, -4 - flap * 6); g.lineTo(-10, 0); g.lineTo(-12, 3); g.lineTo(-6, 1); g.lineTo(0, 4); g.lineTo(6, 1); g.lineTo(12, 3); g.lineTo(10, 0); g.lineTo(14, -4 - flap * 6); g.quadraticCurveTo(6, -8 - flap * 4, 0, -3); g.fill(); g.fillStyle = '#ff4d6d'; ell(g, -2, -2, 1, 1); g.fill(); ell(g, 2, -2, 1, 1); g.fill(); g.restore(); }
const HITS = {
  gravekeeper(g, t){ const R = rng(3), up = ease(Math.min(1, t * 3)), fade = t < .7 ? 1 : (1 - t) / .3;
    // dirt kicked up
    for (let i = 0; i < 10; i++){ const a = -Math.PI * (.1 + R() * .8), d = ease(t) * (18 + R() * 26); g.fillStyle = rgba('#6a4a2a', 1 - t); ell(g, Math.cos(a) * d, 10 + Math.sin(a) * d + t * t * 30, 2.6, 2); g.fill(); }
    // a tombstone bursts up out of the ground
    g.save(); g.globalAlpha = fade; g.translate(0, 14); g.beginPath(); g.rect(-30, -60, 60, 60); g.clip();
    const h = 30 * up; g.fillStyle = '#8a8898'; g.beginPath(); g.moveTo(-11, 0); g.lineTo(-11, -h + 11); g.arc(0, -h + 11, 11, Math.PI, 0); g.lineTo(11, 0); g.closePath(); g.fill();
    g.strokeStyle = '#4a4858'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = '#4a4858'; g.fillRect(-1.5, -h + 7, 3, 12); g.fillRect(-5, -h + 11, 10, 3); g.restore();
    g.fillStyle = rgba('#3a2a1c', fade); ell(g, 0, 15, 18, 4); g.fill();
    // green soul wisps rising and bone chips flying
    for (let i = 0; i < 4; i++){ const x = (i - 1.5) * 12 + Math.sin(t * 8 + i) * 4, y = -8 - ease(t) * (40 + i * 8); const gr = g.createRadialGradient(x, y, 0, x, y, 8); gr.addColorStop(0, `rgba(180,255,150,${.9 * (1 - t)})`); gr.addColorStop(1, 'rgba(120,255,120,0)'); g.fillStyle = gr; g.fillRect(x - 8, y - 8, 16, 16); }
    for (let i = 0; i < 5; i++){ const a = -Math.PI * (.2 + i * .15), d = ease(t) * 44; g.save(); g.translate(Math.cos(a) * d, Math.sin(a) * d + t * t * 20); g.rotate(t * 8 + i); g.globalAlpha = 1 - t; g.fillStyle = '#f0ead8'; g.fillRect(-4, -1.2, 8, 2.4); ell(g, -4, 0, 1.8, 1.8); g.fill(); ell(g, 4, 0, 1.8, 1.8); g.fill(); g.restore(); }
    g.globalAlpha = 1; },
  poltergeist(g, t){ const R = rng(7);
    for (let i = 0; i < 7; i++){ const a = R() * TAU, d = 10 + ease(t) * 34, r = 14 + t * 22; const gr = g.createRadialGradient(Math.cos(a) * d, Math.sin(a) * d * .7, 0, Math.cos(a) * d, Math.sin(a) * d * .7, r); gr.addColorStop(0, `rgba(215,228,245,${.75 * (1 - t)})`); gr.addColorStop(1, 'rgba(210,220,235,0)'); g.fillStyle = gr; g.fillRect(-90, -90, 180, 180); }
    for (const s of [-1, 1]){ const x = s * (10 + t * 18), y = -t * 60; g.globalAlpha = (1 - t) * .9; g.fillStyle = '#f4f6ff'; g.beginPath(); g.arc(x, y, 7, Math.PI, 0); g.lineTo(x + 7, y + 8); g.lineTo(x + 3.5, y + 5); g.lineTo(x, y + 8); g.lineTo(x - 3.5, y + 5); g.lineTo(x - 7, y + 8); g.closePath(); g.fill(); g.fillStyle = '#241a2a'; ell(g, x - 2.5, y - 1, 1.3, 1.8); g.fill(); ell(g, x + 2.5, y - 1, 1.3, 1.8); g.fill(); } g.globalAlpha = 1; },
  hexwitch(g, t){ const r = 16 + ease(Math.min(1, t * 2)) * 26, a = t < .7 ? 1 : (1 - t) / .3;
    g.save(); g.rotate(t * 4); g.globalAlpha = a; g.strokeStyle = '#c07cff'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
    g.beginPath(); for (let i = 0; i < 5; i++){ const an = -Math.PI / 2 + i * TAU * 2 / 5; g.lineTo(Math.cos(an) * r * .8, Math.sin(an) * r * .8); } g.closePath(); g.stroke(); g.restore();
    const R = rng(11); for (let i = 0; i < 10; i++){ const an = R() * TAU + t * 3, d = ease(t) * (30 + R() * 25); g.fillStyle = rgba(i % 2 ? '#8cff5a' : '#e8d4ff', 1 - t); ell(g, Math.cos(an) * d, Math.sin(an) * d, 2.4, 2.4); g.fill(); } g.globalAlpha = 1; },
  vampirecount(g, t){ for (let i = 0; i < 7; i++){ const a = -Math.PI * (.05 + i * .13), d = ease(t) * (50 + (i % 3) * 14); g.globalAlpha = 1 - t * .7; batShape(g, Math.cos(a) * d, Math.sin(a) * d - t * 18, .8 + (i % 2) * .2, Math.sin(t * 36 + i * 2)); } g.globalAlpha = 1;
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 30); gr.addColorStop(0, `rgba(200,20,50,${.5 * (1 - t)})`); gr.addColorStop(1, 'rgba(200,20,50,0)'); g.fillStyle = gr; g.fillRect(-30, -30, 60, 60); },
  twintides(g, t){ const R = rng(5);
    g.fillStyle = rgba('#9fe0f0', .7 * (1 - t)); g.beginPath(); for (let i = 0; i <= 12; i++){ const a = Math.PI + i * Math.PI / 12, h = (14 + (i % 3) * 10) * ease(Math.min(1, t * 1.6)) * (1 - t * .5); g.lineTo(Math.cos(a) * (18 + t * 14), Math.sin(a) * h - 2); } g.closePath(); g.fill();
    for (let i = 0; i < 12; i++){ const a = -Math.PI * (.08 + R() * .84), sp = 30 + R() * 30, x = Math.cos(a) * sp * t, y = Math.sin(a) * sp * t + t * t * 60; g.fillStyle = rgba('#dff4ff', 1 - t); ell(g, x, y, 2.4, 3.2); g.fill(); }
    for (const s of [-1, 1]){ const x = s * t * 40, y = -Math.sin(t * Math.PI) * 38; g.save(); g.translate(x, y); g.rotate(s * (t * 3 - 1.2)); g.globalAlpha = 1 - t * .6; g.fillStyle = '#f0a040'; ell(g, 0, 0, 7, 3.5); g.fill(); g.beginPath(); g.moveTo(-6 * s, 0); g.lineTo(-11 * s, -4); g.lineTo(-11 * s, 4); g.fill(); g.restore(); } g.globalAlpha = 1; },
  pirate(g, t){ const R = rng(9);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 24 + t * 24); gr.addColorStop(0, `rgba(200,190,180,${.5 * (1 - t)})`); gr.addColorStop(1, 'rgba(200,190,180,0)'); g.fillStyle = gr; g.fillRect(-60, -60, 120, 120);
    for (let i = 0; i < 9; i++){ const a = -Math.PI * (.1 + R() * .8), sp = 40 + R() * 30, x = Math.cos(a) * sp * t, y = Math.sin(a) * sp * t + t * t * 70; g.save(); g.translate(x, y); g.scale(Math.cos(t * 20 + i), 1); g.fillStyle = '#ffd35a'; ell(g, 0, 0, 4.5, 4.5); g.fill(); g.strokeStyle = '#b8801a'; g.lineWidth = 1; g.stroke(); g.restore(); } },
  jester(g, t){ const R = rng(13), cols = ['#ff5a4d', '#ffd35a', '#6ab0ff', '#8ee88a', '#d09bff'];
    for (let i = 0; i < 22; i++){ const a = R() * TAU, sp = 30 + R() * 40, x = Math.cos(a) * sp * t, y = Math.sin(a) * sp * t + t * t * 40; g.save(); g.translate(x, y); g.rotate(t * 10 + i); g.globalAlpha = 1 - t * .8; g.fillStyle = cols[i % 5]; g.fillRect(-3, -1.5, 6, 3); g.restore(); }
    for (let i = 0; i < 3; i++){ g.strokeStyle = rgba(cols[i], 1 - t); g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); for (let k = 1; k <= 8; k++){ const f = k / 8; g.lineTo(Math.cos(-2 + i) * 50 * t * f + Math.sin(f * 8) * 5, -40 * t * f + f * f * 20 * t); } g.stroke(); } g.globalAlpha = 1; },
};

// ---------- skins: a body treatment for one colour, plus a flight trail ----------
const SKINS = [
  { key:'candycorn', name:'Candy corn', for:'Yellow', desc:'White tip, yellow middle, orange base, with a sugar sparkle. Its trail is a stream of sprinkles.', base:'#f2c230',
    paint(g, R){ g.save(); rind(g, R); g.fillStyle = 'rgba(255,248,230,.85)'; g.fillRect(-R * 2, -R * 2, R * 4, R * 1.62); g.fillStyle = 'rgba(240,120,30,.8)'; g.fillRect(-R * 2, R * .25, R * 4, R * 2);
      const Rr = rng(4); for (let i = 0; i < 14; i++){ g.fillStyle = 'rgba(255,255,255,.9)'; ell(g, (Rr() - .5) * R * 1.8, (Rr() - .5) * R * 1.4, 1.2, 1.2); g.fill(); } g.restore(); },
    wake:['#fff8e6','#ffd35a','#ff8a2a'],
    part(g, x, y, f, i){ g.save(); g.translate(x, y); g.rotate(f * 9 + i); g.fillStyle = ['#ff5a8a', '#ffd35a', '#6ab0ff', '#ffffff', '#8ee88a'][i % 5]; g.fillRect(-3.5, -1.2, 7, 2.4); g.restore(); } },
  { key:'magma', name:'Magma', for:'Fire', desc:'The red rind cracks open over glowing lava, with patches of cooled crust. Its trail is a stream of fire.', base:'#e8503a',
    paint(g, R){ g.save(); rind(g, R); const Rr = rng(21); g.fillStyle = 'rgba(40,18,16,.45)'; for (let i = 0; i < 6; i++){ ell(g, (Rr() - .5) * R * 1.6, (Rr() - .5) * R * 1.3, R * (.14 + Rr() * .1), R * (.1 + Rr() * .08), Rr() * 3); g.fill(); } g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#ffb040'; g.shadowColor = '#ff9a3a'; g.shadowBlur = 8; g.lineWidth = 2.5; g.lineCap = 'round';
      for (const pts of [[[-R * .7, -R * .3], [-R * .35, 0], [-R * .45, R * .4]], [[R * .1, -R * .6], [0, -R * .1], [R * .3, R * .2], [R * .2, R * .6]], [[R * .7, -R * .2], [R * .45, R * .15]], [[-R * .1, R * .25], [-R * .2, R * .6]]]){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } g.restore(); },
    wake:['#ffe08a','#ff7a1a','#a0200a'],
    part(g, x, y, f, i){ g.fillStyle = `rgba(255,${140 + (i % 3) * 40},40,${1 - f})`; ell(g, x, y, 3.2 * (1 - f) + 1.2, 3.2 * (1 - f) + 1.2); g.fill(); } },
  { key:'frost', name:'Frost crystal', for:'Ice', desc:'Faceted ice with frozen light inside. Its trail is a flurry of snowflakes.', base:'#9ed8f2',
    paint(g, R){ g.save(); rind(g, R); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.4;
      for (const pts of [[[-R * .9, -R * .1], [-R * .4, -R * .6], [0, -R * .2], [R * .5, -R * .65], [R * .95, -R * .05]], [[-R * .8, R * .35], [-R * .3, 0], [R * .2, R * .35], [R * .7, R * .05]], [[-R * .4, -R * .6], [-R * .3, 0]], [[R * .5, -R * .65], [R * .2, R * .35]]]){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(-R * .4, -R * .6); g.lineTo(0, -R * .2); g.lineTo(-R * .3, 0); g.closePath(); g.fill(); g.restore(); },
    wake:['#ffffff','#bfefff','#5fb0e0'],
    part(g, x, y, f, i){ g.strokeStyle = `rgba(240,252,255,${1 - f})`; g.lineWidth = 1.4; for (let k = 0; k < 3; k++){ const a = k * Math.PI / 3 + f * 3 + i; g.beginPath(); g.moveTo(x - Math.cos(a) * 4.5, y - Math.sin(a) * 4.5); g.lineTo(x + Math.cos(a) * 4.5, y + Math.sin(a) * 4.5); g.stroke(); } } },
  { key:'galaxy', name:'Galaxy', for:'Purple', desc:'The purple rind glows with a nebula and a scatter of stars. Its trail is a stream of stardust.', base:'#9a5ad0',
    paint(g, R){ g.save(); rind(g, R); const gr = g.createRadialGradient(R * .2, -R * .1, 0, R * .2, -R * .1, R * .9); gr.addColorStop(0, 'rgba(255,150,240,.4)'); gr.addColorStop(.6, 'rgba(120,140,255,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-R * 2, -R * 2, R * 4, R * 4);
      const Rr = rng(8); for (let i = 0; i < 22; i++){ g.fillStyle = `rgba(255,255,255,${.5 + Rr() * .5})`; const s = .6 + Rr() * 1.4; ell(g, (Rr() - .5) * R * 1.9, (Rr() - .5) * R * 1.5, s, s); g.fill(); } g.restore(); },
    wake:['#ffe0ff','#c07cff','#3a2a8a'],
    part(g, x, y, f, i){ g.fillStyle = `rgba(255,${230 - (i % 3) * 40},255,${1 - f})`; const st = 3.4 * (1 - f) + 1; g.beginPath(); for (let k = 0; k < 8; k++){ const a = k * Math.PI / 4 + i, r = k % 2 ? st * .4 : st; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); } },
];

/** A wide comet wake behind a flying pumpkin: the full width of the pumpkin, tapering over len, streak lines at the edges, particles filling it. */
function wake(g, sk, x, y, R, len, t){
  const [c0, c1, c2] = sk.wake;
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(0, y, 0, y + len); gr.addColorStop(0, rgba(c1, .75)); gr.addColorStop(.5, rgba(c2, .35)); gr.addColorStop(1, rgba(c2, 0));
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - R * 1.05, y); g.quadraticCurveTo(x - R * .9, y + len * .5, x - R * .15, y + len); g.lineTo(x + R * .15, y + len); g.quadraticCurveTo(x + R * .9, y + len * .5, x + R * 1.05, y); g.closePath(); g.fill();
  const core = g.createLinearGradient(0, y, 0, y + len * .6); core.addColorStop(0, rgba(c0, .8)); core.addColorStop(1, rgba(c0, 0)); g.fillStyle = core; g.beginPath(); g.ellipse(x, y + len * .25, R * .45, len * .32, 0, 0, TAU); g.fill();
  g.lineCap = 'round';
  for (let k = 0; k < 6; k++){ const s = k % 2 ? 1 : -1, off = R * (.75 + (k >> 1) * .14), L = len * (.55 + ((k * 37) % 30) / 100), ph = ((t * 3 + k * .21) % 1);
    g.strokeStyle = rgba(k < 2 ? c0 : c1, .75 - (k >> 1) * .18); g.lineWidth = 2.2 - (k >> 1) * .5; g.beginPath(); g.moveTo(x + s * off, y + 4 + ph * 10); g.quadraticCurveTo(x + s * off * .95, y + L * .5, x + s * off * .55, y + L); g.stroke(); }
  g.globalCompositeOperation = 'source-over';
  const Rr = rng(17);
  for (let i = 0; i < 18; i++){ const f = (Rr() + t * 2.2) % 1, spread = R * .95 * (1 - f * .7), px = x + (Rr() - .5) * 2 * spread, py = y + 6 + f * len * .95; sk.part(g, px, py, f, i); }
  g.restore();
}

export const COSTUME_DRAW = Object.fromEntries(COSTUME_ART.map(c => [c.key, c.draw]));
export const HIT_FX = HITS;
export const SKIN_ART = Object.fromEntries(SKINS.map(s => [s.key, s]));
export { wake };

/** Paint a pumpkin in a skin: the skin's body, faceless in the patch, its own lit face when bunched. */
export function skinnedPumpkin(g, key, R, lit){
  const sk = SKIN_ART[key], face = faceFor('skin:' + key);
  pumpkin(g, pal(sk.base), lit, R, (g2, R2, c2, lit2) => { sk.paint(g2, R2); face(g2, R2, c2, lit2); });
}

// costume sprites: baked once per costume and bake scale; origin at the pumpkin's centre, R = 1 unit
const cache = new Map();
export function costumeSprite(key, px){
  const ck = key + ':' + px; if (cache.has(ck)) return cache.get(ck);
  const R = px * .4, w = R * 3, h = R * 3.3, c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h);
  const g = c.getContext('2d'); g.translate(w / 2, R * 2.2); COSTUME_DRAW[key](g, R);
  const sp = { c, ox:w / 2, oy:R * 2.2, R }; cache.set(ck, sp); return sp;
}
/** Draw the worn costume over a pumpkin whose centre is (x, y) and radius r (drawing units). */
export function drawCostume(ctx, key, x, y, r, px){
  const sp = costumeSprite(key, px), k = r / sp.R;
  ctx.drawImage(sp.c, x - sp.ox * k, y - sp.oy * k, sp.c.width * k, sp.c.height * k);
}

/** Shop icons: a lit Green pumpkin wearing the costume, or the skin lit with its own face. */
export function costumeIcon(key, px = 72){
  const c = document.createElement('canvas'); c.width = c.height = px * 2; const g = c.getContext('2d'); g.scale(2, 2);
  const R = px * .3; g.translate(px / 2, px * .64); pumpkin(g, pal('#6db33f'), true, R, faceFor('green')); if (key) COSTUME_DRAW[key](g, R); return c;
}
export function skinIcon(key, px = 72, lit = true){
  const c = document.createElement('canvas'); c.width = c.height = px * 2; const g = c.getContext('2d'); g.scale(2, 2);
  g.translate(px / 2, px * .56); skinnedPumpkin(g, key, px * .34, lit); return c;
}
