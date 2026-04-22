interface ErrorBannerProps {
  message: string
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="px-4 py-3 text-sm font-mono"
      style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }}
    >
      {message}
    </div>
  )
}
