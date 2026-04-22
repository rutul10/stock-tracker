import { useState } from 'react'
import type { StockResult } from '../../api/types'

interface StockTableProps {
  results: StockResult[]
  onSelect: (symbol: string) => void
  selectedSymbol: string
}

type SortKey = keyof Pick<StockResult, 'symbol' | 'price' | 'change_pct' | 'volume' | 'market_cap' | 'sector'>

function fmt(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return String(n)
}

export function StockTable({ results, onSelect, selectedSymbol }: StockTableProps) {
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

  const th = (label: string, key: SortKey) => (
    <th
      onClick={() => toggleSort(key)}
      style={{
        cursor: 'pointer',
        padding: '6px 12px',
        textAlign: 'right',
        color: sortKey === key ? 'var(--accent-blue)' : 'var(--text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: 11,
        letterSpacing: '0.08em',
        borderBottom: '1px solid var(--border)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg)' }}>
            <th onClick={() => toggleSort('symbol')} style={{ cursor: 'pointer', padding: '6px 12px', textAlign: 'left', color: sortKey === 'symbol' ? 'var(--accent-blue)' : 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '0.08em', borderBottom: '1px solid var(--border)', userSelect: 'none' }}>
              SYMBOL {sortKey === 'symbol' ? (sortAsc ? '↑' : '↓') : ''}
            </th>
            {th('PRICE', 'price')}
            {th('CHG %', 'change_pct')}
            {th('VOLUME', 'volume')}
            {th('MKT CAP', 'market_cap')}
            {th('SECTOR', 'sector')}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const isSelected = r.symbol === selectedSymbol
            const isPos = r.change_pct >= 0
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
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {r.symbol}
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>{r.name}</div>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  ${r.price.toFixed(2)}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: isPos ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {isPos ? '+' : ''}{r.change_pct.toFixed(2)}%
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {fmt(r.volume)}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {r.market_cap ? fmt(r.market_cap) : '—'}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {r.sector}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
