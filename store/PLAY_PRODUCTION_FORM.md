# Google Play: production access form (draft answers)

Google shows this form once the 14-day closed test is over (ours ran from about 18 October 2026). Google reads the answers, so they must be true for *our* test. These are drafted from what actually happened; the testing provider's suggested answers (`com.chenglex.gourdguard_production.pdf`) were a generic template and claimed things we did not do (surveys, "crucial adjustments" from testers). Edit anything in [brackets] before pasting.

**1) How did you recruit users for your closed test?**

I used a paid testing service (Testers Community) to recruit the testers, and I tested every build myself on an iPhone and an Android phone throughout the test. [Add friends or family here only if you actually invited any.]

**2) How easy was it to recruit testers for your app?**

Easy

**3) Describe the engagement you received from testers during your closed test**

The testers installed each closed-testing build and played through the game on a range of Android phones and OS versions over the 14 days. They reported no crashes or broken features and sent a written feedback report at the end. Alongside that, I played the full game on real devices during the test and found the issues that mattered most, which were fixed in new closed-testing builds during the test.

**4) Provide a summary of the feedback that you received from testers. Include how you collected the feedback.**

Feedback came as a written report from the testing service plus my own device testing. The testers found no crashes or bugs and suggested three improvements: better Play Store screenshots, a "rate this app" button, and the privacy policy and terms of use reachable inside the app. My own testing found that a fast flick from the bottom of the screen could trigger the phone's home gesture and leave the game, that sound did not return after minimising the app, that a double tap zoomed the screen, and that a few level quests asked for more than the level's monsters allowed.

**5) Who is the intended audience for your app?**

Casual puzzle players who like Halloween themes: anyone who enjoys short, strategic match-and-flick rounds. The game has no chat, no accounts and no user-generated content.

**6) Describe how your app provides value to the users.**

Gourd Guard is an original Halloween puzzle game: slide pumpkins into bunches and flick them at the monsters chewing your fence. It offers 100 hand-made levels across five worlds, 14 pumpkin types with different powers, five bosses, an endless mode, costumes and skins, and quests to earn stars. It plays fully offline, with no account needed.

**7) How many installs do you expect your app to have in your first year?**

[Pick the bracket you honestly expect. With no marketing budget, the lowest bracket is the safe answer; Google does not reward big numbers here.]

**8) What changes did you make to your app based on what you learned during your closed test?**

- Fixed flicks from the bottom edge leaving the game (the app now defers the system edge gestures and hides the system bars).
- Fixed the game's sound not returning after the app was minimised.
- Turned off double-tap and pinch zoom and the long-press pop-up.
- Fixed quests that could not be completed (Fire and Ice quests on short levels, Grey pierce quests on levels with too few monsters) and made witches stop hexing mummies, which made them unkillable.
- Rebalanced boss costumes (15 boss items instead of 30) and seed rewards in Endless Night.
- Improved performance in crowded Endless Night runs.
- Added "Rate Gourd Guard", "Privacy policy" and "Terms of use" links in Settings, and a terms of use page, as the testers suggested.
- [Better Play Store screenshots, if done before you submit.]

**9) How did you decide that your app is ready for production?**

The testers reported no crashes or bugs across their devices and OS versions, every issue found during the test was fixed and verified on real devices in later closed-testing builds, all 100 levels and their quests were checked to be completable, and the game runs fully offline. The store listing, privacy policy, terms of use, ads consent flow and in-app purchases are all in place.

**10) What did you do differently this time?**

This is my first production access application for this app. [If Google asked you this because you applied before, describe what changed since then instead.]
