## Why

The app currently has 5 fragmented tabs (Screener, Options, Chart, Projector, Tracker) that force the user to context-switch between tabs to research a single stock, and the stock detail overlay — the natural command center — has no chart, poor space utilization, and no price forecasting output. Users need a unified, symbol-centric workspace where clicking a stock reveals everything: price chart, fundamentals, options by expiry, and AI-driven price forecasts — without leaving the view.

## What Changes

- **Collapse main nav from 5 tabs to 2**: MARKET (combines Screener + Popular + Watchlist) and TRACKER (trade tracking). The other 3 tabs (Options, Chart, Projector) are retired as standalone tabs and absorbed into the stock detail overlay.
- **Stock detail overlay becomes the command center**: Redesigned with a persistent chart at the top and 4 sub-tabs below: FUNDAMENTALS | OPTIONS MATRIX | AI PROJECTION | DCF.
- **Chart added to the overlay**: Price chart (candlestick + SMA/BB overlay + RSI sub-chart) is always visible at the top of the overlay when a stock is opened — no separate tab needed.
- **Quick Stats panel**: Compact side panel next to the chart showing the most critical numbers (52W range, short interest, analyst PT, next earnings) so the user never needs to scroll to find them.
- **Options expiry matrix**: A new table in the OPTIONS MATRIX sub-tab showing one row per standard expiry horizon (1W, 2W, 3W, 1M, 2M, 3M, 6M, 9M, 12M), each with IV, expected move (±), ATM strike, straddle cost, and AI-recommended strategy. Clicking a row loads the full options chain for that expiry.
- **Price forecast output**: The AI PROJECTION sub-tab gains a structured price forecast — bear/base/bull price targets for 1-week, 2-week, and 1-month horizons, plus key support/resistance levels, IV-implied expected move, ATR-based range, and directional bias — all returned as structured data from the backend.
- **MARKET tab with symbol search**: The renamed Screener tab gains a prominent search bar; typing any symbol and pressing Enter opens the overlay directly, even if that symbol isn't in the screener list.
- **News moved to collapsible drawer**: News headlines are collapsed into a slide-out drawer triggered from the overlay header, freeing column space for data-dense panels.

## Capabilities

### New Capabilities

- `price-forecast`: Backend computation and AI prompt extension that produces structured bear/base/bull price targets for 1W/2W/1M horizons, IV-implied expected move, ATR-based range, key support/resistance levels, directional bias, and catalyst-in-window flag. Exposed via new `GET /forecast/{symbol}` endpoint.
- `options-expiry-matrix`: Backend logic that maps standard horizon labels (1W→12M) to nearest real yfinance expiry dates, fetches ATM options data per expiry in parallel, computes IV and expected move per row, and returns an ordered matrix. Frontend renders as a clickable table in the OPTIONS MATRIX sub-tab; clicking a row loads the full options chain.
- `overlay-command-center`: Redesigned `StockDetailOverlay` component — chart always visible at top, Quick Stats side panel, 4 sub-tabs (Fundamentals, Options Matrix, AI Projection, DCF), collapsible news drawer, symbol search in MARKET tab.

### Modified Capabilities

- `multi-model-projection`: AI projection prompt extended to return `price_projections` (bear/base/bull per horizon), `directional_bias`, `key_support`, `key_resistance`, and per-expiry `options_strategies` in its JSON response. The POST /projection response schema gains these new fields (additive, not breaking).
- `screener`: Screener tab renamed to MARKET tab; gains a symbol search bar at the top; sub-view pill selector (Popular / Watchlist / Screener) remains. No breaking changes to the `POST /screener` API.

## Impact

**Backend**
- New endpoint: `GET /forecast/{symbol}` — returns stock price projections + options expiry matrix in one response
- New service: `backend/services/forecast_engine.py` — IV-implied move math, ATR-based ranges, horizon-to-expiry mapping, parallel options fetch per expiry
- Modified: `backend/services/prompt_builder.py` — extended JSON schema to include `price_projections`, `directional_bias`, `key_support`, `key_resistance`, `options_strategies`
- Modified: `backend/routers/projection.py` — pass new fields through from AI response
- New dependency: none (uses existing yfinance + pandas-ta)

**Frontend**
- Modified: `frontend/src/App.tsx` — TABS reduced from 5 to 2 (screener → market, tracker stays; options/indicators/projector removed)
- Rewritten: `frontend/src/components/StockDetail/StockDetailOverlay.tsx` — new layout with chart zone, quick stats, sub-tab nav
- New component: `frontend/src/components/StockDetail/PriceForecastPanel.tsx` — bear/base/bull table + levels + expected move
- New component: `frontend/src/components/StockDetail/OptionsMatrixPanel.tsx` — expiry matrix table with progressive loading
- New component: `frontend/src/components/StockDetail/QuickStatsPanel.tsx` — compact key metrics card
- New component: `frontend/src/components/StockDetail/ChartPanel.tsx` — price chart using Recharts (extracted from Indicators component)
- New hook: `frontend/src/hooks/useForecast.ts` — fetches GET /forecast/{symbol}
- Modified: `frontend/src/components/Screener/Screener.tsx` — renamed/extended as MARKET tab with symbol search bar
- Removed: `frontend/src/components/OptionsChain/` standalone tab usage (component kept, now rendered inside OptionsMatrixPanel)
- Removed: `frontend/src/components/Indicators/` standalone tab usage (logic extracted into ChartPanel)
- Removed: `frontend/src/components/Projector/` standalone tab (functionality moved into overlay sub-tab)

**OpenAPI**
- New path: `GET /forecast/{symbol}` (additive)
- Modified: `POST /projection` response body — new optional fields added (additive, backwards-compatible)
