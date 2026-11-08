import { SFX, ensureAudio, sfxReady, sample } from './engine/audio.js';
import './style.css';
import { bestLitGroup, bestMove, collectDrop, emptyCells, groupCells, resolveMatches, slideOne, randSprout, newCell } from './engine/board.js';
import { launchGroup, damage, hitMonster } from './engine/combat.js';
import { beginNight, demoUpdate, makeDemo, startGame, update, repairWall, placeMine, endGame, useRepair, continueState, continueNight } from './engine/game.js';
import { attachInput } from './engine/input.js';
import { spawnMonster, lanesOf, TILE_P, burnMonster, applyBulwarks } from './engine/monsters.js';
import { measureCoin, resize } from './engine/render/canvas.js';
import { isBaked, atlasBytes, setBakeScale, prebake } from './engine/render/anim.js';
import { render, LIT_HALO } from './engine/render/draw.js';
import { CHARS } from './engine/render/chars.js';
import { G, LANE, bannerTimer, graves, grid, setBannerTimer, state, walls } from './engine/state.js';
import { $ } from './engine/util.js';
import { persist, save } from './save.js';
import { buildLegend, setState, syncSound, wireButtons, openPreview, openBook, renderShop, openShop } from './ui/screens.js';
import { SplashScreen } from '@capacitor/splash-screen';
import { initNative, initMoney, initBackButton } from './engine/native.js';
import { SEED_PACKS } from './data/economy.js';
import { LEVELS, isOpen, WORLD_LEVELS, RELEASE, typesForNight, NM_BASE, nmNight, NIGHTMARE_LEVELS, levelFor, WORLDS } from './data/worlds/index.js';
import { PTYPES, RAINBOW, BEIGE, lvStats } from './data/pumpkins.js';
import { upgradeCost } from './data/economy.js';
import { BOSS_NAMES, BOSS_INTRO, TYPES, ICE_ONLY, MNAME, MINTRO, VARIANTS } from './data/monsters.js';
import { QUEST_TYPES, questsFor } from './data/quests.js';
import { lightFire, lightRandomFires, fireAt, putOut, fireMarkPoints, fireFirst } from './engine/fire.js';
import { fieldY, useLantern } from './engine/game.js';
import { coachHolds } from './engine/coach.js';
import { updateHud } from './ui/hud.js';
import { GOURD, isGourd, newGourd, gourdPos, destroyGourd, gourdFill, placeGourdAtStart, bestGourdMove, gourdsOn, gourdKind, isProtected, placeGourdsAtStart, gourdSnapshot, restoreGourd, inGraveSquare, inWartSquare } from './engine/gourd.js';
import { GOURDS, setAllowSameGourd } from './data/gourds.js';
import { gourdIcon } from './engine/render/gourd.js';
import { spawnSprouts, boardScore, paintPull } from './engine/board.js';
import { ROTTEN, isRotten, rotCell, hitRule, rotSnapshot } from './engine/rot.js';
import { rotSprite, rotIcon } from './engine/render/rot.js';
import { poisonNow, fogged } from './engine/poison.js';
import { fpSwap, fpShuffle } from './engine/hollow.js';
import { FALLEN, BESTIARY } from './data/bestiary.js';
import { POTION_KINDS, potionAt, placePotion, placeRandomPotions, canDrink, drink, updatePotions, potionEveryNow, potionSnapshot, restorePotions, dropBrewMark } from './engine/potion.js';
import { potionSprite, potionIcon } from './engine/render/potion.js';
import { barrierBaked } from './engine/render/fx.js';
import { FIRE_P_RANGE } from './data/rules.js';

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
    startGame, beginNight, spawnMonster, save, LANE, launchGroup, groupCells, slideOne, bestMove, bestLitGroup, collectDrop, emptyCells, resolveMatches, SFX, ensureAudio, sfxReady, sample, repairWall, placeMine, endGame, useRepair, openPreview, openBook, LEVELS, isOpen, WORLD_LEVELS, damage, lanesOf, continueState, continueNight, isBaked, openShop, RELEASE, PTYPES, RAINBOW, BEIGE, upgradeCost, lvStats, typesForNight, randSprout, hitMonster, TILE_P, BOSS_NAMES, LIT_HALO, CHARS, atlasBytes, setBakeScale, NM_BASE, nmNight, NIGHTMARE_LEVELS,
    ...(__RELEASE__ >= 4 ? { lightFire, lightRandomFires, fireAt, putOut, fireMarkPoints, fieldY, updateHud, TYPES, burnMonster, newCell, prebake, GOURD, isGourd, newGourd, gourdPos, destroyGourd, gourdFill, placeGourdAtStart, spawnSprouts, boardScore, paintPull, update, coachHolds, fireFirst, bestGourdMove, levelFor, questsFor, QUEST_TYPES, ICE_ONLY } : {}),   // fire tiles, the Grave Gourd (Release 4)
    ...(__RELEASE__ >= 5 ? { gourdsOn, gourdKind, isProtected, placeGourdsAtStart, gourdSnapshot, restoreGourd, GOURDS, setAllowSameGourd, inGraveSquare, gourdIcon, ROTTEN, isRotten, rotCell, hitRule, rotSnapshot, rotSprite, rotIcon, poisonNow, fogged, MNAME, MINTRO, useLantern, BOSS_INTRO, fpSwap, fpShuffle, FALLEN, BESTIARY, VARIANTS } : {}),
    ...(__RELEASE__ >= 7 ? { WORLDS, POTION_KINDS, potionAt, placePotion, placeRandomPotions, canDrink, drink, updatePotions, potionEveryNow, potionSnapshot, restorePotions, dropBrewMark, potionSprite, potionIcon, FIRE_P_RANGE, applyBulwarks, inWartSquare, barrierBaked } : {}) };   // Nightmare Witchwood (Release 7): each task adds its test hooks here   // Nightmare Foggy Hollow (Release 5): each task adds its test hooks here
}
