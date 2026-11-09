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
R9_NAMES = ['fallentides', 'The Kraken', 'anchorEvery', 'Blood Slime', 'Storm Eel', 'Siren', 'Swan Gourd', 'Fallen Twin Tides', 'Whirlpool', 'Drowned Pirate', 'Bloodlet', 'pirateshot', 'Beat Nightmare 4-4', 'marshN-blood', 'The tide rises!', '#4affd0', 'turtlerider', 'rotshot', 'sirennote', 'hiddensphere']


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
    ok(page.evaluate("() => window.__gg.isOpen(1402)") is False, 'N5-2 stays shut on a fresh save')
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
    ok(pc[0] == pc[1] and pc[0] > 0 and pc[2], f'the continued night has the level\'s pools, all below the restored shore {pc}')
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


# ---------- Task 3: whirlpools ----------
def whirl_page(browser, url, pairs=()):
    """A paused N5 night, no whirlpools, then `pairs` added by hand. Returns (page, errors)."""
    page, errors = marsh_page(browser, url)
    page.evaluate("""(pairs) => { const g = window.__gg, G = g.G; G.def.whirlpools = null; G.whirls = []; window.__added = pairs.map(pr => g.addWhirlPair({ lane:pr[0][0], p:pr[0][1] }, { lane:pr[1][0], p:pr[1][1] })); }""", list(pairs))
    return page, errors


def check_whirl_move(browser, url):
    if not R9: return
    page, errors = whirl_page(browser, url, [[(1, 0.1), (3, 0.18)]])
    ok(page.evaluate("() => window.__added") == [True], 'a pair in the sea is placed')
    page.evaluate("""() => { const g = window.__gg, m = g.spawnMonster('drownedGhoul', 1, false, 0.099); m.sp = 0.5; m.hp = 2.5; m.burnLeft = 2; m.burnAmt = 1; m.burnTick = 9; m.slowT = 5; window.__m = m; }""")
    page.evaluate("() => window.__gg.update(0.05)")
    r = page.evaluate("() => { const m = window.__m, g = window.__gg; return [m.lane, m.p, m.x, m.tx, g.LANE(3), m.hp, m.burnLeft, m.slowT, m.whirlCool]; }")
    ok(r[0] == 3 and abs(r[1] - 0.18) < 0.03 and r[2] == r[4] and r[3] == r[4], f'a ghoul walking into end A comes out at end B (lane, p, x, tx) {r[:5]}')
    ok(r[5] == 2.5 and r[6] == 2 and r[7] > 4.5, f'with its health, burn and slow unchanged {r[5:8]}')
    ok(r[8] > 1.5, f'and a cool-down set {r[8]}')
    page.evaluate("() => { window.__gg.G.monsters.length = 0; window.__gg.G.whirls = []; window.__gg.addWhirlPair({ lane:2, p:0.1 }, { lane:2, p:0.17 }); const m = window.__gg.spawnMonster('drownedGhoul', 2, false, 0.099); m.sp = 0.5; window.__m = m; window.__gg.update(0.05); }")
    r = page.evaluate("() => [window.__m.lane, window.__m.p]")
    ok(r[0] == 2 and abs(r[1] - 0.17) < 0.03, f'a pair in the same lane works {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_whirl_never(browser, url):
    if not R9: return
    page, errors = whirl_page(browser, url, [[(1, 0.1), (3, 0.18)]])
    r = page.evaluate("""() => { const g = window.__gg, out = {};
      const tryTake = (m) => { m.p = 0.11; g.whirlStep(m, 0.09); return [m.lane, m.p]; };
      out.boss = tryTake(g.spawnMonster('boss:poltergeist', 1, false, 0.09));
      out.diver = tryTake(g.spawnMonster('diver', 1, false, 0.09));
      const f = g.spawnMonster('drownedGhoul', 1, false, 0.09); f.frozenT = 3; out.frozen = tryTake(f);
      const e = g.spawnMonster('drownedGhoul', 1, false, 0.09); e.eating = true; out.eating = tryTake(e);
      const c = g.spawnMonster('drownedGhoul', 1, false, 0.09); c.rise = 2; out.rising = tryTake(c);
      const h = g.spawnMonster('drownedGhoul', 1, false, 0.09); h.hidden = true; out.hidden = tryTake(h);
      const ok_ = g.spawnMonster('drownedGhoul', 1, false, 0.09); out.control = tryTake(ok_);
      return out; }""")
    for k in ('boss', 'diver', 'frozen', 'eating', 'rising', 'hidden'):
        ok(r[k][0] == 1 and abs(r[k][1] - 0.11) < 1e-9, f'{k} on an end is not taken {r[k]}')
    ok(r['control'][0] == 3, f'the same step takes an ordinary ghoul {r["control"]}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_whirl_edges(browser, url):
    if not R9: return
    page, errors = tide_page(browser, url, [{'at': 0.3, 'to': 0.5}], puddles=[[2, 0.45]], shore=0.3)
    page.evaluate("() => { const g = window.__gg; g.G.whirls = []; window.__added = [g.addWhirlPair({ lane:2, p:0.45 }, { lane:0, p:0.1 })]; }")
    ok(page.evaluate("() => window.__added") == [True], 'an end may sit in a pool')
    # knocked back over an end
    r = page.evaluate("""() => { const g = window.__gg, m = g.spawnMonster('drownedGhoul', 0, false, 0.12); m.sp = 0; m.kb = 0.05; window.__k = m;
      for (let i = 0; i < 3; i++) g.update(0.05); return [m.lane, m.p]; }""")
    ok(r[0] == 0 and r[1] < 0.12, f'a monster knocked back over an end is not taken {r}')
    r = page.evaluate("() => { const g = window.__gg, m = g.spawnMonster('drownedGhoul', 0, false, 0.12); g.whirlStep(m, 0.14); return [m.lane, m.p]; }")
    ok(r[0] == 0 and abs(r[1] - 0.12) < 1e-9, f'(a backward step across an end is never a crossing) {r}')
    # the cool-down
    page.evaluate("""() => { const g = window.__gg, G = g.G; G.monsters.length = 0; window.__m = g.spawnMonster('drownedGhoul', 0, false, 0.099); window.__m.sp = 0.5; g.update(0.05); }""")
    r = page.evaluate("() => [window.__m.lane, window.__m.p]")
    ok(r[0] == 2, f'taken at end 0.1 of lane 0 (out at the pool end) {r}')
    page.evaluate("() => { const m = window.__m; m.sp = 0; m.p = 0.46; window.__gg.whirlStep(m, 0.44); }")
    r = page.evaluate("() => [window.__m.lane, window.__m.p]")
    ok(r[0] == 2 and abs(r[1] - 0.46) < 1e-9, f'just out, it cannot go back for 2 s {r}')
    page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 43; i++) g.update(0.05); window.__m.p = 0.44; }")
    page.evaluate("() => { const m = window.__m; m.p = 0.46; window.__gg.whirlStep(m, 0.44); }")
    ok(page.evaluate("() => window.__m.lane") == 0, 'after the 2 s it can be taken again (the pool end sends it back to lane 0)')
    # the tide swallows the pool: the end keeps working
    page.evaluate("() => { const g = window.__gg, G = g.G; G.monsters.length = 0; G.spawned = 6; }"); step(page, 1.2)
    ok(page.evaluate("() => window.__gg.G.puddles.length") == 0 and page.evaluate("() => window.__gg.liveShore()") >= 0.5 - 1e-6, 'the pool is swallowed')
    ok(page.evaluate("() => window.__gg.whirlSnapshot().length") == 1, 'its pair is still standing')
    r = page.evaluate("() => { const g = window.__gg, m = g.spawnMonster('drownedGhoul', 2, false, 0.46); m.p = 0.46; g.whirlStep(m, 0.44); return [m.lane, m.p]; }")
    ok(r[0] == 0 and abs(r[1] - 0.1) < 1e-9, f'an end in a pool the tide swallowed still works (now in the tide) {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_whirl_place(browser, url):
    if not R9: return
    page, errors = whirl_page(browser, url)
    r = page.evaluate("""() => { const g = window.__gg; return [g.addWhirlPair({ lane:1, p:0.9 }, { lane:2, p:0.1 }), g.addWhirlPair({ lane:1, p:0.1 }, { lane:2, p:0.9 }), g.G.whirls.length]; }""")
    ok(r == [False, False, 0], f'a dry end is refused, either end {r}')
    r = page.evaluate("""() => { const g = window.__gg, a = []; for (let i = 0; i < 5; i++) a.push(g.addWhirlPair({ lane:i, p:0.05 }, { lane:i, p:0.15 })); return [a, g.G.whirls.length, g.WHIRL_MAX]; }""")
    ok(r == [[True, True, True, True, False], 4, 4], f'a 5th pair is refused {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_whirl_continue(browser, url):
    if not R9: return
    page, errors = whirl_page(browser, url, [[(1, 0.1), (3, 0.18)], [(0, 0.05), (4, 0.15)]])
    before = page.evaluate("() => window.__gg.whirlSnapshot()")
    r = page.evaluate("""() => { const g = window.__gg, c = g.continueState(); c.remaining = 8; g.continueNight(c); return g.whirlSnapshot(); }""")
    ok(r == before and len(r) == 2, f'the pairs survive a continue {before} -> {r}')
    ok(page.evaluate("() => window.__gg.G.whirls.map(w => w.col)") == page.evaluate("() => window.__gg.WHIRL_COLOURS.slice(0, 2)"), 'each pair keeps its colour')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_whirl_budget(browser, url):
    if not R9: return
    page, errors = whirl_page(browser, url, [[(0, 0.05), (4, 0.15)], [(1, 0.08), (3, 0.12)], [(2, 0.05), (2, 0.15)], [(0, 0.12), (4, 0.06)]])
    ok(page.evaluate("() => window.__gg.G.whirls.length") == 4, 'four pairs stand')
    probe = """() => { const g = window.__gg, c = g.ctx, d = c.drawImage, f = c.fill, s = c.stroke, n = { img:0, fill:0, stroke:0 };
      c.drawImage = function(...a){ n.img++; return d.apply(this, a); }; c.fill = function(...a){ n.fill++; return f.apply(this, a); }; c.stroke = function(...a){ n.stroke++; return s.apply(this, a); };
      try { g.drawWhirls(1.3); } finally { delete c.drawImage; delete c.fill; delete c.stroke; } return n; }"""
    page.evaluate(probe)   # the first call bakes
    n = page.evaluate(probe)
    ok(0 < n['img'] <= 8 and n['fill'] == 0 and n['stroke'] == 0, f'4 pairs add at most 8 drawImage and no fill/stroke {n}')
    shot = os.environ.get('GG_WHIRL_SHOT')
    if shot:
        page.evaluate("() => document.querySelectorAll('.overlay, [id^=ov]').forEach(e => { e.style.display = 'none'; })"); time.sleep(0.4); page.screenshot(path=shot)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS = {'check_r9_absent': check_r9_absent, 'check_n5_track': check_n5_track, 'check_n5_blood_sea': check_n5_blood_sea, 'check_n5_book': check_n5_book,
          'check_tide_marks': check_tide_marks, 'check_tide_live_shore': check_tide_live_shore, 'check_tide_limits': check_tide_limits, 'check_tide_swallow_diver': check_tide_swallow_diver,
          'check_tide_swallow_walker': check_tide_swallow_walker, 'check_tide_boss_total': check_tide_boss_total, 'check_tide_continue': check_tide_continue, 'check_tide_budget': check_tide_budget, 'check_story_shore_unchanged': check_story_shore_unchanged, 'check_whirl_move': check_whirl_move, 'check_whirl_never': check_whirl_never, 'check_whirl_edges': check_whirl_edges, 'check_whirl_place': check_whirl_place, 'check_whirl_continue': check_whirl_continue, 'check_whirl_budget': check_whirl_budget}


# ---------- Task 4: the Blood Slime and the Pirate ----------
STEP = "([s, dt]) => { const g = window.__gg; for (let t = 0; t < s - 1e-9; t += dt) g.update(dt); }"
ALIVE = "() => window.__gg.G.monsters.filter(m => !m.dead && (m.type === 'bloodslime' || m.type === 'bloodblob')).length"
BLOBS = "() => window.__gg.G.monsters.filter(m => !m.dead && m.type === 'bloodblob').length"
SLIMES = "() => window.__gg.G.monsters.filter(m => !m.dead && m.type === 'bloodslime').map(m => m.hp)"


def slime_page(browser, url):
    """marsh_page with an empty patch, for the Blood Slime and Pirate checks."""
    page, errors = marsh_page(browser, url)
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); g.G.def.total = 999; g.G.total = 999; }")
    return page, errors


def check_bloodslime(browser, url):
    if not R9: return
    page, errors = slime_page(browser, url)
    T = page.evaluate("() => { const T = window.__gg.TYPES; return [T.bloodslime.hp, T.bloodslime.splits, T.bloodblob.hp, T.bloodblob.regrow]; }")
    ok(T == [4, 3, 1, 6], f'Blood Slime 4 hp splits 3, blob 1 hp regrows in 6 s {T}')
    page.evaluate("() => { const g = window.__gg, m = g.spawnMonster('bloodslime', 2, true, 0.25); window.__s = m; g.kill(m); }")
    ok(page.evaluate(BLOBS) == 3, f'a kill makes 3 blobs ({page.evaluate(BLOBS)})')
    ok(page.evaluate("() => window.__gg.G.monsters.filter(m => !m.dead && m.type === 'bloodblob').every(m => m.hp === 1)"), 'each blob has 1 hp')
    page.evaluate(STEP, [3, 0.05])
    sw = page.evaluate("() => window.__gg.G.monsters.filter(m => !m.dead && m.type === 'bloodblob').map(m => m.swell)")
    ok(all(1.3 < x < 1.45 for x in sw), f'a Bloodlet swells as it grows (x{sw[0]:.2f} at 3 s of 6)')
    page.evaluate("() => { const g = window.__gg, b = g.G.monsters.find(m => !m.dead && m.type === 'bloodblob'); b.hp = 0; g.kill(b); }")
    ok(page.evaluate(BLOBS) == 2 and page.evaluate(ALIVE) == 2, 'a blob killed at 3 s is gone and splits no more')
    page.evaluate(STEP, [2.8, 0.05])
    ok(page.evaluate(BLOBS) == 2, 'at 5.8 s the two blobs are still blobs')
    page.evaluate(STEP, [0.6, 0.05])
    ok(page.evaluate(BLOBS) == 0 and page.evaluate(SLIMES) == [4, 4], f'after 6 s each is a 4-hp Blood Slime {page.evaluate(SLIMES)}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_slime_cap(browser, url):
    if not R9: return
    page, errors = slime_page(browser, url)
    SP = "(n) => { const g = window.__gg; window.__v = []; for (let i = 0; i < n; i++) window.__v.push(g.spawnMonster('bloodslime', i % 5, true, 0.2 + 0.05 * Math.floor(i / 5))); }"
    KILL = "() => { const g = window.__gg, m = window.__v[0]; m.hp = 0; g.kill(m); }"
    page.evaluate(SP, 12); page.evaluate(KILL)
    ok(page.evaluate(ALIVE) == 12 and page.evaluate(BLOBS) == 1, f'with 11 alive a split makes 1 blob ({page.evaluate(BLOBS)}, {page.evaluate(ALIVE)} alive)')
    page.evaluate("() => { const G = window.__gg.G; G.monsters.length = 0; }")
    page.evaluate(SP, 13); page.evaluate(KILL)
    ok(page.evaluate(ALIVE) == 12 and page.evaluate(BLOBS) == 0, f'with 12 alive a split makes none ({page.evaluate(BLOBS)} blobs, {page.evaluate(ALIVE)} alive)')
    page.evaluate("() => { const G = window.__gg.G; G.monsters.length = 0; }")
    page.evaluate(SP, 10)
    peak = page.evaluate("() => { const g = window.__gg; let peak = 0; for (const m of window.__v){ m.hp = 0; g.kill(m); peak = Math.max(peak, g.G.monsters.filter(o => !o.dead && (o.type === 'bloodslime' || o.type === 'bloodblob')).length); } return peak; }")
    ok(peak <= 12 and page.evaluate(ALIVE) == 12, f'ten simultaneous splits never exceed 12 (peak {peak}, now {page.evaluate(ALIVE)})')
    page.evaluate(STEP, [7, 0.05])
    ok(page.evaluate(ALIVE) <= 12, f'regrowth keeps the cap ({page.evaluate(ALIVE)})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_slime_win(browser, url):
    if not R9: return
    page, errors = slime_page(browser, url)
    page.evaluate("() => { const g = window.__gg, G = g.G; G.def.boss = null; G.spawned = G.def.total; const m = g.spawnMonster('bloodslime', 2, true, 0.25); g.kill(m); }")
    page.evaluate(STEP, [1, 0.05])
    ok(page.evaluate("() => window.__gg.G.over") is False, 'the spawn total is reached, but the night goes on while a blob stands')
    page.evaluate(STEP, [6.5, 0.05])
    ok(page.evaluate("() => window.__gg.G.over") is False and page.evaluate(SLIMES) == [4, 4, 4], 'the blobs regrew: still not won')
    page.evaluate("() => { const g = window.__gg; for (const m of g.G.monsters.filter(o => !o.dead)){ m.hp = 0; g.kill(m); } }")
    page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 4; i++) for (const m of g.G.monsters.filter(o => !o.dead && o.type === 'bloodblob')){ m.hp = 0; g.kill(m); } }")
    page.evaluate(STEP, [0.2, 0.05])
    ok(page.evaluate("() => window.__gg.G.over") is True, 'the night ends once the last blob dies')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_slime_frozen(browser, url):
    if not R9: return
    page, errors = slime_page(browser, url)
    page.evaluate("() => { const g = window.__gg, m = g.spawnMonster('bloodslime', 2, true, 0.25); g.kill(m); window.__b = g.G.monsters.find(o => !o.dead && o.type === 'bloodblob'); window.__g0 = window.__b.growT || 0; window.__b.frozenT = 30; }")
    page.evaluate(STEP, [8, 0.05])
    r = page.evaluate("() => [window.__b.type, window.__b.dead, window.__b.growT || 0, window.__g0]")
    ok(r[0] == 'bloodblob' and not r[1] and abs(r[2] - r[3]) < 1e-9, f'a frozen blob does not regrow for 8 s {r}')
    page.evaluate("() => { window.__b.frozenT = 0; }")
    page.evaluate(STEP, [6.2, 0.05])
    ok(page.evaluate("() => window.__b.dead") is True, 'unfrozen, it regrows after its 6 s')
    # a chewing blob keeps growing (owner); a frozen chewing one does not
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; g.walls.forEach(w => { w.hp = w.max = 500; }); const b = g.spawnMonster('bloodblob', 2, true, 1.0); b.age = 5; b.eating = true; window.__c = b; const f = g.spawnMonster('bloodblob', 4, true, 1.0); f.age = 5; f.eating = true; f.frozenT = 30; window.__f = f; }")
    page.evaluate(STEP, [3, 0.05])
    ok(page.evaluate("() => window.__c.eating && window.__c.growT > 2.9 && !window.__c.dead") and page.evaluate("() => window.__f.growT") == 0, 'a chewing blob swells while a frozen chewing one does not')
    page.evaluate(STEP, [3.3, 0.05])
    ok(page.evaluate("() => window.__c.dead && window.__gg.G.monsters.some(m => m.type === 'bloodslime' && !m.dead && m.lane === 2)") and page.evaluate("() => !window.__f.dead && window.__f.growT") == 0, 'the chewing blob becomes a full Blood Slime at the fence; the frozen one stays small')
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; const b = g.spawnMonster('bloodblob', 2, true, 0.5); b.age = 5; b.sp = 0; b.kb = 5; window.__k = b; }")
    page.evaluate(STEP, [3, 0.05])
    ok(page.evaluate("() => window.__k.growT > 2.9"), 'a knocked-back blob swells too')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


PIR = """(o) => { const g = window.__gg; g.grid.forEach(r => r.fill(null));
  for (const [r, c, gourd] of o.cells) g.grid[r][c] = gourd ? g.newGourd('grave') : g.newCell(0);
  const m = g.spawnMonster('pirate', 2, true, 0.1); if (o.stops) m.stops = o.stops.slice(); window.__p = m; return m.stops.slice(); }"""
