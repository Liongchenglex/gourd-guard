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

R5 = False   # set by --expect: the build holds Release 5 (playtest)
MODE = 'on'


def nm2_start(page, k, coach=False):
    """Start Nightmare 2-k (night 1100 + k). The Release 4 gourd coach is marked seen unless coach=True, so the other checks get a plain night."""
    if not coach: page.evaluate("() => { window.__gg.save.seenGourdCoach = true; }")
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
    ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") == 2, 'NIGHTMARE_LEVELS holds the patch and the hollow tables')
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
        ok(sum(1 for b in pg if 'Coming soon' in b[1]) == 15, 'the 15 levels not built yet read "Coming soon"')
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
        page.evaluate("() => window.__gg.poisonNow()")
        w = page.evaluate("() => { const w = window.__gg.G.poison.warn; return [w.dir, w.idx, w.t]; }")
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
    ok(page.evaluate("() => window.__gg.poisonNow({ dir:'col', idx:[0, 6] })") is True, 'poisonNow takes a given line set')
    ok(page.evaluate("() => { const w = window.__gg.G.poison.warn; return [w.dir, w.idx, w.dur, w.t]; }") == ['col', [0, 6], 2, 1.5], 'with the 1.5 s warning and the level\'s dur')
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


CHECKS.update({'check_poison_cycle': check_poison_cycle, 'check_poison_lines': check_poison_lines, 'check_poison_protect': check_poison_protect,
               'check_poison_landing': check_poison_landing, 'check_poison_continue': check_poison_continue, 'check_poison_budget': check_poison_budget})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--expect', choices=['on', 'r4', 'r3', 'r2', 'off'], required=True)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    global R5, MODE
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
