#!/usr/bin/env python3
"""Une los lotes extraídos (data/raw/batch_*.json) con el mapa de comunidades
pastorales y genera data/parroquias.json y data/parroquias.js para la web."""
import json, glob, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, "data")
DAYS = {"mon", "tue", "wed", "thu", "fri", "sat", "sun", "hol"}
TIME_RE = re.compile(r"(\d{1,2})(?:[:.h](\d{2}))?")


def norm_time(t):
    if not t:
        return None
    m = TIME_RE.fullmatch(str(t).strip().lower().rstrip("h"))
    if not m:
        return None
    hh, mm = int(m.group(1)), int(m.group(2) or 0)
    return f"{hh:02d}:{mm:02d}" if hh < 24 and mm < 60 else None


def clean_events(items, key="time"):
    out = []
    for it in items or []:
        days = [d for d in (it.get("days") or []) if d in DAYS]
        start = norm_time(it.get(key) if key == "time" else it.get("start"))
        if not days or not start:
            continue
        ev = {"days": days, "start": start}
        end = norm_time(it.get("end")) if key != "time" else None
        if end:
            ev["end"] = end
        if it.get("lang"):
            ev["lang"] = it["lang"]
        if it.get("note"):
            ev["note"] = it["note"]
        out.append(ev)
    out.sort(key=lambda e: e["start"])
    return out


