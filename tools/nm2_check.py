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
