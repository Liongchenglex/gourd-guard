#!/bin/zsh
set -e
D=/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/fallen/gravekeeper
cd /Users/liongchenglex/AI_Projects/gourd-guard
node --check $D/fallen_gravekeeper.js
npx esbuild $D/preview_entry.js --bundle --format=iife --minify --outfile=$D/bundle.js --log-level=warning
python3 - <<'PY'
D='/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/fallen/gravekeeper'
b=open(D+'/bundle.js').read()
css='''body{margin:0;background:#0b0608;color:#e8dcd0;font:14px/1.4 system-ui,sans-serif}
#app{padding:16px}.pair{display:flex;gap:16px;flex-wrap:wrap}.cell{display:flex;flex-direction:column;gap:6px}.cap{color:#b89a80;font-size:13px}
.big{border:1px solid #3a1a14;border-radius:8px;background:#0b0608}
.bar{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}button{background:#2a1410;color:#e8c8a8;border:1px solid #5a2a1c;border-radius:6px;padding:6px 12px;font:13px system-ui;cursor:pointer}
button.on{background:#ff8c2a;color:#1a0a04;border-color:#ffb060}
.strips{margin-top:20px}h2{font:600 15px system-ui;margin:18px 0 6px;color:#ffb060}.row{display:flex;align-items:center;gap:8px;margin:4px 0}
.lbl{width:60px;color:#b89a80;text-align:right}.row canvas{border:1px solid #3a1a14;border-radius:4px}'''
open(D+'/preview.html','w').write('<title>Fallen Gravekeeper</title><style>'+css+'</style><div id="app"></div><script>'+b+'</script>')
print('preview.html written,', len(b), 'bytes of js')
PY
