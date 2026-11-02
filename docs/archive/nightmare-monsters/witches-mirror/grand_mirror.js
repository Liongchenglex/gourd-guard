// ---------- Grand Mirror Sprite (nightmare Witchwood), Toy Plastic style: design archive, not wired into the game ----------
// A copy of mirror() from src/engine/render/chars/w3.js plus an enhanced look, pose.variant 'grand':
//   THE TRIPTYCH SPRITE: a bigger (×1.2), regal mirror sprite drained to grey like the nightmare wood: silver skin, long floating
//   silver hair, a crown of glass shards with a red gem, a charcoal gown with a shard-cut hem, and two pairs of jagged glass-shard
//   wings with red veins. Instead of a hand mirror she carries a TRIPTYCH: a tall arched mirror with two hinged doors. Folded shut
//   on the walk (the doors' backs show a red eye sigil), held open in front of her while she reflects, and swung up and thrown open
//   in the new `summon` clip, which flashes sideways to raise the three-lane barrier.
// The three-lane barrier is a separate baked prop: barrier() below, drawn in game pixels (lane width CS = 74 in src/engine/state.js),
// baked once into a few sheen frames by bakeBarrier() and blitted.
// pose: { walk, chew, reflect, summon } (each 0..1, one at a time) and variant: undefined | 'grand'.

import { E, PL, RR, S, SM, SO, mix, pal, rgba, rng } from '../../../../src/engine/render/paint.js';
import { TAU } from '../../../../src/engine/util.js';

// ---- the game's palettes (copied from w3.js) ----
const SKINF = pal('#e8e0f6'), HAIRF = pal('#b8ecdc'), DRESSF = pal('#6a4ac0'), WING = pal('#d4ecff'), FRAME = pal('#c8a050'), GLASS = pal('#9ad0ff');

// ---- the grand palettes: neutral greys with red, glass kept pale blue so it still reads as a mirror ----
const gpal = b => ({ base:b, light:mix(b, '#ffffff', .45), dark:mix(b, '#141416', .42), deep:mix(b, '#060608', .68), rim:mix(b, '#ffffff', .6) });
const G = { skin:gpal('#d2d2da'), hair:gpal('#eeeef2'), gown:gpal('#2c2c34'), trim:gpal('#b4b4c0'), wing:gpal('#e4ecf4'), frame:gpal('#a6a6b2'), back:gpal('#3a3a42'), crown:gpal('#dfe8f4') };
const RED = '#ff2a3a';

