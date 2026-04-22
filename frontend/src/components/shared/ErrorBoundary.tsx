import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error)
    return { hasError: true, message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--accent-red)', letterSpacing: '0.1em', marginBottom: 12 }}>
            COMPONENT ERROR
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, maxWidth: 480, margin: '0 auto 16px' }}>
            {this.state.message}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            style={{ background: 'var(--accent-blue)', color: '#000', border: 'none', padding: '6px 20px', fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em' }}
          >
            RETRY
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
