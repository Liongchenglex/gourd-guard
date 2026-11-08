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
    # pausing stops the sky: rain offsets, the flash clock and thunder (it runs on game time, not the wall clock)
    page.evaluate("() => { const g = window.__gg, R = Math.random; Math.random = () => 0; g.weatherReset(); g.weatherForce(); Math.random = R; }")
    page.click('#pauseBtn'); time.sleep(0.2)
    ok(page.evaluate("() => window.__gg.state") == 'pause', 'the night is paused')
    p0 = page.evaluate("() => { window.__th = 0; const S = window.__gg.SFX, f = S.thunder; S.thunder = function(...a){ window.__th++; return f.apply(this, a); }; return window.__gg.weatherState(); }")
    time.sleep(1.5)
    p1 = page.evaluate("() => window.__gg.weatherState()")
    ok(p0['far'] == p1['far'] and p0['near'] == p1['near'] and p0['flash'] == p1['flash'], f'paused: the rain and the flash stand still ({p0["far"]:.1f} -> {p1["far"]:.1f}, flash {p0["flash"]:.3f} -> {p1["flash"]:.3f})')
    ok(page.evaluate("() => window.__th") == 0, 'paused: no thunder (a flash was forced, its rumble is still pending)')
    page.click('#bResume'); time.sleep(1.2)
    ok(page.evaluate("() => window.__gg.weatherState().far") != p1['far'], 'resumed: the rain falls again')
    # a new night starts the weather fresh: nothing pending from the last storm, and the sheets are already baked
    page.evaluate("() => { const g = window.__gg; g.weatherForce(); g.drawWeather(g.ctx, 0.2); }")
    ok(page.evaluate("() => window.__gg.weatherState().flash") > 0, 'a flash is under way before the restart')
    nm4_start(page, 1)
    st = page.evaluate("() => { const w = window.__gg.weatherState(); return [w.flash, w.far, w.near, window.__gg.weatherBaked()]; }")
    ok(st[0] == 0 and st[3] is True, f'a new night resets the flash and has the sheets baked at once ({st})')
    page.evaluate("() => { window.__th = 0; }"); time.sleep(1.2)
    ok(page.evaluate("() => window.__th") == 0, 'no late rumble from the last storm after the restart')
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

# ---------- Task 2: nets on the patch ----------
# A quiet N4 night with an empty patch: `put(page, r, c, colour)` places a pumpkin, nets are set on cells directly or thrown.
NQ = """() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.projs.length = 0; G.netsFlying = []; G.idle = -1e9; G.hint = null;
  g.grid.forEach(r => r.fill(null)); g.graves.forEach(r => r.fill(false)); window.__put = (r, c, col, net) => { const x = g.newCell(col); if (net) x.net = net; g.grid[r][c] = x; return x; }; }"""


def net_night(browser, url):
    page, errors = keep_page(browser, url)
    page.evaluate(NQ)
    return page, errors


