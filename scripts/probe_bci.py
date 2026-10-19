"""Diagnóstico temporal: estructura de un capítulo de la BCI en bible.com."""
import re, urllib.request
from bs4 import BeautifulSoup
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
for ref in ("EPH.2", "ISA.45", "PSA.23", "1TH.1"):
    u = f"https://www.bible.com/bible/335/{ref}.BCI"
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40) as r:
        h = r.read().decode("utf-8", "replace")
    print("==", ref, len(h))
    s = BeautifulSoup(h, "html.parser")
    seen = set()
    for el in s.select("[data-usfm]")[:14]:
        print(el.name, el.get("class"), el.get("data-usfm"), "|", el.get_text(" ", strip=True)[:35])
    for el in s.find_all(class_=re.compile(r"ChapterContent_(p|q1|q2|s1|s|m|d|r|label|heading|note)\b")):
        c = el.get("class")[0]
        if c not in seen:
            seen.add(c); print("class", c, el.name, "|", el.get_text(" ", strip=True)[:35])
