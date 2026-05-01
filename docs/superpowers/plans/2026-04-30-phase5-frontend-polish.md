# Phase 5 Frontend Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the four remaining Phase 5 items: IV Rank column in StockTable, Greek columns in OptionsTable, true candlestick chart in PriceChart, and sparkline P&L in TradeTracker.

**Architecture:** All changes are purely frontend. No new API endpoints. IV rank and Greeks data already exist in the API types. Candlestick uses a Recharts `<Customized>` layer that reads yAxisMap/xAxisMap scale functions directly. Sparklines are fetched in TradeTracker and passed as props to TradeRow.

**Tech Stack:** React 18, TypeScript, Recharts (ComposedChart, Customized, LineChart), axios

---

## File Map

| File | Change |
|------|--------|
| `frontend/src/components/Screener/StockTable.tsx` | Add `iv_rank` to SortKey, add IV RNK column |
| `frontend/src/components/OptionsChain/OptionsTable.tsx` | Add delta, gamma, theta, vega columns with color coding |
| `frontend/src/components/Indicators/PriceChart.tsx` | Replace Area with Customized candlestick layer; add open/high/low to ChartPoint |
| `frontend/src/components/Tracker/TradeTracker.tsx` | Fetch sparkline data per symbol; pass to TradeRow; add TREND header |
| `frontend/src/components/Tracker/TradeRow.tsx` | Accept sparkline prop; render mini LineChart in new table cell |

---

## Task 1: IV Rank Column in StockTable

**Files:**
- Modify: `frontend/src/components/Screener/StockTable.tsx`

The `iv_rank` field already exists on `StockResult` (0–100 or null). Add it as a sortable column between VOL/AVG and MKT CAP. Color coding: green < 30, amber 30–60, red > 60.

- [ ] **Step 1: Run TypeScript check to establish baseline**

```bash
cd /Users/rutulpatel/workspace/rpatel/stock-tracker/frontend
npm run build 2>&1 | tail -20
```
Expected: clean build (0 errors).

- [ ] **Step 2: Extend SortKey and add ivRankColor helper**

In `frontend/src/components/Screener/StockTable.tsx`, replace:

```typescript
type SortKey = keyof Pick<StockResult, 'symbol' | 'price' | 'change_pct' | 'volume' | 'market_cap' | 'sector'>
```

with:

```typescript
type SortKey = keyof Pick<StockResult, 'symbol' | 'price' | 'change_pct' | 'volume' | 'market_cap' | 'sector' | 'iv_rank'>

function ivRankColor(rank: number | null | undefined): string {
  if (rank == null) return 'var(--text-muted)'
  if (rank < 30) return 'var(--accent-green)'
  if (rank < 60) return '#ffaa00'
  return 'var(--accent-red)'
}
```

- [ ] **Step 3: Add IV RNK column header**

In the `<thead>` section of `StockTable`, after the `VOL/AVG` header block and before the `MKT CAP` header, add:

```tsx
{th('IV RNK', 'iv_rank')}
```

The `th()` helper already handles sort indicators, so this is the entire change.

- [ ] **Step 4: Add IV RNK data cell**

In the `<tbody>` row, after the `VOL/AVG` cell block and before the `MKT CAP` cell, add:

```tsx
<td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: ivRankColor(r.iv_rank) }}>
  {r.iv_rank != null ? r.iv_rank.toFixed(0) : '—'}
</td>
```

- [ ] **Step 5: Verify TypeScript and commit**

```bash
cd /Users/rutulpatel/workspace/rpatel/stock-tracker/frontend
npm run build 2>&1 | tail -20
```
Expected: 0 errors.

```bash
cd /Users/rutulpatel/workspace/rpatel/stock-tracker
git add frontend/src/components/Screener/StockTable.tsx
git commit -m "feat: add IV Rank sortable column to stock screener table"
```

---

## Task 2: Greeks Columns in OptionsTable

**Files:**
- Modify: `frontend/src/components/OptionsChain/OptionsTable.tsx`

`OptionContract` already has `delta`, `gamma`, `theta`, `vega` in the types. Add four new columns with color coding. The options side-by-side layout and ITM highlighting are already implemented — this task only adds the Greek columns.

- [ ] **Step 1: Add Greek color helpers**

