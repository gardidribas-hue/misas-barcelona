"""Pasa data/horarios/horarios.json al formato de la web (data/horarios/horarios_app.js).

La web guarda cada parroquia con masses / confessions / adoration ({days, start, end, lang, note}) y
textos libres. Este script, para cada templo:
  - elige las celebraciones de la temporada vigente en la fecha indicada (por defecto, hoy);
  - pasa a texto lo que no es una hora fija: confesiones «antes de misa», «primer viernes», etc.;
  - guarda el resto de temporadas como texto, y la fuente, su enlace, la fecha de comprobación y la confianza;
  - lo enlaza con la parroquia de data/parroquias.json que está en el mismo sitio (si la hay).
    python scripts/horarios_app.py [--fecha 2026-10-21]
"""
import argparse, datetime as dt, json, math, pathlib, re
from horarios_texto import norm

ROOT = pathlib.Path(__file__).resolve().parent.parent
H = ROOT / "data" / "horarios"
DIA = {"lunes": "mon", "martes": "tue", "miercoles": "wed", "jueves": "thu", "viernes": "fri", "sabado": "sat",
       "domingo": "sun", "festivo_precepto": "hol"}
LANG = {"ca": "ca", "es": "es", "bilingue": "ca-es"}
LANG_OTRO = {"inglés": "en", "francés": "fr", "alemán": "de", "italiano": "it", "polaco": "pl"}
TIPO = {"misa": "masses", "confesion": "confessions", "adoracion": "adoration"}
DIAS_ES = {"mon": "lunes", "tue": "martes", "wed": "miércoles", "thu": "jueves", "fri": "viernes", "sat": "sábados", "sun": "domingos", "hol": "festivos"}
ORD = {1: "1.er", 2: "2.º", 3: "3.er", 4: "4.º", -1: "último"}


def en_temporada(t, md):
    if not t or not t.get("inicio") or not t.get("fin"):
        return True
    a, b = t["inicio"], t["fin"]
    return a <= md <= b if a <= b else md >= a or md <= b


def duracion(t):
    if not t or not t.get("inicio") or not t.get("fin"):
        return 400
    f = lambda s: (int(s[:2]) - 1) * 31 + int(s[3:])
    d = f(t["fin"]) - f(t["inicio"])
    return d if d >= 0 else d + 372


def dias_txt(days):
    if days[:5] == ["mon", "tue", "wed", "thu", "fri"]:
        base = "de lunes a sábado" if "sat" in days else "de lunes a viernes"
        rest = [d for d in days if d not in ("mon", "tue", "wed", "thu", "fri", "sat")]
        return " y ".join([base] + [DIAS_ES[d] for d in rest])
    return ", ".join(DIAS_ES[d] for d in days)


def hora_txt(c):
    return (c.get("inicio") or "") + (f"–{c['fin']}" if c.get("fin") else "")


def evento(c):
    ev = {"days": [DIA[d] for d in c["dias"] if d in DIA], "start": c["inicio"]}
    if c["tipo"] != "misa" and c.get("fin"):
        ev["end"] = c["fin"]
    lang = LANG.get(c.get("idioma")) or (LANG_OTRO.get(c.get("idioma_detalle")) or "other" if c.get("idioma") == "otro" else None)
    if lang:
        ev["lang"] = lang
    notas = []
    if c.get("vespertina_dominical"):
        notas.append("vigília")
    if c["fuente"] == "F2" and c.get("notas") and c["tipo"] != "confesion":  # en misas.org es un comentario corto; en las webs, la línea entera
        notas.append(c["notas"])
    if notas:
        ev["note"] = "; ".join(notas)
    return ev


def texto_libre(c):
    """Celebraciones que no son una hora fija en días fijos: van como frase."""
    if c.get("relativa_a_misa"):
        r = c["relativa_a_misa"]
        s = f"{r['minutos_antes']} minutos antes de cada misa" if r.get("minutos_antes") else "Antes de las misas"
        return s + (" y después" if r.get("tambien_despues") else "") + "."
    if c.get("a_peticion"):
        return "A petición (" + c.get("notas", "")[:120] + ")" if c.get("notas") else "A petición."
    if c.get("semanas_mes") and c.get("inicio"):
        dias = [DIA[d] for d in c["dias"] if d in DIA]
        uno = {"sábados": "sábado", "domingos": "domingo", "festivos": "festivo"}
        cuando = " y ".join(ORD.get(w, str(w)) for w in c["semanas_mes"]) + " " + ", ".join(uno.get(DIAS_ES[d], DIAS_ES[d]) for d in dias) + " del mes"
        return f"{cuando[0].upper()}{cuando[1:]}: {hora_txt(c)}."
    if not c.get("inicio"):
        return c.get("notas") or None
    return None


def resumen_temporada(cs):
    """«Lunes a viernes: 08:00, 19:00 · Domingos y festivos: 11:30»"""
    grupos = {}
    for c in cs:
        if not c.get("inicio"):
            continue
        k = dias_txt([DIA[d] for d in c["dias"] if d in DIA])
        grupos.setdefault(k, []).append(hora_txt(c))
    return " · ".join(f"{k[0].upper()}{k[1:]}: {', '.join(sorted(set(v)))}" for k, v in grupos.items())


