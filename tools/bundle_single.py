#!/usr/bin/env python3
"""Bundle dist/ into one HTML fragment for publishing as a private artifact (phone playtests).

Usage: python3 tools/bundle_single.py [out] [dist_dir]   (defaults: dist/gourd-guard.html, dist/)
Inlines the built CSS and JS; drops the <!DOCTYPE>/<html>/<head>/<body> wrappers because the
artifact host supplies its own. Run `npm run build` first.
"""
import pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'dist'
html = (DIST / 'index.html').read_text()
import base64
def data_uri(m):   # fonts and other files the CSS points at become data URIs, so the single file needs nothing else
    rel = m.group(2); f = DIST / 'assets' / pathlib.Path(rel).name
    if not f.exists(): return m.group(0)
    kind = {'.woff2':'font/woff2', '.woff':'font/woff', '.png':'image/png', '.svg':'image/svg+xml'}.get(f.suffix, 'application/octet-stream')
    return 'url(' + m.group(1) + 'data:' + kind + ';base64,' + base64.b64encode(f.read_bytes()).decode() + m.group(1) + ')'
def inline_css(m):
    css = (DIST / m.group(1).lstrip('./')).read_text()
    css = re.sub(r'url\((["\']?)((?!data:)[^)"\']+)\1\)', data_uri, css)
    return '<style>\n' + css + '\n</style>'
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
