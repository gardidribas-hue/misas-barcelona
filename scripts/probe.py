import io, re, urllib.request
from pypdf import PdfReader
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/126 Safari/537.36"}
def fetch(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r: return r.read()
pdf = PdfReader(io.BytesIO(fetch("https://multimedia.opusdei.org/doc/pdf/Devocionari%20mobil%20-%20www.opusdei.cat20220314171720840413.pdf")))
for i, p in enumerate(pdf.pages):
    t = p.extract_text() or ""
    if re.search(r"Letan|Litani|Kyrie|Senyor, tingueu", t):
        print("=== PAGE", i, len(t)); print(p.extract_text(extraction_mode="layout")[:2500])
for u in ["https://www.vatican.va/special/rosary/documents/litanie-lauretane_sp.html",
          "https://www.vatican.va/special/rosary/documents/litanie-lauretane_lt.html",
          "https://opusdei.org/es-es/article/letanias-lauretanas/",
          "https://www.ewtn.com/es/oracion/letanias-lauretanas",
          "https://www.ewtn.com/es/oracion/letania-de-la-santisima-virgen-maria",
          "https://www.vatican.va/special/rosary/index_rosary_sp.htm"]:
    try:
        h = fetch(u).decode("utf-8", "replace"); txt = re.sub(r"<[^>]+>", " ", h); txt = re.sub(r"\s+", " ", txt)
        i = txt.lower().find("piedad"); print("=== OK", u, len(h)); print(txt[max(0,i-300):i+2500])
    except Exception as e: print("=== FAIL", u, e)