def check_net_rules(browser, url):
    if not R8: return
    page, errors = net_night(browser, url)
    # A netted at (3,3); C (colour 2) at (3,4) and B (colour 1) at (3,5) push left into it
    page.evaluate("() => { const p = window.__put; window.__A = p(3, 3, 0, 'net'); p(3, 4, 2); p(3, 5, 1); }")
    mv = page.evaluate("() => { const g = window.__gg; return [g.planMove(3, 3, 'left'), g.planMove(3, 3, 'up'), g.planMove(3, 5, 'left'), g.planMove(3, 4, 'left')]; }")
    ok(mv[0] is None and mv[1] is None, f'a netted pumpkin refuses a slide {mv[:2]}')
    ok(mv[2] is None and mv[3] is None, f'a push line through it is refused {mv[2:]}')
    page.evaluate("() => { const g = window.__gg; g.grid[3][4] = null; }")
    ok(page.evaluate("() => window.__gg.planMove(3, 5, 'left')") is not None, 'control: with the line clear the free pumpkin slides')
    # crushing: refused, a float and the pumpkin stays
    r = page.evaluate("() => { const g = window.__gg, G = g.G, n = G.smashes || 0, f = G.floats.length; g.smash(window.__A); return [g.grid[3][3] === window.__A, (G.smashes || 0) - n, G.floats.slice(f).map(x => x.text)]; }")
    ok(r[0] and r[1] == 0 and 'Netted' in r[2], f'crushing a netted pumpkin is refused with a "Netted" float {r}')
    # no timer
    page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 300; i++) g.update(0.1); }")
    ok(page.evaluate("() => window.__gg.grid[3][3] === window.__A && window.__A.net === 'net'"), 'the net is still there after 30 s')
    # a lone netted pumpkin (not lit) is not launched
    n0 = page.evaluate("() => { const g = window.__gg; g.launchGroup(window.__A); return g.G.projs.length; }")
    ok(n0 == 0 and page.evaluate("() => window.__gg.grid[3][3] === window.__A"), f'a lone netted pumpkin is not launched ({n0} projectiles)')
    # in a lit bunch it flies with the others, taking its net with it
    page.evaluate(NQ)
    page.evaluate("() => { const p = window.__put; p(4, 1, 0); window.__N = p(4, 2, 0, 'net'); p(4, 3, 0); window.__gg.resolveMatches(); }")
    lit = page.evaluate("() => window.__N.lit")
    ok(lit, 'the netted pumpkin lights up with its bunch')
    page.evaluate("() => window.__gg.launchGroup(window.__N)")
    r = page.evaluate("() => { const g = window.__gg; return [g.G.projs.length, g.grid[4].every(x => !x), g.netCount()]; }")
    ok(r[0] == 3 and r[1] and r[2] == 0, f'the whole bunch flew (3 projectiles), the cells are empty and the net went with it {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_net_cap(browser, url):
    if not R8: return
    page, errors = net_night(browser, url)
    page.evaluate("() => { const p = window.__put; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) p(r, c, (r + c * 2) % 5, r * 7 + c < 15 ? 'net' : null); }")
    ok(page.evaluate("() => window.__gg.netCount()") == 15, '15 nets on the patch')
    r = page.evaluate("() => { const g = window.__gg; return [g.throwNet(100, 100, 'net', 1), g.G.netsFlying.length]; }")
    ok(r == [False, 0], f'at the cap a throw fizzles and nothing flies {r}')
    time.sleep(1.0)
    ok(page.evaluate("() => window.__gg.netCount()") == 15, 'and nothing lands')
    # 14 on the patch: one more fits, a second thrown at once (14 + 1 in flight = the cap) fizzles
    page.evaluate("() => { const g = window.__gg; g.grid[0][0].net = null; }")
    ok(page.evaluate("() => window.__gg.netCount()") == 14, '14 nets on the patch')
    r = page.evaluate("() => { const g = window.__gg; return [g.throwNet(100, 100), g.throwNet(100, 100), g.G.netsFlying.length]; }")
    ok(r == [True, False, 1], f'one net in flight takes the 15th place: the second throw fizzles {r}')
    time.sleep(1.2)
    ok(page.evaluate("() => window.__gg.netCount()") == 15 and page.evaluate("() => window.__gg.G.netsFlying.length") == 0, 'the flying net lands: 15 on the patch')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_net_free_neighbour(browser, url):
    if not R8: return
    page, errors = net_night(browser, url)
    # P in the open: netable
    page.evaluate("() => { const p = window.__put; p(3, 3, 0); }")
    ok(page.evaluate("() => window.__gg.canNet(3, 3)") is True, 'a pumpkin in the open can be netted')
    ok(page.evaluate("() => { const g = window.__gg; g.grid[3][3].fly = 1; const v = g.canNet(3, 3); g.grid[3][3].fly = 0; return v; }") is False, 'a pumpkin in flight cannot')
    ok(page.evaluate("() => { const g = window.__gg; g.grid[3][3].net = 'net'; const v = g.canNet(3, 3); g.grid[3][3].net = null; return v; }") is False, 'one already netted cannot')
    ok(page.evaluate("() => { const g = window.__gg; g.grid[3][3].gourd = true; const v = g.canNet(3, 3); delete g.grid[3][3].gourd; return v; }") is False, 'a gourd cannot')
    ok(page.evaluate("() => window.__gg.canNet(0, 0)") is False, 'an empty cell cannot')
    # only free neighbour is netted: never picked, 200 picks
    page.evaluate(NQ)
    page.evaluate("() => { const g = window.__gg, p = window.__put; p(3, 3, 0); p(3, 4, 1, 'net'); g.graves[2][3] = g.graves[4][3] = g.graves[3][2] = true; }")
    ok(page.evaluate("() => window.__gg.canNet(3, 3)") is False, 'a pumpkin whose only free neighbour is netted cannot be netted')
    ok(page.evaluate("() => window.__gg.canNet(3, 4)") is False, 'and the netted one is not offered again')
    # corner beside a grave and a netted pumpkin
    page.evaluate(NQ)
    page.evaluate("() => { const g = window.__gg, p = window.__put; p(0, 0, 0); p(0, 1, 1, 'net'); g.graves[1][0] = true; p(4, 6, 2); }")
    picks = page.evaluate("() => { const g = window.__gg, out = new Set(); for (let i = 0; i < 200; i++){ const s = g.pickNetCell(); out.add(s ? s.join(',') : 'none'); } return [...out]; }")
    ok('0,0' not in picks and '0,1' not in picks, f'a corner pumpkin beside a grave and a netted pumpkin is never picked {picks}')
    ok(picks == ['4,6'], f'only the pumpkin with room is picked {picks}')
    # nothing netable: null
    page.evaluate(NQ)
    ok(page.evaluate("() => window.__gg.pickNetCell()") is None, 'an empty patch has no cell to pick')
    # a pocket of two pumpkins that are each other's only free neighbour: once one is netted the other is never picked (the pair would be locked)
    page.evaluate(NQ)
    page.evaluate("() => { const g = window.__gg, p = window.__put; p(3, 3, 0); p(3, 4, 1); for (const [r, c] of [[2, 3], [4, 3], [3, 2], [2, 4], [4, 4], [3, 5]]) g.graves[r][c] = true; }")
    ok(page.evaluate("() => window.__gg.canNet(3, 3) && window.__gg.canNet(3, 4)") is True, 'a pocket pair: either may be netted first')
    page.evaluate("() => { window.__gg.grid[3][3].net = 'net'; }")
    picks = page.evaluate("() => { const g = window.__gg, out = new Set(); for (let i = 0; i < 100; i++){ const s = g.pickNetCell(); out.add(s ? s.join(',') : 'none'); } return [...out]; }")
    ok(page.evaluate("() => window.__gg.canNet(3, 4)") is False and picks == ['none'], f'after one of a pocket pair is netted the other is never picked {picks}')
    # a net landing re-checks: its cell lost its last free neighbour in flight
    page.evaluate("() => { const g = window.__gg, p = window.__put; p(3, 3, 0); p(3, 4, 1); g.graves[2][3] = g.graves[4][3] = g.graves[3][2] = true; window.__thr = g.throwNet(50, 50, 'net', 3); }")
    page.evaluate("() => { const g = window.__gg; g.G.netsFlying.forEach(f => { f.r = 3; f.c = 3; }); g.grid[3][4].net = 'net'; }")
    time.sleep(1.0)
    ok(page.evaluate("() => !window.__gg.grid[3][3].net"), 'a net re-checks on landing: it fizzles when the cell lost its last free neighbour')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_net_hint_wind(browser, url):
    if not R8: return
    page, errors = net_night(browser, url)
    # a board where the netted pumpkin is the obvious hint: two greens in a row, a third (netted) one row below, off to the side
    page.evaluate("() => { const p = window.__put; p(2, 1, 0); p(2, 2, 0); window.__N = p(2, 5, 0, 'net'); }")
    free = page.evaluate("() => { const g = window.__gg; window.__N.net = null; const b = g.bestMove(); window.__N.net = 'net'; return b ? b.ref === window.__N : null; }")
    ok(free is not None, f'control: without the net the hint finds a move ({free})')
    for i in range(3):
        b = page.evaluate("() => { const b = window.__gg.bestMove(); return b ? b.ref === window.__N : null; }")
        ok(b is not True, 'the hint never moves a netted pumpkin')
    # wind: every direction leaves it in place
    page.evaluate(NQ)
    page.evaluate("() => { const p = window.__put; window.__N = p(2, 3, 0, 'net'); p(2, 5, 1); }")
    for d in ('left', 'right', 'up', 'down'):
        page.evaluate("([d]) => window.__gg.gust(d)", [d])
        ok(page.evaluate("() => window.__gg.grid[2][3] === window.__N"), f'a gust {d} leaves the netted pumpkin in place')
    moved = page.evaluate("() => window.__gg.grid[2].findIndex(x => x && x !== window.__N)")
    ok(moved != 5, f'control: the free pumpkin was blown along ({moved})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_net_continue(browser, url):
    if not R8: return
    page, errors = net_night(browser, url)
    page.evaluate("() => { const g = window.__gg; g.G.spawned = 5; }")
    # fill the patch so the continued (fresh) patch has the same shape; net three of them, one red, and one net in flight
    page.evaluate("""() => { const g = window.__gg, p = window.__put; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) p(r, c, (r + c * 2) % 5);
      g.grid[1][1].net = 'net'; g.grid[1][1].netBy = 7; g.grid[2][4].net = 'red'; g.grid[2][4].netBy = 9; g.grid[4][2].net = 'net'; g.grid[4][2].netBy = null;
      g.G.netsFlying = [{ x:120, y:80, kind:'red', by:9, r:3, c:3, t:0.5 }]; }""")
    before = page.evaluate("() => window.__gg.netSnapshot()")
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); window.__cs = c; g.continueNight(c); }"); time.sleep(0.3)
    page.evaluate("() => { const g = window.__gg; g.G.spawnTimer = 999; g.G.sproutT = -999; g.G.monsters.length = 0; }")
    after = page.evaluate("() => window.__gg.netSnapshot()")
    ok(len(before['cells']) == 3 and len(after['cells']) == 3, f'three nets on the patch survive a continue ({len(before["cells"])} -> {len(after["cells"])})')
    # an ordinary net keeps its thrower; a red net whose thrower is not on the field at the loss (none is, here) comes back ordinary (Task 5)
    ok(sorted(((k, b) for _, _, k, b in after['cells']), key=str) == sorted([('net', 7), ('net', None), ('net', None)], key=str), f'with their kind and thrower, the orphan red one ordinary {after["cells"]}')
    ok(len(after['flying']) == 1 and after['flying'][0][2] == 'net' and after['flying'][0][3] is None, f'the net in flight keeps flying (orphan red: ordinary) {after["flying"]}')
    time.sleep(0.8)
    ok(page.evaluate("() => window.__gg.netCount()") >= 3, 'and lands (the count did not drop)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_net_budget(browser, url):
    """Extends check_fire_budget: 15 nets on the patch add at most 15 drawImage calls a frame and no fill or stroke."""
    if not R8: return
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillRect', 'fillText', 'strokeText', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; } })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm4_start(page, 1); time.sleep(1.0)
    page.evaluate(NQ)
    page.evaluate("() => { const p = window.__put; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) p(r, c, (r + c * 2) % 5); }")
    time.sleep(1.0)
    count = "() => new Promise(res => { window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 30) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.drawImage || 0) / 30, (c.fill || 0) / 30, (c.stroke || 0) / 30, ((c.createRadialGradient || 0) + (c.createLinearGradient || 0)) / 30]); } }; requestAnimationFrame(tick); })"
    base = page.evaluate(count)
    page.evaluate("() => { const g = window.__gg; let n = 0; for (let r = 0; r < 5; r++) for (let c = 0; c < 7 && n < 15; c++){ g.grid[r][c].net = n % 3 ? 'net' : 'red'; g.grid[r][c].netAt = -9; n++; } }")
    time.sleep(0.5)
    lit = page.evaluate(count)
    ok(page.evaluate("() => window.__gg.netCount()") == 15, '15 nets on the patch')
    ok(lit[0] - base[0] <= 15.5, f'15 nets add at most 15 drawImage calls a frame ({base[0]:.1f} -> {lit[0]:.1f})')
    ok(lit[1] <= base[1] + 0.1 and lit[2] <= base[2] + 0.1 and lit[3] <= base[3] + 0.1, f'and no fill, stroke or gradient (fill {base[1]:.1f} -> {lit[1]:.1f}, stroke {base[2]:.1f} -> {lit[2]:.1f}, gradients {base[3]:.1f} -> {lit[3]:.1f})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


# ---------- Task 3: the Lobber Cart ----------
FILL = "() => { const p = window.__put; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) p(r, c, (r + c * 2) % 5); }"
THROWN = "() => window.__gg.netCount() + window.__gg.G.netsFlying.length"
STEP = "([n, dt]) => { const g = window.__gg; for (let i = 0; i < n; i++) g.update(dt); }"


def check_lobber(browser, url):
    if not R8:
        page, errors = open_page(browser, url)
        has = page.evaluate("() => !!(window.__gg.TYPES && window.__gg.TYPES.lobbercart)") if page.evaluate("() => !!window.__gg.TYPES") else False
        ok(not has, 'no Lobber Cart type below Release 8')
        page.close(); return
    page, errors = net_night(browser, url)
    page.evaluate(FILL)
    T = page.evaluate("() => window.__gg.TYPES.lobbercart")
    ok(T['hp'] == 6 and T['park'] == 0.15 and T['eat'] == 0 and T['lobEvery'] == [6, 8], f'the cart numbers are the spec ones {T}')
    wall0 = page.evaluate("() => window.__gg.walls[3].hp")
    page.evaluate("() => { window.__C = window.__gg.spawnMonster('lobbercart', 3, true); }")
    mx = 0
    for i in range(12):   # 60 s of game time, 0.1 s steps: it rolls to 0.15, stops, never passes
        page.evaluate(STEP, [50, 0.1])
        mx = max(mx, page.evaluate("() => window.__C.p"))
    ok(0.149 <= page.evaluate("() => window.__C.p") <= 0.1501 and mx <= 0.1501, f'it parks at 0.15 and never passes it (max p {mx:.4f})')
    ok(page.evaluate("() => !window.__C.eating && !window.__C.dead") and page.evaluate("() => window.__gg.walls[3].hp") == wall0, 'it never chews: not eating, the fence untouched')
    ok(page.evaluate(THROWN) >= 6, f'it lobbed several nets in a minute ({page.evaluate(THROWN)})')
    # timing, from a fresh cart already at its park: a net within 8 s, another within 16 s
    page.evaluate(NQ); page.evaluate(FILL)
    page.evaluate("() => { window.__C = window.__gg.spawnMonster('lobbercart', 1, true, 0.15); }")
    page.evaluate(STEP, [79, 0.1])
    page.evaluate(STEP, [2, 0.1])
    ok(page.evaluate(THROWN) >= 1, f'a net thrown within 8 s ({page.evaluate(THROWN)})')
    page.evaluate(STEP, [79, 0.1])
    ok(page.evaluate(THROWN) >= 2, f'another within 16 s ({page.evaluate(THROWN)})')
    ok(page.evaluate("() => window.__gg.G.monsters.every(m => m.id != null)") and page.evaluate("() => { const b = window.__gg.netSnapshot(); return b.cells.some(c => c[3] === window.__C.id) || b.flying.some(f => f[3] === window.__C.id); }"), 'its nets carry its id')
    # others walk past a parked cart instead of queueing behind it
    page.evaluate("() => { window.__W = window.__gg.spawnMonster('ghoul', 1, true, 0.0); }")
    page.evaluate(STEP, [150, 0.1])
    ok(page.evaluate("() => window.__W.p") > 0.4, f'a ghoul in the same lane walks past the parked cart ({page.evaluate("() => window.__W.p"):.2f})')
    # dying leaves its nets
    n = page.evaluate("() => window.__gg.netCount()")
    page.evaluate("() => { window.__gg.damage(window.__C, 99); }"); page.evaluate(STEP, [10, 0.1])
    ok(page.evaluate("() => window.__C.dead") and page.evaluate("() => window.__gg.netCount()") >= n and n >= 1, f'a dead cart leaves its nets ({n} -> {page.evaluate("() => window.__gg.netCount()")})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_lobber_continue(browser, url):
    if not R8: return
    page, errors = net_night(browser, url)
    page.evaluate(FILL)
    page.evaluate("() => { const g = window.__gg; g.G.spawned = 5; window.__C = g.spawnMonster('lobbercart', 2, true, 0.15); }")
    page.evaluate(STEP, [85, 0.1])
    before = page.evaluate(THROWN)
    ok(before >= 1, f'the cart threw before the loss ({before})')
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); g.continueNight(c); }"); time.sleep(0.3)
    page.evaluate("() => { const g = window.__gg; g.G.spawnTimer = 999; g.G.sproutT = -999; g.G.monsters.length = 0; }")
    kept = page.evaluate("() => window.__gg.netCount() + window.__gg.G.netsFlying.length")
    ok(kept >= 1, f'its nets survive the continue ({before} -> {kept})')
    page.evaluate("() => { window.__C = window.__gg.spawnMonster('lobbercart', 2, true, 0.15); }")
    page.evaluate(STEP, [90, 0.1])
    ok(page.evaluate(THROWN) > kept, f'the returning cart keeps lobbing on its own clock ({kept} -> {page.evaluate(THROWN)})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


# ---------- Task 4: the Storm Lancer and the Storm Marshal ----------
def spawn_at(page, typ, lane, p, hp=None, sp=0.03):
    """Spawn a monster at p with a fixed walk speed (no random jitter), optionally a fixed health; stored as window.__M[name]."""
    return page.evaluate("""([t, l, p, hp, sp]) => { const m = window.__gg.spawnMonster(t, l, true, p); m.sp = sp; if (hp != null) m.hp = m.maxHp = hp; window.__last = m; return true; }""", [typ, lane, p, hp, sp])


def hold(page):
    """Stop the live game loop (state 'pause'): only the steps a check takes advance the night, so the numbers are exact."""
    page.evaluate("() => window.__gg.setState('pause')")


def check_lancer(browser, url):
    if not R8:
        page, errors = open_page(browser, url)
        has = page.evaluate("() => !!window.__gg.TYPES") and page.evaluate("() => !!(window.__gg.TYPES.lancer || window.__gg.TYPES.marshal)")
        ok(not has, 'no Lancer or Marshal type below Release 8')
        page.close(); return
    page, errors = net_night(browser, url); hold(page)
    T = page.evaluate("() => window.__gg.TYPES.lancer")
    ok(T['hp'] == 5 and T['charge'] == 4 and T['fenceHit'] == 0.5 and T['sp'] == 0.03 and T['eat'] == 0, f'the lancer numbers are the spec ones {T}')
    # a full fence loses half; charges at 4x from spawn
    page.evaluate("() => { const w = window.__gg.walls[3]; w.max = 20; w.hp = 20; window.__c0 = window.__gg.G.coins; window.__k0 = window.__gg.G.kills; window.__d0 = window.__gg.G.drops.length; }")
    spawn_at(page, 'lancer', 3, -0.02)
    page.evaluate("() => { window.__L = window.__last; }")
    page.evaluate(STEP, [1, 0.1])
    d = page.evaluate("() => window.__L.p") + 0.02
    ok(abs(d - 0.012) < 1e-6, f'it moves at 4x its walk from the first step (dp {d:.4f}, a walk would be 0.003)')
    page.evaluate(STEP, [100, 0.1])
    ok(page.evaluate("() => window.__L.dead") and page.evaluate("() => window.__gg.walls[3].hp") == 10, f'at the fence it takes half: 20/20 -> {page.evaluate("() => window.__gg.walls[3].hp")}/20, and is gone')
    ok(page.evaluate("() => window.__gg.G.coins") == page.evaluate("() => window.__c0") and page.evaluate("() => window.__gg.G.kills") == page.evaluate("() => window.__k0") and page.evaluate("() => window.__gg.G.drops.length") == page.evaluate("() => window.__d0"), 'no coins, kill or drop for the impact')
    # never the last 1
    page.evaluate("() => { window.__gg.walls[4].max = 20; window.__gg.walls[4].hp = 1; window.__gg.walls[5].max = 20; window.__gg.walls[5].hp = 6; }")
    spawn_at(page, 'lancer', 4, 0.9); page.evaluate("() => { window.__L = window.__last; }")
    spawn_at(page, 'lancer', 5, 0.9); page.evaluate("() => { window.__L2 = window.__last; }")
    page.evaluate(STEP, [10, 0.1])
    ok(page.evaluate("() => window.__L.dead") and page.evaluate("() => window.__gg.walls[4].hp") == 1, 'a fence at 1/20 takes nothing (the lancer is still gone)')
    ok(page.evaluate("() => window.__L2.dead") and page.evaluate("() => window.__gg.walls[5].hp") == 1, f'a fence at 6/20 loses 5 (not 10): left {page.evaluate("() => window.__gg.walls[5].hp")}')
    # five hits kill it, and a kill pays
    spawn_at(page, 'lancer', 2, 0.2); page.evaluate("() => { window.__L = window.__last; window.__k0 = window.__gg.G.kills; }")
    for i in range(4): page.evaluate("() => window.__gg.damage(window.__L, 1)")
    ok(not page.evaluate("() => window.__L.dead") and page.evaluate("() => window.__L.hp") == 1, 'four hits leave it on 1')
    page.evaluate("() => window.__gg.damage(window.__L, 1)")
    ok(page.evaluate("() => window.__L.dead") and page.evaluate("() => window.__gg.G.kills") == page.evaluate("() => window.__k0") + 1, 'the fifth hit kills it and counts a kill (the reward roll may pay coins, a weapon or a pumpkin)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_lancer_edges(browser, url):
    if not R8: return
    page, errors = net_night(browser, url); hold(page)
    page.evaluate("() => { for (const l of [1, 2, 3, 4]) { const w = window.__gg.walls[l]; w.max = 20; w.hp = 20; } }")
    # frozen mid-charge it stops; slowed it charges at half
    spawn_at(page, 'lancer', 1, 0.2); page.evaluate("() => { window.__L = window.__last; window.__L.frozenT = 2; }")
    page.evaluate(STEP, [10, 0.1])
    ok(abs(page.evaluate("() => window.__L.p") - 0.2) < 1e-6, 'frozen mid-charge it stops')
    page.evaluate(STEP, [11, 0.1]); p0 = page.evaluate("() => window.__L.p")
    page.evaluate("() => { window.__L.slowT = 5; }"); page.evaluate(STEP, [1, 0.1]); p1 = page.evaluate("() => window.__L.p")
    ok(abs((p1 - p0) - 0.006) < 1e-6, f'slowed, it charges at half the charge ({p1 - p0:.4f})')
    # passes a castle wall
    page.evaluate("() => { window.__gg.G.castles.push({ lane:2, p:0.5, hp:12, maxHp:12, flash:0, dead:false }); }")
    spawn_at(page, 'lancer', 2, 0.1); page.evaluate("() => { window.__L = window.__last; }")
    page.evaluate(STEP, [100, 0.1])
    ok(page.evaluate("() => window.__L.dead") and page.evaluate("() => window.__gg.walls[2].hp") == 10 and page.evaluate("() => window.__gg.G.castles[0].hp") == 12, 'it charges through a castle wall to the fence, the wall untouched')
    # and through a Gatehouse (Task 6): it stands there untouched, the Lancer reaches the fence
    page.evaluate("() => { const g = window.__gg; g.G.castles.push(g.newCastle(3, 0.5, 'gate', 12)); }")
    spawn_at(page, 'lancer', 3, 0.1); page.evaluate("() => { window.__L = window.__last; }")
    page.evaluate(STEP, [100, 0.1])
    ok(page.evaluate("() => window.__L.dead") and page.evaluate("() => window.__gg.walls[3].hp") == 10 and page.evaluate("() => window.__gg.G.castles.find(c => c.kind === 'gate').hp") == 30, 'it charges through a Gatehouse to the fence, the gate untouched')
    # a broken fence lets it through
    page.evaluate("() => { window.__gg.walls[4].hp = 0; }")
    spawn_at(page, 'lancer', 4, 0.9); page.evaluate("() => { window.__L = window.__last; }")
    page.evaluate(STEP, [12, 0.1])
    ok(not page.evaluate("() => window.__L.dead") and page.evaluate("() => window.__L.eating") and page.evaluate("() => window.__gg.walls[4].hp") == 0, 'a broken fence: it walks through (not removed, no damage)')
    page.evaluate(STEP, [20, 0.1])
    ok(page.evaluate("() => window.__gg.G.over"), 'and the night is lost as usual once it is through')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_lancer_ride(browser, url):
    """It rides through slower monsters in its lane, and a repaired fence is struck at once instead of leaving it stuck on the chew path."""
    if not R8: return
    page, errors = net_night(browser, url); hold(page)
    page.evaluate("() => { const w = window.__gg.walls[1]; w.max = 20; w.hp = 20; }")
    spawn_at(page, 'ghoul', 1, 0.5, sp=0.005); page.evaluate("() => { window.__W = window.__last; }")
    spawn_at(page, 'lancer', 1, 0.1); page.evaluate("() => { window.__L = window.__last; }")
    page.evaluate(STEP, [60, 0.1])
    ok(page.evaluate("() => window.__L.p") > page.evaluate("() => window.__W.p"), 'a slow ghoul ahead does not stop the Lancer (it passes it)')
    page.evaluate(STEP, [30, 0.1])
    ok(page.evaluate("() => window.__L.dead") and page.evaluate("() => window.__gg.walls[1].hp") == 10, 'and it reaches the fence at charge speed and strikes')
    # a fence broken, the Lancer at it, the fence repaired
    page.evaluate("() => { window.__gg.walls[3].max = 20; window.__gg.walls[3].hp = 0; }")
    spawn_at(page, 'lancer', 3, 0.95); page.evaluate("() => { window.__L = window.__last; }")
    page.evaluate(STEP, [10, 0.1])
    ok(page.evaluate("() => window.__L.eating") and not page.evaluate("() => window.__L.dead"), 'it waits at the broken fence')
    page.evaluate("() => { window.__gg.walls[3].hp = 20; window.__gg.G.over = false; }")
    page.evaluate(STEP, [2, 0.1])
    ok(page.evaluate("() => window.__L.dead") and page.evaluate("() => window.__gg.walls[3].hp") == 10, f'the fence repaired, it strikes at once ({page.evaluate("() => window.__gg.walls[3].hp")}/20) and is not stuck')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def marshal_scene(browser, url):
    page, errors = net_night(browser, url); hold(page)
    spawn_at(page, 'marshal', 3, 0.5, sp=0); page.evaluate("() => { window.__M = window.__last; }")
    spawn_at(page, 'ghoul', 4, 0.5, hp=3, sp=0); page.evaluate("() => { window.__A = window.__last; }")      # beside him
    spawn_at(page, 'ghoul', 5, 0.5, hp=3, sp=0); page.evaluate("() => { window.__B = window.__last; }")      # two lanes away
    spawn_at(page, 'ghoul', 3, 0.8, hp=3, sp=0); page.evaluate("() => { window.__C = window.__last; }")      # same lane, far up the field
    spawn_at(page, 'marshal', 2, 0.5, sp=0); page.evaluate("() => { window.__M2 = window.__last; }")   # another Marshal beside him
    return page, errors


def dp(page, k):
    """How far window.__<k> walks in one 0.1 s step at the walk speed 0.03 (it is held still between measurements)."""
    page.evaluate(f"() => {{ window.__{k}.sp = 0.03; }}"); p0 = page.evaluate(f"() => window.__{k}.p")
    page.evaluate(STEP, [1, 0.1]); p1 = page.evaluate(f"() => window.__{k}.p")
    page.evaluate(f"() => {{ window.__{k}.sp = 0; }}")
    return p1 - p0


def check_marshal(browser, url):
    if not R8: return
    page, errors = marshal_scene(browser, url)
    T = page.evaluate("() => window.__gg.TYPES.marshal")
    ok(T['hp'] == 10 and T['rallyEvery'] == 8 and T['rallyLast'] == 4 and T['rallySp'] == 2 and T['rallyHp'] == 2, f'the marshal numbers are the spec ones {T}')
    step_p = lambda k: (page.evaluate(STEP, [1, 0.1]), page.evaluate(f"() => window.__{k}.p"))[1]
    page.evaluate(STEP, [75, 0.1])    # 7.5 s: no rally yet
    ok(not page.evaluate("() => window.__M.rallying"), 'no rally before 8 s')
    d1 = dp(page, 'A')
    ok(abs(d1 - 0.003) < 1e-6, f'before the rally a ghoul beside him walks at x1 ({d1:.4f})')
    page.evaluate(STEP, [5, 0.1])     # 8.1 s
    ok(page.evaluate("() => window.__M.rallying"), 'the sword is up at 8 s')
    ok(page.evaluate("() => [window.__A.hp, window.__A.maxHp, window.__A.rallied]") == [6, 6, True], f'the ghoul beside him goes 3/3 -> {page.evaluate("() => [window.__A.hp, window.__A.maxHp]")}')
    ok(page.evaluate("() => [window.__B.hp, window.__B.maxHp, !!window.__B.rallied]") == [3, 3, False] and page.evaluate("() => [window.__C.hp, !!window.__C.rallied]") == [3, False], 'a ghoul two lanes away and one far up the lane are untouched')
    ok(page.evaluate("() => [window.__M2.hp, !!window.__M2.rallied]") == [10, False], 'another Marshal is never rallied')
    d2 = dp(page, 'A'); db = dp(page, 'B')
    ok(abs(d2 - 0.006) < 1e-6, f'while it is up the ghoul moves x2 ({d2:.4f})')
    ok(abs(db - 0.003) < 1e-6, f'the ghoul two lanes away is not hurried ({db:.4f})')
    page.evaluate(STEP, [40, 0.1])    # 12.3 s: the sword is down
    ok(not page.evaluate("() => window.__M.rallying"), 'the sword drops after 4 s')
    d3 = dp(page, 'A')
    ok(abs(d3 - 0.003) < 1e-6, f'the speed ends with the sword ({d3:.4f}) and the health stays {page.evaluate("() => window.__A.hp")}/{page.evaluate("() => window.__A.maxHp")}')
    page.evaluate(STEP, [80, 0.1])    # 20.4 s: the second raise
    ok(page.evaluate("() => [window.__A.hp, window.__A.maxHp]") == [6, 6], 'at the next raise it stays 6/6 (once ever)')
    # a boss beside him is never boosted
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; }")
    spawn_at(page, 'marshal', 3, 0.5, sp=0); page.evaluate("() => { window.__M = window.__last; }")
    page.evaluate("() => { const b = window.__gg.spawnMonster('boss', 3, true, 0.52); b.summon = 999; b.teleport = 999; window.__BO = b; window.__bh = b.hp; }")
    page.evaluate(STEP, [85, 0.1])
    ok(page.evaluate("() => window.__M.rallying || window.__M.rallyT < 8") and page.evaluate("() => window.__BO.hp") == page.evaluate("() => window.__bh") and not page.evaluate("() => window.__BO.rallied"), 'a boss in his square is never boosted')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_marshal_continue(browser, url):
    """A continued night respawns ordinary monsters fresh: `rallied` and the rally clock do not survive, and the continue itself works cleanly."""
    if not R8: return
    page, errors = marshal_scene(browser, url)
    page.evaluate("() => { window.__gg.G.spawned = 5; }")
    page.evaluate(STEP, [85, 0.1])
    ok(page.evaluate("() => window.__A.rallied") is True, 'the ghoul was rallied before the loss')
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); g.continueNight(c); }"); time.sleep(0.3); hold(page)
    page.evaluate("() => { const g = window.__gg; g.G.spawnTimer = 999; g.G.sproutT = -999; g.G.monsters.length = 0; }")
    spawn_at(page, 'marshal', 3, 0.5, sp=0); page.evaluate("() => { window.__M = window.__last; }")
    spawn_at(page, 'ghoul', 4, 0.5, hp=3, sp=0); page.evaluate("() => { window.__A = window.__last; }")
    ok(page.evaluate("() => [window.__A.hp, !!window.__A.rallied, window.__M.rallying, window.__M.rallyT]") == [3, False, False, 8], 'after the continue a returning ghoul and Marshal start fresh (nothing carried: monsters respawn)')
    page.evaluate(STEP, [85, 0.1])
    ok(page.evaluate("() => [window.__A.hp, window.__A.rallied]") == [6, True], 'and the fresh Marshal rallies on a fresh clock')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_marshal_budget(browser, url):
    """The rally square is one baked sprite: a rallying Marshal adds at most 1 drawImage a frame over a quiet one, and no fill, stroke or gradient."""
    if not R8: return
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillRect', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; } })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm4_start(page, 1); time.sleep(1.0)
    page.evaluate(NQ)
    spawn_at(page, 'marshal', 3, 0.5, sp=0); page.evaluate("() => { window.__M = window.__last; window.__M.rallyT = 1e9; }")
    time.sleep(0.5)
    count = "() => new Promise(res => { window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 30) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.drawImage || 0) / 30, (c.fill || 0) / 30, (c.stroke || 0) / 30, (c.createRadialGradient || 0) / 30]); } }; requestAnimationFrame(tick); })"
    base = page.evaluate(count)
    page.evaluate("() => { window.__M.rallying = true; window.__M.rallyLeft = 1e9; }"); time.sleep(0.5)
    lit = page.evaluate(count)
    ok(lit[0] - base[0] <= 1.05 and lit[0] - base[0] >= 0.9, f'the rally square costs one drawImage a frame ({base[0]:.1f} -> {lit[0]:.1f})')
    ok(lit[1] <= base[1] + 0.1 and lit[2] <= base[2] + 0.1 and lit[3] <= base[3] + 0.1, 'and no fill, stroke or gradient')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()



# ---------- Task 5: the Blood Glutton, the Bat Bride and the shield door ----------
OWN = "(id) => { const g = window.__gg; return g.netSnapshot().cells.filter(c => c[2] === 'red' && c[3] === id).length + g.G.netsFlying.filter(f => f.kind === 'red' && f.by === id).length; }"
NODMG = "() => window.__gg.G.floats.some(f => f.text === 'No damage')"


def shield_night(browser, url):
    page, errors = net_night(browser, url); hold(page)
    page.evaluate(FILL)
    return page, errors


