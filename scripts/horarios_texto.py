"""Convierte el texto de un horario (catalán o castellano) en una lista de celebraciones.

Lo usa scripts/horarios.py para las webs de las parroquias (F1) y las fichas del Arzobispado (F3).
Es un extractor por reglas: solo guarda lo que reconoce con seguridad (día + hora) y devuelve
aparte las líneas con horas que no ha sabido interpretar, para revisarlas.

    from horarios_texto import extraer
    celebraciones, dudosas = extraer(texto)
"""
import re, unicodedata

DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
VISPERA, FESTIVO = "vispera_festivo", "festivo_precepto"
LAB5, LAB6, TODOS = DIAS[:5], DIAS[:6], DIAS[:]


def norm(s):
    """Minúsculas sin acentos, con los apóstrofos unificados."""
    s = unicodedata.normalize("NFKD", s.replace("’", "'").replace("´", "'").replace("`", "'"))
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


# --- Días -------------------------------------------------------------------------------------
D1 = {  # nombre (sin acentos, singular o plural) -> índice
    "dilluns": 0, "lunes": 0, "dimarts": 1, "martes": 1, "dimecres": 2, "miercoles": 2,
    "dijous": 3, "jueves": 3, "divendres": 4, "viernes": 4,
    "dissabte": 5, "dissabtes": 5, "sabado": 5, "sabados": 5,
    "diumenge": 6, "diumenges": 6, "domingo": 6, "domingos": 6,
}
DIA_RE = "|".join(sorted(D1, key=len, reverse=True))
ORD = {"primer": 1, "primera": 1, "1r": 1, "1er": 1, "segon": 2, "segona": 2, "segundo": 2, "segunda": 2,
       "2n": 2, "tercer": 3, "tercera": 3, "3r": 3, "quart": 4, "quarta": 4, "cuarto": 4, "cuarta": 4,
       "4t": 4, "ultim": -1, "ultima": -1, "ultimo": -1}
ORD_RE = "|".join(sorted(ORD, key=len, reverse=True))


def dias_de(t, laborables=LAB5):
    """Días que nombra un texto normalizado. Devuelve (días, semanas_mes, es_vigilia) o None."""
    dias, semanas, vig = [], [], False

    def add(*ds):
        for d in ds:
            if d not in dias:
                dias.append(d)

    s = t
    m = re.search(rf"\b({ORD_RE})s?\s+({DIA_RE})\b", s)
    if m:
        semanas.append(ORD[m.group(1)])
    for m in re.finditer(rf"\b(?:de|del|des de|desde)?\s*({DIA_RE})\s+(?:a|al|fins a|hasta|-|–)\s+({DIA_RE})\b", s):
        a, b = D1[m.group(1)], D1[m.group(2)]
        add(*DIAS[a:b + 1] if a <= b else DIAS[a:] + DIAS[:b + 1])
        s = s.replace(m.group(0), " ")
    if re.search(r"\b(cada dia|tots els dies|todos los dias|diariament|diariamente|diari[oa]s?)\b", s):
        add(*TODOS)
    if re.search(r"\b(dies feiners|feiners?|laborables?|dies laborables|dias laborables|entre setmana|entre semana)\b", s):
        add(*laborables)
    if re.search(r"\b(vigilie?s|vigilia|visperas? de|vispres de|vespertina|vigilies)\b", s) or \
            re.search(r"\bvisperas?\b(?!\s+(solemnes|cantadas))", s):
        add("sabado", VISPERA)
        vig = True
    if re.search(r"\b(festius|festiu|festivos?|festes|fiestas|dies de precepte|de precepto)\b", s):
        add(FESTIVO)
    for m in re.finditer(rf"\b({DIA_RE})\b", s):
        add(DIAS[D1[m.group(1)]])
    if re.search(r"\b(diumenges i festius|domingos y festivos|diumenges|domingos)\b", s) and FESTIVO not in dias \
            and re.search(r"festiu|festivo", s):
        add(FESTIVO)
    if not dias:
        return None
    if vig and "domingo" in dias and re.search(r"vigilia\s+de\s+(domingos?|diumenges?)", s):
        dias.remove("domingo")
        if FESTIVO in dias:
            dias.remove(FESTIVO)
    return dias, semanas, vig


