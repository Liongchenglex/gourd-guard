import { PERKS, perkEarned, perkOn, perkNight } from '../data/perks.js';
import { SPAWN_STEPS } from '../data/patterns.js';
import { LV_COST, NTYPES, PTYPES, lvDesc, pct } from '../data/pumpkins.js';
import { GEAR } from '../data/shop.js';
import { LEVELS, WORLDS, WORLD_LEVELS, WORLD_NAMES, ALL_LEVELS, isOpen, highestOpen, unlockNightOf, levelFor, firstNightOf, typesForNight, gearUnlockNightOf } from '../data/worlds/index.js';
import { MNAME, MINTRO, BOSS_INTRO, BOSS_NAMES, GRAVES_INTRO, FOG_INTRO, CASTLE_INTRO, PUDDLE_INTRO, SEA_INTRO, WIND_INTRO, VARIANTS } from '../data/monsters.js';
import { monsterIcon } from '../engine/render/monsters.js';
import { poolKey, prebakeAsync } from '../engine/render/anim.js';
import { SFX, ensureAudio, musicStop, musicSync, musicStart } from '../engine/audio.js';
import { beginEndless, beginNight, makeDemo, startGame, useFirework, useRepair, useBuster, useLantern, useMine, useBomb, useScarecrow } from '../engine/game.js';
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
      const perk = PERKS.find(p => perkNight(p) === g.n);
      if (perk){ msg += ` Perk unlocked: ${perk.name}. ${perk.desc} (Switch it off in the pause menu if you prefer.)`; SFX.perk(); }
      stars = [0,1,2].map(i => `<span class="${i < st ? '' : 'off'}">★</span>`).join('');
      stats.push(['Monsters stopped', g.kills], ['Walls left', pct(wf)], ['Coins found', g.coins], ['Night bonus', bonus]);
      if (g.n < LEVELS) addBtn(box, 'Next level', () => openPreview(g.n + 1));
      addBtn(box, 'Shop', () => openShop('result'), 'alt');
      addBtn(box, 'Levels', openLevels, 'alt');
    } else {
      save.coins += g.coins;
      title = 'A wall fell';
      msg = 'The monsters broke through. Your coins are kept, and the shop can make your pumpkins and walls stronger.';
      stats.push(['Monsters stopped', g.kills], ['Coins found', g.coins]);
      addBtn(box, 'Try again', () => openPreview(g.n));
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

export const OVS = { title:'#ovTitle', levels:'#ovLevels', loadout:'#ovLoadout', shop:'#ovShop', help:'#ovHelp', pause:'#ovPause', result:'#ovResult', preview:'#ovPreview', intro:'#ovIntro' };

export let shopReturn = 'levels', helpNext = null, loadoutNext = null, loadoutAvail = [], loadoutSel = new Set(), loadoutMust = [], loadoutWhy = [];

export function setState(s){
  if (s === 'title' || s === 'levels' || s === 'loadout' || s === 'shop' || s === 'help') musicStart('menu');   // lobby track behind every menu (owner); startGame swaps in the world track
  setStateRaw(s);
  for (const [k, sel] of Object.entries(OVS)) $(sel).classList.toggle('show', k === s);
  $('#hud').classList.toggle('on', s === 'play' || s === 'pause');
  $('#tools').classList.toggle('on', s === 'play' || s === 'pause');
  if (s === 'title'){
    if (!G || G.mode !== 'demo') makeDemo();
    if (bgWorld !== 0) buildBg(0);
    $('#bestTxt').textContent = save.best ? `Best endless score: ${save.best.toLocaleString()}` : '';
  }
  if (s !== 'play'){ setGest(null); $('#banner').classList.remove('show'); setBannerTimer(0); }
  if (s === 'pause'){ syncSpawn(); renderPerks(); }
  syncSound();
  setHudSig('');
  if (s === 'play' || s === 'pause') updateHud(true);
  const ov = OVS[s] ? $(OVS[s]) : null, first = ov && ov.querySelector('button:not([disabled])');
  if (first && matchMedia('(pointer:fine)').matches) first.focus({ preventScroll:true });
}

export function withHelp(fn){ if (!save.seenHelp){ helpNext = fn; save.seenHelp = true; persist(); setState('help'); } else fn(); }

let previewNight = 1, introQueue = [], introNext = null;

/** Pre-level card (owner request, 2026-09-25): which monsters, the boss, your pumpkins, graves. Start goes through unseen intros first. */
export function openPreview(n){
  previewNight = n;
  const def = levelFor(n), prevGraves = n > 1 ? levelFor(n - 1).graves : 0;
  $('#pvTitle').textContent = `Level ${def.label}`;
  $('#pvSub').textContent = WORLD_NAMES[def.worldNo - 1];
  const mons = $('#pvMonsters'); mons.innerHTML = '';
  prebakeAsync([...def.pool.map(([t]) => poolKey(t, VARIANTS)), ...(def.boss ? [def.boss] : []), 'ghoul']);   // bake this level's sprite strips while the card is read
  for (const [t] of def.pool){
    const d = document.createElement('div'); d.className = 'pv-ic';
    d.appendChild(monsterIcon(t, 108));
    const sm = document.createElement('small'); sm.textContent = VARIANTS[t] ? VARIANTS[t].name : (MNAME[t] || t); d.appendChild(sm);
    if (def.intro.includes(t) && !VARIANTS[t]){ const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = 'NEW'; d.appendChild(tag); }
    mons.appendChild(d);
  }
  $('#pvBossBlock').hidden = !def.boss;
  const bb = $('#pvBoss'); bb.innerHTML = '';
  if (def.boss){
    const d = document.createElement('div'); d.className = 'pv-ic big';
    d.appendChild(monsterIcon(def.boss, 160));
    const sm = document.createElement('small'); sm.textContent = `${BOSS_NAMES[def.boss]}${def.bossForm === 2 ? ', full form' : ''}`; d.appendChild(sm);
    bb.appendChild(d);
  }
  const pk = $('#pvPumpkins'); pk.innerHTML = '';   // only what this level unlocks (owner): a pumpkin or a tool
  for (const key of def.unlockPumpkins){
    const t = PTYPES.findIndex(p => p.key === key); if (t < 0) continue;
    const d = document.createElement('div'); d.className = 'pv-ic';
    d.appendChild(pumpkinIcon(t, true));
    const sm = document.createElement('small'); sm.textContent = `${PTYPES[t].name} pumpkin`; d.appendChild(sm);
    pk.appendChild(d);
  }
  for (const key of def.introPumpkins){   // explained, not unlocked (rainbow)
    const t = PTYPES.findIndex(p => p.key === key); if (t < 0) continue;
    const d = document.createElement('div'); d.className = 'pv-ic';
    d.appendChild(pumpkinIcon(t, true));
    const sm = document.createElement('small'); sm.textContent = `${PTYPES[t].name} pumpkin`; d.appendChild(sm);
    pk.appendChild(d);
  }
  for (const key of def.unlockGear){
    const g = GEAR.find(x => x.key === key); if (!g) continue;
    const d = document.createElement('div'); d.className = 'pv-ic';
    const ic = document.createElement('div'); ic.className = 'pv-emoji'; ic.textContent = g.icon; d.appendChild(ic);
    const sm = document.createElement('small'); sm.textContent = g.name; d.appendChild(sm);
    pk.appendChild(d);
  }
  $('#pvNewBlock').hidden = !pk.childElementCount;
  const info = [];   // no counts here (owner): just what is special
  if (def.boss) info.push('Monsters keep coming until the boss falls.');
  if (def.levelNo === 10){ const nextName = WORLD_NAMES[def.worldNo]; info.push(`🎁 Reward: levels 11–20${nextName && WORLD_LEVELS[def.worldNo] && WORLD_LEVELS[def.worldNo].length ? ` and World ${def.worldNo + 1}: ${nextName}` : ''}.`); }
  if (def.levelNo === 20){ const perk = PERKS.find(p => perkNight(p) === n); if (perk) info.push(`🎁 Reward: ${perk.name}. ${perk.desc}`); }
  if (def.name) $('#pvSub').textContent = `${WORLD_NAMES[def.worldNo - 1]} · ${def.name}`;
  if (def.shore) info.push(`The shoreline has moved ${def.shore} rows down the field.`);
  else if (def.sea) info.push('The sea reaches the top of the field.');
  $('#pvInfo').textContent = info.join(' ');
  setState('preview');
}

/** Intro cards for anything the player has not met yet on night n, then start the night. */
function startPreviewedNight(){
  const n = previewNight, def = levelFor(n), prevGraves = n > 1 ? levelFor(n - 1).graves : 0;
  const cards = [];
  for (const key of def.unlockPumpkins){
    const t = PTYPES.findIndex(p => p.key === key);
    if (t >= 0) cards.push({ key:'p:' + key, icon:pumpkinIcon(t, true), title:`New pumpkin: ${PTYPES[t].name}`, text:`It ${PTYPES[t].role}. Bunch three or more to throw it.` });
  }
  for (const key of def.introPumpkins){
    const t = PTYPES.findIndex(p => p.key === key);
    if (t >= 0) cards.push({ key:'p:' + key, icon:pumpkinIcon(t, true), title:`${PTYPES[t].name} pumpkin`, text:PTYPES[t].rainbow ? 'Rare: it joins any bunch as any colour, and can even sit in two bunches at once. Look out for it among sprouts and drops.' : `It ${PTYPES[t].role}.` });
  }
  for (const key of def.unlockGear){
    const g = GEAR.find(x => x.key === key);
    if (g) cards.push({ key:'g:' + key, icon:g.icon, title:`New tool: ${g.name}`, text:`${g.desc} You get one to start with. More drop from monsters and sell in the shop.` });
  }
  if (def.graves && !prevGraves) cards.push({ key:'graves', icon:'🪦', title:'Graves', text:GRAVES_INTRO });
  if (def.fog.length && !(n > 1 && levelFor(n - 1).fog.length)) cards.push({ key:'fog', icon:'🌫️', title:'Fog', text:FOG_INTRO });
  if (def.castles && !(n > 1 && levelFor(n - 1).castles)) cards.push({ key:'castles', icon:'🏰', title:'Castle walls', text:CASTLE_INTRO });
  if (def.puddles && !(n > 1 && levelFor(n - 1).puddles)) cards.push({ key:'puddles', icon:'💧', title:'Puddles', text:PUDDLE_INTRO });
  if (def.sea && !(n > 1 && levelFor(n - 1).sea)) cards.push({ key:'sea', icon:'🌊', title:'The sea row', text:SEA_INTRO });
  if (def.gust && !(n > 1 && levelFor(n - 1).gust)) cards.push({ key:'wind', icon:'🍂', title:'Wind', text:WIND_INTRO });
  for (const t of def.intro) if (!VARIANTS[t]) cards.push({ key:'m:' + t, icon:monsterIcon(t, 160), title:`New monster: ${MNAME[t] || t}`, text:MINTRO[t] || '' });   // returning variants get no card (owner)
  if (def.boss) cards.push({ key:`b:${def.boss}:${def.bossForm}`, icon:monsterIcon(def.boss, 200), title:def.bossForm === 2 ? `${BOSS_NAMES[def.boss]}, full form` : `Boss: ${BOSS_NAMES[def.boss]}`, text:BOSS_INTRO[def.boss][def.bossForm] });
  introQueue = cards.filter(c => !save.seenIntro[c.key]);
  introNext = () => beginNight(n);
  showNextIntro();
}
function showNextIntro(){
  const card = introQueue.shift();
  if (!card){ const f = introNext; introNext = null; if (f) f(); return; }
  save.seenIntro[card.key] = true; persist();
  const ic = $('#inIcon'); ic.innerHTML = '';
  if (typeof card.icon === 'string') ic.textContent = card.icon; else ic.appendChild(card.icon);
  $('#inTitle').textContent = card.title; $('#inText').textContent = card.text;
  setState('intro');
}

/** Pause menu: earned level-20 perks with on/off toggles. */
export function renderPerks(){
  const box = $('#perkList'); box.innerHTML = '';
  for (const p of PERKS){
    if (!perkEarned(p.key)) continue;
    const on = perkOn(p.key);
    const b = document.createElement('button'); b.className = 'btn small' + (on ? '' : ' alt'); b.textContent = `${p.name}: ${on ? 'on' : 'off'}`; b.title = p.desc;
    b.onclick = () => { save.perksOff[p.key] = on; persist(); renderPerks(); };
    box.appendChild(b);
  }
}
export function openLevels(){
  $('#lvCoins').textContent = save.coins.toLocaleString();
  $('#bUnlockAll').textContent = save.testUnlock ? 'Testing: relock levels' : 'Testing: unlock all levels';
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
      b.onclick = () => withHelp(() => openPreview(n));
      row.appendChild(b);
    });
    sec.appendChild(row); list.appendChild(sec);
  });
  setState('levels');
}

