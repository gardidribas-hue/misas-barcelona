/* MAQUETAS (no publicar): 10 ideas para premiar la constancia en la Palabra y el Rosario.
   Solo se ven al abrir la web con ?racha=N (N = número de la idea, del 1 al 10).
   Los datos son de ejemplo: una racha de 12 días a 24 de noviembre de 2026. */
(() => {
  const n = +(new URLSearchParams(location.search).get("racha") || 0);
  const A = window.MisasApp;
  if (!n || !A) return;
  const $ = (id) => document.getElementById(id);

  const css = `
  .rk { margin-top: 16px; padding: 18px 18px; border-radius: 22px; background: color-mix(in srgb, var(--surface) 88%, transparent); color: var(--ink); }
  .rk .k { margin: 0 0 4px; font: 800 .6875rem/1.2 var(--ui); letter-spacing: .08em; text-transform: uppercase; color: var(--accent-strong); }
  .rk h3 { margin: 0 0 6px; font: 600 1.1875rem/1.25 var(--display); color: var(--ink); }
  .rk p { margin: 0; font: 500 .875rem/1.5 var(--ui); color: var(--muted); }
  .rk p b { color: var(--ink); font-weight: 700; }
  .rk .btn-s { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; border: 0; border-radius: 999px; padding: 10px 16px; font: 700 .875rem/1 var(--ui); background: var(--accent); color: var(--accent-ink); }
  .rk .btn-g { background: var(--bg); color: var(--ink); box-shadow: inset 0 0 0 1px var(--line); }
  .rk-row { display: grid; grid-template-columns: 112px 1fr; gap: 16px; align-items: center; }
  .rk svg { display: block; }
  /* 1. Racha discreta */
  .rk1 { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding: 10px 14px 10px 10px; border-radius: 18px; background: var(--accent-soft); }
  .rk1 .ic { width: 36px; height: 36px; flex: none; border-radius: 50%; background: var(--bg); display: grid; place-items: center; color: var(--accent-strong); }
  .rk1 .tx { flex: 1; font: 500 .875rem/1.3 var(--ui); color: var(--muted); }
  .rk1 .tx b { display: block; font: 700 1rem/1.2 var(--ui); color: var(--ink); }
  .rk1 .wk { display: flex; gap: 5px; }
  .rk1 .wk span { display: flex; flex-direction: column; align-items: center; gap: 3px; font: 700 .625rem/1 var(--ui); color: var(--muted); }
  .rk1 .wk i { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); }
  .rk1 .wk .today i { box-shadow: 0 0 0 2px var(--bg), 0 0 0 3.5px var(--accent); }
  /* 3. Calendario */
  .rk-cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px 2px; margin-top: 12px; text-align: center; }
  .rk-cal .h { font: 800 .6875rem/1 var(--ui); color: var(--faint); padding-bottom: 4px; }
  .rk-cal .d { position: relative; height: 38px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 3px; font: 600 .8125rem/1 var(--ui); color: var(--muted); padding-top: 4px; }
  .rk-cal .d i { width: 9px; height: 9px; border-radius: 50%; background: var(--c); }
  .rk-cal .d i.w { background: #fff; box-shadow: inset 0 0 0 1.5px #c9a227; }
  .rk-cal .d.no i { background: none; box-shadow: inset 0 0 0 1px var(--line); }
  .rk-cal .d.fut { color: var(--faint); }
  .rk-cal .d.fut i { display: none; }
  .rk-cal .d.today { color: var(--ink); font-weight: 800; }
  .rk-cal .d.today::before { content: ""; position: absolute; inset: 0 3px; border-radius: 12px; box-shadow: inset 0 0 0 1.5px var(--accent); }
  .rk-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 10px; font: 600 .75rem/1 var(--ui); color: var(--muted); }
  .rk-legend span { display: inline-flex; align-items: center; gap: 6px; }
  .rk-legend i { width: 9px; height: 9px; border-radius: 50%; background: var(--c); }
  .rk-legend i.w { background: #fff; box-shadow: inset 0 0 0 1.5px #c9a227; }
  /* 4. Hitos */
  .rk-miles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 14px 0 4px; text-align: center; }
  .rk-miles div { font: 700 .75rem/1.25 var(--ui); color: var(--ink); }
  .rk-miles small { display: block; font-weight: 600; color: var(--muted); }
  .rk-miles svg { width: 58px; height: 58px; margin: 0 auto 6px; }
  .rk-estampa { margin-top: 16px; padding: 10px; border-radius: 16px; background: #fbf6ea; }
  .rk-estampa .in { position: relative; padding: 22px 22px 18px; border: 1px solid #c9a227; border-radius: 10px; text-align: center; color: #4a3a22; }
  .rk-estampa .in::before { content: ""; position: absolute; inset: 4px; border: 1px solid rgba(201,162,39,.45); border-radius: 7px; pointer-events: none; }
  .rk-estampa svg.orn { width: 44px; height: 22px; margin: 0 auto 8px; }
  .rk-estampa q { display: block; font: italic 500 1.125rem/1.45 var(--read); quotes: "«" "»"; }
  .rk-estampa cite { display: block; margin-top: 10px; font: 800 .6875rem/1.3 var(--ui); letter-spacing: .08em; text-transform: uppercase; font-style: normal; color: #9a7a1c; }
  .rk-btns { display: flex; gap: 8px; flex-wrap: wrap; }
  .rk-miles div { hyphens: none; }
  /* 5. Racha que perdona */
  .rk-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin: 14px 0 12px; text-align: center; }
  .rk-days span { display: flex; flex-direction: column; align-items: center; gap: 6px; font: 700 .6875rem/1 var(--ui); color: var(--muted); }
  .rk-days i { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: var(--accent); color: var(--accent-ink); }
  .rk-days i.g { background: none; color: var(--accent-strong); box-shadow: inset 0 0 0 1.5px var(--accent); border: 0; background-image: none; }
  .rk-days .today i { box-shadow: 0 0 0 2px var(--bg), 0 0 0 3.5px var(--accent); }
  .rk-days i svg { width: 15px; height: 15px; }
  .rk-note { display: flex; gap: 10px; align-items: flex-start; margin-top: 12px; padding: 10px 12px; border-radius: 14px; background: var(--bg); font: 500 .8125rem/1.45 var(--ui); color: var(--muted); }
  .rk-note svg { flex: none; width: 18px; height: 18px; margin-top: 1px; color: var(--accent-strong); }
  /* 6. Misterios */
  .rk-mys { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 14px 0 10px; text-align: center; }
  .rk-mys div { font: 700 .75rem/1.25 var(--ui); color: var(--ink); }
  .rk-mys small { display: block; font-weight: 600; color: var(--muted); }
  .rk-mys svg { width: 56px; height: 56px; margin: 0 auto 6px; }
  .rk-seg { display: grid; grid-auto-flow: column; gap: 4px; margin: 12px 0 8px; }
  .rk-seg i { height: 7px; border-radius: 9px; background: var(--line); }
  .rk-seg i.on { background: var(--accent); }
  .rk-seg i.cur { background: color-mix(in srgb, var(--accent) 35%, var(--line)); }
  .rk-segl { display: flex; justify-content: space-between; font: 700 .75rem/1 var(--ui); color: var(--muted); }
  /* 7. Plan */
  .rk-today { margin-top: 12px; padding: 12px 14px; border-radius: 14px; background: var(--bg); }
  .rk-today b { display: block; font: 600 1.0625rem/1.3 var(--display); color: var(--ink); margin-bottom: 2px; }
  .rk-more { margin-top: 12px; font: 600 .8125rem/1.4 var(--ui); color: var(--muted); }
  .rk-more span { color: var(--accent-strong); }
  /* 8. Peregrinación */
  .rk-route { margin: 12px -4px 4px; border-radius: 16px; background: var(--bg); overflow: hidden; }
  .rk-route svg { width: 100%; height: auto; }
  .rk-route .lbl { font: 700 10.5px var(--ui); fill: var(--ink); paint-order: stroke; stroke: var(--bg); stroke-width: 4px; stroke-linejoin: round; }
  .rk-route .lbl.off { fill: var(--muted); font-weight: 600; }
  .rk-ficha { display: grid; grid-template-columns: 44px 1fr; gap: 12px; align-items: center; margin-top: 12px; padding: 10px 12px; border-radius: 14px; background: var(--bg); }
  .rk-ficha svg { width: 44px; height: 44px; }
  .rk-ficha b { display: block; font: 600 1rem/1.25 var(--display); color: var(--ink); }
  .rk-ficha p { font-size: .8125rem; }
  /* 9. Resumen */
  .rk-bars { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin: 14px 0 8px; text-align: center; }
  .rk-bars span { display: flex; flex-direction: column; align-items: center; gap: 5px; font: 700 .6875rem/1 var(--ui); color: var(--muted); }
  .rk-bars i { width: 22px; height: 22px; border-radius: 7px; display: grid; place-items: center; background: var(--line); }
  .rk-bars i.w { background: #2fb565; } .rk-bars i.r { background: #3d82ec; }
  .rk-bars i svg { width: 13px; height: 13px; color: #fff; }
  .rk-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
  .rk-stats div { padding: 12px; border-radius: 14px; background: var(--bg); font: 600 .75rem/1.3 var(--ui); color: var(--muted); }
  .rk-stats b { display: block; font: 500 1.75rem/1.1 var(--display); color: var(--ink); }
  /* 10. Recordatorio */
  .rk-noti { position: fixed; left: 10px; right: 10px; top: 10px; z-index: 200; display: grid; grid-template-columns: 38px 1fr; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 20px; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(14px); box-shadow: 0 10px 30px rgba(0,0,0,.22); font: 500 .8125rem/1.35 var(--ui); color: var(--ink); }
  .rk-noti img { width: 38px; height: 38px; border-radius: 9px; }
  .rk-noti b { display: flex; justify-content: space-between; font: 700 .8125rem/1.2 var(--ui); }
  .rk-noti b small { font-weight: 500; color: var(--muted); }
  .rk-rem { display: flex; flex-direction: column; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
  .rk-rem .top2 { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .rk-rem .top2 b { font: 700 1rem/1.2 var(--ui); }
  .rk-rem .top2 small { display: block; font: 500 .8125rem/1.3 var(--ui); color: var(--muted); }
  .rk-sw { width: 46px; height: 28px; flex: none; border-radius: 99px; background: #3d82ec; position: relative; }
  .rk-sw::after { content: ""; position: absolute; right: 3px; top: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; }
  .rk-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .rk-chips span { padding: 8px 12px; border-radius: 99px; background: var(--surface); font: 700 .8125rem/1 var(--ui); color: var(--ink); }
  .rk-chips span.on { background: #3d82ec; color: #fff; }
  .rk-chips .lab { background: none; padding-left: 0; color: var(--muted); font-weight: 600; }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- Dibujos ----------
  const check = `<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const bookmark = `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M7 3.5h10a1 1 0 0 1 1 1V20l-6-3.6L6 20V4.5a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.2 9.6l2 2 3.8-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const book = `<svg viewBox="0 0 16 16"><path d="M8 4.2C6.6 3 4.6 2.8 2.5 3.2v8.6c2.1-.4 4.1-.2 5.5 1 1.4-1.2 3.4-1.4 5.5-1V3.2C11.4 2.8 9.4 3 8 4.2Zm0 0v8.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  const crossI = `<svg viewBox="0 0 16 16"><path d="M8 2.5v11M4.5 6h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  const shield = `<svg viewBox="0 0 20 20"><path d="M10 2.2l6 2.3v4.7c0 4-2.7 6.9-6 8.6-3.3-1.7-6-4.6-6-8.6V4.5l6-2.3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.2 10l2 2 3.8-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const graceI = `<svg viewBox="0 0 16 16"><path d="M8 2.2l4.6 1.8v3.6c0 3-2 5.2-4.6 6.5C5.4 12.8 3.4 10.6 3.4 7.6V4L8 2.2Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  // Anillo de cuentas: total cuentas, llenas, en grupos de 10
  function beadRing(total, full, size = 112, opts = {}) {
    const c = size / 2, r = size / 2 - 10, groups = total / 10;
    let s = `<svg viewBox="0 0 ${size} ${size + 26}" width="${size}" height="${size + 26}"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
    for (let i = 0; i < total; i++) {
      const g = Math.floor(i / 10), k = i % 10;
      const a = Math.PI / 2 + ((g + (k + 1) / 11.5) / groups) * 2 * Math.PI;
      const x = (c + r * Math.cos(a)).toFixed(1), y = (c + r * Math.sin(a)).toFixed(1);
      const on = i < full, cur = i === full;
      s += `<circle cx="${x}" cy="${y}" r="${on ? 3 : 2.6}" fill="${on ? "var(--accent)" : "var(--bg)"}" stroke="${on ? "var(--accent)" : cur ? "var(--accent)" : "var(--faint)"}" stroke-width="${cur ? 1.6 : 1}"/>`;
    }
    for (let g = 0; g < groups; g++) {
      const a = Math.PI / 2 + (g / groups) * 2 * Math.PI;
      s += `<circle cx="${(c + r * Math.cos(a)).toFixed(1)}" cy="${(c + r * Math.sin(a)).toFixed(1)}" r="4.2" fill="${g === 0 || g * 10 < full ? "var(--accent-strong)" : "var(--bg)"}" stroke="var(--accent-strong)" stroke-width="1.2"/>`;
    }
    s += `<path d="M${c} ${c + r + 5}v6M${c} ${size + 6}v13M${c - 5} ${size + 10.5}h10" stroke="var(--accent-strong)" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
    s += `<text x="${c}" y="${c + 4}" text-anchor="middle" style="font:500 30px var(--display);fill:var(--ink)">${opts.big ?? full}</text><text x="${c}" y="${c + 20}" text-anchor="middle" style="font:800 8px var(--ui);letter-spacing:.08em;fill:var(--muted)">${opts.unit ?? "DE " + total}</text></svg>`;
    return s;
  }
  // Medallón de hito
  function medal(num, done, part = 0) {
    const R = 24, L = 2 * Math.PI * R;
    return `<svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="${R}" fill="${done ? "var(--accent)" : "var(--bg)"}" stroke="var(--line)" stroke-width="3"/>` +
      (!done && part ? `<circle cx="29" cy="29" r="${R}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${(L * part).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 29 29)"/>` : "") +
      `<circle cx="29" cy="29" r="${R - 5}" fill="none" stroke="${done ? "rgba(255,255,255,.55)" : "var(--line)"}" stroke-width="1" stroke-dasharray="2 2.4"/>` +
      `<text x="29" y="35" text-anchor="middle" style="font:500 ${num > 99 ? 16 : 19}px var(--display);fill:${done ? "var(--accent-ink)" : "var(--muted)"}">${num}</text></svg>`;
  }
  const church = (col) => `<svg viewBox="0 0 44 44"><rect width="44" height="44" rx="12" fill="${col}" opacity=".14"/><path d="M22 8v5M19.8 10.4h4.4M15 30V20l7-5 7 5v10M12 30h20M20 30v-5a2 2 0 0 1 4 0v5" fill="none" stroke="${col}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const week = [["X", 1], ["J", 1], ["V", 1], ["S", 1], ["D", 1], ["L", 1], ["M", 1]];

  // ---------- Las 10 ideas ----------
  const IDEAS = {
    1: { mode: "word", where: "nav", cls: "x-word", html: () => `<div class="rk1"><span class="ic">${bookmark}</span><span class="tx"><b>12 días seguidos</b>leyendo la Palabra</span>
        <span class="wk">${week.map(([d], i) => `<span class="${i === 6 ? "today" : ""}"><i></i>${d}</span>`).join("")}</span></div>` },

    2: { mode: "rosary", where: "ros", html: () => `<div class="rk"><div class="rk-row">${beadRing(50, 12)}<div>
        <p class="k">Tu rosario de días</p><h3>12 de 50 cuentas</h3>
        <p>Cada día que rezas se llena una cuenta. Al completar las 50 empieza un rosario nuevo.</p>
        <p style="margin-top:8px"><b>Rosarios completos: 1</b></p></div></div></div>` },

    3: { mode: "word", where: "nav", html: () => {
        // Noviembre de 2026 empieza en domingo. Color litúrgico de cada día.
        const lit = { 1: "w", 2: "#7a4bb0", 9: "w", 21: "w", 22: "w" }, miss = [3, 10, 11, 17];
        let cells = ["L", "M", "X", "J", "V", "S", "D"].map((d) => `<span class="h">${d}</span>`).join("");
        cells += `<span></span>`.repeat(6);
        for (let d = 1; d <= 30; d++) {
          const c = lit[d] || "#2fb565", fut = d > 24, no = miss.includes(d);
          cells += `<span class="d${fut ? " fut" : ""}${no ? " no" : ""}${d === 24 ? " today" : ""}">${d}<i class="${c === "w" ? "w" : ""}" style="--c:${c}"></i></span>`;
        }
        return `<div class="rk"><p class="k">Noviembre · tu constancia</p><h3>20 días con la Palabra</h3>
          <div class="rk-cal">${cells}</div>
          <div class="rk-legend"><span><i style="--c:#2fb565"></i>Tiempo ordinario</span><span><i class="w"></i>Fiestas (blanco)</span><span><i style="--c:#7a4bb0"></i>Difuntos (morado)</span></div>
          <p style="margin-top:10px">El domingo 29 empieza el Adviento: sus días saldrán en morado.</p></div>`;
      } },

    4: { mode: "word", where: "nav", html: () => `<div class="rk"><p class="k">Hitos</p><h3>Has llegado a una semana</h3>
        <div class="rk-miles">
          <div>${medal(7, true)}7 días<small>Conseguido</small></div>
          <div>${medal(40, false, 12 / 40)}Cuaresma<small>12 de 40</small></div>
          <div>${medal(50, false, 12 / 50)}Pascua<small>12 de 50</small></div>
          <div>${medal(100, false, 12 / 100)}Cien días<small>12 de 100</small></div>
        </div>
        <div class="rk-estampa"><div class="in">
          <svg class="orn" viewBox="0 0 44 22"><path d="M2 11h12M30 11h12" stroke="#c9a227" stroke-width="1" stroke-linecap="round"/><path d="M22 3v16M17 8h10" stroke="#c9a227" stroke-width="1.6" stroke-linecap="round"/><circle cx="16" cy="11" r="1.3" fill="#c9a227"/><circle cx="28" cy="11" r="1.3" fill="#c9a227"/></svg>
          <q>Tarde te amé, hermosura tan antigua y tan nueva, tarde te amé.</q>
          <cite>San Agustín · Confesiones</cite></div></div>
        <div class="rk-btns"><button class="btn-s btn-g">Guardar estampa</button></div></div>` },

    5: { mode: "word", where: "nav", html: () => `<div class="rk"><p class="k">Tu racha</p><h3>12 días seguidos</h3>
        <div class="rk-days">${week.map(([d], i) => `<span class="${i === 6 ? "today" : ""}">${i === 4 ? `<i class="g">${graceI}</i>` : `<i>${check}</i>`}${d}</span>`).join("")}</div>
        <p>El domingo no leíste, pero se usó tu <b>día de gracia</b> y la racha sigue.</p>
        <div class="rk-note">${shield}<span>Tienes un día de gracia cada semana. El próximo estará disponible el lunes.</span></div></div>` },

    6: { mode: "rosary", where: "ros", html: () => {
        const mys = [["Gozosos", 1, "Sábado"], ["Luminosos", 0, "Jueves"], ["Dolorosos", 1, "Hoy"], ["Gloriosos", 1, "Domingo"]];
        return `<div class="rk"><p class="k">Recorrido de la semana</p><h3>3 de 4 misterios</h3>
          <div class="rk-mys">${mys.map(([m, ok, d]) => `<div>${medalM(ok)}${m}<small>${ok ? d : "Falta"}</small></div>`).join("")}</div>
          <p>Reza los <b>luminosos</b> antes del domingo y tendrás la estampa de la semana: <b>Bodas de Caná</b>.</p></div>`;
      } },

    7: { mode: "word", where: "nav", html: () => `<div class="rk"><p class="k">Plan de lectura</p><h3>El Evangelio de Marcos en 16 días</h3>
        <div class="rk-seg">${Array.from({ length: 16 }, (_, i) => `<i class="${i < 5 ? "on" : i === 5 ? "cur" : ""}"></i>`).join("")}</div>
        <div class="rk-segl"><span>Día 6 de 16</span><span>Faltan 11</span></div>
        <div class="rk-today"><p class="k">Hoy · Marcos 6</p><b>Jesús en Nazaret y la multiplicación de los panes</b><p>Unos 12 minutos de lectura.</p></div>
        <button class="btn-s">Leer Marcos 6</button>
        <p class="rk-more">Otros planes: <span>Lucas en 24 días</span> · <span>Hechos en 28 días</span></p></div>` },

    8: { mode: "word", where: "nav", html: () => {
        // Ruta esquemática (no a escala) de Santa Maria del Mar a la Sagrada Família
        const S = [["Santa Maria del Mar", 62, 168, 1, 0, 20, "middle"], ["Catedral", 126, 138, 1, 12, 4, "start"], ["Santa Maria del Pi", 86, 100, 1, 0, -12, "middle"], ["Sant Pere de les Puel·les", 178, 112, 0, 4, -13, "middle"], ["La Concepció", 236, 72, 0, 12, 4, "start"], ["Sagrada Família", 284, 30, 0, -12, 4, "end"]];
        let grid = "";
        for (let x = 150; x < 330; x += 24) for (let y = 6; y < 190; y += 24) if (x + 0.6 * y > 200) grid += `<rect x="${x}" y="${y}" width="18" height="18" rx="5" fill="var(--surface)" opacity=".7"/>`;
        const pts = S.map((s) => s[1] + " " + s[2]);
        const path = "M" + pts.join(" L");
        const done = "M" + pts.slice(0, 3).join(" L") + " L 118 103.6";
        return `<div class="rk"><p class="k">Peregrinación · tramo 3 de 5</p><h3>De Santa Maria del Mar a la Sagrada Família</h3>
          <div class="rk-route"><svg viewBox="0 0 330 196">${grid}
            <path d="M0 186 Q 90 196 180 192 T 330 150 V 196 H 0Z" fill="color-mix(in srgb, #3d82ec 14%, transparent)"/>
            <path d="${path}" fill="none" stroke="var(--faint)" stroke-width="2.5" stroke-dasharray="2 6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="${done}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            ${S.map(([nm, x, y, ok, dx, dy, an], i) => `<circle cx="${x}" cy="${y}" r="${i === 5 ? 7.5 : 6}" fill="${ok ? "var(--accent)" : "var(--bg)"}" stroke="${ok ? "var(--accent)" : "var(--faint)"}" stroke-width="2"/>` +
              `<text class="lbl${ok ? "" : " off"}" x="${x + dx}" y="${y + dy}" text-anchor="${an}">${nm}</text>`).join("")}
            <circle cx="118" cy="103.6" r="7" fill="var(--bg)" stroke="var(--accent-strong)" stroke-width="2.5"/><circle cx="118" cy="103.6" r="2.6" fill="var(--accent-strong)"/>
          </svg></div>
          <p>Llevas <b>12 de 30 días</b>. Próxima parada: <b>Sant Pere de les Puel·les</b>, dentro de 3 días.</p>
          <div class="rk-ficha">${church("#2fb565")}<div><b>Santa Maria del Pi</b><p>Gótico catalán del siglo XIV, con una sola nave muy ancha. Ficha de la parroquia y horarios de misa.</p></div></div></div>`;
      } },

    9: { mode: "word", where: "nav", html: () => {
        const d = [["L", 1, 1], ["M", 1, 1], ["X", 1, 0], ["J", 1, 1], ["V", 1, 1], ["S", 0, 1], ["D", 1, 0]];
        return `<div class="rk"><p class="k">Tu semana · del 16 al 22 de noviembre</p><h3>Rezaste 5 rosarios y leíste 6 evangelios</h3>
          <div class="rk-bars">${d.map(([l, w, r]) => `<span><i class="${w ? "w" : ""}">${w ? book : ""}</i><i class="${r ? "r" : ""}">${r ? crossI : ""}</i>${l}</span>`).join("")}</div>
          <div class="rk-legend"><span><i style="--c:#2fb565"></i>Palabra</span><span><i style="--c:#3d82ec"></i>Rosario</span></div></div>
          <div class="rk"><p class="k">Tu 2026 · se completa el 31 de diciembre</p><h3>Un año de oración</h3>
          <div class="rk-stats"><div><b>214</b>días con la Palabra</div><div><b>96</b>rosarios</div><div><b>31</b>días, tu racha más larga</div><div><b>Gloriosos</b>los misterios que más rezaste</div></div></div>`;
      } },

    10: { mode: "rosary", where: "settings", html: () => `<div class="rk-rem"><div class="top2"><div><b>Recordatorio diario</b><small>Un aviso suave si aún no has rezado</small></div><span class="rk-sw"></span></div>
        <div class="rk-chips"><span class="lab">Hora</span><span>08:00</span><span>13:00</span><span class="on">21:00</span><span>Otra</span></div>
        <div class="rk-chips"><span class="lab">Para</span><span class="on">Rosario</span><span>Palabra</span></div></div>` }
  };
  function medalM(ok) {
    return `<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="23" fill="${ok ? "var(--accent)" : "var(--bg)"}" stroke="${ok ? "var(--accent)" : "var(--faint)"}" stroke-width="1.5" ${ok ? "" : 'stroke-dasharray="3 3"'}/>` +
      (ok ? `<path d="M19 28.5l6 6 12-13" fill="none" stroke="var(--accent-ink)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : `<path d="M28 18v20M21 25h14" stroke="var(--faint)" stroke-width="2.2" stroke-linecap="round"/>`) + `</svg>`;
  }

  const idea = IDEAS[n];
  if (!idea) return;
  function mount() {
    const box = document.createElement("div");
    box.className = "rk-mock";
    box.innerHTML = idea.html();
    if (idea.where === "nav") document.querySelector("#wordcol .daynav").insertAdjacentElement("afterend", box);
    else if (idea.where === "ros") document.querySelector("#rosList .dev-head").insertAdjacentElement("beforeend", box);
    else if (idea.where === "settings") {
      const pop = $("setPop");
      pop.insertAdjacentElement("afterbegin", box);
      const nt = document.createElement("div");
      nt.className = "rk-noti";
      nt.innerHTML = `<img src="icons/s1a/icon-192.png" alt=""><div><b>Misas Barcelona <small>21:00</small></b>Aún estás a tiempo de rezar el rosario de hoy. Llevas 12 días seguidos.</div>`;
      document.body.appendChild(nt);
    }
  }
  mount();
  window.RachaMock = { n, mode: idea.mode, where: idea.where };
})();
