# Instrucciones para asistentes de IA

Lee primero `GUIA.md`: explica cómo está hecha la web, las decisiones ya tomadas por Guillem y cómo probar.

Reglas rápidas:
- Habla y escribe siempre en castellano con Guillem.
- No toques el chat (`parseQuery` en `app.js`) ni añadas IA a la web.
- No uses misas.org como fuente de horarios.
- Cualquier texto nuevo va en castellano y catalán (`I18N` en `app.js`).
- Cambios de diseño o de contenido: enséñaselos con capturas antes de publicarlos.
- Antes de abrir una PR: `node --check` de los `.js` y `node pruebas/humo.js` con la web servida en `localhost:8000`.
- No edites `p/`, `sitemap.xml` ni `data/horarios/*.js` a mano: los generan los scripts.
