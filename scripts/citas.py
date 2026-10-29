"""Citas bíblicas de la pestaña Voluntariado: Biblia de Jerusalén (es) y BCI (ca).

Escribe data/citas.js (window.CITAS). Se ejecuta en GitHub Actions, como palabra.py.
"""
import json, re, sys, urllib.request
from bs4 import BeautifulSoup
import bci

UA = bci.UA
# (cita en castellano, ruta en bibliacatolica.com.br, versos)
CITAS = [
    ("Gálatas 6, 10", "galatas/6", [10]),
    ("Marcos 10, 45", "marcos/10", [45]),
    ("Santiago 2, 15-17", "santiago/2", [15, 16, 17]),
    ("Mateo 25, 40", "mateo/25", [40]),
    ("2 Corintios 9, 7", "ii-corintios/9", [7]),
    ("1 Pedro 4, 10", "i-pedro/4", [10]),
]
BJ = "https://www.bibliacatolica.com.br/la-biblia-de-jerusalen/{}/"


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
        return r.read().decode("utf-8", "replace")


def jerusalen(path, verses):
    """Versos de la Biblia de Jerusalén: <section class="entry"><p><strong>10.</strong> texto</p>…"""
    url = BJ.format(path)
    s = BeautifulSoup(get(url), "html.parser")
    found = {}
    for p in s.select("article.bibleChapter section.entry p"):
        n = p.find("strong")
        m = n and re.match(r"^(\d+)\.?$", n.get_text(strip=True))
        if m:
            n.decompose()
            found[int(m.group(1))] = re.sub(r"\s+", " ", p.get_text(" ")).strip()
    missing = [v for v in verses if not found.get(v)]
    if missing:
        raise ValueError(f"no encuentro los versos {missing} en {url}")
    return [" ".join(found[v] for v in verses)], url


def limpia(paras):
    """Une los párrafos y deja la tipografía lista para ir entre «»: sin comillas de continuación (»)
    ni de cierre sueltas, diálogos (– …) y comillas rectas como “…”, y «…» delante si el verso empieza a media frase."""
    out = []
    for i, p in enumerate(paras):
        p = re.sub(r"^[»\s]+", "", p).strip()
        if re.match(r"^[–—]\s*", p):
            p = re.sub(r"^[–—]\s*", "", p)
            p = f"“{p}”" if i else p
        out.append(p)
    t = " ".join(out)
    t = re.sub(r'"([^"]+)"', r"“\1”", t)
    if t.count("»") > t.count("«"):
        t = t.rstrip("» ").strip()
    return ["…" + t if t[:1].islower() else t]  # verso que empieza a media frase


def main():
    res = []
    for ref, path, verses in CITAS:
        item = {"es": {"ref": ref}}
        try:
            text, item["es"]["url"] = jerusalen(path, verses)
            item["es"]["text"] = limpia(text)
            item["es"]["src"] = "Biblia de Jerusalén"
        except Exception as e:
            print("ES fallo", ref, e)
        try:
            ca = bci.reading({"ref": ref, "kind": ""})
            item["ca"] = {"ref": ca["ref"], "text": limpia(ca["text"]), "url": ca["url"], "src": "Bíblia Catalana Interconfessional"}
        except Exception as e:
            print("CA fallo", ref, e)
        print(json.dumps(item, ensure_ascii=False))
        res.append(item)
    if any("text" not in c["es"] or "ca" not in c for c in res):
        sys.exit("Falta alguna cita; no escribo data/citas.js")
    with open("data/citas.js", "w", encoding="utf-8") as f:
        f.write("// Generado por scripts/citas.py\nwindow.CITAS = " + json.dumps(res, ensure_ascii=False, indent=1) + ";\n")


if __name__ == "__main__":
    main()
