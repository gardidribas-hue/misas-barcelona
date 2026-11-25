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
  .cm-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; padding: 26px 22px 18px; background: var(--bg); }
  .cm-head .k { margin: 0; font: 800 .6875rem/1 var(--ui); letter-spacing: .08em; text-transform: uppercase; color: var(--accent-strong); }
  .cm-head h1 { margin: 0; font: 400 2.5rem/1.05 var(--display); }
  .cm-head h1 em { color: var(--accent); }
  .cm-x { width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--surface); color: var(--ink); display: grid; place-items: center; }
  .cm-x svg { width: 18px; height: 18px; }
  .cm-road { margin: 6px 14px 0; border-radius: 26px; overflow: hidden; background: var(--rd-sky2);
    --rd-sky1: #f7f2fd; --rd-sky2: #ece2f8; --rd-h1: #e2d4f4; --rd-h2: #d1bbee; --rd-h3: #bd9fe3; --rd-h4: #a682d4; --rd-road: #3b2160; --rd-line: #f5c542; --rd-mk: #8f7aae; --rd-mkt: #5f3596; --rd-tr2: #bea2e4; --rd-tr3: #a585d4; --rd-tr4: #8c66c2; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .cm-road { --rd-sky1: #1c1629; --rd-sky2: #261e38; --rd-h1: #2e2444; --rd-h2: #382c52; --rd-h3: #433461; --rd-h4: #4f3e71; --rd-road: #120c1c; --rd-line: #e9c96e; --rd-mk: #9d8cb8; --rd-mkt: #d4bdf2; --rd-tr2: #43355f; --rd-tr3: #4f3e70; --rd-tr4: #5d4a82; } }
  :root[data-theme="dark"] .cm-road { --rd-sky1: #1c1629; --rd-sky2: #261e38; --rd-h1: #2e2444; --rd-h2: #382c52; --rd-h3: #433461; --rd-h4: #4f3e71; --rd-road: #120c1c; --rd-line: #e9c96e; --rd-mk: #9d8cb8; --rd-mkt: #d4bdf2; --rd-tr2: #43355f; --rd-tr3: #4f3e70; --rd-tr4: #5d4a82; }
  .cm-road svg { display: block; width: 100%; height: auto; }
  .cm-road .lb { font: 800 10px var(--ui); fill: var(--accent-strong); letter-spacing: .02em; paint-order: stroke; stroke: var(--rd-sky); stroke-width: 3px; stroke-linejoin: round; }
  .cm-road text[text-anchor="middle"] { stroke: none; }
  .cm-road .lb.off { fill: var(--muted); font-weight: 700; }
  .cm-body { padding: 8px 20px 48px; }
  .cm-sec { margin: 32px 0 12px; font: 800 .75rem/1 var(--ui); letter-spacing: .08em; text-transform: uppercase; color: var(--accent-strong); }
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
  .cm-days i svg { width: 24px; height: 24px; } .cm-days i.g { --sh-bg: var(--surface); } .cm-days i.g svg { width: 15px; height: 15px; }
  .cm-note { display: flex; gap: 10px; align-items: flex-start; margin-top: 4px; padding: 12px 14px; border-radius: 16px; background: var(--accent-soft); font: 500 .8125rem/1.45 var(--ui); color: var(--ink); }
  .cm-note { --sh-bg: var(--accent-soft); } .cm-note svg { flex: none; width: 30px; height: 30px; color: var(--accent-strong); margin-top: 1px; }
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

  /* Tu año mes a mes */
  .cm-chart { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; align-items: end; height: 132px; margin-top: 14px; }
  .cm-chart span { display: flex; flex-direction: column; justify-content: flex-end; align-items: center; height: 100%; gap: 2px; font: 700 .625rem/1 var(--ui); color: var(--muted); border-radius: 8px; padding: 0 0 4px; }
  .cm-chart span.on { background: var(--bg); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--accent); }
  .cm-chart i { width: 62%; border-radius: 3px; }
  .cm-chart i.w { background: #2fb565; } .cm-chart i.r { background: #3d82ec; }
  .cm-chart em { font-style: normal; margin-top: 3px; }
  .cm-chart span.fut em { color: var(--faint); }
  .cm-month { margin-top: 12px; padding: 12px 14px; border-radius: 16px; background: var(--bg); }
  .cm-month .mh { display: flex; align-items: center; justify-content: space-between; }
  .cm-month .mh b { font: 600 1.25rem/1.2 var(--display); }
  .cm-month .mh small { display: block; font: 800 .625rem/1.2 var(--ui); letter-spacing: .08em; text-transform: uppercase; color: var(--accent-strong); }
  .cm-month .arr { display: flex; gap: 6px; }
  .cm-month .arr span { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--surface); font: 700 1rem/1 var(--ui); color: var(--ink); }
  .cm-month .row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 10px; font: 600 .6875rem/1.3 var(--ui); color: var(--muted); }
  .cm-month .row b { display: block; font: 500 1.5rem/1.1 var(--display); color: var(--ink); }
  .cm-best { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .cm-best li { display: grid; grid-template-columns: 38px 1fr auto; gap: 12px; align-items: center; padding: 10px 12px; border-radius: 14px; background: var(--bg); font: 600 .8125rem/1.3 var(--ui); color: var(--muted); }
  .cm-best li .ic { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: #fff; }
  .cm-best li .ic svg { width: 20px; height: 20px; }
  .cm-best li b { display: block; font: 600 1.0625rem/1.2 var(--display); color: var(--ink); }
  .cm-best li .v { font: 500 1.375rem/1 var(--display); color: var(--ink); text-align: right; }
  .cm-best li .v small { display: block; font: 700 .625rem/1.3 var(--ui); color: var(--muted); }
  .cm-best li.top { box-shadow: inset 0 0 0 1.5px var(--accent); }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- Dibujos ----------
  // Icono elegido por Guillem: el primer camino (dos bordes que se juntan y la línea discontinua). ?icono=1, 2 o 3 muestran las otras pruebas
  const ICONS = {"0":"<path d=\"M9.6 4.5 4.5 19.5M14.4 4.5l5.1 15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\"/><path d=\"M12 6.5v2.2M12 11.4v2.6M12 16.9v2.6\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\"/>","1":"<path d=\"M6.01 24.05L6.18 23.58L6.39 23.06L6.61 22.57L6.83 22.11L7.06 21.67L7.28 21.25L7.49 20.86L7.69 20.5L7.89 20.15L8.07 19.84L8.23 19.54L8.38 19.28L8.51 19.05L8.62 18.84L8.72 18.68L8.8 18.57L8.87 18.51L8.93 18.43L8.98 18.28L9.01 18.09L9.01 17.84L8.98 17.54L8.93 17.2L8.86 16.83L8.77 16.43L8.68 16L8.57 15.53L8.47 15.03L8.38 14.5L8.31 13.93L8.28 13.32L8.3 12.69L8.38 12.09L8.5 11.54L8.66 11.04L8.84 10.58L9.04 10.15L9.24 9.77L9.44 9.42L9.64 9.1L9.83 8.81L10 8.54L10.17 8.3L10.31 8.08L10.44 7.88L10.55 7.71L10.63 7.57L10.71 7.42L10.77 7.24L10.83 7.04L10.88 6.83L10.92 6.61L10.95 6.38L10.97 6.14L10.99 5.9L10.99 5.64L10.99 5.38L10.98 5.11L10.96 4.83L10.95 4.55L10.92 4.26L10.9 3.96L10.88 3.66L10.86 3.37M15.99 26.95L16.07 26.56L16.13 26.2L16.2 25.82L16.28 25.4L16.37 24.96L16.47 24.49L16.56 24L16.66 23.49L16.75 22.96L16.83 22.41L16.91 21.84L16.98 21.24L17.02 20.63L17.05 19.99L17.04 19.34L17 18.63L16.9 17.89L16.74 17.17L16.54 16.53L16.3 15.94L16.05 15.41L15.8 14.94L15.55 14.51L15.3 14.13L15.07 13.78L14.86 13.48L14.67 13.21L14.51 12.98L14.37 12.8L14.26 12.66L14.17 12.57L14.1 12.51L14.03 12.43L13.98 12.31L13.94 12.15L13.92 11.96L13.92 11.73L13.93 11.48L13.97 11.2L14.03 10.9L14.09 10.58L14.17 10.23L14.25 9.87L14.32 9.49L14.4 9.09L14.45 8.67L14.49 8.22L14.49 7.78L14.46 7.37L14.41 7L14.34 6.65L14.26 6.3L14.17 5.98L14.07 5.67L13.97 5.37L13.86 5.08L13.75 4.8L13.65 4.54L13.55 4.28L13.45 4.02L13.36 3.77L13.27 3.53L13.2 3.29L13.14 3.03\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>","2":"<path d=\"M6.01 24.05L6.18 23.58L6.39 23.06L6.61 22.57L6.83 22.11L7.06 21.67L7.28 21.25L7.49 20.86L7.69 20.5L7.89 20.15L8.07 19.84L8.23 19.54L8.38 19.28L8.51 19.05L8.62 18.84L8.72 18.68L8.8 18.57L8.87 18.51L8.93 18.43L8.98 18.28L9.01 18.09L9.01 17.84L8.98 17.54L8.93 17.2L8.86 16.83L8.77 16.43L8.68 16L8.57 15.53L8.47 15.03L8.38 14.5L8.31 13.93L8.28 13.32L8.3 12.69L8.38 12.09L8.5 11.54L8.66 11.04L8.84 10.58L9.04 10.15L9.24 9.77L9.44 9.42L9.64 9.1L9.83 8.81L10 8.54L10.17 8.3L10.31 8.08L10.44 7.88L10.55 7.71L10.63 7.57L10.71 7.42L10.77 7.24L10.83 7.04L10.88 6.83L10.92 6.61L10.95 6.38L10.97 6.14L10.99 5.9L10.99 5.64L10.99 5.38L10.98 5.11L10.96 4.83L10.95 4.55L10.92 4.26L10.9 3.96L10.88 3.66L10.86 3.37L13.14 3.03L13.2 3.29L13.27 3.53L13.36 3.77L13.45 4.02L13.55 4.28L13.65 4.54L13.75 4.8L13.86 5.08L13.97 5.37L14.07 5.67L14.17 5.98L14.26 6.3L14.34 6.65L14.41 7L14.46 7.37L14.49 7.78L14.49 8.22L14.45 8.67L14.4 9.09L14.32 9.49L14.25 9.87L14.17 10.23L14.09 10.58L14.03 10.9L13.97 11.2L13.93 11.48L13.92 11.73L13.92 11.96L13.94 12.15L13.98 12.31L14.03 12.43L14.1 12.51L14.17 12.57L14.26 12.66L14.37 12.8L14.51 12.98L14.67 13.21L14.86 13.48L15.07 13.78L15.3 14.13L15.55 14.51L15.8 14.94L16.05 15.41L16.3 15.94L16.54 16.53L16.74 17.17L16.9 17.89L17 18.63L17.04 19.34L17.05 19.99L17.02 20.63L16.98 21.24L16.91 21.84L16.83 22.41L16.75 22.96L16.66 23.49L16.56 24L16.47 24.49L16.37 24.96L16.28 25.4L16.2 25.82L16.13 26.2L16.07 26.56L15.99 26.95Z\" fill=\"currentColor\" opacity=\".28\"/><path d=\"M6.01 24.05L6.18 23.58L6.39 23.06L6.61 22.57L6.83 22.11L7.06 21.67L7.28 21.25L7.49 20.86L7.69 20.5L7.89 20.15L8.07 19.84L8.23 19.54L8.38 19.28L8.51 19.05L8.62 18.84L8.72 18.68L8.8 18.57L8.87 18.51L8.93 18.43L8.98 18.28L9.01 18.09L9.01 17.84L8.98 17.54L8.93 17.2L8.86 16.83L8.77 16.43L8.68 16L8.57 15.53L8.47 15.03L8.38 14.5L8.31 13.93L8.28 13.32L8.3 12.69L8.38 12.09L8.5 11.54L8.66 11.04L8.84 10.58L9.04 10.15L9.24 9.77L9.44 9.42L9.64 9.1L9.83 8.81L10 8.54L10.17 8.3L10.31 8.08L10.44 7.88L10.55 7.71L10.63 7.57L10.71 7.42L10.77 7.24L10.83 7.04L10.88 6.83L10.92 6.61L10.95 6.38L10.97 6.14L10.99 5.9L10.99 5.64L10.99 5.38L10.98 5.11L10.96 4.83L10.95 4.55L10.92 4.26L10.9 3.96L10.88 3.66L10.86 3.37M15.99 26.95L16.07 26.56L16.13 26.2L16.2 25.82L16.28 25.4L16.37 24.96L16.47 24.49L16.56 24L16.66 23.49L16.75 22.96L16.83 22.41L16.91 21.84L16.98 21.24L17.02 20.63L17.05 19.99L17.04 19.34L17 18.63L16.9 17.89L16.74 17.17L16.54 16.53L16.3 15.94L16.05 15.41L15.8 14.94L15.55 14.51L15.3 14.13L15.07 13.78L14.86 13.48L14.67 13.21L14.51 12.98L14.37 12.8L14.26 12.66L14.17 12.57L14.1 12.51L14.03 12.43L13.98 12.31L13.94 12.15L13.92 11.96L13.92 11.73L13.93 11.48L13.97 11.2L14.03 10.9L14.09 10.58L14.17 10.23L14.25 9.87L14.32 9.49L14.4 9.09L14.45 8.67L14.49 8.22L14.49 7.78L14.46 7.37L14.41 7L14.34 6.65L14.26 6.3L14.17 5.98L14.07 5.67L13.97 5.37L13.86 5.08L13.75 4.8L13.65 4.54L13.55 4.28L13.45 4.02L13.36 3.77L13.27 3.53L13.2 3.29L13.14 3.03\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>","3":"<path d=\"M6.01 24.05L6.18 23.58L6.39 23.06L6.61 22.57L6.83 22.11L7.06 21.67L7.28 21.25L7.49 20.86L7.69 20.5L7.89 20.15L8.07 19.84L8.23 19.54L8.38 19.28L8.51 19.05L8.62 18.84L8.72 18.68L8.8 18.57L8.87 18.51L8.93 18.43L8.98 18.28L9.01 18.09L9.01 17.84L8.98 17.54L8.93 17.2L8.86 16.83L8.77 16.43L8.68 16L8.57 15.53L8.47 15.03L8.38 14.5L8.31 13.93L8.28 13.32L8.3 12.69L8.38 12.09L8.5 11.54L8.66 11.04L8.84 10.58L9.04 10.15L9.24 9.77L9.44 9.42L9.64 9.1L9.83 8.81L10 8.54L10.17 8.3L10.31 8.08L10.44 7.88L10.55 7.71L10.63 7.57L10.71 7.42L10.77 7.24L10.83 7.04L10.88 6.83L10.92 6.61L10.95 6.38L10.97 6.14L10.99 5.9L10.99 5.64L10.99 5.38L10.98 5.11L10.96 4.83L10.95 4.55L10.92 4.26L10.9 3.96L10.88 3.66L10.86 3.37L13.14 3.03L13.2 3.29L13.27 3.53L13.36 3.77L13.45 4.02L13.55 4.28L13.65 4.54L13.75 4.8L13.86 5.08L13.97 5.37L14.07 5.67L14.17 5.98L14.26 6.3L14.34 6.65L14.41 7L14.46 7.37L14.49 7.78L14.49 8.22L14.45 8.67L14.4 9.09L14.32 9.49L14.25 9.87L14.17 10.23L14.09 10.58L14.03 10.9L13.97 11.2L13.93 11.48L13.92 11.73L13.92 11.96L13.94 12.15L13.98 12.31L14.03 12.43L14.1 12.51L14.17 12.57L14.26 12.66L14.37 12.8L14.51 12.98L14.67 13.21L14.86 13.48L15.07 13.78L15.3 14.13L15.55 14.51L15.8 14.94L16.05 15.41L16.3 15.94L16.54 16.53L16.74 17.17L16.9 17.89L17 18.63L17.04 19.34L17.05 19.99L17.02 20.63L16.98 21.24L16.91 21.84L16.83 22.41L16.75 22.96L16.66 23.49L16.56 24L16.47 24.49L16.37 24.96L16.28 25.4L16.2 25.82L16.13 26.2L16.07 26.56L15.99 26.95Z\" fill=\"currentColor\"/><path d=\"M11 25.5L11.13 25.07L11.26 24.63L11.41 24.19L11.56 23.75L11.71 23.31L11.87 22.87L12.03 22.43L12.18 21.99L12.32 21.56L12.45 21.12L12.57 20.69L12.68 20.26L12.77 19.84L12.83 19.42L12.88 19.01L12.9 18.6L12.89 18.2L12.84 17.8L12.76 17.41L12.66 17.01L12.53 16.62L12.39 16.24L12.24 15.86L12.08 15.48L11.92 15.11L11.77 14.74L11.62 14.37L11.49 14.01L11.38 13.65L11.29 13.3L11.23 12.95L11.2 12.6L11.21 12.26L11.24 11.92L11.3 11.59L11.38 11.27L11.48 10.94L11.59 10.63L11.71 10.31L11.83 10L11.96 9.69L12.09 9.39L12.21 9.08L12.32 8.78L12.42 8.49L12.5 8.19L12.56 7.89L12.6 7.6L12.62 7.31L12.62 7.02L12.61 6.74L12.59 6.46L12.56 6.18L12.52 5.91L12.48 5.63L12.43 5.36L12.37 5.09L12.31 4.82\" fill=\"none\" stroke=\"var(--road-dash, #fff)\" stroke-width=\".9\" stroke-linecap=\"round\" stroke-dasharray=\"1.4 1.8\"/>"};
  const iconN = +(new URLSearchParams(location.search).get("icono") || 0);
  let uid = 0;
  const roadIcon = () => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[iconN].replace(/\b(c|m)(a|b)\b/g, (x) => x + "-" + uid).replace(/#(c|m)(a|b)\)/g, (x, p, q) => "#" + p + q + "-" + uid + ")")}</svg>`.replace(/^/, () => (uid++, ""));
  const check = `<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const graceI = `<svg viewBox="0 -0.2 20 20"><path d="M10 1.8l6.4 2.3v4.8c0 4.2-2.9 7.1-6.4 8.9-3.5-1.8-6.4-4.7-6.4-8.9V4.1L10 1.8Z" fill="var(--sh-bg, var(--bg))" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="10" cy="4.6" r=".85" fill="currentColor"/><path d="M10 5.4v1.9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M6.7 7.6h6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9.25 8.3h1.5v5.3L10 15.3l-.75-1.7Z" fill="currentColor"/></svg>`;
  const shield = `<svg viewBox="0 -0.2 20 20"><path d="M10 1.8l6.4 2.3v4.8c0 4.2-2.9 7.1-6.4 8.9-3.5-1.8-6.4-4.7-6.4-8.9V4.1L10 1.8Z" fill="var(--sh-bg, var(--bg))" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="10" cy="4.6" r=".85" fill="currentColor"/><path d="M10 5.4v1.9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M6.7 7.6h6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9.25 8.3h1.5v5.3L10 15.3l-.75-1.7Z" fill="currentColor"/></svg>`;
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

  // Dibujo de «Tu camino»: colinas por capas; el camino aparece en cada colina y se esconde tras la siguiente.
  function road() {
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
    body += mk(170, 124, 11, "40") + mk(212, 96, 8, "50") + mk(200, 68, 6, "100");
    // Hoy, sobre el tramo más cercano
    body += `<circle cx="203" cy="176" r="12" fill="var(--bg)" stroke="var(--accent-strong)" stroke-width="3"/><circle cx="203" cy="176" r="4.5" fill="var(--accent-strong)"/>` +
      `<rect x="252" y="164" width="98" height="24" rx="12" fill="var(--bg)"/><text x="301" y="180" text-anchor="middle" style="font:800 12px var(--ui);fill:var(--accent-strong)">Hoy · 12 días</text>`;
    return `<svg viewBox="0 28 ${W} ${H - 28}" role="img" aria-label="Tu camino"><defs>${defs}</defs>${body}</svg>`;
  }

  const strip = (cells) => `<div class="cm-days">${cells.map(([d, k], i) => `<span class="${i === 6 ? "t" : ""}"><i class="${k}">${k === "g" ? graceI : k === "o" ? "" : check}</i>${d}</span>`).join("")}</div>`;

  // Tu año: barras de cada mes (Palabra en verde, Rosario en azul), el mes elegido y, al final, lo mejor del año
  function yearHTML() {
    const M = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const W = [18, 19, 22, 20, 21, 18, 13, 14, 19, 30, 20, 0], R = [6, 5, 6, 5, 27, 5, 4, 3, 6, 23, 6, 0], sel = 9;
    const max = Math.max(...W.map((w, i) => w + R[i]));
    const bars = M.map((m, i) => `<span class="${i === sel ? "on" : ""}${i > 10 ? " fut" : ""}"><i class="r" style="height:${R[i] / max * 92}px"></i><i class="w" style="height:${W[i] / max * 92}px"></i><em>${m[0]}</em></span>`).join("");
    const ic = (svg, c) => `<span class="ic" style="--c:${c}">${svg}</span>`;
    const star = `<svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
    const streak = `<svg viewBox="0 0 24 24"><path d="M5 18c3-1 4-4 7-6s5-3 7-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="5" cy="18" r="1.8" fill="currentColor"/><circle cx="19" cy="6" r="1.8" fill="currentColor"/></svg>`;
    return `<div class="cm-card"><h3>Mes a mes</h3><p>Toca un mes para verlo. El borde marca el mes elegido.</p>
        <div class="cm-chart">${bars}</div>
        <div class="cm-legend"><span><i style="--c:#2fb565"></i>Días con la Palabra</span><span><i style="--c:#3d82ec"></i>Rosarios</span></div>
        <div class="cm-month"><div class="mh"><div><small>Tu mes más fructífero</small><b>Octubre</b></div><div class="arr"><span>‹</span><span>›</span></div></div>
          <div class="row"><div><b>30</b>días con la Palabra</div><div><b>23</b>rosarios</div><div><b>24</b>días de racha</div></div></div>
      </div>
      <div class="cm-card"><h3>Un año de oración</h3><p>Se completa el 31 de diciembre.</p>
        <div class="cm-stats"><div><b>214</b>días con la Palabra</div><div><b>96</b>rosarios</div><div><b>31</b>días, tu racha más larga</div><div><b>Gloriosos</b>los misterios que más rezaste</div></div>
      </div>
      <p class="cm-sec">Lo mejor de tu año</p>
      <div class="cm-card"><h3>Tus meses</h3>
        <ul class="cm-best">
          <li class="top">${ic(roadIcon(), "#7a4bb0")}<div><b>Octubre</b>El mes más fructífero</div><span class="v">53<small>en total</small></span></li>
          <li>${ic(bookI, "#2fb565")}<div><b>Octubre</b>El mes con más Palabra</div><span class="v">30<small>días</small></span></li>
          <li>${ic(rosI, "#3d82ec")}<div><b>Mayo</b>El mes con más rosarios</div><span class="v">27<small>rosarios</small></span></li>
          <li>${ic(streak, "#c48b00")}<div><b>Septiembre y octubre</b>Tu racha más larga</div><span class="v">31<small>días</small></span></li>
        </ul>
      </div>`;
  }

  function panel() {
    const box = document.createElement("div");
    box.className = "cm-panel x-path";
    box.innerHTML = `<header class="cm-head"><div><h1>Tu <em>camino</em></h1></div><button class="cm-x" aria-label="Cerrar">${xI}</button></header>
      <div class="cm-road">${road()}</div>
      <div class="cm-body">
        <p class="cm-sec">Rachas</p>
        <div class="cm-card x-word"><div class="cm-sr"><span class="ic">${bookI}</span><div><h3>Palabra del día</h3><p style="margin-top:2px">Tu mejor racha: 31 días</p></div><span class="num">12<small>días seguidos</small></span></div>
          ${strip([["X", ""], ["J", ""], ["V", ""], ["S", ""], ["D", "g"], ["L", ""], ["M", ""]])}</div>
        <div class="cm-card x-ros"><div class="cm-sr"><span class="ic">${rosI}</span><div><h3>Rosario</h3><p style="margin-top:2px">Tu mejor racha: 18 días</p></div><span class="num">5<small>días seguidos</small></span></div>
          ${strip([["X", "o"], ["J", "o"], ["V", ""], ["S", ""], ["D", ""], ["L", ""], ["M", ""]])}</div>
        <div class="cm-note">${shield}<span>El domingo no leíste la Palabra, pero <b>el escudo de san Miguel</b> protegió tu racha. Tienes uno cada semana; el próximo, a partir del lunes.</span></div>

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
        ${yearHTML()}
      </div>`;
    document.body.appendChild(box);
    return box;
  }

  function pill(where, kind, txt, dots) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "cm-pill " + kind;
    b.innerHTML = `<span class="ic">${roadIcon()}</span><span><b>${txt}</b></span><span class="cm-dots">${dots.map((d) => `<i class="${d}"></i>`).join("")}</span><span class="chev">›</span>`;
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
    top.innerHTML = `${roadIcon()}<span>12</span>`;
    faq.insertAdjacentElement("beforebegin", top);
    if (n === 1 || n === 6) pill(document.querySelector("#wordcol .daynav"), "x-word", "12 días seguidos", ["", "", "", "", "g", "", ""]);
    if (n === 2) pill(document.querySelector("#rosList .ros-tools"), "x-ros", "5 días seguidos", ["o", "o", "", "", "", "", ""]);
    if (n >= 3 && n <= 5) panel();
    if (n === 6) calendar();
  }
  mount();
  window.CaminoMock = { n, mode: n === 2 ? "rosary" : "word" };
})();
