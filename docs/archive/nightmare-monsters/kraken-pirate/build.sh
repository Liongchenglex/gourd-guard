#!/bin/bash
# Bundle the preview with esbuild (run from anywhere; works from the repo root) and wrap it into preview.html next to this script.
set -e
D=/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/f86d14c0-afbc-4956-99c9-d309efebdbe2/scratchpad/kraken
HERE=docs/archive/nightmare-monsters/kraken-pirate
mkdir -p "$D"
cd /Users/liongchenglex/AI_Projects/gourd-guard
npx esbuild "$HERE/preview_entry.js" --bundle --format=iife --minify --outfile="$D/bundle.js" --log-level=warning
{
  echo '<!doctype html><meta charset="utf-8"><title>Kraken and Drowned Pirate</title>'
  echo '<style>body{margin:0;background:#07060b;color:#d8ccd8;font:14px system-ui,sans-serif;padding:16px}h1{margin:0 0 4px;font-size:22px;color:#ff6a58}h2{font-size:15px;margin:22px 0 8px;color:#e8d8e0}.sub{margin:0 0 10px;color:#a898a8;max-width:960px}.phase{margin:6px 0;color:#ffb0a0;font-weight:600;min-height:18px}.show{display:flex;gap:14px}.big{border-radius:8px}.bar{margin:10px 0}.bar button{background:#1c1420;color:#e8d8e0;border:1px solid #3a2a3a;border-radius:6px;padding:6px 12px;margin-right:6px;cursor:pointer}.bar button.on{background:#5a1420;border-color:#ff6a58}.row{display:flex;align-items:center;gap:8px;margin:4px 0}.lbl{width:96px;color:#a898a8;text-align:right;flex:none}canvas{border-radius:6px}</style>'
  echo '<div id="app"></div>'
  echo '<script>'
  cat "$D/bundle.js"
  echo '</script>'
} > "$HERE/preview.html"
echo "built $HERE/preview.html ($(wc -c < "$HERE/preview.html") bytes)"
