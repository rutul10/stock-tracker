import { useEffect, useState } from 'react'
import { useScreener } from '../../hooks/useScreener'
import { useAppStore } from '../../store'
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

export function Screener() {
  const { results, loading, error, runScreener } = useScreener()
  const { selectedSymbol, setSelectedSymbol } = useAppStore()
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
    runScreener(buildParams())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // R key triggers refresh
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
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--accent-green)', letterSpacing: '0.1em', margin: 0 }}>
          STOCK SCREENER
        </h2>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
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
            <StockTable results={results} onSelect={setSelectedSymbol} selectedSymbol={selectedSymbol} />
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
