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

// Reference-style faces (owner, 2026-09-27): glowing eye shapes lit from inside, dark pupils and brows, a tiny nose, a small mouth.
const dark = (g, fn) => { if (CUT) return; g.save(); g.shadowBlur = 0; g.fillStyle = '#2a0e06'; g.strokeStyle = '#2a0e06'; g.lineCap = 'round'; g.lineJoin = 'round'; fn(); g.restore(); };
const almond = (g, x, y, w, h, tilt = 0) => { g.save(); g.translate(x, y); g.rotate(tilt); g.beginPath(); g.moveTo(-w, 0); g.quadraticCurveTo(0, -h * 2, w, 0); g.quadraticCurveTo(0, h * 1.4, -w, 0); g.closePath(); g.fill(); g.restore(); };
const pup = (g, x, y, r) => { g.beginPath(); g.ellipse(x, y, r, r * 1.15, 0, 0, TAU); g.fill(); };
const brow = (g, R, x1, y1, x2, y2, w = .07) => { g.lineWidth = R * w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
const nose = (g, R) => { g.beginPath(); g.moveTo(-R * .06, R * .12); g.lineTo(R * .06, R * .12); g.lineTo(0, R * .02); g.closePath(); g.fill(); };
/** One carved expression per pumpkin key. */
export const LIT_FACES = {
  // Green: the classic jack-o'-lantern, triangle eyes and a toothy grin
  green(g, R){ glow(g, R, '#fff6c0', '#ff9a1a', '#ffb020'); const ey = -R * .1; tri(g, -R * .33, ey, R * .17, R * .28); tri(g, R * .33, ey, R * .17, R * .28); tri(g, 0, R * .06, R * .08, R * .12); zig(g, R, R * .24, .25, 6); },
  // Yellow: greedy excitement, wide eyes looking up at the prize, a big toothy grin
  yellow(g, R){ glow(g, R, '#fffbe0', '#ffc21a', '#ffd84a'); const ey = -R * .1; for (const s of [-1, 1]) almond(g, s * R * .3, ey, R * .2, R * .15); nose(g, R);
    g.beginPath(); g.moveTo(-R * .34, R * .24); g.quadraticCurveTo(0, R * .56, R * .34, R * .24); g.quadraticCurveTo(0, R * .34, -R * .34, R * .24); g.fill();
    dark(g, () => { for (const s of [-1, 1]){ pup(g, s * R * .3, ey - R * .06, R * .07); brow(g, R, s * R * .46, ey - R * .28, s * R * .14, ey - R * .3); } g.lineWidth = R * .03; for (const x of [-R * .12, 0, R * .12]){ g.beginPath(); g.moveTo(x, R * .28); g.lineTo(x, R * .38); g.stroke(); } }); },
  // Ice: cool and unimpressed, heavy lids, level brows, a flat little mouth
  ice(g, R){ glow(g, R, '#ffffff', '#7ad0ff', '#9ae0ff'); const ey = -R * .08; for (const s of [-1, 1]) almond(g, s * R * .3, ey, R * .2, R * .12); nose(g, R);
    g.beginPath(); g.roundRect(-R * .16, R * .3, R * .32, R * .08, R * .04); g.fill();
    dark(g, () => { for (const s of [-1, 1]){ const x = s * R * .3; g.fillRect(x - R * .22, ey - R * .2, R * .44, R * .14); pup(g, x - s * R * .03, ey + R * .02, R * .065); brow(g, R, x - R * .2, ey - R * .22, x + R * .2, ey - R * .22); } }); },
  // Grey: determined, narrowed eyes under heavy straight brows, a grim set mouth
  grey(g, R){ glow(g, R, '#ffffff', '#c8ccd8', '#e8ecf4'); const ey = -R * .08; for (const s of [-1, 1]) almond(g, s * R * .3, ey, R * .2, R * .1); nose(g, R);
    g.beginPath(); g.moveTo(-R * .22, R * .34); g.lineTo(R * .22, R * .34); g.lineTo(R * .18, R * .4); g.lineTo(-R * .18, R * .4); g.closePath(); g.fill();
    dark(g, () => { for (const s of [-1, 1]){ const x = s * R * .3; pup(g, x - s * R * .04, ey, R * .06); brow(g, R, x + s * R * .22, ey - R * .2, x - s * R * .18, ey - R * .13, .09); } }); },
  // Purple: sly, one eye narrowed, pupils slid sideways, a raised brow and a crooked smirk
  purple(g, R){ glow(g, R, '#ffe8ff', '#b060ff', '#c880ff'); const ey = -R * .1; almond(g, -R * .3, ey, R * .2, R * .15); almond(g, R * .3, ey + R * .02, R * .2, R * .09); nose(g, R);
    g.beginPath(); g.moveTo(-R * .26, R * .3); g.quadraticCurveTo(R * .08, R * .46, R * .34, R * .22); g.quadraticCurveTo(R * .06, R * .36, -R * .26, R * .3); g.fill();
    dark(g, () => { pup(g, -R * .22, ey, R * .07); pup(g, R * .38, ey + R * .02, R * .06); brow(g, R, -R * .5, ey - R * .32, -R * .14, ey - R * .24); brow(g, R, R * .12, ey - R * .14, R * .48, ey - R * .2); }); },
  // White: startled, big round eyes with tiny pupils, worried brows, a small "o"
  white(g, R){ glow(g, R, '#ffffff', '#cfe0ff', '#e0ecff'); const ey = -R * .1; for (const s of [-1, 1]){ g.beginPath(); g.ellipse(s * R * .3, ey, R * .17, R * .19, 0, 0, TAU); g.fill(); } nose(g, R);
    g.beginPath(); g.ellipse(0, R * .34, R * .08, R * .1, 0, 0, TAU); g.fill();
    dark(g, () => { for (const s of [-1, 1]){ const x = s * R * .3; pup(g, x, ey + R * .02, R * .045); brow(g, R, x - s * R * .16, ey - R * .26, x + s * R * .14, ey - R * .34); } }); },
  // Deep Blue: fierce focus, sharp narrowed eyes, brows driven down, a tight crackling grin
  blue(g, R){ glow(g, R, '#ffffff', '#6a9aff', '#9ab0ff'); const ey = -R * .08; for (const s of [-1, 1]) almond(g, s * R * .3, ey, R * .2, R * .11, s * .18); nose(g, R);
    g.beginPath(); g.moveTo(-R * .28, R * .28); for (let i = 0; i <= 6; i++) g.lineTo(-R * .28 + i * R * .0933, R * (i % 2 ? .38 : .3)); g.lineTo(R * .28, R * .4); g.lineTo(-R * .28, R * .4); g.closePath(); g.fill();
    dark(g, () => { for (const s of [-1, 1]){ const x = s * R * .3; pup(g, x - s * R * .03, ey, R * .06); brow(g, R, x + s * R * .22, ey - R * .24, x - s * R * .16, ey - R * .1, .09); } }); },
  // Pink: warm and kind, soft eyes with big pupils, gentle upturned brows, a sweet smile
  pink(g, R){ glow(g, R, '#fff0f8', '#ff6ab8', '#ff8ac8'); const ey = -R * .1; for (const s of [-1, 1]) almond(g, s * R * .3, ey, R * .19, R * .15); nose(g, R);
    g.beginPath(); g.moveTo(-R * .22, R * .28); g.quadraticCurveTo(0, R * .48, R * .22, R * .28); g.quadraticCurveTo(0, R * .36, -R * .22, R * .28); g.fill();
    dark(g, () => { for (const s of [-1, 1]){ const x = s * R * .3; pup(g, x, ey - R * .01, R * .09); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - R * .03, ey - R * .05, R * .025, 0, TAU); g.fill(); g.fillStyle = '#2a0e06'; brow(g, R, x - s * R * .16, ey - R * .24, x + s * R * .14, ey - R * .3, .06); } }); },
  // Turquoise: eager, wide bright eyes looking ahead, raised brows, an open grin
  turquoise(g, R){ glow(g, R, '#f0fffe', '#3ad8cc', '#6af0e8'); const ey = -R * .1; for (const s of [-1, 1]) almond(g, s * R * .28, ey, R * .18, R * .15); nose(g, R);
    g.beginPath(); g.moveTo(-R * .28, R * .24); g.quadraticCurveTo(0, R * .54, R * .28, R * .24); g.quadraticCurveTo(0, R * .32, -R * .28, R * .24); g.fill();
    dark(g, () => { for (const s of [-1, 1]){ const x = s * R * .28; pup(g, x + s * R * .02, ey, R * .07); brow(g, R, x - R * .14, ey - R * .3, x + R * .14, ey - R * .28); } }); },
  // Fire: furious, slanted eyes and a jagged fanged mouth
  fire(g, R){ glow(g, R, '#fff2b0', '#ff4a10', '#ff6a1a'); const ey = -R * .08;
    for (const s of [-1, 1]){ g.beginPath(); g.moveTo(s * R * .54, ey - R * .16); g.lineTo(s * R * .12, ey + R * .02); g.lineTo(s * R * .52, ey + R * .12); g.closePath(); g.fill(); }
    g.beginPath(); g.moveTo(-R * .52, R * .2); for (let i = 0; i <= 8; i++) g.lineTo(-R * .52 + i * R * .13, R * (i % 2 ? .44 : .28)); g.lineTo(R * .52, R * .2); g.quadraticCurveTo(0, R * .64, -R * .52, R * .2); g.fill(); },
  // Black: a manic bomb, wide eyes and a huge toothy grin
  black(g, R){ glow(g, R, '#fff2b0', '#ff7a1a', '#ff8a2a'); const ey = -R * .14; for (const x of [-R * .32, R * .32]){ g.beginPath(); g.arc(x, ey, R * .17, 0, TAU); g.fill(); } zig(g, R, R * .12, .36, 10, .6); },
  // Brown: gruff and stubborn, heavy lowered brows and a grumpy frown
  brown(g, R){ glow(g, R, '#fff0c8', '#e0902a', '#f0a040'); const ey = -R * .06;
    for (const s of [-1, 1]){ g.beginPath(); g.moveTo(s * R * .52, ey - R * .08); g.lineTo(s * R * .14, ey - R * .02); g.lineTo(s * R * .18, ey + R * .1); g.lineTo(s * R * .5, ey + R * .08); g.closePath(); g.fill(); }
    g.beginPath(); g.moveTo(-R * .34, R * .42); g.quadraticCurveTo(0, R * .18, R * .34, R * .42); g.quadraticCurveTo(0, R * .3, -R * .34, R * .42); g.fill(); },
  // Rainbow: dazzled, huge eyes with star pupils, delighted brows, a beaming grin
  rainbow(g, R){ glow(g, R, '#ffffff', '#ffd35a', '#fff3a0'); const ey = -R * .1; for (const s of [-1, 1]) almond(g, s * R * .3, ey, R * .21, R * .17); nose(g, R);
    g.beginPath(); g.moveTo(-R * .36, R * .22); g.quadraticCurveTo(0, R * .62, R * .36, R * .22); g.quadraticCurveTo(0, R * .34, -R * .36, R * .22); g.fill();
    dark(g, () => { for (const s of [-1, 1]){ const x = s * R * .3; g.fillStyle = '#7a2ad0'; star(g, x, ey - R * .02, R * .1); g.fillStyle = '#2a0e06'; brow(g, R, x - R * .16, ey - R * .32, x + R * .16, ey - R * .34); } }); },
  // ---------- skin faces (owner, 2026-09-27): each skin's own lit expression, in the same carved / lit-eye styles ----------
  // Candy corn: sugar-rush glee, eyes wide and looking up, raised brows, a huge grin with candy teeth
  'skin:candycorn'(g, R){ glow(g, R, '#fffdf0', '#ffb030', '#ffd87a'); const ey = -R * .1; for (const s of [-1, 1]) almond(g, s * R * .3, ey, R * .21, R * .17); nose(g, R);
    g.beginPath(); g.moveTo(-R * .44, R * .18); g.quadraticCurveTo(0, R * .74, R * .44, R * .18); g.quadraticCurveTo(0, R * .34, -R * .44, R * .18); g.fill();
    dark(g, () => { for (const s of [-1, 1]){ pup(g, s * R * .3, ey - R * .06, R * .08); brow(g, R, s * R * .46, ey - R * .3, s * R * .14, ey - R * .34); } g.fillStyle = '#fff8e6'; for (const x of [-R * .2, 0, R * .2]){ g.beginPath(); g.moveTo(x - R * .06, R * .24); g.lineTo(x + R * .06, R * .24); g.lineTo(x, R * .34); g.closePath(); g.fill(); } }); },
  // Magma: the Fire carving, burning white-hot
  'skin:magma'(g, R){ glow(g, R, '#ffffe0', '#ffb000', '#ffd040'); const ey = -R * .08;
    for (const s of [-1, 1]){ g.beginPath(); g.moveTo(s * R * .56, ey - R * .18); g.lineTo(s * R * .12, ey + R * .02); g.lineTo(s * R * .54, ey + R * .12); g.closePath(); g.fill(); }
    g.beginPath(); g.moveTo(-R * .54, R * .2); for (let i = 0; i <= 8; i++) g.lineTo(-R * .54 + i * R * .135, R * (i % 2 ? .46 : .28)); g.lineTo(R * .54, R * .2); g.quadraticCurveTo(0, R * .66, -R * .54, R * .2); g.fill(); },
  // Frost crystal: serene and icy, heavy lids with frost lashes, a small calm smile
  'skin:frost'(g, R){ glow(g, R, '#ffffff', '#8ae0ff', '#c0f0ff'); const ey = -R * .08; for (const s of [-1, 1]) almond(g, s * R * .3, ey, R * .21, R * .13); nose(g, R);
    g.beginPath(); g.moveTo(-R * .16, R * .3); g.quadraticCurveTo(0, R * .42, R * .16, R * .3); g.quadraticCurveTo(0, R * .35, -R * .16, R * .3); g.fill();
    dark(g, () => { for (const s of [-1, 1]){ const x = s * R * .3; g.fillRect(x - R * .23, ey - R * .2, R * .46, R * .13); pup(g, x, ey + R * .02, R * .065); g.lineWidth = R * .03; for (const d of [-R * .12, 0, R * .12]){ g.beginPath(); g.moveTo(x + d, ey - R * .07); g.lineTo(x + d * 1.3, ey - R * .16); g.stroke(); } } }); },
  // Galaxy: dreamy wonder, huge eyes with golden star pupils, soft raised brows, a small "oh"
  'skin:galaxy'(g, R){ glow(g, R, '#ffffff', '#d890ff', '#e8b0ff'); const ey = -R * .1; for (const s of [-1, 1]) almond(g, s * R * .3, ey, R * .22, R * .18); nose(g, R);
    g.beginPath(); g.ellipse(0, R * .33, R * .08, R * .09, 0, 0, TAU); g.fill();
    dark(g, () => { for (const s of [-1, 1]){ const x = s * R * .3; g.fillStyle = '#3a1a7a'; pup(g, x, ey, R * .12); g.fillStyle = '#ffe070'; star(g, x, ey, R * .075); g.fillStyle = '#2a0e06'; brow(g, R, x - R * .16, ey - R * .32, x + R * .14, ey - R * .36, .06); } }); },
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
