import { useAppStore } from '../../store'
import type { UserProfile } from '../../api/types'

interface UserProfileModalProps {
  isFirstLaunch: boolean
}

type RiskTolerance = UserProfile['riskTolerance']
type PreferredDte = UserProfile['preferredDte']

const RISK_OPTIONS: { value: RiskTolerance; label: string }[] = [
  { value: 'conservative', label: 'CONSERVATIVE' },
  { value: 'moderate', label: 'MODERATE' },
  { value: 'aggressive', label: 'AGGRESSIVE' },
]

const DTE_OPTIONS: { value: PreferredDte; label: string }[] = [
  { value: 'monthly', label: 'MONTHLY (30d)' },
  { value: 'quarterly', label: 'QUARTERLY (90d)' },
  { value: 'annual', label: 'ANNUAL (365d)' },
]

export function UserProfileModal({ isFirstLaunch }: UserProfileModalProps) {
  const { userProfile, setUserProfile, setProfileModalOpen } = useAppStore()

  function handleClose() {
    setProfileModalOpen(false)
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) handleClose()
  }

  const toggleBtn = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? 'var(--accent-green)' : 'var(--surface)',
    border: `1px solid ${isActive ? 'var(--accent-green)' : 'var(--border)'}`,
    color: isActive ? '#000' : 'var(--text-muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '6px 14px',
    cursor: 'pointer',
    borderRadius: 3,
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
  })

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '28px 32px',
          width: 480,
          maxWidth: '90vw',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close profile modal"
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 18,
            cursor: 'pointer',
            lineHeight: 1,
            padding: '2px 6px',
          }}
        >
          ×
        </button>

        {/* Title */}
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.6rem',
            color: 'var(--accent-green)',
            letterSpacing: '0.12em',
            margin: '0 0 4px',
          }}
        >
          MY TRADING PROFILE
        </h2>

        {/* Welcome message on first launch */}
        {isFirstLaunch && (
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              color: 'var(--text-muted)',
              margin: '0 0 24px',
            }}
          >
            Set your trading style to get personalized recommendations
          </p>
        )}

        <div style={{ marginTop: isFirstLaunch ? 0 : 20, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Risk Tolerance */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-ui)',
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}
            >
              RISK TOLERANCE
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {RISK_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setUserProfile({ riskTolerance: value })}
                  style={toggleBtn(userProfile.riskTolerance === value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred DTE */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-ui)',
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}
            >
              PREFERRED DTE
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DTE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setUserProfile({ preferredDte: value })}
                  style={toggleBtn(userProfile.preferredDte === value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Position Size */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-ui)',
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}
            >
              MAX POSITION SIZE
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <span
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRight: 'none',
                  borderRadius: '3px 0 0 3px',
                  padding: '6px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                $
              </span>
              <input
                type="text"
                value={userProfile.maxPositionSize}
                onChange={(e) => setUserProfile({ maxPositionSize: e.target.value })}
                placeholder="5,000"
                style={{
                  flex: 1,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '0 3px 3px 0',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  padding: '6px 10px',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
