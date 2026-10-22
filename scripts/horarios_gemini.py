"""Lee el texto de horarios de una web con Gemini y lo devuelve en el modelo de celebraciones.

Lo usa scripts/horarios.py cuando existe la variable GEMINI_API_KEY (un secreto del repositorio en
GitHub Actions). Gemini solo ordena lo que dice el texto: cada hora que devuelve se comprueba contra
el texto original y, si no aparece en él, se descarta. Sin clave, se usan solo las reglas de
horarios_texto.py.
"""
import json, os, re, time, urllib.error, urllib.request
from horarios_texto import DIAS, VISPERA, FESTIVO, norm

MODELO = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
URL = "https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent"
PAUSA = 7.0  # la capa gratuita admite unas 10 peticiones por minuto
_ultima = [0.0]

INSTRUCCIONES = """Eres un asistente que pasa a datos los horarios de una iglesia católica de la Archidiócesis de Barcelona.
Te doy el texto de su web (en catalán o castellano). Devuelve SOLO lo que dice el texto: no completes, no supongas
y no uses lo que sepas de esa iglesia. Si algo no está claro, no lo pongas y explícalo en "dudas".
{bloque}
Tipos: "misa", "confesion" (también reconciliació / penitència), "adoracion" (adoració, exposició del Santíssim,
hora santa, jueves eucarísticos). No incluyas rosario, vísperas sin exposición, despacho, catequesis, Càritas,
horario de apertura del templo ni actos de un solo día con fecha concreta (esos van en "avisos").
Días: lunes, martes, miercoles, jueves, viernes, sabado, domingo, vispera_festivo, festivo_precepto.
- feiners / laborables / dies laborables = lunes a viernes (o lunes a sábado si el sábado no aparece aparte).
- dissabtes i vigílies / sábados y vísperas = sabado + vispera_festivo; marca "vespertina_dominical" si es la misa
  de la tarde que vale por el domingo.
- diumenges i festius / domingos y festivos = domingo + festivo_precepto.
Horas en formato HH:MM de 24 h ("19h", "19.30", "19'30", "a les 7 de la tarda" = 19:00). "fin" solo en
confesiones y adoración. Idioma: "ca", "es", "bilingue", "otro" (con "idioma_detalle", p. ej. "italiano") o vacío
si el texto no lo dice. Si el idioma se indica con un símbolo o color que no ves, déjalo vacío.
Temporadas (curso, verano, agosto, Navidad, Semana Santa…) con fechas MM-DD si el texto las da.
"semanas_mes": [1] para «primer viernes», [-1] para «último domingo».
Confesiones «media hora antes de cada misa»: tipo confesion, sin hora, "minutos_antes_de_misa": 30.
Confesiones «a petición»: "a_peticion": true.
En "texto_original" copia literalmente el trozo del texto de donde sale cada celebración."""

ESQUEMA = {
    "type": "OBJECT",
    "properties": {
        "celebraciones": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {
            "tipo": {"type": "STRING", "enum": ["misa", "confesion", "adoracion"]},
            "dias": {"type": "ARRAY", "items": {"type": "STRING", "enum": DIAS + [VISPERA, FESTIVO]}},
            "inicio": {"type": "STRING", "nullable": True},
            "fin": {"type": "STRING", "nullable": True},
            "idioma": {"type": "STRING", "enum": ["ca", "es", "bilingue", "otro", ""]},
            "idioma_detalle": {"type": "STRING", "nullable": True},
            "temporada_nombre": {"type": "STRING", "nullable": True},
            "temporada_inicio": {"type": "STRING", "nullable": True},
            "temporada_fin": {"type": "STRING", "nullable": True},
            "semanas_mes": {"type": "ARRAY", "items": {"type": "INTEGER"}},
            "vespertina_dominical": {"type": "BOOLEAN"},
            "minutos_antes_de_misa": {"type": "INTEGER", "nullable": True},
            "a_peticion": {"type": "BOOLEAN"},
            "notas": {"type": "STRING", "nullable": True},
            "texto_original": {"type": "STRING"},
        }, "required": ["tipo", "dias", "texto_original"]}},
        "avisos": {"type": "ARRAY", "items": {"type": "STRING"}},
        "dudas": {"type": "ARRAY", "items": {"type": "STRING"}},
    },
    "required": ["celebraciones"],
}


