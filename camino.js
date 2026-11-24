/* MAQUETAS (no publicar): «Tu camino» (rachas, hitos con estampa, resumen) y calendario litúrgico.
   Se ven con ?camino=N:
   1 Palabra con la racha pequeña · 2 Rosario con la racha pequeña · 3 Tu camino (arriba)
   4 Tu camino: hitos y estampas · 5 Tu camino: resumen · 6 Calendario al tocar el año litúrgico
   Datos de ejemplo: 24 de noviembre de 2026, racha de 12 días en Palabra y 5 en Rosario. */
(() => {
  const n = +(new URLSearchParams(location.search).get("camino") || 0);
  const A = window.MisasApp;
  if (!n || !A) return;
  const $ = (id) => document.getElementById(id);

  const css = `
  .x-path { --accent: #7a4bb0; --accent-strong: #5f3596; --accent-soft: #efe6fa; --accent-ink: #fff; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .x-path { --accent: #c3a6ea; --accent-strong: #d4bdf2; --accent-soft: #2d2440; --accent-ink: #24133d; } }
  :root[data-theme="dark"] .x-path { --accent: #c3a6ea; --accent-strong: #d4bdf2; --accent-soft: #2d2440; --accent-ink: #24133d; }
  /* Botón de arriba, junto a los interrogantes */
  .cm-top { position: relative; flex: none; width: 40px; height: 40px; border: 0; border-radius: 50%; display: grid; place-items: center; padding: 0; cursor: pointer;
    background: color-mix(in srgb, var(--accent) 18%, var(--chip)); color: var(--accent-strong); font: 800 .9375rem/1 var(--ui); }
  .cm-top svg { width: 22px; height: 22px; }
  .cm-top span { position: absolute; right: -5px; top: -4px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 99px; background: var(--accent); color: var(--accent-ink); font: 800 .6875rem/20px var(--ui); box-shadow: 0 0 0 2px var(--backdrop); }
  /* Racha pequeña dentro de Palabra y Rosario */
  .cm-pill { width: fit-content; display: flex; align-items: center; gap: 8px; margin-top: 14px; padding: 6px 10px 6px 6px; border: 0; border-radius: 999px; background: var(--accent-soft); color: var(--ink); font: 600 .8125rem/1 var(--ui); cursor: pointer; }
  .cm-pill .ic { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: var(--bg); color: var(--accent-strong); }
  .cm-pill .ic svg { width: 16px; height: 16px; }
  .cm-pill b { font-weight: 800; }
  .cm-pill .cm-dots { display: inline-flex; gap: 3px; margin-left: 2px; }
  .cm-pill .cm-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
  .cm-pill .cm-dots i.g { background: none; box-shadow: inset 0 0 0 1.3px var(--accent); }
  .cm-pill .cm-dots i.o { background: var(--line); }
  .cm-pill .chev { color: var(--muted); font-size: 1rem; margin-left: 2px; }
  /* Panel «Tu camino» */
  .cm-panel { position: fixed; inset: 0; z-index: 90; background: var(--bg); color: var(--ink); overflow-y: auto; }
  .cm-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; padding: 14px 18px 10px; background: var(--bg); }
  .cm-head .k { margin: 0; font: 800 .6875rem/1 var(--ui); letter-spacing: .08em; text-transform: uppercase; color: var(--accent-strong); }
  .cm-head h1 { margin: 2px 0 0; font: 400 2.25rem/1.05 var(--display); }
  .cm-head h1 em { color: var(--accent); }
  .cm-x { width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--surface); color: var(--ink); display: grid; place-items: center; }
  .cm-x svg { width: 18px; height: 18px; }
  .cm-road { margin: 0 14px; border-radius: 24px; overflow: hidden; background: var(--accent-soft); }
  .cm-road svg { display: block; width: 100%; height: auto; }
  .cm-road .lb { font: 800 10px var(--ui); fill: var(--accent-strong); letter-spacing: .02em; }
  .cm-road .lb.off { fill: var(--muted); font-weight: 700; }
  .cm-body { padding: 4px 18px 40px; }
  .cm-sec { margin: 24px 0 10px; font: 800 .75rem/1 var(--ui); letter-spacing: .08em; text-transform: uppercase; color: var(--accent-strong); }
  .cm-card { padding: 16px; border-radius: 20px; background: var(--surface); margin-bottom: 10px; }
  .cm-card h3 { margin: 0; font: 600 1.125rem/1.25 var(--display); }
  .cm-card p { margin: 6px 0 0; font: 500 .8125rem/1.45 var(--ui); color: var(--muted); }
  .cm-card p b { color: var(--ink); }
  .cm-sr { display: flex; align-items: center; gap: 12px; }
  .cm-sr .ic { width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-strong); }
  .cm-sr .ic svg { width: 22px; height: 22px; }
  .cm-sr .num { margin-left: auto; text-align: right; font: 500 1.875rem/1 var(--display); color: var(--ink); }
  .cm-sr .num small { display: block; font: 700 .6875rem/1.3 var(--ui); color: var(--muted); }
  .cm-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 14px; text-align: center; }
  .cm-days span { display: flex; flex-direction: column; align-items: center; gap: 5px; font: 700 .6875rem/1 var(--ui); color: var(--muted); }
  .cm-days i { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--accent); color: var(--accent-ink); }
  .cm-days i.g { background: none; color: var(--accent-strong); box-shadow: inset 0 0 0 1.5px var(--accent); }
  .cm-days i.o { background: var(--line); }
  .cm-days .t i { box-shadow: 0 0 0 2px var(--surface), 0 0 0 3.5px var(--accent); }
  .cm-days i svg { width: 14px; height: 14px; }
  .cm-note { display: flex; gap: 10px; align-items: flex-start; margin-top: 4px; padding: 12px 14px; border-radius: 16px; background: var(--accent-soft); font: 500 .8125rem/1.45 var(--ui); color: var(--ink); }
  .cm-note svg { flex: none; width: 18px; height: 18px; color: var(--accent-strong); margin-top: 1px; }
  .cm-miles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 12px; text-align: center; font: 700 .75rem/1.25 var(--ui); }
  .cm-miles small { display: block; font-weight: 600; color: var(--muted); }
  .cm-miles svg { width: 54px; height: 54px; margin: 0 auto 4px; display: block; }
  .cm-stamps { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .cm-st { border-radius: 14px; padding: 7px; background: #fbf6ea; }
  .cm-st .in { height: 100%; min-height: 150px; border: 1px solid #c9a227; border-radius: 8px; padding: 12px 10px; text-align: center; color: #4a3a22; display: flex; flex-direction: column; justify-content: center; gap: 8px; }
  .cm-st q { font: italic 500 .875rem/1.4 var(--read); quotes: "«" "»"; }
  .cm-st cite { font: 800 .5625rem/1.3 var(--ui); letter-spacing: .08em; text-transform: uppercase; font-style: normal; color: #9a7a1c; }
  .cm-st svg { width: 34px; height: 16px; margin: 0 auto; }
  .cm-st.off { background: var(--surface); }
  .cm-st.off .in { border: 1.5px dashed var(--line); color: var(--muted); font: 700 .75rem/1.35 var(--ui); }
  .cm-st.off .in b { display: block; font: 500 1.5rem/1 var(--display); color: var(--faint); margin-bottom: 4px; }
  .cm-bars { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin: 14px 0 6px; text-align: center; }
  .cm-bars span { display: flex; flex-direction: column; align-items: center; gap: 5px; font: 700 .6875rem/1 var(--ui); color: var(--muted); }
  .cm-bars i { width: 24px; height: 24px; border-radius: 8px; display: grid; place-items: center; background: var(--line); }
  .cm-bars i.w { background: #2fb565; } .cm-bars i.r { background: #3d82ec; }
  .cm-bars i svg { width: 14px; height: 14px; color: #fff; }
  .cm-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 10px; font: 600 .75rem/1 var(--ui); color: var(--muted); }
  .cm-legend span { display: inline-flex; align-items: center; gap: 6px; }
  .cm-legend i { width: 9px; height: 9px; border-radius: 50%; background: var(--c); }
  .cm-legend i.w { background: #fff; box-shadow: inset 0 0 0 1.5px #c9a227; }
  .cm-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
  .cm-stats div { padding: 12px; border-radius: 14px; background: var(--bg); font: 600 .75rem/1.3 var(--ui); color: var(--muted); }
  .cm-stats b { display: block; font: 500 1.75rem/1.1 var(--display); color: var(--ink); }
  /* Calendario que se abre desde el año litúrgico */
  .cm-dim { position: fixed; inset: 0; z-index: 85; background: rgba(20,12,14,.42); }
  .cm-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 90; padding: 26px 18px 30px; border-radius: 26px 26px 0 0; background: var(--bg); color: var(--ink); box-shadow: 0 -12px 40px rgba(0,0,0,.25); }
  .cm-sheet::before { content: ""; position: absolute; top: 9px; left: 50%; width: 42px; height: 5px; margin-left: -21px; border-radius: 9px; background: var(--line); }
  .cm-sheet .hd { display: flex; align-items: center; justify-content: space-between; }
  .cm-sheet .hd p { margin: 0; font: 800 .6875rem/1 var(--ui); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .cm-sheet .hd h2 { margin: 4px 0 0; font: 400 1.875rem/1.1 var(--display); }
  .cm-sheet .nav { display: flex; gap: 6px; }
  .cm-sheet .nav span { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: var(--surface); font: 700 1.125rem/1 var(--ui); }
  .cm-cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-top: 14px; text-align: center; }
  .cm-cal .h { font: 800 .6875rem/1 var(--ui); color: var(--faint); padding-bottom: 6px; }
  .cm-cal .d { position: relative; height: 46px; display: flex; flex-direction: column; align-items: center; gap: 5px; padding-top: 6px; font: 600 .875rem/1 var(--ui); color: var(--ink); }
  .cm-cal .d i { width: 10px; height: 10px; border-radius: 50%; background: var(--c); }
  .cm-cal .d i.w { background: #fff; box-shadow: inset 0 0 0 1.5px #c9a227; }
  .cm-cal .d.sun { font-weight: 800; }
  .cm-cal .d.today::before { content: ""; position: absolute; inset: 0 4px; border-radius: 14px; box-shadow: inset 0 0 0 2px #2fb565; }
  .cm-cal .d.past { color: var(--muted); }
  .cm-cal .d.read::after { content: ""; position: absolute; bottom: 3px; width: 14px; height: 2px; border-radius: 2px; background: var(--faint); }
  .cm-sheet .foot { margin-top: 12px; padding: 12px 14px; border-radius: 16px; background: var(--surface); font: 500 .8125rem/1.45 var(--ui); color: var(--muted); }
  .cm-sheet .foot b { color: var(--ink); }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- Dibujos ----------
  const roadIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.6 4.5 4.5 19.5M14.4 4.5l5.1 15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M12 6.5v2.2M12 11.4v2.6M12 16.9v2.6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`;
  const check = `<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const graceI = `<svg viewBox="0 0 16 16"><path d="M8 2.2l4.6 1.8v3.6c0 3-2 5.2-4.6 6.5C5.4 12.8 3.4 10.6 3.4 7.6V4L8 2.2Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  const shield = `<svg viewBox="0 0 20 20"><path d="M10 2.2l6 2.3v4.7c0 4-2.7 6.9-6 8.6-3.3-1.7-6-4.6-6-8.6V4.5l6-2.3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.2 10l2 2 3.8-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const bookI = `<svg viewBox="0 0 24 24"><path d="M12 6.6C10.2 5.2 7.6 4.6 4.5 4.6v12.8c3.1 0 5.7.6 7.5 2 1.8-1.4 4.4-2 7.5-2V4.6c-3.1 0-5.7.6-7.5 2zM12 6.6v12.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`;
  const rosI = `<svg viewBox="0 0 24 24"><g fill="currentColor"><circle cx="12" cy="3.4" r="1.3"/><circle cx="16.3" cy="5" r="1.3"/><circle cx="18" cy="9.2" r="1.3"/><circle cx="16.3" cy="13.4" r="1.3"/><circle cx="7.7" cy="5" r="1.3"/><circle cx="6" cy="9.2" r="1.3"/><circle cx="7.7" cy="13.4" r="1.3"/><circle cx="12" cy="15.2" r="1.6"/></g><path d="M12 17v5M10 19h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  const book = `<svg viewBox="0 0 16 16"><path d="M8 4.2C6.6 3 4.6 2.8 2.5 3.2v8.6c2.1-.4 4.1-.2 5.5 1 1.4-1.2 3.4-1.4 5.5-1V3.2C11.4 2.8 9.4 3 8 4.2Zm0 0v8.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  const crossI = `<svg viewBox="0 0 16 16"><path d="M8 2.5v11M4.5 6h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  const xI = `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  const orn = `<svg viewBox="0 0 44 22"><path d="M2 11h12M30 11h12" stroke="#c9a227" stroke-width="1" stroke-linecap="round"/><path d="M22 3v16M17 8h10" stroke="#c9a227" stroke-width="1.6" stroke-linecap="round"/><circle cx="16" cy="11" r="1.3" fill="#c9a227"/><circle cx="28" cy="11" r="1.3" fill="#c9a227"/></svg>`;

  function medal(num, done, part, col) {
    const R = 22, L = 2 * Math.PI * R;
    return `<svg viewBox="0 0 54 54"><circle cx="27" cy="27" r="${R}" fill="${done ? col : "var(--bg)"}" stroke="var(--line)" stroke-width="3"/>` +
      (!done && part ? `<circle cx="27" cy="27" r="${R}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${(L * part).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 27 27)"/>` : "") +
      `<text x="27" y="33" text-anchor="middle" style="font:500 ${num > 99 ? 15 : 18}px var(--display);fill:${done ? "#fff" : "var(--muted)"}">${num}</text></svg>`;
  }

  // Camino que se pierde hacia el fondo, con los hitos a lo largo
  function road() {
    const W = 360, H = 230, hy = 52; // horizonte
    // Centro del camino según la profundidad t (0 = cerca, 1 = horizonte), con una curva suave
    const cx = (t) => 172 + 40 * Math.sin(t * 3.2) * (1 - t * 0.4);
    const y = (t) => H - (H - hy) * (1 - Math.pow(1 - t, 1.8));
    const half = (t) => 110 * (1 - t) + 3;
    let L = [], R = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40; L.push([cx(t) - half(t), y(t)]); R.push([cx(t) + half(t), y(t)]); }
    const poly = [...L, ...R.reverse()].map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
    let dash = "";
    for (let i = 0; i < 18; i++) { const t1 = i / 18, t2 = t1 + 0.022; if (t1 > 0.94) break; dash += `M${cx(t1).toFixed(1)} ${y(t1).toFixed(1)} L${cx(t2).toFixed(1)} ${y(t2).toFixed(1)} `; }
    const hills = `<path d="M0 ${hy + 8} Q 60 ${hy - 18} 120 ${hy + 2} T 240 ${hy - 4} T 360 ${hy + 6} V ${H} H 0Z" fill="color-mix(in srgb, var(--accent) 16%, var(--bg))"/>` +
      `<path d="M0 ${hy + 30} Q 90 ${hy + 6} 180 ${hy + 26} T 360 ${hy + 22} V ${H} H 0Z" fill="color-mix(in srgb, var(--accent) 8%, var(--bg))"/>`;
    const miles = [[0.08, "Hoy · 12 días", 1, 1], [0.27, "7 días", 1, 0], [0.5, "40 días", 0, 0], [0.7, "50 días", 0, 0], [0.86, "100 días", 0, 0]];
    let m = "";
    miles.forEach(([t, lb, ok, me], i) => {
      const x = cx(t), yy = y(t), s = 1 - t * 0.75, side = i % 2 ? 1 : -1;
      const px = x + side * (half(t) + 8 * s), r = 9 * s + 2;
      if (me) {
        m += `<circle cx="${x}" cy="${yy}" r="${11}" fill="var(--bg)" stroke="var(--accent-strong)" stroke-width="3"/><circle cx="${x}" cy="${yy}" r="4" fill="var(--accent-strong)"/>` +
          `<text class="lb" x="${x + 18}" y="${yy + 4}">${lb}</text>`;
      } else {
        m += `<path d="M${px} ${yy} v${-26 * s}" stroke="${ok ? "var(--accent-strong)" : "var(--faint)"}" stroke-width="${1.6}" />` +
          `<circle cx="${px}" cy="${yy - 26 * s - r}" r="${r}" fill="${ok ? "var(--accent)" : "var(--bg)"}" stroke="${ok ? "var(--accent)" : "var(--faint)"}" stroke-width="1.5"/>` +
          (ok ? `<path d="M${px - r * .45} ${yy - 26 * s - r} l${r * .3} ${r * .32} l${r * .55} ${-r * .6}" fill="none" stroke="var(--accent-ink)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` : "") +
          `<text class="lb${ok ? "" : " off"}" x="${px + side * (r + 5)}" y="${yy - 26 * s - r + 3.5}" text-anchor="${side > 0 ? "start" : "end"}" style="font-size:${(10.5 * s + 2).toFixed(1)}px">${lb}</text>`;
      }
    });
    return `<svg viewBox="0 0 ${W} ${H}">${hills}<path d="M${poly}Z" fill="var(--bg)"/><path d="${dash}" stroke="color-mix(in srgb, var(--accent) 55%, transparent)" stroke-width="2.5" stroke-linecap="round"/>${m}</svg>`;
  }

  const strip = (cells) => `<div class="cm-days">${cells.map(([d, k], i) => `<span class="${i === 6 ? "t" : ""}"><i class="${k}">${k === "g" ? graceI : k === "o" ? "" : check}</i>${d}</span>`).join("")}</div>`;

  function panel() {
    const box = document.createElement("div");
    box.className = "cm-panel x-path";
    box.innerHTML = `<header class="cm-head"><div><p class="k">Palabra y Rosario</p><h1>Tu <em>camino</em></h1></div><button class="cm-x" aria-label="Cerrar">${xI}</button></header>
      <div class="cm-road">${road()}</div>
      <div class="cm-body">
        <p class="cm-sec">Rachas</p>
        <div class="cm-card x-word"><div class="cm-sr"><span class="ic">${bookI}</span><div><h3>Palabra del día</h3><p style="margin-top:2px">Tu mejor racha: 31 días</p></div><span class="num">12<small>días seguidos</small></span></div>
          ${strip([["X", ""], ["J", ""], ["V", ""], ["S", ""], ["D", "g"], ["L", ""], ["M", ""]])}</div>
        <div class="cm-card x-ros"><div class="cm-sr"><span class="ic">${rosI}</span><div><h3>Rosario</h3><p style="margin-top:2px">Tu mejor racha: 18 días</p></div><span class="num">5<small>días seguidos</small></span></div>
          ${strip([["X", "o"], ["J", "o"], ["V", ""], ["S", ""], ["D", ""], ["L", ""], ["M", ""]])}</div>
        <div class="cm-note">${shield}<span>El domingo no leíste la Palabra, pero se usó tu <b>día de gracia</b> y la racha sigue. Tienes uno cada semana; el próximo, a partir del lunes.</span></div>

        <p class="cm-sec">Hitos y estampas</p>
        <div class="cm-card x-word"><h3>Palabra</h3>
          <div class="cm-miles"><div>${medal(7, true, 0, "#2fb565")}7 días<small>Conseguido</small></div><div>${medal(40, false, 12 / 40, "#2fb565")}40 días<small>12 de 40</small></div><div>${medal(50, false, 12 / 50, "#2fb565")}50 días<small>12 de 50</small></div><div>${medal(100, false, .12, "#2fb565")}100 días<small>12 de 100</small></div></div></div>
        <div class="cm-card x-ros"><h3>Rosario</h3>
          <div class="cm-miles"><div>${medal(7, true, 0, "#3d82ec")}7 días<small>Conseguido</small></div><div>${medal(40, false, 5 / 40, "#3d82ec")}40 días<small>5 de 40</small></div><div>${medal(50, false, .1, "#3d82ec")}50 días<small>5 de 50</small></div><div>${medal(100, false, .05, "#3d82ec")}100 días<small>5 de 100</small></div></div></div>
        <p class="cm-card" style="margin:0 0 10px;padding:12px 16px;background:none;box-shadow:inset 0 0 0 1px var(--line)"><span style="font:600 .8125rem/1.45 var(--ui);color:var(--muted)">Tus estampas <b style="color:var(--ink)">(2 de 8)</b>. Toca una para verla en grande o guardarla.</span></p>
        <div class="cm-stamps">
          <div class="cm-st"><div class="in">${orn}<q>Tarde te amé, hermosura tan antigua y tan nueva.</q><cite>San Agustín · Palabra, 7 días</cite></div></div>
          <div class="cm-st"><div class="in">${orn}<q>El Rosario es mi oración predilecta.</q><cite>San Juan Pablo II · Rosario, 7 días</cite></div></div>
          <div class="cm-st off"><div class="in"><b>40</b>Palabra<br>Faltan 28 días</div></div>
          <div class="cm-st off"><div class="in"><b>40</b>Rosario<br>Faltan 35 días</div></div>
        </div>

        <p class="cm-sec">Tu semana · del 16 al 22 de noviembre</p>
        <div class="cm-card"><h3>Rezaste 5 rosarios y leíste 6 evangelios</h3>
          <div class="cm-bars">${[["L", 1, 1], ["M", 1, 1], ["X", 1, 0], ["J", 1, 1], ["V", 1, 1], ["S", 0, 1], ["D", 1, 0]].map(([l, w, r]) => `<span><i class="${w ? "w" : ""}">${w ? book : ""}</i><i class="${r ? "r" : ""}">${r ? crossI : ""}</i>${l}</span>`).join("")}</div>
          <div class="cm-legend"><span><i style="--c:#2fb565"></i>Palabra</span><span><i style="--c:#3d82ec"></i>Rosario</span></div></div>
        <p class="cm-sec">Tu año 2026</p>
        <div class="cm-card"><h3>Un año de oración</h3><p>Se completa el 31 de diciembre.</p>
          <div class="cm-stats"><div><b>214</b>días con la Palabra</div><div><b>96</b>rosarios</div><div><b>31</b>días, tu racha más larga</div><div><b>Gloriosos</b>los misterios que más rezaste</div></div></div>
      </div>`;
    document.body.appendChild(box);
    return box;
  }

  function pill(where, kind, txt, dots) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "cm-pill " + kind;
    b.innerHTML = `<span class="ic">${roadIcon}</span><span><b>${txt}</b></span><span class="cm-dots">${dots.map((d) => `<i class="${d}"></i>`).join("")}</span><span class="chev">›</span>`;
    where.insertAdjacentElement("afterend", b);
  }

  function calendar() {
    const col = { 1: "w", 2: "v", 4: "w", 9: "w", 10: "w", 11: "w", 12: "r", 17: "w", 21: "w", 22: "w", 24: "r", 29: "v", 30: "r" };
    const C = { g: "#2fb565", w: "w", r: "#d63b3b", v: "#7a4bb0" };
    const read = [1, 2, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23, 24];
    let cells = ["L", "M", "X", "J", "V", "S", "D"].map((d) => `<span class="h">${d}</span>`).join("") + `<span></span>`.repeat(6);
    for (let d = 1; d <= 30; d++) {
      const c = C[col[d] || "g"], sun = (d + 6) % 7 === 0;
      cells += `<span class="d${sun ? " sun" : ""}${d < 24 ? " past" : ""}${d === 24 ? " today" : ""}">${d}<i class="${c === "w" ? "w" : ""}" style="--c:${c}"></i></span>`;
    }
    const dim = document.createElement("div"); dim.className = "cm-dim"; document.body.appendChild(dim);
    const sh = document.createElement("div"); sh.className = "cm-sheet";
    sh.innerHTML = `<div class="hd"><div><p>Año litúrgico</p><h2>Noviembre</h2></div><div class="nav"><span>‹</span><span>›</span></div></div>
      <div class="cm-cal">${cells}</div>
      <div class="cm-legend"><span><i style="--c:#2fb565"></i>Verde</span><span><i class="w"></i>Blanco</span><span><i style="--c:#d63b3b"></i>Rojo</span><span><i style="--c:#7a4bb0"></i>Morado</span></div>
      <div class="foot">Cada día lleva el color litúrgico que le toca. Toca un día para ver sus lecturas. <b>El domingo 29 empieza el Adviento.</b></div>`;
    document.body.appendChild(sh);
  }

  function mount() {
    // Botón de «Tu camino» arriba, junto a los interrogantes
    const faq = document.querySelector(".top .x-faq");
    const top = document.createElement("button");
    top.type = "button"; top.className = "cm-top x-path"; top.setAttribute("aria-label", "Tu camino");
    top.innerHTML = `${roadIcon}<span>12</span>`;
    faq.insertAdjacentElement("beforebegin", top);
    if (n === 1 || n === 6) pill(document.querySelector("#wordcol .daynav"), "x-word", "12 días seguidos", ["", "", "", "", "g", "", ""]);
    if (n === 2) pill(document.querySelector("#rosList .ros-tools"), "x-ros", "5 días seguidos", ["o", "o", "", "", "", "", ""]);
    if (n >= 3 && n <= 5) panel();
    if (n === 6) calendar();
  }
  mount();
  window.CaminoMock = { n, mode: n === 2 ? "rosary" : "word" };
})();
