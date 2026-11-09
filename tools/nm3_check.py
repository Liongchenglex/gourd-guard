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
    if not coach: page.evaluate("() => { window.__gg.save.seenGourdCoach = true; window.__gg.save.seenProtectorCoach = true; window.__gg.save.seenWartlingCoach = true; }")
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
    # its tile is taken: the potion goes to the nearest free tile. Spawned and killed in one go: given a frame on that tile, a Flask Bearer
    # drinks the potion standing there (as any monster does) and its own would then land on the freed tile.
    d = page.evaluate("() => { const g = window.__gg, m = g.spawnMonster('flaskbearer', 3, false, 0.5); m.sp = 0; m.lastHit = -1; g.damage(m, 999); return [m.dead, m.drank || null]; }")
    ps = potions_rc(page)
    ok(d == [True, None], f'(the second Flask Bearer died without drinking {d})')
    ok(len(ps) == 2 and ps[0][:2] == [3, row] and max(abs(ps[1][0] - 3), abs(ps[1][1] - row)) == 1, f'its tile taken: the first potion stays, the second goes on a tile next to it {ps}')
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

# ---------- Task 4: the Wartling Gourd, the picker with three gourds, the N3-5 tutorial ----------
R7_NAMES += ['Doubles launch damage', '8a5cc6', 'seenWartlingCoach']   # the Wartling's role line, its violet (render/gourd.js) and its coach flag
SHOTS = '/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/c65da5b1-63e4-4082-89bf-e6f9016bb48b/scratchpad/r7'
GON = "() => window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c])"
# Quiet the night: no spawns, no sprouts, no monsters, no graves, no potions, nothing on the patch but the gourds.
GQ = """() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.projs.length = 0; G.drops.length = 0;
  if (G.fires) G.fires.length = 0; G.fmNext = 99; G.fireTrickleT = 1e9; G.potionT = 1e9; if (G.potions) G.potions.length = 0; G.idle = -1e9; G.hint = null;
  g.graves.forEach(r => r.fill(false)); g.grid.forEach(row => row.forEach((c, i) => { if (!(c && c.gourd)) row[i] = null; })); g.resolveMatches(); }"""
ALL3 = ['grave', 'protector', 'wartling']


def gpick():   # the picker probe of nm2_check.py, imported on first use (nm2_check imports this module)
    from nm2_check import GPICK
    return GPICK


def wart_night(page, kinds, k=1, quiet=True):
    """Start N3-k with the given gourds (slot order), every gourd unlocked and every gourd coach marked seen."""
    page.evaluate("() => { const s = window.__gg.save; s.gourds = { grave:true, protector:true, wartling:true }; s.seenGourdCoach = true; s.seenProtectorCoach = true; s.seenWartlingCoach = true; }")
    page.evaluate("([n, lo, gk]) => window.__gg.startGame('story', n, lo, gk)", [1200 + k, [0, 1, 2, 3, 4], kinds]); time.sleep(0.3)
    if quiet: page.evaluate(GQ)


def check_wart_damage(browser, url):
    if not R7: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { window.__gg.save.lv.green = 1; window.__gg.save.lv.ice = 1; }")
    wart_night(page, ['grave', 'wartling'])
    ok(page.evaluate(GON) == [['grave', 2, 1], ['wartling', 2, 5]], f'Grave and Wartling start at (2, 1) and (2, 5) {page.evaluate(GON)}')
    sq = page.evaluate("() => { const g = window.__gg; return [g.inWartSquare(2, 5), g.inWartSquare(1, 4), g.inWartSquare(3, 6), g.inWartSquare(2, 3), g.inWartSquare(2, 1), g.inWartSquare(0, 5), g.isProtected(2, 5)]; }")
    ok(sq == [True, True, True, False, False, False, False], f'inWartSquare: the Wartling cell and its 3x3 only; it protects nothing {sq}')
    # launches: a bunch in its square carries wart, one outside does not
    page.evaluate("() => { const g = window.__gg; for (const c of [4, 5, 6]) g.grid[1][c] = g.newCell(0); for (const c of [1, 2, 3]) g.grid[4][c] = g.newCell(0); g.resolveMatches(); g.launchGroup(g.grid[1][5]); }")
    r = page.evaluate("() => window.__gg.G.projs.map(p => [p.lane, !!p.wart, !!p.ward])")
    ok(sorted(r) == [[4, True, False], [5, True, False], [6, True, False]], f'a bunch launched from the Wartling square: every pumpkin carries wart {r}')
    page.evaluate("() => { const g = window.__gg; window.__pin = g.G.projs.slice(); g.G.projs.length = 0; g.launchGroup(g.grid[4][2]); window.__pout = g.G.projs.slice(); g.G.projs.length = 0; }")
    ok(page.evaluate("() => window.__pout.map(p => !!p.wart)") == [False, False, False], 'a bunch launched outside it carries no wart')
    # the hit: a level-1 Green takes 2 off a 50-health ghoul from the square, 1 from outside
    d = page.evaluate("""() => { const g = window.__gg; g.G.monsters.length = 0;
      const m = g.spawnMonster('ghoul', 5, false, 0.4); m.hp = m.maxHp = 50; m.sp = 0;
      const pr = w => ({ x:g.LANE(5), y:300, vy:-900, type:0, vis:0, lv:1, guar:false, lane:5, hitWalls:new Set(), grp:{ spawned:false, small:false, kills:0 }, size:1, hit:new Set(), trail:[], r:16, dead:false, ...(w ? { wart:true } : {}) });
      g.hitMonster(pr(true), m); const a = m.hp; g.hitMonster(pr(false), m); const b = m.hp; g.hitMonster(window.__pin[0], m); const c = m.hp;
      const ice = { ...pr(true), type:2, vis:2 }; m.slowT = 0; m.frozenT = 0; g.hitMonster(ice, m);
      return [a, b, c, m.hp, m.slowT > 0 || m.frozenT > 0]; }""")
    ok(d[:3] == [48, 47, 45], f'a level-1 Green from the square takes 2 off the 50-health ghoul, 1 from outside; a launched one takes 2 too {d[:3]}')
    ok(d[3] == 43 and d[4], f'an Ice from the square does 2 and still slows or freezes {d[3:]}')
    # immunity still wins over the doubling: a reverse chameleon hit by its own colour takes nothing
    d = page.evaluate("""() => { const g = window.__gg; g.G.monsters.length = 0;
      const m = g.spawnMonster('rchameleon', 5, false, 0.4); m.colourImmune = 0; m.hp = m.maxHp = 9; m.sp = 0;
      g.hitMonster({ x:g.LANE(5), y:300, vy:-900, type:0, vis:0, lv:1, guar:false, lane:5, hitWalls:new Set(), grp:{ spawned:false, small:false, kills:0 }, size:1, hit:new Set(), trail:[], r:16, dead:false, wart:true }, m); return m.hp; }""")
    ok(d == 9, f'an immune monster stays immune to a wart hit ({d})')
    # a real flight from the square
    page.evaluate("""() => { const g = window.__gg; g.G.monsters.length = 0; g.G.projs.length = 0; g.grid.forEach(row => row.forEach((c, i) => { if (!(c && c.gourd)) row[i] = null; }));
      for (const r of [1, 3]) g.grid[r][4] = g.newCell(0); g.grid[2][4] = g.newCell(0); g.resolveMatches();
      window.__m = g.spawnMonster('ghoul', 4, false, 0.3); window.__m.hp = window.__m.maxHp = 50; window.__m.sp = 0; g.launchGroup(g.grid[2][4]); }""")
    time.sleep(1.2)
    ok(page.evaluate("() => window.__m.hp") == 44, f'a real flight of three from the square takes 6 off it ({page.evaluate("() => window.__m.hp")})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_wart_break_heal(browser, url):
    if not R7: return
    page, errors = open_page(browser, url)
    wart_night(page, ['wartling'])
    ok(page.evaluate(GON) == [['wartling', 2, 3]], f'the Wartling alone starts in the centre {page.evaluate(GON)}')
    HP = "() => window.__gg.walls.map(w => w.hp)"
    SET = "(hp) => { for (const w of window.__gg.walls){ w.max = 20; w.hp = hp; } }"
    MOVE = "([r, c]) => { const g = window.__gg, p = g.gourdPos('wartling'), x = g.grid[p.r][p.c]; g.grid[p.r][p.c] = null; g.grid[r][c] = x; }"
    page.evaluate(SET, 4); page.evaluate(MOVE, [0, 3])
    ok(page.evaluate("() => { const g = window.__gg, p = g.gourdPos('wartling'); return g.destroyGourd(g.grid[p.r][p.c]); }") is True, 'destroyGourd breaks the Wartling')
    ok(page.evaluate(HP) == [4, 4, 14, 14, 14, 4, 4], f'broken in the top row at column 3: fences 2-4 mend by half (4 -> 14 of 20), 1 and 5 unchanged {page.evaluate(HP)}')
    ok(page.evaluate("() => [window.__gg.gourdPos('wartling'), !!window.__gg.G.gourdDueOf.wartling, window.__gg.G.gourdDue]") == [None, True, False], 'it is due back (not the Grave flag)')
    page.evaluate(SET, 15); page.evaluate("() => window.__gg.spawnSprouts()")
    ok(page.evaluate("() => !!window.__gg.gourdPos('wartling')") is True, 'it comes back on the next sprout tick')
    page.evaluate(MOVE, [0, 3]); page.evaluate("() => { const g = window.__gg; g.walls[3].hp = 2; const p = g.gourdPos('wartling'); g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(page.evaluate(HP) == [15, 15, 20, 12, 20, 15, 15], f'never above full (15 -> 20), a low one +10 {page.evaluate(HP)}')
    page.evaluate("() => window.__gg.spawnSprouts()"); page.evaluate(SET, 4); page.evaluate(MOVE, [0, 0])
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('wartling'); g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(page.evaluate(HP) == [14, 14, 4, 4, 4, 4, 4], f'in the corner: only the two fences above its square {page.evaluate(HP)}')
    page.evaluate("() => window.__gg.spawnSprouts()"); page.evaluate(SET, 4); page.evaluate(MOVE, [2, 3])
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('wartling'); g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(page.evaluate(HP) == [4] * 7, f'broken in row 2: nothing heals {page.evaluate(HP)}')
    page.evaluate("() => window.__gg.spawnSprouts()"); page.evaluate(SET, 4); page.evaluate(MOVE, [1, 3])
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('wartling'); g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(page.evaluate(HP) == [4] * 7, f'broken in row 1: nothing heals {page.evaluate(HP)}')
    # a continued night keeps it
    page.evaluate("() => window.__gg.spawnSprouts()")
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); window.__snap = JSON.parse(JSON.stringify(c.gourd)); g.continueNight(c); }"); time.sleep(0.3)
    ok(page.evaluate("() => [window.__snap[0].kind, window.__gg.G.gourdKinds, window.__gg.gourdsOn().map(o => o.kind)]") == ['wartling', ['wartling'], ['wartling']], 'a continued night keeps the Wartling')
    time.sleep(0.5)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def witch_picker(page, gourds, night=1205, seen=True):
    """Open the picker on N3-k with the given gourds unlocked (every earlier nightmare night beaten), the gourd coaches seen (the Wartling's
    as `seen`)."""
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 17)}, **{1100 + k: 3 for k in range(1, 17)}, **{1200 + k: 3 for k in range(1, 5)}})
    page.evaluate("([gs, n, seen]) => { const g = window.__gg; g.save.gourds = gs; g.save.perksOff = { pick4:true }; g.save.seenGourdCoach = true; g.save.seenProtectorCoach = true; g.save.seenWartlingCoach = seen; document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); g.beginNight(n); }",
                  [{k: True for k in gourds}, night, seen]); time.sleep(0.6)
    return page.evaluate(gpick())


