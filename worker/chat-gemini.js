/* Chat de Misas Barcelona con Gemini (Cloudflare Worker).
   La web busca primero en sus propios datos (data/horarios) y manda aquí la pregunta junto con las
   parroquias que encajan. Gemini solo redacta la respuesta con esos datos: no busca ni inventa horarios.
   Variables del Worker: GEMINI_API_KEY (secreto), ALLOWED_ORIGIN (p. ej. https://gardidribas-hue.github.io),
   GEMINI_MODEL (opcional, por defecto gemini-2.5-flash). */
const SYSTEM = {
  es: `Eres el asistente de una web para encontrar misas, confesiones y adoración en la Archidiócesis de Barcelona.
Responde en castellano, breve y amable. Usa SOLO las parroquias y horarios que vienen en "candidatos": no añadas
horarios, parroquias ni datos que no estén ahí, aunque creas saberlos. Si no hay candidatos que encajen, dilo y
sugiere ampliar la franja horaria o la zona. Para cada parroquia que recomiendes di la hora, la dirección y, si la
fiabilidad es baja, recomienda confirmarlo con la parroquia. Recuerda que en festivos los horarios pueden cambiar.`,
  ca: `Ets l'assistent d'una web per trobar misses, confessions i adoració a l'Arxidiòcesi de Barcelona.
Respon en català, breu i amable. Fes servir NOMÉS les parròquies i horaris que vénen a "candidatos": no hi afegeixis
horaris, parròquies ni dades que no hi siguin, encara que creguis saber-los. Si no n'hi ha cap que encaixi, digues-ho
i suggereix ampliar la franja horària o la zona. Per a cada parròquia que recomanis digues l'hora, l'adreça i, si la
fiabilitat és baixa, recomana confirmar-ho amb la parròquia. Recorda que els festius els horaris poden canviar.`
};

export default {
  async fetch(req, env) {
    const origin = env.ALLOWED_ORIGIN || "*";
    const cors = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("Solo POST", { status: 405, headers: cors });
    let body;
    try { body = await req.json(); } catch { return new Response("JSON no válido", { status: 400, headers: cors }); }
    const pregunta = String(body.pregunta || "").slice(0, 500);
    const candidatos = Array.isArray(body.candidatos) ? body.candidatos.slice(0, 12) : [];
    const lang = body.idioma === "ca" ? "ca" : "es";
    if (!pregunta) return new Response("Falta la pregunta", { status: 400, headers: cors });
    const model = env.GEMINI_MODEL || "gemini-2.5-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM[lang] }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify({ pregunta, ahora: body.ahora || null, candidatos }) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
      })
    });
    if (!r.ok) return new Response(JSON.stringify({ error: `Gemini ${r.status}` }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
    const j = await r.json();
    const texto = j?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    return new Response(JSON.stringify({ respuesta: texto }), { headers: { ...cors, "Content-Type": "application/json" } });
  }
};
