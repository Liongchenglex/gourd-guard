import { buildBg, buildSprites } from './sprites.js';
import { G, H, W, layout, setH } from '../state.js';
import { $, clamp } from '../util.js';

// ---------- Canvas / sizing ----------

export const wrap = $('#wrap'), cv = $('#cv'), ctx = cv.getContext('2d');

export let scale = 1, dpr = 1, K = 1;

export let coinTarget = { x:W - 150, y:36 };

export function resize(){
  let aw = Math.max(200, document.body.clientWidth), ah = Math.max(300, document.body.clientHeight);
  if (aw > ah * 0.8){ aw -= 32; ah -= 32; }
  setH(Math.round(clamp(ah / aw * W, 900, 1200)));
  layout();
  scale = Math.min(aw / W, ah / H);
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  K = scale * dpr;
  wrap.style.width = (W * scale) + 'px';
  wrap.style.height = (H * scale) + 'px';
  wrap.style.setProperty('--u', scale.toFixed(4));
  wrap.classList.toggle('framed', aw - W * scale > 24 || ah - H * scale > 24 || document.body.clientWidth > ah * 0.8);
  cv.width = Math.round(W * K); cv.height = Math.round(H * K);
  buildSprites();
  buildBg(G ? G.world : 0);
  requestAnimationFrame(measureCoin);
}

export function measureCoin(){
  const a = $('#coinBox .coin').getBoundingClientRect(), b = wrap.getBoundingClientRect();
  if (a.width) coinTarget = { x:(a.left + a.width / 2 - b.left) / scale, y:(a.top + a.height / 2 - b.top) / scale };
}
