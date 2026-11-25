"""Excel de revisión de horarios (data/horarios/Horarios_revision.xlsx).

Una hoja por distrito de Barcelona y por municipio (parroquias), y otra por tipo de templo. Columnas:
    A Nombre · B Web · C Lectura automática · D Segunda lectura · E Tercera lectura · F Fiabilidad (fórmula)
    G Fuente de la columna C · H Municipio · I ID · J Lectura automática 2 (C2) · K Web: comprobación de GitHub
    L Web: comprobación de Claude · M Fuente cambiada
Cada lunes: GitHub lee las fuentes (C), las descarga enteras y las vuelve a leer (C2, scripts/fuentes_texto.py),
comprueba la web (K) y marca las fuentes que han cambiado (M). Después Claude comprueba la web (L) y hace la segunda
lectura (D) y, en otra sesión y a ciegas, la tercera (E), solo donde hace falta (scripts/lecturas.py).
Verde solo con web comprobada dos veces y dos lecturas iguales (ver estado()). F lo calcula con fórmula y la web
pública muestra el mismo aviso (horarios_app.py llama a estado()).
    python scripts/horarios_excel.py generar     reescribe el Excel con C, C2, K y M al día y conserva B, D, E y L
"""
import json, pathlib, re, sys, unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
H = ROOT / "data" / "horarios"
XLSX = H / "Horarios_revision.xlsx"
FUENTE = {"F1": "Web propia", "F3": "Arzobispado", "OSM": "OpenStreetMap", "F2": "misas.org"}
PARROQUIAS = ("Parroquia", "Parroquia personal", "Catedral")
HOJA_TIPO = {"Santuario": "Santuarios", "Basílica": "Basílicas", "Iglesia": "Iglesias", "Capilla": "Capillas",
             "Capilla de colegio": "Capillas", "Capilla de hospital": "Capillas de hospital",
             "Capilla de hospital (parroquia)": "Capillas de hospital", "Capilla de residencia": "Capillas de residencia",
             "Ermita": "Ermitas", "Monasterio / convento": "Monasterios y conventos", "Oratorio": "Oratorios"}
MUNICIPIO_HOJA = 4  # con menos parroquias, el municipio va a la hoja «Otros municipios»
CAB = ["Nombre", "Web (parroquia o comunidad pastoral)", "Horario leído (automático)", "Horario revisado (segunda lectura)",
       "Tercera lectura", "Fiabilidad (automática)", "Fuente de la columna C", "Municipio", "ID",
       "Lectura automática 2 (C2)", "Web: comprobación de GitHub", "Web: comprobación de Claude", "Fuente cambiada"]
HUELLAS = H / "huellas.json"
WEB_CLAUDE = ("Sí", "No")  # valores de la columna L

# Estados de la columna F: (texto que empieza la celda, color). La web usa el código. El color va por la primera palabra:
# «Fiable» verde, «Sin verificar» amarillo, «No coinciden» rojo, «Sin horario» gris.
VERDE, AMARILLO, ROJO, GRIS = "D9F2D9", "FFF2CC", "F4CCCC", "EDEDED"
ESTADOS = {
    "sin_horario": ("Sin horario · no sale en la web", GRIS),
    "fiable": ("Fiable · web comprobada dos veces; la lectura automática (C = C2) y la segunda lectura (D) coinciden", VERDE),
    "fiable_de": ("Fiable · web comprobada dos veces; la segunda (D) y la tercera lectura (E) coinciden", VERDE),
    "fiable_ce": ("Fiable · web comprobada dos veces; la lectura automática (C = C2) y la tercera lectura (E) coinciden", VERDE),
    "web_pendiente": ("Sin verificar · las lecturas coinciden, pero la web no se ha podido comprobar dos veces", AMARILLO),
    "relectura": ("Sin verificar · la fuente ha cambiado; falta repetir la segunda y la tercera lectura", AMARILLO),
    "sin_revisar": ("Sin verificar · solo hay la lectura automática de su web", AMARILLO),
    "sin_revisar_otra": ("Sin verificar · solo hay la lectura automática, y no es de la web de la parroquia", AMARILLO),
    "sin_web": ("Sin verificar · no tiene web y solo hay una lectura", AMARILLO),
    "sin_lectura": ("Sin verificar · su web no se ha podido leer y solo hay una lectura", AMARILLO),
    "pendiente": ("Sin verificar · aún no hay dos lecturas que coincidan; falta la tercera (E)", AMARILLO),
    "no_coinciden": ("No coinciden · ninguna lectura coincide con otra; se muestra D, confírmalo", ROJO),
    "web_dudosa": ("No fiable · Claude ha visto que la web de la columna B no es de este templo", ROJO),
}
COLOR_WEB = {VERDE: "verde", AMARILLO: "amarillo", ROJO: "rojo", GRIS: None}


