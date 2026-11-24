import './SharedUi.css'

export interface LoaderProps {
  label?: string
  size?: 'small' | 'medium' | 'large'
}

export function Loader({ label = 'Loading', size = 'medium' }: LoaderProps) {
  return (
    <div className={`ui-loader ui-loader--${size}`} role="status" aria-live="polite">
      <span className="ui-loader-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
