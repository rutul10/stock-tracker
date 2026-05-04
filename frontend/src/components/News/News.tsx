import { useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { useAppStore } from '../../store'
import { DEFAULT_BLUE_CHIPS, DEFAULT_EMERGING } from '../../constants/watchlists'
import { Spinner } from '../shared/Spinner'

interface NewsArticle {
  headline: string
  summary?: string
  source: string
  url: string
  datetime: number | string
}

interface SymbolNews {
  symbol: string
  articles: NewsArticle[]
}

interface MergedArticle extends NewsArticle {
  symbol: string
  timestamp: number // normalized to ms
  aiSummary?: string
}

type FilterGroup = 'all' | 'bluechips' | 'emerging'

function normalizeTimestamp(dt: number | string): number {
  if (typeof dt === 'number') {
    // Finnhub/yfinance returns seconds since epoch
    return dt < 1e12 ? dt * 1000 : dt
  }
  const parsed = new Date(dt).getTime()
  return isNaN(parsed) ? 0 : parsed
}

export function News() {
  const { watchlist, customBlueChips, customEmerging, setDetailSymbol } = useAppStore()
  const [articles, setArticles] = useState<MergedArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [filterText, setFilterText] = useState('')
  const [filterGroup, setFilterGroup] = useState<FilterGroup>('all')
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set())
  const [symbolCount, setSymbolCount] = useState(0)
  const [summarizing, setSummarizing] = useState<Set<string>>(new Set())
  const [fontScale, setFontScale] = useState<'S' | 'M' | 'L'>('M')
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set())
  const cacheRef = useRef<{ articles: MergedArticle[]; fetchedAt: Date; symbolCount: number } | null>(null)

  const blueChips = customBlueChips.length > 0 ? customBlueChips : DEFAULT_BLUE_CHIPS
  const emerging = customEmerging.length > 0 ? customEmerging : DEFAULT_EMERGING

  const getAllSymbols = useCallback(() => {
    const all = [...new Set([...watchlist, ...blueChips, ...emerging])]
    return all.slice(0, 15)
  }, [watchlist, blueChips, emerging])

  const fetchNews = useCallback(async (force = false) => {
    if (!force && cacheRef.current) {
      const age = (Date.now() - cacheRef.current.fetchedAt.getTime()) / 1000
      if (age < 300) {
        setArticles(cacheRef.current.articles)
        setLastFetch(cacheRef.current.fetchedAt)
        setSymbolCount(cacheRef.current.symbolCount)
        return
      }
    }

    const symbols = getAllSymbols()
    if (symbols.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const results = await Promise.allSettled(
        symbols.map((symbol) =>
          axios.get<{ articles: NewsArticle[] }>(`/api/stock/${symbol}/news`)
            .then((res): SymbolNews => ({ symbol, articles: res.data.articles || [] }))
        )
      )

      const allArticles: MergedArticle[] = []
      const seenUrls = new Set<string>()

      for (const result of results) {
        if (result.status === 'fulfilled') {
          for (const article of result.value.articles) {
            if (article.url && !seenUrls.has(article.url)) {
              seenUrls.add(article.url)
              allArticles.push({
                ...article,
                symbol: result.value.symbol,
                timestamp: normalizeTimestamp(article.datetime),
              })
            }
          }
        }
      }

      // Sort by timestamp, newest first
      allArticles.sort((a, b) => b.timestamp - a.timestamp)

      setArticles(allArticles)
      setSymbolCount(symbols.length)
      const now = new Date()
      setLastFetch(now)
      cacheRef.current = { articles: allArticles, fetchedAt: now, symbolCount: symbols.length }

      // Auto-summarize top articles
      summarizeBatch(allArticles.slice(0, 10))
    } catch {
      setError('Failed to fetch news')
    } finally {
      setLoading(false)
    }
  }, [getAllSymbols])

  async function summarizeBatch(batch: MergedArticle[]) {
    const toSummarize = batch.filter((a) => !a.aiSummary)
    if (toSummarize.length === 0) return

    const keys = new Set(toSummarize.map((a) => a.url))
    setSummarizing(keys)

    await Promise.allSettled(
      toSummarize.map(async (article) => {
        try {
          const res = await axios.post('/api/news/summarize', {
            headline: article.headline,
            summary: article.summary || '',
            url: article.url,
          })
          if (res.data?.summary) {
            setArticles((prev) =>
              prev.map((a) => a.url === article.url ? { ...a, aiSummary: res.data.summary } : a)
            )
            // Update cache too
            if (cacheRef.current) {
              cacheRef.current.articles = cacheRef.current.articles.map(
                (a) => a.url === article.url ? { ...a, aiSummary: res.data.summary } : a
              )
            }
          }
        } catch { /* ignore summary failures */ }
        setSummarizing((prev) => { const n = new Set(prev); n.delete(article.url); return n })
      })
    )
  }

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const cacheAge = lastFetch ? Math.floor((Date.now() - lastFetch.getTime()) / 60000) : null

  // Get unique tickers from loaded articles for filter chips
  const availableTickers = [...new Set(articles.map((a) => a.symbol))].sort()

  // Filter logic
  const blueChipSet = new Set(blueChips)
  const emergingSet = new Set(emerging)

  const filtered = articles.filter((a) => {
    // Ticker chip filter
    if (selectedTickers.size > 0 && !selectedTickers.has(a.symbol)) return false
    // Text filter
    if (filterText && !a.symbol.toLowerCase().includes(filterText.toLowerCase()) && !a.headline.toLowerCase().includes(filterText.toLowerCase())) return false
    // Group filter
    if (filterGroup === 'bluechips' && !blueChipSet.has(a.symbol)) return false
    if (filterGroup === 'emerging' && !emergingSet.has(a.symbol)) return false
    return true
  })

  function relativeTime(ts: number) {
    if (!ts) return ''
    const diff = (Date.now() - ts) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
  }

  function toggleTicker(symbol: string) {
    setSelectedTickers((prev) => {
      const next = new Set(prev)
      if (next.has(symbol)) next.delete(symbol)
      else next.add(symbol)
      return next
    })
  }

  function toggleExpanded(url: string) {
    setExpandedSummaries((prev) => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  async function summarizeOne(article: MergedArticle) {
    setSummarizing((prev) => new Set(prev).add(article.url))
    try {
      const res = await axios.post('/api/news/summarize', {
        headline: article.headline,
        summary: article.summary || '',
        url: article.url,
      })
      if (res.data?.summary) {
        setArticles((prev) =>
          prev.map((a) => a.url === article.url ? { ...a, aiSummary: res.data.summary } : a)
        )
        if (cacheRef.current) {
          cacheRef.current.articles = cacheRef.current.articles.map(
            (a) => a.url === article.url ? { ...a, aiSummary: res.data.summary } : a
          )
        }
        setExpandedSummaries((prev) => new Set(prev).add(article.url))
      }
    } catch { /* ignore */ }
    setSummarizing((prev) => { const n = new Set(prev); n.delete(article.url); return n })
  }

  const totalSymbols = getAllSymbols().length

  if (totalSymbols === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
        <div style={{ fontSize: 14, marginBottom: 8 }}>No symbols to track</div>
        <div style={{ fontSize: 12 }}>Add symbols to your watchlist to see news here</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 24px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
          NEWS
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
          {symbolCount} symbols · {articles.length} articles
          {cacheAge !== null && ` · cached ${cacheAge === 0 ? '<1' : cacheAge}m ago`}
        </span>
        <button
          onClick={() => fetchNews(true)}
          disabled={loading}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 3,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            padding: '3px 8px',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          ↻ REFRESH
        </button>

        {/* Font size adjuster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginRight: 4 }}>Aa</span>
          {(['S', 'M', 'L'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontScale(size)}
              style={{
                background: fontScale === size ? 'var(--accent-blue)' : 'var(--surface)',
                border: `1px solid ${fontScale === size ? 'var(--accent-blue)' : 'var(--border)'}`,
                borderRadius: 3,
                color: fontScale === size ? '#000' : 'var(--text-muted)',
                fontFamily: 'var(--font-ui)',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 6px',
                cursor: 'pointer',
                minWidth: 22,
                textAlign: 'center',
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Ticker filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {availableTickers.map((ticker) => {
          const isActive = selectedTickers.has(ticker)
          return (
            <button
              key={ticker}
              onClick={() => toggleTicker(ticker)}
              style={{
                background: isActive ? 'var(--accent-blue)' : 'var(--surface)',
                border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border)'}`,
                borderRadius: 3,
                color: isActive ? '#000' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 6px',
                cursor: 'pointer',
              }}
            >
              {ticker}
            </button>
          )
        })}
        {selectedTickers.size > 0 && (
          <button
            onClick={() => setSelectedTickers(new Set())}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 3,
              color: 'var(--accent-red)',
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              padding: '2px 6px',
              cursor: 'pointer',
            }}
          >
            ✕ CLEAR
          </button>
        )}
      </div>

      {/* Group filter + text search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search headlines..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 3,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            padding: '4px 8px',
            width: 180,
          }}
        />
        {(['all', 'bluechips', 'emerging'] as FilterGroup[]).map((g) => (
          <button
            key={g}
            onClick={() => setFilterGroup(g)}
            style={{
              background: filterGroup === g ? 'var(--nav-accent)' : 'none',
              border: '1px solid var(--border)',
              borderRadius: 3,
              color: filterGroup === g ? '#000' : 'var(--text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 600,
              padding: '3px 8px',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            {g === 'all' ? 'ALL' : g === 'bluechips' ? 'BLUE CHIPS' : 'EMERGING'}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <div style={{ padding: 20, textAlign: 'center' }}><Spinner /></div>}

      {/* Error */}
      {error && (
        <div style={{ padding: 12, background: 'rgba(255,51,102,0.1)', border: '1px solid var(--accent-red)', borderRadius: 4, color: 'var(--accent-red)', fontSize: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Articles */}
      {!loading && filtered.length === 0 && !error && (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-ui)' }}>
          No recent news for your watchlist symbols
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {filtered.map((article, i) => (
            <div
              key={`${article.url}-${i}`}
              style={{
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {/* Top row: ticker, headline, source, time */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <button
                  onClick={() => setDetailSymbol(article.symbol)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 2,
                    color: 'var(--accent-blue)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: fontScale === 'S' ? 10 : fontScale === 'M' ? 12 : 14,
                    fontWeight: 600,
                    padding: '1px 5px',
                    cursor: 'pointer',
                    flexShrink: 0,
                    minWidth: 44,
                    textAlign: 'center',
                  }}
                >
                  {article.symbol}
                </button>

                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: fontScale === 'S' ? 12 : fontScale === 'M' ? 14 : 16,
                    fontWeight: 500,
                    textDecoration: 'none',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {article.headline}
                </a>

                <span style={{ fontSize: fontScale === 'S' ? 10 : fontScale === 'M' ? 11 : 13, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', flexShrink: 0 }}>
                  {article.source}
                </span>
                <span style={{ fontSize: fontScale === 'S' ? 10 : fontScale === 'M' ? 11 : 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, minWidth: 28, textAlign: 'right' }}>
                  {relativeTime(article.timestamp)}
                </span>
              </div>

              {/* AI Summary row */}
              {article.aiSummary && (
                <div style={{ marginTop: 4, marginLeft: 52 }}>
                  <div style={{
                    fontSize: fontScale === 'S' ? 11 : fontScale === 'M' ? 12 : 14,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-ui)',
                    lineHeight: 1.5,
                    ...(expandedSummaries.has(article.url) ? {} : {
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }),
                  }}>
                    {article.aiSummary}
                  </div>
                  <button
                    onClick={() => toggleExpanded(article.url)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-blue)',
                      fontFamily: 'var(--font-ui)',
                      fontSize: 10,
                      cursor: 'pointer',
                      padding: '2px 0',
                      marginTop: 2,
                    }}
                  >
                    {expandedSummaries.has(article.url) ? '▲ collapse' : '▼ expand'}
                  </button>
                </div>
              )}
              {!article.aiSummary && summarizing.has(article.url) && (
                <div style={{ marginTop: 4, marginLeft: 52, fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  summarizing...
                </div>
              )}
              {!article.aiSummary && !summarizing.has(article.url) && (
                <button
                  onClick={() => summarizeOne(article)}
                  style={{
                    marginTop: 4,
                    marginLeft: 52,
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: 3,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 10,
                    padding: '2px 6px',
                    cursor: 'pointer',
                  }}
                >
                  ✨ summarize
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
