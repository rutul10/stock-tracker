## 1. Model Reconciliation Fix

- [x] 1.1 Add useEffect in MultiModelProjection.tsx that filters selectedModels against availableModels when availableModels changes — remove stale models, default to [availableModels[0]] if all stale

## 2. News Tab — Wiring

- [x] 2.1 Add 'news' to Tab type in store/index.ts and update TABS array in App.tsx with key N
- [x] 2.2 Create frontend/src/components/News/News.tsx skeleton component (header, empty state, loading spinner)
- [x] 2.3 Import and render News component in App.tsx tab switch

## 3. News Tab — Data Fetching & Display

- [x] 3.1 Implement news aggregation logic: collect symbols from watchlist+blueChips+emerging (cap 15), fetch concurrently via GET /api/stock/{symbol}/news, merge/dedup by URL, sort newest-first
- [x] 3.2 Add frontend-level cache check: skip refetch if last fetch < 5 min ago, show "cached Xm ago" in header
- [x] 3.3 Render article list with ticker badge, headline (external link), source, relative timestamp
- [x] 3.4 Implement ticker badge click → open stock detail overlay
- [x] 3.5 Add filter controls: text input for symbol filter, ALL/BLUE CHIPS/EMERGING group buttons, CLEAR button
- [x] 3.6 Add manual refresh button that bypasses cache

## 4. Stock Detail — Summary Bar

- [x] 4.1 Create SummaryBar.tsx component: 2-line display of P/E, Fwd P/E, Rev Growth, FCF Margin, EV/EBITDA, PT upside, 52w range, Consensus — with green/red color coding
- [x] 4.2 Integrate SummaryBar at top of overview tab in StockDetailOverlay.tsx

## 5. Stock Detail — Mini Chart

- [x] 5.1 Create MiniChart.tsx: Recharts LineChart of close prices with 1W/1M/3M toggle buttons, loading state, green line on dark background
- [x] 5.2 Add price data fetching for chart (call GET /api/indicators/{symbol}?period=X, map period buttons to 5d/1mo/3mo)
- [x] 5.3 Integrate MiniChart below SummaryBar in overview tab layout

## 6. Stock Detail — Collapsible Financials

- [x] 6.1 Refactor CompanyOverviewPanel.tsx: wrap each section (Financials, Valuation, Balance Sheet, Technical, Analyst Consensus) in a collapsible accordion component — collapsed by default, click to expand, ▶/▼ indicator
- [x] 6.2 Remove company description paragraph from overview tab
- [x] 6.3 Reorganize two-column layout: left = news + collapsible sections, right = DCF + earnings

## 7. Polish & Integration

- [x] 7.1 Update keyboard hint text in App.tsx to show S·N·T
- [x] 7.2 Test news tab with empty watchlist (show helpful message), populated watchlist (articles render), and filter interactions
- [x] 7.3 Test stock detail overview: summary bar renders, chart toggles work, sections collapse/expand, layout fits without excessive scrolling
