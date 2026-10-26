"""
Correct or remove a stock batch (pharmacy owner / admin).

Restocking only ever ADDS stock and billing only ever DEDUCTS it, so a typing
mistake or a damaged batch could never be fixed. These two functions fix that.
Every change needs a reason and is written to the inventory activity log and
the admin audit log (before and after values).
"""

import asyncio
import random
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.core.constants import KENDRAS_COLLECTION, MEDICINES_COLLECTION
from app.database.connection import get_database
from app.schemas.stock_edit_schemas import BatchUpdateRequest
from app.services import audit_service
from app.services.kendra_service import (
    ACTIVITIES_COLLECTION,
    STOCK_WRITE_RETRIES,
    _to_object_id,
    _verify_kendra_ownership,
    compute_stock_status,
    save_stock_if_unchanged,
)
from app.services.notification_service import notify_stock_alert_subscribers
from app.utils.logger import logger


def _find(stock: list, pmbi_code: str, batch_number: str):
    item = next((s for s in stock if s.get("pmbi_code") == pmbi_code), None)
    batch = next((b for b in (item or {}).get("batches", []) if b.get("batch_number") == batch_number), None)
    if item is None or batch is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="That batch was not found.")
    return item, batch


def _recount(item: dict) -> None:
    item["total_qty"] = sum(int(b.get("quantity", 0)) for b in item["batches"])
    item["status"] = compute_stock_status(item["total_qty"])


async def _load(db, object_id, attempt: int):
    """Fresh copy of the Kendra; on a retry, wait a moment so competing writers do not collide again."""
    if attempt:
        await asyncio.sleep(random.uniform(0, 0.03 * attempt))
    kendra = await db[KENDRAS_COLLECTION].find_one({"_id": object_id})
    if not kendra:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kendra not found.")
    return kendra


async def _finish(db, kendra, object_id, action, pmbi_code, batch_number, reason, before, after, current_user, prev_qty, new_qty):
    actor = getattr(current_user, "sub", None) or ""
    await db[ACTIVITIES_COLLECTION].insert_one({
        "kendra_id": str(object_id), "type": action, "pmbi_code": pmbi_code,
        "batch_number": batch_number, "reason": reason, "before": before, "after": after,
        "by": actor, "at": datetime.now(timezone.utc),
    })
    await audit_service.record(
        actor=actor, action=f"stock.{action}", target_type="kendra", target_id=str(object_id),
        summary=f"{kendra.get('name', 'Kendra')}: {action} batch {batch_number} of {pmbi_code} ({reason})",
        details={"pmbi_code": pmbi_code, "batch_number": batch_number, "before": before, "after": after},
    )
    # Back in stock after being empty: tell the people who pressed "Notify me".
    if prev_qty <= 0 < new_qty:
        medicine = await db[MEDICINES_COLLECTION].find_one({"pmbi_code": pmbi_code})
        await notify_stock_alert_subscribers(
            pmbi_code=pmbi_code,
            medicine_name=medicine["brand_name"] if medicine else pmbi_code,
            kendra_name=kendra.get("name", "Kendra"),
        )
    logger.info(f"Stock {action}: {pmbi_code}/{batch_number} at kendra {object_id} by {actor}")


def _snapshot(batch: dict) -> dict:
    return {k: (v.isoformat() if isinstance(v, datetime) else v)
            for k, v in batch.items() if k in ("quantity", "selling_price", "expiry_date", "manufacturer")}


async def update_batch(kendra_id: str, pmbi_code: str, batch_number: str, data: BatchUpdateRequest, current_user) -> dict:
    db = get_database()
    object_id = _to_object_id(kendra_id)
    await _verify_kendra_ownership(kendra_id, current_user)

    kendra = None
    for attempt in range(STOCK_WRITE_RETRIES):
        kendra = await _load(db, object_id, attempt)
        stock = kendra.get("stock", [])
        item, batch = _find(stock, pmbi_code, batch_number)
        prev_qty = int(item.get("total_qty", 0))
        before = _snapshot(batch)
        if data.quantity is not None:
            batch["quantity"] = data.quantity
        if data.selling_price is not None:
            batch["selling_price"] = data.selling_price
        if data.expiry_date is not None:
            batch["expiry_date"] = data.expiry_date
        if data.manufacturer is not None:
            batch["manufacturer"] = data.manufacturer
        _recount(item)
        if await save_stock_if_unchanged(db, object_id, stock, kendra.get("stock_version")):
            break
    else:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="The stock was being changed by someone else. Nothing was saved - please try again.")

    await _finish(db, kendra, object_id, "edit", pmbi_code, batch_number, data.reason,
                  before, _snapshot(batch), current_user, prev_qty, item["total_qty"])
    return {"message": "Batch updated.", "pmbi_code": pmbi_code, "batch_number": batch_number,
            "total_qty": item["total_qty"], "status": item["status"]}


async def delete_batch(kendra_id: str, pmbi_code: str, batch_number: str, reason: str, current_user) -> dict:
    db = get_database()
    object_id = _to_object_id(kendra_id)
    await _verify_kendra_ownership(kendra_id, current_user)

    kendra = None
    for attempt in range(STOCK_WRITE_RETRIES):
        kendra = await _load(db, object_id, attempt)
        stock = kendra.get("stock", [])
        item, batch = _find(stock, pmbi_code, batch_number)
        before = _snapshot(batch)
        item["batches"] = [b for b in item["batches"] if b.get("batch_number") != batch_number]
        if item["batches"]:
            _recount(item)
        else:
            stock = [s for s in stock if s.get("pmbi_code") != pmbi_code]   # no batches left: drop the medicine row
        if await save_stock_if_unchanged(db, object_id, stock, kendra.get("stock_version")):
            break
    else:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="The stock was being changed by someone else. Nothing was saved - please try again.")

    await _finish(db, kendra, object_id, "remove", pmbi_code, batch_number, reason,
                  before, None, current_user, 1, 0)
    return {"message": "Batch removed.", "pmbi_code": pmbi_code, "batch_number": batch_number}