def check_glutton(browser, url):
    if not R8:
        page, errors = open_page(browser, url)
        has = page.evaluate("() => !!window.__gg.TYPES") and page.evaluate("() => !!(window.__gg.TYPES.glutton || window.__gg.TYPES.bride)")
        ok(not has, 'no Glutton or Bride type below Release 8')
        page.close(); return
    page, errors = shield_night(browser, url)
    T = page.evaluate("() => window.__gg.TYPES.glutton")
    ok(T == {'hp': 8, 'sp': 0.03, 'r': 24, 'coins': 12, 'eat': 0.5, 'pts': 34, 'drop': 3, 'netsAtSpawn': 2, 'netEvery': 10, 'netMax': 2}, f'the glutton numbers are the brief ones {T}')
    spawn_at(page, 'glutton', 3, 0.4, sp=0); page.evaluate("() => { window.__U = window.__last; }")
    fl = page.evaluate("() => window.__gg.G.netsFlying.map(f => [f.kind, f.by === window.__U.id])")
    ok(fl == [['red', True], ['red', True]], f'at spawn it throws two red nets of its own {fl}')
    page.evaluate(STEP, [2, 0.1])      # 0.2 s: both nets still in the air
    page.evaluate("() => window.__gg.damage(window.__U, 3)")
    ok(page.evaluate("() => window.__gg.G.netsFlying.length") == 2 and page.evaluate("() => window.__U.hp") == 8, 'a hit 0.2 s after it spawns does no damage: its nets in flight already shield it (controller ruling)')
    page.evaluate(STEP, [10, 0.1])
    ok(page.evaluate("() => window.__gg.redNetsOf(window.__U)") == 2, 'both land: two red nets of its own on the patch')
    page.evaluate("() => window.__gg.damage(window.__U, 3)")
    ok(page.evaluate("() => window.__U.hp") == 8 and page.evaluate(NODMG), 'with its nets on the patch it takes no damage ("No damage")')
    page.evaluate("() => { let one = false; window.__gg.clearNets(c => c.netBy === window.__U.id && !one && (one = true)); }")
    page.evaluate("() => window.__gg.damage(window.__U, 3)")
    ok(page.evaluate("() => window.__gg.redNetsOf(window.__U)") == 1 and page.evaluate("() => window.__U.hp") == 8, 'one net left: still no damage')
    page.evaluate("() => { window.__gg.clearNets(c => c.netBy === window.__U.id); }")
    page.evaluate("() => window.__gg.damage(window.__U, 3)")
    ok(page.evaluate("() => window.__U.hp") == 5, f'both nets gone (flown): it takes damage ({page.evaluate("() => window.__U.hp")})')
    # the clock: every 10 s one more, only while it has fewer than 2
    page.evaluate(NQ); page.evaluate(FILL)
    spawn_at(page, 'glutton', 3, 0.4, sp=0); page.evaluate("() => { window.__U = window.__last; }")
    page.evaluate(STEP, [99, 0.1])     # 9.9 s
    ok(page.evaluate(OWN, page.evaluate("() => window.__U.id")) == 2, 'two of its own before 10 s')
    page.evaluate(STEP, [6, 0.1])      # 10.5 s: it holds 2, so no third
    uid = page.evaluate("() => window.__U.id")
    ok(page.evaluate(OWN, uid) == 2 and page.evaluate("() => window.__gg.netCount()") == 2, 'at 10 s with two standing it throws none (at most 2)')
    page.evaluate("() => { let one = false; window.__gg.clearNets(c => c.netBy === window.__U.id && !one && (one = true)); }")
    ok(page.evaluate(OWN, uid) == 1, 'one of its nets flies away')
    page.evaluate(STEP, [90, 0.1])     # 19.5 s
    ok(page.evaluate(OWN, uid) == 1, 'no new net before the next 10 s tick')
    page.evaluate(STEP, [10, 0.1])     # 20.5 s (the tick lands at 20 s, give or take a step of float drift)
    ok(page.evaluate(OWN, uid) == 2, f'at 20 s, below 2, it throws one more ({page.evaluate(OWN, uid)})')
    page.evaluate(STEP, [100, 0.1])    # 30.5 s
    ok(page.evaluate(OWN, uid) == 2, 'and never a third')
    # dying with nets in flight: they land as ordinary nets
    page.evaluate(NQ); page.evaluate(FILL)
    spawn_at(page, 'glutton', 3, 0.4, sp=0); page.evaluate("() => { window.__U = window.__last; window.__gg.damage(window.__U, 99); }")
    ok(not page.evaluate("() => window.__U.dead"), 'with its nets still in flight it cannot be killed')
    page.evaluate("() => { window.__U.dead = true; window.__gg.keepFalls(window.__U); }")   # forced: as a later boss's own death may
    page.evaluate(STEP, [10, 0.1])
    cells = page.evaluate("() => window.__gg.netSnapshot().cells.map(c => [c[2], c[3]])")
    ok(cells == [['net', None], ['net', None]], f'its red nets land as ordinary nets with no thrower {cells}')
    # and red nets on the patch turn ordinary when it dies (forced: its shield is up)
    page.evaluate(NQ); page.evaluate(FILL)
    spawn_at(page, 'glutton', 3, 0.4, sp=0); page.evaluate("() => { window.__U = window.__last; }"); page.evaluate(STEP, [10, 0.1])
    ok(page.evaluate("() => window.__gg.redNetsOf(window.__U)") == 2, 'two red nets of its own on the patch')
    page.evaluate("() => { window.__U.dead = true; window.__gg.keepFalls(window.__U); }")   # forced: no hit can kill it while they stand (a later boss's death may)
    cells = page.evaluate("() => window.__gg.netSnapshot().cells.map(c => [c[2], c[3]])")
    ok(cells == [['net', None], ['net', None]], f'its red nets left on the patch turn ordinary {cells}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def bride_scene(page):
    page.evaluate(NQ); page.evaluate(FILL)
    spawn_at(page, 'bride', 3, 0.4, sp=0); page.evaluate("() => { window.__R = window.__last; }")
    spawn_at(page, 'ghoul', 4, 0.45, hp=3, sp=0); page.evaluate("() => { window.__A = window.__last; }")   # nearest, beside her
    spawn_at(page, 'ghoul', 3, 0.7, hp=3, sp=0); page.evaluate("() => { window.__B = window.__last; }")    # her lane, farther
    spawn_at(page, 'ghoul', 5, 0.4, hp=3, sp=0); page.evaluate("() => { window.__C = window.__last; }")    # two lanes away: out of reach


def check_bride(browser, url):
    if not R8: return
    page, errors = shield_night(browser, url)
    T = page.evaluate("() => window.__gg.TYPES.bride")
    ok(T == {'hp': 6, 'sp': 0.035, 'r': 22, 'coins': 10, 'eat': 0.5, 'pts': 30, 'drop': 2, 'veilReach': 1, 'veilAgain': 3}, f'the bride numbers are the brief ones {T}')
    bride_scene(page)
    page.evaluate(STEP, [2, 0.1])
    v = page.evaluate("() => [window.__A.veilBy === window.__R.id, window.__B.veilBy || null, window.__C.veilBy || null, window.__R.veilBy || null]")
    ok(v == [True, None, None, None], f'she veils the nearest other monster within a lane, only one, never herself {v}')
    page.evaluate("() => { const g = window.__gg; g.damage(window.__A, 1); g.damage(window.__B, 1); }")
    ok(page.evaluate("() => [window.__A.hp, window.__B.hp]") == [3, 2] and page.evaluate(NODMG), 'the veiled one takes no damage, the other does')
    # the veiled one leaves the field (a non-damage exit): 3 s later she veils the next
    page.evaluate("() => { window.__A.dead = true; }")
    page.evaluate(STEP, [29, 0.1])
    ok(not page.evaluate("() => window.__B.veilBy"), 'no new veil before 3 s')
    page.evaluate(STEP, [3, 0.1])
    ok(page.evaluate("() => window.__B.veilBy === window.__R.id") and not page.evaluate("() => window.__C.veilBy"), 'after 3 s she veils the next in reach')
    page.evaluate("() => window.__gg.damage(window.__B, 1)")
    ok(page.evaluate("() => window.__B.hp") == 2, 'and it takes no damage')
    # her veil holds only while she is on the field: gone without a kill (removed), the veil is not drawn, does not shield and is cleared
    page.evaluate("() => { const G = window.__gg.G; G.monsters.splice(G.monsters.indexOf(window.__R), 1); }")
    r = page.evaluate("() => [window.__gg.veiledNow(window.__B), window.__gg.shieldedNow(window.__B), window.__B.veilBy == null]")
    ok(r == [False, False, True], f'a Bride gone from the field: no veil drawn, no shield, veilBy cleared {r}')
    page.evaluate("() => window.__gg.damage(window.__B, 1)")
    ok(page.evaluate("() => window.__B.hp") == 1, 'and it takes damage again')
    # another Bride is never veiled (two Brides could shield each other for ever)
    page.evaluate(NQ); page.evaluate(FILL)
    spawn_at(page, 'bride', 3, 0.4, sp=0); page.evaluate("() => { window.__R = window.__last; }")
    spawn_at(page, 'bride', 4, 0.4, sp=0); page.evaluate("() => { window.__R2 = window.__last; }")
    page.evaluate(STEP, [10, 0.1])
    ok(page.evaluate("() => !window.__R.veilBy && !window.__R2.veilBy"), 'two Brides side by side never veil each other')
    # a boss may be veiled
    page.evaluate(NQ); page.evaluate(FILL)
    spawn_at(page, 'bride', 3, 0.3, sp=0); page.evaluate("() => { window.__R = window.__last; }")
    page.evaluate("() => { const b = window.__gg.spawnMonster('boss', 3, true, 0.32); b.summon = 999; b.teleport = 999; window.__BO = b; window.__bh = b.hp; }")
    page.evaluate(STEP, [2, 0.1])
    page.evaluate("() => window.__gg.damage(window.__BO, 2)")
    ok(page.evaluate("() => window.__BO.veilBy === window.__R.id") and page.evaluate("() => window.__BO.hp") == page.evaluate("() => window.__bh"), 'a boss beside her is veiled and takes no damage')
    # she dies: the veil goes
    page.evaluate("() => window.__gg.damage(window.__R, 99)")
    ok(page.evaluate("() => window.__R.dead") and not page.evaluate("() => window.__BO.veilBy"), 'when the Bride dies her veil is cleared')
    page.evaluate("() => window.__gg.damage(window.__BO, 2)")
    ok(page.evaluate("() => window.__BO.hp") == page.evaluate("() => window.__bh") - 2, 'and the boss takes damage again')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_glutton_bride(browser, url):
    if not R8: return
    page, errors = shield_night(browser, url)
    spawn_at(page, 'bride', 3, 0.4, sp=0); page.evaluate("() => { window.__R = window.__last; }")
    spawn_at(page, 'glutton', 4, 0.42, sp=0); page.evaluate("() => { window.__U = window.__last; window.__U.netT = 1e9; }")
    page.evaluate(STEP, [10, 0.1])
    ok(page.evaluate("() => window.__U.veilBy === window.__R.id") and page.evaluate("() => window.__gg.redNetsOf(window.__U)") == 2, 'a veiled Glutton with two red nets')
    page.evaluate("() => { const g = window.__gg; g.clearNets(); g.damage(window.__U, 2); }")
    ok(page.evaluate("() => window.__U.hp") == 8, 'its nets gone, the veil still shields it')
    page.evaluate("() => window.__gg.damage(window.__R, 99)")
    page.evaluate("() => window.__gg.damage(window.__U, 2)")
    ok(page.evaluate("() => window.__R.dead") and page.evaluate("() => window.__U.hp") == 6, 'nets gone and the Bride dead: it takes damage')
    # nets back, Bride dead: shielded again by the nets alone
    page.evaluate("() => { const g = window.__gg; g.grid[0][0].net = 'red'; g.grid[0][0].netBy = window.__U.id; g.damage(window.__U, 2); }")
    ok(page.evaluate("() => window.__U.hp") == 6, 'a red net of its own alone shields it again')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


# every damage source in the game, run on a shielded Glutton (lane 3, p 0.5) and, as a control, on the same Glutton with no net.
# A ghoul (hp 50) beside it in lane 4 at the same height is the first target of the splash and lightning hits.
SRC_SCENE = """([shield, typ]) => { const g = window.__gg, G = g.G; G.monsters.length = 0; G.netsFlying = []; g.clearNets(); G.mines.length = 0; G.glue = []; G.floats.length = 0;
  const u = g.spawnMonster(typ || 'glutton', 3, true, 0.5); u.sp = 0; u.hp = u.maxHp = 40; u.netT = 1e9; G.netsFlying = []; window.__U = u;
  const n = g.spawnMonster('ghoul', 4, true, 0.5); n.sp = 0; n.hp = n.maxHp = 50; window.__N = n;
  if (shield){ g.grid[0][0].net = 'red'; g.grid[0][0].netBy = u.id; } return true; }"""
PR = "(type, m, extra) => ({ type, vis:type, lv:5, size:1, lane:m.lane, x:m.x, y:0, hit:new Set(), grp:{ spawned:true, small:false, kills:0 }, guar:false, trail:[], ...(extra || {}) })"
SOURCES = {
    'pumpkin': f"() => {{ const g = window.__gg, pr = {PR}; g.hitMonster(pr(0, window.__U), window.__U); }}",
    'wartling hit': f"() => {{ const g = window.__gg, pr = {PR}; g.hitMonster(pr(0, window.__U, {{ wart:true }}), window.__U); }}",
    'fire burn': "() => { const g = window.__gg, u = window.__U; u.burnLeft = 3; u.burnAmt = 1; u.burnTick = 0.05; g.update(0.1); g.update(1.1); }",
    'glue': "() => { const g = window.__gg, u = window.__U; g.G.glue = [{ lane:u.lane, row:Math.floor(u.p / g.TILE_P()), t:0, dur:99 }]; for (let i = 0; i < 25; i++) g.update(0.1); }",
    'black splash': f"() => {{ const g = window.__gg, pr = {PR}; g.hitMonster(pr(7, window.__N), window.__N); }}",
    'deep blue lightning': f"() => {{ const g = window.__gg, pr = {PR}; g.hitMonster(pr(8, window.__N), window.__N); }}",
    'mine': "() => { const g = window.__gg, u = window.__U; g.G.mines.push({ lane:u.lane, p:u.p, t:99, dead:false }); g.update(0.1); }",
    'firework': "() => { const g = window.__gg; g.save.fw = 1; g.setState('play'); g.useFirework(); g.setState('pause'); }",
    'bomb': "() => { const g = window.__gg, u = window.__U; g.save.bomb = 1; g.dropBomb(u.x, g.fieldY(u.p)); }",
}


def check_shield_all_sources(browser, url):
    if not R8: return
    page, errors = shield_night(browser, url)
    for name, run in SOURCES.items():
        page.evaluate(SRC_SCENE, [True, None]); page.evaluate(run)
        hp_s = page.evaluate("() => window.__U.hp")
        page.evaluate(SRC_SCENE, [False, None]); page.evaluate(run)
        hp_c = page.evaluate("() => window.__U.hp")
        ok(hp_s == 40 and hp_c < 40, f'{name}: a shielded Glutton keeps its health ({hp_s}/40), an unshielded one is hurt ({hp_c}/40)')
    # the Corn Husker's husk (a hit that strips instead of hurting) stays on while it is veiled
    page.evaluate(SRC_SCENE, [False, 'husker'])
    page.evaluate("() => { const g = window.__gg, r = g.spawnMonster('bride', 3, true, 0.45); r.sp = 0; window.__R = r; for (let i = 0; i < 3; i++) g.update(0.1); }")
    ok(page.evaluate("() => window.__U.veilBy === window.__R.id"), 'a Corn Husker is veiled')
    page.evaluate(SOURCES['pumpkin'])
    ok(page.evaluate("() => [window.__U.type, window.__U.hp]") == ['husker', 40], f'a pumpkin leaves the veiled husker its husk and health {page.evaluate("() => [window.__U.type, window.__U.hp]")}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_shield_continue(browser, url):
    """A continued night respawns ordinary monsters fresh. The living Glutton's red nets wait for the first Glutton to come back and are its own;
    a living Bride's veil goes to the first returning Bride, on a monster of the same type standing on the field. Red nets no Glutton came back for
    turn ordinary once every unbeaten monster is back on the field."""
    if not R8: return
    page, errors = shield_night(browser, url)
    page.evaluate("() => { window.__gg.G.spawned = 5; }")
    spawn_at(page, 'glutton', 2, 0.4, sp=0); page.evaluate("() => { window.__U = window.__last; window.__U.netT = 1e9; }")
    spawn_at(page, 'bride', 5, 0.4, sp=0); page.evaluate("() => { window.__R = window.__last; }")
    spawn_at(page, 'knight', 5, 0.45, sp=0); page.evaluate("() => { window.__K = window.__last; }")
    page.evaluate(STEP, [10, 0.1])
    ok(page.evaluate("() => window.__gg.redNetsOf(window.__U)") == 2 and page.evaluate("() => window.__K.veilBy === window.__R.id"), 'before the loss: two red nets, a veiled knight')
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); g.continueNight(c); }"); time.sleep(0.3); hold(page)
    page.evaluate("() => { const g = window.__gg; g.G.spawnTimer = 999; g.G.sproutT = -999; g.G.monsters.length = 0; }")
    reds = page.evaluate("() => window.__gg.netSnapshot().cells.filter(c => c[2] === 'red').length")
    ok(reds == 2, f'both red nets are back on the continued patch ({reds})')
    spawn_at(page, 'ghoul', 1, 0.3, sp=0)
    spawn_at(page, 'glutton', 2, 0.3, sp=0); page.evaluate("() => { window.__U2 = window.__last; }")
    ok(page.evaluate("() => window.__gg.redNetsOf(window.__U2)") == 2, 'the first Glutton back owns them')
    ok(page.evaluate("() => window.__gg.G.netsFlying.length") == 0, 'and, holding two, throws none at spawn')
    page.evaluate("() => window.__gg.damage(window.__U2, 2)")
    ok(page.evaluate("() => window.__U2.hp") == 8, 'it is shielded by them')
    spawn_at(page, 'knight', 6, 0.3, sp=0); page.evaluate("() => { window.__K2 = window.__last; }")
    spawn_at(page, 'bride', 3, 0.3, sp=0); page.evaluate("() => { window.__R2 = window.__last; }")
    ok(page.evaluate("() => window.__K2.veilBy === window.__R2.id"), 'the first Bride back veils the returning knight (the type she veiled), out of her reach or not')
    # a second continue case: the Glutton never comes back
    page.close()
    page, errors2 = shield_night(browser, url)
    page.evaluate("() => { window.__gg.G.spawned = 5; }")
    spawn_at(page, 'glutton', 2, 0.4, sp=0); page.evaluate("() => { window.__U = window.__last; window.__U.netT = 1e9; }")
    page.evaluate(STEP, [10, 0.1])
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); g.continueNight(c); }"); time.sleep(0.3); hold(page)
    page.evaluate("() => { const g = window.__gg; g.G.spawnTimer = 999; g.G.sproutT = -999; g.G.monsters.length = 0; }")
    page.evaluate(STEP, [2, 0.1])
    ok(page.evaluate("() => window.__gg.netSnapshot().cells.filter(c => c[2] === 'red').length") == 2, 'red nets wait while unbeaten monsters are still to come')
    page.evaluate("() => { const g = window.__gg; g.G.spawned = g.G.def.total; }"); page.evaluate(STEP, [2, 0.1])
    cells = page.evaluate("() => window.__gg.netSnapshot().cells.map(c => [c[2], c[3]])")
    ok(len(cells) == 2 and all(c == ['net', None] for c in cells), f'every unbeaten monster back and no Glutton among them: its red nets turn ordinary {cells}')
    ok(not errors and not errors2, f'no page errors {(errors + errors2)[:2]}')
    page.close()


