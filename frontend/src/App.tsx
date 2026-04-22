import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useAppStore } from './store'
import { Screener } from './components/Screener/Screener'
import { OptionsChain } from './components/OptionsChain/OptionsChain'
import { Indicators } from './components/Indicators/Indicators'
import { Projector } from './components/Projector/Projector'
import { TradeTracker } from './components/Tracker/TradeTracker'
import { ErrorBoundary } from './components/shared/ErrorBoundary'

const TABS = [
  { id: 'screener', label: 'SCREENER', key: 'S' },
  { id: 'options', label: 'OPTIONS', key: 'O' },
  { id: 'indicators', label: 'CHART', key: 'C' },
  { id: 'projector', label: 'PROJECT', key: 'P' },
  { id: 'tracker', label: 'TRACK', key: 'T' },
] as const

type HealthStatus = 'ok' | 'error' | 'checking'

function StatusDot({ status }: { status: HealthStatus }) {
  const color = status === 'ok' ? 'var(--accent-green)' : status === 'error' ? 'var(--accent-red)' : 'var(--text-muted)'
  return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, marginRight: 4 }} />
}

function marketStatus(): { open: boolean; label: string } {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay()
  const hour = et.getHours()
  const min = et.getMinutes()
  const totalMin = hour * 60 + min
  const isWeekday = day >= 1 && day <= 5
  const isMarketHours = totalMin >= 9 * 60 + 30 && totalMin < 16 * 60
  const open = isWeekday && isMarketHours
  return { open, label: open ? 'MKT OPEN' : 'MKT CLOSED' }
}

// Refresh event bus — tabs listen to this to re-fetch
export const refreshBus = new EventTarget()

export default function App() {
  const { activeTab, setActiveTab } = useAppStore()
  const [apiStatus, setApiStatus] = useState<HealthStatus>('checking')
  const [ollamaStatus, setOllamaStatus] = useState<HealthStatus>('checking')
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const mkt = marketStatus()

  const checkHealth = useCallback(async () => {
    try {
      const res = await axios.get('/api/health')
      setApiStatus('ok')
      setOllamaStatus(res.data?.ollama === 'ok' ? 'ok' : 'error')
    } catch {
      setApiStatus('error')
      setOllamaStatus('error')
    }
    setLastRefresh(new Date().toLocaleTimeString())
  }, [])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [checkHealth])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const key = e.key.toUpperCase()
      const tab = TABS.find((t) => t.key === key)
      if (tab) { setActiveTab(tab.id); return }
      if (key === 'R') refreshBus.dispatchEvent(new Event('refresh'))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setActiveTab])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Status Bar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '3px 16px', display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
        <span style={{ color: mkt.open ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
          ● {mkt.label}
        </span>
        <span><StatusDot status={apiStatus} />API {apiStatus.toUpperCase()}</span>
        <span><StatusDot status={ollamaStatus} />OLLAMA {ollamaStatus.toUpperCase()}</span>
        {lastRefresh && <span>REFRESHED {lastRefresh}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 10 }}>S·O·C·P·T — switch tabs &nbsp;|&nbsp; R — refresh</span>
      </div>

      {/* Nav */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--accent-green)', letterSpacing: '0.1em', marginRight: 32, padding: '10px 0' }}>
          STRATEGY LAB
        </span>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-green)' : '2px solid transparent',
                color: isActive ? 'var(--accent-green)' : 'var(--text-muted)',
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.1em',
                padding: '12px 20px',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <ErrorBoundary key={activeTab}>
          {activeTab === 'screener' && <Screener />}
          {activeTab === 'options' && <OptionsChain />}
          {activeTab === 'indicators' && <Indicators />}
          {activeTab === 'projector' && <Projector />}
          {activeTab === 'tracker' && <TradeTracker />}
        </ErrorBoundary>
      </main>
    </div>
  )
}
