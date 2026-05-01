from datetime import datetime

import numpy as np
import pandas as pd
import yfinance as yf
from cachetools import TTLCache

_company_cache: TTLCache = TTLCache(maxsize=200, ttl=3600)
_earnings_cache: TTLCache = TTLCache(maxsize=200, ttl=86400)


def _safe(val):
    if val is None:
        return None
    try:
        f = float(val)
        if np.isnan(f) or np.isinf(f):
            return None
        return f
    except (TypeError, ValueError):
        return None


def _safe_int(val) -> int | None:
    if val is None:
        return None
    try:
        f = float(val)
        if np.isnan(f) or np.isinf(f):
            return None
        return int(f)
    except (TypeError, ValueError):
        return None


def fetch_company_overview(symbol: str) -> dict:
    cached = _company_cache.get(symbol)
    if cached is not None:
        return cached

    ticker = yf.Ticker(symbol)
    info = ticker.info or {}

    # FCF = operating cash flow - capital expenditures
    fcf = None
    try:
        cf = ticker.cashflow
        if cf is not None and not cf.empty:
            opcf_row = next((r for r in cf.index if "Operating" in str(r) and "Cash" in str(r)), None)
            capex_row = next((r for r in cf.index if "Capital" in str(r) and "Expenditure" in str(r)), None)
            if opcf_row is not None and capex_row is not None:
                opcf = float(cf.loc[opcf_row].iloc[0])
                capex = float(cf.loc[capex_row].iloc[0])
                fcf = opcf - capex
                if np.isnan(fcf) or np.isinf(fcf):
                    fcf = None
    except Exception:
        fcf = None

    revenue = _safe(info.get("totalRevenue"))
    fcf_margin = None
    if fcf is not None and revenue and revenue > 0:
        fcf_margin = round(fcf / revenue, 4)

    result = {
        "symbol": symbol,
        "name": info.get("shortName") or info.get("longName") or symbol,
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "description": info.get("longBusinessSummary"),
        "market_cap": _safe(info.get("marketCap")),
        # Financials
        "revenue": revenue,
        "revenue_growth": _safe(info.get("revenueGrowth")),
        "gross_margin": _safe(info.get("grossMargins")),
        "ebitda_margin": _safe(info.get("ebitdaMargins")),
        "net_margin": _safe(info.get("netMargins")),
        "eps_ttm": _safe(info.get("trailingEps")),
        "eps_fwd": _safe(info.get("forwardEps")),
        "fcf": _safe(fcf),
        "fcf_margin": fcf_margin,
        # Valuation
        "pe_ttm": _safe(info.get("trailingPE")),
        "pe_fwd": _safe(info.get("forwardPE")),
        "peg": _safe(info.get("pegRatio")),
        "ev_ebitda": _safe(info.get("enterpriseToEbitda")),
        "price_to_fcf": _safe(info.get("priceToFreeCashflows")),
        # Balance sheet
        "cash": _safe(info.get("totalCash")),
        "total_debt": _safe(info.get("totalDebt")),
        "shares_outstanding": _safe(info.get("sharesOutstanding")),
        # Technical / market
        "week52_low": _safe(info.get("fiftyTwoWeekLow")),
        "week52_high": _safe(info.get("fiftyTwoWeekHigh")),
        "dma_200": _safe(info.get("twoHundredDayAverage")),
        "short_percent": _safe(info.get("shortPercentOfFloat")),
        # Analyst consensus
        "analyst_target_mean": _safe(info.get("targetMeanPrice")),
        "analyst_target_low": _safe(info.get("targetLowPrice")),
        "analyst_target_high": _safe(info.get("targetHighPrice")),
        "analyst_count": _safe_int(info.get("numberOfAnalystOpinions")),
        "recommendation": info.get("recommendationKey"),
    }

    _company_cache[symbol] = result
    return result


def fetch_earnings(symbol: str) -> dict:
    cached = _earnings_cache.get(symbol)
    if cached is not None:
        return cached

    ticker = yf.Ticker(symbol)
    result: dict = {
        "next_date": None,
        "eps_estimate": None,
        "revenue_estimate": None,
        "history": [],
    }

    # Upcoming earnings
    try:
        cal = ticker.calendar
        if cal is not None:
            if isinstance(cal, dict):
                earnings_date = cal.get("Earnings Date")
                if earnings_date:
                    if hasattr(earnings_date, '__iter__') and not isinstance(earnings_date, str):
                        earnings_date = list(earnings_date)[0]
                    result["next_date"] = str(earnings_date)[:10] if earnings_date else None
                result["eps_estimate"] = _safe(cal.get("EPS Estimate"))
                result["revenue_estimate"] = _safe(cal.get("Revenue Estimate") or cal.get("Revenue Low"))
            elif isinstance(cal, pd.DataFrame) and not cal.empty:
                if "Earnings Date" in cal.index:
                    result["next_date"] = str(cal.loc["Earnings Date"].iloc[0])[:10]
    except Exception:
        pass

    # Historical earnings (last 4 quarters)
    try:
        hist = ticker.earnings_history
        if hist is None or (isinstance(hist, pd.DataFrame) and hist.empty):
            hist = ticker.quarterly_earnings
        if hist is not None and isinstance(hist, pd.DataFrame) and not hist.empty:
            hist = hist.sort_index(ascending=False).head(4)
            quarters = []
            for date_idx, row in hist.iterrows():
                actual = _safe(row.get("Reported EPS") or row.get("epsActual") or row.get("EPS"))
                estimate = _safe(row.get("EPS Estimate") or row.get("epsEstimate"))
                beat = bool(actual is not None and estimate is not None and actual >= estimate)
                surprise_pct = None
                if actual is not None and estimate is not None and estimate != 0:
                    surprise_pct = round((actual - estimate) / abs(estimate) * 100, 2)
                quarters.append({
                    "date": str(date_idx)[:10],
                    "eps_actual": actual,
                    "eps_estimate": estimate,
                    "beat": beat,
                    "surprise_pct": surprise_pct,
                })
            result["history"] = quarters
    except Exception:
        pass

    _earnings_cache[symbol] = result
    return result
