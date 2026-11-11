"""Release 5 checks (Nightmare Foggy Hollow, docs/superpowers/specs/2026-11-05-release-5-nightmare-hollow-design.md),
against a build served by tools/serve_dist.py. Every Release 5 task adds its checks to CHECKS.
  Playtest build:  npm run build:playtest            then  .venv/bin/python tools/nm2_check.py --url http://127.0.0.1:4173/ --expect on
  Release 4 build: VITE_RELEASE=4 npx vite build      then  ... --expect r4   (nothing from Release 5)
  Release 3 build: VITE_RELEASE=3 npx vite build      then  ... --expect r3
  Release 2 build: VITE_RELEASE=2 npx vite build      then  ... --expect r2
  Store build:     npm run build                      then  ... --expect off
Checks read the global R5 (on only). Exits 1 on any failure. --only runs one check by name."""
import argparse, sys, time, os
from playwright.sync_api import sync_playwright

from w6_check import open_page, ok, FAILS, start, bundle_js, set_stars
from nm3_check import check_r7_absent   # `--expect r6` adds it to CHECKS (see main)

R5 = False   # set by --expect: the build holds Release 5 (playtest)
MODE = 'on'
BUILD = 'on'   # the --expect given before r7/r6 are mapped to 'on': which later books' Fallen bosses the build holds


def nm2_start(page, k, coach=False):
    """Start Nightmare 2-k (night 1100 + k). The Release 4 gourd coach and the Protector coach (N2-5) are marked seen unless coach=True, so the
    other checks get a plain night."""
    if not coach: page.evaluate("() => { window.__gg.save.seenGourdCoach = true; window.__gg.save.seenProtectorCoach = true; }")
    start(page, 1100 + k)


def story_done(upto=40):
    return {n: 3 for n in range(1, upto + 1)}


# ---------- Task 1: the track, the book page and the release checks ----------
R5_NAMES = ('Rot Mist', 'Protector Gourd', 'Lamplighter', 'Fallen Poltergeist', 'Poltergeist 2', 'Plague Doctor 2', 'Wisp Rider 2', 'Fogwalker 2', 'Reaper', 'Poison fog')


def check_r5_absent(browser, url):
    if R5: return   # the playtest build holds whichever of these the finished tasks have added; only the lower builds must hold none
    js = bundle_js()
    for s in R5_NAMES:
        ok(s not in js, f"{s!r} not in the bundle")


