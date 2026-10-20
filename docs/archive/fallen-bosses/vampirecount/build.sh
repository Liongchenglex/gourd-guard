#!/bin/zsh
# Bundle the preview and wrap it into preview.html (no doctype/html/body: a dark fragment page).
set -e
D=/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/fallen/vampirecount
cd /Users/liongchenglex/AI_Projects/gourd-guard
npx esbuild "$D/preview_entry.js" --bundle --format=iife --minify --outfile="$D/bundle.js" --log-level=warning
{
  printf '%s\n' '<title>Fallen Count</title>'
  printf '%s\n' '<style>body{margin:0;background:#070a14;color:#c8d4ff;font:14px/1.4 system-ui,sans-serif;padding:16px}h2{font-size:18px;margin:24px 0 4px;color:#e6ecff}h3{font-size:13px;margin:12px 0 2px;color:#8fa3d8;font-weight:600}.note{margin:0 0 10px;color:#7f8db3;font-size:12px}.row{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end}.row.strip{gap:4px}.row.game{gap:10px;background:#0a1020;padding:10px;border-radius:8px}.cell{display:flex;flex-direction:column;align-items:center;gap:2px}.cell canvas{background:#0e1428;border-radius:6px;outline:1px solid #1d2746}.row.game .cell canvas{background:#182238}.lbl{font-size:11px;color:#8fa3d8}</style>'
  printf '%s\n' '<div id="app"></div>'
  printf '%s' '<script>'; cat "$D/bundle.js"; printf '%s\n' '</script>'
} > "$D/preview.html"
echo "built $(wc -c < "$D/preview.html") bytes"
