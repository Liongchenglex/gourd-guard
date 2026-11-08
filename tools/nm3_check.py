"""Release 7 checks (Nightmare Witchwood, docs/superpowers/specs/2026-11-08-release-7-nightmare-witchwood-design.md),
against a build served by tools/serve_dist.py. Every Release 7 task adds its checks to CHECKS.
  Playtest build:  npm run build:playtest             then  .venv/bin/python tools/nm3_check.py --url http://127.0.0.1:4174/ --expect on
  Release 6 build: VITE_RELEASE=6 npx vite build      then  ... --expect r6   (nothing from Release 7)
  Release 5 build: VITE_RELEASE=5 npx vite build      then  ... --expect r5
  Release 4/3/2:   VITE_RELEASE=4|3|2 npx vite build  then  ... --expect r4|r3|r2
  Store build:     npm run build                      then  ... --expect off
Checks read the global R7 (on only). Exits 1 on any failure. --only runs one check by name."""
import argparse, sys, time, os
from playwright.sync_api import sync_playwright

from w6_check import open_page, ok, FAILS, start, bundle_js, set_stars

R7 = False   # set by --expect: the build holds Release 7 (playtest)
MODE = 'on'


def nm3_start(page, k, coach=False):
    """Start Nightmare 3-k (night 1200 + k). The gourd coaches (Release 4's Grave Gourd, Release 5's Protector) are marked seen unless
    coach=True, so the other checks get a plain night."""
    if not coach: page.evaluate("() => { window.__gg.save.seenGourdCoach = true; window.__gg.save.seenProtectorCoach = true; }")
    start(page, 1200 + k)


def story_done(upto=60):
    return {n: 3 for n in range(1, upto + 1)}


# ---------- Task 1: the track, the book page and the release checks ----------
R7_NAMES = ["Witch's Brew", 'Wartling Gourd', 'Treant', 'Fallen Hexwitch', 'Ash Crone', 'Blood Coven Witch', 'Triptych Sprite', 'Flask Bearer', 'Cauldron Toad', 'The brew boils']


def check_r7_absent(browser, url):
    if R7: return   # the playtest build holds whichever of these the finished tasks have added; only the lower builds must hold none
    js = bundle_js()
    for s in R7_NAMES:
        ok(s not in js, f"{s!r} not in the bundle")


