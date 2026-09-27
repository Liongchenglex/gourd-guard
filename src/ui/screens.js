import { PERKS, perkEarned, perkOn, perkNight, rented, RENT_COST } from '../data/perks.js';
import { SPAWN_STEPS } from '../data/patterns.js';
import { LV_COST, NTYPES, PTYPES, lvDesc, lvStats, pct } from '../data/pumpkins.js';
import { GEAR } from '../data/shop.js';
import { LEVELS, WORLDS, WORLD_LEVELS, WORLD_NAMES, ALL_LEVELS, isOpen, highestOpen, unlockNightOf, levelFor, firstNightOf, typesForNight, gearUnlockNightOf } from '../data/worlds/index.js';
import { MNAME, MINTRO, BOSS_INTRO, BOSS_NAMES, GRAVES_INTRO, FOG_INTRO, CASTLE_INTRO, PUDDLE_INTRO, SEA_INTRO, WIND_INTRO, VARIANTS } from '../data/monsters.js';
import { monsterIcon } from '../engine/render/monsters.js';
import { poolKey, prebakeAsync } from '../engine/render/anim.js';
import { atlasKey } from '../engine/render/chars.js';
import { SFX, ensureAudio, musicStop, musicSync, musicStart } from '../engine/audio.js';
import { beginEndless, beginNight, makeDemo, makePreview, startGame, useFirework, useRepair, useBuster, useLantern, useMine, useBomb, useScarecrow } from '../engine/game.js';
import { bgWorld, buildBg, pumpkinIcon, worldScene } from '../engine/render/sprites.js';
import { BOOKS } from '../data/lore.js';
import { BESTIARY, COMPANIONS } from '../data/bestiary.js';
import { toolIcon } from '../engine/render/tools.js';
import { titleArt } from '../engine/render/keyart.js';
import { trophyIcon } from '../engine/render/trophies.js';
import { PUMPKIN_LORE } from '../data/lore.js';
import { G, H, setBannerTimer, setGest, setStateRaw, state } from '../engine/state.js';
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
      if (g.def.levelNo === 10){   // owner: beating the level-10 boss is a celebration: a world-unlock card, then back to the menu
        const nextName = WORLD_LEVELS[g.def.worldNo] && WORLD_LEVELS[g.def.worldNo].length ? WORLD_NAMES[g.def.worldNo] : null; title = nextName ? `${nextName} unlocked!` : 'Every boss beaten!';
        msg = `🎉 ${BOSS_NAMES[g.def.boss]} is beaten! The rest of ${WORLD_NAMES[g.def.worldNo - 1]} is open` + (nextName ? `, and ${nextName} awaits.` : '.'); SFX.perk();
      }
      const perk = PERKS.find(p => perkNight(p) === g.n);
      const tw = $('#rTrophy'); tw.hidden = true; tw.innerHTML = ''; tw.classList.remove('show');
      if (perk){   // level 20 (owner): a trophy drops in with rays and sparkles, and the level tile gets stamped when the book reopens
        title = `Trophy earned!`;
        msg = `🏆 ${perk.name}: ${perk.desc} It waits on the pumpkin-picking screen as a trophy you can switch on or off.`;
        tw.appendChild(trophyIcon(perk.world - 1, 64, true)); const nm = document.createElement('b'); nm.textContent = perk.name; tw.appendChild(nm);
        for (let i = 0; i < 8; i++){ const sp = document.createElement('i'); sp.style.setProperty('--a', (i * 45) + 'deg'); sp.style.setProperty('--d', (0.9 + (i % 3) * 0.12) + 's'); tw.appendChild(sp); }
        tw.hidden = false; setTimeout(() => tw.classList.add('show'), 60); setTimeout(() => SFX.star(), 700);
        SFX.perk();
      }
      stars = [0,1,2].map(i => `<span class="${i < st ? '' : 'off'}">★</span>`).join('');
      stats.push(['Monsters stopped', g.kills], ['Walls left', pct(wf)], ['Coins found', g.coins], ['Night bonus', bonus]);
      if (g.def.levelNo === 10) addBtn(box, 'Continue', () => { pendingUnlock = g.def.worldNo; curBook = null; openLevels(); });   // worldNo is 1-based story order = the next book's shelf index (def.world is the visual theme, not the order)   // to the shelf, where the next storybook unlocks (owner)
      else if (perk) addBtn(box, 'Continue', () => { pendingStamp = g.n; openBook(g.def.worldNo - 1, true); });   // back into the book: the level-20 tile is stamped with a flourish
      else {
        if (g.n < LEVELS) addBtn(box, 'Next level', () => openPreview(g.n + 1));
        addBtn(box, 'Shop', () => openShop('result'), 'alt');
        addBtn(box, 'Levels', openLevels, 'alt');
      }
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
    const art = titleArt(H); for (const [id, c] of [['#artBack', art.back], ['#artFront', art.front]]){ const cv = $(id); if (cv.width !== c.width || cv.height !== c.height){ cv.width = c.width; cv.height = c.height; } cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); cv.getContext('2d').drawImage(c, 0, 0); }   // key art (owner, 2026-09-27)
  }
  if (s !== 'play'){ setGest(null); $('#banner').classList.remove('show'); setBannerTimer(0); }
  if (s === 'pause'){ syncSpawn(); renderPerks(); }
  syncSound();
  setHudSig('');
  if (s === 'play' || s === 'pause') updateHud(true);
  const ov = OVS[s] ? $(OVS[s]) : null, first = ov && ov.querySelector('button:not([disabled])');
  if (first && matchMedia('(pointer:fine)').matches) first.focus({ preventScroll:true });
}

