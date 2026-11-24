import type { InputHTMLAttributes } from 'react'
import './SharedUi.css'

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  id: string
  label: string
  description?: string
  error?: string
}

export function Toggle({
  id,
  label,
  description,
  error,
  ...inputProps
}: ToggleProps) {
  return (
    <div className="form-field">
      <label className="form-toggle" htmlFor={id}>
        <input
          {...inputProps}
          id={id}
          type="checkbox"
          role="switch"
          aria-invalid={Boolean(error)}
          aria-describedby={
            [description ? `${id}-description` : undefined, error ? `${id}-error` : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          }
        />
        <span className="form-toggle-track" aria-hidden="true">
          <span className="form-toggle-thumb" />
        </span>
        <span className="form-toggle-copy">
          <span className="form-field-label">{label}</span>
          {description && (
            <span className="form-field-hint" id={`${id}-description`}>
              {description}
            </span>
          )}
        </span>
      </label>
      {error && <p className="form-field-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}
