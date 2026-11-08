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


CHECKS.update({'check_wart_damage': check_wart_damage, 'check_wart_break_heal': check_wart_break_heal, 'check_picker_three_gourds': check_picker_three_gourds,
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
