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
    for s in ('Embers', 'Cockcrow', 'Burnt Offerings', 'Wildfire!'):
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