def disponible():
    return bool(os.environ.get("GEMINI_API_KEY"))


def _pedir(cuerpo):
    espera = PAUSA - (time.time() - _ultima[0])
    if espera > 0:
        time.sleep(espera)
    req = urllib.request.Request(URL.format(m=MODELO), data=json.dumps(cuerpo).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
    for intento in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503) and intento < 2:
                time.sleep(30 * (intento + 1))
                continue
            raise RuntimeError(f"Gemini {e.code}: {e.read()[:200]!r}")
        finally:
            _ultima[0] = time.time()


def _horas_del_texto(texto):
    """Todas las horas que aparecen escritas en el texto, en HH:MM (para comprobar lo que devuelve Gemini)."""
    t = norm(texto)
    out = set()
    for m in re.finditer(r"(?<!\d)([01]?\d|2[0-3])(?:\s?[:.,'h]\s?([0-5]\d))?(?!\d)", t):
        h = int(m.group(1))
        mi = m.group(2) or "00"
        out.add(f"{h:02d}:{mi}")
        if h < 12:
            out.add(f"{h + 12:02d}:{mi}")  # "a les 7 de la tarda"
    return out


def extraer(texto, nombre=None):
    """Devuelve (celebraciones, dudosas, avisos) con el mismo formato que horarios_texto.extraer."""
    bloque = f"Si el texto habla de varias iglesias, quédate solo con «{nombre}»." if nombre else ""
    cuerpo = {
        "systemInstruction": {"parts": [{"text": INSTRUCCIONES.format(bloque=bloque)}]},
        "contents": [{"role": "user", "parts": [{"text": texto[:30000]}]}],
        "generationConfig": {"temperature": 0, "responseMimeType": "application/json", "responseSchema": ESQUEMA},
    }
    r = _pedir(cuerpo)
    try:
        datos = json.loads(r["candidates"][0]["content"]["parts"][0]["text"])
    except (KeyError, IndexError, ValueError) as e:
        raise RuntimeError(f"respuesta de Gemini sin datos: {e}")
    horas = _horas_del_texto(texto)
    cels, dudosas = [], list(datos.get("dudas") or [])
    orden = DIAS + [VISPERA, FESTIVO]
    for c in datos.get("celebraciones") or []:
        ini, fin = c.get("inicio") or None, c.get("fin") or None
        if any(h and (not re.fullmatch(r"\d{2}:\d{2}", h) or h not in horas) for h in (ini, fin)):
            dudosas.append(f"Gemini dio una hora que no está en el texto ({ini}): «{c.get('texto_original', '')[:120]}»")
            continue
        temp = None
        if c.get("temporada_nombre"):
            temp = {"nombre": c["temporada_nombre"], "inicio": c.get("temporada_inicio") or None, "fin": c.get("temporada_fin") or None}
        x = {"tipo": c["tipo"], "dias": sorted({d for d in c.get("dias") or [] if d in orden}, key=orden.index),
             "inicio": ini, "fin": fin if c["tipo"] != "misa" else None, "idioma": c.get("idioma") or None,
             "temporada": temp, "semanas_mes": [w for w in c.get("semanas_mes") or [] if w in (1, 2, 3, 4, 5, -1)],
             "notas": (c.get("texto_original") or "")[:200], "lectura": "gemini"}
        if c.get("idioma_detalle") and x["idioma"] == "otro":
            x["idioma_detalle"] = c["idioma_detalle"]
        if c.get("vespertina_dominical") and x["tipo"] == "misa":
            x["vespertina_dominical"] = True
        if c.get("minutos_antes_de_misa") and x["tipo"] == "confesion":
            x["relativa_a_misa"] = {"minutos_antes": c["minutos_antes_de_misa"]}
        if c.get("a_peticion"):
            x["a_peticion"] = True
        if not x["inicio"] and not x.get("relativa_a_misa") and not x.get("a_peticion"):
            dudosas.append(f"Sin hora: «{c.get('texto_original', '')[:120]}»")
            continue
        if x["inicio"] and not x["dias"]:
            dudosas.append(f"Sin días: «{c.get('texto_original', '')[:120]}»")
            continue
        cels.append(x)
    return cels, dudosas, list(datos.get("avisos") or [])
