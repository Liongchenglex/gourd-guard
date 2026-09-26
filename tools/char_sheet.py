#!/usr/bin/env python3
"""Render every clip of the baked characters to a PNG for review.

Usage: .venv/bin/python tools/char_sheet.py --keys ghoul,ghoul|drownedGhoul,wraith --out /tmp/sheet.png [--url http://localhost:5199/]
Needs a running `npx vite --port 5199` dev server (the tool starts one if --url is omitted).
Keys are atlas keys: a monster type / boss kind, or 'type|variantKey' for a costumed variant. Use --all for every drawn character.
"""
import argparse, subprocess, sys, time
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--keys', default='')
ap.add_argument('--all', action='store_true')
ap.add_argument('--out', default='char_sheet.png')
ap.add_argument('--url', default='')
ap.add_argument('--frame', type=int, default=150, help='frame box in css px')
a = ap.parse_args()

proc = None
url = a.url
if not url:
    proc = subprocess.Popen(['npx', 'vite', '--port', '5199', '--strictPort'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    url = 'http://localhost:5199/'
    time.sleep(2.5)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 900}, device_scale_factor=2)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(url + '?test'); pg.wait_for_timeout(1500)
        res = pg.evaluate("""async ([keys, useAll, FB]) => {
          const C = await import('/src/engine/render/chars.js'), A = await import('/src/engine/render/anim.js'), D = await import('/src/data/monsters.js');
          let list = keys;
          if (useAll){ list = []; for (const k of Object.keys(C.CHARS)){ list.push(k); const v = C.CHARS[k].variants || {}; for (const vk of Object.keys(v)) list.push(k + '|' + vk); } }
          A.setBakeScale(1.6);
          const rows = list.map(k => ({ k, at: A.atlas(k) }));
          const maxW = Math.max(...rows.map(r => Object.values(r.at.clips).reduce((s, cl) => s + cl.n, 0)));
          const cw = FB, ch = FB, W = 190 + maxW * cw, H = rows.reduce((s, r) => s + Object.keys(r.at.clips).length * (ch + 22) + 10, 0);
          const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
          g.fillStyle = '#3a2d40'; g.fillRect(0, 0, W, H); g.font = '13px sans-serif';
          let y = 0;
          for (const { k, at } of rows){
            for (const [name, cl] of Object.entries(at.clips)){
              g.fillStyle = '#f1e9f3'; g.fillText(k + ' · ' + name + ' · ' + cl.n + ' @ ' + cl.fps, 8, y + 16);
              const s = Math.min(cw / at.dw, ch / at.dh) * 0.95;
              for (let i = 0; i < cl.n; i++){
                const x = 190 + i * cw; g.fillStyle = i % 2 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.03)'; g.fillRect(x, y + 20, cw, ch);
                g.save(); g.translate(x + cw / 2, y + 20 + ch / 2); g.scale(s, s); g.translate(-at.dx - at.dw / 2, -at.dy - at.dh / 2);
                g.drawImage(cl.c, i * cl.fw, 0, cl.fw, cl.fh, at.dx, at.dy, at.dw, at.dh); g.restore();
              }
              y += ch + 22;
            }
            y += 10;
          }
          return c.toDataURL('image/png');
        }""", [[k for k in a.keys.split(',') if k], a.all, a.frame])
        import base64
        open(a.out, 'wb').write(base64.b64decode(res.split(',', 1)[1]))
        print('wrote', a.out, 'errors:', errs or 'none')
        b.close()
finally:
    if proc: proc.terminate()
