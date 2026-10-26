"""
Brand-name -> active-ingredient table used by the medicine search.

The Jan Aushadhi catalogue lists GENERIC names (plus a few brands). When a
user searches a brand that is not in the catalogue (e.g. "Amlodac"), the
search looks the brand up here and returns the Jan Aushadhi generic(s)
with the same ingredient(s).

Rules:
  * keys are lower-case brand names WITHOUT strength ("amlodac", "pan d")
  * values are lower-case ingredient names, no salts
    ("amlodipine", not "amlodipine besylate")
  * review before relying on it, and extend it as you meet new brands
"""

BRAND_TO_GENERIC: dict[str, tuple[str, ...]] = {
    # --- Amlodipine ---
    "amlong": ("amlodipine",),
    "amlodac": ("amlodipine",),
    "norvasc": ("amlodipine",),
    "stamlo": ("amlodipine",),
    # --- Paracetamol ---
    "dolo": ("paracetamol",),
    "crocin": ("paracetamol",),
    "calpol": ("paracetamol",),
    "pacimol": ("paracetamol",),
    # --- Pantoprazole / omeprazole ---
    "pan": ("pantoprazole",),
    "pantop": ("pantoprazole",),
    "pantocid": ("pantoprazole",),
    "pan d": ("pantoprazole", "domperidone"),
    "omez": ("omeprazole",),
    "ocid": ("omeprazole",),
    # --- Antibiotics ---
    "azithral": ("azithromycin",),
    "azee": ("azithromycin",),
    "zithromax": ("azithromycin",),
    "augmentin": ("amoxicillin", "clavulanic acid"),
    "clavam": ("amoxicillin", "clavulanic acid"),
    "moxclav": ("amoxicillin", "clavulanic acid"),
    "amoxil": ("amoxicillin",),
    "mox": ("amoxicillin",),
    "novamox": ("amoxicillin",),
    "ciplox": ("ciprofloxacin",),
    "cifran": ("ciprofloxacin",),
    "doxy": ("doxycycline",),
    "zifi": ("cefixime",),
    # --- Statins ---
    "atorva": ("atorvastatin",),
    "storvas": ("atorvastatin",),
    "lipitor": ("atorvastatin",),
    "rosuvas": ("rosuvastatin",),
    "crestor": ("rosuvastatin",),
    # --- Diabetes ---
    "glycomet": ("metformin",),
    "glucophage": ("metformin",),
    "amaryl": ("glimepiride",),
    "glimestar": ("glimepiride",),
    "diamicron": ("gliclazide",),
    # --- Blood pressure / heart ---
    "telma": ("telmisartan",),
    "telmikind": ("telmisartan",),
    "losar": ("losartan",),
    "cozaar": ("losartan",),
    "metolar": ("metoprolol",),
    "betaloc": ("metoprolol",),
    "ecosprin": ("aspirin",),
    "disprin": ("aspirin",),
    # --- Allergy / asthma ---
    "cetzine": ("cetirizine",),
    "okacet": ("cetirizine",),
    "levocet": ("levocetirizine",),
    "xyzal": ("levocetirizine",),
    "montair": ("montelukast",),
    "singulair": ("montelukast",),
    "asthalin": ("salbutamol",),
    # --- Pain / anti-inflammatory ---
    "brufen": ("ibuprofen",),
    "combiflam": ("ibuprofen", "paracetamol"),
    "voveran": ("diclofenac",),
    "nise": ("nimesulide",),
    "nimulid": ("nimesulide",),
    # --- Stomach ---
    "rantac": ("ranitidine",),
    "zinetac": ("ranitidine",),
    "aciloc": ("ranitidine",),
    "domstal": ("domperidone",),
    "motilium": ("domperidone",),
    # --- Vitamins / thyroid ---
    "folvite": ("folic acid",),
    "thyronorm": ("levothyroxine",),
    "eltroxin": ("levothyroxine",),
}

# Catalogue spelling differs from the common spelling for some ingredients.
INGREDIENT_REGEX: dict[str, str] = {
    "amoxicillin": "amoxy?cillin",
    "clavulanic acid": "clavulan",
    "folic acid": "folic",
}

# ---------------------------------------------------------------------------
# Admin-managed aliases (collection "brand_aliases"). They are merged over the
# built-in table above, so an admin entry wins when both define the same brand.
# ---------------------------------------------------------------------------
import time

CUSTOM_BRAND_TO_GENERIC: dict[str, tuple[str, ...]] = {}
_custom_state = {"loaded_at": 0.0}
_CUSTOM_TTL_SECONDS = 60


def all_aliases() -> dict[str, tuple[str, ...]]:
    """Built-in table with the admin-managed entries layered on top."""
    return {**BRAND_TO_GENERIC, **CUSTOM_BRAND_TO_GENERIC}


async def refresh_custom_aliases(db, force: bool = False) -> None:
    """Reload admin aliases from MongoDB (at most once a minute unless forced)."""
    if not force and time.monotonic() - _custom_state["loaded_at"] < _CUSTOM_TTL_SECONDS:
        return
    try:
        loaded: dict[str, tuple[str, ...]] = {}
        async for doc in db["brand_aliases"].find({}):
            loaded[doc["brand"]] = tuple(doc.get("ingredients", ()))
        CUSTOM_BRAND_TO_GENERIC.clear()
        CUSTOM_BRAND_TO_GENERIC.update(loaded)
        _custom_state["loaded_at"] = time.monotonic()
    except Exception:  # noqa: BLE001 - search must keep working on the built-in table
        pass
