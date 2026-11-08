"""Release 8 checks (Nightmare Crumbling Keep, docs/superpowers/specs/2026-11-08-release-8-nightmare-keep-design.md),
against a build served by tools/serve_dist.py (port 4175 for the r8 worktree). Every Release 8 task adds its checks to CHECKS.
  Playtest build:  npm run build:playtest             then  .venv/bin/python tools/nm4_check.py --url http://127.0.0.1:4175/ --expect on
  Release 7 build: VITE_RELEASE=7 npx vite build      then  ... --expect r7   (nothing from Release 8)
  Release 6..2:    VITE_RELEASE=6|5|4|3|2 npx vite build  then  ... --expect r6|r5|r4|r3|r2
  Store build:     npm run build                      then  ... --expect off
Checks read the global R8 (on only). Exits 1 on any failure. --only runs one check by name."""
import argparse, sys, time, os
from playwright.sync_api import sync_playwright

from w6_check import open_page, ok, FAILS, start, bundle_js, set_stars
from nm3_check import open_nm_book, story_done

R8 = False   # set by --expect: the build holds Release 8 (playtest)
MODE = 'on'


def nm4_start(page, k, coach=False):
    """Start Nightmare 4-k (night 1300 + k). The gourd coaches (Release 4's Grave Gourd, Release 5's Protector) are marked seen unless
    coach=True, so the other checks get a plain night."""
    if not coach: page.evaluate("() => { window.__gg.save.seenGourdCoach = true; window.__gg.save.seenProtectorCoach = true; }")
    start(page, 1300 + k)


def keep_page(browser, url):
    """A quiet N4 night with the test hooks: nothing spawning or sprouting, no monsters. Returns (page, errors)."""
    page, errors = open_page(browser, url)
    nm4_start(page, 1); time.sleep(0.3)
    page.evaluate("() => { const G = window.__gg.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.projs.length = 0; G.drops.length = 0; G.idle = -1e9; G.hint = null; }")
    return page, errors


# ---------- Task 1: the track, the book page, the weather ----------
R8_NAMES = ['Storm Lancer', 'Storm Marshal', 'Blood Glutton', 'Bat Bride', 'Lobber Cart', 'Gatehouse', 'Archer Tower', 'Crookneck Gourd', 'Siege Tower', 'Fallen Count', 'b9cf3c']


def check_r8_absent(browser, url):
    if R8: return   # the playtest build holds whichever of these the finished tasks have added; only the lower builds must hold none
    js = bundle_js()
    for s in R8_NAMES:
        ok(s not in js, f"{s!r} not in the bundle")
    ok('Storm Gate' not in js and 'Beat Nightmare 3-4' not in js, "the N4-1 name and the gate text are not in the bundle")   # ('Crumbling Keep: Nightmare' is the archived scene's name, in since Release 4)