def check_picker_three_gourds(browser, url):
    """N3-5 offers all three gourds once the Wartling is unlocked: three tiles, two slots. The first two in unlock order start picked (the
    Wartling instead of the last while its tutorial is unseen, so the coach can run); a third tile tapped with both full replaces the last
    picked; the picked kinds reach G.gourdKinds. N2-5 and N1-5 are unchanged."""
    if not R7: return
    os.makedirs(SHOTS, exist_ok=True)
    page, errors = open_page(browser, url)
    u = witch_picker(page, ALL3)
    ok(u['state'] == 'loadout' and [t[0] for t in u['tiles']] == ALL3 and not any(t[2] for t in u['tiles']), f'N3-5: three gourd tiles in unlock order, none locked {u["tiles"]}')
    ok(u['slots'] == ['grave', 'protector'] and [t[1] for t in u['tiles']] == ['true', 'true', 'false'], f'two slots; the first two in unlock order start picked {u["slots"]}')
    ok(u['heading'] == 'Gourds · pick up to 2' and u['label'] == ['Your team', 'Your gourds'] and 'up to 2 gourds' in u['title'], f'"pick up to 2" {[u["heading"], u["label"], u["title"]]}')
    ok(all(w >= 44 and hh >= 44 for w, hh in u['slotSize']) and u['headFits'] and u['cardFits'], f'44 px slots, the header and card fit {u["slotSize"]}')
    page.click('#loGourds .pick[data-gourd="wartling"]'); time.sleep(0.2)
    v = page.evaluate(gpick()); det = page.evaluate("() => document.querySelector('#loDetail').textContent")
    ok(v['slots'] == ['grave', 'wartling'] and 'Wartling Gourd' in det and 'double' in det.lower(), f'tapping the Wartling with both slots full replaces the last picked and shows its card {v["slots"]} {det[:60]!r}')
    page.screenshot(path=os.path.join(SHOTS, 'picker.png'))
    page.click('#loGourds .pick[data-gourd="protector"]'); time.sleep(0.2)
    ok(page.evaluate(gpick())['slots'] == ['grave', 'protector'], 'tapping the Protector then replaces the Wartling')
    page.click('#loGourdSlot'); time.sleep(0.2)
    ok(page.evaluate(gpick())['slots'] == ['protector', None], 'a tapped slot empties')
    page.click('#loGourds .pick[data-gourd="wartling"]'); time.sleep(0.2)
    ok(page.evaluate(gpick())['slots'] == ['protector', 'wartling'], 'a tile fills the free slot')
    page.click('#bLoGo'); time.sleep(0.5)
    r = page.evaluate("() => [window.__gg.state, window.__gg.G.n, window.__gg.G.gourdKinds, window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c])]")
    ok(r == ['play', 1205, ['protector', 'wartling'], [['protector', 2, 1], ['wartling', 2, 5]]], f'Start: Protector at (2, 1), Wartling at (2, 5), by slot order {r}')
    # its tutorial unseen: the Wartling starts picked in place of the last
    u = witch_picker(page, ALL3, seen=False)
    ok(u['slots'] == ['grave', 'wartling'], f'with the Wartling tutorial unseen, N3-5 starts with the Grave and the Wartling {u["slots"]}')
    page.evaluate("() => { const g = window.__gg; g.save.seenWartlingCoach = true; document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); g.openPreview(1205); }"); time.sleep(0.5)
    ok(page.evaluate(GON) == [['grave', 2, 1], ['protector', 2, 5]], f'the N3-5 preview stands the two gourds the picker starts with {page.evaluate(GON)}')
    # the Wartling not unlocked yet: N3-5 is a two-gourd night as N2-5
    u = witch_picker(page, ['grave', 'protector'])
    ok([t[0] for t in u['tiles']] == ['grave', 'protector'] and u['slots'] == ['grave', 'protector'], f'without the Wartling: two tiles, both picked {u["tiles"]}')
    # N2-5 and N1-5 unchanged with the Wartling unlocked
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 17)}, **{1100 + k: 3 for k in range(1, 5)}})
    page.evaluate("() => { const g = window.__gg; g.save.gourds = { grave:true, protector:true, wartling:true }; document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); g.beginNight(1105); }"); time.sleep(0.6)
    u = page.evaluate(gpick())
    ok([t[0] for t in u['tiles']] == ['grave', 'protector'] and u['slots'] == ['grave', 'protector'], f'N2-5 still offers two gourds, both picked {u["tiles"]}')
    page.evaluate("() => { const g = window.__gg; document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); g.beginNight(1005); }"); time.sleep(0.6)
    u = page.evaluate(gpick())
    ok(u['tiles'] == [['grave', 'true', True]] and u['slots'] == ['grave'] and u['heading'] == 'Gourd · pick 1', f'N1-5 still offers the Grave alone, one locked slot {u["tiles"]}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_wart_coach(browser, url):
    """The Wartling tutorial on N3-5 (coach:'wartling'): slide it; launch a bunch from its square at a tough ghoul (doubled numbers); slide it
    to the top row; hold it until it breaks and the fences above mend; Nice; the night carries on. Each step waits for its action."""
    if not R7: return
    STEP = "(s) => { const g = window.__gg; for (let i = 0; i < Math.round(s / 0.05); i++) g.update(0.05); return g.G.coach ? g.G.coach.step : null; }"
    TIP = "() => document.querySelector('#coachTip').textContent"
    WP = "() => { const p = window.__gg.gourdPos('wartling'); return p && [p.r, p.c]; }"
    page, errors = open_page(browser, url)
    page.evaluate("() => { const s = window.__gg.save; s.gourds = { grave:true, protector:true, wartling:true }; s.seenGourdCoach = true; s.seenProtectorCoach = true; s.seenWartlingCoach = false; s.lv.green = 1; }")
    page.evaluate("(lo) => window.__gg.startGame('story', 1205, lo, ['grave', 'wartling'])", [0, 1, 2, 3, 4]); time.sleep(0.3)
    d = page.evaluate("() => { const g = window.__gg; return [g.G.coach && g.G.coach.kind, g.G.coach && g.G.coach.step, g.coachHolds(), g.gourdsOn().map(o => [o.kind, o.r, o.c]), g.grid.flat().filter(x => x && !x.gourd).length]; }")
    ok(d[:4] == ['wartling', 'wslide', True, [['grave', 2, 1], ['wartling', 2, 5]]] and d[4] == 0, f'N3-5 with the tutorial unseen starts the Wartling script on a clear patch {d}')
    ok('Wartling Gourd' in page.evaluate(TIP), f'the tip names it {page.evaluate(TIP)[:60]!r}')
    ok(page.evaluate(STEP, 2) == 'wslide' and page.evaluate("() => [window.__gg.G.monsters.length, window.__gg.G.spawned]") == [0, 0], 'it waits for the slide: no monsters')
    mv = page.evaluate("() => { const c = window.__gg.G.coach; return c.move && [c.move.dir, c.move.tr, c.move.tc, c.move.ref.gourd]; }")
    ok(mv and mv[3] == 'wartling' and mv[1] != 0, f'the hand slides the Wartling, not into the top row {mv}')
    page.evaluate("() => { const g = window.__gg, c = g.G.coach; g.slideOne(c.move.ref, c.move.dir); }")
    ok(page.evaluate(STEP, 0.4) == 'wlaunch', 'slid: the launch step')
    d = page.evaluate("() => { const g = window.__gg, p = g.gourdPos('wartling'), lit = g.bestLitGroup(), m = g.G.monsters.filter(m => !m.dead); return [!!lit, m.length, m[0] && m[0].hp, m[0] && m[0].lane, p && [p.r, p.c]]; }")
    ok(d[0] and d[1] == 1 and d[2] >= 10, f'a lit bunch in its square and one tough ghoul {d}')
    lane = page.evaluate("() => { const g = window.__gg, lit = g.bestLitGroup(), p = (() => { for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (g.grid[r][c] === lit) return [r, c]; })(); return [p, g.inWartSquare(p[0], p[1]), g.G.monsters[0].lane]; }")
    ok(lane[1] and lane[0][1] == lane[2], f'the bunch is in the square and the ghoul walks its column {lane}')
    ok('double' in page.evaluate(TIP).lower(), f'the tip says double damage {page.evaluate(TIP)[:60]!r}')
    ok(page.evaluate(STEP, 2) == 'wlaunch', 'it waits for the launch')
    hp0 = page.evaluate("() => window.__gg.G.monsters[0].hp")
    page.evaluate("() => { const g = window.__gg; g.launchGroup(g.bestLitGroup()); }")
    ok(page.evaluate("() => window.__gg.G.projs.every(p => p.wart)") is True, 'the launched pumpkins carry wart')
    st = page.evaluate(STEP, 2)
    hp1 = page.evaluate("() => { const m = window.__gg.G.monsters[0]; return m ? m.hp : 0; }")
    ok(st == 'wtop' and hp0 - hp1 == 6, f'three doubled hits take 6 off the ghoul, then the top-row step ({hp0} -> {hp1}, {st})')
    ok('top row' in page.evaluate(TIP).lower(), f'the tip asks for the top row {page.evaluate(TIP)[:60]!r}')
    wp = page.evaluate(WP)
    hp = page.evaluate("(c) => [c - 1, c, c + 1].filter(i => i >= 0 && i < 7).map(i => [window.__gg.walls[i].hp, window.__gg.walls[i].max])", wp[1])
    ok(all(h < m for h, m in hp), f'the fences above it are worn so the mend shows {hp}')
    mv = page.evaluate("() => { const c = window.__gg.G.coach; return c.move && [c.move.dir, c.move.tr]; }")
    ok(mv == ['up', 0], f'the hand slides it up into the top row {mv}')
    ok(page.evaluate(STEP, 2) == 'wtop', 'it waits for the slide')
    page.evaluate("() => { const g = window.__gg, c = g.G.coach; g.slideOne(c.move.ref, c.move.dir); }")
    ok(page.evaluate(STEP, 0.4) == 'whold' and page.evaluate(WP)[0] == 0, 'in the top row: the hand holds it')
    ok('hold' in page.evaluate(TIP).lower() and 'fence' in page.evaluate(TIP).lower(), f'the hold tip names the fences {page.evaluate(TIP)[:60]!r}')
    ok(page.evaluate(STEP, 3) == 'whold', 'it waits for the break')
    wp = page.evaluate(WP)
    before = page.evaluate("(c) => [c - 1, c, c + 1].filter(i => i >= 0 && i < 7).map(i => window.__gg.walls[i].hp)", wp[1])
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('wartling'); g.destroyGourd(g.grid[p.r][p.c]); }")
    after = page.evaluate("(c) => [c - 1, c, c + 1].filter(i => i >= 0 && i < 7).map(i => [window.__gg.walls[i].hp, window.__gg.walls[i].max])", wp[1])
    ok(all(abs(a - min(m, b + m / 2)) < 1e-6 for b, (a, m) in zip(before, after)), f'breaking it mends the fences above by half {before} -> {after}')
    ok(page.evaluate(STEP, 0.1) == 'praise' and 'Nice' in page.evaluate(TIP), f'Nice {page.evaluate(TIP)[:50]!r}')
    ok(page.evaluate("() => window.__gg.coachHolds()") is False, 'the praise step lets the night carry on')
    page.evaluate(STEP, 4)
    ok(page.evaluate("() => [window.__gg.G.coach, window.__gg.save.seenWartlingCoach]") == [None, True], 'the script ends and seenWartlingCoach is set')
    page.evaluate("() => { window.__gg.G.spawnTimer = 0; }"); page.evaluate(STEP, 0.5)
    ok(page.evaluate("() => window.__gg.G.spawned") > 0, 'monsters spawn after the tutorial')
    # seen: a plain N3-5; without the Wartling: no script, still unseen
    page.evaluate("(lo) => window.__gg.startGame('story', 1205, lo, ['grave', 'wartling'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    ok(page.evaluate("() => [window.__gg.G.coach, window.__gg.coachHolds()]") == [None, False], 'a player who has seen it gets a plain N3-5')
    page.evaluate("() => { window.__gg.save.seenWartlingCoach = false; }")
    page.evaluate("(lo) => window.__gg.startGame('story', 1205, lo, ['grave', 'protector'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    ok(page.evaluate("() => [window.__gg.G.coach, window.__gg.save.seenWartlingCoach]") == [None, False], 'N3-5 without the Wartling: no script, still unseen')
    # broken early: it grows back and the lesson goes on from the top row
    page.evaluate("(lo) => window.__gg.startGame('story', 1205, lo, ['grave', 'wartling'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('wartling'); g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(page.evaluate(STEP, 0.1) == 'wback', 'breaking it early jumps to the respawn step')
    st = page.evaluate(STEP, 4)
    ok(st in ('wtop', 'whold') and page.evaluate(WP) is not None, f'it grows back, then the top-row lesson (the hold if it grew back in the top row) {st}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_wart_coach_fences(browser, url):
    """The Wartling coach wears the three fences above it for the mend. Broken outside the top row (so no mend), the lesson puts them back,
    both when it breaks during the slide-up step and when it breaks in the hold step after being moved off the top row."""
    if not R7: return
    STEP = "(s) => { const g = window.__gg; for (let i = 0; i < Math.round(s / 0.05); i++) g.update(0.05); return g.G.coach ? g.G.coach.step : null; }"
    FEN = "() => window.__gg.walls.map(w => w.hp)"
    BRK = "() => { const g = window.__gg, p = g.gourdPos('wartling'); g.destroyGourd(g.grid[p.r][p.c]); }"
    page, errors = open_page(browser, url)
    def to_wtop():
        page.evaluate("() => { const s = window.__gg.save; s.gourds = { grave:true, protector:true, wartling:true }; s.seenGourdCoach = true; s.seenProtectorCoach = true; s.seenWartlingCoach = false; s.lv.green = 1; }")
        page.evaluate("(lo) => window.__gg.startGame('story', 1205, lo, ['grave', 'wartling'])", [0, 1, 2, 3, 4]); time.sleep(0.3)
        page.evaluate(STEP, 0.5)
        page.evaluate("() => { const g = window.__gg, c = g.G.coach; g.slideOne(c.move.ref, c.move.dir); }"); page.evaluate(STEP, 0.4)
        page.evaluate("() => { const g = window.__gg; g.launchGroup(g.bestLitGroup()); }")
        return page.evaluate(STEP, 2)
    full = None
    ok(to_wtop() == 'wtop', 'reached the slide-up step')
    worn = page.evaluate(FEN)
    ok(any(h < w for h, w in zip(worn, page.evaluate("() => window.__gg.walls.map(w => w.max)"))), f'the fences are worn for the lesson {worn}')
    page.evaluate(BRK)
    ok(page.evaluate(STEP, 0.1) == 'wback', 'broken before the top row: the respawn step')
    after = page.evaluate(FEN)
    ok(after != worn and all(a >= w for a, w in zip(after, worn)) and sum(after) > sum(worn), f'the fences are back to their earlier health {worn} -> {after}')
    # hold step, moved off the top row before it breaks
    ok(to_wtop() == 'wtop', 'again at the slide-up step')
    before = page.evaluate("() => window.__gg.walls.map(w => w.max)")
    page.evaluate("() => { const g = window.__gg, c = g.G.coach; g.slideOne(c.move.ref, c.move.dir); }")
    ok(page.evaluate(STEP, 0.4) == 'whold', 'in the top row: the hold step')
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('wartling'), x = g.grid[p.r][p.c]; g.grid[p.r][p.c] = null; g.grid[1][p.c] = x; }")
    page.evaluate(STEP, 0.1)
    worn = page.evaluate(FEN)
    page.evaluate(BRK)
    ok(page.evaluate(STEP, 0.1) == 'praise', 'broken: Nice')
    after = page.evaluate(FEN)
    ok(sum(after) > sum(worn), f'a break outside the top row does not leave the fences worn {worn} -> {after}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_wart_unlock(browser, url):
    if not R7: return
    page, errors = open_page(browser, url)
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 17)}, **{1100 + k: 3 for k in range(1, 17)}, **{1200 + k: 3 for k in range(1, 4)}})
    page.evaluate("() => { window.__gg.save.gourds = { grave:true, protector:true }; }")
    d = page.evaluate("() => { const t = window.__gg.NIGHTMARE_LEVELS[2]; return [t[3] && t[3].unlockGourds, t[4] && t[4].coach, t[4] && t[4].gourds]; }")
    ok(d == [['wartling'], 'wartling', ALL3], f'N3-4 unlocks the Wartling; N3-5 is its tutorial and offers all three (data) {d}')
    nm3_start(page, 3); page.evaluate("() => window.__gg.endGame(true)"); time.sleep(1.8)
    ok(not page.evaluate("() => !!window.__gg.save.gourds.wartling"), 'winning N3-3 does not unlock it')
    nm3_start(page, 4); page.evaluate("() => window.__gg.endGame(true)"); time.sleep(1.8)
    ok(page.evaluate("() => window.__gg.save.gourds.wartling") is True, 'winning N3-4 sets save.gourds.wartling')
    ok(page.evaluate("() => JSON.parse(localStorage.getItem('gourdguard.v1')).gourds.wartling") is True, 'and it is saved')
    ok(page.evaluate("() => window.__gg.GOURDS.wartling && [window.__gg.GOURDS.wartling.name, window.__gg.GOURDS.wartling.role]") == ['Wartling Gourd', 'Doubles launch damage'], 'GOURDS.wartling: name and role')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_wart_art(browser, url):
    """The Wartling's baked art: a picker icon and a strip of the gourd on the patch (saved for the owner); drawing it adds no painter calls
    per frame (one drawImage for the body and one for the glow)."""
    if not R7: return
    os.makedirs(SHOTS, exist_ok=True)
    page, errors = open_page(browser, url)
    wart_night(page, ['grave', 'wartling'])
    px = page.evaluate("() => { const c = window.__gg.gourdIcon(96, 'wartling'), d = c.getContext('2d').getImageData(0, 0, 96, 96).data; let n = 0, v = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200){ n++; if (d[i + 2] > d[i + 1] + 30 && d[i] > d[i + 1]) v++; } return [n, v]; }")
    ok(px[0] > 1500 and px[1] > px[0] * 0.3, f'the icon is a solid, mostly violet gourd {px}')
    strip = page.evaluate("""() => { const g = window.__gg, W = 96 * 4, c = document.createElement('canvas'); c.width = W; c.height = 120; const x = c.getContext('2d');
      x.fillStyle = '#2a1e30'; x.fillRect(0, 0, W, 120);
      ['grave', 'protector', 'wartling', 'wartling'].forEach((k, i) => x.drawImage(g.gourdIcon(i === 3 ? 192 : 96, k), i * 96, 12, 96, 96)); return c.toDataURL(); }""")
    import base64
    with open(os.path.join(SHOTS, 'wartling.png'), 'wb') as f: f.write(base64.b64decode(strip.split(',')[1]))
    page.evaluate("() => { window.__gg.G.paused = false; }"); time.sleep(0.6)
    page.screenshot(path=os.path.join(SHOTS, 'wartling-patch.png'))
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_wart_coach_fences': check_wart_coach_fences, 'check_wart_damage': check_wart_damage, 'check_wart_break_heal': check_wart_break_heal, 'check_picker_three_gourds': check_picker_three_gourds,
               'check_wart_coach': check_wart_coach, 'check_wart_unlock': check_wart_unlock, 'check_wart_art': check_wart_art})


