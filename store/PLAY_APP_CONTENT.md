# Google Play: App content answers

Play Console → Gourd Guard → **Policy → App content** (also linked from the Dashboard's "Set up your app" list).
Work down each section below and click **Save** at the end of each form.

What the game actually does, so the answers make sense:
- No account, no login. All progress is saved on the phone.
- **Google AdMob** shows reward videos and a full-screen ad after Endless Night runs. AdMob collects the advertising ID, IP address (rough location), ad interactions and crash/performance info.
- **RevenueCat** (with Google Play Billing) handles seed packs. It sees an anonymous app user ID and the purchase history.
- Chests are random, but they are **never sold** for money or seeds. You only get them by playing or from free reward videos. Their odds are shown in the game.
- Players can't chat, share or see each other. The game doesn't use location, contacts, photos, camera or microphone.

---

## 1. Sign-in details (App access)

- Choose: **All functionality in my app is available without any access restrictions**
- No login details are needed.
- Click **Save**.

---

## 2. Ads

- Question: *Does your app contain ads?* → **Yes, my app contains ads**
- Click **Save**.

---

## 3. Content rating

Click **Start questionnaire**.

**Category page**
- Email address: `chenglex1@gmail.com`
- Category: **Game**
- Tick the box to agree to the IARC terms → **Next**

**Questionnaire**

| Question (wording may differ slightly) | Answer |
|---|---|
| Violence: does the app contain violence? | **Yes** |
| → Is the violence realistic, or against human-looking characters? | **No**. The violence is cartoon or fantasy only: pumpkins knock out cartoon monsters. |
| → Blood or gore? | **No** |
| → Is violence the main focus or rewarded in detail? | **No**. Only mild, cartoon violence. |
| Fear / horror: content that might scare young children? | **Yes, mild**. Halloween-themed cartoon monsters (ghouls, mummies, vampires, witches), not realistic and no jump scares. If it only asks Yes/No, choose **Yes**; the rating stays low because the theme is cartoon. |
| Sexuality / nudity | **No** |
| Language / profanity / crude humour | **No** |
| Controlled substances (drugs, alcohol, tobacco) | **No** |
| Gambling (real or simulated) | **No** |
| Random items (loot boxes) bought with real money | **No**. Chests can't be bought; they are earned in play or from free reward videos. |
| Can users interact or communicate with each other? | **No** |
| Does the app share the user's location with other users? | **No** |
| Does the app allow purchases of digital goods? | **Yes**. Seed packs, consumable in-app purchases. |
| Is it a web browser or search engine? | **No** |
| Is it a news, educational or social app? | **No** |
| Unrestricted internet access / user-generated content? | **No** |

Click **Save**, then **Next**. Check the ratings it shows: expect around **PEGI 7 / ESRB Everyone 10+ / IARC 7+**. Then click **Submit**.

---

## 4. Target audience and content

**Target age**: tick **13–15**, **16–17** and **18 and over**.
Don't tick any group under 13. Doing so puts the game under Google's Families policy, which needs a different ad setup (no personalised ads and certified ad networks only).

**Could your store listing unintentionally appeal to children?**
- Answer **No**. Our listing is written for a general audience: no "for kids" wording, and the screenshots show gameplay, not baby characters.
- Google sometimes disagrees with cartoon games. If they write back that the game appeals to children, reply that it is a general-audience puzzle game, or tell Claude and we'll adjust.

**Store presence / ads to children**: if asked whether the app is designed for children, answer **No**.

Click **Next**, check the summary, then **Save**.

---

## 5. Data safety

Click **Start**.

### Step 1: Overview
Just read it, then click **Next**.

### Step 2: Data collection and security

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** |
| Which of the following methods of account creation does your app support? | **My app does not allow users to create an account** |
| Data deletion: do you provide a way for users to request that their data is deleted? | **Yes**, then give the URL `https://liongchenglex.github.io/gourd-guard-support/privacy-policy.html`. The policy's "Your choices" section says how; deleting the app removes local data and users can email for the rest. If the form only offers this for apps with accounts, skip it. |

Click **Next**.

### Step 3: Data types: tick exactly these

| Category | Data type | Tick it? |
|---|---|---|
| Location | **Approximate location** | ✅ (AdMob estimates it from the IP address) |
| Location | Precise location | ❌ |
| Personal info | (name, email, address, etc.) | ❌ none |
| Financial info | **Purchase history** | ✅ (RevenueCat / Google Play Billing) |
| Financial info | Credit card, other | ❌ |
| App activity | **App interactions** | ✅ (AdMob: ad views and taps) |
| App activity | Other (search history, etc.) | ❌ |
| App info and performance | **Crash logs** | ✅ (AdMob SDK) |
| App info and performance | **Diagnostics** | ✅ (AdMob SDK) |
| Device or other IDs | **Device or other IDs** | ✅ (advertising ID for AdMob; anonymous app user ID for RevenueCat) |
| Everything else (health, messages, photos, audio, files, calendar, contacts, web browsing) | | ❌ |

Click **Next**.

### Step 4: Data usage and handling: answer each ticked type

For each type, Play asks four things: **collected or shared**, **processed ephemerally**, **required or optional**, and **why**.

| Data type | Collected | Shared | Processed ephemerally? | Required or optional | Purposes |
|---|---|---|---|---|---|
| **Approximate location** | ✅ | ✅ | No | Required | **Advertising or marketing**, **Analytics**, **Fraud prevention, security, and compliance** |
| **Purchase history** | ✅ | ❌ | No | Required | **App functionality** |
| **App interactions** | ✅ | ✅ | No | Required | **Advertising or marketing**, **Analytics**, **Fraud prevention, security, and compliance** |
| **Crash logs** | ✅ | ❌ | No | Required | **Analytics**, **Fraud prevention, security, and compliance** |
| **Diagnostics** | ✅ | ❌ | No | Required | **Analytics**, **Fraud prevention, security, and compliance** |
| **Device or other IDs** | ✅ | ✅ | No | Required | **App functionality** (purchases), **Advertising or marketing**, **Analytics**, **Fraud prevention, security, and compliance** |

Notes on these choices:
- **Shared = yes** on the ad-related types because data sent to Google for advertising counts as sharing with a third party (this follows Google's own AdMob disclosure guide). RevenueCat works for us as a service provider, so purchase history is **collected but not shared**.
- **Required** because the game doesn't offer a switch to turn the ad SDK off. Players can still limit ad personalisation in their phone settings, which the privacy policy explains.

Click **Next**.

### Step 5: Preview
Check the preview: it should list data **shared** with third parties (the ad data), and it should say **"Data is encrypted in transit"**. Then click **Save**.

---

## Also in App content (if listed)

| Section | Answer |
|---|---|
| **Privacy policy** | `https://liongchenglex.github.io/gourd-guard-support/privacy-policy.html` |
| **Advertising ID** | *Does your app use advertising ID?* → **Yes** → purposes: **Advertising or marketing**, **Analytics**, **Fraud prevention, security, and compliance** |
| **Government apps** | **No** |
| **Financial features** | **My app doesn't provide any financial features** |
| **Health** | **My app does not have any health features** |
| **News app** | **No** |
| **COVID-19 apps** | **My app is not a publicly available COVID-19 contact tracing or status app** |

When every section shows a green tick, go to **Publishing overview → Send changes for review**.
