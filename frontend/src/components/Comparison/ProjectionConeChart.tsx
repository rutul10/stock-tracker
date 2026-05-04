import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ComparisonData } from '../../hooks/useComparison'
import { lastValue } from '../../hooks/useComparison'

interface Props {
  symbolA: string
  symbolB: string
  dataA: ComparisonData
  dataB: ComparisonData
}

const COLOR_A = '#00aaff'
const COLOR_B = '#ff8800'

interface ConePoint {
  label: string
  aBear: number | null
  aBase: number | null
  aBull: number | null
  bBear: number | null
  bBase: number | null
  bBull: number | null
}

function buildConeData(
  pricesA: { close: number }[],
  atrA: number | null,
  pricesB: { close: number }[],
  atrB: number | null
): ConePoint[] {
  const closeA = pricesA.length > 0 ? pricesA[pricesA.length - 1].close : null
  const closeB = pricesB.length > 0 ? pricesB[pricesB.length - 1].close : null

  const points: ConePoint[] = []

  for (const [idx, label] of (['Today', '+2W', '+4W'] as const).entries()) {
    const aBear =
      closeA !== null && atrA !== null ? closeA - atrA * 2 * idx : null
    const aBase = closeA !== null ? closeA : null
    const aBull =
      closeA !== null && atrA !== null ? closeA + atrA * 3 * idx : null

    const bBear =
      closeB !== null && atrB !== null ? closeB - atrB * 2 * idx : null
    const bBase = closeB !== null ? closeB : null
    const bBull =
      closeB !== null && atrB !== null ? closeB + atrB * 3 * idx : null

    points.push({ label, aBear, aBase, aBull, bBear, bBase, bBull })
  }

  return points
}

function Spinner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        gap: 10,
        fontFamily: 'var(--font-ui)',
        fontSize: 12,
        color: 'var(--text-muted)',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 16,
          height: 16,
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent-blue)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      Loading projection data…
    </div>
  )
}

function fmt(val: number | null): string {
  if (val === null) return '--'
  return val.toFixed(2)
}

export function ProjectionConeChart({ symbolA, symbolB, dataA, dataB }: Props) {
  const loading = dataA.loading || dataB.loading

  if (loading) {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Spinner />
      </>
    )
  }

  const indA = dataA.indicators
  const indB = dataB.indicators

  if (!indA || !indB) {
    return (
      <div
        style={{
          padding: 40,
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        Insufficient data to render projection cone.
      </div>
    )
  }

  const atrA = lastValue(indA.atr)
  const atrB = lastValue(indB.atr)
  const data = buildConeData(indA.prices, atrA, indB.prices, atrB)

  const allVals = data.flatMap((d) =>
    [d.aBear, d.aBase, d.aBull, d.bBear, d.bBase, d.bBull].filter((v): v is number => v !== null)
  )
  const yMin = allVals.length > 0 ? Math.floor(Math.min(...allVals) * 0.98) : 0
  const yMax = allVals.length > 0 ? Math.ceil(Math.max(...allVals) * 1.02) : 100

  const tooltipStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-primary)',
  }

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.1rem',
          letterSpacing: '0.1em',
          color: 'var(--text-primary)',
          marginBottom: 16,
        }}
      >
        PRICE PROJECTION CONE
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '20px 10px 10px',
          marginBottom: 20,
        }}
      >
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--text-muted)' }}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--text-muted)' }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `$${v.toFixed(2)}`} />
            <Legend
              wrapperStyle={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-muted)' }}
            />

            {/* Symbol A cone: bear→bull shaded range */}
            <Area
              type="monotone"
              dataKey="aBull"
              name={`${symbolA} Bull`}
              stroke={COLOR_A}
              fill={COLOR_A}
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="aBase"
              name={`${symbolA} Base`}
              stroke={COLOR_A}
              fill={COLOR_A}
              fillOpacity={0.08}
              strokeWidth={2}
              strokeDasharray="5 3"
            />
            <Area
              type="monotone"
              dataKey="aBear"
              name={`${symbolA} Bear`}
              stroke={COLOR_A}
              fill="var(--bg)"
              fillOpacity={1}
              strokeWidth={1}
              strokeDasharray="2 3"
            />

            {/* Symbol B cone */}
            <Area
              type="monotone"
              dataKey="bBull"
              name={`${symbolB} Bull`}
              stroke={COLOR_B}
              fill={COLOR_B}
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="bBase"
              name={`${symbolB} Base`}
              stroke={COLOR_B}
              fill={COLOR_B}
              fillOpacity={0.08}
              strokeWidth={2}
              strokeDasharray="5 3"
            />
            <Area
              type="monotone"
              dataKey="bBear"
              name={`${symbolB} Bear`}
              stroke={COLOR_B}
              fill="var(--bg)"
              fillOpacity={1}
              strokeWidth={1}
              strokeDasharray="2 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Data table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Horizon', `${symbolA} Bear`, `${symbolA} Base`, `${symbolA} Bull`, `${symbolB} Bear`, `${symbolB} Base`, `${symbolB} Bull`].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: '6px 10px',
                    textAlign: 'right',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 10,
                    letterSpacing: '0.07em',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.label}
              style={{
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <td style={{ padding: '6px 10px', color: 'var(--text-muted)', textAlign: 'right' }}>
                {row.label}
              </td>
              <td style={{ padding: '6px 10px', color: 'var(--accent-red)', textAlign: 'right' }}>
                {fmt(row.aBear)}
              </td>
              <td style={{ padding: '6px 10px', color: COLOR_A, textAlign: 'right' }}>
                {fmt(row.aBase)}
              </td>
              <td style={{ padding: '6px 10px', color: 'var(--accent-green)', textAlign: 'right' }}>
                {fmt(row.aBull)}
              </td>
              <td style={{ padding: '6px 10px', color: 'var(--accent-red)', textAlign: 'right' }}>
                {fmt(row.bBear)}
              </td>
              <td style={{ padding: '6px 10px', color: COLOR_B, textAlign: 'right' }}>
                {fmt(row.bBase)}
              </td>
              <td style={{ padding: '6px 10px', color: 'var(--accent-green)', textAlign: 'right' }}>
                {fmt(row.bBull)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
