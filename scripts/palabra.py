"""Descarga las lecturas de la misa y las guarda en data/palabra/AAAA-MM-DD.json.

Castellano: Vatican News (Palabra del día).
Català: las mismas citas en la Bíblia Catalana Interconfessional (bible.com, ver bci.py);
el nombre del día y la reflexión de los Papas se traducen con Apertium.
Lo ejecuta cada día la acción de GitHub «contenido»; también se puede lanzar a mano:
    pip install beautifulsoup4 && python scripts/palabra.py
"""
import datetime as dt, json, pathlib, re, sys, urllib.request
from zoneinfo import ZoneInfo
from bs4 import BeautifulSoup
import bci

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
    readings, reflection = [], None
    for sec in s.select("section.section--isStatic"):
        h2 = sec.find("h2")
        head = clean(h2.get_text(" ")) if h2 else ""
        if re.match(r"Las palabras de los Papas", head, re.I):
            text = [t for p in sec.find_all("p") for t in paras(p)]
            if text:
                reflection = {"heading": head, "text": text}
            continue
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
    out = {"title": title, "url": url, "source": "Vatican News", "readings": readings}
    if reflection:
        out["reflection"] = reflection
    return out


def translate_ca(paras):
    """Traducción automática castellano -> catalán (Apertium; si falla, Google Translate)."""
    import urllib.parse
    def apertium(q):
        url = "https://www.apertium.org/apy/translate?" + urllib.parse.urlencode({"langpair": "spa|cat", "markUnknown": "no", "q": q})
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
            return json.loads(r.read())["responseData"]["translatedText"]
    def google(q):
        url = "https://translate.googleapis.com/translate_a/single?" + urllib.parse.urlencode({"client": "gtx", "sl": "es", "tl": "ca", "dt": "t", "q": q})
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
            return "".join(seg[0] for seg in json.loads(r.read())[0])
    for name, fn in (("Apertium", apertium), ("Google Translate", google)):
        try:
            out = [clean(fn(p)) for p in paras]
            if all(out):
                return out, name
        except Exception as e:
            print("traducción", name, "ERROR", e)
    raise ValueError("sin traducción")


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
    sv = None  # El salmo no se muestra en la web.
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


def catalan(day, es):
    """Las lecturas de Vatican News, con el mismo fragmento de la BCI."""
    if not es:
        raise ValueError("faltan las citas en castellano")
    readings = [bci.reading(r) for r in es["readings"]]
    title = ""
    if es.get("title"):  # el mismo nombre del día que en castellano, traducido
        try:
            title = translate_ca([es["title"]])[0][0]
        except Exception:
            pass
    out = {"title": title, "url": readings[-1].pop("url"), "source": "Bíblia Catalana Interconfessional",
           "readings": [{k: v for k, v in r.items() if k != "url"} for r in readings]}
    if es.get("reflection"):
        try:
            text, engine = translate_ca(es["reflection"]["text"])
            out["reflection"] = {"heading": "Les paraules dels Papes", "text": text, "translated": engine}
        except Exception as e:
            print(day, "reflexión ca ERROR", e)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    today = dt.datetime.now(ZoneInfo("Europe/Madrid")).date()
    ok = 0
    for d in range(-DAYS_BACK, DAYS_AHEAD + 1):
        day = today + dt.timedelta(days=d)
        path = OUT / f"{day:%Y-%m-%d}.json"
        old = json.loads(path.read_text()) if path.exists() else {}
        data = {"date": f"{day:%Y-%m-%d}"}
        for lang, fn in (("es", vatican), ("ca", lambda d: catalan(d, data.get("es")))):
            try:
                data[lang] = fn(day)
                ok += 1
                rf = data[lang].get("reflection")
                print(day, lang, "reflexión:", (len(rf["text"]), rf.get("translated"), rf["text"][0][:20]) if rf else None)
                print(day, lang, [f"{r['kind']} | {r['title'][:40]} | {r['ref']} | {len(r['text'])}p {r['text'][0][:12]}…{r['text'][-1][-12:]}" for r in data[lang]["readings"]])
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
