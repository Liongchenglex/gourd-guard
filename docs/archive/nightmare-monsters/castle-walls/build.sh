#!/bin/zsh
# Bundle the preview and wrap it into preview.html (a dark fragment page). Run from the repo root: zsh docs/archive/nightmare-monsters/castle-walls/build.sh
set -e
D=/private/tmp/claude-501/-Users-liongchenglex-AI-Projects-gourd-guard/f86d14c0-afbc-4956-99c9-d309efebdbe2/scratchpad/castle-walls
K=docs/archive/nightmare-monsters/castle-walls
mkdir -p "$D"
npx esbuild "$K/preview_entry.js" --bundle --format=iife --minify --loader:.jpg=dataurl --define:__RELEASE__=1 --outfile="$D/bundle.js" --log-level=warning
{
  printf '%s\n' '<title>Castle Walls</title>'
  printf '%s\n' '<meta name="viewport" content="width=device-width, initial-scale=1">'
  printf '%s\n' '<style>:root{color-scheme:dark}html{background:#0d0912}body{margin:0;background:#0d0912;color:#e8dcd6;font:14px/1.45 system-ui,sans-serif;padding:16px;max-width:980px;margin-inline:auto;box-sizing:border-box}h1{font-size:28px;margin:4px 0 6px;color:#f0c8c8;letter-spacing:.5px}.lede{margin:0 0 8px;color:#bfaab0;max-width:66ch}.lede b,.note b{color:#f6e6dc}h2{font-size:18px;margin:26px 0 4px;color:#f6e6dc}h3{font-size:13px;margin:12px 0 2px;color:#c79aa4;font-weight:600}.note{margin:0 0 10px;color:#a8949c;font-size:13px;max-width:72ch}.row{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end}.row.strip{gap:4px}.row.game{gap:10px;background:#1a1420;padding:10px;border-radius:8px}.cell{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}.cell canvas{background:#1c1622;border-radius:6px;outline:1px solid #33263a;max-width:100%}.row.game .cell canvas{background:#2a2430}.lbl{font-size:11px;color:#c79aa4}.mapwrap{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}canvas.map{display:block;width:100%;max-width:380px;border-radius:22px;outline:1px solid #3a2a40}.ctl{display:grid;gap:12px;min-width:0}.grp{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.gl{font-size:12px;color:#a8949c;width:64px}.ctl button{font:600 14px system-ui,sans-serif;color:#f6e6dc;background:#24192c;border:1px solid #4a3450;border-radius:999px;padding:10px 14px;min-height:44px;cursor:pointer}.ctl button.on{background:#9e2f44;border-color:#c04a60}.ctl button.go{background:#3a2a18;border-color:#7a5a30}button:focus-visible{outline:2px solid #ffcf6a;outline-offset:2px}</style>'
  printf '%s\n' '<div id="app"></div>'
  printf '%s' '<script>'; cat "$D/bundle.js"; printf '%s\n' '</script>'
} > "$K/preview.html"
echo "built $(wc -c < "$K/preview.html") bytes"
