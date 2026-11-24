import { useId, type ReactNode } from 'react'
import './SharedUi.css'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  const titleId = useId()

  return (
    <section className="empty-state" aria-labelledby={titleId}>
      {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
      <h2 id={titleId}>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </section>
  )
}
