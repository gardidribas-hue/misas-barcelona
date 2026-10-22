/* Horarios automáticos: mete en los datos de la web los horarios que la acción semanal «horarios»
   lee de las fuentes (data/horarios/horarios_app.js). Si un templo no tiene horario nuevo, la parroquia
   se queda como estaba; los templos marcados «Sin horario conocido» no se muestran. */
(function () {
  "use strict";
  const D = window.MISAS_DATA, H = window.MISAS_HORARIOS;
  if (!D || !H) return;
  const byId = new Map(D.parroquias.map((p) => [p.id, p]));
  const FIELDS = ["masses", "confessions", "adoration", "masses_text", "confessions_text", "adoration_text"];
  for (const t of Object.values(H.templos)) {
    if (t.horario.oculto || t.horario.estado === "sin horario") continue;
    let p = t.parroquia_id && byId.get(t.parroquia_id);
    if (!p) {
      p = { id: t.bcn_id, name: t.name, address: t.address, municipio: t.municipio, distrito: t.distrito || "",
            comunitat: "Sin comunidad pastoral", lat: t.lat, lng: t.lng, web: t.web, other: "" };
      D.parroquias.push(p);
      byId.set(p.id, p);
    }
    for (const f of FIELDS) p[f] = t[f];
    p.other = "";
    p.horario = t.horario;
  }
})();
