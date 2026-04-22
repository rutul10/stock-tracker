import { useEffect, useState } from 'react'
import { useIndicators } from '../../hooks/useIndicators'
import { useAppStore } from '../../store'
import { Spinner } from '../shared/Spinner'
import { ErrorBanner } from '../shared/ErrorBanner'
import { PriceChart } from './PriceChart'

const PERIODS = ['1mo', '3mo', '6mo', '1y'] as const
type Period = typeof PERIODS[number]

const INDICATOR_TOGGLES = [
  { key: 'sma20', label: 'SMA20', color: '#ffaa00' },
  { key: 'sma50', label: 'SMA50', color: '#ff6600' },
  { key: 'bb', label: 'BB', color: '#6b6b8a' },
  { key: 'rsi', label: 'RSI', color: '#aa66ff' },
  { key: 'macd', label: 'MACD', color: '#00aaff' },
]

export function Indicators() {
  const { data, loading, error, fetchIndicators } = useIndicators()
  const { selectedSymbol } = useAppStore()
  const [inputSymbol, setInputSymbol] = useState('')
  const [period, setPeriod] = useState<Period>('3mo')
  const [visible, setVisible] = useState<Record<string, boolean>>({
    sma20: true, sma50: true, bb: false, rsi: true, macd: false,
  })

  useEffect(() => {
    if (selectedSymbol) {
      setInputSymbol(selectedSymbol)
      fetchIndicators(selectedSymbol, period)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol])

  function handleFetch() {
    const sym = inputSymbol.trim().toUpperCase()
    if (sym) fetchIndicators(sym, period)
  }

  function handlePeriodChange(p: Period) {
    setPeriod(p)
    const sym = (data?.symbol || inputSymbol).toUpperCase()
    if (sym) fetchIndicators(sym, p)
  }

  function toggleIndicator(key: string) {
    setVisible((v) => ({ ...v, [key]: !v[key] }))
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--accent-blue)', letterSpacing: '0.1em', margin: 0 }}>
          INDICATORS
        </h2>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <input
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            placeholder="SYMBOL"
            style={{ width: 90, background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.05em' }}
          />

          <div style={{ display: 'flex', gap: 2 }}>
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                style={{
                  background: period === p ? 'var(--accent-blue)' : 'var(--surface)',
                  color: period === p ? '#000' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  padding: '3px 8px',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 10,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleFetch}
            disabled={loading}
            style={{ background: loading ? 'var(--border)' : 'var(--accent-blue)', color: '#000', border: 'none', padding: '5px 14px', fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'LOADING...' : 'LOAD'}
          </button>
        </div>
      </div>

      {/* Indicator toggles */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {INDICATOR_TOGGLES.map((t) => (
          <button
            key={t.key}
            onClick={() => toggleIndicator(t.key)}
            style={{
              background: visible[t.key] ? `${t.color}22` : 'transparent',
              color: visible[t.key] ? t.color : 'var(--text-muted)',
              border: `1px solid ${visible[t.key] ? t.color : 'var(--border)'}`,
              padding: '2px 10px',
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              cursor: 'pointer',
              letterSpacing: '0.08em',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      {loading && !data ? (
        <Spinner />
      ) : data ? (
        <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '12px 8px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-ui)', marginBottom: 8 }}>
            {data.symbol} · {data.period} · {data.prices.length} bars
            {data.prices.length > 0 && (
              <span style={{ marginLeft: 12, color: 'var(--text-primary)' }}>
                Last: ${data.prices[data.prices.length - 1]?.close.toFixed(2)}
              </span>
            )}
          </div>
          <PriceChart data={data} visibleIndicators={visible} />
        </div>
      ) : (
        !loading && (
          <div style={{ color: 'var(--text-muted)', padding: '32px', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 12 }}>
            Enter a symbol and click LOAD, or select a stock in the Screener tab
          </div>
        )
      )}
    </div>
  )
}
