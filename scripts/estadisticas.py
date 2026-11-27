"""Guarda en data/estadisticas/goatcounter.json los totales de GoatCounter para el panel del proyecto.

Lo lanza la acción «estadisticas» cada día. Necesita el secreto GOATCOUNTER_TOKEN (clave «panel», solo lectura).
Solo guarda totales agregados (visitas, páginas, clics, navegadores...), nunca datos de personas.
"""
import datetime as dt
import json
import os
import urllib.parse
import urllib.request

SITIO = os.environ.get("GOATCOUNTER_SITE", "misasbarcelona")
TOKEN = os.environ["GOATCOUNTER_TOKEN"]
API = f"https://{SITIO}.goatcounter.com/api/v0"
HOY = dt.date.today()
DESDE_DIAS = (HOY - dt.timedelta(days=84)).isoformat()   # 12 semanas para la tendencia
DESDE_LISTAS = (HOY - dt.timedelta(days=28)).isoformat()  # 4 semanas para los rankings
HASTA = HOY.isoformat()


def get(ruta, **q):
    url = f"{API}/{ruta}?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def seguro(f):
    try:
        return f()
    except Exception as e:  # una sección que falla no tumba las demás
        return {"error": str(e)[:200]}


out = {"generado": dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"), "sitio": SITIO,
       "periodo_dias": [DESDE_DIAS, HASTA], "periodo_listas": [DESDE_LISTAS, HASTA]}

# Visitas por día (12 semanas)
t = seguro(lambda: get("stats/total", start=DESDE_DIAS, end=HASTA))
out["por_dia"] = [{"dia": s.get("day"), "visitas": s.get("daily", 0)} for s in t.get("stats", [])] if "error" not in t else t
out["total_12_semanas"] = t.get("total") if "error" not in t else None

# Páginas y eventos más vistos (4 semanas): las fichas p/ y los clics «como-llegar», «avisar-error»...
h = seguro(lambda: get("stats/hits", start=DESDE_LISTAS, end=HASTA, limit=100))
if "error" in h:
    out["paginas"] = out["eventos"] = h
else:
    filas = [{"ruta": x.get("path"), "titulo": x.get("title") or "", "visitas": x.get("count", 0)} for x in h.get("hits", []) if not x.get("event")]
    ev = [{"evento": x.get("path"), "clics": x.get("count", 0)} for x in h.get("hits", []) if x.get("event")]
    out["paginas"] = sorted(filas, key=lambda r: -r["visitas"])[:50]
    out["eventos"] = sorted(ev, key=lambda r: -r["clics"])

# Origen, navegador, sistema, tamaño de pantalla, zona e idioma (4 semanas)
for clave, pagina in [("origen", "toprefs"), ("navegadores", "browsers"), ("sistemas", "systems"),
                      ("pantallas", "sizes"), ("zonas", "locations"), ("idiomas", "languages")]:
    r = seguro(lambda p=pagina: get(f"stats/{p}", start=DESDE_LISTAS, end=HASTA, limit=20))
    out[clave] = r if "error" in r else [{"nombre": s.get("name") or "(desconocido)", "visitas": s.get("count", 0)} for s in r.get("stats", [])]

os.makedirs("data/estadisticas", exist_ok=True)
with open("data/estadisticas/goatcounter.json", "w") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("Guardado:", {k: (len(v) if isinstance(v, list) else v) for k, v in out.items()})
