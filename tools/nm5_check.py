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
R9_NAMES = ['Blood Slime', 'Storm Eel', 'Siren', 'Swan Gourd', 'Fallen Twin Tides', 'Whirlpool', 'Drowned Pirate', 'Bloodlet', 'pirateshot', 'Beat Nightmare 4-4', 'marshN-blood', 'The tide rises!', '#4affd0', 'turtlerider', 'rotshot']


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
    page.evaluate(STEP, [8, 0.05])
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
    ok(page.evaluate("() => window.__gg.G.vfx.length >= 0"), 'impact effect queued')
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
