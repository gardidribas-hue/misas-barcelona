"""Excel de revisión de horarios (data/horarios/Horarios_revision.xlsx).

Una hoja por distrito de Barcelona y por municipio (parroquias), y otra por tipo de templo. Columnas:
    A Nombre · B Web · C Horario leído (automático) · D Segunda lectura · E Tercera lectura · F Fiabilidad (fórmula)
    G Fuente de la columna C · H Municipio · I ID
C es el horario que lee el programa (web propia; si no hay, Arzobispado u OpenStreetMap). D es una segunda lectura de la
misma fuente, hecha aparte y comprobada. E es una tercera lectura, hecha a ciegas, cuando D no coincide con C.
Verde («Fiable») solo si hay doble verificación: dos lecturas que coinciden (C = D, D = E o C = E). F lo calcula con
fórmula y la web pública muestra el mismo aviso (horarios_app.py llama a estado()).
    python scripts/horarios_excel.py generar     reescribe el Excel con la columna C al día y conserva B, D y E
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
       "Tercera lectura", "Fiabilidad (automática)", "Fuente de la columna C", "Municipio", "ID"]

# Estados de la columna F: (texto que empieza la celda, color). La web usa el código. El color va por la primera palabra:
# «Fiable» verde, «Sin verificar» amarillo, «No coinciden» rojo, «Sin horario» gris.
VERDE, AMARILLO, ROJO, GRIS = "D9F2D9", "FFF2CC", "F4CCCC", "EDEDED"
ESTADOS = {
    "sin_horario": ("Sin horario · no sale en la web", GRIS),
    "fiable": ("Fiable · la lectura automática (C) y la segunda lectura (D) coinciden", VERDE),
    "fiable_de": ("Fiable · la segunda (D) y la tercera lectura (E) coinciden; se muestra D", VERDE),
    "fiable_ce": ("Fiable · la lectura automática (C) y la tercera lectura (E) coinciden", VERDE),
    "sin_revisar": ("Sin verificar · solo hay la lectura automática de su web", AMARILLO),
    "sin_revisar_otra": ("Sin verificar · solo hay la lectura automática, y no es de la web de la parroquia", AMARILLO),
    "sin_web": ("Sin verificar · no tiene web y solo hay una lectura", AMARILLO),
    "sin_lectura": ("Sin verificar · su web no se ha podido leer y solo hay una lectura", AMARILLO),
    "pendiente": ("Sin verificar · la segunda lectura (D) cambia el horario y falta la tercera (E); se muestra D", AMARILLO),
    "no_coinciden": ("No coinciden · ninguna lectura coincide con otra; se muestra D, confírmalo", ROJO),
}
COLOR_WEB = {VERDE: "verde", AMARILLO: "amarillo", ROJO: "rojo", GRIS: None}


def igual(a, b):
    """La misma comparación que la fórmula de la columna F: sin espacios ni saltos de línea, sin mayúsculas, – = -."""
    f = lambda s: re.sub(r"[ \n\r]", "", (s or "")).replace("–", "-").lower()
    return f(a) == f(b)


def estado(c, d, e="", fuente="", web=""):
    """Código del estado y qué lectura se muestra en la web: "C", "D", "E" o None.

    Verde solo con doble verificación (dos lecturas iguales). Con una sola lectura, o si D cambia C y aún no hay E:
    amarillo. Si hay varias lecturas y ninguna coincide con otra: rojo."""
    c, d, e = (c or "").strip(), (d or "").strip(), (e or "").strip()
    if not (c or d or e):
        return "sin_horario", None
    if c and d and igual(c, d):
        return "fiable", "C"
    if d and e and igual(d, e):
        return "fiable_de", "D"
    if c and e and igual(c, e):
        return "fiable_ce", "C"
    if sum(map(bool, (c, d, e))) >= 2:
        return ("pendiente" if not e else "no_coinciden"), ("D" if d else "E")
    if c:
        return ("sin_revisar" if fuente == FUENTE["F1"] else "sin_revisar_otra"), "C"
    return ("sin_lectura" if (web or "").strip() else "sin_web"), ("D" if d else "E")


def formula(i):
    n = lambda col: f'LOWER(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE({col}{i}," ",""),CHAR(10),""),CHAR(13),""),"–","-"))'
    v = lambda col: f'TRIM({col}{i})<>""'
    e = {k: f'"{x[0]}"' for k, x in ESTADOS.items()}
    web = f'G{i}="{FUENTE["F1"]}"'
    return (f'=IF(AND(TRIM(C{i})="",TRIM(D{i})="",TRIM(E{i})=""),{e["sin_horario"]},'
            f'IF(AND({v("C")},{v("D")},{n("C")}={n("D")}),{e["fiable"]},'
            f'IF(AND({v("D")},{v("E")},{n("D")}={n("E")}),{e["fiable_de"]},'
            f'IF(AND({v("C")},{v("E")},{n("C")}={n("E")}),{e["fiable_ce"]},'
            f'IF(({v("C")})+({v("D")})+({v("E")})>=2,IF(TRIM(E{i})="",{e["pendiente"]},{e["no_coinciden"]}),'
            f'IF({v("C")},IF({web},{e["sin_revisar"]},{e["sin_revisar_otra"]}),'
            f'IF(TRIM(B{i})="",{e["sin_web"]},{e["sin_lectura"]})))))))')


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
                grupos.setdefault(tuple(d for d in ORD if d in c["dias"]), set()).add(hora(c["inicio"]) + (f"–{hora(c['fin'])}" if c.get("fin") else ""))
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
            for h in horas:
                ini = f"{int(h.group(1)):02d}:{h.group(2) or '00'}"
                fin = f"{int(h.group(3)):02d}:{h.group(4) or '00'}" if h.group(3) else None
                cels.append({"tipo": tipo, "dias": dias, "inicio": ini, "fin": fin})
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
        val = lambda f, j: str(f[j] or "").strip() if j is not None and len(f) > j else ""
        for f in filas:
            tid = f[i_id] if len(f) > i_id else None
            if tid:
                out[str(tid).strip()] = {"web": val(f, i_web), "revisado": val(f, i_rev), "tercera": val(f, i_ter)}
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
            "fuente": fuente, "municipio": lug["municipio"], "id": lug["id"]}


def generar(xlsx=XLSX, fecha=None):
    import datetime as dt
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.formatting.rule import FormulaRule
    from horarios_app import distrito_de
    md = (fecha or dt.date.today().isoformat())[5:]
    lugares = json.loads((H / "lugares.json").read_text("utf-8"))["lugares"]
    templos = json.loads((H / "horarios.json").read_text("utf-8"))["templos"]
    geo_js = (ROOT / "data" / "geo.js").read_text("utf-8")
    geo = json.loads(geo_js[geo_js.index("{"):geo_js.rindex("}") + 1])
    rev = leer(xlsx)
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
        ("D · Segunda lectura: otra lectura de la misma fuente, hecha aparte y comprobada. Va con el mismo formato que la columna C (lo más fácil es copiar C y corregir).", False, None),
        ("E · Tercera lectura: solo hace falta si D no coincide con C. Se hace a ciegas (sin mirar C ni D) y sirve para desempatar.", False, None),
        ("F · Fiabilidad: automática, no la toques. Cambia al momento cuando editas D o E, y la web pública muestra el mismo aviso.", False, None),
        ("G · De dónde sale la columna C: Web propia, Arzobispado u OpenStreetMap. H · Municipio. I · ID: código fijo del templo, no lo cambies.", False, None),
        ("", False, None), ("Fiabilidad (columna F) y qué sale en la web pública", True, None),
        ("Verde · Fiable: hay doble verificación, es decir, dos lecturas que dicen exactamente lo mismo: C = D, o D = E (si la segunda lectura cambió el horario, la tercera lo confirma), o C = E.", False, VERDE),
        ("Amarillo · Sin verificar: solo hay una lectura (sin web, web que no se puede leer, o aún sin segunda lectura), o la segunda lectura cambió el horario y falta la tercera. Se muestra con aviso de confirmarlo.", False, AMARILLO),
        ("Rojo · No coinciden: hay dos o tres lecturas y ninguna coincide con otra. Se muestra la segunda lectura (D), con aviso claro de confirmarlo con la parroquia.", False, ROJO),
        ("Gris · Sin horario: no hay ninguna lectura. No sale en la web pública.", False, GRIS),
        ("Ojo: la comparación es literal (no cuentan los espacios, los saltos de línea ni las mayúsculas). «Dom» y «Dom y festivos» son distintos.", False, None),
        ("", False, None), ("Formato del horario", True, None),
        ("Una línea por tipo: «Misas: …», «Confesiones: …», «Adoración: …». Grupos separados por punto y coma.", False, None),
        ("Días: Lun, Mar, Mié, Jue, Vie, Sáb, Dom; intervalos con guion (Lun–Vie); «Dom y festivos», «Sáb y vísperas», «Cada día». Horas en 24 h separadas por comas; un intervalo con guion (18:00–19:00).", False, None),
        ("Ejemplo: Misas: Lun–Vie 8:00, 19:00; Sáb y vísperas 20:00; Dom y festivos 11:00, 12:30", False, None),
        ("", False, None), ("Cómo se actualiza la web", True, None),
        ("Sube el Excel cambiado a GitHub (data/horarios/Horarios_revision.xlsx, con el mismo nombre) y la web se actualiza en unos minutos. "
         "Cada lunes el programa vuelve a leer las webs, reescribe la columna C y conserva lo que haya en B, D y E.", False, None),
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
            vals = [r["nombre"], r["web"] or None, r["c"] or None, r["d"] or None, r["e"] or None, formula(i), r["fuente"] or None, r["municipio"], r["id"]]
            for j, v in enumerate(vals, 1):
                c = ws.cell(row=i, column=j, value=v)
                c.font = Font(name=F, color="999999") if j in (7, 8, 9) else Font(name=F)
                c.alignment = Alignment(wrap_text=True, vertical="top")
                c.border = Border(bottom=thin)
            if r["web"].startswith("http"):
                ws.cell(row=i, column=2).hyperlink = r["web"]
                ws.cell(row=i, column=2).font = Font(name=F, color="0563C1", underline="single")
            ws.cell(row=i, column=3).fill = PatternFill("solid", fgColor="F5F5F5")
        last = len(filas) + 1
        for pref, color in {x[0].split(" · ")[0]: x[1] for x in ESTADOS.values()}.items():
            ws.conditional_formatting.add(f"F2:F{last}", FormulaRule(formula=[f'LEFT(F2,{len(pref)})="{pref}"'], fill=PatternFill("solid", fgColor=color)))
        for col, w in zip("ABCDEFGHI", (34, 34, 46, 46, 46, 30, 14, 16, 9)):
            ws.column_dimensions[col].width = w
        ws.freeze_panes = "B2"
        ws.auto_filter.ref = f"A1:I{last}"
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