def main():
    cp = json.load(open(os.path.join(DATA, "comunitats_pastorals.json"), encoding="utf-8"))
    slug_to_zone = {}
    for arx, comms in cp.items():
        if arx.startswith("_"):
            continue
        for comm, slugs in comms.items():
            for s in slugs:
                slug_to_zone[s] = (arx, comm)

    records, seen = [], set()
    for f in sorted(glob.glob(os.path.join(DATA, "raw", "batch_*.json"))):
        for r in json.load(open(f, encoding="utf-8")):
            if r.get("slug") in seen:
                continue
            seen.add(r.get("slug"))
            records.append(r)

    out, missing_geo = [], []
    for r in records:
        slug = r["slug"]
        arx, comm = slug_to_zone.get(slug, (None, None))
        p = {
            "id": slug,
            "name": r.get("name") or slug,
            "url": r.get("url"),
            "address": r.get("address"),
            "postal_code": r.get("postal_code"),
            "municipality": r.get("municipality"),
            "phone": r.get("phone"),
            "email": r.get("email"),
            "web": r.get("web"),
            "arxiprestat": arx or "Otras (personales, hospitales…)",
            "comunitat": comm or "Sin comunidad pastoral",
            "lat": r.get("lat"),
            "lng": r.get("lng"),
            "masses": clean_events(r.get("masses"), "time"),
            "confessions": clean_events(r.get("confessions"), "start"),
            "adoration": clean_events(r.get("adoration"), "start"),
            "masses_text": r.get("masses_text") or "",
            "confessions_text": r.get("confessions_text") or "",
            "adoration_text": r.get("adoration_text") or "",
            "other": r.get("other") or "",
            "status": r.get("status") or "ok",
        }
        if not p["municipality"] and str(p["postal_code"] or "").startswith("080"):
            p["municipality"] = "Barcelona"
        if p["web"] and not p["web"].startswith("http"):
            p["web"] = "https://" + p["web"]
        try:
            lat, lng = float(p["lat"]), float(p["lng"])
            if not (41.2 < lat < 41.8 and 1.9 < lng < 2.7):
                raise ValueError
            p["lat"], p["lng"] = round(lat, 6), round(lng, 6)
        except (TypeError, ValueError):
            p["lat"] = p["lng"] = None
            missing_geo.append(slug)
        out.append(p)

    add_geo(out)
    out.sort(key=lambda p: (p["arxiprestat"], p["comunitat"], p["name"]))
    meta = {"generated": __import__("datetime").date.today().isoformat(),
            "source": "https://esglesia.barcelona/parroquia/", "count": len(out)}
    payload = {"meta": meta, "parroquias": out}
    json.dump(payload, open(os.path.join(DATA, "parroquias.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    with open(os.path.join(DATA, "parroquias.js"), "w", encoding="utf-8") as fh:
        fh.write("window.MISAS_DATA = ")
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")

    st = {}
    for p in out:
        st[p["status"]] = st.get(p["status"], 0) + 1
    print(f"{len(out)} parroquias; estados {st}; con misas {sum(1 for p in out if p['masses'])}; "
          f"con confesión {sum(1 for p in out if p['confessions'] or p['confessions_text'])}; "
          f"con adoración {sum(1 for p in out if p['adoration'] or p['adoration_text'])}")
    print("sin coordenadas:", missing_geo, file=sys.stderr)


# ---------- Límites: municipios y distritos ----------

def _rings(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return geom["coordinates"]
    return []


def _in_ring(x, y, ring):
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def _contains(geom, x, y):
    for poly in _rings(geom):
        if poly and _in_ring(x, y, poly[0]) and not any(_in_ring(x, y, h) for h in poly[1:]):
            return True
    return False


def _simplify(ring, tol):
    """Douglas-Peucker sobre un anillo, manteniendo al menos 4 puntos."""
    if len(ring) < 5:
        return ring
    def rdp(pts):
        if len(pts) < 3:
            return pts
        (x1, y1), (x2, y2) = pts[0][:2], pts[-1][:2]
        dx, dy = x2 - x1, y2 - y1
        n = (dx * dx + dy * dy) ** 0.5 or 1e-12
        idx, dmax = 0, 0.0
        for i in range(1, len(pts) - 1):
            d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / n
            if d > dmax:
                idx, dmax = i, d
        if dmax > tol:
            return rdp(pts[: idx + 1])[:-1] + rdp(pts[idx:])
        return [pts[0], pts[-1]]
    out = rdp(ring)
    return out if len(out) >= 4 else ring


def _compact(geom, tol):
    polys = []
    for poly in _rings(geom):
        polys.append([[[round(c[0], 5), round(c[1], 5)] for c in _simplify(r, tol)] for r in poly])
    return {"type": "MultiPolygon", "coordinates": polys}


def add_geo(parishes):
    """Asigna municipio y distrito a cada parroquia y escribe data/geo.js."""
    gdir = os.path.join(DATA, "geo")
    munis = json.load(open(os.path.join(gdir, "municipis-08.geojson"), encoding="utf-8"))["features"]
    dists = json.load(open(os.path.join(gdir, "districtes-bcn.geojson"), encoding="utf-8"))["features"]
    by_name = {f["properties"]["name"].lower(): f for f in munis}
    used_m, used_d = {}, {}
    for p in parishes:
        # La parroquia dice su municipio; los polígonos (simplificados) solo sirven de respaldo.
        stated = re.sub(r"^.*\((.+)\)$", r"\1", (p.get("municipality") or "").strip())
        f = by_name.get(stated.lower())
        if not f and p["lat"] is not None:
            f = next((m for m in munis if _contains(m["geometry"], p["lng"], p["lat"])), None)
        p["municipio"] = f["properties"]["name"] if f else (stated or None)
        if f:
            used_m[p["municipio"]] = f
        p["distrito"] = None
        if p["municipio"] == "Barcelona" and p["lat"] is not None:
            x, y = p["lng"], p["lat"]
            hit = next((d for d in dists if _contains(d["geometry"], x, y)), None)
            if not hit:  # justo en el límite: el distrito más cercano
                def dist2(d):
                    pts = [c for poly in _rings(d["geometry"]) for c in poly[0]]
                    return min((c[0] - x) ** 2 + (c[1] - y) ** 2 for c in pts)
                hit = min(dists, key=dist2)
            p["distrito"] = hit["properties"]["NOM"]
            used_d[p["distrito"]] = hit
    geo = {
        "municipios": [{"name": n, "geometry": _compact(f["geometry"], 0.0004)} for n, f in sorted(used_m.items())],
        "distritos": {"Barcelona": [{"name": n, "geometry": _compact(f["geometry"], 0.00015)} for n, f in sorted(used_d.items())]},
    }
    with open(os.path.join(DATA, "geo.js"), "w", encoding="utf-8") as fh:
        fh.write("window.MISAS_GEO = ")
        json.dump(geo, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")
    missing = [p["id"] for p in parishes if p["municipio"] not in used_m]
    print(f"municipios: {len(used_m)}, distritos de Barcelona: {len(used_d)}; sin municipio por polígono: {missing}")


if __name__ == "__main__":
    main()
