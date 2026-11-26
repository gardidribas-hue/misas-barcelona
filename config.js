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
    nombre: "Misas Barcelona",
    correo: "misasbarcelona@gmail.com"   // también recibe los avisos si no hay formulario
  },

  // «¿Horario mal? Avísanos» (al lado de las misas de cada ficha y en p/) y botón «Avisar de un error».
  // Lo crea el script de Google /lanzamiento/formulario-avisos.gs, que imprime estos valores.
  // url: el enlace del Google Forms (el que acaba en /viewform).
  // campoParroquia: el «entry.123456789» de la lista de parroquias, para que la de la ficha ya salga elegida
  //   (las opciones son «Nombre · Municipio», las de data/avisos-parroquias.json).
  // hoja: la hoja de seguimiento de los avisos (solo para quien mantiene la web; la web no la usa).
  // Si no hay url, los enlaces abren un correo a contacto.correo.
  avisos: {
    url: "",
    campoParroquia: "",
    hoja: ""
  },

  // Analítica sin cookies con GoatCounter: el nombre elegido al darse de alta (el de https://NOMBRE.goatcounter.com).
  // Vacío = sin analítica.
  goatcounter: ""
};
