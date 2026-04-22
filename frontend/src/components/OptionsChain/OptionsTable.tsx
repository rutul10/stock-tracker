import type { OptionContract } from '../../api/types'

interface OptionsTableProps {
  contracts: OptionContract[]
  type: 'call' | 'put'
  currentPrice?: number
}

function cell(val: number | null, decimals = 2, prefix = '') {
  if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return <>{prefix}{val.toFixed(decimals)}</>
}

function ivColor(iv: number | null): string {
  if (iv === null) return 'var(--text-muted)'
  if (iv > 0.8) return 'var(--accent-red)'
  if (iv > 0.4) return '#ffaa00'
  return 'var(--text-primary)'
}

export function OptionsTable({ contracts, type, currentPrice }: OptionsTableProps) {
  const isCall = type === 'call'

  const tdStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: '5px 10px',
    textAlign: 'right',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    borderBottom: '1px solid rgba(30,30,46,0.6)',
    ...extra,
  })

  const thStyle: React.CSSProperties = {
    padding: '5px 10px',
    textAlign: 'right',
    fontFamily: 'var(--font-ui)',
    fontSize: 10,
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ overflowY: 'auto', maxHeight: 480 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
          <tr>
            <th style={{ ...thStyle, textAlign: 'center' }}>ITM</th>
            <th style={{ ...thStyle, textAlign: 'left' }}>STRIKE</th>
            <th style={thStyle}>BID</th>
            <th style={thStyle}>ASK</th>
            <th style={thStyle}>LAST</th>
            <th style={thStyle}>VOL</th>
            <th style={thStyle}>OI</th>
            <th style={thStyle}>IV</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c, i) => {
            const itm = c.in_the_money
            const isAtm = currentPrice !== undefined && c.strike !== null && Math.abs(c.strike - currentPrice) / currentPrice < 0.02
            const rowBg = itm
              ? isCall
                ? 'rgba(0,255,136,0.05)'
                : 'rgba(255,51,102,0.05)'
              : 'transparent'

            return (
              <tr key={i} style={{ background: isAtm ? 'rgba(0,170,255,0.08)' : rowBg, borderBottom: '1px solid var(--border)' }}>
                <td style={{ ...tdStyle({ textAlign: 'center' }), color: itm ? (isCall ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--text-muted)' }}>
                  {itm ? '●' : '○'}
                </td>
                <td style={{ ...tdStyle({ textAlign: 'left', fontWeight: isAtm ? 700 : 400, color: isAtm ? 'var(--accent-blue)' : 'var(--text-primary)' }) }}>
                  ${c.strike?.toFixed(2) ?? '—'}
                </td>
                <td style={tdStyle({ color: 'var(--accent-green)' })}>{cell(c.bid)}</td>
                <td style={tdStyle({ color: 'var(--accent-red)' })}>{cell(c.ask)}</td>
                <td style={tdStyle()}>{cell(c.last)}</td>
                <td style={tdStyle({ color: 'var(--text-muted)' })}>{c.volume.toLocaleString()}</td>
                <td style={tdStyle({ color: 'var(--text-muted)' })}>{c.open_interest.toLocaleString()}</td>
                <td style={tdStyle({ color: ivColor(c.implied_volatility) })}>
                  {c.implied_volatility !== null ? `${(c.implied_volatility * 100).toFixed(1)}%` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
