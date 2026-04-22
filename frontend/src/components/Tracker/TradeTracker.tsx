import { useEffect, useState } from 'react'
import type { TrackedTrade, TrackedTradeRequest, TradeType, TradeDirection } from '../../api/types'
import { useTrades } from '../../hooks/useTrades'
import { useAppStore } from '../../store'
import { Spinner } from '../shared/Spinner'
import { ErrorBanner } from '../shared/ErrorBanner'
import { TradeRow } from './TradeRow'

function exportCsv(trades: TrackedTrade[]) {
  const headers = ['ID','Symbol','Type','Direction','Entry','Target','Stop','Qty','Strike','Expiry','Prob%','Status','Entry Date','Exit','Exit Date','P&L','P&L%','Notes']
  const rows = trades.map((t) => [
    t.id, t.symbol, t.trade_type, t.direction, t.entry_price, t.target_price ?? '',
    t.stop_loss ?? '', t.quantity, t.strike ?? '', t.expiration ?? '',
    t.probability_at_entry != null ? (t.probability_at_entry * 100).toFixed(1) : '',
    t.status, t.entry_date?.slice(0, 10) ?? '', t.exit_price ?? '',
    t.exit_date?.slice(0, 10) ?? '', t.pnl ?? '', t.pnl_pct ?? '', t.notes ?? '',
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trades_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const TRADE_TYPES: TradeType[] = ['stock', 'call', 'put', 'covered_call', 'cash_secured_put', 'spread']
const DIRECTIONS: TradeDirection[] = ['bullish', 'bearish', 'neutral']

const inputStyle: React.CSSProperties = {
  background: 'var(--bg)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  padding: '5px 8px',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  width: '100%',
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  padding: '5px 8px',
  fontFamily: 'var(--font-ui)',
  fontSize: 12,
  width: '100%',
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 16px', flex: 1 }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', color: color ?? 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

export function TradeTracker() {
  const { trades, summary, loading, error, fetchTrades, createTrade, closeTrade, deleteTrade } = useTrades()
  const { lastProjection } = useAppStore()
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [symbol, setSymbol] = useState('')
  const [tradeType, setTradeType] = useState<TradeType>('stock')
  const [direction, setDirection] = useState<TradeDirection>('bullish')
  const [entryPrice, setEntryPrice] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [strike, setStrike] = useState('')
  const [expiration, setExpiration] = useState('')
  const [probAtEntry, setProbAtEntry] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => { fetchTrades() }, [fetchTrades])

  function openForm() {
    // Pre-fill from last projection if available
    if (lastProjection) {
      setSymbol(lastProjection.symbol)
      setTradeType(lastProjection.trade_type as TradeType)
      setProbAtEntry(String(lastProjection.probability_of_success))
    }
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const req: TrackedTradeRequest = {
      symbol: symbol.trim().toUpperCase(),
      trade_type: tradeType,
      direction,
      entry_price: parseFloat(entryPrice),
      target_price: targetPrice ? parseFloat(targetPrice) : undefined,
      stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
      quantity: parseInt(quantity) || 1,
      strike: strike ? parseFloat(strike) : undefined,
      expiration: expiration || undefined,
      probability_at_entry: probAtEntry ? parseFloat(probAtEntry) : undefined,
      notes: notes || undefined,
    }
    const created = await createTrade(req)
    if (created) {
      setShowForm(false)
      resetForm()
    }
  }

  function resetForm() {
    setSymbol(''); setTradeType('stock'); setDirection('bullish')
    setEntryPrice(''); setTargetPrice(''); setStopLoss('')
    setQuantity('1'); setStrike(''); setExpiration('')
    setProbAtEntry(''); setNotes('')
  }

  const pnlColor = summary.total_pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'

  const thStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontFamily: 'var(--font-ui)',
    fontSize: 10,
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    background: 'var(--bg)',
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--accent-blue)', letterSpacing: '0.1em', margin: 0 }}>
          TRADE TRACKER
        </h2>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {trades.length > 0 && (
            <button
              onClick={() => exportCsv(trades)}
              style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '6px 14px', fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '0.08em', cursor: 'pointer' }}
            >
              EXPORT CSV
            </button>
          )}
          <button
            onClick={openForm}
            style={{ background: 'var(--accent-green)', color: '#000', border: 'none', padding: '6px 16px', fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer' }}
          >
            + ADD TRADE
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <SummaryCard label="TOTAL TRADES" value={String(summary.total)} />
        <SummaryCard label="OPEN" value={String(summary.open)} color="var(--accent-blue)" />
        <SummaryCard label="CLOSED" value={String(summary.closed)} />
        <SummaryCard label="WIN RATE" value={summary.closed > 0 ? `${(summary.win_rate * 100).toFixed(1)}%` : '—'} color={summary.win_rate >= 0.5 ? 'var(--accent-green)' : 'var(--accent-red)'} />
        <SummaryCard label="TOTAL P&L" value={summary.total_pnl !== 0 ? `${summary.total_pnl >= 0 ? '+' : ''}$${summary.total_pnl.toFixed(2)}` : '$0.00'} color={pnlColor} />
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Add Trade Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ border: '1px solid var(--accent-green)', background: 'var(--surface)', padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent-green)' }}>NEW TRADE</span>
            {lastProjection && <span style={{ marginLeft: 12, fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)' }}>pre-filled from last projection</span>}
            <button type="button" onClick={() => { setShowForm(false); resetForm() }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>SYMBOL *</div>
              <input required value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>TYPE *</div>
              <select value={tradeType} onChange={(e) => setTradeType(e.target.value as TradeType)} style={selectStyle}>
                {TRADE_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>DIRECTION *</div>
              <select value={direction} onChange={(e) => setDirection(e.target.value as TradeDirection)} style={selectStyle}>
                {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>ENTRY $ *</div>
              <input required value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="0.00" type="number" step="0.01" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>TARGET $</div>
              <input value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="0.00" type="number" step="0.01" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>STOP $</div>
              <input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00" type="number" step="0.01" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>QTY</div>
              <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" type="number" min="1" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>STRIKE $</div>
              <input value={strike} onChange={(e) => setStrike(e.target.value)} placeholder="0.00" type="number" step="0.5" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>EXPIRY</div>
              <input value={expiration} onChange={(e) => setExpiration(e.target.value)} placeholder="YYYY-MM-DD" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>PROB %</div>
              <input value={probAtEntry} onChange={(e) => setProbAtEntry(e.target.value)} placeholder="0.0–1.0" type="number" step="0.01" min="0" max="1" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>NOTES</div>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." style={{ ...inputStyle, width: '100%' }} />
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={{ background: 'var(--accent-green)', color: '#000', border: 'none', padding: '7px 20px', fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer' }}>
              SAVE TRADE
            </button>
            <button type="button" onClick={() => { setShowForm(false); resetForm() }} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '7px 16px', fontFamily: 'var(--font-ui)', fontSize: 11, cursor: 'pointer' }}>
              CANCEL
            </button>
          </div>
        </form>
      )}

      {/* Trade Table */}
      {loading && trades.length === 0 ? (
        <Spinner />
      ) : trades.length > 0 ? (
        <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left' }}>SYMBOL</th>
                <th style={thStyle}>TYPE</th>
                <th style={thStyle}>DIR</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ENTRY</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>TARGET</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>STOP</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>PROB</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>P&L</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>P&L %</th>
                <th style={thStyle}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <TradeRow key={t.id} trade={t} onClose={closeTrade} onDelete={deleteTrade} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && (
          <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: 12 }}>
            No trades yet — click + ADD TRADE to start tracking
          </div>
        )
      )}
    </div>
  )
}
