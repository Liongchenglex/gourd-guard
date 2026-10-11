#!/usr/bin/env python3
"""Render the app icons and launch images for iOS and Android, plus the store listing art, from tools/app_art/entry.js,
which draws with the game's own pumpkin painter. Writes into ios/App/App/Assets.xcassets, android/app/src/main/res
and store/ (App Store icon, Google Play icon and feature graphic).
Usage: .venv/bin/python tools/app_art.py"""
import asyncio, base64, pathlib, subprocess, tempfile
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
XC = ROOT / 'ios/App/App/Assets.xcassets'
RES = ROOT / 'android/app/src/main/res'
STORE = ROOT / 'store'
DENS = {'mdpi':1, 'hdpi':1.5, 'xhdpi':2, 'xxhdpi':3, 'xxxhdpi':4}
SPLASH = {'mdpi':(320, 480), 'hdpi':(480, 800), 'xhdpi':(720, 1280), 'xxhdpi':(960, 1600), 'xxxhdpi':(1280, 1920)}
async def main():
    tmp = pathlib.Path(tempfile.mkdtemp()); js = tmp / 'art.js'
    subprocess.run(['npx', 'esbuild', str(ROOT / 'tools/app_art/entry.js'), '--bundle', '--format=iife', '--outfile=' + str(js)], check=True, cwd=ROOT)
    font = base64.b64encode((ROOT / 'src/fonts/creepster-latin.woff2').read_bytes()).decode()
    html = tmp / 'art.html'
    html.write_text(f"<style>@font-face{{font-family:Creepster;src:url(data:font/woff2;base64,{font})}}</style><div style=\"font-family:Creepster\">.</div><script>{js.read_text()}</script>")
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.goto(html.as_uri()); await pg.evaluate("document.fonts.load('40px Creepster')"); await pg.wait_for_timeout(300)
        outs = {
            XC / 'AppIcon.appiconset/AppIcon-512@2x.png': "ART.icon(1024)",
            XC / 'Splash.imageset/splash-2732x2732.png': "ART.splash(2732)",
            XC / 'Splash.imageset/splash-2732x2732-1.png': "ART.splash(2732)",
            XC / 'Splash.imageset/splash-2732x2732-2.png': "ART.splash(2732)",
        }
        for d, k in DENS.items():   # Android launcher icons: square, round and the adaptive foreground (108 dp)
            outs[RES / f'mipmap-{d}/ic_launcher.png'] = f"ART.icon({round(48 * k)})"
            outs[RES / f'mipmap-{d}/ic_launcher_round.png'] = f"ART.round({round(48 * k)})"
            outs[RES / f'mipmap-{d}/ic_launcher_foreground.png'] = f"ART.icon({round(108 * k)})"
        for d, (w, h) in SPLASH.items():
            outs[RES / f'drawable-port-{d}/splash.png'] = f"ART.splashWH({w}, {h})"
            outs[RES / f'drawable-land-{d}/splash.png'] = f"ART.splashWH({h}, {w})"
        outs[RES / 'drawable/splash.png'] = "ART.splashWH(480, 320)"
        STORE.mkdir(exist_ok=True)
        outs[STORE / 'appstore-icon-1024.png'] = "ART.icon(1024)"
        outs[STORE / 'play-icon-512.png'] = "ART.icon(512)"
        outs[STORE / 'play-feature-1024x500.png'] = "ART.feature(1024, 500)"
        for path, expr in outs.items():
            data = await pg.evaluate(f"{expr}.toDataURL('image/png')")
            path.write_bytes(base64.b64decode(data.split(',', 1)[1])); print('wrote', path.relative_to(ROOT))
        await b.close()
    (RES / 'values/ic_launcher_background.xml').write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#120A24</color>\n</resources>\n')
    # the App Store rejects icons with an alpha channel: flatten with sips
    subprocess.run(['sips', '-s', 'format', 'jpeg', str(XC / 'AppIcon.appiconset/AppIcon-512@2x.png'), '--out', str(tmp / 'i.jpg')], check=True, capture_output=True)
    subprocess.run(['sips', '-s', 'format', 'png', str(tmp / 'i.jpg'), '--out', str(XC / 'AppIcon.appiconset/AppIcon-512@2x.png')], check=True, capture_output=True)
asyncio.run(main())
