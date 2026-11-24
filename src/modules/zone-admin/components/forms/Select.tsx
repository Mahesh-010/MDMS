import { useId } from 'react'
import './FormFields.css'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  label: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  id?: string
  name?: string
  className?: string
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  id,
  name,
  className,
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`

  return (
    <div className={`mdms-field ${className ?? ''}`}>
      <label className="mdms-field__label" htmlFor={selectId}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <select
        id={selectId}
        name={name}
        className={`mdms-field__control ${error ? 'mdms-field__control--error' : ''}`}
        value={value}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={errorId} className="mdms-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
