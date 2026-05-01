## 1. Backend — Forecast Engine Service

- [ ] 1.1 Create `backend/services/forecast_engine.py` with `HORIZON_DAYS` mapping: `{"1W": 7, "2W": 14, "3W": 21, "1M": 30, "2M": 60, "3M": 90, "6M": 180, "9M": 270, "12M": 365}`
- [ ] 1.2 Implement `map_horizons_to_expiries(symbol) -> list[dict]` — calls `yf.Ticker(symbol).options`, maps each horizon to nearest expiry ≥ target date, returns list of `{horizon, expiry, days_to_expiry}`
- [ ] 1.3 Implement `fetch_atm_options(symbol, expiry_date) -> dict` — fetches the option chain for the given expiry, finds ATM strike (nearest to current price), returns `{atm_strike, call_iv, put_iv, call_ask, put_ask, iv, straddle_cost}`
- [ ] 1.4 Implement `compute_expected_move(price, iv, days) -> dict` — returns `{plus, minus, range_pct}` using formula `price × iv × √(days / 252)`
- [ ] 1.5 Implement `compute_atr_ranges(indicators) -> dict` — reads ATR(14) from indicators dict, returns `{1W, 2W, 1M}` as `{plus, minus}` using multipliers 1.0×, 1.5×, 3.0×
- [ ] 1.6 Implement `compute_key_levels(indicators, current_price) -> dict` — derives `support` and `resistance` arrays (up to 4 each) from SMA20, SMA50, BB upper/lower, recent swing highs/lows
- [ ] 1.7 Implement `check_catalyst(symbol) -> dict` — reads earnings calendar from `yf.Ticker(symbol).calendar`, returns `{type, date, in_window}` where `in_window=True` if earnings within 30 days
- [ ] 1.8 Add `TTLCache(maxsize=50, ttl=300)` for forecast results keyed by symbol; integrate into main forecast computation function

## 2. Backend — Extended AI Prompt

- [ ] 2.1 Update `backend/services/prompt_builder.py` — add `iv_ranges` and `atr_ranges` parameters; inject IV-implied ±move and ATR-based range for 1W/2W/1M into prompt context block
- [ ] 2.2 Update the JSON schema in `build_projection_prompt()` to request additional fields: `price_projections` (bear/base/bull per horizon), `directional_bias`, `bias_confidence`, `key_support`, `key_resistance`, `options_strategies` (per horizon strategy + reasoning)
- [ ] 2.3 Update `backend/routers/projection.py` — extract and pass through new fields from AI response (`price_projections`, `directional_bias`, `bias_confidence`, `key_support`, `key_resistance`, `options_strategies`), defaulting to `null` if absent

## 3. Backend — Forecast Endpoint

- [ ] 3.1 Create `backend/routers/forecast.py` — define `GET /forecast/{symbol}` route
- [ ] 3.2 In the route handler: validate symbol, fetch indicators (reuse `calculate_indicators`), run `map_horizons_to_expiries`, `compute_expected_move`, `compute_atr_ranges`, `compute_key_levels`, `check_catalyst`
- [ ] 3.3 Fetch ATM options data for each mapped expiry using `asyncio.gather` with `return_exceptions=True`; assemble `options_matrix` rows; omit rows where fetch failed
- [ ] 3.4 Build forecast prompt (extend `build_projection_prompt` or create `build_forecast_prompt`) including all quant context; call Ollama; parse AI JSON for `price_projections`, `directional_bias`, `bias_confidence`, `options_strategies`
- [ ] 3.5 Merge per-expiry `ai_strategy` from AI response into `options_matrix` rows; assemble and return complete forecast response
- [ ] 3.6 Register `forecast` router in `backend/main.py`
- [ ] 3.7 Update `openapi.yaml` — add `GET /forecast/{symbol}` path with full response schema including `stock_projections`, `options_matrix`, `expected_move`, `key_levels`, `directional_bias`, `bias_confidence`, `catalyst`

## 4. Frontend — Navigation Consolidation

