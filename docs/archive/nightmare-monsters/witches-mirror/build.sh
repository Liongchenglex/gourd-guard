#!/bin/zsh
# Rebuild preview.html (run from the repo root): bundles preview_entry.js with esbuild and inlines it into a self-contained page.
set -e
F=docs/archive/nightmare-monsters/witches-mirror
D=/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/f86d14c0-afbc-4956-99c9-d309efebdbe2/scratchpad/witch
mkdir -p $D
node --check $F/nightmare_witches.js; node --check $F/grand_mirror.js
npx esbuild $F/preview_entry.js --bundle --format=iife --minify --outfile=$D/bundle.js --log-level=warning
python3 - "$D" "$F" <<'PY'
import sys
D, F = sys.argv[1], sys.argv[2]
b = open(D + '/bundle.js').read()
css = '''body{margin:0;background:#0c0c0e;color:#e8e8ec;font:14px/1.4 system-ui,sans-serif}
#app{padding:16px}.pair{display:flex;gap:16px;flex-wrap:wrap}.col{display:flex;flex-direction:column;align-items:center;gap:6px}.cap{color:#a0a0a8;font:600 13px system-ui}
.big{border:1px solid #2a2a2e;border-radius:8px;background:#0c0c0e}
.bar{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}button{background:#1c1c20;color:#d8d8dc;border:1px solid #3a3a40;border-radius:6px;padding:6px 12px;font:13px system-ui;cursor:pointer;min-height:36px}
button.on{background:#ff2a3a;color:#fff;border-color:#ff8a80}
.sec h2{font:600 15px system-ui;margin:22px 0 8px;color:#ff6a60}.sec h3{font:600 13px system-ui;margin:14px 0 4px;color:#c8c8d0}.row{display:flex;align-items:center;gap:8px;margin:4px 0;overflow-x:auto}
.lbl{width:60px;flex:none;color:#9a9aa0;text-align:right}.row canvas{border:1px solid #2a2a2e;border-radius:4px;flex:none}canvas{max-width:none}'''
open(F + '/preview.html', 'w').write('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nightmare Witches and Mirror</title><style>' + css + '</style><div id="app"></div><script>' + b + '</script>')
print('preview.html written,', len(b), 'bytes of js')
PY
