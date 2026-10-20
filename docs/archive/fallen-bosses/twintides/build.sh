#!/bin/bash
# Bundle the preview with esbuild from the repo root and wrap it into preview.html.
set -e
D=/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/6d4726e8-b506-45a3-aa11-989363c9b6cb/scratchpad/fallen/twintides
cd /Users/liongchenglex/AI_Projects/gourd-guard
npx esbuild "$D/preview_entry.js" --bundle --format=iife --minify --outfile="$D/bundle.js" --log-level=warning
{
  echo '<title>Fallen Twin Tides</title>'
  echo '<style>body{margin:0;background:#07060b;color:#d8ccd8;font:14px system-ui,sans-serif;padding:16px}h1{margin:0 0 4px;font-size:22px;color:#ff6a58}h2{font-size:15px;margin:22px 0 8px;color:#e8d8e0}.sub{margin:0 0 14px;color:#a898a8;max-width:960px}.show{display:flex;gap:14px}.fig{text-align:center}.cap{margin-top:6px;color:#c8b8c8}.big{border-radius:8px}.bar{margin:10px 0}.bar button{background:#1c1420;color:#e8d8e0;border:1px solid #3a2a3a;border-radius:6px;padding:6px 12px;margin-right:6px;cursor:pointer}.bar button.on{background:#5a1420;border-color:#ff6a58}.row{display:flex;align-items:center;gap:8px;margin:4px 0}.lbl{width:92px;color:#a898a8;text-align:right}canvas{border-radius:6px}</style>'
  echo '<div id="app"></div>'
  echo '<script>'
  cat "$D/bundle.js"
  echo '</script>'
} > "$D/preview.html"
echo "built $D/preview.html ($(wc -c < "$D/preview.html") bytes)"
