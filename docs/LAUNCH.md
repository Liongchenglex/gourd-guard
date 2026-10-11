# Launch checklist (iPhone and Android)

What is built, what the owner has to supply, and the order to do it in. Last updated 2026-10-11.

## Built in the game (done)

- **Testing links removed**: "unlock all levels" and "add 500 seeds" are gone.
- **Saves are safe in the app**: every save is also copied into the phone's own app storage (`src/engine/native.js`, `@capacitor/preferences`). If iOS or Android clears the web storage, the game restores the save from that copy on the next launch. Existing saves carry over automatically. Nothing changes in a browser.
- **Chest odds**: every chest has a "What's inside?" link listing each prize and its chance, read straight from `CHESTS` in `src/data/economy.js` (Apple and Google require odds for random rewards connected to purchases).
- **Rewarded ads**: real Google AdMob ads in the app (`@capacitor-community/admob`). Before the first ad the game asks for consent where the law requires it (Google's EU/UK form) and, on iPhone, shows Apple's "allow tracking" prompt. A reward is given only when AdMob reports the video was watched. The next ad loads in the background so the button plays straight away. If no ad loads within 8 seconds, nothing is charged and nothing is given. Plus one **full-screen ad after every Endless Night run** of a minute or longer, before the result card (skippable after a few seconds; story nights never show one; `ENDLESS_AD_MIN_SECONDS` in `src/data/economy.js`). **Real ad units are in** (2026-10-11); set `ADMOB.test = true` in `src/data/appkeys.js` to go back to Google's test ads.
- **Seed packs**: real purchases through RevenueCat, which talks to both the App Store and Google Play (`@revenuecat/purchases-capacitor`). Buttons show the store's price in the player's own currency. RevenueCat keys are in (2026-10-11). The packs go live in the app once the three products exist in the store and in RevenueCat; until then they say they go on sale with the store release.
- **Android app**: `android/` project (portrait only, status bar hidden, the hardware Back button pauses a night, closes cards and at the title sends the app to the background instead of quitting).
- **Icons and launch screens** for both phones, and store art in `store/`: `appstore-icon-1024.png`, `play-icon-512.png`, `play-feature-1024x500.png`. Redraw with `.venv/bin/python tools/app_art.py`.

## What I need from you

### 1. Accounts (you)
- **Apple Developer Program**, 99 USD a year: developer.apple.com/programs.
- **Google Play Console**, 25 USD once: play.google.com/console. Google asks new personal accounts to run a **closed test with at least 12 testers for 14 days** before the game can go public, so start that early.
- **Google AdMob** (free): admob.google.com. Add two apps, "Gourd Guard iOS" and "Gourd Guard Android", and in each make one **Rewarded** ad unit and one **Interstitial** ad unit.
- **RevenueCat** (free until 2,500 USD a month in revenue): revenuecat.com. One project with an App Store app and a Play Store app.

### 2. Keys to send me (eight)
| What | Where you find it | Where it goes |
|---|---|---|
| AdMob **app ID** for iOS (`ca-app-pub-…~…`) | AdMob → Apps → App settings | `ios/App/App/Info.plist` (`GADApplicationIdentifier`) |
| AdMob **app ID** for Android | same | `android/app/src/main/AndroidManifest.xml` |
| AdMob **rewarded ad unit ID** for iOS (`ca-app-pub-…/…`) | AdMob → Apps → Ad units | `src/data/appkeys.js` |
| AdMob **rewarded ad unit ID** for Android | same | `src/data/appkeys.js` |
| AdMob **interstitial ad unit ID** for iOS | same | `src/data/appkeys.js` |
| AdMob **interstitial ad unit ID** for Android | same | `src/data/appkeys.js` |
| RevenueCat **public SDK key** for iOS (`appl_…`) | RevenueCat → Project settings → API keys | `src/data/appkeys.js` |
| RevenueCat **public SDK key** for Android (`goog_…`) | same | `src/data/appkeys.js` |

These are public keys that ship inside every app, so they are safe to paste into chat. Never send passwords, the App Store Connect API private key, or the Google service account JSON file; those go straight into RevenueCat's website.

### 3. Store products (you, in each store)
Create three **consumable** in-app products with exactly these IDs, in App Store Connect and in Play Console:

| Product ID | Seeds | Suggested price |
|---|---|---|
| `seeds_10` | 10 | 3.99 USD |
| `seeds_25` | 25 | 7.99 USD |
| `seeds_50` | 50 | 10.99 USD |

Then add the same three products in RevenueCat for both apps. RevenueCat's setup walks you through linking each store.

### 4. Privacy and listing (you, I can draft)
- **Privacy policy page**: live at https://liongchenglex.github.io/gourd-guard-support/privacy-policy.html, with a support page at https://liongchenglex.github.io/gourd-guard-support/ (GitHub repo `Liongchenglex/gourd-guard-support`; source in `store/support-site/`). app-ads.txt is at https://liongchenglex.github.io/app-ads.txt.
- **App Store privacy labels** and **Google Play Data safety form**: ads mean "Identifiers" and "Usage data" used for "Third-party advertising"; purchases mean "Purchase history". No account, name, email or location is collected by the game itself.
- **Age rating**: fill in the questionnaire in each store (cartoon fantasy violence, in-app purchases, ads). Expect 9+ on the App Store and Everyone 10+ / PEGI 7 on Google Play. Do **not** mark the game as made for children: that would stop personalised ads and needs a different ad setup.
- **Screenshots**: iPhone 6.9" (1320×2868) and Android phone shots. I can capture these from the game.
- **Description and keywords**: I can draft them.

### 5. Before submitting (together)
- [x] Eight keys in, `ADMOB.test = false` (2026-10-11).
- [x] Full `SKAdNetworkItems` list from Google's iOS guide is in `Info.plist` (50 networks, 2026-10-11).
- [ ] Test on your iPhone through **TestFlight** and on a real Android phone: an ad pays a seed, a sandbox purchase gives seeds, the save survives deleting and reinstalling is NOT expected (that clears app storage on purpose), but survives restarting the phone.
- [ ] Play the levels the balance bot could not judge (3-15, 3-19, 4-10, 1-20).
- [ ] Build the release versions: Xcode → Product → Archive (iPhone); Android Studio → Build → Generate Signed App Bundle (keep the upload key file and its password safe: losing it means you can't update the app).

## Android build notes
- Android Studio needs **Java 21** for this project. If the build says "invalid source release: 21", update Android Studio (newer versions bundle Java 21) or set File → Settings → Build Tools → Gradle → Gradle JDK to a Java 21.
- After any game change: `npm run build`, then `npx cap sync` (both phones), then open `android/` in Android Studio and press Run with your phone plugged in (USB debugging on).
- The game was built and installed on an Android emulator, but the emulator on this Mac was too slow to finish loading it, so **the first real Android check is on your phone**.
