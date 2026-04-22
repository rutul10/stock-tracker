# Strategy Lab

A local-first stock trading strategy testing application. Screens stocks, analyzes options chains, scores trade ideas with a local AI model, and tracks open positions — all running on your laptop with no cloud dependencies and no real trades.

```
┌────────────────────────────────────────┐
│     React + Vite (Bloomberg dark UI)   │
└──────────────┬─────────────────────────┘
               │ HTTP
┌──────────────▼─────────────────────────┐
│     FastAPI + SQLite (backend)         │
│  yfinance · pandas-ta · slowapi        │
└──────────────┬─────────────────────────┘
               │
       ┌───────▼────────┐
       │  Ollama (local) │
       │  gemma4 / etc   │
       └────────────────┘
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.10–3.13 | `brew install python@3.12` |
| Node.js | 18+ | `brew install node` |
| Ollama | latest | `brew install ollama` |

Pull a model (gemma4 recommended if you have it):

```bash
ollama pull gemma4
# or: ollama pull deepseek-r1 / qwen2.5:7b-instruct / llama3.2
```

---

## Setup

```bash
git clone <repo> && cd stock-tracker
make install        # installs backend + frontend deps
cp .env.example backend/.env
# edit backend/.env — set OLLAMA_MODEL to match your pulled model
```

---

## Running

```bash
make dev            # starts both backend (port 8000) and frontend (port 5173)
```

Or separately:

```bash
# Terminal 1
make backend

# Terminal 2
make frontend
```

Open [http://localhost:5173](http://localhost:5173).

---

## Features

| Tab | What it does |
|-----|-------------|
| **SCREENER** | Scans ~100 popular tickers by volume/price change/market cap. Sector filter. Click any row to select a symbol. |
| **OPTIONS** | Full calls + puts chain for any symbol and expiration. ITM rows highlighted. |
| **PROJECT** | AI trade projector — fills in live indicator context and asks the local model to score the trade with probability, risks, and supporting factors. |
| **TRACK** | Persistent trade log in SQLite. Add, close (with exit price → auto P&L), and delete trades. Win rate and total P&L summary. CSV export. |

**Keyboard shortcuts:** `S` Screener · `O` Options · `P` Projector · `T` Tracker · `R` Refresh current tab

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API, DB, and Ollama status |
| POST | `/screener` | Screen stocks (rate-limited 10 req/min) |
| GET | `/options/{symbol}` | Options chain |
| GET | `/indicators/{symbol}` | Technical indicators (RSI, MACD, BB, SMA, EMA, ATR, VWAP) |
| POST | `/projection` | AI trade probability scoring |
| GET | `/tracked-trades` | All trades + summary stats |
| POST | `/tracked-trades` | Add a trade |
| PATCH | `/tracked-trades/{id}` | Close or update a trade |
| DELETE | `/tracked-trades/{id}` | Delete a trade |

---

## Adding a New Trade Projection (step by step)

1. Go to **SCREENER** → click RUN SCREEN → click any stock row to select it
2. Switch to **PROJECT** tab — symbol is pre-filled
3. Choose trade type (stock / call / put / spread / etc.) and direction
4. Fill in entry, target, and stop prices. For options, add strike and expiration.
5. Click **RUN PROJECTION** — the AI fetches live indicators, builds a prompt, and returns a probability score with reasoning.
6. Switch to **TRACK** → click **+ ADD TRADE** — form is pre-filled from the projection.
7. Set quantity and save. The trade appears in the table with open status.
8. When ready to close: click **CLOSE** on the row, enter your exit price — P&L calculates automatically.

---

## Environment Variables

```env
# backend/.env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:latest         # match whatever model you have pulled
DATABASE_URL=sqlite:///./strategy_lab.db
CORS_ORIGINS=http://localhost:5173
POLYGON_API_KEY=                   # optional, unused in current version
```

---

## Tech Stack

**Backend:** Python 3.12 · FastAPI · SQLAlchemy · yfinance · pandas-ta · httpx · slowapi · Pydantic v2

**Frontend:** React 18 · Vite · TypeScript · Tailwind CSS · Recharts · Zustand · Axios

**AI:** Any Ollama-compatible model (gemma4, deepseek-r1, qwen2.5, llama3.2)
