import './StatusBadge.css'

export type StandardStatus =
  | 'Active'
  | 'Deactivated'
  | 'Pending'
  | 'Paid'
  | 'Overdue'

export interface StatusBadgeProps {
  status: StandardStatus | (string & {})
  className?: string
  label?: string
}

export function StatusBadge({ status, className, label }: StatusBadgeProps) {
  const normalized = status.trim().toLowerCase()
  return (
    <span
      className={`mdms-status-badge mdms-status-badge--${normalized.replace(/\s+/g, '-')} ${className ?? ''}`}
    >
      {label ?? status}
    </span>
  )
}
