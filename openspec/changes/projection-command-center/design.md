## Context

The app currently has 5 navigation tabs: SCREENER, OPTIONS, CHART, PROJECT, TRACKER. Three of those tabs (OPTIONS, CHART, PROJECT) are all symbol-centric — they require the user to type or select a symbol and operate on it in isolation. The stock detail overlay (triggered from the screener) already consolidates company data and AI projection for a symbol, but it lacks a chart, has poor space utilization (two stacked columns of text), and does not produce structured price forecasts or an options matrix.

The current `POST /projection` endpoint returns qualitative AI output (probability, reasoning, risks, factors) but no structured price targets or per-expiry options strategies. The AI prompt does not ask for these, so the model never generates them.

The codebase already has: Recharts-based charts in the Indicators component, an options chain fetcher in `services/market_data.py`, ATR values in `services/indicators_calc.py`, and yfinance access to analyst price targets and earnings calendars via `fetch_stock_detail`. The raw materials exist — they need to be composed into a new endpoint and UI.

## Goals / Non-Goals

**Goals:**
- Collapse main navigation from 5 tabs to 2 (MARKET, TRACKER)
- Make the stock detail overlay the single command center for a symbol, with chart always visible
- Add a structured `GET /forecast/{symbol}` endpoint that returns: stock price projections (bear/base/bull for 1W/2W/1M), IV-implied expected move per horizon, ATR-based range, key support/resistance, directional bias, catalyst flag, and options expiry matrix (1W→12M rows)
- Extend the AI prompt to produce price_projections and options_strategies as structured JSON
- Progressive loading: stock projections render first (~2-3s), options matrix fills in per-row as expiry fetches resolve (~5-10s total)
- Symbol search in the MARKET tab opens the overlay directly for any ticker

**Non-Goals:**
- Real-time streaming prices (yfinance is not a streaming source)
- Backtesting or historical accuracy validation of AI forecasts
- Removing the OptionsChain or Indicators components (they are kept, just no longer standalone tabs)
- Changing the Tracker tab or tracked trade CRUD flows
- Mobile/responsive layout optimization

## Decisions

### Decision 1: Single `GET /forecast/{symbol}` endpoint vs. extending `POST /projection`

**Chosen**: New `GET /forecast/{symbol}` endpoint, separate from `POST /projection`.

**Rationale**: A price forecast is about the symbol, not about a specific trade. It doesn't require entry/target/stop inputs. It can be auto-loaded when the overlay opens (no user action required), cached per symbol, and shared between the overlay header area and the AI Projection sub-tab. Extending POST /projection would conflate two different questions: "evaluate my trade" and "where is this stock going?" Keeping them separate allows the forecast to load eagerly while the AI projection (which requires user inputs) loads on demand.

**Alternative considered**: Extend POST /projection with an optional `include_forecast: true` flag. Rejected because it forces a user action (filling the projection form) before seeing the forecast, and makes caching harder (projection results are user-specific).

### Decision 2: AI generates price targets vs. pure quant computation

**Chosen**: Hybrid — quant math computes the statistical range (IV-implied move, ATR range), AI fills in the bear/base/bull price targets and directional bias within that range.

**Rationale**: Pure quant (lognormal distribution from IV) gives symmetric ranges with no directional view. Pure AI gives targets with no calibration to market-implied volatility. The hybrid anchors AI output to market reality: the prompt includes the IV-implied ±move and ATR range, and instructs the model to place its bear/base/bull targets within or near those bounds with explicit reasoning if it deviates.

**Alternative considered**: Use only IV-implied lognormal for symmetric bear/bull with AI choosing base case. Rejected because it loses the AI's directional signal entirely.

### Decision 3: Options matrix — full chain fetch vs. ATM-only fetch per expiry

**Chosen**: ATM-only fetch (nearest 3 strikes above and below current price) per expiry for the matrix view. Full chain fetch only when user clicks a row.

**Rationale**: Fetching the full chain for 9 expiries (1W→12M) would require 9 yfinance `.option_chain(date)` calls. Each call fetches hundreds of contracts. With parallel execution this takes 5-15s. The matrix only needs ATM IV, straddle cost, and volume — achievable from 6 strikes per expiry. Full chain is deferred to on-demand drill-down.

**Alternative considered**: Cache full chains server-side with a 5-minute TTL. This would work but requires significant memory (9 full chains per symbol, many symbols). Deferred to a future optimization if needed.

