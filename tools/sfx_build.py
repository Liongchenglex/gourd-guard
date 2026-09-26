"""Build the sample bank: trims, normalises and encodes the chosen CC0 recordings (assets/sfx/raw) into small mono MP3s
and writes them as base64 data URIs to src/data/sfxbank.js, which the audio engine decodes once at first user gesture.

BANK maps a bank key to its variants. Each variant: (source file, start seconds, max length seconds).  Files are
peak-normalised to -1 dBFS so the engine can mix keys by a single gain. Usage: .venv/bin/python tools/sfx_build.py
"""
import base64, json, pathlib, re, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW, ENC = ROOT / 'assets/sfx/raw', ROOT / 'assets/sfx/enc'
K = 'kenney/'

BANK = {
  # pumpkin impacts
  'thud':      [(K+'impactSoft_heavy_000.ogg',0,.6), (K+'impactSoft_heavy_001.ogg',0,.6), (K+'impactSoft_heavy_002.ogg',0,.6), ('punch_1.mp3',0,.5)],
  'tap':       [(K+'impactWood_light_000.ogg',0,.4), (K+'impactWood_light_001.ogg',0,.4)],
  'heavy':     [('rock_0.mp3',0,.9), (K+'impactWood_heavy_000.ogg',0,.7), (K+'impactWood_heavy_001.ogg',0,.7)],
  'ice':       [('ice_1.mp3',0,1.2)],
  'fire':      [('fire_0.mp3',0,1.4)],
  'boom':      [('boom_0.mp3',0,1.1), ('boom_1.mp3',0,.8)],
  'zap':       [('zap_0.mp3',0,.75), ('zap_1.mp3',0,.3)],
  'pop':       [('pop_1.mp3',0,.25), ('pop_0.mp3',.12,.3)],
  'sparkle':   [('twinkle_1.mp3',0,1.3)],
  'magic':     [('twinkle_0.mp3',0,1.4)],
  'coin':      [('coin_1.mp3',0,.55), ('coin_0.mp3',0,.55)],
  'whoosh':    [('throw_0.mp3',0,.35), ('throw_2.mp3',0,.5)],
  'whooshlong':[('throw_1.mp3',0,1.0)],
  'reverse':   [('vanish_0.mp3',.05,.6), ('vanish_1.mp3',.05,.6)],
  # monsters
  'ghoul':     [('cartoongrunt_1.mp3',0,.4), ('cartoongrunt_2.mp3',0,.4), ('cutemonster_2.mp3',0,.35), ('cutemonster_1.mp3',0,.6)],   # cute, short (owner)
  'ghouldie':  [('cutemonster_0.mp3',0,.9), ('ghouldie_0.mp3',0,.6)],
  'groan':     [('ghoul_3.mp3',0,1.3)],
  'bat':       [('cutesqueak_0.mp3',0,.25), ('bat_1.mp3',0,.3)],   # just a squeak (owner)
  'batdie':    [('bat_1.mp3',0,.35)],
  'imp':       [('giggle_0.mp3',0,.5), ('giggle_2.mp3',0,.6)],   # soft giggle (owner)
  'impdie':    [('giggle_1.mp3',0,.9)],
  'giant':     [('giant_0.mp3',.1,1.0), ('giant_2.mp3',0,1.0)],
  'giantdie':  [('giantdie_1.mp3',0,1.6), ('giantdie_0.mp3',0,.85)],
  'ghost':     [('ghost3_0.mp3',0,.85), ('vanish_1.mp3',.05,.6)],
  'ghostdie':  [('ghost_0.mp3',.05,1.1)],   # soft moan only, no scream (owner)
  'scream':    [('ghostdie_0.mp3',.05,1.8)],
  'human':     [('human_0.mp3',0,.35), ('human_1.mp3',.1,.6), ('human_2.mp3',.08,.5)],
  'humandie':  [('humandie_1.mp3',0,1.3), ('humandie_0.mp3',0,.5)],
  'clank':     [('clank_1.mp3',.08,.5), ('clank_2.mp3',0,.42)],
  'armorbreak':[('armorbreak2_1.mp3',0,1.4)],
  'metal':     [(K+'impactMetal_heavy_000.ogg',0,.6), (K+'impactMetal_heavy_001.ogg',0,.6)],
  'metallight':[(K+'impactMetal_light_000.ogg',0,.4), (K+'impactMetal_light_002.ogg',0,.4)],
  'stonebreak':[('stonebreak_0.mp3',.08,1.6)],
  'hiss':      [('vamp2_1.mp3',0,.65), ('vamp2_0.mp3',.15,.9)],
  'chameleon': [('cutesqueak_2.mp3',0,.4), ('cutesqueak_0.mp3',0,.25)],   # cute hiccup / squeak (owner)
  'stone':     [('stonehit_1.mp3',0,.8), ('stonehit_2.mp3',0,.8)],   # castle wall hits
  'stonecrash':[('stonebig_1.mp3',0,1.6)],
  'splash':    [('splash_1.mp3',0,.6), ('splash_0.mp3',0,.8)],
  'bubbles':   [('bubbles_0.mp3',0,1.2)],
  'knock':     [('knock_0.mp3',0,.26), (K+'impactWood_medium_000.ogg',0,.4)],
  'slime':     [('slime_0.mp3',0,.45), ('slime_1.mp3',0,.6), ('slime_2.mp3',0,.25)],
  'slimedie':  [('slimedie_1.mp3',0,.76), ('squash_0.mp3',0,1.0)],
  'glassping': [('mirror_1.mp3',0,.33)],
  'glass':     [('glass_1.mp3',0,.8)],
  'witch':     [('witch_2.mp3',.1,1.0), ('cackle_1.mp3',0,1.2)],
  'witchdie':  [('witch_1.mp3',.15,1.5)],
  'witchlong': [('witch_0.mp3',0,2.1)],
  'cloth':     [('cloth_2.mp3',.2,.8), (K+'cloth1.ogg',0,.6), (K+'cloth2.ogg',0,.6)],
  'dig':       [('shovel_1.mp3',0,.7), ('shovel_0.mp3',0,.65)],
  # bosses
  'roar':      [('roar_0.mp3',0,.9), ('growl_2.mp3',.2,1.0)],
  'roarbig':   [('roar_1.mp3',0,2.0)],
  'roarfar':   [('roar_2.mp3',0,1.7)],
  'warp':      [('conjure_1.mp3',.05,1.2)],
  'teleport':  [('conjure_0.mp3',0,1.8)],
  'darkcast':  [('darkcast_0.mp3',0,1.35), ('darkcast_1.mp3',0,1.5)],
  'seabark':   [('searoar_0.mp3',0,.7)],
  'seabig':    [('searoar2_0.mp3',.3,2.0)],
  # tools and walls
  'rocket':    [('firework_0.mp3',0,1.4)],
  'torch':     [('torch_1.mp3',0,.75)],
  'creak':     [(K+'creak1.ogg',0,.8), (K+'creak2.ogg',0,.8)],
  'explode':   [('mine3_0.mp3',0,1.0)],
  'hammer':    [('hammer_0.mp3',0,.5)],
  'arrow':     [('arrow_1.mp3',0,.5), ('archer_0.mp3',.08,.4)],
  'wood':      [(K+'impactWood_medium_000.ogg',0,.5), (K+'impactWood_medium_001.ogg',0,.5), (K+'impactWood_medium_002.ogg',0,.5)],
  'woodbreak': [('woodbreak_1.mp3',0,1.05), ('woodbreak_0.mp3',0,.7)],
  'crunch':    [('chew_0.mp3',0,.42), ('chew_1.mp3',0,.4), (K+'impactWood_light_002.ogg',0,.4)],
  'wind':      [('wind_0.mp3',.1,2.6)],
  'heal':      [('heal_0.mp3',0,1.25)],
  # interface and results
  'uitap':     [(K+'click_001.ogg',0,.3)],
  'uigo':      [(K+'confirmation_001.ogg',0,.6)],
  'uiback':    [(K+'back_001.ogg',0,.5)],
  'uilevel':   [(K+'select_001.ogg',0,.4)],
  'uipick':    [(K+'drop_001.ogg',0,.4)],
  'uiunpick':  [(K+'drop_002.ogg',0,.4)],
  'uibad':     [(K+'error_002.ogg',0,.5)],
  'uistar':    [(K+'confirmation_002.ogg',0,.7)],
  'win':       [('win8bit_0.mp3',0,1.9)],   # 8-bit fanfare, Mario-like (owner)
  'lose':      [('lose_0.mp3',0,2.0)],
}

