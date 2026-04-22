import { useEffect, useState } from 'react'
import type { ProjectionResponse } from '../../api/types'
import { Badge } from '../shared/Badge'

interface ProbabilityCardProps {
  result: ProjectionResponse
}

function ProbBar({ value }: { value: number }) {
  const target = Math.round(value * 100)
  const [displayed, setDisplayed] = useState(0)
  const color = target >= 65 ? 'var(--accent-green)' : target >= 45 ? '#ffaa00' : 'var(--accent-red)'

  useEffect(() => {
    setDisplayed(0)
    let frame = 0
    const totalFrames = 40
    const timer = setInterval(() => {
      frame++
      setDisplayed(Math.round((frame / totalFrames) * target))
      if (frame >= totalFrames) clearInterval(timer)
    }, 15)
    return () => clearInterval(timer)
  }, [target])

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '3.5rem', color, lineHeight: 1, transition: 'color 0.3s' }}>
          {displayed}%
        </span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-muted)' }}>
          PROBABILITY OF SUCCESS
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${displayed}%`, background: color, transition: 'width 0.05s linear', borderRadius: 3 }} />
      </div>
    </div>
  )
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>
        {title}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-primary)' }}>
            <span style={{ color, flexShrink: 0, marginTop: 1 }}>▸</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ProbabilityCard({ result }: ProbabilityCardProps) {
  const confVariant = result.confidence === 'high' ? 'green' : result.confidence === 'medium' ? 'blue' : 'red'

  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
          {result.symbol} · {result.trade_type.replace('_', ' ').toUpperCase()}
        </span>
        <Badge label={result.confidence.toUpperCase()} variant={confVariant} />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {result.model_used}
        </span>
      </div>

      <ProbBar value={result.probability_of_success} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'var(--bg)', padding: '10px 14px', border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>RISK / REWARD</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: 'var(--accent-blue)' }}>
            1 : {result.risk_reward_ratio.toFixed(2)}
          </div>
        </div>
        <div style={{ background: 'var(--bg)', padding: '10px 14px', border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>POSITION SIZE</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--text-primary)' }}>
            {result.suggested_position_size}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>
          AI REASONING
        </div>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
          {result.ai_reasoning}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Section title="SUPPORTING FACTORS" items={result.supporting_factors} color="var(--accent-green)" />
        <Section title="KEY RISKS" items={result.key_risks} color="var(--accent-red)" />
      </div>
    </div>
  )
}