def igual(a, b):
    """La misma comparación que la fórmula de la columna F: sin espacios ni saltos de línea, sin mayúsculas, – = -."""
    f = lambda s: re.sub(r"[ \n\r]", "", (s or "")).replace("–", "-").lower()
    return f(a) == f(b)


def estado(c, d, e="", fuente="", web="", c2=None, web_gh="", web_cl="", cambiada=False):
    """Código del estado y qué lectura se muestra en la web: "C", "D", "E" o None. La misma regla que la fórmula de F.

    Verde solo con web comprobada dos veces (GitHub «ok» y Claude «Sí»; no hace falta si no hay web) y dos lecturas
    iguales: D = E, o C = D (o C = E) si además la segunda lectura automática da lo mismo (C = C2).
    Si la fuente ha cambiado desde que se hicieron D y E, D y E no cuentan hasta que se repitan."""
    c, d, e, web = (c or "").strip(), (d or "").strip(), (e or "").strip(), (web or "").strip()
    if not (c or d or e):
        return "sin_horario", None
    if web and web_cl == "No":
        return "web_dudosa", ("D" if d else "C" if c else "E")
    web_ok = not web or (web_gh == "ok" and web_cl == "Sí")
    c2_ok = bool(c) and bool((c2 or "").strip()) and igual(c, c2)
    dd, ee = ("", "") if cambiada else (d, e)
    verde = (("fiable_de", "D") if dd and ee and igual(dd, ee) else
             ("fiable", "C") if c and dd and c2_ok and igual(c, dd) else
             ("fiable_ce", "C") if c and ee and c2_ok and igual(c, ee) else None)
    if verde:
        return verde if web_ok else ("web_pendiente", verde[1])
    if cambiada and (d or e):
        return "relectura", ("C" if c else "D" if d else "E")
    if sum(map(bool, (c, dd, ee))) >= 2:
        return ("no_coinciden" if ee else "pendiente"), ("D" if dd else "E")
    if c:
        return ("sin_revisar" if fuente == FUENTE["F1"] else "sin_revisar_otra"), "C"
    return ("sin_lectura" if web else "sin_web"), ("D" if d else "E")


