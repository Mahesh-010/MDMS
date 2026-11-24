import { useId, type HTMLInputTypeAttribute } from 'react'
import './FormFields.css'

export interface InputProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  type?: HTMLInputTypeAttribute
  id?: string
  name?: string
  className?: string
  min?: number | string
  max?: number | string
  step?: number | string
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  type = 'text',
  id,
  name,
  className,
  min,
  max,
  step,
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className={`mdms-field ${className ?? ''}`}>
      <label className="mdms-field__label" htmlFor={inputId}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={inputId}
        name={name}
        className={`mdms-field__control ${error ? 'mdms-field__control--error' : ''}`}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <span id={errorId} className="mdms-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
