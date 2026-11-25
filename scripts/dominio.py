"""Cambia la dirección de la web en todos los sitios donde aparece, de una vez.

Uso (en la carpeta del proyecto):
    python3 scripts/dominio.py https://misasbarcelona.eu.org/
    python3 scripts/dominio.py https://misasbarcelona.github.io/     # cuenta u organización nueva de GitHub, sin dominio

Qué hace:
- Cambia la dirección en index.html (canonical, og:url, og:image y datos para Google),
  en scripts/paginas.py (p/, sitemap.xml, robots.txt) y en scripts/palabra.py y oraciones.py.
- Si es un dominio propio (no acaba en github.io), escribe el archivo CNAME que pide GitHub Pages.
- Vuelve a generar p/, sitemap.xml y robots.txt con la dirección nueva.
Después: abrir una PR y, al publicarla, poner el dominio en GitHub (Settings > Pages > Custom domain).
"""
import os
import re
import subprocess
import sys
from urllib.parse import urlparse

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVOS = ["index.html", "scripts/paginas.py", "scripts/palabra.py", "scripts/oraciones.py"]


def actual():
    """La dirección de ahora: la que usa paginas.py por defecto."""
    with open(os.path.join(RAIZ, "scripts/paginas.py"), encoding="utf-8") as f:
        m = re.search(r'MISAS_SITIO",\s*"([^"]+)"', f.read())
    return m.group(1)


def main():
    if len(sys.argv) != 2 or not sys.argv[1].startswith("https://"):
        sys.exit("Uso: python3 scripts/dominio.py https://nuevo-dominio/")
    nuevo = sys.argv[1].rstrip("/") + "/"
    viejo = actual()
    if nuevo == viejo:
        sys.exit(f"La web ya usa {nuevo}")
    for rel in ARCHIVOS:
        ruta = os.path.join(RAIZ, rel)
        with open(ruta, encoding="utf-8") as f:
            txt = f.read()
        n = txt.count(viejo)
        if n:
            with open(ruta, "w", encoding="utf-8") as f:
                f.write(txt.replace(viejo, nuevo))
        print(f"{rel}: {n} cambios")
    host = urlparse(nuevo).hostname
    cname = os.path.join(RAIZ, "CNAME")
    if host.endswith(".github.io"):
        if os.path.exists(cname):
            os.remove(cname)
            print("CNAME: quitado (las direcciones github.io no lo necesitan)")
    else:
        with open(cname, "w", encoding="utf-8") as f:
            f.write(host + "\n")
        print(f"CNAME: {host}")
    subprocess.run([sys.executable, os.path.join(RAIZ, "scripts/paginas.py")], check=True)
    print(f"Hecho: {viejo} -> {nuevo}")


if __name__ == "__main__":
    main()