def peak_db(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(path), '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.search(r'max_volume: ([-\d.]+)', r); return float(m.group(1)) if m else 0.0

def main():
    ENC.mkdir(parents=True, exist_ok=True)
    out, total = {}, 0
    for key, variants in BANK.items():
        out[key] = []
        for i, (src, start, maxlen) in enumerate(variants):
            sp = RAW / src
            if not sp.exists(): print('MISSING', key, src); continue
            tmp = ENC / f'{key}_{i}.wav'; dst = ENC / f'{key}_{i}.mp3'
            # 1) cut, drop leading silence, mono 32 kHz
            subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-ss', str(start), '-i', str(sp), '-t', str(maxlen), '-ac', '1', '-ar', '32000',
                            '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.01', str(tmp)], check=True)
            # 2) peak-normalise to -1 dBFS, short fade out, encode
            gain = -1.0 - peak_db(tmp)
            subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', str(tmp), '-af', f'volume={gain:.2f}dB,afade=t=out:st={max(0, maxlen-0.05):.2f}:d=0.05',
                            '-c:a', 'libmp3lame', '-b:a', '48k', str(dst)], check=True)
            tmp.unlink()
            b = dst.read_bytes(); total += len(b)
            out[key].append('data:audio/mpeg;base64,' + base64.b64encode(b).decode())
    js = '// Generated by tools/sfx_build.py from assets/sfx (CC0 recordings, see assets/sfx/SOURCES.md). Do not edit by hand.\n'
    js += 'export const BANK = ' + json.dumps(out, separators=(',', ':')) + ';\n'
    (ROOT / 'src/data/sfxbank.js').write_text(js)
    print(f'{sum(len(v) for v in out.values())} clips, {total/1024:.0f} KB mp3, bank js {len(js)/1024:.0f} KB')

if __name__ == '__main__': main()
