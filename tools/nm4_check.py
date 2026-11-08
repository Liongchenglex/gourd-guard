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
    ok(sorted(((k, b) for _, _, k, b in after['cells']), key=str) == sorted(((k, b) for _, _, k, b in before['cells']), key=str), f'with their kind and thrower {after["cells"]}')
    ok(len(after['flying']) == 1 and after['flying'][0][2] == 'red' and after['flying'][0][3] == 9, f'the net in flight keeps flying {after["flying"]}')
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


CHECKS = {'check_r8_absent': check_r8_absent, 'check_n4_track': check_n4_track, 'check_n4_weather': check_n4_weather, 'check_n4_book': check_n4_book,
          'check_net_rules': check_net_rules, 'check_net_cap': check_net_cap, 'check_net_free_neighbour': check_net_free_neighbour, 'check_net_hint_wind': check_net_hint_wind, 'check_net_continue': check_net_continue, 'check_net_budget': check_net_budget, 'check_lobber': check_lobber, 'check_lobber_continue': check_lobber_continue}


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
