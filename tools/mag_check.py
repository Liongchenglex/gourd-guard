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


# ---------- Task 2: the pull ----------
SETUP = """() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.castles.length = 0;
  for (const r of g.graves) r.fill(null); for (const w of g.walls) w.hp = w.max; }"""
# ghoul(lane, p, hp): a still monster; row(k): the p at the middle of field row k; hit(lv, m): a Magnet pumpkin hit
HELP = """window.__mg = { tp:window.__gg.TILE_P(),
  ghoul(lane, p, hp, kind){ const m = window.__gg.spawnMonster(kind || 'ghoul', lane, true, p); m.hp = m.maxHp = hp || 50; m.sp = 0; return m; },
  row(k){ return (k + 0.5) * this.tp; }, rowOf(p){ return Math.floor(p / this.tp); },
  hit(lv, m, guar){ const g = window.__gg, M = g.MAGNET; g.hitMonster({ type:M, vis:M, lv, size:1, lane:m.lane, x:m.x, y:0, hit:new Set(), grp:null, guar:!!guar, trail:[] }, m); },
  on(a){ return window.__gg.G.monsters.filter(o => o !== a && !o.dead && o.lane === a.lane && Math.abs(o.p - a.p) < 0.01).length; } };"""


def mag_page(browser, url):
    page, errors = open_page(browser, url)
    page.evaluate("() => { window.__gg.save.magnetOwned = true; window.__gg.save.seenHelp = true; }")
    page.evaluate("() => window.__gg.startGame('story', 2, [0, 1, 2, window.__gg.MAGNET])"); time.sleep(0.4)
    page.evaluate(SETUP); page.evaluate("() => { " + HELP + " }")
    return page, errors


def fresh(page):
    page.evaluate(SETUP)


