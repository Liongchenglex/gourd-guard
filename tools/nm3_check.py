"""Release 7 checks (Nightmare Witchwood, docs/superpowers/specs/2026-11-08-release-7-nightmare-witchwood-design.md),
against a build served by tools/serve_dist.py. Every Release 7 task adds its checks to CHECKS.
  Playtest build:  npm run build:playtest             then  .venv/bin/python tools/nm3_check.py --url http://127.0.0.1:4174/ --expect on
  Release 6 build: VITE_RELEASE=6 npx vite build      then  ... --expect r6   (nothing from Release 7)
  Release 5 build: VITE_RELEASE=5 npx vite build      then  ... --expect r5
  Release 4/3/2:   VITE_RELEASE=4|3|2 npx vite build  then  ... --expect r4|r3|r2
  Store build:     npm run build                      then  ... --expect off
Checks read the global R7 (on only). Exits 1 on any failure. --only runs one check by name."""
import argparse, sys, time, os
from playwright.sync_api import sync_playwright

from w6_check import open_page, ok, FAILS, start, bundle_js, set_stars

R7 = False   # set by --expect: the build holds Release 7 (playtest)
MODE = 'on'


def nm3_start(page, k, coach=False):
    """Start Nightmare 3-k (night 1200 + k). The gourd coaches (Release 4's Grave Gourd, Release 5's Protector) are marked seen unless
    coach=True, so the other checks get a plain night."""
    if not coach: page.evaluate("() => { window.__gg.save.seenGourdCoach = true; window.__gg.save.seenProtectorCoach = true; }")
    start(page, 1200 + k)


def story_done(upto=60):
    return {n: 3 for n in range(1, upto + 1)}


# ---------- Task 1: the track, the book page and the release checks ----------
R7_NAMES = ["Witch's Brew", 'Wartling Gourd', 'Treant', 'Fallen Hexwitch', 'Ash Crone', 'Blood Coven Witch', 'Triptych Sprite', 'Flask Bearer', 'Cauldron Toad', 'The brew boils']


def check_r7_absent(browser, url):
    if R7: return   # the playtest build holds whichever of these the finished tasks have added; only the lower builds must hold none
    js = bundle_js()
    for s in R7_NAMES:
        ok(s not in js, f"{s!r} not in the bundle")


