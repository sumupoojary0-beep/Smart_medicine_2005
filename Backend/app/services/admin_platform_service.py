"""
Admin: platform settings, roles overview, notification broadcasts and the
brand -> generic mapping table. Everything reads/writes real collections:
  platform_settings (one document), broadcasts, brand_aliases, users.
"""

import re
import time
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database.connection import get_database
from app.schemas.admin_platform_schemas import AliasWrite, BroadcastRequest, SettingsWrite
from app.services import audit_service
from app.services.medicine_service import _ingredient_filter, resolve_query_to_ingredients, _ingredient_vocabulary
from app.utils.brand_aliases import BRAND_TO_GENERIC, all_aliases, refresh_custom_aliases
from app.utils.logger import logger

SETTINGS = "platform_settings"
BROADCASTS = "broadcasts"
ALIASES = "brand_aliases"
NOTIFICATIONS = "notifications"

DEFAULT_SETTINGS = {"registration_open": True, "maintenance_mode": False, "maintenance_message": ""}
DEFAULT_MESSAGE = "Smart Medicine is under maintenance. Please try again shortly."

_cache = {"value": None, "at": 0.0}
_CACHE_SECONDS = 5


# ───────────────────────────── settings ─────────────────────────────
async def get_settings(use_cache: bool = False) -> dict:
    if use_cache and _cache["value"] is not None and time.monotonic() - _cache["at"] < _CACHE_SECONDS:
        return _cache["value"]
    doc = await get_database()[SETTINGS].find_one({"_id": "platform"}) or {}
    value = {
        "registration_open": doc.get("registration_open", True),
        "maintenance_mode": doc.get("maintenance_mode", False),
        "maintenance_message": doc.get("maintenance_message", ""),
        "updated_by": doc.get("updated_by"),
        "updated_at": doc.get("updated_at"),
    }
    _cache.update(value=value, at=time.monotonic())
    return value


async def get_public_status() -> dict:
    s = await get_settings(use_cache=True)
    return {
        "registration_open": s["registration_open"],
        "maintenance_mode": s["maintenance_mode"],
        "message": (s["maintenance_message"] or DEFAULT_MESSAGE) if s["maintenance_mode"] else "",
    }


async def update_settings(data: SettingsWrite, actor: str) -> dict:
    before = await get_settings()
    now = datetime.now(timezone.utc)
    new = data.model_dump()
    new["maintenance_message"] = new["maintenance_message"].strip()
    await get_database()[SETTINGS].update_one(
        {"_id": "platform"}, {"$set": {**new, "updated_by": actor, "updated_at": now}}, upsert=True,
    )
    _cache["value"] = None
    changed = {k: [before.get(k), new[k]] for k in new if before.get(k) != new[k]}
    if changed:
        await audit_service.record(actor, "settings.update", "settings", "platform",
                                   "Changed platform settings: " + ", ".join(changed), {"changes": changed})
    return await get_settings()


# ───────────────────────────── roles ─────────────────────────────
# Mirrors the require_role(...) guards in the routers. USER/PHARMACY/ADMIN are
# the only roles the system has; Admin can change a user's role on the Users page.
ROLE_INFO = [
    {"role": "USER", "label": "Patient / User",
     "description": "Searches medicines, compares prices, finds nearby Kendras, gets stock alerts."},
    {"role": "PHARMACY", "label": "Pharmacy owner",
     "description": "Manages the stock, billing and reports of their own Kendra."},
    {"role": "ADMIN", "label": "Administrator",
     "description": "Manages users, Kendras, the medicine catalogue and platform settings."},
]
PERMISSIONS = [
    ("Search medicines and view details", ["USER", "PHARMACY", "ADMIN"], "Public, no sign-in needed"),
    ("Find nearby Kendras and live stock", ["USER", "PHARMACY", "ADMIN"], "Public, no sign-in needed"),
    ("Jan Aushadhi generic alternatives", ["USER", "PHARMACY", "ADMIN"], "Public, no sign-in needed"),
    ("Notifications, stock alerts, own profile", ["USER", "PHARMACY", "ADMIN"], "Any signed-in account"),
    ("Restock, edit and remove batches, import stock", ["PHARMACY", "ADMIN"], "Pharmacy owners: own Kendra only"),
    ("Billing, invoices and bill history", ["PHARMACY", "ADMIN"], "Pharmacy owners: own Kendra only"),
    ("Out-of-stock and expiry PDF reports", ["PHARMACY", "ADMIN"], "Pharmacy owners: own Kendra only"),
    ("Manage the medicine catalogue", ["ADMIN"], ""),
    ("Manage Kendras and link owners", ["ADMIN"], ""),
    ("Manage users, roles and blocking", ["ADMIN"], ""),
    ("Approve or reject pharmacy requests", ["ADMIN"], ""),
    ("Platform settings, broadcasts, generic mapping, activity logs", ["ADMIN"], ""),
]