// ---------- the game's mirror sprite (copied from w3.js) ----------
/** A small winged sprite with a hand mirror: up and glinting (P.reflect), lowered on the walk, biting on the chew. */
export function mirror(g, P = {}){
  if (P.variant === 'grand') return grandMirror(g, P);
  const w = P.walk, ch = P.chew, rf = P.reflect, t = w ?? rf ?? ch ?? 0;
  const flap = Math.sin(t * TAU * 2), hover = ch == null ? Math.sin(t * TAU) * 3 : Math.sin(ch * TAU) * 2, lean = ch == null ? 0 : .5 + Math.sin(ch * TAU) * .5, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  const up = rf != null;
  S.shadow(g, 0, 50, 22 - Math.abs(hover), 4);
  g.save(); g.translate(0, hover + lean * 6);
  for (const s of [-1, 1]){ const lift = flap * 9;
    const W1 = SM([[s * 6, -4], [s * 20, -22 - lift], [s * 40, -30 - lift], [s * 46, -14 - lift * .6], [s * 34, 2], [s * 14, 4]], .8), W2 = SM([[s * 6, 6], [s * 24, 12 + lift * .4], [s * 36, 26 + lift * .5], [s * 24, 30], [s * 10, 18]], .8);
    g.save(); g.globalAlpha *= .8; S.part(g, W1, WING, { x:s * 26, y:-12, r:22 }, { flat:true, mat:'gel', lw:1.2 }); S.part(g, W2, WING, { x:s * 22, y:18, r:14 }, { flat:true, mat:'gel', lw:1.2 }); g.restore();
    S.crease(g, SO([[s * 8, -2], [s * 26, -18 - lift * .8], [s * 42, -22 - lift]]), WING, 1.2, .35); S.crease(g, SO([[s * 8, 2], [s * 28, -6 - lift * .3], [s * 40, -10 - lift * .4]]), WING, 1, .3); S.crease(g, SO([[s * 8, 8], [s * 22, 16], [s * 32, 26]]), WING, 1, .3); }
  for (const s of [-1, 1]){ const k = Math.sin(t * TAU + (s < 0 ? 0 : 2)) * 2; S.tube(g, SO([[s * 5, 22], [s * 7 + k, 34]]), SKINF, 4.5); S.part(g, E(s * 8 + k, 37, 5, 3), DRESSF, { x:s * 8, y:37, r:5 }, { flat:true, mat:'cloth' }); }
  const dress = SM([[-9, -2], [-13, 12], [-16, 26, 1], [-8, 22, 1], [0, 28, 1], [8, 22, 1], [16, 26, 1], [13, 12], [9, -2]], .8);
  S.part(g, dress, DRESSF, { x:0, y:12, r:16 }, { mat:'cloth' }); S.crease(g, SO([[-5, 4], [-6, 22]]), DRESSF, 1.4, .4); S.crease(g, SO([[5, 4], [7, 22]]), DRESSF, 1.4, .4);
  const wave = Math.sin(t * TAU) * 3;
  S.tube(g, SO([[-8, 2], [-16, 8 + wave], [-20, 16 + wave]]), SKINF, 4); S.hand(g, -21, 19 + wave, SKINF, Math.PI * .7, 3, 3.6);
  const mx = up ? 6 : 22, my = up ? 6 : 24;
  if (up) S.tube(g, SO([[8, 2], [14, 12], [10, 16]]), SKINF, 4); else S.tube(g, SO([[8, 2], [16, 10], [20, 18]]), SKINF, 4);
  const head = SM([[-16, -22], [-17, -10], [-10, -1], [0, 1], [10, -1], [17, -10], [16, -22], [8, -32], [-8, -32]]);
  for (const s of [-1, 1]) S.part(g, SM([[s * 12, -18], [s * 26, -26], [s * 20, -12]], .6), SKINF, { x:s * 18, y:-18, r:7 }, { flat:true, mat:'skin' });
  S.part(g, head, SKINF, { x:0, y:-15, r:17 }, { mat:'skin' }); S.contact(g, dress, 0, -2, 10, 4, .4);
  S.part(g, SM([[-18, -22], [-14, -36], [0, -41], [14, -36], [18, -22], [12, -26], [6, -22], [-2, -28], [-10, -24]], .8), HAIRF, { x:0, y:-30, r:18 }, { mat:'skin', hx:-8, hy:-34 });
  S.crease(g, SO([[-6, -38], [-2, -30]]), HAIRF, 1.2, .35); S.crease(g, SO([[6, -37], [10, -29]]), HAIRF, 1.2, .35);
  S.eye(g, -6.5, -13, 5.5, 6.5, { lx:.15, ly:.2, pr:.44, iris:'#5a7aff' }); S.eye(g, 6.5, -13, 5.5, 6.5, { lx:.15, ly:.2, pr:.44, iris:'#5a7aff' });
  S.blush(g, 0, -6, .55);
  if (jaw > .05){ S.dot(g, SM([[-4, -4], [0, -3 + jaw * 5], [4, -4], [0, -5]], .8), '#3a1a3a'); S.dot(g, PL([[-3, -4], [-1, -4], [-2, -1]]), '#fff'); S.dot(g, PL([[1, -4], [3, -4], [2, -1]]), '#fff'); }
  else S.stroke(g, SO([[-4, -4], [0, -2], [4, -4]]), SKINF, 1.4);
  const ang = up ? -.15 : .5;
  g.save(); g.translate(mx, my); g.rotate(ang);
  S.tube(g, SO([[0, 10], [1, 22]]), FRAME, 4); S.part(g, E(0, 0, 12.5, 13.5), FRAME, { x:0, y:0, r:12.5 }, { mat:'metal', flat:true });
  const glass = E(0, 0, 9, 10);
  if (up){ g.save(); g.shadowColor = '#bfefff'; g.shadowBlur = 10; S.part(g, glass, GLASS, { x:0, y:2, r:9 }, { flat:true, noEdge:true }); g.restore();
    g.save(); glass(g); g.clip(); const gl = g.createLinearGradient(-9, -9, 9, 9); gl.addColorStop(0, '#ffffff'); gl.addColorStop(.5, '#bfe6ff'); gl.addColorStop(1, '#7ab0ff'); g.fillStyle = gl; g.fillRect(-10, -11, 20, 22);
    const k = -1.3 + rf * 2.6; g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(-14 + k * 10, 12); g.lineTo(-8 + k * 10, -12); g.lineTo(-4 + k * 10, -12); g.lineTo(-10 + k * 10, 12); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(-1 + k * 10, 12); g.lineTo(3 + k * 10, -12); g.lineTo(5 + k * 10, -12); g.lineTo(1 + k * 10, 12); g.closePath(); g.fill(); g.restore();
    g.strokeStyle = '#fff'; g.lineWidth = 1.2; const sx = 5, sy = -5, sr = 3 + Math.sin(rf * TAU) * 1.5; g.beginPath(); g.moveTo(sx - sr, sy); g.lineTo(sx + sr, sy); g.moveTo(sx, sy - sr); g.lineTo(sx, sy + sr); g.stroke(); }
  else { S.part(g, glass, pal('#6a7a8a'), { x:0, y:2, r:9 }, { flat:true, noEdge:true }); S.dot(g, E(-3, -3, 2.5, 1.5), '#fff', .35); }
  S.stroke(g, glass, FRAME, 1.4, .8);
  g.restore();
  S.hand(g, up ? 8 : 20, up ? 18 : 20, SKINF, up ? -Math.PI / 2 : Math.PI / 2, 3, 3.6);
  g.restore();
}

