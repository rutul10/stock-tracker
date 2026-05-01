import { useEffect, useState } from 'react'
import { useAppStore } from '../../store'
import { useStockDetail } from '../../hooks/useStockDetail'
import { CompanyOverviewPanel } from './CompanyOverviewPanel'
import { EarningsPanel } from './EarningsPanel'
import { NewsPanel } from './NewsPanel'
import { DCFCalculator } from './DCFCalculator'
import { MultiModelProjection } from './MultiModelProjection'
import type { DCFContext } from './DCFCalculator'
import { Spinner } from '../shared/Spinner'

interface Props {
  symbol: string
  currentPrice: number | null
  onClose: () => void
}

export function StockDetailOverlay({ symbol, currentPrice, onClose }: Props) {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useAppStore()
  const { detail, news, loadingDetail, loadingNews, errorDetail, refreshNews } = useStockDetail(symbol)
  const [dcfContext, setDCFContext] = useState<DCFContext | null>(null)

  // Lock body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const isWatched = watchlist.includes(symbol)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--bg)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexWrap: 'wrap',
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            cursor: 'pointer',
            padding: '4px 8px 4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← BACK
        </button>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--nav-accent)', letterSpacing: '0.08em' }}>
            {symbol}
          </span>
          {detail?.name && (
            <span style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-ui)' }}>
              {detail.name}
            </span>
          )}
          {currentPrice != null && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-primary)', fontWeight: 700 }}>
              ${currentPrice.toFixed(2)}
            </span>
          )}
          {detail?.sector && (
            <span style={{ fontSize: 11, color: 'var(--accent-blue)', fontFamily: 'var(--font-ui)', border: '1px solid var(--accent-blue)', padding: '1px 6px', borderRadius: 2 }}>
              {detail.sector}
            </span>
          )}
        </div>

        <button
          onClick={() => isWatched ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
          style={{
            marginLeft: 'auto',
            background: isWatched ? 'rgba(0,255,136,0.1)' : 'none',
            border: `1px solid ${isWatched ? 'var(--accent-green)' : 'var(--border)'}`,
            color: isWatched ? 'var(--accent-green)' : 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            padding: '4px 12px',
            cursor: 'pointer',
          }}
        >
          {isWatched ? '★ WATCHING' : '☆ WATCHLIST'}
        </button>
      </div>

      {/* Main content */}
      <div style={{ padding: '20px', flex: 1 }}>
        {errorDetail && (
          <div style={{ color: 'var(--accent-red)', fontSize: 12, marginBottom: 12, padding: '8px 12px', border: '1px solid var(--accent-red)', background: 'rgba(255,51,102,0.05)' }}>
            {errorDetail}
          </div>
        )}

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Company Overview */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 16 }}>
              <CompanyOverviewPanel detail={detail} loading={loadingDetail} currentPrice={currentPrice ?? undefined} />
            </div>

            {/* Earnings */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 16 }}>
              <EarningsPanel earnings={detail?.earnings ?? null} loading={loadingDetail} />
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* News */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 16 }}>
              {loadingNews && !news ? <Spinner /> : (
                <NewsPanel news={news} loading={loadingNews} onRefresh={refreshNews} />
              )}
            </div>

            {/* DCF Calculator */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 16 }}>
              <DCFCalculator
                fcf0={detail?.fcf ?? null}
                sharesOutstanding={detail?.shares_outstanding ?? null}
                currentPrice={currentPrice}
                onDCFChange={setDCFContext}
              />
            </div>
          </div>
        </div>

        {/* AI Projection — full width */}
        <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', padding: 16 }}>
          <MultiModelProjection
            symbol={symbol}
            detail={detail}
            news={news}
            dcfContext={dcfContext}
          />
        </div>
      </div>
    </div>
  )
}
