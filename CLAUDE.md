# CLAUDE.md — Stock Strategy Testing App

> This is the single source of truth for this project. Read this entire file before writing any code.
> All decisions about architecture, tooling, design, and phasing are documented here.

---

## 1. Project Overview

A **local-first stock trading strategy testing application** that runs entirely on your laptop. It does NOT execute real trades. Its purpose is to:

- Screen for popular/trending stocks and options to trade
- Analyze options chains for selected symbols
- Project potential trades using a locally hosted AI model (via Ollama) and score them with a probability of success
- Track and monitor multiple open trade projections over time
- Display technical indicators (RSI, MACD, Bollinger Bands, SMA, EMA, ATR, VWAP) for any symbol

---

## 2. Architecture

```
┌────────────────────────────────────────┐
│            React Frontend              │
│   (Bloomberg-style dark dashboard)     │
└──────────────┬─────────────────────────┘
               │ HTTP (OpenAPI contract)
┌──────────────▼─────────────────────────┐
│          FastAPI Backend               │
│  - Stock & options data (yfinance)     │
│  - Technical indicator calculations    │
│  - Ollama AI model integration         │
│  - SQLite trade tracker persistence    │
└──────────────┬─────────────────────────┘
               │
       ┌───────▼────────┐
       │  Ollama (local) │
       │  deepseek-r1   │
       └────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + Vite + TypeScript | UI dashboard |
| Backend | Python 3.11+ / FastAPI | API server |
| API Contract | OpenAPI 3.0 (openapi.yaml) | Single source of truth for all endpoints |
| AI Model | deepseek-r1 via Ollama | Trade projection & probability scoring |
| Financial Data | yfinance (primary), polygon-api-client (optional upgrade) | Stock & options data |
| Database | SQLite via SQLAlchemy | Trade tracker persistence |
| Charts | Recharts | Price history & indicator overlays |
| Styling | Tailwind CSS + custom CSS variables | Bloomberg-style dark theme |
| Code Generation | openapi-generator-cli | Generate FastAPI stubs + React API client from openapi.yaml |

---

## 3. AI Model — Ollama Setup

### Recommended Model
**deepseek-r1** — Strong financial reasoning, structured output, runs well on Apple Silicon and modern laptops with 16GB+ RAM.

### Ollama Setup Commands
```bash
# Install Ollama
brew install ollama        # macOS
# or: curl -fsSL https://ollama.com/install.sh | sh  (Linux)

# Pull the model
ollama pull deepseek-r1

# Verify it runs
ollama run deepseek-r1 "Analyze AAPL as a trade opportunity"

# Ollama runs at: http://localhost:11434
```

### Fallback Models (if deepseek-r1 is too slow on your hardware)
| Model | Size | Best For |
|-------|------|----------|
| deepseek-r1 | ~7B | Best financial reasoning (recommended) |
| mistral | ~7B | Fast structured JSON output |
| llama3.2 | ~3B | Lightweight, good for quick projections |

### How the Backend Calls Ollama
```python
import httpx

OLLAMA_URL = "http://localhost:11434/api/generate"

async def get_trade_projection(symbol: str, context: dict) -> dict:
    prompt = build_projection_prompt(symbol, context)
    response = await httpx.AsyncClient().post(OLLAMA_URL, json={
        "model": "deepseek-r1",
        "prompt": prompt,
        "stream": False
    })
    return parse_projection_response(response.json())
```

---

## 4. OpenAPI Specification

File: `openapi.yaml` — this is the contract between frontend and backend. All endpoints must match this spec exactly.

```yaml
openapi: 3.0.0
info:
  title: Stock Strategy Tester API
  version: 1.0.0
  description: Local AI-powered stock and options trade strategy testing

servers:
  - url: http://localhost:8000
    description: Local development server

