import os
from datetime import datetime, timedelta

import httpx
import yfinance as yf
from cachetools import TTLCache
from dotenv import load_dotenv

load_dotenv()

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
FINNHUB_BASE = "https://finnhub.io/api/v1"

_news_cache: TTLCache = TTLCache(maxsize=200, ttl=1800)


def _fetch_news_finnhub(symbol: str) -> list[dict]:
    to_date = datetime.now().strftime("%Y-%m-%d")
    from_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    resp = httpx.get(
        f"{FINNHUB_BASE}/company-news",
        params={"symbol": symbol, "from": from_date, "to": to_date, "token": FINNHUB_API_KEY},
        timeout=10.0,
    )
    resp.raise_for_status()
    articles = resp.json()
    if not isinstance(articles, list):
        return []
    out = []
    for a in articles[:10]:
        out.append({
            "headline": a.get("headline", ""),
            "summary": a.get("summary", ""),
            "source": a.get("source", ""),
            "url": a.get("url", ""),
            "datetime": a.get("datetime", 0),
        })
    return out


def _fetch_news_yfinance(symbol: str) -> list[dict]:
    ticker = yf.Ticker(symbol)
    news = ticker.news or []
    out = []
    for a in news[:10]:
        content = a.get("content", {})
        # Parse pubDate ISO string to Unix timestamp (seconds)
        pub_date = content.get("pubDate", "") or ""
        ts = 0
        if pub_date:
            try:
                ts = int(datetime.fromisoformat(pub_date.replace("Z", "+00:00")).timestamp())
            except (ValueError, TypeError):
                ts = 0
        elif a.get("providerPublishTime"):
            ts = int(a["providerPublishTime"])
        out.append({
            "headline": content.get("title", a.get("title", "")),
            "summary": content.get("summary", a.get("summary", "")),
            "source": content.get("provider", {}).get("displayName", a.get("publisher", "")),
            "url": content.get("canonicalUrl", {}).get("url", a.get("link", "")),
            "datetime": ts,
        })
    return out


def fetch_news(symbol: str, refresh: bool = False) -> dict:
    if not refresh:
        cached = _news_cache.get(symbol)
        if cached is not None:
            return cached

    articles = []
    source = "yfinance"

    if FINNHUB_API_KEY:
        try:
            articles = _fetch_news_finnhub(symbol)
            source = "finnhub"
        except Exception:
            articles = _fetch_news_yfinance(symbol)
            source = "yfinance"
    else:
        articles = _fetch_news_yfinance(symbol)

    result = {
        "articles": articles,
        "source": source,
        "cached_at": datetime.now().isoformat(),
    }
    _news_cache[symbol] = result
    return result


def invalidate_news_cache(symbol: str) -> None:
    _news_cache.pop(symbol, None)
