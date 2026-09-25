import './style.css';
import { bestLitGroup, bestMove, collectDrop, emptyCells, groupCells, resolveMatches, slideOne } from './engine/board.js';
import { launchGroup } from './engine/combat.js';
import { beginNight, demoUpdate, makeDemo, startGame, update } from './engine/game.js';
import { attachInput } from './engine/input.js';
import { spawnMonster } from './engine/monsters.js';
import { measureCoin, resize } from './engine/render/canvas.js';
import { render } from './engine/render/draw.js';
import { G, LANE, bannerTimer, graves, grid, setBannerTimer, state, walls } from './engine/state.js';
import { $ } from './engine/util.js';
import { persist, save } from './save.js';
import { buildLegend, setState, syncSound, wireButtons } from './ui/screens.js';

// ---------- Loop ----------

export let last = performance.now();

export function frame(now){
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (G){
    if (state === 'play') update(dt);
    else if (G.mode === 'demo') demoUpdate(dt);
    render();
  }
  if (bannerTimer > 0 && state === 'play'){ setBannerTimer(bannerTimer - (dt)); if (bannerTimer <= 0) $('#banner').classList.remove('show'); }
  requestAnimationFrame(frame);
}

attachInput();
wireButtons();

window.addEventListener('resize', resize);

if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

makeDemo();

resize();

buildLegend();

syncSound();

setState('title');

persist();

if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measureCoin(); });

requestAnimationFrame(frame);

// Test hook for automated balance/smoke tests. Only exposed when the page is opened with ?test in the URL.

if (new URLSearchParams(location.search).has('test')){
  window.__gg = { get G(){ return G; }, get grid(){ return grid; }, get graves(){ return graves; }, get walls(){ return walls; }, get state(){ return state; },
    startGame, beginNight, spawnMonster, save, LANE, launchGroup, groupCells, slideOne, bestMove, bestLitGroup, collectDrop, emptyCells, resolveMatches };
}
