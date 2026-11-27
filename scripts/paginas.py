"""Genera una página sencilla por parroquia (p/<id>.html), el índice p/index.html, sitemap.xml y robots.txt.

Para qué: que Google encuentre cada parroquia («horario misa Santa Maria del Mar») y lleve a la web.
Cada página tiene la dirección, los horarios, el enlace «Cómo llegar», datos estructurados (schema.org)
y un botón para abrir la ficha en la web completa. No necesita JavaScript.

Se ejecuta sola en las acciones «horarios» y «revision» (después de horarios_app.py) y se puede lanzar a mano:
    python3 scripts/paginas.py
Si la web cambia de dirección (dominio propio), cambia SITIO aquí y en index.html (og:url, og:image).
"""
import html
import json
import os
import re
import shutil
from urllib.parse import quote
from datetime import date

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITIO = os.environ.get("MISAS_SITIO", "https://misasbarcelona.github.io/")

DIAS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
NOMBRE = {"mon": "Lunes", "tue": "Martes", "wed": "Miércoles", "thu": "Jueves", "fri": "Viernes", "sat": "Sábado", "sun": "Domingo"}
CORTO = {"mon": "Lun", "tue": "Mar", "wed": "Mié", "thu": "Jue", "fri": "Vie", "sat": "Sáb", "sun": "Dom"}
IDIOMA = {"ca": "cat", "es": "cast", "ca-es": "cat/cast", "en": "en", "fr": "fr", "de": "de", "it": "it", "pl": "pl", "other": "otro"}
FUENTE = {"REV": "revisión a mano", "F1": "web de la parroquia", "F3": "Arzobispado de Barcelona", "OSM": "OpenStreetMap"}
e = html.escape


VERIFICADO = None  # meta.verificado de horarios_app.js: última lectura semanal completa de las fuentes
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def fecha_larga(d):
    return f"{int(d[8:10])} de {MESES[int(d[5:7]) - 1]} de {d[:4]}"


def cargar():
    """Las parroquias tal y como las ve la web (lo mismo que hace horarios.js en el navegador)."""
    with open(os.path.join(RAIZ, "data/parroquias.json"), encoding="utf-8") as f:
        parroquias = json.load(f)["parroquias"]
    with open(os.path.join(RAIZ, "data/horarios/horarios_app.js"), encoding="utf-8") as f:
        txt = f.read()
    H = json.loads(txt[txt.index("=") + 1:].strip().rstrip(";"))
    por_id = {p["id"]: p for p in parroquias}
    campos = ["masses", "confessions", "adoration", "masses_text", "confessions_text", "adoration_text"]
    for t in H["templos"].values():
        h = t.get("horario") or {}
        if h.get("oculto") or h.get("estado") == "sin horario":
            continue
        p = por_id.get(t.get("parroquia_id") or "")
        if not p:
            p = {"id": t["bcn_id"], "name": t["name"], "address": t.get("address", ""), "municipio": t.get("municipio", ""),
                 "distrito": t.get("distrito") or "", "lat": t.get("lat"), "lng": t.get("lng"), "web": t.get("web") or ""}
            parroquias.append(p)
            por_id[p["id"]] = p
        for c in campos:
            p[c] = t.get(c)
        p["horario"] = h
    return parroquias, H.get("meta", {})


