# Gourd Guard: launch checklist

Do these one at a time, top to bottom. Tick each box as you go (`[ ]` → `[x]`).
When a step says **→ Claude**, send me what it asks for and I do that part.

Expect about 3 weeks in total, mostly waiting: Apple and Google take a day or two to approve accounts, and Google needs 14 days of testing before the game can go public.

**Your info, used everywhere:**
- App name: **Gourd Guard**
- App ID / bundle ID / package name: **com.chenglex.gourdguard**
- Version: **1.0**, build **1**

---

## Part 1: Accounts (day 1)

- [x ] **1.1 Apple Developer Program**. Go to developer.apple.com/programs → Enroll. Sign up as an Individual with your Apple ID (two-factor authentication must be on). It costs 99 USD a year, and approval can take up to 2 days.
- [ x] **1.2 Google Play Console**. Go to play.google.com/console → sign up as a **Personal** account. It costs 25 USD once. Google checks your ID and your phone, which can take a few days.
- [x ] **1.3 Google AdMob**. Go to admob.google.com and sign in with the same Google account. Fill in your payment and tax details (Payments → Settings), or AdMob won't pay you.
- [x ] **1.4 RevenueCat**. Go to revenuecat.com and sign up (free).

---

## Part 2: Create the app in each place

### Apple
- [ ] **2.1 Paid apps agreement**. In App Store Connect (appstoreconnect.apple.com) → **Business** (or "Agreements, Tax, and Banking"), accept the **Paid Apps** agreement and fill in bank and tax details. Without this, seed packs can't be sold.
- [ ] **2.2 Create the app**. App Store Connect → Apps → **+** → New App.
  - Platform: iOS
  - Name: Gourd Guard
  - Language: English
  - Bundle ID: com.chenglex.gourdguard. If it isn't in the list, open the project in Xcode once (`npx cap open ios`) → Signing & Capabilities → pick your Team, and it appears.
  - SKU: `gourdguard`

### Google
- [ ] **2.3 Payments profile**. In Play Console → Settings → **Payments profile**, set one up. You need it to sell seed packs.
- [ ] **2.4 Create the app**. Play Console → **Create app**.
  - App name: Gourd Guard
  - Language: English
  - Type: **Game**
  - Price: **Free**
  - Tick the declarations.

### AdMob
- [ ] **2.5 Add the iPhone app**. Apps → Add app → iOS → "Is it listed on a store?" **No** → name "Gourd Guard iOS". Copy its **App ID** (`ca-app-pub-…~…`).
- [ ] **2.6 Make the iPhone ad units**. In that app → Ad units → Add:
  - a **Rewarded** unit named "Seeds reward"
  - an **Interstitial** unit named "Endless end"

  Copy both **ad unit IDs** (`ca-app-pub-…/…`).
- [ ] **2.7 Repeat 2.5 and 2.6 for Android**. Name the app "Gourd Guard Android", and copy its App ID and both ad unit IDs.
- [ ] **2.8 Consent messages**. AdMob → **Privacy & messaging**. These are the pop-ups the game shows before ads; without them, ads in Europe won't work.
  1. Create a **European regulations (GDPR)** message for both apps and publish it.
  2. Create an **IDFA explainer** message for the iOS app and publish it.

### RevenueCat
- [ ] **2.9 Create the project**. Make a new project called "Gourd Guard".
- [ ] **2.10 Add the App Store app**. Use bundle ID com.chenglex.gourdguard. Copy its **public API key** (starts with `appl_`).
- [ ] **2.11 Add the Play Store app**. Use package com.chenglex.gourdguard. Copy its **public API key** (starts with `goog_`).

---

## Part 3: Send me the keys → Claude

- [ ] **3.1 Paste these 9 things to me in chat** (they are all safe to share):
  1. AdMob iOS **App ID**
  2. AdMob iOS **Rewarded** unit ID
  3. AdMob iOS **Interstitial** unit ID
  4. AdMob Android **App ID**
  5. AdMob Android **Rewarded** unit ID
  6. AdMob Android **Interstitial** unit ID
  7. RevenueCat `appl_…` key
  8. RevenueCat `goog_…` key
  9. **A contact email** for the privacy policy (players and the stores use it).

  Never send passwords, `.p8` key files or Google's `.json` key file. Those go only into RevenueCat's website.

- [ ] **3.2 Claude does:**
  - puts the keys in and turns off test ads
  - adds Apple's full ad-network list
  - writes and publishes the **privacy policy** page and gives you its link
  - drafts the **store descriptions and keywords**
  - makes the **screenshots**
  - rebuilds both apps

