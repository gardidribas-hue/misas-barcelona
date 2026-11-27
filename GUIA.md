# Guía para mantener Misas Barcelona

Esta guía es para quien toque la web en el futuro (una persona o un asistente de IA).
Explica cómo está hecha, qué decisiones ya están tomadas y cómo cambiar cosas sin romperlas.
Si cambias algo importante, actualiza también esta guía.

## 1. Qué es, en una frase

Una web estática (HTML, CSS y JavaScript, sin servidor ni base de datos) publicada en GitHub Pages
desde la rama `main`: https://misasbarcelona.github.io/.
**Publicar = fusionar una PR en `main`.** GitHub Pages tarda 1 o 2 minutos en mostrar el cambio.

## 2. Decisiones de Guillem que no hay que cambiar sin preguntarle

- Todo con Guillem se habla y se escribe en **castellano**. La web está en castellano y catalán.
- **Nada de IA en la web**: ni Gemini ni otra. El chat funciona con reglas (`parseQuery` en `app.js`) y **no se toca**.
- **Repaso semanal con doble verificación** (25/11/2026, decisiones de Guillem). Cada lunes:
  1. 4:30, GitHub (`horarios`): lectura automática **C**; descarga entera de cada fuente a la rama `fuentes` (`scripts/fuentes_texto.py`); segunda lectura automática **C2** (mismas reglas sobre la página entera); comprobación de la web **K** (salen la calle o el nombre); huella del texto: si cambia, **M** = «Sí».
  2. 7:00, tarea programada de Claude (sesión 1): comprueba la web (**L**: Sí/No) y hace la segunda lectura **D** de los templos con la fuente cambiada (`scripts/lecturas.py`).
  3. 9:00, tarea programada de Claude (sesión 2, distinta): tercera lectura **E** a ciegas (sin mirar C ni D).
  4. La sesión 2 **publica sola** (fusiona la PR a `main`; Guillem no tiene que decir «publica»). Amarillos y rojos no frenan la publicación: la web ya los muestra como «sin verificar».
  - **Idioma de cada misa** (25/11/2026, Guillem: «siempre que se diga»): entre paréntesis detrás de la hora, solo si la fuente lo dice: «Dom 12:00 (cat), 19:30 (cast)». Códigos: cat, cast, cat/cast, en, fr, it, de, pl, pt, uk, lat, tl. Forma parte de la comparación (C, C2, D y E). `horario_txt` lo escribe, `leer_horario` lo lee y la web lo enseña también en los horarios revisados. El 25/11 se añadió a D de 100 templos (y a E, provisional); el lunes 30/11 la sesión 2 repite E a ciegas en esos 100.
  - La web enseña «Última verificación de los datos: …» (lista y ficha, también en `p/`). La fecha la escribe `fuentes_texto.py` en `data/horarios/verificacion.json` cada lunes al releer todas las fuentes, y llega a la web como `meta.verificado` de `horarios_app.js`.
  - Webs que **no existen** (el dominio da NXDOMAIN en Google y Cloudflare) se quitan de `lugares.json` (web y F1) y de la columna B; queda una nota en `notas`. Hecho el 25/11/2026 con 16 dominios (34 templos). Un dominio que existe pero no carga se deja.
  - **Verde** solo con web comprobada dos veces (K = ok y L = Sí, salvo que no haya web) y dos lecturas iguales: D = E, o C = D (o C = E) con C = C2. Si la fuente cambió, D y E no cuentan hasta repetirlas. La fórmula de F y `horarios_excel.estado` son la misma regla (comprobado con LibreOffice).
- **Fuentes de horarios**, por este orden: 1) web de la parroquia; 2) si no hay, Arzobispado y OpenStreetMap
  (si no coinciden, manda el Arzobispado, con aviso de confirmar). **misas.org no se usa.**
  Google Maps no da horarios de misa y sus condiciones no permiten guardarlos.
- Web **independiente y no oficial** de la Archidiócesis: el logo no lleva «Archidiócesis» y se avisa en la web.
- Sin cookies ni registro. Las favoritas y los ajustes se guardan solo en el navegador (`localStorage`).
- Animaciones suaves y nítidas; nada de giros grandes que mareen. Siempre respetar `prefers-reduced-motion`.
- Mejoras que ya rechazó (no volver a proponer): más contraste en la pestaña activa, barra inferior «corredera»,
  misterios del Rosario en una fila, filtros del mapa plegados en el móvil, aviso de fiesta de precepto,
  Agenda como sección propia, rachas («N días seguidos»), fuego y escudo en «Tu camino» (26/11/2026: «no quiero que sea una red social»; sí quiere las montañas, las estampas por días en total y la ruta de los templos, dentro de «Tu camino»), Agenda y «Pide una oración» dentro de Voluntariado, pastilla de la barra que se desliza.
- Pendientes de Guillem (no decidir por él): logo definitivo, nombre y correo de contacto (`config.js`),
  formulario de avisos (Google Forms), dominio propio, repositorio privado.

