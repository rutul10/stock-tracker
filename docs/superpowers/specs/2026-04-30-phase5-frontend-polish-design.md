# Phase 5 — Frontend Polish Design

**Date:** 2026-04-30  
**Status:** Approved  
**Scope:** Four remaining Phase 5 items + any residual polish across the app.

---

## What's Already Done

Bloomberg theme, Google Fonts, sortable columns, sector filter, indicator toggles, probability animation, CSV export, status bar, keyboard shortcuts, loading spinners, error banners.

---

## What Needs Building

### 1. IV Rank Column — StockTable

Add `iv_rank` to the stock screener table. The value comes from the API (`StockResult.iv_rank`, 0–100). Display as a colored number: green <30, amber 30–60, red >60. Right-aligned, monospace. Insert between `AVG VOL` and `SECTOR` columns. Extend `SortKey` type to include `iv_rank`.

**Files:** `frontend/src/components/Screener/StockTable.tsx`

---

### 2. Options Chain — Side-by-Side Layout + ITM + Greeks

**Layout:** Two tables rendered side-by-side in a CSS grid (`grid-template-columns: 1fr 1fr`). Calls on the left, Puts on the right, each with its own column headers. Current price shown as a reference line between ITM/OTM rows.

**ITM highlighting:** Rows where `in_the_money === true` get a subtle background tint (`rgba(0,255,136,0.06)` for calls, `rgba(255,51,102,0.06)` for puts).

**Greek color-coding:**
- Delta: green if call, red if put (absolute value bands)
- Theta: always red-tinted (time decay is always negative)
- IV: color via existing `ivColor()` helper (already in OptionsTable)
- Gamma/Vega: neutral blue

**Files:** `frontend/src/components/OptionsChain/OptionsChain.tsx`, `frontend/src/components/OptionsChain/OptionsTable.tsx`

---

### 3. Candlestick Chart — PriceChart

Replace the `<Area>` close-price line with true OHLC candlestick bars. Recharts has no native candlestick, so implement a custom `<Bar shape={CandleShape}>` that receives `{x, y, width, payload}` and renders:
- A rect for the body (open→close), colored green if close≥open, red if close<open
- Two SVG lines for the wicks (high and low)

Keep all existing overlays (SMA, BB, EMA). Keep RSI and MACD as separate `<ResponsiveContainer>` sub-charts below, synchronized via `syncId="chart"`.

**Files:** `frontend/src/components/Indicators/PriceChart.tsx`

---

### 4. Sparkline P&L — TradeTracker

Add a mini sparkline column to the tracker table showing the stock's recent 10-day close prices. Use a compact `<LineChart>` (width 80, height 28, no axes, no tooltip) rendered inline per row. Fetch price history via the existing `/indicators/{symbol}?period=1mo` endpoint. Cache per symbol to avoid N+1 fetches — use a shared `Map<string, number[]>` in component state, populated on mount for all open trades.

**Files:** `frontend/src/components/Tracker/TradeTracker.tsx`, `frontend/src/components/Tracker/TradeRow.tsx`

---

## Architecture Notes

- No new API endpoints needed — all data already available.
- `OptionsTable` is currently only aware of one side (calls or puts). The side-by-side layout is handled in `OptionsChain.tsx` by rendering two `<OptionsTable>` instances in a grid.
- Candlestick custom shape is a pure render function — no state, no hooks, just `(props) => <g>...</g>`.
- Sparkline data fetching uses the existing `axios` client, not a new hook — keeps it local to the Tracker.

---

## Out of Scope

- Phase 6 items (rate limiting, validation, Makefile, README)
- StockDetail overlay changes
- Any backend changes
