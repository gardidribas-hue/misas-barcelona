"""Lecturas de Claude del repaso semanal (columnas D, E y L del Excel de revisión).

Cada lunes, después de que GitHub lea las fuentes (C), las descargue enteras (rama «fuentes») y calcule sus huellas:
  - 7:00, sesión 1 de Claude: comprueba la web (L) y hace la segunda lectura (D) de los templos pendientes.
  - 9:00, sesión 2 de Claude, otra distinta: hace la tercera lectura (E) a ciegas, sin mirar C ni D.
Un templo está pendiente si el texto de su fuente ha cambiado desde la última vez que se leyó (huella distinta).

    python scripts/lecturas.py pendientes D|E          IDs que hay que leer esta semana
    python scripts/lecturas.py texto <ID> [carpeta]     texto de la fuente (por defecto, carpeta fuentes/ de la rama «fuentes»)
    python scripts/lecturas.py ficha <ID>               nombre, dirección y web (B) del templo, sin C ni D ni E
    python scripts/lecturas.py poner D|E <ID> <horario> guarda la lectura (en el horario, « / » separa las líneas)

Formato del horario: «Misas: Lun–Vie 8:00 (cat), 19:00 (cast); Sáb y vísperas 20:00; Dom y festivos 11:00 (cat/cast) / Confesiones: …».
El idioma va entre paréntesis detrás de cada hora, solo si la fuente lo dice: cat, cast, cat/cast (bilingüe), en, fr, it,
de, pl, pt, uk (ucraniano), lat (latín), tl (tagalo)…
    python scripts/lecturas.py web <ID> Sí|No           guarda la comprobación de la web (columna L)

«poner» y «web» escriben en el Excel y en data/horarios/huellas.json. Cuando un templo tiene D y E hechas con la huella
actual, su «leida» pasa a ser la actual y la columna M («Fuente cambiada») se vacía en el próximo «generar».
"""
import json, pathlib, re, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import horarios_excel as hx

ROOT = pathlib.Path(__file__).resolve().parent.parent
FUENTES = ROOT / "fuentes"
COL = {"D": 4, "E": 5, "L": 12}


def _huellas():
    return hx.huellas()


def _guardar(datos):
    hx.HUELLAS.write_text(json.dumps(datos, ensure_ascii=False, indent=1, sort_keys=True) + "\n", "utf-8")


def pendientes(cual):
    """D: fuente cambiada y D aún no hecha con la huella actual. E: lo mismo con E (no depende de D)."""
    campo = {"D": "d_hecha", "E": "e_hecha"}[cual]
    out = []
    for tid, r in sorted(_huellas().items()):
        if r.get("actual") and r.get(campo) != r["actual"]:
            out.append(tid)
    return out


def _escribir(tid, col, valor):
    import openpyxl
    wb = openpyxl.load_workbook(hx.XLSX)
    hecho = False
    for ws in wb.worksheets:
        if ws.cell(1, 9).value != "ID":
            continue
        for i in range(2, ws.max_row + 1):
            if ws.cell(i, 9).value == tid:
                ws.cell(i, col).value = valor or None
                hecho = True
    if not hecho:
        sys.exit(f"No encuentro {tid} en el Excel")
    wb.save(hx.XLSX)


def poner(cual, tid, texto):
    # « / » (con espacios) separa las líneas; «cat/cast» (sin espacios) es el idioma bilingüe
    texto = "\n".join(x.strip() for x in re.split(r"\s+/\s+", texto) if x.strip()) if "\n" not in texto else texto.strip()
    if texto:
        cels, libres = hx.leer_horario(texto)
        if not cels and not libres:
            sys.exit(f"No entiendo el horario: {texto!r}")
    _escribir(tid, COL[cual], texto)
    datos = _huellas()
    r = datos.setdefault(tid, {})
    r["d_hecha" if cual == "D" else "e_hecha"] = r.get("actual")
    if r.get("d_hecha") == r.get("e_hecha") == r.get("actual"):
        r["leida"] = r.get("actual")
    _guardar(datos)
    print(f"{tid} {cual} = {texto!r}")


def main(a):
    if a[:1] == ["pendientes"] and len(a) == 2:
        print("\n".join(pendientes(a[1])))
    elif a[:1] == ["texto"] and len(a) in (2, 3):
        print((pathlib.Path(a[2]) if len(a) == 3 else FUENTES).joinpath(f"{a[1]}.txt").read_text("utf-8"))
    elif a[:1] == ["ficha"] and len(a) == 2:
        lug = {l["id"]: l for l in json.loads((hx.H / "lugares.json").read_text("utf-8"))["lugares"]}[a[1]]
        rev = hx.leer().get(a[1], {})
        print(f"{a[1]} · {lug['nombre']} · {lug.get('direccion') or ''} · {lug['municipio']}\nweb (B): {rev.get('web') or hx.web_por_defecto(lug) or '-'}")
    elif a[:1] == ["poner"] and len(a) == 4 and a[1] in ("D", "E"):
        poner(a[1], a[2], a[3])
    elif a[:1] == ["web"] and len(a) == 3 and a[2] in hx.WEB_CLAUDE:
        _escribir(a[1], COL["L"], a[2])
        print(f"{a[1]} web = {a[2]}")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
