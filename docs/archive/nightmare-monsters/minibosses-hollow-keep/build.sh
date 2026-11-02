#!/bin/zsh
# Bundle the preview and wrap it into preview.html (a dark fragment page). Run from the repo root: zsh docs/archive/nightmare-monsters/minibosses-hollow-keep/build.sh
set -e
D=/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/f86d14c0-afbc-4956-99c9-d309efebdbe2/scratchpad/minibosses-hollow-keep
K=docs/archive/nightmare-monsters/minibosses-hollow-keep
mkdir -p "$D"
npx esbuild "$K/preview_entry.js" --bundle --format=iife --minify --outfile="$D/bundle.js" --log-level=warning
{
  printf '%s\n' '<title>Hollow and Keep Mini Bosses</title>'
  printf '%s\n' '<meta name="viewport" content="width=device-width,initial-scale=1">'
  printf '%s\n' '<style>body{margin:0;background:#070a10;color:#c8d4e0;font:14px/1.4 system-ui,sans-serif;padding:16px;overflow-x:hidden}h1{font-size:20px;margin:0 0 6px;color:#e6f0e8}h2{font-size:18px;margin:24px 0 4px;color:#e6ecf0}h3{font-size:13px;margin:12px 0 2px;color:#8fb3a8;font-weight:600}.note{margin:0 0 10px;color:#8a9aa8;font-size:12px;max-width:900px}.row{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end}.row.strip{gap:4px}.row.game{gap:10px;background:#0a1018;padding:10px;border-radius:8px}.cell{display:flex;flex-direction:column;align-items:center;gap:2px;max-width:100%}.cell canvas{background:#0e1620;border-radius:6px;outline:1px solid #1d2a36;max-width:100%;height:auto!important}.row.game .cell canvas{background:#182430}.lbl{font-size:11px;color:#8fb3a8}</style>'
  printf '%s\n' '<div id="app"></div>'
  printf '%s' '<script>'; cat "$D/bundle.js"; printf '%s\n' '</script>'
} > "$K/preview.html"
echo "built $(wc -c < "$K/preview.html") bytes"