def check_n2_track(browser, url):
    page, errors = open_page(browser, url)
    if not R5:
        ok(page.evaluate("() => window.__gg.isOpen ? window.__gg.isOpen(1101) : false") is False, 'N2-1 is not open below Release 5')
        if MODE in ('on', 'r4'): ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") == 1, 'only the Release 4 nightmare table is present')
        page.close(); return
    set_stars(page, {40: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1101)") is False, 'N2-1 stays shut with 2-20 beaten but N1-4 not')
    set_stars(page, {40: 3, 1004: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1101)") is True, 'N2-1 opens once 2-20 and N1-4 are beaten')
    set_stars(page, {1004: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1101)") is False, 'N2-1 stays shut with N1-4 beaten but 2-20 not')
    set_stars(page, {40: 3, 1004: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1102)") is False, 'N2-2 does not exist yet / stays shut')
    d = page.evaluate("() => { const d = window.__gg.levelFor(1101); return [d.label, d.nightmare, d.worldNo, d.levelNo, d.world, d.gourd]; }")
    ok(d == ['N2-1', True, 2, 1, 7, True], f'levelFor(1101): label N2-1, nightmare, story world 2, level 1, theme 7, gourd {d}')
    ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") >= 2, 'NIGHTMARE_LEVELS holds the patch and the hollow tables (and later the wood)')
    ok(page.evaluate("() => window.__gg.nmNight(2, 1)") == 1101, 'nmNight(2, 1) = 1101')
    nm2_start(page, 1)
    g = page.evaluate("() => { const G = window.__gg.G; return [G.def.label, G.world, G.n, window.__gg.state]; }")
    ok(g == ['N2-1', 7, 1101, 'play'], f'N2-1 starts on the hollow nightmare map {g}')
    time.sleep(1.0)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_n2_book(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    # 2-20 beaten, N1-4 not: the bookmark shows, the page says what is missing and has no stamps
    set_stars(page, story_done())
    page.evaluate("() => window.__gg.openBook(1)"); time.sleep(0.6)
    ok(page.evaluate("() => !document.querySelector('#bBookmark').hidden"), 'the world 2 bookmark appears once 2-20 is beaten')
    page.click('#bBookmark'); time.sleep(0.8)
    t = page.evaluate("() => [document.querySelector('#bkSoon').hidden, document.querySelector('#bkLevels').hidden, document.querySelector('#bkSoon').textContent]")
    ok(not t[0] and t[1] and 'Beat Nightmare 1-4' in t[2], f'a locked page says what is missing {t}')
    page.evaluate("() => window.__gg.openBook(1)"); time.sleep(0.4)
    # both gates met: 16 stamps, N2-1 open, the rest "Coming soon" / shut
    set_stars(page, {**story_done(), 1004: 3})
    page.evaluate("() => window.__gg.openBook(1)"); time.sleep(0.6)
    if page.evaluate("() => !document.querySelector('#spread').classList.contains('nightmare')"): page.click('#bBookmark')
    time.sleep(0.8)
    pg = page.evaluate("() => [...document.querySelectorAll('#bkLevels .pg')].map(b => [b.disabled, b.textContent])")
    soon = page.evaluate("() => [document.querySelector('#bkSoon').hidden, document.querySelector('#bkLevels').hidden]")
    ok(len(pg) == 16, f'the world 2 nightmare page shows 16 stamps ({len(pg)})')
    ok(soon == [True, False], f'the page shows the stamps, not the locked message {soon}')
    if len(pg) == 16:
        ok(not pg[0][0] and all(b[0] for b in pg[1:]), 'only N2-1 is open on a fresh hollow track')
        built = page.evaluate("() => window.__gg.NIGHTMARE_LEVELS[1].length")
        ok(sum(1 for b in pg if 'Coming soon' in b[1]) == 16 - built, f'the {16 - built} levels not built yet read "Coming soon"')
    # the world 1 page is unchanged
    page.evaluate("() => window.__gg.openBook(0)"); time.sleep(0.6)
    if page.evaluate("() => !document.querySelector('#spread').classList.contains('nightmare')"): page.click('#bBookmark')
    time.sleep(0.8)
    ok(page.evaluate("() => document.querySelectorAll('#bkLevels .pg').length") == 16, 'the world 1 nightmare page still shows 16 stamps')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS = {'check_r5_absent': check_r5_absent, 'check_n2_track': check_n2_track, 'check_n2_book': check_n2_book}


# ---------- Task 2: gourds as a list, and the Protector Gourd ----------
R5_NAMES += ('Shields its square', 'e4d9bd')   # the Protector's role line and the Swan's hue (render/gourd.js)
GON = "() => window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c])"
# Quiet the night: no spawns, no sprouts, no monsters, no graves, nothing on the patch but the gourds.
GQ = """() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.projs.length = 0; G.drops.length = 0;
  if (G.fires) G.fires.length = 0; G.fmNext = 99; G.fireTrickleT = 1e9; g.graves.forEach(r => r.fill(false));
  g.grid.forEach(row => row.forEach((c, i) => { if (!(c && c.gourd)) row[i] = null; })); g.resolveMatches(); }"""
FULL = "() => { const g = window.__gg; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (!g.grid[r][c] && !g.graves[r][c]) g.grid[r][c] = g.newCell((r + c) % 2); g.resolveMatches(); }"


def two_gourds(page, quiet=True):
    """Start N2-1 with both gourds picked (slot order Grave, Protector), the coach marked seen."""
    page.evaluate("() => { window.__gg.save.seenGourdCoach = true; }")
    page.evaluate("(lo) => window.__gg.startGame('story', 1101, lo, ['grave', 'protector'])", [0, 1, 2, 3, 4])
    time.sleep(0.3)
    if quiet: page.evaluate(GQ)


def check_gourd_list_r4(browser, url):
    """Release 4 unchanged: N1-5 has one Grave Gourd in the centre; started without gourds (as Release 4's picker does) it is ['grave']."""
    if MODE not in ('on', 'r4'): return
    page, errors = open_page(browser, url)
    page.evaluate("() => { window.__gg.save.seenGourdCoach = true; }")
    start(page, 1005)
    if not R5:
        ok(page.evaluate("() => window.__gg.gourdsOn === undefined && window.__gg.isProtected === undefined"), 'the Release 5 gourd hooks are not in a Release 4 build')
        ok(page.evaluate("() => { const p = window.__gg.gourdPos(); return p && [p.r, p.c]; }") == [2, 3], 'the Grave Gourd still starts at (2, 3) on N1-5')
        page.close(); return
    ok(page.evaluate(GON) == [['grave', 2, 3]], f'N1-5: gourdsOn() is one grave at (2, 3) {page.evaluate(GON)}')
    ok(page.evaluate("() => window.__gg.G.gourdKinds") == ['grave'], f"G.gourdKinds is ['grave'] when startGame gets none {page.evaluate('() => window.__gg.G.gourdKinds')}")
    k = page.evaluate("() => { const g = window.__gg, x = g.grid[2][3]; return [x.gourd, g.gourdKind(x), g.gourdKind(g.newCell(0)), g.gourdKind(null), g.isGourd(x)]; }")
    ok(k == ['grave', 'grave', None, None, True], f"its cell is gourd:'grave'; gourdKind reads it, null for a pumpkin or nothing {k}")
    ok(page.evaluate("() => { const p = window.__gg.gourdPos('grave'), q = window.__gg.gourdPos(); return [p.r, p.c, q.r, q.c, window.__gg.gourdPos('protector')]; }") == [2, 3, 2, 3, None], "gourdPos() is the grave's; gourdPos('protector') null")
    ok(page.evaluate("() => [0, 1, 2, 3, 4].every(r => [0, 1, 2, 3, 4, 5, 6].every(c => !window.__gg.isProtected(r, c)))"), 'no cell is protected without a Protector')
    # Release 4's picker hands startGame one key (a string): still one grave
    page.evaluate("(lo) => window.__gg.startGame('story', 1005, lo, 'grave')", [0, 1, 2, 3, 4]); time.sleep(0.2)
    ok(page.evaluate(GON) == [['grave', 2, 3]], f"startGame(..., 'grave') (one key) still places one grave {page.evaluate(GON)}")
    # a story night has no gourds at all
    page.evaluate("(lo) => window.__gg.startGame('story', 15, lo, ['grave', 'protector'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    ok(page.evaluate(GON) == [] and page.evaluate("() => window.__gg.G.gourdKinds") == [], 'a night without gourd:true places none, whatever is passed')
    time.sleep(0.5)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_two_gourds_start(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    two_gourds(page, quiet=False)
    ok(page.evaluate("() => window.__gg.G.gourdKinds") == ['grave', 'protector'], 'G.gourdKinds holds the picked kinds in slot order')
    ok(page.evaluate(GON) == [['grave', 2, 1], ['protector', 2, 5]], f'two gourds: Grave at (2, 1), Protector at (2, 5) {page.evaluate(GON)}')
    ok(page.evaluate("() => window.__gg.grid.flat().filter(x => x && x.gourd).length") == 2, 'exactly two gourds on the patch')
    # graves on both start cells: each on its nearest free cell
    page.evaluate("() => { const g = window.__gg; g.graves[2][1] = true; g.graves[2][5] = true; g.placeGourdsAtStart(['grave', 'protector']); }")
    got = page.evaluate(GON)
    ok(got == [['grave', 1, 1], ['protector', 1, 5]], f'graves on (2, 1) and (2, 5): both move to the nearest free cell {got}')
    # both would want the same cell: never the same one
    page.evaluate("() => { const g = window.__gg; g.graves.forEach(r => r.fill(true)); g.graves[2][3] = false; g.graves[0][0] = false; g.placeGourdsAtStart(['grave', 'protector']); }")
    got = sorted(page.evaluate(GON))
    ok(got == [['grave', 2, 3], ['protector', 0, 0]], f'only (2, 3) and (0, 0) free: the grave takes (2, 3), the protector the next nearest (0, 0) {got}')
    # a full patch: both placed (they replace pumpkins), the old gourds removed
    page.evaluate("() => { const g = window.__gg; g.graves.forEach(r => r.fill(false)); g.placeGourdsAtStart([]); }"); page.evaluate(FULL)
    page.evaluate("() => window.__gg.placeGourdsAtStart(['grave', 'protector'])")
    got = page.evaluate(GON)
    ok(got == [['grave', 2, 1], ['protector', 2, 5]] and page.evaluate("() => window.__gg.grid.flat().filter(x => !x).length") == 0, f'a full patch: both placed on their start cells, replacing pumpkins {got}')
    # one kind alone: the centre, as Release 4
    page.evaluate("() => window.__gg.placeGourdsAtStart(['protector'])")
    ok(page.evaluate(GON) == [['protector', 2, 3]], f'one kind alone goes in the centre (2, 3) {page.evaluate(GON)}')
    page.evaluate("(lo) => window.__gg.startGame('story', 1101, lo, ['protector', 'grave'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    ok(page.evaluate(GON) == [['grave', 2, 1], ['protector', 2, 5]] and page.evaluate("() => window.__gg.G.gourdKinds") == ['protector', 'grave'], f'slot order Protector, Grave: the grave still takes the left cell {page.evaluate(GON)}')
    time.sleep(0.8)   # a few frames with both on the patch
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_protector_protects(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    two_gourds(page)
    p = page.evaluate("() => { const g = window.__gg; return [g.isProtected(2, 5), g.isProtected(1, 4), g.isProtected(3, 6), g.isProtected(2, 3), g.isProtected(2, 1), g.isProtected(0, 5), g.isProtected(4, 5)]; }")
    ok(p == [True, True, True, False, False, False, False], f'isProtected: the Protector cell and its 3x3 only, never the Grave square {p}')
    # its 3x3 full of pumpkins, one pumpkin outside every square at (0, 3): the crow takes that one
    page.evaluate("""() => { const g = window.__gg;
      for (let r = 1; r <= 3; r++) for (let c = 4; c <= 6; c++) if (r !== 2 || c !== 5) g.grid[r][c] = g.newCell(0);
      g.grid[0][3] = g.newCell(1); g.resolveMatches(); const w = g.walls[3]; w.hp = w.max; window.__c = g.spawnMonster('crow', 3, false, 0.97); }""")
    time.sleep(1.2)
    r = page.evaluate("() => { const g = window.__gg; let n = 0; for (let r = 1; r <= 3; r++) for (let c = 4; c <= 6; c++) if (g.grid[r][c] && !g.grid[r][c].gourd) n++; return [window.__c.dead, !g.grid[0][3], n]; }")
    ok(r == [True, True, 8], f'the crow took the pumpkin outside, never the 8 in the Protector square {r}')
    # only protected pumpkins left (and the Grave square empty): it pecks the fence
    page.evaluate("() => { const g = window.__gg, w = g.walls[5]; w.hp = w.max; window.__c2 = g.spawnMonster('crow', 5, false, 0.97); }")
    time.sleep(1.5)
    r = page.evaluate("() => { const g = window.__gg; let n = 0; for (let r = 1; r <= 3; r++) for (let c = 4; c <= 6; c++) if (g.grid[r][c] && !g.grid[r][c].gourd) n++; return [window.__c2.dead, window.__c2.eating, g.walls[5].hp < g.walls[5].max, n]; }")
    ok(r == [False, True, True, 8], f'with only Protector pumpkins left the crow pecks the fence {r}')
    # a dive already on its way to a pumpkin that then slides into the square does not land (the dive takes diveT 0.4 s)
    page.evaluate("""() => { const g = window.__gg; g.G.monsters.length = 0; g.grid[1][4] = null; g.grid[0][3] = g.newCell(1); window.__t = g.grid[0][3]; g.resolveMatches();
      window.__c3 = g.spawnMonster('crow', 3, false, 0.97); }""")
    for _ in range(60):
        if page.evaluate("() => window.__c3.dead"): break
        time.sleep(0.02)
    page.evaluate("() => { const g = window.__gg; g.grid[0][3] = null; g.grid[1][4] = window.__t; g.resolveMatches(); }")
    time.sleep(1.0)
    ok(page.evaluate("() => window.__c3.dead && window.__gg.grid[1][4] === window.__t"), 'a pumpkin the crow dived at that is now inside the Protector square is not broken')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_protector_launch(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { window.__gg.save.lv.green = 1; }")
    two_gourds(page)
    page.evaluate("() => { const g = window.__gg; for (const w of g.walls) w.hp = 10; for (const c of [4, 5, 6]) g.grid[1][c] = g.newCell(0); for (const c of [1, 2, 3]) g.grid[0][c] = g.newCell(1); g.resolveMatches(); }")
    mx = page.evaluate("() => window.__gg.walls[5].max")
    page.evaluate("() => { const g = window.__gg; g.launchGroup(g.grid[1][5]); }")
    r = page.evaluate("() => { const g = window.__gg; return [g.walls[4].hp, g.walls[5].hp, g.walls[6].hp, g.walls[3].hp, g.G.projs.map(p => [p.lane, !!p.ward])]; }")
    ok(r[:4] == [11, 11, 11, 10], f'a bunch launched from the Protector square heals the fences of its columns by 1 at launch (10 -> 11 of {mx}) {r[:4]}')
    ok(sorted(r[4]) == [[4, True], [5, True], [6, True]], f'all three projectiles carry ward {r[4]}')
    page.evaluate("() => { const g = window.__gg; g.G.projs.length = 0; g.launchGroup(g.grid[0][2]); }")
    r = page.evaluate("() => { const g = window.__gg; return [g.walls[1].hp, g.walls[2].hp, g.walls[3].hp, g.G.projs.map(p => !!p.ward)]; }")
    ok(r == [10, 10, 10, [False, False, False]], f'a bunch launched outside it heals nothing and carries no ward {r}')
    page.evaluate("() => { const g = window.__gg; g.G.projs.length = 0; const w = g.walls[5]; w.hp = w.max; for (const c of [4, 5, 6]) g.grid[1][c] = g.newCell(0); g.resolveMatches(); g.launchGroup(g.grid[1][5]); }")
    ok(page.evaluate("() => window.__gg.walls[5].hp === window.__gg.walls[5].max"), 'never above full')
    # the hit: always knocks back at level 1 (KB_CHANCE 0), only the first monster hit
    kb = page.evaluate("""() => { const g = window.__gg; g.G.projs.length = 0; g.G.monsters.length = 0;
      const m = g.spawnMonster('ghoul', 3, false, 0.4); m.hp = m.maxHp = 5000; let ward = 0, plain = 0, second = 0;
      const pr = w => ({ x:g.LANE(3), y:300, vy:-900, type:0, vis:0, lv:1, guar:false, lane:3, hitWalls:new Set(), grp:{ spawned:false, small:true, kills:0 }, size:1, hit:new Set(), trail:[], r:16, dead:false, ward:w });
      for (let i = 0; i < 20; i++){ m.kb = 0; g.hitMonster(pr(true), m); if (m.kb > 0) ward++; }
      for (let i = 0; i < 20; i++){ m.kb = 0; g.hitMonster(pr(false), m); if (m.kb > 0) plain++; }
      const o = g.spawnMonster('ghoul', 3, false, 0.3); o.hp = o.maxHp = 5000;
      for (let i = 0; i < 20; i++){ const p = pr(true); m.kb = o.kb = 0; g.hitMonster(p, m); g.hitMonster(p, o); if (o.kb > 0) second++; }
      const b = g.spawnMonster('boss:gravekeeper', 4, true, 0.3); let boss = 0; b.hp = b.maxHp = 5000;
      for (let i = 0; i < 20; i++){ b.kb = 0; g.hitMonster(pr(true), b); if (b.kb > 0) boss++; }
      return [ward, plain, second, boss]; }""")
    ok(kb == [20, 0, 0, 0], f'ward hits knock back 20/20 at level 1 (plain 0/20); only the first monster hit; a boss never {kb}')
    # a real flight: a 5000-health ghoul in lane 5 is knocked back by a pumpkin launched from (1, 5)
    page.evaluate("""() => { const g = window.__gg; g.G.monsters.length = 0; g.G.projs.length = 0; g.grid.forEach(row => row.forEach((c, i) => { if (!(c && c.gourd)) row[i] = null; }));
      for (const c of [4, 5, 6]) g.grid[1][c] = g.newCell(0); g.resolveMatches();
      window.__m = g.spawnMonster('ghoul', 5, false, 0.5); window.__m.hp = window.__m.maxHp = 5000; window.__m.sp = 0; window.__kb = 0;
      clearInterval(window.__ki); window.__ki = setInterval(() => { window.__kb = Math.max(window.__kb, window.__m.kb || 0); }, 5); g.launchGroup(g.grid[1][5]); }""")
    time.sleep(1.0)
    ok(page.evaluate("() => window.__kb > 0 && window.__m.hp < 5000"), 'a real ward flight hits and knocks back the ghoul')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_protector_due(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    two_gourds(page)
    page.evaluate("() => { const g = window.__gg; g.graves[1][5] = true; g.graves[1][1] = true; }")
    ok(page.evaluate("() => window.__gg.destroyGourd(window.__gg.grid[2][5])") is True, 'destroyGourd breaks the Protector')
    r = page.evaluate("() => { const g = window.__gg; return [g.isProtected(2, 5), g.isProtected(1, 4), g.gourdPos('protector'), g.G.gourdDue, !!g.G.gourdDueOf.protector, g.graves[1][5], g.graves[1][1], g.gourdsOn().map(o => o.kind)]; }")
    ok(r == [False, False, None, False, True, True, True, ['grave']], f'broken: its square is unprotected, it is due back (the grave is not), no grave cleared {r}')
    page.evaluate("() => { const g = window.__gg; g.graves.forEach(r => r.fill(false)); }")
    page.evaluate(FULL)
    page.evaluate("() => { const g = window.__gg; g.grid[4][0] = null; g.resolveMatches(); g.spawnSprouts(); }")
    r = page.evaluate("() => { const g = window.__gg, p = g.gourdPos('protector'); return p && [p.r, p.c, g.isProtected(p.r, p.c), g.isProtected(3, 1), g.G.gourdDueOf.protector || false]; }")
    ok(r == [4, 0, True, True, False], f'the next sprout tick brings it back on the free cell (4, 0), protecting its new square again {r}')
    # it comes back before the tick's slots: the Grave Gourd still fills what is left of its square
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('protector'); g.destroyGourd(g.grid[p.r][p.c]); g.grid[4][0] = g.newCell(0); for (const [a, b] of [[1,0],[2,0],[3,0],[1,1],[3,1],[1,2],[2,2],[3,2]]) g.grid[a][b] = null; g.resolveMatches(); g.spawnSprouts(); }")
    r = page.evaluate("() => { const g = window.__gg, p = g.gourdPos('protector'); let n = 0; for (const [a, b] of [[1,0],[2,0],[3,0],[1,1],[3,1],[1,2],[2,2],[3,2]]) if (g.grid[a][b]) n++; return [!!p, n]; }")
    ok(r == [True, 8], f'with only the Grave square free: the Protector comes back there and the Grave slot fills the other 7 {r}')
    # the Grave keeps its rule: breaking it clears graves, the Protector is untouched
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('protector'), cell = g.grid[p.r][p.c]; g.grid[p.r][p.c] = null; g.grid[4][6] = cell; g.graves[1][1] = true; g.grid[1][1] = null; g.destroyGourd(g.grid[2][1]); }")
    r = page.evaluate("() => { const g = window.__gg; return [g.graves[1][1], g.G.gourdDue, !!g.G.gourdDueOf.protector, g.gourdsOn().map(o => o.kind)]; }")
    ok(r == [False, True, False, ['protector']], f'breaking the Grave clears its graves and only it is due {r}')
    # a full patch: the Protector waits, as the Grave does
    page.evaluate("() => { const g = window.__gg; const p = g.gourdPos('protector'); g.destroyGourd(g.grid[p.r][p.c]); g.G.gourdDue = false; }")
    page.evaluate(FULL)
    page.evaluate("() => window.__gg.spawnSprouts()")
    ok(page.evaluate("() => [window.__gg.gourdPos('protector'), !!window.__gg.G.gourdDueOf.protector]") == [None, True], 'with no free cell the Protector stays due')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_gourd_continue2(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    two_gourds(page)
    page.evaluate("() => { const g = window.__gg, p = g.grid[2][1]; g.grid[2][1] = null; g.grid[4][0] = p; g.destroyGourd(g.grid[2][5]); }")
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); window.__snap = JSON.parse(JSON.stringify(c.gourd)); g.continueNight(c); }"); time.sleep(0.3)
    snap = page.evaluate("() => window.__snap")
    ok(snap == [{'kind': 'grave', 'at': [4, 0], 'due': False}, {'kind': 'protector', 'at': None, 'due': True}], f'the snapshot lists both gourds {snap}')
    r = page.evaluate("() => [window.__gg.G.gourdKinds, window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c]), !!window.__gg.G.gourdDueOf.protector, window.__gg.G.gourdDue]")
    ok(r == [['grave', 'protector'], [['grave', 4, 0]], True, False], f'continued: the grave stands where it stood, the protector is still due {r}')
    page.evaluate("() => { window.__gg.G.sproutT = -999; window.__gg.spawnSprouts(); }")
    ok(page.evaluate("() => window.__gg.gourdPos('protector') !== null"), 'and the first sprout brings the Protector back')
    # the other way round: the Grave due, the Protector standing
    page.evaluate("() => { const g = window.__gg; g.G.continued = false; const p = g.gourdPos('protector'); g.grid[p.r][p.c] = null; g.grid[0][6] = g.newGourd('protector'); g.destroyGourd(g.grid[4][0]); const c = g.continueState(); g.continueNight(c); }"); time.sleep(0.3)
    r = page.evaluate("() => [window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c]), window.__gg.G.gourdDue, !!window.__gg.G.gourdDueOf.protector]")
    ok(r == [[['protector', 0, 6]], True, False], f'continued: the protector stands at (0, 6), the grave is due {r}')
    # a Release 4 snapshot (one object, not a list) still restores
    page.evaluate("() => { const g = window.__gg; g.restoreGourd({ at:[4, 5], due:false }); }")
    ok(page.evaluate("() => window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c])") == [['grave', 4, 5]], f"a Release 4 snapshot restores one grave {page.evaluate('() => window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c])')}")
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_protector_data(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    d = page.evaluate("() => { const P = window.__gg.GOURDS.protector; return P && [P.key, P.name, P.role, typeof P.power, typeof P.lore, P.power.length > 40, P.lore.length > 20]; }")
    ok(d == ['protector', 'Protector Gourd', 'Shields its square', 'string', 'string', True, True], f'GOURDS.protector {d}')
    two_gourds(page)
    px = page.evaluate("""() => { const c = window.__gg.gourdIcon(96, 'protector'), g = c.getContext('2d'), d = g.getImageData(0, 0, 96, 96).data;
      const e = window.__gg.gourdIcon(96, 'grave').getContext('2d').getImageData(0, 0, 96, 96).data; let n = 0, diff = 0;
      for (let i = 3; i < d.length; i += 4){ if (d[i] > 0) n++; if (Math.abs(d[i - 3] - e[i - 3]) + Math.abs(d[i - 2] - e[i - 2]) > 40) diff++; } return [n, diff]; }""")
    ok(px[0] > 2000 and px[1] > 500, f'the Protector icon is drawn and differs from the Grave Gourd ({px[0]} lit px, {px[1]} differ)')
    time.sleep(0.5)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_gourd_list_r4': check_gourd_list_r4, 'check_two_gourds_start': check_two_gourds_start, 'check_protector_protects': check_protector_protects,
               'check_protector_launch': check_protector_launch, 'check_protector_due': check_protector_due, 'check_gourd_continue2': check_gourd_continue2,
               'check_protector_data': check_protector_data})


# ---------- Task 3: rotten pumpkins ----------
R5_NAMES += ('rotOnly', 'cleanOnly')   # the hit flags (property names survive minification)
# Clear every pumpkin off the patch (gourds stay), then put rotten ones on the given cells (newCell(ROTTEN): a rotten one slid there).
ROT_AT = """(cells) => { const g = window.__gg; g.grid.forEach(row => row.forEach((c, i) => { if (!(c && c.gourd)) row[i] = null; }));
  for (const [r, c] of cells) g.grid[r][c] = g.newCell(g.ROTTEN); g.resolveMatches(); }"""
# Pin a hit flag on a monster for the test: a getter that ignores the per-frame reset (clearHitFlags writes false, the read stays true).
PIN = "(m, flag) => Object.defineProperty(m, flag, { get:() => true, set(){}, configurable:true })"
# A still ghoul with given health; sampled for knockback every 5 ms (window.__kb).
GHOUL = """([lane, p, hp, max]) => { const g = window.__gg, m = g.spawnMonster('ghoul', lane, false, p); m.sp = 0; m.hp = hp; m.maxHp = max; m.eat = 0;
  (window.__ms = window.__ms || []).push(m); return window.__ms.length - 1; }"""
KB_WATCH = "() => { window.__kb = 0; clearInterval(window.__ki); window.__ki = setInterval(() => { for (const m of window.__ms || []) window.__kb = Math.max(window.__kb, m.kb || 0); }, 5); }"


def rot_reset(page):
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; g.G.projs.length = 0; window.__ms = []; window.__kb = 0; }")


def check_rot_cell(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    two_gourds(page)
    r = page.evaluate("""() => { const g = window.__gg; g.grid[0][0] = g.newCell(0); const n0 = g.G.parts.length;
      const a = g.rotCell(0, 0), x = g.grid[0][0]; return [g.ROTTEN, a, x.c, g.isRotten(x), x.lit, g.G.parts.length > n0, g.rotCell(0, 0), g.isRotten(g.newCell(0)), g.isRotten(null)]; }""")
    ok(r == [-2, True, -2, True, False, True, False, False, False], f'rotCell on a pumpkin: c = ROTTEN (-2), unlit, a puff; again false; isRotten reads it {r}')
    r = page.evaluate("""() => { const g = window.__gg; g.grid[0][3] = null; g.grid[0][4] = g.newCell(1); g.grid[0][4].fly = 0.3; g.grid[1][4] = g.newCell(0);
      return [g.rotCell(2, 1), g.grid[2][1].c, g.grid[2][1].gourd, g.rotCell(2, 5), g.grid[2][5].gourd, g.rotCell(0, 3), g.grid[0][3], g.rotCell(0, 4), g.grid[0][4].c, g.rotCell(1, 4), g.grid[1][4].c]; }""")
    ok(r == [False, -1, 'grave', False, 'protector', False, None, False, 1, False, 0], f'false and unchanged: a gourd (either kind), an empty cell, a flying cell, a protected cell {r}')
    # a cell of a lit bunch: it leaves the bunch (the other two go dark)
    r = page.evaluate("""() => { const g = window.__gg; for (const c of [0, 1, 2]) g.grid[4][c] = g.newCell(0); g.resolveMatches(); const was = g.grid[4][0].lit;
      const a = g.rotCell(4, 1); return [was, a, g.grid[4][1].lit, g.grid[4][0].lit, g.grid[4][2].lit]; }""")
    ok(r == [True, True, False, False, False], f'rotting one cell of a lit three: it goes dark and so do the other two {r}')
    time.sleep(0.6)   # a few frames with rotten pumpkins on the patch
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_rot_bunch(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { window.__gg.save.lv.paint = 5; }")
    two_gourds(page)
    page.evaluate(ROT_AT, [[4, 0], [4, 1], [4, 2]])
    r = page.evaluate("""() => { const g = window.__gg, cs = [0, 1, 2].map(c => g.grid[4][c]), gid = cs[0].gids[0], grp = g.G.groups[gid];
      return [cs.every(x => x.lit), cs.every(x => x.gids.length === 1 && x.gids[0] === gid), grp && grp.color, grp && grp.size]; }""")
    ok(r == [True, True, -2, 3], f'three rotten in a row light up as one bunch of colour ROTTEN {r}')
    page.evaluate(ROT_AT, [[4, 0], [4, 1]])
    ok(page.evaluate("() => !window.__gg.grid[4][0].lit && !window.__gg.grid[4][1].lit"), 'two rotten alone stay dark (three to bunch, as any colour)')
    # a Rainbow touching a rotten three stays out; a Rainbow with two rotten does not make a bunch
    page.evaluate(ROT_AT, [[4, 0], [4, 1], [4, 2]])
    r = page.evaluate("() => { const g = window.__gg; g.grid[4][3] = g.newCell(g.RAINBOW); g.resolveMatches(); const grp = g.G.groups[g.grid[4][0].gids[0]]; return [g.grid[4][3].lit, grp && grp.size]; }")
    ok(r == [False, 3], f'a Rainbow touching a rotten three stays out of it (bunch still 3) {r}')
    page.evaluate(ROT_AT, [[4, 0], [4, 1]])
    r = page.evaluate("() => { const g = window.__gg; g.grid[4][2] = g.newCell(g.RAINBOW); g.resolveMatches(); return [0, 1, 2].map(c => g.grid[4][c].lit); }")
    ok(r == [False, False, False], f'two rotten and a Rainbow make no bunch {r}')
    # Paint never pulls a rotten pumpkin (it does pull the green beside it)
    r = page.evaluate("""() => { const g = window.__gg, P = g.PTYPES.findIndex(p => p.key === 'paint');
      g.grid.forEach(row => row.forEach((c, i) => { if (!(c && c.gourd)) row[i] = null; }));
      for (const c of [2, 3, 4]) g.grid[0][c] = g.newCell(P); g.grid[1][3] = g.newCell(g.ROTTEN); g.grid[0][1] = g.newCell(g.ROTTEN); g.grid[0][5] = g.newCell(0); g.resolveMatches();
      const gid = g.grid[0][3].gids[0], pull = g.paintPull(gid).map(o => [o.r, o.c]);
      g.launchGroup(g.grid[0][3]); return [pull, g.isRotten(g.grid[1][3]), g.isRotten(g.grid[0][1]), g.G.projs.length]; }""")
    ok(r == [[[0, 5]], True, True, 4], f'a Paint bunch pulls the green beside it, never the rotten ones; they stay on the patch {r}')
    # the hint treats rotten as a colour: the slide that makes a rotten three
    page.evaluate("() => { window.__gg.G.projs.length = 0; }")
    page.evaluate(ROT_AT, [[4, 3], [4, 4], [0, 2]])
    r = page.evaluate("() => { const g = window.__gg, b = g.bestMove(); return b && [b.ref === g.grid[0][2], b.dir]; }")
    ok(r == [True, 'down'], f'bestMove slides the lone rotten one down beside the other two {r}')
    time.sleep(0.5)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_rot_hit(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { const s = window.__gg.save; s.lv.green = 1; s.lv.grey = 1; }")
    two_gourds(page)
    r = page.evaluate("""() => { const g = window.__gg, m = {}, a = [g.hitRule(m, true), g.hitRule(m, false)]; m.rotOnly = true; a.push(g.hitRule(m, true), g.hitRule(m, false));
      m.rotOnly = false; m.cleanOnly = true; a.push(g.hitRule(m, true), g.hitRule(m, false)); return a; }""")
    ok(r == ['heal', 'hurt', 'hurt', 'blocked', 'blocked', 'hurt'], f'hitRule: plain heal/hurt, rotOnly hurt/blocked, cleanOnly blocked/hurt {r}')
    # the flags are reset every frame before monsters update
    rot_reset(page)
    page.evaluate("() => { const g = window.__gg, m = g.spawnMonster('ghoul', 0, false, 0.3); m.sp = 0; m.rotOnly = true; m.cleanOnly = true; window.__f = m; }")
    time.sleep(0.2)
    ok(page.evaluate("() => [window.__f.rotOnly, window.__f.cleanOnly]") == [False, False], 'rotOnly and cleanOnly are cleared at the start of each frame')

    def fly(cells, launch, lane, p, hp, mx, pin=None, behind=None, wait=1.0):
        rot_reset(page)
        page.evaluate(ROT_AT, cells)
        i = page.evaluate(GHOUL, [lane, p, hp, mx])
        if pin: page.evaluate(f"(f) => ({PIN})(window.__ms[{i}], f)", pin)
        j = page.evaluate(GHOUL, [lane, behind, 3, 3]) if behind is not None else None
        page.evaluate(KB_WATCH)
        page.evaluate(launch)
        time.sleep(wait)
        return page.evaluate(f"() => [window.__ms[{i}].hp, window.__kb, {f'window.__ms[{j}].hp' if j is not None else 'null'}, window.__gg.G.projs.filter(p => p.lane === {lane}).length]")

    L3 = "() => { const g = window.__gg; g.launchGroup(g.grid[4][3]); }"
    r = fly([[4, 2], [4, 3], [4, 4]], L3, 3, 0.5, 2, 3)
    ok(r[0] == 2.5 and r[1] == 0, f'a launched rotten pumpkin heals a ghoul at 2/3 to 2.5/3, no knockback {r}')
    r = fly([[4, 2], [4, 3], [4, 4]], L3, 3, 0.5, 3, 3)
    ok(r[0] == 3 and r[1] == 0, f'at full health it stays at full {r}')
    r = fly([[4, 1], [4, 2], [4, 3], [4, 4], [4, 5]], L3, 3, 0.5, 3, 3, pin='rotOnly')
    ok(r[0] == 1.5 and r[1] == 0, f'on a rotOnly monster a rotten one hurts by ROT_DMG 1.5 (3 -> 1.5), no knockback even from a bunch of 5 {r}')
    r = fly([[4, 2], [4, 3], [4, 4]], L3, 3, 0.5, 2, 3, pin='cleanOnly')
    ok(r[0] == 2 and r[1] == 0, f'on a cleanOnly monster a rotten one does nothing (no heal) {r}')
    # normal pumpkins on a rotOnly monster: no damage, used up there (a ghoul behind it is untouched), Grey's pierce stops too
    GREEN = "() => { const g = window.__gg; g.grid.forEach(row => row.forEach((c, i) => { if (!(c && c.gourd)) row[i] = null; })); for (const c of [2, 3, 4]) g.grid[4][c] = g.newCell(0); g.resolveMatches(); g.launchGroup(g.grid[4][3]); }"
    r = fly([], GREEN, 3, 0.5, 3, 3, pin='rotOnly', behind=0.3)
    ok(r[0] == 3 and r[2] == 3 and r[3] == 0, f'a green on a rotOnly monster: no damage, used up (the ghoul behind untouched) {r}')
    GREY = GREEN.replace('g.newCell(0)', 'g.newCell(4)')
    r = fly([], GREY, 3, 0.5, 3, 3, pin='rotOnly', behind=0.3)
    ok(r[0] == 3 and r[2] == 3, f'a Grey on a rotOnly monster stops there too (no pierce) {r}')
    r = fly([], GREEN, 3, 0.5, 3, 3, pin='cleanOnly')
    ok(r[0] == 2, f'a green on a cleanOnly monster hurts as usual {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_rot_area(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { const s = window.__gg.save; s.lv.black = 5; s.lv.blue = 5; }")
    two_gourds(page)
    PR = "(t, lane) => ({ x:window.__gg.LANE(lane), y:300, vy:-900, type:t, vis:t, lv:5, guar:false, lane, hitWalls:new Set(), grp:{ spawned:false, small:false, kills:0 }, size:1, hit:new Set(), trail:[], r:16, dead:false })"

    def area(t, rot_lane, ctl_lane):
        rot_reset(page)
        tgt = page.evaluate(GHOUL, [3, 0.5, 100, 100]); ro = page.evaluate(GHOUL, [rot_lane, 0.5, 100, 100]); ctl = page.evaluate(GHOUL, [ctl_lane, 0.5, 100, 100])
        page.evaluate(f"() => ({PIN})(window.__ms[{ro}], 'rotOnly')")
        return page.evaluate(f"() => {{ const g = window.__gg, ms = window.__ms; ms.forEach(m => m.kb = 0); g.hitMonster(({PR})({t}, 3), ms[{tgt}]); return [ms[{tgt}].hp < 100, ms[{ro}].hp, ms[{ro}].kb, ms[{ctl}].hp < 100]; }}")
    r = area(7, 2, 4)
    ok(r == [True, 100, 0, True], f'a level-5 Black splash leaves the rotOnly monster beside it untouched (no damage, no knockback), hurts the control {r}')
    r = area(8, 2, 5)
    ok(r == [True, 100, 0, True], f'a level-5 Deep Blue chain skips the rotOnly monster and strikes the control {r}')
    # burn and a mine: through damage(), which refuses a rotOnly monster anything but a rotten hit
    rot_reset(page)
    ro = page.evaluate(GHOUL, [2, 0.5, 100, 100]); ctl = page.evaluate(GHOUL, [3, 0.5, 100, 100])
    page.evaluate(f"() => ({PIN})(window.__ms[{ro}], 'rotOnly')")
    page.evaluate("() => { for (const m of window.__ms){ m.burnLeft = 3; m.burnAmt = 1; m.burnTick = 0.05; } }")
    time.sleep(1.2)
    r = page.evaluate(f"() => [window.__ms[{ro}].hp, window.__ms[{ctl}].hp < 100]")
    ok(r == [100, True], f'burning: the rotOnly monster takes nothing, the control burns {r}')
    page.evaluate("() => { const ms = window.__ms; ms.forEach(m => { m.hp = 100; m.burnLeft = 0; }); window.__gg.G.mines.push({ lane:2, p:0.5, t:99, dead:false }); }")
    time.sleep(0.3)
    r = page.evaluate(f"() => [window.__gg.G.mines.length, window.__ms[{ro}].hp, window.__ms[{ctl}].hp < 100]")
    ok(r == [0, 100, True], f'a mine blast: the rotOnly monster takes nothing, the control does {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_protector_break_rainbow(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    two_gourds(page)
    r = page.evaluate("""() => { const g = window.__gg; g.grid[1][4] = g.newCell(g.ROTTEN); g.grid[3][6] = g.newCell(g.ROTTEN); g.grid[1][6] = g.newCell(0);
      g.grid[0][3] = g.newCell(0); g.rotCell(0, 3); g.resolveMatches(); g.destroyGourd(g.grid[2][5]);
      return [g.grid[1][4].c === g.RAINBOW, g.grid[3][6].c === g.RAINBOW, g.isRotten(g.grid[0][3]), g.grid[1][6].c, g.gourdPos('protector')]; }""")
    ok(r == [True, True, True, 0, None], f'breaking the Protector turns the two rotten in its square into Rainbows; the one outside stays rotten; a green stays green {r}')
    time.sleep(0.4)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_rot_continue(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    two_gourds(page)
    page.evaluate("""() => { const g = window.__gg; for (const [r, c] of [[0, 0], [4, 6], [0, 3]]){ g.grid[r][c] = g.newCell(1); g.rotCell(r, c); } g.grid[1][4] = g.newCell(g.ROTTEN); g.resolveMatches();
      const c = g.continueState(); window.__snap = JSON.parse(JSON.stringify(c.rot)); g.continueNight(c); }""")
    time.sleep(0.3)
    snap = page.evaluate("() => window.__snap")
    ok(sorted(snap) == [[0, 0], [0, 3], [1, 4], [4, 6]], f'the snapshot lists the rotten cells {snap}')
    r = page.evaluate("() => { const g = window.__gg, out = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (g.isRotten(g.grid[r][c])) out.push([r, c]); return [g.G.continued, out]; }")
    ok(r == [True, [[0, 0], [0, 3], [1, 4], [4, 6]]], f'the continued night has the same rotten cells (one slid into the Protector square too) {r}')
    ok(page.evaluate("() => window.__gg.gourdsOn().map(o => o.kind)") == ['grave', 'protector'], 'and both gourds')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_rot_cell': check_rot_cell, 'check_rot_bunch': check_rot_bunch, 'check_rot_hit': check_rot_hit, 'check_rot_area': check_rot_area,
               'check_protector_break_rainbow': check_protector_break_rainbow, 'check_rot_continue': check_rot_continue})


# ---------- Task 4: poison fog on the patch ----------
# A quiet N2-1 with every cell a pumpkin (a 2-colour checker: no bunch of three; N2-1's gourd is cleared), nothing spawning or sprouting, no fog scheduled.
PQ = """() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.projs.length = 0; G.drops.length = 0;
  if (G.fires) G.fires.length = 0; G.fmNext = 99; G.fireTrickleT = 1e9; g.graves.forEach(r => r.fill(false)); G.def.poison = null; G.poison.t = 1e9; G.poison.warn = G.poison.on = null;
  g.grid.forEach(row => row.fill(null));
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) g.grid[r][c] = g.newCell((r + c) % 2); g.resolveMatches(); }"""
ROTTEN_CELLS = "() => { const g = window.__gg, out = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (g.isRotten(g.grid[r][c])) out.push([r, c]); return out; }"


def poison_page(quiet=True):
    def go(browser, url):
        page, errors = open_page(browser, url)
        nm2_start(page, 1); time.sleep(0.3)
        if quiet: page.evaluate(PQ)
        return page, errors
    return go


def check_poison_cycle(browser, url):
    if not R5: return
    page, errors = poison_page()(browser, url)
    page.evaluate("() => { const G = window.__gg.G; G.def.poison = { every:4, lines:[1, 1], dirs:['row'], dur:3 }; G.poison.t = 4; }")
    t0 = time.time(); warn = on = off = None; row = None; seen = []; dirs = None
    while time.time() - t0 < 9:
        s = page.evaluate("() => { const p = window.__gg.G.poison; return [!!p.warn, p.on ? p.on.idx.slice() : null, p.on ? p.on.dir : null]; }")
        now = time.time() - t0
        if s[0] and warn is None: warn = now
        if s[1] and on is None: on = now; row = s[1]; seen = page.evaluate(ROTTEN_CELLS); dirs = s[2]
        if on is not None and not s[1] and off is None: off = now
        if off is not None: break
        time.sleep(0.04)
    ok(warn is not None and abs(warn - 2.5) < 0.45, f'the arrows show at 2.5 s ({warn})')
    ok(on is not None and abs(on - 4.0) < 0.45, f'the fog lies from 4 s ({on})')
    ok(off is not None and 6.6 < off < 7.5, f'the fog is gone by 7 s ({off})')
    ok(row is not None and len(row) == 1 and dirs == 'row', f'one row, as dirs and lines say {row} {dirs}')
    if row:
        ok(all(r == row[0] for r, _ in seen), f'the moment it settles only that row is rotten {seen}')
        after = page.evaluate(ROTTEN_CELLS)
        ok(sorted(after) == [[row[0], c] for c in range(7)], f'every pumpkin of the row is rotten and no other {after}')
    ok(page.evaluate("() => window.__gg.G.poison.on === null && window.__gg.G.poison.warn === null"), 'warning and fog both cleared')
    # after it lifts the clock runs again from `every`: no new warning in the first second
    page.evaluate("() => { window.__gg.G.def.poison = null; }")
    time.sleep(0.3)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_poison_lines(browser, url):
    """lines [2, 2] with both directions: two distinct rows or columns; fogged(r, c) reads the lying fog; poisonNow refuses while one runs."""
    if not R5: return
    page, errors = poison_page()(browser, url)
    seen = set()
    for _ in range(12):
        page.evaluate("() => { const G = window.__gg.G; G.poison.on = null; G.poison.warn = null; G.def.poison = { every:99, lines:[2, 2], dirs:['row', 'col'], dur:3 }; }")
        w = page.evaluate("() => { window.__gg.poisonNow(); const w = window.__gg.G.poison.warn; return [w.dir, w.idx, w.t]; }")   # the call and the read in one evaluate: no frame in between
        seen.add(w[0])
        ok(len(w[1]) == 2 and w[1][0] != w[1][1] and all(0 <= i < (5 if w[0] == 'row' else 7) for i in w[1]), f'two distinct in-range {w[0]}s {w[1]}')
    ok(seen == {'row', 'col'}, f'both directions turn up over 12 fogs {seen}')
    ok(page.evaluate("() => window.__gg.poisonNow()") is False, 'poisonNow is refused while a warning runs')
    page.evaluate("() => { const p = window.__gg.G.poison; p.warn = null; p.on = { dir:'col', idx:[2, 5], flow:1, t:3, dur:3, age:0 }; }")
    f = page.evaluate("() => { const g = window.__gg; return [g.fogged(0, 2), g.fogged(4, 5), g.fogged(0, 3), g.fogged(2, 0)]; }")
    ok(f == [True, True, False, False], f'fogged() reads the columns under the fog {f}')
    ok(page.evaluate("() => window.__gg.poisonNow()") is False, 'poisonNow is refused while the fog lies')
    page.evaluate("() => { const p = window.__gg.G.poison; p.on = null; }")
    ok(page.evaluate("() => window.__gg.fogged(0, 2)") is False, 'no fog, nothing fogged')
    # a custom line set, level dur used
    page.evaluate("() => { window.__gg.G.def.poison = { every:99, lines:[1, 1], dirs:['row'], dur:2 }; }")
    r = page.evaluate("() => { const lit = window.__gg.poisonNow({ dir:'col', idx:[0, 6] }), w = window.__gg.G.poison.warn; return [lit, w && [w.dir, w.idx, w.dur, w.t]]; }")   # one evaluate: no frame between the call and the read
    ok(r[0] is True, 'poisonNow takes a given line set')
    ok(r[1] == ['col', [0, 6], 2, 1.5], 'with the 1.5 s warning and the level\'s dur')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_poison_protect(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    two_gourds(page)
    page.evaluate(FULL)
    page.evaluate("() => { const g = window.__gg; g.G.poison.t = 1e9; g.poisonNow({ dir:'row', idx:[2] }); }")
    time.sleep(2.0)
    r = page.evaluate(ROTTEN_CELLS)
    ok(r == [[2, 0], [2, 2], [2, 3]], f'a row through the Protector: only (2,0), (2,2), (2,3) rot; the Grave Gourd, the Protector and its square do not {r}')
    ok(page.evaluate("() => window.__gg.gourdsOn().map(o => o.kind)") == ['grave', 'protector'], 'both gourds stand')
    page.evaluate("() => { const g = window.__gg, p = g.G.poison; p.on = null; g.poisonNow({ dir:'col', idx:[5] }); }")
    time.sleep(2.0)
    r = page.evaluate(ROTTEN_CELLS)
    ok(r == [[0, 5], [2, 0], [2, 2], [2, 3], [4, 5]], f'a column through it: rows 0 and 4 rot, (1,5) (2,5) (3,5) do not {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_protector_break_fog(browser, url):
    """Controller ruling (final review): a Protector broken while a fog lies over its square spares the square until that fog lifts (its new Rainbows
    and the other pumpkins there stay clean); the next fog rots them as usual."""
    if not R5: return
    page, errors = open_page(browser, url)
    two_gourds(page)
    page.evaluate(FULL)
    SQR = "() => [[1, 4], [1, 5], [1, 6], [2, 4], [2, 6], [3, 4], [3, 5], [3, 6]].map(([r, c]) => { const x = window.__gg.grid[r][c]; return x ? (window.__gg.isRotten(x) ? 'rot' : x.c === window.__gg.RAINBOW ? 'rb' : 'ok') : null; })"
    page.evaluate("""() => { const g = window.__gg, G = g.G; G.def.poison = null; G.poison.t = 1e9; G.poison.warn = G.poison.on = null;
      g.grid[1][4] = g.newCell(g.ROTTEN); g.grid[3][6] = g.newCell(g.ROTTEN); g.resolveMatches(); g.poisonNow({ dir:'row', idx:[1, 2, 3] }); }""")
    ok(wait_for(page, "() => !!window.__gg.G.poison.on", 10), 'a fog lies over rows 1-3, the whole Protector square')
    page.evaluate("() => { window.__gg.G.poison.on.t = 60; }"); time.sleep(0.4)
    r = page.evaluate(SQR)
    ok(r == ['rot', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'rot'], f'under the fog the square stays clean but for the two rotten placed there {r}')
    ok(page.evaluate("() => window.__gg.isRotten(window.__gg.grid[2][3])"), 'outside the square the fog rots')
    r = page.evaluate(f"() => {{ const g = window.__gg; g.destroyGourd(g.grid[2][5]); return [g.gourdPos('protector'), ({SQR})()]; }}")
    ok(r[0] is None and r[1] == ['rb', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'rb'], f'breaking the Protector under the fog: the two rotten turn Rainbow {r}')
    time.sleep(1.0)
    r = page.evaluate(SQR)
    ok(r == ['rb', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'rb'], f'a second later, the fog still lying, the Rainbows and the other pumpkins of the square are not rotten {r}')
    ok(page.evaluate("() => !!window.__gg.G.poison.on && !window.__gg.isProtected(2, 4)"), '(the fog still lies, and nothing protects the square any more)')
    page.evaluate("() => { window.__gg.G.poison.on.t = 0.05; }"); time.sleep(0.4)
    r = page.evaluate(f"() => [window.__gg.G.poison.on, ({SQR})()]")
    ok(r[0] is None and r[1] == ['rb', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'rb'], f'the fog lifts: the square is still clean {r}')
    page.evaluate("() => { window.__gg.poisonNow({ dir:'row', idx:[1, 2, 3] }); }")
    ok(wait_for(page, "() => !!window.__gg.G.poison.on", 10), 'the next fog lies over the same rows')
    time.sleep(0.4)
    r = page.evaluate(f"() => [window.__gg.G.poison.on.spared || null, ({SQR})()]")
    ok(r[0] is None and r[1] == ['rot'] * 8, f'the next fog (started after the break) rots the whole square, Rainbows included {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_poison_landing(browser, url):
    if not R5: return
    page, errors = poison_page()(browser, url)
    # slide: (2,2) up into the fogged row 1 (a grave on (0,2) stops it there)
    page.evaluate("""() => { const g = window.__gg; g.grid[1][2] = null; g.graves[0][2] = true; g.grid[0][2] = null; g.resolveMatches();
      g.poisonNow({ dir:'row', idx:[1] }); }""")
    time.sleep(1.8)
    ok(page.evaluate("() => window.__gg.fogged(1, 3)"), 'the fog lies on row 1')
    r = page.evaluate("""async () => { const g = window.__gg, cell = g.grid[2][2]; window.__x = cell; g.slideOne(cell, 'up');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return [g.grid[1][2] === cell, g.isRotten(cell), Math.abs(cell.ox) + Math.abs(cell.oy) > 6]; }""")
    ok(r == [True, False, True], f'mid-slide into the fog it is not rotten yet {r}')
    time.sleep(0.8)
    ok(page.evaluate("() => window.__gg.isRotten(window.__x) && window.__gg.grid[1][2] === window.__x"), 'once it lands it is rotten')
    # sprout: the only empty cell is in the fogged row
    page.evaluate("() => { const g = window.__gg; g.grid[1][5] = null; g.resolveMatches(); g.grid[1][5] = null; window.__n = g.spawnSprouts(); }")
    time.sleep(0.3)
    ok(page.evaluate("() => window.__n === true && window.__gg.isRotten(window.__gg.grid[1][5])"), 'a pumpkin sprouting into the fog is rotten')
    # drop: collected into the fogged cell flies in (not rotten while flying), rotten on landing
    page.evaluate("() => { window.__gg.grid[1][5] = null; }")
    r = page.evaluate("""async () => { const g = window.__gg; g.collectDrop({ x:g.LANE(5), y:640, c:0, t:1, life:7, ph:0, dead:false });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const cell = g.grid[1][5]; return [!!cell, cell && cell.fly > 0, cell && g.isRotten(cell)]; }""")
    ok(r == [True, True, False], f'a dropped pumpkin in flight is not rotten {r}')
    time.sleep(1.0)
    ok(page.evaluate("() => window.__gg.isRotten(window.__gg.grid[1][5])"), 'it is rotten once it has landed')
    # and a pumpkin outside the fog stays clean
    ok(page.evaluate("() => !window.__gg.isRotten(window.__gg.grid[3][3]) && !window.__gg.isRotten(window.__gg.grid[2][5]) && !window.__gg.isRotten(window.__gg.grid[0][5])"), 'cells outside the fogged row are untouched')
    # the fog lifts: a pumpkin sliding in afterwards is not rotted
    page.evaluate("() => { window.__gg.G.poison.on = null; const g = window.__gg; g.grid[1][4] = null; g.resolveMatches(); }")
    page.evaluate("() => { const g = window.__gg; g.slideOne(g.grid[3][4], 'up'); }")
    time.sleep(0.8)
    ok(page.evaluate("() => !window.__gg.isRotten(window.__gg.grid[1][4]) && window.__gg.grid[1][4] !== null"), 'with the fog gone, a landing pumpkin stays clean')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_poison_continue(browser, url):
    if not R5: return
    page, errors = poison_page()(browser, url)
    page.evaluate("() => { const G = window.__gg.G; G.def.poison = { every:30, lines:[1, 1], dirs:['row'], dur:3 }; G.poison.t = 17; }")
    page.evaluate("() => { const g = window.__gg; g.continueNight(g.continueState()); }"); time.sleep(0.3)
    t = page.evaluate("() => window.__gg.G.poison.t")
    ok(17 - 0.8 < t <= 17, f'G.poison.t survives a continue ({t})')
    # a fog lying at the loss is not lying after it (the rot it made stays)
    nm2_start(page, 1); time.sleep(0.3); page.evaluate(PQ)
    page.evaluate("() => { const g = window.__gg, G = g.G; G.def.poison = { every:30, lines:[1, 1], dirs:['row'], dur:30 }; G.poison.t = 1e9; g.poisonNow({ dir:'row', idx:[1] }); }")
    time.sleep(1.9)
    ok(page.evaluate("() => !!window.__gg.G.poison.on"), 'the fog is lying before the loss')
    page.evaluate("() => { const g = window.__gg; window.__rot = g.grid.flat().filter(c => g.isRotten(c)).length; window.__snap = g.continueState().poison; g.continueNight(g.continueState()); }"); time.sleep(0.3)
    r = page.evaluate("() => { const p = window.__gg.G.poison; return [p.on, p.warn, window.__snap, window.__gg.grid.flat().filter(c => window.__gg.isRotten(c)).length]; }")
    ok(r[0] is None and r[1] is None, f'no fog and no warning after the continue {r[:2]}')
    ok(r[2] == 30 and r[3] == page.evaluate("() => window.__rot"), f'the clock restarts at every ({r[2]}) and the rot it made stays ({r[3]})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_poison_budget(browser, url):
    """Extends check_fire_budget: a fog line lying on the patch, or its warning arrows, adds at most 4 drawImage calls a frame and no fill or stroke."""
    if not R5: return
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillRect', 'fillText', 'strokeText', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; } })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm2_start(page, 1); time.sleep(3.2)
    page.evaluate(PQ); page.evaluate("() => { const g = window.__gg; for (let c = 0; c < 7; c++) g.grid[2][c] = null; for (let r = 0; r < 5; r++) g.grid[r][3] = null; g.resolveMatches(); }"); time.sleep(1.2)   # the lines are empty: nothing rots, so the frame differs only by the fog
    count = "() => new Promise(res => { window.__gg.G.idle = -1e9; window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 30) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.drawImage || 0) / 30, (c.fill || 0) / 30, (c.stroke || 0) / 30, ((c.fillRect || 0) + (c.fillText || 0) + (c.strokeText || 0) + (c.createRadialGradient || 0) + (c.createLinearGradient || 0)) / 30]); } }; requestAnimationFrame(tick); })"
    base = page.evaluate(count)
    page.evaluate("() => { window.__gg.G.def.poison = null; window.__gg.G.poison.t = 1e9; window.__gg.G.poison.warn = window.__gg.G.poison.on = null; window.__gg.poisonNow({ dir:'row', idx:[2] }); window.__gg.G.floats.length = 0; }")
    time.sleep(0.4)
    warn = page.evaluate(count)
    page.evaluate("() => { const p = window.__gg.G.poison; p.warn = null; p.on = { dir:'col', idx:[3], flow:1, t:60, dur:60, age:5 }; }")
    time.sleep(0.4)
    fog = page.evaluate(count)
    ok(warn[0] - base[0] <= 4.01, f'the warning arrows add at most 4 drawImage a frame ({base[0]:.1f} -> {warn[0]:.1f})')
    ok(fog[0] - base[0] <= 4.01, f'a fog line adds at most 4 drawImage a frame ({base[0]:.1f} -> {fog[0]:.1f})')
    for name, v in (('warning', warn), ('fog', fog)):
        ok(v[1] <= base[1] + 0.01 and v[2] <= base[2] + 0.01 and v[3] <= base[3] + 0.01, f'the {name} adds no fill, stroke, rect, text or gradient (fill {base[1]:.1f} -> {v[1]:.1f}, stroke {base[2]:.1f} -> {v[2]:.1f}, other {base[3]:.1f} -> {v[3]:.1f})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_poison_cycle': check_poison_cycle, 'check_poison_lines': check_poison_lines, 'check_poison_protect': check_poison_protect, 'check_protector_break_fog': check_protector_break_fog,
               'check_poison_landing': check_poison_landing, 'check_poison_continue': check_poison_continue, 'check_poison_budget': check_poison_budget})

# ---------- Task 5: the picker's second gourd slot, and the Protector tutorial on N2-5 ----------
SHOTS = '/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/266dc79e-66e5-4953-bf5d-71c03420a12e/scratchpad'
GPICK = """() => { const q = s => document.querySelector(s), r = e => e && e.getBoundingClientRect(), vis = e => !!e && e.offsetParent !== null && r(e).width > 0, head = q('#ovLoadout .loHead');
  const slots = [...document.querySelectorAll('#loGourdSlots .gslot')];
  return { state:window.__gg.state, title:q('#loTitle').textContent, count:q('#loCount').textContent, go:q('#bLoGo').disabled,
    tiles:[...document.querySelectorAll('#loGourds .pick')].map(b => [b.dataset.gourd, b.getAttribute('aria-pressed'), b.classList.contains('must')]),
    slots:slots.filter(vis).map(b => b.dataset.gourd || null), slotSize:slots.filter(vis).map(b => [Math.round(r(b).width), Math.round(r(b).height)]),
    slotMust:slots.filter(vis).map(b => b.classList.contains('must')), first:(q('#loGourdSlot') || {}).id || null,
    heading:(q('#loGourdSec h3') || {}).textContent || null, label:[...document.querySelectorAll('#ovLoadout .loHead .loLabel')].filter(vis).map(e => e.textContent),
    teamSlots:document.querySelectorAll('#loTeam .slot').length,
    headFits:head.scrollHeight <= head.clientHeight + 1, cardFits:(() => { const c = r(q('#ovLoadout .loCard')); return c.top >= 0 && c.bottom <= innerHeight + 1; })(),
    scrollH:Math.round(r(q('#loScroll')).height) }; }"""


def hollow_picker(page, gourds, night=1105):
    """Open the picker on a hollow night (N2-1 to N2-5 beaten or open) with the given gourds unlocked; both coaches marked seen."""
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 17)}, **{1100 + k: 3 for k in range(1, 5)}})
    page.evaluate("([gs, n]) => { const g = window.__gg; g.save.gourds = gs; g.save.perksOff = { pick4:true }; g.save.seenGourdCoach = true; g.save.seenProtectorCoach = true; document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); g.beginNight(n); }",
                  [{k: True for k in gourds}, night]); time.sleep(0.6)
    return page.evaluate(GPICK)


def check_picker_two_gourds(browser, url):
    """N2-5 offers both gourds once the Protector is unlocked: two tiles, two slots ("Your gourds"), both picked to start. A tile toggles its
    gourd, a tapped slot empties, Start works with 0, 1 or 2 gourds and the picked kinds (slot order) reach G.gourdKinds."""
    if not R5: return
    for h in (844, 664):
        page, errors = open_page(browser, url, h)
        u = hollow_picker(page, ['grave', 'protector'])
        ok(u['state'] == 'loadout' and u['tiles'] == [['grave', 'true', False], ['protector', 'true', False]], f'[{h}] N2-5: two gourd tiles, both picked, neither locked {u["tiles"]}')
        ok(u['slots'] == ['grave', 'protector'] and u['first'] == 'loGourdSlot', f'[{h}] two slots in the header, Grave then Protector {u["slots"]}')
        ok(u['label'] == ['Your team', 'Your gourds'] and u['heading'] == 'Gourds · pick up to 2', f'[{h}] "Your gourds" over the slots, "Gourds · pick up to 2" over the tiles {[u["label"], u["heading"]]}')
        ok('up to 2 gourds' in u['title'] and u['teamSlots'] == 5 and u['go'] is False, f'[{h}] the title asks for up to 2 gourds; 5 team slots; Start enabled {[u["title"], u["teamSlots"], u["go"]]}')
        ok(all(w >= 44 and hh >= 44 for w, hh in u['slotSize']) and not any(u['slotMust']), f'[{h}] each gourd slot is a 44 px touch target, not locked {u["slotSize"]}')
        ok(u['headFits'] and u['cardFits'] and u['scrollH'] >= 100, f'[{h}] the header fits and the card fits the screen {[u["headFits"], u["cardFits"], u["scrollH"]]}')
        if h == 844: page.screenshot(path=os.path.join(SHOTS, 'picker-two-gourds.png'))
        # the Protector's tile drops it, shows its card; the Grave stays in slot 1
        page.click('#loGourds .pick[data-gourd="protector"]'); time.sleep(0.2)
        v = page.evaluate(GPICK); det = page.evaluate("() => document.querySelector('#loDetail').textContent")
        ok(v['slots'] == ['grave', None] and v['tiles'][1][1] == 'false' and 'Protector Gourd' in det, f'[{h}] tapping the Protector tile drops it and shows its card {[v["slots"], det[:40]]}')
        if h == 844: page.screenshot(path=os.path.join(SHOTS, 'picker-one-gourd.png'))
        page.click('#loGourds .pick[data-gourd="protector"]'); time.sleep(0.2)
        ok(page.evaluate(GPICK)['slots'] == ['grave', 'protector'], f'[{h}] tapping it again picks it back')
        # a tapped slot empties; the rest close up, in the order picked
        page.click('#loGourdSlot'); time.sleep(0.2)
        v = page.evaluate(GPICK)
        ok(v['slots'] == ['protector', None] and v['tiles'][0][1] == 'false' and v['go'] is False, f'[{h}] tapping slot 1 drops the Grave; the Protector moves up; Start still enabled {v["slots"]}')
        page.click('#loGourds .pick[data-gourd="grave"]'); time.sleep(0.2)
        ok(page.evaluate(GPICK)['slots'] == ['protector', 'grave'], f'[{h}] the Grave picked again goes in the free slot (slot order Protector, Grave)')
        # no gourd at all: Start is never blocked by an empty gourd slot
        for sel in ('#loGourdSlot', '#loGourdSlot'): page.click(sel); time.sleep(0.15)
        v = page.evaluate(GPICK)
        ok(v['slots'] == [None, None] and v['go'] is False and 'gourd' in v['count'].lower(), f'[{h}] both slots empty: Start still enabled, the count line says no gourd {[v["slots"], v["go"], v["count"]]}')
        page.click('#bLoGo'); time.sleep(0.5)
        r = page.evaluate("() => [window.__gg.state, window.__gg.G.n, window.__gg.G.gourdKinds, window.__gg.gourdsOn().map(o => o.kind)]")
        ok(r == ['play', 1105, [], []], f'[{h}] Start with no gourd: N2-5 begins with none on the patch {r}')
        ok(not errors, f'[{h}] no page errors {errors[:2]}')
        page.close()
    # one gourd, and two in a chosen slot order, reach G.gourdKinds
    page, errors = open_page(browser, url)
    hollow_picker(page, ['grave', 'protector'])
    page.click('#loGourds .pick[data-gourd="grave"]'); time.sleep(0.15); page.click('#bLoGo'); time.sleep(0.5)
    r = page.evaluate("() => [window.__gg.G.gourdKinds, window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c])]")
    ok(r == [['protector'], [['protector', 2, 3]]], f'Start with the Protector alone: one gourd, in the centre {r}')
    if page.evaluate("() => window.__gg.RELEASE") >= 7:   # the picker remembers the last pick (owner 2026-11-09, Release 7 on)
        ok(page.evaluate("() => window.__gg.save.lastGourds") == ['protector'], 'the pick is remembered: the Protector alone')
        page.evaluate("() => { delete window.__gg.save.lastGourds; }")
    hollow_picker(page, ['grave', 'protector']); page.click('#bLoGo'); time.sleep(0.5)
    r = page.evaluate("() => [window.__gg.G.gourdKinds, window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c])]")
    ok(r == [['grave', 'protector'], [['grave', 2, 1], ['protector', 2, 5]]], f'Start with both: Grave at (2, 1), Protector at (2, 5) {r}')
    # the Protector not unlocked yet: N2-5 offers the Grave only, as a Release 4 night (one locked slot)
    u = hollow_picker(page, ['grave'])
    ok(u['tiles'] == [['grave', 'true', True]] and u['slots'] == ['grave'] and u['slotMust'] == [True], f'Protector locked: one Grave tile and one locked slot {u["tiles"]} {u["slots"]}')
    ok(u['label'] == ['Your team', 'Your gourd'] and u['heading'] == 'Gourd · pick 1' and u['title'].endswith('and 1 gourd'), f'and the Release 4 words {[u["label"], u["heading"], u["title"]]}')
    page.click('#bLoGo'); time.sleep(0.5)
    ok(page.evaluate("() => window.__gg.G.gourdKinds") == ['grave'], 'Start: only the Grave Gourd')
    # N2-1 offers every gourd won (owner 2026-11-09: any gourd on any nightmare night), both picked
    u = hollow_picker(page, ['grave', 'protector'], night=1101)
    ok([t[0] for t in u['tiles']] == ['grave', 'protector'] and u['slots'] == ['grave', 'protector'], f'N2-1 offers both gourds won, both picked {u["tiles"]}')
    u = hollow_picker(page, ['grave', 'protector'], night=1001)
    ok([t[0] for t in u['tiles']] == ['grave', 'protector'], f'so does N1-1, before the Grave Gourd\'s own night {u["tiles"]}')
    # the level preview stands the gourds the night will start with
    page.evaluate("() => { const g = window.__gg; g.save.gourds = { grave:true, protector:true }; document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); g.openPreview(1105); }"); time.sleep(0.5)
    r = page.evaluate("() => window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c])")
    ok(r == [['grave', 2, 1], ['protector', 2, 5]], f'the N2-5 preview shows both gourds where the night starts them {r}')
    page.evaluate("() => { const g = window.__gg; g.save.gourds = { grave:true }; g.openPreview(1105); }"); time.sleep(0.5)
    r = page.evaluate("() => window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c])")
    ok(r == [['grave', 2, 3]], f'without the Protector the preview shows the Grave in the centre {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_picker_r4_same(browser, url):
    """N1-5's picker is Release 4's with only the Grave won (from Release 5 a won Protector is offered there too, owner 2026-11-09; with
    the Grave alone it is one gourd tile, one locked slot under "Your gourd", "Gourd · pick 1")."""
    if MODE not in ('on', 'r4'): return
    page, errors = open_page(browser, url)
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 6)}})
    page.evaluate("() => { const g = window.__gg; g.save.gourds = g.RELEASE >= 5 ? { grave:true } : { grave:true, protector:true }; g.save.perksOff = { pick4:true }; g.save.seenGourdCoach = true; g.beginNight(1005); }"); time.sleep(0.6)
    u = page.evaluate("""() => { const q = s => document.querySelector(s), vis = e => !!e && e.offsetParent !== null;
      return [window.__gg.state, q('#loTitle').textContent, (q('#loGourdSec h3') || {}).textContent, [...document.querySelectorAll('#loGourds .pick')].map(b => [b.dataset.gourd, b.getAttribute('aria-pressed'), b.classList.contains('must')]),
        [...document.querySelectorAll('#ovLoadout .gslot')].filter(vis).map(b => [b.id, b.dataset.gourd, b.classList.contains('must')]), [...document.querySelectorAll('#ovLoadout .loHead .loLabel')].filter(vis).map(e => e.textContent), q('#bLoGo').disabled]; }""")
    ok(u[0] == 'loadout' and u[1] == 'Pick 5 pumpkins and 1 gourd' and u[2] == 'Gourd · pick 1', f'N1-5: the Release 4 title and heading {u[:3]}')
    ok(u[3] == [['grave', 'true', True]] and u[4] == [['loGourdSlot', 'grave', True]], f'one Grave tile, picked and locked; one locked slot {u[3]} {u[4]}')
    ok(u[5] == ['Your team', 'Your gourd'] and u[6] is False, f'"Your gourd" (singular); Start enabled {u[5:]}')
    page.screenshot(path=os.path.join(SHOTS, 'picker-n1-5.png'))
    page.click('#loGourdSlot'); time.sleep(0.2)
    v = page.evaluate("() => [document.querySelector('#loGourdSlot').dataset.gourd, document.querySelector('#loDetail').textContent]")
    ok(v[0] == 'grave' and 'Grave Gourd' in v[1], f'tapping the slot shows its card and never empties it {v[0]}')
    page.click('#bLoGo'); time.sleep(0.5)
    r = page.evaluate("() => [window.__gg.state, window.__gg.G.n, window.__gg.G.gourdKinds]")
    ok(r == ['play', 1005, ['grave']], f'Start begins N1-5 with the Grave Gourd only {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_protector_coach(browser, url):
    """The Protector tutorial on N2-5 (coach:'protector'): both gourds on a clear patch; a fog row through the Protector's square; the tip
    explains the shield; the fog rots the rest; the hand slides a rotten one into the square, then holds the Protector; breaking it turns that
    rot Rainbow; it grows back and the night carries on. Each step waits for what it shows. seenProtectorCoach is set at the end."""
    if not R5: return
    STEP = "(s) => { const g = window.__gg; for (let i = 0; i < Math.round(s / 0.05); i++) g.update(0.05); return g.G.coach ? g.G.coach.step : null; }"
    TIP = "() => document.querySelector('#coachTip').textContent"
    ROTC = "() => { const g = window.__gg, out = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (g.isRotten(g.grid[r][c])) out.push([r, c]); return out; }"
    page, errors = open_page(browser, url)
    page.evaluate("() => { const g = window.__gg; g.save.gourds = { grave:true, protector:true }; g.save.seenGourdCoach = true; g.save.seenProtectorCoach = false; }")
    page.evaluate("(lo) => window.__gg.startGame('story', 1105, lo, ['grave', 'protector'])", [0, 1, 2, 3, 4]); time.sleep(0.3)
    d = page.evaluate("() => { const g = window.__gg, w = g.G.poison.warn; return [g.G.coach && g.G.coach.kind, g.G.coach && g.G.coach.step, g.coachHolds(), g.gourdsOn().map(o => [o.kind, o.r, o.c]), w && [w.dir, w.idx], g.grid.flat().filter(x => x && !x.gourd).length]; }")
    ok(d[:3] == ['protector', 'pshield', True] and d[3] == [['grave', 2, 1], ['protector', 2, 5]], f'N2-5 with the tutorial unseen starts the Protector script, holding, both gourds standing {d[:4]}')
    ok(d[4] == ['row', [2]] and 0 < d[5] <= 12, f'a clear patch, and the fog warning lies on row 2, through the Protector\'s square {d[4:]}')
    ok('Protector Gourd' in page.evaluate(TIP) and 'never rot' in page.evaluate(TIP), f'the tip explains the shield {page.evaluate(TIP)[:60]!r}')
    ok(page.evaluate(STEP, 1.0) == 'pshield' and page.evaluate("() => [window.__gg.G.monsters.length, window.__gg.G.spawned]") == [0, 0], 'it waits for the fog: no monsters')
    ok(page.evaluate(STEP, 1.5) == 'prot', 'the fog settles: the script moves on')
    rot = page.evaluate(ROTC)
    prot = page.evaluate("() => { const g = window.__gg; let n = 0, r = 0; for (let a = 1; a <= 3; a++) for (let b = 4; b <= 6; b++){ const x = g.grid[a][b]; if (x && !x.gourd){ n++; if (g.isRotten(x)) r++; } } return [n, r]; }")
    ok(rot == [[2, 0], [2, 3]] and prot[0] >= 4 and prot[1] == 0, f'the fog rots the pumpkins on row 2 outside the square, none inside {rot} {prot}')
    ok('rot' in page.evaluate(TIP).lower(), f'the tip says the rest rotted {page.evaluate(TIP)[:60]!r}')
    ok(page.evaluate(STEP, 3.5) == 'pslide', 'then the hand shows a rotten one sliding into the square')
    mv = page.evaluate("() => { const c = window.__gg.G.coach; return c.move && [c.move.dir, c.move.tr, c.move.tc, window.__gg.isRotten(c.move.ref)]; }")
    ok(mv == ['right', 2, 4, True], f'the move: the rotten pumpkin at (2, 3) right into (2, 4) {mv}')
    ok(page.evaluate(STEP, 3) == 'pslide', 'it waits for the slide')
    page.evaluate("() => { const g = window.__gg, c = g.G.coach; g.slideOne(c.move.ref, c.move.dir); }")
    ok(page.evaluate(STEP, 0.4) == 'phold' and page.evaluate("() => window.__gg.isRotten(window.__gg.grid[2][4])"), 'the rotten one sits in the square: the hand holds the Protector')
    ok('hold' in page.evaluate(TIP).lower() and 'Rainbow' in page.evaluate(TIP), f'the hold tip names the Rainbows {page.evaluate(TIP)[:60]!r}')
    ok(page.evaluate(STEP, 3) == 'phold' and page.evaluate("() => !!window.__gg.gourdPos('protector')"), 'it waits for the player to break it')
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('protector'); g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(page.evaluate("() => window.__gg.grid[2][4] && window.__gg.grid[2][4].c === window.__gg.RAINBOW"), 'breaking it turns the rotten one in its square Rainbow')
    ok(page.evaluate(STEP, 0.1) == 'pback' and 'Rainbow' in page.evaluate(TIP), f'the script says so and waits for it to grow back {page.evaluate(TIP)[:50]!r}')
    ok(page.evaluate(STEP, 4) == 'praise' and page.evaluate("() => !!window.__gg.gourdPos('protector')"), 'it grows back on a sprout; Nice')
    ok(page.evaluate("() => window.__gg.coachHolds()") is False, 'the praise step lets the night carry on')
    page.evaluate(STEP, 4)
    d = page.evaluate("() => [window.__gg.G.coach, window.__gg.save.seenProtectorCoach, window.__gg.G.poison.t > 5 && window.__gg.G.poison.t < 100]")
    ok(d == [None, True, True], f'the script ends, seenProtectorCoach is set, the level\'s fog clock runs again {d}')
    page.evaluate("() => { window.__gg.G.spawnTimer = 0; }"); page.evaluate(STEP, 0.5)
    ok(page.evaluate("() => window.__gg.G.spawned") > 0, 'monsters spawn after the tutorial')
    # seen: a plain N2-5
    page.evaluate("(lo) => window.__gg.startGame('story', 1105, lo, ['grave', 'protector'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    ok(page.evaluate("() => [window.__gg.G.coach, window.__gg.coachHolds()]") == [None, False], 'a player who has seen it gets a plain N2-5')
    # the Protector left out: no script, not marked seen; the Grave script does not start either
    page.evaluate("() => { window.__gg.save.seenProtectorCoach = false; window.__gg.save.seenGourdCoach = false; }")
    page.evaluate("(lo) => window.__gg.startGame('story', 1105, lo, ['grave'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    ok(page.evaluate("() => [window.__gg.G.coach, window.__gg.save.seenProtectorCoach]") == [None, False], 'N2-5 without the Protector: no script, still unseen')
    page.evaluate("() => { window.__gg.save.seenGourdCoach = true; }")
    # breaking it early skips to the respawn, and the script still ends
    page.evaluate("(lo) => window.__gg.startGame('story', 1105, lo, ['grave', 'protector'])", [0, 1, 2, 3, 4]); time.sleep(0.2)
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos('protector'); g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(page.evaluate(STEP, 0.1) == 'pback', 'breaking the Protector early jumps to the respawn step')
    ok(page.evaluate(STEP, 10) is None and page.evaluate("() => [window.__gg.save.seenProtectorCoach, !!window.__gg.gourdPos('protector')]") == [True, True], 'and it still finishes with the Protector back')
    time.sleep(0.4)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_picker_two_gourds': check_picker_two_gourds, 'check_picker_r4_same': check_picker_r4_same, 'check_protector_coach': check_protector_coach})


def check_same_gourd_flag(browser, url):
    """Fix round 1: ALLOW_SAME_GOURD (data/gourds.js) is a one-line switch. Flipped on at runtime (setAllowSameGourd): two Graves start on
    (2, 1) and (2, 5), both fill, crows spare both squares; breaking one leaves the other and the broken one alone comes back on the next
    sprout tick; two Protectors both protect; a continued night keeps both; the picker opens two slots for a one-kind offer. Then off again."""
    if not R5: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { const g = window.__gg; g.save.seenGourdCoach = true; g.save.seenProtectorCoach = true; g.save.gourds = { grave:true, protector:true }; }")
    ok(page.evaluate("() => { window.__gg.startGame('story', 1105, [0, 1, 2, 3, 4], ['grave', 'grave']); return window.__gg.G.gourdKinds; }") == ['grave'], 'flag off: two Graves fold into one')
    page.evaluate("() => window.__gg.setAllowSameGourd(true)")
    page.evaluate("(lo) => window.__gg.startGame('story', 1105, lo, ['grave', 'grave'])", [0, 1, 2, 3, 4]); time.sleep(0.3); page.evaluate(GQ)
    ok(page.evaluate("() => window.__gg.G.gourdKinds") == ['grave', 'grave'] and page.evaluate(GON) == [['grave', 2, 1], ['grave', 2, 5]], f'flag on: two Graves start on (2, 1) and (2, 5) {page.evaluate(GON)}')
    ok(page.evaluate("() => window.__gg.gourdsOn().map(o => o.id)") == ['grave', 'grave#2'], 'each has its own id')
    sq = page.evaluate("() => { const g = window.__gg; return [g.inGraveSquare(1, 0), g.inGraveSquare(3, 6), g.inGraveSquare(2, 3)]; }")
    ok(sq == [True, True, False], f'crows spare both Graves\' squares (inGraveSquare) {sq}')
    ok(page.evaluate("() => window.__gg.gourdFill()") == 16, 'the fill sprouts around both Graves (8 + 8 cells)')
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(row => row.forEach((c, i) => { if (!(c && c.gourd)) row[i] = null; })); g.destroyGourd(g.grid[2][5]); }")
    r = page.evaluate("() => { const g = window.__gg; return [g.gourdsOn().map(o => [o.id, o.r, o.c]), g.G.gourdDue, !!g.G.gourdDueOf['grave#2']]; }")
    ok(r == [[['grave', 2, 1]], False, True], f'breaking the second leaves the first standing; only the second is due {r}')
    page.evaluate("() => window.__gg.spawnSprouts()")
    r = page.evaluate("() => { const g = window.__gg; return [g.gourdsOn().map(o => o.id), g.gourdPos('grave'), g.G.gourdDue, !!g.G.gourdDueOf['grave#2']]; }")
    ok(r[0] == ['grave', 'grave#2'] or r[0] == ['grave#2', 'grave'], f'the next sprout tick brings the broken one back {r}')
    ok(r[1] == {'r': 2, 'c': 1} and r[2:] == [False, False], f"the other never moved (gourdPos('grave') is the night's first Grave); nothing is due {r}")
    page.evaluate("() => { const g = window.__gg, o = g.gourdsOn().find(o => o.id === 'grave'); g.destroyGourd(o.cell); }")
    r = page.evaluate("() => [window.__gg.gourdsOn().map(o => o.id), window.__gg.G.gourdDue]")
    ok(r == [['grave#2'], True], f'breaking the first: only it is due (G.gourdDue, as in Release 4) {r}')
    # a continued night keeps both: one standing, one due
    snap = page.evaluate("() => window.__gg.gourdSnapshot()")
    ok(len(snap) == 2 and snap[0]['due'] is True and snap[1]['due'] is False, f'the snapshot lists both, the first due {snap}')
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); g.continueNight(c); }"); time.sleep(0.3)
    r = page.evaluate("() => { const g = window.__gg; return [g.G.gourdKinds, g.gourdsOn().map(o => o.id), g.G.gourdDue, !!g.G.gourdDueOf['grave#2']]; }")
    ok(r == [['grave', 'grave'], ['grave#2'], True, False], f'continued: both kinds, the second standing, the first still due {r}')
    page.evaluate("() => { window.__gg.G.sproutT = -999; window.__gg.spawnSprouts(); }")
    ok(sorted(page.evaluate("() => window.__gg.gourdsOn().map(o => o.id)")) == ['grave', 'grave#2'], 'and the first sprout brings the first back')
    # two Protectors both protect
    page.evaluate("(lo) => window.__gg.startGame('story', 1105, lo, ['protector', 'protector'])", [0, 1, 2, 3, 4]); time.sleep(0.3); page.evaluate(GQ)
    ok(page.evaluate(GON) == [['protector', 2, 1], ['protector', 2, 5]], f'two Protectors start on (2, 1) and (2, 5) {page.evaluate(GON)}')
    pr = page.evaluate("() => { const g = window.__gg; g.grid[1][0] = g.newCell(0); g.grid[3][6] = g.newCell(1); g.grid[2][3] = g.newCell(2); return [g.isProtected(1, 0), g.isProtected(3, 6), g.isProtected(2, 3), g.rotCell(1, 0), g.rotCell(3, 6), g.rotCell(2, 3)]; }")
    ok(pr == [True, True, False, False, False, True], f'both squares are protected and refuse rot; the cell between is not {pr}')
    page.evaluate("() => { const g = window.__gg; g.destroyGourd(g.grid[2][1]); }")
    r = page.evaluate("() => { const g = window.__gg; return [g.gourdsOn().map(o => o.id), g.isProtected(1, 0), g.isProtected(3, 6), !!g.G.gourdDueOf.protector, !!g.G.gourdDueOf['protector#2']]; }")
    ok(r == [['protector#2'], False, True, True, False], f'breaking one: its square is open, the other still protects; only the broken one is due {r}')
    page.evaluate("() => window.__gg.spawnSprouts()")
    ok(sorted(page.evaluate("() => window.__gg.gourdsOn().map(o => o.id)")) == ['protector', 'protector#2'], 'and it comes back on the next sprout tick')
    # the picker: a night offering one kind opens two slots
    u = hollow_picker(page, ['grave'], night=1101)   # the Grave alone won: one kind offered
    ok(u['slots'] == ['grave', None] and u['tiles'] == [['grave', 'true', False]] and u['heading'] == 'Gourds · pick up to 2', f'N2-1 (Grave only) opens two slots with the flag on {u["slots"]} {u["heading"]}')
    page.click('#loGourds .pick[data-gourd="grave"]'); time.sleep(0.15)
    ok(page.evaluate(GPICK)['slots'] == ['grave', 'grave'], 'tapping the picked Grave fills the free slot with a second')
    page.click('#loGourds .pick[data-gourd="grave"]'); time.sleep(0.15)
    ok(page.evaluate(GPICK)['slots'] == ['grave', None], 'with both full, a tap drops one')
    page.click('#loGourds .pick[data-gourd="grave"]'); time.sleep(0.15); page.click('#bLoGo'); time.sleep(0.5)
    ok(page.evaluate("() => [window.__gg.G.gourdKinds, window.__gg.gourdsOn().map(o => [o.kind, o.r, o.c])]") == [['grave', 'grave'], [['grave', 2, 1], ['grave', 2, 5]]], 'Start: two Graves on the patch')
    page.evaluate("() => window.__gg.setAllowSameGourd(false)")
    u = hollow_picker(page, ['grave'], night=1101)
    ok(u['slots'] == ['grave'] and u['slotMust'] == [True], f'flag off again: N2-1 is back to one locked slot {u["slots"]}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_same_gourd_flag': check_same_gourd_flag})


# ---------- Task 6: Plague Doctor 2 and the Reaper ----------
R5_NAMES += ('rotdoctor',)
# A projectile as hitMonster takes it: type t (a pumpkin colour index, or g.ROTTEN), level 5, aimed up lane `lane`.
HIT_PR = "(t, lane) => ({ x:window.__gg.LANE(lane), y:300, vy:-900, type:t, vis:Math.max(t, 0), lv:5, guar:false, lane, hitWalls:new Set(), grp:{ spawned:false, small:false, kills:0 }, size:1, hit:new Set(), trail:[], r:16, dead:false })"
# A still monster of the given type with the given health; kept in window.__ms.
STILL = """([type, lane, p, hp]) => { const g = window.__gg, m = g.spawnMonster(type, lane, false, p); m.sp = 0; m.hp = hp; m.maxHp = hp; m.eat = 0;
  (window.__ms = window.__ms || []).push(m); return window.__ms.length - 1; }"""


def check_rotdoctor(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    nm2_start(page, 1); time.sleep(0.3); page.evaluate(PQ)
    page.evaluate("() => { window.__ms = []; }")
    d = page.evaluate("() => { const T = window.__gg.TYPES.rotdoctor; return T && [T.hp, T.sp, T.r, T.coins, T.eat, T.pts, T.drop]; }")
    ok(d == [4, 0.035, 22, 9, 0.5, 30, 2], f'rotdoctor data: hp 4, sp 0.035, r 22, coins 9, eat 0.5, pts 30, drop 2 {d}')
    ok(page.evaluate("() => window.__gg.MNAME.rotdoctor") == 'Plague Doctor 2' and 'rot' in page.evaluate("() => window.__gg.MINTRO.rotdoctor || ''").lower(), 'name and intro text')
    TP = page.evaluate("() => window.__gg.TILE_P()")
    dr = page.evaluate(STILL, ['rotdoctor', 3, 0.5, 4])
    a = page.evaluate(STILL, ['ghoul', 2, 0.5, 100])                       # beside it, same height
    b = page.evaluate(STILL, ['ghoul', 4, 0.5 + TP, 100])                  # one lane over, one tile ahead: still inside the 3x3
    far_l = page.evaluate(STILL, ['ghoul', 5, 0.5, 100])                   # two lanes away
    far_p = page.evaluate(STILL, ['ghoul', 3, 0.5 + 1.6 * TP, 100])        # same lane, more than 1.5 tiles ahead
    time.sleep(0.2)
    r = page.evaluate(f"() => [{dr}, {a}, {b}, {far_l}, {far_p}].map(i => window.__ms[i].rotOnly)")
    ok(r == [False, True, True, False, False], f'rotOnly: not the doctor, yes in its 3x3 (beside, a tile ahead), not two lanes away, not 1.6 tiles ahead {r}')
    hit = lambda t, lane, i: page.evaluate(f"() => {{ const g = window.__gg, m = window.__ms[{i}]; const h0 = m.hp; g.hitMonster(({HIT_PR})({t}, {lane}), m); return m.hp - h0; }}")
    ok(hit(0, 2, a) == 0, 'a normal pumpkin does nothing to a ghoul beside the doctor')
    ok(page.evaluate(f"() => window.__gg.G.projs.length >= 0 && window.__ms[{a}].hp") == 100, 'the ghoul keeps its health')
    ok(hit(page.evaluate("() => window.__gg.ROTTEN"), 2, a) == -1.5, 'a rotten pumpkin takes 1.5 off it')
    ok(hit(0, 5, far_l) < 0, 'a ghoul two lanes away takes normal damage')
    ok(hit(0, 3, far_p) < 0, 'a ghoul beyond the zone in the same lane takes normal damage')
    ok(hit(0, 3, dr) < 0, 'the doctor itself takes normal damage')
    # the zone is renewed every frame: gone with the doctor
    page.evaluate(f"() => {{ window.__gg.damage(window.__ms[{dr}], 100, '#fff'); }}")
    time.sleep(0.2)
    ok(page.evaluate(f"() => [window.__ms[{dr}].dead, window.__ms[{a}].rotOnly, window.__ms[{b}].rotOnly]") == [True, False, False], 'once the doctor is dead the zone is gone')
    # a frozen doctor still keeps its zone, and splash/burn cannot hurt a protected monster
    page.evaluate("() => { window.__ms = []; window.__gg.G.monsters.length = 0; }")
    dr = page.evaluate(STILL, ['rotdoctor', 3, 0.5, 4]); a = page.evaluate(STILL, ['ghoul', 2, 0.5, 100])
    page.evaluate(f"() => {{ window.__ms[{dr}].frozenT = 5; window.__ms[{a}].burnLeft = 3; window.__ms[{a}].burnAmt = 1; window.__ms[{a}].burnTick = 0.05; }}")
    time.sleep(1.0)
    r = page.evaluate(f"() => [window.__ms[{a}].rotOnly, window.__ms[{a}].hp]")
    ok(r == [True, 100], f'a frozen doctor still protects, and burning cannot hurt the protected ghoul {r}')
    time.sleep(0.3)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_rotdoctor_zone(browser, url):
    """The doctor's poison zone is a baked sprite: it adds at most one drawImage a frame and nothing live (no stroke, fill, rect, text or gradient)."""
    if not R5: return
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillRect', 'fillText', 'strokeText', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; } })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm2_start(page, 1); time.sleep(0.5); page.evaluate(PQ); page.evaluate("() => { window.__ms = []; }")
    count = "() => new Promise(res => { window.__gg.G.idle = -1e9; window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 30) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.drawImage || 0) / 30, (c.fill || 0) / 30, (c.stroke || 0) / 30, ((c.fillRect || 0) + (c.fillText || 0) + (c.strokeText || 0) + (c.createRadialGradient || 0) + (c.createLinearGradient || 0)) / 30]); } }; requestAnimationFrame(tick); })"
    page.evaluate(STILL, ['ghoul', 3, 0.5, 4])
    time.sleep(0.4); base = page.evaluate(count)
    page.evaluate("() => { window.__gg.G.monsters.length = 0; window.__ms = []; }")
    page.evaluate(STILL, ['rotdoctor', 3, 0.5, 4])
    time.sleep(0.4); zone = page.evaluate(count)
    ok(zone[0] - base[0] <= 1.01, f'the doctor and its zone add at most 1 drawImage over a ghoul ({base[0]:.1f} -> {zone[0]:.1f})')
    ok(zone[1] <= base[1] + 0.01 and zone[2] <= base[2] + 0.01 and zone[3] <= base[3] + 0.01, f'and nothing live (fill {base[1]:.1f} -> {zone[1]:.1f}, stroke {base[2]:.1f} -> {zone[2]:.1f}, other {base[3]:.1f} -> {zone[3]:.1f})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_reaper(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    nm2_start(page, 1); time.sleep(0.3); page.evaluate(PQ)
    page.evaluate("() => { window.__ms = []; }")
    d = page.evaluate("() => { const T = window.__gg.TYPES.reaper; return T && [T.hp, T.sp, T.r, T.coins, T.eat, T.pts, T.drop, T.show, T.hide, T.reap]; }")
    ok(d == [3, 0.07, 21, 9, 0.5, 28, 2, 3, 4, True], f'reaper data: hp 3, sp 0.07, r 21, coins 9, eat 0.5, pts 28, drop 2, show 3, hide 4, reap {d}')
    ok(page.evaluate("() => window.__gg.MNAME.reaper") == 'Reaper' and 'reaper' in page.evaluate("() => window.__gg.MINTRO.reaper || ''").lower(), 'name and intro text')
    # the fade cycle: shown 3 s, hidden 4 s
    i = page.evaluate(STILL, ['reaper', 3, 0.3, 3])
    # timed in game seconds (m.age), not wall time, so a slow machine cannot skew it; poll until both changes are seen
    page.evaluate(f"() => {{ const m = window.__ms[{i}]; window.__tr = []; clearInterval(window.__ti); const t0 = m.age; let last = m.hidden; window.__ti = setInterval(() => {{ if (m.hidden !== last){{ last = m.hidden; window.__tr.push([m.hidden, m.age - t0]); }} }}, 10); }}")
    for _ in range(60):
        time.sleep(0.5)
        if page.evaluate("() => window.__tr.length") >= 2: break
    tr = page.evaluate("() => window.__tr")
    ok(len(tr) >= 2 and tr[0][0] is True and tr[1][0] is False and 2.7 < tr[0][1] < 3.4 and 3.4 < tr[1][1] - tr[0][1] < 4.6, f'shown ~3 s, then hidden ~4 s {tr}')
    page.evaluate("() => clearInterval(window.__ti)")
    # three normal hits kill it; a crow bursts out where it fell
    page.evaluate("() => { window.__gg.G.monsters.length = 0; window.__ms = []; }")
    i = page.evaluate(STILL, ['reaper', 4, 0.4, 3])
    r = []
    for _ in range(3):
        page.evaluate(f"() => window.__gg.damage(window.__ms[{i}], 1, '#fff')"); r.append(page.evaluate(f"() => window.__ms[{i}].dead"))
    ok(r == [False, False, True], f'it dies to 3 hits of 1 {r}')
    c = page.evaluate("() => window.__gg.G.monsters.filter(m => m.type === 'crow' && !m.dead).map(m => [m.lane, m.minion, Math.round(m.p * 100)])")
    ok(len(c) == 1 and c[0][:2] == [4, True] and 38 <= c[0][2] <= 46, f'a crow (a minion) appears in its lane where it fell (p 0.4) {c}')
    # at the fence: the swing wears down its fence and both neighbours, nothing else
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; window.__ms = []; for (const w of g.walls) w.hp = w.max; }")
    i = page.evaluate(STILL, ['reaper', 2, 1, 3]); page.evaluate(f"() => {{ window.__ms[{i}].eat = window.__gg.TYPES.reaper.eat; }}")
    time.sleep(4.0)
    w = page.evaluate("() => window.__gg.walls.map(w => +(w.max - w.hp).toFixed(2))")
    ok(abs(w[1] - 2) < 0.35 and abs(w[2] - 2) < 0.35 and abs(w[3] - 2) < 0.35 and w[0] == 0 and w[4] == 0 and w[5] == 0 and w[6] == 0, f'4 s at fence 3 takes about 2 off fences 2, 3 and 4 and nothing off the rest {w}')
    # frozen: no swing at all
    page.evaluate(f"() => {{ const g = window.__gg; for (const w of g.walls) w.hp = w.max; window.__ms[{i}].frozenT = 1.5; }}")
    time.sleep(1.0)
    w = page.evaluate("() => window.__gg.walls.map(w => +(w.max - w.hp).toFixed(2))")
    ok(sum(w) == 0, f'frozen, it does not swing {w}')
    # a fence at 0 in its own lane lets it through; the neighbours are not touched then
    page.evaluate(f"() => {{ const g = window.__gg; for (const w of g.walls) w.hp = w.max; window.__ms[{i}].frozenT = 0; g.walls[2].hp = 0; }}")
    time.sleep(0.5)
    r = page.evaluate(f"() => [window.__ms[{i}].p > 1.005, window.__gg.walls[1].hp === window.__gg.walls[1].max, window.__gg.walls[3].hp === window.__gg.walls[3].max]")
    ok(r == [True, True, True], f'a broken fence in its own lane lets it walk through {r}')
    # at the edge of the field it hits its fence and the one neighbour
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; window.__ms = []; g.G.over = false; for (const w of g.walls) w.hp = w.max; }")
    j = page.evaluate(STILL, ['reaper', 0, 1, 3]); page.evaluate(f"() => {{ window.__ms[{j}].eat = window.__gg.TYPES.reaper.eat; }}")
    time.sleep(2.0)
    w = page.evaluate("() => window.__gg.walls.map(w => +(w.max - w.hp).toFixed(2))")
    ok(w[0] > 0.7 and w[1] > 0.7 and sum(w[2:]) == 0, f'in lane 0 it hits fences 1 and 2 only {w}')
    # its chew frames are the reap swing, looping
    cl = page.evaluate("() => { const c = window.__gg.CHARS.reaper; if (!c) return null; const k = c.clips.chew; return [k.n, k.fps, !!k.once, JSON.stringify(k.pose(0.5)), Object.keys(c.clips).includes('walk')]; }")
    ok(cl == [10, 14, False, '{"reap":0.5}', True], f'the registry chew clip is the looping reap swing {cl}')
    ok(page.evaluate("() => !!window.__gg.CHARS.rotdoctor && Object.keys(window.__gg.CHARS.rotdoctor.clips).includes('walk')"), 'the rot doctor is drawn')
    time.sleep(0.3)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_rotdoctor': check_rotdoctor, 'check_rotdoctor_zone': check_rotdoctor_zone, 'check_reaper': check_reaper})


# ---------- Task 7: Fogwalker 2, Wisp Rider 2 and Poltergeist 2 ----------
R5_NAMES += ('fogwalker2', 'minipolt')
# A game-time recorder on monster window.__ms[i]: samples [age, p, dashing, eating, hidden, lane] about every 15 ms into window.__rec.
REC = """(i) => { const m = window.__ms[i]; window.__rec = []; clearInterval(window.__ri); window.__ri = setInterval(() => window.__rec.push([m.age, m.p, !!m.dashing, !!m.eating, !!m.hidden, m.lane]), 15); }"""
# The game canvas pixels around (lane, p): 56 x 60 logical units.
SNAP = """([lane, p]) => { const g = window.__gg, cv = document.querySelector('#cv'), k = cv.width / 540, x = Math.round((g.LANE(lane) - 28) * k), y = Math.round((g.fieldY(p) - 34) * k);
  return Array.from(cv.getContext('2d').getImageData(x, y, Math.round(56 * k), Math.round(60 * k)).data); }"""


def mad(a, b):
    return sum(abs(x - y) for x, y in zip(a, b)) / max(1, len(a))


def check_fogwalker2(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    nm2_start(page, 1); time.sleep(0.3); page.evaluate(PQ)
    page.evaluate("() => { window.__ms = []; }")
    d = page.evaluate("() => { const T = window.__gg.TYPES.fogwalker2, F = window.__gg.TYPES.fogwalker; return T && [T.hp, T.sp, T.r, T.coins, T.eat, T.pts, T.drop, T.band, F.band]; }")
    ok(d == [3, 0.045, 24, 9, 0.5, 28, 2, 0.12, 0.06], f'fogwalker2 data: hp 3, sp 0.045, r 24, coins 9, eat 0.5, pts 28, drop 2, band 0.12 (twice the Fogwalker\'s 0.06) {d}')
    ok(page.evaluate("() => window.__gg.MNAME.fogwalker2") == 'Fogwalker 2' and 'mossback' in page.evaluate("() => window.__gg.MINTRO.fogwalker2 || ''").lower(), 'name and intro text')
    tp = page.evaluate("() => window.__gg.TILE_P()")
    ok(1.6 < 2 * d[7] / tp < 2.4, f'its band is about two rows tall ({2 * d[7] / tp:.2f} rows)')
    # it arrives with a Mossback each side, as minions
    page.evaluate("() => { const g = window.__gg; window.__f = g.spawnMonster('fogwalker2', 3, false, 0.3); }")
    r = page.evaluate("() => window.__gg.G.monsters.filter(m => m !== window.__f).map(m => [m.type, m.lane, m.minion, Math.round(m.p * 100)]).sort((a, b) => a[1] - b[1])")
    ok(r == [['brute', 2, True, 30], ['brute', 4, True, 30]], f'two Mossback minions beside it at its height {r}')
    page.evaluate("() => { window.__gg.G.monsters.length = 0; window.__f = window.__gg.spawnMonster('fogwalker2', 0, false, 0.3); }")
    r = page.evaluate("() => window.__gg.G.monsters.filter(m => m !== window.__f).map(m => [m.type, m.lane, m.minion, Math.round(m.p * 100)]).sort((a, b) => a[1] - b[1])")
    ok(r == [['brute', 0, True, 23], ['brute', 1, True, 30]], f'at the field edge the missing side goes behind it, not off the field {r}')
    page.evaluate("() => { window.__gg.G.monsters.length = 0; window.__gg.spawnMonster('fogwalker2', 3, true, 0.3); }")
    ok(page.evaluate("() => window.__gg.G.monsters.length") == 1, 'a Fogwalker 2 that is itself a minion brings no Mossbacks (no chain)')
    # its fog hides monsters in both of its rows, not beyond; a Lantern shows them
    page.evaluate("() => { window.__gg.G.monsters.length = 0; window.__ms = []; }")
    f = page.evaluate(STILL, ['fogwalker2', 3, 0.5, 3])
    page.evaluate("() => { const ms = window.__gg.G.monsters; for (let i = ms.length - 1; i >= 0; i--) if (ms[i].type === 'brute') ms.splice(i, 1); }")   # keep only the walker: its Mossbacks would hide behind the same fog
    tp = page.evaluate("() => window.__gg.TILE_P()")
    spots = {'above': (1, 0.5 - 0.8 * tp), 'below': (5, 0.5 + 0.8 * tp), 'far': (1, 0.5 + 0.2 + 2.2 * tp)}
    ids = {k: page.evaluate(STILL, ['ghoul', l, p, 100]) for k, (l, p) in spots.items()}
    time.sleep(0.6)
    fog = {k: page.evaluate(SNAP, list(v)) for k, v in spots.items()}
    page.evaluate("() => { window.__gg.G.fogClear = 20; }")
    time.sleep(0.6)
    clear = {k: page.evaluate(SNAP, list(v)) for k, v in spots.items()}
    dif = {k: mad(fog[k], clear[k]) for k in spots}
    ok(dif['above'] > 30 and dif['below'] > 30 and dif['far'] < 12, f'a ghoul in the row above and the row below is hidden by the fog (the Lantern shows them), one beyond is not (pixel change {dif})')
    # a Lantern works with only a Fogwalker 2 on the field
    page.evaluate("() => { const g = window.__gg; g.G.fogClear = 0; g.save.lantern = 2; g.G.def.fog = []; }")
    page.evaluate("() => window.__gg.useLantern()")
    r = page.evaluate("() => [window.__gg.G.fogClear > 5, window.__gg.save.lantern]")
    ok(r == [True, 1], f'the Lantern lights when a Fogwalker 2 is the only fog {r}')
    # 3 health
    page.evaluate("() => { window.__gg.G.fogClear = 0; }")
    r = []
    for _ in range(3):
        page.evaluate(f"() => window.__gg.damage(window.__ms[{f}], 1, '#fff')"); r.append(page.evaluate(f"() => window.__ms[{f}].dead"))
    ok(r == [False, False, True], f'it takes 3 hits {r}')
    ok(page.evaluate("() => { const c = window.__gg.CHARS.fogwalker2; return c && ['walk', 'chew', 'exhale'].every(k => c.clips[k]); }"), 'it is drawn (walk, chew, exhale clips)')
    time.sleep(0.3)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


HITS = "(i) => { const g = window.__gg, m = window.__ms[i]; g.damage(m, 1, '#fff'); return [m.type, m.hp, m.dead, !!m.carrier]; }"


def check_fogwalker2_quest(browser, url):
    """N2-9's "Do not let fogwalkers reach the fence" counts a Fogwalker 2 (questAs:'fogwalker'); a ghoul does not."""
    if not R5: return
    page, errors = open_page(browser, url)
    nm2_start(page, 9); time.sleep(0.3); page.evaluate(PQ)
    ok(page.evaluate("() => window.__gg.questsFor(window.__gg.G.def).some(([t, p]) => t === 'noTouch' && p === 'fogwalker')"), "N2-9 has the quest ['noTouch', 'fogwalker']")
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; g.spawnMonster('ghoul', 1, false, 0.98); }"); time.sleep(0.8)
    r = page.evaluate("() => { const g = window.__gg, q = g.G.q; return [!!q.touched.ghoul, !!q.touched.fogwalker, g.QUEST_TYPES.noTouch.check({ q }, 'fogwalker').failed]; }")
    ok(r == [True, False, False], f'a ghoul at the fence does not fail it {r}')
    page.evaluate("() => { const g = window.__gg; g.G.monsters.length = 0; g.spawnMonster('fogwalker2', 3, false, 0.98); }"); time.sleep(0.8)
    r = page.evaluate("() => { const g = window.__gg, q = g.G.q; return [!!q.touched.fogwalker2, !!q.touched.fogwalker, g.QUEST_TYPES.noTouch.check({ q }, 'fogwalker').failed]; }")
    ok(r == [True, True, True], f'a Fogwalker 2 at the fence fails it, as a fogwalker {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_comet(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    nm2_start(page, 1); time.sleep(0.3); page.evaluate(PQ)
    page.evaluate("() => { window.__ms = []; }")
    d = page.evaluate("() => { const T = window.__gg.TYPES.comet; return T && [T.hp, T.sp, T.dashSp, T.cruise, T.r, T.coins, T.eat, T.pts, T.drop]; }")
    ok(d == [2, 0.06, 0.4, 2, 20, 8, 0.5, 26, 2], f'comet data: hp 2, sp 0.06, dashSp 0.4, cruise 2, r 20, coins 8, eat 0.5, pts 26, drop 2 {d}')
    ok(page.evaluate("() => window.__gg.MNAME.comet") == 'Wisp Rider 2' and 'streaks' in page.evaluate("() => window.__gg.MINTRO.comet || ''").lower(), 'name and intro text')
    # cruise, then dash to the fence without stopping, past a ghoul standing in its lane
    ghoul = page.evaluate(STILL, ['ghoul', 3, 0.55, 100])
    c = page.evaluate("() => { const m = window.__gg.spawnMonster('comet', 3, false, 0.02); (window.__ms = window.__ms || []).push(m); return window.__ms.length - 1; }")
    page.evaluate(REC, c)
    for _ in range(120):
        time.sleep(0.25)
        if page.evaluate(f"() => window.__ms[{c}].eating"): break
    page.evaluate("() => clearInterval(window.__ri)")
    rec = page.evaluate("() => window.__rec")
    dash0 = next((r for r in rec if r[2]), None)
    ok(dash0 is not None and 1.6 < dash0[0] < 2.6, f'it cruises about 2 s on the field, then dashes (dash at age {dash0 and round(dash0[0], 2)})')
    cr = [r for r in rec if not r[2] and r[1] > 0.03]
    ok(len(cr) > 3 and (cr[-1][1] - cr[0][1]) / max(1e-6, cr[-1][0] - cr[0][0]) < 0.1, 'it cruises at the slow pace before the dash')
    dr = [r for r in rec if r[2] and not r[3]]
    win = [dr[0]] if dr else []   # samples at least 0.1 game seconds apart (a frame is 0.017 s)
    for r in dr[1:]:
        if r[0] - win[-1][0] >= 0.1: win.append(r)
    speeds = [(b[1] - a[1]) / (b[0] - a[0]) for a, b in zip(win, win[1:])]
    ok(len(speeds) > 5 and min(speeds) > 0.2 and sum(speeds) / len(speeds) > 0.3, f'it dashes without stopping (min {min(speeds, default=0):.2f}, mean {sum(speeds) / max(1, len(speeds)):.2f} of the field a second)')
    ok(page.evaluate(f"() => [window.__ms[{c}].eating, window.__ms[{c}].p, window.__ms[{ghoul}].dead]") == [True, 1, False], 'it ran past the ghoul standing in its lane and reached the fence (p 1) to chew')
    # the first hit breaks the wisp: a plain Wisp (a minion) and a walking Imp; health kept
    page.evaluate("() => { window.__gg.G.monsters.length = 0; window.__ms = []; window.__gg.walls.forEach(w => { w.hp = w.max; }); }")
    c = page.evaluate(STILL, ['comet', 4, 0.5, 2]); page.evaluate(f"() => {{ window.__ms[{c}].cruiseT = 1e9; }}")
    r = page.evaluate(HITS, c)
    ok(r == ['imp', 2, False, False], f'the first hit breaks the wisp and does no damage: the rider walks on as an Imp {r}')
    w = page.evaluate(f"() => window.__gg.G.monsters.filter(m => m !== window.__ms[{c}]).map(m => [m.type, m.lane, m.minion, Math.round(m.p * 100)])")
    ok(w == [['wisp', 4, True, 50]], f'a plain Wisp minion is left at its height {w}')
    imp = page.evaluate(f"() => {{ const m = window.__ms[{c}]; return [m.dashing, m.r, m.sp > 0]; }}")
    r2 = [page.evaluate(HITS, c), page.evaluate(HITS, c)]
    ok(r2[0][2] is False and r2[1][2] is True, f'then it takes its 2 health in two hits {r2}')
    ok(not imp[0], 'the broken rider is not dashing')
    # a hit during the dash breaks it just the same, and the Imp walks (no longer dashes)
    page.evaluate("() => { window.__gg.G.monsters.length = 0; window.__ms = []; }")
    c = page.evaluate(STILL, ['comet', 2, 0.4, 2]); page.evaluate(f"() => {{ const m = window.__ms[{c}]; m.dashing = true; m.sp = 0.4; }}")
    page.evaluate(HITS, c)
    ok(page.evaluate(f"() => [window.__ms[{c}].type, window.__ms[{c}].dashing]") == ['imp', False], 'a dashing comet that is hit breaks and stops dashing')
    ok(page.evaluate("() => { const c = window.__gg.CHARS.comet; return c && ['walk', 'chew', 'dash'].every(k => c.clips[k]) && c.frame({ dashing:true, eating:false, frozenT:0, ph:0.3 }, c.clips)[0] === 'dash' && c.frame({ dashing:true, eating:true, frozenT:0, ph:0.3 }, c.clips) === null; }"), 'it is drawn with the dash clip while dashing, the chew clip at the fence')
    time.sleep(0.3)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_minipolt(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    nm2_start(page, 1); time.sleep(0.3); page.evaluate(PQ)
    page.evaluate("() => { window.__ms = []; }")
    d = page.evaluate("() => { const T = window.__gg.TYPES.minipolt; return T && [T.hp, T.sp, T.r, T.coins, T.eat, T.pts, T.drop, T.driftEvery, T.vanishEvery, T.vanishFor, T.rotEvery, T.rotN]; }")
    ok(d == [3, 0.04, 22, 9, 0.5, 28, 2, 5, 7, 2, 6, [1, 2]], f'minipolt data: hp 3, sp 0.04, r 22, coins 9, eat 0.5, pts 28, drop 2, driftEvery 5, vanishEvery 7, vanishFor 2, rotEvery 6, rotN [1, 2] {d}')
    ok(page.evaluate("() => window.__gg.MNAME.minipolt") == 'Poltergeist 2' and 'rotten' in page.evaluate("() => window.__gg.MINTRO.minipolt || ''").lower(), 'name and intro text')
    # a Protector Gourd in the middle: its square is never rotted
    page.evaluate("() => { const g = window.__gg; g.grid[2][3] = g.newGourd('protector'); g.resolveMatches(); }")
    m = page.evaluate(STILL, ['minipolt', 3, 0.3, 3])
    page.evaluate(REC, m)
    page.evaluate(f"() => {{ const m = window.__ms[{m}]; window.__rot = []; clearInterval(window.__rti); let last = 0; window.__rti = setInterval(() => {{ const k = ({ROTTEN_CELLS})().length; if (k !== last) {{ window.__rot.push([m.age, k - last]); last = k; }} }}, 15); }}")
    for _ in range(80):
        time.sleep(0.25)
        if page.evaluate(f"() => window.__ms[{m}].age") > 10: break
    page.evaluate("() => { clearInterval(window.__ri); clearInterval(window.__rti); }")
    rec, rot = page.evaluate("() => [window.__rec, window.__rot]")
    ok(len(rot) >= 1 and 5.9 < rot[0][0] < 7.6 and rot[0][1] in (1, 2), f'at about 6 s it rots 1-2 pumpkins (the cast tell lasts a moment first) {rot}')
    tr = [(a[0], b[4]) for a, b in zip(rec, rec[1:]) if a[4] != b[4]]
    ok(len(tr) >= 2 and tr[0][1] is True and tr[1][1] is False and 6.4 < tr[0][0] < 7.8 and 1.5 < tr[1][0] - tr[0][0] < 2.6, f'it vanishes at about 7 s for about 2 s and comes back {tr}')
    lanes = [(a[0], b[5]) for a, b in zip(rec, rec[1:]) if a[5] != b[5]]
    ok(len(lanes) >= 1 and abs(lanes[0][1] - 3) == 1 and 4.3 < lanes[0][0] < 6.5, f'it drifts one lane after about 5 s {lanes}')
    # hidden: nothing can hit it (the projectile test in game.js skips hidden monsters)
    hid = page.evaluate(f"() => window.__ms[{m}].hidden")
    # forced casts: 1-2 each, never inside the Protector's square (rows 1-3, columns 2-4)
    page.evaluate("() => { window.__gg.save.seenHelp = true; }")
    sizes = []
    for _ in range(7):
        n0 = len(page.evaluate(ROTTEN_CELLS))
        page.evaluate(f"() => {{ const m = window.__ms[{m}]; m.rotT = 0.01; }}")
        for _ in range(60):
            time.sleep(0.1)
            if len(page.evaluate(ROTTEN_CELLS)) != n0: break
        sizes.append(len(page.evaluate(ROTTEN_CELLS)) - n0)
    ok(all(x in (1, 2) for x in sizes), f'every cast rots 1 or 2 pumpkins {sizes}')
    cells = page.evaluate(ROTTEN_CELLS)
    ok(len(cells) >= 8 and not any(1 <= r <= 3 and 2 <= c <= 4 for r, c in cells), f'none of the {len(cells)} rotten pumpkins is in the Protector square {cells}')
    # killed during its cast: nothing rots
    n0 = len(page.evaluate(ROTTEN_CELLS))
    page.evaluate(f"() => {{ const m = window.__ms[{m}]; m.hidden = false; m.vanish = 100; m.rotT = 0.01; }}")
    for _ in range(40):
        time.sleep(0.05)
        if page.evaluate(f"() => window.__ms[{m}].castT > 0"): break
    ok(page.evaluate(f"() => window.__ms[{m}].castT > 0 && !!window.__ms[{m}].castCells"), 'it begins a cast (the tell)')
    page.evaluate(f"() => window.__gg.damage(window.__ms[{m}], 100, '#fff')")
    time.sleep(0.8)
    ok(len(page.evaluate(ROTTEN_CELLS)) == n0, 'killed during its cast, nothing rots')
    ok(page.evaluate("() => { const c = window.__gg.CHARS.minipolt; return c && ['walk', 'chew', 'toss'].every(k => c.clips[k]) && c.clips.toss.once; }"), 'it is drawn (walk, chew and the one-shot toss for the cast)')
    time.sleep(0.3)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_fogwalker2': check_fogwalker2, 'check_fogwalker2_quest': check_fogwalker2_quest, 'check_comet': check_comet, 'check_minipolt': check_minipolt})


# ---------- Task 8: the Lamplighter (mini boss, N2-4 and N2-13) ----------
R5_NAMES += ('lamplighter',)
LBOSS = "window.__gg.G.monsters.find(m => m.type === 'boss' && !m.dead)"
# A game-time log of the boss (window.__b) from now: mood changes [mood, t, flash > 0], lane changes [lane, t] and fog warnings [t, dir, n lines, dur, src]
# (src 'lamp' for the Lamplighter's call, 'level' for the level's own cycle),
# t in game seconds (G.t) since the log started, sampled every 10 ms. Also the highest p it reaches (window.__maxP).
LLOG = """() => { const g = window.__gg, G = g.G, b = window.__b; const t0 = G.t; window.__ml = []; window.__ll = []; window.__fl = []; window.__maxP = 0;
  let mood = b.mood, lane = b.lane, warn = null; clearInterval(window.__li);
  window.__li = setInterval(() => { const B = window.__b, P = window.__gg.G.poison; window.__maxP = Math.max(window.__maxP, B.p); window.__gg.G.spawnTimer = 999;
    if (B.mood !== mood){ mood = B.mood; window.__ml.push([mood, window.__gg.G.t - t0, B.flash > 0]); }
    if (B.lane !== lane){ lane = B.lane; window.__ll.push([lane, window.__gg.G.t - t0]); }
    if (P.warn && P.warn !== warn) window.__fl.push([window.__gg.G.t - t0, P.warn.dir, P.warn.idx.length, P.warn.dur, P.warn.src || 'level']);
    warn = P.warn; }, 10); }"""


def lamp_up(page, k, level_clock=None):
    """Start Nightmare 2-k, bring its boss in now, stop ordinary spawns and clear the field so only the boss acts, put it just short of hold and
    stretch the level's own fog clock out of reach (its dur stays), then start LLOG. With level_clock the level's poison cycle is kept as it is
    and its clock set to level_clock s instead. Returns [kind, hp, maxHp, mood, hold, form] or None."""
    nm2_start(page, k)
    page.evaluate("() => { const G = window.__gg.G; G.sproutT = -999; G.spawned = Math.ceil(G.def.total * 0.4); G.spawnTimer = 0; }")
    time.sleep(0.3)
    b = page.evaluate(f"""() => {{ const g = window.__gg, G = g.G, b = {LBOSS}; if (!b) return null;
      G.spawnTimer = 999; G.monsters.splice(0, G.monsters.length, b); b.p = b.hold - 0.01; window.__b = b;
      const lc = {'null' if level_clock is None else level_clock}; if (lc == null && G.def.poison) G.def.poison = {{ ...G.def.poison, every:1e9 }}; G.poison.t = lc == null ? 1e9 : lc; G.poison.warn = G.poison.on = null;
      return [b.kind, b.hp, b.maxHp, b.mood, b.hold, b.form]; }}""")
    if b: page.evaluate(LLOG)
    return b


def wait_for(page, js, limit=60):
    """Poll (every 0.25 s) until js is truthy, at most `limit` wall seconds; the machine is sometimes heavily loaded, so the checks time in game seconds."""
    for _ in range(int(limit * 4)):
        if page.evaluate(js): return True
        time.sleep(0.25)
    return False


# One hit of type t (a colour index or ROTTEN) on the boss and one plain damage() of 1 (a burn tick, splash or tool: not a rotten pumpkin), in one evaluate:
# [rotOnly, cleanOnly, hp change from the pumpkin, the float it showed, hp change from the plain damage]
LHIT = f"""(t) => {{ const g = window.__gg, b = window.__b, n0 = g.G.floats.length, h0 = b.hp; g.hitMonster(({HIT_PR})(t, b.lane), b);
  const f = g.G.floats.slice(n0).map(x => x.text).find(x => typeof x === 'string') || null, h1 = b.hp; b.lastHit = 0; g.damage(b, 1, '#fff');
  return [!!b.rotOnly, !!b.cleanOnly, +(h1 - h0).toFixed(2), f, +(b.hp - h1).toFixed(2)]; }}"""


def check_lamplighter(browser, url):
    if not R5: return
    page, errors = open_page(browser, url)
    d = page.evaluate("""() => { const T = window.__gg.TYPES.lamplighter; return T ? [T.boss, T.hp, T.r, T.sp, T.coins, T.eat, T.pts, T.drop, T.hold, T.moodEvery, T.driftEvery, T.fogEvery,
      T.noItems, T.form2.hp, T.form2.moodEvery] : null; }""")
    ok(d == [True, 24, 32, 0.03, 40, 0, 300, 6, 0.14, 8, 8, 12, True, 34, 6], f'Lamplighter data {d}')
    ok(page.evaluate("() => window.__gg.BOSS_NAMES.lamplighter") == 'The Lamplighter', 'its name on screen is "The Lamplighter"')
    intro = page.evaluate("() => window.__gg.BOSS_INTRO.lamplighter || null")
    ok(bool(intro) and 'rot' in intro['1'].lower() and '2' in intro, f'it has boss intro texts for both forms {intro and list(intro)}')
    L = page.evaluate("() => [3, 12].map(i => { const d = window.__gg.NIGHTMARE_LEVELS[1][i]; return d && [d.level, d.name, d.boss, d.bossForm, d.bossChest, d.unlockGourds, !!d.gourd, !!d.poison]; })")
    ok(L[0] == [4, 'The Lamplighter', 'lamplighter', 1, 'normal', ['protector'], True, True], f'N2-4: the Lamplighter, a normal chest, unlocks the Protector, a gourd night with poison {L[0]}')
    ok(L[1] is not None and L[1][:5] == [13, 'Lamplighter Returns', 'lamplighter', 2, 'normal'], f'N2-13: the Lamplighter in form 2, a normal chest {L[1]}')
    b = lamp_up(page, 4)
    ok(b is not None and b[0] == 'lamplighter' and b[1] == b[2] == 24 and b[3] == 'clean' and b[5] == 1, f'on N2-4 it arrives with 24 health in its clean mood {b}')
    if b is None:
        page.close(); return
    # clean mood first: normal pumpkins and plain damage hurt; a rotten one does nothing (no heal either)
    page.evaluate("() => { window.__b.hp = 20; }")
    R = page.evaluate("() => window.__gg.ROTTEN")
    r = page.evaluate(LHIT, R)
    ok(r[:2] == [False, True] and r[2] == 0 and r[4] == -1, f'clean mood: cleanOnly; a rotten pumpkin does nothing (no heal); plain damage hurts {r}')
    r = page.evaluate(LHIT, 0)
    ok(r[2] < 0, f'clean mood: a green hurts {r}')
    # the mood flips at 8 s (a flash), the lane drifts at 8 s
    ok(wait_for(page, "() => window.__ml.length >= 1"), 'the mood flips')
    ml, ll = page.evaluate("() => [window.__ml, window.__ll]")
    ok(ml[0][0] == 'rot' and 7.6 < ml[0][1] < 8.4 and ml[0][2], f'at about 8 s (game time) it switches to its rot mood, with a flash {ml}')
    ok(len(ll) >= 1 and ll[0][0] != b[4] and 7.6 < ll[0][1] < 8.4, f'at about 8 s it drifts to another lane {ll}')
    # rot mood: normal blocked (and every plain damage), rotten -1.5
    hp0 = page.evaluate("() => window.__b.hp")
    r = page.evaluate(LHIT, 0)
    ok(r[:2] == [True, False] and r[2] == 0 and r[3] == 'Blocked' and r[4] == 0, f'rot mood: rotOnly; a green is blocked; plain damage does nothing {r}')
    r = page.evaluate(LHIT, R)
    ok(r[2] == -1.5, f'rot mood: a rotten pumpkin takes 1.5 off ({hp0} -> {hp0 + r[2]}) {r}')
    # the fog call at 12 s: one row or column, with the level's dur
    ok(wait_for(page, "() => window.__fl.length >= 1"), 'it calls a fog')
    fl, dur = page.evaluate("() => [window.__fl, window.__gg.G.def.poison.dur]")
    ok(11.6 < fl[0][0] < 12.4 and fl[0][1] in ('row', 'col') and fl[0][2] == 1 and fl[0][3] == dur and fl[0][4] == 'lamp', f'at about 12 s it calls a poison fog on one row or column with the level dur {dur} {fl}')
    # back to clean at 16 s
    ok(wait_for(page, "() => window.__ml.length >= 2"), 'the mood flips back')
    ml = page.evaluate("() => window.__ml")
    ok(ml[1][0] == 'clean' and 15.5 < ml[1][1] < 16.5, f'at about 16 s it is back in its clean mood {ml}')
    r = page.evaluate(LHIT, 0)
    ok(r[:2] == [False, True] and r[2] < 0, f'clean again: a green hurts {r}')
    # immune to knockback and freeze (clean mood, through the real hit path), slowed; then held at the back all along
    hits = """(m) => { const g = window.__gg, out = { kb:0, frozen:0, slowed:0 };
      for (let i = 0; i < 20; i++){ const pr = { x:m.x, y:g.fieldY(1), vy:-900, type:2, vis:2, lv:5, guar:true, lane:m.lane, hitWalls:new Set(), grp:{ spawned:false, small:false, kills:0 }, size:1, rot:0, spin:9, hit:new Set(), trail:[], r:16, dead:false };
        g.hitMonster(pr, m); if (m.kb > 0) out.kb++; if (m.frozenT > 0) out.frozen++; if (m.slowT > 0) out.slowed++; }
      return out; }"""
    r = page.evaluate(f"() => {{ const b = window.__b; const h = b.hp; b.hp = 5000; const o = ({hits})(b); b.hp = h; return [o, b.kb || 0, b.frozenT || 0]; }}")
    ok(r[0]['kb'] == 0 and r[0]['frozen'] == 0 and r[1] == 0 and r[2] == 0 and r[0]['slowed'] > 0, f'20 Ice hits with knockback guaranteed: no knockback, no freeze, but slowed {r}')
    mp, hold = page.evaluate("() => [window.__maxP, window.__b.hold]")
    ok(mp <= hold + 1e-9, f'it never walks past hold (max p {mp:.4f}, hold {hold})')
    # killing it gives exactly one normal chest
    c0 = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate("() => { clearInterval(window.__li); const g = window.__gg, b = window.__b; b.mood = 'clean'; b.rotOnly = false; b.cleanOnly = true; b.lastHit = 0; g.damage(b, 99999, '#fff'); }")
    time.sleep(0.3)
    ch = page.evaluate("() => window.__gg.save.chests.slice(%d)" % c0)
    ok(len(ch) == 1 and ch[0]['kind'] == 'normal' and not ch[0].get('boss'), f'killing it adds exactly one normal chest and no boss item {ch}')
    ok(page.evaluate("() => window.__gg.G.bossDead"), 'the boss is down (the night can end)')
    # with the level's own poison cycle running (N2-4: every 20 s, dur 3; its clock set so its fog settles at 18.5 s): the Lamplighter's calls
    # are extra and never restart the level clock, so the level's fog warns at 17 s between the Lamplighter's at 12 s and 24 s
    page2, errors2 = open_page(browser, url)   # a fresh page: the night just won ends itself on a timer
    b = lamp_up(page2, 4, level_clock=18.5)
    ev = page2.evaluate("() => [window.__gg.G.def.poison.every, window.__gg.G.def.poison.dur]")
    ok(b is not None and ev == [20, 3], f'N2-4 with its own fog clock running (every 20, dur 3) {b} {ev}')
    ok(wait_for(page2, "() => window.__fl.length >= 3", 90), 'three fogs come')
    fl = page2.evaluate("() => (clearInterval(window.__li), window.__fl)")
    want = [('lamp', 12), ('level', 17), ('lamp', 24)]
    ok(len(fl) >= 3 and all(f[4] == s and abs(f[0] - t) < 0.4 for f, (s, t) in zip(fl, want)),
       f"the Lamplighter's fog at 12 s and 24 s and the level's own at 17 s (its clock ran on under the Lamplighter's fog) {[(round(f[0], 2), f[4]) for f in fl]}")
    ok(not errors2, f'no page errors {errors2[:2]}')
    page2.close()
    # winning N2-4 unlocks the Protector Gourd
    page.evaluate("() => { window.__gg.save.gourds.protector = false; }")
    nm2_start(page, 4); page.evaluate("() => window.__gg.endGame(true)"); time.sleep(1.8)
    ok(page.evaluate("() => window.__gg.save.gourds.protector") is True, 'winning N2-4 sets save.gourds.protector')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_lamplighter_form2(browser, url):
    """N2-13 (bossForm 2): 34 health, the mood switches every 6 s; one normal chest."""
    if not R5: return
    page, errors = open_page(browser, url)
    b = lamp_up(page, 13)
    ok(b is not None and b[0] == 'lamplighter' and b[1] == b[2] == 34 and b[5] == 2, f'on N2-13 it arrives in form 2 with 34 health {b}')
    if b is None:
        page.close(); return
    ok(wait_for(page, "() => window.__ml.length >= 2"), 'the mood flips twice')
    ml = page.evaluate("() => window.__ml")
    ok(ml[0][0] == 'rot' and 5.6 < ml[0][1] < 6.4 and ml[1][0] == 'clean' and 11.5 < ml[1][1] < 12.5, f'form 2 switches every 6 s {ml}')
    c0 = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate("() => { clearInterval(window.__li); const g = window.__gg, b = window.__b; b.lastHit = 0; b.rotOnly = false; g.damage(b, 99999, '#fff'); }"); time.sleep(0.3)
    ch = page.evaluate("() => window.__gg.save.chests.slice(%d).map(c => c.kind)" % c0)
    ok(ch == ['normal'], f'N2-13 also gives one normal chest {ch}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_lamplighter_continue(browser, url):
    """A continued night brings it back with its health, its mood and its three clocks where they were."""
    if not R5: return
    page, errors = open_page(browser, url)
    b = lamp_up(page, 4)
    if b is None:
        ok(False, 'the Lamplighter arrived'); page.close(); return
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 5, '#fff'); }")
    ok(wait_for(page, "() => window.__ml.length >= 1"), "it reaches its rot mood")
    time.sleep(1.0)
    before = page.evaluate("""() => { clearInterval(window.__li); const g = window.__gg, b = window.__b, s = [b.mood, b.hp, +b.moodT.toFixed(3), +b.driftT.toFixed(3), +b.fogT.toFixed(3)];
      window.__hitClip = 0; clearInterval(window.__hw); window.__hw = setInterval(() => { const B = window.__gg.G.monsters.find(m => m.type === 'boss' && !m.dead); if (B && B !== b && B.anim && B.anim.clip === 'hit') window.__hitClip++; }, 5);
      const c = g.continueState(); g.continueNight(c); return s; }""")
    time.sleep(0.6)
    after = page.evaluate(f"() => {{ const b = {LBOSS}; return b ? [b.mood, b.hp, +b.moodT.toFixed(3), +b.driftT.toFixed(3), +b.fogT.toFixed(3), b.kind, !!b.rotOnly, b.p <= 0.05] : null; }}")
    hc = page.evaluate(f"() => {{ clearInterval(window.__hw); const b = {LBOSS}; return [window.__hitClip, b ? b.seenHp === b.hp : null]; }}")
    ok(hc == [0, True], f'coming back at 19 health plays no hit clip (seenHp set on restore) {hc}')
    ok(after is not None and after[:5] == before and after[5] == 'lamplighter' and after[6] and after[7],
       f'a continued night brings it back in its rot mood with its 19 health and its clocks as they were (they wait while it walks in) {before} -> {after}')
    ok(before[1] == 19 and before[0] == 'rot', f'(it was hurt to 19 and in its rot mood {before})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_lamplighter_baked(browser, url):
    """Its frames (both moods, each with a hit) are baked when the night starts, capped like the Strawlord's (under 10 MB at bake scale 2.5)."""
    if not R5: return
    page, errors = open_page(browser, url)
    C = page.evaluate("() => { const C = window.__gg.CHARS.lamplighter; return C ? [Object.keys(C.clips).sort(), C.clips.walk.pose(0).mood, C.clips.rot.pose(0).mood] : null; }")
    ok(C == [['hit', 'rot', 'rothit', 'walk'], 'clean', 'rot'], f'the Lamplighter bakes walk (the amber clean mood), rot (the green rot mood) and a hit for each {C}')
    page.evaluate("() => window.__gg.setBakeScale(2.5)")
    t0 = time.time(); nm2_start(page, 4); dt = time.time() - t0
    ok(page.evaluate("() => window.__gg.isBaked('lamplighter')"), 'starting N2-4 bakes the Lamplighter')
    mb = page.evaluate("() => window.__gg.atlasBytes('lamplighter') / 1e6")
    ok(mb < 10, f'the Lamplighter\'s frames take {mb:.1f} MB at bake scale 2.5 (limit 10)')
    ok(dt < 3, f'the night opens in {dt:.1f} s')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_lamplighter': check_lamplighter, 'check_lamplighter_form2': check_lamplighter_form2, 'check_lamplighter_continue': check_lamplighter_continue,
               'check_lamplighter_baked': check_lamplighter_baked})


# ---------- Task 9: the Fallen Poltergeist (N2-16, the hollow nightmare's boss) ----------
R5_NAMES += ('fallenpoltergeist',)
# Fill every cell but the gourds with a tagged pumpkin (checkerboard of two colours: no bunches), no graves.
FPATCH = """() => { const g = window.__gg; g.graves.forEach(r => r.fill(false));
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++){ const x = g.grid[r][c]; if (x && x.gourd) continue; const n = g.newCell((r + c) % 2); n.tag = r * 7 + c; g.grid[r][c] = n; }
  g.resolveMatches(); }"""
# The patch as [tag | 'G:kind' | null, colour] per cell, and which cells a Protector shields.
FGRID = """() => { const g = window.__gg; return g.grid.map(row => row.map(x => x ? (x.gourd ? ['G:' + x.gourd, x.c] : [x.tag, x.c]) : null)); }"""
FPROT = "() => [0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4, 5, 6].map(c => window.__gg.isProtected(r, c)))"
# A game-time log of the boss from now (window.__fe): lane changes ['lane', t, lane, teleport clip seen], black fog count changes ['fog', t, n],
# swap clips starting ['swap', t]; t in game seconds since the log started, sampled every 10 ms. Highest p in window.__fmaxP.
FLOG = """() => { const G = window.__gg.G, b = window.__b, t0 = G.t; window.__fe = []; window.__fmaxP = 0; let lane = b.lane, nf = (b.fogs || []).length, sw = false; window.__fgs = null; clearInterval(window.__fi);
  window.__fi = setInterval(() => { const g = window.__gg, B = window.__b, t = g.G.t - t0; window.__fmaxP = Math.max(window.__fmaxP, B.p); g.G.spawnTimer = 999;
    if (B.lane !== lane){ lane = B.lane; window.__fe.push(['lane', t, lane, (g.G.vfx || []).some(v => v.kind === 'clip' && v.key === 'fallenpoltergeist' && v.clip === 'teleport')]); }
    const n = (B.fogs || []).length; if (n !== nf){ window.__fe.push(['fog', t, n]); nf = n; }
    const s = !!(B.anim && B.anim.clip === 'swap'); if (s && !sw) window.__fe.push(['swap', t]); sw = s;
    const gs = g.grid.map(row => row.map(x => x ? (x.tag == null ? 'g' : x.tag) : '-').join(',')).join('/'); if (gs !== window.__fgs){ if (window.__fgs != null) window.__fe.push(['grid', t]); window.__fgs = gs; } }, 10); }"""
# One pumpkin of type t on monster `who` (-1: the boss): [rotOnly, hp change, the float it showed, rotten hits still needed in a reaper phase]
FHIT = f"""([t, who]) => {{ const g = window.__gg, m = who < 0 ? window.__b : window.__ms[who], n0 = g.G.floats.length, h0 = m.hp; g.hitMonster(({HIT_PR})(t, m.lane), m);
  const f = g.G.floats.slice(n0).map(x => x.text).find(x => typeof x === 'string') || null; return [!!m.rotOnly, +(m.hp - h0).toFixed(2), f, m.reaper || 0]; }}"""


def fp_up(page):
    """Start N2-16 with both gourds (the Protector unlocked), bring the boss in now with only it on the field (lamp_up), then fill the patch."""
    page.evaluate("() => { window.__gg.save.gourds.protector = true; }")
    b = lamp_up(page, 16)
    if b: page.evaluate(FPATCH)
    return b


def shuffled_ok(before, after, prot, label):
    """The shuffle rule between two FGRID snapshots: protected cells and gourds unchanged; every unprotected pumpkin moved to another unprotected
    cell, its colour kept; nothing lost or added."""
    cells = [(r, c) for r in range(5) for c in range(7)]
    same_prot = all(before[r][c] == after[r][c] for r, c in cells if prot[r][c] or (before[r][c] and str(before[r][c][0]).startswith('G:')))
    tags = lambda g: sorted(g[r][c][0] for r, c in cells if g[r][c] and not prot[r][c] and not str(g[r][c][0]).startswith('G:'))
    col = lambda g: {g[r][c][0]: g[r][c][1] for r, c in cells if g[r][c]}
    pos = lambda g: {g[r][c][0]: (r, c) for r, c in cells if g[r][c] and not prot[r][c] and not str(g[r][c][0]).startswith('G:')}
    pb, pa = pos(before), pos(after)
    stayed = [t for t in pb if pa.get(t) == pb[t]]
    ok(same_prot, f'{label}: the Protector square and the gourds are untouched')
    ok(tags(before) == tags(after) and len(pb) > 10, f'{label}: the same {len(pb)} unprotected pumpkins, all still outside the square')
    ok(col(before) == col(after), f'{label}: every pumpkin keeps its colour')
    ok(not stayed, f'{label}: every unprotected pumpkin moved to a new cell (stayed: {stayed})')


def check_fallen_polt(browser, url):
    """N2-16 (owner 2026-11-11): data and level; it vanishes every 6 s (teleport clip) and swaps 3 pumpkins as it does (protection-aware, colours kept;
    no separate swap clock); a black fog 3x3 for 8 s around a random monster (rot-only inside); reaper phases at 75%, 50% and 25% (a hit never carries
    it past the next mark), each one reshuffling the whole patch and rot-only until 3 rotten hits; one normal chest."""
    if not R5: return
    page, errors = open_page(browser, url)
    T = page.evaluate("""() => { const T = window.__gg.TYPES.fallenpoltergeist; return T ? [T.boss, T.hp, T.r, T.sp, T.coins, T.eat, T.pts, T.drop, T.hold, T.vanishEvery, T.swapEvery === undefined, T.swapN,
      T.zoneEvery, T.zoneFor, T.shuffleAt === undefined, T.reaperAt, T.reaperHits, T.lanternEvery, T.lanternN, T.lanternHp, T.lanternFor, T.lanternHit, T.noItems] : null; }""")
    ok(T == [True, 45, 34, 0.03, 50, 0, 400, 6, 0.25, 6, True, 3, 12, 8, True, [0.75, 0.5, 0.25], 3, 20, 3, 3, 10, 0.5, True], f'Fallen Poltergeist data {T}')
    ok(page.evaluate("() => window.__gg.BOSS_NAMES.fallenpoltergeist") == 'The Fallen Poltergeist', 'its name on screen is "The Fallen Poltergeist"')
    intro = page.evaluate("() => (window.__gg.BOSS_INTRO.fallenpoltergeist || {})[1] || ''")
    ok('rotten' in intro.lower() and 'shuffle' in intro.lower() and 'lantern' in intro.lower(), f'it has a boss intro text {intro[:60]!r}')
    L = page.evaluate("() => [13, 14, 15].map(i => { const d = window.__gg.NIGHTMARE_LEVELS[1][i]; return d && [d.level, d.name, d.boss, d.bossChest, !!d.gourd, d.gourds, !!d.poison]; })")
    ok(L[0] is not None and L[0][0] == 14 and L[1] is not None and L[1][0] == 15, f'placeholder nights N2-14 and N2-15 exist {L[:2]}')
    ok(L[2] == [16, 'The Fallen Poltergeist', 'fallenpoltergeist', 'normal', True, ['grave', 'protector'], True], f'N2-16: the Fallen Poltergeist, a normal chest, both gourds, steady poison {L[2]}')
    want = ['fallengravekeeper', 'fallenpoltergeist'] + (['fallenhexwitch'] if BUILD in ('r7', 'r8', 'on') else []) + (['fallencount'] if BUILD in ('r8', 'on') else []) + (['fallentides'] if BUILD == 'on' else [])   # one per nightmare book: Release 7 adds the witchwood's, Release 8 the keep's, Release 9 the marsh's
    got = page.evaluate("() => window.__gg.FALLEN.map(f => f.key)")
    ok(got == want, f'the world 2 nightmare bestiary ends on it (FALLEN[1]); the FALLEN list is exactly this build\'s books {got}')
    ok(bool(page.evaluate("() => (window.__gg.BESTIARY.fallenpoltergeist || {}).ability")), 'it has a bestiary entry')
    b = fp_up(page)
    ok(b is not None and b[0] == 'fallenpoltergeist' and b[1] == b[2] == 45, f'on N2-16 it arrives with 45 health {b}')
    if b is None:
        page.close(); return
    prot = page.evaluate(FPROT)
    ok(sum(map(sum, prot)) == 9, f'a Protector stands with its 3x3 ({sum(map(sum, prot))} cells)')
    ok(page.evaluate("() => window.__b.shufDone === undefined && window.__gg.TYPES.fallenpoltergeist.swapEvery === undefined"), 'no separate swap clock and no shuffle marks any more')
    # three still ghouls; then force the vanish and fog clocks and log in game time (lane changes and patch changes)
    for spec in ([1, 0.5, 50], [2, 0.5, 50], [5, 0.5, 50]): page.evaluate(STILL, ['ghoul'] + spec)
    g0 = page.evaluate(f"() => {{ const b = window.__b; b.tpT = b.zoneT = 0.1; b.lanT = 999; ({FLOG})(); return ({FGRID})(); }}")
    ok(wait_for(page, "() => window.__fe.some(e => e[0] === 'lane')", 20), 'it vanishes')
    time.sleep(0.15)
    g1 = page.evaluate(FGRID)
    cells = [(r, c) for r in range(5) for c in range(7)]
    moved = [(r, c) for r, c in cells if g0[r][c] != g1[r][c]]
    ok(len(moved) == 3 and sorted(g0[r][c][0] for r, c in moved) == sorted(g1[r][c][0] for r, c in moved), f'its vanish swaps 3 pumpkins among their own cells {moved}')
    col0 = {g0[r][c][0]: g0[r][c][1] for r, c in cells if g0[r][c]}; col1 = {g1[r][c][0]: g1[r][c][1] for r, c in cells if g1[r][c]}
    ok(col0 == col1 and not any(prot[r][c] for r, c in moved) and all(not str(g0[r][c][0]).startswith('G:') for r, c in moved), f'colours unchanged, never a gourd or a protected cell {moved}')
    # the black fog: rot-only inside its 3x3 (lanes +-1, 1.5 tiles) around one of the ghouls; the boss itself is not in it
    time.sleep(0.3)
    z = page.evaluate("""() => { const g = window.__gg, b = window.__b, f = (b.fogs || [])[0]; if (!f) return null; const reach = 1.5 * g.TILE_P();
      return [f.lane, f.p, window.__ms.map(m => [Math.abs(m.lane - f.lane) <= 1 && Math.abs(m.p - f.p) <= reach, !!m.rotOnly, m.lane, m.p]), !!b.rotOnly,
        window.__ms.some(m => m.lane === f.lane && Math.abs(m.p - f.p) < 1e-6)]; }""")
    ok(z is not None and z[4], f'a black fog lies around one of the monsters {z and z[:2]}')
    if z:
        ok(all(i == r for i, r, _, _ in z[2]) and any(i for i, _, _, _ in z[2]), f'monsters inside its 3x3 are rot-only, those outside are not {z[2]}')
        ok(z[3] is False, 'the boss is not rot-only outside its reaper phase')
        ins = next(i for i, x in enumerate(z[2]) if x[0])
        R = page.evaluate("() => window.__gg.ROTTEN")
        r = page.evaluate(FHIT, [0, ins])
        ok(r[0] and r[1] == 0 and r[2] == 'Blocked', f'a normal pumpkin is blocked on a monster in the black fog {r}')
        r = page.evaluate(FHIT, [R, ins])
        ok(r[1] == -1.5, f'a rotten pumpkin hurts it (1.5) {r}')
    # the rest of the timers: vanish (and swap) again at 6 s; the fog gone at 8 s; the patch changes only when it vanishes
    ok(wait_for(page, "() => window.__fe.filter(e => e[0] === 'lane').length >= 2 && window.__fe.filter(e => e[0] === 'fog').length >= 2", 40), 'a second vanish and the fog lifting')
    time.sleep(0.3)
    fe = page.evaluate("() => window.__fe")
    lanes = [e for e in fe if e[0] == 'lane']; grids = [e[1] for e in fe if e[0] == 'grid']; fogs = [(e[2], e[1]) for e in fe if e[0] == 'fog']
    ok(len(lanes) >= 2 and abs(lanes[0][1] - 0.1) < 0.4 and abs(lanes[1][1] - 6.1) < 0.4 and all(e[3] for e in lanes[:2]), f'it vanishes into another lane every 6 s, with its teleport clip {lanes}')
    ok(len(grids) == len(lanes) and all(abs(gt - e[1]) < 0.06 for gt, e in zip(grids, lanes)), f'and the patch is swapped exactly when it vanishes, never between {grids} {[e[1] for e in lanes]}')
    ok(len(fogs) == 2 and fogs[0][0] == 1 and abs(fogs[0][1] - 0.1) < 0.4 and fogs[1][0] == 0 and abs(fogs[1][1] - 8.1) < 0.4, f'its black fog lies 8 s {fogs}')
    time.sleep(0.1)
    ok(page.evaluate("() => window.__ms.every(m => !m.rotOnly)"), 'once the fog lifts nobody is rot-only')
    # many swaps (test hook, landing skipped): never a protected cell or a gourd, always 3, colours kept
    sw = page.evaluate(f"""() => {{ const g = window.__gg, b = window.__b, out = [];
      for (let i = 0; i < 20; i++){{ const a = ({FGRID})(); g.fpSwap(b); g.grid.forEach(row => row.forEach(x => {{ if (x){{ x.fly = 0; x.ox = x.oy = 0; }} }})); const z = ({FGRID})(); let n = 0, bad = 0;
        for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (JSON.stringify(a[r][c]) !== JSON.stringify(z[r][c])){{ n++; if (g.isProtected(r, c) || (a[r][c] && String(a[r][c][0]).startsWith('G:'))) bad++; }}
        out.push([n, bad]); }}
      return out; }}""")
    ok(all(x == [3, 0] for x in sw), f'20 more swaps: 3 pumpkins each, never in or out of the Protector square, never a gourd {sw}')
    # reaper phase 1 at 75%: a 16-damage hit at full health stops at the mark (33.75 of 45), the phase starts and the patch reshuffles
    page.evaluate("() => { window.__ms.forEach(m => m.dead = true); window.__gg.G.monsters = window.__gg.G.monsters.filter(m => !m.dead); }")
    R = page.evaluate("() => window.__gg.ROTTEN")
    LAND = "() => window.__gg.grid.forEach(row => row.forEach(x => { if (x){ x.fly = 0; x.ox = x.oy = 0; } }))"
    for k, (mark, hit) in enumerate(((33.75, 16), (22.5, 20), (11.25, 20)), 1):
        page.evaluate(FPATCH)
        s0 = page.evaluate(f"([a]) => {{ const g = window.__gg, b = window.__b; b.tpT = b.zoneT = b.lanT = 999; const s = ({FGRID})(); b.lastHit = 0; g.damage(b, a, '#fff'); return s; }}", [hit])
        r = page.evaluate("() => { const b = window.__b; return [b.hp, !!b.rotOnly, b.reaper, b.reapDone, b.anim && b.anim.clip]; }")
        ok(r[:4] == [mark, True, 3, k], f'phase {k}: a {hit}-damage hit stops at the {[75, 50, 25][k - 1]}% mark ({mark}) and its reaper phase starts at once, 3 rotten hits to go {r}')
        time.sleep(0.3)
        s1 = page.evaluate(FGRID)
        shuffled_ok(s0, s1, prot, f'entering phase {k} reshuffles the whole patch')
        page.evaluate(LAND)
        r = page.evaluate(FHIT, [0, -1])
        ok(r[0] and r[1] == 0 and r[2] == 'Blocked' and r[3] == 3, f'phase {k}: a normal pumpkin is blocked {r}')
        ok(page.evaluate("() => { const g = window.__gg, b = window.__b, h = b.hp; b.lastHit = 0; g.damage(b, 1, '#fff'); return b.hp - h; }") == 0, f'phase {k}: plain damage (burn, splash, tools) does nothing')
        hits = [page.evaluate(FHIT, [R, -1]) for _ in range(3)]
        ok([h[1] for h in hits] == [-1.5, -1.5, -1.5] and [h[3] for h in hits] == [2, 1, 0], f'phase {k}: 3 rotten pumpkins hurt it 1.5 each, the badge counting ×3 → ×2 → ×1, and end the phase {hits}')
        time.sleep(0.2)
        r2 = page.evaluate(FHIT, [R, -1])
        ok(not r2[0] and r2[1] == 0.5, f'phase {k}: back to normal, a rotten pumpkin heals it (0.5) {r2}')
    r = page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 1, '#fff'); return [b.hp, !!b.rotOnly, b.reaper, b.reapDone]; }")
    ok(r == [6.25, False, 0, 3], f'past the last mark there is no fourth phase {r}')
    mp, hold = page.evaluate("() => [window.__fmaxP, window.__b.hold]")
    ok(mp <= hold + 1e-9, f'it never walks past hold (max p {mp:.4f}, hold {hold})')
    # a fresh one hit for its whole health at once: it stops at 75%, so no phase is ever skipped
    b = fp_up(page)
    r = page.evaluate("() => { const g = window.__gg, b = window.__b; b.tpT = b.zoneT = b.lanT = 999; b.lastHit = 0; g.damage(b, 999, '#fff'); return [b.dead, b.hp, b.reaper, b.reapDone]; }")
    ok(r == [False, 33.75, 3, 1], f'a 999 hit at full health stops at the 75% mark and starts the first phase {r}')
    page.evaluate("() => { const b = window.__b; b.reaper = 0; b.rotOnly = false; b.reapDone = 3; }")
    # one normal chest
    c0 = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate("() => { clearInterval(window.__fi); clearInterval(window.__li); const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 99, '#fff'); }"); time.sleep(0.3)
    ch = page.evaluate("() => window.__gg.save.chests.slice(%d)" % c0)
    ok(len(ch) == 1 and ch[0]['kind'] == 'normal' and not ch[0].get('boss') and page.evaluate("() => window.__gg.G.bossDead"), f'killing it adds exactly one normal chest, no boss item, and the boss is down {ch}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fallen_polt_continue(browser, url):
    """A continued night brings it back with its health, its marks spent and a reaper phase in progress with the rotten hits it still needs
    (controller ruling: losing gives no free pass), without a second reshuffle; a boss healed back above a spent mark does not replay it; an
    older snapshot without the marks falls back to counting them from its health."""
    if not R5: return
    page, errors = open_page(browser, url)
    R = page.evaluate("() => window.__gg.ROTTEN")
    CONT = f"""() => {{ clearInterval(window.__li); clearInterval(window.__fi); const g = window.__gg, c = g.continueState(); window.__snap = JSON.parse(JSON.stringify(c.bossMood)); g.continueNight(c); }}"""
    BACK = f"() => {{ const b = {LBOSS}; if (b) window.__b = b; return b ? [b.kind, b.hp, b.reapDone, b.reaper, !!b.rotOnly, (b.fogs || []).length, !!b.shufPend] : null; }}"
    # 1. lost mid-phase, two rotten hits still needed
    b = fp_up(page)
    if b is None:
        ok(False, 'the Fallen Poltergeist arrived'); page.close(); return
    before = page.evaluate("() => { const g = window.__gg, b = window.__b; b.tpT = b.zoneT = b.lanT = 999; b.lastHit = 0; g.damage(b, 16, '#fff'); return [b.hp, b.reapDone, b.reaper]; }")   # 33.75: in its first reaper phase
    time.sleep(0.3)
    h = page.evaluate(FHIT, [R, -1])
    ok(before == [33.75, 1, 3] and h[3] == 2 and h[1] == -1.5, f'it is in its first reaper phase and one rotten hit leaves 2 to go {before} {h}')
    page.evaluate(CONT); time.sleep(0.8)
    snap = page.evaluate("() => window.__snap")
    ok(snap == [{'reaper': 2, 'reapDone': 1}], f'the snapshot holds its reaper phase and marks spent {snap}')
    after = page.evaluate(BACK)
    ok(after == ['fallenpoltergeist', 33, 1, 2, True, 0, False], f'it comes back with 33 health, its marks spent, still reaper with 2 rotten hits to go, rot-only, no second reshuffle {after}')
    r = page.evaluate(FHIT, [0, -1])
    ok(r[0] and r[1] == 0 and r[2] == 'Blocked' and r[3] == 2, f'after the continue a normal pumpkin is still blocked {r}')
    hits = [page.evaluate(FHIT, [R, -1]) for _ in range(2)]
    ok([x[1] for x in hits] == [-1.5, -1.5] and [x[3] for x in hits] == [1, 0], f'the 2 rotten hits still needed end the phase {hits}')
    time.sleep(0.2)
    r = page.evaluate(FHIT, [R, -1])
    ok(not r[0] and r[1] == 0.5, f'then it is back to normal: a rotten pumpkin heals it {r}')
    # 2. healed back above the spent mark, then continued: the 75% phase does not replay; the next mark down (50%) starts phase 2
    b = fp_up(page)
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.tpT = b.zoneT = b.lanT = 999; b.lastHit = 0; g.damage(b, 16, '#fff'); }"); time.sleep(0.3)
    for _ in range(3): page.evaluate(FHIT, [R, -1])
    time.sleep(0.2)
    healed = page.evaluate("() => { const b = window.__b; b.hp = 40; return [b.hp, b.reapDone, b.reaper]; }")   # rotten pumpkins healed it back to 40 of 45
    ok(healed == [40, 1, 0], f'(it spent the 75% phase, then was healed to 40) {healed}')
    page.evaluate(CONT); time.sleep(0.8)
    after = page.evaluate(BACK)
    ok(after == ['fallenpoltergeist', 40, 1, 0, False, 0, False], f'it comes back with 40 health and the mark still spent {after}')
    r = page.evaluate("() => { const g = window.__gg, b = window.__b; b.tpT = b.zoneT = b.lanT = 999; b.lastHit = 0; g.damage(b, 20, '#fff'); return [b.hp, b.reaper, b.reapDone]; }")
    ok(r == [22.5, 3, 2], f'hurt below 75% again: no replay; the hit stops at 50% and starts the second phase {r}')
    # 3. an older snapshot (no marks in it): they are counted from its health on its first frame
    b = fp_up(page)
    page.evaluate("() => { const b = window.__b; b.tpT = b.zoneT = b.lanT = 999; b.hp = 30; b.reapDone = 1; b.reaper = 0; }"); time.sleep(0.3)
    page.evaluate("() => { clearInterval(window.__li); clearInterval(window.__fi); const g = window.__gg, c = g.continueState(); c.bossMood = [null]; g.continueNight(c); }"); time.sleep(0.8)
    after = page.evaluate(BACK)
    ok(after == ['fallenpoltergeist', 30, 1, 0, False, 0, False], f'an old snapshot without its marks: they are counted from its 30 health (the 75% phase spent) {after}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fallen_polt_cross(browser, url):
    """The rotten hit that reaches a reaper mark (the boss rot-only in a Plague Doctor 2's square) stops there, starts the phase and does not count toward it."""
    if not R5: return
    page, errors = open_page(browser, url)
    b = fp_up(page)
    if b is None:
        ok(False, 'the Fallen Poltergeist arrived'); page.close(); return
    R = page.evaluate("() => window.__gg.ROTTEN")
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.tpT = b.zoneT = b.lanT = 999; b.lastHit = 0; g.damage(b, 10.5, '#fff'); }"); time.sleep(0.3)   # 34.5: just above 75%
    r = page.evaluate(f"([t]) => {{ const b = window.__b, h = b.hp, d = [b.reaper, b.reapDone]; b.rotOnly = true; return [h, d, ({FHIT})([t, -1])]; }}", [R])
    ok(r[0] == 34.5 and r[1] == [0, 0], f'(34.5 health, no phase yet) {r[:2]}')
    ok(r[2][1] == -0.75 and r[2][3] == 3, f'the rotten hit that reaches 75% stops there (0.75 of its 1.5) and starts the phase with all 3 rotten hits still to go {r[2]}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


# Pause / resume the live loop: setState is a test hook only from Release 8, so a Release 5 build presses P (input.js) instead.
PAUSE = "() => { const g = window.__gg; if (g.setState) g.setState('pause'); else if (g.state === 'play') window.dispatchEvent(new KeyboardEvent('keydown', { key:'p' })); }"
PLAY = "() => { const g = window.__gg; if (g.setState) g.setState('play'); else if (g.state === 'pause') window.dispatchEvent(new KeyboardEvent('keydown', { key:'p' })); }"
LANT = "() => (window.__gg.G.lanterns || []).map(o => [o.lane, +o.hp.toFixed(2), +o.t.toFixed(2)])"
STEP2 = "([n, dt]) => { const g = window.__gg; for (let i = 0; i < n; i++) g.update(dt); }"
# A pumpkin of type t at level lv flying up `lane` from below the fence (the real flight path in game.js).
FLY = """([t, lane, lv]) => { const g = window.__gg, G = g.G; const pr = { x:g.LANE(lane), y:g.fieldY(1) + 90, vy:-900, type:t, vis:Math.max(t, 0), lv, guar:false, lane, hitWalls:new Set(),
  grp:{ spawned:false, small:false, kills:0 }, size:1, rot:0, spin:9, hit:new Set(), trail:[], r:16, dead:false }; G.projs.push(pr); window.__pf = pr; }"""


def lantern_up(page):
    """N2-16, the boss parked at its hold with every clock far off, the game paused (stepped by hand), every fence at 40."""
    b = fp_up(page)
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.p = b.hold; b.tpT = b.zoneT = b.lanT = 999; clearInterval(window.__li); g.G.lanterns = []; for (const w of g.walls){ w.max = 40; w.hp = 40; } }")
    page.evaluate(PAUSE); time.sleep(0.1)
    return b


def check_fp_lanterns(browser, url):
    """Owner 2026-11-11: every 20 s three cursed lanterns (3 health, 10 s countdown) light at the fences of three distinct lanes, standing fences first;
    a pumpkin flying up the lane hits the lantern first (its hit power off it; a rotten one splats); unbroken in time it takes half its fence's full
    health, never the last 1; they go when the Poltergeist falls."""
    if not R5: return
    page, errors = open_page(browser, url)
    b = lantern_up(page)
    if b is None:
        ok(False, 'the Fallen Poltergeist arrived'); page.close(); return
    page.evaluate("() => { const g = window.__gg; g.walls[0].hp = 0; g.walls[6].hp = 0; g.walls[3].hp = 0; g.walls[5].hp = 0; window.__b.lanT = 20; }")
    page.evaluate(STEP2, [195, 0.1])
    ok(page.evaluate(LANT) == [], 'no lanterns before 20 s')
    page.evaluate(STEP2, [6, 0.1])
    L = page.evaluate(LANT)
    ok(len(L) == 3 and len({l for l, _, _ in L}) == 3, f'at 20 s three lanterns in three distinct lanes {L}')
    ok(sorted(l for l, _, _ in L) == [1, 2, 4], f'standing fences first: the three lanes whose fence is up {L}')
    ok(all(h == 3 and 9.3 <= t <= 10 for _, h, t in L), f'each with 3 health and a 10 s countdown {L}')
    ok(19 <= page.evaluate("() => window.__b.lanT") <= 20, 'its lantern clock restarts at 20 s')
    page.evaluate("() => { const g = window.__gg; for (const w of g.walls) w.hp = 40; g.G.lanterns = []; window.__b.lanT = 0.05; }"); page.evaluate(STEP2, [1, 0.1])
    L = page.evaluate(LANT)
    ok(len(L) == 3, f'with every fence up, three random lanes {L}')
    la, lb, lc = [l for l, _, _ in L]
    # a pumpkin up a lantern's lane hits the lantern first, before a ghoul at the fence; a level-1 pumpkin takes 1, a rotten one nothing
    j = page.evaluate(STILL, ['ghoul', la, 0.97, 50])
    page.evaluate(FLY, [0, la, 1]); page.evaluate(STEP2, [20, 0.02])
    r = page.evaluate(f"() => [({LANT})().find(o => o[0] === {la}), window.__pf.dead, window.__ms[{j}].hp]")
    ok(r[0] is not None and r[0][1] == 2 and r[1] and r[2] == 50, f'a pumpkin up its lane hits the lantern first (3 -> 2), the ghoul behind it untouched {r}')
    R = page.evaluate("() => window.__gg.ROTTEN")
    page.evaluate(FLY, [R, la, 1]); page.evaluate(STEP2, [20, 0.02])
    r = page.evaluate(f"() => [({LANT})().find(o => o[0] === {la}), window.__pf.dead]")
    ok(r[0] is not None and r[0][1] == 2 and r[1], f'a rotten pumpkin splats on it and does nothing {r}')
    page.evaluate(FLY, [0, la, 5]); page.evaluate(STEP2, [20, 0.02])
    ok(all(o[0] != la for o in page.evaluate(LANT)), 'a strong pumpkin breaks it')
    page.evaluate(f"() => {{ window.__ms[{j}].dead = true; }}")
    # tools and area damage leave lanterns alone
    if page.evaluate("() => !!(window.__gg.dropBomb && window.__gg.useFirework)"):   # tool hooks exist from Release 7's test hooks on
        page.evaluate(f"() => {{ const g = window.__gg; Object.assign(g.save, {{ bomb:5, fw:5 }}); g.dropBomb(g.LANE({lb}), g.fieldY(0.98)); g.useFirework(); }}"); page.evaluate(STEP2, [10, 0.02])
        ok(page.evaluate(f"() => ({LANT})().find(o => o[0] === {lb})[1]") == 3, 'a bomb or a firework never touches a lantern')
    # unbroken: at zero it takes half its fence's full health, never the last 1; the broken lantern's fence is untouched
    page.evaluate(f"() => {{ const g = window.__gg; g.walls[{lc}].hp = 5; }}")
    page.evaluate(STEP2, [110, 0.1])
    w = page.evaluate("() => window.__gg.walls.map(w => +w.hp.toFixed(2))")
    ok(w[lb] == 20 and w[lc] == 1 and w[la] == 40, f'at the end of its countdown a lantern takes half its fence (40 -> 20), a fence on 5 is left on 1, the broken one\'s fence is untouched {w}')
    ok(page.evaluate(LANT) == [], 'and the lanterns are gone')
    # they go when it falls
    page.evaluate("() => { const g = window.__gg; for (const w of g.walls) w.hp = 40; window.__b.lanT = 0.05; }"); page.evaluate(STEP2, [1, 0.1])
    ok(len(page.evaluate(LANT)) == 3, '(three lanterns lit again)')
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.reapDone = 3; b.reaper = 0; b.rotOnly = false; b.lastHit = 0; g.damage(b, 999, '#fff'); }")
    ok(page.evaluate(LANT) == [] and page.evaluate("() => window.__gg.G.bossDead"), 'its lanterns go when it falls')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fp_continue_lanterns(browser, url):
    """A continued night drops the lanterns; its lantern clock starts full."""
    if not R5: return
    page, errors = open_page(browser, url)
    b = lantern_up(page)
    if b is None:
        ok(False, 'the Fallen Poltergeist arrived'); page.close(); return
    page.evaluate("() => { window.__b.lanT = 0.05; }"); page.evaluate(STEP2, [1, 0.1])
    ok(len(page.evaluate(LANT)) == 3, '(three lanterns lit)')
    page.evaluate(PLAY); time.sleep(0.1); page.evaluate("() => { const g = window.__gg; g.continueNight(g.continueState()); }"); time.sleep(0.8)
    r = page.evaluate(f"() => {{ const b = {LBOSS}; return [({LANT})(), b ? b.lanT : null]; }}")
    ok(r[0] == [] and r[1] is not None and r[1] > 18, f'a continued night drops them, its lantern clock full {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fp_budget(browser, url):
    """The cursed lanterns, their countdown plates and the reaper badge are baked: two drawImage a lantern and one for the badge, no fill, stroke,
    gradient or shadowBlur."""
    if not R5: return
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillText', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; }
      const d = Object.getOwnPropertyDescriptor(P, 'shadowBlur'); Object.defineProperty(P, 'shadowBlur', { get(){ return d.get.call(this); }, set(v){ if (window.__ccOn && v && this.canvas && this.canvas.id === 'cv') window.__cc.shadowBlur = (window.__cc.shadowBlur || 0) + 1; d.set.call(this, v); } }); })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    b = lantern_up(page)
    if b is None:
        ok(False, 'the Fallen Poltergeist arrived'); page.close(); return
    page.evaluate("() => { const G = window.__gg.G; G.floats.length = 0; G.parts.length = 0; G.idle = -1e9; G.hint = null; }")
    count = "() => new Promise(res => { window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 20) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc; res([(c.drawImage || 0) / 20, (c.fill || 0) / 20, (c.stroke || 0) / 20, ((c.createRadialGradient || 0) + (c.createLinearGradient || 0)) / 20, c.shadowBlur || 0, (c.fillText || 0) / 20]); } }; requestAnimationFrame(tick); })"
    time.sleep(0.4); base = page.evaluate(count)
    page.evaluate("() => { const G = window.__gg.G, b = window.__b; G.lanterns = [{ lane:1, hp:3, t:9.5, age:1 }, { lane:3, hp:2, t:5.2, age:1 }, { lane:5, hp:1, t:1.4, age:1 }]; b.reaper = 2; G.floats.length = 0; G.parts.length = 0; }")
    time.sleep(0.3); lit = page.evaluate(count)
    ok(abs(lit[0] - base[0] - 8) < 0.3, f'three lanterns with their countdowns (6), the ×2 badge (1) and the reaper glow it already had (1) add 8 drawImage a frame ({base[0]:.1f} -> {lit[0]:.1f})')
    ok(lit[1] <= base[1] + 0.1 and lit[2] <= base[2] + 0.1 and lit[3] <= base[3] + 0.1 and lit[4] == 0 and lit[5] <= base[5] + 0.1, f'and no fill, stroke, gradient, shadowBlur or fillText {base} -> {lit}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fallen_polt_baked(browser, url):
    """Its frames (walk, swap, recolour, teleport) are baked when N2-16 starts, capped under 12 MB at bake scale 2.5."""
    if not R5: return
    page, errors = open_page(browser, url)
    C = page.evaluate("() => { const C = window.__gg.CHARS.fallenpoltergeist; return C ? Object.keys(C.clips).sort() : null; }")
    ok(C == ['recolour', 'swap', 'teleport', 'walk'], f'the Fallen Poltergeist bakes walk, swap, recolour and teleport {C}')
    page.evaluate("() => { window.__gg.setBakeScale(2.5); window.__gg.save.gourds.protector = true; }")
    t0 = time.time(); nm2_start(page, 16); dt = time.time() - t0
    ok(page.evaluate("() => window.__gg.isBaked('fallenpoltergeist')"), 'starting N2-16 bakes the Fallen Poltergeist')
    mb = page.evaluate("() => window.__gg.atlasBytes('fallenpoltergeist') / 1e6")
    ok(mb < 12, f"its frames take {mb:.1f} MB at bake scale 2.5 (limit 12)")
    ok(dt < 3, f'the night opens in {dt:.1f} s')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_fallen_polt': check_fallen_polt, 'check_fallen_polt_continue': check_fallen_polt_continue, 'check_fallen_polt_cross': check_fallen_polt_cross,
               'check_fallen_polt_baked': check_fallen_polt_baked,
               'check_fp_lanterns': check_fp_lanterns, 'check_fp_continue_lanterns': check_fp_continue_lanterns, 'check_fp_budget': check_fp_budget})


