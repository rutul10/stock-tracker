import type { ComparisonData } from '../../hooks/useComparison'
import {
  rsiToMomentumLabel,
  smaToTrendLabel,
  atrToVolatilityLabel,
  lastValue,
} from '../../hooks/useComparison'

interface Props {
  symbolA: string
  symbolB: string
  dataA: ComparisonData
  dataB: ComparisonData
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent-blue)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  )
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score))
  const r = pct < 50 ? 255 : Math.round(255 * (1 - (pct - 50) / 50))
  const g = pct > 50 ? 255 : Math.round(255 * (pct / 50))
  const color = `rgb(${r},${g},60)`
  return (
    <div
      style={{
        height: 8,
        background: 'var(--border)',
        borderRadius: 4,
        overflow: 'hidden',
        width: '100%',
        marginTop: 6,
        marginBottom: 4,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 4,
          transition: 'width 0.4s',
        }}
      />
    </div>
  )
}

function directionLabel(direction: string): string {
  if (direction === 'bullish') return '▲ BULLISH'
  if (direction === 'bearish') return '▼ BEARISH'
  return '→ NEUTRAL'
}

function directionColor(direction: string): string {
  if (direction === 'bullish') return 'var(--accent-green)'
  if (direction === 'bearish') return 'var(--accent-red)'
  return 'var(--accent-blue)'
}

interface SymbolColumnProps {
  symbol: string
  data: ComparisonData
  accentColor: string
}

function SymbolColumn({ symbol, data, accentColor }: SymbolColumnProps) {
  if (data.loading) {
    return (
      <div
        style={{
          flex: 1,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          minHeight: 260,
          fontFamily: 'var(--font-ui)',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        <Spinner /> Loading {symbol}…
      </div>
    )
  }

  const ind = data.indicators
  const ts = data.tradeScore

  const prices = ind?.prices ?? []
  const lastClose = prices.length > 0 ? prices[prices.length - 1].close : null
  const rsi = lastValue(ind?.rsi ?? [])
  const sma20 = lastValue(ind?.sma_20 ?? [])
  const sma50 = lastValue(ind?.sma_50 ?? [])
  const atr = lastValue(ind?.atr ?? [])

  const momentum = rsi !== null ? rsiToMomentumLabel(rsi) : '--'
  const trend =
    lastClose !== null && sma20 !== null && sma50 !== null
      ? smaToTrendLabel(lastClose, sma20, sma50)
      : '--'
  const volatility =
    atr !== null && lastClose !== null ? atrToVolatilityLabel(atr, lastClose) : '--'

  const bear2W = lastClose !== null && atr !== null ? (lastClose - atr * 2).toFixed(2) : '--'
  const bull2W = lastClose !== null && atr !== null ? (lastClose + atr * 3).toFixed(2) : '--'

  const score = ts?.score ?? null
  const direction = ts?.direction ?? 'neutral'

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-ui)',
    fontSize: 11,
    color: 'var(--text-muted)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  }

  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    color: 'var(--text-primary)',
  }

  const rowStyle: React.CSSProperties = {
    marginBottom: 14,
  }

  return (
    <div
      style={{
        flex: 1,
        background: 'var(--surface)',
        border: `1px solid ${accentColor}44`,
        borderRadius: 6,
        padding: 20,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.4rem',
          letterSpacing: '0.1em',
          color: accentColor,
          marginBottom: 16,
        }}
      >
        {symbol}
      </div>

      {/* Trade Score */}
      <div style={rowStyle}>
        <div style={labelStyle}>Trade Score</div>
        {score !== null ? (
          <>
            <ScoreBar score={score} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ ...valueStyle, fontSize: 22, fontWeight: 700, color: accentColor }}>
                {score.toFixed(0)}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: directionColor(direction),
                  letterSpacing: '0.08em',
                }}
              >
                {directionLabel(direction)}
              </span>
            </div>
          </>
        ) : (
          <span style={valueStyle}>--</span>
        )}
      </div>

      {/* Momentum */}
      <div style={rowStyle}>
        <div style={labelStyle}>Momentum</div>
        <div style={valueStyle}>{momentum}</div>
      </div>

      {/* Trend */}
      <div style={rowStyle}>
        <div style={labelStyle}>Trend</div>
        <div style={valueStyle}>{trend}</div>
      </div>

      {/* Volatility */}
      <div style={rowStyle}>
        <div style={labelStyle}>Volatility Risk</div>
        <div style={valueStyle}>{volatility}</div>
      </div>

      {/* 2-week outlook */}
      <div style={rowStyle}>
        <div style={labelStyle}>2-Week Price Outlook</div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <span style={{ color: 'var(--accent-red)' }}>Bear: {bear2W}</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--accent-green)' }}>Bull: {bull2W}</span>
        </div>
        {lastClose !== null && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            Last: {lastClose.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  )
}

export function VerdictPanel({ symbolA, symbolB, dataA, dataB }: Props) {
  const scoreA = dataA.tradeScore?.score ?? null
  const scoreB = dataB.tradeScore?.score ?? null

  let winner: string | null = null
  let winnerColor = 'var(--accent-green)'
  let winnerMsg = ''

  if (scoreA !== null && scoreB !== null) {
    const diff = Math.abs(scoreA - scoreB)
    if (diff <= 5) {
      winnerMsg = 'TOO CLOSE TO CALL'
      winnerColor = 'var(--text-muted)'
    } else if (scoreA > scoreB) {
      winner = symbolA
      winnerMsg = symbolA
      winnerColor = '#00aaff'
    } else {
      winner = symbolB
      winnerMsg = symbolB
      winnerColor = '#ff8800'
    }
  }

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <SymbolColumn symbol={symbolA} data={dataA} accentColor="#00aaff" />
        <SymbolColumn symbol={symbolB} data={dataB} accentColor="#ff8800" />
      </div>

      {/* Winner declaration */}
      {(scoreA !== null && scoreB !== null) && (
        <div
          style={{
            marginTop: 24,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '18px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Overall Verdict
          </div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: winner ? '2rem' : '1.4rem',
              letterSpacing: '0.15em',
              color: winnerColor,
            }}
          >
            {winner ? `WINNER: ${winnerMsg}` : winnerMsg}
          </div>
          {winner && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-muted)',
                marginTop: 6,
              }}
            >
              {symbolA}: {scoreA?.toFixed(0)} &nbsp;|&nbsp; {symbolB}: {scoreB?.toFixed(0)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
