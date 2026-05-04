import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, ProjectionResult, UserProfile } from '../../api/types'

interface Props {
  symbol: string
  projectionResult: ProjectionResult | null
  userProfile: UserProfile
}

const DTE_MAP: Record<UserProfile['preferredDte'], number> = {
  monthly: 30,
  quarterly: 90,
  annual: 365,
}

export function ProjectionChat({ symbol, projectionResult, userProfile }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const userText = (text ?? input).trim()
    if (!userText || streaming) return
    setInput('')
    setStreamError(null)

    const userMsg: ChatMessage = { role: 'user', content: userText }
    const assistantMsg: ChatMessage = { role: 'assistant', content: '' }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    const context = projectionResult
      ? {
          price: projectionResult.symbol,
          probability: Math.round(projectionResult.probability_of_success * 100),
          direction: projectionResult.directional_bias ?? 'neutral',
          key_risks: projectionResult.key_risks,
          supporting_factors: projectionResult.supporting_factors,
        }
      : {}

    const historyToSend = [...messages.slice(-10), userMsg]

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch('/api/projection/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          symbol,
          context,
          user_profile: {
            risk_tolerance: userProfile.riskTolerance,
            preferred_dte: DTE_MAP[userProfile.preferredDte],
            max_position_size: userProfile.maxPositionSize,
          },
          messages: historyToSend,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`Server error: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          const data = part.slice(6)
          if (data === '[DONE]' || data === '[ERROR]') continue
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: last.content + data }
            }
            return next
          })
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setStreamError((err as Error).message ?? 'Stream failed')
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  function handleRetry() {
    setStreamError(null)
    setMessages((prev) => prev.slice(0, -1))
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUser) sendMessage(lastUser.content)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 420 }}>
      {messages.length > 10 && (
        <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
          Older messages not included in AI context
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-ui)', textAlign: 'center', paddingTop: 32 }}>
            Ask about {symbol} — strategy, risk, timing, position sizing...
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          const isLastAssistant = !isUser && i === messages.length - 1
          const showCursor = isLastAssistant && streaming

          return (
            <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '78%',
                  padding: '8px 12px',
                  borderRadius: 3,
                  fontFamily: isUser ? 'var(--font-ui)' : 'var(--font-mono)',
                  fontSize: 12,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: isUser ? 'rgba(0,170,255,0.15)' : 'var(--surface)',
                  border: `1px solid ${isUser ? 'var(--accent-blue)' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                }}
              >
                {msg.content || (showCursor ? '' : <span style={{ color: 'var(--text-muted)' }}>...</span>)}
                {showCursor && (
                  <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--accent-blue)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
                )}
                {!isUser && isLastAssistant && streamError && (
                  <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                    <span style={{ color: 'var(--accent-red)', fontSize: 11 }}>Stream error: {streamError}</span>
                    <button
                      onClick={handleRetry}
                      style={{ marginLeft: 10, background: 'none', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', fontFamily: 'var(--font-ui)', fontSize: 10, padding: '2px 8px', cursor: 'pointer' }}
                    >
                      RETRY
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Ask about this trade..."
          disabled={streaming}
          style={{
            flex: 1,
            background: 'var(--bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            padding: '6px 10px',
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            outline: 'none',
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={streaming || !input.trim()}
          style={{
            background: streaming || !input.trim() ? 'var(--border)' : 'var(--accent-blue)',
            color: streaming || !input.trim() ? 'var(--text-muted)' : '#000',
            border: 'none',
            padding: '6px 14px',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          SEND
        </button>
      </div>

      <style>{`@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </div>
  )
}