- [ ] 4.1 Update `frontend/src/App.tsx` — change `TABS` array from 5 entries to 2: `{id: 'market', label: 'MARKET', key: 'S'}` and `{id: 'tracker', label: 'TRACKER', key: 'T'}`; update keyboard shortcuts (remove O/C/P handling)
- [ ] 4.2 Update `frontend/src/store/index.ts` — rename `activeTab` type from union of 5 to union of `'market' | 'tracker'`; add store initialization migration: if stored `activeTab` is not `'market'` or `'tracker'`, reset to `'market'`
- [ ] 4.3 Update `App.tsx` content switch — render `<Screener />` for `'market'` and `<TradeTracker />` for `'tracker'`; remove the `options`, `indicators`, and `projector` branches
- [ ] 4.4 Update status bar keyboard shortcut hint text from `S·O·C·P·T` to `S·T — switch tabs`

## 5. Frontend — MARKET Tab Search Bar

- [ ] 5.1 Update `frontend/src/components/Screener/Screener.tsx` — add a symbol search `<input>` at the top of the component, above the sub-view pill selector
- [ ] 5.2 Wire search input `onKeyDown` — on Enter, uppercase + trim the input value, call `setDetailSymbol(symbol)` from the Zustand store, then clear the input
- [ ] 5.3 Style the search bar to match the Bloomberg theme: dark background, monospace font, `--accent-blue` border on focus, left-aligned placeholder in `--text-muted`

## 6. Frontend — Overlay Chart Zone

- [ ] 6.1 Create `frontend/src/components/StockDetail/ChartPanel.tsx` — extract chart rendering logic from `frontend/src/components/Indicators/Indicators.tsx` into a reusable component accepting `symbol` and `period` props
- [ ] 6.2 `ChartPanel` SHALL use Recharts `ComposedChart` with candlestick bars (Bar for OHLC) or Line if OHLC unavailable, SMA20/SMA50 Line overlays, BB upper/lower Area shading, and a second `ComposedChart` below for RSI
- [ ] 6.3 Add period selector buttons (1W / 1M / 3M / 6M / 1Y) to `ChartPanel` with internal state for selected period; default to 3M
- [ ] 6.4 `ChartPanel` SHALL call `GET /indicators/{symbol}?period=<period>` when mounted or when period changes; show skeleton loader while fetching

## 7. Frontend — Quick Stats Panel

- [ ] 7.1 Create `frontend/src/components/StockDetail/QuickStatsPanel.tsx` — accepts `detail` (StockDetail | null) and `loading` props
- [ ] 7.2 Render the following rows in monospace right-aligned format: 52W Low / High, vs 200-DMA (%), Short Interest (%), Analyst Mean PT, PT Range, Upside to PT (%), Analyst Consensus, Next Earnings date, Next Earnings EPS estimate
- [ ] 7.3 Show "—" for any field that is null/undefined; show skeleton rows while `loading` is true

## 8. Frontend — Overlay Layout Redesign

- [ ] 8.1 Rewrite `frontend/src/components/StockDetail/StockDetailOverlay.tsx` — replace current 2-column grid with new layout: sticky header, top zone (chart + quick stats), sub-tab nav, sub-tab content area
- [ ] 8.2 Top zone layout: `display: grid; grid-template-columns: 1fr 300px; gap: 16px` — `ChartPanel` fills left column, `QuickStatsPanel` fills right column
- [ ] 8.3 Sub-tab nav: render 4 buttons (FUNDAMENTALS / OPTIONS MATRIX / AI PROJECTION / DCF) with active underline indicator; store active sub-tab in local component state, default to `'fundamentals'`, reset to `'fundamentals'` when `symbol` prop changes
- [ ] 8.4 Sub-tab content: render `FundamentalsPanel` for `'fundamentals'`, `OptionsMatrixPanel` for `'options'`, `AiProjectionPanel` for `'projection'`, `DCFCalculator` for `'dcf'`
- [ ] 8.5 Add NEWS button to overlay header; implement slide-out news drawer (absolutely positioned right-side panel, z-index above content) toggled by the NEWS button; close on ESC or backdrop click

## 9. Frontend — Fundamentals Sub-tab