export function withHelp(fn){ fn(); }   // owner: no full help before 1-1; the night's own cards teach bunches of 3 and 5. 'How to play' stays on the title.

let previewNight = 1, introQueue = [], introNext = null;

/** Pre-level card (owner request, 2026-09-25): which monsters, the boss, your pumpkins, graves. Start goes through unseen intros first. */
let pendingUnlock = null;   // world index whose storybook should play its unlock animation on the next shelf (set by a level-10 win)
let pendingStamp = null;    // night whose level tile should play its stamp animation when the book opens (set by a level-20 win)
export function openPreview(n){
  previewNight = n;
  const def = levelFor(n), prevGraves = n > 1 ? levelFor(n - 1).graves : 0;
  makePreview(n);   // the night's own map behind the card (owner: not a random background)
  $('#pvTitle').textContent = `Level ${def.label}`;
  $('#pvSub').textContent = WORLD_NAMES[def.worldNo - 1];
  const mons = $('#pvMonsters'); mons.innerHTML = '';
  prebakeAsync([...def.pool.map(([t]) => poolKey(t, VARIANTS)), ...(def.boss ? [atlasKey(def.boss, def.bossForm === 2 ? 'form2' : null)] : []), 'ghoul']);   // bake this level's sprite strips while the card is read
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
    d.appendChild(monsterIcon(def.boss, 160, def.bossForm));
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
    d.appendChild(toolIcon(g.key, 54));
    const sm = document.createElement('small'); sm.textContent = g.name; d.appendChild(sm);
    pk.appendChild(d);
  }
  $('#pvNewBlock').hidden = !pk.childElementCount;
  powerPick = null; $('#pvPowerInfo').hidden = true; renderPowers();
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
let loadoutFromPreview = false;
function startPreviewedNight(){
  loadoutFromPreview = true;
  const n = previewNight, def = levelFor(n), prevGraves = n > 1 ? levelFor(n - 1).graves : 0;
  const cards = [];
  if (n === 1){   // 1-1 (owner): the Green pumpkin, and the whole lesson: bunch three to throw, bunch five to knock back
    cards.push({ key:'p:green', icon:pumpkinIcon(0, true), title:'Green pumpkin', text:'Your everyday pumpkin. Slide it so three of the same colour touch, and the bunch lights up.' });
    cards.push({ key:'tutorial', icon:'🎃', title:'Bunch them up', text:'Three of a colour touching: flick the lit bunch and every pumpkin flies up its own column. Five or more: the bunch also knocks monsters back a step. That is all you need tonight.' });
  }
  for (const key of def.unlockPumpkins){
    const t = PTYPES.findIndex(p => p.key === key);
    if (t >= 0) cards.push({ key:'p:' + key, icon:pumpkinIcon(t, true), title:`New pumpkin: ${PTYPES[t].name}`, text:def.unlockCopy && def.unlockCopy[key] ? def.unlockCopy[key] : `It ${PTYPES[t].role}. Bunch three or more to throw it.` });
  }
  for (const key of def.introPumpkins){
    const t = PTYPES.findIndex(p => p.key === key);
    if (t >= 0) cards.push({ key:'p:' + key, icon:pumpkinIcon(t, true), title:`${PTYPES[t].name} pumpkin`, text:PTYPES[t].rainbow ? 'Rare: it joins any bunch as any colour, and can even sit in two bunches at once. Look out for it among sprouts and drops.' : `It ${PTYPES[t].role}.` });
  }
  for (const key of def.unlockGear){
    const g = GEAR.find(x => x.key === key);
    if (g) cards.push({ key:'g:' + key, icon:toolIcon(g.key, 104), title:`New tool: ${g.name}`, text:`${g.desc} You get one to start with. More drop from monsters and sell in the shop.` });
  }
  if (def.graves && !prevGraves) cards.push({ key:'graves', icon:'🪦', title:'Graves', text:GRAVES_INTRO });
  if (def.fog.length && !(n > 1 && levelFor(n - 1).fog.length)) cards.push({ key:'fog', icon:'🌫️', title:'Fog', text:FOG_INTRO });
  if (def.castles && !(n > 1 && levelFor(n - 1).castles)) cards.push({ key:'castles', icon:'🏰', title:'Castle walls', text:CASTLE_INTRO });
  if (def.puddles && !(n > 1 && levelFor(n - 1).puddles)) cards.push({ key:'puddles', icon:'💧', title:'Puddles', text:PUDDLE_INTRO });
  if (def.sea && !(n > 1 && levelFor(n - 1).sea)) cards.push({ key:'sea', icon:'🌊', title:'The sea row', text:SEA_INTRO });
  if (def.gust && !(n > 1 && levelFor(n - 1).gust)) cards.push({ key:'wind', icon:'🍂', title:'Wind', text:WIND_INTRO });
  for (const t of def.intro) if (!VARIANTS[t]) cards.push({ key:'m:' + t, icon:monsterIcon(t, 160), title:`New monster: ${MNAME[t] || t}`, text:MINTRO[t] || '' });   // returning variants get no card (owner)
  if (def.boss) cards.push({ key:`b:${def.boss}:${def.bossForm}`, icon:monsterIcon(def.boss, 200, def.bossForm), title:def.bossForm === 2 ? `${BOSS_NAMES[def.boss]}, full form` : `Boss: ${BOSS_NAMES[def.boss]}`, text:BOSS_INTRO[def.boss][def.bossForm] });
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
let curBook = null;   // the open storybook (world index), so Back from a preview or the loadout returns to its pages
/** Level select: a shelf of storybooks, one per world; an open book shows the world's lore and its level grid (owner, 2026-09-26). */
export function openLevels(){
  $('#lvCoins').textContent = save.coins.toLocaleString();
  $('#bUnlockAll').textContent = save.testUnlock ? 'Testing: relock levels' : 'Testing: unlock all levels';
  if (curBook != null){ openBook(curBook, false); return; }
  const shelf = $('#shelf'); shelf.innerHTML = '';
  let row = null;
  WORLD_NAMES.forEach((name, wi) => {
    if (wi % 3 === 0){ row = document.createElement('div'); row.className = 'shelfRow'; shelf.appendChild(row); }
    const levels = WORLD_LEVELS[wi], bk = BOOKS[wi], start = levels.length ? firstNightOf(wi + 1) : null;
    const open = start != null && isOpen(start), soon = !levels.length;
    const unlockNow = pendingUnlock === wi && open && !soon;   // just earned: show it locked, then play the unlock
    const b = document.createElement('button'); b.className = 'book' + (soon ? ' soon' : open && !unlockNow ? '' : ' locked'); b.style.setProperty('--cover', bk.cover);
    if (unlockNow){
      pendingUnlock = null;
      setTimeout(() => { b.classList.add('unlocking'); b.scrollIntoView({ block:'center', behavior:'smooth' }); SFX.perk(); SFX.magic && SFX.magic(); }, 350);
      setTimeout(() => { b.classList.remove('locked', 'unlocking'); b.classList.add('unlocked'); }, 2600);
    }
    const stars = levels.reduce((t, d, i) => t + (save.stars[start + i] || 0), 0);
    b.setAttribute('aria-label', soon ? `${name}, coming soon` : open ? `${name}, ${stars} of ${levels.length * 3} stars` : `${name}, locked`);
    const cv = document.createElement('canvas'); b.appendChild(cv);
    const nm = document.createElement('span'); nm.className = 'bkName'; nm.textContent = name; b.appendChild(nm);
    const pr = document.createElement('span'); pr.className = 'bkProg'; pr.textContent = soon ? 'Coming soon' : open ? `★ ${stars} / ${levels.length * 3}` : `Beat world ${wi} first`; b.appendChild(pr);
    if (!soon){ const sc = worldScene(levels[0].theme, 130, 104); cv.width = sc.width; cv.height = sc.height; cv.getContext('2d').drawImage(sc, 0, 0); }
    else { cv.width = 260; cv.height = 208; const g = cv.getContext('2d'); g.fillStyle = '#100a16'; g.fillRect(0, 0, 260, 208); g.fillStyle = '#3a2a4a'; g.font = '120px serif'; g.textAlign = 'center'; g.fillText('?', 130, 150); }
    b.onclick = () => { if (soon || !open){ SFX.ui('locked'); return; } SFX.ui('go'); openBook(wi, true); };
    row.appendChild(b);
  });
  $('#shelfView').hidden = false; $('#bookView').hidden = true;
  setState('levels');
}
/** Open world wi's storybook: lore and boss on the left page, the level grid on the right; animate = play the pop-up. */
export function openBook(wi, animate){
  curBook = wi;
  const name = WORLD_NAMES[wi], levels = WORLD_LEVELS[wi], bk = BOOKS[wi], start = firstNightOf(wi + 1);
  const view = $('#bookView'), spread = $('#spread');
  spread.style.setProperty('--cover', bk.cover);
  $('#bkTitle').textContent = name; $('#bkTitle').style.color = bk.ink;
  $('#bkWorld').textContent = `World ${wi + 1} of 5`;
  $('#bkLore').textContent = bk.lore;
  const sc = worldScene(levels[0].theme, 456, 120), cv = $('#bkScene'); cv.width = sc.width; cv.height = sc.height; cv.getContext('2d').drawImage(sc, 0, 0);
  const bossKey = (levels.find(d => d.boss) || {}).boss, bossBox = $('#bkBoss'); bossBox.innerHTML = '';
  if (bossKey){ bossBox.appendChild(monsterIcon(bossKey, 192, 1)); const cap = document.createElement('span'); cap.textContent = BOSS_NAMES[bossKey]; bossBox.appendChild(cap); }
  const grid = $('#bkLevels'); grid.innerHTML = '';
  let stars = 0, nextN = null;
  levels.forEach((d, i) => {
    const n = start + i, locked = !isOpen(n), st = save.stars[n] || 0; stars += st;
    if (!locked && !st && nextN == null) nextN = n;
    const b = document.createElement('button'); b.className = 'pg' + (d.boss ? ' boss' : '') + (st ? ' done' : '') + (d.boss && st && pendingStamp !== n ? ' stamped' : ''); b.disabled = locked;   // a beaten boss keeps its stamp (owner)
    b.setAttribute('aria-label', locked ? `Level ${d.world}-${d.level}, locked` : `Level ${d.world}-${d.level}${d.name ? ', ' + d.name : ''}, ${st} of 3 stars`);
    if (d.boss) b.appendChild(monsterIcon(d.boss, 88, d.bossForm)); else b.textContent = d.level;
    if (!locked){ const sp = document.createElement('span'); sp.className = 'st'; sp.innerHTML = '★'.repeat(st) + '<span class="off">' + '★'.repeat(3 - st) + '</span>'; b.appendChild(sp); }
    b.onclick = () => { SFX.ui('level'); withHelp(() => openPreview(n)); };
    if (pendingStamp === n){ pendingStamp = null; setTimeout(() => { b.classList.add('stamping'); SFX.star(); }, 700); setTimeout(() => { b.classList.remove('stamping'); b.classList.add('stamped'); }, 1900); }
    grid.appendChild(b);
  });
  grid.querySelectorAll('.pg').forEach((b, i) => { if (start + i === nextN) b.classList.add('next'); });
  $('#bkStars').innerHTML = `<b>★ ${stars}</b> of ${levels.length * 3} collected`;
  renderBestiary(wi);
  $('#bestiary').hidden = true; $('#spread .pages:not(#bestiary)').hidden = false;
  $('#shelfView').hidden = true; view.hidden = false;
  view.classList.remove('opening'); if (animate){ void view.offsetWidth; view.classList.add('opening'); }
  setState('levels');
}
/** The book's collection page: every monster of world wi in order of first appearance, met or not yet met. */
function renderBestiary(wi){
  const levels = WORLD_LEVELS[wi], start = firstNightOf(wi + 1), seen = new Set(), order = [], firstN = {};
  levels.forEach((d, i) => {
    const n = start + i, met = isOpen(n);   // a level you can enter has shown you its monsters (preview and intro cards)
    const keys = [...d.pool.map(([k]) => k), ...(d.boss ? [d.boss] : [])];
    for (const k of keys) for (const kk of [k, ...(COMPANIONS[VARIANTS[k] ? VARIANTS[k].base : k] || [])]){
      if (firstN[kk] == null){ firstN[kk] = n; order.push(kk); }
      if (met) seen.add(kk);
    }
  });
  const L = $('#bsLeft'), R = $('#bsRight'); L.innerHTML = ''; R.innerHTML = '';
  let metCount = 0;
  order.forEach((k, i) => {
    const v = VARIANTS[k], base = v ? v.base : k, e = BESTIARY[k] || BESTIARY[base] || {}, met = seen.has(k); if (met) metCount++;
    const name = v ? v.name : BOSS_NAMES[k] || MNAME[k] || k;
    const d = document.createElement('div'); d.className = 'bs' + (met ? '' : ' unmet');
    d.appendChild(monsterIcon(k, 92, 1));
    const t = document.createElement('div');
    t.innerHTML = met ? `<b>${name}</b><p class="ab">${e.ability || MINTRO[base] || ''}</p><p class="lo">${e.lore || ''}</p>` : `<b>Not yet met</b><p class="ab">Reach level ${levels[firstN[k] - start].world}-${levels[firstN[k] - start].level} to find out.</p>`;
    d.appendChild(t);
    (i < Math.ceil(order.length / 2) ? L : R).appendChild(d);
  });
  $('#bsTitle').textContent = `${WORLD_NAMES[wi]} bestiary`; $('#bsTitle').style.color = BOOKS[wi].ink;
  $('#bsCount').textContent = `${metCount} of ${order.length} met`;
}
function flipBook(toBestiary){
  const spread = $('#spread'), pages = $('#spread .pages:not(#bestiary)'), best = $('#bestiary');
  SFX.ui('tap');
  const swap = () => { pages.hidden = toBestiary; best.hidden = !toBestiary; };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches){ swap(); return; }
  spread.classList.remove('turning'); void spread.offsetWidth; spread.classList.add('turning');
  setTimeout(swap, 250); setTimeout(() => spread.classList.remove('turning'), 520);
}
function closeBook(){ curBook = null; SFX.ui('back'); openLevels(); }

