"""Diagnóstico temporal: muestra la estructura HTML de las fuentes de la Palabra."""
import sys, urllib.request, re
from bs4 import BeautifulSoup
UA = {"User-Agent": "Mozilla/5.0 (misas-barcelona; +https://gardidribas-hue.github.io/misas-barcelona/)"}
for url in sys.argv[1:]:
    print("=" * 20, url)
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r:
            print("status", r.status, r.geturl())
            html = r.read().decode("utf-8", "replace")
    except Exception as e:
        print("ERROR", e); continue
    print("len", len(html))
    for m in re.findall(r'https?://[^"\']*(?:json|api|evangelio-de-hoy/20)[^"\']*', html)[:15]:
        print("link", m)
    s = BeautifulSoup(html, "html.parser")
    for t in s(["script", "style", "nav", "footer", "header"]): t.decompose()
    for el in s.body.find_all(True) if s.body else []:
        txt = el.get_text(" ", strip=True)
        own = "".join(el.find_all(string=True, recursive=False)).strip()
        if own or el.name in ("h1","h2","h3","h4","section","article"):
            print(f"{el.name}.{'.'.join(el.get('class') or [])}#{el.get('id') or ''} | {own[:50] or txt[:50]}")
