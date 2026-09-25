#!/usr/bin/env python3
"""Human-paced balance bot for Gourd Guard.

Plays full story nights in a headless browser and reports how each went.

Usage:
  python3 tools/balance_bot.py --nights 1,5,10 [--interval 850] [--timeout 240] [--repairs 1] [--fireworks 0] --url http://127.0.0.1:4173/

Target is the built app: `npm run build`, then `python3 tools/serve_dist.py` in another terminal.

The bot takes one action every --interval ms (850 ≈ a steady human pace):
  1. use a wall repair if any wall is under 25% (and repairs are available)
  2. collect the dropped pumpkin closest to fading
  3. launch a lit bunch if at least half of it will hit something (or a monster is close)
  4. otherwise make the best slide/push the game's own hint system suggests
Upgrade levels are set per night to a plausible progression (see profile()).

Requires: pip install playwright && playwright install chromium
"""
import argparse, json, pathlib, sys, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
UNLOCK = [1, 1, 3, 8, 999, 999]  # night each pumpkin type unlocks (Green, Yellow, Ice, Fire, Grey, Purple); Grey/Purple arrive in later worlds

BOT_JS = """
(interval) => {
  window.__bot = setInterval(() => {
    const h = window.__gg; if (!h || h.state !== 'play') return;
    const G = h.G;
    if (h.save.repair > 0 && h.walls.some(w => w.hp < w.max * 0.25)){ document.querySelector('#rpBtn').click(); return; }
    if (G.drops.length && h.emptyCells().length){
      const d = G.drops.filter(d => d.t > 0.3).sort((a, b) => (a.life - a.t) - (b.life - b.t))[0];
      if (d){ h.collectDrop(d); return; }
    }
    const need = Array(7).fill(0), threat = Array(7).fill(0);
    for (const m of G.monsters) if (m.p > 0.05) for (let c = 0; c < 7; c++) if (Math.abs(m.x - h.LANE(c)) < m.hw){ need[c] += Math.max(1, Math.ceil(m.hp)); threat[c] = Math.max(threat[c], m.p + 0.1); }
    let pick = null, pickScore = 0;
    for (const gid of Object.keys(G.groups)){
      const cells = h.groupCells(+gid); if (!cells.length) continue;
      const per = Array(7).fill(0); cells.forEach(o => per[o.c]++);
      let useful = 0, urgent = 0;
      for (let k = 0; k < 7; k++){ useful += Math.min(per[k], need[k]); if (per[k]) urgent = Math.max(urgent, threat[k]); }
      if (useful >= 1 && (useful / cells.length >= 0.5 || urgent > 0.6) && useful > pickScore){ pickScore = useful; pick = (cells.find(o => o.cell.c !== 6) || cells[0]).cell; }
    }
    if (pick){ h.launchGroup(pick); return; }
    const mv = h.bestMove(); if (mv){ h.slideOne(mv.ref, mv.dir); return; }
    const b = h.bestLitGroup(); if (b && h.emptyCells().length < 6){ h.launchGroup(b); return; }
    const cells = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (h.grid[r][c] && !h.grid[r][c].lit) cells.push(h.grid[r][c]);
    if (cells.length) h.slideOne(cells[Math.floor(Math.random() * cells.length)], ['left', 'right', 'down'][Math.floor(Math.random() * 3)]);
  }, interval);
}
"""

RESULT_JS = """
() => {
  const G = window.__gg.G, w = window.__gg.walls;
  const wf = w.reduce((a, x) => a + x.hp, 0) / w.reduce((a, x) => a + x.max, 0);
  return { night: G.n, walls_pct: Math.round(wf * 100), kills: G.kills, resolved: G.resolved + '/' + G.total,
           seconds: Math.round(G.t), throws: G.throws, missed: G.missed, coins: G.coins, state: window.__gg.state,
           title: document.querySelector('#rTitle').textContent };
}
"""