paths:
  /screener:
    post:
      summary: Screen for stocks matching criteria
      operationId: screenStocks
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ScreenerRequest'
      responses:
        '200':
          description: List of matching stocks
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ScreenerResponse'

  /options/{symbol}:
    get:
      summary: Get options chain for a symbol
      operationId: getOptionsChain
      parameters:
        - name: symbol
          in: path
          required: true
          schema:
            type: string
        - name: expiration
          in: query
          schema:
            type: string
            format: date
      responses:
        '200':
          description: Options chain data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OptionsChainResponse'

  /indicators/{symbol}:
    get:
      summary: Get technical indicators for a symbol
      operationId: getIndicators
      parameters:
        - name: symbol
          in: path
          required: true
          schema:
            type: string
        - name: period
          in: query
          schema:
            type: string
            default: "3mo"
            enum: ["1mo", "3mo", "6mo", "1y"]
      responses:
        '200':
          description: Technical indicator values
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/IndicatorsResponse'

  /projection:
    post:
      summary: Submit a trade for AI probability scoring
      operationId: createProjection
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProjectionRequest'
      responses:
        '200':
          description: AI trade projection with probability score
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectionResponse'

  /tracked-trades:
    get:
      summary: Get all tracked trades
      operationId: getTrackedTrades
      responses:
        '200':
          description: List of tracked trades
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TrackedTradesResponse'
    post:
      summary: Add a new tracked trade
      operationId: createTrackedTrade
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TrackedTradeRequest'
      responses:
        '201':
          description: Trade created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TrackedTrade'

  /tracked-trades/{id}:
    patch:
      summary: Update a tracked trade (e.g. mark closed)
      operationId: updateTrackedTrade
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TrackedTradeUpdate'
      responses:
        '200':
          description: Updated trade
    delete:
      summary: Delete a tracked trade
      operationId: deleteTrackedTrade
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: Deleted

