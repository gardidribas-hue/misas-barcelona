/* Prueba de humo: abre la web en un móvil de mentira y comprueba que lo básico funciona.
   Uso (con la web servida en http://localhost:8000):  node pruebas/humo.js
   La lanza sola la acción «comprobar» en cada cambio. Si falla, dice qué. */
const { chromium } = require("playwright-core");
const BASE = process.env.BASE || "http://localhost:8000/";
const fallos = [];
const ok = (cond, msg) => { console.log((cond ? "✓ " : "✗ ") + msg); if (!cond) fallos.push(msg); };

(async () => {
  // En GitHub Actions se usa el Chrome que ya trae el servidor (variable CHROME); en local, el de Playwright.
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args: ["--no-sandbox"] } : {});
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "es-ES", timezoneId: "Europe/Madrid" });
  await ctx.route(/tiles\.openfreemap\.org|gc\.zgo\.at/, (r) => r.abort()); // sin mapa de fondo: no hace falta para probar
  const page = await ctx.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(3500);

  const n = await page.evaluate(() => window.MisasApp && MisasApp.DATA.length);
  ok(n > 150, `hay parroquias cargadas (${n})`);
  ok(await page.evaluate(() => !document.body.classList.contains("loading")), "la pantalla de carga se retira");

  await page.evaluate(() => MisasApp.ask("Gràcia entre las 17 y las 20"));
  await page.waitForTimeout(3000);
  const chat = await page.textContent("#thread");
  ok(/Gràcia/.test(chat) && /parroquia/.test(chat), "el chat responde a «Gràcia entre las 17 y las 20»");

  const q = await page.evaluate(() => MisasApp.parseQuery("misa el domingo por la mañana en Sarrià"));
  ok(q && q.f.day === "sun" && q.f.from === 420 && q.zone && q.zone.name === "Sarrià-Sant Gervasi", "el chat entiende «domingo por la mañana en Sarrià»");

  for (const m of ["map", "word", "rosary", "volunteer", "faq", "home"]) {
    await page.evaluate((m) => MisasApp.setMode(m), m);
    await page.waitForTimeout(500);
    ok(await page.evaluate(() => document.getElementById("stage").dataset.mode) === m, `se abre la sección ${m}`);
  }
  const id = await page.evaluate(() => MisasApp.DATA[0].id);
  await page.evaluate((id) => { location.hash = "parroquia/" + id; }, id);
  await page.waitForTimeout(1200);
  ok(await page.evaluate(() => !document.getElementById("detail").hidden), "se abre la ficha de una parroquia");

  // Sin conexión: con el service worker, la web vuelve a abrir.
  const sw = await page.evaluate(async () => { await navigator.serviceWorker.ready; return !!navigator.serviceWorker.controller || (await navigator.serviceWorker.getRegistrations()).length > 0; });
  ok(sw, "el service worker está activo");
  await page.reload(); await page.waitForTimeout(1500);
  await ctx.setOffline(true);
  await page.reload(); await page.waitForTimeout(3000);
  ok(await page.evaluate(() => window.MisasApp && MisasApp.DATA.length > 150), "sin conexión la web abre con los horarios guardados");
  await ctx.setOffline(false);

  const r = await page.goto(BASE + "p/");
  ok(r && r.ok(), "existe el índice de parroquias p/");

  ok(!errores.length, "sin errores de JavaScript" + (errores.length ? ": " + errores.slice(0, 3).join(" | ") : ""));
  await b.close();
  if (fallos.length) { console.error(`\n${fallos.length} comprobaciones fallidas`); process.exit(1); }
  console.log("\nTodo bien");
})().catch((e) => { console.error(e); process.exit(1); });
