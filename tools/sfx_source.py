"""Fetch CC0 sound candidates from Freesound for the sample set (docs/AUDIO.md).

Searches Freesound's public search page with the "Creative Commons 0" licence filter, picks the most-downloaded
results in a duration window, downloads their HQ preview MP3s to assets/sfx/raw/<key>_<n>.mp3 and records every
source in assets/sfx/SOURCES.md.  No account needed: CC0 sounds need no attribution, but we credit them anyway.

Usage: .venv/bin/python tools/sfx_source.py [--only key,key] [--dry]
"""
import html, json, re, sys, time, urllib.parse, urllib.request, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / 'assets/sfx/raw'
UA = {'User-Agent': 'Mozilla/5.0 (GourdGuard sfx sourcing)'}

# key: (query, min s, max s, how many variants)
CATS = {
  'pumpkin':   ('pumpkin smash', 0.2, 2.0, 3),
  'squash':    ('melon splat', 0.2, 2.0, 2),
  'ice':       ('ice freeze crack', 0.3, 2.5, 2),
  'fire':      ('fireball whoosh', 0.3, 2.5, 2),
  'boom':      ('cartoon explosion', 0.5, 2.5, 2),
  'zap':       ('electric zap', 0.2, 1.5, 2),
  'rock':      ('rock impact thud', 0.2, 1.5, 2),
  'pop':       ('bubble pop', 0.1, 1.0, 2),
  'coin':      ('coin pickup', 0.2, 1.5, 2),
  'twinkle':   ('magic sparkle', 0.5, 2.5, 2),
  'throw':     ('whoosh swing', 0.2, 1.2, 3),
  'ghoul':     ('zombie groan', 0.3, 2.0, 4),
  'ghouldie':  ('zombie death', 0.5, 3.0, 2),
  'bat':       ('bat screech', 0.2, 2.0, 3),
  'giant':     ('monster grunt', 0.3, 2.0, 3),
  'giantdie':  ('monster death roar', 0.5, 3.0, 2),
  'ghost':     ('ghost moan', 0.5, 3.0, 3),
  'ghostdie':  ('ghost scream', 0.5, 3.0, 2),
  'imp':       ('goblin laugh', 0.3, 2.5, 3),
  'impdie':    ('goblin death', 0.3, 2.5, 2),
  'witch':     ('witch laugh', 0.5, 3.0, 3),
  'vamp':      ('vampire hiss', 0.3, 2.5, 2),
  'lizard':    ('lizard hiss', 0.3, 2.5, 2),
  'slime':     ('slime squish', 0.2, 2.0, 3),
  'slimedie':  ('goo splat', 0.2, 2.0, 2),
  'clank':     ('metal clang armor', 0.2, 1.5, 3),
  'armorbreak':('metal shatter', 0.5, 2.5, 2),
  'stonebreak':('rock crumble', 0.5, 2.5, 2),
  'glass':     ('glass shatter', 0.3, 2.0, 2),
  'splash':    ('water splash', 0.3, 2.0, 3),
  'bubbles':   ('bubbles underwater', 0.5, 3.0, 2),
  'cloth':     ('cloth swish', 0.2, 1.5, 3),
  'human':     ('male grunt pain', 0.2, 1.5, 3),
  'humandie':  ('male death scream', 0.5, 2.5, 2),
  'knock':     ('wood knock hollow', 0.1, 1.0, 2),
  'chew':      ('crunch bite', 0.2, 1.5, 3),
  'roar':      ('monster roar', 0.5, 3.0, 3),
  'searoar':   ('sea monster', 0.5, 3.0, 2),
  'darkcast':  ('dark magic spell', 0.5, 3.0, 2),
  'conjure':   ('magic teleport', 0.5, 2.5, 2),
  'firework':  ('firework whistle', 0.5, 3.0, 2),
  'hammer':    ('hammer wood', 0.2, 1.5, 2),
  'woodbreak': ('wood break crack', 0.3, 2.0, 3),
  'shovel':    ('shovel dig', 0.3, 2.0, 2),
  'arrow':     ('bow arrow shoot', 0.2, 1.5, 2),
  'wind':      ('wind gust', 1.0, 4.0, 2),
  'mine':      ('mine explosion', 0.5, 3.0, 1),
  'torch':     ('torch ignite', 0.3, 2.5, 2),
  'heal':      ('heal spell', 0.5, 2.5, 2),
  'lose':      ('game over sad', 0.8, 3.5, 1),
  'pumpkin2':  ('pumpkin', 0.2, 2.0, 3),
  'squash2':   ('vegetable smash', 0.2, 2.0, 2),
  'punch':     ('cartoon punch', 0.1, 1.0, 3),
  'vamp2':     ('snake hiss', 0.3, 2.5, 2),
  'lizard2':   ('cat hiss', 0.3, 2.0, 2),
  'ghost2':    ('spooky whisper', 0.5, 3.0, 2),
  'ghost3':    ('ghostly whoosh', 0.5, 2.5, 2),
  'searoar2':  ('whale', 0.8, 3.5, 2),
  'searoar3':  ('kraken', 0.5, 3.5, 2),
  'armorbreak2':('metal crash', 0.5, 2.5, 2),
  'mine2':     ('landmine', 0.5, 3.0, 2),
  'mine3':     ('explosion short', 0.5, 2.0, 2),
  'growl':     ('monster growl', 0.3, 2.0, 3),
  'bat2':      ('bat squeak', 0.2, 1.5, 2),
  'cackle':    ('evil cackle', 0.5, 3.0, 2),
  'mummy':     ('mummy groan', 0.5, 2.5, 2),
  'skitter':   ('bug skitter', 0.3, 2.0, 2),
  'shell':     ('turtle', 0.2, 2.0, 2),
  'gargoyle':  ('stone golem', 0.5, 2.5, 2),
  'archer':    ('bow twang', 0.2, 1.5, 2),
  'rise':      ('dirt rustle', 0.3, 2.0, 2),
  'vanish':    ('whoosh reverse', 0.3, 2.0, 2),
  'mirror':    ('glass ping', 0.2, 1.5, 2),
  'thunder':   ('thunder crack', 0.5, 3.0, 2),
  'win':       ('level complete', 0.8, 3.5, 2),
  'star':      ('achievement chime', 0.3, 2.0, 2),
  'swipe':     ('swipe whoosh', 0.1, 0.8, 4),
  'swish':     ('swish', 0.1, 0.8, 3),
  'slidepop':  ('cartoon slide', 0.2, 1.2, 3),
  'evillaugh': ('evil laugh', 0.5, 3.0, 4),
  'chuckle':   ('chuckle', 0.3, 2.0, 3),
  'muahaha':   ('muahaha', 0.5, 3.0, 2),
  'harp':      ('harp glissando', 0.5, 3.0, 3),
  'arpeggio':  ('arpeggio', 0.5, 2.5, 3),
  'success':   ('success', 0.5, 2.5, 3),
  'alarm':     ('alarm', 0.4, 2.5, 3),
  'siren2':    ('siren', 0.5, 3.0, 3),
  'vamplaugh': ('vampire laugh', 0.5, 3.0, 3),
  'snicker':   ('evil chuckle', 0.5, 2.5, 3),
  'snicker2':  ('evil snicker', 0.3, 2.5, 2),
  'combo':     ('combo chime', 0.5, 2.5, 3),
  'reward':    ('reward chime', 0.5, 2.5, 3),
  'siren':     ('warning siren short', 0.5, 3.0, 3),
  'alert':     ('alert alarm game', 0.5, 2.5, 2),
  'win8bit':   ('8-bit victory', 0.8, 4.0, 3),
  'win8bit2':  ('chiptune level complete', 0.8, 4.0, 2),
  'cutesqueak':('cute squeak', 0.1, 1.0, 3),
  'cutemonster':('cute monster', 0.2, 1.5, 3),
  'cartoongrunt':('cartoon grunt', 0.2, 1.2, 3),
  'giggle':    ('cute giggle', 0.3, 1.5, 3),
  'chirp':     ('cartoon chirp', 0.1, 1.0, 3),
  'stonehit':  ('stone impact', 0.2, 1.5, 3),
  'stonebig':  ('stone crash', 0.5, 2.5, 2),
  'ghostsoft': ('soft ghost', 0.5, 2.5, 2),
}

