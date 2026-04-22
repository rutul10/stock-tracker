from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from database import Base


class TrackedTrade(Base):
    __tablename__ = "tracked_trades"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    trade_type = Column(String, nullable=False)  # stock, call, put, covered_call, cash_secured_put, spread
    direction = Column(String, nullable=False)   # bullish, bearish, neutral
    entry_price = Column(Float, nullable=False)
    target_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    quantity = Column(Integer, nullable=True)
    expiration = Column(String, nullable=True)
    strike = Column(Float, nullable=True)
    probability_at_entry = Column(Float, nullable=True)
    notes = Column(String, nullable=True)

    status = Column(String, default="open")  # open, closed, expired
    entry_date = Column(DateTime, default=datetime.utcnow)
    exit_price = Column(Float, nullable=True)
    exit_date = Column(DateTime, nullable=True)
    pnl = Column(Float, nullable=True)
    pnl_pct = Column(Float, nullable=True)
