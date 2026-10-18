#!/usr/bin/env python3
"""Records the portrait gameplay trailer (1080x1920, 30 fps, ~30 s).

Usage:
  python3 tools/trailer.py --url http://127.0.0.1:4173/ [--dev http://localhost:5199/] [--music assets/music/play_draft1.mp3] [--out store/trailer.mp4]

Three parts:
  1. Story intro (tools/trailer/cinema.js): hand-staged shots drawn with the game's characters, rendered frame by frame
     from a running Vite dev server (`npx vite --port 5199`), with sound effects only.
  2. Gameplay: real nights from the built game (--url), played by a fast bot and captured with the Chrome screencast.
     The music starts here, from 0:00.
  3. End card.
Needs ffmpeg on PATH and the venv's playwright (see CLAUDE.md).
"""
import argparse, base64, pathlib, shutil, subprocess, sys, tempfile, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SFX = ROOT / 'assets/sfx'
FPS = 30
VW, VH, DSF = 405, 720, 1080 / 405   # 9:16, rendered at 1080x1920

# Gameplay clips: (name, story night, capture seconds, use from, use to)
CLIPS = [
    ('patch', 9, 8, 2.5, 5.1),
    ('fog', 27, 8, 2.5, 5.1),
    ('wind', 47, 8, 2.5, 5.1),
    ('keep', 67, 8, 2.5, 5.1),
    ('marsh', 87, 8, 2.5, 5.1),
    ('boss', 50, 9, 1.5, 4.4),
]
END_SECS = 3.2

# Intro sound effects (seconds into the intro, sample in assets/sfx/raw or enc, volume), matched to tools/trailer/cinema.js.
INTRO_SFX = [
    (0.0, 'wind_0', .55), (3.4, 'wind_0', .45), (7.0, 'wind_0', .35), (1.3, 'creak_1', .5),
    (2.9, 'ghost_0', .35), (3.2, 'bat_0', .3), (3.15, 'shovel_0', .6), (3.6, 'shovel_0', .55), (4.0, 'shovel_0', .5), (4.3, 'shovel_0', .5), (4.7, 'shovel_0', .6),
    (3.4, 'ghoul_0', .8), (4.2, 'ghoul_3', .7), (4.85, 'roar_2', .8),
    (6.0, 'heartbeat_1', .9), (6.15, 'pop_0', .8), (6.85, 'heartbeat_1', .9), (7.3, 'ghoul_1', .6), (7.7, 'heartbeat_1', .9), (8.5, 'heartbeat_1', .9),
    (8.9, 'torch_1', 1.0), (9.32, 'torch_1', 1.0), (9.74, 'torch_1', 1.0),
    (10.45, 'whooshlong_0', .9), (10.55, 'throw_0', 1.0),
]

ALL_TYPES = ['green', 'yellow', 'ice', 'fire', 'grey', 'purple', 'white', 'black', 'blue', 'pink', 'turquoise', 'brown']
UNLOCK = [1, 2, 5, 8, 64, 43, 23, 69, 84, 28, 46, 87]

OVERLAY_JS = """
() => {
  const css = document.createElement('style');
  css.textContent = `
    #banner{ display:none !important; }
    .trTap{ position:fixed; width:38px; height:38px; margin:-19px 0 0 -19px; border-radius:50%; pointer-events:none; z-index:9998;
      background:rgba(255,255,255,.55); border:3px solid #fff; box-shadow:0 0 14px rgba(255,200,120,.9); transition:transform .28s ease-out, opacity .35s; }
  `;
  document.head.appendChild(css);
  // fingertip: where a cell sits on screen
  window.__trXY = (r, c) => {
    const cv = document.querySelector('canvas'), b = cv.getBoundingClientRect(), W = 540, H = W * b.height / b.width, CS = 74;
    const GX = (W - 7 * CS) / 2, GY = H - 26 - 5 * CS;
    return { x: b.left + (GX + c * CS + CS / 2) / W * b.width, y: b.top + (GY + r * CS + CS / 2) / H * b.height, s: b.width / W };
  };
  window.__trTap = (r, c, dx, dy) => {
    const p = window.__trXY(r, c), t = document.createElement('div'); t.className = 'trTap';
    t.style.left = p.x + 'px'; t.style.top = p.y + 'px'; document.body.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => { t.style.transform = `translate(${dx * 74 * p.s}px, ${dy * 74 * p.s}px)`; }));
    setTimeout(() => { t.style.opacity = 0; }, 260); setTimeout(() => t.remove(), 700);
  };
}
"""