// ---------- helpers ----------
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** Arched panel: a rectangle w × h centred on (x, y) with a round top. */
const arch = (x, y, w, h) => g => { const r = w / 2; g.beginPath(); g.moveTo(x - r, y + h / 2); g.lineTo(x - r, y - h / 2 + r); g.arc(x, y - h / 2 + r, r, Math.PI, 0); g.lineTo(x + r, y + h / 2); g.closePath(); };
/** Mirror glass filling path p: pale gradient, two sheen bands at offset k (-1..1), a glint star, optionally a few fine cracks. */
function glassFill(g, p, x, y, w, h, k, lit, cracked){
  g.save(); if (lit > 0){ g.shadowColor = '#d8ecff'; g.shadowBlur = 6 + lit * 10; }
  p(g); g.fillStyle = '#9ab4d8'; g.fill(); g.restore();
  g.save(); p(g); g.clip();
  const gl = g.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2); gl.addColorStop(0, '#ffffff'); gl.addColorStop(.45, mix('#bcd8f4', '#ffffff', lit * .4)); gl.addColorStop(1, '#6f8cc0'); g.fillStyle = gl; g.fillRect(x - w, y - h, w * 2, h * 2);
  const o = k * w; g.fillStyle = `rgba(255,255,255,${.55 + lit * .35})`; g.beginPath(); g.moveTo(x - w * .4 + o, y + h / 2); g.lineTo(x - w * .05 + o, y - h / 2); g.lineTo(x + w * .12 + o, y - h / 2); g.lineTo(x - w * .23 + o, y + h / 2); g.closePath(); g.fill();
  g.fillStyle = `rgba(255,255,255,${.3 + lit * .3})`; g.beginPath(); g.moveTo(x - w * .02 + o, y + h / 2); g.lineTo(x + w * .3 + o, y - h / 2); g.lineTo(x + w * .38 + o, y - h / 2); g.lineTo(x + w * .06 + o, y + h / 2); g.closePath(); g.fill();
  if (cracked){ g.strokeStyle = 'rgba(40,40,60,.45)'; g.lineWidth = .7; g.beginPath(); g.moveTo(x + w * .3, y + h * .1); g.lineTo(x + w * .05, y + h * .2); g.lineTo(x - w * .2, y + h * .42); g.moveTo(x + w * .05, y + h * .2); g.lineTo(x + w * .12, y + h * .48); g.stroke(); }
  g.restore();
}
/** The triptych at (x, y) (centre of the middle panel): a 22 × 32 arched mirror in a silver frame with a red gem, two hinged doors
 *  opening by o (0 shut → 1 open), glass lit by `lit` (0..1), sheen offset k. */
