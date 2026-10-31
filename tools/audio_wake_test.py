"""Sound after leaving the app (owner report, iPhone, 2026-10-21): the game must get its sound back after a hide/show.

Three cases, all simulated in headless Chromium with the real AudioContext wrapped so the test can see every context
the game makes and can fake what iOS does:
  1. healthy: hide, show, tap -> the same context keeps playing (no rebuild)
  2. dead:    hide, show with the context "running" but its clock frozen (the WKWebView bug) -> the next tap rebuilds it
  3. stuck:   hide, show with the context stuck "interrupted" -> the next tap resumes it
Usage: .venv/bin/python tools/audio_wake_test.py --url http://127.0.0.1:4173/
"""
import argparse, sys
from playwright.sync_api import sync_playwright

WRAP = """
(() => {
  window.__acs = []; const Real = window.AudioContext;
  window.AudioContext = class extends Real { constructor(...a){ super(...a); window.__acs.push(this); } };
  for (const t of ['pointerdown', 'touchend']) document.addEventListener(t, () => { window.__gesture = true; setTimeout(() => { window.__gesture = false; }, 0); }, true);   // registered before the game's listeners
})();
"""
HIDE = """(hidden) => { Object.defineProperty(document, 'hidden', { get: () => hidden, configurable: true });
  Object.defineProperty(document, 'visibilityState', { get: () => hidden ? 'hidden' : 'visible', configurable: true });
  document.dispatchEvent(new Event('visibilitychange')); }"""
FREEZE = """() => { const ac = window.__acs[window.__acs.length - 1], t = ac.currentTime;
  Object.defineProperty(ac, 'currentTime', { get: () => t, configurable: true });
  Object.defineProperty(ac, 'state', { get: () => 'running', configurable: true });
  ac.resume = () => Promise.resolve(); }"""
STUCK = """() => { const ac = window.__acs[window.__acs.length - 1]; let st = 'interrupted';
  Object.defineProperty(ac, 'state', { get: () => st, configurable: true });
  ac.__unstick = () => { st = 'running'; };
  ac.resume = () => { if (window.__gesture) st = 'running'; return Promise.resolve(); }; }"""

def run(url):
    fails = []
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        for case in ('healthy', 'dead', 'stuck'):
            pg = b.new_page(viewport={'width': 390, 'height': 844})
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.add_init_script(WRAP)
            pg.goto(url + ('&' if '?' in url else '?') + 'test'); pg.wait_for_timeout(1200)
            pg.mouse.click(195, 600); pg.wait_for_timeout(300)   # a tap makes the context
            pg.evaluate("() => { window.__gg.ensureAudio(); }")
            pg.wait_for_timeout(300)
            n0 = pg.evaluate('window.__acs.length')
            if n0 < 1: fails.append(f'{case}: no AudioContext was made'); pg.close(); continue
            pg.evaluate(HIDE, True); pg.wait_for_timeout(200)
            if case == 'dead': pg.evaluate(FREEZE)
            if case == 'stuck': pg.evaluate(STUCK)
            pg.evaluate(HIDE, False); pg.wait_for_timeout(700)
            # the tap: the fake resume() only works while a pointer event runs (iOS wants a gesture)
            pg.mouse.click(195, 600); pg.wait_for_timeout(800)
            n1 = pg.evaluate('window.__acs.length')
            last_ok = pg.evaluate("() => { const ac = window.__acs[window.__acs.length - 1]; return ac.state === 'running'; }")
            t_a = pg.evaluate("() => window.__acs[window.__acs.length - 1].currentTime"); pg.wait_for_timeout(300)
            t_b = pg.evaluate("() => window.__acs[window.__acs.length - 1].currentTime")
            sfx_ok = pg.evaluate("() => { try { window.__gg.SFX.coin(); return true; } catch (e) { return String(e); } }")
            want_new = case == 'dead'
            print(f'{case}: contexts {n0}->{n1}, last running {last_ok}, clock {t_a:.3f}->{t_b:.3f}, sfx {sfx_ok}, errors {errs}')
            if want_new and n1 != n0 + 1: fails.append(f'{case}: expected a rebuilt context, got {n1 - n0} new')
            if not want_new and n1 != n0: fails.append(f'{case}: the context was rebuilt but should not have been')
            if not last_ok: fails.append(f'{case}: the live context is not running')
            if case != 'dead' and not t_b > t_a: fails.append(f'{case}: the clock is not advancing')
            if case == 'dead' and not t_b > t_a: fails.append(f'{case}: the rebuilt clock is not advancing')
            if sfx_ok is not True or errs: fails.append(f'{case}: sound call failed {sfx_ok} {errs}')
            pg.close()
        b.close()
    print('FAIL\n  ' + '\n  '.join(fails) if fails else 'PASS')
    return 1 if fails else 0

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--url', default='http://127.0.0.1:4173/')
    sys.exit(run(ap.parse_args().url))