# The balance bot's tactics, faster, with a visible fingertip on every slide and flick.
BOT_JS = """
(interval) => {
  const where = ref => { const g = window.__gg.grid; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) if (g[r][c] === ref) return { r, c }; return null; };
  const slide = (ref, dir) => { const p = where(ref); if (p) window.__trTap(p.r, p.c, dir === 'left' ? -1 : dir === 'right' ? 1 : 0, dir === 'down' ? 1 : dir === 'up' ? -1 : 0); window.__gg.slideOne(ref, dir); };
  const flick = ref => { const p = where(ref); if (p) window.__trTap(p.r, p.c, 0, -1.4); window.__gg.launchGroup(ref); };
  window.__bot = setInterval(() => {
    const h = window.__gg; if (!h || h.state !== 'play') return;
    const G = h.G;
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
      if (useful >= 1 && (useful / cells.length >= 0.4 || urgent > 0.5) && useful > pickScore){ pickScore = useful; pick = (cells.find(o => o.cell.c !== 6) || cells[0]).cell; }
    }
    if (pick){ flick(pick); return; }
    const mv = h.bestMove(); if (mv){ slide(mv.ref, mv.dir); return; }
    const b = h.bestLitGroup(); if (b && h.emptyCells().length < 8){ flick(b); return; }
  }, interval);
}
"""

# Keep the field busy: a trailer shows the middle of a night, not its quiet first seconds.
STAGE_JS = """
(boss) => {
  const h = window.__gg, keys = (h.G.def.pool || []).map(e => e[0]).filter(k => k !== 'boss');
  const lanes = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
  if (boss) h.spawnMonster('boss', 3, false, 0.38);
  for (let i = 0; i < (boss ? 3 : 6); i++) h.spawnMonster(keys[i % keys.length], lanes[i], false, 0.15 + Math.random() * 0.4);
  window.__stage = setInterval(() => {
    if (h.state === 'play' && h.G.monsters.length < 6) h.spawnMonster(keys[Math.floor(Math.random() * keys.length)], null, false, 0.05 + Math.random() * 0.2);
  }, 1100);
}
"""

END_HTML = """
<div id="trEnd" style="position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;
  background:radial-gradient(circle at 50% 42%, #5a2a12 0%, #1d0b22 55%, #0b0610 100%);">
  <div style="font-family:Creepster,fantasy;font-size:92px;line-height:.9;text-align:center;color:#ff8a1c;
    text-shadow:0 0 28px rgba(255,140,30,.65),0 5px 0 #6b2600;animation:pop .6s cubic-bezier(.2,1.6,.4,1) both">GOURD<br>GUARD</div>
  <div style="font-family:Fredoka,sans-serif;font-weight:600;font-size:25px;color:#ffe6c4;opacity:0;animation:fade .5s .5s forwards">Hold the walls till dawn</div>
  <div style="font-family:Fredoka,sans-serif;font-weight:700;font-size:21px;color:#1d0b22;background:#ff9a2e;border-radius:30px;padding:12px 26px;
    margin-top:18px;opacity:0;animation:fade .5s 1s forwards">{END}</div>
</div>
<style>@keyframes pop{from{transform:scale(.5);opacity:0}to{transform:none;opacity:1}}@keyframes fade{to{opacity:1}}</style>
"""


