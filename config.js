// Configuración de la web.
// Mapa: por defecto usa MapLibre con el estilo "Positron" de OpenFreeMap
// (moderno, gratuito y sin clave). Si pones una clave de la "Maps JavaScript
// API" de Google, la web usará Google Maps automáticamente.
window.MISAS_CONFIG = {
  googleMapsApiKey: "",
  googleMapId: "DEMO_MAP_ID", // crea un Map ID propio en Google Cloud para producción
  mapStyle: "https://tiles.openfreemap.org/styles/positron",
  center: [41.405, 2.17],
  zoom: 12
};
