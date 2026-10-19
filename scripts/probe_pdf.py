"""Diagnóstico temporal: texto de páginas concretas de un PDF."""
import sys, io, urllib.request
from pypdf import PdfReader
UA = {"User-Agent": "Mozilla/5.0"}
url, pages = sys.argv[1], [int(x) for x in sys.argv[2:]]
r = PdfReader(io.BytesIO(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()))
for i in pages:
    print("=== page", i); print(repr(r.pages[i].extract_text()))
    print("--- layout"); print(r.pages[i].extract_text(extraction_mode="layout"))
