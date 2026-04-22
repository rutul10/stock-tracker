from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address

from services.market_data import fetch_screener

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

VALID_SORT_BY = {"volume", "price_change", "market_cap"}


class ScreenerRequest(BaseModel):
    min_volume: int = 1_000_000
    min_price: float = 5.0
    max_price: Optional[float] = None
    sector: Optional[str] = None
    sort_by: str = "volume"
    limit: int = 20

    @field_validator("sort_by")
    @classmethod
    def validate_sort_by(cls, v: str) -> str:
        if v not in VALID_SORT_BY:
            raise ValueError(f"sort_by must be one of {VALID_SORT_BY}")
        return v

    @field_validator("limit")
    @classmethod
    def validate_limit(cls, v: int) -> int:
        if v < 1 or v > 100:
            raise ValueError("limit must be between 1 and 100")
        return v

    @field_validator("min_volume")
    @classmethod
    def validate_min_volume(cls, v: int) -> int:
        if v < 0:
            raise ValueError("min_volume must be non-negative")
        return v

    @field_validator("min_price")
    @classmethod
    def validate_min_price(cls, v: float) -> float:
        if v < 0:
            raise ValueError("min_price must be non-negative")
        return v


@router.post("/screener")
@limiter.limit("10/minute")
def screen_stocks(request: Request, body: ScreenerRequest):
    try:
        results = fetch_screener(body.model_dump())
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
