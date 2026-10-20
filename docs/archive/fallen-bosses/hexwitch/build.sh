#!/bin/zsh
set -e
D=/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/fallen/hexwitch
cd /Users/liongchenglex/AI_Projects/gourd-guard
node --check $D/fallen_hexwitch.js
npx esbuild $D/preview_entry.js --bundle --format=iife --minify --outfile=$D/bundle.js --log-level=warning
python3 - <<'PY'
D='/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/fallen/hexwitch'
b=open(D+'/bundle.js').read()
css='''body{margin:0;background:#0c0c0e;color:#e8e8ec;font:14px/1.4 system-ui,sans-serif}
#app{padding:16px}.show{display:flex;flex-direction:column;align-items:flex-start;gap:10px}
.pair{display:flex;gap:16px}.col{display:flex;flex-direction:column;align-items:center;gap:6px}.cap{color:#a0a0a8;font:600 13px system-ui}
.big{border:1px solid #2a2a2e;border-radius:8px;background:#0c0c0e}
.bar{display:flex;gap:6px;flex-wrap:wrap}button{background:#1c1c20;color:#d8d8dc;border:1px solid #3a3a40;border-radius:6px;padding:6px 12px;font:13px system-ui;cursor:pointer}
button.on{background:#ff2a3a;color:#fff;border-color:#ff8a80}
.strips{margin-top:20px}.sec h2{font:600 15px system-ui;margin:18px 0 6px;color:#ff6a60}.row{display:flex;align-items:center;gap:8px;margin:4px 0}
.lbl{width:60px;color:#9a9aa0;text-align:right}.row canvas{border:1px solid #2a2a2e;border-radius:4px}'''
open(D+'/preview.html','w').write('<title>Fallen Hexwitch</title><style>'+css+'</style><div id="app"></div><script>'+b+'</script>')
print('preview.html written,', len(b), 'bytes of js')
PY
