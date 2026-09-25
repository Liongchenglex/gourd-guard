import { scale } from '../engine/render/canvas.js';
import { FIELD_BOT, FIELD_TOP, G, setBannerTimer } from '../engine/state.js';
import { $, clamp } from '../engine/util.js';
import { wallFrac } from '../engine/walls.js';
import { save } from '../save.js';

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
  if (G.mode !== 'story') prog = 1 - G.bossTimer / 100;
  else if (G.def.boss){   // boss level: the bar fills a little until the boss shows, then tracks its health
    const b = G.monsters.find(m => m.type === 'boss');
    prog = G.bossDead ? 1 : b ? 0.1 + 0.9 * (1 - b.hp / b.maxHp) : 0.1 * Math.min(1, G.spawned / Math.max(1, Math.floor(G.total * 0.4)));
  } else prog = G.total ? G.resolved / G.total : 0;
  const label = G.mode === 'story' ? `Night ${G.def.label}` : `Score ${G.score.toLocaleString()}`;
  const wf = Math.round(wallFrac() * 100);
  const sig = [wf, coins, Math.round(prog * 100), label, save.fw, save.repair, save.buster, G.aim].join('|');
  if (sig === hudSig && !force) return;
  const coinsChanged = hudSig && hudSig.split('|')[1] !== String(coins);
  hudSig = sig;
  const wEl = $('#walls');
  wEl.innerHTML = `${wf}%<small>walls</small>`;
  wEl.style.color = wf > 60 ? '#b6f07a' : wf > 30 ? '#ffc14a' : '#ff5a4d';
  wEl.setAttribute('aria-label', `Walls at ${wf}% health`);
  $('#lvlLabel').textContent = label;
  $('#prog').style.width = (clamp(prog, 0, 1) * 100).toFixed(1) + '%';
  $('#coinTxt').textContent = coins.toLocaleString();
  $('#fwCount').textContent = save.fw; $('#fwBtn').disabled = save.fw <= 0;
  $('#rpCount').textContent = save.repair; $('#rpBtn').disabled = save.repair <= 0;
  $('#gbCount').textContent = save.buster; $('#gbBtn').disabled = save.buster <= 0; $('#gbBtn').classList.toggle('aim', G.aim === 'buster');
  if (coinsChanged){ const cb = $('#coinBox'); cb.classList.add('bump'); setTimeout(() => cb.classList.remove('bump'), 120); }
}

export const setHudSig = v => { hudSig = v; };
