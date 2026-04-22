import numpy as np
import pandas as pd
import pandas_ta as ta  # noqa: F401 — registers .ta accessor on DataFrame

from services.market_data import fetch_price_history


def _safe_list(series: pd.Series) -> list:
    result = []
    for v in series:
        if v is None or (isinstance(v, float) and (np.isnan(v) or np.isinf(v))):
            result.append(None)
        else:
            result.append(round(float(v), 4))
    return result


def _get_col(df: pd.DataFrame, name: str) -> list:
    if name in df.columns:
        return _safe_list(df[name])
    return [None] * len(df)


def calculate_indicators(symbol: str, period: str = "3mo") -> dict:
    df = fetch_price_history(symbol, period)

    df_ta = df.rename(columns={
        "Open": "open",
        "High": "high",
        "Low": "low",
        "Close": "close",
        "Volume": "volume",
    })
    # Drop extra yfinance columns
    df_ta = df_ta[["open", "high", "low", "close", "volume"]].copy()

    df_ta.ta.sma(length=20, append=True)
    df_ta.ta.sma(length=50, append=True)
    df_ta.ta.ema(length=12, append=True)
    df_ta.ta.ema(length=26, append=True)
    df_ta.ta.macd(fast=12, slow=26, signal=9, append=True)
    df_ta.ta.rsi(length=14, append=True)
    df_ta.ta.bbands(length=20, std=2.0, append=True)
    df_ta.ta.atr(length=14, append=True)

    try:
        df_ta.ta.vwap(append=True)
    except Exception:
        df_ta["VWAP_D"] = None

    prices = []
    for ts, row in df.iterrows():
        date_str = ts.strftime("%Y-%m-%d") if hasattr(ts, "strftime") else str(ts)[:10]
        prices.append({
            "date": date_str,
            "open": round(float(row["Open"]), 4),
            "high": round(float(row["High"]), 4),
            "low": round(float(row["Low"]), 4),
            "close": round(float(row["Close"]), 4),
            "volume": int(row["Volume"]),
        })

    return {
        "symbol": symbol,
        "period": period,
        "prices": prices,
        "sma_20": _get_col(df_ta, "SMA_20"),
        "sma_50": _get_col(df_ta, "SMA_50"),
        "ema_12": _get_col(df_ta, "EMA_12"),
        "ema_26": _get_col(df_ta, "EMA_26"),
        "macd": _get_col(df_ta, "MACD_12_26_9"),
        "macd_signal": _get_col(df_ta, "MACDs_12_26_9"),
        "rsi": _get_col(df_ta, "RSI_14"),
        "bb_upper": _get_col(df_ta, "BBU_20_2.0"),
        "bb_lower": _get_col(df_ta, "BBL_20_2.0"),
        "vwap": _get_col(df_ta, "VWAP_D"),
        "atr": _get_col(df_ta, "ATRr_14"),
    }
