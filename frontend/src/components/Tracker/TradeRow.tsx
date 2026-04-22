import { useState } from 'react'
import type { TrackedTrade } from '../../api/types'
import { Badge } from '../shared/Badge'

interface TradeRowProps {
  trade: TrackedTrade
  onClose: (id: number, exitPrice: number) => void
  onDelete: (id: number) => void
}

function pnlColor(pnl: number | null): string {
  if (pnl === null) return 'var(--text-muted)'
  return pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
}

function statusVariant(status: string): 'green' | 'red' | 'muted' {
  if (status === 'open') return 'green'
  if (status === 'closed') return 'muted'
  return 'red'
}

function dirVariant(dir: string): 'green' | 'red' | 'blue' {
  if (dir === 'bullish') return 'green'
  if (dir === 'bearish') return 'red'
  return 'blue'
}

function fmt(n: number): string {
  return n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`
}

export function TradeRow({ trade, onClose, onDelete }: TradeRowProps) {
  const [closing, setClosing] = useState(false)
  const [exitInput, setExitInput] = useState('')

  const td: React.CSSProperties = {
    padding: '8px 10px',
    borderBottom: '1px solid var(--border)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    verticalAlign: 'middle',
  }

  function handleClose() {
    const price = parseFloat(exitInput)
    if (!price || isNaN(price)) return
    onClose(trade.id, price)
    setClosing(false)
    setExitInput('')
  }

  return (
    <tr style={{ background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Symbol */}
      <td style={{ ...td, fontWeight: 700, color: 'var(--text-primary)' }}>
        {trade.symbol}
        {trade.strike && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>
            ${trade.strike} {trade.expiration?.slice(5)}
          </div>
        )}
      </td>

      {/* Type */}
      <td style={{ ...td, color: 'var(--text-muted)', fontSize: 11 }}>
        {trade.trade_type.replace('_', ' ')}
      </td>

      {/* Direction */}
      <td style={td}>
        <Badge label={trade.direction} variant={dirVariant(trade.direction)} />
      </td>

      {/* Entry */}
      <td style={{ ...td, textAlign: 'right' }}>${trade.entry_price.toFixed(2)}</td>

      {/* Target */}
      <td style={{ ...td, textAlign: 'right', color: 'var(--text-muted)' }}>
        {trade.target_price ? `$${trade.target_price.toFixed(2)}` : '—'}
      </td>

      {/* Stop */}
      <td style={{ ...td, textAlign: 'right', color: 'var(--text-muted)' }}>
        {trade.stop_loss ? `$${trade.stop_loss.toFixed(2)}` : '—'}
      </td>

      {/* Prob % */}
      <td style={{ ...td, textAlign: 'right', color: 'var(--text-muted)' }}>
        {trade.probability_at_entry != null
          ? `${Math.round(trade.probability_at_entry * 100)}%`
          : '—'}
      </td>

      {/* Status */}
      <td style={td}>
        <Badge label={trade.status} variant={statusVariant(trade.status)} />
      </td>

      {/* P&L */}
      <td style={{ ...td, textAlign: 'right', color: pnlColor(trade.pnl), fontWeight: trade.pnl !== null ? 600 : 400 }}>
        {trade.pnl !== null ? fmt(trade.pnl) : '—'}
      </td>

      {/* P&L % */}
      <td style={{ ...td, textAlign: 'right', color: pnlColor(trade.pnl_pct) }}>
        {trade.pnl_pct !== null
          ? `${trade.pnl_pct >= 0 ? '+' : ''}${trade.pnl_pct.toFixed(2)}%`
          : '—'}
      </td>

      {/* Actions */}
      <td style={{ ...td, whiteSpace: 'nowrap' }}>
        {trade.status === 'open' && !closing && (
          <button
            onClick={() => setClosing(true)}
            style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(0,255,136,0.3)', padding: '3px 8px', fontFamily: 'var(--font-ui)', fontSize: 10, cursor: 'pointer', marginRight: 6 }}
          >
            CLOSE
          </button>
        )}
        {closing && (
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
            <input
              autoFocus
              value={exitInput}
              onChange={(e) => setExitInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleClose(); if (e.key === 'Escape') setClosing(false) }}
              placeholder="exit $"
              type="number"
              step="0.01"
              style={{ width: 72, background: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '3px 6px', fontFamily: 'var(--font-mono)', fontSize: 11 }}
            />
            <button onClick={handleClose} style={{ background: 'var(--accent-green)', color: '#000', border: 'none', padding: '3px 6px', fontFamily: 'var(--font-ui)', fontSize: 10, cursor: 'pointer' }}>✓</button>
            <button onClick={() => setClosing(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '3px 6px', fontFamily: 'var(--font-ui)', fontSize: 10, cursor: 'pointer' }}>✕</button>
          </span>
        )}
        <button
          onClick={() => onDelete(trade.id)}
          style={{ background: 'rgba(255,51,102,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255,51,102,0.3)', padding: '3px 8px', fontFamily: 'var(--font-ui)', fontSize: 10, cursor: 'pointer' }}
        >
          DEL
        </button>
      </td>
    </tr>
  )
}
