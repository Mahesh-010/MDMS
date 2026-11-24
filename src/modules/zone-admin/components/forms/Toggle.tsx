import { useId } from 'react'
import './FormFields.css'

export interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  name?: string
  className?: string
  description?: string
}

export function Toggle({
  label,
  checked,
  onChange,
  disabled,
  id,
  name,
  className,
  description,
}: ToggleProps) {
  const generatedId = useId()
  const toggleId = id ?? generatedId

  return (
    <div className={`mdms-toggle ${className ?? ''}`}>
      <div className="mdms-toggle__text">
        <label className="mdms-toggle__label" htmlFor={toggleId}>
          {label}
        </label>
        {description && (
          <span className="mdms-toggle__description">{description}</span>
        )}
      </div>
      <input
        id={toggleId}
        name={name}
        className="mdms-toggle__input"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  )
}
