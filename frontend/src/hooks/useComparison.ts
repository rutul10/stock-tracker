import { useState, useEffect } from 'react'
import client from '../api/client'
import type { TradeScore, IndicatorsResponse } from '../api/types'

export interface ComparisonData {
  tradeScore: TradeScore | null
  indicators: IndicatorsResponse | null
  loading: boolean
  error: string | null
}

interface UseComparisonResult {
  dataA: ComparisonData
  dataB: ComparisonData
}

const EMPTY_DATA: ComparisonData = {
  tradeScore: null,
  indicators: null,
  loading: true,
  error: null,
}

export function useComparison(symbolA: string, symbolB: string): UseComparisonResult {
  const [dataA, setDataA] = useState<ComparisonData>({ ...EMPTY_DATA })
  const [dataB, setDataB] = useState<ComparisonData>({ ...EMPTY_DATA })

  useEffect(() => {
    if (!symbolA || !symbolB) return

    setDataA({ ...EMPTY_DATA, loading: true })
    setDataB({ ...EMPTY_DATA, loading: true })

    const fetchSymbol = async (
      symbol: string,
      setter: React.Dispatch<React.SetStateAction<ComparisonData>>
    ) => {
      const [scoreResult, indResult] = await Promise.allSettled([
        client.get<TradeScore>(`/trade-score/${encodeURIComponent(symbol)}`),
        client.get<IndicatorsResponse>(`/indicators/${encodeURIComponent(symbol)}`, {
          params: { period: '3mo' },
        }),
      ])

      const tradeScore =
        scoreResult.status === 'fulfilled' ? scoreResult.value.data : null
      const indicators =
        indResult.status === 'fulfilled' ? indResult.value.data : null

      const errors: string[] = []
      if (scoreResult.status === 'rejected') {
        const e = scoreResult.reason
        errors.push(e instanceof Error ? e.message : 'Failed to fetch trade score')
      }
      if (indResult.status === 'rejected') {
        const e = indResult.reason
        errors.push(e instanceof Error ? e.message : 'Failed to fetch indicators')
      }

      setter({
        tradeScore,
        indicators,
        loading: false,
        error: errors.length > 0 ? errors.join('; ') : null,
      })
    }

    // Fetch both symbols in parallel — A failure on one doesn't block the other
    fetchSymbol(symbolA, setDataA)
    fetchSymbol(symbolB, setDataB)
  }, [symbolA, symbolB])

  return { dataA, dataB }
}

// ─── Pure helper functions ────────────────────────────────────────────────────

/**
 * Converts an RSI value to a plain-English momentum label.
 * Thresholds: >65 = Strong ▲▲, 55–65 = Building ▲, 45–55 = Neutral →, 35–45 = Weakening ▼, <35 = Weak ▼▼
 */
export function rsiToMomentumLabel(rsi: number): string {
  if (rsi > 65) return 'Strong ▲▲'
  if (rsi >= 55) return 'Building ▲'
  if (rsi >= 45) return 'Neutral →'
  if (rsi >= 35) return 'Weakening ▼'
  return 'Weak ▼▼'
}

/**
 * Derives trend direction from price vs. SMA20 and SMA50.
 * Above both = Bullish, above SMA20 only = Neutral, below both = Bearish
 */
export function smaToTrendLabel(price: number, sma20: number, sma50: number): string {
  if (price >= sma20 && price >= sma50) return 'Bullish'
  if (price >= sma20 && price < sma50) return 'Neutral'
  return 'Bearish'
}

/**
 * Converts ATR as a % of price to a volatility label.
 * atr/price < 0.02 = Low, 0.02–0.04 = Medium, >0.04 = High
 */
export function atrToVolatilityLabel(atr: number, price: number): string {
  if (price <= 0) return 'Medium 🟡'
  const ratio = atr / price
  if (ratio < 0.02) return 'Low 🟢'
  if (ratio <= 0.04) return 'Medium 🟡'
  return 'High 🔴'
}

/**
 * Converts IV rank (0–1) to an options activity label.
 * <0.2 = Low IV, 0.2–0.35 = Medium IV, >0.35 = High IV
 */
export function ivToOptionsLabel(iv: number): string {
  if (iv < 0.2) return 'Low IV'
  if (iv <= 0.35) return 'Medium IV'
  return 'High IV'
}

// ─── Indicator extraction helpers ────────────────────────────────────────────

/** Returns the last non-null value from an array, or null. */
export function lastValue(arr: (number | null)[]): number | null {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null && arr[i] !== undefined) return arr[i]!
  }
  return null
}
