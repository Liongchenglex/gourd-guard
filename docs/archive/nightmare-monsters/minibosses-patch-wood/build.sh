#!/bin/zsh
# Bundle the preview and wrap it into preview.html (a dark fragment page). Run from the repo root: zsh docs/archive/nightmare-monsters/minibosses-patch-wood/build.sh
set -e
D=/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/f86d14c0-afbc-4956-99c9-d309efebdbe2/scratchpad/minibosses-patch-wood
K=docs/archive/nightmare-monsters/minibosses-patch-wood
mkdir -p "$D"
npx esbuild "$K/preview_entry.js" --bundle --format=iife --minify --outfile="$D/bundle.js" --log-level=warning
{
  printf '%s\n' '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Strawlord and Treant</title>'
  printf '%s\n' '<style>body{margin:0;background:#0a0710;color:#d8cce4;font:14px/1.4 system-ui,sans-serif;padding:16px;overflow-x:hidden}h1{font-size:20px;margin:0 0 6px;color:#ffb070}h2{font-size:17px;margin:24px 0 4px;color:#f0e2ff}h3{font-size:13px;margin:12px 0 4px;color:#c8a0f0;font-weight:600}.note{margin:0 0 10px;color:#a898b8;font-size:12px;max-width:760px}.row{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end}.row.strip{gap:4px}.row.game{gap:8px;background:#1a1220;padding:10px;border-radius:8px}.cell{display:flex;flex-direction:column;align-items:center;gap:2px;max-width:100%}.cell canvas{background:#1c1428;border-radius:6px;outline:1px solid #2e2240;max-width:100%;height:auto!important}.row.game .cell canvas{background:#2a1e28}.lbl{font-size:11px;color:#c8a0f0;text-align:center}</style>'
  printf '%s\n' '<div id="app"></div>'
  printf '%s' '<script>'; cat "$D/bundle.js"; printf '%s\n' '</script>'
} > "$K/preview.html"
echo "built $(wc -c < "$K/preview.html") bytes"
