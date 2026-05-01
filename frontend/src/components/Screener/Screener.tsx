import { useEffect, useState } from 'react'
import { useScreener, usePopularStocks, useWatchlistData } from '../../hooks/useScreener'
import { useAppStore } from '../../store'
import type { ScreenerView } from '../../store'
import { Spinner } from '../shared/Spinner'
import { ErrorBanner } from '../shared/ErrorBanner'
import { StockTable } from './StockTable'
import { refreshBus } from '../../App'

const SORT_OPTIONS = [
  { value: 'volume', label: 'Volume' },
  { value: 'price_change', label: 'Price Change' },
  { value: 'market_cap', label: 'Market Cap' },
] as const

const SECTORS = [
  '', 'Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical',
  'Communication Services', 'Industrials', 'Consumer Defensive', 'Energy',
  'Utilities', 'Real Estate', 'Basic Materials',
]

const VIEWS: { id: ScreenerView; label: string }[] = [
  { id: 'popular', label: 'POPULAR' },
  { id: 'watchlist', label: 'WATCHLIST' },
  { id: 'screener', label: 'SCREENER' },
]

// ─── Popular sub-view ─────────────────────────────────────────────────────────

function PopularView({ onSelect, selectedSymbol, onOpenDetail }: { onSelect: (s: string) => void; selectedSymbol: string; onOpenDetail: (s: string, price: number | null) => void }) {
  const { results, loading, error, lastFetched, refetch } = usePopularStocks()
  const { addToWatchlist, watchlist } = useAppStore()

  useEffect(() => {
    function onRefresh() { refetch() }
    refreshBus.addEventListener('refresh', onRefresh)
    return () => refreshBus.removeEventListener('refresh', onRefresh)
  }, [refetch])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-ui)' }}>
          Top 10 most-traded stocks · auto-refreshes every 3 min
        </span>
        {lastFetched && (
          <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-ui)', marginLeft: 'auto' }}>
            UPDATED {lastFetched}
          </span>
        )}
        <button
          onClick={refetch}
          disabled={loading}
          style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '2px 8px', fontSize: 10, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}
        >
          {loading ? '...' : 'REFRESH'}
        </button>
      </div>
      {error && <ErrorBanner message={error} />}
      {loading && results.length === 0 ? (
        <Spinner />
      ) : (
        <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <StockTable
            results={results}
            onSelect={onSelect}
            selectedSymbol={selectedSymbol}
            onOpenDetail={onOpenDetail}
            onAddToWatchlist={addToWatchlist}
            watchlist={watchlist}
          />
        </div>
      )}
    </div>
  )
}

// ─── Watchlist sub-view ───────────────────────────────────────────────────────

function WatchlistView({ onSelect, selectedSymbol, onOpenDetail }: { onSelect: (s: string) => void; selectedSymbol: string; onOpenDetail: (s: string, price: number | null) => void }) {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useAppStore()
  const { results, loading, error } = useWatchlistData(watchlist)
  const [input, setInput] = useState('')

  function handleAdd() {
    const sym = input.trim().toUpperCase()
    if (sym) { addToWatchlist(sym); setInput('') }
  }

  const ctrl: React.CSSProperties = {
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    padding: '4px 8px',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="ADD SYMBOL..."
          style={{ ...ctrl, width: 140, letterSpacing: '0.08em' }}
        />
        <button
          onClick={handleAdd}
          style={{ background: 'var(--accent-green)', color: '#000', border: 'none', padding: '5px 12px', fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          + ADD
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-ui)' }}>
          {watchlist.length} symbol{watchlist.length !== 1 ? 's' : ''} saved
        </span>
      </div>

      {error && <ErrorBanner message={error} />}

      {watchlist.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 12, border: '1px solid var(--border)' }}>
          No symbols in your watchlist yet.<br />
          <span style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
            Add symbols above or click <strong style={{ color: 'var(--accent-green)' }}>[+]</strong> on any stock in the Popular view.
          </span>
        </div>
      ) : loading ? (
        <Spinner />
      ) : (
        <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <StockTable
            results={results}
            onSelect={onSelect}
            selectedSymbol={selectedSymbol}
            onOpenDetail={onOpenDetail}
            onRemoveFromWatchlist={removeFromWatchlist}
          />
        </div>
      )}
    </div>
  )
}

// ─── Full screener sub-view ───────────────────────────────────────────────────

