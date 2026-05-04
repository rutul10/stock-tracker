import type { ComparisonData } from '../../hooks/useComparison'
import {
  rsiToMomentumLabel,
  smaToTrendLabel,
  atrToVolatilityLabel,
  ivToOptionsLabel,
  lastValue,
} from '../../hooks/useComparison'

interface Props {
  symbolA: string
  symbolB: string
  dataA: ComparisonData
  dataB: ComparisonData
}

type WinSide = 'A' | 'B' | 'tie'

function momentumScore(rsi: number | null): number {
  if (rsi === null) return 0
  const dist = Math.abs(rsi - 60)
  return Math.max(0, 100 - dist * 2)
}

function trendScore(price: number | null, sma20: number | null, sma50: number | null): number {
  if (price === null || sma20 === null || sma50 === null) return 0
  if (price >= sma20 && price >= sma50) return 2
  if (price >= sma20) return 1
  return 0
}

function volatilityScore(atr: number | null, price: number | null): number {
  if (atr === null || price === null || price <= 0) return 1
  const ratio = atr / price
  if (ratio < 0.02) return 2
  if (ratio <= 0.04) return 1
  return 0
}

function ivScore(iv: number | null | undefined): number {
  if (iv === null || iv === undefined) return 1
  if (iv < 0.2) return 1
  if (iv <= 0.35) return 2
  return 1
}

function compareWin(scoreA: number, scoreB: number): WinSide {
  if (scoreA > scoreB) return 'A'
  if (scoreB > scoreA) return 'B'
  return 'tie'
}

interface RowData {
  factor: string
  valueA: string
  valueB: string
  winner: WinSide
}

function buildRows(dataA: ComparisonData, dataB: ComparisonData): RowData[] {
  const indA = dataA.indicators
  const indB = dataB.indicators
  const tsA = dataA.tradeScore
  const tsB = dataB.tradeScore

  const closeA = indA && indA.prices.length > 0 ? indA.prices[indA.prices.length - 1].close : null
  const closeB = indB && indB.prices.length > 0 ? indB.prices[indB.prices.length - 1].close : null

  const rsiA = lastValue(indA?.rsi ?? [])
  const rsiB = lastValue(indB?.rsi ?? [])
  const sma20A = lastValue(indA?.sma_20 ?? [])
  const sma20B = lastValue(indB?.sma_20 ?? [])
  const sma50A = lastValue(indA?.sma_50 ?? [])
  const sma50B = lastValue(indB?.sma_50 ?? [])
  const atrA = lastValue(indA?.atr ?? [])
  const atrB = lastValue(indB?.atr ?? [])
  const ivA = tsA?.components?.iv ?? null
  const ivB = tsB?.components?.iv ?? null

  const rows: RowData[] = []

  rows.push({
    factor: 'Momentum',
    valueA: rsiA !== null ? `${rsiToMomentumLabel(rsiA)} (RSI ${rsiA.toFixed(1)})` : '--',
    valueB: rsiB !== null ? `${rsiToMomentumLabel(rsiB)} (RSI ${rsiB.toFixed(1)})` : '--',
    winner: compareWin(momentumScore(rsiA), momentumScore(rsiB)),
  })

  rows.push({
    factor: 'Trend',
    valueA: closeA !== null && sma20A !== null && sma50A !== null
      ? smaToTrendLabel(closeA, sma20A, sma50A) : '--',
    valueB: closeB !== null && sma20B !== null && sma50B !== null
      ? smaToTrendLabel(closeB, sma20B, sma50B) : '--',
    winner: compareWin(trendScore(closeA, sma20A, sma50A), trendScore(closeB, sma20B, sma50B)),
  })

  rows.push({
    factor: 'Volatility',
    valueA: atrA !== null && closeA !== null ? atrToVolatilityLabel(atrA, closeA) : '--',
    valueB: atrB !== null && closeB !== null ? atrToVolatilityLabel(atrB, closeB) : '--',
    winner: compareWin(volatilityScore(atrA, closeA), volatilityScore(atrB, closeB)),
  })

  rows.push({
    factor: 'Options Activity',
    valueA: ivA !== null ? ivToOptionsLabel(ivA) : '--',
    valueB: ivB !== null ? ivToOptionsLabel(ivB) : '--',
    winner: compareWin(ivScore(ivA), ivScore(ivB)),
  })

  rows.push({
    factor: 'Overall Score',
    valueA: tsA ? tsA.score.toFixed(0) : '--',
    valueB: tsB ? tsB.score.toFixed(0) : '--',
    winner: compareWin(tsA?.score ?? 0, tsB?.score ?? 0),
  })

  return rows
}

export function IndicatorBreakdown({ symbolA, symbolB, dataA, dataB }: Props) {
  const rows = buildRows(dataA, dataB)

  const thStyle: React.CSSProperties = {
    padding: '8px 14px',
    textAlign: 'right',
    fontFamily: 'var(--font-ui)',
    fontSize: 10,
    letterSpacing: '0.09em',
    color: 'var(--text-muted)',
    fontWeight: 600,
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  }

  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.1rem',
          letterSpacing: '0.1em',
          color: 'var(--text-primary)',
          marginBottom: 16,
        }}
      >
        INDICATOR BREAKDOWN
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left' }}>FACTOR</th>
              <th style={{ ...thStyle, color: '#00aaff' }}>{symbolA}</th>
              <th style={{ ...thStyle, color: '#ff8800' }}>{symbolB}</th>
              <th style={{ ...thStyle }}>WINNER</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const winnerLabel =
                row.winner === 'A'
                  ? symbolA
                  : row.winner === 'B'
                  ? symbolB
                  : 'TIE'
              const winnerColor =
                row.winner === 'A'
                  ? '#00aaff'
                  : row.winner === 'B'
                  ? '#ff8800'
                  : 'var(--text-muted)'

              return (
                <tr
                  key={row.factor}
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <td
                    style={{
                      padding: '10px 14px',
                      fontFamily: 'var(--font-ui)',
                      fontSize: 11,
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {row.factor}
                  </td>
                  <td
                    style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color:
                        row.winner === 'A' ? 'var(--accent-green)' : 'var(--text-primary)',
                      fontWeight: row.winner === 'A' ? 700 : 400,
                    }}
                  >
                    {row.valueA}
                  </td>
                  <td
                    style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color:
                        row.winner === 'B' ? 'var(--accent-green)' : 'var(--text-primary)',
                      fontWeight: row.winner === 'B' ? 700 : 400,
                    }}
                  >
                    {row.valueB}
                  </td>
                  <td
                    style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: row.winner !== 'tie' ? 'var(--accent-green)' : winnerColor,
                      fontWeight: row.winner !== 'tie' ? 700 : 400,
                    }}
                  >
                    <span style={{ color: winnerColor }}>{winnerLabel}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