def profile(n, offset=0):
    """Expected upgrade state for a player reaching global night n (world 1 = nights 1-20).
    Levels are tuned to be winnable at this profile and hard below it, so upgrades matter (owner rule, 2026-09-25).
    offset=-1 simulates a player who skipped the shop for one tier."""
    lv = 1 if n <= 4 else 2 if n <= 9 else 3 if n <= 14 else 4 if n <= 19 else 5
    fence = 0 if n <= 5 else 1 if n <= 10 else 2 if n <= 15 else 3
    return max(1, min(5, lv + offset)), max(0, min(3, fence + offset))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--nights', default='1,5,10')
    ap.add_argument('--interval', type=int, default=850, help='ms between bot actions')
    ap.add_argument('--timeout', type=int, default=240, help='max real seconds per night')
    ap.add_argument('--repairs', type=int, default=1)
    ap.add_argument('--fireworks', type=int, default=0)
    ap.add_argument('--sprout', type=int, default=5, help='seconds between sprouts')
    ap.add_argument('--url', default=None, help='page URL of the built app (required)')
    ap.add_argument('--repeats', type=int, default=1, help='runs per night; a summary line per night follows the runs')
    ap.add_argument('--offset', type=int, default=0, help='upgrade profile offset: -1 = under-upgraded player, +1 = over-upgraded')
    args = ap.parse_args()
    if not args.url:
        sys.exit('Pass --url, e.g. --url http://127.0.0.1:4173/ after `npm run build` and `python3 tools/serve_dist.py`.')
    base = args.url
    PAGE = base + ('&test' if '?' in base else '?test')

    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for n in [int(x) for x in args.nights.split(',')]:
            for rep in range(args.repeats):
                page = browser.new_page(viewport={'width': 390, 'height': 844})
                errors = []
                page.on('pageerror', lambda e: errors.append(str(e)))
                page.goto(PAGE)
                time.sleep(0.8)
                lv, fence = profile(n, args.offset)
                page.evaluate("""([lv, fence, rep, fw, sprout]) => Object.assign(window.__gg.save, {
                    seenHelp:true, seenFlick:true, fw, repair:rep, fence, spawnEvery:sprout,
                    lv:{ green:lv, yellow:lv, ice:lv, fire:lv, grey:lv, purple:lv } })""",
                    [lv, fence, args.repairs, args.fireworks, args.sprout])
                loadout = [t for t in range(6) if UNLOCK[t] <= n][:5]
                page.evaluate(BOT_JS, args.interval)
                page.evaluate("([n, lo]) => window.__gg.startGame('story', n, lo)", [n, loadout])
                t0 = time.time()
                while time.time() - t0 < args.timeout and page.evaluate("window.__gg.state") != 'result':
                    time.sleep(0.5)
                r = page.evaluate(RESULT_JS)
                r['pumpkin_level'] = lv; r['fence'] = fence; r['offset'] = args.offset
                r['errors'] = errors[:3]
                if r['state'] != 'result':
                    r['title'] = '(still playing at timeout)'
                print(json.dumps(r), flush=True)
                results.append(r)
                page.close()
        browser.close()
    nights = []
    for r in results:
        if r['night'] not in nights: nights.append(r['night'])
    for n in nights:
        rs = [r for r in results if r['night'] == n]
        wins = sum(1 for r in rs if r['title'] == 'Night saved')
        print(json.dumps({ 'night': n, 'runs': len(rs), 'wins': wins, 'win_rate': round(wins / len(rs), 2),
                           'mean_walls_pct': round(sum(r['walls_pct'] for r in rs) / len(rs), 1),
                           'mean_missed_frac': round(sum(r['missed'] / max(1, r['throws']) for r in rs) / len(rs), 2),
                           'mean_coins': round(sum(r.get('coins', 0) for r in rs) / len(rs), 1), 'offset': args.offset }), flush=True)
    if any(r['errors'] for r in results):
        sys.exit(1)


if __name__ == '__main__':
    main()