def horario(evs):
    """Agrupa los días con las mismas horas: «Lun–Vie: 08:00 · 19:00»."""
    if not evs:
        return ""
    por_dia = {d: {} for d in DIAS + ["hol"]}
    for ev in evs:
        for d in ev.get("days", []):
            if d in por_dia:
                por_dia[d].setdefault((ev["start"], ev.get("end") or "", ev.get("lang") or ""), ev)
    firma = lambda d: sorted(por_dia[d])
    grupos = []
    for d in DIAS:
        if not por_dia[d]:
            continue
        if grupos and firma(grupos[-1]["dias"][-1]) == firma(d) and DIAS.index(grupos[-1]["dias"][-1]) == DIAS.index(d) - 1:
            grupos[-1]["dias"].append(d)
        else:
            grupos.append({"dias": [d], "fest": False})
    if por_dia["hol"]:
        dom = next((g for g in grupos if "sun" in g["dias"]), None)
        if dom and firma("sun") == firma("hol"):
            dom["fest"] = True
        else:
            grupos.append({"dias": ["hol"], "fest": False})

    def etiqueta(g):
        d = g["dias"]
        if d[0] == "hol":
            return "Festivos"
        if len(d) == 7:
            l = "Cada día"
        elif d == DIAS[:5]:
            l = "Lun–Vie"
        elif d == DIAS[:6]:
            l = "Lun–Sáb"
        elif len(d) == 1:
            l = NOMBRE[d[0]]
        else:
            l = CORTO[d[0]] + "–" + CORTO[d[-1]]
        return l + (" y festivos" if g["fest"] else "")

    filas = []
    for g in grupos:
        horas = sorted(por_dia[g["dias"][0]].values(), key=lambda ev: ev["start"])
        span = lambda ev: (f'<span class="t">{e(ev["start"])}{"–" + e(ev["end"]) if ev.get("end") else ""}'
                           f'{"<small>" + e(IDIOMA.get(ev.get("lang"), ev.get("lang"))) + "</small>" if ev.get("lang") else ""}</span>')
        filas.append(f"<dt>{e(etiqueta(g))}</dt><dd>{''.join(span(ev) for ev in horas)}</dd>")
    return '<dl class="sched">' + "".join(filas) + "</dl>"


def slug_ok(s):
    return re.fullmatch(r"[A-Za-z0-9-]+", s or "") is not None


CSS = """
:root{--bg:#fff;--surface:#f5f1f0;--ink:#2c2325;--muted:#75676a;--line:#ebe3e2;--accent:#ec5a5f;--accent-strong:#c8323a;--accent-soft:#ffe2e1;--ui:"Manrope",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--display:"Newsreader",Georgia,serif;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--bg:#1d1819;--surface:#2a2324;--ink:#f4ebe9;--muted:#ab9c9e;--line:#362e30;--accent:#f0a6a2;--accent-strong:#f5b9b5;--accent-soft:#3d2729}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 var(--ui)}
main{max-width:720px;margin:0 auto;padding:24px 16px 56px}a{color:var(--accent-strong)}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:28px}
.brand{font:600 1.35rem/1 var(--display);color:var(--ink);text-decoration:none}.brand em{color:var(--accent-strong)}
.eyebrow{margin:0 0 6px;color:var(--muted);font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
h1{font:500 clamp(1.9rem,6vw,2.6rem)/1.1 var(--display);margin:0 0 10px}h2{font:600 1.25rem/1.2 var(--display);margin:30px 0 10px}
.addr{color:var(--muted);margin:0 0 18px}.btns{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}
.btn{display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border-radius:999px;background:var(--surface);color:var(--ink);font-weight:700;text-decoration:none}
.btn.main{background:var(--accent);color:#fff}@media (prefers-color-scheme:dark){.btn.main{color:#3a1518}}
.sched{display:grid;grid-template-columns:max-content 1fr;gap:8px 18px;margin:0;padding:16px 18px;background:var(--surface);border-radius:18px}
.sched dt{font-weight:800}.sched dd{margin:0;display:flex;flex-wrap:wrap;align-items:flex-start;align-content:flex-start;gap:6px 12px}.t small{margin-left:3px;color:var(--muted);font-size:.75em}
.note{color:var(--muted);font-size:.9rem}.foot{margin-top:40px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted);font-size:.85rem}
h2.hfix{display:flex;justify-content:space-between;align-items:baseline;gap:12px}h2.hfix .fix{font:700 .85rem/1.2 system-ui,sans-serif;text-decoration:none;padding:8px 0}
ul.idx{list-style:none;padding:0;columns:2 260px;column-gap:24px}ul.idx li{break-inside:avoid;padding:3px 0}
"""


