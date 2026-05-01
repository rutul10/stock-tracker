import { useMemo, useState } from 'react'

interface DCFInputs {
  cagr: number
  marginExpansion: number
  terminalGrowth: number
  wacc: number
}

export interface DCFContext {
  cagr: number
  margin_expansion: number
  terminal_growth: number
  wacc: number
  intrinsic_value: number | null
  upside_pct: number | null
}

interface Props {
  fcf0: number | null
  sharesOutstanding: number | null
  currentPrice: number | null
  onDCFChange?: (ctx: DCFContext) => void
}

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
          {unit === '%' ? `${value}%` : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--nav-accent)', cursor: 'pointer' }}
      />
    </div>
  )
}

export function DCFCalculator({ fcf0, sharesOutstanding, currentPrice, onDCFChange }: Props) {
  const [inputs, setInputs] = useState<DCFInputs>({ cagr: 10, marginExpansion: 1, terminalGrowth: 3, wacc: 10 })

  const result = useMemo(() => {
    if (!fcf0 || !sharesOutstanding || sharesOutstanding <= 0) return null
    const { cagr, marginExpansion, terminalGrowth, wacc } = inputs
    const c = cagr / 100
    const me = marginExpansion / 100
    const tgr = terminalGrowth / 100
    const w = wacc / 100
    if (w <= tgr) return null

    let pv = 0
    let fcfPrev = fcf0
    for (let n = 1; n <= 5; n++) {
      const fcfN = fcfPrev * (1 + c) * (1 + me / 5)
      pv += fcfN / Math.pow(1 + w, n)
      fcfPrev = fcfN
    }
    const tv = fcfPrev * (1 + tgr) / (w - tgr)
    pv += tv / Math.pow(1 + w, 5)

    const ivPerShare = pv / sharesOutstanding
    return Math.round(ivPerShare * 100) / 100
  }, [inputs, fcf0, sharesOutstanding])

  const upside = result != null && currentPrice && currentPrice > 0
    ? Math.round((result - currentPrice) / currentPrice * 1000) / 10
    : null

  const ctx: DCFContext = {
    cagr: inputs.cagr,
    margin_expansion: inputs.marginExpansion,
    terminal_growth: inputs.terminalGrowth,
    wacc: inputs.wacc,
    intrinsic_value: result,
    upside_pct: upside,
  }

  function update(key: keyof DCFInputs, val: number) {
    const next = { ...inputs, [key]: val }
    setInputs(next)
    onDCFChange?.({ ...ctx, [key === 'marginExpansion' ? 'margin_expansion' : key === 'terminalGrowth' ? 'terminal_growth' : key]: val })
  }

  const noData = !fcf0 || !sharesOutstanding

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--nav-accent)', letterSpacing: '0.1em', marginBottom: 10 }}>
        DCF VALUATION
      </div>

      {noData ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' }}>
          Insufficient financial data for DCF (FCF not available)
        </div>
      ) : (
        <>
          <Slider label="Revenue CAGR (5yr)" value={inputs.cagr} min={0} max={30} step={0.5} unit="%" onChange={(v) => update('cagr', v)} />
          <Slider label="Margin Expansion" value={inputs.marginExpansion} min={0} max={10} step={0.5} unit="%" onChange={(v) => update('marginExpansion', v)} />
          <Slider label="Terminal Growth Rate" value={inputs.terminalGrowth} min={0} max={6} step={0.25} unit="%" onChange={(v) => update('terminalGrowth', v)} />
          <Slider label="WACC" value={inputs.wacc} min={6} max={20} step={0.5} unit="%" onChange={(v) => update('wacc', v)} />

          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>INTRINSIC VALUE</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--text-primary)', fontWeight: 700 }}>
                {result != null ? `$${result.toFixed(2)}` : '—'}
              </span>
            </div>
            {upside != null && currentPrice != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
                  Current ${currentPrice.toFixed(2)}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: upside > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                }}>
                  {upside > 0 ? '+' : ''}{upside}% {upside > 0 ? 'upside' : 'downside'}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
