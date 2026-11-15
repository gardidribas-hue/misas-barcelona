/* Service worker de Misas Barcelona: la web abre al instante y funciona sin conexión.
   - Código y datos (HTML, JS, CSS, horarios, lecturas): primero la red, para tener siempre lo último;
     si no hay red o tarda más de 4 s, la copia guardada.
   - Letras, MapLibre e iconos (no cambian): primero la copia guardada.
   - Teselas del mapa de OpenFreeMap: la copia guardada al momento y se renueva por detrás
     (así el mapa de las zonas ya vistas sale también sin conexión).
   Si algún día hay que desactivarlo: cambia este archivo por uno que solo haga
   self.registration.unregister() (ver GUIA.md). Sube VERSION si cambias la lista de PRECACHE
   o actualizas algo de fonts/, vendor/ o icons/ (esas carpetas se guardan sin volver a mirar la red). */
const VERSION = "2026-11-15b";
const CORE = "misas-core-" + VERSION, STATIC = "misas-static-" + VERSION, TILES = "misas-tiles";
const PRECACHE = [
  "./", "index.html", "styles.css", "app.js", "config.js", "zonas.js", "horarios.js", "devocion.js", "extras.js",
  "data/parroquias.js", "data/geo.js", "data/citas.js", "data/oraciones.js", "data/horarios/horarios_app.js",
  "legal.html", "manifest.webmanifest"
];
const STATIC_FILES = [
  "fonts/fonts.css", "fonts/newsreader-normal-latin.woff2", "fonts/manrope-normal-latin.woff2",
  "vendor/maplibre-gl/maplibre-gl.js", "vendor/maplibre-gl/maplibre-gl.css", "icons/s1a/icon.svg", "icons/s1a/icon-192.png"
];
const MAX_TILES = 1500;

self.addEventListener("install", (e) => {
  // Cada archivo por separado: si uno falla, el resto se guarda igual.
  e.waitUntil(Promise.all([
    caches.open(CORE).then((c) => Promise.all(PRECACHE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {})))),
    caches.open(STATIC).then((c) => Promise.all(STATIC_FILES.map((u) => c.add(u).catch(() => {}))))
  ]).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith("misas-") && ![CORE, STATIC, TILES].includes(k)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function networkFirst(req, isPage) {
  const cache = await caches.open(CORE);
  const net = fetch(req).then((res) => {
    if (res && res.ok) cache.put(isPage ? "./" : req, res.clone());
    return res;
  });
  try {
    const res = await Promise.race([net, timeout(4000)]);
    if (res) return res;
  } catch (err) { /* sin red */ }
  const hit = await cache.match(isPage ? "./" : req, { ignoreSearch: isPage });
  if (hit) return hit;
  return net; // no hay copia: esperamos a la red (o falla como sin service worker)
}

async function cacheFirst(req) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

let trimming = false;
async function trimTiles(cache) {
  if (trimming) return; trimming = true;
  try {
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - MAX_TILES; i++) await cache.delete(keys[i]);
  } finally { trimming = false; }
}

async function staleWhileRevalidate(req, e) {
  const cache = await caches.open(TILES);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => {
    if (res && res.ok) { cache.put(req, res.clone()); trimTiles(cache); }
    return res;
  });
  if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
  return net;
}

async function networkFirstTiles(req) {
  const cache = await caches.open(TILES);
  try {
    const res = await Promise.race([fetch(req), timeout(4000).then(() => { throw new Error("lento"); })]);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req);
    if (hit) return hit;
    return fetch(req);
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") {
      // La portada sale de la caché sin conexión; legal.html y las fichas de parroquia (p/…), también si ya se vieron.
      const root = new URL("./", self.registration.scope).pathname;
      const page = url.pathname === root || url.pathname === root + "index.html";
      e.respondWith(networkFirst(req, page));
    } else if (/\/(fonts|vendor|icons)\//.test(url.pathname)) e.respondWith(cacheFirst(req));
    else e.respondWith(networkFirst(req, false));
  } else if (url.hostname === "tiles.openfreemap.org") {
    // El estilo y la lista de teselas cambian cada semana: primero la red. Las teselas, letras y sprites no cambian: copia guardada.
    if (/^\/(styles\/|planet\/?$)/.test(url.pathname)) e.respondWith(networkFirstTiles(req));
    else e.respondWith(staleWhileRevalidate(req, e));
  }
  // El resto (GoatCounter, formularios…) va directo a la red.
});