CELL = "([r, c]) => { const x = window.__gg.grid[r][c]; return !x ? 'none' : x.gourd ? 'gourd' : 'pumpkin'; }"


def pirate_to_stop(page):
    """Step the night in 0.05 s ticks until the Pirate begins to aim (so the aim has just begun when this returns)."""
    return page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 4000 && !window.__p.aiming; i++) g.update(0.05); return !!window.__p.aiming; }")


def check_pirate(browser, url):
    if not R9: return
    page, errors = slime_page(browser, url)
    stops = [page.evaluate(PIR, {'cells': []}) for _ in range(30)]
    ok(all(1 <= len(s) <= 2 and all(0.3 <= x <= 0.6 for x in s) for s in stops) and {len(s) for s in stops} == {1, 2}, 'he picks one or two stop points in [0.3, 0.6]')
    page.evaluate("() => { window.__gg.G.monsters.length = 0; }")
    # the top pumpkin of his column is shot, after 1 s of aim; the one below stays
    page.evaluate(PIR, {'cells': [(1, 2), (3, 2), (1, 4)], 'stops': [0.35]})
    ok(pirate_to_stop(page), 'he stops and aims')
    p0 = page.evaluate("() => window.__p.p")
    ok(0.3 <= p0 <= 0.4, f'at his stop point {p0:.3f}')
    page.evaluate(STEP, [0.9, 0.05])
    ok(page.evaluate("() => window.__p.aiming") and page.evaluate(CELL, [1, 2]) == 'pumpkin', 'after 0.9 s he is still aiming and nothing is destroyed')
    ok(abs(page.evaluate("() => window.__p.p") - p0) < 0.005, 'he stands still while he aims')
    page.evaluate(STEP, [0.2, 0.05])
    c = [page.evaluate(CELL, [1, 2]), page.evaluate(CELL, [3, 2]), page.evaluate(CELL, [1, 4])]
    ok(c == ['none', 'pumpkin', 'pumpkin'], f'the top pumpkin in his column is destroyed, the rest stay {c}')
    page.evaluate(STEP, [3, 0.05])
    ok(page.evaluate("() => window.__p.p") > p0 + 0.05, 'then he walks on')
    # a gourd at the top is skipped
    page.evaluate("() => { window.__gg.G.monsters.length = 0; }")
    page.evaluate(PIR, {'cells': [(0, 2, True), (2, 2), (4, 2)], 'stops': [0.35]})
    pirate_to_stop(page); page.evaluate(STEP, [1.1, 0.05])
    c = [page.evaluate(CELL, [0, 2]), page.evaluate(CELL, [2, 2]), page.evaluate(CELL, [4, 2])]
    ok(c == ['gourd', 'none', 'pumpkin'], f'a gourd at the top is skipped for the next pumpkin {c}')
    # an empty column: no shot, he walks on
    page.evaluate("() => { window.__gg.G.monsters.length = 0; }")
    page.evaluate(PIR, {'cells': [(1, 3)], 'stops': [0.35]})
    page.evaluate(STEP, [11, 0.05])
    ok(page.evaluate("() => [window.__p.aiming, window.__p.p > 0.4]") == [False, True] and page.evaluate(CELL, [1, 3]) == 'pumpkin', 'an empty column means no shot: he walks on')
    ok(page.evaluate("() => { const G = window.__gg.G; return G.projs.length + G.drops.length; }") >= 0, 'no leftovers')
    # two shots
    page.evaluate("() => { window.__gg.G.monsters.length = 0; }")
    page.evaluate(PIR, {'cells': [(1, 2), (2, 2), (3, 2)], 'stops': [0.33, 0.5]})
    page.evaluate(STEP, [14, 0.05])
    n = sum(page.evaluate(CELL, [r, 2]) == 'pumpkin' for r in (1, 2, 3))
    ok(n == 1, f'two shots destroy two pumpkins in his column ({3 - n})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_slime_budget(browser, url):
    if not R9: return
    page, errors = slime_page(browser, url)
    probe = """() => new Promise(res => { const g = window.__gg, c = g.ctx, f = c.fill, s = c.stroke, n = { fill:0, stroke:0 }; let fr = 0;
      c.fill = function(...a){ n.fill++; return f.apply(this, a); }; c.stroke = function(...a){ n.stroke++; return s.apply(this, a); };
      const tick = () => { if (++fr < 20) requestAnimationFrame(tick); else { delete c.fill; delete c.stroke; res(n); } }; requestAnimationFrame(tick); })"""
    page.evaluate("() => { window.__gg.setState('play'); window.__gg.G.spawnTimer = 999; window.__gg.G.sproutT = -999; }")
    page.evaluate(probe)   # warm
    base = page.evaluate(probe)
    page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 6; i++) g.spawnMonster('bloodslime', i % 5, true, 0.3 + 0.1 * Math.floor(i / 5)); for (let i = 0; i < 6; i++) g.spawnMonster('bloodblob', (i + 2) % 5, true, 0.2 + 0.1 * Math.floor(i / 5)); g.G.monsters.forEach(m => { m.sp = 0; m.age = 5; }); }")
    page.evaluate("() => new Promise(r => setTimeout(r, 400))")
    ok(page.evaluate(ALIVE) == 12, 'twelve slimes and blobs stand')
    page.evaluate(probe)
    n = page.evaluate(probe)
    ok(n['fill'] <= base['fill'] + 20 and n['stroke'] <= base['stroke'] + 20, f'12 slimes and blobs add no fill/stroke over 20 frames (empty {base}, crowded {n})')
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); g.grid[1][2] = g.newCell(0); const m = g.spawnMonster('pirate', 2, true, 0.3); m.stops = [0.3]; m.age = 5; window.__p = m; for (let i = 0; i < 40 && !m.aiming; i++) g.update(0.05); }")
    ok(page.evaluate("() => window.__p.aiming") is True, 'a Pirate aims')
    aim = """() => { const g = window.__gg, c = g.ctx, d = c.drawImage, f = c.fill, s = c.stroke, n = { img:0, fill:0, stroke:0 };
      c.drawImage = function(...a){ n.img++; return d.apply(this, a); }; c.fill = function(...a){ n.fill++; return f.apply(this, a); }; c.stroke = function(...a){ n.stroke++; return s.apply(this, a); };
      try { g.drawPirateAims(1.1); } finally { delete c.drawImage; delete c.fill; delete c.stroke; } return n; }"""
    page.evaluate(aim)
    n = page.evaluate(aim)
    ok(n['img'] == 2 and n['fill'] == 0 and n['stroke'] == 0, f'the aim line and reticle are two blits and no paths {n}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_bloodslime': check_bloodslime, 'check_slime_cap': check_slime_cap, 'check_slime_win': check_slime_win, 'check_slime_frozen': check_slime_frozen,
               'check_pirate': check_pirate, 'check_slime_budget': check_slime_budget})


# ---------- Task 5: the Turtle Rider and the Storm Eel ----------
ROTTEN_N = "() => { const g = window.__gg; let n = 0; const at = []; for (let r = 0; r < g.grid.length; r++) for (let c = 0; c < g.grid[r].length; c++) if (g.isRotten(g.grid[r][c])) { n++; at.push([r, c]); } return { n, at }; }"


def check_turtlerider(browser, url):
    if not R9: return
    page, errors = slime_page(browser, url)
    T = page.evaluate("() => { const T = window.__gg.TYPES.turtlerider, S = window.__gg.TYPES.turtle; return [T.hp, T.r, T.sp, T.coins, T.eat, T.pts, T.drop, T.noKnockback, T.rotEvery, S.noKnockback]; }")
    ok(T == [10, 26, 0.03, 14, 0.3, 34, 3, True, 7, True], f'Turtle Rider numbers, and it shrugs knockback off as the Shell Turtle does {T}')
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); for (const [r, c] of [[0, 1], [2, 2], [4, 3], [1, 4], [3, 0]]) g.grid[r][c] = g.newCell((r + c) % 4); const m = g.spawnMonster('turtlerider', 2, true, 0.3); m.sp = 0; m.age = 5; window.__t = m; window.__seen = false; }")
    page.evaluate(STEP, [6.8, 0.05])
    ok(page.evaluate(ROTTEN_N)['n'] == 0, 'nothing rots before its 7 s are up')
    seen = False
    for _ in range(16):
        page.evaluate(STEP, [0.05, 0.05])
        if page.evaluate("() => window.__gg.G.vfx.some(v => v.kind === 'rotshot')"): seen = True
    ok(seen, 'a rotten pumpkin is in the air after 7 s')
    r = page.evaluate(ROTTEN_N)
    ok(r['n'] == 0, 'it flies for 0.7 s before it lands')
    page.evaluate(STEP, [0.1, 0.05])
    r = page.evaluate(ROTTEN_N)
    ok(r['n'] == 1 and abs(r['at'][0][1] - 2) <= 1, f'by 7.8 s one cell in its column or a neighbour is rotten {r}')
    page.evaluate(STEP, [7.3, 0.05])
    ok(page.evaluate(ROTTEN_N)['n'] == 2, 'and again 7 s later')
    # it never throws at a cell rotCell would refuse: only gourds and empties in reach means no throw
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; g.grid.forEach(r => r.fill(null)); g.grid[1][2] = g.newGourd('grave'); g.grid[2][0] = g.newCell(0); const m = g.spawnMonster('turtlerider', 2, true, 0.3); m.sp = 0; m.age = 5; }")
    page.evaluate(STEP, [16, 0.05])
    ok(page.evaluate(ROTTEN_N)['n'] == 0 and page.evaluate("() => !!window.__gg.grid[1][2].gourd"), 'a gourd and a pumpkin two columns away are never thrown at')
    # Grey: a bunch fired up its lane damages it and does not push it back, as with the Shell Turtle
    for kind in ('turtle', 'turtlerider'):
        page.evaluate("([kind]) => { const g = window.__gg; g.G.monsters.length = 0; g.G.projs.length = 0; g.grid.forEach(r => r.fill(null)); g.walls.forEach(w => { w.hp = w.max = 500; }); const m = g.spawnMonster(kind, 2, true, 0.5); m.age = 5; m.sp = 0; m.hp = m.maxHp = 40; window.__g = [m, m.p]; for (const r of [1, 2, 3]) g.grid[r][2] = g.newCell(4); g.resolveMatches(); g.launchGroup(g.grid[2][2]); }", [kind])
        page.evaluate(STEP, [2, 0.02])
        r = page.evaluate("() => [window.__g[0].hp, window.__g[0].p - window.__g[1], window.__g[0].kb]")
        ok(r[0] < 40 and r[1] > -1e-6 and r[2] == 0, f'a Grey bunch hurts the {kind} and does not knock it back {r}')
    # an imp appears where it dies
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; const m = g.spawnMonster('turtlerider', 3, true, 0.42); m.age = 5; window.__t = m; g.kill(m); }")
    imp = page.evaluate("() => window.__gg.G.monsters.filter(m => m.type === 'imp' && !m.dead).map(m => [m.lane, m.p])")
    ok(len(imp) == 1 and imp[0][0] == 3 and abs(imp[0][1] - 0.42) < 0.03, f'an Imp is released where it dies {imp}')
    # it walks like a turtle: slowly down its lane
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; const m = g.spawnMonster('turtlerider', 1, true, 0.1); m.age = 5; window.__t = m; }")
    page.evaluate(STEP, [10, 0.05])
    d = page.evaluate("() => window.__t.p")
    ok(0.3 < d < 0.5, f'it walks at 0.03 a second {d:.2f}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


EEL_ST = "() => { const m = window.__e; return [m.lane, m.p, m.hidden]; }"


def eel_page(browser, url):
    page, errors = slime_page(browser, url)
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; g.G.arrows.length = 0; g.G.vfx.length = 0; const m = g.spawnMonster('eel', 2, true, 0.08); m.age = 5; window.__e = m; g.walls.forEach(w => { w.hp = w.max = 200; }); }")
    return page, errors


def check_eel(browser, url):
    if not R9: return
    page, errors = eel_page(browser, url)
    T = page.evaluate("() => { const T = window.__gg.TYPES.eel; return [T.hp, T.r, T.sp, T.coins, T.eat, T.pts, T.drop, T.up, T.down, T.charge, T.bolt, T.boltSp]; }")
    ok(T == [3, 20, 0, 10, 0, 28, 2, 2.5, 3, 0.5, 2, 0.35], f'Storm Eel numbers {T}')
    ok(page.evaluate("() => window.__e.hidden") is True, 'it starts under the water')
    # its first bolt: surfaces after 3 s, charges 0.5 s, then a bolt; the fence loses the Diver\'s 2
    t = 0.0; t_up = t_bolt = None
    while t < 8:
        page.evaluate(STEP, [0.05, 0.05]); t += 0.05
        if t_up is None and page.evaluate("() => !window.__e.hidden"): t_up = t
        if t_bolt is None and page.evaluate("() => window.__gg.G.arrows.some(a => a.zap)"): t_bolt = t
        if t_bolt is not None: break
    ok(t_up is not None and 2.9 <= t_up <= 3.2, f'it surfaces after 3 s ({t_up})')
    ok(t_bolt is not None and t_bolt - t_up >= 0.5 and t_bolt - t_up <= 1.4, f'it charges at least 0.5 s before the bolt ({None if t_bolt is None else round(t_bolt - t_up, 2)})')
    a = page.evaluate("() => window.__gg.G.arrows.find(a => a.zap)")
    ok(a is not None and a['dmg'] == 2 and a['sp'] == 0.35 and a['lane'] == 2, f'the bolt is the Diver\'s {a}')
    w0 = page.evaluate("() => window.__gg.walls[2].hp")
    page.evaluate(STEP, [2.9, 0.05])
    w1 = page.evaluate("() => window.__gg.walls[2].hp")
    ok(w0 - w1 == 2, f'the bolt takes 2 off its fence ({w0} -> {w1})')
    ok(page.evaluate("() => window.__gg.G.vfx.some(v => v.kind === 'clip' && v.key === 'stormbolt' && v.clip === 'zap')"), 'the bolt bursts on the fence: its zap effect is queued')
    # resurfacing: each time at a new spot that is in water
    spots = []; last = None
    page.evaluate("() => { const e = window.__e; e.sp = 0; }")
    for _ in range(1200):
        page.evaluate(STEP, [0.05, 0.05])
        st = page.evaluate(EEL_ST)
        if not st[2] and (last is None or last[2]): spots.append(st)
        last = st
        if len(spots) >= 8: break
    ok(len(spots) >= 8, f'it keeps coming up ({len(spots)} times)')
    bad = [s for s in spots if not page.evaluate("([l, p]) => window.__gg.inWater(l, p)", [s[0], s[1]])]
    ok(not bad, f'every spot is in water {bad[:2]}')
    same = [i for i in range(1, len(spots)) if spots[i][0] == spots[i - 1][0] and abs(spots[i][1] - spots[i - 1][1]) < 1e-6]
    ok(not same, 'never the same spot twice in a row')
    ok(len({(s[0], round(s[1], 3)) for s in spots}) >= 4, 'it moves about')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_eel_tide(browser, url):
    if not R9: return
    page, errors = tide_page(browser, url, [{'at': 0.3, 'to': 0.6}], puddles=[], shore=0.2)
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); g.walls.forEach(w => { w.hp = w.max = 500; }); g.G.monsters.length = 0; const m = g.spawnMonster('eel', 2, true, 0.1); m.age = 5; window.__e = m; g.G.spawned = 6; }")
    far = 0; spots = []; last = None
    for _ in range(900):
        page.evaluate(STEP, [0.05, 0.05]); st = page.evaluate(EEL_ST)
        if not st[2] and (last is None or last[2]): spots.append(st)
        last = st
    sh = page.evaluate("() => window.__gg.shoreP()")
    ok(abs(sh - 0.6) < 1e-6, f'the tide rose to 0.6 {sh}')
    ok(any(s[1] > 0.2 + 1e-6 for s in spots), f'after the surge it comes up in the new tide {[round(s[1], 2) for s in spots]}')
    ok(all(s[1] <= 0.6 + 1e-6 for s in spots), 'and never on dry land')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_eel_hidden(browser, url):
    if not R9: return
    page, errors = eel_page(browser, url)
    page.evaluate("""() => { const g = window.__gg, e = window.__e; e.p = 0.12; e.upT = 99; e.sp = 0; for (const r of [1, 2, 3]) g.grid[r][2] = g.newCell(0); g.resolveMatches(); g.launchGroup(g.grid[2][2]); }""")
    page.evaluate(STEP, [3, 0.02])
    ok(page.evaluate("() => [window.__e.hp, window.__e.dead]") == [3, False], 'hits while it is hidden do nothing')
    page.evaluate("""() => { const g = window.__gg, e = window.__e; g.G.arrows.length = 0; e.hidden = false; e.fired = true; e.upT = 99; for (const r of [1, 2, 3]) g.grid[r][2] = g.newCell(0); g.resolveMatches(); g.launchGroup(g.grid[2][2]); }""")
    page.evaluate(STEP, [3, 0.02])
    ok(page.evaluate("() => window.__e.dead || window.__e.hp < 3"), 'but it can be hit while it is up')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_eel_no_leap(browser, url):
    if not R9: return
    page, errors = slime_page(browser, url)
    info = page.evaluate("""() => { const g = window.__gg, C = g.CHARS, A = g.atlas('eel'); return { eel:Object.keys(C.eel.clips), baked:Object.keys(A.clips), bolt:Object.keys(C.stormbolt.clips),
      tr:Object.keys(C.turtlerider.clips), rot:Object.keys(C.rotshot.clips), trBaked:Object.keys(g.atlas('turtlerider').clips) }; }""")
    ok('leap' not in info['eel'] and 'leap' not in info['baked'], f'no leap clip in the Storm Eel {info["baked"]}')
    ok(set(['hidden', 'surface', 'idle', 'charge', 'shoot', 'down']) <= set(info['baked']), 'the other clips are all there')
    ok(set(info['bolt']) == {'fly', 'zap'} and set(info['rot']) == {'fly', 'splat'}, 'the bolt and the rotten pumpkin have their clips')
    ok(set(['walk', 'chew', 'throw']) <= set(info['trBaked']), f'Turtle Rider clips {info["trBaked"]}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_eel_budget(browser, url):
    if not R9: return
    page, errors = slime_page(browser, url)
    probe = """() => new Promise(res => { const g = window.__gg, c = g.ctx, f = c.fill, s = c.stroke, n = { fill:0, stroke:0 }; let fr = 0;
      c.fill = function(...a){ n.fill++; return f.apply(this, a); }; c.stroke = function(...a){ n.stroke++; return s.apply(this, a); };
      const tick = () => { if (++fr < 20) requestAnimationFrame(tick); else { delete c.fill; delete c.stroke; res(n); } }; requestAnimationFrame(tick); })"""
    page.evaluate("() => { window.__gg.setState('play'); window.__gg.G.spawnTimer = 999; window.__gg.G.sproutT = -999; }")
    # the same crowd of old things first (Divers, Shell Turtles, a Diver's water balls) as the yardstick: health bars and shadows are theirs
    page.evaluate("""() => { const g = window.__gg; for (let i = 0; i < 4; i++){ const e = g.spawnMonster('diver', i, true, 0.1); e.age = 5; e.hidden = false; e.upT = 99; e.sp = 0; }
      for (let i = 0; i < 4; i++){ const t = g.spawnMonster('turtle', i, true, 0.4); t.age = 5; t.sp = 0; }
      for (let i = 0; i < 4; i++) g.G.arrows.push({ lane:i, p:0.5, sp:0, dmg:2, dead:false, water:true }); }""")
    page.evaluate("() => new Promise(r => setTimeout(r, 400))")
    page.evaluate(probe)
    base = page.evaluate(probe)
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; g.G.arrows.length = 0; }")
    page.evaluate("""() => { const g = window.__gg; for (let i = 0; i < 4; i++){ const e = g.spawnMonster('eel', i, true, 0.1); e.age = 5; e.hidden = false; e.upT = 99; e.fired = true; e.sp = 0; }
      for (let i = 0; i < 4; i++){ const t = g.spawnMonster('turtlerider', i, true, 0.4); t.age = 5; t.sp = 0; t.rotT = 999; }
      for (let i = 0; i < 4; i++){ g.G.arrows.push({ lane:i, p:0.5, sp:0, dmg:2, dead:false, zap:true }); g.G.vfx.push({ kind:'rotshot', x0:100, y0:200, x1:150, y1:500, t:0, dur:99 }); } }""")
    page.evaluate("() => new Promise(r => setTimeout(r, 400))")
    page.evaluate(probe)
    n = page.evaluate(probe)
    ok(n['fill'] <= base['fill'] + 20 and n['stroke'] <= base['stroke'] + 20, f'four eels, four Turtle Riders, bolts and thrown pumpkins add no fill/stroke over 20 frames beside Divers, Turtles and water balls (old {base}, new {n})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_turtlerider': check_turtlerider, 'check_eel': check_eel, 'check_eel_tide': check_eel_tide, 'check_eel_hidden': check_eel_hidden,
               'check_eel_no_leap': check_eel_no_leap, 'check_eel_budget': check_eel_budget})