# ---------- Task 10: the real levels N2-1 to N2-16, intro cards, the nightmare bestiary ----------
N2_NAMES = ['Rot Mist', 'The Reaper', 'Night Doctors', 'The Lamplighter', 'The Protector Gourd', 'Fog Giants', 'Comet Trail', 'Restless Spirits',
            'Thick Fog', 'Plague Ward', 'Wisp Storm', 'Haunted Patch', 'Lamplighter Returns', 'The Rot', 'The Long Night', 'The Fallen Poltergeist']
R5_NAMES += ('Night Doctors', 'Comet Trail', 'Restless Spirits', 'Plague Ward', 'Wisp Storm', 'Haunted Patch', 'Fog Giants', 'Rotten pumpkins')
N2_NEW = {'reaper': 2, 'rotdoctor': 3, 'fogwalker2': 6, 'comet': 7, 'minipolt': 8}   # each new monster and the level that brings it first (spec Part 7)
N2_ALSO = {'reaper': ['crow'], 'fogwalker2': ['brute'], 'comet': ['wisp', 'imp']}   # what each brings onto the field (summons and companions)
N2_LEVELS_JS = """() => { const g = window.__gg; return g.NIGHTMARE_LEVELS[1].map((d, i) => { const L = g.levelFor(1101 + i);
  return { level:d.level, name:d.name, pool:d.pool.map(e => e[0]), weights:d.pool.map(e => e[1]), types:d.pool.every(([k]) => !!(g.TYPES[k] || g.VARIANTS[k])), gourd:!!d.gourd, gourds:d.gourds || null,
    unlockGourds:d.unlockGourds || null, boss:d.boss, bossForm:d.bossForm, bossChest:d.bossChest || null, coach:d.coach || null, intro:d.intro || [], poison:d.poison || null,
    fog:(d.fog || []).length + (d.fogRows || []).length + (d.fogCols || []).length, spawnGap:d.spawnGap, spawnBurst:d.spawnBurst, total:d.total, interval:d.interval,
    quests:g.questsFor(L), questsOk:g.questsFor(L).every(([t]) => !!g.QUEST_TYPES[t]) }; }); }"""


