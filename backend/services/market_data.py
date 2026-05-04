import hashlib
import json

import numpy as np
import pandas as pd
import yfinance as yf
from cachetools import TTLCache

POPULAR_TICKERS = [
    "AAPL", "MSFT", "AMZN", "NVDA", "GOOGL", "META", "TSLA", "AVGO", "LLY", "JPM",
    "V", "XOM", "UNH", "ORCL", "MA", "HD", "PG", "COST", "JNJ", "MRK",
    "ABBV", "CVX", "BAC", "WMT", "NFLX", "CRM", "AMD", "ADBE", "KO", "PEP",
    "TMO", "ACN", "MCD", "CSCO", "ABT", "QCOM", "DHR", "TXN", "NEE", "CAT",
    "WFC", "MS", "AMGN", "IBM", "GS", "RTX", "INTU", "SPGI", "T", "VZ",
    "INTC", "NOW", "SYK", "LOW", "BA", "BMY", "ISRG", "HON", "ADI", "REGN",
    "C", "BLK", "GILD", "AMT", "DE", "AMAT", "SCHW", "TJX", "KLAC", "PANW",
    "ZTS", "AXP", "DUK", "LRCX", "PGR", "BSX", "CME", "EOG", "PYPL", "GM",
    "F", "UBER", "SNAP", "SPOT", "COIN", "PLTR", "RBLX", "MARA", "SOFI", "RIVN",
    "SPY", "QQQ", "IWM", "GLD", "SLV", "USO", "TLT", "HYG",
]

TOP_10 = POPULAR_TICKERS[:10]

# TTL=180s for popular (static list), TTL=120s for full screener (keyed by params)
_popular_cache: TTLCache = TTLCache(maxsize=1, ttl=180)
_screener_cache: TTLCache = TTLCache(maxsize=50, ttl=120)


def _safe(val) -> float | None:
    if val is None:
        return None
    if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
        return None
    return val


def _safe_int(val) -> int:
    if val is None:
        return 0
    try:
        f = float(val)
        if np.isnan(f) or np.isinf(f):
            return 0
        return int(f)
    except (TypeError, ValueError):
        return 0


def fetch_lightweight(symbols: list[str]) -> list[dict]:
    """Fetch price, change_pct, volume only — no .info calls, fast."""
    raw = yf.download(
        symbols,
        period="5d",
        progress=False,
        auto_adjust=True,
        threads=True,
    )

    if isinstance(raw.columns, pd.MultiIndex):
        close_df = raw["Close"]
        volume_df = raw["Volume"]
    else:
        sym = symbols[0] if symbols else ""
        close_df = raw[["Close"]].rename(columns={"Close": sym})
        volume_df = raw[["Volume"]].rename(columns={"Volume": sym})

    results = []
    for symbol in symbols:
        try:
            closes = close_df[symbol].dropna()
            volumes = volume_df[symbol].dropna()
            if len(closes) < 2:
                price = float(closes.iloc[-1]) if len(closes) == 1 else 0.0
                change_pct = 0.0
            else:
                price = float(closes.iloc[-1])
                prev = float(closes.iloc[-2])
                change_pct = (price - prev) / prev * 100 if prev else 0.0

            vol = _safe_int(volumes.iloc[-1]) if len(volumes) > 0 else 0

            results.append({
                "symbol": symbol,
                "price": round(price, 2),
                "change_pct": round(change_pct, 2),
                "volume": vol,
                "name": None,
                "market_cap": None,
                "sector": None,
                "avg_volume": None,
                "iv_rank": None,
            })
        except Exception:
            results.append({
                "symbol": symbol,
                "price": 0.0,
                "change_pct": 0.0,
                "volume": 0,
                "name": None,
                "market_cap": None,
                "sector": None,
                "avg_volume": None,
                "iv_rank": None,
            })

    return results


def fetch_popular() -> list[dict]:
    """Return top 10 popular tickers with TTL cache."""
    cached = _popular_cache.get("popular")
    if cached is not None:
        return cached
    result = fetch_lightweight(TOP_10)
    _popular_cache["popular"] = result
    return result