def check_n4_track(browser, url):
    page, errors = open_page(browser, url)
    if not R8:
        ok(page.evaluate("() => window.__gg.isOpen(1301)") is False, 'N4-1 is not open below Release 8')
        ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") <= 3, 'no fourth nightmare table below Release 8')
        page.close(); return
    set_stars(page, {80: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1301)") is False, 'N4-1 stays shut with 4-20 beaten but N3-4 not')
    set_stars(page, {80: 3, 1204: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1301)") is True, 'N4-1 opens once 4-20 and N3-4 are beaten')
    set_stars(page, {1204: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1301)") is False, 'N4-1 stays shut with N3-4 beaten but 4-20 not')
    set_stars(page, {80: 3, 1204: 3})
    d = page.evaluate("() => { const d = window.__gg.levelFor(1301); return [d.label, d.nightmare, d.worldNo, d.levelNo, d.world, d.gourd]; }")
    ok(d[:4] == ['N4-1', True, 4, 1] and d[5] is True, f'levelFor(1301): label N4-1, nightmare, story world 4, level 1, gourd {d}')
    w = page.evaluate("(w) => [window.__gg.WORLDS[w].name, window.__gg.WORLDS[w].scene]", d[4])
    ok(w == ['Crumbling Keep: Nightmare', 'keepN'], f'its theme {d[4]} is the Keep nightmare (thunderstorm) map {w}')
    ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") == 4, 'NIGHTMARE_LEVELS holds the patch, hollow, witchwood and keep tables')
    ok(page.evaluate("() => window.__gg.nmNight(4, 1)") == 1301, 'nmNight(4, 1) = 1301')
    ok(page.evaluate("() => window.__gg.isOpen(1302)") is False, 'N4-2 does not exist yet / stays shut')
    nm4_start(page, 1)
    g = page.evaluate("() => { const G = window.__gg.G; return [G.def.label, G.world, G.n, window.__gg.state]; }")
    ok(g == ['N4-1', d[4], 1301, 'play'], f'N4-1 starts on the keep nightmare map {g}')
    time.sleep(1.0)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


WCOUNT = """() => new Promise(res => { const g = window.__gg; window.__cc = {}; window.__ccOn = true; g.drawWeather(g.ctx, 0.016); window.__ccOn = false; res(window.__cc); })"""


def weather_page(browser, url, n=1, reduced=False):
    page = browser.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce' if reduced else 'no-preference')
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillText', 'strokeText', 'arc', 'ellipse', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn) window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; }
      const d = Object.getOwnPropertyDescriptor(P, 'shadowBlur'); Object.defineProperty(P, 'shadowBlur', { get(){ return d.get.call(this); }, set(v){ if (window.__ccOn && v) window.__cc.shadowBlur = (window.__cc.shadowBlur || 0) + 1; d.set.call(this, v); } }); })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    if n >= 1300: nm4_start(page, n - 1300)
    else: start(page, n)
    time.sleep(0.4)
    page.evaluate("() => { const G = window.__gg.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.idle = -1e9; G.hint = null; }")
    return page, errors


def check_n4_weather(browser, url):
    if not R8: return
    page, errors = weather_page(browser, url, 1301)
    s0 = page.evaluate("() => window.__gg.weatherState()")
    time.sleep(0.4)
    s1 = page.evaluate("() => window.__gg.weatherState()")
    ok(s0['far'] != s1['far'] and s0['near'] != s1['near'], f'the rain sheets scroll between two frames (far {s0["far"]:.1f} -> {s1["far"]:.1f}, near {s0["near"]:.1f} -> {s1["near"]:.1f})')
    # a flash: Math.random forced to 0 (the soonest flash), stepped in simulated time
    r = page.evaluate("""() => { const g = window.__gg, R = Math.random; Math.random = () => 0; let t = 0, hit = null, peak = 0, bolt = -1, gone = null;
      try { g.weatherReset(); for (; t < 20; t += 0.02){ g.drawWeather(g.ctx, 0.02); const s = g.weatherState();
        if (hit == null && s.flash > 0) hit = t; if (hit != null){ peak = Math.max(peak, s.flash); if (s.flash > 0.1) bolt = Math.max(bolt, s.bolt); if (s.flash === 0 && gone == null && t > hit + 0.03) gone = t; if (gone != null) break; } }
      } finally { Math.random = R; } return [hit, gone, peak, bolt]; }""")
    ok(r[0] is not None and r[0] <= 15, f'a flash fires within 15 s ({r[0]})')
    ok(r[1] is not None and r[1] - r[0] < 0.5, f'and fades to 0 in under 0.5 s ({None if r[1] is None else r[1] - r[0]:.2f} s)')
    ok(0.1 < r[2] <= 0.3, f'its peak is gentle (alpha {r[2]:.2f})')
    ok(r[3] in (0, 1, 2), f'one of the three baked bolts is drawn at the flash ({r[3]})')
    # draw budget
    page.evaluate("() => { window.__gg.weatherReset(); }")
    worst = {}
    for kind in ('quiet', 'flash'):
        if kind == 'flash': page.evaluate("() => window.__gg.weatherForce()")
        c = page.evaluate(WCOUNT)
        for k, v in c.items(): worst[k] = max(worst.get(k, 0), v)
    ok(worst.get('drawImage', 0) <= 6, f'drawWeather adds at most 6 drawImage a frame ({worst.get("drawImage", 0)})')
    ok(all(worst.get(k, 0) == 0 for k in ('fill', 'stroke', 'shadowBlur', 'createRadialGradient', 'createLinearGradient', 'arc', 'ellipse')), f'and no fill, stroke, shadowBlur or gradient {worst}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()
    # no weather on N3 or a story 4-x night
    for n, name in ((1201, 'N3-1'), (61, '4-1 of the story'), (1, '1-1')):
        p2, e2 = weather_page(browser, url, n)
        time.sleep(0.3)
        a = p2.evaluate("() => window.__gg.weatherState().active")
        ok(a is False, f'no weather on {name}')
        ok(not e2, f'no page errors on {name} {e2[:2]}')
        p2.close()
    # reduced motion: rain does not scroll, no flash
    p3, e3 = weather_page(browser, url, 1301, reduced=True)
    r = p3.evaluate("""() => { const g = window.__gg, R = Math.random; Math.random = () => 0; let peak = 0;
      try { g.weatherReset(); for (let t = 0; t < 25; t += 0.05){ g.drawWeather(g.ctx, 0.05); peak = Math.max(peak, g.weatherState().flash); } } finally { Math.random = R; } return peak; }""")
    ok(r == 0, f'with reduced motion no flash ({r})')
    ok(not e3, f'no page errors with reduced motion {e3[:2]}')
    p3.close()


def check_n4_book(browser, url):
    if not R8: return
    page, errors = open_page(browser, url)
    # 4-20 beaten, N3-4 not: the bookmark shows, the page says what is missing and has no stamps
    set_stars(page, story_done(80))
    page.evaluate("() => window.__gg.openBook(3)"); time.sleep(0.6)
    ok(page.evaluate("() => !document.querySelector('#bBookmark').hidden"), 'the world 4 bookmark appears once 4-20 is beaten')
    page.click('#bBookmark'); time.sleep(0.8)
    t = page.evaluate("() => [document.querySelector('#bkSoon').hidden, document.querySelector('#bkLevels').hidden, document.querySelector('#bkSoon').textContent]")
    ok(not t[0] and t[1] and 'Beat Nightmare 3-4' in t[2], f'a locked page says what is missing {t}')
    # 4-20 not beaten: no bookmark at all
    set_stars(page, {**{n: 3 for n in range(1, 80)}, 1204: 3})
    page.evaluate("() => window.__gg.openBook(3)"); time.sleep(0.6)
    ok(page.evaluate("() => document.querySelector('#bBookmark').hidden"), 'no bookmark with only 4-19 beaten')
    # both gates met: 16 stamps, N4-1 open, the rest "Coming soon"
    set_stars(page, {**story_done(80), 1204: 3})
    open_nm_book(page, 3)
    pg = page.evaluate("() => [...document.querySelectorAll('#bkLevels .pg')].map(b => [b.disabled, b.textContent])")
    soon = page.evaluate("() => [document.querySelector('#bkSoon').hidden, document.querySelector('#bkLevels').hidden]")
    ok(len(pg) == 16, f'the world 4 nightmare page shows 16 stamps ({len(pg)})')
    ok(soon == [True, False], f'the page shows the stamps, not the locked message {soon}')
    if len(pg) == 16:
        ok(not pg[0][0] and all(b[0] for b in pg[1:]), 'only N4-1 is open on a fresh keep track')
        built = page.evaluate("() => window.__gg.NIGHTMARE_LEVELS[3].length")
        ok(sum(1 for b in pg if 'Coming soon' in b[1]) == 16 - built, f'the {16 - built} levels not built yet read "Coming soon"')
    set_stars(page, {**story_done(80), 1004: 3, 1104: 3, 1204: 3})
    for w in (0, 1, 2):
        open_nm_book(page, w)
        ok(page.evaluate("() => document.querySelectorAll('#bkLevels .pg').length") == 16, f'the world {w + 1} nightmare page still shows 16 stamps')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS = {'check_r8_absent': check_r8_absent, 'check_n4_track': check_n4_track, 'check_n4_weather': check_n4_weather, 'check_n4_book': check_n4_book}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--expect', choices=['on', 'r7', 'r6', 'r5', 'r4', 'r3', 'r2', 'off'], required=True)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    global R8, MODE
    MODE = a.expect; R8 = a.expect == 'on'
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
