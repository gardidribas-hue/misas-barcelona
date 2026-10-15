/* Misas Barcelona: mapa, filtros y asistente. Sin dependencias salvo Leaflet. */
(function () {
  "use strict";

  const CFG = window.MISAS_CONFIG || {};
  const DATA = (window.MISAS_DATA && window.MISAS_DATA.parroquias) || [];
  const BARRIOS = window.MISAS_BARRIOS || {};
  const DAY_CODES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const DAY_NAMES = { mon: "Lunes", tue: "Martes", wed: "Miércoles", thu: "Jueves", fri: "Viernes", sat: "Sábado", sun: "Domingo y festivos" };
  const DAY_SHORT = { mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D", hol: "F" };
  const KIND_LABEL = { mass: "misa", confession: "confesión", adoration: "adoración" };
  const LANG_LABEL = { ca: "cat", es: "cast", "ca-es": "cat/cast", en: "en", fr: "fr", de: "de", it: "it", pl: "pl", other: "otro" };
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[·’`]/g, "'");
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  // ---------- Tiempo (hora de Barcelona) ----------
  function nowBcn() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const wd = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun" }[get("weekday")];
    return { day: wd, min: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
  }
  const nextDay = (d) => DAY_CODES[(DAY_CODES.indexOf(d) + 1) % 7];

  // ---------- Estado ----------
  const state = { kind: "mass", day: "today", from: 0, to: 24 * 60 - 1, arx: "", com: "", mun: "", lang: "", text: "", user: null, selected: null, near: null };

  function resolvedDay(d) {
    const n = nowBcn();
    if (d === "today") return n.day;
    if (d === "tomorrow") return nextDay(n.day);
    return d; // "any" o código
  }

  function eventsOf(p, kind) { return kind === "mass" ? p.masses : kind === "confession" ? p.confessions : p.adoration; }

  function dayMatch(ev, day) {
    if (day === "any") return true;
    if (day === "sun") return ev.days.includes("sun") || ev.days.includes("hol");
    return ev.days.includes(day);
  }
  function langMatch(ev, lang) {
    if (!lang) return true;
    const l = ev.lang || "";
    if (lang === "other") return l && !["ca", "es", "ca-es"].includes(l);
    return l === lang || l === "ca-es";
  }
  function timeMatch(ev, from, to) {
    const s = toMin(ev.start);
    const e = ev.end ? toMin(ev.end) : s;
    return e >= from && s <= to;
  }
  const ON_REQUEST = /(antes|abans|despres|despues|durant|durante|peticio|petici|demana|solicit|cita|cada missa|cada misa|concertar)/;

  function matchParish(p, f) {
    const day = resolvedDay(f.day);
    let hits = (eventsOf(p, f.kind) || []).filter((ev) => dayMatch(ev, day) && timeMatch(ev, f.from, f.to) && (f.kind !== "mass" || langMatch(ev, f.lang)));
    let soft = false;
    if (f.kind === "confession" && !hits.length && ON_REQUEST.test(norm(p.confessions_text))) {
      // Confiesan antes de misa o a petición: vale si hay misa en la franja.
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
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  function search(f, origin) {
    const out = [];
    for (const p of DATA) {
      if (!zoneMatch(p, f)) continue;
      const m = matchParish(p, f);
      if (!m.hits.length) continue;
      const d = origin && p.lat != null ? distKm(origin, [p.lat, p.lng]) : null;
      out.push({ p, hits: m.hits, soft: m.soft, d });
    }
    out.sort((a, b) => (a.soft - b.soft) || (origin ? (a.d ?? 99) - (b.d ?? 99) : toMin(a.hits[0].start) - toMin(b.hits[0].start) || a.p.name.localeCompare(b.p.name)));
    return out;
  }

  // ---------- Mapa (Leaflet u OpenStreetMap; Google Maps si hay clave) ----------
  const MapView = { markers: new Map(), onClick: null };

  function initLeaflet() {
    const map = L.map("map", { zoomControl: true }).setView(CFG.center || [41.405, 2.17], CFG.zoom || 12);
    if (CFG.offlineBasemap) addPlaceLabels(map);
    else L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
    const icon = (cls) => L.divIcon({ className: "", html: `<div class="pin ${cls}"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] });
    let userMarker = null;
    Object.assign(MapView, {
      setMarkers(list, activeIds) {
        for (const [id, mk] of MapView.markers) if (!activeIds.has(id)) { map.removeLayer(mk); MapView.markers.delete(id); }
        for (const p of list) {
          if (p.lat == null || MapView.markers.has(p.id)) continue;
          const mk = L.marker([p.lat, p.lng], { icon: icon(""), title: p.name }).addTo(map);
          mk.bindTooltip(p.name);
          mk.on("click", () => MapView.onClick && MapView.onClick(p.id));
          MapView.markers.set(p.id, mk);
        }
      },
      focus(p) { if (p.lat != null) map.setView([p.lat, p.lng], Math.max(map.getZoom(), 15)); },
      fit(list) {
        const pts = list.filter((p) => p.lat != null).map((p) => [p.lat, p.lng]);
        if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
      },
      showUser(ll) {
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.circleMarker(ll, { radius: 8, color: "#1a73e8", fillColor: "#1a73e8", fillOpacity: .9 }).addTo(map).bindTooltip("Estás aquí");
      },
      invalidate() { map.invalidateSize(); }
    });
  }

  // Mapa sin calles (vista previa sin acceso a OpenStreetMap): rotula municipios y barrios.
  function addPlaceLabels(map) {
    $("map").classList.add("plain");
    const muns = new Map();
    for (const p of DATA) if (p.municipality && p.lat != null) {
      const k = p.municipality.replace(/\s*\(.*\)/, "");
      if (!muns.has(k)) muns.set(k, []);
      muns.get(k).push([p.lat, p.lng]);
    }
    const label = (ll, text, cls) => L.marker(ll, { interactive: false, keyboard: false, icon: L.divIcon({ className: "plabel " + cls, html: `<span>${esc(text)}</span>`, iconSize: [0, 0] }) });
    const big = L.layerGroup(), small = L.layerGroup();
    for (const [name, pts] of muns) {
      if (name === "Barcelona") continue;
      label([pts.reduce((a, x) => a + x[0], 0) / pts.length, pts.reduce((a, x) => a + x[1], 0) / pts.length], name, "mun").addTo(big);
    }
    label([41.392, 2.165], "BARCELONA", "city").addTo(big);
    const shown = ["Ciutat Vella", "Eixample", "Sants", "Les Corts", "Sarrià", "Sant Gervasi", "Gràcia", "Horta", "Guinardó", "Nou Barris", "Sant Andreu", "Sant Martí", "Poblenou", "Poble-sec", "Sagrada Família", "Pedralbes", "Barceloneta", "Raval", "Vallvidrera", "Carmel", "Bellvitge", "Collblanc", "Llefià"];
    for (const n of shown) { const c = BARRIOS[n.toLowerCase()]; if (c) label(c, n, "barrio").addTo(small); }
    big.addTo(map);
    const upd = () => { if (map.getZoom() >= 13) small.addTo(map); else map.removeLayer(small); };
    map.on("zoomend", upd); upd();
  }

  function initGoogle() {
    return new Promise((resolve, reject) => {
      window.__gmReady = resolve;
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CFG.googleMapsApiKey)}&v=weekly&libraries=marker&loading=async&callback=__gmReady`;
      s.async = true; s.onerror = reject;
      document.head.appendChild(s);
    }).then(() => {
      const map = new google.maps.Map($("map"), { center: { lat: CFG.center[0], lng: CFG.center[1] }, zoom: CFG.zoom, mapId: CFG.googleMapId || "DEMO_MAP_ID", streetViewControl: false, mapTypeControl: false });
      let userMarker = null;
      const pinEl = () => { const d = document.createElement("div"); d.className = "pin"; return d; };
      Object.assign(MapView, {
        setMarkers(list, activeIds) {
          for (const [id, mk] of MapView.markers) if (!activeIds.has(id)) { mk.map = null; MapView.markers.delete(id); }
          for (const p of list) {
            if (p.lat == null || MapView.markers.has(p.id)) continue;
            const mk = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: p.lat, lng: p.lng }, title: p.name, content: pinEl() });
            mk.addListener("click", () => MapView.onClick && MapView.onClick(p.id));
            MapView.markers.set(p.id, mk);
          }
        },
        focus(p) { if (p.lat != null) { map.panTo({ lat: p.lat, lng: p.lng }); if (map.getZoom() < 15) map.setZoom(15); } },
        fit(list) {
          const b = new google.maps.LatLngBounds(); let n = 0;
          for (const p of list) if (p.lat != null) { b.extend({ lat: p.lat, lng: p.lng }); n++; }
          if (n === 1) { map.setCenter(b.getCenter()); map.setZoom(15); } else if (n) map.fitBounds(b, 30);
        },
        showUser(ll) {
          if (userMarker) userMarker.map = null;
          const d = document.createElement("div"); d.className = "pin"; d.style.background = "#1a73e8";
          userMarker = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: ll[0], lng: ll[1] }, title: "Estás aquí", content: d });
        },
        invalidate() {}
      });
    });
  }

  // ---------- Interfaz ----------
  function fillSelects() {
    const day = $("fDay");
    const n = nowBcn();
    day.innerHTML = `<option value="today">Hoy (${DAY_NAMES[n.day].split(" ")[0].toLowerCase()})</option><option value="tomorrow">Mañana</option>` +
      DAY_CODES.map((d) => `<option value="${d}">${DAY_NAMES[d]}</option>`).join("") + `<option value="any">Cualquier día</option>`;
    const hours = [];
    for (let h = 0; h < 24; h++) for (const m of [0, 30]) hours.push(h * 60 + m);
    $("fFrom").innerHTML = hours.map((m) => `<option value="${m}">${fmt(m)}</option>`).join("");
    $("fTo").innerHTML = hours.map((m) => `<option value="${m + 29}">${fmt(m + 29)}</option>`).join("");

    const arxs = [...new Set(DATA.map((p) => p.arxiprestat))].sort();
    $("fArx").innerHTML = `<option value="">Todos</option>` + arxs.map((a) => `<option>${esc(a)}</option>`).join("");
    const muns = [...new Set(DATA.map((p) => p.municipality).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ca"));
    $("fMun").innerHTML = `<option value="">Todos</option>` + muns.map((a) => `<option>${esc(a)}</option>`).join("");
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
    $("fTo").value = String(state.to - (state.to % 30) + 29 > 1439 ? 1439 : state.to - (state.to % 30) + 29);
    $("fArx").value = state.arx; fillComs();
    $("fMun").value = state.mun; $("fLang").value = state.lang; $("fText").value = state.text;
  }

  function timesHtml(p, hits, kind) {
    const hitSet = new Set(hits);
    const day = resolvedDay(state.day);
    const evs = (eventsOf(p, kind) || []).filter((ev) => dayMatch(ev, day));
    const list = hitSet.size && kind === "confession" && !evs.some((e) => hitSet.has(e)) ? hits : evs;
    return list.map((ev) => `<span class="time ${hitSet.has(ev) ? "hit" : ""}">${ev.start}${ev.end ? "–" + ev.end : ""}${ev.lang ? `<small>${LANG_LABEL[ev.lang] || ev.lang}</small>` : ""}</span>`).join("");
  }

  let lastResults = [];
  function render(fit) {
    const res = search(state, state.near);
    lastResults = res;
    const day = resolvedDay(state.day);
    const dayTxt = day === "any" ? "cualquier día" : DAY_NAMES[day].toLowerCase();
    const range = state.from === 0 && state.to >= 1439 ? "a cualquier hora" : `entre ${fmt(state.from)} y ${fmt(Math.min(state.to, 1439))}`;
    $("summary").textContent = `${res.length} parroquias con ${KIND_LABEL[state.kind]} el ${dayTxt} ${range}` + (state.near ? ", ordenadas por cercanía" : "");
    if (day === "any") $("summary").textContent = `${res.length} parroquias con ${KIND_LABEL[state.kind]} ${range}`;

    $("results").innerHTML = res.length ? res.slice(0, 250).map(({ p, hits, soft, d }) => `
      <li data-id="${esc(p.id)}" class="${state.selected === p.id ? "sel" : ""}">
        ${d != null ? `<span class="dist">${d < 1 ? Math.round(d * 1000) + " m" : d.toFixed(1) + " km"}</span>` : ""}
        <div class="name">${esc(p.name)}</div>
        <div class="where">${esc(p.municipality || "")}${p.comunitat ? " · " + esc(p.comunitat) : ""}</div>
        <div class="times">${soft ? `<span class="time">Confesión antes de misa / a petición</span>` + timesHtml(p, hits, "mass") : timesHtml(p, hits, state.kind)}</div>
      </li>`).join("") : `<li class="empty">No hay resultados con estos filtros. Prueba a ampliar la franja horaria o la zona.</li>`;

    const ids = new Set(res.map((r) => r.p.id));
    if (MapView.setMarkers) {
      MapView.setMarkers(res.map((r) => r.p), ids);
      if (fit && res.length) MapView.fit(res.map((r) => r.p));
    }
  }

  function scheduleTable(evs) {
    if (!evs.length) return "";
    const rows = [];
    const groups = new Map();
    for (const ev of evs) {
      const key = ev.days.join(",");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(ev);
    }
    for (const [key, list] of groups) {
      const days = key.split(",");
      let label;
      const wk = ["mon", "tue", "wed", "thu", "fri"];
      if (wk.every((d) => days.includes(d)) && days.includes("sat") && !days.includes("sun")) label = "Lun–Sáb";
      else if (wk.every((d) => days.includes(d)) && days.length === 5) label = "Lun–Vie";
      else if (days.every((d) => d === "sun" || d === "hol")) label = "Dom/fest.";
      else label = days.map((d) => DAY_SHORT[d]).join(" ");
      rows.push(`<tr><td>${label}</td><td>${list.map((ev) => `${ev.start}${ev.end ? "–" + ev.end : ""}${ev.lang ? ` <small>(${LANG_LABEL[ev.lang] || ev.lang})</small>` : ""}${ev.note ? ` <small>· ${esc(ev.note)}</small>` : ""}`).join(", ")}</td></tr>`);
    }
    return `<table>${rows.join("")}</table>`;
  }

  function showDetail(id, focus = true) {
    const p = DATA.find((x) => x.id === id);
    if (!p) return;
    state.selected = id;
    document.querySelectorAll(".results li").forEach((li) => li.classList.toggle("sel", li.dataset.id === id));
    const dest = p.lat != null ? `${p.lat},${p.lng}` : encodeURIComponent(`${p.name}, ${p.address || ""}, ${p.municipality || ""}`);
    const box = $("detail");
    box.innerHTML = `
      <button class="link back" type="button" id="closeDetail">← Volver a la lista</button>
      <h2>${esc(p.name)}</h2>
      <div class="where">${esc([p.address, p.postal_code, p.municipality].filter(Boolean).join(", "))}</div>
      <div class="where">${esc(p.arxiprestat)} · ${esc(p.comunitat)}</div>
      <div class="actions">
        <a class="btn primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${dest}">Cómo llegar</a>
        ${p.phone ? `<a class="btn" href="tel:${esc(p.phone.replace(/\s/g, ""))}">📞 ${esc(p.phone)}</a>` : ""}
        ${p.web ? `<a class="btn" target="_blank" rel="noopener" href="${esc(p.web)}">Web</a>` : ""}
        ${p.url ? `<a class="btn" target="_blank" rel="noopener" href="${esc(p.url)}">Ficha del Arzobispado</a>` : ""}
      </div>
      <h3>Misas</h3>
      ${scheduleTable(p.masses) || "<p>Sin horario publicado.</p>"}
      ${p.masses_text ? `<p class="where">${esc(p.masses_text)}</p>` : ""}
      ${p.confessions.length || p.confessions_text ? `<h3>Confesiones</h3>${scheduleTable(p.confessions)}${p.confessions_text ? `<p>${esc(p.confessions_text)}</p>` : ""}` : ""}
      ${p.adoration.length || p.adoration_text ? `<h3>Adoración eucarística</h3>${scheduleTable(p.adoration)}${p.adoration_text ? `<p>${esc(p.adoration_text)}</p>` : ""}` : ""}
      ${p.other ? `<h3>Otras celebraciones</h3><p>${esc(p.other)}</p>` : ""}`;
    box.hidden = false;
    $("results").hidden = true; $("summary").hidden = true;
    $("closeDetail").onclick = closeDetail;
    box.scrollIntoView({ block: "start" });
    if (focus && MapView.focus) MapView.focus(p);
  }
  function closeDetail() {
    $("detail").hidden = true; $("results").hidden = false; $("summary").hidden = false;
    state.selected = null;
  }

  function bind() {
    document.querySelectorAll(".seg button").forEach((b) => b.onclick = () => { state.kind = b.dataset.kind; syncControls(); closeDetail(); render(); });
    $("fDay").onchange = (e) => { state.day = e.target.value; closeDetail(); render(); };
    $("fFrom").onchange = (e) => { state.from = Number(e.target.value); closeDetail(); render(); };
    $("fTo").onchange = (e) => { state.to = Number(e.target.value); closeDetail(); render(); };
    $("fArx").onchange = (e) => { state.arx = e.target.value; fillComs(); closeDetail(); render(true); };
    $("fCom").onchange = (e) => { state.com = e.target.value; closeDetail(); render(true); };
    $("fMun").onchange = (e) => { state.mun = e.target.value; closeDetail(); render(true); };
    $("fLang").onchange = (e) => { state.lang = e.target.value; closeDetail(); render(); };
    let t; $("fText").oninput = (e) => { clearTimeout(t); t = setTimeout(() => { state.text = e.target.value.trim(); closeDetail(); render(true); }, 200); };
    $("quickTimes").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.from === "now") { const n = nowBcn(); state.day = "today"; state.from = n.min; state.to = 1439; }
      else { state.from = toMin(b.dataset.from); state.to = toMin(b.dataset.to); }
      syncControls(); closeDetail(); render();
    };
    $("results").onclick = (e) => { const li = e.target.closest("li[data-id]"); if (li) showDetail(li.dataset.id); };
    $("nearMe").onclick = () => locate().then(() => render(true)).catch(() => { $("summary").textContent = "No se ha podido obtener tu ubicación. Elige tu zona en los filtros o pregunta al asistente."; });
    $("reset").onclick = () => { Object.assign(state, { kind: "mass", day: "today", from: 0, to: 1439, arx: "", com: "", mun: "", lang: "", text: "", near: null }); syncControls(); closeDetail(); render(true); };
    MapView.onClick = (id) => showDetail(id, false);
  }

  function locate() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject();
      navigator.geolocation.getCurrentPosition((pos) => {
        state.user = [pos.coords.latitude, pos.coords.longitude];
        state.near = state.user;
        MapView.showUser && MapView.showUser(state.user);
        resolve(state.user);
      }, reject, { enableHighAccuracy: true, timeout: 10000 });
    });
  }

  // ---------- Asistente (lenguaje natural, sin servidor) ----------
  const WEEKDAYS = [
    ["mon", /\b(lunes|dilluns)\b/], ["tue", /\b(martes|dimarts)\b/], ["wed", /\b(miercoles|dimecres)\b/],
    ["thu", /\b(jueves|dijous)\b/], ["fri", /\b(viernes|divendres)\b/], ["sat", /\b(sabado|dissabte)\b/],
    ["sun", /\b(domingo|diumenge|festivo|festiu|festius|festivos)\b/]
  ];

  function parseHour(numStr, minStr, ctx, defaultPm) {
    let h = Number(numStr), m = Number(minStr || 0);
    if (/(tarde|noche|nit|vespre|pm)/.test(ctx) && h < 12) h += 12;
    else if (defaultPm && h >= 1 && h <= 9) h += 12; // "entre las 5 y las 8" casi siempre es por la tarde
    return Math.min(h, 23) * 60 + Math.min(m, 59);
  }

  const zoneIndex = (() => {
    const items = [];
    const add = (key, z) => { const k = norm(key).trim(); if (k.length >= 3) items.push([k, z]); };
    const muns = new Map();
    for (const p of DATA) {
      if (p.municipality && p.lat != null) {
        if (!muns.has(p.municipality)) muns.set(p.municipality, []);
        muns.get(p.municipality).push([p.lat, p.lng]);
      }
    }
    for (const [name, pts] of muns) {
      const c = [pts.reduce((s, x) => s + x[0], 0) / pts.length, pts.reduce((s, x) => s + x[1], 0) / pts.length];
      if (name !== "Barcelona") add(name, { type: "mun", name, center: c });
      const short = name.replace(/^(l'|el |la |les )/i, "").replace(/ de (llobregat|besos|besòs|gramenet|mar|dalt)$/i, "");
      if (short !== name && short.length > 4) add(short, { type: "mun", name, center: c });
    }
    add("hospitalet", { type: "mun", name: "L'Hospitalet de Llobregat", center: (muns.get("L'Hospitalet de Llobregat") || [[41.36, 2.11]])[0] });
    for (const com of new Set(DATA.map((p) => p.comunitat))) add(com, { type: "com", name: com });
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
      const re = new RegExp(`[^a-z0-9]${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^a-z0-9]`);
      if (re.test(pad)) return z;
    }
    return null;
  }

  function parseQuery(text) {
    const q = norm(text);
    const f = { kind: "mass", day: "today", from: 0, to: 1439, arx: "", com: "", mun: "", lang: "", text: "" };
    if (/confes|penitencia|reconcilia/.test(q)) f.kind = "confession";
    else if (/adora|santisim|exposicio|exposicion|hora santa/.test(q)) f.kind = "adoration";

    if (/pasado manana|passat dema/.test(q)) f.day = nextDay(nextDay(nowBcn().day));
    else if (/(^|[^a-z])(dema|manana)([^a-z]|$)/.test(q.replace(/(por|de|a|en) la manana/g, " ").replace(/del dema/g, " "))) f.day = "tomorrow";
    for (const [code, re] of WEEKDAYS) if (re.test(q)) f.day = code;
    if (/fin de semana|cap de setmana/.test(q) && f.day === "today") f.day = "sun";
    if (/(cualquier|qualsevol) dia|entre semana/.test(q) && f.day === "today") f.day = "any";

    let m;
    const H = "(\\d{1,2})(?:[:.h](\\d{2}))?\\s*h?";
    if ((m = q.match(new RegExp(`(?:entre|de|desde)\\s+(?:las|la|les)?\\s*${H}.*?\\s(?:y|i|a|hasta|fins)\\s+(?:las|la|les)?\\s*${H}`)))) {
      const pm = !/(manana|mati|matin)/.test(q);
      f.from = parseHour(m[1], m[2], q, pm); f.to = parseHour(m[3], m[4], q, pm);
      if (f.to < f.from) f.to = Math.min(f.to + 720, 1439);
    } else if ((m = q.match(new RegExp(`(?:a partir de|despues de|desde|des de|mas tarde de|a partir)\\s+(?:las|la|les)?\\s*${H}`)))) {
      f.from = parseHour(m[1], m[2], q, !/(manana|mati)/.test(q)); f.to = 1439;
    } else if ((m = q.match(new RegExp(`(?:antes de|abans de|como tarde a)\\s+(?:las|la|les)?\\s*${H}`)))) {
      f.from = 0; f.to = parseHour(m[1], m[2], q, !/(manana|mati)/.test(q));
    } else if ((m = q.match(new RegExp(`(?:a las|sobre las|hacia las|cap a les|a les|las|les)\\s*${H}`)))) {
      const t = parseHour(m[1], m[2], q, !/(manana|mati)/.test(q)); f.from = Math.max(0, t - 30); f.to = Math.min(1439, t + 30);
    } else if (/(por|de|a) la manana|al mati|pel mati|del mati/.test(q)) { f.from = 7 * 60; f.to = 13 * 60; }
    else if (/mediodia|migdia/.test(q)) { f.from = 12 * 60; f.to = 15 * 60; }
    else if (/(por|a|de) la tarde|a la tarda|per la tarda|aquesta tarda|esta tarde/.test(q)) { f.from = 16 * 60; f.to = 21 * 60; }
    else if (/noche|nit|vespre/.test(q)) { f.from = 20 * 60; f.to = 1439; }
    else if (/ahora|ara mateix|ya mismo|cuanto antes|lo antes|pronto|en un rato/.test(q) || f.day === "today") {
      const n = nowBcn(); f.from = n.min; f.to = 1439;
    }
    if (/catalan|catala/.test(q)) f.lang = "ca";
    else if (/castellano|espanol|castella/.test(q)) f.lang = "es";

    const near = /cerca de mi|aprop meu|a prop meu|donde estoy|on soc|mi ubicacion|aqui/.test(q);
    const zone = near ? null : findZone(q);
    return { f, zone, near };
  }

  function describe(f, zone, near) {
    const day = resolvedDay(f.day);
    const dayTxt = f.day === "today" ? "hoy" : f.day === "tomorrow" ? "mañana" : f.day === "any" ? "cualquier día" : `el ${DAY_NAMES[day].toLowerCase()}`;
    const t = f.from === 0 && f.to >= 1439 ? "" : f.to >= 1439 ? ` a partir de las ${fmt(f.from)}` : ` entre las ${fmt(f.from)} y las ${fmt(f.to)}`;
    const where = near ? " cerca de ti" : zone ? ` cerca de ${zone.type === "com" ? "la comunidad " : ""}${zone.name.replace(/(^|[\s-])(\S)/g, (m, a, c) => a + c.toUpperCase())}` : "";
    return `${KIND_LABEL[f.kind][0].toUpperCase() + KIND_LABEL[f.kind].slice(1)} ${dayTxt}${t}${where}`;
  }

  function addMsg(html, who) {
    const d = document.createElement("div");
    d.className = `msg ${who}`; d.innerHTML = html;
    $("msgs").appendChild(d); $("msgs").scrollTop = $("msgs").scrollHeight;
    return d;
  }

  async function answer(text) {
    const { f, zone, near } = parseQuery(text);
    let origin = null;
    if (near) {
      try { origin = await locate(); } catch (e) { addMsg("No he podido saber dónde estás. Dime el barrio o el municipio, por ejemplo: «estoy en Sants».", "bot"); return; }
    }
    if (zone && zone.type === "com") f.com = zone.name;
    else if (zone && zone.center) origin = zone.center;
    else if (zone && zone.type === "mun") f.mun = zone.name;

    let res = search(f, origin);
    if (origin && !f.com) {
      const close = res.filter((r) => r.d != null && r.d <= 2.5);
      res = close.length >= 3 ? close : res.filter((r) => r.d != null && r.d <= 6);
    }
    const head = describe(f, zone, near);
    if (!res.length) {
      addMsg(`${esc(head)}: no he encontrado nada. Prueba con otra franja horaria (por ejemplo «por la tarde») u otro día.`, "bot");
      return;
    }
    const top = res.slice(0, 6);
    const li = top.map(({ p, hits, soft, d }) => {
      const times = soft ? "confesión antes de misa o a petición" : hits.map((h) => h.start + (h.end ? "–" + h.end : "")).join(", ");
      return `<li><a href="#" data-id="${esc(p.id)}">${esc(p.name)}</a>${p.municipality && p.municipality !== "Barcelona" ? ` (${esc(p.municipality)})` : ""}: <strong>${esc(times)}</strong>${d != null ? ` · ${d < 1 ? Math.round(d * 1000) + " m" : d.toFixed(1) + " km"}` : ""}</li>`;
    }).join("");
    const msg = addMsg(`${esc(head)}. He encontrado ${res.length} ${res.length === 1 ? "opción" : "opciones"}${res.length > 6 ? ", estas son las más " + (origin ? "cercanas" : "próximas en hora") : ""}:<ul>${li}</ul><button class="link" type="button">Ver todas en el mapa</button>`, "bot");
    msg.querySelectorAll("a[data-id]").forEach((a) => a.onclick = (e) => { e.preventDefault(); applyAndShow(f, origin, a.dataset.id); });
    msg.querySelector("button").onclick = () => applyAndShow(f, origin, null);
  }

  function applyAndShow(f, origin, id) {
    Object.assign(state, f, { near: origin });
    syncControls(); closeDetail(); render(true);
    if (window.matchMedia("(max-width: 800px)").matches) $("chat").hidden = true;
    if (id) showDetail(id);
  }

  function bindChat() {
    $("chatToggle").onclick = () => {
      const c = $("chat"); c.hidden = !c.hidden;
      if (!c.hidden) {
        if (!$("msgs").children.length) addMsg("¡Hola! Dime dónde estás y cuándo quieres ir. Por ejemplo:<ul><li>Estoy en Gràcia y quiero misa entre las 17 y las 20</li><li>Confesiones el sábado por la mañana en Badalona</li><li>Misa el domingo cerca de mí</li><li>Adoración hoy en Sarrià</li></ul>", "bot");
        $("chatInput").focus();
      }
    };
    $("chatClose").onclick = () => { $("chat").hidden = true; };
    $("chatForm").onsubmit = (e) => {
      e.preventDefault();
      const v = $("chatInput").value.trim(); if (!v) return;
      addMsg(esc(v), "me"); $("chatInput").value = "";
      answer(v);
    };
  }

  // ---------- Arranque ----------
  async function start() {
    fillSelects();
    state.to = 1439;
    const gen = window.MISAS_DATA && window.MISAS_DATA.meta && window.MISAS_DATA.meta.generated;
    if (gen) $("genDate").textContent = `Actualizado: ${gen}.`;
    try {
      if (CFG.googleMapsApiKey) await initGoogle(); else initLeaflet();
    } catch (e) {
      console.warn("Google Maps no disponible, uso OpenStreetMap", e); initLeaflet();
    }
    bind(); bindChat(); syncControls(); render(true);
  }
  window.MisasApp = { parseQuery, search, DATA }; // útil para pruebas
  start();
})();
