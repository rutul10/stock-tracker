import type { StockDetail } from '../../hooks/useStockDetail'
import { fmt } from '../Screener/StockTable'
import { Spinner } from '../shared/Spinner'

function pct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${(v * 100).toFixed(1)}%`
}

function num(v: number | null | undefined, decimals = 2): string {
  if (v == null) return '—'
  return v.toFixed(decimals)
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-ui)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: color ?? 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--nav-accent)', letterSpacing: '0.1em', marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

interface Props {
  detail: StockDetail | null
  loading: boolean
  currentPrice?: number
}

export function CompanyOverviewPanel({ detail, loading, currentPrice }: Props) {
  if (loading) return <div style={{ padding: 20 }}><Spinner /></div>
  if (!detail) return <div style={{ color: 'var(--text-muted)', padding: 16, fontSize: 12 }}>No data available</div>

  const upside = detail.analyst_target_mean != null && currentPrice
    ? ((detail.analyst_target_mean - currentPrice) / currentPrice * 100).toFixed(1)
    : null

  const vsMA200 = detail.dma_200 != null && currentPrice
    ? ((currentPrice - detail.dma_200) / detail.dma_200 * 100).toFixed(1)
    : null

  return (
    <div style={{ fontSize: 13 }}>
      {detail.description && (
        <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {detail.description}
        </p>
      )}

      <Section title="FINANCIALS">
        <MetricRow label="Revenue (TTM)" value={fmt(detail.revenue)} />
        <MetricRow label="Revenue Growth YoY" value={detail.revenue_growth != null ? `${(detail.revenue_growth * 100).toFixed(1)}%` : '—'} color={detail.revenue_growth != null ? (detail.revenue_growth > 0 ? 'var(--accent-green)' : 'var(--accent-red)') : undefined} />
        <MetricRow label="Gross Margin" value={pct(detail.gross_margin)} />
        <MetricRow label="EBITDA Margin" value={pct(detail.ebitda_margin)} />
        <MetricRow label="Net Margin" value={pct(detail.net_margin)} />
        <MetricRow label="EPS (TTM)" value={detail.eps_ttm != null ? `$${num(detail.eps_ttm)}` : '—'} />
        <MetricRow label="EPS (Fwd)" value={detail.eps_fwd != null ? `$${num(detail.eps_fwd)}` : '—'} />
        <MetricRow label="FCF" value={fmt(detail.fcf)} />
        <MetricRow label="FCF Margin" value={pct(detail.fcf_margin)} />
      </Section>

      <Section title="VALUATION">
        <MetricRow label="P/E (TTM)" value={detail.pe_ttm != null ? `${num(detail.pe_ttm)}x` : '—'} />
        <MetricRow label="P/E (Fwd)" value={detail.pe_fwd != null ? `${num(detail.pe_fwd)}x` : '—'} />
        <MetricRow label="PEG Ratio" value={detail.peg != null ? num(detail.peg) : '—'} />
        <MetricRow label="EV/EBITDA" value={detail.ev_ebitda != null ? `${num(detail.ev_ebitda)}x` : '—'} />
        <MetricRow label="P/FCF" value={detail.price_to_fcf != null ? `${num(detail.price_to_fcf)}x` : '—'} />
      </Section>

      <Section title="BALANCE SHEET">
        <MetricRow label="Cash" value={fmt(detail.cash)} />
        <MetricRow label="Total Debt" value={fmt(detail.total_debt)} />
        <MetricRow label="Net Cash" value={detail.cash != null && detail.total_debt != null ? fmt(detail.cash - detail.total_debt) : '—'} color={detail.cash != null && detail.total_debt != null ? (detail.cash > detail.total_debt ? 'var(--accent-green)' : 'var(--accent-red)') : undefined} />
        <MetricRow label="Shares Out." value={fmt(detail.shares_outstanding)} />
      </Section>

      <Section title="TECHNICAL">
        <MetricRow label="52w Low" value={detail.week52_low != null ? `$${num(detail.week52_low)}` : '—'} />
        <MetricRow label="52w High" value={detail.week52_high != null ? `$${num(detail.week52_high)}` : '—'} />
        <MetricRow label="vs 200-DMA" value={vsMA200 != null ? `${parseFloat(vsMA200) > 0 ? '+' : ''}${vsMA200}%` : '—'} color={vsMA200 != null ? (parseFloat(vsMA200) > 0 ? 'var(--accent-green)' : 'var(--accent-red)') : undefined} />
        <MetricRow label="Short Interest" value={detail.short_percent != null ? pct(detail.short_percent) : '—'} />
      </Section>

      <Section title="ANALYST CONSENSUS">
        <MetricRow label="Mean PT" value={detail.analyst_target_mean != null ? `$${num(detail.analyst_target_mean)}` : '—'} />
        <MetricRow label="PT Range" value={detail.analyst_target_low != null && detail.analyst_target_high != null ? `$${num(detail.analyst_target_low)} – $${num(detail.analyst_target_high)}` : '—'} />
        <MetricRow label="Upside to PT" value={upside != null ? `${parseFloat(upside) > 0 ? '+' : ''}${upside}%` : '—'} color={upside != null ? (parseFloat(upside) > 0 ? 'var(--accent-green)' : 'var(--accent-red)') : undefined} />
        <MetricRow label="Analysts" value={detail.analyst_count != null ? String(detail.analyst_count) : '—'} />
        {detail.recommendation && <MetricRow label="Consensus" value={detail.recommendation.toUpperCase()} color="var(--accent-blue)" />}
      </Section>
    </div>
  )
}
