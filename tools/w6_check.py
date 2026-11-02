"""Release checks for branch dev (docs/RELEASES.md), against a build served by tools/serve_dist.py.
  Store build:     npm run build          then  .venv/bin/python tools/w6_check.py --url http://127.0.0.1:4173/ --expect off
  Playtest build:  npm run build:playtest then .venv/bin/python tools/w6_check.py --url http://127.0.0.1:4173/ --expect on
  Release 2 build: VITE_RELEASE=2 npx vite build then  ... --expect r2   (World 6 to 6-16, nothing from Release 3)
  Checks take `on` (World 6 present: on or r2); Release 3 checks read the global R3 (on only).
Exits 1 on any failure. --only runs one check by name."""
import argparse, json, pathlib, sys, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
FAILS = []
R3 = False   # set by --expect: the build holds Release 3 (playtest)
MODE = 'on'


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


def check_shelf(browser, url, on):
    page, errors = open_page(browser, url)
    page.click('#bStory'); time.sleep(0.8)
    books = page.evaluate("() => [...document.querySelectorAll('#shelf .book')].map(b => [b.getAttribute('aria-label') || '', b.classList.contains('soon')])")
    ok(len(books) == 6, f'the shelf shows six books ({len(books)})')
    if len(books) == 6: ok(books[5][1] == (not on), f"the Hallow's End book is {'open for play' if on else 'coming soon'}")
    ok(not errors, f'no page errors opening the shelf {errors[:2]}')
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
        for t in ('diver', 'turtle'):
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


# ---------- Task 3: the Frenzy jukebox (6-4) ----------
JB = "window.__gg.G.monsters.filter(m => m.type === 'jukebox' && !m.dead)"


def force_drop(page):
    page.evaluate("() => { const G = window.__gg.G; G.spawned = Math.ceil(G.def.total * 0.8); G.spawnTimer = 0; }")
    time.sleep(0.6)


def check_jukebox(browser, url, on):
    if not on:
        js = ''.join(p.read_text(errors='ignore') for p in (ROOT / 'dist/assets').glob('*.js'))
        src = ROOT / 'src/data/music_w6.js'
        ok(src.exists(), 'src/data/music_w6.js exists')
        if src.exists():
            t = src.read_text(); piece = t[t.index('base64,') + 5000:][:120]
            ok(piece not in js, 'no Frenzy song in the store bundle')
        return
    page, errors = open_page(browser, url)
    start(page, 104)
    ok(page.evaluate(f"() => {JB}.length") == 0, 'no jukebox before 80% of the night')
    force_drop(page)
    jb = page.evaluate(f"() => {JB}.map(m => [m.p, m.hp, window.__gg.lanesOf(m).length])")
    ok(len(jb) == 1, f'exactly one jukebox drops at 80% ({len(jb)})')
    if jb:
        p, hp, lanes = jb[0]
        ok(p <= 0.2 and hp == 30 and lanes == 2, f'it sits at the top, 30 health, two lanes wide (p={p:.2f}, hp={hp}, lanes={lanes})')
    hp = page.evaluate(f"() => {{ const m = {JB}[0]; m.lastHit = -1; window.__gg.damage(m, 4); return m.hp; }}")
    ok(hp == 30, f'tools do not hurt it (hp {hp})')
    hp = page.evaluate(f"() => {{ const m = {JB}[0]; m.lastHit = 0; window.__gg.damage(m, 4); return m.hp; }}")
    ok(hp == 26, f'pumpkins do (hp {hp})')
    page.evaluate("() => { for (let i = 0; i < 3; i++) window.__gg.spawnMonster('witch', i * 2, true, 0.3); }")
    page.evaluate("() => { const G = window.__gg.G; G.spawned = G.def.total; G.spawnTimer = 0; }")
    time.sleep(13)   # two witch hex cycles, and spawns past the total
    ok(page.evaluate(f"() => {{ const m = {JB}[0]; return m && m.colourLock == null && m.colourImmune == null; }}"), 'witches never hex it')
    ok(page.evaluate("() => window.__gg.G.spawned > window.__gg.G.def.total"), 'monsters keep coming past the total while it stands')
    page.evaluate("() => { for (const m of window.__gg.G.monsters) if (m.type !== 'jukebox') m.dead = true; window.__gg.G.spawnTimer = 99; }")
    time.sleep(0.5)
    ok(page.evaluate("() => !window.__gg.G.over"), 'the night is not won while it stands')
    c = page.evaluate(f"() => {{ const m = {JB}[0]; m.hp = 12; return window.__gg.continueState(); }}")
    page.evaluate(f"() => {{ const m = {JB}[0]; m.lastHit = 0; window.__gg.damage(m, 999); }}")
    ok(page.evaluate("() => window.__gg.G.jukeboxDone === true && window.__gg.G.jukebox === null"), 'smashing it marks the Frenzy over')
    s0 = page.evaluate("() => { for (const m of window.__gg.G.monsters) m.dead = true; window.__gg.G.spawnTimer = 0; return window.__gg.G.spawned; }")
    time.sleep(1.5)
    ok(page.evaluate("() => window.__gg.G.over") and page.evaluate("() => window.__gg.G.spawned") == s0, 'spawning stops and the night is won once it falls')
    # continued night with the jukebox still standing at 12 health
    page.evaluate("(c) => window.__gg.continueNight(c)", c)
    time.sleep(0.6)
    jb = page.evaluate(f"() => {JB}.map(m => m.hp)")
    ok(jb == [12], f'a continued night brings the jukebox back with its health ({jb})')
    # continued night after the jukebox fell
    start(page, 104); force_drop(page)
    page.evaluate(f"() => {{ const m = {JB}[0]; m.lastHit = 0; window.__gg.damage(m, 999); }}")
    c = page.evaluate("() => window.__gg.continueState()")
    page.evaluate("(c) => window.__gg.continueNight(c)", c)
    force_drop(page)
    ok(page.evaluate(f"() => {JB}.length") == 0, 'a continued night after the jukebox fell drops no second one')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def orange_px(page):
    # bright orange/yellow pixels in the field's top half (the jukebox grille and neon); the Hallow's End moon sits above this band
    return page.evaluate("""() => { const c = document.querySelector('canvas'), g = c.getContext('2d'), k = c.width / c.clientWidth;
      const d = g.getImageData(0, Math.round(130 * k), c.width, Math.round(200 * k)).data; let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] > 90 && d[i + 1] < 200 && d[i + 2] < 90) n++; return n; }""")


