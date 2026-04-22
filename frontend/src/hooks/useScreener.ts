import { useState } from 'react'
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