def formula(i):
    n = lambda col: f'LOWER(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE({col}{i}," ",""),CHAR(10),""),CHAR(13),""),"–","-"))'
    v = lambda col: f'TRIM({col}{i})<>""'
    e = {k: f'"{x[0]}"' for k, x in ESTADOS.items()}
    web = f'G{i}="{FUENTE["F1"]}"'
    camb = f'M{i}="Sí"'
    dv, ev = f'AND({v("D")},NOT({camb}))', f'AND({v("E")},NOT({camb}))'
    c2 = f'AND({v("C")},{v("J")},{n("C")}={n("J")})'
    web_ok = f'OR(NOT({v("B")}),AND(K{i}="ok",L{i}="Sí"))'
    si_web = lambda cod: f'IF({web_ok},{e[cod]},{e["web_pendiente"]})'
    return (f'=IF(AND(TRIM(C{i})="",TRIM(D{i})="",TRIM(E{i})=""),{e["sin_horario"]},'
            f'IF(AND({v("B")},L{i}="No"),{e["web_dudosa"]},'
            f'IF(AND({dv},{ev},{n("D")}={n("E")}),{si_web("fiable_de")},'
            f'IF(AND({v("C")},{dv},{c2},{n("C")}={n("D")}),{si_web("fiable")},'
            f'IF(AND({v("C")},{ev},{c2},{n("C")}={n("E")}),{si_web("fiable_ce")},'
            f'IF(AND({camb},OR({v("D")},{v("E")})),{e["relectura"]},'
            f'IF(({v("C")})+({dv})+({ev})>=2,IF({ev},{e["no_coinciden"]},{e["pendiente"]}),'
            f'IF({v("C")},IF({web},{e["sin_revisar"]},{e["sin_revisar_otra"]}),'
            f'IF({v("B")},{e["sin_lectura"]},{e["sin_web"]})))))))))')


def huellas():
    """data/horarios/huellas.json: por ID, huella de la fuente («actual» y «leida»), comprobación de la web y C2."""
    return json.loads(HUELLAS.read_text("utf-8")) if HUELLAS.exists() else {}


def extra(tid, hs=None):
    """Datos de GitHub para estado(): c2, web_gh y si la fuente ha cambiado desde las lecturas D y E."""
    r = (huellas() if hs is None else hs).get(tid) or {}
    return {"c2": r.get("c2"), "web_gh": r.get("web", ""),
            "cambiada": bool(r.get("leida")) and r.get("actual") != r.get("leida")}


# --- De celebraciones a texto y de texto a celebraciones ------------------------------------------
ORD = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo", "vispera_festivo", "festivo_precepto"]
AB = {"lunes": "Lun", "martes": "Mar", "miercoles": "Mié", "jueves": "Jue", "viernes": "Vie", "sabado": "Sáb",
      "domingo": "Dom", "vispera_festivo": "vísperas", "festivo_precepto": "festivos"}
TIPOS = [("misa", "Misas"), ("confesion", "Confesiones"), ("adoracion", "Adoración")]


def dias_txt(ds):
    ds = [d for d in ORD if d in ds]
    sem = [d for d in ds if d in ORD[:7]]
    extra = [AB[d] for d in ds if d not in ORD[:7]]
    if sem == ORD[:7]:
        base = "Cada día"
    elif len(sem) >= 3 and sem == ORD[ORD.index(sem[0]):ORD.index(sem[0]) + len(sem)]:
        base = f"{AB[sem[0]]}–{AB[sem[-1]]}"
    else:
        base = ", ".join(AB[d] for d in sem)
    if base and extra:
        return base + " y " + " y ".join(extra)
    return base or " y ".join(extra)


def hora(h):
    return re.sub(r"^0(\d)", r"\1", h)


# Idioma de cada hora, entre paréntesis detrás de ella: «Dom 12:00 (cat), 19:30 (cast)». Solo si la fuente lo dice.
IDI_TXT = {"ca": "cat", "es": "cast", "bilingue": "cat/cast", "inglés": "en", "francés": "fr", "alemán": "de",
           "italiano": "it", "polaco": "pl", "ucraniano": "uk", "portugués": "pt", "latín": "lat", "tagalo": "tl",
           "griego": "gr", "chino": "zh", "rumano": "ro", "coreano": "ko"}
