"""Release 4 checks (Nightmare Pumpkin Patch, docs/superpowers/specs/2026-11-04-release-4-nightmare-patch-design.md),
against a build served by tools/serve_dist.py.
  Playtest build:  npm run build:playtest            then  .venv/bin/python tools/nm_check.py --url http://127.0.0.1:4173/ --expect on
  Release 3 build: VITE_RELEASE=3 npx vite build      then  ... --expect r3   (nothing from Release 4)
  Store build:     npm run build                      then  ... --expect off
Checks read the global R4 (on only). Exits 1 on any failure. --only runs one check by name."""
import argparse, sys, time
from playwright.sync_api import sync_playwright

from w6_check import open_page, ok, FAILS, start, bundle_js, set_stars

R4 = False   # set by --expect: the build holds Release 4 (playtest)
MODE = 'on'


def nm_start(page, k, coach=False):
    """Start Nightmare 1-k (night 1000 + k). The gourd tutorial on N1-5 is marked seen unless coach=True, so the other checks get a plain night."""
    if not coach: page.evaluate("() => { window.__gg.save.seenGourdCoach = true; }")
    start(page, 1000 + k)


def story_done(upto=20):
    return {n: 3 for n in range(1, upto + 1)}


# ---------- Task 1: the track, the book page and the release checks ----------
def check_r4_absent(browser, url):
    js = bundle_js()
    for s in ('Embers', 'Cockcrow', 'Burnt Offerings', 'Wildfire!', 'Cinder Rooster', 'Hayrick', 'Corn Husker', 'Strawlord', 'Grave Gourd', 'e3a43c', 'around your gourd', 'Grave Riser'):
        ok((s in js) == R4, f"{s!r} {'in' if R4 else 'not in'} the bundle")


