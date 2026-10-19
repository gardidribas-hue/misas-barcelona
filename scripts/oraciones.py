"""Descarga el texto de las oraciones del Rosario y genera data/oraciones.js.

Castellano: EWTN (Oraciones del Rosario).
Català y latín: Devocionari de l'Opus Dei (opusdei.cat), que trae las dos columnas.
Oración de Fátima en latín: EWTN (Prayers of the Rosary in English and Latin).
Letanías: castellano de la Santa Sede (vatican.va); català y latín del Devocionari.
En las letanías, las respuestas van como líneas que empiezan por «R/. ».
    pip install beautifulsoup4 pypdf && python scripts/oraciones.py
"""
import io, json, pathlib, re, urllib.request
from bs4 import BeautifulSoup
from pypdf import PdfReader

OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "oraciones.js"
UA = {"User-Agent": "Mozilla/5.0 (misas-barcelona; +https://gardidribas-hue.github.io/misas-barcelona/)"}
SRC = {
    "es": "https://www.ewtn.com/es/oracion/oraciones-del-rosario",
    "ca": "https://multimedia.opusdei.org/doc/pdf/Devocionari%20mobil%20-%20www.opusdei.cat20220314171720840413.pdf",
    "la": "https://www.ewtn.com/catholicism/teachings/prayers-of-the-rosary-in-english-and-latin-164",
    "litany_es": "https://www.vatican.va/special/rosary/documents/litanie-lauretane_sp.html",
}


def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read()


def clean(s):
    return re.sub(r"\s+", " ", s).strip()


def by_heading(html, wanted):
    """Párrafos que siguen a cada encabezado <strong> de una página de EWTN."""
    s = BeautifulSoup(html, "html.parser")
    out, cur = {}, None
    for el in s.find_all(["strong", "p"]):
        if el.name == "strong":
            h = clean(el.get_text(" "))
            cur = next((k for k, v in wanted.items() if h.lower() == v.lower()), None)
            if cur:
                out.setdefault(cur, [])
        elif cur and el.find("strong") is None:
            t = clean(el.get_text(" "))
            if t:
                out[cur].append(t)
    return out


def ewtn_es():
    html = fetch(SRC["es"])
    got = by_heading(html, {"cross": "La Señal de la Cruz", "credo": "El Credo", "pater": "El Padre Nuestro",
                            "ave": "Ave María", "gloria": "Gloria", "salve": "Salve"})
    salve = got.get("salve", [])
    # Tras la Salve, la página añade una nota y la oración de Fátima entre comillas.
    fat = [p for p in salve if p.startswith(("\"", "“"))]
    got["salve"] = [p for p in salve if not p.lower().startswith("luego de") and not p.startswith("—") and p not in fat]
    if fat:
        got["fatima"] = [re.sub(r"[\"“”]", "", fat[0]).strip()]
    got["cross"] = [p.replace("+ ", "") for p in got.get("cross", [])]
    return got


def ewtn_la_fatima():
    s = BeautifulSoup(fetch(SRC["la"]), "html.parser")
    latin = False
    for el in s.find_all(["u", "strong"]):
        if el.name == "u" and clean(el.get_text()) == "LATIN":
            latin = True
        if latin and el.name == "strong" and clean(el.get_text()) == "Oratio Fatima":
            p = el.find_next("p")
            return [clean(p.get_text(" "))]
    return []


def two_columns(text, start=None, stop_left=None, stop_right=None):
    """Separa las dos columnas (català | latín) del texto «layout» de una página del devocionario."""
    left, right = [[]], [[]]
    lines = text.splitlines()
    # Primeras líneas: títulos de la página; se saltan hasta la primera línea de texto.
    began, done_l, done_r = start is None, False, False
    body = False
    for ln in lines:
        if not ln.strip() or re.search(r"SECCIÓ\s+ÍNDEX", ln):
            continue
        m = re.match(r"^(\s*)(.*?)(?:\s{3,}(\S.*))?$", ln)
        ind, l, r = len(m.group(1)), m.group(2), m.group(3) or ""
        if ind >= 28:  # solo columna derecha (o línea centrada)
            l, r = "", ln.strip()
        if not began:
            if start in l:
                began = True
            else:
                continue
        if not body:
            # La línea de texto empieza con un espacio; los títulos van centrados (más sangría).
            if ind > 3 and l:
                continue
            body = True
        newp = l and ln.startswith(" ") and not ln.startswith("  ")
        if newp:
            if left[-1] and not done_l: left.append([])
            if right[-1] and not done_r: right.append([])
        if l and not done_l:
            left[-1].append(l.strip())
            if stop_left and stop_left in l: done_l = True
        if r and not done_r:
            right[-1].append(r.strip())
            if stop_right and stop_right in r: done_r = True
    join = lambda ps: [re.sub(r"-\s+(?=[a-zà-ú])", "-", " ".join(p)).replace("  ", " ") for p in ps if p]
    return join(left), join(right)


