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
      wordTitle: "Palabra <em>del día</em>", todayBtn: "Hoy", prayStart: "Rezar el rosario", prayExit: "← Misterios", prev: "Anterior", next: "Siguiente",
      wordSource: "Fuente: <a href=\"{url}\" target=\"_blank\" rel=\"noopener\">{name}</a>",
      papaTranslated: "",
      wordError: "Todavía no tengo las lecturas de este día. Puedes leerlas en <a href=\"{url}\" target=\"_blank\" rel=\"noopener\">Vatican News</a>.",
      rosSets: { joyful: "gozosos", sorrowful: "dolorosos", glorious: "gloriosos", luminous: "luminosos" }, rosTitle: "Misterios <em>{set}</em>",
      rosDay: "Rosario de hoy · {day}", todayMark: "hoy", prevDay: "Día anterior", nextDay: "Día siguiente",
      brandMain: "Misas", brandArch: "Archidiócesis de", skip: "Saltar al contenido", walkM: "{m} min a pie", lateT: "No llegas andando: estás a {m} min", lateNote: "= no llegas a tiempo andando", endOfDay: "Fin del día", favAdd: "Guardar en favoritas", favOff: "Quitar de favoritas", favOn: "Favorita", favSaved: "Guardada en favoritas: saldrá la primera en la lista", favRemoved: "Quitada de favoritas", kindOne: { mass: "Misa", confession: "Confesión", adoration: "Adoración" }, calAdd: "Añadir {t} al calendario", calDone: "Abre el archivo para guardarlo en tu calendario", icsNote: "Horario de Misas Barcelona. Si vas justo, confírmalo con la parroquia.", tabHome: "Inicio", tabChat: "Chat", tabMap: "Mapa", tabWord: "Palabra del día", tabWordShort: "Palabra", tabRosary: "Rosario", tabVol: "Voluntariado", tabVolShort: "Voluntariado", volSoon: "Próximamente", volTitle: "Echa <em>una mano</em>", volSub: "Estamos preparando un espacio para servir en tu parroquia y en la diócesis.", volKindsT: "Tipos de voluntariado", volKindsP: "Cáritas, acompañar a mayores y enfermos, catequesis, liturgia, jóvenes…", volJoinT: "Apúntate", volJoinP: "Elige lo que te encaja y deja tus datos para que la parroquia te contacte.", volShopsT: "Tiendas y conventos", volShopsP: "Librerías religiosas, artículos de culto y dulces de convento cerca de ti.", volNote: "Iremos añadiendo cada apartado poco a poco.", tabFaq: "Sobre nosotros y preguntas", faqEyebrow: "Sobre nosotros · Preguntas frecuentes", faqTitle: "Cómo <em>funciona</em> esto", faqSub: "Quién hay detrás, de dónde salen los horarios y cómo puedes ayudar.", faqIdeaQ: "¿Qué es Misas Barcelona?", faqIdeaA: "<p>Una web gratuita para encontrar misa, confesión o adoración en las parroquias de la Archidiócesis de Barcelona: dices dónde estás y a qué hora te va bien, y te decimos adónde puedes ir. También tienes la palabra del día y el rosario, y pronto un espacio de voluntariado.</p>", faqWhoQ: "¿Quién está detrás?", faqWhoA: "<p>Me llamo Guillem, tengo {age} años y soy de Barcelona. Soy graduado en Derecho y estudio el máster de Abogacía. Misas Barcelona nace de una pregunta muy sencilla: <em>«¿dónde puedo ir a misa?»</em>. Me gustaría que la eucaristía, la confesión, la adoración, la palabra, el rosario y la caridad con el prójimo estuvieran al alcance de todos, y especialmente de los jóvenes. Todo en un mismo sitio y sin complicaciones.</p><details class=\"more\"><summary>Leer la historia</summary><p>Todo empezó con dos amigas, Judit y Carla, que se estaban acercando a la fe. Querían ir a misa, pero no sabían dónde buscar, y los horarios que encontraban estaban desactualizados.</p><p>Yo había pasado por lo mismo. Me convertí con 21 años, me bauticé en abril de 2026 y, al principio, tampoco sabía adónde ir. Así que me puse manos a la obra, por ellas dos y por todos los que están en ese mismo punto.</p><p>La eucaristía, la confesión, la oración y la caridad son la base de la vida cristiana. Nadie debería quedarse sin vivirlas por no saber dónde ir.</p></details>", faqSrcQ: "¿De dónde salen los horarios?", faqSrcA: "<p>Cada horario pasa por tres capas de confirmación:</p><ol><li>Web de la parroquia: cada semana, un programa lee de forma automática la web de cada parroquia y extrae sus horarios.</li><li>Otras fuentes: si la parroquia no tiene web o no se puede leer, usamos los horarios del Arzobispado y los de OpenStreetMap, y si no coinciden, damos por buenos los del Arzobispado.</li><li>Revisión: después revisamos los horarios para corroborarlos.</li></ol><p>En cada ficha verás de dónde sale el horario y lo seguro que es.</p><p>Los horarios cambian (verano, fiestas…), así que si vas justo de tiempo, confírmalo con la parroquia.</p>", faqFixQ: "He visto un horario mal, ¿cómo aviso?", faqFixA: "<p>Estamos trabajando en ello. Muy pronto podrás buscar la parroquia por su nombre, elegirla y decirnos qué horario está mal y cuál es el correcto.</p><p>Mientras tanto, en cada ficha verás de dónde sale el horario y lo seguro que es.</p>", faqDonQ: "¿Puedo donar?", faqDonA: "<p>Estamos trabajando en ello. La web es y será gratuita.</p><p>De momento, la mejor ayuda es compartirla en tu parroquia y con tus amigos.</p>", faqPrivQ: "¿Guardáis mis datos?", faqPrivA: "<p>No. Lo que escribes en el chat y tu ubicación se quedan en tu móvil u ordenador: no se envían a ningún servidor ni pedimos registro.</p>", faqResQ: "Recursos", faqResA: "<ul><li><a href=\"https://esglesia.barcelona\" target=\"_blank\" rel=\"noopener\">Arzobispado de Barcelona</a></li><li><a href=\"https://www.vatican.va/archive/catechism_sp/index_sp.html\" target=\"_blank\" rel=\"noopener\">Catecismo de la Iglesia Católica</a></li><li><a href=\"https://www.vatican.va\" target=\"_blank\" rel=\"noopener\">La Santa Sede</a></li></ul>", themeLight: "Modo claro", themeDark: "Modo oscuro", themeGroup: "Modo", settings: "Ajustes: modo, idioma e icono", iconGroup: "Icono de la app", iconNote: "Se aplica al añadir la app a la pantalla de inicio. Si ya la tienes, quítala y vuelve a añadirla.", iconNames: { s1a: "Sagrada Família", st1: "Sagrada de trencadís", st3: "Trencadís en rojos" }, langNames: { es: "Castellano", ca: "Català" },
      eyebrow: "Archidiócesis<span class=\"eb-city\"> de Barcelona</span> · <span id=\"parishCount\">{n}</span> parroquias",
      heroTitle: "¿Dónde quieres ir a <em>misa</em>?",
      heroLede: "Dime dónde estás y a qué hora te va bien. También busco <strong class=\"k-conf\"><em>confesiones</em></strong> y <strong class=\"k-ador\"><em>adoración</em></strong>.",
      kindMass: "Misa", kindConf: "Confesión", kindAdor: "Adoración",
      lblDay: "Día", lblFrom: "Desde", lblTo: "Hasta", lblMun: "Municipio", lblLang: "Idioma", lblDist: "Distritos",
      langAny: "Cualquiera", langCa: "Catalán", langEs: "Castellano", langOther: "Otros idiomas",
      searchPh: "Nombre de la parroquia o calle", upNext: "Próximas misas", upNextAll: "Ver todas en el mapa", newSearch: "Nueva búsqueda", favHome: "Tus parroquias", favToday: "hoy", favNoMore: "hoy ya no hay más", fontNormal: "Letra normal", fontBig: "Letra más grande", saintsToday: "Santos del día", saintMore: "Leer más", quick: { now: "Ahora", evening: "Esta tarde", tomorrow: "Mañana", sun: "Domingo" }, quickLbl: "Filtros rápidos", reset: "Quitar filtros", filtersList: "Filtros y lista",
      nearMe: "Cerca de mí", resetMap: "Restablecer mapa", toTop: "Volver arriba", switchTo: "Canviar a català", loading: "Cargando parroquias…",
      days: { mon: "lunes", tue: "martes", wed: "miércoles", thu: "jueves", fri: "viernes", sat: "sábado", sun: "domingo" },
      dayShort: { mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D", hol: "F" }, dayAbbr: { mon: "Lun", tue: "Mar", wed: "Mié", thu: "Jue", fri: "Vie", sat: "Sáb", sun: "Dom", hol: "Festivos" }, holidays: "Festivos", sunL: "Domingo", andHol: "y festivos",
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
      directions: "Cómo llegar", web: "Web", official: "Ficha oficial", share: "Compartir", copied: "Enlace copiado: ya puedes pegarlo en WhatsApp o donde quieras.", shareText: "Horarios de misa de {n}",
      hMass: "Misas", noMass: "Esta parroquia no publica horario de misas.", hConf: "Confesiones", hAdor: "Adoración eucarística", hOther: "Otras celebraciones", srcH: "De dónde sale este horario", srcNames: { REV: "revisión a mano", F1: "web de la parroquia", F2: "misas.org", F3: "ficha del Arzobispado", OSM: "OpenStreetMap" }, checked: "Comprobado el {d}", conf: { alta: "fiabilidad alta", media: "fiabilidad media", baja: "fiabilidad baja: puede no estar al día, confírmalo con la parroquia" }, srcOf: "{k}: {s}", warnHol: "Los horarios pueden cambiar en festivos, en verano y en Navidad o Semana Santa. Si vas a ir un día especial, confírmalo con la parroquia.", otherSeasons: "Otras temporadas", rev: { fiable: "Horario comprobado: coincide con la revisión a mano.", no_coinciden: "No fiable: la web de la parroquia y la revisión a mano no coinciden. Se muestra el de la web; revisa la web y confírmalo con la parroquia.", sin_revisar: "Fiabilidad media: horario leído de la web de la parroquia, aún sin revisar a mano.", sin_revisar_otra: "Fiabilidad media: no sale de la web de la parroquia y aún no se ha revisado a mano. Confírmalo con la parroquia.", sin_web: "Esta parroquia no tiene web: el horario se ha revisado a mano y puede cambiar. Confírmalo con la parroquia.", sin_lectura: "Horario revisado a mano (la web de la parroquia no se ha podido leer). Puede cambiar: confírmalo con la parroquia.", revisado: "Horario revisado a mano (la ficha del Arzobispado dice otra cosa). Puede cambiar: confírmalo con la parroquia." }, mismatch: "El Arzobispado y OpenStreetMap no coinciden: se muestra el del Arzobispado, que puede no estar al día. Confírmalo con la parroquia.", pending: "Pendiente de verificar: no se ha podido leer la fuente esta semana; se muestra el último horario conocido.",
      monSat: "Lun–Sáb", everyDay: "Cada día", monFri: "Lun–Vie", sundays: "Domingos", districtLbl: "Distrito", youAreHere: "Estás aquí", askMore: "Pregunta otra cosa… ",
      ideas: ["Estoy en Gràcia y quiero ir a misa entre las 17 y las 20", "Misa el domingo por la mañana en Sarrià", "Confesiones el sábado en Sants", "Adoración hoy en el Eixample"],
      hints: ["Misa ahora cerca de mí", "Gràcia, entre las 17 y las 20", "Confesiones el sábado", "Adoración en el Eixample", "Domingo por la mañana en Sarrià", "Misa en castellano en Sants"]
    },
    ca: {
      wordTitle: "Paraula <em>del dia</em>", todayBtn: "Avui", prayStart: "Resar el rosari", prayExit: "← Misteris", prev: "Anterior", next: "Següent",
      wordSource: "Font: <a href=\"{url}\" target=\"_blank\" rel=\"noopener\">{name}</a>",
      papaTranslated: "Traducció automàtica ({engine}) del text de Vatican News.",
      wordError: "Encara no tinc les lectures d'aquest dia. Les pots llegir a <a href=\"{url}\" target=\"_blank\" rel=\"noopener\">evangeli.net</a>.",
      rosSets: { joyful: "de goig", sorrowful: "de dolor", glorious: "de glòria", luminous: "de llum" }, rosTitle: "Misteris <em>{set}</em>",
      rosDay: "Rosari d'avui · {day}", todayMark: "avui", prevDay: "Dia anterior", nextDay: "Dia següent",
      brandMain: "Misses", brandArch: "Arxidiòcesi de", skip: "Salta al contingut", walkM: "{m} min a peu", lateT: "No hi arribes caminant: ets a {m} min", lateNote: "= no hi arribes a temps caminant", endOfDay: "Final del dia", favAdd: "Desa a preferides", favOff: "Treu de preferides", favOn: "Preferida", favSaved: "Desada a preferides: sortirà la primera a la llista", favRemoved: "Treta de preferides", kindOne: { mass: "Missa", confession: "Confessió", adoration: "Adoració" }, calAdd: "Afegeix {t} al calendari", calDone: "Obre l\'arxiu per desar-lo al teu calendari", icsNote: "Horari de Misses Barcelona. Si vas just, confirma-ho amb la parròquia.", tabHome: "Inici", tabChat: "Xat", tabMap: "Mapa", tabWord: "Paraula del dia", tabWordShort: "Paraula", tabRosary: "Rosari", tabVol: "Voluntariat", tabVolShort: "Voluntariat", volSoon: "Properament", volTitle: "Dona <em>un cop de mà</em>", volSub: "Estem preparant un espai per servir a la teva parròquia i a la diòcesi.", volKindsT: "Tipus de voluntariat", volKindsP: "Càritas, acompanyar gent gran i malalts, catequesi, litúrgia, joves…", volJoinT: "Apunta-t'hi", volJoinP: "Tria el que t'escau i deixa les teves dades perquè la parròquia et contacti.", volShopsT: "Botigues i convents", volShopsP: "Llibreries religioses, articles de culte i dolços de convent a prop teu.", volNote: "Anirem afegint cada apartat a poc a poc.", tabFaq: "Qui som i preguntes", faqEyebrow: "Qui som · Preguntes freqüents", faqTitle: "Com <em>funciona</em> això", faqSub: "Qui hi ha al darrere, d'on surten els horaris i com pots ajudar.", faqIdeaQ: "Què és Misses Barcelona?", faqIdeaA: "<p>Un web gratuït per trobar missa, confessió o adoració a les parròquies de l'Arxidiòcesi de Barcelona: dius on ets i a quina hora et va bé, i et diem on pots anar. També tens la paraula del dia i el rosari, i aviat un espai de voluntariat.</p>", faqWhoQ: "Qui hi ha al darrere?", faqWhoA: "<p>Em dic Guillem, tinc {age} anys i sóc de Barcelona. Sóc graduat en Dret i estudio el màster d'Advocacia. Misses Barcelona neix d'una pregunta molt senzilla: <em>«on puc anar a missa?»</em>. M'agradaria que l'eucaristia, la confessió, l'adoració, la paraula, el rosari i la caritat amb el proïsme fossin a l'abast de tothom, i especialment dels joves. Tot en un mateix lloc i sense complicacions.</p><details class=\"more\"><summary>Llegir la història</summary><p>Tot va començar amb dues amigues, la Judit i la Carla, que s'estaven apropant a la fe. Volien anar a missa, però no sabien on buscar, i els horaris que trobaven estaven desactualitzats.</p><p>Jo havia passat pel mateix. Em vaig convertir amb 21 anys, em vaig batejar l'abril de 2026 i, al principi, tampoc no sabia on anar. Així que m'hi vaig posar, per elles dues i per tots els qui són en aquest mateix punt.</p><p>L'eucaristia, la confessió, la pregària i la caritat són la base de la vida cristiana. Ningú no s'hauria de quedar sense viure-les per no saber on anar.</p></details>", faqSrcQ: "D'on surten els horaris?", faqSrcA: "<p>Cada horari passa per tres capes de confirmació:</p><ol><li>Web de la parròquia: cada setmana, un programa llegeix de manera automàtica el web de cada parròquia i n'extreu els horaris.</li><li>Altres fonts: si la parròquia no té web o no es pot llegir, fem servir els horaris de l'Arquebisbat i els d'OpenStreetMap, i si no coincideixen, donem per bons els de l'Arquebisbat.</li><li>Revisió: després revisem els horaris per corroborar-los.</li></ol><p>A cada fitxa veuràs d'on surt l'horari i com n'és de segur.</p><p>Els horaris canvien (estiu, festes…), així que si vas just de temps, confirma-ho amb la parròquia.</p>", faqFixQ: "He vist un horari malament, com ho aviso?", faqFixA: "<p>Hi estem treballant. Ben aviat podràs buscar la parròquia pel nom, triar-la i dir-nos quin horari està malament i quin és el correcte.</p><p>Mentrestant, a cada fitxa veuràs d'on surt l'horari i com n'és de segur.</p>", faqDonQ: "Puc fer un donatiu?", faqDonA: "<p>Hi estem treballant. El web és i serà gratuït.</p><p>De moment, la millor ajuda és compartir-lo a la teva parròquia i amb els teus amics.</p>", faqPrivQ: "Guardeu les meves dades?", faqPrivA: "<p>No. El que escrius al xat i la teva ubicació es queden al teu mòbil o ordinador: no s'envien a cap servidor ni demanem registre.</p>", faqResQ: "Recursos", faqResA: "<ul><li><a href=\"https://esglesia.barcelona\" target=\"_blank\" rel=\"noopener\">Arquebisbat de Barcelona</a></li><li><a href=\"https://www.vatican.va/archive/catechism_sp/index_sp.html\" target=\"_blank\" rel=\"noopener\">Catecisme de l'Església Catòlica</a></li><li><a href=\"https://www.vatican.va\" target=\"_blank\" rel=\"noopener\">La Santa Seu</a></li></ul>", themeLight: "Mode clar", themeDark: "Mode fosc", themeGroup: "Mode", settings: "Ajustos: mode, idioma i icona", iconGroup: "Icona de l'app", iconNote: "S'aplica quan afegeixes l'app a la pantalla d'inici. Si ja la tens, treu-la i torna-la a afegir.", iconNames: { s1a: "Sagrada Família", st1: "Sagrada de trencadís", st3: "Trencadís en vermells" }, langNames: { es: "Castellano", ca: "Català" },
      eyebrow: "Arxidiòcesi<span class=\"eb-city\"> de Barcelona</span> · <span id=\"parishCount\">{n}</span> parròquies",
      heroTitle: "On vols anar a <em>missa</em>?",
      heroLede: "Digues-me on ets i a quina hora et va bé. També busco <strong class=\"k-conf\"><em>confessions</em></strong> i <strong class=\"k-ador\"><em>adoració</em></strong>.",
      kindMass: "Missa", kindConf: "Confessió", kindAdor: "Adoració",
      lblDay: "Dia", lblFrom: "Des de", lblTo: "Fins a", lblMun: "Municipi", lblLang: "Idioma", lblDist: "Districtes",
      langAny: "Qualsevol", langCa: "Català", langEs: "Castellà", langOther: "Altres idiomes",
      searchPh: "Nom de la parròquia o carrer", upNext: "Properes misses", upNextAll: "Veure-les totes al mapa", newSearch: "Nova cerca", favHome: "Les teves parròquies", favToday: "avui", favNoMore: "avui ja no n'hi ha més", fontNormal: "Lletra normal", fontBig: "Lletra més gran", saintsToday: "Sants del dia", saintMore: "Llegir-ne més", quick: { now: "Ara", evening: "Aquesta tarda", tomorrow: "Demà", sun: "Diumenge" }, quickLbl: "Filtres ràpids", reset: "Treure filtres", filtersList: "Filtres i llista",
      nearMe: "A prop meu", resetMap: "Restablir el mapa", toTop: "Tornar a dalt", switchTo: "Cambiar a castellano", loading: "Carregant parròquies…",
      days: { mon: "dilluns", tue: "dimarts", wed: "dimecres", thu: "dijous", fri: "divendres", sat: "dissabte", sun: "diumenge" },
      dayShort: { mon: "Dl", tue: "Dt", wed: "Dc", thu: "Dj", fri: "Dv", sat: "Ds", sun: "Dg", hol: "F" }, dayAbbr: { mon: "Dl", tue: "Dt", wed: "Dc", thu: "Dj", fri: "Dv", sat: "Ds", sun: "Dg", hol: "Festius" }, holidays: "Festius", sunL: "Diumenge", andHol: "i festius",
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
      directions: "Com arribar-hi", web: "Web", official: "Fitxa oficial", share: "Compartir", copied: "Enllaç copiat: ja el pots enganxar al WhatsApp o on vulguis.", shareText: "Horaris de missa de {n}",
      hMass: "Misses", noMass: "Aquesta parròquia no publica horari de misses.", hConf: "Confessions", hAdor: "Adoració eucarística", hOther: "Altres celebracions", srcH: "D'on surt aquest horari", srcNames: { REV: "revisió a mà", F1: "web de la parròquia", F2: "misas.org", F3: "fitxa de l'Arquebisbat", OSM: "OpenStreetMap" }, checked: "Comprovat el {d}", conf: { alta: "fiabilitat alta", media: "fiabilitat mitjana", baja: "fiabilitat baixa: pot no estar al dia, confirma-ho amb la parròquia" }, srcOf: "{k}: {s}", warnHol: "Els horaris poden canviar els festius, a l'estiu i per Nadal o Setmana Santa. Si hi vas un dia especial, confirma-ho amb la parròquia.", otherSeasons: "Altres temporades", rev: { fiable: "Horari comprovat: coincideix amb la revisió a mà.", no_coinciden: "No fiable: la web de la parròquia i la revisió a mà no coincideixen. Es mostra el de la web; revisa la web i confirma-ho amb la parròquia.", sin_revisar: "Fiabilitat mitjana: horari llegit de la web de la parròquia, encara sense revisar a mà.", sin_revisar_otra: "Fiabilitat mitjana: no surt de la web de la parròquia i encara no s'ha revisat a mà. Confirma-ho amb la parròquia.", sin_web: "Aquesta parròquia no té web: l'horari s'ha revisat a mà i pot canviar. Confirma-ho amb la parròquia.", sin_lectura: "Horari revisat a mà (la web de la parròquia no s'ha pogut llegir). Pot canviar: confirma-ho amb la parròquia.", revisado: "Horari revisat a mà (la fitxa de l'Arquebisbat diu una altra cosa). Pot canviar: confirma-ho amb la parròquia." }, mismatch: "L'Arquebisbat i OpenStreetMap no coincideixen: es mostra el de l'Arquebisbat, que pot no estar al dia. Confirma-ho amb la parròquia.", pending: "Pendent de verificar: aquesta setmana no s'ha pogut llegir la font; es mostra l'últim horari conegut.",
      monSat: "Dl–Ds", everyDay: "Cada dia", monFri: "Dl–Dv", sundays: "Diumenges", districtLbl: "Districte", youAreHere: "Ets aquí", askMore: "Pregunta una altra cosa… ",
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
  // Edad de Guillem para «Sobre nosotros» (nació el 13 de mayo de 2003)
  const AGE = (() => { const d = new Date(); return d.getFullYear() - 2003 - (d.getMonth() < 4 || (d.getMonth() === 4 && d.getDate() < 13) ? 1 : 0); })();
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
  const DEVOTION = ["word", "rosary", "volunteer", "faq"];
  const calm = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // ---------- Enlaces propios: cada vista y cada parroquia tiene su dirección (#mapa, #parroquia/…) ----------
  const ROUTE = { home: "inicio", chat: "chat", map: "mapa", word: "palabra", rosary: "rosario", volunteer: "voluntariado", faq: "nosotros" };
  const ROUTE_LABEL = { home: "tabHome", chat: "tabChat", map: "tabMap", word: "tabWord", rosary: "tabRosary", volunteer: "tabVol", faq: "tabFaq" };
  let routing = false;
  function setTitle() {
    const p = state.detailId && DATA.find((x) => x.id === state.detailId);
    const name = p ? p.name : state.mode !== "home" ? t(ROUTE_LABEL[state.mode]) : "";
    document.title = (name ? name + " · " : "") + (LNG === "ca" ? "Misses Barcelona" : "Misas Barcelona");
  }
  function pushRoute(hash, st) {
    if (routing || location.hash === "#" + hash) return;
    history.pushState(st || null, "", "#" + hash);
  }
  function applyRoute() {
    const h = decodeURIComponent(location.hash.slice(1));
    routing = true;
    try {
      if (h.startsWith("parroquia/")) openDetail(h.slice(10));
      else {
        if (state.detailId) closeDetail();
        setMode(Object.keys(ROUTE).find((k) => ROUTE[k] === h) || "home");
      }
    } finally { routing = false; }
    setTitle();
  }
  addEventListener("popstate", applyRoute);
  // Avisa a los lectores de pantalla de la sección en la que estás
  let lastAnn = "home";
  function announce(mode) {
    const el = document.getElementById("srLive"); if (!el || mode === lastAnn) return; lastAnn = mode;
    el.textContent = ""; setTimeout(() => { el.textContent = t(ROUTE_LABEL[mode] || "tabHome"); }, 60);
  }
  function setMode(mode) {
    pushRoute(ROUTE[mode]);
    if (state.mode === mode && $("stage").dataset.mode === mode) return;
    const apply = () => {
      state.mode = mode;
      $("stage").dataset.mode = mode;
      document.body.dataset.tone = DEVOTION.includes(mode) ? mode : state.kind;
      document.querySelectorAll(".tabs button, .extras button, .bottomnav button, .x-faq").forEach((b) => { const on = b.dataset.go === mode || (mode === "chat" && b.dataset.go === "home" && !!b.closest(".bottomnav")); b.classList.toggle("on", on); if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
      setTitle();
      announce(mode);
      document.dispatchEvent(new Event("misas:mode"));
      MapView.resize && MapView.resize();
      if (state.pendingFit && mode !== "chat") refit();
    };
    // Transición suave entre vistas (las ventanas se mueven y cambian de tamaño).
    if (document.startViewTransition && !calm()) {
      // En el móvil la vista entera se desliza un poco hacia el lado de la pestaña que tocas.
      const ORDER = ["home", "chat", "map", "word", "rosary", "volunteer", "faq"];
      const html = document.documentElement;
      html.dataset.vtdir = ORDER.indexOf(mode) < ORDER.indexOf(state.mode) ? "back" : "fwd";
      html.classList.add("vt-nav");
      const t = document.startViewTransition(apply);
      t.finished.then(() => MapView.resize && MapView.resize()).catch(() => {}).then(() => html.classList.remove("vt-nav"));
    } else {
      apply();
      requestAnimationFrame(() => MapView.resize && MapView.resize());
    }
    if (mode === "chat") setTimeout(() => $("chatInput").focus({ preventScroll: true }), 80);
  }

  // ---------- Pintar resultados ----------
  // Quita horas repetidas: la misma hora e idioma que ya sale en otro grupo de días que la incluye (p. ej. «domingo y festivos» y «festivos»).
  function dedupe(evs) {
    const same = (a, b) => a.start === b.start && (a.end || "") === (b.end || "") && (a.lang || "") === (b.lang || "");
    return evs.filter((ev, i) => !evs.some((o, j) => j !== i && same(ev, o) && ev.days.every((d) => o.days.includes(d)) && (o.days.length > ev.days.length || j < i)));
  }
  function timesHtml(r, kind, day) {
    if (r.soft) return `<span class="t note">${t("soft")}</span>` + r.hits.map((h) => `<span class="t hit">${h.start}</span>`).join("");
    const hit = new Set(r.hits);
    // Con «Cerca de mí», las horas de hoy a las que no llegas andando salen tachadas.
    const walk = walkMin(r), now = walk != null && state.day === "today" ? nowBcn().min : null;
    const late = (ev) => now != null && hit.has(ev) && toMin(ev.start) - now < walk;
    const seen = new Set();
    return (eventsOf(r.p, kind) || []).filter((ev) => dayMatch(ev, day))
      .filter((ev) => { const k = ev.start + (ev.end || "") + (ev.lang || ""); if (seen.has(k)) return false; seen.add(k); return true; })
      .map((ev) => `<span class="t ${hit.has(ev) ? "hit" : ""}${late(ev) ? " late" : ""}"${late(ev) ? ` title="${t("lateT", { m: walk })}"` : ""}>${ev.start}${ev.end ? "–" + ev.end : ""}${ev.lang ? `<small>${LANG[ev.lang] || (ev.lang === "other" ? t("langOtherShort") : ev.lang)}</small>` : ""}</span>`).join("");
  }
  // Minutos andando (4,5 km/h y un 30 % más por las calles), solo con «Cerca de mí».
  const walkMin = (r) => nearUser() && r.d != null ? Math.max(1, Math.round(r.d * 1.3 / 4.5 * 60)) : null;
  // Parroquias favoritas (se guardan solo en este móvil u ordenador)
  const FAVS = new Set((() => { try { return JSON.parse(localStorage.getItem("misas-favs") || "[]"); } catch (e) { return []; } })());
  const isFav = (id) => FAVS.has(id);
  function toggleFav(id) {
    if (FAVS.has(id)) FAVS.delete(id); else FAVS.add(id);
    try { localStorage.setItem("misas-favs", JSON.stringify([...FAVS])); } catch (e) { /* sin almacenamiento */ }
    renderFavs();
    return FAVS.has(id);
  }
  // Inicio: tus parroquias con estrella y su próxima misa de hoy (solo si tienes alguna).
  function renderFavs() {
    const box = $("favRow"); if (!box) return;
    if (!FAVS.size) { box.innerHTML = ""; return; }
    const f = initialFilters(), res = computeResults(f, null);
    const list = [...FAVS].map((id) => DATA.find((p) => p.id === id)).filter(Boolean).slice(0, 4);
    box.innerHTML = `<p class="fav-h">${STAR}${t("favHome")}</p>` + list.map((p) => {
      const r = res.find((x) => x.p.id === p.id), next = r && !r.soft && r.hits.length ? r.hits[0].start : null;
      return `<button type="button" class="fav-c" data-id="${esc(p.id)}"><span class="fav-n">${esc(p.name)}<small>${esc(p.distrito || p.municipio || "")}</small></span>` +
        (next ? `<span class="t hit">${next}</span>` : `<span class="fav-none">${t("favNoMore")}</span>`) + `</button>`;
    }).join("");
    box.querySelectorAll(".fav-c").forEach((b) => b.onclick = () => { showOnMap(f, null, res); openDetail(b.dataset.id); });
  }
  const STAR = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z"/></svg>`;
  function cardHtml(r, kind, day) {
    const p = r.p;
    const where = p.municipio === "Barcelona" ? p.distrito : p.municipio;
    return `<li class="card" data-id="${esc(p.id)}" tabindex="0">
      <span class="name">${isFav(p.id) ? `<span class="fav-star" title="${t("favOn")}">${STAR}</span>` : ""}${esc(p.name)}</span>
      <span class="dist">${km(r.d)}${walkMin(r) != null ? ` · ${t("walkM", { m: walkMin(r) })}` : ""}</span>
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
    $("summary").innerHTML = `<strong>${res.length}</strong> ${res.length === 1 ? t("parish1") : t("parishN")} · ${describe(state, null, nearUser()).replace(/<\/?strong>/g, "")}` + (nearUser() && state.day === "today" ? `<span class="late-note"><span class="t late">10:00</span> ${t("lateNote")}</span>` : "");
    const favFirst = res.filter((r) => isFav(r.p.id)).concat(res.filter((r) => !isFav(r.p.id)));
    $("list").innerHTML = res.length ? favFirst.slice(0, 300).map((r) => cardHtml(r, state.kind, day)).join("")
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
  // Horario de la ficha: cada día una sola vez, de lunes a domingo, con todas sus horas.
  // Los días seguidos con las mismas horas se juntan (Lun–Vie, Cada día…); los festivos van con el domingo si coinciden.
  function schedule(evs) {
    if (!evs.length) return "";
    const ORD = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], per = {};
    for (const d of ORD.concat("hol")) per[d] = new Map();
    for (const ev of evs) for (const d of ev.days) if (per[d]) { const k = ev.start + "|" + (ev.end || "") + "|" + (ev.lang || ""); if (!per[d].has(k)) per[d].set(k, ev); }
    const sig = (d) => [...per[d].keys()].sort().join(",");
    const groups = [];
    for (const d of ORD) {
      if (!per[d].size) continue;
      const g = groups[groups.length - 1], last = g && g.days[g.days.length - 1];
      if (g && sig(last) === sig(d) && ORD.indexOf(last) === ORD.indexOf(d) - 1) g.days.push(d); else groups.push({ days: [d] });
    }
    if (per.hol.size) {
      const sun = groups.find((g) => g.days.includes("sun"));
      if (sun && sig("sun") === sig("hol")) sun.hol = true; else groups.push({ days: ["hol"] });
    }
    const label = (g) => {
      const d = g.days, a = d[0], z = d[d.length - 1];
      let l = a === "hol" ? t("holidays")
        : d.length === 7 ? t("everyDay")
        : d.length === 5 && a === "mon" && z === "fri" ? t("monFri")
        : d.length === 6 && a === "mon" && z === "sat" ? t("monSat")
        : d.length === 1 ? cap(t("days")[a])
        : t("dayAbbr")[a] + "–" + t("dayAbbr")[z];
      return g.hol ? l + " " + t("andHol") : l;
    };
    const span = (ev) => `<span class="t" ${ev.note ? `title="${esc(ev.note)}"` : ""}>${ev.start}${ev.end ? "–" + ev.end : ""}${ev.lang ? `<small>${LANG[ev.lang] || (ev.lang === "other" ? t("langOtherShort") : ev.lang)}</small>` : ""}</span>`;
    return `<dl class="sched">${groups.map((g) => `<dt>${label(g)}</dt><dd>${[...per[g.days[0]].values()].sort((x, y) => x.start.localeCompare(y.start)).map(span).join("")}</dd>`).join("")}</dl>`;
  }

  // Fuente del horario (horarios automáticos): enlace, fecha de comprobación, fiabilidad y aviso de festivos.
  function sourceBox(p) {
    const h = p.horario;
    if (!h || !h.fuente) return "";
    const date = (d) => d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : "";
    const KIND = { masses: t("hMass"), confessions: t("hConf"), adoration: t("hAdor") };
    const per = Object.entries(h.fuentes_por_tipo || {});
    const mixed = new Set(per.map(([, v]) => v.fuente)).size > 1;
    const link = (f, url) => url ? `<a target="_blank" rel="noopener" href="${esc(url)}">${esc(t("srcNames")[f] || f)}</a>` : esc(t("srcNames")[f] || f);
    // Con revisión a mano (Excel de revisión), su aviso sustituye a la etiqueta de fiabilidad de la fuente.
    const conf = (c) => h.revision || !c ? "" : ` <span class="conf c-${esc(c)}">${esc(t("conf")[c] || "")}</span>`;
    const REV_COLOR = { fiable: "verde", no_coinciden: "rojo" };
    const lines = mixed
      ? per.map(([k, v]) => `<li>${t("srcOf", { k: KIND[k], s: link(v.fuente, v.url) })}${conf(v.confianza)}</li>`).join("")
      : `<li>${link(h.fuente, h.url)}${conf(h.confianza)}</li>`;
    const others = (h.otras_temporadas || []).map((o) => `<li><b>${esc(o.nombre)}</b> · ${esc(KIND[o.tipo])}: ${esc(o.texto)}</li>`).join("");
    return `<div class="srcbox">
      ${others ? `<h3>${t("otherSeasons")}</h3><ul class="seasons">${others}</ul>` : ""}
      ${h.estado === "pendiente de verificar" ? `<p class="warn">${t("pending")}</p>` : ""}
      ${h.revision && t("rev")[h.revision] ? `<p class="rev r-${REV_COLOR[h.revision] || "amarillo"}">${t("rev")[h.revision]}</p>` : ""}
      ${h.discrepancia ? `<p class="warn">${t("mismatch")}</p>` : ""}
      <p class="warn">${t("warnHol")}</p>
      <h4>${t("srcH")}</h4>
      <ul>${lines}</ul>
      ${h.comprobado ? `<p class="checked">${t("checked", { d: date(h.comprobado) })}</p>` : ""}
    </div>`;
  }

  // «Añadir al calendario» descarga un .ics con la próxima misa que encaja con los filtros.
  function nextHit(id) {
    const r = state.results.find((x) => x.p.id === id);
    if (!r || r.soft || !r.hits.length || state.day === "any") return null;
    const ev = r.hits[0], d = resolvedDay(state.day), now = nowBcn();
    let add = (DAY_CODES.indexOf(d) - DAY_CODES.indexOf(now.day) + 7) % 7;
    if (add === 0 && toMin(ev.start) < now.min) add = 7;
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).split("-").map(Number);
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + add));
    return { ev, date, add };
  }
  function downloadIcs(p, h) {
    const pad = (n) => String(n).padStart(2, "0");
    const ymd = `${h.date.getUTCFullYear()}${pad(h.date.getUTCMonth() + 1)}${pad(h.date.getUTCDate())}`;
    const s = toMin(h.ev.start), e = h.ev.end ? toMin(h.ev.end) : s + 45;
    const hm = (m) => `${pad(Math.floor(m / 60) % 24)}${pad(m % 60)}00`;
    const clean = (x) => String(x || "").replace(/[,;\\]/g, (c) => "\\" + c).replace(/\n/g, " ");
    const what = t("kindOne")[state.kind] || t("kindOne").mass;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Misas Barcelona//ES", "BEGIN:VEVENT",
      `UID:${p.id}-${ymd}-${hm(s)}@misas-barcelona`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART;TZID=Europe/Madrid:${ymd}T${hm(s)}`, `DTEND;TZID=Europe/Madrid:${ymd}T${hm(e)}`,
      `SUMMARY:${clean(what + " · " + p.name)}`, `LOCATION:${clean([p.address, p.municipio].filter(Boolean).join(", "))}`,
      `DESCRIPTION:${clean(t("icsNote"))}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = `misa-${p.id}.ics`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(t("calDone"));
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
      <div class="dhead"><h2>${esc(p.name)}</h2><button type="button" class="fav-btn${isFav(p.id) ? " on" : ""}" id="favBtn" aria-pressed="${isFav(p.id)}" aria-label="${t(isFav(p.id) ? "favOff" : "favAdd")}" title="${t(isFav(p.id) ? "favOff" : "favAdd")}">${STAR}</button></div>
      <p class="addr">${esc([p.address, p.municipio].filter(Boolean).join(", "))}<em>${esc(p.distrito ? t("district", { d: p.distrito }) : "")}${p.distrito && !/^Sin /.test(p.comunitat) ? " · " : ""}${esc(!/^Sin /.test(p.comunitat) ? t("community", { c: p.comunitat }) : "")}</em></p>
      <div class="actions">
        <a class="btn primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${dest}">${t("directions")}</a>
        ${p.phone ? `<a class="btn" href="tel:${esc(p.phone.replace(/\s/g, ""))}">${esc(p.phone)}</a>` : ""}
        ${p.web ? `<a class="btn" target="_blank" rel="noopener" href="${esc(p.web)}">${t("web")}</a>` : ""}
        ${p.url ? `<a class="btn" target="_blank" rel="noopener" href="${esc(p.url)}">${t("official")}</a>` : ""}
        <button type="button" class="btn share" id="shareBtn"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${t("share")}</button>
        ${nextHit(id) ? `<button type="button" class="btn cal" id="calBtn"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v4M10 15h4"/></svg>${t("calAdd", { t: nextHit(id).ev.start })}</button>` : ""}
      </div>
      <h3>${t("hMass")}</h3>
      ${schedule(p.masses) || `<p class="note">${t("noMass")}</p>`}
      ${p.masses_text ? `<p class="note">${esc(p.masses_text)}</p>` : ""}
      ${p.confessions.length || p.confessions_text ? `<h3>${t("hConf")}</h3>${schedule(p.confessions)}${p.confessions_text ? `<p class="note">${esc(p.confessions_text)}</p>` : ""}` : ""}
      ${p.adoration.length || p.adoration_text ? `<h3>${t("hAdor")}</h3>${schedule(p.adoration)}${p.adoration_text ? `<p class="note">${esc(p.adoration_text)}</p>` : ""}` : ""}
      ${p.other ? `<h3>${t("hOther")}</h3><p class="note">${esc(p.other)}</p>` : ""}
      ${sourceBox(p)}`;
    box.classList.remove("closing"); box.hidden = false; state.detailId = id; box.style.removeProperty("--sy"); box.scrollTop = 0;
    pushRoute("parroquia/" + id, { detail: id }); setTitle();
    observeReveal(box.querySelectorAll("h3, .sched, .note"));
    $("filters").hidden = true; $("summary").hidden = true; $("list").hidden = true;
    $("side").scrollTop = 0;
    // En el móvil la vista Mapa es una sola página: vuelve arriba para ver el punto en el mapa y el inicio de la ficha.
    if ($("stage").scrollTop > 0) $("stage").scrollTo({ top: 0, behavior: calm() ? "auto" : "smooth" });
    $("closeDetail").onclick = () => { if (history.state && history.state.detail) history.back(); else closeDetail(); };
    // Compartir la parroquia: menú del móvil (WhatsApp, Telegram…) o, si no hay, copiar el enlace
    $("shareBtn").onclick = async () => {
      const url = location.href.split("#")[0] + "#parroquia/" + encodeURIComponent(p.id);
      const data = { title: p.name, text: t("shareText", { n: p.name }), url };
      if (navigator.share) { try { await navigator.share(data); } catch (e) { /* cancelado */ } return; }
      try { await navigator.clipboard.writeText(url); toast(t("copied")); } catch (e) { prompt("", url); }
    };
    $("favBtn").onclick = () => { const on = toggleFav(id), b = $("favBtn"); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); b.title = t(on ? "favOff" : "favAdd"); b.setAttribute("aria-label", b.title); toast(t(on ? "favSaved" : "favRemoved")); renderList(); document.querySelectorAll("#list .card").forEach((c) => c.classList.toggle("sel", c.dataset.id === id)); };
    if ($("calBtn")) $("calBtn").onclick = () => { const h = nextHit(id); if (h) downloadIcs(p, h); };
    if (focus && MapView.focus) MapView.focus(p);
  }
  function closeDetail() {
    const box = $("detail");
    // En el móvil la hoja baja deslizándose; la lista ya se ve debajo mientras baja.
    if (!box.hidden && !calm() && state.mode === "map" && matchMedia("(max-width: 860px)").matches) {
      box.classList.add("closing");
      const done = () => { if (!box.classList.contains("closing")) return; box.classList.remove("closing"); if (!state.detailId) { box.hidden = true; box.style.removeProperty("--sy"); } };
      box.addEventListener("animationend", function end(e) { if (e.target !== box) return; box.removeEventListener("animationend", end); done(); });
      setTimeout(done, 600);
    } else { box.hidden = true; box.style.removeProperty("--sy"); }
    state.detailId = null;
    if (!routing && location.hash.startsWith("#parroquia/")) history.replaceState(null, "", "#mapa");
    setTitle();
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
    $("fTo").innerHTML = hours.map((m) => `<option value="${m + 29}">${m + 29 >= 1439 ? t("endOfDay") : fmt(m + 29)}</option>`).join("");
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
    document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml, { n: DATA.length, age: AGE }); });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); if (el.title) el.title = t(el.dataset.i18nAria); });
    document.querySelectorAll("#langs button").forEach((b) => {
      if (!b.innerHTML) b.innerHTML = `${FLAG[b.dataset.lang]}<span>${t("langNames")[b.dataset.lang]}</span>`;
      b.classList.toggle("on", b.dataset.lang === LNG); b.setAttribute("aria-pressed", b.dataset.lang === LNG);
    });
    $("modes").setAttribute("aria-label", t("themeGroup"));
    document.querySelectorAll("#modes button").forEach((b) => { const l = t(b.dataset.mode === "dark" ? "themeDark" : "themeLight"); b.title = l; b.setAttribute("aria-label", l); });
    applyTheme();
    $("iconPick").setAttribute("aria-label", t("iconGroup"));
    applyIcon();
    $("ideas").innerHTML = t("ideas").map((q) => `<li><button type="button">${esc(q)}</button></li>`).join("");
    renderCita();
  }
  // Cita bíblica de Voluntariado: cambia cada medio día (castellano: Biblia de Jerusalén; catalán: BCI)
  function renderCita() {
    const box = $("volCita"), all = (window.CITAS || []).filter((c) => c.es && c.es.text && c.ca && c.ca.text);
    if (!box || !all.length) return;
    const pick = all[Math.floor(Date.now() / 432e5) % all.length], c = pick[LNG] || pick.es;
    box.innerHTML = `<blockquote>${c.text.map((p) => `<p>${esc(p)}</p>`).join("")}</blockquote><figcaption>${esc(c.ref)}${c.src ? ` <small>${esc(c.src)}</small>` : ""}</figcaption>`;
    box.hidden = false;
  }
  // Modo claro / oscuro: por defecto el del sistema; la elección se recuerda en el navegador.
  const darkMQ = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
  function applyTheme() {
    const cur = document.documentElement.dataset.theme || (darkMQ && darkMQ.matches ? "dark" : "light");
    document.querySelectorAll("#modes button").forEach((b) => { b.classList.toggle("on", b.dataset.mode === cur); b.setAttribute("aria-pressed", b.dataset.mode === cur); });
  }
  function setTheme(m, from) {
    const html = document.documentElement;
    if (from && document.startViewTransition && !calm() && html.dataset.theme !== m) {
      const r = from.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      html.classList.add("vt-theme");
      const vt = document.startViewTransition(() => setTheme(m));
      vt.ready.then(() => html.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
        { duration: 620, easing: "cubic-bezier(.3,.7,.2,1)", pseudoElement: "::view-transition-new(root)" })).catch(() => {});
      vt.finished.catch(() => {}).then(() => html.classList.remove("vt-theme"));
      return;
    }
    html.dataset.theme = m;
    // La barra de estado del móvil sigue al modo elegido
    document.querySelectorAll('meta[name="theme-color"]').forEach((el) => { el.removeAttribute("media"); el.content = m === "dark" ? "#0e0b0c" : "#ffffff"; });
    try { localStorage.setItem("misas-theme", m); } catch (e) { /* sin almacenamiento */ }
    applyTheme();
  }
  if (darkMQ && darkMQ.addEventListener) darkMQ.addEventListener("change", applyTheme);
  // Icono de la app (pantalla de inicio): S1-A por defecto; la elección se recuerda en el navegador.
  function curIcon() { let v = null; try { v = localStorage.getItem("misas-icon"); } catch (e) { /* sin almacenamiento */ } return v === "st1" || v === "st3" ? v : "s1a"; }
  function applyIcon() {
    const cur = curIcon();
    document.querySelectorAll("#iconPick button").forEach((b) => { const l = t("iconNames")[b.dataset.icon]; b.title = l; b.setAttribute("aria-label", l); b.classList.toggle("on", b.dataset.icon === cur); b.setAttribute("aria-pressed", b.dataset.icon === cur); });
  }
  function setIcon(id) {
    id = window.misasIcon ? window.misasIcon(id) : id;
    try { localStorage.setItem("misas-icon", id); } catch (e) { /* sin almacenamiento */ }
    applyIcon();
  }
  function setLang(l) {
    LNG = l;
    try { localStorage.setItem("misas-lang", l); } catch (e) { /* sin almacenamiento */ }
    const swap = () => {
      applyLang(); fillSelects(); syncControls(); renderList(); showOnMapLabel();
      if (state.detailId) { routing = true; openDetail(state.detailId, false); routing = false; }
      setTitle();
      setPh(true); renderUpNext(); renderFavs();
      langListeners.forEach((fn) => fn(LNG));
    };
    // Fundido suave de un idioma a otro (el texto viejo se desvanece mientras aparece el nuevo).
    if (document.startViewTransition && !calm()) {
      const html = document.documentElement;
      html.classList.add("vt-lang");
      document.startViewTransition(swap).finished.catch(() => {}).then(() => html.classList.remove("vt-lang"));
    } else swap();
  }

  // Filtros rápidos encima del mapa: un toque y listo
  const QUICK = {
    now: () => { const n = nowBcn().min; return { day: "today", from: n, to: Math.min(1439, n + 90) }; },
    evening: () => ({ day: "today", from: 16 * 60, to: 1439 }),
    tomorrow: () => ({ day: "tomorrow", from: 0, to: 1439 }),
    sun: () => ({ day: "sun", from: 0, to: 1439 })
  };
  function renderQuick() {
    const box = $("quick"); if (!box) return;
    const cur = Object.keys(QUICK).find((k) => { const q = QUICK[k](); return q.day === state.day && Math.abs(q.from - state.from) < 2 && q.to === state.to; });
    box.innerHTML = Object.keys(QUICK).map((k) => `<button type="button" data-q="${k}" class="${k === cur ? "on" : ""}" aria-pressed="${k === cur}">${k === "now" ? '<i class="dot"></i>' : ""}${t("quick")[k]}</button>`).join("");
  }
  function syncControls() {
    renderQuick();
    document.querySelectorAll(".seg.kinds button").forEach((b) => { b.classList.toggle("on", b.dataset.kind === state.kind); b.setAttribute("aria-pressed", b.dataset.kind === state.kind); });
    document.querySelectorAll(".seg.kinds").forEach((sg) => sg.style.setProperty("--idx", ["mass", "confession", "adoration"].indexOf(state.kind)));
    if (document.querySelector(".mapcol").dataset.kind !== state.kind) {
      document.querySelector(".mapcol").dataset.kind = state.kind;
      if (!DEVOTION.includes(state.mode)) document.body.dataset.tone = state.kind; // tinte muy leve del fondo
      MapView.recolor && MapView.recolor();
    }
    $("fDay").value = state.day;
    $("fFrom").value = String(state.from - (state.from % 30));
    $("fTo").value = String(Math.min(1439, state.to - (state.to % 30) + 29));
    $("fMun").value = state.mun; $("fLang").value = state.lang; $("fText").value = state.text;
    const hasDist = !!GEO.distritos[state.mun];
    $("districts").hidden = !hasDist;
    document.querySelectorAll("#distChips button").forEach((b) => { b.classList.toggle("on", b.dataset.dist === state.dist); b.setAttribute("aria-pressed", b.dataset.dist === state.dist); });
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
    const ph = $("chatPh");
    ph.textContent = ($("stage").classList.contains("has-thread") && innerWidth > 1100 ? t("askMore") : "") + hints[hintIdx++ % hints.length];
    ph.classList.remove("in"); void ph.offsetWidth; ph.classList.add("in");
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

  // Vuelve el mapa a como estaba al entrar: misas de hoy desde ahora, sin zona ni ubicación.
  function resetMap() {
    const ic = $("resetMap").querySelector("svg"); ic.classList.remove("turn"); void ic.offsetWidth; ic.classList.add("turn");
    $("nearBtn").classList.remove("on");
    closeDetail();
    showOnMap(initialFilters(), null, computeResults(initialFilters(), null));
  }
  // Inicio en el ordenador: las próximas misas (de ahora en adelante) debajo del chat, para llenar el hueco
  function renderUpNext() {
    const box = $("upnext"); if (!box) return;
    const f = initialFilters(), res = computeResults(f, null).slice(0, 4), day = resolvedDay(f.day);
    box.innerHTML = res.length ? `<p class="eyebrow">${t("upNext")}</p><ul class="cards">${res.map((r) => cardHtml(r, "mass", day)).join("")}</ul><button type="button" class="link" id="upAll">${t("upNextAll")}</button>` : "";
    box.querySelectorAll(".card").forEach((c) => c.onclick = () => { showOnMap(f, null, computeResults(f, null)); openDetail(c.dataset.id); });
    const all = $("upAll"); if (all) all.onclick = () => { showOnMap(f, null, computeResults(f, null)); setMode("map"); };
  }
  const initialFilters = () => Object.assign({}, BLANK, { from: nowBcn().min });

  // Botón de volver arriba: sigue al panel que se está desplazando.
  function bindToTop() {
    const btn = $("toTop");
    let target = null;
    const scrollers = [$("chatScroll"), $("side"), $("stage"), $("wordScroll"), $("rosScroll")];
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

  // Móvil: la ficha es una hoja que se sube hasta arriba (por encima del mapa) y se vuelve a bajar.
  function bindSheet() {
    const box = $("detail"), mobile = () => matchMedia("(max-width: 860px)").matches && state.mode === "map";
    const base = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--top")) + 6;
    const maxY = () => Math.max(0, innerHeight - base() - 170); // siempre se ve un trozo de la ficha
    const cur = () => box.getBoundingClientRect().top - base();
    const place = (y, smooth) => { box.classList.toggle("dragging", !smooth); box.style.setProperty("--sy", Math.round(y) + "px"); };
    let g = null; // gesto en curso
    box.addEventListener("touchstart", (e) => {
      if (!mobile() || e.touches.length > 1) { g = null; return; }
      const t = e.touches[0], y = cur();
      g = { y0: t.clientY, sheet0: y, scroll0: box.scrollTop, handle: t.clientY - (y + base()) < 36, mode: null, pts: [[t.clientY, e.timeStamp]] };
    }, { passive: true });
    box.addEventListener("touchmove", (e) => {
      if (!g) return;
      const t = e.touches[0], dy = t.clientY - g.y0;
      g.pts.push([t.clientY, e.timeStamp]); if (g.pts.length > 5) g.pts.shift();
      if (!g.mode) {
        if (Math.abs(dy) < 5) return;
        // Se mueve la hoja si se agarra por arriba, si aún no está arriba del todo, o si se tira hacia abajo con la ficha al principio
        g.mode = g.handle || (g.sheet0 > 1 && g.scroll0 <= 0) || (dy > 0 && box.scrollTop <= 0) ? "sheet" : "scroll";
      }
      if (g.mode !== "sheet") return;
      e.preventDefault();
      let y = g.sheet0 + dy;
      if (y < 0) { box.scrollTop = g.scroll0 - y; y = 0; } // al llegar arriba, sigue bajando por la ficha en el mismo gesto
      else box.scrollTop = 0;
      const m = maxY(); if (y > m) y = m + (y - m) * 0.25; // resistencia suave al pasarse
      place(y, false);
    }, { passive: false });
    const end = (e) => {
      if (!g) return; const was = g; g = null;
      if (was.mode !== "sheet") return;
      const [a, b] = [was.pts[0], was.pts[was.pts.length - 1]];
      const still = e && e.timeStamp - b[1] > 90; // si el dedo se paró antes de soltar, se queda justo ahí
      const v = !still && b[1] > a[1] ? (b[0] - a[0]) / (b[1] - a[1]) : 0; // px por ms
      let y = cur() + v * 220; // un poco de inercia, como al soltar algo
      y = Math.min(Math.max(y, 0), maxY());
      if (y < 24) y = 0;
      place(y, true);
    };
    box.addEventListener("touchend", end, { passive: true });
    box.addEventListener("touchcancel", end, { passive: true });
    // Tocar la rayita: arriba del todo / a media pantalla
    box.addEventListener("click", (e) => {
      if (!mobile() || e.clientY - box.getBoundingClientRect().top > 30) return;
      place(cur() > 4 ? 0 : innerHeight * 0.34, true);
    });
    addEventListener("resize", () => { if (!box.hidden && box.style.getPropertyValue("--sy")) place(Math.min(cur(), maxY()), true); });
  }
  function bind() {
    bindSheet();
    const skip = document.querySelector(".skip"); if (skip) skip.addEventListener("click", (e) => { e.preventDefault(); const el = [...document.querySelectorAll("#stage .win")].find(x => x.offsetParent) || document.getElementById("stage"); el.setAttribute("tabindex", "-1"); el.focus(); });
    applyLang();
    $("ideas").onclick = (e) => { const b = e.target.closest("button"); if (b) ask(b.textContent); };
    const input = $("chatInput");
    setPh(); setInterval(() => setPh(), 3500);
    const typed = () => $("chatForm").classList.toggle("typed", !!input.value);
    input.addEventListener("input", () => { autosize(input); typed(); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("chatForm").requestSubmit(); } });
    $("chatForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value; if (!v.trim()) return;
      const send = document.querySelector(".send"); send.classList.remove("fly"); void send.offsetWidth; send.classList.add("fly");
      input.value = ""; autosize(input); typed(); ask(v);
    });

    document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.go)));
    // Preguntas de «Próximamente»: aún no se abren
    document.querySelectorAll(".faq details.off > summary").forEach((sm) => sm.addEventListener("click", (e) => e.preventDefault()));
    document.querySelectorAll(".seg.kinds button").forEach((b) => b.onclick = () => { state.kind = b.dataset.kind; if (state.mode === "home") setMode("map"); applyFilters(); });
    const on = (id, key, num) => $(id).onchange = (e) => { state[key] = num ? Number(e.target.value) : e.target.value; applyFilters(); };
    on("fDay", "day"); on("fFrom", "from", true); on("fTo", "to", true); on("fLang", "lang");
    $("fMun").onchange = (e) => { state.mun = e.target.value; state.dist = ""; state.origin = null; $("nearBtn").classList.remove("on"); applyFilters(); };
    $("distChips").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; state.dist = b.dataset.dist; state.origin = null; $("nearBtn").classList.remove("on"); applyFilters(); };
    let timer; $("fText").oninput = (e) => { clearTimeout(timer); timer = setTimeout(() => { state.text = e.target.value.trim(); applyFilters(); }, 250); };
    $("reset").onclick = () => { Object.assign(state, BLANK, { origin: null }); $("nearBtn").classList.remove("on"); applyFilters(); };
    const pick = (e) => { const c = e.target.closest(".card"); if (c) openDetail(c.dataset.id); };
    $("list").addEventListener("click", pick);
    $("list").addEventListener("keydown", (e) => { if (e.key === "Enter") pick(e); });
    $("modes").onclick = (e) => { const b = e.target.closest("button"); if (b) setTheme(b.dataset.mode, b); };
    $("iconPick").onclick = (e) => { const b = e.target.closest("button"); if (b) setIcon(b.dataset.icon); };
    $("langs").onclick = (e) => { const b = e.target.closest("button"); if (b && b.dataset.lang !== LNG) setLang(b.dataset.lang); };
    $("nearBtn").onclick = nearMe;
    // Menú de ajustes (modo e idioma) en un solo botón
    const setBtn = $("setBtn"), setPop = $("setPop");
    const sheet = () => matchMedia("(max-width: 860px)").matches && !calm();
    const openSet = (o) => {
      setBtn.setAttribute("aria-expanded", o); setBtn.classList.toggle("on", o);
      if (o) { setPop.classList.remove("closing"); setPop.hidden = false; return; }
      if (setPop.hidden) return;
      if (!sheet()) { setPop.hidden = true; return; }
      // En el móvil la hoja baja y el fondo se aclara antes de esconderse
      setPop.classList.add("closing");
      setTimeout(() => { if (setPop.classList.contains("closing")) { setPop.classList.remove("closing"); setPop.hidden = true; } }, 260);
    };
    setBtn.onclick = (e) => { e.stopPropagation(); openSet(setPop.hidden || setPop.classList.contains("closing")); };
    // Fuera del menú (o en el fondo oscurecido del móvil, que es parte de .settings) se cierra
    document.addEventListener("click", (e) => { if (!setPop.hidden && (!e.target.closest(".settings") || e.target.classList.contains("settings"))) openSet(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !setPop.hidden) { openSet(false); setBtn.focus(); } });
    $("quick").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; Object.assign(state, QUICK[b.dataset.q]()); applyFilters(); };
    $("resetMap").onclick = resetMap;
    // 6: «Nueva búsqueda» borra la conversación y vuelve a la portada del chat
    $("newQ").onclick = () => {
      $("thread").innerHTML = ""; $("stage").classList.remove("has-thread"); setPh(true);
      if (matchMedia("(max-width: 860px)").matches) setMode("home");
      setTimeout(() => $("chatInput").focus({ preventScroll: true }), 60);
    };
    // 8: tamaño de la letra de las lecturas (se recuerda en este móvil u ordenador)
    const fs = (big) => { $("reading").classList.toggle("big", big); document.querySelectorAll("#fsz button").forEach((b) => { const on = (b.dataset.fs === "big") === big; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); }); };
    let big = false; try { big = localStorage.getItem("misas-font") === "big"; } catch (e) { /* sin almacenamiento */ }
    fs(big);
    $("fsz").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; fs(b.dataset.fs === "big"); try { localStorage.setItem("misas-font", b.dataset.fs); } catch (e2) { /* sin almacenamiento */ } };
    // 15: en iPhone, Safari solo enseña el efecto de pulsar (:active) si la página escucha los toques
    document.addEventListener("touchstart", () => {}, { passive: true });
    // 17: las preguntas y oraciones plegables se abren y se cierran con suavidad
    document.addEventListener("click", (e) => {
      const sm = e.target.closest("details > summary"); if (!sm || calm()) return;
      const d = sm.parentElement; if (d.classList.contains("off") || d._anim) return;
      e.preventDefault();
      const ease = "cubic-bezier(.22,1,.36,1)", closedH = sm.offsetHeight + (d.offsetHeight - d.clientHeight);
      const run = (from, to, ms, end) => {
        d.style.overflow = "hidden";
        d._anim = d.animate({ height: [from + "px", to + "px"] }, { duration: ms, easing: ease });
        d._anim.onfinish = d._anim.oncancel = () => { d._anim = null; d.style.overflow = ""; if (end) end(); };
      };
      if (!d.open) { const from = d.offsetHeight; d.open = true; run(from, d.offsetHeight, 380); }
      else run(d.offsetHeight, Math.max(closedH, sm.offsetHeight), 280, () => { d.open = false; });
    });
    bindToTop();
  }

  function hideSplash() {
    if (!document.body.classList.contains("loading")) return;
    document.body.classList.remove("loading");
    // La Sagrada termina de levantarse (más deprisa si el mapa ya está) y entonces se desvanece la pantalla.
    const sp = $("splash"), art = sp.querySelector(".splash-art svg");
    const out = () => { sp.classList.add("out"); setTimeout(() => sp.remove(), 700); };
    const anim = art && art.getAnimations ? art.getAnimations()[0] : null;
    if (anim && !calm() && anim.playState === "running") { anim.playbackRate = 2.5; anim.finished.then(() => setTimeout(out, 220), out); }
    else setTimeout(out, calm() ? 0 : 200);
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
    renderUpNext(); renderFavs();
    if (!window.maplibregl && !CFG.googleMapsApiKey) hideSplash();
    if (location.hash.length > 1) applyRoute(); // entrar por un enlace: abre esa vista o esa parroquia
  }
  const langListeners = [];
  window.MisasApp = { t, lang: () => LNG, onLang: (fn) => langListeners.push(fn), calm, nowBcn, esc, cap,
    i18n: (lng, dict) => Object.assign(I18N[lng], dict), parseQuery, search, ask, setMode, state, DATA };
  start();
})();