def capture(page, cdp, seconds, outdir):
    """Screencast frames for `seconds`; returns [(timestamp, path)]."""
    frames = []
    def on_frame(ev):
        p = outdir / f'f{len(frames):05d}.jpg'
        p.write_bytes(base64.b64decode(ev['data']))
        frames.append((ev['metadata']['timestamp'], p))
        cdp.send('Page.screencastFrameAck', {'sessionId': ev['sessionId']})
    cdp.on('Page.screencastFrame', on_frame)
    cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 92, 'maxWidth': 1080, 'maxHeight': 1920, 'everyNthFrame': 1})
    t0 = time.time()
    while time.time() - t0 < seconds:
        page.wait_for_timeout(50)
    cdp.send('Page.stopScreencast')
    page.wait_for_timeout(200)
    cdp.remove_listener('Page.screencastFrame', on_frame)
    return frames


def resample(frames, start, end, outdir):
    """Constant-rate frame sequence from the screencast's timestamps (repeats the latest frame for each tick)."""
    if not frames:
        sys.exit('no frames captured')
    t0 = frames[0][0]
    outdir.mkdir(parents=True, exist_ok=True)
    j, n = 0, int(round((end - start) * FPS))
    for k in range(n):
        t = start + k / FPS
        while j + 1 < len(frames) and frames[j + 1][0] - t0 <= t:
            j += 1
        shutil.copyfile(frames[j][1], outdir / f'o{k:05d}.jpg')
    return n


def render_intro(browser, dev, outdir):
    """Frame-exact render of the story intro."""
    outdir.mkdir(parents=True, exist_ok=True)
    page = browser.new_page(viewport={'width': 540, 'height': 960})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(dev.rstrip('/') + '/tools/trailer/cinema.html')
    page.wait_for_function('window.ready')
    page.evaluate('window.ready')
    n = int(round(page.evaluate('window.END') * FPS))
    for k in range(n):
        d = page.evaluate(f"(window.renderFrame({k / FPS}), document.getElementById('cv').toDataURL('image/jpeg', .93))")
        (outdir / f'o{k:05d}.jpg').write_bytes(base64.b64decode(d.split(',', 1)[1]))
    page.close()
    print(f'intro: {n} frames', ('ERRORS ' + '; '.join(errors[:2])) if errors else '', flush=True)


def record(browser, url, name, n, secs, a, b, outdir, endline, interval):
    """A gameplay night (n > 0) or the end card (n == 0), screencast and resampled to FPS."""
    raw = outdir / 'raw'
    raw.mkdir(parents=True)
    page = browser.new_page(viewport={'width': VW, 'height': VH}, device_scale_factor=DSF)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url)
    page.wait_for_timeout(1200)
    page.evaluate(OVERLAY_JS)
    if n:
        page.evaluate("""([types, n]) => Object.assign(window.__gg.save, {
            seenHelp:true, seenFlick:true, fw:0, repair:0, fence:3, spawnEvery:2,
            stars:Object.fromEntries([20, 40, 60, 80].filter(k => k < n).map(k => [k, 3])),
            lv:Object.fromEntries(types.map(t => [t, 5])) })""", [ALL_TYPES, n])
        lo = sorted([t for t in range(12) if UNLOCK[t] <= n], key=lambda t: UNLOCK[t])[-5:]
        page.evaluate("([n, lo]) => window.__gg.startGame('story', n, lo)", [n, lo])
        page.wait_for_timeout(400)
        page.evaluate(STAGE_JS, name == 'boss')
        page.evaluate(BOT_JS, interval)
    else:
        page.evaluate("(h) => document.body.insertAdjacentHTML('beforeend', h)", END_HTML.replace('{END}', endline))
    page.wait_for_timeout(100)
    cdp = page.context.new_cdp_session(page)
    frames = capture(page, cdp, secs, raw)
    cnt = resample(frames, a, b, outdir / 'out')
    print(f'{name}: {len(frames)} frames ({len(frames) / secs:.0f}/s), {cnt} out', ('ERRORS ' + '; '.join(errors[:2])) if errors else '', flush=True)
    page.close()