TXT_IDI = {"cat": "cat", "catala": "cat", "catalan": "cat", "ca": "cat",
           "cast": "cast", "castella": "cast", "castellano": "cast", "es": "cast", "esp": "cast", "espanol": "cast",
           "cat/cast": "cat/cast", "cast/cat": "cat/cast", "cat-cast": "cat/cast", "bilingue": "cat/cast",
           "en": "en", "eng": "en", "ingles": "en", "angles": "en", "english": "en", "fr": "fr", "frances": "fr",
           "de": "de", "al": "de", "aleman": "de", "alemany": "de", "it": "it", "ita": "it", "italiano": "it", "italia": "it",
           "pl": "pl", "polaco": "pl", "polones": "pl", "uk": "uk", "ucraniano": "uk", "ucraines": "uk", "pt": "pt",
           "portugues": "pt", "lat": "lat", "latin": "lat", "llati": "lat", "tl": "tl", "tagalo": "tl", "gr": "gr",
           "griego": "gr", "grec": "gr", "zh": "zh", "chino": "zh", "xines": "zh", "ro": "ro", "rumano": "ro", "romanes": "ro",
           "ko": "ko", "coreano": "ko"}
# Código de la web (app.js: LANG y el filtro de idioma)
WEB_IDI = {"cat": "ca", "cast": "es", "cat/cast": "ca-es", "en": "en", "fr": "fr", "de": "de", "it": "it", "pl": "pl"}


def idioma_txt(c):
    """«(cat)», «(cast)»… de una celebración leída por las reglas, o "" si la fuente no lo dice."""
    if c.get("idioma_incierto") or not c.get("idioma"):
        return ""
    k = IDI_TXT.get(c.get("idioma_detalle") if c["idioma"] == "otro" else c["idioma"])
    return f" ({k})" if k else ""


def idioma_web(txt):
    """«cat» → «ca» para la web; un idioma sin código propio en la web → «other»."""
    return WEB_IDI.get(txt, "other") if txt else None


def horario_txt(cels, md):
    """«Misas: Lun–Vie 8:00, 19:00; Sáb y vísperas 20:00; Dom y festivos 11:00» (una línea por tipo, temporada de hoy)."""
    from horarios_app import en_temporada
    vig = [c for c in cels if en_temporada(c.get("temporada"), md)
           and not ((c.get("temporada") or {}).get("nombre") in ("Semana Santa", "Navidad") and not (c.get("temporada") or {}).get("inicio"))]
    lineas = []
    for tipo, nom in TIPOS:
        grupos, libres = {}, []
        for c in (c for c in vig if c["tipo"] == tipo):
            if c.get("relativa_a_misa"):
                libres.append("antes de misa")
            elif c.get("a_peticion"):
                libres.append("a petición")
            elif c.get("inicio") and c.get("dias") and not c.get("semanas_mes"):
                grupos.setdefault(tuple(d for d in ORD if d in c["dias"]), set()).add(
                    hora(c["inicio"]) + (f"–{hora(c['fin'])}" if c.get("fin") else "") + idioma_txt(c))
        clave_h = lambda h: tuple(int(x) for x in re.findall(r"\d+", h)[:2])
        partes = [f"{dias_txt(k)} {', '.join(sorted(v, key=clave_h))}" for k, v in sorted(grupos.items(), key=lambda kv: [ORD.index(d) for d in kv[0]])]
        partes += sorted(set(libres))
        if partes:
            lineas.append(f"{nom}: " + "; ".join(partes))
    return "\n".join(lineas)


def _sin_acentos(s):
    return unicodedata.normalize("NFKD", s.replace("–", "-")).encode("ascii", "ignore").decode().lower()


DIA_PAL = {"lun": "lunes", "dl": "lunes", "dill": "lunes", "mar": "martes", "dt": "martes", "dim": "martes",
           "mie": "miercoles", "mier": "miercoles", "dc": "miercoles", "dime": "miercoles", "jue": "jueves", "dj": "jueves",
           "dij": "jueves", "vie": "viernes", "dv": "viernes", "div": "viernes", "sab": "sabado", "ds": "sabado",
           "diss": "sabado", "dom": "domingo", "dg": "domingo", "dium": "domingo"}
TIPO_PAL = {"misa": "misa", "misas": "misa", "missa": "misa", "misses": "misa", "confesion": "confesion",
            "confesiones": "confesion", "confessio": "confesion", "confessions": "confesion", "adoracion": "adoracion",
            "adoracio": "adoracion", "exposicion": "adoracion"}
