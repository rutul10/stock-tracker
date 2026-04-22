from fastapi import APIRouter, HTTPException

from services.indicators_calc import calculate_indicators

router = APIRouter()

VALID_PERIODS = {"1mo", "3mo", "6mo", "1y"}


@router.get("/indicators/{symbol}")
def get_indicators(symbol: str, period: str = "3mo"):
    if period not in VALID_PERIODS:
        period = "3mo"
    try:
        return calculate_indicators(symbol.upper(), period)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