def encode(frames_dir, seg):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(frames_dir / 'o%05d.jpg'),
                    '-vf', 'scale=1080:1920:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', str(seg)], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True, help='the built game (tools/serve_dist.py)')
    ap.add_argument('--dev', default='http://localhost:5199/', help='Vite dev server, for the story intro')
    ap.add_argument('--music', default=str(ROOT / 'assets/music/play_draft1.mp3'))
    ap.add_argument('--out', default=str(ROOT / 'store/trailer.mp4'))
    ap.add_argument('--work', default=None, help='scratch folder for frames (default: a temp folder)')
    ap.add_argument('--endline', default='Coming soon on iPhone and Android')
    ap.add_argument('--only', default=None, help='comma list of parts to (re)record: intro, clip names, end, or none; others reuse --work')
    ap.add_argument('--interval', type=int, default=520, help='ms between bot actions')
    args = ap.parse_args()
    work = pathlib.Path(args.work or tempfile.mkdtemp(prefix='gg_trailer_'))
    work.mkdir(parents=True, exist_ok=True)
    only = set(args.only.split(',')) if args.only else None
    want = lambda name: not only or name in only
    page_url = args.url + ('&test' if '?' in args.url else '?test')

    with sync_playwright() as p:
        browser = p.chromium.launch()
        if want('intro'):
            shutil.rmtree(work / 'intro', ignore_errors=True)
            render_intro(browser, args.dev, work / 'intro' / 'out')
        for name, n, secs, a, b in CLIPS:
            if want(name):
                shutil.rmtree(work / name, ignore_errors=True)
                record(browser, page_url, name, n, secs, a, b, work / name, args.endline, args.interval)
        if want('end'):
            shutil.rmtree(work / 'end', ignore_errors=True)
            record(browser, page_url, 'end', 0, END_SECS + .4, .2, END_SECS + .2, work / 'end', args.endline, args.interval)
        browser.close()

    # Video: intro, a white flash cut into the gameplay, quick fades between nights, a slower fade to the end card.
    parts = ['intro'] + [c[0] for c in CLIPS] + ['end']
    fades = [('fadewhite', .2)] + [('fade', .18)] * (len(CLIPS) - 1) + [('fade', .4)]
    inputs, filt, durs = [], [], []
    for name in parts:
        seg = work / f'{name}.mp4'
        encode(work / name / 'out', seg)
        inputs += ['-i', str(seg)]
        durs.append(len(list((work / name / 'out').glob('o*.jpg'))) / FPS)
    last, acc, xs = '0:v', 0.0, 0.0
    for i in range(1, len(parts)):
        tr, xf = fades[i - 1]
        acc += durs[i - 1]; xs += xf
        off = acc - xs
        if i == 1:
            music_at = off + xf   # the music lands on the first gameplay frame
        filt.append(f'[{last}][{i}:v]xfade=transition={tr}:duration={xf}:offset={off:.3f}[v{i}]')
        last = f'v{i}'
    total = sum(durs) - xs

    # Audio: the intro's sound effects, then the music from 0:00 at the cut, faded out under the end card.
    m = k = len(parts)
    for t, f, vol in INTRO_SFX:
        src = SFX / 'raw' / f'{f}.mp3'
        inputs += ['-i', str(src if src.exists() else SFX / 'enc' / f'{f}.mp3')]
        ms = int(t * 1000)
        filt.append(f'[{k}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume={vol},adelay={ms}|{ms}[s{k}]')
        k += 1
    inputs += ['-i', args.music]
    ms, mlen = int(music_at * 1000), total - music_at
    filt.append(f'[{k}:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:{mlen:.3f},afade=t=in:d=0.08,'
                f'afade=t=out:st={mlen - 1.8:.3f}:d=1.8,adelay={ms}|{ms}[mus]')
    labels = ''.join(f'[s{i}]' for i in range(m, k)) + '[mus]'
    filt.append(f'{labels}amix=inputs={k - m + 1}:normalize=0:duration=longest,atrim=0:{total:.3f},alimiter=limit=0.95[a]')
    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(filt),
                    '-map', f'[{last}]', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p',
                    '-r', str(FPS), '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(out)], check=True)
    print(f'wrote {out} ({total:.1f}s, music from {music_at:.2f}s); frames in {work}')


if __name__ == '__main__':
    main()
