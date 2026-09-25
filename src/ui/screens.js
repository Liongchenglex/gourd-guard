import { SPAWN_STEPS } from '../data/patterns.js';
import { LV_COST, NTYPES, PTYPES, lvDesc, pct } from '../data/pumpkins.js';
import { GEAR } from '../data/shop.js';
import { LEVELS, WORLDS, WORLD_LEVELS, WORLD_NAMES, ALL_LEVELS, isOpen, highestOpen, unlockNightOf, levelFor, firstNightOf } from '../data/worlds/index.js';
import { SFX, ensureAudio } from '../engine/audio.js';
import { beginEndless, beginNight, makeDemo, startGame, useFirework, useRepair, useBuster } from '../engine/game.js';
import { bgWorld, buildBg, pumpkinIcon } from '../engine/render/sprites.js';
import { G, setBannerTimer, setGest, setStateRaw, state } from '../engine/state.js';
import { $, clamp } from '../engine/util.js';
import { wallFrac } from '../engine/walls.js';
import { lvOf, persist, save } from '../save.js';
import { setHudSig, updateHud } from './hud.js';

export function showResult(win){
  const g = G, box = $('#rBtns'); box.innerHTML = '';
  const stats = [];
  let title = '', msg = '', stars = '';
  const wf = wallFrac();
  if (g.mode === 'story'){
    if (win){
      const st = wf >= 0.85 ? 3 : wf >= 0.5 ? 2 : 1;
      const bonus = 10 + g.n * 3 + st * 5;
      save.coins += g.coins + bonus;
      save.stars[g.n] = Math.max(save.stars[g.n] || 0, st);
      save.unlocked = Math.max(save.unlocked || 1, highestOpen());
      title = g.n === LEVELS ? 'Dawn at last' : 'Night saved';
      msg = g.n === LEVELS ? 'Every night is safe. The patch thanks you.' : st === 3 ? 'The walls barely have a scratch.' : 'The walls held. Keep them healthier for more stars.';
      const nk = ALL_LEVELS[g.n] && (ALL_LEVELS[g.n].unlockPumpkins || [])[0], nextP = nk && PTYPES.find(p => p.key === nk);
      if (nextP && g.n < LEVELS) msg += ` Next night unlocks the ${nextP.name} pumpkin.`;
      if (g.def.levelNo === 10) msg += ' The rest of this world is open, and the next world will follow.';
      stars = [0,1,2].map(i => `<span class="${i < st ? '' : 'off'}">★</span>`).join('');
      stats.push(['Monsters stopped', g.kills], ['Walls left', pct(wf)], ['Coins found', g.coins], ['Night bonus', bonus]);
      if (g.n < LEVELS) addBtn(box, 'Next night', () => beginNight(g.n + 1));
      addBtn(box, 'Shop', () => openShop('result'), 'alt');
      addBtn(box, 'Levels', openLevels, 'alt');
    } else {
      save.coins += g.coins;
      title = 'A wall fell';
      msg = 'The monsters broke through. Your coins are kept, and the shop can make your pumpkins and walls stronger.';
      stats.push(['Monsters stopped', g.kills], ['Coins found', g.coins]);
      addBtn(box, 'Try again', () => beginNight(g.n));
      addBtn(box, 'Shop', () => openShop('result'), 'alt');
      addBtn(box, 'Levels', openLevels, 'alt');
    }
  } else {
    save.coins += g.coins;
    const isBest = g.score > save.best; if (isBest) save.best = g.score;
    title = isBest ? 'New best!' : 'Night over';
    msg = `You held the walls for ${fmtTime(g.t)}.`;
    stats.push(['Score', g.score.toLocaleString()], ['Best', save.best.toLocaleString()], ['Monsters stopped', g.kills], ['Coins found', g.coins]);
    addBtn(box, 'Play again', beginEndless);
    addBtn(box, 'Shop', () => openShop('result'), 'alt');
    addBtn(box, 'Menu', () => setState('title'), 'alt');
  }
  persist();
  $('#rTitle').textContent = title; $('#rMsg').textContent = msg;
  $('#rStars').innerHTML = stars; $('#rStars').style.display = stars ? '' : 'none';
  $('#rStats').innerHTML = stats.map(([a, b]) => `<span>${a}</span><span>${b}</span>`).join('');
  setState('result');
}

