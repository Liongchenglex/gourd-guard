import { toolsForNight, highestOpen } from '../data/worlds/index.js';
import { scale } from '../engine/render/canvas.js';
import { FIELD_BOT, FIELD_TOP, G, setBannerTimer } from '../engine/state.js';
import { $, clamp } from '../engine/util.js';
import { wallFrac } from '../engine/walls.js';
import { save } from '../save.js';
import { toolIcon } from '../engine/render/tools.js';
import { QUEST_START, questsFor, questLive, questShort } from '../data/quests.js';
import { HOUR_SECONDS as E_HOUR } from '../data/endless.js';
let trayDrawn = false;
let qNext = -1, qHtml = '', qFor = null;   // quest trackers, rebuilt 4 times a second rather than every frame

export function banner(big, sub, dur){
  $('#bnBig').textContent = big; $('#bnSub').textContent = sub || '';
  const b = $('#banner'); b.style.top = (FIELD_TOP + (FIELD_BOT - FIELD_TOP) * 0.14) * scale + 'px';
  b.classList.add('show'); setBannerTimer(dur || 2);
}

export let hudSig = '';

export function updateHud(force){
  if (!G || G.mode === 'demo') return;
  const coins = save.coins + G.coins;
  let prog;
  if (G.mode !== 'story') prog = (G.t % E_HOUR) / E_HOUR;   // endless: progress to the next hour
  else if (G.def.boss){   // boss level: the bar fills a little until the boss shows, then tracks its health
    const bs = G.monsters.filter(m => m.type === 'boss'), hp = bs.reduce((a, b) => a + Math.max(0, b.hp), 0), mx = bs.reduce((a, b) => a + b.maxHp, 0);
    prog = G.bossDead ? 1 : bs.length ? 0.1 + 0.9 * (1 - hp / mx) : 0.1 * Math.min(1, G.spawned / Math.max(1, Math.floor(G.total * 0.4)));
  } else prog = G.total ? G.resolved / G.total : 0;
  const label = G.mode === 'story' ? `Night ${G.def.label}` : `${G.frenzy ? 'Frenzy' : 'Hour'} ${(G.hour || 0) + 1} · ${G.score.toLocaleString()}`;
  const wf = Math.round(wallFrac() * 100);
  const tools = toolsForNight(G.mode === 'story' ? Math.max(G.n, highestOpen()) : highestOpen());
  if (!trayDrawn){ trayDrawn = true; for (const [btn, key] of [['#rpBtn', 'repair'], ['#fwBtn', 'fw'], ['#gbBtn', 'buster'], ['#lnBtn', 'lantern'], ['#lmBtn', 'mine'], ['#bmBtn', 'bomb'], ['#scBtn', 'scarecrow']]){ const cv = $(btn).querySelector('canvas.ti'); if (!cv) continue; const ic = toolIcon(key, 40); cv.width = ic.width; cv.height = ic.height; cv.getContext('2d').drawImage(ic, 0, 0); } }
  const seeds = save.seeds || 0;
  const questOn = G.mode === 'story' && G.n >= QUEST_START;   // quests replace the wall readout (owner, 2026-09-27)
  if (questOn && (force || G.t >= qNext || qFor !== G)){
    qNext = G.t + 0.25; qFor = G;
    qHtml = questsFor(G.def).slice(1).map(q => { const L = questLive(q); return `<span class="qt${L.done ? ' ok' : L.failed ? ' bad' : ''}"><b>${L.txt}</b> ${questShort(q)}</span>`; }).join('');
  }
  const sig = [questOn ? qHtml : '', wf, coins, seeds, Math.round(prog * 100), label, save.fw, save.repair, save.buster, save.lantern, save.mine, save.bomb, save.scarecrow, G.aim, tools.join(','), Math.round(G.fogClear || 0)].join('|');
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
  $('#scCount').textContent = save.scarecrow; $('#scBtn').disabled = save.scarecrow <= 0; $('#scBtn').classList.toggle('aim', G.aim === 'scarecrow');
  $('#lmCount').textContent = save.mine; $('#lmBtn').disabled = save.mine <= 0; $('#lmBtn').classList.toggle('aim', G.aim === 'mine');
  for (const [btn, key] of [['#rpBtn', 'repair'], ['#fwBtn', 'fw'], ['#gbBtn', 'buster'], ['#lnBtn', 'lantern'], ['#lmBtn', 'mine'], ['#bmBtn', 'bomb'], ['#scBtn', 'scarecrow']]){
    const el = $(btn), locked = !tools.includes(key);   // the full set is always shown; locked tools are dimmed with a padlock
    el.classList.toggle('locked', locked); el.hidden = false;
    if (locked) el.disabled = true;
  }
  if (coinsChanged){ const cb = $('#coinBox'); cb.classList.add('bump'); setTimeout(() => cb.classList.remove('bump'), 120); }
}

export const setHudSig = v => { hudSig = v; };
