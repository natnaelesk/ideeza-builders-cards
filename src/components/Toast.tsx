import { useEffect } from 'react'
import './Toast.css'

export interface ToastProps {
  message: string | null
  onDismiss: () => void
  /** Auto-hide after ms (default 5200) */
  durationMs?: number
}

export function Toast({ message, onDismiss, durationMs = 5200 }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(onDismiss, durationMs)
    return () => window.clearTimeout(id)
  }, [message, durationMs, onDismiss])

  if (!message) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      <p className="toast__msg">{message}</p>
      <button type="button" className="toast__close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
