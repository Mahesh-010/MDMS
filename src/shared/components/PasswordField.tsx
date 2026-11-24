import { useState, type InputHTMLAttributes } from 'react'
import './SharedUi.css'

export interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  id: string
  label: string
  error?: string
  hint?: string
}

export function PasswordField({
  id,
  label,
  error,
  hint,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const describedBy = [
    hint ? `${id}-hint` : undefined,
    error ? `${id}-error` : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="form-field">
      <label className="form-field-label" htmlFor={id}>
        {label}
        {inputProps.required && <span aria-hidden="true"> *</span>}
      </label>
      <div className="password-field-control">
        <input
          {...inputProps}
          id={id}
          type={visible ? 'text' : 'password'}
          className={`form-control${error ? ' has-error' : ''} ${className ?? ''}`.trim()}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="password-field-toggle"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {hint && !error && <p className="form-field-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="form-field-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}
