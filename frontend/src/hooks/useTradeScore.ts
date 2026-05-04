import { useState, useCallback } from 'react'
import client from '../api/client'
import type { TradeScore } from '../api/types'

interface UseTradeScoreResult {
  data: TradeScore | null
  loading: boolean
  error: string | null
  fetch: (symbol: string) => Promise<void>
}

export function useTradeScore(): UseTradeScoreResult {
  const [data, setData] = useState<TradeScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (symbol: string) => {
    if (!symbol) return
    setLoading(true)
    setError(null)
    try {
      const res = await client.get(`/trade-score/${encodeURIComponent(symbol)}`)
      setData(res.data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch trade score'
      setError(msg)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetch }
}
