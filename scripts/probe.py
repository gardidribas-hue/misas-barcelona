import io, re, urllib.request
from pypdf import PdfReader
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/126 Safari/537.36"}
def fetch(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r: return r.read()
pdf = PdfReader(io.BytesIO(fetch("https://multimedia.opusdei.org/doc/pdf/Devocionari%20mobil%20-%20www.opusdei.cat20220314171720840413.pdf")))
for i in range(47, 52):
    print("=== PAGE", i); print(pdf.pages[i].extract_text(extraction_mode="layout"))
h = fetch("https://www.vatican.va/special/rosary/documents/litanie-lauretane_sp.html").decode("latin-1")
i = h.find("ten piedad"); print("=== HTML"); print(h[i-1500:i+9000])