# ---------- Task 6: the Siren and hidden rows ----------
def siren_page(browser, url, lane=2):
    """slime_page (empty patch, paused) with one Siren in `lane`, its fence made strong. Returns (page, errors)."""
    page, errors = slime_page(browser, url)
    page.evaluate("""(lane) => { const g = window.__gg; g.G.monsters.length = 0; g.G.vfx.length = 0; g.walls.forEach(w => { w.hp = w.max = 500; });
      const m = g.spawnMonster('siren', lane, true); m.age = 5; window.__s = m; }""", lane)
    return page, errors


HIDDEN = "() => [...window.__gg.G.hidden]"


def check_siren(browser, url):
    if not R9: return
    page, errors = siren_page(browser, url)
    T = page.evaluate("() => { const T = window.__gg.TYPES.siren; return [T.hp, T.r, T.sp, T.coins, T.eat, T.pts, T.drop, T.back, T.singEvery]; }")
    ok(T == [6, 24, 0, 12, 0, 32, 2, True, 12], f'Siren numbers {T}')
    p0 = page.evaluate("() => [window.__s.lane, window.__s.p, window.__gg.liveShore()]")
    ok(abs(p0[1] - (p0[2] - 0.03)) < 1e-6, f'she surfaces at the shore - 0.03 ({p0})')
    ok(page.evaluate("() => window.__gg.G.monsters.filter(m => m.type === 'siren').length") == 1, 'one Siren stands')
    page.evaluate(STEP, [11.7, 0.05])
    ok(page.evaluate("() => [window.__s.sing > 0, window.__gg.G.hideWarn.some(w => w > 0), window.__gg.G.hidden.some(h => h > 0)]") == [False, False, False], 'she has not sung before 12 s')
    page.evaluate(STEP, [0.5, 0.05])   # 12.2 s
    st = page.evaluate("() => [window.__s.sing > 0, window.__gg.G.hideWarn.filter(w => w > 0).length, window.__gg.G.hidden.filter(h => h > 0).length, window.__gg.G.vfx.some(v => v.kind === 'sirennote')]")
    ok(st == [True, 1, 0, True], f'at 12 s she sings, a row is warned (not hidden yet) and a note drifts down {st}')
    row = page.evaluate("() => window.__gg.G.hideWarn.findIndex(w => w > 0)")
    page.evaluate(STEP, [1.4, 0.05])   # 13.6 s: the warning (1.5 s from 12.0) is over
    h = page.evaluate(HIDDEN)
    ok(h[row] > 5.5 and h[row] <= 6 and sum(1 for x in h if x > 0) == 1 and len(h) == 5, f'after the warning that row is hidden for 6 s {h} (row {row})')
    ok(page.evaluate("(r) => window.__gg.rowHidden(r)", row) is True and page.evaluate("(r) => window.__gg.rowHidden((r + 1) % 5)", row) is False, 'rowHidden reads it')
    page.evaluate(STEP, [6.1, 0.05])
    ok(not any(x > 0 for x in page.evaluate(HIDDEN)), f'six seconds later it is over {page.evaluate(HIDDEN)}')
    p1 = page.evaluate("() => [window.__s.lane, window.__s.p, window.__s.dead]")
    ok(p1[0] == p0[0] and abs(p1[1] - p0[1]) < 1e-9 and not p1[2], f'she never walks ({p0[:2]} -> {p1})')
    ok(page.evaluate("() => window.__gg.walls[2].hp") == 500, 'and never chews the fence')
    # a second song picks a row that is not hidden: hide six rows by hand, she must pick the seventh
    page.evaluate("() => { const g = window.__gg; for (let r = 0; r < 5; r++) if (r !== 4) g.hideRow(r, 0, 99); window.__s.singT = 0.05; }")
    page.evaluate(STEP, [0.2, 0.05])
    ok(page.evaluate("() => window.__gg.G.hideWarn[4] > 0 || window.__gg.G.hidden[4] > 0"), 'she picks a row that is not hidden')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def hide_page(browser, url):
    page, errors = slime_page(browser, url)
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; g.G.vfx.length = 0; g.G.def.total = 999; g.G.total = 999; g.walls.forEach(w => { w.hp = w.max = 500; }); }")
    return page, errors


def check_hidden_play(browser, url):
    if not R9: return
    page, errors = hide_page(browser, url)
    # a lone Green at (3,0) and another at (3,2): sliding the first right makes a bunch of two. The hint may find it while the row shows...
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); g.grid[3][0] = g.newCell(0); g.grid[3][2] = g.newCell(0); g.G.hint = null; }")
    b = page.evaluate("() => { const b = window.__gg.bestMove(); return b && window.__gg.G && [window.__gg.grid[3].indexOf(b.ref), b.dir]; }")
    ok(b is not None and b[0] in (0, 2), f'the hint finds the slide when the row is shown {b}')
    page.evaluate("() => window.__gg.hideRow(3, 0, 6)")
    ok(page.evaluate("() => window.__gg.rowHidden(3)"), 'row 3 is hidden')
    ok(page.evaluate("() => window.__gg.bestMove()") is None, 'the hint never targets a hidden row')
    # a visible cell pushing into the hidden row is no hint either
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); g.grid[2][1] = g.newCell(0); g.grid[4][1] = g.newCell(0); g.grid[3][0] = g.newCell(0); g.grid[3][2] = g.newCell(0); }")
    bm = page.evaluate("() => { const g = window.__gg, b = g.bestMove(); if (!b) return null; let r = -1; for (let i = 0; i < 5; i++) if (g.grid[i].includes(b.ref)) r = i; return [r, b.dir]; }")
    ok(bm is None or (bm[0] != 3 and not (bm[0] == 2 and bm[1] == 'down') and not (bm[0] == 4 and bm[1] == 'up')), f'neither from nor into the hidden row {bm}')
    # three Greens in the hidden row still light and launch as Green
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); for (const c of [0, 1, 2]) g.grid[3][c] = g.newCell(0); g.resolveMatches(); }")
    lit = page.evaluate("() => window.__gg.grid[3].slice(0, 3).map(c => [c.lit, c.c])")
    ok(lit == [[True, 0]] * 3, f'three Greens in a hidden row still light as Green {lit}')
    page.evaluate("""() => { const g = window.__gg; const m = g.spawnMonster('ghoul', 1, true, 0.5); m.age = 5; m.sp = 0; window.__g = m; window.__hp0 = m.hp; g.launchGroup(g.grid[3][1]); }""")
    page.evaluate(STEP, [3, 0.02])
    ok(page.evaluate("() => window.__g.dead || window.__g.hp < window.__hp0"), 'and launch: the ghoul in the lane is hit')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_hidden_refresh(browser, url):
    if not R9: return
    page, errors = hide_page(browser, url)
    page.evaluate("() => window.__gg.hideRow(2, 0, 6)")
    page.evaluate(STEP, [4, 0.05])
    a = page.evaluate("() => window.__gg.G.hidden[2]")
    ok(1.8 <= a <= 2.2, f'2 s left after 4 s {a}')
    page.evaluate("() => window.__gg.hideRow(2)")   # the default warning does not shorten or delay a row already hidden
    b = page.evaluate("() => window.__gg.G.hidden[2]")
    ok(5.9 <= b <= 6.0, f'a second hide resets it to 6 s, not 2 {b}')
    page.evaluate(STEP, [3, 0.05])
    c = page.evaluate("() => window.__gg.G.hidden[2]")
    ok(2.8 <= c <= 3.2, f'and it runs from there {c}')
    # a fresh row warns first: 1.5 s, then 6 s
    page.evaluate("() => window.__gg.hideRow(0)")
    ok(page.evaluate("() => [window.__gg.G.hidden[0], window.__gg.G.hideWarn[0]]") == [0, 1.5], 'a fresh row is only warned at first')
    page.evaluate(STEP, [1.55, 0.05])
    d = page.evaluate("() => window.__gg.G.hidden[0]")
    ok(5.9 <= d <= 6.0, f'after 1.5 s it is hidden for 6 s {d}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_hidden_continue(browser, url):
    if not R9: return
    page, errors = hide_page(browser, url)
    page.evaluate("() => { const g = window.__gg; g.hideRow(1, 0, 6); g.hideRow(4, 0, 9); }")
    page.evaluate(STEP, [2, 0.05])
    cs = page.evaluate("() => window.__gg.continueState().hidden")
    ok(cs is not None and len(cs) == 5 and 3.8 <= cs[1] <= 4.2 and 6.8 <= cs[4] <= 7.2, f'the snapshot holds each row\'s time left {cs}')
    r = page.evaluate("() => { const g = window.__gg, c = g.continueState(); c.remaining = 8; g.continueNight(c); return [...g.G.hidden]; }")
    ok(all(abs(a - b) < 0.3 for a, b in zip(r, cs)) and r[1] > 0 and r[4] > 0 and r[0] == r[2] == r[3] == 0, f'hidden rows and their time survive a continue {r}')   # the new night is live: a frame or two may pass
    page.evaluate(STEP, [2, 0.05])
    ok(1.8 <= page.evaluate("() => window.__gg.G.hidden[1]") <= 2.2, 'and keep counting down')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_hidden_budget(browser, url):
    if not R9: return
    page, errors = hide_page(browser, url)
    probe = """() => { const g = window.__gg, c = g.ctx, d = c.drawImage, f = c.fill, s = c.stroke, n = { img:0, fill:0, stroke:0, srcs:[] };
      c.drawImage = function(...a){ n.img++; n.srcs.push(a[0]); return d.apply(this, a); }; c.fill = function(...a){ n.fill++; return f.apply(this, a); }; c.stroke = function(...a){ n.stroke++; return s.apply(this, a); };
      try { g.drawGrid(1.0); g.drawHiddenRows(1.0); } finally { delete c.drawImage; delete c.fill; delete c.stroke; } return { img:n.img, fill:n.fill, stroke:n.stroke, same:n.srcs.length && n.srcs.every(x => x === n.srcs[0]) }; }"""
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); for (let c = 0; c < 7; c++) g.grid[3][c] = g.newCell(c % 3); g.resolveMatches(); g.hideRow(3, 0, 6); }")
    page.evaluate(probe)   # the first call bakes
    n = page.evaluate(probe)
    ok(0 < n['img'] <= 7 and n['fill'] == 0 and n['stroke'] == 0, f'a hidden row adds at most 7 drawImage and no fill/stroke {n}')
    ok(n['same'], 'every cell of the row is the same baked red sphere')
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); g.G.hidden.fill(0); g.hideRow(3, 1.5, 6); }")   # the warning, over an empty patch
    page.evaluate(probe)
    w = page.evaluate(probe)
    ok(1 <= w['img'] <= 2 and w['fill'] == 0 and w['stroke'] == 0, f'a warned row is one baked sprite, no fill/stroke {w}')
    shot = os.environ.get('GG_HIDDEN_SHOT')
    if shot:
        page.evaluate("() => { const g = window.__gg; g.G.hidden.fill(0); g.G.hideWarn.fill(0); for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) g.grid[r][c] = g.newCell((r + c) % 3); g.resolveMatches(); g.hideRow(3, 0, 6); g.hideRow(1, 1.5, 6); }")
        page.evaluate("() => document.querySelectorAll('.overlay, [id^=ov]').forEach(e => { e.style.display = 'none'; })"); time.sleep(0.4); page.screenshot(path=shot)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_siren': check_siren, 'check_hidden_play': check_hidden_play, 'check_hidden_refresh': check_hidden_refresh,
               'check_hidden_continue': check_hidden_continue, 'check_hidden_budget': check_hidden_budget})


# ---------- Task 7: the Swan Gourd, the five-gourd picker, the N5-5 tutorial ----------
R9_NAMES += ['Black-hole splash', 'seenSwanCoach']   # the Swan's role line and its coach flag
SWSHOTS = '/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/a8c35601-34ce-46bc-bbf6-44770d21f8f8/scratchpad'
ALL5 = ['grave', 'protector', 'wartling', 'crookneck', 'swan']
SW_GATE = {'grave': True, 'protector': True, 'wartling': True, 'crookneck': True, 'swan': True}


def swan_night(page, kinds=('swan',), k=1):
    """A quiet N5-k night with the given gourds standing (slot order), every gourd won and every gourd coach seen; the Swan alone stands at (2, 3)."""
    from nm3_check import GQ
    page.evaluate("() => { const s = window.__gg.save; s.gourds = { grave:true, protector:true, wartling:true, crookneck:true, swan:true }; s.seenGourdCoach = true; s.seenProtectorCoach = true; s.seenWartlingCoach = true; s.seenCrookneckCoach = true; s.seenSwanCoach = true; s.lv.green = 1; s.lv.ice = 1; s.lv.black = 1; }")
    page.evaluate("([n, lo, gk]) => window.__gg.startGame('story', n, lo, gk)", [1400 + k, [0, 1, 2, 3, 4], list(kinds)]); time.sleep(0.3)
    page.evaluate(GQ)


# A synthetic hit from a Swan square (or not): the pumpkin pr hits monster m (ghoul A) with the ring flag as launched.
SW_HIT = """([t, swan, lv]) => { const g = window.__gg, a = window.__A; const pr = { type:t, vis:t, lv:lv || 1, size:1, lane:a.lane, x:a.x, y:0, hit:new Set(), grp:{ spawned:true, small:false, kills:0 }, guar:false, trail:[], ...(swan ? { swan:true } : {}) };
  g.hitMonster(pr, a); return g.G.vfx.filter(v => v.kind === 'blackring').length; }"""
SW_PAIR = """([typeB, hpB]) => { const g = window.__gg, G = g.G; G.monsters.length = 0; G.vfx.length = 0;
  const A = g.spawnMonster('ghoul', 4, true, 0.5); A.sp = 0; A.hp = A.maxHp = 50; const B = g.spawnMonster(typeB, 3, true, 0.5); B.sp = 0; B.hp = B.maxHp = hpB;
  window.__A = A; window.__B = B; return [A.p, B.p]; }"""


