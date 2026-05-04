export interface StockResult {
  symbol: string
  name: string
  price: number
  change_pct: number
  volume: number
  market_cap: number
  sector: string
  avg_volume: number
  iv_rank: number | null
}

export interface ScreenerRequest {
  min_volume?: number
  min_price?: number
  max_price?: number
  sector?: string
  sort_by?: 'volume' | 'price_change' | 'market_cap'
  limit?: number
}

export interface OptionContract {
  strike: number | null
  expiration: string
  type: 'call' | 'put'
  bid: number | null
  ask: number | null
  last: number | null
  volume: number
  open_interest: number
  implied_volatility: number | null
  delta: number | null
  gamma: number | null
  theta: number | null
  vega: number | null
  in_the_money: boolean
}

export interface OptionsChainResponse {
  symbol: string
  expirations: string[]
  calls: OptionContract[]
  puts: OptionContract[]
  filter_warning?: string
}

export interface PriceBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ProjectionRequest {
  symbol: string
  trade_type: 'stock' | 'call' | 'put' | 'covered_call' | 'cash_secured_put' | 'spread'
  direction: 'bullish' | 'bearish' | 'neutral'
  entry_price?: number
  target_price?: number
  stop_loss?: number
  expiration?: string
  strike?: number
  notes?: string
}

export interface ProjectionResponse {
  symbol: string
  trade_type: string
  probability_of_success: number
  confidence: 'low' | 'medium' | 'high'
  ai_reasoning: string
  risk_reward_ratio: number
  suggested_position_size: string
  key_risks: string[]
  supporting_factors: string[]
  model_used: string
}

export interface IndicatorsResponse {
  symbol: string
  period: string
  prices: PriceBar[]
  sma_20: (number | null)[]
  sma_50: (number | null)[]
  ema_12: (number | null)[]
  ema_26: (number | null)[]
  macd: (number | null)[]
  macd_signal: (number | null)[]
  rsi: (number | null)[]
  bb_upper: (number | null)[]
  bb_lower: (number | null)[]
  vwap: (number | null)[]
  atr: (number | null)[]
}

export type TradeType = 'stock' | 'call' | 'put' | 'covered_call' | 'cash_secured_put' | 'spread'
export type TradeDirection = 'bullish' | 'bearish' | 'neutral'
export type TradeStatus = 'open' | 'closed' | 'expired'

export interface TrackedTrade {
  id: number
  symbol: string
  trade_type: TradeType
  direction: TradeDirection
  entry_price: number
  target_price: number | null
  stop_loss: number | null
  quantity: number
  expiration: string | null
  strike: number | null
  probability_at_entry: number | null
  notes: string | null
  status: TradeStatus
  entry_date: string
  exit_price: number | null
  exit_date: string | null
  pnl: number | null
  pnl_pct: number | null
}

export interface TrackedTradeRequest {
  symbol: string
  trade_type: TradeType
  direction: TradeDirection
  entry_price: number
  target_price?: number
  stop_loss?: number
  quantity?: number
  expiration?: string
  strike?: number
  probability_at_entry?: number
  notes?: string
}

export interface TrackedTradeUpdate {
  status?: TradeStatus
  exit_price?: number
  notes?: string
}

export interface TradesSummary {
  total: number
  open: number
  closed: number
  win_rate: number
  total_pnl: number
}

export interface TrackedTradesResponse {
  trades: TrackedTrade[]
  summary: TradesSummary
}

export interface TradeScore {
  symbol: string
  score: number
  direction: 'bullish' | 'neutral' | 'bearish'
  components: {
    rsi?: number
    macd?: number
    momentum?: number
    iv?: number
  }
  computed_at: string
}

export interface UserProfile {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  preferredDte: 'monthly' | 'quarterly' | 'annual'
  maxPositionSize: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface PriceProjections {
  '2W': { bear: number; base: number; bull: number }
  '1M': { bear: number; base: number; bull: number }
  '3M': { bear: number; base: number; bull: number }
}

export interface ProjectionResult {
  symbol: string
  trade_type: string
  probability_of_success: number
  confidence: string
  ai_reasoning: string
  risk_reward_ratio: number
  suggested_position_size: string
  key_risks: string[]
  supporting_factors: string[]
  model_used: string
  price_projections?: PriceProjections
  directional_bias?: 'bullish' | 'neutral' | 'bearish'
}
