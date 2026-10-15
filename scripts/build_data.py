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


if __name__ == "__main__":
    main()