let loadoutFocus = null;
/** Pumpkin picking (owner, 2026-09-27): pumpkins in unlock order, a detail card for the focused one (level, ability, lore), then the trophies. */
export function openLoadout(avail, next, required){
  loadoutAvail = avail; loadoutNext = next; loadoutMust = (required || []).map(m => m.t); loadoutWhy = required || [];
  const pref = [...loadoutMust, ...(save.loadout || []).filter(t => avail.includes(t) && !loadoutMust.includes(t))];
  for (const t of avail) if (pref.length < (perkOn('pick4') ? 4 : 5) && !pref.includes(t)) pref.push(t);
  loadoutSel = new Set(pref.slice(0, perkOn('pick4') ? 4 : 5));
  const night = t => t < 2 ? 0 : unlockNightOf(PTYPES[t].key);   // Green and Yellow are there from the start
  const order = avail.slice().sort((x, y) => night(x) - night(y) || x - y);
  loadoutFocus = loadoutMust[0] != null ? loadoutMust[0] : order[0];
  $('#loTitle').textContent = `Pick ${perkOn('pick4') ? 4 : 5} pumpkins`;
  const box = $('#picks'); box.innerHTML = '';
  for (const t of order){
    const b = document.createElement('button'); b.className = 'pick';
    b.appendChild(pumpkinIcon(t, true));
    const lv = document.createElement('span'); lv.className = 'lv'; lv.textContent = `Lv ${lvOf(t)}`; b.appendChild(lv);
    const nm = document.createElement('b'); nm.textContent = PTYPES[t].name; b.appendChild(nm);
    const sm = document.createElement('small'); sm.textContent = PTYPES[t].role.split(/[:.;]/)[0]; b.appendChild(sm);
    b.setAttribute('aria-label', `${PTYPES[t].name}, level ${lvOf(t)}`);
    if (loadoutMust.includes(t)){ const why = loadoutWhy.find(m => m.t === t).why, tag = document.createElement('span'); tag.className = 'tag' + (why === 'New this level' ? '' : ' info'); tag.textContent = why === 'New this level' ? 'NEW' : 'i'; tag.title = why; b.appendChild(tag); b.classList.add('must'); }
    b.onclick = () => {
      loadoutFocus = t;
      if (!loadoutMust.includes(t)){   // introduced this level: stays in
        if (loadoutSel.has(t)){ loadoutSel.delete(t); SFX.ui('unpick'); }
        else if (loadoutSel.size < (perkOn('pick4') ? 4 : 5)){ loadoutSel.add(t); SFX.ui('pick'); }   // Focused patch: exactly four
        else SFX.ui('locked');
      } else SFX.ui('tap');
      syncLoadout();
    };
    b.dataset.t = t; box.appendChild(b);
  }
  syncLoadout();
  setState('loadout');
}
function renderDetail(){
  const t = loadoutFocus, d = $('#loDetail'); if (t == null){ d.innerHTML = ''; return; }
  const P = PTYPES[t], L = lvOf(t), un = t < 2 ? 1 : unlockNightOf(P.key), where = un === 1 ? 'from the start' : un === Infinity ? '' : `unlocked at ${levelFor(un).label}`;
  d.innerHTML = '';
  d.appendChild(pumpkinIcon(t, true));
  const tx = document.createElement('div');
  const st = lvStats(t, L);
  tx.innerHTML = `<b>${P.name}</b><small>Level ${L}${where ? ' \u00b7 ' + where : ''}</small><p class="ab"><span class="k">Power:</span> ${st.power}<br><span class="k">Knockback:</span> ${st.knockback}<br><span class="k">Special:</span> ${st.special}</p><p class="lo">${PUMPKIN_LORE[P.key] || ''}</p>`;
  d.appendChild(tx);
}

