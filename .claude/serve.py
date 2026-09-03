#!/usr/bin/env python3
"""Static file server that avoids os.getcwd() entirely.

http.server's own CLI (python -m http.server) calls os.getcwd() while
building its argparse defaults, even when --directory is passed, which
breaks in sandboxes where getcwd() is denied. This script sets the
handler's directory directly instead, so getcwd() is never invoked.
"""
import functools
import http.server
import os
import sys

DIRECTORY = "/Users/valiversum/Documents/Claude/KlickundKlarAT"
PORT = int(os.environ.get("PORT", "8080"))

Handler = functools.partial(
    http.server.SimpleHTTPRequestHandler, directory=DIRECTORY
)

httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
print(f"Serving {DIRECTORY} on port {PORT}", file=sys.stderr)
httpd.serve_forever()