async def get_roles() -> dict:
    counts = {r["role"]: {"total": 0, "active": 0, "blocked": 0} for r in ROLE_INFO}
    async for user in get_database().users.find({}, {"role": 1, "status": 1}):
        role = str(getattr(user.get("role"), "value", user.get("role")) or "USER")
        bucket = counts.setdefault(role, {"total": 0, "active": 0, "blocked": 0})
        bucket["total"] += 1
        bucket["active" if user.get("status", "ACTIVE") == "ACTIVE" else "blocked"] += 1
    return {
        "roles": [{**r, **counts[r["role"]]} for r in ROLE_INFO],
        "permissions": [{"name": n, "roles": r, "note": note} for n, r, note in PERMISSIONS],
    }


# ───────────────────────────── broadcasts ─────────────────────────────
_AUDIENCE_QUERY = {
    "all": {},
    "users": {"role": "USER"},
    "pharmacies": {"role": "PHARMACY"},
}
_AUDIENCE_LABEL = {"all": "Everyone", "users": "Patients / users", "pharmacies": "Pharmacy owners"}


async def _recipients(audience: str) -> list[str]:
    query = {"status": "ACTIVE", **_AUDIENCE_QUERY[audience]}
    emails: list[str] = []
    async for user in get_database().users.find(query, {"email": 1}):
        if user.get("email"):
            emails.append(user["email"])
    return emails


async def audience_counts() -> dict:
    return {key: len(await _recipients(key)) for key in _AUDIENCE_QUERY}


async def send_broadcast(data: BroadcastRequest, actor: str) -> dict:
    emails = await _recipients(data.audience)
    if not emails:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No active users in that audience, nothing was sent.")
    db = get_database()
    now = datetime.now(timezone.utc)
    broadcast = await db[BROADCASTS].insert_one({
        "title": data.title, "message": data.message, "audience": data.audience, "type": data.type,
        "recipients": len(emails), "sent_by": actor, "created_at": now,
    })
    bid = str(broadcast.inserted_id)
    docs = [{
        "user_email": email, "title": data.title, "description": data.message, "type": data.type,
        "is_read": False, "pmbi_code": None, "broadcast_id": bid, "created_at": now, "updated_at": now,
    } for email in emails]
    await db[NOTIFICATIONS].insert_many(docs)
    logger.info(f"Broadcast {bid} sent to {len(emails)} users by {actor}")
    await audit_service.record(actor, "notification.broadcast", "notification", bid,
                               f"Broadcast '{data.title}' to {_AUDIENCE_LABEL[data.audience]} ({len(emails)})",
                               {"audience": data.audience, "recipients": len(emails)})
    return {"id": bid, "recipients": len(emails)}


async def list_broadcasts(limit: int = 20) -> dict:
    items = []
    cursor = get_database()[BROADCASTS].find({}).sort([("created_at", -1), ("_id", -1)]).limit(limit)
    async for doc in cursor:
        items.append({
            "id": str(doc["_id"]), "title": doc["title"], "message": doc["message"],
            "audience": doc["audience"], "audience_label": _AUDIENCE_LABEL.get(doc["audience"], doc["audience"]),
            "type": doc.get("type", "info"), "recipients": doc.get("recipients", 0),
            "sent_by": doc.get("sent_by"), "created_at": doc["created_at"],
        })
    return {"items": items, "audience_counts": await audience_counts()}


