"""Release 6 checks (the Magnet pumpkin, docs/superpowers/specs/2026-11-08-release-6-magnet-design.md),
against a build served by tools/serve_dist.py.
  Playtest build:   npm run build:playtest                            then  .venv/bin/python tools/mag_check.py --url http://127.0.0.1:4173/ --expect on
  Release 5 build:  VITE_RELEASE=5 npx vite build                     then  ... --expect r5    (no Magnet)
  Store build:      npm run build                                     then  ... --expect off   (no Magnet)
  Standalone build: VITE_RELEASE=2 VITE_MAGNET_AT=2 npx vite build    then  ... --expect solo  (Magnet with no Beige: it can ship ahead of 4 and 5)
Exits 1 on any failure. --only runs one check by name."""
import argparse, sys, time, os
from playwright.sync_api import sync_playwright

from w6_check import open_page, ok, FAILS, start, bundle_js, set_stars

MAG = False   # the build holds the Magnet (on, solo)
MODE = 'on'
COSTS = [{'coins': 3000}, {'coins': 5000}, {'coins': 10000}, {'seeds': 50}]


# ---------- Task 1: data, shop, save ----------
def check_absent(browser, url):
    ok(('Magnet' in bundle_js()) == MAG, f"'Magnet' {'in' if MAG else 'not in'} the bundle")


def check_data(browser, url):
    if not MAG: return
    page, errors = open_page(browser, url)
    d = page.evaluate("""() => { const g = window.__gg, M = g.MAGNET, R = g.RAINBOW;
      return { M, R, rb:!!g.PTYPES[R].rainbow, key:g.PTYPES[M] && g.PTYPES[M].key, costs:[1, 2, 3, 4].map(L => g.upgradeCost('magnet', L)),
               s1:g.lvStats(M, 1), s3:g.lvStats(M, 3).special, s5:g.lvStats(M, 5).special, p:[1, 2, 3, 4, 5].map(L => g.lvStats(M, L).power), kb:[1, 2, 3, 4, 5].map(L => g.lvStats(M, L).knockback),
               beige:g.PTYPES.some(p => p.key === 'beige') }; }""")
    ok(d['M'] == d['R'] - 1 and d['rb'] and d['key'] == 'magnet', f"Magnet sits just before Rainbow {d['M']} {d['R']} {d['key']}")
    ok(d['costs'] == COSTS, f"upgrades cost 3,000 / 5,000 / 10,000 coins, then 50 seeds {d['costs']}")
    ok(d['p'] == ['1', '1', '1.5', '1.5', '2'], f"power 1 / 1 / 1.5 / 1.5 / 2 {d['p']}")
    ok(d['kb'] == ['none'] * 5, f"no knockback at any level {d['kb']}")
    ok('3' in d['s1']['special'] and '4' in d['s3'] and '6' in d['s5'] and '2 rows below' in d['s5'], f"level stats describe the pull {d['s1']['special']!r} / {d['s3']!r} / {d['s5']!r}")
    if MODE == 'solo': ok(not d['beige'], 'standalone build: Magnet without Beige')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def shop_magnet(page):
    page.evaluate("() => { window.__gg.openShop(); document.querySelector('#tabPumpkins').click(); }"); time.sleep(0.5)
    page.evaluate("() => { const t = [...document.querySelectorAll('#shopPumpkins .tile')].find(b => b.querySelector('.tn').textContent === 'Magnet'); if (t) t.click(); }"); time.sleep(0.3)
    return page.evaluate("() => ({ tile:[...document.querySelectorAll('#shopPumpkins .tile .tn')].some(e => e.textContent === 'Magnet'), text:document.querySelector('#pDetail').textContent, btn:document.querySelector('#pDetail .dAct button').textContent, dis:document.querySelector('#pDetail .dAct button').disabled })")


def check_shop(browser, url):
    if not MAG: return
    page, errors = open_page(browser, url)
    set_stars(page, {n: 3 for n in range(1, 100)}); page.evaluate("() => { window.__gg.save.seeds = 60; }")
    b = shop_magnet(page)
    ok(b['tile'] and '5-20' in b['text'] and b['dis'], f"before 5-20 it shows, locked, saying how to get it {b['text'][:90]!r}")
    set_stars(page, {n: 3 for n in range(1, 101)})
    b = shop_magnet(page)
    ok('50' in b['btn'] and not b['dis'], f"after 5-20 it can be bought for 50 seeds ({b['btn']!r})")
    page.evaluate("() => document.querySelector('#pDetail .dAct button').click()"); time.sleep(0.3)
    sv = page.evaluate("() => { const s = window.__gg.save; return [s.magnetOwned, s.seeds, s.lv.magnet]; }")
    ok(sv == [True, 10, 1], f'buying it spends 50 seeds and owns it at level 1 {sv}')
    ok(page.evaluate("() => window.__gg.typesForNight(5).includes(window.__gg.MAGNET)"), 'once bought it can be taken into any level')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_save(browser, url):
    page, errors = open_page(browser, url)
    page.evaluate("() => { const s = window.__gg.save; s.loadout = [0, 1, 2, 3, 4]; s.lv.green = 3; s.lv.fire = 2; s.wardrobe.skins = { 1:'candycorn' }; }")
    start(page, 9)
    r = page.evaluate("() => { const g = window.__gg, R = g.RAINBOW, old = Math.random; Math.random = () => 0; const c = g.randSprout(); Math.random = old; return [c === R, !!g.PTYPES[c].rainbow, g.PTYPES.length - 1 === R]; }")
    ok(r == [True, True, True], f'Rainbow still comes up as the rainbow pumpkin {r}')
    time.sleep(1)
    ok(not errors, f'an existing save plays with no page errors {errors[:2]}')
    page.close()


CHECKS = {'check_absent': check_absent, 'check_data': check_data, 'check_shop': check_shop, 'check_save': check_save}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--expect', choices=['on', 'r5', 'off', 'solo'], required=True)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    global MAG, MODE
    MODE = a.expect; MAG = a.expect in ('on', 'solo')
    with sync_playwright() as p:
        browser = p.chromium.launch(args=os.environ.get('GG_CHROME_ARGS', '').split())
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
