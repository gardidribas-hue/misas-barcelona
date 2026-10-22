"""Horarios de misas, confesiones y adoración de los templos de la Archidiócesis de Barcelona.

Lee cada templo de data/horarios/lugares.json (importado del Excel de fuentes) y prueba sus fuentes
en orden: F1 (web propia o del arciprestazgo), F2 (API de misas.org) y F3 (ficha del Arzobispado).
Escribe en data/horarios/:
    horarios.json   lo que lee la app: celebraciones de cada templo, fuente, URL y fecha de comprobación
    estado.json     hash del texto de horarios de cada fuente (para no reprocesar lo que no cambia)
    historial/      versiones anteriores de cada templo cuando cambian
    textos/         texto de la sección de horarios leído en cada fuente (para revisar)
    informes/       informe de cada pasada: actualizados, cambios, fuentes caídas, discrepancias…
Lo ejecuta cada semana la acción de GitHub «horarios». A mano:
    pip install beautifulsoup4 pypdf openpyxl
    python scripts/horarios.py importar data/horarios/Fuentes_horarios_misas_Arzobispado_Barcelona.xlsx
    python scripts/horarios.py actualizar [--ids BCN0003,BCN0213]
"""
import argparse, datetime as dt, hashlib, io, json, math, os, pathlib, re, shutil, subprocess, sys, tempfile, time
import urllib.error, urllib.parse, urllib.request, urllib.robotparser
from bs4 import BeautifulSoup
from horarios_texto import extraer, norm, DIAS, VISPERA, FESTIVO, VERSION

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "horarios"
UA = "Mozilla/5.0 (compatible; misas-barcelona/1.0; +https://github.com/gardidribas-hue/misas-barcelona)"
HOY = dt.date.today().isoformat()
USAR_MISAS_ORG = False  # Guillem (22/10/2026): misas.org no es fiable; orden web propia → Arzobispado
F2_ANTIGUA = "2024-01-01"  # una revisión de misas.org anterior a esta fecha se considera poco fiable
PAUSA = 1.0  # segundos entre peticiones al mismo servidor (misas.org pide como mucho 1 por segundo)
CRUDO = bool(os.environ.get("HORARIOS_CRUDO"))
AVISO = "Los horarios pueden cambiar en festivos, en verano y en Navidad o Semana Santa. Confírmalos con la parroquia."


# --- Importar el Excel ---------------------------------------------------------------------------
COLS = {
    "ID": "id", "Nombre": "nombre", "Tipo": "tipo", "Municipio": "municipio", "Dirección": "direccion", "CP": "cp",
    "Latitud": "lat", "Longitud": "lng", "Web general": "web", "Prioridad de fuentes": "prioridad",
    "En directorio del Arzobispado": "en_arzobispado", "Estado": "estado_excel", "Notas": "notas",
    "Comprobado el": "comprobado_excel",
}
FCOLS = {
    "F1": {"F1 · URL del horario": "url", "F1 · Tipo de fuente": "tipo", "F1 · Formato": "formato",
           "F1 · Bloquea bots (robots.txt)": "bloquea_bots", "F1 · Incluye confesiones": "confesiones",
           "F1 · Incluye adoración": "adoracion"},
    "F2": {"F2 · misas.org API (JSON)": "url", "F2 · misas.org página": "pagina",
           "F2 · Última revisión en misas.org": "revision", "F2 · Nº misas registradas": "n_misas",
           "F2 · Incluye adoración": "adoracion", "F2 · Incluye confesiones": "confesiones"},
    "F3": {"F3 · Ficha Arzobispado": "url", "F3 · Menciona confesiones": "confesiones", "F3 · Menciona adoración": "adoracion"},
}


def importar(xlsx):
    import openpyxl
    ws = openpyxl.load_workbook(xlsx, data_only=True)["Fuentes"]
    filas = list(ws.iter_rows(values_only=True))
    cab = filas[0]
    lugares = []
    for f in filas[1:]:
        r = dict(zip(cab, f))
        if not r.get("ID"):
            continue
        lug = {v: r.get(k) for k, v in COLS.items()}
        lug["cp"] = str(lug["cp"]) if lug["cp"] is not None else None
        lug["fuentes"] = {}
        for fn, cols in FCOLS.items():
            d = {v: r.get(k) for k, v in cols.items() if r.get(k) is not None}
            if d.get("url"):
                lug["fuentes"][fn] = d
        lugares.append(lug)
    OUT.mkdir(parents=True, exist_ok=True)
    guardar(OUT / "lugares.json", {"meta": {"origen": pathlib.Path(xlsx).name, "importado": HOY, "total": len(lugares)},
                                   "lugares": lugares})
    print(f"{len(lugares)} lugares importados en {OUT / 'lugares.json'}")


# --- Descargas ---------------------------------------------------------------------------------
_ultima = {}
_robots = {}


