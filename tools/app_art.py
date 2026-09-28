#!/usr/bin/env python3
"""Render the iOS app icon (1024 px, no transparency) and launch image (2732 px) from tools/app_art/entry.js,
which draws with the game's own pumpkin painter. Writes into ios/App/App/Assets.xcassets.
Usage: .venv/bin/python tools/app_art.py"""
import asyncio, base64, pathlib, subprocess, tempfile
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
XC = ROOT / 'ios/App/App/Assets.xcassets'
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
        for path, expr in outs.items():
            data = await pg.evaluate(f"{expr}.toDataURL('image/png')")
            path.write_bytes(base64.b64decode(data.split(',', 1)[1])); print('wrote', path.relative_to(ROOT))
        await b.close()
    # the App Store rejects icons with an alpha channel: flatten with sips
    subprocess.run(['sips', '-s', 'format', 'jpeg', str(XC / 'AppIcon.appiconset/AppIcon-512@2x.png'), '--out', str(tmp / 'i.jpg')], check=True, capture_output=True)
    subprocess.run(['sips', '-s', 'format', 'png', str(tmp / 'i.jpg'), '--out', str(XC / 'AppIcon.appiconset/AppIcon-512@2x.png')], check=True, capture_output=True)
asyncio.run(main())
