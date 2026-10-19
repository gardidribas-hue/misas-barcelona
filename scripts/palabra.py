"""Descarga las lecturas de la misa y las guarda en data/palabra/AAAA-MM-DD.json.

Castellano: Vatican News (Palabra del día). Català: evangeli.net.
Lo ejecuta cada día la acción de GitHub «contenido»; también se puede lanzar a mano:
    pip install beautifulsoup4 && python scripts/palabra.py
"""
import datetime as dt, json, pathlib, re, sys, urllib.request
from zoneinfo import ZoneInfo
from bs4 import BeautifulSoup

OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "palabra"
UA = {"User-Agent": "Mozilla/5.0 (misas-barcelona; +https://gardidribas-hue.github.io/misas-barcelona/)"}
DAYS_BACK, DAYS_AHEAD, KEEP_DAYS = 3, 7, 30


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
        return BeautifulSoup(r.read().decode("utf-8", "replace"), "html.parser")


def clean(s):
    return re.sub(r"[ \t ]+", " ", s).strip()


def paras(el):
    """Texto de un elemento partido en párrafos (respeta <br> y <p>)."""
    for br in el.find_all("br"):
        br.replace_with("\n")
    out = []
    for part in re.split(r"\n+", el.get_text("")):
        part = clean(part)
        if part:
            out.append(part)
    return out


def vatican(day):
    url = f"https://www.vaticannews.va/es/evangelio-de-hoy/{day:%Y/%m/%d}.html"
    s = get(url)
    title = ""
    sel = s.find(id="dataFilter-text")
    if sel:
        nxt = sel.find_next("span")
        title = clean(nxt.get_text(" ")) if nxt else ""
    readings = []
    for sec in s.select("section.section--isStatic"):
        h2 = sec.find("h2")
        head = clean(h2.get_text(" ")) if h2 else ""
        if not re.match(r"(Lectura|Evangelio|Salmo)", head, re.I):
            continue
        default = "Evangelio" if head.lower().startswith("evangelio") else "Primera lectura"
        cur = None
        for p in sec.find_all("p"):
            txt = clean(p.get_text(""))
            if not txt:
                continue
            if re.fullmatch(r"(Primera|Segunda|Tercera) lectura|Salmo( responsorial)?|Evangelio", txt, re.I):
                cur = {"kind": txt[0].upper() + txt[1:], "title": "", "ref": "", "text": []}
                readings.append(cur)
                continue
            if cur is None:
                cur = {"kind": default, "title": "", "ref": "", "text": []}
                readings.append(cur)
            if not cur["title"]:
                cur["title"] = txt
            elif not cur["ref"]:
                cur["ref"] = txt
            else:
                cur["text"].extend(paras(p))
    readings = [r for r in readings if r["text"]]
    for r in readings:  # la letra capital va aparte en la página
        r["title"] = re.sub(r"^ectura\b", "Lectura", r["title"])
    if not readings:
        raise ValueError("sin lecturas")
    return {"title": title, "url": url, "source": "Vatican News", "readings": readings}


def evangeli(day):
    url = f"https://evangeli.net/evangeli/dia/{day:%Y-%m-%d}"
    s = get(url)
    lit = s.select_one(".dia_liturgic")
    readings = []

    def head_of(el):
        st = el.find("strong")
        h = clean(st.get_text(" ")) if st else ""
        if st:
            st.extract()
        return re.sub(r"\(\s+", "(", h).rstrip(":").strip()

    def split_ref(h):
        m = re.match(r"(.*?)\s*\((.*)\)\s*$", h)
        return (m.group(1), m.group(2)) if m else (h, "")

    for el in s.find_all("div", class_=re.compile(r"(^|_)reading$")):
        kind, ref = split_ref(head_of(el))
        readings.append({"kind": kind, "title": "", "ref": ref, "text": paras(el)})
    sv = s.select_one(".salm_verscicle")
    if sv:
        kind = head_of(sv)
        ref = clean(sv.get_text(" "))
        text = []
        resp = s.select_one(".salm_response")
        if resp:
            text.append(clean(resp.get_text(" ")))
        st = s.select_one(".salm_text")
        if st:
            text.extend(paras(st))
        readings.append({"kind": kind, "title": "", "ref": ("Sl " + ref) if ref and ref[0].isdigit() else ref, "text": text})
    gs = s.find(id="gospel_norm")
    if gs:
        st = gs.find_previous("strong")
        kind, ref = split_ref(re.sub(r"\(\s+", "(", clean(st.get_text(" ")).rstrip(":"))) if st else ("Evangeli", "")
        readings.append({"kind": kind, "title": "", "ref": ref, "text": paras(gs)})
    # Orden de la misa: lecturas, salmo, (segunda lectura), evangelio.
    order = lambda r: 0 if r["kind"].startswith("1") else 1 if r["kind"].lower().startswith("salm") else 2 if r["kind"].startswith("2") else 3
    readings = [r for r in sorted(readings, key=order) if r["text"]]
    names = {"1": "Primera lectura", "2": "Segona lectura", "t": "Evangeli"}
    for r in readings:
        r["kind"] = names.get(r["kind"][:1].lower(), r["kind"])
    if not readings:
        raise ValueError("sense lectures")
    return {"title": clean(lit.get_text(" ")) if lit else "", "url": url, "source": "evangeli.net",
            "copyright": "© Albada Editorial / evangeli.net", "readings": readings}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    today = dt.datetime.now(ZoneInfo("Europe/Madrid")).date()
    ok = 0
    for d in range(-DAYS_BACK, DAYS_AHEAD + 1):
        day = today + dt.timedelta(days=d)
        path = OUT / f"{day:%Y-%m-%d}.json"
        old = json.loads(path.read_text()) if path.exists() else {}
        data = {"date": f"{day:%Y-%m-%d}"}
        for lang, fn in (("es", vatican), ("ca", evangeli)):
            try:
                data[lang] = fn(day)
                ok += 1
                print(day, lang, [f"{r['kind']} | {r['ref']} | {len(r['text'])}p" for r in data[lang]["readings"]])
            except Exception as e:
                print(day, lang, "ERROR", e)
                if lang in old:
                    data[lang] = old[lang]
        if "es" in data or "ca" in data:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=1))
    for f in OUT.glob("*.json"):
        try:
            if (today - dt.date.fromisoformat(f.stem)).days > KEEP_DAYS:
                f.unlink()
        except ValueError:
            pass
    if not ok:
        sys.exit("No se ha podido descargar ninguna lectura")


if __name__ == "__main__":
    main()
