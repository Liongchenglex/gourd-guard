// ---------- The Crown of Stars reveal (owner, 2026-09-27) ----------
// Shown once, the moment the player owns every star: the crown turns in a burst of light, then Wear it now / Later.
import { STAR_COSTUME, starsMax } from '../data/wardrobe.js';
import { costumeIcon } from '../engine/render/wardrobe.js';
import { SFX } from '../engine/audio.js';
import { persist, save } from '../save.js';

export function showCrownReveal(after){
  const host = document.getElementById('wrap') || document.body;
  const ov = document.createElement('div'); ov.className = 'crownReveal'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Crown of Stars unlocked');
  ov.innerHTML = `<div class="crCard"><div class="crRays" aria-hidden="true"></div><div class="crArt"></div>
    <h2>Every star collected!</h2><p>All ${starsMax()} stars across the five worlds. Your pumpkins have earned the <b>Crown of Stars</b>, and every hit now bursts into a supernova.</p>
    <div class="row"><button class="btn small" data-a="wear">Wear it now</button><button class="btn small alt" data-a="later">Later</button></div></div>`;
  const art = ov.querySelector('.crArt'); const ic = costumeIcon(STAR_COSTUME, 150); art.appendChild(ic);
  for (let i = 0; i < 10; i++){ const sp = document.createElement('i'); sp.style.setProperty('--a', (i * 36) + 'deg'); sp.style.setProperty('--d', (1 + (i % 3) * .15) + 's'); art.appendChild(sp); }
  const close = wear => { if (wear){ save.wardrobe.costume = STAR_COSTUME; persist(); SFX.ui('pick'); } ov.remove(); if (after) after(wear); };
  ov.querySelector('[data-a="wear"]').onclick = () => close(true);
  ov.querySelector('[data-a="later"]').onclick = () => close(false);
  host.appendChild(ov);
  try { SFX.perk(); setTimeout(() => SFX.star(), 600); } catch (e) {}
}
