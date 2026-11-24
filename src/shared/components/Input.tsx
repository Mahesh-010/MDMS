import type { InputHTMLAttributes } from 'react'
import './SharedUi.css'

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  id: string
  label: string
  type?: 'text' | 'email' | 'number' | 'tel' | 'url' | 'search'
  error?: string
  hint?: string
}

export function Input({ id, label, type = 'text', error, hint, ...inputProps }: InputProps) {
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
      <input
        {...inputProps}
        id={id}
        type={type}
        className={`form-control${error ? ' has-error' : ''} ${inputProps.className ?? ''}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {hint && !error && <p className="form-field-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="form-field-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}
