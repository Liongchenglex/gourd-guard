import { toolsForNight, highestOpen, progressNight } from '../data/worlds/index.js';
import { scale } from '../engine/render/canvas.js';
import { FIELD_BOT, FIELD_TOP, G, setBannerTimer } from '../engine/state.js';
import { $, clamp } from '../engine/util.js';
import { wallFrac } from '../engine/walls.js';
import { save } from '../save.js';
import { TYPES } from '../data/monsters.js';
import { toolIcon } from '../engine/render/tools.js';
import { QUEST_START, questsFor, questLive, questShort } from '../data/quests.js';

// The tool tray, in order. Emergency Pumpkins is a World 6 tool, so its button exists only from Release 2 (docs/RELEASES.md).
const TRAY = [['#rpBtn', 'repair'], ['#fwBtn', 'fw'], ['#gbBtn', 'buster'], ['#lnBtn', 'lantern'], ['#lmBtn', 'mine'], ['#bmBtn', 'bomb'], ['#scBtn', 'scarecrow'], ...(__RELEASE__ >= 2 ? [['#epBtn', 'emergency']] : [])];
import { HOUR_SECONDS as E_HOUR } from '../data/endless.js';
let trayDrawn = false;
let qNext = -1, qHtml = '', qFor = null;   // quest trackers, rebuilt 4 times a second rather than every frame

export function banner(big, sub, dur){
  $('#bnBig').textContent = big; $('#bnSub').textContent = sub || '';
  const b = $('#banner'); b.style.top = (FIELD_TOP + (FIELD_BOT - FIELD_TOP) * 0.14) * scale + 'px';
  b.classList.add('show'); setBannerTimer(dur || 2);
}

export let hudSig = '';

/** 6-20 (Release 3, owner 2026-11-03): the bar shows the Hollow King's health with a marker where each world boss form splits off,
 *  in that form's colour; it pulses while the form stands and dims once beaten. */
const HK_COLOURS = { gravekeeper:'#7fd35a', poltergeist:'#9fd8ff', hexwitch:'#b07aff', vampirecount:'#e0384a', twintides:'#3ac8c0' };
let hkFor = null;
function hkMarks(){
  const bar = $('#prog').parentNode, on = G.mode === 'story' && G.def && G.def.boss === 'hollowking';
  if (hkFor !== G){ hkFor = G; for (const e of bar.querySelectorAll('.hkMark')) e.remove(); if (on) TYPES.hollowking.forms.forEach((k, i) => { const e = document.createElement('b'); e.className = 'hkMark'; e.style.left = (10 + 90 * i / 5) + '%'; e.style.background = HK_COLOURS[k]; e.setAttribute('aria-hidden', 'true'); bar.appendChild(e); }); }
  if (!on) return;
  const k = G.monsters.find(m => m.kind === 'hollowking' && !m.dead && !m.hkClone), ph = k ? k.hkPhase : G.bossDead ? 5 : 0, up = !!(k && k.hkForm && !k.hkForm.dead);
  bar.querySelectorAll('.hkMark').forEach((e, i) => { e.classList.toggle('live', up && i === ph - 1); e.classList.toggle('done', i < ph - (up ? 1 : 0)); });
}

/** 6-19 (Release 3): a jukebox mark on the spawn bar at each drop point; it glows while that jukebox stands and dims once smashed. */
let marksFor = null;
function jukeboxMarks(){
  const bar = $('#prog').parentNode, d = G.mode === 'story' && G.def, pts = d && d.frenzy && Array.isArray(d.frenzyAt) ? d.frenzyAt : null;
  if (marksFor !== G){ marksFor = G; for (const e of bar.querySelectorAll('.jbMark')) e.remove(); if (pts) pts.forEach(f => { const e = document.createElement('b'); e.className = 'jbMark'; e.style.left = f * 100 + '%'; e.setAttribute('aria-hidden', 'true'); bar.appendChild(e); }); }
  if (!pts) return;
  const used = G.jbNext || 0, standing = G.jukebox && !G.jukebox.dead;
  bar.querySelectorAll('.jbMark').forEach((e, i) => { e.classList.toggle('live', standing && i === used - 1); e.classList.toggle('done', i < used && !(standing && i === used - 1)); });
}

/** Fire marks (Release 4): a flame mark on the spawn bar at each `fireMarks` point; it pulses for a moment when it fires, then dims. */
let fmFor = null;
function fireMarks(){
  const bar = $('#prog').parentNode, d = G.mode === 'story' && G.def, fm = d && d.fireMarks && d.fireMarks.length ? d.fireMarks : null;
  if (fmFor !== G || (fm && bar.querySelectorAll('.fmMark').length !== fm.length)){ fmFor = G; for (const e of bar.querySelectorAll('.fmMark')) e.remove(); if (fm) fm.forEach(m => { const e = document.createElement('b'); e.className = 'fmMark'; e.style.left = m.at * 100 + '%'; e.setAttribute('aria-hidden', 'true'); bar.appendChild(e); }); }
  if (!fm) return;
  const used = G.fmNext || 0, fresh = G.t - (G.fmT == null ? -99 : G.fmT) < 1.5;
  bar.querySelectorAll('.fmMark').forEach((e, i) => { const live = fresh && i === used - 1; e.classList.toggle('live', live); e.classList.toggle('done', i < used && !live); });
}

