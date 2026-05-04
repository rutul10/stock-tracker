import { useState, useRef } from 'react'
import { StockCard } from './StockCard'

interface WatchboardListProps {
  title: string
  symbols: string[]
  onOpenDetail: (symbol: string) => void
  onRemove: (symbol: string) => void
  onAdd: (symbol: string) => void
  /** Symbols the user personally added (can be removed). Default symbols cannot be removed. */
  removableSymbols: string[]
}

export function WatchboardList({
  title,
  symbols,
  onOpenDetail,
  onRemove,
  onAdd,
  removableSymbols,
}: WatchboardListProps) {
  const [inputValue, setInputValue] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const SYMBOL_RE = /^[A-Za-z]{1,10}$/

  function handleAdd() {
    const trimmed = inputValue.trim().toUpperCase()
    if (!trimmed) return

    if (!SYMBOL_RE.test(trimmed)) {
      setValidationError('Symbol must be 1–10 alphabetic characters')
      return
    }

    if (symbols.includes(trimmed)) {
      setValidationError(`${trimmed} is already in this list`)
      return
    }

    onAdd(trimmed)
    setInputValue('')
    setValidationError(null)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    } else if (e.key === 'Escape') {
      setInputValue('')
      setValidationError(null)
    } else {
      setValidationError(null)
    }
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 20,
            color: 'var(--text-primary)',
            letterSpacing: '0.06em',
            margin: 0,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-muted)',
            background: 'var(--border)',
            borderRadius: 10,
            padding: '1px 8px',
          }}
        >
          {symbols.length}
        </span>
      </div>

      {/* Card grid */}
      {symbols.length === 0 ? (
        <div
          style={{
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            padding: '24px 0',
            textAlign: 'center',
          }}
        >
          No symbols in this list. Add one below.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {symbols.map((sym) => (
            <StockCard
              key={sym}
              symbol={sym}
              onOpenDetail={onOpenDetail}
              onRemove={onRemove}
              canRemove={removableSymbols.includes(sym)}
            />
          ))}
        </div>
      )}

      {/* Add symbol input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="+ Add symbol (e.g. MSFT)"
            maxLength={10}
            style={{
              flex: 1,
              background: 'var(--bg)',
              border: `1px solid ${validationError ? 'var(--accent-red)' : 'var(--border)'}`,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              padding: '6px 10px',
              borderRadius: 4,
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => {
              if (!validationError) e.currentTarget.style.borderColor = 'var(--accent-blue)'
            }}
            onBlur={(e) => {
              if (!validationError) e.currentTarget.style.borderColor = 'var(--border)'
            }}
          />
          <button
            onClick={handleAdd}
            style={{
              background: 'rgba(0,170,255,0.1)',
              border: '1px solid var(--accent-blue)',
              color: 'var(--accent-blue)',
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              padding: '6px 14px',
              borderRadius: 4,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,170,255,0.2)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,170,255,0.1)' }}
          >
            ADD
          </button>
        </div>
        {validationError && (
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              color: 'var(--accent-red)',
              paddingLeft: 2,
            }}
          >
            {validationError}
          </span>
        )}
      </div>
    </div>
  )
}
