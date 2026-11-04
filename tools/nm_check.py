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


def nm_start(page, k):
    """Start Nightmare 1-k (night 1000 + k)."""
    start(page, 1000 + k)


def story_done(upto=20):
    return {n: 3 for n in range(1, upto + 1)}


# ---------- Task 1: the track, the book page and the release checks ----------
def check_r4_absent(browser, url):
    js = bundle_js()
    for s in ('Embers', 'Cockcrow', 'Burnt Offerings', 'Wildfire!', 'Cinder Rooster', 'Hayrick'):
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
    page.evaluate("""() => { const g = window.__gg; g.grid[4][2] = g.newCell(0); g.grid[1][2] = g.newCell(1); g.grid[4][5] = g.newCell(0);
      window.__h = g.spawnMonster('hayrick', 2, true, 0.35); window.__h.sp = 0; }""")
    t0 = time.time(); t = None
    while time.time() - t0 < 3:
        if page.evaluate("() => (window.__gg.grid[4][2].pinned || 0)") > 0: t = time.time() - t0; break
        time.sleep(0.05)
    ok(t is not None, f'within 3 s the hayrick pins the lowest pumpkin in its column, (4, 2) ({t})')
    ok(not (page.evaluate("() => (window.__gg.grid[1][2].pinned || 0)") > 0) and not (page.evaluate("() => (window.__gg.grid[4][5].pinned || 0)") > 0), 'the pumpkin above it and the one in another column are not pinned')
    ok(page.evaluate("() => window.__h.thrown"), 'the hayrick has thrown (m.thrown)')
    ref = "() => window.__gg.grid[4][2]"
    ok(page.evaluate(f"() => window.__gg.slideOne(({ref})(), 'left')") is False, 'slideOne on the pinned pumpkin returns false')
    ok(page.evaluate(f"() => !!window.__gg.grid[4][2] && !window.__gg.grid[4][1]"), 'it stayed in its cell')
    # a push whose line holds the pinned pumpkin is refused too, like a push into a grave
    page.evaluate("() => { const g = window.__gg; g.grid[4][3] = g.newCell(2); }")
    ok(page.evaluate("() => window.__gg.slideOne(window.__gg.grid[4][3], 'left')") is False, 'a neighbour cannot push the pinned pumpkin')
    page.evaluate("() => { window.__gg.grid[4][3] = null; }")
    ok(page.evaluate("() => { const g = window.__gg, c = g.grid[4][2]; return g.bestMove() ? g.bestMove().ref !== c : true; }"), 'bestMove never picks the pinned pumpkin')
    time.sleep(1.5)
    ok(page.evaluate("() => window.__gg.slideOne(window.__gg.grid[4][2], 'left')") is False, 'still pinned 1.5 s later')
    # the pin runs out: 4 s from the throw
    time.sleep(1.6)
    left = page.evaluate("() => (window.__gg.grid[4][2].pinned || 0)")
    ok(0 <= (left or 0) < 1.2, f'the pin counts down in update ({left})')
    time.sleep(1.2)
    ok(page.evaluate("() => window.__gg.slideOne(window.__gg.grid[4][2], 'left')") is True, 'after 4.2 s it slides')
    ok(page.evaluate("() => window.__h.thrown") and page.evaluate("() => !window.__gg.grid.flat().some(c => c && c.pinned > 0)"), 'the hayrick throws once a night: nothing is pinned again')
    if hasGourd:
        page.evaluate(QUIET)
        page.evaluate("""() => { const g = window.__gg; g.grid[4][2] = g.newCell(0); g.grid[4][2].gourd = true; g.grid[3][2] = g.newCell(1);
          window.__h = g.spawnMonster('hayrick', 2, true, 0.35); window.__h.sp = 0; }""")
        time.sleep(1.5)
        ok(page.evaluate("() => !(window.__gg.grid[4][2].pinned > 0) && window.__gg.grid[3][2].pinned > 0"), 'with the gourd at (4, 2) the pin goes to the next pumpkin up')
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