# --- Horas ------------------------------------------------------------------------------------
HORA_RE = re.compile(
    r"(?<![\d/.,:])"
    r"(?P<h>[01]?\d|2[0-3])"
    r"(?:(?P<sep>[:.,'h]|\sh\s?)(?P<m>[0-5]\d))?"
    r"(?P<suf>\s*(?:h\b|hores\b|horas\b|hrs?\b|h\.))?"
    r"(?P<tarde>\s*(?:del mati|de la manana|de la tarda|de la tarde|de la nit|de la noche|del vespre|del migdia|del mediodia))?"
    r"(?![\d/])"
)
MESES = r"(gener|febrer|marc|abril|maig|juny|juliol|agost|setembre|octubre|novembre|desembre|enero|febrero|marzo|mayo|junio|julio|agosto|septiembre|setiembre|noviembre|diciembre)"


def horas_de(t):
    """Horas de un texto normalizado: lista de (inicio, fin|None, posición)."""
    toks = []
    for m in HORA_RE.finditer(t):
        h, mi = int(m.group("h")), m.group("m")
        after = t[m.end():m.end() + 14]
        before = t[max(0, m.start() - 12):m.start()]
        if re.match(rf"\s*(de |d')?{MESES}", after) or re.search(r"(dia|el|del|any|ano)\s$", before):
            continue  # es una fecha
        fuerte = bool(mi) or bool(m.group("suf")) or bool(m.group("tarde")) or re.search(r"(a les|a las|les|las)\s$", before)
        if m.group("sep") == "," and mi and not m.group("suf") and re.match(r"\d", t[m.end() - 2:m.end()]) is None:
            fuerte = False
        tarde = m.group("tarde") or ""
        if h < 12 and re.search(r"tarda|tarde|nit|noche|vespre", tarde):
            h += 12
        toks.append([h, int(mi or 0), m.start(), m.end(), bool(fuerte)])
    # Una lista "8, 10, 11 i 19 h": si una hora de la cadena es segura, todas lo son.
    for i in range(len(toks)):
        for j in (i - 1, i + 1):
            if 0 <= j < len(toks) and not toks[i][4] and toks[j][4]:
                a, b = sorted((i, j))
                if re.fullmatch(r"\s*(,|i|y|e|o|-|–|/|;|\||a|fins a|hasta)\s*(h\s*)?", t[toks[a][3]:toks[b][2]]):
                    toks[i][4] = True
        if not toks[i][4]:
            continue
    for _ in range(3):  # propaga por cadenas largas
        for i in range(len(toks)):
            for j in (i - 1, i + 1):
                if 0 <= j < len(toks) and not toks[i][4] and toks[j][4]:
                    a, b = sorted((i, j))
                    if re.fullmatch(r"\s*(,|i|y|e|o|-|–|/|;|\|)\s*", t[toks[a][3]:toks[b][2]]):
                        toks[i][4] = True
    toks = [x for x in toks if x[4]]
    out, i = [], 0
    while i < len(toks):
        h, mi, s, e, _ = toks[i]
        ini = f"{h:02d}:{mi:02d}"
        if i + 1 < len(toks) and re.fullmatch(r"\s*(h\s*)?(-|–|a|fins a|fins les|hasta|hasta las|a les|a las)\s*", t[e:toks[i + 1][2]]) \
                and (toks[i + 1][0], toks[i + 1][1]) > (h, mi):
            out.append((ini, f"{toks[i + 1][0]:02d}:{toks[i + 1][1]:02d}", s))
            i += 2
            continue
        out.append((ini, None, s))
        i += 1
    return out


# --- Idioma, tipo y temporada -------------------------------------------------------------------
IDIOMAS = [
    (r"bilingue|catala\s*(i|y|-|/)\s*castella|catalan\s*y\s*castellano", "bilingue", None),
    (r"\bcatala\b|\bcatalan\b|\(cat\.?\)|\bcat\.|en catala", "ca", None),
    (r"castella|castellano|espanol|\(cast\.?\)|\bcast\.|\(esp\.?\)", "es", None),
    (r"italia|italiano", "otro", "italiano"), (r"angles|ingles|english", "otro", "inglés"),
    (r"frances|francais", "otro", "francés"), (r"alemany|aleman|deutsch", "otro", "alemán"),
    (r"polones|polaco", "otro", "polaco"), (r"ucraines|ucraniano", "otro", "ucraniano"),
    (r"portugues", "otro", "portugués"), (r"llati|latin\b", "otro", "latín"),
    (r"tagal|filipi", "otro", "tagalo"), (r"xines|chino", "otro", "chino"),
    (r"romanes|rumano", "otro", "rumano"), (r"coreano|corea", "otro", "coreano"),
]


def idioma_de(t):
    for rx, cod, det in IDIOMAS:
        m = re.search(rx, t)
        if m:
            return cod, det, m.start()
    return None