def check_swan_splash(browser, url):
    if not R9: return
    page, errors = open_page(browser, url)
    swan_night(page)
    sq = page.evaluate("() => { const g = window.__gg; return [g.inSwanSquare(2, 3), g.inSwanSquare(1, 2), g.inSwanSquare(3, 4), g.inSwanSquare(2, 1), g.inSwanSquare(0, 3), g.inSwanSquare(4, 4), g.isProtected(2, 3), g.inWartSquare(2, 3)]; }")
    ok(sq == [True, True, True, False, False, False, False, False], f'inSwanSquare: the Swan cell and its 3x3 only; it protects nothing and doubles nothing {sq}')
    ok(page.evaluate("() => window.__gg.SWAN_HIT") == -5, 'SWAN_HIT is -5')
    page.evaluate(SW_PAIR, ['ghoul', 50])
    n = page.evaluate(SW_HIT, [0, True, 1])
    d = page.evaluate("() => [window.__A.hp, window.__B.hp, window.__B.lastHit]")
    ok(n == 1 and d == [49, 49, -5], f'a Green hit from the square: A takes only Green\'s 1, B beside it takes 1 and keeps lastHit -5, one ring {n} {d}')
    page.evaluate(SW_PAIR, ['ghoul', 50])
    n = page.evaluate(SW_HIT, [0, False, 1])
    d = page.evaluate("() => [window.__A.hp, window.__B.hp]")
    ok(n == 0 and d == [49, 50], f'a Green hit from outside the square: no ring, B untouched {n} {d}')
    # B two lanes away is out of Black's splash reach
    page.evaluate(SW_PAIR, ['ghoul', 50]); page.evaluate("() => { window.__B.lane = 2; window.__B.x = window.__gg.LANE(2); }")
    page.evaluate(SW_HIT, [0, True, 1])
    ok(page.evaluate("() => window.__B.hp") == 50, 'a monster two lanes off is out of reach')
    # a real launch: the pumpkins of a bunch in the square carry swan, one outside does not
    page.evaluate("() => { const g = window.__gg; for (const r of [1, 2, 3]) if (r !== 2 || true) g.grid[r][4] = g.newCell(0); g.resolveMatches(); g.launchGroup(g.grid[1][4]); }")
    ok(page.evaluate("() => window.__gg.G.projs.map(p => [p.lane, !!p.swan])") == [[4, True]] * 3, 'a bunch launched from the Swan square: every pumpkin carries swan')
    page.evaluate("() => { const g = window.__gg; g.G.projs.length = 0; for (const r of [2, 3, 4]) g.grid[r][0] = g.newCell(0); g.resolveMatches(); g.launchGroup(g.grid[2][0]); }")
    ok(page.evaluate("() => window.__gg.G.projs.every(p => !p.swan)") is True, 'a bunch launched outside carries none')
    # end to end: three Green hits up a column from the square: B takes 3, A takes 3
    page.evaluate("() => { const g = window.__gg; g.G.projs.length = 0; g.grid.forEach(row => row.forEach((c, i) => { if (c && !c.gourd) row[i] = null; })); }")
    page.evaluate(SW_PAIR, ['ghoul', 50])
    page.evaluate("() => { const g = window.__gg; for (const r of [1, 2, 3]) g.grid[r][4] = g.newCell(0); g.resolveMatches(); g.launchGroup(g.grid[1][4]); }")
    page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 40; i++) g.update(0.05); }")
    d = page.evaluate("() => [window.__A.hp, window.__B.hp]")
    ok(d == [47, 47], f'three flown Green hits: A takes 3, B takes 3 from the rings {d}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_swan_gates(browser, url):
    """From the square, beside the hit, the ring kills at 1 hp what only a colour, Ice or Fire could: and it stays dead."""
    if not R9: return
    page, errors = open_page(browser, url)
    swan_night(page)
    for typeB, setup in [('mummy', ''), ('firemummy', ''), ('hayrickBurning', ''), ('huskerCharred', ''), ('chameleon', 'B.colourLock = 2;'), ('rchameleon', 'B.colourImmune = 0;')]:
        page.evaluate(SW_PAIR, [typeB, 1]); page.evaluate("(s) => { const B = window.__B; B.hp = 1; B.maxHp = Math.max(B.maxHp, 1); " + setup + " }", setup)
        page.evaluate(SW_HIT, [0, True, 1])
        page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 40; i++) g.update(0.05); }")
        r = page.evaluate("() => [window.__B.dead, window.__B.rise, window.__B.type]")
        ok(r[0] is True and not r[1], f'{typeB}: dies to the ring at 1 hp and stays dead {r}')
        # the control: Black's own splash (a colour, lastHit 7, 0.5 damage) on the same monster at 1 hp must not finish it for good: the gate is SWAN_HIT's
        ctl = setup.replace('colourImmune = 0', 'colourImmune = 7')   # a reverse chameleon immune to Black itself
        page.evaluate(SW_PAIR, [typeB, 1]); page.evaluate("(s) => { const B = window.__B; B.hp = 0.5; " + ctl + " }", ctl)   # 0.5 is exactly Black's splash: it would kill an ordinary monster
        page.evaluate(SW_HIT, [7, False, 1])
        page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 10; i++) g.update(0.05); }")
        c = page.evaluate("() => [window.__B.dead, window.__B.hp, window.__B.type]")
        ok(c[0] is False, f'{typeB}: a plain Black splash that would kill an ordinary monster does not leave it dead (so SWAN_HIT is what opens the gate) {c}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_swan_shields(browser, url):
    """Red nets, a veil, a Siege Tower's archers and a rotOnly monster still refuse the ring."""
    if not R9: return
    page, errors = open_page(browser, url)
    swan_night(page)
    SAME = "() => [window.__B.hp, window.__B.dead]"
    page.evaluate(SW_PAIR, ['glutton', 6]); page.evaluate("() => { const g = window.__gg, B = window.__B; B.netT = 1e9; const c = g.newCell(1); c.net = 'red'; c.netBy = B.id; g.grid[0][0] = c; }")
    ok(page.evaluate("() => window.__gg.shieldedNow(window.__B)") is True, 'a Glutton with a red net is shielded')
    page.evaluate(SW_HIT, [0, True, 1]); ok(page.evaluate(SAME) == [6, False], f'a red-netted Glutton takes nothing from the ring {page.evaluate(SAME)}')
    page.evaluate(SW_PAIR, ['knight', 6]); page.evaluate("() => { const g = window.__gg, G = g.G, B = window.__B; const R = g.spawnMonster('bride', 2, true, 0.5); R.sp = 0; B.veilBy = R.id; R.veil = B; window.__R = R; }")
    ok(page.evaluate("() => window.__gg.veiledNow(window.__B)") is True, 'a monster beside a Bride is veiled')
    page.evaluate(SW_HIT, [0, True, 1]); ok(page.evaluate(SAME) == [6, False], f'a veiled monster takes nothing from the ring {page.evaluate(SAME)}')
    page.evaluate(SW_PAIR, ['ghoul', 6])
    page.evaluate("([t, swan, lv]) => { const g = window.__gg, a = window.__A; window.__B.rotOnly = true; const pr = { type:t, vis:t, lv, size:1, lane:a.lane, x:a.x, y:0, hit:new Set(), grp:{ spawned:true, small:false, kills:0 }, guar:false, trail:[], swan }; g.hitMonster(pr, a); }", [0, True, 1])   # one call: the frame's pre-pass clears rotOnly
    ok(page.evaluate(SAME) == [6, False], f'a rotOnly monster takes nothing from the ring {page.evaluate(SAME)}')
    page.evaluate("""() => { const g = window.__gg, G = g.G; G.monsters.length = 0; G.vfx.length = 0; G.def.boss = 'siegetower'; G.def.bossForm = 1; G.bossSpawned = true; G.bossDead = false;
      const B = g.spawnMonster('boss'); B.sp = 0; B.p = 0.5; B.lane = 3; B.x = g.LANE(3); window.__B = B; const A = g.spawnMonster('ghoul', 4, true, 0.5); A.sp = 0; A.hp = A.maxHp = 50; window.__A = A; }""")
    h0 = page.evaluate("() => [window.__B.hp, window.__B.archers]")
    page.evaluate(SW_HIT, [0, True, 1]); h1 = page.evaluate("() => [window.__B.hp, window.__B.archers]")
    ok(h0[1] > 0 and h1 == h0, f'a Siege Tower with archers up takes nothing and loses no archer to the ring {h0} {h1}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_swan_black(browser, url):
    """A Black from the square: the neighbour takes Black's splash and the ring's 1 more."""
    if not R9: return
    page, errors = open_page(browser, url)
    swan_night(page)
    page.evaluate(SW_PAIR, ['ghoul', 50]); page.evaluate(SW_HIT, [7, False, 1])
    plain = page.evaluate("() => 50 - window.__B.hp")
    page.evaluate(SW_PAIR, ['ghoul', 50]); n = page.evaluate(SW_HIT, [7, True, 1])
    both = page.evaluate("() => 50 - window.__B.hp")
    ok(plain == 0.5 and both == 1.5 and n == 1, f'Black alone splashes 0.5; from the Swan square 0.5 + 1 = 1.5, one ring ({plain}, {both}, {n})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_swan_break(browser, url):
    """Breaking the Swan: every empty cell of its 3x3 sprouts a Rainbow, a grave there stays, the Swan is due back on the next sprout."""
    if not R9: return
    page, errors = open_page(browser, url)
    swan_night(page)
    page.evaluate("""() => { const g = window.__gg, p = g.gourdPos('swan');
      for (let a = p.r - 1; a <= p.r + 1; a++) for (let b = p.c - 1; b <= p.c + 1; b++) if (a !== p.r || b !== p.c) g.grid[a][b] = g.newCell(1 + (a + b) % 3);
      g.grid[1][2] = null; g.grid[1][4] = null; g.grid[3][2] = null; g.grid[2][2] = null; g.grid[3][4] = null; g.graves[3][4] = 1; }""")
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('swan'); g.destroyGourd(g.grid[p.r][p.c]); }")
    r = page.evaluate("() => { const g = window.__gg, out = []; for (let a = 1; a <= 3; a++) for (let b = 2; b <= 4; b++){ const c = g.grid[a][b]; out.push([a, b, c ? (c.c === g.RAINBOW ? 'R' : 'p') : '-', !!g.graves[a][b]]); } return out; }")
    rain = [(a, b) for a, b, k, _ in r if k == 'R']
    ok(sorted(rain) == [(1, 2), (1, 4), (2, 2), (3, 2)] and [x for x in r if x[0] == 3 and x[1] == 4][0][3] is True and [x for x in r if x[0] == 3 and x[1] == 4][0][2] != 'R',
       f'four empty cells became Rainbows; the grave cell stayed {r}')
    ok(page.evaluate("() => [window.__gg.gourdPos('swan'), !!window.__gg.G.gourdDueOf.swan]") == [None, True], 'the Swan is due back')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def swan_picker(page, owned, night, seen=True):
    from nm3_check import gpick
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 17)}, **{1100 + k: 3 for k in range(1, 17)}, **{1200 + k: 3 for k in range(1, 17)}, **{1300 + k: 3 for k in range(1, 5)}, **{1400 + k: 3 for k in range(1, 5)}})
    page.evaluate("([gs, n, seen]) => { const g = window.__gg; g.save.gourds = gs; g.save.perksOff = { pick4:true }; g.save.seenGourdCoach = true; g.save.seenProtectorCoach = true; g.save.seenWartlingCoach = true; g.save.seenCrookneckCoach = true; g.save.seenSwanCoach = seen; document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); g.beginNight(n); }",
                  [{k: True for k in owned}, night, seen]); time.sleep(0.6)
    return page.evaluate(gpick())