In `frontend/src/components/OptionsChain/OptionsTable.tsx`, after the existing `ivColor` function, add:

```typescript
function deltaColor(delta: number | null, type: 'call' | 'put'): string {
  if (delta === null) return 'var(--text-muted)'
  const abs = Math.abs(delta)
  if (abs > 0.7) return type === 'call' ? 'var(--accent-green)' : 'var(--accent-red)'
  if (abs > 0.4) return '#ffaa00'
  return 'var(--text-muted)'
}

function thetaColor(theta: number | null): string {
  if (theta === null) return 'var(--text-muted)'
  return 'var(--accent-red)'
}
```

- [ ] **Step 2: Add Greek column headers**

In the `<thead>` `<tr>`, after the `IV` column header, add:

```tsx
<th style={thStyle}>DELTA</th>
<th style={thStyle}>GAMMA</th>
<th style={thStyle}>THETA</th>
<th style={thStyle}>VEGA</th>
```

- [ ] **Step 3: Add Greek data cells**

In the `<tbody>` row map, after the IV `<td>`, add:

```tsx
<td style={tdStyle({ color: deltaColor(c.delta, type) })}>
  {c.delta !== null ? c.delta.toFixed(3) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
</td>
<td style={tdStyle({ color: 'var(--accent-blue)' })}>
  {c.gamma !== null ? c.gamma.toFixed(4) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
</td>
<td style={tdStyle({ color: thetaColor(c.theta) })}>
  {c.theta !== null ? c.theta.toFixed(4) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
</td>
<td style={tdStyle({ color: 'var(--accent-blue)' })}>
  {c.vega !== null ? c.vega.toFixed(4) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
</td>
```

- [ ] **Step 4: Verify TypeScript and commit**

```bash
cd /Users/rutulpatel/workspace/rpatel/stock-tracker/frontend
npm run build 2>&1 | tail -20
```
Expected: 0 errors.

```bash
cd /Users/rutulpatel/workspace/rpatel/stock-tracker
git add frontend/src/components/OptionsChain/OptionsTable.tsx
git commit -m "feat: add Greeks columns (delta/gamma/theta/vega) to options chain table"
```

---

## Task 3: Candlestick Chart in PriceChart

**Files:**
- Modify: `frontend/src/components/Indicators/PriceChart.tsx`

Replace the `<Area dataKey="close">` with a `<Customized>` layer that renders SVG candlesticks using the yAxisMap and xAxisMap scale functions. Keep all existing overlays (SMA20, SMA50, BB, RSI sub-chart, MACD sub-chart) unchanged.

- [ ] **Step 1: Update imports**

In `frontend/src/components/Indicators/PriceChart.tsx`, replace the current import block:

```typescript
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Customized,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { IndicatorsResponse } from '../../api/types'
```

(`Area` is removed, `Customized` is added.)

- [ ] **Step 2: Update ChartPoint interface to include OHLC**

Replace the existing `ChartPoint` interface:

```typescript
interface ChartPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  sma20: number | null
  sma50: number | null
  bb_upper: number | null
  bb_lower: number | null
  rsi: number | null
  macd: number | null
  macd_signal: number | null
}
```

- [ ] **Step 3: Update chartData mapping to include OHLC**

Replace the existing `chartData` mapping inside `PriceChart`:

```typescript
const chartData: ChartPoint[] = data.prices.map((p, i) => ({
  date: p.date.slice(5),
  open: p.open,
  high: p.high,
  low: p.low,
  close: p.close,
  sma20: data.sma_20[i] ?? null,
  sma50: data.sma_50[i] ?? null,
  bb_upper: data.bb_upper[i] ?? null,
  bb_lower: data.bb_lower[i] ?? null,
  rsi: data.rsi[i] ?? null,
  macd: data.macd[i] ?? null,
  macd_signal: data.macd_signal[i] ?? null,
}))
```

- [ ] **Step 4: Add CandleLayer Customized component**

Add this function above the `PriceChart` component (after the `ChartPoint` interface):

