## Why

The app currently shows news only within individual stock detail views. Users want a dedicated News tab aggregating headlines from all their watchlist symbols in one feed. Additionally, the stock detail overview displays financials as a flat 25-row list of numbers that's hard to consume quickly — it needs hierarchy (summary bar + collapsible sections) and a prominent price chart. Finally, the model selector in AI Projection shows stale persisted models that may no longer be installed.

## What Changes

- Add a **NEWS** tab to the main navigation that shows aggregated news from all watchlist symbols (Blue Chips + Emerging + custom watchlist), merged chronologically with ticker badges and filter controls
- Redesign the stock detail **Overview** layout: 2-line compressed summary bar at top, inline price chart with 1W/1M/3M toggle, collapsible financial sections instead of flat lists, news moved to left column below chart
- Fix model reconciliation: filter persisted `selectedModels` against live `availableModels` on load so deleted models don't appear

## Capabilities

### New Capabilities
- `news-feed-tab`: Aggregated news feed tab showing merged headlines from all watchlist symbols with ticker badges, time-sorted, filterable by symbol/group, with frontend caching to avoid redundant fetches

### Modified Capabilities
- `stock-detail-overlay`: Redesign overview layout — add summary bar, inline chart (1W/1M/3M), collapsible financial sections, reorder panels
- `model-discovery`: Add reconciliation logic — filter selectedModels against availableModels on load, default to first available if all stale

## Impact

- **Frontend**: New `News/` component directory, new tab in App.tsx + store, refactored `StockDetail/CompanyOverviewPanel.tsx` and `StockDetailOverlay.tsx`, new `SummaryBar.tsx` and `MiniChart.tsx` components, fix in `MultiModelProjection.tsx`
- **Backend**: No changes needed — existing `/api/stock/{symbol}/news` endpoint with 30-min TTL cache is sufficient
- **APIs**: No new endpoints required
- **Dependencies**: None new
