// ---------- App store and ad keys (owner fills these in before release; see docs/LAUNCH.md) ----------
// Until the owner's own keys are in, ads use Google's public TEST ad units (they show "Test Ad" and pay nothing), and seed
// packs stay "on sale with the app store release" because there is no RevenueCat key.
// The AdMob *application* IDs are not here: they live in ios/App/App/Info.plist (GADApplicationIdentifier) and
// android/app/src/main/AndroidManifest.xml (com.google.android.gms.ads.APPLICATION_ID).
export const ADMOB = {
  test: true,   // set to false only when the real rewarded ad unit IDs below are filled in
  rewarded: {
    ios:     'ca-app-pub-3940256099942544/1712485313',   // Google's iOS rewarded test unit: replace with the owner's
    android: 'ca-app-pub-3940256099942544/5224354917',   // Google's Android rewarded test unit: replace with the owner's
  },
  interstitial: {   // the full-screen ad after an Endless Night run
    ios:     'ca-app-pub-3940256099942544/4411468910',   // Google's iOS interstitial test unit: replace with the owner's
    android: 'ca-app-pub-3940256099942544/1033173712',   // Google's Android interstitial test unit: replace with the owner's
  },
};
// RevenueCat public SDK keys (Project settings → API keys). Empty = in-app purchases off.
export const REVENUECAT = { ios:'', android:'' };
