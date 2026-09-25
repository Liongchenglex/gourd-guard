#!/usr/bin/env python3
"""Serve a directory (default dist/) on 127.0.0.1:PORT for the test tools. Usage: serve_dist.py [port] [dir]"""
import functools, http.server, pathlib, sys
port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
root = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else pathlib.Path(__file__).resolve().parent.parent / 'dist'
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
H.log_message = lambda *a, **k: None
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