/** Powers (the level-20 trophies) on the level preview card (owner, 2026-09-27): gold when on, dim when off, locked until that world is complete. Tap one to read its power and switch it. */
let powerPick = null;
/** Powers on the level card: won ones switch on and off; ones not won yet can be rented for this night with coins (owner, 2026-09-27). */
export function renderPowers(){
  const box = $('#pvPowers'), info = $('#pvPowerInfo'); if (!box) return;
  box.innerHTML = '';
  for (const p of PERKS){
    const earned = perkEarned(p.key), isRented = rented.has(p.key), on = perkOn(p.key), wname = WORLD_NAMES[p.world - 1];
    const b = document.createElement('button'); b.className = 'pw ' + (earned ? (on ? 'on' : 'off') : isRented ? 'on rented' : 'locked') + (powerPick === p.key ? ' picked' : '');
    b.appendChild(trophyIcon(p.world - 1, 52, earned || isRented));
    const sm = document.createElement('small'); sm.textContent = earned ? p.name : isRented ? 'Rented' : `Complete ${wname}`; b.appendChild(sm);
    if (!earned && !isRented){ const tag = document.createElement('span'); tag.className = 'rentTag'; tag.textContent = 'RENT'; b.appendChild(tag); }
    b.setAttribute('aria-label', earned ? `${p.name}, ${on ? 'on' : 'off'}: ${p.desc}` : isRented ? `${p.name}, rented for this night: ${p.desc}` : `${p.name}, not won yet: ${p.desc} Rent it for this night for ${RENT_COST} coins.`);
    b.onclick = () => {
      powerPick = p.key; info.innerHTML = '';
      if (earned){ save.perksOff = save.perksOff || {}; save.perksOff[p.key] = on; persist(); SFX.ui(on ? 'unpick' : 'pick'); info.textContent = `${p.name} is ${on ? 'off' : 'on'}: ${p.desc}`; }
      else if (isRented){ SFX.ui('tap'); info.textContent = `${p.name} is rented for this night: ${p.desc}`; }
      else {
        SFX.ui('tap');
        const t = document.createElement('span'); t.textContent = `${p.name}: ${p.desc} Complete ${wname} to keep it, or rent it for this night only.`; info.appendChild(t);
        const rb = document.createElement('button'); rb.className = 'btn small rentBtn'; rb.innerHTML = `Rent for this night <span class="coin"></span>${RENT_COST}`; rb.disabled = save.coins < RENT_COST;
        if (save.coins < RENT_COST){ const nt = document.createElement('small'); nt.textContent = ` You need ${RENT_COST - save.coins} more coins.`; t.appendChild(nt); }
        rb.onclick = () => { if (save.coins < RENT_COST) return; save.coins -= RENT_COST; persist(); rented.add(p.key); SFX.coin(); info.textContent = `${p.name} is rented for this night: ${p.desc}`; renderPowers(); };
        info.appendChild(rb);
      }
      info.hidden = false; renderPowers();
    };
    box.appendChild(b);
  }
}
export function renderTrophies(){ renderPowers(); }

