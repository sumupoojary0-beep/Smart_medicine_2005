import re

from pydantic import BaseModel, Field, field_validator

from app.utils.constants import UserRole


class SettingsWrite(BaseModel):
    registration_open: bool
    maintenance_mode: bool
    maintenance_message: str = Field(default="", max_length=200)


class BroadcastRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    message: str = Field(..., min_length=3, max_length=500)
    audience: str = Field(default="all")  # all | users | pharmacies
    type: str = Field(default="info")     # info | success | warning | alert

    @field_validator("title", "message")
    @classmethod
    def _strip(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("Must be at least 3 characters.")
        return value

    @field_validator("audience")
    @classmethod
    def _audience(cls, value: str) -> str:
        if value not in ("all", "users", "pharmacies"):
            raise ValueError("audience must be all, users or pharmacies.")
        return value

    @field_validator("type")
    @classmethod
    def _type(cls, value: str) -> str:
        if value not in ("info", "success", "warning", "alert"):
            raise ValueError("type must be info, success, warning or alert.")
        return value


class AliasWrite(BaseModel):
    brand: str = Field(..., min_length=2, max_length=40)
    ingredients: list[str] = Field(..., min_length=1, max_length=4)

    @field_validator("brand")
    @classmethod
    def _brand(cls, value: str) -> str:
        cleaned = " ".join(re.sub(r"[^a-z\s]", " ", value.lower()).split())
        if not re.fullmatch(r"[a-z]{2,}( [a-z]+)?", cleaned):
            raise ValueError("Brand must be one or two words, letters only (e.g. 'dolo', 'pan d'). Leave out the strength.")
        return cleaned

    @field_validator("ingredients")
    @classmethod
    def _ingredients(cls, value: list[str]) -> list[str]:
        out: list[str] = []
        for item in value:
            cleaned = " ".join(re.sub(r"[^a-z\s]", " ", item.lower()).split())
            if len(cleaned) < 3:
                raise ValueError("Each ingredient must be at least 3 letters.")
            if cleaned not in out:
                out.append(cleaned)
        return out


class AliasTestRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=80)


__all__ = ["SettingsWrite", "BroadcastRequest", "AliasWrite", "AliasTestRequest", "UserRole"]
