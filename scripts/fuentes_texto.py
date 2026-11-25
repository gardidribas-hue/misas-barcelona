"""Texto completo de las fuentes de cada templo, para las lecturas D y E del repaso semanal.

Cada lunes, después de la lectura automática (C), guarda el texto de la web de cada templo (columna B del Excel),
de hasta 3 enlaces suyos que parezcan de horarios y de su ficha del Arzobispado en <carpeta>/<ID>.txt.
Calcula la «huella» de cada texto (solo las líneas con días u horas) y la guarda en data/horarios/huellas.json:
si la huella cambia, las lecturas D y E de ese templo dejan de valer hasta que se vuelvan a hacer.
Respeta robots.txt. No toca los horarios de la web.
    python scripts/fuentes_texto.py [carpeta]          (por defecto, fuentes/)
    python scripts/fuentes_texto.py --huellas carpeta   solo recalcula las huellas de una carpeta ya descargada
"""
import hashlib, json, pathlib, re, sys, concurrent.futures as cf
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import horarios as h
from horarios_excel import leer, web_por_defecto

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEST = ROOT / "fuentes"
HUELLAS = ROOT / "data" / "horarios" / "huellas.json"
VERIFICACION = ROOT / "data" / "horarios" / "verificacion.json"
import threading, urllib.parse
_locks, _glock, _orig = {}, threading.Lock(), h.descargar


def _descargar(url, *a, **k):  # una petición a la vez por servidor, con la pausa de horarios.py
    host = urllib.parse.urlsplit(url).netloc
    with _glock:
        lk = _locks.setdefault(host, threading.Lock())
    with lk:
        return _orig(url, *a, **k)


h.descargar = _descargar
RX = re.compile(r"horari|horario|misses|misas|missa|misa|celebraci|eucarist|culte|culto", re.I)


def texto(url):
    if not url.startswith("http"):
        return None, "sin URL"
    if not h.robots_permite(url):
        return None, "robots.txt no permite leerla"
    for intento in range(2):
        try:
            datos, ctype, final = h.descargar(url, timeout=40)
            t, fmt = h.a_texto(datos, ctype, final)
            html = datos.decode("utf-8", "replace") if fmt == "html" else ""
            return (final, fmt, t, html), "ok"
        except Exception as e:  # noqa: BLE001
            err = f"error: {e}"
    return None, err


def templo(lug, rev):
    tid = lug["id"]
    web = (rev.get(tid) or {}).get("web") or web_por_defecto(lug)
    f3 = ((lug.get("fuentes") or {}).get("F3") or {}).get("url") or ""
    out = [f"### {tid} · {lug['nombre']} · {lug.get('direccion') or ''} · {lug['municipio']}", f"### web: {web or '-'}", f"### f3: {f3 or '-'}"]
    if web:
        r, est = texto(web)
        if r:
            final, fmt, t, html = r
            out += [f"=== WEB {final} ({fmt})", t[:20000]]
            vistos = {final, web}
            if html:
                for txt, href in h.enlaces(html, final):
                    if len(vistos) >= 5:
                        break
                    if href in vistos or not href.startswith("http") or re.search(r"facebook|instagram|twitter|youtube|google|wa\.me|mailto", href):
                        continue
                    if RX.search(txt) or RX.search(href.rsplit("/", 1)[-1]):
                        vistos.add(href)
                        r2, est2 = texto(href)
                        out += [f"=== ENLACE «{txt[:60]}» {href} ({r2[1] if r2 else est2})", (r2[2][:15000] if r2 else "")]
        else:
            out.append(f"=== WEB {web}: {est}")
    if f3:
        r, est = texto(f3)
        if r:
            t = r[2]
            i = t.find("Dirección")
            out += [f"=== ARZOBISPADO {f3}", t[max(0, i):][:6000] if i >= 0 else t[:6000]]
        else:
            out.append(f"=== ARZOBISPADO {f3}: {est}")
    (DEST / f"{tid}.txt").write_text("\n".join(out) + "\n", "utf-8")
    return tid


