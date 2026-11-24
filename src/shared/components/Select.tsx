import type { SelectHTMLAttributes } from 'react'
import './SharedUi.css'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  id: string
  label: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  hint?: string
}

export function Select({
  id,
  label,
  options,
  placeholder,
  error,
  hint,
  className,
  ...selectProps
}: SelectProps) {
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
        {selectProps.required && <span aria-hidden="true"> *</span>}
      </label>
      <select
        {...selectProps}
        id={id}
        className={`form-control${error ? ' has-error' : ''} ${className ?? ''}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="form-field-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="form-field-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}