export function fmtTime(s){ const m = Math.floor(s / 60), r = Math.floor(s % 60); return m ? `${m}m ${r}s` : `${r}s`; }

export function addBtn(box, label, fn, cls){ const b = document.createElement('button'); b.className = 'btn small' + (cls ? ' ' + cls : ''); b.textContent = label; b.onclick = () => { ensureAudio(); fn(); }; box.appendChild(b); }

// ---------- UI ----------

export const OVS = { title:'#ovTitle', levels:'#ovLevels', loadout:'#ovLoadout', shop:'#ovShop', help:'#ovHelp', pause:'#ovPause', result:'#ovResult' };

export let shopReturn = 'levels', helpNext = null, loadoutNext = null, loadoutAvail = [], loadoutSel = new Set();

export function setState(s){
  setStateRaw(s);
  for (const [k, sel] of Object.entries(OVS)) $(sel).classList.toggle('show', k === s);
  $('#hud').classList.toggle('on', s === 'play' || s === 'pause');
  if (s === 'title'){
    if (!G || G.mode !== 'demo') makeDemo();
    if (bgWorld !== 0) buildBg(0);
    $('#bestTxt').textContent = save.best ? `Best endless score: ${save.best.toLocaleString()}` : '';
  }
  if (s !== 'play'){ setGest(null); $('#banner').classList.remove('show'); setBannerTimer(0); }
  if (s === 'pause') syncSpawn();
  syncSound();
  setHudSig('');
  if (s === 'play' || s === 'pause') updateHud(true);
  const ov = OVS[s] ? $(OVS[s]) : null, first = ov && ov.querySelector('button:not([disabled])');
  if (first && matchMedia('(pointer:fine)').matches) first.focus({ preventScroll:true });
}

export function withHelp(fn){ if (!save.seenHelp){ helpNext = fn; save.seenHelp = true; persist(); setState('help'); } else fn(); }

export function openLevels(){
  $('#lvCoins').textContent = save.coins.toLocaleString();
  const list = $('#lvList'); list.innerHTML = '';
  WORLD_NAMES.forEach((name, wi) => {
    const levels = WORLD_LEVELS[wi];
    const sec = document.createElement('div'); sec.className = 'world';
    sec.innerHTML = `<h3>World ${wi + 1}: ${name}</h3>`;
    if (!levels.length){ sec.innerHTML += '<p class="soon">Coming soon.</p>'; list.appendChild(sec); return; }
    const start = firstNightOf(wi + 1);
    const row = document.createElement('div'); row.className = 'lv-row';
    levels.forEach((d, i) => {
      const n = start + i, locked = !isOpen(n), st = save.stars[n] || 0;
      const b = document.createElement('button'); b.className = 'lv' + (d.boss ? ' boss' : '');
      b.disabled = locked;
      b.setAttribute('aria-label', locked ? `Level ${d.world}-${d.level}, locked` : `Level ${d.world}-${d.level}, ${st} of 3 stars`);
      b.innerHTML = locked ? `<span>🔒</span><small></small>` : `<span>${d.boss ? '💀' : d.level}</span><small>${'★'.repeat(st)}${'<span style="opacity:.25">★</span>'.repeat(3 - st)}</small>`;
      b.onclick = () => withHelp(() => beginNight(n));
      row.appendChild(b);
    });
    sec.appendChild(row); list.appendChild(sec);
  });
  setState('levels');
}

