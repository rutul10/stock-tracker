export function Spinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent-blue)' }}
      />
    </div>
  )
}
