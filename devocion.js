/* Palabra del día (lecturas cargadas al momento) y Rosario del día. */
(function () {
  "use strict";
  const A = window.MisasApp;
  if (!A) return;
  const $ = (id) => document.getElementById(id);
  const { t, esc } = A;

  // ---------- Misterios: nombre, cita bíblica y una línea breve para meditar ----------
  const SETS = {
    joyful: [
      { ref: "Lc 1,26-38", es: ["La Anunciación", "María acoge el anuncio del ángel."], ca: ["L'Anunciació", "Maria acull l'anunci de l'àngel."], la: ["Annuntiatio", "Angelus nuntiat Mariae."] },
      { ref: "Lc 1,39-56", es: ["La Visitación", "María visita a su prima Isabel."], ca: ["La Visitació", "Maria visita la seva cosina Elisabet."], la: ["Visitatio", "Maria visitat Elisabeth."] },
      { ref: "Lc 2,1-20", es: ["El Nacimiento de Jesús", "Jesús nace en Belén."], ca: ["El Naixement de Jesús", "Jesús neix a Betlem."], la: ["Nativitas", "Iesus nascitur in Bethlehem."] },
      { ref: "Lc 2,22-38", es: ["La Presentación en el Templo", "Jesús es presentado al Señor."], ca: ["La Presentació al Temple", "Jesús és presentat al Senyor."], la: ["Praesentatio", "Iesus in Templo praesentatur."] },
      { ref: "Lc 2,41-52", es: ["El Niño hallado en el Templo", "Jesús, entre los maestros de la Ley."], ca: ["El Nen retrobat al Temple", "Jesús, enmig dels mestres de la Llei."], la: ["Inventio in Templo", "Iesus in Templo invenitur."] }
    ],
    luminous: [
      { ref: "Mt 3,13-17", es: ["El Bautismo en el Jordán", "El Padre presenta a su Hijo amado."], ca: ["El Baptisme al Jordà", "El Pare presenta el seu Fill estimat."], la: ["Baptisma in Iordane", "Pater Filium dilectum manifestat."] },
      { ref: "Jn 2,1-12", es: ["Las bodas de Caná", "Jesús hace su primer signo."], ca: ["Les noces de Canà", "Jesús fa el seu primer signe."], la: ["Nuptiae Canae", "Primum signum Iesu."] },
      { ref: "Mc 1,14-15", es: ["El anuncio del Reino", "Jesús llama a la conversión."], ca: ["L'anunci del Regne", "Jesús crida a la conversió."], la: ["Proclamatio Regni", "Iesus ad paenitentiam vocat."] },
      { ref: "Lc 9,28-36", es: ["La Transfiguración", "La gloria de Jesús en el monte."], ca: ["La Transfiguració", "La glòria de Jesús a la muntanya."], la: ["Transfiguratio", "Gloria Iesu in monte."] },
      { ref: "Lc 22,14-20", es: ["La institución de la Eucaristía", "Jesús se nos da como alimento."], ca: ["La institució de l'Eucaristia", "Jesús se'ns dona com a aliment."], la: ["Institutio Eucharistiae", "Iesus se nobis dat in cibum."] }
    ],
    sorrowful: [
      { ref: "Mt 26,36-46", es: ["La oración en el huerto", "Jesús ora en Getsemaní."], ca: ["L'oració a l'hort", "Jesús prega a Getsemaní."], la: ["Agonia in Horto", "Iesus orat in Gethsemani."] },
      { ref: "Jn 19,1", es: ["La flagelación", "Jesús es azotado."], ca: ["La flagel·lació", "Jesús és assotat."], la: ["Flagellatio", "Iesus flagellatur."] },
      { ref: "Mt 27,27-31", es: ["La coronación de espinas", "Se burlan de Jesús como rey."], ca: ["La coronació d'espines", "Es burlen de Jesús com a rei."], la: ["Coronatio spinis", "Iesus spinis coronatur."] },
      { ref: "Jn 19,17", es: ["Jesús con la cruz a cuestas", "Camino del Calvario."], ca: ["Jesús amb la creu a coll", "Camí del Calvari."], la: ["Baiulatio Crucis", "Iesus crucem portat."] },
      { ref: "Lc 23,33-46", es: ["La crucifixión y muerte de Jesús", "Jesús entrega su vida."], ca: ["La crucifixió i mort de Jesús", "Jesús lliura la seva vida."], la: ["Crucifixio et Mors", "Iesus moritur in cruce."] }
    ],
    glorious: [
      { ref: "Mt 28,1-10", es: ["La Resurrección", "Cristo vive."], ca: ["La Resurrecció", "Crist viu."], la: ["Resurrectio", "Christus resurrexit."] },
      { ref: "Hch 1,6-11", es: ["La Ascensión", "Jesús sube al cielo."], ca: ["L'Ascensió", "Jesús puja al cel."], la: ["Ascensio", "Iesus ascendit in caelum."] },
      { ref: "Hch 2,1-13", es: ["La venida del Espíritu Santo", "Pentecostés."], ca: ["La vinguda de l'Esperit Sant", "Pentecosta."], la: ["Descensus Spiritus Sancti", "Pentecostes."] },
      { ref: "Lc 1,48", es: ["La Asunción de María", "María, llevada al cielo."], ca: ["L'Assumpció de Maria", "Maria, enduta al cel."], la: ["Assumptio", "Maria in caelum assumitur."] },
      { ref: "Ap 12,1", es: ["La Coronación de María", "Reina del cielo y de la tierra."], ca: ["La Coronació de Maria", "Reina del cel i de la terra."], la: ["Coronatio", "Maria Regina caeli."] }
    ]
  };
  // Lunes y sábado gozosos, martes y viernes dolorosos, miércoles y domingo gloriosos, jueves luminosos.
  const BY_DAY = { mon: "joyful", tue: "sorrowful", wed: "glorious", thu: "luminous", fri: "sorrowful", sat: "joyful", sun: "glorious" };

  // Nombres de las oraciones en cada idioma de rezo.
  const PL = {
    es: { set: { joyful: "Misterios gozosos", sorrowful: "Misterios dolorosos", glorious: "Misterios gloriosos", luminous: "Misterios luminosos" },
      ord: ["Primer", "Segundo", "Tercer", "Cuarto", "Quinto"], mys: "misterio", of: "de", intro: "Inicio", end: "Final",
      cross: "Señal de la cruz", credo: "Credo", pater: "Padrenuestro", ave: "Avemaría", gloria: "Gloria", fatima: "Oh Jesús mío", salve: "Salve",
      hint: "Reza en silencio o en voz alta. Toca para seguir.", done: "Has terminado el rosario. Que el Señor te bendiga." },
    ca: { set: { joyful: "Misteris de goig", sorrowful: "Misteris de dolor", glorious: "Misteris de glòria", luminous: "Misteris de llum" },
      ord: ["Primer", "Segon", "Tercer", "Quart", "Cinquè"], mys: "misteri", of: "de", intro: "Inici", end: "Final",
      cross: "Senyal de la creu", credo: "Credo", pater: "Parenostre", ave: "Avemaria", gloria: "Glòria", fatima: "Oh Jesús meu", salve: "Salve",
      hint: "Resa en silenci o en veu alta. Toca per seguir.", done: "Has acabat el rosari. Que el Senyor et beneeixi." },
    la: { set: { joyful: "Mysteria gaudiosa", sorrowful: "Mysteria dolorosa", glorious: "Mysteria gloriosa", luminous: "Mysteria luminosa" },
      ord: ["Primum", "Secundum", "Tertium", "Quartum", "Quintum"], mys: "mysterium", of: "ex", intro: "Initium", end: "Finis",
      cross: "Signum crucis", credo: "Credo", pater: "Pater noster", ave: "Ave Maria", gloria: "Gloria Patri", fatima: "Oratio Fatimae", salve: "Salve Regina",
      hint: "Ora in silentio vel voce. Tange ut pergas.", done: "Rosarium absolvisti. Benedicat te Dominus." }
  };
  const FLAGS = {
    es: `<svg viewBox="0 0 24 24" aria-hidden="true"><clipPath id="pfe"><circle cx="12" cy="12" r="12"/></clipPath><g clip-path="url(#pfe)"><rect width="24" height="24" fill="#c60b1e"/><rect y="6" width="24" height="12" fill="#ffc400"/></g></svg>`,
    ca: `<svg viewBox="0 0 24 24" aria-hidden="true"><clipPath id="pfc"><circle cx="12" cy="12" r="12"/></clipPath><g clip-path="url(#pfc)"><rect width="24" height="24" fill="#fcdd09"/><g fill="#da121a"><rect y="2.67" width="24" height="2.67"/><rect y="8" width="24" height="2.67"/><rect y="13.33" width="24" height="2.67"/><rect y="18.67" width="24" height="2.67"/></g></g></svg>`,
    la: `<svg viewBox="0 0 24 24" aria-hidden="true"><clipPath id="pfv"><circle cx="12" cy="12" r="12"/></clipPath><g clip-path="url(#pfv)"><rect width="12" height="24" fill="#ffe000"/><rect x="12" width="12" height="24" fill="#fff"/><g stroke-width="1.6" stroke-linecap="round"><path d="M14.5 9.5l5 5" stroke="#c9a227"/><path d="M19.5 9.5l-5 5" stroke="#9aa0a6"/></g><path d="M15.5 8.2h3l-.5-1.6h-2z" fill="#c9a227"/></g></svg>`
  };
  const PRAYER_LANGS = { es: "Castellano", ca: "Català", la: "Latine" };

  const todayCode = () => A.nowBcn().day;
  const ros = { set: BY_DAY[todayCode()], pl: null, steps: [], i: 0 };
  const pl = () => ros.pl || A.lang();
  const store = (k, v) => { try { v === undefined ? (v = localStorage.getItem(k)) : localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } return v; };

  function renderRosary() {
    const L = PL[pl()], list = SETS[ros.set], D = t("days");
    $("rosDay").textContent = t("rosDay", { day: D[todayCode()] });
    $("rosTitle").innerHTML = esc(L.set[ros.set]).replace(/^(\S+)\s(.+)$/, "$1 <em>$2</em>");
    $("rosSets").innerHTML = Object.keys(SETS).map((k) => `<button type="button" data-set="${k}" class="${k === ros.set ? "on" : ""}">${esc(PL[pl()].set[k].replace(/^\S+\s/, ""))}${k === BY_DAY[todayCode()] ? ` <small>· ${t("todayMark")}</small>` : ""}</button>`).join("");
    $("plangs").innerHTML = ["es", "ca", "la"].map((l) => `<button type="button" data-pl="${l}" class="${l === pl() ? "on" : ""}" aria-pressed="${l === pl()}" title="${PRAYER_LANGS[l]}">${FLAGS[l]}<span>${l.toUpperCase()}</span></button>`).join("");
    $("mysteries").innerHTML = list.map((m, i) => `<li class="mys" style="--i:${i}">
        <span class="num">${i + 1}</span>
        <span class="mname">${esc(m[pl()][0])}</span>
        <span class="mline">${esc(m[pl()][1])}</span>
        <span class="mref">${esc(m.ref)}</span>
      </li>`).join("");
  }

  // ---------- Rezo guiado, paso a paso ----------
  function buildSteps() {
    const s = [];
    const push = (key, extra) => s.push(Object.assign({ key }, extra));
    push("cross", { part: "intro" }); push("credo", { part: "intro" }); push("pater", { part: "intro" });
    for (let b = 1; b <= 3; b++) push("ave", { part: "intro", bead: b, of: 3 });
    push("gloria", { part: "intro" });
    SETS[ros.set].forEach((m, k) => {
      push("mystery", { part: k, m });
      push("pater", { part: k });
      for (let b = 1; b <= 10; b++) push("ave", { part: k, bead: b, of: 10 });
      push("gloria", { part: k }); push("fatima", { part: k });
    });
    push("salve", { part: "end" }); push("cross", { part: "end" }); push("done", { part: "end" });
    return s;
  }
  function renderStep() {
    const L = PL[pl()], st = ros.steps[ros.i], n = ros.steps.length;
    const where = st.part === "intro" ? L.intro : st.part === "end" ? L.end : `${L.ord[st.part]} ${L.mys}`;
    $("prayWhere").textContent = `${L.set[ros.set]} · ${where}`;
    $("prayBar").style.width = `${Math.round((ros.i + 1) / n * 100)}%`;
    const card = $("prayCard");
    card.classList.remove("swap"); void card.offsetWidth; card.classList.add("swap");
    if (st.key === "mystery") {
      $("prayLabel").textContent = `${L.ord[st.part]} ${L.mys}`;
      $("prayText").textContent = st.m[pl()][0];
      $("prayRef").textContent = `${st.m[pl()][1]} · ${st.m.ref}`;
    } else if (st.key === "done") {
      $("prayLabel").textContent = "";
      $("prayText").textContent = L.done;
      $("prayRef").textContent = "";
    } else {
      $("prayLabel").textContent = st.bead ? `${L.ave} · ${st.bead} ${L.of} ${st.of}` : "";
      $("prayText").textContent = L[st.key];
      $("prayRef").textContent = L.hint;
    }
    const beads = $("beads");
    if (st.bead || st.key === "pater" || st.key === "gloria" || st.key === "fatima") {
      const total = st.part === "intro" ? 3 : 10, on = st.bead || (st.key === "pater" ? 0 : total);
      beads.innerHTML = Array.from({ length: total }, (_, b) => `<i class="${b < on ? "on" : ""}${b === on - 1 && st.bead ? " now" : ""}"></i>`).join("");
      beads.style.visibility = "visible";
    } else beads.style.visibility = "hidden";
    $("prayPrev").disabled = ros.i === 0;
    $("prayNext").textContent = ros.i === n - 1 ? t("prayExit").replace(/^←\s*/, "") : t("next");
  }
  function startPray() {
    ros.steps = buildSteps(); ros.i = 0;
    $("rosList").hidden = true; $("prayMode").hidden = false;
    renderStep(); $("rosScroll").scrollTop = 0; $("prayCard").focus({ preventScroll: true });
  }
  function exitPray() { $("prayMode").hidden = true; $("rosList").hidden = false; }
  const step = (d) => {
    if (ros.i + d >= ros.steps.length) return exitPray();
    ros.i = Math.max(0, ros.i + d); renderStep();
  };

  // ---------- Palabra del día: lecturas de la misa, cargadas al momento ----------
  // Fuente: el servicio público de Evangelio del día (evangeliodeldia.org). No guardamos los textos en la web.
  const FEED = "https://feed.evangelizo.org/v2/reader.php";
  const word = { date: null, tab: "GSP", cache: {} };
  const ymd = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  function todayBcnDate() {
    const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    return new Date(p + "T12:00:00Z");
  }
  function toText(html) {
    const doc = new DOMParser().parseFromString(String(html).replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n"), "text/html");
    return (doc.body.textContent || "").split("\n").map((l) => l.trim())
      .filter((l) => !/evangeliodeldia|evangelizo|registrar|suscrib|copyright|©/i.test(l)).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  const get = (params) => fetch(`${FEED}?${new URLSearchParams(Object.assign({ lang: "SP" }, params))}`).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); });
  async function loadDay(key) {
    if (word.cache[key]) return word.cache[key];
    const date = key;
    const parts = ["FR", "PS", "SR", "GSP"];
    const [title, ...rest] = await Promise.all([
      get({ date, type: "liturgic_t" }).catch(() => ""),
      ...parts.map((c) => get({ date, type: "reading_lt", content: c }).catch(() => "")),
      ...parts.map((c) => get({ date, type: "reading", content: c }).catch(() => ""))
    ]);
    const day = { title: toText(title), readings: {} };
    parts.forEach((c, i) => { const text = toText(rest[i + parts.length]); if (text) day.readings[c] = { ref: toText(rest[i]), text }; });
    if (!Object.keys(day.readings).length) throw new Error("sin lecturas");
    word.cache[key] = day;
    return day;
  }
  async function renderWord() {
    if (!word.date) word.date = todayBcnDate();
    const key = ymd(word.date), L = A.lang();
    $("wordDate").textContent = new Intl.DateTimeFormat(L === "ca" ? "ca-ES" : "es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(word.date);
    $("wordToday").classList.toggle("on", key === ymd(todayBcnDate()));
    $("wordPrev").setAttribute("aria-label", t("prevDay")); $("wordNext").setAttribute("aria-label", t("nextDay"));
    $("wordFoot").innerHTML = caToday() ? t("wordCaFoot") : [t("wordCaNote"), t("wordSource")].filter(Boolean).join(" ");
    $("wordLit").textContent = "";
    $("wordTabs").innerHTML = "";
    $("reading").innerHTML = `<div class="skel"></div><div class="skel short"></div><div class="skel"></div>`;
    let day;
    try { day = await loadDay(key); } catch (e) {
      if (caToday()) { day = { title: "", readings: { GSP: { ref: "", text: "" } } }; }
      else {
      if (key === ymd(word.date)) $("reading").innerHTML = `<p class="empty">${t("wordError")}</p>`;
      return;
      }
    }
    if (key !== ymd(word.date)) return; // el usuario ya ha cambiado de día
    $("wordLit").textContent = day.title;
    const avail = Object.keys(day.readings);
    if (!avail.includes(word.tab)) word.tab = avail.includes("GSP") ? "GSP" : avail[0];
    const rd = t("rd");
    $("wordTabs").innerHTML = avail.map((c) => `<button type="button" role="tab" data-rd="${c}" class="${c === word.tab ? "on" : ""}" aria-selected="${c === word.tab}">${esc(rd[c])}</button>`).join("");
    $("wordTabs").style.setProperty("--n", avail.length);
    $("wordTabs").style.setProperty("--idx", avail.indexOf(word.tab));
    showReading(day);
  }
  // En catalán, el Evangelio de hoy se muestra con el widget oficial de evangeli.net.
  const CA_WIDGET = "https://evangeli.net/evangeli/widget/web";
  const caToday = () => A.lang() === "ca" && ymd(word.date) === ymd(todayBcnDate());
  function showReading(day) {
    const r = day.readings[word.tab];
    if (word.tab === "GSP" && caToday()) {
      const el = $("reading");
      el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap");
      el.innerHTML = `<div class="widget"><iframe src="${CA_WIDGET}" title="Evangeli del dia (evangeli.net)" loading="lazy"></iframe></div>`;
      return;
    }
    const paras = r.text.split(/\n{2,}|\n/).filter(Boolean);
    const el = $("reading");
    el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap");
    el.innerHTML = `<h2>${esc(r.ref)}</h2>` + paras.map((p) => `<p>${esc(p)}</p>`).join("");
  }
  const shiftDay = (d) => { word.date = new Date(word.date.getTime() + d * 864e5); renderWord(); $("wordScroll").scrollTop = 0; };

  // ---------- Enlaces con la página ----------
  let wordReady = false, rosReady = false;
  function onMode() {
    const mode = $("stage").dataset.mode;
    if (mode === "word" && !wordReady) { wordReady = true; renderWord(); }
    if (mode === "rosary" && !rosReady) { rosReady = true; renderRosary(); }
  }
  document.addEventListener("misas:mode", onMode);
  A.onLang(() => { ros.pl = null; if (wordReady) renderWord(); if (rosReady) { renderRosary(); if (!$("prayMode").hidden) renderStep(); } });

  $("wordPrev").onclick = () => shiftDay(-1);
  $("wordNext").onclick = () => shiftDay(1);
  $("wordToday").onclick = () => { word.date = todayBcnDate(); renderWord(); };
  $("wordTabs").onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    word.tab = b.dataset.rd;
    $("wordTabs").querySelectorAll("button").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
    $("wordTabs").style.setProperty("--idx", [...$("wordTabs").children].indexOf(b));
    const day = word.cache[ymd(word.date)]; if (day) showReading(day);
  };

  $("rosSets").onclick = (e) => { const b = e.target.closest("button"); if (b) { ros.set = b.dataset.set; renderRosary(); } };
  $("plangs").onclick = (e) => { const b = e.target.closest("button"); if (b) { ros.pl = b.dataset.pl === A.lang() ? null : b.dataset.pl; renderRosary(); } };
  $("prayBtn").onclick = startPray;
  $("prayExit").onclick = exitPray;
  $("prayPrev").onclick = () => step(-1);
  $("prayNext").onclick = () => step(1);
  $("prayCard").onclick = () => step(1);
  document.addEventListener("keydown", (e) => {
    if ($("prayMode").hidden || $("stage").dataset.mode !== "rosary") return;
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "Escape") exitPray();
  });
  onMode();
})();