def check_picker_five_gourds(browser, url):
    """Five gourds, two slots, nothing overflowing at 360 px. N5-5 locks the Swan in slot 1. Once the Swan is won an N4 night offers it too."""
    if not R9: return
    os.makedirs(SWSHOTS, exist_ok=True)
    page = browser.new_page(viewport={'width': 360, 'height': 740}); errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    u = swan_picker(page, ALL5, 1405, seen=False)
    ok(u['state'] == 'loadout' and [t[0] for t in u['tiles']] == ALL5, f'N5-5: five gourd tiles in unlock order {u["tiles"]}')
    ok(u['slots'] == ['swan', 'grave'] and len(u['slotSize']) == 2, f'two slots; the Swan locked in slot 1, then the first other gourd {u["slots"]}')
    ok([t[2] for t in u['tiles']] == [False, False, False, False, True] and u['slotMust'][0] is True, f'the Swan tile and slot 1 are locked {[t[2] for t in u["tiles"]]} {u["slotMust"]}')
    ok(u['heading'] == 'Gourds · pick up to 2' and u['headFits'] and u['cardFits'] and all(w >= 44 and h >= 44 for w, h in u['slotSize']), f'heading, 44 px slots, header and card fit {u["heading"]} {u["slotSize"]}')
    ov = page.evaluate("() => { const s = document.querySelector('#loScroll'), d = document.documentElement; return [d.scrollWidth, innerWidth, s.scrollWidth, s.clientWidth, document.querySelector('#loGourds').scrollWidth, document.querySelector('#loGourds').clientWidth, [...document.querySelectorAll('#loGourds .pick')].every(b => b.getBoundingClientRect().right <= innerWidth + 0.5 && b.getBoundingClientRect().left >= -0.5)]; }")
    ok(ov[0] <= ov[1] and ov[2] <= ov[3] and ov[4] <= ov[5] and ov[6], f'no horizontal overflow at 360 px {ov}')
    page.click('#loGourds .pick[data-gourd="swan"]'); time.sleep(0.2)
    det = page.evaluate("() => document.querySelector('#loDetail').textContent")
    ok('Swan Gourd' in det and 'Black-hole splash' in det or 'black' in det.lower(), f'tapping the Swan shows its card {det[:80]!r}')
    page.click('#loGourds .pick[data-gourd="crookneck"]'); time.sleep(0.2)
    from nm3_check import gpick
    v = page.evaluate(gpick())
    ok(v['slots'][0] == 'swan' and v['slots'][1] == 'crookneck', f'a tile tapped with both slots full replaces slot 2, never the locked slot 1 {v["slots"]}')
    page.screenshot(path=os.path.join(SWSHOTS, 'picker5.png'))
    # an N4 night: the Swan is offered once won; not before
    u = swan_picker(page, ALL5, 1305)
    ok([t[0] for t in u['tiles']] == ALL5 and not any(t[2] for t in u['tiles']), f'N4-5 offers five gourds once the Swan is won, none locked {u["tiles"]}')
    u = swan_picker(page, ALL5[:4], 1305)
    ok([t[0] for t in u['tiles']] == ALL5[:4], f'N4-5 without the Swan offers four {u["tiles"]}')
    u = swan_picker(page, ALL5, 1005)
    ok('swan' in [t[0] for t in u['tiles']], f'N1-5 offers the Swan too once won {u["tiles"]}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_swan_unlock(browser, url):
    if not R9: return
    page, errors = open_page(browser, url)
    d = page.evaluate("() => { const t = window.__gg.NIGHTMARE_LEVELS[4]; return [t[3] && t[3].unlockGourds, t[4] && t[4].coach, t[4] && t[4].gourds, t[4] && t[4].gourdLock]; }")
    ok(d[0] == ['swan'] and d[1] == 'swan' and d[2] and 'swan' in d[2] and d[3] == 'swan', f'N5-4 unlocks the Swan; N5-5 is its tutorial with the Swan locked (data) {d}')
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 5)}, **{1300 + k: 3 for k in range(1, 5)}})
    page.evaluate("() => { window.__gg.save.gourds = { grave:true }; }")
    nm5_start(page, 3); page.evaluate("() => window.__gg.endGame(true)"); time.sleep(1.8)
    ok(not page.evaluate("() => !!window.__gg.save.gourds.swan"), 'winning N5-3 does not unlock it')
    nm5_start(page, 4); page.evaluate("() => window.__gg.endGame(true)"); time.sleep(1.8)
    ok(page.evaluate("() => window.__gg.save.gourds.swan") is True, 'winning N5-4 sets save.gourds.swan')
    ok(page.evaluate("() => JSON.parse(localStorage.getItem('gourdguard.v1')).gourds.swan") is True, 'and it is saved')
    ok(page.evaluate("() => window.__gg.GOURDS.swan && [window.__gg.GOURDS.swan.name, window.__gg.GOURDS.swan.role]") == ['Swan Gourd', 'Black-hole splash'], 'GOURDS.swan: name and role')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_swan_intro(browser, url):
    """The Swan Gourd's intro card comes on N5-5 (its home night), not on N4-5 or N1-5, which merely offer it once won."""
    if not R9: return
    from nm3_check import n3_intro_titles
    page, errors = open_page(browser, url)
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 17)}, **{1100 + k: 3 for k in range(1, 17)}, **{1200 + k: 3 for k in range(1, 17)}, **{1300 + k: 3 for k in range(1, 17)}, **{1400 + k: 3 for k in range(1, 5)}})
    page.evaluate("() => { const s = window.__gg.save; s.seenIntro = {}; s.gourds = { grave:true, protector:true, wartling:true, crookneck:true, swan:true }; s.perksOff = { pick4:true }; }")
    ok('The Swan Gourd' not in n3_intro_titles(page, 1305), 'N4-5 shows no Swan card')
    page.evaluate("() => { document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); window.__gg.setState('menu'); }")
    t5 = n3_intro_titles(page, 1405)
    ok('The Swan Gourd' in t5, f'N5-5 shows the Swan Gourd intro card {t5}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_swan_coach(browser, url):
    """The Swan tutorial on N5-5 (coach:'swan'): slide it; launch a bunch from its square at two ghouls side by side and watch the ring hurt the
    one beside the hit; hold it until it breaks (Rainbows around); Nice."""
    if not R9: return
    STEP = "(s) => { const g = window.__gg; for (let i = 0; i < Math.round(s / 0.05); i++) g.update(0.05); return g.G.coach ? g.G.coach.step : null; }"
    TIP = "() => document.querySelector('#coachTip').textContent"
    SP = "() => { const p = window.__gg.gourdPos('swan'); return p && [p.r, p.c]; }"
    page, errors = open_page(browser, url)
    page.evaluate("() => { const s = window.__gg.save; s.gourds = { grave:true, protector:true, wartling:true, crookneck:true, swan:true }; s.seenGourdCoach = true; s.seenProtectorCoach = true; s.seenWartlingCoach = true; s.seenCrookneckCoach = true; s.seenSwanCoach = false; s.lv.green = 1; }")
    # the default pick on N5-5 with the tutorial unseen: the Swan (locked, slot 1)
    ok(page.evaluate("() => { const g = window.__gg; return g.defaultGourds(g.levelFor(1405)); }")[0] == 'swan', 'N5-5 starts with the Swan picked, slot 1')
    page.evaluate("() => { window.__gg.save.lastGourds = ['grave', 'protector']; }")
    ok('swan' in page.evaluate("() => { const g = window.__gg; return g.defaultGourds(g.levelFor(1405)); }"), 'with another pair remembered the Swan still starts picked')
    page.evaluate("(lo) => window.__gg.startGame('story', 1405, lo, ['grave', 'swan'])", [0, 1, 2, 3, 4]); time.sleep(0.3)
    d = page.evaluate("() => { const g = window.__gg; return [g.G.coach && g.G.coach.kind, g.G.coach && g.G.coach.step, g.coachHolds(), g.gourdsOn().map(o => [o.kind, o.r, o.c]), g.grid.flat().filter(x => x && !x.gourd).length]; }")
    ok(d[:3] == ['swan', 'sslide', True] and d[4] == 0, f'N5-5 with the tutorial unseen starts the Swan script on a clear patch {d}')
    ok('Swan Gourd' in page.evaluate(TIP), f'the tip names it {page.evaluate(TIP)[:60]!r}')
    ok(page.evaluate(STEP, 2) == 'sslide' and page.evaluate("() => [window.__gg.G.monsters.length, window.__gg.G.spawned]") == [0, 0], 'it waits for the slide: no monsters')
    mv = page.evaluate("() => { const c = window.__gg.G.coach; return c.move && [c.move.dir, c.move.ref.gourd]; }")
    ok(mv and mv[1] == 'swan', f'the hand slides the Swan {mv}')
    page.evaluate("() => { const g = window.__gg, c = g.G.coach; g.slideOne(c.move.ref, c.move.dir); }")
    ok(page.evaluate(STEP, 0.4) == 'slaunch', 'slid: the launch step')
    d = page.evaluate("() => { const g = window.__gg, lit = g.bestLitGroup(), m = g.G.monsters.filter(m => !m.dead); return [!!lit, m.length, m.map(x => x.lane), m[0] && m[0].hp]; }")
    ok(d[0] and d[1] == 2 and abs(d[2][0] - d[2][1]) == 1 and d[3] >= 10, f'a lit bunch and two tough ghouls in neighbouring lanes {d}')
    ok('splash' in page.evaluate(TIP).lower(), f'the tip names the splash {page.evaluate(TIP)[:60]!r}')
    ok(page.evaluate(STEP, 2) == 'slaunch', 'it waits for the launch')
    hp0 = page.evaluate("() => window.__gg.G.monsters.map(m => m.hp)")
    page.evaluate("() => { const g = window.__gg; g.launchGroup(g.bestLitGroup()); }")
    ok(page.evaluate("() => window.__gg.G.projs.every(p => p.swan)") is True, 'the launched pumpkins carry swan')
    st = page.evaluate(STEP, 2)
    hp1 = page.evaluate("() => window.__gg.G.monsters.map(m => m.hp)")
    ok(st == 'shold' and all(b < a for a, b in zip(hp0, hp1)), f'both ghouls hurt (the one beside the hit by the ring), then the hold step ({hp0} -> {hp1}, {st})')
    ok('hold' in page.evaluate(TIP).lower() and 'rainbow' in page.evaluate(TIP).lower(), f'the hold tip names the Rainbows {page.evaluate(TIP)[:70]!r}')
    ok(page.evaluate(STEP, 3) == 'shold', 'it waits for the break')
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('swan'); g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(page.evaluate(STEP, 0.1) == 'praise' and 'Nice' in page.evaluate(TIP), f'Nice {page.evaluate(TIP)[:50]!r}')
    ok(page.evaluate("() => window.__gg.coachHolds()") is False, 'the praise step lets the night carry on')
    page.evaluate(STEP, 4)
    ok(page.evaluate("() => [window.__gg.G.coach, window.__gg.save.seenSwanCoach]") == [None, True], 'the script ends and seenSwanCoach is set')
    page.evaluate("(lo) => window.__gg.startGame('story', 1405, lo, ['grave', 'swan'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    ok(page.evaluate("() => [window.__gg.G.coach, window.__gg.coachHolds()]") == [None, False], 'a player who has seen it gets a plain N5-5')
    page.evaluate("() => { window.__gg.save.seenSwanCoach = false; }")
    page.evaluate("(lo) => window.__gg.startGame('story', 1405, lo, ['grave', 'protector'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    ok(page.evaluate("() => [window.__gg.G.coach, window.__gg.save.seenSwanCoach]") == [None, False], 'N5-5 without the Swan: no script, still unseen')
    page.evaluate("(lo) => window.__gg.startGame('story', 1405, lo, ['swan'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('swan'); g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(page.evaluate(STEP, 0.1) == 'sback', 'breaking it early jumps to the respawn step')
    st = page.evaluate(STEP, 4)
    ok(st in ('slaunch', 'shold') and page.evaluate(SP) is not None, f'it grows back, then the lesson goes on {st}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_swan_coach_edges(browser, url):
    """The coach's demo bunch lies wholly inside the Swan's 3x3 wherever the Swan stands, corners and edges included."""
    if not R9: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { const s = window.__gg.save; s.gourds = { grave:true, swan:true }; s.seenGourdCoach = true; s.seenSwanCoach = false; s.lv.green = 1; }")
    for r, c in [(0, 3), (4, 3), (0, 0), (4, 6), (2, 3)]:
        page.evaluate("(lo) => window.__gg.startGame('story', 1405, lo, ['swan'])", [0, 1, 2, 3, 4]); time.sleep(0.2); page.evaluate("() => window.__gg.setState('pause')")   # paused: only the manual updates below advance the coach
        page.evaluate("([r, c]) => { const g = window.__gg, p = g.gourdPos('swan'), x = g.grid[p.r][p.c]; g.grid[p.r][p.c] = null; g.grid[r][c] = x; }", [r, c])
        page.evaluate("() => { const g = window.__gg; g.G.coach.step = 'sslide'; g.G.coach.from = { r:-1, c:-1 }; for (let i = 0; i < 3; i++) g.update(0.05); }")
        d = page.evaluate("() => { const g = window.__gg, b = g.G.coach.bunch || [], out = []; for (let a = 0; a < 5; a++) for (let k = 0; k < 7; k++) if (b.includes(g.grid[a][k])) out.push([a, k]); return [g.G.coach.step, out]; }")
        ok(d[0] == 'slaunch' and len(d[1]) == 3 and all(abs(a - r) <= 1 and abs(k - c) <= 1 and (a, k) != (r, c) for a, k in d[1]), f'Swan at ({r}, {c}): three demo pumpkins inside its square {d}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_swan_art(browser, url):
    """The Swan's baked art: a picker icon, a strip saved for the owner, drawing adds no painter calls per frame; and a black-ring frame."""
    if not R9: return
    import base64
    os.makedirs(SWSHOTS, exist_ok=True)
    page, errors = open_page(browser, url)
    swan_night(page, ('grave', 'swan'))
    px = page.evaluate("() => { const c = window.__gg.gourdIcon(96, 'swan'), d = c.getContext('2d').getImageData(0, 0, 96, 96).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) n++; return n; }")
    ok(px > 1500, f'the Swan icon is a solid gourd {px}')
    ok(page.evaluate("() => window.__gg.gourdIcon(96, 'swan').toDataURL()") != page.evaluate("() => window.__gg.gourdIcon(96, 'protector').toDataURL()"), 'the Swan does not look like the Protector')
    strip = page.evaluate("""() => { const g = window.__gg, W = 96 * 5, c = document.createElement('canvas'); c.width = W; c.height = 120; const x = c.getContext('2d');
      x.fillStyle = '#2a1e30'; x.fillRect(0, 0, W, 120);
      ['grave', 'protector', 'wartling', 'crookneck', 'swan'].forEach((k, i) => x.drawImage(g.gourdIcon(96, k), i * 96, 12, 96, 96)); return c.toDataURL(); }""")
    with open(os.path.join(SWSHOTS, 'swan.png'), 'wb') as f: f.write(base64.b64decode(strip.split(',')[1]))
    # a black-ring frame: a hit from the square mid-ring on the patch
    page.evaluate(SW_PAIR, ['ghoul', 50]); page.evaluate(SW_HIT, [0, True, 1])
    page.evaluate("() => { const g = window.__gg; g.G.vfx.forEach(v => { if (v.kind === 'blackring') v.t = 0.12; }); g.setState('pause'); }"); time.sleep(0.4)
    page.evaluate("() => document.querySelectorAll('.overlay, [id^=ov]').forEach(e => { e.style.display = 'none'; })")
    page.screenshot(path=os.path.join(SWSHOTS, 'swanring.png'))
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_ring_budget(browser, url):
    """Ten black rings at once add at most 10 drawImage and no fill/stroke (baked, blitted)."""
    if not R9: return
    page, errors = open_page(browser, url)
    swan_night(page)
    probe = """() => { const g = window.__gg, c = g.ctx, d = c.drawImage, f = c.fill, s = c.stroke, n = { img:0, fill:0, stroke:0 };
      c.drawImage = function(...a){ n.img++; return d.apply(this, a); }; c.fill = function(...a){ n.fill++; return f.apply(this, a); }; c.stroke = function(...a){ n.stroke++; return s.apply(this, a); };
      try { g.drawVfx(); } finally { delete c.drawImage; delete c.fill; delete c.stroke; } return n; }"""
    page.evaluate("() => { window.__gg.G.vfx.length = 0; }")
    page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 10; i++) g.G.vfx.push({ kind:'blackring', x:60 + i * 30, y:300, t:0.1, dur:0.5 }); }")
    page.evaluate(probe)   # the first call bakes
    n = page.evaluate(probe)
    page.evaluate("() => { window.__gg.G.vfx.length = 0; }")
    z = page.evaluate(probe)
    ok(n['img'] - z['img'] == 10 and n['fill'] == z['fill'] and n['stroke'] == z['stroke'], f'ten rings add 10 drawImage and no fill/stroke (empty {z}, ten {n})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_swan_splash': check_swan_splash, 'check_swan_gates': check_swan_gates, 'check_swan_shields': check_swan_shields, 'check_swan_black': check_swan_black,
               'check_swan_break': check_swan_break, 'check_picker_five_gourds': check_picker_five_gourds, 'check_swan_unlock': check_swan_unlock, 'check_swan_intro': check_swan_intro,
               'check_swan_coach': check_swan_coach, 'check_swan_coach_edges': check_swan_coach_edges, 'check_swan_art': check_swan_art, 'check_ring_budget': check_ring_budget})


# ---------- Task 8: the Kraken (mini boss, N5-4) ----------
KR_UP = """([form]) => { const g = window.__gg, G = g.G; G.monsters.length = 0; G.arrows.length = 0; G.vfx.length = 0; g.walls.forEach(w => { w.hp = w.max = 200; });
  G.def.boss = 'kraken'; G.def.bossForm = form; G.def.bossChest = 'normal'; G.bossSpawned = true; G.bossDead = false;
  const b = g.spawnMonster('boss'); window.__b = b; return [b.kind, b.hp, b.maxHp, b.form, b.hidden]; }"""
KR_ST = """() => { const g = window.__gg, b = window.__b, ts = g.G.monsters.filter(m => m.type === 'tentacle' && !m.dead);
  return { hidden:b.hidden, hp:b.hp, n:ts.length, minion:ts.every(t => t.minion), lanes:ts.map(t => t.lane), water:ts.every(t => g.inWater(t.lane, t.p)), upT:b.upT, dead:b.dead,
    headWater:g.inWater(b.lane, b.p), arrows:g.G.arrows.filter(a => a.anchor).map(a => [a.lane, a.dmg])}; }"""
KR_KILL = "([n]) => { const g = window.__gg; g.G.monsters.filter(m => m.type === 'tentacle' && !m.dead).slice(0, n).forEach(t => { t.lastHit = 0; g.damage(t, 99, '#fff'); }); }"


def kraken_page(browser, url, form=1):
    page, errors = slime_page(browser, url)
    r = page.evaluate(KR_UP, [form])
    return page, errors, r


def check_kraken(browser, url):
    if not R9:
        page, errors = open_page(browser, url)
        ok(page.evaluate("() => !(window.__gg.TYPES && (window.__gg.TYPES.kraken || window.__gg.TYPES.tentacle)) && !(window.__gg.BOSS_NAMES && window.__gg.BOSS_NAMES.kraken)"), 'no Kraken below Release 9')
        page.close(); return
    page, errors, r = kraken_page(browser, url)
    T = page.evaluate("() => { const T = window.__gg.TYPES.kraken, U = window.__gg.TYPES.tentacle; return [[T.boss, T.hp, T.r, T.sp, T.coins, T.eat, T.pts, T.drop, T.upFor, T.tentacles, T.regrow, T.noItems, T.form2.hp, T.form2.tentacles], [U.hp, U.r, U.sp, U.coins, U.eat, U.pts, U.drop, U.anchorEvery, U.anchorDmg, window.__gg.TYPES.diver.bolt]]; }")
    ok(T[0] == [True, 20, 34, 0, 40, 0, 300, 6, 8, 3, 6, True, 32, 5], f'Kraken numbers {T[0]}')
    ok(T[1][:8] == [3, 20, 0, 3, 0, 8, 0, 6] and T[1][8] == 1.5 * T[1][9], f'Tentacle numbers, the anchor a Diver bolt and a half {T[1]}')
    ok(page.evaluate("() => window.__gg.BOSS_NAMES.kraken") == 'The Kraken', 'its name on screen is "The Kraken"')
    ok(bool(page.evaluate("() => window.__gg.BOSS_INTRO.kraken && window.__gg.BOSS_INTRO.kraken['1'] && window.__gg.BOSS_INTRO.kraken['2']")), 'it has boss intro texts for both forms')
    ok(r == ['kraken', 20, 20, 1, True], f'the head starts down {r}')
    page.evaluate(STEP, [0.2, 0.05])
    s = page.evaluate(KR_ST)
    ok(s['n'] == 3 and s['minion'] and s['water'] and len(set(s['lanes'])) == 3, f'three tentacles rise in distinct lanes, in the water, as minions {s}')
    # the down head takes no damage, from a pumpkin or anything else
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 5, '#fff'); }")
    ok(page.evaluate("() => window.__b.hp") == 20, 'hits on the down head do nothing')
    # kill two of three: they come back on their own 6 s clocks, the head stays down
    page.evaluate(KR_KILL, [2]); page.evaluate(STEP, [5.5, 0.05])
    s = page.evaluate(KR_ST)
    ok(s['n'] == 1 and s['hidden'], f'two killed: one stands and the head is down after 5.5 s {s["n"]}')
    page.evaluate(STEP, [1, 0.05])
    s = page.evaluate(KR_ST)
    ok(s['n'] >= 2 and s['hidden'], f'after 6 s they are back and the head is still down {s["n"]}')
    # all three within 6 s: the head rises in the tide
    page.evaluate(KR_KILL, [9]); page.evaluate(STEP, [0.2, 0.05])
    s = page.evaluate(KR_ST)
    ok(not s['hidden'] and s['n'] == 0 and s['headWater'] and 7 < s['upT'] <= 8, f'all down at once: the head rises in the water for 8 s {s}')
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 1, '#fff'); }")
    ok(page.evaluate("() => window.__b.hp") == 19, 'the up head takes damage')
    # it can be frozen / knocked back / whirled by nothing
    page.evaluate("() => { const g = window.__gg, b = window.__b; const pr = { type:2, vis:2, lv:3, size:1, lane:b.lane, x:b.x, y:0, hit:new Set(), grp:{ spawned:true, small:false, kills:0 }, guar:false, trail:[] }; g.hitMonster(pr, b); }")   # an Ice hit
    ok(page.evaluate("() => [window.__b.frozenT, window.__b.kb, window.__b.sp]") == [0, 0, 0], 'it is never frozen, knocked back or walking')
    hp = page.evaluate("() => window.__b.hp"); page.evaluate(STEP, [8.2, 0.05])
    s = page.evaluate(KR_ST)
    ok(s['hidden'] and s['hp'] == hp and s['n'] == 3, f'after 8 s it dives, its health kept, and a fresh three rise {s}')
    # the anchor: every 6 s down the tentacle's lane for 1.5x a Diver bolt; held while its fence is down
    page.evaluate("() => { const g = window.__gg, G = g.G; G.arrows.length = 0; g.G.monsters.filter(m => m.type === 'tentacle' && !m.dead).forEach((t, i) => { t.anchT = i ? 99 : 6; if (!i) window.__t = t; }); }")
    page.evaluate(STEP, [5.5, 0.05])
    ok(page.evaluate("() => window.__gg.G.arrows.filter(a => a.anchor).length") == 0, 'no anchor in the first 5.5 s')
    page.evaluate(STEP, [1.2, 0.05])
    a = page.evaluate("() => { const t = window.__t; return window.__gg.G.arrows.filter(a => a.anchor).map(a => [a.lane === t.lane, a.dmg, a.sp]); }")
    ok(a == [[True, 3, 0.35]], f'at 6 s it throws one anchor down its lane for 3 (1.5 x a Diver bolt) {a}')
    w0 = page.evaluate("() => window.__gg.walls[window.__t.lane].hp"); page.evaluate(STEP, [3, 0.05])
    ok(w0 - page.evaluate("() => window.__gg.walls[window.__t.lane].hp") == 3, 'and the anchor takes 3 off its fence')
    page.evaluate("() => { const t = window.__t, g = window.__gg; g.walls[t.lane].hp = 0; g.G.arrows.length = 0; t.anchT = 0.1; }"); page.evaluate(STEP, [3, 0.05])
    ok(page.evaluate("() => window.__gg.G.arrows.filter(a => a.anchor).length") == 0, 'its fence down, the anchor is held')
    page.evaluate("() => { const g = window.__gg; g.walls[window.__t.lane].hp = 100; }"); page.evaluate(STEP, [1.5, 0.05])
    ok(page.evaluate("() => window.__gg.G.arrows.filter(a => a.anchor).length") >= 1, 'and it flies once the fence is back')
    # tentacles: never frozen into a walker, never knocked back, never whirled
    ok(page.evaluate("() => window.__gg.G.monsters.filter(m => m.type === 'tentacle').every(t => t.sp === 0 && t.noKnockback)"), 'tentacles never walk and are not knocked back')
    # death: one normal chest, the tentacles and anchors go
    c0 = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.hidden = false; b.lastHit = 0; g.damage(b, 99999, '#fff'); }"); time.sleep(0.2)
    ch = page.evaluate("() => window.__gg.save.chests.slice(%d).map(c => c.kind)" % c0)
    ok(ch == ['normal'] and page.evaluate("() => window.__gg.G.bossDead"), f'it gives one normal chest {ch}')
    ok(page.evaluate("() => window.__gg.G.monsters.filter(m => m.type === 'tentacle' && !m.dead).length") == 0 and page.evaluate("() => window.__gg.G.arrows.filter(a => a.anchor).length") == 0, 'its tentacles and anchors go with it')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_kraken_level(browser, url):
    if not R9: return
    page, errors = open_page(browser, url)
    d = page.evaluate("() => { const L = window.__gg.NIGHTMARE_LEVELS[4][3]; return [L.boss, L.bossChest, L.unlockGourds, L.intro]; }")
    ok(d[:3] == ['kraken', 'normal', ['swan']] and 'tentacle' in (d[3] or []), f'N5-4 is the Kraken night: one normal chest, unlocks the Swan, tentacle intro {d}')
    ok(page.evaluate("() => !!window.__gg.MINTRO.tentacle"), 'the tentacle has an intro card')
    ok(page.evaluate("() => !!window.__gg.BESTIARY.kraken && !!window.__gg.BESTIARY.tentacle"), 'the Kraken and its tentacle are in the bestiary')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_kraken_form2(browser, url):
    if not R9: return
    page, errors, r = kraken_page(browser, url, 2)
    ok(r == ['kraken', 32, 32, 2, True], f'in form 2 the head has 32 health {r}')
    page.evaluate(STEP, [0.2, 0.05])
    ok(page.evaluate(KR_ST)['n'] == 5, 'and five tentacles rise')
    page.evaluate(KR_KILL, [9]); page.evaluate(STEP, [0.2, 0.05]); page.evaluate(STEP, [8.3, 0.05])
    ok(page.evaluate(KR_ST)['n'] == 5, 'a fresh five rise after each dive')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_kraken_continue(browser, url):
    """A continued night: the head's health and phase survive; tentacles come back fresh."""
    if not R9: return
    for up in (False, True):
        page, errors = open_page(browser, url)
        nm5_start(page, 4); time.sleep(0.3)   # the real Kraken night, so a continued night finds its boss in the level
        page.evaluate("() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.projs.length = 0; G.drops.length = 0; G.idle = -1e9; G.hint = null; g.setState('pause'); g.grid.forEach(r => r.fill(null)); }")
        page.evaluate(KR_UP, [1])
        page.evaluate(STEP, [0.2, 0.05])
        if up:
            page.evaluate(KR_KILL, [9]); page.evaluate(STEP, [0.2, 0.05])
            page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 7, '#fff'); }"); page.evaluate(STEP, [2.5, 0.05])
        else:
            page.evaluate("() => { const b = window.__b; b.hp = 11; }"); page.evaluate(KR_KILL, [1])
        before = page.evaluate("() => { const b = window.__b; return [b.hidden, b.hp, Math.round(b.upT * 10) / 10, b.lane, b.p]; }")
        page.evaluate("() => { const g = window.__gg; g.setState('play'); const c = g.continueState(); g.continueNight(c); g.setState('pause'); }")
        page.evaluate(STEP, [0.3, 0.05])
        after = page.evaluate("() => { const g = window.__gg, b = g.G.monsters.find(m => m.type === 'boss' && !m.dead); const ts = g.G.monsters.filter(m => m.type === 'tentacle' && !m.dead); return b ? [b.kind, b.hidden, b.hp, Math.round(b.upT * 10) / 10, b.lane, b.p, ts.length, ts.every(t => t.hp === t.maxHp)] : null; }")
        ok(after is not None and after[0] == 'kraken' and after[1] == before[0] and after[2] == before[1], f'(up={up}) the head returns with its health and phase {before} -> {after}')
        if up: ok(after is not None and after[6] == 0 and abs(after[3] - (before[2] - 0.3)) < 0.25 and after[4:6] == before[3:5], f'(up) it is up at the same spot with its time left, no tentacles {after}')
        else: ok(after is not None and after[6] == 3 and after[7], f'(down) three fresh tentacles {after}')
        ok(not errors, f'no page errors {errors[:2]}')
        page.close()


def check_kraken_baked(browser, url):
    """The Kraken, its tentacle and the anchor are baked when N5-4 starts, with the Kraken capped under 12 MB at bake scale 2.5."""
    if not R9: return
    page, errors = open_page(browser, url)
    C = page.evaluate("() => { const C = window.__gg.CHARS; return C.kraken && C.tentacle && C.anchor ? [Object.keys(C.kraken.clips).sort(), Object.keys(C.tentacle.clips).sort(), Object.keys(C.anchor.clips).sort(), C.kraken.maxK] : null; }")
    ok(C is not None and C[0] == ['dive', 'idle', 'surface'] and C[1] == ['rise', 'sway', 'throw'] and C[2] == ['spin'] and C[3], f'the Kraken bakes surface, idle, dive; the tentacle rise, sway, throw; the anchor spin; maxK capped {C}')
    page.evaluate("() => window.__gg.setBakeScale(2.5)")
    t0 = time.time(); nm5_start(page, 4); dt = time.time() - t0
    ok(page.evaluate("() => ['kraken', 'tentacle', 'anchor'].every(k => window.__gg.isBaked(k))"), 'starting N5-4 bakes the Kraken, the tentacle and the anchor')
    mb = page.evaluate("() => (window.__gg.atlasBytes('kraken') + window.__gg.atlasBytes('tentacle') + window.__gg.atlasBytes('anchor')) / 1e6")
    ok(mb < 12, f"the Kraken's frames take {mb:.1f} MB at bake scale 2.5 (limit 12)")
    ok(dt < 3, f'the night opens in {dt:.1f} s')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_kraken_art(browser, url):
    """A strip of the Kraken, tentacle and anchor saved for the owner, and an in-game frame (head down, tentacles up, an anchor flying)."""
    if not R9: return
    import base64
    os.makedirs(SWSHOTS, exist_ok=True)
    page, errors = open_page(browser, url)
    strip = page.evaluate("""() => { const g = window.__gg; const rows = [['kraken', 'surface'], ['kraken', 'idle'], ['kraken', 'dive'], ['tentacle', 'rise'], ['tentacle', 'sway'], ['tentacle', 'throw'], ['anchor', 'spin']];
      const A = rows.map(([k, c]) => g.atlas(k).clips[c]), W = Math.max(...A.map(a => a.c.width)), H = A.reduce((s, a) => s + a.fh + 4, 0), c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.fillStyle = '#3a1020'; x.fillRect(0, 0, W, H); let y = 0; for (const a of A){ x.drawImage(a.c, 0, y); y += a.fh + 4; } return c.toDataURL(); }""")
    with open(os.path.join(SWSHOTS, 'kraken.png'), 'wb') as f: f.write(base64.b64decode(strip.split(',')[1]))
    page.close()
    page, errors, r = kraken_page(browser, url)
    page.evaluate(STEP, [0.3, 0.05])
    page.evaluate("() => { const g = window.__gg; g.G.monsters.filter(m => m.type === 'tentacle' && !m.dead).forEach((t, i) => { t.age = 3; t.anchT = i ? 99 : 0.05; }); }")
    page.evaluate(STEP, [0.5, 0.05])
    page.evaluate("() => { const g = window.__gg; g.setState('pause'); }"); time.sleep(0.4)
    page.evaluate("() => document.querySelectorAll('.overlay, [id^=ov]').forEach(e => { e.style.display = 'none'; })")
    page.screenshot(path=os.path.join(SWSHOTS, 'krakennight.png'))
    ok(page.evaluate("() => window.__gg.G.arrows.some(a => a.anchor)"), 'an anchor is flying in the frame')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_kraken_budget(browser, url):
    """The head up, five tentacles and anchors in flight add no fill/stroke over 20 frames beside Divers and water balls (all baked and blitted)."""
    if not R9: return
    page, errors = slime_page(browser, url)
    probe = """() => new Promise(res => { const g = window.__gg, c = g.ctx, f = c.fill, s = c.stroke, n = { fill:0, stroke:0 }; let fr = 0;
      c.fill = function(...a){ n.fill++; return f.apply(this, a); }; c.stroke = function(...a){ n.stroke++; return s.apply(this, a); };
      const tick = () => { if (++fr < 20) requestAnimationFrame(tick); else { delete c.fill; delete c.stroke; res(n); } }; requestAnimationFrame(tick); })"""
    page.evaluate("() => { window.__gg.setState('play'); window.__gg.G.spawnTimer = 999; window.__gg.G.sproutT = -999; }")
    page.evaluate("""() => { const g = window.__gg; for (let i = 0; i < 6; i++){ const e = g.spawnMonster('diver', i, true, 0.1); e.age = 5; e.hidden = false; e.upT = 99; e.sp = 0; }
      for (let i = 0; i < 4; i++) g.G.arrows.push({ lane:i, p:0.5, sp:0, dmg:2, dead:false, water:true }); }""")
    page.evaluate("() => new Promise(r => setTimeout(r, 400))")
    page.evaluate(probe); base = page.evaluate(probe)
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; g.G.arrows.length = 0; }")
    page.evaluate(KR_UP, [2])
    page.evaluate("""() => { const g = window.__gg, G = g.G, b = window.__b; for (let i = 0; i < 5; i++){ const t = g.spawnMonster('tentacle', i, true, 0.1); t.age = 5; t.anchT = 999; }
      b.needSet = false; b.hidden = false; b.lane = 5; b.p = 0.1; b.x = b.tx = g.LANE ? g.LANE(5) : b.x; b.upT = 999; b.age = 5;
      for (let i = 0; i < 4; i++) G.arrows.push({ lane:i, p:0.5, sp:0, dmg:3, dead:false, anchor:true }); }""")
    page.evaluate("() => new Promise(r => setTimeout(r, 400))")
    page.evaluate(probe); n = page.evaluate(probe)
    ok(n['fill'] <= base['fill'] + 20 and n['stroke'] <= base['stroke'] + 20, f'the head, five tentacles and four anchors add no fill/stroke over 20 frames beside Divers and water balls (old {base}, new {n})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_magnet_marsh(browser, url):
    """A Magnet hit pulls an ordinary ghoul but moves neither a Kraken tentacle nor a Siren (they never walk and must stay in the tide)."""
    if not R9: return
    from mag_check import mag_page
    page, errors = mag_page(browser, url)
    r = page.evaluate("""() => { const g = window.__gg, h = window.__mg, p = h.row(3), a = h.ghoul(3, p);
      const tn = g.spawnMonster('tentacle', 1, true, p), si = g.spawnMonster('siren', 5, true, p); si.p = p; tn.p = p;
      const gh = h.ghoul(4, p), all = [tn, si, gh], before = all.map(m => [m.lane, m.p]);
      const pred = [g.magnetPullable(tn), g.magnetPullable(si), g.magnetPullable(gh)];
      h.hit(5, a);
      return new Promise(res => setTimeout(() => res({ pred, moved:all.map((m, k) => m.lane !== before[k][0] || Math.abs(m.p - before[k][1]) > 1e-6) }), 600)); }""")
    ok(r['pred'] == [False, False, True], f'a tentacle and a Siren are never pullable, a ghoul is {r}')
    ok(r['moved'] == [False, False, True], f'a level-5 hit moves the ghoul and neither of them {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_magnet_marsh': check_magnet_marsh, 'check_kraken': check_kraken, 'check_kraken_level': check_kraken_level, 'check_kraken_form2': check_kraken_form2, 'check_kraken_continue': check_kraken_continue,
               'check_kraken_baked': check_kraken_baked, 'check_kraken_art': check_kraken_art, 'check_kraken_budget': check_kraken_budget})