def distrito_de(lat, lng, geo):
    def dentro(x, y, anillo):
        ok = False
        for (x1, y1), (x2, y2) in zip(anillo, anillo[1:] + anillo[:1]):
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                ok = not ok
        return ok
    for d in (geo.get("distritos") or {}).get("Barcelona", []):
        g = d["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        if any(dentro(lng, lat, p[0]) for p in polys):
            return d["name"]
    return None


def convertir(fecha):
    datos = json.loads((H / "horarios.json").read_text("utf-8"))
    parroquias = json.loads((ROOT / "data" / "parroquias.json").read_text("utf-8"))["parroquias"]
    geo_js = (ROOT / "data" / "geo.js").read_text("utf-8")
    geo = json.loads(geo_js[geo_js.index("{"):geo_js.rindex("}") + 1])
    md = fecha[5:]
    out = {}
    for tid, t in datos["templos"].items():
        cels = t.get("celebraciones") or []
        rec = {"bcn_id": tid, "name": t["nombre"], "tipo": t.get("tipo"), "address": t.get("direccion"),
               "municipio": t.get("municipio"), "lat": t.get("lat"), "lng": t.get("lng"), "web": t.get("web"),
               "masses": [], "confessions": [], "adoration": [], "masses_text": "", "confessions_text": "", "adoration_text": "",
               "horario": {"estado": t["estado"], "fuente": t.get("fuente"), "url": t.get("url"), "comprobado": t.get("comprobado"),
                           "confianza": t.get("confianza"), "aviso": t.get("aviso"), "oculto": t.get("oculto_por_defecto", False),
                           "fuentes_por_tipo": {}, "otras_temporadas": []}}
        for tipo, campo in TIPO.items():
            cs = [c for c in cels if c["tipo"] == tipo]
            if not cs:
                continue
            rec["horario"]["fuentes_por_tipo"][campo] = {"fuente": cs[0]["fuente"], "url": cs[0]["url"], "confianza": cs[0]["confianza"]}
            # Temporada vigente: la más corta de las que incluyen la fecha (agosto gana a verano).
            temps = {json.dumps(c.get("temporada"), sort_keys=True): c.get("temporada") for c in cs}
            vigentes = [k for k, v in temps.items() if v and v.get("inicio") and en_temporada(v, md)]
            vigente = min(vigentes, key=lambda k: duracion(temps[k])) if vigentes else None
            textos = []
            for c in cs:
                k = json.dumps(c.get("temporada"), sort_keys=True)
                t_c = c.get("temporada")
                fechada = t_c and t_c.get("inicio")
                if fechada and k != vigente:
                    continue
                if t_c and not fechada and t_c.get("nombre") in ("Semana Santa", "Navidad"):
                    continue
                libre = texto_libre(c)
                if libre:
                    textos.append(libre)
                elif c.get("inicio"):
                    ev = evento(c)
                    if ev["days"]:
                        rec[campo].append(ev)
            rec[campo].sort(key=lambda e: e["start"])
            rec[campo + "_text"] = " ".join(dict.fromkeys(textos))
            for k, v in temps.items():
                if v and k != vigente and (v.get("inicio") or v.get("nombre") in ("Semana Santa", "Navidad")):
                    r = resumen_temporada([c for c in cs if json.dumps(c.get("temporada"), sort_keys=True) == k])
                    if r:
                        fechas = f" ({int(v['inicio'][3:])}/{int(v['inicio'][:2])}–{int(v['fin'][3:])}/{int(v['fin'][:2])})" if v.get("inicio") else ""
                        rec["horario"]["otras_temporadas"].append({"tipo": campo, "nombre": v["nombre"] + fechas, "texto": r})
        # Parroquia de la web en el mismo sitio (menos de 120 m) y con nombre parecido.
        best = None
        if t.get("lat"):
            for p in parroquias:
                if p.get("lat") is None:
                    continue
                d = math.dist((p["lat"], p["lng"]), (t["lat"], t["lng"])) * 111000
                palabras = set(norm(t["nombre"]).split()) - {"de", "la", "del", "i", "y", "sant", "santa", "parroquia", "esglesia", "basilica"}
                if d < 120 and palabras & set(norm(p["name"]).split()) and (best is None or d < best[0]):
                    best = (d, p["id"])
        rec["parroquia_id"] = best[1] if best else None
        if rec["lat"] and not rec["parroquia_id"] and rec["municipio"] == "Barcelona":
            rec["distrito"] = distrito_de(rec["lat"], rec["lng"], geo)
        out[tid] = rec
    meta = {"generado": dt.date.today().isoformat(), "fecha_temporada": fecha, "templos": len(out), "aviso": datos["meta"].get("aviso")}
    (H / "horarios_app.js").write_text("window.MISAS_HORARIOS = " + json.dumps({"meta": meta, "templos": out}, ensure_ascii=False) + ";\n", "utf-8")
    print(f"{len(out)} templos en {H / 'horarios_app.js'}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--fecha", default=dt.date.today().isoformat())
    convertir(ap.parse_args().fecha)