# ---------- Task 5: the Ash Crone and the Blood Coven Witch ----------
CROWS = "() => window.__gg.G.monsters.filter(o => o.type === 'crow' && !o.dead).map(o => [o.lane, Math.round(o.p * 1000) / 1000, o.minion])"
NO_CROWS = "() => { const M = window.__gg.G.monsters; for (let i = M.length - 1; i >= 0; i--) if (M[i].type === 'crow') M.splice(i, 1); }"


def check_ashcrone(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    t = page.evaluate("() => { const T = window.__gg.TYPES.ashcrone; return T && [T.hp, T.sp, T.r, T.coins, T.eat, T.pts, T.drop, T.zoneEvery, T.zoneLast, T.crows]; }")
    ok(t == [4, 0.035, 22, 9, 0.5, 30, 2, 10, 8, 4], f'ashcrone: hp 4, sp 0.035, r 22, coins 9, eat 0.5, pts 30, drop 2, zoneEvery 10, zoneLast 8, crows 4 {t}')
    ok(page.evaluate("() => window.__gg.MNAME.ashcrone") == 'Ash Crone' and bool(page.evaluate("() => window.__gg.MINTRO.ashcrone")), 'her name is the Ash Crone, with an intro card')
    # ringed by crows: left, right, ahead and behind (the Vampire's spots); none when she is a minion
    c = sorted(page.evaluate("() => { const m = window.__gg.spawnMonster('ashcrone', 3, false, 0.3); m.sp = 0; return (" + CROWS + ")(); }"))   # read before a frame moves them (crows are fast)
    ok(c == sorted([[2, 0.3, True], [4, 0.3, True], [3, 0.36, True], [3, 0.24, True]]), f'four crow minions at her left, right, ahead and behind {c}')
    page.evaluate("() => { window.__gg.G.monsters.length = 0; const m = window.__gg.spawnMonster('ashcrone', 3, true, 0.3); m.sp = 0; }")
    ok(page.evaluate(CROWS) == [], 'spawned as a minion: no crows')
    # an undead zone every 10 s, a box centred on a monster within 2 lanes of her, lasting 8 s
    page.evaluate("() => { window.__gg.G.monsters.length = 0; window.__ms = []; }")
    i = page.evaluate(NEW, ['ashcrone', 3, 0.3]); page.evaluate(NO_CROWS)
    page.evaluate("() => { window.__gg.G.hexZones.length = 0; }")
    j = page.evaluate(GHOUL, [5, 0.5, 3, 0])
    page.evaluate(GHOUL, [0, 0.6, 3, 0])   # 3 lanes away: never her centre
    tz = gwait(page, "() => window.__gg.G.hexZones.length >= 1", 12)
    z = page.evaluate("() => window.__gg.G.hexZones.map(z => [z.shape, z.lane, Math.round(z.p * 1000) / 1000, z.t])")
    ok(tz is not None and abs(tz - 10) < 0.4, f'her first zone comes at 10 s ({tz})')
    ok(len(z) == 1 and z[0][:3] == ['box', 5, 0.5] and abs(z[0][3] - 8) < 0.3, f'one box zone centred on the ghoul in lane 5 (2 lanes away), 8 s to run {z}')
    ok(mon(page, i, "m.anim && m.anim.clip") == 'hex', 'she plays her hex clip as she casts')
    # a ghoul killed inside it collapses and rises after 4 s
    d = page.evaluate(KILL, j)
    ok(d == [False, 0] and mon(page, j, "m.rise") > 3.5, f'the ghoul killed inside collapses to rise {d}')
    tr = gwait(page, "() => window.__ms[1].rise <= 0", 6)
    ok(tr is not None and abs(tr - 4) < 0.4 and mon(page, j, "[m.dead, m.hp > 0]") == [False, True], f'and rises again after 4 s ({tr})')
    tg = gwait(page, "() => window.__gg.G.hexZones.length === 0 || window.__gg.G.hexZones[0].t > 7.5", 6)
    ok(tg is not None, f'the zone runs out 8 s after it was cast ({tg})')
    # nobody else within 2 lanes: no zone
    page.evaluate("() => { const g = window.__gg, G = g.G; G.monsters.length = 0; G.hexZones.length = 0; window.__ms = []; }")
    i = page.evaluate(NEW, ['ashcrone', 0, 0.3]); page.evaluate(NO_CROWS)
    page.evaluate(GHOUL, [4, 0.5, 3, 0])
    page.evaluate("(i) => { window.__ms[i].zoneT = 0.2; }", i); gsleep(page, 0.6)
    ok(page.evaluate("() => window.__gg.G.hexZones.length") == 0, 'with no monster within 2 lanes she raises no zone')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_covenwitch(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    t = page.evaluate("() => { const T = window.__gg.TYPES.covenwitch; return T && [T.hp, T.sp, T.r, T.coins, T.eat, T.pts, T.drop, T.brewEvery, T.brewN]; }")
    ok(t == [3, 0.04, 22, 9, 0.5, 28, 2, 7, [1, 2]], f'covenwitch: hp 3, sp 0.04, r 22, coins 9, eat 0.5, pts 28, drop 2, brewEvery 7, brewN [1, 2] {t}')
    ok(page.evaluate("() => window.__gg.MNAME.covenwitch") == 'Blood Coven Witch' and bool(page.evaluate("() => window.__gg.MINTRO.covenwitch")), 'her name is the Blood Coven Witch, with an intro card')
    i = page.evaluate(NEW, ['covenwitch', 0, 0.1])
    page.evaluate(GHOUL, [3, 0.5, 3, 0]); page.evaluate(GHOUL, [5, 0.3, 3, 0]); page.evaluate(GHOUL, [6, 0.6, 3, 0])
    ahead = {(3, tile_of(page, 0.5)[0] + 1), (5, tile_of(page, 0.3)[0] + 1), (6, tile_of(page, 0.6)[0] + 1)}
    tb = gwait(page, "() => window.__gg.G.potions.length >= 1", 9)
    ps = potions_rc(page)
    ok(tb is not None and abs(tb - 7) < 0.4, f'her first brew at 7 s ({tb})')
    ok(1 <= len(ps) <= 2 and all((l, r) in ahead for l, r, _ in ps) and all(k in ('bulky', 'speed', 'colour') for *_, k in ps), f'1-2 potions, each one tile ahead of a ghoul {ps} (ahead tiles {sorted(ahead)})')
    ok(mon(page, i, "m.anim && m.anim.clip") == 'hex', 'she plays her hex clip as she brews')
    # many brews: one or two potions each, never two on a tile, all kinds seen
    counts, kinds = set(), set()
    for _ in range(14):
        page.evaluate("(i) => { window.__gg.G.potions.length = 0; window.__ms[i].brewT = 0.05; }", i)
        gwait(page, "() => window.__gg.G.potions.length >= 1", 2)
        ps = potions_rc(page)
        counts.add(len(ps)); kinds |= {k for *_, k in ps}
        ok(len({(l, r) for l, r, _ in ps}) == len(ps) and all((l, r) in ahead for l, r, _ in ps), f'(each just ahead of a ghoul, one a tile {ps})')
    ok(counts == {1, 2}, f'each brew is 1 or 2 potions, both seen {sorted(counts)}')
    ok(kinds == {'bulky', 'speed', 'colour'}, f'random kinds: all three seen {sorted(kinds)}')
    # every tile ahead taken: she places nothing on top
    page.evaluate("() => { window.__gg.G.potions.length = 0; }")
    page.evaluate("(a) => { const g = window.__gg, tp = g.TILE_P(); for (const [l, r] of a) g.placePotion(l, (r + 0.5) * tp, 'bulky', true); }", sorted(ahead))
    page.evaluate("(i) => { window.__ms[i].brewT = 0.05; }", i); gsleep(page, 0.5)
    ps = potions_rc(page)
    ok(len(ps) == 3 and all(k == 'bulky' for *_, k in ps), f'the tiles ahead taken: no new potion {ps}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_ashcrone': check_ashcrone, 'check_covenwitch': check_covenwitch})


# ---------- Task 6: the Triptych Sprite ----------
# A level-1 pumpkin (type 0 Green) pushed into the projectile list below the field in `lane`; resolves once it is gone:
# [dead, the reflected pumpkins flying back down (lane, dmg)].
TSHOOT = """([type, lane]) => { const g = window.__gg, G = g.G;
  const pr = { x:g.LANE(lane), y:g.fieldY(1) + 60, vy:-900, type, vis:type, lv:1, guar:false, lane, hitWalls:new Set(), grp:{ spawned:false, small:false, kills:0 }, size:1, rot:0, spin:9, hit:new Set(), trail:[], r:16, dead:false };
  G.projs.push(pr);
  return new Promise(res => { const t0 = performance.now();
    const f = () => { if (G.projs.includes(pr) && performance.now() - t0 < 3000) requestAnimationFrame(f); else res([!!pr.dead, G.arrows.filter(a => a.mirror).map(a => [a.lane, a.dmg])]); };
    f(); }); }"""
TRIP = "([l, p]) => { const g = window.__gg, m = g.spawnMonster('triptych', l, false, p); m.sp = 0; m.reflecting = true; m.mirrorT = 99; window.__ms = window.__ms || []; window.__ms.push(m); return window.__ms.length - 1; }"
FULL = "() => { for (const w of window.__gg.walls) w.hp = w.max; window.__gg.G.arrows.length = 0; }"
CLEAR = "() => { window.__gg.G.monsters.length = 0; window.__gg.G.arrows.length = 0; window.__ms = []; }"


def check_triptych(browser, url):
    if not R7: return
    page, errors = potion_page(browser, url)
    t = page.evaluate("() => { const T = window.__gg.TYPES.triptych; return T && [T.hp, T.sp, T.r, T.coins, T.eat, T.pts, T.drop, T.reflect, T.open, T.lanes]; }")
    ok(t == [3, 0.04, 26, 10, 0.5, 32, 2, 2, 2.5, 1], f'triptych: hp 3, sp 0.04, r 26, coins 10, eat 0.5, pts 32, drop 2, reflect 2, open 2.5, lanes 1 {t}')
    ok(page.evaluate("() => window.__gg.MNAME.triptych") == 'Triptych Sprite' and bool(page.evaluate("() => window.__gg.MINTRO.triptych")), 'its name is the Triptych Sprite, with an intro card')
    # the cycle: down 2.5 s from the start, up 2 s, down 2.5 s
    page.evaluate(CLEAR)
    i = page.evaluate(NEW, ['triptych', 3, 0.3])
    ok(mon(page, i, "m.reflecting") is False, 'it arrives with its barrier down')
    tu = gwait(page, "() => window.__ms[0].reflecting", 4)
    ok(tu is not None and abs(tu - 2.5) < 0.3, f'the barrier goes up after 2.5 s ({tu})')
    ok(mon(page, i, "m.anim && m.anim.clip") == 'summon', 'it plays its summon clip as the barrier goes up')
    td = gwait(page, "() => !window.__ms[0].reflecting", 4)
    ok(td is not None and abs(td - 2) < 0.3, f'and down again after 2 s ({td})')
    tu = gwait(page, "() => window.__ms[0].reflecting", 4)
    ok(tu is not None and abs(tu - 2.5) < 0.3, f'and up again after 2.5 s ({tu})')
    # barrier up (held): a pumpkin in each of its three lanes flies back down that lane into that lane's fence
    page.evaluate(CLEAR)
    i = page.evaluate(TRIP, [3, 0.3])
    q0 = page.evaluate("() => window.__gg.G.q.refl")
    for lane in (2, 3, 4):
        page.evaluate(FULL)
        r = page.evaluate(TSHOOT, [0, lane])
        ok(r[0] and r[1] == [[lane, 1]], f'lane {lane}: the pumpkin is reflected back down lane {lane} for its power 1 {r}')
        ok(mon(page, i, "m.hp") == 3, f'lane {lane}: the sprite takes no damage ({mon(page, i, "m.hp")})')
        w = page.evaluate("(l) => window.__gg.walls[l].max", lane)
        gwait(page, f"() => window.__gg.walls[{lane}].hp < window.__gg.walls[{lane}].max", 4)
        hp = page.evaluate("(l) => window.__gg.walls[l].hp", lane)
        ok(abs(hp - (w - 1)) < 1e-6, f'lane {lane}: its fence takes 1 ({w} -> {hp})')
        ok(page.evaluate("(l) => window.__gg.walls.every((w, k) => k === l || w.hp === w.max)", lane), f'lane {lane}: no other fence is hurt')
    q = page.evaluate("() => window.__gg.G.q.refl")
    ok(q - q0 == 3, f'each reflection counts for the mirror quests ({q0} -> {q})')
    # two lanes away: it passes
    for lane in (1, 5):
        page.evaluate(FULL)
        r = page.evaluate(TSHOOT, [0, lane])
        ok(r[1] == [], f'lane {lane} (two lanes away): the pumpkin flies past the barrier {r}')
    # things are met in the order they stand: a ghoul in front of the barrier in a side lane is hit first; one behind it is never reached
    page.evaluate(FULL)
    j = page.evaluate(GHOUL, [2, 0.5, 3, 0])
    r = page.evaluate(TSHOOT, [0, 2])
    ok(r[1] == [] and mon(page, j, "m.hp") == 2, f'a ghoul in front of the barrier in lane 2 takes the hit, no reflection {r} (ghoul hp {mon(page, j, "m.hp")})')
    page.evaluate(FULL)
    j = page.evaluate(GHOUL, [4, 0.1, 3, 0])
    r = page.evaluate(TSHOOT, [0, 4])
    ok(r[1] == [[4, 1]] and mon(page, j, "m.hp") == 3, f'a ghoul behind the barrier in lane 4 is not reached: reflected {r} (ghoul hp {mon(page, j, "m.hp")})')
    # at the edge: a lane-0 sprite guards lanes 0 and 1 only
    page.evaluate(CLEAR)
    i = page.evaluate(TRIP, [0, 0.3])
    page.evaluate(FULL); r1 = page.evaluate(TSHOOT, [0, 1])
    page.evaluate(FULL); r2 = page.evaluate(TSHOOT, [0, 2])
    ok(r1[1] == [[1, 1]] and r2[1] == [], f'a sprite in lane 0 reflects lane 1, not lane 2 {r1} {r2}')
    # barrier down: a pumpkin beside it passes, one in its lane hits it
    page.evaluate("(i) => { const m = window.__ms[i]; m.reflecting = false; m.mirrorT = 99; }", i)
    page.evaluate(FULL); r = page.evaluate(TSHOOT, [0, 1])
    ok(r[1] == [], f'barrier down: a pumpkin beside it passes {r}')
    page.evaluate(FULL); r = page.evaluate(TSHOOT, [0, 0])
    ok(r[1] == [] and mon(page, i, "m.hp") == 2, f'barrier down: a pumpkin in its lane hits it {r} (hp {mon(page, i, "m.hp")})')
    # a rotten pumpkin is never reflected: it meets the barrier as it would the Mirror Sprite's mirror (rot first) and feeds the sprite
    page.evaluate(CLEAR)
    i = page.evaluate(TRIP, [3, 0.3]); page.evaluate("(i) => { window.__ms[i].hp = 2; }", i)
    page.evaluate(FULL); r = page.evaluate(TSHOOT, [page.evaluate("() => window.__gg.ROTTEN"), 4])
    ok(r[0] and r[1] == [] and 2 < mon(page, i, "m.hp") <= 3, f'a rotten pumpkin in lane 4 is not reflected; it feeds the sprite {r} (hp 2 -> {mon(page, i, "m.hp")})')
    # down while it chews
    page.evaluate(CLEAR)
    i = page.evaluate(TRIP, [3, 0.3])
    page.evaluate("(i) => { window.__ms[i].eating = true; }", i); gsleep(page, 0.1)
    ok(mon(page, i, "m.reflecting") is False, 'chewing: its barrier is down')
    page.evaluate(FULL); r = page.evaluate(TSHOOT, [0, 4])
    ok(r[1] == [], f'chewing: a pumpkin beside it passes {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_triptych_budget(browser, url):
    """The barrier is one baked sprite: three reflecting Triptychs add at most one drawImage each a frame over the same three with their
    barriers down, and no fill, stroke or gradient. Saves a field shot for the owner."""
    if not R7: return
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillRect', 'fillText', 'strokeText', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; } })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm3_start(page, 1); time.sleep(3.2)
    page.evaluate(PQ)
    page.evaluate("() => { const g = window.__gg; window.__b = [0, 3, 6].map((l, i) => { const m = g.spawnMonster('triptych', l, true, 0.25 + i * 0.15); m.sp = 0; m.reflecting = false; m.mirrorT = 99; return m; }); }")
    time.sleep(1.2)
    count = "() => new Promise(res => { window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 30) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.drawImage || 0) / 30, (c.fill || 0) / 30, (c.stroke || 0) / 30, ((c.createRadialGradient || 0) + (c.createLinearGradient || 0)) / 30]); } }; requestAnimationFrame(tick); })"
    base = page.evaluate(count)
    page.evaluate("() => { for (const m of window.__b){ m.reflecting = true; m.anim = null; } }")
    time.sleep(1.0)
    lit = page.evaluate(count)
    ok(lit[0] - base[0] >= 2.5, f'three barriers are drawn ({base[0]:.1f} -> {lit[0]:.1f} drawImage a frame)')
    ok(lit[0] - base[0] <= 3.5, f'three barriers add at most one drawImage each a frame ({base[0]:.1f} -> {lit[0]:.1f})')
    ok(lit[1] <= base[1] + 0.1 and lit[2] <= base[2] + 0.1 and lit[3] <= base[3] + 0.1, f'and no fill, stroke or gradient (fill {base[1]:.1f} -> {lit[1]:.1f}, stroke {base[2]:.1f} -> {lit[2]:.1f}, gradients {base[3]:.1f} -> {lit[3]:.1f})')
    os.makedirs(SHOTS, exist_ok=True)
    page.screenshot(path=os.path.join(SHOTS, 'triptych-field.png'))
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_triptych_prebaked(browser, url):
    """The barrier's 12 frames (2 and 3 lanes, 6 sheen frames each) are baked when a night with a Triptych in its pool starts, before any
    barrier goes up; a night without one bakes none."""
    if not R7: return
    page, errors = open_page(browser, url)
    nm3_start(page, 1); time.sleep(0.3)
    ok(page.evaluate("() => window.__gg.barrierBaked()") == 0, f'a night without a Triptych bakes no barrier ({page.evaluate("() => window.__gg.barrierBaked()")})')
    page.evaluate("() => { window.__gg.NIGHTMARE_LEVELS[2][0].pool.push(['triptych', 3]); }")
    ok(page.evaluate("() => window.__gg.levelFor(1201).pool.some(([k]) => k === 'triptych')"), 'N3-1 now has a Triptych in its pool (test set-up)')
    nm3_start(page, 1)
    n = page.evaluate("() => [window.__gg.barrierBaked(), window.__gg.G.monsters.some(m => m.type === 'triptych' && m.reflecting)]")
    ok(n == [12, False], f'starting it bakes all 12 barrier frames before any barrier is up {n}')
    page.evaluate("() => { const p = window.__gg.NIGHTMARE_LEVELS[2][0].pool; p.splice(p.findIndex(([k]) => k === 'triptych'), 1); }")
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_triptych': check_triptych, 'check_triptych_budget': check_triptych_budget, 'check_triptych_prebaked': check_triptych_prebaked})


# ---------- Task 8: the Treant (mini boss, N3-4 and N3-13) ----------
R7_NAMES += ['rootSqueeze']   # its data keys
TBOSS = "window.__gg.G.monsters.find(m => m.type === 'boss' && !m.dead)"
# A game-time log of the Treant from now: each summon [t, n roots it raised] (window.__ts), its highest p (window.__tmaxP); sampled every 10 ms.
TLOG = """() => { const G = window.__gg.G, b = window.__b, t0 = G.t; window.__ts = []; window.__tmaxP = 0; let n = G.roots.length; clearInterval(window.__ti);
  window.__ti = setInterval(() => { const g = window.__gg, B = window.__b; window.__tmaxP = Math.max(window.__tmaxP, B.p); g.G.spawnTimer = 999;
    if (g.G.roots.length > n) window.__ts.push([g.G.t - t0, g.G.roots.length - n]); n = g.G.roots.length; }, 10); }"""
ROOTS = "() => window.__gg.G.roots.map(r => [r.lane, Math.round(r.p * 1000) / 1000, r.hp, !!r.atFence, Math.round(r.t * 100) / 100])"


def treant_up(page, k):
    """Start Nightmare 3-k, bring its boss in now, stop ordinary spawns and sprouts and clear the field so only the boss acts, put it just
    short of hold, clear the roots and start TLOG. Returns [kind, hp, maxHp, hold, form, rootT at spawn, lane] or None."""
    nm3_start(page, k)
    page.evaluate("() => { const G = window.__gg.G; G.sproutT = -999; G.spawned = Math.ceil(G.def.total * 0.4); G.spawnTimer = 0; }")
    time.sleep(0.3)
    b = page.evaluate(f"""() => {{ const g = window.__gg, G = g.G, b = {TBOSS}; if (!b) return null;
      G.spawnTimer = 999; G.monsters.splice(0, G.monsters.length, b); const t0 = b.rootT; b.p = b.hold - 0.01; window.__b = b; G.roots.length = 0;
      if (G.potions) G.potions.length = 0; G.potionT = 1e9;
      return [b.kind, b.hp, b.maxHp, b.hold, b.form, t0, b.lane]; }}""")
    if b: page.evaluate(TLOG)
    return b


def check_treant(browser, url):
    if not R7: return
    page, errors = open_page(browser, url)
    d = page.evaluate("""() => { const T = window.__gg.TYPES.treant; return T ? [T.boss, T.hp, T.r, T.sp, T.coins, T.eat, T.pts, T.drop, T.hold, T.rootEvery, T.rootN, T.rootHp,
      T.rootSqueeze, T.rootLast, T.noItems, T.form2.hp, T.form2.rootEvery, T.form2.rootN] : null; }""")
    ok(d == [True, 24, 34, 0.03, 40, 0, 300, 6, 0.12, 7, [2, 3], 3, 0.5, 8, True, 34, 5, [3, 4]], f'Treant data {d}')
    ok(page.evaluate("() => window.__gg.BOSS_NAMES.treant") == 'The Treant', 'its name on screen is "The Treant"')
    intro = page.evaluate("() => window.__gg.BOSS_INTRO.treant || null")
    ok(bool(intro) and 'root' in intro['1'].lower() and '2' in intro, f'it has boss intro texts for both forms {intro and list(intro)}')
    L = page.evaluate("() => [3, 12].map(i => { const d = window.__gg.NIGHTMARE_LEVELS[2][i]; return d && [d.level, d.boss, d.bossForm, d.bossChest, d.unlockGourds || null]; })")
    ok(L[0] == [4, 'treant', 1, 'normal', ['wartling']], f'N3-4: the Treant, a normal chest, unlocks the Wartling {L[0]}')
    ok(L[1] is not None and L[1][:4] == [13, 'treant', 2, 'normal'], f'N3-13: the Treant in form 2, a normal chest {L[1]}')
    b = treant_up(page, 4)
    ok(b is not None and b[0] == 'treant' and b[1] == b[2] == 24 and b[4] == 1 and b[5] == 7, f'on N3-4 it arrives with 24 health, its root clock at 7 s {b}')
    if b is None:
        page.close(); return
    lane = b[6]
    ok(page.evaluate("() => window.__gg.canDrink(window.__b, 'speed')") is False, 'it never drinks a potion')
    # the first summon at 7 s: 2-3 roots in other lanes, its summon clip
    ok(gwait(page, "() => window.__ts.length >= 1", 9) is not None, 'it summons roots')
    ts, rs = page.evaluate("() => window.__ts"), page.evaluate(ROOTS)
    lo, hi = page.evaluate("() => window.__gg.FIRE_P_RANGE")
    ok(6.6 < ts[0][0] < 7.4 and 2 <= ts[0][1] <= 3, f'at about 7 s it raises 2-3 roots {ts}')
    ok(len({r[0] for r in rs}) == len(rs) and all(r[0] != lane for r in rs), f'each in its own lane, never the Treant\'s (lane {lane}) {rs}')
    ok(all(r[2] == 3 for r in rs) and all((r[3] and r[1] > 1) or (not r[3] and lo <= r[1] <= hi) for r in rs), f'3 hits each; mid-field ones in FIRE_P_RANGE, fence ones at the fence {rs}')
    ok(mon_b(page, "m.anim && m.anim.clip") == 'summon', 'it plays its summon clip')
    # many summons: 2 or 3 each, both kinds seen, never its own lane
    counts, kinds, own = set(), set(), False
    for _ in range(16):
        page.evaluate("() => { window.__gg.G.roots.length = 0; window.__b.rootT = 0.02; }")
        gwait(page, "() => window.__gg.G.roots.length >= 1", 2)
        rs = page.evaluate(ROOTS)
        counts.add(len(rs)); kinds |= {r[3] for r in rs}; own = own or any(r[0] == lane for r in rs)
    ok(counts == {2, 3}, f'each summon is 2 or 3 roots, both seen {sorted(counts)}')
    ok(kinds == {True, False}, f'mid-field and fence roots both seen {kinds}')
    ok(not own, 'never in its own lane')
    page.evaluate("() => { window.__gg.G.roots.length = 0; window.__b.rootT = 1e9; }")
    # a mid-field root blocks its lane: a ghoul behind it is never reached; three pumpkins destroy it; the fourth reaches the ghoul
    L2 = (lane + 2) % 7
    page.evaluate("(l) => window.__gg.raiseRoot(l, false, 0.5)", L2)
    j = page.evaluate(GHOUL, [L2, 0.3, 3, 0])
    page.evaluate(FULL)
    for n in (2, 1):
        r = page.evaluate(TSHOOT, [0, L2])
        rs = page.evaluate(ROOTS)
        ok(r[0] and len(rs) == 1 and rs[0][2] == n and mon(page, j, "m.hp") == 3, f'a pumpkin up lane {L2} hits the root and stops: root {n} left, ghoul behind untouched {rs} (ghoul {mon(page, j, "m.hp")})')
    page.evaluate(TSHOOT, [0, L2])
    ok(page.evaluate(ROOTS) == [], f'the third pumpkin destroys it {page.evaluate(ROOTS)}')
    page.evaluate(TSHOOT, [0, L2])
    ok(mon(page, j, "m.hp") == 2, f'the lane is open again: the next pumpkin reaches the ghoul ({mon(page, j, "m.hp")})')
    # a monster in front of the root (nearer the fence) is met first
    page.evaluate("(l) => window.__gg.raiseRoot(l, false, 0.4)", L2)
    j2 = page.evaluate(GHOUL, [L2, 0.7, 3, 0])
    page.evaluate(TSHOOT, [0, L2])
    ok(mon(page, j2, "m.hp") == 2 and page.evaluate(ROOTS)[0][2] == 3, f'a ghoul in front of the root takes the hit, the root none {page.evaluate(ROOTS)}')
    ok(page.evaluate(f"(l) => window.__gg.G.monsters.filter(m => m.lane === l).length", L2) >= 1, '(set-up: ghouls in the lane)')
    page.evaluate(f"() => {{ const G = window.__gg.G, b = window.__b; G.monsters.splice(0, G.monsters.length, b); G.roots.length = 0; window.__ms = []; }}")
    # a pumpkin in another lane flies past a root
    page.evaluate("(l) => window.__gg.raiseRoot(l, false, 0.5)", L2)
    L3 = (L2 + 1) % 7 if (L2 + 1) % 7 != lane else (L2 + 2) % 7
    j = page.evaluate(GHOUL, [L3, 0.3, 3, 0])
    page.evaluate(TSHOOT, [0, L3])
    ok(mon(page, j, "m.hp") == 2 and page.evaluate(ROOTS)[0][2] == 3, f'a pumpkin in lane {L3} passes the root in lane {L2}')
    page.evaluate(f"() => {{ const G = window.__gg.G, b = window.__b; G.monsters.splice(0, G.monsters.length, b); G.roots.length = 0; window.__ms = []; }}")
    # a fence root squeezes its fence: about 4 off in 8 s, then it sinks; a pumpkin hits it there too
    page.evaluate(FULL)
    page.evaluate("(l) => window.__gg.raiseRoot(l, true)", L2)
    w0 = page.evaluate("(l) => window.__gg.walls[l].hp", L2)
    tg = gwait(page, "() => window.__gg.G.roots.length === 0", 10)
    w1 = page.evaluate("(l) => window.__gg.walls[l].hp", L2)
    ok(tg is not None and 7.6 < tg < 8.4, f'the fence root sinks after 8 s ({tg})')
    ok(3.6 < w0 - w1 < 4.4, f'it squeezed about 4 off its fence ({w0} -> {w1})')
    ok(page.evaluate("(l) => window.__gg.walls.every((w, k) => k === l || w.hp === w.max)", L2), 'no other fence is hurt')
    page.evaluate(FULL); page.evaluate("(l) => window.__gg.raiseRoot(l, true)", L2)
    j = page.evaluate(GHOUL, [L2, 0.6, 3, 0])
    page.evaluate(TSHOOT, [0, L2])
    ok(page.evaluate(ROOTS)[0][2] == 2 and mon(page, j, "m.hp") == 3, f'a pumpkin up a fence root\'s lane hits the root first {page.evaluate(ROOTS)}')
    page.evaluate(TSHOOT, [0, L2]); page.evaluate(TSHOOT, [0, L2])
    w2 = page.evaluate("(l) => window.__gg.walls[l].hp", L2); gsleep(page, 1)
    ok(page.evaluate(ROOTS) == [] and page.evaluate("(l) => window.__gg.walls[l].hp", L2) == w2, 'three destroy it, and the squeezing stops')
    page.evaluate(f"() => {{ const G = window.__gg.G, b = window.__b; G.monsters.splice(0, G.monsters.length, b); G.roots.length = 0; window.__ms = []; }}")
    # immune to knockback and freeze; held at the back all along
    hits = """(m) => { const g = window.__gg, out = { kb:0, frozen:0, slowed:0 };
      for (let i = 0; i < 20; i++){ const pr = { x:m.x, y:g.fieldY(1), vy:-900, type:2, vis:2, lv:5, guar:true, lane:m.lane, hitWalls:new Set(), grp:{ spawned:false, small:false, kills:0 }, size:1, rot:0, spin:9, hit:new Set(), trail:[], r:16, dead:false };
        g.hitMonster(pr, m); if (m.kb > 0) out.kb++; if (m.frozenT > 0) out.frozen++; if (m.slowT > 0) out.slowed++; }
      return out; }"""
    r = page.evaluate(f"() => {{ const b = window.__b; const h = b.hp; b.hp = 5000; const o = ({hits})(b); b.hp = h; return [o, b.kb || 0, b.frozenT || 0]; }}")
    ok(r[0]['kb'] == 0 and r[0]['frozen'] == 0 and r[1] == 0 and r[2] == 0, f'20 Ice hits with knockback guaranteed: no knockback, no freeze {r}')
    mp, hold = page.evaluate("() => [window.__tmaxP, window.__b.hold]")
    ok(mp <= hold + 1e-9 and hold == 0.12, f'it never walks past hold (max p {mp:.4f}, hold {hold})')
    # killing it: one normal chest, no boss item; its roots sink with it
    page.evaluate("(l) => { window.__gg.raiseRoot(l, false, 0.5); window.__gg.raiseRoot(l, true); }", L2)
    c0 = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate("() => { clearInterval(window.__ti); const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 99999, '#fff'); }")
    time.sleep(0.3)
    ch = page.evaluate("() => window.__gg.save.chests.slice(%d)" % c0)
    ok(len(ch) == 1 and ch[0]['kind'] == 'normal' and not ch[0].get('boss'), f'killing it adds exactly one normal chest and no boss item {ch}')
    ok(page.evaluate("() => window.__gg.G.bossDead") and page.evaluate(ROOTS) == [], 'the boss is down and its roots sink with it')
    # winning N3-4 unlocks the Wartling
    page.evaluate("() => { window.__gg.save.gourds.wartling = false; }")
    nm3_start(page, 4); page.evaluate("() => window.__gg.endGame(true)"); time.sleep(1.8)
    ok(page.evaluate("() => window.__gg.save.gourds.wartling") is True, 'winning N3-4 sets save.gourds.wartling')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def mon_b(page, js):
    return page.evaluate(f"() => {{ const m = window.__b; return ({js}); }}")


def check_treant_form2(browser, url):
    """N3-13 (bossForm 2): 34 health, roots every 5 s, 3-4 at a time; one normal chest."""
    if not R7: return
    page, errors = open_page(browser, url)
    b = treant_up(page, 13)
    ok(b is not None and b[0] == 'treant' and b[1] == b[2] == 34 and b[4] == 2 and b[5] == 5, f'on N3-13 it arrives in form 2 with 34 health, its root clock at 5 s {b}')
    if b is None:
        page.close(); return
    ok(gwait(page, "() => window.__ts.length >= 2", 12) is not None, 'it summons twice')
    ts = page.evaluate("() => window.__ts")
    ok(4.6 < ts[0][0] < 5.4 and 9.6 < ts[1][0] < 10.4, f'form 2 summons every 5 s {ts}')
    counts = set()
    for _ in range(14):
        page.evaluate("() => { window.__gg.G.roots.length = 0; window.__b.rootT = 0.02; }")
        gwait(page, "() => window.__gg.G.roots.length >= 1", 2)
        counts.add(len(page.evaluate(ROOTS)))
    ok(counts == {3, 4}, f'form 2 raises 3 or 4 roots, both seen {sorted(counts)}')
    c0 = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate("() => { clearInterval(window.__ti); const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 99999, '#fff'); }"); time.sleep(0.3)
    ch = page.evaluate("() => window.__gg.save.chests.slice(%d).map(c => c.kind)" % c0)
    ok(ch == ['normal'], f'N3-13 also gives one normal chest {ch}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_treant_continue(browser, url):
    """A continued night keeps the roots standing (lane, place, hits left, age) and brings the Treant back with its health and its root clock."""
    if not R7: return
    page, errors = open_page(browser, url)
    b = treant_up(page, 4)
    if b is None:
        ok(False, 'the Treant arrived'); page.close(); return
    lane = b[6]; l1, l2 = (lane + 1) % 7, (lane + 3) % 7
    page.evaluate("([a, c]) => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 5, '#fff'); b.rootT = 3.25; g.raiseRoot(a, false, 0.5); g.raiseRoot(c, true); g.G.roots[0].hp = 2; }", [l1, l2])
    gsleep(page, 1.5)
    before = page.evaluate(f"""() => {{ clearInterval(window.__ti); const g = window.__gg, b = window.__b, s = [b.hp, +b.rootT.toFixed(3)], r = ({ROOTS})();
      const c = g.continueState(); g.continueNight(c); return [s, r, ({ROOTS})()]; }}""")
    ok(before[1] == before[2] and len(before[1]) == 2, f'the roots stand where they stood, with their hits left and their age {before[1]} -> {before[2]}')
    time.sleep(0.6)
    after = page.evaluate(f"() => {{ const b = {TBOSS}; return b ? [b.hp, +b.rootT.toFixed(3), b.kind, b.p <= 0.05] : null; }}")
    ok(after is not None and after[:2] == before[0] and after[2] == 'treant' and after[3],
       f'the Treant comes back with its 19 health and its root clock as it was (it waits while it walks in) {before[0]} -> {after}')
    ok(before[0][0] == 19, f'(it was hurt to 19 {before[0]})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_treant_baked(browser, url):
    """Its frames (idle as walk, summon, hit) and the root's (rise, idle, sink) are baked when a Treant night starts, under 10 MB at bake scale 2.5;
    a night without it bakes no root. Each root on the field costs one drawImage a frame and no painting."""
    if not R7: return
    page, errors = open_page(browser, url)
    C = page.evaluate("() => { const C = window.__gg.CHARS; return C.treant && C.root ? [Object.keys(C.treant.clips).sort(), Object.keys(C.root.clips).sort()] : null; }")
    ok(C == [['hit', 'summon', 'walk'], ['idle', 'rise', 'sink']], f'the Treant bakes walk (its idle), summon and hit; the root rise, idle and sink {C}')
    page.evaluate("() => window.__gg.setBakeScale(2.5)")
    nm3_start(page, 1)
    ok(not page.evaluate("() => window.__gg.isBaked('root')"), 'a night without the Treant bakes no root')
    t0 = time.time(); nm3_start(page, 4); dt = time.time() - t0
    ok(page.evaluate("() => window.__gg.isBaked('treant') && window.__gg.isBaked('root')"), 'starting N3-4 bakes the Treant and its root')
    mb = page.evaluate("() => window.__gg.atlasBytes('treant') / 1e6")
    rb = page.evaluate("() => window.__gg.atlasBytes('root') / 1e6")
    ok(mb < 10, f"the Treant's frames take {mb:.1f} MB at bake scale 2.5 (limit 10)")
    ok(rb < 5, f"the root's frames take {rb:.1f} MB at bake scale 2.5 (limit 5)")
    ok(dt < 3, f'the night opens in {dt:.1f} s')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()
    # the draw budget: six roots add about one drawImage each and no fill, stroke or gradient
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillRect', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; } })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm3_start(page, 4); time.sleep(3.2)
    page.evaluate(PQ); page.evaluate("() => { window.__gg.G.roots.length = 0; }")
    count = "() => new Promise(res => { window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 30) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.drawImage || 0) / 30, (c.fill || 0) / 30, (c.stroke || 0) / 30, ((c.createRadialGradient || 0) + (c.createLinearGradient || 0)) / 30]); } }; requestAnimationFrame(tick); })"
    time.sleep(0.5); base = page.evaluate(count)
    page.evaluate("() => { const g = window.__gg; for (const l of [0, 2, 4]) g.raiseRoot(l, false, 0.5); for (const l of [1, 3, 5]) g.raiseRoot(l, true); }")
    time.sleep(1.2); lit = page.evaluate(count)
    ok(5.5 <= lit[0] - base[0] <= 6.5, f'six roots add one drawImage each a frame ({base[0]:.1f} -> {lit[0]:.1f})')
    ok(lit[1] <= base[1] + 0.1 and lit[2] <= base[2] + 0.1 and lit[3] <= base[3] + 0.1, f'and no fill, stroke or gradient (fill {base[1]:.1f} -> {lit[1]:.1f}, stroke {base[2]:.1f} -> {lit[2]:.1f}, gradients {base[3]:.1f} -> {lit[3]:.1f})')
    os.makedirs(SHOTS, exist_ok=True)
    page.evaluate("() => { const g = window.__gg, b = g.spawnMonster('boss', 6); b.p = b.hold; b.rootT = 1e9; }"); time.sleep(0.8)   # the Treant itself, for the owner's shot
    page.screenshot(path=os.path.join(SHOTS, 'treant-field.png'))
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_treant': check_treant, 'check_treant_form2': check_treant_form2, 'check_treant_continue': check_treant_continue, 'check_treant_baked': check_treant_baked})



# ---------- Task 9: the Fallen Hexwitch (N3-16) ----------
R7_NAMES += ['fallenhexwitch', 'altarHp']   # her key and data keys
FH_T = """() => { const T = window.__gg.TYPES.fallenhexwitch; return T ? [T.boss, T.hp, T.r, T.sp, T.coins, T.eat, T.pts, T.drop, T.hold, T.zoneEvery, T.zoneLast, T.potionEvery, T.potionN,
  T.crowEvery, T.crows, T.smashEvery, T.smashHit, T.glide, T.altarAt, T.altarHp, T.noItems] : null; }"""
# A pumpkin object (lv 1..5 of `type`) for hitMonster, defined once a page as window.__pr(type, lv, lane).
PRDEF = """() => { const g = window.__gg; window.__pr = (type, lv, lane) => ({ x:g.LANE(lane), y:g.fieldY(1), vy:-900, type, vis:type, lv, guar:false, lane, hitWalls:new Set(),
  grp:{ spawned:false, small:false, kills:0 }, size:1, rot:0, spin:9, hit:new Set(), trail:[], r:16, dead:false }); }"""
ALTAR = "() => { const a = window.__gg.G.altar; return a ? [a.lane, Math.round(a.p * 1000) / 1000, a.hp] : null; }"
OWNZ = "() => window.__gg.G.hexZones.filter(z => z.src === 'fallenhex').map(z => [z.shape, z.lane, Math.round(z.p * 1000) / 1000, Math.round(z.t * 100) / 100])"


def fh_up(page):
    """Start N3-16, bring the Fallen Hexwitch in now, clear the field so only she acts, stop spawns and sprouts, put her just short of hold with
    every clock far off, and log her highest p (window.__fmaxP). Returns [kind, hp, maxHp, hold, lane] or None."""
    nm3_start(page, 16)
    page.evaluate("() => { const G = window.__gg.G; G.sproutT = -999; G.spawned = Math.ceil(G.def.total * 0.4); G.spawnTimer = 0; }")
    time.sleep(0.3)
    b = page.evaluate(f"""() => {{ const g = window.__gg, G = g.G, b = {TBOSS}; if (!b) return null;
      G.spawnTimer = 999; G.monsters.splice(0, G.monsters.length, b); b.p = b.hold - 0.01; window.__b = b; G.hexZones.length = 0;
      if (G.potions) G.potions.length = 0; G.potionT = 1e9; b.zoneT = b.potionT = b.crowT = b.smashT = 1e9;
      window.__fmaxP = 0; clearInterval(window.__fi); window.__fi = setInterval(() => {{ window.__fmaxP = Math.max(window.__fmaxP, window.__b.p); window.__gg.G.spawnTimer = 999; }}, 10);
      return [b.kind, b.hp, b.maxHp, b.hold, b.lane]; }}""")
    page.evaluate(PRDEF)
    return b


def check_fallen_hex(browser, url):
    """N3-16: her data and level; on forced clocks a 5x5 undead zone (only her own counted), 2-3 potions, 1-3 crows, the fence smash (half, never
    the last 1) then a glide of 1-2 lanes; altars at 75/50/25% (one at a time, a hit past two marks raises the second when the first falls)."""
    if not R7: return
    page, errors = open_page(browser, url)
    ok(page.evaluate(FH_T) == [True, 45, 34, 0.03, 50, 0, 400, 6, 0.28, 12, 10, 8, [2, 3], 6, [1, 3], 10, 0.5, [1, 2], [0.75, 0.5, 0.25], 8, True], f'Fallen Hexwitch data {page.evaluate(FH_T)}')
    ok(page.evaluate("() => window.__gg.BOSS_NAMES.fallenhexwitch") == 'The Fallen Hexwitch', 'her name on screen is "The Fallen Hexwitch"')
    intro = page.evaluate("() => (window.__gg.BOSS_INTRO.fallenhexwitch || {})[1] || ''")
    ok('altar' in intro.lower() and 'potion' in intro.lower(), f'she has a boss intro text {intro[:60]!r}')
    L = page.evaluate("() => [13, 14, 15].map(i => { const d = window.__gg.NIGHTMARE_LEVELS[2][i]; return d && [d.level, d.boss, d.bossChest, !!d.gourd]; })")
    ok(L[0] is not None and L[0][0] == 14 and L[1] is not None and L[1][0] == 15, f'placeholder nights N3-14 and N3-15 exist {L[:2]}')
    ok(L[2] == [16, 'fallenhexwitch', 'normal', True], f'N3-16: the Fallen Hexwitch, a normal chest, gourds {L[2]}')
    b = fh_up(page)
    ok(b is not None and b[0] == 'fallenhexwitch' and b[1] == b[2] == 45 and b[3] == 0.28, f'on N3-16 she arrives with 45 health, holding at 0.28 {b}')
    if b is None:
        page.close(); return
    ok(page.evaluate("() => window.__gg.canDrink(window.__b, 'speed')") is False, 'she never drinks a potion')
    ok(page.evaluate("() => window.__b.hexT == null || window.__b.hexT === 0") and not page.evaluate("() => window.__gg.TYPES.fallenhexwitch.hexEvery"), 'she has no hex clock (no hexing)')
    # the undead zone: a 5x5 box of her own, 10 s; a Crone's 3x3 does not stop hers; a second while hers stands is not laid
    page.evaluate("() => { const G = window.__gg.G; G.hexZones.push({ shape:'box', lane:0, p:0.5, t:8 }); window.__b.zoneT = 0.05; }")
    ok(gwait(page, f"() => ({OWNZ})().length >= 1", 1) is not None, 'she raises an undead zone though an Ash Crone zone stands')
    z = page.evaluate(OWNZ)
    ok(len(z) == 1 and z[0][0] == 'box5' and 9.5 < z[0][3] <= 10 and 2 <= z[0][1] <= 4, f'one 5x5 zone (box5) lasting 10 s, all on the field {z}')
    ok(page.evaluate("() => window.__b.zoneT") > 11, 'her zone clock restarts at 12 s')
    ok(mon_b(page, "m.anim && m.anim.clip") == 'hex', 'she plays her hex clip')
    page.evaluate("() => { window.__b.zoneT = 0.05; }"); gsleep(page, 0.3)
    ok(len(page.evaluate(OWNZ)) == 1, 'with her zone standing the next clock lays no second one')
    zl, zp = z[0][1], page.evaluate("() => window.__gg.G.hexZones.find(z => z.src === 'fallenhex').p")
    inz = page.evaluate("""([l, p]) => { const g = window.__gg, G = g.G, tp = g.TILE_P(), crone = G.hexZones.filter(z => z.src !== 'fallenhex'); G.hexZones = G.hexZones.filter(z => z.src === 'fallenhex');
      const at = (dl, dp) => g.inHexZone({ lane:l + dl, p:p + dp * tp }); const r = [at(0, 0), at(2, 2.4), at(-2, -2.4), at(3, 0), at(-3, 0), at(0, 2.6), at(0, -2.6)]; G.hexZones.push(...crone); return r; }""", [zl, zp])
    ok(inz == [True, True, True, False, False, False, False], f'inside: lanes +-2 and +-2.5 tiles; outside beyond {inz}')
    j = page.evaluate(GHOUL, [zl + 1, min(0.9, zp + 0.05), 3, 0])
    page.evaluate("(i) => { const g = window.__gg, m = window.__ms[i]; m.lastHit = 0; g.damage(m, 99); }", j)
    ok(mon(page, j, "[m.dead, m.rise > 3.5]") == [False, True], 'a monster killed inside collapses and rises after 4 s')
    page.evaluate("() => { const G = window.__gg.G; G.hexZones.forEach(z => z.t = 0.05); }"); gsleep(page, 0.2)
    page.evaluate("() => { const G = window.__gg.G, b = window.__b; G.monsters.splice(0, G.monsters.length, b); window.__ms = []; }")
    # potions: 2 or 3 on random field tiles, both counts seen
    counts = set()
    for _ in range(12):
        page.evaluate("() => { window.__gg.G.potions.length = 0; window.__b.potionT = 0.02; }")
        gwait(page, "() => window.__gg.G.potions.length >= 2", 1)
        gsleep(page, 0.05)
        counts.add(page.evaluate("() => window.__gg.G.potions.length"))
    ok(counts == {2, 3}, f'she summons 2 or 3 potions each time, both seen {sorted(counts)}')
    ok(page.evaluate("() => window.__b.potionT") > 7, 'her potion clock restarts at 8 s')
    page.evaluate("() => { window.__gg.G.potions.length = 0; window.__b.potionT = 1e9; }")
    # crows: 1 to 3 at the top of random lanes, minions
    counts, top = set(), True
    for _ in range(12):
        page.evaluate(NO_CROWS); page.evaluate("() => { window.__b.crowT = 0.02; }")
        gwait(page, f"() => ({CROWS})().length >= 1", 1)
        c = page.evaluate(CROWS); counts.add(len(c)); top = top and all(x[2] and x[1] < 0.1 for x in c)
    ok(counts <= {1, 2, 3} and len(counts) >= 2, f'1 to 3 crows each swoop {sorted(counts)}')
    ok(top, 'they come in at the top of the field, as minions')
    page.evaluate(NO_CROWS); page.evaluate("() => { window.__b.crowT = 1e9; }")
    # the smash: half her lane's full health (never the last 1), then 0.45 s later a glide of 1-2 lanes, clamped to the field
    page.evaluate("() => { const g = window.__gg, b = window.__b; g.walls.forEach(w => w.hp = w.max); b.lane = 3; b.x = b.tx = g.LANE(3); b.smashT = 0.02; }")
    gwait(page, "() => window.__gg.walls[3].hp < window.__gg.walls[3].max", 1)
    w = page.evaluate("() => window.__gg.walls.map(w => [w.hp, w.max])")
    ok(abs((w[3][1] - w[3][0]) - w[3][1] / 2) < 0.3, f'her lane\'s fence loses half its full health {w[3]}')
    ok(all(w[i][0] == w[i][1] for i in (0, 1, 2, 4, 5, 6)), f'no other fence is touched {w}')
    ok(page.evaluate("() => window.__b.lane") == 3 and mon_b(page, "m.anim && m.anim.clip") == 'zone', 'she slams her broom (zone clip) and stays put for now')
    tg = gwait(page, "() => window.__b.lane !== 3", 1)
    l1 = page.evaluate("() => window.__b.lane")
    ok(tg is not None and 0.3 < tg < 0.6 and 1 <= abs(l1 - 3) <= 2, f'about 0.45 s later she glides 1-2 lanes ({tg}, lane 3 -> {l1})')
    gsleep(page, 0.8)
    ok(page.evaluate("() => Math.abs(window.__b.x - window.__b.tx) < 5"), 'she glides over to her new lane')
    ok(page.evaluate("() => window.__b.smashT") > 8.5, 'her smash clock restarts at 10 s')
    lanes = set()
    for _ in range(8):
        page.evaluate("() => { const g = window.__gg, b = window.__b; g.walls.forEach(w => w.hp = w.max); g.walls[0].hp = 2; b.lane = 0; b.x = b.tx = g.LANE(0); b.smashT = 0.02; }")
        gwait(page, "() => window.__b.lane !== 0", 1.5)
        lanes.add(page.evaluate("() => window.__b.lane"))
    ok(lanes <= {1, 2} and len(lanes) == 2, f'from the edge lane she glides onto the field, 1 or 2 lanes {sorted(lanes)}')
    ok(page.evaluate("() => window.__gg.walls[0].hp") == 1, 'a fence on 2 health is left on 1, never broken by the smash')
    page.evaluate("() => { const g = window.__gg; g.walls.forEach(w => w.hp = w.max); window.__b.smashT = 1e9; }")
    # the altars
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 12, '#fff'); }")
    a1 = page.evaluate(ALTAR)
    hp, bl, done = page.evaluate("() => [window.__b.hp, window.__b.lane, window.__b.altDone]")
    ok(hp == 33.75 and done == 1, f'a 12-damage hit at full health stops at the 75% mark (33.75) {hp} (marks spent {done})')
    ok(a1 is not None and a1[0] != bl and a1[1] == 0.15 and a1[2] == 8, f'an altar rises in another lane at the back of the field with 8 health {a1} (her lane {bl})')
    la = set()
    for _ in range(10):
        page.evaluate("() => { window.__gg.G.altar = null; window.__b.altDone = 0; window.__b.hp = 34; window.__gg.damage(window.__b, 1, '#fff'); }")
        la.add(page.evaluate("() => window.__gg.G.altar.lane"))
    ok(bl not in la and len(la) >= 3, f'the altar lane is random, never hers {sorted(la)}')
    page.evaluate("() => { const g = window.__gg; g.G.altar.hp = 8; g.damage(window.__b, 5, '#fff'); }")
    ok(page.evaluate("() => [window.__b.hp, window.__gg.G.floats.some(f => f.text === 'No damage')]") == [33.75, True], 'while it stands she takes no damage ("No damage")')
    al = page.evaluate("() => window.__gg.G.altar.lane")
    page.evaluate("() => { window.__gg.G.altar.hp = 1; }")
    page.evaluate(TSHOOT, [0, al])
    ok(page.evaluate(ALTAR) is None, 'a pumpkin up its lane breaks it')
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 5, '#fff'); }")
    ok(page.evaluate("() => window.__b.hp") == 28.75, 'with the altar broken she can be hurt again')
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 20, '#fff'); }")
    ok(page.evaluate("() => [window.__b.hp, window.__b.altDone, !!window.__gg.G.altar]") == [22.5, 2, True], 'a 20-damage hit stops at the 50% mark (22.5) and raises the second altar')
    page.evaluate("() => { const g = window.__gg; g.G.altar = null; g.damage(window.__b, 20, '#fff'); }")
    ok(page.evaluate("() => [window.__b.hp, window.__b.altDone, !!window.__gg.G.altar]") == [11.25, 3, True], 'then the 25% mark (11.25) and the third altar')
    page.evaluate("() => { const g = window.__gg; g.G.altar = null; g.damage(window.__b, 5, '#fff'); }"); gsleep(page, 0.3)
    ok(page.evaluate("() => [window.__b.hp, !!window.__gg.G.altar]") == [6.25, False], 'past the last mark there is never a fourth altar')
    # a drop past two marks at once (no hit through damage(): the marks are read each frame): the second altar rises once the first falls
    page.evaluate("() => { const g = window.__gg, b = window.__b; g.G.altar = null; b.altDone = 0; b.hp = 20; }"); gsleep(page, 0.2)
    ok(page.evaluate("() => [window.__b.altDone, !!window.__gg.G.altar]") == [1, True], 'health past two marks: one altar first')
    page.evaluate("() => { window.__gg.G.altar.hp = 0.5; }"); page.evaluate(TSHOOT, [0, page.evaluate("() => window.__gg.G.altar.lane")]); gsleep(page, 0.2)
    ok(page.evaluate("() => [window.__b.altDone, !!window.__gg.G.altar]") == [2, True], 'the second rises when the first falls')
    page.evaluate("() => { window.__gg.G.altar = null; }"); gsleep(page, 0.2)
    ok(page.evaluate("() => [window.__b.altDone, !!window.__gg.G.altar]") == [2, False], 'and no third until her health reaches 25%')
    # immune to knockback and freeze; held at the back
    r = page.evaluate("""() => { const g = window.__gg, b = window.__b, h = b.hp; b.altDone = 3; g.G.altar = null; b.hp = 5000; let kb = 0, fr = 0;
      for (let i = 0; i < 20; i++){ const pr = window.__pr(2, 5, b.lane); pr.guar = true; g.hitMonster(pr, b); if (b.kb > 0) kb++; if (b.frozenT > 0) fr++; } b.hp = h; return [kb, fr]; }""")
    ok(r == [0, 0], f'20 Ice hits with knockback guaranteed: no knockback, no freeze {r}')
    mp = page.evaluate("() => window.__fmaxP")
    ok(mp <= 0.28 + 1e-9, f'she never walks past hold (max p {mp:.4f})')
    # killing her: one normal chest, no boss item, the boss is down
    page.evaluate("() => { const g = window.__gg; g.G.altar = { lane:(window.__b.lane + 2) % 7, p:0.15, hp:8, t:0 }; }")
    c0 = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate("() => { clearInterval(window.__fi); const g = window.__gg, b = window.__b; g.G.altar = null; b.lastHit = 0; g.damage(b, 99999, '#fff'); }"); time.sleep(0.3)
    ch = page.evaluate("() => window.__gg.save.chests.slice(%d)" % c0)
    ok(len(ch) == 1 and ch[0]['kind'] == 'normal' and not ch[0].get('boss'), f'killing her gives one normal chest and no boss item {ch}')
    ok(page.evaluate("() => window.__gg.G.bossDead"), 'the boss is down')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fh_altar_immune(browser, url):
    """While an altar stands nothing hurts her: a pumpkin (a Wartling one too), burn, glue, Black's splash, Deep Blue's lightning, a mine, a bomb and
    a firework. A 20-damage hit at 80% stops at the 75% mark. Only pumpkins hurt the altar (by their power; rot splats on it); tools and area damage
    skip it; a monster in front of it takes the hit; a Grey pumpkin stops at it."""
    if not R7: return
    page, errors = open_page(browser, url)
    b = fh_up(page)
    if b is None:
        ok(False, 'the Fallen Hexwitch arrived'); page.close(); return
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lane = 3; b.x = b.tx = g.LANE(3); b.p = b.hold; b.lastHit = 0; g.damage(b, 12, '#fff'); g.G.altar.lane = 0; Object.assign(g.save, { mine:5, bomb:5, fw:5 }); }")
    H = "() => window.__b.hp"
    ok(page.evaluate(H) == 33.75 and page.evaluate(ALTAR) == [0, 0.15, 8], f'(set-up: an altar in lane 1, her at 33.75) {page.evaluate(ALTAR)}')
    page.evaluate("() => { const g = window.__gg, b = window.__b; g.hitMonster(window.__pr(0, 5, b.lane), b); }")
    ok(page.evaluate(H) == 33.75, 'a pumpkin does nothing to her')
    page.evaluate("() => { const g = window.__gg, b = window.__b, pr = window.__pr(0, 5, b.lane); pr.wart = true; g.hitMonster(pr, b); }")
    ok(page.evaluate(H) == 33.75, 'nor a Wartling pumpkin (its double damage too)')
    page.evaluate("() => { const g = window.__gg, b = window.__b; g.hitMonster(window.__pr(3, 5, b.lane), b); }")
    ok(page.evaluate("() => window.__b.burnLeft") > 0, '(set-up: a Fire pumpkin sets her burning)')
    gsleep(page, 3)
    ok(page.evaluate(H) == 33.75, 'nor her burn')
    page.evaluate("() => { const g = window.__gg, b = window.__b; g.layGlue(b.lane, b.p, 5); }"); gsleep(page, 2.5)
    ok(page.evaluate(H) == 33.75, 'nor glue under her')
    page.evaluate("() => { window.__gg.G.glue.length = 0; }")
    j = page.evaluate(GHOUL, [4, b[3], 50, 0])
    page.evaluate("(i) => { const g = window.__gg; g.hitMonster(window.__pr(7, 5, 4), window.__ms[i]); }", j)
    ok(mon(page, j, "m.hp") < 50 and page.evaluate(H) == 33.75, f'nor Black\'s splash from a ghoul beside her (ghoul {mon(page, j, "m.hp")})')
    page.evaluate("(i) => { const g = window.__gg; g.hitMonster(window.__pr(8, 5, 4), window.__ms[i]); }", j)
    ok(page.evaluate(H) == 33.75, 'nor Deep Blue\'s lightning along her row')
    page.evaluate("() => { const G = window.__gg.G, b = window.__b; G.monsters.splice(0, G.monsters.length, b); window.__ms = []; }")
    page.evaluate("() => { const g = window.__gg, b = window.__b; g.placeMine(b.lane, b.p); g.G.mines[g.G.mines.length - 1].t = 99; }")
    j = page.evaluate(GHOUL, [3, b[3], 1, 0])
    gwait(page, "() => window.__gg.G.mines.length === 0", 1)
    ok(page.evaluate("() => window.__gg.G.mines.length") == 0 and page.evaluate(H) == 33.75, 'nor a mine going off under her')
    page.evaluate("() => { const g = window.__gg, b = window.__b; g.dropBomb(b.x, g.fieldY(b.p)); }")
    ok(page.evaluate(H) == 33.75, 'nor a bomb')
    page.evaluate("() => { window.__gg.useFirework(); }")
    ok(page.evaluate(H) == 33.75, 'nor a firework')
    ok(page.evaluate("() => window.__gg.G.altar && window.__gg.G.altar.hp") == 8, '(the altar is untouched by all that)')
    # tools and area damage skip the altar
    page.evaluate("() => { const G = window.__gg.G, b = window.__b; G.monsters.splice(0, G.monsters.length, b); window.__ms = []; }")
    page.evaluate("() => { const g = window.__gg, a = g.G.altar; g.dropBomb(g.LANE(a.lane), g.fieldY(a.p)); g.useFirework(); g.placeMine(a.lane, a.p); g.G.mines[g.G.mines.length - 1].t = 99; }")
    j = page.evaluate(GHOUL, [0, 0.15, 1, 0]); gwait(page, "() => window.__gg.G.mines.length === 0", 1)
    page.evaluate("() => { const G = window.__gg.G, b = window.__b; G.monsters.splice(0, G.monsters.length, b); window.__ms = []; }")
    j = page.evaluate(GHOUL, [1, 0.15, 50, 0])
    page.evaluate("(i) => { const g = window.__gg, m = window.__ms[i]; g.hitMonster(window.__pr(7, 5, 1), m); g.hitMonster(window.__pr(8, 5, 1), m); }", j)
    ok(page.evaluate("() => window.__gg.G.altar.hp") == 8, f'a bomb, a firework, a mine, a splash and lightning beside it leave the altar at 8 ({page.evaluate("() => window.__gg.G.altar.hp")})')
    page.evaluate("() => { const G = window.__gg.G, b = window.__b; G.monsters.splice(0, G.monsters.length, b); window.__ms = []; }")
    # pumpkins: a monster in front of it takes the hit; a lone pumpkin chips it by its power; a level-5 one by 2; rot splats; Grey stops there
    j = page.evaluate(GHOUL, [0, 0.5, 3, 0])
    page.evaluate(TSHOOT, [0, 0])
    ok(mon(page, j, "m.hp") == 2 and page.evaluate("() => window.__gg.G.altar.hp") == 8, 'a ghoul in front of the altar takes the hit; the altar none')
    page.evaluate("() => { const G = window.__gg.G, b = window.__b; G.monsters.splice(0, G.monsters.length, b); window.__ms = []; }")
    page.evaluate(TSHOOT, [0, 0])
    ok(page.evaluate("() => window.__gg.G.altar.hp") == 7, f'a level-1 pumpkin takes 1 off it ({page.evaluate("() => window.__gg.G.altar.hp")})')
    j = page.evaluate(GHOUL, [0, 0.08, 3, 0])
    r = page.evaluate(TSHOOT, [4, 0])
    ok(r[0] and page.evaluate("() => window.__gg.G.altar.hp") == 6 and mon(page, j, "m.hp") == 3, 'a Grey pumpkin stops at the altar: the ghoul behind it is untouched')
    page.evaluate(TSHOOT, [page.evaluate("() => window.__gg.ROTTEN"), 0])
    ok(page.evaluate("() => window.__gg.G.altar.hp") == 6, 'a rotten pumpkin splats on it and does nothing')
    page.evaluate("""() => { const g = window.__gg, G = g.G, pr = window.__pr(0, 5, 0); pr.y = g.fieldY(1) + 60; G.projs.push(pr); }"""); gsleep(page, 1)
    ok(page.evaluate("() => window.__gg.G.altar.hp") == 4, f'a level-5 pumpkin takes 2 ({page.evaluate("() => window.__gg.G.altar.hp")})')
    page.evaluate("() => { const G = window.__gg.G, b = window.__b; G.monsters.splice(0, G.monsters.length, b); window.__ms = []; }")
    # 80% then a 20-damage hit: stops at 75%
    page.evaluate("() => { const g = window.__gg, b = window.__b; g.G.altar = null; b.altDone = 0; b.hp = 36; b.lastHit = 0; g.damage(b, 20, '#fff'); }")
    ok(page.evaluate("() => [window.__b.hp, !!window.__gg.G.altar]") == [33.75, True], f'a 20-damage hit at 80% stops at 75% and raises an altar {page.evaluate("() => window.__b.hp")}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fallen_hex_continue(browser, url):
    """A continued night brings her back with her health and her marks spent, a standing altar with its health; an old snapshot counts her marks from her health."""
    if not R7: return
    page, errors = open_page(browser, url)
    b = fh_up(page)
    if b is None:
        ok(False, 'the Fallen Hexwitch arrived'); page.close(); return
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 12, '#fff'); g.G.altar.hp = 5; window.__al = g.G.altar.lane; }")
    page.evaluate("() => { clearInterval(window.__fi); const g = window.__gg; g.continueNight(g.continueState()); }"); time.sleep(0.8)
    after = page.evaluate(f"() => {{ const b = {TBOSS}, a = window.__gg.G.altar; return b ? [b.kind, b.hp, b.altDone, a && a.lane === window.__al, a && a.hp] : null; }}")
    ok(after == ['fallenhexwitch', 34, 1, True, 5], f'she comes back with 34 health (33.75 rounded up), one mark spent, her altar standing with 5 health {after}')
    page.evaluate(f"() => {{ const g = window.__gg, b = {TBOSS}; window.__b = b; g.damage(b, 5, '#fff'); }}")
    ok(page.evaluate("() => window.__b.hp") == 34, 'and still no damage while it stands')
    # a broken altar and 20 health: two marks spent, no altar comes back, none replayed
    page.evaluate("() => { const g = window.__gg, b = window.__b; g.G.altar = null; b.hp = 20; b.altDone = 2; g.G.continued = false; }")   # (a continued night cannot be continued again: allow it for the check)
    page.evaluate("() => { const g = window.__gg; g.continueNight(g.continueState()); }"); time.sleep(0.8)
    after = page.evaluate(f"() => {{ const b = {TBOSS}; return b ? [b.hp, b.altDone, !!window.__gg.G.altar] : null; }}")
    ok(after == [20, 2, False], f'with her altar broken she comes back at 20 health, two marks spent, no altar {after}')
    # an old snapshot with no marks: they are counted from her health on her first frame
    page.evaluate(f"() => {{ const g = window.__gg; g.G.continued = false; const c = g.continueState(); c.bossMood = [null]; g.continueNight(c); }}"); time.sleep(0.8)
    after = page.evaluate(f"() => {{ const b = {TBOSS}; return b ? [b.hp, b.altDone, !!window.__gg.G.altar] : null; }}")
    ok(after == [20, 2, False], f'an old snapshot: her marks are counted from her 20 health, none replayed {after}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fallen_hex_baked(browser, url):
    """Her frames (walk, hex, zone) are baked when N3-16 starts, under 12 MB at bake scale 2.5, with her crows; the altar's crack states and her
    5x5 zone are baked then too (not on other nights). An altar and her zone cost a drawImage each a frame and no painting. Strips for the owner."""
    if not R7: return
    page, errors = open_page(browser, url)
    C = page.evaluate("() => { const C = window.__gg.CHARS; return C.fallenhexwitch ? [Object.keys(C.fallenhexwitch.clips).sort(), !!C.hexwitch] : null; }")
    ok(C is not None and C[0] == ['hex', 'walk', 'zone'] and C[1], f'she has her own entry (walk, hex, zone) beside the story Hexwitch {C and C[0]}')
    page.evaluate("() => window.__gg.setBakeScale(2.5)")
    nm3_start(page, 1)
    ok(page.evaluate("() => window.__gg.fhBaked()") == [0, 0], f'a night without her bakes no altar and no 5x5 zone {page.evaluate("() => window.__gg.fhBaked()")}')
    t0 = time.time(); nm3_start(page, 16); dt = time.time() - t0
    ok(page.evaluate("() => window.__gg.isBaked('fallenhexwitch') && window.__gg.isBaked('crow')"), 'starting N3-16 bakes her and her crows')
    ok(not page.evaluate("() => window.__gg.isBaked('hexwitch')"), 'the story Hexwitch atlas is not baked for her')
    fb = page.evaluate("() => window.__gg.fhBaked()")
    ok(fb[0] >= 3 and fb[1] >= 1, f'the altar\'s crack states and her 5x5 zone are baked at night start {fb}')
    mb = page.evaluate("() => window.__gg.atlasBytes('fallenhexwitch') / 1e6")
    ok(mb < 12, f'her frames take {mb:.1f} MB at bake scale 2.5 (limit 12)')
    ok(dt < 3, f'the night opens in {dt:.1f} s')
    os.makedirs(SHOTS, exist_ok=True)
    strip = page.evaluate("""() => { const A = window.__gg.atlas('fallenhexwitch'), cl = A.clips, names = Object.keys(cl), W = Math.max(...names.map(n => cl[n].c.width)), H = names.reduce((s, n) => s + cl[n].c.height + 8, 8);
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#2a2a2e'; x.fillRect(0, 0, W, H); let y = 8;
      for (const n of names){ x.drawImage(cl[n].c, 0, y); y += cl[n].c.height + 8; } return c.toDataURL(); }""")
    import base64
    with open(os.path.join(SHOTS, 'fallenhex.png'), 'wb') as f: f.write(base64.b64decode(strip.split(',')[1]))
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()
    # the draw budget: an altar and her 5x5 zone add a drawImage or two each and no fill, stroke or gradient
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillRect', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; } })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm3_start(page, 16); time.sleep(3.2)
    page.evaluate(PQ); page.evaluate("() => { window.__gg.G.hexZones.length = 0; window.__gg.G.altar = null; }")
    count = "() => new Promise(res => { window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 30) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.drawImage || 0) / 30, (c.fill || 0) / 30, (c.stroke || 0) / 30, ((c.createRadialGradient || 0) + (c.createLinearGradient || 0)) / 30]); } }; requestAnimationFrame(tick); })"
    time.sleep(0.5); base = page.evaluate(count)
    page.evaluate("() => { const G = window.__gg.G; G.altar = { lane:1, p:0.15, hp:5, t:2 }; G.hexZones.push({ shape:'box5', lane:4, p:0.55, t:9, src:'fallenhex' }); }")
    time.sleep(0.6); lit = page.evaluate(count)
    ok(1.5 <= lit[0] - base[0] <= 4.5, f'an altar and her zone add a few drawImage a frame ({base[0]:.1f} -> {lit[0]:.1f})')
    ok(lit[1] <= base[1] + 0.1 and lit[2] <= base[2] + 0.1 and lit[3] <= base[3] + 0.1, f'and no fill, stroke or gradient (fill {base[1]:.1f} -> {lit[1]:.1f}, stroke {base[2]:.1f} -> {lit[2]:.1f}, gradients {base[3]:.1f} -> {lit[3]:.1f})')
    page.evaluate("() => { const g = window.__gg, b = g.spawnMonster('boss', 3); b.p = b.hold; b.zoneT = b.potionT = b.crowT = b.smashT = 1e9; b.altDone = 1; }"); time.sleep(0.8)   # her, the altar and her zone, for the owner's shot
    page.screenshot(path=os.path.join(SHOTS, 'fallenhex-field.png'))
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_fallen_hex': check_fallen_hex, 'check_fh_altar_immune': check_fh_altar_immune, 'check_fallen_hex_continue': check_fallen_hex_continue, 'check_fallen_hex_baked': check_fallen_hex_baked})


# ---------- Task 10: the real levels N3-1 to N3-16, intro cards, the nightmare bestiary ----------
N3_NAMES = ["Witch's Brew", 'Ash and Crows', 'Blood Coven', 'The Treant', 'The Wartling Gourd', 'Bottle Imps', 'Toad Song', 'Hall of Mirrors',
            'Turncoat Brew', 'Graveless Dead', 'Ill Wind', 'The Cauldron', 'Treant Returns', 'Glass Coven', 'The Long Night', 'The Fallen Hexwitch']
R7_NAMES += ['Witchwood: Nightmare', 'Ash and Crows', 'Blood Coven', 'Bottle Imps', 'Toad Song', 'Turncoat Brew', 'Graveless Dead', 'Ill Wind', 'The Cauldron',
             'Treant Returns', 'Glass Coven', 'The brew boils', 'Brew marks', 'brewmarks']   # the other names ('Hall of Mirrors', 'The Long Night', ...) are world 3 / N2 names too
N3_NEW = {'ashcrone': 2, 'covenwitch': 3, 'flaskbearer': 6, 'toad': 7, 'triptych': 8}   # each new monster and the level that brings it first (spec Part 7)
N3_ALSO = {'ashcrone': ['crow']}   # what each brings onto the field (companions); the Treant's roots and the Fallen Hexwitch's crows come through ALSO_BAKE too
N3_LEVELS_JS = """() => { const g = window.__gg; return g.NIGHTMARE_LEVELS[2].map((d, i) => { const L = g.levelFor(1201 + i);
  return { level:d.level, name:d.name, pool:d.pool.map(e => e[0]), weights:d.pool.map(e => e[1]), types:d.pool.every(([k]) => !!(g.TYPES[k] || g.VARIANTS[k])), gourd:!!d.gourd, gourds:d.gourds || null,
    unlockGourds:d.unlockGourds || null, boss:d.boss, bossForm:d.bossForm, bossChest:d.bossChest || null, coach:d.coach || null, intro:d.intro || [], potions:d.potions || null,
    brewMarks:d.brewMarks || null, gust:d.gust || null, graves:d.graves, spawnGap:d.spawnGap, spawnBurst:d.spawnBurst, total:d.total, interval:d.interval,
    quests:g.questsFor(L), questsOk:g.questsFor(L).every(([t]) => !!g.QUEST_TYPES[t]) }; }); }"""


def n3_open_all(page):
    """Every story level, every Release 4 and 5 nightmare level and N3-1 to N3-15 beaten (so all of N3 is open); all three gourds unlocked."""
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 17)}, **{1100 + k: 3 for k in range(1, 17)}, **{1200 + k: 3 for k in range(1, 16)}})
    page.evaluate("() => { const s = window.__gg.save; s.gourds = { grave:true, protector:true, wartling:true }; s.seenGourdCoach = true; s.seenProtectorCoach = true; s.seenWartlingCoach = true; }")


