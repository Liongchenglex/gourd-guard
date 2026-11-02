cd /Users/liongchenglex/AI_Projects/gourd-guard
npx esbuild docs/archive/gourds/entry.js --bundle --format=iife --minify --loader:.jpg=dataurl --outfile=/tmp/gourds.js --log-level=warning && { cat docs/archive/gourds/head.html; cat /tmp/gourds.js; echo '</script>'; } > docs/archive/gourds/preview.html