HORA_RE = re.compile(r"(\d{1,2})(?:[:.h](\d{2}))?\s*h?(?:\s*[-–a]\s*(\d{1,2})(?:[:.h](\d{2}))?\s*h?)?")


def _dia(pal):
    p = _sin_acentos(pal).strip(".")
    if p.startswith(("festiv", "fest")):
        return "festivo_precepto"
    if p.startswith(("vispera", "vigil", "vespr")):
        return "vispera_festivo"
    for k in sorted(DIA_PAL, key=len, reverse=True):
        if p.startswith(k):
            return DIA_PAL[k]
    return None


def dias_de(txt):
    t = _sin_acentos(txt)
    if re.search(r"cada dia|todos los dias|diari", t):
        return ORD[:7] + [d for d in ("festivo_precepto",) if "festiv" in t]
    if re.search(r"laborables|feiners", t):
        base = ORD[:5]
    else:
        base = []
    out = list(base)
    m = re.search(r"([a-z.]+)(?:\s*-\s*|\s+a\s+)([a-z.]+)", t)
    if m and _dia(m.group(1)) in ORD[:7] and _dia(m.group(2)) in ORD[:7]:
        a, b = ORD.index(_dia(m.group(1))), ORD.index(_dia(m.group(2)))
        out += ORD[a:b + 1]
        t = t[:m.start()] + " " + t[m.end():]
    for pal in re.findall(r"[a-z.]+", t):
        d = _dia(pal)
        if d and d not in out and pal not in ("a", "y", "i", "de"):
            out.append(d)
    return [d for d in ORD if d in out]


def leer_horario(texto):
    """Texto de la columna D → (celebraciones, textos libres por tipo). Lo que no se entiende va como texto."""
    cels, libres = [], {}
    for linea in re.split(r"[\n\r]+", texto or ""):
        if not linea.strip():
            continue
        tipo = "misa"
        m = re.match(r"\s*([^\W\d_]+)\s*:\s*(.*)$", linea)
        if m and _sin_acentos(m.group(1)) in TIPO_PAL:
            tipo, linea = TIPO_PAL[_sin_acentos(m.group(1))], m.group(2)
        for grupo in re.split(r";", linea):
            grupo = grupo.strip()
            if not grupo:
                continue
            m = re.search(r"\d", grupo)
            dias = dias_de(grupo[:m.start()]) if m else []
            horas = [h for h in HORA_RE.finditer(grupo[m.start():])] if m else []
            if not dias or not horas:
                libres.setdefault(tipo, []).append(grupo[0].upper() + grupo[1:])
                continue
            resto = grupo[m.start():]
            for h in horas:
                ini = f"{int(h.group(1)):02d}:{h.group(2) or '00'}"
                fin = f"{int(h.group(3)):02d}:{h.group(4) or '00'}" if h.group(3) else None
                mi = re.match(r"\s*\(([^)]*)\)", resto[h.end():])
                idi = TXT_IDI.get(re.sub(r"\s+", "", _sin_acentos(mi.group(1))).strip(".")) if mi else None
                cels.append({"tipo": tipo, "dias": dias, "inicio": ini, "fin": fin, "idioma": idi})
    return cels, libres


# --- Hojas -----------------------------------------------------------------------------------------
def hoja_de(lug, distrito, n_muni):
    if lug["tipo"] in PARROQUIAS:
        if lug["municipio"] == "Barcelona":
            return f"BCN {distrito}" if distrito else "BCN sin distrito"
        return lug["municipio"] if n_muni.get(lug["municipio"], 0) >= MUNICIPIO_HOJA else "Otros municipios"
    return HOJA_TIPO.get(lug["tipo"], "Otros templos")


def web_por_defecto(lug):
    return ((lug.get("fuentes") or {}).get("F1") or {}).get("url") or lug.get("web") or ""


