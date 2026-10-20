#!/bin/zsh
set -e
D=/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/fallen/poltergeist
cd /Users/liongchenglex/AI_Projects/gourd-guard
node --check $D/fallen_poltergeist.js
npx esbuild $D/preview_entry.js --bundle --format=iife --minify --outfile=$D/bundle.js --log-level=warning
python3 - <<'PY'
D='/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/fallen/poltergeist'
b=open(D+'/bundle.js').read()
css='''body{margin:0;background:#06100a;color:#d8ffb0;font:14px/1.4 system-ui,sans-serif}
#app{padding:16px}.sec h2{font:600 15px system-ui;margin:18px 0 6px;color:#8cff5c}.row{display:flex;align-items:center;gap:8px;margin:4px 0}
.big{border:1px solid #1e3a24;border-radius:8px}.lbl{width:70px;color:#7fa884;text-align:right}.row canvas{border:1px solid #1e3a24;border-radius:4px}.note{color:#7fa884;font:12px monospace}'''
open(D+'/preview.html','w').write('<title>Fallen Poltergeist</title><style>'+css+'</style><div id="app"></div><script>'+b+'</script>')
print('preview.html written,', len(b), 'bytes of js')
PY