def check_veil_budget(browser, url):
    """The veil is one baked sprite: a veiled monster adds at most 1 drawImage a frame, and no fill, stroke or gradient."""
    if not R8: return
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillRect', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; } })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm4_start(page, 1); time.sleep(1.0)
    page.evaluate(NQ)
    spawn_at(page, 'ghoul', 3, 0.5, sp=0); page.evaluate("() => { window.__A = window.__last; }")
    spawn_at(page, 'bride', 6, 0.5, sp=0); page.evaluate("() => { window.__R = window.__last; window.__R.veilT = 1e9; }")
    time.sleep(0.6)
    count = "() => new Promise(res => { window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 30) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.drawImage || 0) / 30, (c.fill || 0) / 30, (c.stroke || 0) / 30, (c.createRadialGradient || 0) / 30]); } }; requestAnimationFrame(tick); })"
    base = page.evaluate(count)
    page.evaluate("() => { window.__A.veilBy = window.__R.id; window.__R.veil = window.__A; }"); time.sleep(0.4)
    lit = page.evaluate(count)
    ok(0.9 <= lit[0] - base[0] <= 1.05, f'the veil costs one drawImage a frame ({base[0]:.1f} -> {lit[0]:.1f})')
    ok(lit[1] <= base[1] + 0.1 and lit[2] <= base[2] + 0.1 and lit[3] <= base[3] + 0.1, 'and no fill, stroke or gradient')
    page.evaluate("() => { window.__A.veilBy = 987654; }"); time.sleep(0.3)   # a veilBy whose Bride is gone (no monster has that id): the veil must not be drawn
    gone = page.evaluate(count)
    ok(abs(gone[0] - base[0]) <= 0.1, f'with its Bride gone the veil is no longer drawn ({lit[0]:.1f} -> {gone[0]:.1f}, base {base[0]:.1f})')
    ok(page.evaluate("() => window.__A.veilBy == null"), 'and its veilBy is cleared')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()



# ---------- Task 6: the Gatehouse and the Archer Tower ----------
PR = """([t, lane]) => { const g = window.__gg; const pr = { x:g.LANE(lane), y:g.fieldY(1) + 40, vy:-900, type:t, vis:t, lv:1, guar:false, lane, hitWalls:new Set(), grp:{ spawned:false, small:false, kills:0 }, size:1, rot:0, spin:9, hit:new Set(), trail:[], r:16, dead:false }; g.G.projs.push(pr); window.__pr = pr; return true; }"""
FLY = "() => { const g = window.__gg; for (let i = 0; i < 200 && !window.__pr.dead; i++) g.update(0.01); return window.__pr.dead; }"
PUT = "([lane, p, kind]) => { const g = window.__gg; const w = g.newCastle(lane, p, kind, 12); g.G.castles.push(w); window.__w = w; return true; }"


def piece_night(browser, url):
    page, errors = net_night(browser, url); hold(page)
    page.evaluate("() => { const G = window.__gg.G; G.castles.length = 0; G.arrows.length = 0; for (let l = 0; l < 7; l++) { const w = window.__gg.walls[l]; w.max = 40; w.hp = 40; } }")
    return page, errors