```typescript
interface CandleLayerProps {
  xAxisMap?: Record<string, { scale: ((v: string) => number) & { bandwidth?: () => number }; bandSize?: number }>
  yAxisMap?: Record<string, { scale: (v: number) => number }>
  data?: ChartPoint[]
}

function CandleLayer({ xAxisMap, yAxisMap, data }: CandleLayerProps) {
  if (!xAxisMap || !yAxisMap || !data?.length) return null
  const xAxis = Object.values(xAxisMap)[0]
  const yAxis = Object.values(yAxisMap)[0]
  if (!xAxis || !yAxis) return null

  const xScale = xAxis.scale
  const yScale = yAxis.scale
  const bandWidth = xScale.bandwidth ? xScale.bandwidth() : (xAxis.bandSize ?? 8)

  return (
    <g>
      {data.map((point) => {
        const { date, open, high, low, close } = point
        const xLeft = xScale(date)
        if (xLeft === undefined || isNaN(xLeft)) return null

        const cx = xLeft + bandWidth / 2
        const candleW = Math.max(bandWidth * 0.7, 2)

        const yO = yScale(open)
        const yH = yScale(high)
        const yL = yScale(low)
        const yC = yScale(close)

        const isBullish = close >= open
        const color = isBullish ? '#00ff88' : '#ff3366'
        const bodyTop = Math.min(yO, yC)
        const bodyBottom = Math.max(yO, yC)
        const bodyH = Math.max(bodyBottom - bodyTop, 1)

        return (
          <g key={date}>
            <line x1={cx} y1={yH} x2={cx} y2={bodyTop} stroke={color} strokeWidth={1} />
            <rect
              x={cx - candleW / 2}
              y={bodyTop}
              width={candleW}
              height={bodyH}
              fill={color}
              fillOpacity={isBullish ? 0.75 : 1}
            />
            <line x1={cx} y1={bodyBottom} x2={cx} y2={yL} stroke={color} strokeWidth={1} />
          </g>
        )
      })}
    </g>
  )
}
```

- [ ] **Step 5: Compute YAxis domain from OHLC data**

Add this computation just before the `return (` in `PriceChart`:

```typescript
const priceMin = Math.min(...chartData.map((d) => d.low).filter(Boolean))
const priceMax = Math.max(...chartData.map((d) => d.high).filter(Boolean))
const pricePad = (priceMax - priceMin) * 0.05
const priceDomain: [number, number] = [priceMin - pricePad, priceMax + pricePad]
```

- [ ] **Step 6: Replace Area with Customized in ComposedChart**

In the `<ComposedChart>` block, replace:

```tsx
<Area dataKey="close" name="Price" fill="rgba(0,170,255,0.06)" stroke="#00aaff" strokeWidth={1.5} dot={false} />
```

with:

```tsx
<Customized component={CandleLayer} />
```

Also update the `<YAxis>` in the price chart to use the computed domain (replace `domain={['auto', 'auto']}` with `domain={priceDomain}`):

```tsx
<YAxis domain={priceDomain} tick={tickStyle} tickLine={false} axisLine={false} width={60} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
```

Remove the `<Legend>` element (it no longer adds useful info now that the area line is gone):

Delete the line:
```tsx
<Legend wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)' }} />
```

- [ ] **Step 7: Verify TypeScript and commit**

```bash
cd /Users/rutulpatel/workspace/rpatel/stock-tracker/frontend
npm run build 2>&1 | tail -20
```
Expected: 0 errors.

```bash
cd /Users/rutulpatel/workspace/rpatel/stock-tracker
git add frontend/src/components/Indicators/PriceChart.tsx
git commit -m "feat: replace line chart with true OHLC candlestick chart using Recharts Customized layer"
```

---

## Task 4: Sparkline P&L in TradeTracker

**Files:**
- Modify: `frontend/src/components/Tracker/TradeTracker.tsx`
- Modify: `frontend/src/components/Tracker/TradeRow.tsx`

Fetch 10-day close prices for each unique symbol in the trade list. Cache per symbol in a `Map`. Pass sparkline data to `TradeRow`, which renders a compact `<LineChart>` (80×28px, no axes/tooltip).

- [ ] **Step 1: Add sparkline data fetching to TradeTracker**

In `frontend/src/components/Tracker/TradeTracker.tsx`, add these imports at the top:

```typescript
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import axios from 'axios'
```

Then, inside the `TradeTracker` function, after the existing state declarations, add:

```typescript
const [sparklines, setSparklines] = useState<Record<string, number[]>>({})

useEffect(() => {
  if (!trades.length) return
  const symbols = [...new Set(trades.map((t) => t.symbol))]
  const missing = symbols.filter((s) => !(s in sparklines))
  if (!missing.length) return

  missing.forEach(async (symbol) => {
    try {
      const res = await axios.get(`/api/indicators/${symbol}`, { params: { period: '1mo' } })
      const closes: number[] = (res.data?.prices ?? []).slice(-10).map((p: { close: number }) => p.close)
      if (closes.length) {
        setSparklines((prev) => ({ ...prev, [symbol]: closes }))
      }
    } catch {
      // sparkline is optional — ignore fetch errors
    }
  })
}, [trades])
```

- [ ] **Step 2: Add TREND column header to the tracker table**

In `TradeTracker`, find the `<thead>` row (it contains SYMBOL, TYPE, DIRECTION, ENTRY, etc.). After the `P&L%` `<th>` and before the `ACTIONS` `<th>`, add:

```tsx
<th style={thStyle}>TREND</th>
```

Where `thStyle` matches the existing header style in `TradeTracker.tsx`. Check the file and use the same style object used for other headers.

- [ ] **Step 3: Pass sparkline prop to TradeRow**

In the `TradeTracker` JSX where `<TradeRow>` is rendered, add the `sparkline` prop:

```tsx
<TradeRow
  key={trade.id}
  trade={trade}
  onClose={closeTrade}
  onDelete={deleteTrade}
  sparkline={sparklines[trade.symbol]}
/>
```

- [ ] **Step 4: Add sparkline prop and cell to TradeRow**

In `frontend/src/components/Tracker/TradeRow.tsx`, add the Recharts import at the top:

```typescript
import { LineChart, Line } from 'recharts'
```

Update the `TradeRowProps` interface to include the sparkline:

```typescript
interface TradeRowProps {
  trade: TrackedTrade
  onClose: (id: number, exitPrice: number) => void
  onDelete: (id: number) => void
  sparkline?: number[]
}
```

Update the function signature:

```typescript
export function TradeRow({ trade, onClose, onDelete, sparkline }: TradeRowProps) {
```

In the JSX, after the `P&L%` `<td>` and before the `Actions` `<td>`, add:

```tsx
{/* Sparkline */}
<td style={{ ...td, padding: '4px 8px' }}>
  {sparkline && sparkline.length > 1 ? (
    <LineChart width={80} height={28} data={sparkline.map((v) => ({ v }))}>
      <Line
        type="monotone"
        dataKey="v"
        stroke={sparkline[sparkline.length - 1] >= sparkline[0] ? '#00ff88' : '#ff3366'}
        strokeWidth={1.5}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  ) : (
    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>—</span>
  )}
</td>
```

- [ ] **Step 5: Verify TypeScript and commit**

```bash
cd /Users/rutulpatel/workspace/rpatel/stock-tracker/frontend
npm run build 2>&1 | tail -20
```
Expected: 0 errors.

```bash
cd /Users/rutulpatel/workspace/rpatel/stock-tracker
git add frontend/src/components/Tracker/TradeTracker.tsx frontend/src/components/Tracker/TradeRow.tsx
git commit -m "feat: add sparkline P&L trend column to trade tracker"
```

---

## Self-Review Checklist

- [x] IV Rank: type extended, column header, cell with color coding — covers spec §1
- [x] Greeks: delta/gamma/theta/vega columns added with color coding — covers spec §2
- [x] Side-by-side options layout: already done (not in scope) — spec §2 fully covered
- [x] ITM highlighting: already done (not in scope) — spec §2 fully covered  
- [x] Candlestick: OHLC data in ChartPoint, CandleLayer via Customized, YAxis domain from data — covers spec §3
- [x] RSI/MACD sub-charts: already done, untouched — spec §3 fully covered
- [x] Sparkline: fetch in TradeTracker, pass to TradeRow, render LineChart — covers spec §4
- [x] No TODOs or TBDs
- [x] Type names consistent across tasks (ChartPoint, CandleLayerProps, TradeRowProps)
- [x] No new endpoints needed — all use existing `/api/indicators/{symbol}`