export function updateHud(force){
  if (!G || G.mode === 'demo') return;
  const coins = save.coins + G.coins;
  let prog;
  if (G.mode !== 'story') prog = (G.t % E_HOUR) / E_HOUR;   // endless: progress to the next hour
  else if (G.def.boss){   // boss level: the bar fills a little until the boss shows, then tracks its health
    const bs = G.monsters.filter(m => m.type === 'boss' && !m.hkClone), hp = bs.reduce((a, b) => a + Math.max(0, b.hp), 0), mx = G.bossMax || bs.reduce((a, b) => a + b.maxHp, 0);   // two-boss nights: both bosses' full health, a fallen one counting 0
    prog = G.bossDead ? 1 : bs.length ? 0.1 + 0.9 * (1 - hp / mx) : 0.1 * Math.min(1, G.spawned / Math.max(1, Math.floor(G.total * 0.4)));
  } else if ((__RELEASE__ >= 3 && Array.isArray(G.def.frenzyAt)) || (__RELEASE__ >= 4 && G.def.fireMarks && G.def.fireMarks.length)) prog = G.total ? Math.min(G.spawned, G.total) / G.total : 0;   // levels with jukebox marks: the bar counts monsters that arrived, so each jukebox drops on its mark (owner, 2026-11-03)
  else prog = G.total ? G.resolved / G.total : 0;
  const label = G.mode === 'story' ? `Night ${G.def.label}` : `${G.frenzy ? 'Frenzy' : 'Hour'} ${(G.hour || 0) + 1} · ${G.score.toLocaleString()}`;
  const wf = Math.round(wallFrac() * 100);
  const tools = toolsForNight(G.mode === 'story' ? progressNight(G.n) : highestOpen());
  if (!trayDrawn){ trayDrawn = true; for (const [btn, key] of TRAY){ const cv = $(btn).querySelector('canvas.ti'); if (!cv) continue; const ic = toolIcon(key, 40); cv.width = ic.width; cv.height = ic.height; cv.getContext('2d').drawImage(ic, 0, 0); } }
  const seeds = save.seeds || 0;
  const questOn = G.mode === 'story' && G.n >= QUEST_START;   // quests replace the wall readout (owner, 2026-09-27)
  if (questOn && (force || G.t >= qNext || qFor !== G)){
    qNext = G.t + 0.25; qFor = G;
    qHtml = questsFor(G.def).slice(1).map(q => { const L = questLive(q); return `<span class="qt${L.done ? ' ok' : L.failed ? ' bad' : ''}"><b>${L.txt}</b> ${questShort(q)}</span>`; }).join('');
  }
  const sig = [questOn ? qHtml : '', wf, coins, seeds, Math.round(prog * 100), label, save.fw, save.repair, save.buster, save.lantern, save.mine, save.bomb, save.scarecrow, save.emergency, G.aim, tools.join(','), Math.round(G.fogClear || 0)].join('|');
  if (__RELEASE__ >= 3){ hkMarks(); jukeboxMarks(); }
  if (__RELEASE__ >= 4) fireMarks();   // cheap: rebuilt once per night, two class toggles otherwise
  if (sig === hudSig && !force) return;
  const coinsChanged = hudSig && hudSig.split('|')[1] !== String(coins);
  hudSig = sig;
  const wEl = $('#walls');
  wEl.classList.toggle('quests', questOn);
  if (questOn){ wEl.innerHTML = qHtml; wEl.style.color = ''; wEl.setAttribute('aria-label', 'Quest progress: ' + wEl.textContent); }
  else {
    wEl.innerHTML = `${wf}%<small>walls</small>`;
    wEl.style.color = wf > 60 ? '#b6f07a' : wf > 30 ? '#ffc14a' : '#ff5a4d';
    wEl.setAttribute('aria-label', `Walls at ${wf}% health`);
  }
  $('#lvlLabel').textContent = label;
  $('#prog').style.width = (clamp(prog, 0, 1) * 100).toFixed(1) + '%';
  $('#coinTxt').textContent = coins.toLocaleString(); $('#seedTxt').textContent = seeds.toLocaleString();
  $('#fwCount').textContent = save.fw; $('#fwBtn').disabled = save.fw <= 0;
  $('#rpCount').textContent = save.repair; $('#rpBtn').disabled = save.repair <= 0;
  $('#gbCount').textContent = save.buster; $('#gbBtn').disabled = save.buster <= 0; $('#gbBtn').classList.toggle('aim', G.aim === 'buster');
  $('#lnCount').textContent = save.lantern; $('#lnBtn').disabled = save.lantern <= 0 || (G.fogClear || 0) > 0;
  $('#bmCount').textContent = save.bomb; $('#bmBtn').disabled = save.bomb <= 0; $('#bmBtn').classList.toggle('aim', G.aim === 'bomb');
  if (__RELEASE__ >= 2){ $('#epCount').textContent = save.emergency || 0; $('#epBtn').disabled = !(save.emergency > 0); }
  $('#scCount').textContent = save.scarecrow; $('#scBtn').disabled = save.scarecrow <= 0; $('#scBtn').classList.toggle('aim', G.aim === 'scarecrow');
  $('#lmCount').textContent = save.mine; $('#lmBtn').disabled = save.mine <= 0; $('#lmBtn').classList.toggle('aim', G.aim === 'mine');
  for (const [btn, key] of TRAY){
    const el = $(btn), locked = !tools.includes(key);   // the full set is always shown; locked tools are dimmed with a padlock
    el.classList.toggle('locked', locked); el.hidden = key === 'emergency' && locked;   // Emergency Pumpkins stays out of sight until 6-8 (owner); the rest show padlocked
    if (locked) el.disabled = true;
  }
  if (coinsChanged){ const cb = $('#coinBox'); cb.classList.add('bump'); setTimeout(() => cb.classList.remove('bump'), 120); }
}

export const setHudSig = v => { hudSig = v; };
