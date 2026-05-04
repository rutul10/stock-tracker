import { useEffect, useState } from 'react'
import { useTradeScore } from '../../hooks/useTradeScore'
import { useAppStore } from '../../store'

interface StockCardProps {
  symbol: string
  onOpenDetail: (symbol: string) => void
  onRemove?: (symbol: string) => void
  canRemove?: boolean
}

function getScoreColor(score: number): string {
  if (score >= 60) return 'var(--accent-green)'
  if (score >= 40) return '#ffaa00'
  return 'var(--accent-red)'
}

function DirectionBadge({ direction }: { direction: 'bullish' | 'neutral' | 'bearish' }) {
  const colorMap = {
    bullish: { bg: 'rgba(0,255,136,0.12)', color: 'var(--accent-green)', label: 'BULLISH' },
    neutral: { bg: 'rgba(0,170,255,0.12)', color: 'var(--accent-blue)', label: 'NEUTRAL' },
    bearish: { bg: 'rgba(255,51,102,0.12)', color: 'var(--accent-red)', label: 'BEARISH' },
  }
  const { bg, color, label } = colorMap[direction]
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color,
        fontFamily: 'var(--font-ui)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.1em',
        padding: '2px 8px',
        borderRadius: 3,
        border: `1px solid ${color}`,
        marginTop: 6,
      }}
    >
      {label}
    </span>
  )
}

function SkeletonScoreSection() {
  return (
    <div style={{ marginTop: 12 }}>
      {/* label skeleton */}
      <div
        style={{
          height: 10,
          width: 80,
          background: 'var(--border)',
          borderRadius: 2,
          marginBottom: 8,
          animation: 'pulse 1.5s ease-in-out infinite',
          opacity: 0.6,
        }}
      />
      {/* progress bar skeleton */}
      <div
        style={{
          height: 6,
          width: '100%',
          background: 'var(--border)',
          borderRadius: 3,
          marginBottom: 8,
          opacity: 0.5,
        }}
      />
      {/* score number skeleton */}
      <div
        style={{
          height: 28,
          width: 50,
          background: 'var(--border)',
          borderRadius: 2,
          opacity: 0.5,
        }}
      />
    </div>
  )
}

export function StockCard({ symbol, onOpenDetail, onRemove, canRemove = true }: StockCardProps) {
  const { data, loading, error, fetch } = useTradeScore()
  const { pinnedSymbol, setPinnedSymbol, setCompareSymbols } = useAppStore()
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    fetch(symbol)
  }, [symbol]) // eslint-disable-line react-hooks/exhaustive-deps

  const isPinned = pinnedSymbol === symbol
  const score = data?.score ?? null
  const direction = data?.direction ?? null

  function handleCardClick(_e: React.MouseEvent) {
    onOpenDetail(symbol)
  }

  function handleRemoveClick(e: React.MouseEvent) {
    e.stopPropagation()
    onRemove?.(symbol)
  }

  function handlePinClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (isPinned) {
      setPinnedSymbol(null)
    } else if (pinnedSymbol === null) {
      setPinnedSymbol(symbol)
    } else {
      // pinnedSymbol is some other symbol — complete the comparison pair
      setCompareSymbols([pinnedSymbol, symbol])
      setPinnedSymbol(null)
    }
  }

  const scoreColor = score !== null ? getScoreColor(score) : 'var(--text-muted)'

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: 'var(--surface)',
        border: `1px solid ${isPinned ? 'var(--accent-blue)' : hovered ? 'rgba(0,170,255,0.3)' : 'var(--border)'}`,
        borderRadius: 6,
        padding: 16,
        minWidth: 0,
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hovered
          ? '0 0 12px rgba(0,170,255,0.08)'
          : isPinned
          ? '0 0 16px rgba(0,170,255,0.15)'
          : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Header row: symbol + remove button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}
        >
          {symbol}
        </span>
        {canRemove && onRemove && (
          <button
            onClick={handleRemoveClick}
            title={`Remove ${symbol}`}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 16,
              padding: '0 2px',
              lineHeight: 1,
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-red)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
          >
            ×
          </button>
        )}
      </div>

      {/* Score section */}
      {loading ? (
        <SkeletonScoreSection />
      ) : (
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            TRADE SCORE
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: 6,
              background: 'var(--border)',
              borderRadius: 3,
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                height: '100%',
                width: error || score === null ? '0%' : `${score}%`,
                background: scoreColor,
                borderRadius: 3,
                transition: 'width 0.6s ease',
              }}
            />
          </div>

          {/* Score number */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 26,
              fontWeight: 700,
              color: error ? 'var(--text-muted)' : scoreColor,
              lineHeight: 1,
            }}
          >
            {error || score === null ? '--' : score}
          </span>

          {/* Direction badge */}
          {direction && !error ? (
            <div>
              <DirectionBadge direction={direction} />
            </div>
          ) : (
            <div style={{ marginTop: 6 }}>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                }}
              >
                {error ? 'N/A' : '--'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Pin button */}
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handlePinClick}
          title={
            isPinned
              ? 'Unpin'
              : pinnedSymbol && !isPinned
              ? `Compare with ${pinnedSymbol}`
              : 'Pin to compare'
          }
          style={{
            background: 'none',
            border: `1px solid ${isPinned ? 'var(--accent-blue)' : 'var(--border)'}`,
            color: isPinned ? 'var(--accent-blue)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 13,
            padding: '2px 8px',
            borderRadius: 3,
            fontFamily: 'var(--font-ui)',
            letterSpacing: '0.04em',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!isPinned) {
              const btn = e.currentTarget as HTMLButtonElement
              btn.style.color = 'var(--accent-blue)'
              btn.style.borderColor = 'var(--accent-blue)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isPinned) {
              const btn = e.currentTarget as HTMLButtonElement
              btn.style.color = 'var(--text-muted)'
              btn.style.borderColor = 'var(--border)'
            }
          }}
        >
          {isPinned ? '⊕ PINNED' : '⊕ PIN'}
        </button>
      </div>
    </div>
  )
}
