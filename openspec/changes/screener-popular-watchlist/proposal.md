## Why

The Screener tab currently fetches 90+ tickers on every load with N individual `.info` calls per result, making initial load slow (4-8s) and re-fetching on every tab switch. Users need a fast, pre-populated view of the most traded stocks and a way to track symbols they care about without running a full screen every time.

## What Changes

- Add a `GET /screener/popular` backend endpoint returning the top 10 most popular stocks with lightweight price/change/volume data (no `.info` enrichment), cached server-side with a 3-minute TTL
- Add a `POST /screener/watchlist` backend endpoint accepting a user-supplied list of symbols and returning the same lightweight data for those symbols
- Add backend TTL caching to `POST /screener` to avoid redundant yfinance calls for repeated identical requests
- Restructure the Screener tab into three sub-views toggled by a pill selector: **Popular** (default, auto-loads), **Watchlist** (user-defined symbols), and **Screener** (existing full filter UI)
- Add watchlist state (add/remove symbols) persisted to `localStorage` via Zustand

## Capabilities

### New Capabilities

- `popular-stocks`: A dedicated fast endpoint returning the top 10 most-traded stocks, cached server-side, auto-loaded when the Screener tab opens
- `watchlist`: User-defined list of symbols stored in browser localStorage, displayed in the Screener tab with live price/change/volume data fetched on demand
- `screener-cache`: Server-side TTL caching layer on screener endpoints to prevent redundant yfinance fetches

### Modified Capabilities

- `screener`: The Screener tab UI gains a three-view toggle (Popular / Watchlist / Screener); the existing filter form moves into the Screener sub-view. No breaking changes to the `POST /screener` API contract.

## Impact

- **Backend**: Two new endpoints added to `routers/screener.py`; `cachetools` added to `requirements.txt`; `services/market_data.py` gains lightweight fetch function and cache layer
- **Frontend**: `Screener.tsx` restructured into sub-views; `useScreener.ts` hook updated or split; Zustand store gains watchlist state; `localStorage` used for persistence
- **OpenAPI**: `openapi.yaml` gets two new path entries (`/screener/popular`, `/screener/watchlist`) — additive, no breaking changes
- **Dependencies**: `cachetools` (backend)
