## Context

The current screener runs a single expensive pipeline on every POST `/screener` call: bulk download of 90+ tickers via `yf.download()` (~2-4s) followed by N individual `yf.Ticker(symbol).info` calls for enrichment (~1-2s per batch). There is no caching anywhere — every tab switch and page load triggers the full pipeline. The frontend has a single Screener view with a filter form; users must manually click "RUN SCREEN" to see any data.

The backend `market_data.py` already defines a `POPULAR_TICKERS` list of 90+ symbols. The top 10 are the most recognizable large-caps: AAPL, MSFT, AMZN, NVDA, GOOGL, META, TSLA, AVGO, LLY, JPM.

## Goals / Non-Goals

**Goals:**
- Auto-load 10 popular stocks when the Screener tab opens (no user action required)
- Serve popular stock data in <200ms on cache hit, <2s cold
- Let users maintain a persistent watchlist of symbols in the browser
- Reduce yfinance API calls via server-side TTL caching
- Keep the existing full screener UI fully functional

**Non-Goals:**
- Real-time price streaming (polling/websockets)
- Server-side watchlist persistence (localStorage is sufficient for a local app)
- Sector/name enrichment on popular or watchlist endpoints (no `.info` calls)
- Changing the existing `POST /screener` API contract

## Decisions

### 1. Two new lightweight endpoints instead of modifying `POST /screener`

**Decision:** Add `GET /screener/popular` and `POST /screener/watchlist` as separate endpoints rather than adding parameters to the existing screener.

**Rationale:** The popular and watchlist flows deliberately skip `.info` enrichment to be fast. Adding optional params to the existing endpoint would complicate caching (the cache key becomes complex) and risk breaking the existing contract. Separate endpoints have independent cache TTLs and clearer semantics.

**Alternative considered:** Add `mode=popular` query param to `POST /screener`. Rejected — mixes two concerns and makes the cache key harder to reason about.

### 2. In-memory TTL cache via `cachetools.TTLCache`

**Decision:** Use `cachetools.TTLCache` in `market_data.py` for the popular endpoint (TTL=180s) and the full screener (TTL=120s).

**Rationale:** `cachetools` is a zero-infrastructure dependency — no Redis, no SQLite table needed. For a local app where a single process serves all requests, in-memory cache is correct. TTL=3min for popular (slower-changing, high confidence in freshness) and TTL=2min for screener (user may change filters frequently).

**Alternative considered:** `functools.lru_cache` — doesn't support TTL. Redis — overkill for a local single-process app.

### 3. Watchlist stored in `localStorage` via Zustand `persist` middleware

**Decision:** Watchlist symbols stored client-side using Zustand's `persist` middleware writing to `localStorage`. Not stored on the backend.

**Rationale:** This is a local-first app with no user accounts. Persisting to the backend would require a new DB table, API endpoints, and session concept for what is essentially a preference. `localStorage` gives persistence across page refreshes with zero backend complexity.

**Alternative considered:** SQLite watchlists table + REST endpoints. Rejected — adds significant backend surface area for a purely local preference.

### 4. Three sub-views in Screener tab via pill toggle

**Decision:** Restructure Screener into Popular / Watchlist / Screener sub-views using a local state toggle, not a new route or tab.

**Rationale:** Keeps the nav tab count unchanged (adding a "WATCHLIST" tab was considered but increases nav clutter). The three views share the same `StockTable` component — the only difference is the data source. A pill toggle within the tab is the most compact UI.

### 5. Lightweight data shape for popular/watchlist (no `.info`)

**Decision:** `GET /screener/popular` and `POST /screener/watchlist` return only: `symbol`, `price`, `change_pct`, `volume` — skipping `name`, `market_cap`, `sector`, `avg_volume`, `iv_rank`.

**Rationale:** The `.info` call is the slow part (~1s per ticker). Removing it makes cold popular load ~1.5s instead of 4-8s. For these views, the user already knows the symbol names and doesn't need market cap or sector — they're picking from a fixed curated list or their own saved symbols.

**Trade-off:** `StockTable` will show "—" for name/sector/market_cap/iv_rank columns in popular and watchlist views. Acceptable.

## Risks / Trade-offs

- **Stale data on cache hit** → Mitigated by short TTL (2-3 min) and showing "last updated" timestamp on popular/watchlist views. Users can force refresh with `R` key.
- **`cachetools` not thread-safe by default** → FastAPI with `uvicorn` default (single worker) is effectively single-threaded async; not a concern. If multiple workers are used, wrap with `TTLCache`'s built-in lock or use `cachetools.LRUCache` + manual TTL. Document this assumption.
- **localStorage watchlist lost on browser data clear** → Expected and acceptable for a local dev tool. No mitigation needed.
- **yfinance rate limiting on watchlist fetch** → Watchlist is user-defined (potentially many symbols). Mitigated by using `yf.download(symbols_list)` (single bulk call) rather than per-symbol fetches.
- **Popular endpoint shows wrong "top 10"** → The list is hardcoded from `POPULAR_TICKERS[:10]`. Not dynamically ranked. For a strategy testing tool this is acceptable — users know what they're looking at.

## Migration Plan

1. Add `cachetools` to `requirements.txt`
2. Add lightweight fetch function to `market_data.py`
3. Add two new routes to `routers/screener.py`
4. Update `openapi.yaml` with new paths
5. Add watchlist state to Zustand store
6. Restructure `Screener.tsx` with pill toggle and three sub-views
7. No database migrations needed
8. No environment variable changes needed

**Rollback:** The new endpoints are additive. Reverting only requires removing the two new route handlers and the frontend sub-view toggle — the existing screener flow is untouched.

## Open Questions

- Should the `[+ W]` watchlist add button appear in Popular view rows? (Assumed yes — consistent with exploration discussion)
- Should watchlist symbols be validated against a known ticker list, or accept any string? (Assumed: accept any string, yfinance returns empty data for invalid symbols — surface as an error row)
