// ---------- App store and ad keys (owner fills these in before release; see docs/LAUNCH.md) ----------
// The AdMob *application* IDs are not here: they live in ios/App/App/Info.plist (GADApplicationIdentifier) and
// android/app/src/main/AndroidManifest.xml (com.google.android.gms.ads.APPLICATION_ID).
export const ADMOB = {
  test: false,   // true = Google test ads ("Test Ad" label, pays nothing); the owner's real units are in (2026-10-11)
  rewarded: {   // "Seeds reward": seed ads, revive, chest reroll, Loot Sack
    ios:     'ca-app-pub-9162409335136550/6447844417',
    android: 'ca-app-pub-9162409335136550/6087742606',
  },
  interstitial: {   // "Endless end": the full-screen ad after an Endless Night run
    ios:     'ca-app-pub-9162409335136550/3957412445',
    android: 'ca-app-pub-9162409335136550/7372904111',
  },
};
// RevenueCat public SDK keys (Project settings → API keys). Empty = in-app purchases off.
export const REVENUECAT = { ios:'appl_UzKtocTYerztpmTbIAXDGUqBnVZ', android:'goog_saWUEUGejDPTzbXPvCpJxtcNLde' };
