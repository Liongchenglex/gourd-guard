// ---------- Phone app glue (iOS and Android through Capacitor), 2026-10-11 ----------
// Nothing here runs in a browser. In the app it:
//   1. keeps a copy of the save in native storage (UserDefaults / SharedPreferences), which the OS never clears the way it
//      can clear web storage, and restores it if web storage was wiped;
//   2. installs window.GGAds (rewarded ads, src/engine/ads.js) and window.GGStore (seed packs, src/engine/store.js).
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { SAVE_KEY, setSaveMirror } from '../save.js';

export const isNative = () => !!(Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());

/** Run before the game starts. Resolves true when it restored a save and the page is reloading. */
export async function initNative(){
  if (!isNative()) return false;
  try {
    const { value } = await Preferences.get({ key:SAVE_KEY });
    let local = null; try { local = localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (value && !local){ try { localStorage.setItem(SAVE_KEY, value); } catch (e) {} location.reload(); return true; }   // web storage was wiped: bring the save back
    if (local && local !== value) await Preferences.set({ key:SAVE_KEY, value:local });   // first run of the mirror, or it fell behind
  } catch (e) {}
  let pending = null, timer = 0;   // every save is copied, at most twice a second
  setSaveMirror(j => { pending = j; if (!timer) timer = setTimeout(() => { timer = 0; Preferences.set({ key:SAVE_KEY, value:pending }).catch(() => {}); }, 500); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && pending) Preferences.set({ key:SAVE_KEY, value:pending }).catch(() => {}); });   // write at once when the app goes to the background
  return false;
}

// ---------- Rewarded ads: Google AdMob ----------
import { AdMob, AdmobConsentStatus, RewardAdPluginEvents } from '@capacitor-community/admob';
import { ADMOB, REVENUECAT } from '../data/appkeys.js';
import { audioSleep } from './audio.js';

const platform = () => Capacitor.getPlatform();   // 'ios' | 'android'
let adsReady = null, loaded = false, loading = null;

/** Consent (EU/UK form from Google, then Apple's tracking prompt on iOS), then start the SDK. Runs once. */
function startAds(){
  if (adsReady) return adsReady;
  adsReady = (async () => {
    try {
      let ci = await AdMob.requestConsentInfo();
      if (ci.isConsentFormAvailable && ci.status === AdmobConsentStatus.REQUIRED) ci = await AdMob.showConsentForm();
      if (platform() === 'ios'){ try { const t = await AdMob.trackingAuthorizationStatus(); if (t.status === 'notDetermined') await AdMob.requestTrackingAuthorization(); } catch (e) {} }
      if (!ci.canRequestAds) return false;
      await AdMob.initialize({ initializeForTesting:ADMOB.test, tagForChildDirectedTreatment:false });
      return true;
    } catch (e) { return false; }
  })();
  return adsReady;
}
/** Loads one ad ahead so the button plays at once. */
function preload(){
  if (loaded) return Promise.resolve(true);
  if (!loading) loading = AdMob.prepareRewardVideoAd({ adId:ADMOB.rewarded[platform()], isTesting:ADMOB.test })
    .then(() => (loaded = true)).catch(() => false).finally(() => { loading = null; });
  return loading;
}
async function showRewarded(){
  if (!(await startAds())) return false;
  if (!loaded && !(await Promise.race([preload(), new Promise(r => setTimeout(() => r(false), 8000))]))) return false;   // no ad in 8 s: give up
  return new Promise(resolve => {
    let earned = false, done = false; const subs = [];
    const finish = ok => { if (done) return; done = true; subs.forEach(s => s.then(h => h.remove()).catch(() => {})); audioSleep(false); loaded = false; preload(); resolve(ok); };
    subs.push(AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { earned = true; }));
    subs.push(AdMob.addListener(RewardAdPluginEvents.Dismissed, () => finish(earned)));
    subs.push(AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => finish(false)));
    audioSleep(true);   // the ad brings its own sound
    AdMob.showRewardVideoAd().catch(() => finish(false));   // the reward counts only from the SDK's Rewarded event
  });
}

// ---------- Seed packs: in-app purchases through RevenueCat (App Store and Google Play) ----------
import { Purchases, PRODUCT_CATEGORY } from '@revenuecat/purchases-capacitor';
let products = null;   // sku → store product, with the price in the player's own currency

async function startStore(skus){
  const key = REVENUECAT[platform()]; if (!key) return false;
  try {
    await Purchases.configure({ apiKey:key });
    const r = await Purchases.getProducts({ productIdentifiers:skus, type:PRODUCT_CATEGORY.NON_SUBSCRIPTION });
    products = {}; for (const p of r.products || []) products[p.identifier] = p;
    return Object.keys(products).length > 0;
  } catch (e) { return false; }
}

/** Installs window.GGAds and window.GGStore (src/engine/ads.js and src/engine/store.js use them). */
export async function initMoney(skus, onStoreReady){
  if (!isNative()) return;
  window.GGAds = { showRewarded };
  startAds().then(ok => { if (ok) preload(); });
  if (await startStore(skus)){
    window.GGStore = {
      price: sku => products[sku] ? products[sku].priceString : null,
      buy: async sku => {
        const p = products[sku]; if (!p) return { ok:false };
        try { await Purchases.purchaseStoreProduct({ product:p }); return { ok:true }; }
        catch (e) { return { ok:false, cancelled:!!(e && e.userCancelled) }; }
      },
    };
    if (onStoreReady) onStoreReady();
  }
}

// ---------- Android: hardware Back button and full screen ----------
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
const BACK_TEXT = /^(back|back to shelf|close|close book|done|later|not now|cancel|no)\b/i;

/** Back pauses a night, resumes from pause, and otherwise presses the screen's own Back/Done/Close; at the title it
 *  sends the app to the background instead of quitting it. `getState` returns the current screen name. */
export function initBackButton(getState){
  if (!isNative() || platform() !== 'android') return;
  StatusBar.hide().catch(() => {});
  App.addListener('backButton', () => {
    const s = getState(), click = sel => { const b = document.querySelector(sel); if (b && b.offsetParent !== null){ b.click(); return true; } return false; };
    if (s === 'play'){ click('#pauseBtn'); return; }
    if (s === 'pause'){ click('#bResume'); return; }
    if (s === 'title'){ App.minimizeApp(); return; }
    const scopes = [...document.querySelectorAll('.ov.show, .ov.on, [role="dialog"]:not([hidden])')].reverse();   // the top-most open card first
    for (const sc of scopes) for (const b of sc.querySelectorAll('button')) if (b.offsetParent !== null && !b.disabled && BACK_TEXT.test(b.textContent.trim())){ b.click(); return; }
  });
}