RX_CONF = r"confessi|confesi|penitencia|reconciliaci|sagrament del perdo"
RX_ADOR = r"adoraci|exposici|santissim|santisimo|hora santa|jueves eucaristicos|dijous eucaristics|benedicci"
RX_MISA = r"\bmisses?\b|\bmisas?\b|eucaristi|celebraci"
RX_IGNORA = (r"despatx|despacho|secretaria|caritas|acollida|acogida|arxiu|archivo|catequesi|catequesis|obert|abierto"
             r"|obertura|apertura|horari del temple|horari de l'esglesia|horario del templo|visites|visitas|botiga|tienda"
             r"|rosari|rosario|vespres|visperas solemnes|visperas cantadas|telefon|telefono|tel\.|whatsapp|reunio|reunion"
             r"|grup|grupo|assaig|ensayo|coral|escolta|esplai|curs de|cursillo|bateig|bautizo|casament|boda|exequies"
             r"|funeral|tanatori|cafe|berenar|consell|consejo|xerrada|charla|concert|visita guiada")

TEMPORADAS = [  # (regex, nombre, inicio, fin)
    (r"setmana santa|semana santa|dijous sant|divendres sant|jueves santo|viernes santo|vetlla pasqual|vigilia pascual", "Semana Santa", None, None),
    (r"\bnadal\b|\bnavidad\b|nochebuena|cap d'any|\breis\b|\breyes\b", "Navidad", None, None),
    (r"\bagost\b|\bagosto\b", "Agosto", "08-01", "08-31"),
    (r"juliol i agost|julio y agosto|\bestiu\b|\bverano\b|\bvacances\b|\bvacaciones\b", "Verano", "07-01", "08-31"),
    (r"\bjuliol\b|\bjulio\b", "Julio", "07-01", "07-31"),
    (r"\bcurs\b|\bcurso\b|hivern|invierno|setembre a juny|septiembre a junio|octubre a juny|octubre a junio|resta de l'any|resto del ano|tot l'any|todo el ano", "Curso", "09-01", "06-30"),
]
MES_N = {"gener": 1, "enero": 1, "febrer": 2, "febrero": 2, "marc": 3, "marzo": 3, "abril": 4, "maig": 5, "mayo": 5,
         "juny": 6, "junio": 6, "juliol": 7, "julio": 7, "agost": 8, "agosto": 8, "setembre": 9, "septiembre": 9,
         "setiembre": 9, "octubre": 10, "novembre": 11, "noviembre": 11, "desembre": 12, "diciembre": 12}
FIN_MES = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def temporada_de(t):
    m = re.search(rf"(?:del?\s+(\d{{1,2}})\s+(?:de\s+|d')?)?{MESES}\s+(?:a|al|fins a|fins al|hasta|-|–)\s+(?:(?:el\s+)?(\d{{1,2}})\s+(?:de\s+|d')?)?{MESES}", t)
    if m:
        d1, m1, d2, m2 = m.group(1), MES_N[m.group(2)], m.group(3), MES_N[m.group(4)]
        ini, fin = f"{m1:02d}-{int(d1 or 1):02d}", f"{m2:02d}-{int(d2 or FIN_MES[m2 - 1]):02d}"
        nombre = "Verano" if m1 in (6, 7, 8) and m2 in (7, 8, 9) else "Curso" if m1 in (9, 10) and m2 in (5, 6, 7) else f"{m.group(2)}–{m.group(4)}"
        return {"nombre": nombre, "inicio": ini, "fin": fin}
    for rx, nombre, ini, fin in TEMPORADAS:
        if re.search(rx, t):
            return {"nombre": nombre, "inicio": ini, "fin": fin}
    return None


# --- Extracción ---------------------------------------------------------------------------------
def lineas(texto):
    for raw in re.split(r"\n+", texto):
        raw = re.sub(r"[ \t ]+", " ", raw).strip(" -–•*·|:")
        if raw:
            yield raw