def cabecera(titulo, desc, url, extra=""):
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(titulo)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Misas Barcelona">
<meta property="og:title" content="{e(titulo)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(SITIO)}icons/og.png">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="../icons/s1a/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../fonts/fonts.css">
<style>{CSS}</style>
{extra}</head>
<body>
<main>
<div class="top"><a class="brand" href="../">Misas <em>Barcelona</em></a><a class="btn" href="index.html">Todas las parroquias</a></div>
"""


PIE = """<p class="foot">Misas Barcelona es una web independiente y gratuita, no oficial de la Archidiócesis de Barcelona.
Los horarios pueden cambiar en festivos, en verano y en Navidad o Semana Santa: si vas justo, confírmalo con la parroquia.
<a href="../legal.html">Aviso legal</a> · <a href="../legal.html#privacidad">Privacidad</a></p>
</main>
</body>
</html>
"""


def config_avisos():
    """Formulario de avisos y correo de contacto, leídos de config.js (lo mismo que usa la web)."""
    with open(os.path.join(RAIZ, "config.js"), encoding="utf-8") as f:
        txt = f.read()
    def campo(bloque, k):
        m = re.search(bloque + r"\s*:\s*\{([^}]*)\}", txt)
        v = re.search(k + r'\s*:\s*"([^"]*)"', m.group(1)) if m else None
        return v.group(1) if v else ""
    return {"url": campo("avisos", "url"), "campo": campo("avisos", "campoParroquia"), "correo": campo("contacto", "correo")}


AVISOS = None


def aviso_url(p):
    """«¿Horario mal? Avísanos»: el formulario con la parroquia ya elegida o, si no hay formulario, un correo."""
    a = AVISOS or {}
    etiqueta = f"{p['name']} · {p['municipio']}" if p.get("municipio") else p["name"]
    if a.get("url"):
        if not a.get("campo"):
            return a["url"]
        return f"{a['url']}?usp=pp_url&{a['campo']}={quote(etiqueta)}"
    if a.get("correo"):
        return f"mailto:{a['correo']}?subject={quote('Horario mal: ' + etiqueta)}"
    return ""


def pagina(p, hoy):
    url = f"{SITIO}p/{p['id']}.html"
    zona = " · ".join(x for x in [p.get("distrito"), p.get("municipio")] if x)
    misas = horario(p.get("masses") or [])
    desc = f"Horarios de misa, confesión y adoración en {p['name']} ({p.get('municipio') or 'Barcelona'}). Dirección, cómo llegar y avisos."
    ld = {"@context": "https://schema.org", "@type": "Church", "name": p["name"], "url": url,
          "address": {"@type": "PostalAddress", "streetAddress": p.get("address") or "", "addressLocality": p.get("municipio") or "",
                      "postalCode": p.get("postal_code") or "", "addressCountry": "ES"}}
    if p.get("lat") not in (None, ""):
        ld["geo"] = {"@type": "GeoCoordinates", "latitude": float(p["lat"]), "longitude": float(p["lng"])}
    if p.get("phone"):
        ld["telephone"] = p["phone"]
    if p.get("web"):
        ld["sameAs"] = [p["web"]]
    extra = '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace("</", "<\\/") + "</script>\n"
    destino = f"{p['lat']},{p['lng']}" if p.get("lat") not in (None, "") else f"{p['name']}, {p.get('address', '')}, {p.get('municipio', '')}"
    llegar = "https://www.google.com/maps/dir/?api=1&destination=" + html.escape(re.sub(r"\s+", "+", destino))
    out = [cabecera(f"{p['name']}: horario de misas | Misas Barcelona", desc, url, extra)]
    out.append(f'<p class="eyebrow">{e(zona)}</p>\n<h1>{e(p["name"])}</h1>\n<p class="addr">{e(p.get("address") or "")}</p>')
    out.append('<div class="btns">'
               f'<a class="btn main" href="../#parroquia/{e(p["id"])}">Abrir en el mapa</a>'
               f'<a class="btn" href="{llegar}" rel="noopener">Cómo llegar</a>'
               + (f'<a class="btn" href="tel:{e(re.sub(r"[^0-9+]", "", p["phone"]))}">Llamar</a>' if p.get("phone") else "")
               + (f'<a class="btn" href="{e(p["web"])}" rel="noopener">Web</a>' if p.get("web") else "") + "</div>")
    fix = aviso_url(p)
    titulo = '<h2 class="hfix">Misas' + (f'<a class="fix" href="{e(fix)}" rel="noopener">¿Horario mal? Avísanos</a>' if fix else "") + "</h2>"
    out.append(titulo + (misas or f'<p class="note">{e(p.get("masses_text") or "Esta parroquia no publica horario de misas.")}</p>'))
    conf = horario(p.get("confessions") or [])
    if conf or p.get("confessions_text"):
        out.append("<h2>Confesiones</h2>" + (conf or f'<p class="note">{e(p["confessions_text"])}</p>'))
    ador = horario(p.get("adoration") or [])
    if ador or p.get("adoration_text"):
        out.append("<h2>Adoración eucarística</h2>" + (ador or f'<p class="note">{e(p["adoration_text"])}</p>'))
    h = p.get("horario") or {}
    if h.get("fuente"):
        cuando = f", comprobado el {h['comprobado']}" if h.get("comprobado") else ""
        out.append(f'<p class="note">Fuente del horario: {e(FUENTE.get(h["fuente"], h["fuente"]))}{e(cuando)}.</p>')
    if VERIFICADO:
        out.append(f'<p class="note">Última verificación de los datos: {e(fecha_larga(VERIFICADO))}.</p>')
    for o in h.get("otras_temporadas") or []:
        out.append(f'<p class="note"><strong>{e(o.get("nombre", ""))}:</strong> {e(o.get("texto", ""))}</p>')
    out.append(PIE)
    return "\n".join(out)


def lista_avisos(parroquias):
    """data/avisos-parroquias.json: la lista del formulario de avisos («Nombre · Municipio», por orden alfabético).
    El formulario de Google la vuelve a leer cada semana, así que las parroquias nuevas salen solas."""
    import unicodedata
    def clave(t):
        return unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().casefold()
    lista = sorted(({"parroquia": f"{p['name']} · {p['municipio']}" if p.get("municipio") else p["name"], "id": p["id"]}
                    for p in parroquias), key=lambda x: clave(x["parroquia"]))
    with open(os.path.join(RAIZ, "data/avisos-parroquias.json"), "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=0)


def main():
    parroquias, meta = cargar()
    global VERIFICADO, AVISOS
    AVISOS = config_avisos()
    lista_avisos(parroquias)
    VERIFICADO = meta.get("verificado")
    hoy = date.today().isoformat()
    destino = os.path.join(RAIZ, "p")
    shutil.rmtree(destino, ignore_errors=True)
    os.makedirs(destino)
    hechas = []
    for p in parroquias:
        if not slug_ok(p.get("id")) or not (p.get("masses") or p.get("masses_text")):
            continue
        with open(os.path.join(destino, p["id"] + ".html"), "w", encoding="utf-8") as f:
            f.write(pagina(p, hoy))
        hechas.append(p)
    # Índice por municipio (y por distrito en Barcelona)
    grupos = {}
    for p in hechas:
        g = p.get("municipio") or "Otros"
        if g == "Barcelona" and p.get("distrito"):
            g = f"Barcelona · {p['distrito']}"
        grupos.setdefault(g, []).append(p)
    out = [cabecera("Todas las parroquias: horarios de misa | Misas Barcelona",
                    f"Horarios de misa de las {len(hechas)} parroquias e iglesias de la Archidiócesis de Barcelona, por municipio y distrito.",
                    f"{SITIO}p/")]
    out.append(f'<p class="eyebrow">Archidiócesis de Barcelona · {len(hechas)} templos</p>\n<h1>Todas las parroquias</h1>')
    out.append('<p class="addr">Para buscar por hora o cerca de ti, usa <a href="../">el mapa y el chat</a>.</p>')
    for g in sorted(grupos, key=lambda s: (not s.startswith("Barcelona"), s)):
        items = "".join(f'<li><a href="{e(p["id"])}.html">{e(p["name"])}</a></li>' for p in sorted(grupos[g], key=lambda p: p["name"]))
        out.append(f"<h2>{e(g)}</h2><ul class=\"idx\">{items}</ul>")
    out.append(PIE)
    with open(os.path.join(destino, "index.html"), "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    urls = [SITIO, SITIO + "p/"] + [f"{SITIO}p/{p['id']}.html" for p in hechas]
    with open(os.path.join(RAIZ, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for u in urls:
            f.write(f"  <url><loc>{e(u)}</loc><lastmod>{meta.get('generado') or hoy}</lastmod></url>\n")
        f.write("</urlset>\n")
    with open(os.path.join(RAIZ, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(f"User-agent: *\nAllow: /\n\nSitemap: {SITIO}sitemap.xml\n")
    print(f"{len(hechas)} páginas de parroquia en p/, sitemap.xml y robots.txt")


if __name__ == "__main__":
    main()
