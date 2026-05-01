import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'

export interface StockDetail {
  symbol: string
  name: string | null
  sector: string | null
  industry: string | null
  description: string | null
  market_cap: number | null
  revenue: number | null
  revenue_growth: number | null
  gross_margin: number | null
  ebitda_margin: number | null
  net_margin: number | null
  eps_ttm: number | null
  eps_fwd: number | null
  fcf: number | null
  fcf_margin: number | null
  pe_ttm: number | null
  pe_fwd: number | null
  peg: number | null
  ev_ebitda: number | null
  price_to_fcf: number | null
  cash: number | null
  total_debt: number | null
  shares_outstanding: number | null
  week52_low: number | null
  week52_high: number | null
  dma_200: number | null
  short_percent: number | null
  analyst_target_mean: number | null
  analyst_target_low: number | null
  analyst_target_high: number | null
  analyst_count: number | null
  recommendation: string | null
  earnings: {
    next_date: string | null
    eps_estimate: number | null
    revenue_estimate: number | null
    history: { date: string; eps_actual: number | null; eps_estimate: number | null; beat: boolean; surprise_pct: number | null }[]
  }
}

export interface NewsData {
  articles: { headline: string; summary: string; source: string; url: string; datetime: number }[]
  source: string
  cached_at: string
}

export function useStockDetail(symbol: string | null) {
  const [detail, setDetail] = useState<StockDetail | null>(null)
  const [news, setNews] = useState<NewsData | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [loadingNews, setLoadingNews] = useState(false)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  const [errorNews, setErrorNews] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol) return
    let cancelled = false
    setDetail(null)
    setNews(null)
    setErrorDetail(null)
    setErrorNews(null)

    // Parallel fetches
    setLoadingDetail(true)
    setLoadingNews(true)

    axios.get(`/api/stock/${symbol}/detail`)
      .then((res) => { if (!cancelled) setDetail(res.data) })
      .catch((err) => { if (!cancelled) setErrorDetail(err.response?.data?.detail ?? 'Failed to load company data') })
      .finally(() => { if (!cancelled) setLoadingDetail(false) })

    axios.get(`/api/stock/${symbol}/news`)
      .then((res) => { if (!cancelled) setNews(res.data) })
      .catch((err) => { if (!cancelled) setErrorNews(err.response?.data?.detail ?? 'Failed to load news') })
      .finally(() => { if (!cancelled) setLoadingNews(false) })

    return () => { cancelled = true }
  }, [symbol])

  const refreshNews = useCallback(() => {
    if (!symbol) return
    setLoadingNews(true)
    setErrorNews(null)
    axios.get(`/api/stock/${symbol}/news?refresh=true`)
      .then((res) => setNews(res.data))
      .catch((err) => setErrorNews(err.response?.data?.detail ?? 'Failed to refresh news'))
      .finally(() => setLoadingNews(false))
  }, [symbol])

  return { detail, news, loadingDetail, loadingNews, errorDetail, errorNews, refreshNews }
}
