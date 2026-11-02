"""
Add the official per-unit composition text to medicines.

Source : PMBI product list (columns: product code, name, generic name,
         active ingredients, composition text). Only rows whose composition is
         verified are in scripts/pmbi_composition.json; rows marked
         NOT_VERIFIED or left blank in the source are NOT included, so the app
         never shows a composition nobody checked.

What it writes, per matching medicine (matched by pmbi_code):
    composition_text   e.g. "Aceclofenac — 100 mg per tablet; Paracetamol — 325 mg per tablet"
    active_ingredients e.g. ["Aceclofenac", "Paracetamol"]
    composition_source "PMBI product list"
It never changes the existing `composition`, name, price or stock fields.

Safety check: if the product name in the list is very different from the
medicine's name in your database (same code, different drug), that row is
skipped and printed, not written.

Run from the Backend folder, venv active:
    python -m scripts.import_composition            # dry run: only reports
    python -m scripts.import_composition --apply    # writes to MongoDB
"""
import asyncio
import difflib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

DATA = Path(__file__).with_name("pmbi_composition.json")
SOURCE = "PMBI product list"
MIN_NAME_SIMILARITY = 0.45


def _norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()


def similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, _norm(a), _norm(b)).ratio()


async def run(db, apply: bool, rows: list[dict] | None = None) -> dict:
    rows = rows if rows is not None else json.loads(DATA.read_text(encoding="utf-8"))
    stats = {"rows": len(rows), "matched": 0, "written": 0, "already_same": 0,
             "not_in_db": 0, "name_mismatch": []}

    for r in rows:
        doc = await db.medicines.find_one({"pmbi_code": r["pmbi_code"]})
        if not doc:
            stats["not_in_db"] += 1
            continue
        stats["matched"] += 1

        db_name = doc.get("generic_name") or doc.get("brand_name") or ""
        names = [doc.get("generic_name") or "", doc.get("brand_name") or ""]
        if max(similarity(r["product_name"], n) for n in names) < MIN_NAME_SIMILARITY:
            stats["name_mismatch"].append((r["pmbi_code"], r["product_name"], db_name))
            continue

        if doc.get("composition_text") == r["composition_text"]:
            stats["already_same"] += 1
            continue

        if apply:
            await db.medicines.update_one(
                {"_id": doc["_id"]},
                {"$set": {
                    "composition_text": r["composition_text"],
                    "active_ingredients": r["active_ingredients"],
                    "composition_source": SOURCE,
                }},
            )
        stats["written"] += 1
    return stats


async def main(apply: bool) -> None:
    from motor.motor_asyncio import AsyncIOMotorClient
    from app.core.config import settings

    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    total = await db.medicines.count_documents({})
    stats = await run(db, apply)

    print(f"Medicines in database                 : {total}")
    print(f"Rows with verified composition (file) : {stats['rows']}")
    print(f"  found in your database (by code)    : {stats['matched']}")
    print(f"  not in your database                : {stats['not_in_db']}")
    print(f"  skipped, name does not match        : {len(stats['name_mismatch'])}")
    print(f"  already up to date                  : {stats['already_same']}")
    print(f"  {'WRITTEN' if apply else 'would be written'}"
          f"                        : {stats['written']}")
    for code, list_name, db_name in stats["name_mismatch"][:15]:
        print(f"    mismatch {code}: list='{list_name[:40]}'  db='{db_name[:40]}'")
    if not apply:
        print("\nDry run only. Re-run with --apply to write.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main("--apply" in sys.argv))
