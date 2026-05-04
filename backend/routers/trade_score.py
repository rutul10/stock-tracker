from fastapi import APIRouter, HTTPException

from services.trade_score_engine import compute_trade_score

router = APIRouter()


def _is_valid_symbol(symbol: str) -> bool:
    import yfinance as yf
    try:
        info = yf.Ticker(symbol).info
        return bool(info.get("marketCap") or info.get("shortName"))
    except Exception:
        return False


@router.get("/trade-score/{symbol}")
def get_trade_score(symbol: str):
    """
    Compute a 0-100 trade score for *symbol* from technical indicators.
    No Ollama call required. Cached for 5 minutes.
    """
    symbol = symbol.strip().upper()

    if not symbol.isalpha() or len(symbol) < 1 or len(symbol) > 10:
        raise HTTPException(status_code=422, detail="Symbol must be 1-10 alphabetic characters")

    try:
        result = compute_trade_score(symbol)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        # If yfinance couldn't fetch price data the symbol is likely invalid
        if "No price data" in str(e):
            raise HTTPException(status_code=404, detail=f"Symbol not found or no data available: {symbol}")
        raise HTTPException(status_code=500, detail=f"Error computing trade score: {e}")

    return result