def extraer(texto, tipo_inicial="misa"):
    """Devuelve (celebraciones, líneas_dudosas). Cada celebración es un dict del modelo de datos."""
    todo = norm(texto)
    hay_sabado = bool(re.search(r"\b(dissabtes?|sabados?|vigilies|visperas de)\b", todo))
    laborables = LAB5 if hay_sabado else LAB6
    out, dudosas = [], []
    tipo, temporada, dias_ctx, idioma_ctx, ignora = tipo_inicial, None, None, None, False
    for linea in lineas(texto):
        t = norm(linea)
        hs = horas_de(t)
        es_titulo = not hs
        # Cambios de contexto (títulos o frases sin hora)
        nuevo_tipo = "confesion" if re.search(RX_CONF, t) else "adoracion" if re.search(RX_ADOR, t) else \
            "misa" if re.search(RX_MISA, t) else None
        temp = temporada_de(t)
        if es_titulo:
            if re.search(RX_IGNORA, t) and not nuevo_tipo:
                ignora = True
                continue
            if nuevo_tipo or temp:
                ignora = False
            if nuevo_tipo:
                tipo, dias_ctx = nuevo_tipo, None
            if temp:
                temporada, dias_ctx = temp, None
            dd = dias_de(t, laborables)
            if dd:
                dias_ctx = dd
            idi = idioma_de(t)
            if idi and not dd and not nuevo_tipo:
                idioma_ctx = idi
            elif nuevo_tipo or temp:
                idioma_ctx = idi
            # Confesiones como regla relativa a la misa
            if (nuevo_tipo or tipo) == "confesion":
                rel = re.search(r"(mitja hora|media hora|30 minuts|30 minutos|15 minuts|15 minutos|una hora)\s+(abans|antes)|(abans|antes)\s+(de\s+)?(les|las|cada|la)?\s*(missa|misa|eucaristia|celebraci)", t)
                if rel:
                    mins = 30 if re.search(r"mitja|media|30", t) else 15 if "15" in t else 60 if "una hora" in t else None
                    c = celebracion("confesion", (dd or dias_ctx or (None, [], False)), None, None, idi, temporada, linea)
                    c["relativa_a_misa"] = {"minutos_antes": mins} if mins else {"antes": True}
                    if re.search(r"despres|despues", t):
                        c["relativa_a_misa"]["tambien_despues"] = True
                    out.append(c)
                elif re.search(r"(a peticio|a peticion|quan es demani|siempre que se pida|cita previa|demanar hora|concertar)", t):
                    c = celebracion("confesion", (dd or dias_ctx or (None, [], False)), None, None, idi, temporada, linea)
                    c["a_peticion"] = True
                    out.append(c)
            continue
        if ignora and not nuevo_tipo:
            continue
        if re.search(RX_IGNORA, t) and not nuevo_tipo:
            continue
        tipo_l = nuevo_tipo or tipo
        temporada_l = temp or temporada  # "Juliol i agost: 10 h" solo afecta a esa línea
        # Separa la línea en trozos "días: horas" (p. ej. "Feiners: 19 h. Diumenges: 11 i 13 h").
        trozos = re.split(r"(?<=\D)[.;](?=\s+[a-z])|\s\|\s|\s/\s(?=\D)", t)
        found = False
        for tr in trozos:
            hs = horas_de(tr)
            if not hs:
                dd = dias_de(tr, laborables)
                if dd:
                    dias_ctx = dd
                continue
            dd = dias_de(tr[:hs[0][2]] or tr, laborables) or dias_de(tr, laborables) or dias_ctx
            if not dd:
                dudosas.append(linea)
                continue
            idi_tr = idioma_de(tr)
            for k, (ini, fin, pos) in enumerate(hs):
                fin_seg = hs[k + 1][2] if k + 1 < len(hs) else len(tr)
                idi = idioma_de(tr[pos:fin_seg])
                if not idi and idi_tr and idi_tr[2] < hs[0][2]:
                    idi = idi_tr
                idi = idi or idioma_ctx
                if tipo_l == "misa":
                    fin = None
                c = celebracion(tipo_l, dd, ini, fin, idi, temporada_l, linea)
                if not c["dias"]:
                    continue
                out.append(c)
                found = True
        if not found and re.search(r"\d", t) and horas_de(t):
            dudosas.append(linea)
    # Quita duplicados exactos
    vistos, unicas = set(), []
    for c in out:
        k = (c["tipo"], tuple(c["dias"]), c["inicio"], c["fin"], c["idioma"], (c["temporada"] or {}).get("nombre"), tuple(c["semanas_mes"]))
        if k not in vistos:
            vistos.add(k)
            unicas.append(c)
    return unicas, dudosas


def celebracion(tipo, dd, ini, fin, idi, temporada, linea):
    dias, semanas, vig = dd
    c = {"tipo": tipo, "dias": list(dias or []), "inicio": ini, "fin": fin,
         "idioma": idi[0] if idi else None, "temporada": temporada, "semanas_mes": list(semanas or []),
         "notas": linea[:200]}
    if idi and idi[1]:
        c["idioma_detalle"] = idi[1]
    if vig and tipo == "misa":
        c["vespertina_dominical"] = True
    return c


if __name__ == "__main__":
    import json, sys
    cs, dud = extraer(sys.stdin.read())
    print(json.dumps({"celebraciones": cs, "dudosas": dud}, ensure_ascii=False, indent=1))
