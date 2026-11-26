/* «Tu camino»: los días en que has leído la Palabra del día y rezado el Rosario (la semana, el mes y el año),
   y el calendario litúrgico que se abre al tocar el año litúrgico. Sin rachas ni premios (decisión de Guillem, 26/11/2026).
   Todo se guarda solo en este navegador (localStorage «misas-camino»); no hay cuentas ni se envía nada.
   - Cuenta un día de Palabra cuando el evangelio de hoy está a la vista unos segundos.
   - Cuenta un día de Rosario al llegar al final del rosario (o al abrir los cinco misterios en el resumen, o al encender la vela). */
(() => {
  const A = window.MisasApp;
  if (!A) return;
  const $ = (id) => document.getElementById(id);
  const t = (k, v) => A.t(k, v);
  const esc = A.esc;
  const safe = (name, fn) => { try { return fn(); } catch (e) { console.warn("[camino] " + name, e); } };
  const DAY = 864e5;
  const todayKey = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const msOf = (k) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
  const keyOf = (ms) => new Date(ms).toISOString().slice(0, 10);
  const monday = (ms) => ms - ((new Date(ms).getUTCDay() + 6) % 7) * DAY;
  const loc = () => (A.lang() === "ca" ? "ca-ES" : "es-ES");
  const fmt = (ms, o) => new Intl.DateTimeFormat(loc(), Object.assign({ timeZone: "UTC" }, o)).format(new Date(ms));
  const capF = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const calm = () => (A.calm ? A.calm() : false);

  A.i18n("es", {
    cmBtn: "Tu camino", cmTitle: "Tu <em>camino</em>", cmClose: "Cerrar",
    cmRos: "Rosario",
    cmHow: "Aquí ves los días en que has leído la Palabra y rezado el Rosario. Se guarda solo en este móvil.", cmMonthSec: "Día a día",
    cmWeek: "Tu semana · del {a} al {b}",
    cmWeekT: "Has rezado {r} y has leído {w}", cmRosN: "{n} rosarios", cmRos1: "1 rosario", cmEvN: "{n} evangelios", cmEv1: "1 evangelio",
    cmWeek0: "Esta semana aún no hay nada. Hoy es un buen día para empezar.",
    cmYear: "Tu año {y}", cmPal: "Palabra",
    cmPrevM: "Mes anterior", cmNextM: "Mes siguiente",
    cmRowW: "días con la Palabra", cmRowR: "rosarios", cmMys: "los misterios que más rezaste",
    cmSets: { joyful: "Gozosos", sorrowful: "Dolorosos", glorious: "Gloriosos", luminous: "Luminosos" },
    cmSavedW: "Palabra de hoy guardada en Tu camino", cmSavedR: "Rosario de hoy guardado en Tu camino",
    cmCalFoot: "Cada día lleva su color litúrgico. Toca un día para leer sus lecturas.",
    cmStarts: { adv: "empieza el Adviento", xmas: "es Navidad", ord: "vuelve el tiempo ordinario", lent: "es Miércoles de Ceniza y empieza la Cuaresma", holy: "es Domingo de Ramos", easter: "es Domingo de Pascua", pent: "es Pentecostés" },
    cmStartOn: "El {d} {x}.",
    cmWd: ["L", "M", "X", "J", "V", "S", "D"],
    cmCalOpen: "Abrir el calendario litúrgico",
    cmLegC: { g: "Tiempo ordinario", w: "Navidad, Pascua y fiestas del Señor, de la Virgen y de los santos", r: "Mártires, apóstoles y Espíritu Santo", v: "Adviento, Cuaresma y difuntos" },
  });
  A.i18n("ca", {
    cmBtn: "El teu camí", cmTitle: "El teu <em>camí</em>", cmClose: "Tancar",
    cmRos: "Rosari",
    cmHow: "Aquí veus els dies que has llegit la Paraula i resat el Rosari. Només es desa en aquest mòbil.", cmMonthSec: "Dia a dia",
    cmWeek: "La teva setmana · del {a} al {b}",
    cmWeekT: "Has resat {r} i has llegit {w}", cmRosN: "{n} rosaris", cmRos1: "1 rosari", cmEvN: "{n} evangelis", cmEv1: "1 evangeli",
    cmWeek0: "Aquesta setmana encara no hi ha res. Avui és un bon dia per començar.",
    cmYear: "El teu any {y}", cmPal: "Paraula",
    cmPrevM: "Mes anterior", cmNextM: "Mes següent",
    cmRowW: "dies amb la Paraula", cmRowR: "rosaris", cmMys: "els misteris que més has resat",
    cmSets: { joyful: "De goig", sorrowful: "De dolor", glorious: "De glòria", luminous: "De llum" },
    cmSavedW: "Paraula d'avui desada a El teu camí", cmSavedR: "Rosari d'avui desat a El teu camí",
    cmCalFoot: "Cada dia porta el seu color litúrgic. Toca un dia per llegir-ne les lectures.",
    cmStarts: { adv: "comença l'Advent", xmas: "és Nadal", ord: "torna el temps ordinari", lent: "és Dimecres de Cendra i comença la Quaresma", holy: "és Diumenge de Rams", easter: "és Diumenge de Pasqua", pent: "és Pentecosta" },
    cmStartOn: "El {d} {x}.",
    cmWd: ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"],
    cmCalOpen: "Obrir el calendari litúrgic",
    cmLegC: { g: "Temps ordinari", w: "Nadal, Pasqua i festes del Senyor, de la Mare de Déu i dels sants", r: "Màrtirs, apòstols i Esperit Sant", v: "Advent, Quaresma i difunts" },
  });

  const COL = { w: "#2fb565", r: "#3d82ec" };

  // ---------- Datos guardados ----------
  const KEY = "misas-camino";
  let S = { w: {}, r: {} };
  safe("leer", () => { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && typeof v === "object") S = { w: v.w || {}, r: v.r || {} }; });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin almacenamiento */ } };

  function mark(kind, val) {
    const k = todayKey();
    if (S[kind][k]) return;
    S[kind][k] = val;
    save();
    A.toast(t(kind === "w" ? "cmSavedW" : "cmSavedR"));
    refresh();
  }

  // ---------- Dibujos ----------
  const roadIcon = () => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.6 4.5 4.5 19.5M14.4 4.5l5.1 15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M12 6.5v2.2M12 11.4v2.6M12 16.9v2.6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`;
  const book = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4.2C6.6 3 4.6 2.8 2.5 3.2v8.6c2.1-.4 4.1-.2 5.5 1 1.4-1.2 3.4-1.4 5.5-1V3.2C11.4 2.8 9.4 3 8 4.2Zm0 0v8.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  const crossI = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v11M4.5 6h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  const xI = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;

  // ---------- Botón de arriba, junto a los interrogantes ----------
  let topBtn = null;
  function top() {
    if (!topBtn) {
      const faq = document.querySelector(".top .x-faq");
      if (!faq) return;
      topBtn = document.createElement("button");
      topBtn.type = "button"; topBtn.className = "cm-top x-path";
      topBtn.onclick = () => openPanel(topBtn);
      faq.insertAdjacentElement("beforebegin", topBtn);
    }
    // Solo el dibujo del camino, sin números (Guillem no quiere rachas a la vista)
    topBtn.setAttribute("aria-label", t("cmBtn")); topBtn.title = t("cmBtn");
    topBtn.innerHTML = roadIcon();
  }

  // ---------- Panel «Tu camino» ----------
  let panelEl = null, panelFrom = null, monSel = null;
  function week() {
    const T = msOf(todayKey()), mon = monday(T), sun = mon + 6 * DAY, W = t("cmWd");
    let nw = 0, nr = 0, bars = "";
    for (let i = 0; i < 7; i++) {
      const d = mon + i * DAY, k = keyOf(d), w = !!S.w[k], r = !!S.r[k];
      nw += w; nr += r;
      bars += `<span class="${d > T ? "fut" : ""}"><i class="${w ? "w" : ""}">${w ? book : ""}</i><i class="${r ? "r" : ""}">${r ? crossI : ""}</i>${esc(W[i])}</span>`;
    }
    const sameM = new Date(mon).getUTCMonth() === new Date(sun).getUTCMonth();
    const a = sameM ? fmt(mon, { day: "numeric" }) : fmt(mon, { day: "numeric", month: "long" }), b = fmt(sun, { day: "numeric", month: "long" });
    const title = nw || nr ? t("cmWeekT", { r: nr === 1 ? t("cmRos1") : t("cmRosN", { n: nr }), w: nw === 1 ? t("cmEv1") : t("cmEvN", { n: nw }) }) : t("cmWeek0");
    return `<p class="cm-sec">${esc(t("cmWeek", { a, b }))}</p><div class="cm-card"><h3>${esc(title)}</h3><div class="cm-bars">${bars}</div>` +
      `<div class="cm-legend"><span><i style="--c:${COL.w}"></i>${esc(t("cmPal"))}</span><span><i style="--c:${COL.r}"></i>${esc(t("cmRos"))}</span></div></div>`;
  }

  // ---------- El mes, día a día, y el total del año ----------
  const monthName = (y, m) => capF(fmt(Date.UTC(y, m, 1), { month: "long" }));
  function monthHTML() {
    const T = msOf(todayKey()), ty = +todayKey().slice(0, 4), tm = +todayKey().slice(5, 7) - 1;
    if (!monSel) monSel = { y: ty, m: tm };
    const { y, m } = monSel, first = Date.UTC(y, m, 1), n = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const isNow = y === ty && m === tm;
    const firstKey = Object.keys(S.w).concat(Object.keys(S.r)).sort()[0];
    const canPrev = firstKey && firstKey.slice(0, 7) < keyOf(first).slice(0, 7);
    let cells = t("cmWd").map((d) => `<span class="h" aria-hidden="true">${esc(d)}</span>`).join("") + `<span></span>`.repeat((new Date(first).getUTCDay() + 6) % 7);
    let nw = 0, nr = 0;
    for (let d = 1; d <= n; d++) {
      const ms = Date.UTC(y, m, d), k = keyOf(ms), w = !!S.w[k], r = !!S.r[k];
      nw += w; nr += r;
      const what = [w ? t("cmPal") : "", r ? t("cmRos") : ""].filter(Boolean).join(", ");
      cells += `<span class="d${ms === T ? " today" : ""}${ms > T ? " fut" : ""}"${what ? ` aria-label="${esc(fmt(ms, { day: "numeric", month: "long" }) + ": " + what)}"` : ""}>${d}<span class="mk">${w ? `<i style="--c:${COL.w}"></i>` : ""}${r ? `<i style="--c:${COL.r}"></i>` : ""}</span></span>`;
    }
    return `<p class="cm-sec">${esc(t("cmMonthSec"))}</p>
      <div class="cm-card cm-mon"><div class="mh"><h3>${esc(monthName(y, m))} ${y}</h3>
        <div class="arr"><button type="button" data-mm="-1" aria-label="${esc(t("cmPrevM"))}"${canPrev ? "" : " disabled"}>‹</button><button type="button" data-mm="1" aria-label="${esc(t("cmNextM"))}"${isNow ? " disabled" : ""}>›</button></div></div>
        <div class="cm-mcal">${cells}</div>
        <div class="cm-legend"><span><i style="--c:${COL.w}"></i>${esc(t("cmPal"))} · ${nw}</span><span><i style="--c:${COL.r}"></i>${esc(t("cmRos"))} · ${nr}</span></div></div>`;
  }
  function yearHTML() {
    const y = +todayKey().slice(0, 4);
    let w = 0, r = 0; const sets = {};
    for (const k of Object.keys(S.w)) if (+k.slice(0, 4) === y) w++;
    for (const [k, v] of Object.entries(S.r)) if (+k.slice(0, 4) === y) { r++; if (typeof v === "string") sets[v] = (sets[v] || 0) + 1; }
    const topSet = Object.entries(sets).sort((a, b) => b[1] - a[1])[0];
    return `<p class="cm-sec">${esc(t("cmYear", { y }))}</p>
      <div class="cm-card"><div class="cm-stats"><div><b>${w}</b>${esc(t("cmRowW"))}</div><div><b>${r}</b>${esc(t("cmRowR"))}</div>` +
        (topSet ? `<div><b>${esc(t("cmSets")[topSet[0]] || "")}</b>${esc(t("cmMys"))}</div>` : "") + `</div></div>`;
  }
  function panelHTML() {
    // En ordenador, con el mismo formato que las demás secciones (ventana, título grande y columna de 720 px)
    const head = wide()
      ? `<header class="dev-head cm-dhead"><h1>${t("cmTitle")}</h1><button type="button" class="cm-x" aria-label="${esc(t("cmClose"))}">${xI}</button></header>`
      : `<header class="cm-head"><div><h1>${t("cmTitle")}</h1></div><button type="button" class="cm-x" aria-label="${esc(t("cmClose"))}">${xI}</button></header>`;
    return `<div class="${wide() ? "dev-inner" : "cm-wrap"}">${head}
      <div class="cm-body">
        <p class="cm-hint">${esc(t("cmHow"))}</p>
        ${week()}
        ${monthHTML()}
        ${yearHTML()}
      </div></div>`;
  }
  function renderPanel() {
    if (!panelEl) return;
    const sc = scroller(), y = sc.scrollTop;
    fill();
    scroller().scrollTop = y;
  }
  const wideMQ = matchMedia("(min-width: 861px)"), wide = () => wideMQ.matches;
  const scroller = () => (panelEl && panelEl.querySelector(".dev-scroll")) || panelEl;
  function fill() {
    panelEl.classList.toggle("cm-win", wide()); panelEl.classList.toggle("win", wide());
    panelEl.innerHTML = wide() ? `<div class="dev-scroll">${panelHTML()}</div>` : panelHTML();
  }
  // En ordenador la ventana ocupa el mismo sitio que la de la sección abierta, y la barra de arriba sigue a la vista
  function place() {
    if (!panelEl) return;
    const st = panelEl.style;
    if (!wide()) { st.left = st.top = st.width = st.height = ""; return; }
    const wins = [...document.querySelectorAll("#stage > .win, #stage > * > .win")].filter((e) => e.offsetParent && e !== panelEl);
    const rs = wins.length ? wins.map((e) => e.getBoundingClientRect()) : [$("stage").getBoundingClientRect()];
    const l = Math.min(...rs.map((r) => r.left)), tp = Math.min(...rs.map((r) => r.top)), r = Math.max(...rs.map((r) => r.right)), b = Math.max(...rs.map((r) => r.bottom));
    Object.assign(st, { left: l + "px", top: tp + "px", width: r - l + "px", height: b - tp + "px" });
  }
  let wasWide = wide();
  addEventListener("resize", () => { if (!panelEl) return; if (wide() !== wasWide) { wasWide = wide(); renderPanel(); } place(); });
  // Si se cambia de sección con la barra de arriba, «Tu camino» se cierra
  document.addEventListener("misas:mode", () => { if (!panelEl && !calEl) return; closePanel(); closeCal(); steps.length = 0; });
  // Al abrir se añade un paso al historial: el botón «atrás» del móvil cierra el panel en vez de salir de la web.
  function openPanel(from) {
    if (panelEl) return;
    panelFrom = from || null; monSel = null;
    panelEl = document.createElement("div");
    panelEl.className = "cm-panel x-path" + (wide() ? " cm-win win" : "");
    panelEl.setAttribute("role", "dialog"); panelEl.setAttribute("aria-modal", "true"); panelEl.setAttribute("aria-label", t("cmBtn"));
    fill();
    panelEl.addEventListener("click", onPanelClick);
    document.body.appendChild(panelEl);
    place();
    if (topBtn) topBtn.classList.add("on");
    pushStep("panel");
    panelEl.tabIndex = -1; panelEl.focus({ preventScroll: true });
  }
  function closePanel() {
    if (!panelEl) return;
    panelEl.remove(); panelEl = null;
    if (topBtn) topBtn.classList.remove("on");
    if (panelFrom && panelFrom.isConnected) panelFrom.focus({ preventScroll: true });
  }
  function onPanelClick(e) {
    if (e.target.closest(".cm-x")) { back(); return; }
    const mm = e.target.closest("[data-mm]");
    if (mm && !mm.disabled) {
      let { y, m } = monSel; m += +mm.dataset.mm;
      if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
      monSel = { y, m }; renderPanel();
      const b = panelEl.querySelector(`[data-mm="${mm.dataset.mm}"]`); if (b && !b.disabled) b.focus({ preventScroll: true });
    }
  }
  // ---------- Historial: atrás cierra lo último que se abrió ----------
  const steps = [];
  function pushStep(name) { steps.push(name); try { history.pushState({ camino: name }, ""); } catch (e) { /* sin historial */ } }
  function closeTop() {
    const s = steps.pop();
    if (s === "panel") closePanel(); else if (s === "cal") closeCal();
  }
  function back() { if (!steps.length) return; if (history.state && history.state.camino) history.back(); else closeTop(); }
  addEventListener("popstate", () => { if (steps.length) closeTop(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && steps.length) { e.preventDefault(); back(); } });

  // ---------- Calendario litúrgico (se abre al tocar el año litúrgico de la Palabra) ----------
  let calEl = null, calDim = null, calMonth = null, calFrom = null;
  const LC = { g: "#2fb565", w: "w", r: "#d63b3b", v: "#7a4bb0" };
  function calHTML() {
    const { y, m } = calMonth, first = Date.UTC(y, m, 1), nDays = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const T = msOf(todayKey()), W = t("cmWd"), lit = A.lit;
    let cells = W.map((d) => `<span class="h" aria-hidden="true">${esc(d)}</span>`).join("") + `<span></span>`.repeat((new Date(first).getUTCDay() + 6) % 7);
    for (let d = 1; d <= nDays; d++) {
      const ms = Date.UTC(y, m, d), k = keyOf(ms), lc = lit ? lit.color(ms) : "g", c = LC[lc] || LC.g;
      const cls = ["d", new Date(ms).getUTCDay() === 0 ? "sun" : "", ms < T ? "past" : "", ms === T ? "today" : "", S.w[k] ? "read" : ""].filter(Boolean).join(" ");
      const lab = capF(fmt(ms, { weekday: "long", day: "numeric", month: "long" })) + " · " + (t("xLitCol") || {})[lc];
      cells += `<button type="button" class="${cls}" data-day="${k}" aria-label="${esc(lab)}">${d}<i class="${c === "w" ? "w" : ""}" style="--c:${c}"></i></button>`;
    }
    // Si en este mes empieza un tiempo litúrgico, se avisa
    let start = "";
    if (lit) {
      const segs = [1, 15, nDays].flatMap((d) => lit.year(Date.UTC(y, m, d)).segs);
      const hit = segs.filter((s) => s.from >= first && s.from <= Date.UTC(y, m, nDays) && s.from >= T).sort((a, b) => a.from - b.from)[0];
      if (hit && t("cmStarts")[hit.k]) start = " <b>" + esc(t("cmStartOn", { d: fmt(hit.from, { weekday: "long", day: "numeric" }), x: t("cmStarts")[hit.k] })) + "</b>";
    }
    const col = t("xLitCol") || {};
    const head = monthName(y, m) + (y !== +todayKey().slice(0, 4) ? " " + y : "");
    return `<div class="hd"><div><p>${esc(t("xLitK"))}</p><h2>${esc(head)}</h2></div><div class="nav"><button type="button" data-cm="-1" aria-label="${esc(t("cmPrevM"))}">‹</button><button type="button" data-cm="1" aria-label="${esc(t("cmNextM"))}">›</button></div></div>
      <div class="cm-cal">${cells}</div>
      <ul class="cm-leg2">${["g", "w", "r", "v"].map((k) => `<li><i class="${k === "w" ? "w" : ""}" style="--c:${LC[k]}" title="${esc(capF(col[k] || ""))}"></i>${esc(t("cmLegC")[k])}</li>`).join("")}</ul>
      <div class="foot">${esc(t("cmCalFoot"))}${start}</div>`;
  }
  function openCal(from) {
    if (calEl) return;
    calFrom = from || null;
    const T = todayKey();
    calMonth = { y: +T.slice(0, 4), m: +T.slice(5, 7) - 1 };
    calDim = document.createElement("div"); calDim.className = "cm-dim"; calDim.onclick = () => back();
    calEl = document.createElement("div"); calEl.className = "cm-sheet";
    calEl.setAttribute("role", "dialog"); calEl.setAttribute("aria-modal", "true"); calEl.setAttribute("aria-label", t("xLitK"));
    calEl.innerHTML = calHTML();
    calEl.addEventListener("click", (e) => {
      const nb = e.target.closest("[data-cm]");
      if (nb) {
        let { y, m } = calMonth; m += +nb.dataset.cm;
        if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
        calMonth = { y, m }; calEl.innerHTML = calHTML();
        const f = calEl.querySelector(`[data-cm="${nb.dataset.cm}"]`); if (f) f.focus({ preventScroll: true });
        return;
      }
      const db = e.target.closest("[data-day]");
      if (db) { const key = db.dataset.day; back(); document.dispatchEvent(new CustomEvent("misas:goword", { detail: { key } })); }
    });
    document.body.append(calDim, calEl);
    pushStep("cal");
    calEl.tabIndex = -1; calEl.focus({ preventScroll: true });
  }
  function closeCal() {
    if (!calEl) return;
    calEl.remove(); calDim.remove(); calEl = calDim = null;
    if (calFrom && calFrom.isConnected) calFrom.focus({ preventScroll: true });
  }
  safe("calendario", () => {
    const y = document.querySelector(".x-year");
    if (!y) return;
    y.setAttribute("role", "button"); y.tabIndex = 0;
    const lab = () => y.setAttribute("aria-label", t("cmCalOpen"));
    lab(); A.onLang(lab);
    y.addEventListener("click", () => openCal(y));
    y.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCal(y); } });
  });

  // ---------- Contar los días ----------
  // Palabra: el evangelio de hoy a la vista durante 5 segundos.
  safe("palabra", () => {
    const reading = $("reading");
    if (!reading || !window.IntersectionObserver) return;
    let shown = null, timer = 0, watched = null;
    document.addEventListener("misas:wordday", (e) => { shown = e.detail && e.detail.date ? keyOf(e.detail.date.getTime()) : null; });
    const io = new IntersectionObserver((es) => {
      for (const en of es) {
        clearTimeout(timer);
        if (en.isIntersecting && shown === todayKey() && $("stage").dataset.mode === "word") timer = setTimeout(() => { if (shown === todayKey()) mark("w", 1); }, 5000);
      }
    }, { rootMargin: "0px 0px -30% 0px" });
    new MutationObserver(() => {
      const blocks = reading.querySelectorAll(".rd-block"), last = blocks[blocks.length - 1] || null;
      if (last === watched) return;
      if (watched) io.unobserve(watched);
      clearTimeout(timer);
      watched = last;
      if (last) io.observe(last);
    }).observe(reading, { childList: true });
  });
  // Rosario: al llegar al final, al abrir los cinco misterios del resumen o al encender la vela.
  safe("rosario", () => {
    const box = $("rosText");
    if (!box) return;
    const setNow = () => { const b = document.querySelector("#rosSets button.on"); return b ? b.dataset.set : 1; };
    const io = window.IntersectionObserver ? new IntersectionObserver((es) => {
      if (es.some((en) => en.isIntersecting) && $("stage").dataset.mode === "rosary") mark("r", setNow());
    }) : null;
    let watched = null;
    new MutationObserver(() => {
      const end = box.querySelector(".ros-done");
      if (end === watched || !io) return;
      if (watched) io.unobserve(watched);
      watched = end;
      if (end) io.observe(end);
    }).observe(box, { childList: true });
    box.addEventListener("toggle", (e) => {
      const d = e.target;
      if (!d.classList || !d.classList.contains("mys-tab") || !d.open) return;
      d.dataset.seen = "1";
      const tabs = box.querySelectorAll(".mys-tab");
      if (tabs.length === 5 && [...tabs].every((x) => x.dataset.seen)) mark("r", setNow());
    }, true);
    box.addEventListener("click", (e) => { if (e.target.closest(".x-light")) mark("r", setNow()); });
  });

  // ---------- Pintar ----------
  function refresh() {
    safe("pintar", () => {
      top();
      renderPanel();
    });
  }
  A.onLang(() => { refresh(); if (calEl) calEl.innerHTML = calHTML(); });
  // Al volver a la web otro día, se vuelve a pintar
  let lastDay = todayKey();
  document.addEventListener("visibilitychange", () => { if (!document.hidden && todayKey() !== lastDay) { lastDay = todayKey(); refresh(); } });
  refresh();
  window.MisasCamino = { open: () => openPanel(), calendar: () => openCal() };
})();
