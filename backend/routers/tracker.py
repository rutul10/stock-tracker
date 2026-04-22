from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import TrackedTrade

router = APIRouter()

OPTIONS_TYPES = {"call", "put", "covered_call", "cash_secured_put", "spread"}


class TrackedTradeRequest(BaseModel):
    symbol: str
    trade_type: str
    direction: str
    entry_price: float
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    quantity: Optional[int] = 1
    expiration: Optional[str] = None
    strike: Optional[float] = None
    probability_at_entry: Optional[float] = None
    notes: Optional[str] = None


class TrackedTradeUpdate(BaseModel):
    status: Optional[str] = None
    exit_price: Optional[float] = None
    notes: Optional[str] = None


def _multiplier(trade_type: str) -> int:
    return 100 if trade_type in OPTIONS_TYPES else 1


def _compute_pnl(trade: TrackedTrade) -> tuple[Optional[float], Optional[float]]:
    if trade.exit_price is None or trade.entry_price is None:
        return None, None
    qty = trade.quantity or 1
    mult = _multiplier(trade.trade_type)
    pnl = (trade.exit_price - trade.entry_price) * qty * mult
    pnl_pct = (trade.exit_price - trade.entry_price) / trade.entry_price * 100
    return round(pnl, 2), round(pnl_pct, 2)


def _serialize(trade: TrackedTrade) -> dict:
    return {
        "id": trade.id,
        "symbol": trade.symbol,
        "trade_type": trade.trade_type,
        "direction": trade.direction,
        "entry_price": trade.entry_price,
        "target_price": trade.target_price,
        "stop_loss": trade.stop_loss,
        "quantity": trade.quantity,
        "expiration": trade.expiration,
        "strike": trade.strike,
        "probability_at_entry": trade.probability_at_entry,
        "notes": trade.notes,
        "status": trade.status,
        "entry_date": trade.entry_date.isoformat() if trade.entry_date else None,
        "exit_price": trade.exit_price,
        "exit_date": trade.exit_date.isoformat() if trade.exit_date else None,
        "pnl": trade.pnl,
        "pnl_pct": trade.pnl_pct,
    }


@router.get("/tracked-trades")
def get_tracked_trades(db: Session = Depends(get_db)):
    trades = db.query(TrackedTrade).order_by(TrackedTrade.entry_date.desc()).all()
    serialized = [_serialize(t) for t in trades]

    open_trades = [t for t in trades if t.status == "open"]
    closed_trades = [t for t in trades if t.status == "closed"]
    wins = [t for t in closed_trades if t.pnl is not None and t.pnl > 0]
    total_pnl = sum(t.pnl for t in closed_trades if t.pnl is not None)
    win_rate = len(wins) / len(closed_trades) if closed_trades else 0.0

    return {
        "trades": serialized,
        "summary": {
            "total": len(trades),
            "open": len(open_trades),
            "closed": len(closed_trades),
            "win_rate": round(win_rate, 4),
            "total_pnl": round(total_pnl, 2),
        },
    }


@router.post("/tracked-trades", status_code=201)
def create_tracked_trade(req: TrackedTradeRequest, db: Session = Depends(get_db)):
    trade = TrackedTrade(
        symbol=req.symbol.upper(),
        trade_type=req.trade_type,
        direction=req.direction,
        entry_price=req.entry_price,
        target_price=req.target_price,
        stop_loss=req.stop_loss,
        quantity=req.quantity or 1,
        expiration=req.expiration,
        strike=req.strike,
        probability_at_entry=req.probability_at_entry,
        notes=req.notes,
        status="open",
        entry_date=datetime.utcnow(),
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return _serialize(trade)


@router.patch("/tracked-trades/{trade_id}")
def update_tracked_trade(trade_id: int, req: TrackedTradeUpdate, db: Session = Depends(get_db)):
    trade = db.query(TrackedTrade).filter(TrackedTrade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    if req.status is not None:
        trade.status = req.status
    if req.notes is not None:
        trade.notes = req.notes
    if req.exit_price is not None:
        trade.exit_price = req.exit_price
        trade.exit_date = datetime.utcnow()
        trade.pnl, trade.pnl_pct = _compute_pnl(trade)
        if req.status is None:
            trade.status = "closed"

    db.commit()
    db.refresh(trade)
    return _serialize(trade)


@router.delete("/tracked-trades/{trade_id}", status_code=204)
def delete_tracked_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(TrackedTrade).filter(TrackedTrade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(trade)
    db.commit()
