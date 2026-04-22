import { useEffect, useState } from 'react'
import type { ProjectionRequest } from '../../api/types'
import { useProjection } from '../../hooks/useProjection'
import { useAppStore } from '../../store'
import { ErrorBanner } from '../shared/ErrorBanner'
import { Spinner } from '../shared/Spinner'
import { ProbabilityCard } from './ProbabilityCard'

const TRADE_TYPES = ['stock', 'call', 'put', 'covered_call', 'cash_secured_put', 'spread'] as const
const DIRECTIONS = ['bullish', 'bearish', 'neutral'] as const

type TradeType = typeof TRADE_TYPES[number]
type Direction = typeof DIRECTIONS[number]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  padding: '6px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  width: '100%',
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  padding: '6px 10px',
  fontFamily: 'var(--font-ui)',
  fontSize: 12,
  width: '100%',
}

export function Projector() {
  const { result, loading, error, runProjection } = useProjection()
  const { selectedSymbol, setLastProjection } = useAppStore()

  const [symbol, setSymbol] = useState('')
  const [tradeType, setTradeType] = useState<TradeType>('stock')
  const [direction, setDirection] = useState<Direction>('bullish')
  const [entryPrice, setEntryPrice] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [expiration, setExpiration] = useState('')
  const [strike, setStrike] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (selectedSymbol) setSymbol(selectedSymbol)
  }, [selectedSymbol])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const req: ProjectionRequest = {
      symbol: symbol.trim().toUpperCase(),
      trade_type: tradeType,
      direction,
      entry_price: entryPrice ? parseFloat(entryPrice) : undefined,
      target_price: targetPrice ? parseFloat(targetPrice) : undefined,
      stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
      expiration: expiration || undefined,
      strike: strike ? parseFloat(strike) : undefined,
      notes: notes || undefined,
    }
    runProjection(req).then(() => {
      // result will be set after the hook resolves — handled via useEffect below
    })
  }

  // Persist completed projection to store so Tracker can pre-fill
  useEffect(() => {
    if (result) setLastProjection(result)
  }, [result, setLastProjection])

  const needsOption = tradeType !== 'stock'

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--accent-blue)', letterSpacing: '0.1em', margin: '0 0 16px' }}>
        AI TRADE PROJECTOR
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="SYMBOL *">
            <input
              required
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. AAPL"
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="TRADE TYPE *">
              <select value={tradeType} onChange={(e) => setTradeType(e.target.value as TradeType)} style={selectStyle}>
                {TRADE_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </Field>
            <Field label="DIRECTION *">
              <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)} style={selectStyle}>
                {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="ENTRY $">
              <input value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="0.00" type="number" step="0.01" style={inputStyle} />
            </Field>
            <Field label="TARGET $">
              <input value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="0.00" type="number" step="0.01" style={inputStyle} />
            </Field>
            <Field label="STOP $">
              <input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00" type="number" step="0.01" style={inputStyle} />
            </Field>
          </div>

          {needsOption && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="STRIKE $">
                <input value={strike} onChange={(e) => setStrike(e.target.value)} placeholder="0.00" type="number" step="0.5" style={inputStyle} />
              </Field>
              <Field label="EXPIRATION">
                <input value={expiration} onChange={(e) => setExpiration(e.target.value)} placeholder="YYYY-MM-DD" style={inputStyle} />
              </Field>
            </div>
          )}

          <Field label="NOTES">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional context for the AI..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-ui)', fontSize: 11 }}
            />
          </Field>

          <button
            type="submit"
            disabled={loading || !symbol}
            style={{
              background: loading ? 'var(--border)' : 'var(--accent-blue)',
              color: '#000',
              border: 'none',
              padding: '10px',
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              cursor: loading || !symbol ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}
          >
            {loading ? 'PROJECTING...' : 'RUN PROJECTION'}
          </button>

          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
            Uses {symbol ? symbol : 'selected symbol'} live data · powered by deepseek-r1
          </p>
        </form>

        {/* Result */}
        <div>
          {error && <ErrorBanner message={error} />}
          {loading ? (
            <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '32px', textAlign: 'center' }}>
              <Spinner />
              <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: 12, margin: '8px 0 0' }}>
                Asking deepseek-r1 to analyze the trade…
              </p>
            </div>
          ) : result ? (
            <ProbabilityCard result={result} />
          ) : (
            !error && (
              <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: 12 }}>
                Fill in the form and click RUN PROJECTION
                <br /><br />
                <span style={{ fontSize: 10 }}>The AI will fetch live indicators for the symbol and score the trade</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
