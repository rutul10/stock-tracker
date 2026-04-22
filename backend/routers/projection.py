import os
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from services.indicators_calc import calculate_indicators
from services.market_data import fetch_options_chain
from services.ollama_client import call_ollama, extract_json
from services.prompt_builder import build_projection_prompt

router = APIRouter()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-r1")


VALID_TRADE_TYPES = {"stock", "call", "put", "covered_call", "cash_secured_put", "spread"}
VALID_DIRECTIONS = {"bullish", "bearish", "neutral"}


class ProjectionRequest(BaseModel):
    symbol: str
    trade_type: str
    direction: str
    entry_price: Optional[float] = None
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    expiration: Optional[str] = None
    strike: Optional[float] = None

    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, v: str) -> str:
        v = v.strip().upper()
        if not v or not v.isalpha() or len(v) > 10:
            raise ValueError("symbol must be 1-10 alphabetic characters")
        return v

    @field_validator("trade_type")
    @classmethod
    def validate_trade_type(cls, v: str) -> str:
        if v not in VALID_TRADE_TYPES:
            raise ValueError(f"trade_type must be one of {VALID_TRADE_TYPES}")
        return v

    @field_validator("direction")
    @classmethod
    def validate_direction(cls, v: str) -> str:
        if v not in VALID_DIRECTIONS:
            raise ValueError(f"direction must be one of {VALID_DIRECTIONS}")
        return v
    notes: Optional[str] = None


def _options_summary(symbol: str) -> dict:
    try:
        chain = fetch_options_chain(symbol)
        calls = chain.get("calls", [])
        puts = chain.get("puts", [])
        all_contracts = calls + puts
        if not all_contracts:
            return {}

        ivs = [c["implied_volatility"] for c in all_contracts if c.get("implied_volatility")]
        atm_iv = round(sum(ivs) / len(ivs), 4) if ivs else None

        call_vol = sum(c["volume"] for c in calls)
        put_vol = sum(c["volume"] for c in puts)
        cp_ratio = round(call_vol / put_vol, 2) if put_vol else None

        total_oi = sum(c["open_interest"] for c in all_contracts)
        return {"atm_iv": atm_iv, "cp_ratio": cp_ratio, "total_oi": total_oi}
    except Exception:
        return {}


@router.post("/projection")
async def create_projection(req: ProjectionRequest):
    symbol = req.symbol.upper()

    try:
        indicators = calculate_indicators(symbol, "3mo")
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Could not fetch data for {symbol}: {e}")

    options_summary = _options_summary(symbol)

    prompt = build_projection_prompt(
        symbol=symbol,
        trade_type=req.trade_type,
        direction=req.direction,
        entry_price=req.entry_price,
        target_price=req.target_price,
        stop_loss=req.stop_loss,
        expiration=req.expiration,
        strike=req.strike,
        notes=req.notes,
        indicators=indicators,
        options_summary=options_summary,
    )

    raw_response = await call_ollama(prompt)

    try:
        result = extract_json(raw_response)
    except (ValueError, Exception) as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {e}")

    return {
        "symbol": symbol,
        "trade_type": req.trade_type,
        "probability_of_success": float(result.get("probability_of_success", 0.5)),
        "confidence": result.get("confidence", "medium"),
        "ai_reasoning": result.get("ai_reasoning", ""),
        "risk_reward_ratio": float(result.get("risk_reward_ratio", 1.0)),
        "suggested_position_size": result.get("suggested_position_size", "1-2% of portfolio"),
        "key_risks": result.get("key_risks", []),
        "supporting_factors": result.get("supporting_factors", []),
        "model_used": OLLAMA_MODEL,
    }
