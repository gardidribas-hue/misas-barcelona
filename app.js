/* Misas Barcelona: chat, mapa y filtros en una misma pantalla. */
(function () {
  "use strict";

  const CFG = window.MISAS_CONFIG || {};
  const DATA = (window.MISAS_DATA && window.MISAS_DATA.parroquias) || [];
  const GEO = window.MISAS_GEO || { municipios: [], distritos: {} };
  const BARRIOS = window.MISAS_BARRIOS || {};
  const DAY_CODES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const LANG = { ca: "cat", es: "cast", "ca-es": "cat/cast", en: "en", fr: "fr", de: "de", it: "it", pl: "pl" };
  // ---------- Idiomas: castellano y catalán ----------
  const I18N = {
    es: {
      brandMain: "Misas", brandArch: "Archidiócesis de", tabHome: "Inicio", tabChat: "Chat", tabMap: "Mapa",
      eyebrow: "Archidiócesis de Barcelona · <span id=\"parishCount\">{n}</span> parroquias",
      heroTitle: "¿Dónde quieres ir a <em>misa</em>?",
      heroLede: "Dime dónde estás y a qué hora te va bien. También busco <strong><em>confesiones</em></strong> y <strong><em>adoración</em></strong>.",
      kindMass: "Misa", kindConf: "Confesión", kindAdor: "Adoración",
      lblDay: "Día", lblFrom: "Desde", lblTo: "Hasta", lblMun: "Municipio", lblLang: "Idioma", lblDist: "Distritos",
      langAny: "Cualquiera", langCa: "Catalán", langEs: "Castellano", langOther: "Otros idiomas",
      searchPh: "Nombre de la parroquia o calle", reset: "Quitar filtros", filtersList: "Filtros y lista",
      nearMe: "Cerca de mí", toTop: "Volver arriba", switchTo: "Canviar a català", loading: "Cargando parroquias…",
      days: { mon: "lunes", tue: "martes", wed: "miércoles", thu: "jueves", fri: "viernes", sat: "sábado", sun: "domingo" },
      dayShort: { mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D", hol: "F" },
      todayOpt: "Hoy ({d})", tomorrow: "Mañana", sunHol: "Domingo y festivos", anyDay: "Cualquier día",
      allMun: "Todos los municipios", byDist: " · por distritos", allBcn: "Toda Barcelona",
      kindPl: { mass: "misas", confession: "confesiones", adoration: "adoración" },
      today: "hoy", tomorrowL: "mañana", anyDayL: "cualquier día", onSun: "el domingo o festivo", onDay: "el {d}",
      fromT: ", desde las {t}", beforeT: ", antes de las {t}", rangeT: ", de {a} a {b}",
      nearYou: " cerca de ti", nearX: " cerca de {x}", inX: " en {x}",
      parish1: "parroquia", parishN: "parroquias", byDistance: ", de la más cercana a la más lejana", byTime: ", por orden de hora",
      seeAll: "Ver las {n} en el mapa", seeMap: "Ver en el mapa", seeMore: "Ver {n} más", seeLess: "Ver menos",
      noneChat: "No he encontrado nada. Prueba con otra hora («por la tarde»), otro día o una zona más amplia.",
      noneList: "No hay resultados. Amplía la franja horaria o quita algún filtro.",
      noLocation: "No puedo saber dónde estás. Dime el barrio, el distrito o el municipio, por ejemplo: «estoy en Sants».",
      noLocationMap: "No he podido acceder a tu ubicación.",
      think: { mass: "Buscando misas…", confession: "Buscando confesiones…", adoration: "Buscando adoración…", times: "Mirando horarios…" },
      soft: "confesión antes de misa o a petición", langOtherShort: "otro",
      back: "← Volver a la lista", district: "Distrito {d}", community: "Comunidad pastoral {c}",
      directions: "Cómo llegar", web: "Web", official: "Ficha oficial",
      hMass: "Misas", noMass: "Esta parroquia no publica horario de misas.", hConf: "Confesiones", hAdor: "Adoración eucarística", hOther: "Otras celebraciones",
      monSat: "Lun–Sáb", monFri: "Lun–Vie", sundays: "Domingos", districtLbl: "Distrito", youAreHere: "Estás aquí", askMore: "Pregunta otra cosa… ",
      ideas: ["Estoy en Gràcia y quiero ir a misa entre las 17 y las 20", "Misa el domingo por la mañana en Sarrià", "Confesiones el sábado en Sants", "Adoración hoy en el Eixample"],
      hints: ["Misa ahora cerca de mí", "Gràcia, entre las 17 y las 20", "Confesiones el sábado", "Adoración en el Eixample", "Domingo por la mañana en Sarrià", "Misa en castellano en Sants"]
    },
    ca: {
      brandMain: "Misses", brandArch: "Arxidiòcesi de", tabHome: "Inici", tabChat: "Xat", tabMap: "Mapa",
      eyebrow: "Arxidiòcesi de Barcelona · <span id=\"parishCount\">{n}</span> parròquies",
      heroTitle: "On vols anar a <em>missa</em>?",
      heroLede: "Digues-me on ets i a quina hora et va bé. També busco <strong><em>confessions</em></strong> i <strong><em>adoració</em></strong>.",
      kindMass: "Missa", kindConf: "Confessió", kindAdor: "Adoració",
      lblDay: "Dia", lblFrom: "Des de", lblTo: "Fins a", lblMun: "Municipi", lblLang: "Idioma", lblDist: "Districtes",
      langAny: "Qualsevol", langCa: "Català", langEs: "Castellà", langOther: "Altres idiomes",
      searchPh: "Nom de la parròquia o carrer", reset: "Treure filtres", filtersList: "Filtres i llista",
      nearMe: "A prop meu", toTop: "Tornar a dalt", switchTo: "Cambiar a castellano", loading: "Carregant parròquies…",
      days: { mon: "dilluns", tue: "dimarts", wed: "dimecres", thu: "dijous", fri: "divendres", sat: "dissabte", sun: "diumenge" },
      dayShort: { mon: "Dl", tue: "Dt", wed: "Dc", thu: "Dj", fri: "Dv", sat: "Ds", sun: "Dg", hol: "F" },
      todayOpt: "Avui ({d})", tomorrow: "Demà", sunHol: "Diumenge i festius", anyDay: "Qualsevol dia",
      allMun: "Tots els municipis", byDist: " · per districtes", allBcn: "Tot Barcelona",
      kindPl: { mass: "misses", confession: "confessions", adoration: "adoració" },
      today: "avui", tomorrowL: "demà", anyDayL: "qualsevol dia", onSun: "el diumenge o festiu", onDay: "el {d}",
      fromT: ", des de les {t}", beforeT: ", abans de les {t}", rangeT: ", de {a} a {b}",
      nearYou: " a prop teu", nearX: " a prop de {x}", inX: " a {x}",
      parish1: "parròquia", parishN: "parròquies", byDistance: ", de la més propera a la més llunyana", byTime: ", per ordre d'hora",
      seeAll: "Veure les {n} al mapa", seeMap: "Veure al mapa", seeMore: "Veure'n {n} més", seeLess: "Veure'n menys",
      noneChat: "No he trobat res. Prova amb una altra hora («a la tarda»), un altre dia o una zona més àmplia.",
      noneList: "No hi ha resultats. Amplia la franja horària o treu algun filtre.",
      noLocation: "No puc saber on ets. Digues-me el barri, el districte o el municipi, per exemple: «soc a Sants».",
      noLocationMap: "No he pogut accedir a la teva ubicació.",
      think: { mass: "Buscant misses…", confession: "Buscant confessions…", adoration: "Buscant adoració…", times: "Mirant horaris…" },
      soft: "confessió abans de missa o a petició", langOtherShort: "altre",
      back: "← Tornar a la llista", district: "Districte {d}", community: "Comunitat pastoral {c}",
      directions: "Com arribar-hi", web: "Web", official: "Fitxa oficial",
      hMass: "Misses", noMass: "Aquesta parròquia no publica horari de misses.", hConf: "Confessions", hAdor: "Adoració eucarística", hOther: "Altres celebracions",
      monSat: "Dl–Ds", monFri: "Dl–Dv", sundays: "Diumenges", districtLbl: "Districte", youAreHere: "Ets aquí", askMore: "Pregunta una altra cosa… ",
      ideas: ["Soc a Gràcia i vull anar a missa entre les 17 i les 20", "Missa diumenge al matí a Sarrià", "Confessions dissabte a Sants", "Adoració avui a l'Eixample"],
      hints: ["Missa ara a prop meu", "Gràcia, entre les 17 i les 20", "Confessions dissabte", "Adoració a l'Eixample", "Diumenge al matí a Sarrià", "Missa en català a Sants"]
    }
  };
  let LNG = (() => {
    try { const s = localStorage.getItem("misas-lang"); if (s === "es" || s === "ca") return s; } catch (e) { /* sin almacenamiento */ }
    return /^ca\b/i.test(navigator.language || "") ? "ca" : "es";
  })();
  const t = (key, vars) => {
    let s = I18N[LNG][key]; if (s == null) s = I18N.es[key];
    if (vars && typeof s === "string") s = s.replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
    return s;
  };
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  // Banderas redondas (SVG en línea, sin peticiones extra)
  const FLAG = {
    es: `<svg viewBox="0 0 24 24" aria-hidden="true"><clipPath id="fe"><circle cx="12" cy="12" r="12"/></clipPath><g clip-path="url(#fe)"><rect width="24" height="24" fill="#c60b1e"/><rect y="6" width="24" height="12" fill="#ffc400"/></g></svg>`,
    ca: `<svg viewBox="0 0 24 24" aria-hidden="true"><clipPath id="fc"><circle cx="12" cy="12" r="12"/></clipPath><g clip-path="url(#fc)"><rect width="24" height="24" fill="#fcdd09"/><g fill="#da121a"><rect y="2.67" width="24" height="2.67"/><rect y="8" width="24" height="2.67"/><rect y="13.33" width="24" height="2.67"/><rect y="18.67" width="24" height="2.67"/></g></g></svg>`
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[·’`]/g, "'");
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const km = (d) => d == null ? "" : d < 1 ? `${Math.round(d * 100) * 10} m` : `${d.toFixed(1).replace(".", ",")} km`;
  const title = (s) => s.replace(/(^|[\s-])(\S)/g, (m, a, c) => a + c.toUpperCase());

  // ---------- Hora de Barcelona ----------
  function nowBcn() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun" }[get("weekday")];
    return { day, min: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
  }
  const nextDay = (d) => DAY_CODES[(DAY_CODES.indexOf(d) + 1) % 7];
  const resolvedDay = (d) => d === "today" ? nowBcn().day : d === "tomorrow" ? nextDay(nowBcn().day) : d;

  // ---------- Búsqueda ----------
  const BLANK = { kind: "mass", day: "today", from: 0, to: 1439, mun: "", dist: "", lang: "", text: "" };
  const state = Object.assign({}, BLANK, { origin: null, user: null, results: [], mode: "home" });

  const eventsOf = (p, k) => k === "mass" ? p.masses : k === "confession" ? p.confessions : p.adoration;
  function dayMatch(ev, day) {
    if (day === "any") return true;
    if (day === "sun") return ev.days.includes("sun") || ev.days.includes("hol");
    return ev.days.includes(day);
  }
  function langMatch(ev, lang) {
    if (!lang) return true;
    const l = ev.lang || "";
    if (lang === "other") return !!l && !["ca", "es", "ca-es"].includes(l);
    return l === lang || l === "ca-es";
  }
  function timeMatch(ev, from, to) {
    const s = toMin(ev.start), e = ev.end ? toMin(ev.end) : s;
    return e >= from && s <= to;
  }
  const ON_REQUEST = /(antes|abans|despres|despues|durant|durante|peticio|petici|demana|solicit|cita|cada missa|cada misa|concertar)/;

  function matchParish(p, f) {
    const day = resolvedDay(f.day);
    let hits = (eventsOf(p, f.kind) || []).filter((ev) => dayMatch(ev, day) && timeMatch(ev, f.from, f.to) && (f.kind !== "mass" || langMatch(ev, f.lang)));
    let soft = false;
    if (f.kind === "confession" && !hits.length && ON_REQUEST.test(norm(p.confessions_text))) {
      const masses = p.masses.filter((ev) => dayMatch(ev, day) && timeMatch(ev, f.from, f.to + 30));
      if (masses.length) { hits = masses; soft = true; }
    }
    return { hits, soft };
  }
  function zoneMatch(p, f) {
    if (f.mun && p.municipio !== f.mun) return false;
    if (f.dist && p.distrito !== f.dist) return false;
    if (f.text) {
      const hay = norm([p.name, p.address, p.municipio, p.distrito].join(" "));
      if (!norm(f.text).split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  }
  function distKm(a, b) {
    const R = 6371, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function search(f, origin) {
    const out = [];
    for (const p of DATA) {
      if (!zoneMatch(p, f)) continue;
      const m = matchParish(p, f);
      if (!m.hits.length) continue;
      out.push({ p, hits: m.hits, soft: m.soft, d: origin && p.lat != null ? distKm(origin, [p.lat, p.lng]) : null });
    }
    out.sort((a, b) => (a.soft - b.soft) || (origin ? (a.d ?? 99) - (b.d ?? 99) : toMin(a.hits[0].start) - toMin(b.hits[0].start) || a.p.name.localeCompare(b.p.name)));
    return out;
  }

  // ---------- Áreas (municipios y distritos) ----------
  const areaOf = (mun, dist) => {
    if (dist) return (GEO.distritos[mun] || []).find((d) => d.name === dist) || null;
    if (mun) return GEO.municipios.find((m) => m.name === mun) || null;
    return null;
  };

  // ---------- Lenguaje natural ----------
  const WEEKDAYS = [
    ["mon", /\b(lunes|dilluns)\b/], ["tue", /\b(martes|dimarts)\b/], ["wed", /\b(miercoles|dimecres)\b/],
    ["thu", /\b(jueves|dijous)\b/], ["fri", /\b(viernes|divendres)\b/], ["sat", /\b(sabado|dissabte)\b/],
    ["sun", /\b(domingo|diumenge|festivo|festiu|festius|festivos)\b/]
  ];
  function parseHour(h, m, ctx, pm) {
    let H = Number(h); const M = Number(m || 0);
    if (/(tarde|noche|nit|vespre|tarda|pm)/.test(ctx) && H < 12) H += 12;
    else if (pm && H >= 1 && H <= 7) H += 12; // «a las 5» casi siempre es por la tarde
    return Math.min(H, 23) * 60 + Math.min(M, 59);
  }
  const zoneIndex = (() => {
    const items = [], add = (key, z) => { const k = norm(key).trim(); if (k.length >= 3) items.push([k, z]); };
    for (const m of GEO.municipios) {
      if (m.name === "Barcelona") continue;
      add(m.name, { type: "mun", name: m.name });
      const short = m.name.replace(/^(l'|el |la |les )/i, "").replace(/ de (llobregat|besos|besòs|gramenet|mar|dalt|montalt)$/i, "");
      if (short !== m.name && short.length > 4) add(short, { type: "mun", name: m.name });
    }
    add("hospitalet", { type: "mun", name: "L'Hospitalet de Llobregat" });
    for (const d of GEO.distritos.Barcelona || []) {
      add(d.name, { type: "dist", name: d.name, mun: "Barcelona" });
      for (const part of d.name.split("-")) if (part.length > 4 && !BARRIOS[norm(part)]) add(part, { type: "dist", name: d.name, mun: "Barcelona" });
    }
    for (const [name, c] of Object.entries(BARRIOS)) add(name, { type: "barrio", name, center: c });
    for (const p of DATA) {
      const n = norm(p.name).replace(/^parroquia (de |de la )?/, "").replace(/,.*$/, "").replace(/\(.*\)/, "").trim();
      if (n.length > 6) add(n, { type: "parish", name: p.name, id: p.id, center: p.lat != null ? [p.lat, p.lng] : null });
    }
    items.sort((a, b) => b[0].length - a[0].length);
    return items;
  })();
  function findZone(q) {
    const pad = ` ${q} `;
    for (const [k, z] of zoneIndex) {
      if (new RegExp(`[^a-z0-9]${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^a-z0-9]`).test(pad)) return z;
    }
    return null;
  }
  function parseQuery(text) {
    const q = norm(text);
    const f = Object.assign({}, BLANK);
    if (/confes|penitencia|reconcilia/.test(q)) f.kind = "confession";
    else if (/adora|santisim|exposicio|exposicion|hora santa/.test(q)) f.kind = "adoration";

    if (/pasado manana|passat dema/.test(q)) f.day = nextDay(nextDay(nowBcn().day));
    else if (/(^|[^a-z])(dema|manana)([^a-z]|$)/.test(q.replace(/(por|de|a|en) la manana/g, " ").replace(/del dema/g, " "))) f.day = "tomorrow";
    for (const [code, re] of WEEKDAYS) if (re.test(q)) f.day = code;
    if (/fin de semana|cap de setmana/.test(q) && f.day === "today") f.day = "sun";
    if (/(cualquier|qualsevol) dia/.test(q) && f.day === "today") f.day = "any";

    const morning = /(por|de|a|en) la manana|al mati|pel mati|del mati|matinal/.test(q);
    const H = "(\\d{1,2})(?:[:.h](\\d{2}))?\\s*h?";
    let m;
    if ((m = q.match(new RegExp(`(?:entre|de|desde)\\s+(?:las|la|les)?\\s*${H}.*?\\s(?:y|i|a|hasta|fins)\\s+(?:las|la|les)?\\s*${H}`)))) {
      f.from = parseHour(m[1], m[2], q, !morning); f.to = parseHour(m[3], m[4], q, !morning);
      if (f.to < f.from) f.to = Math.min(f.to + 720, 1439);
    } else if ((m = q.match(new RegExp(`(?:a partir de|despues de|desde|des de)\\s+(?:las|la|les)?\\s*${H}`)))) {
      f.from = parseHour(m[1], m[2], q, !morning); f.to = 1439;
    } else if ((m = q.match(new RegExp(`(?:antes de|abans de)\\s+(?:las|la|les)?\\s*${H}`)))) {
      f.from = 0; f.to = parseHour(m[1], m[2], q, !morning);
    } else if ((m = q.match(new RegExp(`(?:a las|sobre las|hacia las|cap a les|a les)\\s*${H}`)))) {
      const t = parseHour(m[1], m[2], q, !morning); f.from = Math.max(0, t - 30); f.to = Math.min(1439, t + 30);
    } else if (/(por|de|a) la manana|al mati|pel mati|del mati/.test(q)) { f.from = 420; f.to = 780; }
    else if (/mediodia|migdia/.test(q)) { f.from = 720; f.to = 900; }
    else if (/(por|a|de) la tarde|a la tarda|per la tarda|aquesta tarda|esta tarde/.test(q)) { f.from = 960; f.to = 1260; }
    else if (/noche|nit|vespre/.test(q)) { f.from = 1200; f.to = 1439; }
    else if (/ahora|ara mateix|ya mismo|cuanto antes|pronto|en un rato/.test(q) || f.day === "today") { f.from = nowBcn().min; f.to = 1439; }
    if (/catalan|catala/.test(q)) f.lang = "ca";
    else if (/castellano|espanol|castella/.test(q)) f.lang = "es";

    const near = /cerca de mi|aprop meu|a prop meu|donde estoy|on soc|mi ubicacion|aqui/.test(q);
    return { f, zone: near ? null : findZone(q), near };
  }

  // ---------- Mapa: MapLibre (vectorial, gratis) o Google Maps si hay clave ----------
  const css = (name) => getComputedStyle(document.querySelector(".mapcol")).getPropertyValue(name).trim();
  const EMPTY = { type: "FeatureCollection", features: [] };
  const toFC = (areas) => ({ type: "FeatureCollection", features: areas.map((a) => ({ type: "Feature", properties: { name: a.name }, geometry: a.geometry })) });
  const MapView = { markers: new Map(), ready: false };

  function pinEl(p) {
    const el = document.createElement("button");
    el.type = "button"; el.className = "pin"; el.title = p.name; el.setAttribute("aria-label", p.name);
    el.addEventListener("click", (e) => { e.stopPropagation(); openDetail(p.id, false); });
    return el;
  }
  function boundsOf(geoms) {
    let w = 180, s = 90, e = -180, n = -90;
    for (const g of geoms) for (const poly of g.coordinates) for (const c of poly[0]) {
      w = Math.min(w, c[0]); e = Math.max(e, c[0]); s = Math.min(s, c[1]); n = Math.max(n, c[1]);
    }
    return [[w, s], [e, n]];
  }

  function initMapLibre() {
    const map = new maplibregl.Map({ container: "map", style: CFG.mapStyle, center: [CFG.center[1], CFG.center[0]], zoom: CFG.zoom, attributionControl: { compact: true } });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    let loaded = false, pending = [];
    const whenLoaded = (fn) => loaded ? fn() : pending.push(fn);
    map.on("load", () => {
      map.addSource("outlines", { type: "geojson", data: EMPTY });
      map.addSource("area", { type: "geojson", data: EMPTY });
      map.addLayer({ id: "outlines-fill", type: "fill", source: "outlines", paint: { "fill-color": css("--area-line"), "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.14, 0.02] } });
      map.addLayer({ id: "outlines-line", type: "line", source: "outlines", paint: { "line-color": css("--area-line"), "line-width": 1, "line-opacity": 0.55, "line-dasharray": [2, 2] } });
      map.addLayer({ id: "area-fill", type: "fill", source: "area", paint: { "fill-color": css("--area-line"), "fill-opacity": 0.26 } });
      map.addLayer({ id: "area-line", type: "line", source: "area", paint: { "line-color": css("--area-line"), "line-width": 2.5 } });
      MapView.recolor = () => {
        const c = css("--area-line");
        ["outlines-fill", "area-fill"].forEach((id) => map.setPaintProperty(id, "fill-color", c));
        ["outlines-line", "area-line"].forEach((id) => map.setPaintProperty(id, "line-color", c));
      };
      let hover = null;
      map.on("mousemove", "outlines-fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const id = e.features[0].id;
        if (hover !== null && hover !== id) map.setFeatureState({ source: "outlines", id: hover }, { hover: false });
        hover = id; map.setFeatureState({ source: "outlines", id }, { hover: true });
      });
      map.on("mouseleave", "outlines-fill", () => { map.getCanvas().style.cursor = ""; if (hover !== null) map.setFeatureState({ source: "outlines", id: hover }, { hover: false }); hover = null; });
      map.on("click", "outlines-fill", (e) => MapView.onAreaClick && MapView.onAreaClick(e.features[0].properties.name));
      loaded = true; pending.forEach((fn) => fn()); pending = [];
      $("map").classList.add("ready");
      MapView.onLoad && MapView.onLoad();
    });
    let me = null;
    Object.assign(MapView, {
      setMarkers(list) {
        const ids = new Set(list.map((p) => p.id));
        for (const [id, mk] of MapView.markers) if (!ids.has(id)) { mk.remove(); MapView.markers.delete(id); }
        for (const p of list) {
          if (p.lat == null || MapView.markers.has(p.id)) continue;
          MapView.markers.set(p.id, new maplibregl.Marker({ element: pinEl(p) }).setLngLat([p.lng, p.lat]).addTo(map));
        }
      },
      highlight(id) {
        for (const [pid, mk] of MapView.markers) {
          const el = mk.getElement(), on = pid === id;
          el.classList.toggle("on", on);
          el.textContent = on ? DATA.find((x) => x.id === pid).name : "";
        }
      },
      setArea(area, outlines) {
        whenLoaded(() => {
          const fc = toFC(outlines || []);
          fc.features.forEach((f, i) => { f.id = i + 1; });
          map.getSource("outlines").setData(fc);
          map.getSource("area").setData(area ? toFC([area]) : EMPTY);
        });
        if (area) map.fitBounds(boundsOf([area.geometry]), { padding: 50, maxZoom: 15, duration: 700 });
        else if (outlines && outlines.length) map.fitBounds(boundsOf(outlines.map((o) => o.geometry)), { padding: 40, duration: 700 });
      },
      focus(p) { if (p.lat != null) map.easeTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 15), duration: 600 }); },
      fit(list, origin) {
        const pts = list.filter((p) => p.lat != null).map((p) => [p.lng, p.lat]);
        if (origin) pts.push([origin[1], origin[0]]);
        if (!pts.length) return;
        const b = pts.reduce((bb, c) => bb.extend(c), new maplibregl.LngLatBounds(pts[0], pts[0]));
        map.fitBounds(b, { padding: 70, maxZoom: 15, duration: 600 });
      },
      showUser(ll) {
        if (me) me.remove();
        const el = document.createElement("div"); el.className = "pin me"; el.title = t("youAreHere");
        me = new maplibregl.Marker({ element: el }).setLngLat([ll[1], ll[0]]).addTo(map);
      },
      resize() { map.resize(); }
    });
  }

  function initGoogle() {
    return new Promise((resolve, reject) => {
      window.__gmReady = resolve;
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CFG.googleMapsApiKey)}&v=weekly&libraries=marker&loading=async&callback=__gmReady`;
      s.async = true; s.onerror = reject;
      document.head.appendChild(s);
    }).then(() => {
      const map = new google.maps.Map($("map"), { center: { lat: CFG.center[0], lng: CFG.center[1] }, zoom: CFG.zoom, mapId: CFG.googleMapId || "DEMO_MAP_ID", streetViewControl: false, mapTypeControl: false, fullscreenControl: false });
      const outlines = new google.maps.Data({ map }), area = new google.maps.Data({ map });
      MapView.recolor = () => {
        const line = css("--area-line");
        outlines.setStyle({ fillColor: line, fillOpacity: 0.03, strokeColor: line, strokeOpacity: 0.6, strokeWeight: 1, clickable: true });
        area.setStyle({ fillColor: line, fillOpacity: 0.26, strokeColor: line, strokeWeight: 2.5, clickable: false });
      };
      MapView.recolor();
      google.maps.event.addListenerOnce(map, "tilesloaded", () => { $("map").classList.add("ready"); MapView.onLoad && MapView.onLoad(); });
      outlines.addListener("mouseover", (e) => outlines.overrideStyle(e.feature, { fillOpacity: 0.14 }));
      outlines.addListener("mouseout", () => outlines.revertStyle());
      outlines.addListener("click", (e) => MapView.onAreaClick && MapView.onAreaClick(e.feature.getProperty("name")));
      const gBounds = (geoms) => { const [[w, s], [e, n]] = boundsOf(geoms); return { west: w, south: s, east: e, north: n }; };
      let me = null;
      Object.assign(MapView, {
        setMarkers(list) {
          const ids = new Set(list.map((p) => p.id));
          for (const [id, mk] of MapView.markers) if (!ids.has(id)) { mk.map = null; MapView.markers.delete(id); }
          for (const p of list) {
            if (p.lat == null || MapView.markers.has(p.id)) continue;
            MapView.markers.set(p.id, new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: p.lat, lng: p.lng }, title: p.name, content: pinEl(p) }));
          }
        },
        highlight(id) {
          for (const [pid, mk] of MapView.markers) {
            const el = mk.content, on = pid === id;
            el.classList.toggle("on", on);
            el.textContent = on ? DATA.find((x) => x.id === pid).name : "";
            mk.zIndex = on ? 10 : null;
          }
        },
        setArea(a, outs) {
          outlines.forEach((f) => outlines.remove(f)); area.forEach((f) => area.remove(f));
          if (outs && outs.length) outlines.addGeoJson(toFC(outs));
          if (a) { area.addGeoJson(toFC([a])); map.fitBounds(gBounds([a.geometry]), 50); }
          else if (outs && outs.length) map.fitBounds(gBounds(outs.map((o) => o.geometry)), 40);
        },
        focus(p) { if (p.lat != null) { map.panTo({ lat: p.lat, lng: p.lng }); if (map.getZoom() < 15) map.setZoom(15); } },
        fit(list, origin) {
          const b = new google.maps.LatLngBounds(); let n = 0;
          for (const p of list) if (p.lat != null) { b.extend({ lat: p.lat, lng: p.lng }); n++; }
          if (origin) { b.extend({ lat: origin[0], lng: origin[1] }); n++; }
          if (n === 1) { map.setCenter(b.getCenter()); map.setZoom(15); } else if (n) map.fitBounds(b, 70);
        },
        showUser(ll) {
          if (me) me.map = null;
          const el = document.createElement("div"); el.className = "pin me";
          me = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: ll[0], lng: ll[1] }, title: t("youAreHere"), content: el });
        },
        resize() {}
      });
    });
  }

  async function initMap() {
    try {
      if (CFG.googleMapsApiKey) await initGoogle(); else if (window.maplibregl) initMapLibre();
    } catch (e) {
      console.warn("Google Maps no disponible; uso el mapa vectorial", e);
      if (window.maplibregl) initMapLibre();
    }
    MapView.ready = true;
    MapView.onAreaClick = (name) => { state.dist = name; state.origin = null; setMode("map"); applyFilters(); };
  }

  // ---------- Modos ----------
  const calm = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function setMode(mode) {
    if (state.mode === mode && $("stage").dataset.mode === mode) return;
    const apply = () => {
      state.mode = mode;
      $("stage").dataset.mode = mode;
      document.querySelectorAll(".tabs button, .bottomnav button").forEach((b) => b.classList.toggle("on", b.dataset.go === mode));
      document.dispatchEvent(new Event("misas:mode"));
      MapView.resize && MapView.resize();
      if (state.pendingFit && mode !== "chat") refit();
    };
    // Transición suave entre vistas (las ventanas se mueven y cambian de tamaño).
    if (document.startViewTransition && !calm()) {
      const t = document.startViewTransition(apply);
      t.finished.then(() => MapView.resize && MapView.resize()).catch(() => {});
    } else {
      apply();
      requestAnimationFrame(() => MapView.resize && MapView.resize());
    }
    if (mode === "chat") setTimeout(() => $("chatInput").focus({ preventScroll: true }), 80);
  }

  // ---------- Pintar resultados ----------
  function timesHtml(r, kind, day) {
    if (r.soft) return `<span class="t note">${t("soft")}</span>` + r.hits.map((h) => `<span class="t hit">${h.start}</span>`).join("");
    const hit = new Set(r.hits);
    return (eventsOf(r.p, kind) || []).filter((ev) => dayMatch(ev, day))
      .map((ev) => `<span class="t ${hit.has(ev) ? "hit" : ""}">${ev.start}${ev.end ? "–" + ev.end : ""}${ev.lang ? `<small>${LANG[ev.lang] || (ev.lang === "other" ? t("langOtherShort") : ev.lang)}</small>` : ""}</span>`).join("");
  }
  function cardHtml(r, kind, day) {
    const p = r.p;
    const where = p.municipio === "Barcelona" ? p.distrito : p.municipio;
    return `<li class="card" data-id="${esc(p.id)}" tabindex="0">
      <span class="name">${esc(p.name)}</span>
      <span class="dist">${km(r.d)}</span>
      <span class="where">${esc(where || p.address || "")}</span>
      <span class="times">${timesHtml(r, kind, day)}</span>
    </li>`;
  }

  function describe(f, zone, near) {
    const day = resolvedDay(f.day);
    const dayTxt = f.day === "today" ? t("today") : f.day === "tomorrow" ? t("tomorrowL") : f.day === "any" ? t("anyDayL") : day === "sun" ? t("onSun") : t("onDay", { d: t("days")[day] });
    const tm = f.from === 0 && f.to >= 1439 ? "" : f.to >= 1439 ? t("fromT", { t: fmt(f.from) }) : f.from === 0 ? t("beforeT", { t: fmt(f.to) }) : t("rangeT", { a: fmt(f.from), b: fmt(f.to) });
    const where = near ? t("nearYou") : zone && zone.type === "barrio" ? t("nearX", { x: title(zone.name) }) : f.dist ? t("inX", { x: f.dist }) : f.mun ? t("inX", { x: f.mun }) : zone ? t("nearX", { x: zone.name }) : "";
    return `<strong>${cap(t("kindPl")[f.kind])}</strong> ${dayTxt}${tm}<em>${esc(where)}</em>`;
  }
  const nParishes = (n) => `${n} ${n === 1 ? t("parish1") : t("parishN")}`;

  function computeResults(f, origin) {
    let res = search(f, origin);
    if (origin && !f.mun && !f.dist) {
      const close = res.filter((r) => r.d != null && r.d <= 2.5);
      res = close.length >= 3 ? close : res.filter((r) => r.d != null && r.d <= 7);
    }
    return res;
  }

  // Lleva unos filtros al mapa y a la lista lateral.
  function showOnMap(f, origin, res, fit = true) {
    Object.assign(state, f, { origin, results: res });
    syncControls();
    renderList();
    if (!MapView.setMarkers) return;
    const ps = res.map((r) => r.p);
    MapView.setMarkers(ps);
    const area = areaOf(state.dist ? "Barcelona" : state.mun, state.dist);
    const outlines = state.mun === "Barcelona" || state.dist ? GEO.distritos.Barcelona : null;
    MapView.setArea(area, outlines);
    if (fit) {
      // Si el mapa está oculto (vista de chat), el encuadre se hace al mostrarlo.
      if ($("map").offsetWidth) refit(); else state.pendingFit = true;
    }
    showOnMapLabel();
  }
  function showOnMapLabel() {
    const lbl = $("mapLabel");
    lbl.innerHTML = state.dist ? `${t("districtLbl")} <em>${esc(state.dist)}</em>` : state.mun ? `<em>${esc(state.mun)}</em>` : "";
  }

  function refit() {
    state.pendingFit = false;
    if (!MapView.fit) return;
    const area = areaOf(state.dist ? "Barcelona" : state.mun, state.dist);
    if (area || state.mun === "Barcelona") { MapView.setArea(area, state.mun === "Barcelona" || state.dist ? GEO.distritos.Barcelona : null); return; }
    MapView.fit(state.results.map((r) => r.p).slice(0, state.origin ? 10 : state.results.length), state.origin);
  }

  const nearUser = () => !!(state.origin && state.user && state.origin === state.user);
  function renderList() {
    const res = state.results, day = resolvedDay(state.day);
    $("summary").innerHTML = `<strong>${res.length}</strong> ${res.length === 1 ? t("parish1") : t("parishN")} · ${describe(state, null, nearUser()).replace(/<\/?strong>/g, "")}`;
    $("list").innerHTML = res.length ? res.slice(0, 300).map((r) => cardHtml(r, state.kind, day)).join("")
      : `<li class="empty">${t("noneList")}</li>`;
    observeReveal($("list").querySelectorAll(".card"));
  }

  // Aparición suave de las tarjetas al hacer scroll
  const revealer = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); revealer.unobserve(e.target); }
  }, { rootMargin: "0px 0px -24px 0px", threshold: 0.05 }) : null;
  function observeReveal(els) {
    if (!revealer || calm()) return;
    els.forEach((el, i) => { el.classList.add("rv"); el.style.setProperty("--d", `${Math.min(i, 6) * 40}ms`); revealer.observe(el); });
  }

  // ---------- Chat ----------
  const wait = (ms) => new Promise((r) => setTimeout(r, calm() ? 0 : ms));
  function scrollChat() {
    const sc = $("chatScroll");
    sc.scrollTo({ top: sc.scrollHeight, behavior: calm() ? "auto" : "smooth" });
  }
  // Pregunta del usuario y un indicador de "pensando"; devuelve el contenedor de la respuesta.
  function startTurn(question, kind) {
    const thread = $("thread");
    foldPrevious();
    $("stage").classList.add("has-thread");
    const q = document.createElement("div"); q.className = "q"; q.textContent = question; thread.appendChild(q);
    const a = document.createElement("div"); a.className = "a pending"; a.dataset.kind = kind;
    const lines = [t("think")[kind] || t("think").mass, t("think").times];
    a.innerHTML = `<div class="thinking"><span class="dots"><i></i><i></i><i></i></span><span class="say">${lines[0]}</span></div>
      <ul class="cards ghost"><li class="skel"></li><li class="skel"></li></ul>`;
    thread.appendChild(a);
    let k = 0;
    a._timer = setInterval(() => { const s = a.querySelector(".say"); if (s) s.textContent = lines[++k % lines.length]; }, 900);
    requestAnimationFrame(scrollChat);
    return a;
  }
  async function finishTurn(a, html) {
    await wait(650 + Math.random() * 350);
    clearInterval(a._timer);
    a.classList.remove("pending");
    a.innerHTML = html;
    a.querySelectorAll(".cards .card").forEach((c, i) => c.style.setProperty("--i", i));
    const row = a.querySelector(".row"); if (row) row.style.setProperty("--n", a.querySelectorAll(".cards .card").length);
    // Acompaña el despliegue de la respuesta con el scroll.
    scrollChat(); setTimeout(scrollChat, 350); setTimeout(scrollChat, 800);
  }
  // Muestra dos resultados con un difuminado; «Ver más» despliega el resto.
  const PEEK = 2;
  const CHEV = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function setFold(a, open) {
    const fold = a.querySelector(".fold"); if (!fold) return;
    const ul = fold.querySelector(".cards"), cards = ul.querySelectorAll(".card"), btn = a.querySelector(".more");
    const peek = cards[PEEK] ? cards[PEEK].offsetTop - ul.offsetTop + 44 : ul.scrollHeight;
    ul.style.maxHeight = (open ? ul.scrollHeight : peek) + "px";
    fold.classList.toggle("closed", !open);
    if (btn) {
      btn.setAttribute("aria-expanded", open);
      btn.innerHTML = (open ? t("seeLess") : t("seeMore", { n: cards.length - PEEK })) + CHEV;
    }
    if (open) setTimeout(() => { if (!fold.classList.contains("closed")) ul.style.maxHeight = "none"; }, 520);
  }
  function foldPrevious() {
    document.querySelectorAll("#thread .q").forEach((q) => q.classList.add("old"));
    document.querySelectorAll("#thread .a .fold").forEach((fold) => {
      const a = fold.closest(".a"), ul = fold.querySelector(".cards");
      if (fold.classList.contains("closed")) return;
      ul.style.maxHeight = ul.scrollHeight + "px"; ul.offsetHeight; // parte de la altura actual para animar
      setFold(a, false);
    });
  }
  async function addTurn(a, res, f, zone, near, origin) {
    const day = resolvedDay(f.day), shown = 6;
    await finishTurn(a, res.length
      ? `<div class="head">${describe(f, zone, near)}</div>
         <div class="meta">${nParishes(res.length)}${origin ? t("byDistance") : t("byTime")}</div>
         <div class="fold"><ul class="cards">${res.slice(0, shown).map((r) => cardHtml(r, f.kind, day)).join("")}</ul></div>
         ${Math.min(res.length, shown) > PEEK ? `<button type="button" class="more" aria-expanded="false"></button>` : ""}
         <div class="row"><button type="button" class="pill accent see-map">${res.length > shown ? t("seeAll", { n: res.length }) : t("seeMap")}</button></div>`
      : `<div class="head">${describe(f, zone, near)}</div><p class="empty">${t("noneChat")}</p>`);
    if (a.querySelector(".more")) {
      setFold(a, false);
      a.querySelector(".more").onclick = () => setFold(a, a.querySelector(".fold").classList.contains("closed"));
    }
    const btn = a.querySelector(".see-map");
    if (btn) btn.onclick = () => { showOnMap(f, origin, res); closeDetail(); setMode("map"); };
    a.querySelectorAll(".card").forEach((c) => c.onclick = () => { showOnMap(f, origin, res); setMode("map"); openDetail(c.dataset.id); });
  }

  async function ask(text) {
    text = text.trim();
    if (!text) return;
    setMode("chat");
    const { f, zone, near } = parseQuery(text);
    const a = startTurn(text, f.kind);
    let origin = null;
    if (near) {
      try { origin = await locate(); }
      catch (e) {
        await finishTurn(a, `<p class="empty">${t("noLocation")}</p>`);
        return;
      }
    }
    if (zone && zone.type === "dist") { f.mun = zone.mun; f.dist = zone.name; }
    else if (zone && zone.type === "mun") f.mun = zone.name;
    else if (zone && zone.center) origin = zone.center;
    const res = computeResults(f, origin);
    showOnMap(f, origin, res); // el mapa queda preparado por si el usuario cambia de vista
    await addTurn(a, res, f, zone, near, origin);
  }

  function locate() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("sin geolocalización"));
      navigator.geolocation.getCurrentPosition((pos) => {
        state.user = [pos.coords.latitude, pos.coords.longitude];
        if (MapView.showUser) MapView.showUser(state.user);
        resolve(state.user);
      }, reject, { enableHighAccuracy: true, timeout: 10000 });
    });
  }

  // ---------- Ficha ----------
  function schedule(evs) {
    if (!evs.length) return "";
    const groups = new Map();
    for (const ev of evs) { const k = ev.days.join(","); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(ev); }
    const wk = ["mon", "tue", "wed", "thu", "fri"];
    return `<dl class="sched">${[...groups].map(([k, list]) => {
      const d = k.split(",");
      const label = wk.every((x) => d.includes(x)) && d.includes("sat") && !d.includes("sun") ? t("monSat")
        : wk.every((x) => d.includes(x)) && d.length === 5 ? t("monFri")
        : d.every((x) => x === "sun" || x === "hol") ? t("sundays") : d.map((x) => t("dayShort")[x]).join(" ");
      return `<dt>${label}</dt><dd>${list.map((ev) => `<span class="t" ${ev.note ? `title="${esc(ev.note)}"` : ""}>${ev.start}${ev.end ? "–" + ev.end : ""}${ev.lang ? `<small>${LANG[ev.lang] || (ev.lang === "other" ? t("langOtherShort") : ev.lang)}</small>` : ""}</span>`).join("")}</dd>`;
    }).join("")}</dl>`;
  }

  function openDetail(id, focus = true) {
    const p = DATA.find((x) => x.id === id);
    if (!p) return;
    if (state.mode !== "map") setMode("map");
    document.querySelectorAll("#list .card").forEach((c) => c.classList.toggle("sel", c.dataset.id === id));
    if (MapView.highlight) {
      if (!MapView.markers.has(id)) MapView.setMarkers(state.results.map((r) => r.p).concat([p]));
      MapView.highlight(id);
    }
    const dest = p.lat != null ? `${p.lat},${p.lng}` : encodeURIComponent(`${p.name}, ${p.address || ""}, ${p.municipio || ""}`);
    const box = $("detail");
    box.innerHTML = `
      <button type="button" class="pill" id="closeDetail" style="align-self:flex-start">${t("back")}</button>
      <h2>${esc(p.name)}</h2>
      <p class="addr">${esc([p.address, p.municipio].filter(Boolean).join(", "))}<em>${esc(p.distrito ? t("district", { d: p.distrito }) : "")}${p.distrito && !/^Sin /.test(p.comunitat) ? " · " : ""}${esc(!/^Sin /.test(p.comunitat) ? t("community", { c: p.comunitat }) : "")}</em></p>
      <div class="actions">
        <a class="btn primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${dest}">${t("directions")}</a>
        ${p.phone ? `<a class="btn" href="tel:${esc(p.phone.replace(/\s/g, ""))}">${esc(p.phone)}</a>` : ""}
        ${p.web ? `<a class="btn" target="_blank" rel="noopener" href="${esc(p.web)}">${t("web")}</a>` : ""}
        ${p.url ? `<a class="btn" target="_blank" rel="noopener" href="${esc(p.url)}">${t("official")}</a>` : ""}
      </div>
      <h3>${t("hMass")}</h3>
      ${schedule(p.masses) || `<p class="note">${t("noMass")}</p>`}
      ${p.masses_text ? `<p class="note">${esc(p.masses_text)}</p>` : ""}
      ${p.confessions.length || p.confessions_text ? `<h3>${t("hConf")}</h3>${schedule(p.confessions)}${p.confessions_text ? `<p class="note">${esc(p.confessions_text)}</p>` : ""}` : ""}
      ${p.adoration.length || p.adoration_text ? `<h3>${t("hAdor")}</h3>${schedule(p.adoration)}${p.adoration_text ? `<p class="note">${esc(p.adoration_text)}</p>` : ""}` : ""}
      ${p.other ? `<h3>${t("hOther")}</h3><p class="note">${esc(p.other)}</p>` : ""}`;
    box.hidden = false; state.detailId = id;
    observeReveal(box.querySelectorAll("h3, .sched, .note"));
    $("filters").hidden = true; $("summary").hidden = true; $("list").hidden = true;
    $("side").scrollTop = 0;
    $("closeDetail").onclick = closeDetail;
    if (focus && MapView.focus) MapView.focus(p);
  }
  function closeDetail() {
    $("detail").hidden = true; state.detailId = null;
    $("filters").hidden = false; $("summary").hidden = false; $("list").hidden = false;
    if (MapView.highlight) MapView.highlight(null);
  }

  // ---------- Filtros ----------
  function fillSelects() {
    const n = nowBcn(), D = t("days");
    $("fDay").innerHTML = `<option value="today">${t("todayOpt", { d: D[n.day] })}</option><option value="tomorrow">${t("tomorrow")}</option>` +
      DAY_CODES.map((d) => `<option value="${d}">${d === "sun" ? t("sunHol") : cap(D[d])}</option>`).join("") + `<option value="any">${t("anyDay")}</option>`;
    const hours = []; for (let h = 0; h < 24; h++) for (const m of [0, 30]) hours.push(h * 60 + m);
    $("fFrom").innerHTML = hours.map((m) => `<option value="${m}">${fmt(m)}</option>`).join("");
    $("fTo").innerHTML = hours.map((m) => `<option value="${m + 29}">${fmt(m + 29)}</option>`).join("");
    const counts = {};
    for (const p of DATA) counts[p.municipio] = (counts[p.municipio] || 0) + 1;
    $("fMun").innerHTML = `<option value="">${t("allMun")}</option>` + Object.keys(counts).filter(Boolean).sort((a, b) => a.localeCompare(b, "ca"))
      .map((m) => `<option value="${esc(m)}">${esc(m)}${GEO.distritos[m] ? t("byDist") : ""} (${counts[m]})</option>`).join("");
    const dists = GEO.distritos.Barcelona || [];
    $("distChips").innerHTML = `<button type="button" data-dist="">${t("allBcn")}</button>` + dists.map((d) => `<button type="button" data-dist="${esc(d.name)}">${esc(d.name)}</button>`).join("");
  }

  // Textos fijos de la página en el idioma elegido
  function applyLang() {
    document.documentElement.lang = LNG;
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml, { n: DATA.length }); });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    const other = LNG === "es" ? "ca" : "es";
    $("langBtn").innerHTML = `${FLAG[LNG]}<span>${LNG.toUpperCase()}</span>`;
    $("langBtn").title = t("switchTo"); $("langBtn").setAttribute("aria-label", t("switchTo"));
    $("langBtn").dataset.next = other;
    $("ideas").innerHTML = t("ideas").map((q) => `<li><button type="button">${esc(q)}</button></li>`).join("");
  }
  function setLang(l) {
    LNG = l;
    try { localStorage.setItem("misas-lang", l); } catch (e) { /* sin almacenamiento */ }
    const swap = () => {
      applyLang(); fillSelects(); syncControls(); renderList(); showOnMapLabel();
      if (state.detailId) openDetail(state.detailId, false);
      setPh(true);
    };
    document.body.classList.add("lang-swap");
    setTimeout(() => { swap(); document.body.classList.remove("lang-swap"); }, calm() ? 0 : 160);
  }

  function syncControls() {
    document.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", b.dataset.kind === state.kind));
    document.querySelectorAll(".seg").forEach((sg) => sg.style.setProperty("--idx", ["mass", "confession", "adoration"].indexOf(state.kind)));
    if (document.querySelector(".mapcol").dataset.kind !== state.kind) {
      document.querySelector(".mapcol").dataset.kind = state.kind;
      document.body.dataset.tone = state.kind; // tinte muy leve del fondo
      MapView.recolor && MapView.recolor();
    }
    $("fDay").value = state.day;
    $("fFrom").value = String(state.from - (state.from % 30));
    $("fTo").value = String(Math.min(1439, state.to - (state.to % 30) + 29));
    $("fMun").value = state.mun; $("fLang").value = state.lang; $("fText").value = state.text;
    const hasDist = !!GEO.distritos[state.mun];
    $("districts").hidden = !hasDist;
    document.querySelectorAll("#distChips button").forEach((b) => b.classList.toggle("on", b.dataset.dist === state.dist));
  }
  function applyFilters() {
    if (state.dist && !state.mun) state.mun = "Barcelona";
    const f = { kind: state.kind, day: state.day, from: state.from, to: state.to, mun: state.mun, dist: state.dist, lang: state.lang, text: state.text };
    closeDetail();
    showOnMap(f, state.origin, computeResults(f, state.origin));
  }

  // ---------- Arranque ----------
  function autosize(el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px"; }

  let hintIdx = 0;
  function setPh(now) {
    const input = $("chatInput");
    if (input.value && !now) return;
    const hints = t("hints");
    input.placeholder = ($("stage").classList.contains("has-thread") && innerWidth > 1100 ? t("askMore") : "") + hints[hintIdx++ % hints.length];
  }

  let toastTimer;
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  // «Cerca de mí» en el mapa: ordena por distancia desde donde estás.
  async function nearMe() {
    const btn = $("nearBtn");
    if (btn.classList.contains("on")) { // segundo toque: vuelve a la vista sin ubicación
      btn.classList.remove("on"); state.origin = null; applyFilters(); return;
    }
    btn.classList.add("busy");
    try {
      const ll = await locate();
      Object.assign(state, { origin: ll, mun: "", dist: "" });
      btn.classList.add("on");
      applyFilters();
    } catch (e) {
      toast(t("noLocationMap"));
    } finally { btn.classList.remove("busy"); }
  }

  // Botón de volver arriba: sigue al panel que se está desplazando.
  function bindToTop() {
    const btn = $("toTop");
    let target = null;
    const scrollers = [$("chatScroll"), $("side"), $("stage")];
    const place = () => {
      if (!target || target.scrollTop < 360 || !target.offsetParent && target !== $("stage")) { btn.classList.remove("show"); return; }
      const r = target.getBoundingClientRect(), bottomNav = document.querySelector(".bottomnav").offsetHeight || 0;
      btn.hidden = false;
      btn.style.left = `${Math.round(r.right - 62)}px`;
      btn.style.top = `${Math.round(Math.min(r.bottom, innerHeight - bottomNav) - 62)}px`;
      requestAnimationFrame(() => btn.classList.add("show"));
    };
    scrollers.forEach((el) => el.addEventListener("scroll", () => { target = el; place(); }, { passive: true }));
    addEventListener("resize", place);
    btn.onclick = () => { if (target) target.scrollTo({ top: 0, behavior: calm() ? "auto" : "smooth" }); };
    document.addEventListener("misas:mode", () => { target = null; place(); });
  }

  function bind() {
    applyLang();
    $("ideas").onclick = (e) => { const b = e.target.closest("button"); if (b) ask(b.textContent); };
    const input = $("chatInput");
    setPh(); setInterval(() => setPh(), 3500);
    input.addEventListener("input", () => autosize(input));
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("chatForm").requestSubmit(); } });
    $("chatForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value; if (!v.trim()) return;
      const send = document.querySelector(".send"); send.classList.remove("fly"); void send.offsetWidth; send.classList.add("fly");
      input.value = ""; autosize(input); ask(v);
    });

    document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.go)));
    document.querySelectorAll(".seg button").forEach((b) => b.onclick = () => { state.kind = b.dataset.kind; if (state.mode === "home") setMode("map"); applyFilters(); });
    const on = (id, key, num) => $(id).onchange = (e) => { state[key] = num ? Number(e.target.value) : e.target.value; applyFilters(); };
    on("fDay", "day"); on("fFrom", "from", true); on("fTo", "to", true); on("fLang", "lang");
    $("fMun").onchange = (e) => { state.mun = e.target.value; state.dist = ""; state.origin = null; $("nearBtn").classList.remove("on"); applyFilters(); };
    $("distChips").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; state.dist = b.dataset.dist; state.origin = null; $("nearBtn").classList.remove("on"); applyFilters(); };
    let timer; $("fText").oninput = (e) => { clearTimeout(timer); timer = setTimeout(() => { state.text = e.target.value.trim(); applyFilters(); }, 250); };
    $("reset").onclick = () => { Object.assign(state, BLANK, { origin: null }); $("nearBtn").classList.remove("on"); applyFilters(); };
    const pick = (e) => { const c = e.target.closest(".card"); if (c) openDetail(c.dataset.id); };
    $("list").addEventListener("click", pick);
    $("list").addEventListener("keydown", (e) => { if (e.key === "Enter") pick(e); });
    $("langBtn").onclick = () => setLang($("langBtn").dataset.next);
    $("nearBtn").onclick = nearMe;
    bindToTop();
  }

  function hideSplash() {
    if (!document.body.classList.contains("loading")) return;
    document.body.classList.remove("loading");
    const sp = $("splash");
    sp.classList.add("out");
    setTimeout(() => sp.remove(), 700);
  }

  async function start() {
    fillSelects();
    bind();
    // La pantalla de carga se retira cuando el mapa ha cargado (o, como mucho, a los 2,5 s).
    MapView.onLoad = hideSplash;
    setTimeout(hideSplash, 2500);
    await initMap();
    // Vista inicial: misas de hoy desde ahora en el mapa.
    const f = Object.assign({}, BLANK, { from: nowBcn().min });
    showOnMap(f, null, computeResults(f, null));
    if (!window.maplibregl && !CFG.googleMapsApiKey) hideSplash();
  }
  window.MisasApp = { parseQuery, search, ask, setMode, state, DATA };
  start();
})();
