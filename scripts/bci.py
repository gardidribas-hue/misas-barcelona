"""Lecturas en catalán de la Bíblia Catalana Interconfessional (BCI) en bible.com.

Recibe las citas de Vatican News («Efesios 2, 1-10», «Isaías 45, 1. 4-6», «Efesios 4, 32–5, 8»)
y devuelve el mismo fragmento en la BCI, con el título de la lectura en catalán.
"""
import re, unicodedata, urllib.request
from bs4 import BeautifulSoup
import catala

VERSION = 335  # BCI en bible.com
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}

# Nombre del libro en castellano (sin acentos) -> (código USFM, nombre en catalán, título de la lectura)
BOOKS = {
    "genesis": ("GEN", "Gènesi", "del llibre del Gènesi"),
    "exodo": ("EXO", "Èxode", "del llibre de l'Èxode"),
    "levitico": ("LEV", "Levític", "del llibre del Levític"),
    "numeros": ("NUM", "Nombres", "del llibre dels Nombres"),
    "deuteronomio": ("DEU", "Deuteronomi", "del llibre del Deuteronomi"),
    "josue": ("JOS", "Josuè", "del llibre de Josuè"),
    "jueces": ("JDG", "Jutges", "del llibre dels Jutges"),
    "rut": ("RUT", "Rut", "del llibre de Rut"),
    "1 samuel": ("1SA", "1 Samuel", "del primer llibre de Samuel"),
    "2 samuel": ("2SA", "2 Samuel", "del segon llibre de Samuel"),
    "1 reyes": ("1KI", "1 Reis", "del primer llibre dels Reis"),
    "2 reyes": ("2KI", "2 Reis", "del segon llibre dels Reis"),
    "1 cronicas": ("1CH", "1 Cròniques", "del primer llibre de les Cròniques"),
    "2 cronicas": ("2CH", "2 Cròniques", "del segon llibre de les Cròniques"),
    "esdras": ("EZR", "Esdres", "del llibre d'Esdres"),
    "nehemias": ("NEH", "Nehemies", "del llibre de Nehemies"),
    "tobias": ("TOB", "Tobit", "del llibre de Tobit"),
    "judit": ("JDT", "Judit", "del llibre de Judit"),
    "ester": ("EST", "Ester", "del llibre d'Ester"),
    "1 macabeos": ("1MA", "1 Macabeus", "del primer llibre dels Macabeus"),
    "2 macabeos": ("2MA", "2 Macabeus", "del segon llibre dels Macabeus"),
    "job": ("JOB", "Job", "del llibre de Job"),
    "salmo": ("PSA", "Salm", "del llibre dels Salms"),
    "salmos": ("PSA", "Salm", "del llibre dels Salms"),
    "proverbios": ("PRO", "Proverbis", "del llibre dels Proverbis"),
    "eclesiastes": ("ECC", "Cohèlet", "del llibre del Cohèlet"),
    "cantar de los cantares": ("SNG", "Càntic", "del Càntic dels Càntics"),
    "sabiduria": ("WIS", "Saviesa", "del llibre de la Saviesa"),
    "eclesiastico": ("SIR", "Siràcida", "del llibre del Siràcida"),
    "sirac": ("SIR", "Siràcida", "del llibre del Siràcida"),
    "isaias": ("ISA", "Isaïes", "del llibre d'Isaïes"),
    "jeremias": ("JER", "Jeremies", "del llibre de Jeremies"),
    "lamentaciones": ("LAM", "Lamentacions", "del llibre de les Lamentacions"),
    "baruc": ("BAR", "Baruc", "del llibre de Baruc"),
    "ezequiel": ("EZK", "Ezequiel", "del llibre d'Ezequiel"),
    "daniel": ("DAN", "Daniel", "del llibre de Daniel"),
    "oseas": ("HOS", "Osees", "del llibre d'Osees"),
    "joel": ("JOL", "Joel", "del llibre de Joel"),
    "amos": ("AMO", "Amós", "del llibre d'Amós"),
    "abdias": ("OBA", "Abdies", "del llibre d'Abdies"),
    "jonas": ("JON", "Jonàs", "del llibre de Jonàs"),
    "miqueas": ("MIC", "Miquees", "del llibre de Miquees"),
    "nahum": ("NAM", "Nahum", "del llibre de Nahum"),
    "habacuc": ("HAB", "Habacuc", "del llibre d'Habacuc"),
    "sofonias": ("ZEP", "Sofonies", "del llibre de Sofonies"),
    "ageo": ("HAG", "Ageu", "del llibre d'Ageu"),
    "zacarias": ("ZEC", "Zacaries", "del llibre de Zacaries"),
    "malaquias": ("MAL", "Malaquies", "del llibre de Malaquies"),
    "mateo": ("MAT", "Mateu", "de l'evangeli segons sant Mateu"),
    "marcos": ("MRK", "Marc", "de l'evangeli segons sant Marc"),
    "lucas": ("LUK", "Lluc", "de l'evangeli segons sant Lluc"),
    "juan": ("JHN", "Joan", "de l'evangeli segons sant Joan"),
    "hechos": ("ACT", "Fets", "del llibre dels Fets dels Apòstols"),
    "hechos de los apostoles": ("ACT", "Fets", "del llibre dels Fets dels Apòstols"),
    "romanos": ("ROM", "Romans", "de la carta de sant Pau als cristians de Roma"),
    "1 corintios": ("1CO", "1 Corintis", "de la primera carta de sant Pau als cristians de Corint"),
    "2 corintios": ("2CO", "2 Corintis", "de la segona carta de sant Pau als cristians de Corint"),
    "galatas": ("GAL", "Gàlates", "de la carta de sant Pau als cristians de Galàcia"),
    "efesios": ("EPH", "Efesis", "de la carta de sant Pau als cristians d'Efes"),
    "filipenses": ("PHP", "Filipencs", "de la carta de sant Pau als cristians de Filips"),
    "colosenses": ("COL", "Colossencs", "de la carta de sant Pau als cristians de Colosses"),
    "1 tesalonicenses": ("1TH", "1 Tessalonicencs", "de la primera carta de sant Pau als cristians de Tessalònica"),
    "2 tesalonicenses": ("2TH", "2 Tessalonicencs", "de la segona carta de sant Pau als cristians de Tessalònica"),
    "1 timoteo": ("1TI", "1 Timoteu", "de la primera carta de sant Pau a Timoteu"),
    "2 timoteo": ("2TI", "2 Timoteu", "de la segona carta de sant Pau a Timoteu"),
    "tito": ("TIT", "Titus", "de la carta de sant Pau a Titus"),
    "filemon": ("PHM", "Filèmon", "de la carta de sant Pau a Filèmon"),
    "hebreos": ("HEB", "Hebreus", "de la carta als Hebreus"),
    "santiago": ("JAS", "Jaume", "de la carta de sant Jaume"),
    "1 pedro": ("1PE", "1 Pere", "de la primera carta de sant Pere"),
    "2 pedro": ("2PE", "2 Pere", "de la segona carta de sant Pere"),
    "1 juan": ("1JN", "1 Joan", "de la primera carta de sant Joan"),
    "2 juan": ("2JN", "2 Joan", "de la segona carta de sant Joan"),
    "3 juan": ("3JN", "3 Joan", "de la tercera carta de sant Joan"),
    "judas": ("JUD", "Judes", "de la carta de sant Judes"),
    "apocalipsis": ("REV", "Apocalipsi", "del llibre de l'Apocalipsi"),
}
KINDS = {"primera lectura": "Primera lectura", "segunda lectura": "Segona lectura", "tercera lectura": "Tercera lectura", "evangelio": "Evangeli"}