def check_nm_track(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    set_stars(page, {20: 0})
    ok(page.evaluate("() => window.__gg.isOpen(1001)") is False, 'N1-1 stays shut until 1-20 is beaten')
    set_stars(page, {20: 3})
    ok(page.evaluate("() => window.__gg.isOpen(1001)") is True, 'N1-1 opens once 1-20 is beaten')
    ok(page.evaluate("() => window.__gg.isOpen(1002)") is False, 'N1-2 stays shut until N1-1 is beaten')
    ok(page.evaluate("() => [window.__gg.NM_BASE, window.__gg.nmNight(1, 5), window.__gg.nmNight(2, 1)]") == [1000, 1005, 1101], 'night numbers: NM_BASE 1000, nmNight(1, 5) = 1005, nmNight(2, 1) = 1101')
    ok(page.evaluate("() => window.__gg.isOpen(1000 + window.__gg.NIGHTMARE_LEVELS[0].length + 1)") is False, 'a night past the nightmare data is not open')
    nm_start(page, 1)
    d = page.evaluate("() => { const G = window.__gg.G; return [G.def.label, G.def.nightmare, G.world, G.n]; }")
    ok(d == ['N1-1', True, 6, 1001], f'N1-1 starts as label N1-1, a nightmare night on the nightmare map (theme 6) {d}')
    set_stars(page, story_done())
    page.evaluate("() => window.__gg.openBook(0)"); time.sleep(0.6)
    page.click('#bBookmark'); time.sleep(0.8)
    pg = page.evaluate("() => [...document.querySelectorAll('#bkLevels .pg')].map(b => [b.disabled, b.textContent])")
    soon = page.evaluate("() => document.querySelector('#bkSoon').hidden")
    grid = page.evaluate("() => document.querySelector('#bkLevels').hidden")
    ok(len(pg) == 16, f'the nightmare page shows 16 level stamps ({len(pg)})')
    ok(soon and not grid, f'the nightmare page hides "Coming soon" and shows the stamps (bkSoon hidden={soon}, bkLevels hidden={grid})')
    if len(pg) == 16:
        ok(pg[15][0] and 'Coming soon' in pg[15][1], f'the 16th stamp is a disabled "Coming soon" {pg[15]}')
        ok(not pg[0][0] and all(b[0] for b in pg[1:]), 'only N1-1 is open on a fresh nightmare track')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_nm_story_rules(browser, url):
    page, errors = open_page(browser, url)
    if not R4:
        ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS.length") == 0, 'no nightmare levels below Release 4')
        set_stars(page, story_done())
        page.evaluate("() => window.__gg.openBook(0)"); time.sleep(0.6)
        page.click('#bBookmark'); time.sleep(0.8)
        soon = page.evaluate("() => !document.querySelector('#bkSoon').hidden && document.querySelector('#bkLevels').hidden")
        ok(soon, 'the nightmare page still says "Coming soon"')
        ok(not errors, f'no page errors {errors[:2]}')
        page.close(); return
    set_stars(page, {**story_done(), **{1000 + k: 3 for k in range(1, 10)}})
    page.evaluate("() => window.__gg.openPreview(1001)"); time.sleep(0.6)
    ok(not errors, f'the N1-1 preview opens without errors {errors[:2]}')
    title = page.evaluate("() => document.querySelector('#pvTitle').textContent")
    ok('1-1' in title and 'Nightmare' in title, f'the preview names the nightmare level ({title!r})')
    nm_start(page, 10)
    page.evaluate("() => window.__gg.endGame(true)"); time.sleep(1.8)
    t = page.evaluate("() => [window.__gg.state, document.querySelector('#rTitle').textContent, [...document.querySelectorAll('#rBtns button')].map(b => b.textContent)]")
    ok(t[0] == 'result' and 'unlocked!' not in t[1], f'winning N1-10 shows no world-unlocked card {t[:2]}')
    ok(page.evaluate("() => window.__gg.save.stars[1011]") is None, 'winning N1-10 does not award N1-11 stars')
    ok(page.evaluate("() => window.__gg.save.stars[1010] > 0"), 'winning N1-10 earns its stars')
    ok(page.evaluate("() => window.__gg.save.coins") < 1000, f"the night bonus is not scaled by the night number ({page.evaluate('() => window.__gg.save.coins')} coins)")
    ok('Next level' in t[2], f'the result offers Next level {t[2]}')
    if 'Next level' in t[2]:
        page.click('#rBtns button:has-text("Next level")'); time.sleep(0.6)
        pv = page.evaluate("() => [window.__gg.state, document.querySelector('#pvTitle').textContent]")
        ok(pv[0] == 'preview' and '1-11' in pv[1], f'Next level opens N1-11 {pv}')
    # Levels returns to world 1's book with nightmare mode kept on
    nm_start(page, 10)
    page.evaluate("() => window.__gg.endGame(true)"); time.sleep(1.8)
    page.click('#rBtns button:has-text("Levels")'); time.sleep(0.8)
    nm = page.evaluate("() => [document.querySelector('#spread').classList.contains('nightmare'), document.querySelector('#bkLevels .pg') && document.querySelectorAll('#bkLevels .pg').length]")
    ok(nm == [True, 16], f'Levels returns to the nightmare page {nm}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS = {'check_r4_absent': check_r4_absent, 'check_nm_track': check_nm_track, 'check_nm_story_rules': check_nm_story_rules}


# ---------- Task 2: fire tiles and fire marks ----------
# A pumpkin pushed straight into the projectile list, shaped like the ones launchGroup makes (type = PTYPES index: 0 Green, 2 Ice, 4 Grey, 6 White, 7 Black).
SHOOT = """(type, lane) => { const g = window.__gg, G = g.G;
  const pr = { x:g.LANE(lane), y:g.fieldY(1) + 60, vy:-900, type, vis:type, lv:1, guar:false, lane, hitWalls:new Set(), grp:{ spawned:false, small:false, kills:0 }, size:1, rot:0, spin:9, hit:new Set(), trail:[], r:16, dead:false };
  G.projs.push(pr);
  const F0 = g.fieldY(0), F1 = g.fieldY(1);
  return new Promise(res => { let minP = 9; const t0 = performance.now();
    const f = () => { if (!pr.dead && G.projs.includes(pr) && performance.now() - t0 < 3000){ minP = Math.min(minP, (pr.y - F0) / (F1 - F0)); requestAnimationFrame(f); } else setTimeout(() => res([minP, !!pr.dead, !!pr.burned]), 50); };
    f(); }); }"""
QUIET = "() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.projs.length = 0; G.fires.length = 0; G.fmNext = 99; g.grid.forEach(r => r.fill(null)); }"


def fire_night(page):
    nm_start(page, 1)
    page.evaluate(QUIET)


def shoot(page, typ, lane):
    return page.evaluate(f"([t, l]) => ({SHOOT})(t, l)", [typ, lane])


def ghoul(page, lane, p, hp=50):
    """A still ghoul with plenty of health; returns its index in G.monsters."""
    return page.evaluate("([l, p, hp]) => { const g = window.__gg, m = g.spawnMonster('ghoul', l, true, p); m.sp = 0; m.hp = m.maxHp = hp; return g.G.monsters.indexOf(m); }", [lane, p, hp])


def check_fire_basic(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    fp = page.evaluate("() => { const g = window.__gg; g.lightFire(3, 0.5); return g.G.fires.length === 1 ? g.G.fires[0].p : null; }")
    tp = page.evaluate("() => window.__gg.TILE_P()")
    ok(fp is not None and abs(fp - (int(0.5 / tp) + 0.5) * tp) < 1e-9, f'lightFire(3, 0.5) lights one tile snapped to its tile-row centre (p {fp}, tile {tp:.3f})')
    ok(page.evaluate("() => window.__gg.lightFire(3, 0.5)") is False, 'lighting a tile that already burns returns false')
    ok(page.evaluate("() => !!window.__gg.fireAt(3, 0.5) && !window.__gg.fireAt(2, 0.5)"), 'fireAt finds the burning tile and nothing in the next lane')
    missed = page.evaluate("() => window.__gg.G.missed")
    r = shoot(page, 0, 3)
    ok(r[1] and r[2] and r[0] > 0.45 and r[0] > fp, f'a Green burns up in the fire and never flies past it (min p {r[0]:.3f}, fire at {fp:.3f}) {r}')
    ok(page.evaluate("() => window.__gg.G.fires.length") == 1, 'the fire stays after a Green burns in it')
    ok(page.evaluate("() => window.__gg.G.missed") == missed, 'a pumpkin that burns is not a miss')
    r = shoot(page, 0, 1)
    ok(r[0] < 0.05 and not r[2] and page.evaluate("() => window.__gg.G.missed") == missed + 1, f'control: a Green in a lane with no fire flies to the top and is a miss {r}')
    out0 = page.evaluate("() => window.__gg.G.q.fireOut")
    r = shoot(page, 2, 3)
    ok(r[1] and r[0] > 0.45 and r[0] > fp, f'an Ice stops at the fire (min p {r[0]:.3f}) {r}')
    ok(page.evaluate("() => window.__gg.G.fires.length") == 0, 'the Ice puts the fire out')
    ok(page.evaluate("() => window.__gg.G.q.fireOut") == out0 + 1, 'G.q.fireOut counts the fire Ice put out')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fire_order(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    page.evaluate("() => window.__gg.lightFire(3, 0.5)")
    i = ghoul(page, 3, 0.7)
    shoot(page, 0, 3)
    r = page.evaluate(f"() => [window.__gg.G.monsters[{i}].hp, window.__gg.G.fires.length]")
    ok(r[0] < 50 and r[1] == 1, f'a ghoul in front of the fire is hit by a Green and the fire stays {r}')
    page.evaluate(QUIET); page.evaluate("() => window.__gg.lightFire(3, 0.5)")
    i = ghoul(page, 3, 0.3)
    r = shoot(page, 4, 3)
    hp = page.evaluate(f"() => window.__gg.G.monsters[{i}].hp")
    ok(r[2] and hp == 50, f'a Grey burns at the fire: the ghoul behind it takes no damage (hp {hp}) {r}')
    ok(page.evaluate("() => window.__gg.G.fires.length") == 1, 'Grey does not put the fire out')
    page.evaluate(QUIET); page.evaluate("() => window.__gg.lightFire(3, 0.5)")
    cells = "() => window.__gg.grid.flat().filter(Boolean).length"
    n0, missed = page.evaluate(cells), page.evaluate("() => window.__gg.G.missed")
    r = shoot(page, 6, 3); time.sleep(0.8)
    ok(r[2] and page.evaluate(cells) == n0 and page.evaluate("() => window.__gg.G.missed") == missed, f'a White that burns does not come back and is not a miss {r}')
    r = shoot(page, 6, 1); time.sleep(0.8)
    ok(page.evaluate(cells) == n0 + 1, 'control: a White with no fire in its lane comes back to the patch')
    page.evaluate(QUIET); page.evaluate("() => window.__gg.lightFire(3, 0.5)")
    fp = page.evaluate("() => window.__gg.G.fires[0].p")
    a, b = ghoul(page, 4, fp), ghoul(page, 3, 0.3)
    r = shoot(page, 7, 3)
    hps = page.evaluate(f"() => [window.__gg.G.monsters[{a}].hp, window.__gg.G.monsters[{b}].hp]")
    ok(r[2] and hps == [50, 50], f'a Black that burns does no splash {hps} {r}')
    # Review fix: a fire lit behind a pumpkin already in flight past that tile does not burn it in mid-air
    page.evaluate(QUIET)
    r = page.evaluate(f"""() => {{ const g = window.__gg, G = g.G, F0 = g.fieldY(0), F1 = g.fieldY(1);
      const done = ({SHOOT})(0, 3), pr = G.projs[G.projs.length - 1];
      return new Promise(res => {{ const wait = () => {{ if ((pr.y - F0) / (F1 - F0) > 0.2 && !pr.dead) return requestAnimationFrame(wait);
        g.lightFire(3, 0.6); const at = (pr.y - F0) / (F1 - F0); done.then(v => res([at, ...v, G.fires.length])); }}; wait(); }}); }}""")
    ok(r[0] <= 0.2 and not r[3] and r[1] < 0.05 and r[4] == 1, f'a fire lit at p 0.6 behind a pumpkin in flight at p {r[0]:.2f} lets it fly on (min p {r[1]:.2f}, burned {r[3]}, fires {r[4]})')
    r = shoot(page, 0, 3)
    ok(r[2] and r[0] > 0.6, f'the next pumpkin up lane 3 still burns in that fire {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fire_marks(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    page.evaluate("""() => { const G = window.__gg.G; G.def.total = 20; G.total = 20; G.def.fireMarks = [{ at:0.5, n:3 }]; G.fmNext = 0; window.__gg.updateHud(true); }""")
    time.sleep(0.2)
    m = page.evaluate("() => [...document.querySelectorAll('.fmMark')].map(e => [Math.round(parseFloat(e.style.left)), e.classList.contains('live'), e.classList.contains('done')])")
    ok(m == [[50, False, False]], f'one fire mark on the spawn bar at 50% {m}')
    page.evaluate("() => { const G = window.__gg.G; G.spawned = 9; G.spawnTimer = 0; }")
    s = page.evaluate("""() => new Promise(res => { const G = window.__gg.G, out = []; const t0 = performance.now();
      const id = setInterval(() => { out.push([performance.now() - t0, G.spawned, G.monsters.filter(m => m.minion && !m.dead).length, G.fireBurst || 0, G.fires.length, G.fmNext, !!document.querySelector('.fmMark.live')]); if (performance.now() - t0 > 1600){ clearInterval(id); res(out); } }, 25); })""")
    ok(any(x[4] == 3 for x in s), f'the mark lights 3 fire tiles (fires seen {sorted(set(x[4] for x in s))})')
    first = next((x for x in s if x[4] == 3), None)
    ok(first is not None and first[1] == 10, f'the mark drops when 10 of 20 have spawned {first}')
    during = [x for x in s if x[3] > 0]
    ok(during and all(x[1] == 10 for x in during), f'G.spawned stays at 10 while the burst runs {[x[1] for x in during]}')
    mins = max(x[2] for x in s)
    ok(4 <= mins <= 6, f'4 to 6 burst monsters arrive, flagged minion ({mins})')
    ok(s[-1][3] == 0 and s[-1][5] == 1, f'the burst is over within 1.5 s and fmNext is 1 {s[-1][:6]}')
    ok(any(x[6] for x in s if x[5] == 1), 'the mark pulses (live) when it fires')
    time.sleep(1.5)
    m = page.evaluate("() => [...document.querySelectorAll('.fmMark')].map(e => [e.classList.contains('live'), e.classList.contains('done')])")
    ok(m == [[False, True]], f'the mark dims once it has fired {m}')
    prog = page.evaluate("() => parseFloat(document.querySelector('#prog').style.width)")
    ok(abs(prog - 100 * page.evaluate("() => Math.min(window.__gg.G.spawned, 20) / 20")) < 1, f'the bar counts arrivals on a fire-mark night ({prog}%)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_nm_continue(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    page.evaluate("() => { const g = window.__gg; g.lightFire(1, 0.4); g.lightFire(5, 0.6); g.G.fmNext = 1; g.G.spawned = 5; }")
    before = page.evaluate("() => window.__gg.G.fires.map(f => [f.lane, f.p]).sort()")
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); g.continueNight(c); }"); time.sleep(0.3)
    after = page.evaluate("() => [window.__gg.G.fires.map(f => [f.lane, f.p]).sort(), window.__gg.G.fmNext, window.__gg.G.continued]")
    ok(after[0] == before and len(before) == 2, f'a continued night keeps both burning tiles {before} -> {after[0]}')
    ok(after[1] == 1 and after[2], f'a continued night keeps the fire marks already passed (fmNext {after[1]})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_fire_budget(browser, url):
    """Extends check_draw_budget (tools/w6_check.py) to fire: 20 burning tiles cost at most one canvas call each and no strokes or new gradients."""
    if not R4: return
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("""(() => { const P = CanvasRenderingContext2D.prototype; window.__cc = {}; window.__ccOn = false;
      for (const k of ['drawImage', 'fill', 'stroke', 'fillRect', 'fillText', 'strokeText', 'createRadialGradient', 'createLinearGradient']) { const f = P[k]; P[k] = function(...a){ if (window.__ccOn && this.canvas && this.canvas.id === 'cv') window.__cc[k] = (window.__cc[k] || 0) + 1; return f.apply(this, a); }; } })();""")
    page.goto(url + ('&test' if '?' in url else '?test')); page.wait_for_function('() => !!window.__gg'); time.sleep(0.5)
    page.evaluate("() => Object.assign(window.__gg.save, { seenHelp:true, seenFlick:true })")
    nm_start(page, 1); time.sleep(3.2)
    page.evaluate(QUIET); time.sleep(1.2)
    count = "() => new Promise(res => { window.__cc = {}; window.__ccOn = true; let f = 0; const tick = () => { if (++f < 30) requestAnimationFrame(tick); else { window.__ccOn = false; const c = window.__cc, tot = Object.values(c).reduce((a, b) => a + b, 0); res([tot / 30, (c.stroke || 0) / 30, ((c.createRadialGradient || 0) + (c.createLinearGradient || 0)) / 30]); } }; requestAnimationFrame(tick); })"
    base = page.evaluate(count)
    n = page.evaluate("() => { const g = window.__gg, tp = g.TILE_P(); let n = 0; for (const row of [2, 3, 4]) for (let l = 0; l < 7 && n < 20; l++) if (g.lightFire(l, (row + 0.5) * tp)) n++; return n; }")
    time.sleep(1.5)
    lit = page.evaluate(count)
    ok(n == 20, f'20 fires lit ({n})')
    ok(lit[0] - base[0] <= 20.5, f'20 fires cost at most 20 canvas calls a frame ({base[0]:.1f} -> {lit[0]:.1f})')
    ok(lit[1] <= base[1] + 0.1 and lit[1] <= 40 and lit[2] <= base[2] + 0.1 and lit[2] <= 2, f'fires add no strokes or gradients (strokes {base[1]:.1f} -> {lit[1]:.1f}, gradients {base[2]:.1f} -> {lit[2]:.1f})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_fire_basic': check_fire_basic, 'check_fire_order': check_fire_order, 'check_fire_marks': check_fire_marks, 'check_nm_continue': check_nm_continue, 'check_fire_budget': check_fire_budget})


# ---------- Task 3: burning monsters ----------
def check_burn_walk(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    page.evaluate("() => window.__gg.lightFire(2, 0.5)")
    page.evaluate("""() => { const g = window.__gg; window.__m = g.spawnMonster('mummy', 2, true, 0.4); window.__m.hp = 2; window.__c = g.spawnMonster('mummy', 4, true, 0.4); }""")
    t0 = time.time(); t = None
    while time.time() - t0 < 3:
        if page.evaluate("() => window.__m.type") == 'firemummy': t = time.time() - t0; break
        time.sleep(0.05)
    ok(t is not None, f'a mummy walking onto a fire tile becomes a firemummy within 3 s ({t})')
    ok(page.evaluate("() => window.__c.type") == 'mummy', 'control: a mummy in a lane with no fire stays a mummy')
    ok(page.evaluate("() => window.__m.hp") == 2, 'it keeps its health')
    ok(page.evaluate("() => window.__gg.G.fires.length") == 1, 'the fire stays')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def ice_only_run(page, typ, label):
    """A burning type is Ice-only: a Green hit for 999 leaves it down for its rise time, it stands up with 1 health, an Ice hit kills it."""
    page.evaluate(f"() => {{ const g = window.__gg; window.__m = g.spawnMonster('{typ}', 3, true, 0.3); window.__m.sp = 0; window.__m.lastHit = 0; g.damage(window.__m, 999, '#8fae78'); }}")
    r = page.evaluate("() => [window.__m.dead, window.__m.rise, window.__m.hp]")
    ok(r[0] is False and r[1] > 0, f'a Green hit for 999 leaves a {label} down (dead {r[0]}, rise {r[1]})')
    time.sleep(4.6)
    r = page.evaluate("() => [window.__m.dead, window.__m.rise, window.__m.hp]")
    ok(r == [False, 0, 1], f'it rises with 1 health {r}')
    page.evaluate("() => { const g = window.__gg; window.__m.lastHit = 2; g.damage(window.__m, 999, '#9ad8ff'); }")
    ok(page.evaluate("() => window.__m.dead"), 'an Ice hit kills it')


def check_ice_only(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    ice_only_run(page, 'firemummy', 'firemummy')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_ice_lock(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    set_stars(page, story_done(70))   # enough pumpkins that the loadout screen opens (it skips the picker with 5 or fewer)
    def musts(fire):
        return page.evaluate("""(fire) => { const g = window.__gg, d = g.NIGHTMARE_LEVELS[0][0]; const old = d.fireStart; d.fireStart = fire; document.querySelectorAll('.ov').forEach(o => o.classList.remove('show'));
          g.beginNight(1001); d.fireStart = old;
          return new Promise(res => setTimeout(() => res([...document.querySelectorAll('#loTeam .slot.must')].map(b => b.getAttribute('aria-label'))), 400)); }""", fire)
    r = musts(3)
    ok(any(x.startswith('Ice') for x in r), f'a level with fireStart > 0 locks Ice into the loadout {r}')
    page.reload(); page.wait_for_function('() => !!window.__gg'); set_stars(page, story_done(70))
    r = musts(0)
    ok(not any(x.startswith('Ice') for x in r), f'control: a nightmare level with no fire does not lock Ice {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_burn_walk': check_burn_walk, 'check_ice_only': check_ice_only, 'check_ice_lock': check_ice_lock})


# ---------- Task 4: the Cinder Rooster ----------
def check_rooster(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    page.evaluate("""() => { const g = window.__gg;
      window.__r = g.spawnMonster('rooster', 3, true, 0.3); window.__r.sp = 0;
      window.__gh = [2, 3, 4, 6].map(l => { const m = g.spawnMonster('ghoul', l, true, 0.5); m.sp = 0; m.hp = m.maxHp = 50; return m; });  }""")
    ok(page.evaluate("() => window.__gg.TYPES.rooster.crowEvery") == 8, 'the rooster crows every 8 s (data)')
    time.sleep(8.5)
    r = page.evaluate("() => window.__gh.map(m => m.rush > 0)")
    ok(r == [True, True, True, False], f'8.5 s on: ghouls in lanes 2, 3 and 4 are rushing, the one in lane 6 is not {r}')
    time.sleep(2)
    ok(page.evaluate("() => window.__gh.every(m => !(m.rush > 0))"), 'the rush wears off after about 2 s')
    # speed: a rushing ghoul walks 1.6x as fast
    page.evaluate("() => { const m = window.__gh[1]; m.sp = 0.05; m.p = 0.3; m.rush = 0; window.__p0 = m.p; }")
    time.sleep(1.0); a = page.evaluate("() => window.__gh[1].p - window.__p0")
    page.evaluate("() => { const m = window.__gh[1]; m.p = 0.3; m.rush = 5; window.__p0 = m.p; }")
    time.sleep(1.0); b = page.evaluate("() => window.__gh[1].p - window.__p0")
    ok(a > 0.02 and 1.4 < b / a < 1.8, f'a rushing ghoul walks about 1.6x as fast (calm {a:.3f}, rushing {b:.3f}, ratio {b / a:.2f})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_rooster_frozen(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    page.evaluate("""() => { const g = window.__gg;
      window.__r = g.spawnMonster('rooster', 3, true, 0.3); window.__r.sp = 0; window.__r.frozenT = 7.9;
      window.__gh = [2, 3, 4].map(l => { const m = g.spawnMonster('ghoul', l, true, 0.5); m.sp = 0; m.hp = m.maxHp = 50; return m; }); }""")
    time.sleep(7.2)
    ok(page.evaluate("() => window.__gh.every(m => !(m.rush > 0))") and page.evaluate("() => window.__r.frozenT") > 0, 'a rooster frozen for its crow time sets no rush')
    time.sleep(1.6)
    ok(page.evaluate("() => window.__gh.every(m => !(m.rush > 0))"), 'its timer did not tick while it was frozen, so it still has not crowed once it thaws')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_rooster_fire(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    r = page.evaluate("""() => { const g = window.__gg, m = g.spawnMonster('rooster', 4, true, 0.45); m.sp = 0; m.lastHit = 0; const p = m.p;
      g.damage(m, 99, '#8fae78'); return [m.dead, !!g.fireAt(4, p), g.G.fires.length]; }""")
    ok(r == [True, True, 1], f'a damage(r, 99) kill leaves a fire tile where it stood {r}')
    r = page.evaluate("""() => { const g = window.__gg, G = g.G; G.fires.length = 0; const m = g.spawnMonster('rooster', 1, true, 0.45); m.sp = 0; m.hp = 1; m.lastHit = 3;
      g.burnMonster && g.burnMonster(m); const p = m.p; g.damage(m, 99, '#ff9a4a', true); return [m.dead, !!g.fireAt(1, p)]; }""")
    ok(r == [True, True], f'a rooster that dies to burn damage leaves fire too {r}')
    r = page.evaluate("""() => { const g = window.__gg, G = g.G; G.fires.length = 0; const m = g.spawnMonster('ghoul', 5, true, 0.45); m.sp = 0; m.lastHit = 0; g.damage(m, 99, '#8fae78'); return [m.dead, G.fires.length]; }""")
    ok(r == [True, 0], f'control: a ghoul leaves no fire {r}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_rooster_baked(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { const d = window.__gg.NIGHTMARE_LEVELS[0][0]; d.pool = [...d.pool, ['rooster', 3]]; }")
    nm_start(page, 1)
    ok(page.evaluate("() => window.__gg.isBaked('rooster')"), 'the rooster frames are baked when a night with a rooster in its pool starts')
    ok(page.evaluate("() => { const C = window.__gg.CHARS.rooster; return !!C && !!C.clips.crow && !!C.clips.walk && !!C.clips.chew; }"), 'it has walk, chew and crow clips')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_rooster': check_rooster, 'check_rooster_frozen': check_rooster_frozen, 'check_rooster_fire': check_rooster_fire, 'check_rooster_baked': check_rooster_baked})


# ---------- Task 5: the Hayrick and the Burning Hayrick ----------
def check_hayrick_pin(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    hasGourd = page.evaluate("() => !!window.__gg.isGourd")
    ok(page.evaluate("() => { const T = window.__gg.TYPES; return [T.hayrick.hp, T.hayrick.pinT, T.hayrickBurning.rise]; }") == [8, 4, 4], 'hayrick: 8 health, pins for 4 s; hayrickBurning rises after 4 s (data)')
    page.evaluate("""() => { const g = window.__gg; g.grid[1][2] = g.newCell(0); g.grid[4][2] = g.newCell(1); g.grid[4][5] = g.newCell(0);
      window.__h = g.spawnMonster('hayrick', 2, true, 0.35); window.__h.sp = 0; }""")
    t0 = time.time(); t = None
    while time.time() - t0 < 3:
        if page.evaluate("() => (window.__gg.grid[1][2].pinned || 0)") > 0: t = time.time() - t0; break
        time.sleep(0.05)
    ok(t is not None, f'within 3 s the hayrick pins the first pumpkin the fork meets (nearest the fence), (1, 2) ({t})')
    ok(not (page.evaluate("() => (window.__gg.grid[4][2].pinned || 0)") > 0) and not (page.evaluate("() => (window.__gg.grid[4][5].pinned || 0)") > 0), 'the pumpkin behind it (row 4) and the one in another column are not pinned')
    ok(page.evaluate("() => window.__h.thrown"), 'the hayrick has thrown (m.thrown)')
    ref = "() => window.__gg.grid[1][2]"
    ok(page.evaluate(f"() => window.__gg.slideOne(({ref})(), 'left')") is False, 'slideOne on the pinned pumpkin returns false')
    ok(page.evaluate(f"() => !!window.__gg.grid[1][2] && !window.__gg.grid[1][1]"), 'it stayed in its cell')
    # a push whose line holds the pinned pumpkin is refused too, like a push into a grave
    page.evaluate("() => { const g = window.__gg; g.grid[1][3] = g.newCell(2); }")
    ok(page.evaluate("() => window.__gg.slideOne(window.__gg.grid[1][3], 'left')") is False, 'a neighbour cannot push the pinned pumpkin')
    page.evaluate("() => { window.__gg.grid[1][3] = null; }")
    ok(page.evaluate("() => { const g = window.__gg, c = g.grid[1][2]; return g.bestMove() ? g.bestMove().ref !== c : true; }"), 'bestMove never picks the pinned pumpkin')
    time.sleep(1.5)
    ok(page.evaluate("() => window.__gg.slideOne(window.__gg.grid[1][2], 'left')") is False, 'still pinned 1.5 s later')
    # the pin runs out: 4 s from the throw
    time.sleep(1.6)
    left = page.evaluate("() => (window.__gg.grid[1][2].pinned || 0)")
    ok(0 <= (left or 0) < 1.2, f'the pin counts down in update ({left})')
    time.sleep(1.2)
    ok(page.evaluate("() => window.__gg.slideOne(window.__gg.grid[1][2], 'left')") is True, 'after 4.2 s it slides')
    ok(page.evaluate("() => window.__h.thrown") and page.evaluate("() => !window.__gg.grid.flat().some(c => c && c.pinned > 0)"), 'the hayrick throws once a night: nothing is pinned again')
    if hasGourd:
        page.evaluate(QUIET)
        page.evaluate("""() => { const g = window.__gg; g.grid[0][2] = g.newCell(0); g.grid[0][2].gourd = true; g.grid[1][2] = g.newCell(1);
          window.__h = g.spawnMonster('hayrick', 2, true, 0.35); window.__h.sp = 0; }""")
        time.sleep(1.5)
        ok(page.evaluate("() => !(window.__gg.grid[0][2].pinned > 0) && window.__gg.grid[1][2].pinned > 0"), 'with the gourd at (0, 2) the pin goes to the next pumpkin down the column, (1, 2)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_hayrick_no_target(browser, url):
    """A hayrick with nothing to pin keeps its fork until a pumpkin appears in its column, and a frozen one does not throw."""
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    page.evaluate("() => { const g = window.__gg; window.__h = g.spawnMonster('hayrick', 2, true, 0.35); window.__h.sp = 0; window.__h.frozenT = 2; g.grid[4][2] = g.newCell(0); }")
    time.sleep(1.0)
    ok(not page.evaluate("() => window.__h.thrown"), 'a frozen hayrick does not throw')
    time.sleep(1.6)
    ok(page.evaluate("() => window.__h.thrown") and page.evaluate("() => (window.__gg.grid[4][2].pinned || 0)") > 0, 'once it thaws it throws')
    page.evaluate(QUIET)
    page.evaluate("() => { const g = window.__gg; window.__h = g.spawnMonster('hayrick', 4, true, 0.35); window.__h.sp = 0; }")
    time.sleep(0.6)
    ok(not page.evaluate("() => window.__h.thrown"), 'an empty column: it has not used its fork')
    page.evaluate("() => { const g = window.__gg; g.grid[2][4] = g.newCell(0); }")
    time.sleep(0.8)
    ok(page.evaluate("() => window.__h.thrown && window.__gg.grid[2][4].pinned > 0"), 'a pumpkin sprouting in its column is pinned')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_hayrick_far(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    page.evaluate("() => { const g = window.__gg; g.grid[4][2] = g.newCell(0); window.__h = g.spawnMonster('hayrick', 2, true, 0.1); window.__h.sp = 0; }")
    time.sleep(1.0)
    ok(not page.evaluate("() => window.__h.thrown") and not (page.evaluate("() => (window.__gg.grid[4][2].pinned || 0)") > 0), 'a hayrick still behind p 0.3 does not throw')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_hayrick_burn(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    page.evaluate("() => window.__gg.lightFire(2, 0.5)")
    page.evaluate("""() => { const g = window.__gg; window.__m = g.spawnMonster('hayrick', 2, true, 0.4); window.__m.hp = 5; window.__c = g.spawnMonster('hayrick', 4, true, 0.4); }""")
    t0 = time.time(); t = None
    while time.time() - t0 < 3:
        if page.evaluate("() => window.__m.type") == 'hayrickBurning': t = time.time() - t0; break
        time.sleep(0.05)
    ok(t is not None, f'a hayrick walking onto a fire tile becomes a hayrickBurning within 3 s ({t})')
    ok(page.evaluate("() => window.__c.type") == 'hayrick', 'control: a hayrick in a lane with no fire stays a hayrick')
    ok(page.evaluate("() => window.__m.hp") == 5, 'it keeps its health')
    # a burning hayrick sets an ordinary one within a lane and a tile alight
    page.evaluate(QUIET)
    page.evaluate("""() => { const g = window.__gg; window.__b = g.spawnMonster('hayrickBurning', 3, true, 0.5); window.__b.sp = 0; window.__o = g.spawnMonster('hayrick', 4, true, 0.5); window.__o.sp = 0; window.__f = g.spawnMonster('hayrick', 6, true, 0.5); window.__f.sp = 0; }""")
    time.sleep(0.5)
    ok(page.evaluate("() => [window.__o.type, window.__f.type]") == ['hayrickBurning', 'hayrick'], 'a burning hayrick ignites an ordinary one in the next lane, not one three lanes away')
    # it throws too (its normal ability); no burning pin
    page.evaluate("() => { const g = window.__gg; g.grid.forEach(r => r.fill(null)); g.grid[3][3] = g.newCell(0); }")
    time.sleep(1.0)
    ok(page.evaluate("() => window.__gg.grid[3][3].pinned > 0"), 'a burning hayrick throws its pitchfork too')
    ice_only_run(page, 'hayrickBurning', 'burning hayrick')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_hayrick_baked(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { const d = window.__gg.NIGHTMARE_LEVELS[0][0]; d.pool = [...d.pool, ['hayrick', 3]]; }")
    nm_start(page, 1)
    ok(page.evaluate("() => window.__gg.isBaked('hayrick')"), 'the hayrick frames are baked when a night with a hayrick in its pool starts')
    ok(page.evaluate("() => ['hayrick', 'hayrickBurning'].every(k => { const C = window.__gg.CHARS[k]; return !!C && !!C.clips.toss && !!C.clips.walk && !!C.clips.chew; })"), 'hayrick and hayrickBurning have walk, chew and toss clips')
    ok(page.evaluate("() => { const g = window.__gg; g.prebake(['hayrickBurning']); return g.isBaked('hayrickBurning'); }"), 'the burning look bakes on its own')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_hayrick_pin': check_hayrick_pin, 'check_hayrick_no_target': check_hayrick_no_target, 'check_hayrick_far': check_hayrick_far, 'check_hayrick_burn': check_hayrick_burn, 'check_hayrick_baked': check_hayrick_baked})


# ---------- Task 6: the Corn Husker (husk, bare cob, burning, charred) ----------
# One pumpkin hit, straight through hitMonster (type = PTYPES index: 0 Green, 2 Ice).
HIT = """([type, id]) => { const g = window.__gg, m = window['__' + id]; g.hitMonster({ type, vis:type, lv:1, size:1, lane:m.lane, x:m.x, y:0, hit:new Set(), grp:null, guar:false, trail:[] }, m); }"""
MKHUSK = """([typ, id, lane, p]) => { const g = window.__gg; const m = g.spawnMonster(typ, lane, true, p); m.sp = 0.04; window['__' + id] = m; }"""


def check_husker(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    ok(page.evaluate("() => { const T = window.__gg.TYPES; return [T.husker.hp, T.husker.sp, T.husker.bareMul, T.huskerBare.hp, T.huskerBurning.hp, T.huskerCharred.rise, T.husker.r]; }") == [3, 0.04, 1.3, 3, 3, 4, 22], 'husker data: 3 health, speed 0.04, bareMul 1.3, r 22; charred cob rises after 4 s')
    # the first Green hit only strips the husk
    page.evaluate(MKHUSK, ['husker', 'a', 2, 0.3])
    page.evaluate(HIT, [0, 'a'])
    r = page.evaluate("() => [window.__a.type, window.__a.hp, window.__a.sp, window.__a.dead, window.__a.anim && window.__a.anim.clip]")
    ok(r[0] == 'huskerBare' and r[1] == 3 and abs(r[2] - 0.052) < 1e-9 and not r[3], f'one Green hit: huskerBare, health unchanged, speed x1.3 {r}')
    ok(r[4] == 'shed', f'the strip plays the shed clip {r[4]}')
    page.evaluate(HIT, [0, 'a'])
    ok(page.evaluate("() => [window.__a.type, window.__a.hp < 3]") == ['huskerBare', True], 'the bare cob takes damage normally on the next hit')
    ok(page.evaluate("() => window.__a.sp") < 0.0521, 'the second hit does not speed it up again')
    # Ice strips too (and still chills it)
    page.evaluate(MKHUSK, ['husker', 'b', 3, 0.3])
    page.evaluate(HIT, [2, 'b'])
    r = page.evaluate("() => [window.__b.type, window.__b.hp, window.__b.slowT > 0 || window.__b.frozenT > 0]")
    ok(r == ['huskerBare', 3, True], f'an Ice hit strips the husk without damage and still slows it {r}')
    # a bare cob is not Ice-only
    page.evaluate("() => { const g = window.__gg; window.__b.lastHit = 0; g.damage(window.__b, 999, '#8fae78'); }")
    ok(page.evaluate("() => window.__b.dead"), 'a Green kill finishes a bare cob')
    # burning husker: any pumpkin strips it, leaving the charred cob
    page.evaluate(MKHUSK, ['huskerBurning', 'c', 4, 0.3])
    page.evaluate(HIT, [0, 'c'])
    r = page.evaluate("() => [window.__c.type, window.__c.hp, window.__c.dead, window.__c.anim && window.__c.anim.clip]")
    ok(r == ['huskerCharred', 3, False, 'shed'], f'a Green hit on a huskerBurning leaves a huskerCharred, health unchanged {r}')
    ice_only_run(page, 'huskerCharred', 'charred cob')
    # walking onto fire
    page.evaluate(QUIET)
    page.evaluate("() => window.__gg.lightFire(2, 0.5)")
    page.evaluate(MKHUSK, ['husker', 'd', 2, 0.4]); page.evaluate(MKHUSK, ['huskerBare', 'e', 2, 0.45]); page.evaluate(MKHUSK, ['husker', 'f', 4, 0.4])
    t0 = time.time(); t = None
    while time.time() - t0 < 3:
        if page.evaluate("() => [window.__d.type, window.__e.type]") == ['huskerBurning', 'huskerCharred']: t = time.time() - t0; break
        time.sleep(0.05)
    ok(t is not None, f'a husker on fire becomes huskerBurning and a bare cob becomes huskerCharred ({t})')
    ok(page.evaluate("() => window.__f.type") == 'husker', 'control: a husker in a lane with no fire stays a husker')
    # a burning husker lights ordinary ones nearby; a charred cob lights bare ones
    page.evaluate(QUIET)
    for typ, id, lane in (('huskerBurning', 'g', 3), ('husker', 'h', 4), ('husker', 'i', 6), ('huskerCharred', 'j', 1), ('huskerBare', 'k', 0)):
        page.evaluate(MKHUSK, [typ, id, lane, 0.5]); page.evaluate(f"() => {{ window.__{id}.sp = 0; }}")
    time.sleep(0.5)
    ok(page.evaluate("() => [window.__h.type, window.__i.type]") == ['huskerBurning', 'husker'], 'a burning husker ignites an ordinary one in the next lane, not one three lanes away')
    ok(page.evaluate("() => window.__k.type") == 'huskerCharred', 'a charred cob ignites a bare cob next to it')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_husker_baked(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { const d = window.__gg.NIGHTMARE_LEVELS[0][0]; d.pool = [...d.pool, ['husker', 3]]; }")
    nm_start(page, 1)
    ok(page.evaluate("() => window.__gg.isBaked('husker') && window.__gg.isBaked('huskerBare')"), 'a night with a husker in its pool bakes the husker and the bare cob (the first hit never hitches)')
    ok(page.evaluate("() => ['husker', 'huskerBare', 'huskerBurning', 'huskerCharred'].every(k => { const C = window.__gg.CHARS[k]; return !!C && !!C.clips.walk && !!C.clips.chew; })"), 'all four looks have walk and chew clips')
    ok(page.evaluate("() => ['huskerBare', 'huskerCharred'].every(k => !!window.__gg.CHARS[k].clips.shed)"), 'the looks a strip leaves behind have the shed clip')
    ok(page.evaluate("() => { const g = window.__gg; g.prebake(['huskerBurning', 'huskerCharred']); return g.isBaked('huskerBurning') && g.isBaked('huskerCharred'); }"), 'the burning looks bake on their own')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_husker': check_husker, 'check_husker_baked': check_husker_baked})


# ---------- Task 7: the Strawlord mini boss and its crows ----------
BOSS = "window.__gg.G.monsters.find(m => m.type === 'boss' && !m.dead)"
CROWS = "window.__gg.G.monsters.filter(m => m.type === 'crow' && !m.dead)"


def strawlord_up(page, k):
    """Start Nightmare 1-k, bring its boss in now, then stop ordinary spawns and clear the field so only the boss (and its crows) act.
    Records the boss's highest p from here on in window.__maxP. Returns the boss's [kind, hp, maxHp, phase2, hold]."""
    nm_start(page, k)
    page.evaluate("() => { const G = window.__gg.G; G.sproutT = -999; G.spawned = Math.ceil(G.def.total * 0.4); G.spawnTimer = 0; }")
    time.sleep(0.3)
    return page.evaluate(f"""() => {{ const g = window.__gg, G = g.G, b = {BOSS}; if (!b) return null;
      G.spawnTimer = 999; G.monsters.splice(0, G.monsters.length, b); G.fires.length = 0; G.fmNext = 99; b.p = b.hold - 0.01;
      window.__b = b; window.__maxP = 0; clearInterval(window.__mp); window.__mp = setInterval(() => {{ window.__maxP = Math.max(window.__maxP, window.__b.p); window.__gg.G.spawnTimer = 999; }}, 10);
      return [b.kind, b.hp, b.maxHp, !!b.phase2, b.hold]; }}""")


def check_strawlord(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    d = page.evaluate("() => { const T = window.__gg.TYPES, s = T.strawlord, c = T.crow; return s && c ? [s.boss, s.hp, s.form2.hp, s.hold, s.moveEvery, s.flockEvery, s.crows, s.fires2, s.noItems, c.hp, c.sp, c.r, c.flying, c.coins, c.eat, c.pts, c.drop] : null; }")
    ok(d == [True, 20, 30, 0.12, 8, [6, 4], [3, 5], 2, True, 1, 0.11, 14, True, 2, 0.4, 8, 0], f'Strawlord and crow data {d}')
    ok(page.evaluate("() => [window.__gg.NIGHTMARE_LEVELS[0][3].boss, window.__gg.NIGHTMARE_LEVELS[0][3].bossChest, window.__gg.NIGHTMARE_LEVELS[0][12].boss, window.__gg.NIGHTMARE_LEVELS[0][12].bossForm]") == ['strawlord', 'normal', 'strawlord', 2],
       'N1-4 and N1-13 are Strawlord nights (N1-13 in phase 2), with one normal chest')
    ok(page.evaluate("() => window.__gg.BOSS_NAMES.strawlord") == 'The Strawlord', 'its name on screen is "The Strawlord"')
    b = strawlord_up(page, 4)
    ok(b is not None and b[0] == 'strawlord' and b[1] == b[2] == 20 and not b[3], f'on N1-4 the Strawlord arrives with 20 health, not yet in phase 2 {b}')
    if b is None:
        page.close(); return
    lane0 = page.evaluate("() => window.__b.lane")
    time.sleep(6.5)
    n = page.evaluate(f"() => {CROWS}.length")
    ok(3 <= n <= 5, f'6.5 s on, 3 to 5 crows have burst out ({n})')
    cr = page.evaluate(f"() => {CROWS}.map(c => [c.minion, c.lane, c.p])")
    ok(all(c[0] for c in cr) and all(c[2] > 0.1 for c in cr), f'the crows are minions flying down from the Strawlord {cr}')
    time.sleep(2.0)
    ok(page.evaluate("() => window.__b.lane") != lane0, f'after 8 s it has moved to another lane (from {lane0})')
    ok(page.evaluate("() => window.__gg.G.fires.length") == 0, 'phase 1 lights no fire')
    # phase 2 at half health
    page.evaluate(f"() => {{ const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, b.hp - b.maxHp / 2, '#fff'); {CROWS}.forEach(c => c.old = true); window.__f0 = g.G.fires.length; }}")
    time.sleep(0.25)
    p2 = page.evaluate("() => [!!window.__b.phase2, window.__b.anim && window.__b.anim.clip, window.__b.hp]")
    ok(p2[0] and p2[1] == 'tear' and p2[2] == 10, f'at half health phase 2 starts and the tear clip plays {p2}')
    time.sleep(4.5)
    r = page.evaluate(f"() => [{CROWS}.filter(c => !c.old).length, window.__gg.G.fires.length - window.__f0]")
    ok(r[0] >= 3 and r[1] == 2, f'4.5 s into phase 2 it has flocked again (new crows {r[0]}) and lit 2 fire tiles ({r[1]})')
    mp, hold = page.evaluate("() => [window.__maxP, window.__b.hold]")
    ok(mp <= hold + 1e-9, f'it never walks past hold (max p {mp:.4f}, hold {hold})')
    # immune to knockback and freeze, through the real hit path: 20 level-5 Ice hits from a 5+ bunch (guar: knockback guaranteed; freeze 50% a hit)
    hits = """(m) => { const g = window.__gg, out = { kb:0, frozen:0, slowed:0 };
      for (let i = 0; i < 20; i++){ const pr = { x:m.x, y:g.fieldY(1), vy:-900, type:2, vis:2, lv:5, guar:true, lane:m.lane, hitWalls:new Set(), grp:{ spawned:false, small:false, kills:0 }, size:1, rot:0, spin:9, hit:new Set(), trail:[], r:16, dead:false };
        g.hitMonster(pr, m); if (m.kb > 0) out.kb++; if (m.frozenT > 0) out.frozen++; if (m.slowT > 0) out.slowed++; }
      return out; }"""
    ctl = page.evaluate(f"() => {{ const g = window.__gg, m = g.spawnMonster('ghoul', (window.__b.lane + 3) % 7, true, 0.5); m.sp = 0; m.hp = m.maxHp = 5000; const r = ({hits})(m); m.dead = true; return r; }}")
    ok(ctl['kb'] > 0 and ctl['frozen'] > 0, f'control: the same 20 Ice hits knock back and freeze a ghoul {ctl}')
    r = page.evaluate(f"() => {{ const b = window.__b; b.hp = 5000; return [({hits})(b), b.kb || 0, b.frozenT || 0]; }}")
    ok(r[0]['kb'] == 0 and r[0]['frozen'] == 0 and r[1] == 0 and r[2] == 0 and r[0]['slowed'] > 0, f'the Strawlord takes all 20 hits with no knockback and no freeze, but is slowed {r}')
    # killing it gives exactly one normal chest
    c0 = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 99999, '#fff'); }")
    time.sleep(0.3)
    ch = page.evaluate("() => window.__gg.save.chests.slice(%d)" % c0)
    ok(len(ch) == 1 and ch[0]['kind'] == 'normal' and not ch[0].get('boss'), f'killing it adds exactly one normal chest and no boss item {ch}')
    ok(page.evaluate("() => window.__gg.G.bossDead"), 'the boss is down (the night can end)')
    page.evaluate("() => clearInterval(window.__mp)")
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_strawlord_returns(browser, url):
    """N1-13 (bossForm 2): it starts already in phase 2 with form2 health, never plays tear, and flocks every 4 s with 2 fires."""
    if not R4: return
    page, errors = open_page(browser, url)
    b = strawlord_up(page, 13)
    ok(b is not None and b[0] == 'strawlord' and b[1] == b[2] == 30 and b[3], f'on N1-13 it arrives in phase 2 with 30 health {b}')
    if b is None:
        page.close(); return
    ok(page.evaluate("() => !window.__b.anim || window.__b.anim.clip !== 'tear'"), 'no tear clip: it is already off the post')
    time.sleep(4.5)
    r = page.evaluate(f"() => [{CROWS}.length, window.__gg.G.fires.length]")
    ok(3 <= r[0] <= 5 and r[1] == 2, f'4.5 s on it has flocked once (crows {r[0]}) and lit 2 fires ({r[1]})')
    c0 = page.evaluate("() => window.__gg.save.chests.length")
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 999, '#fff'); }"); time.sleep(0.3)
    ch = page.evaluate("() => window.__gg.save.chests.slice(%d).map(c => c.kind)" % c0)
    ok(ch == ['normal'], f'N1-13 also gives one normal chest {ch}')
    page.evaluate("() => clearInterval(window.__mp)")
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_strawlord_continue(browser, url):
    """check_nm_continue, boss part: a phase 2 Strawlord comes back in phase 2 with its health."""
    if not R4: return
    page, errors = open_page(browser, url)
    b = strawlord_up(page, 4)
    if b is None:
        ok(False, 'the Strawlord arrived'); page.close(); return
    page.evaluate("() => { const g = window.__gg, b = window.__b; b.lastHit = 0; g.damage(b, 13, '#fff'); }"); time.sleep(0.25)
    before = page.evaluate("() => [!!window.__b.phase2, window.__b.hp]")
    page.evaluate("() => { clearInterval(window.__mp); const g = window.__gg, c = g.continueState(); g.continueNight(c); }"); time.sleep(0.6)
    after = page.evaluate(f"() => {{ const b = {BOSS}; return b ? [!!b.phase2, b.hp, b.kind, !b.anim || b.anim.clip !== 'tear'] : null; }}")
    ok(before == [True, 7] and after == [True, 7, 'strawlord', True], f'a continued night brings it back in phase 2 with its 7 health, no second tear {before} -> {after}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_strawlord_baked(browser, url):
    """Its frames (idle as walk, flock, hit, tear) and the crow's are baked when the night starts, capped like the Hollow King's (under 10 MB at bake scale 2.5)."""
    if not R4: return
    page, errors = open_page(browser, url)
    C = page.evaluate("() => { const C = window.__gg.CHARS; return C.strawlord && C.crow ? [Object.keys(C.strawlord.clipsFor ? C.strawlord.clipsFor(null) : C.strawlord.clips).sort(), Object.keys(C.crow.clips).sort()] : null; }")
    ok(C == [['flock', 'hit', 'tear', 'walk'], ['walk']], f'the Strawlord bakes walk (its idle), flock, hit and tear; the crow bakes walk (its fly) {C}')
    page.evaluate("() => window.__gg.setBakeScale(2.5)")
    t0 = time.time(); nm_start(page, 4); dt = time.time() - t0
    ok(page.evaluate("() => window.__gg.isBaked('strawlord') && window.__gg.isBaked('crow')"), 'starting N1-4 bakes the Strawlord and the crow')
    mb = page.evaluate("() => window.__gg.atlasBytes('strawlord') / 1e6")
    ok(mb < 10, f'the Strawlord\'s frames take {mb:.1f} MB at bake scale 2.5 (limit 10)')
    ok(dt < 3, f'the night opens in {dt:.1f} s')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_strawlord': check_strawlord, 'check_strawlord_returns': check_strawlord_returns, 'check_strawlord_continue': check_strawlord_continue, 'check_strawlord_baked': check_strawlord_baked})

# ---------- Task 8: the Grave Gourd ----------
GP = "() => { const p = window.__gg.gourdPos(); return p ? [p.r, p.c] : null; }"
# Quiet the night and empty the patch, keeping the gourd where it stands: no spawns, no sprouts, no monsters, no graves.
GQUIET = """() => { const g = window.__gg, G = g.G; G.spawnTimer = 999; G.sproutT = -999; G.monsters.length = 0; G.projs.length = 0; G.drops.length = 0;
  if (G.fires) G.fires.length = 0; G.fmNext = 99; g.graves.forEach(r => r.fill(false));
  g.grid.forEach(row => row.forEach((c, i) => { if (!(c && c.gourd)) row[i] = null; })); g.resolveMatches(); }"""
# Move the gourd to (r, c) on an otherwise unchanged patch.
GMOVE = """([r, c]) => { const g = window.__gg, p = g.gourdPos(), cell = g.grid[p.r][p.c]; g.grid[p.r][p.c] = null; g.grid[r][c] = cell; cell.ox = cell.oy = 0; g.resolveMatches(); }"""
# Fill every empty cell in a checkerboard of two colours (no bunches).
GFILL = "() => { const g = window.__gg; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (!g.grid[r][c] && !g.graves[r][c]) g.grid[r][c] = g.newCell((r + c) % 2); g.resolveMatches(); }"
COUNT = "(cells) => cells.filter(([r, c]) => { const x = window.__gg.grid[r][c]; return x && !x.gourd; }).length"


def gourd_night(page, k=5):
    nm_start(page, k)
    page.evaluate(GQUIET)


def square(r, c):
    return [[a, b] for a in range(r - 1, r + 2) for b in range(c - 1, c + 2) if 0 <= a < 5 and 0 <= b < 7 and (a, b) != (r, c)]


def outside(r, c):
    sq = square(r, c)
    return [[a, b] for a in range(5) for b in range(7) if [a, b] not in sq and (a, b) != (r, c)]


def check_gourd_basic(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    nm_start(page, 5)
    ok(page.evaluate(GP) == [2, 3], f'on a gourd:true night the gourd starts in the centre cell (2, 3) ({page.evaluate(GP)})')
    d = page.evaluate("() => { const g = window.__gg, x = g.grid[2][3]; return x ? [x.c, !!x.gourd, g.GOURD, g.isGourd(x), Object.keys(g.newCell(0)).every(k => k in x)] : null; }")
    ok(d == [-1, True, -1, True, True], f'its cell has c = GOURD (-1), gourd:true and the shape of newCell {d}')
    ok(page.evaluate("() => window.__gg.grid.flat().filter(x => x && x.gourd).length") == 1, 'exactly one gourd on the patch')
    time.sleep(1.0)   # draws a few frames with the gourd on the patch
    page.evaluate(GQUIET)
    ok(page.evaluate("() => window.__gg.slideOne(window.__gg.grid[2][3], 'left')") is True and page.evaluate(GP) == [2, 0], f'slideOne moves it like a pumpkin, to the edge ({page.evaluate(GP)})')
    page.evaluate("() => { const g = window.__gg; g.grid[2][1] = g.newCell(1); }")
    ok(page.evaluate("() => window.__gg.slideOne(window.__gg.grid[2][0], 'right')") is True, 'sliding it into a pumpkin pushes the line')
    ok(page.evaluate(GP) == [2, 5] and page.evaluate("() => { const x = window.__gg.grid[2][6]; return !!x && x.c === 1; }"), f'a push line that holds it moves together: gourd (2, 5), the pumpkin (2, 6) ({page.evaluate(GP)})')
    page.evaluate("() => { const g = window.__gg; g.grid[2][6] = null; g.grid[1][4] = g.newCell(0); g.grid[1][3] = g.newCell(0); g.grid[2][4] = g.newCell(0); g.grid[3][5] = g.newCell(0); g.grid[1][5] = g.newCell(0); g.resolveMatches(); }")
    gr = page.evaluate("() => { const g = window.__gg, G = g.G, ids = Object.keys(G.groups); return [ids.length, g.grid.flat().filter(x => x && x.lit).length, g.grid[2][5].lit, g.grid[2][5].gids.length]; }")
    ok(gr == [1, 4, False, 0], f'it is never in G.groups: the four touching Greens form one bunch, the gourd stays unlit {gr}')
    ok(page.evaluate("() => window.__gg.groupCells(+Object.keys(window.__gg.G.groups)[0]).every(o => !o.cell.gourd)"), 'no bunch cell is the gourd')
    time.sleep(0.5)
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_gourd_edges(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    set_stars(page, {})   # no level-20 powers
    gourd_night(page)
    # Rainbow: never a bunch with the gourd
    page.evaluate("() => { const g = window.__gg, R = g.RAINBOW; g.grid[2][4] = g.newCell(R); g.grid[2][5] = g.newCell(0); g.grid[2][6] = g.newCell(0); g.resolveMatches(); }")
    gr = page.evaluate("() => { const g = window.__gg, G = g.G; return Object.keys(G.groups).map(id => g.groupCells(+id).map(o => [o.r, o.c]).sort()); }")
    ok(gr == [[[2, 4], [2, 5], [2, 6]]], f'a Rainbow and two Greens next to it: the bunch is only the Greens and the Rainbow {gr}')
    page.evaluate(GQUIET)
    page.evaluate("() => { const g = window.__gg, R = g.RAINBOW; g.grid[1][3] = g.newCell(R); g.grid[0][3] = g.newCell(R); g.resolveMatches(); }")
    ok(page.evaluate("() => Object.keys(window.__gg.G.groups).length") == 0, 'two Rainbows touching the gourd make no bunch')
    sc = page.evaluate("() => { const g = window.__gg; return g.boardScore(g.grid, Array(7).fill(0)); }")
    ok(abs(sc - 0.2) < 1e-6, f'boardScore pairs the two Rainbows only, never the gourd ({sc})')
    # Paint: does not pull it
    page.evaluate(GQUIET)
    page.evaluate("() => { const g = window.__gg, P = g.PTYPES.findIndex(p => p.key === 'paint'); g.save.lv.paint = 5; g.grid[2][0] = g.newCell(P); g.grid[2][1] = g.newCell(P); g.grid[2][2] = g.newCell(P); g.grid[1][2] = g.newCell(1); g.resolveMatches(); }")
    pull = page.evaluate("() => { const g = window.__gg, id = +Object.keys(g.G.groups)[0]; return g.paintPull(id).map(o => [o.r, o.c, !!o.cell.gourd]); }")
    ok(pull == [[1, 2, False]], f'a Paint bunch touching it pulls the Yellow beside it but not the gourd {pull}')
    # destroying clears the graves in its square and leaves the pumpkins
    page.evaluate(GQUIET); page.evaluate(GMOVE, [2, 3])
    ok(page.evaluate("() => window.__gg.destroyGourd(null) === false && window.__gg.destroyGourd(window.__gg.newCell(0)) === false && !window.__gg.G.gourdDue"), 'destroyGourd ignores anything that is not the gourd')
    page.evaluate("() => { const g = window.__gg; g.save.buster = 2; for (const [r, c] of [[1, 2], [3, 4], [2, 4], [0, 0], [2, 1]]) g.graves[r][c] = true; g.grid[1][3] = g.newCell(0); g.grid[3][3] = g.newCell(1); g.G.gourdDue = false; g.destroyGourd(g.grid[2][3]); }")
    d = page.evaluate("() => { const g = window.__gg; return [g.graves[1][2], g.graves[3][4], g.graves[2][4], g.graves[0][0], g.graves[2][1], !!g.grid[1][3], !!g.grid[3][3], !!g.grid[2][3], g.G.gourdDue, g.save.buster]; }")
    ok(d == [False, False, False, True, True, True, True, False, True, 2], f'destroying it clears the graves in its 3x3 (not outside), leaves the pumpkins, frees its cell, sets gourdDue, and costs no Grave buster {d}')
    # full patch: destroy, then the next tick puts the gourd in the freed cell
    page.evaluate(GQUIET)
    page.evaluate("() => { const g = window.__gg; g.grid[2][3] = g.newGourd(); g.G.gourdDue = false; }")
    page.evaluate(GMOVE, [4, 6]); page.evaluate(GFILL)
    ok(page.evaluate("() => window.__gg.emptyCells().length") == 0, 'the patch is full')
    ok(page.evaluate("() => window.__gg.spawnSprouts()") is False, 'a full patch: nothing sprouts and the fill does nothing')
    page.evaluate("() => { const g = window.__gg; g.destroyGourd(g.grid[4][6]); }")
    page.evaluate("() => window.__gg.spawnSprouts()")
    ok(page.evaluate(GP) == [4, 6] and page.evaluate("() => window.__gg.G.gourdDue") is False, f'the next tick brings it back in the freed cell (4, 6) ({page.evaluate(GP)})')
    page.evaluate("() => { const g = window.__gg; g.destroyGourd(g.grid[4][6]); g.grid[4][6] = g.newCell(0); }")
    page.evaluate("() => window.__gg.spawnSprouts()")
    ok(page.evaluate(GP) is None and page.evaluate("() => window.__gg.G.gourdDue") is True, 'with no free cell the respawn waits (gourdDue stays set)')
    page.evaluate("() => { window.__gg.grid[0][0] = null; window.__gg.spawnSprouts(); }")
    ok(page.evaluate(GP) == [0, 0], f'the first tick with a free cell brings it back there ({page.evaluate(GP)})')
    # fill sizes: centre 8, edge 5, corner 3
    for cell, want in (([2, 3], 8), ([0, 3], 5), ([0, 0], 3), ([4, 6], 3)):
        page.evaluate(GQUIET); page.evaluate(GMOVE, cell)
        n = page.evaluate("() => window.__gg.gourdFill()")
        filled = page.evaluate(COUNT, square(*cell))
        ok(n == want and filled == want, f'a gourd at {tuple(cell)} fills {want} cells ({n} returned, {filled} filled)')
    # one sprout tick: one slot fills the square, the other slots sprout elsewhere
    for triple, extra in ((False, 1), (True, 2)):
        page.evaluate(GQUIET); page.evaluate(GMOVE, [2, 3])
        set_stars(page, {60: 3} if triple else {})
        page.evaluate("(t) => { const g = window.__gg, R = Math.random; if (t) Math.random = () => 0.1; try { g.spawnSprouts(); } finally { Math.random = R; } }", triple)
        ins, out = page.evaluate(COUNT, square(2, 3)), page.evaluate(COUNT, outside(2, 3))
        ok(ins == 8 and out == extra, f"{'the 3-sprout power' if triple else 'a plain tick'}: 1 fill of the square (8) plus {extra} elsewhere ({ins} in the square, {out} elsewhere)")
    set_stars(page, {})
    page.evaluate(GQUIET); page.evaluate(GMOVE, [2, 3])
    page.evaluate("(cells) => { const g = window.__gg; for (const [r, c] of cells) g.grid[r][c] = g.newCell((r + c) % 2); }", square(2, 3))
    page.evaluate("() => window.__gg.spawnSprouts()")
    out = page.evaluate(COUNT, outside(2, 3))
    ok(out == 2, f'a tick whose square is full sprouts one normal pumpkin for the gourd slot, plus the other slot: 2 elsewhere ({out})')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def hold_gourd(page, secs):
    """Press the mouse on the gourd's cell, hold still for secs, release; True if the gourd was destroyed during the hold."""
    pos = page.evaluate(GP)
    box = page.query_selector('#cv').bounding_box(); sc = box['width'] / 540; gy = box['height'] / sc - 26 - 5 * 74
    x = box['x'] + (page.evaluate("(c) => window.__gg.LANE(c)", pos[1])) * sc; y = box['y'] + (gy + pos[0] * 74 + 37) * sc
    page.mouse.move(x, y); page.mouse.down(); time.sleep(secs)
    gone = page.evaluate(GP) is None
    page.mouse.up(); time.sleep(0.1)
    return gone


def check_gourd_hold(browser, url):
    """Holding the gourd destroys it with the same hold as crushing a pumpkin; the 1-20 Quick smash power shortens it."""
    if not R4: return
    page, errors = open_page(browser, url)
    set_stars(page, {}); gourd_night(page); time.sleep(0.4)
    ok(not hold_gourd(page, 0.45), 'without Quick smash a 0.45 s hold does not destroy it')
    ok(hold_gourd(page, 0.8), 'without Quick smash a 0.8 s hold (over HOLD_TIME 0.6 s) destroys it')
    page.evaluate("() => { const g = window.__gg; g.G.gourdDue = false; g.grid[2][3] = g.newGourd(); }")
    set_stars(page, {20: 3}); page.evaluate("() => { window.__gg.save.perksOff = {}; }")
    ok(hold_gourd(page, 0.5), 'with the Quick smash power a 0.5 s hold (over 0.35 s) destroys it')
    ok(page.evaluate("() => window.__gg.G.gourdDue") is True, 'a destroyed gourd is due back')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_gourd_unlock(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    set_stars(page, {**story_done(), **{1000 + k: 3 for k in range(1, 4)}})
    ok(page.evaluate("() => JSON.stringify(window.__gg.save.gourds)") == '{}', f"a save starts with no gourds ({page.evaluate('() => JSON.stringify(window.__gg.save.gourds)')})")
    ok(page.evaluate("() => window.__gg.NIGHTMARE_LEVELS[0][3].unlockGourds") == ['grave'], 'N1-4 unlocks the Grave Gourd (data)')
    nm_start(page, 3); page.evaluate("() => window.__gg.endGame(true)"); time.sleep(1.8)
    ok(not page.evaluate("() => !!window.__gg.save.gourds.grave"), 'winning N1-3 does not unlock it')
    nm_start(page, 4); page.evaluate("() => window.__gg.endGame(true)"); time.sleep(1.8)
    ok(page.evaluate("() => window.__gg.save.gourds.grave") is True, 'winning N1-4 sets save.gourds.grave')
    ok(page.evaluate("() => JSON.parse(localStorage.getItem('gourdguard.v1')).gourds.grave") is True, 'and it is saved')
    ok(page.evaluate("() => [1005, 1015].every(n => window.__gg.NIGHTMARE_LEVELS[0][n - 1001].gourd) && !window.__gg.NIGHTMARE_LEVELS[0][3].gourd"), 'N1-5 to N1-15 have gourd:true, N1-4 does not')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_gourd_loadout(browser, url):
    """The pumpkin picker shows a Gourds section with the Grave Gourd picked and locked on gourd nights only; it is not one of the pumpkins."""
    if not R4: return
    page, errors = open_page(browser, url)
    set_stars(page, {**story_done(100), **{1000 + k: 3 for k in range(1, 6)}})
    page.evaluate("() => { window.__gg.save.gourds = { grave:true }; window.__gg.save.perksOff = { pick4:true }; window.__gg.beginNight(1005); }"); time.sleep(0.5)
    st = page.evaluate("""() => { const s = document.querySelector('#loGourdSec'), b = s && s.querySelector('.pick');
      return [window.__gg.state, !!s && !s.hidden, s ? s.querySelector('h3').textContent : null, b ? [b.textContent.includes('Grave Gourd'), b.getAttribute('aria-pressed'), b.classList.contains('must')] : null,
        document.querySelectorAll('#loTeam .slot:not(.empty)').length, document.querySelector('#loTitle').textContent]; }""")
    ok(st[0] == 'loadout' and st[1] and st[2] == 'Gourds', f'N1-5 opens the picker with a Gourds section {st[:3]}')
    ok(st[3] == [True, 'true', True], f'the Grave Gourd is there, picked and locked {st[3]}')
    ok(st[4] == 5 and st[5] == 'Pick 5 pumpkins', f'it does not take a pumpkin slot: 5 pumpkins still fill the team {st[4:]}')
    page.click('#loGourdSec .pick'); time.sleep(0.2)
    det = page.evaluate("() => document.querySelector('#loDetail').textContent")
    ok('Grave Gourd' in det, f'tapping it shows its card ({det[:60]!r})')
    page.evaluate("() => window.__gg.beginNight(1003)"); time.sleep(0.5)
    hid = page.evaluate("() => { const s = document.querySelector('#loGourdSec'); return [window.__gg.state, !s || s.hidden]; }")
    ok(hid == ['loadout', True], f'N1-3 (no gourd) shows no Gourds section {hid}')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()
    # a player who has beaten only world 1 (4 pumpkin types): the picker still opens on a gourd night, and Start works
    page, errors = open_page(browser, url)
    set_stars(page, {**story_done(20), **{1000 + k: 3 for k in range(1, 5)}})
    n = page.evaluate("() => window.__gg.typesForNight(21).length")
    page.evaluate("() => { window.__gg.save.gourds = { grave:true }; window.__gg.save.perksOff = {}; window.__gg.beginNight(1005); }"); time.sleep(0.5)
    st = page.evaluate("() => [window.__gg.state, !document.querySelector('#loGourdSec').hidden, document.querySelector('#loTitle').textContent, document.querySelector('#bLoGo').disabled, document.querySelectorAll('#loTeam .slot').length]")
    ok(n <= 5 and st == ['loadout', True, f'Pick {n} pumpkins', False, n], f'with {n} types the picker opens on N1-5 with its Gourds section, asks for {n} and can start {st}')
    if st[0] == 'loadout':
        page.click('#bLoGo'); time.sleep(0.5)
        g = page.evaluate("() => [window.__gg.state, window.__gg.G.n, window.__gg.G.loadout.length, !!window.__gg.gourdPos()]")
        ok(g == ['play', 1005, n, True], f'Start night begins N1-5 with all {n} types and the gourd {g}')
    page.evaluate("() => window.__gg.beginNight(5)"); time.sleep(0.5)
    ok(page.evaluate("() => window.__gg.state") == 'play', 'a story level with 5 or fewer types still skips the picker')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_gourd_continue(browser, url):
    """check_nm_continue, gourd part: a continued night keeps the gourd's cell, or its pending respawn."""
    if not R4: return
    page, errors = open_page(browser, url)
    gourd_night(page)
    page.evaluate(GMOVE, [4, 5])
    page.evaluate("() => { const g = window.__gg, c = g.continueState(); g.continueNight(c); }"); time.sleep(0.3)
    ok(page.evaluate(GP) == [4, 5] and page.evaluate("() => window.__gg.grid.flat().filter(x => x && x.gourd).length") == 1, f'a continued night keeps the gourd in its cell (4, 5) ({page.evaluate(GP)})')
    page.evaluate("() => { const g = window.__gg; g.G.continued = false; const p = g.gourdPos(); g.destroyGourd(g.grid[p.r][p.c]); const c = g.continueState(); g.continueNight(c); }"); time.sleep(0.3)
    ok(page.evaluate(GP) is None and page.evaluate("() => window.__gg.G.gourdDue") is True, f'a destroyed gourd stays due on the continued night ({page.evaluate(GP)})')
    page.evaluate("() => { window.__gg.G.sproutT = -999; window.__gg.spawnSprouts(); }")
    ok(page.evaluate(GP) is not None, 'and the first sprout brings it back')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_gourd_basic': check_gourd_basic, 'check_gourd_edges': check_gourd_edges, 'check_gourd_hold': check_gourd_hold, 'check_gourd_unlock': check_gourd_unlock, 'check_gourd_loadout': check_gourd_loadout, 'check_gourd_continue': check_gourd_continue})


def check_gourd_coach(browser, url):
    """Task 9: the gourd tutorial on N1-5, a second script of the first-night coach (src/engine/coach.js)."""
    if not R4: return
    STEP = "(s) => { const g = window.__gg; for (let i = 0; i < Math.round(s / 0.05); i++) g.update(0.05); return g.G.coach ? g.G.coach.step : null; }"
    SQ = "() => { const g = window.__gg, p = g.gourdPos(); let n = 0; for (let a = p.r - 1; a <= p.r + 1; a++) for (let b = p.c - 1; b <= p.c + 1; b++) if (g.grid[a] && g.grid[a][b] && !g.grid[a][b].gourd) n++; return n; }"
    page, errors = open_page(browser, url)
    nm_start(page, 5, coach=True)
    d = page.evaluate("() => { const g = window.__gg; return [g.G.coach && g.G.coach.step, g.coachHolds(), g.gourdPos(), g.graves[1][3], g.graves[3][3], g.save.seenGourdCoach || false]; }")
    ok(d[0] == 'gslide' and d[1] is True and d[2] == {'r': 2, 'c': 3} and d[3] and d[4] and d[5] is False, f'N1-5 with the tutorial unseen starts the gourd script, holding, gourd at (2, 3), graves around it {d}')
    ok(page.evaluate(STEP, 3) == 'gslide' and page.evaluate("() => [window.__gg.G.monsters.length, window.__gg.G.spawned, window.__gg.G.coach.move && window.__gg.G.coach.move.dir]")[:2] == [0, 0], 'step 1 waits for the slide: no monsters, no spawns')
    ok(page.evaluate("() => { const g = window.__gg, p = g.gourdPos(); return g.slideOne(g.grid[p.r][p.c], g.G.coach.move.dir); }") is True, 'the gourd slides')
    ok(page.evaluate(STEP, 0.1) == 'gfill', 'sliding the gourd moves the script to the fill step')
    ok(page.evaluate("() => document.querySelector('#coachTip').textContent") .startswith('Every sprout fills the space around your gourd'), 'the fill tip is shown')
    before = page.evaluate(SQ)
    ok(page.evaluate(STEP, 1.0) == 'gfill' and page.evaluate(SQ) > before, 'the fill step plays a fill around the gourd')
    ok(page.evaluate("() => [window.__gg.G.monsters.length, window.__gg.G.spawned]") == [0, 0], 'monsters still wait during the fill')
    ok(page.evaluate(STEP, 4) == 'ghold', 'then the hand holds the gourd')
    ok(page.evaluate("() => document.querySelector('#coachTip').textContent").lower().find('hold') >= 0, 'the hold tip is shown')
    ok(page.evaluate(STEP, 3) == 'ghold' and page.evaluate("() => window.__gg.gourdPos() !== null"), 'the hold step waits for the player to break the gourd')
    pre = page.evaluate("() => { const g = window.__gg, p = g.gourdPos(); return [p, g.graves.flat().filter(Boolean).length, g.graves[1][3] || g.graves[3][3]]; }")
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos(); g.destroyGourd(g.grid[p.r][p.c]); }")
    d = page.evaluate("() => [window.__gg.graves.flat().filter(Boolean).length, window.__gg.G.gourdDue]")
    ok(pre[0] == {'r': 2, 'c': 4} and pre[1] == 5 and d == [0, True], f'the gourd stopped at (2, 4); breaking it clears all 5 graves around it and it is due back {pre} {d}')
    ok(page.evaluate(STEP, 0.1) == 'gback', 'breaking the gourd moves the script to the respawn step')
    ok(page.evaluate("() => document.querySelector('#coachTip').textContent").startswith('It grows back on the next sprout'), 'the respawn tip is shown')
    ok(page.evaluate(STEP, 4) == 'praise' and page.evaluate("() => window.__gg.gourdPos() !== null"), 'the gourd grows back on a sprout and the script says Nice')
    ok(page.evaluate("() => window.__gg.coachHolds()") is False, 'the praise step lets the night carry on')
    page.evaluate(STEP, 4)
    d = page.evaluate("() => [window.__gg.G.coach, window.__gg.save.seenGourdCoach]")
    ok(d == [None, True], f'after the praise the script ends and seenGourdCoach is set {d}')
    page.evaluate("() => { window.__gg.G.spawnTimer = 0; }"); page.evaluate(STEP, 0.5)
    ok(page.evaluate("() => window.__gg.G.spawned") > 0, 'monsters spawn after the tutorial')
    # seen: no script
    nm_start(page, 5, coach=True)
    ok(page.evaluate("() => [window.__gg.G.coach, window.__gg.coachHolds()]") == [None, False], 'a player who has seen it gets a plain N1-5')
    # breaking the gourd early (before the fill) skips to the respawn step
    page.evaluate("() => { window.__gg.save.seenGourdCoach = false; }")
    nm_start(page, 5, coach=True)
    page.evaluate("() => { const g = window.__gg, p = g.gourdPos(); g.destroyGourd(g.grid[p.r][p.c]); }")
    ok(page.evaluate(STEP, 0.1) == 'gback', 'breaking the gourd early jumps to the respawn step')
    ok(page.evaluate(STEP, 8) is None and page.evaluate("() => [window.__gg.save.seenGourdCoach, window.__gg.gourdPos() !== null]") == [True, True], 'and it still finishes with the gourd back')
    # the first-night coach on 1-1 is unchanged
    page.evaluate("() => { window.__gg.save.seenCoach = false; }"); start(page, 1)
    ok(page.evaluate("() => window.__gg.G.coach && window.__gg.G.coach.step") == 'slide', '1-1 still starts its own coach')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_gourd_coach': check_gourd_coach})


# ---------- Task 10: the Grave Riser ----------
COL_GRAVES = "(c) => window.__gg.graves.map(row => row[c] ? 1 : 0)"


def check_grave_riser(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    fire_night(page)
    ok(page.evaluate("() => { const T = window.__gg.TYPES.graveriser; return T && [T.hp, T.digEvery]; }") == [3, 7], 'grave riser: 3 health, digs every 7 s (data)')
    # lane 4: an empty column. lane 2: pumpkins in rows 0-1, a grave in row 2, the gourd in row 3, so row 4 is the only free cell.
    # lane 6: frozen for its whole dig time. lane 0: not on the field yet (p < 0). lane 1: a column with no riser.
    page.evaluate("""() => { const g = window.__gg; g.graves.forEach(r => r.fill(false));
      g.grid[0][2] = g.newCell(0); g.grid[1][2] = g.newCell(1); g.graves[2][2] = true; g.grid[3][2] = g.newGourd();
      const mk = (l, p) => { const m = g.spawnMonster('graveriser', l, true, p); m.sp = 0; return m; };
      window.__gr = { a:mk(4, 0.3), b:mk(2, 0.3), c:mk(6, 0.3), d:mk(0, -0.04) }; window.__gr.c.frozenT = 9; }""")
    time.sleep(6.3)
    ok(sum(page.evaluate(COL_GRAVES, 4)) == 0, 'no grave in column 4 before 7 s')
    time.sleep(1.2)
    g4 = page.evaluate(COL_GRAVES, 4)
    ok(sum(g4) == 1, f'7.5 s on: exactly one grave in column 4 {g4}')
    ok(page.evaluate("() => window.__gg.grid.every(r => !r[4])"), 'the grave went on an empty cell (no pumpkin was replaced)')
    g2 = page.evaluate(COL_GRAVES, 2)
    ok(g2 == [0, 0, 1, 0, 1], f'column 2: the only free cell (row 4) got the grave; pumpkins, the old grave and the gourd untouched {g2}')
    ok(page.evaluate("() => { const g = window.__gg; return !!g.grid[0][2] && !!g.grid[1][2] && g.isGourd(g.grid[3][2]); }"), 'the pumpkins and the gourd in column 2 are still there')
    ok(sum(page.evaluate(COL_GRAVES, 6)) == 0, 'a frozen riser does not dig')
    ok(sum(page.evaluate(COL_GRAVES, 0)) == 0, 'a riser not yet on the field (p < 0) does not dig')
    ok(sum(page.evaluate(COL_GRAVES, 1)) == 0, 'no grave in a column without a riser')
    ok(page.evaluate("() => { const a = window.__gr.a.anim; return !!a && a.clip === 'dig'; }"), 'the riser plays its dig clip')
    # it dies: the grave stays, and its die clip plays where it stood
    page.evaluate("() => { const g = window.__gg, m = window.__gr.a; m.lastHit = 0; g.damage(m, 99, '#8fae78'); }")
    ok(page.evaluate("() => window.__gr.a.dead") is True, 'the riser is dead')
    ok(page.evaluate("() => window.__gg.G.vfx.some(v => v.kind === 'clip' && v.key === 'graveriser' && v.clip === 'die')"), 'its die clip plays (a clip effect)')
    time.sleep(0.8)
    ok(sum(page.evaluate(COL_GRAVES, 4)) == 1, 'after it dies the grave stays')
    # column 4 full: no new graves
    page.evaluate("""() => { const g = window.__gg, G = g.G; G.monsters.length = 0; g.graves.forEach(r => r.fill(false));
      for (let r = 0; r < 5; r++) g.grid[r][4] = g.newCell(r % 2);
      window.__gf = g.spawnMonster('graveriser', 4, true, 0.3); window.__gf.sp = 0; }""")
    time.sleep(7.6)
    ok(sum(page.evaluate(COL_GRAVES, 4)) == 0 and page.evaluate("() => window.__gg.grid.every(r => !!r[4])"), 'column 4 full: no new grave, every pumpkin still there')
    ok(page.evaluate("() => !window.__gg.graves.some(r => r.some(Boolean))"), 'and no grave anywhere else')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


def check_grave_riser_baked(browser, url):
    if not R4: return
    page, errors = open_page(browser, url)
    page.evaluate("() => { const d = window.__gg.NIGHTMARE_LEVELS[0][0]; d.pool = [...d.pool, ['graveriser', 3]]; }")
    nm_start(page, 1)
    ok(page.evaluate("() => window.__gg.isBaked('graveriser')"), 'the grave riser frames are baked when a night with one in its pool starts')
    ok(page.evaluate("() => { const C = window.__gg.CHARS.graveriser; return !!C && ['walk', 'chew', 'dig', 'die'].every(k => !!C.clips[k]); }"), 'it has walk, chew, dig and die clips')
    ok(page.evaluate("() => window.__gg.CHARS.graveriser.clips.die.n") == 8, 'the die clip has 8 frames (the clip effect plays 8)')
    ok(not errors, f'no page errors {errors[:2]}')
    page.close()


CHECKS.update({'check_grave_riser': check_grave_riser, 'check_grave_riser_baked': check_grave_riser_baked})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--expect', choices=['on', 'r3', 'off'], required=True)
    ap.add_argument('--only', default=None)
    a = ap.parse_args()
    global R4, MODE
    MODE = a.expect; R4 = a.expect == 'on'
    with sync_playwright() as p:
        browser = p.chromium.launch()
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
