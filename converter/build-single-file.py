#!/usr/bin/env python3
"""Bundle Green Convert into one self-contained HTML file.

The stylesheet, all four scripts and the icons are inlined, so the result runs
from a double-click with nothing beside it. Run it from the converter folder:

    python3 build-single-file.py

Output: dist/Green Convert.html

What the single file gives up versus the served app: the manifest-driven
install, the service worker, and writing straight into an output folder --
all three need a real http(s) origin. Converting, compressing, cropping and
downloading (including the batch .zip) all work from the file.
"""

import base64
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, 'dist')
OUT_FILE = os.path.join(OUT_DIR, 'Green Convert.html')

SCRIPTS = ['js/encoders.js', 'js/core.js', 'js/crop.js', 'js/app.js']
ICONS = {
    'icons/favicon.ico': 'image/x-icon',
    'icons/icon-192.png': 'image/png',
    'icons/icon-512.png': 'image/png',
    'icons/icon-180.png': 'image/png',
}


def read(rel):
    with open(os.path.join(HERE, rel), encoding='utf-8') as f:
        return f.read()


def data_uri(rel, mime):
    with open(os.path.join(HERE, rel), 'rb') as f:
        return 'data:%s;base64,%s' % (mime, base64.b64encode(f.read()).decode())


def build():
    html = read('index.html')

    html, n = re.subn(r'<link rel="stylesheet" href="css/converter\.css[^"]*">',
                      lambda m: '<style>\n' + read('css/converter.css') + '\n</style>',
                      html, count=1)
    if n != 1:
        sys.exit('could not find the stylesheet link in index.html')

    for rel in SCRIPTS:
        body = read(rel)
        html, n = re.subn(r'<script src="%s[^"]*"></script>' % re.escape(rel),
                          lambda m, b=body: '<script>\n' + b + '\n</script>',
                          html, count=1)
        if n != 1:
            sys.exit('could not find the script tag for %s in index.html' % rel)

    # The manifest only means something on a served origin.
    html = html.replace('<link rel="manifest" href="manifest.webmanifest?v=1">', '')

    for rel, mime in ICONS.items():
        html = html.replace('href="%s"' % rel, 'href="%s"' % data_uri(rel, mime))

    leftovers = re.findall(r'(?:src|href)="(?!data:|http|#)([^"]+)"', html)
    if leftovers:
        sys.exit('these references were not inlined: %s' % leftovers)

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        f.write(html)
    print('wrote %s (%.0f KB)' % (OUT_FILE, len(html.encode()) / 1024))


if __name__ == '__main__':
    build()
