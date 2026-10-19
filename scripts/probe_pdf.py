"""Diagnóstico temporal: líneas cortas de un PDF alrededor de palabras clave."""
import sys, io, urllib.request
from pypdf import PdfReader
UA = {"User-Agent": "Mozilla/5.0"}
url, keys = sys.argv[1], sys.argv[2:]
data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
r = PdfReader(io.BytesIO(data))
print("pages", len(r.pages))
for i, p in enumerate(r.pages):
    t = p.extract_text() or ""
    for ln in t.splitlines():
        if any(k.lower() in ln.lower() for k in keys):
            print(i, "|", ln[:45])