def check_jukebox_more(browser, url, on):
    if not on: return
    page, errors = open_page(browser, url)
    start(page, 104)
    ok(page.evaluate("() => window.__gg.isBaked && window.__gg.isBaked('jukebox')"), 'the jukebox frames are baked at night start, not on the drop frame')
    force_drop(page)
    # fog over the jukebox: it must still be drawn above it
    page.evaluate("() => { const G = window.__gg.G; G.def.fog = [[0, 0.45]]; for (const m of G.monsters) if (m.type !== 'jukebox') m.dead = true; G.spawnTimer = 99; }")
    time.sleep(0.6)
    with_jb = orange_px(page)
    page.evaluate(f"() => {{ {JB}[0].hidden = true; }}")
    page.evaluate(f"() => {{ const m = {JB}[0]; window.__gg.G.monsters.splice(window.__gg.G.monsters.indexOf(m), 1); window.__gg.G.spawnTimer = 99; }}")
    time.sleep(0.4)
    without = orange_px(page)
    ok(with_jb > 400 and with_jb > without * 4, f'the jukebox shows through fog ({with_jb} lit pixels vs {without} without it)')
    # the Hexwitch never hexes it
    start(page, 104); force_drop(page)
    page.evaluate("() => { const G = window.__gg.G; for (const m of G.monsters) if (m.type !== 'jukebox') m.dead = true; G.spawnTimer = 99; G.def.boss = 'hexwitch'; G.def.bossForm = 1; window.__hw = window.__gg.spawnMonster('boss', 5, true, 0.3); }")
    for _ in range(4):
        page.evaluate("() => { window.__hw.hexT = 0; window.__gg.G.spawnTimer = 99; }"); time.sleep(0.4)
    ok(page.evaluate(f"() => {{ const m = {JB}[0]; return !!m && m.colourLock == null && m.colourImmune == null; }}"), 'the Hexwitch never hexes it')
    # Bulwark auras and Plague Doctors leave it alone (owner, 2026-10-31)
    start(page, 104); force_drop(page)
    page.evaluate(f"""() => {{ const G = window.__gg.G, j = {JB}[0]; for (const m of G.monsters) if (m !== j) m.dead = true; G.spawnTimer = 99;
      j.lastHit = 0; window.__gg.damage(j, 10);
      for (const t of ['bulwark', 'doctor']) {{ const m = window.__gg.spawnMonster(t, j.lane, true, j.p); m.sp = 0; }} }}""")
    time.sleep(4.5)   # two doctor heal ticks
    hp = page.evaluate(f"() => {{ const j = {JB}[0]; return [j.hp, j.maxHp]; }}")
    ok(hp == [20, 30], f'Bulwark auras and Plague Doctors do not touch it (hp/max {hp})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def mist_px(page):
    # pale mist pixels across the field (fog banks are light grey-blue)
    return page.evaluate("""() => { const c = document.querySelector('canvas'), g = c.getContext('2d'), k = c.width / c.clientWidth;
      const d = g.getImageData(0, Math.round(140 * k), c.width, Math.round(320 * k)).data; let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 150 && d[i + 1] > 160 && d[i + 2] > 165 && Math.abs(d[i] - d[i + 2]) < 50) n++; return n; }""")


def check_frenzy_burst(browser, url, on):
    if not on: return
    page, errors = open_page(browser, url)
    start(page, 104)
    s0 = page.evaluate("() => { const G = window.__gg.G; G.spawned = Math.ceil(G.def.total * 0.8); G.spawnTimer = 0; return G.spawned; }")
    page.wait_for_function("() => window.__gg.G.jukebox"); page.evaluate("() => { window.__gg.G.spawnTimer = 99; }")
    time.sleep(2)
    burst = page.evaluate("() => window.__gg.G.spawned") - s0 - 1
    ok(4 <= burst <= 6, f'a burst of 4-6 monsters arrives when the jukebox drops ({burst})')
    s1 = page.evaluate("() => { window.__gg.G.spawnTimer = 0; return window.__gg.G.spawned; }")
    page.wait_for_function(f"() => window.__gg.G.spawned > {s1}")   # the next spawn: count what it brought
    d1 = page.evaluate("() => { window.__gg.G.spawnTimer = 99; return window.__gg.G.spawned; }") - s1
    ok(d1 == 2, f'while it plays, monsters come in pairs ({d1})')
    page.evaluate(f"() => {{ const m = {JB}[0]; m.lastHit = 0; window.__gg.damage(m, 999); }}")
    page.evaluate("() => { const G = window.__gg.G; G.spawned = 0; G.spawnTimer = 0; }")
    page.wait_for_function("() => window.__gg.G.spawned > 0")
    d2 = page.evaluate("() => { window.__gg.G.spawnTimer = 99; return window.__gg.G.spawned; }")
    ok(d2 == 1, f'after it falls, one at a time again ({d2})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_6_5_to_7(browser, url, on):
    if not on: return
    page, errors = open_page(browser, url)
    set_stars(page, {n: 3 for n in range(1, 101)})
    defs = page.evaluate("() => window.__gg.WORLD_LEVELS[5].slice(4, 7).map(d => ({ pool:d.pool.map(e => e[0]).sort(), frenzy:!!d.frenzy, castles:(d.castlesLayout || []).map(c => c.join(',')).sort(), fogCols:d.fogCols || [], graves:d.gravesLayout || [] }))")
    if len(defs) < 3:
        ok(False, f'6-5 to 6-7 exist ({len(defs)} found)'); page.close(); return
    ok([d['pool'] for d in defs] == [['bulwark', 'doctor', 'turtle'], ['bulwark', 'turtle', 'witch'], ['bulwark', 'rider', 'sailor', 'vampire']], f"6-5 to 6-7 monsters {[d['pool'] for d in defs]}")
    ok(page.evaluate("() => window.__gg.WORLD_LEVELS[5].slice(4, 6).every(d => d.puddles === 3)"), '6-5 and 6-6 have puddles for the turtles')
    ok(all(d['frenzy'] for d in defs), '6-5 to 6-7 are Frenzy levels')
    flanks = sorted(f'{l},{p}' for l in (0, 6) for p in (0.3, 0.5, 0.7))
    ok(defs[0]['castles'] == flanks and defs[1]['castles'] == flanks, '6-5 and 6-6 have castle walls down both outer lanes')
    ok(len(defs[2]['castles']) == 7 and all(c.endswith(',0.5') for c in defs[2]['castles']) and defs[2]['fogCols'] == [0, 6], '6-7 has a castle row at 50% and fog down the outer lanes')
    ok(sorted(defs[0]['graves']) == sorted([[1, 2], [1, 3], [1, 4], [2, 2], [2, 4], [3, 2], [3, 3], [3, 4]]), '6-5 graves in a ring')
    ok(sorted(defs[1]['graves']) == sorted([[1, 1], [2, 2], [1, 3], [2, 4], [1, 5]]), '6-6 graves in a zig-zag')
    sea = page.evaluate("() => window.__gg.WORLD_LEVELS[5][6].shoreFrac")
    ok(sea and 0.4 <= sea < 0.5, f'6-7 has the sea right behind its castle row (shore at {sea})')
    for n in (105, 106, 107):
        start(page, n)
        ok(page.evaluate("() => window.__gg.G.castles.length") == (6 if n < 107 else 7), f'night {n} starts with its castle walls')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


BOSSES = "window.__gg.G.monsters.filter(m => m.type === 'boss' && !m.dead)"


def check_double_boss(browser, url, on):
    if not on: return
    page, errors = open_page(browser, url)
    set_stars(page, {n: 3 for n in range(1, 108)})
    start(page, 108)
    if page.evaluate("() => window.__gg.G.def.label") != '6-8':
        ok(False, '6-8 exists'); page.close(); return
    page.evaluate("() => { const G = window.__gg.G; G.spawned = Math.ceil(G.def.total * 0.4); G.spawnTimer = 0; }"); time.sleep(0.8)
    bs = page.evaluate(f"() => {BOSSES}.map(m => [m.kind, m.maxHp]).sort()")
    ok(bs == [['gravekeeper', 15], ['poltergeist', 20]], f'both bosses arrive at full health {bs}')
    bar = "() => parseFloat(document.querySelector('#prog').style.width)"
    page.evaluate(f"() => {{ const p = {BOSSES}.find(m => m.kind === 'poltergeist'); p.lastHit = 0; window.__gg.damage(p, 5); }}"); time.sleep(0.3)
    w0 = page.evaluate(bar)
    page.evaluate(f"() => {{ const g = {BOSSES}.find(m => m.kind === 'gravekeeper'); g.lastHit = 0; window.__gg.damage(g, 999); }}"); time.sleep(0.3)
    w1 = page.evaluate(bar)
    ok(w1 > w0 and w1 >= 55, f'the boss bar moves forward when one boss falls ({w0:.0f}% -> {w1:.0f}%)')
    s0 = page.evaluate("() => { window.__gg.G.spawnTimer = 0; return window.__gg.G.spawned; }"); time.sleep(1)
    ok(page.evaluate("() => !window.__gg.G.bossDead && !window.__gg.G.over") and page.evaluate("() => window.__gg.G.spawned") > s0, 'with one boss down, monsters keep coming and the night goes on')
    c = page.evaluate(f"() => {{ {BOSSES}.find(m => m.kind === 'poltergeist').hp = 9; return window.__gg.continueState(); }}")
    ok(c and c.get('bossKinds') == ['poltergeist'], f"the continue snapshot keeps only the living boss {c and c.get('bossKinds')}")
    page.evaluate("(c) => window.__gg.continueNight(c)", c); time.sleep(0.4)
    page.evaluate("() => { const G = window.__gg.G; G.spawned = Math.max(G.spawned, Math.ceil(G.def.total * 0.4)); G.spawnTimer = 0; }"); time.sleep(0.8)
    bs = page.evaluate(f"() => {BOSSES}.map(m => [m.kind, m.hp])")
    ok(bs == [['poltergeist', 9]], f'a continued night brings back only the living boss, hurt {bs}')
    page.evaluate(f"() => {{ for (const b of {BOSSES}) {{ b.lastHit = 0; window.__gg.damage(b, 999); }} }}")
    ok(page.evaluate("() => window.__gg.G.bossDead === true"), 'both down: the bosses are beaten')
    page.evaluate("() => { const G = window.__gg.G; G.spawned = G.def.total; for (const m of G.monsters) m.dead = true; }"); time.sleep(1)
    ok(page.evaluate("() => window.__gg.G.over"), 'clearing the field then wins the night')
    time.sleep(1.5)   # let the result card open before starting another night
    start(page, 90)
    page.evaluate("() => { const G = window.__gg.G; G.spawned = Math.ceil(G.def.total * 0.4); G.spawnTimer = 0; }"); time.sleep(0.8)
    ok(page.evaluate(f"() => {{ const b = {BOSSES}; return b.length === 2 && b.every(m => m.kind === 'twintides' && m.twin); }}"), '5-10 still brings two linked Twin Tides')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_emergency(browser, url, on):
    page, errors = open_page(browser, url)
    if not on:
        ok(page.evaluate("() => { const b = document.querySelector('#epBtn'); return !b || b.hidden; }"), 'no Emergency Pumpkins button in the store build')
        page.evaluate("() => window.__gg.openShop()"); time.sleep(0.5)
        ok(page.evaluate("() => !document.querySelector('#ovShop').textContent.includes('Emergency')"), 'no Emergency Pumpkins in the store build shop')
        page.close(); return
    set_stars(page, {n: 3 for n in range(1, 107)})   # 6-8 not open yet
    start(page, 107); time.sleep(0.3)
    ok(page.evaluate("() => document.querySelector('#epBtn').hidden"), 'no Emergency Pumpkins button before 6-8 is reached')
    page.evaluate("() => window.__gg.openShop()"); time.sleep(0.5)
    ok(page.evaluate("() => !document.querySelector('#ovShop').textContent.includes('Emergency')"), 'not in the shop before 6-8 either')
    set_stars(page, {n: 3 for n in range(1, 108)})
    page.evaluate("() => { window.__gg.save.emergency = 0; }")
    start(page, 108); time.sleep(1)   # let the shop screen finish fading out
    page.evaluate("() => document.querySelectorAll('.crownReveal').forEach(e => e.remove())")   # the stars handed out above can trigger the Crown of Stars reveal
    ok(page.evaluate("() => window.__gg.save.emergency") == 1, 'one free Emergency Pumpkins on 6-8')
    hold = "() => { window.__gg.G.sproutT = -1e9; window.__gg.G.spawnTimer = 99; return window.__gg.emptyCells().length; }"
    page.evaluate("() => { window.__gg.save.emergency = 5; }")
    e0 = page.evaluate(hold)
    page.click('#epBtn'); time.sleep(0.3)
    e1 = page.evaluate(hold)
    ok(e0 - e1 == min(9, e0) and page.evaluate("() => window.__gg.save.emergency") == 4, f'a tap fills up to 9 empty cells and uses one ({e0} -> {e1} empty)')
    for _ in range(6):   # fill the rest (bounded, so a broken button cannot hang the check)
        if e1 == 0: break
        page.click('#epBtn'); time.sleep(0.3); e1 = page.evaluate(hold)
    ok(e1 == 0, f'more taps fill the patch ({e1} empty left)')
    left = page.evaluate("() => window.__gg.save.emergency")
    page.click('#epBtn'); time.sleep(0.3)
    ok(page.evaluate("() => window.__gg.save.emergency") == left, 'with a full patch the tap does nothing and keeps the tool')
    tops = page.evaluate("() => [...document.querySelectorAll('#tools > button')].filter(b => !b.hidden).map(b => b.offsetTop)")
    ok(len(tops) == 8 and len(set(tops)) == 1, f'the tray shows eight tools on one row ({len(tops)} buttons, rows at {sorted(set(tops))})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_6_9_to_12(browser, url, on):
    if not on: return
    page, errors = open_page(browser, url)
    set_stars(page, {n: 3 for n in range(1, 112)})
    defs = page.evaluate("() => window.__gg.WORLD_LEVELS[5].slice(8, 12).map(d => ({ pool:d.pool.map(e => e[0]).sort(), frenzy:!!d.frenzy, boss:d.boss || null, boss2:d.boss2 || null, shore:d.shore || 0, shoreFrac:d.shoreFrac || 0, fogCols:d.fogCols || [], castles:(d.castlesLayout || []).length }))")
    if len(defs) < 4:
        ok(False, f'6-9 to 6-12 exist ({len(defs)} found)'); page.close(); return
    ok(defs[0]['pool'] == ['chameleon', 'firemummy', 'fogwalker', 'rchameleon'] and defs[0]['frenzy'], f"6-9: chameleons, reverse chameleons, flaming mummies, fogwalkers, Frenzy {defs[0]['pool']}")
    ok(defs[1]['pool'] == ['diver', 'rchameleon'] and defs[1]['frenzy'] and 0.4 <= defs[1]['shoreFrac'] < 0.5 and defs[1]['castles'] == 7 and defs[1]['fogCols'] == [0, 6], f'6-10: reverse chameleons and divers on 6-7\'s map, Frenzy {defs[1]}')
    ok(defs[2]['pool'] == ['hauler', 'slime', 'vampire'] and defs[2]['frenzy'] and defs[2]['shore'] == 4, f'6-11: haulers, slimes, vampires, the 5-19 tide, Frenzy {defs[2]}')
    ok(defs[3]['boss'] == 'hexwitch' and defs[3]['boss2'] == 'vampirecount' and not defs[3]['frenzy'] and defs[3]['pool'] == sorted(['witch', 'rchameleon', 'mirror', 'vampire', 'knight', 'archer', 'bulwark']), f'6-12: the Hexwitch and the Vampire Count with their minions {defs[3]}')
    start(page, 112)
    page.evaluate("() => { const G = window.__gg.G; G.spawned = Math.ceil(G.def.total * 0.4); G.spawnTimer = 0; }"); time.sleep(0.8)
    ok(page.evaluate(f"() => {BOSSES}.map(m => m.kind).sort().join()") == 'hexwitch,vampirecount', '6-12 brings both bosses')
    time.sleep(1.5)
    page.evaluate("() => window.__gg.openBook(5)"); time.sleep(0.8)
    stamps = page.evaluate("() => [...document.querySelectorAll('.pg')].map(t => !!t.querySelector('.devilStamp'))")
    ok(len(stamps) >= 12 and stamps[7] and stamps[11] and not stamps[0], f'World 6 boss tiles carry the purple devil stamp ({[i + 1 for i, v in enumerate(stamps) if v]})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_wind(browser, url, on):
    if not on: return
    page, errors = open_page(browser, url)
    g = page.evaluate("() => window.__gg.WORLD_LEVELS[5].slice(4, 12).map(d => d.gust ? (d.gust.partial ? 'narrow' : 'full') : 'none')")
    ok(g == ['none'] * 2 + ['narrow'] * 2 + ['full'] * 4, f'no wind on 6-5 and 6-6, narrow on 6-7 and 6-8, full on 6-9 to 6-12 {g}')
    page.close()


def check_divers_hide(browser, url, on):
    if not on: return
    page, errors = open_page(browser, url)
    start(page, 110)
    pool62 = page.evaluate("() => window.__gg.WORLD_LEVELS[5][1].pool.map(e => e[0]).sort()")
    ok(pool62 == ['diver', 'fogwalker', 'knight', 'mirror'], f'6-2 has Puddle Divers in place of Witches {pool62}')
    walkers = page.evaluate("() => { let n = 0; for (let i = 0; i < 20; i++){ const m = window.__gg.spawnMonster('diver'); if (m.walker) n++; } return n; }")
    ok(walkers == 0, f'on 6-10 every Puddle Diver hides in the sea, none walk ({walkers} of 20 walked)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_release(browser, url, on):
    page, errors = open_page(browser, url)
    r = page.evaluate("() => window.__gg.RELEASE")
    want = {'on': 999, 'r2': 2, 'off': 1}[MODE]
    ok(r == want, f'the build is release {r} (playtest = all, r2 = 2, store = 1)')
    bad = page.evaluate("() => window.__gg.WORLD_LEVELS.flat().filter(d => (d.release || 1) > window.__gg.RELEASE).map(d => d.world + '-' + d.level)")
    ok(not bad, f'no level from a later release is in the build {bad}')
    if on:
        tags = page.evaluate("() => window.__gg.WORLD_LEVELS[5].map(d => d.release)")
        ok(all(t == 2 for t in tags[:16]), f'Hallow\'s End 6-1 to 6-16 are tagged Release 2 {tags}')
    page.close()


def check_6_13_to_16(browser, url, on):
    if not on: return
    page, errors = open_page(browser, url)
    set_stars(page, {n: 3 for n in range(1, 116)})
    defs = page.evaluate("() => window.__gg.WORLD_LEVELS[5].slice(12, 16).map(d => ({ name:d.name, pool:d.pool.map(e => e[0]).sort(), frenzy:!!d.frenzy, fogCols:d.fogCols || [], shore:d.shore || 0, shoreFrac:d.shoreFrac || 0, castles:(d.castlesLayout || []).length, gust:!!d.gust, boss:d.boss || null, boss2:d.boss2 || null, after:!!d.frenzyAfterBoss }))")
    if len(defs) < 4:
        ok(False, f'6-13 to 6-16 exist ({len(defs)} found)'); page.close(); return
    a, b, c, d = defs
    fog13 = page.evaluate("() => JSON.stringify(window.__gg.WORLD_LEVELS[5][12].fog || [])")
    ok(a['name'] == 'Blind Night' and a['pool'] == ['sailor', 'wisp', 'wraith'] and a['frenzy'] and a['fogCols'] == [] and fog13 == '[[0,1]]' and a['castles'] == 7 and a['gust'], f'6-13 Blind Night: fog over the whole field, no fogwalkers {a} {fog13}')
    ok(b['name'] == 'Turncoat Tide 2' and b['pool'] == ['chameleon', 'diver'] and b['frenzy'] and 0.4 <= b['shoreFrac'] < 0.5 and b['castles'] == 7 and b['fogCols'] == [0, 6], f'6-14 Turncoat Tide 2 {b}')
    ok(c['name'] == 'Heavy Guests at the Door' and c['pool'] == ['bulwark', 'diver', 'turtle'] and c['frenzy'] and c['shore'] == 4, f'6-15 Heavy Guests at the Door {c}')
    ok(d['boss'] == 'twintides' and d['boss2'] == 'twintides' and d['after'] and d['pool'] == ['diver', 'sailor', 'slime', 'turtle'], f'6-16: two pairs of Twin Tides, jukebox after the first pair {d}')
    start(page, 116)
    page.evaluate("() => { const G = window.__gg.G; G.spawned = Math.ceil(G.def.total * 0.4); G.spawnTimer = 0; }"); time.sleep(0.8)
    tw = page.evaluate(f"() => {{ const b = {BOSSES}; return [b.length, b.every(m => m.kind === 'twintides' && m.twin && m.twin.twin === m), new Set(b.map(m => m.lane)).size]; }}")
    ok(tw == [4, True, 4], f'6-16 brings two linked pairs of Twin Tides in four different lanes {tw}')
    ok(page.evaluate(f"() => !{JB}.length"), 'no jukebox while both pairs are up')
    w = page.evaluate("() => parseFloat(document.querySelector('#prog').style.width)")
    ok(9 <= w <= 12, f'with all four serpents at full health the boss bar starts at 10% ({w:.0f}%)')
    page.evaluate(f"() => {{ const m = {BOSSES}[0], o = m.twin; for (const x of [m, o]) {{ x.lastHit = 0; window.__gg.damage(x, 999); }} }}"); time.sleep(0.6)
    ok(page.evaluate(f"() => {BOSSES}.length") == 2 and not page.evaluate("() => window.__gg.G.bossDead"), 'felling one pair leaves the other pair up')
    ok(page.evaluate(f"() => {JB}.length") == 1, 'the jukebox drops when the first pair goes down')
    c2 = page.evaluate("() => window.__gg.continueState()")
    page.evaluate("(c) => window.__gg.continueNight(c)", c2); time.sleep(0.4)
    page.evaluate("() => { const G = window.__gg.G; G.spawned = Math.max(G.spawned, Math.ceil(G.def.total * 0.4)); G.spawnTimer = 0; }"); time.sleep(0.8)
    ok(page.evaluate(f"() => {BOSSES}.length") == 2, f"a continued night brings back only the pair still up ({page.evaluate(f'() => {BOSSES}.length')} serpents)")
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_book_king(browser, url, on):
    page, errors = open_page(browser, url)
    set_stars(page, {n: 3 for n in range(1, 101)})
    page.evaluate("() => window.__gg.openBook(%d)" % (5 if on else 0)); time.sleep(0.8)
    cap = page.evaluate("() => { const s = document.querySelector('#bkBoss span'); return s && s.textContent; }")
    want = 'The Hollow King' if R3 else '???' if on else 'The Gravekeeper'
    ok(cap == want, f"the book's boss page shows {cap!r} (want {want!r})")
    if on:
        dark = page.evaluate("() => { const c = document.querySelector('#bkBoss canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; return n; }")
        ok(dark > 3000, f'his silhouette is drawn ({dark} solid pixels)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_owner_1031(browser, url, on):
    if not on: return
    page, errors = open_page(browser, url)
    set_stars(page, {n: 3 for n in range(1, 101)})
    d = page.evaluate("() => { const d = window.__gg.WORLD_LEVELS[5][3]; return { pool:d.pool.map(e => e[0]).sort(), fog:d.fog || [] }; }")
    ok(d['pool'] == sorted(['firemummy', 'fogwalker', 'witch', 'bulwark', 'turtle']), f"6-4 is the level-16 monsters only {d['pool']}")
    ok(d['fog'] == [], '6-4 has no fog banks')
    # the level preview shows the map without its fog; the fog appears once the night starts
    page.evaluate("() => window.__gg.openPreview(103)"); time.sleep(1.2)
    prev = mist_px(page)
    start(page, 103); time.sleep(2.5)
    game = mist_px(page)
    ok(game > 2000 and prev * 4 < game, f'no fog on the preview map, fog in the night ({prev} vs {game} mist pixels)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS = {
    'check_flag': check_flag, 'check_shelf': check_shelf, 'check_bundle': check_bundle, 'check_open': check_open, 'check_levels': check_levels, 'check_jukebox': check_jukebox, 'check_jukebox_more': check_jukebox_more, 'check_owner_1031': check_owner_1031, 'check_frenzy_burst': check_frenzy_burst, 'check_6_5_to_7': check_6_5_to_7, 'check_double_boss': check_double_boss, 'check_emergency': check_emergency, 'check_6_9_to_12': check_6_9_to_12, 'check_wind': check_wind, 'check_divers_hide': check_divers_hide, 'check_release': check_release, 'check_6_13_to_16': check_6_13_to_16, 'check_book_king': check_book_king,
}


# ---------- Release 3 (docs/superpowers/plans/2026-11-02-release-3.md) ----------
CRESCENT = [[0, 3], [0, 4], [1, 2], [2, 2], [3, 2], [4, 3], [4, 4]]
DIAMOND = [[0, 3], [1, 2], [1, 4], [2, 1], [2, 5], [3, 2], [3, 4], [4, 3]]
FACE = [[1, 1], [1, 5], [2, 3], [3, 1], [3, 5], [4, 2], [4, 3], [4, 4]]
CROWN = [[0, 1], [0, 3], [0, 5], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5]]


def bundle_js():
    return ''.join(p.read_text(errors='ignore') for p in (ROOT / 'dist/assets').glob('*.js'))


def check_r3_absent(browser, url, on):
    js = bundle_js()
    for s in ('Knights in the Mist', 'Beige', 'Hollow King'):
        ok((s in js) == R3, f"{s!r} {'in' if R3 else 'not in'} the bundle")


def w6_layouts(page, upto):
    return page.evaluate("(n) => window.__gg.WORLD_LEVELS[5].slice(0, n).map(d => JSON.stringify((d.gravesLayout || []).map(([r, c]) => [r, c]).sort()))", upto)


def check_6_17_18(browser, url, on):
    page, errors = open_page(browser, url)
    set_stars(page, {n: 3 for n in range(1, 117)})
    if not R3:
        n = page.evaluate("() => (window.__gg.WORLD_LEVELS[5] || []).length")
        ok(n == (16 if on else 0), f'no Release 3 levels in this build ({n} World 6 levels)')
        ok(not page.evaluate("() => window.__gg.isOpen(117)"), '6-17 is not open')
        page.close(); return
    old = set(w6_layouts(page, 16))
    start(page, 117)
    d = page.evaluate("() => { const d = window.__gg.G.def; return { label:d.label, pool:d.pool.map(e => e[0]).sort(), fog:JSON.stringify(d.fog), shore:d.shoreFrac, sea:!!d.sea, frenzy:!!d.frenzy, gust:d.gust && d.gust.every }; }")
    ok(d['label'] == '6-17', f"6-17 exists ({d['label']})")
    ok(d['pool'] == ['diver', 'knight', 'mirror'], f"6-17: knights, mirror sprites, divers {d['pool']}")
    ok(d['fog'] == '[[0,0.8]]' and d['shore'] == 0.5 and d['sea'], f"6-17: 80% fog, tide at half {d}")
    ok(d['frenzy'] and d['gust'] == 22, '6-17: Frenzy and wind')
    g = grave_cells(page)
    ok(g == sorted(CRESCENT) and json.dumps(g).replace(' ', '') not in old, f'6-17 graves are a crescent, new to Hallow\'s End {g}')
    start(page, 118)
    d = page.evaluate("() => { const G = window.__gg.G, d = G.def; return { label:d.label, pool:d.pool.map(e => e[0]).sort(), fog:JSON.stringify(d.fog), cas:G.castles.length, ps:[...new Set(G.castles.map(c => c.p))].sort() }; }")
    ok(d['label'] == '6-18' and d['pool'] == ['doctor', 'vampire'], f"6-18: doctors and vampires {d['pool']}")
    ok(d['fog'] == '[[0,0.8]]', '6-18: 80% fog')
    ok(d['cas'] == 21 and d['ps'] == [0.3, 0.5, 0.7], f"6-18: three castle rows {d['cas']} {d['ps']}")
    g = grave_cells(page)
    ok(g == sorted(DIAMOND) and json.dumps(g).replace(' ', '') not in old, f'6-18 graves are a diamond {g}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_r3_absent': check_r3_absent, 'check_6_17_18': check_6_17_18})


def marks(page):
    return page.evaluate("() => [...document.querySelectorAll('.jbMark')].map(e => [Math.round(parseFloat(e.style.left)), e.classList.contains('live'), e.classList.contains('done')])")


def check_two_jukebox(browser, url, on):
    if not R3:
        return
    page, errors = open_page(browser, url)
    set_stars(page, {n: 3 for n in range(1, 119)})
    start(page, 104)
    ok(marks(page) == [], f'6-4 (Release 2) shows no jukebox marks {marks(page)}')
    start(page, 119)
    d = page.evaluate("() => { const d = window.__gg.G.def, d4 = window.__gg.WORLD_LEVELS[5][3]; return { label:d.label, at:d.frenzyAt, pool:JSON.stringify(d.pool), pool4:JSON.stringify(d4.pool), name:d.name }; }")
    ok(d['label'] == '6-19' and d['name'] == 'A Revisit 2', f"6-19 A Revisit 2 exists {d['label']} {d['name']}")
    ok(d['at'] == [0.5, 1], f"two jukebox drops at 50% and 100% {d['at']}")
    ok(d['pool'] == d['pool4'], "6-19 has 6-4's monsters")
    ok(grave_cells(page) == sorted(FACE), f'6-19 graves are a jack-o\'-lantern face {grave_cells(page)}')
    time.sleep(0.4)
    ok(marks(page) == [[50, False, False], [100, False, False]], f'the spawn bar shows marks at 50% and 100% {marks(page)}')
    page.evaluate("() => { const G = window.__gg.G; G.spawned = 12; G.spawnTimer = 0; }"); time.sleep(0.6)
    ok(page.evaluate(f"() => {JB}.length") == 1, 'the first jukebox drops halfway')
    time.sleep(0.4)
    ok(marks(page)[0][1], f'its mark is live while it stands {marks(page)}')
    s = page.evaluate("() => window.__gg.G.spawned")
    time.sleep(2.5)
    ok(page.evaluate("() => window.__gg.G.spawned") == s, f'Frenzy monsters do not count toward the night ({s})')
    ok(page.evaluate("() => window.__gg.G.monsters.some(m => !m.dead && m.minion && m.type !== 'jukebox')"), 'the Frenzy brings bonus monsters')
    c = page.evaluate(f"() => {{ {JB}[0].hp = 9; return window.__gg.continueState(); }}")
    ok(c['jukebox'] == {'next': 1, 'hp': 9}, f"the continue snapshot keeps the halfway jukebox {c['jukebox']}")
    page.evaluate("(c) => window.__gg.continueNight(c)", c); time.sleep(0.6)
    ok(page.evaluate(f"() => {JB}.map(m => m.hp)") == [9], 'a continued night brings the halfway jukebox back')
    page.evaluate(f"() => {{ const m = {JB}[0]; m.lastHit = 0; window.__gg.damage(m, 999); }}"); time.sleep(0.4)
    ok(page.evaluate("() => window.__gg.G.jukeboxDone === false && window.__gg.G.jukebox === null"), 'after the first jukebox the Frenzy is not over')
    ok(marks(page)[0][2] and not marks(page)[0][1], f'its mark shows done {marks(page)}')
    s = page.evaluate("() => { window.__gg.G.spawnTimer = 0; return window.__gg.G.spawned; }"); time.sleep(0.5)
    ok(page.evaluate("() => window.__gg.G.spawned") > s, 'normal spawning resumes and counts again')
    page.evaluate("() => { const G = window.__gg.G; G.spawned = G.def.total; G.spawnTimer = 0; }"); time.sleep(0.6)
    ok(page.evaluate(f"() => {JB}.length") == 1, 'the second jukebox drops at the end')
    page.evaluate(f"() => {{ const m = {JB}[0]; m.lastHit = 0; window.__gg.damage(m, 999); }}"); time.sleep(0.3)
    ok(page.evaluate("() => window.__gg.G.jukeboxDone === true"), 'smashing the second ends the Frenzy')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_two_jukebox': check_two_jukebox})


def shop_beige(page):
    page.evaluate("() => { window.__gg.openShop(); document.querySelector('#tabPumpkins').click(); }"); time.sleep(0.5)
    page.evaluate("() => { const t = [...document.querySelectorAll('#shopPumpkins .tile')].find(b => b.querySelector('.tn').textContent === 'Beige'); if (t) t.click(); }"); time.sleep(0.3)
    return page.evaluate("() => ({ tile:[...document.querySelectorAll('#shopPumpkins .tile .tn')].some(e => e.textContent === 'Beige'), text:document.querySelector('#pDetail').textContent, btn:document.querySelector('#pDetail .dAct button').textContent, dis:document.querySelector('#pDetail .dAct button').disabled })")


def check_beige_shop(browser, url, on):
    page, errors = open_page(browser, url)
    has = page.evaluate("() => !!window.__gg.PTYPES && window.__gg.PTYPES.some(p => p.key === 'beige')")
    if not R3:
        ok(not has, 'no Beige pumpkin in this build')
        page.close(); return
    ok(has, 'the Beige pumpkin exists')
    d = page.evaluate("() => { const g = window.__gg, i = g.PTYPES.findIndex(p => p.key === 'beige'); return { i, B:g.BEIGE, R:g.RAINBOW, rb:!!g.PTYPES[g.RAINBOW].rainbow, costs:[1, 2, 3, 4].map(L => g.upgradeCost('beige', L)), s5:g.lvStats(i, 5).special, s3:g.lvStats(i, 3).special, p5:g.lvStats(i, 5).power }; }")
    ok(d['i'] == d['B'] == d['R'] - 1 and d['rb'], f"Beige sits just before Rainbow {d['i']} {d['B']} {d['R']}")
    ok(d['costs'] == [{'coins': 5000}, {'coins': 10000}, {'seeds': 50}, {'seeds': 75}], f"upgrades cost 5,000 / 10,000 coins, 50 / 75 seeds {d['costs']}")
    ok('plus' in d['s5'] and '5 s' in d['s5'] and '3 across' in d['s3'] and d['p5'] == '2', f"level stats describe the glue {d['s3']!r} / {d['s5']!r}")
    set_stars(page, {n: 3 for n in range(1, 116)}); page.evaluate("() => { window.__gg.save.seeds = 60; }")
    b = shop_beige(page)
    ok(b['tile'] and '6-16' in b['text'] and b['dis'], f"before 6-16 it shows, locked, saying how to get it {b['text'][:90]!r}")
    set_stars(page, {n: 3 for n in range(1, 117)})
    b = shop_beige(page)
    ok('50' in b['btn'] and not b['dis'], f"after 6-16 it can be bought for 50 seeds ({b['btn']!r})")
    page.evaluate("() => document.querySelector('#pDetail .dAct button').click()"); time.sleep(0.3)
    sv = page.evaluate("() => { const s = window.__gg.save; return [s.beigeOwned, s.seeds, s.lv.beige]; }")
    ok(sv == [True, 10, 1], f'buying it spends 50 seeds and owns it at level 1 {sv}')
    ok(page.evaluate("() => window.__gg.typesForNight(5).includes(window.__gg.BEIGE)"), 'once bought it can be taken into any level')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_beige_save(browser, url, on):
    page, errors = open_page(browser, url)
    page.evaluate("() => { const s = window.__gg.save; s.loadout = [0, 1, 2, 3, 4]; s.wardrobe.skins = { 1:'candycorn' }; }")
    start(page, 9)
    r = page.evaluate("() => { const g = window.__gg, R = g.RAINBOW, old = Math.random; Math.random = () => 0; const c = g.randSprout(); Math.random = old; return [c === R, !!g.PTYPES[c].rainbow, g.PTYPES.length - 1 === R]; }")
    ok(r == [True, True, True], f'Rainbow still comes up as the rainbow pumpkin {r}')
    time.sleep(1)
    ok(not errors, f'an existing save plays with no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_beige_shop': check_beige_shop, 'check_beige_save': check_beige_save})


BEIGE_HIT = """(lv, m) => { const g = window.__gg, B = g.BEIGE; g.hitMonster({ type:B, vis:B, lv, size:1, lane:m.lane, x:m.x, y:0, hit:new Set(), grp:null, guar:false, trail:[] }, m); }"""


def glue_ghoul(page, lane, p, hp=1):
    return f"(() => {{ const m = window.__gg.spawnMonster('ghoul', {lane}, true, {p}); m.hp = m.maxHp = {hp}; m.sp = 0.05; return m; }})()"


def check_glue(browser, url, on):
    if not R3:
        return
    page, errors = open_page(browser, url)
    page.evaluate("() => { window.__gg.save.beigeOwned = true; }")
    page.evaluate("([lo]) => window.__gg.startGame('story', 101, lo)", [[0, 1, 2, 3, page.evaluate("() => window.__gg.BEIGE")]]); time.sleep(0.3)
    page.evaluate("() => { window.__gg.G.spawnTimer = 999; window.__gg.G.monsters.length = 0; }")
    tp = page.evaluate("() => window.__gg.TILE_P()")
    row = int(0.4 / tp)
    page.evaluate(f"() => ({BEIGE_HIT})(1, {glue_ghoul(page, 3, 0.4)})")
    gl = page.evaluate("() => window.__gg.G.glue.map(t => [t.lane, t.row, t.dur])")
    ok(gl == [[3, row, 1]], f'a level-1 Beige kill leaves one glue tile where it died for 1 s {gl} (row {row})')
    time.sleep(1.3)
    ok(page.evaluate("() => window.__gg.G.glue.length") == 0, 'the level-1 glue is gone after a second')
    page.evaluate(f"() => ({BEIGE_HIT})(3, {glue_ghoul(page, 3, 0.4)})")
    gl = sorted(page.evaluate("() => window.__gg.G.glue.map(t => [t.lane, t.row])"))
    ok(gl == [[2, row], [3, row], [4, row]], f'level 3: three tiles across {gl}')
    page.evaluate("() => { window.__gg.G.glue.length = 0; }")
    page.evaluate(f"() => ({BEIGE_HIT})(3, {glue_ghoul(page, 0, 0.4)})")
    ok(sorted(page.evaluate("() => window.__gg.G.glue.map(t => t.lane)")) == [0, 1], 'at the edge the tile off the field is dropped')
    page.evaluate("() => { window.__gg.G.glue.length = 0; }")
    page.evaluate(f"() => ({BEIGE_HIT})(5, {glue_ghoul(page, 3, 0.4)})")
    gl = sorted(page.evaluate("() => window.__gg.G.glue.map(t => [t.lane, t.row, t.dur])"))
    ok(gl == sorted([[3, row, 5], [2, row, 5], [4, row, 5], [3, row - 1, 5], [3, row + 1, 5]]), f'level 5: a plus of five tiles for 5 s {gl}')
    time.sleep(0.6)
    t0 = page.evaluate(f"() => window.__gg.G.glue.find(t => t.lane === 3 && t.row === {row}).t")
    page.evaluate(f"() => ({BEIGE_HIT})(5, {glue_ghoul(page, 3, 0.4)})")
    d = page.evaluate(f"() => [window.__gg.G.glue.length, window.__gg.G.glue.find(t => t.lane === 3 && t.row === {row}).t]")
    ok(d[0] == 5 and d[1] >= t0, f'no stacking: a kill on glue adds nothing and does not refresh it {d} (t was {t0:.2f})')
    # a monster standing in glue: half speed and 0.3 a second
    page.evaluate("() => { const G = window.__gg.G; G.glue.length = 0; G.monsters.length = 0; }")
    page.evaluate(f"() => {{ const G = window.__gg.G; G.glue.push({{ lane:3, row:{row}, t:0, dur:30 }}); window.__a = {glue_ghoul(page, 3, (row + 0.5) * tp, 5)}; window.__b = {glue_ghoul(page, 5, (row + 0.5) * tp, 5)}; window.__a.sp = window.__b.sp = 0.004; }}")
    time.sleep(1.15)
    hp1 = page.evaluate("() => window.__a.hp")
    time.sleep(1.0)
    d = page.evaluate(f"() => [window.__a.hp, window.__b.hp, window.__a.p - {(row + 0.5) * tp}, window.__b.p - {(row + 0.5) * tp}]")
    ok(abs(hp1 - 4.7) < 0.01 and abs(d[0] - 4.4) < 0.01 and d[1] == 5, f'in glue it loses 0.3 each second ({hp1}, {d[0]}; outside {d[1]})')
    ok(0.3 < d[2] / d[3] < 0.7, f'in glue it walks at half speed ({d[2]:.4f} vs {d[3]:.4f})')
    for t in ('mummy', 'firemummy'):
        r = page.evaluate(f"() => {{ const m = window.__gg.spawnMonster('{t}', 3, true, {(row + 0.5) * tp}); m.hp = 0.3; m.sp = 0; return new Promise(res => setTimeout(() => res([m.dead, m.rise > 0]), 1300)); }}")
        ok(r == [False, True], f'glue cannot finish a {t}: it goes down and rises {r}')
    page.evaluate("() => { const G = window.__gg.G; G.monsters.length = 0; G.glue.length = 0; G.glue.push({ lane:3, row:%d, t:0, dur:30 }); window.__c = %s; window.__c.hp = 0.3; window.__c.sp = 0; }" % (row, glue_ghoul(page, 3, (row + 0.5) * tp)))
    time.sleep(1.3)
    ok(page.evaluate("() => window.__c.dead && window.__gg.G.glue.length === 1"), 'a glue kill lays no new glue')
    start(page, 101)
    ok(page.evaluate("() => window.__gg.G.glue.length") == 0, 'a new night starts with no glue')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_glue': check_glue})


KING = "window.__gg.G.monsters.find(m => m.kind === 'hollowking' && !m.dead)"


def spawn_king(page, n=104):
    start(page, n)
    page.evaluate("() => { const G = window.__gg.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.def.boss = 'hollowking'; G.bossSpawned = true; window.__gg.spawnMonster('boss:hollowking', 3, false, 0.3, 1); }")
    time.sleep(0.2)


def check_hk_powers(browser, url, on):
    page, errors = open_page(browser, url)
    has = page.evaluate("() => !!(window.__gg.BOSS_NAMES || {}).hollowking")
    if not R3:
        ok(not has, 'no Hollow King in this build'); page.close(); return
    spawn_king(page)
    d = page.evaluate(f"() => {{ const k = {KING}; return [k.maxHp, window.__gg.BOSS_NAMES.hollowking, k.form]; }}")
    ok(d == [60, 'The Hollow King', 1], f'the Hollow King arrives in his first form (owner: the full form is for later) with 60 health {d}')
    page.evaluate(f"() => {{ const k = {KING}; k.powerI = 0; k.powerT = 0; }}"); time.sleep(0.2)
    col = page.evaluate("() => window.__gg.G.hkTell && window.__gg.G.hkTell.col")
    ok(col is not None, f'the column wipe glows a column first ({col})')
    before = page.evaluate("(c) => window.__gg.grid.filter(r => r[c] && !r[c].fly).length", col if col is not None else 0)
    time.sleep(1.3)
    after = page.evaluate("(c) => window.__gg.grid.filter(r => r[c] && !r[c].fly).length", col if col is not None else 0)
    ok(before > 0 and after == 0, f'then every pumpkin in that column is destroyed ({before} -> {after})')
    r = []
    for hp in (10, 3, 1):
        r.append(page.evaluate(f"() => {{ const w = window.__gg.walls[3]; w.max = 10; w.hp = {hp}; const k = {KING}; k.powerI = 1; k.powerT = 0; return new Promise(res => setTimeout(() => res(w.hp), 200)); }}"))
    ok(r == [5, 1, 1], f'the fence smash takes half his lane\'s fence, never below 1 (10, 3, 1 -> {r})')
    d = page.evaluate(f"""() => {{ const G = window.__gg.G, k = {KING}, n0 = G.monsters.length, s0 = G.spawned, pool = G.def.pool.map(e => e[0]); k.powerI = 2; k.powerT = 0;
      return new Promise(res => setTimeout(() => {{ const nw = G.monsters.slice(n0).filter(m => !m.dead); res([nw.length, nw.every(m => m.minion), nw.every(m => pool.includes(m.vkey || m.type)), G.spawned === s0]); }}, 200)); }}""")
    ok(4 <= d[0] <= 6 and all(d[1:]), f'the summon brings 4-6 of the night\'s monsters as extras {d}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_hk_powers': check_hk_powers})


FORM = "window.__gg.G.monsters.find(m => m.hkClone && !m.dead)"
HKF = ['gravekeeper', 'poltergeist', 'hexwitch', 'vampirecount', 'twintides']
HKF_HP = [15, 20, 22, 24, 14]


def hk_hit(page, who, amt, last=0):
    return page.evaluate(f"() => {{ const m = {who}; if (!m) return null; m.lastHit = {last}; window.__gg.damage(m, {amt}); return m.hp; }}")


def check_hk_phases(browser, url, on):
    if not R3:
        return
    page, errors = open_page(browser, url)
    spawn_king(page); time.sleep(0.3)
    bar = "() => parseFloat(document.querySelector('#prog').style.width)"
    floors = [60, 48, 36, 24, 12]
    for i, (kind, hp) in enumerate(zip(HKF, HKF_HP)):
        f = page.evaluate(f"() => {{ const f = {FORM}; return f && [f.kind, f.maxHp, f.look, f.form, f.twin || null]; }}")
        ok(f == [kind, hp, 'hollowking', 1, None], f'phase {i + 1}: a {kind} form in his colours with {hp} health {f}')
        k0 = page.evaluate(f"() => {KING}.hp")
        ok(k0 == floors[i], f'phase {i + 1}: the king is at {floors[i]} ({k0})')
        if i == 0:
            hk_hit(page, KING, 5)
            for last in (3, -1, 7, 8):   # burn, glue/tools, Black splash, Deep Blue lightning
                hk_hit(page, KING, 2, last)
            ok(page.evaluate(f"() => {KING}.hp") == 60, 'while a form stands, nothing hurts the king')
            ok(page.evaluate("() => window.__gg.G.floats.some(f => f.text === 'No damage')"), 'he shows "No damage"')
            time.sleep(0.4); w0 = page.evaluate(bar)
            hk_hit(page, FORM, 5); time.sleep(0.4)
            ok(page.evaluate(bar) == w0, f'hurting the form does not move the boss bar ({w0})')
        if i == 1:
            page.wait_for_function("() => !(window.__gg.G.hkDrop || []).length", timeout=5000)
            baked = page.evaluate("(ks) => ks.filter(k => window.__gg.isBaked('hollowking|' + k))", HKF)
            ok('gravekeeper' not in baked and len(baked) <= 2, f'spent form frames are dropped: at most two forms baked {baked}')
        hk_hit(page, FORM, 999); time.sleep(0.2)
        ok(page.evaluate(f"() => !{FORM}"), f'phase {i + 1}: the {kind} form falls for good')
        if i < 4:
            hk_hit(page, KING, 999); time.sleep(0.3)
    ok(page.evaluate(f"() => !!{KING} && {KING}.hp === 12 && !{FORM}"), 'after the fifth form the king stands open at 12')
    time.sleep(0.4); w1 = page.evaluate(bar)
    ch = page.evaluate("() => window.__gg.save.chests.length")
    hk_hit(page, KING, 999); time.sleep(0.4)
    ok(page.evaluate("() => window.__gg.G.bossDead === true"), 'then he dies and the boss is beaten')
    ok(w1 > 70, f'the boss bar tracked the king down ({w1:.0f}%)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_hk_continue(browser, url, on):
    if not R3:
        return
    page, errors = open_page(browser, url)
    spawn_king(page); time.sleep(0.3)
    for _ in range(2):
        hk_hit(page, FORM, 999); time.sleep(0.1); hk_hit(page, KING, 999); time.sleep(0.2)
    page.evaluate(f"() => {{ {FORM}.hp = 10; }}")
    c = page.evaluate("() => window.__gg.continueState()")
    ok(c['hk'] == {'phase': 3, 'hp': 36, 'formHp': 10} and len(c['bossHp']) == 1, f"the snapshot keeps the phase, his health and the form's {c.get('hk')} {c.get('bossHp')}")
    page.evaluate("(c) => window.__gg.continueNight(c)", c); time.sleep(0.3)
    page.evaluate("() => { const G = window.__gg.G; G.spawned = Math.max(G.spawned, Math.ceil(G.def.total * 0.4)); G.def.boss = 'hollowking'; G.spawnTimer = 0; }"); time.sleep(0.3)
    page.evaluate(f"() => {{ const k = {KING}; if (k) k.p = 0.3; }}"); time.sleep(0.4)
    d = page.evaluate(f"() => {{ const k = {KING}, f = {FORM}; return [k && k.hp, k && k.hkPhase, f && f.kind, f && f.hp]; }}")
    ok(d == [36, 3, 'hexwitch', 10], f'a continued night brings him back at 36 with the hurt Hexwitch form {d}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_hk_phases': check_hk_phases, 'check_hk_continue': check_hk_continue})


def beat_king(page, rnd):
    page.evaluate(f"() => {{ const k = {KING}; k.p = 0.3; }}"); time.sleep(0.3)
    for i in range(5):
        hk_hit(page, FORM, 999); time.sleep(0.15)
        if i < 4:
            hk_hit(page, KING, 999); time.sleep(0.25)
    ch = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate(f"(r) => {{ const old = Math.random; Math.random = () => r; try {{ const k = {KING}; k.lastHit = 0; window.__gg.damage(k, 999); }} finally {{ Math.random = old; }} }}", rnd)
    time.sleep(0.2)
    return page.evaluate("(n) => window.__gg.save.chests.slice(n)", ch)


def check_6_20(browser, url, on):
    if not R3:
        return
    page, errors = open_page(browser, url)
    set_stars(page, {n: 3 for n in range(1, 120)})
    start(page, 120)
    d = page.evaluate("() => { const d = window.__gg.G.def; return { label:d.label, name:d.name, boss:d.boss, form:d.bossForm, frenzy:!!d.frenzy, fog:(d.fog || []).length, xc:d.extraChestP, pool:d.pool.map(e => e[0]).sort() }; }")
    ok(d['label'] == '6-20' and d['name'] == 'The Hollow King' and d['boss'] == 'hollowking' and d['form'] == 1, f'6-20 is the Hollow King, first form {d}')
    ok(not d['frenzy'] and d['fog'] == 0 and d['xc'] == 0.5, f'no jukebox, no fog, a 50% second chest {d}')
    ok(d['pool'] == sorted(['firemummy', 'fogwalker', 'witch', 'bulwark', 'turtle']), f"his minions are the revisit monsters {d['pool']}")
    ok(grave_cells(page) == sorted(CROWN), f'graves in a crown {grave_cells(page)}')
    ok(page.evaluate("() => ['hollowking', 'hollowking|gravekeeper'].every(k => window.__gg.isBaked(k)) && !window.__gg.isBaked('hollowking|form2')"), 'his first-form frames and the first world boss form are baked before the night, not the full form')
    page.evaluate("() => { const G = window.__gg.G; G.sproutT = -999; G.spawned = Math.ceil(G.def.total * 0.4); G.spawnTimer = 0; }"); time.sleep(0.5)
    ok(page.evaluate(f"() => !!{KING} && {KING}.maxHp === 60"), 'he arrives with 60 health')
    got = beat_king(page, 0.1)
    boss = [c for c in got if c['kind'] == 'boss']
    ok(len(boss) == 2 and all(c['boss'] is None for c in boss), f'a lucky roll gives two boss chests, no boss items {got}')
    time.sleep(1.5)
    start(page, 120)
    page.evaluate("() => { const G = window.__gg.G; G.sproutT = -999; G.spawned = Math.ceil(G.def.total * 0.4); G.spawnTimer = 0; }"); time.sleep(0.5)
    got = beat_king(page, 0.9)
    ok(len([c for c in got if c['kind'] == 'boss']) == 1, f'otherwise one boss chest {got}')
    page.evaluate("() => { const G = window.__gg.G; G.spawned = G.def.total; for (const m of G.monsters) m.dead = true; }"); time.sleep(2.5)
    ok(page.evaluate("() => window.__gg.G.over && window.__gg.save.stars[120] > 0"), 'clearing the field wins 6-20, the last night of the world')
    time.sleep(1.5)
    page.evaluate("() => window.__gg.openPreview(120)"); time.sleep(0.8)
    txt = page.evaluate("() => document.body.innerText")
    ok('Hollow King' in txt, 'the level card names the Hollow King')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_6_20': check_6_20})


def check_review_fixes(browser, url, on):
    """Final review (2026-11-02): the king is immune until he arrives; a phase-0 continue splits; a king below his floor still splits;
    spent form frames go with the night; the wipe glow goes with him; Rainbow keeps its glow; a Beige-locked chameleon is drawn beige."""
    if not R3:
        return
    page, errors = open_page(browser, url)
    start(page, 104)
    page.evaluate("() => { const G = window.__gg.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.def.boss = 'hollowking'; G.bossSpawned = true; window.__gg.spawnMonster('boss:hollowking', 3, false, undefined, 1); }")
    hp = hk_hit(page, KING, 999)
    ok(hp == 60, f'before he arrives the king takes no damage ({hp})')
    page.evaluate(f"() => {{ {KING}.p = 0.3; }}"); time.sleep(0.3)
    ok(page.evaluate(f"() => !!{FORM}"), 'on arrival he splits off his first form')
    hk_hit(page, FORM, 999); time.sleep(0.1)
    page.evaluate(f"() => {{ {KING}.hp = 40; }}")   # below the phase-1 floor with no form standing (any stray path)
    hk_hit(page, KING, 1); time.sleep(0.2)
    ok(page.evaluate(f"() => !!{FORM} && {FORM}.kind === 'poltergeist'"), 'a king already below his floor splits on the next hit instead of locking up')
    page.evaluate("() => { window.__gg.G.hkTell = { col:2, t:5, dur:1 }; }")
    for _ in range(4):
        hk_hit(page, FORM, 999); time.sleep(0.1); hk_hit(page, KING, 999); time.sleep(0.2)
    hk_hit(page, KING, 999); time.sleep(0.2)
    ok(page.evaluate("() => window.__gg.G.bossDead && !window.__gg.G.hkTell"), 'when he dies his wipe warning goes with him')
    # a continued night saved before he arrived (phase 0)
    start(page, 104)
    page.evaluate("() => { const G = window.__gg.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.def.boss = 'hollowking'; G.bossSpawned = true; G.hkRestore = { phase:0, hp:60, formHp:null }; window.__gg.spawnMonster('boss:hollowking', 3, false, 0.3, 1); }")
    time.sleep(0.3)
    ok(page.evaluate(f"() => !!{FORM} && {KING}.hkPhase === 1"), 'a night continued from before his arrival still starts with a split')
    time.sleep(0.5)
    start(page, 104); time.sleep(0.3)
    baked = page.evaluate("(ks) => ks.filter(k => window.__gg.isBaked('hollowking|' + k))", HKF)
    ok(baked == [], f'a new night forgets the forms baked for the last one {baked}')
    d = page.evaluate("() => { const g = window.__gg; return [g.LIT_HALO.length === g.PTYPES.length, JSON.stringify(g.LIT_HALO[g.RAINBOW]), !!g.CHARS.chameleon.variants['c' + g.BEIGE], !!g.CHARS.rchameleon.variants['c' + g.BEIGE]]; }")
    ok(d == [True, '[255,230,140]', True, True], f'Rainbow keeps its glow and chameleons can wear Beige {d}')
    set_stars(page, {n: 3 for n in range(1, 121)})
    page.evaluate("() => window.__gg.openBook(5)"); time.sleep(0.8)
    t = page.evaluate("() => { const b = [...document.querySelectorAll('#bkLevels .pg')]; const f = n => b[n - 1] && [!!b[n - 1].querySelector('.devilStamp'), !!b[n - 1].querySelector('canvas')]; return [f(8), f(20)]; }")
    ok(t == [[True, False], [False, True]], f'6-20 shows the Hollow King stamp, the other boss nights keep the devil {t}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_review_fixes': check_review_fixes})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--expect', choices=['on', 'r2', 'off'], required=True)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    global R3, MODE
    MODE = a.expect; R3 = a.expect == 'on'
    on = a.expect in ('on', 'r2')
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
