# Misas Barcelona (prototipo)

Web pública para encontrar **misas, confesiones y adoración eucarística** en las parroquias de la
Archidiócesis de Barcelona, con mapa, filtros y un asistente tipo chat.

## Qué hay

| Archivo | Para qué |
|---|---|
| `index.html`, `styles.css`, `app.js` | La web (estática: no necesita servidor ni base de datos) |
| `config.js` | Clave de Google Maps (opcional) y centro del mapa |
| `zonas.js` | Barrios con coordenadas aproximadas para el asistente |
| `data/parroquias.json` / `.js` | Datos de las parroquias que usa la web |
| `data/comunitats_pastorals.json` | Las 43 comunidades pastorales y 7 arciprestazgos (decreto de 2025) |
| `data/geo/` y `data/geo.js` | Límites de municipios y de los distritos de Barcelona (fuentes en `data/geo/FONTS.md`) |
| `data/raw/` | Datos extraídos ficha a ficha de la web del Arzobispado |
| `scripts/build_data.py` | Une `data/raw/` + comunidades y genera `data/parroquias.*` |

## Cómo probarla

Abre `index.html` en el navegador (doble clic) o, mejor, sirve la carpeta:

```bash
cd web-misas && python3 -m http.server 8000   # y abre http://localhost:8000
```

## Funciones

- Una sola pantalla con tres vistas: **Inicio** (chat y mapa juntos), **Chat** (solo la conversación) y **Mapa** (mapa con filtros y lista).
- Chat: escribes lo que buscas (con ideas de ejemplo en gris) y responde con las parroquias que encajan; «Ver en el mapa» las lleva al mapa.
- Mapa vectorial moderno y gratuito (MapLibre con el estilo Liberty de OpenFreeMap, actualizado cada semana desde OpenStreetMap). Con una clave de Google Maps en `config.js` se usa Google Maps.
- Filtros: misa / confesión / adoración, día, franja horaria, municipio, idioma y texto. En Barcelona se puede elegir distrito: se marca en rojo translúcido en el mapa, y también se puede pulsar el distrito en el propio mapa.
- "Cerca de mí": en el chat («misa ahora cerca de mí») y con el botón del mapa; ordena por distancia usando tu ubicación.
- Castellano y catalán: botón con la bandera arriba a la derecha (se recuerda en el navegador; por defecto, el idioma del navegador).
- **Palabra del día** (verde): lecturas de la misa. En castellano, de [Vatican News](https://www.vaticannews.va/es/evangelio-de-hoy.html); en catalán, el mismo fragmento de la [Bíblia Catalana Interconfessional](https://www.bible.com/versions/335-bci-b) (bible.com), con los títulos de lectura en catalán (`scripts/bci.py`); el nombre del día litúrgico es el de Vatican News, traducido automáticamente. Sin salmo, solo lecturas y evangelio. Al final, en una caja amarilla, «Las palabras de los Papas» de Vatican News; en catalán, traducidas automáticamente del castellano (Google Translate, o Apertium si falla) y repasadas por `scripts/catala.py`: nombres propios en catalán (Francesc, Benet XVI, Pau, Lluc…) y sin entidades HTML ni marcas como «#». La acción de GitHub `contenido` (`scripts/palabra.py`) las descarga dos veces al día en `data/palabra/` (de 3 días antes a 7 días después), porque esas webs no permiten leerlas desde otra página.
- Oraciones del Rosario (`data/oraciones.js`, generado por `scripts/oraciones.py`): castellano de [EWTN](https://www.ewtn.com/es/oracion/oraciones-del-rosario); catalán y latín del [Devocionari de l'Opus Dei](https://multimedia.opusdei.org/doc/pdf/Devocionari%20mobil%20-%20www.opusdei.cat20220314171720840413.pdf); oración de Fátima en latín de [EWTN](https://www.ewtn.com/catholicism/teachings/prayers-of-the-rosary-in-english-and-latin-164). Letanías a la Virgen, Señor ten piedad y oración final: castellano de la [Santa Sede](https://www.vatican.va/special/rosary/documents/litanie-lauretane_sp.html); catalán y latín del Devocionari. Credo largo (Niceno-Constantinopolitano): castellano del [Compendio del Catecismo](https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_sp.html); catalán y latín del Devocionari. El Credo (con selector Corto / Largo), la Salve, las letanías y la señal de la cruz se ven siempre; Padrenuestro, Avemaría (×10) y Gloria se abren con la flechita del título.
- **Rosario** (azul): el rosario del día entero en un solo texto con scroll (misterios con su cita bíblica), en castellano, catalán o latín.
- Móvil: barra de navegación inferior, botón de volver arriba, pantalla de carga y esqueletos mientras llegan los datos.
- Ficha de cada parroquia: horarios, confesiones, adoración, teléfono, web y "Cómo llegar" (Google Maps).

## Google Maps

1. Entra en https://console.cloud.google.com/ y crea un proyecto.
2. Activa la **Maps JavaScript API** y crea una clave de API (Credenciales > Crear credenciales).
3. Restringe la clave a tu dominio (Restricciones de aplicación > Sitios web).
4. Crea un **Map ID** (Google Maps Platform > Administración de mapas) para los marcadores.
5. Pon la clave y el Map ID en `config.js`.

Google da un crédito mensual gratuito que suele cubrir una web de este tamaño, pero pide tarjeta.
Sin clave, la web usa el mapa vectorial de OpenFreeMap, que es gratis. El botón "Cómo llegar" abre Google Maps en ambos casos.

## De dónde salen los datos

De las fichas públicas de cada parroquia en https://esglesia.barcelona/parroquia/ (211 parroquias),
que incluyen dirección, coordenadas, horarios de misa y, en muchas, confesiones y adoración.
Google Maps no publica horarios de misa y sus condiciones no permiten guardar sus datos, así que no sirve como fuente.

Avisos:
- La extracción se hizo automáticamente leyendo cada ficha; conviene revisar las parroquias que más importen.
- Muchas fichas tienen horario de invierno y de verano: se ha guardado el de invierno (curso) y el de verano aparece en el texto.
- Solo unas 30 parroquias publican horas concretas de confesión y unas 30 de adoración. El resto dicen
  "antes de misa" o "a petición": la web las muestra como "Confesión antes de misa / a petición".
- Antes de publicarla, es recomendable pedir permiso o colaboración al Arzobispado (Delegación de Medios),
  que es el dueño de los datos y podría ofrecer una actualización periódica.

## Actualizar los datos

Volver a extraer las fichas a `data/raw/batch_*.json` siguiendo `data/EXTRACTION_SPEC.md` y ejecutar:

```bash
python3 scripts/build_data.py
```

## Publicarla

Al ser estática, se puede publicar gratis en GitHub Pages, Netlify o Cloudflare Pages subiendo esta carpeta.