def check_n3_track(browser, url):
    page, errors = open_page(browser, url)
    if not R7:
        ok(page.evaluate("() => window.__gg.isOpen(1201)") is False, 'N3-1 is not open below Release 7')
        ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") <= 2, 'no third nightmare table below Release 7')
        page.close(); return
    set_stars(page, {60: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1201)") is False, 'N3-1 stays shut with 3-20 beaten but N2-4 not')
    set_stars(page, {60: 3, 1104: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1201)") is True, 'N3-1 opens once 3-20 and N2-4 are beaten')
    set_stars(page, {1104: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1201)") is False, 'N3-1 stays shut with N2-4 beaten but 3-20 not')
    set_stars(page, {60: 3, 1104: 3})
    d = page.evaluate("() => { const d = window.__gg.levelFor(1201); return [d.label, d.nightmare, d.worldNo, d.levelNo, d.world, d.gourd]; }")
    ok(d[:4] == ['N3-1', True, 3, 1] and d[5] is True, f'levelFor(1201): label N3-1, nightmare, story world 3, level 1, gourd {d}')
    ok(page.evaluate("(w) => window.__gg.WORLDS[w].name", d[4]) == 'Witchwood: Nightmare', f'its theme {d[4]} is the Witchwood nightmare map')
    ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") == 3, 'NIGHTMARE_LEVELS holds the patch, hollow and witchwood tables')
    ok(page.evaluate("() => window.__gg.nmNight(3, 1)") == 1201, 'nmNight(3, 1) = 1201')
    ok(page.evaluate("() => window.__gg.isOpen(1202)") is False, 'N3-2 does not exist yet / stays shut')
    nm3_start(page, 1)
    g = page.evaluate("() => { const G = window.__gg.G; return [G.def.label, G.world, G.n, window.__gg.state]; }")
    ok(g == ['N3-1', d[4], 1201, 'play'], f'N3-1 starts on the witchwood nightmare map {g}')
    time.sleep(1.0)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def open_nm_book(page, w):
    page.evaluate("(w) => window.__gg.openBook(w)", w); time.sleep(0.6)
    if page.evaluate("() => !document.querySelector('#spread').classList.contains('nightmare')"): page.click('#bBookmark')
    time.sleep(0.8)


def check_n3_book(browser, url):
    if not R7: return
    page, errors = open_page(browser, url)
    # 3-20 beaten, N2-4 not: the bookmark shows, the page says what is missing and has no stamps
    set_stars(page, story_done())
    page.evaluate("() => window.__gg.openBook(2)"); time.sleep(0.6)
    ok(page.evaluate("() => !document.querySelector('#bBookmark').hidden"), 'the world 3 bookmark appears once 3-20 is beaten')
    page.click('#bBookmark'); time.sleep(0.8)
    t = page.evaluate("() => [document.querySelector('#bkSoon').hidden, document.querySelector('#bkLevels').hidden, document.querySelector('#bkSoon').textContent]")
    ok(not t[0] and t[1] and 'Beat Nightmare 2-4' in t[2], f'a locked page says what is missing {t}')
    # 3-20 not beaten (N2-4 is, and 3-19 too): no bookmark at all
    set_stars(page, {**{n: 3 for n in range(1, 60)}, 1104: 3})
    page.evaluate("() => window.__gg.openBook(2)"); time.sleep(0.6)
    ok(page.evaluate("() => document.querySelector('#bBookmark').hidden"), 'no bookmark with only 3-19 beaten')
    # both gates met: 16 stamps, N3-1 open, the rest "Coming soon" / shut
    set_stars(page, {**story_done(), 1104: 3})
    open_nm_book(page, 2)
    pg = page.evaluate("() => [...document.querySelectorAll('#bkLevels .pg')].map(b => [b.disabled, b.textContent])")
    soon = page.evaluate("() => [document.querySelector('#bkSoon').hidden, document.querySelector('#bkLevels').hidden]")
    ok(len(pg) == 16, f'the world 3 nightmare page shows 16 stamps ({len(pg)})')
    ok(soon == [True, False], f'the page shows the stamps, not the locked message {soon}')
    if len(pg) == 16:
        ok(not pg[0][0] and all(b[0] for b in pg[1:]), 'only N3-1 is open on a fresh witchwood track')
        built = page.evaluate("() => window.__gg.NIGHTMARE_LEVELS[2].length")
        ok(sum(1 for b in pg if 'Coming soon' in b[1]) == 16 - built, f'the {16 - built} levels not built yet read "Coming soon"')
    # the world 1 and 2 pages are unchanged
    set_stars(page, {**story_done(), 1004: 3, 1104: 3})
    for w in (0, 1):
        open_nm_book(page, w)
        ok(page.evaluate("() => document.querySelectorAll('#bkLevels .pg').length") == 16, f'the world {w + 1} nightmare page still shows 16 stamps')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS = {'check_r7_absent': check_r7_absent, 'check_n3_track': check_n3_track, 'check_n3_book': check_n3_book}


# ---------- Task 2: potions on the field ----------
# A quiet N3-1: nothing spawning or sprouting, no monsters, no potions and no potion clock (G.potionT far off, G.def.potions null), no hint arrow.
PQ = """() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.projs.length = 0; G.drops.length = 0;
  if (G.fires) G.fires.length = 0; G.fmNext = 99; G.fireTrickleT = 1e9; G.def.potions = null; G.potionT = 1e9; G.potions.length = 0;
  G.idle = -1e9; G.hint = null; }"""   # no idle hint arrow either (it would show up in the draw budget)


def potion_page(browser, url):
    page, errors = open_page(browser, url)
    nm3_start(page, 1); time.sleep(0.3)
    page.evaluate(PQ)
    return page, errors


def gwait(page, js, game_s, wall=40):
    """Poll until js is truthy or `game_s` game seconds pass (the machine is sometimes loaded: time in game seconds). Returns the game time it took, or None."""
    t0 = page.evaluate("() => window.__gg.G.t")
    end = time.time() + wall
    while time.time() < end:
        r = page.evaluate("([js, t0]) => [!!(eval(js))(), window.__gg.G.t - t0]", [js, t0])
        if r[0]: return r[1]
        if r[1] > game_s: return None
        time.sleep(0.03)
    return None


def gsleep(page, game_s, wall=40):
    """Sleep `game_s` game seconds."""
    gwait(page, "() => false", game_s, wall)


def check_potion_place(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    tp = page.evaluate("() => window.__gg.TILE_P()")
    r = page.evaluate("() => { const g = window.__gg; return [g.placePotion(3, 0.5, 'bulky'), g.placePotion(3, 0.5, 'speed'), g.G.potions.map(o => [o.lane, o.p, o.kind])]; }")
    ok(r[0] is True and r[1] is False, f'placePotion(3, 0.5) holds, a second on that tile is refused {r[:2]}')
    ok(len(r[2]) == 1 and r[2][0][0] == 3 and r[2][0][2] == 'bulky' and abs(r[2][0][1] - (int(0.5 / tp) + 0.5) * tp) < 1e-9, f'one bulky potion snapped to its tile-row centre {r[2]}')
    ok(page.evaluate("() => !!window.__gg.potionAt(3, 0.5) && !window.__gg.potionAt(2, 0.5)"), 'potionAt finds it and nothing in the next lane')
    ok(page.evaluate("() => window.__gg.placePotion(-1, 0.5, 'bulky') === false && window.__gg.placePotion(7, 0.5, 'bulky') === false"), 'off the field: refused')
    page.evaluate("() => { window.__gg.G.potions.length = 0; }")
    n = page.evaluate("() => window.__gg.placeRandomPotions(5)")
    ps = page.evaluate("() => window.__gg.G.potions.map(o => [o.lane, o.p, o.kind])")
    lo, hi = page.evaluate("() => window.__gg.FIRE_P_RANGE")
    ok(n == 5 and len(ps) == 5, f'placeRandomPotions(5) puts 5 on the field ({n}, {len(ps)})')
    ok(len({(l, round(p, 6)) for l, p, _ in ps}) == 5 and len({l for l, _, _ in ps}) == 5, f'5 different tiles in 5 different lanes {ps}')
    ok(all(lo <= p <= hi for _, p, _ in ps) and all(k in ('bulky', 'speed', 'colour') for *_, k in ps), f'inside the fire band {lo}-{hi}, each of a known kind')
    page.evaluate("() => { window.__gg.G.potions.length = 0; }")
    page.evaluate("() => window.__gg.placeRandomPotions(4, ['speed'])")
    ok(page.evaluate("() => window.__gg.G.potions.every(o => o.kind === 'speed')"), 'kinds limits the random kinds')
    ok(page.evaluate("() => JSON.stringify(window.__gg.POTION_KINDS)") == '["bulky","speed","colour"]', 'POTION_KINDS = bulky, speed, colour')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_potion_clock(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    page.evaluate("() => { const G = window.__gg.G; G.def.potions = { every:4, count:[2, 2], cap:3 }; G.potionT = 4; }")
    ok(page.evaluate("() => window.__gg.potionEveryNow()") == 4, 'potionEveryNow() is the level\'s every with no brew marks')
    t2 = gwait(page, "() => window.__gg.G.potions.length >= 1", 6)
    n2 = page.evaluate("() => window.__gg.G.potions.length")
    ok(t2 is not None and abs(t2 - 4) < 0.3 and n2 == 2, f'2 potions at 4 s ({t2}, {n2})')
    t3 = gwait(page, "() => window.__gg.G.potions.length >= 3", 6)
    ok(t3 is not None and abs(t3 - 4) < 0.3, f'the 3rd (the cap) at 8 s ({t3} s after the first two)')
    gsleep(page, 4.5)
    ok(page.evaluate("() => window.__gg.G.potions.length") == 3, 'never above the cap of 3')
    page.evaluate("() => { const G = window.__gg.G; G.def.potions = { every:4, count:[1, 1], cap:6 }; G.potionT = 4; G.potions.length = 0; }")
    ok(page.evaluate("() => { const G = window.__gg.G; return G.def.potions.kinds; }") is None, '(no kinds given)')
    page.evaluate("() => { const g = window.__gg; for (let i = 0; i < 40; i++) g.updatePotions(0.1); }")
    ok(page.evaluate("() => window.__gg.G.potions.length") >= 1, 'with no kinds the clock still places (all kinds by default)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


GHOUL = "([l, p, hp, sp]) => { const g = window.__gg, m = g.spawnMonster('ghoul', l, true, p); m.sp = sp; m.hp = m.maxHp = hp; window.__ms = window.__ms || []; window.__ms.push(m); return window.__ms.length - 1; }"


def mon(page, i, js):
    return page.evaluate(f"(i) => {{ const m = window.__ms[i]; return ({js}); }}", i)


def check_potion_drink(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    tp = page.evaluate("() => window.__gg.TILE_P()")
    page.evaluate("() => window.__gg.placePotion(3, 0.5, 'bulky')")
    i = page.evaluate(GHOUL, [3, 0.5 - 2 * tp, 3, 0.12])
    t = gwait(page, "() => !window.__gg.potionAt(3, 0.5)", 4)
    ok(t is not None, f'a ghoul walking onto the bulky potion drinks it: the potion is gone ({t})')
    ok(mon(page, i, "[m.hp, m.maxHp, !!(m.drank && m.drank.bulky)]") == [6, 6, True], f'bulky: 3 hp -> 6/6 and drank.bulky {mon(page, i, "[m.hp, m.maxHp]")}')
    page.evaluate("() => { window.__ms[0].sp = 0; window.__gg.placePotion(3, window.__ms[0].p, 'bulky'); window.__gg.updatePotions(0); }")
    ok(page.evaluate("() => !!window.__gg.potionAt(3, window.__ms[0].p)") and mon(page, i, "[m.hp, m.maxHp]") == [6, 6], 'a second bulky: unchanged, the potion stays')
    page.evaluate("() => { const g = window.__gg; g.G.potions.length = 0; g.G.monsters.length = 0; window.__ms = []; }")
    # speed: two ghouls at the same pace; the one that drank covers 1.5x the distance
    a = page.evaluate(GHOUL, [1, 0.1, 3, 0.05]); b = page.evaluate(GHOUL, [5, 0.1, 3, 0.05])
    page.evaluate("() => { window.__gg.placePotion(1, 0.1, 'speed'); window.__gg.updatePotions(0); }")
    ok(mon(page, a, "!!(m.drank && m.drank.speed)") and not page.evaluate("() => !!window.__gg.potionAt(1, 0.1)"), 'a ghoul on a speed potion drinks it')
    p0 = page.evaluate("() => window.__ms.map(m => m.p)")
    gsleep(page, 2)
    p1 = page.evaluate("() => window.__ms.map(m => m.p)")
    ra = (p1[0] - p0[0]) / max(1e-9, p1[1] - p0[1])
    ok(abs(ra - 1.5) < 0.08, f'speed: it covers 1.5x the distance in 2 s ({p1[0] - p0[0]:.4f} vs {p1[1] - p0[1]:.4f}, x{ra:.3f})')
    # chew: both at their fences; the speedy one chews 1.5x as fast
    page.evaluate("() => { const g = window.__gg; for (const m of window.__ms){ m.p = 1; m.eating = true; } g.walls[1].hp = g.walls[1].max = 999; g.walls[5].hp = g.walls[5].max = 999; }")
    gsleep(page, 2)
    w = page.evaluate("() => [999 - window.__gg.walls[1].hp, 999 - window.__gg.walls[5].hp]")
    rc = w[0] / max(1e-9, w[1])
    ok(w[1] > 0 and abs(rc - 1.5) < 0.08, f'speed: it chews its fence 1.5x as fast ({w[0]:.3f} vs {w[1]:.3f}, x{rc:.3f})')
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; window.__ms = []; g.G.potions.length = 0; for (const w of g.walls) w.hp = w.max; }")
    # colour: 10% chameleon, 90% reverse chameleon
    for rv, want in ((0.05, 'lock'), (0.5, 'immune')):
        c = page.evaluate(GHOUL, [2, 0.5, 3, 0])
        got = page.evaluate("""([i, rv]) => { const g = window.__gg, m = window.__ms[i], R = Math.random; g.placePotion(2, m.p, 'colour');
          Math.random = () => rv; try { g.updatePotions(0); } finally { Math.random = R; }
          return [m.colourLock, m.colourImmune, !!(m.drank && m.drank.colour), !!g.potionAt(2, m.p)]; }""", [c, rv])
        good = (got[0] is not None and got[1] is None) if want == 'lock' else (got[0] is None and got[1] is not None)
        ok(good and got[2] and not got[3], f'colour with Math.random {rv}: {"a Chameleon" if want == "lock" else "a Reverse Chameleon"} {got}')
        page.evaluate("(i) => { window.__ms[i].dead = true; }", c)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_potion_refuse(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    cases = [('boss', 'boss'), ('mummy', 'mummy'), ('firemummy', 'Flaming Mummy'), ('crow', 'crow'), ('ghoul:rise', 'rising ghoul')]
    for key, name in cases:
        r = page.evaluate("""(key) => { const g = window.__gg, G = g.G; G.monsters.length = 0; G.potions.length = 0;
          const [k, rise] = key.split(':'), m = g.spawnMonster(k, 3, true, 0.5); m.sp = 0; if (rise) m.rise = 3;
          g.placePotion(3, m.p, 'bulky'); const hp = [m.hp, m.maxHp]; g.updatePotions(0);
          return [!!g.potionAt(3, m.p), m.hp === hp[0] && m.maxHp === hp[1], !(m.drank && m.drank.bulky), g.canDrink(m, 'bulky')]; }""", key)
        ok(r[:3] == [True, True, True] and r[3] is False, f'a {name} leaves a bulky potion in place {r}')
    r = page.evaluate("""() => { const g = window.__gg, G = g.G; G.monsters.length = 0; G.potions.length = 0;
      const m = g.spawnMonster('chameleon', 3, true, 0.5); m.sp = 0; m.hp = m.maxHp = 2; const lock = m.colourLock;
      g.placePotion(3, m.p, 'colour'); g.updatePotions(0); const a = [!!g.potionAt(3, m.p), m.colourLock === lock, g.canDrink(m, 'colour')];
      G.potions.length = 0; g.placePotion(3, m.p, 'bulky'); g.updatePotions(0); return [...a, !!g.potionAt(3, m.p), m.hp, m.maxHp]; }""")
    ok(r[:3] == [True, True, False], f'a Chameleon leaves a colour potion {r[:3]}')
    ok(r[3:] == [False, 4, 4], f'but drinks a bulky one (2 -> 4/4) {r[3:]}')
    r = page.evaluate("""() => { const g = window.__gg, G = g.G; G.monsters.length = 0; G.potions.length = 0;
      const m = g.spawnMonster('ghoul', 3, true, 0.5); m.sp = 0; m.hp = 0; m.dead = true; return g.canDrink(m, 'speed'); }""")
    ok(r is False, 'a dead monster may not drink')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_potion_bulwark(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    i = page.evaluate(GHOUL, [3, 0.5, 3, 0])
    page.evaluate("() => { const g = window.__gg; g.placePotion(3, 0.5, 'bulky'); g.updatePotions(0); }")
    ok(mon(page, i, "[m.hp, m.maxHp]") == [6, 6], f'a bulky ghoul: 6/6 {mon(page, i, "[m.hp, m.maxHp]")}')
    page.evaluate("() => { const g = window.__gg, k = g.spawnMonster('bulwark', 4, true, 0.5); k.sp = 0; k.hp = k.maxHp = 99; window.__k = k; }")
    t = gwait(page, "() => window.__ms[0].maxHp === 12", 2)
    ok(t is not None and mon(page, i, "[m.hp, m.maxHp]") == [12, 12], f'inside a Bulwark aura: 12/12 {mon(page, i, "[m.hp, m.maxHp]")}')
    page.evaluate("() => { window.__k.dead = true; }")
    t = gwait(page, "() => window.__ms[0].maxHp === 6", 2)
    ok(t is not None and mon(page, i, "[m.hp, m.maxHp, !!m.drank.bulky]") == [6, 6, True], f'out again: 6/6, still bulky {mon(page, i, "[m.hp, m.maxHp]")}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_potion_continue(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    page.evaluate("""() => { const g = window.__gg, G = g.G; G.def.potions = { every:9, count:[1, 2], cap:6 }; G.potionT = 5.5;
      g.placePotion(1, 0.4, 'bulky'); g.placePotion(4, 0.6, 'speed'); g.placePotion(6, 0.3, 'colour');
      const m = g.spawnMonster('ghoul', 2, false, 0.3); m.sp = 0; m.hp = m.maxHp = 3; g.drink(m, 'bulky'); g.drink(m, 'speed'); }""")
    before = page.evaluate("() => window.__gg.G.potions.map(o => [o.lane, +o.p.toFixed(6), o.kind]).sort()")
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); window.__c = c; g.continueNight(c); }"); time.sleep(0.3)
    after = page.evaluate("() => window.__gg.G.potions.map(o => [o.lane, +o.p.toFixed(6), o.kind]).sort()")
    ok(len(before) == 3 and after == before, f'a continued night keeps the potions on the field {before} -> {after}')
    pt = page.evaluate("() => window.__gg.G.potionT")
    ok(4.5 < pt <= 5.5, f'and the potion clock carries on ({pt})')
    page.evaluate("() => { const G = window.__gg.G; G.spawnTimer = 0; G.potionT = 1e9; }")
    t = gwait(page, "() => window.__gg.G.monsters.some(m => !m.minion)", 8)
    d = page.evaluate("() => { const m = window.__gg.G.monsters.find(m => !m.minion); return m && [m.drank || null, m.hp, m.maxHp, window.__gg.TYPES[m.type].hp]; }")
    ok(t is not None and d and d[0] and d[0].get('bulky') and d[0].get('speed') and d[1] == d[2] == 2 * d[3], f'the drinker that was on the field comes back with what it drank (bulky + speed, double health) {d}')
    page.evaluate("() => { const G = window.__gg.G; G.spawnTimer = 999; G.monsters.forEach(m => m.dead = true); G.spawnTimer = 0; }")
    t = gwait(page, "() => window.__gg.G.monsters.some(m => !m.minion && !m.dead)", 8)
    d2 = page.evaluate("() => { const m = window.__gg.G.monsters.find(m => !m.minion && !m.dead); return m && (m.drank || null); }")
    ok(t is not None and not (d2 and any(d2.values())), f'only one drinker was carried: the next monster drank nothing {d2}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_potion_budget(browser, url):
    """check_fire_budget (tools/nm_check.py) for potions: six potions and three buffed monsters add at most 12 drawImage calls a frame, no fill or stroke."""
    if not R7: return
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillRect', 'fillText', 'strokeText', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; } })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm3_start(page, 1); time.sleep(3.2)
    page.evaluate(PQ)
    page.evaluate("() => { const g = window.__gg; window.__b = [0, 2, 4].map(l => { const m = g.spawnMonster('ghoul', l, true, 0.3); m.sp = 0; m.hp = m.maxHp = 3; return m; }); }")
    time.sleep(1.2)
    count = "() => new Promise(res => { window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 30) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.drawImage || 0) / 30, (c.fill || 0) / 30, (c.stroke || 0) / 30, ((c.createRadialGradient || 0) + (c.createLinearGradient || 0)) / 30]); } }; requestAnimationFrame(tick); })"
    base = page.evaluate(count)
    n = page.evaluate("""() => { const g = window.__gg, tp = g.TILE_P(); let n = 0; for (const [l, r] of [[1, 3], [3, 3], [5, 3], [6, 4], [1, 5], [5, 5]]) if (g.placePotion(l, (r + 0.5) * tp, g.POTION_KINDS[n % 3])) n++;
      const [a, b, c] = window.__b; a.drank = { bulky:true }; b.drank = { speed:true }; c.drank = { colour:true }; return n; }""")
    time.sleep(1.0)
    lit = page.evaluate(count)
    ok(n == 6, f'6 potions placed ({n})')
    ok(lit[0] - base[0] <= 12.5, f'6 potions and 3 buffed monsters add at most 12 drawImage calls a frame ({base[0]:.1f} -> {lit[0]:.1f})')
    ok(lit[1] <= base[1] + 0.1 and lit[2] <= base[2] + 0.1 and lit[3] <= base[3] + 0.1, f'and no fill, stroke or gradient (fill {base[1]:.1f} -> {lit[1]:.1f}, stroke {base[2]:.1f} -> {lit[2]:.1f}, gradients {base[3]:.1f} -> {lit[3]:.1f})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_potion_place': check_potion_place, 'check_potion_clock': check_potion_clock, 'check_potion_drink': check_potion_drink, 'check_potion_refuse': check_potion_refuse,
               'check_potion_bulwark': check_potion_bulwark, 'check_potion_continue': check_potion_continue, 'check_potion_budget': check_potion_budget})



# ---------- Task 7: the Flask Bearer and the Cauldron Toad ----------
def tile_of(page, p):
    """The tile row that holds field position p, and the field's row count (engine/potion.js rowOf / rows)."""
    return page.evaluate("(p) => { const tp = window.__gg.TILE_P(), n = Math.max(1, Math.floor(1 / tp)); return [Math.min(n - 1, Math.max(0, Math.floor(p / tp))), n]; }", p)


def potions_rc(page):
    """Every potion as [lane, row, kind]."""
    return page.evaluate("() => { const tp = window.__gg.TILE_P(); return window.__gg.G.potions.map(o => [o.lane, Math.floor(o.p / tp), o.kind]); }")


KILL = "(i) => { const g = window.__gg, m = window.__ms[i]; m.lastHit = m.colourLock != null ? m.colourLock : -1; g.damage(m, 999); return [m.dead, m.hp]; }"   # a hit any colour hex lets through
NEW = "([k, l, p]) => { const g = window.__gg, m = g.spawnMonster(k, l, false, p); m.sp = 0; window.__ms = window.__ms || []; window.__ms.push(m); return window.__ms.length - 1; }"


def check_flaskbearer(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    t = page.evaluate("() => { const T = window.__gg.TYPES.flaskbearer; return T && [T.hp, T.sp, T.r, T.coins, T.eat, T.pts, T.drop]; }")
    ok(t == [2, 0.055, 18, 8, 0.5, 24, 2], f'flaskbearer: hp 2, sp 0.055, r 18, coins 8, eat 0.5, pts 24, drop 2 {t}')
    ok(page.evaluate("() => window.__gg.MNAME.flaskbearer") == 'Flask Bearer', 'its name is the Flask Bearer')
    row, _ = tile_of(page, 0.5)
    i = page.evaluate(NEW, ['flaskbearer', 3, 0.5])
    d = page.evaluate(KILL, i)
    ps = potions_rc(page)
    ok(d[0] is True, f'a Flask Bearer dies {d}')
    ok(len(ps) == 1 and ps[0][:2] == [3, row] and ps[0][2] in ('bulky', 'speed', 'colour'), f'one potion of a random kind on its tile (lane 3, row {row}) {ps}')
    # its tile is taken: the potion goes to the nearest free tile
    j = page.evaluate(NEW, ['flaskbearer', 3, 0.5])
    page.evaluate(KILL, j)
    ps = potions_rc(page)
    ok(len(ps) == 2 and max(abs(ps[1][0] - 3), abs(ps[1][1] - row)) == 1, f'its tile taken: the second goes on a tile next to it {ps}')
    # kinds are random: 30 deaths in a clear field show every kind
    kinds = page.evaluate("""() => { const g = window.__gg, G = g.G, seen = new Set(); for (let n = 0; n < 30; n++){ G.potions.length = 0;
      const m = g.spawnMonster('flaskbearer', 2, false, 0.4); m.sp = 0; g.damage(m, 999); for (const o of G.potions) seen.add(o.kind); } return [...seen].sort(); }""")
    ok(kinds == ['bulky', 'colour', 'speed'], f'its potion is a random kind: all three seen in 30 deaths {kinds}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_toad_tongue(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    t = page.evaluate("() => { const T = window.__gg.TYPES.toad; return T && [T.hp, T.sp, T.r, T.coins, T.eat, T.pts, T.drop, T.tongueHold]; }")
    ok(t == [5, 0.03, 24, 10, 0.5, 30, 2, 0.67], f'toad: hp 5, sp 0.03, r 24, coins 10, eat 0.5, pts 30, drop 2, tongueHold 0.67 {t}')
    ok(page.evaluate("() => window.__gg.MNAME.toad") == 'Cauldron Toad', 'its name is the Cauldron Toad')
    page.evaluate("() => { for (const w of window.__gg.walls){ w.hp = w.max = 99; } }")
    i = page.evaluate(NEW, ['toad', 2, 0.55]); page.evaluate("(i) => { window.__ms[i].sp = 0.06; }", i)
    tt = gwait(page, "() => window.__ms[0].eating", 5)
    p = page.evaluate("() => window.__ms[0].p")
    ok(tt is not None and abs(p - 0.67) < 1e-6, f'it walks to 0.67 of the field and stops there, lashing ({tt}, p {p})')
    page.evaluate("() => { window.__gg.walls[2].hp = 99; window.__pmax = 0; window.__t0 = window.__gg.G.t; }")
    t0 = page.evaluate("() => window.__gg.G.t")
    pmax = 0
    while page.evaluate("() => window.__gg.G.t") - t0 < 4:
        pmax = max(pmax, page.evaluate("() => window.__ms[0].p")); time.sleep(0.05)
    lost = page.evaluate("([t0]) => [99 - window.__gg.walls[2].hp, window.__gg.G.t - t0]", [t0])
    rate = lost[0] / lost[1]
    ok(abs(rate - 0.5) < 0.05, f'its own fence loses about 2 in 4 s ({lost[0]:.2f} in {lost[1]:.2f} s, {rate:.3f}/s)')
    ok(pmax <= 0.67 + 1e-6, f'it never moves closer (max p {pmax:.4f})')
    ok(page.evaluate("() => window.__gg.walls.every((w, c) => c === 2 || w.hp === 99)"), 'no other fence is touched')
    # speed: 1.5x the tongue
    page.evaluate("() => { const g = window.__gg; g.drink(window.__ms[0], 'speed', true); g.walls[2].hp = 99; }")
    t0 = page.evaluate("() => window.__gg.G.t"); gsleep(page, 3)
    lost = page.evaluate("([t0]) => [99 - window.__gg.walls[2].hp, window.__gg.G.t - t0]", [t0])
    ok(abs(lost[0] / lost[1] - 0.75) < 0.06, f'with a speed potion 1.5x: {lost[0] / lost[1]:.3f}/s')
    # frozen: no lash
    page.evaluate("() => { window.__ms[0].frozenT = 2; window.__gg.walls[2].hp = 99; }"); gsleep(page, 1)
    ok(page.evaluate("() => window.__gg.walls[2].hp") == 99, 'frozen, it does not lash')
    page.evaluate("() => { window.__ms[0].frozenT = 0; }")
    # knocked back: it walks back to 0.67 and lashes again
    page.evaluate("() => { const m = window.__ms[0]; m.eating = false; m.p = 0.6; }")
    tt = gwait(page, "() => window.__ms[0].eating", 4)
    ok(tt is not None and abs(page.evaluate("() => window.__ms[0].p") - 0.67) < 1e-6, f'pushed back it returns to 0.67 and lashes again ({tt})')
    # its fence down: nothing to lash, it walks on to the gap
    page.evaluate("() => { window.__gg.walls[2].hp = 0; }")
    tt = gwait(page, "() => window.__ms[0].p > 0.75", 6)
    ok(tt is not None, f'with its fence down it walks on toward the gap ({tt})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_toad_burst(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    row, _ = tile_of(page, 0.5)
    i = page.evaluate(NEW, ['toad', 3, 0.5])
    page.evaluate("(i) => { const g = window.__gg, m = window.__ms[i]; g.drink(m, 'bulky', true); g.drink(m, 'speed', true); }", i)
    page.evaluate(KILL, i)
    ps = potions_rc(page)
    ok(len(ps) == 2 and sorted(k for *_, k in ps) == ['bulky', 'speed'], f'drank bulky + speed: two potions, of those kinds {ps}')
    ok(all(max(abs(l - 3), abs(r - row)) <= 1 for l, r, _ in ps) and len({(l, r) for l, r, _ in ps}) == 2, f'on two tiles around its death tile (lane 3, row {row}) {ps}')
    page.evaluate("() => { window.__gg.G.potions.length = 0; }")
    j = page.evaluate(NEW, ['toad', 4, 0.4])
    page.evaluate(KILL, j)
    ok(potions_rc(page) == [], 'drank none: no potions')
    k = page.evaluate(NEW, ['toad', 1, 0.3])
    page.evaluate("(i) => { const g = window.__gg, m = window.__ms[i]; for (const q of g.POTION_KINDS) if (g.canDrink(m, q)) g.drink(m, q, true); }", k)
    page.evaluate(KILL, k)
    ps = potions_rc(page)
    ok(sorted(x[2] for x in ps) == ['bulky', 'colour', 'speed'], f'drank all three: three potions, one of each {ps}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_toad_burst_full(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    for lane, p in ((3, 0.5), (0, 0.02)):
        page.evaluate("() => { window.__gg.G.potions.length = 0; }")
        row, nrows = tile_of(page, p)
        i = page.evaluate(NEW, ['toad', lane, p])
        # in one go (no frame between, so it drinks nothing on the field): it holds all three, every tile around is full, it dies
        nb = page.evaluate("""([i, L, R]) => { const g = window.__gg, tp = g.TILE_P(), m = window.__ms[i]; g.drink(m, 'bulky', true); g.drink(m, 'speed', true); g.drink(m, 'colour', true);
          for (let l = L - 1; l <= L + 1; l++) for (let r = R - 1; r <= R + 1; r++) g.placePotion(l, (r + 0.5) * tp, 'colour', true);
          const n = g.G.potions.length; m.lastHit = m.colourLock != null ? m.colourLock : -1; g.damage(m, 999); return n; }""", [i, lane, row])
        ps = potions_rc(page)
        new = ps[nb:]
        ok(len(new) == 3 and sorted(k for *_, k in new) == ['bulky', 'colour', 'speed'], f'(lane {lane}, row {row}) every tile around full: still its three potions {new}')
        ok(all(max(abs(l - lane), abs(r - row)) == 2 for l, r, _ in new), f'one ring further out (two tiles away) {new}')
        ok(len({(l, r) for l, r, _ in ps}) == len(ps), 'one potion per tile')
        ok(all(0 <= l < 7 and 0 <= r < nrows for l, r, _ in new), f'all on the field (lanes 0-6, rows 0-{nrows - 1}) {new}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_flaskbearer': check_flaskbearer, 'check_toad_tongue': check_toad_tongue, 'check_toad_burst': check_toad_burst, 'check_toad_burst_full': check_toad_burst_full})


# ---------- Task 3: brew marks ----------
BM = """() => { const g = window.__gg, G = g.G, d = G.def; d.total = 12; G.total = 12; d.brewMarks = [0.33, 0.66]; d.potions = { every:8, count:[1, 1] }; G.bmNext = 0; G.bmT = -99; G.spawned = 0; G.spawnTimer = 999; g.updateHud(true); }"""
BM_STATE = "() => { const G = window.__gg.G; return [G.bmNext, window.__gg.potionEveryNow(), G.monsters.filter(m => m.type === 'crow' && m.minion && !m.dead).length, document.querySelector('#banner').classList.contains('show') && document.querySelector('#bnBig').textContent]; }"


def check_brew_marks(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    page.evaluate(BM); time.sleep(0.2)
    m = page.evaluate("() => [...document.querySelectorAll('.bmMark')].map(e => [Math.round(parseFloat(e.style.left)), e.classList.contains('live'), e.classList.contains('done')])")
    ok(m == [[33, False, False], [66, False, False]], f'two brew marks on the spawn bar at 33% and 66% {m}')
    page.evaluate("() => { window.__gg.G.spawned = 2; }"); gsleep(page, 0.3)
    r = page.evaluate(BM_STATE)
    ok(r[0] == 0 and r[1] == 8 and r[2] == 0 and r[3] != 'The brew boils!', f'before the first mark: nothing happens {r}')
    page.evaluate("() => { window.__gg.G.spawned = 3; }"); gsleep(page, 0.3)
    r = page.evaluate(BM_STATE)
    ok(r[0] == 1 and r[3] == 'The brew boils!', f'at the first mark: bmNext 1 and the banner "The brew boils!" {r}')
    ok(page.evaluate("() => document.querySelector('#bnSub').textContent") == 'Crows swoop in and the potions come faster.', 'with its line')
    ok(4 <= r[2] <= 6, f'4 to 6 crows come down ({r[2]})')
    ok(r[1] == 6, f'potionEveryNow() = 0.75 x every ({r[1]})')
    ok(page.evaluate("() => window.__gg.G.spawned") == 3, 'the crows are minions: G.spawned unchanged')
    ok(page.evaluate("() => document.querySelector('.bmMark.live') !== null"), 'the mark pulses (live) when it fires')
    gsleep(page, 1.8); gsleep(page, 0.1)
    m = page.evaluate("() => [...document.querySelectorAll('.bmMark')].map(e => [e.classList.contains('live'), e.classList.contains('done')])")
    ok(m == [[False, True], [False, False]], f'the first mark shows ticked once passed {m}')
    page.evaluate("() => { window.__gg.G.spawned = 7; }"); gsleep(page, 0.3)
    r = page.evaluate(BM_STATE)
    ok(r[0] == 2 and abs(r[1] - 8 * 0.5625) < 1e-9, f'at the second mark: bmNext 2 and potionEveryNow() = 0.5625 x every ({r})')
    page.evaluate("() => { const G = window.__gg.G; G.spawned = 12; G.monsters.forEach(m => m.dead = true); }"); gsleep(page, 0.3)
    ok(page.evaluate("() => window.__gg.G.bmNext") == 2, 'never more than the level has')
    prog = page.evaluate("() => parseFloat(document.querySelector('#prog').style.width)")
    ok(prog > 99, f'the bar counts arrivals on a brew-mark night ({prog}%)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_brew_continue(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    page.evaluate(BM)
    page.evaluate("() => { window.__gg.G.spawned = 3; }"); gsleep(page, 0.3)
    ok(page.evaluate("() => window.__gg.G.bmNext") == 1, 'the first mark has passed')
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); window.__c = c; g.continueNight(c); }"); time.sleep(0.3)
    page.evaluate("() => { const G = window.__gg.G; G.def.total = 12; G.total = 12; G.def.brewMarks = [0.33, 0.66]; G.def.potions = { every:8, count:[1, 1] }; G.spawnTimer = 999; G.monsters.length = 0; G.spawned = 4; }")   # the real N3-1 has no marks: give it these and put the bar just past the first
    r = page.evaluate("() => [window.__gg.G.bmNext, window.__gg.potionEveryNow()]")
    ok(r[0] == 1 and r[1] == 6, f'a continued night keeps the marks passed (bmNext {r[0]}, every {r[1]})')
    page.evaluate("() => { window.__gg.G.spawned = 4; }"); gsleep(page, 0.4)
    r = page.evaluate(BM_STATE)
    ok(r[0] == 1 and r[2] == 0 and r[3] != 'The brew boils!', f'a passed mark does not fire again {r}')
    m = page.evaluate("() => [...document.querySelectorAll('.bmMark')].map(e => e.classList.contains('done'))")
    ok(m == [True, False], f'and shows ticked {m}')
    page.evaluate("() => { window.__gg.G.spawned = 7; }"); gsleep(page, 0.3)
    ok(page.evaluate("() => window.__gg.G.bmNext") == 2, 'the next mark still fires')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_brew_marks': check_brew_marks, 'check_brew_continue': check_brew_continue})

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--expect', choices=['on', 'r6', 'r5', 'r4', 'r3', 'r2', 'off'], required=True)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    global R7, MODE
    MODE = a.expect; R7 = a.expect == 'on'
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
