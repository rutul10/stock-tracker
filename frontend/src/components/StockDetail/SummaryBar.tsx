import type { StockDetail } from '../../hooks/useStockDetail'

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: color ?? 'var(--text-primary)' }}>{value}</span>
    </span>
  )
}

interface Props {
  detail: StockDetail | null
  currentPrice?: number | null
}

export function SummaryBar({ detail, currentPrice }: Props) {
  if (!detail) return null

  const peTtm = detail.pe_ttm != null ? `${detail.pe_ttm.toFixed(1)}x` : '—'
  const peFwd = detail.pe_fwd != null ? `${detail.pe_fwd.toFixed(1)}x` : '—'
  const revGrowth = detail.revenue_growth != null ? `${(detail.revenue_growth * 100).toFixed(1)}%` : '—'
  const revColor = detail.revenue_growth != null ? (detail.revenue_growth > 0 ? 'var(--accent-green)' : 'var(--accent-red)') : undefined
  const fcfMargin = detail.fcf_margin != null ? `${(detail.fcf_margin * 100).toFixed(1)}%` : '—'
  const evEbitda = detail.ev_ebitda != null ? `${detail.ev_ebitda.toFixed(1)}x` : '—'

  const ptUpside = detail.analyst_target_mean != null && currentPrice
    ? ((detail.analyst_target_mean - currentPrice) / currentPrice * 100).toFixed(1)
    : null
  const ptLabel = detail.analyst_target_mean != null
    ? `$${detail.analyst_target_mean.toFixed(0)}${ptUpside != null ? ` (${parseFloat(ptUpside) > 0 ? '+' : ''}${ptUpside}%)` : ''}`
    : '—'
  const ptColor = ptUpside != null ? (parseFloat(ptUpside) > 0 ? 'var(--accent-green)' : 'var(--accent-red)') : undefined

  const w52 = detail.week52_low != null && detail.week52_high != null
    ? `$${detail.week52_low.toFixed(0)}–$${detail.week52_high.toFixed(0)}`
    : '—'

  const consensus = detail.recommendation?.toUpperCase() ?? '—'
  const consensusColor = consensus.includes('BUY') ? 'var(--accent-green)' : consensus.includes('SELL') ? 'var(--accent-red)' : 'var(--accent-blue)'

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      padding: '10px 16px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px 16px',
      alignItems: 'center',
    }}>
      <Metric label="P/E" value={peTtm} />
      <Metric label="Fwd" value={peFwd} />
      <Metric label="Rev" value={revGrowth} color={revColor} />
      <Metric label="FCF" value={fcfMargin} />
      <Metric label="EV/EBITDA" value={evEbitda} />
      <Metric label="PT" value={ptLabel} color={ptColor} />
      <Metric label="52w" value={w52} />
      <Metric label="" value={consensus} color={consensusColor} />
      {detail.analyst_count != null && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
          ({detail.analyst_count} anlst)
        </span>
      )}
    </div>
  )
}
