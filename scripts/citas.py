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
    url = BJ.format(path)
    s = BeautifulSoup(get(url), "html.parser")
    if "--debug" in sys.argv and path == "i-pedro/4":
        html = str(s)
        i = html.find("administradores")
        print("DEBUG", url, "pos", i)
        print("DEBUG trozo:", html[max(0, i - 2500):i + 600])
    out = []
    for v in verses:
        el = s.find(attrs={"data-v": str(v)}) or s.find(id=f"{v}") or s.find(id=f"v{v}")
        if el is None:
            raise ValueError(f"no encuentro el verso {v} en {url}")
        out.append(re.sub(r"\s+", " ", el.get_text(" ")).strip())
    return out, url


def main():
    res = []
    for ref, path, verses in CITAS:
        item = {"es": {"ref": ref}}
        try:
            item["es"]["text"], item["es"]["url"] = jerusalen(path, verses)
        except Exception as e:
            print("ES fallo", ref, e)
        try:
            ca = bci.reading({"ref": ref, "kind": ""})
            item["ca"] = {"ref": ca["ref"], "text": ca["text"], "url": ca["url"]}
        except Exception as e:
            print("CA fallo", ref, e)
        print(json.dumps(item, ensure_ascii=False))
        res.append(item)
    if "--debug" not in sys.argv:
        with open("data/citas.js", "w", encoding="utf-8") as f:
            f.write("// Generado por scripts/citas.py\nwindow.CITAS = " + json.dumps(res, ensure_ascii=False, indent=1) + ";\n")


if __name__ == "__main__":
    main()
