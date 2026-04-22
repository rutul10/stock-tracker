import {
  Area,
  ComposedChart,
  CartesianGrid,
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

interface PriceChartProps {
  data: IndicatorsResponse
  visibleIndicators: Record<string, boolean>
}

interface ChartPoint {
  date: string
  close: number
  sma20: number | null
  sma50: number | null
  bb_upper: number | null
  bb_lower: number | null
  rsi: number | null
  macd: number | null
  macd_signal: number | null
}

export function PriceChart({ data, visibleIndicators }: PriceChartProps) {
  const chartData: ChartPoint[] = data.prices.map((p, i) => ({
    date: p.date.slice(5), // MM-DD
    close: p.close,
    sma20: data.sma_20[i],
    sma50: data.sma_50[i],
    bb_upper: data.bb_upper[i],
    bb_lower: data.bb_lower[i],
    rsi: data.rsi[i],
    macd: data.macd[i],
    macd_signal: data.macd_signal[i],
  }))

  const tickStyle = { fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }

  const tooltipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-primary)',
  }

  const showRsi = visibleIndicators['rsi']
  const showMacd = visibleIndicators['macd']

  return (
    <div>
      {/* Price chart */}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} syncId="chart" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,30,46,0.8)" />
          <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis domain={['auto', 'auto']} tick={tickStyle} tickLine={false} axisLine={false} width={60} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-muted)' }} formatter={(v: number) => [`$${v.toFixed(2)}`]} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)' }} />

          <Area dataKey="close" name="Price" fill="rgba(0,170,255,0.06)" stroke="#00aaff" strokeWidth={1.5} dot={false} />

          {visibleIndicators['sma20'] && (
            <Line dataKey="sma20" name="SMA20" stroke="#ffaa00" strokeWidth={1} dot={false} connectNulls />
          )}
          {visibleIndicators['sma50'] && (
            <Line dataKey="sma50" name="SMA50" stroke="#ff6600" strokeWidth={1} dot={false} connectNulls />
          )}
          {visibleIndicators['bb'] && (
            <>
              <Line dataKey="bb_upper" name="BB Upper" stroke="rgba(107,107,138,0.6)" strokeWidth={1} strokeDasharray="4 2" dot={false} connectNulls />
              <Line dataKey="bb_lower" name="BB Lower" stroke="rgba(107,107,138,0.6)" strokeWidth={1} strokeDasharray="4 2" dot={false} connectNulls />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* RSI sub-chart */}
      {showRsi && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', paddingLeft: 4, marginBottom: 2 }}>RSI (14)</div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={chartData} syncId="chart" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,30,46,0.8)" />
              <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={tickStyle} tickLine={false} axisLine={false} width={60} ticks={[30, 50, 70]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v?.toFixed(1)]} />
              <ReferenceLine y={70} stroke="rgba(255,51,102,0.4)" strokeDasharray="4 2" />
              <ReferenceLine y={30} stroke="rgba(0,255,136,0.4)" strokeDasharray="4 2" />
              <ReferenceLine y={50} stroke="rgba(107,107,138,0.3)" />
              <Line dataKey="rsi" name="RSI" stroke="#aa66ff" strokeWidth={1.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD sub-chart */}
      {showMacd && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', paddingLeft: 4, marginBottom: 2 }}>MACD (12,26,9)</div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={chartData} syncId="chart" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,30,46,0.8)" />
              <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={['auto', 'auto']} tick={tickStyle} tickLine={false} axisLine={false} width={60} tickFormatter={(v: number) => v.toFixed(2)} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v?.toFixed(4)]} />
              <ReferenceLine y={0} stroke="rgba(107,107,138,0.4)" />
              <Line dataKey="macd" name="MACD" stroke="#00aaff" strokeWidth={1.5} dot={false} connectNulls />
              <Line dataKey="macd_signal" name="Signal" stroke="#ff6600" strokeWidth={1} dot={false} connectNulls strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
