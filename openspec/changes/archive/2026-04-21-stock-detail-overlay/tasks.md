## 1. Theme System

- [x] 1.1 Add `--nav-accent` CSS custom property to the existing `:root` block in `frontend/src/styles/globals.css`
- [x] 1.2 Add `[data-theme="dark"]` rule set to `globals.css` with all current dark values (makes dark the explicit default)
- [x] 1.3 Add `[data-theme="light"]` rule set to `globals.css` with light palette values
- [x] 1.4 Add `[data-theme="sand"]` rule set to `globals.css` with sand/cream palette (Claude-style), using `#16a34a` for `--accent-green` and `#d97706` for `--nav-accent`
- [x] 1.5 Update `frontend/src/styles/theme.ts` to export all three theme palettes as typed constants
- [x] 1.6 Add `theme: 'dark' | 'light' | 'sand'` and `setTheme(t)` to Zustand store in `frontend/src/store/index.ts`; include in `partialize` so it persists to localStorage
- [x] 1.7 Add `useEffect` in `App.tsx` that calls `document.documentElement.setAttribute('data-theme', theme)` when `theme` changes (runs once on mount with stored value)
- [x] 1.8 Add theme toggle control to the status bar in `App.tsx` — three pill buttons: DARK / LIGHT / SAND; active pill highlighted with `--nav-accent`

## 2. Screener UX Improvements

- [x] 2.1 Increase global base font from `13px` to `14px` in `globals.css` body rule
- [x] 2.2 Update `StockTable.tsx` row `td` padding from `8px 12px` to `10px 14px`
- [x] 2.3 Update company name sub-line font size from `10px` to `12px` in the symbol cell
- [x] 2.4 Update `thStyle` in `StockTable.tsx` to match new padding (`10px 14px`)
- [x] 2.5 Add `VOL/AVG` column to `StockTable.tsx` — renders `(volume / avg_volume).toFixed(1) + 'x'` when `avg_volume` is non-null; colored green if > 1.2x, red if < 0.8x, muted otherwise; shows `—` for popular/watchlist views where `avg_volume` is null
- [x] 2.6 Make symbol cell a clickable link in `StockTable.tsx` — add `onOpenDetail?: (symbol: string) => void` prop; ticker text styled with `--accent-blue` and underline on hover; click calls `onOpenDetail` and stops event propagation so row-select doesn't also fire
- [x] 2.7 Wire `onOpenDetail` in `Screener.tsx` → calls `setDetailSymbol` from store (to be added in task 3.2)

## 3. Zustand Store — New State

- [x] 3.1 Add `detailSymbol: string | null` and `setDetailSymbol(s: string | null)` to store; do NOT persist (overlay state is ephemeral)
- [x] 3.2 Add `selectedModels: string[]` and `setSelectedModels(models: string[])` to store; persist to localStorage
- [x] 3.3 Add `autoAnalyze: boolean` and `setAutoAnalyze(v: boolean)` to store; persist to localStorage; default `false`
- [x] 3.4 Add `availableModels: string[]` and `setAvailableModels(models: string[])` to store; do NOT persist

## 4. Backend — Model Discovery

- [x] 4.1 Add `GET /models` route to a new file `backend/routers/stock_detail.py` — calls `http://localhost:11434/api/tags` via `httpx`, strips `:latest`/tag suffixes from model names, returns `{ "models": [...] }`; returns `{ "models": [] }` (200) if Ollama is unreachable
- [x] 4.2 Register `stock_detail` router in `backend/main.py`

## 5. Backend — Company & Earnings Data

