from fastapi import APIRouter, Depends, Query

from app.schemas.stock_edit_schemas import BatchUpdateRequest
from app.schemas.token_schema import TokenPayload
from app.services.stock_edit_service import delete_batch, update_batch
from app.utils.constants import UserRole
from app.utils.jwt_helper import require_role

router = APIRouter(prefix="/api/v1/kendras", tags=["Kendra stock corrections"])

_OWNER = require_role([UserRole.PHARMACY, UserRole.ADMIN])


@router.patch("/{kendra_id}/stock/{pmbi_code}/batches/{batch_number:path}")
async def edit_batch(kendra_id: str, pmbi_code: str, batch_number: str, data: BatchUpdateRequest,
                     current_user: TokenPayload = Depends(_OWNER)):
    """Correct a batch's quantity, selling price, expiry date or manufacturer. Needs a reason."""
    return await update_batch(kendra_id, pmbi_code, batch_number, data, current_user)


@router.delete("/{kendra_id}/stock/{pmbi_code}/batches/{batch_number:path}")
async def remove_batch(kendra_id: str, pmbi_code: str, batch_number: str,
                       reason: str = Query(..., min_length=3, max_length=200),
                       current_user: TokenPayload = Depends(_OWNER)):
    """Remove a batch (damaged, recalled, entered by mistake). Needs a reason."""
    return await delete_batch(kendra_id, pmbi_code, batch_number, reason, current_user)