def norm(s):
    s = s.replace("ί", "i").replace("ά", "a").replace("έ", "e").replace("ό", "o")  # Vatican News a veces usa letras griegas
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", s).strip().lower()


def parse_ref(ref):
    """«Efesios 4, 32–5, 8» -> ('efesios', '4, 32–5, 8', [(4, 32, 4, 999), (5, 1, 5, 8)])."""
    m = re.match(r"^\s*((?:[1-3]\s*)?[^\d,]+?)\s+(\d+)\s*,\s*(.+)$", ref)
    if not m:
        raise ValueError(f"cita no reconocida: {ref}")
    book, chap, rest = norm(m.group(1)), int(m.group(2)), m.group(3)
    nums = f"{chap}, {rest}"
    ranges = []
    for part in re.split(r";", rest):
        part = part.strip()
        cm = re.match(r"^(\d+)\s*,\s*(.+)$", part) if ranges else None
        if cm:  # «…; 10, 2-4»: nuevo capítulo
            chap, part = int(cm.group(1)), cm.group(2)
        for seg in re.split(r"\.\s*", part):
            seg = re.sub(r"(?<=\d)[a-z]+", "", seg.strip())  # 5b -> 5
            if not seg:
                continue
            x = re.match(r"^(\d+)\s*[-–—]\s*(\d+)\s*,\s*(\d+)$", seg)  # 32–5, 8
            if x:
                ranges.append((chap, int(x.group(1)), chap, 999))
                chap = int(x.group(2))
                ranges.append((chap, 1, chap, int(x.group(3))))
                continue
            x = re.match(r"^(\d+)(?:\s*[-–—]\s*(\d+))?$", seg)
            if not x:
                raise ValueError(f"cita no reconocida: {ref}")
            a = int(x.group(1)); b = int(x.group(2) or a)
            ranges.append((chap, a, chap, b))
    return book, nums, ranges