---

## Part 4: First builds

### iPhone → TestFlight
- [ ] **4.1 Open the project**. In Terminal, in the project folder, run: `npx cap open ios`.
- [ ] **4.2 Pick the build target**. In Xcode, pick **Any iOS Device (arm64)** at the top.
- [ ] **4.3 Archive**. Menu: **Product → Archive** and wait.
- [ ] **4.4 Upload**. In the window that opens: **Distribute App → App Store Connect → Upload**, then click through the defaults.
- [ ] **4.5 Wait for processing**. In App Store Connect → your app → **TestFlight**, wait about 15–30 min. Then add yourself as an internal tester and install the **TestFlight** app on your iPhone.

### Android → closed test (starts the 14-day clock, so do it soon)
- [ ] **4.6 Open the project**. In Terminal, run: `npx cap open android`.
- [ ] **4.7 Check Java**. In Android Studio, make sure Gradle uses **Java 21**: Settings → Build Tools → Gradle → Gradle JDK.
- [ ] **4.8 Build the signed bundle**. Menu: **Build → Generate Signed App Bundle / APK → Android App Bundle**.
  1. Click **Create new** keystore and save the file somewhere safe (not in the project folder).
  2. Pick a password and write it down.
  3. Choose **release**.

  ⚠️ **Back up the keystore file and its password** (for example in a password manager and cloud storage). If you lose them, you can never update the app.
- [ ] **4.9 Upload to closed testing**. Play Console → Test and release → Testing → **Closed testing** → Create track → Create release.
  1. Accept **Play App Signing**.
  2. Upload the `.aab` file from `android/app/release/`.
  3. Release name: 1.0.
- [ ] **4.10 Add 12 testers**. Add **at least 12 testers** (Gmail addresses of friends with Android phones) and save. Send them the **opt-in link** Play Console shows.
- [ ] **4.11 Keep them in for 14 days**. Make sure all 12 tap the link, install the game and **keep it installed for 14 days**. Ask them to open it a few times. Google checks this.

---

## Part 5: Seed packs (in-app purchases)

### Apple
- [ ] **5.1 Create the three products**. App Store Connect → your app → **Monetization → In-App Purchases** → **+** → **Consumable**. Make three:

  | Product ID | Display name | Price |
  |---|---|---|
  | `seeds_10` | 10 Seeds | 3.99 USD |
  | `seeds_25` | 25 Seeds | 7.99 USD |
  | `seeds_50` | 50 Seeds | 10.99 USD |

  Fill in the description ("10 pumpkin seeds") and add a review screenshot. I'll give you one of the shop screen.
- [ ] **5.2 In-App Purchase key**. App Store Connect → Users and Access → **Integrations → In-App Purchase** → generate a key and download the `.p8` file. Upload it in **RevenueCat** → your App Store app (also copy the Issuer ID and Key ID it asks for). Also paste the **App-Specific Shared Secret** if RevenueCat asks; it's under your app → App Information.

### Google
- [ ] **5.3 Create the three products**. Do this after step 4.9: Play Console only allows products once a build is uploaded. Play Console → **Monetize → Products → In-app products** → Create product. Use the same three IDs, names and prices as 5.1, and press **Activate** on each.
- [ ] **5.4 Service account**. Follow RevenueCat's guide "Creating Play Service Credentials" (it's in the Play Store app settings in RevenueCat). It makes a `.json` key file; upload it to RevenueCat. This can take up to 36 hours to start working, which is normal.

### RevenueCat
- [ ] **5.5 Add the products**. In RevenueCat → **Products**, add `seeds_10`, `seeds_25` and `seeds_50` for **both** apps.

---

## Part 6: Test on your phones

On your iPhone (TestFlight) and an Android phone (closed test), check:

- [ ] **6.1** The game opens and plays.
- [ ] **6.2** On first ad, the consent or tracking pop-up appears.
- [ ] **6.3** Watching a seed ad (Seeds tab) gives **1 seed**.
- [ ] **6.4** An Endless Night run longer than 1 minute shows an ad at the end.
- [ ] **6.5** Buying a seed pack works and gives seeds.
  - On iPhone, TestFlight purchases are free (sandbox).
  - On Android, add yourself under Play Console → Settings → **License testing** first so you aren't charged.