# Líneas que cuentan para la huella: las que tienen una hora o un día. Se quitan las que cambian solas
# (noticias, «hace 3 días», fechas de la agenda), para que la huella no cambie si el horario no ha cambiado.
HORA = re.compile(r"\d{1,2}[:.,h']\d{2}|\d{1,2}\s*h\b|\ba les \d|\ba las \d", re.I)
DIA = re.compile(r"\b(dilluns|dimarts|dimecres|dijous|divendres|dissabtes?|diumenges?|feiners?|festius?|v[ií]gili|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?|laborables?|festivos?|v[ií]speras?)\b", re.I)
RUIDO = re.compile(r"\b(ago|hace \d|fa \d|ver m[aá]s|veure m[eé]s|leer m[aá]s|llegir m[eé]s|facebook|twitter|instagram|retuitear|responder)\b|\b\d{1,2} de (gener|febrer|mar[cç]|abril|maig|juny|juliol|agost|setembre|octubre|novembre|desembre|enero|febrero|marzo|mayo|junio|julio|agosto|septiembre|noviembre|diciembre)\b", re.I)


def huella(texto):
    """Huella del horario de un texto: cambia si cambia alguna línea con días u horas (salvo el ruido)."""
    vistas, lineas, feed = set(), [], False
    for l in texto.splitlines():
        l = re.sub(r"\s+", " ", l).strip()
        if l.startswith("==="):
            feed = False
        elif re.fullmatch(r"(Síguenos|Segueix-nos)", l):  # en la ficha del Arzobispado, después vienen las noticias
            feed = True
        if feed or not l or l.startswith("###") or len(l) > 300 or l in vistas or RUIDO.search(l):
            continue
        if l.startswith("===") or HORA.search(l) or DIA.search(l):
            vistas.add(l)
            lineas.append(re.sub(r"^=== (WEB|ENLACE «[^»]*»|ARZOBISPADO) (\S+).*", r"=== \1 \2", l))
    return hashlib.sha1("\n".join(lineas).encode("utf-8")).hexdigest()[:12]


def secciones(texto):
    """{"WEB": texto de la web y sus enlaces, "ARZ": ficha del Arzobispado, "web_estado": "ok" | "no responde" | "sin web"}."""
    out, cur = {"WEB": [], "ARZ": []}, None
    estado = "sin web"
    for l in texto.splitlines():
        if l.startswith("### web:"):
            estado = "sin web" if l.strip().endswith("-") else "no responde"
        if l.startswith("=== "):
            cur = "ARZ" if l.startswith("=== ARZOBISPADO") else "WEB"
            if l.startswith("=== WEB ") and not re.search(r": (error|robots)", l):
                estado = "ok"
            elif l.startswith("=== WEB ") and re.search(r"Name or service not known|No address associated", l):
                estado = "no existe"
            continue
        if cur and not l.startswith("###"):
            out[cur].append(l)
    arz = "\n".join(out["ARZ"])
    arz = arz[:arz.index("Síguenos")] if "Síguenos" in arz else arz
    return {"WEB": "\n".join(out["WEB"]), "ARZ": arz, "web_estado": estado}


GENERICAS = {"parroquia", "parroquial", "parroquies", "parroquias", "parroquia", "iglesia", "esglesia", "basilica", "santuari", "santuario",
             "capella", "capilla", "sant", "santa", "sants", "santo", "san", "mare", "madre", "deu", "dios", "nuestra", "senora", "verge",
             "virgen", "del", "dels", "les", "los", "las", "de", "la", "el", "i", "y", "barcelona", "comunitat", "comunidad", "monestir",
             "monasterio", "convent", "convento", "oratori", "oratorio", "ermita", "germanes", "hermanas", "pares", "padres",
             "carrer", "calle", "avinguda", "avenida", "passeig", "paseo", "placa", "plaza", "ronda", "ctra", "carretera", "cami", "camino",
             "travessera", "rambla", "passatge", "pasaje"}