def check_n3_track(browser, url):
    page, errors = open_page(browser, url)
    if not R7:
        ok(page.evaluate("() => window.__gg.isOpen(1201)") is False, 'N3-1 is not open below Release 7')
        ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") <= 2, 'no third nightmare table below Release 7')
        page.close(); return
    set_stars(page, {60: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1201)") is False, 'N3-1 stays shut with 3-20 beaten but N2-4 not')
    set_stars(page, {60: 3, 1104: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1201)") is True, 'N3-1 opens once 3-20 and N2-4 are beaten')
    set_stars(page, {1104: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1201)") is False, 'N3-1 stays shut with N2-4 beaten but 3-20 not')
    set_stars(page, {60: 3, 1104: 3})
    d = page.evaluate("() => { const d = window.__gg.levelFor(1201); return [d.label, d.nightmare, d.worldNo, d.levelNo, d.world, d.gourd]; }")
    ok(d[:4] == ['N3-1', True, 3, 1] and d[5] is True, f'levelFor(1201): label N3-1, nightmare, story world 3, level 1, gourd {d}')
    ok(page.evaluate("(w) => window.__gg.WORLDS[w].name", d[4]) == 'Witchwood: Nightmare', f'its theme {d[4]} is the Witchwood nightmare map')
    ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") == 3, 'NIGHTMARE_LEVELS holds the patch, hollow and witchwood tables')
    ok(page.evaluate("() => window.__gg.nmNight(3, 1)") == 1201, 'nmNight(3, 1) = 1201')
    ok(page.evaluate("() => window.__gg.isOpen(1202)") is False, 'N3-2 does not exist yet / stays shut')
    nm3_start(page, 1)
    g = page.evaluate("() => { const G = window.__gg.G; return [G.def.label, G.world, G.n, window.__gg.state]; }")
    ok(g == ['N3-1', d[4], 1201, 'play'], f'N3-1 starts on the witchwood nightmare map {g}')
    time.sleep(1.0)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def open_nm_book(page, w):
    page.evaluate("(w) => window.__gg.openBook(w)", w); time.sleep(0.6)
    if page.evaluate("() => !document.querySelector('#spread').classList.contains('nightmare')"): page.click('#bBookmark')
    time.sleep(0.8)


def check_n3_book(browser, url):
    if not R7: return
    page, errors = open_page(browser, url)
    # 3-20 beaten, N2-4 not: the bookmark shows, the page says what is missing and has no stamps
    set_stars(page, story_done())
    page.evaluate("() => window.__gg.openBook(2)"); time.sleep(0.6)
    ok(page.evaluate("() => !document.querySelector('#bBookmark').hidden"), 'the world 3 bookmark appears once 3-20 is beaten')
    page.click('#bBookmark'); time.sleep(0.8)
    t = page.evaluate("() => [document.querySelector('#bkSoon').hidden, document.querySelector('#bkLevels').hidden, document.querySelector('#bkSoon').textContent]")
    ok(not t[0] and t[1] and 'Beat Nightmare 2-4' in t[2], f'a locked page says what is missing {t}')
    # 3-20 not beaten (N2-4 is, and 3-19 too): no bookmark at all
    set_stars(page, {**{n: 3 for n in range(1, 60)}, 1104: 3})
    page.evaluate("() => window.__gg.openBook(2)"); time.sleep(0.6)
    ok(page.evaluate("() => document.querySelector('#bBookmark').hidden"), 'no bookmark with only 3-19 beaten')
    # both gates met: 16 stamps, N3-1 open, the rest "Coming soon" / shut
    set_stars(page, {**story_done(), 1104: 3})
    open_nm_book(page, 2)
    pg = page.evaluate("() => [...document.querySelectorAll('#bkLevels .pg')].map(b => [b.disabled, b.textContent])")
    soon = page.evaluate("() => [document.querySelector('#bkSoon').hidden, document.querySelector('#bkLevels').hidden]")
    ok(len(pg) == 16, f'the world 3 nightmare page shows 16 stamps ({len(pg)})')
    ok(soon == [True, False], f'the page shows the stamps, not the locked message {soon}')
    if len(pg) == 16:
        ok(not pg[0][0] and all(b[0] for b in pg[1:]), 'only N3-1 is open on a fresh witchwood track')
        built = page.evaluate("() => window.__gg.NIGHTMARE_LEVELS[2].length")
        ok(sum(1 for b in pg if 'Coming soon' in b[1]) == 16 - built, f'the {16 - built} levels not built yet read "Coming soon"')
    # the world 1 and 2 pages are unchanged
    set_stars(page, {**story_done(), 1004: 3, 1104: 3})
    for w in (0, 1):
        open_nm_book(page, w)
        ok(page.evaluate("() => document.querySelectorAll('#bkLevels .pg').length") == 16, f'the world {w + 1} nightmare page still shows 16 stamps')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS = {'check_r7_absent': check_r7_absent, 'check_n3_track': check_n3_track, 'check_n3_book': check_n3_book}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--expect', choices=['on', 'r6', 'r5', 'r4', 'r3', 'r2', 'off'], required=True)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    global R7, MODE
    MODE = a.expect; R7 = a.expect == 'on'
    with sync_playwright() as p:
        browser = p.chromium.launch(args=os.environ.get('GG_CHROME_ARGS', '').split())   # e.g. GG_CHROME_ARGS=--disable-gpu when the headless GPU process hangs
        for name, fn in CHECKS.items():
            if a.only and name != a.only: continue
            print(name)
            try: fn(browser, a.url)
            except Exception as e: ok(False, f'{name} raised {str(e).splitlines()[0]}')
        browser.close()
    print(f'{len(FAILS)} failure(s)' if FAILS else 'all checks passed')
    sys.exit(1 if FAILS else 0)


if __name__ == '__main__':
    main()
