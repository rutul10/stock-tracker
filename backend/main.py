import os
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from database import engine
import models
from routers import screener, options, indicators, projection, tracker, stock_detail, trade_score, projection_chat

load_dotenv()

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Stock Strategy Tester API",
    version="1.0.0",
    description="Local AI-powered stock and options trade strategy testing",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(screener.router)
app.include_router(options.router)
app.include_router(indicators.router)
app.include_router(projection.router)
app.include_router(tracker.router)
app.include_router(stock_detail.router)
app.include_router(trade_score.router, tags=["trade-score"])
app.include_router(projection_chat.router, tags=["projection-chat"])


@app.get("/health")
async def health():
    status: dict = {"api": "ok", "database": "ok", "ollama": "unreachable"}

    try:
        from database import SessionLocal
        import sqlalchemy
        db = SessionLocal()
        db.execute(sqlalchemy.text("SELECT 1"))
        db.close()
    except Exception:
        status["database"] = "error"

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            if resp.status_code == 200:
                status["ollama"] = "ok"
    except Exception:
        pass

    return status


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"error": "Not found"})


@app.exception_handler(422)
async def validation_handler(request: Request, exc):
    return JSONResponse(status_code=422, content={"error": "Validation error", "detail": str(exc)})


@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    return JSONResponse(status_code=500, content={"error": "Internal server error"})