function ScreenerView({ onSelect, selectedSymbol, onOpenDetail }: { onSelect: (s: string) => void; selectedSymbol: string; onOpenDetail: (s: string, price: number | null) => void }) {
  const { results, loading, error, runScreener } = useScreener()
  const [sortBy, setSortBy] = useState<'volume' | 'price_change' | 'market_cap'>('volume')
  const [minVol, setMinVol] = useState('1000000')
  const [minPrice, setMinPrice] = useState('5')
  const [limit, setLimit] = useState('20')
  const [sector, setSector] = useState('')

  function buildParams() {
    return {
      sort_by: sortBy,
      min_volume: parseInt(minVol) || 1_000_000,
      min_price: parseFloat(minPrice) || 5,
      limit: parseInt(limit) || 20,
      sector: sector || undefined,
    }
  }

  useEffect(() => {
    function onRefresh() { runScreener(buildParams()) }
    refreshBus.addEventListener('refresh', onRefresh)
    return () => refreshBus.removeEventListener('refresh', onRefresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, minVol, minPrice, limit, sector])

  const ctrl: React.CSSProperties = {
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    padding: '4px 8px',
    fontFamily: 'var(--font-ui)',
    fontSize: 11,
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <label style={{ color: 'var(--text-muted)', fontSize: 11 }}>SORT</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} style={ctrl}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <label style={{ color: 'var(--text-muted)', fontSize: 11 }}>SECTOR</label>
        <select value={sector} onChange={(e) => setSector(e.target.value)} style={ctrl}>
          {SECTORS.map((s) => <option key={s} value={s}>{s || 'All'}</option>)}
        </select>

        <label style={{ color: 'var(--text-muted)', fontSize: 11 }}>MIN VOL</label>
        <input value={minVol} onChange={(e) => setMinVol(e.target.value)} style={{ ...ctrl, width: 100, fontFamily: 'var(--font-mono)' }} />

        <label style={{ color: 'var(--text-muted)', fontSize: 11 }}>MIN $</label>
        <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ ...ctrl, width: 60, fontFamily: 'var(--font-mono)' }} />

        <label style={{ color: 'var(--text-muted)', fontSize: 11 }}>LIMIT</label>
        <input value={limit} onChange={(e) => setLimit(e.target.value)} style={{ ...ctrl, width: 50, fontFamily: 'var(--font-mono)' }} />

        <button
          onClick={() => runScreener(buildParams())}
          disabled={loading}
          style={{ background: loading ? 'var(--border)' : 'var(--accent-green)', color: '#000', border: 'none', padding: '5px 14px', fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'SCANNING...' : 'RUN SCREEN'}
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading && results.length === 0 ? (
        <Spinner />
      ) : results.length > 0 ? (
        <>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8 }}>
            {results.length} results · click a row to select symbol · R to refresh
          </div>
          <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <StockTable results={results} onSelect={onSelect} selectedSymbol={selectedSymbol} onOpenDetail={onOpenDetail} />
          </div>
        </>
      ) : (
        !loading && (
          <div style={{ color: 'var(--text-muted)', padding: '32px', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 12 }}>
            Click RUN SCREEN to fetch data
          </div>
        )
      )}
    </div>
  )
}

// ─── Main Screener component ──────────────────────────────────────────────────

export function Screener() {
  const { selectedSymbol, setSelectedSymbol, activeScreenerView, setActiveScreenerView, setDetailSymbol } = useAppStore()

  const pillBase: React.CSSProperties = {
    background: 'none',
    border: '1px solid var(--border)',
    padding: '4px 14px',
    fontFamily: 'var(--font-ui)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--accent-green)', letterSpacing: '0.1em', margin: 0 }}>
          STOCK SCREENER
        </h2>

        <div style={{ display: 'flex', gap: 0, marginLeft: 'auto' }}>
          {VIEWS.map((v, i) => {
            const isActive = activeScreenerView === v.id
            return (
              <button
                key={v.id}
                onClick={() => setActiveScreenerView(v.id)}
                style={{
                  ...pillBase,
                  borderRight: i < VIEWS.length - 1 ? 'none' : '1px solid var(--border)',
                  borderRadius: i === 0 ? '3px 0 0 3px' : i === VIEWS.length - 1 ? '0 3px 3px 0' : '0',
                  background: isActive ? 'var(--nav-accent)' : 'none',
                  color: isActive ? 'var(--bg)' : 'var(--text-muted)',
                }}
              >
                {v.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeScreenerView === 'popular' && (
        <PopularView onSelect={setSelectedSymbol} selectedSymbol={selectedSymbol} onOpenDetail={setDetailSymbol} />
      )}
      {activeScreenerView === 'watchlist' && (
        <WatchlistView onSelect={setSelectedSymbol} selectedSymbol={selectedSymbol} onOpenDetail={setDetailSymbol} />
      )}
      {activeScreenerView === 'screener' && (
        <ScreenerView onSelect={setSelectedSymbol} selectedSymbol={selectedSymbol} onOpenDetail={setDetailSymbol} />
      )}
    </div>
  )
}
