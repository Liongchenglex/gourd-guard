"""World 6 (Hallow's End) checks for the w6-hallows-end branch, against a build served by tools/serve_dist.py.
  Store build:     npm run build          then  .venv/bin/python tools/w6_check.py --url http://127.0.0.1:4173/ --expect off
  Playtest build:  VITE_W6=1 npm run build then .venv/bin/python tools/w6_check.py --url http://127.0.0.1:4173/ --expect on
Exits 1 on any failure. --only runs one check by name."""
import argparse, pathlib, sys, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
FAILS = []


def ok(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: FAILS.append(msg)


def open_page(browser, url, h=844):
    page = browser.new_page(viewport={'width': 390, 'height': h})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url + ('&test' if '?' in url else '?test'))
    page.wait_for_function('() => !!window.__gg')
    time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    return page, errors


def set_stars(page, stars):
    page.evaluate("(s) => { window.__gg.save.stars = s; }", {str(k): v for k, v in stars.items()})


# ---------- Task 1: the switch ----------
def check_flag(browser, url, on):
    page, errors = open_page(browser, url)
    n = page.evaluate("() => window.__gg.WORLD_LEVELS && window.__gg.WORLD_LEVELS.length")
    ok(n == (6 if on else 5), f'WORLD_LEVELS has {6 if on else 5} worlds (got {n})')
    levels, w6 = page.evaluate("() => [window.__gg.LEVELS, (window.__gg.WORLD_LEVELS || [])[5] ? window.__gg.WORLD_LEVELS[5].length : 0]")
    ok(levels == 100 + (w6 if on else 0) and (w6 > 0) == on, f'LEVELS is {levels} with {w6} World 6 levels')
    page.evaluate("() => { window.__gg.save.stars = Object.fromEntries([...Array(100)].map((_, i) => [i + 1, 3])); window.__gg.openBook(%d); }" % (5 if on else 4))
    time.sleep(0.6)
    label = page.evaluate("() => document.querySelector('#bkWorld').textContent")
    ok(label == ('World 6 of 6' if on else 'World 5 of 5'), f'book label reads {label!r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_bundle(browser, url, on):
    js = ''.join(p.read_text(errors='ignore') for p in (ROOT / 'dist/assets').glob('*.js'))
    ok(('Attack and Defend' in js) == on, f"World 6 level names {'in' if on else 'not in'} the bundle")


def check_open(browser, url, on):
    page, _ = open_page(browser, url)
    set_stars(page, {10: 3})
    ok(page.evaluate("() => window.__gg.isOpen(21)"), 'world 2 still opens after 1-10')
    set_stars(page, {70: 3})
    ok(page.evaluate("() => window.__gg.isOpen(81)") is True, 'world 5 still opens after 4-10')
    if on:
        set_stars(page, {90: 3})
        ok(page.evaluate("() => window.__gg.isOpen(101)") is False, '6-1 stays shut after only 5-10')
        set_stars(page, {100: 3})
        ok(page.evaluate("() => window.__gg.isOpen(101)") is True, '6-1 opens after 5-20')
    else:
        ok(page.evaluate("() => window.__gg.isOpen(101)") is False, 'no night 101 without the flag')
    page.close()


# ---------- Task 2: levels 6-1 to 6-3 ----------
ARCH = [[1, 2], [1, 3], [1, 4], [2, 2], [2, 4], [3, 2], [3, 4]]
PILLARS = [[1, 1], [2, 1], [3, 1], [1, 5], [2, 5], [3, 5]]
LO = [0, 1, 2, 3, 4]


def start(page, n):
    page.evaluate("([n, lo]) => window.__gg.startGame('story', n, lo)", [n, LO])
    time.sleep(0.3)


def grave_cells(page):
    return sorted(page.evaluate("() => window.__gg.graves.flatMap((row, r) => row.map((g, c) => g ? [r, c] : null).filter(Boolean))"))


def check_levels(browser, url, on):
    if not on: return
    for h in (844, 664):
        page, errors = open_page(browser, url, h)
        start(page, 101)
        pud = page.evaluate("() => window.__gg.G.puddles.map(p => [p.lane, p.p])")
        ok(pud == [[1, 0.45], [3, 0.6], [5, 0.4]], f'[{h}] 6-1 puddles at fixed spots {pud}')
        cas = page.evaluate("() => window.__gg.G.castles.map(c => [c.lane, c.p])")
        ok(len(cas) == 7 and all(p == 0.9 for _, p in cas), f'[{h}] 6-1 castle row at 0.9 ({len(cas)} walls)')
        ok(grave_cells(page) == sorted(ARCH), f'[{h}] 6-1 graves in an arch')
        ok(page.evaluate("() => JSON.stringify(window.__gg.G.def.fog)") == '[[0.2,0.8]]', f'[{h}] 6-1 fog band in the middle')
        for t in ('crawler', 'turtle'):
            m = page.evaluate("(t) => { const m = window.__gg.spawnMonster(t); return [m.lane, m.p]; }", t)
            ok(m in pud, f'[{h}] a {t} rises from a puddle {m}')
        start(page, 102)
        kp = page.evaluate("() => window.__gg.spawnMonster('knight').p")
        ok(abs(kp - 0.5) < 0.03, f'[{h}] 6-2 monsters surface at the half-field shoreline (p={kp:.3f})')
        ok(grave_cells(page) == sorted(PILLARS), f'[{h}] 6-2 graves are two pillars')
        start(page, 103)
        cas = page.evaluate("() => window.__gg.G.castles.map(c => c.p)")
        ok(len(cas) == 7 and all(p == 0.35 for p in cas), f'[{h}] 6-3 castle row at 0.35 under the fog')
        ok(page.evaluate("() => window.__gg.G.def.gust && window.__gg.G.def.gust.every") == 22, f'[{h}] 6-3 has wind')
        ok(grave_cells(page) == sorted(PILLARS), f'[{h}] 6-3 graves match 6-2')
        ok(not errors, f'[{h}] no page errors {errors[:2]}')
        page.close()


CHECKS = {
    'check_flag': check_flag, 'check_bundle': check_bundle, 'check_open': check_open, 'check_levels': check_levels,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--expect', choices=['on', 'off'], required=True)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    on = a.expect == 'on'
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, fn in CHECKS.items():
            if a.only and name != a.only: continue
            print(name)
            try: fn(browser, a.url, on)
            except Exception as e: ok(False, f'{name} raised {str(e).splitlines()[0]}')
        browser.close()
    print(f'{len(FAILS)} failure(s)' if FAILS else 'all checks passed')
    sys.exit(1 if FAILS else 0)


if __name__ == '__main__':
    main()
