import io, re, urllib.request
from pypdf import PdfReader
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/126 Safari/537.36"}
def fetch(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r: return r.read()
pdf = PdfReader(io.BytesIO(fetch("https://multimedia.opusdei.org/doc/pdf/Devocionari%20mobil%20-%20www.opusdei.cat20220314171720840413.pdf")))
print("=== PAGE 12"); print(pdf.pages[12].extract_text(extraction_mode="layout"))
for u in ["https://www.vatican.va/archive/catechism_sp/p1s2_sp.html",
          "https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_sp.html"]:
    try:
        h = fetch(u).decode("utf-8", "replace")
        for m in re.finditer(r"Creo en un solo Dios", h):
            print("=== OK", u, m.start()); print(h[m.start()-1500:m.start()+4500]); break
        else: print("=== NOMATCH", u, len(h))
    except Exception as e: print("=== FAIL", u, e)
