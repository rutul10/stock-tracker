interface BadgeProps {
  label: string
  variant?: 'green' | 'red' | 'blue' | 'muted'
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, React.CSSProperties> = {
  green: { background: 'rgba(0,255,136,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(0,255,136,0.3)' },
  red: { background: 'rgba(255,51,102,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255,51,102,0.3)' },
  blue: { background: 'rgba(0,170,255,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(0,170,255,0.3)' },
  muted: { background: 'rgba(107,107,138,0.1)', color: 'var(--text-muted)', border: '1px solid rgba(107,107,138,0.3)' },
}

export function Badge({ label, variant = 'muted' }: BadgeProps) {
  return (
    <span
      className="inline-block px-2 py-0.5 text-xs font-mono uppercase tracking-wider rounded"
      style={variantStyles[variant]}
    >
      {label}
    </span>
  )
}
