import { useState } from 'react'
import type { StockResult } from '../../api/types'

interface StockTableProps {
  results: StockResult[]
  onSelect: (symbol: string) => void
  selectedSymbol: string
  onOpenDetail?: (symbol: string, price: number | null) => void
  onAddToWatchlist?: (symbol: string) => void
  watchlist?: string[]
  onRemoveFromWatchlist?: (symbol: string) => void
}

type SortKey = keyof Pick<StockResult, 'symbol' | 'price' | 'change_pct' | 'volume' | 'market_cap' | 'sector'>

export function fmt(n: number | null | undefined): string {
  if (n == null || n === 0) return '—'
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return String(n)
}

function volAvgDisplay(volume: number | null | undefined, avgVolume: number | null | undefined): { label: string; color: string } {
  if (!volume || !avgVolume) return { label: '—', color: 'var(--text-muted)' }
  const ratio = volume / avgVolume
  const label = `${ratio.toFixed(1)}x`
  const color = ratio > 1.2 ? 'var(--accent-green)' : ratio < 0.8 ? 'var(--accent-red)' : 'var(--text-muted)'
  return { label, color }
}

export function StockTable({ results, onSelect, selectedSymbol, onOpenDetail, onAddToWatchlist, watchlist, onRemoveFromWatchlist }: StockTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('volume')
  const [sortAsc, setSortAsc] = useState(false)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const sorted = [...results].sort((a, b) => {
    const av = a[sortKey] ?? 0
    const bv = b[sortKey] ?? 0
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortAsc ? cmp : -cmp
  })

  const thStyle = (key: SortKey): React.CSSProperties => ({
    cursor: 'pointer',
    padding: '10px 14px',
    textAlign: 'right',
    color: sortKey === key ? 'var(--accent-blue)' : 'var(--text-muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: 11,
    letterSpacing: '0.08em',
    borderBottom: '1px solid var(--border)',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  })

  const th = (label: string, key: SortKey) => (
    <th onClick={() => toggleSort(key)} style={thStyle(key)}>
      {label} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  )

  const showWatchlistCol = !!onAddToWatchlist || !!onRemoveFromWatchlist
  const hasAvgVolume = results.some((r) => r.avg_volume != null && r.avg_volume > 0)

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg)' }}>
            <th onClick={() => toggleSort('symbol')} style={{ ...thStyle('symbol'), textAlign: 'left' }}>
              SYMBOL {sortKey === 'symbol' ? (sortAsc ? '↑' : '↓') : ''}
            </th>
            {th('PRICE', 'price')}
            {th('CHG %', 'change_pct')}
            {th('VOLUME', 'volume')}
            {hasAvgVolume && (
              <th style={{ ...thStyle('volume'), cursor: 'default', color: 'var(--text-muted)' }}>VOL/AVG</th>
            )}
            {th('MKT CAP', 'market_cap')}
            {th('SECTOR', 'sector')}
            {showWatchlistCol && (
              <th style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', width: 40 }} />
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const isSelected = r.symbol === selectedSymbol
            const isPos = (r.change_pct ?? 0) >= 0
            const isWatched = watchlist?.includes(r.symbol) ?? false
            const volAvg = volAvgDisplay(r.volume, r.avg_volume)
            return (
              <tr
                key={r.symbol}
                onClick={() => onSelect(r.symbol)}
                style={{
                  background: isSelected ? 'rgba(0,170,255,0.08)' : 'transparent',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(128,128,128,0.06)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                {/* Symbol cell — ticker is a clickable link */}
                <td style={{ padding: '10px 14px' }}>
                  {onOpenDetail ? (
                    <span
                      onClick={(e) => { e.stopPropagation(); onOpenDetail(r.symbol, r.price ?? null) }}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: 14,
                        color: 'var(--accent-blue)',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        borderBottom: '1px dashed transparent',
                        transition: 'border-color 0.1s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = 'var(--accent-blue)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
                      title="Open stock detail"
                    >
                      {r.symbol}
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                      {r.symbol}
                    </span>
                  )}
                  {r.name && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>
                      {r.name}
                    </div>
                  )}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  ${(r.price ?? 0).toFixed(2)}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: isPos ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {isPos ? '+' : ''}{(r.change_pct ?? 0).toFixed(2)}%
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {fmt(r.volume)}
                </td>
                {hasAvgVolume && (
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: volAvg.color }}>
                    {volAvg.label}
                  </td>
                )}
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {fmt(r.market_cap)}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-muted)' }}>
                  {r.sector ?? '—'}
                </td>
                {showWatchlistCol && (
                  <td style={{ padding: '10px 8px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    {onRemoveFromWatchlist ? (
                      <button
                        onClick={() => onRemoveFromWatchlist(r.symbol)}
                        title="Remove from watchlist"
                        style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: 14, padding: '0 4px', lineHeight: 1 }}
                      >
                        ×
                      </button>
                    ) : onAddToWatchlist ? (
                      <button
                        onClick={() => !isWatched && onAddToWatchlist(r.symbol)}
                        disabled={isWatched}
                        title={isWatched ? 'Already in watchlist' : 'Add to watchlist'}
                        style={{
                          background: 'none',
                          border: `1px solid ${isWatched ? 'var(--text-muted)' : 'var(--accent-green)'}`,
                          color: isWatched ? 'var(--text-muted)' : 'var(--accent-green)',
                          cursor: isWatched ? 'default' : 'pointer',
                          fontSize: 10,
                          padding: '1px 5px',
                          fontFamily: 'var(--font-ui)',
                          borderRadius: 2,
                        }}
                      >
                        {isWatched ? '✓' : '+'}
                      </button>
                    ) : null}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