export function openLoadout(avail, next, required){
  loadoutAvail = avail; loadoutNext = next; loadoutMust = (required || []).map(m => m.t); loadoutWhy = required || [];
  const pref = [...loadoutMust, ...(save.loadout || []).filter(t => avail.includes(t) && !loadoutMust.includes(t))];
  for (const t of avail) if (pref.length < 5 && !pref.includes(t)) pref.push(t);
  loadoutSel = new Set(pref.slice(0, 5));
  const box = $('#picks'); box.innerHTML = '';
  for (const t of avail){
    const b = document.createElement('button'); b.className = 'pick';
    b.appendChild(pumpkinIcon(t, true));
    const nm = document.createElement('b'); nm.textContent = PTYPES[t].name; b.appendChild(nm);
    const sm = document.createElement('small'); sm.textContent = `Level ${lvOf(t)}`; b.appendChild(sm);
    b.title = PTYPES[t].role;
    if (loadoutMust.includes(t)){ const why = loadoutWhy.find(m => m.t === t).why, tag = document.createElement('span'); tag.className = 'tag' + (why === 'New this level' ? '' : ' info'); tag.textContent = why === 'New this level' ? 'NEW' : 'i'; tag.title = why; b.appendChild(tag); b.classList.add('must'); }
    b.onclick = () => {
      if (loadoutMust.includes(t)) return;   // introduced this level: stays in (the tap sound says so)
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
  const min = perkOn('pick4') ? 4 : 5;   // 5-20 perk: four colours are enough
  $('#loCount').textContent = n >= min ? 'Ready.' : `${n} of ${min} picked`;
  $('#bLoGo').disabled = n < min;
  const why = loadoutWhy.filter(w => w.why !== 'New this level').map(w => `${PTYPES[w.t].name} is locked in: ${w.why.toLowerCase()}.`).join(' ');
  $('#loWhy').textContent = why; $('#loWhy').hidden = !why;
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
    const lvl = save[it.key] || 0, maxed = lvl >= it.max;
    const cost = it.consumable ? it.cost[0] : it.cost[lvl];
    const gu = it.consumable ? gearUnlockNightOf(it.key) : 1, gLocked = gu > highestOpen();
    const d = document.createElement('div'); d.className = 'item';
    const pips = Array.from({ length:it.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
    d.innerHTML = `<div class="ic" aria-hidden="true">${it.icon}</div><div class="tx"><b>${it.name}</b><p>${it.desc}</p><div class="pips" aria-label="${lvl} of ${it.max}">${pips}</div></div>`;
    const b = document.createElement('button'); b.className = 'btn small';
    if (gLocked){ b.textContent = gu === Infinity ? 'Later world' : `Level ${levelFor(gu).label}`; b.disabled = true; }
    else if (maxed){ b.textContent = it.consumable ? 'Full' : 'Maxed'; b.disabled = true; }
    else { b.innerHTML = `<span class="coin"></span>${cost}`; b.disabled = save.coins < cost; b.setAttribute('aria-label', `Buy ${it.name} for ${cost} coins`); }
    b.onclick = () => {
      if (gLocked || save.coins < cost || save[it.key] >= it.max) return;
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

export function toggleSound(){ save.muted = !save.muted; persist(); ensureAudio(); musicSync(); syncSound(); }

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
  $('#bUnlockAll').onclick = () => { save.testUnlock = !save.testUnlock; persist(); openLevels(); };   // TESTING ONLY: remove before release

  $('#bLoBack').onclick = () => openLevels();

  $('#bLoGo').onclick = () => { if (loadoutSel.size < (perkOn('pick4') ? 4 : 5)) return; const lo = loadoutAvail.filter(t => loadoutSel.has(t)); save.loadout = lo; persist(); const f = loadoutNext; loadoutNext = null; if (f) f(lo); };

  $('#bShopBack').onclick = () => { if (shopReturn === 'result') setState('result'); else openLevels(); };

  $('#pauseBtn').onclick = () => { if (state === 'play' && !G.over) setState('pause'); };

  $('#fwBtn').onclick = useFirework;
  $('#gbBtn').onclick = useBuster;
  $('#lnBtn').onclick = useLantern;
  $('#lmBtn').onclick = useMine;
  $('#bmBtn').onclick = useBomb;
  $('#scBtn').onclick = useScarecrow;
  document.addEventListener('click', e => {   // one sound per menu tap, chosen by what was tapped (docs/AUDIO.md §4)
    const b = e.target.closest('button'); if (!b || b.disabled || !b.closest('.ov')) return;
    ensureAudio();
    if (b.classList.contains('lv')) SFX.ui('level');
    else if (b.classList.contains('pick')) SFX.ui(b.classList.contains('must') ? 'locked' : b.getAttribute('aria-pressed') === 'true' ? 'pick' : 'unpick');
    else if (b.classList.contains('btn') && !b.classList.contains('alt') && !b.classList.contains('small')) SFX.ui('go');
    else if (b.classList.contains('alt') || /back|quit/i.test(b.textContent)) SFX.ui('back');
    else if (b.classList.contains('btn')) SFX.ui('go');
    else SFX.ui('tap');
  });
  $('#bPvBack').onclick = openLevels;
  $('#bPvGo').onclick = () => { ensureAudio(); startPreviewedNight(); };
  $('#bIntroOk').onclick = () => { ensureAudio(); showNextIntro(); };

  $('#rpBtn').onclick = useRepair;

  $('#bResume').onclick = () => setState('play');

  $('#bRestart').onclick = () => { save.coins += G.coins; persist(); if (G.mode === 'story') beginNight(G.n); else startGame('endless', 1, G.loadout); };   // restart goes through the pumpkin picker (owner)

  $('#bQuit').onclick = () => { musicStop(); save.coins += G.coins; if (G.mode === 'endless' && G.score > save.best) save.best = G.score; persist(); setState('title'); };
}
