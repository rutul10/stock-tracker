/**
 * ComparisonView — full-screen overlay for comparing two stocks.
 *
 * IMPORTANT: This component needs to be imported and rendered in App.tsx.
 * Add the following to App.tsx:
 *
 *   import { ComparisonView } from './components/Comparison/ComparisonView'
 *
 * And place <ComparisonView /> anywhere inside the JSX tree (e.g. after the main
 * content), at the top level of the returned fragment. It renders null on its own
 * when no compareSymbols are set in the store.
 */

import { useEffect, useState } from 'react'
import { useAppStore } from '../../store'
import { useComparison } from '../../hooks/useComparison'
import { VerdictPanel } from './VerdictPanel'
import { ProjectionConeChart } from './ProjectionConeChart'
import { IndicatorBreakdown } from './IndicatorBreakdown'
import { OptionsHeadToHead } from './OptionsHeadToHead'

type ComparisonTab = 'VERDICT' | 'PROJECTION' | 'BREAKDOWN' | 'OPTIONS'

const TABS: ComparisonTab[] = ['VERDICT', 'PROJECTION', 'BREAKDOWN', 'OPTIONS']

export function ComparisonView() {
  const { compareSymbols, clearCompareSymbols, userProfile } = useAppStore()
  const [activeTab, setActiveTab] = useState<ComparisonTab>('VERDICT')

  const symbolA = compareSymbols?.[0] ?? ''
  const symbolB = compareSymbols?.[1] ?? ''

  const { dataA, dataB } = useComparison(symbolA, symbolB)

  // Reset to VERDICT tab whenever a new comparison pair is set
  useEffect(() => {
    if (compareSymbols) setActiveTab('VERDICT')
  }, [compareSymbols])

  // Close on ESC
  useEffect(() => {
    if (!compareSymbols) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearCompareSymbols()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [compareSymbols, clearCompareSymbols])

  if (!compareSymbols) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.5rem',
            letterSpacing: '0.12em',
            color: 'var(--accent-blue)',
            margin: 0,
          }}
        >
          COMPARING{' '}
          <span style={{ color: 'var(--accent-green)' }}>{symbolA}</span>
          {' '}vs{' '}
          <span style={{ color: '#ff8800' }}>{symbolB}</span>
        </h2>

        <button
          onClick={clearCompareSymbols}
          aria-label="Close comparison"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px 10px',
            lineHeight: 1,
            fontFamily: 'var(--font-ui)',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget
            btn.style.color = 'var(--accent-red)'
            btn.style.borderColor = 'var(--accent-red)'
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget
            btn.style.color = 'var(--text-muted)'
            btn.style.borderColor = 'var(--border)'
          }}
        >
          ×
        </button>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: '0 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? '2px solid var(--nav-accent)'
                  : '2px solid transparent',
                color: isActive ? 'var(--nav-accent)' : 'var(--text-muted)',
                fontFamily: 'var(--font-ui)',
                fontSize: 11,
                letterSpacing: '0.1em',
                padding: '10px 18px 8px',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 400,
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* ── Content area ───────────────────────────────────────────────────── */}
      <div
        className="scrollbar-thin"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
        }}
      >
        {activeTab === 'VERDICT' && (
          <VerdictPanel
            symbolA={symbolA}
            symbolB={symbolB}
            dataA={dataA}
            dataB={dataB}
          />
        )}
        {activeTab === 'PROJECTION' && (
          <ProjectionConeChart
            symbolA={symbolA}
            symbolB={symbolB}
            dataA={dataA}
            dataB={dataB}
          />
        )}
        {activeTab === 'BREAKDOWN' && (
          <IndicatorBreakdown
            symbolA={symbolA}
            symbolB={symbolB}
            dataA={dataA}
            dataB={dataB}
          />
        )}
        {activeTab === 'OPTIONS' && (
          <OptionsHeadToHead
            symbolA={symbolA}
            symbolB={symbolB}
            dataA={dataA}
            dataB={dataB}
            userProfile={userProfile}
          />
        )}
      </div>
    </div>
  )
}
