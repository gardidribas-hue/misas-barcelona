import io, re, urllib.request
from pypdf import PdfReader
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/126 Safari/537.36"}
def fetch(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r: return r.read()
pdf = PdfReader(io.BytesIO(fetch("https://multimedia.opusdei.org/doc/pdf/Devocionari%20mobil%20-%20www.opusdei.cat20220314171720840413.pdf")))
for i, p in enumerate(pdf.pages):
    t = p.extract_text() or ""
    if re.search(r"Crec en|Credo in", t):
        print("=== PAGE", i); print(p.extract_text(extraction_mode="layout"))
for u in ["https://www.ewtn.com/es/catolicismo/oraciones/credo-niceno-constantinopolitano",
          "https://www.ewtn.com/es/oracion/credo-niceno",
          "https://www.ewtn.com/es/oracion/credo-niceno-constantinopolitano",
          "https://www.vatican.va/archive/catechism_sp/p1s1c3a2_sp.html",
          "https://www.vatican.va/special/rosary/documents/credo_sp.html",
          "https://www.vaticannews.va/es/oraciones/credo.html",
          "https://www.vaticannews.va/es/oraciones/el-credo.html",
          "https://www.ewtn.com/es/oracion/oraciones-del-rosario"]:
    try:
        h = fetch(u).decode("utf-8", "replace"); txt = re.sub(r"<[^>]+>", " ", h); txt = re.sub(r"\s+", " ", txt)
        i = txt.find("solo Dios"); print("=== OK", u, len(h), i); 
        if i >= 0: print(txt[max(0, i-200):i+3000])
    except Exception as e: print("=== FAIL", u, e)