- [x] 5.1 Create `backend/services/company_data.py` with two TTLCache instances: `_company_cache` (TTL=3600) and `_earnings_cache` (TTL=86400)
- [x] 5.2 Implement `fetch_company_overview(symbol: str) -> dict` in `company_data.py` using `yf.Ticker(symbol).info`; extract all required fields with `.get(key, None)`; calculate `fcf = operatingCashFlow - capitalExpenditures` from `ticker.cashflow` if available
- [x] 5.3 Implement `fetch_earnings(symbol: str) -> dict` in `company_data.py` using `ticker.calendar`, `ticker.earnings_dates`; return `{ next_date, eps_estimate, revenue_estimate, history: [{date, eps_actual, eps_estimate, beat}] }` for last 4 quarters
- [x] 5.4 Add `GET /stock/{symbol}/detail` to `backend/routers/stock_detail.py` — calls `fetch_company_overview` and `fetch_earnings`, merges results, returns combined response
- [x] 5.5 Add `symbol` path validator to the detail endpoint — strip, uppercase, max 10 alpha chars; return 422 for invalid symbols

## 6. Backend — News Service

- [x] 6.1 Create `backend/services/news_client.py` with `_news_cache: TTLCache(maxsize=200, ttl=1800)`
- [x] 6.2 Implement `_fetch_news_finnhub(symbol: str) -> list[dict]` — `httpx.get` to `https://finnhub.io/api/v1/company-news` with `symbol`, `from` (30 days ago), `to` (today), `token=FINNHUB_API_KEY`; normalize response to `{ headline, summary, source, url, datetime }` shape; return up to 10 articles
- [x] 6.3 Implement `_fetch_news_yfinance(symbol: str) -> list[dict]` — `yf.Ticker(symbol).news`; normalize to same shape as Finnhub response
- [x] 6.4 Implement `fetch_news(symbol: str, refresh: bool = False) -> dict` — checks cache (skip if `refresh=True`), calls Finnhub if key set else yfinance, falls back to yfinance on Finnhub error; returns `{ articles: [...], source: "finnhub"|"yfinance", cached_at: ISO timestamp }`
- [x] 6.5 Add `GET /stock/{symbol}/news` to `backend/routers/stock_detail.py` — accepts optional `refresh: bool = False` query param; calls `fetch_news(symbol, refresh)`

## 7. Backend — Projection Enhancements

- [x] 7.1 Update `call_ollama(prompt, model=None)` in `backend/services/ollama_client.py` to accept an optional `model` argument; use it in the Ollama request body, falling back to `OLLAMA_MODEL` env var
- [x] 7.2 Add optional `model: str | None` field to `ProjectionRequest` in `backend/routers/projection.py`; pass it to `call_ollama`; include it in the `model_used` response field
- [x] 7.3 Add optional `news_context: list[str] | None`, `earnings_context: dict | None`, and `dcf_context: dict | None` fields to `ProjectionRequest`
- [x] 7.4 Update `build_projection_prompt` in `backend/services/prompt_builder.py` to append NEWS CONTEXT, EARNINGS CONTEXT, and DCF CONTEXT sections when those fields are present in the request

## 8. OpenAPI Contract

- [x] 8.1 Add `GET /models` path to `openapi.yaml` with response schema `{ models: string[] }`
- [x] 8.2 Add `GET /stock/{symbol}/detail` path to `openapi.yaml` with full `StockDetailResponse` schema covering all company overview and earnings fields
- [x] 8.3 Add `GET /stock/{symbol}/news` path to `openapi.yaml` with `NewsResponse` schema and `refresh` query param
- [x] 8.4 Add optional `model`, `news_context`, `earnings_context`, `dcf_context` fields to `ProjectionRequest` schema in `openapi.yaml`

## 9. Frontend — Hooks

- [x] 9.1 Create `frontend/src/hooks/useModels.ts` — fetches `GET /models` on first call, stores result via `setAvailableModels` in the store; returns `{ models, loading }`
- [x] 9.2 Create `frontend/src/hooks/useStockDetail.ts` — fetches `GET /stock/{symbol}/detail` and `GET /stock/{symbol}/news` in parallel when `symbol` changes; returns `{ detail, news, loadingDetail, loadingNews, errorDetail, errorNews, refreshNews }`; `refreshNews` calls `GET /stock/{symbol}/news?refresh=true`

## 10. Frontend — Stock Detail Overlay Component