# ───────────────────────────── brand -> generic mapping ─────────────────────────────
async def _check_ingredients(ingredients: list[str]) -> list[dict]:
    """Every ingredient must exist in the Jan Aushadhi catalogue, or the mapping would return nothing."""
    db = get_database()
    checked = []
    for ingredient in ingredients:
        count = await db["medicines"].count_documents({"is_active": {"$ne": False}, **_ingredient_filter([ingredient])})
        checked.append({"ingredient": ingredient, "medicines": count})
    return checked


async def list_aliases(q: str = "") -> dict:
    db = get_database()
    custom = {doc["brand"]: doc async for doc in db[ALIASES].find({})}
    rows = []
    for brand in sorted(set(BRAND_TO_GENERIC) | set(custom)):
        doc = custom.get(brand)
        rows.append({
            "brand": brand,
            "ingredients": list(doc["ingredients"]) if doc else list(BRAND_TO_GENERIC[brand]),
            "source": ("override" if brand in BRAND_TO_GENERIC else "custom") if doc else "builtin",
            "built_in_ingredients": list(BRAND_TO_GENERIC.get(brand, ())) or None,
            "updated_by": doc.get("updated_by") if doc else None,
            "updated_at": doc.get("updated_at") if doc else None,
        })
    if q.strip():
        needle = q.strip().lower()
        rows = [r for r in rows if needle in r["brand"] or any(needle in i for i in r["ingredients"])]
    return {"items": rows, "total": len(rows)}


async def save_alias(data: AliasWrite, actor: str) -> dict:
    checked = await _check_ingredients(data.ingredients)
    missing = [c["ingredient"] for c in checked if c["medicines"] == 0]
    if missing:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY,
                            "No Jan Aushadhi medicine contains: " + ", ".join(missing)
                            + ". Check the spelling of the ingredient.")
    db = get_database()
    existing = await db[ALIASES].find_one({"brand": data.brand})
    now = datetime.now(timezone.utc)
    await db[ALIASES].update_one(
        {"brand": data.brand},
        {"$set": {"ingredients": data.ingredients, "updated_by": actor, "updated_at": now},
         "$setOnInsert": {"created_at": now}}, upsert=True,
    )
    await refresh_custom_aliases(db, force=True)
    before = list(existing["ingredients"]) if existing else list(BRAND_TO_GENERIC.get(data.brand, ())) or None
    await audit_service.record(actor, "mapping.save", "mapping", data.brand,
                               f"Mapped brand '{data.brand}' to {', '.join(data.ingredients)}",
                               {"before": before, "after": data.ingredients})
    return {"brand": data.brand, "ingredients": data.ingredients, "matches": checked}


async def delete_alias(brand: str, actor: str) -> dict:
    db = get_database()
    brand = " ".join(re.sub(r"[^a-z\s]", " ", brand.lower()).split())
    existing = await db[ALIASES].find_one({"brand": brand})
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            "Only admin-added mappings can be removed; built-in ones are read-only.")
    await db[ALIASES].delete_one({"brand": brand})
    await refresh_custom_aliases(db, force=True)
    await audit_service.record(actor, "mapping.delete", "mapping", brand,
                               f"Removed custom mapping for '{brand}'", {"ingredients": list(existing["ingredients"])})
    return {"brand": brand, "reverted_to_builtin": brand in BRAND_TO_GENERIC}


async def test_alias(query: str) -> dict:
    """Run the same resolver the public search uses and show what it would return."""
    db = get_database()
    await refresh_custom_aliases(db, force=True)
    vocabulary = await _ingredient_vocabulary(db)
    resolved = resolve_query_to_ingredients(query, vocabulary)
    if not resolved:
        return {"query": query, "resolved": False, "ingredients": [], "matched_via": None, "medicines": []}
    ingredients, how = resolved
    docs = []
    async for doc in db["medicines"].find({"is_active": {"$ne": False}, **_ingredient_filter(ingredients)}).limit(5):
        docs.append({"pmbi_code": doc.get("pmbi_code"), "name": doc.get("generic_name"), "composition": doc.get("composition")})
    total = await db["medicines"].count_documents({"is_active": {"$ne": False}, **_ingredient_filter(ingredients)})
    return {"query": query, "resolved": True, "ingredients": ingredients, "matched_via": how,
            "medicine_count": total, "medicines": docs}
