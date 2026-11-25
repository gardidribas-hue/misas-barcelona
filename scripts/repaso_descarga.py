"""Descarga temporal para el repaso de horarios (25-nov-2026): guarda el texto de la web de cada templo
(columna B del Excel) y de su ficha del Arzobispado en repaso/<ID>.txt, para leerlos a mano.
Sigue hasta 3 enlaces de la web que parezcan de horarios. Respeta robots.txt. No toca los datos de la web."""
import json, pathlib, re, sys, concurrent.futures as cf
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import horarios as h
from horarios_excel import leer, web_por_defecto

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEST = ROOT / "repaso"
import threading, urllib.parse
_locks, _glock, _orig = {}, threading.Lock(), h.descargar


def _descargar(url, *a, **k):  # una petición a la vez por servidor, con la pausa de horarios.py
    host = urllib.parse.urlsplit(url).netloc
    with _glock:
        lk = _locks.setdefault(host, threading.Lock())
    with lk:
        return _orig(url, *a, **k)


h.descargar = _descargar
RX = re.compile(r"horari|horario|misses|misas|missa|misa|celebraci|eucarist|culte|culto", re.I)


def texto(url):
    if not url.startswith("http"):
        return None, "sin URL"
    if not h.robots_permite(url):
        return None, "robots.txt no permite leerla"
    for intento in range(2):
        try:
            datos, ctype, final = h.descargar(url, timeout=40)
            t, fmt = h.a_texto(datos, ctype, final)
            html = datos.decode("utf-8", "replace") if fmt == "html" else ""
            return (final, fmt, t, html), "ok"
        except Exception as e:  # noqa: BLE001
            err = f"error: {e}"
    return None, err


def templo(lug, rev):
    tid = lug["id"]
    web = (rev.get(tid) or {}).get("web") or web_por_defecto(lug)
    f3 = ((lug.get("fuentes") or {}).get("F3") or {}).get("url") or ""
    out = [f"### {tid} · {lug['nombre']} · {lug.get('direccion') or ''} · {lug['municipio']}", f"### web: {web or '-'}", f"### f3: {f3 or '-'}"]
    if web:
        r, est = texto(web)
        if r:
            final, fmt, t, html = r
            out += [f"=== WEB {final} ({fmt})", t[:20000]]
            vistos = {final, web}
            if html:
                for txt, href in h.enlaces(html, final):
                    if len(vistos) >= 5:
                        break
                    if href in vistos or not href.startswith("http") or re.search(r"facebook|instagram|twitter|youtube|google|wa\.me|mailto", href):
                        continue
                    if RX.search(txt) or RX.search(href.rsplit("/", 1)[-1]):
                        vistos.add(href)
                        r2, est2 = texto(href)
                        out += [f"=== ENLACE «{txt[:60]}» {href} ({r2[1] if r2 else est2})", (r2[2][:15000] if r2 else "")]
        else:
            out.append(f"=== WEB {web}: {est}")
    if f3:
        r, est = texto(f3)
        if r:
            t = r[2]
            i = t.find("Dirección")
            out += [f"=== ARZOBISPADO {f3}", t[max(0, i):][:6000] if i >= 0 else t[:6000]]
        else:
            out.append(f"=== ARZOBISPADO {f3}: {est}")
    (DEST / f"{tid}.txt").write_text("\n".join(out) + "\n", "utf-8")
    return tid


def main():
    DEST.mkdir(exist_ok=True)
    lugares = json.loads((h.OUT / "lugares.json").read_text("utf-8"))["lugares"]
    rev = leer()
    with cf.ThreadPoolExecutor(8) as ex:
        for n, tid in enumerate(ex.map(lambda l: templo(l, rev), lugares), 1):
            print(n, tid, flush=True)


if __name__ == "__main__":
    main()