def n2_open_all(page):
    """Every story level, every Release 4 nightmare level and N2-1 to N2-15 beaten (so all of N2 is open); both gourds unlocked."""
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 17)}, **{1100 + k: 3 for k in range(1, 16)}})
    page.evaluate("() => { const s = window.__gg.save; s.gourds = { grave:true, protector:true }; s.seenGourdCoach = true; s.seenProtectorCoach = true; }")


def check_n2_levels(browser, url):
    """The 16 designed levels (spec Part 7): names, pools, gourds, bosses, poison fog and pacing are data, and every preview opens."""
    if not R5: return
    page, errors = open_page(browser, url)
    L = page.evaluate(N2_LEVELS_JS)
    ok(len(L) == 16 and [d['level'] for d in L] == list(range(1, 17)), f'16 hollow nightmare levels in order ({len(L)})')
    ok([d['name'] for d in L] == N2_NAMES, f"each level has the spec's name {[d['name'] for d in L]}")
    ok(all(d['pool'] and d['types'] for d in L), 'every pool is non-empty and every pool type exists in TYPES or VARIANTS')
    intros = {k + 1: d['intro'] for k, d in enumerate(L) if d['intro']}
    ok(intros == {n: [t] for t, n in N2_NEW.items()}, f'each new monster is introduced on the level that first brings it {intros}')
    ok(all(t in d['pool'] for d in L for t in d['intro']), 'every introduced monster is in its level pool')
    early = [(t, k + 1) for k, d in enumerate(L) for t in d['pool'] if t in N2_NEW and k + 1 < N2_NEW[t]]
    ok(not early, f'no new monster walks in before its introduction {early}')
    ok(all(t in L[14]['pool'] for t in N2_NEW), f"N2-15 (The Long Night) holds every new monster {L[14]['pool']}")
    ok(all(d['gourd'] for d in L), 'the Grave Gourd stands on the patch on every level')
    ok(all(d['gourds'] is None for d in L[:4]) and all(d['gourds'] == ['grave', 'protector'] for d in L[4:]), 'N2-5 and later offer both gourds; N2-1 to N2-4 the Grave Gourd alone')
    ok(L[3]['boss'] == 'lamplighter' and L[3]['bossForm'] == 1 and L[3]['bossChest'] == 'normal' and L[3]['unlockGourds'] == ['protector'], f"N2-4: the Lamplighter, a normal chest, unlocks the Protector {L[3]['boss'], L[3]['bossChest'], L[3]['unlockGourds']}")
    ok(L[12]['boss'] == 'lamplighter' and L[12]['bossForm'] == 2 and L[12]['bossChest'] == 'normal', 'N2-13: the Lamplighter in form 2 with a normal chest')
    ok(L[15]['boss'] == 'fallenpoltergeist' and L[15]['bossChest'] == 'normal', 'N2-16: the Fallen Poltergeist with a normal chest')
    ok(set(L[15]['pool']) == {'fogwalker2', 'reaper', 'minipolt', 'comet', 'doctor', 'rotdoctor'} and len(L[15]['pool']) == 6, f"N2-16 walks exactly Fogwalkers 2, Reapers, Poltergeists 2, Wisp Riders 2, Plague Doctors and Plague Doctors 2 (owner 2026-11-11) {L[15]['pool']}")
    ok([k + 1 for k, d in enumerate(L) if d['boss']] == [4, 13, 16], 'bosses on N2-4, N2-13 and N2-16 only')
    ok(L[4]['coach'] == 'protector' and [k + 1 for k, d in enumerate(L) if d['coach']] == [5], 'N2-5 keeps the Protector tutorial (the only coach)')
    P = [d['poison'] for d in L]
    ok(all(p and p['every'] > 0 and p['dur'] > 0 and 1 <= p['lines'][0] <= p['lines'][1] <= 2 and set(p['dirs']) <= {'row', 'col'} and p['dirs'] for p in P), f'every level has poison fog of 1-2 rows or columns {P}')
    cyc = [p['every'] + p['dur'] for p in P]
    ok(cyc[13] == min(cyc) and cyc[13] < cyc[0] / 2, f'N2-14 (The Rot): the shortest poison cycle, near-constant fog {cyc}')
    ok(cyc[9] < cyc[0] and P[9]['lines'][1] == 2, f'N2-10 (Plague Ward): fog more often than N2-1, up to two lines {P[9]}')
    ok(P[3]['every'] == 20 and P[3]['dur'] == 3, f"N2-4 keeps its gentle cycle under the Lamplighter's own calls {P[3]}")
    ok(L[8]['fog'] > 0 and sum(1 for d in L if d['fog']) == 1, 'N2-9 (Thick Fog) is the night with field fog banks')
    top = lambda d: d['pool'][d['weights'].index(max(d['weights']))]
    ok(top(L[9]) == 'rotdoctor' and L[9]['weights'][L[9]['pool'].index('rotdoctor')] >= 8, f"N2-10: many Plague Doctor 2s {list(zip(L[9]['pool'], L[9]['weights']))}")
    ok(top(L[11]) == 'minipolt', f"N2-12: a Poltergeist 2 swarm {list(zip(L[11]['pool'], L[11]['weights']))}")
    ok({'comet', 'wisp', 'crow'} <= set(L[10]['pool']), f"N2-11: Wisp Riders 2, Wisps and crows {L[10]['pool']}")
    ok({'fogwalker2', 'reaper'} <= set(L[8]['pool']), f"N2-9: Fogwalker 2s and Reapers in the fog {L[8]['pool']}")
    ok({'reaper', 'rotdoctor'} <= set(L[13]['pool']), f"N2-14: Reapers and Plague Doctor 2s {L[13]['pool']}")
    ok(all(isinstance(d['spawnGap'], (int, float)) and isinstance(d['spawnBurst'], (int, float)) for d in L), 'every level sets spawnGap and spawnBurst')
    ok(all(d['questsOk'] and len(d['quests']) == 3 for d in L), 'every level has three quests of existing types')
    ok(len({(d['total'], d['interval'], tuple(d['pool'])) for d in L}) == 16, 'no two levels share pool and pacing (each has its own theme)')
    n2_open_all(page)
    for k in range(1, 17):
        page.evaluate(f"() => {{ document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); window.__gg.openPreview({1100 + k}); }}"); time.sleep(0.25)
    ok(not errors, f'every preview opens without a page error {errors[:2]}')
    page.close()


