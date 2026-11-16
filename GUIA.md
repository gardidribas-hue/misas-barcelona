# Guía para mantener Misas Barcelona

Esta guía es para quien toque la web en el futuro (una persona o un asistente de IA).
Explica cómo está hecha, qué decisiones ya están tomadas y cómo cambiar cosas sin romperlas.
Si cambias algo importante, actualiza también esta guía.

## 1. Qué es, en una frase

Una web estática (HTML, CSS y JavaScript, sin servidor ni base de datos) publicada en GitHub Pages
desde la rama `main`: https://gardidribas-hue.github.io/misas-barcelona/.
**Publicar = fusionar una PR en `main`.** GitHub Pages tarda 1 o 2 minutos en mostrar el cambio.

## 2. Decisiones de Guillem que no hay que cambiar sin preguntarle

- Todo con Guillem se habla y se escribe en **castellano**. La web está en castellano y catalán.
- **Nada de IA en la web**: ni Gemini ni otra. El chat funciona con reglas (`parseQuery` en `app.js`) y **no se toca**.
- **Fuentes de horarios**, por este orden: 1) web de la parroquia; 2) si no hay, Arzobispado y OpenStreetMap
  (si no coinciden, manda el Arzobispado, con aviso de confirmar). **misas.org no se usa.**
  Google Maps no da horarios de misa y sus condiciones no permiten guardarlos.
- Web **independiente y no oficial** de la Archidiócesis: el logo no lleva «Archidiócesis» y se avisa en la web.
- Sin cookies ni registro. Las favoritas y los ajustes se guardan solo en el navegador (`localStorage`).
- Animaciones suaves y nítidas; nada de giros grandes que mareen. Siempre respetar `prefers-reduced-motion`.
- Mejoras que ya rechazó (no volver a proponer): más contraste en la pestaña activa, barra inferior «corredera»,
  misterios del Rosario en una fila, filtros del mapa plegados en el móvil, aviso de fiesta de precepto,
  Agenda como sección propia, Agenda y «Pide una oración» dentro de Voluntariado, pastilla de la barra que se desliza.
- Pendientes de Guillem (no decidir por él): logo definitivo, nombre y correo de contacto (`config.js`),
  formulario de avisos (Google Forms), GoatCounter, dominio propio, repositorio privado.

## 3. Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | La página. Todas las secciones (Inicio, Chat, Mapa, Palabra, Rosario, Voluntariado, Sobre nosotros) están aquí; se muestra una u otra según `data-mode` de `#stage`. |
| `styles.css` | Todo el diseño. Colores en variables (`--accent`, `--bg`…) al principio, con su versión oscura. |
| `app.js` | Chat, mapa, filtros, fichas, ajustes, idiomas (textos en `I18N`, castellano y catalán). |
| `devocion.js` | Palabra del día y Rosario. |
| `extras.js` | Detalles visuales: camino a pie, año litúrgico, santos del día (calendario romano, con `data/santoral.js`), cuentas del rosario, vela, imagen para compartir, credencial del peregrino y vibración. Cada bloque es independiente. |
| `horarios.js` | Mete en los datos los horarios automáticos de `data/horarios/horarios_app.js`. |
| `config.js` | Ajustes que puede cambiar Guillem: mapa, contacto, formulario de avisos, GoatCounter. |
| `sw.js` | Service worker: la web abre al instante en visitas repetidas y funciona sin conexión. |
| `p/` | Una página por parroquia para Google (la genera `scripts/paginas.py`; no editar a mano). |
| `sitemap.xml`, `robots.txt` | Para buscadores (los genera `scripts/paginas.py`). |
| `legal.html` | Aviso legal y privacidad. |
| `manifest*.webmanifest`, `icons/` | App instalable (tres iconos a elegir en Ajustes). |
| `fonts/`, `vendor/maplibre-gl/` | Letras y librería del mapa alojadas en la propia web. |
| `data/` | Datos: parroquias, límites de municipios y distritos, horarios, lecturas, oraciones, citas. |
| `scripts/` | Programas en Python que generan los datos (los lanzan las acciones de GitHub). |
| `pruebas/humo.js` | Prueba automática: abre la web y comprueba que lo básico funciona. |

## 4. Tareas automáticas (GitHub Actions, carpeta `.github/workflows/`)

| Acción | Cuándo | Qué hace |
|---|---|---|
| `horarios` | Lunes 03:30 UTC | Lee las fuentes de cada templo, actualiza `data/horarios/`, el Excel de revisión, la web de horarios y las páginas `p/`. |
| `revision` | Cuando se sube `data/horarios/Horarios_revision.xlsx` | Aplica la columna D (horario revisado por Guillem) y regenera las páginas `p/`. |
| `contenido` | Dos veces al día | Descarga las lecturas (`data/palabra/`) y las oraciones. |
| `citas` | Al cambiar `scripts/citas.py` | Citas bíblicas de Voluntariado. |
| `comprobar` | En cada PR y cada cambio en `main` | Revisa la sintaxis y abre la web en un navegador de prueba. **Si sale en rojo, no fusionar.** |

El contenedor de Claude no puede abrir las webs de las parroquias ni el mapa: por eso los datos se descargan en GitHub Actions.

## 5. Cómo hacer cambios habituales

- **Cambiar un texto**: búscalo en `I18N` de `app.js` (castellano en `es`, catalán en `ca`). Cambia los dos idiomas.
- **Cambiar un color**: variables al principio de `styles.css`. Hay tres bloques: claro, oscuro automático y oscuro elegido. Cambia los tres.
- **Corregir un horario a mano**: en el Excel de revisión (columna D) o en `data/horarios/correcciones.json`.
- **Cambiar de dominio**: `SITIO` en `scripts/paginas.py`, `og:url`, `og:image` y `canonical` en `index.html`,
  y un archivo `CNAME` con el dominio. Después lanza la acción `revision` a mano para regenerar `p/`.
- **Actualizar MapLibre, letras o iconos**: además de cambiar los archivos, sube `VERSION` en `sw.js`
  (esas carpetas se guardan en el móvil sin volver a mirar la red).
- **Desactivar el service worker** (si diera problemas): sustituye `sw.js` por
  `self.addEventListener("install", () => self.skipWaiting()); self.addEventListener("activate", () => self.registration.unregister());`
  y quita `offlineReady()` de `start()` en `app.js`.

## 6. Cómo probar antes de publicar

```bash
python3 -m http.server 8000          # en la carpeta del proyecto; abre http://localhost:8000
node pruebas/humo.js                  # en otra terminal (necesita: npm i playwright-core y CHROME=ruta del navegador)
```

Comprueba siempre en el móvil (390 px de ancho), en modo claro y oscuro y en los dos idiomas.
Las secciones se pueden abrir desde la consola: `MisasApp.setMode("word")`, y el chat con `MisasApp.ask("…")`.

## 7. Cómo trabajar con Guillem

- Le gusta ver **opciones con capturas de antes y después** y elegir él por números.
- Nada se publica hasta que él lo dice. Las PR se abren en una rama `claude/…` y él las fusiona o pide fusionarlas.
- Explicaciones sencillas, sin jerga técnica.
