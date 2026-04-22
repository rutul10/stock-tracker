import numpy as np
import pandas as pd
import yfinance as yf

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


def fetch_screener(params: dict) -> list[dict]:
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

    return results[:limit]


def fetch_options_chain(symbol: str, expiration: str | None = None) -> dict:
    ticker = yf.Ticker(symbol)
    try:
        expirations = list(ticker.options)
    except Exception:
        expirations = []

    if not expirations:
        return {"symbol": symbol, "expirations": [], "calls": [], "puts": []}

    exp = expiration if expiration and expiration in expirations else expirations[0]

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

    return {
        "symbol": symbol,
        "expirations": expirations,
        "calls": parse_contracts(chain.calls, "call"),
        "puts": parse_contracts(chain.puts, "put"),
    }


def fetch_price_history(symbol: str, period: str = "3mo") -> pd.DataFrame:
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period)
    if df.empty:
        raise ValueError(f"No price data for {symbol}")
    return df
