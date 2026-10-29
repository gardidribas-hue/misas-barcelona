"""Arreglos del catalán de la Palabra.

- unescape: quita entidades HTML (también dobles, como «&amp;#34;») y etiquetas sueltas.
- fix: después de la traducción automática de las palabras de los Papas, pasa los nombres propios
  que se quedan en castellano a su forma catalana, quita las marcas de los traductores
  («#revestir», «*palabra», «@…») y deja las comillas en catalán.
- fix_bci: junta las palabras que la BCI de bible.com deja partidas con guion («podero-ses»).
"""
import html, re

# Castellano -> catalán. Se aplica a la traducción, así que solo hace falta poner las formas
# que no existen en catalán (por eso no hay «Marta», «Pilat», «David»…). Las más largas primero.
NAMES = {
    # Papas y documentos
    "Juan Pablo": "Joan Pau", "Benedicto": "Benet", "Francisco": "Francesc", "León": "Lleó", "Pío": "Pius",
    "Pablo": "Pau", "Juan": "Joan", "Gregorio": "Gregori", "Clemente": "Climent", "Inocencio": "Innocenci",
    "Audiencia": "Audiència", "Ángelus": "Àngelus", "Homilía": "Homilia", "Mensaje": "Missatge",
    "Catequesis": "Catequesi", "Discurso": "Discurs", "Encíclica": "Encíclica", "Exhortación": "Exhortació",
    "Carta apostólica": "Carta apostòlica", "Exhortación apostólica": "Exhortació apostòlica",
    "Santa Marta": "Santa Marta", "Regina Coeli": "Regina Coeli",
    # Evangelios, apóstoles y personajes bíblicos
    "Juan Bautista": "Joan Baptista", "Bautista": "Baptista", "Mateo": "Mateu", "Marcos": "Marc", "Lucas": "Lluc",
    "Pedro": "Pere", "Andrés": "Andreu", "Santiago": "Jaume", "Felipe": "Felip", "Bartolomé": "Bartomeu",
    "Tomás": "Tomàs", "Simón": "Simó", "Judas": "Judes", "Tadeo": "Tadeu", "Matías": "Macià", "Esteban": "Esteve",
    "Timoteo": "Timoteu", "Tito": "Titus", "Bernabé": "Bernabé", "Silvano": "Silvà", "Apolo": "Apol·lo",
    "José": "Josep", "María": "Maria", "Isabel": "Elisabet", "Zacarías": "Zacaries", "Joaquín": "Joaquim",
    "Lázaro": "Llàtzer", "Zaqueo": "Zaqueu", "Nicodemo": "Nicodem", "Pilato": "Pilat", "Caifás": "Caifàs",
    "Bartimeo": "Bartimeu", "Jairo": "Jaire", "Cleofás": "Cleofàs", "Barrabás": "Barrabàs",
    "Adán": "Adam", "Noé": "Noè", "Abrahán": "Abraham", "Abrahám": "Abraham", "Moisés": "Moisès", "Aarón": "Aaron",
    "Josué": "Josuè", "Salomón": "Salomó", "Elías": "Elies", "Eliseo": "Eliseu", "Isaías": "Isaïes",
    "Jeremías": "Jeremies", "Jonás": "Jonàs", "Tobías": "Tobies", "Sansón": "Samsó", "Saúl": "Saül",
    "Ezequías": "Ezequies", "Nehemías": "Nehemies", "Malaquías": "Malaquies", "Miqueas": "Miquees",
    "Oseas": "Osees", "Ageo": "Ageu", "Habacuc": "Habacuc", "Sofonías": "Sofonies", "Abdías": "Abdies",
    "Melquisedec": "Melquisedec", "Ismael": "Ismael", "Raquel": "Raquel", "Rebeca": "Rebeca",
    "Gabriel": "Gabriel", "Miguel": "Miquel",
    # Santos y Padres de la Iglesia
    "Agustín": "Agustí", "Ignacio": "Ignasi", "Ambrosio": "Ambròs", "Jerónimo": "Jeroni", "Ireneo": "Ireneu",
    "Policarpo": "Policarp", "Cirilo": "Ciril", "Atanasio": "Atanasi", "Basilio": "Basili",
    "Crisóstomo": "Crisòstom", "Bernardo": "Bernat", "Antonio": "Antoni", "Luis": "Lluís", "Carlos": "Carles",
    "Catalina": "Caterina", "Teresita": "Teresa", "Domingo de Guzmán": "Domènec de Guzmán", "Benito": "Benet",
    "Escolástica": "Escolàstica", "Buenaventura": "Bonaventura", "Alfonso": "Alfons", "Felipe Neri": "Felip Neri",
    "Vicente": "Vicenç", "Ramón": "Ramon", "Jorge": "Jordi", "Martín": "Martí", "Cecilia": "Cecília",
    "Inés": "Agnès", "Lucía": "Llúcia", "Águeda": "Àgata", "Eulalia": "Eulàlia", "Mónica": "Mònica",
    "Faustina": "Faustina", "Maximiliano": "Maximilià", "Borromeo": "Borromeu", "Javier": "Xavier",
    # Lugares
    "Jerusalén": "Jerusalem", "Belén": "Betlem", "Nazaret": "Natzaret", "Cafarnaúm": "Cafarnaüm",
    "Betania": "Betània", "Samaría": "Samaria", "Egipto": "Egipte", "Babilonia": "Babilònia",
    "Jordán": "Jordà", "Calvario": "Calvari", "Getsemaní": "Getsemaní", "Tiberíades": "Tiberíades",
    "Éfeso": "Efes", "Corinto": "Corint", "Tesalónica": "Tessalònica", "Filipos": "Filips", "Antioquía": "Antioquia",
    "Galacia": "Galàcia", "Macedonia": "Macedònia", "Asís": "Assís", "Loyola": "Loiola", "Ávila": "Àvila",
    "Lisieux": "Lisieux", "Fátima": "Fàtima", "Lourdes": "Lorda",
}
VOWEL = "AEIOUÀÈÉÍÏÒÓÚÜHaeiouàèéíïòóúüh"
_names = sorted((k for k, v in NAMES.items() if k != v), key=len, reverse=True)
_names_re = re.compile(r"\b(de |De |el |El )?(" + "|".join(map(re.escape, _names)) + r")\b(?!['’]\w)")
PRONOUNS = r"(?:me|te|se|nos|vos|lo|la|los|les|li|ho|hi|en|ne)"
NUMBERS = r"(?:u|un|una|dos|dues|tres|quatre|cinc|sis|set|vuit|nou)"


