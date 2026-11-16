// Detalles visuales de Misas Barcelona (noviembre de 2026).
// Cada bloque es independiente: si uno falla, el resto de la web sigue igual.
// Todo respeta «reducir movimiento» (MisasApp.calm) y los dos idiomas (castellano y catalán).
(() => {
  const A = window.MisasApp;
  if (!A) return;
  const $ = (id) => document.getElementById(id);
  const t = (k, v) => A.t(k, v);
  const safe = (name, fn) => { try { fn(); } catch (e) { console.warn("[extras] " + name, e); } };
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  const isDark = () => document.documentElement.dataset.theme === "dark" ||
    (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
  const DAYMS = 864e5;
  // Fecha de hoy en Barcelona, como «2026-11-15»
  const todayKey = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const hhmm = (m) => String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  // Próxima misa de hoy (desde ahora) en una parroquia: { ev, min } o null
  function nextMassToday(p) {
    const now = A.nowBcn();
    let best = null;
    for (const ev of p.masses || []) {
      if (!A.dayMatch(ev, now.day)) continue;
      const m = A.toMin(ev.start);
      if (m >= now.min && (!best || m < best.min)) best = { ev, min: m };
    }
    return best;
  }

  A.i18n("es", {
    xWalk: "<b>{m} min</b> a pie",
    xWalkLeave: "<b>{m} min</b> a pie · sal antes de las {h}",
    xWalkNote: "Línea recta: el camino real puede ser algo más largo.",
    xLitK: "Año litúrgico",
    xLitDays: "días", xLitDay: "día",
    xLitLeft: "Faltan {n} días para {x}.", xLitLeft1: "Mañana es {x}.", xLitToday: "Hoy es {x}.",
    xLitKing: "El domingo {d} es Cristo Rey.",
    xSeason: { adv: "Adviento", xmas: "Navidad", ord: "Tiempo ordinario", lent: "Cuaresma", holy: "Semana Santa", easter: "Pascua", pent: "Pentecostés" },
    xSeasonEnd: { adv: "Navidad", xmas: "el Bautismo del Señor", ord1: "el Miércoles de Ceniza", lent: "el Domingo de Ramos", holy: "el Domingo de Pascua", easter: "Pentecostés", ord2: "el Adviento" },
    xOrdLate: "Últimas semanas del tiempo ordinario",
    xLitCol: { v: "morado", w: "blanco", g: "verde", r: "rojo" }, xLitColT: "Color litúrgico de este día",
    xSantosK1: "Hoy se celebra", xSantosK: "Hoy se celebran", xSantosOn: "Se celebra el {d}", xSantosOnN: "Se celebran el {d}",
    xRank: { S: "solemnidad", F: "fiesta", M: "memoria", m: "memoria libre", C: "conmemoración" },
    xCat: { mar: "Mártir", doc: "Doctor de la Iglesia", doc_f: "Doctora de la Iglesia", apo: "Apóstol", eva: "Evangelista", pas: "Pastor", vir: "Virgen", rel: "Religioso", rel_f: "Religiosa", san: "Santo", san_f: "Santa", mar0: "Virgen María", sen: "Fiesta del Señor", ang: "Ángeles", dif: "Difuntos", ded: "Dedicación", tie: "Tiempo litúrgico" },
    xSunday: "este año coincide con domingo y no se celebra",
    xMov: { fam: "Sagrada Familia de Jesús, María y José", bapt: "Bautismo del Señor", ash: "Miércoles de Ceniza", palm: "Domingo de Ramos", thu: "Jueves Santo", fri: "Viernes Santo", sat: "Sábado Santo", easter: "Domingo de Pascua", asc: "Ascensión del Señor", pent: "Pentecostés", mother: "Santa María, Madre de la Iglesia", trin: "Santísima Trinidad", corpus: "Santísimo Cuerpo y Sangre de Cristo", heart: "Sagrado Corazón de Jesús", iheart: "Inmaculado Corazón de María", king: "Jesucristo, Rey del universo" },
    xCandleT: "Enciende una vela",
    xCandleP: "Has llegado al final del rosario. Deja una vela encendida por tu intención: se queda encendida hoy en este móvil.",
    xCandleBtn: "Encender la vela",
    xCandleOnT: "Tu vela está <em>encendida</em>",
    xCandleOnP: "Queda encendida hasta mañana. Que la Virgen te acompañe.",
    xShareTop: "Misa hoy · {d}", xShareTopAny: "Horarios de misa",
    xShareImg: "Imagen de la parroquia para compartir",
    xCredK: "Credencial del peregrino",
    xCredT: "Ruta de los <em>templos</em>",
    xCredP: "Visita los grandes templos de Barcelona. Cuando estés dentro, pulsa «Estoy aquí» y se pone el sello.",
    xCredBtn: "Estoy aquí",
    xCredOf: "{n} de {t} sellos",
    xCredNew: "¡Sello de {x}!",
    xCredHave: "Ya tienes el sello de {x}.",
    xCredFar: "El templo más cercano, {x}, está a {d}. Acércate para el sello.",
    xCredGeo: "No puedo saber dónde estás. Revisa el permiso de ubicación.",
    xCredDone: "¡Credencial completa! Has visitado los nueve templos.",
  });
  A.i18n("ca", {
    xWalk: "<b>{m} min</b> a peu",
    xWalkLeave: "<b>{m} min</b> a peu · surt abans de les {h}",
    xWalkNote: "Línia recta: el camí real pot ser una mica més llarg.",
    xLitK: "Any litúrgic",
    xLitDays: "dies", xLitDay: "dia",
    xLitLeft: "Falten {n} dies per a {x}.", xLitLeft1: "Demà és {x}.", xLitToday: "Avui és {x}.",
    xLitKing: "El diumenge {d} és Crist Rei.",
    xSeason: { adv: "Advent", xmas: "Nadal", ord: "Temps ordinari", lent: "Quaresma", holy: "Setmana Santa", easter: "Pasqua", pent: "Pentecosta" },
    xSeasonEnd: { adv: "Nadal", xmas: "el Baptisme del Senyor", ord1: "el Dimecres de Cendra", lent: "el Diumenge de Rams", holy: "el Diumenge de Pasqua", easter: "Pentecosta", ord2: "l'Advent" },
    xOrdLate: "Últimes setmanes del temps ordinari",
    xLitCol: { v: "morat", w: "blanc", g: "verd", r: "vermell" }, xLitColT: "Color litúrgic d'aquest dia",
    xSantosK1: "Avui se celebra", xSantosK: "Avui se celebren", xSantosOn: "Se celebra el {d}", xSantosOnN: "Se celebren el {d}",
    xRank: { S: "solemnitat", F: "festa", M: "memòria", m: "memòria lliure", C: "commemoració" },
    xCat: { mar: "Màrtir", doc: "Doctor de l'Església", doc_f: "Doctora de l'Església", apo: "Apòstol", eva: "Evangelista", pas: "Pastor", vir: "Verge", rel: "Religiós", rel_f: "Religiosa", san: "Sant", san_f: "Santa", mar0: "Mare de Déu", sen: "Festa del Senyor", ang: "Àngels", dif: "Difunts", ded: "Dedicació", tie: "Temps litúrgic" },
    xSunday: "enguany coincideix amb diumenge i no se celebra",
    xMov: { fam: "Sagrada Família de Jesús, Maria i Josep", bapt: "Baptisme del Senyor", ash: "Dimecres de Cendra", palm: "Diumenge de Rams", thu: "Dijous Sant", fri: "Divendres Sant", sat: "Dissabte Sant", easter: "Diumenge de Pasqua", asc: "Ascensió del Senyor", pent: "Pentecosta", mother: "Santa Maria, Mare de l'Església", trin: "Santíssima Trinitat", corpus: "Santíssim Cos i Sang de Crist", heart: "Sagrat Cor de Jesús", iheart: "Immaculat Cor de Maria", king: "Jesucrist, Rei de l'univers" },
    xCandleT: "Encén una espelma",
    xCandleP: "Has arribat al final del rosari. Deixa una espelma encesa per la teva intenció: es queda encesa avui en aquest mòbil.",
    xCandleBtn: "Encendre l'espelma",
    xCandleOnT: "La teva espelma és <em>encesa</em>",
    xCandleOnP: "Es queda encesa fins demà. Que la Mare de Déu t'acompanyi.",
    xShareTop: "Missa avui · {d}", xShareTopAny: "Horaris de missa",
    xShareImg: "Imatge de la parròquia per compartir",
    xCredK: "Credencial del pelegrí",
    xCredT: "Ruta dels <em>temples</em>",
    xCredP: "Visita els grans temples de Barcelona. Quan hi siguis a dins, prem «Sóc aquí» i es posa el segell.",
    xCredBtn: "Sóc aquí",
    xCredOf: "{n} de {t} segells",
    xCredNew: "Segell de {x}!",
    xCredHave: "Ja tens el segell de {x}.",
    xCredFar: "El temple més proper, {x}, és a {d}. Apropa-t'hi per tenir el segell.",
    xCredGeo: "No puc saber on ets. Revisa el permís d'ubicació.",
    xCredDone: "Credencial completa! Has visitat els nou temples.",
  });
  const tr = (k) => { const v = t(k); return v == null ? "" : v; };

  // ---------- 9. Camino a pie hasta la parroquia que abres (si sabemos dónde estás) ----------
  safe("camino", () => {
    let label = null;
    const map = () => A.MapView.map;
    function clear() {
      const m = map();
      if (label) { label.remove(); label = null; }
      if (m && m.getLayer && m.getLayer("x-walk")) { m.removeLayer("x-walk"); m.removeLayer("x-walk-c"); m.removeSource("x-walk"); }
    }
    function draw(p) {
      clear();
      const m = map(), u = A.state.user;
      if (!m || !u || p.lat == null || !window.maplibregl) return;
      const d = A.distKm(u, [p.lat, p.lng]);
      if (d > 4 || d < 0.05) return; // más de 4 km ya no es un paseo
      const go = () => {
        if (A.state.detailId !== p.id) return;
        const from = [u[1], u[0]], to = [p.lng, p.lat];
        m.addSource("x-walk", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [from, to] } } });
        m.addLayer({ id: "x-walk-c", type: "line", source: "x-walk", layout: { "line-cap": "round" }, paint: { "line-color": isDark() ? "#1d1819" : "#ffffff", "line-width": 8, "line-opacity": 0.9 } });
        m.addLayer({ id: "x-walk", type: "line", source: "x-walk", layout: { "line-cap": "round" }, paint: { "line-color": getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ec5a5f", "line-width": 4.5, "line-dasharray": [0.1, 1.9] } });
        const min = Math.max(1, Math.round(d * 1.3 / 4.5 * 60)), nx = nextMassToday(p), now = A.nowBcn().min;
        const el = document.createElement("div");
        el.className = "x-walk";
        el.title = tr("xWalkNote");
        el.innerHTML = "<span>" + (nx && nx.min - min >= now ? t("xWalkLeave", { m: min, h: hhmm(nx.min - min) }) : t("xWalk", { m: min })) + "</span>";
        label = new maplibregl.Marker({ element: el, anchor: "bottom", offset: [0, -6] }).setLngLat([(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]).addTo(m);
        const b = new maplibregl.LngLatBounds(from, from).extend(to);
        const pad = matchMedia("(max-width: 860px)").matches ? { top: 110, bottom: 150, left: 50, right: 50 } : { top: 110, bottom: 80, left: 90, right: 90 };
        setTimeout(() => { if (A.state.detailId === p.id) m.fitBounds(b, { padding: pad, maxZoom: 16, duration: A.calm() ? 0 : 700 }); }, 650);
      };
      if (m.isStyleLoaded && m.isStyleLoaded()) go(); else m.once("load", go);
    }
    document.addEventListener("misas:detail", (e) => safe("camino", () => (e.detail && e.detail.p ? draw(e.detail.p) : clear())));
  });

  // ---------- 11. Luz de vidriera sobre la Palabra del día ----------
  safe("vitral", () => {
    const inner = document.querySelector("#wordcol .dev-inner");
    if (!inner || inner.querySelector(".x-glass")) return;
    inner.insertAdjacentHTML("afterbegin", '<div class="x-glass" aria-hidden="true"></div>');
  });

  // ---------- 12. El año litúrgico en un círculo (Palabra del día) ----------
  // Calendario romano: Adviento empieza el domingo entre el 27 de noviembre y el 3 de diciembre;
  // Navidad llega hasta el Bautismo del Señor; Pascua según el cómputo; Ceniza = Pascua − 46; Pentecostés = Pascua + 49.
  const D = (y, m, d) => Date.UTC(y, m, d);
  const advent1 = (y) => { const x = D(y, 11, 3); return x - new Date(x).getUTCDay() * DAYMS; };
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
    return D(y, mo - 1, da);
  }
  function litYear(ms) {
    const y = new Date(ms).getUTCFullYear(), Y = ms >= advent1(y) ? y + 1 : y; // año de la próxima Pascua
    const start = advent1(Y - 1), end = advent1(Y), xmas = D(Y - 1, 11, 25);
    const epi = D(Y, 0, 6), bapt = epi + (7 - new Date(epi).getUTCDay()) * DAYMS;
    const E = easter(Y), ash = E - 46 * DAYMS, palm = E - 7 * DAYMS, pent = E + 49 * DAYMS;
    const segs = [
      { k: "adv", lc: "v", from: start, to: xmas, c: "#7a4bb0", end: "adv", next: xmas },
      { k: "xmas", lc: "w", from: xmas, to: bapt + DAYMS, c: "#d9b23c", end: "xmas", next: bapt },
      { k: "ord", lc: "g", from: bapt + DAYMS, to: ash, c: "#1f8a4c", end: "ord1", next: ash },
      { k: "lent", lc: "v", from: ash, to: palm, c: "#7a4bb0", end: "lent", next: palm },
      { k: "holy", lc: "r", from: palm, to: E, c: "#c8323a", end: "holy", next: E },
      { k: "easter", lc: "w", from: E, to: pent, c: "#d9b23c", end: "easter", next: pent },
      { k: "pent", lc: "r", from: pent, to: pent + DAYMS, c: "#c8323a", end: "ord2", next: end },
      { k: "ord", lc: "g", from: pent + DAYMS, to: end, c: "#1f8a4c", end: "ord2", next: end, late: true },
    ];
    return { start, end, segs, king: end - 7 * DAYMS };
  }
  safe("anillo", () => {
    const nav = document.querySelector("#wordcol .daynav");
    if (!nav) return;
    const box = document.createElement("div");
    box.className = "x-year";
    nav.insertAdjacentElement("afterend", box);
    let shown = null;
    const arc = (a1, a2) => {
      const p = (a) => { const r = 48, q = (a - 90) * Math.PI / 180; return (59 + r * Math.cos(q)).toFixed(2) + " " + (59 + r * Math.sin(q)).toFixed(2); };
      return `M${p(a1)} A48 48 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${p(a2)}`;
    };
    function render(date) {
      shown = date || shown || new Date(D(...todayKey().split("-").map((n, i) => i === 1 ? n - 1 : +n)));
      const ms = Date.UTC(shown.getUTCFullYear(), shown.getUTCMonth(), shown.getUTCDate());
      const Y = litYear(ms), total = Y.end - Y.start, ang = (x) => (x - Y.start) / total * 360;
      const cur = Y.segs.find((s) => ms >= s.from && ms < s.to) || Y.segs[0];
      let svg = `<svg viewBox="0 0 118 118" aria-hidden="true"><circle cx="59" cy="59" r="48" fill="none" stroke="var(--line)" stroke-width="12"/>`;
      for (const s of Y.segs) {
        const a1 = ang(s.from), a2 = ang(s.to), gap = a2 - a1 > 3 ? 0.8 : 0;
        svg += `<path d="${arc(a1 + gap, a2 - gap)}" fill="none" stroke="${s.c}" stroke-width="${s === cur ? 13 : 10}" ${s === cur ? "" : 'opacity=".55"'}/>`;
      }
      const a = (ang(ms) - 90) * Math.PI / 180, cx = 59 + 48 * Math.cos(a), cy = 59 + 48 * Math.sin(a);
      const left = Math.round((cur.next - ms) / DAYMS);
      svg += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="7.5" fill="var(--bg)" stroke="var(--ink)" stroke-width="3"/>`;
      svg += `<text x="59" y="60" text-anchor="middle" class="n">${left}</text><text x="59" y="76" text-anchor="middle" class="u">${(left === 1 ? tr("xLitDay") : tr("xLitDays")).toUpperCase()}</text></svg>`;
      const S = t("xSeason"), E = t("xSeasonEnd");
      const name = cur.late && left <= 21 ? tr("xOrdLate") : S[cur.k];
      const goal = E[cur.end];
      let txt = left === 0 ? t("xLitToday", { x: goal }) : left === 1 ? t("xLitLeft1", { x: goal }) : t("xLitLeft", { n: left, x: goal });
      if (cur.late && Y.king > ms && Y.king - ms <= 14 * DAYMS) {
        const d = new Intl.DateTimeFormat(A.lang() === "ca" ? "ca-ES" : "es-ES", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Y.king));
        txt += " " + t("xLitKing", { d });
      }
      // 10. Etiqueta del tiempo litúrgico en su color (el resto de la página sigue igual)
      const lit = $("wordLit");
      if (lit) {
        let tag = $("xLitTag");
        if (!tag) { tag = document.createElement("p"); tag.id = "xLitTag"; tag.className = "x-littag"; lit.insertAdjacentElement("afterend", tag); }
        tag.dataset.lc = cur.lc;
        tag.title = tr("xLitColT");
        tag.innerHTML = `<i aria-hidden="true"></i>${A.esc(S[cur.k])} <small>· ${A.esc(t("xLitCol")[cur.lc])}</small>`;
      }
      safe("santos", () => renderSantos(ms));
      box.innerHTML = `${svg}<div><p class="k" style="--c:${cur.c}">${tr("xLitK")}</p><b>${A.esc(name)}</b><p>${A.esc(txt)}</p></div>`;
    }
    document.addEventListener("misas:wordday", (e) => safe("anillo", () => render(e.detail && e.detail.date)));
    A.onLang(() => render());
    render();
  });

  // ---------- Santos del día según el Calendario Romano General (en su color litúrgico) ----------
  // Las fijas salen de data/santoral.js; las móviles se calculan con la Pascua.
  function movables(ms) {
    const y = new Date(ms).getUTCFullYear(), E = easter(y), at = (d) => d === ms;
    const out = [];
    const add = (k, rank, cat, c) => out.push([rank, cat, c, t("xMov")[k], k]);
    const xmas = D(y, 11, 25), xd = new Date(xmas).getUTCDay();
    const fam = xd === 0 ? D(y, 11, 30) : xmas + (7 - xd) * DAYMS;
    if (at(fam)) add("fam", "F", "sen", "w");
    const epi = D(y, 0, 6), bapt = epi + (7 - new Date(epi).getUTCDay()) * DAYMS;
    if (at(bapt)) add("bapt", "F", "sen", "w");
    const L = [["ash", -46, "C", "tie", "v"], ["palm", -7, "C", "sen", "r"], ["thu", -3, "C", "sen", "w"], ["fri", -2, "C", "sen", "r"], ["sat", -1, "C", "sen", "v"],
      ["easter", 0, "S", "sen", "w"], ["asc", 42, "S", "sen", "w"], ["pent", 49, "S", "sen", "r"], ["mother", 50, "M", "mar0", "w"],
      ["trin", 56, "S", "sen", "w"], ["corpus", 63, "S", "sen", "w"], ["heart", 68, "S", "sen", "w"], ["iheart", 69, "M", "mar0", "w"]];
    for (const [k, off, rank, cat, c] of L) if (at(E + off * DAYMS)) add(k, rank, cat, c);
    if (at(advent1(y) - 7 * DAYMS)) add("king", "S", "sen", "w");
    return out;
  }
  function renderSantos(ms) {
    const lit = $("xLitTag") || $("wordLit");
    if (!lit) return;
    let box = $("xSantos");
    if (!box) { box = document.createElement("div"); box.id = "xSantos"; box.className = "x-santos"; lit.insertAdjacentElement("afterend", box); }
    const d = new Date(ms), key = String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
    const ca = A.lang() === "ca", fixed = ((window.MISAS_SANTORAL || {})[key] || []).map((x) => [x[0], x[1], x[2], ca ? x[4] : x[3]]);
    const mov = movables(ms), sunday = d.getUTCDay() === 0;
    const list = mov.concat(fixed);
    if (!list.length) { box.hidden = true; return; }
    box.hidden = false;
    const today = ms === Date.UTC(...todayKey().split("-").map((n, i) => i === 1 ? n - 1 : +n));
    const df = new Intl.DateTimeFormat(ca ? "ca-ES" : "es-ES", { day: "numeric", month: "long", timeZone: "UTC" }).format(d);
    const head = today ? tr(list.length > 1 ? "xSantosK" : "xSantosK1") : t(list.length > 1 ? "xSantosOnN" : "xSantosOn", { d: df });
    const C = t("xCat"), R = t("xRank"), COL = t("xLitCol");
    box.innerHTML = `<p class="k">${A.esc(head)}</p><ul>${list.map(([rank, cat, c, text], idx) => {
      const i = text.indexOf(", "), name = i > 0 ? text.slice(0, i) : text, desc = i > 0 ? text.slice(i + 2) : "";
      const fem = /^(Santa|Santas|Santes)\b/.test(name) && !/ y san| i sant/.test(name);
      const label = C[fem && C[cat + "_f"] ? cat + "_f" : cat] || "";
      // En domingo no se celebran las memorias ni las fiestas de santos (sí las solemnidades y las fiestas del Señor).
      const off = sunday && idx >= mov.length && ((rank === "M" || rank === "m") || (rank === "F" && cat !== "sen"));
      return `<li class="x-santo${off ? " off" : ""}" data-c="${c}"><i aria-hidden="true"></i><span><b>${A.esc(name)}</b>${desc ? ", " + A.esc(desc) : ""}` +
        `<small>${A.esc([label, R[rank], COL[c]].filter(Boolean).join(" · "))}${off ? " · " + A.esc(tr("xSunday")) : ""}</small></span></li>`;
    }).join("")}</ul>`;
  }

  // ---------- 13. Cuentas del rosario que se encienden al bajar ----------
  safe("cuentas", () => {
    const ring = document.createElement("div");
    ring.className = "x-beads"; ring.setAttribute("aria-hidden", "true"); ring.hidden = true;
    const cx = 40, cy = 36, r = 29, beads = [];
    let s = `<svg viewBox="0 0 80 90"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
    let n = 0;
    for (let d = 0; d < 5; d++) for (let i = 0; i < 11; i++) {
      const big = i === 0, a = Math.PI / 2 + (n + 0.5) / 55 * 2 * Math.PI;
      s += `<circle data-b="${n}" class="${big ? "big" : ""}" cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a)).toFixed(1)}" r="${big ? 3 : 1.8}"/>`;
      n++;
    }
    s += `<circle class="pd" cx="${cx}" cy="${cy + r + 6}" r="1.9"/><circle class="pd" cx="${cx}" cy="${cy + r + 11}" r="1.9"/><circle class="pd" cx="${cx}" cy="${cy + r + 16}" r="1.9"/>`;
    s += `<path class="cr" d="M${cx} ${cy + r + 20}v10M${cx - 4} ${cy + r + 23}h8"/><text x="${cx}" y="${cy + 2}" text-anchor="middle" class="n"></text><text x="${cx}" y="${cy + 12}" text-anchor="middle" class="u"></text></svg>`;
    ring.innerHTML = s;
    document.body.appendChild(ring);
    const dots = [...ring.querySelectorAll("[data-b]")], pend = [...ring.querySelectorAll(".pd, .cr")];
    const num = ring.querySelector("text.n"), unit = ring.querySelector("text.u");
    let raf = 0, last = -2;
    function update() {
      raf = 0;
      const show = A.state.mode === "rosary" && !$("rosText").classList.contains("short");
      ring.hidden = !show;
      if (!show) return;
      const secs = [...document.querySelectorAll("#rosText .ros-mys")];
      if (!secs.length) { ring.hidden = true; return; }
      // Al llegar a la vela del final, el anillo se aparta para no taparla
      const candle = document.querySelector("#rosText .x-candle");
      if (candle && candle.getBoundingClientRect().top < innerHeight - 60) { ring.hidden = true; last = -2; return; }
      // Al lado del botón de volver arriba, dentro de la columna del rosario
      const col = $("rosScroll").getBoundingClientRect(), nav = (document.querySelector(".bottomnav") || {}).offsetHeight || 0;
      const txt = $("rosList").getBoundingClientRect();
      ring.style.left = Math.round(Math.min(col.right - 62 - 12 - 76, txt.right + 32)) + "px";
      ring.style.top = Math.round(Math.min(col.bottom, innerHeight - nav) - 86 - 14) + "px";
      const mid = innerHeight * 0.55;
      let lit = 0, k = -1;
      secs.forEach((sec, i) => {
        const b = sec.getBoundingClientRect();
        if (b.top < mid) { k = i; lit = i * 11 + Math.min(11, Math.max(1, Math.ceil((mid - b.top) / b.height * 11))); }
      });
      if (lit === last) return;
      last = lit;
      dots.forEach((c, i) => { c.classList.toggle("on", i < lit); c.classList.toggle("cur", i === lit - 1); });
      pend.forEach((c) => c.classList.toggle("on", k >= 0));
      num.textContent = k >= 0 ? (A.lang() === "ca" ? ["1r", "2n", "3r", "4t", "5è"][k] : (k + 1) + ".º") : "✝";
      unit.textContent = k >= 0 ? (A.lang() === "ca" ? "MISTERI" : "MISTERIO") : "";
    }
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
    document.addEventListener("scroll", queue, { capture: true, passive: true });
    addEventListener("resize", queue);
    document.addEventListener("misas:mode", () => { last = -2; queue(); });
    document.addEventListener("misas:rosary", () => { last = -2; setTimeout(queue, 60); });
    A.onLang(() => { last = -2; queue(); });
  });

  // ---------- 14. Vela al terminar el rosario ----------
  safe("vela", () => {
    const FLAME = `<g class="fl"><ellipse cx="40" cy="30" rx="26" ry="26" fill="url(#xglow)"/><path d="M40 8C47 20 50 29 46 37c-2.5 5-9.5 5-12 0-4-8-1-17 6-29Z" fill="url(#xfl)"/><path d="M40 22c2.6 5 3.2 9 1.4 12.5-.8 1.5-2 1.5-2.8 0-1.8-3.5-1.2-7.5 1.4-12.5Z" fill="#fff"/></g>`;
    const SVG = (on) => `<svg viewBox="0 0 80 132" aria-hidden="true"><defs><radialGradient id="xglow"><stop offset="0" stop-color="#ffd37a" stop-opacity=".85"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient><linearGradient id="xfl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff8a3d"/><stop offset=".45" stop-color="#ffc44d"/><stop offset="1" stop-color="#fff6d6"/></linearGradient><linearGradient id="xwax" x1="0" x2="1"><stop offset="0" stop-color="#e9ddd2"/><stop offset=".5" stop-color="#fff8ef"/><stop offset="1" stop-color="#d9cabc"/></linearGradient></defs>${on ? FLAME : ""}<rect x="39" y="37" width="2" height="9" rx="1" fill="#3a2a20"/><path d="M18 48q22-6 44 0v76q-22 5-44 0Z" fill="url(#xwax)"/><path d="M18 48q22 6 44 0" fill="none" stroke="#cbb9a8" stroke-width="1.6"/><g fill="#c8323a" opacity=".85"><rect x="38" y="74" width="4" height="26" rx="1"/><rect x="31" y="80" width="18" height="4" rx="1"/></g></svg>`;
    function render(animate) {
      const box = $("rosText");
      if (!box) return;
      let el = box.querySelector(".x-candle");
      if (!el) { el = document.createElement("section"); el.className = "x-candle"; box.appendChild(el); }
      const on = store("misas-vela") === todayKey();
      el.classList.toggle("on", on);
      el.innerHTML = `<div class="x-candle-art${animate ? " lighting" : ""}">${SVG(on)}</div><div><h2>${on ? tr("xCandleOnT") : A.esc(tr("xCandleT"))}</h2><p>${A.esc(tr(on ? "xCandleOnP" : "xCandleP"))}</p>${on ? "" : `<button type="button" class="btn primary x-light">${A.esc(tr("xCandleBtn"))}</button>`}</div>`;
      const b = el.querySelector(".x-light");
      if (b) b.onclick = () => { store("misas-vela", todayKey()); render(true); };
    }
    document.addEventListener("misas:rosary", () => safe("vela", () => render(false)));
    A.onLang(() => render(false));
    if ($("rosText") && $("rosText").children.length) render(false);
  });

  // ---------- 15. Imagen bonita para compartir la parroquia ----------
  const SAGRADA = (() => { const s = document.querySelector(".splash-art svg"); return s ? s.innerHTML : ""; })();
  async function shareImage(p) {
    const W = 1080, H = 1350, c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    try { await Promise.all(["500 90px Newsreader", "italic 500 90px Newsreader", "800 30px Manrope", "600 34px Manrope"].map((f) => document.fonts.load(f))); } catch (e) { /* sin letras: usa las del sistema */ }
    const bg = g.createLinearGradient(0, 0, W * 0.35, H);
    bg.addColorStop(0, "#d43c44"); bg.addColorStop(1, "#8e1d2a");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // La Sagrada Família de fondo (la misma silueta de la pantalla de carga), con sus huecos recortados
    if (SAGRADA && window.Path2D) {
      const o = document.createElement("canvas"); o.width = 760; o.height = 760;
      const og = o.getContext("2d"), sc = 760 / 512;
      og.scale(sc, sc);
      const tmp = document.createElement("div");
      tmp.innerHTML = `<svg>${SAGRADA}</svg>`;
      const draw = (sel, mode) => tmp.querySelectorAll(sel).forEach((n) => {
        og.globalCompositeOperation = mode;
        if (n.tagName === "circle") { og.beginPath(); og.arc(+n.getAttribute("cx"), +n.getAttribute("cy"), +n.getAttribute("r"), 0, 7); og.fill(); }
        else if (n.classList.contains("gs")) { og.lineWidth = +n.getAttribute("stroke-width") || 13; og.lineCap = "round"; og.strokeStyle = "#fff"; og.stroke(new Path2D(n.getAttribute("d"))); }
        else og.fill(new Path2D(n.getAttribute("d")));
      });
      og.fillStyle = "#fff";
      draw(".t1, .t2, .t3, .g, .gs", "source-over");
      draw(".h", "destination-out");
      g.globalAlpha = 0.2; g.drawImage(o, W - 640, H - 700); g.globalAlpha = 1;
    }
    const L = A.lang() === "ca" ? "ca-ES" : "es-ES", nx = nextMassToday(p);
    const day = new Intl.DateTimeFormat(L, { weekday: "long", day: "numeric", timeZone: "Europe/Madrid" }).format(new Date());
    g.fillStyle = "rgba(255,255,255,.85)"; g.font = "800 30px Manrope, sans-serif";
    if (g.letterSpacing !== undefined) g.letterSpacing = "5px";
    g.fillText((nx ? t("xShareTop", { d: day }) : tr("xShareTopAny")).toUpperCase(), 80, 130);
    if (g.letterSpacing !== undefined) g.letterSpacing = "0px";
    // Nombre en varias líneas; la última palabra en dorado y cursiva
    g.font = "500 104px Newsreader, Georgia, serif";
    const words = p.name.split(/\s+/), lines = [];
    let line = "";
    for (const w of words) { const tryL = line ? line + " " + w : w; if (g.measureText(tryL).width > W - 160 && line) { lines.push(line); line = w; } else line = tryL; }
    lines.push(line);
    const shown = lines.slice(0, 4);
    let y = 270;
    shown.forEach((ln, i) => {
      const last = i === shown.length - 1, parts = ln.split(" "), tail = last ? parts.pop() : "";
      g.font = "500 104px Newsreader, Georgia, serif"; g.fillStyle = "#fff";
      const head = last ? parts.join(" ") + (parts.length ? " " : "") : ln;
      g.fillText(head, 80, y);
      if (last) { const x = 80 + g.measureText(head).width; g.font = "italic 500 104px Newsreader, Georgia, serif"; g.fillStyle = "#ffd56b"; g.fillText(tail, x, y); }
      y += 112;
    });
    // Hora de la próxima misa en una pastilla
    if (nx) {
      const LANG = { ca: A.lang() === "ca" ? "en català" : "en catalán", es: A.lang() === "ca" ? "en castellà" : "en castellano" };
      const txt = nx.ev.start, sub = LANG[nx.ev.lang] ? " · " + LANG[nx.ev.lang] : "";
      g.font = "800 58px Manrope, sans-serif"; const w1 = g.measureText(txt).width;
      g.font = "600 36px Manrope, sans-serif"; const w2 = g.measureText(sub).width;
      const pw = w1 + w2 + 76, py = y - 18;
      g.fillStyle = "rgba(255,255,255,.16)";
      g.beginPath(); if (g.roundRect) g.roundRect(80, py, pw, 100, 50); else g.rect(80, py, pw, 100); g.fill();
      g.fillStyle = "#fff"; g.font = "800 58px Manrope, sans-serif"; g.fillText(txt, 118, py + 70);
      g.font = "600 36px Manrope, sans-serif"; g.fillStyle = "rgba(255,255,255,.85)"; g.fillText(sub, 118 + w1, py + 68);
      y = py + 160;
    }
    const where = [p.address, p.municipio === "Barcelona" ? p.distrito : p.municipio].filter(Boolean).join(" · ");
    g.font = "600 36px Manrope, sans-serif"; g.fillStyle = "rgba(255,255,255,.85)";
    g.fillText(where.length > 46 ? where.slice(0, 45) + "…" : where, 80, y + 10);
    // Marca
    g.font = "500 58px Newsreader, Georgia, serif"; g.fillStyle = "#fff";
    const b1 = A.t("brandMain") + " ", bw = g.measureText(b1).width;
    g.fillText(b1, 80, H - 96);
    g.font = "italic 500 58px Newsreader, Georgia, serif"; g.fillStyle = "#ffd56b";
    g.fillText("Barcelona", 80 + bw, H - 96);
    return new Promise((res) => c.toBlob(res, "image/png"));
  }
  A.shareImage = shareImage; // para probarla desde la consola
  safe("compartir", () => {
    document.addEventListener("misas:detail", (e) => safe("compartir", () => {
      const p = e.detail && e.detail.p, btn = $("shareBtn");
      if (!p || !btn || !navigator.canShare || !window.File) return;
      const old = btn.onclick;
      btn.onclick = async () => {
        let file = null;
        try {
          const blob = await shareImage(p);
          if (blob) file = new File([blob], (p.id || "parroquia") + ".png", { type: "image/png" });
        } catch (err) { file = null; }
        if (file && navigator.canShare({ files: [file] })) {
          const url = location.href.split("#")[0] + "#parroquia/" + encodeURIComponent(p.id);
          try { await navigator.share({ files: [file], title: p.name, text: t("shareText", { n: p.name }) + " " + url }); } catch (err) { /* cancelado */ }
          return;
        }
        if (old) old();
      };
    }));
  });

  // ---------- 16. Credencial del peregrino (Voluntariado) ----------
  const TEMPLES = [
    ["sf", "Sagrada Família", "SF", "#c8323a", 41.40363, 2.17436],
    ["cat", "Catedral", "C", "#7a4bb0", 41.38398, 2.17623],
    ["mar", "Santa Maria del Mar", "SM", "#2e6fd0", 41.38376, 2.18200],
    ["merce", "La Mercè", "M", "#1f8a4c", 41.38009, 2.17972],
    ["tibi", "Tibidabo", "T", "#b07a00", 41.42208, 2.11906],
    ["pi", "Santa Maria del Pi", "Pi", "#c8323a", 41.38211, 2.17378],
    ["pau", "Sant Pau del Camp", "SP", "#7a4bb0", 41.37628, 2.16937],
    ["just", "Sants Just i Pastor", "JP", "#2e6fd0", 41.38281, 2.17752],
    ["pedr", "Pedralbes", "P", "#1f8a4c", 41.39561, 2.11234],
  ];
  safe("credencial", () => {
    const head = document.querySelector("#volcol .dev-head");
    if (!head) return;
    const box = document.createElement("section");
    box.className = "x-cred";
    head.insertAdjacentElement("afterend", box);
    const load = () => { try { return JSON.parse(store("misas-credencial") || "{}") || {}; } catch (e) { return {}; } };
    const ROT = [-8, 5, -3, 7, -6, 3, -4, 6, -2];
    function render(fresh) {
      const got = load(), n = TEMPLES.filter((x) => got[x[0]]).length;
      const L = A.lang() === "ca" ? "ca-ES" : "es-ES";
      box.innerHTML = `<p class="eyebrow">${A.esc(tr("xCredK"))}</p>
        <h2>${tr("xCredT")}</h2><p class="sub">${A.esc(tr("xCredP"))}</p>
        <ul class="x-stamps">${TEMPLES.map(([id, name, ab, col], i) => {
          const d = got[id] ? new Intl.DateTimeFormat(L, { day: "numeric", month: "numeric" }).format(new Date(got[id] + "T12:00:00")) : "";
          return `<li class="${got[id] ? "" : "off"}${fresh === id ? " fresh" : ""}"><span class="s" style="--c:${col};--r:${ROT[i]}deg"><i></i><b>${ab}</b><em>${d}</em></span>${A.esc(name)}</li>`;
        }).join("")}</ul>
        <div class="x-progrow"><div class="x-prog" role="progressbar" aria-label="${A.esc(t("xCredOf", { n, t: TEMPLES.length }))}" aria-valuemin="0" aria-valuemax="${TEMPLES.length}" aria-valuenow="${n}"><i style="width:${n / TEMPLES.length * 100}%"></i></div><span>${A.esc(t("xCredOf", { n, t: TEMPLES.length }))}</span></div>
        <button type="button" class="btn primary x-here">${A.esc(tr("xCredBtn"))}</button>`;
      box.querySelector(".x-here").onclick = here;
    }
    function here() {
      if (!navigator.geolocation) { A.toast(tr("xCredGeo")); return; }
      const btn = box.querySelector(".x-here"); btn.disabled = true;
      navigator.geolocation.getCurrentPosition((pos) => {
        btn.disabled = false;
        const me = [pos.coords.latitude, pos.coords.longitude];
        const near = TEMPLES.map((x) => ({ x, d: A.distKm(me, [x[4], x[5]]) })).sort((a, b) => a.d - b.d)[0];
        const got = load(), [id, name] = near.x;
        if (near.d > 0.3) {
          const dist = near.d < 1 ? Math.round(near.d * 1000) + " m" : near.d.toFixed(1).replace(".", ",") + " km";
          A.toast(t("xCredFar", { x: name, d: dist })); return;
        }
        if (got[id]) { A.toast(t("xCredHave", { x: name })); return; }
        got[id] = todayKey(); store("misas-credencial", JSON.stringify(got));
        if (navigator.vibrate) navigator.vibrate([12, 60, 18]);
        render(id);
        const all = TEMPLES.every((x) => got[x[0]]);
        A.toast(all ? tr("xCredDone") : t("xCredNew", { x: name }));
      }, () => { btn.disabled = false; A.toast(tr("xCredGeo")); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
    }
    render();
    A.onLang(() => render());
  });

  // ---------- 18. Tarjetas que se inclinan un poco (ratón o al mover el móvil) ----------
  safe("inclinar", () => {
    if (A.calm()) return;
    const MAX = 4;
    // Ordenador: cada tarjeta sigue al ratón
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.addEventListener("pointermove", (e) => {
        const card = e.target.closest && e.target.closest(".cards .card");
        document.querySelectorAll(".card.x-tilt").forEach((c) => { if (c !== card) { c.classList.remove("x-tilt"); c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); } });
        if (!card) return;
        const b = card.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
        card.classList.add("x-tilt");
        card.style.setProperty("--rx", (-y * MAX).toFixed(2) + "deg");
        card.style.setProperty("--ry", (x * MAX).toFixed(2) + "deg");
        card.style.setProperty("--gx", ((x + 0.5) * 100).toFixed(0) + "%");
        card.style.setProperty("--gy", ((y + 0.5) * 100).toFixed(0) + "%");
      }, { passive: true });
      return;
    }
    // Móvil Android: todas las tarjetas se inclinan a la vez con el móvil (en iPhone pediría permiso, así que no)
    if (!("DeviceOrientationEvent" in window) || typeof DeviceOrientationEvent.requestPermission === "function") return;
    let base = null, raf = 0, rx = 0, ry = 0;
    const root = document.documentElement;
    addEventListener("deviceorientation", (e) => {
      if (e.beta == null || e.gamma == null || document.hidden) return;
      if (!base) base = { b: e.beta, g: e.gamma };
      const cl = (v) => Math.max(-MAX, Math.min(MAX, v));
      rx = rx * 0.8 + cl(-(e.beta - base.b) * 0.25) * 0.2;
      ry = ry * 0.8 + cl((e.gamma - base.g) * 0.25) * 0.2;
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        root.style.setProperty("--trx", rx.toFixed(2) + "deg");
        root.style.setProperty("--try", ry.toFixed(2) + "deg");
        root.style.setProperty("--tgx", (50 + ry * 10).toFixed(0) + "%");
      });
    }, { passive: true });
    root.classList.add("x-tilt-dev");
    document.addEventListener("visibilitychange", () => { if (!document.hidden) base = null; });
  });

  // ---------- 19. Vibración suave al tocar los botones principales (solo móviles que lo permiten) ----------
  safe("vibrar", () => {
    if (!navigator.vibrate) return;
    const SEL = "#favBtn, .send, #newQ, .seg button, .bottomnav button, .x-light, .x-here, .tabs button, .chips button";
    document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(SEL)) { try { navigator.vibrate(8); } catch (err) { /* nada */ } } }, { passive: true });
  });
})();
