## Why

The app currently requires switching between multiple tabs (Screener → Chart → Options → Projector) to research a single stock, forcing context-switching that breaks the analysis flow. There is also no theming, no rich company fundamentals, and the AI projector runs against a single model with minimal context.

## What Changes

- **Theme system**: Add light, dark, and sand (Claude-style warm cream) themes with a toggle in the status bar; preference persisted to localStorage.
- **Screener UX**: Increase base font to 14px, increase row padding, make company name more prominent; symbol becomes a clickable link that opens the detail overlay.
- **Stock detail overlay**: Full-screen overlay triggered by clicking any stock symbol, consolidating chart, company overview, earnings, news, options, DCF calculator, and AI projection in one place.
- **Company overview**: Rich fundamentals panel — revenue, margins, EPS (TTM/Fwd), P/E, EV/EBITDA, FCF, cash/debt, 52w range, short interest, analyst consensus (mean PT, buy/hold/sell ratings).
- **Earnings panel**: Next earnings date + EPS/revenue estimates, last 4 quarters beat/miss history.
- **News integration**: Finnhub-powered news feed (30-min TTL cache) with yfinance fallback if no API key is set; manual refresh button on the overlay.
- **DCF calculator**: Frontend-only sliders for Revenue CAGR, margin expansion, terminal growth rate, and WACC; calculates intrinsic value per share in real time and passes result to AI context.
- **Multi-model AI projection**: Model toggle group (Plutus, DeepSeek-R1, or both); parallel `POST /projection` requests per selected model; results render side-by-side as each resolves; auto-analyze toggle fires on overlay open.
- **Model discovery endpoint**: `GET /models` queries Ollama's `/api/tags` and returns installed model names; frontend populates the toggle group dynamically.
- **New backend endpoints**: `GET /stock/{symbol}/detail`, `GET /stock/{symbol}/news`, `GET /models`.

## Capabilities

### New Capabilities

- `theme-system`: CSS variable-based theme switching (dark / light / sand) with status-bar toggle and localStorage persistence
- `stock-detail-overlay`: Full-screen overlay component consolidating all per-symbol data and actions; triggered from any stock table
- `company-overview`: Rich fundamentals and valuation data fetched from yfinance; cached 1 hour
- `earnings-panel`: Upcoming earnings date, estimates, and historical beat/miss record from yfinance; cached 24 hours
- `stock-news`: Finnhub news feed with 30-min TTL cache and yfinance fallback; per-symbol refresh
- `dcf-calculator`: Frontend-only DCF model with 4 user-adjustable inputs; outputs intrinsic value, upside/downside %; result injected into AI projection context
- `multi-model-projection`: Parallel AI projection across selected Ollama models; side-by-side results; auto-analyze toggle
- `model-discovery`: `GET /models` endpoint + dynamic model toggle group in UI

### Modified Capabilities

- `screener`: Symbol cell becomes a clickable link that triggers the stock detail overlay; font and row density updated

## Impact

**Backend**
- New router: `backend/routers/stock_detail.py` (handles `/stock/{symbol}/detail`, `/stock/{symbol}/news`, `/models`)
- New service: `backend/services/company_data.py` (yfinance fundamentals + TTL caches)
- New service: `backend/services/news_client.py` (Finnhub HTTP + fallback)
- Modified: `backend/routers/projection.py` — accept explicit `model` param
- Modified: `backend/services/ollama_client.py` — accept `model` arg, add `/api/tags` call
- Modified: `backend/services/prompt_builder.py` — add news headlines + earnings + DCF context sections
- New env var: `FINNHUB_API_KEY` (optional; graceful fallback)

**Frontend**
- New component: `frontend/src/components/StockDetail/` (overlay, company overview, earnings, DCF, multi-model projection)
- New hook: `frontend/src/hooks/useStockDetail.ts`
- New hook: `frontend/src/hooks/useModels.ts`
- Modified: `frontend/src/styles/globals.css` — theme variable sets + `[data-theme]` selectors
- Modified: `frontend/src/styles/theme.ts` — theme constants
- Modified: `frontend/src/store/index.ts` — add `theme`, `detailSymbol`, `selectedModels`
- Modified: `frontend/src/App.tsx` — theme toggle in status bar, overlay render
- Modified: `frontend/src/components/Screener/StockTable.tsx` — clickable symbol link
- Modified: `frontend/src/components/Screener/Screener.tsx` — font/density styles

**Dependencies added**
- `finnhub-python` (or raw `httpx` calls — no SDK required, avoids extra dep)
- No new frontend dependencies

**OpenAPI**
- 3 new paths: `GET /stock/{symbol}/detail`, `GET /stock/{symbol}/news`, `GET /models`
- Modified: `POST /projection` request body gains optional `model` field
