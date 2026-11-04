import { SFX, ensureAudio, sfxReady, sample } from './engine/audio.js';
import './style.css';
import { bestLitGroup, bestMove, collectDrop, emptyCells, groupCells, resolveMatches, slideOne, randSprout } from './engine/board.js';
import { launchGroup, damage, hitMonster } from './engine/combat.js';
import { beginNight, demoUpdate, makeDemo, startGame, update, repairWall, placeMine, endGame, useRepair, continueState, continueNight } from './engine/game.js';
import { attachInput } from './engine/input.js';
import { spawnMonster, lanesOf, TILE_P } from './engine/monsters.js';
import { measureCoin, resize } from './engine/render/canvas.js';
import { isBaked, atlasBytes, setBakeScale } from './engine/render/anim.js';
import { render, LIT_HALO } from './engine/render/draw.js';
import { CHARS } from './engine/render/chars.js';
import { G, LANE, bannerTimer, graves, grid, setBannerTimer, state, walls } from './engine/state.js';
import { $ } from './engine/util.js';
import { persist, save } from './save.js';
import { buildLegend, setState, syncSound, wireButtons, openPreview, openBook, renderShop, openShop } from './ui/screens.js';
import { SplashScreen } from '@capacitor/splash-screen';
import { initNative, initMoney, initBackButton } from './engine/native.js';
import { SEED_PACKS } from './data/economy.js';
import { LEVELS, isOpen, WORLD_LEVELS, RELEASE, typesForNight, NM_BASE, nmNight, NIGHTMARE_LEVELS } from './data/worlds/index.js';
import { PTYPES, RAINBOW, BEIGE, lvStats } from './data/pumpkins.js';
import { upgradeCost } from './data/economy.js';
import { BOSS_NAMES } from './data/monsters.js';

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
initNative();   // the phone app: native save copy (no-op in a browser)
initMoney(SEED_PACKS.map(p => p.sku), () => { try { renderShop(); } catch (e) {} });   // real rewarded ads and seed packs in the app
initBackButton(() => state);   // Android's Back button
if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()){   // the iPhone app: keep the launch image up until the title screen has drawn
  document.documentElement.classList.add('native');
  requestAnimationFrame(() => requestAnimationFrame(() => SplashScreen.hide().catch(() => {})));
}

persist();

if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measureCoin(); });

requestAnimationFrame(frame);

// Test hook for automated balance/smoke tests. Only exposed when the page is opened with ?test in the URL.

if (new URLSearchParams(location.search).has('test')){
  window.__gg = { get G(){ return G; }, get grid(){ return grid; }, get graves(){ return graves; }, get walls(){ return walls; }, get state(){ return state; },
    startGame, beginNight, spawnMonster, save, LANE, launchGroup, groupCells, slideOne, bestMove, bestLitGroup, collectDrop, emptyCells, resolveMatches, SFX, ensureAudio, sfxReady, sample, repairWall, placeMine, endGame, useRepair, openPreview, openBook, LEVELS, isOpen, WORLD_LEVELS, damage, lanesOf, continueState, continueNight, isBaked, openShop, RELEASE, PTYPES, RAINBOW, BEIGE, upgradeCost, lvStats, typesForNight, randSprout, hitMonster, TILE_P, BOSS_NAMES, LIT_HALO, CHARS, atlasBytes, setBakeScale, NM_BASE, nmNight, NIGHTMARE_LEVELS };
}