def n2_intro_titles(page, n):
    """Play night n from its preview card and read the intro cards it shows, in order."""
    page.evaluate(f"() => {{ document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); window.__gg.openPreview({n}); }}"); time.sleep(0.4)
    page.click('#bPvGo'); time.sleep(0.4)
    out = []
    for _ in range(8):
        if page.evaluate("() => window.__gg.state") != 'intro': break
        out.append(page.evaluate("() => document.querySelector('#inTitle').textContent"))
        page.click('#bIntroOk'); time.sleep(0.3)
    return out


def check_n2_intros(browser, url):
    """First appearances on the hollow track show a card: poison fog and rotten pumpkins (N2-1), each new monster, the Lamplighter (both forms),
    the Protector Gourd (N2-5) and the Fallen Poltergeist."""
    if not R5: return
    page, errors = open_page(browser, url)
    n2_open_all(page)
    page.evaluate("() => { window.__gg.save.seenIntro = { quests:true, gourd:true, fog:true }; }")   # the Grave Gourd's card was shown on N1-5, the fog card in world 2
    txt = page.evaluate("""() => { const g = window.__gg; g.openPreview(1101); document.querySelector('#bPvGo').click();
      return [document.querySelector('#inTitle').textContent, document.querySelector('#inText').textContent]; }""")
    ok(txt[0] == 'Poison fog' and 'rotten' in txt[1] and 'row' in txt[1], f'the poison card says the fog rots what lies under it, a row or column at a time {txt}')
    page.evaluate("() => { window.__gg.save.seenIntro = { quests:true, gourd:true, fog:true }; }")
    t = {k: n2_intro_titles(page, 1100 + k) for k in (1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 16)}
    ok('Poison fog' in t[1] and 'Rotten pumpkins' in t[1], f'N2-1 explains poison fog and rotten pumpkins {t[1]}')
    ok(not any(x in ('Poison fog', 'Rotten pumpkins') for k in (2, 3, 4, 5) for x in t[k]), 'later levels do not repeat them')
    for k, name in ((2, 'Reaper'), (3, 'Plague Doctor 2'), (6, 'Fogwalker 2'), (7, 'Wisp Rider 2'), (8, 'Poltergeist 2')):
        ok(any(x.startswith('New monster') and name in x for x in t[k]), f'N2-{k} introduces the {name} {t[k]}')
    ok(any('Lamplighter' in x and 'full form' not in x for x in t[4]), f'N2-4 introduces the Lamplighter {t[4]}')
    ok(any('Protector Gourd' in x for x in t[5]), f'N2-5 explains the Protector Gourd {t[5]}')
    ok(not t[9], f'N2-9 brings nothing new {t[9]}')
    ok(any('Lamplighter' in x and 'full form' in x for x in t[13]), f'N2-13 shows the Lamplighter\'s form-2 card {t[13]}')
    ok(any('Fallen Poltergeist' in x for x in t[16]), f'N2-16 introduces the Fallen Poltergeist {t[16]}')
    rt = page.evaluate("() => { const g = window.__gg; g.save.seenIntro = { quests:true, gourd:true, fog:true, poison:true }; g.openPreview(1101); document.querySelector('#bPvGo').click(); return document.querySelector('#inText').textContent; }")
    ok('heal' in rt and 'Plague Doctor 2' in rt, f'the rot card says a rotten pumpkin heals what it hits, and names the Plague Doctor 2\'s square ({rt[:90]}...)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_n2_bestiary(browser, url):
    """The hollow nightmare book's bestiary (Release 5): the new monsters in first-met order with their companions, the Lamplighter, and the
    Fallen Poltergeist last; story monsters are not repeated. A page whose gate is shut has no bestiary button."""
    if not R5: return
    page, errors = open_page(browser, url)
    # the gate shut (2-20 beaten, N1-4 not): no flip button
    set_stars(page, story_done())
    page.evaluate("() => window.__gg.openBook(1)"); time.sleep(0.6)
    page.click('#bBookmark'); time.sleep(0.8)
    ok(page.evaluate("() => document.querySelector('#bBkFlip').hidden"), 'a world 2 nightmare page with its gate shut hides the bestiary button')
    page.evaluate("() => window.__gg.openBook(1)"); time.sleep(0.4)
    # N2-1 to N2-3 open: the Reaper, its crow and Plague Doctor 2 have been met
    set_stars(page, {**story_done(), 1004: 3, 1101: 3, 1102: 3})
    page.evaluate("() => window.__gg.openBook(1)"); time.sleep(0.6)
    if page.evaluate("() => !document.querySelector('#spread').classList.contains('nightmare')"): page.click('#bBookmark')
    time.sleep(0.8)
    ok(page.evaluate("() => !document.querySelector('#bBkFlip').hidden"), 'with the gate open the page has a Bestiary button')
    page.click('#bBkFlip'); time.sleep(0.7)
    b = page.evaluate("() => [document.querySelector('#bsTitle').textContent, [...document.querySelectorAll('#bestiary .bs')].map(e => [e.classList.contains('unmet'), e.querySelector('b').textContent, e.querySelector('.ab').textContent, (e.querySelector('.lo') || {}).textContent || ''])]")
    ok('Nightmare' in b[0] and 'Foggy Hollow' in b[0], f'the page is titled as the hollow nightmare edition ({b[0]!r})')
    met = [x[1] for x in b[1] if not x[0]]
    ok(met == ['Reaper', 'Crow', 'Plague Doctor 2'], f'met so far, in order: the Reaper, its crow, Plague Doctor 2 {met}')
    ok(all(x[2] and x[3] for x in b[1] if not x[0]), 'each met entry has an ability and a lore line')
    ok(len(b[1]) == 9 and all(x[0] for x in b[1][3:]), f'nine entries, the rest unmet silhouettes ({len(b[1])})')
    ok(page.evaluate("() => document.querySelector('#bsCount').textContent").startswith('3 of 9'), f"three of nine met ({page.evaluate('() => document.querySelector(`#bsCount`).textContent')})")
    # everything open: the whole list by name
    n2_open_all(page)
    page.evaluate("() => window.__gg.openBook(1)"); time.sleep(0.6)
    if page.evaluate("() => !document.querySelector('#spread').classList.contains('nightmare')"): page.click('#bBookmark')
    time.sleep(0.8)
    page.evaluate("() => { if (document.querySelector('#bestiary').hidden) document.querySelector('#bBkFlip').click(); }"); time.sleep(0.7)
    names = page.evaluate("() => [...document.querySelectorAll('#bestiary .bs')].map(e => e.classList.contains('unmet') ? null : e.querySelector('b').textContent)")
    want = ['Reaper', 'Crow', 'Plague Doctor 2', 'The Lamplighter', 'Fogwalker 2', 'Mossback', 'Wisp Rider 2', 'Poltergeist 2', 'The Fallen Poltergeist']
    ok(names == want, f'the full list in first-met order, the Fallen Poltergeist last {names}')
    ok(not any(n in names for n in ('Bog Ghoul', 'Wisp', 'Wraith', 'Marsh Imp', 'Swift Bat')), 'story monsters are not repeated')
    page.evaluate("() => window.__gg.openBook(0)"); time.sleep(0.6)
    if page.evaluate("() => !document.querySelector('#spread').classList.contains('nightmare')"): page.click('#bBookmark')
    time.sleep(0.8)
    page.evaluate("() => { if (document.querySelector('#bestiary').hidden) document.querySelector('#bBkFlip').click(); }"); time.sleep(0.7)
    w1 = page.evaluate("() => [...document.querySelectorAll('#bestiary .bs b')].map(e => e.textContent)")
    ok(w1 and w1[-1] == 'The Fallen Gravekeeper' and 'Reaper' not in w1, f'the world 1 nightmare bestiary is unchanged (ends on the Fallen Gravekeeper, no Reaper) {w1[-2:]}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_n2_prebake(browser, url):
    """Each level bakes what it can spawn when its night starts: its pool, what those monsters bring (the Reaper's crow, Fogwalker 2's
    Mossbacks, the comet's Wisp and Imp) and its boss; every night starts and runs a moment without a page error."""
    if not R5: return
    page, errors = open_page(browser, url)
    L = page.evaluate(N2_LEVELS_JS)
    page.evaluate("() => { window.__gg.save.gourds = { grave:true, protector:true }; }")
    missing = []
    for k, d in enumerate(L, 1):
        page.reload(); page.wait_for_function('() => !!window.__gg'); time.sleep(0.3)   # a fresh atlas cache: what is baked is this night's
        page.evaluate("() => { Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true }); window.__gg.save.gourds = { grave:true, protector:true }; }")
        nm2_start(page, k)
        want = {t for t in d['pool'] if t in N2_NEW or t == 'crow'} | {a for t in d['pool'] for a in N2_ALSO.get(t, [])} | ({d['boss']} if d['boss'] else set())
        got = page.evaluate("(ks) => ks.filter(k => !window.__gg.isBaked(k) && !window.__gg.isBaked(k + '|form2'))", sorted(want))   # a form-2 boss bakes as kind|form2
        if got: missing.append((k, got))
        time.sleep(0.4)
    ok(not missing, f'every level bakes its new monsters, what they bring and its boss at night start {missing}')
    ok('reaper' in L[1]['pool'] and 'crow' not in L[1]['pool'], f"N2-2's crows come only out of its Reapers (so its crow is baked through ALSO_BAKE) {L[1]['pool']}")
    ok(not errors, f'no page errors on any night {errors[:2]}')
    page.close()


CHECKS.update({'check_n2_levels': check_n2_levels, 'check_n2_intros': check_n2_intros, 'check_n2_bestiary': check_n2_bestiary, 'check_n2_prebake': check_n2_prebake})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--expect', choices=['on', 'r8', 'r7', 'r6', 'r5', 'r4', 'r3', 'r2', 'off'], required=True)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    global R5, MODE, BUILD
    BUILD = a.expect
    if a.expect == 'r8': a.expect = 'on'; from nm5_check import check_r9_absent; CHECKS['check_r9_absent'] = check_r9_absent   # a Release 8 build holds everything up to Release 8: these checks run as `on`, plus the Release 9 absence check
    if a.expect == 'r7': a.expect = 'on'; from nm4_check import check_r8_absent; CHECKS['check_r8_absent'] = check_r8_absent   # a Release 7 build holds everything up to Release 7: these checks run as `on`, plus the Release 8 absence check
    if a.expect in ('r6', 'r5'): a.expect = 'on'; CHECKS['check_r7_absent'] = check_r7_absent   # a Release 5 or 6 build holds everything up to that release: these checks run as `on`, plus the Release 7 absence check
    MODE = a.expect; R5 = a.expect == 'on'
    with sync_playwright() as p:
        browser = p.chromium.launch(args=os.environ.get('GG_CHROME_ARGS', '').split())   # e.g. GG_CHROME_ARGS=--disable-gpu when the headless GPU process hangs (a sleeping Mac)
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