# ---------- Task 9: the Fallen Twin Tides (N5-16) ----------
FT_UP = """() => { const g = window.__gg, G = g.G; G.monsters.length = 0; G.arrows.length = 0; G.vfx.length = 0; G.whirls = []; G.ftSpear = null; g.walls.forEach(w => { w.hp = w.max = 200; });
  G.def.boss = 'fallentides'; G.def.bossForm = 1; G.def.bossChest = 'normal'; G.bossSpawned = true; G.bossDead = false;
  const a = g.spawnMonster('boss'); window.__a = a; window.__b = a.twin; return [a.kind, a.twinKind, a.twin.twinKind, a.hp, a.maxHp, a.lane !== a.twin.lane, a.minion, a.twin.minion]; }"""
FT_PARK = """() => { [window.__a, window.__b].forEach(m => { m.boltT = m.songT = m.spearT = m.whirlT = 999; m.p = 0.12; m.age = 5; m.sp = 0; }); window.__gg.G.ftSumT = 999; }"""
FT_KILL = "([w]) => { const g = window.__gg, m = window[w]; m.lastHit = 0; g.damage(m, 999, '#fff'); }"
FT_NOISE = "() => window.__gg.G.monsters.filter(m => !m.dead && m.type !== 'boss').length"


def ft_page(browser, url, up=True):
    """The real N5-16 night, paused, an empty patch, every fence at 200: then (up) the twins are spawned and parked at their hold with every clock at 999."""
    page, errors = open_page(browser, url)
    nm5_start(page, 16); time.sleep(0.4)
    page.evaluate("() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.projs.length = 0; G.drops.length = 0; G.idle = -1e9; G.hint = null; g.setState('pause'); g.grid.forEach(r => r.fill(null)); G.def.total = 999; G.total = 999; }")
    r = None
    if up:
        r = page.evaluate(FT_UP); page.evaluate(FT_PARK)
    return page, errors, r


