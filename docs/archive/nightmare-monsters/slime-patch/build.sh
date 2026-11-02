#!/bin/zsh
# Rebuild preview.html for the nightmare Pumpkin Patch monsters. Run from the repo root: zsh docs/archive/nightmare-monsters/slime-patch/build.sh
set -e
F=docs/archive/nightmare-monsters/slime-patch
D=/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/f86d14c0-afbc-4956-99c9-d309efebdbe2/scratchpad/slime
mkdir -p $D
node --check $F/slime_patch.js
npx esbuild $F/preview_entry.js --bundle --format=iife --minify --outfile=$D/bundle.js --log-level=warning
python3 - "$D/bundle.js" "$F/preview.html" <<'PY'
import sys
b = open(sys.argv[1]).read()
css = '''body{margin:0;background:#0b0608;color:#e8dcd0;font:14px/1.4 system-ui,sans-serif}
#app{padding:16px}h1{font:600 18px system-ui;color:#ffb060;margin:4px 0}h2{font:600 15px system-ui;margin:0 0 4px;color:#ffb060}
.cap{color:#b89a80;font-size:13px;margin:2px 0 8px}.card{border-top:1px solid #3a1a14;margin-top:18px;padding-top:12px}
.pair{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}.cell{display:flex;flex-direction:column;gap:6px}
.big{border:1px solid #3a1a14;border-radius:8px;background:#0b0608}
.bar{display:flex;gap:6px;flex-wrap:wrap}button{background:#2a1410;color:#e8c8a8;border:1px solid #5a2a1c;border-radius:6px;padding:6px 12px;font:13px system-ui;cursor:pointer;min-height:32px}
button.on{background:#ff8c2a;color:#1a0a04;border-color:#ffb060}
.row{display:flex;align-items:center;gap:8px;margin:4px 0}.lbl{width:44px;color:#b89a80;text-align:right;font-size:12px}.row canvas{border:1px solid #3a1a14;border-radius:4px}
#lineup,#gamesize{border:1px solid #3a1a14;border-radius:8px;max-width:100%;height:auto}'''
open(sys.argv[2], 'w').write('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nightmare Patch Monsters</title><style>' + css + '</style><div id="app"></div><script>' + b + '</script>')
print('preview.html written,', len(b), 'bytes of js')
PY
