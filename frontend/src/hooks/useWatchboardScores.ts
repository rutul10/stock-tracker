import { useState, useEffect } from 'react'
import client from '../api/client'
import type { TradeScore } from '../api/types'

interface UseWatchboardScoresResult {
  scoreMap: Record<string, TradeScore | null>
  loadingMap: Record<string, boolean>
}

export function useWatchboardScores(symbols: string[]): UseWatchboardScoresResult {
  const [scoreMap, setScoreMap] = useState<Record<string, TradeScore | null>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (symbols.length === 0) {
      setScoreMap({})
      setLoadingMap({})
      return
    }

    // Mark all symbols as loading
    const initialLoading: Record<string, boolean> = {}
    for (const sym of symbols) {
      initialLoading[sym] = true
    }
    setLoadingMap(initialLoading)

    // Fetch each symbol independently so one failure doesn't block others
    const fetchSymbol = async (symbol: string) => {
      try {
        const res = await client.get(`/trade-score/${encodeURIComponent(symbol)}`)
        setScoreMap((prev) => ({ ...prev, [symbol]: res.data }))
      } catch {
        setScoreMap((prev) => ({ ...prev, [symbol]: null }))
      } finally {
        setLoadingMap((prev) => ({ ...prev, [symbol]: false }))
      }
    }

    // Fire all fetches in parallel; Promise.allSettled ensures independent resolution
    Promise.allSettled(symbols.map(fetchSymbol))
  }, [symbols.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  return { scoreMap, loadingMap }
}
