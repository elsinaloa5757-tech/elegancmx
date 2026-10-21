"""Conservative, testable helpers for FREE photo-identity suggestions in Elegance MX.

All names are provisional; model text is not a verified brand, SKU or product.
"""
import re

CATEGORY_PATTERNS = [
    ("Tenis", r"\b(sneakers?|trainers?|athletic shoes?|running shoes?|tennis shoes?)\b"),
    ("Calzado", r"\b(loafers?|heels?|pumps?|mary janes?|sandals?|boots?|dress shoes?|flats?|slippers?)\b"),
    ("Bolsas", r"\b(handbags?|purses?|tote bags?|backpacks?|shoulder bags?|clutches?)\b"),
    ("Gorras", r"\b(baseball caps?|caps?|hats?)\b"),
    ("Playeras", r"\b(t-?shirts?|polo shirts?)\b"),
    ("Pantalones", r"\b(trousers?|jeans|pants|leggings?)\b"),
    ("Ropa", r"\b(jackets?|hoodies?|coats?|sweaters?|sweatshirts?)\b"),
    ("Vestidos", r"\b(dresses?|gowns?)\b"),
    ("Relojes", r"\b(watches?|wristwatches?)\b"),
    ("Lentes", r"\b(sunglasses|eyeglasses|glasses)\b"),
    ("Joyería", r"\b(necklaces?|bracelets?|earrings?|jewelry)\b"),
    ("Cinturones", r"\b(belts?)\b"),
    ("Fragancias", r"\b(perfumes?|fragrance bottles?)\b"),
]
COLORS = [
    ("plateado", r"\b(silver|silvery|metallic silver)\b"),
    ("negro", r"\b(black)\b"),
    ("blanco", r"\b(white)\b"),
    ("rojo", r"\b(red)\b"),
    ("rosa", r"\b(pink)\b"),
    ("azul", r"\b(blue)\b"),
    ("verde", r"\b(green)\b"),
    ("beige", r"\b(beige|cream|tan)\b"),
    ("marrón", r"\b(brown)\b"),
    ("dorado", r"\b(gold|golden)\b"),
    ("gris", r"\b(gray|grey)\b"),
    ("morado", r"\b(purple|violet)\b"),
]
NAMES = {"Tenis":"Tenis","Calzado":"Calzado","Bolsas":"Bolsa","Gorras":"Gorra",
         "Playeras":"Playera","Pantalones":"Pantalón","Ropa":"Prenda","Vestidos":"Vestido",
         "Relojes":"Reloj","Lentes":"Lentes","Joyería":"Accesorio de joyería",
         "Cinturones":"Cinturón","Fragancias":"Fragancia"}
ADJECTIVES = {"Tenis":{"plateado":"plateados","negro":"negros","blanco":"blancos","rojo":"rojos","rosa":"rosas",
            "azul":"azules","verde":"verdes","beige":"beige","marrón":"marrones",
            "dorado":"dorados","gris":"grises","morado":"morados"},
              "Calzado":{"plateado":"plateado","negro":"negro","blanco":"blanco","rojo":"rojo",
             "rosa":"rosa","azul":"azul","verde":"verde","beige":"beige","marrón":"marrón",
             "dorado":"dorado","gris":"gris","morado":"morado"}}

def clean_description(value):
    """Reject suspicious outputs; never echo model instructions or URLs in listings."""
    if not isinstance(value, str):
        return ""
    value = re.sub(r"\s+", " ", value).strip()[:320]
    if re.search(r"https?://|<[^>]+>|ignore previous|system prompt", value, re.I):
        return ""
    return value

def suggest(description):
    """Produce a safe category + generic Spanish name from visual object words."""
    text = clean_description(description).lower()
    if len(text) < 15:
        return None
    # Avoid negations and answers mentioning conflicting types or uncertain objects.
    categories = []
    for cat, pattern in CATEGORY_PATTERNS:
        for match in re.finditer(pattern, text, re.I):
            prefix = text[max(0, match.start()-16):match.start()]
            if not re.search(r"\b(no|not|without|isn't|aren't)\s+(?:an?\s+)?$", prefix):
                categories.append(cat)
                break
    if len(set(categories)) != 1:
        return None
    cat = categories[0]
    colors = [spanish for spanish, pattern in COLORS if re.search(pattern, text, re.I)]
    if len(colors) > 2:
        colors = []
    base = NAMES[cat]
    if colors:
        color = colors[0]
        if cat == "Tenis":
            color = ADJECTIVES["Tenis"].get(color, color)
        elif cat in ("Bolsas", "Gorras", "Playeras", "Ropa", "Fragancias"):
            if color in ("plateado", "negro", "blanco", "rojo", "dorado", "morado"):
                color = color[:-1] + "a"
        elif cat == "Lentes":
            if color in ("azul", "verde", "gris", "marrón"):
                color = {"azul":"azules","verde":"verdes","gris":"grises","marrón":"marrones"}[color]
            elif color in ("plateado", "negro", "blanco", "rojo", "dorado", "morado"):
                color += "s"
        base += " " + color
    return {"categorySuggestion":cat,"nameSuggestion":base[:90],"colorsSuggestion":colors,
            "status":"requires_review","verified":False}