def check_pull_row(browser, url):
    if not MAG: return
    page, errors = mag_page(browser, url)
    r = page.evaluate("""() => { const h = window.__mg, p = h.row(3);
      const a = h.ghoul(3, p), far = [h.ghoul(0, p), h.ghoul(6, p)], near = [h.ghoul(1, p), h.ghoul(5, p)], up = h.ghoul(4, h.row(2));
      h.hit(1, a);
      return new Promise(res => setTimeout(() => res({ on:h.on(a), near:near.map(m => m.lane), farLeft:far.filter(m => m.lane !== 3).length, up:[up.lane, h.rowOf(up.p)] }), 600)); }""")
    ok(r['on'] == 3 and r['near'] == [3, 3] and r['farLeft'] == 1, f'level 1 pulls the 3 nearest in its row onto the hit tile {r}')
    ok(r['up'] == [4, 2], f'a monster in the row above is not pulled {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_pull_rows(browser, url):
    if not MAG: return
    page, errors = mag_page(browser, url)
    for lv, rows_ok, rows_no in ((3, [0, 1], [2]), (5, [0, 1, 2], [3])):
        fresh(page)
        r = page.evaluate("""([lv, ok, no]) => { const h = window.__mg, a = h.ghoul(3, h.row(2));
          const yes = ok.map((d, k) => h.ghoul([0, 6, 1][k], h.row(2 + d))), not = no.map(d => h.ghoul(5, h.row(2 + d)));
          h.hit(lv, a);
          return new Promise(res => setTimeout(() => res([yes.map(m => m.lane === 3), not.map(m => m.lane)]), 600)); }""", [lv, rows_ok, rows_no])
        ok(all(r[0]) and r[1] == [5] * len(rows_no), f'level {lv} pulls from rows {rows_ok} below and not {rows_no} {r}')
    for lv, n in ((1, 3), (3, 4), (4, 5), (5, 6)):
        fresh(page)
        got = page.evaluate("""(lv) => { const h = window.__mg, a = h.ghoul(3, h.row(2));
          for (let k = 0; k < 7; k++) h.ghoul([0, 1, 2, 4, 5, 6, 0][k], h.row(2) + (k === 6 ? 0.001 : 0));
          h.hit(lv, a); return new Promise(res => setTimeout(() => res(h.on(a)), 600)); }""", lv)
        ok(got == n, f'level {lv} pulls at most {n} ({got})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_pull_excluded(browser, url):
    if not MAG: return
    page, errors = mag_page(browser, url)
    r = page.evaluate("""() => { const g = window.__gg, h = window.__mg, p = h.row(3), a = h.ghoul(3, p);
      const boss = g.spawnMonster('boss:gravekeeper', 0, false, p, 1);
      const sack = g.spawnSack(); sack.p = p;
      const dv = h.ghoul(1, p, 50, 'diver'); dv.hidden = true;
      const mu = h.ghoul(5, p, 50, 'mummy'); mu.rise = 3;
      const gone = h.ghoul(6, p); gone.p = 1.06;
      const all = [boss, sack, dv, mu, gone], before = all.map(m => [m.lane, m.p]);
      const pred = all.map(m => g.magnetPullable(m)), plain = g.magnetPullable(h.ghoul(2, h.row(1)));
      h.hit(5, a);
      return new Promise(res => setTimeout(() => res({ pred, plain, moved:all.map((m, k) => m.lane !== before[k][0] || (k < 4 && Math.abs(m.p - before[k][1]) > 1e-6)) }), 600)); }""")
    ok(r['pred'] == [False] * 5 and r['plain'], f'bosses, the Loot Sack, a hidden diver, a fallen mummy and one past the wall are never pullable {r}')
    ok(r['moved'] == [False] * 5, f'and a level-5 hit moves none of them {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_wall_rescue(browser, url):
    if not MAG: return
    page, errors = mag_page(browser, url)
    r = page.evaluate("""() => { const g = window.__gg, h = window.__mg, a = h.ghoul(2, 1 - 0.6 * h.tp);
      const e = h.ghoul(5, 1); e.eating = true; const w0 = g.walls[5].hp;
      h.hit(3, a);
      return new Promise(res => setTimeout(() => res([e.eating, e.lane, Math.abs(e.p - a.p) < 0.01, g.walls[5].hp === w0, h.rowOf(1) - h.rowOf(a.p)]), 600)); }""")
    ok(r[:4] == [False, 2, True, True], f'a level-3 hit pulls a monster off the wall it was chewing, and that wall stops losing health {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_dead_anchor(browser, url):
    if not MAG: return
    page, errors = mag_page(browser, url)
    r = page.evaluate("""() => { const h = window.__mg, p = h.row(3), a = h.ghoul(3, p, 0.5);
      [0, 1, 5].forEach(l => h.ghoul(l, p)); h.hit(1, a);
      return new Promise(res => setTimeout(() => res([a.dead, window.__gg.G.monsters.filter(o => !o.dead && o.lane === 3 && Math.abs(o.p - p) < 0.01).length]), 600)); }""")
    ok(r == [True, 3], f'a hit that kills still pulls 3 onto its tile {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_slide(browser, url):
    if not MAG: return
    page, errors = mag_page(browser, url)
    r = page.evaluate("""() => { const g = window.__gg, h = window.__mg, p = h.row(3), a = h.ghoul(3, p), m = h.ghoul(0, p), x0 = m.x, x1 = g.LANE(3);
      h.hit(1, a);
      const t0 = performance.now(); return new Promise(res => { const wait = () => (m.pullT > 0 && m.pullT < 0.27) || performance.now() - t0 > 1500 ? res({ mid:m.x, x0, x1, t:m.pullT || 0 }) : requestAnimationFrame(wait); requestAnimationFrame(wait); })
        .then(d => new Promise(res => setTimeout(() => { d.end = m.x; res(d); }, 600))); }""")
    ok(r['x0'] < r['mid'] < r['x1'] - 4, f'part way through, the pulled monster is between its lane and the hit tile {r}')
    ok(abs(r['end'] - r['x1']) <= 6, f'after the slide it stands in the hit lane {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_movers(browser, url):
    if not MAG: return
    page, errors = mag_page(browser, url)
    r = page.evaluate("""() => { const h = window.__mg, p = h.row(3), a = h.ghoul(3, p);
      const ms = ['bat', 'imp', 'knight', 'wisp', 'rider'].map((k, i) => h.ghoul([0, 1, 2, 4, 5][i], p, 50, k));
      h.hit(5, a);
      return new Promise(res => setTimeout(() => res(ms.map(m => [m.type, m.lane, Math.abs(m.x - window.__gg.LANE(3)) < 14])), 700)); }""")
    ok(all(l == 3 and near for _, l, near in r), f'pulled bats, imps, knights, wisps and riders stay in the hit lane {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_no_kb(browser, url):
    if not MAG: return
    page, errors = mag_page(browser, url)
    r = page.evaluate("""() => { const h = window.__mg, a = h.ghoul(3, h.row(3), 999); let kb = 0;
      for (let k = 0; k < 20; k++){ h.hit(5, a, true); kb = Math.max(kb, a.kb); } return kb; }""")
    ok(r == 0, f'a Magnet hit never knocks back, even a 5+ bunch ({r})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_pull_row': check_pull_row, 'check_pull_rows': check_pull_rows, 'check_pull_excluded': check_pull_excluded, 'check_wall_rescue': check_wall_rescue,
               'check_dead_anchor': check_dead_anchor, 'check_slide': check_slide, 'check_movers': check_movers, 'check_no_kb': check_no_kb})


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
