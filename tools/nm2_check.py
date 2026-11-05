"""Release 5 checks (Nightmare Foggy Hollow, docs/superpowers/specs/2026-11-05-release-5-nightmare-hollow-design.md),
against a build served by tools/serve_dist.py. Every Release 5 task adds its checks to CHECKS.
  Playtest build:  npm run build:playtest            then  .venv/bin/python tools/nm2_check.py --url http://127.0.0.1:4173/ --expect on
  Release 4 build: VITE_RELEASE=4 npx vite build      then  ... --expect r4   (nothing from Release 5)
  Release 3 build: VITE_RELEASE=3 npx vite build      then  ... --expect r3
  Release 2 build: VITE_RELEASE=2 npx vite build      then  ... --expect r2
  Store build:     npm run build                      then  ... --expect off
Checks read the global R5 (on only). Exits 1 on any failure. --only runs one check by name."""
import argparse, sys, time, os
from playwright.sync_api import sync_playwright

from w6_check import open_page, ok, FAILS, start, bundle_js, set_stars

R5 = False   # set by --expect: the build holds Release 5 (playtest)
MODE = 'on'


def nm2_start(page, k, coach=False):
    """Start Nightmare 2-k (night 1100 + k). The Release 4 gourd coach is marked seen unless coach=True, so the other checks get a plain night."""
    if not coach: page.evaluate("() => { window.__gg.save.seenGourdCoach = true; }")
    start(page, 1100 + k)


def story_done(upto=40):
    return {n: 3 for n in range(1, upto + 1)}


# ---------- Task 1: the track, the book page and the release checks ----------
R5_NAMES = ('Rot Mist', 'Protector Gourd', 'Lamplighter', 'Fallen Poltergeist', 'Poltergeist 2', 'Plague Doctor 2', 'Wisp Rider 2', 'Fogwalker 2', 'Reaper', 'Poison fog')


def check_r5_absent(browser, url):
    if R5: return   # the playtest build holds whichever of these the finished tasks have added; only the lower builds must hold none
    js = bundle_js()
    for s in R5_NAMES:
        ok(s not in js, f"{s!r} not in the bundle")


def check_n2_track(browser, url):
    page, errors = open_page(browser, url)
    if not R5:
        ok(page.evaluate("() => window.__gg.isOpen ? window.__gg.isOpen(1101) : false") is False, 'N2-1 is not open below Release 5')
        if MODE in ('on', 'r4'): ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") == 1, 'only the Release 4 nightmare table is present')
        page.close(); return
    set_stars(page, {40: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1101)") is False, 'N2-1 stays shut with 2-20 beaten but N1-4 not')
    set_stars(page, {40: 3, 1004: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1101)") is True, 'N2-1 opens once 2-20 and N1-4 are beaten')
    set_stars(page, {1004: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1101)") is False, 'N2-1 stays shut with N1-4 beaten but 2-20 not')
    set_stars(page, {40: 3, 1004: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1102)") is False, 'N2-2 does not exist yet / stays shut')
    d = page.evaluate("() => { const d = window.__gg.levelFor(1101); return [d.label, d.nightmare, d.worldNo, d.levelNo, d.world, d.gourd]; }")
    ok(d == ['N2-1', True, 2, 1, 7, True], f'levelFor(1101): label N2-1, nightmare, story world 2, level 1, theme 7, gourd {d}')
    ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") == 2, 'NIGHTMARE_LEVELS holds the patch and the hollow tables')
    ok(page.evaluate("() => window.__gg.nmNight(2, 1)") == 1101, 'nmNight(2, 1) = 1101')
    nm2_start(page, 1)
    g = page.evaluate("() => { const G = window.__gg.G; return [G.def.label, G.world, G.n, window.__gg.state]; }")
    ok(g == ['N2-1', 7, 1101, 'play'], f'N2-1 starts on the hollow nightmare map {g}')
    time.sleep(1.0)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_n2_book(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    # 2-20 beaten, N1-4 not: the bookmark shows, the page says what is missing and has no stamps
    set_stars(page, story_done())
    page.evaluate("() => window.__gg.openBook(1)"); time.sleep(0.6)
    ok(page.evaluate("() => !document.querySelector('#bBookmark').hidden"), 'the world 2 bookmark appears once 2-20 is beaten')
    page.click('#bBookmark'); time.sleep(0.8)
    t = page.evaluate("() => [document.querySelector('#bkSoon').hidden, document.querySelector('#bkLevels').hidden, document.querySelector('#bkSoon').textContent]")
    ok(not t[0] and t[1] and 'Beat Nightmare 1-4' in t[2], f'a locked page says what is missing {t}')
    page.evaluate("() => window.__gg.openBook(1)"); time.sleep(0.4)
    # both gates met: 16 stamps, N2-1 open, the rest "Coming soon" / shut
    set_stars(page, {**story_done(), 1004: 3})
    page.evaluate("() => window.__gg.openBook(1)"); time.sleep(0.6)
    if page.evaluate("() => !document.querySelector('#spread').classList.contains('nightmare')"): page.click('#bBookmark')
    time.sleep(0.8)
    pg = page.evaluate("() => [...document.querySelectorAll('#bkLevels .pg')].map(b => [b.disabled, b.textContent])")
    soon = page.evaluate("() => [document.querySelector('#bkSoon').hidden, document.querySelector('#bkLevels').hidden]")
    ok(len(pg) == 16, f'the world 2 nightmare page shows 16 stamps ({len(pg)})')
    ok(soon == [True, False], f'the page shows the stamps, not the locked message {soon}')
    if len(pg) == 16:
        ok(not pg[0][0] and all(b[0] for b in pg[1:]), 'only N2-1 is open on a fresh hollow track')
        ok(sum(1 for b in pg if 'Coming soon' in b[1]) == 15, 'the 15 levels not built yet read "Coming soon"')
    # the world 1 page is unchanged
    page.evaluate("() => window.__gg.openBook(0)"); time.sleep(0.6)
    if page.evaluate("() => !document.querySelector('#spread').classList.contains('nightmare')"): page.click('#bBookmark')
    time.sleep(0.8)
    ok(page.evaluate("() => document.querySelectorAll('#bkLevels .pg').length") == 16, 'the world 1 nightmare page still shows 16 stamps')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS = {'check_r5_absent': check_r5_absent, 'check_n2_track': check_n2_track, 'check_n2_book': check_n2_book}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--expect', choices=['on', 'r4', 'r3', 'r2', 'off'], required=True)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    global R5, MODE
    MODE = a.expect; R5 = a.expect == 'on'
    with sync_playwright() as p:
        browser = p.chromium.launch(args=os.environ.get('GG_CHROME_ARGS', '').split())   # e.g. GG_CHROME_ARGS=--disable-gpu when the headless GPU process hangs (a sleeping Mac)
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