def descargar(url, post=None, timeout=40, ua=None):
    host = urllib.parse.urlsplit(url).netloc
    espera = PAUSA - (time.time() - _ultima.get(host, 0))
    if espera > 0:
        time.sleep(espera)
    try:
        req = urllib.request.Request(url, data=post, headers={"User-Agent": ua or UA, "Accept": "*/*", "Accept-Language": "ca,es;q=0.8"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            datos = r.read()
            if CRUDO:  # copia de lo descargado, para depurar las reglas
                nombre = re.sub(r"[^a-z0-9]+", "_", url.lower().split("//", 1)[-1])[:120]
                (OUT / "crudo").mkdir(parents=True, exist_ok=True)
                (OUT / "crudo" / nombre).write_bytes(datos)
            return datos, r.headers.get("Content-Type", ""), r.geturl()
    finally:
        _ultima[host] = time.time()


def robots_permite(url):
    p = urllib.parse.urlsplit(url)
    base = f"{p.scheme}://{p.netloc}"
    if base not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        try:
            cuerpo, _, _ = descargar(base + "/robots.txt")
            rp.parse(cuerpo.decode("utf-8", "replace").splitlines())
        except Exception:
            rp.parse([])
        _robots[base] = rp
    return _robots[base].can_fetch(UA, url)


# --- De HTML / PDF / imagen a texto ----------------------------------------------------------------
def html_a_texto(html):
    s = BeautifulSoup(html, "html.parser")
    for el in s(["script", "style", "noscript", "nav", "footer", "form", "iframe", "svg", "template"]):
        el.decompose()
    for el in s.select("[id*=cookie], [class*=cookie]"):
        if el.name not in ("body", "html", "main"):
            el.decompose()
    for br in s.find_all("br"):
        br.replace_with("\n")
    bloques = s.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "td", "th", "dt", "dd", "div", "span", "strong", "b"])
    for el in bloques:
        if el.name in ("h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "tr", "dt", "dd", "div"):
            el.insert_before("\n")
            el.insert_after("\n")
        elif el.name in ("td", "th"):
            el.insert_after(" | ")
    texto = s.get_text("")
    lineas = [re.sub(r"[ \t ]+", " ", l).strip() for l in texto.splitlines()]
    return "\n".join(l for l in lineas if l)


def enlaces(html, base):
    s = BeautifulSoup(html, "html.parser")
    return [(re.sub(r"\s+", " ", a.get_text(" ")).strip(), urllib.parse.urljoin(base, a["href"]))
            for a in s.find_all("a", href=True)]


def ocr_disponible():
    return shutil.which("tesseract") is not None


def ocr_imagen(datos):
    with tempfile.TemporaryDirectory() as d:
        p = pathlib.Path(d) / "img"
        p.write_bytes(datos)
        return subprocess.run(["tesseract", str(p), "-", "-l", "cat+spa", "--psm", "4"],
                              capture_output=True, text=True, timeout=120).stdout


def pdf_a_texto(datos):
    from pypdf import PdfReader
    try:
        texto = "\n".join((pg.extract_text() or "") for pg in PdfReader(io.BytesIO(datos)).pages)
    except Exception:
        texto = ""
    if len(re.findall(r"\d", texto)) >= 4 or not (ocr_disponible() and shutil.which("pdftoppm")):
        return texto, "pdf"
    with tempfile.TemporaryDirectory() as d:  # PDF escaneado: OCR página a página
        pdf = pathlib.Path(d) / "f.pdf"
        pdf.write_bytes(datos)
        subprocess.run(["pdftoppm", "-r", "300", "-png", str(pdf), str(pathlib.Path(d) / "p")], check=True, timeout=180)
        partes = [ocr_imagen(png.read_bytes()) for png in sorted(pathlib.Path(d).glob("p*.png"))]
    return "\n".join(partes), "pdf+ocr"


def a_texto(datos, ctype, url):
    ctype = (ctype or "").lower()
    if "pdf" in ctype or url.lower().endswith(".pdf") or datos[:4] == b"%PDF":
        return pdf_a_texto(datos)
    if ctype.startswith("image/") or re.search(r"\.(png|jpe?g|webp|gif)$", url.lower()):
        if not ocr_disponible():
            raise RuntimeError("imagen sin OCR disponible")
        return ocr_imagen(datos), "ocr"
    return html_a_texto(datos.decode("utf-8", "replace")), "html"


# --- Sección de horarios y bloque de un templo -------------------------------------------------------
RX_HORARIO = r"\b(\d{1,2}([:.,']\d{2}|\s?h\b))|missa|misa|misses|misas|eucarist|confess|confesi|adoraci|exposici|hora santa|horari|horario|celebraci|feiners|laborables|diumenge|domingo|dissabte|sabado|vigili|festiu|festivo"


def seccion_horarios(texto):
    """Se queda con las líneas que hablan de horarios (y sus títulos), para el hash y la extracción."""
    ls = texto.splitlines()
    keep = set()
    for i, l in enumerate(ls):
        if re.search(RX_HORARIO, norm(l)) and len(l) < 400:
            keep.add(i)
            if i > 0 and len(ls[i - 1]) < 80:
                keep.add(i - 1)  # el título de encima (p. ej. "Estiu")
    return "\n".join(ls[i] for i in sorted(keep))


PREFIJOS = r"^(parroquia personal|parroquia|esglesia|iglesia|basilica|santuari|santuario|capella|capilla|monestir|monasterio|ermita|oratori|oratorio)( de(l| la| les| los| las)?| d')?\s+"


def claves_nombre(nombre):
    n = norm(re.sub(r"\(.*?\)", "", nombre)).strip()
    n = re.sub(PREFIJOS, "", n).strip()
    claves = [n]
    corto = re.sub(r"\s+(de|del|d')\s*\w+$", "", n).strip()  # "sant joan de gracia" -> "sant joan"
    if corto != n and len(corto.split()) >= 2:
        claves.append(corto)
    return claves


def bloque_templo(texto, nombre, otros):
    """En una página compartida, el trozo que va desde el nombre del templo hasta el de otro templo."""
    ls = texto.splitlines()
    claves = claves_nombre(nombre)
    otras = [c for o in otros for c in claves_nombre(o) if c not in claves]
    ini = next((i for c in claves for i, l in enumerate(ls) if len(l) < 120 and re.search(rf"\b{re.escape(c)}\b", norm(l))), None)
    if ini is None:
        return None
    fin = len(ls)
    for j in range(ini + 1, len(ls)):
        t = norm(ls[j])
        if len(ls[j]) < 120 and (any(re.search(rf"\b{re.escape(c)}\b", t) for c in otras)
                                 or re.match(r"^(parroquia|parroquia de|esglesia|iglesia|comunitat|comunidad)\b", t) and not any(c in t for c in claves)):
            fin = j
            break
    return "\n".join(ls[ini:fin])


RX_ENLACE_HORARIO = r"horari|horario|misses|misas|missa|celebracions|celebraciones|culte|culto"


# --- Fuentes -----------------------------------------------------------------------------------
class SinHorario(Exception):
    pass


def leer_f1(lug, f1, lugares, estado_t):
    descubierta = estado_t.get("F1_url_descubierta")
    url = descubierta or f1["url"]
    if not robots_permite(url):
        raise SinHorario("robots.txt no permite leerla")
    datos, ctype, final = descargar(url)
    texto, formato = a_texto(datos, ctype, final)
    if descubierta:  # página del horario encontrada en una pasada anterior
        return seccion_horarios(texto), final, formato, ["página encontrada desde " + f1["url"]]
    es_portada = "portada" in (f1.get("tipo") or "") or f1.get("formato") == "Sin verificar"
    compartida = [o["nombre"] for o in lugares if o["id"] != lug["id"] and (o["fuentes"].get("F1") or {}).get("url") == f1["url"]]
    notas = []
    if formato == "html" and (es_portada or compartida):
        bloque = bloque_templo(texto, lug["nombre"], compartida) if compartida else None
        if compartida and bloque and extraer(seccion_horarios(bloque))[0]:
            texto = bloque
            notas.append("bloque del templo dentro de una página compartida")
        else:
            # Portada, o página compartida sin bloque propio: busca un enlace al horario (o a la página del templo).
            links = enlaces(datos.decode("utf-8", "replace"), final)
            claves = claves_nombre(lug["nombre"])
            cand = sorted((u for t, u in links if compartida and any(c in norm(t) for c in claves)),
                          key=lambda u: not re.search(r"parroqui|esglesi|iglesi|templ", u)) + \
                   [u for t, u in links if es_portada and re.search(RX_ENLACE_HORARIO, norm(t + " " + u))]
            cand = [u for u in dict.fromkeys(cand) if u.startswith("http") and u.split("#")[0] != final.split("#")[0]]
            if not cand:
                raise SinHorario("no hay bloque del templo ni enlace a su horario" if compartida else "no se encuentra el enlace al horario")
            url = cand[0]
            if not robots_permite(url):
                raise SinHorario("robots.txt no permite leer " + url)
            datos, ctype, final = descargar(url)
            texto, formato = a_texto(datos, ctype, final)
            estado_t["F1_url_descubierta"] = url
            notas.append("página encontrada desde " + f1["url"])
    return seccion_horarios(texto), final, formato, notas


def leer_f3(lug, f3):
    datos, ctype, final = descargar(f3["url"])
    s = BeautifulSoup(datos.decode("utf-8", "replace"), "html.parser")
    texto = html_a_texto(str(s))
    # En la ficha, el horario va del título "Horario de misas" / "Horari de misses" al siguiente título.
    m = re.search(r"(?is)(horari[o]? de mis(?:s)?(?:es|as).*?)(?:\n(?:despacho parroquial|despatx parroquial|actividades|activitats|contacto|contacte)\b|\Z)", texto)
    return (m.group(1) if m else seccion_horarios(texto)), final, "html", []


DIA_MO = {0: ["domingo"], 1: ["lunes"], 2: ["martes"], 3: ["miercoles"], 4: ["jueves"], 5: ["viernes"],
          6: ["sabado"], 7: ["sabado"], 8: [VISPERA], 9: [FESTIVO]}
IDIOMA_MO = {"es": ("es", None), "cat": ("ca", None), "ca": ("ca", None), "bl": ("bilingue", None), "en": ("otro", "inglés"),
             "fr": ("otro", "francés"), "it": ("otro", "italiano"), "de": ("otro", "alemán"), "pl": ("otro", "polaco"),
             "ua": ("otro", "ucraniano"), "ph": ("otro", "tagalo"), "latin": ("otro", "latín"), "pt": ("otro", "portugués"),
             "ro": ("otro", "rumano")}


def dias_mo(codes):
    dias, vesp = [], False
    for c in codes or []:
        try:
            c = int(c)
        except (TypeError, ValueError):
            continue
        vesp = vesp or c in (7, 8)
        for d in DIA_MO.get(c, []):
            if d not in dias:
                dias.append(d)
    orden = DIAS + [VISPERA, FESTIVO]
    return sorted(dias, key=orden.index), vesp


def hhmm(v):
    m = re.match(r"(\d{1,2})[:.h](\d{2})", str(v or ""))
    return f"{int(m.group(1)):02d}:{m.group(2)}" if m else None


def fecha_md(v):
    if isinstance(v, dict) and v.get("month"):
        return f"{int(v['month']):02d}-{int(v.get('day') or 1):02d}"
    return None


def leer_f2(lug, f2):
    datos, _, final = descargar(f2["url"])
    j = json.loads(datos.decode("utf-8", "replace"))
    j = j.get("parish", j) if isinstance(j, dict) else j
    cels = []

    def temporada(p):
        if not p:
            return None
        return {"nombre": p.get("name") or "Todo el año", "inicio": fecha_md(p.get("begin")), "fin": fecha_md(p.get("end"))}

    def misas(lista, temp):
        for m in lista or []:
            dias, vesp = dias_mo(m.get("days"))
            ini = hhmm(m.get("time"))
            if not ini or not dias:
                continue
            idi = IDIOMA_MO.get((m.get("language") or "").lower())
            c = {"tipo": "misa", "dias": dias, "inicio": ini, "fin": None, "idioma": idi[0] if idi else None,
                 "temporada": temp, "semanas_mes": [int(w) for w in (m.get("weeks") or []) if str(w).lstrip("-").isdigit()],
                 "notas": (m.get("comments") or "").strip()}
            if m.get("weeks_negative"):
                c["semanas_mes_negativas"] = True
            if idi and idi[1]:
                c["idioma_detalle"] = idi[1]
            if vesp:
                c["vespertina_dominical"] = True
            cels.append(c)

    def adoraciones(lista, temp):
        for a in lista or []:
            dias, _ = dias_mo(a.get("days"))
            ini = hhmm(a.get("begin") or a.get("time"))
            if not ini:
                continue
            cels.append({"tipo": "adoracion", "dias": dias, "inicio": ini, "fin": hhmm(a.get("end")), "idioma": None,
                         "temporada": temp, "semanas_mes": [], "notas": " · ".join(x for x in (a.get("type"), a.get("comments")) if x)})

    for p in j.get("periods") or []:
        t = temporada(p)
        misas(p.get("masses"), t)
        adoraciones(p.get("adorations"), t)
    misas(j.get("masses"), None)
    adoraciones(j.get("adorations"), None)
    texto_conf = j.get("confessions") or ""
    if isinstance(texto_conf, list):
        texto_conf = "\n".join(map(str, texto_conf))
    if texto_conf.strip():
        conf = extraer(texto_conf, tipo_inicial="confesion")[0]
        conf = [c for c in conf if c["tipo"] == "confesion"]
        if not conf:
            conf = [{"tipo": "confesion", "dias": [], "inicio": None, "fin": None, "idioma": None, "temporada": None,
                     "semanas_mes": [], "notas": texto_conf.strip()[:300], "solo_texto": True}]
        cels += conf
    revision = str(j.get("updated_time") or f2.get("revision") or "")[:10]
    texto = json.dumps({k: j.get(k) for k in ("periods", "masses", "adorations", "confessions", "celebrations")},
                       ensure_ascii=False, sort_keys=True, indent=1)
    return texto, f2.get("pagina") or final, cels, revision


# OpenStreetMap: horarios de misa en las etiquetas mass_times / service_times de cada iglesia (licencia ODbL).
USAR_OSM = True
UA_OSM = "misas-barcelona/1.0 (horarios de misa; https://github.com/gardidribas-hue/misas-barcelona)"  # Overpass rechaza los «Mozilla/…»
OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
BBOX = (41.30, 2.05, 41.72, 2.75)  # Barcelona, Llobregat y Maresme
_osm = None
OSM_DIA = {"Mo": "lunes", "Tu": "martes", "We": "miercoles", "Th": "jueves", "Fr": "viernes", "Sa": "sabado", "Su": "domingo", "PH": FESTIVO}
OSM_D = list(OSM_DIA)
OSM_MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def osm_iglesias():
    global _osm
    if _osm is None:
        q = (f'[out:json][timeout:120];nwr["amenity"="place_of_worship"]["religion"="christian"]'
             f'({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});out center tags;')
        errores = []
        for servidor in OVERPASS * 2:  # servidores públicos de Overpass; si uno no responde, el siguiente
            try:
                datos, _, _ = descargar(servidor, post=urllib.parse.urlencode({"data": q}).encode(), timeout=150, ua=UA_OSM)
                break
            except urllib.error.HTTPError as e:
                errores.append(f"{servidor}: {e.code} {e.read()[:150]!r}")
            except (urllib.error.URLError, OSError) as e:
                errores.append(f"{servidor}: {e}")
        else:
            raise RuntimeError("Overpass no responde: " + " | ".join(errores))
        _osm = []
        for e in json.loads(datos.decode("utf-8"))["elements"]:
            t = e.get("tags", {})
            if t.get("denomination") not in (None, "catholic", "roman_catholic"):
                continue
            lat, lng = (e.get("lat"), e.get("lon")) if "lat" in e else (e.get("center", {}).get("lat"), e.get("center", {}).get("lon"))
            if lat is not None:
                _osm.append({"id": f"{e['type']}/{e['id']}", "lat": lat, "lng": lng, "tags": t})
    return _osm


def osm_celebraciones(valor, tipo):
    """«Mo-Fr 19:00; Sa 20:00; Su,PH 11:00,13:00» (formato opening_hours) -> celebraciones."""
    cels, dudosas = [], []
    for regla in [r.strip() for r in re.split(r";|\|\|", valor) if r.strip()]:
        temporada = None
        m = re.match(rf"^({'|'.join(OSM_MES)})(?:-({'|'.join(OSM_MES)}))?\s+", regla)
        if m:
            a = OSM_MES.index(m.group(1)) + 1
            b = OSM_MES.index(m.group(2) or m.group(1)) + 1
            temporada = {"nombre": "Verano" if a in (6, 7, 8) and b in (7, 8, 9) else "Curso" if a in (9, 10) else f"{m.group(1)}–{m.group(2) or m.group(1)}",
                         "inicio": f"{a:02d}-01", "fin": f"{b:02d}-{[31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][b - 1]:02d}"}
            regla = regla[m.end():]
        m = re.match(r"^((?:Mo|Tu|We|Th|Fr|Sa|Su|PH)(?:\s*[-,]\s*(?:Mo|Tu|We|Th|Fr|Sa|Su|PH))*)\s+(.+)$", regla)
        horas = re.findall(r"(\d{1,2}):(\d{2})(?:\s*-\s*(\d{1,2}):(\d{2}))?", m.group(2)) if m else []
        if not m or not horas:
            dudosas.append(regla)
            continue
        dias = []
        for parte in re.split(r"\s*,\s*", m.group(1)):
            if "-" in parte:
                x, y = [OSM_D.index(d.strip()) for d in parte.split("-")]
                dias += [OSM_DIA[d] for d in OSM_D[x:y + 1]]
            else:
                dias.append(OSM_DIA[parte])
        for h1, m1, h2, m2 in horas:
            cels.append({"tipo": tipo, "dias": list(dict.fromkeys(dias)), "inicio": f"{int(h1):02d}:{m1}",
                         "fin": f"{int(h2):02d}:{m2}" if h2 and tipo != "misa" else None, "idioma": None,
                         "temporada": temporada, "semanas_mes": [], "notas": ""})
    return cels, dudosas


def leer_osm(lug):
    if lug.get("lat") is None:
        raise SinHorario("sin coordenadas")
    cerca = [(math.dist((o["lat"], o["lng"]), (lug["lat"], lug["lng"])) * 111000, o) for o in osm_iglesias()]
    cerca = sorted((x for x in cerca if x[0] < 80), key=lambda x: x[0])
    con = [o for _, o in cerca if o["tags"].get("mass_times") or o["tags"].get("service_times")]
    if not con:
        raise SinHorario("OpenStreetMap no tiene horario de misas para este templo" if cerca else "no está en OpenStreetMap")
    o = con[0]
    cels, dudosas = osm_celebraciones(o["tags"].get("mass_times") or o["tags"]["service_times"], "misa")
    texto = json.dumps({k: v for k, v in o["tags"].items() if re.search(r"name|times|opening|website|check_date", k)}, ensure_ascii=False, indent=1, sort_keys=True)
    return texto, "https://www.openstreetmap.org/" + o["id"], cels, dudosas


# --- Controles de calidad -----------------------------------------------------------------------------
def sospechas(lug, cels):
    s = []
    for c in cels:
        for h in (c.get("inicio"), c.get("fin")):
            if h and not ("06:00" <= h <= "23:00"):
                s.append(f"hora fuera de 06:00–23:00: {c['tipo']} {h}")
    misas = [c for c in cels if c["tipo"] == "misa"]
    if (lug.get("tipo") or "").startswith("Parroquia") and not any("domingo" in c["dias"] or c.get("vespertina_dominical") for c in misas):
        s.append("parroquia sin ninguna misa dominical")
    return s


def huella(cels):
    """Misas como conjunto (días, hora) de la temporada de curso, para comparar F1 con F2."""
    out = set()
    for c in cels:
        nombre = norm((c.get("temporada") or {}).get("nombre") or "curso")
        if c["tipo"] != "misa" or not re.search(r"curs|invierno|hivern|todo|ano|any|normal|general", nombre):
            continue
        for d in c["dias"]:
            if d in DIAS:
                out.add((d, c["inicio"]))
    return out


def comparar(f1, f2):
    a, b = huella(f1), huella(f2)
    if not a or not b or a == b:
        return None
    fmt = lambda xs: ", ".join(f"{d} {h}" for d, h in sorted(xs, key=lambda x: (DIAS.index(x[0]), x[1])))
    return {"solo_en_F1": fmt(a - b), "solo_en_F2": fmt(b - a)}


# --- Pasada -------------------------------------------------------------------------------------
def cargar(p, defecto):
    try:
        return json.loads(p.read_text("utf-8"))
    except (FileNotFoundError, ValueError):
        return defecto


def guardar(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n", "utf-8")


def sha(texto):
    limpio = re.sub(r"\s+", " ", texto).strip()
    return hashlib.sha256(f"v{VERSION} {limpio}".encode()).hexdigest()[:16]


def aplicar_correcciones(tid, cels, res):
    """Correcciones a mano (data/horarios/correcciones.json): mandan sobre lo extraído mientras la celebración exista."""
    for k in cargar(OUT / "correcciones.json", []):
        if k.get("id") != tid:
            continue
        b = k.get("buscar", {})
        hechas = 0
        for c in cels:
            if all((set(v) <= set(c.get(f) or [])) if isinstance(v, list) else c.get(f) == v for f, v in b.items()):
                c.update(k.get("poner", {}))
                c["corregido"] = {"motivo": k.get("motivo"), "por": k.get("por"), "fecha": k.get("fecha")}
                hechas += 1
        if not hechas:
            res.setdefault("correcciones_sin_aplicar", []).append(k.get("motivo"))
    return cels


def comparable(cels):
    return sorted(json.dumps({k: v for k, v in c.items() if k != "comprobado"}, sort_keys=True, ensure_ascii=False) for c in cels)


def guardar_texto(tid, fn, url, formato, texto):
    (OUT / "textos").mkdir(parents=True, exist_ok=True)
    (OUT / "textos" / f"{tid}-{fn}.txt").write_text(f"# {url}\n# {HOY} · formato: {formato}\n\n{texto}\n", "utf-8")


def lectura_id():
    """Reservado por si la lectura cambia de método: hoy, solo reglas."""
    return ""


def leer_texto(texto, nombre, informe, tid):
    """Texto de horarios -> celebraciones, con las reglas de horarios_texto.py."""
    cels, dud, av = extraer(texto)
    return cels, dud, av, "reglas"


def confianza_f1(cels, dudosas, lectura="reglas"):
    seguro = not dudosas and not any(c.get("dias_deducidos") or c.get("idioma_incierto") for c in cels)
    return "alta" if seguro and any(c["tipo"] == "misa" for c in cels) else "media"


def confianza_f2(revision):
    if not revision or revision < F2_ANTIGUA:
        return "baja"
    return "alta" if revision >= (dt.date.today() - dt.timedelta(days=548)).isoformat() else "media"


def orden_fuentes(lug):
    fs = lug["fuentes"]
    orden = []
    if "F1" in fs and norm(str(fs["F1"].get("bloquea_bots") or "")) != "si":
        orden.append("F1")
    if "F2" in fs and USAR_MISAS_ORG:
        orden.append("F2")
    if "F3" in fs:
        orden.append("F3")
    return orden


def procesar(lug, lugares, previo, estado_t, informe):
    tid = lug["id"]
    fs = lug["fuentes"]
    intentos, elegido, f2_datos, f2_debil, f2_revision = [], None, None, None, None
    lectura = "reglas"
    for fn in orden_fuentes(lug):
        try:
            if fn == "F2":
                texto, url, cels, revision = leer_f2(lug, fs["F2"])
                dudosas, formato, notas = [], "json", []
                f2_datos, f2_revision = cels, revision
                if elegido:
                    break
                if not any(c["tipo"] == "misa" for c in cels):
                    raise SinHorario("misas.org no tiene misas registradas")
                conf = confianza_f2(revision)
                if revision and revision < F2_ANTIGUA and "F3" in fs:
                    f2_debil = (texto, url, cels, [], "json", [f"última revisión en misas.org: {revision}"], conf)
                    intentos.append({"fuente": fn, "resultado": f"revisión antigua ({revision}), se prueba la F3"})
                    continue
                notas = [f"última revisión en misas.org: {revision}"] if revision else []
            else:
                if elegido:
                    break
                texto, url, formato, notas = leer_f1(lug, fs["F1"], lugares, estado_t) if fn == "F1" else leer_f3(lug, fs["F3"])
                guardar_texto(tid, fn, url, formato, texto)
                h_texto = sha(texto + lectura_id())
                if previo and previo.get("fuente") == fn and previo.get("celebraciones") and estado_t.get(f"{fn}_texto") == h_texto:
                    # El texto no ha cambiado: no se vuelve a leer.
                    cels, dudosas, avisos, lectura = previo["celebraciones"], previo.get("lineas_dudosas") or [], [], "sin cambios"
                else:
                    cels, dudosas, avisos, lectura = leer_texto(texto, lug["nombre"], informe, tid)
                    estado_t[f"{fn}_texto"] = h_texto
                notas = notas + [f"aviso: {a}" for a in avisos]
                dudosas = list(dict.fromkeys(dudosas))
                if not any(c["tipo"] == "misa" for c in cels):
                    raise SinHorario("no se reconoce ningún horario de misa" + (f" ({len(dudosas)} líneas dudosas)" if dudosas else ""))
                conf = (previo.get("confianza") if lectura == "sin cambios" else confianza_f1(cels, dudosas, lectura)) if fn == "F1" else "baja"
                texto = texto + lectura_id()
            h = sha(texto)
            guardar_texto(tid, fn, url, formato, texto)
            intentos.append({"fuente": fn, "resultado": "ok"})
            elegido = dict(fuente=fn, url=url, formato=formato, celebraciones=cels, dudosas=dudosas, notas=notas,
                           confianza=conf, hash=h, lectura=lectura)
            if fn != "F1" or "F2" not in fs:
                break
        except SinHorario as e:
            intentos.append({"fuente": fn, "resultado": str(e)})
        except (urllib.error.URLError, OSError, ValueError, RuntimeError, subprocess.SubprocessError) as e:
            intentos.append({"fuente": fn, "resultado": f"error: {e}"[:200]})
            informe["caidas"].append({"id": tid, "nombre": lug["nombre"], "fuente": fn, "error": f"{e}"[:200]})
    if elegido and elegido["fuente"] == "F1" and f2_datos:  # lo que se completa con misas.org también cuenta para el hash
        extra = json.dumps([c for c in f2_datos if c["tipo"] != "misa"], sort_keys=True, ensure_ascii=False)
        elegido["hash"] = sha(elegido["hash"] + extra)
    if USAR_OSM and (not elegido or elegido["fuente"] == "F3"):
        # Sin web propia, el Arzobispado y OpenStreetMap valen lo mismo; si no coinciden, manda el Arzobispado.
        try:
            texto, url, cels, dudosas = leer_osm(lug)
            if not any(c["tipo"] == "misa" for c in cels):
                raise SinHorario("el horario de OpenStreetMap no se entiende")
            guardar_texto(tid, "OSM", url, "osm", texto)
            intentos.append({"fuente": "OSM", "resultado": "ok"})
            if elegido:
                d = comparar(elegido["celebraciones"], cels)
                if d:
                    elegido["discrepancia_OSM"] = {"solo_en_Arzobispado": d["solo_en_F1"], "solo_en_OSM": d["solo_en_F2"]}
                elegido["hash"] = sha(elegido["hash"] + texto)
            else:
                elegido = dict(fuente="OSM", url=url, formato="osm", celebraciones=cels, dudosas=dudosas, notas=[],
                               confianza="baja", hash=sha(texto))
        except SinHorario as e:
            intentos.append({"fuente": "OSM", "resultado": str(e)})
        except (urllib.error.URLError, OSError, ValueError, KeyError, RuntimeError) as e:
            intentos.append({"fuente": "OSM", "resultado": f"error: {e}"[:600]})
            informe["caidas"].append({"id": tid, "nombre": lug["nombre"], "fuente": "OSM", "error": f"{e}"[:600]})
    if not elegido and f2_debil:
        texto, url, cels, dudosas, formato, notas, conf = f2_debil
        elegido = dict(fuente="F2", url=url, formato=formato, celebraciones=cels, dudosas=dudosas, notas=notas,
                       confianza="baja", hash=sha(texto))

    res = {"id": tid, "nombre": lug["nombre"], "intentos": intentos, "aviso": AVISO}
    if not elegido:
        if previo and previo.get("celebraciones") and previo.get("fuente") in orden_fuentes(lug):
            res.update({k: previo.get(k) for k in ("fuente", "url", "comprobado", "confianza", "celebraciones", "formato")})
            res["estado"] = "pendiente de verificar"
            informe["pendientes"].append({"id": tid, "nombre": lug["nombre"]})
        else:
            res.update({"estado": "sin horario", "celebraciones": []})
            informe["sin_horario"].append({"id": tid, "nombre": lug["nombre"], "motivo": "; ".join(f"{i['fuente']}: {i['resultado']}" for i in intentos) or "sin fuentes"})
        return res

    fn = elegido["fuente"]
    sin_cambios = previo and previo.get("fuente") == fn and estado_t.get(fn, {}).get("hash") == elegido["hash"]
    if sin_cambios:
        cels = previo["celebraciones"]
    else:
        cels = [dict(c, fuente=fn, url=elegido["url"], comprobado=HOY, confianza=elegido["confianza"]) for c in elegido["celebraciones"]]
        if fn == "F1" and f2_datos:
            # Si la web no dice nada de confesiones o adoración, se toman de misas.org (cada una lleva su fuente).
            tipos_f1 = {c["tipo"] for c in cels}
            conf2 = confianza_f2(f2_revision)
            cels += [dict(c, fuente="F2", url=fs["F2"].get("pagina") or fs["F2"]["url"], comprobado=HOY, confianza=conf2)
                     for c in f2_datos if c["tipo"] != "misa" and c["tipo"] not in tipos_f1]
        if previo and previo.get("celebraciones") and comparable(previo["celebraciones"]) != comparable(cels):
            hist = cargar(OUT / "historial" / f"{tid}.json", [])
            hist.append({k: previo.get(k) for k in ("comprobado", "fuente", "url", "confianza", "celebraciones")})
            guardar(OUT / "historial" / f"{tid}.json", hist[-20:])
            informe["cambios"].append({"id": tid, "nombre": lug["nombre"], "fuente": fn,
                                       "antes": len(previo["celebraciones"]), "ahora": len(cels)})
        informe["actualizados"].append({"id": tid, "nombre": lug["nombre"], "fuente": fn, "celebraciones": len(cels)})
    cels = aplicar_correcciones(tid, cels, res)
    for c in cels:
        c["comprobado"] = HOY
    estado_t[fn] = {"hash": elegido["hash"], "ultimo_ok": HOY}
    if elegido.get("lectura") not in (None, "sin cambios"):
        res["lectura"] = elegido["lectura"]
    elif previo and previo.get("lectura"):
        res["lectura"] = previo["lectura"]
    res.update({"estado": "ok", "fuente": fn, "url": elegido["url"], "formato": elegido["formato"], "comprobado": HOY,
                "confianza": elegido["confianza"], "celebraciones": cels})
    if elegido["notas"]:
        res["notas_fuente"] = elegido["notas"]
    if elegido["dudosas"]:
        res["lineas_dudosas"] = elegido["dudosas"]
    if elegido.get("discrepancia_OSM"):
        res["discrepancia_OSM"] = elegido["discrepancia_OSM"]
        res["aviso_fiabilidad"] = "El Arzobispado y OpenStreetMap no coinciden: se muestra el del Arzobispado, que puede no estar al día. Confírmalo con la parroquia."
        informe["discrepancias"].append({"id": tid, "nombre": lug["nombre"], "solo_en_F1": elegido["discrepancia_OSM"]["solo_en_Arzobispado"],
                                         "solo_en_F2": elegido["discrepancia_OSM"]["solo_en_OSM"], "entre": "Arzobispado / OpenStreetMap"})
    if fn == "F1" and f2_datos:
        d = comparar(cels, f2_datos)
        if d:
            res["discrepancia_F2"] = d
            informe["discrepancias"].append({"id": tid, "nombre": lug["nombre"], **d})
    s = sospechas(lug, cels)
    if s:
        res["sospechas"] = s
        informe["sospechosos"].append({"id": tid, "nombre": lug["nombre"], "motivos": s})
    return res


def actualizar(ids=None):
    lugares = cargar(OUT / "lugares.json", None)
    if not lugares:
        sys.exit("Falta data/horarios/lugares.json: ejecuta antes «horarios.py importar <Excel>»")
    lugares = lugares["lugares"]
    datos = cargar(OUT / "horarios.json", {"meta": {}, "templos": {}})
    estado = cargar(OUT / "estado.json", {})
    informe = {k: [] for k in ("actualizados", "cambios", "caidas", "discrepancias", "sin_horario", "pendientes", "sospechosos")}
    sel = [l for l in lugares if not ids or l["id"] in ids]
    for n, lug in enumerate(sel, 1):
        print(f"[{n}/{len(sel)}] {lug['id']} {lug['nombre']}", flush=True)
        r = procesar(lug, lugares, datos["templos"].get(lug["id"]), estado.setdefault(lug["id"], {}), informe)
        r.update({k: lug.get(k) for k in ("tipo", "municipio", "direccion", "cp", "lat", "lng", "web")})
        r["oculto_por_defecto"] = lug.get("estado_excel") == "Sin horario conocido" and not r["celebraciones"]
        datos["templos"][lug["id"]] = r
        print("    " + "; ".join(f"{i['fuente']}: {i['resultado']}" for i in r["intentos"]) + f" -> {r['estado']} {r.get('fuente') or ''}", flush=True)
    datos["meta"] = {"actualizado": HOY, "templos": len(datos["templos"]), "aviso": AVISO,
                     "fuentes": {"F1": "web de la parroquia o del arciprestazgo", "F2": "misas.org (sin usar)", "F3": "Arzobispado de Barcelona (esglesia.barcelona)", "OSM": "OpenStreetMap (etiqueta mass_times)"}}
    guardar(OUT / "horarios.json", datos)
    guardar(OUT / "estado.json", estado)
    if _osm is not None:
        con = sum(1 for o in _osm if o["tags"].get("mass_times") or o["tags"].get("service_times"))
        informe["osm"] = f"OpenStreetMap: {len(_osm)} iglesias católicas en la zona, {con} con horario de misas"
    guardar(OUT / "informes" / f"{HOY}.json", {"fecha": HOY, "revisados": len(sel), **informe})
    (OUT / "informes" / f"{HOY}.md").write_text(informe_md(len(sel), informe), "utf-8")
    print(informe_md(len(sel), informe))


def informe_md(n, inf):
    L = [f"# Informe de horarios · {HOY}", "", f"Templos revisados: {n}", ""] + ([inf["osm"], ""] if inf.get("osm") else [])
    secc = [("actualizados", "Templos actualizados", lambda x: f"{x['nombre']} ({x['id']}): {x['celebraciones']} celebraciones, fuente {x['fuente']}"),
            ("cambios", "Cambios detectados", lambda x: f"{x['nombre']} ({x['id']}): {x['antes']} → {x['ahora']} celebraciones ({x['fuente']})"),
            ("caidas", "Fuentes caídas", lambda x: f"{x['nombre']} ({x['id']}) · {x['fuente']}: {x['error']}"),
            ("discrepancias", "Discrepancias entre fuentes (manda la primera)", lambda x: f"{x['nombre']} ({x['id']}) · {x.get('entre', 'web / misas.org')}: solo en la primera: {x['solo_en_F1'] or '—'}; solo en la segunda: {x['solo_en_F2'] or '—'}"),
            ("pendientes", "Pendientes de verificar (se mantiene el último horario bueno)", lambda x: f"{x['nombre']} ({x['id']})"),
            ("sin_horario", "Templos sin horario", lambda x: f"{x['nombre']} ({x['id']}): {x['motivo']}"),
            ("sospechosos", "Datos sospechosos", lambda x: f"{x['nombre']} ({x['id']}): {'; '.join(x['motivos'])}")]
    for k, titulo, fmt in secc:
        L.append(f"## {titulo} ({len(inf[k])})")
        L += [f"- {fmt(x)}" for x in inf[k]] or ["- Ninguno"]
        L.append("")
    return "\n".join(L)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("importar").add_argument("xlsx")
    a = sub.add_parser("actualizar")
    a.add_argument("--ids", default="", help="IDs separados por comas (por defecto, todos)")
    args = ap.parse_args()
    if args.cmd == "importar":
        importar(args.xlsx)
    else:
        actualizar({i.strip() for i in args.ids.split(",") if i.strip()} or None)
