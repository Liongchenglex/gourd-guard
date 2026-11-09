"""Release 9 checks (Nightmare Drowned Marsh, docs/superpowers/specs/2026-11-09-release-9-nightmare-marsh-design.md),
against a build served by tools/serve_dist.py (port 4176 for the r9 worktree). Every Release 9 task adds its checks to CHECKS.
  Playtest build:  npm run build:playtest             then  .venv/bin/python tools/nm5_check.py --url http://127.0.0.1:4176/ --expect on
  Release 8 build: VITE_RELEASE=8 npx vite build      then  ... --expect r8   (nothing from Release 9)
  Release 7..2:    VITE_RELEASE=7|6|5|4|3|2 npx vite build  then  ... --expect r7|r6|r5|r4|r3|r2
  Store build:     npm run build                      then  ... --expect off
Checks read the global R9 (on only). Exits 1 on any failure. --only runs one check by name."""
import argparse, sys, time, os
from playwright.sync_api import sync_playwright

from w6_check import open_page, ok, FAILS, start, bundle_js, set_stars
from nm3_check import open_nm_book, story_done

R9 = False   # set by --expect: the build holds Release 9 (playtest)
MODE = 'on'


def nm5_start(page, k, coach=False):
    """Start Nightmare 5-k (night 1400 + k). The gourd coaches of Releases 4 and 5 are marked seen unless coach=True, so the other
    checks get a plain night."""
    if not coach: page.evaluate("() => { window.__gg.save.seenGourdCoach = true; window.__gg.save.seenProtectorCoach = true; }")
    start(page, 1400 + k)


def marsh_page(browser, url):
    """A quiet N5 night with the test hooks, paused: nothing spawning or sprouting, no monsters, with its sea and puddles. Returns (page, errors)."""
    page, errors = open_page(browser, url)
    nm5_start(page, 1); time.sleep(0.3)
    page.evaluate("() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.projs.length = 0; G.drops.length = 0; G.idle = -1e9; G.hint = null; g.setState('pause'); }")
    return page, errors


# ---------- Task 1: the track, the book page, the blood sea ----------
# Names no lower build may hold. Not listed, because older builds already hold them for story reasons: 'Kraken' and 'Turtle Rider'
# (comments in ported art, absent from a minified bundle but not from the source) and 'e4d9bd' (the Protector Gourd's shell colour).
R9_NAMES = ['Blood Slime', 'Storm Eel', 'Siren', 'Swan Gourd', 'Fallen Twin Tides', 'Whirlpool', 'Beat Nightmare 4-4', 'marshN-blood']


def check_r9_absent(browser, url):
    if R9: return   # the playtest build holds whichever of these the finished tasks have added; only the lower builds must hold none
    js = bundle_js()
    for s in R9_NAMES:
        ok(s not in js, f"{s!r} not in the bundle")


PROBE = """() => { const g = window.__gg, c = g.ctx, f = c.drawImage, srcs = [];
  c.drawImage = function(s, ...a){ srcs.push(s); return f.call(this, s, ...a); };
  try { g.drawSea(0); } finally { delete c.drawImage; }
  const s = srcs[0], d = s.getContext('2d').getImageData(Math.floor(s.width / 2), Math.floor(s.height * 0.5), 1, 1).data;
  return [d[0], d[1], d[2], srcs.length]; }"""