components:
  schemas:
    ScreenerRequest:
      type: object
      properties:
        min_volume:
          type: integer
          default: 1000000
        min_price:
          type: number
          default: 5.0
        max_price:
          type: number
        sector:
          type: string
        sort_by:
          type: string
          enum: [volume, price_change, market_cap]
          default: volume
        limit:
          type: integer
          default: 20

    ScreenerResponse:
      type: object
      properties:
        results:
          type: array
          items:
            $ref: '#/components/schemas/StockResult'

    StockResult:
      type: object
      properties:
        symbol:
          type: string
        name:
          type: string
        price:
          type: number
        change_pct:
          type: number
        volume:
          type: integer
        market_cap:
          type: number
        sector:
          type: string
        avg_volume:
          type: integer
        iv_rank:
          type: number
          description: Implied volatility rank (0-100)

    OptionsChainResponse:
      type: object
      properties:
        symbol:
          type: string
        expirations:
          type: array
          items:
            type: string
        calls:
          type: array
          items:
            $ref: '#/components/schemas/OptionContract'
        puts:
          type: array
          items:
            $ref: '#/components/schemas/OptionContract'

    OptionContract:
      type: object
      properties:
        strike:
          type: number
        expiration:
          type: string
        type:
          type: string
          enum: [call, put]
        bid:
          type: number
        ask:
          type: number
        last:
          type: number
        volume:
          type: integer
        open_interest:
          type: integer
        implied_volatility:
          type: number
        delta:
          type: number
        gamma:
          type: number
        theta:
          type: number
        vega:
          type: number
        in_the_money:
          type: boolean

    IndicatorsResponse:
      type: object
      properties:
        symbol:
          type: string
        period:
          type: string
        prices:
          type: array
          items:
            $ref: '#/components/schemas/PriceBar'
        sma_20:
          type: array
          items:
            type: number
        sma_50:
          type: array
          items:
            type: number
        ema_12:
          type: array
          items:
            type: number
        ema_26:
          type: array
          items:
            type: number
        macd:
          type: array
          items:
            type: number
        macd_signal:
          type: array
          items:
            type: number
        rsi:
          type: array
          items:
            type: number
        bb_upper:
          type: array
          items:
            type: number
        bb_lower:
          type: array
          items:
            type: number
        vwap:
          type: array
          items:
            type: number
        atr:
          type: array
          items:
            type: number

    PriceBar:
      type: object
      properties:
        date:
          type: string
        open:
          type: number
        high:
          type: number
        low:
          type: number
        close:
          type: number
        volume:
          type: integer

    ProjectionRequest:
      type: object
      required: [symbol, trade_type, direction]
      properties:
        symbol:
          type: string
        trade_type:
          type: string
          enum: [stock, call, put, covered_call, cash_secured_put, spread]
        direction:
          type: string
          enum: [bullish, bearish, neutral]
        entry_price:
          type: number
        target_price:
          type: number
        stop_loss:
          type: number
        expiration:
          type: string
          format: date
        strike:
          type: number
        notes:
          type: string

    ProjectionResponse:
      type: object
      properties:
        symbol:
          type: string
        trade_type:
          type: string
        probability_of_success:
          type: number
          description: 0.0 to 1.0
        confidence:
          type: string
          enum: [low, medium, high]
        ai_reasoning:
          type: string
        risk_reward_ratio:
          type: number
        suggested_position_size:
          type: string
        key_risks:
          type: array
          items:
            type: string
        supporting_factors:
          type: array
          items:
            type: string
        model_used:
          type: string

    TrackedTradeRequest:
      type: object
      required: [symbol, trade_type, direction, entry_price]
      properties:
        symbol:
          type: string
        trade_type:
          type: string
          enum: [stock, call, put, covered_call, cash_secured_put, spread]
        direction:
          type: string
          enum: [bullish, bearish, neutral]
        entry_price:
          type: number
        target_price:
          type: number
        stop_loss:
          type: number
        quantity:
          type: integer
        expiration:
          type: string
          format: date
        strike:
          type: number
        probability_at_entry:
          type: number
        notes:
          type: string

    TrackedTradeUpdate:
      type: object
      properties:
        status:
          type: string
          enum: [open, closed, expired]
        exit_price:
          type: number
        notes:
          type: string

    TrackedTrade:
      allOf:
        - $ref: '#/components/schemas/TrackedTradeRequest'
        - type: object
          properties:
            id:
              type: integer
            status:
              type: string
              enum: [open, closed, expired]
            entry_date:
              type: string
              format: date-time
            exit_price:
              type: number
            exit_date:
              type: string
              format: date-time
            pnl:
              type: number
            pnl_pct:
              type: number

    TrackedTradesResponse:
      type: object
      properties:
        trades:
          type: array
          items:
            $ref: '#/components/schemas/TrackedTrade'
        summary:
          type: object
          properties:
            total:
              type: integer
            open:
              type: integer
            closed:
              type: integer
            win_rate:
              type: number
            total_pnl:
              type: number
