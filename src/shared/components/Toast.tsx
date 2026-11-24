import { useEffect } from 'react'
import './SharedUi.css'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  title: string
  message?: string
  variant?: ToastVariant
  onDismiss?: () => void
  durationMs?: number
}

export function Toast({
  title,
  message,
  variant = 'info',
  onDismiss,
  durationMs = 5000,
}: ToastProps) {
  useEffect(() => {
    if (!onDismiss || durationMs <= 0) return

    const timeoutId = window.setTimeout(onDismiss, durationMs)
    return () => window.clearTimeout(timeoutId)
  }, [durationMs, onDismiss])

  return (
    <div
      className={`ui-toast ui-toast--${variant}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <div className="ui-toast-copy">
        <strong>{title}</strong>
        {message && <p>{message}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="ui-toast-dismiss"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          ×
        </button>
      )}
    </div>
  )
}
