import { useEffect, useState } from 'react'
import { useOptions } from '../../hooks/useOptions'
import { useAppStore } from '../../store'
import { Spinner } from '../shared/Spinner'
import { ErrorBanner } from '../shared/ErrorBanner'
import { OptionsTable } from './OptionsTable'

export function OptionsChain() {
  const { data, loading, error, fetchOptions } = useOptions()
  const { selectedSymbol } = useAppStore()
  const [inputSymbol, setInputSymbol] = useState('')
  const [selectedExp, setSelectedExp] = useState('')

  useEffect(() => {
    if (selectedSymbol) {
      setInputSymbol(selectedSymbol)
      fetchOptions(selectedSymbol)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol])

  useEffect(() => {
    if (data?.expirations?.length) {
      setSelectedExp(data.expirations[0])
    }
  }, [data])

  function handleFetch() {
    const sym = inputSymbol.trim().toUpperCase()
    if (sym) fetchOptions(sym, selectedExp || undefined)
  }

  function handleExpChange(exp: string) {
    setSelectedExp(exp)
    const sym = (data?.symbol || inputSymbol).toUpperCase()
    if (sym) fetchOptions(sym, exp)
  }

  const currentPrice = data?.calls.find((c) => c.in_the_money)?.strike ?? undefined

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--accent-blue)', letterSpacing: '0.1em', margin: 0 }}>
          OPTIONS CHAIN
        </h2>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <input
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            placeholder="SYMBOL"
            style={{ width: 90, background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.05em' }}
          />

          {data?.expirations?.length ? (
            <select
              value={selectedExp}
              onChange={(e) => handleExpChange(e.target.value)}
              style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '4px 8px', fontFamily: 'var(--font-ui)', fontSize: 11 }}
            >
              {data.expirations.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          ) : null}

          <button
            onClick={handleFetch}
            disabled={loading}
            style={{ background: loading ? 'var(--border)' : 'var(--accent-blue)', color: '#000', border: 'none', padding: '5px 14px', fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'LOADING...' : 'LOAD'}
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading && !data ? (
        <Spinner />
      ) : data ? (
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 12 }}>
            {data.symbol} · {selectedExp} · {data.calls.length} calls / {data.puts.length} puts
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', color: 'var(--accent-green)', fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
                CALLS
              </div>
              <OptionsTable contracts={data.calls} type="call" currentPrice={currentPrice} />
            </div>

            <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', color: 'var(--accent-red)', fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
                PUTS
              </div>
              <OptionsTable contracts={data.puts} type="put" currentPrice={currentPrice} />
            </div>
          </div>
        </div>
      ) : (
        !loading && (
          <div style={{ color: 'var(--text-muted)', padding: '32px', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 12 }}>
            Enter a symbol and click LOAD, or select a stock in the Screener tab
          </div>
        )
      )}
    </div>
  )
}
