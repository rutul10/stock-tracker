import { useEffect, useRef, useState } from 'react'
import client from '../api/client'
import type { ScreenerRequest, StockResult } from '../api/types'

export function useScreener() {
  const [results, setResults] = useState<StockResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runScreener(params: ScreenerRequest = {}) {
    setLoading(true)
    setError(null)
    try {
      const res = await client.post('/screener', params)
      setResults(res.data.results ?? [])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch screener data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return { results, loading, error, runScreener }
}

export function usePopularStocks() {
  const [results, setResults] = useState<StockResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<string | null>(null)
  const fetched = useRef(false)

  async function fetchPopular() {
    setLoading(true)
    setError(null)
    try {
      const res = await client.get('/screener/popular')
      setResults(res.data.results ?? [])
      setLastFetched(new Date().toLocaleTimeString())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch popular stocks'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true
      fetchPopular()
    }
  }, [])

  return { results, loading, error, lastFetched, refetch: fetchPopular }
}

export function useWatchlistData(symbols: string[]) {
  const [results, setResults] = useState<StockResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (symbols.length === 0) {
      setResults([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    client.post('/screener/watchlist', { symbols }).then((res) => {
      if (!cancelled) setResults(res.data.results ?? [])
    }).catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to fetch watchlist data')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [symbols.join(',')])

  return { results, loading, error }
}
