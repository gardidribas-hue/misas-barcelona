/* Misas Barcelona: inicio tipo chat, resultados con mapa y filtros. */
(function () {
  "use strict";

  const CFG = window.MISAS_CONFIG || {};
  const DATA = (window.MISAS_DATA && window.MISAS_DATA.parroquias) || [];
  const BARRIOS = window.MISAS_BARRIOS || {};
  const DAY_CODES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const DAY_NAMES = { mon: "lunes", tue: "martes", wed: "miércoles", thu: "jueves", fri: "viernes", sat: "sábado", sun: "domingo" };
  const DAY_SHORT = { mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D", hol: "F" };
  const KIND = { mass: "misa", confession: "confesión", adoration: "adoración" };
  const KIND_PL = { mass: "misas", confession: "confesiones", adoration: "adoración" };
  const LANG = { ca: "cat", es: "cast", "ca-es": "cat/cast", en: "en", fr: "fr", de: "de", it: "it", pl: "pl", other: "otro" };
  const IDEAS = [
    "Estoy en Gràcia y quiero ir a misa entre las 17 y las 20",
    "Misa el domingo por la mañana en Sarrià",
    "Confesiones el sábado en Badalona",
    "Adoración hoy cerca de mí",
    "Missa en català demà al vespre a Sants",
    "Misa ahora cerca de la Sagrada Família"
  ];

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[·’`]/g, "'");
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const km = (d) => d == null ? "" : d < 1 ? `${Math.round(d * 100) * 10} m` : `${d.toFixed(1).replace(".", ",")} km`;

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
  const BLANK = { kind: "mass", day: "today", from: 0, to: 1439, arx: "", com: "", mun: "", lang: "", text: "" };
  const state = Object.assign({}, BLANK, { origin: null, user: null, selected: null, results: [] });

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
    if (f.arx && p.arxiprestat !== f.arx) return false;
    if (f.com && p.comunitat !== f.com) return false;
    if (f.mun && p.municipality !== f.mun) return false;
    if (f.text) {
      const hay = norm([p.name, p.address, p.municipality, p.comunitat].join(" "));
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
    const muns = new Map();
    for (const p of DATA) if (p.municipality && p.lat != null) {
      const k = p.municipality.replace(/\s*\(.*\)/, "");
      if (!muns.has(k)) muns.set(k, []);
      muns.get(k).push([p.lat, p.lng]);
    }
    for (const [name, pts] of muns) {
      const c = [pts.reduce((s, x) => s + x[0], 0) / pts.length, pts.reduce((s, x) => s + x[1], 0) / pts.length];
      if (name !== "Barcelona") add(name, { type: "mun", name, center: c });
      const short = name.replace(/^(l'|el |la |les )/i, "").replace(/ de (llobregat|besos|besòs|gramenet|mar|dalt)$/i, "");
      if (short !== name && short.length > 4) add(short, { type: "mun", name, center: c });
    }
    for (const com of new Set(DATA.map((p) => p.comunitat))) if (!/^Sin /.test(com)) add(com, { type: "com", name: com });
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

  // ---------- Mapa: MapLibre (vectorial) o Google Maps si hay clave ----------
  const MapView = { markers: new Map(), ready: false };

  function pinEl(p) {
    const el = document.createElement("button");
    el.type = "button"; el.className = "pin"; el.title = p.name; el.setAttribute("aria-label", p.name);
    el.addEventListener("click", (e) => { e.stopPropagation(); openDetail(p.id, false); });
    return el;
  }

  function initMapLibre() {
    const map = new maplibregl.Map({
      container: "map", style: CFG.mapStyle, center: [CFG.center[1], CFG.center[0]], zoom: CFG.zoom,
      attributionControl: { compact: true }, cooperativeGestures: false
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
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
          const el = mk.getElement(), p = DATA.find((x) => x.id === pid);
          const on = pid === id;
          el.classList.toggle("on", on);
          el.textContent = on ? p.name : "";
        }
      },
      focus(p) { if (p.lat != null) map.easeTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 15), duration: 600 }); },
      fit(list, origin) {
        const pts = list.filter((p) => p.lat != null).map((p) => [p.lng, p.lat]);
        if (origin) pts.push([origin[1], origin[0]]);
        if (!pts.length) return;
        const b = pts.reduce((bb, c) => bb.extend(c), new maplibregl.LngLatBounds(pts[0], pts[0]));
        map.fitBounds(b, { padding: 60, maxZoom: 15, duration: 600 });
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
        focus(p) { if (p.lat != null) { map.panTo({ lat: p.lat, lng: p.lng }); if (map.getZoom() < 15) map.setZoom(15); } },
        fit(list, origin) {
          const b = new google.maps.LatLngBounds(); let n = 0;
          for (const p of list) if (p.lat != null) { b.extend({ lat: p.lat, lng: p.lng }); n++; }
          if (origin) { b.extend({ lat: origin[0], lng: origin[1] }); n++; }
          if (n === 1) { map.setCenter(b.getCenter()); map.setZoom(15); } else if (n) map.fitBounds(b, 60);
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

  async function ensureMap() {
    if (MapView.ready) { MapView.resize(); return; }
    MapView.ready = true;
    try {
      if (CFG.googleMapsApiKey) await initGoogle(); else initMapLibre();
    } catch (e) {
      console.warn("Google Maps no disponible; uso el mapa vectorial", e);
      initMapLibre();
    }
  }

  // ---------- Vistas ----------
  function showResults() {
    document.body.classList.remove("is-home");
    document.body.classList.add("is-results");
    return ensureMap();
  }
  function showHome() {
    document.body.classList.add("is-home");
    document.body.classList.remove("is-results");
    $("homeInput").value = ""; autosize($("homeInput")); $("homeInput").focus();
  }

  function describe(f, zone, near) {
    const day = resolvedDay(f.day);
    const dayTxt = f.day === "today" ? "hoy" : f.day === "tomorrow" ? "mañana" : f.day === "any" ? "cualquier día" : day === "sun" ? "el domingo o festivo" : `el ${DAY_NAMES[day]}`;
    const t = f.from === 0 && f.to >= 1439 ? "" : f.to >= 1439 ? `, desde las ${fmt(f.from)}` : f.from === 0 ? `, antes de las ${fmt(f.to)}` : `, de ${fmt(f.from)} a ${fmt(f.to)}`;
    const where = near ? " cerca de ti" : zone ? ` cerca de ${zone.name.replace(/(^|[\s-])(\S)/g, (m, a, c) => a + c.toUpperCase())}` : f.com ? ` en ${f.com}` : f.mun ? ` en ${f.mun}` : "";
    return `<strong>${KIND_PL[f.kind][0].toUpperCase() + KIND_PL[f.kind].slice(1)}</strong> ${dayTxt}${t}<em>${esc(where)}</em>`;
  }

  function timesHtml(r, kind) {
    const day = resolvedDay(state.day);
    if (r.soft) return `<span class="t note">confesión antes de misa o a petición</span>` + r.hits.map((h) => `<span class="t hit">${h.start}</span>`).join("");
    const hit = new Set(r.hits);
    return (eventsOf(r.p, kind) || []).filter((ev) => dayMatch(ev, day))
      .map((ev) => `<span class="t ${hit.has(ev) ? "hit" : ""}">${ev.start}${ev.end ? "–" + ev.end : ""}${ev.lang ? `<small>${LANG[ev.lang] || ev.lang}</small>` : ""}</span>`).join("");
  }

  function cardHtml(r, kind) {
    const p = r.p;
    return `<li class="card" data-id="${esc(p.id)}" tabindex="0">
      <span class="name">${esc(p.name)}</span>
      <span class="dist">${km(r.d)}</span>
      <span class="where">${esc([p.municipality !== "Barcelona" ? p.municipality : "", p.comunitat && !/^Sin /.test(p.comunitat) ? p.comunitat : ""].filter(Boolean).join(" · ") || p.address || "")}</span>
      <span class="times">${timesHtml(r, kind)}</span>
    </li>`;
  }

  // Un turno de conversación: pregunta + respuesta con tarjetas.
  function addTurn(question, res, f, zone, near) {
    const thread = $("thread");
    if (question) {
      const q = document.createElement("div");
      q.className = "q"; q.textContent = question;
      thread.appendChild(q);
    }
    const a = document.createElement("div");
    a.className = "a";
    const shown = 8;
    const list = res.slice(0, shown);
    a.innerHTML = res.length
      ? `<div class="head">${describe(f, zone, near)}</div>
         <div class="meta">${res.length} ${res.length === 1 ? "parroquia" : "parroquias"}${zone || near ? ", ordenadas por cercanía" : ", ordenadas por hora"}</div>
         <ul class="cards">${list.map((r) => cardHtml(r, f.kind)).join("")}</ul>
         ${res.length > shown ? `<button type="button" class="ghost small more">Ver ${Math.min(res.length - shown, 20)} más</button>` : ""}`
      : `<div class="head">${describe(f, zone, near)}</div><p class="empty">No he encontrado nada. Prueba con otra hora («por la tarde»), otro día o una zona más amplia.</p>`;
    thread.appendChild(a);
    const more = a.querySelector(".more");
    if (more) {
      let n = shown;
      more.onclick = () => {
        const next = res.slice(n, n + 20); n += next.length;
        a.querySelector(".cards").insertAdjacentHTML("beforeend", next.map((r) => cardHtml(r, f.kind)).join(""));
        if (n >= res.length) more.remove(); else more.textContent = `Ver ${Math.min(res.length - n, 20)} más`;
      };
    }
    a.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function runSearch(f, origin, question, zone, near) {
    Object.assign(state, f, { origin });
    state.selected = null;
    let res = search(state, origin);
    if (origin && !f.com && !f.mun) {
      const close = res.filter((r) => r.d != null && r.d <= 2.5);
      res = close.length >= 3 ? close : res.filter((r) => r.d != null && r.d <= 7);
    }
    state.results = res;
    closeDetail();
    syncControls();
    addTurn(question, res, f, zone, near);
    if (MapView.setMarkers) {
      const ps = res.map((r) => r.p);
      MapView.setMarkers(ps);
      MapView.fit(ps.slice(0, origin ? 8 : ps.length), origin);
    }
  }

  async function ask(text) {
    text = text.trim();
    if (!text) return;
    await showResults();
    const { f, zone, near } = parseQuery(text);
    let origin = null;
    if (near) {
      try { origin = await locate(); }
      catch (e) {
        const q = document.createElement("div"); q.className = "q"; q.textContent = text; $("thread").appendChild(q);
        const a = document.createElement("div"); a.className = "a";
        a.innerHTML = `<p class="empty">No puedo saber dónde estás. Dime el barrio o el municipio, por ejemplo: «estoy en Sants».</p>`;
        $("thread").appendChild(a); return;
      }
    }
    if (zone && zone.type === "com") f.com = zone.name;
    else if (zone && zone.center) origin = zone.center;
    else if (zone && zone.type === "mun") f.mun = zone.name;
    runSearch(f, origin, text, zone, near);
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
    state.selected = id;
    document.querySelectorAll(".card").forEach((c) => c.classList.toggle("sel", c.dataset.id === id));
    if (MapView.highlight) {
      if (!MapView.markers.has(id)) MapView.setMarkers(state.results.map((r) => r.p).concat([p]));
      MapView.highlight(id);
    }
    const dest = p.lat != null ? `${p.lat},${p.lng}` : encodeURIComponent(`${p.name}, ${p.address || ""}, ${p.municipality || ""}`);
    const box = $("detail");
    box.innerHTML = `
      <button type="button" class="ghost small back" id="closeDetail">← Volver</button>
      <h2>${esc(p.name)}</h2>
      <p class="addr">${esc([p.address, p.municipality].filter(Boolean).join(", "))}<em>${esc(!/^Sin /.test(p.comunitat) ? `Comunidad pastoral ${p.comunitat} · ${p.arxiprestat}` : p.arxiprestat)}</em></p>
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
    box.hidden = false; $("thread").hidden = true;
    box.scrollTop = 0;
    $("closeDetail").onclick = closeDetail;
    if (focus && MapView.focus) MapView.focus(p);
  }
  function closeDetail() {
    $("detail").hidden = true; $("thread").hidden = false;
    if (MapView.highlight) MapView.highlight(null);
    state.selected = null;
  }

  // ---------- Filtros ----------
  function fillSelects() {
    const n = nowBcn();
    $("fDay").innerHTML = `<option value="today">Hoy (${DAY_NAMES[n.day]})</option><option value="tomorrow">Mañana</option>` +
      DAY_CODES.map((d) => `<option value="${d}">${d === "sun" ? "Domingo y festivos" : DAY_NAMES[d][0].toUpperCase() + DAY_NAMES[d].slice(1)}</option>`).join("") + `<option value="any">Cualquier día</option>`;
    const hours = []; for (let h = 0; h < 24; h++) for (const m of [0, 30]) hours.push(h * 60 + m);
    $("fFrom").innerHTML = hours.map((m) => `<option value="${m}">${fmt(m)}</option>`).join("");
    $("fTo").innerHTML = hours.map((m) => `<option value="${m + 29}">${fmt(m + 29)}</option>`).join("");
    $("fArx").innerHTML = `<option value="">Todos</option>` + [...new Set(DATA.map((p) => p.arxiprestat))].sort().map((a) => `<option>${esc(a)}</option>`).join("");
    $("fMun").innerHTML = `<option value="">Todos</option>` + [...new Set(DATA.map((p) => p.municipality).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ca")).map((a) => `<option>${esc(a)}</option>`).join("");
    fillComs();
  }
  function fillComs() {
    const coms = [...new Set(DATA.filter((p) => !state.arx || p.arxiprestat === state.arx).map((p) => p.comunitat))].sort();
    $("fCom").innerHTML = `<option value="">Todas</option>` + coms.map((a) => `<option>${esc(a)}</option>`).join("");
    if (!coms.includes(state.com)) state.com = "";
    $("fCom").value = state.com;
  }
  function syncControls() {
    document.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", b.dataset.kind === state.kind));
    $("fDay").value = state.day;
    $("fFrom").value = String(state.from - (state.from % 30));
    $("fTo").value = String(Math.min(1439, state.to - (state.to % 30) + 29));
    $("fArx").value = state.arx; fillComs();
    $("fMun").value = state.mun; $("fLang").value = state.lang; $("fText").value = state.text;
  }
  function fromFilters() {
    const f = { kind: state.kind, day: state.day, from: state.from, to: state.to, arx: state.arx, com: state.com, mun: state.mun, lang: state.lang, text: state.text };
    $("thread").innerHTML = "";
    runSearch(f, state.origin, null, null, false);
  }

  // ---------- Arranque ----------
  function autosize(t) { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 160) + "px"; }

  function rotatePlaceholder(el) {
    let i = 0;
    const set = () => { el.placeholder = IDEAS[i % IDEAS.length] + "…"; i++; };
    set();
    return setInterval(() => { if (!el.value) set(); }, 3500);
  }

  function bind() {
    $("parishCount").textContent = DATA.length;
    $("ideas").innerHTML = IDEAS.slice(0, 4).map((s) => `<li><button type="button">${esc(s)}</button></li>`).join("");
    $("ideas").onclick = (e) => { const b = e.target.closest("button"); if (b) ask(b.textContent); };
    rotatePlaceholder($("homeInput"));
    $("chatInput").placeholder = "Pregunta otra cosa…";

    const wire = (form, input) => {
      input.addEventListener("input", () => autosize(input));
      input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
      form.addEventListener("submit", (e) => { e.preventDefault(); const v = input.value; input.value = ""; autosize(input); ask(v); });
    };
    wire($("homeForm"), $("homeInput"));
    wire($("chatForm"), $("chatInput"));

    $("nearNow").onclick = () => ask("Misa ahora cerca de mí");
    $("openMap").onclick = async () => { await showResults(); $("thread").innerHTML = ""; runSearch(Object.assign({}, BLANK, { from: nowBcn().min }), null, null, null, false); };
    $("goHome").onclick = showHome;
    $("filtersBtn").onclick = () => {
      const open = $("filters").hidden;
      $("filters").hidden = !open; $("filtersBtn").setAttribute("aria-expanded", String(open));
    };
    document.querySelectorAll(".seg button").forEach((b) => b.onclick = () => { state.kind = b.dataset.kind; fromFilters(); });
    const on = (id, key, num) => $(id).onchange = (e) => { state[key] = num ? Number(e.target.value) : e.target.value; if (key === "arx") fillComs(); fromFilters(); };
    on("fDay", "day"); on("fFrom", "from", true); on("fTo", "to", true); on("fArx", "arx"); on("fCom", "com"); on("fMun", "mun"); on("fLang", "lang");
    let t; $("fText").oninput = (e) => { clearTimeout(t); t = setTimeout(() => { state.text = e.target.value.trim(); fromFilters(); }, 250); };
    $("reset").onclick = () => { Object.assign(state, BLANK, { origin: null }); fromFilters(); };
    const pick = (e) => { const c = e.target.closest(".card"); if (c) openDetail(c.dataset.id); };
    $("thread").addEventListener("click", pick);
    $("thread").addEventListener("keydown", (e) => { if (e.key === "Enter") pick(e); });
  }

  fillSelects();
  bind();
  window.MisasApp = { parseQuery, search, ask, DATA };
})();