- [ ] **6.6** Seed pack buttons show a real price (like "$3.99"), not "coming soon".
- [ ] **6.7** Close the app fully, restart the phone, open again: your progress is still there.
- [ ] **6.8 (Android only)** The phone's Back button pauses a night and closes cards.
- [ ] **6.9** Play levels **1-20, 3-15, 3-19 and 4-10** once each to check they feel fair.
- [ ] **6.10 Tell Claude anything that's wrong** → I fix it, you upload a new build. Before you upload, I bump the build number: Apple and Google reject the same number twice.

---

## Part 7: Store pages and forms

I'll have drafted the text and screenshots in step 3.2; copy them in.

### App Store Connect (your app → the 1.0 version page and the App Information page)
- [ ] **7.1 Screenshots**. Upload the iPhone 6.9" screenshots.
- [ ] **7.2 Text**. Fill in the subtitle, description, keywords and **support URL** (you can use the privacy policy link). Paste in the **privacy policy URL**.
- [ ] **7.3 App Privacy**. Answer "Yes, we collect data":
  - **Identifiers** (Device ID): used for **Third-party advertising**, linked to user: No, used for tracking: **Yes**
  - **Usage data** (Advertising data): **Third-party advertising**
  - **Purchases** (Purchase history): **App functionality**
  - Nothing else
- [ ] **7.4 Age rating**. Fill in the questionnaire: Cartoon or fantasy violence: **Infrequent/Mild**, everything else None. Expect **9+**.
- [ ] **7.5 Category**. Choose **Games → Puzzle** (secondary: Strategy).
- [ ] **7.6 Pricing**. Set price **Free** and availability to all countries.
- [ ] **7.7 Add the seed packs**. On the version page, under "In-App Purchases", **add the three seed packs** so they're reviewed together with the app.
- [ ] **7.8 Pick the build**. Select the TestFlight build you tested.

### Play Console (left menu → Grow → Store presence, and Policy → App content)
- [ ] **7.9 Main store listing**. Fill in the short description, full description, app icon (`store/play-icon-512.png`), feature graphic (`store/play-feature-1024x500.png`) and phone screenshots.
- [ ] **7.10 Category and contact**. Store settings: category **Puzzle**, plus your contact email.
- [ ] **7.11 App content**. Fill in every item:
  - Privacy policy: paste the URL.
  - Ads: **Yes, contains ads**.
  - App access: **All functionality available without special access**.
  - Content rating: fill in the questionnaire (fantasy violence, in-app purchases). Expect Everyone 10+ / PEGI 7.
  - Target audience: **13 and over**. Don't tick under-13 ages, or Google's stricter family rules apply.
  - Data safety:
    - Collects **Device or other IDs** (for advertising) and **Purchase history** (for app functionality)
    - Data is encrypted in transit: Yes
    - Users can't request deletion: there are no accounts
  - Advertising ID: **Yes**, used for **Advertising**.
  - Government app / financial features / health: **No**.

---

## Part 8: Go live

### iPhone
- [ ] **8.1 Submit**. App Store Connect → the 1.0 version page → **Add for Review → Submit**. In "Notes for review" write: *"Seed packs are in the Shop → Seeds tab. Rewarded ads are the 'Watch ad' buttons."* Review usually takes 1–3 days.
- [ ] **8.2 If rejected**. Send me Apple's message → Claude fixes it, and you resubmit.
- [ ] **8.3 Release**. When approved, press **Release** (or set it to release automatically). 🎉

### Android
- [ ] **8.4 Apply for production**. After **14 days** of closed testing with 12 testers: Play Console → Dashboard → **Apply for production access** and answer the questions about your test. Google replies in about a week.
- [ ] **8.5 Release to production**. When approved: Test and release → **Production** → Create release → **Add from library** (pick the tested build) → Review → **Start rollout**. Google reviews it, usually in 1–3 days. 🎉

---

## Part 9: After launch

- [ ] **9.1 Link the apps in AdMob**. AdMob → each app → App settings → **Link to store** (search "Gourd Guard"). Ads earn more once linked.
- [ ] **9.2 app-ads.txt (optional but recommended)**. AdMob asks for an `app-ads.txt` file on your developer website. If you want this, tell Claude and I'll explain the simplest way to host one.
- [ ] **9.3 Check the money**. Look at AdMob and RevenueCat after a few days to see that ads and purchases come in.
- [ ] **9.4 Updating the game later**. Claude changes the game and bumps the version, then you repeat 4.1–4.4 (iPhone) and 4.6–4.8 (Android, with the **same keystore**). Upload to production and submit.