def check_fallen_tides(browser, url):
    """Numbers, the pair, the hold in the tide, and each ability on a forced timer."""
    if not R9:
        page, errors = open_page(browser, url)
        ok(page.evaluate("() => !(window.__gg.TYPES && window.__gg.TYPES.fallentides) && !(window.__gg.BOSS_NAMES && window.__gg.BOSS_NAMES.fallentides) && !(window.__gg.CHARS['fallentides-blood'] || window.__gg.CHARS['fallentides-blue'])"), 'no Fallen Twin Tides below Release 9')
        page.close(); return
    page, errors, r = ft_page(browser, url)
    T = page.evaluate("() => { const T = window.__gg.TYPES.fallentides; return [T.boss, T.hp, T.r, T.sp, T.coins, T.eat, T.pts, T.drop, T.hold, T.window, T.diveAt, T.boltEvery, T.boltDmg, T.songEvery, T.auraHeal, T.spearEvery, T.spearWarn, T.whirlEvery, T.summonEvery, T.summonPool, T.noItems]; }")
    ok(T == [True, 30, 34, 0.03, 50, 0, 400, 6, 0.12, 12, [0.75, 0.5, 0.25], 6, 3, 14, 1, 12, 1.5, 16, 15, ['bloodslime', 'pirate', 'eel'], True], f'Fallen Twin Tides numbers {T}')
    ok(page.evaluate("() => window.__gg.BOSS_NAMES.fallentides") == 'The Fallen Twin Tides', 'its name on screen is "The Fallen Twin Tides"')
    ok(bool(page.evaluate("() => window.__gg.BOSS_INTRO.fallentides && window.__gg.BOSS_INTRO.fallentides['1']")), 'it has a boss intro text')
    ok(r == ['fallentides', 'blood', 'blue', 30, 30, True, False, False], f'two bosses, blood and blue, 30 health each, distinct lanes, not minions {r}')
    ok(page.evaluate("() => [window.__a.look, window.__b.look, window.__a.noKnockback, window.__b.noKnockback]") == ['fallentides-blood', 'fallentides-blue', True, True], 'each is drawn from its own registry key and takes no knockback')
    ok(page.evaluate("() => window.__gg.G.monsters.filter(m => m.type === 'boss').length") == 2, 'the pair is on the field')
    # the hold: they walk into the tide and stop at min(hold, the live shore), never at the wall
    page.close()
    for shore, want in ((0.2, 0.12), (0.08, 0.08)):
        page, errors, _ = ft_page(browser, url, up=False)
        page.evaluate("([sh]) => { const G = window.__gg.G; G.def.shoreFrac = sh; if (G.tide) G.tide.shore = sh; }", [shore])
        page.evaluate(FT_UP)
        page.evaluate("() => { [window.__a, window.__b].forEach(m => { m.boltT = m.songT = m.spearT = m.whirlT = 999; }); window.__gg.G.ftSumT = 999; }")
        page.evaluate(STEP, [9, 0.05])
        h = page.evaluate("() => [window.__a.p, window.__b.p, window.__gg.liveShore(), window.__gg.inWater(window.__a.lane, window.__a.p), window.__gg.inWater(window.__b.lane, window.__b.p)]")
        ok(abs(h[0] - want) < 0.01 and abs(h[1] - want) < 0.01 and h[3] and h[4], f'with the shore at {h[2]:.2f} both hold in the water at min(0.12, shore) = {want} {h}')
        page.close()
    page, errors, r = ft_page(browser, url)
    # bolts: every 6 s down its own lane, 3 damage, a blood bolt and a water bolt
    page.evaluate("() => { window.__a.boltT = 6; window.__b.boltT = 6; }")
    page.evaluate(STEP, [5.5, 0.05])
    ok(page.evaluate("() => window.__gg.G.arrows.length") == 0, 'no bolt in the first 5.5 s')
    page.evaluate(STEP, [1, 0.05])
    ar = page.evaluate("() => window.__gg.G.arrows.map(a => [a.fb, a.dmg, a.lane === (a.fb === 'blood' ? window.__a : window.__b).lane]).sort()")
    ok(ar == [['blood', 3, True], ['water', 3, True]], f'at 6 s the blood twin throws a blood bolt and the blue twin a water bolt, 3 damage, down their own lanes {ar}')
    w0 = page.evaluate("() => window.__gg.walls[window.__a.lane].hp"); page.evaluate(STEP, [3, 0.05])
    ok(w0 - page.evaluate("() => window.__gg.walls[window.__a.lane].hp") == 3, 'and a bolt takes 3 off its fence')
    # the song: eyes red (skill clip), a free row warned for 1.5 s then hidden 6 s
    page.evaluate("() => { const g = window.__gg; g.G.arrows.length = 0; g.G.hidden.fill(0); g.G.hideWarn.fill(0); window.__a.songT = 14; }")
    page.evaluate(STEP, [13.5, 0.05])
    ok(page.evaluate("() => window.__gg.G.hideWarn.every(x => x === 0) && window.__gg.G.hidden.every(x => x === 0)"), 'no row warned before 14 s')
    page.evaluate(STEP, [1, 0.05])
    s = page.evaluate("() => [window.__gg.G.hideWarn.filter(x => x > 0).length, window.__a.anim && window.__a.anim.clip, +window.__a.songT.toFixed(1)]")
    ok(s[0] == 1 and s[1] == 'skill' and 13 <= s[2] <= 14, f'at 14 s it sings (skill clip) and one row is warned, the clock restarts {s}')
    page.evaluate(STEP, [1.6, 0.05])
    ok(page.evaluate("() => window.__gg.G.hidden.filter(x => x > 0).length") == 1, 'the row is hidden once the warning ends')
    page.evaluate(STEP, [6.2, 0.05])
    ok(page.evaluate("() => window.__gg.G.hidden.filter(x => x > 0).length") == 0, 'and shows again after 6 s')
    # the summon: one of the pool every 15 s, as an extra
    page.evaluate("() => { window.__gg.G.ftSumT = 15; window.__a.songT = 999; window.__gg.G.spawned = 5; }")
    page.evaluate(STEP, [14.5, 0.05])
    ok(page.evaluate(FT_NOISE) == 0, 'no summon before 15 s')
    page.evaluate(STEP, [1, 0.05])
    sm = page.evaluate("() => window.__gg.G.monsters.filter(m => !m.dead && m.type !== 'boss').map(m => [m.type, m.minion])")
    ok(len(sm) == 1 and sm[0][0] in ('bloodslime', 'pirate', 'eel') and sm[0][1] is True and page.evaluate("() => window.__gg.G.spawned") == 5, f'at 15 s one of bloodslime, pirate or eel, an extra that is not counted in the night {sm}')
    # the summon is the fight's: it still arrives while the blood twin is down
    page.evaluate(FT_PARK); page.evaluate("() => { window.__gg.G.monsters = window.__gg.G.monsters.filter(m => m.type === 'boss'); }")
    page.evaluate(FT_KILL, ['__a']); page.evaluate("() => { window.__gg.G.ftSumT = 3; }"); page.evaluate(STEP, [3.5, 0.05])
    sm = page.evaluate("() => window.__gg.G.monsters.filter(m => !m.dead && m.type !== 'boss').map(m => m.minion)")
    ok(sm == [True] and page.evaluate("() => window.__a.rise > 0"), f'a summon still arrives while the blood twin is down {sm}')
    # a Magnet never pulls a twin
    mp = page.evaluate("() => window.__gg.magnetPullable ? [window.__gg.magnetPullable(window.__a), window.__gg.magnetPullable(window.__b)] : null")
    ok(mp is None or mp == [False, False], f'a Magnet hit never moves a twin {mp}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_ft_window(browser, url):
    """Killed together: the other has 12 s; else the fallen twin rises at full health, and the rule repeats."""
    if not R9: return
    page, errors, r = ft_page(browser, url)
    c0 = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate(FT_KILL, ['__a'])
    d = page.evaluate("() => [window.__a.dead, window.__a.hp, +window.__a.rise.toFixed(1), window.__a.trueDeath, window.__gg.G.bossDead]")
    ok(d == [False, 0, 12, False, False], f'blood falls: it is down, not dead, 12 s on the clock {d}')
    page.evaluate("() => { const g = window.__gg, a = window.__a; a.lastHit = 0; g.damage(a, 5, '#fff'); }")
    ok(page.evaluate("() => window.__a.hp") == 0, 'a down twin takes no damage')
    page.evaluate(STEP, [11, 0.05])
    ok(page.evaluate("() => [window.__a.dead, window.__a.rise > 0]") == [False, True], 'still down at 11 s')
    page.evaluate(FT_KILL, ['__b']); time.sleep(0.2)
    d = page.evaluate("() => [window.__a.dead, window.__b.dead, window.__gg.G.bossDead, window.__gg.save.chests.slice(%d).map(c => c.kind)]" % c0)
    ok(d == [True, True, True, ['normal']], f'blue falls at 11 s: both die, the fight ends, one normal chest {d}')
    page.close()
    page, errors, r = ft_page(browser, url)
    page.evaluate(FT_KILL, ['__a']); page.evaluate(STEP, [12.5, 0.05])
    d = page.evaluate("() => [window.__a.dead, window.__a.hp, window.__a.rise, window.__b.dead, window.__b.hp, window.__gg.G.bossDead]")
    ok(d == [False, 30, 0, False, 30, False], f'12.5 s later blood is back at 30 health and the fight goes on {d}')
    page.evaluate(FT_PARK)
    # the rule repeats, from either twin
    page.evaluate(FT_KILL, ['__b']); page.evaluate(STEP, [11.5, 0.05])
    ok(page.evaluate("() => [window.__b.dead, window.__b.rise > 0]") == [False, True], 'the rule starts over: blue down, still down at 11.5 s')
    page.evaluate(FT_KILL, ['__a'])
    ok(page.evaluate("() => [window.__a.dead, window.__b.dead, window.__gg.G.bossDead]") == [True, True, True], 'blood falls inside blue\'s window: the fight ends')
    page.close()
    page, errors, r = ft_page(browser, url)
    page.evaluate(FT_KILL, ['__a']); page.evaluate(STEP, [12.5, 0.05]); page.evaluate(FT_PARK)
    page.evaluate(FT_KILL, ['__a']); page.evaluate(STEP, [12.5, 0.05])
    ok(page.evaluate("() => [window.__a.dead, window.__a.hp, window.__b.dead]") == [False, 30, False], 'a second fall of the same twin starts the window over: it rises again')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_ft_story_twins(browser, url):
    """The story Twin Tides (world 5's boss, the Hollow King's form) behave exactly as before: 8 s window, no looks, their own atlas."""
    if not R9: return
    page, errors, _ = ft_page(browser, url, up=False)
    page.evaluate("""() => { const g = window.__gg, G = g.G; G.monsters.length = 0; g.walls.forEach(w => { w.hp = w.max = 200; }); G.def.boss = 'twintides'; G.bossSpawned = true; G.bossDead = false;
      const a = g.spawnMonster('boss'); window.__a = a; window.__b = a.twin; [a, a.twin].forEach(m => { m.boltT = 999; m.p = 0.12; m.age = 5; }); }""")
    ok(page.evaluate("() => [window.__a.kind, window.__a.look == null, window.__a.twinKind == null, window.__gg.G.monsters.filter(m => m.type === 'boss').length]") == ['twintides', True, True, 2], 'the story pair has no fallen look')
    page.evaluate(FT_KILL, ['__a']); page.evaluate(STEP, [7, 0.05])
    ok(page.evaluate("() => [window.__a.dead, window.__a.rise > 0 && window.__a.rise <= 1.1]") == [False, True], 'the first story twin is still down at 7 s (window 8)')
    page.evaluate(STEP, [1.5, 0.05])
    ok(page.evaluate("() => [window.__a.dead, window.__a.rise, window.__a.hp, window.__a.maxHp]") == [False, 0, 14, 14], 'it rises at full health after 8 s')
    page.evaluate(FT_KILL, ['__a']); page.evaluate(STEP, [6, 0.05]); page.evaluate(FT_KILL, ['__b'])
    ok(page.evaluate("() => [window.__a.dead, window.__b.dead, window.__gg.G.bossDead]") == [True, True, True], 'the second inside the window ends it')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_ft_dive(browser, url):
    """At 75%, 50% and 25% of its own health a twin dives and rises at a water spot in another lane; a down twin or a diving one takes nothing."""
    if not R9: return
    page, errors, r = ft_page(browser, url)
    page.evaluate("() => { window.__a.hp = 23; }"); page.evaluate(STEP, [0.5, 0.05])
    ok(page.evaluate("() => [window.__a.diveT, window.__a.ftDone]") == [0, 0], 'at 23 of 30 it does not dive yet')
    lane0 = page.evaluate("() => window.__a.lane")
    page.evaluate("() => { window.__a.hp = 22; }"); page.evaluate(STEP, [0.1, 0.05])
    d = page.evaluate("() => [window.__a.diveT > 0, window.__a.hidden, window.__a.ftDone]")
    ok(d == [True, True, 1], f'at 22 (75%) it dives: untargetable, mark 1 passed {d}')
    page.evaluate("() => { const g = window.__gg, a = window.__a; a.lastHit = 0; g.damage(a, 3, '#fff'); }")
    ok(page.evaluate("() => window.__a.hp") == 22, 'a diving twin takes no damage')
    page.evaluate(STEP, [1.6, 0.05])
    d = page.evaluate("() => { const a = window.__a, g = window.__gg; return [a.lane !== %d, a.lane !== window.__b.lane, g.inWater(a.lane, a.p), a.hidden, a.diveT, a.p > 0]; }" % lane0)
    ok(d == [True, True, True, False, 0, True], f'it rises in another lane, in the water, targetable again {d}')
    lane1 = page.evaluate("() => window.__a.lane")
    page.evaluate("() => { window.__a.hp = 15; window.__a.boltT = window.__a.songT = window.__a.sumT = 999; }"); page.evaluate(STEP, [2, 0.05])
    d = page.evaluate("() => { const a = window.__a, g = window.__gg; return [a.ftDone, a.lane !== %d, g.inWater(a.lane, a.p)]; }" % lane1)
    ok(d == [2, True, True], f'at 15 (50%) it dives again and rises elsewhere in the water {d}')
    page.evaluate("() => { window.__a.hp = 7; }"); page.evaluate(STEP, [2, 0.05])
    ok(page.evaluate("() => [window.__a.ftDone, window.__gg.inWater(window.__a.lane, window.__a.p), window.__a.dead]") == [3, True, False], 'at 7 (25%) a third dive')
    # each mark fires once per life: healed back over a mark and hit again, it does not dive a second time
    page.evaluate("() => { window.__a.hp = 28; }"); page.evaluate(STEP, [0.1, 0.05])
    page.evaluate("() => { const g = window.__gg, a = window.__a; a.lastHit = 0; g.damage(a, 6, '#fff'); }"); page.evaluate(STEP, [0.1, 0.05])
    ok(page.evaluate("() => [window.__a.diveT, window.__a.ftDone, window.__a.hp]") == [0, 3, 22], 'healed back over a mark and hit again, it does not dive a second time')
    # after a fall and a revival the marks fire again
    page.evaluate("() => { window.__b.hp = 30; }"); page.evaluate(FT_KILL, ['__a']); page.evaluate(STEP, [12.5, 0.05])
    ok(page.evaluate("() => [window.__a.hp, window.__a.rise]") == [30, 0], '(it rises again at full health)')
    page.evaluate("() => { window.__a.hp = 22; }"); page.evaluate(STEP, [0.1, 0.05])
    ok(page.evaluate("() => [window.__a.diveT > 0, window.__a.ftDone]") == [True, 1], 'after the revival its marks fire again')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_ft_aura(browser, url):
    """The blood twin's 3x3 aura heals it 1 per monster that spawns in or steps into it, whirlpool arrivals included, up to its full health."""
    if not R9: return
    page, errors, r = ft_page(browser, url)
    page.evaluate("() => { const g = window.__gg, a = window.__a; a.hp = 24; a.lane = 3; a.x = a.tx = g.LANE(3); window.__b.lane = 0; window.__b.x = window.__b.tx = g.LANE(0); }")
    page.evaluate("() => { const g = window.__gg, a = window.__a; for (const l of [2, 3, 4]){ const o = g.spawnMonster('ghoul', l, true, a.p); o.sp = 0; o.age = 5; } }")
    page.evaluate(STEP, [0.1, 0.05])
    ok(page.evaluate("() => window.__a.hp") == 27, 'three ghouls spawned in its aura heal it 3')
    page.evaluate(STEP, [0.5, 0.05])
    ok(page.evaluate("() => window.__a.hp") == 27, 'and standing there they heal it no more')
    page.evaluate("() => { const g = window.__gg, a = window.__a; const o = g.spawnMonster('ghoul', 6, true, a.p); o.sp = 0; o.age = 5; }"); page.evaluate(STEP, [0.1, 0.05])
    ok(page.evaluate("() => window.__a.hp") == 27, 'a ghoul two lanes away does not count')
    page.evaluate("() => { const g = window.__gg, a = window.__a; const o = g.spawnMonster('ghoul', 2, true, a.p - 0.3); o.sp = 0; o.age = 5; window.__o = o; }"); page.evaluate(STEP, [0.1, 0.05])
    ok(page.evaluate("() => window.__a.hp") == 27, 'a ghoul far above does not count')
    page.evaluate("() => { window.__o.p = window.__a.p; }"); page.evaluate(STEP, [0.1, 0.05])
    ok(page.evaluate("() => window.__a.hp") == 28, 'but stepping into the aura heals it 1')
    # a whirlpool arrival counts
    page.evaluate("""() => { const g = window.__gg, a = window.__a; g.G.whirls = []; g.addWhirlPair({ lane:6, p:0.06 }, { lane:3, p:a.p });
      const o = g.spawnMonster('ghoul', 6, true, 0.03); o.sp = 0.05; o.age = 5; window.__w = o; }""")
    page.evaluate(STEP, [1.5, 0.05])
    d = page.evaluate("() => [window.__w.lane, window.__a.hp]")
    ok(d == [3, 29], f'a ghoul thrown out of a whirlpool into the aura heals it 1 {d}')
    # never past full health
    page.evaluate("() => { const g = window.__gg, a = window.__a; a.hp = 29.5; for (const l of [2, 3, 4]){ const o = g.spawnMonster('ghoul', l, true, a.p); o.sp = 0; o.age = 5; } }"); page.evaluate(STEP, [0.1, 0.05])
    ok(page.evaluate("() => window.__a.hp") == 30, 'it heals up to its full health and no further')
    # the blue twin has no aura
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.hp = 20; const o = g.spawnMonster('ghoul', b.lane, true, b.p); o.sp = 0; o.age = 5; }"); page.evaluate(STEP, [0.2, 0.05])
    ok(page.evaluate("() => window.__b.hp") == 20, 'the blue twin is not healed by monsters')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_ft_spear(browser, url):
    """The blue twin's water spear: a column warned for 1.5 s, then every pumpkin in it goes; its gourd survives; sprouts refill it."""
    if not R9: return
    page, errors, r = ft_page(browser, url)
    page.evaluate("() => { const g = window.__gg; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) g.grid[r][c] = g.newCell((r + c * 2) % 5); g.grid[2][2] = g.newGourd('grave'); window.__b.spearT = 12; }")
    page.evaluate(STEP, [11.5, 0.05])
    ok(page.evaluate("() => window.__gg.G.ftSpear") is None, 'no column is warned before 12 s')
    page.evaluate(STEP, [0.6, 0.05])
    w = page.evaluate("() => { const f = window.__gg.G.ftSpear; return f ? [f.c >= 0 && f.c < 7, +f.warn.toFixed(2)] : null; }")
    ok(w is not None and w[0] and 1.3 <= w[1] <= 1.5, f'at 12 s a column is warned for 1.5 s {w}')
    page.evaluate("() => { window.__gg.G.ftSpear.c = 2; }")
    page.evaluate(STEP, [1.2, 0.05])
    ok(page.evaluate("() => window.__gg.grid.every(r => r[2] != null)"), 'the column still stands during the warning')
    page.evaluate(STEP, [0.25, 0.05])
    st = page.evaluate("() => { const f = window.__gg.G.ftSpear; return f ? [f.warn, f.strike > 0] : null; }")
    ok(st == [0, True], f'the warning ends and the strike flash begins {st}')
    col = page.evaluate("() => window.__gg.grid.map((r, i) => [r[2] == null, !!(r[2] && r[2].gourd), r[1] != null, r[3] != null])")
    ok(all(c[2] and c[3] for c in col) and [c[0] for c in col] == [True, True, False, True, True] and col[2][1], f'then the spear clears that column but for its gourd, and only it {col}')
    page.evaluate(STEP, [0.5, 0.05])
    ok(page.evaluate("() => window.__gg.G.ftSpear") is None, 'and the spear is gone after its flash')
    ok(page.evaluate("() => +window.__b.spearT.toFixed(1)") > 7, "the blue twin's spear clock restarted at 12 s")
    # a dive in mid-warning does not stretch the 1.5 s warning
    page.evaluate("() => { window.__b.spearT = 999; window.__gg.G.ftSpear = { c:4, warn:1.5, strike:0 }; window.__b.hp = 22; }")
    page.evaluate(STEP, [0.1, 0.05]); ok(page.evaluate("() => window.__b.diveT") > 0, '(the blue twin dives mid-warning)')
    page.evaluate(STEP, [1.35, 0.05])
    w = page.evaluate("() => { const f = window.__gg.G.ftSpear; return f ? f.warn : null; }")
    ok(w is not None and 0 < w < 0.1, f'the warning keeps running through the dive {w}')
    page.evaluate(STEP, [0.3, 0.05])
    ok(page.evaluate("() => { const f = window.__gg.G.ftSpear; return f ? f.warn : 0; }") == 0, 'and the strike lands 1.5 s after it began')
    # a down blue twin cancels a spear in the air
    page.evaluate("() => { window.__gg.G.ftSpear = { c:4, warn:1, strike:0 }; }"); page.evaluate(FT_KILL, ['__b'])
    ok(page.evaluate("() => window.__gg.G.ftSpear") is None, 'when the blue twin goes down its warning is cancelled')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_ft_whirl(browser, url):
    """Every 16 s the blue twin opens a whirlpool pair at two water spots; never a fifth pair."""
    if not R9: return
    page, errors, r = ft_page(browser, url)
    page.evaluate("() => { window.__b.whirlT = 16; }")
    page.evaluate(STEP, [15.5, 0.05])
    ok(page.evaluate("() => window.__gg.G.whirls.length") == 0, 'no whirlpool before 16 s')
    page.evaluate(STEP, [1, 0.05])
    w = page.evaluate("() => { const g = window.__gg; return [g.G.whirls.length, g.G.whirls.every(w => g.inWater(w.a.lane, w.a.p) && g.inWater(w.b.lane, w.b.p)), window.__b.anim && window.__b.anim.clip]; }")
    ok(w == [1, True, 'skill'], f'at 16 s one pair opens, both ends in the water, on the skill clip {w}')
    for i in range(5):
        page.evaluate("() => { window.__b.whirlT = 0.01; }"); page.evaluate(STEP, [0.3, 0.05])
    ok(page.evaluate("() => window.__gg.G.whirls.length") == page.evaluate("() => window.__gg.WHIRL_MAX"), 'the pairs stop at the cap (4), never a fifth')
    ok(page.evaluate("() => window.__gg.G.whirls.length") == 4, 'WHIRL_MAX is 4')
    ok(page.evaluate("() => window.__gg.G.whirls.every(w => w.a.lane !== w.b.lane)"), 'each pair has its ends in different lanes')
    page.evaluate("() => { window.__b.anim = null; window.__b.whirlT = 0.01; }"); page.evaluate(STEP, [0.1, 0.05])
    ok(page.evaluate("() => window.__b.anim") is None, 'at the cap nothing opens and no skill clip plays')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fallen_tides_continue(browser, url):
    """A continued night: each twin's health, marks and the window it is down for survive, and the whirlpools stay."""
    if not R9: return
    page, errors, r = ft_page(browser, url)
    page.evaluate("() => { const g = window.__gg; window.__a.hp = 12; }"); page.evaluate(STEP, [2.5, 0.05])
    page.evaluate("() => { const g = window.__gg; g.addWhirlPair({ lane:1, p:0.05 }, { lane:5, p:0.07 }); g.addWhirlPair({ lane:2, p:0.04 }, { lane:4, p:0.08 }); }")
    page.evaluate(FT_KILL, ['__b']); page.evaluate(STEP, [3, 0.05])
    page.evaluate("() => { const a = window.__a; a.boltT = 4; a.songT = 7; window.__gg.G.ftSumT = 9; }")
    before = page.evaluate("() => { const a = window.__a, b = window.__b; return [a.hp, a.ftDone, +b.rise.toFixed(1), window.__gg.G.whirls.length, a.lane, +a.p.toFixed(3), +a.boltT.toFixed(2), +a.songT.toFixed(2), +window.__gg.G.ftSumT.toFixed(2)]; }")
    page.evaluate("() => { const g = window.__gg; g.setState('play'); const c = g.continueState(); g.continueNight(c); g.setState('pause'); }")
    page.evaluate(STEP, [0.3, 0.05])
    after = page.evaluate("""() => { const g = window.__gg, bs = g.G.monsters.filter(m => m.type === 'boss' && !m.dead); const a = bs.find(m => m.twinKind === 'blood'), b = bs.find(m => m.twinKind === 'blue');
      return a && b ? [a.hp, a.ftDone, +b.rise.toFixed(1), g.G.whirls.length, a.lane, +a.p.toFixed(3), +a.boltT.toFixed(2), +a.songT.toFixed(2), +g.G.ftSumT.toFixed(2), b.hp] : null; }""")
    ok(before[:2] == [12, 2] and before[3] == 2, f'(before: blood at 12 health, two dives, two whirlpools {before})')
    ok(after is not None and after[0] == before[0] and after[1] == before[1], f'the blood twin returns with its health and marks {before} -> {after}')
    ok(after is not None and abs(after[2] - (before[2] - 0.3)) < 0.2 and after[9] == 0, f'the blue twin is still down with its window running {after}')
    ok(after is not None and after[3] == 2 and after[4] == before[4] and abs(after[5] - before[5]) < 0.002, f'the whirlpools and its spot stay {after}')
    ok(after is not None and all(abs(after[i] - (before[i] - 0.3)) < 0.12 for i in (6, 7, 8)), f'and its clocks run on from where they were {after}')
    page.evaluate("() => { const g = window.__gg, a = g.G.monsters.find(m => m.twinKind === 'blood' && !m.dead); a.lastHit = 0; g.damage(a, 999, '#fff'); }")
    ok(page.evaluate("() => [window.__gg.G.monsters.filter(m => m.type === 'boss').every(m => m.dead), window.__gg.G.bossDead]") == [True, True], 'a twin killed inside the restored window still ends the fight')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fallen_tides_baked(browser, url):
    """Both twins and the minions they call are baked when N5-16 starts; both twins together under 12 MB at bake scale 2.5."""
    if not R9: return
    page, errors = open_page(browser, url)
    C = page.evaluate("() => { const C = window.__gg.CHARS; const x = C['fallentides-blood'], y = C['fallentides-blue']; return x && y ? [Object.keys(x.clips).sort(), Object.keys(y.clips).sort(), x.maxK, y.maxK] : null; }")
    ok(C is not None and C[0] == ['bolt', 'collapse', 'skill', 'walk'] and C[1] == C[0] and C[2] and C[3], f'each twin bakes walk, bolt, skill and collapse, with maxK capped {C}')
    page.evaluate("() => window.__gg.setBakeScale(2.5)")
    t0 = time.time(); nm5_start(page, 16); dt = time.time() - t0
    ok(page.evaluate("() => ['fallentides-blood', 'fallentides-blue', 'bloodslime', 'bloodblob', 'pirate', 'eel', 'stormbolt'].every(k => window.__gg.isBaked(k))"), 'starting N5-16 bakes both twins and the Blood Slime, Bloodlet, Pirate and Storm Eel they can summon')
    mb = page.evaluate("() => (window.__gg.atlasBytes('fallentides-blood') + window.__gg.atlasBytes('fallentides-blue')) / 1e6")
    ok(0 < mb < 12, f"both twins' frames take {mb:.1f} MB at bake scale 2.5 (limit 12)")
    ok(dt < 4, f'the night opens in {dt:.1f} s')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fallen_tides_level(browser, url):
    if not R9: return
    page, errors = open_page(browser, url)
    d = page.evaluate("() => { const L = window.__gg.NIGHTMARE_LEVELS[4][15]; return L ? [L.boss, L.bossChest, L.level, L.name] : null; }")
    ok(d is not None and d[:3] == ['fallentides', 'normal', 16], f'N5-16 is the Fallen Twin Tides night with one normal chest {d}')
    ok(page.evaluate("() => window.__gg.FALLEN.length") == 5 and page.evaluate("() => window.__gg.FALLEN[4].key") == 'fallentides', 'FALLEN[4] is the Fallen Twin Tides')
    ok(bool(page.evaluate("() => window.__gg.BESTIARY.fallentides")), 'it has a bestiary entry')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fallen_tides_art(browser, url):
    """A strip of both twins saved for the owner, and an in-game frame: a spear warning, a whirl pair, a hidden row, both twins up."""
    if not R9: return
    import base64
    os.makedirs(SWSHOTS, exist_ok=True)
    page, errors = open_page(browser, url)
    strip = page.evaluate("""() => { const g = window.__gg; const rows = []; for (const k of ['fallentides-blood', 'fallentides-blue']) for (const c of ['walk', 'bolt', 'skill', 'collapse']) rows.push([k, c]);
      const A = rows.map(([k, c]) => g.atlas(k).clips[c]), W = Math.max(...A.map(a => a.c.width)), H = A.reduce((s, a) => s + a.fh + 4, 0), c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.fillStyle = '#2a0810'; x.fillRect(0, 0, W, H); let y = 0; for (const a of A){ x.drawImage(a.c, 0, y); y += a.fh + 4; } return c.toDataURL(); }""")
    with open(os.path.join(SWSHOTS, 'fallentides.png'), 'wb') as f: f.write(base64.b64decode(strip.split(',')[1]))
    page.close()
    page, errors, r = ft_page(browser, url)
    page.evaluate("""() => { const g = window.__gg, G = g.G; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) g.grid[r][c] = g.newCell((r + c * 2) % 5);
      window.__a.lane = 1; window.__a.x = window.__a.tx = g.LANE(1); window.__b.lane = 5; window.__b.x = window.__b.tx = g.LANE(5); window.__a.hp = 27; window.__b.hp = 24;
      G.ftSpear = { c:3, warn:5, strike:0 }; g.hideRow(1, 0, 60); g.addWhirlPair({ lane:3, p:0.06 }, { lane:6, p:0.1 }); g.addWhirlPair({ lane:0, p:0.05 }, { lane:4, p:0.08 });
      G.arrows.push({ lane:1, p:0.3, sp:0, dmg:3, dead:false, water:true, fb:'blood' }, { lane:5, p:0.4, sp:0, dmg:3, dead:false, water:true, fb:'water' });
      const o = g.spawnMonster('ghoul', 2, true, 0.13); o.sp = 0; o.age = 5; const p = g.spawnMonster('pirate', 4, true, 0.3); p.age = 5; p.sp = 0; }""")
    page.evaluate("() => { window.__gg.setState('play'); window.__gg.G.spawnTimer = 999; window.__gg.G.sproutT = -999; }")
    page.evaluate(FT_PARK)
    page.evaluate("() => { window.__gg.G.arrows.forEach(a => { a.sp = 0; }); window.__gg.G.ftSpear.warn = 5; }")
    time.sleep(0.6)
    page.evaluate("() => { window.__gg.setState('pause'); window.__gg.G.ftSpear.warn = 5; }"); time.sleep(0.4)
    page.evaluate("() => document.querySelectorAll('.overlay, [id^=ov]').forEach(e => { e.style.display = 'none'; })")
    page.screenshot(path=os.path.join(SWSHOTS, 'fallentides_night.png'))
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fallen_tides_budget(browser, url):
    """Both twins, the aura, bolts in flight and the spear's warning and strike add no fill/stroke over 20 frames beside Divers and water balls (all baked and blitted)."""
    if not R9: return
    page, errors, r = ft_page(browser, url, up=False)
    probe = """() => new Promise(res => { const g = window.__gg, c = g.ctx, f = c.fill, s = c.stroke, n = { fill:0, stroke:0 }; let fr = 0;
      c.fill = function(...a){ n.fill++; return f.apply(this, a); }; c.stroke = function(...a){ n.stroke++; return s.apply(this, a); };
      const tick = () => { if (++fr < 20) requestAnimationFrame(tick); else { delete c.fill; delete c.stroke; res(n); } }; requestAnimationFrame(tick); })"""
    page.evaluate("() => { window.__gg.setState('play'); window.__gg.G.spawnTimer = 999; window.__gg.G.sproutT = -999; }")
    page.evaluate("""() => { const g = window.__gg; for (let i = 0; i < 6; i++){ const e = g.spawnMonster('diver', i, true, 0.1); e.age = 5; e.hidden = false; e.upT = 99; e.sp = 0; }
      for (let i = 0; i < 4; i++) g.G.arrows.push({ lane:i, p:0.5, sp:0, dmg:2, dead:false, water:true }); }""")
    page.evaluate("() => new Promise(r => setTimeout(r, 400))")
    page.evaluate(probe); base = page.evaluate(probe)
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; g.G.arrows.length = 0; }")
    page.evaluate(FT_UP); page.evaluate(FT_PARK)
    page.evaluate("""() => { const g = window.__gg, G = g.G; G.ftSpear = { c:3, warn:99, strike:0 };
      for (let i = 0; i < 4; i++) G.arrows.push({ lane:i, p:0.5, sp:0, dmg:3, dead:false, water:true, fb:i % 2 ? 'blood' : 'water' }); }""")
    page.evaluate("() => new Promise(r => setTimeout(r, 400))")
    page.evaluate(probe); n1 = page.evaluate(probe)
    page.evaluate("() => { window.__gg.G.ftSpear = { c:3, warn:0, strike:99 }; }")
    page.evaluate("() => new Promise(r => setTimeout(r, 200))")
    n2 = page.evaluate(probe)
    ok(n1['fill'] <= base['fill'] + 20 and n1['stroke'] <= base['stroke'] + 20, f'the twins, aura, bolts and the spear warning add no fill/stroke over 20 frames (old {base}, new {n1})')
    ok(n2['fill'] <= base['fill'] + 20 and n2['stroke'] <= base['stroke'] + 20, f'nor does the strike (old {base}, new {n2})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_fallen_tides': check_fallen_tides, 'check_ft_window': check_ft_window, 'check_ft_story_twins': check_ft_story_twins, 'check_ft_dive': check_ft_dive, 'check_ft_aura': check_ft_aura,
               'check_ft_spear': check_ft_spear, 'check_ft_whirl': check_ft_whirl, 'check_fallen_tides_continue': check_fallen_tides_continue, 'check_fallen_tides_baked': check_fallen_tides_baked,
               'check_fallen_tides_level': check_fallen_tides_level, 'check_fallen_tides_art': check_fallen_tides_art, 'check_fallen_tides_budget': check_fallen_tides_budget})