- [x] 10.1 Create `frontend/src/components/StockDetail/` directory with `StockDetailOverlay.tsx` as the root component
- [x] 10.2 Implement overlay container — fixed-position full-screen div with `z-index: 1000`, `overflow-y: auto`, `background: var(--bg)`; ESC key listener clears `detailSymbol`; `body` overflow locked to `hidden` while overlay is open
- [x] 10.3 Implement overlay header bar — shows: "← BACK" button, symbol ticker (large, `--accent-green`), company name, current price + change %, watchlist toggle (`[⭐]` adds/removes from watchlist), theme-aware styling
- [x] 10.4 Create `CompanyOverviewPanel.tsx` — renders fundamentals in 5 groups (Financials, Valuation, Balance Sheet, Technical, Analyst Consensus); null values show `—`; numbers formatted with existing `fmt()` helper; uses `useStockDetail` hook data
- [x] 10.5 Create `EarningsPanel.tsx` — renders next earnings date + EPS/revenue estimates; renders last 4 quarters as ✅/❌ with actual vs estimate EPS and surprise %; shows "No earnings data" when empty
- [x] 10.6 Create `NewsPanel.tsx` — renders article list (headline + source + relative time); each headline is an `<a>` to the article URL (`target="_blank"`); shows "cached X min ago" badge; includes REFRESH button; shows empty state
- [x] 10.7 Create `DCFCalculator.tsx` — four `<input type="range">` sliders with number input companions for CAGR, margin expansion, terminal growth, WACC; `useMemo` for intrinsic value calculation; shows IV vs current price with upside/downside colored bar; passes `dcfContext` up to projection panel
- [x] 10.8 Create `MultiModelProjection.tsx` — model toggle buttons (from `useModels`), SELECT ALL button, AUTO ANALYZE toggle, ANALYZE button; fires parallel `POST /projection` requests via `Promise.allSettled`; per-model result cards rendered side-by-side; per-model spinner with elapsed time counter; error state per card
- [x] 10.9 Compose all panels into `StockDetailOverlay.tsx` — two-column layout (chart + overview/earnings left, news + DCF + projection right) with responsive stacking; load `useStockDetail` at this level and distribute data to children

## 11. Frontend — App Integration

- [x] 11.1 Import and render `<StockDetailOverlay />` in `App.tsx` — conditionally shown when `detailSymbol !== null`; rendered outside the `<main>` scroll context as a sibling
- [x] 11.2 Verify ESC key handler in `App.tsx` does not conflict with the overlay's own ESC handler (overlay's handler takes priority when open)

## 12. Environment & Documentation

- [x] 12.1 Add `FINNHUB_API_KEY=` (empty, optional) to `backend/.env.example` with a comment linking to finnhub.io/register
- [x] 12.2 Update `Makefile` if needed — no new targets required but verify `make dev` still works with the new router registered

## 13. Verification

- [x] 13.1 Start backend; confirm `GET /models` returns installed Ollama models and returns `[]` gracefully when Ollama is not running
- [x] 13.2 Confirm `GET /stock/AAPL/detail` returns company fundamentals with FCF calculated; confirm second call is faster (cache hit)
- [x] 13.3 Confirm `GET /stock/AAPL/news` returns articles; confirm `?refresh=true` bypasses cache; confirm graceful fallback when no `FINNHUB_API_KEY` is set
- [x] 13.4 Confirm `POST /projection` with explicit `model: "plutus"` returns `model_used: "plutus"` and works without `model` field (backwards compatible)
- [x] 13.5 Start frontend; click a stock symbol in the Popular screener; confirm overlay opens with all sections loading
- [x] 13.6 Verify DCF calculator updates intrinsic value in real time as sliders change
- [x] 13.7 Select both models in the projection panel and click ANALYZE; confirm two parallel requests fire and results render side-by-side as each completes
- [x] 13.8 Toggle through all three themes; confirm entire UI updates in each theme with no flash; reload page and confirm selected theme persists
- [x] 13.9 Confirm screener table rows use 14px font with increased padding; confirm VOL/AVG column appears in full screener view
- [x] 13.10 Confirm ESC closes the overlay; confirm back button closes the overlay; confirm screener state is preserved after close