def leer(xlsx=XLSX):
    """{ID: {"web": B, "revisado": D, "tercera": E}} de todas las hojas del Excel de revisión (vacío si no existe).

    Las columnas se buscan por su cabecera. Un Excel antiguo sin «Tercera lectura» se lee igual (E vacía)."""
    if not pathlib.Path(xlsx).exists():
        return {}
    import openpyxl
    out = {}
    for ws in openpyxl.load_workbook(xlsx, data_only=True).worksheets:
        filas = ws.iter_rows(values_only=True)
        cab = [str(x or "").strip() for x in next(filas, [])]
        if "ID" not in cab:
            continue
        i_id, i_web, i_rev = cab.index("ID"), cab.index(CAB[1]) if CAB[1] in cab else 1, cab.index(CAB[3]) if CAB[3] in cab else 3
        i_ter = cab.index(CAB[4]) if CAB[4] in cab else None
        i_wcl = cab.index(CAB[11]) if CAB[11] in cab else None
        val = lambda f, j: str(f[j] or "").strip() if j is not None and len(f) > j else ""
        for f in filas:
            tid = f[i_id] if len(f) > i_id else None
            if tid:
                out[str(tid).strip()] = {"web": val(f, i_web), "revisado": val(f, i_rev), "tercera": val(f, i_ter),
                                         "web_claude": val(f, i_wcl)}
    return out


def webs_cambiadas(lugares, rev=None):
    """Webs que Guillem ha cambiado en la columna B: {ID: URL}. horarios.py las usa como F1."""
    rev = leer() if rev is None else rev
    return {l["id"]: rev[l["id"]]["web"] for l in lugares
            if l["id"] in rev and rev[l["id"]]["web"].startswith("http") and rev[l["id"]]["web"] != web_por_defecto(l)}


def fila(lug, t, rev, md):
    c = horario_txt(t.get("celebraciones") or [], md) if t.get("estado") in ("ok", "pendiente de verificar") else ""
    fuente = FUENTE.get(t.get("fuente"), "") if c else ""
    r = rev.get(lug["id"], {})
    return {"nombre": lug["nombre"], "web": r.get("web") or web_por_defecto(lug), "c": c, "d": r.get("revisado", ""), "e": r.get("tercera", ""),
            "web_cl": r.get("web_claude", ""),
            "fuente": fuente, "municipio": lug["municipio"], "id": lug["id"], **extra(lug["id"], HS)}


HS = None  # huellas.json, cargado una vez por generar()


