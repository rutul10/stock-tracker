## Context

The app has two main tabs (Watchboard, Tracker) and a full-screen stock detail overlay. News currently lives only inside individual stock detail views via `NewsPanel.tsx` fetching from `GET /api/stock/{symbol}/news`. The backend `news_client.py` uses Finnhub (with API key) or yfinance fallback, with a 30-min TTL cache per symbol.

The stock detail Overview tab shows a company description paragraph followed by a flat list of ~25 financial metrics across 5 sections (Financials, Valuation, Balance Sheet, Technical, Analyst Consensus), all expanded simultaneously. This makes it hard to scan quickly.

The AI Projection model selector persists `selectedModels` to localStorage but doesn't reconcile against live `availableModels` when models are uninstalled.

## Goals / Non-Goals

**Goals:**
- Dedicated News tab aggregating all watchlist symbols' headlines in one chronological feed
- Stock detail overview that's scannable in 2 seconds (summary bar) with full data available on demand (collapsible sections)
- Inline price chart on overview with period toggles (1W, 1M, 3M)
- Model selector only shows actually-installed models

**Non-Goals:**
- Market-wide/macro news (only watchlist symbol news)
- Real-time streaming news (poll/refresh is fine)
- New backend endpoints (existing infrastructure is sufficient)
- Candlestick chart (simple line chart for overview mini-chart)
- Changing the AI Projection or Chat tab layouts

## Decisions

### 1. News Tab — Frontend-only aggregation

**Decision**: Fetch news for each watchlist symbol concurrently on the frontend, merge and deduplicate client-side.

**Rationale**: Backend already has per-symbol cached news endpoints. Creating a batch endpoint adds complexity with no real benefit — the TTL cache means most calls are instant cache hits anyway.

**Alternatives considered**:
- Batch backend endpoint (`POST /api/news/batch`) — adds backend work, marginal gain given caching
- WebSocket push — overkill for 30-min refresh cadence

**Implementation**:
- Cap at 15 symbols per refresh (Finnhub free tier: 60 calls/min)
- Priority order: custom watchlist → blue chips → emerging (truncate at 15)
- Frontend skip-fetch if last fetch < 5 min ago (component-level staleness check)
- Deduplicate by article URL before sorting

### 2. Stock Detail — Summary Bar + Collapsible Sections

**Decision**: Replace flat financial lists with a 2-line hero summary bar (6-8 key metrics) and accordion-style collapsible sections for full data.

**Rationale**: Users need quick context (is this cheap? growing? consensus?). Full data should be accessible but not mandatory to consume.

**Layout order (top to bottom)**:
1. Summary bar (always visible, 2 lines)
2. Price chart with 1W/1M/3M toggle
3. Two-column grid:
   - Left: News + collapsible sections (Financials, Valuation, Balance Sheet, Technical, Analyst Consensus)
   - Right: DCF Calculator + Earnings

**Alternatives considered**:
- Visual gauges/progress bars — harder to read precise values, non-standard
- Tabs within overview — adds click depth, loses context

### 3. Mini Chart — Reuse existing price history endpoint

**Decision**: Call `GET /api/indicators/{symbol}?period=1mo` (or 1w/3mo) and render a simple line chart using Recharts `LineChart` with close prices only.

**Rationale**: Endpoint already returns OHLCV data. A simple close-price line is fastest to scan and render.

**Period mapping**:
- 1W → `period=5d` (yfinance format)
- 1M → `period=1mo`
- 3M → `period=3mo`

### 4. Model Reconciliation — Filter on load

**Decision**: In `MultiModelProjection.tsx`, add a `useEffect` that filters `selectedModels` against `availableModels` whenever `availableModels` changes. If filtered result is empty, default to `[availableModels[0]]`.

**Rationale**: Minimal change, handles the stale-model case cleanly without needing backend changes.

## Risks / Trade-offs

- **[Finnhub rate limit]** → Cap symbols at 15, rely on backend TTL cache (most hits are cached). If user has >15 symbols, show "showing news for 15 of N symbols" note.
- **[News fetch latency on cold cache]** → First load after 30 min may be slow (15 sequential-ish fetches). Mitigate: show articles as they arrive (streaming render), not all-at-once.
- **[Collapsible sections lose discoverability]** → First-time users might not realize there's more data. Mitigate: sections show a subtle preview (e.g., "5 metrics") in collapsed state.
- **[Chart adds another API call]** → One extra fetch per stock detail open. Acceptable given existing caching patterns.
