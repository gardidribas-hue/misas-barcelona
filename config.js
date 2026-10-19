// Configuración de la web.
// Mapa: por defecto usa MapLibre con el estilo "Positron" de OpenFreeMap (gris y blanco)
// (vectorial, gratuito, sin clave y actualizado cada semana desde OpenStreetMap).
// Si pones una clave de la "Maps JavaScript API" de Google, se usará Google Maps.
window.MISAS_CONFIG = {
  googleMapsApiKey: "",
  googleMapId: "DEMO_MAP_ID", // crea un Map ID propio en Google Cloud para producción
  mapStyle: "https://tiles.openfreemap.org/styles/positron",
  center: [41.405, 2.17],
  zoom: 12
};