def _palabras(t):
    from horarios_excel import _sin_acentos
    return [w for w in re.findall(r"[a-z]{4,}", _sin_acentos(t or "").lower()) if w not in GENERICAS]


def web_github(texto, lug):
    """Primera comprobación de la web (B), automática: «ok» si en la web salen la calle o el nombre del templo."""
    sec = secciones(texto)
    if sec["web_estado"] != "ok":
        return sec["web_estado"]
    from horarios_excel import _sin_acentos
    web = _sin_acentos(sec["WEB"]).lower()
    if len(web.strip()) < 200:  # la página se monta con JavaScript o es una imagen: no hay texto para comprobar
        return "sin texto"
    calle, nombre = _palabras(lug.get("direccion")), _palabras(lug["nombre"])
    if (calle and calle[0] in web) or any(w in web for w in nombre):
        return "ok"
    return "no coincide"


def lectura_2(texto, fuente, md):
    """Segunda lectura automática (C2): las mismas reglas, pero sobre el texto entero de la fuente que usó C."""
    import horarios_texto as ht
    from horarios_excel import horario_txt
    sec = secciones(texto)
    t = sec["WEB"] if fuente == "F1" else sec["ARZ"] if fuente == "F3" else ""
    if not t.strip():
        return ""
    cels = ht.extraer(t)[0]
    return horario_txt(cels, md) if cels else ""


def guardar_huellas(carpeta, fecha=None):
    """Actualiza en huellas.json la huella («actual»), la comprobación de la web («web») y la segunda lectura automática («c2»).
    «leida» (la huella con la que se hicieron D y E) solo la cambia lecturas.py."""
    import datetime as dt
    datos = json.loads(HUELLAS.read_text("utf-8")) if HUELLAS.exists() else {}
    fecha = fecha or dt.date.today().isoformat()
    lugares = {l["id"]: l for l in json.loads((h.OUT / "lugares.json").read_text("utf-8"))["lugares"]}
    templos = json.loads((h.OUT / "horarios.json").read_text("utf-8"))["templos"]
    for f in sorted(pathlib.Path(carpeta).glob("BCN*.txt")):
        if f.stem not in lugares:
            continue
        r = datos.setdefault(f.stem, {})
        texto = f.read_text("utf-8")
        nueva = huella(texto)
        if r.get("actual") != nueva:
            r.update(actual=nueva, desde=fecha)
        t = templos.get(f.stem) or {}
        r["web"] = web_github(texto, lugares[f.stem])
        r["c2"] = lectura_2(texto, t.get("fuente"), fecha[5:]) if t.get("estado") in ("ok", "pendiente de verificar") else ""
    HUELLAS.write_text(json.dumps(datos, ensure_ascii=False, indent=1, sort_keys=True) + "\n", "utf-8")
    n = len(list(pathlib.Path(carpeta).glob("BCN*.txt")))
    if n:  # la web enseña esta fecha como «Última verificación de los datos»
        VERIFICACION.write_text(json.dumps({"ultima": fecha, "fuentes": n}, ensure_ascii=False, indent=1) + "\n", "utf-8")
    return datos


def main():
    global DEST
    if sys.argv[1:2] == ["--huellas"]:
        guardar_huellas(sys.argv[2])
        return
    if len(sys.argv) > 1:
        DEST = pathlib.Path(sys.argv[1])
    DEST.mkdir(parents=True, exist_ok=True)
    lugares = json.loads((h.OUT / "lugares.json").read_text("utf-8"))["lugares"]
    fuera = set(json.loads((h.OUT / "eliminados.json").read_text("utf-8"))["templos"]) if (h.OUT / "eliminados.json").exists() else set()
    lugares = [l for l in lugares if l["id"] not in fuera]
    rev = leer()
    with cf.ThreadPoolExecutor(8) as ex:
        for n, tid in enumerate(ex.map(lambda l: templo(l, rev), lugares), 1):
            print(n, tid, flush=True)
    guardar_huellas(DEST)


if __name__ == "__main__":
    main()
