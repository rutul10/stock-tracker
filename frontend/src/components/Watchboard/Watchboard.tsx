import { useState } from 'react'
import { useAppStore } from '../../store'
import { DEFAULT_BLUE_CHIPS, DEFAULT_EMERGING } from '../../constants/watchlists'
import { WatchboardList } from './WatchboardList'
import { StockCard } from './StockCard'
import { Screener } from '../Screener/Screener'

type WatchboardView = 'blue-chips' | 'emerging' | 'watchlist' | 'screener'

const VIEWS: { id: WatchboardView; label: string }[] = [
  { id: 'blue-chips', label: 'BLUE CHIPS' },
  { id: 'emerging', label: 'EMERGING' },
  { id: 'watchlist', label: 'WATCHLIST' },
  { id: 'screener', label: 'SCREENER' },
]

function dedup(arr: string[]): string[] {
  return Array.from(new Set(arr.map((s) => s.toUpperCase())))
}

export function Watchboard() {
  const [activeView, setActiveView] = useState<WatchboardView>('blue-chips')

  const {
    setDetailSymbol,
    pinnedSymbol,
    clearCompareSymbols,
    watchlist,
    customBlueChips,
    customEmerging,
    addToCustomBlueChips,
    removeFromCustomBlueChips,
    addToCustomEmerging,
    removeFromCustomEmerging,
  } = useAppStore()

  // Merged + deduped symbol lists
  const blueChipSymbols = dedup([...DEFAULT_BLUE_CHIPS, ...customBlueChips])
  const emergingSymbols = dedup([...DEFAULT_EMERGING, ...customEmerging])

  function handleOpenDetail(symbol: string) {
    setDetailSymbol(symbol)
  }

  function handleRemoveBlueChip(symbol: string) {
    // Only remove if it's a custom addition, not a default symbol
    if (DEFAULT_BLUE_CHIPS.includes(symbol)) return
    removeFromCustomBlueChips(symbol)
  }

  function handleRemoveEmerging(symbol: string) {
    if (DEFAULT_EMERGING.includes(symbol)) return
    removeFromCustomEmerging(symbol)
  }

  function handleAddBlueChip(symbol: string) {
    addToCustomBlueChips(symbol)
  }

  function handleAddEmerging(symbol: string) {
    addToCustomEmerging(symbol)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Top toolbar: view pills + pinned banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        {/* Pill selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {VIEWS.map((v) => {
            const isActive = activeView === v.id
            return (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                style={{
                  background: isActive ? 'var(--accent-blue)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border)'}`,
                  color: isActive ? '#0a0a0f' : 'var(--text-muted)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.08em',
                  padding: '5px 14px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    const btn = e.currentTarget as HTMLButtonElement
                    btn.style.borderColor = 'var(--accent-blue)'
                    btn.style.color = 'var(--accent-blue)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    const btn = e.currentTarget as HTMLButtonElement
                    btn.style.borderColor = 'var(--border)'
                    btn.style.color = 'var(--text-muted)'
                  }
                }}
              >
                {v.label}
              </button>
            )
          })}
        </div>

        {/* Pinned comparison banner */}
        {pinnedSymbol && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(0,170,255,0.08)',
              border: '1px solid rgba(0,170,255,0.3)',
              borderRadius: 5,
              padding: '6px 12px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                color: 'var(--accent-blue)',
                letterSpacing: '0.04em',
              }}
            >
              Pinned:{' '}
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{pinnedSymbol}</strong>
              {' '}— select another stock to compare
            </span>
            <button
              onClick={clearCompareSymbols}
              title="Clear pin"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 14,
                padding: '0 2px',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-red)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: activeView === 'screener' ? 0 : '20px',
        }}
        className="scrollbar-thin"
      >
        {activeView === 'blue-chips' && (
          <WatchboardList
            title="BLUE CHIPS"
            symbols={blueChipSymbols}
            onOpenDetail={handleOpenDetail}
            onRemove={handleRemoveBlueChip}
            onAdd={handleAddBlueChip}
            removableSymbols={customBlueChips}
          />
        )}

        {activeView === 'emerging' && (
          <WatchboardList
            title="EMERGING GROWTH"
            symbols={emergingSymbols}
            onOpenDetail={handleOpenDetail}
            onRemove={handleRemoveEmerging}
            onAdd={handleAddEmerging}
            removableSymbols={customEmerging}
          />
        )}

        {activeView === 'watchlist' && (
          <WatchlistView symbols={watchlist} onOpenDetail={handleOpenDetail} />
        )}

        {activeView === 'screener' && <Screener />}
      </div>
    </div>
  )
}

// ─── Watchlist sub-view ───────────────────────────────────────────────────────

interface WatchlistViewProps {
  symbols: string[]
  onOpenDetail: (symbol: string) => void
}

function WatchlistView({ symbols, onOpenDetail }: WatchlistViewProps) {
  const { removeFromWatchlist } = useAppStore()

  if (symbols.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          textAlign: 'center',
          gap: 8,
        }}
      >
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, color: 'var(--text-primary)' }}>
          WATCHLIST EMPTY
        </div>
        <div>
          Add stocks to your watchlist from the Screener tab or any stock detail view.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 20,
            color: 'var(--text-primary)',
            letterSpacing: '0.06em',
            margin: 0,
          }}
        >
          WATCHLIST
        </h2>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-muted)',
            background: 'var(--border)',
            borderRadius: 10,
            padding: '1px 8px',
          }}
        >
          {symbols.length}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: 12,
        }}
      >
        {symbols.map((sym) => (
          <StockCard
            key={sym}
            symbol={sym}
            onOpenDetail={onOpenDetail}
            onRemove={removeFromWatchlist}
            canRemove={true}
          />
        ))}
      </div>
    </div>
  )
}