def check_n3_levels(browser, url):
    """The 16 designed levels (spec Part 7): names, pools, gourds, bosses, potions, brew marks and pacing are data, and every preview opens."""
    if not R7: return
    page, errors = open_page(browser, url)
    L = page.evaluate(N3_LEVELS_JS)
    ok(len(L) == 16 and [d['level'] for d in L] == list(range(1, 17)), f'16 witchwood nightmare levels in order ({len(L)})')
    ok([d['name'] for d in L] == N3_NAMES, f"each level has the spec's name {[d['name'] for d in L]}")
    ok(all(d['pool'] and d['types'] for d in L), 'every pool is non-empty and every pool type exists in TYPES or VARIANTS')
    intros = {k + 1: d['intro'] for k, d in enumerate(L) if d['intro']}
    ok(intros == {n: [t] for t, n in N3_NEW.items()}, f'each new monster is introduced on the level that first brings it {intros}')
    ok(all(t in d['pool'] for d in L for t in d['intro']), 'every introduced monster is in its level pool')
    early = [(t, k + 1) for k, d in enumerate(L) for t in d['pool'] if t in N3_NEW and k + 1 < N3_NEW[t]]
    ok(not early, f'no new monster walks in before its introduction {early}')
    ok(all(t in L[14]['pool'] for t in N3_NEW), f"N3-15 (The Long Night) holds every new monster {L[14]['pool']}")
    ok(all(d['gourd'] for d in L), 'a gourd night on every level')
    ok(all(d['gourds'] == ['grave', 'protector'] for d in L[:4]) and all(d['gourds'] == ['grave', 'protector', 'wartling'] for d in L[4:]), f"N3-1 to N3-4 offer the Grave and Protector Gourds, N3-5 on all three {[d['gourds'] for d in L]}")
    ok(L[3]['boss'] == 'treant' and L[3]['bossForm'] == 1 and L[3]['bossChest'] == 'normal' and L[3]['unlockGourds'] == ['wartling'], f"N3-4: the Treant, a normal chest, unlocks the Wartling {L[3]['boss'], L[3]['bossChest'], L[3]['unlockGourds']}")
    ok(L[12]['boss'] == 'treant' and L[12]['bossForm'] == 2 and L[12]['bossChest'] == 'normal', 'N3-13: the Treant in form 2 with a normal chest')
    ok(L[15]['boss'] == 'fallenhexwitch' and L[15]['bossChest'] == 'normal', 'N3-16: the Fallen Hexwitch with a normal chest')
    ok([k + 1 for k, d in enumerate(L) if d['boss']] == [4, 13, 16], 'bosses on N3-4, N3-13 and N3-16 only')
    ok(L[4]['coach'] == 'wartling' and [k + 1 for k, d in enumerate(L) if d['coach']] == [5], 'N3-5 keeps the Wartling tutorial (the only coach)')
    P = [d['potions'] for d in L]
    ok(all(p and p['every'] > 0 and 1 <= p['count'][0] <= p['count'][1] for p in P), f'potions on every level {P}')
    ok(all(not p.get('kinds') for k, p in enumerate(P) if k != 8) and P[8].get('kinds') == ['colour'], f"N3-9 (Turncoat Brew): colour potions only; the rest all three kinds {[p.get('kinds') for p in P]}")
    bm = [k + 1 for k, d in enumerate(L) if d['brewMarks']]
    ok(bm == [6, 7, 8, 9, 10, 11, 12, 14, 15], f'brew marks on N3-6 to N3-15 except N3-13 {bm}')
    ok(all(d['brewMarks'] == [0.33, 0.66] for d in L if d['brewMarks']), 'two marks at 0.33 and 0.66')
    gust = [k + 1 for k, d in enumerate(L) if d['gust']]
    ok(gust == [11] and L[10]['gust'].get('partial') is True and L[10]['gust']['every'] > 0, f"N3-11 (Ill Wind): the world 3 patch wind with partial gusts, only there {gust} {L[10]['gust']}")
    ok({'flaskbearer'} <= set(L[10]['pool']), f"N3-11 brings Flask Bearers {L[10]['pool']}")
    ok({'chameleon', 'rchameleon', 'witch'} <= set(L[8]['pool']), f"N3-9: Chameleons, Reverse Chameleons and witches {L[8]['pool']}")
    top = lambda d: d['pool'][d['weights'].index(max(d['weights']))]
    ok(top(L[9]) == 'ashcrone' or L[9]['weights'][L[9]['pool'].index('ashcrone')] >= 6, f"N3-10 (Graveless Dead): many Ash Crones {list(zip(L[9]['pool'], L[9]['weights']))}")
    ok({'toad', 'covenwitch'} <= set(L[11]['pool']) and P[11]['every'] <= min(p['every'] for p in P), f"N3-12 (The Cauldron): toads and Coven Witches, the quickest potions {L[11]['pool']} {P[11]}")
    ok({'triptych', 'mirror'} <= set(L[7]['pool']), f"N3-8: Triptych Sprites with Mirror Sprites {L[7]['pool']}")
    ok({'triptych', 'covenwitch'} <= set(L[13]['pool']), f"N3-14 (Glass Coven): Triptych Sprites and Coven Witches {L[13]['pool']}")
    ok(all(not d['graves'] for d in L), "no graves (N3-5's coach needs the Wartling's side columns clear)")
    ok(all(isinstance(d['spawnGap'], (int, float)) and isinstance(d['spawnBurst'], (int, float)) for d in L), 'every level sets spawnGap and spawnBurst')
    ok(all(d['questsOk'] and len(d['quests']) == 3 for d in L), 'every level has three quests of existing types')
    ok(len({(d['total'], d['interval'], tuple(d['pool'])) for d in L}) == 16, 'no two levels share pool and pacing (each has its own theme)')
    n3_open_all(page)
    for k in range(1, 17):
        page.evaluate(f"() => {{ document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); window.__gg.openPreview({1200 + k}); }}"); time.sleep(0.25)
    ok(not errors, f'every preview opens without a page error {errors[:2]}')
    page.close()