_cache = {}


def chapter(usfm, chap):
    key = (usfm, chap)
    if key not in _cache:
        url = f"https://www.bible.com/bible/{VERSION}/{usfm}.{chap}.BCI"
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
            _cache[key] = (url, BeautifulSoup(r.read().decode("utf-8", "replace"), "html.parser"))
    return _cache[key]


def has_cls(el, suffix):
    return any(re.search(rf"_{suffix}$", c) for c in (el.get("class") or []))


def passage(usfm, ranges):
    """Párrafos del fragmento. La poesía (líneas q) se une con saltos de línea."""
    paras, url0 = [], None
    for chap, a, _, b in ranges:
        url, s = chapter(usfm, chap)
        url0 = url0 or url
        want = {f"{usfm}.{chap}.{v}" for v in range(a, min(b, 200) + 1)}
        root = s.find(attrs={"data-usfm": f"{usfm}.{chap}"}) or s
        poetry = False
        for block in root.find_all("div", recursive=True):
            cls = " ".join(block.get("class") or [])
            if not re.search(r"_(p|m|pi\d?|pmo|q\d?|qm\d?|li\d?|mi|nb|pc)\b", cls):
                continue
            parts = []
            for v in block.find_all("span", attrs={"data-usfm": True}):
                if v.get("data-usfm") not in want:
                    continue
                for junk in v.find_all(lambda t: has_cls(t, "note") or has_cls(t, "label")):
                    junk.decompose()
                t = re.sub(r"\s+", " ", catala.fix_bci(v.get_text(""))).strip()
                if t:
                    parts.append(t)
            if not parts:
                continue
            text = " ".join(parts)
            is_q = bool(re.search(r"_q\w*\b", cls))
            if is_q and poetry and paras:
                paras[-1] += "\n" + text
            else:
                paras.append(text)
            poetry = is_q
    if not paras:
        raise ValueError(f"sin texto para {usfm} {ranges}")
    return paras, url0


def reading(es):
    """Lectura de Vatican News -> la misma en la BCI, con título y cita en catalán."""
    book, nums, ranges = parse_ref(es["ref"])
    if book not in BOOKS:
        raise ValueError(f"libro desconocido: {book}")
    usfm, name, title = BOOKS[book]
    text, url = passage(usfm, ranges)
    return {"kind": KINDS.get(norm(es["kind"]), es["kind"]), "title": "Lectura " + title,
            "ref": f"{name} {nums}", "text": text, "url": url}