```

---

## 5. Project Structure

```
stock-strategy-lab/
├── CLAUDE.md                    # ← This file
├── openapi.yaml                 # API contract
├── .env.example                 # Environment variable template
├── docker-compose.yml           # Optional: run everything together
│
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env
│   ├── database.py              # SQLAlchemy SQLite setup
│   ├── models.py                # DB models (TrackedTrade)
│   ├── schemas.py               # Pydantic schemas (auto-gen from openapi or manual)
│   ├── routers/
│   │   ├── screener.py          # POST /screener
│   │   ├── options.py           # GET /options/{symbol}
│   │   ├── indicators.py        # GET /indicators/{symbol}
│   │   ├── projection.py        # POST /projection
│   │   └── tracker.py          # CRUD /tracked-trades
│   ├── services/
│   │   ├── market_data.py       # yfinance wrapper
│   │   ├── ollama_client.py     # Ollama API wrapper
│   │   ├── indicators_calc.py   # pandas-ta indicator calculations
│   │   └── prompt_builder.py   # Build prompts for deepseek-r1
│   └── tests/
│       └── test_endpoints.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/                 # Generated API client (from openapi-generator)
│       ├── components/
│       │   ├── Screener/
│       │   │   ├── Screener.tsx
│       │   │   └── StockTable.tsx
│       │   ├── OptionsChain/
│       │   │   ├── OptionsChain.tsx
│       │   │   └── OptionsTable.tsx
│       │   ├── Indicators/
│       │   │   ├── Indicators.tsx
│       │   │   └── PriceChart.tsx
│       │   ├── Projector/
│       │   │   ├── Projector.tsx
│       │   │   └── ProbabilityCard.tsx
│       │   ├── Tracker/
│       │   │   ├── TradeTracker.tsx
│       │   │   └── TradeRow.tsx
│       │   └── shared/
│       │       ├── Badge.tsx
│       │       ├── Spinner.tsx
│       │       └── ErrorBanner.tsx
│       ├── hooks/
│       │   ├── useScreener.ts
│       │   ├── useOptions.ts
│       │   ├── useIndicators.ts
│       │   ├── useProjection.ts
│       │   └── useTrades.ts
│       ├── store/               # Zustand global state
│       │   └── index.ts
│       └── styles/
│           ├── globals.css      # CSS variables, Bloomberg dark theme
│           └── theme.ts
```

---

## 6. UI Design Spec

### Theme: Bloomberg Terminal — Dark, Dense, Precise

| Token | Value |
|-------|-------|
| Background | `#0a0a0f` |
| Surface | `#111118` |
| Border | `#1e1e2e` |
| Accent Green | `#00ff88` (positive, bullish) |
| Accent Red | `#ff3366` (negative, bearish) |
| Accent Blue | `#00aaff` (neutral, info) |
| Text Primary | `#e8e8f0` |
| Text Muted | `#6b6b8a` |
| Font — Numbers | `Inconsolata` (monospace) |
| Font — UI Labels | `IBM Plex Mono` |
| Font — Headings | `Bebas Neue` |

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  STRATEGY LAB    [SCREENER] [OPTIONS] [PROJECT] [TRACK]  │  ← Nav
├────────────────────┬────────────────────────────────────┤
│                    │                                    │
│   Stock Screener   │     Price Chart + Indicators       │
│   (table, sortable)│     (Recharts, candlestick)        │
│                    │                                    │
├────────────────────┼────────────────────────────────────┤
│                    │                                    │
│   Options Chain    │   AI Trade Projector               │
│   (calls | puts)   │   + Probability Score Card         │
│                    │                                    │
├────────────────────┴────────────────────────────────────┤
│              Trade Tracker (full width table)           │
└─────────────────────────────────────────────────────────┘
```

### Table Conventions (all tables in this app)
- Dark background, monospaced numbers, right-aligned numeric columns
- Color-coded: green for positive, red for negative
- Sortable columns with keyboard support
- Hover row highlight with subtle glow
- Pagination or virtual scroll for large datasets

---

## 7. Phase-by-Phase Build Plan

> Each phase is a self-contained Claude Code session. Provide this CLAUDE.md + the phase prompt to Claude Code.

---

### Phase 1 — Scaffold & API Contract
**Goal:** Skeleton is runnable. No real data yet.

**Claude Code Prompt:**
```
Read CLAUDE.md fully. Implement Phase 1:
- Create the full project directory structure as defined in Section 5
- Set up FastAPI app in backend/main.py with CORS, health check endpoint GET /health
- Register all routers with placeholder 501 Not Implemented responses
- Set up SQLAlchemy + SQLite in database.py and models.py for TrackedTrade
- Set up React + Vite + TypeScript in frontend/ with Tailwind CSS
- Apply the Bloomberg dark theme CSS variables from Section 6 to globals.css
- Create App.tsx with tab navigation: Screener, Options, Projector, Tracker
- Each tab renders a placeholder component with the component name displayed
- Create requirements.txt and package.json with all dependencies
- Create .env.example with OLLAMA_URL, DATABASE_URL, POLYGON_API_KEY (optional)
✅ Done when: uvicorn backend.main:app starts, GET /health returns 200, React renders nav tabs
```

**Dependencies (backend):**
```
fastapi uvicorn sqlalchemy aiofiles python-dotenv httpx yfinance pandas pandas-ta pydantic
```

**Dependencies (frontend):**
```
react react-dom typescript vite tailwindcss recharts zustand axios
```

---

### Phase 2 — Market Data Layer
**Goal:** Real stock and options data flowing through the API.

**Claude Code Prompt:**
```
Read CLAUDE.md fully. Phase 1 is complete. Implement Phase 2:
- Implement backend/services/market_data.py using yfinance to:
  - fetch_screener(request): Return top stocks by volume/change using yfinance tickers
  - fetch_options_chain(symbol, expiration): Return full calls + puts chain with Greeks
  - fetch_price_history(symbol, period): Return OHLCV bars
