"""Release checks for branch dev (docs/RELEASES.md), against a build served by tools/serve_dist.py.
  Store build:     npm run build          then  .venv/bin/python tools/w6_check.py --url http://127.0.0.1:4173/ --expect off
  Playtest build:  npm run build:playtest then .venv/bin/python tools/w6_check.py --url http://127.0.0.1:4173/ --expect on
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
    ok(r == (999 if on else 1), f'the build is release {r} (playtest = all, store = 1)')
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
    ok(cap == ('???' if on else 'The Gravekeeper'), f"the book's boss page shows {cap!r} ({'the Hollow King as a shadow' if on else 'world 1 unchanged'})")
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
