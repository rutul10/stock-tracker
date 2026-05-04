## Context

The app currently has 5 navigation tabs (SCREENER, OPTIONS, CHART, PROJECT, TRACKER) built for an expert Bloomberg-terminal mental model. The primary user is a new trader working with real money who trades blue-chip and quality emerging companies exclusively, prefers monthly/quarterly/annual options, and needs to understand WHY a trade has a certain probability — not just see the number.

The existing codebase has:
- `POST /projection` returning `probability_of_success` via Ollama (qualitative)
- `GET /indicators/{symbol}` returning all technical indicators
- `GET /options/{symbol}` returning full options chain
- `StockDetailOverlay` component with FUNDAMENTALS, OPTIONS, AI PROJECTION, DCF sub-tabs
- Zustand store with `selectedSymbol`, `activeTab`, `watchlist`
- Ollama client in `backend/services/ollama_client.py` supporting `call_ollama()` (non-streaming)

The `projection-command-center` OpenSpec change (60 tasks, 0 done) was planned before the user's profile was understood. This change supersedes it with a user-centric design. That change should be archived.

## Goals / Non-Goals

**Goals:**
- Replace the 5-tab nav with 2 tabs: WATCHBOARD and TRACKER
- Curated landing page (Blue Chips + Emerging) with Trade Score per card, no screener form needed
- Stock comparison across 4 views: Verdict, Projection Cone, Indicator Breakdown, Options Head-to-Head
- LLM chat panel for conversational follow-up on any projection
- Monthly+ options default (30 DTE minimum, weeklies hidden)
- User profile (risk tolerance, DTE preference, max size) injected into all AI prompts
- Trade Score endpoint that is fast (no Ollama, pure quant) and cached
- Plain-English labels throughout (no raw RSI/MACD numbers exposed without context)

**Non-Goals:**
- Real-time streaming price data (yfinance is pull-only)
- Backtesting or historical accuracy validation of projections
- Mobile / responsive layout
- Paper trading simulation
- Replacing the Tracker tab or CRUD flows for tracked trades
- Removing the OptionsChain or Indicators components (kept inside overlay, not standalone tabs)

## Decisions

### Decision 1: Trade Score is quant-only, no Ollama

**Chosen**: `GET /trade-score/{symbol}` computes score from technical indicators + IV-implied move math only. No Ollama call.

**Rationale**: The watchboard loads all symbols in the curated list at once (10–20 stocks). An Ollama round-trip per symbol would take 2–10 minutes total — unusable. Quant computation (RSI weight + MACD weight + momentum weight + IV percentile weight) takes <1s per symbol. The AI adds qualitative depth inside the overlay chat; the Trade Score is a fast entry signal.

**Formula (weighted sum, normalized to 0–100):**
```
score = (
  rsi_component * 0.25 +       # RSI: 50-70 = bullish, normalize to 0-1
  macd_component * 0.25 +      # MACD above signal = bullish
  momentum_component * 0.25 +  # price vs SMA20/SMA50
  iv_component * 0.25          # low IV rank = cheaper options = better entry
) * 100
```

**Alternative considered**: Ask Ollama for a score per symbol in parallel. Rejected — Ollama is single-threaded locally, parallelism provides no speedup. Also makes score non-deterministic and slow.

### Decision 2: Projection Chat uses streaming Ollama API

**Chosen**: `POST /projection/chat` uses Ollama's streaming API (`stream: true`) and SSE (Server-Sent Events) from FastAPI to the frontend. Frontend uses `EventSource` or `fetch` with `ReadableStream`.

**Rationale**: Chat responses from deepseek-r1 can take 15–30 seconds. Non-streaming would require the user to wait with a spinner and no feedback. Streaming shows words appearing progressively, which matches user expectations from ChatGPT/Claude.

**Context management**: Each chat message sends the full `messages[]` history (user + assistant turns) plus a system prompt containing the symbol's indicator snapshot and user profile. Context is managed client-side in component state, not persisted to SQLite. A session ends when the overlay closes.

**Alternative considered**: WebSocket connection per chat session. Rejected — SSE is simpler, unidirectional (server→client), and sufficient for this use case. WebSocket adds complexity with connection management.

### Decision 3: Comparison state lives in Zustand, not URL

**Chosen**: `compareSymbols: [string, string] | null` in the Zustand store. Comparison view renders as a full-screen overlay (z-index above overlay) when two symbols are pinned.

**Rationale**: Comparison is a transient session state — user picks two stocks, compares, dismisses. URL-based routing would require React Router setup currently absent from the codebase. Zustand is already the state management layer.