export function syncLoadout(){
  for (const b of document.querySelectorAll('#picks .pick')) b.setAttribute('aria-pressed', loadoutSel.has(+b.dataset.t) ? 'true' : 'false');
  const n = loadoutSel.size;
  const min = perkOn('pick4') ? 4 : 5;   // 5-20 perk: four colours are enough
  $('#loCount').textContent = n >= min ? 'Ready. Only the pumpkins you pick will sprout and drop tonight.' : `${n} of ${min} picked. Tap a pumpkin to pick it and read about it.`;
  $('#bLoGo').disabled = n < min;
  const why = loadoutWhy.filter(w => w.why !== 'New this level').map(w => `${PTYPES[w.t].name} is locked in: ${w.why.toLowerCase()}.`).join(' ');
  $('#loWhy').textContent = why; $('#loWhy').hidden = !why;
  renderDetail();
}

export function openShop(ret){ shopReturn = ret || 'levels'; renderShop(); setState('shop'); }

let shopTab = 'pumpkins';
function setShopTab(tab){
  shopTab = tab;
  for (const b of document.querySelectorAll('#shopTabs .tab')) b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false');
  $('#paneP').hidden = tab !== 'pumpkins'; $('#paneT').hidden = tab !== 'tools'; $('#paneS').hidden = tab !== 'seeds';
}
/** One stat line: now, and the next level's value when it changes. */
const nxLine = (k, a, b) => `<span class="k">${k}</span><span>${a}${b != null && b !== a ? ` <span class="dim">\u2192</span> <span class="up">${b}</span>` : ''}</span>`;
const SEED_PACKS = [
  { n:100,  name:'Handful of seeds', price:'$0.99' },
  { n:550,  name:'Pouch of seeds',   price:'$4.99' },
  { n:1200, name:'Sack of seeds',    price:'$9.99' },
  { n:2600, name:'Barrel of seeds',  price:'$19.99' },
];
function seedIcon(px, n){
  const c = document.createElement('canvas'); c.width = c.height = px * 2; const g = c.getContext('2d'); g.scale(2, 2);
  const k = Math.min(5, 1 + Math.floor(Math.log2(n / 100 + 1) * 1.5));
  for (let i = 0; i < k; i++){ const x = px / 2 + (i - (k - 1) / 2) * px * .14, y = px / 2 + (i % 2) * px * .1;
    g.save(); g.translate(x, y); g.rotate(-.35 + i * .15); const gr = g.createRadialGradient(-2, -4, 1, 0, 0, px * .22); gr.addColorStop(0, '#fff7dc'); gr.addColorStop(.5, '#f3dca0'); gr.addColorStop(1, '#b8904a');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, px * .14, px * .22, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(120,80,30,.55)'; g.lineWidth = 1; g.stroke(); g.restore(); }
  return c;
}
export function renderShop(){
  $('#shopCoins').textContent = save.coins.toLocaleString(); $('#shopSeeds').textContent = (save.seeds || 0).toLocaleString();
  setShopTab(shopTab);
  const pbox = $('#shopPumpkins'); pbox.innerHTML = '';
  const order = [...Array(NTYPES).keys()].sort((x, y) => (x < 2 ? 0 : unlockNightOf(PTYPES[x].key)) - (y < 2 ? 0 : unlockNightOf(PTYPES[y].key)) || x - y);   // first unlocked first (owner)
  for (const t of order){
    const P = PTYPES[t], L = lvOf(t), un = t < 2 ? 1 : unlockNightOf(P.key), unlocked = t < 2 || un <= highestOpen(), maxed = L >= 5, cost = LV_COST[L - 1];
    const d = document.createElement('div'); d.className = 'item';
    const ic = pumpkinIcon(t, true); ic.className = 'ic'; d.appendChild(ic);
    const tx = document.createElement('div'); tx.className = 'tx';
    const pips = Array.from({ length:5 }, (_, i) => `<i class="${i < L ? 'on' : ''}"></i>`).join('');
    const a = lvStats(t, L), n = maxed ? null : lvStats(t, L + 1);
    if (!unlocked){ ic.classList.add('mystery'); tx.innerHTML = `<b>??? pumpkin</b><p>${un === Infinity ? 'Unlocks in a later world.' : `Unlocks at level ${levelFor(un).label}.`}</p>`; }   // nothing is revealed before it unlocks (owner)
    else tx.innerHTML = `<b>${P.name}, level ${L}${maxed ? ' (max)' : ` <span class="dim">\u2192 ${L + 1}</span>`}</b><div class="nx">${nxLine('Power', a.power, n && n.power)}${nxLine('Knockback', a.knockback, n && n.knockback)}${nxLine('Special', a.special, n && n.special)}</div><div class="pips" aria-label="Level ${L} of 5">${pips}</div>`;
    d.appendChild(tx);
    const b = document.createElement('button'); b.className = 'btn small';
    if (!unlocked){ b.textContent = '\ud83d\udd12'; b.disabled = true; b.setAttribute('aria-label', 'Locked'); }
    else if (maxed){ b.textContent = 'Maxed'; b.disabled = true; }
    else { b.innerHTML = `<span class="coin"></span>${cost}`; b.disabled = save.coins < cost; b.setAttribute('aria-label', `Level up ${P.name} for ${cost} coins`); }
    b.onclick = () => {
      if (!unlocked || maxed || save.coins < cost) return;
      save.coins -= cost; save.lv[P.key] = L + 1; persist(); ensureAudio(); SFX.coin(); renderShop();
    };
    d.appendChild(b); pbox.appendChild(d);
  }
  const sp = $('#shopSeedPacks'); sp.innerHTML = '';
  for (const pk of SEED_PACKS){
    const d = document.createElement('div'); d.className = 'item pack';
    const ic = seedIcon(48, pk.n); ic.className = 'ic'; d.appendChild(ic);
    const tx = document.createElement('div'); tx.className = 'tx'; tx.innerHTML = `<b>${pk.name}</b><p>${pk.n.toLocaleString()} pumpkin seeds</p>`; d.appendChild(tx);
    const b = document.createElement('button'); b.className = 'btn small'; b.textContent = pk.price; b.disabled = true; b.title = 'On sale with the app store release'; d.appendChild(b);
    sp.appendChild(d);
  }
  const list = $('#shopList'); list.innerHTML = '';
  for (const it of GEAR){
    const lvl = save[it.key] || 0, maxed = lvl >= it.max;
    const cost = it.consumable ? it.cost[0] : it.cost[lvl];
    const gu = it.consumable ? gearUnlockNightOf(it.key) : 1, gLocked = gu > highestOpen();
    const d = document.createElement('div'); d.className = 'item';
    const pips = Array.from({ length:it.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
    d.innerHTML = `<div class="tx"><b>${it.name}${it.consumable ? ` <span class="dim">\u00b7 ${lvl} of ${it.max} carried</span>` : ` <span class="dim">\u00b7 level ${lvl} of ${it.max}</span>`}</b><p>${it.desc}</p><div class="pips" aria-label="${lvl} of ${it.max}">${pips}</div></div>`;
    const tic = toolIcon(it.key, 42); tic.className = 'ic'; tic.setAttribute('aria-hidden', 'true'); d.prepend(tic);
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
  $('#bStory').onclick = () => { ensureAudio(); curBook = null; openLevels(); };

  $('#bEndless').onclick = () => { ensureAudio(); loadoutFromPreview = false; withHelp(beginEndless); };

  $('#bHelpT').onclick = () => { helpNext = () => setState('title'); setState('help'); };

  $('#bHelpOk').onclick = () => { ensureAudio(); const f = helpNext || (() => setState('title')); helpNext = null; f(); };

  $('#bSoundT').onclick = toggleSound; $('#bSoundP').onclick = toggleSound;

  $('#spMinus').onclick = () => stepSpawn(-1); $('#spPlus').onclick = () => stepSpawn(1);

  $('#bLvBack').onclick = () => { setState('title'); makeDemo(); };   // the title gets its own scene back after a level map was shown
  $('#bBkClose').onclick = closeBook;
  $('#bBkFlip').onclick = () => flipBook(true);
  $('#bBkUnflip').onclick = () => flipBook(false);
  $('#bBkShop').onclick = () => openShop('levels');

  $('#bLvShop').onclick = () => openShop('levels');
  $('#bUnlockAll').onclick = () => { save.testUnlock = !save.testUnlock; persist(); openLevels(); };   // TESTING ONLY: remove before release

  $('#bLoBack').onclick = () => { if (loadoutFromPreview) openPreview(previewNight); else setState('title'); };   // back to the level card the night was started from (owner)

  $('#bLoGo').onclick = () => { if (loadoutSel.size < (perkOn('pick4') ? 4 : 5)) return; const lo = loadoutAvail.filter(t => loadoutSel.has(t)); save.loadout = lo; persist(); const f = loadoutNext; loadoutNext = null; if (f) f(lo); };

  for (const b of document.querySelectorAll('#shopTabs .tab')) b.onclick = () => { SFX.ui('tap'); setShopTab(b.dataset.tab); };
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
