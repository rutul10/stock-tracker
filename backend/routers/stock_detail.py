import os
import re

import httpx
from fastapi import APIRouter, HTTPException, Query

from services.company_data import fetch_company_overview, fetch_earnings
from services.news_client import fetch_news, invalidate_news_cache

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

_SYMBOL_RE = re.compile(r"^[A-Z]{1,10}$")


def _validate_symbol(symbol: str) -> str:
    s = symbol.strip().upper()
    if not _SYMBOL_RE.match(s):
        raise HTTPException(status_code=422, detail=f"Invalid symbol: {symbol!r}")
    return s


@router.get("/models")
async def get_models():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            resp.raise_for_status()
            data = resp.json()
            raw_models = [m.get("name", "") for m in data.get("models", [])]
            # Strip :tag suffix (e.g. "deepseek-r1:latest" → "deepseek-r1")
            models = [re.sub(r":.*$", "", name) for name in raw_models if name]
            return {"models": models}
    except Exception:
        return {"models": []}


@router.get("/stock/{symbol}/detail")
def get_stock_detail(symbol: str):
    s = _validate_symbol(symbol)
    try:
        overview = fetch_company_overview(s)
        earnings = fetch_earnings(s)
        return {**overview, "earnings": earnings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stock/{symbol}/news")
def get_stock_news(symbol: str, refresh: bool = Query(default=False)):
    s = _validate_symbol(symbol)
    if refresh:
        invalidate_news_cache(s)
    try:
        return fetch_news(s, refresh=refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