**Alternative considered**: Route `/compare/:a/:b`. Rejected — adds routing dependency, complicates the current single-page tab model, and comparison is ephemeral by nature.

### Decision 4: Monthly+ options filter is a backend query param, not client-side filtering

**Chosen**: All options endpoints accept `min_dte: int = 30` query parameter. Backend filters expiries before returning data. Frontend sends `min_dte=30` by default, with an "advanced" toggle to send `min_dte=0`.

**Rationale**: yfinance returns a fixed list of expiry dates. Filtering server-side reduces payload size. The `min_dte` default of 30 encodes the user's preference in the API contract.

**Alternative considered**: Return all expiries, filter client-side. Rejected — returns unnecessary weekly data that the user never wants; increases payload and adds filtering logic to the frontend.

### Decision 5: User profile persisted to localStorage, not SQLite

**Chosen**: `userProfile` (risk tolerance, DTE preference, max position size, watchlist customizations) stored in Zustand with `persist` middleware → `localStorage`. No backend storage.

**Rationale**: User profile is a UI-layer preference, not a trade record. It doesn't need server-side storage. Zustand persist is already in the dependency tree (zustand). This avoids a new DB table and API endpoint for a simple key-value store.

**Alternative considered**: SQLite table + API endpoint. Rejected — overengineered for preferences that are inherently per-device.

### Decision 6: Watchboard default lists are code-defined, user-editable in store

**Chosen**: Default Blue Chip list (15 symbols) and Emerging Growth list (10 symbols) are defined as constants in `frontend/src/constants/watchlists.ts`. User additions/removals override via Zustand store arrays `customBlueChips[]` and `customEmerging[]`.

**Default Blue Chips**: AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA, JPM, BRK-B, JNJ, V, UNH, XOM, HD, PG

**Default Emerging Growth**: PLTR, CRWD, SNOW, DDOG, COIN, SQ, HOOD, RBLX, RIVN, SOFI

**Alternative considered**: Fetch a "popular stocks" list from the screener API on load. Rejected — screener results vary daily, making the watchboard inconsistent. User wants a stable, curated set of known names.

## Risks / Trade-offs

**Risk: Trade Scores load slowly if yfinance is rate-limited**
→ Mitigation: Batch indicator fetches with `asyncio.gather` across all watchboard symbols; add `TTLCache(maxsize=100, ttl=300)` in `calculate_indicators`. If fetch fails for a symbol, show "--" score rather than blocking the card.

**Risk: Ollama chat context grows too large for deepseek-r1's context window**
→ Mitigation: Cap `messages[]` history at last 10 turns (5 user + 5 assistant) before sending. Prepend system prompt with symbol context. Warn user in UI if conversation is truncated.

**Risk: Comparison view loads 2× indicator + options data simultaneously**
→ Mitigation: Load each symbol's data independently with individual loading states; show each panel as it resolves rather than waiting for both.

**Risk: SSE streaming doesn't work through some proxies/nginx configs**
→ Mitigation: Add `Cache-Control: no-cache`, `X-Accel-Buffering: no` headers. Document in README. Provide a non-streaming fallback path in `call_ollama` via `OLLAMA_STREAM=false` env var.

**Risk: Monthly options filter (min_dte=30) hides all options for near-expiry periods**
→ Mitigation: If no expiries exist with DTE ≥ 30 (e.g., stock has no far-dated options), return the nearest available expiry with a UI warning "No monthly options available — showing nearest expiry."

## Migration Plan

1. The `projection-command-center` OpenSpec change (0 tasks done) is superseded by this change. Archive it after this proposal is approved.
2. Nav tab changes are additive in terms of data — removing tabs does not delete any data.
3. `min_dte` param on options endpoint is additive (default 30, backwards-compatible if called without it).
4. New `/trade-score` and `/projection/chat` endpoints are additive.
5. No database schema changes required.
6. No breaking changes to existing `POST /projection` or `GET /indicators` endpoints.

## Open Questions

1. **Projection Cone chart library**: The existing codebase uses Recharts. A cone visualization (shaded area between bear and bull) can be done with `AreaChart` + custom layers in Recharts, but it's non-trivial. Should we use a Recharts `ComposedChart` with three `Area` series (bear, base, bull), or consider a simpler bar/range chart approach?

2. **Chat system prompt length**: The indicator context snapshot (RSI, MACD, SMA, ATR, BB, prices) is ~300 tokens. Adding news headlines pushes to ~600 tokens. Is that acceptable per turn given deepseek-r1's context limits?

3. **Trade Score weighting**: The 25/25/25/25 weighting above is a starting point. Should RSI and MACD carry more weight than IV for a 1–3 month options player? This may need tuning after initial implementation.
