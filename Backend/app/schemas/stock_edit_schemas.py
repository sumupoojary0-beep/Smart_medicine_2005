from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class BatchUpdateRequest(BaseModel):
    """Correct one stock batch. Send only the fields that change."""

    quantity: Optional[int] = Field(default=None, ge=0, le=1_000_000)
    selling_price: Optional[float] = Field(default=None, gt=0, le=1_000_000)
    expiry_date: Optional[datetime] = None
    manufacturer: Optional[str] = Field(default=None, min_length=2, max_length=150)
    reason: str = Field(..., min_length=3, max_length=200,
                        description="Why the change is being made (kept in the log).")

    @model_validator(mode="after")
    def at_least_one_change(self):
        if all(v is None for v in (self.quantity, self.selling_price, self.expiry_date, self.manufacturer)):
            raise ValueError("Nothing to change: send quantity, selling_price, expiry_date or manufacturer.")
        return self