def unescape(s):
    for _ in range(3):  # «&amp;#34;» -> «&#34;» -> «"»
        t = html.unescape(s)
        if t == s:
            break
        s = t
    return re.sub(r"</?[a-zA-Z][^>]*>", "", s)


def prepare(s):
    """Texto castellano listo para traducir: sin entidades, etiquetas ni almohadillas."""
    return re.sub(r"\s{2,}", " ", unescape(s).replace("#", "")).strip()


def _name(m):
    pre, word = m.group(1) or "", m.group(2)
    if word == "León" and not re.match(r"\s+[XIV]+\b", m.string[m.end():]):
        return m.group(0)  # solo el papa León (XIII, XIV…)
    ca = NAMES[word]
    if pre.strip().lower() in ("de", "el") and ca[0] in VOWEL:
        pre = ("d'" if pre.strip().lower() == "de" else "l'")
        pre = pre.upper() if m.group(1)[0].isupper() else pre
        return pre + ca
    return pre + ca


def fix(s):
    s = unescape(s)
    s = re.sub(r"(?<![\w&])[#*@](?=\w)", "", s)  # marcas de Apertium: «#revestir», «*paraula»
    s = s.replace("#", "")
    s = _names_re.sub(_name, s).replace("Temps Ordinari", "Temps ordinari")
    s = re.sub(r"\b([Dd])entre\b", r"\1'entre", s)  # Google a veces se come el apóstrofo
    s = re.sub(r'"([^"\n]+)"', r"«\1»", s)  # comillas rectas -> catalanas
    s = re.sub(r"\s+([,.;:!?)»])", r"\1", s)
    s = re.sub(r"([(«])\s+", r"\1", s)
    return re.sub(r"[ \t]{2,}", " ", s).strip()


def fix_bci(s):
    """La BCI de bible.com deja algunas palabras partidas a final de línea («podero-ses», «al-gú»).
    Se juntan, salvo los pronombres («torna-l’hi») y los números («noranta-nou»)."""
    def join(m):
        a, b = m.group(1), m.group(2)
        if re.fullmatch(PRONOUNS, b) or re.fullmatch(NUMBERS, b) or b in ("est", "oest"):
            return m.group(0)
        return a + b
    return re.sub(r"\b([a-zà-ü]+)-([a-zà-ü]{1,4})\b(?![-’'])", join, unescape(s))