def check_n5_track(browser, url):
    page, errors = open_page(browser, url)
    if not R9:
        ok(page.evaluate("() => window.__gg.isOpen(1401)") is False, 'N5-1 is not open below Release 9')
        ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") <= 4, 'no fifth nightmare table below Release 9')
        page.close(); return
    set_stars(page, {100: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1401)") is False, 'N5-1 stays shut with 5-20 beaten but N4-4 not')
    set_stars(page, {100: 3, 1304: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1401)") is True, 'N5-1 opens once 5-20 and N4-4 are beaten')
    set_stars(page, {1304: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1401)") is False, 'N5-1 stays shut with N4-4 beaten but 5-20 not')
    set_stars(page, {100: 3, 1304: 3})
    d = page.evaluate("() => { const d = window.__gg.levelFor(1401); return [d.label, d.nightmare, d.worldNo, d.levelNo, d.world, d.gourd]; }")
    ok(d[:4] == ['N5-1', True, 5, 1], f'levelFor(1401): label N5-1, nightmare, story world 5, level 1 {d}')
    w = page.evaluate("(w) => [window.__gg.WORLDS[w].name, window.__gg.WORLDS[w].scene]", d[4])
    ok(w == ['Drowned Marsh: Nightmare', 'marshN'], f'its theme {d[4]} is the blood Marsh map {w}')
    ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") == 5, 'NIGHTMARE_LEVELS holds the patch, hollow, witchwood, keep and marsh tables')
    ok(page.evaluate("() => window.__gg.nmNight(5, 1)") == 1401, 'nmNight(5, 1) = 1401')
    ok(page.evaluate("() => window.__gg.isOpen(1402)") is False, 'N5-2 does not exist yet / stays shut')
    nm5_start(page, 1)
    g = page.evaluate("() => { const G = window.__gg.G; return [G.def.label, G.world, G.n, window.__gg.state, !!G.def.sea]; }")
    ok(g == ['N5-1', d[4], 1401, 'play', True], f'N5-1 starts on the blood Marsh map, with its sea {g}')
    time.sleep(1.0)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_n5_blood_sea(browser, url):
    if not R9: return
    page, errors = marsh_page(browser, url)
    r, g, b, n = page.evaluate(PROBE)
    ok(r > 2 * b and r > g, f'the N5 sea base sprite is blood red (rgb {r},{g},{b})')
    ok(n >= 3, f'drawSea still lays its base, waves and foam ({n} drawImage calls)')
    # a story Marsh night keeps its blue sea
    start(page, 86); time.sleep(0.3)
    page.evaluate("() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; g.setState('pause'); }")
    ok(page.evaluate("() => !!window.__gg.G.def.sea") is True, '5-6 (story) has its sea')
    r, g, b, n = page.evaluate(PROBE)
    ok(b > 2 * r, f'the story sea stays blue (rgb {r},{g},{b})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_n5_book(browser, url):
    if not R9: return
    page, errors = open_page(browser, url)
    # 5-20 beaten, N4-4 not: the bookmark shows, the page says what is missing and has no stamps
    set_stars(page, story_done(100))
    page.evaluate("() => window.__gg.openBook(4)"); time.sleep(0.6)
    ok(page.evaluate("() => !document.querySelector('#bBookmark').hidden"), 'the world 5 bookmark appears once 5-20 is beaten')
    page.click('#bBookmark'); time.sleep(0.8)
    t = page.evaluate("() => [document.querySelector('#bkSoon').hidden, document.querySelector('#bkLevels').hidden, document.querySelector('#bkSoon').textContent]")
    ok(not t[0] and t[1] and 'Beat Nightmare 4-4' in t[2], f'a locked page says what is missing {t}')
    # 5-20 not beaten: no bookmark at all
    set_stars(page, {**{n: 3 for n in range(1, 100)}, 1304: 3})
    page.evaluate("() => window.__gg.openBook(4)"); time.sleep(0.6)
    ok(page.evaluate("() => document.querySelector('#bBookmark').hidden"), 'no bookmark with only 5-19 beaten')
    # both gates met: 16 stamps, N5-1 open, the rest "Coming soon"
    set_stars(page, {**story_done(100), 1304: 3})
    open_nm_book(page, 4)
    pg = page.evaluate("() => [...document.querySelectorAll('#bkLevels .pg')].map(b => [b.disabled, b.textContent])")
    soon = page.evaluate("() => [document.querySelector('#bkSoon').hidden, document.querySelector('#bkLevels').hidden]")
    ok(len(pg) == 16, f'the world 5 nightmare page shows 16 stamps ({len(pg)})')
    ok(soon == [True, False], f'the page shows the stamps, not the locked message {soon}')
    if len(pg) == 16:
        ok(not pg[0][0] and all(b[0] for b in pg[1:]), 'only N5-1 is open on a fresh marsh track')
        built = page.evaluate("() => window.__gg.NIGHTMARE_LEVELS[4].length")
        ok(sum(1 for b in pg if 'Coming soon' in b[1]) == 16 - built, f'the {16 - built} levels not built yet read "Coming soon"')
    set_stars(page, {**story_done(100), 1004: 3, 1104: 3, 1204: 3, 1304: 3})
    for w in (0, 1, 2, 3):
        open_nm_book(page, w)
        ok(page.evaluate("() => document.querySelectorAll('#bkLevels .pg').length") == 16, f'the world {w + 1} nightmare page still shows 16 stamps')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS = {'check_r9_absent': check_r9_absent, 'check_n5_track': check_n5_track, 'check_n5_blood_sea': check_n5_blood_sea, 'check_n5_book': check_n5_book}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--expect', choices=['on', 'r8', 'r7', 'r6', 'r5', 'r4', 'r3', 'r2', 'off'], required=True)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    global R9, MODE
    MODE = a.expect; R9 = a.expect == 'on'
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
