// Configuración de la web.
// Mapa: por defecto usa MapLibre con el estilo "Positron" de OpenFreeMap (gris y blanco)
// (vectorial, gratuito, sin clave y actualizado cada semana desde OpenStreetMap).
// Si pones una clave de la "Maps JavaScript API" de Google, se usará Google Maps.
window.MISAS_CONFIG = {
  googleMapsApiKey: "",
  googleMapId: "DEMO_MAP_ID", // crea un Map ID propio en Google Cloud para producción
  mapStyle: "https://tiles.openfreemap.org/styles/positron",
  center: [41.405, 2.17],
  zoom: 12,

  // Responsable de la web: sale en el aviso legal y la política de privacidad (legal.html).
  contacto: {
    nombre: "",   // p. ej. "Guillem …"
    correo: ""    // p. ej. "misasbarcelona@gmail.com"; también recibe los avisos si no hay formulario
  },

  // Botón «¿Horario mal? Avísanos» de cada ficha.
  // url: el enlace del Google Forms (el que acaba en /viewform).
  // campoParroquia / campoCodigo: los «entry.123456789» del enlace prerrellenado del formulario,
  // para que la parroquia ya salga escrita. Si no hay url, el botón abre un correo a contacto.correo.
  avisos: {
    url: "",
    campoParroquia: "",
    campoCodigo: ""
  },

  // Analítica sin cookies con GoatCounter: el nombre elegido al darse de alta (el de https://NOMBRE.goatcounter.com).
  // Vacío = sin analítica.
  goatcounter: ""
};