- Implement backend/routers/screener.py — POST /screener using market_data service
- Implement backend/routers/options.py — GET /options/{symbol}
- Implement backend/services/indicators_calc.py using pandas-ta:
  - Calculate: SMA20, SMA50, EMA12, EMA26, MACD, RSI, Bollinger Bands, VWAP, ATR
- Implement backend/routers/indicators.py — GET /indicators/{symbol}
- Wire up frontend Screener component to call POST /screener and render StockTable
- Wire up frontend OptionsChain component to call GET /options/{symbol}
- Wire up frontend Indicators component to render PriceChart with Recharts
✅ Done when: Screener returns real stocks, options chain loads for any symbol, chart renders with indicators
```

---

### Phase 3 — Ollama AI Projection Engine
**Goal:** AI trade projections with probability scores using deepseek-r1.

**Claude Code Prompt:**
```
Read CLAUDE.md fully. Phases 1-2 are complete. Implement Phase 3:
- Implement backend/services/ollama_client.py:
  - async post to http://localhost:11434/api/generate
  - handle streaming=False, parse JSON response
  - include error handling if Ollama is not running (return 503 with clear message)
- Implement backend/services/prompt_builder.py:
  - build_projection_prompt(symbol, trade_type, direction, entry, target, stop, indicators, options_data)
  - Prompt must instruct deepseek-r1 to return structured JSON with:
    probability_of_success, confidence, ai_reasoning, risk_reward_ratio,
    suggested_position_size, key_risks[], supporting_factors[]
- Implement backend/routers/projection.py — POST /projection:
  - Fetch current indicators and options data for the symbol
  - Build prompt with full context
  - Call Ollama, parse and validate response
  - Return ProjectionResponse schema
- Implement frontend Projector component:
  - Form: symbol, trade type, direction, entry, target, stop, expiration, strike, notes
  - Submit → call POST /projection
  - Render ProbabilityCard: large probability score, confidence badge, AI reasoning,
    key risks list, supporting factors list, risk/reward ratio
✅ Done when: User fills form, clicks Project, sees AI probability score and reasoning
```

---

### Phase 4 — Trade Tracker Persistence
**Goal:** Save, view, update, and delete tracked trades in SQLite.

**Claude Code Prompt:**
```
Read CLAUDE.md fully. Phases 1-3 are complete. Implement Phase 4:
- Ensure TrackedTrade SQLAlchemy model in models.py matches TrackedTrade schema in openapi.yaml
- Implement all CRUD operations in backend/routers/tracker.py:
  - GET /tracked-trades → return all trades + summary stats (win rate, total P&L)
  - POST /tracked-trades → create trade, auto-set entry_date
  - PATCH /tracked-trades/{id} → update status, exit_price, compute pnl and pnl_pct
  - DELETE /tracked-trades/{id} → remove trade
- pnl = (exit_price - entry_price) * quantity for stocks; handle options multiplier (x100)
- Implement frontend TradeTracker component:
  - Full-width table showing all tracked trades
  - Columns: Symbol, Type, Direction, Entry, Target, Stop, Prob%, Status, P&L, P&L%, Actions
  - Color-code P&L green/red
  - "Add Trade" button — opens form pre-filled from last Projector run if available
  - "Close Trade" button per row — prompts exit price, updates via PATCH
  - "Delete" button per row
  - Summary bar: Total Trades | Open | Win Rate | Total P&L
