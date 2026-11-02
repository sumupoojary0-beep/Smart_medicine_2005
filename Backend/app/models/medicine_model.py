from typing import Optional
from pydantic import Field
from app.models.base_model import BaseDocument


class MedicineModel(BaseDocument):
    """
    A single medicine record combining brand and Jan Aushadhi generic
    info in one document, with savings pre-computed.
    """

    pmbi_code: str = Field(..., min_length=1, max_length=30)
    generic_name: str = Field(..., min_length=2, max_length=200)
    brand_name: str = Field(..., min_length=2, max_length=200)
    composition: str = Field(..., min_length=2, max_length=300)
    category: str = Field(..., min_length=2, max_length=100)
    jan_aushadhi_mrp: float = Field(..., ge=0)
    branded_avg_mrp: float = Field(..., ge=0)
    saving_pct: float = Field(..., ge=0, le=100)
    pack_size: str = Field(..., max_length=50)
    manufacturer: str = Field(..., min_length=2, max_length=150)
    is_active: bool = Field(default=True)
    price_source: Optional[str] = None
    # Official per-unit composition, e.g. "Aceclofenac — 100 mg per tablet; Paracetamol — 325 mg per tablet".
    # Filled by scripts/import_composition.py; only verified entries are stored.
    composition_text: Optional[str] = None
    active_ingredients: list[str] = Field(default_factory=list)
    composition_source: Optional[str] = None