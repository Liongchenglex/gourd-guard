// ---------- Carved lit faces (owner, 2026-09-27) ----------
// Pumpkins have no face while they sit in the patch; when they join a bunch they light up with a carved, glowing face,
// and every type has its own expression. Drawn around (0,0) for a pumpkin of radius R. Baked into the lit sprite once.

const TAU = Math.PI * 2;
let CUT = false;   // first pass: the dark carved rim; second pass: the glow inside it
function glow(g, R, hi, lo, halo){
  if (CUT){ g.shadowBlur = 0; g.fillStyle = 'rgba(38,14,8,.92)'; return; }
  const gr = g.createLinearGradient(0, -R * .4, 0, R * .55); gr.addColorStop(0, hi); gr.addColorStop(1, lo);
  g.shadowColor = halo; g.shadowBlur = R * .3; g.fillStyle = gr;
}
const tri = (g, x, y, w, h, flip = 1) => { g.beginPath(); g.moveTo(x - w, y + h * .5 * flip); g.lineTo(x + w, y + h * .5 * flip); g.lineTo(x, y - h * .5 * flip); g.closePath(); g.fill(); };
const star = (g, x, y, r) => { g.beginPath(); for (let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
const heart = (g, x, y, r) => { g.beginPath(); g.moveTo(x, y + r * .9); g.bezierCurveTo(x - r * 1.4, y - r * .1, x - r * .6, y - r * 1.1, x, y - r * .35); g.bezierCurveTo(x + r * .6, y - r * 1.1, x + r * 1.4, y - r * .1, x, y + r * .9); g.fill(); };
const zig = (g, R, y0, depth, teeth, w = .5) => { g.beginPath(); g.moveTo(-R * w, y0); g.quadraticCurveTo(0, y0 + R * depth * 2, R * w, y0); for (let i = teeth; i >= 0; i--){ const x = -R * w + i * (2 * R * w) / teeth; g.lineTo(x, y0 + (i % 2 ? R * .12 : 0)); } g.closePath(); g.fill(); };

/** One carved expression per pumpkin key. */
export const LIT_FACES = {
  // Green: the classic jack-o'-lantern, triangle eyes and a toothy grin
  green(g, R){ glow(g, R, '#fff6c0', '#ff9a1a', '#ffb020'); const ey = -R * .1; tri(g, -R * .33, ey, R * .17, R * .28); tri(g, R * .33, ey, R * .17, R * .28); tri(g, 0, R * .06, R * .08, R * .12); zig(g, R, R * .24, .25, 6); },
  // Yellow: greedy delight, coin-round eyes and a huge open grin
  yellow(g, R){ glow(g, R, '#fffbe0', '#ffc21a', '#ffd84a'); const ey = -R * .12; for (const x of [-R * .33, R * .33]){ g.beginPath(); g.arc(x, ey, R * .16, 0, TAU); g.fill(); }
    g.beginPath(); g.moveTo(-R * .55, R * .14); g.quadraticCurveTo(0, R * .9, R * .55, R * .14); g.quadraticCurveTo(0, R * .36, -R * .55, R * .14); g.fill(); },
  // Ice: cool and unbothered, narrow slit eyes and a small frosty "o"
  ice(g, R){ glow(g, R, '#ffffff', '#7ad0ff', '#9ae0ff'); const ey = -R * .1; for (const x of [-R * .33, R * .33]){ g.beginPath(); g.ellipse(x, ey, R * .2, R * .06, 0, 0, TAU); g.fill(); } g.beginPath(); g.ellipse(0, R * .34, R * .1, R * .12, 0, 0, TAU); g.fill(); },
  // Fire: furious, slanted eyes and a jagged fanged mouth
  fire(g, R){ glow(g, R, '#fff2b0', '#ff4a10', '#ff6a1a'); const ey = -R * .08;
    for (const s of [-1, 1]){ g.beginPath(); g.moveTo(s * R * .54, ey - R * .16); g.lineTo(s * R * .12, ey + R * .02); g.lineTo(s * R * .52, ey + R * .12); g.closePath(); g.fill(); }
    g.beginPath(); g.moveTo(-R * .52, R * .2); for (let i = 0; i <= 8; i++) g.lineTo(-R * .52 + i * R * .13, R * (i % 2 ? .44 : .28)); g.lineTo(R * .52, R * .2); g.quadraticCurveTo(0, R * .64, -R * .52, R * .2); g.fill(); },
  // Grey: stoic and determined, a visor slit and a flat grim line
  grey(g, R){ glow(g, R, '#ffffff', '#c8ccd8', '#e8ecf4'); g.beginPath(); g.roundRect(-R * .52, -R * .18, R * 1.04, R * .13, R * .06); g.fill(); g.beginPath(); g.roundRect(-R * .3, R * .3, R * .6, R * .08, R * .04); g.fill(); },
  // Purple: mischievous, a wink and a sly smirk
  purple(g, R){ glow(g, R, '#ffe8ff', '#b060ff', '#c880ff'); const ey = -R * .1; tri(g, -R * .33, ey, R * .16, R * .26);
    g.beginPath(); g.moveTo(R * .16, ey); g.quadraticCurveTo(R * .33, ey - R * .14, R * .5, ey); g.quadraticCurveTo(R * .33, ey - R * .05, R * .16, ey); g.fill();
    g.beginPath(); g.moveTo(-R * .4, R * .26); g.quadraticCurveTo(R * .1, R * .5, R * .48, R * .14); g.quadraticCurveTo(R * .1, R * .36, -R * .4, R * .26); g.fill(); },
  // White: a startled ghost, hollow round eyes and an "oo" mouth
  white(g, R){ glow(g, R, '#ffffff', '#cfe0ff', '#e0ecff'); const ey = -R * .12; for (const x of [-R * .3, R * .3]){ g.beginPath(); g.ellipse(x, ey, R * .14, R * .18, 0, 0, TAU); g.fill(); } g.beginPath(); g.ellipse(0, R * .32, R * .13, R * .17, 0, 0, TAU); g.fill(); },
  // Black: a manic bomb, wide eyes and a huge toothy grin
  black(g, R){ glow(g, R, '#fff2b0', '#ff7a1a', '#ff8a2a'); const ey = -R * .14; for (const x of [-R * .32, R * .32]){ g.beginPath(); g.arc(x, ey, R * .17, 0, TAU); g.fill(); } zig(g, R, R * .12, .36, 10, .6); },
  // Deep Blue: crackling, zigzag lightning eyes and an electric grin
  blue(g, R){ glow(g, R, '#ffffff', '#6a9aff', '#9ab0ff'); const ey = -R * .1;
    for (const s of [-1, 1]){ const x = s * R * .33; g.beginPath(); g.moveTo(x - R * .18, ey - R * .08); g.lineTo(x - R * .02, ey - R * .1); g.lineTo(x - R * .08, ey + R * .02); g.lineTo(x + R * .18, ey); g.lineTo(x + R * .02, ey + R * .12); g.lineTo(x + R * .06, ey + R * .02); g.closePath(); g.fill(); }
    zig(g, R, R * .26, .2, 8, .45); },
  // Pink: sweet, heart eyes and a gentle smile
  pink(g, R){ glow(g, R, '#fff0f8', '#ff6ab8', '#ff8ac8'); const ey = -R * .12; heart(g, -R * .32, ey, R * .16); heart(g, R * .32, ey, R * .16);
    g.beginPath(); g.moveTo(-R * .3, R * .28); g.quadraticCurveTo(0, R * .56, R * .3, R * .28); g.quadraticCurveTo(0, R * .4, -R * .3, R * .28); g.fill(); },
  // Turquoise: eager, small bright dot eyes and a quick grin
  turquoise(g, R){ glow(g, R, '#f0fffe', '#3ad8cc', '#6af0e8'); const ey = -R * .1; for (const x of [-R * .26, R * .26]){ g.beginPath(); g.arc(x, ey, R * .1, 0, TAU); g.fill(); }
    g.beginPath(); g.moveTo(-R * .34, R * .22); g.quadraticCurveTo(0, R * .58, R * .34, R * .22); g.quadraticCurveTo(0, R * .34, -R * .34, R * .22); g.fill(); },
  // Brown: gruff and stubborn, heavy lowered brows and a grumpy frown
  brown(g, R){ glow(g, R, '#fff0c8', '#e0902a', '#f0a040'); const ey = -R * .06;
    for (const s of [-1, 1]){ g.beginPath(); g.moveTo(s * R * .52, ey - R * .08); g.lineTo(s * R * .14, ey - R * .02); g.lineTo(s * R * .18, ey + R * .1); g.lineTo(s * R * .5, ey + R * .08); g.closePath(); g.fill(); }
    g.beginPath(); g.moveTo(-R * .34, R * .42); g.quadraticCurveTo(0, R * .18, R * .34, R * .42); g.quadraticCurveTo(0, R * .3, -R * .34, R * .42); g.fill(); },
  // Rainbow: pure joy, star eyes and a beaming grin
  rainbow(g, R){ glow(g, R, '#ffffff', '#ffd35a', '#fff3a0'); const ey = -R * .12; star(g, -R * .32, ey, R * .19); star(g, R * .32, ey, R * .19);
    g.beginPath(); g.moveTo(-R * .5, R * .16); g.quadraticCurveTo(0, R * .82, R * .5, R * .16); g.quadraticCurveTo(0, R * .38, -R * .5, R * .16); g.fill(); },
};
/** A face function for pumpkin(): nothing while unlit, the type's carved glow when lit. */
export function faceFor(key){
  const lit = LIT_FACES[key] || LIT_FACES.green;
  return (g, R, c, isLit) => {
    if (!isLit) return;
    g.save(); CUT = true; g.translate(0, R * .02); g.scale(1.14, 1.14); lit(g, R / 1.0); g.restore();   // a dark cut rim so the face reads on pale pumpkins
    g.save(); CUT = false; lit(g, R); g.restore();
  };
}