function triptych(g, x, y, o, lit, k){
  const C = G, W = 22, H = 32, F = 3;
  // the middle panel: frame, glass, gem finial
  S.part(g, arch(x, y, W + F * 2, H + F * 2), C.frame, { x, y, r:H * .6 }, { mat:'metal', flat:true, lw:1.3 });
  glassFill(g, arch(x, y + .5, W - 1, H - 1), x, y, W, H, k, lit, false);
  S.stroke(g, arch(x, y + .5, W - 1, H - 1), C.frame, 1, .7);
  S.part(g, PL([[x - 3, y - H / 2 - F + 1], [x, y - H / 2 - F - 6], [x + 3, y - H / 2 - F + 1]]), C.frame, { x, y:y - H / 2 - F - 2, r:4 }, { flat:true, mat:'metal', lw:1 });
  g.save(); g.shadowColor = RED; g.shadowBlur = 3 + lit * 6; S.dot(g, E(x, y - H / 2 - F - 1, 2.6, 2.6), '#e8101e'); g.restore(); S.dot(g, E(x - .8, y - H / 2 - F - 2, .9, .9), '#fff', .8);
  S.part(g, RR(x - 6, y + H / 2 + F - 1, 12, 4, 2), C.frame, { x, y:y + H / 2 + F + 1, r:6 }, { flat:true, mat:'metal', lw:1 });
  // the doors: hinged at the panel's sides; past 90° their glass faces us, before it their backs do
  const th = Math.PI * (1 - o) + .32 * o, cs = Math.cos(th), sn = Math.sin(th), DW = 13;
  for (const s of [-1, 1]){
    const hx = x + s * (W / 2 + F), ox = hx + s * DW * cs, top0 = y - H / 2 + 4, bot0 = y + H / 2 + F - 1, grow = 1 + sn * .1;
    const yt = top0 - 2 - (grow - 1) * 10, yb = bot0 + (grow - 1) * 6, ot = y - H / 2 + 8 - (grow - 1) * 10;
    const door = PL([[hx, top0], [hx, bot0], [ox, yb], [ox, ot], [ox + (hx - ox) * .4, yt]]);
    if (Math.abs(cs) < .08){ S.tube(g, SO([[hx, top0], [hx, bot0]]), C.frame, 3); continue; }
    if (cs * 1 > 0){   // open: glass facing us
      S.part(g, door, C.frame, { x:(hx + ox) / 2, y, r:H * .5 }, { mat:'metal', flat:true, lw:1.2 });
      const ix = (v, f) => hx + (v - hx) * f; const dg = PL([[ix(hx, 1) + s * 1.6, top0 + 2], [hx + s * 1.6, bot0 - 2], [ox - s * 1.8, yb - 2.5], [ox - s * 1.8, ot + 2], [ox + (hx - ox) * .4, yt + 2.5]]);
      glassFill(g, dg, (hx + ox) / 2, y, Math.abs(ox - hx), H, k * .8 + s * .2, lit * .9, true);
    } else {   // shut: the back of the door, dark silver-grey with a red eye sigil
      S.part(g, door, C.back, { x:(hx + ox) / 2, y, r:H * .5 }, { mat:'metal', flat:true, lw:1.2 });
      g.save(); door(g); g.clip(); const ex = hx + (ox - hx) * .5, ey = y + 1, ew = Math.abs(ox - hx) * .36;
      g.strokeStyle = rgba(C.frame.light, .55); g.lineWidth = 1; g.beginPath(); g.moveTo(hx + (ox - hx) * .12, y - H * .32); g.lineTo(hx + (ox - hx) * .12, y + H * .4); g.moveTo(hx + (ox - hx) * .88, y - H * .26); g.lineTo(hx + (ox - hx) * .88, y + H * .44); g.stroke();
      if (ew > 1.5){ S.dot(g, SM([[ex - ew, ey], [ex, ey - ew * .7], [ex + ew, ey], [ex, ey + ew * .7]], .9), '#0c0c10', .9); g.save(); g.shadowColor = RED; g.shadowBlur = 4; S.dot(g, E(ex, ey, ew * .32, ew * .45), RED); g.restore(); }
      g.restore(); }
    for (const yy of [top0 + 4, bot0 - 4]) S.rivet(g, hx, yy, 1.4, C.frame);
  }
}
/** Shard-wing: an angular glass wing between points, gel-shaded, with red veins. */
function shardWing(g, pts, b, veins){
  g.save(); g.globalAlpha *= .85; S.part(g, SM(pts, .5), G.wing, b, { flat:true, mat:'gel', lw:1.2 }); g.restore();
  for (const v of veins) S.crease(g, SO(v), pal('#c01828'), 1, .55);
}

