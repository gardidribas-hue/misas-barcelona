"""Descarga las lecturas de la misa y las guarda en data/palabra/AAAA-MM-DD.json.

Castellano: Vatican News (Palabra del día y santos del día).
Català: las mismas citas en la Bíblia Catalana Interconfessional (bible.com, ver bci.py).
Lo único que se traduce es el nombre del día y la reflexión de los Papas: Google Translate (si falla,
Apertium) y después se pasan los nombres propios a su forma catalana y se quitan las marcas y
entidades HTML sueltas (ver catala.py).
Lo ejecuta cada día la acción de GitHub «contenido»; también se puede lanzar a mano:
    pip install beautifulsoup4 && python scripts/palabra.py
"""
import datetime as dt, json, pathlib, re, sys, time, urllib.request
from zoneinfo import ZoneInfo
from bs4 import BeautifulSoup
import bci, catala

OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "palabra"
UA = {"User-Agent": "Mozilla/5.0 (misas-barcelona; +https://gardidribas-hue.github.io/misas-barcelona/)"}
DAYS_BACK, DAYS_AHEAD, KEEP_DAYS = 3, 7, 30


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
        return BeautifulSoup(r.read().decode("utf-8", "replace"), "html.parser")


def clean(s):
    return re.sub(r"[ \t ]+", " ", catala.unescape(s)).strip()


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


def short(text, limit=300):
    """Las dos primeras frases, sin pasar de unos 300 caracteres."""
    parts = re.split(r"(?<=[.!?»])\s+", clean(text))
    out = ""
    for p in parts:
        if out and len(out) + len(p) > limit:
            break
        out = (out + " " + p).strip()
        if len(out) > 120:
            break
    return out if len(out) <= limit + 80 else out[:limit].rsplit(" ", 1)[0] + "…"


def santo(day):
    """Santo del día de Vatican News: el primer <h2> de la página es el santo principal y el primer
    párrafo largo que le sigue, su reseña. Si la página cambia, se queda sin tarjeta."""
    url = f"https://www.vaticannews.va/es/santos/{day:%m/%d}.html"
    s = get(url)
    # Vatican News escribe los santos como «s. Carlos Borromeo», «ss. Vitale y Agrícola», «b. …»;
    # así se salta el «Menu» y los demás <h2> de la cabecera.
    pref = re.compile(r"^(ss?|bb?|sta|beat[ao]s?)\.\s+\S", re.I)
    h2s = [h for h in s.find_all("h2") if not h.find_parent(["nav", "header", "footer"])]
    h2 = next((h for h in h2s if pref.match(clean(h.get_text(" ")))), None)
    if h2 is None:
        raise ValueError("sin santo")
    name = clean(h2.get_text(" "))
    name = re.sub(r"^(ss?|bb?|sta|beat[ao]s?)\.\s*", "", name)  # «s. Carlos Borromeo» -> «Carlos Borromeo»
    name = name[:1].upper() + name[1:]
    text = ""
    for el in h2.find_all_next(["p", "h2"]):
        if el.name == "h2":
            break
        t = clean(el.get_text(" "))
        if len(t) > 60 and "©" not in t and not re.match(r"(?i)leer todo", t):
            text = t
            break
    return {"name": name, "text": short(text), "url": url}


def translate_ca(paras):
    """Traducción automática castellano -> catalán: Google Translate (más natural y traduce los nombres);
    si falla, Apertium. Después se arreglan nombres propios, comillas y marcas sueltas (catala.py)."""
    import urllib.parse
    def apertium(q):
        url = "https://www.apertium.org/apy/translate?" + urllib.parse.urlencode({"langpair": "spa|cat", "markUnknown": "no", "q": q})
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
            return json.loads(r.read())["responseData"]["translatedText"]
    def google(q):
        data = urllib.parse.urlencode({"client": "gtx", "sl": "es", "tl": "ca", "dt": "t", "q": q}).encode()
        req = urllib.request.Request("https://translate.googleapis.com/translate_a/single", data=data, headers=UA)
        with urllib.request.urlopen(req, timeout=40) as r:
            return "".join(seg[0] for seg in json.loads(r.read())[0])
    def all_at_once(fn):  # una sola petición por texto: Google corta si se le piden muchas seguidas
        src = [catala.prepare(p) for p in paras]
        out = [t for t in re.split(r"\n\s*\n", fn("\n\n".join(src))) if t.strip()]
        return out if len(out) == len(src) else [fn(p) for p in src]
    for name, fn in (("Google Translate", google), ("Apertium", apertium)):
        for wait in (0, 10, 30):
            time.sleep(wait)
            try:
                out = [catala.fix(t) for t in all_at_once(fn)]
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
    # Vatican News rellena los días aún sin preparar con la reflexión de un día anterior:
    # si una reflexión ya ha salido otro día antes, no se muestra (mejor sin caja que con la de otro día).
    key = lambda r: " ".join(r["text"]) if r else None
    first = today - dt.timedelta(days=DAYS_BACK)
    seen = set()
    for f in OUT.glob("*.json"):
        try:
            if dt.date.fromisoformat(f.stem) < first:
                seen.add(key(json.loads(f.read_text()).get("es", {}).get("reflection")))
        except (ValueError, json.JSONDecodeError):
            pass
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
        # Santos del día (Vatican News); en catalán, traducidos como la reflexión de los Papas.
        try:
            sa = santo(day)
            print(day, "santo:", sa["name"], "|", sa["text"][:60])
            if "es" in data:
                data["es"]["saint"] = sa
            if "ca" in data:
                try:
                    (n, tx), engine = translate_ca([sa["name"], sa["text"] or sa["name"]])
                    data["ca"]["saint"] = {"name": n, "text": tx if sa["text"] else "", "url": sa["url"], "translated": engine}
                except Exception as e:
                    print(day, "santo ca ERROR", e)
        except Exception as e:
            print(day, "santo ERROR", e)
            for lang in ("es", "ca"):
                if lang in data and (old.get(lang) or {}).get("saint"):
                    data[lang]["saint"] = old[lang]["saint"]
        for lang in ("es", "ca"):  # restos de la primera versión, que leía la cabecera de la página
            sn = ((data.get(lang) or {}).get("saint") or {}).get("name", "")
            if re.match(r"(?i)menu$|el sant[o]? del d[ií]a", sn):
                data[lang].pop("saint")
        rk = key(data.get("es", {}).get("reflection"))
        if rk and rk in seen:
            print(day, "reflexión repetida de otro día: se quita")
            for lang in ("es", "ca"):
                data.get(lang, {}).pop("reflection", None)
        elif rk:
            seen.add(rk)
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
