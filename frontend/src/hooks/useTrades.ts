import { useCallback, useState } from 'react'
import client from '../api/client'
import type {
  TrackedTrade,
  TrackedTradeRequest,
  TrackedTradeUpdate,
  TradesSummary,
} from '../api/types'

export function useTrades() {
  const [trades, setTrades] = useState<TrackedTrade[]>([])
  const [summary, setSummary] = useState<TradesSummary>({ total: 0, open: 0, closed: 0, win_rate: 0, total_pnl: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await client.get('/tracked-trades')
      setTrades(res.data.trades ?? [])
      setSummary(res.data.summary ?? { total: 0, open: 0, closed: 0, win_rate: 0, total_pnl: 0 })
    } catch {
      setError('Failed to load trades')
    } finally {
      setLoading(false)
    }
  }, [])

  async function createTrade(req: TrackedTradeRequest): Promise<TrackedTrade | null> {
    try {
      const res = await client.post('/tracked-trades', req)
      await fetchTrades()
      return res.data
    } catch {
      setError('Failed to create trade')
      return null
    }
  }

  async function closeTrade(id: number, exitPrice: number): Promise<void> {
    try {
      await client.patch(`/tracked-trades/${id}`, { exit_price: exitPrice } satisfies TrackedTradeUpdate)
      await fetchTrades()
    } catch {
      setError('Failed to close trade')
    }
  }

  async function deleteTrade(id: number): Promise<void> {
    try {
      await client.delete(`/tracked-trades/${id}`)
      await fetchTrades()
    } catch {
      setError('Failed to delete trade')
    }
  }

  return { trades, summary, loading, error, fetchTrades, createTrade, closeTrade, deleteTrade }
}
