/* «Tu camino»: rachas de la Palabra del día y del Rosario, con el escudo de san Miguel (un día de gracia por semana),
   hitos con estampa, resumen de la semana, «Tu año» mes a mes y el calendario litúrgico que se abre al tocar el año litúrgico.
   Todo se guarda solo en este navegador (localStorage «misas-camino»); no hay cuentas ni se envía nada.
   - Cuenta un día de Palabra cuando el evangelio de hoy está a la vista unos segundos.
   - Cuenta un día de Rosario al llegar al final del rosario (o al abrir los cinco misterios en el resumen, o al encender la vela).
   - Racha: días seguidos. Si falta un día suelto, el escudo de san Miguel lo cubre (uno por semana, de lunes a domingo);
     el día cubierto no suma, pero no corta la racha. */
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
    cmStreaks: "Rachas", cmWord: "Palabra del día", cmRos: "Rosario",
    cmBest: "Tu mejor racha: {n}", cmDaysN: "{n} días", cmDay1: "1 día",
    cmInRow: "días seguidos", cmInRow1: "día seguido",
    cmPillN: "{n} días seguidos", cmPill1: "1 día seguido", cmPill0: "Empieza hoy tu racha",
    cmHow: "Cuenta un día de Palabra cuando lees el evangelio de hoy, y uno de Rosario cuando llegas al final del rosario (o abres los cinco misterios en el resumen).",
    cmShieldUsed: "{d} no {what}, pero <b>el escudo de san Miguel</b> protegió tu racha. Tienes uno cada semana; el próximo, a partir del lunes.",
    cmShieldInfo: "Si un día fallas, <b>el escudo de san Miguel</b> protege tu racha. Tienes uno cada semana.",
    cmMissW: "leíste la Palabra", cmMissR: "rezaste el Rosario", cmMissB: "leíste la Palabra ni rezaste el Rosario",
    cmYesterday: "Ayer", cmOn: "El {d}",
    cmMiles: "Hitos y estampas", cmGot: "Conseguido", cmOf: "{a} de {b}",
    cmStampsN: "Tus estampas <b>({a} de {b})</b>. Toca una para verla en grande.",
    cmLeft: "Faltan {n} días", cmLeft1: "Falta 1 día",
    cmWeek: "Tu semana · del {a} al {b}",
    cmWeekT: "Has rezado {r} y has leído {w}", cmRosN: "{n} rosarios", cmRos1: "1 rosario", cmEvN: "{n} evangelios", cmEv1: "1 evangelio",
    cmWeek0: "Esta semana aún no hay nada. Hoy es un buen día para empezar.",
    cmYear: "Tu año {y}", cmMonthly: "Mes a mes", cmMonthlyP: "Toca un mes para verlo.",
    cmLegW: "Días con la Palabra", cmLegR: "Rosarios", cmPal: "Palabra",
    cmTop: "Tu mes más fructífero", cmMonthK: "Mes elegido", cmPrevM: "Mes anterior", cmNextM: "Mes siguiente",
    cmRowW: "días con la Palabra", cmRowR: "rosarios", cmRowP: "días de oración",
    cmYearT: "Un año de oración", cmYearP: "Se completa el 31 de diciembre.",
    cmLong: "días, tu racha más larga", cmMys: "los misterios que más rezaste",
    cmSets: { joyful: "Gozosos", sorrowful: "Dolorosos", glorious: "Gloriosos", luminous: "Luminosos" },
    cmBestY: "Lo mejor de tu año", cmMonths: "Tus meses",
    cmBestAll: "El mes más fructífero", cmTotal: "en total", cmBestW: "El mes con más Palabra", cmDays: "días",
    cmBestR: "El mes con más rosarios", cmRosU: "rosarios", cmBestS: "Tu racha más larga",
    cmAnd: "{a} y {b}", cmFromTo: "De {a} a {b}",
    cmEmptyYear: "Aquí verás tu año mes a mes en cuanto empieces.",
    cmToday: "Hoy · {n}", cmStart: "Empieza hoy",
    cmSavedW: "Palabra de hoy · {n}", cmSavedR: "Rosario de hoy · {n}",
    cmCalFoot: "Cada día lleva su color litúrgico. Toca un día para leer sus lecturas.",
    cmStarts: { adv: "empieza el Adviento", xmas: "es Navidad", ord: "vuelve el tiempo ordinario", lent: "es Miércoles de Ceniza y empieza la Cuaresma", holy: "es Domingo de Ramos", easter: "es Domingo de Pascua", pent: "es Pentecostés" },
    cmStartOn: "El {d} {x}.",
    cmWd: ["L", "M", "X", "J", "V", "S", "D"],
    cmCalOpen: "Abrir el calendario litúrgico",
    cmLegC: { g: "Tiempo ordinario", w: "Navidad, Pascua y fiestas del Señor, de la Virgen y de los santos", r: "Mártires, apóstoles y Espíritu Santo", v: "Adviento, Cuaresma y difuntos" },
  });
  A.i18n("ca", {
    cmBtn: "El teu camí", cmTitle: "El teu <em>camí</em>", cmClose: "Tancar",
    cmStreaks: "Ratxes", cmWord: "Paraula del dia", cmRos: "Rosari",
    cmBest: "La teva millor ratxa: {n}", cmDaysN: "{n} dies", cmDay1: "1 dia",
    cmInRow: "dies seguits", cmInRow1: "dia seguit",
    cmPillN: "{n} dies seguits", cmPill1: "1 dia seguit", cmPill0: "Comença avui la teva ratxa",
    cmHow: "Compta un dia de Paraula quan llegeixes l'evangeli d'avui, i un de Rosari quan arribes al final del rosari (o obres els cinc misteris al resum).",
    cmShieldUsed: "{d} no {what}, però <b>l'escut de sant Miquel</b> va protegir la teva ratxa. En tens un cada setmana; el següent, a partir de dilluns.",
    cmShieldInfo: "Si un dia falles, <b>l'escut de sant Miquel</b> protegeix la teva ratxa. En tens un cada setmana.",
    cmMissW: "vas llegir la Paraula", cmMissR: "vas resar el Rosari", cmMissB: "vas llegir la Paraula ni resar el Rosari",
    cmYesterday: "Ahir", cmOn: "El {d}",
    cmMiles: "Fites i estampes", cmGot: "Aconseguit", cmOf: "{a} de {b}",
    cmStampsN: "Les teves estampes <b>({a} de {b})</b>. Toca'n una per veure-la en gran.",
    cmLeft: "Falten {n} dies", cmLeft1: "Falta 1 dia",
    cmWeek: "La teva setmana · del {a} al {b}",
    cmWeekT: "Has resat {r} i has llegit {w}", cmRosN: "{n} rosaris", cmRos1: "1 rosari", cmEvN: "{n} evangelis", cmEv1: "1 evangeli",
    cmWeek0: "Aquesta setmana encara no hi ha res. Avui és un bon dia per començar.",
    cmYear: "El teu any {y}", cmMonthly: "Mes a mes", cmMonthlyP: "Toca un mes per veure'l.",
    cmLegW: "Dies amb la Paraula", cmLegR: "Rosaris", cmPal: "Paraula",
    cmTop: "El teu mes més fructífer", cmMonthK: "Mes triat", cmPrevM: "Mes anterior", cmNextM: "Mes següent",
    cmRowW: "dies amb la Paraula", cmRowR: "rosaris", cmRowP: "dies de pregària",
    cmYearT: "Un any de pregària", cmYearP: "Es completa el 31 de desembre.",
    cmLong: "dies, la teva ratxa més llarga", cmMys: "els misteris que més has resat",
    cmSets: { joyful: "De goig", sorrowful: "De dolor", glorious: "De glòria", luminous: "De llum" },
    cmBestY: "El millor del teu any", cmMonths: "Els teus mesos",
    cmBestAll: "El mes més fructífer", cmTotal: "en total", cmBestW: "El mes amb més Paraula", cmDays: "dies",
    cmBestR: "El mes amb més rosaris", cmRosU: "rosaris", cmBestS: "La teva ratxa més llarga",
    cmAnd: "{a} i {b}", cmFromTo: "De {a} a {b}",
    cmEmptyYear: "Aquí veuràs el teu any mes a mes tan bon punt comencis.",
    cmToday: "Avui · {n}", cmStart: "Comença avui",
    cmSavedW: "Paraula d'avui · {n}", cmSavedR: "Rosari d'avui · {n}",
    cmCalFoot: "Cada dia porta el seu color litúrgic. Toca un dia per llegir-ne les lectures.",
    cmStarts: { adv: "comença l'Advent", xmas: "és Nadal", ord: "torna el temps ordinari", lent: "és Dimecres de Cendra i comença la Quaresma", holy: "és Diumenge de Rams", easter: "és Diumenge de Pasqua", pent: "és Pentecosta" },
    cmStartOn: "El {d} {x}.",
    cmWd: ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"],
    cmCalOpen: "Obrir el calendari litúrgic",
    cmLegC: { g: "Temps ordinari", w: "Nadal, Pasqua i festes del Senyor, de la Mare de Déu i dels sants", r: "Màrtirs, apòstols i Esperit Sant", v: "Advent, Quaresma i difunts" },
  });
  const daysTxt = (n) => (n === 1 ? t("cmDay1") : t("cmDaysN", { n }));

  // ---------- Estampas: una cita de un santo por hito ----------
  const MILES = [7, 40, 50, 100];
  const STAMPS = {
    w: [
      { es: ["Tarde te amé, hermosura tan antigua y tan nueva.", "San Agustín"], ca: ["Tard us he estimat, bellesa tan antiga i tan nova.", "Sant Agustí"] },
      { es: ["Desconocer las Escrituras es desconocer a Cristo.", "San Jerónimo"], ca: ["Desconèixer les Escriptures és desconèixer Crist.", "Sant Jeroni"] },
      { es: ["Aprende a conocer el corazón de Dios en las palabras de Dios.", "San Gregorio Magno"], ca: ["Aprèn a conèixer el cor de Déu en les paraules de Déu.", "Sant Gregori el Gran"] },
      { es: ["Una palabra habló el Padre, que fue su Hijo, y esta habla siempre en eterno silencio.", "San Juan de la Cruz"], ca: ["Una paraula va dir el Pare, que fou el seu Fill, i la diu sempre en etern silenci.", "Sant Joan de la Creu"] },
    ],
    r: [
      { es: ["El Rosario es mi oración predilecta.", "San Juan Pablo II"], ca: ["El Rosari és la meva pregària predilecta.", "Sant Joan Pau II"] },
      { es: ["¡Amad a la Virgen y hacedla amar! Rezad siempre el Rosario.", "San Pío de Pietrelcina"], ca: ["Estimeu la Mare de Déu i feu-la estimar! Reseu sempre el Rosari.", "Sant Pius de Pietrelcina"] },
      { es: ["El Santo Rosario es arma poderosa. Empléala con confianza.", "San Josemaría Escrivá"], ca: ["El Sant Rosari és arma poderosa. Fes-la servir amb confiança.", "Sant Josepmaria Escrivà"] },
      { es: ["El Rosario, compendio de todo el Evangelio.", "San Pablo VI"], ca: ["El Rosari, compendi de tot l'Evangeli.", "Sant Pau VI"] },
    ],
  };
  const COL = { w: "#2fb565", r: "#3d82ec" };

  // ---------- Datos guardados ----------
  const KEY = "misas-camino";
  let S = { w: {}, r: {} };
  safe("leer", () => { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && typeof v === "object") S = { w: v.w || {}, r: v.r || {} }; });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin almacenamiento */ } };

  // Recorre los días desde el primero guardado hasta hoy. Un día que falta lo cubre el escudo si el anterior está hecho,
  // el siguiente también (o es hoy) y no se ha usado otro escudo esa semana.
  function analyze(kind) {
    const map = S[kind], keys = Object.keys(map).sort(), T = msOf(todayKey());
    const out = { cur: 0, best: 0, bestFrom: null, bestTo: null, shield: {}, todayDone: !!map[keyOf(T)] };
    if (!keys.length) return out;
    const has = (ms) => !!map[keyOf(ms)], used = {};
    let run = 0, from = null;
    for (let d = Math.min(msOf(keys[0]), T); d <= T; d += DAY) {
      if (has(d)) {
        if (!run) from = d;
        run++;
        if (run > out.best) { out.best = run; out.bestFrom = from; out.bestTo = d; }
        continue;
      }
      if (d === T) break; // hoy todavía se puede
      const wk = monday(d), next = d + DAY;
      if (run && has(d - DAY) && !used[wk] && (next === T || has(next))) { used[wk] = 1; out.shield[keyOf(d)] = 1; continue; }
      run = 0;
    }
    out.cur = run;
    return out;
  }

  function mark(kind, val) {
    const k = todayKey();
    if (S[kind][k]) return;
    S[kind][k] = val;
    save();
    const a = analyze(kind);
    A.toast(t(kind === "w" ? "cmSavedW" : "cmSavedR", { n: a.cur === 1 ? t("cmPill1") : t("cmPillN", { n: a.cur }) }));
    refresh();
  }

  // ---------- Dibujos ----------
  const roadIcon = () => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.6 4.5 4.5 19.5M14.4 4.5l5.1 15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M12 6.5v2.2M12 11.4v2.6M12 16.9v2.6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`;
  const check = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  // Escudo de san Miguel con la cruz que a la vez es espada (centrado al píxel en su círculo)
  const shield = `<svg viewBox="0 -0.2 20 20" aria-hidden="true"><path d="M10 1.8l6.4 2.3v4.8c0 4.2-2.9 7.1-6.4 8.9-3.5-1.8-6.4-4.7-6.4-8.9V4.1L10 1.8Z" fill="var(--sh-bg, var(--bg))" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="10" cy="4.6" r=".85" fill="currentColor"/><path d="M10 5.4v1.9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M6.7 7.6h6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9.25 8.3h1.5v5.3L10 15.3l-.75-1.7Z" fill="currentColor"/></svg>`;
  const bookI = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.6C10.2 5.2 7.6 4.6 4.5 4.6v12.8c3.1 0 5.7.6 7.5 2 1.8-1.4 4.4-2 7.5-2V4.6c-3.1 0-5.7.6-7.5 2zM12 6.6v12.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`;
  const rosI = `<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><circle cx="12" cy="3.4" r="1.3"/><circle cx="16.3" cy="5" r="1.3"/><circle cx="18" cy="9.2" r="1.3"/><circle cx="16.3" cy="13.4" r="1.3"/><circle cx="7.7" cy="5" r="1.3"/><circle cx="6" cy="9.2" r="1.3"/><circle cx="7.7" cy="13.4" r="1.3"/><circle cx="12" cy="15.2" r="1.6"/></g><path d="M12 17v5M10 19h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  const book = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4.2C6.6 3 4.6 2.8 2.5 3.2v8.6c2.1-.4 4.1-.2 5.5 1 1.4-1.2 3.4-1.4 5.5-1V3.2C11.4 2.8 9.4 3 8 4.2Zm0 0v8.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  const crossI = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v11M4.5 6h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  const xI = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  const orn = `<svg viewBox="0 0 44 22" aria-hidden="true"><path d="M2 11h12M30 11h12" stroke="#c9a227" stroke-width="1" stroke-linecap="round"/><path d="M22 3v16M17 8h10" stroke="#c9a227" stroke-width="1.6" stroke-linecap="round"/><circle cx="16" cy="11" r="1.3" fill="#c9a227"/><circle cx="28" cy="11" r="1.3" fill="#c9a227"/></svg>`;
  const streakI = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18c3-1 4-4 7-6s5-3 7-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="5" cy="18" r="1.8" fill="currentColor"/><circle cx="19" cy="6" r="1.8" fill="currentColor"/></svg>`;

  function medal(num, done, part, col) {
    const R = 22, L = 2 * Math.PI * R;
    return `<svg viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="${R}" fill="${done ? col : "var(--bg)"}" stroke="var(--line)" stroke-width="3"/>` +
      (!done && part ? `<circle cx="27" cy="27" r="${R}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${(L * Math.min(1, part)).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 27 27)"/>` : "") +
      `<text x="27" y="33" text-anchor="middle" style="font:500 ${num > 99 ? 15 : 18}px var(--display);fill:${done ? "#fff" : "var(--muted)"}">${num}</text></svg>`;
  }

  // Dibujo de «Tu camino»: colinas por capas; el camino aparece en cada colina y se esconde tras la siguiente.
  function road(cur) {
    const W = 360, H = 210;
    const hills = [
      ['M0 82 C 30 64, 80 60, 122 74 C 156 58, 212 56, 250 70 C 284 58, 332 60, 360 72 V210 H0Z', 'h1'],
      ['M0 106 C 40 98, 92 92, 138 96 C 182 78, 262 76, 302 92 C 324 98, 346 98, 360 96 V210 H0Z', 'h2'],
      ['M0 128 C 30 108, 108 102, 162 120 C 204 134, 300 132, 360 124 V210 H0Z', 'h3'],
      ['M0 178 C 56 170, 124 150, 200 150 C 262 150, 322 160, 360 166 V210 H0Z', 'h4'],
    ];
    // Tramos del camino (uno por colina): bezier [x0,y0,x1,y1,x2,y2,x3,y3], ancho abajo, ancho arriba, raya, trazos
    const segs = [
      [[216, 100, 214, 86, 194, 78, 198, 60], 6, 1.2, 0.6, [1.8, 1.8]],
      [[150, 134, 156, 112, 226, 112, 222, 82], 15, 7, 1.1, [4, 4]],
      [[192, 176, 192, 146, 132, 150, 150, 110], 36, 17, 1.8, [8, 7]],
      [[146, 232, 160, 196, 266, 190, 250, 116], 92, 30, 2.8, [13, 11]],
    ];
    const bz = (c, t) => { const u = 1 - t; return [u*u*u*c[0] + 3*u*u*t*c[2] + 3*u*t*t*c[4] + t*t*t*c[6], u*u*u*c[1] + 3*u*u*t*c[3] + 3*u*t*t*c[5] + t*t*t*c[7]]; };
    const band = (c, w0, w1) => {
      const L = [], R = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40, p = bz(c, t), q = bz(c, Math.min(1, t + .01)), o = bz(c, Math.max(0, t - .01));
        let dx = q[0] - o[0], dy = q[1] - o[1]; const n = Math.hypot(dx, dy); dx /= n; dy /= n;
        const w = (w0 + (w1 - w0) * t) / 2;
        L.push([p[0] + dy * w, p[1] - dx * w]); R.push([p[0] - dy * w, p[1] + dx * w]);
      }
      const P = (A) => A.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
      return "M" + P(L) + " L" + P(R.reverse()) + "Z";
    };
    let defs = `<linearGradient id="rdsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--rd-sky1)"/><stop offset="1" stop-color="var(--rd-sky2)"/></linearGradient>`;
    let body = `<rect width="${W}" height="${H}" fill="url(#rdsky)"/>`;
    hills.forEach(([d, c], i) => {
      defs += `<clipPath id="rdh${i}"><path d="${d}"/></clipPath>`;
      const [c3, w0, w1, lw, da] = segs[i];
      const sd = `M${c3[0]} ${c3[1]} C ${c3[2]} ${c3[3]}, ${c3[4]} ${c3[5]}, ${c3[6]} ${c3[7]}`;
      body += `<path d="${d}" fill="var(--rd-${c})"/><!--t${i + 1}-->` +
        `<g clip-path="url(#rdh${i})"><path d="${band(c3, w0, w1)}" fill="var(--rd-road)"/>` +
        `<path d="${sd}" fill="none" stroke="var(--rd-line)" stroke-width="${lw}" stroke-dasharray="${da.join(" ")}" stroke-linecap="round"/></g>`;
    });
    // Árboles sencillos (cipreses redondeados) para dar escala
    const tree = (x, y, s, c) => `<path d="M${x} ${y}v${-3 * s}" stroke="var(--rd-${c})" stroke-width="${1.2 * s}" stroke-linecap="round"/><ellipse cx="${x}" cy="${y - 7 * s}" rx="${3.2 * s}" ry="${6 * s}" fill="var(--rd-${c})"/>`;
    body = body.replace('<!--t2-->', tree(292, 90, .7, 'tr2') + tree(301, 92, .55, 'tr2'));
    body = body.replace('<!--t3-->', tree(54, 118, 1, 'tr3') + tree(66, 116, .8, 'tr3') + tree(300, 134, .9, 'tr3'));
    body = body.replace('<!--t4-->', tree(330, 172, 1.4, 'tr4') + tree(44, 182, 1.2, 'tr4'));
    // Hitos: círculos con el número, más pequeños cuanto más lejos
    const mk = (x, y, r, txt, ok) => `<g><circle cx="${x}" cy="${y}" r="${r}" fill="${ok ? "var(--accent)" : "var(--bg)"}" stroke="${ok ? "var(--accent)" : "var(--rd-mk)"}" stroke-width="${r > 10 ? 2 : 1.5}"/>` +
      (ok ? `<path d="M${x - r * .42} ${y + .2}l${r * .28} ${r * .3}l${r * .55} ${-r * .58}" fill="none" stroke="var(--accent-ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
          : `<text x="${x}" y="${y + r * .36}" text-anchor="middle" style="font:800 ${(r * 0.95).toFixed(1)}px var(--ui);fill:var(--rd-mkt)">${txt}</text>`) + `</g>`;
    body += mk(170, 124, 11, "40", cur >= 40) + mk(212, 96, 8, "50", cur >= 50) + mk(200, 68, 6, "100", cur >= 100);
    // Hoy, sobre el tramo más cercano
    const lab = cur ? t("cmToday", { n: daysTxt(cur) }) : t("cmStart"), lw = Math.max(78, lab.length * 6.6 + 22);
    body += `<circle cx="203" cy="176" r="12" fill="var(--bg)" stroke="var(--accent-strong)" stroke-width="3"/><circle cx="203" cy="176" r="4.5" fill="var(--accent-strong)"/>` +
      `<rect x="${350 - lw}" y="164" width="${lw}" height="24" rx="12" fill="var(--bg)"/><text x="${350 - lw / 2}" y="180" text-anchor="middle" style="font:800 12px var(--ui);fill:var(--accent-strong)">${esc(lab)}</text>`;
    return `<svg viewBox="0 28 ${W} ${H - 28}" role="img" aria-label="${esc(t("cmBtn"))}"><defs>${defs}</defs>${body}</svg>`;
  }


  // Los últimos 7 días (hoy, el último): hecho, cubierto por el escudo o sin hacer
  function last7(kind, a) {
    const T = msOf(todayKey()), W = t("cmWd"), out = [];
    for (let i = 6; i >= 0; i--) {
      const d = T - i * DAY, k = keyOf(d);
      out.push([W[(new Date(d).getUTCDay() + 6) % 7], S[kind][k] ? "" : a.shield[k] ? "g" : "o"]);
    }
    return out;
  }
  const strip = (cells) => `<div class="cm-days">${cells.map(([d, k], i) => `<span class="${i === 6 ? "t" : ""}"><i class="${k}">${k === "g" ? shield : k === "o" ? "" : check}</i>${esc(d)}</span>`).join("")}</div>`;

  // ---------- Racha pequeña en Palabra y en Rosario ----------
  function pill(kind, after) {
    if (!after) return;
    let b = document.querySelector(".cm-pill." + (kind === "w" ? "x-word" : "x-ros"));
    if (!b) {
      b = document.createElement("button");
      b.type = "button"; b.className = "cm-pill " + (kind === "w" ? "x-word" : "x-ros");
      b.onclick = () => openPanel(b);
      after.insertAdjacentElement("afterend", b);
    }
    const a = analyze(kind), n = a.cur;
    const txt = n ? (n === 1 ? t("cmPill1") : t("cmPillN", { n })) : t("cmPill0");
    b.setAttribute("aria-label", txt + ". " + t("cmBtn"));
    b.innerHTML = `<span class="ic">${roadIcon()}</span><span><b>${esc(txt)}</b></span><span class="cm-dots" aria-hidden="true">${last7(kind, a).map(([, k]) => `<i class="${k}"></i>`).join("")}</span><span class="chev" aria-hidden="true">›</span>`;
  }

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
    const n = Math.max(analyze("w").cur, analyze("r").cur);
    topBtn.setAttribute("aria-label", t("cmBtn")); topBtn.title = t("cmBtn");
    topBtn.innerHTML = `${roadIcon()}<span${n ? "" : " hidden"}>${n}</span>`;
  }

  // ---------- Panel «Tu camino» ----------
  let panelEl = null, panelFrom = null, yearSel = null;
  function shieldNote(aw, ar) {
    const T = msOf(todayKey()), hits = {};
    for (let i = 1; i <= 7; i++) { const k = keyOf(T - i * DAY); if (aw.shield[k]) (hits[k] = hits[k] || []).push("w"); if (ar.shield[k]) (hits[k] = hits[k] || []).push("r"); }
    const ks = Object.keys(hits).sort();
    if (!ks.length) return `<div class="cm-note">${shield}<span>${t("cmShieldInfo")}</span></div>`;
    const k = ks[ks.length - 1], h = hits[k];
    const d = msOf(k) === T - DAY ? t("cmYesterday") : t("cmOn", { d: fmt(msOf(k), { weekday: "long" }) });
    const what = t(h.length > 1 ? "cmMissB" : h[0] === "w" ? "cmMissW" : "cmMissR");
    return `<div class="cm-note">${shield}<span>${t("cmShieldUsed", { d: esc(d), what: esc(what) })}</span></div>`;
  }
  function streakCard(kind, a) {
    const n = a.cur;
    return `<div class="cm-card ${kind === "w" ? "x-word" : "x-ros"}"><div class="cm-sr"><span class="ic">${kind === "w" ? bookI : rosI}</span><div><h3>${esc(t(kind === "w" ? "cmWord" : "cmRos"))}</h3>` +
      `<p style="margin-top:2px">${esc(t("cmBest", { n: daysTxt(a.best) }))}</p></div><span class="num">${n}<small>${esc(t(n === 1 ? "cmInRow1" : "cmInRow"))}</small></span></div>${strip(last7(kind, a))}</div>`;
  }
  function milesCard(kind, a) {
    const cells = MILES.map((m) => {
      const got = a.best >= m;
      return `<div>${medal(m, got, a.cur / m, COL[kind])}${esc(daysTxt(m))}<small>${esc(got ? t("cmGot") : t("cmOf", { a: a.cur, b: m }))}</small></div>`;
    }).join("");
    return `<div class="cm-card ${kind === "w" ? "x-word" : "x-ros"}"><h3>${esc(t(kind === "w" ? "cmPal" : "cmRos"))}</h3><div class="cm-miles">${cells}</div></div>`;
  }
  const stampHTML = (kind, i, tag) => {
    const q = STAMPS[kind][i][A.lang() === "ca" ? "ca" : "es"];
    return `<${tag} ${tag === "button" ? 'type="button" ' : ""}class="cm-st" data-st="${kind}${i}"><div class="in">${orn}<q>${esc(q[0])}</q><cite>${esc(q[1])} · ${esc(t(kind === "w" ? "cmPal" : "cmRos"))}, ${esc(daysTxt(MILES[i]))}</cite></div></${tag}>`;
  };
  function stamps(aw, ar) {
    const got = [], next = [];
    for (const [kind, a] of [["w", aw], ["r", ar]]) {
      MILES.forEach((m, i) => { if (a.best >= m) got.push(stampHTML(kind, i, "button")); });
      const i = MILES.findIndex((m) => a.best < m);
      if (i >= 0) {
        const left = MILES[i] - a.cur;
        next.push(`<div class="cm-st off"><div class="in"><b>${MILES[i]}</b>${esc(t(kind === "w" ? "cmPal" : "cmRos"))}<br>${esc(left === 1 ? t("cmLeft1") : t("cmLeft", { n: left }))}</div></div>`);
      }
    }
    return `<p class="cm-card" style="margin:0 0 10px;padding:12px 16px;background:none;box-shadow:inset 0 0 0 1px var(--line)"><span style="font:600 .8125rem/1.45 var(--ui);color:var(--muted)">${t("cmStampsN", { a: got.length, b: MILES.length * 2 })}</span></p>` +
      `<div class="cm-stamps">${got.join("")}${next.join("")}</div>`;
  }
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

  // ---------- Tu año: mes a mes y lo mejor del año ----------
  const monthName = (y, m) => capF(fmt(Date.UTC(y, m, 1), { month: "long" }));
  function yearData() {
    const y = +todayKey().slice(0, 4), M = [];
    for (let m = 0; m < 12; m++) M.push({ w: 0, r: 0, p: 0 });
    const days = {};
    for (const kind of ["w", "r"]) for (const k of Object.keys(S[kind])) {
      if (+k.slice(0, 4) !== y) continue;
      const m = +k.slice(5, 7) - 1;
      M[m][kind]++;
      days[k] = 1;
    }
    for (const k of Object.keys(days)) M[+k.slice(5, 7) - 1].p++;
    const sets = {};
    for (const [k, v] of Object.entries(S.r)) if (+k.slice(0, 4) === y && typeof v === "string") sets[v] = (sets[v] || 0) + 1;
    const top = (f) => { let b = -1; M.forEach((x, i) => { if (f(x) > 0 && (b < 0 || f(x) > f(M[b]))) b = i; }); return b; };
    return { y, M, sets, now: +todayKey().slice(5, 7) - 1, bestAll: top((x) => x.w + x.r), bestW: top((x) => x.w), bestR: top((x) => x.r) };
  }
  function monthSpan(y, a, b) {
    if (a === b) return monthName(y, a);
    const A2 = monthName(y, a), B2 = fmt(Date.UTC(y, b, 1), { month: "long" });
    if (b === a + 1) return t("cmAnd", { a: A2, b: B2 });
    if (A.lang() === "ca" && /^[aeiouàèéíòóú]/i.test(A2)) return "D'" + A2.toLowerCase() + " a " + B2;
    const s = t("cmFromTo", { a: A2.toLowerCase(), b: B2 });
    return s;
  }
  function yearHTML(aw, ar) {
    const Y = yearData(), { y, M } = Y;
    if (Y.bestAll < 0) return `<p class="cm-sec">${esc(t("cmYear", { y }))}</p><div class="cm-card"><p style="margin:0">${esc(t("cmEmptyYear"))}</p></div>`;
    if (yearSel == null || yearSel > Y.now) yearSel = Y.bestAll;
    const max = Math.max(1, ...M.map((x) => x.w + x.r));
    const bars = M.map((x, i) => `<button type="button" data-m="${i}" class="${i === yearSel ? "on" : ""}${i > Y.now ? " fut" : ""}"${i > Y.now ? " disabled" : ""} aria-label="${esc(monthName(y, i))}"><i class="r" style="height:${x.r / max * 92}px"></i><i class="w" style="height:${x.w / max * 92}px"></i><em>${esc(monthName(y, i).slice(0, 1))}</em></button>`).join("");
    const s = M[yearSel];
    const ic = (svg, c) => `<span class="ic" style="--c:${c}">${svg}</span>`;
    const totW = M.reduce((a, x) => a + x.w, 0), totR = M.reduce((a, x) => a + x.r, 0);
    const topSet = Object.entries(Y.sets).sort((a, b) => b[1] - a[1])[0];
    // Racha más larga: la mayor de las dos, en los meses en que ocurrió
    const lg = aw.best >= ar.best ? aw : ar;
    const ly = (ms) => new Date(ms).getUTCFullYear(), lm = (ms) => new Date(ms).getUTCMonth();
    const lgName = lg.best && ly(lg.bestFrom) === ly(lg.bestTo) ? monthSpan(ly(lg.bestFrom), lm(lg.bestFrom), lm(lg.bestTo)) : lg.best ? monthName(ly(lg.bestTo), lm(lg.bestTo)) : "";
    const best = [];
    best.push(`<li class="top">${ic(roadIcon(), "#7a4bb0")}<div><b>${esc(monthName(y, Y.bestAll))}</b>${esc(t("cmBestAll"))}</div><span class="v">${M[Y.bestAll].w + M[Y.bestAll].r}<small>${esc(t("cmTotal"))}</small></span></li>`);
    if (Y.bestW >= 0) best.push(`<li>${ic(bookI, COL.w)}<div><b>${esc(monthName(y, Y.bestW))}</b>${esc(t("cmBestW"))}</div><span class="v">${M[Y.bestW].w}<small>${esc(t("cmDays"))}</small></span></li>`);
    if (Y.bestR >= 0) best.push(`<li>${ic(rosI, COL.r)}<div><b>${esc(monthName(y, Y.bestR))}</b>${esc(t("cmBestR"))}</div><span class="v">${M[Y.bestR].r}<small>${esc(t("cmRosU"))}</small></span></li>`);
    if (lg.best) best.push(`<li>${ic(streakI, "#c48b00")}<div><b>${esc(lgName)}</b>${esc(t("cmBestS"))}</div><span class="v">${lg.best}<small>${esc(t("cmDays"))}</small></span></li>`);
    return `<p class="cm-sec">${esc(t("cmYear", { y }))}</p>
      <div class="cm-card cm-yr"><h3>${esc(t("cmMonthly"))}</h3><p>${esc(t("cmMonthlyP"))}</p>
        <div class="cm-chart">${bars}</div>
        <div class="cm-legend"><span><i style="--c:${COL.w}"></i>${esc(t("cmLegW"))}</span><span><i style="--c:${COL.r}"></i>${esc(t("cmLegR"))}</span></div>
        <div class="cm-month"><div class="mh"><div><small>${esc(t(yearSel === Y.bestAll ? "cmTop" : "cmMonthK"))}</small><b>${esc(monthName(y, yearSel))}</b></div>
          <div class="arr"><button type="button" data-step="-1" aria-label="${esc(t("cmPrevM"))}"${yearSel <= 0 ? " disabled" : ""}>‹</button><button type="button" data-step="1" aria-label="${esc(t("cmNextM"))}"${yearSel >= Y.now ? " disabled" : ""}>›</button></div></div>
          <div class="row"><div><b>${s.w}</b>${esc(t("cmRowW"))}</div><div><b>${s.r}</b>${esc(t("cmRowR"))}</div><div><b>${s.p}</b>${esc(t("cmRowP"))}</div></div></div>
      </div>
      <div class="cm-card"><h3>${esc(t("cmYearT"))}</h3><p>${esc(t("cmYearP"))}</p>
        <div class="cm-stats"><div><b>${totW}</b>${esc(t("cmRowW"))}</div><div><b>${totR}</b>${esc(t("cmRowR"))}</div><div><b>${Math.max(aw.best, ar.best)}</b>${esc(t("cmLong"))}</div>` +
          (topSet ? `<div><b>${esc(t("cmSets")[topSet[0]] || "")}</b>${esc(t("cmMys"))}</div>` : "") + `</div>
      </div>
      <p class="cm-sec">${esc(t("cmBestY"))}</p>
      <div class="cm-card"><h3>${esc(t("cmMonths"))}</h3><ul class="cm-best">${best.join("")}</ul></div>`;
  }

  function panelHTML() {
    const aw = analyze("w"), ar = analyze("r"), cur = Math.max(aw.cur, ar.cur);
    // En ordenador, con el mismo formato que las demás secciones (ventana, título grande y columna de 720 px)
    const head = wide()
      ? `<header class="dev-head cm-dhead"><h1>${t("cmTitle")}</h1><button type="button" class="cm-x" aria-label="${esc(t("cmClose"))}">${xI}</button></header>`
      : `<header class="cm-head"><div><h1>${t("cmTitle")}</h1></div><button type="button" class="cm-x" aria-label="${esc(t("cmClose"))}">${xI}</button></header>`;
    return `<div class="${wide() ? "dev-inner" : "cm-wrap"}">${head}
      <div class="cm-road">${road(cur)}</div>
      <div class="cm-body">
        <p class="cm-sec">${esc(t("cmStreaks"))}</p>
        <p class="cm-hint">${esc(t("cmHow"))}</p>
        ${streakCard("w", aw)}${streakCard("r", ar)}${shieldNote(aw, ar)}
        <p class="cm-sec">${esc(t("cmMiles"))}</p>
        ${milesCard("w", aw)}${milesCard("r", ar)}${stamps(aw, ar)}
        ${week()}
        ${yearHTML(aw, ar)}
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
  document.addEventListener("misas:mode", () => { if (!panelEl && !calEl) return; closeView(); closePanel(); closeCal(); steps.length = 0; });
  // Al abrir se añade un paso al historial: el botón «atrás» del móvil cierra el panel en vez de salir de la web.
  function openPanel(from) {
    if (panelEl) return;
    panelFrom = from || null; yearSel = null;
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
    const m = e.target.closest("[data-m]");
    if (m) { yearSel = +m.dataset.m; renderPanel(); return; }
    const st = e.target.closest("[data-step]");
    if (st) { yearSel += +st.dataset.step; renderPanel(); const b = panelEl.querySelector(`[data-step="${st.dataset.step}"]`); if (b && !b.disabled) b.focus({ preventScroll: true }); return; }
    const sp = e.target.closest("button.cm-st");
    if (sp) viewStamp(sp.dataset.st);
  }
  let viewEl = null;
  function viewStamp(id) {
    viewEl = document.createElement("div");
    viewEl.className = "cm-view x-path";
    viewEl.setAttribute("role", "dialog"); viewEl.setAttribute("aria-modal", "true");
    viewEl.innerHTML = stampHTML(id[0], +id.slice(1), "button");
    viewEl.onclick = () => back();
    document.body.appendChild(viewEl);
    pushStep("stamp");
    viewEl.querySelector("button").focus({ preventScroll: true });
  }
  function closeView() { if (viewEl) { viewEl.remove(); viewEl = null; } }

  // ---------- Historial: atrás cierra lo último que se abrió ----------
  const steps = [];
  function pushStep(name) { steps.push(name); try { history.pushState({ camino: name }, ""); } catch (e) { /* sin historial */ } }
  function closeTop() {
    const s = steps.pop();
    if (s === "stamp") closeView(); else if (s === "panel") closePanel(); else if (s === "cal") closeCal();
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
      pill("w", document.querySelector("#wordcol .daynav"));
      pill("r", document.querySelector("#rosList .ros-tools"));
      renderPanel();
    });
  }
  A.onLang(() => { refresh(); if (calEl) calEl.innerHTML = calHTML(); });
  // Al volver a la web otro día, la racha se recalcula
  let lastDay = todayKey();
  document.addEventListener("visibilitychange", () => { if (!document.hidden && todayKey() !== lastDay) { lastDay = todayKey(); refresh(); } });
  refresh();
  window.MisasCamino = { open: () => openPanel(), calendar: () => openCal(), analyze };
})();
