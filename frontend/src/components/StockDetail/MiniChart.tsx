import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Spinner } from '../shared/Spinner'

type Period = '1W' | '1M' | '3M'
const PERIOD_MAP: Record<Period, string> = { '1W': '5d', '1M': '1mo', '3M': '3mo' }

interface PricePoint {
  date: string
  close: number
}

interface Props {
  symbol: string
}

export function MiniChart({ symbol }: Props) {
  const [period, setPeriod] = useState<Period>('1M')
  const [data, setData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    axios.get(`/api/indicators/${symbol}`, { params: { period: PERIOD_MAP[period] } })
      .then((res) => {
        if (cancelled) return
        const prices: PricePoint[] = (res.data.prices || []).map((p: { date: string; close: number }) => ({
          date: p.date,
          close: p.close,
        }))
        setData(prices)
      })
      .catch(() => { if (!cancelled) setData([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [symbol, period])

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--nav-accent)' : 'none',
    border: '1px solid var(--border)',
    borderRadius: 3,
    color: active ? '#000' : 'var(--text-muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    cursor: 'pointer',
  })

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.75rem', color: 'var(--nav-accent)', letterSpacing: '0.1em' }}>PRICE</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['1W', '1M', '3M'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={btnStyle(period === p)}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>
      ) : data.length === 0 ? (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 11 }}>No price data</div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickFormatter={(d: string) => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}` }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} width={50} tickFormatter={(v: number) => `$${v.toFixed(0)}`} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              labelFormatter={(d: string) => new Date(d).toLocaleDateString()}
              formatter={(v: number) => [`$${v.toFixed(2)}`, 'Close']}
            />
            <Line type="monotone" dataKey="close" stroke="var(--accent-green)" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