// ---------- the Triptych Sprite ----------
function grandMirror(g, P){
  const w = P.walk, ch = P.chew, rf = P.reflect, sm = P.summon, t = w ?? rf ?? ch ?? sm ?? 0;
  const flap = Math.sin(t * TAU * 2), hover = ch == null ? Math.sin(t * TAU) * 3 : Math.sin(ch * TAU) * 2, lean = ch == null ? 0 : .5 + Math.sin(ch * TAU) * .5, jaw = ch == null ? 0 : Math.abs(Math.sin(ch * TAU));
  // triptych placement: at her right side, shut (walk / chew); in front, open (reflect); summon swings it in, throws it high and open, flashes, then settles in front
  let tx = 23, ty = 14, tr = .42, ts = .78, open = 0, lit = 0, arms = 0, flash = 0;
  if (rf != null){ tx = 0; ty = 25; tr = 0; ts = .88; open = 1; lit = .55 + Math.sin(rf * TAU) * .25; arms = 1; }
  if (sm != null){ const a = sstep(0, .3, sm), up = sstep(.25, .5, sm) * (1 - sstep(.78, 1, sm)), down = sstep(.78, 1, sm);
    tx = 23 * (1 - a); tr = .42 * (1 - a); ts = .78 + .1 * a + up * .1; ty = 14 * (1 - a) + 27 * a;
    open = sstep(.32, .6, sm); arms = a; lit = sstep(.45, .6, sm) * (1 - sstep(.85, 1, sm) * .45); flash = Math.max(0, Math.sin(Math.max(0, Math.min(1, (sm - .52) / .4)) * Math.PI)); }
  const k = -1 + ((rf ?? sm ?? 0) * 2);
  g.save(); g.translate(0, 50); g.scale(1.2, 1.2); g.translate(0, -50);
  S.shadow(g, 0, 50, 24 - Math.abs(hover), 4);
  g.save(); g.translate(0, hover + lean * 6);
  // sideways flash behind her: the barrier being thrown out across three lanes
  if (flash > 0){ g.save(); g.globalAlpha *= flash;
    const gr = g.createLinearGradient(-58, 0, 58, 0); gr.addColorStop(0, 'rgba(220,236,255,0)'); gr.addColorStop(.25, 'rgba(220,236,255,.6)'); gr.addColorStop(.5, 'rgba(255,255,255,.95)'); gr.addColorStop(.75, 'rgba(220,236,255,.6)'); gr.addColorStop(1, 'rgba(220,236,255,0)');
    g.fillStyle = gr; const by = ty - 4; g.beginPath(); g.moveTo(-58, by - 2); g.quadraticCurveTo(0, by - 14 - flash * 6, 58, by - 2); g.lineTo(58, by + 4); g.quadraticCurveTo(0, by + 12 + flash * 4, -58, by + 4); g.closePath(); g.fill();
    const R = rng(13); for (let i = 0; i < 10; i++){ const sx = (R() - .5) * 104 * (.4 + flash * .6), sy = by + (R() - .5) * 18, ss = 1.2 + R() * 2; g.strokeStyle = i % 4 ? '#ffffff' : RED; g.lineWidth = 1; g.beginPath(); g.moveTo(sx - ss, sy); g.lineTo(sx + ss, sy); g.moveTo(sx, sy - ss); g.lineTo(sx, sy + ss); g.stroke(); }
    g.restore(); }
  // two pairs of glass-shard wings
  for (const s of [-1, 1]){ const lift = flap * 8 + (sm != null ? flash * 6 : 0);
    shardWing(g, [[s * 6, -6, 1], [s * 14, -26 - lift, 1], [s * 30, -40 - lift, 1], [s * 34, -30 - lift, 1], [s * 46, -38 - lift * .9, 1], [s * 44, -20 - lift * .6, 1], [s * 50, -12 - lift * .5, 1], [s * 34, -2, 1], [s * 14, 2, 1]], { x:s * 28, y:-18, r:24 },
      [[[s * 8, -4], [s * 26, -24 - lift * .8], [s * 40, -32 - lift * .9]], [[s * 8, -1], [s * 32, -12 - lift * .4], [s * 46, -14 - lift * .5]]]);
    shardWing(g, [[s * 6, 6, 1], [s * 22, 8 + lift * .3, 1], [s * 34, 20 + lift * .4, 1], [s * 30, 26, 1], [s * 36, 34 + lift * .3, 1], [s * 20, 30, 1], [s * 10, 18, 1]], { x:s * 22, y:20, r:14 },
      [[[s * 8, 8], [s * 22, 18], [s * 32, 30]]]); }
  // a long gown with a shard-cut hem, slippers peeking
  for (const s of [-1, 1]){ const kk = Math.sin(t * TAU + (s < 0 ? 0 : 2)) * 1.5; S.part(g, PL([[s * 4 + kk, 34], [s * 12 + kk, 36], [s * 6 + kk, 39]]), G.gown, { x:s * 8, y:36, r:5 }, { flat:true, lw:1 }); }
  const gown = SM([[-9, -2], [-14, 12], [-18, 32, 1], [-12, 28, 1], [-8, 36, 1], [-3, 30, 1], [0, 37, 1], [3, 30, 1], [8, 36, 1], [12, 28, 1], [18, 32, 1], [14, 12], [9, -2]], .8);
  S.part(g, gown, G.gown, { x:0, y:14, r:18 }, { mat:'cloth', hx:-6, hy:2 });
  S.crease(g, SO([[-5, 4], [-7, 28]]), G.gown, 1.4, .45); S.crease(g, SO([[5, 4], [7, 28]]), G.gown, 1.4, .45);
  S.tube(g, SO([[-10, 6], [0, 8], [10, 6]]), G.trim, 2.4); g.save(); g.shadowColor = RED; g.shadowBlur = 4; S.dot(g, E(0, 8, 1.8, 1.8), RED); g.restore();
  // long silver hair floating out behind the shoulders
  { const fl = Math.sin(t * TAU) * 2;   // long hair hanging behind the shoulders, its ends lifting as if under water
    const hair = SM([[-14, -30], [-21, -16], [-24, 2 + fl], [-28, 16 + fl * 1.5, 1], [-18, 10], [-10, 2], [10, 2], [18, 10], [28, 16 - fl * 1.5, 1], [24, 2 - fl], [21, -16], [14, -30]], .8);
    S.part(g, hair, G.hair, { x:0, y:-8, r:24 }, { mat:'skin', hx:-14, hy:-14 }); for (const s of [-1, 1]) S.crease(g, SO([[s * 17, -14], [s * 21, 0], [s * 25, 12]]), G.hair, 1.2, .4); }
  // the arms: walk = one waving, one holding the shut triptych at her side; reflect / summon = both on the doors' outer frames
  const wave = Math.sin(t * TAU) * 3, front = arms;
  const lhx = -21 * (1 - front) + (tx - 30 * ts) * front, lhy = (19 + wave) * (1 - front) + (ty + 4 * ts) * front;
  const rhx = 20 * (1 - front) + (tx + 30 * ts) * front, rhy = 20 * (1 - front) + (ty + 4 * ts) * front;
  S.tube(g, SO([[-8, 2], [(-8 + lhx) / 2 - 6, (2 + lhy) / 2 + 2], [lhx, lhy - 3]]), G.skin, 4); S.tube(g, SO([[8, 2], [(8 + rhx) / 2 + 6, (2 + rhy) / 2 + 2], [rhx, rhy - 3]]), G.skin, 4);
  // head: big, silver, pointed ears, narrowed red eyes, a thin smirk
  const head = SM([[-16, -22], [-17, -10], [-10, -1], [0, 1], [10, -1], [17, -10], [16, -22], [8, -32], [-8, -32]]);
  for (const s of [-1, 1]) S.part(g, SM([[s * 12, -18], [s * 28, -28], [s * 20, -12]], .6), G.skin, { x:s * 18, y:-18, r:7 }, { flat:true, mat:'skin' });
  S.part(g, head, G.skin, { x:0, y:-15, r:17 }, { mat:'skin' }); S.contact(g, gown, 0, -2, 10, 4, .4);
  S.part(g, SM([[-18, -20], [-14, -36], [0, -41], [14, -36], [18, -20], [13, -27], [7, -24], [0, -30], [-7, -24], [-13, -27]], .8), G.hair, { x:0, y:-30, r:18 }, { mat:'skin', hx:-8, hy:-34 });
  S.crease(g, SO([[-6, -38], [-3, -30]]), G.hair, 1.2, .35); S.crease(g, SO([[6, -37], [9, -29]]), G.hair, 1.2, .35);
  // crown of glass shards with a red gem
  for (const [x, h, wd] of [[-11, 7, 3], [-6, 10, 3.4], [0, 15, 4], [6, 10, 3.4], [11, 7, 3]]){ const by = -38 + Math.abs(x) * .18;
    S.part(g, PL([[x - wd, by], [x - wd * .3, by - h], [x + wd * .5, by - h + 2], [x + wd, by]]), G.crown, { x, y:by - h / 2, r:h * .6 }, { flat:true, mat:'gel', lw:1 }); }
  S.tube(g, SO([[-13, -36], [0, -38.5], [13, -36]]), G.frame, 2.6);
  g.save(); g.shadowColor = RED; g.shadowBlur = 5; S.dot(g, E(0, -38.5, 2.2, 2.4), '#e8101e'); g.restore();
  const eo = { lx:.15, ly:.2, pr:.44, iris:'#e01828', lid:.18, lidCol:G.skin.base, lidDeep:G.skin.deep };
  S.eye(g, -6.5, -13, 5.5, 6.5, { ...eo, tilt:-.3 }); S.eye(g, 6.5, -13, 5.5, 6.5, { ...eo, tilt:.3 });
  if (lit > .3){ g.save(); g.globalAlpha *= (lit - .3) * 1.4; S.glow(g, -5.6, -12, 1.8, RED); S.glow(g, 7.4, -12, 1.8, RED); g.restore(); }
  if (jaw > .05){ S.dot(g, SM([[-4, -4], [0, -3 + jaw * 5], [4, -4], [0, -5]], .8), '#1a0a14'); S.dot(g, PL([[-3, -4], [-1, -4], [-2, -.5]]), '#fff'); S.dot(g, PL([[1, -4], [3, -4], [2, -.5]]), '#fff'); }
  else S.stroke(g, SO([[-4, -4.5], [0, -3], [5, -5.5]]), G.skin, 1.4);
  // the triptych, then the hands over its frame
  g.save(); g.translate(tx, ty); g.rotate(tr); g.scale(ts, ts);
  if (open < .05) S.tube(g, SO([[0, 18], [1, 30]]), G.frame, 4);   // a handle under it while carried shut
  triptych(g, 0, 0, open, lit, k);
  g.restore();
  S.hand(g, lhx, lhy, G.skin, front > .5 ? 0 : Math.PI * .7, 3, 3.6); S.hand(g, rhx, rhy, G.skin, front > .5 ? Math.PI : Math.PI / 2, 3, 3.6);
  g.restore(); g.restore();
}

