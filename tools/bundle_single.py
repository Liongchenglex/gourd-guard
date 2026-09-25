#!/usr/bin/env python3
"""Bundle dist/ into one HTML fragment for publishing as a private artifact (phone playtests).

Usage: python3 tools/bundle_single.py [out]   (default: dist/gourd-guard.html)
Inlines the built CSS and JS; drops the <!DOCTYPE>/<html>/<head>/<body> wrappers because the
artifact host supplies its own. Run `npm run build` first.
"""
import pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
html = (DIST / 'index.html').read_text()
def inline_css(m):
    return '<style>\n' + (DIST / m.group(1).lstrip('./')).read_text() + '\n</style>'
def inline_js(m):
    return '<script type="module">\n' + (DIST / m.group(1).lstrip('./')).read_text() + '\n</script>'
html = re.sub(r'<link rel="stylesheet" crossorigin href="([^"]+)">', inline_css, html)
js_src = re.search(r'<script type="module" crossorigin src="([^"]+)"></script>', html).group(1)
html = re.sub(r'\s*<script type="module" crossorigin src="[^"]+"></script>', '', html)
head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
head = re.sub(r'<meta charset="utf-8">\s*', '', head)
out = head.strip() + '\n' + body.strip() + '\n' + inline_js(re.match(r'(.*)', js_src)) + '\n'
target = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else DIST / 'gourd-guard.html'
target.write_text(out)
print(target, len(out) // 1024, 'KB')
