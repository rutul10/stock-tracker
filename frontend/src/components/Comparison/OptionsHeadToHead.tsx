import type { ComparisonData } from '../../hooks/useComparison'
import { lastValue } from '../../hooks/useComparison'
import type { UserProfile } from '../../api/types'

interface Props {
  symbolA: string
  symbolB: string
  dataA: ComparisonData
  dataB: ComparisonData
  userProfile: UserProfile | null
}

const DTE_MAP: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  annual: 365,
}

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

interface OptionRec {
  label: string
  probOfProfit: number
  costPerContract: string
  breakEven: string
  maxLoss: string
  riskLevel: RiskLevel
}

function deriveRec(
  _symbol: string,
  data: ComparisonData,
  profile: UserProfile | null
): OptionRec | null {
  const ind = data.indicators
  const ts = data.tradeScore
  if (!ind || !ts) return null

  const prices = ind.prices
  const lastClose = prices.length > 0 ? prices[prices.length - 1].close : null
  const atr = lastValue(ind.atr)
  const iv = ts.components?.iv ?? 0.25

  if (lastClose === null) return null

  const direction = ts.direction
  const risk = profile?.riskTolerance ?? 'conservative'
  const dteKey = profile?.preferredDte ?? 'monthly'
  const dte = DTE_MAP[dteKey] ?? 30

  let label: string
  let riskLevel: RiskLevel

  if (direction === 'bullish' && risk === 'aggressive') {
    label = `${dte}DTE Call Option`
    riskLevel = 'HIGH'
  } else if (direction === 'bullish' && risk === 'moderate') {
    label = `${dte}DTE Covered Call`
    riskLevel = 'MEDIUM'
  } else if (direction === 'bearish' && risk === 'aggressive') {
    label = `${dte}DTE Put Option`
    riskLevel = 'HIGH'
  } else if (direction === 'bearish') {
    label = `${dte}DTE Cash-Secured Put`
    riskLevel = 'LOW'
  } else {
    label = `${dte}DTE Cash-Secured Put`
    riskLevel = 'LOW'
  }

  const probOfProfit = Math.min(95, Math.max(30, ts.score))

  const atmIv = Math.max(0.05, iv)
  const rawCost = atmIv * lastClose * 100 * Math.sqrt(dte / 365)
  const costPerContract = rawCost.toFixed(2)

  const premium = rawCost / 100
  const breakEvenPrice =
    direction === 'bearish'
      ? (lastClose - premium).toFixed(2)
      : (lastClose + premium).toFixed(2)

  const maxLossEstimate =
    riskLevel === 'HIGH'
      ? `$${(rawCost).toFixed(2)} (full premium)`
      : atr !== null
      ? `$${(atr * 2 * 100).toFixed(0)} (est. 2×ATR)`
      : 'Varies'

  return {
    label,
    probOfProfit,
    costPerContract: `$${costPerContract}`,
    breakEven: `$${breakEvenPrice}`,
    maxLoss: maxLossEstimate,
    riskLevel,
  }
}

function riskColor(level: RiskLevel): string {
  if (level === 'LOW') return 'var(--accent-green)'
  if (level === 'MEDIUM') return '#ff8800'
  return 'var(--accent-red)'
}

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 3,
        border: `1px solid ${riskColor(level)}`,
        color: riskColor(level),
        fontFamily: 'var(--font-ui)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
      }}
    >
      {level}
    </span>
  )
}

interface ColumnProps {
  symbol: string
  data: ComparisonData
  profile: UserProfile | null
  accentColor: string
  isSaferPick: boolean
}

function OptionsColumn({ symbol, data, profile, accentColor, isSaferPick }: ColumnProps) {
  if (data.loading) {
    return (
      <div
        style={{
          flex: 1,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          minHeight: 260,
          fontFamily: 'var(--font-ui)',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent-blue)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}
        />
        Loading {symbol}…
      </div>
    )
  }

  const rec = deriveRec(symbol, data, profile)

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-ui)',
    fontSize: 10,
    color: 'var(--text-muted)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    marginBottom: 2,
    marginTop: 12,
  }

  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    color: 'var(--text-primary)',
  }

  return (
    <div
      style={{
        flex: 1,
        background: 'var(--surface)',
        border: `1px solid ${accentColor}44`,
        borderRadius: 6,
        padding: 20,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.4rem',
            letterSpacing: '0.1em',
            color: accentColor,
          }}
        >
          {symbol}
        </div>
        {isSaferPick && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 3,
              background: 'rgba(0,255,136,0.12)',
              border: '1px solid var(--accent-green)',
              color: 'var(--accent-green)',
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
            }}
          >
            SAFER PICK
          </span>
        )}
      </div>

      {!rec ? (
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            color: 'var(--text-muted)',
            padding: '20px 0',
          }}
        >
          Insufficient data to generate recommendation.
        </div>
      ) : (
        <>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1rem',
              letterSpacing: '0.07em',
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            {rec.label}
          </div>

          <div style={labelStyle}>Probability of Profit</div>
          <div
            style={{
              ...valueStyle,
              color: rec.probOfProfit >= 60 ? 'var(--accent-green)' : rec.probOfProfit >= 45 ? '#ff8800' : 'var(--accent-red)',
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {rec.probOfProfit.toFixed(0)}%
          </div>

          <div style={labelStyle}>Cost / Contract</div>
          <div style={valueStyle}>{rec.costPerContract}</div>

          <div style={labelStyle}>Break-Even</div>
          <div style={valueStyle}>{rec.breakEven}</div>

          <div style={labelStyle}>Max Loss Est.</div>
          <div style={{ ...valueStyle, color: 'var(--accent-red)' }}>{rec.maxLoss}</div>

          <div style={labelStyle}>Risk Level</div>
          <div style={{ marginTop: 4 }}>
            <RiskBadge level={rec.riskLevel} />
          </div>
        </>
      )}
    </div>
  )
}

export function OptionsHeadToHead({ symbolA, symbolB, dataA, dataB, userProfile }: Props) {
  const scoreA = dataA.tradeScore?.score ?? 0
  const scoreB = dataB.tradeScore?.score ?? 0
  const saferIsA = scoreA >= scoreB

  const dteKey = userProfile?.preferredDte ?? 'monthly'
  const dte = DTE_MAP[dteKey] ?? 30

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.1rem',
            letterSpacing: '0.1em',
            color: 'var(--text-primary)',
          }}
        >
          OPTIONS HEAD-TO-HEAD
        </div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
          }}
        >
          DTE: {dte} &nbsp;|&nbsp; Profile: {userProfile?.riskTolerance ?? 'conservative'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <OptionsColumn
          symbol={symbolA}
          data={dataA}
          profile={userProfile}
          accentColor="#00aaff"
          isSaferPick={saferIsA}
        />
        <OptionsColumn
          symbol={symbolB}
          data={dataB}
          profile={userProfile}
          accentColor="#ff8800"
          isSaferPick={!saferIsA}
        />
      </div>

      <div
        style={{
          marginTop: 20,
          padding: '12px 16px',
          background: 'rgba(0,170,255,0.06)',
          border: '1px solid rgba(0,170,255,0.2)',
          borderRadius: 6,
          fontFamily: 'var(--font-ui)',
          fontSize: 11,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        Cost estimates are derived from ATM implied volatility × strike × √(DTE/365). Probability
        of profit is proxied from the trade score. Always verify with your broker before trading.
      </div>
    </div>
  )
}