- [ ] 9.1 Create `frontend/src/components/StockDetail/FundamentalsPanel.tsx` — accepts `detail`, `earnings`, `loading` props
- [ ] 9.2 Render labeled sections (FINANCIALS, VALUATION, BALANCE SHEET, TECHNICAL, ANALYST CONSENSUS) each as a two-column key-value table matching the existing `CompanyOverviewPanel` style but in a single scrollable column
- [ ] 9.3 At the bottom, render a collapsible "NEWS" section (collapsed by default) — clicking the header toggles the `NewsPanel` content visible/hidden

## 10. Frontend — Options Matrix Sub-tab

- [ ] 10.1 Create `frontend/src/components/StockDetail/OptionsMatrixPanel.tsx` — accepts `symbol` and `forecastData` props
- [ ] 10.2 Render `options_matrix` from `forecastData` as a table with columns: EXPIRY, DAYS, IV, ±MOVE, ATM STRIKE, STRADDLE, AI STRATEGY
- [ ] 10.3 Show a spinner per row if `forecastData` is loading; show "Options not available" message if `options_available` is false
- [ ] 10.4 On row click, set local state to `{view: 'chain', expiry: row.expiry}` and render the existing `OptionsChain` component for that symbol + expiry
- [ ] 10.5 When in chain view, render a `← MATRIX` back button that resets local state to `{view: 'matrix'}`

## 11. Frontend — AI Projection Sub-tab

- [ ] 11.1 Create `frontend/src/components/StockDetail/AiProjectionPanel.tsx` — accepts `symbol`, `detail`, `news`, `dcfContext`, `forecastData` props
- [ ] 11.2 Create `frontend/src/components/StockDetail/PriceForecastPanel.tsx` — accepts `forecastData` prop; renders: directional bias badge, 3×3 price projections table (rows: 1W/2W/1M, cols: BEAR/BASE/BULL), expected move row (IV-implied ±move), ATR range row, support/resistance chips, catalyst warning banner if `catalyst.in_window` is true
- [ ] 11.3 `AiProjectionPanel` renders `PriceForecastPanel` at the top, then the existing `MultiModelProjection` component below
- [ ] 11.4 Create `frontend/src/hooks/useForecast.ts` — calls `GET /forecast/{symbol}` when symbol is provided; returns `{forecastData, loading, error}`; auto-fetches when `AiProjectionPanel` mounts or symbol changes

## 12. Frontend — Multi-model Result Card Update

- [ ] 12.1 Update the result card render in `MultiModelProjection.tsx` — after the probability bar and reasoning, check if `result.price_projections` is non-null
- [ ] 12.2 If present, render a compact 3-column / 3-row price projections mini-table: BEAR in `--accent-red`, BASE in `--accent-blue`, BULL in `--accent-green`
- [ ] 12.3 If `result.key_support` is non-null, render support chips (red background, price labels) and resistance chips (green background) below the projections table

## 13. Cleanup and Verification

- [ ] 13.1 Remove `{id: 'options', ...}`, `{id: 'indicators', ...}`, `{id: 'projector', ...}` tab entries from `App.tsx`; verify no dangling references to these tab IDs in the store or components
- [ ] 13.2 Verify the existing standalone `OptionsChain`, `Indicators`, and `Projector` components are no longer rendered directly in `App.tsx`; confirm they are only referenced from within overlay sub-tab components
- [ ] 13.3 Run the backend: confirm `GET /forecast/AAPL` returns a valid response with `stock_projections`, `options_matrix`, `expected_move`, `key_levels`, `directional_bias`, `catalyst`
- [ ] 13.4 Run the frontend dev server; open the MARKET tab; confirm only 2 tabs visible; confirm symbol search opens the overlay
- [ ] 13.5 In the overlay, confirm chart renders in the top zone, Quick Stats populate, and all 4 sub-tabs switch correctly
- [ ] 13.6 In the OPTIONS MATRIX sub-tab, confirm matrix rows render with IV and expected move; click a row and confirm full chain loads; click ← MATRIX to go back
- [ ] 13.7 In the AI PROJECTION sub-tab, confirm `PriceForecastPanel` shows bear/base/bull table and that the MultiModelProjection form is still functional below it
- [ ] 13.8 Verify Ollama-unavailable graceful error: stop ollama, open overlay, visit AI PROJECTION — confirm the forecast section shows a clear error without crashing the overlay