export function openLoadout(avail, next){
  loadoutAvail = avail; loadoutNext = next;
  const pref = (save.loadout || []).filter(t => avail.includes(t));
  for (const t of avail) if (pref.length < 5 && !pref.includes(t)) pref.push(t);
  loadoutSel = new Set(pref.slice(0, 5));
  const box = $('#picks'); box.innerHTML = '';
  for (const t of avail){
    const b = document.createElement('button'); b.className = 'pick';
    b.appendChild(pumpkinIcon(t, true));
    const nm = document.createElement('b'); nm.textContent = PTYPES[t].name; b.appendChild(nm);
    const sm = document.createElement('small'); sm.textContent = `Level ${lvOf(t)}`; b.appendChild(sm);
    b.title = PTYPES[t].role;
    b.onclick = () => {
      if (loadoutSel.has(t)) loadoutSel.delete(t);
      else if (loadoutSel.size < 5) loadoutSel.add(t);
      syncLoadout();
    };
    b.dataset.t = t; box.appendChild(b);
  }
  syncLoadout();
  setState('loadout');
}

export function syncLoadout(){
  for (const b of document.querySelectorAll('#picks .pick')) b.setAttribute('aria-pressed', loadoutSel.has(+b.dataset.t) ? 'true' : 'false');
  const n = loadoutSel.size;
  $('#loCount').textContent = n === 5 ? 'Ready.' : `${n} of 5 picked`;
  $('#bLoGo').disabled = n !== 5;
}

export function openShop(ret){ shopReturn = ret || 'levels'; renderShop(); setState('shop'); }

