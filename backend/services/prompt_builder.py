from typing import Optional


def build_projection_prompt(
    symbol: str,
    trade_type: str,
    direction: str,
    entry_price: Optional[float],
    target_price: Optional[float],
    stop_loss: Optional[float],
    expiration: Optional[str],
    strike: Optional[float],
    notes: Optional[str],
    indicators: dict,
    options_summary: dict,
) -> str:
    prices = indicators.get("prices", [])
    last = prices[-1] if prices else {}
    prev = prices[-2] if len(prices) > 1 else {}

    rsi_vals = [v for v in indicators.get("rsi", []) if v is not None]
    macd_vals = [v for v in indicators.get("macd", []) if v is not None]
    macd_sig_vals = [v for v in indicators.get("macd_signal", []) if v is not None]
    sma20_vals = [v for v in indicators.get("sma_20", []) if v is not None]
    sma50_vals = [v for v in indicators.get("sma_50", []) if v is not None]
    atr_vals = [v for v in indicators.get("atr", []) if v is not None]
    bb_upper_vals = [v for v in indicators.get("bb_upper", []) if v is not None]
    bb_lower_vals = [v for v in indicators.get("bb_lower", []) if v is not None]

    rsi = round(rsi_vals[-1], 2) if rsi_vals else "N/A"
    macd = round(macd_vals[-1], 4) if macd_vals else "N/A"
    macd_signal = round(macd_sig_vals[-1], 4) if macd_sig_vals else "N/A"
    sma20 = round(sma20_vals[-1], 2) if sma20_vals else "N/A"
    sma50 = round(sma50_vals[-1], 2) if sma50_vals else "N/A"
    atr = round(atr_vals[-1], 2) if atr_vals else "N/A"
    bb_upper = round(bb_upper_vals[-1], 2) if bb_upper_vals else "N/A"
    bb_lower = round(bb_lower_vals[-1], 2) if bb_lower_vals else "N/A"

    close = last.get("close", "N/A")
    prev_close = prev.get("close", "N/A")
    day_change = ""
    if isinstance(close, (int, float)) and isinstance(prev_close, (int, float)) and prev_close:
        pct = (close - prev_close) / prev_close * 100
        day_change = f" ({pct:+.2f}% today)"

    options_text = ""
    if options_summary.get("atm_iv") is not None:
        options_text = f"""
OPTIONS DATA (nearest expiration):
- ATM implied volatility: {options_summary.get('atm_iv', 'N/A')}
- Call/Put volume ratio: {options_summary.get('cp_ratio', 'N/A')}
- Total open interest: {options_summary.get('total_oi', 'N/A')}"""

    trade_details = f"- Trade type: {trade_type}\n- Direction: {direction}"
    if entry_price is not None:
        trade_details += f"\n- Entry price: ${entry_price}"
    if target_price is not None:
        rr = round((target_price - (entry_price or close)) / abs((entry_price or close) - (stop_loss or close)), 2) if stop_loss else "N/A"
        trade_details += f"\n- Target price: ${target_price}"
        trade_details += f"\n- Risk/reward ratio: {rr}"
    if stop_loss is not None:
        trade_details += f"\n- Stop loss: ${stop_loss}"
    if strike is not None:
        trade_details += f"\n- Strike: ${strike}"
    if expiration:
        trade_details += f"\n- Expiration: {expiration}"
    if notes:
        trade_details += f"\n- Trader notes: {notes}"

    return f"""You are a professional quantitative trading analyst. Analyze this trade and respond with ONLY a JSON object — no prose, no markdown, no explanation outside the JSON.

SYMBOL: {symbol}
CURRENT PRICE: ${close}{day_change}

TECHNICAL INDICATORS (3-month):
- RSI (14): {rsi}
- MACD: {macd} | Signal: {macd_signal}
- SMA 20: {sma20} | SMA 50: {sma50}
- Bollinger Bands: Upper {bb_upper} / Lower {bb_lower}
- ATR (14): {atr}
{options_text}

PROPOSED TRADE:
{trade_details}

Respond with exactly this JSON structure:
{{
  "probability_of_success": <float 0.0-1.0>,
  "confidence": "<low|medium|high>",
  "ai_reasoning": "<2-3 sentence summary of why this trade has the given probability>",
  "risk_reward_ratio": <float, positive number>,
  "suggested_position_size": "<e.g. 1-2% of portfolio>",
  "key_risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "supporting_factors": ["<factor 1>", "<factor 2>", "<factor 3>"]
}}"""