// ---------- the three-lane barrier (a baked field prop, game pixels) ----------
/** A wall of mirror glass across `lanes` lanes of width cs, standing h tall on y = 0, centred on x = 0: one arched pane per lane in a
 *  tarnished silver frame, posts with red-gem finials on the lane lines, a few fine cracks (it is a nightmare mirror), and a sheen
 *  band at offset k (-1..1 across the whole wall). Drawn once per sheen frame by bakeBarrier(); never per frame. */
export function barrier(g, lanes = 3, cs = 74, h = 50, k = 0){
  const W = lanes * cs, x0 = -W / 2, F = G.frame;
  // soft glow on the ground and a pale haze behind
  let gr = g.createLinearGradient(0, -h - 16, 0, 6); gr.addColorStop(0, 'rgba(210,228,255,0)'); gr.addColorStop(.7, 'rgba(210,228,255,.18)'); gr.addColorStop(1, 'rgba(210,228,255,0)'); g.fillStyle = gr; g.fillRect(x0 - 6, -h - 16, W + 12, h + 22);
  S.shadow(g, 0, 2, W * .55, 6);
  for (let i = 0; i < lanes; i++){
    const cx = x0 + cs * (i + .5), pw = cs - 14, ph = h - 8;
    const pane = arch(cx, -ph / 2 - 4, pw, ph);
    S.part(g, arch(cx, -ph / 2 - 4, pw + 6, ph + 5), F, { x:cx, y:-h / 2, r:h * .7 }, { mat:'metal', flat:true, lw:1.4 });
    // glass with a sheen continuous across the whole wall
    g.save(); g.shadowColor = '#d8ecff'; g.shadowBlur = 10; pane(g); g.fillStyle = 'rgba(150,180,220,.7)'; g.fill(); g.restore();
    g.save(); pane(g); g.clip();
    const gl = g.createLinearGradient(cx - pw / 2, -h, cx + pw / 2, 0); gl.addColorStop(0, 'rgba(255,255,255,.95)'); gl.addColorStop(.5, 'rgba(196,220,248,.82)'); gl.addColorStop(1, 'rgba(110,140,196,.8)'); g.fillStyle = gl; g.fillRect(cx - pw, -h - 4, pw * 2, h + 8);
    const o = k * W * .6 - (cx - 0);
    for (const [a, b, al] of [[-.22, -.06, .7], [.02, .08, .45], [.16, .19, .35]]){ g.fillStyle = `rgba(255,255,255,${al})`; g.beginPath(); g.moveTo(o + a * W, 0); g.lineTo(o + a * W + h * .55, -h); g.lineTo(o + b * W + h * .55, -h); g.lineTo(o + b * W, 0); g.closePath(); g.fill(); }
    // a faint reflection of the field: darker band low in the glass
    gr = g.createLinearGradient(0, -14, 0, 0); gr.addColorStop(0, 'rgba(40,50,70,0)'); gr.addColorStop(1, 'rgba(40,50,70,.35)'); g.fillStyle = gr; g.fillRect(cx - pw, -14, pw * 2, 14);
    const R = rng(17 + i * 5); g.strokeStyle = 'rgba(30,30,50,.4)'; g.lineWidth = .8;   // fine cracks spidering from one point
    const px = cx + (R() - .5) * pw * .5, py = -ph * (.3 + R() * .3); g.beginPath(); for (let j = 0; j < 5; j++){ const a = R() * TAU, l = 6 + R() * 10; g.moveTo(px, py); g.lineTo(px + Math.cos(a) * l * .5 + 1, py + Math.sin(a) * l * .5); g.lineTo(px + Math.cos(a + .2) * l, py + Math.sin(a + .2) * l); } g.stroke();
    g.restore();
    S.stroke(g, pane, F, 1.2, .7);
    // glint star near the top of each pane
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.2; const sx = cx + pw * .22, sy = -ph + 6; g.beginPath(); g.moveTo(sx - 4, sy); g.lineTo(sx + 4, sy); g.moveTo(sx, sy - 4); g.lineTo(sx, sy + 4); g.stroke();
  }
  // base rail and posts on the lane lines with gem finials
  S.part(g, RR(x0 + 2, -5, W - 4, 7, 3), F, { x:0, y:-1, r:W * .5 }, { mat:'metal', flat:true, lw:1.2 });
  for (let i = 0; i <= lanes; i++){ const px = x0 + cs * i + (i === 0 ? 5 : i === lanes ? -5 : 0);
    S.part(g, RR(px - 3.5, -h + 2, 7, h, 2.5), F, { x:px, y:-h / 2, r:h * .5 }, { mat:'metal', flat:true, lw:1.2 });
    S.part(g, PL([[px - 4, -h + 3], [px, -h - 9], [px + 4, -h + 3]]), F, { x:px, y:-h - 2, r:6 }, { flat:true, mat:'metal', lw:1 });
    g.save(); g.shadowColor = RED; g.shadowBlur = 6; S.dot(g, E(px, -h - 1, 2.8, 3), '#e8101e'); g.restore(); S.dot(g, E(px - 1, -h - 2.2, 1, 1), '#fff', .8);
    S.rivet(g, px, -10, 1.6, F); S.rivet(g, px, -h * .55, 1.6, F); }
}
/** Bake the barrier into n sheen frames (each a canvas at device scale sc), with the wall's base line at y = pad + h. */
export function bakeBarrier(lanes, cs, h, n = 8, sc = 2){
  const pad = 20, W = lanes * cs + 24, H = h + pad + 12, frames = [];
  for (let i = 0; i < n; i++){ const c = document.createElement('canvas'); c.width = Math.ceil(W * sc); c.height = Math.ceil(H * sc); const g = c.getContext('2d'); g.scale(sc, sc); g.translate(W / 2, pad + h); barrier(g, lanes, cs, h, -1.2 + 2.4 * i / n); frames.push(c); }
  return { frames, w:W, h:H, base:pad + h };
}

// ---------- registry entry (format of src/engine/render/chars/index.js) ----------
// The game's mirror entry plus the grand look and its summon clip. The grand sprite is 1.2× and its open triptych and wings are wide,
// so it needs a bigger box than the game's mirror (x:-50 y:-50 w:100 h:106) and should be its own registry key in the game.
export const GRAND = { key:'mirror', draw:mirror, scale:.62, dy:-13, box:{ x:-62, y:-72, w:124, h:128 }, variants:{ grand:true },
  clips:{ walk:{ n:8, fps:12, pose:t => ({ walk:t }) }, chew:{ n:4, fps:8, pose:t => ({ chew:t }) }, reflect:{ n:6, fps:10, pose:t => ({ reflect:t }) },
    summon:{ n:10, fps:12, once:true, pose:t => ({ summon:t }) } }, still:{ reflect:.3 } };