def generar(xlsx=XLSX, fecha=None):
    import datetime as dt
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.formatting.rule import FormulaRule
    from openpyxl.worksheet.datavalidation import DataValidation
    from horarios_app import distrito_de
    md = (fecha or dt.date.today().isoformat())[5:]
    lugares = json.loads((H / "lugares.json").read_text("utf-8"))["lugares"]
    templos = json.loads((H / "horarios.json").read_text("utf-8"))["templos"]
    geo_js = (ROOT / "data" / "geo.js").read_text("utf-8")
    geo = json.loads(geo_js[geo_js.index("{"):geo_js.rindex("}") + 1])
    rev = leer(xlsx)
    global HS
    HS = huellas()
    n_muni = {}
    for l in lugares:
        if l["tipo"] in PARROQUIAS:
            n_muni[l["municipio"]] = n_muni.get(l["municipio"], 0) + 1
    hojas = {}
    for l in lugares:
        dist = distrito_de(l["lat"], l["lng"], geo) if l["tipo"] in PARROQUIAS and l["municipio"] == "Barcelona" and l.get("lat") else None
        hojas.setdefault(hoja_de(l, dist, n_muni), []).append(fila(l, templos.get(l["id"], {}), rev, md))
    tipos = list(dict.fromkeys(HOJA_TIPO.values())) + ["Otros templos"]
    orden = (sorted(h for h in hojas if h.startswith("BCN ")) + sorted((h for h in hojas if not h.startswith("BCN ") and h not in tipos and h != "Otros municipios"), key=_sin_acentos)
             + (["Otros municipios"] if "Otros municipios" in hojas else []) + [h for h in tipos if h in hojas])

    F = "Arial"
    thin = Side(style="thin", color="D9D9D9")
    wb = Workbook()
    ex = wb.active
    ex.title = "Cómo funciona"
    txt = [
        ("Horarios de misas, confesiones y adoración · revisión", True, None), ("", False, None),
        ("Una hoja por distrito de Barcelona y por municipio (parroquias); los municipios con menos de "
         f"{MUNICIPIO_HOJA} parroquias van juntos en «Otros municipios». Después, una hoja por tipo de templo. Dentro de cada hoja, por orden alfabético.", False, None),
        ("", False, None), ("Columnas", True, None),
        ("A · Nombre del templo.", False, None),
        ("B · Web de la parroquia o de su comunidad pastoral. Si la cambias, el programa leerá el horario de la web nueva el lunes siguiente.", False, None),
        ("C · Horario leído: lo rellena el programa cada lunes. Si la parroquia no tiene web propia (o no se puede leer), es el del Arzobispado. No lo toques.", False, None),
        ("D · Segunda lectura: la hace Claude, aparte, leyendo el texto de la fuente que descarga GitHub. Mismo formato que la columna C.", False, None),
        ("E · Tercera lectura: la hace Claude en otra sesión, a ciegas (sin mirar C ni D). Hace falta cuando D no coincide con C.", False, None),
        ("F · Fiabilidad: automática, no la toques. Cambia al momento cuando editas D, E o L, y la web pública muestra el mismo aviso.", False, None),
        ("G · De dónde sale la columna C: Web propia, Arzobispado u OpenStreetMap. H · Municipio. I · ID: código fijo del templo, no lo cambies.", False, None),
        ("J · Lectura automática 2 (C2): las mismas reglas sobre la página entera, descargada aparte. C solo cuenta si C = C2. No la toques.", False, None),
        ("K · Web, comprobación de GitHub: ok (en la web salen la calle o el nombre), no coincide, no responde, no existe. No la toques.", False, None),
        ("L · Web, comprobación de Claude: «Sí» si la web es de este templo, «No» si es de otro. Vacía = sin comprobar.", False, None),
        ("M · Fuente cambiada: «Sí» si el texto de la fuente ha cambiado desde que se hicieron D y E. Se quita cuando se repiten.", False, None),
        ("", False, None), ("Fiabilidad (columna F) y qué sale en la web pública", True, None),
        ("Verde · Fiable: web comprobada dos veces (K = ok y L = Sí; no hace falta si no hay web) y dos lecturas iguales: D = E, o C = D (o C = E) con C = C2.", False, VERDE),
        ("Amarillo · Sin verificar: falta algo de lo anterior (una sola lectura, falta la tercera, la web no se ha comprobado dos veces o la fuente ha cambiado). Se muestra con aviso de confirmarlo.", False, AMARILLO),
        ("Rojo · No coinciden / No fiable: hay varias lecturas y ninguna coincide, o la web de B es de otro templo. Se muestra con aviso claro.", False, ROJO),
        ("Gris · Sin horario: no hay ninguna lectura. No sale en la web pública.", False, GRIS),
        ("Ojo: la comparación es literal (no cuentan los espacios, los saltos de línea ni las mayúsculas). «Dom» y «Dom y festivos» son distintos.", False, None),
        ("", False, None), ("Formato del horario", True, None),
        ("Una línea por tipo: «Misas: …», «Confesiones: …», «Adoración: …». Grupos separados por punto y coma.", False, None),
        ("Días: Lun, Mar, Mié, Jue, Vie, Sáb, Dom; intervalos con guion (Lun–Vie); «Dom y festivos», «Sáb y vísperas», «Cada día». Horas en 24 h separadas por comas; un intervalo con guion (18:00–19:00).", False, None),
        ("Ejemplo: Misas: Lun–Vie 8:00, 19:00; Sáb y vísperas 20:00; Dom y festivos 11:00, 12:30", False, None),
        ("", False, None), ("Cómo se actualiza la web", True, None),
        ("Sube el Excel cambiado a GitHub (data/horarios/Horarios_revision.xlsx, con el mismo nombre) y la web se actualiza en unos minutos. "
         "Cada lunes: a las 4:30 GitHub lee las webs (C, C2, K, M); a las 7:00 Claude comprueba la web (L) y hace la segunda lectura (D) donde la fuente cambió; a las 9:00, en otra sesión, la tercera (E). Se conserva lo que haya en B, D, E y L.", False, None),
    ]
    for i, (t_, b, color) in enumerate(txt, 1):
        c = ex.cell(row=i, column=1, value=t_)
        c.font = Font(name=F, bold=b, size=14 if i == 1 else 11)
        c.alignment = Alignment(wrap_text=True, vertical="top")
        if color:
            c.fill = PatternFill("solid", fgColor=color)
    ex.column_dimensions["A"].width = 130

    resumen = []
    for nombre in orden:
        filas = sorted(hojas[nombre], key=lambda r: (_sin_acentos(r["municipio"]) if nombre == "Otros municipios" else "", _sin_acentos(r["nombre"])))
        ws = wb.create_sheet(nombre[:31])
        for j, h in enumerate(CAB, 1):
            c = ws.cell(row=1, column=j, value=h)
            c.font = Font(name=F, bold=True, color="FFFFFF")
            c.fill = PatternFill("solid", fgColor="7F3B3B")
            c.alignment = Alignment(wrap_text=True, vertical="center")
        for i, r in enumerate(filas, 2):
            vals = [r["nombre"], r["web"] or None, r["c"] or None, r["d"] or None, r["e"] or None, formula(i), r["fuente"] or None, r["municipio"], r["id"],
                    r["c2"] or None, r["web_gh"] if r["web"] else None, r["web_cl"] or None, "Sí" if r["cambiada"] else None]
            for j, v in enumerate(vals, 1):
                c = ws.cell(row=i, column=j, value=v)
                c.font = Font(name=F, color="999999") if j in (7, 8, 9, 10, 11, 13) else Font(name=F)
                c.alignment = Alignment(wrap_text=True, vertical="top")
                c.border = Border(bottom=thin)
            if r["web"].startswith("http"):
                ws.cell(row=i, column=2).hyperlink = r["web"]
                ws.cell(row=i, column=2).font = Font(name=F, color="0563C1", underline="single")
            ws.cell(row=i, column=3).fill = PatternFill("solid", fgColor="F5F5F5")
        last = len(filas) + 1
        for pref, color in {x[0].split(" · ")[0]: x[1] for x in ESTADOS.values()}.items():
            ws.conditional_formatting.add(f"F2:F{last}", FormulaRule(formula=[f'LEFT(F2,{len(pref)})="{pref}"'], fill=PatternFill("solid", fgColor=color)))
        for col, w in zip("ABCDEFGHIJKLM", (34, 34, 46, 46, 46, 30, 14, 16, 9, 46, 16, 16, 12)):
            ws.column_dimensions[col].width = w
        dv = DataValidation(type="list", formula1='"' + ",".join(WEB_CLAUDE) + '"', allow_blank=True)
        ws.add_data_validation(dv)
        dv.add(f"L2:L{last}")
        ws.freeze_panes = "B2"
        ws.auto_filter.ref = f"A1:M{last}"
        resumen.append((nombre, len(filas)))
    wb.active = 1
    wb.save(xlsx)
    print(f"{sum(n for _, n in resumen)} templos en {len(resumen)} hojas: " + ", ".join(f"{h} {n}" for h, n in resumen))


if __name__ == "__main__":
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
    if sys.argv[1:2] == ["generar"]:
        generar(sys.argv[2] if len(sys.argv) > 2 else XLSX)
    else:
        sys.exit(__doc__)
