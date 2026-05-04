from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from services.market_data import fetch_options_chain

router = APIRouter()


@router.get("/options/{symbol}")
def get_options_chain(
    symbol: str,
    expiration: Optional[str] = None,
    min_dte: int = Query(default=30, ge=0),
):
    try:
        return fetch_options_chain(symbol.upper(), expiration, min_dte=min_dte)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
