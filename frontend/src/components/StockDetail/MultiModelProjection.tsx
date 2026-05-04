import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useAppStore } from '../../store'
import { useModels } from '../../hooks/useModels'
import type { DCFContext } from './DCFCalculator'
import type { StockDetail, NewsData } from '../../hooks/useStockDetail'
import type { ProjectionResult } from '../../api/types'
import { Spinner } from '../shared/Spinner'

interface ModelState {
  loading: boolean
  result: ProjectionResult | null
  error: string | null
  elapsed: number
}

interface Props {
  symbol: string
  detail: StockDetail | null
  news: NewsData | null
  dcfContext: DCFContext | null
  onProjectionComplete?: (result: ProjectionResult) => void
}

const TRADE_TYPES = ['stock', 'call', 'put', 'covered_call', 'cash_secured_put', 'spread'] as const
const DIRECTIONS = ['bullish', 'bearish', 'neutral'] as const

function ProbabilityBar({ value, confidence }: { value: number; confidence: string }) {
  const pct = Math.round(value * 100)
  const color = pct >= 65 ? 'var(--accent-green)' : pct >= 45 ? 'var(--accent-blue)' : 'var(--accent-red)'
  const confColor = confidence === 'high' ? 'var(--accent-green)' : confidence === 'medium' ? 'var(--accent-blue)' : 'var(--text-muted)'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color }}>{pct}%</span>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-ui)', color: confColor, alignSelf: 'center', border: `1px solid ${confColor}`, padding: '2px 6px', borderRadius: 2 }}>
          {confidence.toUpperCase()}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function ElapsedTimer({ running }: { running: boolean }) {
  const [elapsed, setElapsed] = useState(0)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (running) {
      setElapsed(0)
      ref.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } else {
      if (ref.current) clearInterval(ref.current)
    }
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [running])
  if (!running) return null
  return <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{elapsed}s</span>
}

