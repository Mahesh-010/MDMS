import './SharedUi.css'

export type StatusBadgeStatus =
  | 'Active'
  | 'Deactivated'
  | 'Pending'
  | 'Paid'
  | 'Overdue'
  | 'Critical'
  | 'Warning'

export interface StatusBadgeProps {
  status: StatusBadgeStatus
  className?: string
}

const statusClassNames: Record<StatusBadgeStatus, string> = {
  Active: 'status-badge--active',
  Deactivated: 'status-badge--deactivated',
  Pending: 'status-badge--pending',
  Paid: 'status-badge--paid',
  Overdue: 'status-badge--overdue',
  Critical: 'status-badge--critical',
  Warning: 'status-badge--warning',
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const classes = ['status-badge', statusClassNames[status], className]
    .filter(Boolean)
    .join(' ')

  return <span className={classes}>{status}</span>
}