def check_gatehouse(browser, url):
    if not R8:
        page, errors = open_page(browser, url)
        ok(page.evaluate("() => !window.__gg.newCastle && !window.__gg.PIECES"), 'no castle pieces below Release 8')
        nm = page.evaluate("() => { const g = window.__gg; g.startGame('story', 1, [0, 1, 2, 3]); return g.G.castles.every(c => c.kind === undefined); }")
        ok(nm, 'a plain castle wall carries no kind below Release 8')
        page.close(); return
    page, errors = piece_night(browser, url)
    ok(page.evaluate("() => window.__gg.PIECES.gateHp === 2.5 && window.__gg.PIECES.gateEvery === 8 && window.__gg.PIECES.towerHp === 1.5 && window.__gg.PIECES.towerShot === 5"), 'the piece numbers are the spec ones')
    page.evaluate("() => { window.__gg.G.def.gatePool = ['ghoul']; }")
    page.evaluate(PUT, [3, 0.5, 'gate'])
    ok(page.evaluate("() => [window.__w.kind, window.__w.hp, window.__w.maxHp]") == ['gate', 30, 30], 'a Gatehouse has 2.5 x the level castle health (12 -> 30)')
    mine = "() => window.__gg.G.monsters.filter(m => m.fromGate && !m.dead)"
    page.evaluate(STEP, [75, 0.1])
    ok(page.evaluate("() => window.__gg.G.monsters.filter(m => m.fromGate).length") == 0, 'nothing walks out in the first 7.5 s')
    page.evaluate(STEP, [10, 0.1])
    r = page.evaluate("() => window.__gg.G.monsters.filter(m => m.fromGate).map(m => [m.type, m.lane, m.p])")
    ok(len(r) == 1 and r[0][0] == 'ghoul' and r[0][1] == 3 and 0.5 <= r[0][2] < 0.6, f'at 8 s one monster from the pool walks out of the gate, in its lane {r}')
    ok(page.evaluate("() => window.__w.anim && window.__w.anim.clip") == 'shut', 'and the gate plays its shut clip')
    page.evaluate("() => { for (const m of window.__gg.G.monsters) m.sp = 0; }")
    page.evaluate(STEP, [60, 0.1])
    ok(page.evaluate("() => window.__gg.G.monsters.filter(m => m.fromGate).length") == 1, 'one at a time: still one at 14.5 s')
    page.evaluate(STEP, [20, 0.1])
    ok(page.evaluate("() => window.__gg.G.monsters.filter(m => m.fromGate).length") == 2, 'the next one at 16 s, no queue')
    ok(page.evaluate("() => window.__gg.G.monsters.every(m => !m.fromGate || m.minion)"), 'summoned monsters are extras (minions), not part of the night count')
    # a Green hits the gate, not what stands behind it
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; g.G.def.gatePool = null; }")
    spawn_at(page, 'ghoul', 3, 0.3, hp=10, sp=0)
    page.evaluate(PR, [0, 3]); fl = page.evaluate(FLY)
    ok(fl and page.evaluate("() => window.__w.hp") < 30 and page.evaluate("() => window.__last.hp") == 10, f'a Green stops at the gate and hurts it, the ghoul behind is untouched (gate {page.evaluate("() => window.__w.hp")}/30)')
    # Grey passes a Gatehouse: it deals its power and continues to the monster behind
    spawn_at(page, 'ghoul', 3, 0.3, hp=10, sp=0)
    g0 = page.evaluate("() => window.__w.hp")
    page.evaluate(PR, [4, 3]); page.evaluate(FLY)
    ok(page.evaluate("() => window.__w.hp") < g0 and page.evaluate("() => window.__last.hp") < 10, 'a Grey damages the Gatehouse and continues to the monster behind it')
    # an empty pool summons nothing
    page.evaluate(STEP, [100, 0.1])
    ok(page.evaluate("() => window.__gg.G.monsters.filter(m => m.fromGate).length") == 0, 'a level with no gatePool summons nothing')
    # destroyed: no more
    page.evaluate("() => { const g = window.__gg; g.G.def.gatePool = ['ghoul']; g.G.monsters.length = 0; g.damageCastle(window.__w, 1000); }")
    page.evaluate(STEP, [250, 0.1])
    ok(page.evaluate("() => window.__w.dead") and page.evaluate("() => window.__gg.G.castles.length") == 0 and page.evaluate("() => window.__gg.G.monsters.filter(m => m.fromGate).length") == 0, 'a broken Gatehouse is gone and summons no more')
    ok(page.evaluate("() => window.__gg.G.crumbles.length") == 0, 'its crumble has played and settled')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_archer_tower(browser, url):
    if not R8: return
    page, errors = piece_night(browser, url)
    page.evaluate(PUT, [4, 0.5, 'tower'])
    ok(page.evaluate("() => [window.__w.kind, window.__w.hp, window.__w.maxHp]") == ['tower', 18, 18], 'an Archer Tower has 1.5 x the level castle health (12 -> 18)')
    page.evaluate(STEP, [49, 0.1])
    ok(page.evaluate("() => window.__gg.G.arrows.length") == 0, 'no arrow in the first 4.9 s')
    page.evaluate(STEP, [10, 0.1])
    ok(page.evaluate("() => window.__gg.G.arrows.length") == 1 and page.evaluate("() => window.__gg.G.arrows[0].lane") == 4, 'an arrow leaves at 5 s down its lane')
    page.evaluate(STEP, [61, 0.1])
    ok(page.evaluate("() => window.__gg.walls[4].hp") == 34, f'two arrows by 12 s take 3 each from the fence ({page.evaluate("() => window.__gg.walls[4].hp")}/40)')
    # a fence that is down is not shot at
    page.evaluate("() => { window.__gg.G.arrows.length = 0; window.__gg.walls[4].hp = 0; }")
    page.evaluate(STEP, [120, 0.1])
    ok(page.evaluate("() => window.__gg.G.arrows.length") == 0, 'a fallen fence is not shot at')
    page.evaluate("() => { window.__gg.walls[4].hp = 40; window.__w.t = 5; }")
    # Grey stops at a tower (and still passes a plain wall)
    page.evaluate("() => { window.__gg.G.monsters.length = 0; }")
    spawn_at(page, 'ghoul', 4, 0.3, hp=10, sp=0)
    page.evaluate(PR, [4, 4]); fl = page.evaluate(FLY)
    ok(fl and page.evaluate("() => window.__w.hp") < 18 and page.evaluate("() => window.__last.hp") == 10, 'a Grey stops at the tower and does not reach the archer-side monster behind it')
    page.evaluate("() => window.__gg.G.castles.push(window.__gg.newCastle(2, 0.5, 'wall', 12))")
    spawn_at(page, 'ghoul', 2, 0.3, hp=10, sp=0)
    page.evaluate(PR, [4, 2]); page.evaluate(FLY)
    ok(page.evaluate("() => window.__gg.G.castles.find(c => c.lane === 2).hp") < 12 and page.evaluate("() => window.__last.hp") < 10, 'a Grey still deals its power to a plain wall and continues to the monster behind')
    # the fall
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; g.G.arrows.length = 0; g.G.projs.length = 0; window.__w.t = 3; g.damageCastle(window.__w, 1000); }")
    a = page.evaluate("() => { const m = window.__gg.G.monsters.find(m => m.type === 'archer'); return m ? [m.lane, m.p, m.stunT, m.hp, m.fromTower, m.shootT] : null; }")
    ok(a is not None and a[0] == 4 and abs(a[1] - 0.5) < 1e-9 and a[2] == 0 and a[4], f'on its fall a Skeleton Archer stands at its p, not stunned {a}')
    ok(page.evaluate("() => window.__gg.G.crumbles.length") == 1 and page.evaluate("() => window.__gg.G.crumbles[0].kind") == 'tower', 'and the crumble plays')
    page.evaluate(STEP, [1, 0.1])
    ok(page.evaluate("() => window.__gg.G.castles.filter(c => c.kind === 'tower').length") == 0, 'the tower is gone')
    shot = page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 80; i++){ g.update(0.1); if (g.G.arrows.some(a => a.lane === 4)) return i * 0.1; } return -1; }")
    ok(0 <= shot <= a[5] + 0.2, f'the archer shoots by its set reload ({shot:.1f} s, shootT {a[5]:.1f}), no daze')
    page.evaluate(STEP, [20, 0.1])
    ok(page.evaluate("() => { const m = window.__gg.G.monsters.find(m => m.type === 'archer'); return !!m && m.p === 0.5; }"), 'and it holds there like any archer')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_castle_pieces_continue(browser, url):
    """A continued night rebuilds castles from the level as it does walls: pieces come back with their kind, full health and a fresh clock."""
    if not R8: return
    page, errors = open_page(browser, url)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true, seenGourdCoach:true })")
    page.evaluate("() => { const L = window.__gg.NIGHTMARE_LEVELS[3][0]; window.__L0 = [L.castlesLayout, L.castles, L.gatePool]; L.castles = { n:3, hp:12 }; L.castlesLayout = [[2, 0.5, 'gate'], [4, 0.5, 'tower'], [6, 0.4]]; L.gatePool = ['ghoul']; }")
    nm4_start(page, 1); time.sleep(0.4); hold(page)
    page.evaluate("() => { const G = window.__gg.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; }")
    ok(page.evaluate("() => window.__gg.pieceBakeStats().canvases") == 141, 'a night whose layout holds a gate or tower bakes all 141 frames at night start')
    c = page.evaluate("() => window.__gg.G.castles.map(c => [c.lane, c.kind, c.hp, c.maxHp])")
    ok(c == [[2, 'gate', 30, 30], [4, 'tower', 18, 18], [6, 'wall', 12, 12]], f'castlesLayout kinds build the pieces {c}')
    page.evaluate(STEP, [30, 0.1])
    page.evaluate("() => { const g = window.__gg; g.G.castles[0].hp = 7; g.damageCastle(g.G.castles[1], 1000); }")
    page.evaluate(STEP, [3, 0.1])
    st = page.evaluate("() => { const g = window.__gg, c = g.continueState(); return c ? 1 : 0; }")
    ok(st == 1, 'the lost night can be continued')
    page.evaluate("() => { const g = window.__gg; g.continueNight(g.continueState()); }"); time.sleep(0.4); hold(page)
    page.evaluate("() => { const G = window.__gg.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; }")
    c = page.evaluate("() => window.__gg.G.castles.map(c => [c.lane, c.kind, c.hp, c.maxHp, c.t])")
    ok([x[:4] for x in c] == [[2, 'gate', 30, 30], [4, 'tower', 18, 18], [6, 'wall', 12, 12]] and 7 < c[0][4] <= 8 and 4 < c[1][4] <= 5, f'the pieces come back as walls do: their kind, full health, a fresh clock {c}')
    page.evaluate(STEP, [85, 0.1])
    ok(page.evaluate("() => window.__gg.G.monsters.filter(m => m.fromGate).length") == 1, 'and the returned Gatehouse summons on its fresh clock')
    page.evaluate("() => { const L = window.__gg.NIGHTMARE_LEVELS[3][0]; [L.castlesLayout, L.castles, L.gatePool] = window.__L0; }")
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_castle_pieces_budget(browser, url):
    """Pieces are baked frames: a Gatehouse and a Tower add at most 2 drawImage calls a frame (plus the two health-bar fills each), no stroke or gradient."""
    if not R8: return
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillRect', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; } })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm4_start(page, 1); time.sleep(1.0)
    page.evaluate(NQ); page.evaluate("() => { window.__gg.G.castles.length = 0; window.__gg.G.def.gatePool = null; }")
    # N4-1 has no piece in its layout, so nothing is baked yet: bake as a night with pieces does, and time it
    ok(page.evaluate("() => window.__gg.pieceBakeStats().canvases") == 0, 'a night with no gate, tower or Fallen Count bakes no pieces')
    ms = page.evaluate("() => { const g = window.__gg; g.resetPieces(); const t0 = performance.now(); g.prebakeCastlePieces(); return performance.now() - t0; }")
    st0 = page.evaluate("() => window.__gg.pieceBakeStats()")
    print(f'       bake cost: {st0["canvases"]} canvases, {st0["pixels"]} px ({st0["pixels"] * 4 / 1048576:.1f} MB) at K {st0["k"]}, {ms:.0f} ms')
    ok(st0['canvases'] == 141 and st0['k'] <= 1, f'every clip of both kinds at every damage state is baked, at a scale capped at 1 ({st0["canvases"]} canvases, K {st0["k"]})')
    count = "() => new Promise(res => { window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 30) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.drawImage || 0) / 30, (c.fill || 0) / 30, (c.stroke || 0) / 30, ((c.createRadialGradient || 0) + (c.createLinearGradient || 0)) / 30]); } }; requestAnimationFrame(tick); })"
    base = page.evaluate(count)
    page.evaluate("() => { const g = window.__gg; g.G.castles.push(g.newCastle(2, 0.5, 'gate', 12), g.newCastle(4, 0.5, 'tower', 12)); }")
    lit = page.evaluate(count)
    # play every clip and damage state: a shot, a summon, hits, a fall
    page.evaluate("() => { const g = window.__gg; g.G.def.gatePool = ['ghoul']; const [a, b] = g.G.castles; a.t = 1.2; b.t = 0.3; }")
    page.evaluate("() => { const g = window.__gg; for (const c of g.G.castles.slice()) g.damageCastle(c, c.maxHp * 0.4); }"); time.sleep(0.8)
    page.evaluate("() => { const g = window.__gg; for (const c of g.G.castles.slice()) g.damageCastle(c, c.maxHp * 0.3); }"); time.sleep(0.8)
    page.evaluate("() => { const g = window.__gg; for (const c of g.G.castles.slice()) g.damageCastle(c, 1000); }"); time.sleep(1.8)
    st1 = page.evaluate("() => window.__gg.pieceBakeStats()")
    ok(st1['bakes'] == st0['bakes'], f'nothing bakes during play: shots, summons, damage states and falls ({st0["bakes"]} -> {st1["bakes"]})')
    ok(lit[0] - base[0] <= 2.1, f'a Gatehouse and a Tower add at most 2 drawImage calls a frame ({base[0]:.1f} -> {lit[0]:.1f})')
    ok(lit[2] <= base[2] + 0.1 and lit[3] <= base[3] + 0.1, f'and no stroke or gradient (stroke {base[2]:.1f} -> {lit[2]:.1f}, gradients {base[3]:.1f} -> {lit[3]:.1f})')
    ok(lit[1] - base[1] <= 4.1, f'the health bars are the only fills ({base[1]:.1f} -> {lit[1]:.1f})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


# ---------- Task 8: the Siege Tower ----------
SIEGE_UP = """([form]) => { const g = window.__gg, G = g.G; G.monsters.length = 0; G.arrows.length = 0; G.netsFlying = []; g.grid.forEach(r => r.forEach((c, i, a) => { if (c) c.net = null; }));
  G.def.boss = 'siegetower'; G.def.bossForm = form; G.def.bossChest = 'normal'; G.bossSpawned = true; G.bossDead = false;
  const b = g.spawnMonster('boss'); b.sp = 0; b.p = 0.2; window.__b = b; return [b.kind, b.hp, b.maxHp, b.archers, b.hold, b.form, b.id != null]; }"""
HITB = """([t]) => { const g = window.__gg, b = window.__b; const pr = { type:t, vis:t, lv:1, size:1, lane:b.lane, x:b.x, y:0, hit:new Set(), grp:{ spawned:true, small:false, kills:0 }, guar:false, trail:[] };
  g.hitMonster(pr, b); return [b.archers, b.hp, b.dead]; }"""
PARK = "() => { const b = window.__b; b.volleyT = b.netT = b.rampT = 999; }"


def check_siege(browser, url):
    if not R8:
        page, errors = open_page(browser, url)
        ok(page.evaluate("() => !window.__gg.TYPES.siegetower && !window.__gg.BOSS_NAMES.siegetower"), 'no Siege Tower below Release 8')
        page.close(); return
    page, errors = piece_night(browser, url)
    d = page.evaluate("() => { const T = window.__gg.TYPES.siegetower; return T ? [T.boss, T.hp, T.r, T.sp, T.coins, T.eat, T.pts, T.drop, T.hold, T.archers, T.volleyEvery, T.volleyDmg, T.netEvery, T.rampEvery, T.noItems, T.form2.hp] : null; }")
    ok(d == [True, 24, 34, 0.012, 40, 0, 300, 6, 0.35, 2, 6, 3, 9, 12, True, 34], f'Siege Tower data {d}')
    ok(page.evaluate("() => window.__gg.BOSS_NAMES.siegetower") == 'The Siege Tower', 'its name on screen is "The Siege Tower"')
    intro = page.evaluate("() => window.__gg.BOSS_INTRO.siegetower || null")
    ok(bool(intro) and 'archer' in intro['1'].lower() and '2' in intro, f'it has boss intro texts for both forms {intro and list(intro)}')
    b = page.evaluate(SIEGE_UP, [1])
    ok(b == ['siegetower', 24, 24, 2, 0.35, 1, True], f'it arrives with 24 health, two archers, holding at 0.35 {b}')
    page.evaluate(PARK)
    # plain damage that is not a pumpkin's hit does not knock an archer off, and does not hurt it either
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 5, '#fff'); }")
    ok(page.evaluate("() => [window.__b.archers, window.__b.hp]") == [2, 24], 'splash, burns and tools do nothing while archers stand (only a pumpkin hit knocks one off)')
    h1 = page.evaluate(HITB, [0]); h2 = page.evaluate(HITB, [0]); h3 = page.evaluate(HITB, [0])
    ok(h1 == [1, 24, False] and h2 == [0, 24, False], f'two pumpkin hits knock the archers off with no health lost {h1} {h2}')
    ok(h3[0] == 0 and h3[1] < 24, f'the third hurts it {h3}')
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 1, '#fff'); }")
    ok(page.evaluate("() => window.__b.hp") < h3[1], 'and with the archers gone any damage hurts it')
    # immune to freeze and knockback
    page.evaluate(SIEGE_UP, [1]); page.evaluate(PARK); page.evaluate(HITB, [2])
    ok(page.evaluate("() => [window.__b.frozenT, window.__b.kb]") == [0, 0], 'an Ice hit does not freeze it and nothing knocks it back')
    # the clocks: volley at 6 s, net at 9 s, ramp at 12 s
    page.evaluate(SIEGE_UP, [1])
    page.evaluate("() => { for (let c = 0; c < 6; c++) window.__put(2, c, 0); }")   # a net needs a pumpkin to land on
    page.evaluate(STEP, [59, 0.1])
    ok(page.evaluate("() => window.__gg.G.arrows.filter(a => !a.dead).length") == 0, 'no volley in the first 5.9 s')
    page.evaluate(STEP, [3, 0.1])
    ar = page.evaluate("() => window.__gg.G.arrows.filter(a => !a.dead).map(a => [a.lane === window.__b.lane, a.dmg])")
    ok(page.evaluate("() => window.__gg.G.arrows.every(a => a.sp === 0.4 && a.vis === undefined)"), "the arrows are the Skeleton Archer's (speed 0.4, no vis)")
    ok(ar == [[True, 3], [True, 3]], f'at 6 s one arrow per archer goes down its lane for 3 {ar}')
    page.evaluate(STEP, [27, 0.1])
    own = "() => { const g = window.__gg, id = window.__b.id; let n = 0; g.grid.forEach(r => r.forEach(c => { if (c && c.net && c.netBy === id) n++; })); return n + (g.G.netsFlying || []).filter(f => f.by === id).length; }"
    ok(page.evaluate(own) == 0, 'no net before 9 s')
    page.evaluate(STEP, [3, 0.1])
    ok(page.evaluate(own) == 1, 'at 9 s it lobs a net onto the patch (thrown by it)')
    ok(page.evaluate("() => window.__gg.G.monsters.filter(m => m.fromSiege).length") == 0, 'no ramp before 12 s')
    page.evaluate(STEP, [30, 0.1])
    r = page.evaluate("() => window.__gg.G.monsters.filter(m => m.fromSiege).map(m => [m.type, m.minion, m.lane === window.__b.lane, m.p])")
    ok(len(r) == 1 and r[0][0] in ('lancer', 'marshal') and r[0][1] and r[0][2] and 0.24 <= r[0][3] < 0.3, f'at 12 s the ramp releases a Lancer or a Marshal, an extra, just ahead of it {r}')
    # the Marshal rule: never two of its own, and both kinds come
    res = page.evaluate("""() => { const g = window.__gg, G = g.G, b = window.__b; b.volleyT = b.netT = 999; const seen = { lancer:0, marshal:0 }; let maxAlive = 0, reMarshal = false;
      G.monsters.filter(m => m.fromSiege).forEach(m => { m.dead = true; });
      for (let i = 0; i < 80; i++){ b.rampT = 0; g.update(0.05);
        for (const m of G.monsters) if (m.fromSiege && !m.seen){ m.seen = true; seen[m.type]++; if (m.type === 'lancer') m.dead = true; else if (seen.marshal > 1) reMarshal = true; }
        const alive = G.monsters.filter(m => m.fromSiege && m.type === 'marshal' && !m.dead).length; maxAlive = Math.max(maxAlive, alive);
        if (i === 40) G.monsters.filter(m => m.fromSiege && m.type === 'marshal').forEach(m => { m.dead = true; }); }
      return [seen.lancer > 0, seen.marshal >= 1, maxAlive, reMarshal]; }""")
    ok(res[0] and res[1] and res[2] <= 1, f'it releases both kinds and never has two Marshals of its own alive {res}')
    ok(res[3], f'after its released Marshal dies, a later ramp releases a Marshal again {res}')
    ok(page.evaluate("() => window.__gg.TYPES.siegetower.arrowSp") == 0.4, "its arrows fly at the Skeleton Archer's speed")
    # never past hold
    page.evaluate(SIEGE_UP, [1]); page.evaluate(PARK)
    w0 = page.evaluate("() => window.__gg.walls[window.__b.lane].hp")
    page.evaluate("() => { window.__b.sp = 0.5; window.__b.p = 0.3; }"); page.evaluate(STEP, [300, 0.1])
    pp = page.evaluate("() => [window.__b.p, window.__b.eating, window.__gg.walls[window.__b.lane].hp]")
    ok(abs(pp[0] - 0.35) < 1e-6 and not pp[1] and pp[2] == w0, f'it rolls to 0.35 and stops there, never at the wall {pp}')
    # death: its own nets go, others stay, one normal chest
    page.evaluate(SIEGE_UP, [1]); page.evaluate(PARK)
    page.evaluate("""() => { const g = window.__gg, G = g.G, b = window.__b; b.archers = 0;
      window.__put(0, 0, 0, 'net').netBy = b.id; window.__put(0, 1, 0, 'net').netBy = 987654; window.__put(0, 2, 0, 'net').netBy = null; window.__put(1, 0, 0, 'net').netBy = b.id;
      G.netsFlying = [{ x:100, y:100, kind:'net', by:b.id, r:2, c:0, t:0.5 }, { x:100, y:100, kind:'net', by:987654, r:2, c:1, t:0.5 }]; }""")
    c0 = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 99999, '#fff'); }"); time.sleep(0.2)
    nets = page.evaluate("() => { const g = window.__gg; return [g.grid[0][0].net, g.grid[0][1].net, g.grid[0][2].net, g.grid[1][0].net, g.G.netsFlying.map(f => f.by)]; }")
    ok(nets == [None, 'net', 'net', None, [987654]], f'on death its own nets are cleared (patch and in flight), other nets stay {nets}')
    ch = page.evaluate("() => window.__gg.save.chests.slice(%d).map(c => c.kind)" % c0)
    ok(ch == ['normal'] and page.evaluate("() => window.__gg.G.bossDead"), f'it gives one normal chest {ch}')
    ok(page.evaluate("() => window.__gg.G.vfx.some(v => v.kind === 'clip' && v.key === 'siegetower' && v.clip === 'break')"), 'and it collapses (the break clip plays)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_siege_form2(browser, url):
    """N4-13 (bossForm 2): 34 health; one normal chest."""
    if not R8: return
    page, errors = piece_night(browser, url)
    b = page.evaluate(SIEGE_UP, [2])
    ok(b[:3] == ['siegetower', 34, 34] and b[5] == 2 and b[3] == 2, f'in form 2 it arrives with 34 health and two archers {b}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_siege_continue(browser, url):
    """A continued night brings it back with its health, the archers still on it and its three clocks where they were."""
    if not R8: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { const L = window.__gg.NIGHTMARE_LEVELS[3][0]; window.__L0 = [L.boss, L.bossForm, L.bossChest]; L.boss = 'siegetower'; L.bossForm = 1; L.bossChest = 'normal'; }")
    nm4_start(page, 1); time.sleep(0.4); hold(page)
    page.evaluate("() => { const G = window.__gg.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.idle = -1e9; G.hint = null; }")
    page.evaluate("() => { const g = window.__gg, G = g.G; G.bossSpawned = true; const b = g.spawnMonster('boss'); b.sp = 0; b.p = 0.2; window.__b = b; }")
    page.evaluate("() => { const b = window.__b; b.volleyT = 5; b.netT = 6; b.rampT = 7; }")
    page.evaluate(HITB, [0])   # one archer knocked off
    page.evaluate(STEP, [10, 0.1])
    before = page.evaluate("() => { const b = window.__b; return [b.archers, b.hp, +b.volleyT.toFixed(3), +b.netT.toFixed(3), +b.rampT.toFixed(3)]; }")
    ok(before[0] == 1 and before[1] == 24, f'(it lost one archer, no health {before})')
    page.evaluate("() => { const g = window.__gg; g.setState('play'); const c = g.continueState(); g.continueNight(c); g.setState('pause'); }")
    page.evaluate(STEP, [5, 0.02])
    after = page.evaluate("() => { const b = window.__gg.G.monsters.find(m => m.type === 'boss' && !m.dead); return b ? [b.archers, b.hp, +b.volleyT.toFixed(3), +b.netT.toFixed(3), +b.rampT.toFixed(3), b.kind, b.seenHp === b.hp] : null; }")
    page.evaluate("() => { const L = window.__gg.NIGHTMARE_LEVELS[3][0]; [L.boss, L.bossForm, L.bossChest] = window.__L0; }")
    ok(after is not None and after[:5] == before and after[5] == 'siegetower', f'it comes back with its archers left, its health and its clocks as they were {before} -> {after}')
    ok(after is not None and after[6], 'its restored health plays no hit clip')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_siege_baked(browser, url):
    """Its frames (three archer looks) are baked when the night starts, capped like the other bosses' (under 10 MB at bake scale 2.5)."""
    if not R8: return
    page, errors = open_page(browser, url)
    C = page.evaluate("""() => { const C = window.__gg.CHARS.siegetower; if (!C) return null; const n = v => Object.keys(C.clipsFor(v)).sort();
      return [n('a2'), n('a1'), n('a0'), C.vkeyOf({ kind:'siegetower', archers:1 }), C.vkeyOf({ kind:'siegetower', archers:0 }), C.vkeyOf({ kind:'siegetower', archers:2 })]; }""")
    ok(C is not None and C[0] == ['break', 'hit', 'raise', 'ramp', 'volley', 'walk'] and C[1] == ['break', 'hit', 'knock', 'raise', 'ramp', 'volley', 'walk'] and C[2] == ['break', 'hit', 'knock', 'raise', 'ramp', 'walk'], f'each look bakes only the clips it can show {C and C[:3]}')
    ok(C is not None and C[3:] == ['a1', 'a0', 'a2'], f'the look follows the archers left {C and C[3:]}')
    page.evaluate("() => { const L = window.__gg.NIGHTMARE_LEVELS[3][0]; window.__L0 = [L.boss, L.bossForm, L.bossChest]; L.boss = 'siegetower'; L.bossForm = 1; L.bossChest = 'normal'; }")
    page.evaluate("() => window.__gg.setBakeScale(2.5)")
    t0 = time.time(); nm4_start(page, 1); dt = time.time() - t0
    page.evaluate("() => { const L = window.__gg.NIGHTMARE_LEVELS[3][0]; [L.boss, L.bossForm, L.bossChest] = window.__L0; }")
    ok(all(page.evaluate(f"() => window.__gg.isBaked('siegetower|{v}')") for v in ('a2', 'a1', 'a0')), 'starting the night bakes all three looks')
    mb = page.evaluate("() => window.__gg.atlasBytes('siegetower') / 1e6")
    ok(mb < 10, f"the Siege Tower's frames take {mb:.1f} MB at bake scale 2.5 (limit 10)")
    ok(dt < 3, f'the night opens in {dt:.1f} s')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


# ---------- Task 9: the Fallen Count (N4-16) ----------
FC_UP = """() => { const g = window.__gg, G = g.G; G.monsters.length = 0; G.arrows.length = 0; G.netsFlying = []; G.castles.length = 0; G.fcSpears = []; G.fcBolt = null;
  g.grid.forEach(r => r.forEach(c => { if (c) { c.net = null; c.netBy = null; } })); for (let l = 0; l < 7; l++) { const w = g.walls[l]; w.max = 40; w.hp = 40; }
  G.def.boss = 'fallencount'; G.def.bossForm = 1; G.def.bossChest = 'normal'; G.def.gatePool = null; G.bossSpawned = true; G.bossDead = false;
  const b = g.spawnMonster('boss'); b.sp = 0; b.p = 0.2; window.__b = b; return [b.kind, b.hp, b.maxHp, b.hold, b.form, b.id != null]; }"""
FC_PARK = "() => { const b = window.__b; b.tranceT = b.spearT = b.boltT = b.summonT = b.raiseT = 999; }"
FC_CLEAR = "() => { const g = window.__gg, id = window.__b.id; g.clearNets(c => c.netBy === id); g.G.netsFlying = g.G.netsFlying.filter(f => f.by !== id); }"
FC_OWN = "() => { const g = window.__gg, id = window.__b.id; let n = 0; g.grid.forEach(r => r.forEach(c => { if (c && c.net === 'red' && c.netBy === id) n++; })); return n + g.G.netsFlying.filter(f => f.kind === 'red' && f.by === id).length; }"
FC_DMG = "([a]) => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, a, '#fff'); return [+b.hp.toFixed(3), b.dead]; }"


def fc_night(browser, url):
    """A quiet N4 night, paused, every fence at 40, the patch full: then the Count is spawned at p 0.2 (FC_UP) and his first frame throws his start nets."""
    page, errors = piece_night(browser, url)
    page.evaluate(FILL)
    return page, errors


def fc_up(page, park=True, clear=True):
    page.evaluate(FILL)
    b = page.evaluate(FC_UP)
    if park: page.evaluate(FC_PARK)
    page.evaluate(STEP, [1, 0.02])   # his first frame: the start nets
    if clear: page.evaluate(FC_CLEAR)
    return b


def check_fallen_count(browser, url):
    if not R8:
        page, errors = open_page(browser, url)
        ok(page.evaluate("() => !window.__gg.TYPES.fallencount && !window.__gg.BOSS_NAMES.fallencount"), 'no Fallen Count below Release 8')
        page.close(); return
    page, errors = fc_night(browser, url)
    d = page.evaluate("() => { const T = window.__gg.TYPES.fallencount; return T ? [T.boss, T.hp, T.r, T.sp, T.coins, T.eat, T.pts, T.drop, T.hold, T.netAt, T.netN, T.tranceEvery, T.tranceHeal, T.tranceTick, T.tranceHits, T.spearEvery, +T.spearHit.toFixed(6), T.boltEvery, T.boltWarn, T.summonEvery, T.raiseEvery, T.gatePool, T.noItems] : null; }")
    ok(d == [True, 48, 34, 0.03, 50, 0, 400, 6, 0.3, [1, 0.75, 0.5, 0.25], 3, 18, 1, 2, 3, 10, round(1 / 3, 6), 12, 1.5, 14, 20, ['knight', 'bulwark', 'vampire'], True], f'Fallen Count data {d}')
    ok(page.evaluate("() => window.__gg.BOSS_NAMES.fallencount") == 'The Fallen Count', 'his name on screen is "The Fallen Count"')
    intro = page.evaluate("() => window.__gg.BOSS_INTRO.fallencount || null")
    ok(bool(intro) and 'net' in intro['1'].lower() and 'lightning' in intro['1'].lower(), f'he has a boss intro text {intro}')
    b = fc_up(page)
    ok(b == ['fallencount', 48, 48, 0.3, 1, True], f'he arrives with 48 health, holding at 0.3 {b}')
    # walks like the Vampire Count to 0.3, never to the wall, and never changes lane (no bat scatter), with every clock running
    page.evaluate("() => { const b = window.__b; b.sp = 0.5; b.p = 0.25; window.__L = b.lane; window.__W = window.__gg.walls[b.lane].hp; }")
    lanes = page.evaluate("""() => { const g = window.__gg, b = window.__b, seen = new Set(); b.spearT = 999; b.boltT = 2; b.summonT = 4; b.raiseT = 0; b.tranceT = 30;
      for (let i = 0; i < 600; i++){ g.update(0.1); seen.add(b.lane); for (const o of g.G.monsters) if (o !== b) o.dead = true; if (b.dead || g.G.over) break; } return [...seen]; }""")
    pp = page.evaluate("() => [window.__b.p, window.__b.eating, window.__b.lane === window.__L]")
    ok(abs(pp[0] - 0.3) < 1e-6 and not pp[1], f'he walks to 0.3 and holds there, never chewing {pp}')
    ok(lanes == [page.evaluate("() => window.__L")] and not page.evaluate("() => window.__gg.G.over"), f'in 60 s with every clock running he never leaves his lane {lanes}')
    # immune to freeze and knockback
    fc_up(page)
    page.evaluate("() => { const g = window.__gg, b = window.__b; const pr = { type:2, vis:2, lv:1, size:1, lane:b.lane, x:b.x, y:0, hit:new Set(), grp:{ spawned:true, small:false, kills:0 }, guar:false, trail:[] }; g.hitMonster(pr, b); }")
    ok(page.evaluate("() => [window.__b.frozenT, window.__b.kb]") == [0, 0], 'an Ice hit does not freeze him and nothing knocks him back')
    # the spear: every 10 s his fence loses a third of its full health, never its last 1
    fc_up(page)
    page.evaluate("() => { window.__b.spearT = 10; }")
    page.evaluate(STEP, [95, 0.1])
    w = page.evaluate("() => window.__gg.walls[window.__b.lane].hp")
    ok(w == 40, f'no spear before 10 s ({w})')
    page.evaluate(STEP, [15, 0.1])
    w = page.evaluate("() => window.__gg.walls[window.__b.lane].hp")
    ok(abs(w - (40 - 40 / 3)) < 1e-6, f'at 10 s the blood spear takes a third of his fence ({w:.3f} of 40)')
    page.evaluate("() => { window.__gg.walls[window.__b.lane].hp = 5; window.__b.spearT = 0.01; }"); page.evaluate(STEP, [15, 0.1])
    ok(page.evaluate("() => window.__gg.walls[window.__b.lane].hp") == 1, 'a fence at 5 is left at 1, never broken')
    page.evaluate("() => { window.__b.spearT = 0.01; }"); page.evaluate(STEP, [15, 0.1])
    ok(page.evaluate("() => window.__gg.walls[window.__b.lane].hp") == 1, 'a fence at 1 takes nothing')
    ok(page.evaluate("() => window.__gg.G.fcSpears.length") == 0, 'the spears in flight are gone once they land')
    # the bolt: every 12 s a column flashes for 1.5 s, then its pumpkins go
    fc_up(page)
    page.evaluate("() => { window.__b.boltT = 12; }")
    page.evaluate(STEP, [115, 0.1])
    ok(page.evaluate("() => window.__gg.G.fcBolt") is None, 'no lightning warning before 12 s')
    page.evaluate(STEP, [6, 0.1])
    bw = page.evaluate("() => { const f = window.__gg.G.fcBolt; return f ? [f.c >= 0 && f.c < 7, +f.warn.toFixed(2)] : null; }")
    ok(bw is not None and bw[0] and 1.3 <= bw[1] <= 1.5, f'at 12 s a column is warned for 1.5 s {bw}')
    page.evaluate("() => { window.__gg.G.fcBolt.c = 2; }")
    page.evaluate(STEP, [12, 0.1])
    ok(page.evaluate("() => window.__gg.grid.every(r => r[2] != null)"), 'the column still stands during the warning')
    page.evaluate(STEP, [5, 0.1])
    col = page.evaluate("() => window.__gg.grid.map(r => [r[2] == null, r[1] != null, r[3] != null])")
    ok(all(c[0] for c in col) and all(c[1] and c[2] for c in col), f'then the bolt clears that column, and only it {col}')
    # the summons: every 14 s one Storm Lancer and one Bat Bride, extras
    fc_up(page)
    page.evaluate("() => { window.__b.summonT = 14; }")
    page.evaluate(STEP, [135, 0.1])
    ok(page.evaluate("() => window.__gg.G.monsters.filter(m => m.fromCount).length") == 0, 'no summons before 14 s')
    page.evaluate(STEP, [6, 0.1])
    s = page.evaluate("() => window.__gg.G.monsters.filter(m => m.fromCount).map(m => [m.type, m.minion]).sort()")
    ok(s == [['bride', True], ['lancer', True]], f'at 14 s one Storm Lancer and one Bat Bride, both extras {s}')
    # castle pieces: one Archer Tower and one Gatehouse, each rebuilt every 20 s only if none of his stands; his gate sends out his pool
    fc_up(page)
    page.evaluate("() => { window.__b.raiseT = 0.01; }"); page.evaluate(STEP, [1, 0.05])
    pcs = page.evaluate("() => window.__gg.G.castles.filter(w => !w.dead).map(w => [w.kind, w.by === window.__b.id, w.lane !== window.__b.lane]).sort()")
    ok(pcs == [['gate', True, True], ['tower', True, True]], f'he raises one Gatehouse and one Archer Tower, outside his lane {pcs}')
    rt = page.evaluate("() => +window.__b.raiseT.toFixed(2)")
    ok(19 <= rt <= 20, f'and his raise clock restarts at 20 s ({rt})')
    page.evaluate("() => { window.__b.raiseT = 0.01; }"); page.evaluate(STEP, [1, 0.05])
    ok(page.evaluate("() => window.__gg.G.castles.filter(w => !w.dead).length") == 2, 'with both standing, a raise adds nothing')
    page.evaluate("() => { const g = window.__gg; g.damageCastle(g.G.castles.find(w => w.kind === 'gate' && !w.dead), 1000); window.__b.raiseT = 0.01; }"); page.evaluate(STEP, [1, 0.05])
    k = page.evaluate("() => window.__gg.G.castles.filter(w => !w.dead).map(w => w.kind).sort()")
    ok(k == ['gate', 'tower'], f'a broken Gatehouse is rebuilt, the Tower is not doubled {k}')
    pool = page.evaluate("""() => { const g = window.__gg, G = g.G, seen = new Set(), gate = G.castles.find(w => w.kind === 'gate' && !w.dead); window.__b.raiseT = 999;
      for (let i = 0; i < 40; i++){ gate.t = 0.01; g.update(0.05); for (const m of G.monsters) if (m.fromGate && !m.dead){ seen.add(m.type); m.dead = true; } } return [...seen].sort(); }""")
    ok(len(pool) >= 2 and all(t in ('knight', 'bulwark', 'vampire') for t in pool), f'his Gatehouse sends out Shield Knights, Bulwark Knights and Vampires {pool}')
    # the trance clock
    fc_up(page)
    page.evaluate("() => { window.__b.tranceT = 18; }"); page.evaluate(STEP, [175, 0.1])
    ok(page.evaluate("() => window.__b.healing") is False, 'no trance before 18 s')
    page.evaluate(STEP, [6, 0.1])
    ok(page.evaluate("() => [window.__b.healing, window.__b.healHits]") == [True, 3], 'at 18 s he falls into a blood trance that 3 hits break')
    # death: one normal chest; his pieces crumble (no archer from his tower), his nets (patch and flight), bolt and spears go, and the night can end
    fc_up(page)
    page.evaluate("() => { window.__b.raiseT = 0.01; }"); page.evaluate(STEP, [1, 0.05])
    page.evaluate("""() => { const g = window.__gg, G = g.G, b = window.__b; b.fcDone = 4;
      g.grid[0][0].net = 'red'; g.grid[0][0].netBy = b.id; g.grid[2][2].net = 'red'; g.grid[2][2].netBy = b.id; g.grid[4][4].net = 'net'; g.grid[4][4].netBy = null;
      G.netsFlying = [{ x:100, y:100, kind:'red', by:b.id, r:1, c:1, t:0.5 }, { x:100, y:100, kind:'net', by:987654, r:1, c:3, t:0.5 }];
      G.fcBolt = { c:3, warn:1, strike:0 }; G.fcSpears = [{ lane:b.lane, p0:b.p, t:0 }]; G.crumbles = G.crumbles || []; window.__cr0 = G.crumbles.length; }""")
    ok(page.evaluate("() => window.__gg.G.castles.filter(w => !w.dead && w.by === window.__b.id).length") == 2, '(his Tower and Gatehouse stand)')
    c0 = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate("() => { const b = window.__b; b.hp = 0; window.__gg.kill(b); }"); time.sleep(0.2)   # killed outright: his own nets would refuse any hit (the door), but countFalls must still clear them
    ch = page.evaluate("() => window.__gg.save.chests.slice(%d).map(c => c.kind)" % c0)
    ok(ch == ['normal'] and page.evaluate("() => window.__gg.G.bossDead"), f'he gives one normal chest {ch}')
    dd = page.evaluate("""() => { const g = window.__gg, G = g.G, id = window.__b.id;
      return [G.castles.filter(w => w.by === id && !w.dead).length, G.crumbles.slice(window.__cr0).map(c => c.kind).sort(), G.monsters.filter(m => m.type === 'archer' && !m.dead).length,
        [g.grid[0][0].net, g.grid[2][2].net, g.grid[4][4].net], G.netsFlying.map(f => f.by), G.fcBolt, G.fcSpears.length]; }""")
    ok(dd[0] == 0 and dd[1] == ['gate', 'tower'] and dd[2] == 0, f'his Gatehouse and Tower crumble, and no archer climbs out of the rubble {dd[:3]}')
    ok(dd[3] == [None, None, 'net'] and dd[4] == [987654], f'his red nets on the patch and in flight are gone, other nets stay {dd[3:5]}')
    ok(dd[5] is None and dd[6] == 0, f'his lightning and his spears are cleared {dd[5:]}')
    page.evaluate("() => { const G = window.__gg.G; G.spawned = G.def.total; G.monsters.forEach(m => { m.dead = true; }); G.fireBurst = 0; }")
    page.evaluate(STEP, [40, 0.1])
    ok(page.evaluate("() => window.__gg.G.over") is True and page.evaluate("() => window.__gg.G.monsters.filter(m => !m.dead && m.type !== 'sack').length") == 0, 'with the stragglers gone the night is won (no Gatehouse of his keeps it open)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fc_nets(browser, url):
    """Blood nets: three red nets of his at the start and at 75%, 50% and 25%; no damage while any stands; a hit stops at the next mark."""
    if not R8: return
    page, errors = fc_night(browser, url)
    page.evaluate(FC_UP); page.evaluate(FC_PARK)
    page.evaluate(STEP, [1, 0.02])
    ok(page.evaluate(FC_OWN) == 3, f'his first frame throws three red nets of his own ({page.evaluate(FC_OWN)})')
    page.evaluate(STEP, [12, 0.1])
    ok(page.evaluate("() => window.__gg.redNetsOf(window.__b)") == 3, 'all three land on the patch')
    ok(page.evaluate(FC_DMG, [5]) == [48, False] and page.evaluate(NODMG), 'while they stand he takes no damage ("No damage")')
    ok(page.evaluate("() => window.__gg.shieldedNow(window.__b)") is True, 'the shield door holds him')
    page.evaluate("() => { let one = false; window.__gg.clearNets(c => c.netBy === window.__b.id && !one && (one = true)); }")
    ok(page.evaluate(FC_DMG, [5]) == [48, False], 'two left: still no damage')
    page.evaluate(FC_CLEAR)
    page.evaluate("() => { window.__b.hp = 48 * 0.8; }")
    ok(page.evaluate(FC_DMG, [20]) == [36, False], f'a 20 hit at 80% stops at the 75% mark')
    ok(page.evaluate(FC_OWN) == 3, f'and he throws three more ({page.evaluate(FC_OWN)})')
    ok(page.evaluate(FC_DMG, [5]) == [36, False], 'shielded again at once (nets in flight count)')
    page.evaluate(FC_CLEAR)
    ok(page.evaluate(FC_DMG, [5]) == [31, False], 'with those gone he takes damage')
    ok(page.evaluate(FC_DMG, [100]) == [24, False] and page.evaluate(FC_OWN) == 3, 'a huge hit stops at 50% and raises three more')
    page.evaluate(FC_CLEAR)
    ok(page.evaluate(FC_DMG, [100]) == [12, False] and page.evaluate(FC_OWN) == 3, 'and at 25%')
    page.evaluate(FC_CLEAR)
    ok(page.evaluate(FC_DMG, [100])[1] is True, 'past the last mark a hit can kill him')
    # a full patch: the nets fizzle, and damage goes on to the next mark (never a lock)
    fc_up(page)
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); }")
    page.evaluate("() => { window.__b.hp = 40; }")
    ok(page.evaluate(FC_DMG, [10]) == [36, False] and page.evaluate(FC_OWN) == 0, 'with nowhere to land, his nets fizzle at the mark')
    ok(page.evaluate(FC_DMG, [5]) == [31, False], 'and the next hit goes on')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fc_trance(browser, url):
    """The blood trance heals tranceHeal per netted pumpkin (either kind) every 2 s; 3 hits break it and stun him 2 s."""
    if not R8: return
    page, errors = fc_night(browser, url)
    fc_up(page)
    page.evaluate("() => { const g = window.__gg; [[0, 0], [0, 4], [2, 2], [4, 6]].forEach(([r, c]) => { g.grid[r][c].net = 'net'; }); window.__b.hp = 20; window.__b.fcDone = 4; window.__b.tranceT = 0.01; }")
    page.evaluate(STEP, [1, 0.02])
    ok(page.evaluate("() => window.__b.healing") is True, 'he is in his trance')
    page.evaluate(STEP, [95, 0.02])   # 1.9 s
    ok(page.evaluate("() => window.__b.hp") == 20, 'no heal before 2 s')
    page.evaluate(STEP, [10, 0.02])   # 2.1 s
    ok(page.evaluate("() => window.__b.hp") == 24, f'with 4 nets on the patch he heals 4 at 2 s ({page.evaluate("() => window.__b.hp")})')
    page.evaluate("() => { window.__gg.grid[1][1].net = 'net'; }")
    page.evaluate(STEP, [100, 0.02])   # 4.1 s
    ok(page.evaluate("() => window.__b.hp") == 29, f'with 5, 5 at the next tick ({page.evaluate("() => window.__b.hp")})')
    ok(page.evaluate("() => window.__b.p") == 0.2, 'he stands still in the trance')
    page.evaluate(FC_DMG, [1]); page.evaluate(FC_DMG, [1])
    ok(page.evaluate("() => [window.__b.healing, window.__b.healHits]") == [True, 1], 'two hits: one more to go')
    page.evaluate(FC_DMG, [1])
    st = page.evaluate("() => [window.__b.healing, +window.__b.stunT.toFixed(2), window.__b.hp]")
    ok(st == [False, 2, 26], f'the third hit breaks it and stuns him 2 s {st}')
    page.evaluate("() => { window.__b.spearT = 0.5; }")
    w0 = page.evaluate("() => window.__gg.walls[window.__b.lane].hp")
    page.evaluate(STEP, [95, 0.02])   # 1.9 s
    ok(page.evaluate("() => window.__gg.walls[window.__b.lane].hp") == w0 and page.evaluate("() => window.__b.stunT") > 0, 'stunned, his clocks stand still (no spear)')
    page.evaluate(STEP, [60, 0.02])
    ok(page.evaluate("() => window.__b.stunT") <= 0, 'the stun wears off after 2 s')
    # max health caps the heal
    fc_up(page)
    page.evaluate("() => { const g = window.__gg; for (let c = 0; c < 7; c++) g.grid[0][c].net = 'net'; window.__b.hp = 46; window.__b.fcDone = 4; window.__b.tranceT = 0.01; }")
    page.evaluate(STEP, [110, 0.02])
    ok(page.evaluate("() => window.__b.hp") == 48, 'the heal stops at his full health')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fc_bolt(browser, url):
    """The bolt removes every pumpkin in its column except netted ones (either kind) and gourds; matches re-resolve."""
    if not R8: return
    page, errors = fc_night(browser, url)
    fc_up(page)
    page.evaluate("""() => { const g = window.__gg, b = window.__b; g.grid[0][4].net = 'net'; g.grid[2][4].net = 'red'; g.grid[2][4].netBy = b.id;
      g.grid[4][4] = Object.assign(g.newCell(0), { gourd:'grave' }); g.grid[3][4].fly = 5; window.__keep = [g.grid[0][4], g.grid[2][4], g.grid[4][4], g.grid[3][4]]; b.boltT = 0.01; }""")
    page.evaluate(STEP, [1, 0.02])
    page.evaluate("() => { window.__gg.G.fcBolt.c = 4; }")
    page.evaluate(STEP, [80, 0.02])
    r = page.evaluate("() => { const g = window.__gg; return g.grid.map((row, i) => row[4] === null ? null : window.__keep.indexOf(row[4])); }")
    ok(r == [0, None, 1, 3, 2], f'netted pumpkins (both kinds), the gourd and a sprout still gliding in survive the bolt, the rest go {r}')
    ok(page.evaluate("() => window.__gg.G.fcBolt") is None or page.evaluate("() => window.__gg.G.fcBolt.warn") <= 0, 'the warning is over')
    # matches re-resolve: three in a row across the cleared column are no longer a bunch once the middle goes
    fc_up(page)
    page.evaluate("""() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); const p = window.__put; p(4, 2, 0); p(4, 3, 0); p(4, 4, 0); g.resolveMatches(); window.__lit0 = g.grid[4][2].lit; window.__b.boltT = 0.01; }""")
    page.evaluate(STEP, [1, 0.02]); page.evaluate("() => { window.__gg.G.fcBolt.c = 3; }"); page.evaluate(STEP, [80, 0.02])
    lit = page.evaluate("() => [window.__lit0, window.__gg.grid[4][3] === null, window.__gg.grid[4][2].lit]")
    ok(lit == [True, True, False], f'a bunch broken by the bolt goes dark {lit}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fc_veiled(browser, url):
    """A Bat Bride's veil on him blocks all damage until she dies."""
    if not R8: return
    page, errors = fc_night(browser, url)
    fc_up(page)
    page.evaluate("() => { const g = window.__gg, b = window.__b; const r = g.spawnMonster('bride', Math.max(0, b.lane - 1), true, b.p + 0.02); r.sp = 0; r.veilT = 0; window.__R = r; }")
    page.evaluate(STEP, [2, 0.05])
    ok(page.evaluate("() => window.__b.veilBy === window.__R.id && window.__gg.veiledNow(window.__b)"), 'the Bride veils him')
    ok(page.evaluate(FC_DMG, [5]) == [48, False], 'veiled, he takes no damage')
    page.evaluate("() => { const g = window.__gg, r = window.__R; r.lastHit = 0; g.damage(r, 999, '#fff'); }")
    ok(page.evaluate(FC_DMG, [5]) == [43, False], 'with the Bride dead he takes damage again')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fallen_count_continue(browser, url):
    """A continued night brings him back with his health, the marks already passed (no replayed nets), his own red nets and his clocks."""
    if not R8: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { const L = window.__gg.NIGHTMARE_LEVELS[3][0]; window.__L0 = [L.boss, L.bossForm, L.bossChest]; L.boss = 'fallencount'; L.bossForm = 1; L.bossChest = 'normal'; }")
    nm4_start(page, 1); time.sleep(0.4); hold(page)
    page.evaluate("() => { const G = window.__gg.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.idle = -1e9; G.hint = null; }")
    page.evaluate("() => { const g = window.__gg, G = g.G; G.bossSpawned = true; const b = g.spawnMonster('boss'); b.sp = 0; b.p = 0.2; window.__b = b; }")
    page.evaluate(FC_PARK); page.evaluate(STEP, [1, 0.02]); page.evaluate(FC_CLEAR)
    page.evaluate("() => { window.__b.hp = 38; }"); page.evaluate(FC_DMG, [10])   # stops at 36: the 75% mark, three more nets
    page.evaluate("() => { const b = window.__b; b.spearT = 5; b.boltT = 6; b.summonT = 7; b.raiseT = 0.01; b.tranceT = 9; }")
    page.evaluate(STEP, [15, 0.1])
    before = page.evaluate("() => { const b = window.__b; return [b.hp, b.fcDone, +b.spearT.toFixed(3), +b.boltT.toFixed(3), +b.summonT.toFixed(3), +b.raiseT.toFixed(3), +b.tranceT.toFixed(3)]; }")
    ok(page.evaluate("() => window.__gg.G.castles.filter(w => !w.dead && w.by === window.__b.id).length") == 2, '(his Tower and Gatehouse stand before the loss)')
    ok(before[:2] == [36, 2] and page.evaluate("() => window.__gg.redNetsOf(window.__b)") == 3, f'(at the 75% mark, his three nets down {before})')
    page.evaluate("() => { const g = window.__gg; g.setState('play'); const c = g.continueState(); g.continueNight(c); g.setState('pause'); }")
    page.evaluate(STEP, [5, 0.02])
    page.evaluate("() => { const G = window.__gg.G; window.__pcs = G.castles.filter(w => !w.dead && w.kind !== 'wall').length; }")
    after = page.evaluate("() => { const b = window.__gg.G.monsters.find(m => m.type === 'boss' && !m.dead); window.__b = b; return b ? [b.hp, b.fcDone, +b.spearT.toFixed(3), +b.boltT.toFixed(3), +b.summonT.toFixed(3), b.raiseT, +b.tranceT.toFixed(3), b.kind] : null; }")
    page.evaluate("() => { const L = window.__gg.NIGHTMARE_LEVELS[3][0]; [L.boss, L.bossForm, L.bossChest] = window.__L0; }")
    ok(after is not None and after[:5] == before[:5] and after[6] == before[6] and after[7] == 'fallencount', f'he comes back with his health, marks passed and clocks as they were {before} -> {after}')
    ok(after is not None and after[5] == 0 and page.evaluate("() => window.__pcs") == 0, f'his pieces went with the castles reset, and his raise clock comes back at 0 ({after and after[5]})')
    ok(page.evaluate(FC_OWN) == 3, f'his three red nets are his again, none replayed ({page.evaluate(FC_OWN)})')
    ok(page.evaluate(FC_DMG, [5])[0] == 36, 'and they still shield him')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fallen_count_baked(browser, url):
    """His frames (fallen look only, own key) and his minions are baked when the night starts; under 12 MB at bake scale 2.5."""
    if not R8: return
    page, errors = open_page(browser, url)
    C = page.evaluate("() => { const C = window.__gg.CHARS.fallencount; return C ? [Object.keys(C.clips).sort(), !!C.variants, C.maxK] : null; }")
    ok(C is not None and C[0] == ['bats', 'stun', 'trance', 'walk', 'wall'] and not C[1] and C[2], f'the Fallen Count bakes walk, trance, stun, wall and bats, one look, maxK capped {C}')
    ok(page.evaluate("() => window.__gg.CHARS.vampirecount.box.w") == 280, "the story Count's box is unchanged")
    page.evaluate("() => { const L = window.__gg.NIGHTMARE_LEVELS[3][0]; window.__L0 = [L.boss, L.bossForm, L.bossChest]; L.boss = 'fallencount'; L.bossForm = 1; L.bossChest = 'normal'; }")
    page.evaluate("() => window.__gg.setBakeScale(2.5)")
    t0 = time.time(); nm4_start(page, 1); dt = time.time() - t0
    page.evaluate("() => { const L = window.__gg.NIGHTMARE_LEVELS[3][0]; [L.boss, L.bossForm, L.bossChest] = window.__L0; }")
    ok(page.evaluate("() => window.__gg.isBaked('fallencount')"), 'starting his night bakes the Fallen Count')
    ok(all(page.evaluate(f"() => window.__gg.isBaked('{k}')") for k in ('lancer', 'bride', 'knight', 'bulwark', 'vampire', 'archer')), 'and the monsters he brings')
    mb = page.evaluate("() => window.__gg.atlasBytes('fallencount') / 1e6")
    ok(mb < 12, f"his frames take {mb:.1f} MB at bake scale 2.5 (limit 12)")
    ok(dt < 3, f'the night opens in {dt:.1f} s')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CC_INIT = """(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
  for (const k of ['drawImage', 'fill', 'stroke', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; }
  const d = Object.getOwnPropertyDescriptor(P, 'shadowBlur'); Object.defineProperty(P, 'shadowBlur', { get(){ return d.get.call(this); }, set(v){ if (window.__ccOn && v && this.canvas && this.canvas.id === 'cv') window.__cc.shadowBlur = (window.__cc.shadowBlur || 0) + 1; d.set.call(this, v); } }); })();"""
CC10 = "() => new Promise(res => { window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 10) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.drawImage || 0) / 10, (c.stroke || 0) / 10, ((c.createRadialGradient || 0) + (c.createLinearGradient || 0)) / 10, c.shadowBlur || 0]); } }; requestAnimationFrame(tick); })"


def check_fc_budget(browser, url):
    """The lightning warning, the bolt and the blood spear are baked sprites: a few drawImage calls a frame, no stroke, gradient or shadowBlur."""
    if not R8: return
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script(CC_INIT)
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm4_start(page, 1); time.sleep(0.6); hold(page)
    page.evaluate(NQ); page.evaluate(FILL)
    fc_up(page)
    page.evaluate("() => { window.__gg.G.floats.length = 0; window.__gg.G.parts.length = 0; }")
    time.sleep(0.3); base = page.evaluate(CC10)
    page.evaluate("() => { window.__b.boltT = 0.01; }"); page.evaluate(STEP, [1, 0.02]); page.evaluate("() => { window.__gg.G.floats.length = 0; }")
    warn = page.evaluate(CC10)
    page.evaluate("() => { window.__gg.G.fcBolt.warn = 0.01; }"); page.evaluate(STEP, [1, 0.02]); page.evaluate("() => { const G = window.__gg.G; G.floats.length = 0; G.parts.length = 0; }")
    strike = page.evaluate(CC10) if page.evaluate("() => !!window.__gg.G.fcBolt && window.__gg.G.fcBolt.strike > 0") else None
    page.evaluate("() => { window.__gg.G.fcBolt = null; window.__b.spearT = 0.01; }"); page.evaluate(STEP, [2, 0.02])
    spear = page.evaluate(CC10) if page.evaluate("() => window.__gg.G.fcSpears.length > 0") else None
    for name, c in (('lightning warning', warn), ('bolt', strike), ('blood spear', spear)):
        ok(c is not None and c[0] - base[0] <= 3 and c[1] <= base[1] + 0.1 and c[2] <= base[2] + 0.1 and c[3] == 0, f'the {name} is baked: [drawImage, stroke, gradients, shadowBlur] {base} -> {c}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS = {'check_r8_absent': check_r8_absent, 'check_n4_track': check_n4_track, 'check_n4_weather': check_n4_weather, 'check_n4_book': check_n4_book,
          'check_net_rules': check_net_rules, 'check_net_cap': check_net_cap, 'check_net_free_neighbour': check_net_free_neighbour, 'check_net_hint_wind': check_net_hint_wind, 'check_net_continue': check_net_continue, 'check_net_budget': check_net_budget, 'check_lobber': check_lobber, 'check_lobber_continue': check_lobber_continue, 'check_lancer': check_lancer, 'check_lancer_edges': check_lancer_edges, 'check_lancer_ride': check_lancer_ride, 'check_marshal': check_marshal, 'check_marshal_continue': check_marshal_continue, 'check_marshal_budget': check_marshal_budget,
          'check_glutton': check_glutton, 'check_bride': check_bride, 'check_glutton_bride': check_glutton_bride, 'check_shield_all_sources': check_shield_all_sources, 'check_shield_continue': check_shield_continue, 'check_veil_budget': check_veil_budget,
          'check_gatehouse': check_gatehouse, 'check_archer_tower': check_archer_tower, 'check_castle_pieces_continue': check_castle_pieces_continue, 'check_castle_pieces_budget': check_castle_pieces_budget,
          'check_siege': check_siege, 'check_siege_form2': check_siege_form2, 'check_siege_continue': check_siege_continue, 'check_siege_baked': check_siege_baked,
          'check_fallen_count': check_fallen_count, 'check_fc_nets': check_fc_nets, 'check_fc_trance': check_fc_trance, 'check_fc_bolt': check_fc_bolt, 'check_fc_veiled': check_fc_veiled, 'check_fallen_count_continue': check_fallen_count_continue, 'check_fallen_count_baked': check_fallen_count_baked, 'check_fc_budget': check_fc_budget}


# ---------- Task 7: the Crookneck Gourd, the picker with four gourds, the N4-3 tutorial ----------
R8_NAMES += ['Breaks nets', 'seenCrookneckCoach']   # the Crookneck's role line and its coach flag ('Crookneck Gourd' and its lime are listed above)
SHOTS8 = '/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/a8c35601-34ce-46bc-bbf6-44770d21f8f8/scratchpad'
ALL4 = ['grave', 'protector', 'wartling', 'crookneck']
GON8 = "() => window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c])"
# Quiet the night as NQ does, but keep the gourds standing.
CQ = """() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.projs.length = 0; G.netsFlying = []; G.idle = -1e9; G.hint = null; G.drops.length = 0;
  g.graves.forEach(r => r.fill(false)); g.grid.forEach(row => row.forEach((c, i) => { if (!(c && c.gourd)) row[i] = null; }));
  window.__put = (r, c, col, net) => { const x = g.newCell(col); if (net) x.net = net; g.grid[r][c] = x; return x; }; g.resolveMatches(); }"""
PT = "(k) => window.__gg.PTYPES.findIndex(p => p.key === k)"


def crook_night(page, kinds, k=3, quiet=True):
    """Start N4-k with the given gourds (slot order), every gourd unlocked and every gourd coach marked seen; paused (only the check's steps advance it)."""
    page.evaluate("() => { const s = window.__gg.save; s.gourds = { grave:true, protector:true, wartling:true, crookneck:true }; s.seenGourdCoach = true; s.seenProtectorCoach = true; s.seenWartlingCoach = true; s.seenCrookneckCoach = true; }")
    page.evaluate("([n, lo, gk]) => window.__gg.startGame('story', n, lo, gk)", [1300 + k, [0, 1, 2, 3, 4], kinds]); time.sleep(0.3)
    hold(page)
    if quiet: page.evaluate(CQ)


def check_crook_no_net(browser, url):
    if not R8: return
    page, errors = open_page(browser, url)
    crook_night(page, ['crookneck'])
    ok(page.evaluate(GON8) == [['crookneck', 2, 3]], f'the Crookneck alone starts in the centre {page.evaluate(GON8)}')
    page.evaluate("() => { const p = window.__put, g = window.__gg; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (!g.grid[r][c]) p(r, c, (r + c * 2) % 5); }")
    sq = page.evaluate("() => { const g = window.__gg, out = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) out.push([r, c, g.inCrookSquare(r, c), g.canNet(r, c)]); return out; }")
    inside = [(r, c) for r, c, i, _ in sq if i]
    ok(sorted(inside) == sorted([(r, c) for r in (1, 2, 3) for c in (2, 3, 4)]), f'inCrookSquare: its own cell and its 3x3 only {inside}')
    ok(all(not n for r, c, i, n in sq if i), 'canNet is false for every cell in the square')
    edge = [(r, c) for r in (1, 2, 3) for c in (1, 5)] + [(r, c) for r in (0, 4) for c in (2, 3, 4)]
    ok(all(n for r, c, i, n in sq if (r, c) in edge), f'and true just outside it {[(r, c, n) for r, c, i, n in sq if (r, c) in edge]}')
    ok(page.evaluate("() => [window.__gg.inGraveSquare(2, 3), window.__gg.isProtected(2, 3), window.__gg.inWartSquare(2, 3)]") == [False, False, False], 'it is no Grave, Protector or Wartling square')
    page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 15; i++) g.throwNet(50, 50, 'net', 7); for (let i = 0; i < 20; i++) g.updateNets(0.1); }")
    cells = page.evaluate("() => window.__gg.netSnapshot().cells.map(c => [c[0], c[1]])")
    ok(len(cells) >= 10 and not any(1 <= r <= 3 and 2 <= c <= 4 for r, c in cells), f'fifteen throws: none lands in its square ({len(cells)} landed)')
    # a net aimed at a cell the gourd then slides next to fizzles on landing
    page.evaluate(CQ)
    page.evaluate("() => { const p = window.__put, g = window.__gg; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (!g.grid[r][c]) p(r, c, (r + c * 2) % 5); g.G.netsFlying = [{ x:50, y:50, kind:'net', by:null, r:2, c:5, t:0.3 }]; }")
    page.evaluate("() => { const g = window.__gg, x = g.grid[2][3]; g.grid[2][3] = g.grid[2][4]; g.grid[2][4] = x; g.updateNets(0.5); }")   # the gourd steps right: (2, 5) is in its square now
    ok(page.evaluate("() => [window.__gg.netCount(), window.__gg.G.netsFlying.length]") == [0, 0], 'a net in flight to a cell that comes into the square fizzles')
    # a netted pumpkin the gourd slides next to keeps its net
    page.evaluate("() => { const g = window.__gg; g.grid[2][6].net = 'net'; const x = g.grid[2][4]; g.grid[2][4] = g.grid[2][5]; g.grid[2][5] = x; }")
    ok(page.evaluate("() => [window.__gg.inCrookSquare(2, 6), window.__gg.grid[2][6].net]") == [True, 'net'], 'a netted pumpkin that ends up in the square keeps its net')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_crook_group(browser, url):
    if not R8: return
    page, errors = open_page(browser, url)
    crook_night(page, ['crookneck'])
    ok(page.evaluate("() => window.__gg.CROOK") == -3, 'CROOK is the pseudo-colour -3')
    # one pumpkin alone: nothing lights
    page.evaluate("() => { window.__A = window.__put(1, 2, 0); window.__gg.resolveMatches(); }")
    ok(page.evaluate("() => [window.__A.lit, Object.keys(window.__gg.G.groups).length]") == [False, 0], 'one pumpkin alone in the square does not light')
    # one in and one just outside: nothing
    page.evaluate("() => { window.__put(0, 4, 2); window.__gg.resolveMatches(); }")
    ok(page.evaluate("() => window.__A.lit") is False, 'one in the square and one outside it: nothing lights')
    # a Green and an Ice in the square, not touching: they light as one group
    page.evaluate("() => { const g = window.__gg; g.grid[0][4] = null; window.__B = window.__put(3, 4, 2); g.resolveMatches(); }")
    gr = page.evaluate("() => Object.values(window.__gg.G.groups).map(x => [x.color, x.size, !!x.crook])")
    ok(page.evaluate("() => [window.__A.lit, window.__B.lit]") == [True, True] and gr == [[-3, 2, True]], f'a Green and an Ice in the square light as one crook group {gr}')
    ok(page.evaluate("() => window.__gg.grid[2][3].lit") is False, 'the gourd itself does not light')
    page.evaluate("() => window.__gg.launchGroup(window.__A)")
    pr = page.evaluate("() => window.__gg.G.projs.map(p => [p.lane, p.type, p.vis]).sort((a, b) => a[0] - b[0])")
    ok(pr == [[2, 0, 0], [4, 2, 2]], f'they launch together, each up its own column as itself {pr}')
    ok(page.evaluate("() => [window.__gg.grid[1][2], window.__gg.grid[3][4], !!window.__gg.grid[2][3].gourd]") == [None, None, True], 'their cells are empty; the gourd stays')
    # a bunch of three inside the square: launched once each
    page.evaluate(CQ)
    page.evaluate("() => { const p = window.__put; for (const c of [2, 3, 4]) p(1, c, 0); window.__gg.resolveMatches(); window.__gg.launchGroup(window.__gg.grid[1][3]); }")
    ok(page.evaluate("() => window.__gg.G.projs.map(p => p.lane).sort()") == [2, 3, 4], 'a green bunch of three in the square: three projectiles, none twice')
    # a gourd that is not a Crookneck makes no group
    page.evaluate("() => { const g = window.__gg; g.startGame('story', 1303, [0, 1, 2, 3, 4], ['wartling']); }"); time.sleep(0.2); hold(page); page.evaluate(CQ)
    page.evaluate("() => { window.__A = window.__put(1, 2, 0); window.__put(3, 4, 2); window.__gg.resolveMatches(); }")
    ok(page.evaluate("() => window.__A.lit") is False, 'a Wartling square makes no mixed group')
    # a crook launch from cells that are also in a Protector square and a Wartling square: ward and wart per cell
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); g.grid[2][1] = g.newGourd('protector'); g.grid[2][3] = g.newGourd('crookneck'); g.grid[2][5] = g.newGourd('wartling'); }")
    page.evaluate("() => { window.__put(1, 2, 0); window.__put(3, 4, 2); window.__gg.resolveMatches(); window.__gg.launchGroup(window.__gg.grid[1][2]); }")
    pr = page.evaluate("() => window.__gg.G.projs.map(p => [p.lane, !!p.ward, !!p.wart]).sort((a, b) => a[0] - b[0])")
    ok(pr == [[2, True, False], [4, False, True]], f'a crook-launched cell in a Protector square carries ward, one in a Wartling square wart {pr}')
    # a rotten pumpkin in the square is left out of the group
    page.evaluate("() => window.__gg.startGame('story', 1303, [0, 1, 2, 3, 4], ['crookneck'])"); time.sleep(0.2); hold(page); page.evaluate(CQ)
    page.evaluate("() => { const g = window.__gg; window.__R = window.__put(1, 2, g.ROTTEN); window.__A = window.__put(3, 4, 0); g.resolveMatches(); }")
    ok(page.evaluate("() => [window.__R.lit, window.__A.lit]") == [False, False], 'a rotten pumpkin does not count: with one other, nothing lights')
    page.evaluate("() => { window.__put(1, 4, 2); window.__gg.resolveMatches(); }")
    r = page.evaluate("() => [window.__R.lit, window.__A.lit, Object.values(window.__gg.G.groups).map(x => [x.color, x.size])]")
    ok(r == [False, True, [[-3, 2]]], f'with two others they light as a group of two; the rotten one stays out {r}')
    # on an edge and in a corner
    for at, n in (((0, 3), 5), ((4, 6), 3)):
        page.evaluate(CQ)
        page.evaluate("([r0, c0]) => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); g.grid[r0][c0] = g.newGourd('crookneck'); for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (!g.grid[r][c]) window.__put(r, c, (r + c * 2) % 5); g.resolveMatches(); }", list(at))
        d = page.evaluate("""() => { const g = window.__gg, sq = [], bad = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++){ const i = g.inCrookSquare(r, c); if (i) sq.push([r, c]); if (g.grid[r][c] && !g.grid[r][c].gourd && g.canNet(r, c) === i) bad.push([r, c]); }
          return [Object.values(g.G.groups).filter(x => x.crook).map(x => x.size), sq.length, bad]; }""")
        ok(d == [[n], n + 1, []], f'the Crookneck at {at}: a group of {n}, its square {n + 1} cells, canNet false exactly there {d}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_crook_launch_mix(browser, url):
    """Rainbow, Paint, Brown, Turquoise and a netted pumpkin in the square each launch once as themselves (a Rainbow flies as Green), at
    their own levels; a square cell also in a 3-bunch reaching outside launches once and the whole bunch goes too, whichever cell is
    flicked. (Magnet is not on this branch.)"""
    if not R8: return
    page, errors = open_page(browser, url)
    page.evaluate("() => Object.assign(window.__gg.save.lv, { green:1, yellow:4, ice:3, fire:2, turquoise:2, brown:3, paint:2 })")
    crook_night(page, ['crookneck'])
    K = page.evaluate("() => { const P = window.__gg.PTYPES, f = k => P.findIndex(p => p.key === k); return { green:f('green'), yellow:f('yellow'), ice:f('ice'), fire:f('fire'), turq:f('turquoise'), brown:f('brown'), paint:f('paint'), rainbow:window.__gg.RAINBOW }; }")
    SET = """(K) => { const p = window.__put;
      p(1, 2, K.rainbow); p(1, 3, K.paint); p(1, 4, K.brown); p(2, 2, K.green, 'net'); p(2, 4, K.turq); p(3, 2, K.ice); p(3, 3, K.fire); p(3, 4, K.yellow);
      p(4, 4, K.yellow); p(4, 5, K.yellow); window.__gg.resolveMatches(); }"""
    for flick, label in (((3, 2), 'flicking the Ice in the square'), ((4, 5), 'flicking the Yellow bunch outside the square')):
        page.evaluate(CQ); page.evaluate(SET, K)
        lit = page.evaluate("() => window.__gg.grid.flat().filter(x => x && !x.gourd && x.lit).length")
        ok(lit == 10, f'{label}: all ten light (eight in the square, two Yellows outside) ({lit})')
        page.evaluate("([r, c]) => window.__gg.launchGroup(window.__gg.grid[r][c])", list(flick))
        pr = page.evaluate("() => window.__gg.G.projs.map(p => [p.lane, p.vis, p.type, p.lv, p.size])")
        got = sorted([tuple(p[:4]) for p in pr])
        want = sorted([(2, K['rainbow'], K['green'], 1), (3, K['paint'], K['paint'], 2), (4, K['brown'], K['brown'], 3), (2, K['green'], K['green'], 1),
                       (4, K['turq'], K['turq'], 2), (2, K['ice'], K['ice'], 3), (3, K['fire'], K['fire'], 2), (4, K['yellow'], K['yellow'], 4),
                       (4, K['yellow'], K['yellow'], 4), (5, K['yellow'], K['yellow'], 4)])
        ok(got == want, f'{label}: ten projectiles, each once as itself at its own level (Rainbow as Green) {got}')
        left = page.evaluate("() => window.__gg.grid.flat().filter(x => x && !x.gourd).length")
        ok(left == 0 and page.evaluate("() => window.__gg.netCount()") == 0, f'{label}: the patch is empty but for the gourd, the net went with its pumpkin ({left} left)')
    # two bunches of different colours, each with a cell in the square: the same launch whichever cell is flicked (fix round 1, two hops)
    TWO = """(K) => { const p = window.__put;
      p(1, 2, K.ice); p(0, 2, K.ice); p(0, 1, K.ice);
      p(3, 4, K.fire); p(4, 4, K.fire); p(4, 5, K.fire);
      p(2, 2, K.green); window.__gg.resolveMatches(); }"""
    for flick, label in (((0, 1), "A's outside cell"), ((2, 2), 'a square cell in no bunch'), ((4, 5), "B's outside cell"), ((1, 2), "A's cell in the square")):
        page.evaluate(CQ); page.evaluate(TWO, K)
        page.evaluate("([r, c]) => window.__gg.launchGroup(window.__gg.grid[r][c])", list(flick))
        got = sorted(page.evaluate("() => window.__gg.G.projs.map(p => [p.lane, p.vis])"))
        want = sorted([[2, K['ice']], [2, K['ice']], [1, K['ice']], [4, K['fire']], [4, K['fire']], [5, K['fire']], [2, K['green']]])
        ok(got == want, f'two bunches and the square: flicking {label} launches all seven, each once {got}')
    # Paint pulls as usual: a Paint bunch in the square pulls its touching pumpkins, and each pumpkin still goes once
    page.evaluate(CQ)
    page.evaluate("(K) => { const p = window.__put; for (const c of [2, 3, 4]) p(1, c, K.paint); p(0, 3, K.ice); p(3, 2, K.fire); window.__gg.resolveMatches(); window.__gg.launchGroup(window.__gg.grid[1][3]); }", K)
    pr = page.evaluate("() => window.__gg.G.projs.map(p => [p.lane, p.vis])")
    ok(len(pr) == 5 and sorted(pr) == sorted([[2, K['paint']], [3, K['paint']], [4, K['paint']], [3, K['ice']], [2, K['fire']]]), f'a Paint bunch in the square: three Paints, the Ice it pulls from outside and the Fire in the square, each once {pr}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_crook_break(browser, url):
    if not R8: return
    page, errors = open_page(browser, url)
    crook_night(page, ['crookneck'])
    page.evaluate("() => { const p = window.__put, g = window.__gg; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (!g.grid[r][c]) p(r, c, (r + c * 2) % 5); }")
    spawn_at(page, 'glutton', 3, 0.4, sp=0); page.evaluate("() => { window.__U = window.__last; }")
    page.evaluate(STEP, [10, 0.1])
    ok(page.evaluate("() => window.__gg.redNetsOf(window.__U)") == 2, 'the Glutton has two red nets on the patch')
    page.evaluate("""() => { const g = window.__gg; let n = 0;
      for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (n < 6 && !(r === 0 && c === 0) && g.canNet(r, c)){ g.grid[r][c].net = 'net'; n++; } }""")
    ok(page.evaluate("() => window.__gg.netCount()") == 8, f'eight nets on the patch, two red ({page.evaluate("() => window.__gg.netCount()")})')
    page.evaluate("() => window.__gg.throwNet(50, 50, 'net', 9)")
    page.evaluate("() => window.__gg.damage(window.__U, 3)")
    ok(page.evaluate("() => window.__U.hp") == 8, 'shielded by its red nets: no damage')
    r = page.evaluate("() => { const g = window.__gg, p = g.gourdPos('crookneck'); return g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(r is True, 'destroyGourd breaks the Crookneck')
    ok(page.evaluate("() => [window.__gg.netCount(), window.__gg.G.netsFlying.length, window.__gg.redNetsOf(window.__U)]") == [0, 0, 0], 'every net is gone, red too, and the one in flight')
    page.evaluate("() => window.__gg.damage(window.__U, 3)")
    ok(page.evaluate("() => window.__U.hp") == 5, f'the Glutton then takes damage ({page.evaluate("() => window.__U.hp")})')
    ok(page.evaluate("() => [window.__gg.gourdPos('crookneck'), !!window.__gg.G.gourdDueOf.crookneck]") == [None, True], 'the Crookneck is due back')
    page.evaluate("() => { const g = window.__gg; g.grid[0][0] = null; g.spawnSprouts(); }")
    ok(page.evaluate("() => !!window.__gg.gourdPos('crookneck')") is True, 'it comes back on the next sprout tick')
    # a continued night keeps it
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); window.__snap = JSON.parse(JSON.stringify(c.gourd)); g.continueNight(c); }"); time.sleep(0.3)
    ok(page.evaluate("() => [window.__snap[0].kind, window.__gg.G.gourdKinds, window.__gg.gourdsOn().map(o => o.kind)]") == ['crookneck', ['crookneck'], ['crookneck']], 'a continued night keeps the Crookneck')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def keep_picker(page, gourds, night=1303, seen=True):
    """Open the picker on N4-k with the given gourds unlocked (every earlier night beaten), the gourd coaches seen (the Crookneck's as `seen`)."""
    from nm3_check import gpick
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 17)}, **{1100 + k: 3 for k in range(1, 17)}, **{1200 + k: 3 for k in range(1, 17)}, **{1300 + k: 3 for k in range(1, 3)}})
    page.evaluate("([gs, n, seen]) => { const g = window.__gg; g.save.gourds = gs; g.save.perksOff = { pick4:true }; g.save.seenGourdCoach = true; g.save.seenProtectorCoach = true; g.save.seenWartlingCoach = true; g.save.seenCrookneckCoach = seen; document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); g.beginNight(n); }",
                  [{k: True for k in gourds}, night, seen]); time.sleep(0.6)
    return page.evaluate(gpick())