## 3. Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | La página. Todas las secciones (Inicio, Chat, Mapa, Palabra, Rosario, Voluntariado, Sobre nosotros) están aquí; se muestra una u otra según `data-mode` de `#stage`. |
| `styles.css` | Todo el diseño. Colores en variables (`--accent`, `--bg`…) al principio, con su versión oscura. |
| `app.js` | Chat, mapa, filtros, fichas, ajustes, idiomas (textos en `I18N`, castellano y catalán). |
| `devocion.js` | Palabra del día y Rosario. |
| `extras.js` | Detalles visuales: camino a pie, año litúrgico, santos del día (calendario romano, con `data/santoral.js`, y una vida breve con «Leer más» en `data/santos-vidas.js`, que se edita a mano y va en el mismo orden que `santoral.js`), cuentas del rosario, vela, imagen para compartir, credencial del peregrino (la ruta de los templos, que se ve al final de «Tu camino») y vibración. Cada bloque es independiente. |
| `camino.js` | «Tu camino» (el botón lila de arriba): el dibujo del camino con una iglesia al final, los días en que has leído la Palabra y rezado el Rosario (la semana, el mes día a día y el total del año), hitos con estampa a los 7, 10, 40 y 100 días en total (seguidos o no), la ruta de los templos, y el calendario litúrgico que se abre al tocar el año litúrgico. Todo se guarda solo en el navegador (`localStorage` «misas-camino»). Un día de Palabra cuenta con el evangelio de hoy 5 s a la vista; uno de Rosario, al llegar al final (o abrir los cinco misterios del resumen, o encender la vela). |
| `horarios.js` | Mete en los datos los horarios automáticos de `data/horarios/horarios_app.js`. |
| `config.js` | Ajustes que puede cambiar Guillem: mapa, contacto, formulario de avisos, GoatCounter. |
| `sw.js` | Service worker: la web abre al instante en visitas repetidas y funciona sin conexión. |
| `p/` | Una página por parroquia para Google (la genera `scripts/paginas.py`; no editar a mano). |
| `sitemap.xml`, `robots.txt` | Para buscadores (los genera `scripts/paginas.py`). |
| `legal.html` | Aviso legal y privacidad. |
| `404.html` | Página de «no existe» con enlaces a Inicio y a todas las parroquias. |
| `manifest*.webmanifest`, `icons/` | App instalable (tres iconos a elegir en Ajustes). |
| `fonts/`, `vendor/maplibre-gl/` | Letras y librería del mapa alojadas en la propia web. |
| `data/` | Datos: parroquias, límites de municipios y distritos, horarios, lecturas, oraciones, citas. |
| `scripts/` | Programas en Python que generan los datos (los lanzan las acciones de GitHub). |
| `pruebas/humo.js` | Prueba automática: abre la web y comprueba que lo básico funciona. |

## 4. Tareas automáticas (GitHub Actions, carpeta `.github/workflows/`)

| Acción | Cuándo | Qué hace |
|---|---|---|
| `horarios` | Lunes 03:30 UTC | Lee las fuentes de cada templo, actualiza `data/horarios/`, el Excel de revisión, la web de horarios y las páginas `p/`. |
| `revision` | Cuando se sube `data/horarios/Horarios_revision.xlsx` | Aplica las columnas D y E (segunda y tercera lectura) y el semáforo de fiabilidad y regenera las páginas `p/`. |
| `contenido` | Dos veces al día | Descarga las lecturas (`data/palabra/`) y las oraciones. |
| `citas` | Al cambiar `scripts/citas.py` | Citas bíblicas de Voluntariado. |
| `comprobar` | En cada PR y cada cambio en `main` | Revisa la sintaxis y abre la web en un navegador de prueba. **Si sale en rojo, no fusionar.** |
| `estadisticas` | Cada día 03:00 UTC | Guarda los totales de GoatCounter (cuenta `misasbarcelona`, secreto `GOATCOUNTER_TOKEN` de solo lectura) en `data/estadisticas/goatcounter.json` para el panel del proyecto. Solo cifras agregadas. |

El contenedor de Claude no puede abrir las webs de las parroquias ni el mapa: por eso los datos se descargan en GitHub Actions.

## 5. Cómo hacer cambios habituales

- **Cambiar un texto**: búscalo en `I18N` de `app.js` (castellano en `es`, catalán en `ca`). Cambia los dos idiomas.
- **Cambiar un color**: variables al principio de `styles.css`. Hay tres bloques: claro, oscuro automático y oscuro elegido. Cambia los tres.
- **Corregir un horario a mano**: en el Excel de revisión (columnas D y E: si cambias D, pon lo mismo en E solo tras comprobarlo otra vez) o en `data/horarios/correcciones.json`.
- **Cambiar de dominio**: `python3 scripts/dominio.py https://nuevo-dominio/` cambia la dirección en `index.html`
  (canonical, og:url, og:image), `scripts/paginas.py`, `palabra.py` y `oraciones.py`, escribe `CNAME` si es un dominio propio
  y regenera `p/`, `sitemap.xml` y `robots.txt`. Después, PR y, al publicarla, poner el dominio en GitHub
  (Settings > Pages > Custom domain, con «Enforce HTTPS»). GitHub redirige solo la dirección antigua de github.io a la nueva.
- **Avisos de horarios**: el formulario de Google lo crea `formulario-avisos.gs` (carpeta del proyecto `lanzamiento/`) con la cuenta misasbarcelona@gmail.com.
  La lista de parroquias del formulario sale de `data/avisos-parroquias.json` (la genera `scripts/paginas.py`; el formulario la relee cada lunes).
  Al cambiar `avisos` en `config.js`, vuelve a ejecutar `python3 scripts/paginas.py` para que las páginas `p/` usen el formulario.
  Cada aviso llega por correo («Aviso», «Prioridad» con 2 pendientes de la misma parroquia, «URGENTE» con 3) y queda en la pestaña «Seguimiento» de la hoja.
- **Página 404**: `404.html` (castellano y catalán) sale en cualquier dirección que no exista; calcula sola la raíz de la web.
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
