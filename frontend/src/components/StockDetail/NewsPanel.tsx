import type { NewsData } from '../../hooks/useStockDetail'
import { Spinner } from '../shared/Spinner'

function relativeTime(unixTs: number): string {
  if (!unixTs) return ''
  const diff = Math.floor((Date.now() / 1000) - unixTs)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function cacheAge(cachedAt: string): string {
  const diffMs = Date.now() - new Date(cachedAt).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just updated'
  return `cached ${mins} min ago`
}

interface Props {
  news: NewsData | null
  loading: boolean
  onRefresh: () => void
}

export function NewsPanel({ news, loading, onRefresh }: Props) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--nav-accent)', letterSpacing: '0.1em' }}>
          NEWS
        </span>
        {news?.cached_at && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
            {cacheAge(news.cached_at)}
          </span>
        )}
        {news?.source && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginLeft: 4 }}>
            via {news.source}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            padding: '2px 8px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '...' : '↻ REFRESH'}
        </button>
      </div>

      {loading && !news && <Spinner />}

      {!loading && news && news.articles.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '16px 0' }}>No recent news found</div>
      )}

      {news?.articles.map((article, i) => (
        <div key={i} style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontFamily: 'var(--font-ui)',
              fontSize: 13,
              lineHeight: 1.4,
              display: 'block',
              marginBottom: 3,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          >
            {article.headline}
          </a>
          <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
            {article.source && <span>{article.source}</span>}
            {article.datetime > 0 && <span>{relativeTime(article.datetime)}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
