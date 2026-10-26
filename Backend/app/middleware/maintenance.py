"""
Maintenance mode: while ON, every /api request gets 503 except
  * /api/v1/auth/*   (so an admin can still sign in)
  * /api/v1/public/* (so the app can read the maintenance message)
  * requests carrying an ADMIN access token
Reads the setting through a 5-second cache, and fails OPEN if the database
cannot be read (a broken settings read must never take the site down).
"""

from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.services import admin_platform_service
from app.utils.jwt_helper import verify_access_token

_OPEN_PREFIXES = ("/api/v1/auth/", "/api/v1/public/")


class MaintenanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        path = request.url.path
        if request.method == "OPTIONS" or not path.startswith("/api/") or path.startswith(_OPEN_PREFIXES):
            return await call_next(request)
        try:
            status_ = await admin_platform_service.get_public_status()
        except Exception:  # noqa: BLE001
            return await call_next(request)
        if not status_["maintenance_mode"]:
            return await call_next(request)

        header = request.headers.get("authorization", "")
        if header.lower().startswith("bearer "):
            try:
                if str(verify_access_token(header[7:]).role) == "ADMIN":
                    return await call_next(request)
            except Exception:  # noqa: BLE001
                pass
        return JSONResponse(status_code=503, content={"detail": status_["message"], "maintenance": True},
                            headers={"Retry-After": "300"})
