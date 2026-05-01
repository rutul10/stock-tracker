## 1. Backend Dependencies & Cache Infrastructure

- [x] 1.1 Add `cachetools` to `backend/requirements.txt`
- [x] 1.2 Add `TTLCache` instances to `backend/services/market_data.py` — one for popular (TTL=180s) and one for the full screener (TTL=120s, keyed on params hash)

## 2. Backend: Lightweight Fetch Function

- [x] 2.1 Add `fetch_lightweight(symbols: list[str]) -> list[dict]` to `backend/services/market_data.py` — uses `yf.download(symbols)` bulk call, returns only `symbol`, `price`, `change_pct`, `volume` (no `.info` calls)
- [x] 2.2 Wrap `fetch_screener` in `backend/services/market_data.py` with the TTL cache (key = `hashlib.md5(json.dumps(params, sort_keys=True))`)

## 3. Backend: New Endpoints

- [x] 3.1 Add `GET /screener/popular` to `backend/routers/screener.py` — calls `fetch_lightweight(POPULAR_TICKERS[:10])`, wraps result in popular TTL cache
- [x] 3.2 Add `POST /screener/watchlist` to `backend/routers/screener.py` — accepts `{ "symbols": [...] }`, validates max 50 symbols, calls `fetch_lightweight(symbols)`
- [x] 3.3 Add rate limiting (`@limiter.limit("10/minute")`) to both new endpoints

## 4. OpenAPI Contract

- [x] 4.1 Add `GET /screener/popular` path to `openapi.yaml` with response schema matching `ScreenerResponse` (reuses existing schema)
- [x] 4.2 Add `POST /screener/watchlist` path to `openapi.yaml` with request body `{ symbols: string[] }` and same `ScreenerResponse` schema

## 5. Frontend: Zustand Store — Watchlist State

- [x] 5.1 Add `watchlist: string[]`, `addToWatchlist(symbol: string)`, `removeFromWatchlist(symbol: string)`, and `activeScreenerView: 'popular' | 'watchlist' | 'screener'` / `setActiveScreenerView(...)` to `frontend/src/store/index.ts`
- [x] 5.2 Persist `watchlist` to `localStorage` using Zustand `persist` middleware (persist only `watchlist`, not `activeScreenerView`)

## 6. Frontend: API Hooks

- [x] 6.1 Add `usePopularStocks()` hook to `frontend/src/hooks/useScreener.ts` (or new file) — fetches `GET /screener/popular`, stores result in component state, auto-fetches on mount
- [x] 6.2 Add `useWatchlistData(symbols: string[])` hook — fetches `POST /screener/watchlist` when symbols change, returns results

## 7. Frontend: Screener Tab Restructure

- [x] 7.1 Add pill toggle component to `Screener.tsx` — three pills: POPULAR / WATCHLIST / SCREENER, driven by `activeScreenerView` from store
- [x] 7.2 Extract existing filter form + RUN SCREEN button into a `ScreenerView` sub-component within `Screener.tsx`
- [x] 7.3 Add `PopularView` sub-component: renders `StockTable` with popular stock data, shows loading spinner on first fetch, shows last-fetched timestamp
- [x] 7.4 Add `WatchlistView` sub-component: renders `StockTable` with watchlist data; shows empty-state prompt when watchlist is empty; includes "Add Symbol" input field
- [x] 7.5 Add `[+]` watchlist button column to `StockTable.tsx` — shown only when `onAddToWatchlist` prop is passed; button changes to `[✓]` (disabled) if symbol is already in watchlist

## 8. Frontend: Watchlist Management UX

- [x] 8.1 Add `×` remove button to each row in `WatchlistView` that calls `removeFromWatchlist(symbol)`
- [x] 8.2 Add "Add Symbol" input + submit in `WatchlistView` — uppercases input, calls `addToWatchlist`, clears input on submit; ignores duplicates silently

## 9. Verification

- [x] 9.1 Start backend and confirm `GET /screener/popular` returns 10 results in <2s cold and <100ms on second call
- [x] 9.2 Confirm `POST /screener/watchlist` with `["AAPL", "TSLA"]` returns 2 results
- [x] 9.3 Start frontend and confirm Screener tab opens on Popular sub-view with data loaded automatically
- [x] 9.4 Add a symbol to watchlist via `[+]` button in Popular view, switch to Watchlist view, confirm it appears with data
- [x] 9.5 Reload the page and confirm watchlist symbols are still present (localStorage persistence)
- [x] 9.6 Switch to Screener sub-view, confirm existing filter form works and RUN SCREEN still fetches correctly
- [x] 9.7 Confirm second RUN SCREEN call with same params returns faster (cache hit) than first call
