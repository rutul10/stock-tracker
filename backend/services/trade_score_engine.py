"""
Trade Score Engine — computes a 0-100 integer score from 4 technical components:
  RSI (0.25), MACD (0.25), Momentum (0.25), IV (0.25)

Missing components are excluded and remaining weights are re-normalised.
"""
from datetime import datetime
from typing import Optional

from cachetools import TTLCache

from services.indicators_calc import calculate_indicators
from services.market_data import fetch_options_chain

_score_cache: TTLCache = TTLCache(maxsize=100, ttl=300)


# ---------------------------------------------------------------------------
# Component scorers
# ---------------------------------------------------------------------------

def _score_rsi(indicators: dict) -> Optional[float]:
    """RSI 50-70 = 1.0 (optimal bullish). >70 or <30 = 0.0. Linear interpolation."""
    rsi_vals = [v for v in indicators.get("rsi", []) if v is not None]
    if not rsi_vals:
        return None
    rsi = rsi_vals[-1]

    if rsi >= 50 and rsi <= 70:
        return 1.0
    elif rsi > 70:
        # overbought: linearly fade from 1.0 at 70 to 0.0 at 80+
        return max(0.0, 1.0 - (rsi - 70) / 10.0)
    elif rsi < 30:
        return 0.0
    else:
        # 30–50: linearly scale from 0.0 at 30 to 1.0 at 50
        return (rsi - 30) / 20.0


def _score_macd(indicators: dict) -> Optional[float]:
    """1.0 if MACD above signal line, 0.0 if below."""
    macd_vals = [v for v in indicators.get("macd", []) if v is not None]
    signal_vals = [v for v in indicators.get("macd_signal", []) if v is not None]
    if not macd_vals or not signal_vals:
        return None
    return 1.0 if macd_vals[-1] > signal_vals[-1] else 0.0


def _score_momentum(indicators: dict) -> Optional[float]:
    """1.0 if price > SMA20 AND SMA50; 0.5 if only > SMA20; 0.0 if below both."""
    prices = indicators.get("prices", [])
    if not prices:
        return None
    close = prices[-1].get("close")
    if close is None:
        return None

    sma20_vals = [v for v in indicators.get("sma_20", []) if v is not None]
    sma50_vals = [v for v in indicators.get("sma_50", []) if v is not None]

    above_sma20 = (sma20_vals and close > sma20_vals[-1])
    above_sma50 = (sma50_vals and close > sma50_vals[-1])

    if above_sma20 and above_sma50:
        return 1.0
    elif above_sma20:
        return 0.5
    else:
        return 0.0


def _score_iv(symbol: str) -> Optional[float]:
    """
    Derive IV score from ATM IV of nearest expiry options.
    Low IV (<0.1) → 1.0 (cheap options, good to buy).
    High IV (>0.5) → 0.0.
    Linear between 0.1 and 0.5.
    """
    try:
        chain = fetch_options_chain(symbol)
        calls = chain.get("calls", [])
        puts = chain.get("puts", [])
        all_contracts = calls + puts
        if not all_contracts:
            return None

        ivs = [c["implied_volatility"] for c in all_contracts
               if c.get("implied_volatility") is not None]
        if not ivs:
            return None

        atm_iv = sum(ivs) / len(ivs)

        # Normalise: 0.1 → 1.0, 0.5 → 0.0, clamp
        score = 1.0 - (atm_iv - 0.1) / (0.5 - 0.1)
        return max(0.0, min(1.0, score))
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_trade_score(symbol: str) -> dict:
    """
    Compute and cache the trade score for *symbol*.
    Returns the full result dict suitable for the endpoint response.
    """
    key = symbol.upper()
    cached = _score_cache.get(key)
    if cached is not None:
        return cached

    indicators = calculate_indicators(symbol, "3mo")

    components_raw = {
        "rsi": _score_rsi(indicators),
        "macd": _score_macd(indicators),
        "momentum": _score_momentum(indicators),
        "iv": _score_iv(symbol),
    }

    weights = {"rsi": 0.25, "macd": 0.25, "momentum": 0.25, "iv": 0.25}

    # Keep only computable components and re-normalise
    available = {k: v for k, v in components_raw.items() if v is not None}
    if not available:
        weighted_sum = 0.5  # default neutral if nothing is computable
    else:
        total_weight = sum(weights[k] for k in available)
        weighted_sum = sum(available[k] * weights[k] for k in available) / total_weight

    score = round(weighted_sum * 100)

    if score >= 60:
        direction = "bullish"
    elif score >= 40:
        direction = "neutral"
    else:
        direction = "bearish"

    result = {
        "symbol": symbol.upper(),
        "score": score,
        "direction": direction,
        "components": {k: round(v, 4) if v is not None else None for k, v in components_raw.items()},
        "computed_at": datetime.utcnow().isoformat(),
    }

    _score_cache[key] = result
    return result