def search(q, dmin, dmax, want):
    f = f'license:"Creative Commons 0" duration:[{dmin} TO {dmax}]'
    url = 'https://freesound.org/search/?' + urllib.parse.urlencode({'q': q, 'f': f, 's': 'downloads desc'})
    req = urllib.request.Request(url, headers=UA)
    page = urllib.request.urlopen(req, timeout=30).read().decode('utf-8', 'replace')
    out = []
    for m in re.finditer(r'<div\s+class="bw-player"(.*?)tabindex', page, re.S):
        a = dict(re.findall(r'data-([a-z-]+)="([^"]*)"', m.group(1)))
        sid, uid = a.get('sound-id'), a.get('user-id')
        if not sid or not uid: continue
        # Preview URLs are deterministic (the page only embeds them for some clients): previews/<first 3 digits>/<id>_<user>-hq.mp3
        mp3 = a.get('mp3', f'https://cdn.freesound.org/previews/{sid[:3]}/{sid}_{uid}-lq.mp3').replace('-lq.mp3', '-hq.mp3')
        out.append({'id': sid, 'title': html.unescape(a.get('title', '')), 'user': a.get('username', ''),
                    'dur': float(a.get('duration', 0)), 'downloads': int(a.get('num-downloads', 0) or 0), 'mp3': mp3})
        if len(out) >= want: break
    return out

def main():
    only = None; dry = '--dry' in sys.argv
    if '--only' in sys.argv: only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
    RAW.mkdir(parents=True, exist_ok=True)
    src_path = ROOT / 'assets/sfx/SOURCES.md'
    sources = src_path.read_text() if src_path.exists() else '# Sample sources\n\nAll recorded samples are CC0 (public domain) from Freesound or Kenney unless noted.\n\n| file | title | author | Freesound id | licence |\n|---|---|---|---|---|\n'
    for key, (q, dmin, dmax, want) in CATS.items():
        if only and key not in only: continue
        try: res = search(q, dmin, dmax, want)
        except Exception as e: print(f'{key:11s} ERROR {e}'); continue
        print(f'{key:11s} {q!r:26s} ' + ' | '.join(f"{r['title'][:28]} ({r['dur']:.1f}s, {r['downloads']}dl)" for r in res))
        if dry: continue
        for i, r in enumerate(res):
            dst = RAW / f'{key}_{i}.mp3'
            if not dst.exists():
                try: urllib.request.urlretrieve(r['mp3'], dst)
                except Exception as e: print('   download failed', r['mp3'], e); continue
            line = f"| {dst.name} | {r['title']} | {r['user']} | https://freesound.org/s/{r['id']}/ | CC0 |"
            if line not in sources: sources += line + '\n'
            time.sleep(0.3)
        time.sleep(0.8)
    if not dry: src_path.write_text(sources)

if __name__ == '__main__': main()