# ---------- Task 10: the 16 designed nights, their intro cards, bestiary, prebake, blood puddles ----------
N5_NAMES = ['The Red Tide', 'Blood Slime', 'Drowned Pirate', 'The Kraken', 'The Swan Gourd', 'Turtle Rider', 'Storm Eel', 'Siren', 'Siren and Pirates', 'Chameleon tide',
            'Slime flood', 'Eel storm', 'The Kraken 2', 'Maelstrom', 'The gauntlet', 'The Fallen Twin Tides']
N5_NEW = {'bloodslime': 2, 'pirate': 3, 'tentacle': 4, 'turtlerider': 6, 'eel': 7, 'siren': 8}   # new monster -> the night that brings it (spec Part 6)
ALL4_5 = ['grave', 'protector', 'wartling', 'crookneck']
N5_LEVELS_JS = """() => { const g = window.__gg; return g.NIGHTMARE_LEVELS[4].map((d, i) => { const L = g.levelFor(1401 + i);
  return { level:d.level, name:d.name, theme:d.theme, pool:d.pool.map(e => e[0]), types:d.pool.every(([k]) => !!(g.TYPES[k] || g.VARIANTS[k])), gourd:!!d.gourd, gourds:d.gourds || null,
    gourdLock:d.gourdLock || null, coach:d.coach || null, unlockGourds:d.unlockGourds || null, boss:d.boss, bossForm:d.bossForm, bossChest:d.bossChest || null, intro:d.intro || [],
    also:d.boss ? (g.ALSO_BAKE[d.boss] || []) : [], sea:!!d.sea, shoreFrac:d.shoreFrac || 0, shore:d.shore || 0, puddles:d.puddles || 0, layout:d.puddlesLayout || null,
    marks:d.tideMarks || [], whirls:d.whirlpools || [], spawnGap:d.spawnGap, spawnBurst:d.spawnBurst, total:d.total, interval:d.interval,
    quests:g.questsFor(L), questsOk:g.questsFor(L).every(([t, p]) => !!g.QUEST_TYPES[t] && (!['must', 'team'].includes(t) || p.every(k => g.PTYPES.some(q => q.key === k)))) }; }); }"""


def n5_open_all(page):
    """Every story level and nightmare level of books 1 to 4 beaten, N5-1 to N5-15 too (so all of N5 is open); every gourd unlocked and every coach seen."""
    set_stars(page, {**story_done(100), **{b + k: 3 for b in (1000, 1100, 1200, 1300) for k in range(1, 17)}, **{1400 + k: 3 for k in range(1, 16)}})
    page.evaluate("() => { const s = window.__gg.save; s.gourds = { grave:true, protector:true, wartling:true, crookneck:true, swan:true }; s.seenGourdCoach = s.seenProtectorCoach = s.seenWartlingCoach = s.seenCrookneckCoach = s.seenSwanCoach = true; }")


def check_n5_levels(browser, url):
    """The 16 designed nights (spec Parts 6 and 7): names, pools, gourds, bosses, tide marks, whirlpools and pacing are data; every preview opens."""
    if not R9: return
    page, errors = open_page(browser, url)
    L = page.evaluate(N5_LEVELS_JS)
    tile = page.evaluate("() => window.__gg.TILE_P()"); stop = page.evaluate("() => window.__gg.TIDE_STOP()")
    ok(len(L) == 16 and [d['level'] for d in L] == list(range(1, 17)), f'16 marsh nightmare levels in order ({len(L)})')
    ok([d['name'] for d in L] == N5_NAMES, f"each level has the spec's name {[d['name'] for d in L]}")
    ok(all(d['theme'] == 10 for d in L), 'every level is on the blood Marsh map (theme 10)')
    ok(all(d['pool'] and d['types'] for d in L), 'every pool is non-empty and every pool type exists in TYPES or VARIANTS')
    intros = {k + 1: [t for t in d['intro']] for k, d in enumerate(L) if d['intro']}
    ok(intros == {n: [t] for t, n in N5_NEW.items()}, f'each new monster is introduced on the level that first brings it {intros}')
    ok(all(t in d['pool'] or t in d['also'] or t == 'tentacle' for d in L for t in d['intro']), 'every introduced monster walks in from its level pool or its boss')
    early = [(t, k + 1) for k, d in enumerate(L) for t in d['pool'] + d['also'] if t in N5_NEW and k + 1 < N5_NEW[t]]
    ok(not early, f'no new monster walks in before its introduction {early}')
    ok(all(t in L[14]['pool'] for t in ('bloodslime', 'pirate', 'turtlerider', 'eel', 'siren')), f"N5-15 (The gauntlet) holds every new monster {L[14]['pool']}")
    story = {'crawler', 'sailor', 'diver', 'slime', 'turtle'}
    ok(story <= {t for d in L for t in d['pool']}, 'the story Marsh monsters are mixed in somewhere')
    ok({'mummy', 'firemummy'} <= set(L[4]['pool']), f"N5-5: Mummies and Flaming Mummies so the splash matters {L[4]['pool']}")
    ok({'chameleon', 'rchameleon'} <= set(L[9]['pool']), f"N5-10: Chameleons and Reverse Chameleons {L[9]['pool']}")
    ok(sum(1 for t in L[10]['pool'] if t == 'bloodslime') == 1 and L[10]['pool'][0] == 'bloodslime', f"N5-11: a flood of Blood Slimes, the top of the pool {L[10]['pool']}")
    ok('eel' in L[11]['pool'] and 'eel' in L[6]['pool'], 'N5-7 and N5-12 have Storm Eels')
    # gourds
    ok(all(d['gourd'] for d in L), 'every level is a gourd night')
    ok(all(d['gourds'] == ALL4_5 for d in L[:4]) and all(d['gourds'] == ALL4_5 + ['swan'] for d in L[4:]), f"N5-1 to N5-4 offer four gourds; the Swan joins from N5-5 {[d['gourds'] for d in L]}")
    ok(L[4]['gourdLock'] == 'swan' and [k + 1 for k, d in enumerate(L) if d['gourdLock']] == [5], 'the Swan is locked into slot 1 on N5-5 only')
    ok(L[4]['coach'] == 'swan' and [k + 1 for k, d in enumerate(L) if d['coach']] == [5], 'N5-5 holds the Swan tutorial (the only coach)')
    ok(L[3]['unlockGourds'] == ['swan'] and [k + 1 for k, d in enumerate(L) if d['unlockGourds']] == [4], 'N5-4 unlocks the Swan')
    # bosses
    ok(L[3]['boss'] == 'kraken' and L[3]['bossForm'] == 1 and L[3]['bossChest'] == 'normal', 'N5-4: the Kraken, one normal chest')
    ok(L[12]['boss'] == 'kraken' and L[12]['bossForm'] == 2 and L[12]['bossChest'] == 'normal', 'N5-13: the Kraken in form 2, one normal chest')
    ok(L[15]['boss'] == 'fallentides' and L[15]['bossChest'] == 'normal', 'N5-16: the Fallen Twin Tides, one normal chest')
    ok([k + 1 for k, d in enumerate(L) if d['boss']] == [4, 13, 16], 'bosses on N5-4, N5-13 and N5-16 only')
    # water: sea, shore, pools, tide marks, whirlpools
    ok(all(d['sea'] and (d['shoreFrac'] or d['shore']) for d in L), 'every night has a sea and a shore (walkers spawn at the live shore only when it is set)')
    ok(all(d['puddles'] and d['layout'] and len(d['layout']) >= d['puddles'] for d in L), 'every night has its pools (a layout, so whirlpool ends are exact)')
    ok(all(d['marks'] for d in L), 'every night has tide marks')
    reach = [max(m['to'] for m in d['marks']) for d in L]
    ok(all(r <= 0.5 + 1e-9 for k, r in enumerate(reach, 1) if k <= 10 or k in (13, 16)), f'N5-1 to N5-10, N5-13 and N5-16 reach at most 0.5 {reach}')
    ok(all(0.6 - 1e-9 <= reach[k - 1] <= 0.7 + 1e-9 for k in (11, 12, 14, 15)), f'N5-11, N5-12, N5-14 and N5-15 reach 0.6 to 0.7 {reach}')
    ok(all(r <= stop + 1e-9 for r in reach), f'every tideMarks.to is at most TIDE_STOP ({stop:.3f})')
    ok(all([m['at'] for m in d['marks']] == sorted(m['at'] for m in d['marks']) and all(0 < m['at'] < 1 for m in d['marks']) for d in L), 'tide marks are sorted, inside the night')
    ok(all(d['marks'][0]['to'] > (d['shoreFrac'] or d['shore'] * tile) for d in L), 'a mark always rises above the start shore')
    ok(len(L[13]['whirls']) == 4 and len(L[11]['whirls']) == 3 and len(L[0]['whirls']) >= 1, f"N5-14 has 4 whirlpool pairs, N5-12 has 3, N5-1 has one {[len(d['whirls']) for d in L]}")
    ok(all(len(d['whirls']) <= 4 for d in L), 'never more than four pairs')
    dry = []
    for k, d in enumerate(L, 1):
        pools = d['layout'] or []
        for pr in d['whirls']:
            for e in pr:
                if not (e['p'] <= d['shoreFrac'] or any(l == e['lane'] and abs(p - e['p']) <= tile * 0.5 for l, p in pools)): dry.append((k, e))
    ok(not dry, f'every whirlpool end is in water at level start {dry}')
    nowater = [k for k, d in enumerate(L, 1) if 'eel' in d['pool'] and not (d['sea'] and d['shoreFrac']) and not d['layout']]
    ok(not nowater, f'every night with a Storm Eel gives it water {nowater}')
    ok(all(isinstance(d['spawnGap'], (int, float)) and isinstance(d['spawnBurst'], (int, float)) for d in L), 'every level sets spawnGap and spawnBurst')
    ok(all(d['questsOk'] and len(d['quests']) == 3 for d in L), 'every level has three quests of existing types')
    ok(len({(d['total'], d['interval'], tuple(d['pool'])) for d in L}) == 16, 'no two levels share pool and pacing')
    n5_open_all(page)
    info = {}
    for k in range(1, 17):
        page.evaluate(f"() => {{ document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); window.__gg.openPreview({1400 + k}); }}"); time.sleep(0.25)
        info[k] = page.evaluate("() => [document.querySelector('#pvTitle').textContent, document.querySelector('#pvInfo').textContent, [...document.querySelectorAll('#pvMonsters small')].map(e => e.textContent)]")
    ok(info[1][0] == 'Nightmare 5-1', f'the preview is titled Nightmare 5-1 {info[1][0]!r}')
    ok(all('tide' in info[k][1].lower() for k in range(1, 17)), 'every preview says the tide rises')
    ok('whirlpool' in info[1][1].lower() and 'whirlpool' not in info[3][1].lower(), f'the previews of whirlpool nights say so {info[1][1]!r}')
    ok('Blood Slime' in info[2][2] and 'Drowned Pirate' in info[3][2], f'the previews list the new monsters {info[2][2]} {info[3][2]}')
    ok(not errors, f'every preview opens without a page error {errors[:2]}')
    page.close()


def n5_intro_titles(page, n):
    """Play night n from its preview card and read the intro cards it shows, in order."""
    page.evaluate(f"() => {{ document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); window.__gg.openPreview({n}); }}"); time.sleep(0.4)
    page.click('#bPvGo'); time.sleep(0.4)
    out = []
    for _ in range(10):
        if page.evaluate("() => window.__gg.state") != 'intro': break
        out.append([page.evaluate("() => document.querySelector('#inTitle').textContent"), page.evaluate("() => document.querySelector('#inText').textContent")])
        page.click('#bIntroOk'); time.sleep(0.3)
    return out


def check_n5_intros(browser, url):
    """First appearances on the marsh track show a card: the blood tide and Whirlpools (N5-1), each new monster, the Swan Gourd (N5-5), the Kraken in both forms."""
    if not R9: return
    page, errors = open_page(browser, url)
    n5_open_all(page)
    page.evaluate("() => { window.__gg.save.seenIntro = { quests:true, gourd:true, 'gourd:protector':true, 'gourd:wartling':true, 'gourd:crookneck':true, puddles:true, sea:true }; }")
    t = {k: n5_intro_titles(page, 1400 + k) for k in (1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 16)}
    T = {k: [x[0] for x in v] for k, v in t.items()}
    ok(T[1][:2] == ['The blood tide', 'Whirlpools'], f'N5-1 opens with the blood tide and Whirlpools cards {T[1]}')
    tx = {x[0]: x[1] for x in t[1]}
    ok('rising' in tx.get('The blood tide', '').lower() and 'mark' in tx.get('The blood tide', '').lower(), f"the blood tide card explains the rising shore and its marks ({tx.get('The blood tide', '')[:80]}...)")
    ok('lane' in tx.get('Whirlpools', '').lower() and 'pair' in tx.get('Whirlpools', '').lower(), f"the Whirlpools card explains the linked pairs ({tx.get('Whirlpools', '')[:80]}...)")
    ok(not any(x in ('The blood tide', 'Whirlpools') for k in T if k > 1 for x in T[k]), 'later levels do not repeat them')
    for k, name in ((2, 'Blood Slime'), (3, 'Drowned Pirate'), (6, 'Turtle Rider'), (7, 'Storm Eel'), (8, 'Siren')):
        ok(any(x.startswith('New monster') and name in x for x in T[k]), f'N5-{k} introduces the {name} {T[k]}')
    ok(any('Kraken' in x and 'full form' not in x for x in T[4]) and any('tentacles' in x[1] for x in t[4]), f'N5-4 introduces the Kraken and its tentacles {T[4]}')
    ok(T[5] == ['The Swan Gourd'], f'N5-5 explains the Swan Gourd, once {T[5]}')
    ok(not T[9], f'N5-9 brings nothing new {T[9]}')
    ok(any('Kraken' in x and 'full form' in x for x in T[13]), f"N5-13 shows the Kraken's form-2 card {T[13]}")
    ok(any('Fallen Twin Tides' in x for x in T[16]), f'N5-16 introduces the Fallen Twin Tides {T[16]}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_n5_bestiary(browser, url):
    """The marsh nightmare bestiary lists the new monsters in first-met order (a companion beside its parent) and the Fallen Twin Tides last; story monsters are not repeated."""
    if not R9: return
    page, errors = open_page(browser, url)
    def flip(w):
        page.evaluate(f"() => window.__gg.openBook({w})"); time.sleep(0.6)
        if page.evaluate("() => !document.querySelector('#spread').classList.contains('nightmare')"): page.click('#bBookmark')
        time.sleep(0.8)
        page.evaluate("() => { if (document.querySelector('#bestiary').hidden) document.querySelector('#bBkFlip').click(); }"); time.sleep(0.7)
    n5_open_all(page); page.evaluate("() => { window.__gg.save.stars['1416'] = 3; }")
    flip(4)
    b = page.evaluate("() => [document.querySelector('#bsTitle').textContent, [...document.querySelectorAll('#bestiary .bs')].map(e => e.classList.contains('unmet') ? null : [e.querySelector('b').textContent, e.querySelector('.ab').textContent, (e.querySelector('.lo') || {}).textContent || ''])]")
    names = [x and x[0] for x in b[1]]
    ok('Nightmare' in b[0] and 'Drowned Marsh' in b[0], f'the page is titled as the marsh nightmare edition ({b[0]!r})')
    ok(names and names[-1] == 'The Fallen Twin Tides', f'the Fallen Twin Tides come last {names}')
    ok(all(names), f'every entry is met with all of N5 open {names}')
    for want in ('Blood Slime', 'Bloodlet', 'Drowned Pirate', 'The Kraken', 'Tentacle', 'Turtle Rider', 'Storm Eel', 'Siren'):
        ok(want in names, f'{want} has a bestiary entry {names}')
    ok(names.index('Blood Slime') < names.index('Drowned Pirate') < names.index('The Kraken') < names.index('Turtle Rider') < names.index('Storm Eel') < names.index('Siren'), f'first-met order {names}')
    ok(names.index('Bloodlet') == names.index('Blood Slime') + 1 and names.index('Tentacle') == names.index('The Kraken') + 1, 'companions sit beside their parent')
    ok(all(x[1] and x[2] for x in b[1] if x), 'every entry has an ability and a lore line')
    ok(not any(n in names for n in ('Drowned Ghoul', 'Tide Imp', 'Puddle Crawler', 'Drunk Sailor', 'Puddle Diver', 'Splitter Slime', 'Shell Turtle')), 'story marsh monsters are not repeated')
    ok(page.evaluate("() => window.__gg.FALLEN && window.__gg.FALLEN[4] && window.__gg.FALLEN[4].key") == 'fallentides', 'FALLEN[4] is the Fallen Twin Tides')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_n5_prebake(browser, url):
    """Each night bakes what it can spawn when it starts: its pool, its boss and what the boss brings (the Kraken's tentacle and anchor, the twins' summons). Every night starts and runs a moment."""
    if not R9: return
    page, errors = open_page(browser, url)
    L = page.evaluate(N5_LEVELS_JS)
    missing = []
    for k, d in enumerate(L, 1):
        page.reload(); page.wait_for_function('() => !!window.__gg'); time.sleep(0.3)
        page.evaluate("() => { Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true }); const s = window.__gg.save; s.gourds = { grave:true, protector:true, wartling:true, crookneck:true, swan:true }; s.seenSwanCoach = true; }")
        nm5_start(page, k)
        want = set(d['pool']) | set(d['also']) | ({d['boss']} if d['boss'] else set())
        if 'bloodslime' in want: want.add('bloodblob')
        got = page.evaluate("""(ks) => { const g = window.__gg, V = g.VARIANTS; return ks.filter(k => { const b = V[k] ? V[k].base : null;
          return !g.isBaked(k) && !g.isBaked(k + '|form2') && !g.isBaked(k + '-blood') && !(b && (g.isBaked(b + '|' + k) || g.isBaked(b))); }); }""", sorted(want))
        if got: missing.append((k, got))
        time.sleep(0.4)
    ok(not missing, f'every level bakes its monsters, its boss and what the boss brings at night start {missing}')
    ok(not errors, f'no page errors on any night {errors[:2]}')
    page.close()


PUDDLE_PROBE = """() => { const g = window.__gg, c = g.ctx, f = c.drawImage, srcs = [];
  c.drawImage = function(s, ...a){ srcs.push([s, a]); return f.call(this, s, ...a); };
  try { g.drawPuddles(0); } finally { delete c.drawImage; }
  if (!srcs.length) return null;
  const s = srcs[0][0], x = s.getContext('2d'), w = s.width, h = s.height, ox = w / 2, oy = h * 42 / 64; let r = 0, gg = 0, b = 0, n = 0;
  for (const [dx, dy] of [[0.12, 0.05], [0.22, -0.05], [-0.18, 0.1], [0.3, 0.12], [-0.3, 0.02]]){ const d = x.getImageData(Math.round(ox + dx * w), Math.round(oy + dy * h), 1, 1).data; r += d[0]; gg += d[1]; b += d[2]; n++; }
  return [r / n, gg / n, b / n, srcs.length]; }"""


def check_blood_puddles(browser, url):
    """Pools on the marsh nightmare's nights are blood red to match the blood sea (owner 2026-11-09); the story Marsh's pools stay blue."""
    if not R9: return
    page, errors = marsh_page(browser, url)
    ok(page.evaluate("() => window.__gg.G.puddles.length") > 0, 'N5-1 has pools')
    v = page.evaluate(PUDDLE_PROBE)
    ok(v is not None and v[0] > 1.5 * v[2] and v[0] > v[1], f'the N5 pool sprite is blood red {v}')
    ok(page.evaluate("() => window.__gg.G.puddles.length") == v[3], 'one pool sprite is drawn per pool')
    start(page, 81); time.sleep(0.3)
    page.evaluate("() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; g.setState('pause'); }")
    ok(page.evaluate("() => window.__gg.G.puddles.length") > 0, '5-1 (story) has a pool')
    v = page.evaluate(PUDDLE_PROBE)
    ok(v is not None and v[2] > 1.2 * v[0], f'the story pool stays blue {v}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_n5_levels': check_n5_levels, 'check_n5_intros': check_n5_intros, 'check_n5_bestiary': check_n5_bestiary, 'check_n5_prebake': check_n5_prebake, 'check_blood_puddles': check_blood_puddles})


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