def check_picker_four_gourds(browser, url):
    """N4-3 offers four gourds, two slots, the Crookneck locked into slot 1 (gourdLock); the other slot is a free pick of the other three. The
    N3-5 and N2-5 pickers are unchanged with the Crookneck unlocked."""
    if not R8: return
    from nm3_check import gpick
    page, errors = open_page(browser, url)
    u = keep_picker(page, ['grave', 'protector', 'wartling'])
    ok(u['state'] == 'loadout' and [t[0] for t in u['tiles']] == ALL4, f'N4-3: four gourd tiles in unlock order {u["tiles"]}')
    ok(u['slots'] == ['crookneck', 'grave'] and u['slotMust'] == [True, False], f'two slots: the Crookneck locked in slot 1, the Grave in slot 2 {u["slots"]} {u["slotMust"]}')
    ok([t[2] for t in u['tiles']] == [False, False, False, True], f'only the Crookneck tile is locked {u["tiles"]}')
    ok(u['heading'] == 'Gourds · pick up to 2' and all(w >= 44 and hh >= 44 for w, hh in u['slotSize']) and u['headFits'] and u['cardFits'], f'"pick up to 2", 44 px slots, the header and card fit {u}')
    page.click('#loGourdSlot'); time.sleep(0.2)
    ok(page.evaluate(gpick())['slots'] == ['crookneck', 'grave'], 'tapping the locked slot keeps it')
    det = page.evaluate("() => document.querySelector('#loDetail').textContent")
    ok('Crookneck Gourd' in det and 'net' in det.lower(), f'and shows its card {det[:80]!r}')
    page.click('#loGourds .pick[data-gourd="crookneck"]'); time.sleep(0.2)
    ok(page.evaluate(gpick())['slots'] == ['crookneck', 'grave'], 'tapping its tile keeps it too')
    page.click('#loGourds .pick[data-gourd="wartling"]'); time.sleep(0.2)
    ok(page.evaluate(gpick())['slots'] == ['crookneck', 'wartling'], 'a third gourd replaces the free slot, never the locked one')
    page.screenshot(path=os.path.join(SHOTS8, 'crookneck-picker.png'))
    page.click('#loGourdSlot2'); time.sleep(0.2)
    ok(page.evaluate(gpick())['slots'] == ['crookneck', None], 'the free slot empties when tapped')
    page.click('#loGourds .pick[data-gourd="protector"]'); time.sleep(0.2)
    ok(page.evaluate(gpick())['slots'] == ['crookneck', 'protector'], 'a tile fills it again')
    page.click('#bLoGo'); time.sleep(0.5)
    r = page.evaluate("() => [window.__gg.state, window.__gg.G.n, window.__gg.G.gourdKinds, window.__gg.gourdsOn().map(o => o.kind).sort()]")
    ok(r[:3] == ['play', 1303, ['crookneck', 'protector']] and r[3] == ['crookneck', 'protector'], f'Start: the Crookneck and the Protector stand on the patch {r}')
    # N3-5 and N2-5 unchanged with the Crookneck unlocked
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 17)}, **{1100 + k: 3 for k in range(1, 17)}, **{1200 + k: 3 for k in range(1, 5)}})
    page.evaluate("() => { const g = window.__gg; g.save.gourds = { grave:true, protector:true, wartling:true, crookneck:true }; document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); g.beginNight(1205); }"); time.sleep(0.6)
    u = page.evaluate(gpick())
    ok([t[0] for t in u['tiles']] == ['grave', 'protector', 'wartling'] and u['slots'] == ['grave', 'protector'] and not any(t[2] for t in u['tiles']), f'N3-5 still offers three gourds, two picked, none locked {u["tiles"]}')
    page.evaluate("() => { const g = window.__gg; document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); g.beginNight(1105); }"); time.sleep(0.6)
    u = page.evaluate(gpick())
    ok([t[0] for t in u['tiles']] == ['grave', 'protector'] and u['slots'] == ['grave', 'protector'], f'N2-5 still offers two gourds, both picked {u["tiles"]}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_crook_coach(browser, url):
    """The Crookneck tutorial on N4-3 (coach:'crookneck'): slide it; launch a mixed group from its square; a net lands next to it, not inside;
    hold it until it breaks and every net goes; Nice; the night carries on. Each step waits for its action."""
    if not R8: return
    ST = "(s) => { const g = window.__gg; for (let i = 0; i < Math.round(s / 0.05); i++) g.update(0.05); return g.G.coach ? g.G.coach.step : null; }"
    TIP = "() => document.querySelector('#coachTip').textContent"
    CP = "() => { const p = window.__gg.gourdPos('crookneck'); return p && [p.r, p.c]; }"
    page, errors = open_page(browser, url)
    page.evaluate("() => { const s = window.__gg.save; s.gourds = { grave:true, protector:true, wartling:true, crookneck:true }; s.seenGourdCoach = true; s.seenProtectorCoach = true; s.seenWartlingCoach = true; s.seenCrookneckCoach = false; }")
    page.evaluate("(lo) => window.__gg.startGame('story', 1303, lo, ['crookneck', 'grave'])", [0, 1, 2, 3, 4]); time.sleep(0.3); hold(page)
    d = page.evaluate("() => { const g = window.__gg; return [g.G.coach && g.G.coach.kind, g.G.coach && g.G.coach.step, g.coachHolds(), g.gourdsOn().map(o => o.kind).sort(), g.grid.flat().filter(x => x && !x.gourd).length]; }")
    ok(d[:4] == ['crookneck', 'cslide', True, ['crookneck', 'grave']] and d[4] == 0, f'N4-3 with the tutorial unseen starts the Crookneck script on a clear patch {d}')
    ok('Crookneck Gourd' in page.evaluate(TIP), f'the tip names it {page.evaluate(TIP)[:60]!r}')
    ok(page.evaluate(ST, 2) == 'cslide' and page.evaluate("() => [window.__gg.G.monsters.length, window.__gg.G.spawned, window.__gg.G.netsFlying.length]") == [0, 0, 0], 'it waits for the slide: no monsters, no nets')
    mv = page.evaluate("() => { const c = window.__gg.G.coach; return c.move && [c.move.dir, c.move.ref.gourd]; }")
    ok(mv and mv[1] == 'crookneck', f'the hand slides the Crookneck {mv}')
    page.evaluate("() => { const g = window.__gg, c = g.G.coach; g.slideOne(c.move.ref, c.move.dir); }")
    ok(page.evaluate(ST, 0.4) == 'claunch', 'slid: the launch step')
    d = page.evaluate("""() => { const g = window.__gg, p = g.gourdPos('crookneck'), out = [];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++){ const x = g.grid[r][c]; if (x && !x.gourd) out.push([x.c, x.lit, g.inCrookSquare(r, c)]); } return out; }""")
    ok(len(d) >= 2 and len({x[0] for x in d}) >= 2 and all(x[1] and x[2] for x in d), f'a mixed group (two colours or more) lights in its square {d}')
    ok('any colour' in page.evaluate(TIP).lower(), f'the tip says any colour {page.evaluate(TIP)[:80]!r}')
    ok(page.evaluate(ST, 2) == 'claunch', 'it waits for the launch')
    page.evaluate("() => { const g = window.__gg; g.launchGroup(g.bestLitGroup()); }")
    n = page.evaluate("() => window.__gg.G.projs.length")
    ok(n == len(d), f'the whole group flies ({n})')
    st = page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 80 && g.G.coach.step === 'claunch'; i++) g.update(0.05); return [g.G.coach.step, g.G.netsFlying.length]; }")
    ok(st == ['cnet', 2], f'every pumpkin gone: the net step, two nets in the air ({st})')
    ok('net' in page.evaluate(TIP).lower(), f'the tip is about nets {page.evaluate(TIP)[:80]!r}')
    st = page.evaluate(ST, 2)
    nets = page.evaluate("() => window.__gg.netSnapshot().cells.map(c => [c[0], c[1], window.__gg.inCrookSquare(c[0], c[1])])")
    ok(st == 'chold' and len(nets) >= 1 and not any(x[2] for x in nets), f'a net lands next to it, not inside; then the hold step {st} {nets}')
    cp = page.evaluate(CP)
    ok(any(abs(r - cp[0]) <= 2 and abs(c - cp[1]) <= 2 for r, c, _ in nets), f'next to its square {cp} {nets}')
    ok('hold' in page.evaluate(TIP).lower(), f'the hold tip {page.evaluate(TIP)[:60]!r}')
    ok(page.evaluate(ST, 3) == 'chold', 'it waits for the break')
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('crookneck'); g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(page.evaluate("() => window.__gg.netCount()") == 0, 'breaking it clears every net')
    ok(page.evaluate(ST, 0.1) == 'praise' and 'Nice' in page.evaluate(TIP), f'Nice {page.evaluate(TIP)[:50]!r}')
    ok(page.evaluate("() => window.__gg.coachHolds()") is False, 'the praise step lets the night carry on')
    page.evaluate(ST, 4)
    ok(page.evaluate("() => [window.__gg.G.coach, window.__gg.save.seenCrookneckCoach]") == [None, True], 'the script ends and seenCrookneckCoach is set')
    page.evaluate("() => { window.__gg.G.spawnTimer = 0; }"); page.evaluate(ST, 0.5)
    ok(page.evaluate("() => window.__gg.G.spawned") > 0, 'monsters spawn after the tutorial')
    # seen: a plain N4-3; without the Crookneck: no script, still unseen
    page.evaluate("(lo) => window.__gg.startGame('story', 1303, lo, ['crookneck', 'grave'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    ok(page.evaluate("() => [window.__gg.G.coach, window.__gg.coachHolds()]") == [None, False], 'a player who has seen it gets a plain N4-3')
    page.evaluate("() => { window.__gg.save.seenCrookneckCoach = false; }")
    page.evaluate("(lo) => window.__gg.startGame('story', 1303, lo, ['grave', 'protector'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    ok(page.evaluate("() => [window.__gg.G.coach, window.__gg.save.seenCrookneckCoach]") == [None, False], 'N4-3 started without the Crookneck: no script, still unseen')
    # broken early: it grows back and the lesson goes on from the net
    page.evaluate("(lo) => window.__gg.startGame('story', 1303, lo, ['crookneck', 'grave'])", [0, 1, 2, 3, 4]); time.sleep(0.2); hold(page)
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('crookneck'); g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(page.evaluate(ST, 0.1) == 'cback', 'breaking it early jumps to the respawn step')
    st = page.evaluate(ST, 4)
    ok(st in ('cnet', 'chold') and page.evaluate(CP) is not None, f'it grows back, then the net lesson {st}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_crook_unlock(browser, url):
    if not R8: return
    page, errors = open_page(browser, url)
    d = page.evaluate("() => { const t = window.__gg.NIGHTMARE_LEVELS[3]; return t[2] && [t[2].gourd, t[2].gourds, t[2].gourdLock, t[2].coach]; }")
    ok(d == [True, ALL4, 'crookneck', 'crookneck'], f'N4-3 (data): a gourd night offering all four, the Crookneck locked, its coach {d}')
    ok(page.evaluate("() => window.__gg.GOURDS.crookneck && [window.__gg.GOURDS.crookneck.name, window.__gg.GOURDS.crookneck.role]") == ['Crookneck Gourd', 'Breaks nets'], 'GOURDS.crookneck: name and role')
    keep_picker(page, ['grave', 'protector', 'wartling'], night=1302)
    ok(not page.evaluate("() => !!window.__gg.save.gourds.crookneck"), 'opening N4-2 does not give it')
    keep_picker(page, ['grave', 'protector', 'wartling'], night=1303)
    ok(page.evaluate("() => window.__gg.save.gourds.crookneck") is True, 'opening N4-3 gives save.gourds.crookneck')
    ok(page.evaluate("() => JSON.parse(localStorage.getItem('gourdguard.v1')).gourds.crookneck") is True, 'and it is saved')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_crook_art(browser, url):
    """The Crookneck's baked art: a lime picker icon, a strip saved for the owner, and a patch shot; its square glow is one baked tile."""
    if not R8: return
    import base64
    page, errors = open_page(browser, url)
    crook_night(page, ['grave', 'crookneck'], quiet=False)
    px = page.evaluate("() => { const c = window.__gg.gourdIcon(96, 'crookneck'), d = c.getContext('2d').getImageData(0, 0, 96, 96).data; let n = 0, v = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200){ n++; if (d[i + 1] > d[i + 2] + 40 && d[i + 1] >= d[i] - 10) v++; } return [n, v]; }")
    ok(px[0] > 1500 and px[1] > px[0] * 0.3, f'the icon is a solid, mostly lime gourd {px}')
    strip = page.evaluate("""() => { const g = window.__gg, W = 96 * 5, c = document.createElement('canvas'); c.width = W; c.height = 120; const x = c.getContext('2d');
      x.fillStyle = '#2a2420'; x.fillRect(0, 0, W, 120);
      ['grave', 'protector', 'wartling', 'crookneck', 'crookneck'].forEach((k, i) => x.drawImage(g.gourdIcon(i === 4 ? 192 : 96, k), i * 96, 12, 96, 96)); return c.toDataURL(); }""")
    with open(os.path.join(SHOTS8, 'crookneck-strip.png'), 'wb') as f: f.write(base64.b64decode(strip.split(',')[1]))
    cost = page.evaluate("""() => { const g = window.__gg, c = document.createElement('canvas'), x = c.getContext('2d'), n = { draw:0, fill:0, stroke:0 };
      g.drawGourdGlow(x, 1); const di = x.drawImage.bind(x); x.drawImage = (...a) => { n.draw++; return di(...a); }; x.fill = () => { n.fill++; }; x.stroke = () => { n.stroke++; };
      g.drawGourdGlow(x, 1.5); return [g.gourdsOn().length, n.draw, n.fill, n.stroke]; }""")
    ok(cost == [2, 2, 0, 0], f'the square glows cost one drawImage per gourd and no fill or stroke [gourds, drawImage, fill, stroke] {cost}')
    page.evaluate("() => window.__gg.setState('play')"); time.sleep(0.6)
    page.screenshot(path=os.path.join(SHOTS8, 'crookneck-patch.png'))
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_crook_no_net': check_crook_no_net, 'check_crook_group': check_crook_group, 'check_crook_launch_mix': check_crook_launch_mix,
               'check_crook_break': check_crook_break, 'check_picker_four_gourds': check_picker_four_gourds, 'check_crook_coach': check_crook_coach,
               'check_crook_unlock': check_crook_unlock, 'check_crook_art': check_crook_art})


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
