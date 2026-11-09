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
R9_NAMES = ['Blood Slime', 'Storm Eel', 'Siren', 'Swan Gourd', 'Fallen Twin Tides', 'Whirlpool', 'Beat Nightmare 4-4', 'marshN-blood', 'The tide rises!']


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


# ---------- Task 2: the rising blood tide ----------
def tide_page(browser, url, marks, total=20, puddles=None, shore=0.2):
    """A paused N5 night with tide marks set by hand: spawned/total drive the spawn bar. Returns (page, errors)."""
    page, errors = marsh_page(browser, url)
    page.evaluate("""([marks, total, puddles, shore]) => { const g = window.__gg, G = g.G; G.def.tideMarks = marks; G.def.total = total; G.total = total; G.def.shoreFrac = shore; G.spawned = 0;
      G.puddles.length = 0; for (const pd of puddles || []) G.puddles.push({ lane:pd[0], p:pd[1] }); g.initTide(G.def); }""", [marks, total, puddles, shore])
    return page, errors


def step(page, secs, dt=0.05):
    page.evaluate("([s, dt]) => { const g = window.__gg; for (let t = 0; t < s; t += dt) g.updateTide(dt); }", [secs, dt])


def check_tide_marks(browser, url):
    if not R9: return
    page, errors = tide_page(browser, url, [{'at': 0.3, 'to': 0.4}, {'at': 0.6, 'to': 0.6}])
    sh = lambda: page.evaluate("() => window.__gg.shoreP()")
    ok(abs(sh() - 0.2) < 1e-6, f'the night starts at its own shore {sh()}')
    step(page, 2); ok(abs(sh() - 0.2) < 1e-6, 'no surge before the first mark')
    page.evaluate("() => { window.__gg.G.spawned = 6; }")   # 30% of 20
    step(page, 0.4); mid = sh(); ok(0.2 < mid < 0.4, f'mid-surge the shore is between the lines {mid}')
    step(page, 0.5); ok(abs(sh() - 0.4) < 1e-6, f'the shore reaches 0.4 within 0.8 s {sh()}')
    page.evaluate("() => { window.__gg.G.spawned = 12; }")
    step(page, 1.0); ok(abs(sh() - 0.6) < 1e-6, f'at 60% it reaches 0.6 {sh()}')
    step(page, 2); ok(abs(sh() - 0.6) < 1e-6, 'and rests there')
    page.evaluate("() => { window.__gg.G.t += 3; window.__gg.updateHud(true); }")
    n = page.evaluate("() => document.querySelectorAll('.tdMark').length")
    ok(n == 2, f'two tide marks on the spawn bar ({n})')
    ok(page.evaluate("() => document.querySelectorAll('.tdMark.done').length") == 2, 'both ticked after they fire')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_tide_live_shore(browser, url):
    if not R9: return
    page, errors = tide_page(browser, url, [{'at': 0.3, 'to': 0.5}])
    page.evaluate("() => { window.__gg.G.spawned = 6; }"); step(page, 1.2)
    sh = page.evaluate("() => window.__gg.liveShore()")
    ok(abs(sh - 0.5) < 1e-6, f'liveShore after the surge {sh}')
    ps = [page.evaluate("() => { const m = window.__gg.spawnMonster('drownedGhoul'); const p = m.p; m.dead = true; return p; }") for _ in range(4)]
    ok(all(abs(p - (sh - 0.02)) < 1e-6 for p in ps), f'new walkers appear at liveShore - 0.02 {ps}')
    dp = [page.evaluate("() => { const m = window.__gg.spawnMonster('diver'); const p = m.p; m.dead = true; return p; }") for _ in range(30)]
    ok(all(p <= sh + 1e-6 for p in dp) and max(dp) > 0.2 + 0.03, f'lurking divers use the tide (max p {max(dp):.2f}, shore {sh})')
    page.evaluate("() => { const G = window.__gg.G; G.puddles.length = 0; for (let i = 0; i < 20; i++){ G.puddles.length = 0; window.__gg.placePuddles(3); if (G.puddles.some(p => p.p < window.__gg.liveShore() + 0.06 - 1e-9)) window.__bad = true; } }")
    ok(page.evaluate("() => !window.__bad"), 'placePuddles puts pools below the live shore')
    # the level preview draws the start shore
    page.evaluate("() => window.__gg.openPreview(1401)"); time.sleep(0.4)
    ok(page.evaluate("() => !window.__gg.G.tide") and abs(page.evaluate("() => window.__gg.shoreP()") - 0.2) < 1e-6, 'the level preview draws the start shore')
    ok(page.evaluate("() => window.__gg.inWater(0, 0.1)") is True and page.evaluate("() => window.__gg.inWater(0, 0.9)") is False, 'inWater: sea yes, dry land no')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_tide_limits(browser, url):
    if not R9: return
    page, errors = tide_page(browser, url, [{'at': 0.1, 'to': 0.99}])
    page.evaluate("""() => { const g = window.__gg, G = g.G; G.spawned = 5; const m = g.spawnMonster('drownedGhoul', 2, false, 0.5); m.hold = 99; window.__m = m; window.__p0 = m.p; }""")
    step(page, 1.5)
    stop = page.evaluate("() => window.__gg.TIDE_STOP()")
    sh = page.evaluate("() => window.__gg.liveShore()")
    ok(abs(sh - stop) < 1e-6 and sh < 0.99, f'the shore stops at TIDE_STOP {sh} / {stop}')
    ok(abs((1 - stop) - page.evaluate("() => window.__gg.TILE_P()")) < 1e-6, 'TIDE_STOP leaves one tile row before the fence')
    ok(page.evaluate("() => window.__gg.walls.every(w => w.hp > 0)"), 'the fence is untouched')
    # a monster in the newly covered band keeps walking
    p1 = page.evaluate("() => { const g = window.__gg; g.G.monsters.forEach(m => { m.sp = 0.2; }); for (let i = 0; i < 20; i++) g.update(0.05); return window.__m.p; }")
    ok(p1 > page.evaluate("() => window.__p0") + 0.01 and not page.evaluate("() => window.__m.dead"), f'a monster in the covered band keeps walking {p1}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_tide_swallow_diver(browser, url):
    if not R9: return
    page, errors = tide_page(browser, url, [{'at': 0.3, 'to': 0.5}], puddles=[[1, 0.45], [3, 0.8]], shore=0.3)
    page.evaluate("""() => { const g = window.__gg, G = g.G; const pd = G.puddles[0]; const m = g.spawnMonster('diver', 1, false, 0.45);
      m.puddle = pd; m.walker = false; m.sp = 0; m.hidden = true; m.upT = 0.3; window.__d = m; G.spawned = 6; }""")
    step(page, 1.2)
    r = page.evaluate("() => { const G = window.__gg.G; return [G.puddles.length, G.puddles[0].lane, window.__d.puddle && window.__d.puddle.lane, window.__d.lane, window.__d.p, window.__gg.liveShore()]; }")
    ok(r[0] == 1 and r[1] == 3, f'the pool at 0.45 is swallowed, the dry one stays {r}')
    ok(r[3] == 1 and r[4] <= r[5] + 1e-6 and r[2] == 1, f'the diver now lurks in the tide in its lane {r}')
    step(page, 1.5)
    ok(page.evaluate("() => !window.__d.hidden || window.__d.upT > 0"), 'its cycle carries on (it surfaces from the tide)')
    page.evaluate("() => { window.__d.upT = 0.01; window.__d.hidden = true; }"); step(page, 0.2)
    page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 2; i++) g.update(0.05); }")
    ok(page.evaluate("() => window.__d.hidden") is False, 'the diver surfaces from the tide')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_tide_swallow_walker(browser, url):
    if not R9: return
    page, errors = tide_page(browser, url, [{'at': 0.3, 'to': 0.5}], puddles=[[2, 0.45]], shore=0.3)
    page.evaluate("""() => { const g = window.__gg, G = g.G; const m = g.spawnMonster('crawler'); m.puddle = G.puddles[0]; m.hidden = false; m.sp = 0; m.p = 0.7; window.__w = m; G.spawned = 6; }""")
    step(page, 1.2)
    r = page.evaluate("() => [window.__w.p, window.__gg.G.puddles.length, window.__gg.liveShore()]")
    ok(r[1] == 0 and abs(r[0] - 0.7) < 1e-6, f'a Crawler that rose from the swallowed pool keeps walking where it is {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_tide_boss_total(browser, url):
    if not R9: return
    page, errors = tide_page(browser, url, [{'at': 0.5, 'to': 0.5}], total=39, shore=0.3)
    page.evaluate("() => { const G = window.__gg.G; G.total = 40; G.spawned = 19; }")   # a boss night: the bar counts total + 1
    step(page, 1.2); ok(abs(page.evaluate("() => window.__gg.shoreP()") - 0.3) < 1e-6, 'no surge before the bar (total + 1) reaches the mark')
    page.evaluate("() => { window.__gg.G.spawned = 20; }")
    step(page, 1.2); ok(abs(page.evaluate("() => window.__gg.shoreP()") - 0.5) < 1e-6, 'the surge fires when the bar reaches the mark')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_tide_continue(browser, url):
    if not R9: return
    page, errors = tide_page(browser, url, [{'at': 0.3, 'to': 0.4}, {'at': 0.6, 'to': 0.6}], puddles=[[2, 0.7]])
    page.evaluate("() => { window.__gg.G.spawned = 6; }"); step(page, 1.2)
    cs = page.evaluate("() => { const s = window.__gg.continueState(); return s && s.tide; }")
    ok(cs and cs.get('marks') == 1 and abs(cs.get('shore') - 0.4) < 1e-6, f'the snapshot holds the marks passed and the shore {cs}')
    r = page.evaluate("""() => { const g = window.__gg, c = g.continueState(); c.remaining = 8; g.continueNight(c); const G = g.G; const first = [g.shoreP(), G.tide && G.tide.marksDone, G.tide && G.tide.t];
      const real = G.def.tideMarks; return first; }""")
    ok(r[1] == 1 and abs(r[0] - 0.4) < 1e-6 and r[2] < 0, f'the continued night keeps its shore and mark {r}')
    pc = page.evaluate("() => { const g = window.__gg, G = g.G; return [G.puddles.length, G.def.puddles, G.puddles.every(p => p.p > g.shoreP())]; }")
    ok(pc[0] == pc[1] == 2 and pc[2], f'the continued night has the level\'s pools, all below the restored shore {pc}')
    step(page, 1.5)
    ok(abs(page.evaluate("() => window.__gg.shoreP()") - 0.4) < 1e-6 and page.evaluate("() => window.__gg.G.tide.t") < 0, 'no surge replays on the continued night')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_tide_budget(browser, url):
    if not R9: return
    page, errors = tide_page(browser, url, [{'at': 0.3, 'to': 0.5}])
    probe = """() => { const g = window.__gg, c = g.ctx, d = c.drawImage, f = c.fill, s = c.stroke, n = { img:0, fill:0, stroke:0 };
      c.drawImage = function(...a){ n.img++; return d.apply(this, a); }; c.fill = function(...a){ n.fill++; return f.apply(this, a); }; c.stroke = function(...a){ n.stroke++; return s.apply(this, a); };
      try { g.drawSea(1.0); } finally { delete c.drawImage; delete c.fill; delete c.stroke; } return n; }"""
    page.evaluate("() => { const G = window.__gg.G; G.spawned = 6; }"); step(page, 0.4)
    ok(page.evaluate("() => window.__gg.G.tide.t") >= 0, 'a surge is in progress')
    sur = page.evaluate(probe)
    page.evaluate("() => { window.__t = window.__gg.G.tide.t; window.__gg.G.tide.t = -1; }")   # the same shore with no wave
    base = page.evaluate(probe)
    page.evaluate("() => { window.__gg.G.tide.t = window.__t; }")
    ok(sur['img'] - base['img'] <= 3 and sur['img'] - base['img'] >= 1, f'the surge adds 1..3 drawImage ({base["img"]} -> {sur["img"]})')
    ok(sur['fill'] - base['fill'] == 0 and sur['stroke'] - base['stroke'] == 0, f'and no fill/stroke ({base} -> {sur})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_story_shore_unchanged(browser, url):
    if not R9: return   # the shoreP hook is a Release 9 one
    page, errors = open_page(browser, url)
    start(page, 92); time.sleep(0.3)   # 5-12, a story shoreline night
    page.evaluate("() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; g.setState('pause'); }")
    r = page.evaluate("""() => { const g = window.__gg, G = g.G, d = G.def, want = d.shoreFrac ? Math.min(0.8, d.shoreFrac) : d.shore ? Math.min(0.8, d.shore * g.TILE_P()) : d.sea ? 0.1 : 0;
      const seen = [g.shoreP()]; for (let i = 0; i < 40; i++){ g.update(0.1); seen.push(g.shoreP()); } return [want, seen.every(x => x === want), !!G.tide, d.label]; }""")
    ok(r[1] and r[0] > 0, f'{r[3]} keeps its shoreline value {r[0]} throughout')
    ok(r[2] is False or not R9 and r[2] is False, 'no tide object on a story night')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS = {'check_r9_absent': check_r9_absent, 'check_n5_track': check_n5_track, 'check_n5_blood_sea': check_n5_blood_sea, 'check_n5_book': check_n5_book,
          'check_tide_marks': check_tide_marks, 'check_tide_live_shore': check_tide_live_shore, 'check_tide_limits': check_tide_limits, 'check_tide_swallow_diver': check_tide_swallow_diver,
          'check_tide_swallow_walker': check_tide_swallow_walker, 'check_tide_boss_total': check_tide_boss_total, 'check_tide_continue': check_tide_continue, 'check_tide_budget': check_tide_budget, 'check_story_shore_unchanged': check_story_shore_unchanged}


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
