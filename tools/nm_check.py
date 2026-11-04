"""Release 4 checks (Nightmare Pumpkin Patch, docs/superpowers/specs/2026-11-04-release-4-nightmare-patch-design.md),
against a build served by tools/serve_dist.py.
  Playtest build:  npm run build:playtest            then  .venv/bin/python tools/nm_check.py --url http://127.0.0.1:4173/ --expect on
  Release 3 build: VITE_RELEASE=3 npx vite build      then  ... --expect r3   (nothing from Release 4)
  Store build:     npm run build                      then  ... --expect off
Checks read the global R4 (on only). Exits 1 on any failure. --only runs one check by name."""
import argparse, sys, time
from playwright.sync_api import sync_playwright

from w6_check import open_page, ok, FAILS, start, bundle_js, set_stars

R4 = False   # set by --expect: the build holds Release 4 (playtest)
MODE = 'on'


def nm_start(page, k):
    """Start Nightmare 1-k (night 1000 + k)."""
    start(page, 1000 + k)


def story_done(upto=20):
    return {n: 3 for n in range(1, upto + 1)}


# ---------- Task 1: the track, the book page and the release checks ----------
def check_r4_absent(browser, url):
    js = bundle_js()
    for s in ('Embers',):
        ok((s in js) == R4, f"{s!r} {'in' if R4 else 'not in'} the bundle")


def check_nm_track(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    set_stars(page, {20: 0})
    ok(page.evaluate("() => window.__gg.isOpen(1001)") is False, 'N1-1 stays shut until 1-20 is beaten')
    set_stars(page, {20: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1001)") is True, 'N1-1 opens once 1-20 is beaten')
    ok(page.evaluate("() => window.__gg.isOpen(1002)") is False, 'N1-2 stays shut until N1-1 is beaten')
    ok(page.evaluate("() => [window.__gg.NM_BASE, window.__gg.nmNight(1, 5), window.__gg.nmNight(2, 1)]") == [1000, 1005, 1101], 'night numbers: NM_BASE 1000, nmNight(1, 5) = 1005, nmNight(2, 1) = 1101')
    ok(page.evaluate("() => window.__gg.isOpen(1000 + window.__gg.NIGHTMARE_LEVELS[0].length + 1)") is False, 'a night past the nightmare data is not open')
    nm_start(page, 1)
    d = page.evaluate("() => { const G = window.__gg.G; return [G.def.label, G.def.nightmare, G.world, G.n]; }")
    ok(d == ['N1-1', True, 6, 1001], f'N1-1 starts as label N1-1, a nightmare night on the nightmare map (theme 6) {d}')
    set_stars(page, story_done())
    page.evaluate("() => window.__gg.openBook(0)"); time.sleep(0.6)
    page.click('#bBookmark'); time.sleep(0.8)
    pg = page.evaluate("() => [...document.querySelectorAll('#bkLevels .pg')].map(b => [b.disabled, b.textContent])")
    soon = page.evaluate("() => document.querySelector('#bkSoon').hidden")
    grid = page.evaluate("() => document.querySelector('#bkLevels').hidden")
    ok(len(pg) == 16, f'the nightmare page shows 16 level stamps ({len(pg)})')
    ok(soon and not grid, f'the nightmare page hides "Coming soon" and shows the stamps (bkSoon hidden={soon}, bkLevels hidden={grid})')
    if len(pg) == 16:
        ok(pg[15][0] and 'Coming soon' in pg[15][1], f'the 16th stamp is a disabled "Coming soon" {pg[15]}')
        ok(not pg[0][0] and all(b[0] for b in pg[1:]), 'only N1-1 is open on a fresh nightmare track')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_nm_story_rules(browser, url):
    page, errors = open_page(browser, url)
    if not R4:
        ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") == 0, 'no nightmare levels below Release 4')
        set_stars(page, story_done())
        page.evaluate("() => window.__gg.openBook(0)"); time.sleep(0.6)
        page.click('#bBookmark'); time.sleep(0.8)
        soon = page.evaluate("() => !document.querySelector('#bkSoon').hidden && document.querySelector('#bkLevels').hidden")
        ok(soon, 'the nightmare page still says "Coming soon"')
        ok(not errors, f'no page errors {errors[:2]}')
        page.close(); return
    set_stars(page, {**story_done(), **{1000 + k: 3 for k in range(1, 10)}})
    page.evaluate("() => window.__gg.openPreview(1001)"); time.sleep(0.6)
    ok(not errors, f'the N1-1 preview opens without errors {errors[:2]}')
    title = page.evaluate("() => document.querySelector('#pvTitle').textContent")
    ok('1-1' in title and 'Nightmare' in title, f'the preview names the nightmare level ({title!r})')
    nm_start(page, 10)
    page.evaluate("() => window.__gg.endGame(true)"); time.sleep(1.8)
    t = page.evaluate("() => [window.__gg.state, document.querySelector('#rTitle').textContent, [...document.querySelectorAll('#rBtns button')].map(b => b.textContent)]")
    ok(t[0] == 'result' and 'unlocked!' not in t[1], f'winning N1-10 shows no world-unlocked card {t[:2]}')
    ok(page.evaluate("() => window.__gg.save.stars[1011]") is None, 'winning N1-10 does not award N1-11 stars')
    ok(page.evaluate("() => window.__gg.save.stars[1010] > 0"), 'winning N1-10 earns its stars')
    ok(page.evaluate("() => window.__gg.save.coins") < 1000, f"the night bonus is not scaled by the night number ({page.evaluate('() => window.__gg.save.coins')} coins)")
    ok('Next level' in t[2], f'the result offers Next level {t[2]}')
    if 'Next level' in t[2]:
        page.click('#rBtns button:has-text("Next level")'); time.sleep(0.6)
        pv = page.evaluate("() => [window.__gg.state, document.querySelector('#pvTitle').textContent]")
        ok(pv[0] == 'preview' and '1-11' in pv[1], f'Next level opens N1-11 {pv}')
    # Levels returns to world 1's book with nightmare mode kept on
    nm_start(page, 10)
    page.evaluate("() => window.__gg.endGame(true)"); time.sleep(1.8)
    page.click('#rBtns button:has-text("Levels")'); time.sleep(0.8)
    nm = page.evaluate("() => [document.querySelector('#spread').classList.contains('nightmare'), document.querySelector('#bkLevels .pg') && document.querySelectorAll('#bkLevels .pg').length]")
    ok(nm == [True, 16], f'Levels returns to the nightmare page {nm}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS = {'check_r4_absent': check_r4_absent, 'check_nm_track': check_nm_track, 'check_nm_story_rules': check_nm_story_rules}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--expect', choices=['on', 'r3', 'off'], required=True)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    global R4, MODE
    MODE = a.expect; R4 = a.expect == 'on'
    with sync_playwright() as p:
        browser = p.chromium.launch()
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
