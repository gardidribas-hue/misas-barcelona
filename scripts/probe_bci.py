"""Diagnóstico temporal: dónde está la BCI en bible.com y cómo vienen los versículos."""
import re, sys, json, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40) as r:
            return r.geturl(), r.read().decode("utf-8", "replace")
    except Exception as e:
        return u, f"ERROR {e}"
u, h = get("https://www.bible.com/languages/cat")
print(u, len(h))
for m in sorted(set(re.findall(r'/versions/(\d+)-([A-Za-z0-9-]+)', h))): print("version", m)
for m in sorted(set(re.findall(r'"abbreviation":"([^"]+)","id":(\d+)', h)))[:40]: print("abbr", m)
for vid in sys.argv[1:]:
    u, h = get(f"https://www.bible.com/bible/{vid}/EPH.2.BCI")
    print("==", vid, u, len(h))
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', h, re.S)
    if m:
        d = json.loads(m.group(1))
        def walk(o, path=""):
            if isinstance(o, dict):
                for k, v in o.items(): walk(v, path + "." + k)
            elif isinstance(o, list):
                for i, v in enumerate(o[:3]): walk(v, f"{path}[{i}]")
            elif isinstance(o, str) and len(o) > 30:
                print(path, "|", o[:60].replace("\n", " "))
        walk(d.get("props", {}))
    print(re.findall(r'data-usfm="EPH\.2\.\d+"', h)[:5], h.count('class="ChapterContent_verse'))