def fetch_screener(params: dict) -> list[dict]:
    cache_key = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()
    cached = _screener_cache.get(cache_key)
    if cached is not None:
        return cached

    min_vol = params.get("min_volume", 1_000_000)
    min_price = params.get("min_price", 5.0)
    max_price = params.get("max_price")
    sector_filter = params.get("sector")
    sort_by = params.get("sort_by", "volume")
    limit = params.get("limit", 20)

    raw = yf.download(
        POPULAR_TICKERS,
        period="5d",
        progress=False,
        auto_adjust=True,
        threads=True,
    )

    if isinstance(raw.columns, pd.MultiIndex):
        close_df = raw["Close"]
        volume_df = raw["Volume"]
    else:
        close_df = raw[["Close"]].rename(columns={"Close": POPULAR_TICKERS[0]})
        volume_df = raw[["Volume"]].rename(columns={"Volume": POPULAR_TICKERS[0]})

    candidates = []
    for symbol in POPULAR_TICKERS:
        try:
            closes = close_df[symbol].dropna()
            volumes = volume_df[symbol].dropna()
            if len(closes) < 2 or len(volumes) < 1:
                continue

            price = float(closes.iloc[-1])
            prev_price = float(closes.iloc[-2])
            vol = int(volumes.iloc[-1])
            change_pct = (price - prev_price) / prev_price * 100

            if price < min_price:
                continue
            if max_price and price > max_price:
                continue
            if vol < min_vol:
                continue

            candidates.append({
                "symbol": symbol,
                "price": round(price, 2),
                "change_pct": round(change_pct, 2),
                "volume": vol,
                "name": symbol,
                "market_cap": 0,
                "sector": "Unknown",
                "avg_volume": 0,
                "iv_rank": None,
            })
        except Exception:
            continue

    if sort_by == "price_change":
        candidates.sort(key=lambda x: abs(x["change_pct"]), reverse=True)
    else:
        candidates.sort(key=lambda x: x["volume"], reverse=True)

    fetch_count = min(len(candidates), limit * 3 if sector_filter else limit)
    top_candidates = candidates[:fetch_count]

    results = []
    for r in top_candidates:
        try:
            info = yf.Ticker(r["symbol"]).info
            r["name"] = info.get("shortName") or r["symbol"]
            r["market_cap"] = info.get("marketCap") or 0
            r["sector"] = info.get("sector") or "Unknown"
            r["avg_volume"] = info.get("averageVolume") or 0

            if sector_filter and r["sector"] != sector_filter:
                continue
            results.append(r)
        except Exception:
            if not sector_filter:
                results.append(r)

    if sort_by == "market_cap":
        results.sort(key=lambda x: x["market_cap"], reverse=True)

    result = results[:limit]
    _screener_cache[cache_key] = result
    return result


def fetch_options_chain(symbol: str, expiration: str | None = None, min_dte: int = 30) -> dict:
    from datetime import date, datetime

    ticker = yf.Ticker(symbol)
    try:
        all_expirations = list(ticker.options)
    except Exception:
        all_expirations = []

    if not all_expirations:
        return {"symbol": symbol, "expirations": [], "calls": [], "puts": []}

    today = date.today()
    filter_warning: str | None = None

    def _days_to_expiry(exp_str: str) -> int:
        try:
            exp_date = datetime.strptime(exp_str, "%Y-%m-%d").date()
            return (exp_date - today).days
        except ValueError:
            return 0

    filtered_expirations = [e for e in all_expirations if _days_to_expiry(e) >= min_dte]

    if not filtered_expirations:
        # Fallback: return the nearest available expiry unfiltered
        filtered_expirations = all_expirations[:1]
        filter_warning = f"No expiries meet min_dte={min_dte}; returning nearest available"

    # Honour caller-supplied expiration if it is in our filtered list; otherwise use first
    if expiration and expiration in filtered_expirations:
        exp = expiration
    else:
        exp = filtered_expirations[0]

    chain = ticker.option_chain(exp)

    def parse_contracts(df: pd.DataFrame, contract_type: str) -> list[dict]:
        out = []
        for _, row in df.iterrows():
            out.append({
                "strike": _safe(row.get("strike")),
                "expiration": exp,
                "type": contract_type,
                "bid": _safe(row.get("bid")),
                "ask": _safe(row.get("ask")),
                "last": _safe(row.get("lastPrice")),
                "volume": _safe_int(row.get("volume")),
                "open_interest": _safe_int(row.get("openInterest")),
                "implied_volatility": _safe(row.get("impliedVolatility")),
                "delta": None,
                "gamma": None,
                "theta": None,
                "vega": None,
                "in_the_money": bool(row.get("inTheMoney", False)),
            })
        return out

    response = {
        "symbol": symbol,
        "expirations": filtered_expirations,
        "calls": parse_contracts(chain.calls, "call"),
        "puts": parse_contracts(chain.puts, "put"),
    }

    if filter_warning:
        response["filter_warning"] = filter_warning

    return response


def fetch_price_history(symbol: str, period: str = "3mo") -> pd.DataFrame:
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period)
    if df.empty:
        raise ValueError(f"No price data for {symbol}")
    return df
