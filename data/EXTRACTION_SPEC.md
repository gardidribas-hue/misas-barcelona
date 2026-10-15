# Extraction spec (for workers)
For each parish URL, call WebFetch once with a prompt asking for every fact on the page: name, address, postal code, municipality (Població),
phone, email, web, arxiprestat, comunitat pastoral, map coordinates (from the embedded Google Maps iframe), mass schedule (Horari de misses)
for each day type, confessions, adoration of the Blessed Sacrament (Adoració del Santíssim), and other celebrations. Ask for exact times.

Then write one JSON object per parish with this shape:
{
  "slug": "sant-isidre",
  "url": "https://esglesia.barcelona/parroquies/sant-isidre/",
  "name": "Sant Isidre Llaurador",
  "address": "C/ Aprestadora, 3",
  "postal_code": "08902",
  "municipality": "L'Hospitalet de Llobregat",
  "phone": "93 332 78 98",
  "email": "...",
  "web": "https://www.parroquiasantisidre.org",
  "arxiprestat": "L'Hospitalet de Llobregat",
  "comunitat_pastoral": null,
  "lat": 41.3662912, "lng": 2.132097,
  "masses": [ {"days": ["sun","hol"], "time": "11:00", "lang": "ca", "note": ""},
              {"days": ["mon","tue","wed","thu","fri","sat"], "time": "10:00", "lang": "es", "note": ""} ],
  "confessions": [ {"days": [...], "start": "HH:MM", "end": "HH:MM" or null, "note": ""} ],
  "adoration":   [ {"days": [...], "start": "HH:MM", "end": "HH:MM" or null, "note": ""} ],
  "confessions_text": "short Spanish summary, e.g. '30 min antes de cada misa, a petición'",
  "adoration_text": "short Spanish summary",
  "masses_text": "short Spanish summary of the whole mass schedule incl. seasonal variations",
  "other": "short Spanish summary of rosary, vespers, etc. or ''",
  "status": "ok" | "no_schedule" | "fetch_failed"
}
Rules:
- days codes: mon tue wed thu fri sat sun hol (hol = festius / holidays). "Dissabtes i vigílies" = ["sat"] with note "vigília"
  when it is the evening (anticipated Sunday) mass. "Feiners"/"Dilluns a divendres" = mon..fri. "Dilluns a dissabte" = mon..sat.
- If there is a winter/summer schedule, put the CURRENT (October = winter/hivern/curs) schedule in "masses" and mention summer in masses_text.
- If a mass happens at a secondary church/chapel, keep it and put the place in "note".
- lang codes: ca, es, ca-es (bilingual), en, fr, de, it, pl, other, or "" if unknown.
- Times always HH:MM 24h. Never invent data: unknown -> null / [] / "".
- "confessions" structured entries only when a concrete time is given; "before each mass" goes only in confessions_text.