def n3_intro_titles(page, n):
    """Play night n from its preview card and read the intro cards it shows, in order."""
    page.evaluate(f"() => {{ document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); window.__gg.openPreview({n}); }}"); time.sleep(0.4)
    page.click('#bPvGo'); time.sleep(0.4)
    out = []
    for _ in range(8):
        if page.evaluate("() => window.__gg.state") != 'intro': break
        out.append(page.evaluate("() => document.querySelector('#inTitle').textContent"))
        page.click('#bIntroOk'); time.sleep(0.3)
    return out


def check_n3_intros(browser, url):
    """First appearances on the witchwood track show a card: potions (N3-1), each new monster where it first walks in, the Treant (both forms),
    the Wartling Gourd (N3-5), brew marks (N3-6) and the Fallen Hexwitch."""
    if not R7: return
    page, errors = open_page(browser, url)
    n3_open_all(page)
    SEEN = "() => { window.__gg.save.seenIntro = { quests:true, gourd:true, 'gourd:protector':true, wind:true }; }"   # the Grave and Protector cards were shown on N1-5 and N2-5, the wind card in world 3
    page.evaluate(SEEN)
    txt = page.evaluate("""() => { const g = window.__gg; g.openPreview(1201); document.querySelector('#bPvGo').click();
      return [document.querySelector('#inTitle').textContent, document.querySelector('#inText').textContent, document.querySelector('#inIcon canvas') ? 1 : 0]; }""")
    ok(txt[0] == 'Potions' and 'drinks' in txt[1] and 'cannot' in txt[1] and txt[2] == 1, f'the potions card says monsters drink them and you cannot clear them, with the bottles drawn {txt}')
    page.evaluate(SEEN)
    t = {k: n3_intro_titles(page, 1200 + k) for k in range(1, 17)}
    ok(t[1] == ['Potions'], f'N3-1 explains potions only {t[1]}')
    for k, name in ((2, 'Ash Crone'), (3, 'Blood Coven Witch'), (6, 'Flask Bearer'), (7, 'Cauldron Toad'), (8, 'Triptych Sprite')):
        ok(any(x.startswith('New monster') and name in x for x in t[k]), f'N3-{k} introduces the {name} {t[k]}')
    ok(any('Treant' in x and 'full form' not in x for x in t[4]), f'N3-4 introduces the Treant {t[4]}')
    ok(t[5] == ['The Wartling Gourd'], f'N3-5 explains the Wartling Gourd {t[5]}')
    ok('Brew marks' in t[6] and t[6].index('Brew marks') < len(t[6]), f'N3-6 explains brew marks {t[6]}')
    ok(all(not t[k] for k in (9, 10, 11, 12, 14, 15)), f'N3-9 to N3-12, N3-14 and N3-15 bring nothing new {[t[k] for k in (9, 10, 11, 12, 14, 15)]}')
    ok(any('Treant' in x and 'full form' in x for x in t[13]), f"N3-13 shows the Treant's form-2 card {t[13]}")
    ok(any('Fallen Hexwitch' in x for x in t[16]), f'N3-16 introduces the Fallen Hexwitch {t[16]}')
    ok(not any(x in ('Potions', 'Brew marks') for k in range(2, 17) for x in t[k] if not (k == 6 and x == 'Brew marks')), 'the potion and brew mark cards never repeat')
    bt = page.evaluate("() => { const g = window.__gg; g.save.seenIntro = { quests:true, gourd:true, 'gourd:protector':true, 'gourd:wartling':true, wind:true, potions:true, 'm:flaskbearer':true }; g.openPreview(1206); document.querySelector('#bPvGo').click(); return [document.querySelector('#inTitle').textContent, document.querySelector('#inText').textContent]; }")
    ok(bt[0] == 'Brew marks' and 'crows' in bt[1] and 'faster' in bt[1], f'the brew marks card says crows swoop in and potions come faster {bt}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_n3_bestiary(browser, url):
    """The witchwood nightmare book's bestiary (Release 7): the new monsters in first-met order with the Ash Crone's crows, the Treant, and the
    Fallen Hexwitch last; story monsters are not repeated."""
    if not R7: return
    page, errors = open_page(browser, url)
    # N3-1 to N3-3 open: the Ash Crone, her crows and the Blood Coven Witch have been met
    set_stars(page, {**story_done(), 1104: 3, 1201: 3, 1202: 3})
    open_nm_book(page, 2)
    ok(page.evaluate("() => !document.querySelector('#bBkFlip').hidden"), 'with the gate open the page has a Bestiary button')
    page.click('#bBkFlip'); time.sleep(0.7)
    b = page.evaluate("() => [document.querySelector('#bsTitle').textContent, [...document.querySelectorAll('#bestiary .bs')].map(e => [e.classList.contains('unmet'), e.querySelector('b').textContent, e.querySelector('.ab').textContent, (e.querySelector('.lo') || {}).textContent || ''])]")
    ok('Nightmare' in b[0] and 'Witchwood' in b[0], f'the page is titled as the witchwood nightmare edition ({b[0]!r})')
    met = [x[1] for x in b[1] if not x[0]]
    ok(met == ['Ash Crone', 'Crow', 'Blood Coven Witch'], f'met so far, in order: the Ash Crone, her crow, the Blood Coven Witch {met}')
    ok(all(x[2] and x[3] for x in b[1] if not x[0]), 'each met entry has an ability and a lore line')
    ok(len(b[1]) == 8 and all(x[0] for x in b[1][3:]), f'eight entries, the rest unmet silhouettes ({len(b[1])})')
    n3_open_all(page)
    open_nm_book(page, 2)
    page.evaluate("() => { if (document.querySelector('#bestiary').hidden) document.querySelector('#bBkFlip').click(); }"); time.sleep(0.7)
    e = page.evaluate("() => [...document.querySelectorAll('#bestiary .bs')].map(e => e.classList.contains('unmet') ? null : [e.querySelector('b').textContent, !!(e.querySelector('.lo') || {}).textContent])")
    names = [x and x[0] for x in e]
    want = ['Ash Crone', 'Crow', 'Blood Coven Witch', 'The Treant', 'Flask Bearer', 'Cauldron Toad', 'Triptych Sprite', 'The Fallen Hexwitch']
    ok(names == want, f'the full list in first-met order, the Fallen Hexwitch last {names}')
    ok(all(x and x[1] for x in e), 'every entry has lore')
    ok(not any(n in names for n in ('Wood Ghoul', 'Broom Imp', 'Owl-bat', 'Wisp', 'Mirror Sprite', 'Chameleon', 'Reverse Chameleon', 'Witch')), 'story monsters are not repeated')
    for w, last in ((0, 'The Fallen Gravekeeper'), (1, 'The Fallen Poltergeist')):
        open_nm_book(page, w)
        page.evaluate("() => { if (document.querySelector('#bestiary').hidden) document.querySelector('#bBkFlip').click(); }"); time.sleep(0.7)
        bb = page.evaluate("() => [...document.querySelectorAll('#bestiary .bs b')].map(e => e.textContent)")
        ok(bb and bb[-1] == last and 'Ash Crone' not in bb, f'the world {w + 1} nightmare bestiary is unchanged (ends on {last}) {bb[-2:]}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_n3_prebake(browser, url):
    """Each level bakes what it can spawn when its night starts: its pool, what those monsters bring (the Ash Crone's crows), a brew mark's
    crows, the Treant's roots and its boss; every night starts and runs a moment without a page error."""
    if not R7: return
    page, errors = open_page(browser, url)
    L = page.evaluate(N3_LEVELS_JS)
    missing = []
    for k, d in enumerate(L, 1):
        page.reload(); page.wait_for_function('() => !!window.__gg'); time.sleep(0.3)   # a fresh atlas cache: what is baked is this night's
        page.evaluate("() => { Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true }); window.__gg.save.gourds = { grave:true, protector:true, wartling:true }; }")
        nm3_start(page, k)
        want = {t for t in d['pool'] if t in N3_NEW or t == 'crow'} | {a for t in d['pool'] for a in N3_ALSO.get(t, [])} | ({d['boss']} if d['boss'] else set())
        if d['brewMarks']: want.add('crow')
        if d['boss'] == 'treant': want.add('root')
        if d['boss'] == 'fallenhexwitch': want.add('crow')
        got = page.evaluate("(ks) => ks.filter(k => !window.__gg.isBaked(k) && !window.__gg.isBaked(k + '|form2'))", sorted(want))   # a form-2 boss bakes as kind|form2
        if got: missing.append((k, got))
        time.sleep(0.4)
    ok(not missing, f'every level bakes its new monsters, what they bring, brew mark crows and its boss at night start {missing}')
    ti = next(k for k, d in enumerate(L, 1) if 'toad' in d['pool'])
    page.reload(); page.wait_for_function('() => !!window.__gg'); time.sleep(0.3)
    page.evaluate("() => { Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true }); }")
    ok(page.evaluate("() => window.__gg.tongueBaked()") is False, 'fresh page: no tongue sprite yet')
    nm3_start(page, 1)
    ok(page.evaluate("() => window.__gg.tongueBaked()") is False, 'a night without toads bakes no tongue')
    nm3_start(page, ti)
    ok(page.evaluate("() => window.__gg.tongueBaked()") is True, f'N3-{ti} bakes the toad tongue sprite at night start, before any toad lashes')
    ok('ashcrone' in L[1]['pool'] and 'crow' not in L[1]['pool'], f"N3-2's crows come only with its Ash Crones (so its crow is baked through ALSO_BAKE) {L[1]['pool']}")
    ok(not errors, f'no page errors on any night {errors[:2]}')
    page.close()


def check_n3_coach_potions(browser, url):
    """N3-5: the level's potion clock holds while the Wartling coach teaches (no potion lands on the lesson), and runs once it is done."""
    if not R7: return
    STEP = "(s) => { const g = window.__gg; for (let i = 0; i < Math.round(s / 0.05); i++) g.update(0.05); return [g.G.coach ? g.G.coach.step : null, g.G.potions.length, g.G.potionT]; }"
    page, errors = open_page(browser, url)
    page.evaluate("() => { const s = window.__gg.save; s.gourds = { grave:true, protector:true, wartling:true }; s.seenGourdCoach = true; s.seenProtectorCoach = true; s.seenWartlingCoach = false; }")
    page.evaluate("(lo) => window.__gg.startGame('story', 1205, lo, ['grave', 'wartling'])", [0, 1, 2, 3, 4]); time.sleep(0.3)
    every = page.evaluate("() => window.__gg.G.def.potions.every")
    r = page.evaluate(STEP, every + 3)
    ok(r[0] == 'wslide' and r[1] == 0 and abs(r[2] - every) < 1e-6, f'{every + 3:.0f} s into the lesson: no potions and the clock held at {every} s {r}')
    page.evaluate("() => { const g = window.__gg; g.G.coach = null; }")
    r = page.evaluate(STEP, every + 0.5)
    ok(r[1] >= 1, f'with the coach done the potions come {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_n3_levels': check_n3_levels, 'check_n3_intros': check_n3_intros, 'check_n3_bestiary': check_n3_bestiary, 'check_n3_prebake': check_n3_prebake,
               'check_n3_coach_potions': check_n3_coach_potions})


# ---------- Task 11: the Ash Crone's zone is a baked sprite ----------
def check_n3_zone_budget(browser, url):
    """The Ash Crone's 3x3 zone (G.hexZones src 'crone', drawn by drawCroneZoneFx) must not lag a phone (the 6-20 lesson, w6_check check_draw_budget):
    its sprite is baked when a night that can spawn her starts (not on first sight), and four zones on N3-10 cost at most 40 strokes and 2 new gradients a frame."""
    if not R7: return
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['stroke', 'fill', 'arc', 'createRadialGradient', 'drawImage']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; } })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm3_start(page, 1); time.sleep(1.0)
    ok(page.evaluate("() => window.__gg.hexZoneBaked()") == 0, 'a night without Ash Crones bakes no hex zone sprite')
    nm3_start(page, 10); time.sleep(3.2)
    ok(page.evaluate("() => window.__gg.hexZoneBaked()") >= 1, 'N3-10 bakes the 3x3 hex zone sprite at night start, not on first sight')
    page.evaluate(PQ); page.evaluate("() => { window.__gg.G.hexZones.length = 0; }")
    count = "() => new Promise(res => { window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 30) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.stroke || 0) / 30, (c.createRadialGradient || 0) / 30, (c.fill || 0) / 30, (c.arc || 0) / 30, (c.drawImage || 0) / 30]); } }; requestAnimationFrame(tick); })"
    time.sleep(0.5); base = page.evaluate(count)
    page.evaluate("() => { const G = window.__gg.G; for (const [l, p] of [[1, 0.3], [3, 0.5], [5, 0.3], [6, 0.65]]) G.hexZones.push({ shape:'box', lane:l, p, t:60, src:'crone' }); }")
    time.sleep(0.6); lit = page.evaluate(count)
    d = [lit[i] - base[i] for i in range(5)]
    print(f'    four crone zones add per frame: stroke {d[0]:.1f}, new gradients {d[1]:.1f}, fill {d[2]:.1f}, arc {d[3]:.1f}, drawImage {d[4]:.1f}')
    ok(lit[0] <= 40 and lit[1] <= 2, f'four Ash Crone zones are baked: {lit[0]:.1f} strokes and {lit[1]:.1f} new gradients per frame (limits 40 / 2; empty field {base[0]:.1f} / {base[1]:.1f})')
    ok(d[0] <= 24, f'and they add at most 24 strokes a frame ({d[0]:.1f})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_n3_zone_budget': check_n3_zone_budget})


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
