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
  // Texto de las oraciones (data/oraciones.js, generado por scripts/oraciones.py).
  const TXT = (key) => { const o = window.MisasOraciones, v = o && o[pl()] && o[pl()][key]; return v && v.length ? v : null; };
  const PRAYER_LANGS = { es: "Castellano", ca: "Català", la: "Latine" };

  const todayCode = () => A.nowBcn().day;
  const ros = { set: BY_DAY[todayCode()], pl: null };
  const pl = () => ros.pl || A.lang();
  const store = (k, v) => { try { v === undefined ? (v = localStorage.getItem(k)) : localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } return v; };

  function renderRosary() {
    const L = PL[pl()], list = SETS[ros.set], D = t("days");
    $("rosDay").textContent = t("rosDay", { day: D[todayCode()] });
    $("rosTitle").innerHTML = esc(L.set[ros.set]).replace(/^(\S+)\s(.+)$/, "$1 <em>$2</em>");
    $("rosSets").innerHTML = Object.keys(SETS).map((k) => `<button type="button" data-set="${k}" class="${k === ros.set ? "on" : ""}">${esc(PL[pl()].set[k].replace(/^\S+\s/, ""))}${k === BY_DAY[todayCode()] ? ` <small>· ${t("todayMark")}</small>` : ""}</button>`).join("");
    $("plangs").innerHTML = ["es", "ca", "la"].map((l) => `<button type="button" data-pl="${l}" class="${l === pl() ? "on" : ""}" aria-pressed="${l === pl()}" title="${PRAYER_LANGS[l]}">${FLAGS[l]}<span>${l.toUpperCase()}</span></button>`).join("");
    $("rosText").innerHTML = rosaryText(L);
  }

  // ---------- El rosario entero en un solo texto vertical ----------
  // Credo, Salve y señal de la cruz se ven siempre; Padrenuestro, primer Avemaría, Gloria y
  // Oh Jesús mío son desplegables, porque mucha gente ya se los sabe.
  function rosaryText(L) {
    const paras = (k) => TXT(k).map((p) => `<p>${esc(p)}</p>`).join("");
    const shown = (k) => TXT(k) ? `<div class="pr"><h3>${esc(L[k])}</h3><div class="pr-text">${paras(k)}</div></div>` : `<p class="pr pr-plain">${esc(L[k])}</p>`;
    const fold = (k) => TXT(k) ? `<details class="pr fold"><summary>${esc(L[k])}</summary><div class="pr-text">${paras(k)}</div></details>` : `<p class="pr pr-plain">${esc(L[k])}</p>`;
    const aves = (n) => `${fold("ave")}<div class="pr pr-rest"><span>${esc(L.ave)} × ${n - 1}</span><span class="beads" aria-hidden="true">${"<i></i>".repeat(n - 1)}</span></div>`;
    const decade = () => fold("pater") + aves(10) + fold("gloria") + fold("fatima");
    let h = `<section class="ros-part"><h2 class="ros-sec">${esc(L.intro)}</h2>${shown("cross")}${shown("credo")}${fold("pater")}${aves(3)}${fold("gloria")}</section>`;
    SETS[ros.set].forEach((m, k) => {
      h += `<section class="ros-part ros-mys"><p class="ros-ord"><span class="num">${k + 1}</span>${esc(L.ord[k])} ${esc(L.mys)}</p>
        <h2>${esc(m[pl()][0])}</h2><p class="mline">${esc(m[pl()][1])} · <span class="nw">${esc(m.ref)}</span></p>${decade()}</section>`;
    });
    h += `<section class="ros-part"><h2 class="ros-sec">${esc(L.end)}</h2>${shown("salve")}${shown("cross")}<p class="ros-done">${esc(L.done)}</p></section>`;
    return h;
  }

  // ---------- Palabra del día: lecturas de la misa ----------
  // Castellano: Vatican News; català: evangeli.net. La acción «contenido» (scripts/palabra.py)
  // las descarga cada día en data/palabra/AAAA-MM-DD.json, porque esas webs no dejan leerlas desde otra página.
  const SRC_URL = { es: (k) => `https://www.vaticannews.va/es/evangelio-de-hoy/${k.replace(/-/g, "/")}.html`, ca: (k) => `https://evangeli.net/evangeli/dia/${k}` };
  const word = { date: null, cache: {} };
  const ymd = (d) => d.toISOString().slice(0, 10);
  function todayBcnDate() {
    const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    return new Date(p + "T12:00:00Z");
  }
  function loadDay(key) {
    if (!word.cache[key]) {
      word.cache[key] = fetch(`data/palabra/${key}.json`, { cache: "no-cache" })
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .catch((e) => { delete word.cache[key]; throw e; });
    }
    return word.cache[key];
  }
  async function renderWord() {
    if (!word.date) word.date = todayBcnDate();
    const key = ymd(word.date), L = A.lang();
    $("wordDate").textContent = new Intl.DateTimeFormat(L === "ca" ? "ca-ES" : "es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(word.date);
    $("wordToday").classList.toggle("on", key === ymd(todayBcnDate()));
    $("wordPrev").setAttribute("aria-label", t("prevDay")); $("wordNext").setAttribute("aria-label", t("nextDay"));
    $("wordLit").textContent = "";
    $("wordFoot").innerHTML = "";
    $("reading").innerHTML = `<div class="skel"></div><div class="skel short"></div><div class="skel"></div>`;
    let day = null;
    try { day = (await loadDay(key))[L]; } catch (e) { /* sin archivo para ese día */ }
    if (key !== ymd(word.date) || L !== A.lang()) return; // el usuario ya ha cambiado de día o de idioma
    if (!day || !day.readings || !day.readings.length) {
      $("reading").innerHTML = `<p class="empty">${t("wordError", { url: SRC_URL[L](key) })}</p>`;
      return;
    }
    $("wordLit").textContent = day.title || "";
    showDay(day);
  }
  // Todas las lecturas del día, una debajo de otra; la fuente, al final.
  function showDay(day) {
    const el = $("reading");
    el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap");
    // Sin salmo: solo lecturas y evangelio.
    el.innerHTML = day.readings.filter((r) => !/^salm/i.test(r.kind)).map((r) => {
      const head = r.title
        ? `<p class="rd-kind">${esc(r.kind)}</p><h2>${esc(r.title)}</h2>`
        : `<h2>${esc(r.kind)}</h2>`;
      return `<section class="rd-block">${head}${r.ref ? `<p class="rd-ref">${esc(r.ref)}</p>` : ""}` +
        r.text.map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("") + `</section>`;
    }).join("") + (day.reflection ? `<aside class="rd-papa"><h2>${esc(day.reflection.heading)}</h2>` +
      day.reflection.text.map((p) => `<p>${esc(p)}</p>`).join("") +
      (day.reflection.translated ? `<p class="rd-note">${esc(t("papaTranslated", { engine: day.reflection.translated }))}</p>` : "") + `</aside>` : "");
    $("wordFoot").innerHTML = t("wordSource", { name: esc(day.source), url: esc(day.url) }) + (day.copyright ? ` · ${esc(day.copyright)}` : "");
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
  A.onLang(() => { ros.pl = null; if (wordReady) renderWord(); if (rosReady) renderRosary(); });

  $("wordPrev").onclick = () => shiftDay(-1);
  $("wordNext").onclick = () => shiftDay(1);
  $("wordToday").onclick = () => { word.date = todayBcnDate(); renderWord(); };

  $("rosSets").onclick = (e) => { const b = e.target.closest("button"); if (b) { ros.set = b.dataset.set; renderRosary(); } };
  $("plangs").onclick = (e) => { const b = e.target.closest("button"); if (b) { ros.pl = b.dataset.pl === A.lang() ? null : b.dataset.pl; renderRosary(); } };
  // Cuentas del Avemaría: al tocar una se marcan hasta ella (tocar la última marcada la desmarca).
  $("rosText").onclick = (e) => {
    const i = e.target.closest(".beads i"); if (!i) return;
    const all = [...i.parentNode.children], n = all.indexOf(i) + 1, cur = all.filter((x) => x.classList.contains("on")).length;
    all.forEach((x, j) => x.classList.toggle("on", j < (n === cur ? n - 1 : n)));
  };
  onMode();
})();
