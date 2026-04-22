import { useState } from 'react'
import client from '../api/client'
import type { IndicatorsResponse } from '../api/types'

export function useIndicators() {
  const [data, setData] = useState<IndicatorsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchIndicators(symbol: string, period = '3mo') {
    if (!symbol) return
    setLoading(true)
    setError(null)
    try {
      const res = await client.get(`/indicators/${symbol}`, { params: { period } })
      setData(res.data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch indicators'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, fetchIndicators }
}
