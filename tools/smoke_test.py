#!/usr/bin/env python3
"""Smoke test for Gourd Guard: plays with real mouse input (no test hook) on phone and desktop sizes.

Usage: python3 tools/smoke_test.py
Exits non-zero if the page throws any error. Saves screenshots to tools/out/.
Requires: pip install playwright && playwright install chromium
"""
import pathlib, random, sys, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = (ROOT / 'index.html').as_uri()
OUT = ROOT / 'tools' / 'out'
OUT.mkdir(parents=True, exist_ok=True)
W, CS, ROWS = 540, 74, 5

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    for vp in [{'width': 390, 'height': 844}, {'width': 1280, 'height': 800}]:
        page = browser.new_page(viewport=vp)
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(PAGE)
        time.sleep(1)
        page.screenshot(path=str(OUT / f"title_{vp['width']}.png"))
        page.click('#bStory'); page.click('.lv >> nth=0')
        if page.is_visible('#bHelpOk'):
            page.click('#bHelpOk')
        time.sleep(0.8)
        box = page.query_selector('#cv').bounding_box()
        sc = box['width'] / W
        logical_h = box['height'] / sc
        gy = logical_h - 26 - ROWS * CS
        for _ in range(45):
            x = box['x'] + random.uniform(40, 500) * sc
            y = box['y'] + random.uniform(gy - 200, gy + ROWS * CS - 10) * sc
            dx, dy = random.choice([(1, 0), (-1, 0), (0, 1), (0, -1), (0, -1), (0, 0)])
            page.mouse.move(x, y); page.mouse.down()
            page.mouse.move(x + dx * 20 * sc, y + dy * 20 * sc); page.mouse.move(x + dx * 50 * sc, y + dy * 50 * sc)
            page.mouse.up()
            time.sleep(0.25)
        page.screenshot(path=str(OUT / f"play_{vp['width']}.png"))
        print(vp['width'], page.inner_text('#lvlLabel'), '| coins', page.inner_text('#coinTxt'),
              '|', page.eval_on_selector('#walls', 'e => e.getAttribute("aria-label")'))
        page.close()
    browser.close()

print('errors:', errors or 'none')
sys.exit(1 if errors else 0)