### Decision 4: Horizon-to-expiry mapping strategy

**Chosen**: For each standard horizon label (1W, 2W, 3W, 1M, 2M, 3M, 6M, 9M, 12M), compute the target date (today + N calendar days) and select the nearest available yfinance expiry that is ≥ the target date.

**Standard horizon → target days**:
- 1W = 7, 2W = 14, 3W = 21, 1M = 30, 2M = 60, 3M = 90, 6M = 180, 9M = 270, 12M = 365

If no expiry exists at or beyond a horizon (e.g., LEAPS not yet listed), that row is omitted from the matrix.

### Decision 5: Progressive loading strategy for the options matrix

**Chosen**: Backend fires all expiry fetches concurrently (asyncio.gather with return_exceptions=True). Frontend polls or uses a streaming response to render rows as they arrive.

**Simpler alternative chosen for v1**: Backend computes all rows sequentially with a per-row timeout of 3s, returns whatever completed within a total 15s timeout. Frontend receives the full matrix at once but sees it "fill in" via a loading skeleton. This avoids streaming complexity for v1 and can be upgraded to SSE later.

**Rationale**: Streaming (SSE) would give a better UX but adds backend and frontend complexity. Given the 15s total budget, a single response with all available rows is acceptable for v1.

### Decision 6: News panel placement

**Chosen**: News moves from the right column of the overlay to a slide-out drawer triggered by a NEWS button in the overlay header.

**Rationale**: News is supplementary context, not primary data. The current layout devotes a full column to it, pushing the DCF and AI projection out of the primary view. A drawer preserves access without consuming permanent space.

### Decision 7: Overlay sub-tab persistence

**Chosen**: Active sub-tab stored in Zustand (not URL), resets to FUNDAMENTALS when a new symbol opens.

**Rationale**: Simplest approach. Sub-tab state is per-session and per-symbol; persisting it across symbols (e.g., "always open on OPTIONS") would require symbol-keyed state that adds complexity without clear user value.

## Risks / Trade-offs

**yfinance rate limiting on options matrix** → Mitigation: Add a 0.5s jitter between parallel expiry fetches; cache results with 5-minute TTL per (symbol, expiry) key using `cachetools.TTLCache`.

**AI price targets may be poorly calibrated** → Mitigation: Display IV-implied expected move and ATR range alongside the AI targets so users can see the market baseline. Add a disclaimer that AI targets are AI-generated estimates, not financial advice.

**Removing standalone tabs breaks user muscle memory** → Mitigation: Keyboard shortcuts (O=options, C=chart, P=project) are retired; S still opens screener/market, T still opens tracker. Users adapted to the new flow quickly in similar UI consolidations.

**Chart rendering in overlay may be slow** → Mitigation: Chart uses existing `fetch_price_history` which is already cached. Recharts renders synchronously from in-memory data. No performance risk beyond the initial data fetch.

**Options not available for all symbols** → Mitigation: If no expiry dates exist for a symbol (e.g., ETFs with no options, OTC stocks), the OPTIONS MATRIX sub-tab shows an "options not available" message instead of an empty table.

## Migration Plan

1. Backend changes are purely additive — new endpoint, extended prompt output. No existing endpoints are modified in a breaking way.
2. Frontend tab removal: the 3 retired tabs (OPTIONS, CHART, PROJECT) are removed from the TABS array in App.tsx. If `activeTab` in Zustand/localStorage is one of these, it falls back to `market`. Add migration in store initialization: `if (!['market','tracker'].includes(activeTab)) setActiveTab('market')`.
3. No database migration needed.
4. Rollback: revert App.tsx TABS array and StockDetailOverlay — no server-side state changed.

## Open Questions

- Should the AI PROJECTION sub-tab auto-run the forecast on overlay open (like auto-analyze toggle in multi-model projection), or require a manual "ANALYZE" click? **Leaning toward**: auto-run `GET /forecast/{symbol}` (quant + AI price targets) on open; keep manual click only for the full multi-model trade projection.
- Should the symbol search in the MARKET tab search company names (fuzzy) or only exact ticker symbols? **Leaning toward**: exact ticker only for v1 (simpler, avoids search index dependency).
- Is 12M the right maximum horizon for the options matrix, or should it go to 24M (LEAPS can go 2 years out)? **Leaning toward**: 12M for v1, extendable.