def devocionari():
    r = PdfReader(io.BytesIO(fetch(SRC["ca"])))
    page = lambda i: r.pages[i].extract_text(extraction_mode="layout")
    ca, la = {}, {}
    ca["cross"], la["cross"] = two_columns(page(46), start="V/. Pel senyal", stop_left="Amén", stop_right="Amen")
    for key, i in (("pater", 5), ("ave", 6), ("gloria", 7), ("salve", 8), ("credo", 13)):
        ca[key], la[key] = two_columns(page(i))
    for d in (ca, la):
        d["cross"] = [re.sub(r"^V/\.\s*", "", p) for p in d["cross"]]
    return ca, la


def vatican_litany():
    """Letanías de la Santa Sede: cada <p> es un bloque; las respuestas van en negrita."""
    s = BeautifulSoup(fetch(SRC["litany_es"]), "html.parser")
    blocks = []
    for p in s.find_all("p", align="left"):
        lines, cur = [], ""
        for node in p.children:
            if getattr(node, "name", None) == "br":
                lines.append(cur); cur = ""
            elif getattr(node, "name", None) == "b":
                cur += "R/. " + node.get_text(" ")
            else:
                cur += node.get_text(" ") if hasattr(node, "get_text") else str(node)
        lines.append(cur)
        lines = [re.sub(r"^R/\.\s*R/\.", "R/.", clean(l.replace("\xa0", " "))) for l in lines]
        lines = [re.sub(r"^\s*R/\.\s*", "R/. ", l) for l in lines if l]
        if lines:
            blocks.append(lines)
    out = {"kyrie": [], "litany": [], "oremus": []}
    for b in blocks:
        if re.match(r"ORACI", b[0], re.I):
            out["oremus"].append(" ".join(b[1:]))
        elif b[0].startswith("Ruega por nosotros"):
            out["oremus"].append("\n".join(b))
        elif not out["kyrie"]:
            out["kyrie"].append("\n".join(b))
        else:
            out["litany"].append("\n".join(b))
    return out


def devocionari_litany(r):
    """Lletanies del devocionari (pàgines 47-51), en dues columnes: català | latín."""
    rows, prayer, tail, state = [], [], [], "before"
    for i in range(47, 52):
        for ln in r.pages[i].extract_text(extraction_mode="layout").splitlines():
            if not ln.strip() or re.search(r"SECCIÓ\s+ÍNDEX", ln):
                continue
            if state == "before":
                if ln.strip() == "Lletanies":
                    state = "litany"
                continue
            if state == "litany" and ln.strip().startswith("Concediu"):
                state = "prayer"
            if state == "prayer":
                prayer.append(ln.strip())
                if ln.strip().endswith("Amén."):
                    state = "between"
                continue
            if state == "between":
                if "V/. Pregueu" in ln:
                    state = "tail"
                else:
                    continue
            m = re.match(r"^(\s*)(.*?)(?:\s{3,}(\S.*))?$", ln)
            ind, left, right = len(m.group(1)), m.group(2).strip(), (m.group(3) or "").strip()
            if ind >= 28:
                left, right = "", ln.strip()
            (tail if state == "tail" else rows).append((left, right))
    def lines(pairs, col):
        out = []
        for pr in pairs:
            t = re.sub(r"^V/\s*\.\s*", "", pr[col]).strip()
            t = re.sub(r"^R/\s*\.\s*", "R/. ", t)
            if not t:
                continue
            if out and t[0].islower():
                out[-1] += " " + t  # línea partida
            else:
                out.append(t)
        return out
    res = {}
    for lang, col in (("ca", 0), ("la", 1)):
        ls = lines(rows, col)
        # Señor, ten piedad: hasta la última respuesta antes de «Déu Pare» / «Pater de cælis».
        k = next(i for i, l in enumerate(ls) if re.match(r"(Déu Pare|Pater de)", l))
        blocks, cur = [], []
        for l in ls[k:]:
            if not l.startswith("R/.") and cur and cur[-1].startswith("R/.") and not re.match(r"(Santa|Sancta) (Mare|Dei)", l):
                blocks.append(cur); cur = []
            cur.append(l)
        blocks.append(cur)
        ore = ["\n".join(lines(tail, col))]
        if lang == "ca":
            ore.append(" ".join(prayer))
        res[lang] = {"kyrie": ["\n".join(ls[:k])], "litany": ["\n".join(b) for b in blocks], "oremus": ore}
    return res


def main():
    data = {"es": ewtn_es()}
    data["ca"], data["la"] = devocionari()
    data["es"].update(vatican_litany())
    lit = devocionari_litany(PdfReader(io.BytesIO(fetch(SRC["ca"]))))
    data["ca"].update(lit["ca"]); data["la"].update(lit["la"])
    fat = ewtn_la_fatima()
    if fat:
        data["la"]["fatima"] = fat
    for lang, d in data.items():
        print(lang, {k: [len(p) for p in v] for k, v in d.items()})
        for k, v in d.items():
            print("  ", k, "|", v[0][:28] if v else "", "...", v[-1][-22:] if v else "")
    data["sources"] = {
        "es": {"name": "EWTN · Santa Sede (letanías)", "url": SRC["es"]},
        "ca": {"name": "Devocionari (opusdei.cat)", "url": SRC["ca"]},
        "la": {"name": "Devocionari (opusdei.cat) · EWTN", "url": SRC["ca"]},
    }
    OUT.write_text("/* Generado por scripts/oraciones.py: no editar a mano. */\nwindow.MisasOraciones = "
                   + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")


if __name__ == "__main__":
    main()
