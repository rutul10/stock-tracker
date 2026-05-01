import type { StockDetail } from '../../hooks/useStockDetail'
import { Spinner } from '../shared/Spinner'

interface Props {
  earnings: StockDetail['earnings'] | null
  loading: boolean
}

export function EarningsPanel({ earnings, loading }: Props) {
  if (loading) return <div style={{ padding: 16 }}><Spinner /></div>
  if (!earnings) return <div style={{ color: 'var(--text-muted)', padding: 12, fontSize: 12 }}>No earnings data available</div>

  const hasNext = earnings.next_date != null
  const hasHistory = earnings.history.length > 0

  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--nav-accent)', letterSpacing: '0.1em', marginBottom: 8 }}>
        EARNINGS
      </div>

      {hasNext ? (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', marginBottom: 10 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>NEXT EARNINGS</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent-blue)', marginBottom: 4 }}>
            {earnings.next_date}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {earnings.eps_estimate != null && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                EPS est: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>${earnings.eps_estimate.toFixed(2)}</span>
              </span>
            )}
            {earnings.revenue_estimate != null && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Rev est: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {earnings.revenue_estimate >= 1e9
                    ? `$${(earnings.revenue_estimate / 1e9).toFixed(1)}B`
                    : `$${(earnings.revenue_estimate / 1e6).toFixed(0)}M`}
                </span>
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 10 }}>No upcoming earnings date available</div>
      )}

      {hasHistory ? (
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>LAST 4 QUARTERS</div>
          {earnings.history.map((q, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 0',
              borderBottom: '1px solid var(--border)',
              fontSize: 12,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{q.beat ? '✅' : '❌'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: 80 }}>{q.date?.slice(0, 7)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {q.eps_actual != null ? `$${q.eps_actual.toFixed(2)}` : '—'}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                vs {q.eps_estimate != null ? `$${q.eps_estimate.toFixed(2)}` : '—'} est
              </span>
              {q.surprise_pct != null && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: q.surprise_pct > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                  marginLeft: 'auto',
                }}>
                  {q.surprise_pct > 0 ? '+' : ''}{q.surprise_pct.toFixed(1)}%
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>No historical earnings data available</div>
      )}
    </div>
  )
}