export function MultiModelProjection({ symbol, detail, news, dcfContext, onProjectionComplete }: Props) {
  const { models } = useModels()
  const { selectedModels, setSelectedModels, autoAnalyze, setAutoAnalyze } = useAppStore()
  const [tradeType, setTradeType] = useState<string>('call')
  const [direction, setDirection] = useState<string>('bullish')
  const [modelStates, setModelStates] = useState<Record<string, ModelState>>({})
  const hasRun = useRef(false)

  // Reconcile selectedModels against available models on load
  useEffect(() => {
    if (models.length === 0) return
    const valid = selectedModels.filter((m) => models.includes(m))
    if (valid.length === 0) {
      setSelectedModels([models[0]])
    } else if (valid.length !== selectedModels.length) {
      setSelectedModels(valid)
    }
  }, [models]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto analyze on mount if toggled
  useEffect(() => {
    if (autoAnalyze && models.length > 0 && !hasRun.current) {
      hasRun.current = true
      runProjections()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnalyze, models])

  const activeModels = selectedModels.filter((m) => models.includes(m))

  async function runProjections() {
    if (activeModels.length === 0) return

    const newsHeadlines = news?.articles.slice(0, 5).map((a) => a.headline) ?? null
    const earningsContext = detail?.earnings ?? null

    const initStates: Record<string, ModelState> = {}
    activeModels.forEach((m) => { initStates[m] = { loading: true, result: null, error: null, elapsed: 0 } })
    setModelStates(initStates)

    activeModels.forEach((model) => {
      const startTime = Date.now()
      const timer = setInterval(() => {
        setModelStates((prev) => ({
          ...prev,
          [model]: { ...prev[model], elapsed: Math.floor((Date.now() - startTime) / 1000) },
        }))
      }, 1000)

      axios.post('/api/projection', {
        symbol,
        trade_type: tradeType,
        direction,
        model,
        news_context: newsHeadlines,
        earnings_context: earningsContext,
        dcf_context: dcfContext ? {
          cagr: dcfContext.cagr,
          margin_expansion: dcfContext.margin_expansion,
          terminal_growth: dcfContext.terminal_growth,
          wacc: dcfContext.wacc,
          intrinsic_value: dcfContext.intrinsic_value,
          upside_pct: dcfContext.upside_pct,
        } : null,
      })
        .then((res) => {
          clearInterval(timer)
          setModelStates((prev) => ({
            ...prev,
            [model]: { loading: false, result: res.data, error: null, elapsed: Math.floor((Date.now() - startTime) / 1000) },
          }))
          onProjectionComplete?.(res.data)
        })
        .catch((err) => {
          clearInterval(timer)
          setModelStates((prev) => ({
            ...prev,
            [model]: { loading: false, result: null, error: err.response?.data?.detail ?? 'Analysis failed', elapsed: 0 },
          }))
        })
    })
  }

  const ctrl: React.CSSProperties = {
    background: 'var(--bg)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    padding: '4px 8px',
    fontFamily: 'var(--font-ui)',
    fontSize: 11,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--nav-accent)', letterSpacing: '0.1em' }}>
          AI PROJECTION
        </span>
        <button
          onClick={() => setAutoAnalyze(!autoAnalyze)}
          style={{
            marginLeft: 'auto',
            background: autoAnalyze ? 'var(--nav-accent)' : 'none',
            border: '1px solid var(--border)',
            color: autoAnalyze ? 'var(--bg)' : 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            padding: '2px 8px',
            cursor: 'pointer',
            borderRadius: 2,
          }}
        >
          AUTO ▶
        </button>
      </div>

      {/* Model toggles */}
      {models.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>
          No Ollama models found. Start Ollama and pull a model.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>MODELS:</span>
          {models.map((m) => {
            const active = selectedModels.includes(m)
            return (
              <button
                key={m}
                onClick={() => {
                  setSelectedModels(active ? selectedModels.filter((x) => x !== m) : [...selectedModels, m])
                }}
                style={{
                  background: active ? 'rgba(0,170,255,0.15)' : 'none',
                  border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border)'}`,
                  color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  padding: '3px 10px',
                  cursor: 'pointer',
                  borderRadius: 2,
                }}
              >
                {m}
              </button>
            )
          })}
          <button
            onClick={() => setSelectedModels(models)}
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: 10, padding: '3px 8px', cursor: 'pointer' }}
          >
            SELECT ALL
          </button>
        </div>
      )}

      {/* Trade controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>TRADE</label>
        <select value={tradeType} onChange={(e) => setTradeType(e.target.value)} style={ctrl}>
          {TRADE_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>DIRECTION</label>
        <select value={direction} onChange={(e) => setDirection(e.target.value)} style={ctrl}>
          {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <button
          onClick={runProjections}
          disabled={activeModels.length === 0}
          style={{
            background: activeModels.length === 0 ? 'var(--border)' : 'var(--nav-accent)',
            color: activeModels.length === 0 ? 'var(--text-muted)' : 'var(--bg)',
            border: 'none',
            padding: '5px 16px',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: activeModels.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {activeModels.length === 0 ? 'SELECT A MODEL' : '▶ ANALYZE'}
        </button>
      </div>

      {/* Results */}
      {Object.keys(modelStates).length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(activeModels.length, 2)}, 1fr)`,
          gap: 12,
          marginTop: 4,
        }}>
          {activeModels.map((model) => {
            const state = modelStates[model]
            if (!state) return null
            return (
              <div key={model} style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-blue)', fontWeight: 700 }}>
                    {model.toUpperCase()}
                  </span>
                  <ElapsedTimer running={state.loading} />
                </div>

                {state.loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                    <Spinner />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Analyzing...</span>
                  </div>
                )}

                {state.error && (
                  <div style={{ color: 'var(--accent-red)', fontSize: 12, padding: '8px 0' }}>
                    {state.error}
                  </div>
                )}

                {state.result && (
                  <>
                    <ProbabilityBar value={state.result.probability_of_success} confidence={state.result.confidence} />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: '8px 0' }}>
                      {state.result.ai_reasoning}
                    </p>
                    {state.result.supporting_factors?.length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 10, color: 'var(--accent-green)', fontFamily: 'var(--font-ui)', marginBottom: 3 }}>SUPPORTING</div>
                        {state.result.supporting_factors.map((f, i) => (
                          <div key={i} style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 8 }}>+ {f}</div>
                        ))}
                      </div>
                    )}
                    {state.result.key_risks?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--accent-red)', fontFamily: 'var(--font-ui)', marginBottom: 3 }}>RISKS</div>
                        {state.result.key_risks.map((r, i) => (
                          <div key={i} style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 8 }}>− {r}</div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
                      R/R: {state.result.risk_reward_ratio?.toFixed(2)} · {state.result.suggested_position_size}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