✅ Done when: Trades persist across app restarts, P&L calculates correctly, summary stats update
```

---

### Phase 5 — Full Frontend Polish
**Goal:** Production-quality UI, all components wired, Bloomberg aesthetic fully applied.

**Claude Code Prompt:**
```
Read CLAUDE.md fully. Phases 1-4 are complete. Implement Phase 5:
- Apply full Bloomberg dark theme from Section 6 across all components
- Fonts: load Inconsolata, IBM Plex Mono, Bebas Neue from Google Fonts
- Screener: make columns sortable, add sector filter dropdown, add IV Rank column
- OptionsChain: side-by-side calls | puts layout, highlight ITM rows, color-code Greeks
- Indicators chart: candlestick chart using Recharts ComposedChart, toggle each indicator on/off,
  RSI in separate sub-chart below main chart, MACD in third sub-chart
- Projector: animate probability score (count up from 0), color code by confidence
- Tracker: add sparkline P&L column, export to CSV button
- All tables: right-align numbers, monospace font, green/red color coding
- Add loading spinners and error banners for all API calls
- Add a top status bar showing: market status (open/closed), last refresh time, Ollama status (ping /health)
- Keyboard shortcut: press S to focus screener search, R to refresh current tab
✅ Done when: App looks and feels like a professional trading terminal
```

---

### Phase 6 — Hardening & README
**Goal:** Error handling, validation, config, documentation.

**Claude Code Prompt:**
```
Read CLAUDE.md fully. Phases 1-5 are complete. Implement Phase 6:
- Add input validation to all FastAPI endpoints using Pydantic validators
- Add global exception handlers in main.py for 404, 422, 500
- Add rate limiting on screener endpoint (max 10 req/min) using slowapi
- Add GET /health endpoint that checks: SQLite connection, Ollama reachability
- Frontend: add React Error Boundaries around each major component
- Frontend: add retry logic (3 attempts) for failed API calls using axios interceptors
- Create README.md with:
  - Prerequisites (Python 3.11+, Node 18+, Ollama)
  - Setup instructions (clone, install deps, pull model, run backend, run frontend)
  - Table of all features
  - Screenshot placeholder
  - Architecture diagram (ASCII)
  - How to add a new trade projection workflow (step by step)
- Create Makefile with targets: install, dev, build, test, clean
✅ Done when: App handles all error cases gracefully, README covers full setup from scratch
```

---

## 8. Key Libraries Reference

| Library | Version | Purpose |
|---------|---------|---------|
| fastapi | latest | Backend framework |
| uvicorn | latest | ASGI server |
| sqlalchemy | 2.x | ORM for SQLite |
| yfinance | latest | Stock & options data |
| pandas | latest | Data manipulation |
| pandas-ta | latest | Technical indicators |
| httpx | latest | Async HTTP (Ollama calls) |
| pydantic | v2 | Schema validation |
| slowapi | latest | Rate limiting |
| react | 18 | UI framework |
| vite | latest | Frontend build tool |
| typescript | 5.x | Type safety |
| tailwindcss | 3.x | Styling |
| recharts | latest | Charts |
| zustand | latest | State management |
| axios | latest | HTTP client |

---

## 9. Environment Variables

```env
# backend/.env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1
DATABASE_URL=sqlite:///./strategy_lab.db
POLYGON_API_KEY=           # Optional, for upgraded data
CORS_ORIGINS=http://localhost:5173

# frontend/.env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 10. Developer Notes for Claude Code

- **Always read this entire file before writing any code**
- **Never deviate from the OpenAPI spec** in Section 4 — it is the single contract
- **Never use placeholder/mock data** in Phase 2 onwards — always use real yfinance data
- **Ollama must be treated as optional** — if it's unreachable, return a 503 with a helpful message, never crash
- **All numbers in the UI must use Inconsolata font and be right-aligned**
- **Tables are the primary display format** — prefer tables over cards for data
- **Each phase must be independently runnable** — don't create cross-phase dependencies that break earlier phases
- **SQLite DB file** must be gitignored
- **No API keys should ever be hardcoded** — always read from .env
