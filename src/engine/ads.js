// ---------- Rewarded ads (foundation, owner 2026-09-27) ----------
// One entry point: `showRewarded(placement)` resolves true when the player watched to the end and earned the reward.
// Providers: a native bridge (`window.GGAds.showRewarded(placement) → Promise<boolean>`, to be supplied by the Capacitor
// build with AdMob or similar) or, in the browser, a placeholder ad that runs a short countdown. Placements:
//   'seed'      +1 pumpkin seed, capped per day (SEED_ADS_PER_DAY)
//   'chest'     reroll a treasure chest once
//   'revive'    carry on after a wall falls, once per night
//   'sack'      summon a Loot Sack at the start of a night
import { SEED_ADS_PER_DAY } from '../data/economy.js';
import { persist, save } from '../save.js';
import { musicDuck } from './audio.js';

export const PLACEMENT_TEXT = { seed:'a free pumpkin seed', chest:'a new roll of this chest', revive:'another chance at this night', sack:'a Loot Sack in this night' };
const MOCK_SECONDS = 5;

const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function adDay(){ if (!save.ads || save.ads.day !== today()) save.ads = { day:today(), seed:0 }; return save.ads; }
export const seedAdsLeft = () => Math.max(0, SEED_ADS_PER_DAY - adDay().seed);
export function countSeedAd(){ adDay().seed++; persist(); }

let busy = false;
export function adsBusy(){ return busy; }

export async function showRewarded(placement){
  if (busy) return false;
  if (placement === 'seed' && seedAdsLeft() <= 0) return false;
  busy = true;
  try {
    const native = window.GGAds && typeof window.GGAds.showRewarded === 'function';
    const ok = native ? !!(await window.GGAds.showRewarded(placement)) : await mockAd(placement);
    if (ok && placement === 'seed') countSeedAd();
    return ok;
  } catch (e) { return false; }
  finally { busy = false; }
}

/** Browser stand-in: a full-screen card with a countdown, then a claim button. Closing early forfeits the reward. */
function mockAd(placement){
  return new Promise(resolve => {
    try { musicDuck(0, MOCK_SECONDS + 1.5); } catch (e) {}
    const ov = document.createElement('div'); ov.className = 'adMock'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Advertisement');
    ov.innerHTML = `<div class="adCard"><small>Advertisement</small><b>Your ad plays here</b><p>Ads arrive with the app store build. Watch to the end for ${PLACEMENT_TEXT[placement] || 'your reward'}.</p><div class="adBar"><i></i></div><div class="adBtns"><button class="btn small alt adClose">Close</button><button class="btn small adClaim" disabled>${MOCK_SECONDS}</button></div></div>`;
    (document.getElementById('wrap') || document.body).appendChild(ov);   // inside the game frame so it scales with it
    const claim = ov.querySelector('.adClaim'), bar = ov.querySelector('.adBar i');
    let left = MOCK_SECONDS; bar.style.animationDuration = MOCK_SECONDS + 's';
    const tick = setInterval(() => { left--; if (left > 0) claim.textContent = left; else { clearInterval(tick); claim.disabled = false; claim.textContent = 'Claim reward'; } }, 1000);
    const done = ok => { clearInterval(tick); ov.remove(); resolve(ok); };
    claim.onclick = () => done(true);
    ov.querySelector('.adClose').onclick = () => done(false);
  });
}
