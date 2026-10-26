from fastapi import APIRouter, Depends, Query

from app.schemas.admin_platform_schemas import AliasTestRequest, AliasWrite, BroadcastRequest, SettingsWrite
from app.schemas.token_schema import TokenPayload
from app.services import admin_platform_service as svc
from app.utils.constants import UserRole
from app.utils.jwt_helper import require_role

router = APIRouter(tags=["Admin - settings, roles, broadcasts, generic mapping"])

_ADMIN = Depends(require_role([UserRole.ADMIN]))


@router.get("/api/v1/public/status")
async def public_status():
    """No sign-in: lets the app show a maintenance notice or closed-registration message."""
    return await svc.get_public_status()


@router.get("/api/v1/admin/settings")
async def read_settings(current_user: TokenPayload = _ADMIN):
    return await svc.get_settings()


@router.put("/api/v1/admin/settings")
async def write_settings(data: SettingsWrite, current_user: TokenPayload = _ADMIN):
    return await svc.update_settings(data, current_user.sub)


@router.get("/api/v1/admin/roles")
async def roles(current_user: TokenPayload = _ADMIN):
    return await svc.get_roles()


@router.get("/api/v1/admin/notifications/broadcasts")
async def broadcasts(limit: int = Query(default=20, ge=1, le=100), current_user: TokenPayload = _ADMIN):
    return await svc.list_broadcasts(limit)


@router.post("/api/v1/admin/notifications/broadcast", status_code=201)
async def broadcast(data: BroadcastRequest, current_user: TokenPayload = _ADMIN):
    return await svc.send_broadcast(data, current_user.sub)


@router.get("/api/v1/admin/generic-mappings")
async def mappings(q: str = Query(default="", max_length=80), current_user: TokenPayload = _ADMIN):
    return await svc.list_aliases(q)


@router.post("/api/v1/admin/generic-mappings/test")
async def mapping_test(data: AliasTestRequest, current_user: TokenPayload = _ADMIN):
    return await svc.test_alias(data.query)


@router.put("/api/v1/admin/generic-mappings")
async def mapping_save(data: AliasWrite, current_user: TokenPayload = _ADMIN):
    return await svc.save_alias(data, current_user.sub)


@router.delete("/api/v1/admin/generic-mappings/{brand}")
async def mapping_delete(brand: str, current_user: TokenPayload = _ADMIN):
    return await svc.delete_alias(brand, current_user.sub)
