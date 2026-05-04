import os
import re

import httpx
from cachetools import TTLCache
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.company_data import fetch_company_overview, fetch_earnings
from services.news_client import fetch_news, invalidate_news_cache
from services.ollama_client import call_ollama

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

_SYMBOL_RE = re.compile(r"^[A-Z]{1,10}$")

# Cache for article summaries (24-hour TTL, up to 500 articles)
_summary_cache: TTLCache = TTLCache(maxsize=500, ttl=86400)


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


class SummarizeRequest(BaseModel):
    headline: str
    summary: str = ""
    url: str = ""


@router.post("/news/summarize")
async def summarize_article(req: SummarizeRequest):
    # Use URL as cache key to avoid re-summarizing
    cache_key = req.url or req.headline
    cached = _summary_cache.get(cache_key)
    if cached:
        return {"summary": cached}

    # Build a prompt for a concise 2-line summary
    context = req.headline
    if req.summary:
        context += f"\n\nArticle excerpt: {req.summary[:500]}"

    prompt = (
        f"Summarize this financial news article in exactly 2 short sentences. "
        f"Be concise and factual. Focus on the key takeaway for a stock trader.\n\n"
        f"Article: {context}\n\n"
        f"2-sentence summary:"
    )

    try:
        raw = await call_ollama(prompt)
        # Clean up LLM output — strip thinking tags, take first 2 sentences
        cleaned = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()
        # Take up to first 2 sentences
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', cleaned) if s.strip()]
        result = " ".join(sentences[:2]) if sentences else cleaned[:200]
        _summary_cache[cache_key] = result
        return {"summary": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {e}")
