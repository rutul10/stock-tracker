import { useState } from 'react'
import client from '../api/client'
import type { OptionsChainResponse } from '../api/types'

export function useOptions() {
  const [data, setData] = useState<OptionsChainResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchOptions(symbol: string, expiration?: string) {
    if (!symbol) return
    setLoading(true)
    setError(null)
    try {
      const params = expiration ? { expiration } : {}
      const res = await client.get(`/options/${symbol}`, { params })
      setData(res.data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch options chain'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, fetchOptions }
}
