/* Misas Barcelona: chat, mapa y filtros en una misma pantalla. */
(function () {
  "use strict";

  const CFG = window.MISAS_CONFIG || {};
  const DATA = (window.MISAS_DATA && window.MISAS_DATA.parroquias) || [];
  const GEO = window.MISAS_GEO || { municipios: [], distritos: {} };
  const BARRIOS = window.MISAS_BARRIOS || {};
  const DAY_CODES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const DAY_NAMES = { mon: "lunes", tue: "martes", wed: "miércoles", thu: "jueves", fri: "viernes", sat: "sábado", sun: "domingo" };
  const DAY_SHORT = { mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D", hol: "F" };
  const KIND_PL = { mass: "misas", confession: "confesiones", adoration: "adoración" };
  const LANG = { ca: "cat", es: "cast", "ca-es": "cat/cast", en: "en", fr: "fr", de: "de", it: "it", pl: "pl", other: "otro" };
  const IDEAS = [
    "Estoy en Gràcia y quiero ir a misa entre las 17 y las 20",
    "Misa el domingo por la mañana en Sarrià",
    "Confesiones el sábado en Badalona",
    "Adoración hoy en el Eixample",
    "Missa en català demà al vespre a Sants",
    "Misa ahora cerca de mí"
  ];
  const HINTS = ["Misa ahora cerca de mí", "Gràcia, entre las 17 y las 20", "Confesiones el sábado", "Adoración en el Eixample", "Domingo por la mañana en Sarrià", "Missa en català a Sants"];

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
        const el = document.createElement("div"); el.className = "pin me"; el.title = "Estás aquí";
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
          me = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: ll[0], lng: ll[1] }, title: "Estás aquí", content: el });
        },
        resize() {}
      });
    });
  }

  async function initMap() {
    try {
      if (CFG.googleMapsApiKey) await initGoogle(); else initMapLibre();
    } catch (e) {
      console.warn("Google Maps no disponible; uso el mapa vectorial", e);
      initMapLibre();
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
      document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.go === mode));
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
    if (r.soft) return `<span class="t note">confesión antes de misa o a petición</span>` + r.hits.map((h) => `<span class="t hit">${h.start}</span>`).join("");
    const hit = new Set(r.hits);
    return (eventsOf(r.p, kind) || []).filter((ev) => dayMatch(ev, day))
      .map((ev) => `<span class="t ${hit.has(ev) ? "hit" : ""}">${ev.start}${ev.end ? "–" + ev.end : ""}${ev.lang ? `<small>${LANG[ev.lang] || ev.lang}</small>` : ""}</span>`).join("");
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
    const dayTxt = f.day === "today" ? "hoy" : f.day === "tomorrow" ? "mañana" : f.day === "any" ? "cualquier día" : day === "sun" ? "el domingo o festivo" : `el ${DAY_NAMES[day]}`;
    const t = f.from === 0 && f.to >= 1439 ? "" : f.to >= 1439 ? `, desde las ${fmt(f.from)}` : f.from === 0 ? `, antes de las ${fmt(f.to)}` : `, de ${fmt(f.from)} a ${fmt(f.to)}`;
    const where = near ? " cerca de ti" : zone && zone.type === "barrio" ? ` cerca de ${title(zone.name)}` : f.dist ? ` en ${f.dist}` : f.mun ? ` en ${f.mun}` : zone ? ` cerca de ${zone.name}` : "";
    return `<strong>${KIND_PL[f.kind][0].toUpperCase() + KIND_PL[f.kind].slice(1)}</strong> ${dayTxt}${t}<em>${esc(where)}</em>`;
  }

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
    const lbl = $("mapLabel");
    lbl.innerHTML = state.dist ? `Distrito <em>${esc(state.dist)}</em>` : state.mun ? `<em>${esc(state.mun)}</em>` : "";
  }

  function refit() {
    state.pendingFit = false;
    if (!MapView.fit) return;
    const area = areaOf(state.dist ? "Barcelona" : state.mun, state.dist);
    if (area || state.mun === "Barcelona") { MapView.setArea(area, state.mun === "Barcelona" || state.dist ? GEO.distritos.Barcelona : null); return; }
    MapView.fit(state.results.map((r) => r.p).slice(0, state.origin ? 10 : state.results.length), state.origin);
  }

  function renderList() {
    const res = state.results, day = resolvedDay(state.day);
    $("summary").innerHTML = `<strong>${res.length}</strong> ${res.length === 1 ? "parroquia" : "parroquias"} · ${describe(state, null, false).replace(/<\/?strong>/g, "")}`;
    $("list").innerHTML = res.length ? res.slice(0, 300).map((r) => cardHtml(r, state.kind, day)).join("")
      : `<li class="empty">No hay resultados. Amplía la franja horaria o quita algún filtro.</li>`;
  }

  // ---------- Chat ----------
  const wait = (ms) => new Promise((r) => setTimeout(r, calm() ? 0 : ms));
  const THINK = {
    mass: ["Buscando misas…", "Mirando horarios…"],
    confession: ["Buscando confesiones…", "Mirando horarios…"],
    adoration: ["Buscando adoración…", "Mirando horarios…"],
  };
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
    const lines = THINK[kind] || THINK.mass;
    a.innerHTML = `<div class="thinking"><span class="dots"><i></i><i></i><i></i></span><span class="say">${lines[0]}</span></div>`;
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
      btn.innerHTML = (open ? "Ver menos" : `Ver ${cards.length - PEEK} más`) + CHEV;
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
         <div class="meta">${res.length} ${res.length === 1 ? "parroquia" : "parroquias"}${origin ? ", de la más cercana a la más lejana" : ", por orden de hora"}</div>
         <div class="fold"><ul class="cards">${res.slice(0, shown).map((r) => cardHtml(r, f.kind, day)).join("")}</ul></div>
         ${Math.min(res.length, shown) > PEEK ? `<button type="button" class="more" aria-expanded="false"></button>` : ""}
         <div class="row"><button type="button" class="pill accent see-map">Ver ${res.length > shown ? `las ${res.length} ` : ""}en el mapa</button></div>`
      : `<div class="head">${describe(f, zone, near)}</div><p class="empty">No he encontrado nada. Prueba con otra hora («por la tarde»), otro día o una zona más amplia.</p>`);
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
        await finishTurn(a, `<p class="empty">No puedo saber dónde estás. Dime el barrio, el distrito o el municipio, por ejemplo: «estoy en Sants».</p>`);
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
      const label = wk.every((x) => d.includes(x)) && d.includes("sat") && !d.includes("sun") ? "Lun–Sáb"
        : wk.every((x) => d.includes(x)) && d.length === 5 ? "Lun–Vie"
        : d.every((x) => x === "sun" || x === "hol") ? "Domingos" : d.map((x) => DAY_SHORT[x]).join(" ");
      return `<dt>${label}</dt><dd>${list.map((ev) => `<span class="t" ${ev.note ? `title="${esc(ev.note)}"` : ""}>${ev.start}${ev.end ? "–" + ev.end : ""}${ev.lang ? `<small>${LANG[ev.lang] || ev.lang}</small>` : ""}</span>`).join("")}</dd>`;
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
      <button type="button" class="pill" id="closeDetail" style="align-self:flex-start">← Volver a la lista</button>
      <h2>${esc(p.name)}</h2>
      <p class="addr">${esc([p.address, p.municipio].filter(Boolean).join(", "))}<em>${esc(p.distrito ? `Distrito ${p.distrito}` : "")}${p.distrito && !/^Sin /.test(p.comunitat) ? " · " : ""}${esc(!/^Sin /.test(p.comunitat) ? `Comunidad pastoral ${p.comunitat}` : "")}</em></p>
      <div class="actions">
        <a class="btn primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${dest}">Cómo llegar</a>
        ${p.phone ? `<a class="btn" href="tel:${esc(p.phone.replace(/\s/g, ""))}">${esc(p.phone)}</a>` : ""}
        ${p.web ? `<a class="btn" target="_blank" rel="noopener" href="${esc(p.web)}">Web</a>` : ""}
        ${p.url ? `<a class="btn" target="_blank" rel="noopener" href="${esc(p.url)}">Ficha oficial</a>` : ""}
      </div>
      <h3>Misas</h3>
      ${schedule(p.masses) || `<p class="note">Esta parroquia no publica horario de misas.</p>`}
      ${p.masses_text ? `<p class="note">${esc(p.masses_text)}</p>` : ""}
      ${p.confessions.length || p.confessions_text ? `<h3>Confesiones</h3>${schedule(p.confessions)}${p.confessions_text ? `<p class="note">${esc(p.confessions_text)}</p>` : ""}` : ""}
      ${p.adoration.length || p.adoration_text ? `<h3>Adoración eucarística</h3>${schedule(p.adoration)}${p.adoration_text ? `<p class="note">${esc(p.adoration_text)}</p>` : ""}` : ""}
      ${p.other ? `<h3>Otras celebraciones</h3><p class="note">${esc(p.other)}</p>` : ""}`;
    box.hidden = false;
    $("filters").hidden = true; $("summary").hidden = true; $("list").hidden = true;
    $("side").scrollTop = 0;
    $("closeDetail").onclick = closeDetail;
    if (focus && MapView.focus) MapView.focus(p);
  }
  function closeDetail() {
    $("detail").hidden = true;
    $("filters").hidden = false; $("summary").hidden = false; $("list").hidden = false;
    if (MapView.highlight) MapView.highlight(null);
  }

  // ---------- Filtros ----------
  function fillSelects() {
    const n = nowBcn();
    $("fDay").innerHTML = `<option value="today">Hoy (${DAY_NAMES[n.day]})</option><option value="tomorrow">Mañana</option>` +
      DAY_CODES.map((d) => `<option value="${d}">${d === "sun" ? "Domingo y festivos" : DAY_NAMES[d][0].toUpperCase() + DAY_NAMES[d].slice(1)}</option>`).join("") + `<option value="any">Cualquier día</option>`;
    const hours = []; for (let h = 0; h < 24; h++) for (const m of [0, 30]) hours.push(h * 60 + m);
    $("fFrom").innerHTML = hours.map((m) => `<option value="${m}">${fmt(m)}</option>`).join("");
    $("fTo").innerHTML = hours.map((m) => `<option value="${m + 29}">${fmt(m + 29)}</option>`).join("");
    const counts = {};
    for (const p of DATA) counts[p.municipio] = (counts[p.municipio] || 0) + 1;
    $("fMun").innerHTML = `<option value="">Todos los municipios</option>` + Object.keys(counts).filter(Boolean).sort((a, b) => a.localeCompare(b, "ca"))
      .map((m) => `<option value="${esc(m)}">${esc(m)}${GEO.distritos[m] ? " · por distritos" : ""} (${counts[m]})</option>`).join("");
    const dists = GEO.distritos.Barcelona || [];
    $("distChips").innerHTML = `<button type="button" data-dist="">Toda Barcelona</button>` + dists.map((d) => `<button type="button" data-dist="${esc(d.name)}">${esc(d.name)}</button>`).join("");
  }
  function syncControls() {
    document.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", b.dataset.kind === state.kind));
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
  function autosize(t) { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 160) + "px"; }

  function bind() {
    $("parishCount").textContent = DATA.length;
    $("ideas").innerHTML = IDEAS.slice(0, 4).map((s) => `<li><button type="button">${esc(s)}</button></li>`).join("");
    $("ideas").onclick = (e) => { const b = e.target.closest("button"); if (b) ask(b.textContent); };
    const input = $("chatInput");
    let i = 0;
    const setPh = () => { input.placeholder = ($("stage").classList.contains("has-thread") ? "Pregunta otra cosa… " : "") + HINTS[i++ % HINTS.length]; };
    setPh(); setInterval(() => { if (!input.value) setPh(); }, 3500);
    input.addEventListener("input", () => autosize(input));
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("chatForm").requestSubmit(); } });
    $("chatForm").addEventListener("submit", (e) => { e.preventDefault(); const v = input.value; input.value = ""; autosize(input); ask(v); });

    document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.go)));
    document.querySelectorAll(".seg button").forEach((b) => b.onclick = () => { state.kind = b.dataset.kind; if (state.mode === "home") setMode("map"); applyFilters(); });
    const on = (id, key, num) => $(id).onchange = (e) => { state[key] = num ? Number(e.target.value) : e.target.value; applyFilters(); };
    on("fDay", "day"); on("fFrom", "from", true); on("fTo", "to", true); on("fLang", "lang");
    $("fMun").onchange = (e) => { state.mun = e.target.value; state.dist = ""; state.origin = null; applyFilters(); };
    $("distChips").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; state.dist = b.dataset.dist; state.origin = null; applyFilters(); };
    let t; $("fText").oninput = (e) => { clearTimeout(t); t = setTimeout(() => { state.text = e.target.value.trim(); applyFilters(); }, 250); };
    $("reset").onclick = () => { Object.assign(state, BLANK, { origin: null }); applyFilters(); };
    const pick = (e) => { const c = e.target.closest(".card"); if (c) openDetail(c.dataset.id); };
    $("list").addEventListener("click", pick);
    $("list").addEventListener("keydown", (e) => { if (e.key === "Enter") pick(e); });
  }

  async function start() {
    fillSelects();
    bind();
    await initMap();
    // Vista inicial: misas de hoy desde ahora en el mapa.
    const f = Object.assign({}, BLANK, { from: nowBcn().min });
    showOnMap(f, null, computeResults(f, null));
  }
  window.MisasApp = { parseQuery, search, ask, setMode, state, DATA };
  start();
})();