export function renderShop(){
  $('#shopCoins').textContent = save.coins.toLocaleString();
  const pbox = $('#shopPumpkins'); pbox.innerHTML = '';
  for (let t = 0; t < NTYPES; t++){
    const P = PTYPES[t], L = lvOf(t), un = unlockNightOf(P.key), unlocked = t < 2 || un <= highestOpen(), maxed = L >= 5, cost = LV_COST[L - 1];
    const d = document.createElement('div'); d.className = 'item';
    const ic = pumpkinIcon(t, true); ic.className = 'ic'; d.appendChild(ic);
    const tx = document.createElement('div'); tx.className = 'tx';
    const pips = Array.from({ length:5 }, (_, i) => `<i class="${i < L ? 'on' : ''}"></i>`).join('');
    tx.innerHTML = `<b>${P.name} pumpkin, level ${L}</b><p>Now: ${lvDesc(t, L)}.${maxed ? '' : ` Next: ${lvDesc(t, L + 1)}.`}</p><div class="pips" aria-label="Level ${L} of 5">${pips}</div>`;
    d.appendChild(tx);
    const b = document.createElement('button'); b.className = 'btn small';
    if (!unlocked){ b.textContent = un === Infinity ? 'Later world' : `Level ${levelFor(un).label}`; b.disabled = true; }
    else if (maxed){ b.textContent = 'Maxed'; b.disabled = true; }
    else { b.innerHTML = `<span class="coin"></span>${cost}`; b.disabled = save.coins < cost; b.setAttribute('aria-label', `Level up ${P.name} for ${cost} coins`); }
    b.onclick = () => {
      if (!unlocked || maxed || save.coins < cost) return;
      save.coins -= cost; save.lv[P.key] = L + 1; persist(); ensureAudio(); SFX.coin(); renderShop();
    };
    d.appendChild(b); pbox.appendChild(d);
  }
  const list = $('#shopList'); list.innerHTML = '';
  for (const it of GEAR){
    const lvl = save[it.key], maxed = lvl >= it.max;
    const cost = it.consumable ? it.cost[0] : it.cost[lvl];
    const d = document.createElement('div'); d.className = 'item';
    const pips = Array.from({ length:it.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
    d.innerHTML = `<div class="ic" aria-hidden="true">${it.icon}</div><div class="tx"><b>${it.name}</b><p>${it.desc}</p><div class="pips" aria-label="${lvl} of ${it.max}">${pips}</div></div>`;
    const b = document.createElement('button'); b.className = 'btn small';
    if (maxed){ b.textContent = it.consumable ? 'Full' : 'Maxed'; b.disabled = true; }
    else { b.innerHTML = `<span class="coin"></span>${cost}`; b.disabled = save.coins < cost; b.setAttribute('aria-label', `Buy ${it.name} for ${cost} coins`); }
    b.onclick = () => {
      if (save.coins < cost || save[it.key] >= it.max) return;
      save.coins -= cost; save[it.key]++; persist(); ensureAudio(); SFX.coin(); renderShop();
    };
    d.appendChild(b); list.appendChild(d);
  }
}

export function buildLegend(){
  const box = $('#legend'); box.innerHTML = '';
  PTYPES.forEach((p, i) => {
    const row = document.createElement('div');
    row.appendChild(pumpkinIcon(i, true));
    const t = document.createElement('span');
    const un = p.rainbow ? 1 : unlockNightOf(p.key);
    t.innerHTML = `<b>${p.name}</b> ${p.role}${p.rainbow ? ' (rare)' : un === Infinity ? ' (a later world)' : un > 1 ? ` (from level ${levelFor(un).label})` : ''}`;
    row.appendChild(t); box.appendChild(row);
  });
}

export function syncSound(){ const t = `Sound: ${save.muted ? 'off' : 'on'}`; $('#bSoundT').textContent = t; $('#bSoundP').textContent = t; }

export function toggleSound(){ save.muted = !save.muted; persist(); ensureAudio(); syncSound(); }

export function syncSpawn(){
  const i = SPAWN_STEPS.indexOf(save.spawnEvery);
  $('#spVal').textContent = save.spawnEvery + 's';
  $('#spMinus').disabled = i <= 0; $('#spPlus').disabled = i >= SPAWN_STEPS.length - 1;
}

export function stepSpawn(d){
  const i = clamp(SPAWN_STEPS.indexOf(save.spawnEvery) + d, 0, SPAWN_STEPS.length - 1);
  save.spawnEvery = SPAWN_STEPS[i]; persist(); syncSpawn();
}

export function wireButtons(){
  $('#bStory').onclick = () => { ensureAudio(); openLevels(); };

  $('#bEndless').onclick = () => { ensureAudio(); withHelp(beginEndless); };

  $('#bHelpT').onclick = () => { helpNext = () => setState('title'); setState('help'); };

  $('#bHelpOk').onclick = () => { ensureAudio(); const f = helpNext || (() => setState('title')); helpNext = null; f(); };

  $('#bSoundT').onclick = toggleSound; $('#bSoundP').onclick = toggleSound;

  $('#spMinus').onclick = () => stepSpawn(-1); $('#spPlus').onclick = () => stepSpawn(1);

  $('#bLvBack').onclick = () => setState('title');

  $('#bLvShop').onclick = () => openShop('levels');

  $('#bLoBack').onclick = () => openLevels();

  $('#bLoGo').onclick = () => { if (loadoutSel.size !== 5) return; const lo = loadoutAvail.filter(t => loadoutSel.has(t)); save.loadout = lo; persist(); const f = loadoutNext; loadoutNext = null; if (f) f(lo); };

  $('#bShopBack').onclick = () => { if (shopReturn === 'result') setState('result'); else openLevels(); };

  $('#pauseBtn').onclick = () => { if (state === 'play' && !G.over) setState('pause'); };

  $('#fwBtn').onclick = useFirework;
  $('#gbBtn').onclick = useBuster;

  $('#rpBtn').onclick = useRepair;

  $('#bResume').onclick = () => setState('play');

  $('#bRestart').onclick = () => { save.coins += G.coins; persist(); if (G.mode === 'story') startGame('story', G.n, G.loadout); else startGame('endless', 1, G.loadout); };

  $('#bQuit').onclick = () => { save.coins += G.coins; if (G.mode === 'endless' && G.score > save.best) save.best = G.score; persist(); setState('title'); };
}
